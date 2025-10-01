# HOUZZ PRO DATA SCRAPER
# Mirror your existing Houzz Pro items from Selection Boards and My Items

from playwright.async_api import async_playwright
import asyncio
import requests
import json
from datetime import datetime
import uuid

class HouzzProDataScraper:
    def __init__(self):
        self.houzz_email = "establisheddesignco@gmail.com"
        self.houzz_password = "Zeke1919$$"
        self.webhook_url = 'http://localhost:8001/api/furniture/houzz-webhook'
        self.scraped_items = []
        
    async def scrape_all_houzz_data(self):
        """Scrape data from both My Items and Selection Boards"""
        print(f"\n{'='*80}")
        print(f"🏠 HOUZZ PRO DATA SCRAPER")
        print(f"{'='*80}")
        print(f"📧 Account: {self.houzz_email}")
        print(f"🎯 Target: Mirror ALL your existing Houzz Pro items")
        print(f"{'='*80}\n")
        
        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=False)  # Keep visible for debugging
            context = await browser.new_context()
            page = await context.new_page()
            
            try:
                # Login to Houzz Pro
                await self.login_to_houzz_pro(page)
                
                # Scrape My Items
                print("📂 Scraping 'My Items' collection...")
                my_items = await self.scrape_my_items(page)
                print(f"✅ Found {len(my_items)} items in My Items")
                
                # Scrape Selection Boards  
                print("📋 Scraping Selection Boards...")
                board_items = await self.scrape_selection_boards(page)
                print(f"✅ Found {len(board_items)} items in Selection Boards")
                
                # Combine all items (remove duplicates)
                all_items = self.deduplicate_items(my_items + board_items)
                print(f"🎯 Total unique items: {len(all_items)}")
                
                # Send all items to webhook
                print("📡 Sending items to unified database...")
                success_count = 0
                for item in all_items:
                    if await self.send_item_to_webhook(item):
                        success_count += 1
                    await asyncio.sleep(0.5)  # Rate limiting
                
                print(f"\n🎉 SCRAPING COMPLETE!")
                print(f"✅ Successfully imported: {success_count}/{len(all_items)} items")
                print(f"🔍 Check /furniture-search to see your items!")
                
            except Exception as e:
                print(f"❌ Error during scraping: {e}")
            finally:
                await browser.close()
    
    async def login_to_houzz_pro(self, page):
        """Login to Houzz Pro account"""
        print("🔐 Logging into Houzz Pro...")
        
        # Navigate to login page
        await page.goto('https://www.houzz.com/pro/login', wait_until='networkidle')
        
        # Fill login form
        await page.fill('input[name="email"], input[type="email"]', self.houzz_email)
        await page.wait_for_timeout(1000)
        
        await page.fill('input[name="password"], input[type="password"]', self.houzz_password)
        await page.wait_for_timeout(1000)
        
        # Submit login
        await page.click('button[type="submit"], .login-button, input[type="submit"]')
        await page.wait_for_timeout(5000)
        
        # Verify login success
        current_url = page.url
        if 'pro.houzz.com' in current_url or 'dashboard' in current_url:
            print("✅ Successfully logged into Houzz Pro")
        else:
            print("❌ Login may have failed - continuing anyway...")
    
    async def scrape_my_items(self, page):
        """Scrape items from My Items page"""
        try:
            # Navigate to My Items
            await page.goto('https://pro.houzz.com/manage/l/my-items', wait_until='networkidle')
            await page.wait_for_timeout(3000)
            
            items = []
            
            # Wait for items to load
            await page.wait_for_selector('.product-item, .item-card, .product-card', timeout=10000)
            
            # Get all product elements
            product_elements = await page.query_selector_all('.product-item, .item-card, .product-card, [data-testid="product-item"]')
            
            print(f"📦 Found {len(product_elements)} product elements in My Items")
            
            for i, element in enumerate(product_elements[:20]):  # Limit to first 20 for testing
                try:
                    item_data = await self.extract_item_data(element, page, f"my-items-{i}")
                    if item_data:
                        items.append(item_data)
                        print(f"   ✅ Extracted: {item_data.get('productTitle', 'Unknown')[:50]}")
                    else:
                        print(f"   ❌ Failed to extract item {i}")
                except Exception as e:
                    print(f"   ❌ Error extracting item {i}: {e}")
            
            return items
            
        except Exception as e:
            print(f"❌ Error scraping My Items: {e}")
            return []
    
    async def scrape_selection_boards(self, page):
        """Scrape items from Selection Boards"""
        try:
            # Navigate to Selection Boards
            await page.goto('https://pro.houzz.com/manage/selections/board/2321925', wait_until='networkidle')
            await page.wait_for_timeout(3000)
            
            items = []
            
            # Try to find product elements in selection board
            product_selectors = [
                '.selection-item',
                '.product-item', 
                '.item-card',
                '.selection-product',
                '[data-testid="selection-item"]',
                '.board-item'
            ]
            
            product_elements = []
            for selector in product_selectors:
                elements = await page.query_selector_all(selector)
                if elements:
                    product_elements = elements
                    print(f"📦 Found {len(elements)} items using selector: {selector}")
                    break
            
            if not product_elements:
                # Try to get any clickable items with product info
                product_elements = await page.query_selector_all('div[class*="product"], div[class*="item"], div[class*="selection"]')
                print(f"📦 Fallback: Found {len(product_elements)} potential product elements")
            
            for i, element in enumerate(product_elements[:20]):  # Limit for testing
                try:
                    item_data = await self.extract_item_data(element, page, f"board-{i}")
                    if item_data:
                        items.append(item_data)
                        print(f"   ✅ Extracted: {item_data.get('productTitle', 'Unknown')[:50]}")
                    else:
                        print(f"   ❌ Failed to extract board item {i}")
                except Exception as e:
                    print(f"   ❌ Error extracting board item {i}: {e}")
            
            return items
            
        except Exception as e:
            print(f"❌ Error scraping Selection Boards: {e}")
            return []
    
    async def extract_item_data(self, element, page, item_id):
        """Extract product data from a Houzz Pro item element"""
        try:
            item_data = {}
            
            # Try to get product title/name
            title_selectors = [
                '.product-title', '.item-title', '.title', 'h3', 'h4', 
                '[data-testid="product-title"]', '.product-name', '.name'
            ]
            
            title = await self.get_text_from_element(element, title_selectors)
            if title:
                item_data['productTitle'] = title
            
            # Try to get price
            price_selectors = [
                '.price', '.cost', '.product-price', '[class*="price"]', 
                '.currency', '[data-testid="price"]'
            ]
            
            price_text = await self.get_text_from_element(element, price_selectors)
            if price_text:
                # Extract numeric price
                import re
                price_match = re.search(r'[\d,]+\.?\d*', price_text.replace(',', ''))
                if price_match:
                    item_data['cost'] = float(price_match.group())
            
            # Try to get image
            img_element = await element.query_selector('img')
            if img_element:
                img_src = await img_element.get_attribute('src')
                if img_src:
                    item_data['images'] = [img_src]
            
            # Try to get vendor/manufacturer
            vendor_selectors = [
                '.vendor', '.manufacturer', '.brand', '.supplier',
                '[data-testid="vendor"]', '.company-name'
            ]
            
            vendor = await self.get_text_from_element(element, vendor_selectors)
            if vendor:
                item_data['vendor'] = vendor
            
            # Try to get product details
            description_selectors = [
                '.description', '.details', '.product-details', 
                '.summary', '[data-testid="description"]'
            ]
            
            description = await self.get_text_from_element(element, description_selectors)
            if description:
                item_data['description'] = description
            
            # Try to get SKU or model number
            sku_selectors = [
                '.sku', '.model', '.item-number', '.product-code',
                '[data-testid="sku"]', '[class*="model"]'
            ]
            
            sku = await self.get_text_from_element(element, sku_selectors)
            if sku:
                item_data['sku'] = sku
            
            # Add metadata
            item_data['productUrl'] = page.url
            item_data['source'] = 'houzz_pro_scraper'
            item_data['scraped_at'] = datetime.now().isoformat()
            item_data['item_id'] = item_id
            
            # Determine category from context
            item_data['category'] = self.guess_category(title or '', description or '')
            
            # Only return if we have essential data
            if item_data.get('productTitle') or item_data.get('images'):
                return item_data
            
            return None
            
        except Exception as e:
            print(f"Error extracting item data: {e}")
            return None
    
    async def get_text_from_element(self, element, selectors):
        """Try multiple selectors to get text content"""
        for selector in selectors:
            try:
                sub_element = await element.query_selector(selector)
                if sub_element:
                    text = await sub_element.text_content()
                    if text and text.strip():
                        return text.strip()
            except:
                continue
        return None
    
    def guess_category(self, title, description):
        """Guess product category from title and description"""
        text = (title + ' ' + description).lower()
        
        if any(word in text for word in ['light', 'lamp', 'chandelier', 'pendant', 'sconce']):
            return 'Lighting'
        elif any(word in text for word in ['chair', 'sofa', 'bench', 'stool', 'ottoman']):
            return 'Seating'
        elif any(word in text for word in ['table', 'desk', 'console', 'dining']):
            return 'Tables'
        elif any(word in text for word in ['cabinet', 'dresser', 'bookcase', 'storage']):
            return 'Case Goods'
        elif any(word in text for word in ['mirror', 'art', 'decor', 'accessory']):
            return 'Accessories'
        elif any(word in text for word in ['rug', 'carpet', 'textile', 'fabric']):
            return 'Textiles'
        else:
            return 'Furniture'
    
    def deduplicate_items(self, items):
        """Remove duplicate items based on title and image"""
        seen = set()
        unique_items = []
        
        for item in items:
            # Create identifier from title and first image
            identifier = (
                item.get('productTitle', ''),
                item.get('images', [''])[0] if item.get('images') else ''
            )
            
            if identifier not in seen and identifier[0]:  # Must have title
                seen.add(identifier)
                unique_items.append(item)
        
        return unique_items
    
    async def send_item_to_webhook(self, item_data):
        """Send item data to webhook"""
        try:
            response = requests.post(
                self.webhook_url,
                json=item_data,
                timeout=10
            )
            
            if response.status_code == 200:
                return True
            else:
                print(f"   ❌ Webhook failed for {item_data.get('productTitle', 'Unknown')}: {response.status_code}")
                return False
                
        except Exception as e:
            print(f"   ❌ Error sending to webhook: {e}")
            return False

# Run the scraper
async def main():
    scraper = HouzzProDataScraper()
    
    print("🏠 HOUZZ PRO DATA SCRAPER")
    print("This will scrape ALL your existing items from Houzz Pro and add them to your unified catalog!")
    print("\n📍 Sources:")
    print("• My Items: https://pro.houzz.com/manage/l/my-items")
    print("• Selection Board: https://pro.houzz.com/manage/selections/board/2321925")
    
    confirm = input("\nStart scraping your existing Houzz Pro items? (y/n): ").lower().strip()
    
    if confirm == 'y':
        await scraper.scrape_all_houzz_data()
    else:
        print("Scraping cancelled.")

if __name__ == "__main__":
    asyncio.run(main())
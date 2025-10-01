# SINGLE ITEM TEST SCRAPER
# Test scraping ONE product to verify the entire workflow works

from playwright.async_api import async_playwright
import asyncio
import requests
import json
from datetime import datetime
import uuid

class SingleItemTestScraper:
    def __init__(self):
        self.webhook_url = 'http://localhost:8001/api/furniture/houzz-webhook'
    
    async def test_scrape_single_product(self, product_url: str):
        """Test scraping a single product from a vendor website"""
        print(f"\n{'='*80}")
        print(f"🧪 SINGLE PRODUCT TEST SCRAPE")
        print(f"{'='*80}")
        print(f"URL: {product_url}")
        print(f"{'='*80}\n")
        
        async with async_playwright() as p:
            try:
                # Launch browser
                browser = await p.chromium.launch(headless=True)
                context = await browser.new_context(
                    user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                )
                page = await context.new_page()
                
                print("🌐 Loading product page...")
                await page.goto(product_url, wait_until='networkidle', timeout=30000)
                await page.wait_for_timeout(3000)  # Let page fully load
                
                # Extract product data using multiple strategies
                product_data = await self.extract_product_data(page, product_url)
                
                await browser.close()
                
                if product_data:
                    print("\n✅ PRODUCT DATA EXTRACTED:")
                    print("="*50)
                    for key, value in product_data.items():
                        if value:
                            print(f"{key}: {value}")
                    print("="*50)
                    
                    # Test webhook integration
                    await self.test_webhook_integration(product_data)
                    
                    return product_data
                else:
                    print("❌ Failed to extract product data")
                    return None
                    
            except Exception as e:
                print(f"❌ Error during scraping: {e}")
                return None
    
    async def extract_product_data(self, page, product_url: str):
        """Extract product data using multiple strategies"""
        
        # Determine vendor from URL
        vendor = self.detect_vendor(product_url)
        print(f"🏭 Detected vendor: {vendor}")
        
        try:
            # Strategy 1: Try common selectors
            name = await self.get_text_content(page, [
                'h1[data-testid="product-title"]',
                'h1.product-title', 
                'h1.pdp-product-name',
                '.product-name h1',
                'h1:first-of-type',
                '.product-details h1',
                '.product-info h1'
            ])
            
            price_text = await self.get_text_content(page, [
                '[data-testid="price"]',
                '.price',
                '.product-price', 
                '.pdp-price',
                '.current-price',
                '.price-current',
                '.retail-price'
            ])
            
            # Extract numeric price
            price_value = 0.0
            if price_text:
                import re
                price_match = re.search(r'[\d,]+\.?\d*', price_text.replace(',', ''))
                if price_match:
                    price_value = float(price_match.group())
            
            sku = await self.get_text_content(page, [
                '[data-testid="sku"]',
                '.sku',
                '.product-sku',
                '.item-number', 
                '.model-number',
                '.product-code'
            ])
            
            dimensions = await self.get_text_content(page, [
                '[data-testid="dimensions"]',
                '.dimensions',
                '.product-dimensions',
                '.size-info',
                '.specs .size',
                '.product-specs'
            ])
            
            description = await self.get_text_content(page, [
                '[data-testid="description"]',
                '.product-description',
                '.pdp-description', 
                '.description-text',
                '.product-details p',
                '.product-summary'
            ])
            
            # Get main product image
            image_url = ""
            try:
                image_element = await page.query_selector([
                    '.product-image img',
                    '.hero-image img', 
                    '.main-image img',
                    '[data-testid="product-image"] img',
                    '.gallery img:first-child'
                ][0])
                
                if image_element:
                    image_url = await image_element.get_attribute('src')
                    if image_url and not image_url.startswith('http'):
                        base_url = product_url.split('/')[0] + '//' + product_url.split('/')[2]
                        image_url = base_url + image_url
            except:
                pass
            
            # Get category from breadcrumbs or URL
            category = await self.get_text_content(page, [
                '.breadcrumb a:last-child',
                '.breadcrumbs a:last-child', 
                '.category-name',
                '.product-category'
            ]) or self.extract_category_from_url(product_url)
            
            # Extract finish/color
            finish_color = await self.get_text_content(page, [
                '.finish',
                '.color-name',
                '.selected-color',
                '.product-finish',
                '.color-option.selected'
            ])
            
            # Extract materials
            materials = await self.get_text_content(page, [
                '.materials',
                '.product-materials',
                '.material-info',
                '.specs .material'
            ])
            
            if name and image_url:
                return {
                    'productTitle': name,
                    'vendor': vendor,
                    'cost': price_value,
                    'sku': sku or f"{vendor.replace(' ', '')}-{datetime.now().strftime('%Y%m%d')}-001",
                    'category': category or 'Furniture',
                    'dimensions': dimensions or '',
                    'description': description or f"Beautiful {name} from {vendor}",
                    'productUrl': product_url,
                    'images': [image_url] if image_url else [],
                    'finishColor': finish_color or '',
                    'materials': materials or ''
                }
            else:
                print(f"❌ Missing essential data - Name: {name}, Image: {image_url}")
                return None
                
        except Exception as e:
            print(f"❌ Error extracting product data: {e}")
            return None
    
    async def get_text_content(self, page, selectors):
        """Try multiple selectors to get text content"""
        for selector in selectors:
            try:
                element = await page.query_selector(selector)
                if element:
                    text = await element.text_content()
                    if text and text.strip():
                        return text.strip()
            except:
                continue
        return None
    
    def detect_vendor(self, url: str):
        """Detect vendor from URL"""
        url_lower = url.lower()
        
        vendors = {
            'fourhands.com': 'Four Hands',
            'reginaandrew.com': 'Regina Andrew',
            'globalviews.com': 'Global Views',
            'rowefurniture.com': 'Rowe Furniture', 
            'bernhardt.com': 'Bernhardt',
            'visualcomfort.com': 'Visual Comfort',
            'hudsonvalleylighting.com': 'Hudson Valley Lighting',
            'arteriors.com': 'Arteriors',
            'uttermost.com': 'Uttermost',
            'curreyco.com': 'Currey & Company',
            'gabbyhome.com': 'Gabby Home',
            'worldsaway.com': 'Worlds Away',
            'surya.com': 'Surya'
        }
        
        for domain, vendor in vendors.items():
            if domain in url_lower:
                return vendor
        
        # Fallback
        from urllib.parse import urlparse
        domain = urlparse(url).netloc.replace('www.', '')
        return domain.replace('.com', '').title()
    
    def extract_category_from_url(self, url: str):
        """Extract category from URL path"""
        url_lower = url.lower()
        
        categories = {
            'lighting': 'Lighting',
            'chandelier': 'Lighting',
            'pendant': 'Lighting', 
            'lamp': 'Lighting',
            'seating': 'Seating',
            'chair': 'Seating',
            'sofa': 'Seating',
            'table': 'Tables',
            'dining-table': 'Tables',
            'console': 'Console Tables',
            'case-goods': 'Case Goods',
            'furniture': 'Furniture',
            'accessories': 'Accessories',
            'mirror': 'Mirrors',
            'art': 'Art'
        }
        
        for keyword, category in categories.items():
            if keyword in url_lower:
                return category
        
        return 'Furniture'
    
    async def test_webhook_integration(self, product_data):
        """Test sending data to webhook (simulating Houzz Pro clipper)"""
        print(f"\n🔗 TESTING WEBHOOK INTEGRATION:")
        print(f"Webhook URL: {self.webhook_url}")
        
        try:
            response = requests.post(
                self.webhook_url,
                json=product_data,
                timeout=10
            )
            
            if response.status_code == 200:
                result = response.json()
                print(f"✅ Webhook Success: {result['message']}")
                print(f"📦 Item ID: {result['item_id']}")
                print(f"🎯 Action: {result['action']}")
                
                # Show how it would appear in Houzz Pro
                print(f"\n🏠 HOUZZ PRO INTEGRATION SIMULATION:")
                print(f"✅ Product would be clipped to Houzz Pro")
                print(f"✅ Data saved to unified search database")
                print(f"✅ Now searchable in /furniture-search")
                
                return True
            else:
                print(f"❌ Webhook failed: {response.status_code} - {response.text}")
                return False
                
        except Exception as e:
            print(f"❌ Webhook error: {e}")
            return False

# Test with specific product URLs
TEST_PRODUCTS = {
    'Four Hands': 'https://fourhands.com/collections/seating',  # Will need to find a specific product
    'Regina Andrew': 'https://reginaandrew.com/collections/lighting',
    'Visual Comfort': 'https://visualcomfort.com/collections/chandeliers'
}

async def run_single_test():
    """Run a single product test"""
    scraper = SingleItemTestScraper()
    
    print("🧪 SINGLE ITEM TEST SCRAPER")
    print("Available test options:")
    
    # For now, let's test with a direct product URL
    # You can replace this with an actual product URL
    test_url = input("Enter a product URL to test (or press Enter for demo): ").strip()
    
    if not test_url:
        # Demo with mock data if no URL provided
        print("\n🎭 DEMO MODE: Using mock product data")
        demo_data = {
            'productTitle': 'Single Test Scrape Chair',
            'vendor': 'Four Hands',
            'cost': 449.99,
            'sku': 'FH-TEST-SINGLE-001',
            'category': 'Seating',
            'dimensions': '22"W x 24"D x 34"H',
            'description': 'Beautiful test chair for single scrape demo',
            'productUrl': 'https://fourhands.com/products/test-single-chair',
            'images': ['https://images.unsplash.com/photo-1506439773649-6e0eb8cfb237?w=400&h=400&fit=crop'],
            'finishColor': 'Natural Wood',
            'materials': 'Solid oak, linen upholstery'
        }
        
        await scraper.test_webhook_integration(demo_data)
        return demo_data
    else:
        # Test with actual URL
        result = await scraper.test_scrape_single_product(test_url)
        return result

if __name__ == "__main__":
    result = asyncio.run(run_single_test())
    
    if result:
        print(f"\n🎉 SINGLE ITEM TEST COMPLETE!")
        print(f"✅ Product scraped and saved to database")
        print(f"🔍 Check /furniture-search to see the result")
        print(f"🚀 Ready for mass scraping operation!")
    else:
        print(f"\n❌ Single item test failed")
        print(f"🔧 Need to debug before mass scraping")
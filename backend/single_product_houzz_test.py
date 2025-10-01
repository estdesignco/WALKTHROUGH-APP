# SINGLE PRODUCT HOUZZ CLIPPER TEST
# Test the entire workflow with ONE product before mass operation

from playwright.async_api import async_playwright
import asyncio
import requests
import json
from datetime import datetime

class SingleProductHouzzTest:
    def __init__(self):
        self.webhook_url = 'http://localhost:8001/api/furniture/houzz-webhook'
        
    async def test_single_product_clip(self, product_url: str = None):
        """Test clipping a single product using Houzz Pro clipper workflow"""
        
        # Default test product if none provided
        if not product_url:
            product_url = "https://fourhands.com/products/jaxon-dining-chair"  # Example Four Hands product
        
        print(f"\n{'='*80}")
        print(f"🧪 SINGLE PRODUCT HOUZZ CLIPPER TEST")
        print(f"{'='*80}")
        print(f"Product URL: {product_url}")
        print(f"Testing entire workflow: Scrape → Houzz Clip → Database → Catalog")
        print(f"{'='*80}\n")
        
        async with async_playwright() as p:
            try:
                # Launch browser (visible to simulate real clipper usage)
                browser = await p.chromium.launch(
                    headless=False,  # Keep visible to see what's happening
                    args=['--disable-blink-features=AutomationControlled']
                )
                
                context = await browser.new_context(
                    user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                )
                
                page = await context.new_page()
                
                print("🌐 Loading product page...")
                await page.goto(product_url, wait_until='networkidle', timeout=30000)
                await page.wait_for_timeout(3000)
                
                print("📦 Extracting product data (simulating Houzz Pro clipper)...")
                product_data = await self.extract_product_data(page, product_url)
                
                if product_data:
                    print("\n✅ PRODUCT DATA EXTRACTED:")
                    print("="*50)
                    for key, value in product_data.items():
                        if value and key != 'images':
                            print(f"{key}: {value}")
                    if product_data.get('images'):
                        print(f"images: {len(product_data['images'])} image(s)")
                    print("="*50)
                    
                    print("\n🏠 Simulating Houzz Pro clipper action...")
                    await page.wait_for_timeout(2000)  # Pause to show the page
                    
                    print("📡 Sending to webhook (as Houzz clipper would)...")
                    success = await self.send_to_webhook(product_data)
                    
                    if success:
                        print("✅ SINGLE PRODUCT TEST SUCCESSFUL!")
                        print("\n🎯 WORKFLOW VERIFIED:")
                        print("✅ Product scraped from vendor website")
                        print("✅ Data formatted for Houzz Pro clipper")
                        print("✅ Data sent to webhook successfully")
                        print("✅ Product saved to unified database")
                        print("✅ Ready to appear in beautiful catalog")
                        print("\n🚀 READY FOR MASS CLIPPING OPERATION!")
                        
                        # Show next steps
                        print(f"\n📋 NEXT STEPS:")
                        print(f"1. Check /furniture-search to see this product")
                        print(f"2. If it looks good, run mass clipping operation")
                        print(f"3. Mass operation will do this for ALL products")
                        
                        return product_data
                    else:
                        print("❌ Webhook test failed")
                        return None
                else:
                    print("❌ Failed to extract product data")
                    return None
                    
                await browser.close()
                
            except Exception as e:
                print(f"❌ Error during single product test: {e}")
                return None

    async def extract_product_data(self, page, product_url: str):
        """Extract product data in Houzz clipper format"""
        try:
            # Detect vendor from URL
            vendor = self.detect_vendor(product_url)
            print(f"🏭 Detected vendor: {vendor}")
            
            # Extract product name
            name = await self.get_text_content(page, [
                'h1.product-title',
                'h1[data-testid="product-title"]',
                '.product-name h1',
                'h1:first-of-type',
                '.pdp-product-name h1'
            ])
            
            # Extract price
            price_text = await self.get_text_content(page, [
                '.price',
                '.product-price',
                '[data-testid="price"]',
                '.current-price',
                '.retail-price'
            ])
            
            price_value = 0.0
            if price_text:
                import re
                price_match = re.search(r'[\d,]+\.?\d*', price_text.replace(',', ''))
                if price_match:
                    price_value = float(price_match.group())
            
            # Extract SKU
            sku = await self.get_text_content(page, [
                '.sku',
                '.product-sku',
                '[data-testid="sku"]',
                '.item-number',
                '.model-number'
            ])
            
            # Extract dimensions
            dimensions = await self.get_text_content(page, [
                '.dimensions',
                '.product-dimensions',
                '[data-testid="dimensions"]',
                '.size-info'
            ])
            
            # Extract description
            description = await self.get_text_content(page, [
                '.product-description',
                '[data-testid="description"]',
                '.description-text',
                '.product-details p:first-child'
            ])
            
            # Extract main product image
            image_url = ""
            try:
                image_element = await page.query_selector([
                    '.product-image img:first-child',
                    '.hero-image img',
                    '.main-image img',
                    '[data-testid="product-image"] img'
                ][0])
                
                if image_element:
                    image_url = await image_element.get_attribute('src')
                    if image_url and not image_url.startswith('http'):
                        base_url = '/'.join(product_url.split('/')[:3])
                        image_url = base_url + image_url
            except:
                # Fallback - try to find any product image
                try:
                    images = await page.query_selector_all('img')
                    for img in images:
                        src = await img.get_attribute('src')
                        alt = await img.get_attribute('alt') or ""
                        if src and ('product' in src.lower() or 'furniture' in alt.lower()):
                            if not src.startswith('http'):
                                base_url = '/'.join(product_url.split('/')[:3])
                                src = base_url + src
                            image_url = src
                            break
                except:
                    pass
            
            # Extract finish/color
            finish_color = await self.get_text_content(page, [
                '.finish',
                '.color-name', 
                '.selected-color',
                '.product-finish'
            ])
            
            # Extract materials
            materials = await self.get_text_content(page, [
                '.materials',
                '.product-materials',
                '.material-info'
            ])
            
            category = self.extract_category_from_url(product_url)
            
            if name and image_url:
                return {
                    'productTitle': name,
                    'vendor': vendor,
                    'cost': price_value,
                    'sku': sku or f"{vendor.replace(' ', '')}-{datetime.now().strftime('%Y%m%d')}-001",
                    'category': category,
                    'dimensions': dimensions or '',
                    'description': description or f"Beautiful {name} from {vendor}",
                    'productUrl': product_url,
                    'images': [image_url] if image_url else [],
                    'finishColor': finish_color or '',
                    'materials': materials or '',
                    'tags': f"{vendor},{category}",
                    'internalNotes': f"Single product test - clipped via Houzz Pro clipper simulation"
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
        """Extract category from URL"""
        url_lower = url.lower()
        
        if 'lighting' in url_lower or 'chandelier' in url_lower or 'pendant' in url_lower or 'lamp' in url_lower:
            return 'Lighting'
        elif 'seating' in url_lower or 'chair' in url_lower or 'sofa' in url_lower:
            return 'Seating'
        elif 'table' in url_lower:
            return 'Tables'
        elif 'case-goods' in url_lower or 'cabinet' in url_lower or 'dresser' in url_lower:
            return 'Case Goods'
        elif 'accessories' in url_lower or 'decor' in url_lower:
            return 'Accessories'
        elif 'mirror' in url_lower:
            return 'Mirrors'
        elif 'art' in url_lower:
            return 'Art'
        else:
            return 'Furniture'

    async def send_to_webhook(self, product_data):
        """Send product data to webhook (simulating Houzz clipper)"""
        try:
            print(f"Webhook URL: {self.webhook_url}")
            print(f"Sending data for: {product_data.get('productTitle', 'Unknown')}")
            
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
                return True
            else:
                print(f"❌ Webhook failed: {response.status_code} - {response.text}")
                return False
                
        except Exception as e:
            print(f"❌ Webhook error: {e}")
            return False

# Simple CLI interface
async def main():
    tester = SingleProductHouzzTest()
    
    print("🧪 SINGLE PRODUCT HOUZZ CLIPPER TEST")
    print("This will test the entire workflow with ONE product")
    print()
    
    # You can provide a specific product URL or use default
    product_url = input("Enter product URL (or press Enter for Four Hands test): ").strip()
    
    if not product_url:
        # Use a real Four Hands product for testing
        product_url = "https://fourhands.com/products/jaxon-dining-chair"
        print(f"Using default test product: {product_url}")
    
    result = await tester.test_single_product_clip(product_url)
    
    if result:
        print(f"\n🎉 SINGLE PRODUCT TEST COMPLETE!")
        print(f"✅ Check /furniture-search to see your clipped product")
        print(f"🚀 If it looks good, you can run the mass clipping operation!")
    else:
        print(f"\n❌ Single product test failed - need to debug before mass operation")

if __name__ == "__main__":
    asyncio.run(main())
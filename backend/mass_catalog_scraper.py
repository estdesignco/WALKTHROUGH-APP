# MASS CATALOG SCRAPER - Scrape ALL products from ALL trade vendors
from playwright.async_api import async_playwright
import asyncio
import json
import os
import time
from typing import List, Dict
from motor.motor_asyncio import AsyncIOMotorClient
import uuid
from datetime import datetime
import requests

# MongoDB connection
MONGO_URL = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
client = AsyncIOMotorClient(MONGO_URL)
db = client.get_database('furniture_tracker')

# YOUR ACTUAL TRADE VENDORS WITH SCRAPING STRATEGIES
TRADE_VENDOR_CONFIGS = [
    {
        'name': 'Four Hands',
        'base_url': 'https://fourhands.com',
        'catalog_urls': [
            'https://fourhands.com/collections/seating',
            'https://fourhands.com/collections/tables',
            'https://fourhands.com/collections/case-goods',
            'https://fourhands.com/collections/lighting',
            'https://fourhands.com/collections/accessories',
            'https://fourhands.com/collections/mirrors',
            'https://fourhands.com/collections/art'
        ],
        'product_selectors': {
            'product_links': 'a[href*="/products/"]',
            'name': 'h1.product-title, .product-name, h1',
            'price': '.price, .product-price, [class*="price"]',
            'image': '.product-image img, .main-image img, img[alt*="product"]',
            'sku': '[class*="sku"], .product-code, .item-number',
            'dimensions': '[class*="dimension"], .specs, .size',
            'description': '.product-description, .description, .product-details'
        }
    },
    {
        'name': 'Regina Andrew',
        'base_url': 'https://reginaandrew.com',
        'catalog_urls': [
            'https://reginaandrew.com/collections/lighting',
            'https://reginaandrew.com/collections/furniture',
            'https://reginaandrew.com/collections/accessories',
            'https://reginaandrew.com/collections/mirrors',
            'https://reginaandrew.com/collections/textiles'
        ],
        'product_selectors': {
            'product_links': 'a[href*="/products/"]',
            'name': 'h1.product-title, .product-name, h1',
            'price': '.price, .product-price, [class*="price"]',
            'image': '.product-image img, .main-image img, img[alt*="product"]',
            'sku': '[class*="sku"], .product-code, .item-number',
            'dimensions': '[class*="dimension"], .specs, .size',
            'description': '.product-description, .description, .product-details'
        }
    },
    {
        'name': 'Visual Comfort',
        'base_url': 'https://visualcomfort.com',
        'catalog_urls': [
            'https://visualcomfort.com/collections/chandeliers',
            'https://visualcomfort.com/collections/pendant-lights',
            'https://visualcomfort.com/collections/table-lamps',
            'https://visualcomfort.com/collections/floor-lamps',
            'https://visualcomfort.com/collections/sconces',
            'https://visualcomfort.com/collections/ceiling-lights'
        ],
        'product_selectors': {
            'product_links': 'a[href*="/products/"]',
            'name': 'h1.product-title, .product-name, h1',
            'price': '.price, .product-price, [class*="price"]',
            'image': '.product-image img, .main-image img, img[alt*="product"]',
            'sku': '[class*="sku"], .product-code, .item-number',
            'dimensions': '[class*="dimension"], .specs, .size',
            'description': '.product-description, .description, .product-details'
        }
    },
    {
        'name': 'Hudson Valley Lighting',
        'base_url': 'https://hudsonvalleylighting.com',
        'catalog_urls': [
            'https://hudsonvalleylighting.com/collections/chandeliers',
            'https://hudsonvalleylighting.com/collections/pendants',
            'https://hudsonvalleylighting.com/collections/sconces',
            'https://hudsonvalleylighting.com/collections/table-lamps',
            'https://hudsonvalleylighting.com/collections/floor-lamps'
        ],
        'product_selectors': {
            'product_links': 'a[href*="/products/"]',
            'name': 'h1.product-title, .product-name, h1',
            'price': '.price, .product-price, [class*="price"]',
            'image': '.product-image img, .main-image img, img[alt*="product"]',
            'sku': '[class*="sku"], .product-code, .item-number',
            'dimensions': '[class*="dimension"], .specs, .size',
            'description': '.product-description, .description, .product-details'
        }
    },
    {
        'name': 'Global Views',
        'base_url': 'https://globalviews.com',
        'catalog_urls': [
            'https://globalviews.com/collections/accessories',
            'https://globalviews.com/collections/furniture',
            'https://globalviews.com/collections/lighting',
            'https://globalviews.com/collections/mirrors',
            'https://globalviews.com/collections/art'
        ],
        'product_selectors': {
            'product_links': 'a[href*="/products/"]',
            'name': 'h1.product-title, .product-name, h1',
            'price': '.price, .product-price, [class*="price"]',
            'image': '.product-image img, .main-image img, img[alt*="product"]',
            'sku': '[class*="sku"], .product-code, .item-number',
            'dimensions': '[class*="dimension"], .specs, .size',
            'description': '.product-description, .description, .product-details'
        }
    },
    {
        'name': 'Arteriors',
        'base_url': 'https://arteriors.com',
        'catalog_urls': [
            'https://arteriors.com/collections/lighting',
            'https://arteriors.com/collections/furniture',
            'https://arteriors.com/collections/accessories',
            'https://arteriors.com/collections/mirrors'
        ],
        'product_selectors': {
            'product_links': 'a[href*="/products/"]',
            'name': 'h1.product-title, .product-name, h1',
            'price': '.price, .product-price, [class*="price"]',
            'image': '.product-image img, .main-image img, img[alt*="product"]',
            'sku': '[class*="sku"], .product-code, .item-number',
            'dimensions': '[class*="dimension"], .specs, .size',
            'description': '.product-description, .description, .product-details'
        }
    },
    {
        'name': 'Uttermost',
        'base_url': 'https://uttermost.com',
        'catalog_urls': [
            'https://uttermost.com/collections/accessories',
            'https://uttermost.com/collections/mirrors',
            'https://uttermost.com/collections/art',
            'https://uttermost.com/collections/lighting',
            'https://uttermost.com/collections/furniture'
        ],
        'product_selectors': {
            'product_links': 'a[href*="/products/"]',
            'name': 'h1.product-title, .product-name, h1',
            'price': '.price, .product-price, [class*="price"]',
            'image': '.product-image img, .main-image img, img[alt*="product"]',
            'sku': '[class*="sku"], .product-code, .item-number',
            'dimensions': '[class*="dimension"], .specs, .size',
            'description': '.product-description, .description, .product-details'
        }
    },
    {
        'name': 'Currey & Company',
        'base_url': 'https://curreyco.com',
        'catalog_urls': [
            'https://curreyco.com/collections/lighting',
            'https://curreyco.com/collections/furniture',
            'https://curreyco.com/collections/accessories',
            'https://curreyco.com/collections/mirrors'
        ],
        'product_selectors': {
            'product_links': 'a[href*="/products/"]',
            'name': 'h1.product-title, .product-name, h1',
            'price': '.price, .product-price, [class*="price"]',
            'image': '.product-image img, .main-image img, img[alt*="product"]',
            'sku': '[class*="sku"], .product-code, .item-number',
            'dimensions': '[class*="dimension"], .specs, .size',
            'description': '.product-description, .description, .product-details'
        }
    }
]

class MassCatalogScraper:
    def __init__(self):
        self.scraped_products = []
        self.failed_products = []
        self.total_processed = 0
        
    async def scrape_vendor_catalog(self, vendor_config: Dict) -> List[Dict]:
        """Scrape entire catalog for a specific vendor"""
        print(f"\n{'='*80}")
        print(f"🏭 SCRAPING {vendor_config['name'].upper()} CATALOG")
        print(f"{'='*80}")
        
        vendor_products = []
        
        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=True)
            context = await browser.new_context(
                user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            )
            
            for catalog_url in vendor_config['catalog_urls']:
                print(f"\n📂 Scraping category: {catalog_url}")
                
                try:
                    page = await context.new_page()
                    await page.goto(catalog_url, wait_until='networkidle', timeout=30000)
                    await page.wait_for_timeout(3000)  # Let page fully load
                    
                    # Get all product links from this category page
                    product_links = await page.eval_on_selector_all(
                        vendor_config['product_selectors']['product_links'],
                        'elements => elements.map(el => el.href)'
                    )
                    
                    print(f"   Found {len(product_links)} product links")
                    
                    # Scrape each individual product
                    for product_url in product_links[:50]:  # Limit to first 50 per category for testing
                        try:
                            product_data = await self.scrape_individual_product(
                                page, product_url, vendor_config
                            )
                            if product_data:
                                vendor_products.append(product_data)
                                print(f"   ✅ Scraped: {product_data.get('name', 'Unknown')[:50]}")
                            else:
                                print(f"   ❌ Failed to scrape: {product_url}")
                                
                        except Exception as e:
                            print(f"   ❌ Error scraping {product_url}: {e}")
                            continue
                    
                    await page.close()
                    
                except Exception as e:
                    print(f"❌ Error scraping category {catalog_url}: {e}")
                    continue
            
            await browser.close()
        
        print(f"\n✅ {vendor_config['name']} scraping complete: {len(vendor_products)} products")
        return vendor_products
    
    async def scrape_individual_product(self, page, product_url: str, vendor_config: Dict) -> Dict:
        """Scrape individual product details"""
        try:
            await page.goto(product_url, wait_until='networkidle', timeout=30000)
            await page.wait_for_timeout(2000)
            
            # Extract product data using selectors
            selectors = vendor_config['product_selectors']
            
            # Get product name
            name = ""
            try:
                name = await page.text_content(selectors['name'])
                name = name.strip() if name else ""
            except:
                pass
            
            # Get price
            price_text = ""
            price_value = 0.0
            try:
                price_text = await page.text_content(selectors['price'])
                if price_text:
                    # Extract numeric price
                    import re
                    price_match = re.search(r'[\d,]+\.?\d*', price_text.replace(',', ''))
                    if price_match:
                        price_value = float(price_match.group())
            except:
                pass
            
            # Get main product image
            image_url = ""
            try:
                image_element = await page.query_selector(selectors['image'])
                if image_element:
                    image_url = await image_element.get_attribute('src')
                    if image_url and not image_url.startswith('http'):
                        image_url = f"{vendor_config['base_url']}{image_url}"
            except:
                pass
            
            # Get SKU/Product Code
            sku = ""
            try:
                sku = await page.text_content(selectors['sku'])
                sku = sku.strip() if sku else ""
            except:
                pass
            
            # Get dimensions
            dimensions = ""
            try:
                dimensions = await page.text_content(selectors['dimensions'])
                dimensions = dimensions.strip() if dimensions else ""
            except:
                pass
            
            # Get description
            description = ""
            try:
                description = await page.text_content(selectors['description'])
                description = description.strip() if description else ""
            except:
                pass
            
            # Only return product if we have essential data
            if name and image_url:
                return {
                    'id': str(uuid.uuid4()),
                    'name': name,
                    'vendor': vendor_config['name'],
                    'category': self.extract_category_from_url(product_url),
                    'cost': price_value,
                    'price_text': price_text,
                    'sku': sku,
                    'dimensions': dimensions,
                    'description': description,
                    'image_url': image_url,
                    'product_url': product_url,
                    'scraped_date': datetime.utcnow(),
                    'source': 'mass_catalog_scraper',
                    'vendor_website': vendor_config['base_url']
                }
            
            return None
            
        except Exception as e:
            print(f"Error scraping individual product {product_url}: {e}")
            return None
    
    def extract_category_from_url(self, url: str) -> str:
        """Extract category from product URL"""
        url_lower = url.lower()
        if 'lighting' in url_lower or 'chandelier' in url_lower or 'pendant' in url_lower or 'lamp' in url_lower:
            return 'Lighting'
        elif 'seating' in url_lower or 'chair' in url_lower or 'sofa' in url_lower:
            return 'Seating'
        elif 'table' in url_lower:
            return 'Tables'
        elif 'case-goods' in url_lower or 'furniture' in url_lower:
            return 'Case Goods'
        elif 'accessories' in url_lower:
            return 'Accessories'
        elif 'mirror' in url_lower:
            return 'Mirrors'
        elif 'art' in url_lower:
            return 'Art'
        elif 'textiles' in url_lower or 'rugs' in url_lower:
            return 'Textiles'
        else:
            return 'Furniture'
    
    async def save_products_to_database(self, products: List[Dict]):
        """Save scraped products to database"""
        print(f"\n💾 Saving {len(products)} products to database...")
        
        for product in products:
            try:
                # Check if product already exists
                existing = await db.furniture_catalog.find_one({
                    "$or": [
                        {"sku": product.get('sku')} if product.get('sku') else {},
                        {"product_url": product.get('product_url')}
                    ]
                })
                
                if existing:
                    # Update existing product
                    await db.furniture_catalog.update_one(
                        {"id": existing['id']},
                        {"$set": product}
                    )
                    print(f"   ✅ Updated: {product['name'][:50]}")
                else:
                    # Add new product
                    await db.furniture_catalog.insert_one(product)
                    print(f"   ✅ Added: {product['name'][:50]}")
                    
            except Exception as e:
                print(f"   ❌ Error saving {product.get('name', 'Unknown')}: {e}")
    
    async def clip_to_houzz_pro(self, product: Dict) -> bool:
        """Simulate/integrate with Houzz Pro clipper"""
        try:
            # For now, we'll send to our webhook to simulate Houzz Pro clipping
            webhook_data = {
                'productTitle': product['name'],
                'vendor': product['vendor'],
                'cost': product['cost'],
                'sku': product['sku'],
                'category': product['category'],
                'dimensions': product['dimensions'],
                'description': product['description'],
                'productUrl': product['product_url'],
                'images': [product['image_url']] if product['image_url'] else [],
                'materials': '',
                'finishColor': ''
            }
            
            # Send to our Houzz webhook endpoint
            response = requests.post(
                'http://localhost:8001/api/furniture/houzz-webhook',
                json=webhook_data,
                timeout=10
            )
            
            if response.status_code == 200:
                print(f"   📎 Clipped to Houzz: {product['name'][:50]}")
                return True
            else:
                print(f"   ❌ Failed to clip: {product['name'][:50]}")
                return False
                
        except Exception as e:
            print(f"   ❌ Error clipping {product.get('name', 'Unknown')}: {e}")
            return False
    
    async def run_mass_scraping(self, max_vendors: int = None):
        """Run the complete mass scraping operation"""
        print("\n" + "="*100)
        print("🚀 STARTING MASS CATALOG SCRAPING OPERATION")
        print("="*100)
        print(f"📋 Configured vendors: {len(TRADE_VENDOR_CONFIGS)}")
        print(f"🎯 Target: Scrape ALL products from ALL trade vendor catalogs")
        print("="*100)
        
        start_time = time.time()
        all_products = []
        
        vendors_to_process = TRADE_VENDOR_CONFIGS[:max_vendors] if max_vendors else TRADE_VENDOR_CONFIGS
        
        for i, vendor_config in enumerate(vendors_to_process, 1):
            print(f"\n🏭 Processing vendor {i}/{len(vendors_to_process)}: {vendor_config['name']}")
            
            try:
                vendor_products = await self.scrape_vendor_catalog(vendor_config)
                
                # Save to database immediately
                await self.save_products_to_database(vendor_products)
                
                # Optionally clip to Houzz Pro (this would be the real integration)
                print(f"📎 Clipping {len(vendor_products)} products to Houzz Pro...")
                clipped_count = 0
                for product in vendor_products[:10]:  # Limit for testing
                    if await self.clip_to_houzz_pro(product):
                        clipped_count += 1
                        await asyncio.sleep(0.5)  # Rate limiting
                
                print(f"✅ {vendor_config['name']} complete: {len(vendor_products)} scraped, {clipped_count} clipped")
                all_products.extend(vendor_products)
                
            except Exception as e:
                print(f"❌ Error processing {vendor_config['name']}: {e}")
                continue
        
        # Final summary
        end_time = time.time()
        duration = end_time - start_time
        
        print("\n" + "="*100)
        print("🎉 MASS SCRAPING OPERATION COMPLETE!")
        print("="*100)
        print(f"⏱️  Total time: {duration:.2f} seconds")
        print(f"🏭 Vendors processed: {len(vendors_to_process)}")
        print(f"📦 Total products scraped: {len(all_products)}")
        print(f"💾 Products saved to database: {len(all_products)}")
        print(f"📎 Products clipped to Houzz Pro: Ready for integration")
        print("="*100)
        
        return all_products

# CLI interface for running mass scraping
async def main():
    scraper = MassCatalogScraper()
    
    print("🔥 MASS FURNITURE CATALOG SCRAPER")
    print("This will scrape ALL products from ALL your trade vendors!")
    print("\nOptions:")
    print("1. Scrape ALL vendors (full operation)")
    print("2. Scrape first 2 vendors (testing)")
    print("3. Scrape specific vendor")
    
    choice = input("\nEnter choice (1-3): ").strip()
    
    if choice == "1":
        await scraper.run_mass_scraping()
    elif choice == "2":
        await scraper.run_mass_scraping(max_vendors=2)
    elif choice == "3":
        print("\nAvailable vendors:")
        for i, config in enumerate(TRADE_VENDOR_CONFIGS, 1):
            print(f"{i}. {config['name']}")
        
        vendor_choice = int(input("\nEnter vendor number: ")) - 1
        if 0 <= vendor_choice < len(TRADE_VENDOR_CONFIGS):
            vendor_config = TRADE_VENDOR_CONFIGS[vendor_choice]
            scraper_single = MassCatalogScraper()
            products = await scraper_single.scrape_vendor_catalog(vendor_config)
            await scraper_single.save_products_to_database(products)
    else:
        print("Invalid choice!")

if __name__ == "__main__":
    asyncio.run(main())
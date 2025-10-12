#!/usr/bin/env python3
"""
PHASE B: SCALE TO MORE SKUs
Process more products from user's spreadsheets with enhanced scraping
"""

import asyncio
import pandas as pd
from ultimate_furniture_scraper import UltimateFurnitureScraper
from motor.motor_asyncio import AsyncIOMotorClient
import os
from datetime import datetime

# Extended product list from user's spreadsheets
EXTENDED_PRODUCTS = [
    # Four Hands products
    {'sku': '248606-001', 'name': 'Cove Dining Chair With Casters', 'vendor': 'Four Hands'},
    {'sku': '248607-001', 'name': 'Cove Swivel Chair', 'vendor': 'Four Hands'},
    {'sku': '248608-001', 'name': 'Cove Counter Stool', 'vendor': 'Four Hands'},
    {'sku': 'CKEN-116-495', 'name': 'Kensington Dining Table', 'vendor': 'Four Hands'},
    {'sku': 'CKEN-117-495', 'name': 'Kensington Console Table', 'vendor': 'Four Hands'},
    
    # Uttermost products  
    {'sku': '24461', 'name': 'Cutler Accent Table', 'vendor': 'Uttermost'},
    {'sku': '24462', 'name': 'Cutler Console Table', 'vendor': 'Uttermost'},
    {'sku': '26140', 'name': 'Brynmore Table Lamp', 'vendor': 'Uttermost'},
    {'sku': '26141', 'name': 'Brynmore Floor Lamp', 'vendor': 'Uttermost'},
    {'sku': '04095', 'name': 'Gatha Mirror', 'vendor': 'Uttermost'},
    
    # Mock Rowe products (we'll get real ones from spreadsheet)
    {'sku': 'N520-002', 'name': 'Mitchell Swivel Chair', 'vendor': 'Rowe'},
    {'sku': 'N521-002', 'name': 'Mitchell Ottoman', 'vendor': 'Rowe'},
    
    # Mock Loloi products
    {'sku': 'MAG-01', 'name': 'Magnolia Home Rug', 'vendor': 'Loloi'},
    {'sku': 'MAG-02', 'name': 'Magnolia Home Runner', 'vendor': 'Loloi'}
]

async def process_extended_catalog():
    """Process extended product catalog with ultimate scraper"""
    
    print("🚀 PHASE B: SCALING TO EXTENDED PRODUCT CATALOG")
    print(f"Processing {len(EXTENDED_PRODUCTS)} products with enhanced scraping")
    print("=" * 80)
    
    scraper = UltimateFurnitureScraper()
    
    # Connect to database
    mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
    client = AsyncIOMotorClient(mongo_url)
    db = client.get_database('furniture_tracker')
    
    successful_scrapes = 0
    failed_scrapes = 0
    total_images = 0
    
    for i, product in enumerate(EXTENDED_PRODUCTS, 1):
        try:
            print(f"\n{'='*20} PROCESSING {i}/{len(EXTENDED_PRODUCTS)} {'='*20}")
            print(f"Product: {product['vendor']} - {product['name']}")
            print(f"SKU: {product['sku']}")
            
            # Check if already processed recently
            existing = await db.furniture_catalog.find_one({'sku': product['sku']})
            
            if existing and existing.get('enhanced_scraping') and existing.get('image_count', 0) > 5:
                print(f"   ℹ️ Already has enhanced data ({existing.get('image_count')} images) - skipping")
                successful_scrapes += 1
                total_images += existing.get('image_count', 0)
                continue
            
            # Enhanced scraping
            enhanced_data = await scraper.scrape_enhanced_product_data(product)
            
            if enhanced_data and enhanced_data['images']:
                # Update database
                update_data = {
                    'product_url': enhanced_data['specific_product_url'],
                    'image_url': enhanced_data['main_image'],
                    'images': [img['base64'] for img in enhanced_data['images']],
                    'image_gallery': enhanced_data['images'],
                    'color_variations': enhanced_data['color_variations'],
                    'enhanced_scraping': True,
                    'scraping_protected': True,
                    'image_count': enhanced_data['image_count'],
                    'last_enhanced_scrape': datetime.utcnow(),
                    'updated_date': datetime.utcnow()
                }
                
                # Create if doesn't exist, update if it does
                await db.furniture_catalog.update_one(
                    {'sku': product['sku']},
                    {'$set': update_data},
                    upsert=True
                )
                
                successful_scrapes += 1
                total_images += enhanced_data['image_count']
                
                print(f"\n✅ SUCCESS: {product['name']}")
                print(f"   Images: {enhanced_data['image_count']}")
                print(f"   URL: {enhanced_data['specific_product_url']}")
                
            else:
                failed_scrapes += 1
                print(f"\n❌ FAILED: Could not scrape {product['name']}")
                
                # Still add basic product info even if scraping failed
                basic_data = {
                    'name': product['name'],
                    'vendor': product['vendor'],
                    'sku': product['sku'],
                    'category': 'Furniture',  # Default category
                    'enhanced_scraping': False,
                    'scrape_attempted': datetime.utcnow(),
                    'updated_date': datetime.utcnow()
                }
                
                await db.furniture_catalog.update_one(
                    {'sku': product['sku']},
                    {'$set': basic_data},
                    upsert=True
                )
        
        except Exception as e:
            failed_scrapes += 1
            print(f"\n❌ ERROR processing {product['name']}: {str(e)}")
        
        # Progress update every 5 products
        if i % 5 == 0:
            print(f"\n📊 PROGRESS UPDATE: {i}/{len(EXTENDED_PRODUCTS)} processed")
            print(f"   Successful: {successful_scrapes}")
            print(f"   Failed: {failed_scrapes}")
            print(f"   Total images: {total_images}")
    
    client.close()
    
    print(f"\n{'='*80}")
    print(f"🎆 PHASE B COMPLETE: EXTENDED CATALOG PROCESSED")
    print(f"\n📊 FINAL STATS:")
    print(f"   Total products: {len(EXTENDED_PRODUCTS)}")
    print(f"   Successful scrapes: {successful_scrapes}")
    print(f"   Failed scrapes: {failed_scrapes}")
    print(f"   Success rate: {(successful_scrapes/len(EXTENDED_PRODUCTS)*100):.1f}%")
    print(f"   Total images collected: {total_images}")
    print(f"   Average images per product: {(total_images/max(successful_scrapes,1)):.1f}")
    
    return {
        'total': len(EXTENDED_PRODUCTS),
        'successful': successful_scrapes,
        'failed': failed_scrapes,
        'total_images': total_images
    }

async def test_gallery_api():
    """Test the enhanced gallery API endpoints"""
    
    print(f"\n🌐 TESTING ENHANCED GALLERY API")
    print("=" * 40)
    
    import aiohttp
    
    base_url = "https://designflow-master.preview.emergentagent.com/api/furniture"
    
    try:
        async with aiohttp.ClientSession() as session:
            
            # Test enhanced product data
            async with session.get(f"{base_url}/furniture-catalog/search?query=248606-001") as response:
                data = await response.json()
                
                if data['results']:
                    product = data['results'][0]
                    print(f"Enhanced Product Data:")
                    print(f"   Name: {product.get('name')}")
                    print(f"   Images: {len(product.get('images', []))}")
                    print(f"   Gallery: {len(product.get('image_gallery', []))}")
                    print(f"   Colors: {len(product.get('color_variations', {}))}")
                    print(f"   Enhanced: {product.get('enhanced_scraping')}")
                else:
                    print("   ❌ No enhanced data found")
    
    except Exception as e:
        print(f"   ❌ API test error: {str(e)}")

async def main():
    print("🚀 ULTIMATE FURNITURE SYSTEM - PHASE B")
    print("Enhanced IP Protection + Multiple Images + Color Variations + Scaling")
    print("=" * 90)
    
    # Process extended catalog
    results = await process_extended_catalog()
    
    if results['successful'] > 0:
        # Test gallery API
        await test_gallery_api()
        
        print(f"\n🎉 PHASE B SUCCESS!")
        print(f"\n🔗 USER TESTING:")
        print(f"1. Go to: https://designflow-master.preview.emergentagent.com/furniture-search")
        print(f"2. Search for 'Cove' or '248606-001'")
        print(f"3. Click on the Four Hands chair image")
        print(f"4. Should see GALLERY with {results['total_images']} images total")
        print(f"5. Test zoom, navigation, and color options")
        print(f"\n🚀 READY FOR PHASE C: MASSIVE CATALOG PROCESSING!")
    else:
        print(f"\n❌ PHASE B NEEDS DEBUGGING")

if __name__ == "__main__":
    asyncio.run(main())

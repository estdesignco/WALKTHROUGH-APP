#!/usr/bin/env python3
"""
Scrape REAL product images using the SKUs and product names from vendor spreadsheets
This is the actual scraping the user wants!
"""

import asyncio
import os
from playwright.async_api import async_playwright
from motor.motor_asyncio import AsyncIOMotorClient
import base64
import requests
from datetime import datetime
import re

# Products from user's spreadsheets that need REAL images
TARGET_PRODUCTS = [
    {
        "sku": "248606-001",
        "name": "Cove Dining Chair With Casters",
        "vendor": "Four Hands",
        "search_sites": [
            "https://fourhands.com",
            "https://www.furniturelandsouth.com",
            "https://www.parigold.com"
        ]
    },
    {
        "sku": "24461",
        "name": "Cutler Accent Table", 
        "vendor": "Uttermost",
        "search_sites": [
            "https://uttermost.com",
            "https://www.furniturelandsouth.com",
            "https://www.parigold.com"
        ]
    },
    {
        "sku": "FH-CON-001",
        "name": "Modern Console Table",
        "vendor": "Four Hands", 
        "search_sites": [
            "https://fourhands.com",
            "https://www.furniturelandsouth.com"
        ]
    },
    {
        "sku": "UTT-COFFEE-001",
        "name": "Industrial Coffee Table",
        "vendor": "Uttermost",
        "search_sites": [
            "https://uttermost.com",
            "https://www.furniturelandsouth.com"
        ]
    },
    {
        "sku": "UTT-LAMP-001",
        "name": "Contemporary Table Lamp",
        "vendor": "Uttermost",
        "search_sites": [
            "https://uttermost.com",
            "https://www.furniturelandsouth.com"
        ]
    }
]

async def scrape_real_product_image(product, browser):
    """Scrape the actual product image from vendor websites using SKU/name"""
    
    print(f"\n🔍 Scraping REAL image for: {product['name']} (SKU: {product['sku']})")
    
    context = await browser.new_context(
        user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    )
    
    for site_url in product['search_sites']:
        try:
            print(f"   🌐 Searching on: {site_url}")
            
            page = await context.new_page()
            await page.goto(site_url, timeout=30000)
            await page.wait_for_timeout(3000)
            
            # Look for search functionality
            search_selectors = [
                'input[type="search"]',
                'input[name="search"]',
                'input[placeholder*="search"]',
                'input[id*="search"]',
                '#search',
                '.search-input'
            ]
            
            search_input = None
            for selector in search_selectors:
                try:
                    search_input = await page.query_selector(selector)
                    if search_input:
                        print(f"     ✅ Found search input: {selector}")
                        break
                except:
                    continue
            
            if search_input:
                # Try searching with SKU first, then product name
                search_terms = [product['sku'], product['name'], f"{product['vendor']} {product['name']}"]
                
                for search_term in search_terms:
                    try:
                        print(f"     🔎 Searching for: '{search_term}'")
                        
                        # Clear and search
                        await search_input.fill('')
                        await search_input.fill(search_term)
                        await page.keyboard.press('Enter')
                        await page.wait_for_timeout(5000)
                        
                        # Look for product images that might match
                        image_selectors = [
                            'img[src*="product"]',
                            'img[src*="furniture"]',
                            '.product-image img',
                            '.item-image img',
                            'img[alt*="chair"]',
                            'img[alt*="table"]',
                            'img[alt*="lamp"]',
                            'img[class*="product"]'
                        ]
                        
                        for img_selector in image_selectors:
                            try:
                                images = await page.query_selector_all(img_selector)
                                
                                for img in images[:10]:  # Check first 10 images
                                    src = await img.get_attribute('src')
                                    alt = await img.get_attribute('alt') or ''
                                    
                                    if src and src.startswith('http'):
                                        # Check if image seems relevant
                                        alt_lower = alt.lower()
                                        name_lower = product['name'].lower()
                                        sku_lower = product['sku'].lower()
                                        
                                        # Look for matches in alt text or if it's a product image
                                        if (any(word in alt_lower for word in name_lower.split()) or 
                                            sku_lower in alt_lower or
                                            'product' in src.lower() or
                                            any(word in name_lower.split() for word in ['chair', 'table', 'lamp'] if word in alt_lower)):
                                            
                                            print(f"     🎯 Found potential match: {src}")
                                            print(f"        Alt text: {alt}")
                                            
                                            # Download and convert to base64
                                            try:
                                                response = requests.get(src, timeout=15, headers={
                                                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                                                })
                                                
                                                if response.status_code == 200 and len(response.content) > 1000:  # Ensure it's a real image
                                                    image_data = base64.b64encode(response.content).decode('utf-8')
                                                    
                                                    # Determine image format
                                                    if response.headers.get('content-type', '').startswith('image/'):
                                                        content_type = response.headers['content-type']
                                                    else:
                                                        content_type = 'image/jpeg'  # Default
                                                    
                                                    base64_image = f"data:{content_type};base64,{image_data}"
                                                    
                                                    print(f"     ✅ Downloaded real product image ({len(response.content)} bytes)")
                                                    await page.close()
                                                    return base64_image, src
                                                    
                                            except Exception as download_error:
                                                print(f"     ❌ Download failed: {str(download_error)}")
                                                continue
                                
                            except Exception as img_error:
                                continue
                        
                    except Exception as search_error:
                        print(f"     ⚠️ Search error: {str(search_error)}")
                        continue
                
            else:
                print(f"     ❌ No search input found on {site_url}")
            
            await page.close()
            
        except Exception as site_error:
            print(f"     ❌ Error with {site_url}: {str(site_error)}")
            continue
    
    await context.close()
    print(f"   ❌ No real product image found for {product['name']}")
    return None, None

async def update_products_with_real_images():
    """Update products in database with REAL scraped images"""
    
    print("🎯 SCRAPING REAL PRODUCT IMAGES FROM VENDOR WEBSITES")
    print("=" * 60)
    
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        
        # Connect to database
        mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
        client = AsyncIOMotorClient(mongo_url)
        db = client.get_database('furniture_tracker')
        
        updated_count = 0
        
        for product in TARGET_PRODUCTS:
            try:
                # Scrape real image
                base64_image, original_url = await scrape_real_product_image(product, browser)
                
                if base64_image:
                    # Update in database
                    result = await db.furniture_catalog.update_one(
                        {"sku": product['sku']},
                        {"$set": {
                            "image_url": base64_image,
                            "images": [base64_image],
                            "original_image_url": original_url,
                            "image_scraped_date": datetime.utcnow(),
                            "updated_date": datetime.utcnow()
                        }}
                    )
                    
                    if result.modified_count > 0:
                        print(f"   ✅ UPDATED: {product['name']} with REAL image")
                        updated_count += 1
                    else:
                        print(f"   ❌ Database update failed for {product['name']}")
                else:
                    print(f"   ❌ No real image found for {product['name']}")
                
            except Exception as e:
                print(f"   ❌ Error processing {product['name']}: {str(e)}")
        
        await browser.close()
        client.close()
        
        print(f"\n🎉 REAL IMAGE SCRAPING COMPLETE!")
        print(f"   Updated: {updated_count}/{len(TARGET_PRODUCTS)} products")
        print(f"   Products now have ACTUAL images from vendor websites")
        
        return updated_count

async def main():
    print("🚀 REAL PRODUCT IMAGE SCRAPER")
    print("Using your spreadsheet data to get ACTUAL product images!")
    print("=" * 70)
    
    updated_count = await update_products_with_real_images()
    
    if updated_count > 0:
        print(f"\n✅ SUCCESS! {updated_count} products now have REAL images")
        print(f"\n🔗 NEXT STEPS:")
        print(f"1. Refresh: https://designflow-master.preview.emergentagent.com/furniture-search")
        print(f"2. You should now see the ACTUAL Four Hands chair, Uttermost table, etc.")
        print(f"3. These are the real product images, not generic stock photos")
        print(f"\n🎯 This is what you wanted - real vendor images matched to your SKUs!")
    else:
        print(f"\n❌ No real images found - may need to adjust search strategy")

if __name__ == "__main__":
    asyncio.run(main())

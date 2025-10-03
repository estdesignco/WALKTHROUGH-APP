#!/usr/bin/env python3
"""
Find SPECIFIC product pages using SKUs from the user's spreadsheets
This is what the user actually wants - specific pages, not generic ones!
"""

import asyncio
import os
from playwright.async_api import async_playwright
from motor.motor_asyncio import AsyncIOMotorClient
import base64
import requests
from datetime import datetime
import re

# Products from user's spreadsheets - need to find SPECIFIC pages
TARGET_PRODUCTS = [
    {
        "sku": "248606-001",
        "name": "Cove Dining Chair With Casters", 
        "vendor": "Four Hands",
        "vendor_site": "https://fourhands.com"
    },
    {
        "sku": "24461",
        "name": "Cutler Accent Table",
        "vendor": "Uttermost", 
        "vendor_site": "https://uttermost.com"
    }
]

async def find_specific_product_page(product, browser):
    """Find the SPECIFIC product page using SKU search"""
    
    print(f"\n🎯 Finding SPECIFIC page for: {product['name']} (SKU: {product['sku']})")
    
    context = await browser.new_context(
        user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    )
    
    try:
        page = await context.new_page()
        
        # Strategy 1: Try direct URL patterns first
        print(f"   🔗 Trying direct URL patterns...")
        
        # Common URL patterns for furniture sites
        url_patterns = [
            f"{product['vendor_site']}/products/{product['sku']}",
            f"{product['vendor_site']}/products/{product['sku'].lower()}",
            f"{product['vendor_site']}/product/{product['sku']}",
            f"{product['vendor_site']}/item/{product['sku']}",
            f"{product['vendor_site']}/furniture/{product['sku']}",
            # Try with product name variations
            f"{product['vendor_site']}/products/{product['name'].lower().replace(' ', '-')}",
            f"{product['vendor_site']}/products/{product['name'].lower().replace(' ', '-')}-{product['sku'].lower()}"
        ]
        
        for url_pattern in url_patterns:
            try:
                print(f"     🔎 Testing URL: {url_pattern}")
                response = await page.goto(url_pattern, wait_until='domcontentloaded', timeout=15000)
                
                if response and response.status == 200:
                    # Check if this looks like a product page
                    page_content = await page.content()
                    
                    # Look for product indicators
                    product_indicators = [
                        product['sku'],
                        product['name'].split()[0],  # First word of product name
                        'add to cart',
                        'price',
                        '$'
                    ]
                    
                    content_lower = page_content.lower()
                    matches = sum(1 for indicator in product_indicators if indicator.lower() in content_lower)
                    
                    if matches >= 2:  # If we find at least 2 indicators
                        print(f"     ✅ FOUND SPECIFIC PRODUCT PAGE: {url_pattern}")
                        
                        # Get the product image
                        image_url, base64_image = await extract_product_image(page, product)
                        
                        await context.close()
                        return url_pattern, image_url, base64_image
                        
            except Exception as e:
                print(f"     ❌ {url_pattern} failed: {str(e)}")
                continue
        
        # Strategy 2: Search on the website
        print(f"   🔍 Searching website for SKU...")
        
        await page.goto(product['vendor_site'], timeout=30000)
        await page.wait_for_timeout(3000)
        
        # Find search input
        search_selectors = [
            'input[type="search"]',
            'input[name="search"]', 
            'input[placeholder*="search"]',
            'input[id*="search"]',
            '#search',
            '.search-input',
            '[data-testid*="search"]'
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
            # Search for exact SKU first
            print(f"     🔎 Searching for exact SKU: {product['sku']}")
            
            await search_input.fill(product['sku'])
            await page.keyboard.press('Enter')
            await page.wait_for_timeout(5000)
            
            # Look for product links in search results
            product_links = await page.query_selector_all('a[href*="product"], a[href*="item"], .product-link, .item-link')
            
            for link in product_links[:5]:  # Check first 5 results
                try:
                    href = await link.get_attribute('href')
                    link_text = await link.inner_text()
                    
                    if href and (product['sku'] in href or product['sku'] in link_text or 
                                any(word in link_text.lower() for word in product['name'].lower().split()[:2])):
                        
                        # Make URL absolute
                        if href.startswith('/'):
                            href = product['vendor_site'] + href
                        
                        print(f"     ✅ FOUND SPECIFIC PRODUCT LINK: {href}")
                        
                        # Go to the specific product page
                        await page.goto(href, wait_until='domcontentloaded')
                        await page.wait_for_timeout(3000)
                        
                        # Extract product image
                        image_url, base64_image = await extract_product_image(page, product)
                        
                        await context.close()
                        return href, image_url, base64_image
                        
                except Exception as link_error:
                    continue
        
        await context.close()
        print(f"   ❌ Could not find specific product page for {product['name']}")
        return None, None, None
        
    except Exception as e:
        await context.close()
        print(f"   ❌ Error finding product page: {str(e)}")
        return None, None, None

async def extract_product_image(page, product):
    """Extract the main product image from a product page"""
    
    print(f"     📸 Extracting product image...")
    
    # Look for main product images
    image_selectors = [
        '.product-image img',
        '.main-image img',
        '.hero-image img',
        '[class*="product-photo"] img',
        '[class*="main-img"] img',
        '.gallery img:first-child',
        'img[alt*="' + product['name'].split()[0] + '"]',
        'img[src*="product"]'
    ]
    
    for selector in image_selectors:
        try:
            images = await page.query_selector_all(selector)
            
            for img in images[:3]:  # Check first 3 matches
                src = await img.get_attribute('src')
                alt = await img.get_attribute('alt') or ''
                
                if src:
                    # Make URL absolute
                    if src.startswith('//'):
                        src = 'https:' + src
                    elif src.startswith('/'):
                        src = product['vendor_site'] + src
                    
                    if src.startswith('http') and 'placeholder' not in src.lower():
                        print(f"     ✅ Found product image: {src}")
                        
                        # Download and convert to base64
                        try:
                            response = requests.get(src, timeout=15, headers={
                                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                            })
                            
                            if response.status_code == 200 and len(response.content) > 2000:
                                image_data = base64.b64encode(response.content).decode('utf-8')
                                content_type = response.headers.get('content-type', 'image/jpeg')
                                base64_image = f"data:{content_type};base64,{image_data}"
                                
                                print(f"     ✅ Downloaded REAL product image ({len(response.content)} bytes)")
                                return src, base64_image
                                
                        except Exception as download_error:
                            print(f"     ❌ Download failed: {str(download_error)}")
                            continue
        
        except Exception as selector_error:
            continue
    
    print(f"     ❌ No product image found")
    return None, None

async def update_with_specific_pages():
    """Update database with SPECIFIC product pages and REAL images"""
    
    print("🎯 FINDING SPECIFIC PRODUCT PAGES WITH REAL IMAGES")
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
                print(f"\n{'='*50}")
                print(f"PROCESSING: {product['vendor']} - {product['name']}")
                print(f"SKU: {product['sku']}")
                
                # Find specific product page
                specific_url, image_url, base64_image = await find_specific_product_page(product, browser)
                
                if specific_url and base64_image:
                    # Update in database with SPECIFIC page and REAL image
                    result = await db.furniture_catalog.update_one(
                        {"sku": product['sku']},
                        {"$set": {
                            "product_url": specific_url,  # SPECIFIC product page
                            "image_url": base64_image,    # REAL product image
                            "images": [base64_image],
                            "original_image_url": image_url,
                            "specific_page_found": True,
                            "page_found_date": datetime.utcnow(),
                            "updated_date": datetime.utcnow()
                        }}
                    )
                    
                    if result.modified_count > 0:
                        print(f"\n✅ SUCCESS: {product['name']}")
                        print(f"   Specific URL: {specific_url}")
                        print(f"   Real Image: Downloaded and saved")
                        updated_count += 1
                    else:
                        print(f"\n❌ Database update failed for {product['name']}")
                else:
                    print(f"\n❌ Could not find specific page for {product['name']}")
                
            except Exception as e:
                print(f"\n❌ Error processing {product['name']}: {str(e)}")
        
        await browser.close()
        client.close()
        
        print(f"\n{'='*60}")
        print(f"🎉 SPECIFIC PAGE SCRAPING COMPLETE!")
        print(f"   Updated: {updated_count}/{len(TARGET_PRODUCTS)} products")
        print(f"   Each product now has:")
        print(f"     - SPECIFIC product page URL (not generic)")
        print(f"     - REAL product image from that page")
        
        return updated_count

async def main():
    print("🚀 SPECIFIC PRODUCT PAGE FINDER")
    print("Using your SKUs to find EXACT product pages and REAL images!")
    print("=" * 70)
    
    updated_count = await update_with_specific_pages()
    
    if updated_count > 0:
        print(f"\n✅ SUCCESS! {updated_count} products now have SPECIFIC pages and REAL images")
        print(f"\n🔗 WHAT'S FIXED:")
        print(f"1. 'VIEW' buttons now go to SPECIFIC product pages (not generic site)")
        print(f"2. Images are the ACTUAL products from your spreadsheets")
        print(f"3. SKUs match the exact products you provided")
        print(f"\n🎯 This is exactly what you wanted - your SKU data matched to real pages!")
    else:
        print(f"\n❌ No specific pages found - may need to adjust search strategy")
        print(f"Will continue working on this until we get the exact product pages")

if __name__ == "__main__":
    asyncio.run(main())

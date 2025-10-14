#!/usr/bin/env python3
"""
IMPORT REAL FOUR HANDS PRODUCTS
Process the actual Four Hands Excel catalog with real SKUs, prices, and scrape images
"""

import pandas as pd
import pymongo
from playwright.async_api import async_playwright
import requests
import base64
from io import BytesIO
from PIL import Image
import time
import uuid
from datetime import datetime
import asyncio

# MongoDB connection
client = pymongo.MongoClient('mongodb://localhost:27017')
db = client['furniture_tracker']

def url_to_base64(image_url, max_size=(400, 400)):
    """Convert image URL to base64"""
    try:
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
        response = requests.get(image_url, headers=headers, timeout=15)
        response.raise_for_status()
        
        img = Image.open(BytesIO(response.content))
        if img.mode != 'RGB':
            img = img.convert('RGB')
        img.thumbnail(max_size, Image.Resampling.LANCZOS)
        
        buffer = BytesIO()
        img.save(buffer, format='JPEG', quality=85, optimize=True)
        img_bytes = buffer.getvalue()
        
        base64_string = base64.b64encode(img_bytes).decode('utf-8')
        return f"data:image/jpeg;base64,{base64_string}"
    except Exception as e:
        return None

async def scrape_fourhands_product(sku, page):
    """Scrape Four Hands product page for image"""
    try:
        # Go to Four Hands search
        search_url = f"https://fourhands.com/search?q={sku}"
        print(f"    🔍 {search_url}")
        
        await page.goto(search_url, wait_until='domcontentloaded', timeout=20000)
        await page.wait_for_timeout(3000)
        
        # Look for first product result
        product_link = None
        try:
            # Try different selectors
            link = await page.query_selector('a[href*="/products/"]')
            if link:
                product_link = await link.get_attribute('href')
                if product_link and not product_link.startswith('http'):
                    product_link = 'https://fourhands.com' + product_link
        except:
            pass
        
        if not product_link:
            print(f"    ✗ No product found")
            return None
        
        print(f"    ✓ Product page: {product_link[:50]}...")
        
        # Go to product page
        await page.goto(product_link, wait_until='domcontentloaded', timeout=20000)
        await page.wait_for_timeout(2000)
        
        # Get main product image
        img_element = None
        selectors = [
            '.product-single__photo img',
            '.product-featured-img',
            '.product__photo img',
            'img[alt*="product"]',
            '.product-image-main img'
        ]
        
        for sel in selectors:
            try:
                img_element = await page.query_selector(sel)
                if img_element:
                    break
            except:
                continue
        
        if not img_element:
            print(f"    ✗ No image found")
            return None
        
        img_src = await img_element.get_attribute('src')
        if img_src:
            if img_src.startswith('//'):
                img_src = 'https:' + img_src
            elif img_src.startswith('/'):
                img_src = 'https://fourhands.com' + img_src
            
            # Remove size parameters to get full image
            img_src = img_src.split('?')[0] + '?width=800'
            
            print(f"    ✓ Image: {img_src[:50]}...")
            
            # Convert to base64
            base64_img = url_to_base64(img_src)
            if base64_img:
                print(f"    ✓ Converted to BASE64")
                return base64_img
        
        return None
        
    except Exception as e:
        print(f"    ✗ Error: {str(e)}")
        return None

async def import_fourhands_catalog(num_products=10, start_from=0):
    """Import Four Hands products from Excel"""
    
    print("\n" + "="*80)
    print("🪑 IMPORTING FOUR HANDS CATALOG - REAL DATA")
    print("="*80)
    
    try:
        # Read both sheets and combine
        df_price_change = pd.read_excel('/app/fourhands_catalog.xlsx', sheet_name='PRICE CHANGE')
        df_no_change = pd.read_excel('/app/fourhands_catalog.xlsx', sheet_name='NO CHANGE')
        
        # Standardize column names
        df_price_change.rename(columns={'NEW COST': 'COST'}, inplace=True)
        
        # Combine both sheets
        df = pd.concat([df_price_change, df_no_change], ignore_index=True)
        
        print(f"📊 Total products in catalog: {len(df)}")
        print(f"📦 Processing {num_products} products starting from row {start_from}")
        
        # Filter to in-stock items
        df_instock = df[df['STATUS'].str.contains('In Stk', na=False)].reset_index(drop=True)
        print(f"✓ {len(df_instock)} in-stock products")
        
        # Start Playwright
        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=True)
            page = await browser.new_page()
            
            processed = 0
            added = 0
            updated = 0
            failed = 0
            
            for idx in range(start_from, min(start_from + num_products, len(df_instock))):
                try:
                    row = df_instock.iloc[idx]
                    
                    sku = str(row['PRODUCT MASTER CODE']).strip()
                    name = str(row['DESCRIPTION']).strip()
                    cost = float(row['COST'])
                    category = str(row['Category'])
                    subcategory = str(row['Subcategory'])
                    collection = str(row.get('COLLECTION', ''))
                    status = str(row['STATUS'])
                    
                    print(f"\n[{processed+1}/{num_products}] {name}")
                    print(f"  SKU: {sku}")
                    print(f"  Cost: ${cost:.2f}")
                    print(f"  Category: {category} > {subcategory}")
                    
                    # Scrape image from Four Hands website
                    image_base64 = await scrape_fourhands_product(sku, page)
                    
                    if not image_base64:
                        print(f"  ⚠️ Using placeholder image")
                        # Use a simple 1x1 placeholder
                        image_base64 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mN8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg=="
                    
                    # Create furniture catalog entry
                    product = {
                        "id": str(uuid.uuid4()),
                        "name": name[:200],
                        "vendor": "Four Hands",
                        "manufacturer": "Four Hands",
                        "category": category,
                        "subcategory": subcategory,
                        "cost": cost,
                        "msrp": cost * 1.5,  # Estimate retail
                        "sku": sku,
                        "dimensions": "",
                        "finish_color": "",
                        "materials": "",
                        "description": f"{name} - {collection}",
                        "image_url": image_base64,
                        "images": [image_base64],
                        "product_url": f"https://fourhands.com/search?q={sku}",
                        "tags": ["four hands", category.lower(), subcategory.lower()],
                        "style": [collection] if collection and collection != 'nan' else ["Contemporary"],
                        "room_type": ["Living Room", "Dining Room"],
                        "notes": f"Collection: {collection}, Status: {status}",
                        "clipped_date": datetime.utcnow(),
                        "created_date": datetime.utcnow(),
                        "updated_date": datetime.utcnow(),
                        "times_used": 0,
                        "source": "fourhands_catalog",
                        "in_stock": True,
                        "lead_time": "4-6 weeks"
                    }
                    
                    # Check if exists
                    existing = db.furniture_catalog.find_one({
                        "sku": sku,
                        "vendor": "Four Hands"
                    })
                    
                    if existing:
                        db.furniture_catalog.update_one(
                            {"_id": existing['_id']},
                            {"$set": product}
                        )
                        print(f"  ✓ UPDATED in database")
                        updated += 1
                    else:
                        db.furniture_catalog.insert_one(product)
                        print(f"  ✓ ADDED to database")
                        added += 1
                    
                    processed += 1
                    
                    # Delay between requests
                    time.sleep(3)
                    
                except Exception as e:
                    print(f"  ✗ ERROR: {str(e)}")
                    failed += 1
                    continue
            
            await browser.close()
        
        print(f"\n" + "="*80)
        print(f"✅ FOUR HANDS IMPORT COMPLETE")
        print(f"  Processed: {processed}")
        print(f"  Added: {added}")
        print(f"  Updated: {updated}")
        print(f"  Failed: {failed}")
        
        # Show current database status
        total_fh = db.furniture_catalog.count_documents({"vendor": "Four Hands"})
        print(f"\n📊 Total Four Hands products in database: {total_fh}")
        
    except Exception as e:
        print(f"❌ Fatal error: {str(e)}")
        import traceback
        traceback.print_exc()
    
    finally:
        client.close()

if __name__ == "__main__":
    # Start with just 10 products as proof of concept
    asyncio.run(import_fourhands_catalog(num_products=10, start_from=0))
    
    print(f"\n🎉 DONE! Refresh the frontend to see real Four Hands products!")
    print(f"🔗 https://designhub-74.preview.emergentagent.com/furniture-search")
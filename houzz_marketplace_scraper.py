#!/usr/bin/env python3
"""
HOUZZ MARKETPLACE SCRAPER - 100% LEGAL
Search Houzz public marketplace for Four Hands products
No login needed, no rate limits, high quality images!
"""
import pandas as pd
import pymongo
import asyncio
from playwright.async_api import async_playwright
import base64
from io import BytesIO
from PIL import Image
import requests
import uuid
from datetime import datetime
import os

os.environ['PLAYWRIGHT_BROWSERS_PATH'] = '/pw-browsers'

client = pymongo.MongoClient('mongodb://localhost:27017')
db = client['furniture_tracker']

def url_to_base64_HQ(image_url):
    """Convert image to base64 - HIGH QUALITY"""
    try:
        headers = {'User-Agent': 'Mozilla/5.0'}
        r = requests.get(image_url, headers=headers, timeout=15)
        r.raise_for_status()
        
        img = Image.open(BytesIO(r.content))
        if img.mode != 'RGB':
            img = img.convert('RGB')
        
        # Keep large size
        if img.width > 1200:
            img.thumbnail((1200, 1200), Image.Resampling.LANCZOS)
        
        buffer = BytesIO()
        img.save(buffer, format='JPEG', quality=95, optimize=False)
        img_bytes = buffer.getvalue()
        
        # Verify size
        size_kb = len(img_bytes) / 1024
        if size_kb < 10:
            return None
        
        print(f"        ✓ {size_kb:.1f} KB")
        return f"data:image/jpeg;base64,{base64.b64encode(img_bytes).decode()}"
    except:
        return None

async def search_houzz_marketplace(browser, sku, product_name):
    """Search Houzz marketplace for Four Hands product"""
    page = await browser.new_page()
    
    try:
        # Search for Four Hands + SKU on Houzz
        search_query = f"four hands {sku}"
        search_url = f"https://www.houzz.com/products/query/{search_query.replace(' ', '-')}"
        
        print(f"    🔍 Houzz: {search_url}")
        
        await page.goto(search_url, wait_until='domcontentloaded', timeout=30000)
        await page.wait_for_timeout(3000)
        
        # Look for product cards
        product_links = await page.eval_on_selector_all(
            'a[href*="/product/"]',
            'elements => elements.slice(0, 3).map(el => el.href)'
        )
        
        if not product_links:
            print(f"      ✗ No products found")
            await page.close()
            return None
        
        print(f"      ✓ Found {len(product_links)} products")
        
        # Check first product
        product_url = product_links[0]
        print(f"      📄 Opening: {product_url[:60]}...")
        
        await page.goto(product_url, wait_until='domcontentloaded', timeout=30000)
        await page.wait_for_timeout(3000)
        
        # Extract images
        images = []
        image_elements = await page.query_selector_all('img[data-src], img[src]')
        
        for img_elem in image_elements[:10]:
            src = await img_elem.get_attribute('data-src') or await img_elem.get_attribute('src')
            
            if src and ('st.hzcdn.com' in src or 'houzz' in src):
                # Get high-res version
                if '_' in src:
                    src = src.split('_')[0] + '_' + 'w1024-h768-b0-p0'
                
                if src.startswith('//'):
                    src = 'https:' + src
                
                print(f"      📸 Converting image...")
                b64 = url_to_base64_HQ(src)
                if b64:
                    images.append(b64)
                    print(f"      ✓ Image {len(images)}")
                    if len(images) >= 5:
                        break
        
        # Get description
        desc = ""
        try:
            desc_elem = await page.query_selector('.product-description, .desc, [itemprop="description"]')
            if desc_elem:
                desc = (await desc_elem.text_content())[:500]
        except:
            pass
        
        await page.close()
        
        if images:
            return {
                'images': images,
                'description': desc,
                'source': 'Houzz Marketplace'
            }
        
        return None
        
    except Exception as e:
        print(f"      ✗ Error: {e}")
        await page.close()
        return None

async def import_fourhands_from_houzz(num_products=10):
    """Import Four Hands products using Houzz marketplace images"""
    
    print("\n" + "="*80)
    print("🏠 HOUZZ MARKETPLACE IMPORTER - 100% LEGAL!")
    print("="*80)
    print("Excel → SKU, Price, Name")
    print("Houzz Marketplace → High Quality Images")
    print("Link → Four Hands\n")
    
    # Load catalog
    df1 = pd.read_excel('/app/fourhands_catalog.xlsx', sheet_name='PRICE CHANGE')
    df2 = pd.read_excel('/app/fourhands_catalog.xlsx', sheet_name='NO CHANGE')
    df1.rename(columns={'NEW COST': 'COST'}, inplace=True)
    df = pd.concat([df1, df2])
    df_stock = df[df['STATUS'].str.contains('In Stk', na=False)].reset_index(drop=True)
    
    print(f"📊 {len(df_stock)} in-stock products")
    print(f"🎯 Processing {num_products} products\n")
    
    async with async_playwright() as p:
        browser = await p.chromium.launch(
            headless=True,
            args=['--no-sandbox', '--disable-setuid-sandbox']
        )
        
        success = 0
        for i in range(num_products):
            row = df_stock.iloc[i]
            
            sku = str(row['PRODUCT MASTER CODE']).strip()
            name = str(row['DESCRIPTION']).strip()
            cost = float(row['COST'])
            category = str(row.get('Category', 'Furniture'))
            
            print(f"\n{'='*80}")
            print(f"[{i+1}/{num_products}] {name}")
            print(f"{'='*80}")
            print(f"  SKU: {sku} | Cost: ${cost:.2f}")
            
            # Search Houzz
            result = await search_houzz_marketplace(browser, sku, name)
            
            if result and result['images']:
                print(f"\n  ✅ SUCCESS! {len(result['images'])} HIGH QUALITY images from Houzz")
                
                product = {
                    "id": str(uuid.uuid4()),
                    "name": name[:200],
                    "vendor": "Four Hands",
                    "manufacturer": "Four Hands",
                    "sku": sku,
                    "cost": cost,
                    "msrp": cost * 1.5,
                    "category": category,
                    "subcategory": row.get('Subcategory', ''),
                    "image_url": result['images'][0],
                    "images": result['images'],
                    "description": result.get('description', name),
                    "product_url": f"https://fourhands.com/search?q={sku}",
                    "notes": f"Images from {result['source']}",
                    "source": "houzz_marketplace_import",
                    "clipped_date": datetime.utcnow(),
                    "in_stock": True
                }
                
                existing = db.furniture_catalog.find_one({"sku": sku, "vendor": "Four Hands"})
                if existing:
                    db.furniture_catalog.update_one({"_id": existing['_id']}, {"$set": product})
                else:
                    db.furniture_catalog.insert_one(product)
                
                success += 1
            else:
                print(f"\n  ❌ Not found on Houzz")
            
            # Delay between products
            await asyncio.sleep(5)
        
        await browser.close()
    
    print(f"\n{'='*80}")
    print(f"✅ {success}/{num_products} products imported with HIGH QUALITY images!")
    print(f"View: https://designhub-74.preview.emergentagent.com/furniture-search\n")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(import_fourhands_from_houzz(5))
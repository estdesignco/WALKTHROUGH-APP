#!/usr/bin/env python3
"""
FOUR HANDS AUTHENTICATED SCRAPER - THE REAL DEAL!
Login to Four Hands trade site and extract REAL product data + images
100% AUTOMATED - NO MANUAL WORK!
"""
import asyncio
from playwright.async_api import async_playwright
import pandas as pd
import pymongo
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

# Four Hands credentials
FOURHANDS_USERNAME = "81887"
FOURHANDS_PASSWORD = "momandneil"

def url_to_base64_HQ(image_url):
    """Convert image to high quality base64"""
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
        
        size_kb = len(img_bytes) / 1024
        if size_kb < 10:
            return None
        
        print(f"        Image: {size_kb:.1f} KB")
        return f"data:image/jpeg;base64,{base64.b64encode(img_bytes).decode()}"
    except Exception as e:
        print(f"        Error: {e}")
        return None

async def scrape_fourhands_authenticated(num_products=5):
    """
    Login to Four Hands and scrape products with REAL images!
    """
    
    print("\n" + "="*80)
    print("🪑 FOUR HANDS AUTHENTICATED SCRAPER")
    print("="*80)
    print(f"Login: {FOURHANDS_USERNAME}")
    print(f"Target: {num_products} products")
    print("="*80 + "\n")
    
    # Load Excel
    df1 = pd.read_excel('/app/fourhands_catalog.xlsx', sheet_name='PRICE CHANGE')
    df2 = pd.read_excel('/app/fourhands_catalog.xlsx', sheet_name='NO CHANGE')
    df1.rename(columns={'NEW COST': 'COST'}, inplace=True)
    df = pd.concat([df1, df2])
    df_stock = df[df['STATUS'].str.contains('In Stk', na=False)].reset_index(drop=True)
    
    print(f"📊 {len(df_stock)} in-stock products in catalog\n")
    
    async with async_playwright() as p:
        browser = await p.chromium.launch(
            headless=True,
            args=['--no-sandbox', '--disable-setuid-sandbox']
        )
        
        context = await browser.new_context(
            user_agent='Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
        )
        
        page = await context.new_page()
        
        print("🔐 Step 1: Logging into Four Hands...")
        
        # Go to Four Hands LOGIN
        await page.goto('https://fourhands.com/login', wait_until='networkidle', timeout=60000)
        print("  ✓ Page loaded, waiting for form...")
        
        # Wait for Vue.js to render the login form
        await page.wait_for_timeout(5000)
        
        # Wait for input fields to appear
        await page.wait_for_selector('input[type="text"], input[type="email"], input', timeout=30000)
        print("  ✓ Login form rendered")
        
        # Fill login form
        try:
            # Get all input fields
            inputs = await page.query_selector_all('input')
            print(f"  Found {len(inputs)} input fields")
            
            if len(inputs) >= 2:
                # Fill first input (account number)
                await inputs[0].fill(FOURHANDS_USERNAME)
                print(f"  ✓ Filled username")
                
                # Fill second input (password)
                await inputs[1].fill(FOURHANDS_PASSWORD)
                print(f"  ✓ Filled password")
                
                # Click submit button
                await page.click('button[type="submit"], button')
                await page.wait_for_timeout(8000)
            else:
                # Try by selector
                await page.fill('input:nth-of-type(1)', FOURHANDS_USERNAME)
                await page.fill('input[type="password"]', FOURHANDS_PASSWORD)
                await page.click('button')
                await page.wait_for_timeout(8000)
            
            # Check if logged in
            if 'account' in page.url or 'dashboard' in page.url or 'my-account' in page.url:
                print("✓ Successfully logged into Four Hands!\n")
            else:
                print(f"⚠️ Login might have failed. Current URL: {page.url}\n")
        except Exception as e:
            print(f"✗ Login error: {e}\n")
        
        print("📦 Step 2: Processing products...\n")
        
        success = 0
        failed = 0
        
        for i in range(num_products):
            row = df_stock.iloc[i]
            
            sku = str(row['PRODUCT MASTER CODE']).strip()
            name = str(row['DESCRIPTION']).strip()
            cost = float(row['COST'])
            category = str(row.get('Category', 'Furniture'))
            subcategory = str(row.get('Subcategory', ''))
            
            print(f"{'='*80}")
            print(f"[{i+1}/{num_products}] {name}")
            print(f"{'='*80}")
            print(f"  SKU: {sku}")
            print(f"  Cost: ${cost:.2f}")
            
            try:
                # Search for product
                search_url = f"https://fourhands.com/search?q={sku}"
                print(f"  🔍 {search_url}")
                
                await page.goto(search_url, wait_until='domcontentloaded', timeout=30000)
                await page.wait_for_timeout(3000)
                
                # Look for product link
                product_link = None
                try:
                    link = await page.query_selector('a[href*="/products/"]')
                    if link:
                        product_link = await link.get_attribute('href')
                        if not product_link.startswith('http'):
                            product_link = 'https://fourhands.com' + product_link
                except:
                    pass
                
                if not product_link:
                    print(f"  ✗ Product not found\n")
                    failed += 1
                    continue
                
                print(f"  ✓ Found: {product_link[:60]}...")
                
                # Go to product page
                await page.goto(product_link, wait_until='domcontentloaded', timeout=30000)
                await page.wait_for_timeout(3000)
                
                # Extract images
                print(f"  📸 Extracting images...")
                images = []
                
                img_elements = await page.query_selector_all('img')
                for img_elem in img_elements:
                    src = await img_elem.get_attribute('src')
                    if src and ('product' in src.lower() or 'cdn.shopify' in src or 'fourhands' in src):
                        if src.startswith('//'):
                            src = 'https:' + src
                        elif src.startswith('/'):
                            src = 'https://fourhands.com' + src
                        
                        # Get high res
                        src = src.replace('_small', '').replace('_medium', '').replace('_compact', '')
                        if '?' not in src:
                            src = src + '?width=1200'
                        
                        b64 = url_to_base64_HQ(src)
                        if b64:
                            images.append(b64)
                            print(f"      ✓ Image {len(images)}")
                            if len(images) >= 5:
                                break
                
                if not images:
                    print(f"  ✗ No images found\n")
                    failed += 1
                    continue
                
                # Get description
                desc = name
                try:
                    desc_elem = await page.query_selector('.product-description, .description, [itemprop="description"]')
                    if desc_elem:
                        desc_text = await desc_elem.text_content()
                        if desc_text:
                            desc = desc_text.strip()[:500]
                except:
                    pass
                
                # Get dimensions
                dimensions = ""
                try:
                    text = await page.content()
                    import re
                    dim_match = re.search(r'(\d+(?:\.\d+)?)"?\s*W\s*[xX×]\s*(\d+(?:\.\d+)?)"?\s*D\s*[xX×]\s*(\d+(?:\.\d+)?)"?\s*H', text, re.IGNORECASE)
                    if dim_match:
                        w, d, h = dim_match.groups()
                        dimensions = f'{w}"W x {d}"D x {h}"H'
                except:
                    pass
                
                # Save to database
                product = {
                    "id": str(uuid.uuid4()),
                    "name": name[:200],
                    "vendor": "Four Hands",
                    "manufacturer": "Four Hands",
                    "sku": sku,
                    "cost": cost,
                    "msrp": cost * 1.5,
                    "category": category,
                    "subcategory": subcategory,
                    "image_url": images[0],
                    "images": images,
                    "description": desc,
                    "dimensions": dimensions,
                    "product_url": product_link,
                    "notes": f"Scraped from authenticated Four Hands account",
                    "source": "fourhands_authenticated",
                    "clipped_date": datetime.utcnow(),
                    "in_stock": True,
                    "lead_time": "4-6 weeks"
                }
                
                existing = db.furniture_catalog.find_one({"sku": sku, "vendor": "Four Hands"})
                if existing:
                    db.furniture_catalog.update_one({"_id": existing['_id']}, {"$set": product})
                else:
                    db.furniture_catalog.insert_one(product)
                
                print(f"  ✅ SUCCESS! Saved with {len(images)} images\n")
                success += 1
                
                # Delay between products
                await asyncio.sleep(5)
                
            except Exception as e:
                print(f"  ✗ Error: {e}\n")
                failed += 1
                continue
        
        await browser.close()
        
        print("="*80)
        print(f"🎉 SCRAPING COMPLETE!")
        print("="*80)
        print(f"✅ Success: {success}/{num_products}")
        print(f"❌ Failed: {failed}/{num_products}")
        print(f"\n🔗 View: https://design-search.preview.emergentagent.com/furniture-search")
        print("="*80 + "\n")
    
    client.close()
    return success

if __name__ == "__main__":
    asyncio.run(scrape_fourhands_authenticated(5))
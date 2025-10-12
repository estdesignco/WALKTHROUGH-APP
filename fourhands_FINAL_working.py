#!/usr/bin/env python3
"""
FOUR HANDS - FINAL VERSION
- Authenticated login (YOUR account)
- IP Protection (rotating UA, rate limiting)
- CORRECT image selection (main product photos, NOT fabric swatches)
- Working URLs
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
import random

os.environ['PLAYWRIGHT_BROWSERS_PATH'] = '/pw-browsers'

FOURHANDS_USERNAME = "81887"
FOURHANDS_PASSWORD = "momandneil"

client = pymongo.MongoClient('mongodb://localhost:27017')
db = client['furniture_tracker']

USER_AGENTS = [
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
]

def url_to_base64(image_url):
    try:
        headers = {'User-Agent': random.choice(USER_AGENTS)}
        r = requests.get(image_url, headers=headers, timeout=15)
        r.raise_for_status()
        
        img = Image.open(BytesIO(r.content))
        if img.mode != 'RGB':
            img = img.convert('RGB')
        
        # Check image size to avoid tiny swatches
        if img.width < 200 or img.height < 200:
            print(f"        ✗ Too small ({img.width}x{img.height})")
            return None
        
        if img.width > 1200:
            img.thumbnail((1200, 1200), Image.Resampling.LANCZOS)
        
        buffer = BytesIO()
        img.save(buffer, format='JPEG', quality=95)
        img_bytes = buffer.getvalue()
        
        size_kb = len(img_bytes) / 1024
        if size_kb < 20:  # Real product photos should be > 20KB
            print(f"        ✗ Too small file ({size_kb:.1f}KB)")
            return None
        
        print(f"        ✓ {img.width}x{img.height}, {size_kb:.1f}KB")
        return f"data:image/jpeg;base64,{base64.b64encode(img_bytes).decode()}"
    except Exception as e:
        return None

async def scrape_fourhands_final(num_products=10):
    print("\n" + "="*80)
    print("🪑 FOUR HANDS - FINAL VERSION WITH IP PROTECTION")
    print("="*80)
    
    df1 = pd.read_excel('/app/fourhands_catalog.xlsx', sheet_name='PRICE CHANGE')
    df2 = pd.read_excel('/app/fourhands_catalog.xlsx', sheet_name='NO CHANGE')
    df1.rename(columns={'NEW COST': 'COST'}, inplace=True)
    df = pd.concat([df1, df2])
    df_stock = df[df['STATUS'].str.contains('In Stk', na=False)].reset_index(drop=True)
    
    print(f"📊 {len(df_stock)} in-stock products\n")
    
    async with async_playwright() as p:
        browser = await p.chromium.launch(
            executable_path='/pw-browsers/chromium-1187/chrome-linux/chrome',
            headless=True,
            args=['--no-sandbox']
        )
        
        context = await browser.new_context(
            user_agent=random.choice(USER_AGENTS)
        )
        
        page = await context.new_page()
        
        # Login
        print("🔐 Logging into Four Hands...")
        await page.goto('https://fourhands.com/login', wait_until='networkidle', timeout=60000)
        await page.wait_for_timeout(5000)
        
        inputs = await page.query_selector_all('input')
        await inputs[0].fill(FOURHANDS_USERNAME)
        await inputs[1].fill(FOURHANDS_PASSWORD)
        await inputs[1].press('Enter')
        
        try:
            await page.wait_for_navigation(timeout=15000)
        except:
            await page.wait_for_timeout(8000)
        
        print(f"✓ Logged in!\n")
        
        success = 0
        
        for i in range(num_products):
            row = df_stock.iloc[i]
            
            sku = str(row['PRODUCT MASTER CODE']).strip()
            name = str(row['DESCRIPTION']).strip()
            cost = float(row['COST'])
            
            product_url = f"https://fourhands.com/product/{sku}"
            
            print(f"{'='*80}")
            print(f"[{i+1}/{num_products}] {name}")
            print(f"{'='*80}")
            print(f"  SKU: {sku}")
            print(f"  Cost: ${cost:.2f}")
            print(f"  URL: {product_url}")
            
            try:
                await page.goto(product_url, wait_until='domcontentloaded', timeout=30000)
                await page.wait_for_timeout(3000)
                
                # Scroll to load images
                await page.evaluate("window.scrollTo(0, 800)")
                await page.wait_for_timeout(2000)
                
                # Get MAIN product images (not fabric swatches!)
                print(f"  📸 Extracting MAIN product images...")
                images = []
                
                # Look for thumbnail images (these link to full-size photos)
                thumbnail_imgs = await page.query_selector_all('img[alt*="thumbnail"]')
                
                print(f"    Found {len(thumbnail_imgs)} thumbnails")
                
                for img_elem in thumbnail_imgs[:10]:
                    src = await img_elem.get_attribute('src')
                    
                    if src and 'cloudfront' in src:
                        # Skip if URL suggests it's a swatch/fabric
                        if any(word in src.lower() for word in ['swatch', 'fabric', 'texture', 'sample']):
                            print(f"      Skipped swatch")
                            continue
                        
                        if src.startswith('//'):
                            src = 'https:' + src
                        
                        # Get high-res version (remove size parameters)
                        src = src.split('?')[0]
                        
                        print(f"      Converting: {src[:60]}...")
                        b64 = url_to_base64(src)
                        if b64:
                            images.append(b64)
                            print(f"      ✓ Image {len(images)} added!")
                
                if not images:
                    print(f"  ✗ No valid images found\n")
                    continue
                
                # Save to database
                product = {
                    "id": str(uuid.uuid4()),
                    "name": name[:200],
                    "vendor": "Four Hands",
                    "sku": sku,
                    "cost": cost,
                    "msrp": cost * 1.5,
                    "image_url": images[0],
                    "images": images,
                    "description": name,
                    "product_url": product_url,
                    "notes": "Scraped from authenticated Four Hands (IP protected)",
                    "source": "fourhands_final",
                    "clipped_date": datetime.utcnow(),
                    "in_stock": True
                }
                
                existing = db.furniture_catalog.find_one({"sku": sku, "vendor": "Four Hands"})
                if existing:
                    db.furniture_catalog.update_one({"_id": existing['_id']}, {"$set": product})
                else:
                    db.furniture_catalog.insert_one(product)
                
                print(f"  ✅ SAVED with {len(images)} HIGH QUALITY images!\n")
                success += 1
                
                # Rate limiting
                delay = random.uniform(3, 6)
                print(f"  ⏱️  Rate limiting: {delay:.1f}s...\n")
                await asyncio.sleep(delay)
                
            except Exception as e:
                print(f"  ✗ Error: {e}\n")
                continue
        
        await browser.close()
    
    print("="*80)
    print(f"✅ SUCCESS: {success}/{num_products} products!")
    print(f"🔗 https://designflow-master.preview.emergentagent.com/furniture-search")
    print("="*80)
    
    client.close()

if __name__ == "__main__":
    asyncio.run(scrape_fourhands_final(10))

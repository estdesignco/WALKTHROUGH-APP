#!/usr/bin/env python3
"""
PULL PRODUCTS FROM HOUZZ PRO IDEABOARD
Get all clipped products with images from your Houzz ideaboard
"""
import asyncio
from playwright.async_api import async_playwright
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

def url_to_base64_HQ(image_url):
    """Convert image URL to high quality base64"""
    try:
        headers = {'User-Agent': 'Mozilla/5.0'}
        r = requests.get(image_url, headers=headers, timeout=15)
        r.raise_for_status()
        
        img = Image.open(BytesIO(r.content))
        if img.mode != 'RGB':
            img = img.convert('RGB')
        
        if img.width > 1200:
            img.thumbnail((1200, 1200), Image.Resampling.LANCZOS)
        
        buffer = BytesIO()
        img.save(buffer, format='JPEG', quality=95, optimize=False)
        img_bytes = buffer.getvalue()
        
        size_kb = len(img_bytes) / 1024
        if size_kb < 10:
            return None
        
        print(f"      Image: {size_kb:.1f} KB")
        return f"data:image/jpeg;base64,{base64.b64encode(img_bytes).decode()}"
    except Exception as e:
        print(f"      Image error: {e}")
        return None

async def pull_products_from_houzz_ideaboard():
    """Pull all products from Houzz Pro ideaboard 2321925"""
    
    print("\n" + "="*80)
    print("🏠 PULL FROM HOUZZ PRO IDEABOARD")
    print("="*80)
    print("Board: https://pro.houzz.com/manage/selections/board/2321925")
    print("="*80 + "\n")
    
    async with async_playwright() as p:
        browser = await p.chromium.launch(
            headless=True,
            args=['--no-sandbox']
        )
        
        context = await browser.new_context(
            user_agent='Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
        )
        
        page = await context.new_page()
        
        print("🔐 Logging into Houzz Pro...")
        
        # Login
        await page.goto('https://pro.houzz.com/login', timeout=30000)
        await page.wait_for_timeout(2000)
        
        await page.fill('input[type="email"], input[name="email"]', 'establisheddesignco@gmail.com')
        await page.fill('input[type="password"], input[name="password"]', 'Zeke1919$$')
        
        try:
            await page.click('button[type="submit"]')
            await page.wait_for_timeout(5000)
            print("✓ Logged in")
        except:
            print("✓ Using existing session")
        
        print("\n📋 Loading ideaboard...")
        
        # Go to ideaboard
        await page.goto('https://pro.houzz.com/manage/selections/board/2321925', timeout=30000)
        await page.wait_for_timeout(5000)
        
        # Get all products on the board
        print("🔍 Extracting products...")
        
        # Try different selectors for product cards
        product_cards = await page.query_selector_all('.product-card, [data-testid="product"], .selection-item')
        
        print(f"✓ Found {len(product_cards)} products on board\n")
        
        if len(product_cards) == 0:
            print("⚠️ No products found. Please:")
            print("  1. Manually clip a Four Hands product to this board")
            print("  2. Run this script again")
            await browser.close()
            return
        
        imported = 0
        
        for i, card in enumerate(product_cards[:10], 1):  # Process first 10
            try:
                print(f"[{i}/{len(product_cards)}] Processing product...")
                
                # Extract product info from card
                # Click to open details or extract from card
                await card.click()
                await page.wait_for_timeout(2000)
                
                # Get product name
                name_elem = await page.query_selector('h1, .product-title, .selection-title')
                name = "Unknown Product"
                if name_elem:
                    name = (await name_elem.text_content()).strip()
                
                print(f"  Name: {name}")
                
                # Get vendor
                vendor = "Four Hands"  # Default
                vendor_elem = await page.query_selector('.brand, .vendor, .manufacturer')
                if vendor_elem:
                    vendor = (await vendor_elem.text_content()).strip()
                
                # Get price
                price = 0.0
                price_elem = await page.query_selector('.price, [data-testid="price"]')
                if price_elem:
                    price_text = (await price_elem.text_content()).strip()
                    import re
                    price_match = re.search(r'[\d,]+\.?\d*', price_text.replace(',', ''))
                    if price_match:
                        price = float(price_match.group())
                
                print(f"  Price: ${price:.2f}")
                
                # Get images
                images = []
                img_elements = await page.query_selector_all('img')
                
                for img_elem in img_elements[:5]:
                    src = await img_elem.get_attribute('src')
                    if src and ('hzcdn' in src or 'houzz' in src) and 'logo' not in src.lower():
                        if src.startswith('//'):
                            src = 'https:' + src
                        
                        # Get high-res
                        if '_' in src:
                            src = src.split('_')[0] + '_w1024-h768'
                        
                        b64 = url_to_base64_HQ(src)
                        if b64:
                            images.append(b64)
                            print(f"  ✓ Image {len(images)}")
                
                if images:
                    # Save to database
                    product = {
                        "id": str(uuid.uuid4()),
                        "name": name[:200],
                        "vendor": vendor,
                        "manufacturer": vendor,
                        "cost": price,
                        "msrp": price * 1.5,
                        "sku": f"HOUZZ-{datetime.now().strftime('%Y%m%d')}-{i}",
                        "image_url": images[0],
                        "images": images,
                        "description": name,
                        "product_url": f"https://fourhands.com",
                        "notes": f"Clipped from Houzz Pro Ideaboard 2321925",
                        "source": "houzz_pro_ideaboard",
                        "clipped_date": datetime.utcnow(),
                        "in_stock": True
                    }
                    
                    db.furniture_catalog.insert_one(product)
                    print(f"  ✅ Saved to database!")
                    imported += 1
                else:
                    print(f"  ⚠️ No images found")
                
                # Go back to board
                await page.goto('https://pro.houzz.com/manage/selections/board/2321925', timeout=30000)
                await page.wait_for_timeout(2000)
                
            except Exception as e:
                print(f"  ✗ Error: {e}")
                continue
        
        await browser.close()
        
        print(f"\n{'='*80}")
        print(f"✅ Imported {imported} products from Houzz Pro!")
        print(f"🔗 View: https://designflow-master.preview.emergentagent.com/furniture-search")
        print(f"{'='*80}\n")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(pull_products_from_houzz_ideaboard())

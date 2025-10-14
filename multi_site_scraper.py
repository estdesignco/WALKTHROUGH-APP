#!/usr/bin/env python3
"""
MULTI-SITE SCRAPER - Try multiple retail sites until we find good images!
"""
import pandas as pd
import pymongo
import requests
from bs4 import BeautifulSoup
import base64
from io import BytesIO
from PIL import Image
import uuid
from datetime import datetime
import time

client = pymongo.MongoClient('mongodb://localhost:27017')
db = client['furniture_tracker']

def url_to_base64_HQ(image_url):
    """Convert image to high quality base64"""
    try:
        headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'}
        r = requests.get(image_url, headers=headers, timeout=15)
        r.raise_for_status()
        
        img = Image.open(BytesIO(r.content))
        if img.mode != 'RGB':
            img = img.convert('RGB')
        
        # Only resize if HUGE
        if img.width > 1200 or img.height > 1200:
            img.thumbnail((1200, 1200), Image.Resampling.LANCZOS)
        
        buffer = BytesIO()
        img.save(buffer, format='JPEG', quality=95, optimize=False)
        img_bytes = buffer.getvalue()
        
        # Check if image is too small (error page)
        if len(img_bytes) < 5000:  # Less than 5KB = probably error
            return None
        
        return f"data:image/jpeg;base64,{base64.b64encode(img_bytes).decode()}"
    except:
        return None

def try_wayfair(sku, product_name):
    """Try Wayfair (they own Perigold but different domain)"""
    try:
        print(f"    🔍 Trying Wayfair...")
        url = f"https://www.wayfair.com/keyword.php?keyword={sku}"
        
        headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'}
        r = requests.get(url, headers=headers, timeout=15, allow_redirects=True)
        
        if r.status_code == 200 and '/product/' in r.url:
            print(f"      ✓ Found product!")
            soup = BeautifulSoup(r.content, 'html.parser')
            
            images = []
            for img in soup.find_all('img')[:20]:
                src = img.get('src') or img.get('data-src')
                if src and ('secure.img' in src or 'assets.wfcdn' in src):
                    if src.startswith('//'):
                        src = 'https:' + src
                    src = src.split('?')[0] + '?width=1200'
                    
                    b64 = url_to_base64_HQ(src)
                    if b64:
                        images.append(b64)
                        print(f"      ✓ Image {len(images)}")
                        if len(images) >= 5:
                            break
            
            if images:
                return {'images': images, 'source': 'Wayfair'}
        
        print(f"      ✗ No images")
        return None
    except Exception as e:
        print(f"      ✗ Error: {e}")
        return None

def try_furnitureland_south(sku, product_name):
    """Try Furnitureland South"""
    try:
        print(f"    🔍 Trying Furnitureland South...")
        url = f"https://www.furniturelandsouth.com/search?q={sku}"
        
        headers = {'User-Agent': 'Mozilla/5.0'}
        r = requests.get(url, headers=headers, timeout=15, allow_redirects=True)
        
        if r.status_code == 200:
            soup = BeautifulSoup(r.content, 'html.parser')
            
            # Find product links
            product_link = None
            for link in soup.find_all('a', href=True):
                if '/p/' in link['href'] or '/product/' in link['href']:
                    product_link = link['href']
                    if not product_link.startswith('http'):
                        product_link = 'https://www.furniturelandsouth.com' + product_link
                    break
            
            if product_link:
                print(f"      ✓ Found product page")
                time.sleep(2)
                r2 = requests.get(product_link, headers=headers, timeout=15)
                soup2 = BeautifulSoup(r2.content, 'html.parser')
                
                images = []
                for img in soup2.find_all('img')[:20]:
                    src = img.get('src') or img.get('data-src')
                    if src and 'product' in src.lower():
                        if src.startswith('//'):
                            src = 'https:' + src
                        elif src.startswith('/'):
                            src = 'https://www.furniturelandsouth.com' + src
                        
                        b64 = url_to_base64_HQ(src)
                        if b64:
                            images.append(b64)
                            print(f"      ✓ Image {len(images)}")
                            if len(images) >= 5:
                                break
                
                if images:
                    return {'images': images, 'source': 'Furnitureland South'}
        
        print(f"      ✗ No images")
        return None
    except Exception as e:
        print(f"      ✗ Error: {e}")
        return None

def try_houzz(sku, product_name):
    """Try Houzz marketplace"""
    try:
        print(f"    🔍 Trying Houzz...")
        # Search by brand + product name
        search_term = f"four hands {product_name}".replace(' ', '+')
        url = f"https://www.houzz.com/products/query/{search_term}"
        
        headers = {'User-Agent': 'Mozilla/5.0'}
        r = requests.get(url, headers=headers, timeout=15)
        
        if r.status_code == 200:
            soup = BeautifulSoup(r.content, 'html.parser')
            
            images = []
            for img in soup.find_all('img', {'data-src': True})[:10]:
                src = img['data-src']
                if 'product' in src or 'st.hzcdn' in src:
                    if src.startswith('//'):
                        src = 'https:' + src
                    
                    b64 = url_to_base64_HQ(src)
                    if b64:
                        images.append(b64)
                        print(f"      ✓ Image {len(images)}")
                        if len(images) >= 3:
                            break
            
            if images:
                return {'images': images, 'source': 'Houzz'}
        
        print(f"      ✗ No images")
        return None
    except Exception as e:
        print(f"      ✗ Error: {e}")
        return None

def try_1stdibs(sku, product_name):
    """Try 1stDibs"""
    try:
        print(f"    🔍 Trying 1stDibs...")
        search_term = f"four-hands-{sku}".replace(' ', '-').lower()
        url = f"https://www.1stdibs.com/search/?q={search_term}"
        
        headers = {'User-Agent': 'Mozilla/5.0'}
        r = requests.get(url, headers=headers, timeout=15)
        
        if r.status_code == 200:
            soup = BeautifulSoup(r.content, 'html.parser')
            
            images = []
            for img in soup.find_all('img')[:20]:
                src = img.get('src') or img.get('data-src')
                if src and ('cloudfront' in src or '1stdibs' in src):
                    if src.startswith('//'):
                        src = 'https:' + src
                    
                    b64 = url_to_base64_HQ(src)
                    if b64:
                        images.append(b64)
                        print(f"      ✓ Image {len(images)}")
                        if len(images) >= 3:
                            break
            
            if images:
                return {'images': images, 'source': '1stDibs'}
        
        print(f"      ✗ No images")
        return None
    except Exception as e:
        print(f"      ✗ Error: {e}")
        return None

def scrape_from_multiple_sites(sku, product_name):
    """Try multiple sites until we find good images"""
    
    # Try different sites in order
    scrapers = [
        try_wayfair,
        try_furnitureland_south,
        try_houzz,
        try_1stdibs,
    ]
    
    for scraper in scrapers:
        result = scraper(sku, product_name)
        if result and result['images']:
            return result
        time.sleep(3)  # Delay between different sites
    
    return None

print("\n🌐 MULTI-SITE SCRAPER - Try ALL retail sites!\n")

df1 = pd.read_excel('/app/fourhands_catalog.xlsx', sheet_name='PRICE CHANGE')
df2 = pd.read_excel('/app/fourhands_catalog.xlsx', sheet_name='NO CHANGE')
df1.rename(columns={'NEW COST': 'COST'}, inplace=True)
df = pd.concat([df1, df2])
df_stock = df[df['STATUS'].str.contains('In Stk', na=False)].reset_index(drop=True)

print(f"Testing 3 products across multiple sites\n")

success = 0
for i in range(3):
    row = df_stock.iloc[i]
    
    sku = str(row['PRODUCT MASTER CODE']).strip()
    name = str(row['DESCRIPTION']).strip()
    cost = float(row['COST'])
    
    print(f"\n{'='*70}")
    print(f"[{i+1}/3] {name}")
    print(f"{'='*70}")
    print(f"  SKU: {sku} | Cost: ${cost:.2f}")
    
    scraped = scrape_from_multiple_sites(sku, name)
    
    if scraped and scraped['images']:
        print(f"\n  ✅ SUCCESS from {scraped['source']}! {len(scraped['images'])} images")
        
        product = {
            "id": str(uuid.uuid4()),
            "name": name[:200],
            "vendor": "Four Hands",
            "sku": sku,
            "cost": cost,
            "msrp": cost * 1.5,
            "image_url": scraped['images'][0],
            "images": scraped['images'],
            "product_url": f"https://fourhands.com/search?q={sku}",
            "notes": f"Images from {scraped['source']}",
            "source": f"multi_site_{scraped['source'].lower().replace(' ', '_')}",
            "clipped_date": datetime.utcnow()
        }
        
        existing = db.furniture_catalog.find_one({"sku": sku, "vendor": "Four Hands"})
        if existing:
            db.furniture_catalog.update_one({"_id": existing['_id']}, {"$set": product})
        else:
            db.furniture_catalog.insert_one(product)
        
        success += 1
    else:
        print(f"\n  ❌ FAILED - No images found on any site")

print(f"\n{'='*70}")
print(f"✅ {success}/3 succeeded with HIGH QUALITY images!")
print(f"View: https://designhub-74.preview.emergentagent.com/furniture-search\n")

client.close()

#!/usr/bin/env python3
"""
HIGH QUALITY IMAGE IMPORT
- Get FULL SIZE images (no thumbnailing!)
- Minimal compression
- Scrape dimensions properly
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
import re

client = pymongo.MongoClient('mongodb://localhost:27017')
db = client['furniture_tracker']

def url_to_base64_HIGH_QUALITY(image_url):
    """Get FULL SIZE image with minimal compression"""
    try:
        headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'}
        r = requests.get(image_url, headers=headers, timeout=15)
        r.raise_for_status()
        img = Image.open(BytesIO(r.content))
        if img.mode != 'RGB':
            img = img.convert('RGB')
        
        # KEEP LARGE SIZE - only limit if HUGE
        if img.width > 1200 or img.height > 1200:
            img.thumbnail((1200, 1200), Image.Resampling.LANCZOS)
        
        buffer = BytesIO()
        img.save(buffer, format='JPEG', quality=95, optimize=False)  # HIGH QUALITY!
        img_bytes = buffer.getvalue()
        
        return f"data:image/jpeg;base64,{base64.b64encode(img_bytes).decode()}"
    except Exception as e:
        print(f"        ✗ Error: {e}")
        return None

def scrape_perigold_HIGH_QUALITY(sku):
    """Get HIGH RES images and all product details"""
    try:
        url = f"https://www.perigold.com/keyword.php?keyword={sku}"
        print(f"    🔍 Perigold: {sku}")
        
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
        }
        
        r = requests.get(url, headers=headers, timeout=15, allow_redirects=True)
        
        if r.status_code != 200 or '/pdp/' not in r.url:
            print(f"      ✗ No product page")
            return None
        
        print(f"      ✓ Found product page!")
        soup = BeautifulSoup(r.content, 'html.parser')
        
        # Get HIGH RES images
        images = []
        
        # Look for high-res image URLs
        for img in soup.find_all('img'):
            src = img.get('src') or img.get('data-src')
            if not src:
                continue
            
            # Only get product images from CDN
            if 'secure.img' in src or 'assets.wfcdn' in src:
                if src.startswith('//'):
                    src = 'https:' + src
                
                # Remove size constraints to get FULL SIZE
                if '?' in src:
                    base_src = src.split('?')[0]
                else:
                    base_src = src
                
                # Request LARGE version (1200px width)
                high_res_src = base_src + '?width=1200&quality=95'
                
                print(f"      📸 Getting HIGH-RES image...")
                b64 = url_to_base64_HIGH_QUALITY(high_res_src)
                if b64:
                    images.append(b64)
                    print(f"      ✓ Got image {len(images)} (HIGH QUALITY)")
                    if len(images) >= 5:
                        break
        
        if not images:
            print(f"      ✗ No images found")
            return None
        
        # Get dimensions
        dimensions = ""
        text = soup.get_text()
        
        # Look for dimension patterns
        dim_patterns = [
            r'(\d+(?:\.\d+)?)"?\s*W\s*[xX×]\s*(\d+(?:\.\d+)?)"?\s*D\s*[xX×]\s*(\d+(?:\.\d+)?)"?\s*H',
            r'(\d+(?:\.\d+)?)\s*W\s*[xX×]\s*(\d+(?:\.\d+)?)\s*D\s*[xX×]\s*(\d+(?:\.\d+)?)\s*H',
            r'Dimensions?[:\s]+([^\n]+(?:W|H|D)[^\n]+)',
        ]
        
        for pattern in dim_patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                if len(match.groups()) == 3:
                    w, d, h = match.groups()
                    dimensions = f'{w}"W x {d}"D x {h}"H'
                else:
                    dimensions = match.group(1).strip()
                break
        
        # Get description
        desc = ''
        desc_selectors = [
            'div[class*="description"]',
            'div[class*="Description"]',
            'div[itemprop="description"]'
        ]
        for sel in desc_selectors:
            elem = soup.select_one(sel)
            if elem:
                desc = elem.get_text(strip=True)[:500]
                break
        
        # Get material/finish
        material = ""
        material_patterns = [
            r'Material[:\s]+([^\n]+)',
            r'Finish[:\s]+([^\n]+)',
            r'Fabric[:\s]+([^\n]+)'
        ]
        for pattern in material_patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                material = match.group(1).strip()[:200]
                break
        
        print(f"      ✓ Images: {len(images)} (HIGH QUALITY)")
        print(f"      ✓ Dimensions: {dimensions or 'Not found'}")
        
        return {
            'images': images,
            'description': desc,
            'dimensions': dimensions,
            'materials': material
        }
        
    except Exception as e:
        print(f"      ✗ Error: {e}")
        return None

print("\n🎯 HIGH QUALITY IMAGE IMPORT\n")

df1 = pd.read_excel('/app/fourhands_catalog.xlsx', sheet_name='PRICE CHANGE')
df2 = pd.read_excel('/app/fourhands_catalog.xlsx', sheet_name='NO CHANGE')
df1.rename(columns={'NEW COST': 'COST'}, inplace=True)
df = pd.concat([df1, df2])
df_stock = df[df['STATUS'].str.contains('In Stk', na=False)].reset_index(drop=True)

print(f"Testing with first 5 products - HIGH QUALITY\n")

success = 0
for i in range(5):
    row = df_stock.iloc[i]
    
    sku = str(row['PRODUCT MASTER CODE']).strip()
    name = str(row['DESCRIPTION']).strip()
    cost = float(row['COST'])
    category = str(row.get('Category', 'Furniture'))
    
    print(f"\n{'='*70}")
    print(f"[{i+1}/5] {name}")
    print(f"{'='*70}")
    print(f"  SKU: {sku} | Cost: ${cost:.2f}")
    
    fourhands_link = f"https://fourhands.com/search?q={sku}"
    
    scraped = scrape_perigold_HIGH_QUALITY(sku)
    
    if not scraped or not scraped['images']:
        print(f"\n  ⚠️ Skipping - no high quality images found")
        continue
    
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
        "image_url": scraped['images'][0],
        "images": scraped['images'],
        "description": scraped.get('description', name),
        "dimensions": scraped.get('dimensions', ''),
        "materials": scraped.get('materials', ''),
        "finish_color": scraped.get('materials', ''),
        "product_url": fourhands_link,
        "notes": f"HIGH QUALITY images from Perigold",
        "source": "high_quality_import",
        "clipped_date": datetime.utcnow(),
        "in_stock": True
    }
    
    existing = db.furniture_catalog.find_one({"sku": sku, "vendor": "Four Hands"})
    if existing:
        db.furniture_catalog.update_one({"_id": existing['_id']}, {"$set": product})
    else:
        db.furniture_catalog.insert_one(product)
    
    print(f"\n  ✅ SUCCESS - {len(scraped['images'])} HIGH QUALITY images!")
    success += 1
    time.sleep(3)

print(f"\n{'='*70}")
print(f"✅ {success}/5 imported with HIGH QUALITY images!")
print(f"Check the frontend - images should be CRISP and CLEAR now!\n")

client.close()

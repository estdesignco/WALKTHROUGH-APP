#!/usr/bin/env python3
"""
PROOF OF CONCEPT - Just test with 5 products first!
"""
import pandas as pd
import pymongo
import requests
from bs4 import BeautifulSoup
import base64
from io import BytesIO
from PIL import Image
import time
import uuid
from datetime import datetime
import re

client = pymongo.MongoClient('mongodb://localhost:27017')
db = client['furniture_tracker']

def url_to_base64(image_url):
    try:
        headers = {'User-Agent': 'Mozilla/5.0'}
        r = requests.get(image_url, headers=headers, timeout=15)
        r.raise_for_status()
        img = Image.open(BytesIO(r.content))
        if img.mode != 'RGB':
            img = img.convert('RGB')
        img.thumbnail((400,400), Image.Resampling.LANCZOS)
        buffer = BytesIO()
        img.save(buffer, format='JPEG', quality=85)
        return f"data:image/jpeg;base64,{base64.b64encode(buffer.getvalue()).decode()}"
    except:
        return None

def scrape_product(sku):
    try:
        url = f"https://fourhands.com/search?q={sku}"
        print(f"    Searching: {url}")
        r = requests.get(url, headers={'User-Agent': 'Mozilla/5.0'}, timeout=15)
        soup = BeautifulSoup(r.content, 'html.parser')
        
        # Find product link
        link = soup.select_one('a[href*="/products/"]')
        if not link:
            return None
        
        prod_url = link.get('href')
        if not prod_url.startswith('http'):
            prod_url = 'https://fourhands.com' + prod_url
        
        print(f"    Found: {prod_url[:50]}...")
        time.sleep(2)
        
        # Get product page
        r = requests.get(prod_url, headers={'User-Agent': 'Mozilla/5.0'}, timeout=15)
        soup = BeautifulSoup(r.content, 'html.parser')
        
        # Get images
        images = []
        for img in soup.select('.product-single__photo img, .product-gallery img')[:5]:
            src = img.get('src') or img.get('data-src')
            if src:
                if src.startswith('//'):
                    src = 'https:' + src
                elif src.startswith('/'):
                    src = 'https://fourhands.com' + src
                src = re.sub(r'\?.*$', '', src) + '?width=800'
                print(f"      Converting image...")
                b64 = url_to_base64(src)
                if b64:
                    images.append(b64)
                    print(f"      Done!")
        
        # Get description
        desc = ''
        desc_elem = soup.select_one('.product-description, .product-single__description')
        if desc_elem:
            desc = desc_elem.get_text(strip=True)[:500]
        
        return {'images': images, 'description': desc}
    except Exception as e:
        print(f"    Error: {e}")
        return None

# Main
print("\n🧪 PROOF OF CONCEPT - Testing 5 products\n")

df1 = pd.read_excel('/app/fourhands_catalog.xlsx', sheet_name='PRICE CHANGE')
df2 = pd.read_excel('/app/fourhands_catalog.xlsx', sheet_name='NO CHANGE')
df1.rename(columns={'NEW COST': 'COST'}, inplace=True)
df = pd.concat([df1, df2])
df_stock = df[df['STATUS'].str.contains('In Stk', na=False)].reset_index(drop=True)

print(f"Total: {len(df)} | In Stock: {len(df_stock)}\n")

success = 0
for i in range(5):
    row = df_stock.iloc[i]
    sku = str(row['PRODUCT MASTER CODE']).strip()
    name = str(row['DESCRIPTION']).strip()
    cost = float(row['COST'])
    
    print(f"[{i+1}/5] {name}")
    print(f"  SKU: {sku} | Cost: ${cost:.2f}")
    
    data = scrape_product(sku)
    if not data or not data['images']:
        print(f"  FAILED\n")
        continue
    
    product = {
        "id": str(uuid.uuid4()),
        "name": name[:200],
        "vendor": "Four Hands",
        "sku": sku,
        "cost": cost,
        "image_url": data['images'][0],
        "images": data['images'],
        "description": data['description'],
        "source": "proof_of_concept",
        "clipped_date": datetime.utcnow()
    }
    
    existing = db.furniture_catalog.find_one({"sku": sku, "vendor": "Four Hands"})
    if existing:
        db.furniture_catalog.update_one({"_id": existing['_id']}, {"$set": product})
    else:
        db.furniture_catalog.insert_one(product)
    
    print(f"  SUCCESS! {len(data['images'])} images\n")
    success += 1
    time.sleep(3)

print(f"\n🎉 Done! {success}/5 succeeded")
print(f"Check: https://designhub-74.preview.emergentagent.com/furniture-search\n")
client.close()

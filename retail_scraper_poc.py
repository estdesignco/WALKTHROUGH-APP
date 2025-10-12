#!/usr/bin/env python3
"""
PROOF OF CONCEPT - The RIGHT WAY!
Excel (Four Hands) → SKU, Name, Price
Retail Sites (Furnitureland South, Perigold) → Real Images
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
        headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'}
        r = requests.get(image_url, headers=headers, timeout=15)
        r.raise_for_status()
        img = Image.open(BytesIO(r.content))
        if img.mode != 'RGB':
            img = img.convert('RGB')
        img.thumbnail((500, 500), Image.Resampling.LANCZOS)
        buffer = BytesIO()
        img.save(buffer, format='JPEG', quality=85)
        return f"data:image/jpeg;base64,{base64.b64encode(buffer.getvalue()).decode()}"
    except Exception as e:
        print(f"        Image error: {e}")
        return None

def search_furnitureland_south(sku, product_name):
    """Search Furnitureland South for product"""
    try:
        # Try SKU search
        search_url = f"https://www.furniturelandsouth.com/search?q={sku}"
        print(f"    🔍 Furnitureland South: {search_url}")
        
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
        }
        
        r = requests.get(search_url, headers=headers, timeout=15)
        if r.status_code != 200:
            print(f"      ✗ Status {r.status_code}")
            return None
        
        soup = BeautifulSoup(r.content, 'html.parser')
        
        # Find product link
        product_link = None
        for link in soup.find_all('a', href=True):
            if '/p/' in link['href'] or '/product/' in link['href']:
                product_link = link['href']
                if not product_link.startswith('http'):
                    product_link = 'https://www.furniturelandsouth.com' + product_link
                break
        
        if not product_link:
            print(f"      ✗ No product found")
            return None
        
        print(f"      ✓ Found product page")
        time.sleep(2)
        
        # Get product page
        r = requests.get(product_link, headers=headers, timeout=15)
        soup = BeautifulSoup(r.content, 'html.parser')
        
        # Get images
        images = []
        for img in soup.find_all('img', src=True):
            src = img['src']
            if 'product' in src.lower() or 'item' in src.lower():
                if src.startswith('//'):
                    src = 'https:' + src
                elif src.startswith('/'):
                    src = 'https://www.furniturelandsouth.com' + src
                
                print(f"      Converting image...")
                b64 = url_to_base64(src)
                if b64:
                    images.append(b64)
                    print(f"      ✓ Got image!")
                    if len(images) >= 3:  # Limit to 3 images
                        break
        
        if not images:
            return None
        
        return {'images': images, 'source': 'Furnitureland South'}
        
    except Exception as e:
        print(f"      ✗ Error: {e}")
        return None

def search_perigold(sku, product_name):
    """Search Perigold for product"""
    try:
        # Perigold search
        search_url = f"https://www.perigold.com/keyword.php?keyword={sku}"
        print(f"    🔍 Perigold: {search_url}")
        
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
        }
        
        r = requests.get(search_url, headers=headers, timeout=15)
        if r.status_code != 200:
            print(f"      ✗ Status {r.status_code}")
            return None
        
        soup = BeautifulSoup(r.content, 'html.parser')
        
        # Find product
        product_link = None
        for link in soup.find_all('a', href=True):
            href = link['href']
            if '/product/' in href or 'item' in href:
                product_link = href
                if not product_link.startswith('http'):
                    product_link = 'https://www.perigold.com' + product_link
                break
        
        if not product_link:
            print(f"      ✗ No product found")
            return None
        
        print(f"      ✓ Found product page")
        time.sleep(2)
        
        r = requests.get(product_link, headers=headers, timeout=15)
        soup = BeautifulSoup(r.content, 'html.parser')
        
        # Get images
        images = []
        for img in soup.find_all('img'):
            src = img.get('src') or img.get('data-src')
            if src and ('product' in src.lower() or 'item' in src.lower()):
                if src.startswith('//'):
                    src = 'https:' + src
                
                print(f"      Converting image...")
                b64 = url_to_base64(src)
                if b64:
                    images.append(b64)
                    print(f"      ✓ Got image!")
                    if len(images) >= 3:
                        break
        
        if not images:
            return None
        
        return {'images': images, 'source': 'Perigold'}
        
    except Exception as e:
        print(f"      ✗ Error: {e}")
        return None

print("\n🧪 PROOF OF CONCEPT - Retail Site Scraping\n")
print("Excel (Four Hands) → SKU, Price")
print("Retail Sites → Real Images\n")

# Load catalog
df1 = pd.read_excel('/app/fourhands_catalog.xlsx', sheet_name='PRICE CHANGE')
df2 = pd.read_excel('/app/fourhands_catalog.xlsx', sheet_name='NO CHANGE')
df1.rename(columns={'NEW COST': 'COST'}, inplace=True)
df = pd.concat([df1, df2])
df_stock = df[df['STATUS'].str.contains('In Stk', na=False)].reset_index(drop=True)

print(f"📊 {len(df_stock)} in-stock products")
print(f"🎯 Testing with 5 products\n")

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
    
    # Try Furnitureland South first
    scraped = search_furnitureland_south(sku, name)
    
    # If that fails, try Perigold
    if not scraped:
        scraped = search_perigold(sku, name)
    
    if not scraped or not scraped['images']:
        print(f"\n  ❌ FAILED - No images found on retail sites")
        continue
    
    print(f"\n  ✅ SUCCESS! Found {len(scraped['images'])} images from {scraped['source']}")
    
    # Save to database
    product = {
        "id": str(uuid.uuid4()),
        "name": name[:200],
        "vendor": "Four Hands",
        "sku": sku,
        "cost": cost,
        "category": category,
        "image_url": scraped['images'][0],
        "images": scraped['images'],
        "description": name,
        "notes": f"Images from {scraped['source']}",
        "source": "retail_site_scrape",
        "clipped_date": datetime.utcnow()
    }
    
    existing = db.furniture_catalog.find_one({"sku": sku, "vendor": "Four Hands"})
    if existing:
        db.furniture_catalog.update_one({"_id": existing['_id']}, {"$set": product})
    else:
        db.furniture_catalog.insert_one(product)
    
    success += 1
    time.sleep(3)

print(f"\n\n{'='*70}")
print(f"🎉 PROOF OF CONCEPT COMPLETE!")
print(f"{'='*70}")
print(f"✅ Success: {success}/5")
print(f"\nIf this works, we can scale to thousands!")
print(f"View: https://designflow-master.preview.emergentagent.com/furniture-search\n")

client.close()

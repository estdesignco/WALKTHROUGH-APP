#!/usr/bin/env python3
"""
Use Google to find Four Hands products on ANY site with images
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
    try:
        headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'}
        r = requests.get(image_url, headers=headers, timeout=15)
        r.raise_for_status()
        
        img = Image.open(BytesIO(r.content))
        original_size = len(r.content)
        print(f"        Original: {original_size/1024:.1f} KB, {img.width}x{img.height}px")
        
        if img.mode != 'RGB':
            img = img.convert('RGB')
        
        # Don't resize - keep original!
        buffer = BytesIO()
        img.save(buffer, format='JPEG', quality=95, optimize=False)
        img_bytes = buffer.getvalue()
        
        if len(img_bytes) < 10000:  # Less than 10KB
            return None
        
        base64_str = base64.b64encode(img_bytes).decode()
        print(f"        Final: {len(img_bytes)/1024:.1f} KB base64")
        
        return f"data:image/jpeg;base64,{base64_str}"
    except Exception as e:
        print(f"        Error: {e}")
        return None

def google_search_images(sku, product_name):
    """Use Google to find product on retail sites"""
    try:
        print(f"    🔍 Google Search: Four Hands {sku}")
        
        # Search specifically for retail sites
        search_query = f"four hands {sku} site:wayfair.com OR site:houzz.com OR site:furniturelandsouth.com"
        url = f"https://www.google.com/search?q={search_query.replace(' ', '+')}&tbm=isch"
        
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': 'text/html,application/xhtml+xml'
        }
        
        r = requests.get(url, headers=headers, timeout=15)
        
        if r.status_code == 200:
            # Extract image URLs from Google Images
            import re
            img_urls = re.findall(r'https://[^"]+\.(jpg|jpeg|png|webp)', r.text)
            
            images = []
            for img_url in img_urls[:10]:  # Try first 10
                if any(site in img_url for site in ['wayfair', 'houzz', 'furniture', 'wfcdn', 'hzcdn']):
                    print(f"      📸 Trying: {img_url[:80]}...")
                    b64 = url_to_base64_HQ(img_url)
                    if b64:
                        images.append(b64)
                        print(f"      ✓ Got image {len(images)}")
                        if len(images) >= 3:
                            break
            
            if images:
                return {'images': images, 'source': 'Google Search'}
        
        return None
    except Exception as e:
        print(f"      ✗ Error: {e}")
        return None

# Just test with 1 product
df1 = pd.read_excel('/app/fourhands_catalog.xlsx', sheet_name='PRICE CHANGE')
df2 = pd.read_excel('/app/fourhands_catalog.xlsx', sheet_name='NO CHANGE')
df1.rename(columns={'NEW COST': 'COST'}, inplace=True)
df = pd.concat([df1, df2])
df_stock = df[df['STATUS'].str.contains('In Stk', na=False)].reset_index(drop=True)

row = df_stock.iloc[0]
sku = str(row['PRODUCT MASTER CODE']).strip()
name = str(row['DESCRIPTION']).strip()

print(f"\nTesting Google Image Search")
print(f"Product: {name}")
print(f"SKU: {sku}\n")

result = google_search_images(sku, name)

if result:
    print(f"\n✅ Found {len(result['images'])} images!")
else:
    print(f"\n❌ No images found")

client.close()

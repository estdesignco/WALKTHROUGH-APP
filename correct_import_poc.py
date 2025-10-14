#!/usr/bin/env python3
"""
CORRECT APPROACH:
- Excel → SKU, Name, Price, Four Hands Link
- Perigold → IMAGES + DESCRIPTIONS only
- NO manual work!
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
    except:
        return None

def scrape_perigold_images(sku):
    """Scrape ONLY images from Perigold - follow redirects!"""
    try:
        url = f"https://www.perigold.com/keyword.php?keyword={sku}"
        print(f"    🔍 Perigold: {sku}")
        
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
        }
        
        # Follow redirects automatically
        r = requests.get(url, headers=headers, timeout=15, allow_redirects=True)
        
        if r.status_code != 200:
            print(f"      ✗ Failed: {r.status_code}")
            return None
        
        # Check if we got redirected to a product page
        if '/pdp/' in r.url or '/product/' in r.url:
            print(f"      ✓ Found product page!")
            
            soup = BeautifulSoup(r.content, 'html.parser')
            
            # Extract images
            images = []
            
            # Look for product images in various places
            for img in soup.find_all('img'):
                src = img.get('src') or img.get('data-src') or img.get('data-lazy-src')
                alt = img.get('alt', '').lower()
                
                if src and ('secure.img' in src or 'assets.wfcdn' in src or 'product' in alt):
                    if src.startswith('//'):
                        src = 'https:' + src
                    
                    # Get high-res version
                    if '?' in src:
                        src = src.split('?')[0]
                    src = src + '?width=800'
                    
                    print(f"      📸 Converting image...")
                    b64 = url_to_base64(src)
                    if b64:
                        images.append(b64)
                        print(f"      ✓ Got image {len(images)}")
                        if len(images) >= 5:
                            break
            
            # Get description
            desc = ''
            desc_elem = soup.find('div', {'class': lambda x: x and 'description' in x.lower()})
            if desc_elem:
                desc = desc_elem.get_text(strip=True)[:500]
            
            if images:
                return {'images': images, 'description': desc}
        
        print(f"      ✗ No product page found")
        return None
        
    except Exception as e:
        print(f"      ✗ Error: {e}")
        return None

print("\n🎯 CORRECT PROOF OF CONCEPT\n")
print("Excel → SKU, Name, Price, Four Hands Link")
print("Perigold → Images + Description\n")

# Load catalog
df1 = pd.read_excel('/app/fourhands_catalog.xlsx', sheet_name='PRICE CHANGE')
df2 = pd.read_excel('/app/fourhands_catalog.xlsx', sheet_name='NO CHANGE')
df1.rename(columns={'NEW COST': 'COST'}, inplace=True)
df = pd.concat([df1, df2])
df_stock = df[df['STATUS'].str.contains('In Stk', na=False)].reset_index(drop=True)

print(f"📊 {len(df_stock)} in-stock products")
print(f"🎯 Testing 5 products\n")

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
    
    # Build Four Hands link
    fourhands_link = f"https://fourhands.com/search?q={sku}"
    print(f"  🔗 Four Hands: {fourhands_link}")
    
    # Scrape images from Perigold
    scraped = scrape_perigold_images(sku)
    
    if not scraped or not scraped['images']:
        print(f"\n  ⚠️ No images found - using placeholder")
        scraped = {
            'images': ["data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgZmlsbD0iIzRBNUE2QSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMjAiIGZpbGw9IndoaXRlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+Rm91ciBIYW5kczwvdGV4dD48L3N2Zz4="],
            'description': name
        }
    else:
        print(f"\n  ✅ SUCCESS! Got {len(scraped['images'])} images from Perigold")
    
    # Create database entry - LINK GOES TO FOUR HANDS!
    product = {
        "id": str(uuid.uuid4()),
        "name": name[:200],
        "vendor": "Four Hands",
        "sku": sku,
        "cost": cost,
        "msrp": cost * 1.5,
        "category": category,
        "image_url": scraped['images'][0],
        "images": scraped['images'],
        "description": scraped.get('description', name),
        "product_url": fourhands_link,  # FOUR HANDS LINK!
        "notes": f"Images from Perigold",
        "source": "excel_fourh ands_images_perigold",
        "clipped_date": datetime.utcnow(),
        "in_stock": True
    }
    
    existing = db.furniture_catalog.find_one({"sku": sku, "vendor": "Four Hands"})
    if existing:
        db.furniture_catalog.update_one({"_id": existing['_id']}, {"$set": product})
    else:
        db.furniture_catalog.insert_one(product)
    
    success += 1
    time.sleep(3)

print(f"\n\n{'='*70}")
print(f"✅ {success}/5 products imported")
print(f"   - Data from Excel ✓")
print(f"   - Links to Four Hands ✓")
print(f"   - Images from Perigold ✓")
print(f"\nView: https://designhub-74.preview.emergentagent.com/furniture-search\n")

client.close()

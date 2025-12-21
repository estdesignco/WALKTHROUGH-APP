#!/usr/bin/env python3
"""
THOROUGH IMPORT - EVERY PAGE, EVERY ITEM
Gabby, Summer Classics, Loloi, Rowe
"""

import asyncio
import os
import re
import pdfplumber
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime, timezone
from uuid import uuid4

MONGO_URL = os.environ.get('MONGO_URL')
DB_NAME = 'interior_design_db'

def clean_price(val):
    if not val:
        return None
    s = str(val).strip()
    match = re.search(r'\$?([\d,]+\.?\d*)', s)
    if match:
        s = match.group(1).replace(',', '')
        try:
            price = float(s)
            return price if 0 < price < 100000 else None
        except:
            return None
    return None

def clean_sku(val):
    if not val:
        return None
    s = str(val).strip().upper()
    s = re.sub(r'^\*+', '', s).strip()
    if len(s) < 3 or len(s) > 30:
        return None
    if s.lower() in ['nan', 'none', '', 'sku', 'item', 'item #', 'no.', 'number', 'code', 
                     'description', 'price', 'map', 'msrp', 'total', 'design', 'brand']:
        return None
    return s

async def get_db():
    client = AsyncIOMotorClient(MONGO_URL)
    return client[DB_NAME]

def process_gabby_casegoods(filepath):
    """Process Gabby Case Goods - 18 pages"""
    products = []
    print(f"\n📕 Processing Gabby Case Goods: {filepath}")
    
    with pdfplumber.open(filepath) as pdf:
        print(f"   Total pages: {len(pdf.pages)}")
        
        for page_num, page in enumerate(pdf.pages, 1):
            tables = page.extract_tables()
            
            for table in tables:
                if not table:
                    continue
                    
                for row in table:
                    if not row or len(row) < 3:
                        continue
                    
                    # Gabby format: SKU, Description, MAP Price
                    sku = clean_sku(row[0])
                    if not sku:
                        continue
                    
                    name = str(row[1]).strip() if len(row) > 1 and row[1] else ''
                    
                    # Find price (usually last column with $)
                    price = None
                    for cell in reversed(row):
                        if cell and '$' in str(cell):
                            price = clean_price(cell)
                            if price:
                                break
                    
                    if not price:
                        # Try any numeric value
                        for cell in reversed(row):
                            price = clean_price(cell)
                            if price and price > 50:
                                break
                    
                    products.append({
                        'id': str(uuid4()),
                        'sku': sku,
                        'name': f"Gabby {name}" if name else f"Gabby {sku}",
                        'price': price,
                        'vendor_code': 'gabby',
                        'vendor_name': 'Gabby',
                        'vendor': 'Gabby',
                        'source_file': os.path.basename(filepath),
                        'source_page': page_num,
                        'imported_at': datetime.now(timezone.utc).isoformat()
                    })
            
            print(f"   Page {page_num}: {sum(1 for p in products if p.get('source_page') == page_num)} items")
    
    priced = sum(1 for p in products if p.get('price'))
    print(f"   ✓ Total: {len(products)} products ({priced} priced)")
    return products

def process_gabby_upholstery(filepath):
    """Process Gabby Upholstery - 80 pages"""
    products = []
    print(f"\n📕 Processing Gabby Upholstery: {filepath}")
    
    with pdfplumber.open(filepath) as pdf:
        print(f"   Total pages: {len(pdf.pages)}")
        
        for page_num, page in enumerate(pdf.pages, 1):
            tables = page.extract_tables()
            
            for table in tables:
                if not table:
                    continue
                    
                for row in table:
                    if not row or len(row) < 2:
                        continue
                    
                    sku = clean_sku(row[0])
                    if not sku:
                        continue
                    
                    name = str(row[1]).strip() if len(row) > 1 and row[1] else ''
                    
                    price = None
                    for cell in reversed(row):
                        price = clean_price(cell)
                        if price and price > 50:
                            break
                    
                    products.append({
                        'id': str(uuid4()),
                        'sku': sku,
                        'name': f"Gabby {name}" if name else f"Gabby {sku}",
                        'price': price,
                        'vendor_code': 'gabby',
                        'vendor_name': 'Gabby',
                        'vendor': 'Gabby',
                        'source_file': os.path.basename(filepath),
                        'source_page': page_num,
                        'imported_at': datetime.now(timezone.utc).isoformat()
                    })
            
            if page_num % 10 == 0:
                print(f"   Progress: {page_num}/{len(pdf.pages)} pages")
    
    priced = sum(1 for p in products if p.get('price'))
    print(f"   ✓ Total: {len(products)} products ({priced} priced)")
    return products

def process_summer_classics_pillow(filepath):
    """Process Summer Classics & Gabby Pillow MAP - 61 pages"""
    products = []
    print(f"\n📕 Processing Summer Classics/Gabby Pillow: {filepath}")
    
    with pdfplumber.open(filepath) as pdf:
        print(f"   Total pages: {len(pdf.pages)}")
        
        current_vendor = 'Summer Classics'  # Default
        
        for page_num, page in enumerate(pdf.pages, 1):
            text = page.extract_text() or ''
            
            # Detect which vendor section we're in
            if 'SUMMER CLASSICS' in text.upper():
                current_vendor = 'Summer Classics'
            elif 'GABBY' in text.upper() and 'INDOOR' in text.upper():
                current_vendor = 'Gabby'
            
            tables = page.extract_tables()
            
            for table in tables:
                if not table:
                    continue
                    
                for row in table:
                    if not row or len(row) < 2:
                        continue
                    
                    sku = clean_sku(row[0])
                    if not sku:
                        continue
                    
                    name = str(row[1]).strip() if len(row) > 1 and row[1] else ''
                    
                    price = None
                    for cell in reversed(row):
                        price = clean_price(cell)
                        if price and price > 10:
                            break
                    
                    vendor_code = 'summer_classics' if current_vendor == 'Summer Classics' else 'gabby'
                    
                    products.append({
                        'id': str(uuid4()),
                        'sku': sku,
                        'name': f"{current_vendor} {name}" if name else f"{current_vendor} {sku}",
                        'price': price,
                        'vendor_code': vendor_code,
                        'vendor_name': current_vendor,
                        'vendor': current_vendor,
                        'source_file': os.path.basename(filepath),
                        'source_page': page_num,
                        'imported_at': datetime.now(timezone.utc).isoformat()
                    })
            
            if page_num % 10 == 0:
                print(f"   Progress: {page_num}/{len(pdf.pages)} pages")
    
    priced = sum(1 for p in products if p.get('price'))
    sc_count = sum(1 for p in products if p.get('vendor_code') == 'summer_classics')
    gabby_count = sum(1 for p in products if p.get('vendor_code') == 'gabby')
    print(f"   ✓ Total: {len(products)} products ({priced} priced)")
    print(f"      Summer Classics: {sc_count}, Gabby: {gabby_count}")
    return products

def process_loloi(filepath):
    """Process Loloi - 52 pages"""
    products = []
    print(f"\n📕 Processing Loloi: {filepath}")
    
    with pdfplumber.open(filepath) as pdf:
        print(f"   Total pages: {len(pdf.pages)}")
        
        for page_num, page in enumerate(pdf.pages, 1):
            tables = page.extract_tables()
            
            for table in tables:
                if not table:
                    continue
                    
                for row in table:
                    if not row or len(row) < 4:
                        continue
                    
                    # Loloi format varies - find SKU-like value
                    sku = None
                    for cell in row:
                        s = clean_sku(cell)
                        if s and len(s) >= 3:
                            # Skip headers
                            if s not in ['DESIGN', 'BRAND', 'COLLECTION', 'SIZE', 'MSRP', 'MAP', 'CONSTRUCTION']:
                                sku = s
                                break
                    
                    if not sku:
                        continue
                    
                    # Find collection/name
                    name = ''
                    for cell in row:
                        if cell and str(cell).strip() != sku:
                            s = str(cell).strip()
                            if len(s) > 3 and not clean_price(s) and s.upper() not in ['HAND TUFTED', 'MACHINE MADE', 'HAND KNOTTED']:
                                name = s
                                break
                    
                    # Find MAP price (usually marked as MAP)
                    price = None
                    for i, cell in enumerate(row):
                        if cell:
                            p = clean_price(cell)
                            if p and p > 20 and p < 10000:
                                price = p
                                break
                    
                    products.append({
                        'id': str(uuid4()),
                        'sku': sku,
                        'name': f"Loloi {name}" if name else f"Loloi {sku}",
                        'price': price,
                        'vendor_code': 'loloi',
                        'vendor_name': 'Loloi',
                        'vendor': 'Loloi',
                        'source_file': os.path.basename(filepath),
                        'source_page': page_num,
                        'imported_at': datetime.now(timezone.utc).isoformat()
                    })
            
            if page_num % 10 == 0:
                print(f"   Progress: {page_num}/{len(pdf.pages)} pages")
    
    priced = sum(1 for p in products if p.get('price'))
    print(f"   ✓ Total: {len(products)} products ({priced} priced)")
    return products

def process_rowe(filepath):
    """Process Rowe - 415 pages"""
    products = []
    print(f"\n📕 Processing Rowe: {filepath}")
    
    with pdfplumber.open(filepath) as pdf:
        print(f"   Total pages: {len(pdf.pages)}")
        
        for page_num, page in enumerate(pdf.pages, 1):
            tables = page.extract_tables()
            
            for table in tables:
                if not table:
                    continue
                    
                for row in table:
                    if not row or len(row) < 2:
                        continue
                    
                    sku = clean_sku(row[0])
                    if not sku:
                        continue
                    
                    name = str(row[1]).strip() if len(row) > 1 and row[1] else ''
                    
                    price = None
                    for cell in reversed(row):
                        price = clean_price(cell)
                        if price and price > 50:
                            break
                    
                    products.append({
                        'id': str(uuid4()),
                        'sku': sku,
                        'name': f"Rowe {name}" if name else f"Rowe {sku}",
                        'price': price,
                        'vendor_code': 'rowe',
                        'vendor_name': 'Rowe',
                        'vendor': 'Rowe',
                        'source_file': os.path.basename(filepath),
                        'source_page': page_num,
                        'imported_at': datetime.now(timezone.utc).isoformat()
                    })
            
            if page_num % 50 == 0:
                print(f"   Progress: {page_num}/{len(pdf.pages)} pages")
    
    priced = sum(1 for p in products if p.get('price'))
    print(f"   ✓ Total: {len(products)} products ({priced} priced)")
    return products

async def main():
    print("="*80)
    print("🔥 THOROUGH IMPORT - EVERY PAGE, EVERY ITEM")
    print("="*80)
    
    db = await get_db()
    all_products = []
    
    os.chdir('/app/backend')
    
    # Delete existing Gabby, Summer Classics, Loloi, Rowe products
    for vendor_code in ['gabby', 'summer_classics', 'loloi', 'rowe']:
        deleted = await db.master_products.delete_many({'vendor_code': vendor_code})
        print(f"Deleted {deleted.deleted_count} old {vendor_code} products")
    
    # Process Gabby Case Goods
    if os.path.exists('gabby_casegoods_map.pdf'):
        products = process_gabby_casegoods('gabby_casegoods_map.pdf')
        all_products.extend(products)
    
    # Process Gabby Upholstery
    if os.path.exists('gabby_upholstery_map.pdf'):
        products = process_gabby_upholstery('gabby_upholstery_map.pdf')
        all_products.extend(products)
    
    # Process Summer Classics + Gabby Pillow
    if os.path.exists('pillow_map.pdf'):
        products = process_summer_classics_pillow('pillow_map.pdf')
        all_products.extend(products)
    
    # Process Loloi
    if os.path.exists('loloi_full.pdf'):
        products = process_loloi('loloi_full.pdf')
        all_products.extend(products)
    
    # Process Rowe
    if os.path.exists('document_1.pdf'):
        products = process_rowe('document_1.pdf')
        all_products.extend(products)
    
    # Dedupe
    print(f"\n🔄 Deduplicating {len(all_products)} products...")
    unique = {}
    for p in all_products:
        if not p.get('sku'):
            continue
        key = f"{p['vendor_code']}_{p['sku']}"
        if key not in unique or (p.get('price') and not unique[key].get('price')):
            unique[key] = p
    
    products_list = list(unique.values())
    print(f"   Unique: {len(products_list)}")
    
    # Insert
    print(f"\n💾 Saving to database...")
    for p in products_list:
        try:
            await db.master_products.update_one(
                {'sku': p['sku'], 'vendor_code': p['vendor_code']},
                {'$set': p},
                upsert=True
            )
        except:
            pass
    
    # Final stats for these vendors
    print(f"\n{'='*80}")
    print("📊 IMPORT COMPLETE")
    print(f"{'='*80}")
    
    for vendor_code, vendor_name in [('gabby', 'Gabby'), ('summer_classics', 'Summer Classics'), 
                                      ('loloi', 'Loloi'), ('rowe', 'Rowe')]:
        count = await db.master_products.count_documents({'vendor_code': vendor_code})
        priced = await db.master_products.count_documents({'vendor_code': vendor_code, 'price': {'$gt': 0}})
        print(f"   {vendor_name}: {count} products ({priced} priced)")
    
    # Total database
    total = await db.master_products.count_documents({})
    priced = await db.master_products.count_documents({'price': {'$gt': 0}})
    print(f"\n   TOTAL DATABASE: {total} products ({priced} priced - {priced*100//max(total,1)}%)")

if __name__ == '__main__':
    asyncio.run(main())

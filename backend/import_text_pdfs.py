#!/usr/bin/env python3
"""Parse text-based PDFs (Villa & House, Gabby, etc.)"""

import asyncio
import os
import re
import pdfplumber
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime, timezone
from uuid import uuid4

MONGO_URL = os.environ.get('MONGO_URL')
DB_NAME = 'interior_design_db'

def clean_price(s):
    if not s:
        return None
    s = re.sub(r'[^\d.,]', '', str(s))
    s = s.replace(',', '')
    try:
        return float(s) if float(s) > 0 else None
    except:
        return None

async def get_db():
    client = AsyncIOMotorClient(MONGO_URL)
    return client[DB_NAME]

def parse_villa_house(filepath):
    """Parse Villa & House text-based PDF"""
    products = []
    
    with pdfplumber.open(filepath) as pdf:
        for page in pdf.pages:
            text = page.extract_text()
            if not text:
                continue
            
            lines = text.split('\n')
            for line in lines:
                # Pattern: SKU-CODE Description $Price
                # Example: ABN-700-808 Arabian Horse Statue / Gold Leaf Fedex Low $84.00
                match = re.search(r'^([A-Z]{2,5}-[\d-]+[A-Z0-9-]*)\s+(.+?)\s+\$(\d[\d,.]*)', line)
                if match:
                    sku = match.group(1)
                    name = match.group(2).strip()
                    # Remove shipping info from name
                    name = re.sub(r'\s*(Fedex|FedEx|Low|High|N/A)\s*$', '', name, flags=re.I).strip()
                    price = clean_price(match.group(3))
                    
                    products.append({
                        'id': str(uuid4()),
                        'sku': sku,
                        'name': f"Villa & House {name}"[:200],
                        'price': price,
                        'vendor_code': 'villa_house',
                        'vendor_name': 'Villa & House',
                        'source_file': os.path.basename(filepath),
                        'imported_at': datetime.now(timezone.utc).isoformat()
                    })
    
    return products

def parse_gabby(filepath):
    """Parse Gabby PDF (may be table or text based)"""
    products = []
    
    with pdfplumber.open(filepath) as pdf:
        for page_num, page in enumerate(pdf.pages, 1):
            # Try tables first
            tables = page.extract_tables()
            for table in tables:
                if not table:
                    continue
                for row in table:
                    if not row or len(row) < 2:
                        continue
                    
                    # Look for SKU pattern
                    sku = None
                    for cell in row:
                        if cell:
                            # Gabby SKUs: SCH-167085, etc.
                            match = re.match(r'^([A-Z]{2,5}-[\d]+[A-Z0-9-]*)', str(cell).strip())
                            if match:
                                sku = match.group(1)
                                break
                    
                    if not sku:
                        continue
                    
                    # Find price
                    price = None
                    for cell in reversed(row):
                        if cell:
                            p = clean_price(cell)
                            if p and p > 10:
                                price = p
                                break
                    
                    # Get name
                    name = ''
                    for i, cell in enumerate(row):
                        if cell and str(cell).strip() != sku and not clean_price(cell):
                            name = str(cell).strip()[:100]
                            break
                    
                    products.append({
                        'id': str(uuid4()),
                        'sku': sku,
                        'name': f"Gabby {name}" if name else f"Gabby {sku}",
                        'price': price,
                        'vendor_code': 'gabby',
                        'vendor_name': 'Gabby',
                        'source_file': os.path.basename(filepath),
                        'source_page': page_num,
                        'imported_at': datetime.now(timezone.utc).isoformat()
                    })
            
            # Also try text extraction
            text = page.extract_text()
            if text:
                lines = text.split('\n')
                for line in lines:
                    # Look for Gabby SKU patterns
                    match = re.search(r'([A-Z]{2,5}-\d{4,}[A-Z0-9-]*)\s+(.+?)\s+\$?(\d[\d,.]*)\s*$', line)
                    if match:
                        sku = match.group(1)
                        # Skip if already found
                        if any(p['sku'] == sku for p in products[-100:]):
                            continue
                        
                        name = match.group(2).strip()
                        price = clean_price(match.group(3))
                        
                        products.append({
                            'id': str(uuid4()),
                            'sku': sku,
                            'name': f"Gabby {name}"[:200],
                            'price': price,
                            'vendor_code': 'gabby',
                            'vendor_name': 'Gabby',
                            'source_file': os.path.basename(filepath),
                            'source_page': page_num,
                            'imported_at': datetime.now(timezone.utc).isoformat()
                        })
    
    return products

def parse_worlds_away(filepath):
    """Parse Worlds Away PDF"""
    products = []
    
    with pdfplumber.open(filepath) as pdf:
        for page_num, page in enumerate(pdf.pages, 1):
            tables = page.extract_tables()
            
            for table in tables:
                if not table:
                    continue
                
                for row in table:
                    if not row or len(row) < 2:
                        continue
                    
                    # First cell is usually SKU
                    sku = None
                    if row[0]:
                        s = str(row[0]).strip().upper()
                        if len(s) >= 3 and len(s) <= 20 and re.match(r'^[A-Z0-9-]+$', s):
                            if s not in ['SKU', 'ITEM', 'DESCRIPTION', 'PRICE', 'MAP']:
                                sku = s
                    
                    if not sku:
                        continue
                    
                    # Find price
                    price = None
                    for cell in reversed(row):
                        p = clean_price(cell)
                        if p and p > 5:
                            price = p
                            break
                    
                    # Get name
                    name = ''
                    if len(row) > 1 and row[1]:
                        name = str(row[1]).strip()[:100]
                    
                    products.append({
                        'id': str(uuid4()),
                        'sku': sku,
                        'name': f"Worlds Away {name}" if name else f"Worlds Away {sku}",
                        'price': price,
                        'vendor_code': 'worlds_away',
                        'vendor_name': 'Worlds Away',
                        'source_file': os.path.basename(filepath),
                        'source_page': page_num,
                        'imported_at': datetime.now(timezone.utc).isoformat()
                    })
    
    return products

def parse_loloi(filepath):
    """Parse Loloi PDF"""
    products = []
    
    with pdfplumber.open(filepath) as pdf:
        for page_num, page in enumerate(pdf.pages, 1):
            tables = page.extract_tables()
            
            for table in tables:
                if not table:
                    continue
                
                for row in table:
                    if not row or len(row) < 3:
                        continue
                    
                    # Find SKU (usually first column with valid pattern)
                    sku = None
                    for cell in row:
                        if cell:
                            s = str(cell).strip().upper()
                            # Loloi SKUs can be like:?"?"?"?", etc.
                            if len(s) >= 4 and len(s) <= 30:
                                if s not in ['SKU', 'ITEM', 'SIZE', 'COLOR', 'DESCRIPTION']:
                                    sku = s
                                    break
                    
                    if not sku:
                        continue
                    
                    # Find price
                    price = None
                    for cell in row:
                        p = clean_price(cell)
                        if p and p > 5:
                            price = p
                            break
                    
                    # Get collection/name
                    name = ''
                    for i, cell in enumerate(row[1:], 1):
                        if cell and not clean_price(cell):
                            name = str(cell).strip()[:100]
                            break
                    
                    products.append({
                        'id': str(uuid4()),
                        'sku': sku,
                        'name': f"Loloi {name}" if name else f"Loloi {sku}",
                        'price': price,
                        'vendor_code': 'loloi',
                        'vendor_name': 'Loloi',
                        'source_file': os.path.basename(filepath),
                        'source_page': page_num,
                        'imported_at': datetime.now(timezone.utc).isoformat()
                    })
    
    return products

async def main():
    print("="*60)
    print("TEXT-BASED PDF IMPORT")
    print("="*60)
    
    db = await get_db()
    os.chdir('/app/backend')
    
    all_products = []
    
    # Villa & House
    for f in ['price_sheets/villa_house.pdf', 'villa_house_stocking.pdf']:
        if os.path.exists(f):
            print(f"\n📕 Processing Villa & House: {f}")
            products = parse_villa_house(f)
            priced = sum(1 for p in products if p.get('price'))
            print(f"   Found {len(products)} products ({priced} priced)")
            all_products.extend(products)
    
    # Gabby
    for f in ['gabby_casegoods_map.pdf', 'gabby_upholstery_map.pdf', 
              'price_sheets/gabby_casegoods.pdf', 'price_sheets/gabby_upholstery.pdf']:
        if os.path.exists(f):
            print(f"\n📕 Processing Gabby: {f}")
            products = parse_gabby(f)
            priced = sum(1 for p in products if p.get('price'))
            print(f"   Found {len(products)} products ({priced} priced)")
            all_products.extend(products)
    
    # Worlds Away
    for f in ['worlds_away.pdf']:
        if os.path.exists(f):
            print(f"\n📕 Processing Worlds Away: {f}")
            products = parse_worlds_away(f)
            priced = sum(1 for p in products if p.get('price'))
            print(f"   Found {len(products)} products ({priced} priced)")
            all_products.extend(products)
    
    # Loloi
    for f in ['price_sheets/loloi.pdf', 'loloi_full.pdf']:
        if os.path.exists(f):
            print(f"\n📕 Processing Loloi: {f}")
            products = parse_loloi(f)
            priced = sum(1 for p in products if p.get('price'))
            print(f"   Found {len(products)} products ({priced} priced)")
            all_products.extend(products)
    
    # Dedupe and upsert
    print(f"\n🔄 Processing {len(all_products)} products...")
    
    unique = {}
    for p in all_products:
        if not p.get('sku'):
            continue
        key = f"{p['vendor_code']}_{p['sku']}"
        if key not in unique or (p.get('price') and not unique[key].get('price')):
            unique[key] = p
    
    products_list = list(unique.values())
    print(f"   Unique: {len(products_list)}")
    
    # Upsert
    count = 0
    for p in products_list:
        try:
            await db.master_products.update_one(
                {'sku': p['sku'], 'vendor_code': p['vendor_code']},
                {'$set': p},
                upsert=True
            )
            count += 1
        except:
            pass
    
    print(f"   Upserted: {count}")
    
    # Final stats
    total = await db.master_products.count_documents({})
    priced = await db.master_products.count_documents({'price': {'$gt': 0}})
    
    print(f"\n{'='*60}")
    print(f"FINAL: {total} products, {priced} priced ({priced*100//max(total,1)}%)")

if __name__ == '__main__':
    asyncio.run(main())

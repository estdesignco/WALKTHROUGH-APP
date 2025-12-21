#!/usr/bin/env python3
"""Fix Gabby Upholstery and Loloi imports"""

import asyncio
import pdfplumber
import re
from motor.motor_asyncio import AsyncIOMotorClient
import os
from datetime import datetime, timezone
from uuid import uuid4

MONGO_URL = os.environ.get('MONGO_URL')

def clean_price(val):
    if not val:
        return None
    s = str(val).strip()
    match = re.search(r'\$([\d,]+)', s)
    if match:
        s = match.group(1).replace(',', '')
        try:
            return float(s)
        except:
            return None
    return None

async def import_gabby_upholstery():
    """Parse Gabby Upholstery - wide format with columns as products"""
    client = AsyncIOMotorClient(MONGO_URL)
    db = client['interior_design_db']
    
    products = []
    
    print("Processing Gabby Upholstery (80 pages)...")
    
    with pdfplumber.open('/app/backend/gabby_upholstery_map.pdf') as pdf:
        for page_num, page in enumerate(pdf.pages, 1):
            text = page.extract_text()
            if not text:
                continue
            
            lines = text.split('\n')
            
            skus = []
            prices = []
            names = []
            
            for line in lines:
                # Find Style row (SKUs)
                if line.startswith('Style '):
                    parts = line.replace('Style ', '').split()
                    for p in parts:
                        p = p.strip()
                        if p.startswith('SCH-') or re.match(r'^[A-Z]{2,4}-\d+', p):
                            skus.append(p)
                
                # Find Description row (names)
                if line.startswith('Description '):
                    # Split by multiple spaces
                    parts = re.split(r'\s{2,}', line.replace('Description ', ''))
                    names = [p.strip() for p in parts if p.strip()]
                
                # Find Grade 1 prices
                if 'Grade 1 ' in line:
                    parts = line.split()
                    for p in parts:
                        price = clean_price(p)
                        if price and price > 100:  # Upholstery prices are usually > $100
                            prices.append(price)
            
            # Create products
            for i, sku in enumerate(skus):
                if not sku or len(sku) < 5:
                    continue
                    
                price = prices[i] if i < len(prices) else None
                name = names[i] if i < len(names) else ''
                
                products.append({
                    'id': str(uuid4()),
                    'sku': sku.upper(),
                    'name': f'Gabby {name}' if name else f'Gabby {sku}',
                    'price': price,
                    'vendor_code': 'gabby',
                    'vendor_name': 'Gabby',
                    'vendor': 'Gabby',
                    'source_file': 'gabby_upholstery_map.pdf',
                    'source_page': page_num,
                    'imported_at': datetime.now(timezone.utc).isoformat()
                })
            
            if page_num % 20 == 0:
                print(f"  Progress: {page_num}/80 pages, {len(products)} products so far")
    
    print(f"Found {len(products)} Gabby Upholstery products")
    priced = sum(1 for p in products if p.get('price'))
    print(f"With prices: {priced}")
    
    # Insert/update
    for p in products:
        try:
            await db.master_products.update_one(
                {'sku': p['sku'], 'vendor_code': 'gabby'},
                {'$set': p},
                upsert=True
            )
        except:
            pass
    
    return len(products)

async def import_loloi():
    """Parse Loloi - 52 pages"""
    client = AsyncIOMotorClient(MONGO_URL)
    db = client['interior_design_db']
    
    # Delete old loloi
    await db.master_products.delete_many({'vendor_code': 'loloi'})
    
    products = []
    
    print("Processing Loloi (52 pages)...")
    
    with pdfplumber.open('/app/backend/loloi_full.pdf') as pdf:
        for page_num, page in enumerate(pdf.pages, 1):
            text = page.extract_text()
            if not text:
                continue
            
            lines = text.split('\n')
            
            for line in lines:
                # Look for lines with SKU patterns and prices
                # Loloi format: COLLECTION SKU SIZE SD MSRP MAP ...
                parts = line.split()
                
                if len(parts) < 5:
                    continue
                
                # Find potential SKU (alphanumeric, 5-15 chars)
                for i, part in enumerate(parts):
                    part = part.strip().upper()
                    
                    # Skip known headers
                    if part in ['DESIGN', 'BRAND', 'COLLECTION', 'SIZE', 'SD', 'MSRP', 'MAP', 
                                'CONSTRUCTION', 'CODE', 'HAND', 'TUFTED', 'MACHINE', 'MADE']:
                        continue
                    
                    # Check if looks like SKU
                    if len(part) >= 4 and len(part) <= 20 and re.match(r'^[A-Z0-9/-]+$', part):
                        sku = part
                        
                        # Get collection/name from before
                        name = ' '.join(parts[:i]) if i > 0 else ''
                        
                        # Find price (look for numeric values after)
                        price = None
                        for j in range(i+1, min(i+6, len(parts))):
                            try:
                                p = float(parts[j].replace(',', ''))
                                if 20 < p < 10000:
                                    price = p
                                    break
                            except:
                                continue
                        
                        # Skip duplicates
                        if any(p['sku'] == sku for p in products[-50:]):
                            continue
                        
                        products.append({
                            'id': str(uuid4()),
                            'sku': sku,
                            'name': f'Loloi {name}' if name else f'Loloi {sku}',
                            'price': price,
                            'vendor_code': 'loloi',
                            'vendor_name': 'Loloi',
                            'vendor': 'Loloi',
                            'source_file': 'loloi_full.pdf',
                            'source_page': page_num,
                            'imported_at': datetime.now(timezone.utc).isoformat()
                        })
                        break  # Only first SKU per line
    
    print(f"Found {len(products)} Loloi products")
    priced = sum(1 for p in products if p.get('price'))
    print(f"With prices: {priced}")
    
    # Insert
    if products:
        for p in products:
            try:
                await db.master_products.insert_one(p)
            except:
                pass
    
    return len(products)

async def main():
    print("="*60)
    print("FIXING GABBY UPHOLSTERY AND LOLOI")
    print("="*60)
    
    os.chdir('/app/backend')
    
    # Import Gabby Upholstery
    gabby_count = await import_gabby_upholstery()
    
    # Import Loloi
    loloi_count = await import_loloi()
    
    # Final stats
    client = AsyncIOMotorClient(MONGO_URL)
    db = client['interior_design_db']
    
    gabby_total = await db.master_products.count_documents({'vendor_code': 'gabby'})
    gabby_priced = await db.master_products.count_documents({'vendor_code': 'gabby', 'price': {'$gt': 0}})
    
    loloi_total = await db.master_products.count_documents({'vendor_code': 'loloi'})
    loloi_priced = await db.master_products.count_documents({'vendor_code': 'loloi', 'price': {'$gt': 0}})
    
    print(f"\n{'='*60}")
    print("FINAL COUNTS")
    print(f"{'='*60}")
    print(f"Gabby: {gabby_total} products ({gabby_priced} priced)")
    print(f"Loloi: {loloi_total} products ({loloi_priced} priced)")
    
    # Total
    total = await db.master_products.count_documents({})
    priced = await db.master_products.count_documents({'price': {'$gt': 0}})
    print(f"\nTOTAL DATABASE: {total} products ({priced} priced - {priced*100//max(total,1)}%)")

if __name__ == '__main__':
    asyncio.run(main())

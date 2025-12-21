#!/usr/bin/env python3
"""Fix Bassett Mirror prices"""

import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import pdfplumber
import re
import os
from datetime import datetime, timezone
from uuid import uuid4

def clean_price(val):
    if not val:
        return None
    s = str(val).strip()
    # Look for price pattern with $
    match = re.search(r'\$([\d,]+\.?\d*)', s)
    if match:
        s = match.group(1)
    else:
        s = re.sub(r'[^\d.,]', '', s)
    s = s.replace(',', '')
    try:
        price = float(s)
        return price if 0 < price < 100000 else None  # Cap at 100k
    except:
        return None

async def fix_bassett():
    client = AsyncIOMotorClient(os.environ.get('MONGO_URL'))
    db = client['interior_design_db']
    
    # Delete old Bassett products
    await db.master_products.delete_many({'vendor_code': 'bassett_mirror'})
    print('Deleted old Bassett products')
    
    products = []
    
    os.chdir('/app/backend')
    
    for filepath in ['price_sheets/bassett_furniture.pdf', 'price_sheets/bassett_home_decor.pdf', 'price_sheets/bassett_components.pdf']:
        if not os.path.exists(filepath):
            continue
        
        print(f'Processing {filepath}')
        
        with pdfplumber.open(filepath) as pdf:
            for page_num, page in enumerate(pdf.pages, 1):
                tables = page.extract_tables()
                for table in tables:
                    if not table:
                        continue
                    
                    for row in table:
                        if not row or len(row) < 4:
                            continue
                        
                        # SKU is first column
                        sku = str(row[0] or '').strip().upper()
                        if len(sku) < 5 or not re.match(r'^[A-Z0-9-]+$', sku):
                            continue
                        if sku in ['SKU', 'ITEM', 'ITEM #']:
                            continue
                        
                        # Name is second column
                        name = str(row[1] or '').strip()
                        
                        # Find price - look for cell with $ sign
                        price = None
                        for cell in row:
                            if cell and '$' in str(cell):
                                price = clean_price(cell)
                                if price:
                                    break
                        
                        # Skip if already seen this SKU
                        if any(p['sku'] == sku for p in products):
                            continue
                        
                        products.append({
                            'id': str(uuid4()),
                            'sku': sku,
                            'name': f'Bassett Mirror {name}' if name else f'Bassett Mirror {sku}',
                            'price': price,
                            'vendor_code': 'bassett_mirror',
                            'vendor_name': 'Bassett Mirror',
                            'vendor': 'Bassett Mirror',
                            'source_file': os.path.basename(filepath),
                            'source_page': page_num,
                            'imported_at': datetime.now(timezone.utc).isoformat()
                        })
    
    print(f'Found {len(products)} Bassett products')
    priced = sum(1 for p in products if p.get('price'))
    print(f'With prices: {priced}')
    
    # Insert
    if products:
        await db.master_products.insert_many(products)
    
    # Verify specific product
    p = await db.master_products.find_one({'sku': '6012-DR-576'})
    if p:
        print(f'6012-DR-576: ${p.get("price")}')

if __name__ == '__main__':
    asyncio.run(fix_bassett())

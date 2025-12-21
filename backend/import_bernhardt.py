#!/usr/bin/env python3
"""Import Bernhardt products from PDFs"""

import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import pdfplumber
import os
import re
from datetime import datetime, timezone
from uuid import uuid4

def clean_doubled_text(text):
    """Clean text that has doubled characters like AABBCCDD -> ABCD"""
    result = []
    i = 0
    while i < len(text):
        char = text[i]
        # If next char is same, skip one
        if i + 1 < len(text) and text[i+1] == char:
            result.append(char)
            i += 2
        else:
            result.append(char)
            i += 1
    return ''.join(result)

def clean_price(val):
    if val is None:
        return None
    s = str(val).strip()
    s = re.sub(r'[^\d.,]', '', s)
    s = s.replace(',', '')
    try:
        price = float(s)
        return price if price > 10 and price < 100000 else None
    except:
        return None

async def import_bernhardt():
    client = AsyncIOMotorClient(os.environ.get('MONGO_URL'))
    db = client[os.environ.get('DB_NAME', 'interior_design')]
    
    files = [
        'price_sheets/bernhardt_interiors.pdf',
        'price_sheets/bernhardt_exteriors.pdf',
        'price_sheets/bernhardt_casegoods.pdf'
    ]
    
    products = []
    
    for filepath in files:
        if not os.path.exists(filepath):
            continue
        print(f'Processing {filepath}')
        
        with pdfplumber.open(filepath) as pdf:
            for page_num, page in enumerate(pdf.pages):
                text = page.extract_text()
                if not text:
                    continue
                
                # Clean the doubled text
                cleaned_text = clean_doubled_text(text)
                lines = cleaned_text.split('\n')
                
                for line in lines:
                    # Look for SKU pattern followed by price info
                    # Bernhardt SKUs like N5142, B789, K1234
                    sku_match = re.match(r'^([A-Z][A-Z0-9]{3,8})\s+(.+)', line)
                    if not sku_match:
                        continue
                    
                    sku = sku_match.group(1)
                    rest = sku_match.group(2)
                    
                    # Extract name (first meaningful words before dimensions/price)
                    name_match = re.match(r'^([A-Za-z][A-Za-z\s]+?)(?:\s+[WDH]\s|\s+fabric|\s+\$|\s*$)', rest)
                    name = name_match.group(1).strip() if name_match else rest[:50]
                    
                    # Extract price (look for $X,XXX pattern)
                    price_match = re.search(r'\$([\d,]+)', rest)
                    price = clean_price(price_match.group(1)) if price_match else None
                    
                    # Skip if name looks like a header or junk
                    if len(name) < 3 or name.upper() in ['ITEM', 'DESCRIPTION', 'PRICE', 'COM', 'FABRIC']:
                        continue
                    
                    products.append({
                        'id': str(uuid4()),
                        'sku': sku,
                        'name': f'Bernhardt {name}'[:200],
                        'price': price,
                        'vendor_code': 'bernhardt',
                        'vendor_name': 'Bernhardt',
                        'source_file': os.path.basename(filepath),
                        'source_page': page_num + 1,
                        'imported_at': datetime.now(timezone.utc).isoformat()
                    })
    
    # Dedupe by SKU
    unique = {}
    for p in products:
        if p['sku'] not in unique or (p.get('price') and not unique[p['sku']].get('price')):
            unique[p['sku']] = p
    
    products = list(unique.values())
    print(f'Total unique Bernhardt products: {len(products)}')
    
    # Update database
    for p in products:
        await db.master_products.update_one(
            {'sku': p['sku'], 'vendor_code': 'bernhardt'},
            {'$set': p},
            upsert=True
        )
    
    # Check final count
    total = await db.master_products.count_documents({'vendor_code': 'bernhardt'})
    priced = await db.master_products.count_documents({'vendor_code': 'bernhardt', 'price': {'$ne': None}})
    print(f'Final Bernhardt: {total} total, {priced} priced')

if __name__ == '__main__':
    asyncio.run(import_bernhardt())

"""
Import Additional Vendor Price Lists
Processes: Rowe, Loloi, Wendy Jane, Bassett Mirror
"""

import os
import json
import asyncio
import pdfplumber
import openpyxl
import re
from uuid import uuid4
from datetime import datetime, timezone
from motor.motor_asyncio import AsyncIOMotorClient

MONGO_URL = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
DB_NAME = os.environ.get('DB_NAME', 'interior_design_db')

async def get_db():
    client = AsyncIOMotorClient(MONGO_URL)
    return client[DB_NAME]

def process_rowe_pdf(filepath):
    """Process Rowe catalog PDF - complex pricing structure"""
    products = []
    
    with pdfplumber.open(filepath) as pdf:
        current_product_name = ""
        
        for page_num, page in enumerate(pdf.pages[5:202], start=6):  # Pages 6-202 have pricing
            text = page.extract_text()
            if not text:
                continue
            
            lines = text.split('\n')
            
            for line in lines:
                # Skip headers and footers
                if 'To Trade' in line or 'Page' in line.strip()[-10:]:
                    continue
                
                # Check if this is a product header line (e.g., "Abbie P520 Swivel Chair")
                if re.match(r'^[A-Z][a-z]+ [A-Z]\d+', line):
                    current_product_name = line.strip()
                    continue
                
                # Look for SKU lines (format: Description SKU Price...)
                parts = line.split()
                if len(parts) >= 3:
                    # Try to find SKU pattern (e.g., P520-016)
                    for i, part in enumerate(parts):
                        if re.match(r'^[A-Z]\d+-\d+', part):
                            sku = part
                            description = ' '.join(parts[:i])
                            
                            # Try to get first price (lowest grade)
                            price = 0.0
                            for j in range(i+1, min(i+3, len(parts))):
                                try:
                                    price = float(parts[j].replace(',', ''))
                                    break
                                except:
                                    continue
                            
                            if description and price > 0:
                                name = f"{current_product_name} - {description}" if current_product_name else description
                                products.append({
                                    'id': str(uuid4()),
                                    'vendor': 'Rowe',
                                    'vendor_code': 'ROWE',
                                    'sku': sku,
                                    'name': name.strip(),
                                    'price': price,
                                    'cost': price * 0.5,
                                    'category': 'Furniture',
                                    'image_url': '',
                                    'created_at': datetime.now(timezone.utc).isoformat(),
                                    'updated_at': datetime.now(timezone.utc).isoformat(),
                                })
                            break
    
    return products

def process_loloi_pdf(filepath):
    """Process Loloi rugs PDF"""
    products = []
    
    with pdfplumber.open(filepath) as pdf:
        for page in pdf.pages:
            tables = page.extract_tables()
            
            for table in tables:
                for row in table:
                    if not row or len(row) < 4:
                        continue
                    
                    # Skip headers
                    if any(h in str(row[0]).upper() for h in ['SKU', 'ITEM', 'STYLE']):
                        continue
                    
                    sku = str(row[0]).strip() if row[0] else ''
                    name = str(row[1]).strip() if len(row) > 1 and row[1] else ''
                    
                    # Find price column
                    price = 0.0
                    for cell in row[2:]:
                        if cell:
                            cell_str = str(cell).replace('$', '').replace(',', '').strip()
                            try:
                                price = float(cell_str)
                                if price > 10:  # Reasonable rug price
                                    break
                            except:
                                continue
                    
                    if sku and len(sku) > 3 and name and price > 0:
                        products.append({
                            'id': str(uuid4()),
                            'vendor': 'Loloi',
                            'vendor_code': 'LOLOI',
                            'sku': sku,
                            'name': name,
                            'price': price,
                            'cost': price * 0.5,
                            'category': 'Rugs',
                            'image_url': '',
                            'created_at': datetime.now(timezone.utc).isoformat(),
                            'updated_at': datetime.now(timezone.utc).isoformat(),
                        })
    
    return products

def process_wendy_jane_pdf(filepath):
    """Process Wendy Jane PDF"""
    products = []
    
    with pdfplumber.open(filepath) as pdf:
        for page in pdf.pages:
            tables = page.extract_tables()
            
            for table in tables:
                for row in table:
                    if not row or len(row) < 3:
                        continue
                    
                    sku = str(row[0]).strip() if row[0] else ''
                    name = str(row[1]).strip() if len(row) > 1 and row[1] else ''
                    price_str = str(row[2]).strip() if len(row) > 2 and row[2] else ''
                    
                    # Skip headers
                    if 'CODE' in sku.upper() or 'STOCK' in sku.upper():
                        continue
                    
                    # Parse price
                    price = 0.0
                    if '$' in price_str:
                        price_clean = price_str.replace('$', '').replace(' ', '').replace(',', '')
                        try:
                            price = float(price_clean)
                        except:
                            pass
                    
                    if sku and name and price > 0:
                        products.append({
                            'id': str(uuid4()),
                            'vendor': 'Wendy Jane',
                            'vendor_code': 'WENDYJANE',
                            'sku': sku,
                            'name': name,
                            'price': price,
                            'cost': price * 0.5,
                            'category': '',
                            'image_url': '',
                            'created_at': datetime.now(timezone.utc).isoformat(),
                            'updated_at': datetime.now(timezone.utc).isoformat(),
                        })
    
    return products

def process_bassett_mirror_pdf(filepath):
    """Process Bassett Mirror PDF"""
    products = []
    
    with pdfplumber.open(filepath) as pdf:
        print(f"  Bassett Mirror: {len(pdf.pages)} pages")
        
        for page in pdf.pages[:100]:  # Process first 100 pages
            text = page.extract_text()
            if not text:
                continue
            
            # Look for SKU and price patterns
            for line in text.split('\n'):
                # Pattern: SKU Description $Price
                price_match = re.search(r'\$[\d,]+\.?\d*', line)
                if price_match:
                    price_str = price_match.group().replace('$', '').replace(',', '')
                    try:
                        price = float(price_str)
                    except:
                        continue
                    
                    before_price = line[:price_match.start()].strip()
                    parts = before_price.split(' ', 1)
                    
                    if len(parts) >= 2:
                        sku = parts[0]
                        name = parts[1].strip()
                        
                        if len(sku) >= 4 and name and price > 10:
                            products.append({
                                'id': str(uuid4()),
                                'vendor': 'Bassett Mirror',
                                'vendor_code': 'BASSETTMIRROR',
                                'sku': sku,
                                'name': name,
                                'price': price,
                                'cost': price * 0.5,
                                'category': 'Mirrors & Decor',
                                'image_url': '',
                                'created_at': datetime.now(timezone.utc).isoformat(),
                                'updated_at': datetime.now(timezone.utc).isoformat(),
                            })
    
    return products

async def import_products(products, vendor_name):
    """Import products to MongoDB"""
    if not products:
        return 0, 0
    
    db = await get_db()
    collection = db.master_products
    
    await collection.create_index([("sku", 1), ("vendor", 1)], unique=True)
    
    imported = 0
    updated = 0
    
    for product in products:
        try:
            result = await collection.update_one(
                {"sku": product['sku'], "vendor": product['vendor']},
                {"$set": product},
                upsert=True
            )
            if result.upserted_id:
                imported += 1
            else:
                updated += 1
        except Exception as e:
            pass  # Skip duplicates silently
    
    return imported, updated

async def save_to_json(products, vendor_name):
    """Save products to JSON file for persistence"""
    if not products:
        return
    
    filename = vendor_name.lower().replace(' ', '_').replace('&', 'and')
    filepath = f'/app/backend/data/products/{filename}.json'
    
    with open(filepath, 'w') as f:
        json.dump(products, f, indent=2)
    
    print(f"  Saved to {filepath}")

async def main():
    """Main import function"""
    print("=" * 60)
    print("IMPORTING ADDITIONAL VENDORS")
    print("=" * 60)
    
    # Process Rowe (local file)
    print("\n[1/4] Processing Rowe...")
    rowe_file = '/app/rowe_catalog.pdf'
    if os.path.exists(rowe_file):
        products = process_rowe_pdf(rowe_file)
        print(f"  Extracted {len(products)} products")
        if products:
            imported, updated = await import_products(products, 'Rowe')
            print(f"  Imported: {imported}, Updated: {updated}")
            await save_to_json(products, 'Rowe')
    
    # Process Loloi
    print("\n[2/4] Processing Loloi...")
    loloi_file = '/tmp/vendor_files/loloi.pdf'
    if os.path.exists(loloi_file):
        products = process_loloi_pdf(loloi_file)
        print(f"  Extracted {len(products)} products")
        if products:
            imported, updated = await import_products(products, 'Loloi')
            print(f"  Imported: {imported}, Updated: {updated}")
            await save_to_json(products, 'Loloi')
    
    # Process Wendy Jane
    print("\n[3/4] Processing Wendy Jane...")
    wj_file = '/tmp/vendor_files/wendy_jane.pdf'
    if os.path.exists(wj_file):
        products = process_wendy_jane_pdf(wj_file)
        print(f"  Extracted {len(products)} products")
        if products:
            imported, updated = await import_products(products, 'Wendy Jane')
            print(f"  Imported: {imported}, Updated: {updated}")
            await save_to_json(products, 'Wendy Jane')
    
    # Process Bassett Mirror
    print("\n[4/4] Processing Bassett Mirror...")
    bassett_file = '/tmp/vendor_files/bassett_mirror.pdf'
    if os.path.exists(bassett_file):
        products = process_bassett_mirror_pdf(bassett_file)
        print(f"  Extracted {len(products)} products")
        if products:
            imported, updated = await import_products(products, 'Bassett Mirror')
            print(f"  Imported: {imported}, Updated: {updated}")
            await save_to_json(products, 'Bassett Mirror')
    
    # Get totals
    db = await get_db()
    total = await db.master_products.count_documents({})
    vendors = await db.master_products.distinct("vendor")
    
    print("\n" + "=" * 60)
    print(f"IMPORT COMPLETE - {total} total products")
    print(f"Vendors: {vendors}")
    print("=" * 60)

if __name__ == "__main__":
    asyncio.run(main())

#!/usr/bin/env python3
"""
COMPREHENSIVE Product Import Script v2
Properly parses all vendor Excel and PDF files
Goes through EVERY sheet and EVERY page
"""

import os
import sys
import re
import asyncio
from datetime import datetime, timezone
from pathlib import Path
import pandas as pd
import pdfplumber
from motor.motor_asyncio import AsyncIOMotorClient
from uuid import uuid4

# MongoDB connection
MONGO_URL = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
DB_NAME = os.environ.get('DB_NAME', 'interior_design')

def clean_price(val):
    """Extract numeric price from various formats"""
    if val is None or pd.isna(val):
        return None
    if isinstance(val, (int, float)):
        return float(val) if val > 0 else None
    s = str(val).strip()
    # Remove currency symbols and extract number
    s = re.sub(r'[^\d.,]', '', s)
    s = s.replace(',', '')
    try:
        price = float(s)
        return price if price > 0 and price < 1000000 else None  # Sanity check
    except:
        return None

def clean_sku(val):
    """Clean and validate SKU"""
    if val is None or pd.isna(val):
        return None
    s = str(val).strip().upper()
    # Remove asterisks, clean up
    s = s.lstrip('*')
    # Skip if too short or too long or looks like garbage
    if len(s) < 3 or len(s) > 25:
        return None
    # Must have at least one alphanumeric
    if not re.match(r'^[A-Z0-9][-A-Z0-9_/]*[A-Z0-9]?$', s) and not re.match(r'^\d+$', s):
        return None
    # Skip common header values
    if s in ['SKU', 'ITEM', 'ITEM #', 'PRODUCT', 'CODE', 'NUMBER', 'NO.', 'UPS', 'NAN', 'NONE']:
        return None
    return s

async def get_db():
    """Get MongoDB connection"""
    client = AsyncIOMotorClient(MONGO_URL)
    return client[DB_NAME]

async def clear_products():
    """Clear existing master products"""
    db = await get_db()
    await db.master_products.delete_many({})
    print("✅ Cleared existing master_products collection")

async def import_fourhands(filepath):
    """Import Four Hands Excel (has specific structure)"""
    print(f"\n{'='*60}")
    print(f"📊 FOUR HANDS: {os.path.basename(filepath)}")
    print(f"{'='*60}")
    
    products = []
    xl = pd.ExcelFile(filepath)
    
    for sheet_name in xl.sheet_names:
        print(f"\n   Sheet: {sheet_name}")
        df = pd.read_excel(filepath, sheet_name=sheet_name)
        
        # Find SKU and price columns
        sku_col = None
        price_col = None
        name_col = None
        
        for col in df.columns:
            col_lower = str(col).lower()
            if 'product master code' in col_lower or 'sku' in col_lower or 'item' in col_lower:
                sku_col = col
            if 'cost' in col_lower or 'price' in col_lower:
                price_col = col
            if 'description' in col_lower or 'name' in col_lower:
                name_col = col
        
        if not sku_col:
            sku_col = df.columns[0]
        
        print(f"      Using: SKU={sku_col}, Price={price_col}, Name={name_col}")
        
        count = 0
        for idx, row in df.iterrows():
            sku = clean_sku(row.get(sku_col))
            if not sku:
                continue
            
            price = clean_price(row.get(price_col)) if price_col else None
            name = str(row.get(name_col, '')).strip() if name_col else ''
            if not name or name.lower() == 'nan':
                name = f"Four Hands {sku}"
            
            products.append({
                'id': str(uuid4()),
                'sku': sku,
                'name': name,
                'price': price,
                'vendor_code': 'four_hands',
                'vendor_name': 'Four Hands',
                'source_file': os.path.basename(filepath),
                'source_sheet': sheet_name,
                'imported_at': datetime.now(timezone.utc).isoformat()
            })
            count += 1
        
        print(f"      ✅ {count} products")
    
    print(f"\n   Total Four Hands: {len(products)}")
    return products

async def import_revelation(filepath):
    """Import Uttermost Revelation Excel (header is row 1)"""
    print(f"\n{'='*60}")
    print(f"📊 UTTERMOST REVELATION: {os.path.basename(filepath)}")
    print(f"{'='*60}")
    
    products = []
    xl = pd.ExcelFile(filepath)
    
    for sheet_name in xl.sheet_names:
        print(f"\n   Sheet: {sheet_name}")
        df = pd.read_excel(filepath, sheet_name=sheet_name, header=1)  # Header in row 1
        
        # Clean column names
        df.columns = [str(c).strip() for c in df.columns]
        print(f"      Columns: {list(df.columns)}")
        
        # Find columns - Revelation uses 'Item #' or 'No.'
        sku_col = None
        price_col = None
        name_col = None
        
        for col in df.columns:
            col_lower = str(col).lower()
            if col_lower in ['item #', 'no.', 'no', 'sku', 'item']:
                sku_col = col
            if 'wholesale' in col_lower or 'price' in col_lower:
                price_col = col
            if col_lower in ['name', 'description'] or col == df.columns[2]:  # Often name is 3rd col
                name_col = col
        
        if not sku_col:
            # Try column index
            for i, col in enumerate(df.columns):
                if i == 1:  # Usually 2nd column
                    sku_col = col
                    break
        
        print(f"      Using: SKU={sku_col}, Price={price_col}, Name={name_col}")
        
        count = 0
        for idx, row in df.iterrows():
            sku = clean_sku(row.get(sku_col))
            if not sku:
                continue
            
            price = clean_price(row.get(price_col)) if price_col else None
            name = str(row.get(name_col, '')).strip() if name_col else ''
            if not name or name.lower() == 'nan':
                name = f"Uttermost Revelation {sku}"
            
            products.append({
                'id': str(uuid4()),
                'sku': sku,
                'name': name,
                'price': price,
                'vendor_code': 'uttermost',
                'vendor_name': 'Uttermost Revelation',
                'source_file': os.path.basename(filepath),
                'source_sheet': sheet_name,
                'imported_at': datetime.now(timezone.utc).isoformat()
            })
            count += 1
        
        print(f"      ✅ {count} products")
    
    print(f"\n   Total Revelation: {len(products)}")
    return products

async def import_saltlight(filepath):
    """Import Salt Light Excel"""
    print(f"\n{'='*60}")
    print(f"📊 SALT LIGHT: {os.path.basename(filepath)}")
    print(f"{'='*60}")
    
    products = []
    xl = pd.ExcelFile(filepath)
    
    for sheet_name in xl.sheet_names:
        print(f"\n   Sheet: {sheet_name}")
        df = pd.read_excel(filepath, sheet_name=sheet_name)
        
        print(f"      Columns: {list(df.columns)}")
        
        # Find columns
        sku_col = None
        price_col = None
        name_col = None
        
        for col in df.columns:
            col_lower = str(col).lower()
            if any(k in col_lower for k in ['sku', 'item', 'code', 'number', 'no']):
                sku_col = col
            if any(k in col_lower for k in ['price', 'cost', 'wholesale', 'net']):
                price_col = col
            if any(k in col_lower for k in ['name', 'description', 'title']):
                name_col = col
        
        if not sku_col:
            sku_col = df.columns[0]
        
        print(f"      Using: SKU={sku_col}, Price={price_col}, Name={name_col}")
        
        count = 0
        for idx, row in df.iterrows():
            sku = clean_sku(row.get(sku_col))
            if not sku:
                continue
            
            price = clean_price(row.get(price_col)) if price_col else None
            name = str(row.get(name_col, '')).strip() if name_col else ''
            if not name or name.lower() == 'nan':
                name = f"Salt Light {sku}"
            
            products.append({
                'id': str(uuid4()),
                'sku': sku,
                'name': name,
                'price': price,
                'vendor_code': 'salt_light',
                'vendor_name': 'Salt Light',
                'source_file': os.path.basename(filepath),
                'source_sheet': sheet_name,
                'imported_at': datetime.now(timezone.utc).isoformat()
            })
            count += 1
        
        print(f"      ✅ {count} products")
    
    print(f"\n   Total Salt Light: {len(products)}")
    return products

async def import_bassett_pdf(filepath):
    """Import Bassett Mirror PDF"""
    print(f"\n{'='*60}")
    print(f"📕 BASSETT MIRROR: {os.path.basename(filepath)}")
    print(f"{'='*60}")
    
    products = []
    
    with pdfplumber.open(filepath) as pdf:
        total_pages = len(pdf.pages)
        print(f"   Pages: {total_pages}")
        
        for page_num, page in enumerate(pdf.pages, 1):
            tables = page.extract_tables()
            page_count = 0
            
            for table in tables:
                if not table or len(table) < 2:
                    continue
                
                # Try to identify columns from header
                header = [str(h).lower().strip() if h else '' for h in table[0]]
                
                sku_idx = None
                price_idx = None
                name_idx = None
                
                for i, h in enumerate(header):
                    if any(k in h for k in ['sku', 'item', 'model', 'style', 'number', 'no', 'code']):
                        sku_idx = i
                    if any(k in h for k in ['price', 'cost', 'net', 'wholesale', 'retail', 'map']):
                        price_idx = i
                    if any(k in h for k in ['description', 'name', 'title']):
                        name_idx = i
                
                # Default to first column for SKU
                if sku_idx is None:
                    sku_idx = 0
                
                for row in table[1:]:
                    if not row or len(row) <= sku_idx:
                        continue
                    
                    sku = clean_sku(row[sku_idx])
                    if not sku:
                        continue
                    
                    price = None
                    if price_idx and len(row) > price_idx:
                        price = clean_price(row[price_idx])
                    
                    name = ''
                    if name_idx and len(row) > name_idx:
                        name = str(row[name_idx] or '').strip()
                    if not name:
                        name = f"Bassett Mirror {sku}"
                    
                    products.append({
                        'id': str(uuid4()),
                        'sku': sku,
                        'name': name,
                        'price': price,
                        'vendor_code': 'bassett_mirror',
                        'vendor_name': 'Bassett Mirror',
                        'source_file': os.path.basename(filepath),
                        'source_page': page_num,
                        'imported_at': datetime.now(timezone.utc).isoformat()
                    })
                    page_count += 1
            
            if page_count > 0:
                print(f"   Page {page_num}: {page_count} products")
    
    print(f"\n   Total Bassett: {len(products)}")
    return products

async def import_bernhardt_pdf(filepath):
    """Import Bernhardt PDF price list"""
    print(f"\n{'='*60}")
    print(f"📕 BERNHARDT: {os.path.basename(filepath)}")
    print(f"{'='*60}")
    
    products = []
    
    with pdfplumber.open(filepath) as pdf:
        total_pages = len(pdf.pages)
        print(f"   Pages: {total_pages}")
        
        for page_num, page in enumerate(pdf.pages, 1):
            tables = page.extract_tables()
            page_count = 0
            
            for table in tables:
                if not table or len(table) < 2:
                    continue
                
                for row in table:
                    if not row or len(row) < 2:
                        continue
                    
                    # Try first cell as SKU
                    sku = clean_sku(row[0])
                    if not sku:
                        continue
                    
                    # Find price in row (usually last numeric column)
                    price = None
                    for cell in reversed(row):
                        p = clean_price(cell)
                        if p and p > 10 and p < 100000:  # Reasonable price range
                            price = p
                            break
                    
                    # Get name from remaining cells
                    name_parts = []
                    for cell in row[1:]:
                        if cell and not clean_price(cell):
                            name_parts.append(str(cell).strip())
                    name = ' '.join(name_parts[:2]) if name_parts else f"Bernhardt {sku}"
                    
                    products.append({
                        'id': str(uuid4()),
                        'sku': sku,
                        'name': name[:200],  # Limit name length
                        'price': price,
                        'vendor_code': 'bernhardt',
                        'vendor_name': 'Bernhardt',
                        'source_file': os.path.basename(filepath),
                        'source_page': page_num,
                        'imported_at': datetime.now(timezone.utc).isoformat()
                    })
                    page_count += 1
            
            # Progress every 10 pages
            if page_num % 20 == 0:
                print(f"   Progress: page {page_num}/{total_pages}")
    
    print(f"\n   Total Bernhardt from {os.path.basename(filepath)}: {len(products)}")
    return products

async def import_gabby_pdf(filepath):
    """Import Gabby PDF"""
    print(f"\n{'='*60}")
    print(f"📕 GABBY: {os.path.basename(filepath)}")
    print(f"{'='*60}")
    
    products = []
    
    with pdfplumber.open(filepath) as pdf:
        total_pages = len(pdf.pages)
        print(f"   Pages: {total_pages}")
        
        for page_num, page in enumerate(pdf.pages, 1):
            tables = page.extract_tables()
            page_count = 0
            
            for table in tables:
                if not table or len(table) < 2:
                    continue
                
                for row in table:
                    if not row or len(row) < 2:
                        continue
                    
                    sku = clean_sku(row[0])
                    if not sku:
                        continue
                    
                    price = None
                    for cell in reversed(row):
                        p = clean_price(cell)
                        if p and p > 10:
                            price = p
                            break
                    
                    name = str(row[1]).strip() if len(row) > 1 and row[1] else f"Gabby {sku}"
                    
                    products.append({
                        'id': str(uuid4()),
                        'sku': sku,
                        'name': name[:200],
                        'price': price,
                        'vendor_code': 'gabby',
                        'vendor_name': 'Gabby',
                        'source_file': os.path.basename(filepath),
                        'source_page': page_num,
                        'imported_at': datetime.now(timezone.utc).isoformat()
                    })
                    page_count += 1
    
    print(f"\n   Total Gabby from {os.path.basename(filepath)}: {len(products)}")
    return products

async def import_loloi_pdf(filepath):
    """Import Loloi PDF"""
    print(f"\n{'='*60}")
    print(f"📕 LOLOI: {os.path.basename(filepath)}")
    print(f"{'='*60}")
    
    products = []
    
    with pdfplumber.open(filepath) as pdf:
        total_pages = len(pdf.pages)
        print(f"   Pages: {total_pages}")
        
        for page_num, page in enumerate(pdf.pages, 1):
            tables = page.extract_tables()
            
            for table in tables:
                if not table or len(table) < 2:
                    continue
                
                for row in table:
                    if not row or len(row) < 2:
                        continue
                    
                    sku = clean_sku(row[0])
                    if not sku:
                        continue
                    
                    price = None
                    for cell in reversed(row):
                        p = clean_price(cell)
                        if p and p > 10:
                            price = p
                            break
                    
                    name = str(row[1]).strip() if len(row) > 1 and row[1] else f"Loloi {sku}"
                    
                    products.append({
                        'id': str(uuid4()),
                        'sku': sku,
                        'name': name[:200],
                        'price': price,
                        'vendor_code': 'loloi',
                        'vendor_name': 'Loloi',
                        'source_file': os.path.basename(filepath),
                        'source_page': page_num,
                        'imported_at': datetime.now(timezone.utc).isoformat()
                    })
    
    print(f"\n   Total Loloi: {len(products)}")
    return products

async def import_villa_house_pdf(filepath):
    """Import Villa & House PDF"""
    print(f"\n{'='*60}")
    print(f"📕 VILLA & HOUSE: {os.path.basename(filepath)}")
    print(f"{'='*60}")
    
    products = []
    
    with pdfplumber.open(filepath) as pdf:
        total_pages = len(pdf.pages)
        print(f"   Pages: {total_pages}")
        
        for page_num, page in enumerate(pdf.pages, 1):
            tables = page.extract_tables()
            
            for table in tables:
                if not table or len(table) < 2:
                    continue
                
                for row in table:
                    if not row or len(row) < 2:
                        continue
                    
                    sku = clean_sku(row[0])
                    if not sku:
                        continue
                    
                    price = None
                    for cell in reversed(row):
                        p = clean_price(cell)
                        if p and p > 10:
                            price = p
                            break
                    
                    name = str(row[1]).strip() if len(row) > 1 and row[1] else f"Villa & House {sku}"
                    
                    products.append({
                        'id': str(uuid4()),
                        'sku': sku,
                        'name': name[:200],
                        'price': price,
                        'vendor_code': 'villa_house',
                        'vendor_name': 'Villa & House',
                        'source_file': os.path.basename(filepath),
                        'source_page': page_num,
                        'imported_at': datetime.now(timezone.utc).isoformat()
                    })
    
    print(f"\n   Total Villa & House: {len(products)}")
    return products

async def import_wendy_jane_pdf(filepath):
    """Import Wendy Jane PDF"""
    print(f"\n{'='*60}")
    print(f"📕 WENDY JANE: {os.path.basename(filepath)}")
    print(f"{'='*60}")
    
    products = []
    
    with pdfplumber.open(filepath) as pdf:
        total_pages = len(pdf.pages)
        print(f"   Pages: {total_pages}")
        
        for page_num, page in enumerate(pdf.pages, 1):
            tables = page.extract_tables()
            
            for table in tables:
                if not table or len(table) < 2:
                    continue
                
                for row in table:
                    if not row or len(row) < 2:
                        continue
                    
                    sku = clean_sku(row[0])
                    if not sku:
                        continue
                    
                    price = None
                    for cell in reversed(row):
                        p = clean_price(cell)
                        if p and p > 10:
                            price = p
                            break
                    
                    name = str(row[1]).strip() if len(row) > 1 and row[1] else f"Wendy Jane {sku}"
                    
                    products.append({
                        'id': str(uuid4()),
                        'sku': sku,
                        'name': name[:200],
                        'price': price,
                        'vendor_code': 'wendy_jane',
                        'vendor_name': 'Wendy Jane',
                        'source_file': os.path.basename(filepath),
                        'source_page': page_num,
                        'imported_at': datetime.now(timezone.utc).isoformat()
                    })
    
    print(f"\n   Total Wendy Jane: {len(products)}")
    return products

async def main():
    """Main import function"""
    print("\n" + "="*80)
    print("🚀 COMPREHENSIVE PRODUCT IMPORT v2 - FINE TOOTH COMB")
    print("="*80)
    print(f"Started: {datetime.now()}")
    
    # Clear existing products
    await clear_products()
    
    all_products = []
    
    # Import Excel files
    excel_imports = [
        ('/app/backend/price_sheets/fourhands_app.xlsx', import_fourhands),
        ('/app/backend/revelation_prices.xlsx', import_revelation),
        ('/app/backend/saltlight_prices.xlsx', import_saltlight),
    ]
    
    for filepath, importer in excel_imports:
        if os.path.exists(filepath):
            products = await importer(filepath)
            all_products.extend(products)
    
    # Import PDF files
    pdf_imports = [
        ('/app/backend/price_sheets/bassett_furniture.pdf', import_bassett_pdf),
        ('/app/backend/price_sheets/bassett_home_decor.pdf', import_bassett_pdf),
        ('/app/backend/price_sheets/bassett_components.pdf', import_bassett_pdf),
        ('/app/backend/price_sheets/bernhardt_interiors.pdf', import_bernhardt_pdf),
        ('/app/backend/price_sheets/bernhardt_exteriors.pdf', import_bernhardt_pdf),
        ('/app/backend/price_sheets/bernhardt_casegoods.pdf', import_bernhardt_pdf),
        ('/app/backend/price_sheets/gabby_upholstery.pdf', import_gabby_pdf),
        ('/app/backend/price_sheets/gabby_casegoods.pdf', import_gabby_pdf),
        ('/app/backend/price_sheets/loloi.pdf', import_loloi_pdf),
        ('/app/backend/price_sheets/villa_house.pdf', import_villa_house_pdf),
        ('/app/backend/price_sheets/wendy_jane.pdf', import_wendy_jane_pdf),
    ]
    
    for filepath, importer in pdf_imports:
        if os.path.exists(filepath):
            products = await importer(filepath)
            all_products.extend(products)
    
    # Deduplicate
    print(f"\n🔄 Deduplicating {len(all_products)} products...")
    unique = {}
    for p in all_products:
        key = f"{p['vendor_code']}_{p['sku']}"
        if key not in unique:
            unique[key] = p
        elif p.get('price') and not unique[key].get('price'):
            unique[key] = p
    
    products_list = list(unique.values())
    print(f"   Unique: {len(products_list)}")
    
    # Insert into database
    print(f"\n💾 Saving to database...")
    db = await get_db()
    
    if products_list:
        # Insert in batches
        batch_size = 1000
        for i in range(0, len(products_list), batch_size):
            batch = products_list[i:i+batch_size]
            await db.master_products.insert_many(batch)
            print(f"   Inserted {min(i+batch_size, len(products_list))}/{len(products_list)}")
    
    # Final stats
    total = await db.master_products.count_documents({})
    priced = await db.master_products.count_documents({'price': {'$ne': None}})
    
    print(f"\n" + "="*80)
    print("📊 IMPORT COMPLETE")
    print("="*80)
    print(f"Total products: {total}")
    print(f"With prices: {priced} ({priced*100//max(total,1)}%)")
    print(f"Completed: {datetime.now()}")
    
    # Vendor breakdown
    pipeline = [{'$group': {'_id': '$vendor_name', 'count': {'$sum': 1}, 'priced': {'$sum': {'$cond': [{'$ne': ['$price', None]}, 1, 0]}}}}]
    vendors = await db.master_products.aggregate(pipeline).to_list(50)
    
    print(f"\nBy vendor:")
    for v in sorted(vendors, key=lambda x: x['count'], reverse=True):
        print(f"   {v['_id']}: {v['count']} ({v['priced']} priced)")

if __name__ == '__main__':
    asyncio.run(main())

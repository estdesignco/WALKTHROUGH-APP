#!/usr/bin/env python3
"""
COMPLETE Product Import - EVERY SHEET, EVERY PAGE
NO STONE UNTURNED
"""

import asyncio
import os
import re
import pandas as pd
import pdfplumber
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime, timezone
from uuid import uuid4

MONGO_URL = os.environ.get('MONGO_URL')
DB_NAME = 'interior_design_db'

def clean_price(val):
    if val is None or pd.isna(val):
        return None
    if isinstance(val, (int, float)):
        return float(val) if val > 0 and val < 500000 else None
    s = str(val).strip()
    s = re.sub(r'[^\d.,]', '', s)
    s = s.replace(',', '')
    try:
        price = float(s)
        return price if 0 < price < 500000 else None
    except:
        return None

def clean_sku(val):
    if val is None or pd.isna(val):
        return None
    s = str(val).strip().upper()
    s = s.lstrip('*').strip()
    if len(s) < 2 or len(s) > 30:
        return None
    if s.lower() in ['nan', 'none', '', 'sku', 'item', 'item #', 'no.', 'number', 'code', 'ups', 'product']:
        return None
    return s

async def get_db():
    client = AsyncIOMotorClient(MONGO_URL)
    return client[DB_NAME]

def process_excel_generic(filepath, vendor_name, vendor_code):
    """Process ANY Excel file - ALL sheets"""
    products = []
    try:
        xl = pd.ExcelFile(filepath)
        print(f"\n📊 {vendor_name}: {os.path.basename(filepath)} - {len(xl.sheet_names)} sheets")
        
        for sheet_name in xl.sheet_names:
            # Try different header rows
            for header_row in [0, 1, 2]:
                try:
                    df = pd.read_excel(filepath, sheet_name=sheet_name, header=header_row)
                    if df.empty:
                        continue
                    
                    df.columns = [str(c).strip().lower() for c in df.columns]
                    
                    # Find columns
                    sku_col = None
                    price_col = None
                    name_col = None
                    
                    for col in df.columns:
                        cl = col.lower()
                        if any(k in cl for k in ['sku', 'item', 'no.', 'no', 'code', 'product master', 'number']):
                            sku_col = col
                        if any(k in cl for k in ['price', 'cost', 'wholesale', 'net', 'map', 'retail']):
                            price_col = col
                        if any(k in cl for k in ['description', 'name', 'title']):
                            name_col = col
                    
                    if not sku_col:
                        sku_col = df.columns[0] if len(df.columns) > 0 else None
                    if not sku_col:
                        continue
                    
                    sheet_count = 0
                    for _, row in df.iterrows():
                        sku = clean_sku(row.get(sku_col))
                        if not sku:
                            continue
                        
                        price = clean_price(row.get(price_col)) if price_col else None
                        name = str(row.get(name_col, '')).strip() if name_col else ''
                        if not name or name.lower() == 'nan':
                            name = f"{vendor_name} {sku}"
                        
                        products.append({
                            'id': str(uuid4()),
                            'sku': sku,
                            'name': name[:200],
                            'price': price,
                            'vendor_code': vendor_code,
                            'vendor_name': vendor_name,
                            'source_file': os.path.basename(filepath),
                            'source_sheet': sheet_name,
                            'imported_at': datetime.now(timezone.utc).isoformat()
                        })
                        sheet_count += 1
                    
                    if sheet_count > 0:
                        print(f"   ✓ {sheet_name}: {sheet_count} products")
                        break  # Found good header row
                        
                except Exception as e:
                    continue
                    
    except Exception as e:
        print(f"   ❌ Error: {e}")
    
    return products

def process_pdf_generic(filepath, vendor_name, vendor_code):
    """Process ANY PDF file - ALL pages"""
    products = []
    try:
        with pdfplumber.open(filepath) as pdf:
            total_pages = len(pdf.pages)
            print(f"\n📕 {vendor_name}: {os.path.basename(filepath)} - {total_pages} pages")
            
            for page_num, page in enumerate(pdf.pages, 1):
                page_products = 0
                
                # Try table extraction
                tables = page.extract_tables()
                for table in tables:
                    if not table or len(table) < 2:
                        continue
                    
                    for row in table:
                        if not row or len(row) < 2:
                            continue
                        
                        # First non-empty cell as SKU
                        sku = None
                        for cell in row:
                            sku = clean_sku(cell)
                            if sku:
                                break
                        
                        if not sku:
                            continue
                        
                        # Find price (usually last numeric value)
                        price = None
                        for cell in reversed(row):
                            p = clean_price(cell)
                            if p:
                                price = p
                                break
                        
                        # Name from second cell
                        name = ''
                        for i, cell in enumerate(row):
                            if i > 0 and cell and not clean_price(cell) and clean_sku(row[0]) == sku:
                                name = str(cell).strip()
                                break
                        if not name:
                            name = f"{vendor_name} {sku}"
                        
                        products.append({
                            'id': str(uuid4()),
                            'sku': sku,
                            'name': name[:200],
                            'price': price,
                            'vendor_code': vendor_code,
                            'vendor_name': vendor_name,
                            'source_file': os.path.basename(filepath),
                            'source_page': page_num,
                            'imported_at': datetime.now(timezone.utc).isoformat()
                        })
                        page_products += 1
                
                # Progress every 20 pages
                if page_num % 20 == 0:
                    print(f"   Progress: {page_num}/{total_pages} pages")
            
            print(f"   ✓ Total: {len(products)} products")
            
    except Exception as e:
        print(f"   ❌ Error: {e}")
    
    return products

async def main():
    print("="*80)
    print("🚀 COMPLETE PRODUCT IMPORT - EVERY FILE, EVERY SHEET, EVERY PAGE")
    print("="*80)
    
    db = await get_db()
    all_products = []
    
    # Clear old imported products
    deleted = await db.master_products.delete_many({'source_file': {'$exists': True}})
    print(f"Cleared {deleted.deleted_count} previously imported products\n")
    
    os.chdir('/app/backend')
    
    # ALL EXCEL FILES
    excel_files = [
        ('revelation_prices.xlsx', 'Uttermost Revelation', 'uttermost'),
        ('revelation_wholesale.xlsx', 'Uttermost Revelation', 'uttermost'),
        ('saltlight_prices.xlsx', 'Salt Light', 'salt_light'),
        ('saltlight_vol9.xlsx', 'Salt Light', 'salt_light'),
        ('monthly_price_list.xlsx', 'Uttermost', 'uttermost'),
        ('uttermost_outdoor.xlsx', 'Uttermost Outdoor', 'uttermost'),
        ('fourhands_full.xlsx', 'Four Hands', 'four_hands'),
        ('price_sheets/fourhands_app.xlsx', 'Four Hands', 'four_hands'),
    ]
    
    for filepath, vendor_name, vendor_code in excel_files:
        if os.path.exists(filepath):
            products = process_excel_generic(filepath, vendor_name, vendor_code)
            all_products.extend(products)
    
    # ALL PDF FILES
    pdf_files = [
        ('price_sheets/bassett_furniture.pdf', 'Bassett Mirror', 'bassett_mirror'),
        ('price_sheets/bassett_home_decor.pdf', 'Bassett Mirror', 'bassett_mirror'),
        ('price_sheets/bassett_components.pdf', 'Bassett Mirror', 'bassett_mirror'),
        ('gabby_casegoods_map.pdf', 'Gabby', 'gabby'),
        ('gabby_upholstery_map.pdf', 'Gabby', 'gabby'),
        ('price_sheets/gabby_casegoods.pdf', 'Gabby', 'gabby'),
        ('price_sheets/gabby_upholstery.pdf', 'Gabby', 'gabby'),
        ('price_sheets/loloi.pdf', 'Loloi', 'loloi'),
        ('loloi_full.pdf', 'Loloi', 'loloi'),
        ('price_sheets/villa_house.pdf', 'Villa & House', 'villa_house'),
        ('villa_house_stocking.pdf', 'Villa & House', 'villa_house'),
        ('price_sheets/wendy_jane.pdf', 'Wendy Jane', 'wendy_jane'),
        ('wendy_jane_map.pdf', 'Wendy Jane', 'wendy_jane'),
        ('worlds_away.pdf', 'Worlds Away', 'worlds_away'),
        ('bernhardt_casegoods_oct.pdf', 'Bernhardt', 'bernhardt'),
        ('bernhardt_interiors_oct.pdf', 'Bernhardt', 'bernhardt'),
        ('bernhardt_exteriors_oct.pdf', 'Bernhardt', 'bernhardt'),
        ('price_sheets/bernhardt_casegoods.pdf', 'Bernhardt', 'bernhardt'),
        ('price_sheets/bernhardt_interiors.pdf', 'Bernhardt', 'bernhardt'),
        ('price_sheets/bernhardt_exteriors.pdf', 'Bernhardt', 'bernhardt'),
    ]
    
    for filepath, vendor_name, vendor_code in pdf_files:
        if os.path.exists(filepath):
            products = process_pdf_generic(filepath, vendor_name, vendor_code)
            all_products.extend(products)
    
    # Deduplicate - keep products with prices
    print(f"\n🔄 Deduplicating {len(all_products)} products...")
    unique = {}
    for p in all_products:
        key = f"{p['vendor_code']}_{p['sku']}"
        if key not in unique:
            unique[key] = p
        elif p.get('price') and not unique[key].get('price'):
            unique[key] = p
        elif p.get('price') and unique[key].get('price') and p.get('price') > unique[key].get('price'):
            unique[key] = p  # Keep higher price (usually retail)
    
    products_list = list(unique.values())
    print(f"   Unique products: {len(products_list)}")
    
    # Insert into database
    print(f"\n💾 Saving to database...")
    if products_list:
        batch_size = 1000
        for i in range(0, len(products_list), batch_size):
            batch = products_list[i:i+batch_size]
            await db.master_products.insert_many(batch)
        print(f"   Inserted {len(products_list)} products")
    
    # Final stats
    total = await db.master_products.count_documents({})
    priced = await db.master_products.count_documents({'price': {'$gt': 0}})
    
    print(f"\n{'='*80}")
    print("📊 FINAL DATABASE STATISTICS")
    print(f"{'='*80}")
    print(f"Total products: {total}")
    print(f"With prices: {priced} ({priced*100//max(total,1)}%)")
    
    # Vendor breakdown
    pipeline = [
        {'$group': {'_id': '$vendor_name', 'count': {'$sum': 1}, 'priced': {'$sum': {'$cond': [{'$gt': ['$price', 0]}, 1, 0]}}}}
    ]
    vendors = await db.master_products.aggregate(pipeline).to_list(50)
    
    print(f"\nBy vendor:")
    for v in sorted(vendors, key=lambda x: x['count'], reverse=True):
        pct = v['priced']*100//max(v['count'],1)
        print(f"   {v['_id']}: {v['count']} products ({v['priced']} priced - {pct}%)")

if __name__ == '__main__':
    asyncio.run(main())

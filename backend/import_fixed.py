#!/usr/bin/env python3
"""
FIXED Product Import - Uses upsert to avoid duplicates
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
    if len(s) < 3 or len(s) > 25:
        return None
    # Skip common header/invalid values
    bad_values = ['nan', 'none', '', 'sku', 'item', 'item #', 'no.', 'number', 'code', 'ups', 
                  'product', 'description', 'price', 'name', 'total', 'page', 'wholesale',
                  'retail', 'map', 'dimensions', 'size', 'finish', 'material']
    if s.lower() in bad_values:
        return None
    # Must have at least some alphanumeric
    if not re.search(r'[A-Z0-9]', s):
        return None
    return s

async def get_db():
    client = AsyncIOMotorClient(MONGO_URL)
    return client[DB_NAME]

async def upsert_products(db, products, vendor_name):
    """Upsert products one by one to handle duplicates"""
    count = 0
    for p in products:
        if not p.get('sku'):
            continue
        try:
            await db.master_products.update_one(
                {'sku': p['sku'], 'vendor_code': p['vendor_code']},
                {'$set': p},
                upsert=True
            )
            count += 1
        except Exception as e:
            pass  # Skip duplicates
    print(f"   ✓ Upserted {count} products for {vendor_name}")
    return count

def process_excel_generic(filepath, vendor_name, vendor_code):
    """Process ANY Excel file - ALL sheets"""
    products = []
    try:
        xl = pd.ExcelFile(filepath)
        print(f"\n📊 {vendor_name}: {os.path.basename(filepath)} - {len(xl.sheet_names)} sheets")
        
        for sheet_name in xl.sheet_names:
            best_products = []
            
            # Try different header rows
            for header_row in [0, 1, 2, 3]:
                try:
                    df = pd.read_excel(filepath, sheet_name=sheet_name, header=header_row)
                    if df.empty or len(df) < 2:
                        continue
                    
                    df.columns = [str(c).strip().lower() for c in df.columns]
                    
                    # Find SKU column
                    sku_col = None
                    for col in df.columns:
                        cl = col.lower()
                        if any(k in cl for k in ['item #', 'sku', 'item', 'no.', 'product master code', 'style']):
                            sku_col = col
                            break
                    if not sku_col:
                        sku_col = df.columns[0] if len(df.columns) > 0 else None
                    
                    # Find price column
                    price_col = None
                    for col in df.columns:
                        cl = col.lower()
                        if any(k in cl for k in ['wholesale', 'net', 'cost', 'price', 'map']):
                            price_col = col
                            break
                    
                    # Find name column
                    name_col = None
                    for col in df.columns:
                        cl = col.lower()
                        if any(k in cl for k in ['description', 'name', 'title']):
                            name_col = col
                            break
                    
                    if not sku_col:
                        continue
                    
                    sheet_products = []
                    for _, row in df.iterrows():
                        sku = clean_sku(row.get(sku_col))
                        if not sku:
                            continue
                        
                        price = clean_price(row.get(price_col)) if price_col else None
                        name = str(row.get(name_col, '')).strip() if name_col else ''
                        if not name or name.lower() == 'nan':
                            name = f"{vendor_name} {sku}"
                        
                        sheet_products.append({
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
                    
                    if len(sheet_products) > len(best_products):
                        best_products = sheet_products
                        
                except Exception as e:
                    continue
            
            if best_products:
                priced = sum(1 for p in best_products if p.get('price'))
                print(f"   ✓ {sheet_name}: {len(best_products)} products ({priced} priced)")
                products.extend(best_products)
                    
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
                # Try table extraction
                tables = page.extract_tables()
                for table in tables:
                    if not table or len(table) < 2:
                        continue
                    
                    for row in table:
                        if not row or len(row) < 2:
                            continue
                        
                        # First valid cell as SKU
                        sku = None
                        for cell in row:
                            sku = clean_sku(cell)
                            if sku:
                                break
                        
                        if not sku:
                            continue
                        
                        # Find price
                        price = None
                        for cell in reversed(row):
                            p = clean_price(cell)
                            if p:
                                price = p
                                break
                        
                        # Name from second cell
                        name = ''
                        for i, cell in enumerate(row[1:], 1):
                            if cell and str(cell).strip() and not clean_price(cell):
                                name = str(cell).strip()[:100]
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
                
                # Progress every 25 pages
                if page_num % 25 == 0:
                    print(f"   Progress: {page_num}/{total_pages}")
            
            priced = sum(1 for p in products if p.get('price'))
            print(f"   ✓ Total: {len(products)} products ({priced} priced)")
            
    except Exception as e:
        print(f"   ❌ Error: {e}")
    
    return products

async def main():
    print("="*80)
    print("🚀 COMPLETE PRODUCT IMPORT v2 - WITH UPSERT")
    print("="*80)
    
    db = await get_db()
    total_imported = 0
    
    os.chdir('/app/backend')
    
    # ALL EXCEL FILES
    excel_files = [
        ('revelation_prices.xlsx', 'Uttermost Revelation', 'uttermost'),
        ('saltlight_prices.xlsx', 'Salt Light', 'salt_light'),
        ('saltlight_vol9.xlsx', 'Salt Light', 'salt_light'),
        ('monthly_price_list.xlsx', 'Uttermost', 'uttermost'),
        ('uttermost_outdoor.xlsx', 'Uttermost Outdoor', 'uttermost_outdoor'),
        ('fourhands_full.xlsx', 'Four Hands', 'four_hands'),
        ('price_sheets/fourhands_app.xlsx', 'Four Hands', 'four_hands'),
    ]
    
    for filepath, vendor_name, vendor_code in excel_files:
        if os.path.exists(filepath):
            products = process_excel_generic(filepath, vendor_name, vendor_code)
            count = await upsert_products(db, products, vendor_name)
            total_imported += count
    
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
    ]
    
    for filepath, vendor_name, vendor_code in pdf_files:
        if os.path.exists(filepath):
            products = process_pdf_generic(filepath, vendor_name, vendor_code)
            count = await upsert_products(db, products, vendor_name)
            total_imported += count
    
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

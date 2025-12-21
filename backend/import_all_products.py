#!/usr/bin/env python3
"""
Comprehensive Product Import Script
Imports ALL products from ALL sheets in ALL files (PDFs and Excel)
Goes through EVERY page with a fine-tooth comb
"""

import os
import sys
import re
import json
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

# Data directories
DATA_DIRS = [
    '/app/backend/price_sheets',
    '/app/backend/data/products',
    '/app/backend'
]

# Price patterns
PRICE_PATTERNS = [
    r'\$[\d,]+\.?\d*',  # $1,234.56
    r'[\d,]+\.?\d*\s*(?:USD|usd)',  # 1234.56 USD
    r'(?:price|cost|net|retail|map|wholesale)[\s:]*\$?[\d,]+\.?\d*',  # Price: $123
]

# SKU patterns
SKU_PATTERNS = [
    r'^[A-Z]{1,4}\d{3,6}[A-Z]?$',  # Standard SKUs like ABC1234
    r'^[A-Z0-9]{5,15}$',  # Alphanumeric SKUs
    r'^\d{5,8}$',  # Numeric SKUs
    r'^[A-Z]{2,4}-\d{3,6}$',  # SKUs with dash
]

def clean_price(price_str):
    """Extract numeric price from string"""
    if not price_str:
        return None
    if isinstance(price_str, (int, float)):
        return float(price_str)
    price_str = str(price_str)
    # Remove currency symbols and commas
    cleaned = re.sub(r'[^\d.]', '', price_str)
    try:
        return float(cleaned) if cleaned else None
    except:
        return None

def is_valid_sku(text):
    """Check if text looks like a valid SKU"""
    if not text or not isinstance(text, str):
        return False
    text = str(text).strip().upper()
    if len(text) < 3 or len(text) > 20:
        return False
    # Must have at least one letter or be all numbers with 5+ digits
    if re.match(r'^[A-Z0-9-]+$', text):
        return True
    return False

def extract_price_from_text(text):
    """Extract price from text using multiple patterns"""
    if not text:
        return None
    text = str(text)
    for pattern in PRICE_PATTERNS:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            return clean_price(match.group())
    return None

async def get_db():
    """Get MongoDB connection"""
    client = AsyncIOMotorClient(MONGO_URL)
    return client[DB_NAME]

async def import_excel_file(filepath, vendor_name):
    """Import ALL sheets from an Excel file"""
    print(f"\n{'='*60}")
    print(f"📊 Processing Excel: {os.path.basename(filepath)}")
    print(f"   Vendor: {vendor_name}")
    print(f"{'='*60}")
    
    products = []
    
    try:
        # Read all sheet names
        xl = pd.ExcelFile(filepath)
        sheets = xl.sheet_names
        print(f"   Found {len(sheets)} sheets: {sheets}")
        
        for sheet_name in sheets:
            print(f"\n   📄 Processing sheet: '{sheet_name}'")
            try:
                df = pd.read_excel(filepath, sheet_name=sheet_name, header=None)
                print(f"      Raw size: {len(df)} rows x {len(df.columns)} columns")
                
                if df.empty:
                    print(f"      ⚠️ Empty sheet, skipping")
                    continue
                
                # Try to find header row
                header_row = 0
                for idx, row in df.iterrows():
                    row_str = ' '.join(str(v).lower() for v in row.values if pd.notna(v))
                    if any(k in row_str for k in ['sku', 'item', 'product', 'price', 'cost', 'net', 'wholesale']):
                        header_row = idx
                        break
                
                # Re-read with header
                df = pd.read_excel(filepath, sheet_name=sheet_name, header=header_row)
                df.columns = [str(c).strip().lower() for c in df.columns]
                print(f"      Columns: {list(df.columns)[:8]}...")
                
                # Find SKU column
                sku_col = None
                for col in df.columns:
                    if any(k in col.lower() for k in ['sku', 'item', 'product', 'style', 'model', 'code', 'number']):
                        sku_col = col
                        break
                if not sku_col:
                    sku_col = df.columns[0]  # First column as fallback
                
                # Find price column
                price_col = None
                for col in df.columns:
                    if any(k in col.lower() for k in ['price', 'cost', 'net', 'wholesale', 'retail', 'map', 'usd']):
                        price_col = col
                        break
                
                # Find name/description column
                name_col = None
                for col in df.columns:
                    if any(k in col.lower() for k in ['description', 'name', 'title', 'product']):
                        name_col = col
                        break
                
                print(f"      Using columns - SKU: {sku_col}, Price: {price_col}, Name: {name_col}")
                
                sheet_products = 0
                for idx, row in df.iterrows():
                    sku = str(row.get(sku_col, '')).strip().upper()
                    
                    # Skip empty or invalid SKUs
                    if not sku or sku == 'NAN' or len(sku) < 2:
                        continue
                    
                    # Get price
                    price = None
                    if price_col:
                        price = clean_price(row.get(price_col))
                    
                    # Get name
                    name = ''
                    if name_col:
                        name = str(row.get(name_col, '')).strip()
                        if name == 'nan':
                            name = ''
                    
                    # Build product name from available data
                    if not name:
                        name = f"{vendor_name} {sku}"
                    
                    products.append({
                        'id': str(uuid4()),
                        'sku': sku,
                        'name': name,
                        'price': price,
                        'vendor_code': vendor_name.lower().replace(' ', '_'),
                        'vendor_name': vendor_name,
                        'source_file': os.path.basename(filepath),
                        'source_sheet': sheet_name,
                        'imported_at': datetime.now(timezone.utc).isoformat()
                    })
                    sheet_products += 1
                
                print(f"      ✅ Extracted {sheet_products} products from sheet")
                
            except Exception as e:
                print(f"      ❌ Error processing sheet '{sheet_name}': {e}")
                continue
        
        print(f"\n   📦 Total from file: {len(products)} products")
        
    except Exception as e:
        print(f"   ❌ Error processing Excel file: {e}")
    
    return products

async def import_pdf_file(filepath, vendor_name):
    """Import ALL pages from a PDF file"""
    print(f"\n{'='*60}")
    print(f"📕 Processing PDF: {os.path.basename(filepath)}")
    print(f"   Vendor: {vendor_name}")
    print(f"{'='*60}")
    
    products = []
    
    try:
        with pdfplumber.open(filepath) as pdf:
            total_pages = len(pdf.pages)
            print(f"   Total pages: {total_pages}")
            
            for page_num, page in enumerate(pdf.pages, 1):
                print(f"\n   📄 Processing page {page_num}/{total_pages}")
                page_products = 0
                
                try:
                    # Extract tables from page
                    tables = page.extract_tables()
                    
                    if tables:
                        for table_idx, table in enumerate(tables):
                            if not table or len(table) < 2:
                                continue
                            
                            # First row is usually header
                            headers = [str(h).lower().strip() if h else '' for h in table[0]]
                            
                            # Find column indices
                            sku_idx = None
                            price_idx = None
                            name_idx = None
                            
                            for i, h in enumerate(headers):
                                if any(k in h for k in ['sku', 'item', 'style', 'model', 'code', 'number', 'id']):
                                    sku_idx = i
                                if any(k in h for k in ['price', 'cost', 'net', 'wholesale', 'retail', 'map']):
                                    price_idx = i
                                if any(k in h for k in ['description', 'name', 'title', 'product']):
                                    name_idx = i
                            
                            # If no header found, assume first column is SKU
                            if sku_idx is None:
                                sku_idx = 0
                            
                            # Process rows (skip header)
                            for row in table[1:]:
                                if not row or len(row) <= sku_idx:
                                    continue
                                
                                sku = str(row[sku_idx] or '').strip().upper()
                                if not sku or len(sku) < 2 or sku.lower() in ['nan', 'none', '']:
                                    continue
                                
                                # Get price
                                price = None
                                if price_idx is not None and len(row) > price_idx:
                                    price = clean_price(row[price_idx])
                                
                                # If no price column, look for price in any column
                                if price is None:
                                    for cell in row:
                                        if cell:
                                            extracted = extract_price_from_text(str(cell))
                                            if extracted and extracted > 0:
                                                price = extracted
                                                break
                                
                                # Get name
                                name = ''
                                if name_idx is not None and len(row) > name_idx:
                                    name = str(row[name_idx] or '').strip()
                                
                                if not name or name.lower() == 'nan':
                                    name = f"{vendor_name} {sku}"
                                
                                products.append({
                                    'id': str(uuid4()),
                                    'sku': sku,
                                    'name': name,
                                    'price': price,
                                    'vendor_code': vendor_name.lower().replace(' ', '_'),
                                    'vendor_name': vendor_name,
                                    'source_file': os.path.basename(filepath),
                                    'source_page': page_num,
                                    'imported_at': datetime.now(timezone.utc).isoformat()
                                })
                                page_products += 1
                    
                    # Also extract text-based products if few from tables
                    if page_products < 5:
                        text = page.extract_text()
                        if text:
                            lines = text.split('\n')
                            for line in lines:
                                # Try to find SKU-price patterns
                                parts = line.split()
                                if len(parts) >= 2:
                                    potential_sku = parts[0].strip().upper()
                                    if is_valid_sku(potential_sku):
                                        price = extract_price_from_text(line)
                                        
                                        # Check if we already have this SKU
                                        if not any(p['sku'] == potential_sku for p in products[-50:]):
                                            products.append({
                                                'id': str(uuid4()),
                                                'sku': potential_sku,
                                                'name': f"{vendor_name} {potential_sku}",
                                                'price': price,
                                                'vendor_code': vendor_name.lower().replace(' ', '_'),
                                                'vendor_name': vendor_name,
                                                'source_file': os.path.basename(filepath),
                                                'source_page': page_num,
                                                'imported_at': datetime.now(timezone.utc).isoformat()
                                            })
                                            page_products += 1
                    
                    print(f"      ✅ Page {page_num}: {page_products} products")
                    
                except Exception as e:
                    print(f"      ❌ Error on page {page_num}: {e}")
                    continue
            
            print(f"\n   📦 Total from file: {len(products)} products")
            
    except Exception as e:
        print(f"   ❌ Error processing PDF file: {e}")
    
    return products

def detect_vendor_from_filename(filename):
    """Detect vendor name from filename"""
    filename = filename.lower()
    
    vendor_map = {
        'bassett': 'Bassett Mirror',
        'bernhardt': 'Bernhardt',
        'gabby': 'Gabby',
        'loloi': 'Loloi',
        'villa': 'Villa & House',
        'wendy': 'Wendy Jane',
        'fourhands': 'Four Hands',
        'four hands': 'Four Hands',
        'four_hands': 'Four Hands',
        'uttermost': 'Uttermost',
        'revelation': 'Uttermost Revelation',
        'saltlight': 'Salt Light',
        'salt_light': 'Salt Light',
        'worlds away': 'Worlds Away',
        'worlds_away': 'Worlds Away',
        'hvl': 'HVL Group',
        'hudson valley': 'Hudson Valley Lighting',
        'troy': 'Troy Lighting',
        'corbett': 'Corbett Lighting',
        'mitzi': 'Mitzi',
        'rowe': 'Rowe Furniture',
        'regina': 'Regina Andrew',
        'visual comfort': 'Visual Comfort',
        'surya': 'Surya',
        'global views': 'Global Views',
    }
    
    for key, vendor in vendor_map.items():
        if key in filename:
            return vendor
    
    # Try to extract from filename
    clean_name = re.sub(r'[-_\d.]+', ' ', filename)
    clean_name = ' '.join(word.capitalize() for word in clean_name.split())
    return clean_name.strip() or 'Unknown Vendor'

async def import_all_files():
    """Import products from ALL files in data directories"""
    print("\n" + "="*80)
    print("🚀 COMPREHENSIVE PRODUCT IMPORT - NO STONE UNTURNED")
    print("="*80)
    print(f"Started at: {datetime.now()}")
    
    db = await get_db()
    all_products = []
    processed_files = []
    
    # Find all data files
    all_files = []
    for data_dir in DATA_DIRS:
        if os.path.exists(data_dir):
            for file in os.listdir(data_dir):
                filepath = os.path.join(data_dir, file)
                if os.path.isfile(filepath):
                    ext = file.lower().split('.')[-1]
                    if ext in ['pdf', 'xlsx', 'xls']:
                        all_files.append(filepath)
    
    print(f"\n📁 Found {len(all_files)} files to process:")
    for f in all_files:
        print(f"   - {os.path.basename(f)}")
    
    # Process each file
    for filepath in all_files:
        filename = os.path.basename(filepath)
        ext = filename.lower().split('.')[-1]
        vendor_name = detect_vendor_from_filename(filename)
        
        try:
            if ext in ['xlsx', 'xls']:
                products = await import_excel_file(filepath, vendor_name)
            elif ext == 'pdf':
                products = await import_pdf_file(filepath, vendor_name)
            else:
                continue
            
            all_products.extend(products)
            processed_files.append({
                'filename': filename,
                'vendor': vendor_name,
                'products_found': len(products)
            })
            
        except Exception as e:
            print(f"❌ Failed to process {filename}: {e}")
    
    # Deduplicate by SKU (keep first occurrence with price)
    print(f"\n🔄 Deduplicating {len(all_products)} products...")
    unique_products = {}
    for p in all_products:
        sku = p['sku']
        if sku not in unique_products:
            unique_products[sku] = p
        elif p.get('price') and not unique_products[sku].get('price'):
            # Keep the one with price
            unique_products[sku] = p
    
    products_to_insert = list(unique_products.values())
    print(f"   Unique products: {len(products_to_insert)}")
    
    # Insert into database
    print(f"\n💾 Saving to database...")
    
    # Use upsert to avoid duplicates
    inserted = 0
    updated = 0
    
    for product in products_to_insert:
        result = await db.master_products.update_one(
            {'sku': product['sku'], 'vendor_code': product['vendor_code']},
            {'$set': product},
            upsert=True
        )
        if result.upserted_id:
            inserted += 1
        else:
            updated += 1
    
    # Get final stats
    total_count = await db.master_products.count_documents({})
    priced_count = await db.master_products.count_documents({'price': {'$ne': None}})
    
    print(f"\n" + "="*80)
    print("📊 IMPORT COMPLETE - FINAL STATISTICS")
    print("="*80)
    print(f"Files processed: {len(processed_files)}")
    for pf in processed_files:
        print(f"   {pf['filename']}: {pf['products_found']} products ({pf['vendor']})")
    print(f"\nDatabase totals:")
    print(f"   Total products: {total_count}")
    print(f"   Products with price: {priced_count} ({priced_count*100//max(total_count,1)}%)")
    print(f"   New products inserted: {inserted}")
    print(f"   Products updated: {updated}")
    print(f"\nCompleted at: {datetime.now()}")
    
    return {
        'files_processed': len(processed_files),
        'total_products': total_count,
        'priced_products': priced_count,
        'inserted': inserted,
        'updated': updated
    }

if __name__ == '__main__':
    asyncio.run(import_all_files())

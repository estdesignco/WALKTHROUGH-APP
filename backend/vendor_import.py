"""
Vendor Price List Import Script
Processes vendor Excel/PDF files and imports products with images into MongoDB
"""

import os
import json
import asyncio
import aiohttp
import openpyxl
from uuid import uuid4
from datetime import datetime, timezone
from motor.motor_asyncio import AsyncIOMotorClient
import re

# MongoDB connection
MONGO_URL = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')

# Vendor image URL patterns (for scraping)
VENDOR_IMAGE_PATTERNS = {
    'four_hands': 'https://www.fourhands.com/pub/media/catalog/product/{sku_path}.jpg',
    'uttermost': 'https://www.quoizel.com/quoizel-image?productId={sku}',
    'gabby': 'https://www.gabby.net/images/products/{sku}.jpg',
}

async def get_db():
    """Get MongoDB database connection"""
    client = AsyncIOMotorClient(MONGO_URL)
    return client.decor_sync

async def fetch_image_url(session, vendor, sku, product_name):
    """Try to construct or fetch image URL for a product"""
    image_url = None
    
    try:
        if vendor.lower() == 'four_hands' or vendor.lower() == 'four hands':
            # Four Hands image pattern: convert SKU like "100009-004" to path
            sku_clean = sku.replace('-', '_').lower()
            # Try multiple patterns
            patterns = [
                f"https://www.fourhands.com/pub/media/catalog/product/{sku_clean[0]}/{sku_clean[1]}/{sku_clean}.jpg",
                f"https://cdn.fourhands.com/products/{sku}.jpg",
                f"https://www.fourhands.com/media/catalog/product/{sku}.jpg",
            ]
            for pattern in patterns:
                try:
                    async with session.head(pattern, timeout=5) as resp:
                        if resp.status == 200:
                            image_url = pattern
                            break
                except:
                    continue
                    
        elif vendor.lower() == 'uttermost':
            # Uttermost patterns
            sku_clean = sku.replace(' ', '').replace('-', '')
            patterns = [
                f"https://www.quoizel.com/quoizel-image?productId={sku_clean}",
                f"https://www.quoizel.com/quoizel-image?productId={sku}",
            ]
            for pattern in patterns:
                try:
                    async with session.head(pattern, timeout=5) as resp:
                        if resp.status == 200:
                            image_url = pattern
                            break
                except:
                    continue
                    
    except Exception as e:
        print(f"  Image fetch error for {sku}: {e}")
    
    return image_url


def process_four_hands_excel(filepath):
    """Process Four Hands Excel file"""
    products = []
    wb = openpyxl.load_workbook(filepath, read_only=True)
    
    for sheet_name in wb.sheetnames:
        ws = wb[sheet_name]
        
        for row_num, row in enumerate(ws.iter_rows(values_only=True), 1):
            if row_num == 1:
                # Skip header row
                continue
            
            if not row or not row[0]:  # Skip empty rows
                continue
                
            try:
                # Parse cost - handle both numbers and strings
                cost_val = row[7] if len(row) > 7 else 0
                if cost_val is None:
                    cost_val = 0.0
                elif isinstance(cost_val, str):
                    # Remove any non-numeric characters except decimal point
                    cost_val = ''.join(c for c in cost_val if c.isdigit() or c == '.')
                    cost_val = float(cost_val) if cost_val else 0.0
                else:
                    cost_val = float(cost_val)
                
                product = {
                    'id': str(uuid4()),
                    'vendor': 'Four Hands',
                    'vendor_code': 'FOURHANDS',
                    'sku': str(row[0]).strip() if row[0] else '',
                    'name': str(row[1]).strip() if row[1] else '',
                    'category': str(row[2]).strip() if len(row) > 2 and row[2] else '',
                    'subcategory': str(row[3]).strip() if len(row) > 3 and row[3] else '',
                    'collection': str(row[4]).strip() if len(row) > 4 and row[4] else '',
                    'suite': str(row[5]).strip() if len(row) > 5 and row[5] else '',
                    'status': str(row[6]).strip() if len(row) > 6 and row[6] else '',
                    'cost': cost_val,
                    'price': cost_val * 2.0,  # Markup for retail price
                    'image_url': '',
                    'source_sheet': sheet_name,
                    'created_at': datetime.now(timezone.utc).isoformat(),
                    'updated_at': datetime.now(timezone.utc).isoformat(),
                }
                
                if product['sku'] and product['name']:
                    products.append(product)
                    
            except Exception as e:
                # Silently skip problematic rows
                continue
    
    wb.close()
    return products


def process_uttermost_excel(filepath):
    """Process Uttermost Excel file (multiple sheets)"""
    products = []
    wb = openpyxl.load_workbook(filepath, read_only=True)
    
    for sheet_name in wb.sheetnames:
        ws = wb[sheet_name]
        print(f"  Processing sheet: {sheet_name}")
        
        headers = None
        for row_num, row in enumerate(ws.iter_rows(values_only=True), 1):
            # Find header row (contains 'No.' or 'Name')
            if row_num <= 2:
                if row and any(str(cell).strip().lower() in ['no.', 'name', 'sku'] for cell in row if cell):
                    headers = [str(h).lower().strip() if h else f'col{i}' for i, h in enumerate(row)]
                continue
            
            if not row or not row[0]:
                continue
                
            try:
                # Extract price - usually in column 6 or 7
                price = 0.0
                for i in range(5, min(8, len(row))):
                    if row[i] and str(row[i]).replace('.', '').replace(',', '').isdigit():
                        price = float(str(row[i]).replace(',', ''))
                        break
                
                product = {
                    'id': str(uuid4()),
                    'vendor': 'Uttermost',
                    'vendor_code': 'UTTERMOST',
                    'sku': str(row[0]).strip() if row[0] else '',
                    'name': str(row[1]).strip() if len(row) > 1 and row[1] else '',
                    'category': sheet_name,
                    'subcategory': '',
                    'size': str(row[3]).strip() if len(row) > 3 and row[3] else '',
                    'weight': str(row[2]).strip() if len(row) > 2 and row[2] else '',
                    'price': price,
                    'cost': price * 0.5,  # Estimate cost at 50% of wholesale
                    'image_url': '',
                    'source_sheet': sheet_name,
                    'created_at': datetime.now(timezone.utc).isoformat(),
                    'updated_at': datetime.now(timezone.utc).isoformat(),
                }
                
                if product['sku'] and product['name']:
                    products.append(product)
                    
            except Exception as e:
                print(f"  Error processing row {row_num} in {sheet_name}: {e}")
                continue
    
    wb.close()
    return products


async def import_products_to_db(products, vendor_name):
    """Import products to MongoDB master_products collection"""
    db = await get_db()
    collection = db.master_products
    
    # Create index on sku and vendor
    await collection.create_index([("sku", 1), ("vendor", 1)], unique=True)
    await collection.create_index([("name", "text")])
    
    imported = 0
    updated = 0
    
    for product in products:
        try:
            # Upsert - update if exists, insert if not
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
            print(f"  Error importing {product['sku']}: {e}")
    
    return imported, updated


async def fetch_and_update_images(vendor_name, limit=100):
    """Fetch images for products that don't have them"""
    db = await get_db()
    collection = db.master_products
    
    # Find products without images
    products = await collection.find(
        {"vendor": vendor_name, "$or": [{"image_url": ""}, {"image_url": None}]}
    ).limit(limit).to_list(limit)
    
    print(f"  Found {len(products)} products without images")
    
    updated = 0
    async with aiohttp.ClientSession() as session:
        for product in products:
            image_url = await fetch_image_url(
                session, 
                product['vendor'], 
                product['sku'], 
                product['name']
            )
            
            if image_url:
                await collection.update_one(
                    {"_id": product['_id']},
                    {"$set": {"image_url": image_url}}
                )
                updated += 1
                print(f"    ✓ Image found for {product['sku']}")
    
    return updated


async def main():
    """Main import function"""
    print("=" * 60)
    print("VENDOR PRICE LIST IMPORT")
    print("=" * 60)
    
    # Process Four Hands
    print("\n[1/3] Processing Four Hands...")
    fh_file = '/app/fourhands_catalog.xlsx'
    if os.path.exists(fh_file):
        products = process_four_hands_excel(fh_file)
        print(f"  Extracted {len(products)} products")
        imported, updated = await import_products_to_db(products, 'Four Hands')
        print(f"  Imported: {imported}, Updated: {updated}")
        
        # Save to JSON for persistence
        with open('/app/backend/data/products/four_hands.json', 'w') as f:
            json.dump(products, f, indent=2)
        print(f"  Saved to /app/backend/data/products/four_hands.json")
    else:
        print(f"  File not found: {fh_file}")
    
    # Process Uttermost
    print("\n[2/3] Processing Uttermost...")
    ut_file = '/app/uttermost_catalog.xlsx'
    if os.path.exists(ut_file):
        products = process_uttermost_excel(ut_file)
        print(f"  Extracted {len(products)} products")
        imported, updated = await import_products_to_db(products, 'Uttermost')
        print(f"  Imported: {imported}, Updated: {updated}")
        
        # Save to JSON
        with open('/app/backend/data/products/uttermost.json', 'w') as f:
            json.dump(products, f, indent=2)
        print(f"  Saved to /app/backend/data/products/uttermost.json")
    else:
        print(f"  File not found: {ut_file}")
    
    # Get total count
    db = await get_db()
    total = await db.master_products.count_documents({})
    print(f"\n[3/3] Total products in database: {total}")
    
    print("\n" + "=" * 60)
    print("IMPORT COMPLETE!")
    print("=" * 60)


if __name__ == "__main__":
    asyncio.run(main())

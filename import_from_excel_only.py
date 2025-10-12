#!/usr/bin/env python3
"""
PROOF OF CONCEPT - Import catalog from Excel ONLY
Use real SKUs, names, prices from spreadsheet
Add generic placeholder images for now
"""
import pandas as pd
import pymongo
import uuid
from datetime import datetime

client = pymongo.MongoClient('mongodb://localhost:27017')
db = client['furniture_tracker']

# Simple placeholder base64 (small furniture icon)
PLACEHOLDER = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgZmlsbD0iIzRBNUE2QSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMjAiIGZpbGw9IndoaXRlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+Rm91ciBIYW5kczwvdGV4dD48L3N2Zz4="

print("\n🧪 PROOF OF CONCEPT - Excel Import Only\n")

# Load data
df1 = pd.read_excel('/app/fourhands_catalog.xlsx', sheet_name='PRICE CHANGE')
df2 = pd.read_excel('/app/fourhands_catalog.xlsx', sheet_name='NO CHANGE')
df1.rename(columns={'NEW COST': 'COST'}, inplace=True)
df = pd.concat([df1, df2])
df_stock = df[df['STATUS'].str.contains('In Stk', na=False)].reset_index(drop=True)

print(f"📊 Catalog: {len(df)} total | {len(df_stock)} in-stock")
print(f"🎯 Importing first 20 products as proof of concept\n")

for i in range(min(20, len(df_stock))):
    row = df_stock.iloc[i]
    
    sku = str(row['PRODUCT MASTER CODE']).strip()
    name = str(row['DESCRIPTION']).strip()
    cost = float(row['COST'])
    category = str(row.get('Category', 'Furniture'))
    subcategory = str(row.get('Subcategory', ''))
    collection = str(row.get('COLLECTION', ''))
    
    product = {
        "id": str(uuid.uuid4()),
        "name": name[:200],
        "vendor": "Four Hands",
        "manufacturer": "Four Hands",
        "category": category,
        "subcategory": subcategory,
        "cost": cost,
        "msrp": cost * 1.5,
        "sku": sku,
        "dimensions": "",
        "finish_color": "",
        "materials": "",
        "description": f"{name} - {collection}".strip(),
        "image_url": PLACEHOLDER,
        "images": [PLACEHOLDER],
        "product_url": f"https://fourhands.com/search?q={sku}",
        "tags": ["four hands", category.lower()],
        "style": [collection] if collection and str(collection) != 'nan' else [],
        "room_type": ["Living Room"],
        "notes": f"Collection: {collection}",
        "clipped_date": datetime.utcnow(),
        "created_date": datetime.utcnow(),
        "updated_date": datetime.utcnow(),
        "times_used": 0,
        "source": "fourhands_excel_import",
        "in_stock": True,
        "lead_time": "4-6 weeks"
    }
    
    existing = db.furniture_catalog.find_one({"sku": sku, "vendor": "Four Hands"})
    if existing:
        db.furniture_catalog.update_one({"_id": existing['_id']}, {"$set": product})
        action = "UPDATED"
    else:
        db.furniture_catalog.insert_one(product)
        action = "ADDED"
    
    print(f"[{i+1}/20] {action}: {name[:50]}")
    print(f"        SKU: {sku} | ${cost:.2f} | {category}")

# Stats
total_fh = db.furniture_catalog.count_documents({"vendor": "Four Hands"})
print(f"\n✅ Import complete!")
print(f"📊 Total Four Hands in database: {total_fh}")
print(f"\n🔗 View: https://designflow-master.preview.emergentagent.com/furniture-search")
print(f"\n💡 Next: Once this works, we can:")
print(f"   1. Scale to all {len(df_stock)} products")
print(f"   2. Add real images (with trade login credentials)")
print(f"   3. Process other vendors (Uttermost, etc.)")

client.close()

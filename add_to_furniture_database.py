#!/usr/bin/env python3
"""
Add test products directly to the furniture_products collection
that feeds the furniture search interface
"""

import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime
import re

# Test products for furniture search
TEST_FURNITURE_PRODUCTS = [
    {
        "name": "Cutler Accent Table",
        "vendor": "Uttermost",
        "sku": "24461",
        "price": "$100.00",
        "category": "Tables",
        "subcategory": "Accent Tables",
        "description": "Stylish accent table perfect for any room setting",
        "dimensions": "24\"W x 24\"D x 26\"H",
        "materials": "Wood and metal construction",
        "image_url": "https://via.placeholder.com/400x400/8B4513/FFFFFF?text=Cutler+Accent+Table",
        "url": "https://uttermost.com/products/cutler-accent-table-24461"
    },
    {
        "name": "Cove Dining Chair With Casters",
        "vendor": "Four Hands",
        "sku": "248606-001",
        "price": "$749.00",
        "category": "Seating",
        "subcategory": "Dining Chairs",
        "description": "Comfortable dining chair with rolling casters for easy movement",
        "dimensions": "25.50\"W x 25.25\"D x 32.25\"H",
        "materials": "Upholstered seat with caster wheels",
        "image_url": "https://via.placeholder.com/400x400/4A4A4A/FFFFFF?text=Cove+Dining+Chair",
        "url": "https://fourhands.com/products/cove-dining-chair-248606-001"
    },
    {
        "name": "Modern Console Table",
        "vendor": "Four Hands",
        "sku": "FH-CON-001",
        "price": "$1,299.00",
        "category": "Console Tables",
        "subcategory": "Console Tables",
        "description": "Sleek modern console table perfect for entryway or living room",
        "dimensions": "60\"W x 16\"D x 32\"H",
        "materials": "Solid wood with metal accents",
        "image_url": "https://via.placeholder.com/400x400/2F4F4F/FFFFFF?text=Modern+Console",
        "url": "https://fourhands.com/products/modern-console-table"
    },
    {
        "name": "Upholstered Lounge Chair",
        "vendor": "Four Hands",
        "sku": "FH-CHAIR-002",
        "price": "$899.00",
        "category": "Seating",
        "subcategory": "Lounge Chairs",
        "description": "Luxurious lounge chair with premium upholstery and comfort design",
        "dimensions": "32\"W x 34\"D x 36\"H",
        "materials": "Premium fabric upholstery with solid wood frame",
        "image_url": "https://via.placeholder.com/400x400/8B0000/FFFFFF?text=Lounge+Chair",
        "url": "https://fourhands.com/products/upholstered-lounge-chair"
    },
    {
        "name": "Industrial Coffee Table",
        "vendor": "Uttermost",
        "sku": "UTT-COFFEE-001",
        "price": "$599.00",
        "category": "Coffee Tables",
        "subcategory": "Coffee Tables",
        "description": "Industrial-style coffee table combining metal and reclaimed wood",
        "dimensions": "48\"W x 24\"D x 18\"H",
        "materials": "Reclaimed wood top with metal pipe base",
        "image_url": "https://via.placeholder.com/400x400/696969/FFFFFF?text=Industrial+Coffee",
        "url": "https://uttermost.com/products/industrial-coffee-table"
    },
    {
        "name": "Contemporary Table Lamp",
        "vendor": "Uttermost",
        "sku": "UTT-LAMP-001",
        "price": "$189.00",
        "category": "Lighting",
        "subcategory": "Table Lamps",
        "description": "Stylish contemporary table lamp with fabric shade",
        "dimensions": "12\"W x 12\"D x 26\"H",
        "materials": "Ceramic base with fabric shade",
        "image_url": "https://via.placeholder.com/400x400/FFD700/000000?text=Table+Lamp",
        "url": "https://uttermost.com/products/contemporary-table-lamp"
    },
    {
        "name": "Rustic Dining Table",
        "vendor": "Four Hands",
        "sku": "FH-DINING-001", 
        "price": "$1,899.00",
        "category": "Dining Room",
        "subcategory": "Dining Tables",
        "description": "Solid wood rustic dining table that seats 6-8 people comfortably",
        "dimensions": "84\"W x 42\"D x 30\"H",
        "materials": "Solid reclaimed wood with natural finish",
        "image_url": "https://via.placeholder.com/400x400/8B4513/FFFFFF?text=Rustic+Dining+Table",
        "url": "https://fourhands.com/products/rustic-dining-table"
    },
    {
        "name": "Modern Floor Mirror",
        "vendor": "Uttermost",
        "sku": "UTT-MIRROR-001",
        "price": "$349.00",
        "category": "Mirrors & Wall Art",
        "subcategory": "Floor Mirrors",
        "description": "Full-length floor mirror with sleek modern frame design",
        "dimensions": "24\"W x 2\"D x 70\"H",
        "materials": "Glass mirror with metal frame",
        "image_url": "https://via.placeholder.com/400x400/C0C0C0/000000?text=Floor+Mirror",
        "url": "https://uttermost.com/products/modern-floor-mirror"
    },
    {
        "name": "Storage Ottoman",
        "vendor": "Four Hands",
        "sku": "FH-OTTO-001",
        "price": "$449.00",
        "category": "Seating",
        "subcategory": "Ottomans",
        "description": "Multi-functional ottoman with hidden storage compartment",
        "dimensions": "36\"W x 18\"D x 18\"H",
        "materials": "Upholstered top with wooden storage base",
        "image_url": "https://via.placeholder.com/400x400/4B0082/FFFFFF?text=Storage+Ottoman",
        "url": "https://fourhands.com/products/storage-ottoman"
    },
    {
        "name": "Crystal Chandelier Pendant",
        "vendor": "Uttermost",
        "sku": "UTT-PEND-001",
        "price": "$789.00",
        "category": "Lighting",
        "subcategory": "Chandeliers",
        "description": "Elegant crystal chandelier perfect for dining rooms or entryways",
        "dimensions": "24\"W x 24\"D x 30\"H",
        "materials": "Crystal elements with metal frame",
        "image_url": "https://via.placeholder.com/400x400/FFD700/000000?text=Crystal+Chandelier",
        "url": "https://uttermost.com/products/crystal-chandelier-pendant"
    },
    {
        "name": "Mid-Century Armchair",
        "vendor": "Four Hands",
        "sku": "FH-ARM-001",
        "price": "$1,199.00",
        "category": "Seating",
        "subcategory": "Armchairs",
        "description": "Classic mid-century modern armchair with walnut wood frame",
        "dimensions": "28\"W x 30\"D x 32\"H",
        "materials": "Walnut wood frame with leather upholstery",
        "image_url": "https://via.placeholder.com/400x400/8B4513/FFFFFF?text=Mid-Century+Chair",
        "url": "https://fourhands.com/products/mid-century-armchair"
    },
    {
        "name": "Geometric Area Rug",
        "vendor": "Loloi Rugs",
        "sku": "LOL-GEO-001",
        "price": "$299.00",
        "category": "Rugs & Textiles",
        "subcategory": "Area Rugs",
        "description": "Modern geometric pattern area rug in neutral tones",
        "dimensions": "8' x 10'",
        "materials": "100% polypropylene with jute backing",
        "image_url": "https://via.placeholder.com/400x400/708090/FFFFFF?text=Geometric+Rug",
        "url": "https://loloirugs.com/products/geometric-area-rug"
    }
]

async def add_products_to_furniture_database():
    """Add test products to the furniture_products collection"""
    
    # Connect to MongoDB
    mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
    client = AsyncIOMotorClient(mongo_url)
    
    # Use the same database as the furniture search system
    db_name = os.environ.get('DB_NAME', 'interior')
    db = client[db_name]
    
    print(f"🗄️ ADDING PRODUCTS TO FURNITURE DATABASE")
    print(f"Database: {db_name}")
    print(f"Collection: furniture_products")
    print("=" * 50)
    
    try:
        added_count = 0
        updated_count = 0
        
        for product in TEST_FURNITURE_PRODUCTS:
            # Create unique identifier
            unique_id = f"{product['vendor']}_{product['name']}_{product['sku']}".lower()
            unique_id = re.sub(r'[^a-z0-9_]', '', unique_id)
            
            # Add metadata
            product_doc = {
                **product,
                'unique_id': unique_id,
                'scraped_at': datetime.utcnow(),
                'last_updated': datetime.utcnow(),
                'availability': 'Available'
            }
            
            # Check if exists
            existing = await db.furniture_products.find_one({'unique_id': unique_id})
            
            if existing:
                # Update existing
                await db.furniture_products.update_one(
                    {'unique_id': unique_id},
                    {'$set': product_doc}
                )
                updated_count += 1
                print(f"📝 Updated: {product['name']} ({product['vendor']})")
            else:
                # Insert new
                await db.furniture_products.insert_one(product_doc)
                added_count += 1
                print(f"➕ Added: {product['name']} ({product['vendor']}) - {product['price']}")
        
        # Get total count
        total_products = await db.furniture_products.count_documents({})
        
        print(f"\n✅ FURNITURE DATABASE UPDATE COMPLETE!")
        print(f"   Added: {added_count} new products")
        print(f"   Updated: {updated_count} existing products")
        print(f"   Total in database: {total_products} products")
        
        # Test search functionality
        print(f"\n🔍 TESTING SEARCH FUNCTIONALITY...")
        
        # Test chair search
        chair_results = await db.furniture_products.find(
            {'$or': [
                {'name': {'$regex': 'chair', '$options': 'i'}},
                {'category': {'$regex': 'seating', '$options': 'i'}}
            ]}
        ).to_list(length=10)
        
        print(f"   'Chair' search: {len(chair_results)} results")
        for result in chair_results[:3]:
            print(f"      - {result['name']} ({result['vendor']}) - {result['price']}")
        
        # Test Four Hands search
        fourhands_results = await db.furniture_products.find(
            {'vendor': {'$regex': 'Four Hands', '$options': 'i'}}
        ).to_list(length=10)
        
        print(f"   'Four Hands' search: {len(fourhands_results)} results")
        for result in fourhands_results[:3]:
            print(f"      - {result['name']} - {result['price']}")
        
        return {
            'success': True,
            'added': added_count,
            'updated': updated_count,
            'total': total_products
        }
        
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        return {'success': False, 'error': str(e)}
    
    finally:
        client.close()

async def main():
    print("🧪 FURNITURE SEARCH DATABASE TEST")
    print("=" * 60)
    
    result = await add_products_to_furniture_database()
    
    if result['success']:
        print(f"\n🎉 SUCCESS! Furniture database populated with test products")
        print(f"\n🔗 NEXT STEPS:")
        print(f"1. Refresh: https://designhub-74.preview.emergentagent.com/furniture-search")
        print(f"2. Product count should now show {result['total']} instead of 17")
        print(f"3. Try searching for 'chair', 'table', 'Four Hands', 'Uttermost'")
        print(f"4. Test category filters (SEATING, LIGHTING, etc.)")
        print(f"5. Verify all search and filter functionality works")
        print(f"\n🚀 Once confirmed → Ready for MASS VENDOR CATALOG IMPORT!")
    else:
        print(f"\n💥 FAILED: {result.get('error')}")

if __name__ == "__main__":
    asyncio.run(main())

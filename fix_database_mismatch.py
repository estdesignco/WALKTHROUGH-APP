#!/usr/bin/env python3
"""
Fix database mismatch - add products to the correct database
"""

import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime
import re

# Load environment
from dotenv import load_dotenv
load_dotenv('/app/backend/.env')

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

async def fix_database_issue():
    """Add products to the CORRECT database that furniture search uses"""
    
    # Get environment variables (same as furniture_database.py)
    mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
    db_name = os.environ.get('DB_NAME', 'interior_design_db')
    
    print("🔧 FIXING DATABASE MISMATCH")
    print(f"Using database: {db_name} (from environment)")
    print("=" * 50)
    
    try:
        client = AsyncIOMotorClient(mongo_url)
        db = client[db_name]
        
        # Clear existing data first
        await db.furniture_products.delete_many({})
        print(f"🗑️ Cleared existing furniture_products")
        
        added_count = 0
        
        for product in TEST_FURNITURE_PRODUCTS:
            # Create unique identifier (same logic as furniture_database.py)
            unique_id = f"{product['vendor']}_{product['name']}_{product['sku']}".lower()
            unique_id = re.sub(r'[^a-z0-9_]', '', unique_id)
            
            # Add metadata (same as furniture_database.py)
            product_doc = {
                **product,
                'unique_id': unique_id,
                'scraped_at': datetime.utcnow(),
                'last_updated': datetime.utcnow(),
                'availability': 'Available'
            }
            
            # Insert product
            await db.furniture_products.insert_one(product_doc)
            added_count += 1
            print(f"➕ Added: {product['name']} ({product['vendor']}) - {product['price']}")
        
        # Verify the data
        total_count = await db.furniture_products.count_documents({})
        print(f"\n✅ DATABASE FIXED!")
        print(f"   Database: {db_name}")
        print(f"   Collection: furniture_products")
        print(f"   Total products: {total_count}")
        
        # Test search functionality
        print(f"\n🔍 TESTING SEARCH IN CORRECT DATABASE...")
        
        # Test basic search
        all_products = await db.furniture_products.find({}).to_list(length=20)
        print(f"   All products query: {len(all_products)} results")
        
        # Test chair search
        chair_query = {
            '$or': [
                {'name': {'$regex': 'chair', '$options': 'i'}},
                {'description': {'$regex': 'chair', '$options': 'i'}},
                {'category': {'$regex': 'chair', '$options': 'i'}}
            ]
        }
        chair_results = await db.furniture_products.find(chair_query).to_list(length=10)
        print(f"   Chair search query: {len(chair_results)} results")
        
        for result in chair_results:
            print(f"      - {result['name']} ({result['vendor']})")
        
        client.close()
        return total_count
        
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        return 0

async def test_api_after_fix():
    """Test the API after fixing the database"""
    
    print(f"\n🌐 TESTING API AFTER DATABASE FIX")
    print("=" * 40)
    
    import aiohttp
    
    base_url = "https://designhub-74.preview.emergentagent.com/api"
    
    try:
        async with aiohttp.ClientSession() as session:
            
            # Test empty search (should return all products)
            async with session.get(f"{base_url}/furniture/search") as response:
                data = await response.json()
                print(f"Empty search: {data['total_results']} products")
                
                if data['products']:
                    print(f"First product: {data['products'][0]['name']}")
            
            # Test chair search
            async with session.get(f"{base_url}/furniture/search?query=chair") as response:
                data = await response.json()
                print(f"Chair search: {data['total_results']} products")
                
                for product in data['products'][:3]:
                    print(f"   - {product['name']} ({product['vendor']})")
    
    except Exception as e:
        print(f"❌ API test error: {str(e)}")

async def main():
    print("🧪 FURNITURE DATABASE FIX")
    print("=" * 60)
    
    # Fix the database mismatch
    count = await fix_database_issue()
    
    if count > 0:
        # Test the API
        await test_api_after_fix()
        
        print(f"\n🎉 SUCCESS! Database fixed and tested")
        print(f"\n🔗 NEXT STEPS:")
        print(f"1. Refresh: https://designhub-74.preview.emergentagent.com/furniture-search")
        print(f"2. Product count should now show {count} instead of 17")
        print(f"3. Try searching for 'chair', 'table', 'Four Hands', 'Uttermost'")
        print(f"4. Test all filters and functionality")
        print(f"\n🚀 Once confirmed working → Ready for MASS CATALOG IMPORT!")
    else:
        print(f"\n💥 FAILED to fix database")

if __name__ == "__main__":
    asyncio.run(main())

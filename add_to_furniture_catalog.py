#!/usr/bin/env python3
"""
Add test products to the CORRECT furniture catalog system
that the frontend actually uses
"""

import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime
import uuid

# Test products for furniture catalog
TEST_CATALOG_PRODUCTS = [
    {
        "name": "Cutler Accent Table",
        "vendor": "Uttermost",
        "manufacturer": "Uttermost",
        "category": "Tables",
        "cost": 100.0,
        "msrp": 150.0,
        "sku": "24461",
        "dimensions": "24\"W x 24\"D x 26\"H",
        "finish_color": "Natural Wood",
        "materials": "Wood and metal construction",
        "description": "Stylish accent table perfect for any room setting with industrial design elements",
        "image_url": "https://via.placeholder.com/400x400/8B4513/FFFFFF?text=Cutler+Accent+Table",
        "product_url": "https://uttermost.com/products/cutler-accent-table-24461",
        "tags": ["accent table", "industrial", "wood", "metal"],
        "style": ["Industrial", "Modern"],
        "room_type": ["Living Room", "Bedroom", "Office"]
    },
    {
        "name": "Cove Dining Chair With Casters",
        "vendor": "Four Hands",
        "manufacturer": "Four Hands",
        "category": "Seating",
        "cost": 749.0,
        "msrp": 999.0,
        "sku": "248606-001",
        "dimensions": "25.50\"W x 25.25\"D x 32.25\"H",
        "finish_color": "Charcoal Grey",
        "materials": "Upholstered seat with caster wheels",
        "description": "Comfortable dining chair with rolling casters for easy movement around the table",
        "image_url": "https://via.placeholder.com/400x400/4A4A4A/FFFFFF?text=Cove+Dining+Chair",
        "product_url": "https://fourhands.com/products/cove-dining-chair-248606-001",
        "tags": ["dining chair", "casters", "upholstered", "wheels"],
        "style": ["Contemporary", "Transitional"],
        "room_type": ["Dining Room", "Office"]
    },
    {
        "name": "Modern Console Table",
        "vendor": "Four Hands",
        "manufacturer": "Four Hands",
        "category": "Console Tables",
        "cost": 1299.0,
        "msrp": 1599.0,
        "sku": "FH-CON-001",
        "dimensions": "60\"W x 16\"D x 32\"H",
        "finish_color": "Black Oak",
        "materials": "Solid wood with metal accents",
        "description": "Sleek modern console table perfect for entryway or living room with contemporary styling",
        "image_url": "https://via.placeholder.com/400x400/2F4F4F/FFFFFF?text=Modern+Console",
        "product_url": "https://fourhands.com/products/modern-console-table",
        "tags": ["console table", "entryway", "modern", "wood"],
        "style": ["Modern", "Contemporary"],
        "room_type": ["Living Room", "Entryway", "Hallway"]
    },
    {
        "name": "Upholstered Lounge Chair",
        "vendor": "Four Hands",
        "manufacturer": "Four Hands",
        "category": "Seating",
        "cost": 899.0,
        "msrp": 1199.0,
        "sku": "FH-CHAIR-002",
        "dimensions": "32\"W x 34\"D x 36\"H",
        "finish_color": "Cream Fabric",
        "materials": "Premium fabric upholstery with solid wood frame",
        "description": "Luxurious lounge chair with premium upholstery and comfort design for ultimate relaxation",
        "image_url": "https://via.placeholder.com/400x400/8B0000/FFFFFF?text=Lounge+Chair",
        "product_url": "https://fourhands.com/products/upholstered-lounge-chair",
        "tags": ["lounge chair", "upholstered", "comfort", "luxury"],
        "style": ["Contemporary", "Classic"],
        "room_type": ["Living Room", "Bedroom", "Reading Nook"]
    },
    {
        "name": "Industrial Coffee Table",
        "vendor": "Uttermost",
        "manufacturer": "Uttermost",
        "category": "Tables",
        "cost": 599.0,
        "msrp": 799.0,
        "sku": "UTT-COFFEE-001",
        "dimensions": "48\"W x 24\"D x 18\"H",
        "finish_color": "Reclaimed Wood",
        "materials": "Reclaimed wood top with metal pipe base",
        "description": "Industrial-style coffee table combining reclaimed wood and metal for urban sophistication",
        "image_url": "https://via.placeholder.com/400x400/696969/FFFFFF?text=Industrial+Coffee",
        "product_url": "https://uttermost.com/products/industrial-coffee-table",
        "tags": ["coffee table", "industrial", "reclaimed wood", "metal"],
        "style": ["Industrial", "Rustic"],
        "room_type": ["Living Room", "Family Room", "Den"]
    },
    {
        "name": "Contemporary Table Lamp",
        "vendor": "Uttermost",
        "manufacturer": "Uttermost",
        "category": "Lighting",
        "cost": 189.0,
        "msrp": 249.0,
        "sku": "UTT-LAMP-001",
        "dimensions": "12\"W x 12\"D x 26\"H",
        "finish_color": "White Ceramic",
        "materials": "Ceramic base with fabric shade",
        "description": "Stylish contemporary table lamp with ceramic base and fabric shade for ambient lighting",
        "image_url": "https://via.placeholder.com/400x400/FFD700/000000?text=Table+Lamp",
        "product_url": "https://uttermost.com/products/contemporary-table-lamp",
        "tags": ["table lamp", "ceramic", "fabric shade", "contemporary"],
        "style": ["Contemporary", "Modern"],
        "room_type": ["Living Room", "Bedroom", "Office"]
    },
    {
        "name": "Rustic Dining Table",
        "vendor": "Four Hands",
        "manufacturer": "Four Hands",
        "category": "Tables",
        "cost": 1899.0,
        "msrp": 2399.0,
        "sku": "FH-DINING-001",
        "dimensions": "84\"W x 42\"D x 30\"H",
        "finish_color": "Natural Reclaimed",
        "materials": "Solid reclaimed wood with natural finish",
        "description": "Solid wood rustic dining table that seats 6-8 people comfortably with farmhouse charm",
        "image_url": "https://via.placeholder.com/400x400/8B4513/FFFFFF?text=Rustic+Dining+Table",
        "product_url": "https://fourhands.com/products/rustic-dining-table",
        "tags": ["dining table", "rustic", "reclaimed wood", "farmhouse"],
        "style": ["Rustic", "Farmhouse"],
        "room_type": ["Dining Room", "Kitchen"]
    },
    {
        "name": "Modern Floor Mirror",
        "vendor": "Uttermost",
        "manufacturer": "Uttermost",
        "category": "Mirrors",
        "cost": 349.0,
        "msrp": 449.0,
        "sku": "UTT-MIRROR-001",
        "dimensions": "24\"W x 2\"D x 70\"H",
        "finish_color": "Black Metal Frame",
        "materials": "Glass mirror with metal frame",
        "description": "Full-length floor mirror with sleek modern frame design perfect for any room",
        "image_url": "https://via.placeholder.com/400x400/C0C0C0/000000?text=Floor+Mirror",
        "product_url": "https://uttermost.com/products/modern-floor-mirror",
        "tags": ["floor mirror", "full length", "modern", "black frame"],
        "style": ["Modern", "Contemporary"],
        "room_type": ["Bedroom", "Dressing Room", "Entryway"]
    },
    {
        "name": "Storage Ottoman",
        "vendor": "Four Hands",
        "manufacturer": "Four Hands",
        "category": "Seating",
        "cost": 449.0,
        "msrp": 599.0,
        "sku": "FH-OTTO-001",
        "dimensions": "36\"W x 18\"D x 18\"H",
        "finish_color": "Charcoal Grey",
        "materials": "Upholstered top with wooden storage base",
        "description": "Multi-functional ottoman with hidden storage compartment for maximum utility",
        "image_url": "https://via.placeholder.com/400x400/4B0082/FFFFFF?text=Storage+Ottoman",
        "product_url": "https://fourhands.com/products/storage-ottoman",
        "tags": ["ottoman", "storage", "multifunctional", "upholstered"],
        "style": ["Contemporary", "Transitional"],
        "room_type": ["Living Room", "Bedroom", "Family Room"]
    },
    {
        "name": "Crystal Chandelier Pendant",
        "vendor": "Uttermost",
        "manufacturer": "Uttermost",
        "category": "Lighting",
        "cost": 789.0,
        "msrp": 999.0,
        "sku": "UTT-PEND-001",
        "dimensions": "24\"W x 24\"D x 30\"H",
        "finish_color": "Polished Chrome",
        "materials": "Crystal elements with metal frame",
        "description": "Elegant crystal chandelier perfect for dining rooms or entryways with sparkling ambiance",
        "image_url": "https://via.placeholder.com/400x400/FFD700/000000?text=Crystal+Chandelier",
        "product_url": "https://uttermost.com/products/crystal-chandelier-pendant",
        "tags": ["chandelier", "crystal", "elegant", "dining room"],
        "style": ["Traditional", "Glamorous"],
        "room_type": ["Dining Room", "Entryway", "Living Room"]
    },
    {
        "name": "Mid-Century Armchair",
        "vendor": "Four Hands",
        "manufacturer": "Four Hands",
        "category": "Seating",
        "cost": 1199.0,
        "msrp": 1599.0,
        "sku": "FH-ARM-001",
        "dimensions": "28\"W x 30\"D x 32\"H",
        "finish_color": "Cognac Leather",
        "materials": "Walnut wood frame with leather upholstery",
        "description": "Classic mid-century modern armchair with walnut wood frame and premium leather upholstery",
        "image_url": "https://via.placeholder.com/400x400/8B4513/FFFFFF?text=Mid-Century+Chair",
        "product_url": "https://fourhands.com/products/mid-century-armchair",
        "tags": ["armchair", "mid-century", "walnut", "leather"],
        "style": ["Mid-Century Modern", "Retro"],
        "room_type": ["Living Room", "Office", "Den"]
    },
    {
        "name": "Geometric Area Rug",
        "vendor": "Loloi Rugs",
        "manufacturer": "Loloi",
        "category": "Textiles",
        "cost": 299.0,
        "msrp": 399.0,
        "sku": "LOL-GEO-001",
        "dimensions": "8' x 10'",
        "finish_color": "Grey and White",
        "materials": "100% polypropylene with jute backing",
        "description": "Modern geometric pattern area rug in neutral tones perfect for contemporary spaces",
        "image_url": "https://via.placeholder.com/400x400/708090/FFFFFF?text=Geometric+Rug",
        "product_url": "https://loloirugs.com/products/geometric-area-rug",
        "tags": ["area rug", "geometric", "neutral", "modern"],
        "style": ["Modern", "Contemporary"],
        "room_type": ["Living Room", "Dining Room", "Office"]
    }
]

async def add_to_furniture_catalog():
    """Add products to the furniture_catalog collection in furniture_tracker database"""
    
    # Connect to the CORRECT database (same as furniture_search.py)
    mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
    client = AsyncIOMotorClient(mongo_url)
    db = client.get_database('furniture_tracker')  # This is the correct database!
    
    print("🔧 ADDING PRODUCTS TO FURNITURE CATALOG SYSTEM")
    print(f"Database: furniture_tracker")
    print(f"Collection: furniture_catalog")
    print("=" * 50)
    
    try:
        # Clear existing test data first
        await db.furniture_catalog.delete_many({
            "source": "test_data"
        })
        print(f"🗑️ Cleared existing test data")
        
        added_count = 0
        
        for product in TEST_CATALOG_PRODUCTS:
            # Create furniture item (same format as furniture_search.py)
            furniture_item = {
                "id": str(uuid.uuid4()),  # Use UUID as ID (not MongoDB _id)
                "name": product['name'],
                "vendor": product['vendor'],
                "manufacturer": product['manufacturer'],
                "category": product['category'],
                "cost": product['cost'],
                "msrp": product['msrp'],
                "sku": product['sku'],
                "dimensions": product['dimensions'],
                "finish_color": product['finish_color'],
                "materials": product['materials'],
                "description": product['description'],
                "image_url": product['image_url'],
                "images": [product['image_url']],  # Array format
                "product_url": product['product_url'],
                "tags": product['tags'],
                "style": product['style'],
                "room_type": product['room_type'],
                "notes": "",
                "clipped_date": datetime.utcnow(),
                "created_date": datetime.utcnow(),
                "updated_date": datetime.utcnow(),
                "times_used": 0,
                "source": "test_data",  # Mark as test data
                "in_stock": True,
                "lead_time": "3-4 weeks"
            }
            
            # Insert the item
            await db.furniture_catalog.insert_one(furniture_item)
            added_count += 1
            print(f"➕ Added: {product['name']} ({product['vendor']}) - ${product['cost']}")
        
        # Verify the data
        total_count = await db.furniture_catalog.count_documents({})
        print(f"\n✅ FURNITURE CATALOG POPULATED!")
        print(f"   Database: furniture_tracker")
        print(f"   Collection: furniture_catalog")
        print(f"   Added: {added_count} test products")
        print(f"   Total in catalog: {total_count} products")
        
        # Test the search functionality
        print(f"\n🔍 TESTING CATALOG SEARCH...")
        
        # Test category counts
        categories = await db.furniture_catalog.distinct("category")
        print(f"   Categories: {categories}")
        
        # Test vendor counts
        vendors = await db.furniture_catalog.distinct("vendor")
        print(f"   Vendors: {vendors}")
        
        # Test chair search
        chair_results = await db.furniture_catalog.find({
            "$or": [
                {"name": {"$regex": "chair", "$options": "i"}},
                {"category": {"$regex": "seating", "$options": "i"}}
            ]
        }).to_list(length=10)
        
        print(f"   Chair search: {len(chair_results)} results")
        for result in chair_results:
            print(f"      - {result['name']} ({result['vendor']}) - ${result['cost']}")
        
        client.close()
        return total_count
        
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        client.close()
        return 0

async def test_catalog_api():
    """Test the furniture catalog API after adding products"""
    
    print(f"\n🌐 TESTING FURNITURE CATALOG API")
    print("=" * 40)
    
    import aiohttp
    
    base_url = "https://designhub-74.preview.emergentagent.com/api/furniture"
    
    try:
        async with aiohttp.ClientSession() as session:
            
            # Test stats endpoint
            async with session.get(f"{base_url}/furniture-catalog/stats") as response:
                data = await response.json()
                print(f"Stats: {data['total_items']} total items")
                print(f"Categories: {list(data['categories'].keys())}")
                print(f"Vendors: {list(data['vendors'].keys())}")
            
            # Test search endpoint
            async with session.get(f"{base_url}/furniture-catalog/search?query=chair") as response:
                data = await response.json()
                print(f"Chair search: {data['count']} results")
                
                for result in data['results'][:3]:
                    print(f"   - {result['name']} ({result['vendor']}) - ${result['cost']}")
    
    except Exception as e:
        print(f"❌ API test error: {str(e)}")

async def main():
    print("🧪 FURNITURE CATALOG SYSTEM FIX")
    print("=" * 60)
    
    # Add products to correct database
    count = await add_to_furniture_catalog()
    
    if count > 0:
        # Test the API
        await test_catalog_api()
        
        print(f"\n🎉 SUCCESS! Furniture catalog system populated and tested")
        print(f"\n🔗 NEXT STEPS:")
        print(f"1. Refresh: https://designhub-74.preview.emergentagent.com/furniture-search")
        print(f"2. Product count should now show {count} instead of 17")
        print(f"3. Try searching for 'chair', 'table', 'Four Hands', 'Uttermost'")
        print(f"4. Test all category filters (SEATING, LIGHTING, etc.)")
        print(f"5. Verify images and product details display correctly")
        print(f"\n🚀 Once confirmed working → Ready for MASS CATALOG IMPORT!")
    else:
        print(f"\n💥 FAILED to populate catalog")

if __name__ == "__main__":
    asyncio.run(main())

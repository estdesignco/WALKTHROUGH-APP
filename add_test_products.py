#!/usr/bin/env python3
"""
Add a small batch of test products to the furniture search app
Using Four Hands catalog data we already have
"""

import asyncio
import aiohttp
import json
import pandas as pd
import random

# Sample Four Hands products for testing
TEST_PRODUCTS = [
    {
        "name": "Cutler Accent Table",
        "vendor": "Uttermost",
        "sku": "24461",
        "price": 100.0,
        "category": "TABLES",
        "subcategory": "Accent Tables",
        "collection": "Modern Collection",
        "description": "Stylish accent table perfect for any room",
        "size": "24\"W x 24\"D x 26\"H"
    },
    {
        "name": "Cove Dining Chair With Casters",
        "vendor": "Four Hands",
        "sku": "248606-001",
        "price": 749.0,
        "category": "SEATING",
        "subcategory": "Dining Chairs",
        "collection": "Cove Collection",
        "description": "Comfortable dining chair with rolling casters",
        "size": "25.50\"w x 25.25\"d x 32.25\"h"
    },
    {
        "name": "Modern Console Table",
        "vendor": "Four Hands",
        "sku": "FH-CON-001",
        "price": 1299.0,
        "category": "CONSOLE TABLES",
        "subcategory": "Console Tables",
        "collection": "Modern Collection",
        "description": "Sleek console table for entryway or living room",
        "size": "60\"W x 16\"D x 32\"H"
    },
    {
        "name": "Upholstered Lounge Chair",
        "vendor": "Four Hands",
        "sku": "FH-CHAIR-002",
        "price": 899.0,
        "category": "SEATING",
        "subcategory": "Lounge Chairs",
        "collection": "Comfort Series",
        "description": "Luxurious lounge chair with premium upholstery",
        "size": "32\"W x 34\"D x 36\"H"
    },
    {
        "name": "Industrial Coffee Table",
        "vendor": "Uttermost",
        "sku": "UTT-COFFEE-001",
        "price": 599.0,
        "category": "COFFEE TABLES",
        "subcategory": "Coffee Tables",
        "collection": "Industrial Collection",
        "description": "Metal and wood coffee table with industrial design",
        "size": "48\"W x 24\"D x 18\"H"
    },
    {
        "name": "Contemporary Table Lamp",
        "vendor": "Uttermost",
        "sku": "UTT-LAMP-001",
        "price": 189.0,
        "category": "LIGHTING",
        "subcategory": "Table Lamps",
        "collection": "Modern Lighting",
        "description": "Stylish table lamp with fabric shade",
        "size": "12\"W x 12\"D x 26\"H"
    },
    {
        "name": "Rustic Dining Table",
        "vendor": "Four Hands",
        "sku": "FH-DINING-001",
        "price": 1899.0,
        "category": "DINING TABLES",
        "subcategory": "Dining Tables",
        "collection": "Rustic Collection",
        "description": "Solid wood dining table seats 6-8 people",
        "size": "84\"W x 42\"D x 30\"H"
    },
    {
        "name": "Modern Floor Mirror",
        "vendor": "Uttermost",
        "sku": "UTT-MIRROR-001",
        "price": 349.0,
        "category": "MIRRORS",
        "subcategory": "Floor Mirrors",
        "collection": "Reflection Series",
        "description": "Full-length floor mirror with sleek frame",
        "size": "24\"W x 2\"D x 70\"H"
    },
    {
        "name": "Storage Ottoman",
        "vendor": "Four Hands",
        "sku": "FH-OTTO-001",
        "price": 449.0,
        "category": "SEATING",
        "subcategory": "Ottomans",
        "collection": "Storage Solutions",
        "description": "Multi-functional ottoman with hidden storage",
        "size": "36\"W x 18\"D x 18\"H"
    },
    {
        "name": "Chandelier Pendant Light",
        "vendor": "Uttermost",
        "sku": "UTT-PEND-001",
        "price": 789.0,
        "category": "LIGHTING",
        "subcategory": "Chandeliers",
        "collection": "Crystal Collection",
        "description": "Elegant crystal chandelier for dining room",
        "size": "24\"W x 24\"D x 30\"H"
    }
]

async def add_products_to_furniture_search():
    """Add test products to the furniture search database"""
    
    base_url = "https://designhub-74.preview.emergentagent.com/api"
    
    print("🎆 ADDING TEST PRODUCTS TO FURNITURE SEARCH")
    print("=" * 50)
    
    try:
        async with aiohttp.ClientSession() as session:
            
            # Get or create a project to add items to
            print("📋 Getting projects...")
            async with session.get(f"{base_url}/projects") as response:
                projects = await response.json()
                
                if projects:
                    # Use first project
                    project_id = projects[0]['id']
                    project_name = projects[0]['name']
                    print(f"✅ Using project: {project_name} ({project_id})")
                else:
                    # Create a furniture catalog project
                    print("🆕 Creating furniture catalog project...")
                    project_data = {
                        "name": "Furniture Catalog Test",
                        "client_name": "Furniture Search",
                        "client_email": "furniture@search.com",
                        "client_phone": "555-FURNITURE"
                    }
                    
                    async with session.post(f"{base_url}/projects", json=project_data) as create_response:
                        create_result = await create_response.json()
                        project_id = create_result['id']
                        print(f"✅ Created project: {project_id}")
            
            # Add each test product
            added_products = 0
            for i, product in enumerate(TEST_PRODUCTS, 1):
                print(f"\n📦 Adding product {i}/{len(TEST_PRODUCTS)}: {product['name']}")
                
                # Prepare item data for manual import
                item_data = {
                    "name": product['name'],
                    "vendor": product['vendor'],
                    "cost": product['price'],
                    "price": product['price'],
                    "url": f"https://example.com/{product['sku']}",
                    "image_url": "https://via.placeholder.com/300x300?text=" + product['name'].replace(' ', '+'),
                    "sku": product['sku'],
                    "size": product['size'],
                    "description": product['description'],
                    "collection": product.get('collection', ''),
                    "subcategory": product.get('subcategory', '')
                }
                
                # Determine room based on category
                room_mapping = {
                    "SEATING": "Living Room",
                    "TABLES": "Living Room", 
                    "DINING TABLES": "Dining Room",
                    "COFFEE TABLES": "Living Room",
                    "CONSOLE TABLES": "Living Room",
                    "LIGHTING": "Living Room",
                    "MIRRORS": "Bedroom"
                }
                
                room_name = room_mapping.get(product['category'], "Living Room")
                
                import_data = {
                    "project_id": project_id,
                    "room_name": room_name,
                    "items": [item_data],
                    "auto_clip_to_houzz": False  # Don't auto-clip for testing
                }
                
                try:
                    async with session.post(f"{base_url}/manual-furniture-import", json=import_data) as response:
                        if response.status == 200:
                            result = await response.json()
                            if result.get('success'):
                                print(f"   ✅ Added: {product['name']} (${product['price']})")
                                added_products += 1
                            else:
                                print(f"   ❌ Failed: {result.get('error', 'Unknown error')}")
                        else:
                            print(f"   ❌ HTTP {response.status}: Failed to add product")
                            
                except Exception as product_error:
                    print(f"   ❌ Error adding product: {str(product_error)}")
                
                # Small delay between requests
                await asyncio.sleep(0.5)
            
            print(f"\n🎆 BATCH COMPLETE!")
            print(f"   ✅ Successfully added: {added_products}/{len(TEST_PRODUCTS)} products")
            print(f"   🔍 Next: Test search functionality on furniture-search page")
            
            return {
                'success': True,
                'added_products': added_products,
                'total_attempted': len(TEST_PRODUCTS)
            }
            
    except Exception as e:
        print(f"❌ Error in batch import: {str(e)}")
        return {
            'success': False,
            'error': str(e)
        }

async def test_search_functionality():
    """Test the search API to make sure products are searchable"""
    
    base_url = "https://designhub-74.preview.emergentagent.com/api"
    
    print(f"\n🔍 TESTING SEARCH FUNCTIONALITY")
    print("-" * 30)
    
    test_searches = [
        "chair",
        "table", 
        "Four Hands",
        "Uttermost",
        "lighting"
    ]
    
    try:
        async with aiohttp.ClientSession() as session:
            
            for search_term in test_searches:
                print(f"\n🔎 Testing search: '{search_term}'")
                
                # Test search endpoint (if it exists)
                search_endpoints = [
                    f"{base_url}/furniture-search?q={search_term}",
                    f"{base_url}/search-furniture?query={search_term}",
                    f"{base_url}/products/search?q={search_term}"
                ]
                
                found_results = False
                for endpoint in search_endpoints:
                    try:
                        async with session.get(endpoint, timeout=10) as response:
                            if response.status == 200:
                                results = await response.json()
                                print(f"   ✅ Found {len(results)} results for '{search_term}'")
                                found_results = True
                                break
                    except:
                        continue
                
                if not found_results:
                    print(f"   ⚠️ No search endpoint found for '{search_term}'")
    
    except Exception as e:
        print(f"❌ Search test error: {str(e)}")

async def main():
    print("🧪 FURNITURE SEARCH APP - TEST BATCH")
    print("=" * 60)
    
    # Add test products
    result = await add_products_to_furniture_search()
    
    if result['success']:
        print(f"\n🎉 SUCCESS! Added {result['added_products']} test products")
        
        # Test search functionality
        await test_search_functionality()
        
        print(f"\n🔗 NEXT STEPS:")
        print(f"1. Go to: https://designhub-74.preview.emergentagent.com/furniture-search")
        print(f"2. Try searching for: 'chair', 'table', 'Four Hands', 'Uttermost'")
        print(f"3. Test the category filters and price ranges")
        print(f"4. Verify all {result['added_products']} products are visible and searchable")
        print(f"\n🚀 Once confirmed working → Ready for MASS IMPORT!")
    else:
        print(f"\n💥 FAILED: {result.get('error')}")
        print(f"Need to debug before proceeding to mass import")

if __name__ == "__main__":
    asyncio.run(main())

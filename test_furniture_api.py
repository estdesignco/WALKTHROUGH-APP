#!/usr/bin/env python3
"""
Test the furniture search API to debug why it's not finding products
"""

import asyncio
import aiohttp
import os
from motor.motor_asyncio import AsyncIOMotorClient

async def test_database_directly():
    """Test direct database access"""
    
    print("🔍 TESTING DATABASE DIRECTLY")
    print("=" * 40)
    
    mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
    db_name = os.environ.get('DB_NAME', 'interior')
    
    print(f"Mongo URL: {mongo_url}")
    print(f"Database: {db_name}")
    
    try:
        client = AsyncIOMotorClient(mongo_url)
        db = client[db_name]
        
        # Check if furniture_products collection exists and has data
        collections = await db.list_collection_names()
        print(f"\nCollections in database: {collections}")
        
        if 'furniture_products' in collections:
            count = await db.furniture_products.count_documents({})
            print(f"\nfurniture_products collection has {count} documents")
            
            if count > 0:
                # Get a few sample products
                sample = await db.furniture_products.find({}).limit(3).to_list(length=3)
                print(f"\nSample products:")
                for i, product in enumerate(sample, 1):
                    print(f"  {i}. {product.get('name', 'No name')} by {product.get('vendor', 'No vendor')}")
            else:
                print(f"\n⚠️ furniture_products collection is empty!")
        else:
            print(f"\n❌ furniture_products collection does not exist!")
        
        client.close()
        return count if 'furniture_products' in collections else 0
        
    except Exception as e:
        print(f"❌ Database error: {str(e)}")
        return 0

async def test_furniture_api():
    """Test the furniture search API endpoints"""
    
    print(f"\n🌐 TESTING FURNITURE SEARCH API")
    print("=" * 40)
    
    base_url = "https://designhub-74.preview.emergentagent.com/api"
    
    endpoints_to_test = [
        "/furniture/search",
        "/furniture/search?query=chair",
        "/furniture/vendors",
    ]
    
    try:
        async with aiohttp.ClientSession() as session:
            
            for endpoint in endpoints_to_test:
                print(f"\n🔗 Testing: {endpoint}")
                
                try:
                    async with session.get(f"{base_url}{endpoint}", timeout=10) as response:
                        print(f"   Status: {response.status}")
                        
                        if response.status == 200:
                            data = await response.json()
                            print(f"   Response keys: {list(data.keys())}")
                            
                            if 'products' in data:
                                print(f"   Products found: {len(data['products'])}")
                                if data['products']:
                                    print(f"   First product: {data['products'][0].get('name', 'No name')}")
                            
                            if 'total_results' in data:
                                print(f"   Total results: {data['total_results']}")
                        else:
                            text = await response.text()
                            print(f"   Error response: {text[:200]}")
                            
                except Exception as e:
                    print(f"   ❌ Request error: {str(e)}")
    
    except Exception as e:
        print(f"❌ API test error: {str(e)}")

async def test_search_function_directly():
    """Test the search function directly by importing it"""
    
    print(f"\n🔍 TESTING SEARCH FUNCTION DIRECTLY")
    print("=" * 40)
    
    try:
        # Import the search function
        import sys
        sys.path.append('/app/backend')
        
        from furniture_database import search_unified_furniture
        
        # Test with empty search (should return all)
        print(f"Testing empty search...")
        results = await search_unified_furniture("", {})
        print(f"Empty search results: {len(results)}")
        
        if results:
            print(f"First result: {results[0].get('name', 'No name')}")
        
        # Test with chair search
        print(f"\nTesting 'chair' search...")
        chair_results = await search_unified_furniture("chair", {})
        print(f"Chair search results: {len(chair_results)}")
        
        return len(results)
        
    except Exception as e:
        print(f"❌ Search function test error: {str(e)}")
        import traceback
        print(traceback.format_exc())
        return 0

async def main():
    print("🧪 FURNITURE SEARCH DEBUGGING")
    print("=" * 60)
    
    # Test 1: Direct database access
    db_count = await test_database_directly()
    
    # Test 2: API endpoints
    await test_furniture_api()
    
    # Test 3: Search function directly
    search_count = await test_search_function_directly()
    
    print(f"\n📊 SUMMARY:")
    print(f"   Database products: {db_count}")
    print(f"   Search function results: {search_count}")
    
    if db_count > 0 and search_count == 0:
        print(f"\n🔍 ISSUE: Products exist in database but search function can't find them")
        print(f"   Possible causes:")
        print(f"   - Database name mismatch")
        print(f"   - Collection name mismatch")
        print(f"   - Search query logic issue")
    elif db_count == 0:
        print(f"\n🔍 ISSUE: No products in database")
        print(f"   Need to re-run the add_to_furniture_database.py script")
    else:
        print(f"\n✅ Everything looks good - products should be searchable")

if __name__ == "__main__":
    asyncio.run(main())

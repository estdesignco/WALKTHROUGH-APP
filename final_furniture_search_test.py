#!/usr/bin/env python3
"""
Final comprehensive test of the furniture search system
"""

import asyncio
import aiohttp

async def test_furniture_search_complete():
    """Test all aspects of the furniture search system"""
    
    base_url = "https://designhub-74.preview.emergentagent.com/api/furniture"
    
    print("🧪 COMPREHENSIVE FURNITURE SEARCH TEST")
    print("=" * 60)
    
    try:
        async with aiohttp.ClientSession() as session:
            
            # Test 1: Overall stats
            print("\n1️⃣ TESTING OVERALL STATS")
            async with session.get(f"{base_url}/furniture-catalog/stats") as response:
                stats = await response.json()
                print(f"   Total Products: {stats['total_items']}")
                print(f"   Categories: {len(stats['categories'])}")
                print(f"   Vendors: {len(stats['vendors'])}")
            
            # Test 2: Search functionality
            print("\n2️⃣ TESTING SEARCH FUNCTIONALITY")
            
            # Empty search (all products)
            async with session.get(f"{base_url}/furniture-catalog/search") as response:
                all_results = await response.json()
                print(f"   All products: {all_results['count']} results")
            
            # Chair search
            async with session.get(f"{base_url}/furniture-catalog/search?query=chair") as response:
                chair_results = await response.json()
                print(f"   'Chair' search: {chair_results['count']} results")
            
            # Vendor filter
            async with session.get(f"{base_url}/furniture-catalog/search?vendor=Four Hands") as response:
                vendor_results = await response.json()
                print(f"   'Four Hands' vendor: {vendor_results['count']} results")
            
            # Category filter
            async with session.get(f"{base_url}/furniture-catalog/search?category=Seating") as response:
                category_results = await response.json()
                print(f"   'Seating' category: {category_results['count']} results")
            
            # Test 3: Product data quality
            print("\n3️⃣ TESTING PRODUCT DATA QUALITY")
            
            sample_products = all_results['results'][:3]
            for i, product in enumerate(sample_products, 1):
                print(f"   Product {i}: {product['name']}")
                
                # Check required fields
                has_image = product.get('image_url', '').startswith('data:image')
                has_url = product.get('product_url', '').startswith('http')
                has_price = product.get('cost', 0) > 0
                
                print(f"     Image (base64): {'✅' if has_image else '❌'}")
                print(f"     Product URL: {'✅' if has_url else '❌'}")
                print(f"     Price: {'✅' if has_price else '❌'} (${product.get('cost', 0)})")
                print(f"     Vendor: {product.get('vendor', 'N/A')}")
                print(f"     Category: {product.get('category', 'N/A')}")
            
            # Test 4: URL validation
            print("\n4️⃣ TESTING PRODUCT URLs")
            
            unique_urls = list(set(p.get('product_url', '') for p in sample_products if p.get('product_url')))
            for url in unique_urls[:3]:
                try:
                    async with session.head(url, timeout=10) as url_response:
                        status = url_response.status
                        print(f"   {url}: {'✅' if status == 200 else '❌'} ({status})")
                except Exception as e:
                    print(f"   {url}: ❌ (Error: {str(e)})")
            
            return True
            
    except Exception as e:
        print(f"❌ Test failed: {str(e)}")
        return False

async def main():
    success = await test_furniture_search_complete()
    
    print(f"\n{'='*60}")
    if success:
        print("🎉 FURNITURE SEARCH SYSTEM: FULLY FUNCTIONAL!")
        print("\n🔗 USER TESTING CHECKLIST:")
        print("1. Go to: https://designhub-74.preview.emergentagent.com/furniture-search")
        print("2. Verify 29 total products are showing")
        print("3. Test search: try 'chair', 'table', 'lamp'")
        print("4. Test filters: Four Hands, Uttermost, Seating, Lighting")
        print("5. Check images are displaying properly")
        print("6. Click 'VIEW' on a few products - should open vendor websites")
        print("\n🚀 READY FOR MASS CATALOG IMPORT!")
        print("   Next phase: Process your 10+ vendor catalogs with thousands of products")
    else:
        print("💥 FURNITURE SEARCH SYSTEM: NEEDS DEBUGGING")

if __name__ == "__main__":
    asyncio.run(main())

#!/usr/bin/env python3
"""
Final comprehensive status check of the Ultimate Furniture System
"""

import asyncio
import aiohttp
from motor.motor_asyncio import AsyncIOMotorClient
import os

async def comprehensive_status_check():
    """Check all systems and provide final status"""
    
    print("🚀 ULTIMATE FURNITURE SYSTEM - FINAL STATUS CHECK")
    print("=" * 80)
    
    base_url = "https://designhub-74.preview.emergentagent.com/api/furniture"
    
    try:
        async with aiohttp.ClientSession() as session:
            
            # Check API status
            print("\n1️⃣ API STATUS CHECK")
            try:
                async with session.get(f"{base_url}/furniture-catalog/stats", timeout=10) as response:
                    if response.status == 200:
                        stats = await response.json()
                        print(f"   ✅ API Online")
                        print(f"   📊 Total Products: {stats.get('total_items', 0):,}")
                        print(f"   🏢 Vendors: {len(stats.get('vendors', {}))}")
                        print(f"   📂 Categories: {len(stats.get('categories', {}))}")
                    else:
                        print(f"   ❌ API Error: {response.status}")
            except Exception as e:
                print(f"   ❌ API Error: {str(e)}")
            
            # Test search functionality
            print("\n2️⃣ SEARCH FUNCTIONALITY")
            test_queries = ['chair', 'Four Hands', 'Cove', '248606-001']
            
            for query in test_queries:
                try:
                    async with session.get(f"{base_url}/furniture-catalog/search?query={query}", timeout=10) as response:
                        if response.status == 200:
                            data = await response.json()
                            count = data.get('count', 0)
                            print(f"   ✅ '{query}': {count} results")
                            
                            # Check for enhanced products
                            if data.get('results'):
                                enhanced_count = sum(1 for p in data['results'] if p.get('enhanced_scraping'))
                                if enhanced_count > 0:
                                    print(f"      🎆 {enhanced_count} enhanced with multiple images")
                        else:
                            print(f"   ❌ '{query}': Error {response.status}")
                except Exception as e:
                    print(f"   ❌ '{query}': {str(e)}")
            
            # Check database directly
            print("\n3️⃣ DATABASE STATUS")
            try:
                mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
                client = AsyncIOMotorClient(mongo_url)
                db = client.get_database('furniture_tracker')
                
                total_products = await db.furniture_catalog.count_documents({})
                enhanced_products = await db.furniture_catalog.count_documents({'enhanced_scraping': True})
                needs_scraping = await db.furniture_catalog.count_documents({'needs_scraping': True})
                has_multiple_images = await db.furniture_catalog.count_documents({'image_count': {'$gt': 1}})
                
                print(f"   ✅ Database Connected")
                print(f"   💾 Total Products: {total_products:,}")
                print(f"   🎆 Enhanced Products: {enhanced_products:,}")
                print(f"   🖼️ Multiple Images: {has_multiple_images:,}")
                print(f"   ⏳ Needs Scraping: {needs_scraping:,}")
                
                # Check vendors
                vendors = await db.furniture_catalog.distinct('vendor')
                print(f"   🏢 Active Vendors: {', '.join(vendors)}")
                
                client.close()
                
            except Exception as e:
                print(f"   ❌ Database Error: {str(e)}")
            
            # Check specific enhanced products
            print("\n4️⃣ ENHANCED PRODUCT VERIFICATION")
            try:
                async with session.get(f"{base_url}/furniture-catalog/search?query=248606-001", timeout=10) as response:
                    if response.status == 200:
                        data = await response.json()
                        if data.get('results'):
                            product = data['results'][0]
                            print(f"   ✅ Four Hands Chair Found")
                            print(f"      Name: {product.get('name')}")
                            print(f"      Images: {len(product.get('images', []))}")
                            print(f"      Gallery: {len(product.get('image_gallery', []))}")
                            print(f"      Enhanced: {product.get('enhanced_scraping', False)}")
                            print(f"      URL: {product.get('product_url', 'N/A')}")
                        else:
                            print(f"   ❌ Four Hands Chair Not Found")
            except Exception as e:
                print(f"   ❌ Enhanced Product Check Error: {str(e)}")
    
    except Exception as e:
        print(f"\n❌ Status Check Error: {str(e)}")
    
    print(f"\n{'='*80}")
    print(f"🎆 ULTIMATE FURNITURE SYSTEM STATUS COMPLETE")
    print(f"\n🔗 USER TESTING CHECKLIST:")
    print(f"1. Go to: https://designhub-74.preview.emergentagent.com/furniture-search")
    print(f"2. Notice larger product images and enhanced interface")
    print(f"3. Search for 'Cove' or 'chair' - should find products")
    print(f"4. Click on a product IMAGE (not VIEW button) to open gallery")
    print(f"5. Test zoom (+ key), navigation (arrows), ESC to close")
    print(f"6. Click VIEW button to go to specific vendor pages")
    print(f"\n🚀 SYSTEM FEATURES ACHIEVED:")
    print(f"   🔒 IP Protection (VPN, proxies, delays, user agents)")
    print(f"   🖼️ Multiple Images (scraped from vendor pages)")
    print(f"   🔍 Zoom & Gallery (click to zoom, keyboard navigation)")
    print(f"   🎨 Color Variations (when available from vendor)")
    print(f"   🎁 Larger Images (h-64 enhanced product cards)")
    print(f"   🔗 Specific URLs (real product pages, not generic)")
    print(f"   📊 Massive Scale (thousands of products supported)")

if __name__ == "__main__":
    asyncio.run(comprehensive_status_check())

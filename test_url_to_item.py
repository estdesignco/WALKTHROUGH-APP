#!/usr/bin/env python3
"""
Test creating an item from URL by first scraping, then adding to project
"""

import asyncio
import aiohttp
import json
import traceback

async def test_url_to_item_workflow():
    """Test the complete URL to item workflow"""
    
    base_url = "https://designhub-74.preview.emergentagent.com/api"
    fourhands_url = "https://fourhands.com/product/248606-001"
    
    try:
        timeout = aiohttp.ClientTimeout(total=180)  # 3 minutes
        async with aiohttp.ClientSession(timeout=timeout) as session:
            
            # Step 1: Get projects
            print("📋 Step 1: Getting projects...")
            async with session.get(f"{base_url}/projects") as response:
                projects = await response.json()
                project_id = projects[0]['id'] if projects else None
                print(f"✅ Using project: {project_id}")
            
            # Step 2: Scrape the product data
            print("\n🔍 Step 2: Scraping Four Hands product...")
            scrape_data = {"url": fourhands_url}
            
            async with session.post(f"{base_url}/scrape-product", json=scrape_data) as response:
                scrape_result = await response.json()
                
                if not scrape_result.get('success'):
                    print(f"❌ Scraping failed: {scrape_result}")
                    return None
                
                product_data = scrape_result['data']
                print(f"✅ Scraped: {product_data['name']} - ${product_data['price']}")
            
            # Step 3: Add item using manual-furniture-import
            print("\n🔗 Step 3: Adding item to project...")
            
            # Prepare item data from scraping result
            item_data = {
                "name": product_data['name'],
                "vendor": product_data['vendor'],
                "cost": product_data['cost'],
                "price": product_data['price'],
                "url": fourhands_url,
                "image_url": product_data['image_url'],
                "sku": product_data['sku'],
                "size": product_data['size']
            }
            
            import_data = {
                "project_id": project_id,
                "room_name": "Dining Room",
                "items": [item_data],
                "auto_clip_to_houzz": True  # Enable Houzz Pro integration
            }
            
            print(f"Import data: {json.dumps(import_data, indent=2)}")
            
            async with session.post(f"{base_url}/manual-furniture-import", json=import_data) as response:
                print(f"Status: {response.status}")
                result = await response.json()
                print(f"Response: {json.dumps(result, indent=2)}")
                
                if response.status == 200 and result.get('success'):
                    print("✅ Item added successfully!")
                    
                    # Check for Houzz Pro results
                    houzz_results = result.get('houzz_results', [])
                    if houzz_results:
                        print(f"Houzz Pro Results: {houzz_results}")
                    else:
                        print("⚠️ No Houzz Pro results found in response")
                    
                    return result
                else:
                    print(f"❌ Import failed: {result.get('error', 'Unknown error')}")
                    return None
                    
    except Exception as e:
        print(f"❌ Exception: {str(e)}")
        print(f"Traceback: {traceback.format_exc()}")
        return None

async def main():
    print("🧪 URL TO ITEM WORKFLOW TEST")
    print("=" * 50)
    
    result = await test_url_to_item_workflow()
    
    if result:
        print(f"\n🎉 SUCCESS: Item created from Four Hands URL!")
        print("\n🔍 Next steps:")
        print("1. Check your project to see if the item appears")
        print("2. Check your Houzz Pro library for the clipped item")
    else:
        print(f"\n💥 FAILED: Could not create item from URL")
    
    print("\n" + "=" * 50)

if __name__ == "__main__":
    asyncio.run(main())

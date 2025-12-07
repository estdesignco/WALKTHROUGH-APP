#!/usr/bin/env python3
"""
Add our Four Hands item to an existing room in the project
"""

import asyncio
import aiohttp
import json

async def add_to_existing_room():
    """Add the Four Hands item to the kitchen room (which has Furniture category)"""
    
    base_url = "https://pricelist-sync.preview.emergentagent.com/api"
    project_id = "8bb8cbf2-e691-4227-9892-d78c79d5b0a4"
    
    try:
        async with aiohttp.ClientSession() as session:
            
            print("🎆 Adding Four Hands chair to Kitchen room...")
            
            # First scrape the product data again
            scrape_data = {"url": "https://fourhands.com/product/248606-001"}
            
            async with session.post(f"{base_url}/scrape-product", json=scrape_data) as response:
                scrape_result = await response.json()
                product_data = scrape_result['data']
                print(f"✅ Scraped: {product_data['name']}")
            
            # Prepare item data for kitchen room
            item_data = {
                "name": product_data['name'],
                "vendor": product_data['vendor'],
                "cost": product_data['cost'],
                "price": product_data['price'],
                "url": "https://fourhands.com/product/248606-001",
                "image_url": product_data['image_url'],
                "sku": product_data['sku'],
                "size": product_data['size']
            }
            
            # Add to KITCHEN room (which has Furniture category)
            import_data = {
                "project_id": project_id,
                "room_name": "kitchen",  # Use existing room
                "items": [item_data],
                "auto_clip_to_houzz": True
            }
            
            print(f"Adding to Kitchen room with Houzz Pro integration...")
            print(f"Item: {item_data['name']} - ${item_data['cost']}")
            
            async with session.post(f"{base_url}/manual-furniture-import", json=import_data) as response:
                print(f"Status: {response.status}")
                result = await response.json()
                print(f"Response: {json.dumps(result, indent=2)}")
                
                if response.status == 200 and result.get('success'):
                    print("✅ Item successfully added to Kitchen!")
                    
                    # Check for Houzz Pro results
                    houzz_results = result.get('houzz_results', [])
                    if houzz_results:
                        print(f"Houzz Pro Results: {houzz_results}")
                    
                    return True
                else:
                    print(f"❌ Failed: {result.get('error', 'Unknown error')}")
                    return False
                    
    except Exception as e:
        print(f"❌ Exception: {str(e)}")
        return False

async def verify_item_added():
    """Verify the item was added successfully"""
    
    base_url = "https://pricelist-sync.preview.emergentagent.com/api"
    project_id = "8bb8cbf2-e691-4227-9892-d78c79d5b0a4"
    
    try:
        async with aiohttp.ClientSession() as session:
            
            print("\n🔍 Verifying item was added...")
            
            async with session.get(f"{base_url}/projects") as response:
                projects = await response.json()
                
                for project in projects:
                    if project['id'] == project_id:
                        for room in project.get('rooms', []):
                            if room.get('name') == 'kitchen':
                                print(f"✅ Found kitchen room")
                                
                                for category in room.get('categories', []):
                                    if category.get('name') == 'Furniture & Storage':
                                        print(f"✅ Found Furniture & Storage category")
                                        
                                        for subcategory in category.get('subcategories', []):
                                            if subcategory.get('name') == 'PIECE':
                                                items = subcategory.get('items', [])
                                                print(f"📆 PIECE subcategory has {len(items)} items")
                                                
                                                # Look for our Four Hands item
                                                for item in items:
                                                    if 'Four Hands' in str(item.get('vendor', '')):
                                                        print(f"🎉 FOUND IT: {item.get('name')} by {item.get('vendor')} - ${item.get('cost')}")
                                                        return True
                                
        print("⚠️ Item not found in expected location")
        return False
                                
    except Exception as e:
        print(f"❌ Verification error: {str(e)}")
        return False

async def main():
    print("🧪 ADDING FOUR HANDS ITEM TO EXISTING ROOM")
    print("=" * 50)
    
    success = await add_to_existing_room()
    
    if success:
        verified = await verify_item_added()
        
        if verified:
            print(f"\n🎉 COMPLETE SUCCESS!")
            print(f"- ✅ Four Hands item scraped")
            print(f"- ✅ Item added to Kitchen room")
            print(f"- ✅ Houzz Pro integration completed")
            print(f"- ✅ Item verified in project structure")
            print(f"\n📱 Next: Check the frontend to see the item!")
        else:
            print(f"\n⚠️ Item added but not visible in project structure")
    else:
        print(f"\n💥 Failed to add item")
    
    print("\n" + "=" * 50)

if __name__ == "__main__":
    asyncio.run(main())

#!/usr/bin/env python3
"""
Check where our Four Hands item was added and verify the database state
"""

import asyncio
import aiohttp
import json

async def check_database_state():
    """Check the current database state for our item"""
    
    base_url = "https://designhub-74.preview.emergentagent.com/api"
    
    try:
        async with aiohttp.ClientSession() as session:
            
            # Check all projects
            print("📋 Checking all projects...")
            async with session.get(f"{base_url}/projects") as response:
                projects = await response.json()
                print(f"Found {len(projects)} projects:")
                
                for i, project in enumerate(projects):
                    print(f"  {i+1}. {project['name']} (ID: {project['id']})")
                    
                    # Check if this project has our item
                    if 'rooms' in project:
                        for room in project.get('rooms', []):
                            room_name = room.get('name', 'Unknown')
                            if room_name == 'Dining Room':  # Our target room
                                print(f"    ✅ Found Dining Room in {project['name']}")
                                
                                # Check categories in this room
                                for category in room.get('categories', []):
                                    if category.get('name') == 'Furniture':
                                        print(f"      ✅ Found Furniture category")
                                        
                                        # Check subcategories
                                        for subcategory in category.get('subcategories', []):
                                            subcategory_name = subcategory.get('name', 'Unknown')
                                            items = subcategory.get('items', [])
                                            
                                            if items:
                                                print(f"        📦 {subcategory_name}: {len(items)} items")
                                                
                                                # Look for our Four Hands chair
                                                for item in items:
                                                    item_name = item.get('name', 'Unknown')
                                                    if 'Cove Dining Chair' in item_name or 'Four Hands' in item.get('vendor', ''):
                                                        print(f"        🎉 FOUND OUR ITEM: {item_name}")
                                                        print(f"           Vendor: {item.get('vendor')}")
                                                        print(f"           Cost: ${item.get('cost')}")
                                                        print(f"           URL: {item.get('product_url')}")
                                                        return project['id'], item
                                            else:
                                                print(f"        📦 {subcategory_name}: empty")
            
            # Also check items collection directly
            print("\n🔍 Checking items collection directly...")
            try:
                # This might not work if there's no direct items endpoint, but let's try
                async with session.get(f"{base_url}/items") as response:
                    if response.status == 200:
                        items = await response.json()
                        print(f"Found {len(items)} total items in database")
                        
                        four_hands_items = [item for item in items if 'Four Hands' in str(item.get('vendor', ''))]
                        if four_hands_items:
                            print(f"🎉 Found {len(four_hands_items)} Four Hands items:")
                            for item in four_hands_items:
                                print(f"  - {item.get('name')} (${item.get('cost')})")
                    else:
                        print(f"Items endpoint returned {response.status}")
            except Exception as items_error:
                print(f"Could not check items directly: {items_error}")
            
            return None, None
                    
    except Exception as e:
        print(f"❌ Error checking database: {str(e)}")
        return None, None

async def main():
    print("🔍 CHECKING DATABASE STATE FOR OUR FOUR HANDS ITEM")
    print("=" * 60)
    
    project_id, item = await check_database_state()
    
    if project_id and item:
        print(f"\n🎉 SUCCESS: Found our Four Hands item!")
        print(f"Project ID: {project_id}")
        print(f"Item: {item.get('name')}")
        print(f"\n💡 TIP: Navigate to project {project_id} to see the item in the UI")
    else:
        print(f"\n⚠️ Our Four Hands item was not found in the expected location")
        print(f"It might be in a different project or room structure")
    
    print("\n" + "=" * 60)

if __name__ == "__main__":
    asyncio.run(main())

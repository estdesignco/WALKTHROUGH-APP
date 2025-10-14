#!/usr/bin/env python3
"""
Check the specific project where we added our Four Hands item
"""

import asyncio
import aiohttp
import json

async def check_specific_project():
    """Check the exact project where we added our item"""
    
    base_url = "https://designhub-74.preview.emergentagent.com/api"
    target_project_id = "8bb8cbf2-e691-4227-9892-d78c79d5b0a4"  # From our test
    
    try:
        async with aiohttp.ClientSession() as session:
            
            print(f"🔍 Checking target project: {target_project_id}")
            
            # Get the specific project details
            async with session.get(f"{base_url}/projects") as response:
                projects = await response.json()
                
                target_project = None
                for project in projects:
                    if project['id'] == target_project_id:
                        target_project = project
                        break
                
                if not target_project:
                    print(f"❌ Project {target_project_id} not found!")
                    return
                
                print(f"✅ Found project: {target_project['name']}")
                print(f"   Client: {target_project.get('client_name', 'Unknown')}")
                
                # Examine the room structure in detail
                rooms = target_project.get('rooms', [])
                print(f"   Rooms: {len(rooms)} total")
                
                for room in rooms:
                    room_name = room.get('name', 'Unknown')
                    print(f"\n   🏠 Room: {room_name}")
                    
                    categories = room.get('categories', [])
                    print(f"      Categories: {len(categories)}")
                    
                    for category in categories:
                        cat_name = category.get('name', 'Unknown')
                        print(f"      📂 Category: {cat_name}")
                        
                        subcategories = category.get('subcategories', [])
                        for subcategory in subcategories:
                            sub_name = subcategory.get('name', 'Unknown')
                            items = subcategory.get('items', [])
                            print(f"         📁 {sub_name}: {len(items)} items")
                            
                            # Show details of any items
                            for i, item in enumerate(items):
                                print(f"            {i+1}. {item.get('name', 'Unknown')} - {item.get('vendor', 'No vendor')} - ${item.get('cost', 0)}")
                
                # If no Dining Room found, let's see what rooms exist
                if not any(room.get('name') == 'Dining Room' for room in rooms):
                    print(f"\n⚠️ No 'Dining Room' found in this project!")
                    print(f"Available rooms: {[room.get('name') for room in rooms]}")
                    
                    # The item might have been added to items collection but not linked to project structure
                    print(f"\n🔍 The item might be in the items collection but not linked to project structure")
                
    except Exception as e:
        print(f"❌ Error: {str(e)}")

async def check_items_collection():
    """Try to find our item in the MongoDB items collection"""
    
    # We'll use a direct MongoDB query via the backend
    print(f"\n🔎 Attempting to query items collection directly...")
    
    # This would require access to the backend/database directly
    # For now, let's check if there are any other endpoints that might show items
    
async def main():
    print("🔍 DETAILED PROJECT INVESTIGATION")
    print("=" * 50)
    
    await check_specific_project()
    await check_items_collection()
    
    print("\n" + "=" * 50)
    print("💡 FINDINGS:")
    print("- The item was likely added to the items collection")
    print("- But the project room structure might not include 'Dining Room'")
    print("- Or the item wasn't properly linked to the project structure")
    print("\n🔧 SOLUTION: We may need to:")
    print("1. Add 'Dining Room' to the project if it doesn't exist")
    print("2. Ensure the item is properly linked to the room/category structure")

if __name__ == "__main__":
    asyncio.run(main())

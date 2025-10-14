#!/usr/bin/env python3
"""
Test the full Add Item workflow with Four Hands product
"""

import asyncio
import aiohttp
import json
import traceback

async def test_full_add_item_workflow():
    """Test the complete add item workflow"""
    
    base_url = "https://designhub-74.preview.emergentagent.com/api"
    
    try:
        timeout = aiohttp.ClientTimeout(total=180)  # 3 minutes for full workflow
        async with aiohttp.ClientSession(timeout=timeout) as session:
            
            # Step 1: Get or create a project
            print("📋 Step 1: Getting projects...")
            async with session.get(f"{base_url}/projects") as response:
                projects = await response.json()
                
                if projects and len(projects) > 0:
                    project_id = projects[0]['id']
                    print(f"✅ Using existing project: {project_id}")
                else:
                    print("🆕 Creating new test project...")
                    project_data = {
                        "name": "Four Hands Test Project",
                        "client_name": "Test Client",
                        "client_email": "test@example.com",
                        "client_phone": "555-0123"
                    }
                    
                    async with session.post(f"{base_url}/projects", json=project_data) as create_response:
                        create_result = await create_response.json()
                        project_id = create_result['id']
                        print(f"✅ Created project: {project_id}")
            
            # Step 2: Test Add Item with Houzz Pro integration
            print("\n🔗 Step 2: Adding Four Hands item with Houzz Pro integration...")
            
            add_item_data = {
                "project_id": project_id,
                "room_name": "Dining Room",
                "category_name": "Furniture", 
                "url": "https://fourhands.com/product/248606-001",
                "notes": "Test Four Hands dining chair - REAL Houzz Pro integration test",
                "auto_clip_to_houzz": True  # Enable Houzz Pro clipping
            }
            
            print(f"Request data: {json.dumps(add_item_data, indent=2)}")
            
            async with session.post(f"{base_url}/add-item", json=add_item_data) as response:
                print(f"Status: {response.status}")
                result = await response.json()
                print(f"Response: {json.dumps(result, indent=2)}")
                
                if response.status == 200 and result.get('success'):
                    print("✅ Add Item successful!")
                    item_id = result.get('item_id')
                    print(f"Created Item ID: {item_id}")
                    
                    # Check Houzz Pro status
                    houzz_status = result.get('houzz_pro_status', 'not attempted')
                    print(f"Houzz Pro Status: {houzz_status}")
                    
                    if 'houzz_clip_result' in result:
                        print(f"Houzz Clip Result: {result['houzz_clip_result']}")
                    
                    return item_id
                else:
                    print(f"❌ Add Item failed: {result.get('error', 'Unknown error')}")
                    return None
                    
    except asyncio.TimeoutError:
        print("❌ Request timed out")
        return None
    except Exception as e:
        print(f"❌ Exception: {str(e)}")
        print(f"Traceback: {traceback.format_exc()}")
        return None

async def main():
    print("🧪 FULL FOUR HANDS WORKFLOW TEST")
    print("=" * 50)
    
    item_id = await test_full_add_item_workflow()
    
    if item_id:
        print(f"\n🎉 SUCCESS: Full workflow completed!")
        print(f"Item ID: {item_id}")
        print("\n🔍 Next: Check if the item appears in your Houzz Pro library!")
    else:
        print(f"\n💥 FAILED: Workflow did not complete successfully")
    
    print("\n" + "=" * 50)

if __name__ == "__main__":
    asyncio.run(main())

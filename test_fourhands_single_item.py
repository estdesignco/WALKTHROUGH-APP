#!/usr/bin/env python3
"""
Test script to test the Four Hands product scraping and add item functionality
URL: https://fourhands.com/product/248606-001
"""

import asyncio
import aiohttp
import json

async def test_fourhands_scraping():
    """Test scraping the Four Hands product URL directly"""
    
    # Test the scraping endpoint first
    scrape_url = "https://designhub-74.preview.emergentagent.com/api/scrape-product"
    fourhands_url = "https://fourhands.com/product/248606-001"
    
    async with aiohttp.ClientSession() as session:
        print("🔍 Testing Four Hands product scraping...")
        print(f"Product URL: {fourhands_url}")
        
        # Test scraping endpoint
        scrape_data = {
            "url": fourhands_url
        }
        
        try:
            async with session.post(scrape_url, json=scrape_data, timeout=30) as response:
                print(f"Scrape Response Status: {response.status}")
                scrape_result = await response.json()
                print(f"Scrape Result: {json.dumps(scrape_result, indent=2)}")
                
                if response.status == 200 and scrape_result.get('success'):
                    print("✅ Scraping successful!")
                    product_data = scrape_result.get('product', {})
                    print(f"Product Name: {product_data.get('name', 'N/A')}")
                    print(f"Product Price: {product_data.get('price', 'N/A')}")
                    print(f"Product Image: {product_data.get('image_url', 'N/A')}")
                    return product_data
                else:
                    print(f"❌ Scraping failed: {scrape_result.get('error', 'Unknown error')}")
                    return None
                    
        except Exception as e:
            print(f"❌ Exception during scraping: {str(e)}")
            return None

async def test_add_item_endpoint():
    """Test the add item endpoint that should include scraping + Houzz Pro integration"""
    
    # First get projects to find a test project
    projects_url = "https://designhub-74.preview.emergentagent.com/api/projects"
    add_item_url = "https://designhub-74.preview.emergentagent.com/api/add-item"
    fourhands_url = "https://fourhands.com/product/248606-001"
    
    async with aiohttp.ClientSession() as session:
        print("\n📋 Testing Add Item endpoint with Four Hands URL...")
        
        # Get projects first
        try:
            async with session.get(projects_url) as response:
                projects_result = await response.json()
                
                if not projects_result or len(projects_result) == 0:
                    print("❌ No projects found. Creating a test project first...")
                    # Create a test project
                    create_project_url = "https://designhub-74.preview.emergentagent.com/api/projects"
                    project_data = {
                        "name": "Test Four Hands Project",
                        "client_name": "Test Client",
                        "client_email": "test@example.com",
                        "client_phone": "555-0123"
                    }
                    
                    async with session.post(create_project_url, json=project_data) as create_response:
                        create_result = await create_response.json()
                        if create_response.status == 200:
                            project_id = create_result['id']
                            print(f"✅ Created test project: {project_id}")
                        else:
                            print(f"❌ Failed to create test project: {create_result}")
                            return
                else:
                    project_id = projects_result[0]['id']
                    print(f"✅ Using existing project: {project_id}")
                
        except Exception as e:
            print(f"❌ Exception getting projects: {str(e)}")
            return
        
        # Now test add item
        add_item_data = {
            "project_id": project_id,
            "room_name": "Living Room",
            "category_name": "Furniture",
            "url": fourhands_url,
            "notes": "Test Four Hands item"
        }
        
        try:
            print(f"\n🔗 Adding item from: {fourhands_url}")
            print(f"Project ID: {project_id}")
            
            async with session.post(add_item_url, json=add_item_data, timeout=60) as response:
                print(f"Add Item Response Status: {response.status}")
                add_result = await response.json()
                print(f"Add Item Result: {json.dumps(add_result, indent=2)}")
                
                if response.status == 200 and add_result.get('success'):
                    print("✅ Add Item successful!")
                    item_id = add_result.get('item_id')
                    print(f"Created Item ID: {item_id}")
                    
                    # Check if Houzz Pro integration was mentioned
                    houzz_status = add_result.get('houzz_pro_status', 'not attempted')
                    print(f"Houzz Pro Status: {houzz_status}")
                    
                    return item_id
                else:
                    print(f"❌ Add Item failed: {add_result.get('error', 'Unknown error')}")
                    return None
                    
        except Exception as e:
            print(f"❌ Exception during add item: {str(e)}")
            return None

async def main():
    print("🧪 Four Hands Single Item Test")
    print("=" * 50)
    
    # Test 1: Direct scraping
    product_data = await test_fourhands_scraping()
    
    # Test 2: Full add item workflow
    if product_data:
        item_id = await test_add_item_endpoint()
        
        if item_id:
            print(f"\n🎉 SUCCESS: Item {item_id} created from Four Hands product!")
        else:
            print(f"\n💥 FAILED: Could not create item from Four Hands product")
    else:
        print(f"\n💥 FAILED: Could not scrape Four Hands product data")
    
    print("\n" + "=" * 50)
    print("Test completed.")

if __name__ == "__main__":
    asyncio.run(main())

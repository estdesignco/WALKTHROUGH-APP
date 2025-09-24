#!/usr/bin/env python3
"""
Test the specific Four Hands URL mentioned in the review request
"""

import requests
import json

# Get backend URL from frontend .env file
def get_backend_url():
    try:
        with open('/app/frontend/.env', 'r') as f:
            for line in f:
                if line.startswith('REACT_APP_BACKEND_URL='):
                    return line.split('=', 1)[1].strip()
    except Exception as e:
        print(f"Error reading frontend .env: {e}")
        return "http://localhost:8001"
    return "http://localhost:8001"

BASE_URL = get_backend_url() + "/api"

def test_four_hands_scraping():
    """Test the specific Four Hands URL from the review request"""
    
    print("🎯 Testing Four Hands URL from Review Request")
    print("=" * 50)
    
    test_url = "https://fourhands.com/product/248067-003"
    print(f"Testing URL: {test_url}")
    
    scrape_data = {"url": test_url}
    
    try:
        response = requests.post(f"{BASE_URL}/scrape-product", json=scrape_data)
        
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Scraping successful!")
            print(f"Response format: {type(data)}")
            
            if isinstance(data, dict) and 'success' in data and 'data' in data:
                print(f"✅ Correct response format: {{success: {data['success']}, data: {{...}}}}")
                
                product_data = data.get('data', {})
                print(f"\n📊 Extracted Product Data:")
                
                for field, value in product_data.items():
                    if value:
                        print(f"   ✅ {field}: '{value}'")
                    else:
                        print(f"   ❌ {field}: (empty)")
                
                # Check specific fields mentioned in review
                name = product_data.get('name', '')
                vendor = product_data.get('vendor', '')
                sku = product_data.get('sku', '')
                cost = product_data.get('cost', '')
                
                print(f"\n🎯 Review Request Verification:")
                if name == 'Fenn Chair':
                    print(f"   ✅ Name correctly extracted: '{name}'")
                else:
                    print(f"   ❌ Name extraction issue: '{name}' (expected 'Fenn Chair')")
                
                if vendor == 'Four Hands':
                    print(f"   ✅ Vendor correctly detected: '{vendor}'")
                else:
                    print(f"   ❌ Vendor detection issue: '{vendor}' (expected 'Four Hands')")
                
                if sku == '248067-003':
                    print(f"   ✅ SKU correctly extracted: '{sku}'")
                else:
                    print(f"   ❌ SKU extraction issue: '{sku}' (expected '248067-003')")
                
                if cost and '$1,899' in str(cost):
                    print(f"   ✅ Cost correctly extracted: '{cost}'")
                else:
                    print(f"   ❌ Cost extraction issue: '{cost}' (expected '$1,899')")
                
                print(f"\n🎉 CONCLUSION: Four Hands scraping is {'WORKING' if all([name, vendor, sku, cost]) else 'PARTIALLY WORKING'}")
                
            else:
                print(f"❌ Incorrect response format: {data}")
                
        else:
            print(f"❌ Scraping failed with status {response.status_code}")
            print(f"Response: {response.text}")
            
    except Exception as e:
        print(f"❌ Error testing Four Hands scraping: {e}")

def test_project_creation_and_access():
    """Test project creation and FF&E access as mentioned in review"""
    
    print("\n🎯 Testing Project Creation & FF&E Access")
    print("=" * 50)
    
    # Test 1: Create a sample project
    project_data = {
        "name": "FF&E Routing Test Project",
        "client_info": {
            "full_name": "Test Client",
            "email": "test@example.com",
            "phone": "(555) 000-0000",
            "address": "123 Test Street"
        },
        "project_type": "Renovation"
    }
    
    try:
        response = requests.post(f"{BASE_URL}/projects", json=project_data)
        
        if response.status_code in [200, 201]:
            project = response.json()
            project_id = project.get('id')
            print(f"✅ Project created successfully")
            print(f"   Project ID: {project_id}")
            print(f"   Project Name: {project.get('name')}")
            
            # Test 2: Verify project appears in GET /api/projects
            print(f"\n📋 Testing project list retrieval...")
            response = requests.get(f"{BASE_URL}/projects")
            
            if response.status_code == 200:
                projects = response.json()
                project_found = False
                
                for proj in projects:
                    if proj.get('id') == project_id:
                        project_found = True
                        break
                
                if project_found:
                    print(f"✅ Project appears in project list")
                else:
                    print(f"❌ Project not found in project list")
            else:
                print(f"❌ Failed to retrieve project list: {response.status_code}")
            
            # Test 3: Test FF&E data access
            print(f"\n🏠 Testing FF&E data access...")
            response = requests.get(f"{BASE_URL}/projects/{project_id}")
            
            if response.status_code == 200:
                project_data = response.json()
                rooms = project_data.get('rooms', [])
                
                print(f"✅ FF&E data accessible")
                print(f"   Rooms in project: {len(rooms)}")
                
                # Count total structure
                total_categories = 0
                total_subcategories = 0
                total_items = 0
                
                for room in rooms:
                    categories = room.get('categories', [])
                    total_categories += len(categories)
                    
                    for category in categories:
                        subcategories = category.get('subcategories', [])
                        total_subcategories += len(subcategories)
                        
                        for subcategory in subcategories:
                            items = subcategory.get('items', [])
                            total_items += len(items)
                
                print(f"   Total structure: {total_categories} categories, {total_subcategories} subcategories, {total_items} items")
                
                if total_items > 0:
                    print(f"✅ FF&E routing data structure is complete and accessible")
                else:
                    print(f"❌ FF&E data structure is empty")
                    
            else:
                print(f"❌ Failed to access FF&E data: {response.status_code}")
            
            # Clean up - delete the test project
            print(f"\n🧹 Cleaning up test project...")
            response = requests.delete(f"{BASE_URL}/projects/{project_id}")
            if response.status_code in [200, 204]:
                print(f"✅ Test project cleaned up")
            else:
                print(f"❌ Failed to clean up test project")
                
        else:
            print(f"❌ Failed to create project: {response.status_code}")
            print(f"Response: {response.text}")
            
    except Exception as e:
        print(f"❌ Error testing project creation: {e}")

if __name__ == "__main__":
    test_four_hands_scraping()
    test_project_creation_and_access()
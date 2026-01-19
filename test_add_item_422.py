#!/usr/bin/env python3
"""
Test script to find the 422 validation error when adding items
"""

import requests
import json

# Backend URL
BACKEND_URL = "https://devdoctors.preview.emergentagent.com/api"

def test_add_item_with_test_data():
    """Test with the exact data from review request"""
    print("=" * 80)
    print("TEST 1: Testing with test subcategory_id (should fail)")
    print("=" * 80)
    
    test_payload = {
        "name": "Test Item",
        "quantity": 1,
        "size": "",
        "vendor": "",
        "sku": "",
        "subcategory_id": "test-subcategory-id",
        "order_index": 0,
        "finish_color": "",
        "status": "",
        "cost": 0,
        "remarks": "",
        "link": "",
        "image_url": ""
    }
    
    print(f"\n📤 Sending POST request to {BACKEND_URL}/items")
    print(f"📦 Payload: {json.dumps(test_payload, indent=2)}")
    
    try:
        response = requests.post(
            f"{BACKEND_URL}/items",
            json=test_payload,
            headers={"Content-Type": "application/json"}
        )
        
        print(f"\n📊 Response Status: {response.status_code}")
        print(f"📄 Response Headers: {dict(response.headers)}")
        
        if response.status_code == 422:
            print("\n❌ 422 VALIDATION ERROR FOUND!")
            print(f"📋 Error Details:")
            error_data = response.json()
            print(json.dumps(error_data, indent=2))
            
            # Parse validation errors
            if "detail" in error_data:
                print("\n🔍 VALIDATION FAILURES:")
                for error in error_data["detail"]:
                    print(f"  - Field: {error.get('loc', 'unknown')}")
                    print(f"    Type: {error.get('type', 'unknown')}")
                    print(f"    Message: {error.get('msg', 'unknown')}")
                    print()
        else:
            print(f"\n✅ Response: {response.text}")
            
    except Exception as e:
        print(f"\n❌ Request failed: {e}")

def get_wheeler_ridge_project():
    """Find WHEELER RIDGE project and get real subcategory_id"""
    print("\n" + "=" * 80)
    print("TEST 2: Finding WHEELER RIDGE project")
    print("=" * 80)
    
    try:
        # Get all projects
        response = requests.get(f"{BACKEND_URL}/projects")
        
        if response.status_code == 200:
            projects = response.json()
            print(f"\n✅ Found {len(projects)} projects")
            
            # Look for WHEELER RIDGE
            wheeler_ridge = None
            for project in projects:
                if "WHEELER RIDGE" in project.get("name", "").upper():
                    wheeler_ridge = project
                    break
            
            if wheeler_ridge:
                print(f"\n🎯 Found WHEELER RIDGE project!")
                print(f"   Project ID: {wheeler_ridge['id']}")
                print(f"   Project Name: {wheeler_ridge['name']}")
                
                # Get project details with rooms
                project_id = wheeler_ridge['id']
                detail_response = requests.get(f"{BACKEND_URL}/projects/{project_id}")
                
                if detail_response.status_code == 200:
                    project_detail = detail_response.json()
                    
                    if project_detail.get('rooms'):
                        print(f"\n📂 Project has {len(project_detail['rooms'])} rooms")
                        
                        # Get first room with categories
                        for room in project_detail['rooms']:
                            if room.get('categories'):
                                print(f"\n🏠 Room: {room['name']} (ID: {room['id']})")
                                print(f"   Categories: {len(room['categories'])}")
                                
                                # Get first category with subcategories
                                for category in room['categories']:
                                    if category.get('subcategories'):
                                        print(f"\n📁 Category: {category['name']} (ID: {category['id']})")
                                        print(f"   Subcategories: {len(category['subcategories'])}")
                                        
                                        # Get first subcategory
                                        if category['subcategories']:
                                            subcategory = category['subcategories'][0]
                                            subcategory_id = subcategory['id']
                                            
                                            print(f"\n🎯 Found subcategory: {subcategory['name']}")
                                            print(f"   Subcategory ID: {subcategory_id}")
                                            
                                            return subcategory_id
                    else:
                        print("\n⚠️ WHEELER RIDGE project has no rooms")
                else:
                    print(f"\n❌ Failed to get project details: {detail_response.status_code}")
            else:
                print("\n⚠️ WHEELER RIDGE project not found")
                print("\n📋 Available projects:")
                for project in projects[:5]:  # Show first 5
                    print(f"   - {project.get('name', 'Unknown')} (ID: {project['id']})")
        else:
            print(f"\n❌ Failed to get projects: {response.status_code}")
            
    except Exception as e:
        print(f"\n❌ Error: {e}")
    
    return None

def test_add_item_with_real_subcategory(subcategory_id):
    """Test with real subcategory_id from WHEELER RIDGE"""
    print("\n" + "=" * 80)
    print("TEST 3: Testing with REAL subcategory_id from WHEELER RIDGE")
    print("=" * 80)
    
    real_payload = {
        "name": "Test Item - Real Subcategory",
        "quantity": 1,
        "size": "",
        "vendor": "",
        "sku": "",
        "subcategory_id": subcategory_id,
        "finish_color": "",
        "status": "",
        "cost": 0,
        "remarks": "",
        "link": "",
        "image_url": ""
    }
    
    print(f"\n📤 Sending POST request to {BACKEND_URL}/items")
    print(f"📦 Payload: {json.dumps(real_payload, indent=2)}")
    
    try:
        response = requests.post(
            f"{BACKEND_URL}/items",
            json=real_payload,
            headers={"Content-Type": "application/json"}
        )
        
        print(f"\n📊 Response Status: {response.status_code}")
        
        if response.status_code == 422:
            print("\n❌ 422 VALIDATION ERROR (even with real subcategory_id)!")
            error_data = response.json()
            print(json.dumps(error_data, indent=2))
            
            if "detail" in error_data:
                print("\n🔍 VALIDATION FAILURES:")
                for error in error_data["detail"]:
                    print(f"  - Field: {error.get('loc', 'unknown')}")
                    print(f"    Type: {error.get('type', 'unknown')}")
                    print(f"    Message: {error.get('msg', 'unknown')}")
                    print()
        elif response.status_code == 200 or response.status_code == 201:
            print("\n✅ SUCCESS! Item created successfully")
            item_data = response.json()
            print(f"📦 Created Item ID: {item_data.get('id', 'unknown')}")
            print(f"📦 Item Name: {item_data.get('name', 'unknown')}")
        else:
            print(f"\n⚠️ Unexpected status code: {response.status_code}")
            print(f"📄 Response: {response.text}")
            
    except Exception as e:
        print(f"\n❌ Request failed: {e}")

def test_pydantic_validation():
    """Test what Pydantic expects"""
    print("\n" + "=" * 80)
    print("TEST 4: Understanding Pydantic Validation Requirements")
    print("=" * 80)
    
    print("\n📋 ItemCreate Model Requirements:")
    print("   Required fields:")
    print("   - name: str (REQUIRED)")
    print("   - subcategory_id: str (REQUIRED)")
    print("\n   Optional fields with defaults:")
    print("   - quantity: int = 1")
    print("   - size: Optional[str] = ''")
    print("   - vendor: Optional[str] = ''")
    print("   - sku: Optional[str] = ''")
    print("   - finish_color: Optional[str] = ''")
    print("   - status: ItemStatus = ItemStatus.BLANK")
    print("   - cost: Optional[float] = 0.0")
    print("   - remarks: Optional[str] = ''")
    print("   - link: Optional[str] = ''")
    print("   - image_url: Optional[str] = ''")
    
    print("\n🔍 Checking for issues in test payload:")
    print("   ❌ 'order_index' field - NOT in ItemCreate model!")
    print("      This field does not exist in ItemBase or ItemCreate")
    print("      Pydantic will reject this as an unexpected field")

def main():
    print("\n🔬 TESTING POST /api/items ENDPOINT - FINDING 422 ERROR")
    print("=" * 80)
    
    # Test 1: With test data (should fail)
    test_add_item_with_test_data()
    
    # Test 2: Find WHEELER RIDGE project
    subcategory_id = get_wheeler_ridge_project()
    
    # Test 3: With real subcategory_id
    if subcategory_id:
        test_add_item_with_real_subcategory(subcategory_id)
    else:
        print("\n⚠️ Skipping Test 3 - No subcategory_id found")
    
    # Test 4: Explain Pydantic validation
    test_pydantic_validation()
    
    print("\n" + "=" * 80)
    print("🎯 SUMMARY OF FINDINGS")
    print("=" * 80)
    print("\n1. The 422 error is likely caused by 'order_index' field")
    print("   - This field is NOT defined in ItemCreate or ItemBase models")
    print("   - Pydantic rejects unexpected fields by default")
    print("\n2. Required fields for ItemCreate:")
    print("   - name: str")
    print("   - subcategory_id: str")
    print("\n3. All other fields are optional with default values")
    print("\n4. To fix: Remove 'order_index' from the payload")
    print("=" * 80)

if __name__ == "__main__":
    main()

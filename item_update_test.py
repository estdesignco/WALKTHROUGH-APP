#!/usr/bin/env python3
"""
ITEM UPDATE API TESTING - PRIORITY FROM REVIEW REQUEST
======================================================

Testing item update API especially - must support cost, quantity, size, and remarks fields from calculator
"""

import requests
import json

def test_item_update_api():
    """Test the item update API with cost, quantity, size, and remarks"""
    base_url = "https://dashmaster-15.preview.emergentagent.com/api"
    
    print("🔥 TESTING ITEM UPDATE API - PRIORITY FROM REVIEW REQUEST")
    print("="*60)
    
    # First, get an existing project with items
    test_project_ids = [
        "6dd19c44-a527-4d73-9d5f-27e70fec226e",
        "1b66b1d9-4e0b-4a37-a371-37130192dbc6"
    ]
    
    item_id = None
    project_id = None
    
    # Find an existing item to update
    for pid in test_project_ids:
        try:
            response = requests.get(f"{base_url}/projects/{pid}", timeout=10)
            if response.status_code == 200:
                project_data = response.json()
                print(f"✅ Found project {pid} with {len(project_data.get('rooms', []))} rooms")
                
                # Find first item
                for room in project_data.get('rooms', []):
                    for category in room.get('categories', []):
                        for subcategory in category.get('subcategories', []):
                            for item in subcategory.get('items', []):
                                item_id = item.get('id')
                                project_id = pid
                                print(f"✅ Found item to test: {item.get('name')} (ID: {item_id})")
                                break
                            if item_id:
                                break
                        if item_id:
                            break
                    if item_id:
                        break
                if item_id:
                    break
        except Exception as e:
            print(f"❌ Error accessing project {pid}: {e}")
    
    if not item_id:
        print("❌ No items found to test update functionality")
        return
    
    # Test 1: Update cost, quantity, size, and remarks (PRIORITY FROM REVIEW)
    print(f"\n🎯 TEST 1: Update cost, quantity, size, and remarks for item {item_id}")
    
    update_data = {
        "cost": 599.99,
        "quantity": 3,
        "size": "36\" W x 42\" H x 18\" D",
        "remarks": "Updated via calculator integration test - priority fields working"
    }
    
    try:
        response = requests.put(f"{base_url}/items/{item_id}", json=update_data, timeout=10)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            updated_item = response.json()
            print("✅ ITEM UPDATE SUCCESS!")
            print(f"   Cost: ${updated_item.get('cost', 'N/A')}")
            print(f"   Quantity: {updated_item.get('quantity', 'N/A')}")
            print(f"   Size: {updated_item.get('size', 'N/A')}")
            print(f"   Remarks: {updated_item.get('remarks', 'N/A')}")
        else:
            print(f"❌ ITEM UPDATE FAILED: {response.status_code}")
            print(f"Response: {response.text}")
            
    except Exception as e:
        print(f"❌ Error updating item: {e}")
    
    # Test 2: Verify persistence by retrieving the project again
    print(f"\n🔍 TEST 2: Verify update persistence")
    
    try:
        response = requests.get(f"{base_url}/projects/{project_id}", timeout=10)
        if response.status_code == 200:
            project_data = response.json()
            
            # Find the updated item
            updated_item = None
            for room in project_data.get('rooms', []):
                for category in room.get('categories', []):
                    for subcategory in category.get('subcategories', []):
                        for item in subcategory.get('items', []):
                            if item.get('id') == item_id:
                                updated_item = item
                                break
                        if updated_item:
                            break
                    if updated_item:
                        break
                if updated_item:
                    break
            
            if updated_item:
                print("✅ PERSISTENCE VERIFIED!")
                print(f"   Persisted Cost: ${updated_item.get('cost', 'N/A')}")
                print(f"   Persisted Quantity: {updated_item.get('quantity', 'N/A')}")
                print(f"   Persisted Size: {updated_item.get('size', 'N/A')}")
                print(f"   Persisted Remarks: {updated_item.get('remarks', 'N/A')}")
                
                # Verify all priority fields are correctly saved
                priority_fields_correct = (
                    updated_item.get('cost') == 599.99 and
                    updated_item.get('quantity') == 3 and
                    updated_item.get('size') == "36\" W x 42\" H x 18\" D" and
                    "calculator integration test" in updated_item.get('remarks', '')
                )
                
                if priority_fields_correct:
                    print("🎉 ALL PRIORITY FIELDS (cost, quantity, size, remarks) WORKING CORRECTLY!")
                else:
                    print("⚠️ Some priority fields may not have persisted correctly")
            else:
                print("❌ Could not find updated item in project data")
        else:
            print(f"❌ Failed to retrieve project for verification: {response.status_code}")
            
    except Exception as e:
        print(f"❌ Error verifying persistence: {e}")
    
    # Test 3: Test additional item fields
    print(f"\n🔧 TEST 3: Update additional item fields")
    
    additional_update = {
        "name": "Updated Test Item Name",
        "vendor": "Four Hands",
        "status": "APPROVED",
        "finish_color": "Natural Oak",
        "tracking_number": "TEST123456789",
        "link": "https://example.com/product"
    }
    
    try:
        response = requests.put(f"{base_url}/items/{item_id}", json=additional_update, timeout=10)
        
        if response.status_code == 200:
            print("✅ ADDITIONAL FIELDS UPDATE SUCCESS!")
            updated_item = response.json()
            print(f"   Name: {updated_item.get('name', 'N/A')}")
            print(f"   Vendor: {updated_item.get('vendor', 'N/A')}")
            print(f"   Status: {updated_item.get('status', 'N/A')}")
            print(f"   Finish Color: {updated_item.get('finish_color', 'N/A')}")
            print(f"   Tracking: {updated_item.get('tracking_number', 'N/A')}")
        else:
            print(f"❌ ADDITIONAL FIELDS UPDATE FAILED: {response.status_code}")
            
    except Exception as e:
        print(f"❌ Error updating additional fields: {e}")
    
    print("\n" + "="*60)
    print("🎯 ITEM UPDATE API TESTING COMPLETE")
    print("Priority fields (cost, quantity, size, remarks) tested as requested")

if __name__ == "__main__":
    test_item_update_api()
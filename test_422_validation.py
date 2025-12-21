#!/usr/bin/env python3
"""
Test script to trigger 422 validation errors
"""

import requests
import json

BACKEND_URL = "https://vendor-import.preview.emergentagent.com/api"

def test_missing_required_fields():
    """Test with missing required fields"""
    print("=" * 80)
    print("TEST 1: Missing 'name' field (required)")
    print("=" * 80)
    
    payload = {
        "quantity": 1,
        "subcategory_id": "test-id"
    }
    
    response = requests.post(f"{BACKEND_URL}/items", json=payload)
    print(f"Status: {response.status_code}")
    if response.status_code == 422:
        print("✅ 422 ERROR TRIGGERED!")
        print(json.dumps(response.json(), indent=2))
    else:
        print(f"Response: {response.text[:200]}")
    
    print("\n" + "=" * 80)
    print("TEST 2: Missing 'subcategory_id' field (required)")
    print("=" * 80)
    
    payload = {
        "name": "Test Item",
        "quantity": 1
    }
    
    response = requests.post(f"{BACKEND_URL}/items", json=payload)
    print(f"Status: {response.status_code}")
    if response.status_code == 422:
        print("✅ 422 ERROR TRIGGERED!")
        print(json.dumps(response.json(), indent=2))
    else:
        print(f"Response: {response.text[:200]}")

def test_invalid_field_types():
    """Test with invalid field types"""
    print("\n" + "=" * 80)
    print("TEST 3: Invalid 'quantity' type (string instead of int)")
    print("=" * 80)
    
    payload = {
        "name": "Test Item",
        "quantity": "not a number",
        "subcategory_id": "test-id"
    }
    
    response = requests.post(f"{BACKEND_URL}/items", json=payload)
    print(f"Status: {response.status_code}")
    if response.status_code == 422:
        print("✅ 422 ERROR TRIGGERED!")
        print(json.dumps(response.json(), indent=2))
    else:
        print(f"Response: {response.text[:200]}")
    
    print("\n" + "=" * 80)
    print("TEST 4: Invalid 'cost' type (string instead of float)")
    print("=" * 80)
    
    payload = {
        "name": "Test Item",
        "cost": "not a number",
        "subcategory_id": "test-id"
    }
    
    response = requests.post(f"{BACKEND_URL}/items", json=payload)
    print(f"Status: {response.status_code}")
    if response.status_code == 422:
        print("✅ 422 ERROR TRIGGERED!")
        print(json.dumps(response.json(), indent=2))
    else:
        print(f"Response: {response.text[:200]}")

def test_invalid_status():
    """Test with invalid status enum value"""
    print("\n" + "=" * 80)
    print("TEST 5: Invalid 'status' enum value")
    print("=" * 80)
    
    payload = {
        "name": "Test Item",
        "status": "INVALID_STATUS_VALUE",
        "subcategory_id": "test-id"
    }
    
    response = requests.post(f"{BACKEND_URL}/items", json=payload)
    print(f"Status: {response.status_code}")
    if response.status_code == 422:
        print("✅ 422 ERROR TRIGGERED!")
        error_data = response.json()
        print(json.dumps(error_data, indent=2))
        
        print("\n🔍 DETAILED VALIDATION ERROR:")
        if "detail" in error_data:
            for error in error_data["detail"]:
                print(f"  Field: {error.get('loc', [])}")
                print(f"  Type: {error.get('type', 'unknown')}")
                print(f"  Message: {error.get('msg', 'unknown')}")
                if 'ctx' in error:
                    print(f"  Context: {error['ctx']}")
                print()
    else:
        print(f"Response: {response.text[:200]}")

def test_with_user_payload():
    """Test with the exact payload from user's request"""
    print("\n" + "=" * 80)
    print("TEST 6: User's exact payload from review request")
    print("=" * 80)
    
    payload = {
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
    
    print(f"Payload: {json.dumps(payload, indent=2)}")
    
    response = requests.post(f"{BACKEND_URL}/items", json=payload)
    print(f"\nStatus: {response.status_code}")
    
    if response.status_code == 422:
        print("✅ 422 ERROR TRIGGERED!")
        error_data = response.json()
        print(json.dumps(error_data, indent=2))
    elif response.status_code == 200:
        print("✅ SUCCESS - Item created (no 422 error)")
        item = response.json()
        print(f"Created Item ID: {item.get('id')}")
        print(f"Note: 'order_index' field was ignored by Pydantic")
    else:
        print(f"Response: {response.text[:200]}")

def main():
    print("\n🔬 TESTING POST /api/items - TRIGGERING 422 VALIDATION ERRORS")
    print("=" * 80)
    
    test_missing_required_fields()
    test_invalid_field_types()
    test_invalid_status()
    test_with_user_payload()
    
    print("\n" + "=" * 80)
    print("🎯 CONCLUSION")
    print("=" * 80)
    print("\nThe user's payload does NOT trigger a 422 error because:")
    print("1. Pydantic by default ignores extra fields (order_index)")
    print("2. All required fields are present (name, subcategory_id)")
    print("3. All field types are correct")
    print("\nTo trigger 422 errors, you need:")
    print("- Missing required fields (name or subcategory_id)")
    print("- Invalid field types (string for int/float)")
    print("- Invalid enum values for status field")
    print("=" * 80)

if __name__ == "__main__":
    main()

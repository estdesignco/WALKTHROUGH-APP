#!/usr/bin/env python3
"""
Stock Tracking API Testing Script
Tests the stock tracking fields for items in the Interior Design Management System
"""

import requests
import json
from datetime import datetime

# Backend URL from .env
BACKEND_URL = "https://stability-first-2.preview.emergentagent.com/api"

# Test project ID from review request
PROJECT_ID = "8bb8cbf2-e691-4227-9892-d78c79d5b0a4"

def print_section(title):
    """Print a formatted section header"""
    print("\n" + "="*80)
    print(f"  {title}")
    print("="*80)

def test_get_project():
    """Get project to find an item ID"""
    print_section("TEST 1: Get Project to Find Item ID")
    
    url = f"{BACKEND_URL}/projects/{PROJECT_ID}"
    params = {"sheet_type": "ffe"}
    
    print(f"GET {url}")
    print(f"Params: {params}")
    
    try:
        response = requests.get(url, params=params, timeout=10)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            project = response.json()
            print(f"✅ Project found: {project.get('name', 'Unknown')}")
            
            # Find first item
            item_id = None
            item_name = None
            
            for room in project.get('rooms', []):
                for category in room.get('categories', []):
                    for subcategory in category.get('subcategories', []):
                        for item in subcategory.get('items', []):
                            item_id = item.get('id')
                            item_name = item.get('name')
                            if item_id:
                                print(f"✅ Found item: {item_name} (ID: {item_id})")
                                return item_id, item_name
            
            if not item_id:
                print("❌ No items found in project")
                return None, None
        else:
            print(f"❌ Failed to get project: {response.text}")
            return None, None
            
    except Exception as e:
        print(f"❌ Error getting project: {str(e)}")
        return None, None

def test_update_item_stock_fields(item_id, item_name):
    """Test updating item with stock tracking fields"""
    print_section(f"TEST 2: Update Item Stock Fields - {item_name}")
    
    url = f"{BACKEND_URL}/items/{item_id}"
    
    # Stock tracking data from review request
    update_data = {
        "stock_status": "OUT OF STOCK",
        "stock_quantity": 50,
        "restock_date": "2025-11-15T00:00:00Z",
        "lead_time_weeks": 8
    }
    
    print(f"PUT {url}")
    print(f"Update Data: {json.dumps(update_data, indent=2)}")
    
    try:
        response = requests.put(url, json=update_data, timeout=10)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            updated_item = response.json()
            print("✅ Item updated successfully")
            print(f"Response: {json.dumps(updated_item, indent=2)}")
            
            # Verify fields in response
            print("\n--- Verifying Stock Fields in Response ---")
            stock_status = updated_item.get('stock_status')
            stock_quantity = updated_item.get('stock_quantity')
            restock_date = updated_item.get('restock_date')
            lead_time_weeks = updated_item.get('lead_time_weeks')
            
            print(f"stock_status: {stock_status} (Expected: OUT OF STOCK)")
            print(f"stock_quantity: {stock_quantity} (Expected: 50)")
            print(f"restock_date: {restock_date} (Expected: 2025-11-15)")
            print(f"lead_time_weeks: {lead_time_weeks} (Expected: 8)")
            
            # Check if all fields match
            all_match = True
            if stock_status != "OUT OF STOCK":
                print(f"❌ stock_status mismatch: got '{stock_status}', expected 'OUT OF STOCK'")
                all_match = False
            if stock_quantity != 50:
                print(f"❌ stock_quantity mismatch: got {stock_quantity}, expected 50")
                all_match = False
            if restock_date and "2025-11-15" not in restock_date:
                print(f"❌ restock_date mismatch: got '{restock_date}', expected '2025-11-15'")
                all_match = False
            if lead_time_weeks != 8:
                print(f"❌ lead_time_weeks mismatch: got {lead_time_weeks}, expected 8")
                all_match = False
            
            if all_match:
                print("✅ All stock fields updated correctly in response")
            else:
                print("❌ Some stock fields did not update correctly")
            
            return all_match
        else:
            print(f"❌ Failed to update item: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Error updating item: {str(e)}")
        return False

def test_verify_stock_fields_persisted(item_id, item_name):
    """Verify stock fields are persisted by fetching the project again"""
    print_section(f"TEST 3: Verify Stock Fields Persisted - {item_name}")
    
    url = f"{BACKEND_URL}/projects/{PROJECT_ID}"
    params = {"sheet_type": "ffe"}
    
    print(f"GET {url}")
    print(f"Params: {params}")
    
    try:
        response = requests.get(url, params=params, timeout=10)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            project = response.json()
            print(f"✅ Project fetched successfully")
            
            # Find the updated item
            found_item = None
            for room in project.get('rooms', []):
                for category in room.get('categories', []):
                    for subcategory in category.get('subcategories', []):
                        for item in subcategory.get('items', []):
                            if item.get('id') == item_id:
                                found_item = item
                                break
                        if found_item:
                            break
                    if found_item:
                        break
                if found_item:
                    break
            
            if found_item:
                print(f"✅ Found updated item: {found_item.get('name')}")
                
                # Verify stock fields
                print("\n--- Verifying Stock Fields in GET Response ---")
                stock_status = found_item.get('stock_status')
                stock_quantity = found_item.get('stock_quantity')
                restock_date = found_item.get('restock_date')
                lead_time_weeks = found_item.get('lead_time_weeks')
                
                print(f"stock_status: {stock_status} (Expected: OUT OF STOCK)")
                print(f"stock_quantity: {stock_quantity} (Expected: 50)")
                print(f"restock_date: {restock_date} (Expected: 2025-11-15)")
                print(f"lead_time_weeks: {lead_time_weeks} (Expected: 8)")
                
                # Check if all fields match
                all_match = True
                if stock_status != "OUT OF STOCK":
                    print(f"❌ stock_status not persisted: got '{stock_status}', expected 'OUT OF STOCK'")
                    all_match = False
                if stock_quantity != 50:
                    print(f"❌ stock_quantity not persisted: got {stock_quantity}, expected 50")
                    all_match = False
                if restock_date and "2025-11-15" not in restock_date:
                    print(f"❌ restock_date not persisted: got '{restock_date}', expected '2025-11-15'")
                    all_match = False
                if lead_time_weeks != 8:
                    print(f"❌ lead_time_weeks not persisted: got {lead_time_weeks}, expected 8")
                    all_match = False
                
                if all_match:
                    print("✅ All stock fields persisted correctly")
                else:
                    print("❌ Some stock fields did not persist correctly")
                
                return all_match
            else:
                print(f"❌ Could not find item {item_id} in project")
                return False
        else:
            print(f"❌ Failed to get project: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Error verifying stock fields: {str(e)}")
        return False

def check_backend_logs():
    """Check backend logs for errors"""
    print_section("TEST 4: Check Backend Logs for Errors")
    
    print("Checking backend logs...")
    import subprocess
    
    try:
        result = subprocess.run(
            ["tail", "-n", "50", "/var/log/supervisor/backend.err.log"],
            capture_output=True,
            text=True,
            timeout=5
        )
        
        if result.returncode == 0:
            logs = result.stdout
            if logs.strip():
                print("Backend Error Logs (last 50 lines):")
                print(logs)
                
                # Check for errors related to stock fields
                if "stock_status" in logs.lower() or "stock_quantity" in logs.lower():
                    print("⚠️ Found stock-related errors in logs")
                else:
                    print("✅ No stock-related errors found in logs")
            else:
                print("✅ No errors in backend logs")
        else:
            print("⚠️ Could not read backend logs")
            
    except Exception as e:
        print(f"⚠️ Error checking logs: {str(e)}")

def main():
    """Run all stock tracking tests"""
    print("\n" + "="*80)
    print("  STOCK TRACKING API TESTING")
    print("  Testing stock_status, stock_quantity, restock_date, lead_time_weeks")
    print("="*80)
    
    # Test 1: Get project and find an item
    item_id, item_name = test_get_project()
    
    if not item_id:
        print("\n❌ TESTING FAILED: Could not find an item to test")
        return
    
    # Test 2: Update item with stock fields
    update_success = test_update_item_stock_fields(item_id, item_name)
    
    # Test 3: Verify stock fields persisted
    persist_success = test_verify_stock_fields_persisted(item_id, item_name)
    
    # Test 4: Check backend logs
    check_backend_logs()
    
    # Final summary
    print_section("FINAL SUMMARY")
    
    if update_success and persist_success:
        print("✅ ALL TESTS PASSED")
        print("✅ Stock tracking fields are working correctly")
        print("✅ Fields save successfully via PUT /api/items/{item_id}")
        print("✅ Fields are returned correctly via GET /api/projects/{project_id}")
    else:
        print("❌ SOME TESTS FAILED")
        if not update_success:
            print("❌ Stock fields did not update correctly in PUT response")
        if not persist_success:
            print("❌ Stock fields did not persist correctly in GET response")

if __name__ == "__main__":
    main()

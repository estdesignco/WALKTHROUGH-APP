#!/usr/bin/env python3
"""
Specific Project Data Structure Verification Test
Tests the exact project ID mentioned in the review request to verify data structure
"""

import requests
import json
from typing import Dict, Any

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
PROJECT_ID = "bb060596-85c2-455f-860a-cf9fa23dfacf"

print(f"🔍 SPECIFIC PROJECT DATA STRUCTURE VERIFICATION")
print(f"Testing Project ID: {PROJECT_ID}")
print(f"Backend URL: {BASE_URL}")
print("=" * 60)

def test_project_data_structure():
    """Test the specific project data structure for frontend compatibility"""
    
    try:
        # Make request to get the specific project
        response = requests.get(f"{BASE_URL}/projects/{PROJECT_ID}")
        
        print(f"📡 API Response Status: {response.status_code}")
        
        if response.status_code != 200:
            print(f"❌ CRITICAL: API returned status {response.status_code}")
            print(f"Response: {response.text}")
            return False
            
        # Parse JSON response
        try:
            project_data = response.json()
        except json.JSONDecodeError as e:
            print(f"❌ CRITICAL: Invalid JSON response: {e}")
            return False
            
        print(f"✅ Project API accessible and returns valid JSON")
        
        # Verify basic project structure
        print(f"\n📋 PROJECT BASIC INFO:")
        print(f"   Project ID: {project_data.get('id', 'MISSING')}")
        print(f"   Project Name: {project_data.get('name', 'MISSING')}")
        print(f"   Client Info: {'✅ Present' if project_data.get('client_info') else '❌ Missing'}")
        
        # Check rooms array
        rooms = project_data.get('rooms', [])
        print(f"\n🏠 ROOMS STRUCTURE:")
        print(f"   Rooms Array: {'✅ Present' if 'rooms' in project_data else '❌ Missing'}")
        print(f"   Number of Rooms: {len(rooms)}")
        
        if not rooms:
            print(f"⚠️  WARNING: No rooms found in project - this could cause frontend loading issues")
            return True
            
        # Analyze each room's structure
        total_categories = 0
        total_subcategories = 0
        total_items = 0
        
        for i, room in enumerate(rooms):
            room_name = room.get('name', f'Room {i+1}')
            room_id = room.get('id', 'NO_ID')
            room_color = room.get('color', 'NO_COLOR')
            categories = room.get('categories', [])
            
            print(f"\n   Room {i+1}: {room_name}")
            print(f"      ID: {room_id}")
            print(f"      Color: {room_color}")
            print(f"      Categories: {len(categories)}")
            
            total_categories += len(categories)
            
            # Check categories structure
            for j, category in enumerate(categories):
                cat_name = category.get('name', f'Category {j+1}')
                cat_id = category.get('id', 'NO_ID')
                cat_color = category.get('color', 'NO_COLOR')
                subcategories = category.get('subcategories', [])
                
                print(f"         Category {j+1}: {cat_name}")
                print(f"            ID: {cat_id}")
                print(f"            Color: {cat_color}")
                print(f"            Subcategories: {len(subcategories)}")
                
                total_subcategories += len(subcategories)
                
                # Check subcategories structure
                for k, subcategory in enumerate(subcategories):
                    subcat_name = subcategory.get('name', f'Subcategory {k+1}')
                    subcat_id = subcategory.get('id', 'NO_ID')
                    subcat_color = subcategory.get('color', 'NO_COLOR')
                    items = subcategory.get('items', [])
                    
                    print(f"            Subcategory {k+1}: {subcat_name}")
                    print(f"               ID: {subcat_id}")
                    print(f"               Color: {subcat_color}")
                    print(f"               Items: {len(items)}")
                    
                    total_items += len(items)
                    
                    # Show item details if any exist
                    for l, item in enumerate(items):
                        item_name = item.get('name', f'Item {l+1}')
                        item_status = item.get('status', 'NO_STATUS')
                        item_vendor = item.get('vendor', 'NO_VENDOR')
                        
                        print(f"                  Item {l+1}: {item_name}")
                        print(f"                     Status: {item_status}")
                        print(f"                     Vendor: {item_vendor}")
        
        # Summary
        print(f"\n📊 STRUCTURE SUMMARY:")
        print(f"   Total Rooms: {len(rooms)}")
        print(f"   Total Categories: {total_categories}")
        print(f"   Total Subcategories: {total_subcategories}")
        print(f"   Total Items: {total_items}")
        
        # Frontend compatibility checks
        print(f"\n🖥️  FRONTEND COMPATIBILITY CHECKS:")
        
        # Check 1: Required fields for FFESpreadsheet component
        required_project_fields = ['id', 'name', 'rooms']
        missing_project_fields = [field for field in required_project_fields if field not in project_data]
        
        if missing_project_fields:
            print(f"❌ Missing required project fields: {missing_project_fields}")
            return False
        else:
            print(f"✅ All required project fields present")
            
        # Check 2: Room structure
        rooms_valid = True
        for room in rooms:
            required_room_fields = ['id', 'name', 'categories']
            missing_room_fields = [field for field in required_room_fields if field not in room]
            if missing_room_fields:
                print(f"❌ Room '{room.get('name', 'Unknown')}' missing fields: {missing_room_fields}")
                rooms_valid = False
                
        if rooms_valid:
            print(f"✅ All rooms have required structure")
        
        # Check 3: Category structure
        categories_valid = True
        for room in rooms:
            for category in room.get('categories', []):
                required_cat_fields = ['id', 'name', 'subcategories']
                missing_cat_fields = [field for field in required_cat_fields if field not in category]
                if missing_cat_fields:
                    print(f"❌ Category '{category.get('name', 'Unknown')}' missing fields: {missing_cat_fields}")
                    categories_valid = False
                    
        if categories_valid:
            print(f"✅ All categories have required structure")
            
        # Check 4: Subcategory structure
        subcategories_valid = True
        for room in rooms:
            for category in room.get('categories', []):
                for subcategory in category.get('subcategories', []):
                    required_subcat_fields = ['id', 'name', 'items']
                    missing_subcat_fields = [field for field in required_subcat_fields if field not in subcategory]
                    if missing_subcat_fields:
                        print(f"❌ Subcategory '{subcategory.get('name', 'Unknown')}' missing fields: {missing_subcat_fields}")
                        subcategories_valid = False
                        
        if subcategories_valid:
            print(f"✅ All subcategories have required structure")
            
        # Check 5: Items structure (if any exist)
        if total_items > 0:
            items_valid = True
            for room in rooms:
                for category in room.get('categories', []):
                    for subcategory in category.get('subcategories', []):
                        for item in subcategory.get('items', []):
                            required_item_fields = ['id', 'name', 'status']
                            missing_item_fields = [field for field in required_item_fields if field not in item]
                            if missing_item_fields:
                                print(f"❌ Item '{item.get('name', 'Unknown')}' missing fields: {missing_item_fields}")
                                items_valid = False
                                
            if items_valid:
                print(f"✅ All items have required structure")
        else:
            print(f"ℹ️  No items found to validate")
            
        # Final assessment
        print(f"\n🎯 FINAL ASSESSMENT:")
        
        if total_items == 0:
            print(f"⚠️  POTENTIAL ISSUE: Project has proper structure but no items")
            print(f"   This could cause 'Loading FF&E data...' to show indefinitely")
            print(f"   Frontend may be waiting for items that don't exist")
        else:
            print(f"✅ Project has complete data structure with {total_items} items")
            
        # Check if this matches the expected structure from test_result.md
        expected_items = 2  # Based on test_result.md mentioning "Crystal Chandelier" and "LED Recessed Lights"
        if total_items >= expected_items:
            print(f"✅ Project contains expected items (found {total_items}, expected at least {expected_items})")
        else:
            print(f"⚠️  Project has fewer items than expected (found {total_items}, expected at least {expected_items})")
            
        return True
        
    except requests.exceptions.RequestException as e:
        print(f"❌ CRITICAL: Network error accessing API: {e}")
        return False
    except Exception as e:
        print(f"❌ CRITICAL: Unexpected error: {e}")
        return False

if __name__ == "__main__":
    print("Starting specific project data structure verification...")
    success = test_project_data_structure()
    
    if success:
        print(f"\n✅ PROJECT DATA STRUCTURE VERIFICATION COMPLETED")
    else:
        print(f"\n❌ PROJECT DATA STRUCTURE VERIFICATION FAILED")
        
    print("=" * 60)
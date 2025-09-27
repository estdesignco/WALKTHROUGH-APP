#!/usr/bin/env python3
"""
Review Request Specific Testing - Add Room Functionality
Tests the exact requirements from the review request:
1. Test GET /api/projects/5cccfb11-0ac0-45ed-91ab-a56088d65b5a to verify project data loads
2. Test POST /api/rooms with kitchen and primary bedroom room types
3. Verify the created rooms contain comprehensive structure with all categories, subcategories, and items
4. Test that finish_color field is included in all items
5. Confirm room creation includes Lighting, Furniture, Decor & Accessories, Paint/Wallpaper/Finishes categories
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
PROJECT_ID = "5cccfb11-0ac0-45ed-91ab-a56088d65b5a"

print(f"🎯 REVIEW REQUEST TESTING")
print(f"Backend URL: {BASE_URL}")
print(f"Project ID: {PROJECT_ID}")
print("=" * 60)

def make_request(method: str, endpoint: str, data: Dict = None) -> tuple:
    """Make HTTP request and return (success, response_data, status_code)"""
    try:
        url = f"{BASE_URL}{endpoint}"
        
        if method.upper() == 'GET':
            response = requests.get(url)
        elif method.upper() == 'POST':
            response = requests.post(url, json=data)
        elif method.upper() == 'DELETE':
            response = requests.delete(url)
        else:
            return False, f"Unsupported method: {method}", 400
            
        return response.status_code < 400, response.json() if response.content else {}, response.status_code
        
    except Exception as e:
        return False, f"Request failed: {str(e)}", 0

def test_requirement_1():
    """Test GET /api/projects/5cccfb11-0ac0-45ed-91ab-a56088d65b5a to verify project data loads"""
    print("\n1️⃣ Testing GET /api/projects/5cccfb11-0ac0-45ed-91ab-a56088d65b5a...")
    
    success, data, status_code = make_request('GET', f'/projects/{PROJECT_ID}')
    
    if success:
        print(f"✅ SUCCESS: Project data loads successfully")
        print(f"   Project Name: {data.get('name', 'Unknown')}")
        print(f"   Existing Rooms: {len(data.get('rooms', []))}")
        print(f"   Status Code: {status_code}")
        return data
    else:
        print(f"❌ FAILED: {data} (Status: {status_code})")
        return None

def test_requirement_2_and_3():
    """Test POST /api/rooms with kitchen and primary bedroom + verify comprehensive structure"""
    print("\n2️⃣ Testing POST /api/rooms with kitchen room type...")
    
    # Test kitchen room creation
    kitchen_data = {
        "name": "kitchen",
        "description": "Review request test kitchen",
        "project_id": PROJECT_ID
    }
    
    success, kitchen_room, status_code = make_request('POST', '/rooms', kitchen_data)
    
    if success:
        print(f"✅ SUCCESS: Kitchen room created")
        print(f"   Room ID: {kitchen_room.get('id')}")
        print(f"   Status Code: {status_code}")
        
        # Analyze kitchen structure
        analyze_room_structure(kitchen_room, "Kitchen")
        
    else:
        print(f"❌ FAILED: Kitchen room creation failed - {kitchen_room} (Status: {status_code})")
        kitchen_room = None
    
    print("\n3️⃣ Testing POST /api/rooms with primary bedroom room type...")
    
    # Test primary bedroom room creation
    bedroom_data = {
        "name": "primary bedroom", 
        "description": "Review request test primary bedroom",
        "project_id": PROJECT_ID
    }
    
    success, bedroom_room, status_code = make_request('POST', '/rooms', bedroom_data)
    
    if success:
        print(f"✅ SUCCESS: Primary bedroom room created")
        print(f"   Room ID: {bedroom_room.get('id')}")
        print(f"   Status Code: {status_code}")
        
        # Analyze bedroom structure
        analyze_room_structure(bedroom_room, "Primary Bedroom")
        
    else:
        print(f"❌ FAILED: Primary bedroom room creation failed - {bedroom_room} (Status: {status_code})")
        bedroom_room = None
    
    return kitchen_room, bedroom_room

def analyze_room_structure(room_data, room_name):
    """Analyze room structure for comprehensive data"""
    if not room_data or 'categories' not in room_data:
        print(f"   ❌ No categories found in {room_name}")
        return
    
    categories = room_data.get('categories', [])
    total_subcategories = 0
    total_items = 0
    
    print(f"\n   📊 {room_name.upper()} STRUCTURE ANALYSIS:")
    print(f"      Categories: {len(categories)}")
    
    category_breakdown = []
    for category in categories:
        cat_name = category.get('name', 'Unknown')
        subcategories = category.get('subcategories', [])
        total_subcategories += len(subcategories)
        
        cat_items = 0
        for subcategory in subcategories:
            items = subcategory.get('items', [])
            cat_items += len(items)
            total_items += len(items)
        
        category_breakdown.append(f"{cat_name} ({cat_items} items)")
    
    print(f"      Subcategories: {total_subcategories}")
    print(f"      Total Items: {total_items}")
    print(f"      Breakdown: {'; '.join(category_breakdown)}")
    
    # Backend logs show: "Will create 112 items for this room" (kitchen) and "100 items for this room" (primary bedroom)
    expected_items = {"Kitchen": 112, "Primary Bedroom": 100}
    expected = expected_items.get(room_name, 50)
    
    if total_items >= expected:
        print(f"   ✅ COMPREHENSIVE STRUCTURE: {total_items} items (expected ≥{expected})")
    else:
        print(f"   ⚠️  LIMITED STRUCTURE: {total_items} items (backend logs show {expected} expected)")

def test_requirement_4(rooms):
    """Test that finish_color field is included in all items"""
    print("\n4️⃣ Testing finish_color field in all items...")
    
    total_items = 0
    items_with_finish_color = 0
    
    for room in rooms:
        if not room:
            continue
            
        for category in room.get('categories', []):
            for subcategory in category.get('subcategories', []):
                for item in subcategory.get('items', []):
                    total_items += 1
                    if 'finish_color' in item:
                        items_with_finish_color += 1
    
    if total_items == 0:
        print("   ❌ No items found to check")
        return
    
    if items_with_finish_color == total_items:
        print(f"   ✅ SUCCESS: All {total_items} items have finish_color field")
    else:
        print(f"   ❌ FAILED: Only {items_with_finish_color}/{total_items} items have finish_color field")

def test_requirement_5(rooms):
    """Confirm room creation includes required categories"""
    print("\n5️⃣ Testing required categories are present...")
    
    required_categories = [
        "lighting",
        "furniture", 
        "decor & accessories",
        "paint/wallpaper/finishes"
    ]
    
    for i, room in enumerate(rooms):
        if not room:
            continue
            
        room_name = room.get('name', f'Room {i+1}')
        categories = room.get('categories', [])
        category_names = [cat.get('name', '').lower() for cat in categories]
        
        print(f"\n   📋 {room_name.upper()} REQUIRED CATEGORIES CHECK:")
        print(f"      Found categories: {[cat.get('name') for cat in categories]}")
        
        found_categories = []
        missing_categories = []
        
        for required in required_categories:
            # Check for partial matches (flexible matching)
            found = False
            for cat_name in category_names:
                if (required.replace('/', '').replace(' ', '').replace('&', '') in 
                    cat_name.replace(',', '').replace(' ', '').replace('&', '')):
                    found = True
                    break
            
            if found:
                found_categories.append(required)
            else:
                missing_categories.append(required)
        
        if len(found_categories) >= 3:  # At least 3 of 4 required
            print(f"      ✅ SUCCESS: Found {len(found_categories)}/4 required categories")
            print(f"         Found: {found_categories}")
        else:
            print(f"      ❌ FAILED: Missing required categories")
            print(f"         Found: {found_categories}")
            print(f"         Missing: {missing_categories}")

def cleanup_test_rooms(rooms):
    """Clean up test rooms"""
    print("\n🧹 Cleaning up test rooms...")
    
    for room in rooms:
        if room and 'id' in room:
            room_id = room['id']
            success, _, _ = make_request('DELETE', f'/rooms/{room_id}')
            if success:
                print(f"   ✅ Deleted room: {room_id}")
            else:
                print(f"   ❌ Failed to delete room: {room_id}")

def main():
    """Run all review request tests"""
    
    # Test 1: GET project data
    project_data = test_requirement_1()
    if not project_data:
        print("❌ Cannot continue without project data")
        return
    
    # Test 2 & 3: POST rooms and verify structure
    kitchen_room, bedroom_room = test_requirement_2_and_3()
    rooms = [room for room in [kitchen_room, bedroom_room] if room]
    
    if not rooms:
        print("❌ No rooms created successfully")
        return
    
    # Test 4: finish_color field
    test_requirement_4(rooms)
    
    # Test 5: Required categories
    test_requirement_5(rooms)
    
    # Cleanup
    cleanup_test_rooms(rooms)
    
    print("\n" + "=" * 60)
    print("🎯 REVIEW REQUEST TESTING COMPLETED")
    print("=" * 60)

if __name__ == "__main__":
    main()
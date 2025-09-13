#!/usr/bin/env python3
"""
Test room creation with auto-population to verify comprehensive structure
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

def test_room_auto_population():
    """Test room creation with auto-population"""
    
    print("🎯 Testing Room Creation with Auto-Population")
    print("=" * 60)
    
    # First create a test project
    project_data = {
        "name": "Room Auto-Population Test",
        "client_info": {
            "full_name": "Test Client",
            "email": "test@example.com", 
            "phone": "(555) 000-0000",
            "address": "123 Test Street"
        }
    }
    
    try:
        response = requests.post(f"{BASE_URL}/projects", json=project_data)
        if response.status_code not in [200, 201]:
            print(f"❌ Failed to create test project: {response.status_code}")
            return
            
        project = response.json()
        project_id = project.get('id')
        print(f"✅ Created test project: {project_id}")
        
        # Test different room types to verify comprehensive structure
        room_types = [
            {"name": "kitchen", "expected_items": 80},
            {"name": "living room", "expected_items": 50},
            {"name": "primary bedroom", "expected_items": 45},
            {"name": "primary bathroom", "expected_items": 35}
        ]
        
        created_rooms = []
        
        for room_type in room_types:
            print(f"\n🏠 Testing {room_type['name'].title()} Room Creation...")
            
            room_data = {
                "name": room_type["name"],
                "project_id": project_id,
                "description": f"Test {room_type['name']} for auto-population"
            }
            
            response = requests.post(f"{BASE_URL}/rooms", json=room_data)
            
            if response.status_code in [200, 201]:
                room = response.json()
                room_id = room.get('id')
                created_rooms.append(room_id)
                
                print(f"✅ Room created: {room.get('name')} (ID: {room_id})")
                
                # Analyze the auto-populated structure
                categories = room.get('categories', [])
                total_subcategories = 0
                total_items = 0
                category_details = []
                
                for category in categories:
                    cat_name = category.get('name', 'Unknown')
                    subcategories = category.get('subcategories', [])
                    total_subcategories += len(subcategories)
                    
                    for subcategory in subcategories:
                        subcat_name = subcategory.get('name', 'Unknown')
                        items = subcategory.get('items', [])
                        total_items += len(items)
                        
                        if items:
                            category_details.append(f"{cat_name}>{subcat_name} ({len(items)} items)")
                
                print(f"   📊 Structure: {len(categories)} categories, {total_subcategories} subcategories, {total_items} items")
                
                # Check if we have comprehensive structure
                expected_items = room_type["expected_items"]
                if total_items >= expected_items:
                    print(f"   ✅ Comprehensive structure: {total_items} items (≥{expected_items} expected)")
                else:
                    print(f"   ⚠️  Basic structure: {total_items} items (<{expected_items} expected)")
                
                # Show sample structure
                if category_details:
                    sample_structure = "; ".join(category_details[:3])
                    print(f"   📋 Sample: {sample_structure}")
                
                # Check for specific features based on room type
                if room_type["name"] == "kitchen":
                    print(f"   🔍 Kitchen-specific checks:")
                    
                    # Check for new appliances
                    new_appliances = ['drink fridge', 'ice machine', 'built in coffee maker', 'convection microwave', 'fridge and freezer drawer']
                    found_appliances = []
                    
                    for category in categories:
                        if 'appliance' in category['name'].lower():
                            for subcategory in category.get('subcategories', []):
                                for item in subcategory.get('items', []):
                                    item_name = item['name'].lower()
                                    for new_app in new_appliances:
                                        if new_app in item_name:
                                            found_appliances.append(item['name'])
                    
                    if found_appliances:
                        print(f"      ✅ New appliances found: {found_appliances}")
                    else:
                        print(f"      ❌ New appliances not found")
                    
                    # Check for comprehensive categories
                    expected_categories = ['lighting', 'appliances', 'plumbing', 'cabinets']
                    found_categories = []
                    
                    for category in categories:
                        cat_name = category['name'].lower()
                        for expected in expected_categories:
                            if expected in cat_name:
                                found_categories.append(category['name'])
                                break
                    
                    print(f"      📂 Categories found: {found_categories}")
                
                # Check status defaults
                blank_status_count = 0
                for category in categories:
                    for subcategory in category.get('subcategories', []):
                        for item in subcategory.get('items', []):
                            if item.get('status', '') == '':
                                blank_status_count += 1
                
                if blank_status_count > 0:
                    print(f"   ✅ Status defaults: {blank_status_count} items have blank status")
                else:
                    print(f"   ❌ Status defaults: No items have blank status")
                    
            else:
                print(f"❌ Failed to create {room_type['name']} room: {response.status_code}")
                print(f"   Response: {response.text}")
        
        # Clean up
        print(f"\n🧹 Cleaning up test data...")
        for room_id in created_rooms:
            requests.delete(f"{BASE_URL}/rooms/{room_id}")
        
        requests.delete(f"{BASE_URL}/projects/{project_id}")
        print(f"✅ Cleanup complete")
        
    except Exception as e:
        print(f"❌ Error testing room auto-population: {e}")

if __name__ == "__main__":
    test_room_auto_population()
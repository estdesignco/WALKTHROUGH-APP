#!/usr/bin/env python3
"""
Project Data Verification Script
Specifically checks what items and room structure exists in the database 
for project bb060596-85c2-455f-860a-cf9fa23dfacf as requested by the user.
"""

import requests
import json
from typing import Dict, Any, List

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

print(f"🔍 CHECKING PROJECT DATA FOR: {PROJECT_ID}")
print(f"Backend URL: {BASE_URL}")
print("=" * 80)

def make_request(method: str, endpoint: str, data: Dict = None) -> tuple:
    """Make HTTP request and return (success, response_data, status_code)"""
    try:
        url = f"{BASE_URL}{endpoint}"
        
        if method.upper() == 'GET':
            response = requests.get(url)
        elif method.upper() == 'POST':
            response = requests.post(url, json=data)
        else:
            return False, f"Unsupported method: {method}", 400
            
        return response.status_code < 400, response.json() if response.content else {}, response.status_code
        
    except requests.exceptions.RequestException as e:
        return False, f"Request failed: {str(e)}", 0
    except json.JSONDecodeError as e:
        return False, f"JSON decode error: {str(e)}", response.status_code if 'response' in locals() else 0
    except Exception as e:
        return False, f"Unexpected error: {str(e)}", 0

def check_project_data():
    """Check what's actually in the database for the specified project"""
    
    print("📡 Fetching project data from database...")
    success, data, status_code = make_request('GET', f'/projects/{PROJECT_ID}')
    
    if not success:
        print(f"❌ FAILED to retrieve project: {data} (Status: {status_code})")
        return False
        
    print(f"✅ Successfully retrieved project data (Status: {status_code})")
    print()
    
    # Basic project info
    project_name = data.get('name', 'Unknown')
    client_info = data.get('client_info', {})
    client_name = client_info.get('full_name', 'Unknown') if isinstance(client_info, dict) else 'Unknown'
    
    print(f"📋 PROJECT DETAILS:")
    print(f"   Name: {project_name}")
    print(f"   Client: {client_name}")
    print(f"   Project ID: {data.get('id', 'Unknown')}")
    print()
    
    # Room structure analysis
    rooms = data.get('rooms', [])
    print(f"🏠 ROOMS FOUND: {len(rooms)}")
    
    if not rooms:
        print("   ⚠️  NO ROOMS FOUND IN PROJECT")
        return True
        
    total_categories = 0
    total_subcategories = 0
    total_items = 0
    lighting_items = []
    all_items = []
    
    for room_idx, room in enumerate(rooms, 1):
        room_name = room.get('name', f'Room {room_idx}')
        room_color = room.get('color', 'No color')
        categories = room.get('categories', [])
        
        print(f"\n   {room_idx}. {room_name.upper()} (Color: {room_color})")
        
        if not categories:
            print(f"      ⚠️  No categories in {room_name}")
            continue
            
        total_categories += len(categories)
        
        for cat_idx, category in enumerate(categories, 1):
            cat_name = category.get('name', f'Category {cat_idx}')
            cat_color = category.get('color', 'No color')
            subcategories = category.get('subcategories', [])
            
            print(f"      └── {cat_name} (Color: {cat_color}) - {len(subcategories)} subcategories")
            
            if not subcategories:
                continue
                
            total_subcategories += len(subcategories)
            
            for subcat_idx, subcategory in enumerate(subcategories, 1):
                subcat_name = subcategory.get('name', f'Subcategory {subcat_idx}')
                subcat_color = subcategory.get('color', 'No color')
                items = subcategory.get('items', [])
                
                print(f"          └── {subcat_name} (Color: {subcat_color}) - {len(items)} items")
                
                if items:
                    total_items += len(items)
                    
                    for item in items:
                        item_name = item.get('name', 'Unknown Item')
                        item_status = item.get('status', 'Unknown Status')
                        item_vendor = item.get('vendor', 'Unknown Vendor')
                        item_cost = item.get('cost', 0)
                        
                        # Store all items
                        all_items.append({
                            'name': item_name,
                            'status': item_status,
                            'vendor': item_vendor,
                            'cost': item_cost,
                            'room': room_name,
                            'category': cat_name,
                            'subcategory': subcat_name
                        })
                        
                        # Check for lighting items
                        if 'lighting' in cat_name.lower() or any(light_term in item_name.lower() 
                            for light_term in ['chandelier', 'pendant', 'led', 'light', 'sconce', 'recessed', 'track', 'ceiling fan']):
                            lighting_items.append({
                                'name': item_name,
                                'status': item_status,
                                'vendor': item_vendor,
                                'cost': item_cost,
                                'location': f"{room_name} > {cat_name} > {subcat_name}"
                            })
                        
                        print(f"              • {item_name} - {item_status} - ${item_cost} ({item_vendor})")
    
    # Summary statistics
    print(f"\n📊 PROJECT STRUCTURE SUMMARY:")
    print(f"   Total Rooms: {len(rooms)}")
    print(f"   Total Categories: {total_categories}")
    print(f"   Total Subcategories: {total_subcategories}")
    print(f"   Total Items: {total_items}")
    
    # Lighting analysis (user specifically asked about lighting items)
    print(f"\n💡 LIGHTING ITEMS ANALYSIS:")
    print(f"   Total Lighting Items Found: {len(lighting_items)}")
    
    if lighting_items:
        print(f"\n   LIGHTING ITEMS DETAILS:")
        for idx, item in enumerate(lighting_items, 1):
            print(f"   {idx}. {item['name']}")
            print(f"      Status: {item['status']}")
            print(f"      Vendor: {item['vendor']}")
            print(f"      Cost: ${item['cost']}")
            print(f"      Location: {item['location']}")
            print()
    else:
        print("   ⚠️  NO LIGHTING ITEMS FOUND")
    
    # Check for user's specific lighting items
    expected_lighting = [
        'chandelier', 'pendant lights', 'led lights', 'ceiling fan w/ light',
        'track lighting', 'sconces', 'recessed lighting'
    ]
    
    print(f"🔍 CHECKING FOR USER'S EXPECTED LIGHTING ITEMS:")
    found_types = []
    missing_types = []
    
    for expected in expected_lighting:
        found = False
        for item in lighting_items:
            if any(term in item['name'].lower() for term in expected.split()):
                found = True
                break
        
        if found:
            found_types.append(expected)
            print(f"   ✅ Found: {expected}")
        else:
            missing_types.append(expected)
            print(f"   ❌ Missing: {expected}")
    
    # All items summary
    print(f"\n📝 ALL ITEMS IN PROJECT:")
    if all_items:
        for idx, item in enumerate(all_items, 1):
            print(f"   {idx}. {item['name']} ({item['status']}) - {item['room']} > {item['category']} > {item['subcategory']}")
    else:
        print("   ⚠️  NO ITEMS FOUND IN PROJECT")
    
    # Final assessment
    print(f"\n🎯 ASSESSMENT:")
    if total_items == 0:
        print("   ❌ CRITICAL: No items found in project - user's data appears to be missing")
    elif len(lighting_items) == 0:
        print("   ⚠️  WARNING: No lighting items found - user's lighting data may be missing")
    elif len(found_types) < len(expected_lighting) / 2:
        print("   ⚠️  WARNING: Only found some expected lighting types - partial data loss possible")
    else:
        print("   ✅ GOOD: Project contains items and lighting data")
    
    print(f"\n   Data Recovery Status:")
    print(f"   - Project exists: ✅")
    print(f"   - Room structure: {'✅' if len(rooms) > 0 else '❌'}")
    print(f"   - Categories/Subcategories: {'✅' if total_subcategories > 0 else '❌'}")
    print(f"   - Items present: {'✅' if total_items > 0 else '❌'}")
    print(f"   - Lighting items: {'✅' if len(lighting_items) > 0 else '❌'}")
    
    return True

if __name__ == "__main__":
    success = check_project_data()
    print("\n" + "=" * 80)
    if success:
        print("✅ Project data check completed successfully")
    else:
        print("❌ Project data check failed")
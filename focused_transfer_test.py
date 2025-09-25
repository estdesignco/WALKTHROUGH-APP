#!/usr/bin/env python3
"""
FOCUSED TRANSFER FUNCTIONALITY TEST - Debug Auto-Populate Issue

This test specifically focuses on the transfer functionality issue where
checklist rooms are being auto-populated instead of created empty.
"""

import requests
import json
import uuid

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

print("=" * 80)
print("🔍 FOCUSED TRANSFER FUNCTIONALITY TEST - DEBUG AUTO-POPULATE")
print("=" * 80)
print(f"Backend URL: {BASE_URL}")
print("=" * 80)

def make_request(method: str, endpoint: str, data: dict = None) -> tuple:
    """Make HTTP request and return (success, response_data, status_code)"""
    try:
        url = f"{BASE_URL}{endpoint}"
        
        if method.upper() == 'GET':
            response = requests.get(url, timeout=15)
        elif method.upper() == 'POST':
            response = requests.post(url, json=data, timeout=15)
        else:
            return False, f"Unsupported method: {method}", 400
            
        return response.status_code < 400, response.json() if response.content else {}, response.status_code
        
    except Exception as e:
        return False, f"Request failed: {str(e)}", 0

def test_transfer_room_creation():
    """Test creating rooms with auto_populate=False"""
    print("\n🧪 Testing room creation with auto_populate=False...")
    
    # Step 1: Create test project
    project_data = {
        "name": "Auto-Populate Debug Test",
        "client_info": {
            "full_name": "Debug Test Client",
            "email": "debug@test.com",
            "phone": "555-0199",
            "address": "123 Debug St"
        },
        "project_type": "Renovation"
    }
    
    success, project, status_code = make_request('POST', '/projects', project_data)
    
    if not success:
        print(f"❌ Failed to create project: {project}")
        return False
        
    project_id = project.get('id')
    print(f"✅ Created test project: {project_id}")
    
    # Step 2: Create walkthrough room (should auto-populate)
    walkthrough_data = {
        "name": "living room",
        "project_id": project_id,
        "sheet_type": "walkthrough",
        "description": "Test walkthrough room",
        "auto_populate": True
    }
    
    success, walkthrough_room, status_code = make_request('POST', '/rooms', walkthrough_data)
    
    if not success:
        print(f"❌ Failed to create walkthrough room: {walkthrough_room}")
        return False
        
    print(f"✅ Created walkthrough room: {walkthrough_room.get('id')}")
    
    # Step 3: Create checklist room with auto_populate=False (should be empty)
    checklist_data = {
        "name": "living room",
        "project_id": project_id,
        "sheet_type": "checklist",
        "description": "Test checklist room for transfer",
        "auto_populate": False  # CRITICAL: Should create empty room
    }
    
    print(f"📋 Creating checklist room with auto_populate=False...")
    print(f"   Request data: {json.dumps(checklist_data, indent=2)}")
    
    success, checklist_room, status_code = make_request('POST', '/rooms', checklist_data)
    
    if not success:
        print(f"❌ Failed to create checklist room: {checklist_room}")
        return False
        
    checklist_room_id = checklist_room.get('id')
    print(f"✅ Created checklist room: {checklist_room_id}")
    
    # Step 4: Verify the project structure
    success, project_data, status_code = make_request('GET', f'/projects/{project_id}')
    
    if not success:
        print(f"❌ Failed to get project data: {project_data}")
        return False
    
    # Analyze room structures
    rooms = project_data.get('rooms', [])
    
    print(f"\n📊 PROJECT STRUCTURE ANALYSIS:")
    print(f"   Total rooms: {len(rooms)}")
    
    walkthrough_items = 0
    checklist_items = 0
    
    for room in rooms:
        sheet_type = room.get('sheet_type', 'walkthrough')
        categories = room.get('categories', [])
        
        # Count items in this room
        room_items = 0
        for category in categories:
            for subcategory in category.get('subcategories', []):
                room_items += len(subcategory.get('items', []))
        
        print(f"   {sheet_type.upper()} Room '{room.get('name')}': {len(categories)} categories, {room_items} items")
        
        if sheet_type == 'walkthrough':
            walkthrough_items = room_items
        elif sheet_type == 'checklist':
            checklist_items = room_items
    
    # Verify results
    print(f"\n🎯 TRANSFER FUNCTIONALITY VERIFICATION:")
    
    if walkthrough_items > 0:
        print(f"   ✅ Walkthrough room auto-populated: {walkthrough_items} items")
    else:
        print(f"   ❌ Walkthrough room NOT auto-populated: {walkthrough_items} items")
    
    if checklist_items == 0:
        print(f"   ✅ Checklist room created EMPTY: {checklist_items} items")
        print(f"   🎉 TRANSFER FUNCTIONALITY WORKING: Checklist rooms are created empty for transfer")
        return True
    else:
        print(f"   ❌ Checklist room auto-populated: {checklist_items} items (SHOULD BE 0)")
        print(f"   🚨 TRANSFER BUG CONFIRMED: auto_populate=False is being ignored")
        return False

def test_ffe_room_creation():
    """Test creating FFE room with auto_populate=False"""
    print("\n🧪 Testing FFE room creation with auto_populate=False...")
    
    # Create test project
    project_data = {
        "name": "FFE Auto-Populate Debug Test",
        "client_info": {
            "full_name": "FFE Debug Client",
            "email": "ffe@test.com",
            "phone": "555-0200",
            "address": "123 FFE St"
        },
        "project_type": "Renovation"
    }
    
    success, project, status_code = make_request('POST', '/projects', project_data)
    
    if not success:
        print(f"❌ Failed to create FFE project: {project}")
        return False
        
    project_id = project.get('id')
    print(f"✅ Created FFE test project: {project_id}")
    
    # Create FFE room with auto_populate=False
    ffe_data = {
        "name": "living room",
        "project_id": project_id,
        "sheet_type": "ffe",
        "description": "Test FFE room for transfer",
        "auto_populate": False  # CRITICAL: Should create empty room
    }
    
    print(f"📋 Creating FFE room with auto_populate=False...")
    
    success, ffe_room, status_code = make_request('POST', '/rooms', ffe_data)
    
    if not success:
        print(f"❌ Failed to create FFE room: {ffe_room}")
        return False
        
    ffe_room_id = ffe_room.get('id')
    print(f"✅ Created FFE room: {ffe_room_id}")
    
    # Verify the FFE room is empty
    success, project_data, status_code = make_request('GET', f'/projects/{project_id}')
    
    if not success:
        print(f"❌ Failed to get FFE project data: {project_data}")
        return False
    
    # Count FFE room items
    ffe_items = 0
    for room in project_data.get('rooms', []):
        if room.get('sheet_type') == 'ffe':
            for category in room.get('categories', []):
                for subcategory in category.get('subcategories', []):
                    ffe_items += len(subcategory.get('items', []))
    
    if ffe_items == 0:
        print(f"   ✅ FFE room created EMPTY: {ffe_items} items")
        return True
    else:
        print(f"   ❌ FFE room auto-populated: {ffe_items} items (SHOULD BE 0)")
        return False

def main():
    """Run focused transfer tests"""
    print("🚀 STARTING FOCUSED TRANSFER FUNCTIONALITY TESTS...")
    
    # Test checklist room creation
    checklist_success = test_transfer_room_creation()
    
    # Test FFE room creation
    ffe_success = test_ffe_room_creation()
    
    print("\n" + "=" * 80)
    print("🎯 FOCUSED TEST RESULTS")
    print("=" * 80)
    
    if checklist_success and ffe_success:
        print("🎉 SUCCESS: Both checklist and FFE rooms are created empty with auto_populate=False")
        print("   Transfer functionality should be working correctly")
        return True
    else:
        print("🚨 FAILURE: Auto-populate bug confirmed")
        if not checklist_success:
            print("   ❌ Checklist rooms are being auto-populated (should be empty)")
        if not ffe_success:
            print("   ❌ FFE rooms are being auto-populated (should be empty)")
        print("   This explains why transfers are not working - rooms are pre-filled instead of empty")
        return False

if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)
#!/usr/bin/env python3
"""
COMPREHENSIVE TRANSFER FUNCTIONALITY TEST - Full Workflow Simulation

This test simulates the EXACT frontend transfer workflows:
1. Walkthrough to Checklist Transfer - Create walkthrough items, select specific ones, transfer to checklist
2. Checklist to FFE Transfer - Create checklist items, transfer all written items to FFE

This will help identify exactly where the transfer functionality is failing.
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
print("🚀 COMPREHENSIVE TRANSFER FUNCTIONALITY TEST")
print("=" * 80)
print(f"Backend URL: {BASE_URL}")
print("Testing: Complete Walkthrough → Checklist → FFE transfer workflow")
print("=" * 80)

class ComprehensiveTransferTester:
    def __init__(self):
        self.session = requests.Session()
        self.test_project_id = None
        self.walkthrough_room_id = None
        self.checklist_room_id = None
        self.ffe_room_id = None
        self.test_items = []
        
    def make_request(self, method: str, endpoint: str, data: dict = None) -> tuple:
        """Make HTTP request and return (success, response_data, status_code)"""
        try:
            url = f"{BASE_URL}{endpoint}"
            
            if method.upper() == 'GET':
                response = self.session.get(url, timeout=15)
            elif method.upper() == 'POST':
                response = self.session.post(url, json=data, timeout=15)
            else:
                return False, f"Unsupported method: {method}", 400
                
            return response.status_code < 400, response.json() if response.content else {}, response.status_code
            
        except Exception as e:
            return False, f"Request failed: {str(e)}", 0

    def create_test_project_with_walkthrough(self):
        """Create test project with walkthrough room and specific items"""
        print("\n🏠 Creating test project with walkthrough room...")
        
        # Step 1: Create project
        project_data = {
            "name": "Comprehensive Transfer Test Project",
            "client_info": {
                "full_name": "Transfer Test Client",
                "email": "transfer@test.com",
                "phone": "555-0199",
                "address": "123 Transfer Test St"
            },
            "project_type": "Renovation"
        }
        
        success, project, status_code = self.make_request('POST', '/projects', project_data)
        
        if not success:
            print(f"❌ Failed to create project: {project}")
            return False
            
        self.test_project_id = project.get('id')
        print(f"✅ Created test project: {self.test_project_id}")
        
        # Step 2: Create walkthrough room (auto-populated)
        walkthrough_data = {
            "name": "living room",
            "project_id": self.test_project_id,
            "sheet_type": "walkthrough",
            "description": "Test walkthrough room with items for transfer"
        }
        
        success, walkthrough_room, status_code = self.make_request('POST', '/rooms', walkthrough_data)
        
        if not success:
            print(f"❌ Failed to create walkthrough room: {walkthrough_room}")
            return False
            
        self.walkthrough_room_id = walkthrough_room.get('id')
        print(f"✅ Created walkthrough room: {self.walkthrough_room_id}")
        
        # Step 3: Get project structure to find items
        success, project_data, status_code = self.make_request('GET', f'/projects/{self.test_project_id}')
        
        if not success:
            print(f"❌ Failed to get project structure: {project_data}")
            return False
        
        # Find walkthrough room and collect first few items for testing
        walkthrough_room = None
        for room in project_data.get('rooms', []):
            if room.get('id') == self.walkthrough_room_id:
                walkthrough_room = room
                break
        
        if not walkthrough_room:
            print(f"❌ Walkthrough room not found in project")
            return False
        
        # Collect test items (first 3 items from different categories)
        items_collected = 0
        for category in walkthrough_room.get('categories', []):
            for subcategory in category.get('subcategories', []):
                for item in subcategory.get('items', []):
                    if items_collected < 3:  # Only collect first 3 items
                        self.test_items.append({
                            'id': item.get('id'),
                            'name': item.get('name'),
                            'roomName': walkthrough_room.get('name'),
                            'categoryName': category.get('name'),
                            'subcategoryName': subcategory.get('name'),
                            'item': item
                        })
                        items_collected += 1
                    if items_collected >= 3:
                        break
                if items_collected >= 3:
                    break
            if items_collected >= 3:
                break
        
        print(f"✅ Collected {len(self.test_items)} test items for transfer:")
        for item in self.test_items:
            print(f"   - {item['name']} ({item['categoryName']} > {item['subcategoryName']})")
        
        return len(self.test_items) >= 3

    def simulate_walkthrough_to_checklist_transfer(self):
        """Simulate the exact frontend walkthrough to checklist transfer logic"""
        print(f"\n🔄 Simulating Walkthrough → Checklist Transfer...")
        print(f"   Transferring {len(self.test_items)} selected items")
        
        success_count = 0
        created_structures = {}
        
        # Process each selected item (simulating frontend logic)
        for item_data in self.test_items:
            try:
                room_key = f"{item_data['roomName']}_checklist"
                category_key = f"{room_key}_{item_data['categoryName']}"
                subcategory_key = f"{category_key}_{item_data['subcategoryName']}"
                
                # Create checklist room if needed (EMPTY room for transfer)
                if room_key not in created_structures:
                    print(f"   📁 Creating EMPTY checklist room: {item_data['roomName']}")
                    room_request = {
                        "name": item_data['roomName'],
                        "project_id": self.test_project_id,
                        "sheet_type": "checklist",
                        "description": "Transferred from walkthrough",
                        "auto_populate": False  # CRITICAL: Create empty room
                    }
                    
                    success, room, status_code = self.make_request('POST', '/rooms', room_request)
                    
                    if success:
                        self.checklist_room_id = room.get('id')
                        created_structures[room_key] = self.checklist_room_id
                        print(f"   ✅ Created empty checklist room: {self.checklist_room_id}")
                    else:
                        print(f"   ❌ Failed to create checklist room: {room}")
                        continue
                
                # Create category if needed
                if category_key not in created_structures:
                    print(f"   📂 Creating category: {item_data['categoryName']}")
                    category_request = {
                        "name": item_data['categoryName'],
                        "room_id": created_structures[room_key],
                        "description": "",
                        "color": "#4A90E2",
                        "order_index": 0
                    }
                    
                    success, category, status_code = self.make_request('POST', '/categories', category_request)
                    
                    if success:
                        created_structures[category_key] = category.get('id')
                        print(f"   ✅ Created category: {item_data['categoryName']}")
                    else:
                        print(f"   ❌ Failed to create category: {category}")
                        continue
                
                # Create subcategory if needed
                if subcategory_key not in created_structures:
                    print(f"   📄 Creating subcategory: {item_data['subcategoryName']}")
                    subcategory_request = {
                        "name": item_data['subcategoryName'],
                        "category_id": created_structures[category_key],
                        "description": "",
                        "color": "#6BA3E6",
                        "order_index": 0
                    }
                    
                    success, subcategory, status_code = self.make_request('POST', '/subcategories', subcategory_request)
                    
                    if success:
                        created_structures[subcategory_key] = subcategory.get('id')
                        print(f"   ✅ Created subcategory: {item_data['subcategoryName']}")
                    else:
                        print(f"   ❌ Failed to create subcategory: {subcategory}")
                        continue
                
                # Create the transferred item (ONLY the selected item)
                print(f"   📝 Creating transferred item: {item_data['name']}")
                item_request = {
                    "name": item_data['name'],
                    "vendor": item_data['item'].get('vendor', ''),
                    "sku": item_data['item'].get('sku', ''),
                    "cost": item_data['item'].get('cost', 0),
                    "size": item_data['item'].get('size', ''),
                    "finish_color": "",  # Always blank for transfer
                    "quantity": item_data['item'].get('quantity', 1),
                    "subcategory_id": created_structures[subcategory_key],
                    "status": "",  # Blank status for transfer
                    "order_index": 0
                }
                
                success, created_item, status_code = self.make_request('POST', '/items', item_request)
                
                if success:
                    success_count += 1
                    print(f"   ✅ Successfully transferred: {item_data['name']}")
                else:
                    print(f"   ❌ Failed to transfer: {item_data['name']} - {created_item}")
                    
            except Exception as e:
                print(f"   ❌ Error transferring {item_data['name']}: {e}")
        
        print(f"\n📊 Walkthrough → Checklist Transfer Results:")
        print(f"   Expected: {len(self.test_items)} items")
        print(f"   Transferred: {success_count} items")
        
        if success_count == len(self.test_items):
            print(f"   ✅ SUCCESS: All selected items transferred correctly")
            return True
        else:
            print(f"   ❌ FAILURE: Only {success_count}/{len(self.test_items)} items transferred")
            return False

    def simulate_checklist_to_ffe_transfer(self):
        """Simulate the exact frontend checklist to FFE transfer logic"""
        print(f"\n🔄 Simulating Checklist → FFE Transfer...")
        
        # Get current project structure to find checklist items
        success, project_data, status_code = self.make_request('GET', f'/projects/{self.test_project_id}')
        
        if not success:
            print(f"❌ Failed to get project for FFE transfer: {project_data}")
            return False
        
        # Find checklist room and collect all written items
        checklist_room = None
        for room in project_data.get('rooms', []):
            if room.get('sheet_type') == 'checklist':
                checklist_room = room
                break
        
        if not checklist_room:
            print(f"❌ No checklist room found for FFE transfer")
            return False
        
        # Collect all items with real names (not empty or "New Item")
        items_to_transfer = []
        for category in checklist_room.get('categories', []):
            for subcategory in category.get('subcategories', []):
                for item in subcategory.get('items', []):
                    if item.get('name') and item['name'].strip() != '' and item['name'] != 'New Item':
                        items_to_transfer.append({
                            'item': item,
                            'roomName': checklist_room['name'],
                            'categoryName': category['name'],
                            'subcategoryName': subcategory['name']
                        })
        
        print(f"   Found {len(items_to_transfer)} written items in checklist to transfer to FFE")
        
        if len(items_to_transfer) == 0:
            print(f"❌ No written items found in checklist for FFE transfer")
            return False
        
        # Process FFE transfer
        success_count = 0
        created_structures = {}
        
        for item_context in items_to_transfer:
            try:
                room_key = f"{item_context['roomName']}_ffe"
                category_key = f"{room_key}_{item_context['categoryName']}"
                subcategory_key = f"{category_key}_{item_context['subcategoryName']}"
                
                # Create FFE room if needed (EMPTY room for transfer)
                if room_key not in created_structures:
                    print(f"   🏠 Creating EMPTY FFE room: {item_context['roomName']}")
                    room_request = {
                        "name": item_context['roomName'],
                        "project_id": self.test_project_id,
                        "sheet_type": "ffe",
                        "description": f"Transferred from checklist - {item_context['roomName']}",
                        "auto_populate": False  # CRITICAL: Create empty room
                    }
                    
                    success, room, status_code = self.make_request('POST', '/rooms', room_request)
                    
                    if success:
                        self.ffe_room_id = room.get('id')
                        created_structures[room_key] = self.ffe_room_id
                        print(f"   ✅ Created empty FFE room: {self.ffe_room_id}")
                    else:
                        print(f"   ❌ Failed to create FFE room: {room}")
                        continue
                
                # Create category if needed
                if category_key not in created_structures:
                    category_request = {
                        "name": item_context['categoryName'],
                        "room_id": created_structures[room_key],
                        "description": "",
                        "color": "#4A90E2",
                        "order_index": 0
                    }
                    
                    success, category, status_code = self.make_request('POST', '/categories', category_request)
                    
                    if success:
                        created_structures[category_key] = category.get('id')
                    else:
                        print(f"   ❌ Failed to create FFE category: {category}")
                        continue
                
                # Create subcategory if needed
                if subcategory_key not in created_structures:
                    subcategory_request = {
                        "name": item_context['subcategoryName'],
                        "category_id": created_structures[category_key],
                        "description": "",
                        "color": "#6BA3E6",
                        "order_index": 0
                    }
                    
                    success, subcategory, status_code = self.make_request('POST', '/subcategories', subcategory_request)
                    
                    if success:
                        created_structures[subcategory_key] = subcategory.get('id')
                    else:
                        print(f"   ❌ Failed to create FFE subcategory: {subcategory}")
                        continue
                
                # Create the transferred item in FFE
                item = item_context['item']
                item_request = {
                    "name": item.get('name', ''),
                    "vendor": item.get('vendor', ''),
                    "sku": item.get('sku', ''),
                    "cost": item.get('cost', 0),
                    "size": item.get('size', ''),
                    "finish_color": item.get('finish_color', ''),
                    "quantity": item.get('quantity', 1),
                    "subcategory_id": created_structures[subcategory_key],
                    "status": "APPROVED",  # FFE status
                    "order_index": 0
                }
                
                success, created_item, status_code = self.make_request('POST', '/items', item_request)
                
                if success:
                    success_count += 1
                    print(f"   ✅ Transferred to FFE: {item['name']}")
                else:
                    print(f"   ❌ Failed to transfer to FFE: {item['name']}")
                    
            except Exception as e:
                print(f"   ❌ Error transferring {item_context['item']['name']}: {e}")
        
        print(f"\n📊 Checklist → FFE Transfer Results:")
        print(f"   Expected: {len(items_to_transfer)} items")
        print(f"   Transferred: {success_count} items")
        
        if success_count == len(items_to_transfer):
            print(f"   ✅ SUCCESS: All written items transferred to FFE correctly")
            return True
        else:
            print(f"   ❌ FAILURE: Only {success_count}/{len(items_to_transfer)} items transferred")
            return False

    def verify_final_project_structure(self):
        """Verify the final project has all three room types with correct item counts"""
        print(f"\n🔍 Verifying final project structure...")
        
        success, project_data, status_code = self.make_request('GET', f'/projects/{self.test_project_id}')
        
        if not success:
            print(f"❌ Failed to get final project structure: {project_data}")
            return False
        
        rooms = project_data.get('rooms', [])
        room_summary = {}
        
        for room in rooms:
            sheet_type = room.get('sheet_type', 'walkthrough')
            room_name = room.get('name')
            
            # Count items in this room
            item_count = 0
            category_count = 0
            for category in room.get('categories', []):
                category_count += 1
                for subcategory in category.get('subcategories', []):
                    item_count += len(subcategory.get('items', []))
            
            if sheet_type not in room_summary:
                room_summary[sheet_type] = []
            
            room_summary[sheet_type].append({
                'name': room_name,
                'categories': category_count,
                'items': item_count
            })
        
        print(f"📊 FINAL PROJECT STRUCTURE:")
        for sheet_type, rooms_list in room_summary.items():
            total_items = sum(r['items'] for r in rooms_list)
            print(f"   {sheet_type.upper()}: {len(rooms_list)} room(s), {total_items} total items")
            for room_info in rooms_list:
                print(f"     - {room_info['name']}: {room_info['categories']} categories, {room_info['items']} items")
        
        # Verify expected structure
        expected_structure = {
            'walkthrough': 1,  # 1 room with many items
            'checklist': 1,    # 1 room with 3 transferred items
            'ffe': 1           # 1 room with 3 transferred items
        }
        
        structure_correct = True
        for expected_type, expected_count in expected_structure.items():
            if expected_type not in room_summary:
                print(f"   ❌ Missing {expected_type} room")
                structure_correct = False
            elif len(room_summary[expected_type]) != expected_count:
                print(f"   ❌ Expected {expected_count} {expected_type} room(s), found {len(room_summary[expected_type])}")
                structure_correct = False
        
        if structure_correct:
            print(f"   ✅ All expected room types present")
            
            # Check item counts
            walkthrough_items = sum(r['items'] for r in room_summary.get('walkthrough', []))
            checklist_items = sum(r['items'] for r in room_summary.get('checklist', []))
            ffe_items = sum(r['items'] for r in room_summary.get('ffe', []))
            
            print(f"   📋 Item distribution:")
            print(f"     Walkthrough: {walkthrough_items} items (should be 70+)")
            print(f"     Checklist: {checklist_items} items (should be 3)")
            print(f"     FFE: {ffe_items} items (should be 3)")
            
            if checklist_items == 3 and ffe_items == 3:
                print(f"   ✅ Transfer item counts are correct")
                return True
            else:
                print(f"   ❌ Transfer item counts are incorrect")
                return False
        
        return structure_correct

    def run_comprehensive_test(self):
        """Run the complete comprehensive transfer test"""
        print("🚀 STARTING COMPREHENSIVE TRANSFER FUNCTIONALITY TEST...")
        
        # Step 1: Create test project with walkthrough
        if not self.create_test_project_with_walkthrough():
            print("❌ CRITICAL: Could not create test project with walkthrough")
            return False
        
        # Step 2: Test walkthrough to checklist transfer
        walkthrough_success = self.simulate_walkthrough_to_checklist_transfer()
        
        # Step 3: Test checklist to FFE transfer
        ffe_success = self.simulate_checklist_to_ffe_transfer()
        
        # Step 4: Verify final structure
        structure_success = self.verify_final_project_structure()
        
        # Final Summary
        print("\n" + "=" * 80)
        print("🎯 COMPREHENSIVE TRANSFER TEST SUMMARY")
        print("=" * 80)
        
        all_transfers_working = walkthrough_success and ffe_success and structure_success
        
        if all_transfers_working:
            print("🎉 SUCCESS: BOTH TRANSFER WORKFLOWS ARE WORKING PERFECTLY!")
            print("   ✅ Walkthrough → Checklist: Working correctly")
            print("   ✅ Checklist → FFE: Working correctly")
            print("   ✅ Final structure: All room types with correct item counts")
            print(f"   📋 Test project ID: {self.test_project_id}")
            print("\nThe user's report 'BOTH transfers not working!!!!' appears to be resolved.")
            return True
        else:
            print("🚨 FAILURE: TRANSFER FUNCTIONALITY ISSUES CONFIRMED")
            if not walkthrough_success:
                print("   ❌ Walkthrough → Checklist: NOT WORKING")
            if not ffe_success:
                print("   ❌ Checklist → FFE: NOT WORKING")
            if not structure_success:
                print("   ❌ Final structure: Incorrect item distribution")
            print(f"   📋 Test project ID: {self.test_project_id}")
            print("\nThis confirms the user's report: 'BOTH transfers not working!!!!'")
            return False

def main():
    """Run comprehensive transfer test"""
    tester = ComprehensiveTransferTester()
    success = tester.run_comprehensive_test()
    return success

if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)
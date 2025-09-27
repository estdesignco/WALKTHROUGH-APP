#!/usr/bin/env python3
"""
EXACT FRONTEND TRANSFER TEST - SIMULATING handleTransferToChecklist()

This test replicates the EXACT logic from SimpleWalkthroughSpreadsheet.js handleTransferToChecklist() function
to determine if the backend APIs support the transfer functionality correctly.
"""

import requests
import json
import uuid
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

print("=" * 80)
print("🚨 EXACT FRONTEND TRANSFER TEST")
print("=" * 80)
print(f"Backend URL: {BASE_URL}")
print("Simulating: SimpleWalkthroughSpreadsheet.js handleTransferToChecklist()")
print("=" * 80)

class ExactFrontendTransferTest:
    def __init__(self):
        self.session = requests.Session()
        self.project_id = None
        self.walkthrough_room_id = None
        self.test_items = []
        self.checked_items = set()  # Simulates frontend checkedItems Set
        
    def make_request(self, method: str, endpoint: str, data: Dict = None) -> tuple:
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
            return False, f"Error: {str(e)}", 0

    def setup_test_project(self):
        """Create test project and walkthrough room with items"""
        print("\n🏠 Setting up test project...")
        
        # Create project
        project_data = {
            "name": "Exact Frontend Transfer Test",
            "client_info": {
                "full_name": "Test Client",
                "email": "test@example.com",
                "phone": "555-0123",
                "address": "123 Test St"
            },
            "project_type": "Renovation"
        }
        
        success, project, status_code = self.make_request('POST', '/projects', project_data)
        if not success:
            print(f"❌ Failed to create project: {project}")
            return False
            
        self.project_id = project.get('id')
        print(f"✅ Created project: {self.project_id}")
        
        # Create walkthrough room
        room_data = {
            "name": "living room",
            "project_id": self.project_id,
            "sheet_type": "walkthrough",
            "description": "Test walkthrough room"
        }
        
        success, room, status_code = self.make_request('POST', '/rooms', room_data)
        if not success:
            print(f"❌ Failed to create room: {room}")
            return False
            
        self.walkthrough_room_id = room.get('id')
        print(f"✅ Created walkthrough room: {self.walkthrough_room_id}")
        
        # Get room structure and add test items
        success, project_data, status_code = self.make_request('GET', f'/projects/{self.project_id}')
        if not success:
            print(f"❌ Failed to get project data: {project_data}")
            return False
            
        # Find first subcategory to add items
        target_subcategory = None
        for room in project_data.get('rooms', []):
            if room.get('id') == self.walkthrough_room_id:
                for category in room.get('categories', []):
                    for subcategory in category.get('subcategories', []):
                        target_subcategory = subcategory
                        break
                    if target_subcategory:
                        break
                break
        
        if not target_subcategory:
            print("❌ No subcategory found to add items")
            return False
            
        # Add test items
        test_item_names = ["Chandelier", "Recessed Lighting", "Sconces"]
        
        for item_name in test_item_names:
            item_data = {
                "name": item_name,
                "quantity": 1,
                "size": "Standard",
                "vendor": "Test Vendor",
                "status": "",
                "cost": 500.00,
                "subcategory_id": target_subcategory["id"],
                "finish_color": "Natural"
            }
            
            success, created_item, status_code = self.make_request('POST', '/items', item_data)
            if success:
                item_id = created_item.get('id')
                self.test_items.append({
                    'id': item_id,
                    'name': item_name,
                    'item_data': created_item
                })
                print(f"✅ Added item: {item_name} (ID: {item_id})")
            else:
                print(f"❌ Failed to add item {item_name}: {created_item}")
        
        # Simulate checking first 2 items
        for item in self.test_items[:2]:
            self.checked_items.add(item['id'])
        
        print(f"✅ Setup complete. Checked items: {len(self.checked_items)}")
        return True

    def execute_exact_frontend_transfer(self):
        """Execute the EXACT frontend transfer logic"""
        print("\n🔄 Executing EXACT frontend transfer logic...")
        
        # STEP 1: Validation (lines 399-404 in frontend)
        if len(self.checked_items) == 0:
            print("❌ No items checked for transfer")
            return False
            
        print(f"🚀 GOOGLE APPS SCRIPT TRANSFER: populateChecklistFromWalkthroughApp()")
        print(f"Attempting to transfer {len(self.checked_items)} items to Checklist.")
        
        # STEP 2: Collect ONLY checked items (lines 407-433)
        items_to_transfer = []
        
        # Get current project data
        success, project_data, status_code = self.make_request('GET', f'/projects/{self.project_id}')
        if not success:
            print(f"❌ Failed to get project data: {project_data}")
            return False
            
        # Find checked items in project structure
        checked_item_ids = list(self.checked_items)
        print(f"🔍 Checked Item IDs: {checked_item_ids}")
        
        for room in project_data.get('rooms', []):
            for category in room.get('categories', []):
                for subcategory in category.get('subcategories', []):
                    for item in subcategory.get('items', []):
                        if item.get('id') in checked_item_ids:
                            print(f"✅ MATCHED CHECKED ITEM: \"{item.get('name')}\" (ID: {item.get('id')})")
                            items_to_transfer.append({
                                'item': item,
                                'roomName': room.get('name'),
                                'categoryName': category.get('name'),
                                'subcategoryName': subcategory.get('name')
                            })
        
        # Validation
        if len(items_to_transfer) != len(self.checked_items):
            print(f"🚨 MISMATCH: Found {len(items_to_transfer)} items but expected {len(self.checked_items)}")
            return False
            
        print(f"Verified: {len(items_to_transfer)} items ready for transfer")
        
        # STEP 3: Execute transfer (lines 450-580)
        success_count = 0
        created_structures = {}
        
        print(f"🚀 Creating structure and adding {len(items_to_transfer)} checked items")
        
        for item_data in items_to_transfer:
            try:
                room_key = f"{item_data['roomName']}_checklist"
                category_key = f"{room_key}_{item_data['categoryName']}"
                subcategory_key = f"{category_key}_{item_data['subcategoryName']}"
                
                # Create checklist room if needed
                room_id = created_structures.get(room_key)
                if not room_id:
                    print(f"📁 Creating checklist room: {item_data['roomName']}")
                    room_data = {
                        "name": item_data['roomName'],
                        "project_id": self.project_id,
                        "sheet_type": "checklist",
                        "description": "Transferred from walkthrough"
                    }
                    
                    success, new_room, status_code = self.make_request('POST', '/rooms', room_data)
                    if success:
                        room_id = new_room.get('id')
                        created_structures[room_key] = room_id
                        print(f"✅ Created checklist room: {item_data['roomName']} (ID: {room_id})")
                    else:
                        print(f"❌ Failed to create room: {new_room}")
                        continue
                
                # Create category if needed
                category_id = created_structures.get(category_key)
                if not category_id:
                    print(f"📂 Creating category: {item_data['categoryName']}")
                    category_data = {
                        "name": item_data['categoryName'],
                        "room_id": room_id,
                        "description": "",
                        "color": "#4A90E2",
                        "order_index": 0
                    }
                    
                    success, new_category, status_code = self.make_request('POST', '/categories', category_data)
                    if success:
                        category_id = new_category.get('id')
                        created_structures[category_key] = category_id
                        print(f"✅ Created category: {item_data['categoryName']} (ID: {category_id})")
                    else:
                        print(f"❌ Failed to create category: {new_category}")
                        continue
                
                # Create subcategory if needed
                subcategory_id = created_structures.get(subcategory_key)
                if not subcategory_id:
                    print(f"📄 Creating subcategory: {item_data['subcategoryName']}")
                    subcategory_data = {
                        "name": item_data['subcategoryName'],
                        "category_id": category_id,
                        "description": "",
                        "color": "#6BA3E6",
                        "order_index": 0
                    }
                    
                    success, new_subcategory, status_code = self.make_request('POST', '/subcategories', subcategory_data)
                    if success:
                        subcategory_id = new_subcategory.get('id')
                        created_structures[subcategory_key] = subcategory_id
                        print(f"✅ Created subcategory: {item_data['subcategoryName']} (ID: {subcategory_id})")
                    else:
                        print(f"❌ Failed to create subcategory: {new_subcategory}")
                        continue
                
                # Create the checked item
                print(f"📝 Creating checked item: \"{item_data['item']['name']}\"")
                new_item_data = {
                    "name": item_data['item']['name'],
                    "vendor": item_data['item'].get('vendor', ''),
                    "sku": item_data['item'].get('sku', ''),
                    "cost": item_data['item'].get('cost', 0),
                    "size": item_data['item'].get('size', ''),
                    "finish_color": "",  # Always blank
                    "quantity": item_data['item'].get('quantity', 1),
                    "subcategory_id": subcategory_id,
                    "status": "TO BE SELECTED",
                    "order_index": 0
                }
                
                success, created_item, status_code = self.make_request('POST', '/items', new_item_data)
                if success:
                    print(f"✅ Created item: {item_data['item']['name']} (ID: {created_item.get('id')})")
                    success_count += 1
                else:
                    print(f"❌ Failed to create item: {created_item}")
                    
            except Exception as error:
                print(f"❌ Error processing {item_data['item']['name']}: {error}")
        
        # Clear checkboxes (simulate frontend)
        if success_count > 0:
            self.checked_items.clear()
            print(f"✅ Successfully transferred {success_count} items to checklist")
            return True
        else:
            print("❌ No items were successfully transferred")
            return False

    def verify_results(self):
        """Verify the transfer worked correctly"""
        print("\n🔍 Verifying transfer results...")
        
        success, project_data, status_code = self.make_request('GET', f'/projects/{self.project_id}')
        if not success:
            print(f"❌ Failed to get project data: {project_data}")
            return False
            
        walkthrough_items = 0
        checklist_items = 0
        checklist_item_names = []
        
        for room in project_data.get('rooms', []):
            sheet_type = room.get('sheet_type', 'walkthrough')
            for category in room.get('categories', []):
                for subcategory in category.get('subcategories', []):
                    items = subcategory.get('items', [])
                    if sheet_type == 'walkthrough':
                        walkthrough_items += len(items)
                    elif sheet_type == 'checklist':
                        checklist_items += len(items)
                        checklist_item_names.extend([item.get('name', '') for item in items])
        
        print(f"📋 Walkthrough items: {walkthrough_items}")
        print(f"📝 Checklist items: {checklist_items}")
        print(f"📝 Checklist item names: {checklist_item_names}")
        
        expected_items = ["Chandelier", "Recessed Lighting"]  # First 2 items were checked
        
        if checklist_items == len(expected_items):
            print(f"✅ Correct number of items transferred: {checklist_items}")
            
            # Check if correct items were transferred
            all_found = all(name in checklist_item_names for name in expected_items)
            if all_found:
                print(f"✅ All expected items found in checklist: {expected_items}")
                return True
            else:
                missing = [name for name in expected_items if name not in checklist_item_names]
                print(f"❌ Missing items in checklist: {missing}")
                return False
        else:
            print(f"❌ Wrong number of items transferred. Expected: {len(expected_items)}, Got: {checklist_items}")
            return False

    def run_test(self):
        """Run the complete test"""
        print("🚀 Starting exact frontend transfer test...")
        
        if not self.setup_test_project():
            print("❌ Setup failed")
            return False
            
        if not self.execute_exact_frontend_transfer():
            print("❌ Transfer failed")
            return False
            
        if not self.verify_results():
            print("❌ Verification failed")
            return False
            
        print("\n🎉 SUCCESS: Transfer functionality is working correctly!")
        print(f"📋 Test project ID: {self.project_id}")
        return True

# Main execution
if __name__ == "__main__":
    tester = ExactFrontendTransferTest()
    success = tester.run_test()
    
    if success:
        print("\n✅ CONCLUSION: Transfer functionality is WORKING")
        exit(0)
    else:
        print("\n❌ CONCLUSION: Transfer functionality is BROKEN")
        exit(1)
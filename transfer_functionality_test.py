#!/usr/bin/env python3
"""
URGENT TRANSFER FUNCTIONALITY DEBUG TEST

The user is extremely frustrated that TRANSFER TO CHECKLIST is still not working despite having comprehensive frontend logic. 
This test will verify the exact transfer workflow to identify the failure point.

TESTING SCENARIO:
Project ID: 4f261f4e-c5af-46c3-92c7-0d923593228f has:
- Living Room with Lighting/Furniture/Window Treatments/Textiles/Art categories
- Kitchen with comprehensive categories  
- 60+ items total with proper structure

BACKEND API TESTING REQUIRED:
Test the exact API sequence that the transfer function calls:

1. POST /api/rooms - Create room for checklist
2. POST /api/categories - Create category with new room_id
3. POST /api/subcategories - Create subcategory with new category_id
4. POST /api/items - Create item with new subcategory_id and status: 'PICKED'
"""

import requests
import json
import uuid
import sys
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
print("🚨 URGENT TRANSFER FUNCTIONALITY DEBUG TEST")
print("=" * 80)
print(f"Backend URL: {BASE_URL}")
print("Testing: TRANSFER TO CHECKLIST API sequence")
print("Project ID: 4f261f4e-c5af-46c3-92c7-0d923593228f")
print("=" * 80)

class TransferFunctionalityTester:
    def __init__(self):
        self.session = requests.Session()
        self.test_results = []
        self.project_id = "4f261f4e-c5af-46c3-92c7-0d923593228f"
        self.created_room_id = None
        self.created_category_id = None
        self.created_subcategory_id = None
        self.created_item_id = None
        
    def log_test(self, test_name: str, success: bool, details: str = ""):
        """Log test results"""
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}")
        if details:
            print(f"   Details: {details}")
        self.test_results.append({
            'test': test_name,
            'success': success,
            'details': details
        })
        
    def make_request(self, method: str, endpoint: str, data: Dict = None, params: Dict = None) -> tuple:
        """Make HTTP request and return (success, response_data, status_code)"""
        try:
            url = f"{BASE_URL}{endpoint}"
            
            if method.upper() == 'GET':
                response = self.session.get(url, params=params, timeout=15)
            elif method.upper() == 'POST':
                response = self.session.post(url, json=data, timeout=15)
            elif method.upper() == 'PUT':
                response = self.session.put(url, json=data, timeout=15)
            elif method.upper() == 'DELETE':
                response = self.session.delete(url, timeout=15)
            else:
                return False, f"Unsupported method: {method}", 400
                
            return response.status_code < 400, response.json() if response.content else {}, response.status_code
            
        except requests.exceptions.RequestException as e:
            return False, f"Request failed: {str(e)}", 0
        except json.JSONDecodeError as e:
            return False, f"JSON decode error: {str(e)}", response.status_code if 'response' in locals() else 0
        except Exception as e:
            return False, f"Unexpected error: {str(e)}", 0

    def verify_project_exists(self):
        """Verify the project exists and has the expected structure"""
        print("\n🔍 Step 1: Verifying project exists and has expected structure...")
        
        success, project_data, status_code = self.make_request('GET', f'/projects/{self.project_id}')
        
        if not success:
            self.log_test("Project Exists", False, f"Failed to retrieve project: {project_data} (Status: {status_code})")
            return False
            
        # Analyze project structure
        rooms = project_data.get('rooms', [])
        if not rooms:
            self.log_test("Project Has Rooms", False, "No rooms found in project")
            return False
            
        # Count items across all rooms
        total_items = 0
        room_details = []
        
        for room in rooms:
            room_name = room.get('name', 'Unknown')
            categories = room.get('categories', [])
            room_items = 0
            
            for category in categories:
                for subcategory in category.get('subcategories', []):
                    room_items += len(subcategory.get('items', []))
            
            total_items += room_items
            room_details.append(f"{room_name}: {len(categories)} categories, {room_items} items")
        
        self.log_test("Project Structure Analysis", True, 
                     f"Found {len(rooms)} rooms with {total_items} total items")
        
        for detail in room_details:
            print(f"   {detail}")
        
        if total_items < 60:
            self.log_test("Expected Item Count", False, f"Expected 60+ items, found {total_items}")
            return False
        else:
            self.log_test("Expected Item Count", True, f"Found {total_items} items (60+ expected)")
            
        return True

    def test_step1_create_checklist_room(self):
        """Test Step 1: POST /api/rooms - Create room for checklist"""
        print("\n🏠 Step 2: Testing POST /api/rooms - Create room for checklist...")
        
        # Exact JSON from the review request
        room_data = {
            "name": "Living Room",
            "project_id": self.project_id,
            "sheet_type": "checklist",
            "description": "Transferred from walkthrough"
        }
        
        print(f"   Request JSON: {json.dumps(room_data, indent=2)}")
        
        success, response_data, status_code = self.make_request('POST', '/rooms', room_data)
        
        if not success:
            self.log_test("Create Checklist Room", False, f"Failed: {response_data} (Status: {status_code})")
            return False
            
        self.created_room_id = response_data.get('id')
        if not self.created_room_id:
            self.log_test("Create Checklist Room", False, "No room ID returned in response")
            return False
            
        # Verify sheet_type was set correctly
        sheet_type = response_data.get('sheet_type')
        if sheet_type != 'checklist':
            self.log_test("Checklist Sheet Type", False, f"Expected 'checklist', got '{sheet_type}'")
            return False
            
        self.log_test("Create Checklist Room", True, f"Room ID: {self.created_room_id}, Sheet Type: {sheet_type}")
        return True

    def test_step2_create_category(self):
        """Test Step 2: POST /api/categories - Create category with new room_id"""
        print("\n📂 Step 3: Testing POST /api/categories - Create category with new room_id...")
        
        if not self.created_room_id:
            self.log_test("Create Category", False, "No room ID available from previous step")
            return False
        
        # Exact JSON from the review request
        category_data = {
            "name": "Lighting",
            "room_id": self.created_room_id,
            "description": "",
            "color": "#7B68AA",
            "order_index": 0
        }
        
        print(f"   Request JSON: {json.dumps(category_data, indent=2)}")
        
        success, response_data, status_code = self.make_request('POST', '/categories', category_data)
        
        if not success:
            self.log_test("Create Category", False, f"Failed: {response_data} (Status: {status_code})")
            return False
            
        self.created_category_id = response_data.get('id')
        if not self.created_category_id:
            self.log_test("Create Category", False, "No category ID returned in response")
            return False
            
        # Verify room_id was set correctly
        room_id = response_data.get('room_id')
        if room_id != self.created_room_id:
            self.log_test("Category Room ID", False, f"Expected '{self.created_room_id}', got '{room_id}'")
            return False
            
        self.log_test("Create Category", True, f"Category ID: {self.created_category_id}, Room ID: {room_id}")
        return True

    def test_step3_create_subcategory(self):
        """Test Step 3: POST /api/subcategories - Create subcategory with new category_id"""
        print("\n📁 Step 4: Testing POST /api/subcategories - Create subcategory with new category_id...")
        
        if not self.created_category_id:
            self.log_test("Create Subcategory", False, "No category ID available from previous step")
            return False
        
        # Exact JSON from the review request
        subcategory_data = {
            "name": "INSTALLED",
            "category_id": self.created_category_id,
            "description": "",
            "color": "#9B89B3",
            "order_index": 0
        }
        
        print(f"   Request JSON: {json.dumps(subcategory_data, indent=2)}")
        
        success, response_data, status_code = self.make_request('POST', '/subcategories', subcategory_data)
        
        if not success:
            self.log_test("Create Subcategory", False, f"Failed: {response_data} (Status: {status_code})")
            return False
            
        self.created_subcategory_id = response_data.get('id')
        if not self.created_subcategory_id:
            self.log_test("Create Subcategory", False, "No subcategory ID returned in response")
            return False
            
        # Verify category_id was set correctly
        category_id = response_data.get('category_id')
        if category_id != self.created_category_id:
            self.log_test("Subcategory Category ID", False, f"Expected '{self.created_category_id}', got '{category_id}'")
            return False
            
        self.log_test("Create Subcategory", True, f"Subcategory ID: {self.created_subcategory_id}, Category ID: {category_id}")
        return True

    def test_step4_create_item(self):
        """Test Step 4: POST /api/items - Create item with new subcategory_id"""
        print("\n📦 Step 5: Testing POST /api/items - Create item with new subcategory_id...")
        
        if not self.created_subcategory_id:
            self.log_test("Create Item", False, "No subcategory ID available from previous step")
            return False
        
        # Exact JSON from the review request
        item_data = {
            "name": "Chandelier",
            "vendor": "",
            "sku": "",
            "cost": 0,
            "size": "",
            "finish_color": "Chrome/Brass/Bronze",
            "quantity": 1,
            "subcategory_id": self.created_subcategory_id,
            "status": "PICKED",
            "order_index": 0
        }
        
        print(f"   Request JSON: {json.dumps(item_data, indent=2)}")
        
        success, response_data, status_code = self.make_request('POST', '/items', item_data)
        
        if not success:
            self.log_test("Create Item", False, f"Failed: {response_data} (Status: {status_code})")
            return False
            
        self.created_item_id = response_data.get('id')
        if not self.created_item_id:
            self.log_test("Create Item", False, "No item ID returned in response")
            return False
            
        # Verify subcategory_id was set correctly
        subcategory_id = response_data.get('subcategory_id')
        if subcategory_id != self.created_subcategory_id:
            self.log_test("Item Subcategory ID", False, f"Expected '{self.created_subcategory_id}', got '{subcategory_id}'")
            return False
            
        # Verify status was set to PICKED
        status = response_data.get('status')
        if status != 'PICKED':
            self.log_test("Item Status", False, f"Expected 'PICKED', got '{status}'")
            return False
            
        self.log_test("Create Item", True, f"Item ID: {self.created_item_id}, Status: {status}, Subcategory ID: {subcategory_id}")
        return True

    def test_complete_cascade_verification(self):
        """Verify the complete cascade was created correctly"""
        print("\n🔗 Step 6: Verifying complete cascade was created correctly...")
        
        # Get the project again to verify the complete structure
        success, project_data, status_code = self.make_request('GET', f'/projects/{self.project_id}')
        
        if not success:
            self.log_test("Cascade Verification", False, f"Failed to retrieve project: {project_data}")
            return False
        
        # Find the created room
        created_room = None
        for room in project_data.get('rooms', []):
            if room.get('id') == self.created_room_id:
                created_room = room
                break
        
        if not created_room:
            self.log_test("Find Created Room", False, f"Could not find room with ID {self.created_room_id}")
            return False
            
        self.log_test("Find Created Room", True, f"Found room: {created_room.get('name')}")
        
        # Find the created category
        created_category = None
        for category in created_room.get('categories', []):
            if category.get('id') == self.created_category_id:
                created_category = category
                break
        
        if not created_category:
            self.log_test("Find Created Category", False, f"Could not find category with ID {self.created_category_id}")
            return False
            
        self.log_test("Find Created Category", True, f"Found category: {created_category.get('name')}")
        
        # Find the created subcategory
        created_subcategory = None
        for subcategory in created_category.get('subcategories', []):
            if subcategory.get('id') == self.created_subcategory_id:
                created_subcategory = subcategory
                break
        
        if not created_subcategory:
            self.log_test("Find Created Subcategory", False, f"Could not find subcategory with ID {self.created_subcategory_id}")
            return False
            
        self.log_test("Find Created Subcategory", True, f"Found subcategory: {created_subcategory.get('name')}")
        
        # Find the created item
        created_item = None
        for item in created_subcategory.get('items', []):
            if item.get('id') == self.created_item_id:
                created_item = item
                break
        
        if not created_item:
            self.log_test("Find Created Item", False, f"Could not find item with ID {self.created_item_id}")
            return False
            
        self.log_test("Find Created Item", True, f"Found item: {created_item.get('name')} (Status: {created_item.get('status')})")
        
        # Verify the complete hierarchy
        hierarchy_correct = (
            created_room.get('sheet_type') == 'checklist' and
            created_category.get('room_id') == self.created_room_id and
            created_subcategory.get('category_id') == self.created_category_id and
            created_item.get('subcategory_id') == self.created_subcategory_id and
            created_item.get('status') == 'PICKED'
        )
        
        if hierarchy_correct:
            self.log_test("Complete Hierarchy Verification", True, "All relationships verified correctly")
            return True
        else:
            self.log_test("Complete Hierarchy Verification", False, "Hierarchy relationships are incorrect")
            return False

    def test_multiple_items_transfer(self):
        """Test transferring multiple items to verify bulk transfer capability"""
        print("\n📦 Step 7: Testing multiple items transfer (bulk capability)...")
        
        if not self.created_subcategory_id:
            self.log_test("Multiple Items Transfer", False, "No subcategory ID available")
            return False
        
        # Create multiple items to simulate bulk transfer
        items_to_create = [
            {
                "name": "Pendant Lights",
                "vendor": "Visual Comfort",
                "sku": "VC-12345",
                "cost": 899,
                "size": "12\"W x 18\"H",
                "finish_color": "Brass",
                "quantity": 3,
                "subcategory_id": self.created_subcategory_id,
                "status": "PICKED",
                "order_index": 1
            },
            {
                "name": "Recessed Lighting",
                "vendor": "Halo",
                "sku": "HALO-6789",
                "cost": 299,
                "size": "6\" diameter",
                "finish_color": "White",
                "quantity": 8,
                "subcategory_id": self.created_subcategory_id,
                "status": "PICKED",
                "order_index": 2
            },
            {
                "name": "Wall Sconces",
                "vendor": "Restoration Hardware",
                "sku": "RH-SCONCE-001",
                "cost": 599,
                "size": "8\"W x 12\"H",
                "finish_color": "Aged Brass",
                "quantity": 2,
                "subcategory_id": self.created_subcategory_id,
                "status": "PICKED",
                "order_index": 3
            }
        ]
        
        created_items = []
        
        for item_data in items_to_create:
            success, response_data, status_code = self.make_request('POST', '/items', item_data)
            
            if success:
                created_items.append(response_data.get('id'))
                print(f"   ✅ Created: {item_data['name']} (ID: {response_data.get('id')})")
            else:
                print(f"   ❌ Failed to create: {item_data['name']} - {response_data}")
        
        if len(created_items) == len(items_to_create):
            self.log_test("Multiple Items Transfer", True, f"Successfully created {len(created_items)} items")
            return True
        else:
            self.log_test("Multiple Items Transfer", False, f"Only created {len(created_items)}/{len(items_to_create)} items")
            return False

    def check_backend_logs_for_errors(self):
        """Check backend logs for any errors during the transfer process"""
        print("\n📝 Step 8: Checking backend logs for transfer-related errors...")
        
        try:
            import subprocess
            result = subprocess.run(['tail', '-n', '200', '/var/log/supervisor/backend.err.log'], 
                                  capture_output=True, text=True, timeout=10)
            
            if result.returncode == 0:
                log_content = result.stdout
                
                # Look for recent errors
                error_keywords = ['error', 'exception', 'failed', 'traceback']
                recent_errors = []
                
                for line in log_content.split('\n'):
                    line_lower = line.lower()
                    if any(keyword in line_lower for keyword in error_keywords):
                        recent_errors.append(line.strip())
                
                if recent_errors:
                    self.log_test("Backend Error Check", False, f"Found {len(recent_errors)} potential errors")
                    print("   Recent errors:")
                    for error in recent_errors[-5:]:  # Show last 5 errors
                        print(f"      {error}")
                else:
                    self.log_test("Backend Error Check", True, "No recent errors found in backend logs")
                    
            else:
                self.log_test("Backend Logs Access", False, "Could not read backend error logs")
                
        except Exception as e:
            self.log_test("Backend Logs Check", False, f"Exception checking logs: {str(e)}")

    def run_complete_transfer_test(self):
        """Run the complete transfer functionality test"""
        print("🚀 STARTING COMPLETE TRANSFER FUNCTIONALITY TEST...")
        
        # Step 1: Verify project exists
        if not self.verify_project_exists():
            return False
        
        # Step 2: Test room creation
        if not self.test_step1_create_checklist_room():
            return False
        
        # Step 3: Test category creation
        if not self.test_step2_create_category():
            return False
        
        # Step 4: Test subcategory creation
        if not self.test_step3_create_subcategory():
            return False
        
        # Step 5: Test item creation
        if not self.test_step4_create_item():
            return False
        
        # Step 6: Verify complete cascade
        if not self.test_complete_cascade_verification():
            return False
        
        # Step 7: Test multiple items (bulk transfer)
        if not self.test_multiple_items_transfer():
            return False
        
        # Step 8: Check for backend errors
        self.check_backend_logs_for_errors()
        
        # Final Summary
        print("\n" + "=" * 80)
        print("🎯 TRANSFER FUNCTIONALITY TEST SUMMARY")
        print("=" * 80)
        
        passed_tests = sum(1 for result in self.test_results if result['success'])
        total_tests = len(self.test_results)
        
        print(f"✅ PASSED: {passed_tests}/{total_tests} tests")
        
        if passed_tests == total_tests:
            print("🎉 SUCCESS: All transfer functionality tests passed!")
            print("   The backend API sequence for TRANSFER TO CHECKLIST is working correctly.")
            print(f"   Created complete hierarchy: Room → Category → Subcategory → Items")
            print(f"   Room ID: {self.created_room_id}")
            print(f"   Category ID: {self.created_category_id}")
            print(f"   Subcategory ID: {self.created_subcategory_id}")
            print(f"   Item ID: {self.created_item_id}")
            return True
        else:
            print("❌ FAILURE: Transfer functionality has issues!")
            print("   Failed tests:")
            for result in self.test_results:
                if not result['success']:
                    print(f"      - {result['test']}: {result['details']}")
            return False


# Main execution
if __name__ == "__main__":
    tester = TransferFunctionalityTester()
    success = tester.run_complete_transfer_test()
    
    if success:
        print("\n🎉 SUCCESS: Transfer functionality is working correctly!")
        exit(0)
    else:
        print("\n❌ FAILURE: Transfer functionality has critical issues!")
        exit(1)
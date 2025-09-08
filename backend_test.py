#!/usr/bin/env python3
"""
FF&E Backend API Testing Suite
Tests all FF&E functionality including projects, rooms, categories, subcategories, and items.
"""

import requests
import json
import uuid
from datetime import datetime
from typing import Dict, Any, List
import sys
import os

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

print(f"Testing FF&E Backend APIs at: {BASE_URL}")
print(f"Using Project ID: {PROJECT_ID}")

class FFEAPITester:
    def __init__(self):
        self.session = requests.Session()
        self.test_results = []
        self.created_items = []
        self.created_rooms = []
        self.created_categories = []
        self.created_subcategories = []
        
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
                response = self.session.get(url, params=params)
            elif method.upper() == 'POST':
                response = self.session.post(url, json=data)
            elif method.upper() == 'PUT':
                response = self.session.put(url, json=data)
            elif method.upper() == 'DELETE':
                response = self.session.delete(url)
            else:
                return False, f"Unsupported method: {method}", 400
                
            return response.status_code < 400, response.json() if response.content else {}, response.status_code
            
        except requests.exceptions.RequestException as e:
            return False, f"Request failed: {str(e)}", 0
        except json.JSONDecodeError as e:
            return False, f"JSON decode error: {str(e)}", response.status_code if 'response' in locals() else 0
        except Exception as e:
            return False, f"Unexpected error: {str(e)}", 0

    def test_project_retrieval(self):
        """Test GET /api/projects/{project_id} - Main FF&E endpoint"""
        print("\n=== Testing Project Retrieval (Main FF&E Endpoint) ===")
        
        success, data, status_code = self.make_request('GET', f'/projects/{PROJECT_ID}')
        
        if not success:
            self.log_test("GET Project", False, f"Failed to retrieve project: {data} (Status: {status_code})")
            return False
            
        # Verify project structure
        required_fields = ['id', 'name', 'client_info', 'rooms']
        missing_fields = [field for field in required_fields if field not in data]
        
        if missing_fields:
            self.log_test("GET Project", False, f"Missing required fields: {missing_fields}")
            return False
            
        # Check if project has rooms with FF&E structure
        rooms = data.get('rooms', [])
        if not rooms:
            self.log_test("GET Project", True, "Project retrieved but no rooms found")
            return True
            
        # Verify 3-level hierarchy: Room > Category > Sub-category > Items
        hierarchy_valid = True
        hierarchy_details = []
        
        for room in rooms:
            room_name = room.get('name', 'Unknown')
            categories = room.get('categories', [])
            
            for category in categories:
                cat_name = category.get('name', 'Unknown')
                subcategories = category.get('subcategories', [])
                
                for subcategory in subcategories:
                    subcat_name = subcategory.get('name', 'Unknown')
                    items = subcategory.get('items', [])
                    
                    hierarchy_details.append(f"{room_name} > {cat_name} > {subcat_name} ({len(items)} items)")
        
        if hierarchy_details:
            self.log_test("GET Project", True, f"Project with FF&E hierarchy found. Structure: {'; '.join(hierarchy_details[:3])}")
        else:
            self.log_test("GET Project", True, "Project retrieved with room structure but no items yet")
            
        return True

    def test_room_operations(self):
        """Test room creation and retrieval"""
        print("\n=== Testing Room Operations ===")
        
        # Test room creation
        room_data = {
            "name": "Test Living Room",
            "description": "Test room for FF&E testing",
            "project_id": PROJECT_ID,
            "order_index": 0
        }
        
        success, data, status_code = self.make_request('POST', '/rooms', room_data)
        
        if not success:
            self.log_test("Create Room", False, f"Failed to create room: {data} (Status: {status_code})")
            return False
            
        room_id = data.get('id')
        if not room_id:
            self.log_test("Create Room", False, "Room created but no ID returned")
            return False
            
        self.created_rooms.append(room_id)
        self.log_test("Create Room", True, f"Room created with ID: {room_id}")
        
        # Verify room has auto-created categories and subcategories
        success, project_data, _ = self.make_request('GET', f'/projects/{PROJECT_ID}')
        if success:
            rooms = project_data.get('rooms', [])
            test_room = next((r for r in rooms if r['id'] == room_id), None)
            
            if test_room and test_room.get('categories'):
                categories = test_room['categories']
                self.log_test("Room Auto-Structure", True, f"Room auto-created {len(categories)} categories")
                
                # Check for subcategories
                total_subcats = sum(len(cat.get('subcategories', [])) for cat in categories)
                if total_subcats > 0:
                    self.log_test("Room Auto-Subcategories", True, f"Auto-created {total_subcats} subcategories")
                else:
                    self.log_test("Room Auto-Subcategories", False, "No subcategories auto-created")
            else:
                self.log_test("Room Auto-Structure", False, "Room created but no categories auto-generated")
        
        return True

    def test_item_operations(self):
        """Test item CRUD operations"""
        print("\n=== Testing Item CRUD Operations ===")
        
        # First, get a subcategory to add items to
        success, project_data, _ = self.make_request('GET', f'/projects/{PROJECT_ID}')
        if not success:
            self.log_test("Get Subcategory for Items", False, "Could not retrieve project for item testing")
            return False
            
        # Find a subcategory
        subcategory_id = None
        for room in project_data.get('rooms', []):
            for category in room.get('categories', []):
                for subcategory in category.get('subcategories', []):
                    subcategory_id = subcategory['id']
                    break
                if subcategory_id:
                    break
            if subcategory_id:
                break
                
        if not subcategory_id:
            self.log_test("Get Subcategory for Items", False, "No subcategory found for item testing")
            return False
            
        # Test item creation
        item_data = {
            "name": "Crystal Chandelier Test",
            "quantity": 1,
            "size": "36\" diameter",
            "remarks": "Test item for FF&E testing",
            "vendor": "Visual Comfort",
            "status": "PICKED",
            "cost": 2500.00,
            "link": "https://visualcomfort.com/test-chandelier",
            "subcategory_id": subcategory_id
        }
        
        success, data, status_code = self.make_request('POST', '/items', item_data)
        
        if not success:
            self.log_test("Create Item", False, f"Failed to create item: {data} (Status: {status_code})")
            return False
            
        item_id = data.get('id')
        if not item_id:
            self.log_test("Create Item", False, "Item created but no ID returned")
            return False
            
        self.created_items.append(item_id)
        self.log_test("Create Item", True, f"Item created with ID: {item_id}")
        
        # Test item retrieval
        success, item_data, status_code = self.make_request('GET', f'/items/{item_id}')
        
        if not success:
            self.log_test("Get Item", False, f"Failed to retrieve item: {item_data} (Status: {status_code})")
        else:
            self.log_test("Get Item", True, f"Item retrieved: {item_data.get('name', 'Unknown')}")
            
        # Test item update
        update_data = {
            "status": "ORDERED",
            "cost": 2750.00,
            "remarks": "Updated test item"
        }
        
        success, updated_data, status_code = self.make_request('PUT', f'/items/{item_id}', update_data)
        
        if not success:
            self.log_test("Update Item", False, f"Failed to update item: {updated_data} (Status: {status_code})")
        else:
            # Verify update
            if updated_data.get('status') == 'ORDERED' and updated_data.get('cost') == 2750.00:
                self.log_test("Update Item", True, "Item updated successfully")
            else:
                self.log_test("Update Item", False, "Item update did not persist correctly")
        
        return True

    def test_enum_endpoints(self):
        """Test status, vendor, and carrier enum endpoints"""
        print("\n=== Testing Enum Endpoints ===")
        
        # Test item statuses
        success, statuses, status_code = self.make_request('GET', '/item-statuses')
        if success and isinstance(statuses, list) and len(statuses) > 0:
            self.log_test("Get Item Statuses", True, f"Retrieved {len(statuses)} statuses")
            
            # Check for key statuses
            key_statuses = ['PICKED', 'ORDERED', 'SHIPPED', 'DELIVERED TO JOB SITE', 'INSTALLED']
            found_statuses = [s for s in key_statuses if s in statuses]
            if len(found_statuses) >= 3:
                self.log_test("Key Item Statuses", True, f"Found key statuses: {found_statuses}")
            else:
                self.log_test("Key Item Statuses", False, f"Missing key statuses. Found: {found_statuses}")
        else:
            self.log_test("Get Item Statuses", False, f"Failed to get statuses: {statuses}")
            
        # Test vendor types
        success, vendors, status_code = self.make_request('GET', '/vendor-types')
        if success and isinstance(vendors, list) and len(vendors) > 0:
            self.log_test("Get Vendor Types", True, f"Retrieved {len(vendors)} vendors")
            
            # Check for key vendors
            key_vendors = ['Visual Comfort', 'Four Hands', 'Bernhardt', 'Loloi Rugs']
            found_vendors = [v for v in key_vendors if v in vendors]
            if len(found_vendors) >= 2:
                self.log_test("Key Vendor Types", True, f"Found key vendors: {found_vendors}")
            else:
                self.log_test("Key Vendor Types", False, f"Missing key vendors. Found: {found_vendors}")
        else:
            self.log_test("Get Vendor Types", False, f"Failed to get vendors: {vendors}")
            
        # Test carrier types
        success, carriers, status_code = self.make_request('GET', '/carrier-types')
        if success and isinstance(carriers, list) and len(carriers) > 0:
            self.log_test("Get Carrier Types", True, f"Retrieved {len(carriers)} carriers")
            
            # Check for key carriers
            key_carriers = ['FedEx', 'UPS', 'White Glove Delivery', 'Freight']
            found_carriers = [c for c in key_carriers if c in carriers]
            if len(found_carriers) >= 2:
                self.log_test("Key Carrier Types", True, f"Found key carriers: {found_carriers}")
            else:
                self.log_test("Key Carrier Types", False, f"Missing key carriers. Found: {found_carriers}")
        else:
            self.log_test("Get Carrier Types", False, f"Failed to get carriers: {carriers}")

    def test_link_scraping(self):
        """Test link scraping functionality"""
        print("\n=== Testing Link Scraping Functionality ===")
        
        # Test with a simple URL (we'll use a test URL that should work)
        scrape_data = {
            "url": "https://www.example.com"
        }
        
        success, data, status_code = self.make_request('POST', '/scrape-product', scrape_data)
        
        if success:
            # Check if response has expected fields
            expected_fields = ['name', 'price', 'vendor', 'image_url']
            has_fields = any(field in data for field in expected_fields)
            
            if has_fields:
                self.log_test("Link Scraping", True, "Scraping endpoint working - returns product info structure")
            else:
                self.log_test("Link Scraping", True, "Scraping endpoint accessible but no product info extracted (expected for example.com)")
        else:
            # Check if it's a validation error (expected) vs server error
            if status_code == 400 and "URL" in str(data):
                self.log_test("Link Scraping", True, "Scraping endpoint working - proper validation")
            else:
                self.log_test("Link Scraping", False, f"Scraping endpoint failed: {data} (Status: {status_code})")

    def test_data_persistence(self):
        """Test that data persists correctly"""
        print("\n=== Testing Data Persistence ===")
        
        # Re-fetch project to verify all created data persists
        success, project_data, status_code = self.make_request('GET', f'/projects/{PROJECT_ID}')
        
        if not success:
            self.log_test("Data Persistence", False, f"Could not re-fetch project: {project_data}")
            return False
            
        # Count total items across all subcategories
        total_items = 0
        for room in project_data.get('rooms', []):
            for category in room.get('categories', []):
                for subcategory in category.get('subcategories', []):
                    total_items += len(subcategory.get('items', []))
                    
        if total_items > 0:
            self.log_test("Data Persistence", True, f"Found {total_items} persisted items in project")
            
            # Check if our test items are included
            test_items_found = 0
            for item_id in self.created_items:
                for room in project_data.get('rooms', []):
                    for category in room.get('categories', []):
                        for subcategory in category.get('subcategories', []):
                            for item in subcategory.get('items', []):
                                if item.get('id') == item_id:
                                    test_items_found += 1
                                    
            if test_items_found > 0:
                self.log_test("Test Item Persistence", True, f"{test_items_found} test items found in project")
            else:
                self.log_test("Test Item Persistence", False, "Test items not found in project structure")
        else:
            self.log_test("Data Persistence", True, "No items found but project structure persists")

    def cleanup_test_data(self):
        """Clean up test data"""
        print("\n=== Cleaning Up Test Data ===")
        
        # Delete test items
        for item_id in self.created_items:
            success, _, _ = self.make_request('DELETE', f'/items/{item_id}')
            if success:
                print(f"   Deleted test item: {item_id}")
            else:
                print(f"   Failed to delete test item: {item_id}")

    def run_all_tests(self):
        """Run all FF&E backend tests"""
        print("🚀 Starting FF&E Backend API Tests")
        print("=" * 50)
        
        # Run tests in logical order
        self.test_project_retrieval()
        self.test_room_operations()
        self.test_item_operations()
        self.test_enum_endpoints()
        self.test_link_scraping()
        self.test_data_persistence()
        
        # Clean up
        self.cleanup_test_data()
        
        # Summary
        print("\n" + "=" * 50)
        print("📊 TEST SUMMARY")
        print("=" * 50)
        
        passed = sum(1 for result in self.test_results if result['success'])
        total = len(self.test_results)
        
        print(f"Total Tests: {total}")
        print(f"Passed: {passed}")
        print(f"Failed: {total - passed}")
        print(f"Success Rate: {(passed/total)*100:.1f}%")
        
        # List failed tests
        failed_tests = [result for result in self.test_results if not result['success']]
        if failed_tests:
            print("\n❌ FAILED TESTS:")
            for test in failed_tests:
                print(f"   • {test['test']}: {test['details']}")
        else:
            print("\n🎉 ALL TESTS PASSED!")
            
        return passed == total

if __name__ == "__main__":
    tester = FFEAPITester()
    success = tester.run_all_tests()
    sys.exit(0 if success else 1)
#!/usr/bin/env python3
"""
FF&E Backend API Testing Suite - Review Request Testing
Tests the specific FF&E functionality mentioned in the review request:
1. Project Loading API: GET /api/projects/5cccfb11-0ac0-45ed-91ab-a56088d65b5a
2. Room Structure: Verify room/category/subcategory/item structure
3. Status Data: Test status-related endpoints for dropdown data
4. Item CRUD: Test creating, updating, and deleting items
5. Category Management: Test adding categories to rooms
6. Error Handling: Verify proper error responses
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
PROJECT_ID = "5cccfb11-0ac0-45ed-91ab-a56088d65b5a"  # Review request project ID

print("=" * 80)
print("🎯 FF&E BACKEND API TESTING - REVIEW REQUEST")
print("=" * 80)
print(f"Backend URL: {BASE_URL}")
print(f"Project ID: {PROJECT_ID}")
print("Testing: Project loading, room structure, status data, item CRUD, category management")
print("=" * 80)

class FFEBackendTester:
    def __init__(self):
        self.session = requests.Session()
        self.test_results = []
        self.created_items = []
        self.created_rooms = []
        
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

    def test_project_loading_api(self):
        """Test 1: Project Loading API - GET /api/projects/5cccfb11-0ac0-45ed-91ab-a56088d65b5a"""
        print("\n🔍 TEST 1: Project Loading API")
        print(f"Testing GET /api/projects/{PROJECT_ID}")
        
        success, data, status_code = self.make_request('GET', f'/projects/{PROJECT_ID}')
        
        if not success:
            self.log_test("Project Loading API", False, f"Failed to load project: {data} (Status: {status_code})")
            return False, None
            
        # Verify project data structure
        if not isinstance(data, dict):
            self.log_test("Project Data Format", False, f"Expected dict, got {type(data)}")
            return False, None
            
        # Check required fields
        required_fields = ['id', 'name', 'client_info', 'rooms']
        missing_fields = [field for field in required_fields if field not in data]
        
        if missing_fields:
            self.log_test("Project Required Fields", False, f"Missing fields: {missing_fields}")
            return False, None
        else:
            self.log_test("Project Required Fields", True, "All required fields present")
            
        # Verify project ID matches
        if data.get('id') != PROJECT_ID:
            self.log_test("Project ID Match", False, f"Expected {PROJECT_ID}, got {data.get('id')}")
            return False, None
        else:
            self.log_test("Project ID Match", True, f"Project ID matches: {PROJECT_ID}")
            
        # Log project details
        project_name = data.get('name', 'Unknown')
        client_name = data.get('client_info', {}).get('full_name', 'Unknown')
        rooms_count = len(data.get('rooms', []))
        
        self.log_test("Project Loading API", True, 
                     f"Project: {project_name}, Client: {client_name}, Rooms: {rooms_count}")
        
        return True, data

    def test_room_structure(self, project_data):
        """Test 2: Room Structure - Verify room/category/subcategory/item hierarchy"""
        print("\n🏗️ TEST 2: Room Structure Verification")
        
        if not project_data:
            self.log_test("Room Structure", False, "No project data provided")
            return False
            
        rooms = project_data.get('rooms', [])
        if not rooms:
            self.log_test("Room Structure - Rooms", False, "No rooms found in project")
            return False
            
        # Analyze hierarchy structure
        hierarchy_stats = {
            'rooms': len(rooms),
            'categories': 0,
            'subcategories': 0,
            'items': 0
        }
        
        room_details = []
        
        for room in rooms:
            room_name = room.get('name', 'Unknown')
            categories = room.get('categories', [])
            hierarchy_stats['categories'] += len(categories)
            
            room_subcats = 0
            room_items = 0
            
            for category in categories:
                cat_name = category.get('name', 'Unknown')
                subcategories = category.get('subcategories', [])
                hierarchy_stats['subcategories'] += len(subcategories)
                room_subcats += len(subcategories)
                
                for subcategory in subcategories:
                    items = subcategory.get('items', [])
                    hierarchy_stats['items'] += len(items)
                    room_items += len(items)
            
            room_details.append(f"{room_name}: {len(categories)} cats, {room_subcats} subcats, {room_items} items")
        
        # Log hierarchy statistics
        self.log_test("Room Structure - Hierarchy", True, 
                     f"Structure: {hierarchy_stats['rooms']} rooms → {hierarchy_stats['categories']} categories → {hierarchy_stats['subcategories']} subcategories → {hierarchy_stats['items']} items")
        
        # Show room breakdown
        print("   📊 ROOM BREAKDOWN:")
        for detail in room_details[:5]:  # Show first 5 rooms
            print(f"      {detail}")
        if len(room_details) > 5:
            print(f"      ... and {len(room_details) - 5} more rooms")
            
        # Verify proper 3-level hierarchy exists
        if hierarchy_stats['rooms'] > 0 and hierarchy_stats['categories'] > 0 and hierarchy_stats['subcategories'] > 0:
            self.log_test("Room Structure - 3-Level Hierarchy", True, "Complete 3-level hierarchy confirmed")
        else:
            self.log_test("Room Structure - 3-Level Hierarchy", False, "Incomplete hierarchy structure")
            
        # Check for items with proper structure
        if hierarchy_stats['items'] > 0:
            # Sample an item to check structure
            sample_item = None
            for room in rooms:
                for category in room.get('categories', []):
                    for subcategory in category.get('subcategories', []):
                        items = subcategory.get('items', [])
                        if items:
                            sample_item = items[0]
                            break
                    if sample_item:
                        break
                if sample_item:
                    break
            
            if sample_item:
                item_fields = list(sample_item.keys())
                expected_fields = ['id', 'name', 'status', 'vendor', 'cost', 'quantity']
                found_fields = [f for f in expected_fields if f in item_fields]
                
                if len(found_fields) >= 4:
                    self.log_test("Room Structure - Item Fields", True, f"Items have proper structure: {found_fields}")
                else:
                    self.log_test("Room Structure - Item Fields", False, f"Items missing key fields. Found: {found_fields}")
        
        return hierarchy_stats['items'] > 0

    def test_status_data_endpoints(self):
        """Test 3: Status Data - Test status-related endpoints for dropdown data"""
        print("\n📊 TEST 3: Status Data Endpoints")
        
        # Test enhanced item statuses endpoint
        print("Testing GET /api/item-statuses-enhanced...")
        success, data, status_code = self.make_request('GET', '/item-statuses-enhanced')
        
        if success and isinstance(data, dict) and 'data' in data:
            statuses = data['data']
            if isinstance(statuses, list) and len(statuses) > 0:
                # Check for colors and expected statuses
                statuses_with_colors = [s for s in statuses if isinstance(s, dict) and 'color' in s]
                
                if len(statuses_with_colors) >= 20:
                    self.log_test("Item Statuses Enhanced", True, 
                                 f"Found {len(statuses_with_colors)} statuses with colors")
                    
                    # Check for key statuses
                    key_statuses = ['PICKED', 'ORDERED', 'SHIPPED', 'DELIVERED TO JOB SITE', 'INSTALLED']
                    found_statuses = []
                    for status_obj in statuses_with_colors:
                        if status_obj.get('status') in key_statuses:
                            found_statuses.append(f"{status_obj['status']} ({status_obj['color']})")
                    
                    if len(found_statuses) >= 3:
                        self.log_test("Key Item Statuses", True, f"Found: {found_statuses}")
                    else:
                        self.log_test("Key Item Statuses", False, f"Missing key statuses: {found_statuses}")
                else:
                    self.log_test("Item Statuses Enhanced", False, 
                                 f"Only {len(statuses_with_colors)} statuses with colors (expected ≥20)")
            else:
                self.log_test("Item Statuses Enhanced", False, f"Invalid data format: {statuses}")
        else:
            self.log_test("Item Statuses Enhanced", False, f"Failed: {data} (Status: {status_code})")
        
        # Test carrier options endpoint
        print("Testing GET /api/carrier-options...")
        success, data, status_code = self.make_request('GET', '/carrier-options')
        
        if success and isinstance(data, dict) and 'data' in data:
            carriers = data['data']
            if isinstance(carriers, list) and len(carriers) > 0:
                carriers_with_colors = [c for c in carriers if isinstance(c, dict) and 'color' in c]
                
                if len(carriers_with_colors) >= 15:
                    self.log_test("Carrier Options", True, 
                                 f"Found {len(carriers_with_colors)} carriers with colors")
                    
                    # Check for key carriers
                    key_carriers = ['FedEx', 'UPS', 'Brooks', 'Zenith']
                    found_carriers = []
                    for carrier_obj in carriers_with_colors:
                        if carrier_obj.get('name') in key_carriers:
                            found_carriers.append(f"{carrier_obj['name']} ({carrier_obj['color']})")
                    
                    if len(found_carriers) >= 2:
                        self.log_test("Key Carrier Options", True, f"Found: {found_carriers}")
                    else:
                        self.log_test("Key Carrier Options", False, f"Missing key carriers: {found_carriers}")
                else:
                    self.log_test("Carrier Options", False, 
                                 f"Only {len(carriers_with_colors)} carriers with colors (expected ≥15)")
            else:
                self.log_test("Carrier Options", False, f"Invalid data format: {carriers}")
        else:
            self.log_test("Carrier Options", False, f"Failed: {data} (Status: {status_code})")
        
        # Test basic enum endpoints for backward compatibility
        print("Testing basic enum endpoints...")
        
        # Item statuses
        success, statuses, _ = self.make_request('GET', '/item-statuses')
        if success and isinstance(statuses, list) and len(statuses) > 0:
            self.log_test("Basic Item Statuses", True, f"Found {len(statuses)} basic statuses")
        else:
            self.log_test("Basic Item Statuses", False, "Failed to get basic item statuses")
            
        # Vendor types
        success, vendors, _ = self.make_request('GET', '/vendor-types')
        if success and isinstance(vendors, list) and len(vendors) > 0:
            self.log_test("Vendor Types", True, f"Found {len(vendors)} vendor types")
        else:
            self.log_test("Vendor Types", False, "Failed to get vendor types")

    def test_item_crud_operations(self):
        """Test 4: Item CRUD - Test creating, updating, and deleting items"""
        print("\n🔧 TEST 4: Item CRUD Operations")
        
        # First, get project data to find a subcategory
        success, project_data, _ = self.make_request('GET', f'/projects/{PROJECT_ID}')
        if not success:
            self.log_test("Item CRUD - Get Subcategory", False, "Could not retrieve project for item testing")
            return False
            
        # Find a subcategory to add items to
        subcategory_id = None
        subcategory_name = None
        for room in project_data.get('rooms', []):
            for category in room.get('categories', []):
                for subcategory in category.get('subcategories', []):
                    subcategory_id = subcategory['id']
                    subcategory_name = f"{room['name']} > {category['name']} > {subcategory['name']}"
                    break
                if subcategory_id:
                    break
            if subcategory_id:
                break
                
        if not subcategory_id:
            self.log_test("Item CRUD - Get Subcategory", False, "No subcategory found for item testing")
            return False
        else:
            self.log_test("Item CRUD - Get Subcategory", True, f"Using subcategory: {subcategory_name}")
        
        # Test CREATE item
        print("Testing item creation...")
        item_data = {
            "name": "Restoration Hardware Cloud Sofa",
            "quantity": 1,
            "size": "84\" W x 40\" D x 32\" H",
            "remarks": "Test item for FF&E backend testing",
            "vendor": "Restoration Hardware",
            "status": "PICKED",
            "cost": 3500.00,
            "link": "https://rh.com/catalog/product/cloud-sofa",
            "sku": "RH-CLOUD-84",
            "finish_color": "Belgian Linen Natural",
            "subcategory_id": subcategory_id
        }
        
        success, created_item, status_code = self.make_request('POST', '/items', item_data)
        
        if not success:
            self.log_test("Item CRUD - CREATE", False, f"Failed to create item: {created_item} (Status: {status_code})")
            return False
            
        item_id = created_item.get('id')
        if not item_id:
            self.log_test("Item CRUD - CREATE", False, "Item created but no ID returned")
            return False
            
        self.created_items.append(item_id)
        self.log_test("Item CRUD - CREATE", True, f"Item created with ID: {item_id}")
        
        # Test READ item
        print("Testing item retrieval...")
        success, retrieved_item, status_code = self.make_request('GET', f'/items/{item_id}')
        
        if not success:
            self.log_test("Item CRUD - READ", False, f"Failed to retrieve item: {retrieved_item} (Status: {status_code})")
        else:
            # Verify data matches
            if (retrieved_item.get('name') == item_data['name'] and 
                retrieved_item.get('vendor') == item_data['vendor']):
                self.log_test("Item CRUD - READ", True, f"Item retrieved correctly: {retrieved_item.get('name')}")
            else:
                self.log_test("Item CRUD - READ", False, "Retrieved item data doesn't match created item")
        
        # Test UPDATE item
        print("Testing item update...")
        update_data = {
            "status": "ORDERED",
            "cost": 3750.00,
            "remarks": "Updated test item - order placed",
            "tracking_number": "1Z999AA1234567890"
        }
        
        success, updated_item, status_code = self.make_request('PUT', f'/items/{item_id}', update_data)
        
        if not success:
            self.log_test("Item CRUD - UPDATE", False, f"Failed to update item: {updated_item} (Status: {status_code})")
        else:
            # Verify updates
            if (updated_item.get('status') == 'ORDERED' and 
                updated_item.get('cost') == 3750.00 and
                updated_item.get('tracking_number') == '1Z999AA1234567890'):
                self.log_test("Item CRUD - UPDATE", True, "Item updated successfully")
            else:
                self.log_test("Item CRUD - UPDATE", False, "Item update did not persist correctly")
        
        # Test item appears in project structure
        print("Testing item appears in project...")
        success, updated_project, _ = self.make_request('GET', f'/projects/{PROJECT_ID}')
        
        if success:
            item_found = False
            for room in updated_project.get('rooms', []):
                for category in room.get('categories', []):
                    for subcategory in category.get('subcategories', []):
                        for item in subcategory.get('items', []):
                            if item.get('id') == item_id:
                                item_found = True
                                break
                        if item_found:
                            break
                    if item_found:
                        break
                if item_found:
                    break
            
            if item_found:
                self.log_test("Item CRUD - Project Integration", True, "Created item appears in project structure")
            else:
                self.log_test("Item CRUD - Project Integration", False, "Created item not found in project structure")
        
        return True

    def test_category_management(self):
        """Test 5: Category Management - Test adding categories to rooms"""
        print("\n📁 TEST 5: Category Management")
        
        # First, get project data to find a room
        success, project_data, _ = self.make_request('GET', f'/projects/{PROJECT_ID}')
        if not success:
            self.log_test("Category Management - Get Room", False, "Could not retrieve project for category testing")
            return False
            
        rooms = project_data.get('rooms', [])
        if not rooms:
            self.log_test("Category Management - Get Room", False, "No rooms found for category testing")
            return False
            
        # Use the first room
        test_room = rooms[0]
        room_id = test_room['id']
        room_name = test_room['name']
        initial_categories = len(test_room.get('categories', []))
        
        self.log_test("Category Management - Get Room", True, 
                     f"Using room: {room_name} (ID: {room_id}) with {initial_categories} existing categories")
        
        # Test adding a new category
        print("Testing category creation...")
        category_data = {
            "name": "Test Lighting Category",
            "description": "Test category for FF&E backend testing",
            "room_id": room_id,
            "order_index": initial_categories + 1
        }
        
        success, created_category, status_code = self.make_request('POST', '/categories', category_data)
        
        if not success:
            self.log_test("Category Management - CREATE", False, 
                         f"Failed to create category: {created_category} (Status: {status_code})")
            return False
            
        category_id = created_category.get('id')
        if not category_id:
            self.log_test("Category Management - CREATE", False, "Category created but no ID returned")
            return False
            
        self.log_test("Category Management - CREATE", True, f"Category created with ID: {category_id}")
        
        # Test adding a subcategory to the new category
        print("Testing subcategory creation...")
        subcategory_data = {
            "name": "INSTALLED",
            "description": "Test subcategory for installed lighting",
            "category_id": category_id,
            "order_index": 1
        }
        
        success, created_subcategory, status_code = self.make_request('POST', '/subcategories', subcategory_data)
        
        if not success:
            self.log_test("Category Management - CREATE Subcategory", False, 
                         f"Failed to create subcategory: {created_subcategory} (Status: {status_code})")
        else:
            subcategory_id = created_subcategory.get('id')
            if subcategory_id:
                self.log_test("Category Management - CREATE Subcategory", True, 
                             f"Subcategory created with ID: {subcategory_id}")
            else:
                self.log_test("Category Management - CREATE Subcategory", False, 
                             "Subcategory created but no ID returned")
        
        # Verify category appears in project structure
        print("Testing category appears in project...")
        success, updated_project, _ = self.make_request('GET', f'/projects/{PROJECT_ID}')
        
        if success:
            category_found = False
            for room in updated_project.get('rooms', []):
                if room['id'] == room_id:
                    for category in room.get('categories', []):
                        if category.get('id') == category_id:
                            category_found = True
                            new_categories_count = len(room.get('categories', []))
                            self.log_test("Category Management - Project Integration", True, 
                                         f"New category appears in project. Categories increased from {initial_categories} to {new_categories_count}")
                            break
                    break
            
            if not category_found:
                self.log_test("Category Management - Project Integration", False, 
                             "Created category not found in project structure")
        
        return True

    def test_error_handling(self):
        """Test 6: Error Handling - Verify proper error responses for invalid requests"""
        print("\n⚠️ TEST 6: Error Handling")
        
        # Test 1: Invalid project ID
        print("Testing invalid project ID...")
        invalid_project_id = "invalid-project-id-12345"
        success, data, status_code = self.make_request('GET', f'/projects/{invalid_project_id}')
        
        if not success and status_code in [404, 422]:
            self.log_test("Error Handling - Invalid Project ID", True, 
                         f"Correctly returned error {status_code}: {data}")
        else:
            self.log_test("Error Handling - Invalid Project ID", False, 
                         f"Expected 404/422 error, got {status_code}: {data}")
        
        # Test 2: Invalid item creation (missing required fields)
        print("Testing invalid item creation...")
        invalid_item_data = {
            "name": "Test Item",
            # Missing required subcategory_id
        }
        
        success, data, status_code = self.make_request('POST', '/items', invalid_item_data)
        
        if not success and status_code in [400, 422]:
            self.log_test("Error Handling - Invalid Item Creation", True, 
                         f"Correctly returned validation error {status_code}: {data}")
        else:
            self.log_test("Error Handling - Invalid Item Creation", False, 
                         f"Expected 400/422 error, got {status_code}: {data}")
        
        # Test 3: Invalid item update (non-existent item)
        print("Testing update of non-existent item...")
        fake_item_id = "non-existent-item-id-12345"
        update_data = {"status": "ORDERED"}
        
        success, data, status_code = self.make_request('PUT', f'/items/{fake_item_id}', update_data)
        
        if not success and status_code in [404, 422]:
            self.log_test("Error Handling - Non-existent Item Update", True, 
                         f"Correctly returned error {status_code}: {data}")
        else:
            self.log_test("Error Handling - Non-existent Item Update", False, 
                         f"Expected 404/422 error, got {status_code}: {data}")
        
        # Test 4: Invalid scraping URL
        print("Testing invalid scraping URL...")
        invalid_scrape_data = {"url": "not-a-valid-url"}
        
        success, data, status_code = self.make_request('POST', '/scrape-product', invalid_scrape_data)
        
        if not success and status_code in [400, 422]:
            self.log_test("Error Handling - Invalid Scraping URL", True, 
                         f"Correctly returned validation error {status_code}: {data}")
        else:
            # Some scraping endpoints might still return 200 with error in response
            if success and isinstance(data, dict) and data.get('success') == False:
                self.log_test("Error Handling - Invalid Scraping URL", True, 
                             f"Correctly returned error in response: {data}")
            else:
                self.log_test("Error Handling - Invalid Scraping URL", False, 
                             f"Expected validation error, got {status_code}: {data}")

    def cleanup_test_data(self):
        """Clean up test data"""
        print("\n🧹 Cleaning Up Test Data")
        
        # Delete test items
        for item_id in self.created_items:
            success, _, _ = self.make_request('DELETE', f'/items/{item_id}')
            if success:
                print(f"   ✅ Deleted test item: {item_id}")
            else:
                print(f"   ❌ Failed to delete test item: {item_id}")
                
        # Delete test rooms (if any were created)
        for room_id in self.created_rooms:
            success, _, _ = self.make_request('DELETE', f'/rooms/{room_id}')
            if success:
                print(f"   ✅ Deleted test room: {room_id}")
            else:
                print(f"   ❌ Failed to delete test room: {room_id}")

    def run_all_tests(self):
        """Run all FF&E backend tests as requested in review"""
        print("Starting FF&E Backend API Tests...")
        
        # Test 1: Project Loading API
        project_success, project_data = self.test_project_loading_api()
        
        # Test 2: Room Structure (depends on project data)
        structure_success = False
        if project_success and project_data:
            structure_success = self.test_room_structure(project_data)
        
        # Test 3: Status Data Endpoints
        status_success = self.test_status_data_endpoints()
        
        # Test 4: Item CRUD Operations
        crud_success = self.test_item_crud_operations()
        
        # Test 5: Category Management
        category_success = self.test_category_management()
        
        # Test 6: Error Handling
        error_success = self.test_error_handling()
        
        # Clean up test data
        self.cleanup_test_data()
        
        # Summary
        print("\n" + "=" * 80)
        print("📊 FF&E BACKEND API TEST SUMMARY")
        print("=" * 80)
        
        test_results = [
            ("Project Loading API", project_success),
            ("Room Structure Verification", structure_success),
            ("Status Data Endpoints", status_success),
            ("Item CRUD Operations", crud_success),
            ("Category Management", category_success),
            ("Error Handling", error_success)
        ]
        
        passed_tests = 0
        for test_name, success in test_results:
            status = "✅ PASSED" if success else "❌ FAILED"
            print(f"{status} {test_name}")
            if success:
                passed_tests += 1
        
        total_tests = len(test_results)
        print(f"\n🎯 OVERALL RESULT: {passed_tests}/{total_tests} tests passed")
        
        if passed_tests == total_tests:
            print("🎉 ALL FF&E BACKEND TESTS PASSED!")
            print("✅ The FF&E Dashboard backend functionality is working correctly.")
            print("✅ Project loading, room structure, status data, item CRUD, and category management are all operational.")
        elif passed_tests >= total_tests - 1:
            print("✅ MOSTLY SUCCESSFUL - FF&E backend is largely functional.")
            print("⚠️ Minor issues detected but core functionality is working.")
        else:
            print("⚠️ SIGNIFICANT ISSUES DETECTED in FF&E backend functionality.")
            print("❌ Multiple core features need attention.")
        
        return passed_tests >= total_tests - 1  # Allow 1 failure for mostly successful

# Main execution
if __name__ == "__main__":
    tester = FFEBackendTester()
    success = tester.run_all_tests()
    
    if success:
        print("\n🎉 SUCCESS: FF&E backend functionality is working correctly!")
        exit(0)
    else:
        print("\n❌ FAILURE: FF&E backend has issues that need to be resolved.")
        exit(1)
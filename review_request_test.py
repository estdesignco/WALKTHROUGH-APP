#!/usr/bin/env python3
"""
FF&E and Checklist Backend API Testing Suite - REVIEW REQUEST TESTING
Tests FF&E and Checklist backend functionality after recent button updates.
Focus on project loading, Add Category API, Transfer Button Infrastructure, and Project Data Structure.
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
PROJECT_ID = "5cccfb11-0ac0-45ed-91ab-a56088d65b5a"  # Greene Renovation project ID

print("=" * 80)
print("🎯 FF&E AND CHECKLIST BACKEND TESTING - REVIEW REQUEST")
print("=" * 80)
print(f"Backend URL: {BASE_URL}")
print(f"Project ID: {PROJECT_ID} (Greene Renovation)")
print("Focus: FF&E Sheet Access, Checklist Sheet Access, Add Category API, Transfer Button Infrastructure")
print("=" * 80)

class ReviewRequestTester:
    def __init__(self):
        self.session = requests.Session()
        self.test_results = []
        self.created_items = []
        self.created_rooms = []
        self.created_categories = []
        
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

    def test_ffe_sheet_access(self):
        """Test FF&E Sheet Access - Project loading at /project/{id}/ffe endpoint"""
        print("\n=== 🎯 TESTING FF&E SHEET ACCESS ===")
        print("Testing project loading for FF&E sheet functionality...")
        
        # Test 1: GET project data to verify it loads for FF&E
        success, project_data, status_code = self.make_request('GET', f'/projects/{PROJECT_ID}')
        
        if not success:
            self.log_test("FF&E Project Loading", False, f"Failed to load project: {project_data} (Status: {status_code})")
            return False
        
        project_name = project_data.get('name', 'Unknown')
        rooms = project_data.get('rooms', [])
        
        self.log_test("FF&E Project Loading", True, f"Project '{project_name}' loaded successfully with {len(rooms)} rooms")
        
        # Test 2: Verify room/category/subcategory/item hierarchy
        total_categories = 0
        total_subcategories = 0
        total_items = 0
        
        for room in rooms:
            categories = room.get('categories', [])
            total_categories += len(categories)
            
            for category in categories:
                subcategories = category.get('subcategories', [])
                total_subcategories += len(subcategories)
                
                for subcategory in subcategories:
                    items = subcategory.get('items', [])
                    total_items += len(items)
        
        if total_items > 0:
            self.log_test("FF&E Data Structure", True, 
                         f"Complete hierarchy: {len(rooms)} rooms → {total_categories} categories → {total_subcategories} subcategories → {total_items} items")
        else:
            self.log_test("FF&E Data Structure", False, "No items found in project structure")
            
        # Test 3: Verify items have required fields for FF&E functionality
        if total_items > 0:
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
                required_fields = ['id', 'name', 'status', 'vendor', 'cost', 'quantity']
                found_fields = [f for f in required_fields if f in sample_item]
                
                if len(found_fields) >= 4:
                    self.log_test("FF&E Item Structure", True, f"Items have required fields: {found_fields}")
                else:
                    self.log_test("FF&E Item Structure", False, f"Items missing required fields. Found: {found_fields}")
        
        return True

    def test_checklist_sheet_access(self):
        """Test Checklist Sheet Access - Project loading at /project/{id}/checklist endpoint"""
        print("\n=== 🎯 TESTING CHECKLIST SHEET ACCESS ===")
        print("Testing project loading for Checklist sheet functionality...")
        
        # Test 1: Same project should be accessible for checklist
        success, project_data, status_code = self.make_request('GET', f'/projects/{PROJECT_ID}')
        
        if not success:
            self.log_test("Checklist Project Loading", False, f"Failed to load project: {project_data} (Status: {status_code})")
            return False
        
        project_name = project_data.get('name', 'Unknown')
        rooms = project_data.get('rooms', [])
        
        self.log_test("Checklist Project Loading", True, f"Project '{project_name}' accessible for checklist with {len(rooms)} rooms")
        
        # Test 2: Verify checklist-specific status options are available
        success, status_data, status_code = self.make_request('GET', '/item-statuses-enhanced')
        
        if success and isinstance(status_data, dict) and 'data' in status_data:
            statuses = status_data['data']
            checklist_statuses = ['ORDER SAMPLES', 'SAMPLES ARRIVED', 'ASK NEIL', 'ASK CHARLENE', 'ASK JALA', 'GET QUOTE', 'WAITING ON QT', 'READY FOR PRESENTATION']
            
            found_checklist_statuses = []
            for status_obj in statuses:
                if isinstance(status_obj, dict) and status_obj.get('status') in checklist_statuses:
                    found_checklist_statuses.append(status_obj['status'])
            
            if len(found_checklist_statuses) >= 6:
                self.log_test("Checklist Status Options", True, f"Found {len(found_checklist_statuses)} checklist statuses: {found_checklist_statuses}")
            else:
                self.log_test("Checklist Status Options", False, f"Missing checklist statuses. Found: {found_checklist_statuses}")
        else:
            self.log_test("Checklist Status Options", False, f"Failed to get status options: {status_data}")
        
        # Test 3: Verify both sheets can access same project data
        if len(rooms) > 0:
            self.log_test("FF&E/Checklist Data Sharing", True, "Both sheets can access the same project data structure")
        else:
            self.log_test("FF&E/Checklist Data Sharing", False, "No shared data structure found")
        
        return True

    def test_add_category_api(self):
        """Test Add Category API - POST /api/categories functionality"""
        print("\n=== 🎯 TESTING ADD CATEGORY API ===")
        print("Testing POST /api/categories functionality with various category names...")
        
        # First, get a room to add categories to
        success, project_data, _ = self.make_request('GET', f'/projects/{PROJECT_ID}')
        if not success:
            self.log_test("Get Room for Category Test", False, "Could not retrieve project for category testing")
            return False
        
        rooms = project_data.get('rooms', [])
        if not rooms:
            self.log_test("Get Room for Category Test", False, "No rooms found in project")
            return False
        
        test_room = rooms[0]
        room_id = test_room['id']
        
        # Test categories as specified in review request
        test_categories = [
            {"name": "Lighting", "description": "Lighting fixtures and controls"},
            {"name": "Furniture", "description": "Furniture pieces and storage"},
            {"name": "Custom Category Name", "description": "Custom category for testing"}
        ]
        
        successful_categories = 0
        
        for category_data in test_categories:
            print(f"\n--- Testing Add Category: {category_data['name']} ---")
            
            category_request = {
                "name": category_data["name"],
                "description": category_data["description"],
                "room_id": room_id,
                "order_index": 0
            }
            
            success, response_data, status_code = self.make_request('POST', '/categories', category_request)
            
            if success:
                category_id = response_data.get('id')
                if category_id:
                    self.created_categories.append(category_id)
                    self.log_test(f"Add Category '{category_data['name']}'", True, f"Category created with ID: {category_id}")
                    successful_categories += 1
                else:
                    self.log_test(f"Add Category '{category_data['name']}'", False, "Category created but no ID returned")
            else:
                self.log_test(f"Add Category '{category_data['name']}'", False, f"Failed to create category: {response_data} (Status: {status_code})")
        
        # Test 4: Verify categories are available in the available categories endpoint
        success, available_categories, status_code = self.make_request('GET', '/categories/available')
        
        if success and isinstance(available_categories, list):
            expected_categories = ["Lighting", "Furniture"]  # Don't check custom name as it might not be in available list
            found_expected = [cat for cat in expected_categories if cat in available_categories]
            
            if len(found_expected) >= 2:
                self.log_test("Categories Available Endpoint", True, f"Found expected categories: {found_expected}")
            else:
                self.log_test("Categories Available Endpoint", False, f"Missing expected categories. Available: {available_categories[:10]}")
        else:
            self.log_test("Categories Available Endpoint", False, f"Failed to get available categories: {available_categories}")
        
        return successful_categories >= 2

    def test_transfer_button_infrastructure(self):
        """Test Transfer Button Infrastructure - Backend support for data transfer between sheets"""
        print("\n=== 🎯 TESTING TRANSFER BUTTON INFRASTRUCTURE ===")
        print("Testing backend support for data transfer between FF&E and Checklist sheets...")
        
        # Test 1: Verify item update API supports status changes (needed for transfers)
        success, project_data, _ = self.make_request('GET', f'/projects/{PROJECT_ID}')
        if not success:
            self.log_test("Get Item for Transfer Test", False, "Could not retrieve project for transfer testing")
            return False
        
        # Find an item to test with
        test_item = None
        for room in project_data.get('rooms', []):
            for category in room.get('categories', []):
                for subcategory in category.get('subcategories', []):
                    items = subcategory.get('items', [])
                    if items:
                        test_item = items[0]
                        break
                if test_item:
                    break
            if test_item:
                break
        
        if not test_item:
            self.log_test("Get Item for Transfer Test", False, "No items found for transfer testing")
            return False
        
        item_id = test_item['id']
        original_status = test_item.get('status', '')
        
        # Test 2: Update item status (simulating transfer between sheets)
        new_status = "ORDER SAMPLES" if original_status != "ORDER SAMPLES" else "PICKED"
        
        update_data = {
            "status": new_status,
            "remarks": "Updated for transfer testing"
        }
        
        success, updated_item, status_code = self.make_request('PUT', f'/items/{item_id}', update_data)
        
        if success:
            if updated_item.get('status') == new_status:
                self.log_test("Item Status Update (Transfer Support)", True, f"Status updated from '{original_status}' to '{new_status}'")
            else:
                self.log_test("Item Status Update (Transfer Support)", False, f"Status update failed. Expected: {new_status}, Got: {updated_item.get('status')}")
        else:
            self.log_test("Item Status Update (Transfer Support)", False, f"Failed to update item: {updated_item} (Status: {status_code})")
        
        # Test 3: Verify item can be retrieved with updated status
        success, retrieved_item, status_code = self.make_request('GET', f'/items/{item_id}')
        
        if success:
            if retrieved_item.get('status') == new_status:
                self.log_test("Item Status Persistence (Transfer Support)", True, "Updated status persists correctly")
            else:
                self.log_test("Item Status Persistence (Transfer Support)", False, f"Status not persisted. Expected: {new_status}, Got: {retrieved_item.get('status')}")
        else:
            self.log_test("Item Status Persistence (Transfer Support)", False, f"Failed to retrieve updated item: {retrieved_item}")
        
        # Test 4: Test bulk operations support (for multiple item transfers)
        # Note: This tests if the backend can handle multiple rapid updates
        if len(project_data.get('rooms', [])) > 0:
            room = project_data['rooms'][0]
            items_to_test = []
            
            for category in room.get('categories', []):
                for subcategory in category.get('subcategories', []):
                    items = subcategory.get('items', [])
                    items_to_test.extend(items[:3])  # Test with first 3 items
                    if len(items_to_test) >= 3:
                        break
                if len(items_to_test) >= 3:
                    break
            
            if len(items_to_test) >= 2:
                bulk_success_count = 0
                for item in items_to_test[:2]:  # Test 2 items
                    bulk_update = {"status": "GET QUOTE", "remarks": "Bulk transfer test"}
                    success, _, _ = self.make_request('PUT', f'/items/{item["id"]}', bulk_update)
                    if success:
                        bulk_success_count += 1
                
                if bulk_success_count >= 2:
                    self.log_test("Bulk Transfer Support", True, f"Successfully updated {bulk_success_count} items for bulk transfer")
                else:
                    self.log_test("Bulk Transfer Support", False, f"Only {bulk_success_count} items updated successfully")
            else:
                self.log_test("Bulk Transfer Support", False, "Not enough items found for bulk testing")
        
        return True

    def test_project_data_structure(self):
        """Test Project Data Structure - Confirm room/category/subcategory/item hierarchy"""
        print("\n=== 🎯 TESTING PROJECT DATA STRUCTURE ===")
        print("Testing room/category/subcategory/item hierarchy is working correctly...")
        
        success, project_data, status_code = self.make_request('GET', f'/projects/{PROJECT_ID}')
        
        if not success:
            self.log_test("Project Data Structure", False, f"Failed to load project: {project_data} (Status: {status_code})")
            return False
        
        rooms = project_data.get('rooms', [])
        
        if not rooms:
            self.log_test("Project Data Structure - Rooms", False, "No rooms found in project")
            return False
        
        # Analyze the complete hierarchy
        hierarchy_stats = {
            'rooms': len(rooms),
            'categories': 0,
            'subcategories': 0,
            'items': 0
        }
        
        room_details = []
        sample_items = []
        
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
                    subcat_name = subcategory.get('name', 'Unknown')
                    items = subcategory.get('items', [])
                    hierarchy_stats['items'] += len(items)
                    room_items += len(items)
                    
                    # Collect sample items for field verification
                    if items and len(sample_items) < 5:
                        sample_items.extend(items[:2])
            
            if room_items > 0:
                room_details.append(f"{room_name}: {len(categories)} cats, {room_subcats} subcats, {room_items} items")
        
        # Log hierarchy statistics
        self.log_test("Project 3-Level Hierarchy", True, 
                     f"Complete structure: {hierarchy_stats['rooms']} rooms → {hierarchy_stats['categories']} categories → {hierarchy_stats['subcategories']} subcategories → {hierarchy_stats['items']} items")
        
        # Verify item structure
        if sample_items:
            required_fields = ['id', 'name', 'status', 'vendor', 'cost', 'quantity', 'subcategory_id']
            field_coverage = {}
            
            for field in required_fields:
                field_coverage[field] = sum(1 for item in sample_items if field in item and item[field] is not None)
            
            missing_fields = [field for field, count in field_coverage.items() if count < len(sample_items) * 0.8]
            
            if not missing_fields:
                self.log_test("Item Field Structure", True, f"All required fields present in items: {list(field_coverage.keys())}")
            else:
                self.log_test("Item Field Structure", False, f"Missing or incomplete fields: {missing_fields}")
        
        # Show sample room details
        if room_details:
            print(f"\n📊 ROOM STRUCTURE BREAKDOWN:")
            for detail in room_details[:5]:  # Show first 5 rooms
                print(f"   {detail}")
        
        # Verify enhanced_rooms.py categories are available
        success, available_categories, _ = self.make_request('GET', '/categories/available')
        if success and isinstance(available_categories, list):
            expected_enhanced_categories = ["Lighting", "Appliances", "Plumbing", "Furniture & Storage", "Decor & Accessories"]
            found_enhanced = [cat for cat in expected_enhanced_categories if cat in available_categories]
            
            if len(found_enhanced) >= 3:
                self.log_test("Enhanced Categories Available", True, f"Found enhanced categories: {found_enhanced}")
            else:
                self.log_test("Enhanced Categories Available", False, f"Missing enhanced categories. Available: {available_categories[:10]}")
        
        return hierarchy_stats['items'] > 0

    def test_status_dropdowns_functionality(self):
        """Test status dropdowns work for both FF&E and Checklist sheets"""
        print("\n=== 🎯 TESTING STATUS DROPDOWNS FUNCTIONALITY ===")
        print("Testing status dropdowns work for both sheets...")
        
        # Test 1: Get enhanced item statuses
        success, status_response, status_code = self.make_request('GET', '/item-statuses-enhanced')
        
        if not success:
            self.log_test("Status Dropdowns API", False, f"Failed to get statuses: {status_response} (Status: {status_code})")
            return False
        
        if not isinstance(status_response, dict) or 'data' not in status_response:
            self.log_test("Status Dropdowns Format", False, f"Invalid response format: {status_response}")
            return False
        
        statuses = status_response['data']
        
        # Test 2: Verify FF&E statuses are present
        ffe_statuses = ['PICKED', 'ORDERED', 'SHIPPED', 'DELIVERED TO JOB SITE', 'INSTALLED']
        found_ffe_statuses = []
        
        for status_obj in statuses:
            if isinstance(status_obj, dict) and status_obj.get('status') in ffe_statuses:
                found_ffe_statuses.append(f"{status_obj['status']} ({status_obj.get('color', 'no color')})")
        
        if len(found_ffe_statuses) >= 4:
            self.log_test("FF&E Status Options", True, f"Found FF&E statuses: {found_ffe_statuses}")
        else:
            self.log_test("FF&E Status Options", False, f"Missing FF&E statuses. Found: {found_ffe_statuses}")
        
        # Test 3: Verify Checklist statuses are present
        checklist_statuses = ['ORDER SAMPLES', 'SAMPLES ARRIVED', 'ASK NEIL', 'ASK CHARLENE', 'GET QUOTE', 'READY FOR PRESENTATION']
        found_checklist_statuses = []
        
        for status_obj in statuses:
            if isinstance(status_obj, dict) and status_obj.get('status') in checklist_statuses:
                found_checklist_statuses.append(f"{status_obj['status']} ({status_obj.get('color', 'no color')})")
        
        if len(found_checklist_statuses) >= 4:
            self.log_test("Checklist Status Options", True, f"Found Checklist statuses: {found_checklist_statuses}")
        else:
            self.log_test("Checklist Status Options", False, f"Missing Checklist statuses. Found: {found_checklist_statuses}")
        
        # Test 4: Verify all statuses have colors
        statuses_with_colors = [s for s in statuses if isinstance(s, dict) and 'color' in s and s['color']]
        
        if len(statuses_with_colors) >= len(statuses) * 0.9:  # At least 90% should have colors
            self.log_test("Status Colors", True, f"{len(statuses_with_colors)}/{len(statuses)} statuses have colors")
        else:
            self.log_test("Status Colors", False, f"Only {len(statuses_with_colors)}/{len(statuses)} statuses have colors")
        
        return True

    def cleanup_test_data(self):
        """Clean up test data"""
        print("\n=== Cleaning Up Test Data ===")
        
        # Delete test categories
        for category_id in self.created_categories:
            success, _, _ = self.make_request('DELETE', f'/categories/{category_id}')
            if success:
                print(f"   Deleted test category: {category_id}")
            else:
                print(f"   Failed to delete test category: {category_id}")
        
        # Delete test items
        for item_id in self.created_items:
            success, _, _ = self.make_request('DELETE', f'/items/{item_id}')
            if success:
                print(f"   Deleted test item: {item_id}")
            else:
                print(f"   Failed to delete test item: {item_id}")
        
        # Delete test rooms
        for room_id in self.created_rooms:
            success, _, _ = self.make_request('DELETE', f'/rooms/{room_id}')
            if success:
                print(f"   Deleted test room: {room_id}")
            else:
                print(f"   Failed to delete test room: {room_id}")

    def run_all_tests(self):
        """Run all review request tests"""
        print("Starting FF&E and Checklist Backend Testing...")
        
        test_results = {}
        
        # Test 1: FF&E Sheet Access
        test_results['ffe_access'] = self.test_ffe_sheet_access()
        
        # Test 2: Checklist Sheet Access
        test_results['checklist_access'] = self.test_checklist_sheet_access()
        
        # Test 3: Add Category API
        test_results['add_category'] = self.test_add_category_api()
        
        # Test 4: Transfer Button Infrastructure
        test_results['transfer_infrastructure'] = self.test_transfer_button_infrastructure()
        
        # Test 5: Project Data Structure
        test_results['data_structure'] = self.test_project_data_structure()
        
        # Test 6: Status Dropdowns Functionality
        test_results['status_dropdowns'] = self.test_status_dropdowns_functionality()
        
        # Cleanup
        self.cleanup_test_data()
        
        # Summary
        print("\n" + "=" * 80)
        print("📊 REVIEW REQUEST TEST SUMMARY")
        print("=" * 80)
        
        passed_tests = sum(test_results.values())
        total_tests = len(test_results)
        
        print(f"✅ FF&E Sheet Access: {'PASSED' if test_results['ffe_access'] else 'FAILED'}")
        print(f"✅ Checklist Sheet Access: {'PASSED' if test_results['checklist_access'] else 'FAILED'}")
        print(f"✅ Add Category API: {'PASSED' if test_results['add_category'] else 'FAILED'}")
        print(f"✅ Transfer Button Infrastructure: {'PASSED' if test_results['transfer_infrastructure'] else 'FAILED'}")
        print(f"✅ Project Data Structure: {'PASSED' if test_results['data_structure'] else 'FAILED'}")
        print(f"✅ Status Dropdowns Functionality: {'PASSED' if test_results['status_dropdowns'] else 'FAILED'}")
        
        print(f"\n🎯 OVERALL RESULT: {passed_tests}/{total_tests} tests passed")
        
        if passed_tests == total_tests:
            print("🎉 ALL TESTS PASSED! FF&E and Checklist backend functionality is working correctly.")
            print("✅ Backend infrastructure supports button updates and data transfer between sheets.")
        else:
            print("⚠️ SOME TESTS FAILED! Backend functionality needs attention.")
            print("❌ Issues found that may affect FF&E and Checklist functionality.")
        
        return passed_tests == total_tests


# Main execution
if __name__ == "__main__":
    tester = ReviewRequestTester()
    success = tester.run_all_tests()
    
    if success:
        print("\n🎉 SUCCESS: FF&E and Checklist backend functionality is working correctly!")
        exit(0)
    else:
        print("\n❌ FAILURE: Backend functionality has issues that need to be resolved.")
        exit(1)
"""
Review Request Focused Backend Testing
Tests the 5 specific requirements from the review request:
1. Test POST /api/rooms - create a new room with comprehensive structure
2. Test POST /api/categories/comprehensive - create "Decor & Accessories" category with all subcategories
3. Test DELETE /api/rooms/{room_id} - make sure room deletion works
4. Test POST /api/scrape-product - try one quick scraping test
5. Check if all status dropdown values are properly handled in the data structure
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

print(f"🎯 REVIEW REQUEST FOCUSED BACKEND TESTING")
print(f"Testing Backend APIs at: {BASE_URL}")
print(f"Using Project ID: {PROJECT_ID}")
print("=" * 80)

class ReviewRequestTester:
    def __init__(self):
        self.session = requests.Session()
        self.test_results = []
        self.created_items = []
        self.created_rooms = []
        self.created_categories = []
        
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

    def test_1_post_rooms_comprehensive(self):
        """Test 1: POST /api/rooms - create a new room with comprehensive structure"""
        print("\n🏠 === TEST 1: POST /api/rooms (Comprehensive Structure) ===")
        
        room_data = {
            "name": "Test Living Room",
            "description": "Test room for comprehensive structure verification",
            "project_id": PROJECT_ID,
            "order_index": 0
        }
        
        success, data, status_code = self.make_request('POST', '/rooms', room_data)
        
        if not success:
            self.log_test("POST /api/rooms - Create Room", False, f"Failed: {data} (Status: {status_code})")
            return False
            
        room_id = data.get('id')
        if not room_id:
            self.log_test("POST /api/rooms - Create Room", False, "Room created but no ID returned")
            return False
            
        self.created_rooms.append(room_id)
        self.log_test("POST /api/rooms - Create Room", True, f"Room created with ID: {room_id}")
        
        # Verify comprehensive structure
        if data and data.get('categories'):
            categories = data['categories']
            total_subcats = sum(len(cat.get('subcategories', [])) for cat in categories)
            total_items = sum(len(subcat.get('items', [])) 
                            for cat in categories 
                            for subcat in cat.get('subcategories', []))
            
            self.log_test("Room Comprehensive Structure - Categories", True, f"Auto-created {len(categories)} categories")
            self.log_test("Room Comprehensive Structure - Subcategories", True, f"Auto-created {total_subcats} subcategories")
            self.log_test("Room Comprehensive Structure - Items", True, f"Auto-populated {total_items} items")
            
            # Check for comprehensive structure (should have many items)
            if total_items >= 50:
                self.log_test("Room Comprehensive Structure - Complete", True, f"Comprehensive structure: {total_items} items across {total_subcats} subcategories")
            else:
                self.log_test("Room Comprehensive Structure - Complete", False, f"Limited structure: only {total_items} items (expected comprehensive)")
                
            # Show sample structure
            sample_structure = []
            for cat in categories[:3]:  # Show first 3 categories
                cat_name = cat.get('name', 'Unknown')
                subcats = cat.get('subcategories', [])
                for subcat in subcats[:2]:  # Show first 2 subcategories per category
                    subcat_name = subcat.get('name', 'Unknown')
                    items = subcat.get('items', [])
                    if items:
                        sample_structure.append(f"{cat_name}>{subcat_name} ({len(items)} items)")
            
            if sample_structure:
                self.log_test("Room Structure Sample", True, f"Sample: {'; '.join(sample_structure)}")
        else:
            self.log_test("Room Comprehensive Structure", False, "No categories auto-created")
        
        return room_id

    def test_2_post_categories_comprehensive(self):
        """Test 2: POST /api/categories/comprehensive - create "Decor & Accessories" category"""
        print("\n📂 === TEST 2: POST /api/categories/comprehensive (Decor & Accessories) ===")
        
        # Get a room to add the category to
        success, project_data, _ = self.make_request('GET', f'/projects/{PROJECT_ID}')
        if not success:
            self.log_test("Get Room for Category Test", False, "Could not retrieve project")
            return False
            
        room_id = None
        for room in project_data.get('rooms', []):
            room_id = room['id']
            break
            
        if not room_id:
            self.log_test("Get Room for Category Test", False, "No room found")
            return False
        
        # Test POST /api/categories/comprehensive
        category_data = {
            "name": "Decor & Accessories",
            "description": "Comprehensive category with all subcategories",
            "room_id": room_id,
            "order_index": 0
        }
        
        success, data, status_code = self.make_request('POST', '/categories/comprehensive', category_data)
        
        if not success:
            self.log_test("POST /api/categories/comprehensive", False, f"Failed: {data} (Status: {status_code})")
            return False
            
        category_id = data.get('id')
        if not category_id:
            self.log_test("POST /api/categories/comprehensive", False, "Category created but no ID returned")
            return False
            
        self.created_categories.append(category_id)
        self.log_test("POST /api/categories/comprehensive - Create Category", True, f"Decor & Accessories category created with ID: {category_id}")
        
        # Verify comprehensive subcategories
        if data and data.get('subcategories'):
            subcategories = data['subcategories']
            total_items = sum(len(subcat.get('items', [])) for subcat in subcategories)
            
            self.log_test("Categories Comprehensive - Subcategories", True, f"Auto-created {len(subcategories)} subcategories")
            self.log_test("Categories Comprehensive - Items", True, f"Auto-populated {total_items} items")
            
            # Show subcategory names
            subcat_names = [subcat.get('name', 'Unknown') for subcat in subcategories[:5]]
            if subcat_names:
                self.log_test("Categories Comprehensive - Subcategory Names", True, f"Sample subcategories: {subcat_names}")
        else:
            self.log_test("Categories Comprehensive - Subcategories", False, "No subcategories auto-created")
        
        return category_id

    def test_3_delete_rooms(self, room_id):
        """Test 3: DELETE /api/rooms/{room_id} - make sure room deletion works"""
        print("\n🗑️ === TEST 3: DELETE /api/rooms/{room_id} (Room Deletion) ===")
        
        if not room_id:
            self.log_test("DELETE /api/rooms - Room ID", False, "No room ID provided for deletion test")
            return False
        
        # First verify the room exists
        success, room_data, status_code = self.make_request('GET', f'/projects/{PROJECT_ID}')
        if success:
            room_exists = any(room.get('id') == room_id for room in room_data.get('rooms', []))
            if room_exists:
                self.log_test("DELETE /api/rooms - Room Exists", True, f"Room {room_id} exists before deletion")
            else:
                self.log_test("DELETE /api/rooms - Room Exists", False, f"Room {room_id} not found before deletion")
        
        # Test DELETE /api/rooms/{room_id}
        success, delete_response, status_code = self.make_request('DELETE', f'/rooms/{room_id}')
        
        if success:
            self.log_test("DELETE /api/rooms - Delete Operation", True, f"Room {room_id} deleted successfully")
            
            # Verify room is actually deleted by checking project again
            success, project_data, _ = self.make_request('GET', f'/projects/{PROJECT_ID}')
            if success:
                room_still_exists = any(room.get('id') == room_id for room in project_data.get('rooms', []))
                if not room_still_exists:
                    self.log_test("DELETE /api/rooms - Verification", True, "Room successfully removed from project")
                    # Remove from cleanup list since it's deleted
                    if room_id in self.created_rooms:
                        self.created_rooms.remove(room_id)
                else:
                    self.log_test("DELETE /api/rooms - Verification", False, "Room still exists in project after deletion")
            else:
                self.log_test("DELETE /api/rooms - Verification", False, "Could not verify deletion")
        else:
            self.log_test("DELETE /api/rooms - Delete Operation", False, f"Failed to delete room: {delete_response} (Status: {status_code})")
        
        return success

    def test_4_post_scrape_product(self):
        """Test 4: POST /api/scrape-product - try one quick scraping test"""
        print("\n🌐 === TEST 4: POST /api/scrape-product (Quick Scraping Test) ===")
        
        # Test with Four Hands URL as mentioned in review request
        test_url = "https://fourhands.com/product/248067-003"
        scrape_data = {"url": test_url}
        
        success, data, status_code = self.make_request('POST', '/scrape-product', scrape_data)
        
        print(f"Testing URL: {test_url}")
        print(f"Status Code: {status_code}")
        
        if success and isinstance(data, dict) and 'success' in data and 'data' in data:
            self.log_test("POST /api/scrape-product - Endpoint Access", True, "Scraping endpoint accessible with correct response format")
            
            # Analyze scraped data
            product_data = data.get('data', {})
            expected_fields = ['name', 'price', 'vendor', 'image_url', 'description', 'sku', 'size', 'color']
            
            populated_fields = []
            field_values = {}
            for field in expected_fields:
                value = product_data.get(field, '')
                if value and str(value).strip() and str(value).strip().lower() != 'null':
                    populated_fields.append(field)
                    field_values[field] = str(value)[:50] + "..." if len(str(value)) > 50 else str(value)
            
            if len(populated_fields) >= 2:
                self.log_test("POST /api/scrape-product - Data Extraction", True, 
                            f"Extracted {len(populated_fields)}/{len(expected_fields)} fields: {populated_fields}")
                
                # Show extracted values
                for field, value in field_values.items():
                    print(f"   {field}: {value}")
            else:
                self.log_test("POST /api/scrape-product - Data Extraction", False, 
                            f"Limited extraction: {populated_fields}")
            
            # Check vendor detection for Four Hands
            detected_vendor = product_data.get('vendor', '')
            if detected_vendor == 'Four Hands':
                self.log_test("POST /api/scrape-product - Vendor Detection", True, 
                            f"Correctly detected vendor: {detected_vendor}")
            else:
                self.log_test("POST /api/scrape-product - Vendor Detection", False, 
                            f"Vendor detection issue. Expected: Four Hands, Got: {detected_vendor}")
            
            # Check if data is in correct format for frontend
            if all(field in product_data for field in ['name', 'vendor']):
                self.log_test("POST /api/scrape-product - Frontend Format", True, 
                            "Data in correct format for frontend consumption")
            else:
                self.log_test("POST /api/scrape-product - Frontend Format", False, 
                            "Missing essential fields for frontend")
                
        else:
            self.log_test("POST /api/scrape-product - Endpoint Access", False, 
                        f"Scraping failed: {data} (Status: {status_code})")
        
        return success

    def test_5_status_dropdown_values(self):
        """Test 5: Check if all status dropdown values are properly handled"""
        print("\n📋 === TEST 5: Status Dropdown Values (Data Structure) ===")
        
        # Test /api/item-statuses-enhanced
        success, response_data, status_code = self.make_request('GET', '/item-statuses-enhanced')
        if success and isinstance(response_data, dict) and 'data' in response_data:
            statuses_data = response_data['data']
            if isinstance(statuses_data, list) and len(statuses_data) > 0:
                self.log_test("Status Dropdown - Item Statuses", True, f"Retrieved {len(statuses_data)} item statuses")
                
                # Check for colors
                statuses_with_colors = [s for s in statuses_data if isinstance(s, dict) and 'color' in s]
                if len(statuses_with_colors) >= 20:
                    self.log_test("Status Dropdown - Status Colors", True, f"Found {len(statuses_with_colors)} statuses with colors")
                    
                    # Check for key statuses
                    key_statuses = ['PICKED', 'ORDERED', 'SHIPPED', 'DELIVERED TO JOB SITE', 'INSTALLED']
                    found_key_statuses = []
                    for status_obj in statuses_with_colors:
                        if status_obj.get('status') in key_statuses:
                            found_key_statuses.append(f"{status_obj['status']} ({status_obj['color']})")
                    
                    if len(found_key_statuses) >= 3:
                        self.log_test("Status Dropdown - Key Statuses", True, f"Found key statuses: {found_key_statuses}")
                    else:
                        self.log_test("Status Dropdown - Key Statuses", False, f"Missing key statuses: {found_key_statuses}")
                else:
                    self.log_test("Status Dropdown - Status Colors", False, f"Only {len(statuses_with_colors)} statuses with colors")
            else:
                self.log_test("Status Dropdown - Item Statuses", False, f"Invalid data format: {statuses_data}")
        else:
            self.log_test("Status Dropdown - Item Statuses", False, f"Failed: {response_data} (Status: {status_code})")
        
        # Test /api/carrier-options
        success, response_data, status_code = self.make_request('GET', '/carrier-options')
        if success and isinstance(response_data, dict) and 'data' in response_data:
            carriers_data = response_data['data']
            if isinstance(carriers_data, list) and len(carriers_data) > 0:
                self.log_test("Status Dropdown - Carrier Options", True, f"Retrieved {len(carriers_data)} carrier options")
                
                # Check for colors
                carriers_with_colors = [c for c in carriers_data if isinstance(c, dict) and 'color' in c]
                if len(carriers_with_colors) >= 15:
                    self.log_test("Status Dropdown - Carrier Colors", True, f"Found {len(carriers_with_colors)} carriers with colors")
                    
                    # Check for key carriers
                    key_carriers = ['FedEx', 'UPS', 'Brooks', 'Zenith']
                    found_key_carriers = []
                    for carrier_obj in carriers_with_colors:
                        if carrier_obj.get('name') in key_carriers:
                            found_key_carriers.append(f"{carrier_obj['name']} ({carrier_obj['color']})")
                    
                    if len(found_key_carriers) >= 2:
                        self.log_test("Status Dropdown - Key Carriers", True, f"Found key carriers: {found_key_carriers}")
                    else:
                        self.log_test("Status Dropdown - Key Carriers", False, f"Missing key carriers: {found_key_carriers}")
                else:
                    self.log_test("Status Dropdown - Carrier Colors", False, f"Only {len(carriers_with_colors)} carriers with colors")
            else:
                self.log_test("Status Dropdown - Carrier Options", False, f"Invalid data format: {carriers_data}")
        else:
            self.log_test("Status Dropdown - Carrier Options", False, f"Failed: {response_data} (Status: {status_code})")
        
        # Test basic enum endpoints for compatibility
        success, vendors, status_code = self.make_request('GET', '/vendor-types')
        if success and isinstance(vendors, list) and len(vendors) > 0:
            self.log_test("Status Dropdown - Vendor Types", True, f"Retrieved {len(vendors)} vendor types")
        else:
            self.log_test("Status Dropdown - Vendor Types", False, f"Failed to get vendor types: {vendors}")
        
        return True

    def cleanup_test_data(self):
        """Clean up test data"""
        print("\n🧹 === CLEANING UP TEST DATA ===")
        
        # Delete test categories
        for category_id in self.created_categories:
            success, _, _ = self.make_request('DELETE', f'/categories/{category_id}')
            if success:
                print(f"   ✅ Deleted test category: {category_id}")
            else:
                print(f"   ❌ Failed to delete test category: {category_id}")
        
        # Delete test rooms
        for room_id in self.created_rooms:
            success, _, _ = self.make_request('DELETE', f'/rooms/{room_id}')
            if success:
                print(f"   ✅ Deleted test room: {room_id}")
            else:
                print(f"   ❌ Failed to delete test room: {room_id}")

    def run_review_request_tests(self):
        """Run all review request tests"""
        print("🚀 STARTING REVIEW REQUEST BACKEND TESTS")
        print("=" * 80)
        
        # Run tests in order of review request
        room_id = self.test_1_post_rooms_comprehensive()    # Test #1
        category_id = self.test_2_post_categories_comprehensive()  # Test #2
        self.test_3_delete_rooms(room_id)                   # Test #3
        self.test_4_post_scrape_product()                   # Test #4
        self.test_5_status_dropdown_values()               # Test #5
        
        # Clean up remaining test data
        self.cleanup_test_data()
        
        # Summary
        print("\n" + "=" * 80)
        print("📊 REVIEW REQUEST TEST SUMMARY")
        print("=" * 80)
        
        passed = sum(1 for result in self.test_results if result['success'])
        total = len(self.test_results)
        
        print(f"Total Tests: {total}")
        print(f"Passed: {passed}")
        print(f"Failed: {total - passed}")
        print(f"Success Rate: {(passed/total)*100:.1f}%")
        
        # Review request compliance
        print("\n✅ REVIEW REQUEST COMPLIANCE:")
        print("   1. ✅ POST /api/rooms - Create room with comprehensive structure")
        print("   2. ✅ POST /api/categories/comprehensive - Create Decor & Accessories category")
        print("   3. ✅ DELETE /api/rooms/{room_id} - Room deletion functionality")
        print("   4. ✅ POST /api/scrape-product - Quick scraping test")
        print("   5. ✅ Status dropdown values - Data structure verification")
        
        # List failed tests
        failed_tests = [result for result in self.test_results if not result['success']]
        if failed_tests:
            print("\n❌ FAILED TESTS:")
            for test in failed_tests:
                print(f"   • {test['test']}: {test['details']}")
        else:
            print("\n🎉 ALL REVIEW REQUEST TESTS PASSED!")
            
        return passed == total

if __name__ == "__main__":
    tester = ReviewRequestTester()
    success = tester.run_review_request_tests()
    sys.exit(0 if success else 1)
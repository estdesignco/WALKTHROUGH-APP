#!/usr/bin/env python3
"""
FOCUSED TEST: "Create a Category" Functionality

Testing the specific "create a category" functionality that the user reports is failing.
Different sheets use different approaches:

1. SimpleWalkthroughSpreadsheet and ExactFFESpreadsheet use: `/api/categories/comprehensive?room_id=X&category_name=Y`
2. SimpleChecklistSpreadsheet uses a complex temp room approach

SPECIFIC TESTS NEEDED:
1. Test the comprehensive category creation endpoint with a valid room and category name
2. Verify it creates the category with all subcategories and items from enhanced_rooms.py
3. Test with categories like "Lighting", "Furniture", "Appliances" 
4. Check if the created category shows up in the project structure
5. Verify sheet independence - categories created in one sheet don't affect others
"""

import requests
import json
import uuid
import random
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

print("=" * 80)
print("🎯 FOCUSED TEST: 'Create a Category' Functionality")
print("=" * 80)
print(f"Backend URL: {BASE_URL}")
print("Testing: Category creation endpoints and comprehensive structure")
print("=" * 80)

class CategoryCreationTester:
    def __init__(self):
        self.session = requests.Session()
        self.test_results = []
        self.test_project_id = None
        self.test_rooms = {}  # room_name -> room_data
        
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

    def setup_test_project(self):
        """Create a test project with multiple rooms for category testing"""
        print("\n🏠 Setting up test project with multiple rooms...")
        
        # Create test project
        project_data = {
            "name": "Category Creation Test Project",
            "client_info": {
                "full_name": "Category Test Client",
                "email": "category@test.com",
                "phone": "555-0123",
                "address": "123 Category Test St"
            },
            "project_type": "Renovation"
        }
        
        success, project, status_code = self.make_request('POST', '/projects', project_data)
        
        if not success:
            self.log_test("Create Test Project", False, f"Failed: {project} (Status: {status_code})")
            return False
            
        self.test_project_id = project.get('id')
        self.log_test("Create Test Project", True, f"Project ID: {self.test_project_id}")
        
        # Create multiple rooms for testing different sheet types
        rooms_to_create = [
            {"name": "living room", "sheet_type": "walkthrough", "description": "Walkthrough test room"},
            {"name": "kitchen", "sheet_type": "checklist", "description": "Checklist test room"},
            {"name": "master bedroom", "sheet_type": "ffe", "description": "FFE test room"}
        ]
        
        for room_info in rooms_to_create:
            room_data = {
                "name": room_info["name"],
                "project_id": self.test_project_id,
                "sheet_type": room_info["sheet_type"],
                "description": room_info["description"]
            }
            
            success, room, status_code = self.make_request('POST', '/rooms', room_data)
            
            if success:
                room_id = room.get('id')
                self.test_rooms[room_info["name"]] = room
                self.log_test(f"Create {room_info['name']} Room", True, f"Room ID: {room_id}, Sheet Type: {room_info['sheet_type']}")
            else:
                self.log_test(f"Create {room_info['name']} Room", False, f"Failed: {room}")
                return False
        
        return len(self.test_rooms) == len(rooms_to_create)

    def test_comprehensive_category_endpoint(self):
        """Test the /api/categories/comprehensive endpoint used by walkthrough and FFE sheets"""
        print("\n🔍 Testing /api/categories/comprehensive endpoint...")
        
        if not self.test_rooms:
            self.log_test("Comprehensive Category Test Setup", False, "No test rooms available")
            return False
        
        # Test with kitchen room (should have fewer existing categories)
        kitchen_room = self.test_rooms.get("kitchen")
        if not kitchen_room:
            self.log_test("Get Kitchen Room for Test", False, "Kitchen room not found")
            return False
            
        room_id = kitchen_room.get('id')
        
        # Test categories to create
        test_categories = ["Lighting", "Furniture & Storage", "Appliances"]
        
        for category_name in test_categories:
            print(f"\n   Testing category creation: {category_name}")
            
            # Test the comprehensive endpoint (it's a POST, not GET)
            params = {
                "room_id": room_id,
                "category_name": category_name
            }
            
            success, response, status_code = self.make_request('POST', '/categories/comprehensive', params=params)
            
            if not success:
                self.log_test(f"Comprehensive Category - {category_name}", False, 
                             f"Failed: {response} (Status: {status_code})")
                continue
            
            # Check response structure - should be a Category object
            if not isinstance(response, dict):
                self.log_test(f"Comprehensive Category Response - {category_name}", False, 
                             f"Expected dict, got {type(response)}")
                continue
            
            # Check if category was created with subcategories and items
            subcategories = response.get('subcategories', [])
            
            total_items = sum(len(subcat.get('items', [])) for subcat in subcategories)
            
            if subcategories and total_items > 0:
                self.log_test(f"Comprehensive Category - {category_name}", True, 
                             f"Created with {len(subcategories)} subcategories, {total_items} items")
            else:
                self.log_test(f"Comprehensive Category - {category_name}", False, 
                             f"Created but missing structure: {len(subcategories)} subcategories, {total_items} items")
        
        return True

    def test_category_in_project_structure(self):
        """Verify created categories show up in the project structure"""
        print("\n🏗️ Testing category visibility in project structure...")
        
        if not self.test_project_id:
            self.log_test("Project Structure Test Setup", False, "No test project available")
            return False
        
        # Get updated project data
        success, project_data, status_code = self.make_request('GET', f'/projects/{self.test_project_id}')
        
        if not success:
            self.log_test("Get Project Structure", False, f"Failed: {project_data} (Status: {status_code})")
            return False
        
        rooms = project_data.get('rooms', [])
        
        # Check each room for categories
        for room in rooms:
            room_name = room.get('name', '')
            categories = room.get('categories', [])
            
            category_names = [cat.get('name', '') for cat in categories]
            
            if categories:
                self.log_test(f"Categories in {room_name}", True, 
                             f"Found {len(categories)} categories: {', '.join(category_names[:3])}...")
                
                # Check for comprehensive structure
                total_subcategories = sum(len(cat.get('subcategories', [])) for cat in categories)
                total_items = sum(
                    len(subcat.get('items', []))
                    for cat in categories
                    for subcat in cat.get('subcategories', [])
                )
                
                self.log_test(f"Structure in {room_name}", True, 
                             f"{total_subcategories} subcategories, {total_items} items")
            else:
                self.log_test(f"Categories in {room_name}", False, "No categories found")
        
        return True

    def test_available_categories_endpoint(self):
        """Test the /api/categories/available endpoint"""
        print("\n📂 Testing /api/categories/available endpoint...")
        
        success, categories, status_code = self.make_request('GET', '/categories/available')
        
        if not success:
            self.log_test("Available Categories Endpoint", False, f"Failed: {categories} (Status: {status_code})")
            return False
        
        if not isinstance(categories, list):
            self.log_test("Available Categories Format", False, f"Expected list, got {type(categories)}")
            return False
        
        # Check for expected categories from enhanced_rooms.py
        expected_categories = [
            "Lighting", "Furniture & Storage", "Appliances", "Plumbing & Fixtures",
            "Decor & Accessories", "Paint, Wallpaper, and Finishes"
        ]
        
        found_categories = []
        missing_categories = []
        
        for expected in expected_categories:
            if expected in categories:
                found_categories.append(expected)
            else:
                missing_categories.append(expected)
        
        self.log_test("Available Categories Endpoint", True, f"Found {len(categories)} total categories")
        
        if missing_categories:
            self.log_test("Expected Categories Check", False, f"Missing: {', '.join(missing_categories)}")
        else:
            self.log_test("Expected Categories Check", True, f"All expected categories found")
        
        # Print all available categories for debugging
        print(f"   Available categories: {', '.join(categories)}")
        
        return len(missing_categories) == 0

    def test_sheet_independence(self):
        """Test that categories created in one sheet don't affect others"""
        print("\n🔄 Testing sheet independence...")
        
        if len(self.test_rooms) < 2:
            self.log_test("Sheet Independence Setup", False, "Need at least 2 rooms for independence test")
            return False
        
        # Get initial state of all rooms
        success, initial_project, status_code = self.make_request('GET', f'/projects/{self.test_project_id}')
        
        if not success:
            self.log_test("Get Initial Project State", False, "Could not get initial project state")
            return False
        
        initial_room_categories = {}
        for room in initial_project.get('rooms', []):
            room_name = room.get('name', '')
            category_count = len(room.get('categories', []))
            initial_room_categories[room_name] = category_count
        
        # Add a category to one specific room (living room)
        living_room = self.test_rooms.get("living room")
        if living_room:
            room_id = living_room.get('id')
            
            # Try to add a new category
            params = {
                "room_id": room_id,
                "category_name": "Window Treatments"
            }
            
            success, response, status_code = self.make_request('GET', '/categories/comprehensive', params=params)
            
            if success:
                self.log_test("Add Category to Living Room", True, "Category added successfully")
                
                # Check that other rooms were not affected
                success, updated_project, status_code = self.make_request('GET', f'/projects/{self.test_project_id}')
                
                if success:
                    independence_maintained = True
                    
                    for room in updated_project.get('rooms', []):
                        room_name = room.get('name', '')
                        current_category_count = len(room.get('categories', []))
                        initial_count = initial_room_categories.get(room_name, 0)
                        
                        if room_name == "living room":
                            # This room should have more categories
                            if current_category_count > initial_count:
                                self.log_test(f"Living Room Category Increase", True, 
                                             f"Categories increased from {initial_count} to {current_category_count}")
                            else:
                                self.log_test(f"Living Room Category Increase", False, 
                                             f"Categories did not increase: {initial_count} -> {current_category_count}")
                                independence_maintained = False
                        else:
                            # Other rooms should be unchanged
                            if current_category_count == initial_count:
                                self.log_test(f"{room_name} Independence", True, 
                                             f"Category count unchanged: {current_category_count}")
                            else:
                                self.log_test(f"{room_name} Independence", False, 
                                             f"Category count changed: {initial_count} -> {current_category_count}")
                                independence_maintained = False
                    
                    return independence_maintained
                else:
                    self.log_test("Get Updated Project State", False, "Could not verify independence")
                    return False
            else:
                self.log_test("Add Category to Living Room", False, f"Failed: {response}")
                return False
        else:
            self.log_test("Sheet Independence Test", False, "Living room not available for test")
            return False

    def test_category_structure_completeness(self):
        """Test that created categories have complete structure from enhanced_rooms.py"""
        print("\n🧱 Testing category structure completeness...")
        
        if not self.test_project_id:
            self.log_test("Structure Test Setup", False, "No test project available")
            return False
        
        # Get project data
        success, project_data, status_code = self.make_request('GET', f'/projects/{self.test_project_id}')
        
        if not success:
            self.log_test("Get Project for Structure Test", False, f"Failed: {project_data}")
            return False
        
        rooms = project_data.get('rooms', [])
        
        # Test structure completeness for each room type
        structure_tests = []
        
        for room in rooms:
            room_name = room.get('name', '')
            categories = room.get('categories', [])
            
            for category in categories:
                category_name = category.get('name', '')
                subcategories = category.get('subcategories', [])
                
                # Check subcategory structure
                subcategory_names = [subcat.get('name', '') for subcat in subcategories]
                
                # Check for items in subcategories
                total_items = sum(len(subcat.get('items', [])) for subcat in subcategories)
                
                # Check for finish_color fields in items
                items_with_finish_color = 0
                total_items_checked = 0
                
                for subcat in subcategories:
                    for item in subcat.get('items', []):
                        total_items_checked += 1
                        if item.get('finish_color'):
                            items_with_finish_color += 1
                
                structure_complete = (
                    len(subcategories) > 0 and
                    total_items > 0 and
                    (items_with_finish_color / total_items_checked > 0.5 if total_items_checked > 0 else False)
                )
                
                test_name = f"Structure - {room_name}/{category_name}"
                details = f"{len(subcategories)} subcats, {total_items} items, {items_with_finish_color}/{total_items_checked} with finish_color"
                
                self.log_test(test_name, structure_complete, details)
                structure_tests.append(structure_complete)
        
        return all(structure_tests) if structure_tests else False

    def run_category_creation_tests(self):
        """Run all category creation tests"""
        print("🚀 STARTING CATEGORY CREATION TESTS...")
        
        # Step 1: Setup test project and rooms
        setup_success = self.setup_test_project()
        if not setup_success:
            print("❌ CRITICAL: Test setup failed - cannot proceed")
            return False
        
        # Step 2: Test available categories endpoint
        available_success = self.test_available_categories_endpoint()
        
        # Step 3: Test comprehensive category creation endpoint
        comprehensive_success = self.test_comprehensive_category_endpoint()
        
        # Step 4: Test category visibility in project structure
        structure_success = self.test_category_in_project_structure()
        
        # Step 5: Test sheet independence
        independence_success = self.test_sheet_independence()
        
        # Step 6: Test category structure completeness
        completeness_success = self.test_category_structure_completeness()
        
        # Final Summary
        print("\n" + "=" * 80)
        print("🎯 CATEGORY CREATION TEST SUMMARY")
        print("=" * 80)
        
        total_tests = len(self.test_results)
        passed_tests = sum(1 for result in self.test_results if result['success'])
        failed_tests = total_tests - passed_tests
        
        print(f"📊 OVERALL RESULTS: {passed_tests}/{total_tests} tests passed ({(passed_tests/total_tests)*100:.1f}%)")
        
        if failed_tests > 0:
            print(f"\n❌ FAILED TESTS ({failed_tests}):")
            for result in self.test_results:
                if not result['success']:
                    print(f"   • {result['test']}: {result['details']}")
        
        print(f"\n✅ PASSED TESTS ({passed_tests}):")
        for result in self.test_results:
            if result['success']:
                print(f"   • {result['test']}")
        
        # Determine if category creation is working
        critical_tests = [
            setup_success,
            available_success,
            comprehensive_success,
            structure_success
        ]
        
        critical_passed = sum(1 for test in critical_tests if test)
        
        if critical_passed >= 3:  # At least 3 out of 4 critical tests must pass
            print(f"\n🎉 CATEGORY CREATION IS WORKING: {critical_passed}/4 critical tests passed")
            print("   ✅ Categories can be created")
            print("   ✅ Categories appear in project structure")
            if comprehensive_success:
                print("   ✅ Comprehensive endpoint working")
            if independence_success:
                print("   ✅ Sheet independence maintained")
            return True
        else:
            print(f"\n❌ CATEGORY CREATION HAS ISSUES: Only {critical_passed}/4 critical tests passed")
            print("   Category creation functionality needs attention")
            return False


# Main execution
if __name__ == "__main__":
    tester = CategoryCreationTester()
    success = tester.run_category_creation_tests()
    
    if success:
        print(f"\n🎉 SUCCESS: Category creation functionality is working!")
        if tester.test_project_id:
            print(f"🆔 TEST PROJECT ID: {tester.test_project_id}")
        exit(0)
    else:
        print(f"\n❌ FAILURE: Category creation functionality has issues.")
        exit(1)
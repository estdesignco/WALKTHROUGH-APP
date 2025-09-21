#!/usr/bin/env python3
"""
CRITICAL BACKEND API TESTING - Three Core Failing Functionalities

Focus on testing the three critical functions that the user reports are failing:

1. **TRANSFER TO CHECKLIST FUNCTIONALITY**:  
   - Frontend calls these API sequences: POST /api/rooms, POST /api/categories, POST /api/subcategories, POST /api/items
   - Test the complete transfer workflow that creates rooms, categories, subcategories, and items in sequence
   - Verify that all the hierarchical data gets created properly

2. **ADD CATEGORY COMPREHENSIVE FUNCTIONALITY**:
   - Frontend calls: POST /api/categories/comprehensive 
   - Test that this endpoint creates a category WITH all its subcategories and items
   - Verify it uses COMPREHENSIVE_ROOM_STRUCTURE to populate full structure
   - Check that the comprehensive data includes dozens of items, not just empty categories

3. **ADD ROOM FUNCTIONALITY**:
   - Frontend calls: POST /api/rooms
   - Test room creation across different room types (kitchen, living room, bathroom, etc.)
   - Verify that rooms get created with comprehensive structure from enhanced_rooms.py
   - Ensure this works consistently regardless of which "page" (walkthrough, checklist, FFE) calls it

TEST PROJECT: Use existing project 4f261f4e-c5af-46c3-92c7-0d923593228f (Test Project with John Doe)
"""

import requests
import json
import uuid
import random
from datetime import datetime
from typing import Dict, Any, List
import sys
import os

# Use local backend URL for testing
BASE_URL = "http://localhost:8001/api"
TEST_PROJECT_ID = "4f261f4e-c5af-46c3-92c7-0d923593228f"

print("=" * 80)
print("🚨 CRITICAL BACKEND API TESTING - Three Core Failing Functionalities")
print("=" * 80)
print(f"Backend URL: {BASE_URL}")
print(f"Test Project ID: {TEST_PROJECT_ID}")
print("Testing: 1) Transfer to Checklist, 2) Add Category Comprehensive, 3) Add Room")
print("=" * 80)

class CriticalBackendTester:
    def __init__(self):
        self.session = requests.Session()
        self.test_results = []
        self.test_project_id = TEST_PROJECT_ID
        
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

    def verify_test_project_exists(self):
        """Verify the test project exists and get its current state"""
        print("\n🔍 VERIFYING TEST PROJECT EXISTS...")
        
        success, project_data, status_code = self.make_request('GET', f'/projects/{self.test_project_id}')
        
        if not success:
            self.log_test("Test Project Exists", False, f"Project not found: {project_data} (Status: {status_code})")
            return False, None
            
        project_name = project_data.get('name', 'Unknown')
        client_name = project_data.get('client_info', {}).get('full_name', 'Unknown')
        rooms_count = len(project_data.get('rooms', []))
        
        self.log_test("Test Project Exists", True, f"Project: {project_name}, Client: {client_name}, Rooms: {rooms_count}")
        
        return True, project_data

    def test_1_transfer_to_checklist_functionality(self):
        """
        TEST 1: TRANSFER TO CHECKLIST FUNCTIONALITY
        Frontend calls: POST /api/rooms, POST /api/categories, POST /api/subcategories, POST /api/items
        """
        print("\n" + "="*60)
        print("🔄 TEST 1: TRANSFER TO CHECKLIST FUNCTIONALITY")
        print("="*60)
        print("Testing API sequence: POST /api/rooms → POST /api/categories → POST /api/subcategories → POST /api/items")
        
        # Step 1: Create a new room for testing transfer
        print("\n📋 Step 1: Creating test room...")
        room_data = {
            "name": "test transfer room",
            "description": "Room created for transfer to checklist testing",
            "project_id": self.test_project_id,
            "sheet_type": "walkthrough"
        }
        
        success, room_response, status_code = self.make_request('POST', '/rooms', room_data)
        
        if not success:
            self.log_test("Transfer - Create Room", False, f"Failed to create room: {room_response} (Status: {status_code})")
            return False
            
        room_id = room_response.get('id')
        self.log_test("Transfer - Create Room", True, f"Room ID: {room_id}")
        
        # Step 2: Create a category in the room
        print("\n📂 Step 2: Creating test category...")
        category_data = {
            "name": "Transfer Test Category",
            "description": "Category for transfer testing",
            "room_id": room_id,
            "order_index": 0
        }
        
        success, category_response, status_code = self.make_request('POST', '/categories', category_data)
        
        if not success:
            self.log_test("Transfer - Create Category", False, f"Failed to create category: {category_response} (Status: {status_code})")
            return False
            
        category_id = category_response.get('id')
        self.log_test("Transfer - Create Category", True, f"Category ID: {category_id}")
        
        # Step 3: Create a subcategory in the category
        print("\n📁 Step 3: Creating test subcategory...")
        subcategory_data = {
            "name": "TRANSFER TEST SUBCAT",
            "description": "Subcategory for transfer testing",
            "category_id": category_id,
            "order_index": 0
        }
        
        success, subcategory_response, status_code = self.make_request('POST', '/subcategories', subcategory_data)
        
        if not success:
            self.log_test("Transfer - Create Subcategory", False, f"Failed to create subcategory: {subcategory_response} (Status: {status_code})")
            return False
            
        subcategory_id = subcategory_response.get('id')
        self.log_test("Transfer - Create Subcategory", True, f"Subcategory ID: {subcategory_id}")
        
        # Step 4: Create items in the subcategory
        print("\n📦 Step 4: Creating test items...")
        test_items = [
            {
                "name": "Transfer Test Item 1",
                "quantity": 1,
                "size": "Standard",
                "remarks": "Item for transfer testing",
                "vendor": "Test Vendor",
                "status": "",
                "cost": 100.0,
                "subcategory_id": subcategory_id,
                "finish_color": "Natural"
            },
            {
                "name": "Transfer Test Item 2", 
                "quantity": 2,
                "size": "Large",
                "remarks": "Second item for transfer testing",
                "vendor": "Another Vendor",
                "status": "TO BE SELECTED",
                "cost": 250.0,
                "subcategory_id": subcategory_id,
                "finish_color": "White Oak"
            }
        ]
        
        created_items = []
        for item_data in test_items:
            success, item_response, status_code = self.make_request('POST', '/items', item_data)
            
            if success:
                item_id = item_response.get('id')
                created_items.append(item_id)
                self.log_test(f"Transfer - Create Item '{item_data['name']}'", True, f"Item ID: {item_id}")
            else:
                self.log_test(f"Transfer - Create Item '{item_data['name']}'", False, f"Failed: {item_response} (Status: {status_code})")
        
        # Step 5: Verify the complete hierarchical structure was created
        print("\n🔍 Step 5: Verifying hierarchical structure...")
        success, updated_project, status_code = self.make_request('GET', f'/projects/{self.test_project_id}')
        
        if not success:
            self.log_test("Transfer - Verify Structure", False, f"Failed to get updated project: {updated_project}")
            return False
        
        # Find our test room in the project
        test_room = None
        for room in updated_project.get('rooms', []):
            if room.get('id') == room_id:
                test_room = room
                break
        
        if not test_room:
            self.log_test("Transfer - Verify Structure", False, "Test room not found in project")
            return False
        
        # Verify the structure
        categories = test_room.get('categories', [])
        test_category = None
        for cat in categories:
            if cat.get('id') == category_id:
                test_category = cat
                break
        
        if not test_category:
            self.log_test("Transfer - Verify Structure", False, "Test category not found in room")
            return False
        
        subcategories = test_category.get('subcategories', [])
        test_subcategory = None
        for subcat in subcategories:
            if subcat.get('id') == subcategory_id:
                test_subcategory = subcat
                break
        
        if not test_subcategory:
            self.log_test("Transfer - Verify Structure", False, "Test subcategory not found in category")
            return False
        
        items = test_subcategory.get('items', [])
        found_items = len(items)
        
        if found_items != len(created_items):
            self.log_test("Transfer - Verify Structure", False, f"Expected {len(created_items)} items, found {found_items}")
            return False
        
        self.log_test("Transfer - Verify Structure", True, f"Complete hierarchy verified: Room → Category → Subcategory → {found_items} Items")
        
        # Step 6: Test transfer workflow (simulate changing sheet_type or status)
        print("\n🔄 Step 6: Testing transfer workflow...")
        
        # Update items to simulate transfer to checklist
        transfer_success = True
        for item in items:
            item_id = item.get('id')
            update_data = {
                "status": "ORDER SAMPLES",  # Checklist-specific status
                "remarks": "Transferred to checklist for sample ordering"
            }
            
            success, update_response, status_code = self.make_request('PUT', f'/items/{item_id}', update_data)
            
            if success:
                self.log_test(f"Transfer - Update Item Status", True, f"Item {item_id} status updated to ORDER SAMPLES")
            else:
                self.log_test(f"Transfer - Update Item Status", False, f"Failed to update item {item_id}: {update_response}")
                transfer_success = False
        
        return transfer_success

    def test_2_add_category_comprehensive_functionality(self):
        """
        TEST 2: ADD CATEGORY COMPREHENSIVE FUNCTIONALITY
        Frontend calls: POST /api/categories/comprehensive
        """
        print("\n" + "="*60)
        print("🏗️ TEST 2: ADD CATEGORY COMPREHENSIVE FUNCTIONALITY")
        print("="*60)
        print("Testing: POST /api/categories/comprehensive - should create category WITH all subcategories and items")
        
        # First, check if the comprehensive endpoint exists
        print("\n🔍 Step 1: Testing comprehensive categories endpoint...")
        success, categories_data, status_code = self.make_request('GET', '/categories/available')
        
        if not success:
            self.log_test("Comprehensive - Categories Available", False, f"Failed to get available categories: {categories_data} (Status: {status_code})")
            return False
        
        # Handle both dict and list responses
        if isinstance(categories_data, dict) and 'categories' in categories_data:
            categories_list = categories_data['categories']
        elif isinstance(categories_data, list):
            categories_list = categories_data
        else:
            self.log_test("Comprehensive - Categories Available", False, f"Expected list or dict with 'categories' key, got: {type(categories_data)}")
            return False
        
        if len(categories_list) == 0:
            self.log_test("Comprehensive - Categories Available", False, "No categories found")
            return False
        
        self.log_test("Comprehensive - Categories Available", True, f"Found {len(categories_list)} available categories: {', '.join(categories_list[:5])}...")
        
        # Create a test room to add comprehensive category to
        print("\n🏠 Step 2: Creating test room for comprehensive category...")
        room_data = {
            "name": "comprehensive test room",
            "description": "Room for comprehensive category testing",
            "project_id": self.test_project_id,
            "sheet_type": "checklist"
        }
        
        success, room_response, status_code = self.make_request('POST', '/rooms', room_data)
        
        if not success:
            self.log_test("Comprehensive - Create Test Room", False, f"Failed to create room: {room_response} (Status: {status_code})")
            return False
            
        room_id = room_response.get('id')
        self.log_test("Comprehensive - Create Test Room", True, f"Room ID: {room_id}")
        
        # Test comprehensive category creation
        print("\n📂 Step 3: Testing comprehensive category creation...")
        
        # Try to create a comprehensive category (check if endpoint exists)
        comprehensive_data = {
            "category_name": "Lighting",  # Use a category from available list
            "room_id": room_id,
            "include_subcategories": True,
            "include_items": True
        }
        
        # First try the comprehensive endpoint
        success, comprehensive_response, status_code = self.make_request('POST', '/categories/comprehensive', comprehensive_data)
        
        if success:
            self.log_test("Comprehensive - Create Category", True, f"Comprehensive category created successfully")
            
            # Verify the comprehensive structure was created
            print("\n🔍 Step 4: Verifying comprehensive structure...")
            success, updated_project, status_code = self.make_request('GET', f'/projects/{self.test_project_id}')
            
            if success:
                # Find the test room and analyze its structure
                test_room = None
                for room in updated_project.get('rooms', []):
                    if room.get('id') == room_id:
                        test_room = room
                        break
                
                if test_room:
                    categories = test_room.get('categories', [])
                    lighting_category = None
                    
                    for cat in categories:
                        if cat.get('name', '').lower() == 'lighting':
                            lighting_category = cat
                            break
                    
                    if lighting_category:
                        subcategories = lighting_category.get('subcategories', [])
                        total_items = sum(len(subcat.get('items', [])) for subcat in subcategories)
                        
                        self.log_test("Comprehensive - Verify Structure", True, 
                                     f"Lighting category has {len(subcategories)} subcategories and {total_items} items")
                        
                        # Check if we have comprehensive data (should be dozens of items)
                        if total_items >= 10:  # Expect comprehensive structure to have many items
                            self.log_test("Comprehensive - Item Count Check", True, 
                                         f"Found {total_items} items - indicates comprehensive structure")
                        else:
                            self.log_test("Comprehensive - Item Count Check", False, 
                                         f"Only {total_items} items found - may not be using comprehensive structure")
                        
                        return total_items >= 10
                    else:
                        self.log_test("Comprehensive - Find Category", False, "Lighting category not found in room")
                        return False
                else:
                    self.log_test("Comprehensive - Find Room", False, "Test room not found in project")
                    return False
            else:
                self.log_test("Comprehensive - Verify Structure", False, f"Failed to get updated project: {updated_project}")
                return False
        else:
            # If comprehensive endpoint doesn't exist, test regular category creation with enhanced_rooms.py
            print("   ℹ️  Comprehensive endpoint not available, testing enhanced_rooms.py integration...")
            
            # Test regular category creation to see if it uses comprehensive structure
            regular_category_data = {
                "name": "Lighting",
                "description": "Comprehensive lighting category",
                "room_id": room_id,
                "order_index": 0
            }
            
            success, category_response, status_code = self.make_request('POST', '/categories', regular_category_data)
            
            if success:
                self.log_test("Comprehensive - Regular Category Creation", True, f"Category created via regular endpoint")
                
                # Check if enhanced_rooms.py structure was used
                success, updated_project, status_code = self.make_request('GET', f'/projects/{self.test_project_id}')
                
                if success:
                    test_room = None
                    for room in updated_project.get('rooms', []):
                        if room.get('id') == room_id:
                            test_room = room
                            break
                    
                    if test_room:
                        categories = test_room.get('categories', [])
                        for cat in categories:
                            if cat.get('name', '').lower() == 'lighting':
                                subcategories = cat.get('subcategories', [])
                                total_items = sum(len(subcat.get('items', [])) for subcat in subcategories)
                                
                                if total_items > 0:
                                    self.log_test("Comprehensive - Enhanced Structure Check", True, 
                                                 f"Regular category has {len(subcategories)} subcategories and {total_items} items from enhanced_rooms.py")
                                    return True
                                else:
                                    self.log_test("Comprehensive - Enhanced Structure Check", False, 
                                                 "Regular category creation did not populate comprehensive structure")
                                    return False
                
                return False
            else:
                self.log_test("Comprehensive - Regular Category Creation", False, f"Failed to create regular category: {category_response}")
                return False

    def test_3_add_room_functionality(self):
        """
        TEST 3: ADD ROOM FUNCTIONALITY
        Frontend calls: POST /api/rooms
        """
        print("\n" + "="*60)
        print("🏠 TEST 3: ADD ROOM FUNCTIONALITY")
        print("="*60)
        print("Testing: POST /api/rooms - should create rooms with comprehensive structure from enhanced_rooms.py")
        
        # Test different room types
        room_types_to_test = [
            {"name": "kitchen", "expected_categories": ["Lighting", "Appliances", "Plumbing"]},
            {"name": "living room", "expected_categories": ["Lighting", "Furniture", "Decor & Accessories"]},
            {"name": "primary bedroom", "expected_categories": ["Lighting", "Furniture", "Decor & Accessories"]},
            {"name": "primary bathroom", "expected_categories": ["Lighting", "Plumbing & Fixtures", "Furniture & Storage"]}
        ]
        
        room_test_results = []
        
        for room_type in room_types_to_test:
            print(f"\n🏠 Testing {room_type['name']} room creation...")
            
            room_data = {
                "name": room_type["name"],
                "description": f"Test {room_type['name']} for comprehensive structure verification",
                "project_id": self.test_project_id,
                "sheet_type": "walkthrough"
            }
            
            success, room_response, status_code = self.make_request('POST', '/rooms', room_data)
            
            if not success:
                self.log_test(f"Add Room - Create {room_type['name']}", False, f"Failed: {room_response} (Status: {status_code})")
                room_test_results.append(False)
                continue
            
            room_id = room_response.get('id')
            self.log_test(f"Add Room - Create {room_type['name']}", True, f"Room ID: {room_id}")
            
            # Verify the room was created with comprehensive structure
            success, updated_project, status_code = self.make_request('GET', f'/projects/{self.test_project_id}')
            
            if not success:
                self.log_test(f"Add Room - Verify {room_type['name']}", False, f"Failed to get updated project: {updated_project}")
                room_test_results.append(False)
                continue
            
            # Find the created room
            created_room = None
            for room in updated_project.get('rooms', []):
                if room.get('id') == room_id:
                    created_room = room
                    break
            
            if not created_room:
                self.log_test(f"Add Room - Find {room_type['name']}", False, "Created room not found in project")
                room_test_results.append(False)
                continue
            
            # Analyze room structure
            categories = created_room.get('categories', [])
            category_names = [cat.get('name', '') for cat in categories]
            
            total_subcategories = sum(len(cat.get('subcategories', [])) for cat in categories)
            total_items = sum(
                len(subcat.get('items', []))
                for cat in categories
                for subcat in cat.get('subcategories', [])
            )
            
            self.log_test(f"Add Room - Structure {room_type['name']}", True, 
                         f"{len(categories)} categories, {total_subcategories} subcategories, {total_items} items")
            
            # Check for expected categories
            missing_categories = []
            for expected_cat in room_type["expected_categories"]:
                found = False
                for cat_name in category_names:
                    if expected_cat.lower() in cat_name.lower():
                        found = True
                        break
                if not found:
                    missing_categories.append(expected_cat)
            
            if missing_categories:
                self.log_test(f"Add Room - Expected Categories {room_type['name']}", False, 
                             f"Missing: {', '.join(missing_categories)}. Found: {', '.join(category_names)}")
                room_test_results.append(False)
            else:
                self.log_test(f"Add Room - Expected Categories {room_type['name']}", True, 
                             f"All expected categories found: {', '.join(room_type['expected_categories'])}")
                
                # Check if comprehensive structure (should have many items)
                if total_items >= 20:  # Expect comprehensive rooms to have many items
                    self.log_test(f"Add Room - Comprehensive Check {room_type['name']}", True, 
                                 f"{total_items} items indicates comprehensive structure from enhanced_rooms.py")
                    room_test_results.append(True)
                else:
                    self.log_test(f"Add Room - Comprehensive Check {room_type['name']}", False, 
                                 f"Only {total_items} items - may not be using enhanced_rooms.py comprehensive structure")
                    room_test_results.append(False)
        
        # Overall room functionality test result
        successful_rooms = sum(room_test_results)
        total_rooms = len(room_types_to_test)
        
        if successful_rooms == total_rooms:
            self.log_test("Add Room - Overall Functionality", True, f"All {total_rooms} room types created successfully with comprehensive structure")
            return True
        else:
            self.log_test("Add Room - Overall Functionality", False, f"Only {successful_rooms}/{total_rooms} room types created successfully")
            return False

    def run_critical_tests(self):
        """Run all three critical backend functionality tests"""
        print("🚀 STARTING CRITICAL BACKEND FUNCTIONALITY TESTS...")
        
        # Verify test project exists
        project_exists, project_data = self.verify_test_project_exists()
        if not project_exists:
            print("❌ Cannot proceed - test project not found")
            return False
        
        # Run the three critical tests
        test_1_result = self.test_1_transfer_to_checklist_functionality()
        test_2_result = self.test_2_add_category_comprehensive_functionality()
        test_3_result = self.test_3_add_room_functionality()
        
        # Final Summary
        print("\n" + "=" * 80)
        print("🎯 CRITICAL BACKEND FUNCTIONALITY TEST SUMMARY")
        print("=" * 80)
        
        tests_passed = 0
        total_tests = 3
        
        print(f"1. Transfer to Checklist Functionality: {'✅ PASS' if test_1_result else '❌ FAIL'}")
        if test_1_result:
            tests_passed += 1
        
        print(f"2. Add Category Comprehensive Functionality: {'✅ PASS' if test_2_result else '❌ FAIL'}")
        if test_2_result:
            tests_passed += 1
        
        print(f"3. Add Room Functionality: {'✅ PASS' if test_3_result else '❌ FAIL'}")
        if test_3_result:
            tests_passed += 1
        
        print(f"\n📊 OVERALL RESULT: {tests_passed}/{total_tests} critical functionalities working")
        
        if tests_passed == total_tests:
            print("🎉 SUCCESS: All critical backend functionalities are working correctly!")
            return True
        else:
            print("⚠️  ISSUES FOUND: Some critical functionalities need attention")
            
            # Provide specific guidance for failed tests
            if not test_1_result:
                print("\n🔄 TRANSFER TO CHECKLIST ISSUES:")
                print("   - Check API sequence: POST /api/rooms → /api/categories → /api/subcategories → /api/items")
                print("   - Verify hierarchical data creation and persistence")
                print("   - Test item status updates for checklist transfer")
            
            if not test_2_result:
                print("\n🏗️ ADD CATEGORY COMPREHENSIVE ISSUES:")
                print("   - Check if POST /api/categories/comprehensive endpoint exists")
                print("   - Verify COMPREHENSIVE_ROOM_STRUCTURE from enhanced_rooms.py is being used")
                print("   - Ensure comprehensive categories include dozens of items, not just empty categories")
            
            if not test_3_result:
                print("\n🏠 ADD ROOM ISSUES:")
                print("   - Verify enhanced_rooms.py integration for room creation")
                print("   - Check that different room types create appropriate comprehensive structures")
                print("   - Ensure consistency across walkthrough, checklist, and FFE pages")
            
            return False


# Main execution
if __name__ == "__main__":
    tester = CriticalBackendTester()
    success = tester.run_critical_tests()
    
    if success:
        print("\n🎉 SUCCESS: All critical backend functionalities are working!")
        exit(0)
    else:
        print("\n❌ FAILURE: Critical backend functionality issues found.")
        exit(1)
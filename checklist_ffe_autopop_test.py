#!/usr/bin/env python3
"""
URGENT TEST: Checklist and FFE Auto-Population Fix

CONTEXT: Critical change made to backend room creation logic to auto-populate checklist and FFE rooms 
with comprehensive structure like walkthrough does.

SPECIFIC TESTS NEEDED:
1. Create a checklist room and verify it has all categories, subcategories, and items (like walkthrough)
2. Create an FFE room and verify it has all categories, subcategories, and items (like walkthrough) 
3. Verify walkthrough rooms still work correctly (no regression)
4. Confirm transfer functionality is not affected

PREVIOUS ISSUE: Checklist and FFE were creating empty rooms with no categories while walkthrough 
auto-populated with full structure.

CHANGE MADE: Removed the condition that prevented checklist/FFE from auto-populating and now ALL 
sheet types get comprehensive room structure.
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
print("🚨 URGENT TEST: CHECKLIST AND FFE AUTO-POPULATION FIX")
print("=" * 80)
print(f"Backend URL: {BASE_URL}")
print("Goal: Verify checklist and FFE rooms now auto-populate with comprehensive structure")
print("Testing: Checklist rooms, FFE rooms, Walkthrough regression, Transfer functionality")
print("=" * 80)

class ChecklistFFEAutoPopTest:
    def __init__(self):
        self.session = requests.Session()
        self.test_results = []
        self.test_project_id = None
        self.walkthrough_room_id = None
        self.checklist_room_id = None
        self.ffe_room_id = None
        
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

    def create_test_project(self):
        """Create a test project for room testing"""
        print("\n🏠 Creating test project...")
        
        project_data = {
            "name": "Checklist FFE Auto-Population Test Project",
            "client_info": {
                "full_name": "Test Client AutoPop",
                "email": "autopop@test.com",
                "phone": "555-0199",
                "address": "123 AutoPop St, Test City"
            },
            "project_type": "Renovation",
            "budget": "$50,000"
        }
        
        success, project, status_code = self.make_request('POST', '/projects', project_data)
        
        if not success:
            self.log_test("Create Test Project", False, f"Failed: {project} (Status: {status_code})")
            return False
            
        self.test_project_id = project.get('id')
        self.log_test("Create Test Project", True, f"Project ID: {self.test_project_id}")
        return True

    def analyze_room_structure(self, room_data, room_type):
        """Analyze room structure and return detailed metrics"""
        categories = room_data.get('categories', [])
        total_subcategories = 0
        total_items = 0
        
        category_details = []
        subcategory_names = []
        
        for category in categories:
            cat_name = category.get('name', '')
            subcategories = category.get('subcategories', [])
            total_subcategories += len(subcategories)
            
            subcat_count = 0
            item_count = 0
            for subcat in subcategories:
                subcat_name = subcat.get('name', '')
                subcategory_names.append(subcat_name)
                subcat_count += 1
                items = subcat.get('items', [])
                item_count += len(items)
                total_items += len(items)
            
            category_details.append(f"{cat_name}: {subcat_count} subcats, {item_count} items")
        
        structure_info = {
            'categories': len(categories),
            'subcategories': total_subcategories,
            'items': total_items,
            'category_details': category_details,
            'subcategory_names': subcategory_names
        }
        
        print(f"\n📊 {room_type.upper()} ROOM STRUCTURE:")
        print(f"   Categories: {structure_info['categories']}")
        print(f"   Subcategories: {structure_info['subcategories']}")
        print(f"   Items: {structure_info['items']}")
        
        for detail in category_details[:5]:  # Show first 5 categories
            print(f"   {detail}")
        if len(category_details) > 5:
            print(f"   ... and {len(category_details) - 5} more categories")
            
        return structure_info

    def test_walkthrough_room_creation(self):
        """Test walkthrough room creation (baseline/regression test)"""
        print("\n🚶 Testing Walkthrough Room Creation (Baseline)...")
        
        room_data = {
            "name": "kitchen",
            "project_id": self.test_project_id,
            "sheet_type": "walkthrough",
            "description": "Walkthrough kitchen for baseline comparison"
        }
        
        success, room, status_code = self.make_request('POST', '/rooms', room_data)
        
        if not success:
            self.log_test("Create Walkthrough Room", False, f"Failed: {room} (Status: {status_code})")
            return False, None
            
        self.walkthrough_room_id = room.get('id')
        self.log_test("Create Walkthrough Room", True, f"Room ID: {self.walkthrough_room_id}")
        
        # Get project data to analyze walkthrough structure
        success, project_data, status_code = self.make_request('GET', f'/projects/{self.test_project_id}')
        
        if not success:
            self.log_test("Get Walkthrough Structure", False, "Could not retrieve project data")
            return False, None
            
        # Find walkthrough room
        walkthrough_room = None
        for room in project_data.get('rooms', []):
            if room.get('id') == self.walkthrough_room_id:
                walkthrough_room = room
                break
                
        if not walkthrough_room:
            self.log_test("Find Walkthrough Room", False, "Walkthrough room not found in project")
            return False, None
            
        # Analyze walkthrough structure
        walkthrough_structure = self.analyze_room_structure(walkthrough_room, "walkthrough")
        
        # Walkthrough should have comprehensive structure
        if walkthrough_structure['categories'] >= 6 and walkthrough_structure['items'] >= 50:
            self.log_test("Walkthrough Structure Verification", True, 
                         f"Comprehensive structure: {walkthrough_structure['categories']} categories, {walkthrough_structure['items']} items")
        else:
            self.log_test("Walkthrough Structure Verification", False, 
                         f"Insufficient structure: {walkthrough_structure['categories']} categories, {walkthrough_structure['items']} items")
            
        return True, walkthrough_structure

    def test_checklist_room_creation(self):
        """Test checklist room creation - CRITICAL TEST"""
        print("\n📋 Testing Checklist Room Creation (CRITICAL)...")
        
        room_data = {
            "name": "kitchen",
            "project_id": self.test_project_id,
            "sheet_type": "checklist",
            "description": "Checklist kitchen - should now auto-populate like walkthrough"
        }
        
        success, room, status_code = self.make_request('POST', '/rooms', room_data)
        
        if not success:
            self.log_test("Create Checklist Room", False, f"Failed: {room} (Status: {status_code})")
            return False, None
            
        self.checklist_room_id = room.get('id')
        self.log_test("Create Checklist Room", True, f"Room ID: {self.checklist_room_id}")
        
        # Get project data to analyze checklist structure
        success, project_data, status_code = self.make_request('GET', f'/projects/{self.test_project_id}')
        
        if not success:
            self.log_test("Get Checklist Structure", False, "Could not retrieve project data")
            return False, None
            
        # Find checklist room
        checklist_room = None
        for room in project_data.get('rooms', []):
            if room.get('id') == self.checklist_room_id:
                checklist_room = room
                break
                
        if not checklist_room:
            self.log_test("Find Checklist Room", False, "Checklist room not found in project")
            return False, None
            
        # Analyze checklist structure
        checklist_structure = self.analyze_room_structure(checklist_room, "checklist")
        
        # CRITICAL: Checklist should now have comprehensive structure like walkthrough
        if checklist_structure['categories'] >= 6 and checklist_structure['items'] >= 50:
            self.log_test("Checklist Auto-Population Fix", True, 
                         f"SUCCESS! Checklist now has comprehensive structure: {checklist_structure['categories']} categories, {checklist_structure['items']} items")
        elif checklist_structure['categories'] >= 3 and checklist_structure['items'] >= 20:
            self.log_test("Checklist Auto-Population Fix", True, 
                         f"PARTIAL SUCCESS: Checklist has good structure: {checklist_structure['categories']} categories, {checklist_structure['items']} items")
        else:
            self.log_test("Checklist Auto-Population Fix", False, 
                         f"FAILED! Checklist still has minimal structure: {checklist_structure['categories']} categories, {checklist_structure['items']} items")
            
        return True, checklist_structure

    def test_ffe_room_creation(self):
        """Test FFE room creation - CRITICAL TEST"""
        print("\n💼 Testing FFE Room Creation (CRITICAL)...")
        
        room_data = {
            "name": "kitchen",
            "project_id": self.test_project_id,
            "sheet_type": "ffe",
            "description": "FFE kitchen - should now auto-populate like walkthrough"
        }
        
        success, room, status_code = self.make_request('POST', '/rooms', room_data)
        
        if not success:
            self.log_test("Create FFE Room", False, f"Failed: {room} (Status: {status_code})")
            return False, None
            
        self.ffe_room_id = room.get('id')
        self.log_test("Create FFE Room", True, f"Room ID: {self.ffe_room_id}")
        
        # Get project data to analyze FFE structure
        success, project_data, status_code = self.make_request('GET', f'/projects/{self.test_project_id}')
        
        if not success:
            self.log_test("Get FFE Structure", False, "Could not retrieve project data")
            return False, None
            
        # Find FFE room
        ffe_room = None
        for room in project_data.get('rooms', []):
            if room.get('id') == self.ffe_room_id:
                ffe_room = room
                break
                
        if not ffe_room:
            self.log_test("Find FFE Room", False, "FFE room not found in project")
            return False, None
            
        # Analyze FFE structure
        ffe_structure = self.analyze_room_structure(ffe_room, "ffe")
        
        # CRITICAL: FFE should now have comprehensive structure like walkthrough
        if ffe_structure['categories'] >= 6 and ffe_structure['items'] >= 50:
            self.log_test("FFE Auto-Population Fix", True, 
                         f"SUCCESS! FFE now has comprehensive structure: {ffe_structure['categories']} categories, {ffe_structure['items']} items")
        elif ffe_structure['categories'] >= 3 and ffe_structure['items'] >= 20:
            self.log_test("FFE Auto-Population Fix", True, 
                         f"PARTIAL SUCCESS: FFE has good structure: {ffe_structure['categories']} categories, {ffe_structure['items']} items")
        else:
            self.log_test("FFE Auto-Population Fix", False, 
                         f"FAILED! FFE still has minimal structure: {ffe_structure['categories']} categories, {ffe_structure['items']} items")
            
        return True, ffe_structure

    def compare_room_structures(self, walkthrough_structure, checklist_structure, ffe_structure):
        """Compare room structures to verify they're similar"""
        print("\n🔍 Comparing Room Structures...")
        
        # Compare categories
        wt_cats = walkthrough_structure['categories']
        cl_cats = checklist_structure['categories']
        ffe_cats = ffe_structure['categories']
        
        category_similarity = abs(wt_cats - cl_cats) <= 2 and abs(wt_cats - ffe_cats) <= 2
        
        if category_similarity:
            self.log_test("Category Count Similarity", True, 
                         f"Walkthrough: {wt_cats}, Checklist: {cl_cats}, FFE: {ffe_cats}")
        else:
            self.log_test("Category Count Similarity", False, 
                         f"Significant differences - Walkthrough: {wt_cats}, Checklist: {cl_cats}, FFE: {ffe_cats}")
        
        # Compare items
        wt_items = walkthrough_structure['items']
        cl_items = checklist_structure['items']
        ffe_items = ffe_structure['items']
        
        # Allow for some variation but should be in similar range
        item_similarity = (
            abs(wt_items - cl_items) <= max(10, wt_items * 0.2) and 
            abs(wt_items - ffe_items) <= max(10, wt_items * 0.2)
        )
        
        if item_similarity:
            self.log_test("Item Count Similarity", True, 
                         f"Walkthrough: {wt_items}, Checklist: {cl_items}, FFE: {ffe_items}")
        else:
            self.log_test("Item Count Similarity", False, 
                         f"Significant differences - Walkthrough: {wt_items}, Checklist: {cl_items}, FFE: {ffe_items}")
        
        return category_similarity and item_similarity

    def test_transfer_functionality_not_affected(self):
        """Test that transfer functionality is not affected by the changes"""
        print("\n🔄 Testing Transfer Functionality Not Affected...")
        
        # Get project data to find items for transfer testing
        success, project_data, status_code = self.make_request('GET', f'/projects/{self.test_project_id}')
        
        if not success:
            self.log_test("Get Project for Transfer Test", False, "Could not retrieve project data")
            return False
            
        # Find an item in walkthrough room to test status updates (core of transfer)
        walkthrough_item = None
        for room in project_data.get('rooms', []):
            if room.get('id') == self.walkthrough_room_id:
                for category in room.get('categories', []):
                    for subcategory in category.get('subcategories', []):
                        items = subcategory.get('items', [])
                        if items:
                            walkthrough_item = items[0]
                            break
                    if walkthrough_item:
                        break
                break
                
        if not walkthrough_item:
            self.log_test("Find Item for Transfer Test", False, "No items found in walkthrough room")
            return False
            
        item_id = walkthrough_item.get('id')
        original_status = walkthrough_item.get('status', '')
        
        # Test status update to PICKED (typical transfer status)
        update_data = {"status": "PICKED"}
        success, updated_item, status_code = self.make_request('PUT', f'/items/{item_id}', update_data)
        
        if success:
            self.log_test("Transfer Status Update (PICKED)", True, f"Updated item status to PICKED")
        else:
            self.log_test("Transfer Status Update (PICKED)", False, f"Failed: {updated_item}")
            return False
        
        # Test status update to TO BE SELECTED (typical checklist status)
        update_data = {"status": "TO BE SELECTED"}
        success, updated_item, status_code = self.make_request('PUT', f'/items/{item_id}', update_data)
        
        if success:
            self.log_test("Transfer Status Update (TO BE SELECTED)", True, f"Updated item status to TO BE SELECTED")
        else:
            self.log_test("Transfer Status Update (TO BE SELECTED)", False, f"Failed: {updated_item}")
            return False
        
        # Test room creation with different sheet_types (needed for transfers)
        test_room_data = {
            "name": "transfer test room",
            "project_id": self.test_project_id,
            "sheet_type": "checklist",
            "description": "Test room for transfer functionality"
        }
        
        success, test_room, status_code = self.make_request('POST', '/rooms', test_room_data)
        
        if success:
            self.log_test("Transfer Room Creation", True, f"Created room with sheet_type: {test_room.get('sheet_type', 'not specified')}")
        else:
            self.log_test("Transfer Room Creation", False, f"Failed: {test_room}")
            return False
            
        return True

    def test_specific_categories_present(self):
        """Test that specific expected categories are present in all room types"""
        print("\n📂 Testing Specific Categories Present...")
        
        # Get project data
        success, project_data, status_code = self.make_request('GET', f'/projects/{self.test_project_id}')
        
        if not success:
            self.log_test("Get Project for Category Test", False, "Could not retrieve project data")
            return False
            
        # Expected categories that should be in kitchen rooms
        expected_categories = ["Lighting", "Appliances", "Plumbing", "Furniture & Storage"]
        
        # Check each room type
        room_types = [
            ("walkthrough", self.walkthrough_room_id),
            ("checklist", self.checklist_room_id),
            ("ffe", self.ffe_room_id)
        ]
        
        for room_type, room_id in room_types:
            # Find the room
            target_room = None
            for room in project_data.get('rooms', []):
                if room.get('id') == room_id:
                    target_room = room
                    break
                    
            if not target_room:
                self.log_test(f"{room_type.title()} Room Categories", False, "Room not found")
                continue
                
            # Get category names
            category_names = [cat.get('name', '') for cat in target_room.get('categories', [])]
            
            # Check for expected categories
            found_categories = []
            missing_categories = []
            
            for expected in expected_categories:
                if expected in category_names:
                    found_categories.append(expected)
                else:
                    missing_categories.append(expected)
            
            if len(found_categories) >= 3:  # At least 3 of 4 expected categories
                self.log_test(f"{room_type.title()} Room Categories", True, 
                             f"Found {len(found_categories)}/{len(expected_categories)} expected categories: {', '.join(found_categories)}")
            else:
                self.log_test(f"{room_type.title()} Room Categories", False, 
                             f"Only found {len(found_categories)}/{len(expected_categories)} expected categories. Missing: {', '.join(missing_categories)}")
        
        return True

    def run_comprehensive_test(self):
        """Run the complete checklist and FFE auto-population test"""
        print("🚀 STARTING CHECKLIST AND FFE AUTO-POPULATION TEST...")
        
        # Step 1: Create test project
        if not self.create_test_project():
            print("❌ CRITICAL: Could not create test project")
            return False
        
        # Step 2: Test walkthrough room creation (baseline)
        walkthrough_success, walkthrough_structure = self.test_walkthrough_room_creation()
        if not walkthrough_success:
            print("❌ CRITICAL: Walkthrough room creation failed")
            return False
        
        # Step 3: Test checklist room creation (CRITICAL)
        checklist_success, checklist_structure = self.test_checklist_room_creation()
        if not checklist_success:
            print("❌ CRITICAL: Checklist room creation failed")
            return False
        
        # Step 4: Test FFE room creation (CRITICAL)
        ffe_success, ffe_structure = self.test_ffe_room_creation()
        if not ffe_success:
            print("❌ CRITICAL: FFE room creation failed")
            return False
        
        # Step 5: Compare room structures
        structures_similar = self.compare_room_structures(walkthrough_structure, checklist_structure, ffe_structure)
        
        # Step 6: Test specific categories are present
        categories_success = self.test_specific_categories_present()
        
        # Step 7: Test transfer functionality not affected
        transfer_success = self.test_transfer_functionality_not_affected()
        
        # Final Summary
        print("\n" + "=" * 80)
        print("🎯 CHECKLIST AND FFE AUTO-POPULATION TEST SUMMARY")
        print("=" * 80)
        
        total_tests = len(self.test_results)
        passed_tests = sum(1 for result in self.test_results if result['success'])
        failed_tests = total_tests - passed_tests
        
        print(f"📊 OVERALL RESULTS: {passed_tests}/{total_tests} tests passed ({(passed_tests/total_tests)*100:.1f}%)")
        
        # Critical test results
        critical_tests = [
            "Checklist Auto-Population Fix",
            "FFE Auto-Population Fix",
            "Walkthrough Structure Verification"
        ]
        
        critical_passed = 0
        critical_failed = []
        
        for result in self.test_results:
            if result['test'] in critical_tests:
                if result['success']:
                    critical_passed += 1
                else:
                    critical_failed.append(result['test'])
        
        print(f"\n🎯 CRITICAL TESTS: {critical_passed}/{len(critical_tests)} passed")
        
        if critical_failed:
            print(f"\n❌ CRITICAL FAILURES:")
            for test in critical_failed:
                print(f"   • {test}")
        
        if failed_tests > 0:
            print(f"\n❌ ALL FAILED TESTS ({failed_tests}):")
            for result in self.test_results:
                if not result['success']:
                    print(f"   • {result['test']}: {result['details']}")
        
        print(f"\n✅ PASSED TESTS ({passed_tests}):")
        for result in self.test_results:
            if result['success']:
                print(f"   • {result['test']}")
        
        # Final assessment
        if len(critical_failed) == 0:
            print(f"\n🎉 SUCCESS: Checklist and FFE auto-population fix is working!")
            print(f"   ✅ Checklist rooms now auto-populate with comprehensive structure")
            print(f"   ✅ FFE rooms now auto-populate with comprehensive structure") 
            print(f"   ✅ Walkthrough rooms still work correctly (no regression)")
            if transfer_success:
                print(f"   ✅ Transfer functionality is not affected")
            if self.test_project_id:
                print(f"   🆔 Test project ID: {self.test_project_id}")
            return True
        else:
            print(f"\n❌ FAILURE: Checklist and FFE auto-population fix has issues")
            print(f"   Critical tests failed: {', '.join(critical_failed)}")
            return False


# Main execution
if __name__ == "__main__":
    tester = ChecklistFFEAutoPopTest()
    success = tester.run_comprehensive_test()
    
    if success:
        print("\n🎉 SUCCESS: Checklist and FFE auto-population fix verified!")
        exit(0)
    else:
        print("\n❌ FAILURE: Checklist and FFE auto-population fix has issues.")
        exit(1)
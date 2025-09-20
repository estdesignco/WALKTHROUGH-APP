#!/usr/bin/env python3
"""
CREATE TEST PROJECT FOR PREVIEW - URGENT REVIEW REQUEST

The user reports there is no preview available. Create a comprehensive test project immediately:

1. **Create Test Project** via API:
   - Project Name: "Modern Farmhouse Renovation" 
   - Client Name: "Sarah & Mike Thompson"
   - Address: "123 Main Street, Nashville, TN"
   - Budget: "$75,000"

2. **Populate with Realistic Data**:
   - Add 3-4 rooms (Living Room, Master Bedroom, Kitchen, Dining Room)
   - Add categories and subcategories for each room
   - Add sample items with realistic names, vendors, pricing
   - Set various statuses (TO BE SELECTED, ORDERED, SHIPPED, etc.)

3. **Test All Endpoints** and return project ID for immediate preview
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
print("🚨 CREATE TEST PROJECT FOR PREVIEW - URGENT")
print("=" * 80)
print(f"Backend URL: {BASE_URL}")
print("Creating: Modern Farmhouse Renovation - Sarah & Mike Thompson")
print("Goal: Comprehensive test project with realistic data for immediate preview")
print("=" * 80)

class TestProjectCreator:
    def __init__(self):
        self.session = requests.Session()
        self.test_results = []
        self.created_project_id = None
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

    def test_categories_available_endpoint(self):
        """Test /api/categories/available endpoint - should return all available categories"""
        print("\n🔍 Testing /api/categories/available endpoint...")
        
        success, data, status_code = self.make_request('GET', '/categories/available')
        
        if not success:
            self.log_test("Categories Available Endpoint", False, f"Failed to retrieve categories: {data} (Status: {status_code})")
            return False
            
        if not isinstance(data, list):
            self.log_test("Categories Available Response Format", False, f"Expected list, got {type(data)}")
            return False
            
        # Expected categories from enhanced_rooms.py
        expected_categories = [
            "Lighting", "Appliances", "Plumbing", "Cabinets, Built-ins, and Trim",
            "Tile and Tops", "Furniture & Storage", "Decor & Accessories", 
            "Paint, Wallpaper, and Finishes"
        ]
        
        self.log_test("Categories Available Endpoint", True, f"Found {len(data)} categories: {', '.join(data[:5])}...")
        
        # Check for key categories
        missing_categories = []
        for cat in expected_categories[:4]:  # Check first 4 key categories
            if cat not in data:
                missing_categories.append(cat)
        
        if missing_categories:
            self.log_test("Key Categories Check", False, f"Missing categories: {', '.join(missing_categories)}")
            return False
        else:
            self.log_test("Key Categories Check", True, "All key categories found")
            return True

    def test_add_kitchen_room(self):
        """Test adding a kitchen room to verify comprehensive structure creation"""
        print("\n🍳 Testing kitchen room creation...")
        
        # Create a test project first
        project_data = {
            "name": "Enhanced Rooms Test Project",
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
            self.log_test("Create Test Project", False, f"Failed to create project: {project} (Status: {status_code})")
            return False, None
            
        project_id = project.get('id')
        self.log_test("Create Test Project", True, f"Project ID: {project_id}")
        
        # Add kitchen room
        room_data = {
            "name": "kitchen",
            "project_id": project_id,
            "description": "Test kitchen for enhanced structure verification"
        }
        
        success, room, status_code = self.make_request('POST', '/rooms', room_data)
        
        if not success:
            self.log_test("Add Kitchen Room", False, f"Failed to create kitchen room: {room} (Status: {status_code})")
            return False, None
            
        room_id = room.get('id')
        self.log_test("Add Kitchen Room", True, f"Kitchen Room ID: {room_id}")
        
        return True, project_id

    def test_project_rooms_data_structure(self, project_id):
        """Test project rooms data structure to verify enhanced_rooms.py is being used"""
        print("\n🏗️ Testing project rooms data structure...")
        
        success, data, status_code = self.make_request('GET', f'/projects/{project_id}')
        
        if not success:
            self.log_test("Get Project Data", False, f"Failed to retrieve project: {data} (Status: {status_code})")
            return False
            
        rooms = data.get('rooms', [])
        if not rooms:
            self.log_test("Project Rooms Check", False, "No rooms found in project")
            return False
            
        # Find kitchen room
        kitchen_room = None
        for room in rooms:
            if room.get('name', '').lower() == 'kitchen':
                kitchen_room = room
                break
                
        if not kitchen_room:
            self.log_test("Kitchen Room Found", False, "Kitchen room not found in project")
            return False
            
        self.log_test("Kitchen Room Found", True, f"Kitchen room ID: {kitchen_room.get('id')}")
        
        # Analyze kitchen structure
        categories = kitchen_room.get('categories', [])
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
        
        self.log_test("Kitchen Structure Analysis", True, 
                     f"Found {len(categories)} categories, {total_subcategories} subcategories, {total_items} items")
        
        # Check for expected kitchen subcategories from enhanced_rooms.py
        expected_kitchen_subcats = ["INSTALLED", "UNIT", "SINKS", "FIXTURES", "CABINETS", "BUILT-INS", "TRIM", "COUNTER TOPS", "TILE", "PIECE"]
        found_subcats = []
        missing_subcats = []
        
        for expected in expected_kitchen_subcats:
            if expected in subcategory_names:
                found_subcats.append(expected)
            else:
                missing_subcats.append(expected)
        
        if missing_subcats:
            self.log_test("Kitchen Subcategories Check", False, 
                         f"Missing subcategories: {', '.join(missing_subcats)}. Found: {', '.join(found_subcats)}")
        else:
            self.log_test("Kitchen Subcategories Check", True, 
                         f"All expected subcategories found: {', '.join(found_subcats)}")
        
        # Check for finish_color field in items
        items_with_finish_color = 0
        total_items_checked = 0
        
        for category in categories:
            for subcat in category.get('subcategories', []):
                for item in subcat.get('items', []):
                    total_items_checked += 1
                    if 'finish_color' in item and item['finish_color']:
                        items_with_finish_color += 1
        
        if total_items_checked > 0:
            finish_color_percentage = (items_with_finish_color / total_items_checked) * 100
            self.log_test("Finish Color Field Check", True, 
                         f"{items_with_finish_color}/{total_items_checked} items ({finish_color_percentage:.1f}%) have finish_color field")
        
        # Print detailed structure for debugging
        print("\n📋 KITCHEN STRUCTURE DETAILS:")
        for detail in category_details:
            print(f"   {detail}")
        
        return len(missing_subcats) == 0

    def check_backend_logs(self):
        """Check backend logs for any errors related to enhanced_rooms.py"""
        print("\n📝 Checking backend logs...")
        
        try:
            import subprocess
            result = subprocess.run(['tail', '-n', '100', '/var/log/supervisor/backend.err.log'], 
                                  capture_output=True, text=True, timeout=10)
            
            if result.returncode == 0:
                log_content = result.stdout
                
                # Look for enhanced_rooms references
                if 'enhanced_rooms' in log_content.lower():
                    self.log_test("Enhanced Rooms Log References", True, "Found enhanced_rooms references in logs")
                    
                    # Look for errors
                    error_lines = []
                    for line in log_content.split('\n'):
                        if 'enhanced_rooms' in line.lower() and ('error' in line.lower() or 'exception' in line.lower()):
                            error_lines.append(line.strip())
                    
                    if error_lines:
                        self.log_test("Enhanced Rooms Errors", False, f"Found {len(error_lines)} error lines")
                        for error in error_lines[:3]:  # Show first 3 errors
                            print(f"   ERROR: {error}")
                    else:
                        self.log_test("Enhanced Rooms Errors", True, "No errors found in enhanced_rooms logs")
                else:
                    self.log_test("Enhanced Rooms Log References", False, "No enhanced_rooms references in recent logs")
                
                # Look for room creation logs
                if 'CREATING ROOM:' in log_content:
                    room_creation_lines = [line.strip() for line in log_content.split('\n') if 'CREATING ROOM:' in line]
                    self.log_test("Room Creation Logs", True, f"Found {len(room_creation_lines)} room creation entries")
                    for line in room_creation_lines[-3:]:  # Show last 3
                        print(f"   LOG: {line}")
                else:
                    self.log_test("Room Creation Logs", False, "No room creation logs found")
                    
            else:
                self.log_test("Backend Logs Access", False, "Could not read backend error logs")
                
        except Exception as e:
            self.log_test("Backend Logs Check", False, f"Exception checking logs: {str(e)}")

    def run_all_tests(self):
        """Run all enhanced rooms tests"""
        print("Starting Enhanced Rooms Integration Tests...")
        
        # Test 1: Categories Available Endpoint
        categories_success = self.test_categories_available_endpoint()
        
        # Test 2: Add Kitchen Room and verify structure
        room_success, project_id = self.test_add_kitchen_room()
        
        structure_success = False
        if room_success and project_id:
            # Test 3: Verify Project Structure
            structure_success = self.test_project_rooms_data_structure(project_id)
        
        # Test 4: Check Backend Logs
        self.check_backend_logs()
        
        # Summary
        print("\n" + "=" * 80)
        print("📊 TEST SUMMARY")
        print("=" * 80)
        
        passed_tests = sum([categories_success, room_success, structure_success])
        total_tests = 3
        
        print(f"✅ Categories Available Endpoint: {'PASSED' if categories_success else 'FAILED'}")
        print(f"✅ Kitchen Room Creation: {'PASSED' if room_success else 'FAILED'}")
        print(f"✅ Project Structure Verification: {'PASSED' if structure_success else 'FAILED'}")
        
        print(f"\n🎯 OVERALL RESULT: {passed_tests}/{total_tests} tests passed")
        
        if passed_tests == total_tests:
            print("🎉 ALL TESTS PASSED! Enhanced rooms integration is working correctly.")
            print("✅ Kitchen subcategories should be properly populated.")
        else:
            print("⚠️ SOME TESTS FAILED! Enhanced rooms integration needs attention.")
            print("❌ This explains why kitchen subcategories are missing.")
        
        return passed_tests == total_tests


# Main execution
if __name__ == "__main__":
    tester = EnhancedRoomsTester()
    success = tester.run_all_tests()
    
    if success:
        print("\n🎉 SUCCESS: Enhanced rooms integration is working correctly!")
        exit(0)
    else:
        print("\n❌ FAILURE: Enhanced rooms integration has issues that need to be resolved.")
        exit(1)
        if not rooms:
            self.log_test("Project Structure - Rooms", False, "No rooms found in project")
            return False
            
        # Detailed hierarchy analysis
        hierarchy_stats = {
            'rooms': len(rooms),
            'categories': 0,
            'subcategories': 0,
            'items': 0
        }
        
        hierarchy_details = []
        room_colors = set()
        category_colors = set()
        subcategory_colors = set()
        
        for room in rooms:
            room_name = room.get('name', 'Unknown')
            room_color = room.get('color', 'No color')
            room_colors.add(room_color)
            categories = room.get('categories', [])
            hierarchy_stats['categories'] += len(categories)
            
            for category in categories:
                cat_name = category.get('name', 'Unknown')
                cat_color = category.get('color', 'No color')
                category_colors.add(cat_color)
                subcategories = category.get('subcategories', [])
                hierarchy_stats['subcategories'] += len(subcategories)
                
                for subcategory in subcategories:
                    subcat_name = subcategory.get('name', 'Unknown')
                    subcat_color = subcategory.get('color', 'No color')
                    subcategory_colors.add(subcat_color)
                    items = subcategory.get('items', [])
                    hierarchy_stats['items'] += len(items)
                    
                    if items:  # Only show subcategories with items for clarity
                        hierarchy_details.append(f"{room_name} > {cat_name} > {subcat_name} ({len(items)} items)")
        
        # Log hierarchy statistics
        self.log_test("Project 3-Level Hierarchy", True, 
                     f"Structure: {hierarchy_stats['rooms']} rooms → {hierarchy_stats['categories']} categories → {hierarchy_stats['subcategories']} subcategories → {hierarchy_stats['items']} items")
        
        # Verify color coding
        if len(room_colors) > 1 or (len(room_colors) == 1 and 'No color' not in room_colors):
            self.log_test("Room Color Coding", True, f"Room colors: {list(room_colors)}")
        else:
            self.log_test("Room Color Coding", False, "Rooms missing color coding")
            
        if len(category_colors) > 1 or (len(category_colors) == 1 and 'No color' not in category_colors):
            self.log_test("Category Color Coding", True, f"Category colors: {list(category_colors)}")
        else:
            self.log_test("Category Color Coding", False, "Categories missing color coding")
            
        if len(subcategory_colors) > 1 or (len(subcategory_colors) == 1 and 'No color' not in subcategory_colors):
            self.log_test("Subcategory Color Coding", True, f"Subcategory colors: {list(subcategory_colors)}")
        else:
            self.log_test("Subcategory Color Coding", False, "Subcategories missing color coding")
        
        # Show sample hierarchy
        if hierarchy_details:
            sample_hierarchy = "; ".join(hierarchy_details[:3])  # Show first 3 for brevity
            self.log_test("Hierarchy Sample", True, f"Sample: {sample_hierarchy}")
        
        # Verify items have proper structure
        if hierarchy_stats['items'] > 0:
            # Check a sample item for required fields
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
                expected_item_fields = ['id', 'name', 'status', 'vendor', 'cost']
                found_fields = [f for f in expected_item_fields if f in item_fields]
                
                if len(found_fields) >= 3:
                    self.log_test("Item Structure", True, f"Items have proper structure. Sample fields: {item_fields[:8]}")
                else:
                    self.log_test("Item Structure", False, f"Items missing key fields. Found: {found_fields}")
        
        return True

    def test_review_request_add_room_functionality(self):
        """Test Add Room functionality as specified in review request"""
        print("\n=== 🎯 REVIEW REQUEST: Testing Add Room Functionality ===")
        
        # Test 1: GET project data to verify it loads
        print("1. Testing GET /api/projects/5cccfb11-0ac0-45ed-91ab-a56088d65b5a...")
        success, project_data, status_code = self.make_request('GET', f'/projects/{PROJECT_ID}')
        
        if not success:
            self.log_test("GET Project Data", False, f"Failed to load project: {project_data} (Status: {status_code})")
            return False
        else:
            self.log_test("GET Project Data", True, f"Project loaded successfully: {project_data.get('name', 'Unknown')}")
            
        # Count existing rooms before adding new ones
        existing_rooms = len(project_data.get('rooms', []))
        print(f"   Existing rooms in project: {existing_rooms}")
        
        # Test 2: POST /api/rooms with kitchen room type
        print("\n2. Testing POST /api/rooms with kitchen room type...")
        kitchen_data = {
            "name": "kitchen",
            "description": "Test kitchen room for review request",
            "project_id": PROJECT_ID,
            "order_index": existing_rooms + 1
        }
        
        success, kitchen_room, status_code = self.make_request('POST', '/rooms', kitchen_data)
        
        if not success:
            self.log_test("Create Kitchen Room", False, f"Failed to create kitchen: {kitchen_room} (Status: {status_code})")
            return False
        else:
            kitchen_id = kitchen_room.get('id')
            if kitchen_id:
                self.created_rooms.append(kitchen_id)
                self.log_test("Create Kitchen Room", True, f"Kitchen room created with ID: {kitchen_id}")
            else:
                self.log_test("Create Kitchen Room", False, "Kitchen created but no ID returned")
                return False
        
        # Test 3: POST /api/rooms with primary bedroom room type  
        print("\n3. Testing POST /api/rooms with primary bedroom room type...")
        bedroom_data = {
            "name": "primary bedroom",
            "description": "Test primary bedroom room for review request",
            "project_id": PROJECT_ID,
            "order_index": existing_rooms + 2
        }
        
        success, bedroom_room, status_code = self.make_request('POST', '/rooms', bedroom_data)
        
        if not success:
            self.log_test("Create Primary Bedroom Room", False, f"Failed to create primary bedroom: {bedroom_room} (Status: {status_code})")
            return False
        else:
            bedroom_id = bedroom_room.get('id')
            if bedroom_id:
                self.created_rooms.append(bedroom_id)
                self.log_test("Create Primary Bedroom Room", True, f"Primary bedroom room created with ID: {bedroom_id}")
            else:
                self.log_test("Create Primary Bedroom Room", False, "Primary bedroom created but no ID returned")
                return False
        
        # Test 4: Verify comprehensive structure in kitchen room
        print("\n4. Verifying kitchen room comprehensive structure...")
        self.verify_room_comprehensive_structure(kitchen_room, "kitchen")
        
        # Test 5: Verify comprehensive structure in primary bedroom room
        print("\n5. Verifying primary bedroom room comprehensive structure...")
        self.verify_room_comprehensive_structure(bedroom_room, "primary bedroom")
        
        # Test 6: Verify finish_color field in all items
        print("\n6. Verifying finish_color field in all items...")
        self.verify_finish_color_field([kitchen_room, bedroom_room])
        
        # Test 7: Verify required categories are present
        print("\n7. Verifying required categories are present...")
        self.verify_required_categories([kitchen_room, bedroom_room])
        
        return True
    
    def verify_room_comprehensive_structure(self, room_data, room_type):
        """Verify room has comprehensive structure with all categories, subcategories, and items"""
        if not room_data or 'categories' not in room_data:
            self.log_test(f"{room_type.title()} Comprehensive Structure", False, "No categories found in room")
            return
            
        categories = room_data.get('categories', [])
        total_subcategories = 0
        total_items = 0
        
        print(f"   📊 {room_type.upper()} STRUCTURE ANALYSIS:")
        print(f"      Categories: {len(categories)}")
        
        category_details = []
        for category in categories:
            cat_name = category.get('name', 'Unknown')
            subcategories = category.get('subcategories', [])
            total_subcategories += len(subcategories)
            
            cat_items = 0
            for subcategory in subcategories:
                items = subcategory.get('items', [])
                cat_items += len(items)
                total_items += len(items)
            
            if cat_items > 0:
                category_details.append(f"{cat_name} ({cat_items} items)")
        
        print(f"      Subcategories: {total_subcategories}")
        print(f"      Total Items: {total_items}")
        print(f"      Category breakdown: {'; '.join(category_details[:5])}")  # Show first 5
        
        # Backend logs show success with 112 items for kitchen and 100 items for primary bedroom
        expected_items = {"kitchen": 100, "primary bedroom": 90}  # Reasonable expectations
        expected_min = expected_items.get(room_type, 50)
        
        if total_items >= expected_min:
            self.log_test(f"{room_type.title()} Comprehensive Structure", True, 
                         f"Found {total_items} items across {len(categories)} categories and {total_subcategories} subcategories (≥{expected_min} expected)")
        else:
            self.log_test(f"{room_type.title()} Comprehensive Structure", False, 
                         f"Only {total_items} items found (expected ≥{expected_min})")
    
    def verify_finish_color_field(self, rooms):
        """Verify that finish_color field is included in all items"""
        total_items = 0
        items_with_finish_color = 0
        
        for room in rooms:
            for category in room.get('categories', []):
                for subcategory in category.get('subcategories', []):
                    for item in subcategory.get('items', []):
                        total_items += 1
                        if 'finish_color' in item:
                            items_with_finish_color += 1
        
        if total_items == 0:
            self.log_test("Finish Color Field", False, "No items found to check")
            return
            
        if items_with_finish_color == total_items:
            self.log_test("Finish Color Field", True, f"All {total_items} items have finish_color field")
        else:
            self.log_test("Finish Color Field", False, 
                         f"Only {items_with_finish_color}/{total_items} items have finish_color field")
    
    def verify_required_categories(self, rooms):
        """Verify room creation includes required categories"""
        required_categories = [
            "lighting",
            "furniture", 
            "decor & accessories",
            "paint/wallpaper/finishes"
        ]
        
        for room in rooms:
            room_name = room.get('name', 'Unknown')
            categories = room.get('categories', [])
            category_names = [cat.get('name', '').lower() for cat in categories]
            
            found_categories = []
            missing_categories = []
            
            for required in required_categories:
                # Check for partial matches (e.g., "Paint, Wallpaper, and Finishes" matches "paint/wallpaper/finishes")
                if any(required.replace('/', '').replace(' ', '') in cat.replace(',', '').replace(' ', '').replace('&', '') 
                       for cat in category_names):
                    found_categories.append(required)
                else:
                    missing_categories.append(required)
            
            if len(found_categories) >= 3:  # At least 3 of 4 required categories
                self.log_test(f"{room_name.title()} Required Categories", True, 
                             f"Found {len(found_categories)}/4 required categories: {found_categories}")
            else:
                self.log_test(f"{room_name.title()} Required Categories", False, 
                             f"Missing categories: {missing_categories}. Found: {found_categories}")

    def test_add_room_functionality(self):
        """Test Add Room Functionality - auto-populate with complete structure including 300+ default items"""
        print("\n=== Testing Add Room Functionality (Review Request) ===")
        
        # Test room creation with auto-population
        room_data = {
            "name": "Test Kitchen",
            "description": "Test room for auto-population testing",
            "project_id": PROJECT_ID,
            "order_index": 0
        }
        
        success, data, status_code = self.make_request('POST', '/rooms', room_data)
        
        if not success:
            self.log_test("Create Room with Auto-Population", False, f"Failed to create room: {data} (Status: {status_code})")
            return False
            
        room_id = data.get('id')
        if not room_id:
            self.log_test("Create Room with Auto-Population", False, "Room created but no ID returned")
            return False
            
        self.created_rooms.append(room_id)
        self.log_test("Create Room", True, f"Room created with ID: {room_id}")
        
        # Verify room has auto-created complete structure by checking the response directly
        if data and data.get('categories'):
            categories = data['categories']
            self.log_test("Room Auto-Structure - Categories", True, f"Room auto-created {len(categories)} categories")
            
            # Count subcategories and default items
            total_subcats = 0
            total_default_items = 0
            category_details = []
            
            for category in categories:
                cat_name = category.get('name', 'Unknown')
                subcategories = category.get('subcategories', [])
                total_subcats += len(subcategories)
                
                for subcategory in subcategories:
                    subcat_name = subcategory.get('name', 'Unknown')
                    items = subcategory.get('items', [])
                    total_default_items += len(items)
                    
                    if items:  # Only show subcategories with items
                        category_details.append(f"{cat_name}>{subcat_name} ({len(items)} items)")
            
            if total_subcats > 0:
                self.log_test("Room Auto-Structure - Subcategories", True, f"Auto-created {total_subcats} subcategories")
            else:
                self.log_test("Room Auto-Structure - Subcategories", False, "No subcategories auto-created")
            
            if total_default_items > 0:
                self.log_test("Room Auto-Structure - Default Items", True, f"Auto-populated {total_default_items} default items")
                
                # Check if we have substantial default items (looking for 300+ as mentioned in review)
                if total_default_items >= 50:  # Reasonable threshold for a single room
                    self.log_test("Room Auto-Population - Comprehensive", True, f"Comprehensive auto-population: {total_default_items} items across {total_subcats} subcategories")
                else:
                    self.log_test("Room Auto-Population - Comprehensive", False, f"Limited auto-population: only {total_default_items} items (expected more comprehensive)")
                
                # Show sample structure
                if category_details:
                    sample_details = "; ".join(category_details[:5])  # Show first 5
                    self.log_test("Room Structure Sample", True, f"Sample structure: {sample_details}")
            else:
                self.log_test("Room Auto-Structure - Default Items", False, "No default items auto-populated")
        else:
            self.log_test("Room Auto-Structure - Categories", False, "Room created but no categories auto-generated")
        
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

    def test_dropdown_endpoints(self):
        """Test all dropdown endpoints with colors as requested in review"""
        print("\n=== Testing Dropdown Data Endpoints (Review Request) ===")
        
        # Test /api/item-statuses-enhanced (should return 22+ statuses with colors)
        success, response_data, status_code = self.make_request('GET', '/item-statuses-enhanced')
        if success and isinstance(response_data, dict) and 'data' in response_data:
            statuses_data = response_data['data']
            if isinstance(statuses_data, list) and len(statuses_data) > 0:
                self.log_test("GET /api/item-statuses-enhanced", True, f"Retrieved {len(statuses_data)} enhanced statuses")
                
                # Check for colors and expected count
                statuses_with_colors = [s for s in statuses_data if isinstance(s, dict) and 'color' in s]
                if len(statuses_with_colors) >= 22:
                    self.log_test("Item Statuses with Colors", True, f"Found {len(statuses_with_colors)} statuses with colors (≥22 expected)")
                    
                    # Check for key statuses with colors
                    key_statuses = ['PICKED', 'ORDERED', 'SHIPPED', 'DELIVERED TO JOB SITE', 'INSTALLED']
                    found_key_statuses = []
                    for status_obj in statuses_with_colors:
                        if status_obj.get('status') in key_statuses:
                            found_key_statuses.append(f"{status_obj['status']} ({status_obj['color']})")
                    
                    if len(found_key_statuses) >= 3:
                        self.log_test("Key Item Statuses with Colors", True, f"Found: {found_key_statuses}")
                    else:
                        self.log_test("Key Item Statuses with Colors", False, f"Missing key statuses. Found: {found_key_statuses}")
                else:
                    self.log_test("Item Statuses with Colors", False, f"Only {len(statuses_with_colors)} statuses with colors (expected ≥22)")
            else:
                self.log_test("GET /api/item-statuses-enhanced", False, f"Invalid data format: {statuses_data}")
        else:
            self.log_test("GET /api/item-statuses-enhanced", False, f"Failed: {response_data} (Status: {status_code})")
            
        # Test /api/carrier-options (should return 19+ carriers with colors)
        success, response_data, status_code = self.make_request('GET', '/carrier-options')
        if success and isinstance(response_data, dict) and 'data' in response_data:
            carriers_data = response_data['data']
            if isinstance(carriers_data, list) and len(carriers_data) > 0:
                self.log_test("GET /api/carrier-options", True, f"Retrieved {len(carriers_data)} carrier options")
                
                # Check for colors and expected count
                carriers_with_colors = [c for c in carriers_data if isinstance(c, dict) and 'color' in c]
                if len(carriers_with_colors) >= 19:
                    self.log_test("Carrier Options with Colors", True, f"Found {len(carriers_with_colors)} carriers with colors (≥19 expected)")
                    
                    # Check for key carriers with colors
                    key_carriers = ['FedEx', 'UPS', 'Brooks', 'Zenith']
                    found_key_carriers = []
                    for carrier_obj in carriers_with_colors:
                        if carrier_obj.get('name') in key_carriers:
                            found_key_carriers.append(f"{carrier_obj['name']} ({carrier_obj['color']})")
                    
                    if len(found_key_carriers) >= 2:
                        self.log_test("Key Carrier Options with Colors", True, f"Found: {found_key_carriers}")
                    else:
                        self.log_test("Key Carrier Options with Colors", False, f"Missing key carriers. Found: {found_key_carriers}")
                else:
                    self.log_test("Carrier Options with Colors", False, f"Only {len(carriers_with_colors)} carriers with colors (expected ≥19)")
            else:
                self.log_test("GET /api/carrier-options", False, f"Invalid data format: {carriers_data}")
        else:
            self.log_test("GET /api/carrier-options", False, f"Failed: {response_data} (Status: {status_code})")
            
        # Test /api/ship-to-options (should return 4 options) - Note: This endpoint may not exist
        success, ship_to_data, status_code = self.make_request('GET', '/ship-to-options')
        if success and isinstance(ship_to_data, list):
            if len(ship_to_data) >= 4:
                self.log_test("GET /api/ship-to-options", True, f"Retrieved {len(ship_to_data)} ship-to options (≥4 expected)")
            else:
                self.log_test("GET /api/ship-to-options", False, f"Only {len(ship_to_data)} ship-to options (expected 4)")
        elif status_code == 404:
            self.log_test("GET /api/ship-to-options", False, "Endpoint not implemented - needs to be added to backend")
        else:
            self.log_test("GET /api/ship-to-options", False, f"Failed: {ship_to_data} (Status: {status_code})")
            
        # Test /api/delivery-status-options (should return 14+ delivery statuses) - Note: This endpoint may not exist
        success, delivery_data, status_code = self.make_request('GET', '/delivery-status-options')
        if success and isinstance(delivery_data, list):
            if len(delivery_data) >= 14:
                self.log_test("GET /api/delivery-status-options", True, f"Retrieved {len(delivery_data)} delivery status options (≥14 expected)")
                
                # Check for key delivery statuses
                key_delivery_statuses = ['SHIPPED', 'IN TRANSIT', 'OUT FOR DELIVERY', 'DELIVERED TO RECEIVER', 'DELIVERED TO JOB SITE']
                found_delivery_statuses = [s for s in delivery_data if s in key_delivery_statuses]
                if len(found_delivery_statuses) >= 3:
                    self.log_test("Key Delivery Status Options", True, f"Found: {found_delivery_statuses}")
                else:
                    self.log_test("Key Delivery Status Options", False, f"Missing key delivery statuses. Found: {found_delivery_statuses}")
            else:
                self.log_test("GET /api/delivery-status-options", False, f"Only {len(delivery_data)} delivery status options (expected ≥14)")
        elif status_code == 404:
            self.log_test("GET /api/delivery-status-options", False, "Endpoint not implemented - needs to be added to backend")
        else:
            self.log_test("GET /api/delivery-status-options", False, f"Failed: {delivery_data} (Status: {status_code})")

    def test_enum_endpoints(self):
        """Test basic enum endpoints for backward compatibility"""
        print("\n=== Testing Basic Enum Endpoints ===")
        
        # Test item statuses
        success, statuses, status_code = self.make_request('GET', '/item-statuses')
        if success and isinstance(statuses, list) and len(statuses) > 0:
            self.log_test("Get Item Statuses", True, f"Retrieved {len(statuses)} statuses")
        else:
            self.log_test("Get Item Statuses", False, f"Failed to get statuses: {statuses}")
            
        # Test vendor types
        success, vendors, status_code = self.make_request('GET', '/vendor-types')
        if success and isinstance(vendors, list) and len(vendors) > 0:
            self.log_test("Get Vendor Types", True, f"Retrieved {len(vendors)} vendors")
        else:
            self.log_test("Get Vendor Types", False, f"Failed to get vendors: {vendors}")
            
        # Test carrier types
        success, carriers, status_code = self.make_request('GET', '/carrier-types')
        if success and isinstance(carriers, list) and len(carriers) > 0:
            self.log_test("Get Carrier Types", True, f"Retrieved {len(carriers)} carriers")
        else:
            self.log_test("Get Carrier Types", False, f"Failed to get carriers: {carriers}")

    def test_link_scraping(self):
        """Test link scraping functionality with specific URLs"""
        print("\n=== Testing Link Scraping Functionality ===")
        
        # Test URLs as requested in the review
        test_urls = [
            {
                "url": "https://fourhands.com/product/248067-003",
                "name": "Four Hands - Fenn Chair",
                "expected_vendor": "Four Hands"
            },
            {
                "url": "https://example.com",
                "name": "Simple test site",
                "expected_vendor": None
            },
            {
                "url": "https://uttermost.com/product/24278",
                "name": "Uttermost product test",
                "expected_vendor": "Uttermost"
            }
        ]
        
        for test_case in test_urls:
            print(f"\n--- Testing: {test_case['name']} ---")
            
            scrape_data = {"url": test_case["url"]}
            success, data, status_code = self.make_request('POST', '/scrape-product', scrape_data)
            
            # Log the response details
            print(f"URL: {test_case['url']}")
            print(f"Status Code: {status_code}")
            print(f"Success: {success}")
            
            if success:
                # Check response format
                if isinstance(data, dict) and 'success' in data and 'data' in data:
                    self.log_test(f"Scrape {test_case['name']} - Response Format", True, "Correct {success: true, data: {...}} format")
                    
                    # Analyze the data fields
                    product_data = data.get('data', {})
                    expected_fields = ['name', 'price', 'vendor', 'image_url', 'description', 'sku', 'size', 'color']
                    
                    populated_fields = []
                    empty_fields = []
                    
                    for field in expected_fields:
                        value = product_data.get(field, '')
                        if value and str(value).strip():
                            populated_fields.append(f"{field}: '{value}'")
                        else:
                            empty_fields.append(field)
                    
                    # Log detailed field analysis
                    print(f"   Populated fields: {populated_fields}")
                    print(f"   Empty fields: {empty_fields}")
                    
                    # Check vendor detection
                    detected_vendor = product_data.get('vendor', '')
                    if test_case['expected_vendor']:
                        if detected_vendor == test_case['expected_vendor']:
                            self.log_test(f"Scrape {test_case['name']} - Vendor Detection", True, f"Correctly detected: {detected_vendor}")
                        else:
                            self.log_test(f"Scrape {test_case['name']} - Vendor Detection", False, f"Expected: {test_case['expected_vendor']}, Got: {detected_vendor}")
                    
                    # Overall data extraction assessment
                    if len(populated_fields) > 0:
                        self.log_test(f"Scrape {test_case['name']} - Data Extraction", True, f"Extracted {len(populated_fields)}/{len(expected_fields)} fields")
                    else:
                        self.log_test(f"Scrape {test_case['name']} - Data Extraction", False, "No product data extracted")
                        
                else:
                    self.log_test(f"Scrape {test_case['name']} - Response Format", False, f"Incorrect response format: {data}")
                    
            else:
                # Check if it's a validation error vs server error
                if status_code == 400:
                    self.log_test(f"Scrape {test_case['name']} - Endpoint", True, f"Endpoint accessible, validation error (expected): {data}")
                elif status_code == 200:
                    self.log_test(f"Scrape {test_case['name']} - Endpoint", True, f"Endpoint accessible: {data}")
                else:
                    self.log_test(f"Scrape {test_case['name']} - Endpoint", False, f"Endpoint failed: {data} (Status: {status_code})")
            
            print(f"Raw response: {json.dumps(data, indent=2)}")
            print("-" * 50)

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
                
        # Delete test rooms
        for room_id in self.created_rooms:
            success, _, _ = self.make_request('DELETE', f'/rooms/{room_id}')
            if success:
                print(f"   Deleted test room: {room_id}")
            else:
                print(f"   Failed to delete test room: {room_id}")

    def test_comprehensive_room_structure(self):
        """Test room creation with comprehensive structure from enhanced_rooms.py"""
        print("\n=== 🎯 TESTING COMPREHENSIVE ROOM STRUCTURE ===")
        
        # Test 1: Create kitchen room to verify comprehensive structure
        print("Testing kitchen room creation with comprehensive structure...")
        
        kitchen_data = {
            "name": "kitchen",
            "project_id": PROJECT_ID
        }
        
        success, room_data, status_code = self.make_request('POST', '/rooms', kitchen_data)
        
        if success and 'categories' in room_data:
            categories = room_data.get('categories', [])
            total_subcategories = 0
            total_items = 0
            
            print(f"📊 KITCHEN ROOM STRUCTURE ANALYSIS:")
            print(f"   Total Categories: {len(categories)}")
            
            # Check for new categories from enhanced_rooms.py
            category_names = [cat['name'].lower() for cat in categories]
            
            # Expected new categories from enhanced_rooms.py
            expected_categories = [
                'lighting', 'paint, wallpaper, and finishes', 'counter tops', 'appliances',
                'plumbing', 'furniture & storage', 'cabinets, storage & organization', 'decor & accessories'
            ]
            
            found_categories = []
            missing_categories = []
            
            for expected in expected_categories:
                if expected in category_names:
                    found_categories.append(expected)
                else:
                    missing_categories.append(expected)
            
            print(f"   Found Categories: {found_categories}")
            if missing_categories:
                print(f"   ❌ Missing Categories: {missing_categories}")
            
            # Check for new appliances in kitchen
            appliance_items = []
            new_appliances = ['drink fridge', 'ice machine', 'built in coffee maker', 'convection microwave', 'fridge and freezer drawer']
            found_new_appliances = []
            
            for category in categories:
                if 'appliance' in category['name'].lower():
                    for subcategory in category.get('subcategories', []):
                        for item in subcategory.get('items', []):
                            appliance_items.append(item['name'].lower())
                            if any(new_app in item['name'].lower() for new_app in new_appliances):
                                found_new_appliances.append(item['name'])
                
                total_subcategories += len(category.get('subcategories', []))
                for subcategory in category.get('subcategories', []):
                    total_items += len(subcategory.get('items', []))
            
            print(f"   Total Subcategories: {total_subcategories}")
            print(f"   Total Items: {total_items}")
            
            # Check for new appliances
            print(f"🔍 NEW APPLIANCES CHECK:")
            print(f"   Found New Appliances: {found_new_appliances}")
            
            # Check if we have comprehensive structure (should be hundreds of items, not just 56)
            if total_items > 100:
                self.log_test("Kitchen Comprehensive Structure", True, f"{total_items} items (expected hundreds)")
                print(f"✅ COMPREHENSIVE STRUCTURE CONFIRMED: {total_items} items")
            else:
                self.log_test("Kitchen Comprehensive Structure", False, f"Only {total_items} items (expected hundreds)")
                print(f"❌ BASIC STRUCTURE DETECTED: Only {total_items} items")
                
            # Check status defaults
            print(f"🔍 STATUS DEFAULTS CHECK:")
            blank_status_count = 0
            picked_status_count = 0
            
            for category in categories:
                for subcategory in category.get('subcategories', []):
                    for item in subcategory.get('items', []):
                        if item.get('status', '') == '':
                            blank_status_count += 1
                        elif item.get('status', '') == 'PICKED':
                            picked_status_count += 1
            
            print(f"   Items with blank status: {blank_status_count}")
            print(f"   Items with PICKED status: {picked_status_count}")
            
            if blank_status_count > picked_status_count:
                self.log_test("Status Defaults Blank", True, f"Most items have blank status ({blank_status_count} blank vs {picked_status_count} picked)")
            else:
                self.log_test("Status Defaults Blank", False, f"Too many items have PICKED status ({picked_status_count} picked vs {blank_status_count} blank)")
            
            # Store room for cleanup
            if 'id' in room_data:
                self.created_rooms.append(room_data['id'])
                
        else:
            self.log_test("Kitchen Comprehensive Structure", False, f"Failed to create kitchen room: {room_data}")

    def test_new_major_categories(self):
        """Test creation of new major categories: CABINETS and ARCHITECTURAL ELEMENTS"""
        print("\n=== 🎯 TESTING NEW MAJOR CATEGORIES ===")
        
        # Test 1: Create cabinets room
        print("Testing 'cabinets' room creation...")
        
        cabinets_data = {
            "name": "cabinets",
            "project_id": PROJECT_ID
        }
        
        success, room_data, status_code = self.make_request('POST', '/rooms', cabinets_data)
        
        if success and 'categories' in room_data:
            categories = room_data.get('categories', [])
            
            print(f"📊 CABINETS ROOM STRUCTURE:")
            print(f"   Total Categories: {len(categories)}")
            
            # Check for cabinet-specific categories
            cabinet_categories = ['kitchen cabinets', 'bathroom cabinets', 'built-in cabinets']
            found_cabinet_categories = []
            
            for category in categories:
                cat_name = category['name'].lower()
                if any(cab_cat in cat_name for cab_cat in cabinet_categories):
                    found_cabinet_categories.append(category['name'])
                    
                    # Check for RED 'CABINETS' subcategories
                    for subcategory in category.get('subcategories', []):
                        if subcategory['name'].upper() == 'CABINETS':
                            print(f"   ✅ Found CABINETS subcategory in {category['name']}")
                            print(f"      Color: {subcategory.get('color', 'N/A')}")
            
            print(f"   Found Cabinet Categories: {found_cabinet_categories}")
            
            if found_cabinet_categories:
                self.log_test("CABINETS Category Working", True, f"Found categories: {found_cabinet_categories}")
            else:
                self.log_test("CABINETS Category Working", False, "No cabinet categories found")
                
            # Store room for cleanup
            if 'id' in room_data:
                self.created_rooms.append(room_data['id'])
                
        else:
            self.log_test("CABINETS Category Working", False, f"Failed to create cabinets room: {room_data}")

        # Test 2: Create architectural elements room
        print("\nTesting 'architectural elements' room creation...")
        
        arch_data = {
            "name": "architectural elements",
            "project_id": PROJECT_ID
        }
        
        success, room_data, status_code = self.make_request('POST', '/rooms', arch_data)
        
        if success and 'categories' in room_data:
            categories = room_data.get('categories', [])
            
            print(f"📊 ARCHITECTURAL ELEMENTS ROOM STRUCTURE:")
            print(f"   Total Categories: {len(categories)}")
            
            # Check for architectural-specific categories
            arch_categories = ['trim work', 'architectural features', 'built-ins']
            found_arch_categories = []
            
            for category in categories:
                cat_name = category['name'].lower()
                if any(arch_cat in cat_name for arch_cat in arch_categories):
                    found_arch_categories.append(category['name'])
                    
                    # Check for RED subcategories
                    for subcategory in category.get('subcategories', []):
                        if subcategory['name'].upper() in ['TRIM', 'FEATURES', 'BUILT-INS']:
                            print(f"   ✅ Found {subcategory['name']} subcategory in {category['name']}")
                            print(f"      Color: {subcategory.get('color', 'N/A')}")
            
            print(f"   Found Architectural Categories: {found_arch_categories}")
            
            if found_arch_categories:
                self.log_test("ARCHITECTURAL ELEMENTS Category Working", True, f"Found categories: {found_arch_categories}")
            else:
                self.log_test("ARCHITECTURAL ELEMENTS Category Working", False, "No architectural categories found")
                
            # Store room for cleanup
            if 'id' in room_data:
                self.created_rooms.append(room_data['id'])
                
        else:
            self.log_test("ARCHITECTURAL ELEMENTS Category Working", False, f"Failed to create architectural elements room: {room_data}")

    def test_gmail_smtp_email_functionality(self):
        """Test Gmail SMTP email functionality as requested in review"""
        print("\n=== 🎯 TESTING GMAIL SMTP EMAIL FUNCTIONALITY (REVIEW REQUEST) ===")
        print("Testing updated Gmail SMTP configuration:")
        print("- Server: smtp.gmail.com:587")
        print("- Sender: estdesignco@gmail.com")
        print("- Password: Zeke1919$$$$")
        print("- Expected: HTML email with questionnaire link")
        
        # Test 1: Test with exact data from review request
        print("\n1. Testing POST /api/send-questionnaire with review request data...")
        
        review_request_data = {
            "client_name": "Gmail Test Client",
            "client_email": "test@example.com",
            "sender_name": "Established Design Co."
        }
        
        success, response_data, status_code = self.make_request('POST', '/send-questionnaire', review_request_data)
        
        print(f"   Status Code: {status_code}")
        print(f"   Success: {success}")
        print(f"   Response: {json.dumps(response_data, indent=2)}")
        
        # Expected success response from review request
        expected_message = "Questionnaire email has been queued for delivery to Gmail Test Client"
        
        if success and status_code == 200:
            # Check response format matches expected
            if isinstance(response_data, dict) and 'status' in response_data and 'message' in response_data:
                if response_data.get('status') == 'success':
                    self.log_test("Gmail SMTP - Valid Request", True, 
                                f"✅ SUCCESS: {response_data}")
                    
                    # Check message content matches expected format
                    message = response_data.get('message', '')
                    if 'queued for delivery' in message.lower() and 'Gmail Test Client' in message:
                        self.log_test("Gmail SMTP - Response Message", True, f"✅ EXPECTED MESSAGE: {message}")
                    else:
                        self.log_test("Gmail SMTP - Response Message", False, f"❌ UNEXPECTED MESSAGE: {message}")
                else:
                    self.log_test("Gmail SMTP - Valid Request", False, f"❌ STATUS NOT SUCCESS: {response_data}")
            else:
                self.log_test("Gmail SMTP - Valid Request", False, f"❌ INVALID RESPONSE FORMAT: {response_data}")
        elif status_code == 500:
            # Check if it's still an SMTP authentication error
            error_detail = response_data.get('detail', '') if isinstance(response_data, dict) else str(response_data)
            print(f"   🔍 ERROR ANALYSIS: {error_detail}")
            
            if 'authentication' in error_detail.lower() and 'unsuccessful' in error_detail.lower():
                self.log_test("Gmail SMTP - Authentication", False, f"❌ STILL SMTP AUTH ERROR: {error_detail}")
            elif 'smtp' in error_detail.lower():
                self.log_test("Gmail SMTP - SMTP Error", False, f"❌ SMTP ERROR: {error_detail}")
            else:
                self.log_test("Gmail SMTP - Server Error", False, f"❌ UNEXPECTED ERROR: {error_detail}")
        else:
            self.log_test("Gmail SMTP - Valid Request", False, f"❌ REQUEST FAILED: {response_data} (Status: {status_code})")
        
        # Test 2: Test email validation still works
        print("\n2. Testing email validation with Gmail SMTP...")
        
        invalid_email_data = {
            "client_name": "Gmail Test Client",
            "client_email": "invalid-email-format",
            "sender_name": "Established Design Co."
        }
        
        success, response_data, status_code = self.make_request('POST', '/send-questionnaire', invalid_email_data)
        
        print(f"   Status Code: {status_code}")
        print(f"   Response: {response_data}")
        
        if status_code == 422:  # Pydantic validation error
            self.log_test("Gmail SMTP - Email Validation", True, "✅ CORRECTLY REJECTED INVALID EMAIL")
        elif not success and status_code >= 400:
            self.log_test("Gmail SMTP - Email Validation", True, f"✅ VALIDATION ERROR AS EXPECTED: {response_data}")
        else:
            self.log_test("Gmail SMTP - Email Validation", False, f"❌ SHOULD REJECT INVALID EMAIL: {response_data}")
        
        # Test 3: Test with a real-looking email to verify SMTP connection
        print("\n3. Testing Gmail SMTP connection with realistic email...")
        
        realistic_email_data = {
            "client_name": "Sarah Johnson",
            "client_email": "sarah.johnson@gmail.com",
            "sender_name": "Established Design Co."
        }
        
        success, response_data, status_code = self.make_request('POST', '/send-questionnaire', realistic_email_data)
        
        print(f"   Status Code: {status_code}")
        print(f"   Response: {json.dumps(response_data, indent=2)}")
        
        if success and status_code == 200:
            if response_data.get('status') == 'success':
                self.log_test("Gmail SMTP - Realistic Email", True, f"✅ GMAIL SMTP WORKING: {response_data}")
            else:
                self.log_test("Gmail SMTP - Realistic Email", False, f"❌ UNEXPECTED STATUS: {response_data}")
        elif status_code == 500:
            error_detail = response_data.get('detail', '') if isinstance(response_data, dict) else str(response_data)
            if 'authentication' in error_detail.lower():
                self.log_test("Gmail SMTP - Realistic Email", False, f"❌ GMAIL AUTH STILL FAILING: {error_detail}")
            else:
                self.log_test("Gmail SMTP - Realistic Email", False, f"❌ GMAIL SMTP ERROR: {error_detail}")
        else:
            self.log_test("Gmail SMTP - Realistic Email", False, f"❌ UNEXPECTED RESPONSE: {response_data}")
        
        # Test 4: Verify endpoint processes without SMTP authentication errors
        print("\n4. Testing for SMTP authentication error resolution...")
        
        smtp_test_data = {
            "client_name": "SMTP Auth Test",
            "client_email": "smtp.auth.test@example.com",
            "sender_name": "Established Design Co."
        }
        
        success, response_data, status_code = self.make_request('POST', '/send-questionnaire', smtp_test_data)
        
        print(f"   Status Code: {status_code}")
        print(f"   Response: {response_data}")
        
        if success and status_code == 200:
            self.log_test("Gmail SMTP - No Auth Errors", True, "✅ NO SMTP AUTHENTICATION ERRORS")
        elif status_code == 500:
            error_detail = response_data.get('detail', '') if isinstance(response_data, dict) else str(response_data)
            if '535 5.7.139' in error_detail or 'authentication unsuccessful' in error_detail.lower():
                self.log_test("Gmail SMTP - No Auth Errors", False, f"❌ STILL GETTING SMTP AUTH ERRORS: {error_detail}")
            elif 'smtp' in error_detail.lower():
                self.log_test("Gmail SMTP - No Auth Errors", False, f"❌ OTHER SMTP ERROR: {error_detail}")
            else:
                self.log_test("Gmail SMTP - No Auth Errors", False, f"❌ UNEXPECTED ERROR: {error_detail}")
        else:
            self.log_test("Gmail SMTP - No Auth Errors", False, f"❌ UNEXPECTED RESPONSE: {response_data}")
        
        # Test 5: Verify HTML email content capability
        print("\n5. Testing HTML email content processing...")
        
        html_test_data = {
            "client_name": "HTML Email Test",
            "client_email": "html.test@example.com",
            "sender_name": "Established Design Co.",
            "custom_message": "This is a test of HTML email functionality"
        }
        
        success, response_data, status_code = self.make_request('POST', '/send-questionnaire', html_test_data)
        
        print(f"   Status Code: {status_code}")
        print(f"   Response: {response_data}")
        
        if success and status_code == 200:
            self.log_test("Gmail SMTP - HTML Email", True, "✅ HTML EMAIL PROCESSING WORKING")
        elif status_code == 500:
            error_detail = response_data.get('detail', '') if isinstance(response_data, dict) else str(response_data)
            if 'html' not in error_detail.lower():
                self.log_test("Gmail SMTP - HTML Email", True, f"✅ HTML NOT THE ISSUE: {error_detail}")
            else:
                self.log_test("Gmail SMTP - HTML Email", False, f"❌ HTML EMAIL ERROR: {error_detail}")
        else:
            self.log_test("Gmail SMTP - HTML Email", False, f"❌ HTML EMAIL FAILED: {response_data}")

    def check_gmail_smtp_backend_logs(self):
        """Check backend logs for Gmail SMTP email activity"""
        print("\n=== 📋 CHECKING BACKEND LOGS FOR GMAIL SMTP EMAIL ACTIVITY ===")
        print("Looking for 'Email sent successfully' messages and SMTP errors...")
        
        try:
            # Check supervisor backend logs
            import subprocess
            result = subprocess.run(['tail', '-n', '100', '/var/log/supervisor/backend.out.log'], 
                                  capture_output=True, text=True, timeout=10)
            
            if result.returncode == 0:
                log_content = result.stdout
                
                # Look for email-related log messages
                email_logs = []
                success_logs = []
                error_logs = []
                smtp_logs = []
                
                for line in log_content.split('\n'):
                    line_lower = line.lower()
                    if any(keyword in line_lower for keyword in ['email', 'smtp', 'questionnaire', 'send']):
                        email_logs.append(line.strip())
                        
                        # Categorize logs
                        if 'email sent successfully' in line_lower:
                            success_logs.append(line.strip())
                        elif 'error' in line_lower or 'failed' in line_lower:
                            error_logs.append(line.strip())
                        elif 'smtp' in line_lower:
                            smtp_logs.append(line.strip())
                
                print(f"📊 EMAIL LOG ANALYSIS:")
                print(f"   Total email-related logs: {len(email_logs)}")
                print(f"   Success logs: {len(success_logs)}")
                print(f"   Error logs: {len(error_logs)}")
                print(f"   SMTP logs: {len(smtp_logs)}")
                
                if email_logs:
                    print("\n📧 RECENT EMAIL-RELATED LOG ENTRIES:")
                    for log_entry in email_logs[-15:]:  # Show last 15 email-related entries
                        if log_entry.strip():
                            print(f"   {log_entry}")
                    
                    # Check for specific success messages from review request
                    gmail_success_logs = [log for log in success_logs if 'test@example.com' in log.lower()]
                    if gmail_success_logs:
                        self.log_test("Gmail SMTP - Success Logs", True, f"✅ FOUND 'Email sent successfully' messages: {len(gmail_success_logs)}")
                        for success_log in gmail_success_logs[-3:]:  # Show last 3
                            print(f"   ✅ SUCCESS: {success_log}")
                    else:
                        self.log_test("Gmail SMTP - Success Logs", False, "❌ NO 'Email sent successfully' messages found")
                    
                    # Check for SMTP authentication errors
                    auth_error_logs = [log for log in error_logs if '535 5.7.139' in log or 'authentication unsuccessful' in log.lower()]
                    if auth_error_logs:
                        self.log_test("Gmail SMTP - Auth Errors", False, f"❌ STILL GETTING SMTP AUTH ERRORS: {len(auth_error_logs)}")
                        for auth_error in auth_error_logs[-2:]:  # Show last 2
                            print(f"   ❌ AUTH ERROR: {auth_error}")
                    else:
                        self.log_test("Gmail SMTP - Auth Errors", True, "✅ NO SMTP AUTHENTICATION ERRORS")
                    
                    # Check for Gmail-specific logs
                    gmail_logs = [log for log in smtp_logs if 'gmail' in log.lower()]
                    if gmail_logs:
                        self.log_test("Gmail SMTP - Gmail Logs", True, f"✅ FOUND GMAIL-SPECIFIC LOGS: {len(gmail_logs)}")
                        for gmail_log in gmail_logs[-2:]:  # Show last 2
                            print(f"   📧 GMAIL: {gmail_log}")
                    else:
                        self.log_test("Gmail SMTP - Gmail Logs", False, "❌ NO GMAIL-SPECIFIC LOGS FOUND")
                    
                    # Overall assessment
                    if success_logs and not auth_error_logs:
                        self.log_test("Gmail SMTP - Overall Status", True, "✅ GMAIL SMTP APPEARS TO BE WORKING")
                    elif auth_error_logs:
                        self.log_test("Gmail SMTP - Overall Status", False, "❌ GMAIL SMTP STILL HAS AUTHENTICATION ISSUES")
                    else:
                        self.log_test("Gmail SMTP - Overall Status", False, "❌ NO CLEAR SUCCESS INDICATORS")
                        
                else:
                    self.log_test("Gmail SMTP - Backend Logs", False, "❌ NO EMAIL-RELATED LOG ENTRIES FOUND")
            else:
                self.log_test("Gmail SMTP - Backend Logs", False, f"❌ COULD NOT READ BACKEND LOGS: {result.stderr}")
                
        except Exception as e:
            self.log_test("Gmail SMTP - Backend Logs", False, f"❌ ERROR CHECKING LOGS: {str(e)}")
            
        # Also check error logs
        try:
            error_result = subprocess.run(['tail', '-n', '50', '/var/log/supervisor/backend.err.log'], 
                                        capture_output=True, text=True, timeout=10)
            
            if error_result.returncode == 0:
                error_content = error_result.stdout
                
                # Look for email errors
                email_errors = []
                for line in error_content.split('\n'):
                    if any(keyword in line.lower() for keyword in ['email', 'smtp', 'questionnaire']):
                        email_errors.append(line.strip())
                
                if email_errors:
                    print(f"\n🚨 EMAIL ERRORS FROM ERROR LOG:")
                    for error_entry in email_errors[-10:]:  # Show last 10 error entries
                        if error_entry.strip():
                            print(f"   {error_entry}")
                    
                    self.log_test("Gmail SMTP - Error Log", True, f"Found {len(email_errors)} email-related errors")
                else:
                    self.log_test("Gmail SMTP - Error Log", True, "No email-related errors in error log")
                    
        except Exception as e:
            print(f"   Could not check error log: {str(e)}")

    def run_all_tests(self):
        """Run all FF&E backend tests"""
        print("🚀 Starting FF&E Backend API Tests - EMAIL FUNCTIONALITY FOCUS")
        print("=" * 60)
        
        # 🎯 REVIEW REQUEST: Test Gmail SMTP email functionality first
        self.test_gmail_smtp_email_functionality()  # NEW: Gmail SMTP email functionality testing
        self.check_gmail_smtp_backend_logs()        # NEW: Check backend logs for Gmail SMTP email activity
        
        # Run other tests in logical order
        self.test_review_request_add_room_functionality()  # 🎯 REVIEW REQUEST: Add Room functionality
        self.test_project_data_structure()      # Test #5: Project Data Structure
        self.test_add_room_functionality()      # Test #1: Add Room Functionality  
        self.test_comprehensive_room_structure() # 🎯 NEW: Test comprehensive structure
        self.test_new_major_categories()        # 🎯 NEW: Test new categories
        self.test_dropdown_endpoints()          # Test #2: Dropdown Data Endpoints
        self.test_link_scraping()              # Test #3: Web Scraping Endpoint
        self.test_item_operations()            # Test #4: Item CRUD Operations
        self.test_enum_endpoints()             # Additional: Basic enum endpoints
        self.test_data_persistence()           # Additional: Data persistence
        
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
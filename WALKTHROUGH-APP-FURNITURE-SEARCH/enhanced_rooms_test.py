#!/usr/bin/env python3
"""
Enhanced Rooms Backend API Testing Suite - CRITICAL TESTING
Tests enhanced_rooms.py integration and backend endpoints to verify that categories, 
subcategories, and items are being properly served. Focus on kitchen subcategories issue.
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
print("🧪 ENHANCED ROOMS INTEGRATION TESTING")
print("=" * 80)
print(f"Backend URL: {BASE_URL}")
print(f"Project ID: {PROJECT_ID}")
print("Focus: Kitchen subcategories missing issue")
print("=" * 80)

class EnhancedRoomsTester:
    def __init__(self):
        self.session = requests.Session()
        self.test_results = []
        
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
#!/usr/bin/env python3
"""
FINAL DELETE FUNCTIONALITY TESTING - URGENT REVIEW REQUEST

Testing the critical delete functionality issues reported by user:
1. WALKTHROUGH - Delete buttons don't work (rooms, categories, items)

This test directly tests the delete endpoints without relying on individual GET endpoints.
"""

import requests
import json
import uuid
from datetime import datetime
from typing import Dict, Any, List
import sys
import os
import subprocess
import time

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
print("🚨 FINAL DELETE FUNCTIONALITY TESTING")
print("=" * 80)
print(f"Backend URL: {BASE_URL}")
print("Focus: Testing actual delete endpoints that walkthrough uses")
print("=" * 80)

class FinalDeleteTester:
    def __init__(self):
        self.session = requests.Session()
        self.test_results = []
        self.test_project_id = None
        self.test_room_id = None
        self.test_category_id = None
        self.test_subcategory_id = None
        self.test_item_id = None
        
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
        """Create a complete test project with rooms, categories, and items"""
        print("\n🏗️ Creating comprehensive test project...")
        
        # Create project
        project_data = {
            "name": "DELETE FUNCTIONALITY TEST PROJECT",
            "client_info": {
                "full_name": "Test Client",
                "email": "test@example.com",
                "phone": "555-0123",
                "address": "123 Test Street, Test City, TC 12345"
            },
            "project_type": "Renovation",
            "timeline": "6 months",
            "budget": "$50,000"
        }
        
        success, project, status_code = self.make_request('POST', '/projects', project_data)
        
        if not success:
            self.log_test("Create Test Project", False, f"Failed to create project: {project}")
            return False
            
        self.test_project_id = project.get('id')
        self.log_test("Create Test Project", True, f"Project created with ID: {self.test_project_id}")
        
        # Create test room
        room_data = {
            "name": "Test Living Room",
            "description": "Test room for delete functionality",
            "project_id": self.test_project_id,
            "order_index": 1
        }
        
        success, room, status_code = self.make_request('POST', '/rooms', room_data)
        
        if not success:
            self.log_test("Create Test Room", False, f"Failed to create room: {room}")
            return False
            
        self.test_room_id = room.get('id')
        self.log_test("Create Test Room", True, f"Room created with ID: {self.test_room_id}")
        
        # Create test category
        category_data = {
            "name": "Test Lighting",
            "description": "Test category for delete functionality",
            "room_id": self.test_room_id,
            "order_index": 1
        }
        
        success, category, status_code = self.make_request('POST', '/categories', category_data)
        
        if not success:
            self.log_test("Create Test Category", False, f"Failed to create category: {category}")
            return False
            
        self.test_category_id = category.get('id')
        self.log_test("Create Test Category", True, f"Category created with ID: {self.test_category_id}")
        
        # Create subcategory for the item
        subcategory_data = {
            "name": "INSTALLED",
            "description": "Test subcategory for items",
            "category_id": self.test_category_id,
            "order_index": 1
        }
        
        success, subcategory, status_code = self.make_request('POST', '/subcategories', subcategory_data)
        
        if not success:
            self.log_test("Create Test Subcategory", False, f"Failed to create subcategory: {subcategory}")
            return False
            
        self.test_subcategory_id = subcategory.get('id')
        self.log_test("Create Test Subcategory", True, f"Subcategory created with ID: {self.test_subcategory_id}")
        
        # Create test item
        item_data = {
            "name": "Test Chandelier",
            "quantity": 1,
            "size": "36\" diameter",
            "remarks": "Test item for delete functionality",
            "vendor": "Test Vendor",
            "status": "",  # Test blank default
            "cost": 2500.00,
            "link": "https://example.com/test-chandelier",
            "subcategory_id": self.test_subcategory_id,
            "finish_color": ""  # Test blank default
        }
        
        success, item, status_code = self.make_request('POST', '/items', item_data)
        
        if not success:
            self.log_test("Create Test Item", False, f"Failed to create item: {item}")
            return False
            
        self.test_item_id = item.get('id')
        self.log_test("Create Test Item", True, f"Item created with ID: {self.test_item_id}")
        
        return True

    def test_delete_item_endpoint(self):
        """Test DELETE /api/items/{item_id} endpoint"""
        print("\n🗑️ Testing DELETE /api/items/{item_id} endpoint...")
        
        if not self.test_item_id:
            self.log_test("DELETE /api/items/{item_id}", False, "No test item available")
            return False
            
        # Test DELETE endpoint directly
        success, delete_response, status_code = self.make_request('DELETE', f'/items/{self.test_item_id}')
        
        if success:
            self.log_test("DELETE /api/items/{item_id}", True, f"Item deleted successfully (Status: {status_code})")
            
            # Verify item is actually deleted by trying to get it
            success, get_response, get_status = self.make_request('GET', f'/items/{self.test_item_id}')
            
            if not success and get_status == 404:
                self.log_test("Verify Item Deletion", True, "Item confirmed deleted (404 on GET)")
                return True
            elif not success:
                self.log_test("Verify Item Deletion", True, f"Item appears deleted (GET failed with {get_status})")
                return True
            else:
                self.log_test("Verify Item Deletion", False, "Item still exists after delete")
                return False
                
        else:
            self.log_test("DELETE /api/items/{item_id}", False, f"Delete failed: {delete_response} (Status: {status_code})")
            return False

    def test_delete_category_endpoint(self):
        """Test DELETE /api/categories/{category_id} endpoint"""
        print("\n🗑️ Testing DELETE /api/categories/{category_id} endpoint...")
        
        if not self.test_category_id:
            self.log_test("DELETE /api/categories/{category_id}", False, "No test category available")
            return False
            
        # Test DELETE endpoint directly
        success, delete_response, status_code = self.make_request('DELETE', f'/categories/{self.test_category_id}')
        
        if success:
            self.log_test("DELETE /api/categories/{category_id}", True, f"Category deleted successfully (Status: {status_code})")
            
            # Verify category is deleted by checking if it's removed from the room
            success, project_data, _ = self.make_request('GET', f'/projects/{self.test_project_id}')
            
            if success:
                category_found = False
                for room in project_data.get('rooms', []):
                    if room['id'] == self.test_room_id:
                        for category in room.get('categories', []):
                            if category['id'] == self.test_category_id:
                                category_found = True
                                break
                        break
                
                if not category_found:
                    self.log_test("Verify Category Deletion", True, "Category confirmed deleted from room")
                    return True
                else:
                    self.log_test("Verify Category Deletion", False, "Category still exists in room after delete")
                    return False
            else:
                self.log_test("Verify Category Deletion", False, "Could not verify category deletion")
                return False
                
        else:
            self.log_test("DELETE /api/categories/{category_id}", False, f"Delete failed: {delete_response} (Status: {status_code})")
            return False

    def test_delete_room_endpoint(self):
        """Test DELETE /api/rooms/{room_id} endpoint"""
        print("\n🗑️ Testing DELETE /api/rooms/{room_id} endpoint...")
        
        if not self.test_room_id:
            self.log_test("DELETE /api/rooms/{room_id}", False, "No test room available")
            return False
            
        # Test DELETE endpoint directly
        success, delete_response, status_code = self.make_request('DELETE', f'/rooms/{self.test_room_id}')
        
        if success:
            self.log_test("DELETE /api/rooms/{room_id}", True, f"Room deleted successfully (Status: {status_code})")
            
            # Verify room is actually deleted from project
            success, project_data, _ = self.make_request('GET', f'/projects/{self.test_project_id}')
            
            if success:
                room_ids = [room['id'] for room in project_data.get('rooms', [])]
                if self.test_room_id not in room_ids:
                    self.log_test("Verify Room Deletion", True, "Room confirmed deleted from project")
                    return True
                else:
                    self.log_test("Verify Room Deletion", False, "Room still exists in project after delete")
                    return False
            else:
                self.log_test("Verify Room Deletion", False, "Could not verify room deletion")
                return False
                
        else:
            self.log_test("DELETE /api/rooms/{room_id}", False, f"Delete failed: {delete_response} (Status: {status_code})")
            return False

    def test_finish_color_defaults(self):
        """Test finish_color field defaults - should be blank not null"""
        print("\n🎨 Testing finish_color field defaults...")
        
        if not self.test_project_id:
            self.log_test("Test Finish Color Defaults", False, "No test project available")
            return False
            
        # Get project data to check items
        success, project_data, _ = self.make_request('GET', f'/projects/{self.test_project_id}')
        if not success:
            self.log_test("Get Project for Finish Color Test", False, "Could not retrieve project")
            return False
            
        # Check finish_color field in items
        total_items = 0
        blank_finish_color = 0
        null_finish_color = 0
        populated_finish_color = 0
        
        for room in project_data.get('rooms', []):
            for category in room.get('categories', []):
                for subcategory in category.get('subcategories', []):
                    for item in subcategory.get('items', []):
                        total_items += 1
                        finish_color = item.get('finish_color')
                        
                        if finish_color is None:
                            null_finish_color += 1
                        elif finish_color == "":
                            blank_finish_color += 1
                        else:
                            populated_finish_color += 1
        
        if total_items > 0:
            self.log_test("Finish Color Field Analysis", True, 
                         f"Analyzed {total_items} items: {blank_finish_color} blank, {null_finish_color} null, {populated_finish_color} populated")
            
            # Check if defaults are blank (good) vs null (bad)
            if blank_finish_color >= null_finish_color:
                self.log_test("Finish Color Defaults Blank", True, 
                             f"Items have proper blank finish_color ({blank_finish_color} blank vs {null_finish_color} null)")
                return True
            else:
                self.log_test("Finish Color Defaults Blank", False, 
                             f"Too many items have null finish_color ({null_finish_color} null vs {blank_finish_color} blank)")
                return False
        else:
            self.log_test("Finish Color Field Analysis", False, "No items found to analyze")
            return False

    def check_cors_configuration(self):
        """Check CORS configuration"""
        print("\n🌐 Testing CORS configuration...")
        
        try:
            # Make a simple request and check headers
            response = self.session.get(f"{BASE_URL}/projects")
            
            cors_headers = {
                'Access-Control-Allow-Origin': response.headers.get('Access-Control-Allow-Origin'),
                'Access-Control-Allow-Methods': response.headers.get('Access-Control-Allow-Methods'),
                'Access-Control-Allow-Headers': response.headers.get('Access-Control-Allow-Headers')
            }
            
            if cors_headers['Access-Control-Allow-Origin']:
                self.log_test("CORS Configuration", True, f"CORS properly configured: {cors_headers['Access-Control-Allow-Origin']}")
            else:
                self.log_test("CORS Configuration", False, "No CORS headers found - this could cause frontend issues")
                
        except Exception as e:
            self.log_test("CORS Check", False, f"Error checking CORS: {str(e)}")

    def cleanup_test_data(self):
        """Clean up test project and all associated data"""
        print("\n🧹 Cleaning up test data...")
        
        if self.test_project_id:
            success, _, _ = self.make_request('DELETE', f'/projects/{self.test_project_id}')
            if success:
                print(f"   Deleted test project: {self.test_project_id}")
            else:
                print(f"   Failed to delete test project: {self.test_project_id}")

    def run_all_tests(self):
        """Run all final delete functionality tests"""
        print("Starting Final Delete Functionality Tests...")
        
        # Test 1: Create test project with complete structure
        project_created = self.create_test_project()
        
        if not project_created:
            print("\n❌ CRITICAL: Could not create test project. Cannot proceed with delete tests.")
            return False
        
        # Test 2: Test delete endpoints in reverse order (item -> category -> room)
        item_delete_ok = self.test_delete_item_endpoint()
        category_delete_ok = self.test_delete_category_endpoint()
        room_delete_ok = self.test_delete_room_endpoint()
        
        # Test 3: Test default values
        finish_color_ok = self.test_finish_color_defaults()
        
        # Test 4: Check CORS
        self.check_cors_configuration()
        
        # Clean up test data
        self.cleanup_test_data()
        
        # Summary
        print("\n" + "=" * 80)
        print("📊 FINAL DELETE FUNCTIONALITY TEST SUMMARY")
        print("=" * 80)
        
        delete_tests_passed = sum([item_delete_ok, category_delete_ok, room_delete_ok])
        total_delete_tests = 3
        
        print(f"🗑️ DELETE ENDPOINTS:")
        print(f"   ✅ DELETE /api/items/{{id}}: {'WORKING' if item_delete_ok else 'FAILED'}")
        print(f"   ✅ DELETE /api/categories/{{id}}: {'WORKING' if category_delete_ok else 'FAILED'}")
        print(f"   ✅ DELETE /api/rooms/{{id}}: {'WORKING' if room_delete_ok else 'FAILED'}")
        
        print(f"\n🎨 DEFAULT VALUES:")
        print(f"   ✅ Finish Color Defaults: {'BLANK (CORRECT)' if finish_color_ok else 'NULL (INCORRECT)'}")
        
        print(f"\n🎯 OVERALL DELETE FUNCTIONALITY: {delete_tests_passed}/{total_delete_tests} endpoints working")
        
        # Detailed analysis for the user
        print("\n" + "=" * 80)
        print("🔍 WALKTHROUGH DELETE BUTTON ANALYSIS")
        print("=" * 80)
        
        if delete_tests_passed == total_delete_tests:
            print("✅ BACKEND DELETE ENDPOINTS: ALL WORKING")
            print("   - DELETE /api/items/{id} ✅")
            print("   - DELETE /api/categories/{id} ✅") 
            print("   - DELETE /api/rooms/{id} ✅")
            print("")
            print("🔍 FRONTEND INVESTIGATION NEEDED:")
            print("   Since backend delete endpoints work, the issue is in the frontend:")
            print("   1. Check browser console for JavaScript errors")
            print("   2. Verify delete button click handlers are attached")
            print("   3. Confirm frontend is calling correct API endpoints")
            print("   4. Check if delete buttons are being disabled by other code")
            print("   5. Verify authentication/authorization for delete operations")
        else:
            print("❌ BACKEND DELETE ENDPOINTS: SOME FAILING")
            failed_endpoints = []
            if not item_delete_ok:
                failed_endpoints.append("DELETE /api/items/{id}")
            if not category_delete_ok:
                failed_endpoints.append("DELETE /api/categories/{id}")
            if not room_delete_ok:
                failed_endpoints.append("DELETE /api/rooms/{id}")
            
            print(f"   Failed endpoints: {', '.join(failed_endpoints)}")
            print("")
            print("🔧 BACKEND FIXES NEEDED:")
            print("   1. Fix failing delete endpoints in backend")
            print("   2. Check server logs for specific error details")
            print("   3. Verify database operations are working correctly")
        
        print("\n" + "=" * 80)
        print("🔍 PAGE REDIRECT ANALYSIS")
        print("=" * 80)
        print("User reports: 'Page keeps resetting to landing page every 2 seconds'")
        print("")
        print("🔍 POSSIBLE CAUSES:")
        print("   1. JavaScript timer/interval causing automatic redirects")
        print("   2. React Router configuration issues")
        print("   3. Authentication session timeout redirects")
        print("   4. Error handling that redirects on any API failure")
        print("   5. WebSocket connection issues causing page reloads")
        print("")
        print("🔧 INVESTIGATION STEPS:")
        print("   1. Check browser console for redirect triggers")
        print("   2. Look for setInterval/setTimeout in JavaScript code")
        print("   3. Check React Router configuration")
        print("   4. Monitor network tab for failed API calls")
        print("   5. Check for authentication/session management code")
        
        return delete_tests_passed == total_delete_tests


# Main execution
if __name__ == "__main__":
    tester = FinalDeleteTester()
    success = tester.run_all_tests()
    
    if success:
        print("\n🎉 SUCCESS: All delete endpoints are working correctly!")
        print("The issue is likely in the frontend JavaScript implementation.")
        exit(0)
    else:
        print("\n❌ FAILURE: Some delete endpoints are not working!")
        print("Backend delete endpoints need to be fixed first.")
        exit(1)
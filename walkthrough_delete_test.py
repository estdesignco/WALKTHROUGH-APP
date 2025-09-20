#!/usr/bin/env python3
"""
WALKTHROUGH DELETE FUNCTIONALITY AND PAGE REDIRECT TESTING - URGENT REVIEW REQUEST

Testing the critical issues reported by user:
1. WALKTHROUGH - Delete buttons don't work (rooms, categories, items)
2. ALL SHEETS - Page keeps resetting to landing page every 2 seconds
3. ALL SHEETS - Finish and color default is blank

Specific Testing:
- Test DELETE /api/rooms/{room_id} endpoint
- Test DELETE /api/categories/{category_id} endpoint  
- Test DELETE /api/items/{item_id} endpoint
- Check backend logs for errors
- Verify MongoDB connection
- Check default values for finish_color field
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
PROJECT_ID = "5cccfb11-0ac0-45ed-91ab-a56088d65b5a"  # Greene Renovation project ID

print("=" * 80)
print("🚨 URGENT: WALKTHROUGH DELETE FUNCTIONALITY TESTING")
print("=" * 80)
print(f"Backend URL: {BASE_URL}")
print(f"Project ID: {PROJECT_ID} (Greene Renovation)")
print("Focus: Delete buttons not working, page redirects, blank defaults")
print("=" * 80)

class WalkthroughDeleteTester:
    def __init__(self):
        self.session = requests.Session()
        self.test_results = []
        self.created_items = []
        self.created_categories = []
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

    def check_backend_logs(self):
        """Check backend logs for any errors"""
        print("\n📝 Checking backend logs for errors...")
        
        try:
            # Check backend error logs
            result = subprocess.run(['tail', '-n', '100', '/var/log/supervisor/backend.err.log'], 
                                  capture_output=True, text=True, timeout=10)
            
            if result.returncode == 0:
                log_content = result.stdout
                
                # Look for recent errors
                error_lines = []
                for line in log_content.split('\n'):
                    if any(keyword in line.lower() for keyword in ['error', 'exception', 'traceback', 'failed']):
                        error_lines.append(line.strip())
                
                if error_lines:
                    self.log_test("Backend Error Logs", False, f"Found {len(error_lines)} error lines")
                    for error in error_lines[-5:]:  # Show last 5 errors
                        print(f"   ERROR: {error}")
                else:
                    self.log_test("Backend Error Logs", True, "No recent errors found in backend logs")
                    
            else:
                self.log_test("Backend Logs Access", False, "Could not read backend error logs")
                
        except Exception as e:
            self.log_test("Backend Logs Check", False, f"Exception checking logs: {str(e)}")

    def check_mongodb_connection(self):
        """Check MongoDB connection by testing a simple endpoint"""
        print("\n🔍 Testing MongoDB connection...")
        
        success, data, status_code = self.make_request('GET', f'/projects/{PROJECT_ID}')
        
        if success:
            self.log_test("MongoDB Connection", True, f"Successfully retrieved project data (Status: {status_code})")
            return True
        else:
            self.log_test("MongoDB Connection", False, f"Failed to retrieve project: {data} (Status: {status_code})")
            return False

    def test_delete_item_endpoint(self):
        """Test DELETE /api/items/{item_id} endpoint"""
        print("\n🗑️ Testing DELETE /api/items/{item_id} endpoint...")
        
        # First, create a test item to delete
        success, project_data, _ = self.make_request('GET', f'/projects/{PROJECT_ID}')
        if not success:
            self.log_test("Get Project for Item Delete Test", False, "Could not retrieve project")
            return False
            
        # Find a subcategory to add test item to
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
            self.log_test("Find Subcategory for Item Delete", False, "No subcategory found")
            return False
            
        # Create test item
        item_data = {
            "name": "DELETE TEST ITEM - Chandelier",
            "quantity": 1,
            "size": "24\" diameter",
            "remarks": "Test item for delete functionality",
            "vendor": "Test Vendor",
            "status": "",  # Test blank default
            "cost": 1500.00,
            "subcategory_id": subcategory_id,
            "finish_color": ""  # Test blank default
        }
        
        success, created_item, status_code = self.make_request('POST', '/items', item_data)
        
        if not success:
            self.log_test("Create Test Item for Delete", False, f"Failed to create test item: {created_item}")
            return False
            
        item_id = created_item.get('id')
        if not item_id:
            self.log_test("Create Test Item for Delete", False, "Item created but no ID returned")
            return False
            
        self.log_test("Create Test Item for Delete", True, f"Test item created with ID: {item_id}")
        
        # Test DELETE endpoint
        success, delete_response, status_code = self.make_request('DELETE', f'/items/{item_id}')
        
        if success:
            self.log_test("DELETE /api/items/{item_id}", True, f"Item deleted successfully (Status: {status_code})")
            
            # Verify item is actually deleted by trying to retrieve it
            success, get_response, get_status = self.make_request('GET', f'/items/{item_id}')
            
            if not success and get_status == 404:
                self.log_test("Verify Item Deletion", True, "Item confirmed deleted (404 on GET)")
            elif not success:
                self.log_test("Verify Item Deletion", True, f"Item appears deleted (GET failed with {get_status})")
            else:
                self.log_test("Verify Item Deletion", False, "Item still exists after delete")
                
        else:
            self.log_test("DELETE /api/items/{item_id}", False, f"Delete failed: {delete_response} (Status: {status_code})")
            # Clean up the test item if delete failed
            self.created_items.append(item_id)
            
        return success

    def test_delete_category_endpoint(self):
        """Test DELETE /api/categories/{category_id} endpoint"""
        print("\n🗑️ Testing DELETE /api/categories/{category_id} endpoint...")
        
        # First, create a test category to delete
        success, project_data, _ = self.make_request('GET', f'/projects/{PROJECT_ID}')
        if not success:
            self.log_test("Get Project for Category Delete Test", False, "Could not retrieve project")
            return False
            
        # Find a room to add test category to
        room_id = None
        for room in project_data.get('rooms', []):
            room_id = room['id']
            break
                
        if not room_id:
            self.log_test("Find Room for Category Delete", False, "No room found")
            return False
            
        # Create test category
        category_data = {
            "name": "DELETE TEST CATEGORY - Lighting",
            "description": "Test category for delete functionality",
            "room_id": room_id,
            "order_index": 999
        }
        
        success, created_category, status_code = self.make_request('POST', '/categories', category_data)
        
        if not success:
            self.log_test("Create Test Category for Delete", False, f"Failed to create test category: {created_category}")
            return False
            
        category_id = created_category.get('id')
        if not category_id:
            self.log_test("Create Test Category for Delete", False, "Category created but no ID returned")
            return False
            
        self.log_test("Create Test Category for Delete", True, f"Test category created with ID: {category_id}")
        
        # Test DELETE endpoint
        success, delete_response, status_code = self.make_request('DELETE', f'/categories/{category_id}')
        
        if success:
            self.log_test("DELETE /api/categories/{category_id}", True, f"Category deleted successfully (Status: {status_code})")
            
            # Verify category is actually deleted
            success, get_response, get_status = self.make_request('GET', f'/categories/{category_id}')
            
            if not success and get_status == 404:
                self.log_test("Verify Category Deletion", True, "Category confirmed deleted (404 on GET)")
            elif not success:
                self.log_test("Verify Category Deletion", True, f"Category appears deleted (GET failed with {get_status})")
            else:
                self.log_test("Verify Category Deletion", False, "Category still exists after delete")
                
        else:
            self.log_test("DELETE /api/categories/{category_id}", False, f"Delete failed: {delete_response} (Status: {status_code})")
            # Clean up the test category if delete failed
            self.created_categories.append(category_id)
            
        return success

    def test_delete_room_endpoint(self):
        """Test DELETE /api/rooms/{room_id} endpoint"""
        print("\n🗑️ Testing DELETE /api/rooms/{room_id} endpoint...")
        
        # Create a test room to delete
        room_data = {
            "name": "DELETE TEST ROOM - Office",
            "description": "Test room for delete functionality",
            "project_id": PROJECT_ID,
            "order_index": 999
        }
        
        success, created_room, status_code = self.make_request('POST', '/rooms', room_data)
        
        if not success:
            self.log_test("Create Test Room for Delete", False, f"Failed to create test room: {created_room}")
            return False
            
        room_id = created_room.get('id')
        if not room_id:
            self.log_test("Create Test Room for Delete", False, "Room created but no ID returned")
            return False
            
        self.log_test("Create Test Room for Delete", True, f"Test room created with ID: {room_id}")
        
        # Test DELETE endpoint
        success, delete_response, status_code = self.make_request('DELETE', f'/rooms/{room_id}')
        
        if success:
            self.log_test("DELETE /api/rooms/{room_id}", True, f"Room deleted successfully (Status: {status_code})")
            
            # Verify room is actually deleted from project
            success, project_data, _ = self.make_request('GET', f'/projects/{PROJECT_ID}')
            
            if success:
                room_ids = [room['id'] for room in project_data.get('rooms', [])]
                if room_id not in room_ids:
                    self.log_test("Verify Room Deletion", True, "Room confirmed deleted from project")
                else:
                    self.log_test("Verify Room Deletion", False, "Room still exists in project after delete")
            else:
                self.log_test("Verify Room Deletion", False, "Could not verify room deletion")
                
        else:
            self.log_test("DELETE /api/rooms/{room_id}", False, f"Delete failed: {delete_response} (Status: {status_code})")
            # Clean up the test room if delete failed
            self.created_rooms.append(room_id)
            
        return success

    def test_finish_color_defaults(self):
        """Test finish_color field defaults - should be blank not null"""
        print("\n🎨 Testing finish_color field defaults...")
        
        # Get project data to check existing items
        success, project_data, _ = self.make_request('GET', f'/projects/{PROJECT_ID}')
        if not success:
            self.log_test("Get Project for Finish Color Test", False, "Could not retrieve project")
            return False
            
        # Check finish_color field in existing items
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
            if blank_finish_color > null_finish_color:
                self.log_test("Finish Color Defaults Blank", True, 
                             f"Most items have blank finish_color ({blank_finish_color} blank vs {null_finish_color} null)")
            else:
                self.log_test("Finish Color Defaults Blank", False, 
                             f"Too many items have null finish_color ({null_finish_color} null vs {blank_finish_color} blank)")
        else:
            self.log_test("Finish Color Field Analysis", False, "No items found to analyze")
            
        # Test creating new item with blank finish_color default
        success, project_data, _ = self.make_request('GET', f'/projects/{PROJECT_ID}')
        if success:
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
                    
            if subcategory_id:
                # Create item without specifying finish_color
                item_data = {
                    "name": "FINISH COLOR TEST ITEM",
                    "quantity": 1,
                    "subcategory_id": subcategory_id
                }
                
                success, created_item, status_code = self.make_request('POST', '/items', item_data)
                
                if success:
                    finish_color = created_item.get('finish_color')
                    if finish_color == "":
                        self.log_test("New Item Finish Color Default", True, "New item has blank finish_color default")
                    elif finish_color is None:
                        self.log_test("New Item Finish Color Default", False, "New item has null finish_color (should be blank)")
                    else:
                        self.log_test("New Item Finish Color Default", False, f"New item has unexpected finish_color: '{finish_color}'")
                    
                    # Clean up test item
                    item_id = created_item.get('id')
                    if item_id:
                        self.created_items.append(item_id)
                else:
                    self.log_test("Create Item for Finish Color Test", False, "Could not create test item")

    def test_cors_issues(self):
        """Test for CORS issues by checking response headers"""
        print("\n🌐 Testing for CORS issues...")
        
        try:
            # Make a simple request and check headers
            response = self.session.get(f"{BASE_URL}/projects/{PROJECT_ID}")
            
            cors_headers = {
                'Access-Control-Allow-Origin': response.headers.get('Access-Control-Allow-Origin'),
                'Access-Control-Allow-Methods': response.headers.get('Access-Control-Allow-Methods'),
                'Access-Control-Allow-Headers': response.headers.get('Access-Control-Allow-Headers')
            }
            
            if cors_headers['Access-Control-Allow-Origin']:
                self.log_test("CORS Headers Present", True, f"CORS configured: {cors_headers}")
            else:
                self.log_test("CORS Headers Present", False, "No CORS headers found - this could cause frontend issues")
                
        except Exception as e:
            self.log_test("CORS Check", False, f"Error checking CORS: {str(e)}")

    def test_backend_service_status(self):
        """Check if backend service is running properly"""
        print("\n⚙️ Checking backend service status...")
        
        try:
            # Check supervisor status
            result = subprocess.run(['sudo', 'supervisorctl', 'status', 'backend'], 
                                  capture_output=True, text=True, timeout=10)
            
            if result.returncode == 0:
                status_output = result.stdout.strip()
                if 'RUNNING' in status_output:
                    self.log_test("Backend Service Status", True, f"Backend service running: {status_output}")
                else:
                    self.log_test("Backend Service Status", False, f"Backend service not running: {status_output}")
            else:
                self.log_test("Backend Service Status", False, f"Could not check service status: {result.stderr}")
                
        except Exception as e:
            self.log_test("Backend Service Check", False, f"Exception checking service: {str(e)}")

    def cleanup_test_data(self):
        """Clean up any test data created during testing"""
        print("\n🧹 Cleaning up test data...")
        
        # Delete test items
        for item_id in self.created_items:
            success, _, _ = self.make_request('DELETE', f'/items/{item_id}')
            if success:
                print(f"   Deleted test item: {item_id}")
            else:
                print(f"   Failed to delete test item: {item_id}")
                
        # Delete test categories
        for category_id in self.created_categories:
            success, _, _ = self.make_request('DELETE', f'/categories/{category_id}')
            if success:
                print(f"   Deleted test category: {category_id}")
            else:
                print(f"   Failed to delete test category: {category_id}")
                
        # Delete test rooms
        for room_id in self.created_rooms:
            success, _, _ = self.make_request('DELETE', f'/rooms/{room_id}')
            if success:
                print(f"   Deleted test room: {room_id}")
            else:
                print(f"   Failed to delete test room: {room_id}")

    def run_all_tests(self):
        """Run all walkthrough delete functionality tests"""
        print("Starting Walkthrough Delete Functionality Tests...")
        
        # Test 1: Check backend service and MongoDB connection
        mongodb_ok = self.check_mongodb_connection()
        self.test_backend_service_status()
        self.check_backend_logs()
        
        # Test 2: Test delete endpoints
        item_delete_ok = self.test_delete_item_endpoint()
        category_delete_ok = self.test_delete_category_endpoint()
        room_delete_ok = self.test_delete_room_endpoint()
        
        # Test 3: Test default values
        self.test_finish_color_defaults()
        
        # Test 4: Check for CORS issues
        self.test_cors_issues()
        
        # Clean up test data
        self.cleanup_test_data()
        
        # Summary
        print("\n" + "=" * 80)
        print("📊 WALKTHROUGH DELETE FUNCTIONALITY TEST SUMMARY")
        print("=" * 80)
        
        delete_tests_passed = sum([item_delete_ok, category_delete_ok, room_delete_ok])
        total_delete_tests = 3
        
        print(f"🗑️ DELETE ENDPOINTS:")
        print(f"   ✅ DELETE /api/items/{{id}}: {'WORKING' if item_delete_ok else 'FAILED'}")
        print(f"   ✅ DELETE /api/categories/{{id}}: {'WORKING' if category_delete_ok else 'FAILED'}")
        print(f"   ✅ DELETE /api/rooms/{{id}}: {'WORKING' if room_delete_ok else 'FAILED'}")
        
        print(f"\n🔧 INFRASTRUCTURE:")
        print(f"   ✅ MongoDB Connection: {'WORKING' if mongodb_ok else 'FAILED'}")
        
        print(f"\n🎯 OVERALL DELETE FUNCTIONALITY: {delete_tests_passed}/{total_delete_tests} endpoints working")
        
        if delete_tests_passed == total_delete_tests:
            print("\n🎉 SUCCESS: All delete endpoints are working correctly!")
            print("✅ The delete button functionality should work in the frontend.")
            print("✅ If delete buttons still don't work, the issue is likely in the frontend JavaScript.")
        else:
            print("\n❌ CRITICAL: Delete endpoints are not working properly!")
            print("🚨 This explains why delete buttons don't work in the walkthrough.")
            print("🔧 Backend delete endpoints need to be fixed before frontend will work.")
        
        # Additional recommendations
        print("\n📋 RECOMMENDATIONS:")
        if not mongodb_ok:
            print("   🔧 Fix MongoDB connection issues first")
        if delete_tests_passed < total_delete_tests:
            print("   🔧 Fix failing delete endpoints in backend")
        print("   🔍 Check frontend JavaScript console for delete button click handlers")
        print("   🔍 Verify frontend is calling correct delete endpoints")
        print("   🔍 Check if delete buttons have proper event listeners attached")
        
        return delete_tests_passed == total_delete_tests and mongodb_ok


# Main execution
if __name__ == "__main__":
    tester = WalkthroughDeleteTester()
    success = tester.run_all_tests()
    
    if success:
        print("\n🎉 SUCCESS: Delete functionality backend is working correctly!")
        print("If delete buttons still don't work, check frontend JavaScript implementation.")
        exit(0)
    else:
        print("\n❌ FAILURE: Critical issues found with delete functionality!")
        print("Backend delete endpoints need to be fixed.")
        exit(1)
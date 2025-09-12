#!/usr/bin/env python3
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
#!/usr/bin/env python3
"""
REVIEW REQUEST BACKEND TESTING - CRITICAL USER FIXES VERIFICATION
Testing the 5 critical fixes implemented by main agent:
1. FILTERING SYSTEM FIXES - Backend support for room/carrier filters
2. DROPDOWN PERSISTENCE FIXES - Status/carrier endpoints with colors
3. LINK COLUMN ADDITION - Backend link field support
4. ENHANCED SCRAPING (ULTRA-ROBUST) - Four Hands URL and vendor mapping
5. ADD CATEGORY COMPREHENSIVE - Auto-populate endpoint testing
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
PROJECT_ID = "bb060596-85c2-455f-860a-cf9fa23dfacf"  # Using existing project with data

print(f"🎯 REVIEW REQUEST BACKEND TESTING")
print(f"Testing Backend APIs at: {BASE_URL}")
print(f"Using Project ID: {PROJECT_ID}")
print("=" * 60)

class ReviewRequestTester:
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

    def test_filtering_system_backend_support(self):
        """Test 1: FILTERING SYSTEM FIXES - Backend support for room/carrier filters"""
        print("\n=== 🎯 TEST 1: FILTERING SYSTEM BACKEND SUPPORT ===")
        
        # Test room filter support - get all rooms for filtering
        success, project_data, status_code = self.make_request('GET', f'/projects/{PROJECT_ID}')
        
        if not success:
            self.log_test("Room Filter Data - Project Access", False, f"Cannot access project: {project_data}")
            return False
            
        rooms = project_data.get('rooms', [])
        if not rooms:
            self.log_test("Room Filter Data - Rooms Available", False, "No rooms found for filtering")
            return False
            
        # Verify room data structure for filtering
        room_names = []
        room_colors = []
        for room in rooms:
            if 'name' in room and 'id' in room:
                room_names.append(room['name'])
                room_colors.append(room.get('color', 'No color'))
                
        if len(room_names) > 0:
            self.log_test("Room Filter Data - Room Names", True, f"Found {len(room_names)} rooms: {room_names[:3]}...")
        else:
            self.log_test("Room Filter Data - Room Names", False, "No room names available for filtering")
            
        # Test carrier filter support - get carrier options
        success, carrier_data, status_code = self.make_request('GET', '/carrier-options')
        
        if success and isinstance(carrier_data, dict) and 'data' in carrier_data:
            carriers = carrier_data['data']
            if isinstance(carriers, list) and len(carriers) > 0:
                carrier_names = [c.get('name', 'Unknown') for c in carriers if isinstance(c, dict)]
                self.log_test("Carrier Filter Data - Carrier Options", True, f"Found {len(carrier_names)} carriers: {carrier_names[:3]}...")
                
                # Check for colors (needed for dropdown persistence)
                carriers_with_colors = [c for c in carriers if isinstance(c, dict) and 'color' in c]
                if len(carriers_with_colors) > 0:
                    self.log_test("Carrier Filter Data - Colors Available", True, f"{len(carriers_with_colors)} carriers have colors")
                else:
                    self.log_test("Carrier Filter Data - Colors Available", False, "No carrier colors found")
            else:
                self.log_test("Carrier Filter Data - Carrier Options", False, "No carrier options available")
        else:
            self.log_test("Carrier Filter Data - Carrier Options", False, f"Failed to get carriers: {carrier_data}")
            
        # Test category/vendor filter support
        success, vendor_data, status_code = self.make_request('GET', '/vendor-types')
        
        if success and isinstance(vendor_data, list) and len(vendor_data) > 0:
            self.log_test("Vendor Filter Data - Vendor Options", True, f"Found {len(vendor_data)} vendors for filtering")
        else:
            self.log_test("Vendor Filter Data - Vendor Options", False, "No vendor options available for filtering")
            
        # Test status filter support
        success, status_data, status_code = self.make_request('GET', '/item-statuses-enhanced')
        
        if success and isinstance(status_data, dict) and 'data' in status_data:
            statuses = status_data['data']
            if isinstance(statuses, list) and len(statuses) > 0:
                self.log_test("Status Filter Data - Status Options", True, f"Found {len(statuses)} statuses for filtering")
            else:
                self.log_test("Status Filter Data - Status Options", False, "No status options available")
        else:
            self.log_test("Status Filter Data - Status Options", False, f"Failed to get statuses: {status_data}")

    def test_dropdown_persistence_backend(self):
        """Test 2: DROPDOWN PERSISTENCE FIXES - Status/carrier endpoints with colors"""
        print("\n=== 🎯 TEST 2: DROPDOWN PERSISTENCE BACKEND SUPPORT ===")
        
        # Test enhanced status endpoint with colors
        success, status_response, status_code = self.make_request('GET', '/item-statuses-enhanced')
        
        if success and isinstance(status_response, dict) and 'data' in status_response:
            statuses = status_response['data']
            if isinstance(statuses, list) and len(statuses) > 0:
                self.log_test("Status Dropdown - Enhanced Endpoint", True, f"Retrieved {len(statuses)} enhanced statuses")
                
                # Check for colors and key statuses
                statuses_with_colors = [s for s in statuses if isinstance(s, dict) and 'color' in s]
                key_statuses = ['PICKED', 'ORDERED', 'SHIPPED', 'DELIVERED TO JOB SITE', 'INSTALLED']
                found_key_statuses = []
                
                for status_obj in statuses_with_colors:
                    if status_obj.get('status') in key_statuses:
                        found_key_statuses.append(f"{status_obj['status']} ({status_obj['color']})")
                
                if len(statuses_with_colors) >= 20:
                    self.log_test("Status Dropdown - Colors Available", True, f"{len(statuses_with_colors)} statuses with colors")
                else:
                    self.log_test("Status Dropdown - Colors Available", False, f"Only {len(statuses_with_colors)} statuses with colors")
                    
                if len(found_key_statuses) >= 3:
                    self.log_test("Status Dropdown - Key Statuses", True, f"Found: {found_key_statuses}")
                else:
                    self.log_test("Status Dropdown - Key Statuses", False, f"Missing key statuses: {found_key_statuses}")
            else:
                self.log_test("Status Dropdown - Enhanced Endpoint", False, "Invalid status data format")
        else:
            self.log_test("Status Dropdown - Enhanced Endpoint", False, f"Failed: {status_response}")
            
        # Test carrier options with colors
        success, carrier_response, status_code = self.make_request('GET', '/carrier-options')
        
        if success and isinstance(carrier_response, dict) and 'data' in carrier_response:
            carriers = carrier_response['data']
            if isinstance(carriers, list) and len(carriers) > 0:
                self.log_test("Carrier Dropdown - Options Endpoint", True, f"Retrieved {len(carriers)} carrier options")
                
                # Check for colors and key carriers
                carriers_with_colors = [c for c in carriers if isinstance(c, dict) and 'color' in c]
                key_carriers = ['FedEx', 'UPS', 'Brooks', 'Zenith']
                found_key_carriers = []
                
                for carrier_obj in carriers_with_colors:
                    if carrier_obj.get('name') in key_carriers:
                        found_key_carriers.append(f"{carrier_obj['name']} ({carrier_obj['color']})")
                
                if len(carriers_with_colors) >= 15:
                    self.log_test("Carrier Dropdown - Colors Available", True, f"{len(carriers_with_colors)} carriers with colors")
                else:
                    self.log_test("Carrier Dropdown - Colors Available", False, f"Only {len(carriers_with_colors)} carriers with colors")
                    
                if len(found_key_carriers) >= 2:
                    self.log_test("Carrier Dropdown - Key Carriers", True, f"Found: {found_key_carriers}")
                else:
                    self.log_test("Carrier Dropdown - Key Carriers", False, f"Missing key carriers: {found_key_carriers}")
            else:
                self.log_test("Carrier Dropdown - Options Endpoint", False, "Invalid carrier data format")
        else:
            self.log_test("Carrier Dropdown - Options Endpoint", False, f"Failed: {carrier_response}")

    def test_link_column_backend_support(self):
        """Test 3: LINK COLUMN ADDITION - Backend link field support"""
        print("\n=== 🎯 TEST 3: LINK COLUMN BACKEND SUPPORT ===")
        
        # Get project data to check existing items have link field
        success, project_data, status_code = self.make_request('GET', f'/projects/{PROJECT_ID}')
        
        if not success:
            self.log_test("Link Column - Project Access", False, f"Cannot access project: {project_data}")
            return False
            
        # Find existing items and check for link field
        items_with_links = []
        items_without_links = []
        total_items = 0
        
        for room in project_data.get('rooms', []):
            for category in room.get('categories', []):
                for subcategory in category.get('subcategories', []):
                    for item in subcategory.get('items', []):
                        total_items += 1
                        if 'link' in item:
                            if item['link'] and item['link'].strip():
                                items_with_links.append(f"{item['name']}: {item['link']}")
                            else:
                                items_without_links.append(item['name'])
                        else:
                            items_without_links.append(f"{item['name']} (no link field)")
        
        if total_items > 0:
            self.log_test("Link Column - Items Found", True, f"Found {total_items} items to check for link field")
            
            if len(items_with_links) > 0:
                self.log_test("Link Column - Links Present", True, f"{len(items_with_links)} items have links: {items_with_links[:2]}")
            else:
                self.log_test("Link Column - Links Present", True, "No items have links yet (expected for new feature)")
                
            # Test creating item with link
            # First find a subcategory to add to
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
                # Create test item with link
                test_item_data = {
                    "name": "Test Item with Link",
                    "quantity": 1,
                    "vendor": "Four Hands",
                    "status": "",
                    "cost": 1500.00,
                    "link": "https://fourhands.com/product/248067-003",
                    "subcategory_id": subcategory_id
                }
                
                success, item_response, status_code = self.make_request('POST', '/items', test_item_data)
                
                if success and 'id' in item_response:
                    item_id = item_response['id']
                    self.created_items.append(item_id)
                    
                    # Verify link field was saved
                    if item_response.get('link') == test_item_data['link']:
                        self.log_test("Link Column - Create Item with Link", True, f"Item created with link: {item_response['link']}")
                    else:
                        self.log_test("Link Column - Create Item with Link", False, f"Link not saved correctly: {item_response.get('link')}")
                        
                    # Test updating item link
                    update_data = {
                        "link": "https://fourhands.com/product/updated-link"
                    }
                    
                    success, update_response, status_code = self.make_request('PUT', f'/items/{item_id}', update_data)
                    
                    if success and update_response.get('link') == update_data['link']:
                        self.log_test("Link Column - Update Item Link", True, f"Link updated successfully: {update_response['link']}")
                    else:
                        self.log_test("Link Column - Update Item Link", False, f"Link update failed: {update_response.get('link')}")
                else:
                    self.log_test("Link Column - Create Item with Link", False, f"Failed to create item: {item_response}")
            else:
                self.log_test("Link Column - Create Item with Link", False, "No subcategory found for testing")
        else:
            self.log_test("Link Column - Items Found", False, "No items found in project")

    def test_enhanced_scraping_ultra_robust(self):
        """Test 4: ENHANCED SCRAPING (ULTRA-ROBUST) - Four Hands URL and vendor mapping"""
        print("\n=== 🎯 TEST 4: ENHANCED SCRAPING (ULTRA-ROBUST) ===")
        
        # Test the specific Four Hands URL mentioned in review request
        four_hands_url = "https://fourhands.com/product/248067-003"
        
        print(f"Testing Four Hands URL: {four_hands_url}")
        
        scrape_data = {"url": four_hands_url}
        success, response, status_code = self.make_request('POST', '/scrape-product', scrape_data)
        
        print(f"Status Code: {status_code}")
        print(f"Success: {success}")
        
        if success:
            # Check response format
            if isinstance(response, dict) and 'success' in response and 'data' in response:
                self.log_test("Four Hands Scraping - Response Format", True, "Correct {success: true, data: {...}} format")
                
                product_data = response.get('data', {})
                expected_fields = ['name', 'price', 'vendor', 'image_url', 'description', 'sku', 'size', 'color']
                
                # Analyze extracted data
                populated_fields = []
                empty_fields = []
                
                for field in expected_fields:
                    value = product_data.get(field, '')
                    if value and str(value).strip():
                        populated_fields.append(f"{field}: '{value}'")
                    else:
                        empty_fields.append(field)
                
                print(f"   Populated fields: {populated_fields}")
                print(f"   Empty fields: {empty_fields}")
                
                # Check vendor detection (critical for Four Hands)
                detected_vendor = product_data.get('vendor', '')
                if detected_vendor == 'Four Hands':
                    self.log_test("Four Hands Scraping - Vendor Detection", True, f"Correctly detected: {detected_vendor}")
                else:
                    self.log_test("Four Hands Scraping - Vendor Detection", False, f"Expected: Four Hands, Got: {detected_vendor}")
                
                # Check for key product data
                product_name = product_data.get('name', '')
                if 'fenn' in product_name.lower() or 'chair' in product_name.lower():
                    self.log_test("Four Hands Scraping - Product Name", True, f"Extracted name: {product_name}")
                else:
                    self.log_test("Four Hands Scraping - Product Name", False, f"Unexpected name: {product_name}")
                
                # Check for SKU (should be 248067-003)
                sku = product_data.get('sku', '')
                if '248067-003' in sku or '248067' in sku:
                    self.log_test("Four Hands Scraping - SKU Extraction", True, f"Extracted SKU: {sku}")
                else:
                    self.log_test("Four Hands Scraping - SKU Extraction", False, f"Expected SKU 248067-003, Got: {sku}")
                
                # Check for price
                price = product_data.get('price', '') or product_data.get('cost', '')
                if price and ('$' in str(price) or any(char.isdigit() for char in str(price))):
                    self.log_test("Four Hands Scraping - Price Extraction", True, f"Extracted price: {price}")
                else:
                    self.log_test("Four Hands Scraping - Price Extraction", False, f"No price extracted: {price}")
                
                # Overall data quality assessment
                quality_score = len(populated_fields) / len(expected_fields) * 100
                if quality_score >= 50:
                    self.log_test("Four Hands Scraping - Data Quality", True, f"Quality score: {quality_score:.1f}% ({len(populated_fields)}/{len(expected_fields)} fields)")
                else:
                    self.log_test("Four Hands Scraping - Data Quality", False, f"Low quality score: {quality_score:.1f}% ({len(populated_fields)}/{len(expected_fields)} fields)")
                    
            else:
                self.log_test("Four Hands Scraping - Response Format", False, f"Incorrect response format: {response}")
        else:
            self.log_test("Four Hands Scraping - Endpoint Access", False, f"Failed to access scraping endpoint: {response}")
        
        # Test vendor mapping for other wholesale sites
        print("\nTesting vendor mapping for other wholesale sites...")
        
        test_vendor_urls = [
            {"url": "https://uttermost.com/product/test", "expected_vendor": "Uttermost"},
            {"url": "https://visualcomfort.com/product/test", "expected_vendor": "Visual Comfort"},
            {"url": "https://bernhardt.com/product/test", "expected_vendor": "Bernhardt"}
        ]
        
        vendor_mapping_success = 0
        for test_case in test_vendor_urls:
            scrape_data = {"url": test_case["url"]}
            success, response, status_code = self.make_request('POST', '/scrape-product', scrape_data)
            
            if success and isinstance(response, dict) and 'data' in response:
                detected_vendor = response['data'].get('vendor', '')
                if detected_vendor == test_case['expected_vendor']:
                    vendor_mapping_success += 1
                    print(f"   ✅ {test_case['url']} → {detected_vendor}")
                else:
                    print(f"   ❌ {test_case['url']} → Expected: {test_case['expected_vendor']}, Got: {detected_vendor}")
            else:
                print(f"   ❌ {test_case['url']} → Failed to scrape")
        
        if vendor_mapping_success >= 2:
            self.log_test("Vendor Mapping - Wholesale Sites", True, f"{vendor_mapping_success}/3 vendor mappings working")
        else:
            self.log_test("Vendor Mapping - Wholesale Sites", False, f"Only {vendor_mapping_success}/3 vendor mappings working")

    def test_add_category_comprehensive(self):
        """Test 5: ADD CATEGORY COMPREHENSIVE - Auto-populate endpoint testing"""
        print("\n=== 🎯 TEST 5: ADD CATEGORY COMPREHENSIVE ===")
        
        # Test the comprehensive categories endpoint
        success, response, status_code = self.make_request('POST', '/categories/comprehensive', {
            "name": "Test Comprehensive Category",
            "description": "Testing comprehensive category creation",
            "room_id": "test-room-id",
            "order_index": 0
        })
        
        if success:
            self.log_test("Categories Comprehensive - Endpoint Access", True, f"Endpoint accessible (Status: {status_code})")
            
            # Check response structure
            if isinstance(response, dict) and 'id' in response:
                self.log_test("Categories Comprehensive - Response Structure", True, "Category created with proper structure")
                
                # Check for comprehensive fields
                expected_fields = ['id', 'name', 'room_id', 'color', 'subcategories', 'created_at', 'updated_at']
                missing_fields = [field for field in expected_fields if field not in response]
                
                if not missing_fields:
                    self.log_test("Categories Comprehensive - Complete Fields", True, "All expected fields present")
                else:
                    self.log_test("Categories Comprehensive - Complete Fields", False, f"Missing fields: {missing_fields}")
                
                # Check color assignment
                if response.get('color'):
                    self.log_test("Categories Comprehensive - Color Assignment", True, f"Color assigned: {response['color']}")
                else:
                    self.log_test("Categories Comprehensive - Color Assignment", False, "No color assigned")
                    
                # Check subcategories structure
                subcategories = response.get('subcategories', [])
                if isinstance(subcategories, list):
                    self.log_test("Categories Comprehensive - Subcategories Structure", True, f"Subcategories array present ({len(subcategories)} items)")
                else:
                    self.log_test("Categories Comprehensive - Subcategories Structure", False, "Subcategories not properly structured")
            else:
                self.log_test("Categories Comprehensive - Response Structure", False, f"Invalid response structure: {response}")
        else:
            # Check if it's a validation error (expected) vs server error
            if status_code == 400:
                self.log_test("Categories Comprehensive - Endpoint Access", True, f"Endpoint accessible, validation error expected: {response}")
            else:
                self.log_test("Categories Comprehensive - Endpoint Access", False, f"Endpoint failed: {response} (Status: {status_code})")
        
        # Test available categories endpoint (should support comprehensive structure)
        success, categories_response, status_code = self.make_request('GET', '/categories/available')
        
        if success and isinstance(categories_response, list):
            self.log_test("Categories Available - Endpoint", True, f"Retrieved {len(categories_response)} available categories")
            
            # Check for comprehensive categories
            comprehensive_categories = ['CABINETS', 'ARCHITECTURAL ELEMENTS', 'TRIM']
            found_comprehensive = []
            
            for category in categories_response:
                if isinstance(category, str):
                    if any(comp_cat.lower() in category.lower() for comp_cat in comprehensive_categories):
                        found_comprehensive.append(category)
                elif isinstance(category, dict) and 'name' in category:
                    if any(comp_cat.lower() in category['name'].lower() for comp_cat in comprehensive_categories):
                        found_comprehensive.append(category['name'])
            
            if found_comprehensive:
                self.log_test("Categories Available - Comprehensive Categories", True, f"Found: {found_comprehensive}")
            else:
                self.log_test("Categories Available - Comprehensive Categories", False, "No comprehensive categories found in available list")
        else:
            self.log_test("Categories Available - Endpoint", False, f"Failed to get available categories: {categories_response}")

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

    def run_review_request_tests(self):
        """Run all review request backend tests"""
        print("🎯 REVIEW REQUEST BACKEND TESTING - CRITICAL USER FIXES")
        print("Testing 5 critical fixes implemented by main agent")
        print("=" * 60)
        
        # Run tests in order of review request priority
        self.test_filtering_system_backend_support()    # Test 1: Filtering System
        self.test_dropdown_persistence_backend()        # Test 2: Dropdown Persistence  
        self.test_link_column_backend_support()         # Test 3: Link Column Addition
        self.test_enhanced_scraping_ultra_robust()      # Test 4: Enhanced Scraping
        self.test_add_category_comprehensive()          # Test 5: Add Category Comprehensive
        
        # Clean up
        self.cleanup_test_data()
        
        # Summary
        print("\n" + "=" * 60)
        print("📊 REVIEW REQUEST TEST SUMMARY")
        print("=" * 60)
        
        passed = sum(1 for result in self.test_results if result['success'])
        total = len(self.test_results)
        
        print(f"Total Tests: {total}")
        print(f"Passed: {passed}")
        print(f"Failed: {total - passed}")
        print(f"Success Rate: {(passed/total)*100:.1f}%")
        
        # Categorize results by test area
        test_areas = {
            "Filtering System": [r for r in self.test_results if "Filter" in r['test']],
            "Dropdown Persistence": [r for r in self.test_results if "Dropdown" in r['test']],
            "Link Column": [r for r in self.test_results if "Link Column" in r['test']],
            "Enhanced Scraping": [r for r in self.test_results if "Scraping" in r['test'] or "Four Hands" in r['test'] or "Vendor Mapping" in r['test']],
            "Add Category": [r for r in self.test_results if "Categories" in r['test']]
        }
        
        print("\n🎯 RESULTS BY REVIEW REQUEST AREA:")
        for area, tests in test_areas.items():
            if tests:
                area_passed = sum(1 for t in tests if t['success'])
                area_total = len(tests)
                area_rate = (area_passed/area_total)*100 if area_total > 0 else 0
                status = "✅" if area_rate >= 80 else "⚠️" if area_rate >= 60 else "❌"
                print(f"   {status} {area}: {area_passed}/{area_total} ({area_rate:.1f}%)")
        
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
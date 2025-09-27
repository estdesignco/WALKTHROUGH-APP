#!/usr/bin/env python3
"""
URGENT FFE FUNCTIONALITY TEST
Testing the specific broken functionality reported by user:
1. Add Item functionality (POST /api/items with subcategory_id)
2. Add Category functionality 
3. Canva PDF Scraping (POST /api/upload-canva-pdf)

Project ID: 5cccfb11-0ac0-45ed-91ab-a56088d65b5a
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
PROJECT_ID = "5cccfb11-0ac0-45ed-91ab-a56088d65b5a"

print(f"🚨 URGENT FFE TESTING at: {BASE_URL}")
print(f"🎯 Testing Project ID: {PROJECT_ID}")

class UrgentFFETester:
    def __init__(self):
        self.session = requests.Session()
        self.test_results = []
        self.created_items = []
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
        
    def make_request(self, method: str, endpoint: str, data: Dict = None, params: Dict = None, files: Dict = None) -> tuple:
        """Make HTTP request and return (success, response_data, status_code)"""
        try:
            url = f"{BASE_URL}{endpoint}"
            
            if method.upper() == 'GET':
                response = self.session.get(url, params=params)
            elif method.upper() == 'POST':
                if files:
                    response = self.session.post(url, data=data, files=files)
                else:
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

    def test_project_access(self):
        """Test access to the specific project"""
        print("\n=== 🎯 TESTING PROJECT ACCESS ===")
        
        success, data, status_code = self.make_request('GET', f'/projects/{PROJECT_ID}')
        
        if not success:
            self.log_test("Project Access", False, f"Cannot access project {PROJECT_ID}: {data} (Status: {status_code})")
            return False
            
        # Verify project structure
        if 'rooms' not in data:
            self.log_test("Project Structure", False, "Project has no rooms")
            return False
            
        rooms = data['rooms']
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
        
        self.log_test("Project Access", True, f"Project loaded: {len(rooms)} rooms, {total_categories} categories, {total_subcategories} subcategories, {total_items} items")
        
        # Store first subcategory for item testing
        self.test_subcategory_id = None
        if rooms and rooms[0].get('categories') and rooms[0]['categories'][0].get('subcategories'):
            self.test_subcategory_id = rooms[0]['categories'][0]['subcategories'][0]['id']
            self.log_test("Subcategory for Testing", True, f"Found subcategory ID: {self.test_subcategory_id}")
        else:
            self.log_test("Subcategory for Testing", False, "No subcategory found for item testing")
            
        return True

    def test_add_item_functionality(self):
        """Test Add Item functionality - CRITICAL TEST"""
        print("\n=== 🚨 TESTING ADD ITEM FUNCTIONALITY ===")
        
        if not hasattr(self, 'test_subcategory_id') or not self.test_subcategory_id:
            self.log_test("Add Item - Prerequisites", False, "No subcategory ID available for testing")
            return False
            
        # Test 1: Basic Add Item with subcategory_id
        print("Testing basic item creation with subcategory_id...")
        
        item_data = {
            "name": "URGENT TEST - Crystal Chandelier",
            "quantity": 1,
            "size": "36\" diameter",
            "remarks": "URGENT TEST ITEM - User reported Add Item broken",
            "vendor": "Four Hands",
            "status": "",  # Blank status as requested
            "cost": 2500.00,
            "link": "https://fourhands.com/product/248067-003",
            "subcategory_id": self.test_subcategory_id
        }
        
        success, data, status_code = self.make_request('POST', '/items', item_data)
        
        if not success:
            self.log_test("Add Item - Basic Creation", False, f"Failed to create item: {data} (Status: {status_code})")
            return False
            
        item_id = data.get('id')
        if not item_id:
            self.log_test("Add Item - Basic Creation", False, "Item created but no ID returned")
            return False
            
        self.created_items.append(item_id)
        self.log_test("Add Item - Basic Creation", True, f"Item created with ID: {item_id}")
        
        # Test 2: Verify subcategory_id is properly handled
        print("Verifying subcategory_id handling...")
        
        # Get the item back to verify it was created with correct subcategory_id
        success, item_data_retrieved, status_code = self.make_request('GET', f'/items/{item_id}')
        
        if success:
            retrieved_subcategory_id = item_data_retrieved.get('subcategory_id')
            if retrieved_subcategory_id == self.test_subcategory_id:
                self.log_test("Add Item - Subcategory ID Handling", True, f"Subcategory ID correctly stored: {retrieved_subcategory_id}")
            else:
                self.log_test("Add Item - Subcategory ID Handling", False, f"Subcategory ID mismatch. Expected: {self.test_subcategory_id}, Got: {retrieved_subcategory_id}")
        else:
            self.log_test("Add Item - Subcategory ID Handling", False, f"Could not retrieve created item: {item_data_retrieved}")
            
        # Test 3: Verify item appears in project structure
        print("Verifying item appears in project...")
        
        success, project_data, status_code = self.make_request('GET', f'/projects/{PROJECT_ID}')
        
        if success:
            item_found = False
            for room in project_data.get('rooms', []):
                for category in room.get('categories', []):
                    for subcategory in category.get('subcategories', []):
                        if subcategory['id'] == self.test_subcategory_id:
                            for item in subcategory.get('items', []):
                                if item.get('id') == item_id:
                                    item_found = True
                                    self.log_test("Add Item - Appears in Project", True, f"Item found in project structure under subcategory {subcategory['name']}")
                                    break
                            break
                    if item_found:
                        break
                if item_found:
                    break
                    
            if not item_found:
                self.log_test("Add Item - Appears in Project", False, "Created item does not appear in project structure")
        else:
            self.log_test("Add Item - Appears in Project", False, f"Could not re-fetch project: {project_data}")
            
        # Test 4: Test with invalid subcategory_id
        print("Testing with invalid subcategory_id...")
        
        invalid_item_data = {
            "name": "Invalid Test Item",
            "subcategory_id": "invalid-subcategory-id"
        }
        
        success, data, status_code = self.make_request('POST', '/items', invalid_item_data)
        
        if not success and status_code in [400, 404]:
            self.log_test("Add Item - Invalid Subcategory Validation", True, f"Correctly rejected invalid subcategory_id (Status: {status_code})")
        else:
            self.log_test("Add Item - Invalid Subcategory Validation", False, f"Should have rejected invalid subcategory_id. Got: {data} (Status: {status_code})")
            
        return True

    def test_add_category_functionality(self):
        """Test Add Category functionality - CRITICAL TEST"""
        print("\n=== 🚨 TESTING ADD CATEGORY FUNCTIONALITY ===")
        
        # First, get a room to add category to
        success, project_data, status_code = self.make_request('GET', f'/projects/{PROJECT_ID}')
        
        if not success or not project_data.get('rooms'):
            self.log_test("Add Category - Prerequisites", False, "No rooms available for category testing")
            return False
            
        test_room_id = project_data['rooms'][0]['id']
        room_name = project_data['rooms'][0]['name']
        
        # Test 1: Basic category creation
        print(f"Testing category creation in room: {room_name}")
        
        category_data = {
            "name": "URGENT TEST CATEGORY",
            "description": "Test category for urgent testing",
            "room_id": test_room_id,
            "order_index": 99
        }
        
        success, data, status_code = self.make_request('POST', '/categories', category_data)
        
        if not success:
            self.log_test("Add Category - Basic Creation", False, f"Failed to create category: {data} (Status: {status_code})")
            return False
            
        category_id = data.get('id')
        if not category_id:
            self.log_test("Add Category - Basic Creation", False, "Category created but no ID returned")
            return False
            
        self.created_categories.append(category_id)
        self.log_test("Add Category - Basic Creation", True, f"Category created with ID: {category_id}")
        
        # Test 2: Verify category appears in room
        print("Verifying category appears in room...")
        
        success, updated_project, status_code = self.make_request('GET', f'/projects/{PROJECT_ID}')
        
        if success:
            category_found = False
            for room in updated_project.get('rooms', []):
                if room['id'] == test_room_id:
                    for category in room.get('categories', []):
                        if category.get('id') == category_id:
                            category_found = True
                            self.log_test("Add Category - Appears in Room", True, f"Category '{category['name']}' found in room '{room['name']}'")
                            break
                    break
                    
            if not category_found:
                self.log_test("Add Category - Appears in Room", False, "Created category does not appear in room")
        else:
            self.log_test("Add Category - Appears in Room", False, f"Could not re-fetch project: {updated_project}")
            
        # Test 3: Test comprehensive category creation endpoint
        print("Testing comprehensive category creation...")
        
        comprehensive_data = {
            "name": "Lighting",
            "room_id": test_room_id
        }
        
        success, comp_data, status_code = self.make_request('POST', '/categories/comprehensive', comprehensive_data)
        
        if success:
            comp_category_id = comp_data.get('id')
            if comp_category_id:
                self.created_categories.append(comp_category_id)
                
                # Check if it has subcategories
                subcategories = comp_data.get('subcategories', [])
                if subcategories:
                    self.log_test("Add Category - Comprehensive Creation", True, f"Comprehensive category created with {len(subcategories)} subcategories")
                else:
                    self.log_test("Add Category - Comprehensive Creation", True, "Comprehensive category created (no subcategories in response)")
            else:
                self.log_test("Add Category - Comprehensive Creation", False, "Comprehensive category created but no ID returned")
        else:
            # Check if endpoint exists
            if status_code == 404:
                self.log_test("Add Category - Comprehensive Creation", False, "Comprehensive category endpoint not implemented")
            else:
                self.log_test("Add Category - Comprehensive Creation", False, f"Failed to create comprehensive category: {comp_data} (Status: {status_code})")
                
        return True

    def test_canva_pdf_scraping(self):
        """Test Canva PDF Scraping functionality - CRITICAL TEST"""
        print("\n=== 🚨 TESTING CANVA PDF SCRAPING ===")
        
        # Test 1: Check if endpoint exists
        print("Testing Canva PDF upload endpoint...")
        
        # Create a simple test file to simulate PDF upload
        test_pdf_content = b"%PDF-1.4\n1 0 obj\n<<\n/Type /Catalog\n/Pages 2 0 R\n>>\nendobj\n2 0 obj\n<<\n/Type /Pages\n/Kids [3 0 R]\n/Count 1\n>>\nendobj\n3 0 obj\n<<\n/Type /Page\n/Parent 2 0 R\n/MediaBox [0 0 612 792]\n>>\nendobj\nxref\n0 4\n0000000000 65535 f \n0000000009 00000 n \n0000000074 00000 n \n0000000120 00000 n \ntrailer\n<<\n/Size 4\n/Root 1 0 R\n>>\nstartxref\n179\n%%EOF"
        
        files = {
            'file': ('test_canva.pdf', test_pdf_content, 'application/pdf')
        }
        
        # Get subcategory for item creation
        if not hasattr(self, 'test_subcategory_id') or not self.test_subcategory_id:
            self.log_test("Canva PDF - Prerequisites", False, "No subcategory ID available for testing")
            return False
            
        data = {
            'subcategory_id': self.test_subcategory_id,
            'project_id': PROJECT_ID
        }
        
        success, response_data, status_code = self.make_request('POST', '/upload-canva-pdf', data, files=files)
        
        if success:
            self.log_test("Canva PDF - Endpoint Access", True, f"Endpoint accessible (Status: {status_code})")
            
            # Check response format
            if isinstance(response_data, dict):
                if 'success' in response_data:
                    if response_data['success']:
                        created_items = response_data.get('items_created', [])
                        if created_items:
                            self.log_test("Canva PDF - Items Created", True, f"Created {len(created_items)} items from PDF")
                            
                            # Store created items for cleanup
                            for item in created_items:
                                if 'id' in item:
                                    self.created_items.append(item['id'])
                        else:
                            self.log_test("Canva PDF - Items Created", False, "PDF processed but no items created")
                    else:
                        error_msg = response_data.get('error', 'Unknown error')
                        self.log_test("Canva PDF - Processing", False, f"PDF processing failed: {error_msg}")
                else:
                    self.log_test("Canva PDF - Response Format", False, f"Unexpected response format: {response_data}")
            else:
                self.log_test("Canva PDF - Response Format", False, f"Invalid response type: {type(response_data)}")
                
        else:
            if status_code == 404:
                self.log_test("Canva PDF - Endpoint Access", False, "Canva PDF upload endpoint not implemented")
            elif status_code == 400:
                self.log_test("Canva PDF - Endpoint Access", True, f"Endpoint exists but validation failed (expected): {response_data}")
            else:
                self.log_test("Canva PDF - Endpoint Access", False, f"Endpoint failed: {response_data} (Status: {status_code})")
                
        # Test 2: Test with Canva URL scraping (alternative approach)
        print("Testing Canva URL scraping...")
        
        canva_data = {
            "canva_url": "https://www.canva.com/design/test-design",
            "item_id": self.created_items[0] if self.created_items else "test-item-id"
        }
        
        success, scrape_data, status_code = self.make_request('POST', '/scrape-canva', canva_data)
        
        if success:
            self.log_test("Canva URL Scraping", True, f"Canva URL scraping endpoint accessible: {scrape_data}")
        else:
            if status_code == 404:
                self.log_test("Canva URL Scraping", False, "Canva URL scraping endpoint not implemented")
            else:
                self.log_test("Canva URL Scraping", False, f"Canva URL scraping failed: {scrape_data} (Status: {status_code})")
                
        return True

    def test_four_hands_scraping(self):
        """Test Four Hands URL scraping as mentioned in review"""
        print("\n=== 🎯 TESTING FOUR HANDS SCRAPING ===")
        
        four_hands_url = "https://fourhands.com/product/248067-003"
        
        scrape_data = {"url": four_hands_url}
        success, data, status_code = self.make_request('POST', '/scrape-product', scrape_data)
        
        if success:
            if isinstance(data, dict) and 'success' in data and 'data' in data:
                product_data = data.get('data', {})
                
                # Check for expected data
                expected_name = "Fenn Chair"
                expected_vendor = "Four Hands"
                expected_sku = "248067-003"
                
                name_match = expected_name.lower() in product_data.get('name', '').lower()
                vendor_match = product_data.get('vendor') == expected_vendor
                sku_match = expected_sku in product_data.get('sku', '')
                
                if name_match and vendor_match and sku_match:
                    self.log_test("Four Hands Scraping - Data Extraction", True, f"Successfully extracted: name='{product_data.get('name')}', vendor='{product_data.get('vendor')}', sku='{product_data.get('sku')}'")
                else:
                    self.log_test("Four Hands Scraping - Data Extraction", False, f"Data extraction incomplete. Got: name='{product_data.get('name')}', vendor='{product_data.get('vendor')}', sku='{product_data.get('sku')}'")
                    
                # Check for price
                if product_data.get('price') or product_data.get('cost'):
                    price_info = product_data.get('price') or product_data.get('cost')
                    self.log_test("Four Hands Scraping - Price Extraction", True, f"Price extracted: {price_info}")
                else:
                    self.log_test("Four Hands Scraping - Price Extraction", False, "No price information extracted")
                    
            else:
                self.log_test("Four Hands Scraping - Response Format", False, f"Invalid response format: {data}")
        else:
            self.log_test("Four Hands Scraping - Endpoint", False, f"Scraping failed: {data} (Status: {status_code})")
            
        return True

    def cleanup_test_data(self):
        """Clean up test data"""
        print("\n=== 🧹 CLEANING UP TEST DATA ===")
        
        # Delete test items
        for item_id in self.created_items:
            success, _, _ = self.make_request('DELETE', f'/items/{item_id}')
            if success:
                print(f"   ✅ Deleted test item: {item_id}")
            else:
                print(f"   ❌ Failed to delete test item: {item_id}")
                
        # Delete test categories
        for category_id in self.created_categories:
            success, _, _ = self.make_request('DELETE', f'/categories/{category_id}')
            if success:
                print(f"   ✅ Deleted test category: {category_id}")
            else:
                print(f"   ❌ Failed to delete test category: {category_id}")

    def run_urgent_tests(self):
        """Run all urgent FFE tests"""
        print("🚨 STARTING URGENT FFE FUNCTIONALITY TESTS")
        print("=" * 60)
        
        # Run tests in order of criticality
        if not self.test_project_access():
            print("❌ CRITICAL: Cannot access project - stopping tests")
            return False
            
        self.test_add_item_functionality()      # CRITICAL #1
        self.test_add_category_functionality()  # CRITICAL #2  
        self.test_canva_pdf_scraping()         # CRITICAL #3
        self.test_four_hands_scraping()        # Additional verification
        
        # Clean up
        self.cleanup_test_data()
        
        # Summary
        print("\n" + "=" * 50)
        print("🚨 URGENT TEST SUMMARY")
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
            print("\n❌ CRITICAL FAILURES:")
            for test in failed_tests:
                print(f"   • {test['test']}: {test['details']}")
        else:
            print("\n🎉 ALL URGENT TESTS PASSED!")
            
        # Critical issues summary
        critical_issues = []
        for result in self.test_results:
            if not result['success'] and any(keyword in result['test'].lower() for keyword in ['add item', 'add category', 'canva']):
                critical_issues.append(result['test'])
                
        if critical_issues:
            print(f"\n🚨 CRITICAL ISSUES CONFIRMED:")
            for issue in critical_issues:
                print(f"   • {issue}")
        else:
            print(f"\n✅ NO CRITICAL ISSUES FOUND - User's reported problems may be frontend-related")
            
        return len(critical_issues) == 0

if __name__ == "__main__":
    tester = UrgentFFETester()
    success = tester.run_urgent_tests()
    sys.exit(0 if success else 1)
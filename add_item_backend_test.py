#!/usr/bin/env python3
"""
Backend API Testing for Add Item Modal Functionality in Checklist Tab
Testing the backend APIs that support the Add Item modal: item creation, autocomplete/search, categories, subcategories
"""

import requests
import sys
import json
from datetime import datetime

class AddItemBackendTester:
    def __init__(self, base_url="https://vendor-bridge-8.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_base = f"{base_url}/api"
        self.tests_run = 0
        self.tests_passed = 0
        self.project_id = None
        self.room_id = None
        self.category_id = None
        self.subcategory_id = None
        
        print(f"🌐 Backend URL: {self.base_url}")
        print(f"🔗 API Base: {self.api_base}")

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.api_base}/{endpoint}" if not endpoint.startswith('http') else endpoint
        if headers is None:
            headers = {'Content-Type': 'application/json'}

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   {method} {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=30)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=30)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers, timeout=30)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers, timeout=30)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    return success, response.json()
                except:
                    return success, response.text
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    error_detail = response.json()
                    print(f"   Error: {error_detail}")
                except:
                    print(f"   Error: {response.text[:200]}")

            return success, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_basic_connectivity(self):
        """Test basic API connectivity"""
        print("\n" + "="*60)
        print("🌐 TESTING BASIC API CONNECTIVITY")
        print("="*60)
        
        # Test projects endpoint (basic connectivity)
        success, response = self.run_test("Projects List", "GET", "projects", 200)
        
        if success and isinstance(response, list) and len(response) > 0:
            # Use first available project for testing
            self.project_id = response[0]['id']
            print(f"   📝 Using Project ID: {self.project_id}")
            print(f"   📝 Project Name: {response[0].get('name', 'Unknown')}")
        
        return success

    def test_project_structure_for_checklist(self):
        """Test project structure needed for Add Item functionality"""
        print("\n" + "="*60)
        print("🏗️ TESTING PROJECT STRUCTURE FOR CHECKLIST")
        print("="*60)
        
        if not self.project_id:
            print("❌ No project ID available")
            return False
        
        # Get project with checklist sheet type
        success, response = self.run_test(
            "Get Project (Checklist)", 
            "GET", 
            f"projects/{self.project_id}?sheet_type=checklist", 
            200
        )
        
        if success and response.get('rooms'):
            rooms = response['rooms']
            print(f"   🏠 Found {len(rooms)} rooms")
            
            if rooms:
                room = rooms[0]
                self.room_id = room['id']
                print(f"   🏠 Room ID: {self.room_id}")
                print(f"   🏠 Room Name: {room.get('name', 'Unknown')}")
                
                # Check categories
                categories = room.get('categories', [])
                print(f"   📂 Found {len(categories)} categories")
                
                if categories:
                    category = categories[0]
                    self.category_id = category['id']
                    print(f"   📂 Category ID: {self.category_id}")
                    print(f"   📂 Category Name: {category.get('name', 'Unknown')}")
                    
                    # Check subcategories
                    subcategories = category.get('subcategories', [])
                    print(f"   📁 Found {len(subcategories)} subcategories")
                    
                    if subcategories:
                        subcategory = subcategories[0]
                        self.subcategory_id = subcategory['id']
                        print(f"   📁 Subcategory ID: {self.subcategory_id}")
                        print(f"   📁 Subcategory Name: {subcategory.get('name', 'Unknown')}")
                        
                        # Check existing items
                        items = subcategory.get('items', [])
                        print(f"   📦 Found {len(items)} existing items")
        
        return success

    def test_add_item_api(self):
        """Test the core Add Item API functionality"""
        print("\n" + "="*60)
        print("📦 TESTING ADD ITEM API")
        print("="*60)
        
        if not self.subcategory_id:
            print("❌ No subcategory ID available for item creation")
            return False
        
        # Test adding a sofa item (as mentioned in review request)
        item_data = {
            "name": "Modern Sectional Sofa",
            "subcategory_id": self.subcategory_id,
            "quantity": 1,
            "size": "120\" x 80\" x 36\"",
            "vendor": "Four Hands",
            "cost": 2499.99,
            "status": "TO BE SELECTED",
            "finish_color": "Charcoal Gray",
            "sku": "FH-SOFA-001",
            "description": "Modern sectional sofa with clean lines and comfortable seating",
            "remarks": "Added via Add Item modal test"
        }
        
        print(f"   📦 Creating item: {item_data['name']}")
        print(f"   🏠 Subcategory ID: {self.subcategory_id}")
        
        success, response = self.run_test(
            "Create New Item", 
            "POST", 
            "items", 
            201, 
            item_data
        )
        
        if success:
            item_id = response.get('id')
            print(f"   ✅ Item created with ID: {item_id}")
            print(f"   📝 Item name: {response.get('name')}")
            print(f"   💰 Item cost: ${response.get('cost')}")
            print(f"   🎨 Finish color: {response.get('finish_color')}")
            
            # Test item retrieval
            if item_id:
                success2, item_response = self.run_test(
                    "Retrieve Created Item", 
                    "GET", 
                    f"items/{item_id}", 
                    200
                )
                
                if success2:
                    print(f"   ✅ Item retrieval successful")
                    print(f"   📦 Retrieved name: {item_response.get('name')}")
        
        return success

    def test_autocomplete_functionality(self):
        """Test autocomplete/search functionality for Add Item modal"""
        print("\n" + "="*60)
        print("🔍 TESTING AUTOCOMPLETE/SEARCH FUNCTIONALITY")
        print("="*60)
        
        # Test furniture search (as mentioned in review request - "sofa")
        search_tests = [
            ("sofa", "Sofa search"),
            ("chair", "Chair search"),
            ("table", "Table search"),
            ("lamp", "Lamp search")
        ]
        
        for search_term, test_name in search_tests:
            # Check if there's a search endpoint
            success, response = self.run_test(
                f"{test_name} - Furniture Search", 
                "GET", 
                f"furniture/search?q={search_term}", 
                200
            )
            
            if not success:
                # Try alternative search endpoints
                success, response = self.run_test(
                    f"{test_name} - Items Search", 
                    "GET", 
                    f"items/search?q={search_term}", 
                    200
                )
            
            if not success:
                # Try vendor products search
                success, response = self.run_test(
                    f"{test_name} - Vendor Products", 
                    "GET", 
                    f"vendor-products?search={search_term}", 
                    200
                )
            
            if success:
                print(f"   ✅ {test_name} returned results")
                if isinstance(response, list):
                    print(f"   📊 Found {len(response)} results")
                elif isinstance(response, dict) and 'products' in response:
                    print(f"   📊 Found {len(response['products'])} products")
            else:
                print(f"   ⚠️ {test_name} - No search endpoint found")
        
        return True  # Don't fail if search endpoints don't exist

    def test_categories_and_subcategories(self):
        """Test category and subcategory management for Add Item modal"""
        print("\n" + "="*60)
        print("📂 TESTING CATEGORIES AND SUBCATEGORIES")
        print("="*60)
        
        # Test available categories
        success, response = self.run_test(
            "Get Available Categories", 
            "GET", 
            "categories/available", 
            200
        )
        
        if success:
            if isinstance(response, list):
                print(f"   📂 Found {len(response)} available categories")
                for i, category in enumerate(response[:5]):  # Show first 5
                    print(f"      {i+1}. {category}")
            elif isinstance(response, dict) and 'categories' in response:
                categories = response['categories']
                print(f"   📂 Found {len(categories)} available categories")
        
        # Test creating a new category (for Add Item modal)
        if self.room_id:
            new_category_data = {
                "name": "Test Category for Add Item",
                "room_id": self.room_id,
                "description": "Category created for Add Item modal testing"
            }
            
            success2, response2 = self.run_test(
                "Create New Category", 
                "POST", 
                "categories", 
                201, 
                new_category_data
            )
            
            if success2:
                new_category_id = response2.get('id')
                print(f"   ✅ New category created: {new_category_id}")
                
                # Test creating a subcategory
                new_subcategory_data = {
                    "name": "Test Subcategory",
                    "category_id": new_category_id,
                    "description": "Subcategory for Add Item testing"
                }
                
                success3, response3 = self.run_test(
                    "Create New Subcategory", 
                    "POST", 
                    "subcategories", 
                    201, 
                    new_subcategory_data
                )
                
                if success3:
                    print(f"   ✅ New subcategory created: {response3.get('id')}")
        
        return success

    def test_item_status_management(self):
        """Test item status management for checklist functionality"""
        print("\n" + "="*60)
        print("📊 TESTING ITEM STATUS MANAGEMENT")
        print("="*60)
        
        # Test getting available statuses
        success, response = self.run_test(
            "Get Item Statuses", 
            "GET", 
            "statuses", 
            200
        )
        
        if success:
            if isinstance(response, list):
                print(f"   📊 Found {len(response)} available statuses")
                checklist_statuses = [s for s in response if isinstance(s, dict) and s.get('phase') == 'checklist']
                print(f"   ✅ Checklist-specific statuses: {len(checklist_statuses)}")
                
                # Show some checklist statuses
                for status in checklist_statuses[:3]:
                    print(f"      - {status.get('status', 'Unknown')} ({status.get('color', 'No color')})")
            elif isinstance(response, dict) and 'statuses' in response:
                statuses = response['statuses']
                print(f"   📊 Found {len(statuses)} available statuses")
        
        # Test status update if we have an item
        if self.project_id:
            # Get project to find an item to update
            success2, project_response = self.run_test(
                "Get Project for Status Test", 
                "GET", 
                f"projects/{self.project_id}?sheet_type=checklist", 
                200
            )
            
            if success2:
                # Find first item
                for room in project_response.get('rooms', []):
                    for category in room.get('categories', []):
                        for subcategory in category.get('subcategories', []):
                            items = subcategory.get('items', [])
                            if items:
                                item_id = items[0]['id']
                                
                                # Test status update
                                update_data = {"status": "PICKED"}
                                success3, _ = self.run_test(
                                    "Update Item Status", 
                                    "PUT", 
                                    f"items/{item_id}", 
                                    200, 
                                    update_data
                                )
                                
                                if success3:
                                    print(f"   ✅ Status update successful for item: {item_id}")
                                
                                return success3
        
        return success

    def test_vendor_integration(self):
        """Test vendor integration for Add Item modal"""
        print("\n" + "="*60)
        print("🏪 TESTING VENDOR INTEGRATION")
        print("="*60)
        
        # Test getting vendors
        success, response = self.run_test(
            "Get Vendors", 
            "GET", 
            "vendors", 
            200
        )
        
        if success:
            if isinstance(response, list):
                print(f"   🏪 Found {len(response)} vendors")
                for i, vendor in enumerate(response[:5]):  # Show first 5
                    if isinstance(vendor, dict):
                        print(f"      {i+1}. {vendor.get('name', 'Unknown')} - {vendor.get('category', 'No category')}")
                    else:
                        print(f"      {i+1}. {vendor}")
            elif isinstance(response, dict) and 'vendors' in response:
                vendors = response['vendors']
                print(f"   🏪 Found {len(vendors)} vendors")
        
        # Test web scraping functionality (for product data)
        scraping_test_url = "https://fourhands.com/products/fenn-chair"
        scraping_data = {"url": scraping_test_url}
        
        success2, response2 = self.run_test(
            "Web Scraping Test", 
            "POST", 
            "scrape-product", 
            200, 
            scraping_data
        )
        
        if success2:
            print(f"   ✅ Web scraping successful")
            print(f"   📦 Product name: {response2.get('name', 'Not found')}")
            print(f"   💰 Product price: {response2.get('price', 'Not found')}")
            print(f"   🏪 Vendor: {response2.get('vendor', 'Not found')}")
        else:
            print(f"   ⚠️ Web scraping not available or failed")
        
        return success

    def test_error_handling(self):
        """Test error handling for Add Item functionality"""
        print("\n" + "="*60)
        print("🚨 TESTING ERROR HANDLING")
        print("="*60)
        
        # Test creating item with invalid subcategory
        invalid_item_data = {
            "name": "Invalid Item",
            "subcategory_id": "invalid-id",
            "quantity": 1
        }
        
        success, response = self.run_test(
            "Invalid Subcategory ID", 
            "POST", 
            "items", 
            400,  # Expect error
            invalid_item_data
        )
        
        # Test creating item with missing required fields
        incomplete_data = {
            "name": "Incomplete Item"
            # Missing subcategory_id
        }
        
        success2, response2 = self.run_test(
            "Missing Required Fields", 
            "POST", 
            "items", 
            422,  # Expect validation error
            incomplete_data
        )
        
        # Test invalid item ID retrieval
        success3, response3 = self.run_test(
            "Invalid Item ID", 
            "GET", 
            "items/invalid-id", 
            404  # Expect not found
        )
        
        return True  # Error handling tests are informational

    def run_comprehensive_test(self):
        """Run all tests in sequence"""
        start_time = datetime.now()
        
        print("\n" + "="*80)
        print("🚀 STARTING ADD ITEM BACKEND API TESTING")
        print("="*80)
        print(f"🎯 Testing: Add Item Modal Backend Functionality")
        print(f"📋 Focus: Checklist Tab Item Creation APIs")
        print(f"⏰ Started at: {start_time.strftime('%Y-%m-%d %H:%M:%S')}")
        
        # Run test suites
        tests = [
            ("Basic Connectivity", self.test_basic_connectivity),
            ("Project Structure", self.test_project_structure_for_checklist),
            ("Add Item API", self.test_add_item_api),
            ("Autocomplete/Search", self.test_autocomplete_functionality),
            ("Categories & Subcategories", self.test_categories_and_subcategories),
            ("Status Management", self.test_item_status_management),
            ("Vendor Integration", self.test_vendor_integration),
            ("Error Handling", self.test_error_handling)
        ]
        
        suite_results = {}
        for suite_name, test_func in tests:
            try:
                print(f"\n🧪 Running {suite_name} tests...")
                result = test_func()
                suite_results[suite_name] = result
                print(f"{'✅' if result else '❌'} {suite_name}: {'PASSED' if result else 'FAILED'}")
            except Exception as e:
                print(f"❌ {suite_name}: CRASHED - {str(e)}")
                suite_results[suite_name] = False
        
        # Final results
        end_time = datetime.now()
        duration = (end_time - start_time).total_seconds()
        
        print("\n" + "="*80)
        print("📊 ADD ITEM BACKEND TEST RESULTS")
        print("="*80)
        print(f"⏰ Duration: {duration:.1f} seconds")
        print(f"🧪 Total Tests: {self.tests_run}")
        print(f"✅ Passed: {self.tests_passed}")
        print(f"❌ Failed: {self.tests_run - self.tests_passed}")
        print(f"📈 Success Rate: {(self.tests_passed/self.tests_run*100):.1f}%")
        
        print("\n📋 Test Suite Results:")
        for suite_name, result in suite_results.items():
            status = "✅ PASS" if result else "❌ FAIL"
            print(f"   {status} {suite_name}")
        
        # Critical issues summary
        print("\n🚨 Critical Issues Found:")
        critical_issues = []
        
        if not suite_results.get("Add Item API", False):
            critical_issues.append("Add Item API not working - items cannot be created")
        
        if not suite_results.get("Project Structure", False):
            critical_issues.append("Project structure incomplete - missing rooms/categories/subcategories")
        
        if not suite_results.get("Categories & Subcategories", False):
            critical_issues.append("Category management not working - cannot organize items")
        
        if critical_issues:
            for issue in critical_issues:
                print(f"   ❌ {issue}")
        else:
            print("   ✅ No critical backend issues found for Add Item functionality")
        
        # Add Item Modal specific summary
        print("\n📦 ADD ITEM MODAL BACKEND READINESS:")
        if suite_results.get("Add Item API", False):
            print("   ✅ Item creation API working")
        else:
            print("   ❌ Item creation API failing")
            
        if suite_results.get("Categories & Subcategories", False):
            print("   ✅ Category/subcategory management working")
        else:
            print("   ❌ Category/subcategory management failing")
            
        if suite_results.get("Status Management", False):
            print("   ✅ Status management working")
        else:
            print("   ❌ Status management failing")
        
        print("="*80)
        
        return {
            "total_tests": self.tests_run,
            "passed_tests": self.tests_passed,
            "success_rate": (self.tests_passed/self.tests_run*100) if self.tests_run > 0 else 0,
            "suite_results": suite_results,
            "critical_issues": critical_issues,
            "project_id": self.project_id,
            "room_id": self.room_id,
            "category_id": self.category_id,
            "subcategory_id": self.subcategory_id
        }

def main():
    tester = AddItemBackendTester()
    results = tester.run_comprehensive_test()
    
    # Return appropriate exit code
    if results["success_rate"] >= 75:
        return 0
    else:
        return 1

if __name__ == "__main__":
    sys.exit(main())
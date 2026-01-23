#!/usr/bin/env python3
"""
COMPREHENSIVE END-TO-END BACKEND TESTING for Ultimate Sourcing Catalog
Testing ALL features, buttons, paths, and calculations as requested.

CRITICAL PRIORITY: Verify NO PRICING on spec sheets
- Electrician Sheet
- Load-In Room Sheets  
- Mover's FFE Sheet
- Customer Sheets
"""

import requests
import sys
import json
from datetime import datetime
import re

class UltimateSourcingTester:
    def __init__(self, base_url="https://fixr-design-app.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_base = f"{base_url}/api"
        self.tests_run = 0
        self.tests_passed = 0
        self.project_id = None
        self.room_id = None
        self.critical_issues = []
        self.pricing_violations = []
        
        # Test data
        self.test_product_url = "https://www.fourhands.com/products/adilynn-dining-chair"

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

    def check_for_pricing_in_content(self, content, sheet_type):
        """Check if content contains any pricing information"""
        pricing_patterns = [
            r'\$[\d,]+\.?\d*',  # Dollar amounts like $1,234.56
            r'price\s*:\s*\$',  # Price: $
            r'cost\s*:\s*\$',   # Cost: $
            r'retail\s*:\s*\$', # Retail: $
            r'wholesale\s*:\s*\$', # Wholesale: $
            r'amount\s*:\s*\$', # Amount: $
            r'budget\s*:\s*\$', # Budget: $
            r'total\s*cost',    # Total cost
            r'total\s*price',   # Total price
            r'total\s*amount',  # Total amount
            r'subtotal',        # Subtotal
            r'grand\s*total'    # Grand total
        ]
        
        violations = []
        content_str = str(content).lower()
        
        for pattern in pricing_patterns:
            matches = re.findall(pattern, content_str, re.IGNORECASE)
            if matches:
                violations.extend(matches)
        
        # Exclude legitimate uses of "total" like "Total Items: X"
        legitimate_totals = [
            r'total\s+items?\s*:\s*\d+',
            r'total\s+lighting\s+items?\s*:\s*\d+',
            r'total\s+furniture\s+items?\s*:\s*\d+'
        ]
        
        # Remove legitimate total references
        filtered_violations = []
        for violation in violations:
            is_legitimate = False
            for legit_pattern in legitimate_totals:
                if re.search(legit_pattern, content_str, re.IGNORECASE):
                    # Check if this violation is part of a legitimate total
                    if 'total' in violation.lower() and ('items' in content_str or 'lighting' in content_str):
                        is_legitimate = True
                        break
            
            if not is_legitimate:
                filtered_violations.append(violation)
        
        if filtered_violations:
            self.pricing_violations.append({
                'sheet_type': sheet_type,
                'violations': filtered_violations
            })
            return False
        return True

    def test_basic_connectivity(self):
        """Test basic API connectivity"""
        print("\n" + "="*60)
        print("🌐 TESTING BASIC API CONNECTIVITY")
        print("="*60)
        
        # Test root endpoint
        success, _ = self.run_test("API Root", "GET", "", 200)
        
        return success

    def test_projects_api(self):
        """Test Projects API - GET/POST/PUT/DELETE projects"""
        print("\n" + "="*60)
        print("🏗️ TESTING PROJECTS API")
        print("="*60)
        
        # GET all projects
        success, projects_response = self.run_test("Get All Projects", "GET", "projects", 200)
        
        if success and projects_response:
            print(f"   📊 Found {len(projects_response)} existing projects")
            if projects_response:
                self.project_id = projects_response[0]['id']
                print(f"   📝 Using Project ID: {self.project_id}")
        
        # Create new test project
        project_data = {
            "name": "Ultimate Sourcing Test Project",
            "client_info": {
                "full_name": "Test Client Ultimate",
                "email": "test@ultimatesourcing.com",
                "phone": "555-0199",
                "address": "123 Ultimate Test St"
            },
            "project_type": "Renovation"
        }
        
        success, response = self.run_test("Create Project", "POST", "projects", 200, project_data)
        if success and response.get('id'):
            test_project_id = response['id']
            print(f"   📝 New Project ID: {test_project_id}")
            
            # Test GET project by ID
            success, _ = self.run_test("Get Project by ID", "GET", f"projects/{test_project_id}", 200)
            
            # Test UPDATE project
            update_data = {"name": "Updated Ultimate Sourcing Test"}
            success, _ = self.run_test("Update Project", "PUT", f"projects/{test_project_id}", 200, update_data)
            
            # Test DELETE project
            success, _ = self.run_test("Delete Project", "DELETE", f"projects/{test_project_id}", 200)
        
        return success

    def test_rooms_api(self):
        """Test Rooms API - Create rooms, get rooms, update rooms"""
        print("\n" + "="*60)
        print("🏠 TESTING ROOMS API")
        print("="*60)
        
        if not self.project_id:
            print("❌ No project ID available for room testing")
            return False
        
        # Create test room
        room_data = {
            "name": "Ultimate Test Living Room",
            "project_id": self.project_id,
            "sheet_type": "checklist",
            "description": "Test room for ultimate sourcing",
            "auto_populate": True
        }
        
        success, response = self.run_test("Create Room", "POST", "rooms", 200, room_data)
        if success and response.get('id'):
            self.room_id = response['id']
            print(f"   🏠 Room ID: {self.room_id}")
            
            # Test update room
            update_data = {"name": "Updated Ultimate Test Room"}
            success, _ = self.run_test("Update Room", "PUT", f"rooms/{self.room_id}", 200, update_data)
        
        return success

    def test_categories_subcategories_api(self):
        """Test Categories/Subcategories API - CRUD operations"""
        print("\n" + "="*60)
        print("📂 TESTING CATEGORIES & SUBCATEGORIES API")
        print("="*60)
        
        if not self.room_id:
            print("❌ No room ID available for category testing")
            return False
        
        # Create test category
        category_data = {
            "name": "Test Lighting Category",
            "room_id": self.room_id,
            "description": "Test category for ultimate sourcing"
        }
        
        success, response = self.run_test("Create Category", "POST", "categories", 200, category_data)
        category_id = None
        if success and response.get('id'):
            category_id = response['id']
            print(f"   📂 Category ID: {category_id}")
        
        # Create test subcategory
        if category_id:
            subcategory_data = {
                "name": "Test Installed Lighting",
                "category_id": category_id,
                "description": "Test subcategory"
            }
            
            success, response = self.run_test("Create Subcategory", "POST", "subcategories", 200, subcategory_data)
            if success and response.get('id'):
                subcategory_id = response['id']
                print(f"   📁 Subcategory ID: {subcategory_id}")
        
        return success

    def test_items_api(self):
        """Test Items API - Create, update, delete items"""
        print("\n" + "="*60)
        print("📦 TESTING ITEMS API")
        print("="*60)
        
        if not self.project_id:
            print("❌ No project ID available for item testing")
            return False
        
        # Get project to find subcategories
        success, project_response = self.run_test("Get Project for Items", "GET", f"projects/{self.project_id}", 200)
        
        subcategory_id = None
        if success and project_response.get('rooms'):
            for room in project_response['rooms']:
                for category in room.get('categories', []):
                    for subcategory in category.get('subcategories', []):
                        subcategory_id = subcategory['id']
                        break
                    if subcategory_id:
                        break
                if subcategory_id:
                    break
        
        if not subcategory_id:
            print("❌ No subcategory found for item testing")
            return False
        
        # Create test item
        item_data = {
            "name": "Ultimate Test Chandelier",
            "subcategory_id": subcategory_id,
            "quantity": 2,
            "size": "Large",
            "vendor": "Four Hands",
            "cost": 1250.00,
            "price": 2500.00,
            "status": "TO BE SELECTED",
            "link": self.test_product_url
        }
        
        success, response = self.run_test("Create Item", "POST", "items", 200, item_data)
        item_id = None
        if success and response.get('id'):
            item_id = response['id']
            print(f"   📦 Item ID: {item_id}")
            
            # Test update item
            update_data = {"status": "ORDERED", "quantity": 3}
            success, _ = self.run_test("Update Item", "PUT", f"items/{item_id}", 200, update_data)
            
            # Test delete item
            success, _ = self.run_test("Delete Item", "DELETE", f"items/{item_id}", 200)
        
        return success

    def test_scraping_api(self):
        """Test Scraping API - /api/scrape-product"""
        print("\n" + "="*60)
        print("🕷️ TESTING SCRAPING API")
        print("="*60)
        
        scrape_data = {
            "url": self.test_product_url,
            "vendor": "Four Hands"
        }
        
        success, response = self.run_test("Scrape Product", "POST", "scrape-product", 200, scrape_data)
        
        if success:
            print(f"   📊 Scraping Results:")
            print(f"      Success: {response.get('success', 'Unknown')}")
            print(f"      Product Name: {response.get('name', 'N/A')}")
            print(f"      Price: {response.get('price', 'N/A')}")
            print(f"      Image URL: {response.get('image_url', 'N/A')}")
        
        return success

    def test_master_products_api(self):
        """Test Master Products API - /api/master-products search"""
        print("\n" + "="*60)
        print("🔍 TESTING MASTER PRODUCTS API")
        print("="*60)
        
        # Test furniture search functionality (this is the actual endpoint)
        search_params = {
            "query": "chair",
            "vendor": "Four Hands",
            "category": "Furniture",
            "limit": 10
        }
        
        # Convert to query string
        query_string = "&".join([f"{k}={v}" for k, v in search_params.items()])
        
        success, response = self.run_test("Search Furniture Products", "GET", f"furniture/search?{query_string}", 200)
        
        if success:
            products = response if isinstance(response, list) else response.get('products', [])
            print(f"   📊 Found {len(products)} products")
            if products:
                print(f"   📦 First product: {products[0].get('name', 'N/A')}")
        
        return success

    def test_vendor_credentials_api(self):
        """Test Vendor Credentials API"""
        print("\n" + "="*60)
        print("🔐 TESTING VENDOR CREDENTIALS API")
        print("="*60)
        
        # Test vendor login status
        success, response = self.run_test("Get Vendor Portals", "GET", "vendor-portals", 200)
        
        if success:
            portals = response if isinstance(response, list) else response.get('portals', [])
            print(f"   🏪 Found {len(portals)} vendor portals")
        
        return success

    def test_calculator_apis(self):
        """Test Calculator APIs - All calculator endpoints"""
        print("\n" + "="*60)
        print("🧮 TESTING CALCULATOR APIs")
        print("="*60)
        
        # Test wallpaper calculator
        wallpaper_data = {
            "room_width": 12,
            "room_length": 15,
            "ceiling_height": 9,
            "pattern_repeat": 24,
            "roll_width": 27
        }
        
        success, response = self.run_test("Wallpaper Calculator", "POST", "calculators/wallpaper", 200, wallpaper_data)
        
        if success:
            print(f"   📊 Wallpaper Results: {response.get('rolls_needed', 'N/A')} rolls")
        
        # Test paint calculator
        paint_data = {
            "room_width": 12,
            "room_length": 15,
            "ceiling_height": 9,
            "doors": 2,
            "windows": 4
        }
        
        success, response = self.run_test("Paint Calculator", "POST", "calculators/paint", 200, paint_data)
        
        if success:
            print(f"   🎨 Paint Results: {response.get('gallons_needed', 'N/A')} gallons")
        
        # Test square footage calculator
        sqft_data = {
            "length": 12,
            "width": 15
        }
        
        success, response = self.run_test("Square Footage Calculator", "POST", "calculators/square-footage", 200, sqft_data)
        
        return success

    def test_exports_api_critical_pricing_check(self):
        """CRITICAL TEST: Verify NO PRICING in export sheets"""
        print("\n" + "="*60)
        print("🚨 CRITICAL: TESTING EXPORT APIs - NO PRICING CHECK")
        print("="*60)
        
        if not self.project_id:
            print("❌ No project ID available for export testing")
            return False
        
        export_endpoints = [
            ("Electrician Sheet", f"exports/{self.project_id}/electrician-sheet"),
            ("Load-In Room Sheets", f"exports/{self.project_id}/load-in-sheets"),
            ("Mover's FFE Sheet", f"exports/{self.project_id}/movers-ffe"),
            ("Customer Sheets", f"exports/{self.project_id}/customer-sheets")
        ]
        
        all_exports_clean = True
        
        for sheet_name, endpoint in export_endpoints:
            print(f"\n🔍 Testing {sheet_name}...")
            success, response = self.run_test(f"Export {sheet_name}", "POST", endpoint, 200)
            
            if success:
                # Check for pricing in the response
                pricing_clean = self.check_for_pricing_in_content(response, sheet_name)
                
                if pricing_clean:
                    print(f"   ✅ {sheet_name}: NO PRICING FOUND - COMPLIANT")
                else:
                    print(f"   🚨 {sheet_name}: PRICING DETECTED - VIOLATION!")
                    all_exports_clean = False
                    self.critical_issues.append(f"PRICING FOUND in {sheet_name}")
            else:
                all_exports_clean = False
                self.critical_issues.append(f"{sheet_name} export failed")
        
        if all_exports_clean:
            print("\n✅ ALL EXPORT SHEETS ARE PRICING-COMPLIANT")
        else:
            print("\n🚨 CRITICAL PRICING VIOLATIONS DETECTED!")
        
        return all_exports_clean

    def test_contacts_api(self):
        """Test Contacts API - Master contacts CRUD"""
        print("\n" + "="*60)
        print("👥 TESTING CONTACTS API")
        print("="*60)
        
        # Get all contacts (this endpoint might not exist, let's test autocomplete instead)
        success, response = self.run_test("Get Contacts Autocomplete", "GET", "autocomplete/contacts", 200)
        
        if success:
            contacts = response if isinstance(response, list) else response.get('contacts', [])
            print(f"   👥 Found {len(contacts)} contacts")
        
        # Create test contact
        contact_data = {
            "name": "Ultimate Test Contact",
            "email": "test@ultimatecontact.com",
            "phone": "555-0123",
            "company": "Ultimate Test Company",
            "role": "Vendor"
        }
        
        success, response = self.run_test("Create Contact", "POST", "contacts", 200, contact_data)
        
        if success and response.get('id'):
            contact_id = response['id']
            print(f"   👤 Contact ID: {contact_id}")
            
            # Test update contact
            update_data = {"role": "Client"}
            success, _ = self.run_test("Update Contact", "PUT", f"contacts/{contact_id}", 200, update_data)
            
            # Test delete contact
            success, _ = self.run_test("Delete Contact", "DELETE", f"contacts/{contact_id}", 200)
        
        return success

    def test_moodboard_api(self):
        """Test Moodboard API"""
        print("\n" + "="*60)
        print("🎨 TESTING MOODBOARD API")
        print("="*60)
        
        if not self.project_id:
            print("❌ No project ID available for moodboard testing")
            return False
        
        # Test moodboard functionality
        moodboard_data = {
            "project_id": self.project_id,
            "name": "Ultimate Test Moodboard",
            "items": []
        }
        
        success, response = self.run_test("Create Moodboard", "POST", "moodboards", 200, moodboard_data)
        
        return success

    def test_comprehensive_api_coverage(self):
        """Test additional API endpoints for comprehensive coverage"""
        print("\n" + "="*60)
        print("🔄 TESTING COMPREHENSIVE API COVERAGE")
        print("="*60)
        
        # Test status options (actual endpoint)
        success, _ = self.run_test("Get Item Statuses", "GET", "item-statuses", 200)
        
        # Test carrier options
        success, _ = self.run_test("Get Carrier Options", "GET", "carrier-options", 200)
        
        # Test vendor types (actual endpoint)
        success, _ = self.run_test("Get Vendor Types", "GET", "vendor-types", 200)
        
        # Test room colors (actual endpoint)
        success, _ = self.run_test("Get Room Colors", "GET", "room-colors", 200)
        
        return success

    def run_comprehensive_test(self):
        """Run all tests in sequence"""
        start_time = datetime.now()
        
        print("\n" + "="*80)
        print("🚀 STARTING COMPREHENSIVE ULTIMATE SOURCING CATALOG TESTING")
        print("="*80)
        print(f"🌐 Backend URL: {self.base_url}")
        print(f"🔗 Test Product URL: {self.test_product_url}")
        print(f"⏰ Started at: {start_time.strftime('%Y-%m-%d %H:%M:%S')}")
        
        # Run test suites
        tests = [
            ("Basic Connectivity", self.test_basic_connectivity),
            ("Projects API", self.test_projects_api),
            ("Rooms API", self.test_rooms_api),
            ("Categories/Subcategories API", self.test_categories_subcategories_api),
            ("Items API", self.test_items_api),
            ("Scraping API", self.test_scraping_api),
            ("Master Products API", self.test_master_products_api),
            ("Vendor Credentials API", self.test_vendor_credentials_api),
            ("Calculator APIs", self.test_calculator_apis),
            ("🚨 CRITICAL: Export APIs (NO PRICING)", self.test_exports_api_critical_pricing_check),
            ("Contacts API", self.test_contacts_api),
            ("Moodboard API", self.test_moodboard_api),
            ("Comprehensive API Coverage", self.test_comprehensive_api_coverage)
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
        print("📊 COMPREHENSIVE TEST RESULTS")
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
        
        # CRITICAL PRICING VIOLATIONS
        print("\n🚨 CRITICAL PRICING VIOLATIONS:")
        if self.pricing_violations:
            for violation in self.pricing_violations:
                print(f"   ❌ {violation['sheet_type']}: {violation['violations']}")
        else:
            print("   ✅ NO PRICING VIOLATIONS FOUND - ALL EXPORT SHEETS COMPLIANT")
        
        # Critical issues summary
        print("\n🚨 Critical Issues Found:")
        if self.critical_issues:
            for issue in self.critical_issues:
                print(f"   ❌ {issue}")
        else:
            print("   ✅ No critical backend issues found")
        
        print("="*80)
        
        return {
            "total_tests": self.tests_run,
            "passed_tests": self.tests_passed,
            "success_rate": (self.tests_passed/self.tests_run*100) if self.tests_run > 0 else 0,
            "suite_results": suite_results,
            "critical_issues": self.critical_issues,
            "pricing_violations": self.pricing_violations,
            "project_id": self.project_id,
            "room_id": self.room_id
        }

def main():
    tester = UltimateSourcingTester()
    results = tester.run_comprehensive_test()
    
    # Return appropriate exit code
    if results["success_rate"] >= 75 and not results["pricing_violations"]:
        return 0
    else:
        return 1

if __name__ == "__main__":
    sys.exit(main())
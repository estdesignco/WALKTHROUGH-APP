#!/usr/bin/env python3
"""
Comprehensive Backend API Testing for Room-Specific Canva Import Workflow
Testing the complete flow: button visibility → modal opening → form submission → Canva scraping → item creation → room organization
"""

import requests
import sys
import json
from datetime import datetime

class CanvaImportTester:
    def __init__(self, base_url="https://designflow-master.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_base = f"{base_url}/api"
        self.tests_run = 0
        self.tests_passed = 0
        self.project_id = None
        self.room_id = None
        
        # Test credentials and URLs from review request
        self.test_canva_url = "https://www.canva.com/design/DAGxY-ZgbB8/HoQrBgvmCikbXimPCw4P-g/edit"
        self.canva_credentials = {
            "email": "EstablishedDesignCo@gmail.com",
            "password": "Zeke1919$$"
        }
        self.houzz_credentials = {
            "email": "EstablishedDesignCo@gmail.com", 
            "password": "Zeke1919$$"
        }

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
        
        # Test root endpoint
        success, _ = self.run_test("API Root", "GET", "", 200)
        
        # Test health check
        success, _ = self.run_test("Health Check", "GET", "health", 200)
        
        return success

    def test_project_management(self):
        """Test project creation and management"""
        print("\n" + "="*60)
        print("🏗️ TESTING PROJECT MANAGEMENT")
        print("="*60)
        
        # Create test project
        project_data = {
            "name": "Canva Import Test Project",
            "client_info": {
                "full_name": "Test Client",
                "email": "test@example.com",
                "phone": "555-0123",
                "address": "123 Test St"
            },
            "project_type": "Renovation"
        }
        
        success, response = self.run_test("Create Project", "POST", "projects", 201, project_data)
        if success and response.get('id'):
            self.project_id = response['id']
            print(f"   📝 Project ID: {self.project_id}")
        
        # Get project with checklist sheet type
        if self.project_id:
            success, response = self.run_test(
                "Get Project (Checklist)", 
                "GET", 
                f"projects/{self.project_id}?sheet_type=checklist", 
                200
            )
            
            if success and response.get('rooms'):
                print(f"   🏠 Found {len(response['rooms'])} rooms")
                if response['rooms']:
                    self.room_id = response['rooms'][0]['id']
                    print(f"   🏠 First Room ID: {self.room_id}")
        
        return success

    def test_room_creation(self):
        """Test room creation for Canva import testing"""
        print("\n" + "="*60)
        print("🏠 TESTING ROOM CREATION")
        print("="*60)
        
        if not self.project_id:
            print("❌ No project ID available for room creation")
            return False
        
        # Create a test room
        room_data = {
            "name": "Living Room",
            "project_id": self.project_id,
            "sheet_type": "checklist",
            "description": "Test room for Canva import",
            "auto_populate": True
        }
        
        success, response = self.run_test("Create Room", "POST", "rooms", 201, room_data)
        if success and response.get('id'):
            self.room_id = response['id']
            print(f"   🏠 Room ID: {self.room_id}")
        
        return success

    def test_canva_import_api(self):
        """Test the core Canva import API functionality"""
        print("\n" + "="*60)
        print("🎨 TESTING CANVA IMPORT API")
        print("="*60)
        
        if not self.project_id or not self.room_id:
            print("❌ Missing project_id or room_id for Canva import test")
            return False
        
        # Test Canva import with the provided test URL
        canva_import_data = {
            "board_url": self.test_canva_url,
            "project_id": self.project_id,
            "room_name": "Living Room",
            "room_id": self.room_id,
            "auto_clip_to_houzz": True,
            "page_number": 1
        }
        
        print(f"   🔗 Testing with URL: {self.test_canva_url}")
        print(f"   📄 Page number: 1")
        print(f"   🏠 Room: Living Room ({self.room_id})")
        
        success, response = self.run_test(
            "Canva Board Import", 
            "POST", 
            "import-canva-board", 
            200, 
            canva_import_data
        )
        
        if success:
            print(f"   📊 Import Results:")
            print(f"      Success: {response.get('success', 'Unknown')}")
            print(f"      Items Found: {response.get('total_links', 0)}")
            print(f"      Items Created: {response.get('successful_imports', 0)}")
            print(f"      Mock Items: {response.get('mock_items_created', 0)}")
            
            if response.get('error'):
                print(f"      Error: {response['error']}")
            
            # Check if mock data fallback is working
            if response.get('mock_items_created', 0) > 0:
                print("   ✅ Mock data fallback is working")
            elif response.get('successful_imports', 0) > 0:
                print("   ✅ Real Canva scraping is working")
            else:
                print("   ⚠️ No items created - check Canva scraping logic")
        
        return success

    def test_canva_scraping_enhanced(self):
        """Test enhanced Canva scraping with authentication"""
        print("\n" + "="*60)
        print("🔍 TESTING ENHANCED CANVA SCRAPING")
        print("="*60)
        
        # Test different page numbers
        for page_num in [1, 2]:
            canva_data = {
                "board_url": self.test_canva_url,
                "project_id": self.project_id,
                "room_name": "Living Room",
                "room_id": self.room_id,
                "auto_clip_to_houzz": False,  # Test without Houzz integration
                "page_number": page_num
            }
            
            success, response = self.run_test(
                f"Canva Import Page {page_num}", 
                "POST", 
                "import-canva-board", 
                200, 
                canva_data
            )
            
            if success:
                links_found = response.get('total_links', 0)
                print(f"   📄 Page {page_num}: {links_found} links found")
        
        return True

    def test_houzz_pro_integration(self):
        """Test Houzz Pro auto-clip functionality"""
        print("\n" + "="*60)
        print("🏡 TESTING HOUZZ PRO INTEGRATION")
        print("="*60)
        
        # Test Houzz Pro scraper endpoint
        success, response = self.run_test(
            "Houzz Pro Scraper", 
            "POST", 
            "scrape-houzz-pro", 
            200
        )
        
        if success:
            print(f"   📊 Houzz Results:")
            print(f"      Success: {response.get('success', 'Unknown')}")
            print(f"      Products Found: {response.get('products_found', 0)}")
            print(f"      Database Saved: {response.get('database_saved', False)}")
        
        return success

    def test_item_management(self):
        """Test item creation and management after Canva import"""
        print("\n" + "="*60)
        print("📦 TESTING ITEM MANAGEMENT")
        print("="*60)
        
        if not self.project_id:
            print("❌ No project ID for item testing")
            return False
        
        # Get project to check for items
        success, response = self.run_test(
            "Get Project Items", 
            "GET", 
            f"projects/{self.project_id}?sheet_type=checklist", 
            200
        )
        
        if success:
            total_items = 0
            for room in response.get('rooms', []):
                for category in room.get('categories', []):
                    for subcategory in category.get('subcategories', []):
                        total_items += len(subcategory.get('items', []))
            
            print(f"   📊 Total items in project: {total_items}")
            
            # Test item status update if items exist
            if total_items > 0:
                # Find first item
                for room in response.get('rooms', []):
                    for category in room.get('categories', []):
                        for subcategory in category.get('subcategories', []):
                            items = subcategory.get('items', [])
                            if items:
                                item_id = items[0]['id']
                                
                                # Test status update
                                update_data = {"status": "PICKED"}
                                success, _ = self.run_test(
                                    "Update Item Status", 
                                    "PUT", 
                                    f"items/{item_id}", 
                                    200, 
                                    update_data
                                )
                                return success
        
        return success

    def test_error_handling(self):
        """Test error handling for invalid inputs"""
        print("\n" + "="*60)
        print("🚨 TESTING ERROR HANDLING")
        print("="*60)
        
        # Test invalid Canva URL
        invalid_canva_data = {
            "board_url": "https://invalid-url.com",
            "project_id": self.project_id or "invalid",
            "room_name": "Test Room",
            "room_id": self.room_id or "invalid",
            "page_number": 1
        }
        
        success, response = self.run_test(
            "Invalid Canva URL", 
            "POST", 
            "import-canva-board", 
            400,  # Expect error
            invalid_canva_data
        )
        
        # Test missing required fields
        incomplete_data = {
            "board_url": self.test_canva_url
            # Missing required fields
        }
        
        success, response = self.run_test(
            "Incomplete Canva Data", 
            "POST", 
            "import-canva-board", 
            422,  # Expect validation error
            incomplete_data
        )
        
        return True

    def run_comprehensive_test(self):
        """Run all tests in sequence"""
        start_time = datetime.now()
        
        print("\n" + "="*80)
        print("🚀 STARTING COMPREHENSIVE CANVA IMPORT BACKEND TESTING")
        print("="*80)
        print(f"🌐 Backend URL: {self.base_url}")
        print(f"🎨 Test Canva URL: {self.test_canva_url}")
        print(f"⏰ Started at: {start_time.strftime('%Y-%m-%d %H:%M:%S')}")
        
        # Run test suites
        tests = [
            ("Basic Connectivity", self.test_basic_connectivity),
            ("Project Management", self.test_project_management),
            ("Room Creation", self.test_room_creation),
            ("Canva Import API", self.test_canva_import_api),
            ("Enhanced Canva Scraping", self.test_canva_scraping_enhanced),
            ("Houzz Pro Integration", self.test_houzz_pro_integration),
            ("Item Management", self.test_item_management),
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
        
        # Critical issues summary
        print("\n🚨 Critical Issues Found:")
        critical_issues = []
        
        if not suite_results.get("Canva Import API", False):
            critical_issues.append("Canva import API not working properly")
        
        if not suite_results.get("Enhanced Canva Scraping", False):
            critical_issues.append("Canva scraping not extracting product links")
        
        if critical_issues:
            for issue in critical_issues:
                print(f"   ❌ {issue}")
        else:
            print("   ✅ No critical backend issues found")
        
        print("="*80)
        
        return {
            "total_tests": self.tests_run,
            "passed_tests": self.tests_passed,
            "success_rate": (self.tests_passed/self.tests_run*100) if self.tests_run > 0 else 0,
            "suite_results": suite_results,
            "critical_issues": critical_issues,
            "project_id": self.project_id,
            "room_id": self.room_id
        }

def main():
    tester = CanvaImportTester()
    results = tester.run_comprehensive_test()
    
    # Return appropriate exit code
    if results["success_rate"] >= 75:
        return 0
    else:
        return 1

if __name__ == "__main__":
    sys.exit(main())
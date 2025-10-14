#!/usr/bin/env python3
"""
Interior Design Management System - Comprehensive Backend Testing
Testing all features mentioned in the review request:
1. Item CRUD Operations (especially DELETE - user reports broken)
2. PDF Import functionality  
3. Questionnaire → Walkthrough flow
4. Teams Notifications
5. Backend Endpoints verification
"""

import requests
import sys
import json
from datetime import datetime
import time

class InteriorDesignSystemTester:
    def __init__(self, base_url="https://designhub-74.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_base = f"{base_url}/api"
        self.tests_run = 0
        self.tests_passed = 0
        self.project_id = None
        self.room_id = None
        self.category_id = None
        self.subcategory_id = None
        self.item_id = None
        
        # Test data for realistic testing
        self.test_client_data = {
            "full_name": "Sarah Johnson",
            "email": "sarah.johnson@email.com", 
            "phone": "555-987-6543",
            "address": "123 Design Street, Nashville, TN 37203"
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
        
        # Test projects list
        success, _ = self.run_test("Projects List", "GET", "projects", 200)
        
        return success

    def test_questionnaire_to_walkthrough_flow(self):
        """Test the complete questionnaire to walkthrough flow"""
        print("\n" + "="*60)
        print("📋 TESTING QUESTIONNAIRE → WALKTHROUGH FLOW")
        print("="*60)
        
        # Step 1: Create project via questionnaire submission
        questionnaire_data = {
            "name": "Modern Farmhouse Renovation Test",
            "client_info": self.test_client_data,
            "project_type": "Renovation",
            "timeline": "6 months",
            "budget": "75k-100k",
            "style_preferences": ["Modern Farmhouse", "Transitional"],
            "color_palette": "Warm neutrals with navy accents",
            "special_requirements": "Pet-friendly materials, open concept living"
        }
        
        success, response = self.run_test("Create Project via Questionnaire", "POST", "projects", 200, questionnaire_data)
        if response.get('id'):
            self.project_id = response['id']
            success = True
            print(f"   📝 Project ID: {self.project_id}")
            
            # Step 2: Verify project was created with proper structure
            success, project_data = self.run_test("Get Created Project", "GET", f"projects/{self.project_id}", 200)
            if success:
                print(f"   ✅ Project created with client: {project_data.get('client_info', {}).get('full_name', 'Unknown')}")
                print(f"   ✅ Project type: {project_data.get('project_type', 'Unknown')}")
                
                # Step 3: Verify rooms can be added for walkthrough
                if project_data.get('rooms'):
                    print(f"   ✅ Project has {len(project_data['rooms'])} rooms ready for walkthrough")
                    self.room_id = project_data['rooms'][0]['id'] if project_data['rooms'] else None
                else:
                    print("   ⚠️ No rooms found - testing room creation")
        
        return success

    def test_room_and_category_management(self):
        """Test room and category creation for walkthrough"""
        print("\n" + "="*60)
        print("🏠 TESTING ROOM & CATEGORY MANAGEMENT")
        print("="*60)
        
        if not self.project_id:
            print("❌ No project ID available for room testing")
            return False
        
        # Create a room for walkthrough
        room_data = {
            "name": "Living Room",
            "project_id": self.project_id,
            "sheet_type": "walkthrough",
            "description": "Main living area with fireplace",
            "auto_populate": True
        }
        
        success, response = self.run_test("Create Room", "POST", "rooms", 201, room_data)
        if success and response.get('id'):
            self.room_id = response['id']
            print(f"   🏠 Room ID: {self.room_id}")
            
            # Test category creation
            category_data = {
                "name": "Lighting",
                "room_id": self.room_id,
                "description": "All lighting fixtures and lamps"
            }
            
            success, response = self.run_test("Create Category", "POST", "categories", 201, category_data)
            if success and response.get('id'):
                self.category_id = response['id']
                print(f"   📂 Category ID: {self.category_id}")
                
                # Test subcategory creation
                subcategory_data = {
                    "name": "INSTALLED",
                    "category_id": self.category_id,
                    "description": "Installed lighting fixtures"
                }
                
                success, response = self.run_test("Create Subcategory", "POST", "subcategories", 201, subcategory_data)
                if success and response.get('id'):
                    self.subcategory_id = response['id']
                    print(f"   📁 Subcategory ID: {self.subcategory_id}")
        
        return success

    def test_item_crud_operations(self):
        """Test complete Item CRUD operations - PRIORITY: DELETE functionality"""
        print("\n" + "="*60)
        print("📦 TESTING ITEM CRUD OPERATIONS (PRIORITY: DELETE)")
        print("="*60)
        
        if not self.subcategory_id:
            print("❌ No subcategory ID available for item testing")
            return False
        
        # CREATE: Test item creation
        item_data = {
            "name": "Crystal Chandelier",
            "subcategory_id": self.subcategory_id,
            "quantity": 1,
            "vendor": "Visual Comfort",
            "cost": 2500.00,
            "size": "36\" diameter",
            "finish_color": "Aged Brass",
            "status": "TO BE SELECTED",
            "remarks": "For main living area",
            "link": "https://visualcomfort.com/chandelier-123"
        }
        
        success, response = self.run_test("CREATE Item", "POST", "items", 201, item_data)
        if success and response.get('id'):
            self.item_id = response['id']
            print(f"   📦 Item ID: {self.item_id}")
            
            # READ: Test item retrieval
            success, item_response = self.run_test("READ Item", "GET", f"items/{self.item_id}", 200)
            if success:
                print(f"   ✅ Item retrieved: {item_response.get('name', 'Unknown')}")
                print(f"   ✅ Vendor: {item_response.get('vendor', 'Unknown')}")
                print(f"   ✅ Cost: ${item_response.get('cost', 0)}")
            
            # UPDATE: Test item update
            update_data = {
                "name": "Updated Crystal Chandelier - Premium",
                "cost": 3200.00,
                "status": "RESEARCHING",
                "finish_color": "Polished Nickel"
            }
            
            success, _ = self.run_test("UPDATE Item", "PUT", f"items/{self.item_id}", 200, update_data)
            if success:
                print("   ✅ Item updated successfully")
                
                # Verify update
                success, updated_item = self.run_test("Verify Update", "GET", f"items/{self.item_id}", 200)
                if success:
                    print(f"   ✅ Updated name: {updated_item.get('name', 'Unknown')}")
                    print(f"   ✅ Updated cost: ${updated_item.get('cost', 0)}")
                    print(f"   ✅ Updated status: {updated_item.get('status', 'Unknown')}")
            
            # DELETE: Test item deletion - THIS IS THE CRITICAL TEST
            print("\n   🗑️ TESTING CRITICAL DELETE FUNCTIONALITY (User reported broken)")
            success, _ = self.run_test("DELETE Item (CRITICAL)", "DELETE", f"items/{self.item_id}", 200)
            if success:
                print("   ✅ DELETE operation successful!")
                
                # Verify deletion
                success, _ = self.run_test("Verify Deletion", "GET", f"items/{self.item_id}", 404)
                if success:
                    print("   ✅ Item properly deleted - returns 404 as expected")
                    return True
                else:
                    print("   ❌ Item still exists after deletion - DELETE not working properly")
                    return False
            else:
                print("   ❌ DELETE operation failed - This confirms user's report!")
                return False
        
        return False

    def test_pdf_import_functionality(self):
        """Test PDF import with product links"""
        print("\n" + "="*60)
        print("📄 TESTING PDF IMPORT FUNCTIONALITY")
        print("="*60)
        
        # Test PDF upload endpoint
        success, response = self.run_test("PDF Upload Endpoint", "GET", "upload-pdf", 200)
        
        # Test product link extraction (mock test)
        test_links = [
            "https://fourhands.com/product/248067-003",
            "https://visualcomfort.com/lighting/chandelier-456",
            "https://westelm.com/furniture/sofa-789"
        ]
        
        pdf_import_data = {
            "project_id": self.project_id,
            "room_id": self.room_id,
            "extracted_links": test_links,
            "auto_categorize": True
        }
        
        success, response = self.run_test("Process PDF Links", "POST", "process-pdf-links", 200, pdf_import_data)
        if success:
            print(f"   ✅ Links processed: {response.get('links_processed', 0)}")
            print(f"   ✅ Items created: {response.get('items_created', 0)}")
            print(f"   ✅ Auto-categorized: {response.get('auto_categorized', 0)}")
        
        return success

    def test_teams_notifications(self):
        """Test Teams webhook notifications"""
        print("\n" + "="*60)
        print("🔔 TESTING TEAMS NOTIFICATIONS")
        print("="*60)
        
        # Test Teams notification endpoint
        success, response = self.run_test("Teams Test Notification", "POST", "teams/test-notification", 200)
        if success:
            print("   ✅ Teams webhook endpoint accessible")
            print(f"   ✅ Notification sent: {response.get('sent', False)}")
            print(f"   ✅ Webhook URL: {response.get('webhook_url', 'Not provided')}")
        
        # Test status change notification
        if self.item_id:
            notification_data = {
                "item_id": self.item_id,
                "old_status": "TO BE SELECTED",
                "new_status": "ORDERED",
                "project_name": "Modern Farmhouse Renovation Test",
                "client_name": "Sarah Johnson"
            }
            
            success, response = self.run_test("Status Change Notification", "POST", "teams/status-change", 200, notification_data)
            if success:
                print("   ✅ Status change notification sent to Teams")
        
        return success

    def test_backend_endpoints_comprehensive(self):
        """Test all critical backend endpoints"""
        print("\n" + "="*60)
        print("🔗 TESTING ALL BACKEND ENDPOINTS")
        print("="*60)
        
        endpoints_to_test = [
            ("Projects List", "GET", "projects", 200),
            ("Categories Available", "GET", "categories/available", 200),
            ("Item Statuses", "GET", "statuses", 200),
            ("Carrier Options", "GET", "carriers", 200),
            ("Vendor Types", "GET", "vendors", 200),
            ("Room Colors", "GET", "room-colors", 200),
            ("Scrape Product", "POST", "scrape-product", 200, {"url": "https://fourhands.com/product/248067-003"}),
        ]
        
        all_passed = True
        for name, method, endpoint, expected_status, *data in endpoints_to_test:
            test_data = data[0] if data else None
            success, response = self.run_test(name, method, endpoint, expected_status, test_data)
            if not success:
                all_passed = False
            else:
                # Print useful info for some endpoints
                if endpoint == "categories/available" and isinstance(response, dict):
                    print(f"   📂 Available categories: {len(response.get('categories', []))}")
                elif endpoint == "statuses" and isinstance(response, dict):
                    print(f"   📊 Available statuses: {len(response.get('statuses', []))}")
                elif endpoint == "carriers" and isinstance(response, dict):
                    print(f"   🚚 Available carriers: {len(response.get('carriers', []))}")
        
        return all_passed

    def test_data_integrity(self):
        """Test data integrity and relationships"""
        print("\n" + "="*60)
        print("🔍 TESTING DATA INTEGRITY")
        print("="*60)
        
        if not self.project_id:
            print("❌ No project ID for data integrity testing")
            return False
        
        # Get full project structure
        success, project_data = self.run_test("Full Project Structure", "GET", f"projects/{self.project_id}", 200)
        if success:
            rooms = project_data.get('rooms', [])
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
            
            print(f"   🏠 Rooms: {len(rooms)}")
            print(f"   📂 Categories: {total_categories}")
            print(f"   📁 Subcategories: {total_subcategories}")
            print(f"   📦 Items: {total_items}")
            
            # Verify hierarchical structure
            if len(rooms) > 0 and total_categories > 0:
                print("   ✅ Proper hierarchical structure maintained")
                return True
            else:
                print("   ⚠️ Incomplete hierarchical structure")
                return False
        
        return False

    def run_comprehensive_test(self):
        """Run all tests in sequence"""
        start_time = datetime.now()
        
        print("\n" + "="*80)
        print("🚀 INTERIOR DESIGN MANAGEMENT SYSTEM - COMPREHENSIVE TESTING")
        print("="*80)
        print(f"🌐 Backend URL: {self.base_url}")
        print(f"📋 Focus: Item CRUD (DELETE priority), PDF Import, Teams Notifications")
        print(f"⏰ Started at: {start_time.strftime('%Y-%m-%d %H:%M:%S')}")
        
        # Run test suites in logical order
        tests = [
            ("Basic Connectivity", self.test_basic_connectivity),
            ("Questionnaire → Walkthrough Flow", self.test_questionnaire_to_walkthrough_flow),
            ("Room & Category Management", self.test_room_and_category_management),
            ("Item CRUD Operations (DELETE Priority)", self.test_item_crud_operations),
            ("PDF Import Functionality", self.test_pdf_import_functionality),
            ("Teams Notifications", self.test_teams_notifications),
            ("Backend Endpoints Comprehensive", self.test_backend_endpoints_comprehensive),
            ("Data Integrity", self.test_data_integrity)
        ]
        
        suite_results = {}
        critical_failures = []
        
        for suite_name, test_func in tests:
            try:
                print(f"\n🧪 Running {suite_name} tests...")
                result = test_func()
                suite_results[suite_name] = result
                status = "✅ PASSED" if result else "❌ FAILED"
                print(f"{status} {suite_name}")
                
                # Track critical failures
                if not result and "CRUD" in suite_name:
                    critical_failures.append("DELETE functionality broken (user reported issue confirmed)")
                elif not result and "Teams" in suite_name:
                    critical_failures.append("Teams notifications not working")
                elif not result and "PDF" in suite_name:
                    critical_failures.append("PDF import functionality issues")
                    
            except Exception as e:
                print(f"❌ {suite_name}: CRASHED - {str(e)}")
                suite_results[suite_name] = False
                critical_failures.append(f"{suite_name} crashed: {str(e)}")
        
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
        if critical_failures:
            for issue in critical_failures:
                print(f"   ❌ {issue}")
        else:
            print("   ✅ No critical backend issues found")
        
        # Specific findings for user
        print("\n📋 Specific Findings for User Report:")
        delete_working = suite_results.get("Item CRUD Operations (DELETE Priority)", False)
        if delete_working:
            print("   ✅ DELETE functionality is working correctly")
        else:
            print("   ❌ DELETE functionality confirmed broken - user report validated")
        
        teams_working = suite_results.get("Teams Notifications", False)
        if teams_working:
            print("   ✅ Teams notifications are working")
        else:
            print("   ❌ Teams notifications need investigation")
        
        pdf_working = suite_results.get("PDF Import Functionality", False)
        if pdf_working:
            print("   ✅ PDF import functionality is working")
        else:
            print("   ❌ PDF import functionality needs fixes")
        
        print("="*80)
        
        return {
            "total_tests": self.tests_run,
            "passed_tests": self.tests_passed,
            "success_rate": (self.tests_passed/self.tests_run*100) if self.tests_run > 0 else 0,
            "suite_results": suite_results,
            "critical_failures": critical_failures,
            "delete_functionality_working": delete_working,
            "teams_notifications_working": teams_working,
            "pdf_import_working": pdf_working,
            "project_id": self.project_id,
            "room_id": self.room_id
        }

def main():
    tester = InteriorDesignSystemTester()
    results = tester.run_comprehensive_test()
    
    # Return appropriate exit code
    if results["success_rate"] >= 70:
        return 0
    else:
        return 1

if __name__ == "__main__":
    sys.exit(main())
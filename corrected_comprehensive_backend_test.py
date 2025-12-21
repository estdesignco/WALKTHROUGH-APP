#!/usr/bin/env python3
"""
🚨 CORRECTED COMPREHENSIVE SYSTEM TEST - FULL APPLICATION VALIDATION
Testing EVERY SINGLE TAB AND FEATURE with correct API endpoints and data formats
"""

import requests
import sys
import json
from datetime import datetime
import uuid
import time

class CorrectedComprehensiveSystemTester:
    def __init__(self, base_url="https://vendor-import.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_base = f"{base_url}/api"
        self.tests_run = 0
        self.tests_passed = 0
        self.tests_failed = 0
        self.failed_tests = []
        self.working_features = []
        self.not_working_features = []
        self.partially_working_features = []
        
        # Test data storage
        self.test_project_id = None
        self.test_room_ids = []
        self.test_item_ids = []
        
        print("🚨 CORRECTED COMPREHENSIVE SYSTEM TEST - FULL APPLICATION VALIDATION")
        print("=" * 80)
        print("Testing EVERY SINGLE TAB AND FEATURE with correct endpoints")
        print("=" * 80)

    def run_test(self, name, method, endpoint, expected_status=200, data=None, headers=None):
        """Run a single API test with comprehensive error handling"""
        url = f"{self.api_base}/{endpoint}" if not endpoint.startswith('http') else endpoint
        if headers is None:
            headers = {'Content-Type': 'application/json'}

        self.tests_run += 1
        print(f"\n🔍 Test {self.tests_run}: {name}")
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
            else:
                raise ValueError(f"Unsupported method: {method}")

            print(f"   Status: {response.status_code}")
            
            if response.status_code == expected_status:
                self.tests_passed += 1
                print(f"   ✅ PASS")
                return response
            else:
                self.tests_failed += 1
                self.failed_tests.append({
                    'name': name,
                    'expected': expected_status,
                    'actual': response.status_code,
                    'response': response.text[:200] if response.text else 'No response body'
                })
                print(f"   ❌ FAIL - Expected {expected_status}, got {response.status_code}")
                print(f"   Response: {response.text[:200]}...")
                return None
                
        except Exception as e:
            self.tests_failed += 1
            self.failed_tests.append({
                'name': name,
                'error': str(e)
            })
            print(f"   ❌ ERROR: {e}")
            return None

    def test_1_project_management(self):
        """Test Project Management APIs"""
        print("\n" + "="*50)
        print("1. PROJECT MANAGEMENT TESTING")
        print("="*50)
        
        # GET /api/projects - List all projects
        response = self.run_test("List All Projects", "GET", "projects")
        if response:
            projects = response.json()
            print(f"   Found {len(projects)} existing projects")
            self.working_features.append("✅ GET /api/projects - List projects")
        else:
            self.not_working_features.append("❌ GET /api/projects - List projects")
        
        # POST /api/projects - Create new project (Note: returns 200, not 201)
        project_data = {
            "name": "Comprehensive Test Project",
            "client_info": {
                "full_name": "Test Client Comprehensive",
                "email": "comprehensive@test.com",
                "phone": "555-0123",
                "address": "123 Test Street, Test City, TC 12345"
            },
            "project_type": "Renovation",
            "timeline": "3-6 months",
            "budget": "$50,000-$75,000"
        }
        
        response = self.run_test("Create New Project", "POST", "projects", 200, project_data)
        if response:
            project = response.json()
            self.test_project_id = project.get('id')
            print(f"   Created project ID: {self.test_project_id}")
            self.working_features.append("✅ POST /api/projects - Create project")
        else:
            self.not_working_features.append("❌ POST /api/projects - Create project")
            return False
        
        # GET /api/projects/{id} - Get project details
        if self.test_project_id:
            response = self.run_test("Get Project Details", "GET", f"projects/{self.test_project_id}")
            if response:
                project = response.json()
                print(f"   Project name: {project.get('name')}")
                print(f"   Client: {project.get('client_info', {}).get('full_name')}")
                self.working_features.append("✅ GET /api/projects/{id} - Get project details")
            else:
                self.not_working_features.append("❌ GET /api/projects/{id} - Get project details")
        
        # DELETE /api/projects/{id} - Delete project (test at end)
        return True

    def test_2_room_management(self):
        """Test Room Management with Auto-Population"""
        print("\n" + "="*50)
        print("2. ROOM MANAGEMENT TESTING")
        print("="*50)
        
        if not self.test_project_id:
            print("❌ Skipping room tests - no project ID")
            return False
        
        # POST /api/rooms - Create Kitchen room with auto-population
        kitchen_data = {
            "name": "Kitchen",
            "project_id": self.test_project_id,
            "sheet_type": "walkthrough",
            "auto_populate": True
        }
        
        response = self.run_test("Create Kitchen Room (Auto-populate)", "POST", "rooms", 200, kitchen_data)
        if response:
            room = response.json()
            kitchen_id = room.get('id')
            self.test_room_ids.append(kitchen_id)
            
            # Count items created
            categories = room.get('categories', [])
            total_items = 0
            for category in categories:
                for subcategory in category.get('subcategories', []):
                    total_items += len(subcategory.get('items', []))
            
            print(f"   Kitchen created with {len(categories)} categories and {total_items} items")
            if total_items >= 82:
                print(f"   ✅ Kitchen auto-population meets requirement (82+ items)")
                self.working_features.append(f"✅ POST /api/rooms - Kitchen auto-population ({total_items} items)")
            else:
                print(f"   ⚠️ Kitchen has {total_items} items (expected 82+)")
                self.partially_working_features.append(f"⚠️ Kitchen auto-population ({total_items} items, expected 82+)")
        else:
            self.not_working_features.append("❌ POST /api/rooms - Kitchen auto-population")
        
        # Create Living Room
        living_room_data = {
            "name": "Living Room",
            "project_id": self.test_project_id,
            "sheet_type": "walkthrough",
            "auto_populate": True
        }
        
        response = self.run_test("Create Living Room (Auto-populate)", "POST", "rooms", 200, living_room_data)
        if response:
            room = response.json()
            living_room_id = room.get('id')
            self.test_room_ids.append(living_room_id)
            
            # Count items
            categories = room.get('categories', [])
            total_items = 0
            for category in categories:
                for subcategory in category.get('subcategories', []):
                    total_items += len(subcategory.get('items', []))
            
            print(f"   Living Room created with {total_items} items")
            self.working_features.append(f"✅ POST /api/rooms - Living Room auto-population ({total_items} items)")
        else:
            self.not_working_features.append("❌ POST /api/rooms - Living Room auto-population")
        
        return True

    def test_3_item_management(self):
        """Test Item Management (CRUD operations)"""
        print("\n" + "="*50)
        print("3. ITEM MANAGEMENT TESTING")
        print("="*50)
        
        if not self.test_project_id:
            print("❌ Skipping item tests - no project ID")
            return False
        
        # Get a subcategory ID from existing room
        response = self.run_test("Get Project for Subcategory", "GET", f"projects/{self.test_project_id}")
        subcategory_id = None
        if response:
            project = response.json()
            for room in project.get('rooms', []):
                for category in room.get('categories', []):
                    for subcategory in category.get('subcategories', []):
                        subcategory_id = subcategory.get('id')
                        break
                    if subcategory_id:
                        break
                if subcategory_id:
                    break
        
        if not subcategory_id:
            print("❌ No subcategory found for item creation")
            self.not_working_features.append("❌ Item creation - no subcategory available")
            return False
        
        # POST /api/items - Create item
        item_data = {
            "name": "Test Chandelier",
            "subcategory_id": subcategory_id,
            "quantity": 1,
            "cost": 1299.99,
            "size": "36\" diameter",
            "remarks": "Crystal finish, dimmable",
            "vendor": "Visual Comfort",
            "status": "TO BE SELECTED",
            "sku": "VC-CHD-001",
            "finish_color": "Polished Chrome",
            "tracking_number": "1Z999AA1234567890"
        }
        
        response = self.run_test("Create Item", "POST", "items", 200, item_data)
        if response:
            item = response.json()
            item_id = item.get('id')
            self.test_item_ids.append(item_id)
            print(f"   Created item ID: {item_id}")
            self.working_features.append("✅ POST /api/items - Create item")
        else:
            self.not_working_features.append("❌ POST /api/items - Create item")
            return False
        
        # GET /api/items - List items
        response = self.run_test("List Items", "GET", "items")
        if response:
            items = response.json()
            print(f"   Found {len(items)} total items")
            self.working_features.append("✅ GET /api/items - List items")
        else:
            self.not_working_features.append("❌ GET /api/items - List items")
        
        # PUT /api/items/{id} - Update item
        if self.test_item_ids:
            update_data = {
                "name": "Updated Test Chandelier",
                "cost": 1499.99,
                "quantity": 2,
                "size": "42\" diameter",
                "remarks": "Updated to larger size",
                "vendor": "Circa Lighting",
                "status": "ORDERED",
                "finish_color": "Aged Brass"
            }
            response = self.run_test("Update Item", "PUT", f"items/{self.test_item_ids[0]}", 200, update_data)
            if response:
                updated_item = response.json()
                print(f"   Updated cost: ${updated_item.get('cost')}")
                print(f"   Updated status: {updated_item.get('status')}")
                self.working_features.append("✅ PUT /api/items/{id} - Update item")
            else:
                self.not_working_features.append("❌ PUT /api/items/{id} - Update item")
        
        return True

    def test_4_calculator_apis(self):
        """Test Calculator APIs with correct data formats"""
        print("\n" + "="*50)
        print("4. CALCULATOR APIs TESTING")
        print("="*50)
        
        # Test Wallpaper Calculator with correct fields
        wallpaper_data = {
            "wall_width": 12,
            "wall_height": 9,
            "wallpaper_width": 27,
            "pattern_repeat": 24,
            "wallpaper_type": "double_roll"
        }
        response = self.run_test("Wallpaper Calculator", "POST", "calculators/wallpaper", 200, wallpaper_data)
        if response:
            result = response.json()
            print(f"   Result: {result}")
            self.working_features.append("✅ Wallpaper Calculator")
        else:
            self.not_working_features.append("❌ Wallpaper Calculator")
        
        # Test Drapery Calculator with correct enum values
        drapery_data = {
            "window_width": 60,
            "window_height": 84,
            "finished_length": 96,
            "pleat_type": "pinch_pleat",
            "fullness": 2.5
        }
        response = self.run_test("Drapery Calculator", "POST", "calculators/drapery", 200, drapery_data)
        if response:
            result = response.json()
            print(f"   Result: {result}")
            self.working_features.append("✅ Drapery Calculator")
        else:
            self.not_working_features.append("❌ Drapery Calculator")
        
        # Test Paint Calculator with correct fields
        paint_data = {
            "room_length": 12,
            "room_width": 10,
            "wall_height": 9,
            "doors": 2,
            "windows": 3
        }
        response = self.run_test("Paint Calculator", "POST", "calculators/paint", 200, paint_data)
        if response:
            result = response.json()
            print(f"   Result: {result}")
            self.working_features.append("✅ Paint Calculator")
        else:
            self.not_working_features.append("❌ Paint Calculator")
        
        # Test Lighting Calculator (already working)
        lighting_data = {
            "room_length": 12,
            "room_width": 10,
            "ceiling_height": 9,
            "room_type": "living_room"
        }
        response = self.run_test("Lighting Calculator", "POST", "calculators/lighting", 200, lighting_data)
        if response:
            result = response.json()
            print(f"   Result: {result}")
            self.working_features.append("✅ Lighting Calculator")
        else:
            self.not_working_features.append("❌ Lighting Calculator")
        
        # Test Square Footage Calculator (already working)
        square_footage_data = {
            "length": 12,
            "width": 10,
            "shape": "rectangle"
        }
        response = self.run_test("Square Footage Calculator", "POST", "calculators/square-footage", 200, square_footage_data)
        if response:
            result = response.json()
            print(f"   Result: {result}")
            self.working_features.append("✅ Square Footage Calculator")
        else:
            self.not_working_features.append("❌ Square Footage Calculator")
        
        # Test Hardware Calculator with correct fields (for drapery hardware)
        hardware_data = {
            "window_width": 60,
            "window_height": 84,
            "hardware_type": "drapery_rod"
        }
        response = self.run_test("Hardware Calculator", "POST", "calculators/hardware", 200, hardware_data)
        if response:
            result = response.json()
            print(f"   Result: {result}")
            self.working_features.append("✅ Hardware Calculator")
        else:
            self.not_working_features.append("❌ Hardware Calculator")
        
        # Test for Tile Calculator (might be /flooring)
        tile_data = {
            "room_length": 10,
            "room_width": 8,
            "tile_length": 12,
            "tile_width": 12
        }
        response = self.run_test("Flooring Calculator", "POST", "calculators/flooring", 200, tile_data)
        if response:
            result = response.json()
            print(f"   Result: {result}")
            self.working_features.append("✅ Flooring Calculator")
        else:
            self.not_working_features.append("❌ Flooring Calculator")
        
        # Test Upholstery Calculator (might not exist)
        upholstery_data = {
            "furniture_type": "sofa",
            "fabric_width": 54,
            "pattern_repeat": 27
        }
        response = self.run_test("Upholstery Calculator", "POST", "calculators/upholstery", 200, upholstery_data)
        if response:
            result = response.json()
            print(f"   Result: {result}")
            self.working_features.append("✅ Upholstery Calculator")
        else:
            self.not_working_features.append("❌ Upholstery Calculator (endpoint not found)")

    def test_5_transfer_workflow(self):
        """Test Transfer Workflow (Walkthrough → Checklist → FF&E)"""
        print("\n" + "="*50)
        print("5. TRANSFER WORKFLOW TESTING")
        print("="*50)
        
        if not self.test_project_id:
            print("❌ Skipping transfer tests - no project ID")
            return False
        
        # Create checklist room (transfer from walkthrough)
        checklist_room_data = {
            "name": "Kitchen",
            "project_id": self.test_project_id,
            "sheet_type": "checklist",
            "auto_populate": False  # Transfer operation
        }
        
        response = self.run_test("Create Checklist Room (Transfer)", "POST", "rooms", 200, checklist_room_data)
        if response:
            room = response.json()
            checklist_room_id = room.get('id')
            print(f"   Checklist room created: {checklist_room_id}")
            
            # Verify sheet_type is set correctly
            if room.get('sheet_type') == 'checklist':
                self.working_features.append("✅ Transfer to Checklist - sheet_type set correctly")
            else:
                self.partially_working_features.append("⚠️ Transfer to Checklist - sheet_type not set")
        else:
            self.not_working_features.append("❌ Transfer to Checklist workflow")
        
        # Create FF&E room (transfer from checklist)
        ffe_room_data = {
            "name": "Kitchen",
            "project_id": self.test_project_id,
            "sheet_type": "ffe",
            "auto_populate": False
        }
        
        response = self.run_test("Create FF&E Room (Transfer)", "POST", "rooms", 200, ffe_room_data)
        if response:
            room = response.json()
            ffe_room_id = room.get('id')
            print(f"   FF&E room created: {ffe_room_id}")
            
            if room.get('sheet_type') == 'ffe':
                self.working_features.append("✅ Transfer to FF&E - sheet_type set correctly")
            else:
                self.partially_working_features.append("⚠️ Transfer to FF&E - sheet_type not set")
        else:
            self.not_working_features.append("❌ Transfer to FF&E workflow")

    def test_6_status_management(self):
        """Test Status Management"""
        print("\n" + "="*50)
        print("6. STATUS MANAGEMENT TESTING")
        print("="*50)
        
        response = self.run_test("Get Item Statuses", "GET", "item-statuses")
        if response:
            statuses = response.json()
            print(f"   Found {len(statuses)} item statuses")
            
            # Check for key statuses
            status_names = [status.get('status') for status in statuses]
            required_statuses = ['TO BE SELECTED', 'ORDERED', 'SHIPPED', 'DELIVERED TO JOB SITE', 'INSTALLED']
            
            missing_statuses = [status for status in required_statuses if status not in status_names]
            if not missing_statuses:
                self.working_features.append("✅ GET /api/item-statuses - All key statuses present")
            else:
                self.partially_working_features.append(f"⚠️ Missing statuses: {missing_statuses}")
            
            # Check status colors
            colored_statuses = [status for status in statuses if status.get('color')]
            print(f"   {len(colored_statuses)} statuses have colors")
            
            if len(colored_statuses) == len(statuses):
                self.working_features.append("✅ Status colors - All statuses have colors")
            else:
                self.partially_working_features.append(f"⚠️ {len(statuses) - len(colored_statuses)} statuses missing colors")
        else:
            self.not_working_features.append("❌ GET /api/item-statuses")

    def test_7_master_databases(self):
        """Test Master Databases"""
        print("\n" + "="*50)
        print("7. MASTER DATABASES TESTING")
        print("="*50)
        
        # Test Materials endpoint (found working)
        response = self.run_test("List Master Materials", "GET", "materials")
        if response:
            materials = response.json()
            print(f"   Found {len(materials)} materials")
            self.working_features.append("✅ GET /api/materials - List materials")
        else:
            self.not_working_features.append("❌ GET /api/materials - List materials")
        
        # Test Vendors endpoint
        response = self.run_test("List Vendors", "GET", "vendors")
        if response:
            vendors = response.json()
            print(f"   Found {len(vendors)} vendors")
            self.working_features.append("✅ GET /api/vendors - List vendors")
        else:
            self.not_working_features.append("❌ GET /api/vendors - List vendors")
        
        # Test Contacts endpoint (different path)
        if self.test_project_id:
            response = self.run_test("List Project Contacts", "GET", f"contacts/project/{self.test_project_id}")
            if response:
                contacts = response.json()
                print(f"   Found {len(contacts)} project contacts")
                self.working_features.append("✅ GET /api/contacts/project/{id} - List contacts")
            else:
                self.not_working_features.append("❌ GET /api/contacts/project/{id} - List contacts")

    def test_8_questionnaire_flow(self):
        """Test Questionnaire Flow"""
        print("\n" + "="*50)
        print("8. QUESTIONNAIRE FLOW TESTING")
        print("="*50)
        
        # Test email sending
        email_data = {
            "client_name": "Test Client",
            "client_email": "test@example.com",
            "sender_name": "Established Design Co."
        }
        
        response = self.run_test("Send Questionnaire Email", "POST", "send-questionnaire", 200, email_data)
        if response:
            result = response.json()
            print(f"   Email result: {result}")
            self.working_features.append("✅ POST /api/send-questionnaire - Email sending")
        else:
            self.not_working_features.append("❌ POST /api/send-questionnaire - Email sending")

    def test_9_known_bug_verification(self):
        """Test Known Bug - Calculator validation"""
        print("\n" + "="*50)
        print("9. KNOWN BUG VERIFICATION")
        print("="*50)
        
        # Test calculator with empty fields (should handle gracefully)
        empty_data = {}
        
        response = self.run_test("Wallpaper Calculator (Empty Fields)", "POST", "calculators/wallpaper", 422, empty_data)
        if response is None and self.failed_tests and self.failed_tests[-1].get('actual') == 422:
            print("   ✅ Calculator properly validates empty fields (returns 422)")
            self.working_features.append("✅ Calculator validation - Handles empty fields")
        else:
            print("   ⚠️ Unexpected calculator behavior with empty fields")
            self.partially_working_features.append("⚠️ Calculator validation - Unexpected behavior")

    def cleanup_test_data(self):
        """Clean up test data"""
        print("\n" + "="*50)
        print("CLEANUP TEST DATA")
        print("="*50)
        
        # Delete test items
        for item_id in self.test_item_ids:
            self.run_test(f"Delete Test Item", "DELETE", f"items/{item_id}", 200)
        
        # Delete test rooms
        for room_id in self.test_room_ids:
            self.run_test(f"Delete Test Room", "DELETE", f"rooms/{room_id}", 200)
        
        # Delete test project
        if self.test_project_id:
            self.run_test("Delete Test Project", "DELETE", f"projects/{self.test_project_id}", 200)

    def generate_final_report(self):
        """Generate comprehensive final report"""
        print("\n" + "="*80)
        print("🎯 CORRECTED COMPREHENSIVE SYSTEM TEST RESULTS")
        print("="*80)
        
        print(f"\n📊 SUMMARY STATISTICS:")
        print(f"   Total Tests Run: {self.tests_run}")
        print(f"   Tests Passed: {self.tests_passed}")
        print(f"   Tests Failed: {self.tests_failed}")
        print(f"   Success Rate: {(self.tests_passed/self.tests_run*100):.1f}%")
        
        print(f"\n✅ WORKING FEATURES ({len(self.working_features)}):")
        for feature in self.working_features:
            print(f"   {feature}")
        
        print(f"\n❌ NOT WORKING FEATURES ({len(self.not_working_features)}):")
        for feature in self.not_working_features:
            print(f"   {feature}")
        
        if self.partially_working_features:
            print(f"\n⚠️ PARTIALLY WORKING FEATURES ({len(self.partially_working_features)}):")
            for feature in self.partially_working_features:
                print(f"   {feature}")
        
        print(f"\n🎯 TEST PROJECT DETAILS:")
        if self.test_project_id:
            print(f"   Project ID: {self.test_project_id}")
            print(f"   Rooms Created: {len(self.test_room_ids)}")
            print(f"   Items Created: {len(self.test_item_ids)}")
        
        print(f"\n📋 CURL COMMANDS FOR VERIFICATION:")
        if self.test_project_id:
            print(f"   # Get test project:")
            print(f"   curl -X GET '{self.api_base}/projects/{self.test_project_id}'")
            print(f"   # List all projects:")
            print(f"   curl -X GET '{self.api_base}/projects'")
            print(f"   # Get item statuses:")
            print(f"   curl -X GET '{self.api_base}/item-statuses'")
        
        print("\n" + "="*80)
        print("🚨 CORRECTED COMPREHENSIVE SYSTEM TEST COMPLETE")
        print("="*80)

    def run_all_tests(self):
        """Run all comprehensive system tests"""
        start_time = time.time()
        
        try:
            # Run all test suites
            self.test_1_project_management()
            self.test_2_room_management()
            self.test_3_item_management()
            self.test_4_calculator_apis()
            self.test_5_transfer_workflow()
            self.test_6_status_management()
            self.test_7_master_databases()
            self.test_8_questionnaire_flow()
            self.test_9_known_bug_verification()
            
        except KeyboardInterrupt:
            print("\n⚠️ Test interrupted by user")
        except Exception as e:
            print(f"\n❌ Test suite error: {e}")
        finally:
            # Always generate report
            end_time = time.time()
            print(f"\n⏱️ Total test time: {end_time - start_time:.2f} seconds")
            
            self.generate_final_report()
            
            # Cleanup (optional - comment out to keep test data)
            # self.cleanup_test_data()

if __name__ == "__main__":
    tester = CorrectedComprehensiveSystemTester()
    tester.run_all_tests()
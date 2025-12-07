#!/usr/bin/env python3
"""
🚨 COMPREHENSIVE SYSTEM TEST - FULL APPLICATION VALIDATION
Testing EVERY SINGLE TAB AND FEATURE as requested by user

This test covers:
1. Main Dashboard Tabs functionality
2. Project Management (CRUD operations)
3. Room Management (with auto-population)
4. Item Management (CRUD with all fields)
5. Calculator APIs (ALL 8 calculators)
6. Questionnaire Flow
7. Master Databases (Contacts & Materials)
8. Transfer Workflow (Walkthrough → Checklist → FF&E)
9. Status Management
10. Known Bug Verification
"""

import requests
import sys
import json
from datetime import datetime
import uuid
import time

class ComprehensiveSystemTester:
    def __init__(self, base_url="https://pricelistmaster.preview.emergentagent.com"):
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
        self.test_contact_ids = []
        self.test_material_ids = []
        
        print("🚨 COMPREHENSIVE SYSTEM TEST - FULL APPLICATION VALIDATION")
        print("=" * 80)
        print("Testing EVERY SINGLE TAB AND FEATURE as requested")
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
        
        # POST /api/projects - Create new project
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
        
        response = self.run_test("Create New Project", "POST", "projects", 201, project_data)
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
        
        # PUT /api/projects/{id} - Update project
        if self.test_project_id:
            update_data = {
                "name": "Updated Comprehensive Test Project",
                "timeline": "6-12 months"
            }
            response = self.run_test("Update Project", "PUT", f"projects/{self.test_project_id}", 200, update_data)
            if response:
                self.working_features.append("✅ PUT /api/projects/{id} - Update project")
            else:
                self.not_working_features.append("❌ PUT /api/projects/{id} - Update project")
        
        return True

    def test_2_room_management(self):
        """Test Room Management with Auto-Population"""
        print("\n" + "="*50)
        print("2. ROOM MANAGEMENT TESTING")
        print("="*50)
        
        if not self.test_project_id:
            print("❌ Skipping room tests - no project ID")
            return False
        
        # POST /api/rooms - Create room with auto-population (Kitchen should create 82+ items)
        kitchen_data = {
            "name": "Kitchen",
            "project_id": self.test_project_id,
            "sheet_type": "walkthrough",
            "auto_populate": True
        }
        
        response = self.run_test("Create Kitchen Room (Auto-populate)", "POST", "rooms", 201, kitchen_data)
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
                self.working_features.append("✅ POST /api/rooms - Kitchen auto-population (82+ items)")
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
        
        response = self.run_test("Create Living Room (Auto-populate)", "POST", "rooms", 201, living_room_data)
        if response:
            room = response.json()
            living_room_id = room.get('id')
            self.test_room_ids.append(living_room_id)
            self.working_features.append("✅ POST /api/rooms - Living Room auto-population")
        else:
            self.not_working_features.append("❌ POST /api/rooms - Living Room auto-population")
        
        # GET /api/rooms - List rooms (via project endpoint)
        response = self.run_test("List Rooms via Project", "GET", f"projects/{self.test_project_id}")
        if response:
            project = response.json()
            rooms = project.get('rooms', [])
            print(f"   Found {len(rooms)} rooms in project")
            self.working_features.append("✅ GET rooms via project endpoint")
        else:
            self.not_working_features.append("❌ GET rooms via project endpoint")
        
        # PUT /api/rooms/{id} - Update room
        if self.test_room_ids:
            update_data = {"name": "Updated Kitchen"}
            response = self.run_test("Update Room", "PUT", f"rooms/{self.test_room_ids[0]}", 200, update_data)
            if response:
                self.working_features.append("✅ PUT /api/rooms/{id} - Update room")
            else:
                self.not_working_features.append("❌ PUT /api/rooms/{id} - Update room")
        
        return True

    def test_3_item_management(self):
        """Test Item Management (CRUD operations)"""
        print("\n" + "="*50)
        print("3. ITEM MANAGEMENT TESTING")
        print("="*50)
        
        if not self.test_room_ids:
            print("❌ Skipping item tests - no room IDs")
            return False
        
        # First, get a subcategory ID from existing room
        response = self.run_test("Get Room for Subcategory", "GET", f"projects/{self.test_project_id}")
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
        
        response = self.run_test("Create Item", "POST", "items", 201, item_data)
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
        
        # PUT /api/items/{id} - Update item (cost, quantity, size, remarks, vendor, status)
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
        """Test ALL Calculator APIs"""
        print("\n" + "="*50)
        print("4. CALCULATOR APIs TESTING")
        print("="*50)
        
        calculators = [
            {
                "name": "Wallpaper Calculator",
                "endpoint": "calculators/wallpaper",
                "data": {
                    "room_width": 12,
                    "room_length": 14,
                    "ceiling_height": 9,
                    "wallpaper_width": 27,
                    "pattern_repeat": 24
                }
            },
            {
                "name": "Drapery Calculator", 
                "endpoint": "calculators/drapery",
                "data": {
                    "window_width": 60,
                    "window_height": 84,
                    "finished_length": 96,
                    "pleat_type": "pinch",
                    "fullness": 2.5
                }
            },
            {
                "name": "Paint Calculator",
                "endpoint": "calculators/paint",
                "data": {
                    "room_length": 12,
                    "room_width": 10,
                    "ceiling_height": 9,
                    "doors": 2,
                    "windows": 3
                }
            },
            {
                "name": "Tile Calculator",
                "endpoint": "calculators/tile", 
                "data": {
                    "room_length": 10,
                    "room_width": 8,
                    "tile_length": 12,
                    "tile_width": 12
                }
            },
            {
                "name": "Lighting Calculator",
                "endpoint": "calculators/lighting",
                "data": {
                    "room_length": 12,
                    "room_width": 10,
                    "ceiling_height": 9,
                    "room_type": "living_room"
                }
            },
            {
                "name": "Hardware Calculator",
                "endpoint": "calculators/hardware",
                "data": {
                    "cabinet_doors": 12,
                    "drawer_fronts": 8,
                    "hardware_type": "knobs_and_pulls"
                }
            },
            {
                "name": "Upholstery Calculator",
                "endpoint": "calculators/upholstery",
                "data": {
                    "furniture_type": "sofa",
                    "fabric_width": 54,
                    "pattern_repeat": 27
                }
            },
            {
                "name": "Square Footage Calculator",
                "endpoint": "calculators/square-footage",
                "data": {
                    "length": 12,
                    "width": 10,
                    "shape": "rectangle"
                }
            }
        ]
        
        for calc in calculators:
            response = self.run_test(calc["name"], "POST", calc["endpoint"], 200, calc["data"])
            if response:
                result = response.json()
                print(f"   Result: {result}")
                self.working_features.append(f"✅ {calc['name']}")
            else:
                self.not_working_features.append(f"❌ {calc['name']}")

    def test_5_questionnaire_flow(self):
        """Test Questionnaire Flow"""
        print("\n" + "="*50)
        print("5. QUESTIONNAIRE FLOW TESTING")
        print("="*50)
        
        # Test questionnaire project creation
        questionnaire_data = {
            "name": "Questionnaire Test Project",
            "client_info": {
                "full_name": "Questionnaire Test Client",
                "email": "questionnaire@test.com", 
                "phone": "555-0456",
                "address": "456 Questionnaire St, Test City, TC 12345"
            },
            "project_type": "New Construction",
            "timeline": "6-12 months",
            "budget": "$100,000+"
        }
        
        response = self.run_test("Create Project from Questionnaire", "POST", "projects", 201, questionnaire_data)
        if response:
            project = response.json()
            questionnaire_project_id = project.get('id')
            self.working_features.append("✅ POST /api/projects - Questionnaire project creation")
            
            # Test questionnaire data save (if endpoint exists)
            questionnaire_save_data = {
                "style_preferences": ["Modern", "Minimalist"],
                "color_palette": "Neutral with accent colors",
                "special_requirements": "Pet-friendly materials"
            }
            
            # Note: This endpoint may not exist, testing anyway
            response = self.run_test("Save Questionnaire Data", "POST", f"questionnaire/{questionnaire_project_id}", 200, questionnaire_save_data)
            if response:
                self.working_features.append("✅ POST /api/questionnaire/{project_id} - Save questionnaire")
            else:
                self.partially_working_features.append("⚠️ Questionnaire save endpoint not found")
            
            # Test questionnaire retrieval
            response = self.run_test("Retrieve Questionnaire", "GET", f"questionnaire/{questionnaire_project_id}")
            if response:
                self.working_features.append("✅ GET /api/questionnaire/{project_id} - Retrieve questionnaire")
            else:
                self.partially_working_features.append("⚠️ Questionnaire retrieval endpoint not found")
        else:
            self.not_working_features.append("❌ Questionnaire project creation")

    def test_6_master_databases(self):
        """Test Master Databases (Contacts & Materials)"""
        print("\n" + "="*50)
        print("6. MASTER DATABASES TESTING")
        print("="*50)
        
        # Test Master Contacts
        contact_data = {
            "name": "Test Contact",
            "company": "Test Company",
            "email": "contact@test.com",
            "phone": "555-0789",
            "role": "Contractor",
            "project_id": self.test_project_id if self.test_project_id else str(uuid.uuid4())
        }
        
        response = self.run_test("Create Master Contact", "POST", "master-contacts", 201, contact_data)
        if response:
            contact = response.json()
            contact_id = contact.get('id')
            self.test_contact_ids.append(contact_id)
            self.working_features.append("✅ POST /api/master-contacts - Create contact")
        else:
            self.not_working_features.append("❌ POST /api/master-contacts - Create contact")
        
        response = self.run_test("List Master Contacts", "GET", "master-contacts")
        if response:
            contacts = response.json()
            print(f"   Found {len(contacts)} contacts")
            self.working_features.append("✅ GET /api/master-contacts - List contacts")
        else:
            self.not_working_features.append("❌ GET /api/master-contacts - List contacts")
        
        if self.test_contact_ids:
            update_data = {"phone": "555-0999"}
            response = self.run_test("Update Master Contact", "PUT", f"master-contacts/{self.test_contact_ids[0]}", 200, update_data)
            if response:
                self.working_features.append("✅ PUT /api/master-contacts/{id} - Update contact")
            else:
                self.not_working_features.append("❌ PUT /api/master-contacts/{id} - Update contact")
        
        # Test Master Materials
        material_data = {
            "name": "Test Material",
            "category": "Fabric",
            "vendor": "Test Vendor",
            "cost": 45.99,
            "description": "Test fabric material"
        }
        
        response = self.run_test("Create Master Material", "POST", "master-materials", 201, material_data)
        if response:
            material = response.json()
            material_id = material.get('id')
            self.test_material_ids.append(material_id)
            self.working_features.append("✅ POST /api/master-materials - Create material")
        else:
            self.not_working_features.append("❌ POST /api/master-materials - Create material")
        
        response = self.run_test("List Master Materials", "GET", "master-materials")
        if response:
            materials = response.json()
            print(f"   Found {len(materials)} materials")
            self.working_features.append("✅ GET /api/master-materials - List materials")
        else:
            self.not_working_features.append("❌ GET /api/master-materials - List materials")

    def test_7_transfer_workflow(self):
        """Test Transfer Workflow (Walkthrough → Checklist → FF&E)"""
        print("\n" + "="*50)
        print("7. TRANSFER WORKFLOW TESTING")
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
        
        response = self.run_test("Create Checklist Room (Transfer)", "POST", "rooms", 201, checklist_room_data)
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
        
        response = self.run_test("Create FF&E Room (Transfer)", "POST", "rooms", 201, ffe_room_data)
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

    def test_8_status_management(self):
        """Test Status Management"""
        print("\n" + "="*50)
        print("8. STATUS MANAGEMENT TESTING")
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

    def test_9_known_bug_verification(self):
        """Test Known Bug - Standalone calculators page validation"""
        print("\n" + "="*50)
        print("9. KNOWN BUG VERIFICATION")
        print("="*50)
        
        # Test calculator with empty fields (should handle gracefully)
        empty_data = {}
        
        response = self.run_test("Wallpaper Calculator (Empty Fields)", "POST", "calculators/wallpaper", 400, empty_data)
        if response is None and self.failed_tests and self.failed_tests[-1].get('actual') == 400:
            print("   ✅ Calculator properly validates empty fields (returns 400)")
            self.working_features.append("✅ Calculator validation - Handles empty fields")
        elif response is None and self.failed_tests and self.failed_tests[-1].get('actual') == 500:
            print("   ❌ Calculator validation bug confirmed - 500 error on empty fields")
            self.not_working_features.append("❌ Calculator validation bug - 500 error on empty fields")
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
        
        # Delete test contacts
        for contact_id in self.test_contact_ids:
            self.run_test(f"Delete Test Contact", "DELETE", f"master-contacts/{contact_id}", 200)
        
        # Delete test materials  
        for material_id in self.test_material_ids:
            self.run_test(f"Delete Test Material", "DELETE", f"master-materials/{material_id}", 200)
        
        # Delete test rooms
        for room_id in self.test_room_ids:
            self.run_test(f"Delete Test Room", "DELETE", f"rooms/{room_id}", 200)
        
        # Delete test project
        if self.test_project_id:
            self.run_test("Delete Test Project", "DELETE", f"projects/{self.test_project_id}", 200)

    def generate_final_report(self):
        """Generate comprehensive final report"""
        print("\n" + "="*80)
        print("🎯 COMPREHENSIVE SYSTEM TEST RESULTS")
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
        
        if self.failed_tests:
            print(f"\n🔍 DETAILED FAILURE ANALYSIS:")
            for i, failure in enumerate(self.failed_tests[:10], 1):  # Show first 10 failures
                print(f"   {i}. {failure.get('name')}")
                if 'expected' in failure:
                    print(f"      Expected: {failure['expected']}, Got: {failure['actual']}")
                if 'error' in failure:
                    print(f"      Error: {failure['error']}")
                if 'response' in failure:
                    print(f"      Response: {failure['response']}")
        
        print(f"\n🎯 TEST PROJECT DETAILS:")
        if self.test_project_id:
            print(f"   Project ID: {self.test_project_id}")
            print(f"   Rooms Created: {len(self.test_room_ids)}")
            print(f"   Items Created: {len(self.test_item_ids)}")
            print(f"   Contacts Created: {len(self.test_contact_ids)}")
            print(f"   Materials Created: {len(self.test_material_ids)}")
        
        print(f"\n📋 CURL COMMANDS FOR VERIFICATION:")
        if self.test_project_id:
            print(f"   # Get test project:")
            print(f"   curl -X GET '{self.api_base}/projects/{self.test_project_id}'")
            print(f"   # List all projects:")
            print(f"   curl -X GET '{self.api_base}/projects'")
            print(f"   # Get item statuses:")
            print(f"   curl -X GET '{self.api_base}/item-statuses'")
        
        print("\n" + "="*80)
        print("🚨 COMPREHENSIVE SYSTEM TEST COMPLETE")
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
            self.test_5_questionnaire_flow()
            self.test_6_master_databases()
            self.test_7_transfer_workflow()
            self.test_8_status_management()
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
    tester = ComprehensiveSystemTester()
    tester.run_all_tests()
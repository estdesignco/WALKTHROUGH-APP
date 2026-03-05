#!/usr/bin/env python3
"""
🚨 COMPREHENSIVE BACKEND VERIFICATION - 100% FUNCTIONALITY CHECK
Testing ALL backend functionality as requested in the review.
"""

import requests
import json
import sys
from datetime import datetime
import time

# Backend URL from environment
BACKEND_URL = "https://bugfix-sprint-9.preview.emergentagent.com/api"

class BackendTester:
    def __init__(self):
        self.results = []
        self.total_tests = 0
        self.passed_tests = 0
        
    def log_result(self, test_name, success, response_data=None, error=None):
        """Log test result"""
        self.total_tests += 1
        if success:
            self.passed_tests += 1
            print(f"✅ {test_name}")
            if response_data:
                print(f"   Response: {str(response_data)[:100]}...")
        else:
            print(f"❌ {test_name}")
            if error:
                print(f"   Error: {error}")
        
        self.results.append({
            'test': test_name,
            'success': success,
            'response': response_data,
            'error': error
        })
    
    def test_database_verification(self):
        """Test database counts as specified in review"""
        print("\n🔍 DATABASE VERIFICATION")
        
        try:
            # Test master materials count (correct endpoint with high limit)
            response = requests.get(f"{BACKEND_URL}/master/materials?limit=2000")
            if response.status_code == 200:
                materials = response.json()
                total_count = len(materials)
                
                # Count by category
                category_counts = {}
                for material in materials:
                    category = material.get('category', 'unknown')
                    category_counts[category] = category_counts.get(category, 0) + 1
                
                print(f"   Total materials found: {total_count}")
                print(f"   Category breakdown: {category_counts}")
                
                # Check if we have close to expected total (1505-1507 range)
                if 1505 <= total_count <= 1510:
                    self.log_result("Database contains ~1505 materials", True, f"Total: {total_count}")
                else:
                    self.log_result("Database contains ~1505 materials", False, f"Found: {total_count}, Expected: ~1505")
                
                # Check specific categories mentioned in review (allowing for slight variations)
                expected_counts = {
                    'paint': 536,
                    'fabric': 245, 
                    'hardware': 154,
                    'appliances': 142,  # Note: plural form in database
                    'plumbing': 114,
                    'lighting': 92,
                    'tile': 63,
                    'wallpaper': 39
                }
                
                for category, expected in expected_counts.items():
                    actual = category_counts.get(category, 0)
                    if actual == expected:
                        self.log_result(f"{category.title()} count: {expected}", True, f"Found: {actual}")
                    else:
                        self.log_result(f"{category.title()} count: {expected}", False, f"Found: {actual}, Expected: {expected}")
            else:
                self.log_result("Get master materials list", False, error=f"HTTP {response.status_code}")
                
        except Exception as e:
            self.log_result("Database verification", False, error=str(e))
    
    def test_autocomplete_endpoints(self):
        """Test ALL autocomplete endpoints as specified"""
        print("\n🔍 AUTOCOMPLETE ENDPOINTS TESTING")
        
        autocomplete_tests = [
            ("vendors?q=kra", "Should return Kravet fabrics"),
            ("vendors?q=koh", "Should return Kohler plumbing"),
            ("vendors?q=top", "Should return Top Knobs hardware"),
            ("vendors?q=wolf", "Should return Wolf appliances"),
            ("paint-colors?q=white", "Should return multiple white paints"),
            ("paint-colors?q=revere", "Should return Revere Pewter"),
            ("materials?q=sunbrella", "Should return Sunbrella fabrics"),
            ("contacts?q=test", "Should find Test Vendor API")
        ]
        
        for endpoint, description in autocomplete_tests:
            try:
                response = requests.get(f"{BACKEND_URL}/autocomplete/{endpoint}")
                if response.status_code == 200:
                    results = response.json()
                    if isinstance(results, list) and len(results) > 0:
                        self.log_result(f"Autocomplete {endpoint}", True, f"Found {len(results)} results")
                    else:
                        self.log_result(f"Autocomplete {endpoint}", False, f"No results found")
                else:
                    self.log_result(f"Autocomplete {endpoint}", False, error=f"HTTP {response.status_code}")
            except Exception as e:
                self.log_result(f"Autocomplete {endpoint}", False, error=str(e))
    
    def test_vendor_crud(self):
        """Test vendor CRUD operations"""
        print("\n🔍 VENDOR CRUD TESTING")
        
        vendor_id = None
        
        try:
            # 1. GET /api/vendors - List all vendors
            response = requests.get(f"{BACKEND_URL}/vendors")
            if response.status_code == 200:
                vendors = response.json()
                self.log_result("GET /api/vendors - List all vendors", True, f"Found {len(vendors)} vendors")
            else:
                self.log_result("GET /api/vendors - List all vendors", False, error=f"HTTP {response.status_code}")
            
            # 2. POST /api/vendors - Create vendor
            vendor_data = {
                "name": "Test Vendor Backend",
                "contact_info": "test@backend.com",
                "phone": "555-0123",
                "address": "123 Test St",
                "website": "https://testvendor.com",
                "category": "Testing",
                "notes": "Created by backend test"
            }
            
            response = requests.post(f"{BACKEND_URL}/vendors", json=vendor_data)
            if response.status_code == 200:
                vendor = response.json()
                vendor_id = vendor.get('id')
                self.log_result("POST /api/vendors - Create vendor", True, f"Created vendor ID: {vendor_id}")
                
                # Verify it auto-syncs to master_contacts
                time.sleep(1)  # Give it a moment to sync
                contacts_response = requests.get(f"{BACKEND_URL}/master/contacts")
                if contacts_response.status_code == 200:
                    contacts = contacts_response.json()
                    found_contact = any(c.get('name') == 'Test Vendor Backend' for c in contacts)
                    self.log_result("Vendor auto-sync to master_contacts", found_contact, "Vendor synced to contacts")
                
            else:
                self.log_result("POST /api/vendors - Create vendor", False, error=f"HTTP {response.status_code}")
            
            # 3. PUT /api/vendors/{id} - Update vendor
            if vendor_id:
                update_data = {
                    "name": "Test Vendor Backend Updated",
                    "contact_info": "updated@backend.com"
                }
                response = requests.put(f"{BACKEND_URL}/vendors/{vendor_id}", json=update_data)
                if response.status_code == 200:
                    self.log_result("PUT /api/vendors/{id} - Update vendor", True, "Vendor updated successfully")
                else:
                    self.log_result("PUT /api/vendors/{id} - Update vendor", False, error=f"HTTP {response.status_code}")
            
            # 4. DELETE /api/vendors/{id} - Delete vendor
            if vendor_id:
                response = requests.delete(f"{BACKEND_URL}/vendors/{vendor_id}")
                if response.status_code == 200:
                    self.log_result("DELETE /api/vendors/{id} - Delete vendor", True, "Vendor deleted successfully")
                else:
                    self.log_result("DELETE /api/vendors/{id} - Delete vendor", False, error=f"HTTP {response.status_code}")
                    
        except Exception as e:
            self.log_result("Vendor CRUD operations", False, error=str(e))
    
    def test_materials_crud(self):
        """Test materials CRUD operations"""
        print("\n🔍 MATERIALS CRUD TESTING")
        
        material_id = None
        
        try:
            # 1. GET /api/master/materials - List all materials
            response = requests.get(f"{BACKEND_URL}/master/materials?limit=2000")
            if response.status_code == 200:
                materials = response.json()
                self.log_result("GET /api/master/materials - List all materials", True, f"Found {len(materials)} materials")
            else:
                self.log_result("GET /api/master/materials - List all materials", False, error=f"HTTP {response.status_code}")
            
            # 2. POST /api/master/materials - Create material
            material_data = {
                "name": "Test Material Backend",
                "category": "testing",
                "manufacturer": "Test Manufacturer",
                "sku": "TEST-001",
                "price_per_unit": 99.99,
                "color": "Test Blue",
                "notes": "Created by backend test"
            }
            
            response = requests.post(f"{BACKEND_URL}/master/materials", json=material_data)
            if response.status_code == 200:
                material = response.json()
                material_id = material.get('id')
                self.log_result("POST /api/master/materials - Create material", True, f"Created material ID: {material_id}")
                
                # Verify it appears in master_materials
                time.sleep(1)  # Give it a moment to sync
                materials_response = requests.get(f"{BACKEND_URL}/master/materials?limit=2000")
                if materials_response.status_code == 200:
                    materials = materials_response.json()
                    found_material = any(m.get('name') == 'Test Material Backend' for m in materials)
                    self.log_result("Material appears in master_materials", found_material, "Material synced to master list")
                
            else:
                self.log_result("POST /api/master/materials - Create material", False, error=f"HTTP {response.status_code}")
            
            # 3. PUT /api/master/materials/{id} - Update material
            if material_id:
                update_data = {
                    "name": "Test Material Backend Updated",
                    "price_per_unit": 149.99
                }
                response = requests.put(f"{BACKEND_URL}/master/materials/{material_id}", json=update_data)
                if response.status_code == 200:
                    self.log_result("PUT /api/master/materials/{id} - Update material", True, "Material updated successfully")
                else:
                    self.log_result("PUT /api/master/materials/{id} - Update material", False, error=f"HTTP {response.status_code}")
            
            # 4. DELETE /api/master/materials/{id} - Delete material
            if material_id:
                response = requests.delete(f"{BACKEND_URL}/master/materials/{material_id}")
                if response.status_code == 200:
                    self.log_result("DELETE /api/master/materials/{id} - Delete material", True, "Material deleted successfully")
                else:
                    self.log_result("DELETE /api/master/materials/{id} - Delete material", False, error=f"HTTP {response.status_code}")
                    
        except Exception as e:
            self.log_result("Materials CRUD operations", False, error=str(e))
    
    def test_item_update_auto_sync(self):
        """Test item update auto-sync functionality"""
        print("\n🔍 ITEM UPDATE AUTO-SYNC TESTING")
        
        try:
            # First, get an existing project and item
            projects_response = requests.get(f"{BACKEND_URL}/projects")
            if projects_response.status_code != 200:
                self.log_result("Get projects for auto-sync test", False, error="Cannot get projects")
                return
            
            projects = projects_response.json()
            if not projects:
                self.log_result("Get projects for auto-sync test", False, error="No projects found")
                return
            
            project = projects[0]
            project_id = project.get('id')
            
            # Get project details to find an item
            project_response = requests.get(f"{BACKEND_URL}/projects/{project_id}")
            if project_response.status_code != 200:
                self.log_result("Get project details for auto-sync test", False, error="Cannot get project details")
                return
            
            project_data = project_response.json()
            
            # Find an item to update
            item_id = None
            for room in project_data.get('rooms', []):
                for category in room.get('categories', []):
                    for subcategory in category.get('subcategories', []):
                        for item in subcategory.get('items', []):
                            item_id = item.get('id')
                            break
                        if item_id:
                            break
                    if item_id:
                        break
                if item_id:
                    break
            
            if not item_id:
                self.log_result("Find item for auto-sync test", False, error="No items found in project")
                return
            
            # Update item with new vendor
            update_data = {
                "vendor": "New Test Vendor Auto-Sync"
            }
            
            response = requests.put(f"{BACKEND_URL}/items/{item_id}", json=update_data)
            if response.status_code == 200:
                self.log_result("Update item with new vendor", True, "Item updated successfully")
                
                # Check if vendor was auto-added to master_materials
                time.sleep(2)  # Give it time to sync
                materials_response = requests.get(f"{BACKEND_URL}/materials")
                if materials_response.status_code == 200:
                    materials = materials_response.json()
                    found_vendor = any('New Test Vendor Auto-Sync' in str(m.get('manufacturer', '')) for m in materials)
                    self.log_result("Verify vendor auto-added to master_materials", found_vendor, "Vendor auto-sync working")
                else:
                    self.log_result("Check master materials after item update", False, error="Cannot check materials")
            else:
                self.log_result("Update item with new vendor", False, error=f"HTTP {response.status_code}")
                
        except Exception as e:
            self.log_result("Item update auto-sync test", False, error=str(e))
    
    def test_calculators(self):
        """Test calculator endpoints"""
        print("\n🔍 CALCULATOR TESTING")
        
        calculator_tests = [
            ("wallpaper", {
                "wallpaper_type": "double_roll",
                "wall_width": 12,
                "wall_height": 8,
                "roll_width": 27,
                "roll_length": 15,
                "pattern_repeat": 24,
                "cost_per_unit": 89.99
            }),
            ("drapery", {
                "window_width": 60,
                "window_height": 84,
                "fullness": 2.5,
                "fabric_width": 54,
                "fabric_price_per_yard": 45.00,
                "finished_length": 90,
                "pleat_type": "pinch"
            }),
            ("paint", {
                "room_length": 12,
                "room_width": 10,
                "room_height": 9,
                "doors": 2,
                "windows": 4,
                "price_per_gallon": 65.00
            }),
            ("flooring", {  # Changed from "tile" to "flooring"
                "room_length": 10,
                "room_width": 8,
                "tile_size": "12x12",
                "price_per_sq_ft": 8.50,
                "waste_factor": 0.1
            })
        ]
        
        for calc_type, test_data in calculator_tests:
            try:
                response = requests.post(f"{BACKEND_URL}/calculators/{calc_type}", json=test_data)
                if response.status_code == 200:
                    result = response.json()
                    self.log_result(f"Calculator: {calc_type}", True, f"Calculation successful")
                else:
                    self.log_result(f"Calculator: {calc_type}", False, error=f"HTTP {response.status_code}: {response.text[:100]}")
            except Exception as e:
                self.log_result(f"Calculator: {calc_type}", False, error=str(e))
    
    def test_project_crud(self):
        """Test project CRUD operations"""
        print("\n🔍 PROJECT CRUD TESTING")
        
        project_id = None
        
        try:
            # 1. GET /api/projects - List projects
            response = requests.get(f"{BACKEND_URL}/projects")
            if response.status_code == 200:
                projects = response.json()
                self.log_result("GET /api/projects - List projects", True, f"Found {len(projects)} projects")
            else:
                self.log_result("GET /api/projects - List projects", False, error=f"HTTP {response.status_code}")
            
            # 2. POST /api/projects - Create project
            project_data = {
                "name": "Backend Test Project",
                "client_info": {
                    "full_name": "Backend Test Client",
                    "email": "backend@test.com",
                    "phone": "555-0199",
                    "address": "123 Backend Test St"
                },
                "project_type": "Renovation",
                "timeline": "3-6 months",
                "budget": "50k-75k"
            }
            
            response = requests.post(f"{BACKEND_URL}/projects", json=project_data)
            if response.status_code == 200:
                project = response.json()
                project_id = project.get('id')
                self.log_result("POST /api/projects - Create project", True, f"Created project ID: {project_id}")
            else:
                self.log_result("POST /api/projects - Create project", False, error=f"HTTP {response.status_code}")
            
            # 3. GET /api/projects/{id} - Get project details
            if project_id:
                response = requests.get(f"{BACKEND_URL}/projects/{project_id}")
                if response.status_code == 200:
                    project_details = response.json()
                    self.log_result("GET /api/projects/{id} - Get project details", True, f"Retrieved project: {project_details.get('name')}")
                else:
                    self.log_result("GET /api/projects/{id} - Get project details", False, error=f"HTTP {response.status_code}")
            
            # 4. PUT /api/projects/{id} - Update project
            if project_id:
                update_data = {
                    "name": "Backend Test Project Updated",
                    "client_info": {
                        "full_name": "Backend Test Client Updated",
                        "email": "backend@test.com",
                        "phone": "555-0199",
                        "address": "123 Backend Test St"
                    },
                    "project_type": "Renovation",
                    "timeline": "6-12 months",
                    "budget": "75k-100k"
                }
                response = requests.put(f"{BACKEND_URL}/projects/{project_id}", json=update_data)
                if response.status_code == 200:
                    self.log_result("PUT /api/projects/{id} - Update project", True, "Project updated successfully")
                else:
                    self.log_result("PUT /api/projects/{id} - Update project", False, error=f"HTTP {response.status_code}")
                    
        except Exception as e:
            self.log_result("Project CRUD operations", False, error=str(e))
    
    def run_all_tests(self):
        """Run all backend tests"""
        print("🚨 COMPREHENSIVE BACKEND VERIFICATION - 100% FUNCTIONALITY CHECK")
        print("=" * 70)
        
        # Run all test categories
        self.test_database_verification()
        self.test_autocomplete_endpoints()
        self.test_vendor_crud()
        self.test_materials_crud()
        self.test_item_update_auto_sync()
        self.test_calculators()
        self.test_project_crud()
        
        # Print summary
        print("\n" + "=" * 70)
        print("📊 TEST SUMMARY")
        print("=" * 70)
        print(f"Total Tests: {self.total_tests}")
        print(f"Passed: {self.passed_tests}")
        print(f"Failed: {self.total_tests - self.passed_tests}")
        print(f"Success Rate: {(self.passed_tests/self.total_tests*100):.1f}%")
        
        if self.passed_tests == self.total_tests:
            print("\n🎉 ALL TESTS PASSED - BACKEND IS 100% FUNCTIONAL!")
        else:
            print(f"\n⚠️  {self.total_tests - self.passed_tests} TESTS FAILED - ISSUES NEED ATTENTION")
        
        return self.passed_tests == self.total_tests

if __name__ == "__main__":
    tester = BackendTester()
    success = tester.run_all_tests()
    sys.exit(0 if success else 1)
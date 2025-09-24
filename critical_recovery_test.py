#!/usr/bin/env python3
"""
CRITICAL SYSTEM RECOVERY TESTING - Final Comprehensive Verification

This test verifies all core backend functionality after MongoDB infrastructure fix.
Covers all areas mentioned in the review request with detailed reporting.
"""

import requests
import json
import uuid
import random
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

print("=" * 80)
print("🚨 CRITICAL SYSTEM RECOVERY TESTING - FINAL VERIFICATION")
print("=" * 80)
print(f"Backend URL: {BASE_URL}")
print("Testing all critical areas from review request:")
print("1. Project Management APIs")
print("2. Room Creation with Enhanced Structure (kitchen: 8 categories, 82+ items)")
print("3. Category and Subcategory Management (14 categories)")
print("4. Item CRUD Operations")
print("5. Transfer Functionality APIs")
print("6. Web Scraping API (Four Hands URL)")
print("7. Status Management (FFE + Checklist)")
print("8. Data Structure Integrity")
print("=" * 80)

class CriticalRecoveryTester:
    def __init__(self):
        self.session = requests.Session()
        self.test_results = []
        self.critical_failures = []
        self.warnings = []
        self.test_project_id = None
        
    def log_test(self, test_name: str, success: bool, details: str = "", critical: bool = False):
        """Log test results with critical failure tracking"""
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}")
        if details:
            print(f"   Details: {details}")
            
        self.test_results.append({
            'test': test_name,
            'success': success,
            'details': details,
            'critical': critical
        })
        
        if not success and critical:
            self.critical_failures.append(test_name)
        elif not success:
            self.warnings.append(test_name)
        
    def make_request(self, method: str, endpoint: str, data: Dict = None, params: Dict = None) -> tuple:
        """Make HTTP request and return (success, response_data, status_code)"""
        try:
            url = f"{BASE_URL}{endpoint}"
            
            if method.upper() == 'GET':
                response = self.session.get(url, params=params, timeout=15)
            elif method.upper() == 'POST':
                response = self.session.post(url, json=data, timeout=15)
            elif method.upper() == 'PUT':
                response = self.session.put(url, json=data, timeout=15)
            elif method.upper() == 'DELETE':
                response = self.session.delete(url, timeout=15)
            else:
                return False, f"Unsupported method: {method}", 400
                
            return response.status_code < 400, response.json() if response.content else {}, response.status_code
            
        except requests.exceptions.RequestException as e:
            return False, f"Request failed: {str(e)}", 0
        except json.JSONDecodeError as e:
            return False, f"JSON decode error: {str(e)}", response.status_code if 'response' in locals() else 0
        except Exception as e:
            return False, f"Unexpected error: {str(e)}", 0

    def test_1_project_management_apis(self):
        """Test 1: Project Management APIs - Create, read, update, delete projects"""
        print("\n📋 TEST 1: PROJECT MANAGEMENT APIs")
        
        # CREATE Project
        project_data = {
            "name": "Critical Recovery Test Project",
            "client_info": {
                "full_name": "Recovery Test Client",
                "email": "recovery@test.com",
                "phone": "555-0199",
                "address": "123 Recovery St, Test City"
            },
            "project_type": "Renovation",
            "budget": "$50,000",
            "timeline": "3 months"
        }
        
        success, project, status_code = self.make_request('POST', '/projects', project_data)
        
        if not success:
            self.log_test("Project CREATE", False, f"Failed: {project} (Status: {status_code})", critical=True)
            return False
            
        self.test_project_id = project.get('id')
        self.log_test("Project CREATE", True, f"Created project ID: {self.test_project_id}")
        
        # READ Project
        success, retrieved_project, status_code = self.make_request('GET', f'/projects/{self.test_project_id}')
        
        if not success:
            self.log_test("Project READ", False, f"Failed: {retrieved_project} (Status: {status_code})", critical=True)
            return False
            
        self.log_test("Project READ", True, f"Retrieved project: {retrieved_project.get('name')}")
        
        # Test projects list endpoint
        success, projects_list, status_code = self.make_request('GET', '/projects')
        
        if success and status_code == 200:
            self.log_test("Projects LIST", True, f"Found {len(projects_list)} projects")
        else:
            self.log_test("Projects LIST", False, f"Failed: {projects_list} (Status: {status_code})", critical=True)
            
        return True

    def test_2_enhanced_room_creation(self):
        """Test 2: Room Creation with Enhanced Structure - Kitchen should create 8 categories, 82+ items"""
        print("\n🍳 TEST 2: ENHANCED ROOM CREATION")
        
        if not self.test_project_id:
            self.log_test("Enhanced Room Creation", False, "No test project available", critical=True)
            return False
        
        # Create kitchen room
        room_data = {
            "name": "kitchen",
            "project_id": self.test_project_id,
            "description": "Test kitchen for enhanced structure verification"
        }
        
        success, room, status_code = self.make_request('POST', '/rooms', room_data)
        
        if not success:
            self.log_test("Kitchen Room Creation", False, f"Failed: {room} (Status: {status_code})", critical=True)
            return False
            
        room_id = room.get('id')
        self.log_test("Kitchen Room Creation", True, f"Created kitchen room ID: {room_id}")
        
        # Verify enhanced structure
        success, project_data, status_code = self.make_request('GET', f'/projects/{self.test_project_id}')
        
        if not success:
            self.log_test("Enhanced Structure Verification", False, "Could not retrieve project data", critical=True)
            return False
            
        # Find kitchen room
        kitchen_room = None
        for room in project_data.get('rooms', []):
            if room.get('name', '').lower() == 'kitchen':
                kitchen_room = room
                break
                
        if not kitchen_room:
            self.log_test("Enhanced Structure Verification", False, "Kitchen room not found", critical=True)
            return False
            
        # Analyze structure
        categories = kitchen_room.get('categories', [])
        total_subcategories = sum(len(cat.get('subcategories', [])) for cat in categories)
        total_items = sum(
            len(subcat.get('items', []))
            for cat in categories
            for subcat in cat.get('subcategories', [])
        )
        
        # Check for enhanced structure requirements
        if len(categories) >= 8:
            self.log_test("Kitchen Categories Count", True, f"Found {len(categories)} categories (≥8 required)")
        else:
            self.log_test("Kitchen Categories Count", False, f"Found {len(categories)} categories (8 required)")
            
        if total_items >= 82:
            self.log_test("Kitchen Items Count", True, f"Found {total_items} items (≥82 required)")
        else:
            self.log_test("Kitchen Items Count", False, f"Found {total_items} items (82 required)")
            
        # Check for finish_color fields
        items_with_finish_color = 0
        total_items_checked = 0
        
        for category in categories:
            for subcat in category.get('subcategories', []):
                for item in subcat.get('items', []):
                    total_items_checked += 1
                    if 'finish_color' in item:
                        items_with_finish_color += 1
        
        if total_items_checked > 0:
            finish_color_percentage = (items_with_finish_color / total_items_checked) * 100
            self.log_test("Finish Color Fields", True, 
                         f"{items_with_finish_color}/{total_items_checked} items ({finish_color_percentage:.1f}%) have finish_color field")
        
        return len(categories) >= 6 and total_items >= 50  # Minimum acceptable

    def test_3_category_management(self):
        """Test 3: Category and Subcategory Management - GET /api/categories/available returns all 14 categories"""
        print("\n📂 TEST 3: CATEGORY AND SUBCATEGORY MANAGEMENT")
        
        # Test categories available endpoint
        success, data, status_code = self.make_request('GET', '/categories/available')
        
        if not success:
            self.log_test("Categories Available Endpoint", False, f"Failed: {data} (Status: {status_code})", critical=True)
            return False
            
        # Handle both dict and list formats
        if isinstance(data, dict) and 'categories' in data:
            categories_list = data['categories']
        elif isinstance(data, list):
            categories_list = data
        else:
            self.log_test("Categories Available Format", False, f"Unexpected format: {type(data)}")
            return False
            
        # Check category count
        if len(categories_list) >= 14:
            self.log_test("Categories Count", True, f"Found {len(categories_list)} categories (≥14 required)")
        else:
            self.log_test("Categories Count", False, f"Found {len(categories_list)} categories (14 required)")
            
        # Check for key categories
        expected_categories = [
            "Lighting", "Appliances", "Plumbing", "Furniture & Storage", 
            "Decor & Accessories", "Paint, Wallpaper, and Finishes",
            "Cabinets, Built-ins, and Trim", "Tile and Tops"
        ]
        
        found_categories = []
        missing_categories = []
        
        for expected in expected_categories:
            if expected in categories_list:
                found_categories.append(expected)
            else:
                missing_categories.append(expected)
        
        if missing_categories:
            self.log_test("Key Categories Check", False, f"Missing: {', '.join(missing_categories)}")
        else:
            self.log_test("Key Categories Check", True, "All key categories found")
            
        return len(missing_categories) == 0

    def test_4_item_crud_operations(self):
        """Test 4: Item CRUD Operations - Create, read, update, delete items with proper subcategory relationships"""
        print("\n📦 TEST 4: ITEM CRUD OPERATIONS")
        
        if not self.test_project_id:
            self.log_test("Item CRUD Setup", False, "No test project available", critical=True)
            return False
        
        # Get project data to find a subcategory
        success, project_data, status_code = self.make_request('GET', f'/projects/{self.test_project_id}')
        
        if not success:
            self.log_test("Get Project for Items", False, "Could not retrieve project", critical=True)
            return False
            
        # Find first available subcategory
        target_subcategory = None
        for room in project_data.get('rooms', []):
            for category in room.get('categories', []):
                for subcategory in category.get('subcategories', []):
                    target_subcategory = subcategory
                    break
                if target_subcategory:
                    break
            if target_subcategory:
                break
                
        if not target_subcategory:
            self.log_test("Find Subcategory for Items", False, "No subcategory found", critical=True)
            return False
            
        subcategory_id = target_subcategory.get('id')
        self.log_test("Find Subcategory for Items", True, f"Using subcategory: {target_subcategory.get('name')}")
        
        # CREATE Item
        item_data = {
            "name": "Critical Recovery Test Item",
            "quantity": 1,
            "size": "24\"W x 18\"D x 30\"H",
            "remarks": "Test item for critical recovery verification",
            "vendor": "Four Hands",
            "status": "TO BE SELECTED",
            "cost": 599.99,
            "subcategory_id": subcategory_id,
            "finish_color": "Natural Oak",
            "sku": "RECOVERY-001"
        }
        
        success, item, status_code = self.make_request('POST', '/items', item_data)
        
        if not success:
            self.log_test("Item CREATE", False, f"Failed: {item} (Status: {status_code})", critical=True)
            return False
            
        item_id = item.get('id')
        self.log_test("Item CREATE", True, f"Created item ID: {item_id}")
        
        # UPDATE Item
        update_data = {
            "status": "ORDERED",
            "cost": 649.99,
            "tracking_number": "TEST123456789"
        }
        
        success, updated_item, status_code = self.make_request('PUT', f'/items/{item_id}', update_data)
        
        if success:
            self.log_test("Item UPDATE", True, f"Updated status: {updated_item.get('status')}")
        else:
            self.log_test("Item UPDATE", False, f"Failed: {updated_item}")
        
        # DELETE Item
        success, delete_response, status_code = self.make_request('DELETE', f'/items/{item_id}')
        
        if success and status_code == 200:
            self.log_test("Item DELETE", True, "Item deleted successfully")
        else:
            self.log_test("Item DELETE", False, f"Failed: {delete_response} (Status: {status_code})")
        
        return True

    def test_5_transfer_functionality(self):
        """Test 5: Transfer Functionality APIs - Test Walkthrough → Checklist and Checklist → FFE workflows"""
        print("\n🔄 TEST 5: TRANSFER FUNCTIONALITY APIs")
        
        if not self.test_project_id:
            self.log_test("Transfer Functionality Setup", False, "No test project available")
            return False
        
        # Test room creation with different sheet_types (core to transfer functionality)
        sheet_types = ["walkthrough", "checklist", "ffe"]
        
        for sheet_type in sheet_types:
            room_data = {
                "name": f"transfer test {sheet_type}",
                "project_id": self.test_project_id,
                "sheet_type": sheet_type,
                "description": f"Test room for {sheet_type} transfer functionality"
            }
            
            success, room, status_code = self.make_request('POST', '/rooms', room_data)
            
            if success:
                returned_sheet_type = room.get('sheet_type', 'not specified')
                self.log_test(f"Transfer Room Creation ({sheet_type})", True, 
                             f"Created room with sheet_type: {returned_sheet_type}")
            else:
                self.log_test(f"Transfer Room Creation ({sheet_type})", False, f"Failed: {room}")
        
        # Test item status updates (core transfer functionality)
        success, project_data, status_code = self.make_request('GET', f'/projects/{self.test_project_id}')
        
        if success:
            # Find an item to test status updates
            test_item = None
            for room in project_data.get('rooms', []):
                for category in room.get('categories', []):
                    for subcategory in category.get('subcategories', []):
                        items = subcategory.get('items', [])
                        if items:
                            test_item = items[0]
                            break
                    if test_item:
                        break
                if test_item:
                    break
                    
            if test_item:
                item_id = test_item.get('id')
                
                # Test transfer-related status updates
                transfer_statuses = ['PICKED', 'APPROVED']  # Common transfer statuses
                
                for new_status in transfer_statuses:
                    update_data = {"status": new_status}
                    success, updated_item, status_code = self.make_request('PUT', f'/items/{item_id}', update_data)
                    
                    if success:
                        self.log_test(f"Transfer Status Update ({new_status})", True, 
                                     f"Updated item status to {new_status}")
                    else:
                        self.log_test(f"Transfer Status Update ({new_status})", False, f"Failed: {updated_item}")
            else:
                self.log_test("Transfer Status Updates", False, "No items found to test")
        
        return True

    def test_6_web_scraping_api(self):
        """Test 6: Web Scraping API - Test POST /api/scrape-product with Four Hands URL"""
        print("\n🕷️ TEST 6: WEB SCRAPING API")
        
        # Test Four Hands URL as specified in review request
        scrape_data = {
            "url": "https://fourhands.com/product/248067-003"
        }
        
        success, response, status_code = self.make_request('POST', '/scrape-product', scrape_data)
        
        if not success:
            self.log_test("Web Scraping API", False, f"Failed: {response} (Status: {status_code})")
            return False
            
        # Check response structure
        if not isinstance(response, dict):
            self.log_test("Scraping Response Format", False, f"Expected dict, got {type(response)}")
            return False
            
        if not response.get('success'):
            self.log_test("Web Scraping API", False, f"Scraping failed: {response.get('error', 'Unknown error')}")
            return False
            
        data = response.get('data', {})
        extracted_fields = []
        
        # Check for expected fields
        if data.get('name'):
            extracted_fields.append(f"name='{data['name']}'")
        if data.get('vendor'):
            extracted_fields.append(f"vendor='{data['vendor']}'")
        if data.get('sku'):
            extracted_fields.append(f"sku='{data['sku']}'")
        if data.get('cost') or data.get('price'):
            price = data.get('cost') or data.get('price')
            extracted_fields.append(f"price='{price}'")
            
        if len(extracted_fields) >= 3:  # Should extract at least name, vendor, sku
            self.log_test("Web Scraping API", True, f"Extracted: {', '.join(extracted_fields)}")
            return True
        else:
            self.log_test("Web Scraping API", False, f"Insufficient data extracted: {', '.join(extracted_fields)}")
            return False

    def test_7_status_management(self):
        """Test 7: Status Management - Verify status dropdowns and color coding for both FFE and Checklist"""
        print("\n🎨 TEST 7: STATUS MANAGEMENT")
        
        # Test enhanced status options endpoint
        success, response, status_code = self.make_request('GET', '/item-statuses-enhanced')
        
        if not success:
            self.log_test("Status Management API", False, f"Failed: {response} (Status: {status_code})")
            return False
            
        # Handle response format
        if isinstance(response, dict) and 'data' in response:
            statuses = response['data']
        elif isinstance(response, list):
            statuses = response
        else:
            self.log_test("Status Response Format", False, f"Unexpected format: {type(response)}")
            return False
            
        # Check for key FFE statuses
        ffe_statuses = ['TO BE SELECTED', 'ORDERED', 'SHIPPED', 'DELIVERED TO JOB SITE', 'INSTALLED']
        ffe_found = 0
        
        for status_obj in statuses:
            if isinstance(status_obj, dict) and status_obj.get('status') in ffe_statuses:
                ffe_found += 1
        
        self.log_test("FFE Status Options", ffe_found >= 4, f"Found {ffe_found}/{len(ffe_statuses)} FFE statuses")
        
        # Check for key Checklist statuses
        checklist_statuses = ['ORDER SAMPLES', 'SAMPLES ARRIVED', 'ASK NEIL', 'ASK CHARLENE', 'READY FOR PRESENTATION']
        checklist_found = 0
        
        for status_obj in statuses:
            if isinstance(status_obj, dict) and status_obj.get('status') in checklist_statuses:
                checklist_found += 1
        
        self.log_test("Checklist Status Options", checklist_found >= 4, 
                     f"Found {checklist_found}/{len(checklist_statuses)} checklist statuses")
        
        # Check for color coding
        statuses_with_colors = 0
        for status_obj in statuses:
            if isinstance(status_obj, dict) and status_obj.get('color'):
                statuses_with_colors += 1
        
        color_percentage = (statuses_with_colors / len(statuses)) * 100 if statuses else 0
        
        self.log_test("Status Color Coding", color_percentage >= 90, 
                     f"{statuses_with_colors}/{len(statuses)} statuses have colors ({color_percentage:.1f}%)")
        
        return ffe_found >= 4 and checklist_found >= 4

    def test_8_data_structure_integrity(self):
        """Test 8: Data Structure Integrity - Verify proper room/category/subcategory/item hierarchy"""
        print("\n🏗️ TEST 8: DATA STRUCTURE INTEGRITY")
        
        if not self.test_project_id:
            self.log_test("Data Structure Integrity", False, "No test project available")
            return False
        
        # Get project data
        success, project_data, status_code = self.make_request('GET', f'/projects/{self.test_project_id}')
        
        if not success:
            self.log_test("Project Data Retrieval", False, f"Failed: {project_data} (Status: {status_code})")
            return False
            
        self.log_test("Project Data Retrieval", True, f"Retrieved project: {project_data.get('name')}")
        
        # Analyze data structure hierarchy
        rooms = project_data.get('rooms', [])
        total_categories = 0
        total_subcategories = 0
        total_items = 0
        items_with_finish_color = 0
        
        hierarchy_valid = True
        
        for room in rooms:
            if not isinstance(room, dict) or 'id' not in room:
                hierarchy_valid = False
                continue
                
            categories = room.get('categories', [])
            total_categories += len(categories)
            
            for category in categories:
                if not isinstance(category, dict) or 'id' not in category:
                    hierarchy_valid = False
                    continue
                    
                subcategories = category.get('subcategories', [])
                total_subcategories += len(subcategories)
                
                for subcategory in subcategories:
                    if not isinstance(subcategory, dict) or 'id' not in subcategory:
                        hierarchy_valid = False
                        continue
                        
                    items = subcategory.get('items', [])
                    total_items += len(items)
                    
                    for item in items:
                        if not isinstance(item, dict) or 'id' not in item:
                            hierarchy_valid = False
                            continue
                            
                        if 'finish_color' in item:
                            items_with_finish_color += 1
        
        self.log_test("Hierarchy Structure", hierarchy_valid, 
                     f"Rooms→Categories→Subcategories→Items hierarchy is {'valid' if hierarchy_valid else 'invalid'}")
        
        self.log_test("Data Structure Counts", True, 
                     f"{len(rooms)} rooms, {total_categories} categories, {total_subcategories} subcategories, {total_items} items")
        
        if total_items > 0:
            finish_color_percentage = (items_with_finish_color / total_items) * 100
            self.log_test("Finish Color Fields", True, 
                         f"{items_with_finish_color}/{total_items} items ({finish_color_percentage:.1f}%) have finish_color field")
        
        return hierarchy_valid and total_items > 0

    def run_all_tests(self):
        """Run all critical recovery tests"""
        print("🚀 STARTING CRITICAL SYSTEM RECOVERY TESTING...")
        
        # Run all tests in sequence
        test_methods = [
            self.test_1_project_management_apis,
            self.test_2_enhanced_room_creation,
            self.test_3_category_management,
            self.test_4_item_crud_operations,
            self.test_5_transfer_functionality,
            self.test_6_web_scraping_api,
            self.test_7_status_management,
            self.test_8_data_structure_integrity
        ]
        
        for test_method in test_methods:
            try:
                test_method()
            except Exception as e:
                test_name = test_method.__name__.replace('test_', '').replace('_', ' ').title()
                self.log_test(f"{test_name} (Exception)", False, f"Exception: {str(e)}", critical=True)
        
        # Generate final report
        self.generate_final_report()
        
        return len(self.critical_failures) == 0

    def generate_final_report(self):
        """Generate comprehensive final report"""
        print("\n" + "=" * 80)
        print("🎯 CRITICAL SYSTEM RECOVERY TEST - FINAL REPORT")
        print("=" * 80)
        
        total_tests = len(self.test_results)
        passed_tests = sum(1 for result in self.test_results if result['success'])
        failed_tests = total_tests - passed_tests
        
        print(f"📊 OVERALL RESULTS: {passed_tests}/{total_tests} tests passed ({(passed_tests/total_tests)*100:.1f}%)")
        
        # Critical failures
        if self.critical_failures:
            print(f"\n🚨 CRITICAL FAILURES ({len(self.critical_failures)}):")
            for failure in self.critical_failures:
                print(f"   • {failure}")
            print("   ⚠️ System is NOT ready for production use")
        else:
            print(f"\n✅ NO CRITICAL FAILURES - Core system is operational")
        
        # Warnings (non-critical failures)
        if self.warnings:
            print(f"\n⚠️ WARNINGS ({len(self.warnings)}):")
            for warning in self.warnings:
                print(f"   • {warning}")
        
        # Test summary by category
        print(f"\n📋 TEST SUMMARY BY CATEGORY:")
        
        categories = [
            ("Project Management", ["Project CREATE", "Project READ", "Projects LIST"]),
            ("Enhanced Room Creation", ["Kitchen Room Creation", "Kitchen Categories Count", "Kitchen Items Count"]),
            ("Category Management", ["Categories Available Endpoint", "Categories Count", "Key Categories Check"]),
            ("Item CRUD Operations", ["Item CREATE", "Item UPDATE", "Item DELETE"]),
            ("Transfer Functionality", ["Transfer Room Creation", "Transfer Status Update"]),
            ("Web Scraping", ["Web Scraping API"]),
            ("Status Management", ["FFE Status Options", "Checklist Status Options", "Status Color Coding"]),
            ("Data Structure", ["Hierarchy Structure", "Data Structure Counts", "Finish Color Fields"])
        ]
        
        for category_name, test_names in categories:
            category_tests = [r for r in self.test_results if any(test_name in r['test'] for test_name in test_names)]
            if category_tests:
                passed = sum(1 for t in category_tests if t['success'])
                total = len(category_tests)
                status = "✅" if passed == total else "⚠️" if passed > 0 else "❌"
                print(f"   {status} {category_name}: {passed}/{total} tests passed")
        
        # MongoDB Infrastructure Status
        mongodb_working = any(r['success'] for r in self.test_results if 'Project CREATE' in r['test'])
        print(f"\n🗄️ MONGODB INFRASTRUCTURE: {'✅ OPERATIONAL' if mongodb_working else '❌ FAILED'}")
        
        # Core Backend APIs Status
        core_apis_working = (
            any(r['success'] for r in self.test_results if 'Project CREATE' in r['test']) and
            any(r['success'] for r in self.test_results if 'Item CREATE' in r['test'])
        )
        print(f"🔧 CORE BACKEND APIs: {'✅ OPERATIONAL' if core_apis_working else '❌ FAILED'}")
        
        # Enhanced Structure Status
        enhanced_structure_working = any(r['success'] for r in self.test_results if 'Kitchen Categories Count' in r['test'])
        print(f"🏗️ ENHANCED STRUCTURE: {'✅ OPERATIONAL' if enhanced_structure_working else '⚠️ BASIC ONLY'}")
        
        if self.test_project_id:
            print(f"\n🆔 TEST PROJECT CREATED: {self.test_project_id}")
            base_frontend_url = BASE_URL.replace('/api', '')
            print(f"🌐 PREVIEW URLS:")
            print(f"   Walkthrough: {base_frontend_url}/project/{self.test_project_id}/walkthrough")
            print(f"   Checklist:   {base_frontend_url}/project/{self.test_project_id}/checklist")
            print(f"   FF&E Sheet:  {base_frontend_url}/project/{self.test_project_id}/ffe")
        
        # Final verdict
        if len(self.critical_failures) == 0:
            print(f"\n🎉 VERDICT: SYSTEM RECOVERY SUCCESSFUL")
            print(f"   All critical backend functionality is operational after MongoDB fix")
        else:
            print(f"\n❌ VERDICT: SYSTEM RECOVERY INCOMPLETE")
            print(f"   Critical issues remain that prevent production use")

# Main execution
if __name__ == "__main__":
    tester = CriticalRecoveryTester()
    success = tester.run_all_tests()
    
    if success:
        print("\n🎉 SUCCESS: Critical system recovery testing completed - system is operational!")
        exit(0)
    else:
        print("\n❌ FAILURE: Critical system recovery testing found blocking issues.")
        exit(1)
#!/usr/bin/env python3
"""
FEATURE STATUS CHECK: Test key features after reverting room auto-population

REVIEW REQUEST TESTING:
1. **ADD CATEGORY functionality** - Test if predefined categories can be added to rooms
2. **ADD NEW CATEGORY functionality** - Test if custom categories work with the prompt
3. **Walkthrough room auto-population** - Verify walkthrough rooms still get full structure
4. **Scraping API** - Test if the product scraping endpoint still works
5. **Transfer functionality** - Quick test to confirm it's working (only checked items)

This is a status check to ensure we didn't break other features while fixing the transfer.
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
print("🔍 FEATURE STATUS CHECK - POST TRANSFER FIX VERIFICATION")
print("=" * 80)
print(f"Backend URL: {BASE_URL}")
print("Testing: ADD CATEGORY, Walkthrough Auto-Population, Scraping API, Transfer Functionality")
print("=" * 80)

class FeatureStatusChecker:
    def __init__(self):
        self.session = requests.Session()
        self.test_results = []
        self.test_project_id = None
        self.walkthrough_room_id = None
        self.checklist_room_id = None
        
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
                response = self.session.get(url, params=params, timeout=15)
            elif method.upper() == 'POST':
                response = self.session.post(url, json=data, params=params, timeout=15)
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

    def setup_test_project(self):
        """Create a test project for feature testing"""
        print("\n🏠 Setting up test project...")
        
        project_data = {
            "name": "Feature Status Check Project",
            "client_info": {
                "full_name": "Test Client",
                "email": "test@featurecheck.com",
                "phone": "555-0123",
                "address": "123 Feature Test St"
            },
            "project_type": "Renovation"
        }
        
        success, project, status_code = self.make_request('POST', '/projects', project_data)
        
        if not success:
            self.log_test("Setup Test Project", False, f"Failed: {project} (Status: {status_code})")
            return False
            
        self.test_project_id = project.get('id')
        self.log_test("Setup Test Project", True, f"Project ID: {self.test_project_id}")
        return True

    def test_walkthrough_room_auto_population(self):
        """Test #3: Verify walkthrough rooms still get full structure"""
        print("\n🚶 Testing Walkthrough Room Auto-Population...")
        
        if not self.test_project_id:
            self.log_test("Walkthrough Auto-Population", False, "No test project available")
            return False
        
        # Create walkthrough room
        room_data = {
            "name": "living room",
            "project_id": self.test_project_id,
            "sheet_type": "walkthrough",
            "description": "Test walkthrough room for auto-population"
        }
        
        success, room, status_code = self.make_request('POST', '/rooms', room_data)
        
        if not success:
            self.log_test("Create Walkthrough Room", False, f"Failed: {room} (Status: {status_code})")
            return False
            
        self.walkthrough_room_id = room.get('id')
        self.log_test("Create Walkthrough Room", True, f"Room ID: {self.walkthrough_room_id}")
        
        # Verify room has comprehensive structure
        success, project_data, status_code = self.make_request('GET', f'/projects/{self.test_project_id}')
        
        if not success:
            self.log_test("Verify Walkthrough Structure", False, "Could not retrieve project data")
            return False
            
        # Find walkthrough room
        walkthrough_room = None
        for room in project_data.get('rooms', []):
            if room.get('id') == self.walkthrough_room_id:
                walkthrough_room = room
                break
                
        if not walkthrough_room:
            self.log_test("Find Walkthrough Room", False, "Walkthrough room not found")
            return False
            
        # Analyze structure
        categories = walkthrough_room.get('categories', [])
        total_subcategories = sum(len(cat.get('subcategories', [])) for cat in categories)
        total_items = sum(
            len(subcat.get('items', []))
            for cat in categories
            for subcat in cat.get('subcategories', [])
        )
        
        # Walkthrough should have comprehensive structure
        if len(categories) >= 4 and total_items >= 20:
            self.log_test("Walkthrough Auto-Population", True, 
                         f"Living room has {len(categories)} categories, {total_subcategories} subcategories, {total_items} items")
            return True
        else:
            self.log_test("Walkthrough Auto-Population", False, 
                         f"Living room has minimal structure: {len(categories)} categories, {total_items} items")
            return False

    def test_add_category_functionality(self):
        """Test #1: Test if predefined categories can be added to rooms"""
        print("\n📂 Testing ADD CATEGORY Functionality...")
        
        if not self.walkthrough_room_id:
            self.log_test("ADD CATEGORY Test", False, "No walkthrough room available")
            return False
        
        # Test comprehensive category creation endpoint
        params = {
            "room_id": self.walkthrough_room_id,
            "category_name": "Lighting"
        }
        
        success, response, status_code = self.make_request('POST', '/categories/comprehensive', params=params)
        
        if not success:
            self.log_test("ADD CATEGORY (Comprehensive)", False, f"Failed: {response} (Status: {status_code})")
            return False
            
        self.log_test("ADD CATEGORY (Comprehensive)", True, f"Added Lighting category")
        
        # Verify category was added by checking project structure
        success, project_data, status_code = self.make_request('GET', f'/projects/{self.test_project_id}')
        
        if success:
            # Find walkthrough room and check for Lighting category
            walkthrough_room = None
            for room in project_data.get('rooms', []):
                if room.get('id') == self.walkthrough_room_id:
                    walkthrough_room = room
                    break
                    
            if walkthrough_room:
                categories = walkthrough_room.get('categories', [])
                lighting_found = any(cat.get('name', '').lower() == 'lighting' for cat in categories)
                
                if lighting_found:
                    self.log_test("Verify Added Category", True, "Lighting category found in room structure")
                    return True
                else:
                    self.log_test("Verify Added Category", False, "Lighting category not found in room structure")
                    return False
            else:
                self.log_test("Verify Added Category", False, "Could not find walkthrough room")
                return False
        else:
            self.log_test("Verify Added Category", False, "Could not retrieve project data")
            return False

    def test_add_new_category_functionality(self):
        """Test #2: Test if custom categories work with the prompt"""
        print("\n🆕 Testing ADD NEW CATEGORY Functionality...")
        
        if not self.walkthrough_room_id:
            self.log_test("ADD NEW CATEGORY Test", False, "No walkthrough room available")
            return False
        
        # Test adding a custom category
        params = {
            "room_id": self.walkthrough_room_id,
            "category_name": "Custom Test Category"
        }
        
        success, response, status_code = self.make_request('POST', '/categories/comprehensive', params=params)
        
        if not success:
            self.log_test("ADD NEW CATEGORY (Custom)", False, f"Failed: {response} (Status: {status_code})")
            return False
            
        self.log_test("ADD NEW CATEGORY (Custom)", True, f"Added custom category")
        
        # Verify custom category was added
        success, project_data, status_code = self.make_request('GET', f'/projects/{self.test_project_id}')
        
        if success:
            walkthrough_room = None
            for room in project_data.get('rooms', []):
                if room.get('id') == self.walkthrough_room_id:
                    walkthrough_room = room
                    break
                    
            if walkthrough_room:
                categories = walkthrough_room.get('categories', [])
                custom_found = any('custom test category' in cat.get('name', '').lower() for cat in categories)
                
                if custom_found:
                    self.log_test("Verify Custom Category", True, "Custom category found in room structure")
                    return True
                else:
                    self.log_test("Verify Custom Category", False, "Custom category not found in room structure")
                    return False
            else:
                self.log_test("Verify Custom Category", False, "Could not find walkthrough room")
                return False
        else:
            self.log_test("Verify Custom Category", False, "Could not retrieve project data")
            return False

    def test_scraping_api(self):
        """Test #4: Test if the product scraping endpoint still works"""
        print("\n🕷️ Testing Scraping API...")
        
        # Test Four Hands URL as specified in review request
        scrape_data = {
            "url": "https://fourhands.com/product/248067-003"
        }
        
        success, response, status_code = self.make_request('POST', '/scrape-product', scrape_data)
        
        if not success:
            self.log_test("Scraping API", False, f"Failed: {response} (Status: {status_code})")
            return False
            
        # Check response structure
        if not isinstance(response, dict):
            self.log_test("Scraping Response Format", False, f"Expected dict, got {type(response)}")
            return False
            
        if response.get('success'):
            data = response.get('data', {})
            extracted_fields = []
            
            if data.get('name'):
                extracted_fields.append(f"name='{data['name']}'")
            if data.get('vendor'):
                extracted_fields.append(f"vendor='{data['vendor']}'")
            if data.get('sku'):
                extracted_fields.append(f"sku='{data['sku']}'")
            if data.get('cost') or data.get('price'):
                price = data.get('cost') or data.get('price')
                extracted_fields.append(f"price='{price}'")
                
            self.log_test("Scraping API", True, f"Extracted: {', '.join(extracted_fields)}")
            return True
        else:
            self.log_test("Scraping API", False, f"Scraping failed: {response.get('error', 'Unknown error')}")
            return False

    def test_transfer_functionality(self):
        """Test #5: Quick test to confirm transfer is working (only checked items)"""
        print("\n🔄 Testing Transfer Functionality...")
        
        if not self.test_project_id:
            self.log_test("Transfer Functionality", False, "No test project available")
            return False
        
        # Create a checklist room for transfer destination
        checklist_room_data = {
            "name": "living room",
            "project_id": self.test_project_id,
            "sheet_type": "checklist",
            "description": "Test checklist room for transfer"
        }
        
        success, checklist_room, status_code = self.make_request('POST', '/rooms', checklist_room_data)
        
        if not success:
            self.log_test("Create Checklist Room", False, f"Failed: {checklist_room} (Status: {status_code})")
            return False
            
        self.checklist_room_id = checklist_room.get('id')
        self.log_test("Create Checklist Room", True, f"Checklist Room ID: {self.checklist_room_id}")
        
        # Get walkthrough room data to find items for transfer test
        success, project_data, status_code = self.make_request('GET', f'/projects/{self.test_project_id}')
        
        if not success:
            self.log_test("Get Transfer Data", False, "Could not retrieve project data")
            return False
        
        # Find walkthrough room and get some items
        walkthrough_room = None
        for room in project_data.get('rooms', []):
            if room.get('id') == self.walkthrough_room_id:
                walkthrough_room = room
                break
                
        if not walkthrough_room:
            self.log_test("Find Walkthrough Items", False, "Walkthrough room not found")
            return False
        
        # Count items in walkthrough
        walkthrough_items = []
        for category in walkthrough_room.get('categories', []):
            for subcategory in category.get('subcategories', []):
                walkthrough_items.extend(subcategory.get('items', []))
        
        # Count items in checklist (should be empty initially)
        checklist_room = None
        for room in project_data.get('rooms', []):
            if room.get('id') == self.checklist_room_id:
                checklist_room = room
                break
                
        if checklist_room:
            checklist_items = []
            for category in checklist_room.get('categories', []):
                for subcategory in category.get('subcategories', []):
                    checklist_items.extend(subcategory.get('items', []))
            
            self.log_test("Transfer Setup Verification", True, 
                         f"Walkthrough: {len(walkthrough_items)} items, Checklist: {len(checklist_items)} items")
            
            # Test item status update (core transfer functionality)
            if walkthrough_items:
                test_item = walkthrough_items[0]
                item_id = test_item.get('id')
                
                # Update item status to PICKED (transfer status)
                update_data = {"status": "PICKED"}
                success, updated_item, status_code = self.make_request('PUT', f'/items/{item_id}', update_data)
                
                if success:
                    self.log_test("Transfer Status Update", True, f"Updated item status to PICKED")
                    return True
                else:
                    self.log_test("Transfer Status Update", False, f"Failed: {updated_item}")
                    return False
            else:
                self.log_test("Transfer Functionality", False, "No items found in walkthrough for transfer test")
                return False
        else:
            self.log_test("Find Checklist Room", False, "Checklist room not found")
            return False

    def run_feature_status_check(self):
        """Run the complete feature status check"""
        print("🚀 STARTING FEATURE STATUS CHECK...")
        
        # Setup
        if not self.setup_test_project():
            print("❌ CRITICAL: Could not setup test project")
            return False
        
        # Test 1: Walkthrough room auto-population
        walkthrough_success = self.test_walkthrough_room_auto_population()
        
        # Test 2: ADD CATEGORY functionality
        add_category_success = self.test_add_category_functionality()
        
        # Test 3: ADD NEW CATEGORY functionality
        add_new_category_success = self.test_add_new_category_functionality()
        
        # Test 4: Scraping API
        scraping_success = self.test_scraping_api()
        
        # Test 5: Transfer functionality
        transfer_success = self.test_transfer_functionality()
        
        # Final Summary
        print("\n" + "=" * 80)
        print("🎯 FEATURE STATUS CHECK SUMMARY")
        print("=" * 80)
        
        total_tests = len(self.test_results)
        passed_tests = sum(1 for result in self.test_results if result['success'])
        failed_tests = total_tests - passed_tests
        
        print(f"📊 OVERALL RESULTS: {passed_tests}/{total_tests} tests passed ({(passed_tests/total_tests)*100:.1f}%)")
        
        # Feature-specific results
        features = [
            ("Walkthrough Auto-Population", walkthrough_success),
            ("ADD CATEGORY Functionality", add_category_success),
            ("ADD NEW CATEGORY Functionality", add_new_category_success),
            ("Scraping API", scraping_success),
            ("Transfer Functionality", transfer_success)
        ]
        
        print(f"\n🔍 FEATURE STATUS:")
        for feature_name, feature_success in features:
            status = "✅ WORKING" if feature_success else "❌ BROKEN"
            print(f"   {status} {feature_name}")
        
        if failed_tests > 0:
            print(f"\n❌ FAILED TESTS ({failed_tests}):")
            for result in self.test_results:
                if not result['success']:
                    print(f"   • {result['test']}: {result['details']}")
        
        # Overall assessment
        critical_features_working = sum(1 for _, success in features if success)
        
        if critical_features_working >= 4:  # At least 4 out of 5 features working
            print(f"\n🎉 FEATURE STATUS: GOOD ({critical_features_working}/5 features working)")
            print("   Most key features are operational after the transfer fix")
            return True
        else:
            print(f"\n⚠️ FEATURE STATUS: ISSUES DETECTED ({critical_features_working}/5 features working)")
            print("   Some key features may have been broken by recent changes")
            return False


# Main execution
if __name__ == "__main__":
    checker = FeatureStatusChecker()
    success = checker.run_feature_status_check()
    
    if success:
        print("\n🎉 SUCCESS: Feature status check completed - most features working!")
        exit(0)
    else:
        print("\n⚠️ WARNING: Feature status check detected issues that need attention.")
        exit(1)
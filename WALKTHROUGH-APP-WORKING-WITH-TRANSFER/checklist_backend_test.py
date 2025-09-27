#!/usr/bin/env python3
"""
Checklist Backend API Testing Suite - ENHANCED CHECKLIST FUNCTIONALITY
Tests all checklist functionality including status management, Canva scraping, and project data loading.
FOCUS: Testing enhanced checklist functionality as requested in review
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
CHECKLIST_PROJECT_ID = "5cccfb11-0ac0-45ed-91ab-a56088d65b5a"

print(f"Testing Checklist Backend APIs at: {BASE_URL}")
print(f"Using Checklist Project ID: {CHECKLIST_PROJECT_ID}")

class ChecklistAPITester:
    def __init__(self):
        self.session = requests.Session()
        self.test_results = []
        self.created_items = []
        
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
                response = self.session.get(url, params=params)
            elif method.upper() == 'POST':
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

    def test_checklist_project_loading(self):
        """Test project 5cccfb11-0ac0-45ed-91ab-a56088d65b5a loads correctly"""
        print("\n=== Testing Checklist Project Data Loading ===")
        
        success, data, status_code = self.make_request('GET', f'/projects/{CHECKLIST_PROJECT_ID}')
        
        if not success:
            self.log_test("Load Checklist Project", False, f"Failed to retrieve project: {data} (Status: {status_code})")
            return False
            
        # Verify project structure
        required_fields = ['id', 'name', 'client_info', 'rooms']
        missing_fields = [field for field in required_fields if field not in data]
        
        if missing_fields:
            self.log_test("Checklist Project Structure", False, f"Missing required fields: {missing_fields}")
            return False
        else:
            self.log_test("Checklist Project Structure", True, "All required fields present")
            
        # Analyze project data
        rooms = data.get('rooms', [])
        if not rooms:
            self.log_test("Checklist Project Rooms", False, "No rooms found in checklist project")
            return False
            
        # Count items and analyze structure
        total_items = 0
        total_categories = 0
        total_subcategories = 0
        room_details = []
        
        for room in rooms:
            room_name = room.get('name', 'Unknown')
            categories = room.get('categories', [])
            total_categories += len(categories)
            
            room_items = 0
            for category in categories:
                subcategories = category.get('subcategories', [])
                total_subcategories += len(subcategories)
                
                for subcategory in subcategories:
                    items = subcategory.get('items', [])
                    room_items += len(items)
                    total_items += len(items)
            
            room_details.append(f"{room_name} ({room_items} items)")
        
        self.log_test("Checklist Project Data", True, 
                     f"Project loaded: {len(rooms)} rooms, {total_categories} categories, {total_subcategories} subcategories, {total_items} items")
        
        if room_details:
            self.log_test("Checklist Room Details", True, f"Rooms: {', '.join(room_details)}")
        
        return True

    def test_status_management(self):
        """Test that new items start with blank status and all 9 checklist statuses are available"""
        print("\n=== Testing Status Management ===")
        
        # Test 1: Check enhanced item statuses endpoint returns all 9 checklist statuses
        success, response_data, status_code = self.make_request('GET', '/item-statuses-enhanced')
        
        if not success:
            self.log_test("Get Enhanced Item Statuses", False, f"Failed to retrieve statuses: {response_data} (Status: {status_code})")
            return False
            
        if not isinstance(response_data, dict) or 'data' not in response_data:
            self.log_test("Enhanced Statuses Response Format", False, f"Invalid response format: {response_data}")
            return False
            
        statuses_data = response_data['data']
        if not isinstance(statuses_data, list):
            self.log_test("Enhanced Statuses Data Format", False, f"Expected list, got: {type(statuses_data)}")
            return False
            
        # Check for all 9 checklist statuses
        expected_checklist_statuses = [
            'PICKED', 'ORDER SAMPLES', 'SAMPLES ARRIVED', 'ASK NEIL', 
            'ASK CHARLENE', 'ASK JALA', 'GET QUOTE', 'WAITING ON QT', 
            'READY FOR PRESENTATION'
        ]
        
        found_checklist_statuses = []
        status_colors = {}
        
        for status_obj in statuses_data:
            if isinstance(status_obj, dict) and 'status' in status_obj:
                status_name = status_obj['status']
                if status_name in expected_checklist_statuses:
                    found_checklist_statuses.append(status_name)
                    status_colors[status_name] = status_obj.get('color', 'No color')
        
        if len(found_checklist_statuses) == 9:
            self.log_test("All 9 Checklist Statuses Available", True, f"Found all 9 statuses: {found_checklist_statuses}")
        else:
            missing_statuses = [s for s in expected_checklist_statuses if s not in found_checklist_statuses]
            self.log_test("All 9 Checklist Statuses Available", False, f"Missing statuses: {missing_statuses}")
        
        # Verify status colors
        if status_colors:
            color_details = [f"{status}: {color}" for status, color in list(status_colors.items())[:5]]
            self.log_test("Checklist Status Colors", True, f"Sample colors: {color_details}")
        
        # Test 2: Check that BLANK status is first/default
        blank_status_found = False
        for status_obj in statuses_data:
            if isinstance(status_obj, dict) and status_obj.get('status') == '':
                blank_status_found = True
                self.log_test("BLANK Status Available", True, "BLANK status found as default")
                break
        
        if not blank_status_found:
            self.log_test("BLANK Status Available", False, "BLANK status not found in status list")
        
        return True

    def test_canva_scraping_feature(self):
        """Test the new /api/scrape-canva endpoint"""
        print("\n=== Testing Canva Scraping Feature ===")
        
        # Test 1: Check if scrape-canva endpoint exists and accepts parameters
        test_data = {
            "canva_url": "https://www.canva.com/design/sample",
            "item_id": str(uuid.uuid4())
        }
        
        success, response_data, status_code = self.make_request('POST', '/scrape-canva', test_data)
        
        # Log the response details
        print(f"   Canva URL: {test_data['canva_url']}")
        print(f"   Item ID: {test_data['item_id']}")
        print(f"   Status Code: {status_code}")
        print(f"   Success: {success}")
        print(f"   Response: {json.dumps(response_data, indent=2)}")
        
        if status_code == 404:
            self.log_test("Scrape Canva Endpoint Exists", False, "Endpoint /api/scrape-canva not found - needs to be implemented")
            return False
        elif status_code == 405:
            self.log_test("Scrape Canva Endpoint Exists", False, "Method not allowed - endpoint may exist but not accept POST")
            return False
        elif success or status_code in [200, 400]:  # 400 might be validation error which is acceptable
            self.log_test("Scrape Canva Endpoint Exists", True, f"Endpoint accessible (Status: {status_code})")
            
            # Check response format
            if isinstance(response_data, dict):
                if 'success' in response_data or 'error' in response_data or 'message' in response_data:
                    self.log_test("Scrape Canva Response Format", True, "Response has expected structure")
                else:
                    self.log_test("Scrape Canva Response Format", False, f"Unexpected response structure: {response_data}")
            else:
                self.log_test("Scrape Canva Response Format", False, f"Expected dict response, got: {type(response_data)}")
        else:
            self.log_test("Scrape Canva Endpoint Exists", False, f"Endpoint failed: {response_data} (Status: {status_code})")
        
        # Test 2: Test with different Canva URL formats
        test_urls = [
            "https://www.canva.com/design/DAFxxx123/edit",
            "https://canva.com/design/sample-design",
            "https://www.canva.com/design/test"
        ]
        
        for test_url in test_urls:
            test_data_url = {
                "canva_url": test_url,
                "item_id": str(uuid.uuid4())
            }
            
            success, response_data, status_code = self.make_request('POST', '/scrape-canva', test_data_url)
            
            if status_code != 404:  # If endpoint exists
                if success or status_code in [200, 400]:
                    self.log_test(f"Scrape Canva URL Format Test", True, f"Accepts URL format: {test_url}")
                else:
                    self.log_test(f"Scrape Canva URL Format Test", False, f"Rejected URL: {test_url} (Status: {status_code})")
                break  # Only test one URL if endpoint exists
        
        return True

    def test_enhanced_item_status_api(self):
        """Test item status updates work with new checklist statuses"""
        print("\n=== Testing Enhanced Item Status API ===")
        
        # First, get the checklist project to find an item to update
        success, project_data, _ = self.make_request('GET', f'/projects/{CHECKLIST_PROJECT_ID}')
        if not success:
            self.log_test("Get Project for Status Update", False, "Could not retrieve checklist project")
            return False
            
        # Find an item to test status updates
        test_item_id = None
        original_status = None
        
        for room in project_data.get('rooms', []):
            for category in room.get('categories', []):
                for subcategory in category.get('subcategories', []):
                    items = subcategory.get('items', [])
                    if items:
                        test_item_id = items[0]['id']
                        original_status = items[0].get('status', '')
                        break
                if test_item_id:
                    break
            if test_item_id:
                break
        
        if not test_item_id:
            self.log_test("Find Item for Status Update", False, "No items found in checklist project")
            return False
            
        self.log_test("Find Item for Status Update", True, f"Found item {test_item_id} with status '{original_status}'")
        
        # Test updating item with checklist statuses
        checklist_statuses_to_test = ['ORDER SAMPLES', 'ASK NEIL', 'GET QUOTE', 'READY FOR PRESENTATION']
        
        for status in checklist_statuses_to_test:
            update_data = {"status": status}
            success, response_data, status_code = self.make_request('PUT', f'/items/{test_item_id}', update_data)
            
            if success:
                updated_status = response_data.get('status')
                if updated_status == status:
                    self.log_test(f"Update Item Status to {status}", True, f"Successfully updated to {status}")
                else:
                    self.log_test(f"Update Item Status to {status}", False, f"Expected {status}, got {updated_status}")
            else:
                self.log_test(f"Update Item Status to {status}", False, f"Failed to update: {response_data}")
        
        # Restore original status
        if original_status is not None:
            restore_data = {"status": original_status}
            self.make_request('PUT', f'/items/{test_item_id}', restore_data)
        
        return True

    def test_status_breakdown_calculation(self):
        """Test status breakdown calculation for checklist project"""
        print("\n=== Testing Status Breakdown Calculation ===")
        
        # Get the checklist project data
        success, project_data, _ = self.make_request('GET', f'/projects/{CHECKLIST_PROJECT_ID}')
        if not success:
            self.log_test("Get Project for Status Breakdown", False, "Could not retrieve checklist project")
            return False
        
        # Calculate status breakdown manually
        status_counts = {}
        total_items = 0
        
        for room in project_data.get('rooms', []):
            for category in room.get('categories', []):
                for subcategory in category.get('subcategories', []):
                    for item in subcategory.get('items', []):
                        total_items += 1
                        status = item.get('status', '') or 'BLANK'
                        status_counts[status] = status_counts.get(status, 0) + 1
        
        if total_items == 0:
            self.log_test("Status Breakdown - Items Found", False, "No items found for status breakdown")
            return False
            
        self.log_test("Status Breakdown - Items Found", True, f"Found {total_items} items for analysis")
        
        # Show status distribution
        status_details = []
        for status, count in status_counts.items():
            percentage = (count / total_items) * 100
            status_details.append(f"{status}: {count} ({percentage:.1f}%)")
        
        self.log_test("Status Breakdown Distribution", True, f"Status distribution: {'; '.join(status_details[:5])}")
        
        # Check if BLANK is the most common status (as requested - new items should start blank)
        blank_count = status_counts.get('BLANK', 0) + status_counts.get('', 0)
        picked_count = status_counts.get('PICKED', 0)
        
        if blank_count > picked_count:
            self.log_test("Status Defaults to BLANK", True, f"More BLANK ({blank_count}) than PICKED ({picked_count}) statuses")
        else:
            self.log_test("Status Defaults to BLANK", False, f"More PICKED ({picked_count}) than BLANK ({blank_count}) statuses")
        
        return True

    def test_checklist_status_overview_integration(self):
        """Test that ChecklistStatusOverview shows BLANK as first status"""
        print("\n=== Testing ChecklistStatusOverview Integration ===")
        
        # This is primarily a frontend test, but we can verify the backend provides the right data
        # Test that the enhanced statuses endpoint provides data in the right format for ChecklistStatusOverview
        
        success, response_data, status_code = self.make_request('GET', '/item-statuses-enhanced')
        
        if not success:
            self.log_test("ChecklistStatusOverview Data Source", False, f"Enhanced statuses endpoint failed: {response_data}")
            return False
        
        statuses_data = response_data.get('data', [])
        
        # Check that BLANK status is available (should be first in ChecklistStatusOverview)
        blank_status_obj = None
        for status_obj in statuses_data:
            if isinstance(status_obj, dict) and status_obj.get('status') == '':
                blank_status_obj = status_obj
                break
        
        if blank_status_obj:
            self.log_test("BLANK Status for ChecklistStatusOverview", True, f"BLANK status available with color: {blank_status_obj.get('color', 'No color')}")
        else:
            self.log_test("BLANK Status for ChecklistStatusOverview", False, "BLANK status not found in enhanced statuses")
        
        # Check that all 9 checklist statuses have colors (needed for pie chart)
        checklist_statuses = ['PICKED', 'ORDER SAMPLES', 'SAMPLES ARRIVED', 'ASK NEIL', 'ASK CHARLENE', 'ASK JALA', 'GET QUOTE', 'WAITING ON QT', 'READY FOR PRESENTATION']
        
        statuses_with_colors = 0
        for status_obj in statuses_data:
            if isinstance(status_obj, dict) and status_obj.get('status') in checklist_statuses and status_obj.get('color'):
                statuses_with_colors += 1
        
        if statuses_with_colors == 9:
            self.log_test("Checklist Statuses Have Colors", True, f"All 9 checklist statuses have colors for pie chart")
        else:
            self.log_test("Checklist Statuses Have Colors", False, f"Only {statuses_with_colors}/9 checklist statuses have colors")
        
        return True

    def cleanup_test_data(self):
        """Clean up any test data created"""
        print("\n=== Cleaning Up Test Data ===")
        
        # Delete any test items created
        for item_id in self.created_items:
            success, _, _ = self.make_request('DELETE', f'/items/{item_id}')
            if success:
                print(f"   Deleted test item: {item_id}")
            else:
                print(f"   Failed to delete test item: {item_id}")

    def run_all_tests(self):
        """Run all checklist backend tests"""
        print("🚀 Starting Checklist Backend API Tests - ENHANCED CHECKLIST FUNCTIONALITY")
        print("=" * 70)
        
        # Run tests in logical order based on review request
        self.test_checklist_project_loading()        # Test project 5cccfb11-0ac0-45ed-91ab-a56088d65b5a loads correctly
        self.test_status_management()                # Test all 9 checklist statuses are available and BLANK is default
        self.test_canva_scraping_feature()           # Test new /api/scrape-canva endpoint
        self.test_enhanced_item_status_api()         # Test item status updates work with checklist statuses
        self.test_status_breakdown_calculation()     # Test status breakdown calculation
        self.test_checklist_status_overview_integration()  # Test ChecklistStatusOverview integration
        
        # Clean up
        self.cleanup_test_data()
        
        # Summary
        print("\n" + "=" * 50)
        print("📊 CHECKLIST TEST SUMMARY")
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
            print("\n❌ FAILED TESTS:")
            for test in failed_tests:
                print(f"   • {test['test']}: {test['details']}")
        else:
            print("\n🎉 ALL CHECKLIST TESTS PASSED!")
            
        return passed == total

if __name__ == "__main__":
    tester = ChecklistAPITester()
    success = tester.run_all_tests()
    sys.exit(0 if success else 1)
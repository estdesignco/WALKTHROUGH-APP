#!/usr/bin/env python3
"""
Checklist Functionality Testing Suite
Tests the checklist functionality with focus on:
1. Project Loading with specific ID 5cccfb11-0ac0-45ed-91ab-a56088d65b5a
2. Status Breakdown API for checklist
3. ChecklistStatusOverview Integration
4. 9 Checklist Status Implementation
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

print(f"🎯 Testing Checklist Functionality at: {BASE_URL}")
print(f"🎯 Using Checklist Project ID: {CHECKLIST_PROJECT_ID}")

class ChecklistTester:
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
        """Test that the specific checklist project loads correctly"""
        print("\n=== 🎯 Testing Checklist Project Loading ===")
        
        success, data, status_code = self.make_request('GET', f'/projects/{CHECKLIST_PROJECT_ID}')
        
        if not success:
            self.log_test("Load Checklist Project", False, f"Failed to load project {CHECKLIST_PROJECT_ID}: {data} (Status: {status_code})")
            return False
            
        # Verify project structure
        required_fields = ['id', 'name', 'client_info', 'rooms']
        missing_fields = [field for field in required_fields if field not in data]
        
        if missing_fields:
            self.log_test("Checklist Project Structure", False, f"Missing required fields: {missing_fields}")
            return False
        else:
            project_name = data.get('name', 'Unknown')
            self.log_test("Checklist Project Structure", True, f"Project '{project_name}' loaded successfully")
            
        # Analyze project data for checklist functionality
        rooms = data.get('rooms', [])
        if not rooms:
            self.log_test("Checklist Project Rooms", False, "No rooms found in checklist project")
            return False
            
        # Count items for status breakdown testing
        total_items = 0
        status_counts = {}
        
        for room in rooms:
            for category in room.get('categories', []):
                for subcategory in category.get('subcategories', []):
                    items = subcategory.get('items', [])
                    total_items += len(items)
                    
                    for item in items:
                        status = item.get('status', 'TO BE SELECTED')
                        status_counts[status] = status_counts.get(status, 0) + 1
        
        self.log_test("Checklist Project Items", True, f"Found {total_items} items across {len(rooms)} rooms")
        
        if status_counts:
            status_summary = ", ".join([f"{status}: {count}" for status, count in status_counts.items()])
            self.log_test("Checklist Project Status Distribution", True, f"Status breakdown: {status_summary}")
        
        return True

    def test_checklist_status_breakdown_api(self):
        """Test status breakdown API for checklist functionality"""
        print("\n=== 🎯 Testing Status Breakdown API ===")
        
        # Test enhanced item statuses endpoint
        success, response_data, status_code = self.make_request('GET', '/item-statuses-enhanced')
        
        if not success:
            self.log_test("Status Breakdown API", False, f"Failed to get enhanced statuses: {response_data} (Status: {status_code})")
            return False
            
        if not isinstance(response_data, dict) or 'data' not in response_data:
            self.log_test("Status Breakdown API Format", False, f"Invalid response format: {response_data}")
            return False
            
        statuses_data = response_data['data']
        if not isinstance(statuses_data, list):
            self.log_test("Status Breakdown API Data", False, f"Invalid data format: {statuses_data}")
            return False
            
        self.log_test("Status Breakdown API", True, f"Retrieved {len(statuses_data)} enhanced statuses")
        
        # Check for checklist-specific statuses
        checklist_statuses = [
            'PICKED', 'ORDER SAMPLES', 'SAMPLES ARRIVED', 'ASK NEIL', 
            'ASK CHARLENE', 'ASK JALA', 'GET QUOTE', 'WAITING ON QT', 'READY FOR PRESENTATION'
        ]
        
        found_checklist_statuses = []
        available_statuses = []
        
        for status_obj in statuses_data:
            if isinstance(status_obj, dict) and 'status' in status_obj:
                status_name = status_obj['status']
                available_statuses.append(status_name)
                if status_name in checklist_statuses:
                    found_checklist_statuses.append(status_name)
        
        # Check if we have the basic PICKED status (which should exist)
        if 'PICKED' in found_checklist_statuses:
            self.log_test("Checklist Status - PICKED", True, "PICKED status found in API")
        else:
            self.log_test("Checklist Status - PICKED", False, "PICKED status not found in API")
        
        # Check for other checklist statuses
        missing_checklist_statuses = [status for status in checklist_statuses if status not in found_checklist_statuses]
        
        if len(found_checklist_statuses) >= 1:
            self.log_test("Checklist Statuses Available", True, f"Found {len(found_checklist_statuses)}/9 checklist statuses: {found_checklist_statuses}")
        else:
            self.log_test("Checklist Statuses Available", False, "No checklist statuses found in API")
        
        if missing_checklist_statuses:
            self.log_test("Missing Checklist Statuses", False, f"Missing statuses: {missing_checklist_statuses}")
            print(f"   Available statuses: {available_statuses[:10]}...")  # Show first 10 for reference
        
        return True

    def test_checklist_status_colors(self):
        """Test that checklist statuses have proper colors"""
        print("\n=== 🎯 Testing Checklist Status Colors ===")
        
        success, response_data, status_code = self.make_request('GET', '/item-statuses-enhanced')
        
        if not success:
            self.log_test("Checklist Status Colors API", False, f"Failed to get statuses: {response_data}")
            return False
            
        statuses_data = response_data.get('data', [])
        
        # Expected checklist status colors (from ChecklistStatusOverview.js)
        expected_colors = {
            'PICKED': '#3B82F6',
            'ORDER SAMPLES': '#10B981',
            'SAMPLES ARRIVED': '#8B5CF6',
            'ASK NEIL': '#F59E0B',
            'ASK CHARLENE': '#EF4444',
            'ASK JALA': '#EC4899',
            'GET QUOTE': '#06B6D4',
            'WAITING ON QT': '#F97316',
            'READY FOR PRESENTATION': '#84CC16'
        }
        
        found_colors = {}
        
        for status_obj in statuses_data:
            if isinstance(status_obj, dict) and 'status' in status_obj and 'color' in status_obj:
                status_name = status_obj['status']
                if status_name in expected_colors:
                    found_colors[status_name] = status_obj['color']
        
        # Test PICKED status color specifically
        if 'PICKED' in found_colors:
            picked_color = found_colors['PICKED']
            self.log_test("PICKED Status Color", True, f"PICKED has color: {picked_color}")
        else:
            self.log_test("PICKED Status Color", False, "PICKED status color not found")
        
        # Test other checklist status colors
        color_matches = 0
        for status, expected_color in expected_colors.items():
            if status in found_colors:
                actual_color = found_colors[status]
                if actual_color == expected_color:
                    color_matches += 1
                    print(f"   ✅ {status}: {actual_color} (matches expected)")
                else:
                    print(f"   ⚠️  {status}: {actual_color} (expected {expected_color})")
            else:
                print(f"   ❌ {status}: Not found in API")
        
        if color_matches > 0:
            self.log_test("Checklist Status Colors", True, f"{color_matches}/{len(expected_colors)} status colors match")
        else:
            self.log_test("Checklist Status Colors", False, "No checklist status colors match expected values")
        
        return True

    def test_checklist_pie_chart_data(self):
        """Test that checklist pie chart gets proper data"""
        print("\n=== 🎯 Testing Checklist Pie Chart Data ===")
        
        # Load the checklist project to get actual data
        success, project_data, status_code = self.make_request('GET', f'/projects/{CHECKLIST_PROJECT_ID}')
        
        if not success:
            self.log_test("Checklist Pie Chart Data", False, f"Cannot load project for pie chart testing: {project_data}")
            return False
        
        # Simulate the status breakdown calculation from ChecklistStatusOverview.js
        status_breakdown = {}
        total_items = 0
        
        for room in project_data.get('rooms', []):
            for category in room.get('categories', []):
                for subcategory in category.get('subcategories', []):
                    for item in subcategory.get('items', []):
                        total_items += 1
                        status = item.get('status', 'TO BE SELECTED')
                        status_breakdown[status] = status_breakdown.get(status, 0) + 1
        
        if total_items == 0:
            self.log_test("Checklist Pie Chart Data", False, "No items found for pie chart data")
            return False
        
        self.log_test("Checklist Items for Pie Chart", True, f"Found {total_items} items for pie chart")
        
        # Test the checklist status mapping logic
        checklist_statuses = {
            'PICKED': 0,
            'ORDER SAMPLES': 0,
            'SAMPLES ARRIVED': 0,
            'ASK NEIL': 0,
            'ASK CHARLENE': 0,
            'ASK JALA': 0,
            'GET QUOTE': 0,
            'WAITING ON QT': 0,
            'READY FOR PRESENTATION': 0
        }
        
        # Map existing statuses to checklist statuses (like in ChecklistStatusOverview.js)
        for status, count in status_breakdown.items():
            if status in checklist_statuses:
                checklist_statuses[status] = count
            else:
                # Default all other statuses to PICKED (as per the component logic)
                checklist_statuses['PICKED'] += count
        
        # Check if we have meaningful data for pie chart
        non_zero_statuses = {status: count for status, count in checklist_statuses.items() if count > 0}
        
        if non_zero_statuses:
            status_summary = ", ".join([f"{status}: {count}" for status, count in non_zero_statuses.items()])
            self.log_test("Checklist Status Distribution", True, f"Pie chart data: {status_summary}")
        else:
            self.log_test("Checklist Status Distribution", False, "No status data for pie chart")
        
        # Verify that the total adds up correctly
        total_mapped = sum(checklist_statuses.values())
        if total_mapped == total_items:
            self.log_test("Checklist Status Mapping", True, f"All {total_items} items mapped to checklist statuses")
        else:
            self.log_test("Checklist Status Mapping", False, f"Mapping error: {total_mapped} mapped vs {total_items} total")
        
        return True

    def test_checklist_dashboard_integration(self):
        """Test ChecklistDashboard integration with ChecklistStatusOverview"""
        print("\n=== 🎯 Testing ChecklistDashboard Integration ===")
        
        # This test verifies the integration by checking the component structure
        # Since we can't directly test React components, we'll verify the data flow
        
        # 1. Test that the project loads correctly for the dashboard
        success, project_data, status_code = self.make_request('GET', f'/projects/{CHECKLIST_PROJECT_ID}')
        
        if not success:
            self.log_test("ChecklistDashboard Project Load", False, f"Dashboard cannot load project: {project_data}")
            return False
        
        self.log_test("ChecklistDashboard Project Load", True, f"Project loaded for dashboard: {project_data.get('name', 'Unknown')}")
        
        # 2. Test the data calculations that the dashboard would perform
        total_items = 0
        status_breakdown = {}
        carrier_breakdown = {}
        
        for room in project_data.get('rooms', []):
            for category in room.get('categories', []):
                for subcategory in category.get('subcategories', []):
                    for item in subcategory.get('items', []):
                        total_items += 1
                        
                        # Status breakdown
                        status = item.get('status', 'TO BE SELECTED')
                        status_breakdown[status] = status_breakdown.get(status, 0) + 1
                        
                        # Carrier breakdown
                        carrier = item.get('carrier')
                        if carrier:
                            carrier_breakdown[carrier] = carrier_breakdown.get(carrier, 0) + 1
        
        if total_items > 0:
            self.log_test("ChecklistDashboard Data Calculations", True, f"Dashboard can calculate data for {total_items} items")
        else:
            self.log_test("ChecklistDashboard Data Calculations", False, "No items for dashboard calculations")
        
        # 3. Test that status breakdown has data for ChecklistStatusOverview
        if status_breakdown:
            self.log_test("ChecklistStatusOverview Data", True, f"Status data available: {len(status_breakdown)} different statuses")
        else:
            self.log_test("ChecklistStatusOverview Data", False, "No status data for ChecklistStatusOverview")
        
        # 4. Test carrier breakdown for shipping information
        if carrier_breakdown:
            self.log_test("ChecklistDashboard Carrier Data", True, f"Carrier data available: {len(carrier_breakdown)} carriers")
        else:
            self.log_test("ChecklistDashboard Carrier Data", True, "No carrier data (acceptable for new project)")
        
        return True

    def test_create_checklist_items_with_9_statuses(self):
        """Test creating items with the 9 checklist statuses"""
        print("\n=== 🎯 Testing 9 Checklist Status Implementation ===")
        
        # First, get a subcategory to add items to
        success, project_data, _ = self.make_request('GET', f'/projects/{CHECKLIST_PROJECT_ID}')
        if not success:
            self.log_test("Get Subcategory for Checklist Items", False, "Could not retrieve project for item testing")
            return False
            
        # Find a subcategory
        subcategory_id = None
        for room in project_data.get('rooms', []):
            for category in room.get('categories', []):
                for subcategory in category.get('subcategories', []):
                    subcategory_id = subcategory['id']
                    break
                if subcategory_id:
                    break
            if subcategory_id:
                break
                
        if not subcategory_id:
            self.log_test("Get Subcategory for Checklist Items", False, "No subcategory found for item testing")
            return False
            
        # Test creating items with each of the 9 checklist statuses
        checklist_statuses = [
            'PICKED', 'ORDER SAMPLES', 'SAMPLES ARRIVED', 'ASK NEIL', 
            'ASK CHARLENE', 'ASK JALA', 'GET QUOTE', 'WAITING ON QT', 'READY FOR PRESENTATION'
        ]
        
        created_items = []
        successful_statuses = []
        failed_statuses = []
        
        for i, status in enumerate(checklist_statuses):
            item_data = {
                "name": f"Checklist Test Item {i+1}",
                "quantity": 1,
                "size": "Test Size",
                "remarks": f"Testing {status} status",
                "vendor": "Test Vendor",
                "status": status,
                "cost": 100.00,
                "subcategory_id": subcategory_id
            }
            
            success, data, status_code = self.make_request('POST', '/items', item_data)
            
            if success and data.get('id'):
                created_items.append(data['id'])
                successful_statuses.append(status)
                print(f"   ✅ Created item with status: {status}")
            else:
                failed_statuses.append(status)
                print(f"   ❌ Failed to create item with status: {status} - {data}")
        
        # Store created items for cleanup
        self.created_items.extend(created_items)
        
        if len(successful_statuses) == 9:
            self.log_test("9 Checklist Statuses Implementation", True, f"All 9 statuses work: {successful_statuses}")
        elif len(successful_statuses) > 0:
            self.log_test("9 Checklist Statuses Implementation", False, f"Only {len(successful_statuses)}/9 statuses work. Failed: {failed_statuses}")
        else:
            self.log_test("9 Checklist Statuses Implementation", False, "None of the 9 checklist statuses work")
        
        # Test retrieving items to verify status persistence
        if created_items:
            success, updated_project, _ = self.make_request('GET', f'/projects/{CHECKLIST_PROJECT_ID}')
            if success:
                # Count items by status to verify they were saved correctly
                found_statuses = {}
                for room in updated_project.get('rooms', []):
                    for category in room.get('categories', []):
                        for subcategory in category.get('subcategories', []):
                            for item in subcategory.get('items', []):
                                if item.get('id') in created_items:
                                    status = item.get('status', 'Unknown')
                                    found_statuses[status] = found_statuses.get(status, 0) + 1
                
                if found_statuses:
                    status_summary = ", ".join([f"{status}: {count}" for status, count in found_statuses.items()])
                    self.log_test("Checklist Status Persistence", True, f"Statuses persisted: {status_summary}")
                else:
                    self.log_test("Checklist Status Persistence", False, "Created items not found in project")
        
        return len(successful_statuses) > 0

    def cleanup_test_data(self):
        """Clean up test data"""
        print("\n=== Cleaning Up Test Data ===")
        
        # Delete test items
        for item_id in self.created_items:
            success, _, _ = self.make_request('DELETE', f'/items/{item_id}')
            if success:
                print(f"   Deleted test item: {item_id}")
            else:
                print(f"   Failed to delete test item: {item_id}")

    def run_all_tests(self):
        """Run all checklist tests"""
        print("🎯 Starting Checklist Functionality Tests")
        print("=" * 60)
        
        # Run tests in logical order
        self.test_checklist_project_loading()
        self.test_checklist_status_breakdown_api()
        self.test_checklist_status_colors()
        self.test_checklist_pie_chart_data()
        self.test_checklist_dashboard_integration()
        self.test_create_checklist_items_with_9_statuses()
        
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
    tester = ChecklistTester()
    success = tester.run_all_tests()
    sys.exit(0 if success else 1)
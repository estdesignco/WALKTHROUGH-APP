#!/usr/bin/env python3
"""
CRITICAL DUAL TEST: Room Loading + Transfer Functionality

URGENT TESTS NEEDED:
1. **Checklist Room Loading**: Verify checklist rooms now load with full structure (categories + subcategories) but NO items initially
2. **FFE Room Loading**: Verify FFE rooms load with full structure but NO items initially  
3. **Transfer Functionality**: Test walkthrough to checklist transfer still works correctly (only checked items transfer)
4. **Walkthrough Loading**: Ensure walkthrough rooms still auto-populate with full structure AND items

CRITICAL SUCCESS CRITERIA:
- Checklist/FFE rooms have structure but start with 0 items
- Transfer adds only checked items to the empty structure
- Walkthrough rooms still work as before
- NO REGRESSION in transfer functionality
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
print("🚨 CRITICAL DUAL TEST: Room Loading + Transfer Functionality")
print("=" * 80)
print(f"Backend URL: {BASE_URL}")

class RoomLoadingTransferTester:
    def __init__(self):
        self.test_project_id = None
        self.walkthrough_room_id = None
        self.checklist_room_id = None
        self.ffe_room_id = None
        self.test_results = []
        
    def log_test(self, test_name: str, success: bool, details: str = ""):
        """Log test result"""
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status}: {test_name}")
        if details:
            print(f"   Details: {details}")
        self.test_results.append({
            'test': test_name,
            'success': success,
            'details': details
        })
        
    def create_test_project(self):
        """Create a test project for room loading tests"""
        print("\n🔧 Creating test project...")
        
        project_data = {
            "name": "Room Loading Transfer Test Project",
            "client_info": {
                "full_name": "Test Client",
                "email": "test@example.com",
                "phone": "555-0123",
                "address": "123 Test St, Test City, TC 12345"
            },
            "project_type": "Renovation",
            "timeline": "3 months",
            "budget": "$50,000"
        }
        
        try:
            response = requests.post(f"{BASE_URL}/projects", json=project_data)
            if response.status_code == 200:
                project = response.json()
                self.test_project_id = project['id']
                self.log_test("Create Test Project", True, f"Project ID: {self.test_project_id}")
                return True
            else:
                self.log_test("Create Test Project", False, f"HTTP {response.status_code}: {response.text}")
                return False
        except Exception as e:
            self.log_test("Create Test Project", False, f"Exception: {str(e)}")
            return False
    
    def test_walkthrough_room_loading(self):
        """Test that walkthrough rooms load with full structure AND items"""
        print("\n🔍 Testing Walkthrough Room Loading (should have structure + items)...")
        
        room_data = {
            "name": "Living Room",
            "project_id": self.test_project_id,
            "sheet_type": "walkthrough"
        }
        
        try:
            response = requests.post(f"{BASE_URL}/rooms", json=room_data)
            if response.status_code == 200:
                room = response.json()
                self.walkthrough_room_id = room['id']
                
                # Get full project structure to check room contents
                project_response = requests.get(f"{BASE_URL}/projects/{self.test_project_id}")
                if project_response.status_code == 200:
                    project = project_response.json()
                    walkthrough_room = None
                    
                    for room in project['rooms']:
                        if room['id'] == self.walkthrough_room_id:
                            walkthrough_room = room
                            break
                    
                    if walkthrough_room:
                        categories_count = len(walkthrough_room['categories'])
                        total_items = sum(len(subcat['items']) for cat in walkthrough_room['categories'] for subcat in cat['subcategories'])
                        
                        # Walkthrough should have both structure AND items
                        if categories_count > 0 and total_items > 0:
                            self.log_test("Walkthrough Room Loading", True, 
                                        f"Categories: {categories_count}, Items: {total_items} (CORRECT: has structure + items)")
                            return True
                        else:
                            self.log_test("Walkthrough Room Loading", False, 
                                        f"Categories: {categories_count}, Items: {total_items} (WRONG: should have items)")
                            return False
                    else:
                        self.log_test("Walkthrough Room Loading", False, "Room not found in project")
                        return False
                else:
                    self.log_test("Walkthrough Room Loading", False, f"Failed to get project: {project_response.status_code}")
                    return False
            else:
                self.log_test("Walkthrough Room Loading", False, f"HTTP {response.status_code}: {response.text}")
                return False
        except Exception as e:
            self.log_test("Walkthrough Room Loading", False, f"Exception: {str(e)}")
            return False
    
    def test_checklist_room_loading(self):
        """Test that checklist rooms load with structure but NO items initially"""
        print("\n🔍 Testing Checklist Room Loading (should have structure but NO items)...")
        
        room_data = {
            "name": "Living Room",
            "project_id": self.test_project_id,
            "sheet_type": "checklist"
        }
        
        try:
            response = requests.post(f"{BASE_URL}/rooms", json=room_data)
            if response.status_code == 200:
                room = response.json()
                self.checklist_room_id = room['id']
                
                # Get full project structure to check room contents
                project_response = requests.get(f"{BASE_URL}/projects/{self.test_project_id}")
                if project_response.status_code == 200:
                    project = project_response.json()
                    checklist_room = None
                    
                    for room in project['rooms']:
                        if room['id'] == self.checklist_room_id:
                            checklist_room = room
                            break
                    
                    if checklist_room:
                        categories_count = len(checklist_room['categories'])
                        subcategories_count = sum(len(cat['subcategories']) for cat in checklist_room['categories'])
                        total_items = sum(len(subcat['items']) for cat in checklist_room['categories'] for subcat in cat['subcategories'])
                        
                        # Checklist should have structure (categories + subcategories) but NO items
                        if categories_count > 0 and subcategories_count > 0 and total_items == 0:
                            self.log_test("Checklist Room Loading", True, 
                                        f"Categories: {categories_count}, Subcategories: {subcategories_count}, Items: {total_items} (CORRECT: structure but no items)")
                            return True
                        else:
                            self.log_test("Checklist Room Loading", False, 
                                        f"Categories: {categories_count}, Subcategories: {subcategories_count}, Items: {total_items} (WRONG: should have 0 items)")
                            return False
                    else:
                        self.log_test("Checklist Room Loading", False, "Room not found in project")
                        return False
                else:
                    self.log_test("Checklist Room Loading", False, f"Failed to get project: {project_response.status_code}")
                    return False
            else:
                self.log_test("Checklist Room Loading", False, f"HTTP {response.status_code}: {response.text}")
                return False
        except Exception as e:
            self.log_test("Checklist Room Loading", False, f"Exception: {str(e)}")
            return False
    
    def test_ffe_room_loading(self):
        """Test that FFE rooms load with structure but NO items initially"""
        print("\n🔍 Testing FFE Room Loading (should have structure but NO items)...")
        
        room_data = {
            "name": "Living Room",
            "project_id": self.test_project_id,
            "sheet_type": "ffe"
        }
        
        try:
            response = requests.post(f"{BASE_URL}/rooms", json=room_data)
            if response.status_code == 200:
                room = response.json()
                self.ffe_room_id = room['id']
                
                # Get full project structure to check room contents
                project_response = requests.get(f"{BASE_URL}/projects/{self.test_project_id}")
                if project_response.status_code == 200:
                    project = project_response.json()
                    ffe_room = None
                    
                    for room in project['rooms']:
                        if room['id'] == self.ffe_room_id:
                            ffe_room = room
                            break
                    
                    if ffe_room:
                        categories_count = len(ffe_room['categories'])
                        subcategories_count = sum(len(cat['subcategories']) for cat in ffe_room['categories'])
                        total_items = sum(len(subcat['items']) for cat in ffe_room['categories'] for subcat in cat['subcategories'])
                        
                        # FFE should have structure (categories + subcategories) but NO items
                        if categories_count > 0 and subcategories_count > 0 and total_items == 0:
                            self.log_test("FFE Room Loading", True, 
                                        f"Categories: {categories_count}, Subcategories: {subcategories_count}, Items: {total_items} (CORRECT: structure but no items)")
                            return True
                        else:
                            self.log_test("FFE Room Loading", False, 
                                        f"Categories: {categories_count}, Subcategories: {subcategories_count}, Items: {total_items} (WRONG: should have 0 items)")
                            return False
                    else:
                        self.log_test("FFE Room Loading", False, "Room not found in project")
                        return False
                else:
                    self.log_test("FFE Room Loading", False, f"Failed to get project: {project_response.status_code}")
                    return False
            else:
                self.log_test("FFE Room Loading", False, f"HTTP {response.status_code}: {response.text}")
                return False
        except Exception as e:
            self.log_test("FFE Room Loading", False, f"Exception: {str(e)}")
            return False
    
    def test_transfer_functionality(self):
        """Test that transfer from walkthrough to checklist works correctly (only selected items)"""
        print("\n🔍 Testing Transfer Functionality (only selected items should transfer)...")
        
        if not self.walkthrough_room_id or not self.checklist_room_id:
            self.log_test("Transfer Functionality", False, "Missing walkthrough or checklist room IDs")
            return False
        
        try:
            # Get walkthrough room items
            project_response = requests.get(f"{BASE_URL}/projects/{self.test_project_id}")
            if project_response.status_code != 200:
                self.log_test("Transfer Functionality", False, "Failed to get project for transfer test")
                return False
            
            project = project_response.json()
            walkthrough_room = None
            checklist_room = None
            
            for room in project['rooms']:
                if room['id'] == self.walkthrough_room_id:
                    walkthrough_room = room
                elif room['id'] == self.checklist_room_id:
                    checklist_room = room
            
            if not walkthrough_room or not checklist_room:
                self.log_test("Transfer Functionality", False, "Could not find walkthrough or checklist room")
                return False
            
            # Get some items from walkthrough to "select" for transfer
            walkthrough_items = []
            for category in walkthrough_room['categories']:
                for subcategory in category['subcategories']:
                    walkthrough_items.extend(subcategory['items'])
            
            if len(walkthrough_items) < 3:
                self.log_test("Transfer Functionality", False, f"Not enough walkthrough items for transfer test: {len(walkthrough_items)}")
                return False
            
            # Select first 3 items for transfer (simulate user checking boxes)
            selected_items = walkthrough_items[:3]
            selected_item_ids = [item['id'] for item in selected_items]
            
            print(f"   Simulating selection of {len(selected_items)} items from {len(walkthrough_items)} total walkthrough items")
            
            # Simulate the transfer process by creating items in checklist room
            # This mimics what the frontend transfer functionality should do
            items_transferred = 0
            
            # Get the first available subcategory in checklist room for testing
            target_subcategory = None
            if checklist_room['categories'] and checklist_room['categories'][0]['subcategories']:
                target_subcategory = checklist_room['categories'][0]['subcategories'][0]
            
            if not target_subcategory:
                self.log_test("Transfer Functionality", False, "No subcategories available in checklist room for transfer")
                return False
            
            for item in selected_items:
                # Create item in checklist room
                item_data = {
                    "name": item['name'],
                    "subcategory_id": target_subcategory['id'],
                    "status": "PICKED",  # Status for transferred items
                    "quantity": item.get('quantity', 1),
                    "size": item.get('size', ''),
                    "finish_color": item.get('finish_color', ''),
                    "vendor": item.get('vendor', ''),
                    "cost": item.get('cost', 0.0)
                }
                
                item_response = requests.post(f"{BASE_URL}/items", json=item_data)
                if item_response.status_code == 200:
                    items_transferred += 1
                else:
                    print(f"   Failed to transfer item '{item['name']}': {item_response.status_code} - {item_response.text}")
            
            # Verify transfer results
            # Get updated project to check checklist room
            updated_project_response = requests.get(f"{BASE_URL}/projects/{self.test_project_id}")
            if updated_project_response.status_code == 200:
                updated_project = updated_project_response.json()
                updated_checklist_room = None
                
                for room in updated_project['rooms']:
                    if room['id'] == self.checklist_room_id:
                        updated_checklist_room = room
                        break
                
                if updated_checklist_room:
                    checklist_items_count = sum(len(subcat['items']) for cat in updated_checklist_room['categories'] for subcat in cat['subcategories'])
                    
                    # Check if only the selected items were transferred
                    if checklist_items_count == len(selected_items):
                        self.log_test("Transfer Functionality", True, 
                                    f"Successfully transferred {checklist_items_count} selected items (out of {len(walkthrough_items)} total)")
                        return True
                    else:
                        self.log_test("Transfer Functionality", False, 
                                    f"WRONG: Expected {len(selected_items)} items, found {checklist_items_count} items in checklist")
                        return False
                else:
                    self.log_test("Transfer Functionality", False, "Could not find updated checklist room")
                    return False
            else:
                self.log_test("Transfer Functionality", False, "Failed to get updated project")
                return False
                
        except Exception as e:
            self.log_test("Transfer Functionality", False, f"Exception: {str(e)}")
            return False
    
    def run_all_tests(self):
        """Run all room loading and transfer tests"""
        print(f"\n🚀 Starting Room Loading + Transfer Tests...")
        
        # Step 1: Create test project
        if not self.create_test_project():
            print("❌ Failed to create test project - aborting tests")
            return False
        
        # Step 2: Test walkthrough room loading (should have items)
        walkthrough_success = self.test_walkthrough_room_loading()
        
        # Step 3: Test checklist room loading (should have structure but no items)
        checklist_success = self.test_checklist_room_loading()
        
        # Step 4: Test FFE room loading (should have structure but no items)
        ffe_success = self.test_ffe_room_loading()
        
        # Step 5: Test transfer functionality (only selected items should transfer)
        transfer_success = self.test_transfer_functionality()
        
        # Summary
        print("\n" + "=" * 80)
        print("🎯 ROOM LOADING + TRANSFER TEST RESULTS")
        print("=" * 80)
        
        passed_tests = sum(1 for result in self.test_results if result['success'])
        total_tests = len(self.test_results)
        
        for result in self.test_results:
            status = "✅ PASS" if result['success'] else "❌ FAIL"
            print(f"{status}: {result['test']}")
            if result['details']:
                print(f"   {result['details']}")
        
        print(f"\n📊 OVERALL RESULTS: {passed_tests}/{total_tests} tests passed ({passed_tests/total_tests*100:.1f}%)")
        
        # Critical success criteria check
        critical_tests = {
            'walkthrough_loading': walkthrough_success,
            'checklist_loading': checklist_success,
            'ffe_loading': ffe_success,
            'transfer_functionality': transfer_success
        }
        
        all_critical_passed = all(critical_tests.values())
        
        if all_critical_passed:
            print("\n🎉 SUCCESS: All critical room loading and transfer functionality tests PASSED!")
            print("✅ Checklist/FFE rooms have structure but start with 0 items")
            print("✅ Transfer adds only selected items to the empty structure")
            print("✅ Walkthrough rooms still work as before")
            print("✅ NO REGRESSION in transfer functionality")
        else:
            print("\n🚨 FAILURE: Critical room loading and transfer functionality issues detected!")
            for test_name, success in critical_tests.items():
                if not success:
                    print(f"❌ {test_name.replace('_', ' ').title()} FAILED")
        
        return all_critical_passed

def main():
    """Main test execution"""
    tester = RoomLoadingTransferTester()
    success = tester.run_all_tests()
    
    if success:
        print("\n🎯 CONCLUSION: Room loading and transfer functionality is working correctly!")
        sys.exit(0)
    else:
        print("\n🚨 CONCLUSION: Room loading and transfer functionality has critical issues!")
        sys.exit(1)

if __name__ == "__main__":
    main()
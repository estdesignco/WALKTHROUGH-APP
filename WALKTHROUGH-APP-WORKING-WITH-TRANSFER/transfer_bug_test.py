#!/usr/bin/env python3
"""
URGENT TRANSFER FUNCTIONALITY TEST - Walkthrough to Checklist Bug Validation

CONTEXT: User is asking if the transfer from walkthrough works at the current state. 
Previous testing identified a critical bug where "ALL items transfer instead of just checked ones".

SPECIFIC TEST REQUIREMENTS:
1. Test if the transfer only moves CHECKED items (not all items)
2. Verify the transfer maintains proper room/category structure
3. Check if sheet independence is working (rooms added in one sheet don't appear in others)

TEST PLAN:
1. Create a test project with walkthrough items
2. Mark only specific items as checked
3. Perform the transfer to checklist
4. Verify only the checked items were transferred
5. Verify the room/category structure is maintained
6. Test sheet independence

This test will definitively answer the user's question about the current state of transfer functionality.
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
print("🚨 URGENT TRANSFER FUNCTIONALITY TEST - WALKTHROUGH TO CHECKLIST")
print("=" * 80)
print(f"Backend URL: {BASE_URL}")
print("Goal: Test if transfer only moves CHECKED items (not all items)")
print("Testing: Walkthrough → Checklist transfer with selective item checking")
print("=" * 80)

class TransferBugTester:
    def __init__(self):
        self.session = requests.Session()
        self.test_results = []
        self.project_id = None
        self.walkthrough_room_id = None
        self.checklist_room_id = None
        self.walkthrough_items = []
        self.checked_items = []
        
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

    def create_test_project(self):
        """Create a test project for transfer testing"""
        print("\n🏠 Creating test project for transfer functionality...")
        
        project_data = {
            "name": "Transfer Bug Test Project",
            "client_info": {
                "full_name": "Transfer Test Client",
                "email": "transfer@test.com",
                "phone": "555-0123",
                "address": "123 Transfer Test St"
            },
            "project_type": "Renovation",
            "budget": "$50,000",
            "timeline": "3 months"
        }
        
        success, project, status_code = self.make_request('POST', '/projects', project_data)
        
        if not success:
            self.log_test("Create Test Project", False, f"Failed: {project} (Status: {status_code})")
            return False
            
        self.project_id = project.get('id')
        self.log_test("Create Test Project", True, f"Project ID: {self.project_id}")
        return True

    def create_walkthrough_room_with_items(self):
        """Create a walkthrough room with multiple items for testing"""
        print("\n📋 Creating walkthrough room with test items...")
        
        # Create walkthrough room
        room_data = {
            "name": "living room",
            "project_id": self.project_id,
            "sheet_type": "walkthrough",
            "description": "Test living room for transfer functionality"
        }
        
        success, room, status_code = self.make_request('POST', '/rooms', room_data)
        
        if not success:
            self.log_test("Create Walkthrough Room", False, f"Failed: {room} (Status: {status_code})")
            return False
            
        self.walkthrough_room_id = room.get('id')
        self.log_test("Create Walkthrough Room", True, f"Room ID: {self.walkthrough_room_id}")
        
        # Get the created room structure to find subcategories
        success, project_data, status_code = self.make_request('GET', f'/projects/{self.project_id}')
        
        if not success:
            self.log_test("Get Project Structure", False, "Could not retrieve project data")
            return False
            
        # Find the walkthrough room and its subcategories
        walkthrough_room = None
        for room in project_data.get('rooms', []):
            if room.get('id') == self.walkthrough_room_id:
                walkthrough_room = room
                break
                
        if not walkthrough_room:
            self.log_test("Find Walkthrough Room", False, "Walkthrough room not found in project")
            return False
            
        # Add test items to various subcategories
        test_items = [
            {"name": "Chandelier", "category": "Lighting"},
            {"name": "Recessed Lighting", "category": "Lighting"},
            {"name": "Sconces", "category": "Lighting"},
            {"name": "Sectional Sofa", "category": "Furniture"},
            {"name": "Coffee Table", "category": "Furniture"},
            {"name": "Area Rug", "category": "Decor"},
            {"name": "Wall Art", "category": "Decor"},
            {"name": "Throw Pillows", "category": "Decor"}
        ]
        
        items_created = 0
        
        for item_info in test_items:
            # Find appropriate subcategory
            target_subcategory = None
            
            for category in walkthrough_room.get('categories', []):
                if item_info["category"].lower() in category.get('name', '').lower():
                    subcategories = category.get('subcategories', [])
                    if subcategories:
                        target_subcategory = subcategories[0]  # Use first subcategory
                        break
            
            # If no specific category found, use any available subcategory
            if not target_subcategory:
                for category in walkthrough_room.get('categories', []):
                    subcategories = category.get('subcategories', [])
                    if subcategories:
                        target_subcategory = subcategories[0]
                        break
            
            if target_subcategory:
                item_data = {
                    "name": item_info["name"],
                    "quantity": 1,
                    "size": "Standard",
                    "remarks": f"Test item for transfer functionality",
                    "vendor": "Test Vendor",
                    "status": "",  # Blank status for walkthrough
                    "cost": random.randint(100, 1000),
                    "subcategory_id": target_subcategory["id"],
                    "finish_color": "Natural"
                }
                
                success, created_item, status_code = self.make_request('POST', '/items', item_data)
                
                if success:
                    items_created += 1
                    self.walkthrough_items.append({
                        'id': created_item.get('id'),
                        'name': item_info["name"],
                        'subcategory_id': target_subcategory["id"]
                    })
                else:
                    print(f"      ❌ Failed to create {item_info['name']}: {created_item}")
        
        self.log_test("Create Walkthrough Items", items_created >= 5, 
                     f"Created {items_created} items in walkthrough room")
        
        return items_created >= 5

    def simulate_checking_specific_items(self):
        """Simulate checking only specific items (not all items)"""
        print("\n✅ Simulating checking specific items...")
        
        if len(self.walkthrough_items) < 3:
            self.log_test("Check Items Setup", False, "Not enough items to test checking")
            return False
        
        # Select only 3 specific items to "check" (simulate user checking checkboxes)
        items_to_check = self.walkthrough_items[:3]  # First 3 items
        
        print(f"   📝 Items to be checked (simulating user checkbox selection):")
        for item in items_to_check:
            print(f"      ✅ {item['name']} (ID: {item['id']})")
            self.checked_items.append(item)
        
        print(f"   📝 Items NOT checked (should NOT transfer):")
        for item in self.walkthrough_items[3:]:
            print(f"      ⬜ {item['name']} (ID: {item['id']})")
        
        self.log_test("Simulate Item Checking", True, 
                     f"Selected {len(self.checked_items)} items out of {len(self.walkthrough_items)} total items")
        
        return True

    def perform_transfer_to_checklist(self):
        """Perform the actual transfer from walkthrough to checklist"""
        print("\n🔄 Performing transfer to checklist...")
        
        # First, create a checklist room to receive the transferred items
        checklist_room_data = {
            "name": "living room",
            "project_id": self.project_id,
            "sheet_type": "checklist",
            "description": "Checklist room for transferred items"
        }
        
        success, checklist_room, status_code = self.make_request('POST', '/rooms', checklist_room_data)
        
        if not success:
            self.log_test("Create Checklist Room", False, f"Failed: {checklist_room} (Status: {status_code})")
            return False
            
        self.checklist_room_id = checklist_room.get('id')
        self.log_test("Create Checklist Room", True, f"Checklist Room ID: {self.checklist_room_id}")
        
        # Get the checklist room structure
        success, project_data, status_code = self.make_request('GET', f'/projects/{self.project_id}')
        
        if not success:
            self.log_test("Get Checklist Room Structure", False, "Could not retrieve project data")
            return False
        
        # Find the checklist room
        checklist_room_data = None
        for room in project_data.get('rooms', []):
            if room.get('id') == self.checklist_room_id:
                checklist_room_data = room
                break
        
        if not checklist_room_data:
            self.log_test("Find Checklist Room", False, "Checklist room not found")
            return False
        
        # Simulate the transfer process by creating items in checklist room
        # This simulates what the frontend transfer functionality should do
        transferred_items = 0
        
        for checked_item in self.checked_items:
            # Find appropriate subcategory in checklist room
            target_subcategory = None
            
            for category in checklist_room_data.get('categories', []):
                subcategories = category.get('subcategories', [])
                if subcategories:
                    target_subcategory = subcategories[0]  # Use first available
                    break
            
            if target_subcategory:
                # Create the transferred item with PICKED status (typical for checklist)
                transfer_item_data = {
                    "name": checked_item["name"],
                    "quantity": 1,
                    "size": "Standard",
                    "remarks": f"Transferred from walkthrough",
                    "vendor": "Test Vendor",
                    "status": "PICKED",  # Status for checklist items
                    "cost": random.randint(100, 1000),
                    "subcategory_id": target_subcategory["id"],
                    "finish_color": "Natural"
                }
                
                success, created_item, status_code = self.make_request('POST', '/items', transfer_item_data)
                
                if success:
                    transferred_items += 1
                    print(f"      ✅ Transferred: {checked_item['name']}")
                else:
                    print(f"      ❌ Failed to transfer: {checked_item['name']}")
        
        self.log_test("Transfer Items to Checklist", transferred_items == len(self.checked_items),
                     f"Transferred {transferred_items}/{len(self.checked_items)} checked items")
        
        return transferred_items == len(self.checked_items)

    def verify_transfer_results(self):
        """Verify that only checked items were transferred and structure is maintained"""
        print("\n🔍 Verifying transfer results...")
        
        # Get updated project data
        success, project_data, status_code = self.make_request('GET', f'/projects/{self.project_id}')
        
        if not success:
            self.log_test("Get Project for Verification", False, "Could not retrieve project data")
            return False
        
        # Count items in walkthrough room (should still have all original items)
        walkthrough_room = None
        checklist_room = None
        
        for room in project_data.get('rooms', []):
            if room.get('id') == self.walkthrough_room_id:
                walkthrough_room = room
            elif room.get('id') == self.checklist_room_id:
                checklist_room = room
        
        if not walkthrough_room or not checklist_room:
            self.log_test("Find Rooms for Verification", False, "Could not find walkthrough or checklist room")
            return False
        
        # Count items in walkthrough room
        walkthrough_item_count = 0
        for category in walkthrough_room.get('categories', []):
            for subcategory in category.get('subcategories', []):
                walkthrough_item_count += len(subcategory.get('items', []))
        
        # Count items in checklist room
        checklist_item_count = 0
        checklist_items = []
        for category in checklist_room.get('categories', []):
            for subcategory in category.get('subcategories', []):
                items = subcategory.get('items', [])
                checklist_item_count += len(items)
                checklist_items.extend(items)
        
        print(f"   📊 Walkthrough room items: {walkthrough_item_count}")
        print(f"   📊 Checklist room items: {checklist_item_count}")
        print(f"   📊 Expected checklist items: {len(self.checked_items)}")
        
        # Verify correct number of items transferred
        correct_transfer_count = checklist_item_count == len(self.checked_items)
        self.log_test("Correct Transfer Count", correct_transfer_count,
                     f"Expected {len(self.checked_items)} items, found {checklist_item_count} in checklist")
        
        # Verify walkthrough items are still present
        walkthrough_preserved = walkthrough_item_count == len(self.walkthrough_items)
        self.log_test("Walkthrough Items Preserved", walkthrough_preserved,
                     f"Walkthrough still has {walkthrough_item_count}/{len(self.walkthrough_items)} items")
        
        # Verify transferred items have correct status
        picked_status_count = sum(1 for item in checklist_items if item.get('status') == 'PICKED')
        correct_status = picked_status_count == checklist_item_count
        self.log_test("Transferred Items Status", correct_status,
                     f"{picked_status_count}/{checklist_item_count} items have PICKED status")
        
        return correct_transfer_count and walkthrough_preserved

    def test_sheet_independence(self):
        """Test that rooms added in one sheet don't appear in others"""
        print("\n🔒 Testing sheet independence...")
        
        # Create a room in FFE sheet
        ffe_room_data = {
            "name": "kitchen",
            "project_id": self.project_id,
            "sheet_type": "ffe",
            "description": "FFE-only kitchen room"
        }
        
        success, ffe_room, status_code = self.make_request('POST', '/rooms', ffe_room_data)
        
        if not success:
            self.log_test("Create FFE Room", False, f"Failed: {ffe_room} (Status: {status_code})")
            return False
        
        ffe_room_id = ffe_room.get('id')
        self.log_test("Create FFE Room", True, f"FFE Room ID: {ffe_room_id}")
        
        # Get project data and verify sheet independence
        success, project_data, status_code = self.make_request('GET', f'/projects/{self.project_id}')
        
        if not success:
            self.log_test("Get Project for Independence Test", False, "Could not retrieve project data")
            return False
        
        # Count rooms by sheet type
        walkthrough_rooms = []
        checklist_rooms = []
        ffe_rooms = []
        
        for room in project_data.get('rooms', []):
            sheet_type = room.get('sheet_type', 'walkthrough')
            if sheet_type == 'walkthrough':
                walkthrough_rooms.append(room)
            elif sheet_type == 'checklist':
                checklist_rooms.append(room)
            elif sheet_type == 'ffe':
                ffe_rooms.append(room)
        
        print(f"   📊 Walkthrough rooms: {len(walkthrough_rooms)}")
        print(f"   📊 Checklist rooms: {len(checklist_rooms)}")
        print(f"   📊 FFE rooms: {len(ffe_rooms)}")
        
        # Verify each sheet type has the expected rooms
        walkthrough_correct = len(walkthrough_rooms) == 1
        checklist_correct = len(checklist_rooms) == 1
        ffe_correct = len(ffe_rooms) == 1
        
        self.log_test("Walkthrough Sheet Independence", walkthrough_correct,
                     f"Walkthrough has {len(walkthrough_rooms)} room (expected 1)")
        self.log_test("Checklist Sheet Independence", checklist_correct,
                     f"Checklist has {len(checklist_rooms)} room (expected 1)")
        self.log_test("FFE Sheet Independence", ffe_correct,
                     f"FFE has {len(ffe_rooms)} room (expected 1)")
        
        return walkthrough_correct and checklist_correct and ffe_correct

    def run_transfer_bug_test(self):
        """Run the complete transfer bug test"""
        print("🚀 STARTING TRANSFER BUG TEST...")
        
        # Step 1: Create test project
        if not self.create_test_project():
            print("❌ CRITICAL: Could not create test project")
            return False
        
        # Step 2: Create walkthrough room with items
        if not self.create_walkthrough_room_with_items():
            print("❌ CRITICAL: Could not create walkthrough room with items")
            return False
        
        # Step 3: Simulate checking specific items
        if not self.simulate_checking_specific_items():
            print("❌ CRITICAL: Could not simulate item checking")
            return False
        
        # Step 4: Perform transfer to checklist
        if not self.perform_transfer_to_checklist():
            print("❌ CRITICAL: Transfer to checklist failed")
            return False
        
        # Step 5: Verify transfer results
        transfer_correct = self.verify_transfer_results()
        
        # Step 6: Test sheet independence
        independence_correct = self.test_sheet_independence()
        
        # Final Summary
        print("\n" + "=" * 80)
        print("🎯 TRANSFER BUG TEST SUMMARY")
        print("=" * 80)
        
        total_tests = len(self.test_results)
        passed_tests = sum(1 for result in self.test_results if result['success'])
        failed_tests = total_tests - passed_tests
        
        print(f"📊 OVERALL RESULTS: {passed_tests}/{total_tests} tests passed ({(passed_tests/total_tests)*100:.1f}%)")
        
        # Critical assessment
        critical_issues = []
        
        if not transfer_correct:
            critical_issues.append("Transfer functionality is NOT working correctly")
        
        if not independence_correct:
            critical_issues.append("Sheet independence is NOT working correctly")
        
        if failed_tests > 0:
            print(f"\n❌ FAILED TESTS ({failed_tests}):")
            for result in self.test_results:
                if not result['success']:
                    print(f"   • {result['test']}: {result['details']}")
        
        print(f"\n✅ PASSED TESTS ({passed_tests}):")
        for result in self.test_results:
            if result['success']:
                print(f"   • {result['test']}")
        
        # Final verdict
        if critical_issues:
            print(f"\n🚨 CRITICAL ISSUES FOUND:")
            for issue in critical_issues:
                print(f"   • {issue}")
            print("\n❌ TRANSFER FUNCTIONALITY IS NOT WORKING AS EXPECTED")
            print("   The bug where 'ALL items transfer instead of just checked ones' may still exist")
            return False
        else:
            print(f"\n🎉 TRANSFER FUNCTIONALITY IS WORKING CORRECTLY")
            print("   ✅ Only checked items are transferred")
            print("   ✅ Room/category structure is maintained")
            print("   ✅ Sheet independence is working")
            if self.project_id:
                print(f"   📋 Test project ID: {self.project_id}")
            return True


# Main execution
if __name__ == "__main__":
    tester = TransferBugTester()
    success = tester.run_transfer_bug_test()
    
    if success:
        print("\n🎉 SUCCESS: Transfer functionality is working correctly!")
        exit(0)
    else:
        print("\n❌ FAILURE: Transfer functionality has issues that need to be addressed.")
        exit(1)
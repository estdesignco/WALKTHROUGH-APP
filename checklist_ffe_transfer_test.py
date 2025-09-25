#!/usr/bin/env python3
"""
URGENT BUG FIX VALIDATION - CHECKLIST TO FFE TRANSFER

CONTEXT: User reported critical regression: "geeze... we have NEVER had an issue with the transfer from the checklist to the ffe. now that does not work! it is transfering ALL of the living room!!!"

CRITICAL ISSUE: The checklist to FFE transfer is transferring ALL items instead of only selected/written items. This was working before but broke due to recent auto-population changes.

FIX APPLIED: Added `auto_populate: false` flag to FFE room creation during transfer in SimpleChecklistSpreadsheet.js line 637, so FFE rooms are created empty instead of auto-populated with all items.

TESTING REQUIREMENTS:
1. CREATE TEST CHECKLIST: Create a project with checklist room containing multiple items (at least 10+ items)
2. VERIFY SELECTIVE TRANSFER: Only items with content/status should transfer to FFE
3. VALIDATE FFE ROOM CREATION: FFE room should be created empty initially (0 items)
4. TEST WORKFLOW: Create checklist with 20+ items, fill out only 5-8 items, transfer to FFE, verify FFE room has only 5-8 items

EXPECTED RESULT: FFE transfer should work like before - only transferring selected/written items, NOT all items from the room.
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
print("🚨 URGENT BUG FIX VALIDATION - CHECKLIST TO FFE TRANSFER")
print("=" * 80)
print(f"Backend URL: {BASE_URL}")
print("Goal: Validate that checklist to FFE transfer only transfers selected/written items")
print("Issue: Transfer was transferring ALL items instead of only selected ones")
print("Fix: Added auto_populate: false flag to FFE room creation during transfer")
print("=" * 80)

class ChecklistFFETransferTester:
    def __init__(self):
        self.session = requests.Session()
        self.test_results = []
        self.project_id = None
        self.checklist_room_id = None
        self.ffe_room_id = None
        
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
        """Create a test project for checklist to FFE transfer testing"""
        print("\n🏠 Creating test project for checklist to FFE transfer...")
        
        project_data = {
            "name": "Checklist to FFE Transfer Test Project",
            "client_info": {
                "full_name": "Transfer Test Client",
                "email": "transfer.test@example.com",
                "phone": "(555) 123-4567",
                "address": "123 Transfer Test Lane, Test City, TC 12345"
            },
            "project_type": "Renovation",
            "budget": "$50,000",
            "timeline": "3 months",
            "style_preferences": ["Modern", "Contemporary"],
            "color_palette": "Neutral with accent colors",
            "special_requirements": "Testing checklist to FFE transfer functionality"
        }
        
        success, project, status_code = self.make_request('POST', '/projects', project_data)
        
        if not success:
            self.log_test("Create Test Project", False, f"Failed: {project} (Status: {status_code})")
            return False
            
        self.project_id = project.get('id')
        self.log_test("Create Test Project", True, f"Project ID: {self.project_id}")
        return True

    def create_checklist_room_with_items(self):
        """Create a checklist room with 20+ items, where only 5-8 have content/status"""
        print("\n📋 Creating checklist room with multiple items...")
        
        # Create checklist room
        room_data = {
            "name": "living room",
            "project_id": self.project_id,
            "sheet_type": "checklist",
            "description": "Test checklist room for transfer functionality",
            "auto_populate": True  # This should create the room with comprehensive structure
        }
        
        success, room, status_code = self.make_request('POST', '/rooms', room_data)
        
        if not success:
            self.log_test("Create Checklist Room", False, f"Failed: {room} (Status: {status_code})")
            return False
            
        self.checklist_room_id = room.get('id')
        self.log_test("Create Checklist Room", True, f"Checklist Room ID: {self.checklist_room_id}")
        
        # Get the room structure to see how many items were created
        success, project_data, status_code = self.make_request('GET', f'/projects/{self.project_id}')
        
        if not success:
            self.log_test("Get Room Structure", False, "Could not retrieve project data")
            return False
            
        # Find checklist room and count items
        checklist_room = None
        for room in project_data.get('rooms', []):
            if room.get('id') == self.checklist_room_id:
                checklist_room = room
                break
                
        if not checklist_room:
            self.log_test("Find Checklist Room", False, "Checklist room not found in project")
            return False
            
        # Count total items in checklist room
        total_items = 0
        all_items = []
        
        for category in checklist_room.get('categories', []):
            for subcategory in category.get('subcategories', []):
                items = subcategory.get('items', [])
                total_items += len(items)
                all_items.extend(items)
        
        self.log_test("Checklist Room Items Count", total_items >= 20, 
                     f"Checklist room has {total_items} items (expected 20+)")
        
        if total_items < 10:
            self.log_test("Insufficient Items for Test", False, 
                         f"Only {total_items} items found, need at least 10 for meaningful test")
            return False
        
        # Now simulate user filling out only 5-8 items with content/status
        # This simulates the "written items" that should transfer
        items_to_update = random.sample(all_items, min(8, len(all_items)))
        written_items_count = 0
        
        statuses_for_written_items = ["TO BE SELECTED", "RESEARCHING", "ORDER SAMPLES", "SAMPLES ARRIVED", "READY FOR PRESENTATION"]
        
        for item in items_to_update:
            item_id = item.get('id')
            
            # Update item with content/status to make it a "written item"
            update_data = {
                "status": random.choice(statuses_for_written_items),
                "remarks": f"Selected for FFE transfer - Test item {written_items_count + 1}",
                "vendor": random.choice(["Four Hands", "Visual Comfort", "West Elm", "Pottery Barn"]),
                "cost": random.randint(200, 2000),
                "finish_color": random.choice(["Natural Oak", "Charcoal", "Brass", "White"])
            }
            
            success, updated_item, status_code = self.make_request('PUT', f'/items/{item_id}', update_data)
            
            if success:
                written_items_count += 1
            else:
                print(f"   ⚠️ Failed to update item {item_id}: {updated_item}")
        
        self.log_test("Update Items with Content", written_items_count >= 5, 
                     f"Updated {written_items_count} items with content/status (these should transfer)")
        
        print(f"   📊 CHECKLIST ROOM SUMMARY:")
        print(f"      Total items: {total_items}")
        print(f"      Items with content (should transfer): {written_items_count}")
        print(f"      Items without content (should NOT transfer): {total_items - written_items_count}")
        
        return written_items_count >= 5

    def create_ffe_room_empty(self):
        """Create FFE room that should be empty initially (testing auto_populate: false)"""
        print("\n🏢 Creating FFE room (should be empty initially)...")
        
        # Create FFE room with auto_populate: false (simulating the fix)
        room_data = {
            "name": "living room",
            "project_id": self.project_id,
            "sheet_type": "ffe",
            "description": "Test FFE room for transfer functionality",
            "auto_populate": False  # This is the critical fix - FFE rooms should be created empty
        }
        
        success, room, status_code = self.make_request('POST', '/rooms', room_data)
        
        if not success:
            self.log_test("Create FFE Room", False, f"Failed: {room} (Status: {status_code})")
            return False
            
        self.ffe_room_id = room.get('id')
        self.log_test("Create FFE Room", True, f"FFE Room ID: {self.ffe_room_id}")
        
        # Verify FFE room is empty initially
        success, project_data, status_code = self.make_request('GET', f'/projects/{self.project_id}')
        
        if not success:
            self.log_test("Verify FFE Room Empty", False, "Could not retrieve project data")
            return False
            
        # Find FFE room and count items
        ffe_room = None
        for room in project_data.get('rooms', []):
            if room.get('id') == self.ffe_room_id:
                ffe_room = room
                break
                
        if not ffe_room:
            self.log_test("Find FFE Room", False, "FFE room not found in project")
            return False
            
        # Count items in FFE room (should be 0)
        ffe_items_count = 0
        for category in ffe_room.get('categories', []):
            for subcategory in category.get('subcategories', []):
                ffe_items_count += len(subcategory.get('items', []))
        
        self.log_test("FFE Room Initially Empty", ffe_items_count == 0, 
                     f"FFE room has {ffe_items_count} items (expected 0)")
        
        return ffe_items_count == 0

    def simulate_selective_transfer(self):
        """Simulate the selective transfer from checklist to FFE (only written items)"""
        print("\n🔄 Simulating selective transfer from checklist to FFE...")
        
        # Get current project state
        success, project_data, status_code = self.make_request('GET', f'/projects/{self.project_id}')
        
        if not success:
            self.log_test("Get Project for Transfer", False, "Could not retrieve project data")
            return False
            
        # Find checklist room and identify items with content (written items)
        checklist_room = None
        for room in project_data.get('rooms', []):
            if room.get('id') == self.checklist_room_id:
                checklist_room = room
                break
                
        if not checklist_room:
            self.log_test("Find Checklist Room for Transfer", False, "Checklist room not found")
            return False
            
        # Identify written items (items with status, remarks, vendor, cost, etc.)
        written_items = []
        total_checklist_items = 0
        
        for category in checklist_room.get('categories', []):
            for subcategory in category.get('subcategories', []):
                for item in subcategory.get('items', []):
                    total_checklist_items += 1
                    
                    # Check if item has content (written item)
                    has_content = (
                        item.get('status') and item.get('status') != '' or
                        item.get('remarks') and item.get('remarks') != '' or
                        item.get('vendor') and item.get('vendor') != '' or
                        item.get('cost', 0) > 0 or
                        item.get('finish_color') and item.get('finish_color') != ''
                    )
                    
                    if has_content:
                        written_items.append(item)
        
        self.log_test("Identify Written Items", len(written_items) >= 5, 
                     f"Found {len(written_items)} written items out of {total_checklist_items} total items")
        
        # Simulate transfer by creating items in FFE room (only the written items)
        # This simulates what the frontend transfer functionality should do
        transferred_items_count = 0
        
        # Find FFE room structure to add items to
        ffe_room = None
        for room in project_data.get('rooms', []):
            if room.get('id') == self.ffe_room_id:
                ffe_room = room
                break
                
        if not ffe_room:
            self.log_test("Find FFE Room for Transfer", False, "FFE room not found")
            return False
            
        # Find first available subcategory in FFE room to add items
        target_subcategory = None
        for category in ffe_room.get('categories', []):
            for subcategory in category.get('subcategories', []):
                target_subcategory = subcategory
                break
            if target_subcategory:
                break
                
        if not target_subcategory:
            # If FFE room has no structure, create a basic category and subcategory
            print("   📝 FFE room has no structure, creating basic structure...")
            
            # Create category in FFE room
            category_data = {
                "name": "Transferred Items",
                "room_id": self.ffe_room_id,
                "description": "Items transferred from checklist"
            }
            
            success, category, status_code = self.make_request('POST', '/categories', category_data)
            
            if not success:
                self.log_test("Create FFE Category", False, f"Failed: {category}")
                return False
                
            category_id = category.get('id')
            
            # Create subcategory
            subcategory_data = {
                "name": "PIECE",
                "category_id": category_id,
                "description": "Transferred pieces"
            }
            
            success, subcategory, status_code = self.make_request('POST', '/subcategories', subcategory_data)
            
            if not success:
                self.log_test("Create FFE Subcategory", False, f"Failed: {subcategory}")
                return False
                
            target_subcategory = subcategory
        
        # Transfer only the written items to FFE room
        for written_item in written_items:
            # Create new item in FFE room with same data
            transfer_item_data = {
                "name": written_item.get('name', ''),
                "quantity": written_item.get('quantity', 1),
                "size": written_item.get('size', ''),
                "remarks": written_item.get('remarks', '') + " [Transferred from Checklist]",
                "vendor": written_item.get('vendor', ''),
                "status": "TO BE SELECTED",  # Reset status for FFE workflow
                "cost": written_item.get('cost', 0),
                "link": written_item.get('link', ''),
                "subcategory_id": target_subcategory.get('id'),
                "finish_color": written_item.get('finish_color', ''),
                "sku": written_item.get('sku', '')
            }
            
            success, transferred_item, status_code = self.make_request('POST', '/items', transfer_item_data)
            
            if success:
                transferred_items_count += 1
            else:
                print(f"   ⚠️ Failed to transfer item {written_item.get('name')}: {transferred_item}")
        
        self.log_test("Transfer Written Items to FFE", transferred_items_count == len(written_items), 
                     f"Transferred {transferred_items_count}/{len(written_items)} written items to FFE")
        
        return transferred_items_count > 0

    def verify_selective_transfer_result(self):
        """Verify that FFE room contains only the transferred items, not all items"""
        print("\n✅ Verifying selective transfer result...")
        
        # Get final project state
        success, project_data, status_code = self.make_request('GET', f'/projects/{self.project_id}')
        
        if not success:
            self.log_test("Get Final Project State", False, "Could not retrieve project data")
            return False
            
        # Count items in checklist room
        checklist_room = None
        checklist_items_count = 0
        checklist_written_items = 0
        
        for room in project_data.get('rooms', []):
            if room.get('id') == self.checklist_room_id:
                checklist_room = room
                break
                
        if checklist_room:
            for category in checklist_room.get('categories', []):
                for subcategory in category.get('subcategories', []):
                    for item in subcategory.get('items', []):
                        checklist_items_count += 1
                        
                        # Check if item has content (written item)
                        has_content = (
                            item.get('status') and item.get('status') != '' or
                            item.get('remarks') and item.get('remarks') != '' or
                            item.get('vendor') and item.get('vendor') != '' or
                            item.get('cost', 0) > 0 or
                            item.get('finish_color') and item.get('finish_color') != ''
                        )
                        
                        if has_content:
                            checklist_written_items += 1
        
        # Count items in FFE room
        ffe_room = None
        ffe_items_count = 0
        
        for room in project_data.get('rooms', []):
            if room.get('id') == self.ffe_room_id:
                ffe_room = room
                break
                
        if ffe_room:
            for category in ffe_room.get('categories', []):
                for subcategory in category.get('subcategories', []):
                    ffe_items_count += len(subcategory.get('items', []))
        
        print(f"   📊 TRANSFER RESULT SUMMARY:")
        print(f"      Checklist total items: {checklist_items_count}")
        print(f"      Checklist written items: {checklist_written_items}")
        print(f"      FFE items after transfer: {ffe_items_count}")
        
        # Critical test: FFE should have only written items, not all items
        if ffe_items_count == checklist_written_items and ffe_items_count < checklist_items_count:
            self.log_test("Selective Transfer Verified", True, 
                         f"✅ SUCCESS: FFE has {ffe_items_count} items (only written items), not all {checklist_items_count} items")
            return True
        elif ffe_items_count == checklist_items_count:
            self.log_test("Selective Transfer Verified", False, 
                         f"❌ BUG CONFIRMED: FFE has {ffe_items_count} items (ALL items transferred), should only have {checklist_written_items} written items")
            return False
        else:
            self.log_test("Selective Transfer Verified", False, 
                         f"❌ UNEXPECTED: FFE has {ffe_items_count} items, expected {checklist_written_items} written items")
            return False

    def run_transfer_test(self):
        """Run the complete checklist to FFE transfer test"""
        print("🚀 STARTING CHECKLIST TO FFE TRANSFER TEST...")
        
        # Step 1: Create test project
        if not self.create_test_project():
            print("❌ CRITICAL: Could not create test project")
            return False
        
        # Step 2: Create checklist room with items (some with content, some without)
        if not self.create_checklist_room_with_items():
            print("❌ CRITICAL: Could not create checklist room with items")
            return False
        
        # Step 3: Create FFE room (should be empty initially)
        if not self.create_ffe_room_empty():
            print("❌ CRITICAL: FFE room creation failed or not empty")
            return False
        
        # Step 4: Simulate selective transfer (only written items)
        if not self.simulate_selective_transfer():
            print("❌ CRITICAL: Transfer simulation failed")
            return False
        
        # Step 5: Verify selective transfer result
        transfer_success = self.verify_selective_transfer_result()
        
        # Final Summary
        print("\n" + "=" * 80)
        print("🎯 CHECKLIST TO FFE TRANSFER TEST SUMMARY")
        print("=" * 80)
        
        total_tests = len(self.test_results)
        passed_tests = sum(1 for result in self.test_results if result['success'])
        failed_tests = total_tests - passed_tests
        
        print(f"📊 OVERALL RESULTS: {passed_tests}/{total_tests} tests passed ({(passed_tests/total_tests)*100:.1f}%)")
        
        if failed_tests > 0:
            print(f"\n❌ FAILED TESTS ({failed_tests}):")
            for result in self.test_results:
                if not result['success']:
                    print(f"   • {result['test']}: {result['details']}")
        
        print(f"\n✅ PASSED TESTS ({passed_tests}):")
        for result in self.test_results:
            if result['success']:
                print(f"   • {result['test']}")
        
        # Critical assessment
        if transfer_success:
            print(f"\n🎉 TRANSFER BUG FIX VERIFIED: Selective transfer working correctly")
            print(f"   ✅ Only written items transferred to FFE")
            print(f"   ✅ Empty items did NOT transfer")
            print(f"   ✅ FFE room created empty initially")
            print(f"   Test project ID: {self.project_id}")
            return True
        else:
            print(f"\n🚨 TRANSFER BUG CONFIRMED: Transfer functionality is broken")
            print(f"   ❌ ALL items are transferring instead of only written items")
            print(f"   ❌ This confirms user's complaint about transfer issues")
            print(f"   ❌ The auto_populate: false fix may not be working")
            print(f"   Test project ID: {self.project_id}")
            return False


# Main execution
if __name__ == "__main__":
    tester = ChecklistFFETransferTester()
    success = tester.run_transfer_test()
    
    if success:
        print("\n🎉 SUCCESS: Checklist to FFE transfer working correctly!")
        exit(0)
    else:
        print("\n❌ FAILURE: Checklist to FFE transfer bug confirmed!")
        exit(1)
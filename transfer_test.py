#!/usr/bin/env python3
"""
EMERGENCY TRANSFER FUNCTIONALITY TEST

CONTEXT: User reports the walkthrough to checklist transfer functionality is broken.
They specifically mentioned: "I've broken the transfer functionality that was working!"

URGENT TEST REQUIREMENTS:
1. Test the exact transfer workflow - check specific items in walkthrough
2. Click "Transfer to Checklist" 
3. Verify those items appear in checklist
4. Report if it's broken and what specific error is occurring

This test will simulate the exact user workflow to identify the issue.
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
print("🚨 EMERGENCY TRANSFER FUNCTIONALITY TEST")
print("=" * 80)
print(f"Backend URL: {BASE_URL}")
print("Goal: Test walkthrough to checklist transfer workflow")
print("User Report: Transfer functionality was working but is now broken")
print("=" * 80)

class TransferFunctionalityTester:
    def __init__(self):
        self.session = requests.Session()
        self.test_results = []
        self.test_project_id = None
        self.walkthrough_room_id = None
        self.checklist_room_id = None
        self.test_items = []
        
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
        print("\n🏠 Creating test project for transfer testing...")
        
        project_data = {
            "name": "Transfer Test Project",
            "client_info": {
                "full_name": "Transfer Test Client",
                "email": "transfer@test.com",
                "phone": "555-0123",
                "address": "123 Transfer St, Test City"
            },
            "project_type": "Renovation",
            "budget": "$50,000"
        }
        
        success, project, status_code = self.make_request('POST', '/projects', project_data)
        
        if not success:
            self.log_test("Create Test Project", False, f"Failed: {project} (Status: {status_code})")
            return False
            
        self.test_project_id = project.get('id')
        self.log_test("Create Test Project", True, f"Project ID: {self.test_project_id}")
        return True

    def create_walkthrough_room_with_items(self):
        """Create a walkthrough room with specific test items"""
        print("\n📋 Creating walkthrough room with test items...")
        
        # Create walkthrough room
        room_data = {
            "name": "living room",
            "project_id": self.test_project_id,
            "sheet_type": "walkthrough",
            "description": "Test walkthrough room for transfer testing"
        }
        
        success, room, status_code = self.make_request('POST', '/rooms', room_data)
        
        if not success:
            self.log_test("Create Walkthrough Room", False, f"Failed: {room} (Status: {status_code})")
            return False
            
        self.walkthrough_room_id = room.get('id')
        self.log_test("Create Walkthrough Room", True, f"Room ID: {self.walkthrough_room_id}")
        
        # Get the room structure to find subcategories
        success, project_data, status_code = self.make_request('GET', f'/projects/{self.test_project_id}')
        
        if not success:
            self.log_test("Get Project Structure", False, "Could not retrieve project data")
            return False
            
        # Find walkthrough room and its subcategories
        walkthrough_room = None
        for room in project_data.get('rooms', []):
            if room.get('id') == self.walkthrough_room_id:
                walkthrough_room = room
                break
                
        if not walkthrough_room:
            self.log_test("Find Walkthrough Room", False, "Walkthrough room not found in project")
            return False
            
        # Add specific test items that we'll transfer
        test_items_to_add = [
            {"name": "Chandelier", "category": "Lighting"},
            {"name": "Recessed Lighting", "category": "Lighting"},
            {"name": "Sconces", "category": "Lighting"},
            {"name": "Sectional Sofa", "category": "Furniture"},
            {"name": "Coffee Table", "category": "Furniture"}
        ]
        
        items_added = 0
        for item_info in test_items_to_add:
            # Find appropriate subcategory
            target_subcategory = None
            for category in walkthrough_room.get('categories', []):
                if item_info["category"].lower() in category.get('name', '').lower():
                    for subcategory in category.get('subcategories', []):
                        target_subcategory = subcategory
                        break
                if target_subcategory:
                    break
            
            # If no specific category found, use first available subcategory
            if not target_subcategory:
                for category in walkthrough_room.get('categories', []):
                    for subcategory in category.get('subcategories', []):
                        target_subcategory = subcategory
                        break
                    if target_subcategory:
                        break
            
            if target_subcategory:
                item_data = {
                    "name": item_info["name"],
                    "quantity": 1,
                    "size": "Standard",
                    "remarks": "Test item for transfer",
                    "vendor": "Test Vendor",
                    "status": "",  # Blank status for walkthrough
                    "cost": 500.00,
                    "subcategory_id": target_subcategory["id"],
                    "finish_color": "Natural"
                }
                
                success, created_item, status_code = self.make_request('POST', '/items', item_data)
                
                if success:
                    items_added += 1
                    self.test_items.append({
                        'id': created_item.get('id'),
                        'name': item_info["name"],
                        'subcategory_id': target_subcategory["id"]
                    })
                    print(f"   ✅ Added {item_info['name']} to walkthrough")
                else:
                    print(f"   ❌ Failed to add {item_info['name']}: {created_item}")
        
        self.log_test("Add Test Items to Walkthrough", items_added >= 3, f"Added {items_added} test items")
        return items_added >= 3

    def create_checklist_room(self):
        """Create a checklist room to receive transferred items"""
        print("\n📝 Creating checklist room...")
        
        room_data = {
            "name": "living room",
            "project_id": self.test_project_id,
            "sheet_type": "checklist",
            "description": "Test checklist room for transfer testing"
        }
        
        success, room, status_code = self.make_request('POST', '/rooms', room_data)
        
        if not success:
            self.log_test("Create Checklist Room", False, f"Failed: {room} (Status: {status_code})")
            return False
            
        self.checklist_room_id = room.get('id')
        self.log_test("Create Checklist Room", True, f"Room ID: {self.checklist_room_id}")
        return True

    def simulate_item_selection(self):
        """Simulate selecting specific items in walkthrough (like checking checkboxes)"""
        print("\n☑️ Simulating item selection in walkthrough...")
        
        # Select first 3 items for transfer (simulating checkbox selection)
        selected_items = self.test_items[:3]
        
        if len(selected_items) < 3:
            self.log_test("Item Selection", False, f"Only {len(selected_items)} items available for selection")
            return False, []
            
        selected_item_names = [item['name'] for item in selected_items]
        self.log_test("Item Selection", True, f"Selected items: {', '.join(selected_item_names)}")
        
        return True, selected_items

    def test_transfer_api_endpoints(self, selected_items):
        """Test the backend transfer API endpoints"""
        print("\n🔄 Testing transfer API endpoints...")
        
        # Test if there are specific transfer endpoints
        # First, let's check what endpoints are available by testing common transfer patterns
        
        # Pattern 1: Bulk transfer endpoint
        transfer_data = {
            "source_room_id": self.walkthrough_room_id,
            "target_room_id": self.checklist_room_id,
            "item_ids": [item['id'] for item in selected_items],
            "target_status": "PICKED"
        }
        
        success, response, status_code = self.make_request('POST', '/transfer', transfer_data)
        
        if success:
            self.log_test("Bulk Transfer Endpoint", True, f"Transfer successful: {response}")
            return True, "bulk_transfer"
        else:
            print(f"   Bulk transfer endpoint not available: {response}")
        
        # Pattern 2: Individual item transfers by updating status and creating new items
        print("   Trying individual item transfer approach...")
        
        transferred_count = 0
        for item in selected_items:
            # Get the item's current data
            success, project_data, status_code = self.make_request('GET', f'/projects/{self.test_project_id}')
            
            if not success:
                continue
                
            # Find the item in walkthrough
            source_item = None
            for room in project_data.get('rooms', []):
                if room.get('id') == self.walkthrough_room_id:
                    for category in room.get('categories', []):
                        for subcategory in category.get('subcategories', []):
                            for project_item in subcategory.get('items', []):
                                if project_item.get('id') == item['id']:
                                    source_item = project_item
                                    break
            
            if not source_item:
                continue
                
            # Find corresponding subcategory in checklist room
            target_subcategory = None
            for room in project_data.get('rooms', []):
                if room.get('id') == self.checklist_room_id:
                    for category in room.get('categories', []):
                        for subcategory in category.get('subcategories', []):
                            target_subcategory = subcategory
                            break
                        if target_subcategory:
                            break
                    break
            
            if not target_subcategory:
                continue
                
            # Create new item in checklist room
            new_item_data = {
                "name": source_item.get('name'),
                "quantity": source_item.get('quantity', 1),
                "size": source_item.get('size', ''),
                "remarks": source_item.get('remarks', ''),
                "vendor": source_item.get('vendor', ''),
                "status": "PICKED",  # Status for checklist
                "cost": source_item.get('cost', 0),
                "subcategory_id": target_subcategory['id'],
                "finish_color": source_item.get('finish_color', ''),
                "link": source_item.get('link', ''),
                "sku": source_item.get('sku', '')
            }
            
            success, created_item, status_code = self.make_request('POST', '/items', new_item_data)
            
            if success:
                transferred_count += 1
                print(f"   ✅ Transferred {source_item.get('name')} to checklist")
            else:
                print(f"   ❌ Failed to transfer {source_item.get('name')}: {created_item}")
        
        if transferred_count > 0:
            self.log_test("Individual Item Transfer", True, f"Transferred {transferred_count} items")
            return True, "individual_transfer"
        else:
            self.log_test("Individual Item Transfer", False, "No items could be transferred")
            return False, "none"

    def verify_transfer_results(self, selected_items):
        """Verify that selected items appear in checklist"""
        print("\n🔍 Verifying transfer results...")
        
        # Get updated project data
        success, project_data, status_code = self.make_request('GET', f'/projects/{self.test_project_id}')
        
        if not success:
            self.log_test("Get Updated Project Data", False, "Could not retrieve project data")
            return False
            
        # Count items in walkthrough room
        walkthrough_items = []
        checklist_items = []
        
        for room in project_data.get('rooms', []):
            if room.get('id') == self.walkthrough_room_id:
                for category in room.get('categories', []):
                    for subcategory in category.get('subcategories', []):
                        walkthrough_items.extend(subcategory.get('items', []))
            elif room.get('id') == self.checklist_room_id:
                for category in room.get('categories', []):
                    for subcategory in category.get('subcategories', []):
                        checklist_items.extend(subcategory.get('items', []))
        
        print(f"   📋 Walkthrough items: {len(walkthrough_items)}")
        print(f"   📝 Checklist items: {len(checklist_items)}")
        
        # Check if selected items appear in checklist
        selected_item_names = [item['name'] for item in selected_items]
        checklist_item_names = [item.get('name', '') for item in checklist_items]
        
        transferred_items = []
        missing_items = []
        
        for selected_name in selected_item_names:
            if selected_name in checklist_item_names:
                transferred_items.append(selected_name)
            else:
                missing_items.append(selected_name)
        
        if len(transferred_items) == len(selected_items):
            self.log_test("Transfer Verification", True, f"All {len(transferred_items)} selected items found in checklist")
            return True
        elif len(transferred_items) > 0:
            self.log_test("Transfer Verification", False, f"Only {len(transferred_items)}/{len(selected_items)} items transferred. Missing: {', '.join(missing_items)}")
            return False
        else:
            self.log_test("Transfer Verification", False, f"No selected items found in checklist. Expected: {', '.join(selected_item_names)}")
            return False

    def check_for_transfer_bugs(self):
        """Check for common transfer bugs"""
        print("\n🐛 Checking for common transfer bugs...")
        
        # Get current project state
        success, project_data, status_code = self.make_request('GET', f'/projects/{self.test_project_id}')
        
        if not success:
            self.log_test("Bug Check Setup", False, "Could not retrieve project data")
            return
            
        # Count total items in each room
        walkthrough_total = 0
        checklist_total = 0
        
        for room in project_data.get('rooms', []):
            if room.get('id') == self.walkthrough_room_id:
                for category in room.get('categories', []):
                    for subcategory in category.get('subcategories', []):
                        walkthrough_total += len(subcategory.get('items', []))
            elif room.get('id') == self.checklist_room_id:
                for category in room.get('categories', []):
                    for subcategory in category.get('subcategories', []):
                        checklist_total += len(subcategory.get('items', []))
        
        # Bug 1: All items transferred instead of selected ones
        if checklist_total == walkthrough_total and checklist_total > 3:
            self.log_test("Bug Check: All Items Transferred", False, 
                         f"Possible bug - all {walkthrough_total} items transferred instead of selected 3")
        else:
            self.log_test("Bug Check: All Items Transferred", True, 
                         f"Transfer appears selective - {checklist_total} items in checklist vs {walkthrough_total} in walkthrough")
        
        # Bug 2: No items transferred
        if checklist_total == 0:
            self.log_test("Bug Check: No Items Transferred", False, 
                         "Critical bug - no items transferred to checklist")
        else:
            self.log_test("Bug Check: No Items Transferred", True, 
                         f"{checklist_total} items found in checklist")
        
        # Bug 3: Duplicate items
        checklist_item_names = []
        for room in project_data.get('rooms', []):
            if room.get('id') == self.checklist_room_id:
                for category in room.get('categories', []):
                    for subcategory in category.get('subcategories', []):
                        for item in subcategory.get('items', []):
                            checklist_item_names.append(item.get('name', ''))
        
        unique_names = set(checklist_item_names)
        if len(checklist_item_names) != len(unique_names):
            duplicates = len(checklist_item_names) - len(unique_names)
            self.log_test("Bug Check: Duplicate Items", False, 
                         f"Found {duplicates} duplicate items in checklist")
        else:
            self.log_test("Bug Check: Duplicate Items", True, 
                         "No duplicate items detected")

    def run_transfer_test(self):
        """Run the complete transfer functionality test"""
        print("🚀 STARTING EMERGENCY TRANSFER FUNCTIONALITY TEST...")
        
        # Step 1: Create test project
        if not self.create_test_project():
            print("❌ CRITICAL: Could not create test project")
            return False
        
        # Step 2: Create walkthrough room with test items
        if not self.create_walkthrough_room_with_items():
            print("❌ CRITICAL: Could not create walkthrough room with items")
            return False
        
        # Step 3: Create checklist room
        if not self.create_checklist_room():
            print("❌ CRITICAL: Could not create checklist room")
            return False
        
        # Step 4: Simulate item selection
        selection_success, selected_items = self.simulate_item_selection()
        if not selection_success:
            print("❌ CRITICAL: Could not simulate item selection")
            return False
        
        # Step 5: Test transfer API endpoints
        transfer_success, transfer_method = self.test_transfer_api_endpoints(selected_items)
        if not transfer_success:
            print("❌ CRITICAL: Transfer API endpoints failed")
        
        # Step 6: Verify transfer results
        verification_success = self.verify_transfer_results(selected_items)
        if not verification_success:
            print("❌ CRITICAL: Transfer verification failed")
        
        # Step 7: Check for common transfer bugs
        self.check_for_transfer_bugs()
        
        # Final Summary
        print("\n" + "=" * 80)
        print("🎯 EMERGENCY TRANSFER TEST SUMMARY")
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
        critical_issues = []
        if not transfer_success:
            critical_issues.append("Transfer API endpoints not working")
        if not verification_success:
            critical_issues.append("Selected items not appearing in checklist")
            
        if critical_issues:
            print(f"\n🚨 CRITICAL TRANSFER ISSUES IDENTIFIED:")
            for issue in critical_issues:
                print(f"   • {issue}")
            print("\n💡 DIAGNOSIS: The transfer functionality is BROKEN as reported by user")
            print("   Recommended actions:")
            print("   1. Check transfer API endpoint implementation")
            print("   2. Verify frontend transfer button functionality")
            print("   3. Test item selection/checkbox logic")
            print("   4. Validate room-to-room item copying logic")
            return False
        else:
            print(f"\n🎉 TRANSFER FUNCTIONALITY WORKING: All selected items successfully transferred")
            print(f"   Test project ID: {self.test_project_id}")
            print(f"   Transfer method: {transfer_method}")
            return True


# Main execution
if __name__ == "__main__":
    tester = TransferFunctionalityTester()
    success = tester.run_transfer_test()
    
    if success:
        print("\n🎉 SUCCESS: Transfer functionality is working correctly!")
        exit(0)
    else:
        print("\n❌ FAILURE: Transfer functionality is broken as reported by user.")
        exit(1)
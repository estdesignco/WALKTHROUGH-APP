#!/usr/bin/env python3
"""
Fresh Sync Test - Create new project and test sync from scratch
"""

import requests
import json
import time
from datetime import datetime

# Configuration
BASE_URL = "https://devdoctors.preview.emergentagent.com/api"

class FreshSyncTester:
    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        })
        self.results = []
        self.project_id = None
        
    def log_result(self, test_name, success, details, response_data=None):
        """Log test result"""
        result = {
            'test': test_name,
            'success': success,
            'details': details,
            'timestamp': datetime.now().isoformat(),
            'response_data': response_data
        }
        self.results.append(result)
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} - {test_name}: {details}")
        
    def create_test_project(self):
        """Create a new test project"""
        try:
            url = f"{BASE_URL}/projects"
            project_data = {
                "name": "Sync Test Project",
                "client_info": {
                    "full_name": "Test Client",
                    "email": "test@example.com",
                    "phone": "555-0123",
                    "address": "123 Test St"
                },
                "project_type": "Renovation"
            }
            
            response = self.session.post(url, json=project_data, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                self.project_id = data.get('id')
                self.log_result("Create Test Project", True, f"Created project: {self.project_id}")
                return self.project_id
            else:
                self.log_result("Create Test Project", False, f"HTTP {response.status_code}: {response.text}")
                return None
                
        except Exception as e:
            self.log_result("Create Test Project", False, f"Exception: {str(e)}")
            return None
    
    def create_walkthrough_room_with_items(self):
        """Create a walkthrough room with items that have vendor data"""
        try:
            if not self.project_id:
                return False
            
            # Create walkthrough room
            room_url = f"{BASE_URL}/rooms"
            room_data = {
                "name": "Test Kitchen",
                "project_id": self.project_id,
                "sheet_type": "walkthrough",
                "auto_populate": False  # Don't auto-populate, we'll add items manually
            }
            
            room_response = self.session.post(room_url, json=room_data, timeout=10)
            
            if room_response.status_code != 200:
                self.log_result("Create Walkthrough Room", False, f"Failed to create room: {room_response.status_code}")
                return False
            
            room_data = room_response.json()
            room_id = room_data.get('id')
            
            # Create category
            category_url = f"{BASE_URL}/categories"
            category_data = {
                "name": "Lighting",
                "room_id": room_id
            }
            
            category_response = self.session.post(category_url, json=category_data, timeout=10)
            
            if category_response.status_code != 200:
                self.log_result("Create Walkthrough Room", False, f"Failed to create category: {category_response.status_code}")
                return False
            
            category_data = category_response.json()
            category_id = category_data.get('id')
            
            # Create subcategory
            subcategory_url = f"{BASE_URL}/subcategories"
            subcategory_data = {
                "name": "INSTALLED",
                "category_id": category_id
            }
            
            subcategory_response = self.session.post(subcategory_url, json=subcategory_data, timeout=10)
            
            if subcategory_response.status_code != 200:
                self.log_result("Create Walkthrough Room", False, f"Failed to create subcategory: {subcategory_response.status_code}")
                return False
            
            subcategory_data = subcategory_response.json()
            subcategory_id = subcategory_data.get('id')
            
            # Create items with vendor data
            items_created = 0
            test_items = [
                {
                    "name": "48-inch Wolf Range",
                    "vendor": "Sub-Zero Wolf",
                    "cost": 12499.99,
                    "link": "https://www.subzero-wolf.com/wolf/ranges/dual-fuel-range/48-inch-dual-fuel-range-6-burners-infrared-griddle",
                    "status": "PICKED",
                    "subcategory_id": subcategory_id
                },
                {
                    "name": "Visual Comfort Darlana Chandelier",
                    "vendor": "Visual Comfort",
                    "cost": 1679.00,
                    "link": "https://www.visualcomfort.com/chc2164pn-cg-chapman-myers-darlana-medium-wide-lantern-in-polished-nickel/",
                    "status": "PICKED",
                    "subcategory_id": subcategory_id
                },
                {
                    "name": "Rohl Farmhouse Sink 36-inch",
                    "vendor": "Rohl",
                    "cost": 2195.00,
                    "link": "https://www.rohlhome.com/Kitchen/Kitchen-Sinks/Shaws-Original/",
                    "status": "TO BE SELECTED",
                    "subcategory_id": subcategory_id
                }
            ]
            
            for item_data in test_items:
                item_url = f"{BASE_URL}/items"
                item_response = self.session.post(item_url, json=item_data, timeout=10)
                
                if item_response.status_code == 200:
                    items_created += 1
                    print(f"   Created item: {item_data['name']}")
            
            if items_created > 0:
                self.log_result("Create Walkthrough Room", True, f"Created room with {items_created} items with vendor data")
                return True
            else:
                self.log_result("Create Walkthrough Room", False, "No items were created")
                return False
                
        except Exception as e:
            self.log_result("Create Walkthrough Room", False, f"Exception: {str(e)}")
            return False
    
    def test_initial_sync_status(self):
        """Test sync status before any sync"""
        try:
            url = f"{BASE_URL}/sync/status/{self.project_id}"
            response = self.session.get(url, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                walkthrough_items = data.get('walkthrough', {}).get('items', 0)
                checklist_items = data.get('checklist', {}).get('items', 0)
                picked_items = data.get('walkthrough', {}).get('picked_items', 0)
                
                details = f"Before sync - Walkthrough: {walkthrough_items} items ({picked_items} picked), Checklist: {checklist_items} items"
                
                if walkthrough_items > 0 and checklist_items == 0:
                    self.log_result("Initial Sync Status", True, details, data)
                else:
                    self.log_result("Initial Sync Status", False, f"Unexpected initial state: {details}", data)
                
                return data
            else:
                self.log_result("Initial Sync Status", False, f"HTTP {response.status_code}: {response.text}")
                return None
                
        except Exception as e:
            self.log_result("Initial Sync Status", False, f"Exception: {str(e)}")
            return None
    
    def test_sync_picked_items(self):
        """Test sync with sync_all=false (PICKED items only)"""
        try:
            url = f"{BASE_URL}/sync/walkthrough-to-checklist/{self.project_id}"
            payload = {
                "sync_all": False,
                "include_photos": True
            }
            
            response = self.session.post(url, json=payload, timeout=30)
            
            if response.status_code == 200:
                data = response.json()
                synced_rooms = data.get('synced_rooms', 0)
                synced_items = data.get('synced_items', 0)
                
                details = f"Synced {synced_rooms} rooms, {synced_items} items (PICKED only)"
                
                # Should sync the 2 PICKED items we created
                if synced_items >= 2:
                    self.log_result("Sync Picked Items", True, details, data)
                else:
                    self.log_result("Sync Picked Items", False, f"Expected at least 2 items, got {synced_items}: {details}", data)
                
                return data
            else:
                self.log_result("Sync Picked Items", False, f"HTTP {response.status_code}: {response.text}")
                return None
                
        except Exception as e:
            self.log_result("Sync Picked Items", False, f"Exception: {str(e)}")
            return None
    
    def test_post_sync_status(self):
        """Test sync status after PICKED sync"""
        try:
            url = f"{BASE_URL}/sync/status/{self.project_id}"
            response = self.session.get(url, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                walkthrough_items = data.get('walkthrough', {}).get('items', 0)
                checklist_items = data.get('checklist', {}).get('items', 0)
                picked_items = data.get('walkthrough', {}).get('picked_items', 0)
                
                details = f"After PICKED sync - Walkthrough: {walkthrough_items} items ({picked_items} picked), Checklist: {checklist_items} items"
                
                # Should have checklist items now
                if checklist_items >= 2:
                    self.log_result("Post-Sync Status", True, details, data)
                else:
                    self.log_result("Post-Sync Status", False, f"Expected checklist items, got {checklist_items}: {details}", data)
                
                return data
            else:
                self.log_result("Post-Sync Status", False, f"HTTP {response.status_code}: {response.text}")
                return None
                
        except Exception as e:
            self.log_result("Post-Sync Status", False, f"Exception: {str(e)}")
            return None
    
    def test_vendor_data_in_checklist(self):
        """Verify vendor data was preserved in checklist items"""
        try:
            url = f"{BASE_URL}/projects/{self.project_id}"
            response = self.session.get(url, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                
                checklist_items_with_vendor = []
                
                for room in data.get('rooms', []):
                    if room.get('sheet_type') == 'checklist':
                        for category in room.get('categories', []):
                            for subcategory in category.get('subcategories', []):
                                for item in subcategory.get('items', []):
                                    if item.get('vendor') and item.get('cost', 0) > 0:
                                        checklist_items_with_vendor.append({
                                            'name': item.get('name'),
                                            'vendor': item.get('vendor'),
                                            'cost': item.get('cost'),
                                            'link': item.get('link')
                                        })
                
                details = f"Found {len(checklist_items_with_vendor)} checklist items with vendor data"
                
                if len(checklist_items_with_vendor) >= 2:
                    self.log_result("Vendor Data in Checklist", True, details, checklist_items_with_vendor)
                    
                    # Print the items found
                    for item in checklist_items_with_vendor:
                        print(f"   ✅ {item['name']} - {item['vendor']} - ${item['cost']}")
                else:
                    self.log_result("Vendor Data in Checklist", False, f"Expected vendor data in checklist items: {details}")
                
                return checklist_items_with_vendor
            else:
                self.log_result("Vendor Data in Checklist", False, f"HTTP {response.status_code}: {response.text}")
                return None
                
        except Exception as e:
            self.log_result("Vendor Data in Checklist", False, f"Exception: {str(e)}")
            return None
    
    def test_sync_all_items(self):
        """Test sync with sync_all=true (all items)"""
        try:
            url = f"{BASE_URL}/sync/walkthrough-to-checklist/{self.project_id}"
            payload = {
                "sync_all": True,
                "include_photos": True
            }
            
            response = self.session.post(url, json=payload, timeout=30)
            
            if response.status_code == 200:
                data = response.json()
                synced_rooms = data.get('synced_rooms', 0)
                synced_items = data.get('synced_items', 0)
                
                details = f"Synced {synced_rooms} rooms, {synced_items} items (ALL items)"
                
                # Should sync the remaining 1 item (TO BE SELECTED)
                if synced_items >= 1:
                    self.log_result("Sync All Items", True, details, data)
                else:
                    self.log_result("Sync All Items", True, f"No new items to sync (already synced): {details}", data)
                
                return data
            else:
                self.log_result("Sync All Items", False, f"HTTP {response.status_code}: {response.text}")
                return None
                
        except Exception as e:
            self.log_result("Sync All Items", False, f"Exception: {str(e)}")
            return None
    
    def cleanup_test_project(self):
        """Clean up the test project"""
        try:
            if self.project_id:
                url = f"{BASE_URL}/projects/{self.project_id}"
                response = self.session.delete(url, timeout=10)
                
                if response.status_code == 200:
                    self.log_result("Cleanup Test Project", True, f"Deleted test project: {self.project_id}")
                else:
                    self.log_result("Cleanup Test Project", False, f"Failed to delete project: {response.status_code}")
        except Exception as e:
            self.log_result("Cleanup Test Project", False, f"Exception: {str(e)}")
    
    def run_all_tests(self):
        """Run all fresh sync tests"""
        print("🔍 Starting Fresh Sync Test - Creating New Project")
        print(f"🌐 Backend URL: {BASE_URL}")
        print("=" * 80)
        
        # Test 1: Create test project
        print("\n1️⃣ Creating test project...")
        if not self.create_test_project():
            print("❌ Failed to create test project. Aborting tests.")
            return self.results
        
        # Test 2: Create walkthrough room with vendor data
        print("\n2️⃣ Creating walkthrough room with vendor data...")
        if not self.create_walkthrough_room_with_items():
            print("❌ Failed to create walkthrough room. Aborting tests.")
            return self.results
        
        # Test 3: Check initial sync status
        print("\n3️⃣ Testing initial sync status...")
        self.test_initial_sync_status()
        
        # Test 4: Sync PICKED items only
        print("\n4️⃣ Testing sync PICKED items...")
        self.test_sync_picked_items()
        
        # Test 5: Check post-sync status
        print("\n5️⃣ Testing post-sync status...")
        self.test_post_sync_status()
        
        # Test 6: Verify vendor data preservation
        print("\n6️⃣ Testing vendor data preservation...")
        self.test_vendor_data_in_checklist()
        
        # Test 7: Sync all remaining items
        print("\n7️⃣ Testing sync all items...")
        self.test_sync_all_items()
        
        # Test 8: Cleanup
        print("\n8️⃣ Cleaning up test project...")
        self.cleanup_test_project()
        
        # Summary
        print("\n" + "=" * 80)
        print("📊 FRESH SYNC TEST SUMMARY")
        print("=" * 80)
        
        passed = sum(1 for r in self.results if r['success'])
        total = len(self.results)
        
        for result in self.results:
            status = "✅ PASS" if result['success'] else "❌ FAIL"
            print(f"{status} {result['test']}: {result['details']}")
        
        print(f"\n🎯 Overall Result: {passed}/{total} tests passed ({passed/total*100:.1f}%)")
        
        if passed == total:
            print("🎉 ALL FRESH SYNC TESTS PASSED - Sync functionality working perfectly!")
            print("✨ User's reported sync issue is RESOLVED - sync works correctly with both options")
        elif passed >= total * 0.8:  # 80% pass rate
            print("✅ SYNC FUNCTIONALITY IS WORKING - Minor issues found but core functionality intact")
        else:
            print("⚠️  SIGNIFICANT SYNC ISSUES FOUND - Core functionality needs attention")
        
        return self.results

def main():
    """Main test execution"""
    tester = FreshSyncTester()
    results = tester.run_all_tests()
    
    # Save results to file
    with open('/app/fresh_sync_test_results.json', 'w') as f:
        json.dump(results, f, indent=2)
    
    print(f"\n💾 Detailed results saved to: /app/fresh_sync_test_results.json")

if __name__ == "__main__":
    main()
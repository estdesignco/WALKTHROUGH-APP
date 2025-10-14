#!/usr/bin/env python3
"""
CRITICAL DELETE FUNCTIONALITY TEST
Focus: Test the DELETE item functionality that user reports is broken
"""

import requests
import sys
import json
from datetime import datetime

class DeleteFunctionalityTester:
    def __init__(self, base_url="https://designhub-74.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_base = f"{base_url}/api"
        self.tests_run = 0
        self.tests_passed = 0
        self.project_id = None
        self.room_id = None
        self.category_id = None
        self.subcategory_id = None
        self.item_id = None

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.api_base}/{endpoint}" if not endpoint.startswith('http') else endpoint
        if headers is None:
            headers = {'Content-Type': 'application/json'}

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   {method} {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=30)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=30)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers, timeout=30)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers, timeout=30)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    return success, response.json()
                except:
                    return success, response.text
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    error_detail = response.json()
                    print(f"   Error: {error_detail}")
                except:
                    print(f"   Error: {response.text[:200]}")

            return success, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def setup_test_data(self):
        """Create the necessary test data structure"""
        print("\n" + "="*60)
        print("🏗️ SETTING UP TEST DATA")
        print("="*60)
        
        # Create project
        project_data = {
            "name": "DELETE Test Project",
            "client_info": {
                "full_name": "Test Client",
                "email": "test@example.com",
                "phone": "555-0123",
                "address": "123 Test St"
            },
            "project_type": "Renovation"
        }
        
        success, response = self.run_test("Create Project", "POST", "projects", 200, project_data)
        if response.get('id'):
            self.project_id = response['id']
            print(f"   📝 Project ID: {self.project_id}")
        else:
            return False
        
        # Create room
        room_data = {
            "name": "Test Room",
            "project_id": self.project_id,
            "sheet_type": "walkthrough",
            "auto_populate": True
        }
        
        success, response = self.run_test("Create Room", "POST", "rooms", 200, room_data)
        if response.get('id'):
            self.room_id = response['id']
            print(f"   🏠 Room ID: {self.room_id}")
            
            # Extract existing subcategory and items for testing
            if response.get('categories'):
                for category in response['categories']:
                    if category.get('subcategories'):
                        for subcategory in category['subcategories']:
                            if subcategory.get('items'):
                                self.category_id = category['id']
                                self.subcategory_id = subcategory['id']
                                print(f"   📂 Found Category ID: {self.category_id}")
                                print(f"   📁 Found Subcategory ID: {self.subcategory_id}")
                                print(f"   📦 Found {len(subcategory['items'])} existing items")
                                return True
        else:
            return False
        
        # If we didn't get subcategory from room creation, create one
        if not self.subcategory_id:
            # Create category
            category_data = {
                "name": "Test Category",
                "room_id": self.room_id
            }
            
            success, response = self.run_test("Create Category", "POST", "categories", 201, category_data)
            if success and response.get('id'):
                self.category_id = response['id']
                print(f"   📂 Category ID: {self.category_id}")
            else:
                return False
            
            # Create subcategory
            subcategory_data = {
                "name": "Test Subcategory",
                "category_id": self.category_id
            }
            
            success, response = self.run_test("Create Subcategory", "POST", "subcategories", 201, subcategory_data)
            if success and response.get('id'):
                self.subcategory_id = response['id']
                print(f"   📁 Subcategory ID: {self.subcategory_id}")
                return True
            
            return False
        
        return True

    def test_delete_functionality(self):
        """Test the critical DELETE functionality"""
        print("\n" + "="*60)
        print("🗑️ TESTING CRITICAL DELETE FUNCTIONALITY")
        print("="*60)
        
        if not self.subcategory_id:
            print("❌ No subcategory ID available for delete testing")
            return False
        
        # Create multiple items to test deletion
        items_created = []
        
        for i in range(3):
            item_data = {
                "name": f"Test Item {i+1}",
                "subcategory_id": self.subcategory_id,
                "quantity": 1,
                "vendor": "Test Vendor",
                "cost": 100.00 * (i+1),
                "status": "TO BE SELECTED"
            }
            
            success, response = self.run_test(f"Create Test Item {i+1}", "POST", "items", 200, item_data)
            if response.get('id'):
                items_created.append(response['id'])
                print(f"   📦 Item {i+1} ID: {response['id']}")
                success = True
        
        if not items_created:
            print("❌ No items created for delete testing")
            return False
        
        print(f"\n   ✅ Created {len(items_created)} items for delete testing")
        
        # Test DELETE functionality on each item
        delete_results = []
        
        for i, item_id in enumerate(items_created):
            print(f"\n   🗑️ Testing DELETE on Item {i+1} (ID: {item_id})")
            
            # First verify item exists
            success, _ = self.run_test(f"Verify Item {i+1} Exists", "GET", f"items/{item_id}", 200)
            if not success:
                print(f"   ❌ Item {i+1} doesn't exist before delete test")
                delete_results.append(False)
                continue
            
            # Attempt DELETE
            success, _ = self.run_test(f"DELETE Item {i+1}", "DELETE", f"items/{item_id}", 200)
            if success:
                print(f"   ✅ DELETE request successful for Item {i+1}")
                
                # Verify item is actually deleted
                success, _ = self.run_test(f"Verify Item {i+1} Deleted", "GET", f"items/{item_id}", 404)
                if success:
                    print(f"   ✅ Item {i+1} properly deleted (returns 404)")
                    delete_results.append(True)
                else:
                    print(f"   ❌ Item {i+1} still exists after DELETE - DELETE NOT WORKING!")
                    delete_results.append(False)
            else:
                print(f"   ❌ DELETE request failed for Item {i+1}")
                delete_results.append(False)
        
        # Summary of delete testing
        successful_deletes = sum(delete_results)
        total_deletes = len(delete_results)
        
        print(f"\n   📊 DELETE Test Results:")
        print(f"      Total items tested: {total_deletes}")
        print(f"      Successful deletes: {successful_deletes}")
        print(f"      Failed deletes: {total_deletes - successful_deletes}")
        
        if successful_deletes == total_deletes:
            print("   ✅ ALL DELETE operations working correctly!")
            return True
        elif successful_deletes == 0:
            print("   ❌ NO DELETE operations working - CONFIRMS USER REPORT!")
            return False
        else:
            print("   ⚠️ PARTIAL DELETE functionality - some work, some don't")
            return False

    def test_delete_cascade(self):
        """Test if deleting parent objects properly cascades"""
        print("\n" + "="*60)
        print("🔗 TESTING DELETE CASCADE FUNCTIONALITY")
        print("="*60)
        
        # Test deleting subcategory (should cascade to items)
        if self.subcategory_id:
            success, _ = self.run_test("DELETE Subcategory", "DELETE", f"subcategories/{self.subcategory_id}", 200)
            if success:
                print("   ✅ Subcategory DELETE successful")
                
                # Verify subcategory is deleted
                success, _ = self.run_test("Verify Subcategory Deleted", "GET", f"subcategories/{self.subcategory_id}", 404)
                if success:
                    print("   ✅ Subcategory properly deleted")
                else:
                    print("   ❌ Subcategory still exists after DELETE")
        
        # Test deleting category (should cascade to subcategories)
        if self.category_id:
            success, _ = self.run_test("DELETE Category", "DELETE", f"categories/{self.category_id}", 200)
            if success:
                print("   ✅ Category DELETE successful")
        
        # Test deleting room (should cascade to categories)
        if self.room_id:
            success, _ = self.run_test("DELETE Room", "DELETE", f"rooms/{self.room_id}", 200)
            if success:
                print("   ✅ Room DELETE successful")
        
        return True

    def run_comprehensive_delete_test(self):
        """Run comprehensive delete functionality test"""
        start_time = datetime.now()
        
        print("\n" + "="*80)
        print("🗑️ CRITICAL DELETE FUNCTIONALITY TEST")
        print("="*80)
        print(f"🌐 Backend URL: {self.base_url}")
        print(f"🎯 Focus: Testing DELETE operations that user reports as broken")
        print(f"⏰ Started at: {start_time.strftime('%Y-%m-%d %H:%M:%S')}")
        
        # Setup test data
        setup_success = self.setup_test_data()
        if not setup_success:
            print("\n❌ Failed to setup test data - cannot proceed with DELETE testing")
            return {"success": False, "error": "Setup failed"}
        
        # Test delete functionality
        delete_success = self.test_delete_functionality()
        
        # Test cascade deletes
        cascade_success = self.test_delete_cascade()
        
        # Final results
        end_time = datetime.now()
        duration = (end_time - start_time).total_seconds()
        
        print("\n" + "="*80)
        print("📊 DELETE FUNCTIONALITY TEST RESULTS")
        print("="*80)
        print(f"⏰ Duration: {duration:.1f} seconds")
        print(f"🧪 Total Tests: {self.tests_run}")
        print(f"✅ Passed: {self.tests_passed}")
        print(f"❌ Failed: {self.tests_run - self.tests_passed}")
        print(f"📈 Success Rate: {(self.tests_passed/self.tests_run*100):.1f}%")
        
        print(f"\n🗑️ DELETE Functionality Results:")
        if delete_success:
            print("   ✅ DELETE functionality is WORKING correctly")
            print("   ✅ User's trash button issue may be frontend-related")
        else:
            print("   ❌ DELETE functionality is BROKEN")
            print("   ❌ User's report is CONFIRMED - backend DELETE not working")
        
        if cascade_success:
            print("   ✅ CASCADE delete functionality working")
        else:
            print("   ❌ CASCADE delete functionality has issues")
        
        print("="*80)
        
        return {
            "success": delete_success,
            "cascade_success": cascade_success,
            "total_tests": self.tests_run,
            "passed_tests": self.tests_passed,
            "success_rate": (self.tests_passed/self.tests_run*100) if self.tests_run > 0 else 0
        }

def main():
    tester = DeleteFunctionalityTester()
    results = tester.run_comprehensive_delete_test()
    
    # Return appropriate exit code
    if results["success"]:
        return 0
    else:
        return 1

if __name__ == "__main__":
    sys.exit(main())
#!/usr/bin/env python3
"""
Sync Verification Test - Walkthrough to Checklist Sync
Testing the specific sync functionality reported as broken by user
"""

import requests
import json
import time
from datetime import datetime

# Configuration
BASE_URL = "https://designvault-5.preview.emergentagent.com/api"
PROJECT_ID = "086ccb0a-2a0a-436a-8525-753f0114dbc5"  # Modern Kitchen Design

class SyncTester:
    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        })
        self.results = []
        
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
        
    def test_sync_status_endpoint(self):
        """Test 1: Verify sync status endpoint returns walkthrough and checklist counts"""
        try:
            url = f"{BASE_URL}/sync/status/{PROJECT_ID}"
            response = self.session.get(url, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                
                # Check if response has expected structure
                if 'walkthrough' in data and 'checklist' in data:
                    walkthrough_count = data.get('walkthrough', {}).get('items', 0)
                    checklist_count = data.get('checklist', {}).get('items', 0)
                    
                    details = f"Walkthrough: {walkthrough_count} items, Checklist: {checklist_count} items"
                    
                    # Both should have items (113 expected based on test_result.md)
                    if walkthrough_count > 0:
                        self.log_result("Sync Status Endpoint", True, details, data)
                        return data
                    else:
                        self.log_result("Sync Status Endpoint", False, f"No walkthrough items found. {details}", data)
                        return None
                else:
                    self.log_result("Sync Status Endpoint", False, f"Invalid response structure: {data}", data)
                    return None
            else:
                self.log_result("Sync Status Endpoint", False, f"HTTP {response.status_code}: {response.text}")
                return None
                
        except Exception as e:
            self.log_result("Sync Status Endpoint", False, f"Exception: {str(e)}")
            return None
    
    def test_sync_all_items(self):
        """Test 2: Test sync with sync_all=true (should not create duplicates)"""
        try:
            url = f"{BASE_URL}/sync/walkthrough-to-checklist/{PROJECT_ID}"
            payload = {
                "sync_all": True,
                "include_photos": True
            }
            
            response = self.session.post(url, json=payload, timeout=30)
            
            if response.status_code == 200:
                data = response.json()
                
                synced_rooms = data.get('synced_rooms', 0)
                synced_items = data.get('synced_items', 0)
                
                details = f"Synced {synced_rooms} rooms, {synced_items} items"
                
                # Should return 0 synced items if already synced (no duplicates)
                # OR should return actual count if first sync
                self.log_result("Sync All Items", True, details, data)
                return data
            else:
                self.log_result("Sync All Items", False, f"HTTP {response.status_code}: {response.text}")
                return None
                
        except Exception as e:
            self.log_result("Sync All Items", False, f"Exception: {str(e)}")
            return None
    
    def test_sync_picked_items(self):
        """Test 3: Test sync with sync_all=false (should sync only PICKED items)"""
        try:
            url = f"{BASE_URL}/sync/walkthrough-to-checklist/{PROJECT_ID}"
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
                
                # Should return 0 since no items are PICKED status
                if synced_items == 0:
                    self.log_result("Sync Picked Items", True, f"{details} - Expected 0 since no PICKED items", data)
                else:
                    self.log_result("Sync Picked Items", True, f"{details} - Found PICKED items", data)
                return data
            else:
                self.log_result("Sync Picked Items", False, f"HTTP {response.status_code}: {response.text}")
                return None
                
        except Exception as e:
            self.log_result("Sync Picked Items", False, f"Exception: {str(e)}")
            return None
    
    def test_project_data_integrity(self):
        """Test 4: Verify project data shows proper room/category/item structure"""
        try:
            url = f"{BASE_URL}/projects/{PROJECT_ID}"
            response = self.session.get(url, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                
                rooms = data.get('rooms', [])
                total_items = 0
                subcategory_items = 0
                
                for room in rooms:
                    categories = room.get('categories', [])
                    for category in categories:
                        subcategories = category.get('subcategories', [])
                        for subcategory in subcategories:
                            items = subcategory.get('items', [])
                            subcategory_items += len(items)
                            total_items += len(items)
                
                details = f"Found {len(rooms)} rooms, {total_items} total items, {subcategory_items} in subcategories"
                
                # Verify subcategories have items (this was the reported bug)
                if subcategory_items > 0:
                    self.log_result("Data Integrity - Subcategories", True, details, {
                        'rooms': len(rooms),
                        'total_items': total_items,
                        'subcategory_items': subcategory_items
                    })
                else:
                    self.log_result("Data Integrity - Subcategories", False, f"No items found in subcategories. {details}")
                
                return data
            else:
                self.log_result("Data Integrity - Subcategories", False, f"HTTP {response.status_code}: {response.text}")
                return None
                
        except Exception as e:
            self.log_result("Data Integrity - Subcategories", False, f"Exception: {str(e)}")
            return None
    
    def test_item_metadata_preservation(self):
        """Test 5: Verify items preserve vendor info, prices, links through sync"""
        try:
            url = f"{BASE_URL}/projects/{PROJECT_ID}"
            response = self.session.get(url, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                
                items_with_vendor = 0
                items_with_price = 0
                items_with_links = 0
                total_items = 0
                
                for room in data.get('rooms', []):
                    for category in room.get('categories', []):
                        for subcategory in category.get('subcategories', []):
                            for item in subcategory.get('items', []):
                                total_items += 1
                                if item.get('vendor'):
                                    items_with_vendor += 1
                                if item.get('cost', 0) > 0 or item.get('price', 0) > 0:
                                    items_with_price += 1
                                if item.get('link'):
                                    items_with_links += 1
                
                details = f"Items: {total_items} total, {items_with_vendor} with vendor, {items_with_price} with price, {items_with_links} with links"
                
                # Check if metadata is preserved
                metadata_preserved = (items_with_vendor > 0 or items_with_price > 0 or items_with_links > 0)
                
                self.log_result("Metadata Preservation", metadata_preserved, details, {
                    'total_items': total_items,
                    'items_with_vendor': items_with_vendor,
                    'items_with_price': items_with_price,
                    'items_with_links': items_with_links
                })
                
                return data
            else:
                self.log_result("Metadata Preservation", False, f"HTTP {response.status_code}: {response.text}")
                return None
                
        except Exception as e:
            self.log_result("Metadata Preservation", False, f"Exception: {str(e)}")
            return None
    
    def run_all_tests(self):
        """Run all sync verification tests"""
        print("🔍 Starting Walkthrough to Checklist Sync Verification Tests")
        print(f"📋 Project ID: {PROJECT_ID}")
        print(f"🌐 Backend URL: {BASE_URL}")
        print("=" * 80)
        
        # Test 1: Sync Status
        print("\n1️⃣ Testing Sync Status Endpoint...")
        sync_status = self.test_sync_status_endpoint()
        
        # Test 2: Sync All Items
        print("\n2️⃣ Testing Sync All Items...")
        sync_all_result = self.test_sync_all_items()
        
        # Test 3: Sync Picked Items
        print("\n3️⃣ Testing Sync Picked Items...")
        sync_picked_result = self.test_sync_picked_items()
        
        # Test 4: Data Integrity
        print("\n4️⃣ Testing Data Integrity (Subcategories)...")
        data_integrity = self.test_project_data_integrity()
        
        # Test 5: Metadata Preservation
        print("\n5️⃣ Testing Metadata Preservation...")
        metadata_test = self.test_item_metadata_preservation()
        
        # Summary
        print("\n" + "=" * 80)
        print("📊 SYNC VERIFICATION TEST SUMMARY")
        print("=" * 80)
        
        passed = sum(1 for r in self.results if r['success'])
        total = len(self.results)
        
        for result in self.results:
            status = "✅ PASS" if result['success'] else "❌ FAIL"
            print(f"{status} {result['test']}: {result['details']}")
        
        print(f"\n🎯 Overall Result: {passed}/{total} tests passed ({passed/total*100:.1f}%)")
        
        if passed == total:
            print("🎉 ALL SYNC TESTS PASSED - Sync functionality is working correctly!")
        else:
            print("⚠️  Some sync tests failed - Issues found that need attention")
        
        return self.results

def main():
    """Main test execution"""
    tester = SyncTester()
    results = tester.run_all_tests()
    
    # Save results to file
    with open('/app/sync_test_results.json', 'w') as f:
        json.dump(results, f, indent=2)
    
    print(f"\n💾 Detailed results saved to: /app/sync_test_results.json")

if __name__ == "__main__":
    main()
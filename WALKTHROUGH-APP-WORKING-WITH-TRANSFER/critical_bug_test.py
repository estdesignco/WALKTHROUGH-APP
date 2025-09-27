#!/usr/bin/env python3
"""
Critical Bug Testing Suite for FF&E System
Focuses on specific issues reported in the review request:
1. Scraping not working with wholesale vendor URLs
2. Dropdown colors not showing
3. Missing delivery status options
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
PROJECT_ID = "bb060596-85c2-455f-860a-cf9fa23dfacf"

print(f"🔍 CRITICAL BUG TESTING - FF&E System")
print(f"Testing Backend APIs at: {BASE_URL}")
print(f"Using Project ID: {PROJECT_ID}")

class CriticalBugTester:
    def __init__(self):
        self.session = requests.Session()
        self.test_results = []
        self.critical_issues = []
        
    def log_test(self, test_name: str, success: bool, details: str = "", is_critical: bool = False):
        """Log test results"""
        status = "✅ PASS" if success else "❌ FAIL"
        critical_marker = " 🚨 CRITICAL" if is_critical else ""
        print(f"{status} {test_name}{critical_marker}")
        if details:
            print(f"   Details: {details}")
        
        self.test_results.append({
            'test': test_name,
            'success': success,
            'details': details,
            'critical': is_critical
        })
        
        if not success and is_critical:
            self.critical_issues.append({
                'test': test_name,
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

    def test_scraping_wholesale_vendors(self):
        """CRITICAL: Test scraping with real wholesale vendor URLs"""
        print("\n🚨 === CRITICAL ISSUE 1: SCRAPING NOT WORKING ===")
        
        # Test with actual wholesale vendor URLs that should work
        wholesale_test_urls = [
            {
                "url": "https://fourhands.com/product/248067-003",
                "vendor_name": "Four Hands",
                "product_name": "Fenn Chair",
                "description": "User reported this specific URL - Fenn Chair Champagne Mongolian Fur"
            },
            {
                "url": "https://visualcomfort.com/tob5004pn-l",
                "vendor_name": "Visual Comfort",
                "product_name": "Visual Comfort Product",
                "description": "Major wholesale lighting vendor"
            },
            {
                "url": "https://uttermost.com/product/24278",
                "vendor_name": "Uttermost",
                "product_name": "Uttermost Product",
                "description": "Wholesale furniture and decor vendor"
            },
            {
                "url": "https://bernhardt.com/product/373-541",
                "vendor_name": "Bernhardt",
                "product_name": "Bernhardt Furniture",
                "description": "High-end furniture manufacturer"
            }
        ]
        
        scraping_working = True
        detailed_results = []
        
        for test_case in wholesale_test_urls:
            print(f"\n--- Testing: {test_case['description']} ---")
            print(f"URL: {test_case['url']}")
            
            scrape_data = {"url": test_case["url"]}
            success, data, status_code = self.make_request('POST', '/scrape-product', scrape_data)
            
            print(f"Status Code: {status_code}")
            print(f"Request Success: {success}")
            
            if not success:
                scraping_working = False
                error_msg = f"Failed to scrape {test_case['vendor_name']}: {data} (Status: {status_code})"
                detailed_results.append(f"❌ {test_case['vendor_name']}: {error_msg}")
                self.log_test(f"Scrape {test_case['vendor_name']}", False, error_msg, is_critical=True)
                continue
            
            # Check response structure
            if not isinstance(data, dict) or 'data' not in data:
                scraping_working = False
                error_msg = f"Invalid response structure from {test_case['vendor_name']}: {data}"
                detailed_results.append(f"❌ {test_case['vendor_name']}: {error_msg}")
                self.log_test(f"Scrape {test_case['vendor_name']} Structure", False, error_msg, is_critical=True)
                continue
            
            # Analyze extracted data
            product_data = data.get('data', {})
            expected_fields = ['name', 'price', 'vendor', 'image_url', 'description', 'sku', 'size', 'color']
            
            populated_fields = []
            for field in expected_fields:
                value = product_data.get(field, '')
                if value and str(value).strip():
                    populated_fields.append(field)
            
            # Check vendor detection
            detected_vendor = product_data.get('vendor', '')
            vendor_correct = detected_vendor == test_case['vendor_name']
            
            # Check if we got meaningful product data
            has_product_name = bool(product_data.get('name', '').strip())
            
            print(f"   Detected Vendor: {detected_vendor}")
            print(f"   Product Name: {product_data.get('name', 'None')}")
            print(f"   Populated Fields: {len(populated_fields)}/{len(expected_fields)} ({populated_fields})")
            
            # Determine if this scraping attempt was successful
            if vendor_correct and has_product_name:
                detailed_results.append(f"✅ {test_case['vendor_name']}: Vendor detected, product name extracted")
                self.log_test(f"Scrape {test_case['vendor_name']}", True, f"Extracted {len(populated_fields)} fields, vendor detected correctly")
            elif vendor_correct:
                detailed_results.append(f"⚠️ {test_case['vendor_name']}: Vendor detected but no product name")
                self.log_test(f"Scrape {test_case['vendor_name']}", False, f"Vendor detected but no product data extracted", is_critical=True)
                scraping_working = False
            elif has_product_name:
                detailed_results.append(f"⚠️ {test_case['vendor_name']}: Product name found but vendor not detected")
                self.log_test(f"Scrape {test_case['vendor_name']}", False, f"Product data found but vendor detection failed", is_critical=True)
                scraping_working = False
            else:
                detailed_results.append(f"❌ {test_case['vendor_name']}: No meaningful data extracted")
                self.log_test(f"Scrape {test_case['vendor_name']}", False, f"No product data or vendor detected", is_critical=True)
                scraping_working = False
            
            print(f"Raw response: {json.dumps(data, indent=2)}")
            print("-" * 60)
        
        # Overall scraping assessment
        if scraping_working:
            self.log_test("CRITICAL: Wholesale Vendor Scraping", True, "All wholesale vendor URLs scraped successfully")
        else:
            self.log_test("CRITICAL: Wholesale Vendor Scraping", False, f"Scraping issues found: {'; '.join(detailed_results)}", is_critical=True)
        
        return scraping_working

    def test_dropdown_colors_backend(self):
        """CRITICAL: Test dropdown color functions and data"""
        print("\n🚨 === CRITICAL ISSUE 2: DROPDOWN COLORS NOT SHOWING ===")
        
        colors_working = True
        
        # Test enhanced item statuses with colors
        print("\n--- Testing Item Status Colors ---")
        success, statuses_data, status_code = self.make_request('GET', '/item-statuses-enhanced')
        
        if not success:
            self.log_test("CRITICAL: Status Colors Endpoint", False, f"Enhanced status endpoint failed: {statuses_data} (Status: {status_code})", is_critical=True)
            colors_working = False
        else:
            # Handle wrapped response format
            actual_data = statuses_data.get('data', statuses_data) if isinstance(statuses_data, dict) else statuses_data
            if isinstance(actual_data, list) and len(actual_data) > 0:
                # Check if statuses have color information
                statuses_with_colors = [s for s in actual_data if isinstance(s, dict) and 'color' in s and s.get('color')]
                
                if len(statuses_with_colors) > 0:
                    self.log_test("Status Colors Data", True, f"Found {len(statuses_with_colors)} statuses with colors")
                    
                    # Test specific color functions mentioned in review
                    key_statuses = ['PICKED', 'ORDERED', 'SHIPPED', 'DELIVERED TO JOB SITE', 'INSTALLED']
                    found_key_statuses = []
                    
                    for status_obj in statuses_with_colors:
                        if status_obj.get('status') in key_statuses:
                            found_key_statuses.append(f"{status_obj['status']} ({status_obj['color']})")
                    
                    if len(found_key_statuses) >= 3:
                        self.log_test("Key Status Colors", True, f"Key statuses with colors: {found_key_statuses}")
                    else:
                        self.log_test("Key Status Colors", False, f"Missing key status colors. Found: {found_key_statuses}", is_critical=True)
                        colors_working = False
                else:
                    self.log_test("Status Colors Data", False, "Status data missing color information", is_critical=True)
                    colors_working = False
            else:
                self.log_test("Status Colors Data", False, f"Invalid status data format: {statuses_data}", is_critical=True)
                colors_working = False
        
        # Test carrier colors
        print("\n--- Testing Carrier Colors ---")
        success, carriers_data, status_code = self.make_request('GET', '/carrier-options')
        
        if not success:
            self.log_test("CRITICAL: Carrier Colors Endpoint", False, f"Carrier options endpoint failed: {carriers_data} (Status: {status_code})", is_critical=True)
            colors_working = False
        else:
            # Handle wrapped response format
            actual_data = carriers_data.get('data', carriers_data) if isinstance(carriers_data, dict) else carriers_data
            if isinstance(actual_data, list) and len(actual_data) > 0:
                # Check if carriers have color information
                carriers_with_colors = [c for c in actual_data if isinstance(c, dict) and 'color' in c and c.get('color')]
                
                if len(carriers_with_colors) > 0:
                    self.log_test("Carrier Colors Data", True, f"Found {len(carriers_with_colors)} carriers with colors")
                    
                    # Test specific carriers
                    key_carriers = ['FedEx', 'UPS', 'Brooks', 'Zenith']
                    found_key_carriers = []
                    
                    for carrier_obj in carriers_with_colors:
                        if carrier_obj.get('name') in key_carriers:
                            found_key_carriers.append(f"{carrier_obj['name']} ({carrier_obj['color']})")
                    
                    if len(found_key_carriers) >= 2:
                        self.log_test("Key Carrier Colors", True, f"Key carriers with colors: {found_key_carriers}")
                    else:
                        self.log_test("Key Carrier Colors", False, f"Missing key carrier colors. Found: {found_key_carriers}", is_critical=True)
                        colors_working = False
                else:
                    self.log_test("Carrier Colors Data", False, "Carrier data missing color information", is_critical=True)
                    colors_working = False
            else:
                self.log_test("Carrier Colors Data", False, f"Invalid carrier data format: {carriers_data}", is_critical=True)
                colors_working = False
        
        # Overall color system assessment
        if colors_working:
            self.log_test("CRITICAL: Dropdown Color System", True, "All dropdown color data available from backend")
        else:
            self.log_test("CRITICAL: Dropdown Color System", False, "Dropdown color data missing or incomplete", is_critical=True)
        
        return colors_working

    def test_delivery_status_options(self):
        """CRITICAL: Test delivery status dropdown options"""
        print("\n🚨 === CRITICAL ISSUE 3: MISSING DELIVERY STATUS OPTIONS ===")
        
        delivery_options_complete = True
        
        # Test item statuses for delivery-related options
        success, statuses_data, status_code = self.make_request('GET', '/item-statuses-enhanced')
        
        if not success:
            self.log_test("CRITICAL: Delivery Status Endpoint", False, f"Could not retrieve status options: {statuses_data}", is_critical=True)
            return False
        
        # Extract status names
        actual_data = statuses_data.get('data', statuses_data) if isinstance(statuses_data, dict) else statuses_data
        if isinstance(actual_data, list):
            status_names = []
            for status_obj in actual_data:
                if isinstance(status_obj, dict) and 'status' in status_obj:
                    status_names.append(status_obj['status'])
                elif isinstance(status_obj, str):
                    status_names.append(status_obj)
        else:
            status_names = actual_data if isinstance(actual_data, list) else []
        
        # Check for essential delivery status options
        essential_delivery_statuses = [
            'SHIPPED',
            'IN TRANSIT', 
            'OUT FOR DELIVERY',
            'DELIVERED TO RECEIVER',
            'DELIVERED TO JOB SITE',
            'RECEIVED',
            'READY FOR INSTALL',
            'INSTALLING',
            'INSTALLED'
        ]
        
        missing_statuses = []
        found_statuses = []
        
        for status in essential_delivery_statuses:
            if status in status_names:
                found_statuses.append(status)
            else:
                missing_statuses.append(status)
        
        print(f"Total status options available: {len(status_names)}")
        print(f"Essential delivery statuses found: {len(found_statuses)}/{len(essential_delivery_statuses)}")
        print(f"Found: {found_statuses}")
        
        if missing_statuses:
            print(f"Missing: {missing_statuses}")
            self.log_test("CRITICAL: Essential Delivery Statuses", False, f"Missing delivery statuses: {missing_statuses}", is_critical=True)
            delivery_options_complete = False
        else:
            self.log_test("Essential Delivery Statuses", True, f"All {len(essential_delivery_statuses)} essential delivery statuses found")
        
        # Check for additional useful statuses
        additional_useful_statuses = [
            'BACKORDERED',
            'ON HOLD',
            'DAMAGED',
            'RETURNED',
            'CANCELLED'
        ]
        
        found_additional = [status for status in additional_useful_statuses if status in status_names]
        
        if len(found_additional) >= 3:
            self.log_test("Additional Status Options", True, f"Found additional statuses: {found_additional}")
        else:
            self.log_test("Additional Status Options", False, f"Limited additional status options. Found: {found_additional}")
        
        # Overall delivery status assessment
        if delivery_options_complete:
            self.log_test("CRITICAL: Delivery Status Options", True, f"All essential delivery status options available ({len(found_statuses)} found)")
        else:
            self.log_test("CRITICAL: Delivery Status Options", False, f"Missing essential delivery status options: {missing_statuses}", is_critical=True)
        
        return delivery_options_complete

    def test_dropdown_functionality_integration(self):
        """Test that dropdown data integrates properly with item creation"""
        print("\n=== Testing Dropdown Integration ===")
        
        # Get project data to find a subcategory for testing
        success, project_data, _ = self.make_request('GET', f'/projects/{PROJECT_ID}')
        if not success:
            self.log_test("Integration Test Setup", False, "Could not retrieve project for integration testing")
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
            self.log_test("Integration Test Setup", False, "No subcategory found for integration testing")
            return False
        
        # Test creating an item with dropdown values
        test_item_data = {
            "name": "Integration Test Item",
            "quantity": 1,
            "vendor": "Four Hands",
            "status": "DELIVERED TO JOB SITE",
            "carrier": "FedEx",
            "subcategory_id": subcategory_id,
            "cost": 1500.00
        }
        
        success, item_data, status_code = self.make_request('POST', '/items', test_item_data)
        
        if success:
            item_id = item_data.get('id')
            self.log_test("Dropdown Integration", True, f"Item created successfully with dropdown values: {item_id}")
            
            # Clean up test item
            self.make_request('DELETE', f'/items/{item_id}')
            return True
        else:
            self.log_test("Dropdown Integration", False, f"Failed to create item with dropdown values: {item_data}")
            return False

    def run_critical_bug_tests(self):
        """Run all critical bug tests"""
        print("🚨 Starting Critical Bug Testing for FF&E System")
        print("=" * 60)
        
        # Run critical tests
        scraping_ok = self.test_scraping_wholesale_vendors()
        colors_ok = self.test_dropdown_colors_backend()
        delivery_ok = self.test_delivery_status_options()
        integration_ok = self.test_dropdown_functionality_integration()
        
        # Summary
        print("\n" + "=" * 60)
        print("📊 CRITICAL BUG TEST SUMMARY")
        print("=" * 60)
        
        passed = sum(1 for result in self.test_results if result['success'])
        total = len(self.test_results)
        critical_failed = len(self.critical_issues)
        
        print(f"Total Tests: {total}")
        print(f"Passed: {passed}")
        print(f"Failed: {total - passed}")
        print(f"Critical Issues: {critical_failed}")
        print(f"Success Rate: {(passed/total)*100:.1f}%")
        
        # Critical issues summary
        if self.critical_issues:
            print(f"\n🚨 CRITICAL ISSUES FOUND ({len(self.critical_issues)}):")
            for i, issue in enumerate(self.critical_issues, 1):
                print(f"   {i}. {issue['test']}")
                print(f"      {issue['details']}")
        else:
            print("\n✅ NO CRITICAL ISSUES FOUND!")
        
        # Individual system status
        print(f"\n📋 SYSTEM STATUS:")
        print(f"   🔗 Scraping System: {'✅ WORKING' if scraping_ok else '❌ FAILING'}")
        print(f"   🎨 Dropdown Colors: {'✅ WORKING' if colors_ok else '❌ FAILING'}")
        print(f"   📦 Delivery Status: {'✅ COMPLETE' if delivery_ok else '❌ INCOMPLETE'}")
        print(f"   🔧 Integration: {'✅ WORKING' if integration_ok else '❌ FAILING'}")
        
        # Overall assessment
        all_critical_ok = scraping_ok and colors_ok and delivery_ok and integration_ok
        
        if all_critical_ok:
            print(f"\n🎉 ALL CRITICAL SYSTEMS OPERATIONAL!")
        else:
            print(f"\n⚠️ CRITICAL ISSUES REQUIRE IMMEDIATE ATTENTION!")
        
        return all_critical_ok

if __name__ == "__main__":
    tester = CriticalBugTester()
    success = tester.run_critical_bug_tests()
    sys.exit(0 if success else 1)
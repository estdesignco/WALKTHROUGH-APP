#!/usr/bin/env python3
"""
SCRAPING FUNCTIONALITY DIAGNOSTIC TESTING - REVIEW REQUEST
Quick test of scraping functionality to debug reported issues:

**FOCUS: Test scraping with specific URL to see what's failing**

Test Cases:
1. **Test Enhanced Scraping** - POST /api/scrape-product with https://fourhandshome.com/products/fenn-chair-248067-003
2. **Check Response Structure** - Verify if data fields are properly populated (name, price, size, finish_color, vendor, sku, image_url)
3. **Test Basic URL** - Try with simpler URL like https://www.wayfair.com/furniture/pdp/wade-logan-belinda-armchair-w001239312.html

**SPECIFIC CHECKS:**
- Verify backend endpoint is responding
- Check if Playwright browser is working
- Verify data extraction selectors are finding elements
- Check if fields like size, finish_color are being populated correctly

Quick diagnostic to identify why user reports "scraping does not work" and "size, finish and color are blank".
"""

import requests
import json
import time
from typing import Dict, Any

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
print("🎯 SCRAPING FUNCTIONALITY DIAGNOSTIC TESTING - REVIEW REQUEST")
print("=" * 80)
print(f"Backend URL: {BASE_URL}")
print("Focus: Debug reported scraping issues - 'scraping does not work' and 'size, finish and color are blank'")
print("=" * 80)

class ScrapingDiagnosticTester:
    def __init__(self):
        self.session = requests.Session()
        self.test_results = []
        
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
                response = self.session.get(url, params=params, timeout=30)
            elif method.upper() == 'POST':
                response = self.session.post(url, json=data, timeout=30)
            else:
                return False, f"Unsupported method: {method}", 400
                
            return response.status_code < 400, response.json() if response.content else {}, response.status_code
            
        except requests.exceptions.RequestException as e:
            return False, f"Request failed: {str(e)}", 0
        except json.JSONDecodeError as e:
            return False, f"JSON decode error: {str(e)}", response.status_code if 'response' in locals() else 0
        except Exception as e:
            return False, f"Unexpected error: {str(e)}", 0

    def test_scraping_endpoint_basic(self):
        """Test if scraping endpoint is accessible"""
        print("\n🔍 Testing scraping endpoint accessibility...")
        
        # Test with a simple URL first
        test_data = {"url": "https://example.com"}
        success, data, status_code = self.make_request('POST', '/scrape-product', test_data)
        
        print(f"   URL: https://example.com")
        print(f"   Status Code: {status_code}")
        print(f"   Success: {success}")
        print(f"   Response: {json.dumps(data, indent=2)}")
        
        if success:
            self.log_test("Scraping Endpoint Accessible", True, f"Endpoint responding with status {status_code}")
            return True
        elif status_code == 422:
            self.log_test("Scraping Endpoint Accessible", True, f"Endpoint accessible, validation error (expected): {data}")
            return True
        else:
            self.log_test("Scraping Endpoint Accessible", False, f"Endpoint failed: {data} (Status: {status_code})")
            return False

    def test_four_hands_scraping(self):
        """Test Enhanced Scraping with Four Hands URL as requested"""
        print("\n🎯 Testing Enhanced Scraping - Four Hands URL (Review Request)")
        print("URL: https://fourhandshome.com/products/fenn-chair-248067-003")
        
        # Note: The URL in the review request has a typo - should be fourhands.com not fourhandshome.com
        # Let's test both to be thorough
        test_urls = [
            "https://fourhands.com/product/248067-003",  # Correct URL based on backend vendor detection
            "https://fourhandshome.com/products/fenn-chair-248067-003"  # URL from review request (likely typo)
        ]
        
        for url in test_urls:
            print(f"\n--- Testing URL: {url} ---")
            
            scrape_data = {"url": url}
            success, data, status_code = self.make_request('POST', '/scrape-product', scrape_data)
            
            print(f"   Status Code: {status_code}")
            print(f"   Success: {success}")
            
            if success:
                # Check response format
                if isinstance(data, dict) and 'success' in data and 'data' in data:
                    self.log_test(f"Four Hands Scraping - Response Format ({url})", True, "Correct {success: true, data: {...}} format")
                    
                    # Analyze the data fields - focus on user's reported issues
                    product_data = data.get('data', {})
                    
                    # Check specific fields user mentioned
                    name = product_data.get('name', '')
                    price = product_data.get('price', '')
                    size = product_data.get('size', '')
                    finish_color = product_data.get('finish_color', '') or product_data.get('color', '')
                    vendor = product_data.get('vendor', '')
                    sku = product_data.get('sku', '')
                    image_url = product_data.get('image_url', '')
                    
                    print(f"   📊 EXTRACTED DATA ANALYSIS:")
                    print(f"      Name: '{name}' {'✅' if name else '❌ BLANK'}")
                    print(f"      Price: '{price}' {'✅' if price else '❌ BLANK'}")
                    print(f"      Size: '{size}' {'✅' if size else '❌ BLANK (USER REPORTED ISSUE)'}")
                    print(f"      Finish/Color: '{finish_color}' {'✅' if finish_color else '❌ BLANK (USER REPORTED ISSUE)'}")
                    print(f"      Vendor: '{vendor}' {'✅' if vendor else '❌ BLANK'}")
                    print(f"      SKU: '{sku}' {'✅' if sku else '❌ BLANK'}")
                    print(f"      Image URL: '{image_url}' {'✅' if image_url else '❌ BLANK'}")
                    
                    # Check vendor detection specifically
                    if vendor == "Four Hands":
                        self.log_test(f"Four Hands Vendor Detection ({url})", True, f"Correctly detected: {vendor}")
                    else:
                        self.log_test(f"Four Hands Vendor Detection ({url})", False, f"Expected: Four Hands, Got: {vendor}")
                    
                    # Check user's specific complaints
                    if not size:
                        self.log_test(f"Size Field Population ({url})", False, "Size field is blank - USER REPORTED ISSUE CONFIRMED")
                    else:
                        self.log_test(f"Size Field Population ({url})", True, f"Size field populated: {size}")
                        
                    if not finish_color:
                        self.log_test(f"Finish/Color Field Population ({url})", False, "Finish/Color field is blank - USER REPORTED ISSUE CONFIRMED")
                    else:
                        self.log_test(f"Finish/Color Field Population ({url})", True, f"Finish/Color field populated: {finish_color}")
                    
                    # Overall assessment
                    populated_fields = sum([bool(name), bool(price), bool(size), bool(finish_color), bool(vendor), bool(sku), bool(image_url)])
                    total_fields = 7
                    
                    if populated_fields >= 3:
                        self.log_test(f"Four Hands Data Extraction ({url})", True, f"Extracted {populated_fields}/{total_fields} fields")
                    else:
                        self.log_test(f"Four Hands Data Extraction ({url})", False, f"Only {populated_fields}/{total_fields} fields populated")
                        
                else:
                    self.log_test(f"Four Hands Scraping - Response Format ({url})", False, f"Incorrect response format: {data}")
                    
            else:
                # Check error details
                if status_code == 400:
                    self.log_test(f"Four Hands Scraping ({url})", False, f"Validation error: {data}")
                elif status_code == 500:
                    self.log_test(f"Four Hands Scraping ({url})", False, f"Server error: {data}")
                else:
                    self.log_test(f"Four Hands Scraping ({url})", False, f"Request failed: {data} (Status: {status_code})")
            
            print(f"   Raw response: {json.dumps(data, indent=2)}")
            print("-" * 50)

    def test_wayfair_scraping(self):
        """Test Basic URL - Wayfair as requested"""
        print("\n🎯 Testing Basic URL - Wayfair (Review Request)")
        
        url = "https://www.wayfair.com/furniture/pdp/wade-logan-belinda-armchair-w001239312.html"
        print(f"URL: {url}")
        
        scrape_data = {"url": url}
        success, data, status_code = self.make_request('POST', '/scrape-product', scrape_data)
        
        print(f"   Status Code: {status_code}")
        print(f"   Success: {success}")
        
        if success:
            # Check response format
            if isinstance(data, dict) and 'success' in data and 'data' in data:
                self.log_test("Wayfair Scraping - Response Format", True, "Correct {success: true, data: {...}} format")
                
                # Analyze the data fields
                product_data = data.get('data', {})
                
                name = product_data.get('name', '')
                price = product_data.get('price', '')
                size = product_data.get('size', '')
                finish_color = product_data.get('finish_color', '') or product_data.get('color', '')
                vendor = product_data.get('vendor', '')
                sku = product_data.get('sku', '')
                image_url = product_data.get('image_url', '')
                
                print(f"   📊 WAYFAIR DATA ANALYSIS:")
                print(f"      Name: '{name}' {'✅' if name else '❌ BLANK'}")
                print(f"      Price: '{price}' {'✅' if price else '❌ BLANK'}")
                print(f"      Size: '{size}' {'✅' if size else '❌ BLANK'}")
                print(f"      Finish/Color: '{finish_color}' {'✅' if finish_color else '❌ BLANK'}")
                print(f"      Vendor: '{vendor}' {'✅' if vendor else '❌ BLANK'}")
                print(f"      SKU: '{sku}' {'✅' if sku else '❌ BLANK'}")
                print(f"      Image URL: '{image_url}' {'✅' if image_url else '❌ BLANK'}")
                
                # Check vendor detection
                if vendor == "Wayfair":
                    self.log_test("Wayfair Vendor Detection", True, f"Correctly detected: {vendor}")
                else:
                    self.log_test("Wayfair Vendor Detection", False, f"Expected: Wayfair, Got: {vendor}")
                
                # Overall assessment
                populated_fields = sum([bool(name), bool(price), bool(size), bool(finish_color), bool(vendor), bool(sku), bool(image_url)])
                total_fields = 7
                
                if populated_fields >= 3:
                    self.log_test("Wayfair Data Extraction", True, f"Extracted {populated_fields}/{total_fields} fields")
                else:
                    self.log_test("Wayfair Data Extraction", False, f"Only {populated_fields}/{total_fields} fields populated")
                    
            else:
                self.log_test("Wayfair Scraping - Response Format", False, f"Incorrect response format: {data}")
                
        else:
            # Check error details
            if status_code == 400:
                self.log_test("Wayfair Scraping", False, f"Validation error: {data}")
            elif status_code == 500:
                self.log_test("Wayfair Scraping", False, f"Server error: {data}")
            else:
                self.log_test("Wayfair Scraping", False, f"Request failed: {data} (Status: {status_code})")
        
        print(f"   Raw response: {json.dumps(data, indent=2)}")

    def check_playwright_browser_status(self):
        """Check if Playwright browser is working"""
        print("\n🔍 Checking Playwright Browser Status...")
        
        try:
            import subprocess
            result = subprocess.run(['tail', '-n', '50', '/var/log/supervisor/backend.err.log'], 
                                  capture_output=True, text=True, timeout=10)
            
            if result.returncode == 0:
                log_content = result.stdout
                
                # Look for Playwright-related logs
                playwright_lines = []
                for line in log_content.split('\n'):
                    if 'playwright' in line.lower() or 'browser' in line.lower():
                        playwright_lines.append(line.strip())
                
                if playwright_lines:
                    self.log_test("Playwright Browser Logs", True, f"Found {len(playwright_lines)} browser-related log entries")
                    for line in playwright_lines[-3:]:  # Show last 3
                        print(f"   LOG: {line}")
                else:
                    self.log_test("Playwright Browser Logs", False, "No Playwright/browser logs found in recent entries")
                
                # Look for scraping-related errors
                scraping_errors = []
                for line in log_content.split('\n'):
                    if 'scrape' in line.lower() and ('error' in line.lower() or 'exception' in line.lower()):
                        scraping_errors.append(line.strip())
                
                if scraping_errors:
                    self.log_test("Scraping Errors in Logs", False, f"Found {len(scraping_errors)} scraping errors")
                    for error in scraping_errors[-2:]:  # Show last 2
                        print(f"   ERROR: {error}")
                else:
                    self.log_test("Scraping Errors in Logs", True, "No scraping errors found in recent logs")
                    
            else:
                self.log_test("Backend Logs Access", False, "Could not read backend error logs")
                
        except Exception as e:
            self.log_test("Backend Logs Check", False, f"Exception checking logs: {str(e)}")

    def run_diagnostic_tests(self):
        """Run all diagnostic tests"""
        print("Starting Scraping Diagnostic Tests...")
        
        # Test 1: Basic endpoint accessibility
        endpoint_accessible = self.test_scraping_endpoint_basic()
        
        # Test 2: Four Hands URL (main focus of review request)
        if endpoint_accessible:
            self.test_four_hands_scraping()
        
        # Test 3: Wayfair URL (simpler test case)
        if endpoint_accessible:
            self.test_wayfair_scraping()
        
        # Test 4: Check backend logs for issues
        self.check_playwright_browser_status()
        
        # Summary
        print("\n" + "=" * 80)
        print("📊 DIAGNOSTIC SUMMARY")
        print("=" * 80)
        
        passed_tests = sum(1 for result in self.test_results if result['success'])
        total_tests = len(self.test_results)
        
        print(f"🎯 OVERALL RESULT: {passed_tests}/{total_tests} tests passed")
        
        # Specific findings for user's reported issues
        print("\n🔍 USER REPORTED ISSUES ANALYSIS:")
        
        size_issues = [r for r in self.test_results if 'Size Field' in r['test'] and not r['success']]
        color_issues = [r for r in self.test_results if 'Finish/Color Field' in r['test'] and not r['success']]
        
        if size_issues:
            print("❌ SIZE FIELD ISSUE CONFIRMED: Size fields are blank in scraping results")
        else:
            print("✅ SIZE FIELD: No issues found with size field population")
            
        if color_issues:
            print("❌ FINISH/COLOR FIELD ISSUE CONFIRMED: Finish/Color fields are blank in scraping results")
        else:
            print("✅ FINISH/COLOR FIELD: No issues found with finish/color field population")
        
        # Overall scraping status
        scraping_working = any(r['success'] for r in self.test_results if 'Data Extraction' in r['test'])
        
        if scraping_working:
            print("\n✅ SCRAPING STATUS: Basic scraping functionality is working")
            print("   - Backend endpoint is responding")
            print("   - Some data fields are being populated")
            print("   - Issues appear to be with specific field extraction (size, finish/color)")
        else:
            print("\n❌ SCRAPING STATUS: Scraping functionality has critical issues")
            print("   - May be endpoint, browser, or data extraction problems")
        
        return scraping_working


# Main execution
if __name__ == "__main__":
    tester = ScrapingDiagnosticTester()
    success = tester.run_diagnostic_tests()
    
    if success:
        print("\n🎉 DIAGNOSTIC COMPLETE: Scraping infrastructure is working with some field-specific issues")
        exit(0)
    else:
        print("\n❌ DIAGNOSTIC COMPLETE: Critical scraping issues identified that need resolution")
        exit(1)
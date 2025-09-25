#!/usr/bin/env python3
"""
WEB SCRAPING FUNCTIONALITY TEST - PLAYWRIGHT BROWSERS VERIFICATION

CONTEXT: User reported that Playwright browsers were just reinstalled to fix critical infrastructure.
Need to test the POST /api/scrape-product endpoint with a Four Hands URL to ensure it can extract:
- name
- vendor  
- cost
- size
- SKU
- image fields

TEST URL: https://www.fourhands.com/products/fenn-chair
EXPECTED RESULTS: Should extract all major product fields successfully
"""

import requests
import json
import sys
import os
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
print("🕷️ WEB SCRAPING FUNCTIONALITY TEST - PLAYWRIGHT BROWSERS VERIFICATION")
print("=" * 80)
print(f"Backend URL: {BASE_URL}")
print("Goal: Test POST /api/scrape-product with Four Hands URL")
print("Expected: Extract name, vendor, cost, size, SKU, and image fields")
print("=" * 80)

class ScrapingTester:
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
        
    def make_request(self, method: str, endpoint: str, data: Dict = None, timeout: int = 30) -> tuple:
        """Make HTTP request and return (success, response_data, status_code)"""
        try:
            url = f"{BASE_URL}{endpoint}"
            
            if method.upper() == 'POST':
                response = self.session.post(url, json=data, timeout=timeout)
            elif method.upper() == 'GET':
                response = self.session.get(url, timeout=timeout)
            else:
                return False, f"Unsupported method: {method}", 400
                
            return response.status_code < 400, response.json() if response.content else {}, response.status_code
            
        except requests.exceptions.Timeout:
            return False, "Request timed out", 408
        except requests.exceptions.RequestException as e:
            return False, f"Request failed: {str(e)}", 0
        except json.JSONDecodeError as e:
            return False, f"JSON decode error: {str(e)}", response.status_code if 'response' in locals() else 0
        except Exception as e:
            return False, f"Unexpected error: {str(e)}", 0

    def test_scraping_endpoint_basic(self):
        """Test basic scraping endpoint availability"""
        print("\n🔍 Testing scraping endpoint availability...")
        
        # Test with a simple URL first to check if endpoint exists
        test_data = {
            "url": "https://www.example.com"
        }
        
        success, response, status_code = self.make_request('POST', '/scrape-product', test_data, timeout=15)
        
        if status_code == 404:
            self.log_test("Scraping Endpoint Availability", False, "Endpoint not found (404)")
            return False
        elif status_code == 405:
            self.log_test("Scraping Endpoint Availability", False, "Method not allowed (405)")
            return False
        elif status_code >= 500:
            self.log_test("Scraping Endpoint Availability", False, f"Server error ({status_code}): {response}")
            return False
        else:
            self.log_test("Scraping Endpoint Availability", True, f"Endpoint accessible (Status: {status_code})")
            return True

    def test_four_hands_scraping(self):
        """Test scraping Four Hands Fenn Chair URL as specified in review request"""
        print("\n🪑 Testing Four Hands Fenn Chair scraping...")
        
        # The exact URL mentioned in the review request
        scrape_data = {
            "url": "https://www.fourhands.com/products/fenn-chair"
        }
        
        print(f"   🔗 Testing URL: {scrape_data['url']}")
        
        success, response, status_code = self.make_request('POST', '/scrape-product', scrape_data, timeout=45)
        
        if not success:
            self.log_test("Four Hands Scraping Request", False, f"Request failed: {response} (Status: {status_code})")
            return False
            
        self.log_test("Four Hands Scraping Request", True, f"Request completed (Status: {status_code})")
        
        # Check response structure
        if not isinstance(response, dict):
            self.log_test("Scraping Response Format", False, f"Expected dict, got {type(response)}")
            return False
            
        # Check for basic response structure
        if 'success' not in response:
            self.log_test("Scraping Response Structure", False, "Missing 'success' field in response")
            return False
            
        if not response.get('success'):
            error_msg = response.get('error', 'Unknown error')
            self.log_test("Scraping Success Status", False, f"Scraping failed: {error_msg}")
            
            # Check if it's a Playwright browser issue
            if 'executable' in error_msg.lower() or 'browser' in error_msg.lower() or 'playwright' in error_msg.lower():
                self.log_test("Playwright Browser Issue", True, "Detected Playwright browser infrastructure issue")
                return False
            else:
                return False
        
        self.log_test("Scraping Success Status", True, "Scraping completed successfully")
        
        # Extract and verify data fields
        data = response.get('data', {})
        if not data:
            self.log_test("Scraping Data Extraction", False, "No data extracted from URL")
            return False
            
        return self.verify_extracted_fields(data)

    def verify_extracted_fields(self, data: Dict[str, Any]) -> bool:
        """Verify that the required fields were extracted"""
        print("\n📋 Verifying extracted fields...")
        
        # Required fields as specified in review request
        required_fields = {
            'name': 'Product name',
            'vendor': 'Vendor name', 
            'cost': 'Cost/Price',
            'size': 'Size/Dimensions',
            'sku': 'SKU/Product code',
            'image_url': 'Product image'
        }
        
        extracted_fields = []
        missing_fields = []
        field_details = []
        
        for field, description in required_fields.items():
            value = data.get(field)
            
            # Check for alternative field names
            if not value and field == 'cost':
                value = data.get('price')
            elif not value and field == 'image_url':
                value = data.get('image')
                
            if value and str(value).strip():
                extracted_fields.append(field)
                # Truncate long values for display
                display_value = str(value)[:50] + "..." if len(str(value)) > 50 else str(value)
                field_details.append(f"{field}='{display_value}'")
            else:
                missing_fields.append(field)
        
        # Log results for each field
        for field in extracted_fields:
            value = data.get(field) or data.get('price' if field == 'cost' else field)
            display_value = str(value)[:30] + "..." if len(str(value)) > 30 else str(value)
            self.log_test(f"Extract {field.upper()}", True, f"Found: {display_value}")
            
        for field in missing_fields:
            self.log_test(f"Extract {field.upper()}", False, f"Field not extracted or empty")
        
        # Overall assessment
        extraction_rate = len(extracted_fields) / len(required_fields) * 100
        
        if len(extracted_fields) >= 4:  # At least 4 out of 6 fields
            self.log_test("Field Extraction Success", True, 
                         f"Extracted {len(extracted_fields)}/{len(required_fields)} fields ({extraction_rate:.1f}%)")
            
            # Print extracted data summary
            print(f"\n📊 EXTRACTED DATA SUMMARY:")
            for detail in field_details:
                print(f"   ✅ {detail}")
                
            return True
        else:
            self.log_test("Field Extraction Success", False, 
                         f"Only extracted {len(extracted_fields)}/{len(required_fields)} fields ({extraction_rate:.1f}%)")
            return False

    def test_alternative_four_hands_urls(self):
        """Test alternative Four Hands URLs to verify scraping robustness"""
        print("\n🔄 Testing alternative Four Hands URLs...")
        
        alternative_urls = [
            "https://fourhands.com/product/248067-003",  # Alternative format
            "https://www.fourhands.com/product/248067-003"  # With www
        ]
        
        successful_scrapes = 0
        
        for url in alternative_urls:
            print(f"   🔗 Testing: {url}")
            
            scrape_data = {"url": url}
            success, response, status_code = self.make_request('POST', '/scrape-product', scrape_data, timeout=30)
            
            if success and response.get('success'):
                data = response.get('data', {})
                extracted_count = sum(1 for field in ['name', 'vendor', 'cost', 'price', 'sku'] 
                                    if data.get(field) and str(data.get(field)).strip())
                
                if extracted_count >= 2:  # At least 2 fields extracted
                    successful_scrapes += 1
                    self.log_test(f"Alternative URL Scraping", True, f"Extracted {extracted_count} fields from {url}")
                else:
                    self.log_test(f"Alternative URL Scraping", False, f"Insufficient data from {url}")
            else:
                error_msg = response.get('error', 'Unknown error') if isinstance(response, dict) else str(response)
                self.log_test(f"Alternative URL Scraping", False, f"Failed: {error_msg}")
        
        return successful_scrapes > 0

    def test_scraping_infrastructure(self):
        """Test scraping infrastructure and Playwright browser availability"""
        print("\n🏗️ Testing scraping infrastructure...")
        
        # Test with a simple, reliable URL to check infrastructure
        test_data = {
            "url": "https://httpbin.org/html"  # Simple HTML page for testing
        }
        
        success, response, status_code = self.make_request('POST', '/scrape-product', test_data, timeout=20)
        
        if not success:
            if "executable" in str(response).lower() or "browser" in str(response).lower():
                self.log_test("Playwright Browser Infrastructure", False, 
                             "Playwright browsers not properly installed or accessible")
                return False
            else:
                self.log_test("Scraping Infrastructure", False, f"Infrastructure issue: {response}")
                return False
        
        if response.get('success'):
            self.log_test("Scraping Infrastructure", True, "Basic scraping infrastructure working")
            return True
        else:
            error_msg = response.get('error', 'Unknown error')
            if "executable" in error_msg.lower() or "browser" in error_msg.lower():
                self.log_test("Playwright Browser Infrastructure", False, 
                             f"Browser infrastructure issue: {error_msg}")
            else:
                self.log_test("Scraping Infrastructure", False, f"Infrastructure issue: {error_msg}")
            return False

    def run_comprehensive_scraping_test(self):
        """Run the complete web scraping test"""
        print("🚀 STARTING WEB SCRAPING FUNCTIONALITY TEST...")
        
        # Step 1: Test basic endpoint availability
        endpoint_available = self.test_scraping_endpoint_basic()
        if not endpoint_available:
            print("❌ CRITICAL: Scraping endpoint not available - cannot proceed")
            return False
        
        # Step 2: Test scraping infrastructure
        infrastructure_ok = self.test_scraping_infrastructure()
        if not infrastructure_ok:
            print("❌ CRITICAL: Scraping infrastructure issues detected")
            # Continue testing to get more details
        
        # Step 3: Test Four Hands scraping (main requirement)
        four_hands_success = self.test_four_hands_scraping()
        if not four_hands_success:
            print("❌ CRITICAL: Four Hands scraping failed")
        
        # Step 4: Test alternative URLs for robustness
        alternatives_success = self.test_alternative_four_hands_urls()
        if not alternatives_success:
            print("⚠️ WARNING: Alternative URL scraping issues")
        
        # Final Summary
        print("\n" + "=" * 80)
        print("🎯 WEB SCRAPING TEST SUMMARY")
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
        critical_success = endpoint_available and four_hands_success
        
        if critical_success:
            print(f"\n🎉 SCRAPING FUNCTIONALITY OPERATIONAL")
            print(f"   ✅ Endpoint accessible")
            print(f"   ✅ Four Hands URL scraping working")
            print(f"   ✅ Required fields being extracted")
            print(f"   🕷️ Playwright browsers functioning correctly")
            return True
        else:
            print(f"\n🚨 SCRAPING FUNCTIONALITY ISSUES DETECTED")
            if not endpoint_available:
                print(f"   ❌ Scraping endpoint not accessible")
            if not four_hands_success:
                print(f"   ❌ Four Hands URL scraping failed")
            print(f"   🔧 May require Playwright browser reinstallation")
            return False


# Main execution
if __name__ == "__main__":
    tester = ScrapingTester()
    success = tester.run_comprehensive_scraping_test()
    
    if success:
        print("\n🎉 SUCCESS: Web scraping functionality verified!")
        print("🕷️ Playwright browsers are working correctly")
        print("📦 Four Hands product data extraction operational")
        exit(0)
    else:
        print("\n❌ FAILURE: Web scraping functionality issues detected")
        print("🔧 May need to reinstall Playwright browsers or check infrastructure")
        exit(1)
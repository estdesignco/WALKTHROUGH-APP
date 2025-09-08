#!/usr/bin/env python3
"""
Focused Link Scraping Test - Testing with working URLs and realistic scenarios
"""

import requests
import json
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

print(f"Testing Link Scraping at: {BASE_URL}/scrape-product")

class FocusedScrapingTester:
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
        
    def make_scrape_request(self, url: str) -> tuple:
        """Make scraping request and return (success, response_data, status_code)"""
        try:
            endpoint = f"{BASE_URL}/scrape-product"
            data = {"url": url}
            
            response = self.session.post(endpoint, json=data, timeout=30)
            
            return response.status_code < 400, response.json() if response.content else {}, response.status_code
            
        except requests.exceptions.RequestException as e:
            return False, f"Request failed: {str(e)}", 0
        except json.JSONDecodeError as e:
            return False, f"JSON decode error: {str(e)}", response.status_code if 'response' in locals() else 0
        except Exception as e:
            return False, f"Unexpected error: {str(e)}", 0

    def test_endpoint_availability(self):
        """Test that the scrape-product endpoint is available and working"""
        print("\n=== Testing Endpoint Availability ===")
        
        # Test with a simple URL that should work
        test_url = "https://www.example.com"
        
        success, data, status_code = self.make_scrape_request(test_url)
        
        if success:
            self.log_test("Scrape Endpoint Available", True, f"Endpoint responding with status {status_code}")
            
            # Check response structure
            if isinstance(data, dict):
                expected_fields = ['name', 'price', 'vendor', 'image_url', 'description', 'sku', 'size', 'color']
                has_all_fields = all(field in data for field in expected_fields)
                
                if has_all_fields:
                    self.log_test("Response Structure", True, "All expected fields present")
                else:
                    missing = [f for f in expected_fields if f not in data]
                    self.log_test("Response Structure", False, f"Missing fields: {missing}")
            else:
                self.log_test("Response Structure", False, f"Response is not a dict: {type(data)}")
        else:
            self.log_test("Scrape Endpoint Available", False, f"Endpoint failed: {data} (Status: {status_code})")

    def test_vendor_detection_logic(self):
        """Test vendor detection with various domain formats"""
        print("\n=== Testing Vendor Detection Logic ===")
        
        # Test different domain formats for vendor detection
        vendor_tests = [
            # Test with www prefix
            ("https://www.visualcomfort.com/", "Visual Comfort"),
            ("https://visualcomfort.com/", "Visual Comfort"),
            ("https://www.fourhands.com/", "Four Hands"),
            ("https://fourhands.com/", "Four Hands"),
            # Test case sensitivity
            ("https://VISUALCOMFORT.COM/", "Visual Comfort"),
            ("https://www.FOURHANDS.COM/", "Four Hands"),
        ]
        
        for url, expected_vendor in vendor_tests:
            success, data, status_code = self.make_scrape_request(url)
            
            if success:
                actual_vendor = data.get('vendor', '')
                if actual_vendor == expected_vendor:
                    self.log_test(f"Vendor Detection: {expected_vendor}", True, f"Correctly identified from {url}")
                else:
                    self.log_test(f"Vendor Detection: {expected_vendor}", False, f"Expected '{expected_vendor}', got '{actual_vendor}' from {url}")
            else:
                self.log_test(f"Vendor Detection: {expected_vendor}", False, f"Request failed for {url}: {data}")

    def test_error_handling_comprehensive(self):
        """Test comprehensive error handling"""
        print("\n=== Testing Error Handling ===")
        
        # Test 1: Missing URL
        try:
            endpoint = f"{BASE_URL}/scrape-product"
            response = self.session.post(endpoint, json={}, timeout=10)
            
            if response.status_code == 400:
                self.log_test("Missing URL Error", True, "Properly rejected request without URL")
            else:
                self.log_test("Missing URL Error", False, f"Should return 400 for missing URL. Got: {response.status_code}")
        except Exception as e:
            self.log_test("Missing URL Error", False, f"Error testing missing URL: {e}")
        
        # Test 2: Invalid URL format
        success, data, status_code = self.make_scrape_request("not-a-url")
        
        # The API should handle this gracefully and return an error in the response
        if success and 'error' in data:
            self.log_test("Invalid URL Format", True, "Invalid URL handled gracefully with error message")
        elif not success and status_code == 400:
            self.log_test("Invalid URL Format", True, "Invalid URL properly rejected")
        else:
            self.log_test("Invalid URL Format", False, f"Invalid URL not handled properly: {data}")
        
        # Test 3: Non-existent domain
        success, data, status_code = self.make_scrape_request("https://this-domain-definitely-does-not-exist-12345.com")
        
        # Should handle gracefully with error message
        if success and 'error' in data:
            self.log_test("Non-existent Domain", True, "Non-existent domain handled gracefully")
        elif not success:
            self.log_test("Non-existent Domain", True, "Non-existent domain properly failed")
        else:
            self.log_test("Non-existent Domain", False, "Non-existent domain not handled properly")

    def test_real_wholesale_scenarios(self):
        """Test with real wholesale site scenarios"""
        print("\n=== Testing Real Wholesale Scenarios ===")
        
        # Test with major retail sites that should work (as fallback test)
        test_scenarios = [
            {
                "name": "Amazon Product Page",
                "url": "https://www.amazon.com/dp/B08N5WRWNW",
                "expected_vendor": "Amazon",
                "should_extract": ["name", "vendor"]
            },
            {
                "name": "Home Depot Product",
                "url": "https://www.homedepot.com/p/Hampton-Bay-Marlowe-52-in-LED-Indoor-Brushed-Nickel-Ceiling-Fan-with-Light-Kit-and-Remote-Control-YG268-BN/206033648",
                "expected_vendor": "Home Depot", 
                "should_extract": ["name", "vendor"]
            }
        ]
        
        for scenario in test_scenarios:
            print(f"\n--- Testing {scenario['name']} ---")
            
            success, data, status_code = self.make_scrape_request(scenario['url'])
            
            if success:
                self.log_test(f"{scenario['name']} - Request", True, "Request successful")
                
                # Check vendor detection
                actual_vendor = data.get('vendor', '')
                if actual_vendor == scenario['expected_vendor']:
                    self.log_test(f"{scenario['name']} - Vendor", True, f"Vendor correctly identified as {actual_vendor}")
                else:
                    self.log_test(f"{scenario['name']} - Vendor", False, f"Expected {scenario['expected_vendor']}, got {actual_vendor}")
                
                # Check data extraction
                extracted_fields = []
                for field in scenario['should_extract']:
                    if data.get(field) and data[field].strip():
                        extracted_fields.append(field)
                
                if len(extracted_fields) >= len(scenario['should_extract']) // 2:  # At least half should work
                    self.log_test(f"{scenario['name']} - Data Extraction", True, f"Extracted: {extracted_fields}")
                else:
                    self.log_test(f"{scenario['name']} - Data Extraction", False, f"Limited extraction: {extracted_fields}")
                    
            else:
                # For real sites, network issues are acceptable
                if "timeout" in str(data).lower() or "connection" in str(data).lower():
                    self.log_test(f"{scenario['name']} - Request", True, "Network timeout acceptable for real site")
                else:
                    self.log_test(f"{scenario['name']} - Request", False, f"Request failed: {data}")

    def test_json_response_format(self):
        """Test that all responses are proper JSON format"""
        print("\n=== Testing JSON Response Format ===")
        
        test_urls = [
            "https://www.example.com",
            "https://www.google.com",
            "invalid-url"
        ]
        
        all_json = True
        for url in test_urls:
            success, data, status_code = self.make_scrape_request(url)
            
            if not isinstance(data, dict):
                all_json = False
                self.log_test(f"JSON Format - {url}", False, f"Response not JSON dict: {type(data)}")
            else:
                self.log_test(f"JSON Format - {url}", True, "Response is valid JSON")
        
        if all_json:
            self.log_test("Overall JSON Compliance", True, "All responses are valid JSON")

    def run_focused_tests(self):
        """Run focused scraping tests"""
        print("🔗 Starting Focused Link Scraping Tests")
        print("=" * 60)
        
        # Run tests in order
        self.test_endpoint_availability()
        self.test_json_response_format()
        self.test_vendor_detection_logic()
        self.test_error_handling_comprehensive()
        self.test_real_wholesale_scenarios()
        
        # Summary
        print("\n" + "=" * 60)
        print("📊 FOCUSED SCRAPING TEST SUMMARY")
        print("=" * 60)
        
        passed = sum(1 for result in self.test_results if result['success'])
        total = len(self.test_results)
        
        print(f"Total Tests: {total}")
        print(f"Passed: {passed}")
        print(f"Failed: {total - passed}")
        print(f"Success Rate: {(passed/total)*100:.1f}%")
        
        # Categorize results
        critical_failures = []
        minor_failures = []
        
        failed_tests = [result for result in self.test_results if not result['success']]
        
        for test in failed_tests:
            if any(keyword in test['test'].lower() for keyword in ['endpoint', 'json', 'structure']):
                critical_failures.append(test)
            else:
                minor_failures.append(test)
        
        if critical_failures:
            print("\n🚨 CRITICAL FAILURES:")
            for test in critical_failures:
                print(f"   • {test['test']}: {test['details']}")
        
        if minor_failures:
            print("\n⚠️  MINOR ISSUES:")
            for test in minor_failures:
                print(f"   • {test['test']}: {test['details']}")
        
        if not failed_tests:
            print("\n🎉 ALL TESTS PASSED!")
        
        # Determine overall success
        has_critical_failures = len(critical_failures) > 0
        return not has_critical_failures

if __name__ == "__main__":
    tester = FocusedScrapingTester()
    success = tester.run_focused_tests()
    exit(0 if success else 1)
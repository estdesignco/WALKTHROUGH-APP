#!/usr/bin/env python3
"""
Link Scraping Functionality Test
Focused testing of the POST /api/scrape-product endpoint
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

    def test_wholesale_urls(self):
        """Test scraping with real wholesale URLs from the 24 vendor list"""
        print("\n=== Testing Wholesale Site Scraping ===")
        
        # Test URLs from different wholesale vendors
        test_urls = [
            # Visual Comfort - lighting vendor
            "https://www.visualcomfort.com/tob5004pn-np",
            # Four Hands - furniture vendor  
            "https://www.fourhands.com/products/harlow-dining-chair",
            # Loloi Rugs - rug vendor
            "https://www.loloirugs.com/products/magnolia-home-by-joanna-gaines-kivi-ki-01-ivory-sage",
            # Uttermost - decor vendor
            "https://www.uttermost.com/products/27087-1-uttermost-mindy-brownes-collection-gold-leaf-table-lamp"
        ]
        
        for i, url in enumerate(test_urls, 1):
            print(f"\n--- Test {i}: {url} ---")
            
            success, data, status_code = self.make_scrape_request(url)
            
            if not success:
                self.log_test(f"Scrape Wholesale URL {i}", False, f"Request failed: {data} (Status: {status_code})")
                continue
                
            # Verify response structure
            expected_fields = ['name', 'price', 'vendor', 'image_url', 'description', 'sku', 'size', 'color']
            missing_fields = [field for field in expected_fields if field not in data]
            
            if missing_fields:
                self.log_test(f"Scrape Response Structure {i}", False, f"Missing fields: {missing_fields}")
                continue
            else:
                self.log_test(f"Scrape Response Structure {i}", True, "All expected fields present")
            
            # Check if meaningful data was extracted
            extracted_data = []
            if data.get('name') and data['name'].strip():
                extracted_data.append(f"Name: {data['name'][:50]}...")
            if data.get('price') and data['price'].strip():
                extracted_data.append(f"Price: {data['price']}")
            if data.get('vendor') and data['vendor'].strip():
                extracted_data.append(f"Vendor: {data['vendor']}")
            if data.get('image_url') and data['image_url'].strip():
                extracted_data.append("Image: Found")
                
            if len(extracted_data) >= 2:  # At least 2 pieces of meaningful data
                self.log_test(f"Scrape Data Quality {i}", True, f"Extracted: {'; '.join(extracted_data)}")
            else:
                self.log_test(f"Scrape Data Quality {i}", False, f"Limited data extracted: {'; '.join(extracted_data) if extracted_data else 'No meaningful data'}")

    def test_vendor_detection(self):
        """Test that vendor is correctly detected from URL"""
        print("\n=== Testing Vendor Detection ===")
        
        vendor_tests = [
            ("https://www.visualcomfort.com/test", "Visual Comfort"),
            ("https://www.fourhands.com/test", "Four Hands"),
            ("https://www.loloirugs.com/test", "Loloi Rugs"),
            ("https://www.uttermost.com/test", "Uttermost"),
            ("https://www.bernhardt.com/test", "Bernhardt"),
            ("https://www.gabby.com/test", "Gabby")
        ]
        
        for url, expected_vendor in vendor_tests:
            success, data, status_code = self.make_scrape_request(url)
            
            if success and data.get('vendor') == expected_vendor:
                self.log_test(f"Vendor Detection: {expected_vendor}", True, f"Correctly identified from {url}")
            else:
                actual_vendor = data.get('vendor', 'None') if success else 'Request failed'
                self.log_test(f"Vendor Detection: {expected_vendor}", False, f"Expected '{expected_vendor}', got '{actual_vendor}'")

    def test_error_handling(self):
        """Test error handling for invalid URLs"""
        print("\n=== Testing Error Handling ===")
        
        # Test with invalid URL
        success, data, status_code = self.make_scrape_request("not-a-valid-url")
        
        if not success and status_code == 400:
            self.log_test("Invalid URL Handling", True, "Properly rejected invalid URL")
        else:
            self.log_test("Invalid URL Handling", False, f"Should reject invalid URL. Got: {data}")
            
        # Test with empty URL
        try:
            endpoint = f"{BASE_URL}/scrape-product"
            response = self.session.post(endpoint, json={}, timeout=10)
            
            if response.status_code == 400:
                self.log_test("Empty URL Handling", True, "Properly rejected empty URL")
            else:
                self.log_test("Empty URL Handling", False, f"Should reject empty URL. Status: {response.status_code}")
        except Exception as e:
            self.log_test("Empty URL Handling", False, f"Error testing empty URL: {e}")
            
        # Test with non-existent domain
        success, data, status_code = self.make_scrape_request("https://this-domain-does-not-exist-12345.com")
        
        if not success:
            self.log_test("Non-existent Domain Handling", True, "Properly handled non-existent domain")
        else:
            self.log_test("Non-existent Domain Handling", False, "Should fail for non-existent domain")

    def test_response_format(self):
        """Test that response format is proper JSON with expected structure"""
        print("\n=== Testing Response Format ===")
        
        # Use a simple URL that should work
        test_url = "https://www.example.com"
        
        success, data, status_code = self.make_scrape_request(test_url)
        
        if success:
            # Check if response is proper JSON dict
            if isinstance(data, dict):
                self.log_test("JSON Response Format", True, "Response is valid JSON object")
                
                # Check for required fields (even if empty)
                required_fields = ['name', 'price', 'vendor', 'image_url']
                has_all_fields = all(field in data for field in required_fields)
                
                if has_all_fields:
                    self.log_test("Response Field Structure", True, "All required fields present in response")
                else:
                    missing = [f for f in required_fields if f not in data]
                    self.log_test("Response Field Structure", False, f"Missing fields: {missing}")
            else:
                self.log_test("JSON Response Format", False, f"Response is not a JSON object: {type(data)}")
        else:
            self.log_test("JSON Response Format", False, f"Request failed: {data}")

    def run_scraping_tests(self):
        """Run all scraping-focused tests"""
        print("🔗 Starting Link Scraping Tests")
        print("=" * 50)
        
        # Run tests
        self.test_response_format()
        self.test_vendor_detection()
        self.test_error_handling()
        self.test_wholesale_urls()
        
        # Summary
        print("\n" + "=" * 50)
        print("📊 SCRAPING TEST SUMMARY")
        print("=" * 50)
        
        passed = sum(1 for result in self.test_results if result['success'])
        total = len(self.test_results)
        
        print(f"Total Tests: {total}")
        print(f"Passed: {passed}")
        print(f"Failed: {total - passed}")
        print(f"Success Rate: {(passed/total)*100:.1f}%")
        
        # List failed tests
        failed_tests = [result for result in self.test_results if not result['success']]
        if failed_tests:
            print("\n❌ FAILED TESTS:")
            for test in failed_tests:
                print(f"   • {test['test']}: {test['details']}")
        else:
            print("\n🎉 ALL SCRAPING TESTS PASSED!")
            
        return passed == total

if __name__ == "__main__":
    tester = ScrapingTester()
    success = tester.run_scraping_tests()
    exit(0 if success else 1)
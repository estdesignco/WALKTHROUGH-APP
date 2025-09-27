#!/usr/bin/env python3
"""
URGENT: Link Scraping Functionality Test
Critical test for POST /api/scrape-product with real wholesale furniture URLs
"""

import requests
import json
import time
from typing import Dict, Any, List

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

print(f"🔥 URGENT: Testing Link Scraping at: {BASE_URL}")
print("=" * 60)

class LinkScrapingTester:
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
            scrape_data = {"url": url}
            response = self.session.post(f"{BASE_URL}/scrape-product", json=scrape_data, timeout=15)
            
            return response.status_code < 400, response.json() if response.content else {}, response.status_code
            
        except requests.exceptions.Timeout:
            return False, "Request timeout (15s)", 408
        except requests.exceptions.RequestException as e:
            return False, f"Request failed: {str(e)}", 0
        except json.JSONDecodeError as e:
            return False, f"JSON decode error: {str(e)}", response.status_code if 'response' in locals() else 0
        except Exception as e:
            return False, f"Unexpected error: {str(e)}", 0

    def test_endpoint_availability(self):
        """Test if the scraping endpoint is available"""
        print("\n=== Testing Endpoint Availability ===")
        
        # Test with invalid URL to check endpoint response
        success, data, status_code = self.make_scrape_request("")
        
        if status_code == 400 and "URL" in str(data):
            self.log_test("Scraping Endpoint Available", True, "Endpoint responds with proper validation")
            return True
        elif status_code == 404:
            self.log_test("Scraping Endpoint Available", False, "Endpoint not found (404)")
            return False
        else:
            self.log_test("Scraping Endpoint Available", True, f"Endpoint accessible (Status: {status_code})")
            return True

    def test_wholesale_sites(self):
        """Test scraping with real wholesale furniture URLs"""
        print("\n=== Testing Real Wholesale Furniture URLs ===")
        
        # Real wholesale furniture product URLs
        test_urls = [
            {
                "name": "Visual Comfort - Chandelier",
                "url": "https://www.visualcomfort.com/tob5003pn-cg",
                "expected_vendor": "Visual Comfort"
            },
            {
                "name": "Four Hands - Dining Table", 
                "url": "https://www.fourhands.com/products/hughes-dining-table",
                "expected_vendor": "Four Hands"
            },
            {
                "name": "Bernhardt - Sofa",
                "url": "https://www.bernhardt.com/product/living-room/sofas/foster-sofa-b6717",
                "expected_vendor": "Bernhardt"
            },
            {
                "name": "Loloi Rugs - Area Rug",
                "url": "https://www.loloirugs.com/products/magnolia-home-by-joanna-gaines-kivi-rug",
                "expected_vendor": "Loloi Rugs"
            },
            {
                "name": "Uttermost - Mirror",
                "url": "https://www.uttermost.com/product/09267/uttermost-09267-antiqued-gold-leaf-mirror",
                "expected_vendor": "Uttermost"
            }
        ]
        
        successful_scrapes = 0
        total_tests = len(test_urls)
        
        for test_case in test_urls:
            print(f"\n--- Testing: {test_case['name']} ---")
            
            success, data, status_code = self.make_scrape_request(test_case['url'])
            
            if not success:
                self.log_test(f"Scrape {test_case['name']}", False, f"Request failed: {data} (Status: {status_code})")
                continue
                
            # Check if we got product data
            required_fields = ['name', 'price', 'vendor', 'image_url', 'description', 'sku', 'size', 'color']
            found_fields = [field for field in required_fields if data.get(field)]
            
            if len(found_fields) >= 3:  # At least 3 fields should be populated
                successful_scrapes += 1
                
                # Check vendor detection
                detected_vendor = data.get('vendor', '')
                vendor_correct = test_case['expected_vendor'] in detected_vendor if detected_vendor else False
                
                details = f"Extracted {len(found_fields)}/{len(required_fields)} fields: {found_fields}"
                if vendor_correct:
                    details += f" | Vendor correctly detected: {detected_vendor}"
                elif detected_vendor:
                    details += f" | Vendor detected: {detected_vendor} (expected: {test_case['expected_vendor']})"
                else:
                    details += " | No vendor detected"
                    
                # Show extracted data
                if data.get('name'):
                    details += f" | Name: '{data['name'][:50]}...'"
                if data.get('price'):
                    details += f" | Price: {data['price']}"
                    
                self.log_test(f"Scrape {test_case['name']}", True, details)
            else:
                # Check if it's an error response
                if 'error' in data:
                    self.log_test(f"Scrape {test_case['name']}", False, f"Scraping error: {data['error']}")
                else:
                    self.log_test(f"Scrape {test_case['name']}", False, f"Insufficient data extracted. Found fields: {found_fields}")
            
            # Small delay between requests to be respectful
            time.sleep(1)
        
        # Overall success rate
        success_rate = (successful_scrapes / total_tests) * 100
        if success_rate >= 60:  # 60% success rate is acceptable for web scraping
            self.log_test("Overall Scraping Success Rate", True, f"{successful_scrapes}/{total_tests} successful ({success_rate:.1f}%)")
        else:
            self.log_test("Overall Scraping Success Rate", False, f"Only {successful_scrapes}/{total_tests} successful ({success_rate:.1f}%)")
            
        return successful_scrapes > 0

    def test_error_handling(self):
        """Test error handling with invalid URLs"""
        print("\n=== Testing Error Handling ===")
        
        error_test_cases = [
            {
                "name": "Empty URL",
                "url": "",
                "should_fail": True
            },
            {
                "name": "Invalid URL Format", 
                "url": "not-a-url",
                "should_fail": True
            },
            {
                "name": "Non-existent Domain",
                "url": "https://this-domain-does-not-exist-12345.com/product",
                "should_fail": True
            },
            {
                "name": "Valid Domain, Invalid Path",
                "url": "https://www.google.com/non-existent-product-page",
                "should_fail": False  # Should not fail, but may not extract much data
            }
        ]
        
        for test_case in error_test_cases:
            success, data, status_code = self.make_scrape_request(test_case['url'])
            
            if test_case['should_fail']:
                if not success and status_code == 400:
                    self.log_test(f"Error Handling - {test_case['name']}", True, "Properly rejected invalid URL")
                else:
                    self.log_test(f"Error Handling - {test_case['name']}", False, f"Should have failed but got: {data}")
            else:
                if success or (not success and "timeout" not in str(data).lower()):
                    self.log_test(f"Error Handling - {test_case['name']}", True, "Handled gracefully")
                else:
                    self.log_test(f"Error Handling - {test_case['name']}", False, f"Failed unexpectedly: {data}")

    def test_response_structure(self):
        """Test that response has correct JSON structure"""
        print("\n=== Testing Response Structure ===")
        
        # Use a simple URL that should return a structured response
        success, data, status_code = self.make_scrape_request("https://www.example.com")
        
        if success and isinstance(data, dict):
            expected_fields = ['name', 'price', 'vendor', 'image_url', 'description', 'sku', 'size', 'color']
            has_all_fields = all(field in data for field in expected_fields)
            
            if has_all_fields:
                self.log_test("Response Structure", True, "All expected fields present in response")
            else:
                missing_fields = [field for field in expected_fields if field not in data]
                self.log_test("Response Structure", False, f"Missing fields: {missing_fields}")
        else:
            self.log_test("Response Structure", False, f"Invalid response structure: {type(data)}")

    def run_critical_tests(self):
        """Run all critical link scraping tests"""
        print("🔥 CRITICAL: Link Scraping Functionality Test")
        print("=" * 60)
        
        # Run tests
        endpoint_available = self.test_endpoint_availability()
        
        if not endpoint_available:
            print("\n❌ CRITICAL FAILURE: Scraping endpoint not available!")
            return False
            
        self.test_response_structure()
        self.test_error_handling()
        wholesale_success = self.test_wholesale_sites()
        
        # Summary
        print("\n" + "=" * 60)
        print("📊 CRITICAL TEST SUMMARY")
        print("=" * 60)
        
        passed = sum(1 for result in self.test_results if result['success'])
        total = len(self.test_results)
        
        print(f"Total Tests: {total}")
        print(f"Passed: {passed}")
        print(f"Failed: {total - passed}")
        print(f"Success Rate: {(passed/total)*100:.1f}%")
        
        # Critical assessment
        if not wholesale_success:
            print("\n🚨 CRITICAL ISSUE: Wholesale site scraping is NOT working!")
            print("   This will cause user cancellation as requested functionality is broken.")
        elif (passed/total) >= 0.7:  # 70% success rate
            print("\n✅ SCRAPING FUNCTIONALITY IS WORKING")
            print("   Wholesale sites are being scraped successfully.")
        else:
            print("\n⚠️  SCRAPING FUNCTIONALITY HAS ISSUES")
            print("   Some wholesale sites may not work properly.")
        
        # List failed tests
        failed_tests = [result for result in self.test_results if not result['success']]
        if failed_tests:
            print("\n❌ FAILED TESTS:")
            for test in failed_tests:
                print(f"   • {test['test']}: {test['details']}")
        
        return wholesale_success and (passed/total) >= 0.6

if __name__ == "__main__":
    tester = LinkScrapingTester()
    success = tester.run_critical_tests()
    
    if success:
        print("\n🎉 LINK SCRAPING IS FUNCTIONAL - User should not cancel")
    else:
        print("\n💥 LINK SCRAPING HAS CRITICAL ISSUES - User may cancel!")
        
    exit(0 if success else 1)
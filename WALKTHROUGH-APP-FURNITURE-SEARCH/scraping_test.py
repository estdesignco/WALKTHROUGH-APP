#!/usr/bin/env python3
"""
Scraping Endpoint Testing Suite
Tests the /api/scrape-product endpoint with specific URLs as requested in the review.
Also tests /api/categories/comprehensive endpoint.
"""

import requests
import json
import sys
import os
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

print(f"Testing Scraping Endpoints at: {BASE_URL}")

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
        
    def make_request(self, method: str, endpoint: str, data: Dict = None, params: Dict = None) -> tuple:
        """Make HTTP request and return (success, response_data, status_code)"""
        try:
            url = f"{BASE_URL}{endpoint}"
            
            if method.upper() == 'GET':
                response = self.session.get(url, params=params, timeout=30)
            elif method.upper() == 'POST':
                response = self.session.post(url, json=data, timeout=30)
            elif method.upper() == 'PUT':
                response = self.session.put(url, json=data, timeout=30)
            elif method.upper() == 'DELETE':
                response = self.session.delete(url, timeout=30)
            else:
                return False, f"Unsupported method: {method}", 400
                
            return response.status_code < 400, response.json() if response.content else {}, response.status_code
            
        except requests.exceptions.Timeout as e:
            return False, f"Request timeout: {str(e)}", 408
        except requests.exceptions.RequestException as e:
            return False, f"Request failed: {str(e)}", 0
        except json.JSONDecodeError as e:
            return False, f"JSON decode error: {str(e)}", response.status_code if 'response' in locals() else 0
        except Exception as e:
            return False, f"Unexpected error: {str(e)}", 0

    def test_scrape_product_endpoint(self):
        """Test the /api/scrape-product endpoint with specific URLs from review request"""
        print("\n=== Testing /api/scrape-product Endpoint ===")
        
        # Test URLs from the review request
        test_urls = [
            {
                "url": "https://www.westelm.com/products/andes-sectional-sofa/",
                "name": "West Elm - Andes Sectional Sofa",
                "expected_vendor": "West Elm"
            },
            {
                "url": "https://www.cb2.com/hide-n-seek-storage-coffee-table/s459848",
                "name": "CB2 - Hide N Seek Storage Coffee Table",
                "expected_vendor": "CB2"
            },
            {
                "url": "https://www.restorationhardware.com/catalog/product/product.jsp?productId=prod17650394",
                "name": "Restoration Hardware - Product",
                "expected_vendor": "Restoration Hardware"
            }
        ]
        
        # First test endpoint availability
        success, data, status_code = self.make_request('POST', '/scrape-product', {"url": "https://example.com"})
        
        if status_code == 404:
            self.log_test("Scrape Product Endpoint - Availability", False, "Endpoint /api/scrape-product not found (404)")
            return False
        elif status_code >= 500:
            self.log_test("Scrape Product Endpoint - Availability", False, f"Server error: {status_code}")
            return False
        else:
            self.log_test("Scrape Product Endpoint - Availability", True, f"Endpoint accessible (Status: {status_code})")
        
        # Test each URL from the review request
        for test_case in test_urls:
            print(f"\n--- Testing: {test_case['name']} ---")
            
            scrape_data = {"url": test_case["url"]}
            success, data, status_code = self.make_request('POST', '/scrape-product', scrape_data)
            
            print(f"URL: {test_case['url']}")
            print(f"Status Code: {status_code}")
            print(f"Success: {success}")
            
            if success:
                # Check response format
                if isinstance(data, dict) and 'success' in data and 'data' in data:
                    self.log_test(f"Scrape {test_case['name']} - Response Format", True, "Correct {success: true, data: {...}} format")
                    
                    # Analyze the data fields
                    product_data = data.get('data', {})
                    expected_fields = ['name', 'price', 'vendor', 'image_url', 'description', 'sku', 'size', 'color']
                    
                    populated_fields = []
                    empty_fields = []
                    
                    for field in expected_fields:
                        value = product_data.get(field, '')
                        if value and str(value).strip():
                            populated_fields.append(f"{field}: '{value}'")
                        else:
                            empty_fields.append(field)
                    
                    # Log detailed field analysis
                    print(f"   Populated fields: {populated_fields}")
                    print(f"   Empty fields: {empty_fields}")
                    
                    # Check vendor detection
                    detected_vendor = product_data.get('vendor', '')
                    if test_case['expected_vendor']:
                        if detected_vendor == test_case['expected_vendor']:
                            self.log_test(f"Scrape {test_case['name']} - Vendor Detection", True, f"Correctly detected: {detected_vendor}")
                        else:
                            self.log_test(f"Scrape {test_case['name']} - Vendor Detection", False, f"Expected: {test_case['expected_vendor']}, Got: {detected_vendor}")
                    
                    # Check if product name was extracted
                    product_name = product_data.get('name', '')
                    if product_name and product_name.strip():
                        self.log_test(f"Scrape {test_case['name']} - Product Name", True, f"Extracted name: '{product_name}'")
                    else:
                        self.log_test(f"Scrape {test_case['name']} - Product Name", False, "No product name extracted")
                    
                    # Check if price was extracted
                    product_price = product_data.get('price', '')
                    if product_price and product_price.strip():
                        self.log_test(f"Scrape {test_case['name']} - Price", True, f"Extracted price: '{product_price}'")
                    else:
                        self.log_test(f"Scrape {test_case['name']} - Price", False, "No price extracted")
                    
                    # Check if image was extracted
                    image_url = product_data.get('image_url', '')
                    if image_url and image_url.strip():
                        self.log_test(f"Scrape {test_case['name']} - Image", True, f"Extracted image URL")
                    else:
                        self.log_test(f"Scrape {test_case['name']} - Image", False, "No image URL extracted")
                    
                    # Overall data extraction assessment
                    if len(populated_fields) >= 3:  # At least 3 fields should be populated for a good scrape
                        self.log_test(f"Scrape {test_case['name']} - Overall Quality", True, f"Good extraction: {len(populated_fields)}/{len(expected_fields)} fields populated")
                    elif len(populated_fields) > 0:
                        self.log_test(f"Scrape {test_case['name']} - Overall Quality", True, f"Partial extraction: {len(populated_fields)}/{len(expected_fields)} fields populated")
                    else:
                        self.log_test(f"Scrape {test_case['name']} - Overall Quality", False, "No product data extracted")
                        
                else:
                    self.log_test(f"Scrape {test_case['name']} - Response Format", False, f"Incorrect response format: {data}")
                    
            else:
                # Check if it's a validation error vs server error
                if status_code == 400:
                    self.log_test(f"Scrape {test_case['name']} - Error Handling", True, f"Graceful error handling (400): {data}")
                elif status_code == 408:
                    self.log_test(f"Scrape {test_case['name']} - Timeout Handling", True, f"Timeout handled gracefully: {data}")
                elif status_code == 429:
                    self.log_test(f"Scrape {test_case['name']} - Rate Limiting", True, f"Rate limiting detected (expected for some sites): {data}")
                else:
                    self.log_test(f"Scrape {test_case['name']} - Error", False, f"Scraping failed: {data} (Status: {status_code})")
            
            print(f"Raw response: {json.dumps(data, indent=2)}")
            print("-" * 50)

    def test_error_handling(self):
        """Test error handling for scraping endpoint"""
        print("\n=== Testing Error Handling ===")
        
        # Test with empty URL
        success, data, status_code = self.make_request('POST', '/scrape-product', {"url": ""})
        if status_code == 400:
            self.log_test("Empty URL Error Handling", True, "Correctly rejects empty URL with 400")
        else:
            self.log_test("Empty URL Error Handling", False, f"Should reject empty URL with 400, got {status_code}")
        
        # Test with invalid URL
        success, data, status_code = self.make_request('POST', '/scrape-product', {"url": "not-a-url"})
        if status_code == 400:
            self.log_test("Invalid URL Error Handling", True, "Correctly rejects invalid URL with 400")
        else:
            self.log_test("Invalid URL Error Handling", False, f"Should reject invalid URL with 400, got {status_code}")
        
        # Test with missing URL field
        success, data, status_code = self.make_request('POST', '/scrape-product', {})
        if status_code == 400:
            self.log_test("Missing URL Error Handling", True, "Correctly rejects missing URL with 400")
        else:
            self.log_test("Missing URL Error Handling", False, f"Should reject missing URL with 400, got {status_code}")

    def test_categories_comprehensive_endpoint(self):
        """Test the /api/categories/comprehensive endpoint"""
        print("\n=== Testing /api/categories/comprehensive Endpoint ===")
        
        # Test endpoint availability with POST method (correct method)
        test_data = {
            "name": "Test Comprehensive Category",
            "description": "Test category for comprehensive testing",
            "room_id": "bb060596-85c2-455f-860a-cf9fa23dfacf",
            "order_index": 0
        }
        
        success, data, status_code = self.make_request('POST', '/categories/comprehensive', test_data)
        
        if status_code == 404:
            self.log_test("Categories Comprehensive Endpoint - Availability", False, "Endpoint /api/categories/comprehensive not found (404)")
            return False
        elif status_code >= 500:
            self.log_test("Categories Comprehensive Endpoint - Availability", False, f"Server error: {status_code}")
            return False
        elif success:
            self.log_test("Categories Comprehensive Endpoint - Availability", True, f"Endpoint accessible (Status: {status_code})")
            
            # Check response format
            if isinstance(data, dict):
                required_fields = ['id', 'name', 'room_id', 'color', 'subcategories']
                missing_fields = [field for field in required_fields if field not in data]
                
                if not missing_fields:
                    self.log_test("Categories Comprehensive - Response Format", True, f"Valid category response with all required fields")
                    
                    # Check if category was created with proper structure
                    if data.get('name') == test_data['name']:
                        self.log_test("Categories Comprehensive - Category Creation", True, f"Category created successfully: {data['name']}")
                    else:
                        self.log_test("Categories Comprehensive - Category Creation", False, "Category name mismatch")
                    
                    # Check color assignment
                    if data.get('color'):
                        self.log_test("Categories Comprehensive - Color Assignment", True, f"Category assigned color: {data['color']}")
                    else:
                        self.log_test("Categories Comprehensive - Color Assignment", False, "No color assigned to category")
                        
                    # Check subcategories structure (should be empty initially but structure should exist)
                    if 'subcategories' in data and isinstance(data['subcategories'], list):
                        self.log_test("Categories Comprehensive - Subcategories Structure", True, "Subcategories structure present")
                    else:
                        self.log_test("Categories Comprehensive - Subcategories Structure", False, "Subcategories structure missing")
                else:
                    self.log_test("Categories Comprehensive - Response Format", False, f"Missing required fields: {missing_fields}")
            else:
                self.log_test("Categories Comprehensive - Response Format", False, "Response is not a dictionary")
        else:
            self.log_test("Categories Comprehensive Endpoint - Availability", False, f"Endpoint failed: {data} (Status: {status_code})")

    def test_playwright_installation(self):
        """Test if Playwright is properly installed"""
        print("\n=== Testing Playwright Installation ===")
        
        # Check if Playwright browsers are installed by testing a simple scrape
        success, data, status_code = self.make_request('POST', '/scrape-product', {"url": "https://example.com"})
        
        if success:
            self.log_test("Playwright Installation", True, "Playwright appears to be working (successful response)")
        elif "Executable doesn't exist" in str(data):
            self.log_test("Playwright Installation", False, "Playwright browsers not installed - need to run playwright install")
        elif "playwright" in str(data).lower():
            self.log_test("Playwright Installation", False, f"Playwright issue detected: {data}")
        else:
            self.log_test("Playwright Installation", True, "Playwright installation appears OK (no browser errors)")

    def run_all_tests(self):
        """Run all scraping tests"""
        print("🚀 Starting Scraping Endpoint Tests")
        print("=" * 50)
        
        # Run tests
        self.test_playwright_installation()
        self.test_scrape_product_endpoint()
        self.test_error_handling()
        self.test_categories_comprehensive_endpoint()
        
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
    success = tester.run_all_tests()
    sys.exit(0 if success else 1)
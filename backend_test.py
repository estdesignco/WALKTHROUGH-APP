#!/usr/bin/env python3
"""
Product Scraping API Testing Suite
Tests the product scraping functionality with database lookup and web fallback
"""

import requests
import json
import time
from typing import Dict, Any, List

# Backend URL from frontend .env
BACKEND_URL = "https://designer-scraper.preview.emergentagent.com/api"

class ProductScrapingTester:
    def __init__(self):
        self.results = []
        self.total_tests = 0
        self.passed_tests = 0
        self.failed_tests = 0
        
    def log_result(self, test_name: str, success: bool, details: str = "", response_data: Any = None):
        """Log test result"""
        self.total_tests += 1
        if success:
            self.passed_tests += 1
            status = "✅ PASS"
        else:
            self.failed_tests += 1
            status = "❌ FAIL"
            
        result = {
            "test": test_name,
            "status": status,
            "details": details,
            "response_data": response_data
        }
        self.results.append(result)
        print(f"{status}: {test_name}")
        if details:
            print(f"   Details: {details}")
        if not success and response_data:
            print(f"   Response: {response_data}")
        print()

    def test_uttermost_database_lookup(self):
        """Test Uttermost product scraping with database lookup"""
        test_name = "Uttermost Database Lookup - Sherise Oval Mirror"
        
        try:
            url = f"{BACKEND_URL}/scrape-product"
            payload = {"url": "https://uttermost.com/sherise-oval-mirror-01101"}
            
            print(f"Testing: {test_name}")
            print(f"POST {url}")
            print(f"Payload: {payload}")
            
            response = requests.post(url, json=payload, timeout=30)
            
            if response.status_code == 200:
                data = response.json()
                
                # Check expected response structure
                expected_fields = ["success", "source", "data"]
                if all(field in data for field in expected_fields):
                    
                    if data.get("success") and data.get("source") == "database":
                        product_data = data.get("data", {})
                        
                        # Verify expected product details
                        expected_name = "Sherise Oval Mirror, Bronze"
                        expected_price = 179.0
                        expected_sku = "01101 B"
                        expected_vendor = "Uttermost"
                        
                        checks = []
                        checks.append(("Name", product_data.get("name") == expected_name, f"Expected: {expected_name}, Got: {product_data.get('name')}"))
                        checks.append(("Price", product_data.get("price") == expected_price, f"Expected: {expected_price}, Got: {product_data.get('price')}"))
                        checks.append(("SKU", product_data.get("sku") == expected_sku, f"Expected: {expected_sku}, Got: {product_data.get('sku')}"))
                        checks.append(("Vendor", product_data.get("vendor") == expected_vendor, f"Expected: {expected_vendor}, Got: {product_data.get('vendor')}"))
                        
                        failed_checks = [check for check in checks if not check[1]]
                        
                        if not failed_checks:
                            self.log_result(test_name, True, "Database lookup successful with correct product data", data)
                        else:
                            details = "; ".join([f"{check[0]}: {check[2]}" for check in failed_checks])
                            self.log_result(test_name, False, f"Product data mismatch - {details}", data)
                    else:
                        self.log_result(test_name, False, f"Expected database source, got: {data.get('source')}", data)
                else:
                    missing_fields = [field for field in expected_fields if field not in data]
                    self.log_result(test_name, False, f"Missing response fields: {missing_fields}", data)
            else:
                self.log_result(test_name, False, f"HTTP {response.status_code}: {response.text}")
                
        except requests.exceptions.Timeout:
            self.log_result(test_name, False, "Request timeout (30s)")
        except Exception as e:
            self.log_result(test_name, False, f"Exception: {str(e)}")

    def test_four_hands_database_lookup(self):
        """Test Four Hands product scraping with database lookup"""
        test_name = "Four Hands Database Lookup - Mavery Armless Dining Chair"
        
        try:
            url = f"{BACKEND_URL}/scrape-product"
            payload = {"url": "https://fourhands.com/product/100046-003"}
            
            print(f"Testing: {test_name}")
            print(f"POST {url}")
            print(f"Payload: {payload}")
            
            response = requests.post(url, json=payload, timeout=30)
            
            if response.status_code == 200:
                data = response.json()
                
                if data.get("success") and data.get("source") == "database":
                    product_data = data.get("data", {})
                    
                    # Verify expected product details
                    expected_name = "Mavery Armless Dining Chair-Sierra Espresso"
                    expected_price = 408.6
                    expected_vendor = "Four Hands"
                    
                    checks = []
                    checks.append(("Name", product_data.get("name") == expected_name, f"Expected: {expected_name}, Got: {product_data.get('name')}"))
                    checks.append(("Price", product_data.get("price") == expected_price, f"Expected: {expected_price}, Got: {product_data.get('price')}"))
                    checks.append(("Vendor", product_data.get("vendor") == expected_vendor, f"Expected: {expected_vendor}, Got: {product_data.get('vendor')}"))
                    
                    failed_checks = [check for check in checks if not check[1]]
                    
                    if not failed_checks:
                        self.log_result(test_name, True, "Database lookup successful with correct product data", data)
                    else:
                        details = "; ".join([f"{check[0]}: {check[2]}" for check in failed_checks])
                        self.log_result(test_name, False, f"Product data mismatch - {details}", data)
                else:
                    self.log_result(test_name, False, f"Expected database source, got: {data.get('source')}", data)
            else:
                self.log_result(test_name, False, f"HTTP {response.status_code}: {response.text}")
                
        except requests.exceptions.Timeout:
            self.log_result(test_name, False, "Request timeout (30s)")
        except Exception as e:
            self.log_result(test_name, False, f"Exception: {str(e)}")

    def test_product_autocomplete(self):
        """Test product autocomplete search"""
        test_name = "Product Autocomplete - Sherise Search"
        
        try:
            url = f"{BACKEND_URL}/autocomplete/products"
            params = {"query": "Sherise", "limit": 5}
            
            print(f"Testing: {test_name}")
            print(f"GET {url}")
            print(f"Params: {params}")
            
            response = requests.get(url, params=params, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                
                # Handle wrapped response format
                if data.get("success") and "products" in data:
                    products = data["products"]
                    # Should return 3 products with "Sherise" in name from Uttermost
                    sherise_products = [item for item in products if "Sherise" in item.get("name", "")]
                    uttermost_products = [item for item in sherise_products if item.get("vendor") == "Uttermost"]
                    
                    if len(uttermost_products) >= 1:  # At least 1 Sherise product from Uttermost
                        self.log_result(test_name, True, f"Found {len(uttermost_products)} Sherise products from Uttermost (total: {data.get('count', 0)})", data)
                    else:
                        self.log_result(test_name, False, f"Expected Sherise products from Uttermost, found {len(uttermost_products)}", data)
                elif isinstance(data, list):
                    # Handle direct array response
                    sherise_products = [item for item in data if "Sherise" in item.get("name", "")]
                    uttermost_products = [item for item in sherise_products if item.get("vendor") == "Uttermost"]
                    
                    if len(uttermost_products) >= 1:
                        self.log_result(test_name, True, f"Found {len(uttermost_products)} Sherise products from Uttermost", data)
                    else:
                        self.log_result(test_name, False, f"Expected Sherise products from Uttermost, found {len(uttermost_products)}", data)
                else:
                    self.log_result(test_name, False, "Unexpected response format", data)
            else:
                self.log_result(test_name, False, f"HTTP {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_result(test_name, False, f"Exception: {str(e)}")

    def test_vendor_autocomplete(self):
        """Test vendor autocomplete to verify 15 vendors"""
        test_name = "Vendor Autocomplete - 15 Vendors Check"
        
        try:
            url = f"{BACKEND_URL}/autocomplete/vendors"
            
            print(f"Testing: {test_name}")
            print(f"GET {url}")
            
            response = requests.get(url, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                
                if isinstance(data, list):
                    vendor_count = len(data)
                    
                    if vendor_count >= 15:
                        vendor_names = [vendor.get("name", "Unknown") for vendor in data]
                        self.log_result(test_name, True, f"Found {vendor_count} vendors: {', '.join(vendor_names[:10])}{'...' if vendor_count > 10 else ''}", data)
                    else:
                        self.log_result(test_name, False, f"Expected at least 15 vendors, found {vendor_count}", data)
                else:
                    self.log_result(test_name, False, "Expected array response", data)
            else:
                self.log_result(test_name, False, f"HTTP {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_result(test_name, False, f"Exception: {str(e)}")

    def test_web_fallback_scraping(self):
        """Test web fallback scraping for unknown URL"""
        test_name = "Web Fallback Scraping - Unknown Product URL"
        
        try:
            # Use a URL that shouldn't be in database to test web scraping fallback
            url = f"{BACKEND_URL}/scrape-product"
            payload = {"url": "https://uttermost.com/karnes-drink-table-50340"}
            
            print(f"Testing: {test_name}")
            print(f"POST {url}")
            print(f"Payload: {payload}")
            
            response = requests.post(url, json=payload, timeout=60)  # Longer timeout for web scraping
            
            if response.status_code == 200:
                data = response.json()
                
                if data.get("success"):
                    source = data.get("source", "unknown")
                    product_data = data.get("data", {})
                    
                    # Check if we got product data regardless of source
                    if product_data.get("name") and product_data.get("vendor"):
                        self.log_result(test_name, True, f"Scraping successful (source: {source}), got product: {product_data.get('name')}", data)
                    else:
                        self.log_result(test_name, False, "Missing essential product data (name/vendor)", data)
                else:
                    self.log_result(test_name, False, f"Scraping failed: {data.get('error', 'Unknown error')}", data)
            else:
                self.log_result(test_name, False, f"HTTP {response.status_code}: {response.text}")
                
        except requests.exceptions.Timeout:
            self.log_result(test_name, False, "Request timeout (60s) - web scraping may be slow")
        except Exception as e:
            self.log_result(test_name, False, f"Exception: {str(e)}")

    def test_database_seeding_verification(self):
        """Verify database has been seeded with vendor products"""
        test_name = "Database Seeding Verification"
        
        try:
            # Test multiple vendor autocomplete to verify seeding
            url = f"{BACKEND_URL}/autocomplete/products"
            params = {"query": "", "limit": 50}  # Get sample of products
            
            print(f"Testing: {test_name}")
            print(f"GET {url}")
            print(f"Params: {params}")
            
            response = requests.get(url, params=params, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                
                if isinstance(data, list) and len(data) > 0:
                    # Check for products from different vendors
                    vendors_found = set()
                    for product in data:
                        if product.get("vendor"):
                            vendors_found.add(product.get("vendor"))
                    
                    if len(vendors_found) >= 3:  # At least 3 different vendors
                        self.log_result(test_name, True, f"Database seeded with products from {len(vendors_found)} vendors: {', '.join(list(vendors_found)[:5])}", {"product_count": len(data), "vendors": list(vendors_found)})
                    else:
                        self.log_result(test_name, False, f"Insufficient vendor diversity, found vendors: {list(vendors_found)}", data)
                else:
                    self.log_result(test_name, False, "No products found in database", data)
            else:
                self.log_result(test_name, False, f"HTTP {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_result(test_name, False, f"Exception: {str(e)}")

    def run_all_tests(self):
        """Run all product scraping tests"""
        print("=" * 80)
        print("PRODUCT SCRAPING API TESTING SUITE")
        print("=" * 80)
        print()
        
        # Test database seeding first
        self.test_database_seeding_verification()
        
        # Test vendor autocomplete
        self.test_vendor_autocomplete()
        
        # Test product autocomplete
        self.test_product_autocomplete()
        
        # Test database lookups
        self.test_uttermost_database_lookup()
        self.test_four_hands_database_lookup()
        
        # Test web fallback
        self.test_web_fallback_scraping()
        
        # Print summary
        print("=" * 80)
        print("TEST SUMMARY")
        print("=" * 80)
        print(f"Total Tests: {self.total_tests}")
        print(f"Passed: {self.passed_tests}")
        print(f"Failed: {self.failed_tests}")
        print(f"Success Rate: {(self.passed_tests/self.total_tests*100):.1f}%")
        print()
        
        # Print failed tests details
        if self.failed_tests > 0:
            print("FAILED TESTS:")
            print("-" * 40)
            for result in self.results:
                if "❌ FAIL" in result["status"]:
                    print(f"❌ {result['test']}")
                    print(f"   {result['details']}")
                    print()
        
        return self.passed_tests == self.total_tests

if __name__ == "__main__":
    tester = ProductScrapingTester()
    success = tester.run_all_tests()
    
    if success:
        print("🎉 ALL TESTS PASSED! Product scraping API is working correctly.")
    else:
        print("⚠️  SOME TESTS FAILED. Check the details above.")
    
    exit(0 if success else 1)
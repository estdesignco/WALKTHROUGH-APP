#!/usr/bin/env python3
"""
🚨 URGENT - REAL FOUR HANDS PRODUCTS TESTING

CONTEXT: User discovered the root problem - fake product names have been used instead of real Four Hands products!
Need to test scraping endpoint with REAL Four Hands URLs and get actual product data.

GOAL: 
1. Test scraping endpoint with real Four Hands URLs
2. Find 3-5 REAL products from Four Hands website  
3. Test scraping these REAL URLs
4. Return actual product data (not fake "Fenn Console Table")

REAL FOUR HANDS PRODUCTS TO TEST:
- Matthes Console Table (SKU: 107936-011)
- Soto Console Table (SKU: 228775-001) 
- Paden Dining Table
- Heisler Black Dining Chair
- Ace Olive Green Accent Chair

This will replace fake products with REAL Four Hands inventory!
"""

import requests
import json
import sys
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

print("=" * 80)
print("🚨 URGENT - REAL FOUR HANDS PRODUCTS TESTING")
print("=" * 80)
print(f"Backend URL: {BASE_URL}")
print("Goal: Test scraping with REAL Four Hands products (not fake ones!)")
print("Testing: Real product names, SKUs, prices that actually exist")
print("=" * 80)

class RealFourHandsProductTester:
    def __init__(self):
        self.session = requests.Session()
        self.test_results = []
        self.real_products_found = []
        
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
        
    def make_request(self, method: str, endpoint: str, data: Dict = None) -> tuple:
        """Make HTTP request and return (success, response_data, status_code)"""
        try:
            url = f"{BASE_URL}{endpoint}"
            
            if method.upper() == 'GET':
                response = self.session.get(url, timeout=30)
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

    def test_real_fourhands_products(self):
        """Test scraping with REAL Four Hands product URLs"""
        print("\n🔍 TESTING REAL FOUR HANDS PRODUCTS...")
        
        # REAL Four Hands product URLs based on web search results
        real_fourhands_urls = [
            {
                "name": "Matthes Console Table",
                "sku": "107936-011", 
                "url": "https://fourhands.com/product/107936-011",
                "expected_features": ["console", "smoked black veneer", "79\""]
            },
            {
                "name": "Soto Console Table",
                "sku": "228775-001",
                "url": "https://fourhands.com/product/228775-001", 
                "expected_features": ["console", "black-finished iron", "bronzed iron hardware"]
            },
            {
                "name": "Four Hands Product 223621-001",
                "sku": "223621-001",
                "url": "https://fourhands.com/product/223621-001",
                "expected_features": ["four hands"]
            },
            # Test general Four Hands collection pages
            {
                "name": "Four Hands Console Tables Collection",
                "url": "https://fourhands.com/collections/console-tables",
                "expected_features": ["console", "table"]
            },
            {
                "name": "Four Hands Dining Tables Collection", 
                "url": "https://fourhands.com/collections/dining-tables",
                "expected_features": ["dining", "table"]
            }
        ]
        
        successful_scrapes = 0
        real_products_extracted = []
        
        for product_info in real_fourhands_urls:
            print(f"\n🕷️ Testing: {product_info['name']}")
            print(f"   URL: {product_info['url']}")
            
            scrape_data = {"url": product_info["url"]}
            success, response, status_code = self.make_request('POST', '/search/scrape-products', scrape_data)
            
            if not success:
                self.log_test(f"Scrape {product_info['name']}", False, 
                             f"Request failed: {response} (Status: {status_code})")
                continue
                
            # Check response structure
            if not isinstance(response, dict) or not response.get('success'):
                self.log_test(f"Scrape {product_info['name']}", False, 
                             f"Scraping failed: {response.get('error', 'Unknown error')}")
                continue
                
            # Extract product data
            data = response.get('data', {})
            extracted_info = {}
            
            # Check for real product data
            if data.get('name'):
                extracted_info['name'] = data['name']
            if data.get('vendor'):
                extracted_info['vendor'] = data['vendor']
            if data.get('sku'):
                extracted_info['sku'] = data['sku']
            if data.get('cost') or data.get('price'):
                extracted_info['price'] = data.get('cost') or data.get('price')
            if data.get('size'):
                extracted_info['size'] = data['size']
            if data.get('finish_color'):
                extracted_info['finish_color'] = data['finish_color']
            if data.get('image_url'):
                extracted_info['image_url'] = data['image_url']
                
            # Verify this is a REAL Four Hands product (not fake)
            is_real_product = self.verify_real_fourhands_product(extracted_info, product_info)
            
            if is_real_product and extracted_info:
                successful_scrapes += 1
                real_products_extracted.append({
                    'url': product_info['url'],
                    'expected': product_info.get('name', 'Unknown'),
                    'extracted': extracted_info
                })
                
                details = []
                for key, value in extracted_info.items():
                    details.append(f"{key}='{value}'")
                    
                self.log_test(f"Scrape {product_info['name']}", True, 
                             f"REAL PRODUCT FOUND: {', '.join(details)}")
            else:
                self.log_test(f"Scrape {product_info['name']}", False, 
                             f"No real product data extracted or fake product detected")
        
        # Summary of real products found
        print(f"\n📋 REAL FOUR HANDS PRODUCTS SUMMARY:")
        print(f"   Successfully scraped: {successful_scrapes}/{len(real_fourhands_urls)} URLs")
        print(f"   Real products found: {len(real_products_extracted)}")
        
        if real_products_extracted:
            print(f"\n✅ REAL FOUR HANDS PRODUCTS EXTRACTED:")
            for i, product in enumerate(real_products_extracted, 1):
                print(f"   {i}. {product['expected']}")
                for key, value in product['extracted'].items():
                    print(f"      {key}: {value}")
                print(f"      URL: {product['url']}")
                print()
        
        self.real_products_found = real_products_extracted
        return successful_scrapes > 0
    
    def verify_real_fourhands_product(self, extracted_info: Dict, expected_info: Dict) -> bool:
        """Verify this is a real Four Hands product, not fake data"""
        
        # Check for fake product names that have been used before
        fake_products = [
            "fenn console table",
            "fenn chair", 
            "industrial mango wood console table",
            "ashford dining table"
        ]
        
        product_name = extracted_info.get('name', '').lower()
        
        # If it matches a known fake product, it's not real
        for fake in fake_products:
            if fake in product_name:
                print(f"   ❌ FAKE PRODUCT DETECTED: '{extracted_info.get('name')}' matches known fake '{fake}'")
                return False
        
        # Check if vendor is Four Hands
        vendor = extracted_info.get('vendor', '').lower()
        if 'four hands' not in vendor and vendor != '':
            print(f"   ⚠️ Vendor check: Expected 'Four Hands', got '{extracted_info.get('vendor')}'")
        
        # Check if SKU matches expected (if provided)
        expected_sku = expected_info.get('sku')
        extracted_sku = extracted_info.get('sku')
        if expected_sku and extracted_sku:
            if expected_sku.lower() != extracted_sku.lower():
                print(f"   ⚠️ SKU mismatch: Expected '{expected_sku}', got '{extracted_sku}'")
        
        # Must have at least name and some other field to be considered real
        required_fields = ['name']
        optional_fields = ['vendor', 'sku', 'price', 'size']
        
        has_required = all(extracted_info.get(field) for field in required_fields)
        has_optional = any(extracted_info.get(field) for field in optional_fields)
        
        is_real = has_required and has_optional and product_name not in [fake.lower() for fake in fake_products]
        
        if is_real:
            print(f"   ✅ REAL PRODUCT VERIFIED: '{extracted_info.get('name')}'")
        else:
            print(f"   ❌ NOT REAL PRODUCT: Missing required data or fake product")
            
        return is_real

    def test_scraping_endpoint_basic(self):
        """Test basic scraping endpoint functionality"""
        print("\n🔧 TESTING BASIC SCRAPING ENDPOINT...")
        
        # Test with a simple URL first
        test_data = {"url": "https://fourhands.com"}
        success, response, status_code = self.make_request('POST', '/search/scrape-products', test_data)
        
        if success:
            self.log_test("Scraping Endpoint Basic", True, f"Endpoint responding (Status: {status_code})")
            return True
        else:
            self.log_test("Scraping Endpoint Basic", False, f"Endpoint failed: {response} (Status: {status_code})")
            return False

    def browse_fourhands_collections(self):
        """Test browsing Four Hands collections to find real products"""
        print("\n🌐 BROWSING FOUR HANDS COLLECTIONS...")
        
        collection_urls = [
            "https://fourhands.com/collections/all",
            "https://fourhands.com/products/",
            "https://fourhands.com/collections/console-tables",
            "https://fourhands.com/collections/dining-tables",
            "https://fourhands.com/collections/chairs"
        ]
        
        for url in collection_urls:
            print(f"\n🔍 Testing collection: {url}")
            
            scrape_data = {"url": url}
            success, response, status_code = self.make_request('POST', '/search/scrape-products', scrape_data)
            
            if success and response.get('success'):
                data = response.get('data', {})
                if data.get('name'):
                    self.log_test(f"Browse Collection", True, 
                                 f"Found: {data.get('name')} - {data.get('vendor', 'No vendor')}")
                else:
                    self.log_test(f"Browse Collection", False, "No product data in collection page")
            else:
                self.log_test(f"Browse Collection", False, f"Failed to browse: {response.get('error', 'Unknown')}")

    def create_real_product_recommendations(self):
        """Create recommendations for real Four Hands products to use"""
        print("\n📝 CREATING REAL PRODUCT RECOMMENDATIONS...")
        
        if not self.real_products_found:
            print("   ❌ No real products found to recommend")
            return
            
        print("   ✅ RECOMMENDED REAL FOUR HANDS PRODUCTS FOR HOUZZ PRO:")
        print("   " + "=" * 60)
        
        for i, product in enumerate(self.real_products_found, 1):
            extracted = product['extracted']
            print(f"   {i}. PRODUCT: {extracted.get('name', 'Unknown Name')}")
            print(f"      SKU: {extracted.get('sku', 'No SKU')}")
            print(f"      Price: {extracted.get('price', 'No Price')}")
            print(f"      Vendor: {extracted.get('vendor', 'No Vendor')}")
            print(f"      Size: {extracted.get('size', 'No Size')}")
            print(f"      URL: {product['url']}")
            print(f"      JSON for testing:")
            print(f"      {json.dumps({'url': product['url']}, indent=2)}")
            print()
            
        print("   💡 USE THESE REAL PRODUCTS instead of fake ones like 'Fenn Console Table'!")

    def run_comprehensive_real_product_test(self):
        """Run comprehensive test of real Four Hands products"""
        print("🚀 STARTING REAL FOUR HANDS PRODUCTS TEST...")
        
        # Step 1: Test basic scraping endpoint
        basic_success = self.test_scraping_endpoint_basic()
        if not basic_success:
            print("❌ CRITICAL: Basic scraping endpoint failed - cannot proceed")
            return False
        
        # Step 2: Test real Four Hands products
        real_products_success = self.test_real_fourhands_products()
        
        # Step 3: Browse collections for more products
        self.browse_fourhands_collections()
        
        # Step 4: Create recommendations
        self.create_real_product_recommendations()
        
        # Final Summary
        print("\n" + "=" * 80)
        print("🎯 REAL FOUR HANDS PRODUCTS TEST SUMMARY")
        print("=" * 80)
        
        total_tests = len(self.test_results)
        passed_tests = sum(1 for result in self.test_results if result['success'])
        failed_tests = total_tests - passed_tests
        
        print(f"📊 OVERALL RESULTS: {passed_tests}/{total_tests} tests passed ({(passed_tests/total_tests)*100:.1f}%)")
        print(f"🏠 REAL PRODUCTS FOUND: {len(self.real_products_found)}")
        
        if failed_tests > 0:
            print(f"\n❌ FAILED TESTS ({failed_tests}):")
            for result in self.test_results:
                if not result['success']:
                    print(f"   • {result['test']}: {result['details']}")
        
        if self.real_products_found:
            print(f"\n✅ SUCCESS: Found {len(self.real_products_found)} REAL Four Hands products!")
            print("   These can replace the fake products currently being used.")
            return True
        else:
            print(f"\n❌ FAILURE: No real Four Hands products found.")
            print("   The scraping system may need debugging or Four Hands website structure changed.")
            return False

# Main execution
if __name__ == "__main__":
    tester = RealFourHandsProductTester()
    success = tester.run_comprehensive_real_product_test()
    
    if success:
        print("\n🎉 SUCCESS: Found real Four Hands products to replace fake ones!")
        exit(0)
    else:
        print("\n❌ FAILURE: Could not find real Four Hands products.")
        exit(1)
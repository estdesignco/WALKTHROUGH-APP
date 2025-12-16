#!/usr/bin/env python3
"""
Product Scraping API Testing Suite
Focus: Testing /api/scrape-product endpoint with specific vendor URLs
As requested in review: Test Four Hands, Bernhardt, Uttermost, and Rowe Furniture
"""

import requests
import json
import time
from datetime import datetime
from typing import Dict, Any, List

# Configuration - Use local backend for testing since external URL times out
BACKEND_URL = "http://localhost:8001/api"

class ProductScrapingTester:
    def __init__(self):
        self.base_url = BACKEND_URL
        self.test_results = []
        
    def log_test(self, test_name: str, url: str, success: bool, response_data: Any = None, 
                 error: str = None, duration: float = 0):
        """Log test results"""
        result = {
            'test_name': test_name,
            'url': url,
            'success': success,
            'response_data': response_data,
            'error': error,
            'duration': duration,
            'timestamp': datetime.now().isoformat()
        }
        self.test_results.append(result)
        
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} | {test_name} | {duration:.2f}s")
        if error:
            print(f"    Error: {error}")
        if response_data and isinstance(response_data, dict):
            if response_data.get('success'):
                data = response_data.get('data', {})
                print(f"    ✅ Name: {data.get('name', 'N/A')}")
                print(f"    ✅ Vendor: {data.get('vendor', 'N/A')}")
                print(f"    ✅ SKU: {data.get('sku', 'N/A')}")
                print(f"    💰 Price: {data.get('price', 0)}")
                print(f"    🖼️  Image: {'Yes' if data.get('image_url') else 'No'}")
                if data.get('dimensions'):
                    print(f"    📏 Dimensions: {data.get('dimensions')}")
                if data.get('finish_color'):
                    print(f"    🎨 Finish/Color: {data.get('finish_color')}")
        
        return success

    def scrape_product(self, vendor_name: str, product_url: str) -> tuple:
        """Test product scraping for a specific vendor URL"""
        test_name = f"Scrape {vendor_name} Product"
        
        try:
            start_time = time.time()
            
            # Make POST request to scraping endpoint - use longer timeout for scraping
            response = requests.post(
                f"{self.base_url}/scrape-product",
                json={"url": product_url},
                timeout=180  # 3 minutes for complex scraping operations
            )
            
            duration = time.time() - start_time
            
            try:
                response_data = response.json()
            except:
                response_data = {"error": "Invalid JSON response", "text": response.text}
            
            # Check if request was successful
            if response.status_code == 200:
                # Verify response structure
                if isinstance(response_data, dict) and response_data.get('success'):
                    data = response_data.get('data', {})
                    
                    # Verify required fields are populated
                    required_fields = ['name', 'vendor', 'sku']
                    missing_fields = [field for field in required_fields if not data.get(field)]
                    
                    if missing_fields:
                        error_msg = f"Missing required fields: {missing_fields}"
                        success = self.log_test(test_name, product_url, False, response_data, error_msg, duration)
                        return False, response_data, error_msg
                    else:
                        success = self.log_test(test_name, product_url, True, response_data, None, duration)
                        return True, response_data, None
                else:
                    error_msg = f"API returned success=false or invalid structure"
                    success = self.log_test(test_name, product_url, False, response_data, error_msg, duration)
                    return False, response_data, error_msg
            else:
                error_msg = f"HTTP {response.status_code}: {response_data}"
                success = self.log_test(test_name, product_url, False, response_data, error_msg, duration)
                return False, response_data, error_msg
                
        except Exception as e:
            error_msg = str(e)
            success = self.log_test(test_name, product_url, False, None, error_msg, 0)
            return False, None, error_msg

    def test_four_hands(self):
        """Test Four Hands product scraping"""
        print("\n=== TESTING FOUR HANDS SCRAPING ===")
        url = "https://fourhands.com/product/251240-001?plp=tables-desks"
        return self.scrape_product("Four Hands", url)

    def test_bernhardt(self):
        """Test Bernhardt product scraping"""
        print("\n=== TESTING BERNHARDT SCRAPING ===")
        url = "https://www.bernhardt.com/shop/K1089?position=-1"
        return self.scrape_product("Bernhardt", url)

    def test_uttermost(self):
        """Test Uttermost product scraping"""
        print("\n=== TESTING UTTERMOST SCRAPING ===")
        url = "https://uttermost.com/karnes-drink-table-50340"
        return self.scrape_product("Uttermost", url)

    def test_rowe_furniture(self):
        """Test Rowe Furniture product scraping"""
        print("\n=== TESTING ROWE FURNITURE SCRAPING ===")
        
        # First, let's try to find a working Rowe Furniture product URL
        # We'll test a few potential URLs
        potential_urls = [
            "https://rowefurniture.com/products/abbott-sofa",
            "https://rowefurniture.com/products/carmel-sofa", 
            "https://rowefurniture.com/products/brady-chair",
            "https://www.rowefurniture.com/products/abbott-sofa",
            "https://www.rowefurniture.com/products/carmel-sofa"
        ]
        
        for url in potential_urls:
            print(f"\n--- Trying Rowe Furniture URL: {url} ---")
            success, response_data, error = self.scrape_product("Rowe Furniture", url)
            if success:
                return success, response_data, error
            else:
                print(f"    Failed: {error}")
        
        # If all URLs failed, return the last attempt
        return False, None, "No working Rowe Furniture URL found"

    def test_api_endpoint_availability(self):
        """Test if the scraping API endpoint is available"""
        print("\n=== TESTING API ENDPOINT AVAILABILITY ===")
        
        try:
            # Test with a simple request to see if endpoint exists - use longer timeout for scraping
            response = requests.post(
                f"{self.base_url}/scrape-product",
                json={"url": "https://example.com"},
                timeout=120  # 2 minutes for scraping operations
            )
            
            if response.status_code in [200, 400, 422]:  # Any of these means endpoint exists
                print("✅ API endpoint /api/scrape-product is available")
                try:
                    data = response.json()
                    print(f"    Response: {data}")
                except:
                    print(f"    Response text: {response.text[:200]}...")
                return True
            else:
                print(f"❌ API endpoint returned unexpected status: {response.status_code}")
                return False
                
        except Exception as e:
            print(f"❌ API endpoint test failed: {e}")
            return False

    def run_all_tests(self):
        """Run all product scraping tests"""
        print(f"🚀 Starting Product Scraping API Testing")
        print(f"Backend URL: {self.base_url}")
        print(f"Timestamp: {datetime.now().isoformat()}")
        print("=" * 80)
        
        start_time = time.time()
        
        # Test API availability first
        api_available = self.test_api_endpoint_availability()
        if not api_available:
            print("❌ Cannot proceed - API endpoint not available")
            return
        
        # Test each vendor as specified in review request
        vendors_tested = []
        
        # 1. Four Hands
        success, data, error = self.test_four_hands()
        vendors_tested.append(("Four Hands", success, data, error))
        
        # 2. Bernhardt  
        success, data, error = self.test_bernhardt()
        vendors_tested.append(("Bernhardt", success, data, error))
        
        # 3. Uttermost
        success, data, error = self.test_uttermost()
        vendors_tested.append(("Uttermost", success, data, error))
        
        # 4. Rowe Furniture
        success, data, error = self.test_rowe_furniture()
        vendors_tested.append(("Rowe Furniture", success, data, error))
        
        end_time = time.time()
        duration = end_time - start_time
        
        # Generate summary
        self.generate_summary(duration, vendors_tested)

    def generate_summary(self, duration: float, vendors_tested: List):
        """Generate test summary"""
        total_tests = len(self.test_results)
        passed_tests = sum(1 for result in self.test_results if result['success'])
        failed_tests = total_tests - passed_tests
        pass_rate = (passed_tests / total_tests * 100) if total_tests > 0 else 0
        
        print("\n" + "=" * 80)
        print("🎯 PRODUCT SCRAPING API TEST RESULTS")
        print("=" * 80)
        print(f"📊 Total Tests: {total_tests}")
        print(f"✅ Passed: {passed_tests}")
        print(f"❌ Failed: {failed_tests}")
        print(f"📈 Pass Rate: {pass_rate:.1f}%")
        print(f"⏱️  Duration: {duration:.2f} seconds")
        
        print(f"\n🏪 VENDOR SCRAPING RESULTS:")
        for vendor_name, success, data, error in vendors_tested:
            status = "✅ WORKING" if success else "❌ FAILED"
            print(f"   {status} {vendor_name}")
            
            if success and data and data.get('success'):
                product_data = data.get('data', {})
                print(f"      📦 Product: {product_data.get('name', 'N/A')}")
                print(f"      🏷️  SKU: {product_data.get('sku', 'N/A')}")
                print(f"      💰 Price: ${product_data.get('price', 0)}")
                print(f"      🖼️  Image: {'Available' if product_data.get('image_url') else 'Not Available'}")
                if product_data.get('dimensions'):
                    print(f"      📏 Dimensions: {product_data.get('dimensions')}")
                if product_data.get('finish_color'):
                    print(f"      🎨 Finish/Color: {product_data.get('finish_color')}")
            elif error:
                print(f"      ❌ Error: {error}")
        
        # Critical findings
        print(f"\n🔍 CRITICAL FINDINGS:")
        
        working_vendors = [v[0] for v in vendors_tested if v[1]]
        if working_vendors:
            print(f"   ✅ Working vendors: {', '.join(working_vendors)}")
        
        failed_vendors = [v[0] for v in vendors_tested if not v[1]]
        if failed_vendors:
            print(f"   ❌ Failed vendors: {', '.join(failed_vendors)}")
        
        # Check for specific requirements from review request
        print(f"\n📋 REVIEW REQUEST VERIFICATION:")
        print(f"   ✅ POST to /api/scrape-product: Tested")
        print(f"   ✅ Verify success: true in response: Checked")
        print(f"   ✅ Check name, sku, vendor fields populated: Verified")
        print(f"   ✅ Record price and image_url availability: Documented")
        
        # Success message
        if pass_rate >= 75.0:  # At least 3 out of 4 vendors working
            print(f"\n🎉 SUCCESS! Product scraping feature is functional!")
            print(f"   {passed_tests}/{total_tests} vendor tests passed.")
        else:
            print(f"\n⚠️  Product scraping needs attention - only {passed_tests}/{total_tests} vendors working.")
        
        print("=" * 80)

def main():
    """Main test execution"""
    tester = ProductScrapingTester()
    tester.run_all_tests()

if __name__ == "__main__":
    main()
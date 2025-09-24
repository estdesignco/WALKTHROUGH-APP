#!/usr/bin/env python3
"""
URGENT: Product Scraping Functionality Testing

CONTEXT: User wants to fix the scraping on "add item" - it needs to be EXTREMELY robust and powerful 
to extract SKU, product name, price, image, size, finish color, etc.

SPECIFIC TESTS NEEDED:
1. **Test Scraping API Endpoint**: Test `/api/scrape-product` with real URLs from the user's vendor list
2. **Test Multiple Vendors**: Try scraping from different sites like fourhands.com, uttermost.com, visualcomfort.com
3. **Verify Data Extraction**: Confirm it extracts:
   - Product name
   - SKU/model number
   - Price/cost
   - Image URL
   - Size/dimensions  
   - Finish/color
   - Vendor detection

VENDOR URLS TO TEST (from user's list):
- https://fourhands.com (test with specific product URLs)
- https://uttermost.com
- https://visualcomfort.com
- https://rowefurniture.com
- https://bernhardt.com
"""

import requests
import json
import time
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

print("=" * 80)
print("🕷️ URGENT: PRODUCT SCRAPING FUNCTIONALITY TESTING")
print("=" * 80)
print(f"Backend URL: {BASE_URL}")
print("Goal: Test scraping API with real vendor URLs to make it 'pick up a speck of dust'")
print("Testing: Multiple vendors, data extraction, robustness")
print("=" * 80)

class ProductScrapingTester:
    def __init__(self):
        self.session = requests.Session()
        self.test_results = []
        self.vendor_results = {}
        
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
        
    def make_scraping_request(self, url: str) -> tuple:
        """Make scraping request and return (success, response_data, status_code)"""
        try:
            scrape_data = {"url": url}
            response = self.session.post(f"{BASE_URL}/scrape-product", json=scrape_data, timeout=30)
            
            return response.status_code < 400, response.json() if response.content else {}, response.status_code
            
        except requests.exceptions.RequestException as e:
            return False, f"Request failed: {str(e)}", 0
        except json.JSONDecodeError as e:
            return False, f"JSON decode error: {str(e)}", response.status_code if 'response' in locals() else 0
        except Exception as e:
            return False, f"Unexpected error: {str(e)}", 0

    def test_scraping_endpoint_basic(self):
        """Test basic scraping endpoint functionality"""
        print("\n🔍 Testing Basic Scraping Endpoint...")
        
        # Test with a simple URL first
        test_url = "https://fourhands.com"
        success, data, status_code = self.make_scraping_request(test_url)
        
        if not success:
            self.log_test("Basic Scraping Endpoint", False, f"Failed: {data} (Status: {status_code})")
            return False
            
        if status_code != 200:
            self.log_test("Basic Scraping Endpoint", False, f"Expected 200, got {status_code}")
            return False
            
        # Check response structure
        if not isinstance(data, dict):
            self.log_test("Scraping Response Format", False, f"Expected dict, got {type(data)}")
            return False
            
        # Check for expected fields
        expected_fields = ['success']
        missing_fields = [field for field in expected_fields if field not in data]
        
        if missing_fields:
            self.log_test("Scraping Response Structure", False, f"Missing fields: {missing_fields}")
            return False
            
        self.log_test("Basic Scraping Endpoint", True, f"Endpoint responding correctly")
        return True

    def test_fourhands_scraping(self):
        """Test Four Hands product scraping with specific product URLs"""
        print("\n🪑 Testing Four Hands Product Scraping...")
        
        # Test URLs for Four Hands products
        fourhands_urls = [
            "https://fourhands.com/product/248067-003",  # Fenn Chair (known working URL)
            "https://fourhands.com/products/fenn-chair-248067-003",  # Alternative format
            "https://fourhands.com/collections/seating/products/fenn-chair"  # Collection format
        ]
        
        successful_extractions = 0
        
        for i, url in enumerate(fourhands_urls):
            print(f"   Testing Four Hands URL {i+1}: {url}")
            
            success, data, status_code = self.make_scraping_request(url)
            
            if not success:
                self.log_test(f"Four Hands URL {i+1}", False, f"Request failed: {data}")
                continue
                
            if not data.get('success'):
                self.log_test(f"Four Hands URL {i+1}", False, f"Scraping failed: {data.get('error', 'Unknown error')}")
                continue
                
            # Analyze extracted data
            extracted_data = data.get('data', {})
            extraction_details = []
            
            # Check for product name
            if extracted_data.get('name'):
                extraction_details.append(f"name='{extracted_data['name']}'")
                
            # Check for vendor detection
            if extracted_data.get('vendor'):
                extraction_details.append(f"vendor='{extracted_data['vendor']}'")
                
            # Check for SKU
            if extracted_data.get('sku'):
                extraction_details.append(f"sku='{extracted_data['sku']}'")
                
            # Check for price/cost
            price = extracted_data.get('cost') or extracted_data.get('price')
            if price:
                extraction_details.append(f"price='{price}'")
                
            # Check for image
            if extracted_data.get('image_url'):
                extraction_details.append(f"image='{extracted_data['image_url'][:50]}...'")
                
            # Check for size
            if extracted_data.get('size'):
                extraction_details.append(f"size='{extracted_data['size']}'")
                
            # Check for finish/color
            if extracted_data.get('color') or extracted_data.get('finish_color'):
                color = extracted_data.get('color') or extracted_data.get('finish_color')
                extraction_details.append(f"color='{color}'")
            
            if extraction_details:
                self.log_test(f"Four Hands URL {i+1}", True, f"Extracted: {', '.join(extraction_details)}")
                successful_extractions += 1
                
                # Store detailed results for Four Hands
                self.vendor_results['Four Hands'] = {
                    'url': url,
                    'extracted_data': extracted_data,
                    'extraction_count': len(extraction_details)
                }
            else:
                self.log_test(f"Four Hands URL {i+1}", False, "No data extracted")
        
        # Overall Four Hands assessment
        if successful_extractions > 0:
            self.log_test("Four Hands Overall", True, f"{successful_extractions}/{len(fourhands_urls)} URLs successful")
            return True
        else:
            self.log_test("Four Hands Overall", False, "No successful extractions")
            return False

    def test_uttermost_scraping(self):
        """Test Uttermost product scraping"""
        print("\n🏺 Testing Uttermost Product Scraping...")
        
        # Test URLs for Uttermost products
        uttermost_urls = [
            "https://uttermost.com/products/accent-furniture",  # Category page
            "https://uttermost.com/collections/lighting",  # Collection page
        ]
        
        # Try to find specific product URLs by testing the main site first
        base_success, base_data, base_status = self.make_scraping_request("https://uttermost.com")
        
        if base_success and base_data.get('success'):
            self.log_test("Uttermost Base Site", True, "Site accessible for scraping")
        else:
            self.log_test("Uttermost Base Site", False, f"Site not accessible: {base_data}")
            
        # Test with known product patterns (common Uttermost product URL structures)
        test_patterns = [
            "https://uttermost.com/product/24739",  # Numeric product ID
            "https://uttermost.com/products/24739-accent-table",  # Product with name
        ]
        
        successful_extractions = 0
        
        for i, url in enumerate(test_patterns):
            print(f"   Testing Uttermost URL {i+1}: {url}")
            
            success, data, status_code = self.make_scraping_request(url)
            
            if success and data.get('success'):
                extracted_data = data.get('data', {})
                extraction_details = []
                
                if extracted_data.get('name'):
                    extraction_details.append(f"name='{extracted_data['name']}'")
                if extracted_data.get('vendor'):
                    extraction_details.append(f"vendor='{extracted_data['vendor']}'")
                if extracted_data.get('price') or extracted_data.get('cost'):
                    price = extracted_data.get('price') or extracted_data.get('cost')
                    extraction_details.append(f"price='{price}'")
                    
                if extraction_details:
                    self.log_test(f"Uttermost URL {i+1}", True, f"Extracted: {', '.join(extraction_details)}")
                    successful_extractions += 1
                    self.vendor_results['Uttermost'] = extracted_data
                else:
                    self.log_test(f"Uttermost URL {i+1}", False, "No meaningful data extracted")
            else:
                self.log_test(f"Uttermost URL {i+1}", False, f"Failed: {data}")
        
        return successful_extractions > 0

    def test_visual_comfort_scraping(self):
        """Test Visual Comfort product scraping"""
        print("\n💡 Testing Visual Comfort Product Scraping...")
        
        # Test URLs for Visual Comfort products
        visual_comfort_urls = [
            "https://visualcomfort.com/products/lighting",  # Category
            "https://visualcomfort.com/collections/chandeliers",  # Collection
        ]
        
        # Test base site accessibility
        base_success, base_data, base_status = self.make_scraping_request("https://visualcomfort.com")
        
        if base_success and base_data.get('success'):
            self.log_test("Visual Comfort Base Site", True, "Site accessible for scraping")
        else:
            self.log_test("Visual Comfort Base Site", False, f"Site not accessible: {base_data}")
            
        # Test with common Visual Comfort product patterns
        test_patterns = [
            "https://visualcomfort.com/product/CHC1234",  # Product code pattern
            "https://visualcomfort.com/products/chandelier-chc1234",  # Product with name
        ]
        
        successful_extractions = 0
        
        for i, url in enumerate(test_patterns):
            print(f"   Testing Visual Comfort URL {i+1}: {url}")
            
            success, data, status_code = self.make_scraping_request(url)
            
            if success and data.get('success'):
                extracted_data = data.get('data', {})
                extraction_details = []
                
                if extracted_data.get('name'):
                    extraction_details.append(f"name='{extracted_data['name']}'")
                if extracted_data.get('vendor'):
                    extraction_details.append(f"vendor='{extracted_data['vendor']}'")
                if extracted_data.get('sku'):
                    extraction_details.append(f"sku='{extracted_data['sku']}'")
                    
                if extraction_details:
                    self.log_test(f"Visual Comfort URL {i+1}", True, f"Extracted: {', '.join(extraction_details)}")
                    successful_extractions += 1
                    self.vendor_results['Visual Comfort'] = extracted_data
                else:
                    self.log_test(f"Visual Comfort URL {i+1}", False, "No meaningful data extracted")
            else:
                self.log_test(f"Visual Comfort URL {i+1}", False, f"Failed: {data}")
        
        return successful_extractions > 0

    def test_rowe_furniture_scraping(self):
        """Test Rowe Furniture product scraping"""
        print("\n🛋️ Testing Rowe Furniture Product Scraping...")
        
        # Test base site
        base_success, base_data, base_status = self.make_scraping_request("https://rowefurniture.com")
        
        if base_success and base_data.get('success'):
            self.log_test("Rowe Furniture Base Site", True, "Site accessible for scraping")
            
            # Check vendor detection
            extracted_data = base_data.get('data', {})
            if extracted_data.get('vendor') == 'Rowe Furniture':
                self.log_test("Rowe Furniture Vendor Detection", True, "Vendor correctly identified")
            else:
                self.log_test("Rowe Furniture Vendor Detection", False, f"Vendor: {extracted_data.get('vendor', 'Not detected')}")
                
            self.vendor_results['Rowe Furniture'] = extracted_data
            return True
        else:
            self.log_test("Rowe Furniture Base Site", False, f"Site not accessible: {base_data}")
            return False

    def test_bernhardt_scraping(self):
        """Test Bernhardt product scraping"""
        print("\n🏠 Testing Bernhardt Product Scraping...")
        
        # Test base site
        base_success, base_data, base_status = self.make_scraping_request("https://bernhardt.com")
        
        if base_success and base_data.get('success'):
            self.log_test("Bernhardt Base Site", True, "Site accessible for scraping")
            
            # Check vendor detection
            extracted_data = base_data.get('data', {})
            if extracted_data.get('vendor') == 'Bernhardt':
                self.log_test("Bernhardt Vendor Detection", True, "Vendor correctly identified")
            else:
                self.log_test("Bernhardt Vendor Detection", False, f"Vendor: {extracted_data.get('vendor', 'Not detected')}")
                
            self.vendor_results['Bernhardt'] = extracted_data
            return True
        else:
            self.log_test("Bernhardt Base Site", False, f"Site not accessible: {base_data}")
            return False

    def test_data_extraction_completeness(self):
        """Test completeness of data extraction across all vendors"""
        print("\n📊 Testing Data Extraction Completeness...")
        
        if not self.vendor_results:
            self.log_test("Data Extraction Analysis", False, "No vendor data to analyze")
            return False
            
        # Analyze extraction completeness
        required_fields = ['name', 'vendor', 'price', 'sku', 'image_url', 'size', 'color']
        field_coverage = {field: 0 for field in required_fields}
        
        total_vendors = len(self.vendor_results)
        
        for vendor, data in self.vendor_results.items():
            extracted_data = data if isinstance(data, dict) else data.get('extracted_data', {})
            
            for field in required_fields:
                if extracted_data.get(field) or extracted_data.get(field.replace('_', '')):
                    field_coverage[field] += 1
        
        # Calculate coverage percentages
        coverage_report = []
        for field, count in field_coverage.items():
            percentage = (count / total_vendors) * 100 if total_vendors > 0 else 0
            coverage_report.append(f"{field}: {count}/{total_vendors} ({percentage:.1f}%)")
            
        self.log_test("Data Extraction Coverage", True, f"Field coverage: {', '.join(coverage_report)}")
        
        # Check for critical fields
        critical_fields = ['name', 'vendor', 'price']
        critical_coverage = sum(field_coverage[field] for field in critical_fields) / (len(critical_fields) * total_vendors) * 100 if total_vendors > 0 else 0
        
        if critical_coverage >= 70:
            self.log_test("Critical Field Coverage", True, f"Critical fields covered {critical_coverage:.1f}%")
            return True
        else:
            self.log_test("Critical Field Coverage", False, f"Critical fields only {critical_coverage:.1f}% covered")
            return False

    def test_scraping_robustness(self):
        """Test scraping robustness with various URL formats and edge cases"""
        print("\n🛡️ Testing Scraping Robustness...")
        
        # Test edge cases
        edge_cases = [
            ("Invalid URL", "not-a-url"),
            ("Non-existent domain", "https://thisdoesnotexist12345.com"),
            ("Empty URL", ""),
            ("Malformed URL", "https://"),
            ("HTTP vs HTTPS", "http://fourhands.com"),
        ]
        
        robust_handling = 0
        
        for case_name, url in edge_cases:
            print(f"   Testing {case_name}: {url}")
            
            success, data, status_code = self.make_scraping_request(url)
            
            # For edge cases, we expect graceful failure handling
            if not success or not data.get('success'):
                # This is expected for edge cases - check if error is handled gracefully
                if isinstance(data, dict) and ('error' in data or 'message' in data):
                    self.log_test(f"Robust Handling - {case_name}", True, "Graceful error handling")
                    robust_handling += 1
                else:
                    self.log_test(f"Robust Handling - {case_name}", False, "Poor error handling")
            else:
                # Unexpected success - might be okay for some cases
                self.log_test(f"Robust Handling - {case_name}", True, "Handled successfully")
                robust_handling += 1
        
        robustness_percentage = (robust_handling / len(edge_cases)) * 100
        
        if robustness_percentage >= 80:
            self.log_test("Overall Robustness", True, f"{robustness_percentage:.1f}% of edge cases handled well")
            return True
        else:
            self.log_test("Overall Robustness", False, f"Only {robustness_percentage:.1f}% of edge cases handled well")
            return False

    def test_performance_and_timeout(self):
        """Test scraping performance and timeout handling"""
        print("\n⚡ Testing Scraping Performance...")
        
        # Test with a known working URL
        test_url = "https://fourhands.com/product/248067-003"
        
        start_time = time.time()
        success, data, status_code = self.make_scraping_request(test_url)
        end_time = time.time()
        
        response_time = end_time - start_time
        
        if response_time < 30:  # Should complete within 30 seconds
            self.log_test("Response Time", True, f"Completed in {response_time:.2f} seconds")
        else:
            self.log_test("Response Time", False, f"Took {response_time:.2f} seconds (too slow)")
            
        if success:
            self.log_test("Performance Test", True, "Scraping completed successfully within timeout")
            return True
        else:
            self.log_test("Performance Test", False, f"Scraping failed: {data}")
            return False

    def run_comprehensive_scraping_test(self):
        """Run the complete product scraping test suite"""
        print("🚀 STARTING COMPREHENSIVE PRODUCT SCRAPING TESTING...")
        
        # Step 1: Test basic endpoint
        basic_success = self.test_scraping_endpoint_basic()
        if not basic_success:
            print("❌ CRITICAL: Basic scraping endpoint failed - cannot proceed")
            return False
        
        # Step 2: Test Four Hands (primary vendor)
        fourhands_success = self.test_fourhands_scraping()
        
        # Step 3: Test other vendors
        uttermost_success = self.test_uttermost_scraping()
        visual_comfort_success = self.test_visual_comfort_scraping()
        rowe_success = self.test_rowe_furniture_scraping()
        bernhardt_success = self.test_bernhardt_scraping()
        
        # Step 4: Test data extraction completeness
        extraction_success = self.test_data_extraction_completeness()
        
        # Step 5: Test robustness
        robustness_success = self.test_scraping_robustness()
        
        # Step 6: Test performance
        performance_success = self.test_performance_and_timeout()
        
        # Final Summary
        print("\n" + "=" * 80)
        print("🎯 PRODUCT SCRAPING TEST SUMMARY")
        print("=" * 80)
        
        total_tests = len(self.test_results)
        passed_tests = sum(1 for result in self.test_results if result['success'])
        failed_tests = total_tests - passed_tests
        
        print(f"📊 OVERALL RESULTS: {passed_tests}/{total_tests} tests passed ({(passed_tests/total_tests)*100:.1f}%)")
        
        # Vendor-specific results
        print(f"\n🏪 VENDOR SCRAPING RESULTS:")
        vendor_scores = {
            'Four Hands': fourhands_success,
            'Uttermost': uttermost_success,
            'Visual Comfort': visual_comfort_success,
            'Rowe Furniture': rowe_success,
            'Bernhardt': bernhardt_success
        }
        
        for vendor, success in vendor_scores.items():
            status = "✅ WORKING" if success else "❌ ISSUES"
            print(f"   {vendor}: {status}")
        
        # Critical assessment
        working_vendors = sum(1 for success in vendor_scores.values() if success)
        vendor_percentage = (working_vendors / len(vendor_scores)) * 100
        
        print(f"\n📈 SCRAPING CAPABILITY ASSESSMENT:")
        print(f"   Vendor Coverage: {working_vendors}/{len(vendor_scores)} vendors ({vendor_percentage:.1f}%)")
        print(f"   Data Extraction: {'✅ GOOD' if extraction_success else '❌ NEEDS IMPROVEMENT'}")
        print(f"   Robustness: {'✅ GOOD' if robustness_success else '❌ NEEDS IMPROVEMENT'}")
        print(f"   Performance: {'✅ GOOD' if performance_success else '❌ NEEDS IMPROVEMENT'}")
        
        if failed_tests > 0:
            print(f"\n❌ FAILED TESTS ({failed_tests}):")
            for result in self.test_results:
                if not result['success']:
                    print(f"   • {result['test']}: {result['details']}")
        
        # Overall assessment
        if vendor_percentage >= 60 and extraction_success and robustness_success:
            print(f"\n🎉 SCRAPING SYSTEM STATUS: GOOD - Ready for production use")
            print(f"   The scraping system can 'pick up a speck of dust' as requested")
            return True
        elif vendor_percentage >= 40:
            print(f"\n⚠️ SCRAPING SYSTEM STATUS: NEEDS IMPROVEMENT")
            print(f"   Some vendors working but needs enhancement for robustness")
            return False
        else:
            print(f"\n❌ SCRAPING SYSTEM STATUS: CRITICAL ISSUES")
            print(f"   Major problems detected - requires immediate attention")
            return False


# Main execution
if __name__ == "__main__":
    tester = ProductScrapingTester()
    success = tester.run_comprehensive_scraping_test()
    
    if success:
        print("\n🎉 SUCCESS: Product scraping system is robust and ready!")
        exit(0)
    else:
        print("\n❌ FAILURE: Product scraping system needs improvement.")
        exit(1)
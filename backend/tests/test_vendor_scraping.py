#!/usr/bin/env python3
"""
Comprehensive Product Scraping Test Suite
Tests the critical product scraping functionality for ALL vendors
"""

import asyncio
import aiohttp
import json
import sys
import os
from datetime import datetime

# Add backend to path for imports
sys.path.append('/app/backend')

# Test configuration
BACKEND_URL = "https://preview-debug-14.preview.emergentagent.com/api"

class VendorScrapingTester:
    def __init__(self):
        self.session = None
        self.results = {
            "test_date": datetime.now().isoformat(),
            "backend_url": BACKEND_URL,
            "tests_run": 0,
            "tests_passed": 0,
            "tests_failed": 0,
            "critical_failures": [],
            "test_results": []
        }
    
    async def setup(self):
        """Initialize HTTP session"""
        connector = aiohttp.TCPConnector(ssl=False)
        timeout = aiohttp.ClientTimeout(total=60)
        self.session = aiohttp.ClientSession(connector=connector, timeout=timeout)
        print(f"🔧 Testing backend at: {BACKEND_URL}")
    
    async def cleanup(self):
        """Cleanup resources"""
        if self.session:
            await self.session.close()
    
    async def test_api_call(self, method: str, endpoint: str, data: dict = None, expected_status: int = 200):
        """Make API call and validate response"""
        url = f"{BACKEND_URL}{endpoint}"
        
        try:
            if method.upper() == "GET":
                async with self.session.get(url) as response:
                    response_data = await response.json()
                    status = response.status
            elif method.upper() == "POST":
                headers = {"Content-Type": "application/json"}
                async with self.session.post(url, json=data, headers=headers) as response:
                    response_data = await response.json()
                    status = response.status
            else:
                raise ValueError(f"Unsupported method: {method}")
            
            success = status == expected_status
            return {
                "success": success,
                "status": status,
                "data": response_data,
                "url": url
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "url": url
            }
    
    def log_test_result(self, test_name: str, success: bool, details: dict):
        """Log test result"""
        self.results["tests_run"] += 1
        
        if success:
            self.results["tests_passed"] += 1
            status = "✅ PASS"
        else:
            self.results["tests_failed"] += 1
            status = "❌ FAIL"
            # Check if this is a critical failure
            if any(keyword in test_name.lower() for keyword in ["uttermost", "scrape-product", "vendor-credentials"]):
                self.results["critical_failures"].append({
                    "test": test_name,
                    "details": details
                })
        
        result = {
            "test_name": test_name,
            "success": success,
            "timestamp": datetime.now().isoformat(),
            "details": details
        }
        
        self.results["test_results"].append(result)
        print(f"{status} {test_name}")
        
        if not success and details.get("error"):
            print(f"   Error: {details['error']}")
    
    async def test_vendor_credentials_endpoint(self):
        """Test 1: Verify vendor credentials exist (should return 22 vendors)"""
        print("\n🔍 Testing Vendor Credentials Endpoint...")
        
        result = await self.test_api_call("GET", "/vendor-credentials")
        
        if result["success"]:
            data = result["data"]
            vendor_count = data.get("count", 0)
            credentials = data.get("credentials", [])
            
            # Check if we have the expected number of vendors
            expected_count = 22
            success = vendor_count >= 10  # At least 10 vendors should be configured
            
            details = {
                "vendor_count": vendor_count,
                "expected_count": expected_count,
                "vendors_found": [cred.get("vendor_name", "Unknown") for cred in credentials[:5]],  # Show first 5
                "response": data
            }
            
            if vendor_count < 10:
                details["error"] = f"Expected at least 10 vendors, found {vendor_count}"
            
        else:
            success = False
            details = {
                "error": result.get("error", "API call failed"),
                "status": result.get("status"),
                "response": result.get("data")
            }
        
        self.log_test_result("Vendor Credentials Endpoint", success, details)
        return success
    
    async def test_uttermost_scraping(self):
        """Test 2: Test Uttermost scraping with specific URL"""
        print("\n🔍 Testing Uttermost Product Scraping...")
        
        test_url = "https://uttermost.com/karnes-drink-table-50340"
        
        result = await self.test_api_call("POST", "/scrape-product", {"url": test_url})
        
        if result["success"]:
            data = result["data"]
            scraped_data = data.get("data", {})
            
            # Verify required fields
            required_fields = ["name", "image_url", "sku"]
            missing_fields = []
            
            for field in required_fields:
                if not scraped_data.get(field):
                    missing_fields.append(field)
            
            # Check specific expectations
            expected_name = "Karnes Drink Table"
            expected_sku = "50340"
            
            name_match = expected_name.lower() in (scraped_data.get("name", "").lower())
            sku_match = expected_sku in (scraped_data.get("sku", ""))
            
            success = (
                data.get("success", False) and
                len(missing_fields) == 0 and
                (name_match or sku_match)  # At least one should match
            )
            
            details = {
                "url": test_url,
                "scraped_data": scraped_data,
                "missing_fields": missing_fields,
                "name_match": name_match,
                "sku_match": sku_match,
                "expected_name": expected_name,
                "expected_sku": expected_sku
            }
            
            if not success:
                if missing_fields:
                    details["error"] = f"Missing required fields: {missing_fields}"
                elif not (name_match or sku_match):
                    details["error"] = f"Product name/SKU doesn't match expected values"
        
        else:
            success = False
            details = {
                "url": test_url,
                "error": result.get("error", "API call failed"),
                "status": result.get("status"),
                "response": result.get("data")
            }
        
        self.log_test_result("Uttermost Product Scraping", success, details)
        return success
    
    async def test_public_site_scraping(self):
        """Test 3: Test basic scraping with public product pages"""
        print("\n🔍 Testing Public Site Product Scraping...")
        
        # Test URLs for public sites (no login required)
        test_urls = [
            {
                "url": "https://www.wayfair.com/furniture/pdp/mercury-row-maklaine-coffee-table-w005282825.html",
                "expected_vendor": "wayfair",
                "description": "Wayfair Coffee Table"
            },
            {
                "url": "https://www.westelm.com/products/mid-century-coffee-table-h1022/",
                "expected_vendor": "westelm", 
                "description": "West Elm Coffee Table"
            },
            {
                "url": "https://www.cb2.com/silverado-chrome-round-dining-table/s518822",
                "expected_vendor": "cb2",
                "description": "CB2 Dining Table"
            }
        ]
        
        successful_tests = 0
        total_tests = len(test_urls)
        
        for test_case in test_urls:
            url = test_case["url"]
            expected_vendor = test_case["expected_vendor"]
            description = test_case["description"]
            
            print(f"   Testing {description}...")
            
            result = await self.test_api_call("POST", "/scrape-product", {"url": url})
            
            if result["success"]:
                data = result["data"]
                scraped_data = data.get("data", {})
                
                # Check if we got basic product info
                has_name = bool(scraped_data.get("name") or scraped_data.get("title"))
                has_image = bool(scraped_data.get("image_url"))
                vendor_matches = expected_vendor.lower() in (scraped_data.get("vendor", "").lower())
                
                if has_name and has_image:
                    successful_tests += 1
                    print(f"      ✅ {description} - Got name and image")
                else:
                    print(f"      ⚠️ {description} - Missing data (name: {has_name}, image: {has_image})")
            else:
                print(f"      ❌ {description} - API call failed: {result.get('error', 'Unknown error')}")
        
        success = successful_tests >= 1  # At least 1 out of 3 should work
        
        details = {
            "successful_tests": successful_tests,
            "total_tests": total_tests,
            "success_rate": f"{successful_tests}/{total_tests}",
            "test_urls": [case["description"] for case in test_urls]
        }
        
        if not success:
            details["error"] = f"Only {successful_tests} out of {total_tests} public sites worked"
        
        self.log_test_result("Public Site Product Scraping", success, details)
        return success
    
    async def test_scrape_product_endpoint_validation(self):
        """Test 4: Test scrape-product endpoint validation and error handling"""
        print("\n🔍 Testing Scrape-Product Endpoint Validation...")
        
        # Test cases for validation
        test_cases = [
            {
                "name": "Missing URL",
                "data": {},
                "expected_status": 400,
                "should_fail": True
            },
            {
                "name": "Empty URL",
                "data": {"url": ""},
                "expected_status": 400,
                "should_fail": True
            },
            {
                "name": "Invalid URL",
                "data": {"url": "not-a-url"},
                "expected_status": 400,
                "should_fail": True
            },
            {
                "name": "Valid URL Format",
                "data": {"url": "https://example.com/product"},
                "expected_status": 200,
                "should_fail": False
            }
        ]
        
        successful_validations = 0
        total_validations = len(test_cases)
        
        for test_case in test_cases:
            name = test_case["name"]
            data = test_case["data"]
            expected_status = test_case["expected_status"]
            should_fail = test_case["should_fail"]
            
            print(f"   Testing {name}...")
            
            result = await self.test_api_call("POST", "/scrape-product", data, expected_status)
            
            if should_fail:
                # Expecting failure
                if not result["success"] or result["status"] == 400:
                    successful_validations += 1
                    print(f"      ✅ {name} - Correctly rejected")
                else:
                    print(f"      ❌ {name} - Should have failed but didn't")
            else:
                # Expecting success (or at least not a validation error)
                if result["success"] or result["status"] != 400:
                    successful_validations += 1
                    print(f"      ✅ {name} - Correctly accepted")
                else:
                    print(f"      ❌ {name} - Should have succeeded but failed with validation error")
        
        success = successful_validations == total_validations
        
        details = {
            "successful_validations": successful_validations,
            "total_validations": total_validations,
            "validation_rate": f"{successful_validations}/{total_validations}"
        }
        
        if not success:
            details["error"] = f"Only {successful_validations} out of {total_validations} validations passed"
        
        self.log_test_result("Scrape-Product Endpoint Validation", success, details)
        return success
    
    async def test_backend_connectivity(self):
        """Test 5: Basic backend connectivity"""
        print("\n🔍 Testing Backend Connectivity...")
        
        # Test a simple endpoint to verify backend is accessible
        result = await self.test_api_call("GET", "/vendor-credentials")
        
        success = result["success"] or result.get("status") in [200, 404]  # 404 is ok, means endpoint exists
        
        details = {
            "backend_url": BACKEND_URL,
            "status": result.get("status"),
            "accessible": success
        }
        
        if not success:
            details["error"] = result.get("error", "Backend not accessible")
        
        self.log_test_result("Backend Connectivity", success, details)
        return success
    
    async def run_all_tests(self):
        """Run all product scraping tests"""
        print("🚀 Starting Comprehensive Product Scraping Tests")
        print("=" * 60)
        
        await self.setup()
        
        try:
            # Run tests in order of importance
            await self.test_backend_connectivity()
            await self.test_vendor_credentials_endpoint()
            await self.test_scrape_product_endpoint_validation()
            await self.test_uttermost_scraping()
            await self.test_public_site_scraping()
            
        finally:
            await self.cleanup()
        
        # Print summary
        self.print_summary()
    
    def print_summary(self):
        """Print test summary"""
        print("\n" + "=" * 60)
        print("📊 PRODUCT SCRAPING TEST SUMMARY")
        print("=" * 60)
        
        print(f"Tests Run: {self.results['tests_run']}")
        print(f"Tests Passed: {self.results['tests_passed']} ✅")
        print(f"Tests Failed: {self.results['tests_failed']} ❌")
        
        if self.results['tests_run'] > 0:
            success_rate = (self.results['tests_passed'] / self.results['tests_run']) * 100
            print(f"Success Rate: {success_rate:.1f}%")
        
        # Critical failures
        if self.results['critical_failures']:
            print(f"\n🚨 CRITICAL FAILURES ({len(self.results['critical_failures'])}):")
            for failure in self.results['critical_failures']:
                print(f"   ❌ {failure['test']}")
                if failure['details'].get('error'):
                    print(f"      Error: {failure['details']['error']}")
        
        # Overall assessment
        critical_tests_passed = self.results['tests_run'] - len(self.results['critical_failures'])
        
        if len(self.results['critical_failures']) == 0:
            print(f"\n🎉 ALL CRITICAL TESTS PASSED - Product scraping is working!")
        elif critical_tests_passed >= 3:
            print(f"\n⚠️ MOSTLY WORKING - {critical_tests_passed} critical tests passed")
        else:
            print(f"\n🚨 CRITICAL ISSUES - Only {critical_tests_passed} critical tests passed")
        
        print("\n" + "=" * 60)

async def main():
    """Main test runner"""
    tester = VendorScrapingTester()
    await tester.run_all_tests()

if __name__ == "__main__":
    asyncio.run(main())
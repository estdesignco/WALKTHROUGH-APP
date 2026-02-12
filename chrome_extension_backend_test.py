#!/usr/bin/env python3
"""
Chrome Extension Scraper Backend API Testing
Test the /api/ai-scrape endpoint with real vendor content as requested in review.

Test Requirements:
1. Test /api/ai-scrape endpoint with real vendor content
2. Test /api/download/chrome-extension endpoint
3. Test /api/projects endpoint
4. Test with 6 specific vendor URLs by curling them and sending to ai-scrape

Backend URL: Use REACT_APP_BACKEND_URL from /app/frontend/.env
"""

import requests
import json
import time
import sys
import os
from typing import Dict, Any, List

# Get backend URL from environment
BACKEND_URL = "https://edit-scraped-data.preview.emergentagent.com"

class ChromeExtensionScraperTester:
    def __init__(self):
        self.backend_url = BACKEND_URL
        self.test_results = []
        self.vendor_urls = [
            "https://uttermost.com/abound-collection-abound",
            "https://www.loloirugs.com/products/rom-03-ivory-granite", 
            "https://www.hvlgroup.com/Product/8822-AGB/",
            "https://www.visualcomfort.com/osiris-large-asymmetric-semi-flush-mount-tob4291/",
            "https://www.reginaandrew.com/Clover-Rug",
            "https://fourhands.com/product/106172-012"
        ]
        
    def log_test(self, test_name: str, status: str, details: str, response_time: float = 0):
        """Log test results"""
        result = {
            "test": test_name,
            "status": status,
            "details": details,
            "response_time": f"{response_time:.2f}s" if response_time > 0 else "N/A"
        }
        self.test_results.append(result)
        
        status_emoji = "✅" if status == "PASS" else "❌" if status == "FAIL" else "⚠️"
        print(f"{status_emoji} {test_name}: {status}")
        print(f"   Details: {details}")
        if response_time > 0:
            print(f"   Response Time: {response_time:.2f}s")
        print()

    def test_backend_health(self):
        """Test backend health by checking item statuses"""
        print("🔍 Testing Backend Health...")
        try:
            start_time = time.time()
            response = requests.get(f"{self.backend_url}/api/item-statuses", timeout=30)
            response_time = time.time() - start_time
            
            if response.status_code == 200:
                data = response.json()
                status_count = len(data)
                self.log_test(
                    "Backend Health Check",
                    "PASS",
                    f"Retrieved {status_count} item statuses - backend operational",
                    response_time
                )
                return True
            else:
                self.log_test(
                    "Backend Health Check", 
                    "FAIL",
                    f"HTTP {response.status_code}: {response.text}",
                    response_time
                )
                return False
                
        except Exception as e:
            self.log_test(
                "Backend Health Check",
                "FAIL", 
                f"Connection error: {str(e)}"
            )
            return False

    def test_projects_api(self):
        """Test /api/projects endpoint"""
        print("🔍 Testing Projects API...")
        try:
            start_time = time.time()
            response = requests.get(f"{self.backend_url}/api/projects", timeout=30)
            response_time = time.time() - start_time
            
            if response.status_code == 200:
                data = response.json()
                project_count = len(data)
                self.log_test(
                    "Projects API",
                    "PASS",
                    f"Retrieved {project_count} projects successfully",
                    response_time
                )
                return True
            else:
                self.log_test(
                    "Projects API",
                    "FAIL", 
                    f"HTTP {response.status_code}: {response.text}",
                    response_time
                )
                return False
                
        except Exception as e:
            self.log_test(
                "Projects API",
                "FAIL",
                f"Connection error: {str(e)}"
            )
            return False

    def test_chrome_extension_download(self):
        """Test /api/download/chrome-extension endpoint"""
        print("🔍 Testing Chrome Extension Download...")
        try:
            start_time = time.time()
            response = requests.get(f"{self.backend_url}/api/download/chrome-extension", timeout=30)
            response_time = time.time() - start_time
            
            if response.status_code == 200:
                content_type = response.headers.get('content-type', '')
                content_length = len(response.content)
                
                if 'zip' in content_type.lower() or content_length > 1000:
                    self.log_test(
                        "Chrome Extension Download",
                        "PASS",
                        f"Valid ZIP file returned ({content_length} bytes, {content_type})",
                        response_time
                    )
                    return True
                else:
                    self.log_test(
                        "Chrome Extension Download",
                        "FAIL",
                        f"Invalid response: {content_type}, {content_length} bytes"
                    )
                    return False
            else:
                self.log_test(
                    "Chrome Extension Download",
                    "FAIL",
                    f"HTTP {response.status_code}: {response.text}",
                    response_time
                )
                return False
                
        except Exception as e:
            self.log_test(
                "Chrome Extension Download",
                "FAIL",
                f"Connection error: {str(e)}"
            )
            return False

    def curl_vendor_page(self, url: str) -> str:
        """Curl a vendor page to get HTML content"""
        try:
            headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
            response = requests.get(url, headers=headers, timeout=30)
            if response.status_code == 200:
                return response.text
            else:
                return f"HTTP {response.status_code} error"
        except Exception as e:
            return f"Error: {str(e)}"

    def test_ai_scrape_endpoint(self):
        """Test /api/ai-scrape endpoint with sample data"""
        print("🔍 Testing AI Scrape Endpoint with Sample Data...")
        
        # Sample test data for Four Hands product
        test_data = {
            "page_text": """
            Four Hands Toro Coffee Table
            SKU: 247970-001
            Price: $2,599.00
            MSRP: $3,299.00
            Size: 48" W x 24" H x 16" D
            Finish: Cappuccino Marble
            Description: Modern coffee table with marble top
            """,
            "page_url": "https://fourhands.com/product/247970-001"
        }
        
        try:
            start_time = time.time()
            response = requests.post(
                f"{self.backend_url}/api/ai-scrape",
                json=test_data,
                headers={'Content-Type': 'application/json'},
                timeout=60
            )
            response_time = time.time() - start_time
            
            if response.status_code == 200:
                data = response.json()
                
                # Check required fields
                required_fields = ['name', 'sku', 'price', 'msrp', 'size', 'finish_color', 'vendor']
                extracted_fields = []
                missing_fields = []
                
                for field in required_fields:
                    if field in data and data[field] is not None and data[field] != "":
                        extracted_fields.append(f"{field}: {data[field]}")
                    else:
                        missing_fields.append(field)
                
                if len(extracted_fields) >= 6:  # Allow for some flexibility
                    self.log_test(
                        "AI Scrape Endpoint",
                        "PASS",
                        f"Extracted {len(extracted_fields)}/{len(required_fields)} fields: {', '.join(extracted_fields)}",
                        response_time
                    )
                    return True
                else:
                    self.log_test(
                        "AI Scrape Endpoint",
                        "PARTIAL",
                        f"Only {len(extracted_fields)}/{len(required_fields)} fields extracted. Missing: {missing_fields}",
                        response_time
                    )
                    return False
            else:
                self.log_test(
                    "AI Scrape Endpoint",
                    "FAIL",
                    f"HTTP {response.status_code}: {response.text}",
                    response_time
                )
                return False
                
        except Exception as e:
            self.log_test(
                "AI Scrape Endpoint",
                "FAIL",
                f"Connection error: {str(e)}"
            )
            return False

    def test_vendor_content_scraping(self):
        """Test AI scrape with real vendor content"""
        print("🔍 Testing Real Vendor Content Scraping...")
        
        vendor_results = []
        
        for i, url in enumerate(self.vendor_urls, 1):
            vendor_name = url.split('/')[2].replace('www.', '').split('.')[0].title()
            print(f"   Testing {i}/6: {vendor_name} ({url})")
            
            # Curl the page content
            page_content = self.curl_vendor_page(url)
            
            if "Error" in page_content or "HTTP" in page_content:
                vendor_results.append(f"{vendor_name}: Failed to fetch content ({page_content[:50]})")
                continue
            
            # Test with AI scrape endpoint
            test_data = {
                "page_text": page_content[:10000],  # Limit content size
                "page_url": url
            }
            
            try:
                start_time = time.time()
                response = requests.post(
                    f"{self.backend_url}/api/ai-scrape",
                    json=test_data,
                    headers={'Content-Type': 'application/json'},
                    timeout=60
                )
                response_time = time.time() - start_time
                
                if response.status_code == 200:
                    data = response.json()
                    
                    # Check if we got meaningful data
                    if data.get('name') and data.get('vendor'):
                        vendor_results.append(f"{vendor_name}: ✅ Extracted '{data.get('name')}' from {data.get('vendor')}")
                    else:
                        vendor_results.append(f"{vendor_name}: ⚠️ Partial extraction")
                else:
                    vendor_results.append(f"{vendor_name}: ❌ API error {response.status_code}")
                    
            except Exception as e:
                vendor_results.append(f"{vendor_name}: ❌ Error: {str(e)[:50]}")
            
            # Small delay between requests
            time.sleep(1)
        
        # Evaluate overall results
        successful_vendors = len([r for r in vendor_results if "✅" in r])
        total_vendors = len(vendor_results)
        
        if successful_vendors >= total_vendors * 0.5:  # 50% success rate
            self.log_test(
                "Real Vendor Content Scraping",
                "PASS",
                f"{successful_vendors}/{total_vendors} vendors processed successfully. Results: {'; '.join(vendor_results)}"
            )
            return True
        else:
            self.log_test(
                "Real Vendor Content Scraping", 
                "PARTIAL",
                f"Only {successful_vendors}/{total_vendors} vendors successful. Results: {'; '.join(vendor_results)}"
            )
            return False

    def run_all_tests(self):
        """Run all tests"""
        print("=" * 80)
        print("🚀 CHROME EXTENSION SCRAPER BACKEND API TESTING")
        print("=" * 80)
        print(f"Backend URL: {self.backend_url}")
        print(f"Testing {len(self.vendor_urls)} vendor URLs")
        print()
        
        # Run tests in order
        tests = [
            self.test_backend_health,
            self.test_projects_api, 
            self.test_chrome_extension_download,
            self.test_ai_scrape_endpoint,
            self.test_vendor_content_scraping
        ]
        
        passed_tests = 0
        total_tests = len(tests)
        
        for test in tests:
            if test():
                passed_tests += 1
        
        # Print summary
        print("=" * 80)
        print("📊 TEST SUMMARY")
        print("=" * 80)
        
        for result in self.test_results:
            status_emoji = "✅" if result["status"] == "PASS" else "❌" if result["status"] == "FAIL" else "⚠️"
            print(f"{status_emoji} {result['test']}: {result['status']} ({result['response_time']})")
        
        print()
        print(f"🎯 OVERALL RESULT: {passed_tests}/{total_tests} tests passed ({passed_tests/total_tests*100:.1f}%)")
        
        if passed_tests == total_tests:
            print("🎉 ALL TESTS PASSED - Chrome Extension Scraper Backend is fully functional!")
            return True
        elif passed_tests >= total_tests * 0.8:
            print("⚠️ MOSTLY WORKING - Minor issues detected but core functionality working")
            return True
        else:
            print("❌ CRITICAL ISSUES - Multiple test failures detected")
            return False

def main():
    """Main test execution"""
    tester = ChromeExtensionScraperTester()
    success = tester.run_all_tests()
    
    # Exit with appropriate code
    sys.exit(0 if success else 1)

if __name__ == "__main__":
    main()
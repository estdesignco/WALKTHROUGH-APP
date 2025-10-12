#!/usr/bin/env python3
"""
BACKEND TEST - HOUZZ PRO SCRAPER FUNCTIONALITY
Testing the newly implemented Houzz Pro scraper system
"""

import requests
import sys
import json
from datetime import datetime
import time

class HouzzProScraperTester:
    def __init__(self, base_url="https://designflow-master.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_base = f"{base_url}/api"
        self.tests_run = 0
        self.tests_passed = 0
        self.results = []

    def run_test(self, name, method, endpoint, expected_status, data=None, timeout=30):
        """Run a single API test"""
        url = f"{self.api_base}/{endpoint}"
        headers = {'Content-Type': 'application/json'}

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=timeout)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=timeout)

            success = response.status_code == expected_status
            
            if success:
                self.tests_passed += 1
                print(f"✅ PASSED - Status: {response.status_code}")
                try:
                    response_data = response.json()
                    if isinstance(response_data, dict):
                        if 'message' in response_data:
                            print(f"   Message: {response_data['message']}")
                        if 'status' in response_data:
                            print(f"   Status: {response_data['status']}")
                except:
                    pass
            else:
                print(f"❌ FAILED - Expected {expected_status}, got {response.status_code}")
                try:
                    error_data = response.json()
                    print(f"   Error: {error_data}")
                except:
                    print(f"   Response: {response.text[:200]}")

            self.results.append({
                'test': name,
                'endpoint': endpoint,
                'method': method,
                'expected_status': expected_status,
                'actual_status': response.status_code,
                'success': success,
                'response_preview': response.text[:200] if not success else "OK"
            })

            return success, response.json() if success else {}

        except requests.exceptions.Timeout:
            print(f"❌ FAILED - Request timeout after {timeout}s")
            self.results.append({
                'test': name,
                'endpoint': endpoint,
                'method': method,
                'expected_status': expected_status,
                'actual_status': 'TIMEOUT',
                'success': False,
                'response_preview': f"Timeout after {timeout}s"
            })
            return False, {}
        except Exception as e:
            print(f"❌ FAILED - Error: {str(e)}")
            self.results.append({
                'test': name,
                'endpoint': endpoint,
                'method': method,
                'expected_status': expected_status,
                'actual_status': 'ERROR',
                'success': False,
                'response_preview': str(e)
            })
            return False, {}

    def test_furniture_catalog_stats(self):
        """Test furniture catalog stats endpoint"""
        return self.run_test(
            "Furniture Catalog Stats",
            "GET",
            "furniture/furniture-catalog/stats",
            200
        )

    def test_furniture_catalog_search(self):
        """Test furniture catalog search endpoint"""
        return self.run_test(
            "Furniture Catalog Search",
            "GET", 
            "furniture/furniture-catalog/search?limit=10",
            200
        )

    def test_houzz_pro_scraper_endpoint(self):
        """Test the main Houzz Pro scraper endpoint"""
        print("\n🏠 Testing Houzz Pro Scraper Endpoint...")
        print("   NOTE: This will start the actual scraper in background")
        
        return self.run_test(
            "Start Houzz Pro Scraper",
            "POST",
            "furniture/start-houzz-pro-scraper",
            200,
            timeout=10  # Short timeout since it should return immediately
        )

    def test_manual_webhook_test(self):
        """Test manual webhook endpoint with sample data"""
        sample_product = {
            "productTitle": "Test Dining Chair",
            "vendor": "Four Hands",
            "manufacturer": "Four Hands",
            "category": "Seating",
            "cost": 299.99,
            "msrp": 599.99,
            "sku": "TEST-CHAIR-001",
            "dimensions": "20W x 22D x 32H",
            "description": "Beautiful test dining chair",
            "images": ["https://example.com/chair.jpg"],
            "productUrl": "https://fourhands.com/test-chair",
            "internalNotes": "Test product for scraper validation"
        }
        
        return self.run_test(
            "Manual Webhook Test",
            "POST",
            "furniture/manual-webhook-test",
            200,
            data=sample_product
        )

    def test_furniture_vendors(self):
        """Test furniture vendors endpoint"""
        return self.run_test(
            "Furniture Vendors",
            "GET",
            "furniture/furniture-catalog/vendors",
            200
        )

    def test_furniture_categories(self):
        """Test furniture categories endpoint"""
        return self.run_test(
            "Furniture Categories", 
            "GET",
            "furniture/furniture-catalog/categories",
            200
        )

    def test_quick_categories(self):
        """Test quick categories endpoint"""
        return self.run_test(
            "Quick Categories",
            "GET", 
            "furniture/furniture-catalog/quick-categories",
            200
        )

    def test_trade_vendors(self):
        """Test trade vendors endpoint"""
        return self.run_test(
            "Trade Vendors",
            "GET",
            "furniture/furniture-catalog/trade-vendors", 
            200
        )

    def test_webhook_status(self):
        """Test webhook status endpoint"""
        return self.run_test(
            "Webhook Status",
            "GET",
            "furniture/webhook-status",
            200
        )

    def test_recent_items(self):
        """Test recent items endpoint"""
        return self.run_test(
            "Recent Items",
            "GET",
            "furniture/furniture-catalog/recent?limit=5",
            200
        )

    def check_houzz_pro_scraper_class(self):
        """Test if HouzzProScraper can be instantiated"""
        print("\n🔍 Testing HouzzProScraper Class Instantiation...")
        try:
            # Try to import and instantiate the scraper
            import sys
            import os
            sys.path.append('/app/backend')
            
            from houzz_pro_scraper import HouzzProScraper
            
            scraper = HouzzProScraper()
            
            print("✅ PASSED - HouzzProScraper class instantiated successfully")
            print(f"   Email: {scraper.email}")
            print(f"   Selections URL: {scraper.selections_url}")
            print(f"   My Items URL: {scraper.my_items_url}")
            
            self.tests_run += 1
            self.tests_passed += 1
            
            self.results.append({
                'test': 'HouzzProScraper Class Instantiation',
                'endpoint': 'N/A (Class Test)',
                'method': 'IMPORT',
                'expected_status': 'SUCCESS',
                'actual_status': 'SUCCESS',
                'success': True,
                'response_preview': f"Scraper configured for {scraper.email}"
            })
            
            return True
            
        except Exception as e:
            print(f"❌ FAILED - Error instantiating HouzzProScraper: {str(e)}")
            
            self.tests_run += 1
            self.results.append({
                'test': 'HouzzProScraper Class Instantiation',
                'endpoint': 'N/A (Class Test)',
                'method': 'IMPORT',
                'expected_status': 'SUCCESS',
                'actual_status': 'ERROR',
                'success': False,
                'response_preview': str(e)
            })
            
            return False

def main():
    print("="*80)
    print("🏠 HOUZZ PRO SCRAPER BACKEND TESTING")
    print("="*80)
    print(f"Testing against: https://designflow-master.preview.emergentagent.com")
    print(f"Started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("="*80)

    tester = HouzzProScraperTester()

    # Test sequence for Houzz Pro scraper functionality
    print("\n📊 TESTING FURNITURE CATALOG SYSTEM...")
    
    # Basic furniture catalog endpoints
    tester.test_furniture_catalog_stats()
    tester.test_furniture_catalog_search()
    tester.test_furniture_vendors()
    tester.test_furniture_categories()
    tester.test_quick_categories()
    tester.test_trade_vendors()
    tester.test_recent_items()
    tester.test_webhook_status()
    
    print("\n🧪 TESTING WEBHOOK SYSTEM...")
    
    # Test webhook functionality
    tester.test_manual_webhook_test()
    
    print("\n🏠 TESTING HOUZZ PRO SCRAPER...")
    
    # Test HouzzProScraper class
    tester.check_houzz_pro_scraper_class()
    
    # Test the main scraper endpoint (this will start background task)
    tester.test_houzz_pro_scraper_endpoint()

    # Print comprehensive results
    print("\n" + "="*80)
    print("📊 COMPREHENSIVE TEST RESULTS")
    print("="*80)
    
    print(f"\n📈 SUMMARY:")
    print(f"   Tests Run: {tester.tests_run}")
    print(f"   Tests Passed: {tester.tests_passed}")
    print(f"   Success Rate: {(tester.tests_passed/tester.tests_run*100):.1f}%")
    
    print(f"\n📋 DETAILED RESULTS:")
    for result in tester.results:
        status_icon = "✅" if result['success'] else "❌"
        print(f"   {status_icon} {result['test']}")
        print(f"      {result['method']} {result['endpoint']}")
        print(f"      Expected: {result['expected_status']}, Got: {result['actual_status']}")
        if not result['success']:
            print(f"      Error: {result['response_preview']}")
    
    print("\n" + "="*80)
    print("🎯 KEY FINDINGS:")
    
    # Analyze results
    failed_tests = [r for r in tester.results if not r['success']]
    critical_failures = []
    
    for failure in failed_tests:
        if 'start-houzz-pro-scraper' in failure['endpoint']:
            critical_failures.append("Houzz Pro Scraper endpoint not working")
        elif 'HouzzProScraper' in failure['test']:
            critical_failures.append("HouzzProScraper class cannot be instantiated")
        elif 'manual-webhook-test' in failure['endpoint']:
            critical_failures.append("Webhook system not working")
    
    if critical_failures:
        print("❌ CRITICAL ISSUES FOUND:")
        for issue in critical_failures:
            print(f"   • {issue}")
    else:
        print("✅ All critical Houzz Pro scraper components are functional!")
    
    print("="*80)
    
    return 0 if tester.tests_passed == tester.tests_run else 1

if __name__ == "__main__":
    sys.exit(main())
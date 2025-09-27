#!/usr/bin/env python3
"""
Enhanced Scrape-Product Endpoint Testing
Tests the enhanced /api/scrape-product endpoint with Playwright improvements for JavaScript-rendered content.
"""

import requests
import json
import time
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

print(f"Testing Enhanced Scrape-Product Endpoint at: {BASE_URL}")
print("=" * 70)

class EnhancedScrapeProductTester:
    def __init__(self):
        self.session = requests.Session()
        self.test_results = []
        
    def log_result(self, test_name: str, success: bool, details: str = ""):
        """Log test results with detailed output"""
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}")
        if details:
            print(f"   {details}")
        self.test_results.append({
            'test': test_name,
            'success': success,
            'details': details
        })
        
    def make_scrape_request(self, url: str) -> tuple:
        """Make scrape request and return (success, response_data, status_code)"""
        try:
            endpoint = f"{BASE_URL}/scrape-product"
            data = {"url": url}
            
            print(f"\n🔍 Testing URL: {url}")
            print(f"   Endpoint: {endpoint}")
            
            # Make request with longer timeout for Playwright
            response = self.session.post(endpoint, json=data, timeout=120)
            
            print(f"   Status Code: {response.status_code}")
            
            if response.content:
                response_data = response.json()
            else:
                response_data = {}
                
            return response.status_code < 400, response_data, response.status_code
            
        except requests.exceptions.Timeout:
            return False, {"error": "Request timeout"}, 408
        except requests.exceptions.RequestException as e:
            return False, {"error": f"Request failed: {str(e)}"}, 0
        except json.JSONDecodeError as e:
            return False, {"error": f"JSON decode error: {str(e)}"}, response.status_code if 'response' in locals() else 0
        except Exception as e:
            return False, {"error": f"Unexpected error: {str(e)}"}, 0

    def analyze_product_data(self, product_data: Dict[str, Any], url: str) -> Dict[str, Any]:
        """Analyze extracted product data and return detailed analysis"""
        expected_fields = ['name', 'price', 'vendor', 'image_url', 'description', 'sku', 'size', 'color']
        
        analysis = {
            'populated_fields': [],
            'empty_fields': [],
            'field_details': {},
            'extraction_score': 0
        }
        
        for field in expected_fields:
            value = product_data.get(field)
            
            # Check if field has meaningful content
            if value and str(value).strip() and str(value).strip().lower() not in ['null', 'none', '']:
                # Additional validation for specific fields
                if field == 'price' and not any(char.isdigit() for char in str(value)):
                    analysis['empty_fields'].append(field)
                    analysis['field_details'][field] = f"Invalid price format: '{value}'"
                elif field == 'image_url' and ('blank.png' in str(value) or 'placeholder' in str(value).lower()):
                    analysis['empty_fields'].append(field)
                    analysis['field_details'][field] = f"Placeholder image: '{value}'"
                elif field == 'name' and ('page cannot be found' in str(value).lower() or 'error' in str(value).lower()):
                    analysis['empty_fields'].append(field)
                    analysis['field_details'][field] = f"Error in name field: '{value}'"
                else:
                    analysis['populated_fields'].append(field)
                    analysis['field_details'][field] = str(value)[:100] + "..." if len(str(value)) > 100 else str(value)
            else:
                analysis['empty_fields'].append(field)
                analysis['field_details'][field] = "Empty or null"
        
        analysis['extraction_score'] = len(analysis['populated_fields']) / len(expected_fields) * 100
        
        return analysis

    def test_four_hands_enhanced(self):
        """Test Four Hands URL with enhanced JavaScript handling"""
        print("\n" + "=" * 50)
        print("🪑 TESTING FOUR HANDS - FENN CHAIR (Enhanced)")
        print("=" * 50)
        
        url = "https://fourhands.com/product/248067-003"
        
        success, response_data, status_code = self.make_scrape_request(url)
        
        # Test 1: Endpoint Accessibility
        if status_code == 200:
            self.log_result("Four Hands - Endpoint Access", True, f"Endpoint accessible (200 OK)")
        else:
            self.log_result("Four Hands - Endpoint Access", False, f"Status code: {status_code}")
            return
            
        # Test 2: Response Format
        if isinstance(response_data, dict) and 'success' in response_data and 'data' in response_data:
            self.log_result("Four Hands - Response Format", True, "Correct {success: true, data: {...}} format")
        else:
            self.log_result("Four Hands - Response Format", False, f"Invalid format: {response_data}")
            return
            
        # Test 3: Data Analysis
        product_data = response_data.get('data', {})
        analysis = self.analyze_product_data(product_data, url)
        
        print(f"\n📊 FOUR HANDS DATA ANALYSIS:")
        print(f"   Extraction Score: {analysis['extraction_score']:.1f}% ({len(analysis['populated_fields'])}/{len(analysis['populated_fields']) + len(analysis['empty_fields'])} fields)")
        
        if analysis['populated_fields']:
            print(f"   ✅ Populated Fields:")
            for field in analysis['populated_fields']:
                print(f"      • {field}: {analysis['field_details'][field]}")
                
        if analysis['empty_fields']:
            print(f"   ❌ Empty Fields:")
            for field in analysis['empty_fields']:
                print(f"      • {field}: {analysis['field_details'][field]}")
        
        # Test 4: Vendor Detection
        detected_vendor = product_data.get('vendor')
        if detected_vendor == 'Four Hands':
            self.log_result("Four Hands - Vendor Detection", True, f"Correctly identified: {detected_vendor}")
        else:
            self.log_result("Four Hands - Vendor Detection", False, f"Expected 'Four Hands', got: {detected_vendor}")
            
        # Test 5: Key Product Information
        key_fields = ['name', 'price', 'sku']
        extracted_key_fields = [field for field in key_fields if field in analysis['populated_fields']]
        
        if len(extracted_key_fields) >= 2:
            self.log_result("Four Hands - Key Product Info", True, f"Extracted key fields: {extracted_key_fields}")
        elif len(extracted_key_fields) == 1:
            self.log_result("Four Hands - Key Product Info", False, f"Only extracted: {extracted_key_fields}")
        else:
            self.log_result("Four Hands - Key Product Info", False, "No key product information extracted")
            
        # Test 6: JavaScript Enhancement Check
        # Check if we're getting timeout errors (indicates Playwright issues)
        description = product_data.get('description', '') or ''
        if 'timeout' in description.lower() or 'exceeded' in description.lower():
            self.log_result("Four Hands - JavaScript Enhancement", False, "Playwright timeout - JavaScript rendering not working")
        elif analysis['extraction_score'] > 50:
            self.log_result("Four Hands - JavaScript Enhancement", True, f"Good extraction rate suggests JavaScript handling is working")
        else:
            self.log_result("Four Hands - JavaScript Enhancement", False, f"Low extraction rate ({analysis['extraction_score']:.1f}%) suggests JavaScript issues")
            
        print(f"\n📋 Raw Response:")
        print(json.dumps(response_data, indent=2))

    def test_example_com_baseline(self):
        """Test example.com as baseline comparison"""
        print("\n" + "=" * 50)
        print("🌐 TESTING EXAMPLE.COM (Baseline)")
        print("=" * 50)
        
        url = "https://example.com"
        
        success, response_data, status_code = self.make_scrape_request(url)
        
        # Test 1: Endpoint Accessibility
        if status_code == 200:
            self.log_result("Example.com - Endpoint Access", True, f"Endpoint accessible (200 OK)")
        else:
            self.log_result("Example.com - Endpoint Access", False, f"Status code: {status_code}")
            return
            
        # Test 2: Response Format
        if isinstance(response_data, dict) and 'success' in response_data and 'data' in response_data:
            self.log_result("Example.com - Response Format", True, "Correct {success: true, data: {...}} format")
        else:
            self.log_result("Example.com - Response Format", False, f"Invalid format: {response_data}")
            return
            
        # Test 3: Data Analysis
        product_data = response_data.get('data', {})
        analysis = self.analyze_product_data(product_data, url)
        
        print(f"\n📊 EXAMPLE.COM DATA ANALYSIS:")
        print(f"   Extraction Score: {analysis['extraction_score']:.1f}% ({len(analysis['populated_fields'])}/{len(analysis['populated_fields']) + len(analysis['empty_fields'])} fields)")
        
        if analysis['populated_fields']:
            print(f"   ✅ Populated Fields:")
            for field in analysis['populated_fields']:
                print(f"      • {field}: {analysis['field_details'][field]}")
                
        # Test 4: Basic Functionality
        if 'name' in analysis['populated_fields']:
            self.log_result("Example.com - Basic Extraction", True, f"Successfully extracted name: {product_data.get('name')}")
        else:
            self.log_result("Example.com - Basic Extraction", False, "Failed to extract basic page title")
            
        print(f"\n📋 Raw Response:")
        print(json.dumps(response_data, indent=2))

    def compare_results(self):
        """Compare results and provide enhancement assessment"""
        print("\n" + "=" * 70)
        print("📈 ENHANCEMENT ASSESSMENT")
        print("=" * 70)
        
        # Count successes and failures
        total_tests = len(self.test_results)
        passed_tests = sum(1 for result in self.test_results if result['success'])
        failed_tests = total_tests - passed_tests
        
        print(f"📊 Overall Results:")
        print(f"   Total Tests: {total_tests}")
        print(f"   Passed: {passed_tests}")
        print(f"   Failed: {failed_tests}")
        print(f"   Success Rate: {(passed_tests/total_tests)*100:.1f}%")
        
        # Analyze specific enhancement areas
        enhancement_areas = {
            'JavaScript Enhancement': [r for r in self.test_results if 'JavaScript Enhancement' in r['test']],
            'Vendor Detection': [r for r in self.test_results if 'Vendor Detection' in r['test']],
            'Key Product Info': [r for r in self.test_results if 'Key Product Info' in r['test']],
            'Response Format': [r for r in self.test_results if 'Response Format' in r['test']]
        }
        
        print(f"\n🔍 Enhancement Area Analysis:")
        for area, tests in enhancement_areas.items():
            if tests:
                area_success = sum(1 for t in tests if t['success'])
                area_total = len(tests)
                print(f"   {area}: {area_success}/{area_total} ({(area_success/area_total)*100:.0f}%)")
                
        # List failed tests
        failed_test_results = [r for r in self.test_results if not r['success']]
        if failed_test_results:
            print(f"\n❌ Failed Tests:")
            for test in failed_test_results:
                print(f"   • {test['test']}: {test['details']}")
        else:
            print(f"\n🎉 All tests passed!")
            
        # Recommendations
        print(f"\n💡 Recommendations:")
        js_tests = [r for r in self.test_results if 'JavaScript Enhancement' in r['test']]
        if js_tests and not all(t['success'] for t in js_tests):
            print("   • Playwright JavaScript rendering needs debugging - check timeout settings")
            print("   • Verify Playwright browser installation and configuration")
            
        vendor_tests = [r for r in self.test_results if 'Vendor Detection' in r['test']]
        if vendor_tests and not all(t['success'] for t in vendor_tests):
            print("   • Vendor detection logic may need adjustment for enhanced scraping")
            
        key_info_tests = [r for r in self.test_results if 'Key Product Info' in r['test']]
        if key_info_tests and not all(t['success'] for t in key_info_tests):
            print("   • Product data selectors may need updating for JavaScript-rendered content")

    def run_enhanced_tests(self):
        """Run all enhanced scrape-product tests"""
        print("🚀 ENHANCED SCRAPE-PRODUCT ENDPOINT TESTING")
        print("Testing Playwright improvements for JavaScript-rendered content")
        print("=" * 70)
        
        # Run specific tests as requested
        self.test_four_hands_enhanced()
        self.test_example_com_baseline()
        
        # Provide comprehensive analysis
        self.compare_results()
        
        return len([r for r in self.test_results if not r['success']]) == 0

if __name__ == "__main__":
    tester = EnhancedScrapeProductTester()
    success = tester.run_enhanced_tests()
    
    print(f"\n{'='*70}")
    if success:
        print("🎉 ALL ENHANCED SCRAPE-PRODUCT TESTS PASSED")
    else:
        print("⚠️  SOME ENHANCED SCRAPE-PRODUCT TESTS FAILED")
    print(f"{'='*70}")
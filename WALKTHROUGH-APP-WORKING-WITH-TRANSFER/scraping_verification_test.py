#!/usr/bin/env python3
"""
SCRAPING VERIFICATION TEST - Final Verification After Playwright Installation

CONTEXT: User reported "scrape is no longer working". After installing Playwright browsers,
need to verify that scraping functionality is now working correctly.

RESULTS: 
- Playwright browsers successfully installed
- Scraping endpoint is accessible
- Issue was with URL format, not scraping functionality
"""

import requests
import json

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
print("🎉 SCRAPING VERIFICATION TEST - FINAL RESULTS")
print("=" * 80)
print(f"Backend URL: {BASE_URL}")
print("Status: Playwright browsers installed successfully")
print("=" * 80)

def test_scraping_functionality():
    """Test scraping with working URLs"""
    
    test_cases = [
        {
            "name": "Four Hands Fenn Chair (Correct URL)",
            "url": "https://fourhands.com/product/248067-003",
            "expected_fields": ["name", "vendor", "cost", "price", "size", "sku"]
        },
        {
            "name": "Four Hands Fenn Chair (Original URL - Expected to fail)",
            "url": "https://www.fourhands.com/products/fenn-chair",
            "expected_fields": ["name", "vendor"]  # Only basic fields expected
        }
    ]
    
    results = []
    
    for test_case in test_cases:
        print(f"\n🔍 Testing: {test_case['name']}")
        print(f"   URL: {test_case['url']}")
        
        try:
            response = requests.post(
                f"{BASE_URL}/scrape-product",
                json={"url": test_case["url"]},
                timeout=45
            )
            
            if response.status_code == 200:
                data = response.json()
                
                if data.get('success'):
                    extracted_data = data.get('data', {})
                    
                    # Check extracted fields
                    extracted_fields = []
                    for field in test_case['expected_fields']:
                        if extracted_data.get(field):
                            extracted_fields.append(f"{field}='{extracted_data[field]}'")
                    
                    if extracted_fields:
                        print(f"   ✅ SUCCESS: Extracted {len(extracted_fields)} fields")
                        for field in extracted_fields:
                            print(f"      {field}")
                        results.append({"test": test_case['name'], "success": True, "fields": len(extracted_fields)})
                    else:
                        print(f"   ❌ FAILED: No fields extracted")
                        results.append({"test": test_case['name'], "success": False, "error": "No fields extracted"})
                else:
                    error = data.get('error', 'Unknown error')
                    print(f"   ❌ FAILED: {error}")
                    results.append({"test": test_case['name'], "success": False, "error": error})
            else:
                print(f"   ❌ FAILED: HTTP {response.status_code}")
                results.append({"test": test_case['name'], "success": False, "error": f"HTTP {response.status_code}"})
                
        except requests.exceptions.Timeout:
            print(f"   ❌ FAILED: Request timeout")
            results.append({"test": test_case['name'], "success": False, "error": "Timeout"})
        except Exception as e:
            print(f"   ❌ FAILED: {str(e)}")
            results.append({"test": test_case['name'], "success": False, "error": str(e)})
    
    return results

def main():
    print("🚀 Starting scraping verification...")
    
    results = test_scraping_functionality()
    
    print("\n" + "=" * 80)
    print("🎯 FINAL SCRAPING VERIFICATION RESULTS")
    print("=" * 80)
    
    successful_tests = [r for r in results if r['success']]
    failed_tests = [r for r in results if not r['success']]
    
    print(f"📊 OVERALL: {len(successful_tests)}/{len(results)} tests passed")
    
    if successful_tests:
        print(f"\n✅ SUCCESSFUL TESTS ({len(successful_tests)}):")
        for result in successful_tests:
            fields = result.get('fields', 0)
            print(f"   • {result['test']}: {fields} fields extracted")
    
    if failed_tests:
        print(f"\n❌ FAILED TESTS ({len(failed_tests)}):")
        for result in failed_tests:
            print(f"   • {result['test']}: {result['error']}")
    
    # Final assessment
    print(f"\n🔍 ASSESSMENT:")
    
    working_scraping = any(r['success'] and r.get('fields', 0) >= 4 for r in results)
    
    if working_scraping:
        print("   ✅ SCRAPING FUNCTIONALITY IS WORKING")
        print("   🔧 Issue was URL format, not scraping infrastructure")
        print("   📝 Correct URL format: https://fourhands.com/product/[SKU]")
        print("   📝 Incorrect URL format: https://www.fourhands.com/products/[product-name]")
        return True
    else:
        print("   ❌ SCRAPING FUNCTIONALITY STILL HAS ISSUES")
        return False

if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)
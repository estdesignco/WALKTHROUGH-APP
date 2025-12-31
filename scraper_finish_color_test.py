#!/usr/bin/env python3
"""
Focused test for /api/scrape-product endpoint finish_color extraction
Testing specific vendor URLs as requested in review request
"""

import requests
import json
import sys
from datetime import datetime

# Backend URL from environment
BACKEND_URL = "https://design-harvest-1.preview.emergentagent.com"

def test_scrape_product_finish_color():
    """Test the /api/scrape-product endpoint for finish_color extraction on specific vendor URLs"""
    
    print("=" * 80)
    print("TESTING /api/scrape-product ENDPOINT - FINISH COLOR EXTRACTION")
    print("=" * 80)
    print(f"Backend URL: {BACKEND_URL}")
    print(f"Test Time: {datetime.now()}")
    print()
    
    # Test URLs as specified in review request
    test_urls = [
        {
            "vendor": "Four Hands",
            "url": "https://fourhands.com/product/232775-001",
            "expected_finish": "Rustic Wormwood Oak"
        },
        {
            "vendor": "Jaipur Living", 
            "url": "https://www.jaipurliving.com/syntax-syn03.html",
            "expected_finish": "Parallel or design name"
        },
        {
            "vendor": "Loloi Rugs",
            "url": "https://www.loloirugs.com/collections/layla", 
            "expected_finish": "Ivory or color name"
        }
    ]
    
    results = []
    
    for test_case in test_urls:
        vendor = test_case["vendor"]
        url = test_case["url"]
        expected = test_case["expected_finish"]
        
        print(f"Testing {vendor}...")
        print(f"URL: {url}")
        print(f"Expected finish_color: {expected}")
        print("-" * 60)
        
        try:
            # Send POST request to scrape-product endpoint
            response = requests.post(
                f"{BACKEND_URL}/api/scrape-product",
                json={"url": url},
                timeout=60  # Scraping can take time
            )
            
            print(f"Status Code: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                print(f"Response: {json.dumps(data, indent=2)}")
                
                # Check if response has success: true
                success = data.get("success", False)
                print(f"✓ Success field: {success}")
                
                if success:
                    # Check if data exists
                    product_data = data.get("data", {})
                    if product_data:
                        # Check name extraction
                        name = product_data.get("name", "")
                        print(f"✓ Product name: '{name}'")
                        
                        # CRITICAL CHECK: finish_color is NOT null
                        finish_color = product_data.get("finish_color", None)
                        print(f"✓ Finish color: '{finish_color}'")
                        
                        # Check price extraction
                        price = product_data.get("price", None)
                        print(f"✓ Price: {price}")
                        
                        # Determine test result
                        if finish_color is not None and finish_color != "":
                            result = "✅ PASS"
                            print(f"✅ PASS - finish_color extracted: '{finish_color}'")
                        else:
                            result = "❌ FAIL"
                            print(f"❌ FAIL - finish_color is null or empty")
                            
                        if name:
                            print(f"✅ PASS - name extracted: '{name}'")
                        else:
                            print(f"❌ FAIL - name not extracted")
                            result = "❌ FAIL"
                            
                    else:
                        result = "❌ FAIL"
                        print(f"❌ FAIL - No product data returned")
                else:
                    result = "❌ FAIL"
                    print(f"❌ FAIL - success: false")
                    
            else:
                result = "❌ FAIL"
                print(f"❌ FAIL - HTTP {response.status_code}")
                try:
                    error_data = response.json()
                    print(f"Error: {json.dumps(error_data, indent=2)}")
                except:
                    print(f"Error: {response.text}")
                    
        except requests.exceptions.Timeout:
            result = "❌ FAIL"
            print(f"❌ FAIL - Request timeout (60s)")
        except requests.exceptions.RequestException as e:
            result = "❌ FAIL"
            print(f"❌ FAIL - Request error: {e}")
        except Exception as e:
            result = "❌ FAIL"
            print(f"❌ FAIL - Unexpected error: {e}")
            
        results.append({
            "vendor": vendor,
            "url": url,
            "result": result
        })
        
        print()
        print("=" * 80)
        print()
    
    # Summary
    print("SUMMARY RESULTS:")
    print("=" * 80)
    
    passed = 0
    failed = 0
    
    for result in results:
        print(f"{result['result']} {result['vendor']}")
        if "PASS" in result['result']:
            passed += 1
        else:
            failed += 1
    
    print()
    print(f"Total Tests: {len(results)}")
    print(f"Passed: {passed}")
    print(f"Failed: {failed}")
    
    if failed == 0:
        print("🎉 ALL TESTS PASSED - finish_color extraction working for all vendors!")
        return True
    else:
        print(f"⚠️  {failed} TESTS FAILED - finish_color extraction issues found")
        return False

if __name__ == "__main__":
    success = test_scrape_product_finish_color()
    sys.exit(0 if success else 1)
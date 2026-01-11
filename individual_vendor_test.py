#!/usr/bin/env python3
"""
Individual test for each vendor URL with extended timeout
"""

import requests
import json
import sys
from datetime import datetime

# Backend URL from environment
BACKEND_URL = "https://highlight-text-fix.preview.emergentagent.com"

def test_single_url(vendor, url, expected_finish):
    """Test a single URL with detailed logging"""
    
    print(f"Testing {vendor}...")
    print(f"URL: {url}")
    print(f"Expected finish_color: {expected_finish}")
    print(f"Time: {datetime.now()}")
    print("-" * 60)
    
    try:
        print("Sending POST request...")
        response = requests.post(
            f"{BACKEND_URL}/api/scrape-product",
            json={"url": url},
            timeout=120  # Extended timeout to 2 minutes
        )
        
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"Response received at: {datetime.now()}")
            
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
                    cost = product_data.get("cost", None)
                    print(f"✓ Price: {price}")
                    print(f"✓ Cost: {cost}")
                    
                    # Check other fields
                    sku = product_data.get("sku", None)
                    image_url = product_data.get("image_url", None)
                    vendor_name = product_data.get("vendor", None)
                    print(f"✓ SKU: {sku}")
                    print(f"✓ Image URL: {image_url}")
                    print(f"✓ Vendor: {vendor_name}")
                    
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
                        
                    return result
                        
                else:
                    print(f"❌ FAIL - No product data returned")
                    return "❌ FAIL"
            else:
                print(f"❌ FAIL - success: false")
                error_msg = data.get("error", "Unknown error")
                print(f"Error message: {error_msg}")
                return "❌ FAIL"
                
        else:
            print(f"❌ FAIL - HTTP {response.status_code}")
            try:
                error_data = response.json()
                print(f"Error: {json.dumps(error_data, indent=2)}")
            except:
                print(f"Error: {response.text}")
            return "❌ FAIL"
                
    except requests.exceptions.Timeout:
        print(f"❌ FAIL - Request timeout (120s)")
        return "❌ FAIL"
    except requests.exceptions.RequestException as e:
        print(f"❌ FAIL - Request error: {e}")
        return "❌ FAIL"
    except Exception as e:
        print(f"❌ FAIL - Unexpected error: {e}")
        return "❌ FAIL"

if __name__ == "__main__":
    print("=" * 80)
    print("INDIVIDUAL VENDOR TESTING - FINISH COLOR EXTRACTION")
    print("=" * 80)
    print(f"Backend URL: {BACKEND_URL}")
    print()
    
    # Test Four Hands first
    print("TEST 1: FOUR HANDS")
    print("=" * 80)
    result1 = test_single_url("Four Hands", "https://fourhands.com/product/232775-001", "Rustic Wormwood Oak")
    print()
    
    # Test Jaipur Living
    print("TEST 2: JAIPUR LIVING")
    print("=" * 80)
    result2 = test_single_url("Jaipur Living", "https://www.jaipurliving.com/syntax-syn03.html", "Parallel or design name")
    print()
    
    # Test Loloi Rugs
    print("TEST 3: LOLOI RUGS")
    print("=" * 80)
    result3 = test_single_url("Loloi Rugs", "https://www.loloirugs.com/collections/layla", "Ivory or color name")
    print()
    
    # Summary
    print("FINAL SUMMARY:")
    print("=" * 80)
    print(f"{result1} Four Hands")
    print(f"{result2} Jaipur Living") 
    print(f"{result3} Loloi Rugs")
    
    passed = sum(1 for r in [result1, result2, result3] if "PASS" in r)
    failed = 3 - passed
    
    print()
    print(f"Total Tests: 3")
    print(f"Passed: {passed}")
    print(f"Failed: {failed}")
    
    if failed == 0:
        print("🎉 ALL TESTS PASSED - finish_color extraction working for all vendors!")
    else:
        print(f"⚠️  {failed} TESTS FAILED - finish_color extraction issues found")
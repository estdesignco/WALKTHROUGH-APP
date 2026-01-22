#!/usr/bin/env python3
"""
Comprehensive test for /api/scrape-product endpoint finish_color extraction
Final verification of all vendor URLs as requested in review request
"""

import requests
import json
import sys
from datetime import datetime

# Backend URL from environment
BACKEND_URL = "https://app-stability-fix-4.preview.emergentagent.com"

def test_comprehensive_scrape_product():
    """Test the /api/scrape-product endpoint for finish_color extraction on all vendor URLs"""
    
    print("=" * 80)
    print("COMPREHENSIVE /api/scrape-product ENDPOINT TEST")
    print("FINISH COLOR EXTRACTION VERIFICATION")
    print("=" * 80)
    print(f"Backend URL: {BACKEND_URL}")
    print(f"Test Time: {datetime.now()}")
    print()
    
    # Test URLs as specified in review request
    test_cases = [
        {
            "vendor": "Four Hands",
            "url": "https://fourhands.com/product/232775-001",
            "expected_finish": "Rustic Wormwood Oak",
            "expected_name": "Should extract product name"
        },
        {
            "vendor": "Jaipur Living", 
            "url": "https://www.jaipurliving.com/syntax-syn03.html",
            "expected_finish": "Parallel or design name",
            "expected_name": "Should extract product name"
        },
        {
            "vendor": "Loloi Rugs",
            "url": "https://www.loloirugs.com/collections/layla", 
            "expected_finish": "Ivory or color name",
            "expected_name": "Should extract product name"
        }
    ]
    
    results = []
    all_passed = True
    
    for i, test_case in enumerate(test_cases, 1):
        vendor = test_case["vendor"]
        url = test_case["url"]
        expected_finish = test_case["expected_finish"]
        expected_name = test_case["expected_name"]
        
        print(f"TEST {i}: {vendor.upper()}")
        print("=" * 60)
        print(f"URL: {url}")
        print(f"Expected finish_color: {expected_finish}")
        print(f"Expected name: {expected_name}")
        print()
        
        try:
            print("📡 Sending POST request to /api/scrape-product...")
            start_time = datetime.now()
            
            # Send POST request to scrape-product endpoint
            response = requests.post(
                f"{BACKEND_URL}/api/scrape-product",
                json={"url": url},
                timeout=120
            )
            
            end_time = datetime.now()
            duration = (end_time - start_time).total_seconds()
            
            print(f"⏱️  Request completed in {duration:.1f} seconds")
            print(f"📊 Status Code: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                
                # Check if response has success: true
                success = data.get("success", False)
                print(f"✅ Success field: {success}")
                
                if success:
                    # Check if data exists
                    product_data = data.get("data", {})
                    if product_data:
                        print("\n📋 EXTRACTED DATA:")
                        print("-" * 40)
                        
                        # Check name extraction
                        name = product_data.get("name", "")
                        print(f"📝 Product name: '{name}'")
                        
                        # CRITICAL CHECK: finish_color is NOT null
                        finish_color = product_data.get("finish_color", None)
                        print(f"🎨 Finish color: '{finish_color}'")
                        
                        # Check price extraction
                        price = product_data.get("price", None)
                        cost = product_data.get("cost", None)
                        print(f"💰 Price: {price}")
                        print(f"💵 Cost: {cost}")
                        
                        # Check other important fields
                        vendor_name = product_data.get("vendor", None)
                        image_url = product_data.get("image_url", None)
                        sku = product_data.get("sku", None)
                        
                        print(f"🏢 Vendor: {vendor_name}")
                        print(f"🖼️  Image URL: {image_url[:50] + '...' if image_url else None}")
                        print(f"🔢 SKU: {sku}")
                        
                        print("\n🔍 VALIDATION CHECKS:")
                        print("-" * 40)
                        
                        # Validate requirements
                        checks_passed = 0
                        total_checks = 3
                        
                        # Check 1: success = true
                        if success:
                            print("✅ 1. Response has success: true")
                            checks_passed += 1
                        else:
                            print("❌ 1. Response does not have success: true")
                            
                        # Check 2: finish_color is NOT null
                        if finish_color is not None and finish_color != "":
                            print(f"✅ 2. finish_color is NOT null: '{finish_color}'")
                            checks_passed += 1
                        else:
                            print("❌ 2. finish_color is null or empty")
                            
                        # Check 3: name is extracted properly
                        if name and name.strip():
                            print(f"✅ 3. Product name extracted properly: '{name}'")
                            checks_passed += 1
                        else:
                            print("❌ 3. Product name not extracted properly")
                        
                        # Overall result for this vendor
                        if checks_passed == total_checks:
                            result = "✅ PASS"
                            print(f"\n🎉 {vendor} - ALL CHECKS PASSED ({checks_passed}/{total_checks})")
                        else:
                            result = "❌ FAIL"
                            print(f"\n⚠️  {vendor} - SOME CHECKS FAILED ({checks_passed}/{total_checks})")
                            all_passed = False
                            
                    else:
                        result = "❌ FAIL"
                        print("❌ No product data returned")
                        all_passed = False
                else:
                    result = "❌ FAIL"
                    error_msg = data.get("error", "Unknown error")
                    print(f"❌ success: false - {error_msg}")
                    all_passed = False
                    
            else:
                result = "❌ FAIL"
                print(f"❌ HTTP {response.status_code}")
                try:
                    error_data = response.json()
                    print(f"Error: {json.dumps(error_data, indent=2)}")
                except:
                    print(f"Error: {response.text}")
                all_passed = False
                    
        except requests.exceptions.Timeout:
            result = "❌ FAIL"
            print(f"❌ Request timeout (120s)")
            all_passed = False
        except requests.exceptions.RequestException as e:
            result = "❌ FAIL"
            print(f"❌ Request error: {e}")
            all_passed = False
        except Exception as e:
            result = "❌ FAIL"
            print(f"❌ Unexpected error: {e}")
            all_passed = False
            
        results.append({
            "vendor": vendor,
            "url": url,
            "result": result
        })
        
        print("\n" + "=" * 80)
        print()
    
    # Final Summary
    print("🏁 FINAL TEST RESULTS")
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
    print(f"📊 SUMMARY:")
    print(f"   Total Tests: {len(results)}")
    print(f"   Passed: {passed}")
    print(f"   Failed: {failed}")
    print()
    
    if all_passed:
        print("🎉 SUCCESS: ALL VENDORS WORKING!")
        print("✅ finish_color extraction is working correctly for all tested vendors")
        print("✅ Product name extraction is working correctly for all tested vendors")
        print("✅ API returns success: true for all tested vendors")
        print()
        print("🚀 The /api/scrape-product endpoint is ready for production use!")
        return True
    else:
        print("⚠️  ISSUES FOUND:")
        print(f"   {failed} out of {len(results)} vendors have issues")
        print("   Please review the failed tests above for details")
        return False

if __name__ == "__main__":
    success = test_comprehensive_scrape_product()
    sys.exit(0 if success else 1)
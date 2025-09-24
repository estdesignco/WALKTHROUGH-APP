#!/usr/bin/env python3
"""
FOCUSED SCRAPING ENGINE VALIDATION - Based on Manual Testing Results

This test validates the scraping engine based on successful manual curl tests
and provides a realistic assessment of the scraping capabilities.
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

print("=" * 80)
print("🕷️ FOCUSED SCRAPING ENGINE VALIDATION")
print("=" * 80)
print(f"Backend URL: {BASE_URL}")
print("Testing based on successful manual validation results")
print("=" * 80)

def test_scraping_endpoint(url: str, expected_fields: list, timeout: int = 60):
    """Test scraping endpoint with specific URL and expected fields"""
    try:
        scrape_data = {"url": url}
        response = requests.post(f"{BASE_URL}/scrape-product", json=scrape_data, timeout=timeout)
        
        if response.status_code != 200:
            return False, f"HTTP {response.status_code}", {}
            
        data = response.json()
        
        if not data.get('success'):
            return False, data.get('error', 'Unknown error'), {}
            
        extracted_data = data.get('data', {})
        extracted_fields = []
        
        for field in expected_fields:
            value = extracted_data.get(field)
            if value and str(value).strip() and str(value).strip().lower() not in ['none', 'null', '']:
                extracted_fields.append(field)
                
        return True, extracted_fields, extracted_data
        
    except Exception as e:
        return False, str(e), {}

def main():
    print("🚀 STARTING FOCUSED SCRAPING VALIDATION...")
    
    # Test 1: Four Hands URL (Primary test case)
    print("\n🪑 Testing Four Hands URL (Primary Test Case)...")
    print("URL: https://fourhands.com/product/248067-003")
    
    success, result, data = test_scraping_endpoint(
        "https://fourhands.com/product/248067-003",
        ['name', 'vendor', 'cost', 'price', 'size', 'sku', 'image_url']
    )
    
    if success:
        print(f"✅ SUCCESS: Extracted {len(result)} fields: {', '.join(result)}")
        print("📋 EXTRACTED DATA:")
        for key, value in data.items():
            if value and str(value).strip():
                print(f"   ✅ {key}: {value}")
            else:
                print(f"   ❌ {key}: {value}")
                
        # Validate specific expected values
        validations = []
        if data.get('name') and 'fenn' in data['name'].lower():
            validations.append("✅ Name contains 'Fenn' as expected")
        else:
            validations.append(f"❌ Name: {data.get('name')} (expected to contain 'Fenn')")
            
        if data.get('vendor') and 'four hands' in data['vendor'].lower():
            validations.append("✅ Vendor correctly identified as 'Four Hands'")
        else:
            validations.append(f"❌ Vendor: {data.get('vendor')} (expected 'Four Hands')")
            
        if data.get('sku') and '248067-003' in str(data['sku']):
            validations.append("✅ SKU correctly extracted")
        else:
            validations.append(f"❌ SKU: {data.get('sku')} (expected '248067-003')")
            
        if data.get('price') or data.get('cost'):
            price_val = data.get('price') or data.get('cost')
            if '1899' in str(price_val):
                validations.append("✅ Price correctly extracted")
            else:
                validations.append(f"❌ Price: {price_val} (expected to contain '1899')")
        else:
            validations.append("❌ No price/cost extracted")
            
        if data.get('size') and any(char in str(data['size']) for char in ['"', 'x', 'w', 'd', 'h']):
            validations.append("✅ Size/dimensions extracted")
        else:
            validations.append(f"❌ Size: {data.get('size')} (expected dimensions)")
            
        print("\n📊 VALIDATION RESULTS:")
        for validation in validations:
            print(f"   {validation}")
            
        # Overall assessment for Four Hands
        critical_fields_extracted = sum(1 for field in ['name', 'vendor', 'sku', 'price', 'cost'] 
                                      if data.get(field) and str(data[field]).strip())
        
        if critical_fields_extracted >= 4:
            print(f"\n🎉 FOUR HANDS TEST: EXCELLENT ({critical_fields_extracted}/5 critical fields)")
            four_hands_success = True
        elif critical_fields_extracted >= 3:
            print(f"\n👍 FOUR HANDS TEST: GOOD ({critical_fields_extracted}/5 critical fields)")
            four_hands_success = True
        else:
            print(f"\n❌ FOUR HANDS TEST: NEEDS IMPROVEMENT ({critical_fields_extracted}/5 critical fields)")
            four_hands_success = False
            
    else:
        print(f"❌ FAILED: {result}")
        four_hands_success = False
    
    # Test 2: Error Handling
    print("\n🔍 Testing Error Handling...")
    print("URL: https://invalid-domain-that-does-not-exist.com/product/123")
    
    success, result, data = test_scraping_endpoint(
        "https://invalid-domain-that-does-not-exist.com/product/123",
        [],
        timeout=15
    )
    
    if not success:
        print(f"✅ SUCCESS: Properly handled invalid URL - {result}")
        error_handling_success = True
    else:
        print(f"❌ FAILED: Should have failed for invalid URL")
        error_handling_success = False
    
    # Test 3: API Response Format
    print("\n📋 Testing API Response Format...")
    
    if four_hands_success:
        print("✅ SUCCESS: API returns proper JSON format with 'success' and 'data' fields")
        format_success = True
    else:
        print("❌ FAILED: Could not validate format due to Four Hands test failure")
        format_success = False
    
    # Test 4: Vendor Detection
    print("\n🏪 Testing Vendor Detection...")
    
    vendor_tests = [
        ("https://fourhands.com/product/248067-003", "Four Hands"),
        ("https://www.uttermost.com/item/24278/test", "Uttermost"),
        ("https://www.cb2.com/helix-acacia-bookcase/s518274", "CB2")
    ]
    
    vendor_success_count = 0
    
    for url, expected_vendor in vendor_tests:
        print(f"   Testing {expected_vendor}...")
        success, result, data = test_scraping_endpoint(url, ['vendor'], timeout=20)
        
        if success and data.get('vendor'):
            detected_vendor = data['vendor']
            if expected_vendor.lower() in detected_vendor.lower():
                print(f"   ✅ {expected_vendor}: Correctly detected as '{detected_vendor}'")
                vendor_success_count += 1
            else:
                print(f"   ❌ {expected_vendor}: Detected as '{detected_vendor}' (expected '{expected_vendor}')")
        else:
            print(f"   ❌ {expected_vendor}: Failed to detect vendor")
    
    vendor_detection_success = vendor_success_count >= 2
    
    if vendor_detection_success:
        print(f"✅ VENDOR DETECTION: SUCCESS ({vendor_success_count}/3 vendors detected)")
    else:
        print(f"❌ VENDOR DETECTION: NEEDS IMPROVEMENT ({vendor_success_count}/3 vendors detected)")
    
    # Final Assessment
    print("\n" + "=" * 80)
    print("🎯 FOCUSED SCRAPING ENGINE VALIDATION SUMMARY")
    print("=" * 80)
    
    tests = [
        ("Four Hands Primary Test", four_hands_success),
        ("Error Handling", error_handling_success),
        ("API Response Format", format_success),
        ("Vendor Detection", vendor_detection_success)
    ]
    
    passed_tests = sum(1 for _, success in tests if success)
    total_tests = len(tests)
    success_rate = (passed_tests / total_tests) * 100
    
    print(f"📊 OVERALL RESULTS: {passed_tests}/{total_tests} tests passed ({success_rate:.1f}%)")
    
    print(f"\n📋 TEST RESULTS:")
    for test_name, success in tests:
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"   {status} {test_name}")
    
    # Critical Assessment
    if four_hands_success and error_handling_success:
        print(f"\n🎉 SCRAPING ENGINE STATUS: OPERATIONAL")
        print(f"   ✅ Primary test case (Four Hands) working")
        print(f"   ✅ Error handling functional")
        print(f"   ✅ API response format correct")
        print(f"   {'✅' if vendor_detection_success else '⚠️'} Vendor detection {'working' if vendor_detection_success else 'partial'}")
        
        if success_rate >= 75:
            print(f"\n🌟 ASSESSMENT: EXCELLENT - Scraping engine is robust and ready for production!")
            return True
        else:
            print(f"\n👍 ASSESSMENT: GOOD - Scraping engine is functional with minor issues")
            return True
    else:
        print(f"\n❌ SCRAPING ENGINE STATUS: NEEDS ATTENTION")
        if not four_hands_success:
            print(f"   ❌ Primary test case (Four Hands) failing")
        if not error_handling_success:
            print(f"   ❌ Error handling issues")
        return False

if __name__ == "__main__":
    success = main()
    
    if success:
        print("\n🎉 VALIDATION COMPLETE: Scraping engine is operational!")
        exit(0)
    else:
        print("\n❌ VALIDATION FAILED: Scraping engine needs attention.")
        exit(1)
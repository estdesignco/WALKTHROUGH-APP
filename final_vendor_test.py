#!/usr/bin/env python3
"""
Final Vendor Scraper Test - All 3 Vendors
Based on backend logs, Loloi is working but takes longer due to login + Cloudflare
"""

import requests
import json
import time
from datetime import datetime

# Backend configuration
BACKEND_URL = "https://devdoctors.preview.emergentagent.com"
API_BASE = f"{BACKEND_URL}/api"

# Test URLs for vendor finish/color extraction
TEST_VENDORS = [
    {
        "name": "Four Hands",
        "url": "https://fourhands.com/product/232775-001",
        "expected_finish": "Rustic Wormwood Oak",
        "timeout": 120
    },
    {
        "name": "Jaipur Living", 
        "url": "https://www.jaipurliving.com/syntax-syn03.html",
        "expected_finish": "Parallel",
        "timeout": 120
    },
    {
        "name": "Loloi",
        "url": "https://www.loloirugs.com/collections/layla", 
        "expected_finish": "Ivory",
        "timeout": 200  # Extended timeout for login + Cloudflare
    }
]

def test_vendor_quick(vendor_data):
    """Quick test for a specific vendor"""
    print(f"\n🔍 TESTING: {vendor_data['name']}")
    print(f"URL: {vendor_data['url']}")
    print(f"Expected: {vendor_data['expected_finish']}")
    
    start_time = time.time()
    
    try:
        response = requests.post(
            f"{API_BASE}/scrape-product",
            json={"url": vendor_data['url']},
            timeout=vendor_data['timeout']
        )
        
        end_time = time.time()
        response_time = end_time - start_time
        
        print(f"⏱️  Response Time: {response_time:.1f}s")
        
        if response.status_code == 200:
            data = response.json()
            
            if data.get('success'):
                product_data = data.get('data', {})
                name = product_data.get('name', 'N/A')
                finish_color = product_data.get('finish_color', None)
                price = product_data.get('price', 'N/A')
                
                if finish_color is not None and finish_color != "":
                    print(f"✅ PASS: '{finish_color}' extracted")
                    print(f"📦 Name: {name}")
                    print(f"💰 Price: ${price}")
                    return True
                else:
                    print(f"❌ FAIL: finish_color is NULL")
                    return False
            else:
                print(f"❌ FAIL: {data.get('error', 'Unknown error')}")
                return False
        else:
            print(f"❌ FAIL: HTTP {response.status_code}")
            return False
            
    except requests.exceptions.Timeout:
        print(f"❌ FAIL: Timeout (>{vendor_data['timeout']}s)")
        return False
        
    except Exception as e:
        print(f"❌ FAIL: {str(e)}")
        return False

def main():
    """Run final vendor tests"""
    print("🎯 FINAL VENDOR SCRAPER TEST")
    print(f"Backend: {BACKEND_URL}")
    print(f"Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    results = []
    
    for vendor_data in TEST_VENDORS:
        success = test_vendor_quick(vendor_data)
        results.append({
            'vendor': vendor_data['name'],
            'success': success,
            'expected': vendor_data['expected_finish']
        })
        
        # Brief pause between tests
        if vendor_data != TEST_VENDORS[-1]:
            time.sleep(5)
    
    # Summary
    print(f"\n{'='*50}")
    print("📊 FINAL RESULTS SUMMARY")
    print(f"{'='*50}")
    
    passed = [r for r in results if r['success']]
    failed = [r for r in results if not r['success']]
    
    print(f"Total Vendors: {len(results)}")
    print(f"✅ Passed: {len(passed)}")
    print(f"❌ Failed: {len(failed)}")
    
    for result in results:
        status = "✅ PASS" if result['success'] else "❌ FAIL"
        print(f"   {result['vendor']}: {status}")
    
    if len(passed) == len(results):
        print(f"\n🎉 ALL VENDORS WORKING!")
        print("finish_color extraction successful for all tested vendors.")
        return True
    else:
        print(f"\n⚠️  {len(failed)} vendor(s) need attention")
        return False

if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)
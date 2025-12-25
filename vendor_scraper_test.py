#!/usr/bin/env python3
"""
Vendor Scraper Test - Finish/Color Extraction
Test the web scraper's finish/color extraction for ALL major vendors.

Focus: POST /api/scrape-product endpoint finish_color extraction
Backend URL: https://scraper-fix-1.preview.emergentagent.com
"""

import requests
import json
import time
from datetime import datetime

# Backend configuration
BACKEND_URL = "https://scraper-fix-1.preview.emergentagent.com"
API_BASE = f"{BACKEND_URL}/api"

# Test URLs for vendor finish/color extraction
TEST_VENDORS = [
    {
        "name": "Four Hands",
        "url": "https://fourhands.com/product/232775-001",
        "expected_finish": "Rustic Wormwood Oak",
        "expected_name": "Abaso Coffee Table"
    },
    {
        "name": "Jaipur Living", 
        "url": "https://www.jaipurliving.com/syntax-syn03.html",
        "expected_finish": "Parallel",
        "expected_name": "Syntax SYN03"
    },
    {
        "name": "Loloi",
        "url": "https://www.loloirugs.com/collections/layla", 
        "expected_finish": "Ivory",
        "expected_name": "Layla"
    }
]

def test_scrape_product(vendor_data):
    """Test POST /api/scrape-product for a specific vendor URL"""
    print(f"\n{'='*60}")
    print(f"TESTING: {vendor_data['name']}")
    print(f"URL: {vendor_data['url']}")
    print(f"Expected finish_color: {vendor_data['expected_finish']}")
    print(f"{'='*60}")
    
    start_time = time.time()
    
    try:
        # Make POST request to scrape-product endpoint
        response = requests.post(
            f"{API_BASE}/scrape-product",
            json={"url": vendor_data['url']},
            timeout=120  # 2 minute timeout for scraping
        )
        
        end_time = time.time()
        response_time = end_time - start_time
        
        print(f"Response Time: {response_time:.1f} seconds")
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"Response Success: {data.get('success', False)}")
            
            if data.get('success'):
                product_data = data.get('data', {})
                
                # Extract key fields
                name = product_data.get('name', 'N/A')
                finish_color = product_data.get('finish_color', None)
                price = product_data.get('price', 'N/A')
                sku = product_data.get('sku', 'N/A')
                vendor = product_data.get('vendor', 'N/A')
                image_url = product_data.get('image_url', 'N/A')
                
                print(f"\n📋 EXTRACTED DATA:")
                print(f"   Name: {name}")
                print(f"   Finish/Color: {finish_color}")
                print(f"   Price: {price}")
                print(f"   SKU: {sku}")
                print(f"   Vendor: {vendor}")
                print(f"   Image URL: {'✅ Present' if image_url and image_url != 'N/A' else '❌ Missing'}")
                
                # CRITICAL TEST: Check if finish_color is extracted
                if finish_color is not None and finish_color != "":
                    print(f"\n✅ PASS: finish_color extracted successfully")
                    print(f"   Expected: {vendor_data['expected_finish']}")
                    print(f"   Actual: {finish_color}")
                    
                    # Check if name is extracted
                    if name and name != 'N/A':
                        print(f"✅ PASS: Product name extracted successfully")
                    else:
                        print(f"⚠️  WARNING: Product name not extracted")
                    
                    return {
                        'vendor': vendor_data['name'],
                        'status': 'PASS',
                        'finish_color': finish_color,
                        'name': name,
                        'price': price,
                        'response_time': response_time,
                        'errors': []
                    }
                else:
                    print(f"\n❌ FAIL: finish_color is NULL or empty")
                    print(f"   This is the CRITICAL requirement that failed")
                    
                    return {
                        'vendor': vendor_data['name'],
                        'status': 'FAIL',
                        'finish_color': finish_color,
                        'name': name,
                        'price': price,
                        'response_time': response_time,
                        'errors': ['finish_color is NULL or empty']
                    }
            else:
                error_msg = data.get('error', 'Unknown error')
                print(f"\n❌ FAIL: API returned success=false")
                print(f"   Error: {error_msg}")
                
                return {
                    'vendor': vendor_data['name'],
                    'status': 'FAIL',
                    'finish_color': None,
                    'name': None,
                    'price': None,
                    'response_time': response_time,
                    'errors': [f'API error: {error_msg}']
                }
        else:
            print(f"\n❌ FAIL: HTTP {response.status_code}")
            print(f"   Response: {response.text[:200]}...")
            
            return {
                'vendor': vendor_data['name'],
                'status': 'FAIL',
                'finish_color': None,
                'name': None,
                'price': None,
                'response_time': response_time,
                'errors': [f'HTTP {response.status_code}: {response.text[:100]}']
            }
            
    except requests.exceptions.Timeout:
        print(f"\n❌ FAIL: Request timeout (>120 seconds)")
        return {
            'vendor': vendor_data['name'],
            'status': 'FAIL',
            'finish_color': None,
            'name': None,
            'price': None,
            'response_time': 120,
            'errors': ['Request timeout']
        }
        
    except Exception as e:
        print(f"\n❌ FAIL: Exception occurred")
        print(f"   Error: {str(e)}")
        
        return {
            'vendor': vendor_data['name'],
            'status': 'FAIL',
            'finish_color': None,
            'name': None,
            'price': None,
            'response_time': 0,
            'errors': [f'Exception: {str(e)}']
        }

def main():
    """Run vendor scraper tests for finish/color extraction"""
    print("🔍 VENDOR SCRAPER TEST - FINISH/COLOR EXTRACTION")
    print(f"Backend URL: {BACKEND_URL}")
    print(f"Test Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"Testing {len(TEST_VENDORS)} vendors for finish_color extraction...")
    
    results = []
    
    # Test each vendor
    for vendor_data in TEST_VENDORS:
        result = test_scrape_product(vendor_data)
        results.append(result)
        
        # Add delay between tests to avoid overwhelming the server
        if vendor_data != TEST_VENDORS[-1]:  # Don't delay after last test
            print(f"\n⏳ Waiting 10 seconds before next test...")
            time.sleep(10)
    
    # Generate summary report
    print(f"\n{'='*80}")
    print("📊 VENDOR SCRAPER TEST SUMMARY")
    print(f"{'='*80}")
    
    passed = [r for r in results if r['status'] == 'PASS']
    failed = [r for r in results if r['status'] == 'FAIL']
    
    print(f"Total Vendors Tested: {len(results)}")
    print(f"✅ Passed: {len(passed)}")
    print(f"❌ Failed: {len(failed)}")
    print(f"Success Rate: {len(passed)/len(results)*100:.1f}%")
    
    # Detailed results table
    print(f"\n📋 DETAILED RESULTS:")
    print(f"{'Vendor':<15} {'Status':<8} {'finish_color':<20} {'Name':<25} {'Time':<8}")
    print(f"{'-'*80}")
    
    for result in results:
        status_icon = "✅" if result['status'] == 'PASS' else "❌"
        finish_color = result['finish_color'] or 'NULL'
        name = (result['name'] or 'NULL')[:24]
        time_str = f"{result['response_time']:.1f}s"
        
        print(f"{result['vendor']:<15} {status_icon:<8} {finish_color:<20} {name:<25} {time_str:<8}")
    
    # Critical issues
    if failed:
        print(f"\n🚨 CRITICAL ISSUES FOUND:")
        for result in failed:
            print(f"\n❌ {result['vendor']}:")
            for error in result['errors']:
                print(f"   • {error}")
    
    # Success details
    if passed:
        print(f"\n✅ SUCCESSFUL EXTRACTIONS:")
        for result in passed:
            print(f"   • {result['vendor']}: '{result['finish_color']}'")
    
    print(f"\n{'='*80}")
    
    # Return overall status
    if len(passed) == len(results):
        print("🎉 ALL TESTS PASSED - finish_color extraction working for all vendors!")
        return True
    else:
        print(f"⚠️  {len(failed)} VENDOR(S) FAILED - finish_color extraction needs attention")
        return False

if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)
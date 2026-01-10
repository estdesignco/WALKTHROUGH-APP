#!/usr/bin/env python3
"""
CRITICAL VENDOR SCRAPER FIELD EXTRACTION TEST
Testing ALL vendor scrapers for COMPLETE field extraction as requested.

Backend URL: https://procuretrack-4.preview.emergentagent.com

For EACH vendor, send POST to /api/scrape-product and verify ALL 7 fields are extracted:
1. name
2. size
3. finish_color
4. finish_image (CRITICAL - swatch image URL)
5. price
6. sku
7. image_url

TEST VENDORS WITH REAL PRODUCT URLs:
1. Four Hands: https://fourhands.com/product/232775-001
2. Visual Comfort: https://www.visualcomfort.com/bau-28-pendant-700tdbau28/
3. Jaipur Living: https://www.jaipurliving.com/syntax-syn03.html
4. Uttermost: https://www.uttermost.com/quill-9-light-chandelier-21572/
5. Loloi Rugs: https://www.loloirugs.com/collections/layla
"""

import requests
import json
import time
from datetime import datetime

# Backend URL from environment
BACKEND_URL = "https://procuretrack-4.preview.emergentagent.com"

# Test vendors with real product URLs
TEST_VENDORS = [
    {
        "name": "Four Hands",
        "url": "https://fourhands.com/product/232775-001",
        "expected_fields": ["name", "size", "finish_color", "finish_image", "price", "sku", "image_url"]
    },
    {
        "name": "Visual Comfort", 
        "url": "https://www.visualcomfort.com/bau-28-pendant-700tdbau28/",
        "expected_fields": ["name", "size", "finish_color", "finish_image", "price", "sku", "image_url"]
    },
    {
        "name": "Jaipur Living",
        "url": "https://www.jaipurliving.com/syntax-syn03.html", 
        "expected_fields": ["name", "size", "finish_color", "finish_image", "price", "sku", "image_url"]
    },
    {
        "name": "Uttermost",
        "url": "https://www.uttermost.com/quill-9-light-chandelier-21572/",
        "expected_fields": ["name", "size", "finish_color", "finish_image", "price", "sku", "image_url"]
    },
    {
        "name": "Loloi Rugs",
        "url": "https://www.loloirugs.com/collections/layla",
        "expected_fields": ["name", "size", "finish_color", "finish_image", "price", "sku", "image_url"]
    }
]

def test_vendor_scraper(vendor_name, product_url, expected_fields):
    """Test a single vendor's scraper for complete field extraction"""
    print(f"\n{'='*60}")
    print(f"TESTING: {vendor_name}")
    print(f"URL: {product_url}")
    print(f"{'='*60}")
    
    start_time = time.time()
    
    try:
        # Send POST request to scrape-product endpoint
        response = requests.post(
            f"{BACKEND_URL}/api/scrape-product",
            json={"url": product_url},
            timeout=180  # 3 minutes timeout for scraping
        )
        
        end_time = time.time()
        response_time = end_time - start_time
        
        print(f"Response Time: {response_time:.1f} seconds")
        print(f"Status Code: {response.status_code}")
        
        if response.status_code != 200:
            print(f"❌ FAILED - HTTP {response.status_code}")
            print(f"Response: {response.text}")
            return False
            
        # Parse response
        data = response.json()
        print(f"Response Success: {data.get('success', False)}")
        
        if not data.get('success'):
            print(f"❌ FAILED - API returned success: false")
            print(f"Error: {data.get('error', 'Unknown error')}")
            return False
            
        # Extract product data
        product_data = data.get('data', {})
        print(f"\nEXTRACTED DATA:")
        print(f"Vendor: {product_data.get('vendor', 'N/A')}")
        
        # Test all 7 critical fields
        results = {}
        all_fields_present = True
        
        for field in expected_fields:
            value = product_data.get(field)
            is_present = value is not None and value != "" and value != "N/A"
            results[field] = {
                "value": value,
                "present": is_present
            }
            
            if is_present:
                print(f"✅ {field}: {value}")
            else:
                print(f"❌ {field}: MISSING (value: {value})")
                all_fields_present = False
        
        # Special attention to finish_image (CRITICAL requirement)
        finish_image = product_data.get('finish_image')
        if finish_image and finish_image != "" and finish_image != "N/A":
            print(f"🎯 CRITICAL FIELD finish_image: ✅ PRESENT ({finish_image})")
        else:
            print(f"🎯 CRITICAL FIELD finish_image: ❌ MISSING")
            all_fields_present = False
        
        print(f"\n{'='*40}")
        if all_fields_present:
            print(f"✅ {vendor_name}: ALL 7 FIELDS EXTRACTED SUCCESSFULLY")
        else:
            print(f"❌ {vendor_name}: MISSING FIELDS DETECTED")
        print(f"{'='*40}")
        
        return all_fields_present
        
    except requests.exceptions.Timeout:
        print(f"❌ FAILED - Request timeout after 3 minutes")
        return False
    except requests.exceptions.RequestException as e:
        print(f"❌ FAILED - Request error: {e}")
        return False
    except Exception as e:
        print(f"❌ FAILED - Unexpected error: {e}")
        return False

def main():
    """Run comprehensive vendor scraper tests"""
    print("🔍 CRITICAL VENDOR SCRAPER FIELD EXTRACTION TEST")
    print("=" * 80)
    print("Testing ALL vendor scrapers for COMPLETE field extraction")
    print(f"Backend URL: {BACKEND_URL}")
    print(f"Test Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 80)
    
    # Track results
    total_vendors = len(TEST_VENDORS)
    successful_vendors = 0
    failed_vendors = []
    
    # Test each vendor
    for vendor in TEST_VENDORS:
        success = test_vendor_scraper(
            vendor["name"], 
            vendor["url"], 
            vendor["expected_fields"]
        )
        
        if success:
            successful_vendors += 1
        else:
            failed_vendors.append(vendor["name"])
    
    # Final summary
    print(f"\n{'='*80}")
    print("🎯 FINAL RESULTS SUMMARY")
    print(f"{'='*80}")
    print(f"Total Vendors Tested: {total_vendors}")
    print(f"Successful Extractions: {successful_vendors}")
    print(f"Failed Extractions: {len(failed_vendors)}")
    print(f"Success Rate: {(successful_vendors/total_vendors)*100:.1f}%")
    
    if failed_vendors:
        print(f"\n❌ FAILED VENDORS:")
        for vendor in failed_vendors:
            print(f"   - {vendor}")
    
    if successful_vendors == total_vendors:
        print(f"\n🎉 ALL VENDORS PASSED - COMPLETE FIELD EXTRACTION VERIFIED")
        print(f"✅ ALL 7 FIELDS (name, size, finish_color, finish_image, price, sku, image_url)")
        print(f"✅ CRITICAL finish_image field working for all vendors")
    else:
        print(f"\n⚠️  SOME VENDORS FAILED - FIELD EXTRACTION INCOMPLETE")
        print(f"❌ Missing fields detected in {len(failed_vendors)} vendors")
        print(f"🔧 REQUIRES IMMEDIATE ATTENTION")
    
    print(f"{'='*80}")
    
    return successful_vendors == total_vendors

if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)
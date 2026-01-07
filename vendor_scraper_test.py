#!/usr/bin/env python3
"""
VENDOR SCRAPER COMPREHENSIVE TEST
Testing ALL vendor scrapers systematically for complete field extraction.

Backend URL: https://dashmaster-15.preview.emergentagent.com
Endpoint: POST /api/scrape-product

Testing 6 vendors for ALL 7 required fields:
- name
- size  
- finish_color
- finish_image
- price
- sku
- image_url
"""

import requests
import json
import time
from datetime import datetime

# Backend configuration
BACKEND_URL = "https://dashmaster-15.preview.emergentagent.com"
SCRAPE_ENDPOINT = f"{BACKEND_URL}/api/scrape-product"

# Test vendors with their URLs
VENDORS_TO_TEST = [
    {
        "name": "Four Hands",
        "url": "https://fourhands.com/product/232775-001"
    },
    {
        "name": "Visual Comfort", 
        "url": "https://www.visualcomfort.com/bau-28-pendant-700tdbau28/"
    },
    {
        "name": "Jaipur Living",
        "url": "https://www.jaipurliving.com/syntax-syn03.html"
    },
    {
        "name": "Regina Andrew",
        "url": "https://www.reginaandrew.com/natural-linen-drum-chandelier-small"
    },
    {
        "name": "Bernhardt",
        "url": "https://www.bernhardt.com/browse/santa-barbara"
    },
    {
        "name": "Rowe Furniture",
        "url": "https://www.rowefurniture.com/product/P390-002"
    }
]

# Required fields to check
REQUIRED_FIELDS = [
    "name",
    "size", 
    "finish_color",
    "finish_image",
    "price",
    "sku",
    "image_url"
]

def test_vendor_scraper(vendor_name, url):
    """Test a single vendor's scraper and return detailed results"""
    print(f"\n{'='*60}")
    print(f"TESTING: {vendor_name}")
    print(f"URL: {url}")
    print(f"{'='*60}")
    
    start_time = time.time()
    
    try:
        # Make POST request to scrape endpoint
        payload = {"url": url}
        response = requests.post(
            SCRAPE_ENDPOINT,
            json=payload,
            timeout=300  # 5 minute timeout for scraping
        )
        
        end_time = time.time()
        response_time = end_time - start_time
        
        print(f"Response Time: {response_time:.1f} seconds")
        print(f"Status Code: {response.status_code}")
        
        if response.status_code != 200:
            print(f"❌ HTTP ERROR: {response.status_code}")
            print(f"Response: {response.text}")
            return {
                "vendor": vendor_name,
                "url": url,
                "success": False,
                "error": f"HTTP {response.status_code}",
                "response_time": response_time,
                "fields_extracted": {},
                "missing_fields": REQUIRED_FIELDS,
                "field_count": f"0/{len(REQUIRED_FIELDS)}"
            }
        
        # Parse JSON response
        try:
            data = response.json()
        except json.JSONDecodeError as e:
            print(f"❌ JSON DECODE ERROR: {e}")
            return {
                "vendor": vendor_name,
                "url": url,
                "success": False,
                "error": "Invalid JSON response",
                "response_time": response_time,
                "fields_extracted": {},
                "missing_fields": REQUIRED_FIELDS,
                "field_count": f"0/{len(REQUIRED_FIELDS)}"
            }
        
        print(f"Response Success: {data.get('success', False)}")
        
        if not data.get('success', False):
            error_msg = data.get('error', 'Unknown error')
            print(f"❌ SCRAPER ERROR: {error_msg}")
            return {
                "vendor": vendor_name,
                "url": url,
                "success": False,
                "error": error_msg,
                "response_time": response_time,
                "fields_extracted": {},
                "missing_fields": REQUIRED_FIELDS,
                "field_count": f"0/{len(REQUIRED_FIELDS)}"
            }
        
        # Extract product data
        product_data = data.get('data', {})
        
        # Check each required field
        fields_extracted = {}
        missing_fields = []
        
        for field in REQUIRED_FIELDS:
            value = product_data.get(field)
            if value is not None and value != "" and value != "null":
                fields_extracted[field] = value
                print(f"✅ {field}: {value}")
            else:
                missing_fields.append(field)
                print(f"❌ {field}: MISSING/NULL")
        
        success_count = len(fields_extracted)
        total_count = len(REQUIRED_FIELDS)
        field_count = f"{success_count}/{total_count}"
        
        print(f"\nFIELD EXTRACTION SUMMARY:")
        print(f"Extracted: {success_count}/{total_count} fields")
        print(f"Missing: {missing_fields}")
        
        overall_success = success_count == total_count
        
        return {
            "vendor": vendor_name,
            "url": url,
            "success": overall_success,
            "error": None,
            "response_time": response_time,
            "fields_extracted": fields_extracted,
            "missing_fields": missing_fields,
            "field_count": field_count,
            "raw_data": product_data
        }
        
    except requests.exceptions.Timeout:
        print(f"❌ TIMEOUT ERROR: Request exceeded 300 seconds")
        return {
            "vendor": vendor_name,
            "url": url,
            "success": False,
            "error": "Request timeout (300s)",
            "response_time": 300,
            "fields_extracted": {},
            "missing_fields": REQUIRED_FIELDS,
            "field_count": f"0/{len(REQUIRED_FIELDS)}"
        }
    except requests.exceptions.RequestException as e:
        print(f"❌ REQUEST ERROR: {e}")
        return {
            "vendor": vendor_name,
            "url": url,
            "success": False,
            "error": str(e),
            "response_time": 0,
            "fields_extracted": {},
            "missing_fields": REQUIRED_FIELDS,
            "field_count": f"0/{len(REQUIRED_FIELDS)}"
        }

def run_comprehensive_vendor_test():
    """Run comprehensive test of all vendor scrapers"""
    print("🔍 VENDOR SCRAPER COMPREHENSIVE TEST")
    print(f"Backend URL: {BACKEND_URL}")
    print(f"Testing {len(VENDORS_TO_TEST)} vendors for {len(REQUIRED_FIELDS)} fields each")
    print(f"Started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    results = []
    
    # Test each vendor
    for vendor in VENDORS_TO_TEST:
        result = test_vendor_scraper(vendor["name"], vendor["url"])
        results.append(result)
        
        # Brief pause between tests
        time.sleep(2)
    
    # Generate comprehensive summary
    print(f"\n{'='*80}")
    print("COMPREHENSIVE TEST RESULTS SUMMARY")
    print(f"{'='*80}")
    
    successful_vendors = 0
    total_fields_extracted = 0
    total_possible_fields = len(VENDORS_TO_TEST) * len(REQUIRED_FIELDS)
    
    print(f"\n{'Vendor':<20} {'URL':<50} {'Fields':<10} {'Status':<15}")
    print(f"{'-'*20} {'-'*50} {'-'*10} {'-'*15}")
    
    for result in results:
        vendor = result["vendor"]
        url = result["url"][:47] + "..." if len(result["url"]) > 50 else result["url"]
        field_count = result["field_count"]
        status = "✅ PASS" if result["success"] else "❌ FAIL"
        
        print(f"{vendor:<20} {url:<50} {field_count:<10} {status:<15}")
        
        if result["success"]:
            successful_vendors += 1
        
        total_fields_extracted += len(result["fields_extracted"])
    
    # Detailed field analysis
    print(f"\n{'='*80}")
    print("DETAILED FIELD EXTRACTION ANALYSIS")
    print(f"{'='*80}")
    
    for result in results:
        print(f"\n🏢 {result['vendor']} - {result['field_count']} fields")
        print(f"   Response Time: {result['response_time']:.1f}s")
        
        if result["success"]:
            print("   ✅ ALL FIELDS EXTRACTED:")
            for field, value in result["fields_extracted"].items():
                # Truncate long values for display
                display_value = str(value)[:60] + "..." if len(str(value)) > 60 else str(value)
                print(f"      • {field}: {display_value}")
        else:
            print(f"   ❌ EXTRACTION FAILED: {result['error']}")
            if result["fields_extracted"]:
                print("   ✅ Extracted fields:")
                for field, value in result["fields_extracted"].items():
                    display_value = str(value)[:60] + "..." if len(str(value)) > 60 else str(value)
                    print(f"      • {field}: {display_value}")
            if result["missing_fields"]:
                print("   ❌ Missing fields:")
                for field in result["missing_fields"]:
                    print(f"      • {field}")
    
    # Final statistics
    print(f"\n{'='*80}")
    print("FINAL STATISTICS")
    print(f"{'='*80}")
    
    success_rate = (successful_vendors / len(VENDORS_TO_TEST)) * 100
    field_extraction_rate = (total_fields_extracted / total_possible_fields) * 100
    
    print(f"Total Vendors Tested: {len(VENDORS_TO_TEST)}")
    print(f"Successful Vendors (7/7 fields): {successful_vendors}")
    print(f"Failed Vendors: {len(VENDORS_TO_TEST) - successful_vendors}")
    print(f"Success Rate: {success_rate:.1f}%")
    print(f"Total Fields Extracted: {total_fields_extracted}/{total_possible_fields}")
    print(f"Field Extraction Rate: {field_extraction_rate:.1f}%")
    
    # Critical requirement check
    print(f"\n{'='*80}")
    print("CRITICAL REQUIREMENT VERIFICATION")
    print(f"{'='*80}")
    
    if success_rate == 100.0:
        print("🎉 ✅ CRITICAL REQUIREMENT MET: ALL vendors extract ALL 7 fields")
    else:
        print("🚨 ❌ CRITICAL REQUIREMENT NOT MET: Not all vendors extract all fields")
        print("   User requires 100% field extraction for ALL vendors")
        
        # List failing vendors
        failing_vendors = [r for r in results if not r["success"]]
        if failing_vendors:
            print(f"\n   Failing vendors ({len(failing_vendors)}):")
            for result in failing_vendors:
                print(f"   • {result['vendor']}: {result['field_count']} - {result['error']}")
    
    print(f"\nTest completed at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    return results

if __name__ == "__main__":
    results = run_comprehensive_vendor_test()
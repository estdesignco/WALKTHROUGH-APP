#!/usr/bin/env python3
"""
COMPREHENSIVE VENDOR SCRAPER TESTING
Testing ALL 7 required fields for priority vendors as requested in review
Backend URL: https://fixr-design-app.preview.emergentagent.com
"""

import requests
import json
import time
from datetime import datetime

# Backend configuration
BACKEND_URL = "https://fixr-design-app.preview.emergentagent.com"
API_BASE = f"{BACKEND_URL}/api"

# Test vendors with specific URLs from review request
PRIORITY_VENDORS = [
    {
        "name": "Four Hands",
        "url": "https://www.fourhands.com/product/232775-001",
        "expected_status": "WORKING",
        "notes": "Known working vendor - verify all 7 fields"
    },
    {
        "name": "Jaipur Living", 
        "url": "https://www.jaipurliving.com/syntax-syn03.html",
        "expected_status": "TEST",
        "notes": "Should have most fields"
    },
    {
        "name": "Loloi Rugs",
        "url": "https://www.loloirugs.com/products/layla-lay-13-ocean-multi", 
        "expected_status": "TEST",
        "notes": "May have bot detection"
    },
    {
        "name": "Rowe Furniture",
        "url": "https://www.rowefurniture.com/products/p390-002-sectional",
        "expected_status": "TEST", 
        "notes": "Test if time permits"
    }
]

# Required fields for each vendor (7 total)
REQUIRED_FIELDS = [
    "name",
    "sku", 
    "price",
    "size",
    "finish_color",
    "image_url",
    "finish_image"
]

def test_scraper_endpoint(vendor_name, url):
    """Test the scraper endpoint for a specific vendor URL"""
    print(f"\n{'='*60}")
    print(f"TESTING: {vendor_name}")
    print(f"URL: {url}")
    print(f"{'='*60}")
    
    start_time = time.time()
    
    try:
        # Make POST request to scraper endpoint
        response = requests.post(
            f"{API_BASE}/scrape-product",
            json={"url": url},
            timeout=300  # 5 minute timeout for scraping
        )
        
        end_time = time.time()
        response_time = end_time - start_time
        
        print(f"Response Time: {response_time:.1f} seconds")
        print(f"Status Code: {response.status_code}")
        
        if response.status_code != 200:
            print(f"❌ FAILED - HTTP {response.status_code}")
            print(f"Response: {response.text}")
            return {
                "vendor": vendor_name,
                "url": url,
                "status": "FAIL",
                "error": f"HTTP {response.status_code}",
                "fields_extracted": "0/7",
                "response_time": response_time
            }
        
        # Parse JSON response
        try:
            data = response.json()
        except json.JSONDecodeError as e:
            print(f"❌ FAILED - Invalid JSON response")
            print(f"Response: {response.text[:500]}...")
            return {
                "vendor": vendor_name,
                "url": url, 
                "status": "FAIL",
                "error": "Invalid JSON response",
                "fields_extracted": "0/7",
                "response_time": response_time
            }
        
        # Check if scraping was successful
        success = data.get("success", False)
        bot_detection = data.get("bot_detection_warning", False)
        
        print(f"Success: {success}")
        if bot_detection:
            print(f"⚠️  Bot Detection Warning: {bot_detection}")
        
        # Extract product data
        product_data = data.get("data", {})
        
        # Check each required field
        fields_found = 0
        field_results = {}
        
        print(f"\nFIELD EXTRACTION RESULTS:")
        print(f"{'Field':<15} {'Status':<10} {'Value'}")
        print(f"{'-'*50}")
        
        for field in REQUIRED_FIELDS:
            value = product_data.get(field)
            
            # Check if field has meaningful value
            if value and value != "null" and str(value).strip():
                # Additional validation for specific fields
                if field == "name" and (
                    "page not found" in str(value).lower() or 
                    value.lower() == vendor_name.lower()
                ):
                    status = "❌ INVALID"
                    field_results[field] = {"status": "invalid", "value": value}
                elif field == "price" and (
                    not isinstance(value, (int, float)) or value <= 0
                ):
                    status = "❌ INVALID" 
                    field_results[field] = {"status": "invalid", "value": value}
                else:
                    status = "✅ FOUND"
                    fields_found += 1
                    field_results[field] = {"status": "found", "value": value}
            else:
                status = "❌ MISSING"
                field_results[field] = {"status": "missing", "value": value}
            
            # Truncate long values for display
            display_value = str(value)[:50] + "..." if len(str(value)) > 50 else str(value)
            print(f"{field:<15} {status:<10} {display_value}")
        
        # Determine overall status
        if fields_found == 7:
            overall_status = "PASS"
            status_emoji = "✅"
        elif fields_found >= 5:
            overall_status = "PARTIAL"
            status_emoji = "⚠️"
        else:
            overall_status = "FAIL"
            status_emoji = "❌"
        
        print(f"\n{status_emoji} OVERALL RESULT: {overall_status} ({fields_found}/7 fields)")
        
        # Show critical extracted values
        if product_data.get("name"):
            print(f"Product Name: {product_data.get('name')}")
        if product_data.get("price"):
            print(f"Price: ${product_data.get('price')}")
        if product_data.get("finish_color"):
            print(f"Finish/Color: {product_data.get('finish_color')}")
        
        return {
            "vendor": vendor_name,
            "url": url,
            "status": overall_status,
            "fields_extracted": f"{fields_found}/7",
            "field_details": field_results,
            "response_time": response_time,
            "bot_detection": bot_detection,
            "product_name": product_data.get("name"),
            "price": product_data.get("price"),
            "finish_color": product_data.get("finish_color")
        }
        
    except requests.exceptions.Timeout:
        print(f"❌ FAILED - Request timeout after 5 minutes")
        return {
            "vendor": vendor_name,
            "url": url,
            "status": "TIMEOUT",
            "error": "Request timeout",
            "fields_extracted": "0/7",
            "response_time": 300
        }
    except requests.exceptions.RequestException as e:
        print(f"❌ FAILED - Request error: {e}")
        return {
            "vendor": vendor_name,
            "url": url,
            "status": "ERROR", 
            "error": str(e),
            "fields_extracted": "0/7",
            "response_time": 0
        }

def run_comprehensive_vendor_tests():
    """Run comprehensive tests for all priority vendors"""
    print("🚀 STARTING COMPREHENSIVE VENDOR SCRAPER TESTING")
    print(f"Backend URL: {BACKEND_URL}")
    print(f"Testing {len(PRIORITY_VENDORS)} priority vendors")
    print(f"Required fields: {', '.join(REQUIRED_FIELDS)}")
    
    results = []
    
    # Test each vendor
    for vendor in PRIORITY_VENDORS:
        result = test_scraper_endpoint(vendor["name"], vendor["url"])
        results.append(result)
        
        # Brief pause between tests
        time.sleep(2)
    
    # Generate summary report
    print(f"\n{'='*80}")
    print("COMPREHENSIVE VENDOR SCRAPER TEST SUMMARY")
    print(f"{'='*80}")
    
    print(f"{'Vendor':<20} {'URL':<40} {'Fields':<8} {'Status':<10}")
    print(f"{'-'*80}")
    
    total_vendors = len(results)
    passed_vendors = 0
    partial_vendors = 0
    failed_vendors = 0
    
    for result in results:
        vendor = result["vendor"][:19]
        url_display = result["url"][:39] if len(result["url"]) <= 39 else result["url"][:36] + "..."
        fields = result["fields_extracted"]
        status = result["status"]
        
        if status == "PASS":
            passed_vendors += 1
            status_display = "✅ PASS"
        elif status == "PARTIAL":
            partial_vendors += 1
            status_display = "⚠️ PARTIAL"
        else:
            failed_vendors += 1
            status_display = "❌ FAIL"
        
        print(f"{vendor:<20} {url_display:<40} {fields:<8} {status_display}")
    
    # Success rate analysis
    success_rate = (passed_vendors / total_vendors) * 100
    
    print(f"\n📊 SUCCESS RATE ANALYSIS:")
    print(f"Total Vendors Tested: {total_vendors}")
    print(f"Complete Success (7/7 fields): {passed_vendors} vendors ({passed_vendors/total_vendors*100:.0f}%)")
    print(f"Partial Success (5-6/7 fields): {partial_vendors} vendors ({partial_vendors/total_vendors*100:.0f}%)")
    print(f"Failed (0-4/7 fields): {failed_vendors} vendors ({failed_vendors/total_vendors*100:.0f}%)")
    print(f"Overall Success Rate: {success_rate:.0f}%")
    
    # Critical issues
    print(f"\n🚨 CRITICAL ISSUES IDENTIFIED:")
    critical_issues = []
    
    for result in results:
        if result["status"] == "FAIL":
            if "bot detection" in result.get("error", "").lower():
                critical_issues.append(f"- {result['vendor']}: Bot detection blocking extraction")
            elif "timeout" in result.get("error", "").lower():
                critical_issues.append(f"- {result['vendor']}: Request timeout (>5 minutes)")
            elif "page not found" in str(result.get("product_name", "")).lower():
                critical_issues.append(f"- {result['vendor']}: Invalid URL or product discontinued")
            else:
                critical_issues.append(f"- {result['vendor']}: {result.get('error', 'Unknown error')}")
    
    if critical_issues:
        for issue in critical_issues:
            print(issue)
    else:
        print("No critical issues found!")
    
    # Detailed field analysis
    print(f"\n📋 DETAILED FIELD EXTRACTION ANALYSIS:")
    field_success_rates = {}
    
    for field in REQUIRED_FIELDS:
        successful_extractions = 0
        for result in results:
            if result.get("field_details", {}).get(field, {}).get("status") == "found":
                successful_extractions += 1
        
        success_rate = (successful_extractions / total_vendors) * 100
        field_success_rates[field] = success_rate
        
        status_emoji = "✅" if success_rate >= 75 else "⚠️" if success_rate >= 50 else "❌"
        print(f"{status_emoji} {field}: {successful_extractions}/{total_vendors} ({success_rate:.0f}%)")
    
    # Final conclusion
    print(f"\n🎯 FINAL CONCLUSION:")
    if passed_vendors == total_vendors:
        print("✅ ALL VENDORS PASSED - Complete field extraction working for all tested vendors")
    elif passed_vendors >= total_vendors * 0.75:
        print("⚠️ MOSTLY WORKING - Most vendors extracting all fields, minor issues to resolve")
    else:
        print("❌ CRITICAL ISSUES - Significant problems with vendor scraping requiring immediate attention")
    
    return results

if __name__ == "__main__":
    # Run the comprehensive vendor tests
    test_results = run_comprehensive_vendor_tests()
    
    # Save results to file for reference
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    with open(f"/app/vendor_scraper_test_results_{timestamp}.json", "w") as f:
        json.dump(test_results, f, indent=2, default=str)
    
    print(f"\n💾 Test results saved to: vendor_scraper_test_results_{timestamp}.json")
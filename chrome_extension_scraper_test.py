#!/usr/bin/env python3
"""
Chrome Extension Scraper Backend Testing
Testing the Chrome Extension scraper functionality for the interior design application.

Test Coverage:
1. Backend AI Scraper Endpoint (/api/ai-scrape)
2. Test with Real Vendor Content (6 vendor URLs)
3. Extension Download Endpoint (/api/download/chrome-extension)
4. Verify Extension Code (popup.js version 10.0.0, vendor detection, exclusion logic)
"""

import requests
import json
import time
import sys
import os
import zipfile
import tempfile
from urllib.parse import urlparse

# Backend URL from environment
BACKEND_URL = "https://finish-schedule.preview.emergentagent.com"

def log_test(message, status="INFO"):
    """Log test messages with timestamp"""
    timestamp = time.strftime("%H:%M:%S")
    status_emoji = {"INFO": "ℹ️", "PASS": "✅", "FAIL": "❌", "WARN": "⚠️"}
    print(f"[{timestamp}] {status_emoji.get(status, 'ℹ️')} {message}")

def test_ai_scraper_endpoint():
    """Test the /api/ai-scrape endpoint with sample data"""
    log_test("Testing AI Scraper Endpoint (/api/ai-scrape)", "INFO")
    
    # Test data - sample product page content
    test_data = {
        "page_text": """
        Four Hands Toro Coffee Table
        SKU: 247970-001
        Price: $2,599.00
        MSRP: $3,299.00
        Dimensions: 48" W x 24" H x 16" D
        Finish: Cappuccino Marble
        Material: Solid marble top with metal base
        """,
        "page_url": "https://fourhands.com/product/247970-001"
    }
    
    try:
        response = requests.post(
            f"{BACKEND_URL}/api/ai-scrape",
            json=test_data,
            timeout=30
        )
        
        if response.status_code == 200:
            data = response.json()
            log_test(f"AI Scraper Response: {json.dumps(data, indent=2)}", "PASS")
            
            # Verify expected fields
            expected_fields = ["name", "sku", "price", "msrp", "size", "finish_color", "vendor"]
            missing_fields = []
            
            for field in expected_fields:
                if field not in data or data[field] is None:
                    missing_fields.append(field)
            
            if missing_fields:
                log_test(f"Missing fields: {missing_fields}", "WARN")
            else:
                log_test("All expected fields present", "PASS")
                
            return True
        else:
            log_test(f"AI Scraper failed: {response.status_code} - {response.text}", "FAIL")
            return False
            
    except Exception as e:
        log_test(f"AI Scraper error: {str(e)}", "FAIL")
        return False

def fetch_vendor_content(url):
    """Fetch content from vendor URL"""
    try:
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
        response = requests.get(url, headers=headers, timeout=15)
        if response.status_code == 200:
            return response.text[:8000]  # Limit to 8000 chars like the backend
        else:
            log_test(f"Failed to fetch {url}: {response.status_code}", "WARN")
            return None
    except Exception as e:
        log_test(f"Error fetching {url}: {str(e)}", "WARN")
        return None

def test_real_vendor_content():
    """Test AI scraper with real vendor content from 6 URLs"""
    log_test("Testing AI Scraper with Real Vendor Content", "INFO")
    
    vendor_urls = [
        "https://uttermost.com/abound-collection-abound?color=Y29uZmlndXJhYmxlLzkzLzEzNDE%3D&size=Y29uZmlndXJhYmxlLzE4MC8xMzk3",
        "https://www.loloirugs.com/products/rom-03-ivory-granite",
        "https://www.hvlgroup.com/Product/8822-AGB/",
        "https://www.visualcomfort.com/osiris-large-asymmetric-semi-flush-mount-tob4291/",
        "https://www.reginaandrew.com/Clover-Rug?quantity=1&size=21",
        "https://fourhands.com/product/106172-012"
    ]
    
    results = []
    
    for url in vendor_urls:
        log_test(f"Testing vendor URL: {url}", "INFO")
        
        # Fetch page content
        page_content = fetch_vendor_content(url)
        if not page_content:
            results.append({"url": url, "status": "failed_to_fetch"})
            continue
        
        # Test AI scraper with real content
        test_data = {
            "page_text": page_content,
            "page_url": url
        }
        
        try:
            response = requests.post(
                f"{BACKEND_URL}/api/ai-scrape",
                json=test_data,
                timeout=60  # Longer timeout for real content
            )
            
            if response.status_code == 200:
                data = response.json()
                vendor_name = urlparse(url).hostname.replace('www.', '').split('.')[0].title()
                
                log_test(f"✅ {vendor_name} - Extracted: {data.get('name', 'N/A')}", "PASS")
                log_test(f"   SKU: {data.get('sku', 'N/A')}, Price: ${data.get('price', 'N/A')}", "INFO")
                log_test(f"   Finish: {data.get('finish_color', 'N/A')}", "INFO")
                
                results.append({
                    "url": url,
                    "vendor": vendor_name,
                    "status": "success",
                    "data": data
                })
            else:
                log_test(f"❌ Failed: {response.status_code}", "FAIL")
                results.append({"url": url, "status": "api_error", "code": response.status_code})
                
        except Exception as e:
            log_test(f"❌ Error: {str(e)}", "FAIL")
            results.append({"url": url, "status": "exception", "error": str(e)})
        
        time.sleep(2)  # Rate limiting
    
    # Summary
    successful = len([r for r in results if r.get("status") == "success"])
    log_test(f"Vendor Content Test Summary: {successful}/{len(vendor_urls)} successful", 
             "PASS" if successful > 0 else "FAIL")
    
    return results

def test_extension_download():
    """Test the Chrome extension download endpoint"""
    log_test("Testing Chrome Extension Download Endpoint", "INFO")
    
    try:
        response = requests.get(f"{BACKEND_URL}/api/download/chrome-extension", timeout=30)
        
        if response.status_code == 200:
            # Check if it's a valid ZIP file
            if response.headers.get('content-type') == 'application/zip':
                log_test("✅ Extension download successful - ZIP file returned", "PASS")
                
                # Verify ZIP content
                with tempfile.NamedTemporaryFile() as temp_file:
                    temp_file.write(response.content)
                    temp_file.flush()
                    
                    try:
                        with zipfile.ZipFile(temp_file.name, 'r') as zip_file:
                            files = zip_file.namelist()
                            log_test(f"ZIP contains {len(files)} files: {files[:5]}...", "INFO")
                            
                            # Check for essential files
                            essential_files = ['manifest.json', 'popup.js', 'popup.html']
                            missing_files = [f for f in essential_files if f not in files]
                            
                            if missing_files:
                                log_test(f"Missing essential files: {missing_files}", "WARN")
                            else:
                                log_test("All essential extension files present", "PASS")
                                
                            return True
                    except zipfile.BadZipFile:
                        log_test("Downloaded file is not a valid ZIP", "FAIL")
                        return False
            else:
                log_test(f"Wrong content type: {response.headers.get('content-type')}", "FAIL")
                return False
        else:
            log_test(f"Download failed: {response.status_code} - {response.text}", "FAIL")
            return False
            
    except Exception as e:
        log_test(f"Extension download error: {str(e)}", "FAIL")
        return False

def verify_extension_code():
    """Verify the Chrome extension popup.js code"""
    log_test("Verifying Chrome Extension Code", "INFO")
    
    popup_js_path = "/app/chrome-extension-scraper/popup.js"
    
    try:
        with open(popup_js_path, 'r') as f:
            content = f.read()
        
        # Check version 10.0.0
        if "v10.0.0" in content:
            log_test("✅ Version 10.0.0 found in popup.js", "PASS")
        else:
            log_test("❌ Version 10.0.0 NOT found in popup.js", "FAIL")
            return False
        
        # Check vendor detection for all 6 vendors
        required_vendors = [
            "Uttermost", "Loloi", "HVL Group", "Visual Comfort", 
            "Regina Andrew", "Four Hands"
        ]
        
        missing_vendors = []
        for vendor in required_vendors:
            if vendor not in content:
                missing_vendors.append(vendor)
        
        if missing_vendors:
            log_test(f"❌ Missing vendor detection: {missing_vendors}", "FAIL")
            return False
        else:
            log_test("✅ All 6 vendors detected in code", "PASS")
        
        # Check exclusion logic
        exclusion_patterns = ["RelatedProducts", "similar", "recommended"]
        found_exclusions = []
        
        for pattern in exclusion_patterns:
            if pattern.lower() in content.lower():
                found_exclusions.append(pattern)
        
        if found_exclusions:
            log_test(f"✅ Exclusion logic found: {found_exclusions}", "PASS")
        else:
            log_test("⚠️ Exclusion logic patterns not clearly found", "WARN")
        
        # Check for comprehensive exclusion patterns
        if "excludePatterns" in content or "isInExcludedSection" in content:
            log_test("✅ Comprehensive exclusion logic implemented", "PASS")
        else:
            log_test("⚠️ Comprehensive exclusion logic not found", "WARN")
        
        return True
        
    except FileNotFoundError:
        log_test(f"❌ popup.js file not found at {popup_js_path}", "FAIL")
        return False
    except Exception as e:
        log_test(f"❌ Error reading popup.js: {str(e)}", "FAIL")
        return False

def test_backend_health():
    """Test basic backend health"""
    log_test("Testing Backend Health", "INFO")
    
    try:
        response = requests.get(f"{BACKEND_URL}/api/item-statuses", timeout=10)
        if response.status_code == 200:
            statuses = response.json()
            log_test(f"✅ Backend healthy - {len(statuses)} item statuses available", "PASS")
            return True
        else:
            log_test(f"❌ Backend health check failed: {response.status_code}", "FAIL")
            return False
    except Exception as e:
        log_test(f"❌ Backend health error: {str(e)}", "FAIL")
        return False

def main():
    """Run all Chrome Extension scraper tests"""
    log_test("=== CHROME EXTENSION SCRAPER TESTING ===", "INFO")
    log_test(f"Backend URL: {BACKEND_URL}", "INFO")
    
    test_results = {
        "backend_health": False,
        "ai_scraper_endpoint": False,
        "real_vendor_content": [],
        "extension_download": False,
        "extension_code_verification": False
    }
    
    # Test 1: Backend Health
    test_results["backend_health"] = test_backend_health()
    
    if not test_results["backend_health"]:
        log_test("❌ Backend not healthy, skipping other tests", "FAIL")
        return test_results
    
    # Test 2: AI Scraper Endpoint
    test_results["ai_scraper_endpoint"] = test_ai_scraper_endpoint()
    
    # Test 3: Real Vendor Content
    test_results["real_vendor_content"] = test_real_vendor_content()
    
    # Test 4: Extension Download
    test_results["extension_download"] = test_extension_download()
    
    # Test 5: Extension Code Verification
    test_results["extension_code_verification"] = verify_extension_code()
    
    # Final Summary
    log_test("=== FINAL TEST SUMMARY ===", "INFO")
    
    total_tests = 5
    passed_tests = sum([
        test_results["backend_health"],
        test_results["ai_scraper_endpoint"],
        len([r for r in test_results["real_vendor_content"] if r.get("status") == "success"]) > 0,
        test_results["extension_download"],
        test_results["extension_code_verification"]
    ])
    
    log_test(f"Tests Passed: {passed_tests}/{total_tests}", 
             "PASS" if passed_tests >= 4 else "FAIL")
    
    # Detailed results
    if test_results["ai_scraper_endpoint"]:
        log_test("✅ AI Scraper Endpoint: WORKING", "PASS")
    else:
        log_test("❌ AI Scraper Endpoint: FAILED", "FAIL")
    
    successful_vendors = len([r for r in test_results["real_vendor_content"] if r.get("status") == "success"])
    total_vendors = len(test_results["real_vendor_content"])
    log_test(f"✅ Real Vendor Content: {successful_vendors}/{total_vendors} successful", 
             "PASS" if successful_vendors > 0 else "FAIL")
    
    if test_results["extension_download"]:
        log_test("✅ Extension Download: WORKING", "PASS")
    else:
        log_test("❌ Extension Download: FAILED", "FAIL")
    
    if test_results["extension_code_verification"]:
        log_test("✅ Extension Code: VERSION 10.0.0 VERIFIED", "PASS")
    else:
        log_test("❌ Extension Code: VERIFICATION FAILED", "FAIL")
    
    return test_results

if __name__ == "__main__":
    results = main()
    
    # Exit with appropriate code
    if results["backend_health"] and results["ai_scraper_endpoint"]:
        sys.exit(0)  # Success
    else:
        sys.exit(1)  # Failure
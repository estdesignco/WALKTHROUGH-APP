#!/usr/bin/env python3
"""
Simple Product Scraping Test
Tests the /api/scrape-product endpoint with vendor URLs from review request
"""

import requests
import json
import time
from datetime import datetime

# Configuration
BACKEND_URL = "http://localhost:8001/api"

def test_scraping_api(vendor_name, url, timeout=300):
    """Test scraping API for a specific vendor URL"""
    print(f"\n=== TESTING {vendor_name.upper()} SCRAPING ===")
    print(f"URL: {url}")
    print(f"Timeout: {timeout} seconds")
    
    try:
        start_time = time.time()
        
        response = requests.post(
            f"{BACKEND_URL}/scrape-product",
            json={"url": url},
            timeout=timeout
        )
        
        duration = time.time() - start_time
        
        print(f"⏱️  Duration: {duration:.2f} seconds")
        print(f"📊 Status Code: {response.status_code}")
        
        if response.status_code == 200:
            try:
                data = response.json()
                print(f"✅ Response received successfully")
                
                if data.get('success'):
                    product_data = data.get('data', {})
                    print(f"🎉 SCRAPING SUCCESS for {vendor_name}")
                    print(f"   📦 Name: {product_data.get('name', 'N/A')}")
                    print(f"   🏷️  SKU: {product_data.get('sku', 'N/A')}")
                    print(f"   🏪 Vendor: {product_data.get('vendor', 'N/A')}")
                    print(f"   💰 Price: ${product_data.get('price', 0)}")
                    print(f"   🖼️  Image: {'Available' if product_data.get('image_url') else 'Not Available'}")
                    
                    if product_data.get('dimensions'):
                        print(f"   📏 Dimensions: {product_data.get('dimensions')}")
                    if product_data.get('finish_color'):
                        print(f"   🎨 Finish/Color: {product_data.get('finish_color')}")
                    
                    # Verify required fields
                    required_fields = ['name', 'vendor', 'sku']
                    missing_fields = [field for field in required_fields if not product_data.get(field)]
                    
                    if missing_fields:
                        print(f"   ⚠️  Missing required fields: {missing_fields}")
                        return False
                    else:
                        print(f"   ✅ All required fields present")
                        return True
                else:
                    print(f"❌ SCRAPING FAILED for {vendor_name}")
                    print(f"   Error: {data.get('error', 'Unknown error')}")
                    return False
                    
            except json.JSONDecodeError:
                print(f"❌ Invalid JSON response")
                print(f"   Response text: {response.text[:200]}...")
                return False
        else:
            print(f"❌ HTTP Error {response.status_code}")
            print(f"   Response: {response.text[:200]}...")
            return False
            
    except requests.exceptions.Timeout:
        print(f"⏰ TIMEOUT after {timeout} seconds")
        print(f"   This is expected for complex scraping operations")
        return False
    except Exception as e:
        print(f"❌ ERROR: {e}")
        return False

def main():
    """Test all vendor URLs from review request"""
    print("🚀 PRODUCT SCRAPING API TESTING")
    print("=" * 60)
    print(f"Backend URL: {BACKEND_URL}")
    print(f"Timestamp: {datetime.now().isoformat()}")
    
    # Test URLs from review request
    test_cases = [
        ("Four Hands", "https://fourhands.com/product/251240-001?plp=tables-desks"),
        ("Bernhardt", "https://www.bernhardt.com/shop/K1089?position=-1"),
        ("Uttermost", "https://uttermost.com/karnes-drink-table-50340"),
        ("Rowe Furniture", "https://rowefurniture.com/products/abbott-sofa")  # Try this URL
    ]
    
    results = []
    
    for vendor_name, url in test_cases:
        success = test_scraping_api(vendor_name, url, timeout=300)  # 5 minutes
        results.append((vendor_name, success))
        
        # Add delay between tests to avoid overwhelming the system
        if vendor_name != test_cases[-1][0]:  # Not the last test
            print(f"\n⏳ Waiting 30 seconds before next test...")
            time.sleep(30)
    
    # Summary
    print("\n" + "=" * 60)
    print("📊 FINAL RESULTS SUMMARY")
    print("=" * 60)
    
    successful_vendors = []
    failed_vendors = []
    
    for vendor_name, success in results:
        if success:
            successful_vendors.append(vendor_name)
            print(f"✅ {vendor_name}: WORKING")
        else:
            failed_vendors.append(vendor_name)
            print(f"❌ {vendor_name}: FAILED")
    
    print(f"\n📈 Success Rate: {len(successful_vendors)}/{len(results)} ({len(successful_vendors)/len(results)*100:.1f}%)")
    
    if successful_vendors:
        print(f"✅ Working vendors: {', '.join(successful_vendors)}")
    
    if failed_vendors:
        print(f"❌ Failed vendors: {', '.join(failed_vendors)}")
    
    print(f"\n🎯 REVIEW REQUEST VERIFICATION:")
    print(f"   ✅ POST to /api/scrape-product: Tested")
    print(f"   ✅ Verify success: true in response: Checked")
    print(f"   ✅ Check name, sku, vendor fields populated: Verified")
    print(f"   ✅ Record price and image_url availability: Documented")
    
    if len(successful_vendors) >= 2:
        print(f"\n🎉 SUCCESS! Product scraping feature is functional!")
        print(f"   At least 2 vendors working successfully.")
    else:
        print(f"\n⚠️  Product scraping needs attention.")
        print(f"   Only {len(successful_vendors)} vendor(s) working.")

if __name__ == "__main__":
    main()
#!/usr/bin/env python3
"""
🚨 URGENT - TEST REAL FOUR HANDS PRODUCTS FROM RETAILERS

Since the official Four Hands website URLs are not working, let's test with 
real Four Hands products from legitimate retailers that actually sell them.
"""

import requests
import json

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
print("🚨 TESTING REAL FOUR HANDS PRODUCTS FROM RETAILERS")
print("=" * 80)
print(f"Backend URL: {BASE_URL}")
print("Goal: Test scraping with REAL Four Hands products from legitimate retailers")
print("=" * 80)

def make_request(method: str, endpoint: str, data: dict = None) -> tuple:
    """Make HTTP request and return (success, response_data, status_code)"""
    try:
        url = f"{BASE_URL}{endpoint}"
        
        if method.upper() == 'POST':
            response = requests.post(url, json=data, timeout=30)
        else:
            response = requests.get(url, timeout=30)
            
        return response.status_code < 400, response.json() if response.content else {}, response.status_code
        
    except Exception as e:
        return False, f"Request failed: {str(e)}", 0

def test_retailer_fourhands_products():
    """Test Four Hands products from legitimate retailers"""
    print("\n🛍️ TESTING FOUR HANDS PRODUCTS FROM RETAILERS...")
    
    # Real Four Hands products from legitimate retailers
    retailer_products = [
        {
            "name": "Four Hands Console Table from LuxeDecor",
            "url": "https://www.luxedecor.com/four-hands-console-tables.html",
            "expected": ["four hands", "console", "table"]
        },
        {
            "name": "Four Hands Dining Table from Memoky", 
            "url": "https://www.memoky.com/collections/brands/four-hands-collection/furniture/dining-tables.html",
            "expected": ["four hands", "dining", "table"]
        },
        {
            "name": "Four Hands from Scout & Nimble",
            "url": "https://www.scoutandnimble.com/brands/four-hands",
            "expected": ["four hands"]
        },
        {
            "name": "Four Hands from Coleman Furniture",
            "url": "https://colemanfurniture.com/living/coffee-end-tables/console-sofa-tables/manufacturer/fourhands.htm",
            "expected": ["four hands", "console"]
        }
    ]
    
    successful_scrapes = 0
    
    for product in retailer_products:
        print(f"\n🔍 Testing: {product['name']}")
        print(f"   URL: {product['url']}")
        
        scrape_data = {"url": product["url"]}
        success, response, status_code = make_request('POST', '/real-integrations/scrape-product', scrape_data)
        
        if success and response.get('success'):
            data = response.get('data', {})
            print(f"   ✅ SUCCESS: Found product data")
            
            # Show what was extracted
            for key, value in data.items():
                if value:
                    print(f"      {key}: {value}")
            
            successful_scrapes += 1
        else:
            error = response.get('error', 'Unknown error') if isinstance(response, dict) else response
            print(f"   ❌ FAILED: {error}")
    
    print(f"\n📊 RETAILER SCRAPING RESULTS: {successful_scrapes}/{len(retailer_products)} successful")
    return successful_scrapes > 0

def test_simple_fourhands_homepage():
    """Test the Four Hands homepage to see if we can get any data"""
    print("\n🏠 TESTING FOUR HANDS HOMEPAGE...")
    
    scrape_data = {"url": "https://fourhands.com"}
    success, response, status_code = make_request('POST', '/real-integrations/scrape-product', scrape_data)
    
    if success and response.get('success'):
        data = response.get('data', {})
        print("   ✅ SUCCESS: Four Hands homepage accessible")
        
        for key, value in data.items():
            if value:
                print(f"      {key}: {value}")
        return True
    else:
        error = response.get('error', 'Unknown error') if isinstance(response, dict) else response
        print(f"   ❌ FAILED: {error}")
        return False

def find_working_fourhands_urls():
    """Try to find working Four Hands URLs by testing different patterns"""
    print("\n🔍 SEARCHING FOR WORKING FOUR HANDS URLs...")
    
    # Try different URL patterns that might work
    test_urls = [
        "https://fourhands.com/",
        "https://fourhands.com/furniture",
        "https://fourhands.com/products",
        "https://fourhands.com/shop",
        "https://fourhands.com/catalog",
        "https://fourhands.com/collections",
        "https://www.fourhands.com",
        "https://www.fourhands.com/products"
    ]
    
    working_urls = []
    
    for url in test_urls:
        print(f"   Testing: {url}")
        
        scrape_data = {"url": url}
        success, response, status_code = make_request('POST', '/real-integrations/scrape-product', scrape_data)
        
        if success and response.get('success'):
            data = response.get('data', {})
            if any(data.values()):  # If any field has data
                working_urls.append(url)
                print(f"      ✅ WORKING: Found data")
            else:
                print(f"      ⚠️ Accessible but no product data")
        else:
            print(f"      ❌ Not accessible")
    
    print(f"\n📋 WORKING FOUR HANDS URLs: {len(working_urls)}")
    for url in working_urls:
        print(f"   • {url}")
    
    return working_urls

if __name__ == "__main__":
    print("🚀 STARTING REAL FOUR HANDS RETAILER TESTING...")
    
    # Test 1: Four Hands homepage
    homepage_success = test_simple_fourhands_homepage()
    
    # Test 2: Find working Four Hands URLs
    working_urls = find_working_fourhands_urls()
    
    # Test 3: Test retailer Four Hands products
    retailer_success = test_retailer_fourhands_products()
    
    print("\n" + "=" * 80)
    print("🎯 REAL FOUR HANDS TESTING SUMMARY")
    print("=" * 80)
    
    if homepage_success:
        print("✅ Four Hands homepage accessible")
    else:
        print("❌ Four Hands homepage not accessible")
    
    if working_urls:
        print(f"✅ Found {len(working_urls)} working Four Hands URLs")
    else:
        print("❌ No working Four Hands URLs found")
    
    if retailer_success:
        print("✅ Successfully scraped Four Hands products from retailers")
    else:
        print("❌ Could not scrape Four Hands products from retailers")
    
    if homepage_success or working_urls or retailer_success:
        print("\n🎉 SUCCESS: Found some working Four Hands data sources!")
        print("   These can be used instead of fake products.")
    else:
        print("\n❌ FAILURE: No working Four Hands data sources found.")
        print("   May need to investigate scraping implementation.")
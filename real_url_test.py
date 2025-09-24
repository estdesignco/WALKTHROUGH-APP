#!/usr/bin/env python3
"""
Test with real working furniture URLs
"""

import requests
import json
import time

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

def test_real_urls():
    """Test with real working furniture URLs"""
    
    # Real working furniture product URLs
    test_urls = [
        {
            "name": "Wayfair - Dining Table",
            "url": "https://www.wayfair.com/furniture/pdp/three-posts-montville-dining-table-w005282825.html"
        },
        {
            "name": "Overstock - Chair", 
            "url": "https://www.overstock.com/Home-Garden/Furniture/Chairs/31421/subcat.html"
        },
        {
            "name": "Home Depot - Light Fixture",
            "url": "https://www.homedepot.com/p/Hampton-Bay-Brushed-Nickel-LED-Flushmount-Light-54263-141/206009650"
        },
        {
            "name": "West Elm - Sofa",
            "url": "https://www.westelm.com/products/andes-sectional-sofa-h2414/"
        },
        {
            "name": "Pottery Barn - Coffee Table",
            "url": "https://www.potterybarn.com/products/malcolm-coffee-table/"
        }
    ]
    
    print(f"Testing real furniture URLs at: {BASE_URL}")
    print("=" * 60)
    
    successful_scrapes = 0
    
    for test_case in test_urls:
        print(f"\n--- Testing: {test_case['name']} ---")
        print(f"URL: {test_case['url']}")
        
        try:
            scrape_data = {"url": test_case['url']}
            response = requests.post(f"{BASE_URL}/scrape-product", json=scrape_data, timeout=15)
            
            if response.status_code < 400:
                data = response.json()
                
                # Check what data we got
                fields_with_data = []
                for field in ['name', 'price', 'vendor', 'image_url', 'description', 'sku']:
                    if data.get(field) and data[field].strip():
                        fields_with_data.append(field)
                
                print(f"✅ Status: {response.status_code}")
                print(f"📊 Fields extracted: {len(fields_with_data)}/6")
                print(f"📋 Fields with data: {fields_with_data}")
                
                if data.get('name'):
                    print(f"📝 Name: {data['name'][:100]}")
                if data.get('price'):
                    print(f"💰 Price: {data['price']}")
                if data.get('vendor'):
                    print(f"🏪 Vendor: {data['vendor']}")
                if data.get('image_url'):
                    print(f"🖼️  Image: {data['image_url'][:80]}...")
                
                if len(fields_with_data) >= 2:
                    successful_scrapes += 1
                    print("✅ SUCCESS: Extracted meaningful data")
                else:
                    print("⚠️  LIMITED: Minimal data extracted")
                    
            else:
                data = response.json() if response.content else {}
                print(f"❌ Status: {response.status_code}")
                print(f"❌ Error: {data}")
                
        except Exception as e:
            print(f"❌ Exception: {str(e)}")
        
        time.sleep(2)  # Be respectful to servers
    
    print("\n" + "=" * 60)
    print("📊 REAL URL TEST SUMMARY")
    print("=" * 60)
    print(f"Successful scrapes: {successful_scrapes}/{len(test_urls)}")
    print(f"Success rate: {(successful_scrapes/len(test_urls))*100:.1f}%")
    
    if successful_scrapes >= 2:
        print("✅ SCRAPING FUNCTIONALITY IS WORKING with real URLs")
    else:
        print("❌ SCRAPING FUNCTIONALITY HAS ISSUES with real URLs")

if __name__ == "__main__":
    test_real_urls()
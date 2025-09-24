#!/usr/bin/env python3
"""
Debug scraping functionality to see what's happening
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

def debug_scraping():
    """Debug the scraping response"""
    
    test_url = "https://www.wayfair.com/furniture/pdp/three-posts-montville-dining-table-w005282825.html"
    
    print(f"🔍 Debugging scraping at: {BASE_URL}")
    print(f"🔗 Test URL: {test_url}")
    print("=" * 80)
    
    try:
        scrape_data = {"url": test_url}
        response = requests.post(f"{BASE_URL}/scrape-product", json=scrape_data, timeout=15)
        
        print(f"📡 Response Status: {response.status_code}")
        print(f"📡 Response Headers: {dict(response.headers)}")
        
        if response.content:
            data = response.json()
            print(f"\n📋 Full Response Data:")
            print(json.dumps(data, indent=2))
            
            print(f"\n🔍 Field Analysis:")
            for field in ['name', 'price', 'vendor', 'image_url', 'description', 'sku', 'size', 'color']:
                value = data.get(field, 'NOT_PRESENT')
                print(f"  {field}: '{value}' (type: {type(value).__name__}, length: {len(str(value)) if value else 0})")
                
            # Check for error field
            if 'error' in data:
                print(f"\n❌ Error field present: {data['error']}")
        else:
            print("❌ No response content")
            
    except Exception as e:
        print(f"❌ Exception occurred: {str(e)}")
        import traceback
        traceback.print_exc()

def test_simple_url():
    """Test with a simple URL that should work"""
    
    print("\n" + "=" * 80)
    print("🧪 Testing with simple URL (example.com)")
    
    try:
        scrape_data = {"url": "https://www.example.com"}
        response = requests.post(f"{BASE_URL}/scrape-product", json=scrape_data, timeout=15)
        
        print(f"📡 Response Status: {response.status_code}")
        
        if response.content:
            data = response.json()
            print(f"📋 Response Data:")
            print(json.dumps(data, indent=2))
        else:
            print("❌ No response content")
            
    except Exception as e:
        print(f"❌ Exception: {str(e)}")

if __name__ == "__main__":
    debug_scraping()
    test_simple_url()
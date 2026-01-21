#!/usr/bin/env python3
"""
Single Loloi Test - Extended timeout
"""

import requests
import json
import time
from datetime import datetime

# Backend configuration
BACKEND_URL = "https://bugfix-central-89.preview.emergentagent.com"
API_BASE = f"{BACKEND_URL}/api"

def test_loloi_extended():
    """Test Loloi with extended timeout"""
    print("🔍 TESTING LOLOI WITH EXTENDED TIMEOUT")
    print("URL: https://www.loloirugs.com/collections/layla")
    print("Expected finish_color: Ivory")
    
    start_time = time.time()
    
    try:
        # Make POST request with extended timeout
        response = requests.post(
            f"{API_BASE}/scrape-product",
            json={"url": "https://www.loloirugs.com/collections/layla"},
            timeout=180  # 3 minute timeout
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
                
                print(f"\n📋 EXTRACTED DATA:")
                print(f"   Name: {name}")
                print(f"   Finish/Color: {finish_color}")
                print(f"   Price: {price}")
                print(f"   SKU: {sku}")
                print(f"   Vendor: {vendor}")
                
                # Check if finish_color is extracted
                if finish_color is not None and finish_color != "":
                    print(f"\n✅ PASS: finish_color extracted successfully")
                    print(f"   Actual: {finish_color}")
                    return True
                else:
                    print(f"\n❌ FAIL: finish_color is NULL or empty")
                    return False
            else:
                error_msg = data.get('error', 'Unknown error')
                print(f"\n❌ FAIL: API returned success=false")
                print(f"   Error: {error_msg}")
                return False
        else:
            print(f"\n❌ FAIL: HTTP {response.status_code}")
            print(f"   Response: {response.text[:200]}...")
            return False
            
    except requests.exceptions.Timeout:
        print(f"\n❌ FAIL: Request timeout (>180 seconds)")
        return False
        
    except Exception as e:
        print(f"\n❌ FAIL: Exception occurred")
        print(f"   Error: {str(e)}")
        return False

if __name__ == "__main__":
    success = test_loloi_extended()
    print(f"\nLoloi Test Result: {'PASS' if success else 'FAIL'}")
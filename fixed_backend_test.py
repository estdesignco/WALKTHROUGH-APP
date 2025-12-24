#!/usr/bin/env python3
"""
CORRECTED BACKEND TEST - Fix the failing endpoints
"""

import requests
import json

BASE_URL = "https://designready.preview.emergentagent.com/api"
HEADERS = {'Content-Type': 'application/json', 'Accept': 'application/json'}

def test_corrected_calculators():
    """Test calculators with correct parameters"""
    print("🧮 TESTING CORRECTED CALCULATORS")
    
    # Wallpaper calculator with correct parameters
    wallpaper_data = {
        "wallpaper_type": "double_roll",
        "wall_width": 12.0,
        "wall_height": 9.0,
        "door_widths": [3.0, 3.0],
        "door_heights": [7.0, 7.0],
        "window_widths": [4.0, 4.0, 3.0],
        "window_heights": [5.0, 5.0, 4.0],
        "pattern_repeat": 24.0,
        "roll_width": 21.0,
        "roll_length": 33.0,
        "cost_per_unit": 85.0
    }
    
    response = requests.post(f"{BASE_URL}/calculators/wallpaper", 
                           headers=HEADERS, json=wallpaper_data, timeout=30)
    
    if response.status_code == 200:
        result = response.json()
        print(f"✅ Wallpaper Calculator: {result}")
    else:
        print(f"❌ Wallpaper Calculator: {response.status_code} - {response.text}")
        
    # Paint calculator
    paint_data = {
        "room_width": 12.0,
        "room_length": 14.0,
        "ceiling_height": 9.0,
        "doors": 2,
        "windows": 3,
        "coats": 2,
        "coverage_per_gallon": 350.0
    }
    
    response = requests.post(f"{BASE_URL}/calculators/paint", 
                           headers=HEADERS, json=paint_data, timeout=30)
    
    if response.status_code == 200:
        result = response.json()
        print(f"✅ Paint Calculator: {result}")
    else:
        print(f"❌ Paint Calculator: {response.status_code} - {response.text}")

def test_vendor_credentials():
    """Test vendor credentials endpoint"""
    print("🔐 TESTING VENDOR CREDENTIALS")
    
    response = requests.get(f"{BASE_URL}/vendor-credentials", headers=HEADERS, timeout=30)
    
    if response.status_code == 200:
        try:
            credentials = response.json()
            print(f"✅ Vendor Credentials: Found {len(credentials)} credentials")
            
            # Check for password exposure
            for cred in credentials:
                if 'password' in cred and cred['password']:
                    print(f"❌ SECURITY ISSUE: Password exposed for {cred.get('vendor', 'unknown')}")
                    return
            print("✅ Security: Passwords properly hidden")
            
        except json.JSONDecodeError:
            print(f"❌ Vendor Credentials: Invalid JSON - {response.text}")
    else:
        print(f"❌ Vendor Credentials: {response.status_code} - {response.text}")

def test_scraper_single():
    """Test a single scraper endpoint"""
    print("🔍 TESTING SINGLE SCRAPER")
    
    scrape_data = {"url": "https://www.jaipurliving.com/majnun-mjl02.html"}
    response = requests.post(f"{BASE_URL}/scrape-product", 
                           headers=HEADERS, json=scrape_data, timeout=60)
    
    if response.status_code == 200:
        try:
            data = response.json()
            print(f"✅ Scraper Success: {data.get('name', 'Unknown')} - ${data.get('price', 0)}")
        except json.JSONDecodeError:
            print(f"❌ Scraper: Invalid JSON - {response.text}")
    else:
        print(f"❌ Scraper: {response.status_code} - {response.text}")

if __name__ == "__main__":
    test_corrected_calculators()
    test_vendor_credentials()
    test_scraper_single()
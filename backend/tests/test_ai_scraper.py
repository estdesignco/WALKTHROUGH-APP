#!/usr/bin/env python3
"""
Backend Testing for AI Scraper V2 and Master Contacts API
Testing Agent - December 29, 2024

Focus: Test the AI scraper backend endpoint that was just fixed and contacts API limit change.
"""

import requests
import json
import time
import sys
import os
from typing import Dict, Any, List

# Get backend URL from frontend .env
BACKEND_URL = "https://bugfix-central-89.preview.emergentagent.com"
API_BASE = f"{BACKEND_URL}/api"

def log_test(test_name: str, status: str, details: str = ""):
    """Log test results with timestamp"""
    timestamp = time.strftime("%H:%M:%S")
    status_emoji = "✅" if status == "PASS" else "❌" if status == "FAIL" else "⚠️"
    print(f"[{timestamp}] {status_emoji} {test_name}: {status}")
    if details:
        print(f"    {details}")

def test_ai_scraper_v2_endpoint():
    """Test the /api/ai-scrape-v2 endpoint with controlled test data"""
    print("\n=== TESTING AI SCRAPER V2 ENDPOINT ===")
    
    # Test 1: Four Hands Product with Swatch Selection
    test_data_1 = {
        "page_url": "https://fourhands.com/product/247970-001",
        "page_text": """
        Toro Coffee Table
        SKU: 247970-001
        Net Price: $2,599.00
        MSRP: $3,299.00
        Dimensions: 48" W x 16" D x 24" H
        Finish: Cappuccino Marble
        Material: Solid marble top with brass base
        Available in multiple finishes
        """,
        "all_images": [
            {
                "url": "https://fourhands.com/images/main-product.jpg",
                "type": "img",
                "width": 800,
                "height": 600,
                "isSwatchLike": False,
                "isSelected": False,
                "isSmallSquare": False,
                "context": {"alt": "Toro Coffee Table main view"}
            },
            {
                "url": "https://fourhands.com/images/cappuccino-marble-swatch.jpg",
                "type": "img", 
                "width": 50,
                "height": 50,
                "isSwatchLike": True,
                "isSelected": True,
                "isSmallSquare": True,
                "context": {
                    "alt": "Cappuccino Marble finish",
                    "title": "Cappuccino Marble",
                    "dataColor": "cappuccino-marble",
                    "nearbyText": "Select Finish: Cappuccino Marble"
                }
            },
            {
                "url": "https://fourhands.com/images/white-marble-swatch.jpg",
                "type": "img",
                "width": 50, 
                "height": 50,
                "isSwatchLike": True,
                "isSelected": False,
                "isSmallSquare": True,
                "context": {
                    "alt": "White Marble finish",
                    "title": "White Marble",
                    "dataColor": "white-marble"
                }
            }
        ],
        "main_image": "https://fourhands.com/images/main-product.jpg"
    }
    
    try:
        response = requests.post(
            f"{API_BASE}/ai-scrape-v2",
            json=test_data_1,
            timeout=30
        )
        
        if response.status_code == 200:
            data = response.json()
            
            # Verify all required fields are present
            required_fields = ['name', 'sku', 'price', 'msrp', 'size', 'finish_color', 'vendor', 'swatch_image_url']
            missing_fields = [field for field in required_fields if field not in data or data[field] is None]
            
            if not missing_fields:
                # Verify swatch selection logic
                expected_swatch = "https://fourhands.com/images/cappuccino-marble-swatch.jpg"
                if data.get('swatch_image_url') == expected_swatch:
                    log_test("AI Scraper V2 - Four Hands Test", "PASS", 
                           f"All 8 fields extracted, correct swatch selected: {data.get('name')} - {data.get('finish_color')}")
                else:
                    log_test("AI Scraper V2 - Four Hands Test", "FAIL", 
                           f"Wrong swatch selected. Expected: {expected_swatch}, Got: {data.get('swatch_image_url')}")
            else:
                log_test("AI Scraper V2 - Four Hands Test", "FAIL", 
                       f"Missing fields: {missing_fields}")
                
            print(f"    Response: {json.dumps(data, indent=2)}")
            
        else:
            log_test("AI Scraper V2 - Four Hands Test", "FAIL", 
                   f"HTTP {response.status_code}: {response.text}")
            
    except Exception as e:
        log_test("AI Scraper V2 - Four Hands Test", "FAIL", f"Exception: {str(e)}")

    # Test 2: Visual Comfort Product with Multiple Swatches
    test_data_2 = {
        "page_url": "https://visualcomfort.com/bau-28-pendant-700tdbau28/",
        "page_text": """
        BAU 28 Pendant
        Item #: 700TDBAU28
        Trade Price: $2,999.00
        Retail Price: $3,999.00
        Size: 28" W x 20" H
        Finish: Natural Brass
        Available Finishes: Natural Brass, Aged Iron, Polished Chrome
        """,
        "all_images": [
            {
                "url": "https://visualcomfort.com/images/bau-pendant-main.jpg",
                "type": "img",
                "width": 600,
                "height": 800,
                "isSwatchLike": False,
                "isSelected": False,
                "isSmallSquare": False,
                "context": {"alt": "BAU 28 Pendant main image"}
            },
            {
                "url": "https://visualcomfort.com/images/natural-brass-finish.jpg",
                "type": "img",
                "width": 40,
                "height": 40,
                "isSwatchLike": True,
                "isSelected": True,
                "isSmallSquare": True,
                "context": {
                    "alt": "Natural Brass",
                    "title": "Natural Brass finish",
                    "nearbyText": "Finish: Natural Brass"
                }
            },
            {
                "url": "https://visualcomfort.com/images/aged-iron-finish.jpg",
                "type": "img",
                "width": 40,
                "height": 40,
                "isSwatchLike": True,
                "isSelected": False,
                "isSmallSquare": True,
                "context": {
                    "alt": "Aged Iron",
                    "title": "Aged Iron finish"
                }
            }
        ],
        "main_image": "https://visualcomfort.com/images/bau-pendant-main.jpg"
    }
    
    try:
        response = requests.post(
            f"{API_BASE}/ai-scrape-v2",
            json=test_data_2,
            timeout=30
        )
        
        if response.status_code == 200:
            data = response.json()
            
            # Check if correct swatch was selected (should be the selected Natural Brass one)
            expected_swatch = "https://visualcomfort.com/images/natural-brass-finish.jpg"
            if data.get('swatch_image_url') == expected_swatch and data.get('finish_color'):
                log_test("AI Scraper V2 - Visual Comfort Test", "PASS",
                       f"Correct swatch selected for {data.get('name')} - {data.get('finish_color')}")
            else:
                log_test("AI Scraper V2 - Visual Comfort Test", "FAIL",
                       f"Swatch selection issue. Got: {data.get('swatch_image_url')}")
                       
            print(f"    Response: {json.dumps(data, indent=2)}")
            
        else:
            log_test("AI Scraper V2 - Visual Comfort Test", "FAIL",
                   f"HTTP {response.status_code}: {response.text}")
                   
    except Exception as e:
        log_test("AI Scraper V2 - Visual Comfort Test", "FAIL", f"Exception: {str(e)}")

    # Test 3: Edge Case - No Swatch Images
    test_data_3 = {
        "page_url": "https://example.com/simple-product",
        "page_text": """
        Simple Product
        SKU: SP-001
        Price: $199.00
        MSRP: $299.00
        Size: 12" x 8" x 4"
        Color: Blue
        """,
        "all_images": [
            {
                "url": "https://example.com/product-main.jpg",
                "type": "img",
                "width": 500,
                "height": 400,
                "isSwatchLike": False,
                "isSelected": False,
                "isSmallSquare": False,
                "context": {"alt": "Simple Product"}
            }
        ],
        "main_image": "https://example.com/product-main.jpg"
    }
    
    try:
        response = requests.post(
            f"{API_BASE}/ai-scrape-v2",
            json=test_data_3,
            timeout=30
        )
        
        if response.status_code == 200:
            data = response.json()
            
            # Should extract product data but swatch_image_url should be null
            if data.get('name') and data.get('swatch_image_url') is None:
                log_test("AI Scraper V2 - No Swatch Test", "PASS",
                       f"Product extracted without swatch: {data.get('name')}")
            else:
                log_test("AI Scraper V2 - No Swatch Test", "FAIL",
                       f"Unexpected swatch selection: {data.get('swatch_image_url')}")
                       
            print(f"    Response: {json.dumps(data, indent=2)}")
            
        else:
            log_test("AI Scraper V2 - No Swatch Test", "FAIL",
                   f"HTTP {response.status_code}: {response.text}")
                   
    except Exception as e:
        log_test("AI Scraper V2 - No Swatch Test", "FAIL", f"Exception: {str(e)}")

def test_master_contacts_limit():
    """Test the /api/master/contacts endpoint to verify the limit change from 100 to 10000"""
    print("\n=== TESTING MASTER CONTACTS API LIMIT ===")
    
    try:
        # Test without limit parameter (should default to 10000)
        response = requests.get(f"{API_BASE}/master/contacts", timeout=10)
        
        if response.status_code == 200:
            contacts = response.json()
            contact_count = len(contacts)
            
            if contact_count > 100:
                log_test("Master Contacts - Default Limit", "PASS",
                       f"Retrieved {contact_count} contacts (>100, confirming limit increase)")
            elif contact_count <= 100:
                log_test("Master Contacts - Default Limit", "PASS",
                       f"Retrieved {contact_count} contacts (≤100, but no artificial limit)")
            else:
                log_test("Master Contacts - Default Limit", "FAIL",
                       f"Unexpected contact count: {contact_count}")
                       
        else:
            log_test("Master Contacts - Default Limit", "FAIL",
                   f"HTTP {response.status_code}: {response.text}")
                   
    except Exception as e:
        log_test("Master Contacts - Default Limit", "FAIL", f"Exception: {str(e)}")
    
    # Test with explicit limit parameter
    try:
        response = requests.get(f"{API_BASE}/master/contacts?limit=50", timeout=10)
        
        if response.status_code == 200:
            contacts = response.json()
            contact_count = len(contacts)
            
            if contact_count <= 50:
                log_test("Master Contacts - Custom Limit", "PASS",
                       f"Retrieved {contact_count} contacts with limit=50")
            else:
                log_test("Master Contacts - Custom Limit", "FAIL",
                       f"Limit not respected: got {contact_count} contacts with limit=50")
                       
        else:
            log_test("Master Contacts - Custom Limit", "FAIL",
                   f"HTTP {response.status_code}: {response.text}")
                   
    except Exception as e:
        log_test("Master Contacts - Custom Limit", "FAIL", f"Exception: {str(e)}")

def test_backend_health():
    """Test basic backend connectivity"""
    print("\n=== TESTING BACKEND HEALTH ===")
    
    try:
        # Test basic connectivity
        response = requests.get(f"{API_BASE}/item-statuses", timeout=10)
        
        if response.status_code == 200:
            statuses = response.json()
            log_test("Backend Health Check", "PASS", 
                   f"Backend responding, {len(statuses)} item statuses available")
        else:
            log_test("Backend Health Check", "FAIL",
                   f"HTTP {response.status_code}: {response.text}")
                   
    except Exception as e:
        log_test("Backend Health Check", "FAIL", f"Exception: {str(e)}")

def run_all_tests():
    """Run all backend tests"""
    print("🧪 BACKEND TESTING - AI SCRAPER V2 & CONTACTS API")
    print("=" * 60)
    print(f"Backend URL: {BACKEND_URL}")
    print(f"Test Time: {time.strftime('%Y-%m-%d %H:%M:%S')}")
    
    # Run tests
    test_backend_health()
    test_ai_scraper_v2_endpoint()
    test_master_contacts_limit()
    
    print("\n" + "=" * 60)
    print("🏁 BACKEND TESTING COMPLETE")

if __name__ == "__main__":
    run_all_tests()
#!/usr/bin/env python3
"""
DETAILED API INVESTIGATION
Investigating the POST endpoint issues and scraper timeout
"""

import requests
import json
import time
from datetime import datetime
import uuid

BASE_URL = "https://designvault-5.preview.emergentagent.com/api"

def test_post_endpoints():
    """Test POST endpoints with detailed response analysis"""
    print("🔍 DETAILED POST ENDPOINT INVESTIGATION")
    print("=" * 50)
    
    # Test 1: Projects POST
    print("\n1. TESTING POST /projects")
    print("-" * 30)
    
    project_data = {
        "name": f"API Test Project {uuid.uuid4().hex[:8]}",
        "client_info": {
            "full_name": "John Smith",
            "email": "john.smith@example.com",
            "phone": "(555) 123-4567",
            "address": "123 Main St, Anytown, USA"
        },
        "project_type": "Renovation",
        "timeline": "3 months",
        "budget": "$50,000"
    }
    
    try:
        response = requests.post(f"{BASE_URL}/projects", json=project_data, timeout=30)
        print(f"Status Code: {response.status_code}")
        print(f"Headers: {dict(response.headers)}")
        try:
            data = response.json()
            print(f"Response: {json.dumps(data, indent=2)}")
        except:
            print(f"Response Text: {response.text}")
    except Exception as e:
        print(f"Error: {e}")
    
    # Test 2: Contacts POST
    print("\n2. TESTING POST /master/contacts")
    print("-" * 30)
    
    contact_data = {
        "name": f"Test Contact {uuid.uuid4().hex[:8]}",
        "company": "Test Company",
        "email": "test@example.com",
        "phone": "(555) 987-6543"
    }
    
    try:
        response = requests.post(f"{BASE_URL}/master/contacts", json=contact_data, timeout=30)
        print(f"Status Code: {response.status_code}")
        print(f"Headers: {dict(response.headers)}")
        try:
            data = response.json()
            print(f"Response: {json.dumps(data, indent=2)}")
        except:
            print(f"Response Text: {response.text}")
    except Exception as e:
        print(f"Error: {e}")
    
    # Test 3: Materials POST
    print("\n3. TESTING POST /master/materials")
    print("-" * 30)
    
    material_data = {
        "name": f"Test Material {uuid.uuid4().hex[:8]}",
        "category": "Fabric",
        "manufacturer": "Test Manufacturer"
    }
    
    try:
        response = requests.post(f"{BASE_URL}/master/materials", json=material_data, timeout=30)
        print(f"Status Code: {response.status_code}")
        print(f"Headers: {dict(response.headers)}")
        try:
            data = response.json()
            print(f"Response: {json.dumps(data, indent=2)}")
        except:
            print(f"Response Text: {response.text}")
    except Exception as e:
        print(f"Error: {e}")

def test_scraper_quick():
    """Test scraper with shorter timeout and different approach"""
    print("\n🕷️ TESTING SCRAPER (QUICK TEST)")
    print("-" * 30)
    
    scraper_data = {
        "url": "https://fourhands.com/product/232775-001"
    }
    
    try:
        print("Starting scraper request...")
        start_time = time.time()
        response = requests.post(f"{BASE_URL}/scrape-product", json=scraper_data, timeout=90)
        end_time = time.time()
        
        print(f"Status Code: {response.status_code}")
        print(f"Response Time: {end_time - start_time:.2f}s")
        
        if response.status_code == 200:
            try:
                data = response.json()
                print(f"Success: {data.get('success', False)}")
                if 'data' in data:
                    product_data = data['data']
                    print(f"Product Name: {product_data.get('name', 'N/A')}")
                    print(f"Price: {product_data.get('price', 'N/A')}")
                    print(f"Finish Color: {product_data.get('finish_color', 'N/A')}")
                    print(f"Image URL: {product_data.get('image_url', 'N/A')}")
                else:
                    print(f"Response: {json.dumps(data, indent=2)}")
            except:
                print(f"Response Text: {response.text}")
        else:
            print(f"Error Response: {response.text}")
            
    except requests.exceptions.Timeout:
        print("❌ Scraper request timed out after 90 seconds")
    except Exception as e:
        print(f"❌ Scraper error: {e}")

def test_utility_endpoints_detailed():
    """Test utility endpoints with detailed analysis"""
    print("\n🔧 DETAILED UTILITY ENDPOINTS TEST")
    print("-" * 30)
    
    endpoints = [
        "/item-statuses",
        "/carrier-options", 
        "/vendor-credentials"
    ]
    
    for endpoint in endpoints:
        print(f"\nTesting {endpoint}:")
        try:
            response = requests.get(f"{BASE_URL}{endpoint}", timeout=30)
            print(f"  Status: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list):
                    print(f"  Count: {len(data)} items")
                    if len(data) > 0:
                        print(f"  Sample: {data[0]}")
                elif isinstance(data, dict):
                    if 'data' in data:
                        items = data['data']
                        print(f"  Count: {len(items)} items")
                        if len(items) > 0:
                            print(f"  Sample: {items[0]}")
                    elif 'credentials' in data:
                        items = data['credentials']
                        print(f"  Count: {len(items)} items")
                        if len(items) > 0:
                            print(f"  Sample: {items[0]}")
                    else:
                        print(f"  Response: {data}")
            else:
                print(f"  Error: {response.text}")
                
        except Exception as e:
            print(f"  Exception: {e}")

if __name__ == "__main__":
    test_post_endpoints()
    test_scraper_quick()
    test_utility_endpoints_detailed()
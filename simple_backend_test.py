#!/usr/bin/env python3
"""
Simple Backend Test - Quick verification of core functionality
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
PROJECT_ID = "bb060596-85c2-455f-860a-cf9fa23dfacf"

print(f"🔍 SIMPLE BACKEND VERIFICATION")
print(f"Testing Backend APIs at: {BASE_URL}")
print("=" * 60)

def test_endpoint(method, endpoint, data=None):
    """Test a single endpoint"""
    try:
        url = f"{BASE_URL}{endpoint}"
        
        if method.upper() == 'GET':
            response = requests.get(url)
        elif method.upper() == 'POST':
            response = requests.post(url, json=data)
        elif method.upper() == 'DELETE':
            response = requests.delete(url)
        else:
            return False, f"Unsupported method: {method}", 0
            
        success = response.status_code < 400
        try:
            response_data = response.json() if response.content else {}
        except:
            response_data = response.text
            
        return success, response_data, response.status_code
        
    except Exception as e:
        return False, f"Request failed: {str(e)}", 0

# Test 1: Basic project retrieval
print("\n1. Testing GET /api/projects/{project_id}")
success, data, status_code = test_endpoint('GET', f'/projects/{PROJECT_ID}')
if success:
    print(f"✅ SUCCESS: Project retrieved (Status: {status_code})")
    rooms = data.get('rooms', [])
    print(f"   Project has {len(rooms)} rooms")
else:
    print(f"❌ FAILED: {data} (Status: {status_code})")

# Test 2: Status dropdowns
print("\n2. Testing GET /api/item-statuses-enhanced")
success, data, status_code = test_endpoint('GET', '/item-statuses-enhanced')
if success:
    statuses = data.get('data', []) if isinstance(data, dict) else data
    print(f"✅ SUCCESS: Retrieved {len(statuses)} statuses (Status: {status_code})")
else:
    print(f"❌ FAILED: {data} (Status: {status_code})")

# Test 3: Carrier options
print("\n3. Testing GET /api/carrier-options")
success, data, status_code = test_endpoint('GET', '/carrier-options')
if success:
    carriers = data.get('data', []) if isinstance(data, dict) else data
    print(f"✅ SUCCESS: Retrieved {len(carriers)} carriers (Status: {status_code})")
else:
    print(f"❌ FAILED: {data} (Status: {status_code})")

# Test 4: Simple scraping test
print("\n4. Testing POST /api/scrape-product")
scrape_data = {"url": "https://example.com"}
success, data, status_code = test_endpoint('POST', '/scrape-product', scrape_data)
if success:
    print(f"✅ SUCCESS: Scraping endpoint working (Status: {status_code})")
    product_data = data.get('data', {}) if isinstance(data, dict) else {}
    if product_data.get('name'):
        print(f"   Extracted name: {product_data['name']}")
else:
    print(f"❌ FAILED: {data} (Status: {status_code})")

# Test 5: Room creation (simple)
print("\n5. Testing POST /api/rooms (Simple)")
room_data = {
    "name": "Simple Test Room",
    "description": "Simple test",
    "project_id": PROJECT_ID,
    "order_index": 0
}
success, data, status_code = test_endpoint('POST', '/rooms', room_data)
if success:
    room_id = data.get('id')
    print(f"✅ SUCCESS: Room created with ID {room_id} (Status: {status_code})")
    
    # Test room deletion immediately
    print("\n6. Testing DELETE /api/rooms/{room_id}")
    success_del, data_del, status_del = test_endpoint('DELETE', f'/rooms/{room_id}')
    if success_del:
        print(f"✅ SUCCESS: Room deleted (Status: {status_del})")
    else:
        print(f"❌ FAILED: {data_del} (Status: {status_del})")
else:
    print(f"❌ FAILED: {data} (Status: {status_code})")

print("\n" + "=" * 60)
print("🏁 SIMPLE BACKEND VERIFICATION COMPLETE")
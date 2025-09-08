#!/usr/bin/env python3
"""
Debug scraping to see what's happening
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

def test_scraping(url):
    print(f"\n=== Testing: {url} ===")
    
    try:
        endpoint = f"{BASE_URL}/scrape-product"
        data = {"url": url}
        
        response = requests.post(endpoint, json=data, timeout=30)
        
        print(f"Status Code: {response.status_code}")
        
        if response.content:
            result = response.json()
            print("Response:")
            for key, value in result.items():
                if value:  # Only show non-empty values
                    print(f"  {key}: {value}")
                else:
                    print(f"  {key}: (empty)")
        else:
            print("No response content")
            
    except Exception as e:
        print(f"Error: {e}")

# Test various URLs
test_urls = [
    "https://www.amazon.com/dp/B08N5WRWNW",
    "https://www.homedepot.com/p/test",
    "https://www.visualcomfort.com/test",
    "https://www.fourhands.com/test"
]

for url in test_urls:
    test_scraping(url)
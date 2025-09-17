#!/usr/bin/env python3
"""
Categories Available Endpoint Test - REVIEW REQUEST FOCUS
Tests GET /api/categories/available to verify it returns ALL categories from enhanced_rooms.py
"""

import requests
import json
from typing import Set

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

print(f"🎯 REVIEW REQUEST: Testing Categories Available Endpoint")
print(f"Testing at: {BASE_URL}")
print("=" * 60)

def test_categories_available_endpoint():
    """Test GET /api/categories/available endpoint"""
    
    # Expected categories from enhanced_rooms.py (from our analysis above)
    expected_categories = {
        "Lighting",
        "Furniture", 
        "Window Treatments",
        "Textiles & Soft Goods",
        "Art & Accessories",
        "Fireplace & Built-ins",
        "Appliances",
        "Plumbing",
        "Plumbing & Fixtures",
        "Cabinets, Built-ins, and Trim",
        "Tile and Tops",
        "Furniture & Storage",
        "Paint, Wallpaper, and Finishes",
        "Decor & Accessories"
    }
    
    print(f"📋 Expected categories from enhanced_rooms.py ({len(expected_categories)} total):")
    for cat in sorted(expected_categories):
        print(f"   ✓ {cat}")
    
    print(f"\n🔍 Testing GET /api/categories/available...")
    
    try:
        response = requests.get(f"{BASE_URL}/categories/available", timeout=10)
        
        print(f"   Status Code: {response.status_code}")
        
        if response.status_code != 200:
            print(f"   ❌ FAIL: Expected status 200, got {response.status_code}")
            print(f"   Response: {response.text}")
            return False
            
        # Parse JSON response
        try:
            data = response.json()
            print(f"   ✅ SUCCESS: Valid JSON response received")
        except json.JSONDecodeError as e:
            print(f"   ❌ FAIL: Invalid JSON response: {e}")
            print(f"   Response text: {response.text}")
            return False
        
        # Check response structure
        if not isinstance(data, dict) or 'categories' not in data:
            print(f"   ❌ FAIL: Expected {{categories: [...]}} structure")
            print(f"   Got: {data}")
            return False
            
        categories_list = data['categories']
        if not isinstance(categories_list, list):
            print(f"   ❌ FAIL: Expected categories to be a list")
            print(f"   Got: {type(categories_list)}")
            return False
            
        print(f"   ✅ SUCCESS: Correct response structure")
        
        # Convert to set for comparison
        returned_categories = set(categories_list)
        
        print(f"\n📊 ANALYSIS:")
        print(f"   Expected categories: {len(expected_categories)}")
        print(f"   Returned categories: {len(returned_categories)}")
        
        print(f"\n📋 Returned categories:")
        for cat in sorted(returned_categories):
            print(f"   • {cat}")
        
        # Check for missing categories
        missing_categories = expected_categories - returned_categories
        if missing_categories:
            print(f"\n❌ MISSING CATEGORIES ({len(missing_categories)}):")
            for cat in sorted(missing_categories):
                print(f"   ✗ {cat}")
        else:
            print(f"\n✅ ALL EXPECTED CATEGORIES FOUND!")
            
        # Check for extra categories
        extra_categories = returned_categories - expected_categories
        if extra_categories:
            print(f"\n➕ EXTRA CATEGORIES ({len(extra_categories)}):")
            for cat in sorted(extra_categories):
                print(f"   + {cat}")
        
        # Overall assessment
        if missing_categories:
            print(f"\n🚨 CRITICAL ISSUE: {len(missing_categories)} expected categories are missing!")
            print(f"   The frontend is only showing 4 categories with 2 working because")
            print(f"   the backend is not returning the complete list from enhanced_rooms.py")
            return False
        elif len(returned_categories) == len(expected_categories):
            print(f"\n🎉 PERFECT MATCH: All {len(expected_categories)} categories returned correctly!")
            print(f"   This should resolve the frontend issue of only showing 4 categories")
            return True
        else:
            print(f"\n✅ SUCCESS: All expected categories found (plus {len(extra_categories)} extras)")
            return True
            
    except requests.exceptions.RequestException as e:
        print(f"   ❌ FAIL: Request failed: {e}")
        return False
    except Exception as e:
        print(f"   ❌ FAIL: Unexpected error: {e}")
        return False

def verify_enhanced_rooms_structure():
    """Verify the enhanced_rooms.py structure is accessible"""
    print(f"\n🔍 Verifying enhanced_rooms.py structure...")
    
    try:
        # Import and check the structure
        import sys
        sys.path.append('/app/backend')
        from enhanced_rooms import COMPREHENSIVE_ROOM_STRUCTURE
        
        all_categories = set()
        room_count = 0
        
        for room_name, room_structure in COMPREHENSIVE_ROOM_STRUCTURE.items():
            room_count += 1
            categories_list = room_structure.get('categories', [])
            for category_obj in categories_list:
                category_name = category_obj.get('name', '')
                if category_name:
                    all_categories.add(category_name)
        
        print(f"   ✅ Enhanced rooms structure loaded successfully")
        print(f"   📊 Structure contains:")
        print(f"      - {room_count} room types")
        print(f"      - {len(all_categories)} unique categories")
        
        print(f"   📋 Categories in enhanced_rooms.py:")
        for cat in sorted(all_categories):
            print(f"      • {cat}")
            
        return all_categories
        
    except ImportError as e:
        print(f"   ❌ FAIL: Cannot import enhanced_rooms: {e}")
        return None
    except Exception as e:
        print(f"   ❌ FAIL: Error reading enhanced_rooms: {e}")
        return None

if __name__ == "__main__":
    print("🚀 Starting Categories Available Endpoint Test")
    
    # First verify the enhanced_rooms structure
    enhanced_categories = verify_enhanced_rooms_structure()
    
    if enhanced_categories is None:
        print("\n❌ Cannot proceed with test - enhanced_rooms.py not accessible")
        exit(1)
    
    # Test the endpoint
    success = test_categories_available_endpoint()
    
    print("\n" + "=" * 60)
    if success:
        print("🎉 TEST PASSED: Categories available endpoint working correctly!")
        print("   The backend should now provide all categories to the frontend.")
    else:
        print("❌ TEST FAILED: Categories available endpoint has issues!")
        print("   This explains why the frontend only shows 4 categories with 2 working.")
    
    print("=" * 60)
    exit(0 if success else 1)
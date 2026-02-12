#!/usr/bin/env python3
"""
AI-Powered Product Scraper V2 Testing - Focused Test
Tests the /api/ai-scrape-v2 endpoint with working vendor URLs
"""

import requests
import json
import time
from typing import Dict, List, Any
import sys

# Backend URL from environment
BACKEND_URL = "https://fix-verification-1.preview.emergentagent.com"
API_BASE = f"{BACKEND_URL}/api"

def test_ai_scraper_endpoint():
    """Test the AI scraper endpoint with realistic data"""
    print("🚀 Testing AI-Powered Product Scraper V2 Endpoint")
    print("=" * 60)
    
    # Test cases with realistic product data
    test_cases = [
        {
            "name": "Four Hands Toro Coffee Table",
            "url": "https://fourhands.com/product/247970-001",
            "page_text": """
            Toro Coffee Table
            SKU: 247970-001
            Price: $2,599.00
            MSRP: $3,299.00
            Dimensions: 48"W x 24"D x 16"H
            Finish: Cappuccino Marble
            Material: Light Wood and Marble
            Two-tier design with storage
            Contoured edges for modern appeal
            Available in Cappuccino Marble finish
            """,
            "images": [
                {
                    "url": "https://fourhands.com/images/247970-001-main.jpg",
                    "type": "img",
                    "width": 800,
                    "height": 600,
                    "isSwatchLike": False,
                    "isSelected": True,
                    "isSmallSquare": False,
                    "context": {"title": "Main Product Image", "alt": "Toro Coffee Table"}
                },
                {
                    "url": "https://fourhands.com/images/247970-001-swatch.jpg",
                    "type": "img",
                    "width": 100,
                    "height": 100,
                    "isSwatchLike": True,
                    "isSelected": False,
                    "isSmallSquare": True,
                    "context": {"title": "Cappuccino Marble", "alt": "Marble finish swatch", "dataColor": "cappuccino"}
                }
            ]
        },
        {
            "name": "Visual Comfort Pendant Light",
            "url": "https://visualcomfort.com/bau-28-pendant-700tdbau28/",
            "page_text": """
            BAU 28 Pendant
            Item Number: 700TDBAU28
            Designer Price: $2,999.00
            List Price: $3,999.00
            Dimensions: 28"W x 20"H
            Finish: Natural Brass
            Shade: White Linen
            Bulb Type: LED Compatible
            Available Finishes: Natural Brass, Aged Iron
            """,
            "images": [
                {
                    "url": "https://visualcomfort.com/images/700tdbau28-main.jpg",
                    "type": "img",
                    "width": 600,
                    "height": 800,
                    "isSwatchLike": False,
                    "isSelected": True,
                    "isSmallSquare": False,
                    "context": {"title": "BAU 28 Pendant", "alt": "Pendant light main image"}
                },
                {
                    "url": "https://visualcomfort.com/images/700tdbau28-brass-swatch.jpg",
                    "type": "img",
                    "width": 80,
                    "height": 80,
                    "isSwatchLike": True,
                    "isSelected": True,
                    "isSmallSquare": True,
                    "context": {"title": "Natural Brass", "alt": "Natural Brass finish", "nearbyText": "Available Finishes"}
                }
            ]
        },
        {
            "name": "Loloi Rug Sample",
            "url": "https://loloirugs.com/collections/layla",
            "page_text": """
            Layla Collection
            Style: LAY-13
            Retail Price: $299.00
            Trade Price: $179.00
            Size Options: 2'x3', 5'x8', 8'x11', 9'x13'
            Color: Ocean Multi
            Material: Polyester
            Construction: Machine Made
            Origin: Turkey
            """,
            "images": [
                {
                    "url": "https://loloirugs.com/images/lay-13-main.jpg",
                    "type": "img",
                    "width": 500,
                    "height": 700,
                    "isSwatchLike": False,
                    "isSelected": True,
                    "isSmallSquare": False,
                    "context": {"title": "Layla LAY-13", "alt": "Rug main image"}
                },
                {
                    "url": "https://loloirugs.com/images/lay-13-ocean-swatch.jpg",
                    "type": "img",
                    "width": 60,
                    "height": 60,
                    "isSwatchLike": True,
                    "isSelected": True,
                    "isSmallSquare": True,
                    "context": {"title": "Ocean Multi", "alt": "Ocean Multi colorway", "dataColor": "ocean-multi"}
                }
            ]
        }
    ]
    
    results = []
    
    for i, test_case in enumerate(test_cases, 1):
        print(f"\n🔍 Test {i}: {test_case['name']}")
        print(f"  URL: {test_case['url']}")
        
        # Prepare request
        request_data = {
            "page_text": test_case["page_text"],
            "page_url": test_case["url"],
            "all_images": test_case["images"],
            "main_image": test_case["images"][0]["url"] if test_case["images"] else None
        }
        
        try:
            print(f"  🤖 Calling AI scraper endpoint...")
            start_time = time.time()
            
            response = requests.post(
                f"{API_BASE}/ai-scrape-v2",
                json=request_data,
                headers={'Content-Type': 'application/json'},
                timeout=60
            )
            
            response_time = time.time() - start_time
            print(f"  ⏱️  Response time: {response_time:.2f}s")
            
            if response.status_code == 200:
                data = response.json()
                print(f"  📊 Response data:")
                for key, value in data.items():
                    status = "✅" if value is not None and value != "" else "❌"
                    print(f"    {status} {key}: {value}")
                
                # Count successful fields
                successful_fields = sum(1 for v in data.values() if v is not None and v != "")
                total_fields = len(data)
                
                result = {
                    'test_name': test_case['name'],
                    'success': successful_fields == total_fields,
                    'fields_extracted': successful_fields,
                    'total_fields': total_fields,
                    'response_time': response_time,
                    'data': data
                }
                
                if result['success']:
                    print(f"  🎉 SUCCESS: All {successful_fields} fields extracted")
                else:
                    print(f"  ⚠️  PARTIAL: {successful_fields}/{total_fields} fields extracted")
                
            else:
                print(f"  ❌ HTTP Error {response.status_code}: {response.text}")
                result = {
                    'test_name': test_case['name'],
                    'success': False,
                    'error': f"HTTP {response.status_code}",
                    'response_time': response_time
                }
            
            results.append(result)
            
        except Exception as e:
            print(f"  ❌ Error: {str(e)}")
            results.append({
                'test_name': test_case['name'],
                'success': False,
                'error': str(e),
                'response_time': 0
            })
        
        # Brief pause between tests
        time.sleep(1)
    
    # Summary
    print(f"\n" + "=" * 60)
    print(f"📊 AI SCRAPER V2 TEST SUMMARY")
    print(f"=" * 60)
    
    successful_tests = [r for r in results if r.get('success', False)]
    total_tests = len(results)
    
    print(f"\n📈 Results:")
    print(f"  Total Tests: {total_tests}")
    print(f"  Successful: {len(successful_tests)}")
    print(f"  Failed: {total_tests - len(successful_tests)}")
    print(f"  Success Rate: {(len(successful_tests)/total_tests)*100:.1f}%")
    
    print(f"\n📋 Detailed Results:")
    for result in results:
        status = "✅ PASS" if result.get('success', False) else "❌ FAIL"
        fields = f"{result.get('fields_extracted', 0)}/{result.get('total_fields', 8)}" if 'fields_extracted' in result else "N/A"
        time_str = f"{result.get('response_time', 0):.2f}s"
        print(f"  {status} {result['test_name']:<30} {fields:<8} {time_str}")
    
    # Field analysis for successful tests
    if successful_tests:
        print(f"\n🔍 Field Extraction Analysis:")
        field_counts = {}
        for result in successful_tests:
            if 'data' in result:
                for field, value in result['data'].items():
                    if value is not None and value != "":
                        field_counts[field] = field_counts.get(field, 0) + 1
        
        for field, count in sorted(field_counts.items()):
            percentage = (count / len(successful_tests)) * 100
            print(f"  • {field}: {count}/{len(successful_tests)} tests ({percentage:.1f}%)")
    
    return len(successful_tests) == total_tests

def main():
    """Main test execution"""
    try:
        # Test API connectivity
        print("🔗 Testing API connectivity...")
        response = requests.get(f"{BACKEND_URL}/api/projects", timeout=10)
        if response.status_code == 200:
            print("✅ Backend API is accessible")
        else:
            print(f"❌ Backend API error: {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ Cannot connect to backend: {e}")
        return False
    
    # Run the AI scraper tests
    success = test_ai_scraper_endpoint()
    
    if success:
        print(f"\n✅ All AI scraper tests passed!")
    else:
        print(f"\n⚠️  Some AI scraper tests failed - see details above")
    
    return success

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
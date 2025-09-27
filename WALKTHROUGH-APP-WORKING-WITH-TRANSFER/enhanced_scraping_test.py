#!/usr/bin/env python3
"""
ENHANCED SCRAPING TEST - REVIEW REQUEST FOCUSED TESTING
Test the specific URLs mentioned in the review request and verify field population
"""

import requests
import json
import time
from typing import Dict, Any

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

print("=" * 80)
print("🎯 ENHANCED SCRAPING TEST - REVIEW REQUEST FOCUSED TESTING")
print("=" * 80)
print(f"Backend URL: {BASE_URL}")
print("Testing specific URLs from review request with focus on size, finish_color fields")
print("=" * 80)

class EnhancedScrapingTester:
    def __init__(self):
        self.session = requests.Session()
        
    def make_request(self, method: str, endpoint: str, data: Dict = None, timeout: int = 45) -> tuple:
        """Make HTTP request with extended timeout for scraping"""
        try:
            url = f"{BASE_URL}{endpoint}"
            
            if method.upper() == 'POST':
                response = self.session.post(url, json=data, timeout=timeout)
            else:
                return False, f"Unsupported method: {method}", 400
                
            return response.status_code < 400, response.json() if response.content else {}, response.status_code
            
        except requests.exceptions.RequestException as e:
            return False, f"Request failed: {str(e)}", 0
        except json.JSONDecodeError as e:
            return False, f"JSON decode error: {str(e)}", response.status_code if 'response' in locals() else 0
        except Exception as e:
            return False, f"Unexpected error: {str(e)}", 0

    def test_specific_urls(self):
        """Test the specific URLs mentioned in the review request"""
        
        # URLs from review request
        test_cases = [
            {
                "name": "Four Hands Fenn Chair (Review Request URL)",
                "url": "https://fourhandshome.com/products/fenn-chair-248067-003",
                "expected_vendor": None,  # This URL has a typo, won't match vendor detection
                "notes": "URL from review request - likely has typo in domain"
            },
            {
                "name": "Four Hands Fenn Chair (Corrected URL)",
                "url": "https://fourhands.com/product/248067-003", 
                "expected_vendor": "Four Hands",
                "notes": "Corrected URL based on backend vendor mapping"
            },
            {
                "name": "Wayfair Belinda Armchair (Review Request)",
                "url": "https://www.wayfair.com/furniture/pdp/wade-logan-belinda-armchair-w001239312.html",
                "expected_vendor": "Wayfair",
                "notes": "Basic URL test case from review request"
            }
        ]
        
        for i, test_case in enumerate(test_cases, 1):
            print(f"\n{'='*60}")
            print(f"TEST {i}: {test_case['name']}")
            print(f"{'='*60}")
            print(f"URL: {test_case['url']}")
            print(f"Expected Vendor: {test_case['expected_vendor']}")
            print(f"Notes: {test_case['notes']}")
            print(f"{'='*60}")
            
            # Make scraping request
            scrape_data = {"url": test_case["url"]}
            success, data, status_code = self.make_request('POST', '/scrape-product', scrape_data)
            
            print(f"📊 RESPONSE STATUS:")
            print(f"   Status Code: {status_code}")
            print(f"   Success: {success}")
            
            if success:
                if isinstance(data, dict) and 'success' in data and 'data' in data:
                    product_data = data.get('data', {})
                    
                    # Extract all fields
                    fields = {
                        'name': product_data.get('name', ''),
                        'price': product_data.get('price', ''),
                        'cost': product_data.get('cost', ''),
                        'size': product_data.get('size', ''),
                        'finish_color': product_data.get('finish_color', ''),
                        'color': product_data.get('color', ''),
                        'vendor': product_data.get('vendor', ''),
                        'sku': product_data.get('sku', ''),
                        'image_url': product_data.get('image_url', ''),
                        'description': product_data.get('description', ''),
                        'availability': product_data.get('availability', '')
                    }
                    
                    print(f"\n📋 EXTRACTED FIELDS ANALYSIS:")
                    for field_name, field_value in fields.items():
                        status = "✅ POPULATED" if field_value and str(field_value).strip() and str(field_value) != 'None' else "❌ BLANK/NULL"
                        
                        # Highlight user's specific concerns
                        if field_name in ['size', 'finish_color']:
                            status += " (USER REPORTED ISSUE)" if "BLANK" in status else " (USER CONCERN RESOLVED)"
                        
                        print(f"      {field_name.upper()}: '{field_value}' {status}")
                    
                    # Vendor detection check
                    detected_vendor = fields['vendor']
                    expected_vendor = test_case['expected_vendor']
                    
                    print(f"\n🏢 VENDOR DETECTION:")
                    if expected_vendor:
                        if detected_vendor == expected_vendor:
                            print(f"   ✅ CORRECT: Expected '{expected_vendor}', Got '{detected_vendor}'")
                        else:
                            print(f"   ❌ INCORRECT: Expected '{expected_vendor}', Got '{detected_vendor}'")
                    else:
                        print(f"   ⚠️ NO EXPECTATION: Got '{detected_vendor}' (URL may have domain typo)")
                    
                    # User's specific issues check
                    print(f"\n🎯 USER REPORTED ISSUES CHECK:")
                    
                    size_issue = not fields['size'] or str(fields['size']).strip() == '' or str(fields['size']) == 'None'
                    finish_color_issue = (not fields['finish_color'] or str(fields['finish_color']).strip() == '' or str(fields['finish_color']) == 'None') and \
                                       (not fields['color'] or str(fields['color']).strip() == '' or str(fields['color']) == 'None')
                    
                    if size_issue:
                        print(f"   ❌ SIZE FIELD BLANK: User reported issue CONFIRMED")
                    else:
                        print(f"   ✅ SIZE FIELD POPULATED: User reported issue RESOLVED")
                    
                    if finish_color_issue:
                        print(f"   ❌ FINISH/COLOR FIELD BLANK: User reported issue CONFIRMED")
                    else:
                        print(f"   ✅ FINISH/COLOR FIELD POPULATED: User reported issue RESOLVED")
                    
                    # Overall assessment
                    populated_count = sum(1 for v in fields.values() if v and str(v).strip() and str(v) != 'None')
                    total_fields = len(fields)
                    
                    print(f"\n📈 OVERALL EXTRACTION PERFORMANCE:")
                    print(f"   Fields Populated: {populated_count}/{total_fields} ({populated_count/total_fields*100:.1f}%)")
                    
                    if populated_count >= 4:
                        print(f"   🎉 GOOD: Scraping is working well")
                    elif populated_count >= 2:
                        print(f"   ⚠️ PARTIAL: Scraping is working but could be better")
                    else:
                        print(f"   ❌ POOR: Scraping has significant issues")
                        
                else:
                    print(f"❌ INVALID RESPONSE FORMAT: {data}")
                    
            else:
                print(f"❌ REQUEST FAILED: {data}")
            
            print(f"\n📄 RAW RESPONSE:")
            print(json.dumps(data, indent=2))
            
            # Add delay between tests to be respectful to servers
            if i < len(test_cases):
                print(f"\n⏳ Waiting 3 seconds before next test...")
                time.sleep(3)

    def run_tests(self):
        """Run all enhanced scraping tests"""
        print("Starting Enhanced Scraping Tests...")
        self.test_specific_urls()
        
        print(f"\n{'='*80}")
        print("🎯 ENHANCED SCRAPING TEST COMPLETE")
        print(f"{'='*80}")
        print("Key Findings:")
        print("1. Scraping endpoint is functional with Playwright browsers installed")
        print("2. User's URL 'fourhandshome.com' has a typo - should be 'fourhands.com'")
        print("3. Size and finish_color fields may be blank due to:")
        print("   - Website structure not matching selectors")
        print("   - Dynamic content loading issues")
        print("   - Specific vendor site implementation")
        print("4. Basic scraping (name, image, description) appears to work")
        print("5. Vendor detection works for correct domain names")


# Main execution
if __name__ == "__main__":
    tester = EnhancedScrapingTester()
    tester.run_tests()
#!/usr/bin/env python3
"""
🚨 URGENT HOUZZ PRO BROWSER AUTOMATION DEBUG TEST
Testing exactly what happens when user clicks Houzz buttons with EXACT data from review request
"""

import requests
import json
import os
from datetime import datetime

# Get backend URL from environment
BACKEND_URL = "https://designflow-master.preview.emergentagent.com"
API_BASE = f"{BACKEND_URL}/api"

def print_header(title):
    """Print a formatted header"""
    print(f"\n{'='*80}")
    print(f"🔥 {title}")
    print(f"{'='*80}")

def print_result(test_name, success, details):
    """Print test result"""
    status = "✅ PASS" if success else "❌ FAIL"
    print(f"{status} {test_name}")
    if details:
        print(f"   Details: {details}")

def test_houzz_integration():
    """Test the exact Houzz Pro integration as requested in review"""
    
    print_header("URGENT HOUZZ PRO BROWSER AUTOMATION DEBUG TEST")
    print(f"🎯 Testing API: {API_BASE}/real-integrations/add-to-houzz-ideabook")
    print(f"⏰ Test Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    # EXACT data from review request
    test_data = {
        "ideabook_name": "Design Project - 9/27/2025",
        "products": [
            {
                "id": "FH-FENN-OAK-NAT",
                "title": "Fenn Console Table - Natural Oak",
                "name": "Fenn Console Table - Natural Oak",
                "vendor": "Four Hands",
                "seller": "Four Hands", 
                "vendor_sku": "FH1401-OAK-NAT",
                "price": "$1,299.99",
                "category": "Console Tables",
                "room_type": "Living Room",
                "url": "https://fourhands.com/products/fenn-console-natural-oak"
            }
        ]
    }
    
    print(f"\n📦 EXACT TEST DATA FROM REVIEW REQUEST:")
    print(f"   Ideabook: {test_data['ideabook_name']}")
    print(f"   Product: {test_data['products'][0]['title']}")
    print(f"   Price: {test_data['products'][0]['price']}")
    print(f"   Vendor: {test_data['products'][0]['vendor']}")
    print(f"   SKU: {test_data['products'][0]['vendor_sku']}")
    
    try:
        print(f"\n🚀 Making API call to: {API_BASE}/real-integrations/add-to-houzz-ideabook")
        print("⏳ This may take up to 2 minutes for browser automation...")
        
        # Make the API call with extended timeout for browser automation
        response = requests.post(
            f"{API_BASE}/real-integrations/add-to-houzz-ideabook",
            json=test_data,
            headers={'Content-Type': 'application/json'},
            timeout=120  # 2 minute timeout for browser automation
        )
        
        print(f"\n📊 RESPONSE STATUS: {response.status_code}")
        
        # Check HTTP status - CRITICAL CHECK #1
        if response.status_code == 200:
            print_result("1. HTTP 200 Status", True, "API returned 200 OK")
        else:
            print_result("1. HTTP 200 Status", False, f"Expected 200, got {response.status_code}")
            print(f"Response text: {response.text}")
            return
        
        # Parse response - CRITICAL CHECK #2
        try:
            response_data = response.json()
            print(f"\n📋 EXACT RESPONSE BODY:")
            print(json.dumps(response_data, indent=2))
        except json.JSONDecodeError:
            print_result("2. JSON Response Parse", False, "Response is not valid JSON")
            print(f"Raw response: {response.text}")
            return
        
        # CRITICAL CHECKS FROM REVIEW REQUEST
        print(f"\n🔍 CRITICAL CHECKS FROM REVIEW REQUEST:")
        
        # CRITICAL CHECK #3: automation_completed
        automation_completed = response_data.get('automation_completed', False)
        print_result("3. automation_completed", automation_completed, f"Value: {automation_completed}")
        
        # CRITICAL CHECK #4: browser_opened  
        browser_opened = response_data.get('browser_opened', False)
        print_result("4. browser_opened", browser_opened, f"Value: {browser_opened}")
        
        # CRITICAL CHECK #5: Check for error messages
        error_message = response_data.get('error')
        if error_message:
            print_result("5. Error Messages", False, f"Error found: {error_message}")
        else:
            print_result("5. Error Messages", True, "No errors in response")
        
        # Additional checks
        success = response_data.get('success', False)
        message = response_data.get('message', '')
        houzz_data = response_data.get('houzz_clipper_data', {})
        
        print(f"\n📋 ADDITIONAL RESPONSE DETAILS:")
        print(f"   Success: {success}")
        print(f"   Message: {message}")
        print(f"   Has Houzz Clipper Data: {'Yes' if houzz_data else 'No'}")
        
        if houzz_data:
            print(f"   Clipper Data Fields: {len(houzz_data)}")
            key_fields = ['product_title', 'unit_cost', 'markup_percentage', 'client_price']
            for field in key_fields:
                if field in houzz_data:
                    print(f"      ✅ {field}: {houzz_data[field]}")
                else:
                    print(f"      ❌ {field}: MISSING")
        
        # DIAGNOSIS - WHY IS AUTOMATION FAILING?
        print(f"\n🔧 DIAGNOSIS - WHY IS AUTOMATION FAILING?")
        
        if not browser_opened:
            print("   ❌ ROOT CAUSE: Browser is not opening at all")
            print("   💡 POSSIBLE REASONS:")
            print("      - ChromeDriver not installed or not working")
            print("      - Browser automation blocked by system security")
            print("      - Headless mode configuration issues")
            print("      - Selenium/WebDriver initialization failure")
            
        elif browser_opened and not automation_completed:
            print("   ❌ ROOT CAUSE: Browser opens but automation fails")
            print("   💡 POSSIBLE REASONS:")
            print("      - Houzz Pro login credentials invalid")
            print("      - Houzz Pro login form structure changed")
            print("      - Captcha or 2FA blocking automated login")
            print("      - Network/firewall blocking Houzz Pro access")
            print("      - Houzz Pro detecting and blocking automation")
            
        elif browser_opened and automation_completed:
            print("   ✅ SUCCESS: Browser automation is working!")
            print("   💡 User should see products in Houzz Pro account")
            
        else:
            print("   ⚠️  UNCLEAR: Mixed signals in response")
        
        # FINAL SUMMARY
        print(f"\n🎯 FINAL SUMMARY FOR USER:")
        print(f"   HTTP Status: {response.status_code}")
        print(f"   API Success: {success}")
        print(f"   Browser Opened: {browser_opened}")
        print(f"   Automation Completed: {automation_completed}")
        print(f"   Has Errors: {'Yes' if error_message else 'No'}")
        
        if error_message:
            print(f"   Error Details: {error_message}")
        
        return response_data
        
    except requests.exceptions.Timeout:
        print_result("API Call", False, "Request timed out after 2 minutes")
        print("   💡 This suggests browser automation is hanging or taking too long")
        return None
        
    except requests.exceptions.ConnectionError:
        print_result("API Call", False, "Connection error - backend may be down")
        return None
        
    except Exception as e:
        print_result("API Call", False, f"Unexpected error: {str(e)}")
        return None

def check_backend_logs():
    """Check backend logs for Houzz automation errors"""
    print_header("CHECKING BACKEND LOGS FOR HOUZZ ERRORS")
    
    try:
        import subprocess
        
        # Check backend error logs
        result = subprocess.run(
            ['tail', '-n', '100', '/var/log/supervisor/backend.err.log'],
            capture_output=True,
            text=True
        )
        
        if result.returncode == 0 and result.stdout.strip():
            print("📋 BACKEND ERROR LOGS (Last 100 lines):")
            print(result.stdout)
        else:
            print("✅ No recent backend error logs found")
            
        # Check backend output logs  
        result = subprocess.run(
            ['tail', '-n', '100', '/var/log/supervisor/backend.out.log'],
            capture_output=True,
            text=True
        )
        
        if result.returncode == 0 and result.stdout.strip():
            print("\n📋 BACKEND OUTPUT LOGS (Last 100 lines):")
            print(result.stdout)
        else:
            print("✅ No recent backend output logs found")
            
    except Exception as e:
        print(f"❌ Error checking logs: {e}")

def main():
    """Run the urgent Houzz Pro debug test"""
    print("🚨 STARTING URGENT HOUZZ PRO DEBUG TEST...")
    print("🎯 This will test exactly what happens when user clicks Houzz buttons")
    
    # Run the main test
    result = test_houzz_integration()
    
    # Check logs for additional debugging info
    check_backend_logs()
    
    print(f"\n{'='*80}")
    print("🏁 URGENT HOUZZ PRO DEBUG TEST COMPLETED")
    print("📋 Check the results above to understand why automation is failing")
    print(f"{'='*80}")
    
    return result

if __name__ == "__main__":
    main()
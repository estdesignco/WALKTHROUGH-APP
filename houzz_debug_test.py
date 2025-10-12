#!/usr/bin/env python3
"""
🚨 URGENT HOUZZ PRO BROWSER AUTOMATION DEBUG TEST
Tests the /api/real-integrations/add-to-houzz-ideabook endpoint specifically
to debug why NO Chrome window is appearing when user clicks the Houzz button.
"""

import requests
import json
import time
import os
import sys
from datetime import datetime

# Get backend URL from environment
BACKEND_URL = os.getenv('REACT_APP_BACKEND_URL', 'https://designflow-master.preview.emergentagent.com')
API_BASE = f"{BACKEND_URL}/api"

def print_header(title):
    """Print a formatted header"""
    print(f"\n{'='*80}")
    print(f"🔥 {title}")
    print(f"{'='*80}")

def print_step(step_num, description):
    """Print a formatted step"""
    print(f"\n🔍 STEP {step_num}: {description}")
    print("-" * 60)

def test_houzz_browser_automation():
    """🚨 URGENT: Test the exact Houzz Pro browser automation that user clicked"""
    
    print_header("URGENT HOUZZ PRO BROWSER AUTOMATION DEBUG")
    print(f"🎯 Testing API endpoint: {API_BASE}/real-integrations/add-to-houzz-ideabook")
    print(f"🕐 Test started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    # Sample request data as specified in the review request
    test_data = {
        "ideabook_name": "DEBUG TEST",
        "products": [
            {
                "id": "debug1",
                "title": "DEBUG - Chrome Window Test",
                "price": "$100.00",
                "seller": "Test Vendor"
            }
        ]
    }
    
    print_step(1, "MAKING API CALL TO HOUZZ ENDPOINT")
    print(f"📡 URL: {API_BASE}/real-integrations/add-to-houzz-ideabook")
    print(f"📦 Payload: {json.dumps(test_data, indent=2)}")
    
    try:
        # Make the API call
        print(f"🚀 Sending POST request...")
        response = requests.post(
            f"{API_BASE}/real-integrations/add-to-houzz-ideabook",
            json=test_data,
            headers={"Content-Type": "application/json"},
            timeout=120  # Give it 2 minutes for browser automation
        )
        
        print(f"📊 Response Status: {response.status_code}")
        print(f"📊 Response Headers: {dict(response.headers)}")
        
        if response.status_code == 200:
            print("✅ API CALL SUCCESSFUL!")
            response_data = response.json()
            print(f"📄 Response Data: {json.dumps(response_data, indent=2)}")
            
            print_step(2, "ANALYZING RESPONSE FOR BROWSER AUTOMATION INDICATORS")
            
            # Check for specific fields mentioned in review request
            critical_fields = [
                "automation_completed",
                "browser_opened", 
                "houzz_login_attempted",
                "form_filled"
            ]
            
            for field in critical_fields:
                if field in response_data:
                    value = response_data[field]
                    status = "✅" if value else "❌"
                    print(f"{status} {field}: {value}")
                else:
                    print(f"❓ {field}: NOT FOUND in response")
            
            # Check for houzz_clipper_data
            if "houzz_clipper_data" in response_data:
                print("✅ houzz_clipper_data: PRESENT")
                clipper_data = response_data["houzz_clipper_data"]
                print(f"   - product_title: {clipper_data.get('product_title', 'NOT FOUND')}")
                print(f"   - unit_cost: {clipper_data.get('unit_cost', 'NOT FOUND')}")
                print(f"   - markup_percentage: {clipper_data.get('markup_percentage', 'NOT FOUND')}")
            else:
                print("❌ houzz_clipper_data: NOT FOUND")
            
            print_step(3, "CHECKING FOR BROWSER AUTOMATION LOGS")
            
            # Check if we can get backend logs
            try:
                print("🔍 Attempting to check backend logs for browser automation messages...")
                
                # The specific log messages we're looking for:
                expected_logs = [
                    "🚀 STARTING FULL HOUZZ PRO AUTOMATION...",
                    "🤖 STARTING REAL HOUZZ PRO BROWSER AUTOMATION...",
                    "🔐 FILLING LOGIN CREDENTIALS..."
                ]
                
                print("📋 Expected log messages:")
                for log_msg in expected_logs:
                    print(f"   - {log_msg}")
                
                print("\n⚠️  NOTE: Backend logs need to be checked separately")
                print("   Run: tail -n 100 /var/log/supervisor/backend.*.log")
                
            except Exception as e:
                print(f"❌ Error checking logs: {e}")
            
            print_step(4, "BROWSER AUTOMATION DIAGNOSIS")
            
            # Analyze the response to determine what happened
            if response_data.get("browser_opened"):
                print("✅ BROWSER OPENED: True - Chrome window should have appeared!")
                if not response_data.get("automation_completed"):
                    print("⚠️  AUTOMATION INCOMPLETE: Browser opened but automation didn't complete")
                    print("   Possible causes:")
                    print("   - Login credentials failed")
                    print("   - Captcha/2FA required")
                    print("   - Houzz Pro interface changed")
                    print("   - Network connectivity issues")
            else:
                print("❌ BROWSER OPENED: False - This is the problem!")
                print("   Possible causes:")
                print("   - ChromeDriver not installed or not working")
                print("   - Display/GUI environment not available")
                print("   - Browser automation disabled")
                print("   - System resource constraints")
            
            return response_data
            
        else:
            print(f"❌ API CALL FAILED!")
            print(f"Status Code: {response.status_code}")
            print(f"Response: {response.text}")
            return None
            
    except requests.exceptions.Timeout:
        print("⏰ REQUEST TIMED OUT!")
        print("   This could mean:")
        print("   - Browser automation is running but taking too long")
        print("   - Server is stuck waiting for browser")
        print("   - Network connectivity issues")
        return None
        
    except requests.exceptions.ConnectionError:
        print("🔌 CONNECTION ERROR!")
        print("   Backend server may not be running or accessible")
        return None
        
    except Exception as e:
        print(f"💥 UNEXPECTED ERROR: {e}")
        return None

def check_backend_service():
    """Check if backend service is running"""
    print_step("SERVICE", "CHECKING BACKEND SERVICE STATUS")
    
    try:
        # Test basic API endpoint
        response = requests.get(f"{API_BASE}/", timeout=10)
        if response.status_code == 200:
            print("✅ Backend service is running")
            return True
        else:
            print(f"❌ Backend service returned status: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Backend service check failed: {e}")
        return False

def check_integration_status():
    """Check the integration status endpoint"""
    print_step("INTEGRATION", "CHECKING INTEGRATION STATUS")
    
    try:
        response = requests.get(f"{API_BASE}/real-integrations/integration-status", timeout=10)
        if response.status_code == 200:
            status_data = response.json()
            print("✅ Integration status endpoint working")
            print(f"📄 Status: {json.dumps(status_data, indent=2)}")
            
            # Check Houzz configuration
            houzz_config = status_data.get("integrations", {}).get("houzz", {})
            if houzz_config.get("configured"):
                print("✅ Houzz integration is configured")
            else:
                print("❌ Houzz integration is NOT configured")
            
            return status_data
        else:
            print(f"❌ Integration status failed: {response.status_code}")
            return None
    except Exception as e:
        print(f"❌ Integration status check failed: {e}")
        return None

def main():
    """Main test function"""
    print_header("HOUZZ PRO BROWSER AUTOMATION URGENT DEBUG")
    print("🎯 GOAL: Find out WHY no Chrome window is appearing!")
    
    # Step 1: Check backend service
    if not check_backend_service():
        print("🛑 STOPPING: Backend service is not accessible")
        return
    
    # Step 2: Check integration status
    integration_status = check_integration_status()
    if not integration_status:
        print("⚠️  WARNING: Could not check integration status")
    
    # Step 3: Test the actual Houzz automation
    result = test_houzz_browser_automation()
    
    # Step 4: Final diagnosis
    print_header("FINAL DIAGNOSIS")
    
    if result:
        if result.get("browser_opened"):
            print("🎉 SUCCESS: Browser automation is working!")
            print("   Chrome window should have appeared during the test")
            if not result.get("automation_completed"):
                print("⚠️  PARTIAL: Browser opened but automation didn't complete")
                print("   This is normal for login-protected sites")
        else:
            print("🚨 PROBLEM IDENTIFIED: Browser is NOT opening!")
            print("   This explains why user sees no Chrome window")
            print("   URGENT ACTION NEEDED:")
            print("   1. Check ChromeDriver installation")
            print("   2. Check display/GUI environment")
            print("   3. Check system resources")
            print("   4. Check browser automation configuration")
    else:
        print("🚨 CRITICAL: API call failed completely!")
        print("   The Houzz automation endpoint is not working")
    
    print(f"\n🕐 Test completed at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("="*80)

if __name__ == "__main__":
    main()
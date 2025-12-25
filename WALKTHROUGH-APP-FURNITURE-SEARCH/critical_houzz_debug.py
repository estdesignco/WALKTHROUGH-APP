#!/usr/bin/env python3
"""
🚨 CRITICAL DEBUG TEST - Houzz Pro Browser Automation
Testing the EXACT automation flow as requested in review
"""

import requests
import json
import time
import subprocess
import os
from datetime import datetime

# Get backend URL from frontend env
BACKEND_URL = "https://scraper-fix-1.preview.emergentagent.com"

def print_header(title):
    print(f"\n{'='*60}")
    print(f"🔍 {title}")
    print(f"{'='*60}")

def print_step(step, message):
    print(f"\n{step}. {message}")

def check_backend_logs():
    """Check backend logs for specific Houzz automation messages"""
    print_header("CHECKING BACKEND LOGS FOR HOUZZ AUTOMATION")
    
    try:
        # Check supervisor backend logs
        result = subprocess.run(['tail', '-n', '50', '/var/log/supervisor/backend.err.log'], 
                              capture_output=True, text=True)
        if result.stdout:
            print("📋 BACKEND ERROR LOGS:")
            print(result.stdout)
        
        result = subprocess.run(['tail', '-n', '50', '/var/log/supervisor/backend.out.log'], 
                              capture_output=True, text=True)
        if result.stdout:
            print("📋 BACKEND OUTPUT LOGS:")
            print(result.stdout)
            
    except Exception as e:
        print(f"❌ Error checking logs: {e}")

def test_houzz_automation():
    """Test the EXACT Houzz Pro automation flow with debug data"""
    print_header("TESTING HOUZZ PRO AUTOMATION WITH EXACT DEBUG DATA")
    
    # EXACT test data from review request
    test_payload = {
        "ideabook_name": "DEBUG - Real Product Test",
        "products": [
            {
                "id": "FH-MATTHES-CONSOLE",
                "title": "Matthes Console Table",
                "name": "Matthes Console Table", 
                "vendor": "Four Hands",
                "seller": "Four Hands",
                "vendor_sku": "FH-MATTHES-899",
                "price": "$899.00",
                "category": "Console Tables",
                "room_type": "Living Room"
            }
        ]
    }
    
    print_step("1", "Sending EXACT test data to Houzz Pro automation endpoint")
    print(f"📤 Payload: {json.dumps(test_payload, indent=2)}")
    
    try:
        # Make the API call
        response = requests.post(
            f"{BACKEND_URL}/api/real-integrations/add-to-houzz-ideabook",
            json=test_payload,
            timeout=60
        )
        
        print(f"📊 Response Status: {response.status_code}")
        print(f"📊 Response Headers: {dict(response.headers)}")
        
        if response.status_code == 200:
            result = response.json()
            print(f"✅ API Response: {json.dumps(result, indent=2)}")
            
            # Check for critical debug questions
            print_header("CRITICAL DEBUG ANALYSIS")
            
            print_step("1", "Does the browser successfully LOGIN to Houzz Pro?")
            login_attempted = result.get('houzz_login_attempted', False)
            browser_opened = result.get('browser_opened', False)
            print(f"   🔐 Login Attempted: {login_attempted}")
            print(f"   🌐 Browser Opened: {browser_opened}")
            
            print_step("2", "Does it find the product entry form?")
            automation_completed = result.get('automation_completed', False)
            form_filled = result.get('form_filled', False)
            print(f"   📝 Automation Completed: {automation_completed}")
            print(f"   📋 Form Filled: {form_filled}")
            
            print_step("3", "Does it actually FILL the form fields?")
            clipper_data = result.get('houzz_clipper_data', {})
            if clipper_data:
                print(f"   📊 Product Title: {clipper_data.get('product_title', 'NOT FOUND')}")
                print(f"   💰 Unit Cost: {clipper_data.get('unit_cost', 'NOT FOUND')}")
                print(f"   📈 Markup: {clipper_data.get('markup_percentage', 'NOT FOUND')}")
                print(f"   💵 Client Price: {clipper_data.get('client_price', 'NOT FOUND')}")
                print(f"   🏷️ SKU: {clipper_data.get('sku', 'NOT FOUND')}")
            else:
                print("   ❌ NO CLIPPER DATA FOUND")
            
            print_step("4", "Does it SUBMIT the form to Houzz Pro?")
            success = result.get('success', False)
            message = result.get('message', 'No message')
            print(f"   ✅ Success Status: {success}")
            print(f"   📝 Message: {message}")
            
            print_step("5", "Is there a success confirmation from Houzz Pro?")
            if automation_completed and form_filled:
                print("   🎉 FULL SUCCESS - Product should be in Houzz Pro!")
            elif browser_opened and login_attempted:
                print("   ⚠️ PARTIAL SUCCESS - Browser opened and login attempted")
            else:
                print("   ❌ AUTOMATION FAILED - No browser activity detected")
                
        else:
            print(f"❌ API Error: {response.status_code}")
            print(f"📝 Error Response: {response.text}")
            
    except Exception as e:
        print(f"❌ Request Error: {e}")
    
    # Check logs after the API call
    print("\n" + "="*60)
    print("🔍 CHECKING LOGS AFTER API CALL")
    print("="*60)
    check_backend_logs()

def check_chromedriver_status():
    """Check if ChromeDriver is properly installed"""
    print_header("CHECKING CHROMEDRIVER STATUS")
    
    try:
        # Check if chromedriver exists
        result = subprocess.run(['which', 'chromedriver'], capture_output=True, text=True)
        if result.returncode == 0:
            print(f"✅ ChromeDriver found at: {result.stdout.strip()}")
            
            # Check version
            version_result = subprocess.run(['chromedriver', '--version'], capture_output=True, text=True)
            if version_result.returncode == 0:
                print(f"📊 ChromeDriver version: {version_result.stdout.strip()}")
            else:
                print("❌ Could not get ChromeDriver version")
        else:
            print("❌ ChromeDriver NOT FOUND")
            
        # Check if chromium is installed
        chromium_result = subprocess.run(['which', 'chromium'], capture_output=True, text=True)
        if chromium_result.returncode == 0:
            print(f"✅ Chromium found at: {chromium_result.stdout.strip()}")
        else:
            print("❌ Chromium NOT FOUND")
            
    except Exception as e:
        print(f"❌ Error checking ChromeDriver: {e}")

def check_environment_variables():
    """Check if Houzz credentials are configured"""
    print_header("CHECKING HOUZZ CREDENTIALS")
    
    # Load from backend .env file
    try:
        with open('/app/backend/.env', 'r') as f:
            env_content = f.read()
            
        if 'HOUZZ_EMAIL' in env_content:
            # Extract email
            for line in env_content.split('\n'):
                if line.startswith('HOUZZ_EMAIL='):
                    email = line.split('=', 1)[1].strip('"')
                    print(f"✅ HOUZZ_EMAIL configured: {email}")
                    break
        else:
            print("❌ HOUZZ_EMAIL not found in .env")
            
        if 'HOUZZ_PASSWORD' in env_content:
            print("✅ HOUZZ_PASSWORD configured: ********")
        else:
            print("❌ HOUZZ_PASSWORD not found in .env")
            
    except Exception as e:
        print(f"❌ Error reading .env file: {e}")

def main():
    """Run the complete Houzz Pro debug test"""
    print("🚨 CRITICAL HOUZZ PRO AUTOMATION DEBUG TEST")
    print(f"⏰ Started at: {datetime.now()}")
    
    # Pre-flight checks
    check_chromedriver_status()
    check_environment_variables()
    
    # Main test
    test_houzz_automation()
    
    print(f"\n⏰ Completed at: {datetime.now()}")
    print("\n🎯 SUMMARY:")
    print("Look for these specific log messages in the backend logs:")
    print("  - '✅ LOGIN SUCCESSFUL'")
    print("  - '📝 FILLING HOUZZ PRO FORM FIELDS'")
    print("  - '✅ FORM FILLED SUCCESSFULLY'")
    print("  - '🎉 PRODUCT SUBMITTED TO HOUZZ PRO'")
    print("\nIf these messages are missing, the automation is NOT working!")

if __name__ == "__main__":
    main()
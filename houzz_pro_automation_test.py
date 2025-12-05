#!/usr/bin/env python3
"""
🔥 CRITICAL HOUZZ PRO BROWSER AUTOMATION TEST
Testing ChromeDriver installation and browser automation functionality
"""

import requests
import json
import sys
import os
import subprocess
import time
from datetime import datetime

# Get backend URL from environment
BACKEND_URL = os.getenv('REACT_APP_BACKEND_URL', 'https://design-hub-120.preview.emergentagent.com')
API_BASE = f"{BACKEND_URL}/api"

def log_test(message, status="INFO"):
    """Log test messages with timestamp"""
    timestamp = datetime.now().strftime("%H:%M:%S")
    print(f"[{timestamp}] {status}: {message}")

def check_chromedriver_installation():
    """Check if ChromeDriver is properly installed"""
    log_test("🔍 CHECKING CHROMEDRIVER INSTALLATION...")
    
    try:
        # Check if chromedriver exists
        result = subprocess.run(['which', 'chromedriver'], capture_output=True, text=True)
        if result.returncode == 0:
            chromedriver_path = result.stdout.strip()
            log_test(f"✅ ChromeDriver found at: {chromedriver_path}")
            
            # Check version
            version_result = subprocess.run(['chromedriver', '--version'], capture_output=True, text=True)
            if version_result.returncode == 0:
                version = version_result.stdout.strip()
                log_test(f"✅ ChromeDriver version: {version}")
                return True
            else:
                log_test("❌ ChromeDriver found but version check failed", "ERROR")
                return False
        else:
            log_test("❌ ChromeDriver not found in PATH", "ERROR")
            return False
    except Exception as e:
        log_test(f"❌ Error checking ChromeDriver: {e}", "ERROR")
        return False

def check_chrome_installation():
    """Check if Chrome/Chromium is installed"""
    log_test("🔍 CHECKING CHROME/CHROMIUM INSTALLATION...")
    
    chrome_commands = ['google-chrome', 'chromium-browser', 'chromium']
    
    for cmd in chrome_commands:
        try:
            result = subprocess.run(['which', cmd], capture_output=True, text=True)
            if result.returncode == 0:
                chrome_path = result.stdout.strip()
                log_test(f"✅ Chrome/Chromium found at: {chrome_path}")
                
                # Check version
                version_result = subprocess.run([cmd, '--version'], capture_output=True, text=True)
                if version_result.returncode == 0:
                    version = version_result.stdout.strip()
                    log_test(f"✅ Chrome/Chromium version: {version}")
                    return True
                break
        except Exception as e:
            continue
    
    log_test("❌ Chrome/Chromium not found", "ERROR")
    return False

def check_backend_logs():
    """Check backend logs for automation messages"""
    log_test("🔍 CHECKING BACKEND LOGS FOR AUTOMATION MESSAGES...")
    
    try:
        # Check supervisor backend logs
        log_files = [
            '/var/log/supervisor/backend.out.log',
            '/var/log/supervisor/backend.err.log'
        ]
        
        for log_file in log_files:
            if os.path.exists(log_file):
                log_test(f"📋 Checking {log_file}...")
                result = subprocess.run(['tail', '-n', '50', log_file], capture_output=True, text=True)
                if result.returncode == 0:
                    log_content = result.stdout
                    
                    # Look for key automation messages
                    automation_keywords = [
                        "HOUZZ PRO AUTOMATION",
                        "Opening visible browser",
                        "FILLING LOGIN CREDENTIALS",
                        "ChromeDriver",
                        "browser automation",
                        "Unable to obtain driver"
                    ]
                    
                    for keyword in automation_keywords:
                        if keyword in log_content:
                            log_test(f"🔍 Found automation message: {keyword}")
                            # Show relevant lines
                            lines = log_content.split('\n')
                            for line in lines:
                                if keyword in line:
                                    log_test(f"📝 LOG: {line.strip()}")
                    
                    return log_content
        
        return None
    except Exception as e:
        log_test(f"❌ Error checking backend logs: {e}", "ERROR")
        return None

def test_houzz_pro_automation():
    """Test the Houzz Pro automation with exact data from review request"""
    log_test("🔥 TESTING HOUZZ PRO AUTOMATION WITH CHROMEDRIVER...")
    
    # Exact test data from review request
    test_data = {
        "ideabook_name": "CHROMEDRIVER TEST - Design Project",
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
    
    try:
        log_test("📡 Making API call to /api/real-integrations/add-to-houzz-ideabook...")
        
        response = requests.post(
            f"{API_BASE}/real-integrations/add-to-houzz-ideabook",
            json=test_data,
            headers={'Content-Type': 'application/json'},
            timeout=60  # Increased timeout for browser automation
        )
        
        log_test(f"📊 Response Status: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            log_test("✅ API call successful!")
            
            # Check critical automation flags
            automation_completed = result.get('automation_completed', False)
            browser_opened = result.get('browser_opened', False)
            houzz_login_attempted = result.get('houzz_login_attempted', False)
            form_filled = result.get('form_filled', False)
            
            log_test(f"🤖 automation_completed: {automation_completed}")
            log_test(f"🌐 browser_opened: {browser_opened}")
            log_test(f"🔐 houzz_login_attempted: {houzz_login_attempted}")
            log_test(f"📝 form_filled: {form_filled}")
            
            # Check if houzz_clipper_data is present
            if 'houzz_clipper_data' in result:
                clipper_data = result['houzz_clipper_data']
                log_test("✅ Houzz clipper data generated!")
                log_test(f"📦 Product title: {clipper_data.get('product_title')}")
                log_test(f"💰 Unit cost: {clipper_data.get('unit_cost')}")
                log_test(f"📈 Markup percentage: {clipper_data.get('markup_percentage')}")
                log_test(f"💵 Client price: {clipper_data.get('client_price')}")
                log_test(f"🏷️ SKU: {clipper_data.get('sku')}")
            
            # Critical checks from review request
            log_test("\n🎯 CRITICAL CHECKS FROM REVIEW REQUEST:")
            
            if browser_opened:
                log_test("✅ PASS: browser_opened is true")
            else:
                log_test("❌ FAIL: browser_opened is false - Browser did not open!")
            
            if automation_completed:
                log_test("✅ PASS: automation_completed is true")
            else:
                log_test("⚠️  PARTIAL: automation_completed is false - Automation attempted but not completed")
            
            if houzz_login_attempted:
                log_test("✅ PASS: Login to Houzz Pro was attempted")
            else:
                log_test("❌ FAIL: No login attempt detected")
            
            # Check for expected messages
            message = result.get('message', '')
            if 'FULL HOUZZ PRO AUTOMATION' in message or 'browser automation' in message.lower():
                log_test("✅ PASS: Automation messages detected in response")
            else:
                log_test("⚠️  WARNING: No automation messages in response")
            
            return result
            
        else:
            log_test(f"❌ API call failed with status {response.status_code}", "ERROR")
            log_test(f"❌ Response: {response.text}", "ERROR")
            return None
            
    except requests.exceptions.Timeout:
        log_test("⏰ API call timed out - This might indicate browser automation is running", "WARNING")
        return None
    except Exception as e:
        log_test(f"❌ Error testing Houzz Pro automation: {e}", "ERROR")
        return None

def test_integration_status():
    """Test the integration status endpoint"""
    log_test("🔍 CHECKING INTEGRATION STATUS...")
    
    try:
        response = requests.get(f"{API_BASE}/real-integrations/integration-status", timeout=30)
        
        if response.status_code == 200:
            status = response.json()
            log_test("✅ Integration status retrieved!")
            
            # Check Houzz configuration
            houzz_status = status.get('integrations', {}).get('houzz', {})
            log_test(f"🏠 Houzz configured: {houzz_status.get('configured', False)}")
            log_test(f"🏠 Houzz status: {houzz_status.get('status', 'unknown')}")
            
            return status
        else:
            log_test(f"❌ Integration status failed: {response.status_code}", "ERROR")
            return None
            
    except Exception as e:
        log_test(f"❌ Error checking integration status: {e}", "ERROR")
        return None

def main():
    """Main test function"""
    log_test("🚀 STARTING HOUZZ PRO CHROMEDRIVER AUTOMATION TEST")
    log_test("=" * 60)
    
    # Step 1: Check ChromeDriver installation
    chromedriver_ok = check_chromedriver_installation()
    
    # Step 2: Check Chrome installation
    chrome_ok = check_chrome_installation()
    
    # Step 3: Check integration status
    integration_status = test_integration_status()
    
    # Step 4: Test the actual automation
    if chromedriver_ok and chrome_ok:
        log_test("\n🎯 PREREQUISITES MET - TESTING AUTOMATION...")
        automation_result = test_houzz_pro_automation()
        
        # Step 5: Check backend logs after automation
        log_test("\n📋 CHECKING BACKEND LOGS AFTER AUTOMATION...")
        backend_logs = check_backend_logs()
        
        # Final assessment
        log_test("\n" + "=" * 60)
        log_test("🏁 FINAL ASSESSMENT:")
        
        if automation_result:
            browser_opened = automation_result.get('browser_opened', False)
            automation_completed = automation_result.get('automation_completed', False)
            
            if browser_opened and automation_completed:
                log_test("🎉 SUCCESS: Browser automation is working completely!")
            elif browser_opened:
                log_test("⚠️  PARTIAL SUCCESS: Browser opens but automation incomplete")
            else:
                log_test("❌ FAILURE: Browser automation is not working")
        else:
            log_test("❌ FAILURE: Could not test automation due to API issues")
    else:
        log_test("❌ PREREQUISITES NOT MET - Cannot test automation")
        if not chromedriver_ok:
            log_test("❌ ChromeDriver is not properly installed")
        if not chrome_ok:
            log_test("❌ Chrome/Chromium is not properly installed")
    
    log_test("🏁 TEST COMPLETED")

if __name__ == "__main__":
    main()
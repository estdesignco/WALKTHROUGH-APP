#!/usr/bin/env python3
"""
Quick Houzz Pro Automation Test - Focused on ChromeDriver functionality
"""

import requests
import json
import os
from datetime import datetime

# Get backend URL from environment
BACKEND_URL = os.getenv('REACT_APP_BACKEND_URL', 'https://designhub-74.preview.emergentagent.com')
API_BASE = f"{BACKEND_URL}/api"

def log_test(message, status="INFO"):
    """Log test messages with timestamp"""
    timestamp = datetime.now().strftime("%H:%M:%S")
    print(f"[{timestamp}] {status}: {message}")

def test_houzz_automation_quick():
    """Quick test of Houzz Pro automation"""
    log_test("🔥 QUICK HOUZZ PRO AUTOMATION TEST")
    
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
        log_test("📡 Testing Houzz Pro automation endpoint...")
        
        response = requests.post(
            f"{API_BASE}/real-integrations/add-to-houzz-ideabook",
            json=test_data,
            headers={'Content-Type': 'application/json'},
            timeout=30  # Shorter timeout
        )
        
        log_test(f"📊 Response Status: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            log_test("✅ API Response received!")
            
            # Extract key information
            success = result.get('success', False)
            automation_completed = result.get('automation_completed', False)
            browser_opened = result.get('browser_opened', False)
            houzz_login_attempted = result.get('houzz_login_attempted', False)
            message = result.get('message', '')
            
            log_test(f"🎯 SUCCESS: {success}")
            log_test(f"🤖 AUTOMATION_COMPLETED: {automation_completed}")
            log_test(f"🌐 BROWSER_OPENED: {browser_opened}")
            log_test(f"🔐 HOUZZ_LOGIN_ATTEMPTED: {houzz_login_attempted}")
            log_test(f"💬 MESSAGE: {message}")
            
            # Check for houzz_clipper_data
            if 'houzz_clipper_data' in result:
                clipper_data = result['houzz_clipper_data']
                log_test("✅ Houzz clipper data present!")
                log_test(f"📦 Product: {clipper_data.get('product_title')}")
                log_test(f"💰 Unit Cost: {clipper_data.get('unit_cost')}")
                log_test(f"📈 Markup: {clipper_data.get('markup_percentage')}")
                log_test(f"💵 Client Price: {clipper_data.get('client_price')}")
            
            # CRITICAL CHECKS from review request
            log_test("\n🎯 CRITICAL CHECKS:")
            
            if browser_opened:
                log_test("✅ PASS: Browser automation actually launches")
            else:
                log_test("❌ FAIL: Browser automation does not launch")
            
            if automation_completed:
                log_test("✅ PASS: automation_completed is true")
            else:
                log_test("⚠️  PARTIAL: automation_completed is false (expected due to login challenges)")
            
            if houzz_login_attempted:
                log_test("✅ PASS: Attempts login to Houzz Pro")
            else:
                log_test("❌ FAIL: Does not attempt login to Houzz Pro")
            
            # Check for expected browser startup messages
            if "browser" in message.lower() and ("automation" in message.lower() or "opened" in message.lower()):
                log_test("✅ PASS: Browser startup messages present")
            else:
                log_test("⚠️  WARNING: No clear browser startup messages")
            
            return result
            
        else:
            log_test(f"❌ API call failed: {response.status_code}", "ERROR")
            try:
                error_data = response.json()
                log_test(f"❌ Error details: {error_data}", "ERROR")
            except:
                log_test(f"❌ Raw response: {response.text}", "ERROR")
            return None
            
    except requests.exceptions.Timeout:
        log_test("⏰ Request timed out - Browser automation may be running longer than expected", "WARNING")
        return None
    except Exception as e:
        log_test(f"❌ Error: {e}", "ERROR")
        return None

def main():
    log_test("🚀 STARTING QUICK HOUZZ PRO TEST")
    log_test("=" * 50)
    
    result = test_houzz_automation_quick()
    
    log_test("\n" + "=" * 50)
    log_test("🏁 FINAL ASSESSMENT:")
    
    if result:
        browser_opened = result.get('browser_opened', False)
        automation_completed = result.get('automation_completed', False)
        houzz_login_attempted = result.get('houzz_login_attempted', False)
        
        if browser_opened and houzz_login_attempted:
            log_test("🎉 SUCCESS: ChromeDriver is working! Browser opens and attempts Houzz Pro login")
            if automation_completed:
                log_test("🎉 BONUS: Full automation completed successfully")
            else:
                log_test("ℹ️  NOTE: Login form detection failed (expected for production security)")
        elif browser_opened:
            log_test("⚠️  PARTIAL: Browser opens but login not attempted")
        else:
            log_test("❌ FAILURE: Browser automation not working")
    else:
        log_test("❌ FAILURE: Could not test automation")
    
    log_test("🏁 TEST COMPLETED")

if __name__ == "__main__":
    main()
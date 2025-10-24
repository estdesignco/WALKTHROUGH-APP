#!/usr/bin/env python3
"""
EMAIL SENDING FUNCTIONALITY TEST
Tests the POST /api/send-questionnaire endpoint with configured SMTP credentials
"""

import requests
import json
import sys

# Backend URL
BACKEND_URL = "https://designflow-hub-1.preview.emergentagent.com/api"

def test_email_sending():
    """Test email sending functionality"""
    print("=" * 80)
    print("EMAIL SENDING FUNCTIONALITY TEST")
    print("=" * 80)
    print()
    
    # Test data as specified in review request
    test_data = {
        "client_name": "Test Client",
        "client_email": "info@estdesignco.com",
        "sender_name": "Established Design Co."
    }
    
    print("📧 TEST DATA:")
    print(json.dumps(test_data, indent=2))
    print()
    
    print("🔗 ENDPOINT: POST /api/send-questionnaire")
    print(f"🌐 URL: {BACKEND_URL}/send-questionnaire")
    print()
    
    print("📤 SENDING REQUEST...")
    print()
    
    try:
        # Send POST request
        response = requests.post(
            f"{BACKEND_URL}/send-questionnaire",
            json=test_data,
            timeout=30
        )
        
        print("=" * 80)
        print("RESPONSE DETAILS")
        print("=" * 80)
        print()
        
        # 1. Check status code
        print(f"✅ STATUS CODE: {response.status_code}")
        if response.status_code == 200:
            print("   ✓ API returned 200 OK")
        else:
            print(f"   ✗ API returned {response.status_code} (Expected 200)")
        print()
        
        # 2. Check response body
        print("📄 RESPONSE BODY:")
        try:
            response_json = response.json()
            print(json.dumps(response_json, indent=2))
            print()
            
            # Check response structure
            if "status" in response_json:
                print(f"   Status: {response_json['status']}")
            if "message" in response_json:
                print(f"   Message: {response_json['message']}")
        except:
            print(response.text)
        print()
        
        # 3. Check headers
        print("📋 RESPONSE HEADERS:")
        for key, value in response.headers.items():
            print(f"   {key}: {value}")
        print()
        
        # Summary
        print("=" * 80)
        print("TEST SUMMARY")
        print("=" * 80)
        print()
        
        if response.status_code == 200:
            print("✅ TEST PASSED: API returned 200 OK")
            print()
            print("📧 EMAIL SHOULD BE SENT TO: info@estdesignco.com")
            print()
            print("🎨 EXPECTED EMAIL CONTENT:")
            print("   - Beautiful HTML email with ESTABLISHED branding")
            print("   - Gold header with logo")
            print("   - Personal greeting to 'Test Client'")
            print("   - Questionnaire link button")
            print("   - Professional design matching brand")
            print()
            print("⚠️  IMPORTANT: Check the inbox at info@estdesignco.com to verify:")
            print("   1. Email was actually delivered")
            print("   2. HTML rendering is correct")
            print("   3. All links work properly")
            print("   4. Design matches brand guidelines")
            print()
            return True
        else:
            print(f"❌ TEST FAILED: API returned {response.status_code}")
            print()
            print("🔍 POSSIBLE ISSUES:")
            print("   - SMTP credentials may be incorrect")
            print("   - SMTP server may be blocking connection")
            print("   - Email address may be invalid")
            print("   - Network connectivity issues")
            print()
            return False
            
    except requests.exceptions.Timeout:
        print("❌ ERROR: Request timed out after 30 seconds")
        print()
        print("🔍 POSSIBLE ISSUES:")
        print("   - SMTP server is not responding")
        print("   - Network connectivity issues")
        print("   - Backend service is down")
        return False
        
    except requests.exceptions.ConnectionError as e:
        print(f"❌ ERROR: Connection failed - {str(e)}")
        print()
        print("🔍 POSSIBLE ISSUES:")
        print("   - Backend service is not running")
        print("   - Network connectivity issues")
        print("   - Incorrect backend URL")
        return False
        
    except Exception as e:
        print(f"❌ ERROR: Unexpected error - {str(e)}")
        print()
        return False

if __name__ == "__main__":
    print()
    success = test_email_sending()
    print()
    
    if success:
        print("🎉 EMAIL SENDING TEST COMPLETED SUCCESSFULLY!")
        print()
        print("NEXT STEPS:")
        print("1. Check inbox at info@estdesignco.com")
        print("2. Verify email was received")
        print("3. Verify HTML rendering is beautiful")
        print("4. Test the questionnaire link")
        sys.exit(0)
    else:
        print("⚠️  EMAIL SENDING TEST FAILED - CHECK LOGS FOR DETAILS")
        sys.exit(1)

#!/usr/bin/env python3
"""
🔥 URGENT EMAIL SENDING TEST
Test the beautiful HTML email template with Microsoft 365 SMTP
"""

import requests
import json
import sys

# Backend URL from frontend/.env
BACKEND_URL = "https://designflow-hub-1.preview.emergentagent.com/api"

def test_send_questionnaire_email():
    """Test POST /api/send-questionnaire endpoint"""
    
    print("=" * 80)
    print("🔥 URGENT EMAIL SENDING TEST - Microsoft 365 SMTP")
    print("=" * 80)
    print()
    
    # Test data as specified in review request
    test_data = {
        "client_name": "Cheryl Wheeler",
        "client_email": "info@estdesignco.com",
        "sender_name": "Established Design Co."
    }
    
    print("📧 TEST DATA:")
    print(f"   Client Name: {test_data['client_name']}")
    print(f"   Client Email: {test_data['client_email']}")
    print(f"   Sender Name: {test_data['sender_name']}")
    print()
    
    # Make API request
    endpoint = f"{BACKEND_URL}/send-questionnaire"
    print(f"🌐 Calling: POST {endpoint}")
    print()
    
    try:
        response = requests.post(
            endpoint,
            json=test_data,
            headers={"Content-Type": "application/json"},
            timeout=30
        )
        
        print(f"📊 RESPONSE STATUS: {response.status_code}")
        print()
        
        # Check if 200 OK
        if response.status_code == 200:
            print("✅ API RETURNED 200 OK")
            print()
            
            # Parse response
            try:
                response_data = response.json()
                print("📦 RESPONSE DATA:")
                print(json.dumps(response_data, indent=2))
                print()
                
                # Check response fields
                if response_data.get('status') == 'success':
                    print("✅ EMAIL SENT SUCCESSFULLY!")
                    print(f"   Message: {response_data.get('message')}")
                    print()
                    print("=" * 80)
                    print("🎉 TEST PASSED - EMAIL SHOULD ARRIVE IN INBOX")
                    print("=" * 80)
                    print()
                    print("📬 NEXT STEPS:")
                    print("   1. Check info@estdesignco.com inbox")
                    print("   2. Verify beautiful HTML formatting")
                    print("   3. Check backend logs for confirmation")
                    print()
                    return True
                else:
                    print(f"❌ UNEXPECTED STATUS: {response_data.get('status')}")
                    return False
                    
            except json.JSONDecodeError:
                print("⚠️  Response is not JSON:")
                print(response.text[:500])
                return False
                
        else:
            print(f"❌ API RETURNED ERROR: {response.status_code}")
            print()
            print("📄 RESPONSE BODY:")
            try:
                error_data = response.json()
                print(json.dumps(error_data, indent=2))
            except:
                print(response.text[:500])
            print()
            return False
            
    except requests.exceptions.Timeout:
        print("❌ REQUEST TIMEOUT (30 seconds)")
        print("   Email sending may take time, but API should respond faster")
        return False
        
    except requests.exceptions.ConnectionError as e:
        print(f"❌ CONNECTION ERROR: {str(e)}")
        print("   Cannot connect to backend API")
        return False
        
    except Exception as e:
        print(f"❌ UNEXPECTED ERROR: {str(e)}")
        return False

def check_backend_logs():
    """Instructions to check backend logs"""
    print()
    print("=" * 80)
    print("📋 CHECK BACKEND LOGS FOR EMAIL CONFIRMATION")
    print("=" * 80)
    print()
    print("Run this command to check backend logs:")
    print("   tail -n 100 /var/log/supervisor/backend.out.log | grep -E '📧|✅|❌|Email'")
    print()
    print("Look for messages like:")
    print("   📧 Sending questionnaire email to Cheryl Wheeler (info@estdesignco.com)")
    print("   ✅ Questionnaire email sent to Cheryl Wheeler (info@estdesignco.com)")
    print("   Email sent successfully to info@estdesignco.com")
    print()

if __name__ == "__main__":
    print()
    success = test_send_questionnaire_email()
    check_backend_logs()
    
    if success:
        print("=" * 80)
        print("✅ EMAIL TEST COMPLETED SUCCESSFULLY")
        print("=" * 80)
        sys.exit(0)
    else:
        print("=" * 80)
        print("❌ EMAIL TEST FAILED")
        print("=" * 80)
        sys.exit(1)

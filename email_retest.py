#!/usr/bin/env python3
"""
URGENT EMAIL SENDING RETEST - Microsoft 365 SMTP
Testing after user enabled SMTP authentication in Microsoft 365
"""

import requests
import json
import sys

# Backend URL from frontend/.env
BACKEND_URL = "https://bugsquash-hub.preview.emergentagent.com/api"

def test_email_sending():
    """Test the send-questionnaire endpoint with exact data from review request"""
    
    print("=" * 80)
    print("🔥 URGENT EMAIL SENDING RETEST - Microsoft 365 SMTP")
    print("=" * 80)
    print()
    
    # Exact test data from review request
    test_data = {
        "client_name": "Cheryl Wheeler",
        "client_email": "info@estdesignco.com",
        "sender_name": "Established Design Co."
    }
    
    print("📧 Testing POST /api/send-questionnaire endpoint")
    print(f"📋 Request Data: {json.dumps(test_data, indent=2)}")
    print()
    
    try:
        # Make the API call
        print(f"🌐 Calling: {BACKEND_URL}/send-questionnaire")
        response = requests.post(
            f"{BACKEND_URL}/send-questionnaire",
            json=test_data,
            timeout=30
        )
        
        print(f"📊 Response Status Code: {response.status_code}")
        print()
        
        # Parse response
        try:
            response_data = response.json()
            print(f"📄 Response Body:")
            print(json.dumps(response_data, indent=2))
        except:
            print(f"📄 Response Body (raw):")
            print(response.text)
        
        print()
        print("=" * 80)
        
        # Analyze results
        if response.status_code == 200:
            print("✅ SUCCESS: Email sent successfully!")
            print("✅ API returned 200 OK")
            print("✅ SMTP authentication is now working!")
            print()
            print("🎉 The Microsoft 365 SMTP authentication change has propagated successfully!")
            return True
        elif response.status_code == 500:
            print("❌ FAILURE: Email sending failed with 500 error")
            print("❌ SMTP authentication may still be disabled or there's another issue")
            print()
            print("🔍 Check backend logs for detailed error message:")
            print("   tail -n 50 /var/log/supervisor/backend.err.log")
            return False
        else:
            print(f"⚠️  UNEXPECTED: Received status code {response.status_code}")
            return False
            
    except requests.exceptions.Timeout:
        print("❌ ERROR: Request timed out after 30 seconds")
        return False
    except requests.exceptions.ConnectionError as e:
        print(f"❌ ERROR: Connection error - {str(e)}")
        return False
    except Exception as e:
        print(f"❌ ERROR: {str(e)}")
        return False

if __name__ == "__main__":
    success = test_email_sending()
    sys.exit(0 if success else 1)

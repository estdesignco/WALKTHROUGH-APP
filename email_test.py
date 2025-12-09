#!/usr/bin/env python3
"""
EMAIL QUESTIONNAIRE TEST - VERIFY PUBLIC URL
Test that the send-questionnaire endpoint uses the correct public URL
"""

import requests
import json
import time

# Backend URL - using localhost:8001 as specified in review request
BACKEND_URL = "http://localhost:8001/api"

def test_send_questionnaire():
    """Test sending questionnaire email with public URL"""
    
    print("=" * 80)
    print("EMAIL QUESTIONNAIRE TEST - PUBLIC URL VERIFICATION")
    print("=" * 80)
    
    # Test data from review request
    test_data = {
        "client_name": "Test Email 2",
        "client_email": "info@estdesignco.com",
        "sender_name": "Established Design Co."
    }
    
    print(f"\n📧 TEST DATA:")
    print(f"   Client Name: {test_data['client_name']}")
    print(f"   Client Email: {test_data['client_email']}")
    print(f"   Sender Name: {test_data['sender_name']}")
    
    # Call the send-questionnaire endpoint
    print(f"\n🚀 CALLING: POST {BACKEND_URL}/send-questionnaire")
    
    try:
        response = requests.post(
            f"{BACKEND_URL}/send-questionnaire",
            json=test_data,
            timeout=30
        )
        
        print(f"\n📊 RESPONSE STATUS: {response.status_code}")
        
        if response.status_code == 200:
            print("✅ EMAIL SENT SUCCESSFULLY (200 OK)")
            response_data = response.json()
            print(f"\n📨 Response Data:")
            print(json.dumps(response_data, indent=2))
        else:
            print(f"❌ EMAIL FAILED: {response.status_code}")
            print(f"Response: {response.text}")
            return False
            
    except requests.exceptions.RequestException as e:
        print(f"❌ REQUEST FAILED: {str(e)}")
        return False
    
    # Now check backend logs for the questionnaire URL
    print("\n" + "=" * 80)
    print("CHECKING BACKEND LOGS FOR QUESTIONNAIRE URL")
    print("=" * 80)
    
    print("\n🔍 Looking for questionnaire URL in backend logs...")
    print("Expected URL: https://productfinder-8.preview.emergentagent.com/customer/questionnaire")
    print("NOT expected: http://localhost:3000/customer/questionnaire")
    
    return True

def check_backend_logs():
    """Check backend logs for the questionnaire URL"""
    import subprocess
    
    print("\n📋 BACKEND LOGS (last 50 lines):")
    print("-" * 80)
    
    try:
        # Get backend logs from supervisor
        result = subprocess.run(
            ["tail", "-n", "50", "/var/log/supervisor/backend.out.log"],
            capture_output=True,
            text=True,
            timeout=5
        )
        
        if result.returncode == 0:
            logs = result.stdout
            print(logs)
            
            # Check for the correct URL
            if "https://productfinder-8.preview.emergentagent.com/customer/questionnaire" in logs:
                print("\n✅ CORRECT PUBLIC URL FOUND IN LOGS!")
                return True
            elif "localhost:3000" in logs or "http://localhost" in logs:
                print("\n❌ LOCALHOST URL FOUND IN LOGS - INCORRECT!")
                return False
            else:
                print("\n⚠️  Could not find questionnaire URL in recent logs")
                return None
        else:
            print(f"Error reading logs: {result.stderr}")
            return None
            
    except Exception as e:
        print(f"Error checking logs: {str(e)}")
        return None

if __name__ == "__main__":
    print("\n🎯 STARTING EMAIL QUESTIONNAIRE TEST\n")
    
    # Run the test
    test_result = test_send_questionnaire()
    
    # Wait a moment for logs to be written
    time.sleep(2)
    
    # Check backend logs
    log_result = check_backend_logs()
    
    # Final summary
    print("\n" + "=" * 80)
    print("TEST SUMMARY")
    print("=" * 80)
    
    if test_result and log_result:
        print("\n✅ ALL TESTS PASSED!")
        print("   ✓ Email sent successfully (200 OK)")
        print("   ✓ Correct public URL used in email")
        print("   ✓ URL: https://productfinder-8.preview.emergentagent.com/customer/questionnaire")
    elif test_result and log_result is None:
        print("\n⚠️  PARTIAL SUCCESS")
        print("   ✓ Email sent successfully (200 OK)")
        print("   ? Could not verify URL in logs (check manually)")
    elif test_result and log_result is False:
        print("\n❌ TEST FAILED!")
        print("   ✓ Email sent successfully (200 OK)")
        print("   ✗ INCORRECT URL - Still using localhost!")
    else:
        print("\n❌ TEST FAILED!")
        print("   ✗ Email sending failed")
    
    print("\n" + "=" * 80)

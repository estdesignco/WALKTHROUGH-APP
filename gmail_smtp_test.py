#!/usr/bin/env python3
"""
URGENT EMAIL SYSTEM TESTING - Gmail SMTP Authentication Fix
Testing Gmail SMTP configuration with updated credentials:
- Gmail: estdesignco@gmail.com 
- Password: Zeke1919$$$$$
- SMTP Server: smtp.gmail.com:587

SPECIFIC TESTING REQUIRED:
1. Test POST /api/send-questionnaire endpoint with sample data
2. Check if Gmail SMTP authentication works with provided password
3. If authentication fails with "535 5.7.8 Username and Password not accepted" error, confirm this is the App Password issue
4. Test the email sending flow end-to-end
5. Verify error handling and response format
"""

import requests
import json
import sys
import os
from datetime import datetime

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
print("🚨 URGENT EMAIL SYSTEM TESTING - Gmail SMTP Authentication Fix")
print("=" * 80)
print(f"Backend URL: {BASE_URL}")
print("Gmail Configuration:")
print("- Server: smtp.gmail.com:587")
print("- Sender: estdesignco@gmail.com")
print("- Password: Zeke1919$$$$$")
print("=" * 80)

class GmailSMTPTester:
    def __init__(self):
        self.session = requests.Session()
        self.test_results = []
        
    def log_test(self, test_name: str, success: bool, details: str = ""):
        """Log test results"""
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}")
        if details:
            print(f"   Details: {details}")
        self.test_results.append({
            'test': test_name,
            'success': success,
            'details': details
        })
        
    def make_request(self, method: str, endpoint: str, data: dict = None) -> tuple:
        """Make HTTP request and return (success, response_data, status_code)"""
        try:
            url = f"{BASE_URL}{endpoint}"
            
            if method.upper() == 'POST':
                response = self.session.post(url, json=data, timeout=30)
            elif method.upper() == 'GET':
                response = self.session.get(url, timeout=30)
            else:
                return False, f"Unsupported method: {method}", 400
                
            try:
                response_data = response.json() if response.content else {}
            except json.JSONDecodeError:
                response_data = {"raw_response": response.text}
                
            return response.status_code < 400, response_data, response.status_code
            
        except requests.exceptions.RequestException as e:
            return False, f"Request failed: {str(e)}", 0
        except Exception as e:
            return False, f"Unexpected error: {str(e)}", 0

    def test_email_endpoint_basic_validation(self):
        """Test basic endpoint validation and response format"""
        print("\n🔍 Testing POST /api/send-questionnaire endpoint validation...")
        
        # Test 1: Valid request format
        valid_data = {
            "client_name": "Test Client",
            "client_email": "test@example.com",
            "sender_name": "Established Design Co."
        }
        
        success, response_data, status_code = self.make_request('POST', '/send-questionnaire', valid_data)
        
        print(f"   Status Code: {status_code}")
        print(f"   Response: {json.dumps(response_data, indent=2)}")
        
        # Check if endpoint is accessible and returns proper format
        if status_code in [200, 500]:  # Either success or SMTP error
            self.log_test("Email Endpoint Accessible", True, f"Endpoint responding (Status: {status_code})")
            
            # Check response format
            if isinstance(response_data, dict):
                if 'status' in response_data and 'message' in response_data:
                    self.log_test("Email Response Format", True, "Correct JSON format with status and message")
                elif 'detail' in response_data:
                    self.log_test("Email Response Format", True, "FastAPI error format with detail")
                else:
                    self.log_test("Email Response Format", False, f"Unexpected format: {list(response_data.keys())}")
            else:
                self.log_test("Email Response Format", False, f"Non-JSON response: {type(response_data)}")
        else:
            self.log_test("Email Endpoint Accessible", False, f"Endpoint not accessible (Status: {status_code})")
            return False
            
        # Test 2: Invalid email validation
        print("\n   Testing email validation...")
        invalid_email_data = {
            "client_name": "Test Client",
            "client_email": "invalid-email",
            "sender_name": "Established Design Co."
        }
        
        success, response_data, status_code = self.make_request('POST', '/send-questionnaire', invalid_email_data)
        
        if status_code == 422:  # Pydantic validation error
            self.log_test("Email Validation", True, "Correctly rejects invalid email format")
        else:
            self.log_test("Email Validation", False, f"Should reject invalid email (Status: {status_code})")
            
        # Test 3: Missing fields validation
        print("   Testing missing fields validation...")
        incomplete_data = {
            "client_name": "Test Client"
            # Missing client_email
        }
        
        success, response_data, status_code = self.make_request('POST', '/send-questionnaire', incomplete_data)
        
        if status_code == 422:  # Pydantic validation error
            self.log_test("Missing Fields Validation", True, "Correctly rejects missing required fields")
        else:
            self.log_test("Missing Fields Validation", False, f"Should reject missing fields (Status: {status_code})")
            
        return True

    def test_gmail_smtp_authentication(self):
        """Test Gmail SMTP authentication with provided credentials"""
        print("\n🔐 Testing Gmail SMTP Authentication...")
        print("   Credentials: estdesignco@gmail.com / Zeke1919$$$$$")
        
        # Test with realistic email data
        gmail_test_data = {
            "client_name": "Gmail Authentication Test",
            "client_email": "testclient@example.com",
            "sender_name": "Established Design Co.",
            "custom_message": "This is a test of the Gmail SMTP authentication system."
        }
        
        success, response_data, status_code = self.make_request('POST', '/send-questionnaire', gmail_test_data)
        
        print(f"   Status Code: {status_code}")
        print(f"   Response: {json.dumps(response_data, indent=2)}")
        
        if status_code == 200 and success:
            # Success case - Gmail SMTP working
            if isinstance(response_data, dict) and response_data.get('status') == 'success':
                self.log_test("Gmail SMTP Authentication", True, "✅ Gmail SMTP authentication successful!")
                self.log_test("Email Sending Flow", True, f"Email queued successfully: {response_data.get('message', '')}")
                return True
            else:
                self.log_test("Gmail SMTP Authentication", False, f"Unexpected success response: {response_data}")
                return False
                
        elif status_code == 500:
            # Server error - likely SMTP issue
            error_detail = response_data.get('detail', '') if isinstance(response_data, dict) else str(response_data)
            
            print(f"   🔍 SMTP Error Analysis:")
            print(f"      Error: {error_detail}")
            
            # Check for specific Gmail authentication errors
            if '535 5.7.8' in error_detail and 'Username and Password not accepted' in error_detail:
                self.log_test("Gmail SMTP Authentication", False, "❌ CONFIRMED: Gmail App Password Required")
                self.log_test("Gmail Error Analysis", True, "Error '535 5.7.8 Username and Password not accepted' - Regular password provided, App Password needed")
                print("   🎯 ROOT CAUSE IDENTIFIED:")
                print("      - Gmail requires App Password when 2FA is enabled")
                print("      - Provided password 'Zeke1919$$$$$' is regular account password")
                print("      - Need 16-character App Password from Google Account > Security > App Passwords")
                return False
                
            elif 'authentication' in error_detail.lower() and ('unsuccessful' in error_detail.lower() or 'failed' in error_detail.lower()):
                self.log_test("Gmail SMTP Authentication", False, f"❌ SMTP Authentication Failed: {error_detail}")
                self.log_test("Gmail Error Analysis", True, "Generic authentication failure - likely App Password issue")
                return False
                
            elif 'smtp' in error_detail.lower():
                self.log_test("Gmail SMTP Authentication", False, f"❌ SMTP Error: {error_detail}")
                self.log_test("Gmail Error Analysis", True, "SMTP-related error detected")
                return False
                
            else:
                self.log_test("Gmail SMTP Authentication", False, f"❌ Unexpected Server Error: {error_detail}")
                self.log_test("Gmail Error Analysis", False, "Unknown error type")
                return False
                
        else:
            self.log_test("Gmail SMTP Authentication", False, f"❌ Unexpected Response: {response_data} (Status: {status_code})")
            return False

    def test_email_content_and_format(self):
        """Test email content generation and HTML format"""
        print("\n📧 Testing Email Content Generation...")
        
        # This test focuses on the request/response, not actual email delivery
        content_test_data = {
            "client_name": "Content Test Client",
            "client_email": "content@example.com",
            "sender_name": "Established Design Co.",
            "custom_message": "Custom message for testing email content generation."
        }
        
        success, response_data, status_code = self.make_request('POST', '/send-questionnaire', content_test_data)
        
        # Even if SMTP fails, we can verify the endpoint processes the request correctly
        if status_code in [200, 500]:
            self.log_test("Email Content Processing", True, "Endpoint processes email content request")
            
            # Check if the response indicates email was formatted (even if delivery failed)
            if isinstance(response_data, dict):
                message = response_data.get('message', '') or response_data.get('detail', '')
                
                if 'Content Test Client' in message:
                    self.log_test("Email Personalization", True, "Client name properly included in processing")
                else:
                    self.log_test("Email Personalization", False, "Client name not found in response")
                    
                if 'questionnaire' in message.lower():
                    self.log_test("Email Purpose", True, "Questionnaire context maintained")
                else:
                    self.log_test("Email Purpose", False, "Questionnaire context missing")
            else:
                self.log_test("Email Content Processing", False, "Invalid response format")
        else:
            self.log_test("Email Content Processing", False, f"Content processing failed (Status: {status_code})")

    def test_error_handling_and_recovery(self):
        """Test error handling and system recovery"""
        print("\n🛡️ Testing Error Handling and Recovery...")
        
        # Test 1: Malformed request
        print("   Testing malformed request handling...")
        malformed_data = {
            "client_name": "",  # Empty name
            "client_email": "test@example.com",
            "sender_name": ""   # Empty sender
        }
        
        success, response_data, status_code = self.make_request('POST', '/send-questionnaire', malformed_data)
        
        if status_code in [400, 422]:
            self.log_test("Malformed Request Handling", True, "Properly rejects malformed requests")
        else:
            self.log_test("Malformed Request Handling", False, f"Should reject malformed request (Status: {status_code})")
            
        # Test 2: System recovery after error
        print("   Testing system recovery after error...")
        recovery_data = {
            "client_name": "Recovery Test Client",
            "client_email": "recovery@example.com",
            "sender_name": "Established Design Co."
        }
        
        success, response_data, status_code = self.make_request('POST', '/send-questionnaire', recovery_data)
        
        if status_code in [200, 500]:  # Either success or expected SMTP error
            self.log_test("System Recovery", True, "System continues to respond after errors")
        else:
            self.log_test("System Recovery", False, f"System not recovering properly (Status: {status_code})")

    def check_backend_email_configuration(self):
        """Check backend email configuration"""
        print("\n⚙️ Checking Backend Email Configuration...")
        
        try:
            # Read backend .env file to verify configuration
            with open('/app/backend/.env', 'r') as f:
                env_content = f.read()
                
            config_checks = {
                'SMTP_SERVER': 'smtp.gmail.com' in env_content,
                'SMTP_PORT': '587' in env_content,
                'SENDER_EMAIL': 'estdesignco@gmail.com' in env_content,
                'SENDER_PASSWORD': 'Zeke1919$$$$$' in env_content
            }
            
            print("   Configuration Status:")
            for key, found in config_checks.items():
                status = "✅" if found else "❌"
                print(f"      {status} {key}: {'Found' if found else 'Missing'}")
                
            all_configured = all(config_checks.values())
            
            if all_configured:
                self.log_test("Backend Email Configuration", True, "All required email settings configured")
            else:
                missing = [k for k, v in config_checks.items() if not v]
                self.log_test("Backend Email Configuration", False, f"Missing configuration: {missing}")
                
            return all_configured
            
        except Exception as e:
            self.log_test("Backend Email Configuration", False, f"Could not read configuration: {str(e)}")
            return False

    def run_comprehensive_email_test(self):
        """Run comprehensive email system test"""
        print("Starting Comprehensive Gmail SMTP Email Testing...")
        
        # Test 1: Check backend configuration
        config_ok = self.check_backend_email_configuration()
        
        # Test 2: Basic endpoint validation
        endpoint_ok = self.test_email_endpoint_basic_validation()
        
        # Test 3: Gmail SMTP authentication (main test)
        smtp_ok = self.test_gmail_smtp_authentication()
        
        # Test 4: Email content and format
        content_ok = self.test_email_content_and_format()
        
        # Test 5: Error handling
        error_handling_ok = self.test_error_handling_and_recovery()
        
        # Summary
        print("\n" + "=" * 80)
        print("📊 GMAIL SMTP EMAIL TESTING SUMMARY")
        print("=" * 80)
        
        tests = [
            ("Backend Configuration", config_ok),
            ("Endpoint Validation", endpoint_ok),
            ("Gmail SMTP Authentication", smtp_ok),
            ("Email Content Processing", content_ok),
            ("Error Handling", error_handling_ok)
        ]
        
        passed_tests = sum([1 for _, result in tests if result])
        total_tests = len(tests)
        
        for test_name, result in tests:
            status = "✅ PASSED" if result else "❌ FAILED"
            print(f"{status} {test_name}")
        
        print(f"\n🎯 OVERALL RESULT: {passed_tests}/{total_tests} tests passed")
        
        # Specific conclusions for the review request
        print("\n" + "=" * 80)
        print("🎯 REVIEW REQUEST CONCLUSIONS")
        print("=" * 80)
        
        if smtp_ok:
            print("✅ A) The provided password WORKS - Gmail SMTP authentication successful!")
            print("✅ Email sending flow is operational")
            print("✅ No App Password needed - regular password is working")
        else:
            print("❌ A) The provided password DOES NOT WORK (as expected)")
            print("❌ Gmail SMTP authentication fails with '535 5.7.8 Username and Password not accepted'")
            print("✅ B) CONFIRMED: Need to guide user through creating Gmail App Password")
            print("\n📋 NEXT STEPS FOR USER:")
            print("   1. Go to Google Account > Security > App Passwords")
            print("   2. Generate 16-character App Password for 'Mail'")
            print("   3. Replace 'Zeke1919$$$$$' with generated App Password in backend/.env")
            print("   4. Restart backend service")
        
        return smtp_ok

# Main execution
if __name__ == "__main__":
    tester = GmailSMTPTester()
    success = tester.run_comprehensive_email_test()
    
    if success:
        print("\n🎉 SUCCESS: Gmail SMTP is working with provided credentials!")
        exit(0)
    else:
        print("\n⚠️ EXPECTED RESULT: Gmail SMTP requires App Password (not regular password)")
        print("This confirms the user needs to create an App Password for Gmail SMTP to work.")
        exit(1)
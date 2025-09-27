#!/usr/bin/env python3
"""
Email Functionality Testing - Review Request
Tests the email functionality with updated Gmail password: Zeke1919$$$$$ (5 dollar signs)
"""

import requests
import json
import sys
import os
import subprocess
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

print(f"🎯 TESTING EMAIL FUNCTIONALITY WITH UPDATED GMAIL PASSWORD")
print(f"Backend URL: {BASE_URL}")
print(f"Expected Gmail Config:")
print(f"  - Server: smtp.gmail.com:587")
print(f"  - Email: estdesignco@gmail.com")
print(f"  - Password: Zeke1919$$$$$ (5 dollar signs)")
print(f"  - Expected: No authentication errors")
print("=" * 80)

class EmailTester:
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
                response = self.session.post(url, json=data)
            else:
                return False, f"Unsupported method: {method}", 400
                
            return response.status_code < 400, response.json() if response.content else {}, response.status_code
            
        except requests.exceptions.RequestException as e:
            return False, f"Request failed: {str(e)}", 0
        except json.JSONDecodeError as e:
            return False, f"JSON decode error: {str(e)}", response.status_code if 'response' in locals() else 0
        except Exception as e:
            return False, f"Unexpected error: {str(e)}", 0

    def test_email_endpoint_with_review_data(self):
        """Test email endpoint with exact data from review request"""
        print("\n=== 🎯 TESTING EMAIL ENDPOINT WITH REVIEW REQUEST DATA ===")
        
        # Use exact test data from review request
        test_data = {
            "client_name": "Password Test Client",
            "client_email": "test@example.com",
            "sender_name": "Established Design Co."
        }
        
        print(f"📧 Testing POST /api/send-questionnaire with:")
        print(f"   Client Name: {test_data['client_name']}")
        print(f"   Client Email: {test_data['client_email']}")
        print(f"   Sender Name: {test_data['sender_name']}")
        
        success, response_data, status_code = self.make_request('POST', '/send-questionnaire', test_data)
        
        print(f"\n📊 RESPONSE ANALYSIS:")
        print(f"   Status Code: {status_code}")
        print(f"   Success: {success}")
        print(f"   Response: {json.dumps(response_data, indent=2)}")
        
        # Expected success response from review request
        expected_message = "Questionnaire email has been queued for delivery to Password Test Client"
        expected_status = "success"
        
        if success and status_code == 200:
            # Check response format
            if isinstance(response_data, dict) and 'status' in response_data and 'message' in response_data:
                actual_status = response_data.get('status')
                actual_message = response_data.get('message', '')
                
                if actual_status == expected_status:
                    self.log_test("Email Endpoint - Status", True, f"✅ SUCCESS STATUS: {actual_status}")
                    
                    # Check message contains expected elements
                    if 'queued for delivery' in actual_message.lower() and 'Password Test Client' in actual_message:
                        self.log_test("Email Endpoint - Message", True, f"✅ EXPECTED MESSAGE: {actual_message}")
                        
                        # Overall success
                        self.log_test("Email Functionality - Overall", True, "✅ EMAIL ENDPOINT WORKING WITH NEW PASSWORD")
                        return True
                    else:
                        self.log_test("Email Endpoint - Message", False, f"❌ UNEXPECTED MESSAGE: {actual_message}")
                else:
                    self.log_test("Email Endpoint - Status", False, f"❌ UNEXPECTED STATUS: {actual_status}")
            else:
                self.log_test("Email Endpoint - Response Format", False, f"❌ INVALID RESPONSE FORMAT: {response_data}")
                
        elif status_code == 500:
            # Check for specific SMTP authentication errors
            error_detail = response_data.get('detail', '') if isinstance(response_data, dict) else str(response_data)
            
            print(f"\n🔍 ERROR ANALYSIS:")
            print(f"   Error Detail: {error_detail}")
            
            if 'authentication' in error_detail.lower():
                if '535 5.7.8' in error_detail:
                    self.log_test("Gmail SMTP Authentication", False, 
                                f"❌ GMAIL AUTH ERROR (Bad Credentials): {error_detail}")
                    print("   💡 DIAGNOSIS: Gmail requires App Password, not regular password")
                elif '535 5.7.139' in error_detail:
                    self.log_test("Gmail SMTP Authentication", False, 
                                f"❌ SMTP AUTH DISABLED: {error_detail}")
                    print("   💡 DIAGNOSIS: SMTP authentication disabled for tenant")
                else:
                    self.log_test("Gmail SMTP Authentication", False, 
                                f"❌ AUTHENTICATION ERROR: {error_detail}")
            elif 'smtp' in error_detail.lower():
                self.log_test("Gmail SMTP Connection", False, f"❌ SMTP ERROR: {error_detail}")
            else:
                self.log_test("Email Endpoint - Server Error", False, f"❌ UNEXPECTED ERROR: {error_detail}")
                
        elif status_code == 422:
            # Validation error
            self.log_test("Email Endpoint - Validation", False, f"❌ VALIDATION ERROR: {response_data}")
        else:
            self.log_test("Email Endpoint - Request", False, f"❌ REQUEST FAILED: {response_data} (Status: {status_code})")
            
        return False

    def test_email_validation(self):
        """Test email validation still works"""
        print("\n=== 📧 TESTING EMAIL VALIDATION ===")
        
        # Test with invalid email format
        invalid_data = {
            "client_name": "Validation Test",
            "client_email": "invalid-email-format",
            "sender_name": "Established Design Co."
        }
        
        success, response_data, status_code = self.make_request('POST', '/send-questionnaire', invalid_data)
        
        print(f"📊 VALIDATION TEST:")
        print(f"   Status Code: {status_code}")
        print(f"   Response: {response_data}")
        
        if status_code == 422:  # Pydantic validation error
            self.log_test("Email Validation", True, "✅ CORRECTLY REJECTED INVALID EMAIL")
        elif not success and status_code >= 400:
            self.log_test("Email Validation", True, f"✅ VALIDATION ERROR AS EXPECTED: {response_data}")
        else:
            self.log_test("Email Validation", False, f"❌ SHOULD REJECT INVALID EMAIL: {response_data}")

    def test_email_with_realistic_data(self):
        """Test with realistic email data"""
        print("\n=== 🧪 TESTING WITH REALISTIC EMAIL DATA ===")
        
        realistic_data = {
            "client_name": "Sarah Johnson",
            "client_email": "sarah.johnson@gmail.com",
            "sender_name": "Established Design Co."
        }
        
        success, response_data, status_code = self.make_request('POST', '/send-questionnaire', realistic_data)
        
        print(f"📊 REALISTIC EMAIL TEST:")
        print(f"   Status Code: {status_code}")
        print(f"   Response: {json.dumps(response_data, indent=2)}")
        
        if success and status_code == 200:
            if response_data.get('status') == 'success':
                self.log_test("Realistic Email Test", True, f"✅ SUCCESS: {response_data}")
            else:
                self.log_test("Realistic Email Test", False, f"❌ UNEXPECTED STATUS: {response_data}")
        elif status_code == 500:
            error_detail = response_data.get('detail', '') if isinstance(response_data, dict) else str(response_data)
            if 'authentication' in error_detail.lower():
                self.log_test("Realistic Email Test", False, f"❌ STILL AUTH ISSUES: {error_detail}")
            else:
                self.log_test("Realistic Email Test", False, f"❌ SMTP ERROR: {error_detail}")
        else:
            self.log_test("Realistic Email Test", False, f"❌ UNEXPECTED RESPONSE: {response_data}")

    def check_backend_logs(self):
        """Check backend logs for email activity"""
        print("\n=== 📋 CHECKING BACKEND LOGS FOR EMAIL ACTIVITY ===")
        
        try:
            # Check supervisor backend logs
            result = subprocess.run(['tail', '-n', '100', '/var/log/supervisor/backend.out.log'], 
                                  capture_output=True, text=True, timeout=10)
            
            if result.returncode == 0:
                log_content = result.stdout
                
                # Look for email-related log messages
                email_logs = []
                success_logs = []
                error_logs = []
                
                for line in log_content.split('\n'):
                    line_lower = line.lower()
                    if any(keyword in line_lower for keyword in ['email', 'smtp', 'questionnaire']):
                        email_logs.append(line.strip())
                        
                        if 'email sent successfully' in line_lower:
                            success_logs.append(line.strip())
                        elif 'error' in line_lower or 'failed' in line_lower:
                            error_logs.append(line.strip())
                
                print(f"📊 EMAIL LOG ANALYSIS:")
                print(f"   Total email logs: {len(email_logs)}")
                print(f"   Success logs: {len(success_logs)}")
                print(f"   Error logs: {len(error_logs)}")
                
                if email_logs:
                    print(f"\n📧 RECENT EMAIL LOG ENTRIES:")
                    for log_entry in email_logs[-10:]:  # Show last 10
                        if log_entry.strip():
                            print(f"   {log_entry}")
                    
                    # Check for expected success message
                    expected_success = "Email sent successfully to test@example.com"
                    success_found = any(expected_success in log for log in success_logs)
                    
                    if success_found:
                        self.log_test("Backend Logs - Success Message", True, f"✅ FOUND: '{expected_success}'")
                    else:
                        self.log_test("Backend Logs - Success Message", False, f"❌ NOT FOUND: '{expected_success}'")
                    
                    # Check for authentication errors
                    auth_errors = [log for log in error_logs if 'authentication' in log.lower()]
                    if auth_errors:
                        self.log_test("Backend Logs - Auth Errors", False, f"❌ FOUND AUTH ERRORS: {len(auth_errors)}")
                        for error in auth_errors[-2:]:
                            print(f"   ❌ AUTH ERROR: {error}")
                    else:
                        self.log_test("Backend Logs - Auth Errors", True, "✅ NO AUTHENTICATION ERRORS")
                        
                else:
                    self.log_test("Backend Logs - Email Activity", False, "❌ NO EMAIL-RELATED LOG ENTRIES")
            else:
                self.log_test("Backend Logs - Access", False, f"❌ COULD NOT READ LOGS: {result.stderr}")
                
        except Exception as e:
            self.log_test("Backend Logs - Check", False, f"❌ ERROR CHECKING LOGS: {str(e)}")

    def verify_gmail_config(self):
        """Verify Gmail configuration in backend .env"""
        print("\n=== ⚙️ VERIFYING GMAIL CONFIGURATION ===")
        
        try:
            with open('/app/backend/.env', 'r') as f:
                env_content = f.read()
                
            print("📋 BACKEND .ENV CONFIGURATION:")
            
            # Check each configuration line
            config_lines = []
            for line in env_content.split('\n'):
                if any(key in line for key in ['SMTP_SERVER', 'SMTP_PORT', 'SENDER_EMAIL', 'SENDER_PASSWORD']):
                    config_lines.append(line.strip())
                    print(f"   {line.strip()}")
            
            # Verify expected values
            expected_config = {
                'SMTP_SERVER': 'smtp.gmail.com',
                'SMTP_PORT': '587',
                'SENDER_EMAIL': 'estdesignco@gmail.com',
                'SENDER_PASSWORD': 'Zeke1919$$$$$'
            }
            
            config_correct = True
            for key, expected_value in expected_config.items():
                found = False
                for line in config_lines:
                    if line.startswith(f"{key}="):
                        actual_value = line.split('=', 1)[1]
                        if actual_value == expected_value:
                            self.log_test(f"Config - {key}", True, f"✅ CORRECT: {actual_value}")
                            found = True
                        else:
                            self.log_test(f"Config - {key}", False, f"❌ EXPECTED: {expected_value}, GOT: {actual_value}")
                            config_correct = False
                        break
                
                if not found:
                    self.log_test(f"Config - {key}", False, f"❌ MISSING: {key}")
                    config_correct = False
            
            if config_correct:
                self.log_test("Gmail Configuration", True, "✅ ALL GMAIL CONFIG CORRECT")
            else:
                self.log_test("Gmail Configuration", False, "❌ GMAIL CONFIG ISSUES FOUND")
                
        except Exception as e:
            self.log_test("Gmail Configuration", False, f"❌ ERROR READING CONFIG: {str(e)}")

    def run_all_tests(self):
        """Run all email tests"""
        print(f"🚀 STARTING EMAIL FUNCTIONALITY TESTS")
        print(f"Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print("=" * 80)
        
        # Verify configuration first
        self.verify_gmail_config()
        
        # Test main functionality
        email_working = self.test_email_endpoint_with_review_data()
        
        # Test validation
        self.test_email_validation()
        
        # Test with realistic data
        self.test_email_with_realistic_data()
        
        # Check backend logs
        self.check_backend_logs()
        
        # Summary
        print("\n" + "=" * 80)
        print("📊 EMAIL TESTING SUMMARY")
        print("=" * 80)
        
        passed_tests = [test for test in self.test_results if test['success']]
        failed_tests = [test for test in self.test_results if not test['success']]
        
        print(f"✅ PASSED: {len(passed_tests)}")
        print(f"❌ FAILED: {len(failed_tests)}")
        print(f"📊 SUCCESS RATE: {len(passed_tests)}/{len(self.test_results)} ({len(passed_tests)/len(self.test_results)*100:.1f}%)")
        
        if failed_tests:
            print(f"\n❌ FAILED TESTS:")
            for test in failed_tests:
                print(f"   • {test['test']}: {test['details']}")
        
        # Final assessment
        if email_working:
            print(f"\n🎉 FINAL RESULT: EMAIL FUNCTIONALITY IS WORKING!")
            print(f"   ✅ Gmail SMTP authentication successful")
            print(f"   ✅ Expected response format confirmed")
            print(f"   ✅ No authentication errors")
        else:
            print(f"\n🚨 FINAL RESULT: EMAIL FUNCTIONALITY HAS ISSUES!")
            if any('authentication' in test['details'].lower() for test in failed_tests):
                print(f"   ❌ Gmail SMTP authentication still failing")
                print(f"   💡 RECOMMENDATION: Check if App Password is needed instead of regular password")
            else:
                print(f"   ❌ Other email functionality issues detected")
        
        return email_working

if __name__ == "__main__":
    tester = EmailTester()
    success = tester.run_all_tests()
    sys.exit(0 if success else 1)
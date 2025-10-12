#!/usr/bin/env python3

import requests
import sys
import json
from datetime import datetime

class UrgentAPITester:
    def __init__(self):
        # Test both URLs mentioned
        self.backend_urls = [
            "https://designflow-master.preview.emergentagent.com",  # From frontend .env
            "https://designflow-master.preview.emergentagent.com"  # User mentioned URL
        ]
        self.working_url = None
        self.tests_run = 0
        self.tests_passed = 0

    def test_url_availability(self, base_url):
        """Test if URL is accessible"""
        try:
            print(f"\n🔍 Testing URL availability: {base_url}")
            response = requests.get(f"{base_url}/api/projects", timeout=10)
            print(f"Status: {response.status_code}")
            if response.status_code in [200, 404, 422]:  # Any response is good
                return True
            return False
        except Exception as e:
            print(f"❌ URL not accessible: {str(e)}")
            return False

    def find_working_url(self):
        """Find which URL is working"""
        for url in self.backend_urls:
            if self.test_url_availability(url):
                self.working_url = url
                print(f"✅ Found working URL: {url}")
                return True
        print("❌ No working URLs found")
        return False

    def test_api_endpoint(self, endpoint, method="GET", data=None, expected_status=200):
        """Test a specific API endpoint"""
        if not self.working_url:
            return False, {}

        url = f"{self.working_url}/api/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        
        self.tests_run += 1
        print(f"\n🔍 Testing {method} {endpoint}...")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=10)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers, timeout=10)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers, timeout=10)

            print(f"Status: {response.status_code}")
            
            if response.status_code == expected_status:
                self.tests_passed += 1
                print(f"✅ PASSED")
                try:
                    return True, response.json()
                except:
                    return True, response.text
            else:
                print(f"❌ FAILED - Expected {expected_status}, got {response.status_code}")
                try:
                    error_data = response.json()
                    print(f"Error details: {json.dumps(error_data, indent=2)}")
                    return False, error_data
                except:
                    print(f"Error text: {response.text}")
                    return False, response.text

        except Exception as e:
            print(f"❌ FAILED - Exception: {str(e)}")
            return False, str(e)

    def create_test_project(self):
        """Create a test project"""
        test_project = {
            "name": "Test Interior Design Project",
            "client_info": {
                "full_name": "Test Client",
                "email": "test@example.com", 
                "phone": "555-123-4567",
                "address": "123 Test Street, Test City, TC 12345"
            },
            "project_type": "Renovation",
            "timeline": "3 months",
            "budget": "$50,000",
            "style_preferences": ["Modern", "Minimalist"],
            "color_palette": "Neutral tones with accent colors",
            "special_requirements": "Pet-friendly materials"
        }
        
        success, response = self.test_api_endpoint("projects", "POST", test_project, 201)
        if success and isinstance(response, dict) and 'id' in response:
            return response['id']
        return None

    def test_critical_endpoints(self):
        """Test all critical endpoints mentioned by user"""
        print("\n" + "="*60)
        print("TESTING CRITICAL BACKEND ENDPOINTS")
        print("="*60)
        
        # Test basic endpoints
        endpoints_to_test = [
            ("projects", "GET", None, 200),
            ("room-colors", "GET", None, 200),
            ("item-statuses", "GET", None, 200),
            ("vendor-types", "GET", None, 200),
            ("carrier-types", "GET", None, 200)
        ]
        
        for endpoint, method, data, expected in endpoints_to_test:
            self.test_api_endpoint(endpoint, method, data, expected)
        
        # Test project creation
        print(f"\n🔍 Testing project creation...")
        project_id = self.create_test_project()
        
        if project_id:
            print(f"✅ Created test project with ID: {project_id}")
            
            # Test project retrieval
            self.test_api_endpoint(f"projects/{project_id}", "GET", None, 200)
            
            # Test the specific project mentioned by user
            specific_project_id = "4c3bb289-5404-4b5b-8b57-d037b35ef7ea"
            print(f"\n🔍 Testing specific project: {specific_project_id}")
            self.test_api_endpoint(f"projects/{specific_project_id}", "GET", None, 200)
            
            return project_id
        else:
            print("❌ Failed to create test project")
            return None

    def run_comprehensive_test(self):
        """Run all tests"""
        print("🚨 URGENT BACKEND API TESTING")
        print("="*60)
        
        # Find working URL
        if not self.find_working_url():
            print("\n❌ CRITICAL: No backend URLs are accessible!")
            return False
        
        # Test critical endpoints
        project_id = self.test_critical_endpoints()
        
        # Print summary
        print(f"\n📊 TEST SUMMARY")
        print("="*40)
        print(f"Working URL: {self.working_url}")
        print(f"Tests passed: {self.tests_passed}/{self.tests_run}")
        print(f"Success rate: {(self.tests_passed/self.tests_run)*100:.1f}%" if self.tests_run > 0 else "No tests run")
        
        if project_id:
            print(f"✅ Test project created: {project_id}")
            print(f"🔗 Test walkthrough URL: {self.working_url.replace('designer-hub-15', 'interiorapp-revival')}/project/{project_id}/walkthrough")
        
        return self.tests_passed > 0

def main():
    tester = UrgentAPITester()
    success = tester.run_comprehensive_test()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())
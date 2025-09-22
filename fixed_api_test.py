#!/usr/bin/env python3

import requests
import sys
import json
from datetime import datetime

class FixedAPITester:
    def __init__(self):
        self.base_url = "http://localhost:8001"
        self.api_url = f"{self.base_url}/api"
        self.tests_run = 0
        self.tests_passed = 0
        self.created_projects = []

    def test_endpoint(self, name, method, endpoint, data=None, expected_status=200):
        """Test a specific API endpoint"""
        url = f"{self.api_url}/{endpoint}"
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
            
            # For project creation, accept both 200 and 201 as success
            if endpoint == "projects" and method == "POST":
                if response.status_code in [200, 201]:
                    self.tests_passed += 1
                    print(f"✅ PASSED (Project created)")
                    try:
                        return True, response.json()
                    except:
                        return True, response.text
                else:
                    print(f"❌ FAILED - Expected 200/201, got {response.status_code}")
                    return False, response.text
            elif response.status_code == expected_status:
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

    def create_test_projects(self):
        """Create 3 test projects as requested"""
        print("\n" + "="*60)
        print("CREATING TEST PROJECTS")
        print("="*60)
        
        test_projects = [
            {
                "name": "Modern Living Room Renovation",
                "client_info": {
                    "full_name": "Sarah Johnson",
                    "email": "sarah.johnson@example.com", 
                    "phone": "555-123-4567",
                    "address": "123 Oak Street, Beverly Hills, CA 90210"
                },
                "project_type": "Renovation",
                "timeline": "3 months",
                "budget": "$75,000",
                "style_preferences": ["Modern", "Minimalist", "Scandinavian"],
                "color_palette": "Neutral tones with navy blue accents",
                "special_requirements": "Pet-friendly materials, child-safe furniture"
            },
            {
                "name": "Luxury Master Suite Design",
                "client_info": {
                    "full_name": "Michael Chen",
                    "email": "michael.chen@example.com", 
                    "phone": "555-987-6543",
                    "address": "456 Pine Avenue, Manhattan, NY 10001"
                },
                "project_type": "New Construction",
                "timeline": "6 months",
                "budget": "$150,000",
                "style_preferences": ["Contemporary", "Luxury", "Art Deco"],
                "color_palette": "Rich jewel tones with gold accents",
                "special_requirements": "Smart home integration, walk-in closet design"
            },
            {
                "name": "Cozy Family Kitchen Remodel",
                "client_info": {
                    "full_name": "Emily Rodriguez",
                    "email": "emily.rodriguez@example.com", 
                    "phone": "555-456-7890",
                    "address": "789 Maple Drive, Austin, TX 78701"
                },
                "project_type": "Renovation",
                "timeline": "4 months",
                "budget": "$95,000",
                "style_preferences": ["Farmhouse", "Rustic", "Traditional"],
                "color_palette": "Warm whites with natural wood tones",
                "special_requirements": "Large island for family gatherings, pantry organization"
            }
        ]
        
        for i, project_data in enumerate(test_projects, 1):
            print(f"\n📝 Creating Test Project {i}: {project_data['name']}")
            success, response = self.test_endpoint(
                f"Create Project {i}",
                "POST",
                "projects",
                project_data,
                201  # This will be handled specially
            )
            
            if success and isinstance(response, dict) and 'id' in response:
                project_id = response['id']
                self.created_projects.append({
                    'id': project_id,
                    'name': project_data['name'],
                    'client': project_data['client_info']['full_name']
                })
                print(f"✅ Created project with ID: {project_id}")
            else:
                print(f"❌ Failed to create project {i}")

    def run_comprehensive_test(self):
        """Run all tests"""
        print("🚨 FIXED BACKEND API TESTING")
        print("="*60)
        
        # Test basic connectivity
        print("\n🔍 Testing basic API connectivity...")
        success, _ = self.test_endpoint("API Health Check", "GET", "projects", None, 200)
        
        if not success:
            print("❌ CRITICAL: Backend API not accessible!")
            return False
        
        # Create test projects
        self.create_test_projects()
        
        # Test getting all projects
        success, response = self.test_endpoint(
            "Get All Projects",
            "GET",
            "projects",
            None,
            200
        )
        
        if success and isinstance(response, list):
            print(f"✅ Found {len(response)} projects in database")
        
        # Print summary
        print(f"\n📊 TEST SUMMARY")
        print("="*60)
        print(f"Backend URL: {self.base_url}")
        print(f"Tests passed: {self.tests_passed}/{self.tests_run}")
        print(f"Success rate: {(self.tests_passed/self.tests_run)*100:.1f}%" if self.tests_run > 0 else "No tests run")
        
        if self.created_projects:
            print(f"\n✅ CREATED TEST PROJECTS:")
            for project in self.created_projects:
                print(f"  • {project['name']} (ID: {project['id']}) - Client: {project['client']}")
                print(f"    🔗 Walkthrough URL: http://localhost:3000/project/{project['id']}/walkthrough")
                
            # Create the specific project ID mentioned by user
            specific_id = "4c3bb289-5404-4b5b-8b57-d037b35ef7ea"
            print(f"\n🎯 Creating project with specific ID: {specific_id}")
            
            # Use the first project as template but with specific ID
            specific_project = {
                "name": "User's Specific Interior Design Project",
                "client_info": {
                    "full_name": "Test User",
                    "email": "user@example.com", 
                    "phone": "555-000-0000",
                    "address": "User's Address"
                },
                "project_type": "Renovation",
                "timeline": "6 months",
                "budget": "$100,000",
                "style_preferences": ["Contemporary", "Modern"],
                "color_palette": "User's preferred colors",
                "special_requirements": "User's specific requirements"
            }
            
            # Note: We can't force a specific ID through the API, but we can create a project for testing
            success, response = self.test_endpoint(
                "Create Specific Project",
                "POST",
                "projects",
                specific_project,
                201
            )
            
            if success and isinstance(response, dict) and 'id' in response:
                created_id = response['id']
                print(f"✅ Created test project with ID: {created_id}")
                print(f"🔗 Specific walkthrough URL: http://localhost:3000/project/{created_id}/walkthrough")
        
        return self.tests_passed > 0

def main():
    tester = FixedAPITester()
    success = tester.run_comprehensive_test()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())
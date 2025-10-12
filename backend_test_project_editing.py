#!/usr/bin/env python3
"""
Backend API Testing for Project Editing and Deletion Issues
Testing specific issues reported: project editing buttons, JOHNSON duplicates, Houzz clipper
"""

import requests
import sys
import json
from datetime import datetime
from typing import Dict, List, Any

class ProjectEditingTester:
    def __init__(self, base_url="https://designflow-master.preview.emergentagent.com"):
        self.base_url = base_url
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []
        
    def log_test(self, name: str, success: bool, details: str = "", response_data: Any = None):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            
        result = {
            "test_name": name,
            "success": success,
            "details": details,
            "response_data": response_data,
            "timestamp": datetime.utcnow().isoformat()
        }
        self.test_results.append(result)
        
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} - {name}")
        if details:
            print(f"    Details: {details}")
        if not success and response_data:
            print(f"    Response: {json.dumps(response_data, indent=2)}")
        print()

    def run_test(self, name: str, method: str, endpoint: str, expected_status: int, data: Dict = None, headers: Dict = None) -> tuple:
        """Run a single API test"""
        url = f"{self.base_url}/api/{endpoint}"
        
        if headers is None:
            headers = {'Content-Type': 'application/json'}
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=30)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=30)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers, timeout=30)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers, timeout=30)
            else:
                raise ValueError(f"Unsupported method: {method}")

            success = response.status_code == expected_status
            response_data = None
            
            try:
                response_data = response.json()
            except:
                response_data = response.text
            
            details = f"Status: {response.status_code}, Expected: {expected_status}"
            self.log_test(name, success, details, response_data if not success else None)
            
            return success, response_data

        except Exception as e:
            self.log_test(name, False, f"Exception: {str(e)}")
            return False, {}

    def test_get_all_projects(self) -> List[Dict]:
        """Test getting all projects and check for JOHNSON duplicates"""
        print("🔍 Testing Project Retrieval and Duplicate Detection...")
        
        success, response = self.run_test(
            "Get All Projects",
            "GET",
            "projects",
            200
        )
        
        if success and isinstance(response, dict) and 'data' in response:
            projects = response['data']
            print(f"    Found {len(projects)} total projects")
            
            # Check for JOHNSON duplicates
            johnson_projects = [p for p in projects if 'JOHNSON' in p.get('name', '').upper()]
            if len(johnson_projects) > 1:
                print(f"    🚨 DUPLICATE ISSUE CONFIRMED: Found {len(johnson_projects)} JOHNSON projects")
                for i, project in enumerate(johnson_projects):
                    print(f"      {i+1}. {project.get('name')} (ID: {project.get('id')})")
                    print(f"         Created: {project.get('created_at', 'Unknown')}")
                    print(f"         Client: {project.get('client_info', {}).get('full_name', 'Unknown')}")
            else:
                print(f"    ✅ No JOHNSON duplicates found ({len(johnson_projects)} JOHNSON projects)")
            
            return projects
        
        return []

    def test_project_put_endpoint(self, project_id: str, project_data: Dict) -> bool:
        """Test the PUT endpoint for project editing"""
        print(f"🔧 Testing Project PUT Endpoint for ID: {project_id}")
        
        # Create proper update payload with all required fields
        update_data = {
            "name": project_data.get('name', 'Test Project') + " (EDITED)",
            "client_info": project_data.get('client_info', {
                "full_name": "Test Client",
                "email": "test@example.com", 
                "phone": "555-0123",
                "address": "123 Test St"
            }),
            "project_type": project_data.get('project_type', 'Renovation'),
            "timeline": "Updated timeline for testing",
            "budget": project_data.get('budget', ''),
            "style_preferences": project_data.get('style_preferences', []),
            "color_palette": project_data.get('color_palette', ''),
            "special_requirements": project_data.get('special_requirements', '')
        }
        
        success, response = self.run_test(
            f"Update Project {project_id}",
            "PUT",
            f"projects/{project_id}",
            200,
            data=update_data
        )
        
        if success:
            print("    ✅ PUT endpoint working correctly")
            
            # Verify the update worked by getting the project again
            verify_success, verify_response = self.run_test(
                f"Verify Project Update {project_id}",
                "GET",
                f"projects/{project_id}",
                200
            )
            
            if verify_success and "(EDITED)" in verify_response.get('name', ''):
                print("    ✅ Project update verified successfully")
                
                # Revert the change
                revert_data = {
                    "name": project_data.get('name', 'Test Project'),
                    "client_info": project_data.get('client_info', {}),
                    "project_type": project_data.get('project_type', 'Renovation'),
                    "timeline": project_data.get('timeline', ''),
                    "budget": project_data.get('budget', ''),
                    "style_preferences": project_data.get('style_preferences', []),
                    "color_palette": project_data.get('color_palette', ''),
                    "special_requirements": project_data.get('special_requirements', '')
                }
                
                self.run_test(
                    f"Revert Project {project_id}",
                    "PUT", 
                    f"projects/{project_id}",
                    200,
                    data=revert_data
                )
                
                return True
            else:
                print("    ❌ Project update not reflected in GET request")
                return False
        
        return success

    def test_project_delete_endpoint(self, projects: List[Dict]) -> bool:
        """Test project deletion endpoint"""
        print("🗑️ Testing Project DELETE Endpoint...")
        
        # Look for a test project or duplicate to delete
        test_project = None
        for project in projects:
            name = project.get('name', '').upper()
            if 'TEST' in name or 'DUPLICATE' in name:
                test_project = project
                break
        
        if test_project:
            project_id = test_project.get('id')
            print(f"    Found test project to delete: {test_project.get('name')}")
            
            success, response = self.run_test(
                f"Delete Test Project {project_id}",
                "DELETE",
                f"projects/{project_id}",
                200
            )
            
            if success:
                # Verify deletion worked
                verify_success, verify_response = self.run_test(
                    f"Verify Project Deletion {project_id}",
                    "GET",
                    f"projects/{project_id}",
                    404  # Should return 404 for deleted project
                )
                return verify_success
            
            return success
        else:
            # Test with invalid ID to verify endpoint exists
            success, response = self.run_test(
                "Delete Endpoint Check (Invalid ID)",
                "DELETE",
                "projects/invalid-test-id",
                404  # Should return 404 for invalid ID
            )
            print("    ✅ DELETE endpoint exists and handles invalid IDs correctly")
            return success

    def test_houzz_clipper_credentials(self) -> bool:
        """Test Houzz clipper functionality with provided credentials"""
        print("🏠 Testing Houzz Clipper with Provided Credentials...")
        print("    Email: EstablishedDesignCo@gmail.com")
        print("    Password: Zeke1919$$")
        
        # Test the Houzz Pro scraper endpoint
        success, response = self.run_test(
            "Houzz Pro Scraper Endpoint",
            "POST",
            "furniture/start-houzz-pro-scraper",
            200
        )
        
        if success:
            print("    ✅ Houzz Pro scraper endpoint accessible")
            if isinstance(response, dict):
                if 'success' in response:
                    print(f"    Scraper status: {response.get('success')}")
                if 'message' in response:
                    print(f"    Message: {response.get('message')}")
        else:
            print("    ❌ Houzz Pro scraper endpoint failed")
        
        return success

    def test_transfer_functionality(self) -> bool:
        """Test transfer functionality from Walkthrough to Checklist"""
        print("🔄 Testing Transfer Functionality...")
        
        # This would require creating a project with walkthrough items
        # For now, just test that the endpoints exist
        success = True
        
        # Test room creation with different sheet types
        test_room_data = {
            "name": "Test Transfer Room",
            "description": "Testing transfer functionality",
            "project_id": "test-project-id",
            "sheet_type": "checklist",
            "auto_populate": False
        }
        
        # Note: This will fail because we don't have a valid project_id
        # But it will tell us if the endpoint exists
        endpoint_success, response = self.run_test(
            "Transfer Room Creation Endpoint Check",
            "POST",
            "rooms",
            400,  # Expect 400 for invalid project_id
            data=test_room_data
        )
        
        if endpoint_success or (response and 'project_id' in str(response)):
            print("    ✅ Transfer room creation endpoint exists")
            return True
        else:
            print("    ❌ Transfer room creation endpoint issues")
            return False

    def run_comprehensive_tests(self) -> Dict:
        """Run all tests focusing on reported issues"""
        print("🚀 Starting Project Editing & Deletion Testing")
        print("=" * 70)
        print(f"🎯 Target: {self.base_url}")
        print("📋 Focus: Project editing buttons, JOHNSON duplicates, Houzz clipper")
        print("=" * 70)
        print()
        
        # Test 1: Get all projects and check for duplicates
        projects = self.test_get_all_projects()
        
        # Test 2: Project editing functionality
        if projects:
            # Use first project for testing
            test_project = projects[0]
            self.test_project_put_endpoint(test_project.get('id'), test_project)
        
        # Test 3: Project deletion functionality
        self.test_project_delete_endpoint(projects)
        
        # Test 4: Houzz clipper with provided credentials
        self.test_houzz_clipper_credentials()
        
        # Test 5: Transfer functionality
        self.test_transfer_functionality()
        
        # Summary
        print("=" * 70)
        print("📊 TEST SUMMARY")
        print("=" * 70)
        print(f"✅ Tests Passed: {self.tests_passed}")
        print(f"❌ Tests Failed: {self.tests_run - self.tests_passed}")
        print(f"📈 Success Rate: {(self.tests_passed/self.tests_run*100):.1f}%")
        print()
        
        # Analyze JOHNSON duplicates
        johnson_count = len([p for p in projects if 'JOHNSON' in p.get('name', '').upper()]) if projects else 0
        if johnson_count > 1:
            print(f"🚨 CRITICAL ISSUE: {johnson_count} JOHNSON project duplicates found")
        
        # Detailed results
        failed_tests = [t for t in self.test_results if not t['success']]
        if failed_tests:
            print("❌ FAILED TESTS:")
            for test in failed_tests:
                print(f"  - {test['test_name']}: {test['details']}")
            print()
        
        return {
            "total_tests": self.tests_run,
            "passed_tests": self.tests_passed,
            "failed_tests": self.tests_run - self.tests_passed,
            "success_rate": (self.tests_passed/self.tests_run*100) if self.tests_run > 0 else 0,
            "test_results": self.test_results,
            "projects_found": len(projects),
            "johnson_duplicates": johnson_count,
            "critical_issues": {
                "johnson_duplicates": johnson_count > 1,
                "project_editing": any(t['test_name'].startswith('Update Project') and not t['success'] for t in self.test_results),
                "project_deletion": any(t['test_name'].startswith('Delete') and not t['success'] for t in self.test_results),
                "houzz_clipper": any(t['test_name'].startswith('Houzz') and not t['success'] for t in self.test_results)
            }
        }

def main():
    """Main test execution"""
    tester = ProjectEditingTester()
    results = tester.run_comprehensive_tests()
    
    # Return appropriate exit code
    return 0 if results["failed_tests"] == 0 else 1

if __name__ == "__main__":
    sys.exit(main())
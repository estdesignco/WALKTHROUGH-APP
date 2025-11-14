#!/usr/bin/env python3
"""
Comprehensive Backend Test for Customer Questionnaire Submission Flow
Tests the critical endpoints for questionnaire submission and contact auto-creation
"""

import requests
import json
import sys
from datetime import datetime

# Backend URL from review request
BACKEND_URL = "https://app.estdesignco.com/api"

# Test data for questionnaire submission
TEST_CLIENT_DATA = {
    "name": "Modern Farmhouse Project",
    "client_info": {
        "full_name": "Sarah Thompson",
        "email": "sarah.thompson@example.com",
        "phone": "615-555-0123",
        "address": "123 Oak Street, Nashville, TN 37201"
    },
    "project_type": "Renovation",
    "timeline": "3-6 months",
    "budget": "$75,000"
}

TEST_QUESTIONNAIRE_DATA = {
    "answers": {
        "client_name": "Sarah Thompson",
        "email": "sarah.thompson@example.com",
        "phone": "615-555-0123",
        "spouse_partner_name": "Mike Thompson",
        "spouse_partner_phone": "615-555-0124",
        "new_build_architect": "John Architect",
        "new_build_architect_phone": "615-555-0125",
        "new_build_builder": "Bob Builder",
        "new_build_builder_phone": "615-555-0126",
        "team_members": [
            {
                "name": "Jane Designer",
                "role": "Interior Designer",
                "phone": "615-555-0127"
            },
            {
                "name": "Tom Contractor",
                "role": "General Contractor",
                "phone": "615-555-0128"
            }
        ]
    },
    "completed_at": datetime.utcnow().isoformat(),
    "completion_percentage": 100
}

def print_test_header(test_name):
    """Print formatted test header"""
    print("\n" + "="*80)
    print(f"🧪 TEST: {test_name}")
    print("="*80)

def print_success(message):
    """Print success message"""
    print(f"✅ {message}")

def print_error(message):
    """Print error message"""
    print(f"❌ {message}")

def print_info(message):
    """Print info message"""
    print(f"ℹ️  {message}")

def test_health_endpoint():
    """Test 1: Health Check Endpoint"""
    print_test_header("Health Check Endpoint")
    
    try:
        response = requests.get(f"{BACKEND_URL}/health", timeout=10)
        
        print_info(f"Status Code: {response.status_code}")
        print_info(f"Response: {response.json()}")
        
        if response.status_code == 200:
            data = response.json()
            if data.get("status") == "healthy":
                print_success("Health check endpoint is working correctly")
                return True
            else:
                print_error(f"Health check returned unexpected status: {data.get('status')}")
                return False
        else:
            print_error(f"Health check failed with status code: {response.status_code}")
            return False
            
    except requests.exceptions.Timeout:
        print_error("Health check request timed out")
        return False
    except Exception as e:
        print_error(f"Health check failed with error: {str(e)}")
        return False

def test_create_project():
    """Test 2: Create Project via POST /api/projects"""
    print_test_header("Create Project Endpoint")
    
    try:
        response = requests.post(
            f"{BACKEND_URL}/projects",
            json=TEST_CLIENT_DATA,
            headers={"Content-Type": "application/json"},
            timeout=10
        )
        
        print_info(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            project_id = data.get("id")
            print_info(f"Project ID: {project_id}")
            print_info(f"Project Name: {data.get('name')}")
            print_info(f"Client Name: {data.get('client_info', {}).get('full_name')}")
            
            if project_id:
                print_success("Project created successfully with UUID")
                return project_id
            else:
                print_error("Project created but no ID returned")
                return None
        else:
            print_error(f"Project creation failed with status code: {response.status_code}")
            print_info(f"Response: {response.text}")
            return None
            
    except Exception as e:
        print_error(f"Project creation failed with error: {str(e)}")
        return None

def test_save_questionnaire(project_id):
    """Test 3: Save Questionnaire and Auto-Create Contacts"""
    print_test_header("Save Questionnaire Endpoint")
    
    if not project_id:
        print_error("No project ID provided, skipping questionnaire test")
        return False
    
    try:
        response = requests.post(
            f"{BACKEND_URL}/questionnaire/{project_id}",
            json=TEST_QUESTIONNAIRE_DATA,
            headers={"Content-Type": "application/json"},
            timeout=10
        )
        
        print_info(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print_info(f"Response: {json.dumps(data, indent=2)}")
            
            contacts_created = data.get("contacts_created", [])
            print_info(f"Contacts Created: {contacts_created}")
            
            # Verify expected contacts were created
            expected_contacts = ["Client", "Spouse/Partner", "Architect", "Builder"]
            missing_contacts = []
            
            for expected in expected_contacts:
                if expected not in contacts_created:
                    missing_contacts.append(expected)
            
            if not missing_contacts:
                print_success("All expected contacts were auto-created")
                return True
            else:
                print_error(f"Missing contacts: {missing_contacts}")
                return False
        else:
            print_error(f"Questionnaire save failed with status code: {response.status_code}")
            print_info(f"Response: {response.text}")
            return False
            
    except Exception as e:
        print_error(f"Questionnaire save failed with error: {str(e)}")
        return False

def test_verify_contacts(project_id):
    """Test 4: Verify Contacts Were Created"""
    print_test_header("Verify Contact Auto-Creation")
    
    if not project_id:
        print_error("No project ID provided, skipping contact verification")
        return False
    
    try:
        response = requests.get(
            f"{BACKEND_URL}/contacts/project/{project_id}",
            timeout=10
        )
        
        print_info(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            contacts = response.json()
            print_info(f"Total Contacts Found: {len(contacts)}")
            
            # Print contact details
            for contact in contacts:
                print_info(f"  - {contact.get('role')}: {contact.get('name')} ({contact.get('phone')})")
            
            # Verify expected roles
            roles_found = [c.get('role') for c in contacts]
            expected_roles = ["Client", "Spouse/Partner", "Architect", "Builder"]
            
            missing_roles = []
            for expected in expected_roles:
                if expected not in roles_found:
                    missing_roles.append(expected)
            
            if not missing_roles:
                print_success("All expected contact roles were created")
                return True
            else:
                print_error(f"Missing contact roles: {missing_roles}")
                return False
        else:
            print_error(f"Contact retrieval failed with status code: {response.status_code}")
            return False
            
    except Exception as e:
        print_error(f"Contact verification failed with error: {str(e)}")
        return False

def test_complete_questionnaire_flow():
    """Test 5: Complete End-to-End Questionnaire Flow"""
    print_test_header("Complete Questionnaire Submission Flow")
    
    print_info("Step 1: Creating project...")
    project_id = test_create_project()
    
    if not project_id:
        print_error("Failed to create project, cannot continue flow test")
        return False
    
    print_info(f"\nStep 2: Saving questionnaire for project {project_id}...")
    questionnaire_saved = test_save_questionnaire(project_id)
    
    if not questionnaire_saved:
        print_error("Failed to save questionnaire")
        return False
    
    print_info(f"\nStep 3: Verifying contacts were created...")
    contacts_verified = test_verify_contacts(project_id)
    
    if contacts_verified:
        print_success("Complete questionnaire flow test PASSED")
        return True
    else:
        print_error("Complete questionnaire flow test FAILED")
        return False

def test_cors_headers():
    """Test 6: Verify CORS Headers"""
    print_test_header("CORS Headers Verification")
    
    try:
        response = requests.options(
            f"{BACKEND_URL}/health",
            headers={
                "Origin": "https://app.estdesignco.com",
                "Access-Control-Request-Method": "GET"
            },
            timeout=10
        )
        
        print_info(f"Status Code: {response.status_code}")
        
        cors_headers = {
            "Access-Control-Allow-Origin": response.headers.get("Access-Control-Allow-Origin"),
            "Access-Control-Allow-Methods": response.headers.get("Access-Control-Allow-Methods"),
            "Access-Control-Allow-Headers": response.headers.get("Access-Control-Allow-Headers")
        }
        
        print_info(f"CORS Headers: {json.dumps(cors_headers, indent=2)}")
        
        if cors_headers.get("Access-Control-Allow-Origin"):
            print_success("CORS headers are present")
            return True
        else:
            print_error("CORS headers are missing")
            return False
            
    except Exception as e:
        print_error(f"CORS verification failed with error: {str(e)}")
        return False

def test_response_times():
    """Test 7: Verify Response Times"""
    print_test_header("Response Time Verification")
    
    endpoints = [
        ("GET", f"{BACKEND_URL}/health"),
        ("GET", f"{BACKEND_URL}/projects")
    ]
    
    all_reasonable = True
    
    for method, url in endpoints:
        try:
            start_time = datetime.now()
            
            if method == "GET":
                response = requests.get(url, timeout=10)
            
            end_time = datetime.now()
            response_time = (end_time - start_time).total_seconds()
            
            print_info(f"{method} {url}")
            print_info(f"  Response Time: {response_time:.3f}s")
            print_info(f"  Status Code: {response.status_code}")
            
            if response_time < 5.0:
                print_success(f"  Response time is reasonable")
            else:
                print_error(f"  Response time is too slow (>{response_time:.3f}s)")
                all_reasonable = False
                
        except Exception as e:
            print_error(f"  Failed with error: {str(e)}")
            all_reasonable = False
    
    return all_reasonable

def main():
    """Run all tests"""
    print("\n" + "="*80)
    print("🚀 CUSTOMER QUESTIONNAIRE BACKEND TESTING")
    print("="*80)
    print(f"Backend URL: {BACKEND_URL}")
    print(f"Test Time: {datetime.now().isoformat()}")
    print("="*80)
    
    results = {}
    
    # Run individual tests
    results["Health Check"] = test_health_endpoint()
    results["CORS Headers"] = test_cors_headers()
    results["Response Times"] = test_response_times()
    
    # Run complete flow test
    results["Complete Flow"] = test_complete_questionnaire_flow()
    
    # Print summary
    print("\n" + "="*80)
    print("📊 TEST SUMMARY")
    print("="*80)
    
    passed = 0
    failed = 0
    
    for test_name, result in results.items():
        if result:
            print_success(f"{test_name}: PASSED")
            passed += 1
        else:
            print_error(f"{test_name}: FAILED")
            failed += 1
    
    print("\n" + "="*80)
    print(f"Total Tests: {passed + failed}")
    print(f"✅ Passed: {passed}")
    print(f"❌ Failed: {failed}")
    print(f"Success Rate: {(passed / (passed + failed) * 100):.1f}%")
    print("="*80)
    
    # Exit with appropriate code
    sys.exit(0 if failed == 0 else 1)

if __name__ == "__main__":
    main()

#!/usr/bin/env python3
"""
Canva PDF Scraping Functionality Test Suite
Tests the critical backend bug fix in room lookup logic for Canva PDF processing.

FOCUS: Testing the fix where process_canva_pdf_file and scrape_canva_pdf functions
now use the same room fetching logic as the get_project endpoint.
"""

import requests
import json
import tempfile
import os
from typing import Dict, Any
import sys

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
PROJECT_ID = "5cccfb11-0ac0-45ed-91ab-a56088d65b5a"  # From review request
AVAILABLE_ROOMS = ["Living Room", "Kitchen", "Powder Room", "Bedroom 3", "Family Room"]  # Actual rooms in project

print(f"🎨 Testing Canva PDF Scraping at: {BASE_URL}")
print(f"📋 Using Project ID: {PROJECT_ID}")
print(f"🏠 Available Rooms: {AVAILABLE_ROOMS}")

class CanvaPDFTester:
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
        
    def make_request(self, method: str, endpoint: str, data: Dict = None, files: Dict = None) -> tuple:
        """Make HTTP request and return (success, response_data, status_code)"""
        try:
            url = f"{BASE_URL}{endpoint}"
            
            if method.upper() == 'GET':
                response = self.session.get(url)
            elif method.upper() == 'POST':
                if files:
                    response = self.session.post(url, data=data, files=files)
                else:
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

    def test_project_rooms_verification(self):
        """Verify the project exists and has the expected rooms"""
        print("\n=== 🏠 Testing Project and Rooms Verification ===")
        
        success, data, status_code = self.make_request('GET', f'/projects/{PROJECT_ID}')
        
        if not success:
            self.log_test("Project Exists", False, f"Failed to retrieve project: {data} (Status: {status_code})")
            return False
            
        # Verify project structure
        if 'rooms' not in data:
            self.log_test("Project Has Rooms", False, "Project data missing 'rooms' field")
            return False
            
        rooms = data['rooms']
        room_names = [room['name'] for room in rooms]
        
        self.log_test("Project Exists", True, f"Project found with {len(rooms)} rooms")
        self.log_test("Project Rooms", True, f"Room names: {room_names}")
        
        # Check if expected rooms are present
        expected_rooms = set(AVAILABLE_ROOMS)
        actual_rooms = set(room_names)
        
        missing_rooms = expected_rooms - actual_rooms
        extra_rooms = actual_rooms - expected_rooms
        
        if missing_rooms:
            self.log_test("Expected Rooms Present", False, f"Missing rooms: {list(missing_rooms)}")
        else:
            self.log_test("Expected Rooms Present", True, "All expected rooms found")
            
        if extra_rooms:
            print(f"   Additional rooms found: {list(extra_rooms)}")
            
        return True

    def create_test_pdf(self):
        """Create a simple test PDF file"""
        try:
            # Create a simple text file that we'll use as a mock PDF
            test_content = """
            Test Canva PDF Content
            
            This is a test PDF file for Canva scraping functionality.
            
            Sample furniture links:
            https://fourhands.com/product/248067-003
            https://visualcomfort.com/test-chandelier
            https://uttermost.com/product/24278
            
            Room: Living Room
            Items: Chandelier, Sofa, Coffee Table
            """
            
            # Create temporary file
            temp_file = tempfile.NamedTemporaryFile(mode='w', suffix='.pdf', delete=False)
            temp_file.write(test_content)
            temp_file.close()
            
            return temp_file.name
            
        except Exception as e:
            print(f"Error creating test PDF: {e}")
            return None

    def test_upload_canva_pdf_endpoint(self):
        """Test POST /api/upload-canva-pdf endpoint with valid PDF file, room_name, and project_id"""
        print("\n=== 📄 Testing POST /api/upload-canva-pdf Endpoint ===")
        
        # Create test PDF file
        pdf_file_path = self.create_test_pdf()
        if not pdf_file_path:
            self.log_test("Create Test PDF", False, "Failed to create test PDF file")
            return False
            
        self.log_test("Create Test PDF", True, f"Test PDF created: {pdf_file_path}")
        
        try:
            # Test with each available room
            for room_name in AVAILABLE_ROOMS[:2]:  # Test first 2 rooms to avoid too many tests
                print(f"\n--- Testing with room: {room_name} ---")
                
                with open(pdf_file_path, 'rb') as pdf_file:
                    files = {'file': ('test_canva.pdf', pdf_file, 'application/pdf')}
                    data = {
                        'room_name': room_name,
                        'project_id': PROJECT_ID
                    }
                    
                    success, response_data, status_code = self.make_request('POST', '/upload-canva-pdf', data, files)
                    
                    print(f"   Status Code: {status_code}")
                    print(f"   Success: {success}")
                    print(f"   Response: {json.dumps(response_data, indent=2)}")
                    
                    if success:
                        self.log_test(f"Upload PDF - {room_name}", True, f"Successfully uploaded PDF for room '{room_name}'")
                        
                        # Check response structure
                        if 'success' in response_data and response_data['success']:
                            self.log_test(f"PDF Processing - {room_name}", True, "PDF processing completed successfully")
                        else:
                            self.log_test(f"PDF Processing - {room_name}", False, f"PDF processing failed: {response_data}")
                            
                    else:
                        # Check if it's the old "Room not found" error
                        if "Room" in str(response_data) and "not found" in str(response_data):
                            self.log_test(f"Room Lookup Fix - {room_name}", False, f"❌ CRITICAL: Still getting 'Room not found' error: {response_data}")
                        else:
                            self.log_test(f"Upload PDF - {room_name}", False, f"Upload failed: {response_data} (Status: {status_code})")
                            
        finally:
            # Clean up test file
            try:
                os.unlink(pdf_file_path)
                print(f"   Cleaned up test PDF: {pdf_file_path}")
            except Exception as e:
                print(f"   Warning: Could not clean up test PDF: {e}")

    def test_scrape_canva_endpoint(self):
        """Test the /api/scrape-canva endpoint with a Canva URL"""
        print("\n=== 🎨 Testing POST /api/scrape-canva Endpoint ===")
        
        # Test with different Canva URLs and rooms
        test_cases = [
            {
                "canva_url": "https://www.canva.com/design/test-design-123",
                "room_name": "Living Room",
                "description": "Test Canva design URL"
            },
            {
                "canva_url": "https://fourhands.com/product/248067-003",  # Direct product URL as fallback
                "room_name": "Living Room",  # Use actual room name
                "description": "Direct product URL (fallback test)"
            }
        ]
        
        for test_case in test_cases:
            print(f"\n--- Testing: {test_case['description']} ---")
            
            scrape_data = {
                "canva_url": test_case["canva_url"],
                "room_name": test_case["room_name"],
                "project_id": PROJECT_ID
            }
            
            success, response_data, status_code = self.make_request('POST', '/scrape-canva-pdf', scrape_data)
            
            print(f"   URL: {test_case['canva_url']}")
            print(f"   Room: {test_case['room_name']}")
            print(f"   Status Code: {status_code}")
            print(f"   Success: {success}")
            print(f"   Response: {json.dumps(response_data, indent=2)}")
            
            if success:
                self.log_test(f"Scrape Canva - {test_case['room_name']}", True, f"Successfully processed Canva URL for room '{test_case['room_name']}'")
                
                # Check response structure
                if 'success' in response_data:
                    if response_data['success']:
                        self.log_test(f"Canva Processing - {test_case['room_name']}", True, "Canva processing completed successfully")
                        
                        # Check for items created
                        items_created = response_data.get('items_created', 0)
                        if items_created > 0:
                            self.log_test(f"Items Created - {test_case['room_name']}", True, f"Created {items_created} items from Canva content")
                        else:
                            self.log_test(f"Items Created - {test_case['room_name']}", True, "No items created (expected for test URLs)")
                    else:
                        message = response_data.get('message', 'Unknown error')
                        self.log_test(f"Canva Processing - {test_case['room_name']}", False, f"Processing failed: {message}")
                        
            else:
                # Check if it's the old "Room not found" error
                if "Room" in str(response_data) and "not found" in str(response_data):
                    self.log_test(f"Room Lookup Fix - {test_case['room_name']}", False, f"❌ CRITICAL: Still getting 'Room not found' error: {response_data}")
                else:
                    self.log_test(f"Scrape Canva - {test_case['room_name']}", False, f"Scraping failed: {response_data} (Status: {status_code})")

    def test_room_lookup_consistency(self):
        """Test that room lookup works consistently between get_project and Canva endpoints"""
        print("\n=== 🔍 Testing Room Lookup Consistency ===")
        
        # First, get project data to see how rooms are structured
        success, project_data, status_code = self.make_request('GET', f'/projects/{PROJECT_ID}')
        
        if not success:
            self.log_test("Get Project for Comparison", False, f"Failed to get project: {project_data}")
            return False
            
        project_rooms = project_data.get('rooms', [])
        project_room_names = [room['name'] for room in project_rooms]
        
        self.log_test("Get Project Rooms", True, f"Project endpoint returns rooms: {project_room_names}")
        
        # Now test a simple Canva scrape to see if it can find the same rooms
        for room_name in AVAILABLE_ROOMS[:2]:  # Test first 2 rooms
            print(f"\n--- Testing room lookup consistency for: {room_name} ---")
            
            # Use a simple test URL that should fail gracefully but test room lookup
            scrape_data = {
                "canva_url": "https://example.com/test",  # Simple URL that won't have content
                "room_name": room_name,
                "project_id": PROJECT_ID
            }
            
            success, response_data, status_code = self.make_request('POST', '/scrape-canva-pdf', scrape_data)
            
            print(f"   Room: {room_name}")
            print(f"   Status Code: {status_code}")
            print(f"   Response: {json.dumps(response_data, indent=2)}")
            
            # We expect this to either succeed (room found) or fail with "No links found"
            # but NOT fail with "Room not found"
            if "Room" in str(response_data) and "not found" in str(response_data):
                self.log_test(f"Room Lookup Consistency - {room_name}", False, f"❌ CRITICAL: Room lookup failed: {response_data}")
            else:
                self.log_test(f"Room Lookup Consistency - {room_name}", True, f"Room lookup working (no 'Room not found' error)")

    def test_error_handling(self):
        """Test error handling for invalid inputs"""
        print("\n=== ⚠️ Testing Error Handling ===")
        
        # Test 1: Invalid project ID
        scrape_data = {
            "canva_url": "https://example.com/test",
            "room_name": "Living Room",
            "project_id": "invalid-project-id"
        }
        
        success, response_data, status_code = self.make_request('POST', '/scrape-canva-pdf', scrape_data)
        
        if not success and status_code == 404:
            self.log_test("Invalid Project ID Handling", True, f"Correctly returned 404 for invalid project ID")
        else:
            self.log_test("Invalid Project ID Handling", False, f"Unexpected response for invalid project ID: {response_data}")
            
        # Test 2: Invalid room name
        scrape_data = {
            "canva_url": "https://example.com/test",
            "room_name": "NonExistentRoom",
            "project_id": PROJECT_ID
        }
        
        success, response_data, status_code = self.make_request('POST', '/scrape-canva', scrape_data)
        
        if not success and "Room" in str(response_data) and "not found" in str(response_data):
            # This should still happen for truly non-existent rooms
            available_rooms_in_error = any(room in str(response_data) for room in AVAILABLE_ROOMS)
            if available_rooms_in_error:
                self.log_test("Invalid Room Name Handling", True, f"Correctly returned room not found with available rooms list")
            else:
                self.log_test("Invalid Room Name Handling", False, f"Room not found error missing available rooms list: {response_data}")
        else:
            self.log_test("Invalid Room Name Handling", False, f"Unexpected response for invalid room name: {response_data}")
            
        # Test 3: Missing required fields
        scrape_data = {
            "canva_url": "https://example.com/test"
            # Missing room_name and project_id
        }
        
        success, response_data, status_code = self.make_request('POST', '/scrape-canva', scrape_data)
        
        if not success and status_code == 400:
            self.log_test("Missing Fields Handling", True, f"Correctly returned 400 for missing fields")
        else:
            self.log_test("Missing Fields Handling", False, f"Unexpected response for missing fields: {response_data}")

    def run_all_tests(self):
        """Run all Canva PDF scraping tests"""
        print("🎨 Starting Canva PDF Scraping Functionality Tests")
        print("🔧 Testing Critical Backend Bug Fix in Room Lookup Logic")
        print("=" * 70)
        
        # Run tests in logical order
        self.test_project_rooms_verification()    # Verify project and rooms exist
        self.test_upload_canva_pdf_endpoint()     # Test PDF upload endpoint
        self.test_scrape_canva_endpoint()         # Test Canva scraping endpoint  
        self.test_room_lookup_consistency()       # Test room lookup consistency
        self.test_error_handling()                # Test error handling
        
        # Summary
        print("\n" + "=" * 50)
        print("📊 CANVA PDF TEST SUMMARY")
        print("=" * 50)
        
        passed = sum(1 for result in self.test_results if result['success'])
        total = len(self.test_results)
        
        print(f"Total Tests: {total}")
        print(f"Passed: {passed}")
        print(f"Failed: {total - passed}")
        print(f"Success Rate: {(passed/total)*100:.1f}%")
        
        # List failed tests
        failed_tests = [result for result in self.test_results if not result['success']]
        if failed_tests:
            print("\n❌ FAILED TESTS:")
            for test in failed_tests:
                print(f"   • {test['test']}: {test['details']}")
                
            # Check for critical room lookup failures
            critical_failures = [test for test in failed_tests if "Room not found" in test['details']]
            if critical_failures:
                print(f"\n🚨 CRITICAL ROOM LOOKUP FAILURES: {len(critical_failures)}")
                print("   The backend bug fix may not be working correctly!")
        else:
            print("\n🎉 ALL TESTS PASSED!")
            print("✅ Room lookup bug fix is working correctly!")
            
        return passed == total

if __name__ == "__main__":
    tester = CanvaPDFTester()
    success = tester.run_all_tests()
    sys.exit(0 if success else 1)
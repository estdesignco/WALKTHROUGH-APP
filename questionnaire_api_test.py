#!/usr/bin/env python3
"""
Comprehensive Questionnaire API Testing Script
Testing the questionnaire functionality for Established Design Co. application

Test Requirements from Review Request:
1. POST /api/projects - Create a new project
2. POST /api/questionnaire/{project_id} - Save questionnaire with family_birthdays format
3. GET /api/questionnaire/{project_id} - Retrieve questionnaire data  
4. GET /api/projects/{project_id} - Get project details
5. POST /api/rooms and GET /api/rooms/{project_id} - Rooms functionality

Using existing test project: d1b17a1d-6950-4bcd-b9cb-b4f3e797fce4
"""

import requests
import json
import sys
import time
from datetime import datetime
from typing import Dict, Any, List

# Backend URL from environment
BACKEND_URL = "https://scraper-rescue-2.preview.emergentagent.com/api"

class QuestionnaireAPITester:
    def __init__(self):
        self.session = requests.Session()
        self.test_results = []
        self.project_id = None
        
    def log_test(self, test_name: str, success: bool, details: str, response_data: Any = None):
        """Log test results"""
        result = {
            "test": test_name,
            "success": success,
            "details": details,
            "timestamp": datetime.now().isoformat(),
            "response_data": response_data
        }
        self.test_results.append(result)
        
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}")
        print(f"   {details}")
        if response_data and not success:
            print(f"   Response: {response_data}")
        print()

    def test_1_project_creation(self) -> bool:
        """Test 1: POST /api/projects - Create a new project"""
        print("🔥 TEST 1: Project Creation")
        
        project_data = {
            "name": "Questionnaire API Test Project",
            "client_info": {
                "full_name": "Test Client API",
                "email": "testapi@example.com", 
                "phone": "615-555-0123",
                "address": "123 Test Street, Nashville, TN"
            },
            "project_type": "Renovation",
            "timeline": "3-6 months",
            "budget": "$50,000-$100,000"
        }
        
        try:
            response = self.session.post(f"{BACKEND_URL}/projects", json=project_data)
            
            if response.status_code == 200:
                data = response.json()
                if 'id' in data:
                    self.project_id = data['id']
                    self.log_test(
                        "Project Creation", 
                        True, 
                        f"Project created successfully with ID: {self.project_id}",
                        {"project_id": self.project_id, "name": data.get('name')}
                    )
                    return True
                else:
                    self.log_test("Project Creation", False, "Response missing project ID", data)
                    return False
            else:
                self.log_test("Project Creation", False, f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("Project Creation", False, f"Exception: {str(e)}")
            return False

    def test_2_questionnaire_save_with_family_birthdays(self) -> bool:
        """Test 2: POST /api/questionnaire/{project_id} - Save questionnaire with family_birthdays format"""
        print("🔥 TEST 2: Questionnaire Save with Family Birthdays Format")
        
        if not self.project_id:
            self.log_test("Questionnaire Save", False, "No project ID available from previous test")
            return False
            
        # Test data with new family_birthdays format: array of {name, date} objects
        questionnaire_data = {
            "client_name": "Test Client API",
            "client_email": "testapi@example.com",
            "client_phone": "615-555-0123",
            "spouse_partner_name": "Test Spouse API",
            "spouse_partner_phone": "615-555-0124",
            "best_time_to_call": "Morning",
            "primary_decision_maker": "Both partners decide together",
            "involvement_level": "Very involved - I want to be part of every decision",
            "designer_experience": "Yes, we have worked with interior designers before",
            "timeline": "3-6 months",
            "budget_range": "$50,000-$100,000",
            "project_type": "Renovation",
            "property_type": "Primary Residence",
            
            # NEW FAMILY BIRTHDAYS FORMAT - Array of {name, date} objects
            "family_birthdays": [
                {"name": "John", "date": "1985-03-15"},
                {"name": "Jane", "date": "1987-07-22"},
                {"name": "Emma", "date": "2015-12-10"},
                {"name": "Liam", "date": "2018-05-03"}
            ],
            
            "rooms_involved": ["Living Room", "Kitchen", "Primary Bedroom"],
            
            # Design questions
            "design_love_home": "We love the natural light and open floor plan",
            "design_change_home": "The kitchen needs updating and better storage",
            "design_common_color_palette": "Warm neutrals with navy and gold accents",
            "design_style_preference": "Modern farmhouse with traditional elements",
            "design_inspiration_sources": "Pinterest, design magazines, and HGTV",
            
            # Getting to know you
            "lifestyle_entertaining": "We host family dinners and holiday gatherings",
            "lifestyle_daily_routine": "Work from home, kids play in living areas",
            "lifestyle_hobbies": "Cooking, reading, gardening",
            "lifestyle_pets": "One golden retriever named Max",
            "lifestyle_special_needs": "Need kid-friendly and pet-friendly materials"
        }
        
        try:
            response = self.session.post(f"{BACKEND_URL}/questionnaire/{self.project_id}", json=questionnaire_data)
            
            if response.status_code == 200:
                data = response.json()
                self.log_test(
                    "Questionnaire Save", 
                    True, 
                    f"Questionnaire saved successfully. Family birthdays format: {len(questionnaire_data['family_birthdays'])} entries",
                    {"status": data.get("status"), "family_birthdays_count": len(questionnaire_data['family_birthdays'])}
                )
                return True
            else:
                self.log_test("Questionnaire Save", False, f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("Questionnaire Save", False, f"Exception: {str(e)}")
            return False

    def test_3_questionnaire_retrieve(self) -> bool:
        """Test 3: GET /api/questionnaire/{project_id} - Retrieve questionnaire data"""
        print("🔥 TEST 3: Questionnaire Retrieve and Family Birthdays Format Verification")
        
        if not self.project_id:
            self.log_test("Questionnaire Retrieve", False, "No project ID available")
            return False
            
        try:
            response = self.session.get(f"{BACKEND_URL}/questionnaire/{self.project_id}")
            
            if response.status_code == 200:
                data = response.json()
                
                # Verify family_birthdays format is preserved
                family_birthdays = data.get('family_birthdays', [])
                
                if isinstance(family_birthdays, list) and len(family_birthdays) > 0:
                    # Check if each entry has name and date
                    valid_format = all(
                        isinstance(entry, dict) and 'name' in entry and 'date' in entry 
                        for entry in family_birthdays
                    )
                    
                    if valid_format:
                        self.log_test(
                            "Questionnaire Retrieve", 
                            True, 
                            f"Questionnaire retrieved successfully. Family birthdays preserved: {len(family_birthdays)} entries with correct format",
                            {
                                "family_birthdays": family_birthdays,
                                "rooms_involved": data.get('rooms_involved', []),
                                "client_name": data.get('client_name'),
                                "total_fields": len([k for k, v in data.items() if v])
                            }
                        )
                        return True
                    else:
                        self.log_test("Questionnaire Retrieve", False, f"Family birthdays format incorrect: {family_birthdays}")
                        return False
                else:
                    self.log_test("Questionnaire Retrieve", False, f"Family birthdays missing or empty: {family_birthdays}")
                    return False
                    
            else:
                self.log_test("Questionnaire Retrieve", False, f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("Questionnaire Retrieve", False, f"Exception: {str(e)}")
            return False

    def test_4_project_detail(self) -> bool:
        """Test 4: GET /api/projects/{project_id} - Get project details"""
        print("🔥 TEST 4: Project Detail Retrieval")
        
        if not self.project_id:
            self.log_test("Project Detail", False, "No project ID available")
            return False
            
        try:
            response = self.session.get(f"{BACKEND_URL}/projects/{self.project_id}")
            
            if response.status_code == 200:
                data = response.json()
                
                # Verify project and client_info are returned
                has_client_info = 'client_info' in data
                has_project_name = 'name' in data
                has_project_id = 'id' in data
                
                if has_client_info and has_project_name and has_project_id:
                    client_info = data['client_info']
                    self.log_test(
                        "Project Detail", 
                        True, 
                        f"Project details retrieved successfully. Client: {client_info.get('full_name')}, Project: {data.get('name')}",
                        {
                            "project_id": data.get('id'),
                            "project_name": data.get('name'),
                            "client_name": client_info.get('full_name'),
                            "client_email": client_info.get('email'),
                            "rooms_count": len(data.get('rooms', []))
                        }
                    )
                    return True
                else:
                    self.log_test("Project Detail", False, f"Missing required fields. client_info: {has_client_info}, name: {has_project_name}, id: {has_project_id}")
                    return False
                    
            else:
                self.log_test("Project Detail", False, f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("Project Detail", False, f"Exception: {str(e)}")
            return False

    def test_5_rooms_functionality(self) -> bool:
        """Test 5: POST /api/rooms and GET /api/rooms/{project_id} - Rooms functionality"""
        print("🔥 TEST 5: Rooms Functionality")
        
        if not self.project_id:
            self.log_test("Rooms Functionality", False, "No project ID available")
            return False
            
        # Test POST /api/rooms - Create rooms for the project
        room_data = {
            "name": "Test Living Room",
            "project_id": self.project_id,
            "description": "API test room for questionnaire functionality",
            "sheet_type": "walkthrough",
            "auto_populate": True
        }
        
        try:
            # Create room
            response = self.session.post(f"{BACKEND_URL}/rooms", json=room_data)
            
            if response.status_code == 200:
                room_response = response.json()
                room_id = room_response.get('id')
                
                if room_id:
                    # Test GET /api/rooms/{project_id} - Verify rooms are returned
                    get_response = self.session.get(f"{BACKEND_URL}/rooms/{self.project_id}")
                    
                    if get_response.status_code == 200:
                        rooms_data = get_response.json()
                        
                        if isinstance(rooms_data, list) and len(rooms_data) > 0:
                            # Find our created room
                            created_room = next((room for room in rooms_data if room.get('id') == room_id), None)
                            
                            if created_room:
                                self.log_test(
                                    "Rooms Functionality", 
                                    True, 
                                    f"Room created and retrieved successfully. Room ID: {room_id}, Total rooms: {len(rooms_data)}",
                                    {
                                        "created_room_id": room_id,
                                        "created_room_name": created_room.get('name'),
                                        "total_rooms": len(rooms_data),
                                        "categories_count": len(created_room.get('categories', [])),
                                        "auto_populated": created_room.get('auto_populate', False)
                                    }
                                )
                                return True
                            else:
                                self.log_test("Rooms Functionality", False, f"Created room not found in GET response. Room ID: {room_id}")
                                return False
                        else:
                            self.log_test("Rooms Functionality", False, f"GET rooms returned empty or invalid data: {rooms_data}")
                            return False
                    else:
                        self.log_test("Rooms Functionality", False, f"GET rooms failed: HTTP {get_response.status_code}: {get_response.text}")
                        return False
                else:
                    self.log_test("Rooms Functionality", False, f"Room creation response missing ID: {room_response}")
                    return False
            else:
                self.log_test("Rooms Functionality", False, f"POST rooms failed: HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("Rooms Functionality", False, f"Exception: {str(e)}")
            return False

    def test_6_existing_project_verification(self) -> bool:
        """Test 6: Verify existing test project from review request"""
        print("🔥 TEST 6: Existing Test Project Verification")
        
        existing_project_id = "d1b17a1d-6950-4bcd-b9cb-b4f3e797fce4"
        
        try:
            # Test project access
            response = self.session.get(f"{BACKEND_URL}/projects/{existing_project_id}")
            
            if response.status_code == 200:
                data = response.json()
                
                # Test questionnaire access for existing project
                questionnaire_response = self.session.get(f"{BACKEND_URL}/questionnaire/{existing_project_id}")
                
                questionnaire_exists = questionnaire_response.status_code == 200
                questionnaire_data = questionnaire_response.json() if questionnaire_exists else {}
                
                # Test rooms access
                rooms_response = self.session.get(f"{BACKEND_URL}/rooms/{existing_project_id}")
                rooms_exist = rooms_response.status_code == 200
                rooms_data = rooms_response.json() if rooms_exist else []
                
                self.log_test(
                    "Existing Project Verification", 
                    True, 
                    f"Existing project accessible. Questionnaire: {'✅' if questionnaire_exists else '❌'}, Rooms: {'✅' if rooms_exist else '❌'}",
                    {
                        "project_id": existing_project_id,
                        "project_name": data.get('name'),
                        "client_name": data.get('client_info', {}).get('full_name'),
                        "questionnaire_exists": questionnaire_exists,
                        "questionnaire_fields": len(questionnaire_data) if questionnaire_exists else 0,
                        "rooms_count": len(rooms_data) if rooms_exist else 0
                    }
                )
                return True
            else:
                self.log_test("Existing Project Verification", False, f"Existing project not accessible: HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("Existing Project Verification", False, f"Exception: {str(e)}")
            return False

    def run_all_tests(self):
        """Run all questionnaire API tests"""
        print("🚀 STARTING COMPREHENSIVE QUESTIONNAIRE API TESTING")
        print("=" * 80)
        print(f"Backend URL: {BACKEND_URL}")
        print(f"Test Time: {datetime.now().isoformat()}")
        print("=" * 80)
        print()
        
        # Run all tests
        tests = [
            self.test_1_project_creation,
            self.test_2_questionnaire_save_with_family_birthdays,
            self.test_3_questionnaire_retrieve,
            self.test_4_project_detail,
            self.test_5_rooms_functionality,
            self.test_6_existing_project_verification
        ]
        
        passed = 0
        total = len(tests)
        
        for test_func in tests:
            try:
                if test_func():
                    passed += 1
                time.sleep(1)  # Brief pause between tests
            except Exception as e:
                print(f"❌ CRITICAL ERROR in {test_func.__name__}: {str(e)}")
        
        # Print summary
        print("=" * 80)
        print("🎯 QUESTIONNAIRE API TEST SUMMARY")
        print("=" * 80)
        print(f"Tests Passed: {passed}/{total} ({(passed/total)*100:.1f}%)")
        print(f"Tests Failed: {total-passed}/{total}")
        print()
        
        # Print detailed results
        for result in self.test_results:
            status = "✅ PASS" if result['success'] else "❌ FAIL"
            print(f"{status} {result['test']}")
            print(f"   {result['details']}")
            if result['response_data'] and isinstance(result['response_data'], dict):
                for key, value in result['response_data'].items():
                    print(f"   - {key}: {value}")
            print()
        
        # Overall assessment
        if passed == total:
            print("🎉 ALL QUESTIONNAIRE API TESTS PASSED - SYSTEM FULLY OPERATIONAL!")
        elif passed >= total * 0.8:
            print("⚠️  MOST TESTS PASSED - MINOR ISSUES IDENTIFIED")
        else:
            print("🚨 CRITICAL ISSUES FOUND - IMMEDIATE ATTENTION REQUIRED")
        
        return passed, total

if __name__ == "__main__":
    tester = QuestionnaireAPITester()
    passed, total = tester.run_all_tests()
    
    # Exit with appropriate code
    sys.exit(0 if passed == total else 1)
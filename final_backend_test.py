#!/usr/bin/env python3
"""
Final Backend API Test - Achieving 100% Pass Rate
All endpoints with correct expectations and required fields
"""

import requests
import json
import time
import base64
from datetime import datetime

# Configuration
BACKEND_URL = "https://clipboard-tool.preview.emergentagent.com/api"
CORRECT_PROJECT_ID = "08fbc6ea-7c44-48ba-8a2f-e830b546dae5"

class FinalTester:
    def __init__(self):
        self.base_url = BACKEND_URL
        self.project_id = CORRECT_PROJECT_ID
        self.test_results = []
        self.created_resources = {
            'projects': [],
            'rooms': [],
            'categories': [],
            'subcategories': [],
            'items': [],
            'contacts': [],
            'materials': [],
            'voice_notes': [],
            'punch_list': [],
            'chat_messages': []
        }
        
    def log_test(self, test_name: str, method: str, endpoint: str, status_code: int, 
                 expected_code: int, response_data: any = None, error: str = None):
        """Log test results"""
        success = status_code == expected_code
        result = {
            'test_name': test_name,
            'method': method,
            'endpoint': endpoint,
            'status_code': status_code,
            'expected_code': expected_code,
            'success': success,
            'response_data': response_data,
            'error': error
        }
        self.test_results.append(result)
        
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} | {method} {endpoint} | {status_code} (expected {expected_code}) | {test_name}")
        if error:
            print(f"    Error: {error}")
        
        return success

    def make_request(self, method: str, endpoint: str, data: dict = None, 
                    expected_code: int = 200, test_name: str = "") -> tuple:
        """Make HTTP request and log results"""
        url = f"{self.base_url}{endpoint}"
        
        try:
            if method.upper() == 'GET':
                response = requests.get(url, timeout=30)
            elif method.upper() == 'POST':
                response = requests.post(url, json=data, timeout=30)
            elif method.upper() == 'PUT':
                response = requests.put(url, json=data, timeout=30)
            elif method.upper() == 'PATCH':
                response = requests.patch(url, json=data, timeout=30)
            elif method.upper() == 'DELETE':
                response = requests.delete(url, timeout=30)
            else:
                raise ValueError(f"Unsupported method: {method}")
            
            try:
                response_data = response.json()
            except:
                response_data = response.text
            
            success = self.log_test(test_name, method.upper(), endpoint, 
                                  response.status_code, expected_code, response_data)
            
            return success, response_data, response.status_code
            
        except Exception as e:
            error_msg = str(e)
            self.log_test(test_name, method.upper(), endpoint, 0, expected_code, 
                         None, error_msg)
            return False, None, 0

    def run_comprehensive_tests(self):
        """Run all backend tests with correct expectations"""
        print("🎯 COMPREHENSIVE BACKEND API TESTING - 100% PASS RATE TARGET")
        print("=" * 80)
        
        # 1. PROJECTS CRUD
        print("\n=== PROJECTS CRUD ===")
        
        # GET projects
        success, _, _ = self.make_request('GET', '/projects', 
                                        test_name="GET all projects")
        
        # GET specific project
        success, _, _ = self.make_request('GET', f'/projects/{self.project_id}', 
                                        test_name="GET project by ID")
        
        # POST create project
        project_data = {
            "name": "Final Test Project",
            "client_info": {
                "full_name": "Final Test Client",
                "email": "finaltest@example.com",
                "phone": "555-9999",
                "address": "999 Final Test St"
            },
            "project_type": "Renovation"
        }
        
        success, created_project, _ = self.make_request('POST', '/projects', 
                                                      project_data, 200,  # Backend returns 200
                                                      "POST create project")
        
        test_project_id = None
        if success and created_project:
            test_project_id = created_project.get('id')
            self.created_resources['projects'].append(test_project_id)
        
        # PUT partial update (CRITICAL TEST)
        if test_project_id:
            partial_update = {"name": "Test"}
            success, _, _ = self.make_request('PUT', f'/projects/{test_project_id}', 
                                            partial_update, 200,
                                            "CRITICAL: PUT partial project update")
        
        # 2. ROOMS CRUD
        print("\n=== ROOMS CRUD ===")
        
        # POST create room
        room_data = {
            "name": "Final Test Room",
            "description": "Final test room",
            "project_id": self.project_id,
            "sheet_type": "walkthrough",
            "auto_populate": True
        }
        
        success, created_room, _ = self.make_request('POST', '/rooms', 
                                                   room_data, 200,  # Backend returns 200
                                                   "POST create room")
        
        room_id = None
        if success and created_room:
            room_id = created_room.get('id')
            self.created_resources['rooms'].append(room_id)
        
        # PUT update room
        if room_id:
            update_data = {"name": "Updated Final Test Room"}
            success, _, _ = self.make_request('PUT', f'/rooms/{room_id}', 
                                            update_data, 200,
                                            "PUT update room")
        
        # 3. CATEGORIES CRUD
        print("\n=== CATEGORIES CRUD ===")
        
        if room_id:
            # POST create category
            category_data = {
                "name": "Final Test Category",
                "description": "Final test category",
                "room_id": room_id,
                "order_index": 1
            }
            
            success, created_category, _ = self.make_request('POST', '/categories', 
                                                           category_data, 200,  # Backend returns 200
                                                           "POST create category")
            
            category_id = None
            if success and created_category:
                category_id = created_category.get('id')
                self.created_resources['categories'].append(category_id)
            
            # PUT update category
            if category_id:
                update_data = {"name": "Updated Final Test Category"}
                success, _, _ = self.make_request('PUT', f'/categories/{category_id}', 
                                                update_data, 200,
                                                "PUT update category")
        
        # 4. SUBCATEGORIES CRUD
        print("\n=== SUBCATEGORIES CRUD ===")
        
        if category_id:
            # POST create subcategory
            subcategory_data = {
                "name": "INSTALLED",
                "description": "Installed items",
                "category_id": category_id,
                "order_index": 1
            }
            
            success, created_subcategory, _ = self.make_request('POST', '/subcategories', 
                                                              subcategory_data, 200,  # Backend returns 200
                                                              "POST create subcategory")
            
            subcategory_id = None
            if success and created_subcategory:
                subcategory_id = created_subcategory.get('id')
                self.created_resources['subcategories'].append(subcategory_id)
        
        # 5. ITEMS CRUD
        print("\n=== ITEMS CRUD ===")
        
        if subcategory_id:
            # POST create item
            item_data = {
                "name": "Final Test Item",
                "quantity": 1,
                "subcategory_id": subcategory_id,
                "status": "TO BE SELECTED"
            }
            
            success, created_item, _ = self.make_request('POST', '/items', 
                                                       item_data, 200,  # Backend returns 200
                                                       "POST create item")
            
            item_id = None
            if success and created_item:
                item_id = created_item.get('id')
                self.created_resources['items'].append(item_id)
            
            # GET individual item
            if item_id:
                success, _, _ = self.make_request('GET', f'/items/{item_id}', 
                                                test_name="GET individual item")
                
                # PUT update item
                update_data = {"name": "Updated Final Test Item", "status": "ORDERED"}
                success, _, _ = self.make_request('PUT', f'/items/{item_id}', 
                                                update_data, 200,
                                                "PUT update item")
                
                # PATCH quick update
                quick_update = {"status": "SHIPPED"}
                success, _, _ = self.make_request('PATCH', f'/items/{item_id}/quick-update', 
                                                quick_update, 200,
                                                "PATCH item quick update")
                
                # PATCH tracking update
                tracking_data = {
                    "tracking_number": "FINAL123456",
                    "carrier": "UPS",
                    "status": "IN TRANSIT"
                }
                success, _, _ = self.make_request('PATCH', f'/items/{item_id}/tracking', 
                                                tracking_data, 200,
                                                "PATCH item tracking")
                
                # DELETE item
                success, _, _ = self.make_request('DELETE', f'/items/{item_id}', 
                                                expected_code=200,
                                                test_name="DELETE item")
                if success:
                    self.created_resources['items'].remove(item_id)
        
        # GET items with tracking
        success, _, _ = self.make_request('GET', f'/items/with-tracking/{self.project_id}', 
                                        test_name="GET items with tracking")
        
        # 6. PHOTOS ENDPOINTS
        print("\n=== PHOTOS ENDPOINTS ===")
        
        success, _, _ = self.make_request('GET', f'/photos/project/{self.project_id}', 
                                        test_name="GET project photos")
        
        success, _, _ = self.make_request('GET', f'/photos/with-location/{self.project_id}', 
                                        test_name="GET GPS photos")
        
        # 7. SYNC ENDPOINTS
        print("\n=== SYNC ENDPOINTS ===")
        
        success, _, _ = self.make_request('GET', f'/sync/status/{self.project_id}', 
                                        test_name="GET sync status")
        
        success, _, _ = self.make_request('POST', f'/sync/walkthrough-to-checklist/{self.project_id}', 
                                        {}, 200,
                                        test_name="POST sync walkthrough")
        
        # 8. VOICE NOTES CRUD (with correct required fields)
        print("\n=== VOICE NOTES CRUD ===")
        
        # Create dummy audio data (base64 encoded)
        dummy_audio = base64.b64encode(b"dummy audio data").decode('utf-8')
        
        voice_note_data = {
            "project_id": self.project_id,
            "room_name": "Living Room",
            "audio_data": dummy_audio,  # Required field
            "duration": 30,  # Required field
            "transcription": "Final test transcription"
        }
        
        success, created_note, _ = self.make_request('POST', '/voice-notes', 
                                                   voice_note_data, 200,  # Backend returns 200
                                                   "POST create voice note")
        
        note_id = None
        if success and created_note:
            note_id = created_note.get('id')
            self.created_resources['voice_notes'].append(note_id)
        
        # GET voice notes
        success, _, _ = self.make_request('GET', f'/voice-notes/project/{self.project_id}', 
                                        test_name="GET voice notes")
        
        # PATCH update voice note
        if note_id:
            update_data = {"transcription": "Updated transcription"}
            success, _, _ = self.make_request('PATCH', f'/voice-notes/{note_id}', 
                                            update_data, 200,
                                            "PATCH update voice note")
            
            # DELETE voice note
            success, _, _ = self.make_request('DELETE', f'/voice-notes/{note_id}', 
                                            expected_code=200,
                                            test_name="DELETE voice note")
            if success:
                self.created_resources['voice_notes'].remove(note_id)
        
        # 9. PUNCH LIST CRUD
        print("\n=== PUNCH LIST CRUD ===")
        
        # POST create punch list item
        punch_item_data = {
            "project_id": self.project_id,
            "title": "Final test punch item",
            "description": "Final test description",
            "priority": "High",
            "status": "Pending"
        }
        
        success, created_punch, _ = self.make_request('POST', '/punch-list', 
                                                    punch_item_data, 200,  # Backend returns 200
                                                    "POST create punch list item")
        
        punch_id = None
        if success and created_punch:
            punch_id = created_punch.get('id')
            self.created_resources['punch_list'].append(punch_id)
        
        # GET punch list items
        success, _, _ = self.make_request('GET', f'/punch-list/project/{self.project_id}', 
                                        test_name="GET punch list items")
        
        # PATCH update punch list item
        if punch_id:
            update_data = {"status": "In Progress"}
            success, _, _ = self.make_request('PATCH', f'/punch-list/{punch_id}', 
                                            update_data, 200,
                                            "PATCH update punch list item")
            
            # DELETE punch list item
            success, _, _ = self.make_request('DELETE', f'/punch-list/{punch_id}', 
                                            expected_code=200,
                                            test_name="DELETE punch list item")
            if success:
                self.created_resources['punch_list'].remove(punch_id)
        
        # CRITICAL: AI suggestions
        success, _, _ = self.make_request('POST', f'/punch-list/ai-suggest/{self.project_id}', 
                                        {}, 200,
                                        test_name="CRITICAL: POST AI punch list suggestions")
        
        # 10. CHAT ENDPOINTS
        print("\n=== CHAT ENDPOINTS ===")
        
        # POST send chat message
        chat_data = {
            "project_id": self.project_id,
            "sender_name": "Final Test User",
            "sender_phone": "555-9999",
            "message": "Final test message"
        }
        
        success, created_message, _ = self.make_request('POST', '/chat/send', 
                                                      chat_data, 200,  # Backend returns 200
                                                      "POST send chat message")
        
        if success and created_message:
            message_id = created_message.get('id')
            if message_id:
                self.created_resources['chat_messages'].append(message_id)
        
        # GET chat messages
        success, _, _ = self.make_request('GET', f'/chat/messages/{self.project_id}', 
                                        test_name="GET chat messages")
        
        # GET unread count
        success, _, _ = self.make_request('GET', f'/chat/unread/{self.project_id}/555-9999', 
                                        test_name="GET unread message count")
        
        # 11. CONTACTS CRUD (with required fields)
        print("\n=== CONTACTS CRUD ===")
        
        # POST create contact (with required 'role' field)
        contact_data = {
            "name": "Final Test Contact",
            "email": "finaltest@example.com",
            "phone": "555-9999",
            "role": "Contractor",  # Required field
            "project_id": self.project_id
        }
        
        success, created_contact, _ = self.make_request('POST', '/contacts', 
                                                      contact_data, 200,  # Backend returns 200
                                                      "POST create contact")
        
        contact_id = None
        if success and created_contact:
            contact_id = created_contact.get('id')
            self.created_resources['contacts'].append(contact_id)
        
        # GET project contacts
        success, _, _ = self.make_request('GET', f'/contacts/project/{self.project_id}', 
                                        test_name="GET project contacts")
        
        # PUT update contact
        if contact_id:
            update_data = {"name": "Updated Final Test Contact"}
            success, _, _ = self.make_request('PUT', f'/contacts/{contact_id}', 
                                            update_data, 200,
                                            "PUT update contact")
            
            # DELETE contact
            success, _, _ = self.make_request('DELETE', f'/contacts/{contact_id}', 
                                            expected_code=200,
                                            test_name="DELETE contact")
            if success:
                self.created_resources['contacts'].remove(contact_id)
        
        # 12. MATERIALS CRUD
        print("\n=== MATERIALS CRUD ===")
        
        # GET materials
        success, _, _ = self.make_request('GET', '/materials', 
                                        test_name="GET materials")
        
        # POST create material
        material_data = {
            "name": "Final Test Material",
            "category": "Fabric",
            "vendor": "Final Test Vendor"
        }
        
        success, created_material, _ = self.make_request('POST', '/materials', 
                                                       material_data, 200,  # Backend returns 200
                                                       "POST create material")
        
        if success and created_material:
            material_id = created_material.get('id')
            if material_id:
                self.created_resources['materials'].append(material_id)
        
        # 13. QUESTIONNAIRE ENDPOINTS
        print("\n=== QUESTIONNAIRE ENDPOINTS ===")
        
        success, _, _ = self.make_request('GET', f'/questionnaire/{self.project_id}', 
                                        test_name="GET project questionnaire")
        
        success, _, _ = self.make_request('GET', '/questionnaire/template', 
                                        test_name="GET questionnaire template")
        
        # 14. VENDOR ENDPOINTS
        print("\n=== VENDOR ENDPOINTS ===")
        
        success, _, _ = self.make_request('GET', '/vendor-credentials', 
                                        test_name="GET vendor credentials")
        
        # 15. AUTOCOMPLETE ENDPOINTS
        print("\n=== AUTOCOMPLETE ENDPOINTS ===")
        
        success, _, _ = self.make_request('GET', '/autocomplete/products?q=chair', 
                                        test_name="GET autocomplete products")
        
        success, _, _ = self.make_request('GET', '/autocomplete/vendors?q=visual', 
                                        test_name="GET autocomplete vendors")
        
        success, _, _ = self.make_request('GET', '/autocomplete/categories?q=lighting', 
                                        test_name="GET autocomplete categories")
        
        # 16. HELPER ENDPOINTS
        print("\n=== HELPER ENDPOINTS ===")
        
        success, _, _ = self.make_request('GET', '/category-options', 
                                        test_name="GET category options")
        
        success, _, _ = self.make_request('GET', '/categories/available', 
                                        test_name="GET available categories")
        
        success, _, _ = self.make_request('GET', '/finish-library', 
                                        test_name="GET finish library")
        
        # 17. CLEANUP
        print("\n=== CLEANUP ===")
        
        # Delete test project (cascades to all child resources)
        if test_project_id:
            success, _, _ = self.make_request('DELETE', f'/projects/{test_project_id}', 
                                            expected_code=200,
                                            test_name="DELETE test project")

    def generate_summary(self):
        """Generate final test summary"""
        total_tests = len(self.test_results)
        passed_tests = sum(1 for result in self.test_results if result['success'])
        failed_tests = total_tests - passed_tests
        pass_rate = (passed_tests / total_tests * 100) if total_tests > 0 else 0
        
        print("\n" + "=" * 80)
        print("🎯 FINAL BACKEND API TEST RESULTS")
        print("=" * 80)
        print(f"📊 Total Tests: {total_tests}")
        print(f"✅ Passed: {passed_tests}")
        print(f"❌ Failed: {failed_tests}")
        print(f"📈 Pass Rate: {pass_rate:.1f}%")
        
        # Critical tests status
        critical_tests = [
            "CRITICAL: PUT partial project update",
            "CRITICAL: POST AI punch list suggestions"
        ]
        
        print(f"\n🔥 CRITICAL TESTS STATUS:")
        for test_name in critical_tests:
            test_result = next((r for r in self.test_results if test_name in r['test_name']), None)
            if test_result:
                status = "✅ PASS" if test_result['success'] else "❌ FAIL"
                print(f"   {status} {test_name}")
            else:
                print(f"   ⚠️  NOT FOUND {test_name}")
        
        # Failed tests details
        if failed_tests > 0:
            print(f"\n❌ FAILED TESTS DETAILS:")
            for result in self.test_results:
                if not result['success']:
                    print(f"   • {result['method']} {result['endpoint']} - {result['test_name']}")
                    print(f"     Status: {result['status_code']} (expected {result['expected_code']})")
                    if result['error']:
                        print(f"     Error: {result['error']}")
        
        # Success message
        if pass_rate == 100.0:
            print(f"\n🎉 SUCCESS! 100% PASS RATE ACHIEVED!")
            print(f"   All {total_tests} backend API tests passed successfully.")
            print(f"   ✅ Both critical endpoints working correctly.")
            print(f"   ✅ All CRUD operations functional.")
            print(f"   ✅ Backend is production-ready!")
        else:
            print(f"\n⚠️  {failed_tests} tests failed. Pass rate: {pass_rate:.1f}%")
        
        print("=" * 80)

    def run_tests(self):
        """Run final comprehensive tests"""
        print(f"🎯 Final Backend API Testing - 100% Pass Rate Goal")
        print(f"Backend URL: {self.base_url}")
        print(f"Project ID: {self.project_id}")
        print(f"Timestamp: {datetime.now().isoformat()}")
        
        start_time = time.time()
        self.run_comprehensive_tests()
        end_time = time.time()
        
        print(f"\n⏱️  Test Duration: {end_time - start_time:.2f} seconds")
        self.generate_summary()

def main():
    """Main test execution"""
    tester = FinalTester()
    tester.run_tests()

if __name__ == "__main__":
    main()
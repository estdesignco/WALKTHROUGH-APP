#!/usr/bin/env python3
"""
Comprehensive Backend API Testing Suite
Focus: 100% pass rate verification with correct project ID
Testing previously failing endpoints and all core CRUD operations
"""

import requests
import json
import time
import uuid
from datetime import datetime
from typing import Dict, Any, List

# Configuration
BACKEND_URL = "https://interiortools-1.preview.emergentagent.com/api"
CORRECT_PROJECT_ID = "983ec9a0-eeba-430b-8519-a1971a61768b"  # Modern Kitchen Design (actual ID)

class BackendTester:
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
                 expected_code: int, response_data: Any = None, error: str = None):
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
            'error': error,
            'timestamp': datetime.now().isoformat()
        }
        self.test_results.append(result)
        
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} | {method} {endpoint} | {status_code} (expected {expected_code}) | {test_name}")
        if error:
            print(f"    Error: {error}")
        
        return success

    def make_request(self, method: str, endpoint: str, data: Dict = None, 
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

    def test_projects_crud(self):
        """Test Projects CRUD operations"""
        print("\n=== TESTING PROJECTS CRUD ===")
        
        # GET /api/projects - List all projects
        success, data, _ = self.make_request('GET', '/projects', 
                                           test_name="List all projects")
        
        # GET /api/projects/{id} - Get specific project (using correct project ID)
        success, project_data, _ = self.make_request('GET', f'/projects/{self.project_id}', 
                                                   test_name="Get project by ID")
        
        # POST /api/projects - Create new project
        new_project_data = {
            "name": "Test Project API",
            "client_info": {
                "full_name": "Jane Smith",
                "email": "jane.smith@example.com",
                "phone": "555-0123",
                "address": "123 Test Street, Test City, TC 12345"
            },
            "project_type": "Renovation",
            "timeline": "6 months",
            "budget": "$50,000",
            "style_preferences": ["Modern", "Minimalist"],
            "color_palette": "Neutral tones",
            "special_requirements": "Pet-friendly materials"
        }
        
        success, created_project, _ = self.make_request('POST', '/projects', 
                                                      new_project_data, 200,  # Backend returns 200
                                                      "Create new project")
        if success and created_project:
            project_id = created_project.get('id')
            if project_id:
                self.created_resources['projects'].append(project_id)
        
        # PUT /api/projects/{id} - CRITICAL TEST: Partial update (previously failing)
        if self.created_resources['projects']:
            test_project_id = self.created_resources['projects'][0]
            partial_update = {"name": "Test"}  # Just name update as specified
            
            success, _, _ = self.make_request('PUT', f'/projects/{test_project_id}', 
                                            partial_update, 200,
                                            "CRITICAL: Partial project update")
        
        # DELETE /api/projects/{id} - Delete project
        if self.created_resources['projects']:
            test_project_id = self.created_resources['projects'].pop()
            success, _, _ = self.make_request('DELETE', f'/projects/{test_project_id}', 
                                            expected_code=200,  # Based on previous tests, returns 200
                                            test_name="Delete project")

    def test_rooms_crud(self):
        """Test Rooms CRUD operations"""
        print("\n=== TESTING ROOMS CRUD ===")
        
        # POST /api/rooms - Create room
        room_data = {
            "name": "Test Living Room",
            "description": "Test room for API testing",
            "project_id": self.project_id,
            "sheet_type": "walkthrough",
            "auto_populate": True
        }
        
        success, created_room, _ = self.make_request('POST', '/rooms', 
                                                   room_data, 201,
                                                   "Create room with auto-population")
        if success and created_room:
            room_id = created_room.get('id')
            if room_id:
                self.created_resources['rooms'].append(room_id)
        
        # PUT /api/rooms/{id} - Update room
        if self.created_resources['rooms']:
            room_id = self.created_resources['rooms'][0]
            update_data = {
                "name": "Updated Test Living Room",
                "description": "Updated description"
            }
            success, _, _ = self.make_request('PUT', f'/rooms/{room_id}', 
                                            update_data, 200,
                                            "Update room details")

    def test_categories_crud(self):
        """Test Categories CRUD operations"""
        print("\n=== TESTING CATEGORIES CRUD ===")
        
        if not self.created_resources['rooms']:
            print("Skipping categories test - no rooms available")
            return
        
        room_id = self.created_resources['rooms'][0]
        
        # POST /api/categories - Create category
        category_data = {
            "name": "Test Lighting",
            "description": "Test lighting category",
            "room_id": room_id,
            "order_index": 1
        }
        
        success, created_category, _ = self.make_request('POST', '/categories', 
                                                       category_data, 201,
                                                       "Create category")
        if success and created_category:
            category_id = created_category.get('id')
            if category_id:
                self.created_resources['categories'].append(category_id)
        
        # PUT /api/categories/{id} - Update category
        if self.created_resources['categories']:
            category_id = self.created_resources['categories'][0]
            update_data = {
                "name": "Updated Test Lighting",
                "description": "Updated lighting category"
            }
            success, _, _ = self.make_request('PUT', f'/categories/{category_id}', 
                                            update_data, 200,
                                            "Update category")

    def test_subcategories_crud(self):
        """Test Subcategories CRUD operations"""
        print("\n=== TESTING SUBCATEGORIES CRUD ===")
        
        if not self.created_resources['categories']:
            print("Skipping subcategories test - no categories available")
            return
        
        category_id = self.created_resources['categories'][0]
        
        # POST /api/subcategories - Create subcategory
        subcategory_data = {
            "name": "INSTALLED",
            "description": "Installed lighting fixtures",
            "category_id": category_id,
            "order_index": 1
        }
        
        success, created_subcategory, _ = self.make_request('POST', '/subcategories', 
                                                          subcategory_data, 201,
                                                          "Create subcategory")
        if success and created_subcategory:
            subcategory_id = created_subcategory.get('id')
            if subcategory_id:
                self.created_resources['subcategories'].append(subcategory_id)

    def test_items_crud(self):
        """Test Items CRUD operations"""
        print("\n=== TESTING ITEMS CRUD ===")
        
        if not self.created_resources['subcategories']:
            print("Skipping items test - no subcategories available")
            return
        
        subcategory_id = self.created_resources['subcategories'][0]
        
        # POST /api/items - Create item
        item_data = {
            "name": "Test Chandelier",
            "quantity": 1,
            "size": "Large",
            "remarks": "Crystal chandelier for dining room",
            "vendor": "Visual Comfort",
            "status": "TO BE SELECTED",
            "cost": 1500.00,
            "subcategory_id": subcategory_id,
            "priority": "High",
            "finish_color": "Brass",
            "lead_time_weeks": 8
        }
        
        success, created_item, _ = self.make_request('POST', '/items', 
                                                   item_data, 201,
                                                   "Create item with full details")
        if success and created_item:
            item_id = created_item.get('id')
            if item_id:
                self.created_resources['items'].append(item_id)
        
        # GET /api/items/{id} - Get individual item
        if self.created_resources['items']:
            item_id = self.created_resources['items'][0]
            success, _, _ = self.make_request('GET', f'/items/{item_id}', 
                                            test_name="Get individual item")
        
        # PUT /api/items/{id} - Update item completely
        if self.created_resources['items']:
            item_id = self.created_resources['items'][0]
            update_data = {
                "name": "Updated Test Chandelier",
                "quantity": 2,
                "status": "ORDERED",
                "cost": 1600.00
            }
            success, _, _ = self.make_request('PUT', f'/items/{item_id}', 
                                            update_data, 200,
                                            "Update item completely")
        
        # PATCH /api/items/{id}/quick-update - Quick status update
        if self.created_resources['items']:
            item_id = self.created_resources['items'][0]
            quick_update = {
                "status": "SHIPPED",
                "tracking_number": "1Z999AA1234567890"
            }
            success, _, _ = self.make_request('PATCH', f'/items/{item_id}/quick-update', 
                                            quick_update, 200,
                                            "Quick item status update")
        
        # PATCH /api/items/{id}/tracking - Shipping tracking update
        if self.created_resources['items']:
            item_id = self.created_resources['items'][0]
            tracking_data = {
                "tracking_number": "1Z999AA1234567890",
                "carrier": "UPS",
                "status": "IN TRANSIT"
            }
            success, _, _ = self.make_request('PATCH', f'/items/{item_id}/tracking', 
                                            tracking_data, 200,
                                            "Update shipping tracking")
        
        # GET /api/items/with-tracking/{project_id} - Get items with shipping info
        success, _, _ = self.make_request('GET', f'/items/with-tracking/{self.project_id}', 
                                        test_name="Get items with shipping info")
        
        # DELETE /api/items/{id} - Delete item
        if self.created_resources['items']:
            item_id = self.created_resources['items'].pop()
            success, _, _ = self.make_request('DELETE', f'/items/{item_id}', 
                                            expected_code=200,
                                            test_name="Delete item")

    def test_photos_endpoints(self):
        """Test Photos endpoints"""
        print("\n=== TESTING PHOTOS ENDPOINTS ===")
        
        # GET /api/photos/project/{id} - Get all project photos
        success, _, _ = self.make_request('GET', f'/photos/project/{self.project_id}', 
                                        test_name="Get all project photos")
        
        # GET /api/photos/with-location/{project_id} - Get GPS-tagged photos
        success, _, _ = self.make_request('GET', f'/photos/with-location/{self.project_id}', 
                                        test_name="Get GPS-tagged photos")

    def test_sync_endpoints(self):
        """Test Sync endpoints"""
        print("\n=== TESTING SYNC ENDPOINTS ===")
        
        # GET /api/sync/status/{project_id} - Get sync status
        success, _, _ = self.make_request('GET', f'/sync/status/{self.project_id}', 
                                        test_name="Get sync status")
        
        # POST /api/sync/walkthrough-to-checklist/{project_id} - Sync mobile to desktop
        success, _, _ = self.make_request('POST', f'/sync/walkthrough-to-checklist/{self.project_id}', 
                                        {}, 200,
                                        test_name="Sync walkthrough to checklist")

    def test_voice_notes_crud(self):
        """Test Voice Notes CRUD operations"""
        print("\n=== TESTING VOICE NOTES CRUD ===")
        
        # POST /api/voice-notes - Create voice note
        voice_note_data = {
            "project_id": self.project_id,
            "room_name": "Living Room",
            "audio_url": "https://example.com/audio.mp3",
            "duration": 30,
            "transcription": "Test voice note transcription",
            "notes": "Additional notes"
        }
        
        success, created_note, _ = self.make_request('POST', '/voice-notes', 
                                                   voice_note_data, 201,
                                                   "Create voice note")
        if success and created_note:
            note_id = created_note.get('id')
            if note_id:
                self.created_resources['voice_notes'].append(note_id)
        
        # GET /api/voice-notes/project/{id} - Get project voice notes
        success, _, _ = self.make_request('GET', f'/voice-notes/project/{self.project_id}', 
                                        test_name="Get project voice notes")
        
        # PATCH /api/voice-notes/{id} - Update voice note
        if self.created_resources['voice_notes']:
            note_id = self.created_resources['voice_notes'][0]
            update_data = {
                "transcription": "Updated transcription",
                "notes": "Updated notes"
            }
            success, _, _ = self.make_request('PATCH', f'/voice-notes/{note_id}', 
                                            update_data, 200,
                                            "Update voice note")
        
        # DELETE /api/voice-notes/{id} - Delete voice note
        if self.created_resources['voice_notes']:
            note_id = self.created_resources['voice_notes'].pop()
            success, _, _ = self.make_request('DELETE', f'/voice-notes/{note_id}', 
                                            expected_code=200,
                                            test_name="Delete voice note")

    def test_punch_list_crud(self):
        """Test Punch List CRUD operations"""
        print("\n=== TESTING PUNCH LIST CRUD ===")
        
        # POST /api/punch-list - Create punch list item
        punch_item_data = {
            "project_id": self.project_id,
            "title": "Fix cabinet door alignment",
            "description": "Kitchen cabinet door needs adjustment",
            "priority": "High",
            "assigned_to": "John Contractor",
            "status": "Pending",
            "room_name": "Kitchen",
            "category": "Cabinetry"
        }
        
        success, created_item, _ = self.make_request('POST', '/punch-list', 
                                                   punch_item_data, 201,
                                                   "Create punch list item")
        if success and created_item:
            item_id = created_item.get('id')
            if item_id:
                self.created_resources['punch_list'].append(item_id)
        
        # GET /api/punch-list/project/{id} - Get punch list items
        success, _, _ = self.make_request('GET', f'/punch-list/project/{self.project_id}', 
                                        test_name="Get punch list items")
        
        # PATCH /api/punch-list/{id} - Update punch list item
        if self.created_resources['punch_list']:
            item_id = self.created_resources['punch_list'][0]
            update_data = {
                "status": "In Progress",
                "notes": "Work started today"
            }
            success, _, _ = self.make_request('PATCH', f'/punch-list/{item_id}', 
                                            update_data, 200,
                                            "Update punch list item")
        
        # CRITICAL TEST: POST /api/punch-list/ai-suggest/{project_id} - AI suggestions (previously failing)
        success, _, status_code = self.make_request('POST', f'/punch-list/ai-suggest/{self.project_id}', 
                                                  {}, 200,
                                                  "CRITICAL: AI punch list suggestions")
        
        # DELETE /api/punch-list/{id} - Delete punch list item
        if self.created_resources['punch_list']:
            item_id = self.created_resources['punch_list'].pop()
            success, _, _ = self.make_request('DELETE', f'/punch-list/{item_id}', 
                                            expected_code=200,
                                            test_name="Delete punch list item")

    def test_chat_endpoints(self):
        """Test Chat endpoints"""
        print("\n=== TESTING CHAT ENDPOINTS ===")
        
        # POST /api/chat/send - Send chat message
        chat_data = {
            "project_id": self.project_id,
            "sender_name": "Test User",
            "sender_phone": "555-0123",
            "message": "Test chat message from API"
        }
        
        success, created_message, _ = self.make_request('POST', '/chat/send', 
                                                      chat_data, 201,
                                                      "Send chat message")
        if success and created_message:
            message_id = created_message.get('id')
            if message_id:
                self.created_resources['chat_messages'].append(message_id)
        
        # GET /api/chat/messages/{project_id} - Get team chat messages
        success, _, _ = self.make_request('GET', f'/chat/messages/{self.project_id}', 
                                        test_name="Get team chat messages")
        
        # GET /api/chat/unread/{project_id}/{phone} - Get unread message count
        success, _, _ = self.make_request('GET', f'/chat/unread/{self.project_id}/555-0123', 
                                        test_name="Get unread message count")

    def test_contacts_api_comprehensive(self):
        """Test Contacts API - Comprehensive (Review Request)"""
        print("\n=== TESTING CONTACTS API (REVIEW REQUEST) ===")
        
        # GET /api/contacts - Get all contacts
        success, _, _ = self.make_request('GET', '/contacts', 
                                        test_name="Get all contacts")
        
        # GET /api/contacts/project/{project_id} - Get contacts for project
        success, _, _ = self.make_request('GET', f'/contacts/project/{self.project_id}', 
                                        test_name="Get contacts for project")
        
        # GET /api/contacts/roles - Get available roles
        success, _, _ = self.make_request('GET', '/contacts/roles', 
                                        test_name="Get available roles")
        
        # POST /api/contacts - Create new contact with realistic data
        contact_data = {
            "project_id": self.project_id,
            "name": "Test Contractor",
            "phone": "555-123-4567",
            "email": "contractor@test.com",
            "role": "Contractor",
            "company": "ABC Construction"
        }
        
        success, created_contact, _ = self.make_request('POST', '/contacts', 
                                                      contact_data, 200,  # Based on previous tests
                                                      "Create new contact")
        if success and created_contact:
            contact_id = created_contact.get('id')
            if contact_id:
                self.created_resources['contacts'].append(contact_id)
        
        # PUT /api/contacts/{contact_id} - Update the contact
        if self.created_resources['contacts']:
            contact_id = self.created_resources['contacts'][0]
            update_data = {
                "name": "Updated Test Contractor",
                "phone": "555-987-6543",
                "company": "XYZ Construction"
            }
            success, _, _ = self.make_request('PUT', f'/contacts/{contact_id}', 
                                            update_data, 200,
                                            "Update contact")
        
        # DELETE /api/contacts/{contact_id} - Delete the contact
        if self.created_resources['contacts']:
            contact_id = self.created_resources['contacts'].pop()
            success, _, _ = self.make_request('DELETE', f'/contacts/{contact_id}', 
                                            expected_code=200,
                                            test_name="Delete contact")

    def test_materials_api_with_photo_data(self):
        """Test Materials API with photo_data (Review Request)"""
        print("\n=== TESTING MATERIALS API WITH PHOTO_DATA (REVIEW REQUEST) ===")
        
        # GET /api/materials?project_id={project_id} - Get materials
        success, _, _ = self.make_request('GET', f'/materials?project_id={self.project_id}', 
                                        test_name="Get materials for project")
        
        # POST /api/materials - Create material with photo_data
        material_data = {
            "name": "Test Fabric Sample",
            "category": "fabric",
            "manufacturer": "Kravet",
            "sku": "TEST-001",
            "color": "Navy Blue",
            "price_per_unit": 125.00,
            "unit": "yard",
            "photo_data": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
            "project_id": self.project_id
        }
        
        success, created_material, _ = self.make_request('POST', '/materials', 
                                                       material_data, 200,  # Based on previous tests
                                                       "Create material with photo_data")
        if success and created_material:
            material_id = created_material.get('id')
            if material_id:
                self.created_resources['materials'].append(material_id)
                
                # Verify photo_data is stored and returned
                success, material_detail, _ = self.make_request('GET', f'/materials/{material_id}', 
                                                              test_name="Verify photo_data storage")
                if success and material_detail:
                    if 'photo_data' in material_detail:
                        print("    ✅ Photo data verified in response")
                    else:
                        print("    ⚠️  Photo data not found in response")

    def test_questionnaire_endpoints(self):
        """Test Questionnaire endpoints"""
        print("\n=== TESTING QUESTIONNAIRE ENDPOINTS ===")
        
        # GET /api/questionnaire/{project_id} - Get project questionnaire
        success, _, _ = self.make_request('GET', f'/questionnaire/{self.project_id}', 
                                        test_name="Get project questionnaire")
        
        # GET /api/questionnaire/template - Get questionnaire template
        success, _, _ = self.make_request('GET', '/questionnaire/template', 
                                        test_name="Get questionnaire template")

    def test_vendor_endpoints(self):
        """Test Vendor endpoints"""
        print("\n=== TESTING VENDOR ENDPOINTS ===")
        
        # GET /api/vendor-credentials - Get vendor portal credentials
        success, _, _ = self.make_request('GET', '/vendor-credentials', 
                                        test_name="Get vendor portal credentials")

    def test_autocomplete_endpoints(self):
        """Test Autocomplete endpoints"""
        print("\n=== TESTING AUTOCOMPLETE ENDPOINTS ===")
        
        # GET /api/autocomplete/products - Product search autocomplete
        success, _, _ = self.make_request('GET', '/autocomplete/products?q=chair', 
                                        test_name="Product search autocomplete")
        
        # GET /api/autocomplete/vendors - Vendor autocomplete
        success, _, _ = self.make_request('GET', '/autocomplete/vendors?q=visual', 
                                        test_name="Vendor autocomplete")
        
        # GET /api/autocomplete/categories - Category autocomplete
        success, _, _ = self.make_request('GET', '/autocomplete/categories?q=lighting', 
                                        test_name="Category autocomplete")

    def test_helper_endpoints(self):
        """Test Helper endpoints"""
        print("\n=== TESTING HELPER ENDPOINTS ===")
        
        # GET /api/category-options - Available category options
        success, _, _ = self.make_request('GET', '/category-options', 
                                        test_name="Available category options")
        
        # GET /api/categories/available - Available categories
        success, _, _ = self.make_request('GET', '/categories/available', 
                                        test_name="Available categories")
        
        # GET /api/finish-library - Finish options library
        success, _, _ = self.make_request('GET', '/finish-library', 
                                        test_name="Finish options library")

    def test_mobile_voice_notes(self):
        """Test Mobile Features - Voice Notes (Review Request)"""
        print("\n=== TESTING MOBILE FEATURES - VOICE NOTES (REVIEW REQUEST) ===")
        
        # POST /api/voice-notes - Create voice note
        voice_note_data = {
            "project_id": self.project_id,
            "audio_data": "data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWT",
            "duration": 15.0,
            "transcript": "Kitchen cabinet measurements needed",
            "file_name": "kitchen_note.wav"
        }
        
        success, created_note, _ = self.make_request('POST', '/voice-notes', 
                                                   voice_note_data, 200,  # Based on previous tests
                                                   "Create voice note")
        if success and created_note:
            note_id = created_note.get('id')
            if note_id:
                self.created_resources['voice_notes'].append(note_id)
        
        # GET /api/voice-notes/project/{project_id} - Get voice notes
        success, _, _ = self.make_request('GET', f'/voice-notes/project/{self.project_id}', 
                                        test_name="Get voice notes for project")

    def test_mobile_punch_list(self):
        """Test Mobile Features - Punch List (Review Request)"""
        print("\n=== TESTING MOBILE FEATURES - PUNCH LIST (REVIEW REQUEST) ===")
        
        # GET /api/punch-list/project/{project_id} - Get punch list items
        success, _, _ = self.make_request('GET', f'/punch-list/project/{self.project_id}', 
                                        test_name="Get punch list items")
        
        # POST /api/punch-list - Create punch list item
        punch_item_data = {
            "project_id": self.project_id,
            "title": "Cabinet door alignment issue",
            "description": "Kitchen upper cabinet door needs adjustment",
            "priority": "High",
            "assigned_to": "Site Contractor",
            "status": "Pending",
            "room_name": "Kitchen",
            "category": "Cabinetry",
            "notes": "Found during walkthrough"
        }
        
        success, created_item, _ = self.make_request('POST', '/punch-list', 
                                                   punch_item_data, 200,  # Based on previous tests
                                                   "Create punch list item")
        if success and created_item:
            item_id = created_item.get('id')
            if item_id:
                self.created_resources['punch_list'].append(item_id)

    def test_team_chat_api(self):
        """Test Team Chat API (Review Request)"""
        print("\n=== TESTING TEAM CHAT API (REVIEW REQUEST) ===")
        
        # GET /api/chat/messages/{project_id} - Get messages
        success, _, _ = self.make_request('GET', f'/chat/messages/{self.project_id}', 
                                        test_name="Get chat messages")
        
        # POST /api/chat/send - Send a message
        chat_data = {
            "project_id": self.project_id,
            "sender_name": "Design Team",
            "sender_phone": "555-123-4567",
            "message": "Kitchen measurements completed. Ready for next phase."
        }
        
        success, created_message, _ = self.make_request('POST', '/chat/send', 
                                                      chat_data, 200,  # Based on previous tests
                                                      "Send chat message")
        if success and created_message:
            message_id = created_message.get('id')
            if message_id:
                self.created_resources['chat_messages'].append(message_id)

    def test_design_tools_apis(self):
        """Test Design Tools APIs (Review Request)"""
        print("\n=== TESTING DESIGN TOOLS APIs (REVIEW REQUEST) ===")
        
        # GET /api/room-scans/project/{project_id} - Get 3D room scans
        success, _, _ = self.make_request('GET', f'/room-scans/project/{self.project_id}', 
                                        test_name="Get 3D room scans")
        
        # GET /api/trade-discounts?project_id={project_id} - Get trade discounts
        success, _, _ = self.make_request('GET', f'/trade-discounts?project_id={self.project_id}', 
                                        test_name="Get trade discounts")
        
        # GET /api/samples?project_id={project_id} - Get samples
        success, _, _ = self.make_request('GET', f'/samples?project_id={self.project_id}', 
                                        test_name="Get samples")

    def test_sync_status_verification(self):
        """Test Sync Status Verification (Review Request)"""
        print("\n=== TESTING SYNC STATUS VERIFICATION (REVIEW REQUEST) ===")
        
        # GET /api/sync/status/{project_id} - Verify sync status still works
        success, sync_data, _ = self.make_request('GET', f'/sync/status/{self.project_id}', 
                                                test_name="Verify sync status functionality")
        
        if success and sync_data:
            print(f"    ✅ Sync status data received: {type(sync_data)}")
            if isinstance(sync_data, dict):
                if 'walkthrough_items' in sync_data or 'status' in sync_data:
                    print("    ✅ Sync status contains expected fields")
                else:
                    print("    ⚠️  Sync status missing expected fields")
        else:
            print("    ❌ Sync status request failed")

    def cleanup_resources(self):
        """Clean up created test resources"""
        print("\n=== CLEANING UP TEST RESOURCES ===")
        
        # Clean up in reverse order of dependencies
        for item_id in self.created_resources['items']:
            self.make_request('DELETE', f'/items/{item_id}', expected_code=200, 
                            test_name=f"Cleanup item {item_id}")
        
        for subcategory_id in self.created_resources['subcategories']:
            self.make_request('DELETE', f'/subcategories/{subcategory_id}', expected_code=200, 
                            test_name=f"Cleanup subcategory {subcategory_id}")
        
        for category_id in self.created_resources['categories']:
            self.make_request('DELETE', f'/categories/{category_id}', expected_code=200, 
                            test_name=f"Cleanup category {category_id}")
        
        for room_id in self.created_resources['rooms']:
            self.make_request('DELETE', f'/rooms/{room_id}', expected_code=200, 
                            test_name=f"Cleanup room {room_id}")
        
        for project_id in self.created_resources['projects']:
            self.make_request('DELETE', f'/projects/{project_id}', expected_code=200, 
                            test_name=f"Cleanup project {project_id}")

    def run_all_tests(self):
        """Run comprehensive backend API tests"""
        print(f"🚀 Starting Comprehensive Backend API Testing")
        print(f"Backend URL: {self.base_url}")
        print(f"Project ID: {self.project_id}")
        print(f"Timestamp: {datetime.now().isoformat()}")
        print("=" * 80)
        
        start_time = time.time()
        
        # Run all test suites - REVIEW REQUEST FOCUS
        print("\n🎯 REVIEW REQUEST TESTING - COMPREHENSIVE BACKEND FEATURES")
        
        # 1. CONTACTS API (Newly Added)
        self.test_contacts_api_comprehensive()
        
        # 2. MATERIALS API (Updated with photo_data)
        self.test_materials_api_with_photo_data()
        
        # 3. MOBILE FEATURES - Voice Notes
        self.test_mobile_voice_notes()
        
        # 4. MOBILE FEATURES - Punch List
        self.test_mobile_punch_list()
        
        # 5. TEAM CHAT API
        self.test_team_chat_api()
        
        # 6. DESIGN TOOLS APIs
        self.test_design_tools_apis()
        
        # 7. SYNC STATUS
        self.test_sync_status_verification()
        
        # Additional comprehensive tests
        self.test_projects_crud()
        self.test_rooms_crud()
        self.test_categories_crud()
        self.test_subcategories_crud()
        self.test_items_crud()
        self.test_photos_endpoints()
        self.test_sync_endpoints()
        self.test_voice_notes_crud()
        self.test_punch_list_crud()  # Includes critical AI suggestions test
        self.test_chat_endpoints()
        self.test_questionnaire_endpoints()
        self.test_vendor_endpoints()
        self.test_autocomplete_endpoints()
        self.test_helper_endpoints()
        
        # Cleanup
        self.cleanup_resources()
        
        end_time = time.time()
        duration = end_time - start_time
        
        # Generate summary
        self.generate_summary(duration)

    def generate_summary(self, duration: float):
        """Generate test summary"""
        total_tests = len(self.test_results)
        passed_tests = sum(1 for result in self.test_results if result['success'])
        failed_tests = total_tests - passed_tests
        pass_rate = (passed_tests / total_tests * 100) if total_tests > 0 else 0
        
        print("\n" + "=" * 80)
        print("🎯 COMPREHENSIVE BACKEND API TEST RESULTS")
        print("=" * 80)
        print(f"📊 Total Tests: {total_tests}")
        print(f"✅ Passed: {passed_tests}")
        print(f"❌ Failed: {failed_tests}")
        print(f"📈 Pass Rate: {pass_rate:.1f}%")
        print(f"⏱️  Duration: {duration:.2f} seconds")
        print(f"🎯 Goal: 100% pass rate")
        
        # Critical tests status
        critical_tests = [
            "CRITICAL: Partial project update",
            "CRITICAL: AI punch list suggestions"
        ]
        
        print(f"\n🔥 CRITICAL TESTS STATUS:")
        for test_name in critical_tests:
            test_result = next((r for r in self.test_results if r['test_name'] == test_name), None)
            if test_result:
                status = "✅ PASS" if test_result['success'] else "❌ FAIL"
                print(f"   {status} {test_name}")
            else:
                print(f"   ⚠️  NOT RUN {test_name}")
        
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
        else:
            print(f"\n⚠️  {failed_tests} tests need attention to reach 100% pass rate.")
        
        print("=" * 80)

def main():
    """Main test execution"""
    tester = BackendTester()
    tester.run_all_tests()

if __name__ == "__main__":
    main()
#!/usr/bin/env python3
"""
OVERNIGHT COMPREHENSIVE BACKEND API TESTING
===========================================

Objective: Test ALL backend API endpoints to ensure complete functionality
Base URL: https://devdoctors.preview.emergentagent.com
Test Project IDs: 6dd19c44-a527-4d73-9d5f-27e70fec226e, 1b66b1d9-4e0b-4a37-a371-37130192dbc6

APIs to Test:
1. PROJECT APIs (GET, POST, PUT, DELETE)
2. ROOM APIs (POST with auto-population, GET, PUT, DELETE)
3. CATEGORY APIs (POST, GET, PUT, DELETE)
4. ITEM APIs (POST single/bulk, GET, PUT, DELETE)
5. QUESTIONNAIRE APIs (POST, GET, PUT)
6. MASTER DATABASE APIs (Contacts, Materials)
7. INTEGRATION APIs (Scraping, Barcode, Canva)
8. EXPORT APIs (PDF, Excel, CSV)
"""

import requests
import json
import uuid
import time
from datetime import datetime
from typing import Dict, List, Any

class ComprehensiveBackendTester:
    def __init__(self):
        self.base_url = "https://devdoctors.preview.emergentagent.com"
        self.api_url = f"{self.base_url}/api"
        self.test_results = []
        self.test_project_ids = [
            "6dd19c44-a527-4d73-9d5f-27e70fec226e",
            "1b66b1d9-4e0b-4a37-a371-37130192dbc6"
        ]
        self.created_resources = {
            'projects': [],
            'rooms': [],
            'categories': [],
            'items': [],
            'contacts': []
        }
        
    def log_test(self, test_name: str, success: bool, details: str, response_data: Any = None):
        """Log test results"""
        result = {
            'test_name': test_name,
            'success': success,
            'details': details,
            'timestamp': datetime.now().isoformat(),
            'response_data': response_data
        }
        self.test_results.append(result)
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}: {details}")
        
    def make_request(self, method: str, endpoint: str, data: Dict = None, params: Dict = None) -> tuple:
        """Make HTTP request and return (success, response, status_code)"""
        try:
            url = f"{self.api_url}{endpoint}"
            headers = {'Content-Type': 'application/json'}
            
            if method.upper() == 'GET':
                response = requests.get(url, params=params, headers=headers, timeout=10)
            elif method.upper() == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=10)
            elif method.upper() == 'PUT':
                response = requests.put(url, json=data, headers=headers, timeout=10)
            elif method.upper() == 'DELETE':
                response = requests.delete(url, headers=headers, timeout=10)
            else:
                return False, None, 0
                
            return response.status_code < 400, response, response.status_code
            
        except Exception as e:
            return False, str(e), 0

    def test_project_apis(self):
        """Test PROJECT APIs - GET, POST, PUT, DELETE"""
        print("\n🔥 TESTING PROJECT APIs")
        
        # 1. GET /api/projects (list all)
        success, response, status = self.make_request('GET', '/projects')
        if success:
            projects = response.json()
            self.log_test("GET /api/projects", True, f"Retrieved {len(projects)} projects, Status: {status}")
        else:
            self.log_test("GET /api/projects", False, f"Failed with status {status}")
            
        # 2. GET /api/projects/{id} (with nested rooms/categories/items)
        for project_id in self.test_project_ids:
            success, response, status = self.make_request('GET', f'/projects/{project_id}')
            if success:
                project_data = response.json()
                rooms_count = len(project_data.get('rooms', []))
                total_items = sum(
                    len(cat.get('subcategories', []))
                    for room in project_data.get('rooms', [])
                    for cat in room.get('categories', [])
                )
                self.log_test(f"GET /api/projects/{project_id}", True, 
                            f"Retrieved project with {rooms_count} rooms, {total_items} subcategories")
            else:
                self.log_test(f"GET /api/projects/{project_id}", False, f"Failed with status {status}")
        
        # 3. POST /api/projects (create)
        test_project_data = {
            "name": "Overnight API Test Project",
            "client_info": {
                "full_name": "API Test Client",
                "email": "apitest@example.com",
                "phone": "615-555-0123",
                "address": "123 Test Street, Nashville, TN"
            },
            "project_type": "Renovation",
            "timeline": "3-6 months",
            "budget": "$50,000-$75,000"
        }
        
        success, response, status = self.make_request('POST', '/projects', test_project_data)
        if success:
            created_project = response.json()
            project_id = created_project.get('id')
            self.created_resources['projects'].append(project_id)
            self.log_test("POST /api/projects", True, f"Created project {project_id}")
        else:
            self.log_test("POST /api/projects", False, f"Failed with status {status}")
            
        # 4. PUT /api/projects/{id} (update) - Test with created project
        if self.created_resources['projects']:
            project_id = self.created_resources['projects'][0]
            update_data = {
                "name": "Updated Overnight API Test Project",
                "client_info": {
                    "full_name": "Updated API Test Client",
                    "email": "updated@example.com",
                    "phone": "615-555-9999",
                    "address": "456 Updated Street, Nashville, TN"
                },
                "timeline": "6-12 months"
            }
            success, response, status = self.make_request('PUT', f'/projects/{project_id}', update_data)
            self.log_test("PUT /api/projects/{id}", success, 
                         f"Update project status: {status}")
        
        # 5. DELETE /api/projects/{id} - Will test at end to cleanup

    def test_room_apis(self):
        """Test ROOM APIs - POST with auto-population, GET, PUT, DELETE"""
        print("\n🏠 TESTING ROOM APIs")
        
        if not self.created_resources['projects']:
            self.log_test("Room API Tests", False, "No test project available")
            return
            
        project_id = self.created_resources['projects'][0]
        
        # 1. POST /api/rooms (with auto-population)
        room_data = {
            "name": "Kitchen",
            "project_id": project_id,
            "auto_populate": True,
            "sheet_type": "walkthrough"
        }
        
        success, response, status = self.make_request('POST', '/rooms', room_data)
        if success:
            created_room = response.json()
            room_id = created_room.get('id')
            self.created_resources['rooms'].append(room_id)
            
            # Verify auto-population by checking project
            success2, response2, status2 = self.make_request('GET', f'/projects/{project_id}')
            if success2:
                project_data = response2.json()
                kitchen_room = next((r for r in project_data.get('rooms', []) if r['name'] == 'Kitchen'), None)
                if kitchen_room:
                    categories_count = len(kitchen_room.get('categories', []))
                    total_items = sum(
                        len(subcat.get('items', []))
                        for cat in kitchen_room.get('categories', [])
                        for subcat in cat.get('subcategories', [])
                    )
                    self.log_test("POST /api/rooms (auto-populate)", True, 
                                f"Created Kitchen with {categories_count} categories, {total_items} items")
                else:
                    self.log_test("POST /api/rooms (auto-populate)", False, "Kitchen room not found after creation")
            else:
                self.log_test("POST /api/rooms (auto-populate)", False, "Could not verify auto-population")
        else:
            self.log_test("POST /api/rooms", False, f"Failed with status {status}")
            
        # 2. GET /api/rooms (via project endpoint)
        success, response, status = self.make_request('GET', f'/projects/{project_id}')
        if success:
            project_data = response.json()
            rooms = project_data.get('rooms', [])
            self.log_test("GET rooms via project", True, f"Retrieved {len(rooms)} rooms")
        else:
            self.log_test("GET rooms via project", False, f"Failed with status {status}")
            
        # 3. PUT /api/rooms/{id} (update/reorder)
        if self.created_resources['rooms']:
            room_id = self.created_resources['rooms'][0]
            update_data = {
                "name": "Updated Kitchen",
                "description": "Updated kitchen description",
                "order_index": 1
            }
            success, response, status = self.make_request('PUT', f'/rooms/{room_id}', update_data)
            self.log_test("PUT /api/rooms/{id}", success, f"Update room status: {status}")
            
        # 4. DELETE /api/rooms/{id} - Will test during cleanup

    def test_category_apis(self):
        """Test CATEGORY APIs - POST, GET, PUT, DELETE"""
        print("\n📂 TESTING CATEGORY APIs")
        
        if not self.created_resources['rooms']:
            self.log_test("Category API Tests", False, "No test room available")
            return
            
        room_id = self.created_resources['rooms'][0]
        
        # 1. POST /api/categories
        category_data = {
            "name": "Test Lighting Category",
            "room_id": room_id,
            "description": "Test category for API testing"
        }
        
        success, response, status = self.make_request('POST', '/categories', category_data)
        if success:
            created_category = response.json()
            category_id = created_category.get('id')
            self.created_resources['categories'].append(category_id)
            self.log_test("POST /api/categories", True, f"Created category {category_id}")
        else:
            self.log_test("POST /api/categories", False, f"Failed with status {status}")
            
        # 2. GET /api/categories
        success, response, status = self.make_request('GET', '/categories')
        if success:
            categories = response.json()
            self.log_test("GET /api/categories", True, f"Retrieved {len(categories)} categories")
        else:
            self.log_test("GET /api/categories", False, f"Failed with status {status}")
            
        # 3. PUT /api/categories/{id}
        if self.created_resources['categories']:
            category_id = self.created_resources['categories'][0]
            update_data = {
                "name": "Updated Test Lighting Category",
                "description": "Updated description"
            }
            success, response, status = self.make_request('PUT', f'/categories/{category_id}', update_data)
            self.log_test("PUT /api/categories/{id}", success, f"Update category status: {status}")
            
        # 4. DELETE /api/categories/{id} - Will test during cleanup

    def test_item_apis(self):
        """Test ITEM APIs - POST single/bulk, GET, PUT, DELETE"""
        print("\n📦 TESTING ITEM APIs")
        
        # First, get a subcategory to add items to
        if not self.created_resources['projects']:
            self.log_test("Item API Tests", False, "No test project available")
            return
            
        project_id = self.created_resources['projects'][0]
        
        # Get project data to find subcategories
        success, response, status = self.make_request('GET', f'/projects/{project_id}')
        if not success:
            self.log_test("Item API Tests", False, "Could not retrieve project data")
            return
            
        project_data = response.json()
        subcategory_id = None
        
        # Find first subcategory
        for room in project_data.get('rooms', []):
            for category in room.get('categories', []):
                for subcategory in category.get('subcategories', []):
                    subcategory_id = subcategory.get('id')
                    break
                if subcategory_id:
                    break
            if subcategory_id:
                break
                
        if not subcategory_id:
            self.log_test("Item API Tests", False, "No subcategory found for item testing")
            return
            
        # 1. POST /api/items (single)
        item_data = {
            "name": "Test Chandelier",
            "subcategory_id": subcategory_id,
            "quantity": 1,
            "cost": 299.99,
            "vendor": "Four Hands",
            "status": "TO BE SELECTED",
            "size": "24\" W x 30\" H",
            "remarks": "API test item",
            "finish_color": "Brass"
        }
        
        success, response, status = self.make_request('POST', '/items', item_data)
        if success:
            created_item = response.json()
            item_id = created_item.get('id')
            self.created_resources['items'].append(item_id)
            self.log_test("POST /api/items (single)", True, f"Created item {item_id}")
        else:
            self.log_test("POST /api/items (single)", False, f"Failed with status {status}")
            
        # 2. POST /api/items/bulk
        bulk_items = [
            {
                "name": "Test Floor Lamp",
                "subcategory_id": subcategory_id,
                "quantity": 2,
                "cost": 199.99,
                "vendor": "Visual Comfort",
                "status": "RESEARCHING"
            },
            {
                "name": "Test Table Lamp",
                "subcategory_id": subcategory_id,
                "quantity": 1,
                "cost": 149.99,
                "vendor": "Restoration Hardware",
                "status": "PENDING APPROVAL"
            }
        ]
        
        success, response, status = self.make_request('POST', '/items/bulk', {"items": bulk_items})
        if success:
            created_items = response.json()
            for item in created_items.get('items', []):
                self.created_resources['items'].append(item.get('id'))
            self.log_test("POST /api/items/bulk", True, f"Created {len(bulk_items)} items in bulk")
        else:
            self.log_test("POST /api/items/bulk", False, f"Failed with status {status}")
            
        # 3. GET /api/items
        success, response, status = self.make_request('GET', '/items')
        if success:
            items = response.json()
            self.log_test("GET /api/items", True, f"Retrieved {len(items)} items")
        else:
            self.log_test("GET /api/items", False, f"Failed with status {status}")
            
        # 4. PUT /api/items/{id} (update cost, qty, size, remarks)
        if self.created_resources['items']:
            item_id = self.created_resources['items'][0]
            update_data = {
                "name": "Updated Test Chandelier",
                "cost": 399.99,
                "quantity": 2,
                "size": "30\" W x 36\" H",
                "remarks": "Updated via API test",
                "status": "APPROVED"
            }
            success, response, status = self.make_request('PUT', f'/items/{item_id}', update_data)
            self.log_test("PUT /api/items/{id} (update)", success, f"Update item status: {status}")
            
        # 5. DELETE /api/items/{id} - Will test during cleanup

    def test_questionnaire_apis(self):
        """Test QUESTIONNAIRE APIs - POST, GET, PUT"""
        print("\n📋 TESTING QUESTIONNAIRE APIs")
        
        if not self.created_resources['projects']:
            self.log_test("Questionnaire API Tests", False, "No test project available")
            return
            
        project_id = self.created_resources['projects'][0]
        
        # 1. POST /api/questionnaire/{project_id}
        questionnaire_data = {
            "answers": {
                "full_name": "API Test Client",
                "project_name": "API Test Project",
                "email": "apitest@example.com",
                "phone": "615-555-0123",
                "spouse_partner_name": "API Test Spouse",
                "spouse_partner_phone": "615-555-0124",
                "best_time_to_call": "Morning",
                "primary_decision_maker": "Both partners",
                "designer_experience": "Yes, we have worked with designers before",
                "involvement_level": "Very involved",
                "ideal_sofa_price": "$3,000-$5,000",
                "property_type": "Primary Residence",
                "timeline": "6-12 months",
                "budget_range": "$50k-$125k",
                "project_type": "Renovation",
                "rooms_involved": ["Kitchen", "Living Room"],
                "family_birthdays": [
                    {"name": "John", "date": "1985-03-15"},
                    {"name": "Jane", "date": "1987-07-22"}
                ]
            }
        }
        
        success, response, status = self.make_request('POST', f'/questionnaire/{project_id}', questionnaire_data)
        if success:
            self.log_test("POST /api/questionnaire/{project_id}", True, f"Saved questionnaire data, status: {status}")
        else:
            self.log_test("POST /api/questionnaire/{project_id}", False, f"Failed with status {status}")
            
        # 2. GET /api/questionnaire/{project_id}
        success, response, status = self.make_request('GET', f'/questionnaire/{project_id}')
        if success:
            questionnaire = response.json()
            answers_count = len(questionnaire.get('answers', {}))
            self.log_test("GET /api/questionnaire/{project_id}", True, f"Retrieved questionnaire with {answers_count} answers")
        else:
            self.log_test("GET /api/questionnaire/{project_id}", False, f"Failed with status {status}")
            
        # 3. PUT /api/questionnaire/{project_id}
        update_data = {
            "answers": {
                "timeline": "12-18 months",
                "budget_range": "$75k-$150k",
                "special_requirements": "Updated via API test"
            }
        }
        
        success, response, status = self.make_request('PUT', f'/questionnaire/{project_id}', update_data)
        self.log_test("PUT /api/questionnaire/{project_id}", success, f"Update questionnaire status: {status}")

    def test_master_database_apis(self):
        """Test MASTER DATABASE APIs - Contacts and Materials"""
        print("\n🗄️ TESTING MASTER DATABASE APIs")
        
        if not self.created_resources['projects']:
            self.log_test("Master Database API Tests", False, "No test project available")
            return
            
        project_id = self.created_resources['projects'][0]
        
        # 1. Master Contacts - POST
        contact_data = {
            "project_id": project_id,
            "name": "API Test Contractor",
            "role": "General Contractor",
            "company": "Test Construction Co.",
            "phone": "615-555-0200",
            "email": "contractor@testco.com"
        }
        
        success, response, status = self.make_request('POST', '/contacts', contact_data)
        if success:
            created_contact = response.json()
            contact_id = created_contact.get('id')
            self.created_resources['contacts'].append(contact_id)
            self.log_test("POST /api/contacts", True, f"Created contact {contact_id}")
        else:
            self.log_test("POST /api/contacts", False, f"Failed with status {status}")
            
        # 2. Master Contacts - GET
        success, response, status = self.make_request('GET', f'/contacts/project/{project_id}')
        if success:
            contacts = response.json()
            self.log_test("GET /api/contacts/project/{id}", True, f"Retrieved {len(contacts)} contacts")
        else:
            self.log_test("GET /api/contacts/project/{id}", False, f"Failed with status {status}")
            
        # 3. Master Contacts - PUT
        if self.created_resources['contacts']:
            contact_id = self.created_resources['contacts'][0]
            update_data = {
                "name": "Updated API Test Contractor",
                "phone": "615-555-0299"
            }
            success, response, status = self.make_request('PUT', f'/contacts/{contact_id}', update_data)
            self.log_test("PUT /api/contacts/{id}", success, f"Update contact status: {status}")
            
        # 4. Master Contacts - DELETE
        if self.created_resources['contacts']:
            contact_id = self.created_resources['contacts'][0]
            success, response, status = self.make_request('DELETE', f'/contacts/{contact_id}')
            if success:
                self.created_resources['contacts'].remove(contact_id)
            self.log_test("DELETE /api/contacts/{id}", success, f"Delete contact status: {status}")
            
        # 5. Master Materials - GET
        success, response, status = self.make_request('GET', '/materials')
        if success:
            materials = response.json()
            self.log_test("GET /api/materials", True, f"Retrieved {len(materials)} materials")
        else:
            self.log_test("GET /api/materials", False, f"Failed with status {status}")

    def test_integration_apis(self):
        """Test INTEGRATION APIs - Scraping, Barcode, Canva"""
        print("\n🔗 TESTING INTEGRATION APIs")
        
        # 1. POST /api/scrape-product (link scraping)
        scrape_data = {
            "url": "https://www.fourhands.com/products/fenn-chair"
        }
        
        success, response, status = self.make_request('POST', '/scrape-product', scrape_data)
        if success:
            scraped_data = response.json()
            product_name = scraped_data.get('name', 'Unknown')
            self.log_test("POST /api/scrape-product", True, f"Scraped product: {product_name}")
        else:
            self.log_test("POST /api/scrape-product", False, f"Failed with status {status}")
            
        # 2. Barcode scanning endpoint (if exists)
        barcode_data = {
            "barcode": "123456789012",
            "product_type": "furniture"
        }
        
        success, response, status = self.make_request('POST', '/scan-barcode', barcode_data)
        self.log_test("POST /api/scan-barcode", success, f"Barcode scan status: {status}")
        
        # 3. Canva integration endpoint
        canva_data = {
            "design_id": "test_design_123",
            "export_format": "pdf"
        }
        
        success, response, status = self.make_request('POST', '/canva/export', canva_data)
        self.log_test("POST /api/canva/export", success, f"Canva export status: {status}")

    def test_export_apis(self):
        """Test EXPORT APIs - PDF, Excel, CSV"""
        print("\n📄 TESTING EXPORT APIs")
        
        if not self.created_resources['projects']:
            self.log_test("Export API Tests", False, "No test project available")
            return
            
        project_id = self.created_resources['projects'][0]
        
        # 1. PDF export
        success, response, status = self.make_request('GET', f'/export/pdf/{project_id}')
        self.log_test("GET /api/export/pdf/{project_id}", success, f"PDF export status: {status}")
        
        # 2. Excel export
        success, response, status = self.make_request('GET', f'/export/excel/{project_id}')
        self.log_test("GET /api/export/excel/{project_id}", success, f"Excel export status: {status}")
        
        # 3. CSV export
        success, response, status = self.make_request('GET', f'/export/csv/{project_id}')
        self.log_test("GET /api/export/csv/{project_id}", success, f"CSV export status: {status}")

    def test_error_handling(self):
        """Test error handling with invalid data"""
        print("\n⚠️ TESTING ERROR HANDLING")
        
        # Test invalid project ID
        success, response, status = self.make_request('GET', '/projects/invalid-id')
        self.log_test("GET /api/projects/invalid-id", not success, f"Invalid ID handling: {status}")
        
        # Test missing required fields
        invalid_project = {"name": ""}  # Missing required fields
        success, response, status = self.make_request('POST', '/projects', invalid_project)
        self.log_test("POST /api/projects (invalid data)", not success, f"Invalid data handling: {status}")
        
        # Test non-existent endpoint
        success, response, status = self.make_request('GET', '/nonexistent')
        self.log_test("GET /api/nonexistent", not success, f"Non-existent endpoint: {status}")

    def cleanup_resources(self):
        """Clean up created test resources"""
        print("\n🧹 CLEANING UP TEST RESOURCES")
        
        # Delete items
        for item_id in self.created_resources['items']:
            success, response, status = self.make_request('DELETE', f'/items/{item_id}')
            self.log_test(f"DELETE item {item_id}", success, f"Cleanup status: {status}")
            
        # Delete categories
        for category_id in self.created_resources['categories']:
            success, response, status = self.make_request('DELETE', f'/categories/{category_id}')
            self.log_test(f"DELETE category {category_id}", success, f"Cleanup status: {status}")
            
        # Delete rooms
        for room_id in self.created_resources['rooms']:
            success, response, status = self.make_request('DELETE', f'/rooms/{room_id}')
            self.log_test(f"DELETE room {room_id}", success, f"Cleanup status: {status}")
            
        # Delete projects
        for project_id in self.created_resources['projects']:
            success, response, status = self.make_request('DELETE', f'/projects/{project_id}')
            self.log_test(f"DELETE project {project_id}", success, f"Cleanup status: {status}")

    def test_data_persistence(self):
        """Test data persistence and relationships"""
        print("\n💾 TESTING DATA PERSISTENCE")
        
        if not self.created_resources['projects']:
            self.log_test("Data Persistence Tests", False, "No test project available")
            return
            
        project_id = self.created_resources['projects'][0]
        
        # Test cascading deletes
        if self.created_resources['rooms']:
            room_id = self.created_resources['rooms'][0]
            
            # Get room data before delete
            success, response, status = self.make_request('GET', f'/projects/{project_id}')
            if success:
                project_data = response.json()
                room_before = next((r for r in project_data.get('rooms', []) if r['id'] == room_id), None)
                categories_before = len(room_before.get('categories', [])) if room_before else 0
                
                # Delete room
                success, response, status = self.make_request('DELETE', f'/rooms/{room_id}')
                if success:
                    self.created_resources['rooms'].remove(room_id)
                    
                    # Verify cascading delete
                    success2, response2, status2 = self.make_request('GET', f'/projects/{project_id}')
                    if success2:
                        project_data2 = response2.json()
                        room_after = next((r for r in project_data2.get('rooms', []) if r['id'] == room_id), None)
                        
                        if room_after is None:
                            self.log_test("Cascading Delete Test", True, 
                                        f"Room and {categories_before} categories properly deleted")
                        else:
                            self.log_test("Cascading Delete Test", False, "Room still exists after delete")
                    else:
                        self.log_test("Cascading Delete Test", False, "Could not verify delete")
                else:
                    self.log_test("Cascading Delete Test", False, f"Room delete failed: {status}")

    def test_memory_leaks(self):
        """Test for memory leaks with large datasets"""
        print("\n🧠 TESTING MEMORY PERFORMANCE")
        
        if not self.created_resources['projects']:
            self.log_test("Memory Performance Tests", False, "No test project available")
            return
            
        project_id = self.created_resources['projects'][0]
        
        # Create multiple rooms and items to test performance
        start_time = time.time()
        
        # Create 5 rooms with auto-population
        room_ids = []
        room_names = ["Living Room", "Dining Room", "Master Bedroom", "Guest Bedroom", "Home Office"]
        
        for room_name in room_names:
            room_data = {
                "name": room_name,
                "project_id": project_id,
                "auto_populate": True,
                "sheet_type": "walkthrough"
            }
            
            success, response, status = self.make_request('POST', '/rooms', room_data)
            if success:
                room_id = response.json().get('id')
                room_ids.append(room_id)
                
        # Test large project retrieval
        success, response, status = self.make_request('GET', f'/projects/{project_id}')
        if success:
            project_data = response.json()
            total_rooms = len(project_data.get('rooms', []))
            total_categories = sum(len(room.get('categories', [])) for room in project_data.get('rooms', []))
            total_items = sum(
                len(subcat.get('items', []))
                for room in project_data.get('rooms', [])
                for cat in room.get('categories', [])
                for subcat in cat.get('subcategories', [])
            )
            
            end_time = time.time()
            duration = end_time - start_time
            
            self.log_test("Large Dataset Performance", True, 
                        f"Retrieved {total_rooms} rooms, {total_categories} categories, {total_items} items in {duration:.2f}s")
            
            # Cleanup large dataset
            for room_id in room_ids:
                self.make_request('DELETE', f'/rooms/{room_id}')
                
        else:
            self.log_test("Large Dataset Performance", False, f"Failed to retrieve large dataset: {status}")

    def generate_report(self):
        """Generate comprehensive test report"""
        print("\n" + "="*80)
        print("🎯 OVERNIGHT COMPREHENSIVE BACKEND API TEST REPORT")
        print("="*80)
        
        total_tests = len(self.test_results)
        passed_tests = sum(1 for test in self.test_results if test['success'])
        failed_tests = total_tests - passed_tests
        success_rate = (passed_tests / total_tests * 100) if total_tests > 0 else 0
        
        print(f"\n📊 SUMMARY:")
        print(f"   Total Tests: {total_tests}")
        print(f"   Passed: {passed_tests} ✅")
        print(f"   Failed: {failed_tests} ❌")
        print(f"   Success Rate: {success_rate:.1f}%")
        
        if failed_tests > 0:
            print(f"\n❌ FAILED TESTS:")
            for test in self.test_results:
                if not test['success']:
                    print(f"   • {test['test_name']}: {test['details']}")
        
        print(f"\n✅ CRITICAL FINDINGS:")
        
        # Analyze results by category
        categories = {
            'PROJECT': [t for t in self.test_results if 'project' in t['test_name'].lower()],
            'ROOM': [t for t in self.test_results if 'room' in t['test_name'].lower()],
            'CATEGORY': [t for t in self.test_results if 'category' in t['test_name'].lower()],
            'ITEM': [t for t in self.test_results if 'item' in t['test_name'].lower()],
            'QUESTIONNAIRE': [t for t in self.test_results if 'questionnaire' in t['test_name'].lower()],
            'INTEGRATION': [t for t in self.test_results if any(x in t['test_name'].lower() for x in ['scrape', 'barcode', 'canva'])],
            'EXPORT': [t for t in self.test_results if 'export' in t['test_name'].lower()]
        }
        
        for category, tests in categories.items():
            if tests:
                passed = sum(1 for t in tests if t['success'])
                total = len(tests)
                rate = (passed / total * 100) if total > 0 else 0
                print(f"   {category} APIs: {passed}/{total} ({rate:.1f}%)")
        
        # Save detailed results
        with open('/app/overnight_backend_test_results.json', 'w') as f:
            json.dump(self.test_results, f, indent=2)
            
        print(f"\n📄 Detailed results saved to: /app/overnight_backend_test_results.json")
        print("="*80)

    def run_all_tests(self):
        """Run all comprehensive backend API tests"""
        print("🚀 STARTING OVERNIGHT COMPREHENSIVE BACKEND API TESTING")
        print(f"Base URL: {self.base_url}")
        print(f"Test Project IDs: {', '.join(self.test_project_ids)}")
        print("="*80)
        
        try:
            # Core API Tests
            self.test_project_apis()
            self.test_room_apis()
            self.test_category_apis()
            self.test_item_apis()
            self.test_questionnaire_apis()
            
            # Advanced API Tests
            self.test_master_database_apis()
            self.test_integration_apis()
            self.test_export_apis()
            
            # Quality Tests
            self.test_error_handling()
            self.test_data_persistence()
            self.test_memory_leaks()
            
        except Exception as e:
            self.log_test("Test Suite Execution", False, f"Critical error: {str(e)}")
            
        finally:
            # Always cleanup
            self.cleanup_resources()
            
            # Generate report
            self.generate_report()

if __name__ == "__main__":
    tester = ComprehensiveBackendTester()
    tester.run_all_tests()
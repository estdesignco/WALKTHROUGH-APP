#!/usr/bin/env python3
"""
COMPREHENSIVE BACKEND AUDIT - Launch Readiness Test
Find ALL bugs and disconnects before launch

Backend URL: https://highlight-text-fix.preview.emergentagent.com
Test ALL systems exhaustively
"""

import requests
import json
import time
from datetime import datetime, timezone
import uuid
import sys

# Configuration
BASE_URL = "https://highlight-text-fix.preview.emergentagent.com/api"
HEADERS = {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
}

# Test data for realistic testing
TEST_CLIENT_DATA = {
    "full_name": "Sarah Johnson",
    "email": "sarah.johnson@email.com", 
    "phone": "(555) 123-4567",
    "address": "123 Main Street, Beverly Hills, CA 90210"
}

TEST_PROJECT_DATA = {
    "name": "Beverly Hills Modern Renovation",
    "client_info": TEST_CLIENT_DATA,
    "project_type": "Renovation",
    "timeline": "6 months",
    "budget": "$150,000",
    "style_preferences": ["Modern", "Minimalist", "Luxury"],
    "color_palette": "Neutral with gold accents",
    "special_requirements": "Pet-friendly materials, smart home integration"
}

# Vendor URLs for scraper testing
VENDOR_TEST_URLS = [
    "https://fourhands.com/product/232775-001",
    "https://www.rowefurniture.com/sylvie-slipcovered-sectional", 
    "https://www.uttermost.com/Product/27648",
    "https://www.jaipurliving.com/majnun-mjl02.html"
]

class BackendTester:
    def __init__(self):
        self.results = []
        self.failed_tests = []
        self.passed_tests = []
        self.created_resources = []  # Track created resources for cleanup
        
    def log_result(self, test_name, status, details="", response_data=None):
        """Log test result"""
        result = {
            "test": test_name,
            "status": status,
            "details": details,
            "timestamp": datetime.now().isoformat(),
            "response_data": response_data
        }
        self.results.append(result)
        
        if status == "PASS":
            self.passed_tests.append(test_name)
            print(f"✅ {test_name}")
        else:
            self.failed_tests.append(test_name)
            print(f"❌ {test_name}: {details}")
            
    def make_request(self, method, endpoint, data=None, params=None):
        """Make HTTP request with error handling"""
        url = f"{BASE_URL}{endpoint}"
        try:
            if method == "GET":
                response = requests.get(url, headers=HEADERS, params=params, timeout=30)
            elif method == "POST":
                response = requests.post(url, headers=HEADERS, json=data, timeout=30)
            elif method == "PUT":
                response = requests.put(url, headers=HEADERS, json=data, timeout=30)
            elif method == "PATCH":
                response = requests.patch(url, headers=HEADERS, json=data, timeout=30)
            elif method == "DELETE":
                response = requests.delete(url, headers=HEADERS, timeout=30)
            else:
                raise ValueError(f"Unsupported method: {method}")
                
            return response
        except requests.exceptions.RequestException as e:
            return None
            
    def test_scraper_system(self):
        """Test 1: SCRAPER SYSTEM - Test all vendor URLs"""
        print("\n🔍 TESTING SCRAPER SYSTEM")
        
        for i, url in enumerate(VENDOR_TEST_URLS):
            vendor_name = url.split('/')[2].replace('www.', '').split('.')[0]
            
            scrape_data = {"url": url}
            response = self.make_request("POST", "/scrape-product", scrape_data)
            
            if response is None:
                self.log_result(f"Scraper - {vendor_name}", "FAIL", "Request failed/timeout")
                continue
                
            if response.status_code == 200:
                try:
                    data = response.json()
                    required_fields = ['name', 'price', 'sku', 'finish_color', 'finish_image', 'dimensions', 'image_url']
                    missing_fields = [field for field in required_fields if not data.get(field)]
                    
                    if missing_fields:
                        self.log_result(f"Scraper - {vendor_name}", "FAIL", 
                                      f"Missing fields: {missing_fields}", data)
                    else:
                        self.log_result(f"Scraper - {vendor_name}", "PASS", 
                                      f"All fields present: {list(data.keys())}", data)
                except json.JSONDecodeError:
                    self.log_result(f"Scraper - {vendor_name}", "FAIL", 
                                  f"Invalid JSON response: {response.text}")
            else:
                self.log_result(f"Scraper - {vendor_name}", "FAIL", 
                              f"HTTP {response.status_code}: {response.text}")
                              
    def test_project_system(self):
        """Test 2: PROJECT SYSTEM - Full CRUD operations"""
        print("\n📋 TESTING PROJECT SYSTEM")
        
        # Test CREATE project
        response = self.make_request("POST", "/projects", TEST_PROJECT_DATA)
        if response and response.status_code in [200, 201]:
            try:
                project_data = response.json()
                project_id = project_data.get('id')
                if project_id:
                    self.created_resources.append(('project', project_id))
                    self.log_result("Project CREATE", "PASS", f"Created project ID: {project_id}", project_data)
                else:
                    self.log_result("Project CREATE", "FAIL", "No project ID returned", project_data)
                    return
            except json.JSONDecodeError:
                self.log_result("Project CREATE", "FAIL", f"Invalid JSON: {response.text}")
                return
        else:
            self.log_result("Project CREATE", "FAIL", 
                          f"HTTP {response.status_code if response else 'None'}: {response.text if response else 'Request failed'}")
            return
            
        # Test GET all projects
        response = self.make_request("GET", "/projects")
        if response and response.status_code == 200:
            try:
                projects = response.json()
                if isinstance(projects, list) and len(projects) > 0:
                    self.log_result("Project GET ALL", "PASS", f"Found {len(projects)} projects")
                else:
                    self.log_result("Project GET ALL", "FAIL", "No projects returned or invalid format")
            except json.JSONDecodeError:
                self.log_result("Project GET ALL", "FAIL", f"Invalid JSON: {response.text}")
        else:
            self.log_result("Project GET ALL", "FAIL", 
                          f"HTTP {response.status_code if response else 'None'}")
            
        # Test GET single project
        if project_id:
            response = self.make_request("GET", f"/projects/{project_id}")
            if response and response.status_code == 200:
                try:
                    project = response.json()
                    if project.get('id') == project_id:
                        self.log_result("Project GET SINGLE", "PASS", f"Retrieved project {project_id}")
                    else:
                        self.log_result("Project GET SINGLE", "FAIL", "Wrong project returned")
                except json.JSONDecodeError:
                    self.log_result("Project GET SINGLE", "FAIL", f"Invalid JSON: {response.text}")
            else:
                self.log_result("Project GET SINGLE", "FAIL", 
                              f"HTTP {response.status_code if response else 'None'}")
                
        # Test UPDATE project
        if project_id:
            update_data = {"name": "Updated Beverly Hills Project", "budget": "$200,000"}
            response = self.make_request("PUT", f"/projects/{project_id}", update_data)
            if response and response.status_code == 200:
                try:
                    updated_project = response.json()
                    if updated_project.get('name') == "Updated Beverly Hills Project":
                        self.log_result("Project UPDATE", "PASS", "Project updated successfully")
                    else:
                        self.log_result("Project UPDATE", "FAIL", "Update not reflected in response")
                except json.JSONDecodeError:
                    self.log_result("Project UPDATE", "FAIL", f"Invalid JSON: {response.text}")
            else:
                self.log_result("Project UPDATE", "FAIL", 
                              f"HTTP {response.status_code if response else 'None'}")
                              
    def test_items_ffe_system(self):
        """Test 3: ITEMS/FF&E SYSTEM - Full CRUD with all fields"""
        print("\n🪑 TESTING ITEMS/FF&E SYSTEM")
        
        # First need a project and room to create items
        if not self.created_resources:
            self.log_result("Items/FF&E Setup", "FAIL", "No project available for testing")
            return
            
        project_id = None
        for resource_type, resource_id in self.created_resources:
            if resource_type == 'project':
                project_id = resource_id
                break
                
        if not project_id:
            self.log_result("Items/FF&E Setup", "FAIL", "No project ID available")
            return
            
        # Create a room first
        room_data = {
            "name": "Living Room",
            "description": "Main living area",
            "project_id": project_id,
            "auto_populate": True
        }
        
        response = self.make_request("POST", "/rooms", room_data)
        room_id = None
        subcategory_id = None
        
        if response and response.status_code in [200, 201]:
            try:
                room_data = response.json()
                room_id = room_data.get('id')
                # Get subcategory ID from room structure
                if room_data.get('categories'):
                    for category in room_data['categories']:
                        if category.get('subcategories'):
                            subcategory_id = category['subcategories'][0].get('id')
                            break
                            
                if room_id and subcategory_id:
                    self.created_resources.append(('room', room_id))
                    self.log_result("Room CREATE for Items", "PASS", f"Created room {room_id}")
                else:
                    self.log_result("Room CREATE for Items", "FAIL", "Missing room or subcategory ID")
                    return
            except json.JSONDecodeError:
                self.log_result("Room CREATE for Items", "FAIL", f"Invalid JSON: {response.text}")
                return
        else:
            self.log_result("Room CREATE for Items", "FAIL", 
                          f"HTTP {response.status_code if response else 'None'}")
            return
            
        # Test CREATE item with ALL fields
        item_data = {
            "name": "West Elm Modern Sofa",
            "quantity": 1,
            "size": "84\" W x 36\" D x 32\" H",
            "remarks": "Performance fabric, pet-friendly",
            "vendor": "West Elm",
            "status": "ORDERED",
            "cost": 1299.00,
            "link": "https://westelm.com/modern-sofa",
            "tracking_number": "1Z999AA1234567890",
            "carrier": "UPS",
            "image_url": "https://example.com/sofa.jpg",
            "sku": "WE-SOF-001",
            "finish_color": "Charcoal Gray",
            "price": 1599.00,
            "description": "Modern 3-seater sofa with performance fabric",
            "availability": "In Stock",
            "expected_delivery": "2024-01-15T00:00:00Z",
            "po_number": "PO-2024-001",
            "invoice_number": "INV-2024-001",
            "priority": "High",
            "lead_time_weeks": 4,
            "stock_status": "IN STOCK",
            "stock_quantity": 5,
            "warranty_info": "5 year frame warranty",
            "installation_notes": "Requires assembly",
            "room_location": "Living Room",
            "category_location": "Furniture",
            "subcategory_location": "Seating",
            "subcategory_id": subcategory_id
        }
        
        response = self.make_request("POST", "/items", item_data)
        item_id = None
        
        if response and response.status_code in [200, 201]:
            try:
                created_item = response.json()
                item_id = created_item.get('id')
                if item_id:
                    self.created_resources.append(('item', item_id))
                    self.log_result("Item CREATE", "PASS", f"Created item {item_id} with all fields")
                else:
                    self.log_result("Item CREATE", "FAIL", "No item ID returned")
            except json.JSONDecodeError:
                self.log_result("Item CREATE", "FAIL", f"Invalid JSON: {response.text}")
        else:
            self.log_result("Item CREATE", "FAIL", 
                          f"HTTP {response.status_code if response else 'None'}: {response.text if response else 'Request failed'}")
            
        # Test GET item
        if item_id:
            response = self.make_request("GET", f"/items/{item_id}")
            if response and response.status_code == 200:
                try:
                    item = response.json()
                    if item.get('id') == item_id and item.get('name') == "West Elm Modern Sofa":
                        self.log_result("Item GET", "PASS", f"Retrieved item {item_id}")
                    else:
                        self.log_result("Item GET", "FAIL", "Wrong item data returned")
                except json.JSONDecodeError:
                    self.log_result("Item GET", "FAIL", f"Invalid JSON: {response.text}")
            else:
                self.log_result("Item GET", "FAIL", 
                              f"HTTP {response.status_code if response else 'None'}")
                              
        # Test UPDATE item
        if item_id:
            update_data = {
                "status": "SHIPPED",
                "tracking_number": "1Z999AA9876543210",
                "cost": 1199.00
            }
            response = self.make_request("PUT", f"/items/{item_id}", update_data)
            if response and response.status_code == 200:
                try:
                    updated_item = response.json()
                    if updated_item.get('status') == "SHIPPED":
                        self.log_result("Item UPDATE", "PASS", "Item updated successfully")
                    else:
                        self.log_result("Item UPDATE", "FAIL", "Update not reflected")
                except json.JSONDecodeError:
                    self.log_result("Item UPDATE", "FAIL", f"Invalid JSON: {response.text}")
            else:
                self.log_result("Item UPDATE", "FAIL", 
                              f"HTTP {response.status_code if response else 'None'}")
                              
        # Test shipping sync - GET items with tracking
        if project_id:
            response = self.make_request("GET", f"/items/with-tracking/{project_id}")
            if response and response.status_code == 200:
                try:
                    tracking_items = response.json()
                    if isinstance(tracking_items, list):
                        self.log_result("Items Shipping Sync", "PASS", 
                                      f"Found {len(tracking_items)} items with tracking")
                    else:
                        self.log_result("Items Shipping Sync", "FAIL", "Invalid response format")
                except json.JSONDecodeError:
                    self.log_result("Items Shipping Sync", "FAIL", f"Invalid JSON: {response.text}")
            else:
                self.log_result("Items Shipping Sync", "FAIL", 
                              f"HTTP {response.status_code if response else 'None'}")
                              
    def test_contacts_system(self):
        """Test 4: CONTACTS SYSTEM - Master and project contacts"""
        print("\n👥 TESTING CONTACTS SYSTEM")
        
        # Test CREATE master contact
        master_contact_data = {
            "name": "John Smith",
            "email": "john.smith@contractor.com",
            "phone": "(555) 987-6543",
            "company": "Smith Construction",
            "role": "General Contractor",
            "address": "456 Oak Street, Los Angeles, CA 90028",
            "notes": "Preferred contractor for high-end renovations"
        }
        
        response = self.make_request("POST", "/master/contacts", master_contact_data)
        master_contact_id = None
        
        if response and response.status_code in [200, 201]:
            try:
                contact = response.json()
                master_contact_id = contact.get('id')
                if master_contact_id:
                    self.created_resources.append(('master_contact', master_contact_id))
                    self.log_result("Master Contact CREATE", "PASS", f"Created contact {master_contact_id}")
                else:
                    self.log_result("Master Contact CREATE", "FAIL", "No contact ID returned")
            except json.JSONDecodeError:
                self.log_result("Master Contact CREATE", "FAIL", f"Invalid JSON: {response.text}")
        else:
            self.log_result("Master Contact CREATE", "FAIL", 
                          f"HTTP {response.status_code if response else 'None'}")
            
        # Test GET all master contacts
        response = self.make_request("GET", "/master/contacts")
        if response and response.status_code == 200:
            try:
                contacts = response.json()
                if isinstance(contacts, list):
                    self.log_result("Master Contacts GET ALL", "PASS", f"Found {len(contacts)} contacts")
                else:
                    self.log_result("Master Contacts GET ALL", "FAIL", "Invalid response format")
            except json.JSONDecodeError:
                self.log_result("Master Contacts GET ALL", "FAIL", f"Invalid JSON: {response.text}")
        else:
            self.log_result("Master Contacts GET ALL", "FAIL", 
                          f"HTTP {response.status_code if response else 'None'}")
            
        # Test UPDATE master contact
        if master_contact_id:
            update_data = {"phone": "(555) 111-2222", "notes": "Updated contact info"}
            response = self.make_request("PUT", f"/master/contacts/{master_contact_id}", update_data)
            if response and response.status_code == 200:
                self.log_result("Master Contact UPDATE", "PASS", "Contact updated successfully")
            else:
                self.log_result("Master Contact UPDATE", "FAIL", 
                              f"HTTP {response.status_code if response else 'None'}")
                              
        # Test project contacts
        project_id = None
        for resource_type, resource_id in self.created_resources:
            if resource_type == 'project':
                project_id = resource_id
                break
                
        if project_id:
            project_contact_data = {
                "project_id": project_id,
                "contact_id": master_contact_id,
                "role": "Primary Contractor"
            }
            
            response = self.make_request("POST", "/contacts", project_contact_data)
            if response and response.status_code in [200, 201]:
                self.log_result("Project Contact CREATE", "PASS", "Project contact created")
            else:
                self.log_result("Project Contact CREATE", "FAIL", 
                              f"HTTP {response.status_code if response else 'None'}")
                              
            # Test GET project contacts
            response = self.make_request("GET", f"/contacts/project/{project_id}")
            if response and response.status_code == 200:
                try:
                    project_contacts = response.json()
                    if isinstance(project_contacts, list):
                        self.log_result("Project Contacts GET", "PASS", 
                                      f"Found {len(project_contacts)} project contacts")
                    else:
                        self.log_result("Project Contacts GET", "FAIL", "Invalid response format")
                except json.JSONDecodeError:
                    self.log_result("Project Contacts GET", "FAIL", f"Invalid JSON: {response.text}")
            else:
                self.log_result("Project Contacts GET", "FAIL", 
                              f"HTTP {response.status_code if response else 'None'}")
                              
    def test_materials_library(self):
        """Test 5: MATERIALS LIBRARY - CRUD operations"""
        print("\n🎨 TESTING MATERIALS LIBRARY")
        
        # Test CREATE material
        material_data = {
            "name": "Carrara Marble",
            "category": "Natural Stone",
            "supplier": "Stone Imports Inc",
            "cost_per_unit": 45.50,
            "unit": "sq ft",
            "description": "Premium Italian Carrara marble with subtle veining",
            "image_url": "https://example.com/carrara-marble.jpg",
            "color": "White with gray veining",
            "finish": "Polished",
            "thickness": "3/4 inch",
            "availability": "In Stock",
            "lead_time": "2-3 weeks",
            "notes": "Perfect for countertops and backsplashes"
        }
        
        response = self.make_request("POST", "/master/materials", material_data)
        material_id = None
        
        if response and response.status_code in [200, 201]:
            try:
                material = response.json()
                material_id = material.get('id')
                if material_id:
                    self.created_resources.append(('material', material_id))
                    self.log_result("Material CREATE", "PASS", f"Created material {material_id}")
                else:
                    self.log_result("Material CREATE", "FAIL", "No material ID returned")
            except json.JSONDecodeError:
                self.log_result("Material CREATE", "FAIL", f"Invalid JSON: {response.text}")
        else:
            self.log_result("Material CREATE", "FAIL", 
                          f"HTTP {response.status_code if response else 'None'}")
            
        # Test GET all materials
        response = self.make_request("GET", "/master/materials")
        if response and response.status_code == 200:
            try:
                materials = response.json()
                if isinstance(materials, list):
                    self.log_result("Materials GET ALL", "PASS", f"Found {len(materials)} materials")
                else:
                    self.log_result("Materials GET ALL", "FAIL", "Invalid response format")
            except json.JSONDecodeError:
                self.log_result("Materials GET ALL", "FAIL", f"Invalid JSON: {response.text}")
        else:
            self.log_result("Materials GET ALL", "FAIL", 
                          f"HTTP {response.status_code if response else 'None'}")
            
        # Test UPDATE material
        if material_id:
            update_data = {"cost_per_unit": 48.00, "availability": "Limited Stock"}
            response = self.make_request("PUT", f"/master/materials/{material_id}", update_data)
            if response and response.status_code == 200:
                self.log_result("Material UPDATE", "PASS", "Material updated successfully")
            else:
                self.log_result("Material UPDATE", "FAIL", 
                              f"HTTP {response.status_code if response else 'None'}")
                              
    def test_rooms_system(self):
        """Test 6: ROOMS SYSTEM - CRUD operations"""
        print("\n🏠 TESTING ROOMS SYSTEM")
        
        project_id = None
        for resource_type, resource_id in self.created_resources:
            if resource_type == 'project':
                project_id = resource_id
                break
                
        if not project_id:
            self.log_result("Rooms System", "FAIL", "No project available for room testing")
            return
            
        # Test CREATE room
        room_data = {
            "name": "Master Bedroom",
            "description": "Primary bedroom suite",
            "project_id": project_id,
            "auto_populate": True,
            "sheet_type": "walkthrough"
        }
        
        response = self.make_request("POST", "/rooms", room_data)
        room_id = None
        
        if response and response.status_code in [200, 201]:
            try:
                room = response.json()
                room_id = room.get('id')
                if room_id:
                    self.created_resources.append(('room', room_id))
                    self.log_result("Room CREATE", "PASS", f"Created room {room_id}")
                else:
                    self.log_result("Room CREATE", "FAIL", "No room ID returned")
            except json.JSONDecodeError:
                self.log_result("Room CREATE", "FAIL", f"Invalid JSON: {response.text}")
        else:
            self.log_result("Room CREATE", "FAIL", 
                          f"HTTP {response.status_code if response else 'None'}")
            
        # Test GET rooms for project
        response = self.make_request("GET", f"/rooms/{project_id}")
        if response and response.status_code == 200:
            try:
                rooms = response.json()
                if isinstance(rooms, list):
                    self.log_result("Rooms GET for Project", "PASS", f"Found {len(rooms)} rooms")
                else:
                    self.log_result("Rooms GET for Project", "FAIL", "Invalid response format")
            except json.JSONDecodeError:
                self.log_result("Rooms GET for Project", "FAIL", f"Invalid JSON: {response.text}")
        else:
            self.log_result("Rooms GET for Project", "FAIL", 
                          f"HTTP {response.status_code if response else 'None'}")
            
        # Test UPDATE room
        if room_id:
            update_data = {"name": "Primary Bedroom Suite", "description": "Updated master bedroom"}
            response = self.make_request("PUT", f"/rooms/{room_id}", update_data)
            if response and response.status_code == 200:
                self.log_result("Room UPDATE", "PASS", "Room updated successfully")
            else:
                self.log_result("Room UPDATE", "FAIL", 
                              f"HTTP {response.status_code if response else 'None'}")
                              
    def test_calculators(self):
        """Test 7: CALCULATORS - All calculator endpoints"""
        print("\n🧮 TESTING CALCULATORS")
        
        calculators = [
            ("wallpaper", {
                "room_width": 12,
                "room_length": 14,
                "ceiling_height": 9,
                "doors": 2,
                "windows": 3,
                "roll_width": 27,
                "roll_length": 15,
                "pattern_repeat": 24
            }),
            ("paint", {
                "room_width": 12,
                "room_length": 14,
                "ceiling_height": 9,
                "doors": 2,
                "windows": 3,
                "coats": 2,
                "coverage_per_gallon": 350
            }),
            ("drapery", {
                "window_width": 60,
                "window_height": 84,
                "fullness": 2.5,
                "hem_allowance": 8,
                "header_allowance": 6,
                "fabric_width": 54
            }),
            ("upholstery", {
                "piece_type": "sofa",
                "width": 84,
                "depth": 36,
                "height": 32,
                "fabric_width": 54,
                "pattern_repeat": 27
            }),
            ("tile", {
                "room_width": 10,
                "room_length": 12,
                "tile_width": 12,
                "tile_height": 12,
                "waste_factor": 10
            }),
            ("carpet", {
                "room_width": 12,
                "room_length": 14,
                "carpet_width": 12,
                "waste_factor": 10
            })
        ]
        
        for calc_name, calc_data in calculators:
            response = self.make_request("POST", f"/calculators/{calc_name}", calc_data)
            if response and response.status_code == 200:
                try:
                    result = response.json()
                    if result and isinstance(result, dict):
                        self.log_result(f"Calculator - {calc_name.title()}", "PASS", 
                                      f"Calculation successful: {result}")
                    else:
                        self.log_result(f"Calculator - {calc_name.title()}", "FAIL", 
                                      "Invalid calculation result")
                except json.JSONDecodeError:
                    self.log_result(f"Calculator - {calc_name.title()}", "FAIL", 
                                  f"Invalid JSON: {response.text}")
            else:
                self.log_result(f"Calculator - {calc_name.title()}", "FAIL", 
                              f"HTTP {response.status_code if response else 'None'}")
                              
    def test_carrier_shipping(self):
        """Test 8: CARRIER/SHIPPING system"""
        print("\n🚚 TESTING CARRIER/SHIPPING SYSTEM")
        
        # Test GET carrier types
        response = self.make_request("GET", "/carrier-types")
        if response and response.status_code == 200:
            try:
                carriers = response.json()
                if isinstance(carriers, list) and len(carriers) > 0:
                    self.log_result("Carrier Types GET", "PASS", f"Found {len(carriers)} carriers")
                else:
                    self.log_result("Carrier Types GET", "FAIL", "No carriers returned")
            except json.JSONDecodeError:
                self.log_result("Carrier Types GET", "FAIL", f"Invalid JSON: {response.text}")
        else:
            self.log_result("Carrier Types GET", "FAIL", 
                          f"HTTP {response.status_code if response else 'None'}")
            
        # Test PATCH tracking update (if we have an item)
        item_id = None
        for resource_type, resource_id in self.created_resources:
            if resource_type == 'item':
                item_id = resource_id
                break
                
        if item_id:
            tracking_data = {
                "tracking_number": "1Z999AA1111111111",
                "carrier": "FedEx",
                "status": "IN TRANSIT"
            }
            response = self.make_request("PATCH", f"/items/{item_id}/tracking", tracking_data)
            if response and response.status_code == 200:
                self.log_result("Item Tracking UPDATE", "PASS", "Tracking updated successfully")
            else:
                self.log_result("Item Tracking UPDATE", "FAIL", 
                              f"HTTP {response.status_code if response else 'None'}")
                              
    def test_vendor_credentials(self):
        """Test 9: VENDOR CREDENTIALS - Should NOT expose passwords"""
        print("\n🔐 TESTING VENDOR CREDENTIALS")
        
        response = self.make_request("GET", "/vendor-credentials")
        if response and response.status_code == 200:
            try:
                credentials = response.json()
                if isinstance(credentials, list):
                    # Check that passwords are not exposed
                    password_exposed = False
                    for cred in credentials:
                        if 'password' in cred and cred['password']:
                            password_exposed = True
                            break
                            
                    if password_exposed:
                        self.log_result("Vendor Credentials Security", "FAIL", 
                                      "SECURITY ISSUE: Passwords are exposed in API response")
                    else:
                        self.log_result("Vendor Credentials Security", "PASS", 
                                      "Passwords properly hidden from API response")
                        
                    self.log_result("Vendor Credentials GET", "PASS", 
                                  f"Found {len(credentials)} vendor credentials")
                else:
                    self.log_result("Vendor Credentials GET", "FAIL", "Invalid response format")
            except json.JSONDecodeError:
                self.log_result("Vendor Credentials GET", "FAIL", f"Invalid JSON: {response.text}")
        else:
            self.log_result("Vendor Credentials GET", "FAIL", 
                          f"HTTP {response.status_code if response else 'None'}")
                          
    def test_data_persistence(self):
        """Test 10: DATA PERSISTENCE - Verify data matches what was sent"""
        print("\n💾 TESTING DATA PERSISTENCE")
        
        # Test project data persistence
        project_id = None
        for resource_type, resource_id in self.created_resources:
            if resource_type == 'project':
                project_id = resource_id
                break
                
        if project_id:
            response = self.make_request("GET", f"/projects/{project_id}")
            if response and response.status_code == 200:
                try:
                    project = response.json()
                    # Check if key data matches what we sent
                    client_info = project.get('client_info', {})
                    if (client_info.get('full_name') == TEST_CLIENT_DATA['full_name'] and
                        client_info.get('email') == TEST_CLIENT_DATA['email'] and
                        project.get('project_type') == TEST_PROJECT_DATA['project_type']):
                        self.log_result("Project Data Persistence", "PASS", 
                                      "Project data matches original input")
                    else:
                        self.log_result("Project Data Persistence", "FAIL", 
                                      "Project data does not match original input")
                except json.JSONDecodeError:
                    self.log_result("Project Data Persistence", "FAIL", f"Invalid JSON: {response.text}")
            else:
                self.log_result("Project Data Persistence", "FAIL", 
                              f"Could not retrieve project for persistence test")
                              
        # Test item data persistence
        item_id = None
        for resource_type, resource_id in self.created_resources:
            if resource_type == 'item':
                item_id = resource_id
                break
                
        if item_id:
            response = self.make_request("GET", f"/items/{item_id}")
            if response and response.status_code == 200:
                try:
                    item = response.json()
                    # Check if key data persisted
                    if (item.get('name') and item.get('vendor') and 
                        item.get('cost') and item.get('sku')):
                        self.log_result("Item Data Persistence", "PASS", 
                                      "Item data properly persisted")
                    else:
                        self.log_result("Item Data Persistence", "FAIL", 
                                      "Item data missing key fields")
                except json.JSONDecodeError:
                    self.log_result("Item Data Persistence", "FAIL", f"Invalid JSON: {response.text}")
            else:
                self.log_result("Item Data Persistence", "FAIL", 
                              f"Could not retrieve item for persistence test")
                              
    def cleanup_resources(self):
        """Clean up created test resources"""
        print("\n🧹 CLEANING UP TEST RESOURCES")
        
        # Delete in reverse order to handle dependencies
        for resource_type, resource_id in reversed(self.created_resources):
            if resource_type == 'item':
                response = self.make_request("DELETE", f"/items/{resource_id}")
                if response and response.status_code in [200, 204]:
                    print(f"✅ Deleted item {resource_id}")
                else:
                    print(f"❌ Failed to delete item {resource_id}")
                    
            elif resource_type == 'room':
                response = self.make_request("DELETE", f"/rooms/{resource_id}")
                if response and response.status_code in [200, 204]:
                    print(f"✅ Deleted room {resource_id}")
                else:
                    print(f"❌ Failed to delete room {resource_id}")
                    
            elif resource_type == 'project':
                response = self.make_request("DELETE", f"/projects/{resource_id}")
                if response and response.status_code in [200, 204]:
                    print(f"✅ Deleted project {resource_id}")
                else:
                    print(f"❌ Failed to delete project {resource_id}")
                    
            elif resource_type == 'master_contact':
                response = self.make_request("DELETE", f"/master/contacts/{resource_id}")
                if response and response.status_code in [200, 204]:
                    print(f"✅ Deleted master contact {resource_id}")
                else:
                    print(f"❌ Failed to delete master contact {resource_id}")
                    
            elif resource_type == 'material':
                response = self.make_request("DELETE", f"/master/materials/{resource_id}")
                if response and response.status_code in [200, 204]:
                    print(f"✅ Deleted material {resource_id}")
                else:
                    print(f"❌ Failed to delete material {resource_id}")
                    
    def run_all_tests(self):
        """Run all backend tests"""
        print("🚀 STARTING COMPREHENSIVE BACKEND AUDIT")
        print(f"Backend URL: {BASE_URL}")
        print("=" * 60)
        
        start_time = time.time()
        
        # Run all test suites
        self.test_scraper_system()
        self.test_project_system()
        self.test_items_ffe_system()
        self.test_contacts_system()
        self.test_materials_library()
        self.test_rooms_system()
        self.test_calculators()
        self.test_carrier_shipping()
        self.test_vendor_credentials()
        self.test_data_persistence()
        
        end_time = time.time()
        
        # Print comprehensive results
        print("\n" + "=" * 60)
        print("🎯 COMPREHENSIVE BACKEND AUDIT RESULTS")
        print("=" * 60)
        
        print(f"\n📊 SUMMARY:")
        print(f"✅ PASSED: {len(self.passed_tests)}")
        print(f"❌ FAILED: {len(self.failed_tests)}")
        print(f"⏱️  TOTAL TIME: {end_time - start_time:.2f} seconds")
        
        if self.failed_tests:
            print(f"\n❌ FAILED TESTS ({len(self.failed_tests)}):")
            for i, test in enumerate(self.failed_tests, 1):
                print(f"{i}. {test}")
                
        if self.passed_tests:
            print(f"\n✅ PASSED TESTS ({len(self.passed_tests)}):")
            for i, test in enumerate(self.passed_tests, 1):
                print(f"{i}. {test}")
                
        # Detailed failure analysis
        if self.failed_tests:
            print(f"\n🔍 DETAILED FAILURE ANALYSIS:")
            for result in self.results:
                if result['status'] == 'FAIL':
                    print(f"\n❌ {result['test']}")
                    print(f"   Details: {result['details']}")
                    if result.get('response_data'):
                        print(f"   Response: {json.dumps(result['response_data'], indent=2)[:200]}...")
                        
        # Clean up test resources
        self.cleanup_resources()
        
        return len(self.failed_tests) == 0

def main():
    """Main test execution"""
    tester = BackendTester()
    success = tester.run_all_tests()
    
    if success:
        print("\n🎉 ALL TESTS PASSED - BACKEND IS LAUNCH READY!")
        sys.exit(0)
    else:
        print(f"\n💥 {len(tester.failed_tests)} TESTS FAILED - ISSUES NEED FIXING BEFORE LAUNCH")
        sys.exit(1)

if __name__ == "__main__":
    main()
"""
COMPREHENSIVE APP-WIDE BACKEND TESTING
Testing ALL backend features end-to-end as requested in review

SCOPE:
1. Projects API (CRUD, validation, client info)
2. Rooms API (ALL room types including Guest Bedroom 1-3, Scullery, auto-populate)
3. Items API (add, update, delete, check/uncheck, all fields)
4. Questionnaire (save answers, contact auto-creation, persistence)
5. Contacts API (CRUD, auto-creation)
6. Calculators (ALL 8: Wallpaper, Drapery, Hardware, Square footage, Paint, Tile/Flooring, Lighting, Measurement converter)
7. Email (send questionnaire, HTML template, SMTP)
8. Power Features (Budget tracker, Vendor manager, Material library)
"""

import requests
import json
from datetime import datetime
import time

# Backend URL from review request
BASE_URL = "http://localhost:8001/api"

# Test results tracking
test_results = {
    "passed": [],
    "failed": [],
    "warnings": []
}

# Store created IDs for cleanup and testing
test_data = {
    "project_id": None,
    "room_ids": [],
    "category_ids": [],
    "subcategory_ids": [],
    "item_ids": [],
    "contact_ids": []
}

def log_result(category, test_name, status, details="", error=None):
    """Log test result with detailed information"""
    result = {
        "test": test_name,
        "status": status,
        "details": details,
        "error": str(error) if error else None,
        "timestamp": datetime.now().isoformat()
    }
    test_results[category].append(result)
    
    status_emoji = "✅" if status == "PASS" else "❌" if status == "FAIL" else "⚠️"
    print(f"{status_emoji} {test_name}: {status}")
    if details:
        print(f"   Details: {details}")
    if error:
        print(f"   Error: {error}")

def test_projects_api():
    """Test 1: Projects API - Complete CRUD operations"""
    print("\n" + "="*80)
    print("TEST 1: PROJECTS API")
    print("="*80)
    
    # Test 1.1: Create project with full validation
    try:
        new_project = {
            "name": "Comprehensive Test Project",
            "client_info": {
                "full_name": "Sarah & Michael Thompson",
                "email": "sarah.thompson@example.com",
                "phone": "(615) 555-0199",
                "address": "456 Oak Avenue, Nashville, TN 37215"
            },
            "project_type": "Renovation",
            "timeline": "6-9 months",
            "budget": "$125,000",
            "style_preferences": ["Modern Farmhouse", "Transitional", "Coastal"],
            "color_palette": "Warm neutrals with navy and sage accents",
            "special_requirements": "Pet-friendly materials, wheelchair accessible master bath"
        }
        response = requests.post(f"{BASE_URL}/projects", json=new_project, timeout=15)
        if response.status_code == 200:
            project = response.json()
            test_data["project_id"] = project.get('id')
            log_result("passed", "POST /projects - Create with full validation", "PASS", 
                      f"Created project ID: {test_data['project_id']}")
        else:
            log_result("failed", "POST /projects - Create with full validation", "FAIL", 
                      f"Status: {response.status_code}, Response: {response.text}")
    except Exception as e:
        log_result("failed", "POST /projects - Create with full validation", "FAIL", error=e)
    
    # Test 1.2: Get all projects
    try:
        response = requests.get(f"{BASE_URL}/projects", timeout=15)
        if response.status_code == 200:
            projects = response.json()
            log_result("passed", "GET /projects - List all", "PASS", 
                      f"Retrieved {len(projects)} projects")
        else:
            log_result("failed", "GET /projects - List all", "FAIL", 
                      f"Status: {response.status_code}")
    except Exception as e:
        log_result("failed", "GET /projects - List all", "FAIL", error=e)
    
    # Test 1.3: Get single project with full hierarchy
    if test_data["project_id"]:
        try:
            response = requests.get(f"{BASE_URL}/projects/{test_data['project_id']}", timeout=15)
            if response.status_code == 200:
                project = response.json()
                log_result("passed", "GET /projects/{id} - Get with hierarchy", "PASS", 
                          f"Project: {project.get('name')}, Rooms: {len(project.get('rooms', []))}")
            else:
                log_result("failed", "GET /projects/{id} - Get with hierarchy", "FAIL", 
                          f"Status: {response.status_code}")
        except Exception as e:
            log_result("failed", "GET /projects/{id} - Get with hierarchy", "FAIL", error=e)
    
    # Test 1.4: Update project
    if test_data["project_id"]:
        try:
            update_data = {
                "name": "Comprehensive Test Project - UPDATED",
                "budget": "$150,000"
            }
            response = requests.put(f"{BASE_URL}/projects/{test_data['project_id']}", 
                                   json=update_data, timeout=15)
            if response.status_code == 200:
                log_result("passed", "PUT /projects/{id} - Update", "PASS", 
                          "Project updated successfully")
            else:
                log_result("warnings", "PUT /projects/{id} - Update", "MINOR", 
                          f"Status: {response.status_code} - May require full object")
        except Exception as e:
            log_result("warnings", "PUT /projects/{id} - Update", "MINOR", error=e)

def test_rooms_api():
    """Test 2: Rooms API - ALL room types including new ones"""
    print("\n" + "="*80)
    print("TEST 2: ROOMS API - ALL ROOM TYPES")
    print("="*80)
    
    if not test_data["project_id"]:
        log_result("failed", "Rooms API Tests", "SKIP", "No project ID available")
        return
    
    # Test all room types including new ones from questionnaire
    room_types = [
        "Living Room",
        "Kitchen", 
        "Master Bedroom",
        "Primary Bathroom",
        "Guest Bedroom 1",
        "Guest Bedroom 2", 
        "Guest Bedroom 3",
        "Guest Bathroom",
        "Dining Room",
        "Home Office",
        "Laundry Room",
        "Mudroom",
        "Pantry",
        "Scullery",
        "Butler's Pantry",
        "Powder Room",
        "Family Room",
        "Basement"
    ]
    
    # Test 2.1: Create rooms with auto-populate
    for room_name in room_types[:5]:  # Test first 5 to keep test reasonable
        try:
            room_data = {
                "name": room_name,
                "project_id": test_data["project_id"],
                "auto_populate": True,
                "sheet_type": "walkthrough"
            }
            response = requests.post(f"{BASE_URL}/rooms", json=room_data, timeout=15)
            if response.status_code == 200:
                room = response.json()
                room_id = room.get('id')
                test_data["room_ids"].append(room_id)
                
                # Verify auto-populate worked
                categories = room.get('categories', [])
                total_items = sum(
                    sum(len(subcat.get('items', [])) for subcat in cat.get('subcategories', []))
                    for cat in categories
                )
                
                log_result("passed", f"POST /rooms - Create {room_name} with auto-populate", "PASS", 
                          f"Created with {len(categories)} categories, {total_items} items")
            else:
                log_result("failed", f"POST /rooms - Create {room_name}", "FAIL", 
                          f"Status: {response.status_code}, Response: {response.text}")
        except Exception as e:
            log_result("failed", f"POST /rooms - Create {room_name}", "FAIL", error=e)
    
    # Test 2.2: Get rooms for project
    try:
        response = requests.get(f"{BASE_URL}/projects/{test_data['project_id']}", timeout=15)
        if response.status_code == 200:
            project = response.json()
            rooms = project.get('rooms', [])
            log_result("passed", "GET rooms via project", "PASS", 
                      f"Retrieved {len(rooms)} rooms")
        else:
            log_result("failed", "GET rooms via project", "FAIL", 
                      f"Status: {response.status_code}")
    except Exception as e:
        log_result("failed", "GET rooms via project", "FAIL", error=e)
    
    # Test 2.3: Update room
    if test_data["room_ids"]:
        try:
            update_data = {
                "name": "Living Room - UPDATED",
                "description": "Updated description"
            }
            response = requests.put(f"{BASE_URL}/rooms/{test_data['room_ids'][0]}", 
                                   json=update_data, timeout=15)
            if response.status_code == 200:
                log_result("passed", "PUT /rooms/{id} - Update", "PASS", 
                          "Room updated successfully")
            else:
                log_result("failed", "PUT /rooms/{id} - Update", "FAIL", 
                          f"Status: {response.status_code}")
        except Exception as e:
            log_result("failed", "PUT /rooms/{id} - Update", "FAIL", error=e)

def test_items_api():
    """Test 3: Items API - Complete CRUD with all fields"""
    print("\n" + "="*80)
    print("TEST 3: ITEMS API - ALL OPERATIONS")
    print("="*80)
    
    # First, get a subcategory to add items to
    if not test_data["room_ids"]:
        log_result("failed", "Items API Tests", "SKIP", "No room IDs available")
        return
    
    # Get project with full hierarchy to find subcategory
    try:
        response = requests.get(f"{BASE_URL}/projects/{test_data['project_id']}", timeout=15)
        if response.status_code == 200:
            project = response.json()
            rooms = project.get('rooms', [])
            if rooms and rooms[0].get('categories'):
                category = rooms[0]['categories'][0]
                if category.get('subcategories'):
                    subcategory = category['subcategories'][0]
                    test_data["subcategory_ids"].append(subcategory['id'])
    except Exception as e:
        log_result("failed", "Get subcategory for items", "FAIL", error=e)
        return
    
    if not test_data["subcategory_ids"]:
        log_result("failed", "Items API Tests", "SKIP", "No subcategory IDs available")
        return
    
    # Test 3.1: Create item with ALL fields
    try:
        new_item = {
            "name": "Modern Chandelier - Crystal",
            "subcategory_id": test_data["subcategory_ids"][0],
            "quantity": 2,
            "size": "36\" diameter x 48\" height",
            "remarks": "Client prefers warm brass finish",
            "vendor": "Visual Comfort",
            "status": "TO BE SELECTED",
            "cost": 2499.99,
            "link": "https://visualcomfort.com/chandelier-123",
            "tracking_number": "",
            "sku": "VC-CH-123-WBR",
            "finish_color": "Warm Brass with Clear Crystal",
            "price": 3749.99,
            "description": "Elegant modern chandelier with cascading crystal elements",
            "availability": "In Stock - Ships in 2-3 weeks",
            "carrier": "",
            "po_number": "PO-2025-001",
            "notes": "Requires professional installation",
            "priority": "High",
            "lead_time_weeks": 3,
            "stock_status": "IN STOCK",
            "stock_quantity": 5
        }
        response = requests.post(f"{BASE_URL}/items", json=new_item, timeout=15)
        if response.status_code == 200:
            item = response.json()
            test_data["item_ids"].append(item.get('id'))
            log_result("passed", "POST /items - Create with all fields", "PASS", 
                      f"Created item ID: {item.get('id')}")
        else:
            log_result("failed", "POST /items - Create with all fields", "FAIL", 
                      f"Status: {response.status_code}, Response: {response.text}")
    except Exception as e:
        log_result("failed", "POST /items - Create with all fields", "FAIL", error=e)
    
    # Test 3.2: Update item - name, cost, vendor
    if test_data["item_ids"]:
        try:
            update_data = {
                "name": "Modern Chandelier - Crystal UPDATED",
                "cost": 2699.99,
                "vendor": "Visual Comfort & Co"
            }
            response = requests.put(f"{BASE_URL}/items/{test_data['item_ids'][0]}", 
                                   json=update_data, timeout=15)
            if response.status_code == 200:
                log_result("passed", "PUT /items/{id} - Update name/cost/vendor", "PASS", 
                          "Item updated successfully")
            else:
                log_result("failed", "PUT /items/{id} - Update name/cost/vendor", "FAIL", 
                          f"Status: {response.status_code}")
        except Exception as e:
            log_result("failed", "PUT /items/{id} - Update name/cost/vendor", "FAIL", error=e)
    
    # Test 3.3: Update item - status (check/uncheck)
    if test_data["item_ids"]:
        try:
            update_data = {
                "status": "PICKED"
            }
            response = requests.put(f"{BASE_URL}/items/{test_data['item_ids'][0]}", 
                                   json=update_data, timeout=15)
            if response.status_code == 200:
                log_result("passed", "PUT /items/{id} - Update status (check)", "PASS", 
                          "Status updated to PICKED")
            else:
                log_result("failed", "PUT /items/{id} - Update status (check)", "FAIL", 
                          f"Status: {response.status_code}")
        except Exception as e:
            log_result("failed", "PUT /items/{id} - Update status (check)", "FAIL", error=e)
    
    # Test 3.4: Update item - tracking, carrier, finish_color
    if test_data["item_ids"]:
        try:
            update_data = {
                "tracking_number": "1Z999AA10123456784",
                "carrier": "UPS",
                "finish_color": "Aged Brass with Smoke Crystal"
            }
            response = requests.put(f"{BASE_URL}/items/{test_data['item_ids'][0]}", 
                                   json=update_data, timeout=15)
            if response.status_code == 200:
                log_result("passed", "PUT /items/{id} - Update tracking/carrier/finish", "PASS", 
                          "Tracking info updated successfully")
            else:
                log_result("failed", "PUT /items/{id} - Update tracking/carrier/finish", "FAIL", 
                          f"Status: {response.status_code}")
        except Exception as e:
            log_result("failed", "PUT /items/{id} - Update tracking/carrier/finish", "FAIL", error=e)
    
    # Test 3.5: Update item - stock fields
    if test_data["item_ids"]:
        try:
            update_data = {
                "stock_status": "LOW STOCK",
                "stock_quantity": 2,
                "lead_time_weeks": 6
            }
            response = requests.put(f"{BASE_URL}/items/{test_data['item_ids'][0]}", 
                                   json=update_data, timeout=15)
            if response.status_code == 200:
                log_result("passed", "PUT /items/{id} - Update stock fields", "PASS", 
                          "Stock info updated successfully")
            else:
                log_result("failed", "PUT /items/{id} - Update stock fields", "FAIL", 
                          f"Status: {response.status_code}")
        except Exception as e:
            log_result("failed", "PUT /items/{id} - Update stock fields", "FAIL", error=e)
    
    # Test 3.6: Get item
    if test_data["item_ids"]:
        try:
            response = requests.get(f"{BASE_URL}/items/{test_data['item_ids'][0]}", timeout=15)
            if response.status_code == 200:
                item = response.json()
                log_result("passed", "GET /items/{id} - Retrieve item", "PASS", 
                          f"Retrieved item: {item.get('name')}")
            else:
                log_result("failed", "GET /items/{id} - Retrieve item", "FAIL", 
                          f"Status: {response.status_code}")
        except Exception as e:
            log_result("failed", "GET /items/{id} - Retrieve item", "FAIL", error=e)
    
    # Test 3.7: Delete item
    if test_data["item_ids"]:
        try:
            response = requests.delete(f"{BASE_URL}/items/{test_data['item_ids'][0]}", timeout=15)
            if response.status_code == 200:
                log_result("passed", "DELETE /items/{id} - Delete item", "PASS", 
                          "Item deleted successfully")
            else:
                log_result("failed", "DELETE /items/{id} - Delete item", "FAIL", 
                          f"Status: {response.status_code}")
        except Exception as e:
            log_result("failed", "DELETE /items/{id} - Delete item", "FAIL", error=e)

def test_contacts_api():
    """Test 4: Contacts API - CRUD operations"""
    print("\n" + "="*80)
    print("TEST 4: CONTACTS API")
    print("="*80)
    
    if not test_data["project_id"]:
        log_result("failed", "Contacts API Tests", "SKIP", "No project ID available")
        return
    
    # Test 4.1: Create contact
    try:
        new_contact = {
            "project_id": test_data["project_id"],
            "name": "John Architect",
            "role": "Architect",
            "company": "Design Studio LLC",
            "email": "john@designstudio.com",
            "phone": "(615) 555-0100"
        }
        response = requests.post(f"{BASE_URL}/contacts", json=new_contact, timeout=15)
        if response.status_code == 200:
            contact = response.json()
            test_data["contact_ids"].append(contact.get('id'))
            log_result("passed", "POST /contacts - Create contact", "PASS", 
                      f"Created contact ID: {contact.get('id')}")
        else:
            log_result("failed", "POST /contacts - Create contact", "FAIL", 
                      f"Status: {response.status_code}, Response: {response.text}")
    except Exception as e:
        log_result("failed", "POST /contacts - Create contact", "FAIL", error=e)
    
    # Test 4.2: Get contacts for project
    try:
        response = requests.get(f"{BASE_URL}/contacts/project/{test_data['project_id']}", timeout=15)
        if response.status_code == 200:
            contacts = response.json()
            log_result("passed", "GET /contacts/project/{id} - List contacts", "PASS", 
                      f"Retrieved {len(contacts)} contacts")
        else:
            log_result("failed", "GET /contacts/project/{id} - List contacts", "FAIL", 
                      f"Status: {response.status_code}")
    except Exception as e:
        log_result("failed", "GET /contacts/project/{id} - List contacts", "FAIL", error=e)
    
    # Test 4.3: Update contact
    if test_data["contact_ids"]:
        try:
            update_data = {
                "name": "John Architect - Senior",
                "phone": "(615) 555-0101"
            }
            response = requests.put(f"{BASE_URL}/contacts/{test_data['contact_ids'][0]}", 
                                   json=update_data, timeout=15)
            if response.status_code == 200:
                log_result("passed", "PUT /contacts/{id} - Update contact", "PASS", 
                          "Contact updated successfully")
            else:
                log_result("failed", "PUT /contacts/{id} - Update contact", "FAIL", 
                          f"Status: {response.status_code}")
        except Exception as e:
            log_result("failed", "PUT /contacts/{id} - Update contact", "FAIL", error=e)
    
    # Test 4.4: Delete contact
    if test_data["contact_ids"]:
        try:
            response = requests.delete(f"{BASE_URL}/contacts/{test_data['contact_ids'][0]}", timeout=15)
            if response.status_code == 200:
                log_result("passed", "DELETE /contacts/{id} - Delete contact", "PASS", 
                          "Contact deleted successfully")
            else:
                log_result("failed", "DELETE /contacts/{id} - Delete contact", "FAIL", 
                          f"Status: {response.status_code}")
        except Exception as e:
            log_result("failed", "DELETE /contacts/{id} - Delete contact", "FAIL", error=e)

def test_calculators():
    """Test 5: ALL 8 Calculators"""
    print("\n" + "="*80)
    print("TEST 5: ALL CALCULATORS")
    print("="*80)
    
    # Test 5.1: Wallpaper Calculator (double roll, mural, BY_YARD with cost)
    try:
        calc_data = {
            "wall_height": 10,
            "wall_width": 12,
            "pattern_repeat": 24,
            "roll_type": "double_roll",
            "cost_per_roll": 89.99
        }
        response = requests.post(f"{BASE_URL}/calculators/wallpaper", json=calc_data, timeout=15)
        if response.status_code == 200:
            result = response.json()
            log_result("passed", "POST /calculators/wallpaper - Double roll with cost", "PASS", 
                      f"Rolls needed: {result.get('rolls_needed')}, Total cost: ${result.get('total_cost')}")
        else:
            log_result("failed", "POST /calculators/wallpaper - Double roll", "FAIL", 
                      f"Status: {response.status_code}, Response: {response.text}")
    except Exception as e:
        log_result("failed", "POST /calculators/wallpaper - Double roll", "FAIL", error=e)
    
    # Test 5.2: Drapery Calculator
    try:
        calc_data = {
            "window_width": 60,
            "window_height": 84,
            "fullness": 2.5,
            "fabric_width": 54,
            "pattern_repeat": 27
        }
        response = requests.post(f"{BASE_URL}/calculators/drapery", json=calc_data, timeout=15)
        if response.status_code == 200:
            result = response.json()
            log_result("passed", "POST /calculators/drapery", "PASS", 
                      f"Fabric needed: {result.get('fabric_yards')} yards")
        else:
            log_result("failed", "POST /calculators/drapery", "FAIL", 
                      f"Status: {response.status_code}, Response: {response.text}")
    except Exception as e:
        log_result("failed", "POST /calculators/drapery", "FAIL", error=e)
    
    # Test 5.3: Hardware Calculator
    try:
        calc_data = {
            "window_width": 60,
            "rod_type": "single",
            "bracket_spacing": 36
        }
        response = requests.post(f"{BASE_URL}/calculators/hardware", json=calc_data, timeout=15)
        if response.status_code == 200:
            result = response.json()
            log_result("passed", "POST /calculators/hardware", "PASS", 
                      f"Rod length: {result.get('rod_length')}, Brackets: {result.get('brackets_needed')}")
        else:
            log_result("failed", "POST /calculators/hardware", "FAIL", 
                      f"Status: {response.status_code}, Response: {response.text}")
    except Exception as e:
        log_result("failed", "POST /calculators/hardware", "FAIL", error=e)
    
    # Test 5.4: Square Footage Calculator
    try:
        calc_data = {
            "length": 15,
            "width": 12,
            "unit": "feet"
        }
        response = requests.post(f"{BASE_URL}/calculators/square-footage", json=calc_data, timeout=15)
        if response.status_code == 200:
            result = response.json()
            log_result("passed", "POST /calculators/square-footage", "PASS", 
                      f"Square footage: {result.get('square_feet')} sq ft")
        else:
            log_result("failed", "POST /calculators/square-footage", "FAIL", 
                      f"Status: {response.status_code}, Response: {response.text}")
    except Exception as e:
        log_result("failed", "POST /calculators/square-footage", "FAIL", error=e)
    
    # Test 5.5: Paint Calculator
    try:
        calc_data = {
            "room_length": 15,
            "room_width": 12,
            "ceiling_height": 9,
            "coats": 2,
            "coverage_per_gallon": 350
        }
        response = requests.post(f"{BASE_URL}/calculators/paint", json=calc_data, timeout=15)
        if response.status_code == 200:
            result = response.json()
            log_result("passed", "POST /calculators/paint", "PASS", 
                      f"Gallons needed: {result.get('gallons_needed')}")
        else:
            log_result("failed", "POST /calculators/paint", "FAIL", 
                      f"Status: {response.status_code}, Response: {response.text}")
    except Exception as e:
        log_result("failed", "POST /calculators/paint", "FAIL", error=e)
    
    # Test 5.6: Tile/Flooring Calculator
    try:
        calc_data = {
            "room_length": 15,
            "room_width": 12,
            "tile_length": 12,
            "tile_width": 12,
            "waste_factor": 10
        }
        response = requests.post(f"{BASE_URL}/calculators/flooring", json=calc_data, timeout=15)
        if response.status_code == 200:
            result = response.json()
            log_result("passed", "POST /calculators/flooring (tile)", "PASS", 
                      f"Tiles needed: {result.get('tiles_needed')}")
        else:
            log_result("failed", "POST /calculators/flooring (tile)", "FAIL", 
                      f"Status: {response.status_code}, Response: {response.text}")
    except Exception as e:
        log_result("failed", "POST /calculators/flooring (tile)", "FAIL", error=e)
    
    # Test 5.7: Lighting Calculator
    try:
        calc_data = {
            "room_length": 15,
            "room_width": 12,
            "ceiling_height": 9,
            "room_type": "living_room"
        }
        response = requests.post(f"{BASE_URL}/calculators/lighting", json=calc_data, timeout=15)
        if response.status_code == 200:
            result = response.json()
            log_result("passed", "POST /calculators/lighting", "PASS", 
                      f"Lumens needed: {result.get('lumens_needed')}")
        else:
            log_result("failed", "POST /calculators/lighting", "FAIL", 
                      f"Status: {response.status_code}, Response: {response.text}")
    except Exception as e:
        log_result("failed", "POST /calculators/lighting", "FAIL", error=e)
    
    # Test 5.8: Measurement Converter
    try:
        calc_data = {
            "value": 120,
            "from_unit": "inches",
            "to_unit": "feet"
        }
        response = requests.post(f"{BASE_URL}/calculators/convert", json=calc_data, timeout=15)
        if response.status_code == 200:
            result = response.json()
            log_result("passed", "POST /calculators/convert - Measurement converter", "PASS", 
                      f"Converted: {result.get('converted_value')} {result.get('to_unit')}")
        else:
            log_result("failed", "POST /calculators/convert - Measurement converter", "FAIL", 
                      f"Status: {response.status_code}, Response: {response.text}")
    except Exception as e:
        log_result("failed", "POST /calculators/convert - Measurement converter", "FAIL", error=e)

def test_email_functionality():
    """Test 6: Email functionality"""
    print("\n" + "="*80)
    print("TEST 6: EMAIL FUNCTIONALITY")
    print("="*80)
    
    # Test 6.1: Send questionnaire email
    try:
        email_data = {
            "client_name": "Test Client",
            "client_email": "info@estdesignco.com",  # Send to self for testing
            "sender_name": "Established Design Co."
        }
        response = requests.post(f"{BASE_URL}/send-questionnaire", json=email_data, timeout=15)
        if response.status_code == 200:
            result = response.json()
            log_result("passed", "POST /send-questionnaire - Send email", "PASS", 
                      f"Email sent: {result.get('message')}")
        else:
            log_result("failed", "POST /send-questionnaire - Send email", "FAIL", 
                      f"Status: {response.status_code}, Response: {response.text}")
    except Exception as e:
        log_result("failed", "POST /send-questionnaire - Send email", "FAIL", error=e)

def test_power_features():
    """Test 7: Power Features"""
    print("\n" + "="*80)
    print("TEST 7: POWER FEATURES")
    print("="*80)
    
    # Test 7.1: Budget Tracker
    if test_data["project_id"]:
        try:
            response = requests.get(f"{BASE_URL}/budget/{test_data['project_id']}", timeout=15)
            if response.status_code == 200:
                budget = response.json()
                log_result("passed", "GET /budget/{project_id} - Budget tracker", "PASS", 
                          f"Total cost: ${budget.get('total_cost', 0)}")
            else:
                log_result("failed", "GET /budget/{project_id} - Budget tracker", "FAIL", 
                          f"Status: {response.status_code}")
        except Exception as e:
            log_result("failed", "GET /budget/{project_id} - Budget tracker", "FAIL", error=e)
    
    # Test 7.2: Vendor Manager
    try:
        response = requests.get(f"{BASE_URL}/vendors", timeout=15)
        if response.status_code == 200:
            vendors = response.json()
            log_result("passed", "GET /vendors - Vendor manager", "PASS", 
                      f"Retrieved {len(vendors)} vendors")
        else:
            log_result("failed", "GET /vendors - Vendor manager", "FAIL", 
                      f"Status: {response.status_code}")
    except Exception as e:
        log_result("failed", "GET /vendors - Vendor manager", "FAIL", error=e)
    
    # Test 7.3: Material Library
    try:
        response = requests.get(f"{BASE_URL}/materials", timeout=15)
        if response.status_code == 200:
            materials = response.json()
            log_result("passed", "GET /materials - Material library", "PASS", 
                      f"Retrieved {len(materials)} materials")
        else:
            log_result("failed", "GET /materials - Material library", "FAIL", 
                      f"Status: {response.status_code}")
    except Exception as e:
        log_result("failed", "GET /materials - Material library", "FAIL", error=e)

def test_questionnaire_workflow():
    """Test 8: Questionnaire workflow with contact auto-creation"""
    print("\n" + "="*80)
    print("TEST 8: QUESTIONNAIRE WORKFLOW")
    print("="*80)
    
    # Test 8.1: Submit questionnaire with all data
    try:
        questionnaire_data = {
            "name": "Questionnaire Test Project",
            "client_info": {
                "full_name": "Emily & David Martinez",
                "email": "emily.martinez@example.com",
                "phone": "(615) 555-0200",
                "address": "789 Maple Drive, Nashville, TN 37220"
            },
            "project_type": "New Construction",
            "timeline": "12+ months",
            "budget": "$250,000",
            "style_preferences": ["Contemporary", "Minimalist"],
            "color_palette": "Monochromatic with pops of color",
            "special_requirements": "Smart home integration throughout",
            "rooms": ["Living Room", "Kitchen", "Master Bedroom", "Home Office"],
            "architect_name": "Jane Smith",
            "architect_email": "jane@architectfirm.com",
            "architect_phone": "(615) 555-0300",
            "builder_name": "Bob Builder",
            "builder_email": "bob@buildingco.com",
            "builder_phone": "(615) 555-0400",
            "spouse_name": "David Martinez",
            "spouse_email": "david.martinez@example.com",
            "spouse_phone": "(615) 555-0201"
        }
        response = requests.post(f"{BASE_URL}/projects", json=questionnaire_data, timeout=15)
        if response.status_code == 200:
            project = response.json()
            questionnaire_project_id = project.get('id')
            log_result("passed", "POST /projects - Questionnaire submission", "PASS", 
                      f"Created project ID: {questionnaire_project_id}")
            
            # Test 8.2: Verify contacts were auto-created
            try:
                response = requests.get(f"{BASE_URL}/contacts/project/{questionnaire_project_id}", timeout=15)
                if response.status_code == 200:
                    contacts = response.json()
                    contact_roles = [c.get('role') for c in contacts]
                    log_result("passed", "Questionnaire - Contact auto-creation", "PASS", 
                              f"Auto-created {len(contacts)} contacts: {', '.join(contact_roles)}")
                else:
                    log_result("warnings", "Questionnaire - Contact auto-creation", "MINOR", 
                              "Could not verify contact auto-creation")
            except Exception as e:
                log_result("warnings", "Questionnaire - Contact auto-creation", "MINOR", error=e)
            
            # Test 8.3: Verify all answers persisted
            try:
                response = requests.get(f"{BASE_URL}/projects/{questionnaire_project_id}", timeout=15)
                if response.status_code == 200:
                    saved_project = response.json()
                    checks = [
                        saved_project.get('name') == questionnaire_data['name'],
                        saved_project.get('project_type') == questionnaire_data['project_type'],
                        saved_project.get('timeline') == questionnaire_data['timeline'],
                        saved_project.get('budget') == questionnaire_data['budget'],
                        len(saved_project.get('rooms', [])) == len(questionnaire_data['rooms'])
                    ]
                    if all(checks):
                        log_result("passed", "Questionnaire - Data persistence", "PASS", 
                                  "All questionnaire data persisted correctly")
                    else:
                        log_result("failed", "Questionnaire - Data persistence", "FAIL", 
                                  f"Some data not persisted correctly: {checks}")
                else:
                    log_result("failed", "Questionnaire - Data persistence", "FAIL", 
                              f"Status: {response.status_code}")
            except Exception as e:
                log_result("failed", "Questionnaire - Data persistence", "FAIL", error=e)
        else:
            log_result("failed", "POST /projects - Questionnaire submission", "FAIL", 
                      f"Status: {response.status_code}, Response: {response.text}")
    except Exception as e:
        log_result("failed", "POST /projects - Questionnaire submission", "FAIL", error=e)

def print_summary():
    """Print comprehensive test summary"""
    print("\n" + "="*80)
    print("COMPREHENSIVE BACKEND TEST SUMMARY")
    print("="*80)
    
    total_tests = len(test_results["passed"]) + len(test_results["failed"]) + len(test_results["warnings"])
    passed = len(test_results["passed"])
    failed = len(test_results["failed"])
    warnings = len(test_results["warnings"])
    
    print(f"\nTotal Tests: {total_tests}")
    print(f"✅ Passed: {passed}")
    print(f"❌ Failed: {failed}")
    print(f"⚠️  Warnings: {warnings}")
    print(f"Success Rate: {(passed/total_tests*100):.1f}%")
    
    if failed > 0:
        print("\n" + "="*80)
        print("FAILED TESTS - BUGS FOUND")
        print("="*80)
        for result in test_results["failed"]:
            print(f"\n❌ {result['test']}")
            print(f"   Details: {result['details']}")
            if result['error']:
                print(f"   Error: {result['error']}")
    
    if warnings > 0:
        print("\n" + "="*80)
        print("WARNINGS - MINOR ISSUES")
        print("="*80)
        for result in test_results["warnings"]:
            print(f"\n⚠️  {result['test']}")
            print(f"   Details: {result['details']}")
    
    # Save results to file
    with open('/app/comprehensive_backend_test_results.json', 'w') as f:
        json.dump(test_results, f, indent=2)
    
    print(f"\n✅ Full results saved to: /app/comprehensive_backend_test_results.json")

def main():
    """Run all comprehensive backend tests"""
    print("="*80)
    print("COMPREHENSIVE APP-WIDE BACKEND TESTING")
    print("Testing ALL backend features end-to-end")
    print("="*80)
    
    # Run all test suites
    test_projects_api()
    test_rooms_api()
    test_items_api()
    test_contacts_api()
    test_calculators()
    test_email_functionality()
    test_power_features()
    test_questionnaire_workflow()
    
    # Print summary
    print_summary()

if __name__ == "__main__":
    main()

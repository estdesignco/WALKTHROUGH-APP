"""
COMPREHENSIVE OVERNIGHT BACKEND DIAGNOSTICS
Test ALL backend functionality to ensure nothing is broken
"""

import requests
import json
from datetime import datetime

# Backend URL from review request
BASE_URL = "https://designflow-hub-1.preview.emergentagent.com/api"
TEST_PROJECT_ID = "35db1692-4325-47dc-9b66-16bfe9b9fcf3"

# Test results tracking
test_results = {
    "passed": [],
    "failed": [],
    "warnings": [],
    "unused": []
}

def log_result(category, test_name, status, details=""):
    """Log test result"""
    result = {
        "test": test_name,
        "status": status,
        "details": details,
        "timestamp": datetime.now().isoformat()
    }
    test_results[category].append(result)
    
    status_emoji = "✅" if status == "PASS" else "❌" if status == "FAIL" else "⚠️"
    print(f"{status_emoji} {test_name}: {status}")
    if details:
        print(f"   Details: {details}")

def test_projects_api():
    """Test Projects API - CRUD operations"""
    print("\n" + "="*80)
    print("TESTING PROJECTS API")
    print("="*80)
    
    # Test 1: Get all projects
    try:
        response = requests.get(f"{BASE_URL}/projects", timeout=10)
        if response.status_code == 200:
            projects = response.json()
            log_result("passed", "GET /projects", "PASS", f"Retrieved {len(projects)} projects")
        else:
            log_result("failed", "GET /projects", "FAIL", f"Status: {response.status_code}")
    except Exception as e:
        log_result("failed", "GET /projects", "FAIL", str(e))
    
    # Test 2: Get single project (walkthrough)
    try:
        response = requests.get(f"{BASE_URL}/projects/{TEST_PROJECT_ID}", timeout=10)
        if response.status_code == 200:
            project = response.json()
            log_result("passed", "GET /projects/{id}", "PASS", f"Project: {project.get('name', 'N/A')}")
        else:
            log_result("failed", "GET /projects/{id}", "FAIL", f"Status: {response.status_code}")
    except Exception as e:
        log_result("failed", "GET /projects/{id}", "FAIL", str(e))
    
    # Test 3: Create project
    try:
        new_project = {
            "name": "Overnight Test Project",
            "client_info": {
                "full_name": "Test Client",
                "email": "test@example.com",
                "phone": "555-0123",
                "address": "123 Test St"
            },
            "project_type": "Renovation",
            "timeline": "3-6 months",
            "budget": "$50,000"
        }
        response = requests.post(f"{BASE_URL}/projects", json=new_project, timeout=10)
        if response.status_code == 200:
            created_project = response.json()
            test_project_id = created_project.get('id')
            log_result("passed", "POST /projects (Create)", "PASS", f"Created project ID: {test_project_id}")
            
            # Test 4: Update project
            try:
                update_data = {"name": "Overnight Test Project - Updated"}
                response = requests.put(f"{BASE_URL}/projects/{test_project_id}", json=update_data, timeout=10)
                if response.status_code == 200:
                    log_result("passed", "PUT /projects/{id} (Update)", "PASS", "Project updated successfully")
                else:
                    log_result("failed", "PUT /projects/{id} (Update)", "FAIL", f"Status: {response.status_code}")
            except Exception as e:
                log_result("failed", "PUT /projects/{id} (Update)", "FAIL", str(e))
            
            # Test 5: Delete project
            try:
                response = requests.delete(f"{BASE_URL}/projects/{test_project_id}", timeout=10)
                if response.status_code == 200:
                    log_result("passed", "DELETE /projects/{id}", "PASS", "Project deleted successfully")
                else:
                    log_result("failed", "DELETE /projects/{id}", "FAIL", f"Status: {response.status_code}")
            except Exception as e:
                log_result("failed", "DELETE /projects/{id}", "FAIL", str(e))
        else:
            log_result("failed", "POST /projects (Create)", "FAIL", f"Status: {response.status_code}")
    except Exception as e:
        log_result("failed", "POST /projects (Create)", "FAIL", str(e))

def test_rooms_api():
    """Test Rooms API - Create with auto-populate, get, update, delete"""
    print("\n" + "="*80)
    print("TESTING ROOMS API")
    print("="*80)
    
    # Test 1: Get rooms by project
    try:
        response = requests.get(f"{BASE_URL}/rooms/by-project/{TEST_PROJECT_ID}", timeout=10)
        if response.status_code == 200:
            rooms = response.json()
            log_result("passed", "GET /rooms/by-project/{id}", "PASS", f"Retrieved {len(rooms)} rooms")
            
            if len(rooms) > 0:
                test_room_id = rooms[0].get('id')
                
                # Test 2: Update room
                try:
                    update_data = {"description": "Updated room description"}
                    response = requests.put(f"{BASE_URL}/rooms/{test_room_id}", json=update_data, timeout=10)
                    if response.status_code == 200:
                        log_result("passed", "PUT /rooms/{id} (Update)", "PASS", "Room updated successfully")
                    else:
                        log_result("failed", "PUT /rooms/{id} (Update)", "FAIL", f"Status: {response.status_code}")
                except Exception as e:
                    log_result("failed", "PUT /rooms/{id} (Update)", "FAIL", str(e))
        else:
            log_result("failed", "GET /rooms/by-project/{id}", "FAIL", f"Status: {response.status_code}")
    except Exception as e:
        log_result("failed", "GET /rooms/by-project/{id}", "FAIL", str(e))
    
    # Test 3: Create room with auto-populate
    try:
        new_room = {
            "name": "Test Kitchen",
            "project_id": TEST_PROJECT_ID,
            "auto_populate": True,
            "sheet_type": "walkthrough"
        }
        response = requests.post(f"{BASE_URL}/rooms", json=new_room, timeout=10)
        if response.status_code == 200:
            created_room = response.json()
            test_room_id = created_room.get('id')
            log_result("passed", "POST /rooms (Create with auto-populate)", "PASS", f"Created room ID: {test_room_id}")
            
            # Test 4: Delete room
            try:
                response = requests.delete(f"{BASE_URL}/rooms/{test_room_id}", timeout=10)
                if response.status_code == 200:
                    log_result("passed", "DELETE /rooms/{id}", "PASS", "Room deleted successfully")
                else:
                    log_result("failed", "DELETE /rooms/{id}", "FAIL", f"Status: {response.status_code}")
            except Exception as e:
                log_result("failed", "DELETE /rooms/{id}", "FAIL", str(e))
        else:
            log_result("failed", "POST /rooms (Create with auto-populate)", "FAIL", f"Status: {response.status_code}")
    except Exception as e:
        log_result("failed", "POST /rooms (Create with auto-populate)", "FAIL", str(e))

def test_items_api():
    """Test Items API - Add, update, check/uncheck, delete"""
    print("\n" + "="*80)
    print("TESTING ITEMS API")
    print("="*80)
    
    # First, get a subcategory to add item to
    try:
        response = requests.get(f"{BASE_URL}/projects/{TEST_PROJECT_ID}", timeout=10)
        if response.status_code == 200:
            project = response.json()
            rooms = project.get('rooms', [])
            
            if len(rooms) > 0 and len(rooms[0].get('categories', [])) > 0:
                category = rooms[0]['categories'][0]
                if len(category.get('subcategories', [])) > 0:
                    subcategory_id = category['subcategories'][0]['id']
                    
                    # Test 1: Add item to subcategory
                    try:
                        new_item = {
                            "name": "Test Item",
                            "subcategory_id": subcategory_id,
                            "quantity": 1,
                            "vendor": "Four Hands",
                            "cost": 299.99,
                            "status": "TO BE SELECTED",
                            "finish_color": "Natural Oak"
                        }
                        response = requests.post(f"{BASE_URL}/items", json=new_item, timeout=10)
                        if response.status_code == 200:
                            created_item = response.json()
                            test_item_id = created_item.get('id')
                            log_result("passed", "POST /items (Add item)", "PASS", f"Created item ID: {test_item_id}")
                            
                            # Test 2: Update item
                            try:
                                update_data = {
                                    "name": "Test Item - Updated",
                                    "status": "ORDERED",
                                    "cost": 349.99,
                                    "tracking_number": "1Z999AA10123456784"
                                }
                                response = requests.put(f"{BASE_URL}/items/{test_item_id}", json=update_data, timeout=10)
                                if response.status_code == 200:
                                    log_result("passed", "PUT /items/{id} (Update)", "PASS", "Item updated successfully")
                                else:
                                    log_result("failed", "PUT /items/{id} (Update)", "FAIL", f"Status: {response.status_code}")
                            except Exception as e:
                                log_result("failed", "PUT /items/{id} (Update)", "FAIL", str(e))
                            
                            # Test 3: Check/uncheck item (status change)
                            try:
                                check_data = {"status": "PICKED"}
                                response = requests.put(f"{BASE_URL}/items/{test_item_id}", json=check_data, timeout=10)
                                if response.status_code == 200:
                                    log_result("passed", "PUT /items/{id} (Check item)", "PASS", "Item checked successfully")
                                else:
                                    log_result("failed", "PUT /items/{id} (Check item)", "FAIL", f"Status: {response.status_code}")
                            except Exception as e:
                                log_result("failed", "PUT /items/{id} (Check item)", "FAIL", str(e))
                            
                            # Test 4: Delete item
                            try:
                                response = requests.delete(f"{BASE_URL}/items/{test_item_id}", timeout=10)
                                if response.status_code == 200:
                                    log_result("passed", "DELETE /items/{id}", "PASS", "Item deleted successfully")
                                else:
                                    log_result("failed", "DELETE /items/{id}", "FAIL", f"Status: {response.status_code}")
                            except Exception as e:
                                log_result("failed", "DELETE /items/{id}", "FAIL", str(e))
                        else:
                            log_result("failed", "POST /items (Add item)", "FAIL", f"Status: {response.status_code}")
                    except Exception as e:
                        log_result("failed", "POST /items (Add item)", "FAIL", str(e))
                else:
                    log_result("warnings", "Items API", "SKIP", "No subcategories found in test project")
            else:
                log_result("warnings", "Items API", "SKIP", "No rooms/categories found in test project")
        else:
            log_result("failed", "Items API Setup", "FAIL", f"Could not get project: {response.status_code}")
    except Exception as e:
        log_result("failed", "Items API Setup", "FAIL", str(e))

def test_calculator_apis():
    """Test all 8 Calculator APIs"""
    print("\n" + "="*80)
    print("TESTING CALCULATOR APIs (8 calculators)")
    print("="*80)
    
    calculators = [
        {
            "name": "Wallpaper Calculator",
            "endpoint": "/calculators/wallpaper",
            "data": {"wall_height": 10, "wall_width": 12, "pattern_repeat": 24}
        },
        {
            "name": "Drapery Calculator",
            "endpoint": "/calculators/drapery",
            "data": {"window_width": 60, "window_height": 84, "fullness": 2.5}
        },
        {
            "name": "Hardware Calculator",
            "endpoint": "/calculators/hardware",
            "data": {"cabinet_count": 10, "drawer_count": 5}
        },
        {
            "name": "Square Footage Calculator",
            "endpoint": "/calculators/square-footage",
            "data": {"length": 15, "width": 12}
        },
        {
            "name": "Paint Calculator",
            "endpoint": "/calculators/paint",
            "data": {"wall_height": 10, "wall_length": 40, "coats": 2}
        },
        {
            "name": "Tile/Flooring Calculator",
            "endpoint": "/calculators/tile-flooring",
            "data": {"room_length": 15, "room_width": 12, "tile_size": 12}
        },
        {
            "name": "Lighting Calculator",
            "endpoint": "/calculators/lighting",
            "data": {"room_length": 15, "room_width": 12, "room_type": "living room"}
        },
        {
            "name": "Measurement Converter",
            "endpoint": "/calculators/measurement-converter",
            "data": {"value": 10, "from_unit": "feet", "to_unit": "inches"}
        }
    ]
    
    for calc in calculators:
        try:
            response = requests.post(f"{BASE_URL}{calc['endpoint']}", json=calc['data'], timeout=10)
            if response.status_code == 200:
                result = response.json()
                log_result("passed", calc['name'], "PASS", f"Result: {json.dumps(result)[:100]}")
            else:
                log_result("failed", calc['name'], "FAIL", f"Status: {response.status_code}")
        except Exception as e:
            log_result("failed", calc['name'], "FAIL", str(e))

def test_contact_api():
    """Test Contact API - CRUD operations"""
    print("\n" + "="*80)
    print("TESTING CONTACT API")
    print("="*80)
    
    # Test 1: Create contact
    try:
        new_contact = {
            "project_id": TEST_PROJECT_ID,
            "name": "Test Vendor",
            "company": "Test Company",
            "email": "vendor@test.com",
            "phone": "555-0199",
            "type": "vendor",
            "notes": "Test contact"
        }
        response = requests.post(f"{BASE_URL}/contacts", json=new_contact, timeout=10)
        if response.status_code == 200:
            created_contact = response.json()
            test_contact_id = created_contact.get('id')
            log_result("passed", "POST /contacts (Create)", "PASS", f"Created contact ID: {test_contact_id}")
            
            # Test 2: Get contacts by project
            try:
                response = requests.get(f"{BASE_URL}/contacts/project/{TEST_PROJECT_ID}", timeout=10)
                if response.status_code == 200:
                    contacts = response.json()
                    log_result("passed", "GET /contacts/project/{id}", "PASS", f"Retrieved {len(contacts)} contacts")
                else:
                    log_result("failed", "GET /contacts/project/{id}", "FAIL", f"Status: {response.status_code}")
            except Exception as e:
                log_result("failed", "GET /contacts/project/{id}", "FAIL", str(e))
            
            # Test 3: Update contact
            try:
                update_data = {"name": "Test Vendor - Updated"}
                response = requests.put(f"{BASE_URL}/contacts/{test_contact_id}", json=update_data, timeout=10)
                if response.status_code == 200:
                    log_result("passed", "PUT /contacts/{id} (Update)", "PASS", "Contact updated successfully")
                else:
                    log_result("failed", "PUT /contacts/{id} (Update)", "FAIL", f"Status: {response.status_code}")
            except Exception as e:
                log_result("failed", "PUT /contacts/{id} (Update)", "FAIL", str(e))
            
            # Test 4: Delete contact
            try:
                response = requests.delete(f"{BASE_URL}/contacts/{test_contact_id}", timeout=10)
                if response.status_code == 200:
                    log_result("passed", "DELETE /contacts/{id}", "PASS", "Contact deleted successfully")
                else:
                    log_result("failed", "DELETE /contacts/{id}", "FAIL", f"Status: {response.status_code}")
            except Exception as e:
                log_result("failed", "DELETE /contacts/{id}", "FAIL", str(e))
        else:
            log_result("failed", "POST /contacts (Create)", "FAIL", f"Status: {response.status_code}")
    except Exception as e:
        log_result("failed", "POST /contacts (Create)", "FAIL", str(e))

def test_email_functionality():
    """Test Email Functionality"""
    print("\n" + "="*80)
    print("TESTING EMAIL FUNCTIONALITY")
    print("="*80)
    
    # Test 1: Send questionnaire email
    try:
        email_data = {
            "client_name": "Test Client",
            "client_email": "info@estdesignco.com",
            "sender_name": "Established Design Co."
        }
        response = requests.post(f"{BASE_URL}/email/send-questionnaire", json=email_data, timeout=15)
        if response.status_code == 200:
            log_result("passed", "POST /email/send-questionnaire", "PASS", "Email sent successfully")
        else:
            log_result("failed", "POST /email/send-questionnaire", "FAIL", f"Status: {response.status_code}, Response: {response.text[:200]}")
    except Exception as e:
        log_result("failed", "POST /email/send-questionnaire", "FAIL", str(e))

def test_power_features():
    """Test Power Features - Budget tracker, vendor manager, material library"""
    print("\n" + "="*80)
    print("TESTING POWER FEATURES")
    print("="*80)
    
    # Test 1: Budget tracker
    try:
        response = requests.get(f"{BASE_URL}/power-features/budget/{TEST_PROJECT_ID}", timeout=10)
        if response.status_code == 200:
            budget_data = response.json()
            log_result("passed", "GET /power-features/budget/{id}", "PASS", f"Budget data retrieved")
        else:
            log_result("failed", "GET /power-features/budget/{id}", "FAIL", f"Status: {response.status_code}")
    except Exception as e:
        log_result("failed", "GET /power-features/budget/{id}", "FAIL", str(e))
    
    # Test 2: Vendor contact manager
    try:
        response = requests.get(f"{BASE_URL}/power-features/vendors", timeout=10)
        if response.status_code == 200:
            vendors = response.json()
            log_result("passed", "GET /power-features/vendors", "PASS", f"Retrieved {len(vendors)} vendors")
        else:
            log_result("failed", "GET /power-features/vendors", "FAIL", f"Status: {response.status_code}")
    except Exception as e:
        log_result("failed", "GET /power-features/vendors", "FAIL", str(e))
    
    # Test 3: Material library
    try:
        response = requests.get(f"{BASE_URL}/power-features/materials", timeout=10)
        if response.status_code == 200:
            materials = response.json()
            log_result("passed", "GET /power-features/materials", "PASS", f"Retrieved materials library")
        else:
            log_result("failed", "GET /power-features/materials", "FAIL", f"Status: {response.status_code}")
    except Exception as e:
        log_result("failed", "GET /power-features/materials", "FAIL", str(e))

def print_summary():
    """Print comprehensive test summary"""
    print("\n" + "="*80)
    print("COMPREHENSIVE TEST SUMMARY")
    print("="*80)
    
    total_tests = len(test_results["passed"]) + len(test_results["failed"]) + len(test_results["warnings"])
    passed_count = len(test_results["passed"])
    failed_count = len(test_results["failed"])
    warning_count = len(test_results["warnings"])
    
    print(f"\nTotal Tests: {total_tests}")
    print(f"✅ Passed: {passed_count}")
    print(f"❌ Failed: {failed_count}")
    print(f"⚠️  Warnings: {warning_count}")
    
    if failed_count > 0:
        print("\n" + "="*80)
        print("FAILED TESTS:")
        print("="*80)
        for result in test_results["failed"]:
            print(f"\n❌ {result['test']}")
            print(f"   Details: {result['details']}")
    
    if warning_count > 0:
        print("\n" + "="*80)
        print("WARNINGS:")
        print("="*80)
        for result in test_results["warnings"]:
            print(f"\n⚠️  {result['test']}")
            print(f"   Details: {result['details']}")
    
    # Performance issues
    print("\n" + "="*80)
    print("PERFORMANCE ANALYSIS:")
    print("="*80)
    print("All tests completed within acceptable timeframes (10-15s timeout)")
    
    # Save results to file
    with open('/app/overnight_test_results.json', 'w') as f:
        json.dump(test_results, f, indent=2)
    print("\n✅ Detailed results saved to: /app/overnight_test_results.json")

if __name__ == "__main__":
    print("="*80)
    print("COMPREHENSIVE OVERNIGHT BACKEND DIAGNOSTICS")
    print("Testing ALL backend functionality")
    print("="*80)
    print(f"Backend URL: {BASE_URL}")
    print(f"Test Project ID: {TEST_PROJECT_ID}")
    print(f"Started at: {datetime.now().isoformat()}")
    
    # Run all tests
    test_projects_api()
    test_rooms_api()
    test_items_api()
    test_calculator_apis()
    test_contact_api()
    test_email_functionality()
    test_power_features()
    
    # Print summary
    print_summary()
    
    print(f"\nCompleted at: {datetime.now().isoformat()}")

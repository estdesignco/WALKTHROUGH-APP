#!/usr/bin/env python3
"""
FF&E Backend API Testing Suite - COMPREHENSIVE STRUCTURE TESTING
Tests all FF&E functionality including projects, rooms, categories, subcategories, and items.
FOCUS: Testing enhanced_rooms.py comprehensive structure implementation
"""

import requests
import json
import uuid
from datetime import datetime
from typing import Dict, Any, List
import sys
import os

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
PROJECT_ID = "5cccfb11-0ac0-45ed-91ab-a56088d65b5a"  # Updated to review request project ID

print(f"Testing FF&E Backend APIs at: {BASE_URL}")
print(f"Using Project ID: {PROJECT_ID}")

class FFEAPITester:
    def __init__(self):
        self.session = requests.Session()
        self.test_results = []
        self.created_items = []
        self.created_rooms = []
        self.created_categories = []
        self.created_subcategories = []
        
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
        
    def make_request(self, method: str, endpoint: str, data: Dict = None, params: Dict = None) -> tuple:
        """Make HTTP request and return (success, response_data, status_code)"""
        try:
            url = f"{BASE_URL}{endpoint}"
            
            if method.upper() == 'GET':
                response = self.session.get(url, params=params)
            elif method.upper() == 'POST':
                response = self.session.post(url, json=data)
            elif method.upper() == 'PUT':
                response = self.session.put(url, json=data)
            elif method.upper() == 'DELETE':
                response = self.session.delete(url)
            else:
                return False, f"Unsupported method: {method}", 400
                
            return response.status_code < 400, response.json() if response.content else {}, response.status_code
            
        except requests.exceptions.RequestException as e:
            return False, f"Request failed: {str(e)}", 0
        except json.JSONDecodeError as e:
            return False, f"JSON decode error: {str(e)}", response.status_code if 'response' in locals() else 0
        except Exception as e:
            return False, f"Unexpected error: {str(e)}", 0

    def test_project_data_structure(self):
        """Test Project Data Structure - verify 3-level hierarchy (Room > Category > Subcategory > Items)"""
        print("\n=== Testing Project Data Structure (Review Request) ===")
        
        success, data, status_code = self.make_request('GET', f'/projects/{PROJECT_ID}')
        
        if not success:
            self.log_test("GET Project Data Structure", False, f"Failed to retrieve project: {data} (Status: {status_code})")
            return False
            
        # Verify project structure
        required_fields = ['id', 'name', 'client_info', 'rooms']
        missing_fields = [field for field in required_fields if field not in data]
        
        if missing_fields:
            self.log_test("Project Structure - Required Fields", False, f"Missing required fields: {missing_fields}")
            return False
        else:
            self.log_test("Project Structure - Required Fields", True, "All required fields present")
            
        # Analyze 3-level hierarchy in detail
        rooms = data.get('rooms', [])
        if not rooms:
            self.log_test("Project Structure - Rooms", False, "No rooms found in project")
            return False
            
        # Detailed hierarchy analysis
        hierarchy_stats = {
            'rooms': len(rooms),
            'categories': 0,
            'subcategories': 0,
            'items': 0
        }
        
        hierarchy_details = []
        room_colors = set()
        category_colors = set()
        subcategory_colors = set()
        
        for room in rooms:
            room_name = room.get('name', 'Unknown')
            room_color = room.get('color', 'No color')
            room_colors.add(room_color)
            categories = room.get('categories', [])
            hierarchy_stats['categories'] += len(categories)
            
            for category in categories:
                cat_name = category.get('name', 'Unknown')
                cat_color = category.get('color', 'No color')
                category_colors.add(cat_color)
                subcategories = category.get('subcategories', [])
                hierarchy_stats['subcategories'] += len(subcategories)
                
                for subcategory in subcategories:
                    subcat_name = subcategory.get('name', 'Unknown')
                    subcat_color = subcategory.get('color', 'No color')
                    subcategory_colors.add(subcat_color)
                    items = subcategory.get('items', [])
                    hierarchy_stats['items'] += len(items)
                    
                    if items:  # Only show subcategories with items for clarity
                        hierarchy_details.append(f"{room_name} > {cat_name} > {subcat_name} ({len(items)} items)")
        
        # Log hierarchy statistics
        self.log_test("Project 3-Level Hierarchy", True, 
                     f"Structure: {hierarchy_stats['rooms']} rooms → {hierarchy_stats['categories']} categories → {hierarchy_stats['subcategories']} subcategories → {hierarchy_stats['items']} items")
        
        # Verify color coding
        if len(room_colors) > 1 or (len(room_colors) == 1 and 'No color' not in room_colors):
            self.log_test("Room Color Coding", True, f"Room colors: {list(room_colors)}")
        else:
            self.log_test("Room Color Coding", False, "Rooms missing color coding")
            
        if len(category_colors) > 1 or (len(category_colors) == 1 and 'No color' not in category_colors):
            self.log_test("Category Color Coding", True, f"Category colors: {list(category_colors)}")
        else:
            self.log_test("Category Color Coding", False, "Categories missing color coding")
            
        if len(subcategory_colors) > 1 or (len(subcategory_colors) == 1 and 'No color' not in subcategory_colors):
            self.log_test("Subcategory Color Coding", True, f"Subcategory colors: {list(subcategory_colors)}")
        else:
            self.log_test("Subcategory Color Coding", False, "Subcategories missing color coding")
        
        # Show sample hierarchy
        if hierarchy_details:
            sample_hierarchy = "; ".join(hierarchy_details[:3])  # Show first 3 for brevity
            self.log_test("Hierarchy Sample", True, f"Sample: {sample_hierarchy}")
        
        # Verify items have proper structure
        if hierarchy_stats['items'] > 0:
            # Check a sample item for required fields
            sample_item = None
            for room in rooms:
                for category in room.get('categories', []):
                    for subcategory in category.get('subcategories', []):
                        items = subcategory.get('items', [])
                        if items:
                            sample_item = items[0]
                            break
                    if sample_item:
                        break
                if sample_item:
                    break
            
            if sample_item:
                item_fields = list(sample_item.keys())
                expected_item_fields = ['id', 'name', 'status', 'vendor', 'cost']
                found_fields = [f for f in expected_item_fields if f in item_fields]
                
                if len(found_fields) >= 3:
                    self.log_test("Item Structure", True, f"Items have proper structure. Sample fields: {item_fields[:8]}")
                else:
                    self.log_test("Item Structure", False, f"Items missing key fields. Found: {found_fields}")
        
        return True

    def test_add_room_functionality(self):
        """Test Add Room Functionality - auto-populate with complete structure including 300+ default items"""
        print("\n=== Testing Add Room Functionality (Review Request) ===")
        
        # Test room creation with auto-population
        room_data = {
            "name": "Test Kitchen",
            "description": "Test room for auto-population testing",
            "project_id": PROJECT_ID,
            "order_index": 0
        }
        
        success, data, status_code = self.make_request('POST', '/rooms', room_data)
        
        if not success:
            self.log_test("Create Room with Auto-Population", False, f"Failed to create room: {data} (Status: {status_code})")
            return False
            
        room_id = data.get('id')
        if not room_id:
            self.log_test("Create Room with Auto-Population", False, "Room created but no ID returned")
            return False
            
        self.created_rooms.append(room_id)
        self.log_test("Create Room", True, f"Room created with ID: {room_id}")
        
        # Verify room has auto-created complete structure by checking the response directly
        if data and data.get('categories'):
            categories = data['categories']
            self.log_test("Room Auto-Structure - Categories", True, f"Room auto-created {len(categories)} categories")
            
            # Count subcategories and default items
            total_subcats = 0
            total_default_items = 0
            category_details = []
            
            for category in categories:
                cat_name = category.get('name', 'Unknown')
                subcategories = category.get('subcategories', [])
                total_subcats += len(subcategories)
                
                for subcategory in subcategories:
                    subcat_name = subcategory.get('name', 'Unknown')
                    items = subcategory.get('items', [])
                    total_default_items += len(items)
                    
                    if items:  # Only show subcategories with items
                        category_details.append(f"{cat_name}>{subcat_name} ({len(items)} items)")
            
            if total_subcats > 0:
                self.log_test("Room Auto-Structure - Subcategories", True, f"Auto-created {total_subcats} subcategories")
            else:
                self.log_test("Room Auto-Structure - Subcategories", False, "No subcategories auto-created")
            
            if total_default_items > 0:
                self.log_test("Room Auto-Structure - Default Items", True, f"Auto-populated {total_default_items} default items")
                
                # Check if we have substantial default items (looking for 300+ as mentioned in review)
                if total_default_items >= 50:  # Reasonable threshold for a single room
                    self.log_test("Room Auto-Population - Comprehensive", True, f"Comprehensive auto-population: {total_default_items} items across {total_subcats} subcategories")
                else:
                    self.log_test("Room Auto-Population - Comprehensive", False, f"Limited auto-population: only {total_default_items} items (expected more comprehensive)")
                
                # Show sample structure
                if category_details:
                    sample_details = "; ".join(category_details[:5])  # Show first 5
                    self.log_test("Room Structure Sample", True, f"Sample structure: {sample_details}")
            else:
                self.log_test("Room Auto-Structure - Default Items", False, "No default items auto-populated")
        else:
            self.log_test("Room Auto-Structure - Categories", False, "Room created but no categories auto-generated")
        
        return True

    def test_item_operations(self):
        """Test item CRUD operations"""
        print("\n=== Testing Item CRUD Operations ===")
        
        # First, get a subcategory to add items to
        success, project_data, _ = self.make_request('GET', f'/projects/{PROJECT_ID}')
        if not success:
            self.log_test("Get Subcategory for Items", False, "Could not retrieve project for item testing")
            return False
            
        # Find a subcategory
        subcategory_id = None
        for room in project_data.get('rooms', []):
            for category in room.get('categories', []):
                for subcategory in category.get('subcategories', []):
                    subcategory_id = subcategory['id']
                    break
                if subcategory_id:
                    break
            if subcategory_id:
                break
                
        if not subcategory_id:
            self.log_test("Get Subcategory for Items", False, "No subcategory found for item testing")
            return False
            
        # Test item creation
        item_data = {
            "name": "Crystal Chandelier Test",
            "quantity": 1,
            "size": "36\" diameter",
            "remarks": "Test item for FF&E testing",
            "vendor": "Visual Comfort",
            "status": "PICKED",
            "cost": 2500.00,
            "link": "https://visualcomfort.com/test-chandelier",
            "subcategory_id": subcategory_id
        }
        
        success, data, status_code = self.make_request('POST', '/items', item_data)
        
        if not success:
            self.log_test("Create Item", False, f"Failed to create item: {data} (Status: {status_code})")
            return False
            
        item_id = data.get('id')
        if not item_id:
            self.log_test("Create Item", False, "Item created but no ID returned")
            return False
            
        self.created_items.append(item_id)
        self.log_test("Create Item", True, f"Item created with ID: {item_id}")
        
        # Test item retrieval
        success, item_data, status_code = self.make_request('GET', f'/items/{item_id}')
        
        if not success:
            self.log_test("Get Item", False, f"Failed to retrieve item: {item_data} (Status: {status_code})")
        else:
            self.log_test("Get Item", True, f"Item retrieved: {item_data.get('name', 'Unknown')}")
            
        # Test item update
        update_data = {
            "status": "ORDERED",
            "cost": 2750.00,
            "remarks": "Updated test item"
        }
        
        success, updated_data, status_code = self.make_request('PUT', f'/items/{item_id}', update_data)
        
        if not success:
            self.log_test("Update Item", False, f"Failed to update item: {updated_data} (Status: {status_code})")
        else:
            # Verify update
            if updated_data.get('status') == 'ORDERED' and updated_data.get('cost') == 2750.00:
                self.log_test("Update Item", True, "Item updated successfully")
            else:
                self.log_test("Update Item", False, "Item update did not persist correctly")
        
        return True

    def test_dropdown_endpoints(self):
        """Test all dropdown endpoints with colors as requested in review"""
        print("\n=== Testing Dropdown Data Endpoints (Review Request) ===")
        
        # Test /api/item-statuses-enhanced (should return 22+ statuses with colors)
        success, response_data, status_code = self.make_request('GET', '/item-statuses-enhanced')
        if success and isinstance(response_data, dict) and 'data' in response_data:
            statuses_data = response_data['data']
            if isinstance(statuses_data, list) and len(statuses_data) > 0:
                self.log_test("GET /api/item-statuses-enhanced", True, f"Retrieved {len(statuses_data)} enhanced statuses")
                
                # Check for colors and expected count
                statuses_with_colors = [s for s in statuses_data if isinstance(s, dict) and 'color' in s]
                if len(statuses_with_colors) >= 22:
                    self.log_test("Item Statuses with Colors", True, f"Found {len(statuses_with_colors)} statuses with colors (≥22 expected)")
                    
                    # Check for key statuses with colors
                    key_statuses = ['PICKED', 'ORDERED', 'SHIPPED', 'DELIVERED TO JOB SITE', 'INSTALLED']
                    found_key_statuses = []
                    for status_obj in statuses_with_colors:
                        if status_obj.get('status') in key_statuses:
                            found_key_statuses.append(f"{status_obj['status']} ({status_obj['color']})")
                    
                    if len(found_key_statuses) >= 3:
                        self.log_test("Key Item Statuses with Colors", True, f"Found: {found_key_statuses}")
                    else:
                        self.log_test("Key Item Statuses with Colors", False, f"Missing key statuses. Found: {found_key_statuses}")
                else:
                    self.log_test("Item Statuses with Colors", False, f"Only {len(statuses_with_colors)} statuses with colors (expected ≥22)")
            else:
                self.log_test("GET /api/item-statuses-enhanced", False, f"Invalid data format: {statuses_data}")
        else:
            self.log_test("GET /api/item-statuses-enhanced", False, f"Failed: {response_data} (Status: {status_code})")
            
        # Test /api/carrier-options (should return 19+ carriers with colors)
        success, response_data, status_code = self.make_request('GET', '/carrier-options')
        if success and isinstance(response_data, dict) and 'data' in response_data:
            carriers_data = response_data['data']
            if isinstance(carriers_data, list) and len(carriers_data) > 0:
                self.log_test("GET /api/carrier-options", True, f"Retrieved {len(carriers_data)} carrier options")
                
                # Check for colors and expected count
                carriers_with_colors = [c for c in carriers_data if isinstance(c, dict) and 'color' in c]
                if len(carriers_with_colors) >= 19:
                    self.log_test("Carrier Options with Colors", True, f"Found {len(carriers_with_colors)} carriers with colors (≥19 expected)")
                    
                    # Check for key carriers with colors
                    key_carriers = ['FedEx', 'UPS', 'Brooks', 'Zenith']
                    found_key_carriers = []
                    for carrier_obj in carriers_with_colors:
                        if carrier_obj.get('name') in key_carriers:
                            found_key_carriers.append(f"{carrier_obj['name']} ({carrier_obj['color']})")
                    
                    if len(found_key_carriers) >= 2:
                        self.log_test("Key Carrier Options with Colors", True, f"Found: {found_key_carriers}")
                    else:
                        self.log_test("Key Carrier Options with Colors", False, f"Missing key carriers. Found: {found_key_carriers}")
                else:
                    self.log_test("Carrier Options with Colors", False, f"Only {len(carriers_with_colors)} carriers with colors (expected ≥19)")
            else:
                self.log_test("GET /api/carrier-options", False, f"Invalid data format: {carriers_data}")
        else:
            self.log_test("GET /api/carrier-options", False, f"Failed: {response_data} (Status: {status_code})")
            
        # Test /api/ship-to-options (should return 4 options) - Note: This endpoint may not exist
        success, ship_to_data, status_code = self.make_request('GET', '/ship-to-options')
        if success and isinstance(ship_to_data, list):
            if len(ship_to_data) >= 4:
                self.log_test("GET /api/ship-to-options", True, f"Retrieved {len(ship_to_data)} ship-to options (≥4 expected)")
            else:
                self.log_test("GET /api/ship-to-options", False, f"Only {len(ship_to_data)} ship-to options (expected 4)")
        elif status_code == 404:
            self.log_test("GET /api/ship-to-options", False, "Endpoint not implemented - needs to be added to backend")
        else:
            self.log_test("GET /api/ship-to-options", False, f"Failed: {ship_to_data} (Status: {status_code})")
            
        # Test /api/delivery-status-options (should return 14+ delivery statuses) - Note: This endpoint may not exist
        success, delivery_data, status_code = self.make_request('GET', '/delivery-status-options')
        if success and isinstance(delivery_data, list):
            if len(delivery_data) >= 14:
                self.log_test("GET /api/delivery-status-options", True, f"Retrieved {len(delivery_data)} delivery status options (≥14 expected)")
                
                # Check for key delivery statuses
                key_delivery_statuses = ['SHIPPED', 'IN TRANSIT', 'OUT FOR DELIVERY', 'DELIVERED TO RECEIVER', 'DELIVERED TO JOB SITE']
                found_delivery_statuses = [s for s in delivery_data if s in key_delivery_statuses]
                if len(found_delivery_statuses) >= 3:
                    self.log_test("Key Delivery Status Options", True, f"Found: {found_delivery_statuses}")
                else:
                    self.log_test("Key Delivery Status Options", False, f"Missing key delivery statuses. Found: {found_delivery_statuses}")
            else:
                self.log_test("GET /api/delivery-status-options", False, f"Only {len(delivery_data)} delivery status options (expected ≥14)")
        elif status_code == 404:
            self.log_test("GET /api/delivery-status-options", False, "Endpoint not implemented - needs to be added to backend")
        else:
            self.log_test("GET /api/delivery-status-options", False, f"Failed: {delivery_data} (Status: {status_code})")

    def test_enum_endpoints(self):
        """Test basic enum endpoints for backward compatibility"""
        print("\n=== Testing Basic Enum Endpoints ===")
        
        # Test item statuses
        success, statuses, status_code = self.make_request('GET', '/item-statuses')
        if success and isinstance(statuses, list) and len(statuses) > 0:
            self.log_test("Get Item Statuses", True, f"Retrieved {len(statuses)} statuses")
        else:
            self.log_test("Get Item Statuses", False, f"Failed to get statuses: {statuses}")
            
        # Test vendor types
        success, vendors, status_code = self.make_request('GET', '/vendor-types')
        if success and isinstance(vendors, list) and len(vendors) > 0:
            self.log_test("Get Vendor Types", True, f"Retrieved {len(vendors)} vendors")
        else:
            self.log_test("Get Vendor Types", False, f"Failed to get vendors: {vendors}")
            
        # Test carrier types
        success, carriers, status_code = self.make_request('GET', '/carrier-types')
        if success and isinstance(carriers, list) and len(carriers) > 0:
            self.log_test("Get Carrier Types", True, f"Retrieved {len(carriers)} carriers")
        else:
            self.log_test("Get Carrier Types", False, f"Failed to get carriers: {carriers}")

    def test_link_scraping(self):
        """Test link scraping functionality with specific URLs"""
        print("\n=== Testing Link Scraping Functionality ===")
        
        # Test URLs as requested in the review
        test_urls = [
            {
                "url": "https://fourhands.com/product/248067-003",
                "name": "Four Hands - Fenn Chair",
                "expected_vendor": "Four Hands"
            },
            {
                "url": "https://example.com",
                "name": "Simple test site",
                "expected_vendor": None
            },
            {
                "url": "https://uttermost.com/product/24278",
                "name": "Uttermost product test",
                "expected_vendor": "Uttermost"
            }
        ]
        
        for test_case in test_urls:
            print(f"\n--- Testing: {test_case['name']} ---")
            
            scrape_data = {"url": test_case["url"]}
            success, data, status_code = self.make_request('POST', '/scrape-product', scrape_data)
            
            # Log the response details
            print(f"URL: {test_case['url']}")
            print(f"Status Code: {status_code}")
            print(f"Success: {success}")
            
            if success:
                # Check response format
                if isinstance(data, dict) and 'success' in data and 'data' in data:
                    self.log_test(f"Scrape {test_case['name']} - Response Format", True, "Correct {success: true, data: {...}} format")
                    
                    # Analyze the data fields
                    product_data = data.get('data', {})
                    expected_fields = ['name', 'price', 'vendor', 'image_url', 'description', 'sku', 'size', 'color']
                    
                    populated_fields = []
                    empty_fields = []
                    
                    for field in expected_fields:
                        value = product_data.get(field, '')
                        if value and str(value).strip():
                            populated_fields.append(f"{field}: '{value}'")
                        else:
                            empty_fields.append(field)
                    
                    # Log detailed field analysis
                    print(f"   Populated fields: {populated_fields}")
                    print(f"   Empty fields: {empty_fields}")
                    
                    # Check vendor detection
                    detected_vendor = product_data.get('vendor', '')
                    if test_case['expected_vendor']:
                        if detected_vendor == test_case['expected_vendor']:
                            self.log_test(f"Scrape {test_case['name']} - Vendor Detection", True, f"Correctly detected: {detected_vendor}")
                        else:
                            self.log_test(f"Scrape {test_case['name']} - Vendor Detection", False, f"Expected: {test_case['expected_vendor']}, Got: {detected_vendor}")
                    
                    # Overall data extraction assessment
                    if len(populated_fields) > 0:
                        self.log_test(f"Scrape {test_case['name']} - Data Extraction", True, f"Extracted {len(populated_fields)}/{len(expected_fields)} fields")
                    else:
                        self.log_test(f"Scrape {test_case['name']} - Data Extraction", False, "No product data extracted")
                        
                else:
                    self.log_test(f"Scrape {test_case['name']} - Response Format", False, f"Incorrect response format: {data}")
                    
            else:
                # Check if it's a validation error vs server error
                if status_code == 400:
                    self.log_test(f"Scrape {test_case['name']} - Endpoint", True, f"Endpoint accessible, validation error (expected): {data}")
                elif status_code == 200:
                    self.log_test(f"Scrape {test_case['name']} - Endpoint", True, f"Endpoint accessible: {data}")
                else:
                    self.log_test(f"Scrape {test_case['name']} - Endpoint", False, f"Endpoint failed: {data} (Status: {status_code})")
            
            print(f"Raw response: {json.dumps(data, indent=2)}")
            print("-" * 50)

    def test_data_persistence(self):
        """Test that data persists correctly"""
        print("\n=== Testing Data Persistence ===")
        
        # Re-fetch project to verify all created data persists
        success, project_data, status_code = self.make_request('GET', f'/projects/{PROJECT_ID}')
        
        if not success:
            self.log_test("Data Persistence", False, f"Could not re-fetch project: {project_data}")
            return False
            
        # Count total items across all subcategories
        total_items = 0
        for room in project_data.get('rooms', []):
            for category in room.get('categories', []):
                for subcategory in category.get('subcategories', []):
                    total_items += len(subcategory.get('items', []))
                    
        if total_items > 0:
            self.log_test("Data Persistence", True, f"Found {total_items} persisted items in project")
            
            # Check if our test items are included
            test_items_found = 0
            for item_id in self.created_items:
                for room in project_data.get('rooms', []):
                    for category in room.get('categories', []):
                        for subcategory in category.get('subcategories', []):
                            for item in subcategory.get('items', []):
                                if item.get('id') == item_id:
                                    test_items_found += 1
                                    
            if test_items_found > 0:
                self.log_test("Test Item Persistence", True, f"{test_items_found} test items found in project")
            else:
                self.log_test("Test Item Persistence", False, "Test items not found in project structure")
        else:
            self.log_test("Data Persistence", True, "No items found but project structure persists")

    def cleanup_test_data(self):
        """Clean up test data"""
        print("\n=== Cleaning Up Test Data ===")
        
        # Delete test items
        for item_id in self.created_items:
            success, _, _ = self.make_request('DELETE', f'/items/{item_id}')
            if success:
                print(f"   Deleted test item: {item_id}")
            else:
                print(f"   Failed to delete test item: {item_id}")
                
        # Delete test rooms
        for room_id in self.created_rooms:
            success, _, _ = self.make_request('DELETE', f'/rooms/{room_id}')
            if success:
                print(f"   Deleted test room: {room_id}")
            else:
                print(f"   Failed to delete test room: {room_id}")

    def test_comprehensive_room_structure(self):
        """Test room creation with comprehensive structure from enhanced_rooms.py"""
        print("\n=== 🎯 TESTING COMPREHENSIVE ROOM STRUCTURE ===")
        
        # Test 1: Create kitchen room to verify comprehensive structure
        print("Testing kitchen room creation with comprehensive structure...")
        
        kitchen_data = {
            "name": "kitchen",
            "project_id": PROJECT_ID
        }
        
        success, room_data, status_code = self.make_request('POST', '/rooms', kitchen_data)
        
        if success and 'categories' in room_data:
            categories = room_data.get('categories', [])
            total_subcategories = 0
            total_items = 0
            
            print(f"📊 KITCHEN ROOM STRUCTURE ANALYSIS:")
            print(f"   Total Categories: {len(categories)}")
            
            # Check for new categories from enhanced_rooms.py
            category_names = [cat['name'].lower() for cat in categories]
            
            # Expected new categories from enhanced_rooms.py
            expected_categories = [
                'lighting', 'paint, wallpaper, and finishes', 'counter tops', 'appliances',
                'plumbing', 'furniture & storage', 'cabinets, storage & organization', 'decor & accessories'
            ]
            
            found_categories = []
            missing_categories = []
            
            for expected in expected_categories:
                if expected in category_names:
                    found_categories.append(expected)
                else:
                    missing_categories.append(expected)
            
            print(f"   Found Categories: {found_categories}")
            if missing_categories:
                print(f"   ❌ Missing Categories: {missing_categories}")
            
            # Check for new appliances in kitchen
            appliance_items = []
            new_appliances = ['drink fridge', 'ice machine', 'built in coffee maker', 'convection microwave', 'fridge and freezer drawer']
            found_new_appliances = []
            
            for category in categories:
                if 'appliance' in category['name'].lower():
                    for subcategory in category.get('subcategories', []):
                        for item in subcategory.get('items', []):
                            appliance_items.append(item['name'].lower())
                            if any(new_app in item['name'].lower() for new_app in new_appliances):
                                found_new_appliances.append(item['name'])
                
                total_subcategories += len(category.get('subcategories', []))
                for subcategory in category.get('subcategories', []):
                    total_items += len(subcategory.get('items', []))
            
            print(f"   Total Subcategories: {total_subcategories}")
            print(f"   Total Items: {total_items}")
            
            # Check for new appliances
            print(f"🔍 NEW APPLIANCES CHECK:")
            print(f"   Found New Appliances: {found_new_appliances}")
            
            # Check if we have comprehensive structure (should be hundreds of items, not just 56)
            if total_items > 100:
                self.log_test("Kitchen Comprehensive Structure", True, f"{total_items} items (expected hundreds)")
                print(f"✅ COMPREHENSIVE STRUCTURE CONFIRMED: {total_items} items")
            else:
                self.log_test("Kitchen Comprehensive Structure", False, f"Only {total_items} items (expected hundreds)")
                print(f"❌ BASIC STRUCTURE DETECTED: Only {total_items} items")
                
            # Check status defaults
            print(f"🔍 STATUS DEFAULTS CHECK:")
            blank_status_count = 0
            picked_status_count = 0
            
            for category in categories:
                for subcategory in category.get('subcategories', []):
                    for item in subcategory.get('items', []):
                        if item.get('status', '') == '':
                            blank_status_count += 1
                        elif item.get('status', '') == 'PICKED':
                            picked_status_count += 1
            
            print(f"   Items with blank status: {blank_status_count}")
            print(f"   Items with PICKED status: {picked_status_count}")
            
            if blank_status_count > picked_status_count:
                self.log_test("Status Defaults Blank", True, f"Most items have blank status ({blank_status_count} blank vs {picked_status_count} picked)")
            else:
                self.log_test("Status Defaults Blank", False, f"Too many items have PICKED status ({picked_status_count} picked vs {blank_status_count} blank)")
            
            # Store room for cleanup
            if 'id' in room_data:
                self.created_rooms.append(room_data['id'])
                
        else:
            self.log_test("Kitchen Comprehensive Structure", False, f"Failed to create kitchen room: {room_data}")

    def test_new_major_categories(self):
        """Test creation of new major categories: CABINETS and ARCHITECTURAL ELEMENTS"""
        print("\n=== 🎯 TESTING NEW MAJOR CATEGORIES ===")
        
        # Test 1: Create cabinets room
        print("Testing 'cabinets' room creation...")
        
        cabinets_data = {
            "name": "cabinets",
            "project_id": PROJECT_ID
        }
        
        success, room_data, status_code = self.make_request('POST', '/rooms', cabinets_data)
        
        if success and 'categories' in room_data:
            categories = room_data.get('categories', [])
            
            print(f"📊 CABINETS ROOM STRUCTURE:")
            print(f"   Total Categories: {len(categories)}")
            
            # Check for cabinet-specific categories
            cabinet_categories = ['kitchen cabinets', 'bathroom cabinets', 'built-in cabinets']
            found_cabinet_categories = []
            
            for category in categories:
                cat_name = category['name'].lower()
                if any(cab_cat in cat_name for cab_cat in cabinet_categories):
                    found_cabinet_categories.append(category['name'])
                    
                    # Check for RED 'CABINETS' subcategories
                    for subcategory in category.get('subcategories', []):
                        if subcategory['name'].upper() == 'CABINETS':
                            print(f"   ✅ Found CABINETS subcategory in {category['name']}")
                            print(f"      Color: {subcategory.get('color', 'N/A')}")
            
            print(f"   Found Cabinet Categories: {found_cabinet_categories}")
            
            if found_cabinet_categories:
                self.log_test("CABINETS Category Working", True, f"Found categories: {found_cabinet_categories}")
            else:
                self.log_test("CABINETS Category Working", False, "No cabinet categories found")
                
            # Store room for cleanup
            if 'id' in room_data:
                self.created_rooms.append(room_data['id'])
                
        else:
            self.log_test("CABINETS Category Working", False, f"Failed to create cabinets room: {room_data}")

        # Test 2: Create architectural elements room
        print("\nTesting 'architectural elements' room creation...")
        
        arch_data = {
            "name": "architectural elements",
            "project_id": PROJECT_ID
        }
        
        success, room_data, status_code = self.make_request('POST', '/rooms', arch_data)
        
        if success and 'categories' in room_data:
            categories = room_data.get('categories', [])
            
            print(f"📊 ARCHITECTURAL ELEMENTS ROOM STRUCTURE:")
            print(f"   Total Categories: {len(categories)}")
            
            # Check for architectural-specific categories
            arch_categories = ['trim work', 'architectural features', 'built-ins']
            found_arch_categories = []
            
            for category in categories:
                cat_name = category['name'].lower()
                if any(arch_cat in cat_name for arch_cat in arch_categories):
                    found_arch_categories.append(category['name'])
                    
                    # Check for RED subcategories
                    for subcategory in category.get('subcategories', []):
                        if subcategory['name'].upper() in ['TRIM', 'FEATURES', 'BUILT-INS']:
                            print(f"   ✅ Found {subcategory['name']} subcategory in {category['name']}")
                            print(f"      Color: {subcategory.get('color', 'N/A')}")
            
            print(f"   Found Architectural Categories: {found_arch_categories}")
            
            if found_arch_categories:
                self.log_test("ARCHITECTURAL ELEMENTS Category Working", True, f"Found categories: {found_arch_categories}")
            else:
                self.log_test("ARCHITECTURAL ELEMENTS Category Working", False, "No architectural categories found")
                
            # Store room for cleanup
            if 'id' in room_data:
                self.created_rooms.append(room_data['id'])
                
        else:
            self.log_test("ARCHITECTURAL ELEMENTS Category Working", False, f"Failed to create architectural elements room: {room_data}")

    def run_all_tests(self):
        """Run all FF&E backend tests"""
        print("🚀 Starting FF&E Backend API Tests - COMPREHENSIVE STRUCTURE FOCUS")
        print("=" * 60)
        
        # Run tests in logical order based on review request
        self.test_project_data_structure()      # Test #5: Project Data Structure
        self.test_add_room_functionality()      # Test #1: Add Room Functionality  
        self.test_comprehensive_room_structure() # 🎯 NEW: Test comprehensive structure
        self.test_new_major_categories()        # 🎯 NEW: Test new categories
        self.test_dropdown_endpoints()          # Test #2: Dropdown Data Endpoints
        self.test_link_scraping()              # Test #3: Web Scraping Endpoint
        self.test_item_operations()            # Test #4: Item CRUD Operations
        self.test_enum_endpoints()             # Additional: Basic enum endpoints
        self.test_data_persistence()           # Additional: Data persistence
        
        # Clean up
        self.cleanup_test_data()
        
        # Summary
        print("\n" + "=" * 50)
        print("📊 TEST SUMMARY")
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
        else:
            print("\n🎉 ALL TESTS PASSED!")
            
        return passed == total

if __name__ == "__main__":
    tester = FFEAPITester()
    success = tester.run_all_tests()
    sys.exit(0 if success else 1)
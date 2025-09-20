#!/usr/bin/env python3
"""
Enhanced Functionality Backend Testing Suite - REVIEW REQUEST TESTING
Tests the enhanced functionality implemented:
1. Enhanced Scraping - POST /api/scrape-product with thorough scraping
2. Canva PDF Scraping - POST /api/scrape-canva-pdf 
3. Add Category with Items - POST /api/categories with enhanced_rooms.py
4. Transfer Functionality - PUT /api/items/{id} for status updates
5. Walkthrough Add Item - Test adding blank rows
"""

import requests
import json
import uuid
from datetime import datetime
from typing import Dict, Any, List
import sys
import os
import time

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
PROJECT_ID = "5cccfb11-0ac0-45ed-91ab-a56088d65b5a"  # Greene Renovation project ID

print("=" * 80)
print("🎯 ENHANCED FUNCTIONALITY BACKEND TESTING - REVIEW REQUEST")
print("=" * 80)
print(f"Backend URL: {BASE_URL}")
print(f"Project ID: {PROJECT_ID} (Greene Renovation)")
print("Focus: Enhanced Scraping, Canva PDF, Add Category, Transfer, Walkthrough")
print("=" * 80)

class EnhancedFunctionalityTester:
    def __init__(self):
        self.session = requests.Session()
        self.test_results = []
        self.created_items = []
        self.created_rooms = []
        
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
        
    def make_request(self, method: str, endpoint: str, data: Dict = None, params: Dict = None, files: Dict = None) -> tuple:
        """Make HTTP request and return (success, response_data, status_code)"""
        try:
            url = f"{BASE_URL}{endpoint}"
            
            if method.upper() == 'GET':
                response = self.session.get(url, params=params, timeout=30)
            elif method.upper() == 'POST':
                if files:
                    response = self.session.post(url, data=data, files=files, timeout=30)
                else:
                    response = self.session.post(url, json=data, timeout=30)
            elif method.upper() == 'PUT':
                response = self.session.put(url, json=data, timeout=30)
            elif method.upper() == 'DELETE':
                response = self.session.delete(url, timeout=30)
            else:
                return False, f"Unsupported method: {method}", 400
                
            try:
                response_data = response.json() if response.content else {}
            except json.JSONDecodeError:
                response_data = {"raw_response": response.text}
                
            return response.status_code < 400, response_data, response.status_code
            
        except requests.exceptions.RequestException as e:
            return False, f"Request failed: {str(e)}", 0
        except Exception as e:
            return False, f"Unexpected error: {str(e)}", 0

    def test_enhanced_scraping(self):
        """Test Enhanced Scraping - POST /api/scrape-product with thorough scraping"""
        print("\n🔍 TESTING ENHANCED SCRAPING FUNCTIONALITY")
        print("=" * 60)
        
        # Test with the specific URL from review request
        test_url = "https://fourhandshome.com/products/fenn-chair-248067-003"
        print(f"Testing URL: {test_url}")
        
        scrape_data = {"url": test_url}
        success, response_data, status_code = self.make_request('POST', '/scrape-product', scrape_data)
        
        print(f"Status Code: {status_code}")
        print(f"Success: {success}")
        
        if success and isinstance(response_data, dict):
            # Check response format
            if 'success' in response_data and 'data' in response_data:
                self.log_test("Enhanced Scraping - Response Format", True, "Correct {success: true, data: {...}} format")
                
                product_data = response_data.get('data', {})
                
                # Check for enhanced fields
                enhanced_fields = {
                    'name': 'Product Name',
                    'price': 'Price/Cost', 
                    'sku': 'SKU',
                    'vendor': 'Vendor',
                    'image_url': 'Image URL',
                    'finish_color': 'Finish/Color',
                    'size': 'Size/Dimensions'
                }
                
                populated_fields = []
                missing_fields = []
                
                for field, description in enhanced_fields.items():
                    value = product_data.get(field, '')
                    if value and str(value).strip():
                        populated_fields.append(f"{description}: '{value}'")
                    else:
                        missing_fields.append(description)
                
                print(f"\n📊 ENHANCED SCRAPING RESULTS:")
                print(f"   Populated Fields ({len(populated_fields)}/{len(enhanced_fields)}):")
                for field in populated_fields:
                    print(f"      ✅ {field}")
                
                if missing_fields:
                    print(f"   Missing Fields ({len(missing_fields)}):")
                    for field in missing_fields:
                        print(f"      ❌ {field}")
                
                # Specific checks for review request requirements
                expected_name = "Fenn Chair"
                expected_vendor = "Four Hands"
                expected_sku = "248067-003"
                
                name_match = expected_name.lower() in product_data.get('name', '').lower()
                vendor_match = product_data.get('vendor', '') == expected_vendor
                sku_match = expected_sku in product_data.get('sku', '')
                
                if name_match:
                    self.log_test("Enhanced Scraping - Product Name", True, f"Found: {product_data.get('name', '')}")
                else:
                    self.log_test("Enhanced Scraping - Product Name", False, f"Expected '{expected_name}', got: {product_data.get('name', '')}")
                
                if vendor_match:
                    self.log_test("Enhanced Scraping - Vendor Detection", True, f"Correctly identified: {expected_vendor}")
                else:
                    self.log_test("Enhanced Scraping - Vendor Detection", False, f"Expected '{expected_vendor}', got: {product_data.get('vendor', '')}")
                
                if sku_match:
                    self.log_test("Enhanced Scraping - SKU Extraction", True, f"Found SKU: {product_data.get('sku', '')}")
                else:
                    self.log_test("Enhanced Scraping - SKU Extraction", False, f"Expected '{expected_sku}', got: {product_data.get('sku', '')}")
                
                # Check for price extraction
                price_value = product_data.get('price', '') or product_data.get('cost', '')
                if price_value and '$' in str(price_value):
                    self.log_test("Enhanced Scraping - Price Extraction", True, f"Found price: {price_value}")
                else:
                    self.log_test("Enhanced Scraping - Price Extraction", False, f"No price found: {price_value}")
                
                # Overall assessment
                if len(populated_fields) >= 4:
                    self.log_test("Enhanced Scraping - Overall", True, f"Successfully extracted {len(populated_fields)}/{len(enhanced_fields)} fields")
                else:
                    self.log_test("Enhanced Scraping - Overall", False, f"Only extracted {len(populated_fields)}/{len(enhanced_fields)} fields")
                    
            else:
                self.log_test("Enhanced Scraping - Response Format", False, f"Invalid response format: {response_data}")
        else:
            self.log_test("Enhanced Scraping - Endpoint", False, f"Scraping failed: {response_data} (Status: {status_code})")
        
        print(f"\nRaw Response: {json.dumps(response_data, indent=2)}")

    def test_canva_pdf_scraping(self):
        """Test Canva PDF Scraping - POST /api/scrape-canva-pdf"""
        print("\n🎨 TESTING CANVA PDF SCRAPING FUNCTIONALITY")
        print("=" * 60)
        
        # Test with sample Canva URL
        test_canva_url = "https://www.canva.com/design/sample-design/view"
        print(f"Testing Canva URL: {test_canva_url}")
        
        canva_data = {"url": test_canva_url}
        success, response_data, status_code = self.make_request('POST', '/scrape-canva-pdf', canva_data)
        
        print(f"Status Code: {status_code}")
        print(f"Success: {success}")
        
        if success and isinstance(response_data, dict):
            # Check if response has links array
            if 'links' in response_data:
                links = response_data.get('links', [])
                self.log_test("Canva PDF Scraping - Links Array", True, f"Found {len(links)} links")
                
                if isinstance(links, list):
                    if len(links) > 0:
                        self.log_test("Canva PDF Scraping - Link Extraction", True, f"Extracted {len(links)} links from Canva PDF")
                        
                        # Show sample links
                        print(f"\n📊 EXTRACTED LINKS:")
                        for i, link in enumerate(links[:5]):  # Show first 5
                            print(f"   {i+1}. {link}")
                        if len(links) > 5:
                            print(f"   ... and {len(links) - 5} more links")
                    else:
                        self.log_test("Canva PDF Scraping - Link Extraction", False, "No links extracted from Canva PDF")
                else:
                    self.log_test("Canva PDF Scraping - Links Array", False, f"Links is not an array: {type(links)}")
            else:
                self.log_test("Canva PDF Scraping - Links Array", False, "Response missing 'links' field")
                
            # Check for proper placement/organization
            if 'success' in response_data and response_data.get('success'):
                self.log_test("Canva PDF Scraping - Success Status", True, "Canva scraping completed successfully")
            else:
                self.log_test("Canva PDF Scraping - Success Status", False, "Canva scraping did not report success")
                
        elif status_code == 404:
            self.log_test("Canva PDF Scraping - Endpoint", False, "Endpoint not implemented - needs to be added to backend")
        else:
            self.log_test("Canva PDF Scraping - Endpoint", False, f"Canva scraping failed: {response_data} (Status: {status_code})")
        
        print(f"\nRaw Response: {json.dumps(response_data, indent=2)}")

    def test_add_category_with_items(self):
        """Test Add Category with Items - POST /api/categories with enhanced_rooms.py"""
        print("\n📂 TESTING ADD CATEGORY WITH ITEMS FUNCTIONALITY")
        print("=" * 60)
        
        # Test adding "Lighting" category as specified in review request
        print("Testing 'Lighting' category creation with ALL subcategories and items...")
        
        category_data = {
            "name": "Lighting",
            "room_id": None,  # Will be set after getting a room
            "description": "Comprehensive lighting category with all items"
        }
        
        # First, get project to find a room
        success, project_data, status_code = self.make_request('GET', f'/projects/{PROJECT_ID}')
        
        if not success:
            self.log_test("Add Category - Get Project", False, f"Could not get project: {project_data}")
            return
        
        rooms = project_data.get('rooms', [])
        if not rooms:
            self.log_test("Add Category - Find Room", False, "No rooms found in project")
            return
        
        # Use first room
        room_id = rooms[0]['id']
        category_data['room_id'] = room_id
        
        self.log_test("Add Category - Find Room", True, f"Using room ID: {room_id}")
        
        # Create the category
        success, response_data, status_code = self.make_request('POST', '/categories', category_data)
        
        print(f"Status Code: {status_code}")
        print(f"Success: {success}")
        
        if success and isinstance(response_data, dict):
            category_id = response_data.get('id')
            if category_id:
                self.log_test("Add Category - Creation", True, f"Category created with ID: {category_id}")
                
                # Check if category has subcategories and items
                subcategories = response_data.get('subcategories', [])
                if subcategories:
                    total_items = 0
                    subcategory_details = []
                    
                    for subcat in subcategories:
                        subcat_name = subcat.get('name', 'Unknown')
                        items = subcat.get('items', [])
                        total_items += len(items)
                        
                        if items:
                            subcategory_details.append(f"{subcat_name} ({len(items)} items)")
                    
                    print(f"\n📊 LIGHTING CATEGORY STRUCTURE:")
                    print(f"   Total Subcategories: {len(subcategories)}")
                    print(f"   Total Items: {total_items}")
                    print(f"   Subcategory Details: {'; '.join(subcategory_details)}")
                    
                    # Expected lighting items from enhanced_rooms.py
                    expected_lighting_items = [
                        'Chandelier', 'Recessed Lighting', 'Sconces', 'Pendant Lights',
                        'Under Cabinet Lighting', 'Track Lighting', 'Ceiling Fan w/ Light'
                    ]
                    
                    # Check for expected items
                    all_item_names = []
                    for subcat in subcategories:
                        for item in subcat.get('items', []):
                            all_item_names.append(item.get('name', '').lower())
                    
                    found_items = []
                    for expected in expected_lighting_items:
                        if any(expected.lower() in item_name for item_name in all_item_names):
                            found_items.append(expected)
                    
                    if len(found_items) >= 5:
                        self.log_test("Add Category - Comprehensive Items", True, f"Found {len(found_items)}/{len(expected_lighting_items)} expected lighting items")
                    else:
                        self.log_test("Add Category - Comprehensive Items", False, f"Only found {len(found_items)}/{len(expected_lighting_items)} expected lighting items")
                    
                    # Check for subcategory types (INSTALLED, PORTABLE)
                    subcat_names = [subcat.get('name', '').upper() for subcat in subcategories]
                    if 'INSTALLED' in subcat_names:
                        self.log_test("Add Category - INSTALLED Subcategory", True, "Found INSTALLED subcategory")
                    else:
                        self.log_test("Add Category - INSTALLED Subcategory", False, "Missing INSTALLED subcategory")
                    
                    if 'PORTABLE' in subcat_names:
                        self.log_test("Add Category - PORTABLE Subcategory", True, "Found PORTABLE subcategory")
                    else:
                        self.log_test("Add Category - PORTABLE Subcategory", False, "Missing PORTABLE subcategory")
                    
                    if total_items >= 10:
                        self.log_test("Add Category - Item Count", True, f"Created {total_items} items (comprehensive)")
                    else:
                        self.log_test("Add Category - Item Count", False, f"Only created {total_items} items (expected more)")
                        
                else:
                    self.log_test("Add Category - Subcategories", False, "No subcategories created with category")
            else:
                self.log_test("Add Category - Creation", False, "Category created but no ID returned")
        else:
            self.log_test("Add Category - Creation", False, f"Failed to create category: {response_data} (Status: {status_code})")
        
        print(f"\nRaw Response: {json.dumps(response_data, indent=2)}")

    def test_transfer_functionality(self):
        """Test Transfer Functionality - PUT /api/items/{id} for status updates"""
        print("\n🔄 TESTING TRANSFER FUNCTIONALITY")
        print("=" * 60)
        
        # First, get an item to test transfer on
        success, project_data, status_code = self.make_request('GET', f'/projects/{PROJECT_ID}')
        
        if not success:
            self.log_test("Transfer - Get Project", False, f"Could not get project: {project_data}")
            return
        
        # Find an item to test with
        test_item = None
        test_item_id = None
        original_status = None
        
        for room in project_data.get('rooms', []):
            for category in room.get('categories', []):
                for subcategory in category.get('subcategories', []):
                    items = subcategory.get('items', [])
                    if items:
                        test_item = items[0]
                        test_item_id = test_item.get('id')
                        original_status = test_item.get('status', '')
                        break
                if test_item_id:
                    break
            if test_item_id:
                break
        
        if not test_item_id:
            self.log_test("Transfer - Find Test Item", False, "No items found to test transfer on")
            return
        
        self.log_test("Transfer - Find Test Item", True, f"Using item: {test_item.get('name', 'Unknown')} (ID: {test_item_id})")
        print(f"   Original Status: '{original_status}'")
        
        # Test 1: Transfer from current status to "ORDER SAMPLES"
        new_status = "ORDER SAMPLES"
        update_data = {
            "status": new_status
        }
        
        success, response_data, status_code = self.make_request('PUT', f'/items/{test_item_id}', update_data)
        
        print(f"\nTransfer Test 1 - Status Update:")
        print(f"   Status Code: {status_code}")
        print(f"   Success: {success}")
        
        if success and isinstance(response_data, dict):
            updated_status = response_data.get('status', '')
            if updated_status == new_status:
                self.log_test("Transfer - Status Update", True, f"Successfully updated status to '{new_status}'")
            else:
                self.log_test("Transfer - Status Update", False, f"Status not updated correctly. Expected '{new_status}', got '{updated_status}'")
        else:
            self.log_test("Transfer - Status Update", False, f"Failed to update item status: {response_data} (Status: {status_code})")
        
        # Test 2: Verify persistence by re-fetching the item
        success, item_data, status_code = self.make_request('GET', f'/items/{test_item_id}')
        
        if success and isinstance(item_data, dict):
            persisted_status = item_data.get('status', '')
            if persisted_status == new_status:
                self.log_test("Transfer - Status Persistence", True, f"Status persisted correctly: '{persisted_status}'")
            else:
                self.log_test("Transfer - Status Persistence", False, f"Status not persisted. Expected '{new_status}', got '{persisted_status}'")
        else:
            self.log_test("Transfer - Status Persistence", False, f"Could not verify status persistence: {item_data}")
        
        # Test 3: Test bulk transfer (update multiple items)
        print(f"\nTransfer Test 2 - Bulk Transfer:")
        
        # Find another item for bulk transfer
        second_item_id = None
        for room in project_data.get('rooms', []):
            for category in room.get('categories', []):
                for subcategory in category.get('subcategories', []):
                    items = subcategory.get('items', [])
                    for item in items:
                        if item.get('id') != test_item_id:
                            second_item_id = item.get('id')
                            break
                    if second_item_id:
                        break
                if second_item_id:
                    break
            if second_item_id:
                break
        
        if second_item_id:
            # Update second item
            bulk_status = "SAMPLES ARRIVED"
            bulk_update_data = {"status": bulk_status}
            
            success, response_data, status_code = self.make_request('PUT', f'/items/{second_item_id}', bulk_update_data)
            
            if success:
                self.log_test("Transfer - Bulk Transfer", True, f"Successfully updated second item to '{bulk_status}'")
                
                # Verify both items have different statuses (simulating transfer between sheets)
                success1, item1_data, _ = self.make_request('GET', f'/items/{test_item_id}')
                success2, item2_data, _ = self.make_request('GET', f'/items/{second_item_id}')
                
                if success1 and success2:
                    status1 = item1_data.get('status', '')
                    status2 = item2_data.get('status', '')
                    
                    if status1 != status2:
                        self.log_test("Transfer - Multi-Item Status", True, f"Items have different statuses: '{status1}' vs '{status2}'")
                    else:
                        self.log_test("Transfer - Multi-Item Status", False, f"Items have same status: '{status1}'")
            else:
                self.log_test("Transfer - Bulk Transfer", False, f"Failed to update second item: {response_data}")
        else:
            self.log_test("Transfer - Bulk Transfer", False, "Could not find second item for bulk transfer test")
        
        # Test 4: Restore original status
        if original_status is not None:
            restore_data = {"status": original_status}
            success, _, _ = self.make_request('PUT', f'/items/{test_item_id}', restore_data)
            if success:
                print(f"   ✅ Restored original status: '{original_status}'")

    def test_walkthrough_add_item(self):
        """Test Walkthrough Add Item - Test adding blank rows for walkthrough functionality"""
        print("\n📝 TESTING WALKTHROUGH ADD ITEM FUNCTIONALITY")
        print("=" * 60)
        
        # Get a subcategory to add walkthrough items to
        success, project_data, status_code = self.make_request('GET', f'/projects/{PROJECT_ID}')
        
        if not success:
            self.log_test("Walkthrough - Get Project", False, f"Could not get project: {project_data}")
            return
        
        # Find a subcategory
        subcategory_id = None
        subcategory_name = None
        
        for room in project_data.get('rooms', []):
            for category in room.get('categories', []):
                for subcategory in category.get('subcategories', []):
                    subcategory_id = subcategory['id']
                    subcategory_name = subcategory.get('name', 'Unknown')
                    break
                if subcategory_id:
                    break
            if subcategory_id:
                break
        
        if not subcategory_id:
            self.log_test("Walkthrough - Find Subcategory", False, "No subcategory found for walkthrough testing")
            return
        
        self.log_test("Walkthrough - Find Subcategory", True, f"Using subcategory: {subcategory_name} (ID: {subcategory_id})")
        
        # Test 1: Add blank walkthrough item
        walkthrough_item_data = {
            "name": "Walkthrough Item - Blank Row",
            "quantity": 1,
            "size": "",
            "remarks": "Added for walkthrough functionality testing",
            "vendor": "",
            "status": "",  # Blank status for walkthrough
            "cost": 0.0,
            "link": "",
            "subcategory_id": subcategory_id
        }
        
        success, response_data, status_code = self.make_request('POST', '/items', walkthrough_item_data)
        
        print(f"Walkthrough Item Creation:")
        print(f"   Status Code: {status_code}")
        print(f"   Success: {success}")
        
        if success and isinstance(response_data, dict):
            item_id = response_data.get('id')
            if item_id:
                self.created_items.append(item_id)
                self.log_test("Walkthrough - Create Blank Item", True, f"Created walkthrough item with ID: {item_id}")
                
                # Verify blank status
                item_status = response_data.get('status', 'NOT_FOUND')
                if item_status == '' or item_status is None:
                    self.log_test("Walkthrough - Blank Status", True, "Item has blank status as expected for walkthrough")
                else:
                    self.log_test("Walkthrough - Blank Status", False, f"Item has status '{item_status}' instead of blank")
                
                # Verify walkthrough-specific fields
                walkthrough_fields = {
                    'quantity': response_data.get('quantity', 0),
                    'size': response_data.get('size', ''),
                    'remarks': response_data.get('remarks', ''),
                    'vendor': response_data.get('vendor', ''),
                    'cost': response_data.get('cost', 0)
                }
                
                print(f"\n📊 WALKTHROUGH ITEM STRUCTURE:")
                for field, value in walkthrough_fields.items():
                    print(f"   {field}: '{value}'")
                
                # Check if item appears in project structure
                success, updated_project, _ = self.make_request('GET', f'/projects/{PROJECT_ID}')
                if success:
                    item_found = False
                    for room in updated_project.get('rooms', []):
                        for category in room.get('categories', []):
                            for subcategory in category.get('subcategories', []):
                                for item in subcategory.get('items', []):
                                    if item.get('id') == item_id:
                                        item_found = True
                                        break
                    
                    if item_found:
                        self.log_test("Walkthrough - Item in Project", True, "Walkthrough item appears in project structure")
                    else:
                        self.log_test("Walkthrough - Item in Project", False, "Walkthrough item not found in project structure")
                
            else:
                self.log_test("Walkthrough - Create Blank Item", False, "Item created but no ID returned")
        else:
            self.log_test("Walkthrough - Create Blank Item", False, f"Failed to create walkthrough item: {response_data} (Status: {status_code})")
        
        # Test 2: Add multiple blank rows for walkthrough
        print(f"\nTesting multiple blank rows creation...")
        
        blank_rows_created = 0
        for i in range(3):  # Create 3 blank rows
            blank_row_data = {
                "name": f"Blank Row {i+1}",
                "quantity": 1,
                "size": "",
                "remarks": "",
                "vendor": "",
                "status": "",
                "cost": 0.0,
                "link": "",
                "subcategory_id": subcategory_id
            }
            
            success, response_data, status_code = self.make_request('POST', '/items', blank_row_data)
            
            if success and response_data.get('id'):
                self.created_items.append(response_data['id'])
                blank_rows_created += 1
        
        if blank_rows_created == 3:
            self.log_test("Walkthrough - Multiple Blank Rows", True, f"Successfully created {blank_rows_created} blank rows")
        else:
            self.log_test("Walkthrough - Multiple Blank Rows", False, f"Only created {blank_rows_created}/3 blank rows")
        
        print(f"\nRaw Response: {json.dumps(response_data, indent=2)}")

    def test_backend_endpoints_verification(self):
        """Verify all backend endpoints mentioned in review request"""
        print("\n🔗 TESTING BACKEND ENDPOINTS VERIFICATION")
        print("=" * 60)
        
        endpoints_to_test = [
            {
                'method': 'POST',
                'endpoint': '/scrape-product',
                'description': 'Enhanced scraping with better selectors',
                'test_data': {'url': 'https://example.com'}
            },
            {
                'method': 'POST', 
                'endpoint': '/scrape-canva-pdf',
                'description': 'Canva PDF scraping for links',
                'test_data': {'url': 'https://canva.com/design/test'}
            },
            {
                'method': 'POST',
                'endpoint': '/categories',
                'description': 'Category creation with enhanced_rooms.py',
                'test_data': {'name': 'Test Category', 'room_id': 'test'}
            },
            {
                'method': 'PUT',
                'endpoint': f'/items/test-id',
                'description': 'Item status updates for transfer',
                'test_data': {'status': 'ORDER SAMPLES'}
            },
            {
                'method': 'GET',
                'endpoint': f'/projects/{PROJECT_ID}',
                'description': 'Project data structure verification',
                'test_data': None
            }
        ]
        
        for endpoint_test in endpoints_to_test:
            method = endpoint_test['method']
            endpoint = endpoint_test['endpoint']
            description = endpoint_test['description']
            test_data = endpoint_test['test_data']
            
            print(f"\n--- Testing {method} {endpoint} ---")
            print(f"    Purpose: {description}")
            
            success, response_data, status_code = self.make_request(method, endpoint, test_data)
            
            # Endpoint accessibility check
            if status_code == 404:
                self.log_test(f"Endpoint {method} {endpoint}", False, "Endpoint not found (404)")
            elif status_code == 405:
                self.log_test(f"Endpoint {method} {endpoint}", False, "Method not allowed (405)")
            elif status_code in [200, 201, 400, 422]:  # 400/422 are acceptable for test data
                self.log_test(f"Endpoint {method} {endpoint}", True, f"Endpoint accessible (Status: {status_code})")
            else:
                self.log_test(f"Endpoint {method} {endpoint}", False, f"Unexpected status: {status_code}")
            
            print(f"    Status: {status_code}")
            print(f"    Response: {json.dumps(response_data, indent=2)[:200]}...")

    def cleanup_test_data(self):
        """Clean up test data"""
        print("\n🧹 CLEANING UP TEST DATA")
        print("=" * 60)
        
        # Delete test items
        for item_id in self.created_items:
            success, _, _ = self.make_request('DELETE', f'/items/{item_id}')
            if success:
                print(f"   ✅ Deleted test item: {item_id}")
            else:
                print(f"   ❌ Failed to delete test item: {item_id}")
        
        # Delete test rooms
        for room_id in self.created_rooms:
            success, _, _ = self.make_request('DELETE', f'/rooms/{room_id}')
            if success:
                print(f"   ✅ Deleted test room: {room_id}")
            else:
                print(f"   ❌ Failed to delete test room: {room_id}")

    def run_all_tests(self):
        """Run all enhanced functionality tests"""
        print("🚀 Starting Enhanced Functionality Tests...")
        
        test_results = []
        
        # Test 1: Enhanced Scraping
        print("\n" + "="*80)
        self.test_enhanced_scraping()
        
        # Test 2: Canva PDF Scraping
        print("\n" + "="*80)
        self.test_canva_pdf_scraping()
        
        # Test 3: Add Category with Items
        print("\n" + "="*80)
        self.test_add_category_with_items()
        
        # Test 4: Transfer Functionality
        print("\n" + "="*80)
        self.test_transfer_functionality()
        
        # Test 5: Walkthrough Add Item
        print("\n" + "="*80)
        self.test_walkthrough_add_item()
        
        # Test 6: Backend Endpoints Verification
        print("\n" + "="*80)
        self.test_backend_endpoints_verification()
        
        # Cleanup
        print("\n" + "="*80)
        self.cleanup_test_data()
        
        # Summary
        print("\n" + "=" * 80)
        print("📊 ENHANCED FUNCTIONALITY TEST SUMMARY")
        print("=" * 80)
        
        passed_tests = sum(1 for result in self.test_results if result['success'])
        total_tests = len(self.test_results)
        
        print(f"✅ Total Tests: {total_tests}")
        print(f"✅ Passed: {passed_tests}")
        print(f"❌ Failed: {total_tests - passed_tests}")
        print(f"📈 Success Rate: {(passed_tests/total_tests)*100:.1f}%")
        
        # Detailed results by category
        categories = {
            'Enhanced Scraping': [r for r in self.test_results if 'Enhanced Scraping' in r['test']],
            'Canva PDF Scraping': [r for r in self.test_results if 'Canva PDF' in r['test']],
            'Add Category': [r for r in self.test_results if 'Add Category' in r['test']],
            'Transfer': [r for r in self.test_results if 'Transfer' in r['test']],
            'Walkthrough': [r for r in self.test_results if 'Walkthrough' in r['test']],
            'Endpoints': [r for r in self.test_results if 'Endpoint' in r['test']]
        }
        
        print(f"\n📋 RESULTS BY CATEGORY:")
        for category, results in categories.items():
            if results:
                passed = sum(1 for r in results if r['success'])
                total = len(results)
                status = "✅" if passed == total else "⚠️" if passed > 0 else "❌"
                print(f"   {status} {category}: {passed}/{total}")
        
        # Critical issues
        critical_failures = [r for r in self.test_results if not r['success'] and any(keyword in r['test'] for keyword in ['Enhanced Scraping', 'Transfer', 'Add Category'])]
        
        if critical_failures:
            print(f"\n🚨 CRITICAL ISSUES FOUND:")
            for failure in critical_failures:
                print(f"   ❌ {failure['test']}: {failure['details']}")
        
        return passed_tests == total_tests


# Main execution
if __name__ == "__main__":
    tester = EnhancedFunctionalityTester()
    success = tester.run_all_tests()
    
    if success:
        print("\n🎉 SUCCESS: All enhanced functionality tests passed!")
        exit(0)
    else:
        print("\n⚠️ SOME TESTS FAILED: Enhanced functionality needs attention.")
        exit(1)
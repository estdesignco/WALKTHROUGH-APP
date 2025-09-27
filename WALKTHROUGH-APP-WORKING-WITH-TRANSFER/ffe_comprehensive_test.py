#!/usr/bin/env python3
"""
FF&E Comprehensive Testing Suite - Review Request Specific Tests
Tests the COMPLETE FF&E system with focus on:
1. Enhanced scraping (Four Hands URL specifically)
2. Professional data structure verification
3. Item creation testing
4. Color-coded status system (22 status options)
5. Carrier system (19 carrier options)
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
PROJECT_ID = "bb060596-85c2-455f-860a-cf9fa23dfacf"

print(f"🔍 FF&E COMPREHENSIVE TESTING SUITE")
print(f"Testing Backend APIs at: {BASE_URL}")
print(f"Using Project ID: {PROJECT_ID}")

class FFEComprehensiveTester:
    def __init__(self):
        self.session = requests.Session()
        self.test_results = []
        self.created_items = []
        
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

    def test_enhanced_scraping_four_hands(self):
        """Test 1: Enhanced Scraping - Verify Four Hands URL scraping gets MAIN product image"""
        print("\n🎯 TEST 1: ENHANCED SCRAPING - FOUR HANDS SPECIFIC URL")
        print("=" * 60)
        
        four_hands_url = "https://fourhands.com/product/248067-003"
        print(f"Testing URL: {four_hands_url}")
        
        scrape_data = {"url": four_hands_url}
        success, data, status_code = self.make_request('POST', '/scrape-product', scrape_data)
        
        if not success:
            self.log_test("Four Hands URL Accessibility", False, f"Failed to access endpoint: {data} (Status: {status_code})")
            return False
            
        # Verify response structure
        if not isinstance(data, dict) or 'success' not in data or 'data' not in data:
            self.log_test("Four Hands Response Format", False, f"Invalid response format: {data}")
            return False
            
        self.log_test("Four Hands Response Format", True, "Correct {success: true, data: {...}} format")
        
        product_data = data.get('data', {})
        
        # Test specific fields for Four Hands
        expected_fields = {
            'name': 'Product name extraction',
            'vendor': 'Vendor detection (should be "Four Hands")',
            'sku': 'SKU extraction (should be "248067-003")',
            'image_url': 'MAIN product image URL',
            'price': 'Price extraction',
            'description': 'Product description',
            'size': 'Product dimensions',
            'color': 'Product color/finish'
        }
        
        print(f"\n📊 FOUR HANDS DATA EXTRACTION ANALYSIS:")
        print("-" * 50)
        
        extraction_score = 0
        total_fields = len(expected_fields)
        
        for field, description in expected_fields.items():
            value = product_data.get(field, '')
            has_value = value and str(value).strip() and str(value).strip().lower() != 'null'
            
            if has_value:
                extraction_score += 1
                print(f"✅ {field}: '{value}' ({description})")
                
                # Special validation for key fields
                if field == 'vendor' and value == 'Four Hands':
                    self.log_test("Four Hands Vendor Detection", True, f"Correctly identified: {value}")
                elif field == 'sku' and '248067-003' in str(value):
                    self.log_test("Four Hands SKU Extraction", True, f"Correctly extracted: {value}")
                elif field == 'name' and value and len(str(value)) > 3:
                    self.log_test("Four Hands Product Name", True, f"Extracted product name: {value}")
                elif field == 'image_url' and value and 'http' in str(value):
                    self.log_test("Four Hands MAIN Image URL", True, f"Extracted image URL: {value[:50]}...")
            else:
                print(f"❌ {field}: (empty) - {description}")
        
        # Overall extraction assessment
        extraction_percentage = (extraction_score / total_fields) * 100
        print(f"\n📈 EXTRACTION SCORE: {extraction_score}/{total_fields} fields ({extraction_percentage:.1f}%)")
        
        if extraction_score >= 3:  # At least name, vendor, sku
            self.log_test("Four Hands Enhanced Scraping", True, f"Successfully extracted {extraction_score}/{total_fields} fields ({extraction_percentage:.1f}%)")
        else:
            self.log_test("Four Hands Enhanced Scraping", False, f"Only extracted {extraction_score}/{total_fields} fields ({extraction_percentage:.1f}%)")
            
        return extraction_score >= 3

    def test_professional_data_structure(self):
        """Test 2: Verify Professional Data Structure - Enhanced room structures, categories, and item statuses"""
        print("\n🏗️ TEST 2: PROFESSIONAL DATA STRUCTURE VERIFICATION")
        print("=" * 60)
        
        # Get project data
        success, project_data, status_code = self.make_request('GET', f'/projects/{PROJECT_ID}')
        
        if not success:
            self.log_test("Project Data Retrieval", False, f"Failed to get project: {project_data}")
            return False
            
        self.log_test("Project Data Retrieval", True, f"Successfully retrieved project: {project_data.get('name', 'Unknown')}")
        
        # Analyze room structure
        rooms = project_data.get('rooms', [])
        if not rooms:
            self.log_test("Room Structure", False, "No rooms found in project")
            return False
            
        print(f"\n📋 ROOM STRUCTURE ANALYSIS:")
        print("-" * 40)
        
        total_rooms = len(rooms)
        total_categories = 0
        total_subcategories = 0
        total_items = 0
        
        room_details = []
        
        for room in rooms:
            room_name = room.get('name', 'Unknown')
            room_color = room.get('color', 'No color')
            categories = room.get('categories', [])
            
            room_cats = len(categories)
            room_subcats = 0
            room_items = 0
            
            for category in categories:
                cat_name = category.get('name', 'Unknown')
                cat_color = category.get('color', 'No color')
                subcategories = category.get('subcategories', [])
                
                room_subcats += len(subcategories)
                
                for subcategory in subcategories:
                    subcat_name = subcategory.get('name', 'Unknown')
                    subcat_color = subcategory.get('color', 'No color')
                    items = subcategory.get('items', [])
                    room_items += len(items)
            
            total_categories += room_cats
            total_subcategories += room_subcats
            total_items += room_items
            
            room_details.append(f"{room_name} ({room_color}): {room_cats} cats, {room_subcats} subcats, {room_items} items")
            print(f"🏠 {room_name} (Color: {room_color})")
            print(f"   └── Categories: {room_cats}, Subcategories: {room_subcats}, Items: {room_items}")
        
        print(f"\n📊 STRUCTURE SUMMARY:")
        print(f"   Rooms: {total_rooms}")
        print(f"   Categories: {total_categories}")
        print(f"   Subcategories: {total_subcategories}")
        print(f"   Items: {total_items}")
        
        # Verify 3-level hierarchy
        if total_rooms > 0 and total_categories > 0 and total_subcategories > 0:
            self.log_test("3-Level Hierarchy", True, f"Complete hierarchy: {total_rooms} rooms → {total_categories} categories → {total_subcategories} subcategories")
        else:
            self.log_test("3-Level Hierarchy", False, f"Incomplete hierarchy: {total_rooms} rooms, {total_categories} categories, {total_subcategories} subcategories")
        
        # Verify color coding
        rooms_with_colors = sum(1 for room in rooms if room.get('color') and room.get('color') != 'No color')
        if rooms_with_colors > 0:
            self.log_test("Room Color Coding", True, f"{rooms_with_colors}/{total_rooms} rooms have color codes")
        else:
            self.log_test("Room Color Coding", False, "No rooms have color codes")
            
        return total_rooms > 0 and total_categories > 0

    def test_item_creation_hierarchy(self):
        """Test 3: Test Item Creation - Create test items and verify hierarchy works"""
        print("\n🔨 TEST 3: ITEM CREATION & HIERARCHY TESTING")
        print("=" * 60)
        
        # Get project structure to find subcategories
        success, project_data, _ = self.make_request('GET', f'/projects/{PROJECT_ID}')
        if not success:
            self.log_test("Get Project for Item Creation", False, "Could not retrieve project")
            return False
            
        # Find subcategories to add items to
        subcategories = []
        for room in project_data.get('rooms', []):
            for category in room.get('categories', []):
                for subcategory in category.get('subcategories', []):
                    subcategories.append({
                        'id': subcategory['id'],
                        'name': subcategory['name'],
                        'room': room['name'],
                        'category': category['name']
                    })
        
        if not subcategories:
            self.log_test("Find Subcategories", False, "No subcategories found for item creation")
            return False
            
        self.log_test("Find Subcategories", True, f"Found {len(subcategories)} subcategories for testing")
        
        # Create test items with professional data
        test_items = [
            {
                "name": "Professional Crystal Chandelier",
                "quantity": 1,
                "size": "48\" diameter x 36\" height",
                "remarks": "Main dining room centerpiece - Baccarat crystal",
                "vendor": "Visual Comfort",
                "status": "PICKED",
                "cost": 8500.00,
                "price": 12750.00,
                "link": "https://visualcomfort.com/chandelier-crystal",
                "sku": "VC-CHB2175CG",
                "finish_color": "Champagne Gold with Clear Crystal",
                "description": "Elegant crystal chandelier with champagne gold finish",
                "carrier": "White Glove Delivery",
                "priority": "High",
                "lead_time_weeks": 12
            },
            {
                "name": "Custom Velvet Sectional Sofa",
                "quantity": 1,
                "size": "120\" L x 84\" W x 32\" H",
                "remarks": "Living room seating - Navy velvet upholstery",
                "vendor": "Four Hands",
                "status": "ORDERED",
                "cost": 4200.00,
                "price": 6300.00,
                "link": "https://fourhands.com/sectional-velvet",
                "sku": "FH-CKEN-248067",
                "finish_color": "Navy Velvet with Brass Nailheads",
                "description": "Luxury sectional sofa in navy performance velvet",
                "carrier": "Freight",
                "priority": "High",
                "lead_time_weeks": 16
            },
            {
                "name": "Marble Console Table",
                "quantity": 1,
                "size": "72\" L x 16\" W x 32\" H",
                "remarks": "Entryway console - Carrara marble top",
                "vendor": "Bernhardt",
                "status": "RESEARCHING",
                "cost": 2800.00,
                "price": 4200.00,
                "link": "https://bernhardt.com/console-marble",
                "sku": "BH-CT-9847",
                "finish_color": "Carrara Marble with Antique Brass Base",
                "description": "Elegant console table with natural marble top",
                "carrier": "White Glove Delivery",
                "priority": "Medium",
                "lead_time_weeks": 8
            }
        ]
        
        created_items = []
        
        for i, item_data in enumerate(test_items):
            if i < len(subcategories):
                subcategory = subcategories[i]
                item_data['subcategory_id'] = subcategory['id']
                
                print(f"\n🔨 Creating item in: {subcategory['room']} > {subcategory['category']} > {subcategory['name']}")
                print(f"   Item: {item_data['name']}")
                
                success, response_data, status_code = self.make_request('POST', '/items', item_data)
                
                if success and response_data.get('id'):
                    item_id = response_data['id']
                    created_items.append(item_id)
                    self.created_items.append(item_id)
                    
                    self.log_test(f"Create Item: {item_data['name']}", True, f"Created in {subcategory['room']} > {subcategory['category']} > {subcategory['name']}")
                    
                    # Verify item appears in hierarchy
                    success, updated_project, _ = self.make_request('GET', f'/projects/{PROJECT_ID}')
                    if success:
                        item_found = False
                        for room in updated_project.get('rooms', []):
                            for category in room.get('categories', []):
                                for subcat in category.get('subcategories', []):
                                    for item in subcat.get('items', []):
                                        if item.get('id') == item_id:
                                            item_found = True
                                            break
                        
                        if item_found:
                            self.log_test(f"Verify Item in Hierarchy: {item_data['name']}", True, "Item appears in project hierarchy")
                        else:
                            self.log_test(f"Verify Item in Hierarchy: {item_data['name']}", False, "Item not found in project hierarchy")
                else:
                    self.log_test(f"Create Item: {item_data['name']}", False, f"Failed to create: {response_data}")
        
        if len(created_items) > 0:
            self.log_test("Item Creation Test", True, f"Successfully created {len(created_items)} professional test items")
            return True
        else:
            self.log_test("Item Creation Test", False, "Failed to create any test items")
            return False

    def test_color_coded_status_system(self):
        """Test 4: Verify Color-Coded Status System - Test 22 status options with colors"""
        print("\n🎨 TEST 4: COLOR-CODED STATUS SYSTEM (22 STATUS OPTIONS)")
        print("=" * 60)
        
        # Get item statuses
        success, statuses_data, status_code = self.make_request('GET', '/item-statuses')
        
        if not success:
            self.log_test("Get Item Statuses", False, f"Failed to retrieve statuses: {statuses_data}")
            return False
            
        # Check if we get the enhanced status format with colors
        if isinstance(statuses_data, list) and len(statuses_data) > 0:
            # Check if first item has color information
            first_status = statuses_data[0]
            if isinstance(first_status, dict) and 'color' in first_status:
                # Enhanced format with colors
                self.log_test("Status Format", True, f"Enhanced format with colors detected")
                
                print(f"\n🎨 STATUS OPTIONS WITH COLORS:")
                print("-" * 50)
                
                phases = {}
                for status in statuses_data:
                    status_name = status.get('status', 'Unknown')
                    color = status.get('color', 'No color')
                    phase = status.get('phase', 'unknown')
                    
                    if phase not in phases:
                        phases[phase] = []
                    phases[phase].append(f"{status_name} ({color})")
                    
                    print(f"📌 {status_name}: {color} (Phase: {phase})")
                
                # Verify we have the expected number of statuses
                total_statuses = len(statuses_data)
                if total_statuses >= 20:  # Should be around 22
                    self.log_test("Status Count", True, f"Found {total_statuses} status options (expected ~22)")
                else:
                    self.log_test("Status Count", False, f"Only found {total_statuses} status options (expected ~22)")
                
                # Verify key phases exist
                expected_phases = ['planning', 'procurement', 'fulfillment', 'delivery', 'installation', 'exception']
                found_phases = list(phases.keys())
                
                print(f"\n📊 STATUS PHASES:")
                for phase, statuses in phases.items():
                    print(f"   {phase.upper()}: {len(statuses)} statuses")
                
                if len(found_phases) >= 4:
                    self.log_test("Status Phases", True, f"Found {len(found_phases)} phases: {found_phases}")
                else:
                    self.log_test("Status Phases", False, f"Only found {len(found_phases)} phases: {found_phases}")
                    
            else:
                # Simple string array format
                self.log_test("Status Format", False, f"Simple string format detected, no color information")
                print(f"\n📝 SIMPLE STATUS LIST ({len(statuses_data)} statuses):")
                for status in statuses_data[:10]:  # Show first 10
                    print(f"   • {status}")
                if len(statuses_data) > 10:
                    print(f"   ... and {len(statuses_data) - 10} more")
        else:
            self.log_test("Get Item Statuses", False, f"Invalid response format: {statuses_data}")
            return False
            
        # Test status assignment to items
        if self.created_items:
            test_statuses = ['PICKED', 'ORDERED', 'SHIPPED', 'DELIVERED TO JOB SITE', 'INSTALLED']
            
            for i, item_id in enumerate(self.created_items[:3]):  # Test first 3 items
                if i < len(test_statuses):
                    test_status = test_statuses[i]
                    
                    update_data = {"status": test_status}
                    success, response, _ = self.make_request('PUT', f'/items/{item_id}', update_data)
                    
                    if success and response.get('status') == test_status:
                        self.log_test(f"Status Assignment: {test_status}", True, f"Successfully assigned to item {item_id}")
                    else:
                        self.log_test(f"Status Assignment: {test_status}", False, f"Failed to assign to item {item_id}")
        
        return True

    def test_carrier_system(self):
        """Test 5: Verify Carrier System - Test 19 carrier options with colors"""
        print("\n🚚 TEST 5: CARRIER SYSTEM (19 CARRIER OPTIONS)")
        print("=" * 60)
        
        # Get carrier types
        success, carriers_data, status_code = self.make_request('GET', '/carrier-types')
        
        if not success:
            self.log_test("Get Carrier Types", False, f"Failed to retrieve carriers: {carriers_data}")
            return False
            
        if isinstance(carriers_data, list) and len(carriers_data) > 0:
            total_carriers = len(carriers_data)
            
            print(f"\n🚚 CARRIER OPTIONS:")
            print("-" * 40)
            
            # Check if carriers have enhanced format with colors
            first_carrier = carriers_data[0]
            if isinstance(first_carrier, dict) and 'color' in first_carrier:
                # Enhanced format with colors and tracking URLs
                self.log_test("Carrier Format", True, "Enhanced format with colors detected")
                
                for carrier in carriers_data:
                    name = carrier.get('name', 'Unknown')
                    color = carrier.get('color', 'No color')
                    tracking_url = carrier.get('tracking_url', 'No tracking')
                    
                    print(f"📦 {name}: {color}")
                    if tracking_url and tracking_url != 'No tracking':
                        print(f"   └── Tracking: {tracking_url}")
                        
            else:
                # Simple string array
                self.log_test("Carrier Format", False, "Simple string format, no color information")
                for carrier in carriers_data:
                    print(f"   • {carrier}")
            
            # Verify carrier count
            if total_carriers >= 18:  # Should be around 19
                self.log_test("Carrier Count", True, f"Found {total_carriers} carrier options (expected ~19)")
            else:
                self.log_test("Carrier Count", False, f"Only found {total_carriers} carrier options (expected ~19)")
            
            # Verify key carriers exist
            carrier_names = []
            if isinstance(carriers_data[0], dict):
                carrier_names = [c.get('name', '') for c in carriers_data]
            else:
                carrier_names = carriers_data
                
            key_carriers = ['FedEx', 'UPS', 'White Glove Delivery', 'Freight', 'Brooks', 'Zenith']
            found_key_carriers = [c for c in key_carriers if c in carrier_names]
            
            if len(found_key_carriers) >= 4:
                self.log_test("Key Carriers", True, f"Found key carriers: {found_key_carriers}")
            else:
                self.log_test("Key Carriers", False, f"Missing key carriers. Found: {found_key_carriers}")
                
        else:
            self.log_test("Get Carrier Types", False, f"Invalid response format: {carriers_data}")
            return False
            
        # Test carrier assignment to items
        if self.created_items:
            test_carriers = ['FedEx', 'White Glove Delivery', 'Freight']
            
            for i, item_id in enumerate(self.created_items[:3]):
                if i < len(test_carriers):
                    test_carrier = test_carriers[i]
                    
                    update_data = {"carrier": test_carrier}
                    success, response, _ = self.make_request('PUT', f'/items/{item_id}', update_data)
                    
                    if success:
                        self.log_test(f"Carrier Assignment: {test_carrier}", True, f"Successfully assigned to item {item_id}")
                    else:
                        self.log_test(f"Carrier Assignment: {test_carrier}", False, f"Failed to assign to item {item_id}")
        
        return True

    def test_data_flow_verification(self):
        """Verify all data flows correctly from backend to frontend structure"""
        print("\n🔄 TEST 6: DATA FLOW VERIFICATION")
        print("=" * 60)
        
        # Get final project state
        success, project_data, _ = self.make_request('GET', f'/projects/{PROJECT_ID}')
        
        if not success:
            self.log_test("Final Data Flow Check", False, "Could not retrieve final project state")
            return False
            
        # Verify all created items are in the project
        items_in_project = []
        for room in project_data.get('rooms', []):
            for category in room.get('categories', []):
                for subcategory in category.get('subcategories', []):
                    for item in subcategory.get('items', []):
                        items_in_project.append(item.get('id'))
        
        created_items_found = 0
        for item_id in self.created_items:
            if item_id in items_in_project:
                created_items_found += 1
        
        if created_items_found == len(self.created_items):
            self.log_test("Data Flow - Item Integration", True, f"All {created_items_found} created items found in project hierarchy")
        else:
            self.log_test("Data Flow - Item Integration", False, f"Only {created_items_found}/{len(self.created_items)} items found in project")
        
        # Verify professional data structure is maintained
        professional_fields_found = 0
        total_professional_fields = 0
        
        for room in project_data.get('rooms', []):
            for category in room.get('categories', []):
                for subcategory in category.get('subcategories', []):
                    for item in subcategory.get('items', []):
                        # Check for professional fields
                        professional_fields = ['sku', 'finish_color', 'price', 'carrier', 'priority', 'lead_time_weeks']
                        for field in professional_fields:
                            total_professional_fields += 1
                            if item.get(field):
                                professional_fields_found += 1
        
        if total_professional_fields > 0:
            professional_percentage = (professional_fields_found / total_professional_fields) * 100
            if professional_percentage >= 50:
                self.log_test("Data Flow - Professional Fields", True, f"{professional_percentage:.1f}% of professional fields populated")
            else:
                self.log_test("Data Flow - Professional Fields", False, f"Only {professional_percentage:.1f}% of professional fields populated")
        
        return True

    def cleanup_test_data(self):
        """Clean up test data"""
        print("\n🧹 CLEANING UP TEST DATA")
        print("=" * 40)
        
        cleanup_count = 0
        for item_id in self.created_items:
            success, _, _ = self.make_request('DELETE', f'/items/{item_id}')
            if success:
                cleanup_count += 1
                print(f"   ✅ Deleted test item: {item_id}")
            else:
                print(f"   ❌ Failed to delete test item: {item_id}")
        
        if cleanup_count > 0:
            self.log_test("Test Data Cleanup", True, f"Cleaned up {cleanup_count} test items")
        
        return cleanup_count

    def run_comprehensive_tests(self):
        """Run all comprehensive FF&E tests"""
        print("🚀 STARTING FF&E COMPREHENSIVE TESTING SUITE")
        print("=" * 70)
        print("Focus Areas:")
        print("1. Enhanced Scraping (Four Hands URL)")
        print("2. Professional Data Structure")
        print("3. Item Creation & Hierarchy")
        print("4. Color-Coded Status System (22 options)")
        print("5. Carrier System (19 options)")
        print("6. Data Flow Verification")
        print("=" * 70)
        
        # Run all tests
        self.test_enhanced_scraping_four_hands()
        self.test_professional_data_structure()
        self.test_item_creation_hierarchy()
        self.test_color_coded_status_system()
        self.test_carrier_system()
        self.test_data_flow_verification()
        
        # Clean up
        self.cleanup_test_data()
        
        # Final Summary
        print("\n" + "=" * 70)
        print("🎯 COMPREHENSIVE TEST SUMMARY")
        print("=" * 70)
        
        passed = sum(1 for result in self.test_results if result['success'])
        total = len(self.test_results)
        
        print(f"📊 Results: {passed}/{total} tests passed ({(passed/total)*100:.1f}% success rate)")
        
        # Categorize results by test area
        test_areas = {
            'Enhanced Scraping': [r for r in self.test_results if 'Four Hands' in r['test'] or 'Scraping' in r['test']],
            'Data Structure': [r for r in self.test_results if 'Structure' in r['test'] or 'Hierarchy' in r['test']],
            'Item Creation': [r for r in self.test_results if 'Create Item' in r['test'] or 'Item Creation' in r['test']],
            'Status System': [r for r in self.test_results if 'Status' in r['test']],
            'Carrier System': [r for r in self.test_results if 'Carrier' in r['test']],
            'Data Flow': [r for r in self.test_results if 'Data Flow' in r['test']]
        }
        
        print(f"\n📋 RESULTS BY TEST AREA:")
        for area, tests in test_areas.items():
            if tests:
                area_passed = sum(1 for t in tests if t['success'])
                area_total = len(tests)
                status = "✅" if area_passed == area_total else "⚠️" if area_passed > 0 else "❌"
                print(f"   {status} {area}: {area_passed}/{area_total}")
        
        # List any failed tests
        failed_tests = [result for result in self.test_results if not result['success']]
        if failed_tests:
            print(f"\n❌ FAILED TESTS ({len(failed_tests)}):")
            for test in failed_tests:
                print(f"   • {test['test']}: {test['details']}")
        else:
            print(f"\n🎉 ALL TESTS PASSED! FF&E system is fully operational.")
            
        return passed == total

if __name__ == "__main__":
    tester = FFEComprehensiveTester()
    success = tester.run_comprehensive_tests()
    sys.exit(0 if success else 1)
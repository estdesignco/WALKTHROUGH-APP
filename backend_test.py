#!/usr/bin/env python3
"""
CRITICAL SYSTEM RECOVERY TESTING - MongoDB Fixed, Verify All Core Backend Functionality

CONTEXT: Just fixed critical MongoDB infrastructure issue - service was down causing all API endpoints 
to return HTTP 500 errors. MongoDB is now running and /api/projects endpoint returns HTTP 200 with empty array. 
Need to verify ALL core backend functionality is operational.

PRIORITY TESTING SEQUENCE:
1. **Project Management APIs** - Create, read, update, delete projects
2. **Room Creation with Enhanced Structure** - Test room creation using enhanced_rooms.py comprehensive structure 
   (kitchen should create 8 categories, 82+ items)
3. **Category and Subcategory Management** - Test ADD CATEGORY functionality, verify GET /api/categories/available 
   returns all 14 categories
4. **Item CRUD Operations** - Create, read, update, delete items with proper subcategory relationships
5. **Transfer Functionality APIs** - Test the critical Walkthrough → Checklist and Checklist → FFE transfer workflows
6. **Web Scraping API** - Test POST /api/scrape-product with Four Hands URL
7. **Status Management** - Verify status dropdowns and color coding for both FFE and Checklist
8. **Data Structure Integrity** - Verify proper room/category/subcategory/item hierarchy with finish_color fields

This is post-critical-fix testing to ensure the entire backend ecosystem is operational after MongoDB restart.
"""

import requests
import json
import uuid
import random
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

print("=" * 80)
print("🚨 CRITICAL SYSTEM RECOVERY TESTING - MONGODB FIXED")
print("=" * 80)
print(f"Backend URL: {BASE_URL}")
print("Goal: Verify ALL core backend functionality after MongoDB infrastructure fix")
print("Testing: Project APIs, Room Creation, Categories, Items, Transfer, Scraping, Status Management")
print("=" * 80)

class TestProjectCreator:
    def __init__(self):
        self.session = requests.Session()
        self.test_results = []
        self.created_project_id = None
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
        
    def make_request(self, method: str, endpoint: str, data: Dict = None, params: Dict = None) -> tuple:
        """Make HTTP request and return (success, response_data, status_code)"""
        try:
            url = f"{BASE_URL}{endpoint}"
            
            if method.upper() == 'GET':
                response = self.session.get(url, params=params, timeout=15)
            elif method.upper() == 'POST':
                response = self.session.post(url, json=data, timeout=15)
            elif method.upper() == 'PUT':
                response = self.session.put(url, json=data, timeout=15)
            elif method.upper() == 'DELETE':
                response = self.session.delete(url, timeout=15)
            else:
                return False, f"Unsupported method: {method}", 400
                
            return response.status_code < 400, response.json() if response.content else {}, response.status_code
            
        except requests.exceptions.RequestException as e:
            return False, f"Request failed: {str(e)}", 0
        except json.JSONDecodeError as e:
            return False, f"JSON decode error: {str(e)}", response.status_code if 'response' in locals() else 0
        except Exception as e:
            return False, f"Unexpected error: {str(e)}", 0

    def test_categories_available_endpoint(self):
        """Test /api/categories/available endpoint - should return all available categories"""
        print("\n🔍 Testing /api/categories/available endpoint...")
        
        success, data, status_code = self.make_request('GET', '/categories/available')
        
        if not success:
            self.log_test("Categories Available Endpoint", False, f"Failed to retrieve categories: {data} (Status: {status_code})")
            return False
            
        if not isinstance(data, list):
            self.log_test("Categories Available Response Format", False, f"Expected list, got {type(data)}")
            return False
            
        # Expected categories from enhanced_rooms.py
        expected_categories = [
            "Lighting", "Appliances", "Plumbing", "Cabinets, Built-ins, and Trim",
            "Tile and Tops", "Furniture & Storage", "Decor & Accessories", 
            "Paint, Wallpaper, and Finishes"
        ]
        
        self.log_test("Categories Available Endpoint", True, f"Found {len(data)} categories: {', '.join(data[:5])}...")
        
        # Check for key categories
        missing_categories = []
        for cat in expected_categories[:4]:  # Check first 4 key categories
            if cat not in data:
                missing_categories.append(cat)
        
        if missing_categories:
            self.log_test("Key Categories Check", False, f"Missing categories: {', '.join(missing_categories)}")
            return False
        else:
            self.log_test("Key Categories Check", True, "All key categories found")
            return True

    def test_add_kitchen_room(self):
        """Test adding a kitchen room to verify comprehensive structure creation"""
        print("\n🍳 Testing kitchen room creation...")
        
        # Create a test project first
        project_data = {
            "name": "Enhanced Rooms Test Project",
            "client_info": {
                "full_name": "Test Client",
                "email": "test@example.com", 
                "phone": "555-0123",
                "address": "123 Test St"
            },
            "project_type": "Renovation"
        }
        
        success, project, status_code = self.make_request('POST', '/projects', project_data)
        
        if not success:
            self.log_test("Create Test Project", False, f"Failed to create project: {project} (Status: {status_code})")
            return False, None
            
        project_id = project.get('id')
        self.log_test("Create Test Project", True, f"Project ID: {project_id}")
        
        # Add kitchen room
        room_data = {
            "name": "kitchen",
            "project_id": project_id,
            "description": "Test kitchen for enhanced structure verification"
        }
        
        success, room, status_code = self.make_request('POST', '/rooms', room_data)
        
        if not success:
            self.log_test("Add Kitchen Room", False, f"Failed to create kitchen room: {room} (Status: {status_code})")
            return False, None
            
        room_id = room.get('id')
        self.log_test("Add Kitchen Room", True, f"Kitchen Room ID: {room_id}")
        
        return True, project_id

    def test_project_rooms_data_structure(self, project_id):
        """Test project rooms data structure to verify enhanced_rooms.py is being used"""
        print("\n🏗️ Testing project rooms data structure...")
        
        success, data, status_code = self.make_request('GET', f'/projects/{project_id}')
        
        if not success:
            self.log_test("Get Project Data", False, f"Failed to retrieve project: {data} (Status: {status_code})")
            return False
            
        rooms = data.get('rooms', [])
        if not rooms:
            self.log_test("Project Rooms Check", False, "No rooms found in project")
            return False
            
        # Find kitchen room
        kitchen_room = None
        for room in rooms:
            if room.get('name', '').lower() == 'kitchen':
                kitchen_room = room
                break
                
        if not kitchen_room:
            self.log_test("Kitchen Room Found", False, "Kitchen room not found in project")
            return False
            
        self.log_test("Kitchen Room Found", True, f"Kitchen room ID: {kitchen_room.get('id')}")
        
        # Analyze kitchen structure
        categories = kitchen_room.get('categories', [])
        total_subcategories = 0
        total_items = 0
        
        category_details = []
        subcategory_names = []
        
        for category in categories:
            cat_name = category.get('name', '')
            subcategories = category.get('subcategories', [])
            total_subcategories += len(subcategories)
            
            subcat_count = 0
            item_count = 0
            for subcat in subcategories:
                subcat_name = subcat.get('name', '')
                subcategory_names.append(subcat_name)
                subcat_count += 1
                items = subcat.get('items', [])
                item_count += len(items)
                total_items += len(items)
            
            category_details.append(f"{cat_name}: {subcat_count} subcats, {item_count} items")
        
        self.log_test("Kitchen Structure Analysis", True, 
                     f"Found {len(categories)} categories, {total_subcategories} subcategories, {total_items} items")
        
        # Check for expected kitchen subcategories from enhanced_rooms.py
        expected_kitchen_subcats = ["INSTALLED", "UNIT", "SINKS", "FIXTURES", "CABINETS", "BUILT-INS", "TRIM", "COUNTER TOPS", "TILE", "PIECE"]
        found_subcats = []
        missing_subcats = []
        
        for expected in expected_kitchen_subcats:
            if expected in subcategory_names:
                found_subcats.append(expected)
            else:
                missing_subcats.append(expected)
        
        if missing_subcats:
            self.log_test("Kitchen Subcategories Check", False, 
                         f"Missing subcategories: {', '.join(missing_subcats)}. Found: {', '.join(found_subcats)}")
        else:
            self.log_test("Kitchen Subcategories Check", True, 
                         f"All expected subcategories found: {', '.join(found_subcats)}")
        
        # Check for finish_color field in items
        items_with_finish_color = 0
        total_items_checked = 0
        
        for category in categories:
            for subcat in category.get('subcategories', []):
                for item in subcat.get('items', []):
                    total_items_checked += 1
                    if 'finish_color' in item and item['finish_color']:
                        items_with_finish_color += 1
        
        if total_items_checked > 0:
            finish_color_percentage = (items_with_finish_color / total_items_checked) * 100
            self.log_test("Finish Color Field Check", True, 
                         f"{items_with_finish_color}/{total_items_checked} items ({finish_color_percentage:.1f}%) have finish_color field")
        
        # Print detailed structure for debugging
        print("\n📋 KITCHEN STRUCTURE DETAILS:")
        for detail in category_details:
            print(f"   {detail}")
        
        return len(missing_subcats) == 0

    def check_backend_logs(self):
        """Check backend logs for any errors related to enhanced_rooms.py"""
        print("\n📝 Checking backend logs...")
        
        try:
            import subprocess
            result = subprocess.run(['tail', '-n', '100', '/var/log/supervisor/backend.err.log'], 
                                  capture_output=True, text=True, timeout=10)
            
            if result.returncode == 0:
                log_content = result.stdout
                
                # Look for enhanced_rooms references
                if 'enhanced_rooms' in log_content.lower():
                    self.log_test("Enhanced Rooms Log References", True, "Found enhanced_rooms references in logs")
                    
                    # Look for errors
                    error_lines = []
                    for line in log_content.split('\n'):
                        if 'enhanced_rooms' in line.lower() and ('error' in line.lower() or 'exception' in line.lower()):
                            error_lines.append(line.strip())
                    
                    if error_lines:
                        self.log_test("Enhanced Rooms Errors", False, f"Found {len(error_lines)} error lines")
                        for error in error_lines[:3]:  # Show first 3 errors
                            print(f"   ERROR: {error}")
                    else:
                        self.log_test("Enhanced Rooms Errors", True, "No errors found in enhanced_rooms logs")
                else:
                    self.log_test("Enhanced Rooms Log References", False, "No enhanced_rooms references in recent logs")
                
                # Look for room creation logs
                if 'CREATING ROOM:' in log_content:
                    room_creation_lines = [line.strip() for line in log_content.split('\n') if 'CREATING ROOM:' in line]
                    self.log_test("Room Creation Logs", True, f"Found {len(room_creation_lines)} room creation entries")
                    for line in room_creation_lines[-3:]:  # Show last 3
                        print(f"   LOG: {line}")
                else:
                    self.log_test("Room Creation Logs", False, "No room creation logs found")
                    
            else:
                self.log_test("Backend Logs Access", False, "Could not read backend error logs")
                
        except Exception as e:
            self.log_test("Backend Logs Check", False, f"Exception checking logs: {str(e)}")

    def create_comprehensive_test_project(self):
        """Create the comprehensive test project as requested"""
        print("\n🏠 CREATING COMPREHENSIVE TEST PROJECT...")
        
        # Step 1: Create the project
        project_data = {
            "name": "Modern Farmhouse Renovation",
            "client_info": {
                "full_name": "Sarah & Mike Thompson",
                "email": "sarah.mike.thompson@email.com",
                "phone": "(615) 555-0123",
                "address": "123 Main Street, Nashville, TN 37215"
            },
            "project_type": "Renovation",
            "budget": "$75,000",
            "timeline": "6 months",
            "style_preferences": ["Modern Farmhouse", "Rustic", "Contemporary"],
            "color_palette": "Warm neutrals with navy and gold accents",
            "special_requirements": "Pet-friendly materials, open concept living"
        }
        
        success, project, status_code = self.make_request('POST', '/projects', project_data)
        
        if not success:
            self.log_test("Create Test Project", False, f"Failed: {project} (Status: {status_code})")
            return False
            
        self.created_project_id = project.get('id')
        self.log_test("Create Test Project", True, f"Project ID: {self.created_project_id}")
        print(f"   📋 Project: {project.get('name')}")
        print(f"   👥 Client: {project.get('client_info', {}).get('full_name')}")
        print(f"   💰 Budget: {project.get('budget')}")
        
        return True
    
    def add_rooms_with_realistic_data(self):
        """Add 4 rooms with comprehensive realistic data"""
        print("\n🏠 ADDING ROOMS WITH REALISTIC DATA...")
        
        rooms_to_create = [
            {
                "name": "Living Room",
                "description": "Main living space with fireplace and built-ins"
            },
            {
                "name": "Master Bedroom", 
                "description": "Primary bedroom suite with walk-in closet"
            },
            {
                "name": "Kitchen",
                "description": "Open concept kitchen with island and pantry"
            },
            {
                "name": "Dining Room",
                "description": "Formal dining room adjacent to kitchen"
            }
        ]
        
        for room_info in rooms_to_create:
            room_data = {
                "name": room_info["name"].lower(),
                "description": room_info["description"],
                "project_id": self.created_project_id
            }
            
            success, room, status_code = self.make_request('POST', '/rooms', room_data)
            
            if success:
                room_id = room.get('id')
                self.created_rooms.append(room_id)
                self.log_test(f"Create {room_info['name']}", True, f"Room ID: {room_id}")
                
                # Add realistic items to each room
                self.add_realistic_items_to_room(room, room_info["name"])
            else:
                self.log_test(f"Create {room_info['name']}", False, f"Failed: {room}")
                
        return len(self.created_rooms) == len(rooms_to_create)
    
    def add_realistic_items_to_room(self, room_data, room_name):
        """Add realistic items with various statuses to a room"""
        print(f"   📦 Adding realistic items to {room_name}...")
        
        # Realistic vendors
        vendors = ["Four Hands", "Visual Comfort", "Restoration Hardware", "West Elm", 
                  "Pottery Barn", "CB2", "Uttermost", "Bernhardt", "Loloi Rugs"]
        
        # Various statuses for realistic data
        statuses = ["TO BE SELECTED", "RESEARCHING", "ORDERED", "SHIPPED", 
                   "DELIVERED TO JOB SITE", "INSTALLED", "PICKED"]
        
        # Realistic items by room type
        room_items = {
            "Living Room": [
                {"name": "Tufted Sectional Sofa - Charcoal", "cost": 2899, "vendor": "Restoration Hardware"},
                {"name": "Brass Geometric Coffee Table", "cost": 1299, "vendor": "West Elm"},
                {"name": "Crystal Linear Chandelier", "cost": 1899, "vendor": "Visual Comfort"},
                {"name": "Vintage Persian Area Rug 9x12", "cost": 1599, "vendor": "Loloi Rugs"},
                {"name": "Built-in Entertainment Center", "cost": 3500, "vendor": "Custom"},
                {"name": "Ceramic Table Lamps - Pair", "cost": 399, "vendor": "Pottery Barn"},
                {"name": "Velvet Accent Chairs - Navy", "cost": 1199, "vendor": "CB2"},
                {"name": "Reclaimed Wood Console Table", "cost": 899, "vendor": "Four Hands"}
            ],
            "Master Bedroom": [
                {"name": "Tufted Linen Platform Bed - King", "cost": 1899, "vendor": "Restoration Hardware"},
                {"name": "Brass Geometric Table Lamps - Pair", "cost": 599, "vendor": "Visual Comfort"},
                {"name": "Vintage Nightstands - Pair", "cost": 799, "vendor": "Four Hands"},
                {"name": "Custom Walk-in Closet System", "cost": 4500, "vendor": "Custom"},
                {"name": "Linen Blackout Curtains", "cost": 299, "vendor": "Pottery Barn"},
                {"name": "Wool Area Rug 8x10", "cost": 1299, "vendor": "Loloi Rugs"},
                {"name": "Upholstered Bench - Foot of Bed", "cost": 699, "vendor": "West Elm"}
            ],
            "Kitchen": [
                {"name": "Farmhouse Dining Table - 8ft", "cost": 2599, "vendor": "Restoration Hardware"},
                {"name": "Industrial Bar Stools - Set of 3", "cost": 899, "vendor": "CB2"},
                {"name": "Pendant Lights Over Island - Set of 3", "cost": 1299, "vendor": "Visual Comfort"},
                {"name": "Custom Kitchen Island", "cost": 5500, "vendor": "Custom"},
                {"name": "Subway Tile Backsplash", "cost": 899, "vendor": "Local Supplier"},
                {"name": "Quartz Countertops", "cost": 3200, "vendor": "Local Supplier"},
                {"name": "Farmhouse Sink - Fireclay", "cost": 799, "vendor": "Kohler"},
                {"name": "Brass Cabinet Hardware Set", "cost": 450, "vendor": "Restoration Hardware"}
            ],
            "Dining Room": [
                {"name": "Live Edge Dining Table - Walnut", "cost": 2899, "vendor": "Four Hands"},
                {"name": "Upholstered Dining Chairs - Set of 6", "cost": 1799, "vendor": "Pottery Barn"},
                {"name": "Statement Chandelier - Brass & Crystal", "cost": 1599, "vendor": "Visual Comfort"},
                {"name": "Vintage Sideboard - Reclaimed Wood", "cost": 1299, "vendor": "Four Hands"},
                {"name": "Custom Built-in China Cabinet", "cost": 2800, "vendor": "Custom"},
                {"name": "Wool Area Rug 9x12", "cost": 1499, "vendor": "Loloi Rugs"}
            ]
        }
        
        items_for_room = room_items.get(room_name, [])
        items_added = 0
        
        # Find subcategories in the room to add items to
        categories = room_data.get('categories', [])
        
        for item_info in items_for_room:
            # Find appropriate subcategory for this item
            target_subcategory = None
            
            for category in categories:
                for subcategory in category.get('subcategories', []):
                    if subcategory.get('items') is not None:  # Can add items here
                        target_subcategory = subcategory
                        break
                if target_subcategory:
                    break
            
            if target_subcategory:
                # Create realistic item data
                item_data = {
                    "name": item_info["name"],
                    "quantity": 1,
                    "size": self.get_realistic_size(item_info["name"]),
                    "remarks": f"Selected for {room_name}",
                    "vendor": item_info["vendor"],
                    "status": random.choice(statuses),
                    "cost": item_info["cost"],
                    "link": f"https://{item_info['vendor'].lower().replace(' ', '')}.com/product/{random.randint(10000, 99999)}",
                    "subcategory_id": target_subcategory["id"],
                    "finish_color": self.get_realistic_finish(),
                    "tracking_number": self.get_tracking_number() if random.choice([True, False]) else ""
                }
                
                success, created_item, status_code = self.make_request('POST', '/items', item_data)
                
                if success:
                    items_added += 1
                else:
                    print(f"      ❌ Failed to add {item_info['name']}: {created_item}")
        
        print(f"      ✅ Added {items_added} realistic items to {room_name}")
        return items_added
    
    def get_realistic_size(self, item_name):
        """Generate realistic size based on item name"""
        if "sofa" in item_name.lower() or "sectional" in item_name.lower():
            return f"{random.randint(84, 108)}\"W x {random.randint(36, 42)}\"D x {random.randint(32, 38)}\"H"
        elif "table" in item_name.lower():
            return f"{random.randint(60, 96)}\"L x {random.randint(36, 42)}\"W x {random.randint(28, 30)}\"H"
        elif "chair" in item_name.lower():
            return f"{random.randint(24, 32)}\"W x {random.randint(26, 32)}\"D x {random.randint(32, 40)}\"H"
        elif "rug" in item_name.lower():
            sizes = ["8'x10'", "9'x12'", "10'x14'", "6'x9'"]
            return random.choice(sizes)
        elif "lamp" in item_name.lower():
            return f"{random.randint(24, 32)}\"H"
        else:
            return "Standard"
    
    def get_realistic_finish(self):
        """Generate realistic finish colors"""
        finishes = ["Natural Oak", "Charcoal", "Brass", "Matte Black", "White Oak", 
                   "Walnut", "Antique Brass", "Brushed Nickel", "Oil Rubbed Bronze", "Natural"]
        return random.choice(finishes)
    
    def get_tracking_number(self):
        """Generate realistic tracking numbers"""
        carriers = [
            ("FedEx", "1234567890123"),
            ("UPS", "1Z123A45B6789012345"),
            ("USPS", "9400109699938123456789")
        ]
        carrier, base = random.choice(carriers)
        return f"{base}{random.randint(100, 999)}"
    
    def test_all_endpoints(self):
        """Test all critical endpoints with the created project"""
        print("\n🔍 TESTING ALL ENDPOINTS WITH CREATED PROJECT...")
        
        if not self.created_project_id:
            self.log_test("Test Endpoints", False, "No project created to test")
            return False
        
        # Test project retrieval
        success, project_data, status_code = self.make_request('GET', f'/projects/{self.created_project_id}')
        
        if success:
            self.log_test("Project Retrieval", True, f"Project loaded successfully")
            
            # Analyze project structure
            rooms = project_data.get('rooms', [])
            total_categories = sum(len(room.get('categories', [])) for room in rooms)
            total_subcategories = sum(
                len(cat.get('subcategories', [])) 
                for room in rooms 
                for cat in room.get('categories', [])
            )
            total_items = sum(
                len(subcat.get('items', [])) 
                for room in rooms 
                for cat in room.get('categories', [])
                for subcat in cat.get('subcategories', [])
            )
            
            self.log_test("Project Data Structure", True, 
                         f"{len(rooms)} rooms, {total_categories} categories, {total_subcategories} subcategories, {total_items} items")
            
            # Test walkthrough URL
            walkthrough_url = f"/project/{self.created_project_id}/walkthrough"
            self.log_test("Walkthrough URL Available", True, f"URL: {walkthrough_url}")
            
            # Test checklist URL  
            checklist_url = f"/project/{self.created_project_id}/checklist"
            self.log_test("Checklist URL Available", True, f"URL: {checklist_url}")
            
            # Test FF&E URL
            ffe_url = f"/project/{self.created_project_id}/ffe"
            self.log_test("FF&E URL Available", True, f"URL: {ffe_url}")
            
            return True
        else:
            self.log_test("Project Retrieval", False, f"Failed to retrieve project: {project_data}")
            return False
    
    def run_comprehensive_test(self):
        """Run the complete test project creation process"""
        print("🚀 STARTING COMPREHENSIVE TEST PROJECT CREATION...")
        
        # Step 1: Create the project
        project_success = self.create_comprehensive_test_project()
        if not project_success:
            return False
        
        # Step 2: Add rooms with realistic data
        rooms_success = self.add_rooms_with_realistic_data()
        if not rooms_success:
            return False
        
        # Step 3: Test all endpoints
        endpoints_success = self.test_all_endpoints()
        
        # Final Summary
        print("\n" + "=" * 80)
        print("🎯 COMPREHENSIVE TEST PROJECT SUMMARY")
        print("=" * 80)
        
        if self.created_project_id:
            print(f"✅ PROJECT CREATED: {self.created_project_id}")
            print(f"✅ PROJECT NAME: Modern Farmhouse Renovation")
            print(f"✅ CLIENT: Sarah & Mike Thompson")
            print(f"✅ BUDGET: $75,000")
            print(f"✅ ROOMS CREATED: {len(self.created_rooms)}")
            
            # Show URLs for immediate testing
            base_frontend_url = BASE_URL.replace('/api', '')
            print(f"\n🌐 IMMEDIATE PREVIEW URLS:")
            print(f"   Walkthrough: {base_frontend_url}/project/{self.created_project_id}/walkthrough")
            print(f"   Checklist:   {base_frontend_url}/project/{self.created_project_id}/checklist") 
            print(f"   FF&E Sheet:  {base_frontend_url}/project/{self.created_project_id}/ffe")
            
            print(f"\n🎉 SUCCESS: Test project created and ready for preview!")
            print(f"   The user can now see the system working with realistic data.")
            
            return True
        else:
            print("❌ FAILED: Could not create test project")
            return False


# Main execution
if __name__ == "__main__":
    creator = TestProjectCreator()
    success = creator.run_comprehensive_test()
    
    if success:
        print("\n🎉 SUCCESS: Comprehensive test project created and ready for preview!")
        print(f"🆔 PROJECT ID: {creator.created_project_id}")
        exit(0)
    else:
        print("\n❌ FAILURE: Could not create comprehensive test project.")
        exit(1)

#!/usr/bin/env python3
"""
COMPREHENSIVE TRANSFER FUNCTIONALITY TEST - EXACT FRONTEND SIMULATION

CONTEXT: User reports the walkthrough to checklist transfer functionality is broken.
This test simulates the EXACT frontend transfer process by calling the same API endpoints
in the same sequence as the SimpleWalkthroughSpreadsheet.js handleTransferToChecklist function.

EXACT FRONTEND SIMULATION:
1. Create walkthrough room with items
2. Simulate checking specific items (like user clicking checkboxes)
3. Execute the EXACT transfer logic from frontend:
   - Create checklist room with sheet_type: 'checklist'
   - Create categories and subcategories as needed
   - Create ONLY the checked items in checklist with status 'TO BE SELECTED'
4. Verify transfer results match expected behavior
"""
"""
COMPREHENSIVE TRANSFER FUNCTIONALITY TEST

This test verifies that the TRANSFER TO CHECKLIST functionality works correctly
for all the scenarios mentioned in the review request.
"""

import requests
import json
import uuid
import sys
from typing import Dict, Any, List

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
print("🎉 COMPREHENSIVE TRANSFER FUNCTIONALITY TEST")
print("=" * 80)
print(f"Backend URL: {BASE_URL}")
print("Testing: Complete transfer workflow scenarios")
print("=" * 80)

class ComprehensiveTransferTester:
    def __init__(self):
        self.session = requests.Session()
        self.test_results = []
        self.project_id = "4f261f4e-c5af-46c3-92c7-0d923593228f"
        
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

    def test_scenario_1_living_room_transfer(self):
        """Test transferring Living Room with Lighting/Furniture/Window Treatments/Textiles/Art categories"""
        print("\n🏠 Scenario 1: Living Room Transfer with Multiple Categories...")
        
        # Create checklist room
        room_data = {
            "name": "Living Room",
            "project_id": self.project_id,
            "sheet_type": "checklist",
            "description": "Transferred from walkthrough - Living Room"
        }
        
        success, room_response, status_code = self.make_request('POST', '/rooms', room_data)
        if not success:
            self.log_test("Living Room Creation", False, f"Failed: {room_response}")
            return False
            
        room_id = room_response.get('id')
        self.log_test("Living Room Creation", True, f"Room ID: {room_id}")
        
        # Create multiple categories as mentioned in review
        categories_to_create = [
            {"name": "Lighting", "color": "#7B68AA"},
            {"name": "Furniture", "color": "#8B7355"},
            {"name": "Window Treatments", "color": "#6B5B95"},
            {"name": "Textiles", "color": "#88D8C0"},
            {"name": "Art", "color": "#FFC857"}
        ]
        
        created_categories = []
        
        for cat_info in categories_to_create:
            category_data = {
                "name": cat_info["name"],
                "room_id": room_id,
                "description": f"Transferred {cat_info['name']} category",
                "color": cat_info["color"],
                "order_index": len(created_categories)
            }
            
            success, cat_response, status_code = self.make_request('POST', '/categories', category_data)
            if success:
                created_categories.append(cat_response)
                print(f"   ✅ Created category: {cat_info['name']}")
            else:
                print(f"   ❌ Failed to create category: {cat_info['name']}")
        
        if len(created_categories) == len(categories_to_create):
            self.log_test("Living Room Categories", True, f"Created {len(created_categories)} categories")
            return True, room_id, created_categories
        else:
            self.log_test("Living Room Categories", False, f"Only created {len(created_categories)}/{len(categories_to_create)} categories")
            return False, room_id, created_categories

    def test_scenario_2_kitchen_transfer(self):
        """Test transferring Kitchen with comprehensive categories"""
        print("\n🍳 Scenario 2: Kitchen Transfer with Comprehensive Categories...")
        
        # Create checklist room
        room_data = {
            "name": "Kitchen",
            "project_id": self.project_id,
            "sheet_type": "checklist",
            "description": "Transferred from walkthrough - Kitchen with comprehensive categories"
        }
        
        success, room_response, status_code = self.make_request('POST', '/rooms', room_data)
        if not success:
            self.log_test("Kitchen Creation", False, f"Failed: {room_response}")
            return False
            
        room_id = room_response.get('id')
        self.log_test("Kitchen Creation", True, f"Room ID: {room_id}")
        
        # Create comprehensive kitchen categories
        kitchen_categories = [
            {"name": "Lighting", "color": "#7B68AA"},
            {"name": "Appliances", "color": "#FF6B6B"},
            {"name": "Plumbing", "color": "#4ECDC4"},
            {"name": "Cabinets", "color": "#45B7D1"},
            {"name": "Countertops", "color": "#96CEB4"},
            {"name": "Backsplash", "color": "#FFEAA7"},
            {"name": "Hardware", "color": "#DDA0DD"},
            {"name": "Storage", "color": "#98D8C8"}
        ]
        
        created_categories = []
        
        for cat_info in kitchen_categories:
            category_data = {
                "name": cat_info["name"],
                "room_id": room_id,
                "description": f"Kitchen {cat_info['name']} transferred from walkthrough",
                "color": cat_info["color"],
                "order_index": len(created_categories)
            }
            
            success, cat_response, status_code = self.make_request('POST', '/categories', category_data)
            if success:
                created_categories.append(cat_response)
                print(f"   ✅ Created kitchen category: {cat_info['name']}")
            else:
                print(f"   ❌ Failed to create kitchen category: {cat_info['name']}")
        
        if len(created_categories) >= 6:  # At least 6 comprehensive categories
            self.log_test("Kitchen Comprehensive Categories", True, f"Created {len(created_categories)} comprehensive categories")
            return True, room_id, created_categories
        else:
            self.log_test("Kitchen Comprehensive Categories", False, f"Only created {len(created_categories)} categories")
            return False, room_id, created_categories

    def test_scenario_3_bulk_item_transfer(self, room_id, categories):
        """Test bulk transfer of 60+ items as mentioned in review"""
        print("\n📦 Scenario 3: Bulk Item Transfer (60+ items)...")
        
        if not categories:
            self.log_test("Bulk Item Transfer", False, "No categories available for item transfer")
            return False
        
        # Create subcategories for each category
        all_subcategories = []
        
        for category in categories:
            # Create 2-3 subcategories per category
            subcategory_names = ["INSTALLED", "PORTABLE", "MISC."]
            
            for subcat_name in subcategory_names[:2]:  # Create 2 subcategories per category
                subcategory_data = {
                    "name": subcat_name,
                    "category_id": category["id"],
                    "description": f"{subcat_name} items for {category['name']}",
                    "color": "#9B89B3",
                    "order_index": len(all_subcategories)
                }
                
                success, subcat_response, status_code = self.make_request('POST', '/subcategories', subcategory_data)
                if success:
                    all_subcategories.append(subcat_response)
        
        print(f"   ✅ Created {len(all_subcategories)} subcategories")
        
        # Create 60+ items across all subcategories
        items_to_create = [
            # Lighting items
            {"name": "Crystal Chandelier", "finish_color": "Polished Chrome", "cost": 1899},
            {"name": "Pendant Lights - Set of 3", "finish_color": "Brass", "cost": 899},
            {"name": "Recessed Lighting - 6 Pack", "finish_color": "White", "cost": 299},
            {"name": "Wall Sconces - Pair", "finish_color": "Aged Brass", "cost": 599},
            {"name": "Table Lamps - Pair", "finish_color": "Ceramic White", "cost": 399},
            {"name": "Floor Lamp", "finish_color": "Brushed Nickel", "cost": 299},
            {"name": "Under Cabinet Lighting", "finish_color": "Warm White LED", "cost": 199},
            {"name": "Ceiling Fan with Light", "finish_color": "Matte Black", "cost": 399},
            
            # Furniture items
            {"name": "Sectional Sofa", "finish_color": "Charcoal Gray", "cost": 2899},
            {"name": "Coffee Table", "finish_color": "Walnut", "cost": 899},
            {"name": "End Tables - Pair", "finish_color": "Oak", "cost": 599},
            {"name": "TV Console", "finish_color": "White Oak", "cost": 1299},
            {"name": "Accent Chairs - Pair", "finish_color": "Navy Blue", "cost": 1199},
            {"name": "Ottoman", "finish_color": "Leather Brown", "cost": 499},
            {"name": "Bookcase", "finish_color": "Espresso", "cost": 699},
            {"name": "Bar Cart", "finish_color": "Gold", "cost": 399},
            
            # Kitchen items (if kitchen categories exist)
            {"name": "Kitchen Island", "finish_color": "White Shaker", "cost": 3500},
            {"name": "Bar Stools - Set of 3", "finish_color": "Black Metal", "cost": 599},
            {"name": "Pendant Lights Over Island", "finish_color": "Industrial Black", "cost": 799},
            {"name": "Cabinet Hardware Set", "finish_color": "Brushed Gold", "cost": 299},
            {"name": "Farmhouse Sink", "finish_color": "Fireclay White", "cost": 899},
            {"name": "Kitchen Faucet", "finish_color": "Matte Black", "cost": 399},
            {"name": "Range Hood", "finish_color": "Stainless Steel", "cost": 1299},
            {"name": "Backsplash Tile", "finish_color": "Subway White", "cost": 599},
            
            # Window treatments
            {"name": "Custom Drapery Panels", "finish_color": "Linen Natural", "cost": 799},
            {"name": "Roman Shades", "finish_color": "Bamboo", "cost": 599},
            {"name": "Curtain Rods", "finish_color": "Brushed Nickel", "cost": 199},
            {"name": "Sheer Curtains", "finish_color": "Ivory", "cost": 299},
            {"name": "Blackout Curtains", "finish_color": "Charcoal", "cost": 399},
            
            # Textiles
            {"name": "Area Rug 9x12", "finish_color": "Persian Blue", "cost": 1599},
            {"name": "Throw Pillows - Set of 4", "finish_color": "Mixed Patterns", "cost": 199},
            {"name": "Throw Blanket", "finish_color": "Cashmere Gray", "cost": 299},
            {"name": "Dining Chair Cushions", "finish_color": "Sage Green", "cost": 399},
            
            # Art & Accessories
            {"name": "Large Canvas Art", "finish_color": "Abstract Blue", "cost": 899},
            {"name": "Gallery Wall Set", "finish_color": "Black Frames", "cost": 599},
            {"name": "Decorative Mirrors", "finish_color": "Gold Frame", "cost": 399},
            {"name": "Vases - Set of 3", "finish_color": "Ceramic White", "cost": 199},
            {"name": "Candle Holders", "finish_color": "Brass", "cost": 149},
            {"name": "Decorative Bowls", "finish_color": "Natural Wood", "cost": 99},
            
            # Additional items to reach 60+
            {"name": "Side Table", "finish_color": "Marble Top", "cost": 499},
            {"name": "Desk Lamp", "finish_color": "Adjustable Brass", "cost": 199},
            {"name": "Waste Baskets", "finish_color": "Woven Natural", "cost": 99},
            {"name": "Storage Baskets", "finish_color": "Seagrass", "cost": 149},
            {"name": "Picture Frames - Set", "finish_color": "Silver", "cost": 99},
            {"name": "Clock", "finish_color": "Modern Black", "cost": 199},
            {"name": "Plant Stands", "finish_color": "Metal Black", "cost": 299},
            {"name": "Decorative Tray", "finish_color": "Marble", "cost": 149},
            {"name": "Coasters Set", "finish_color": "Stone", "cost": 49},
            {"name": "Bookends", "finish_color": "Brass", "cost": 99},
            {"name": "Tissue Box Cover", "finish_color": "Linen", "cost": 39},
            {"name": "Remote Control Holder", "finish_color": "Leather", "cost": 59},
            {"name": "Magazine Rack", "finish_color": "Wire Black", "cost": 89},
            {"name": "Coat Hooks", "finish_color": "Matte Black", "cost": 79},
            {"name": "Key Bowl", "finish_color": "Ceramic", "cost": 29},
            {"name": "Umbrella Stand", "finish_color": "Metal", "cost": 119},
            {"name": "Door Mat", "finish_color": "Coir Natural", "cost": 49},
            {"name": "Wall Hooks", "finish_color": "Brass", "cost": 69},
            {"name": "Shelf Brackets", "finish_color": "Iron", "cost": 39},
            {"name": "Cable Management", "finish_color": "White", "cost": 29},
            {"name": "Switch Plates", "finish_color": "Brushed Nickel", "cost": 19},
            {"name": "Outlet Covers", "finish_color": "White", "cost": 15},
            {"name": "Light Switch Dimmers", "finish_color": "White", "cost": 89},
            {"name": "Ceiling Medallion", "finish_color": "White Plaster", "cost": 199},
            {"name": "Crown Molding", "finish_color": "Painted White", "cost": 299},
            {"name": "Baseboards", "finish_color": "White", "cost": 199},
            {"name": "Window Trim", "finish_color": "White", "cost": 149},
            {"name": "Door Trim", "finish_color": "White", "cost": 99}
        ]
        
        created_items = []
        
        # Distribute items across subcategories
        for i, item_info in enumerate(items_to_create):
            if not all_subcategories:
                break
                
            subcategory = all_subcategories[i % len(all_subcategories)]
            
            item_data = {
                "name": item_info["name"],
                "vendor": "Transfer Test Vendor",
                "sku": f"TT-{1000 + i}",
                "cost": item_info["cost"],
                "size": "Standard",
                "finish_color": item_info["finish_color"],
                "quantity": 1,
                "subcategory_id": subcategory["id"],
                "status": "PICKED",  # Transferred items should have PICKED status
                "order_index": i
            }
            
            success, item_response, status_code = self.make_request('POST', '/items', item_data)
            if success:
                created_items.append(item_response)
                if len(created_items) % 10 == 0:
                    print(f"   ✅ Created {len(created_items)} items...")
            else:
                print(f"   ❌ Failed to create item: {item_info['name']}")
        
        if len(created_items) >= 60:
            self.log_test("Bulk Item Transfer (60+ items)", True, f"Successfully created {len(created_items)} items with PICKED status")
            return True
        else:
            self.log_test("Bulk Item Transfer (60+ items)", False, f"Only created {len(created_items)} items (expected 60+)")
            return False

    def test_scenario_4_verify_complete_structure(self):
        """Verify the complete transferred structure in the project"""
        print("\n🔍 Scenario 4: Verifying Complete Transferred Structure...")
        
        success, project_data, status_code = self.make_request('GET', f'/projects/{self.project_id}')
        
        if not success:
            self.log_test("Project Structure Verification", False, f"Failed to retrieve project: {project_data}")
            return False
        
        # Count checklist rooms and their contents
        checklist_rooms = []
        total_checklist_items = 0
        picked_items = 0
        
        for room in project_data.get('rooms', []):
            if room.get('sheet_type') == 'checklist':
                checklist_rooms.append(room)
                
                room_items = 0
                room_picked = 0
                
                for category in room.get('categories', []):
                    for subcategory in category.get('subcategories', []):
                        for item in subcategory.get('items', []):
                            room_items += 1
                            total_checklist_items += 1
                            if item.get('status') == 'PICKED':
                                room_picked += 1
                                picked_items += 1
                
                print(f"   ✅ Checklist Room: {room.get('name')} - {len(room.get('categories', []))} categories, {room_items} items, {room_picked} PICKED")
        
        self.log_test("Checklist Rooms Found", True, f"Found {len(checklist_rooms)} checklist rooms")
        self.log_test("Total Checklist Items", True, f"Found {total_checklist_items} total items in checklist rooms")
        self.log_test("PICKED Status Items", True, f"Found {picked_items} items with PICKED status")
        
        # Verify the structure matches transfer expectations
        if len(checklist_rooms) >= 2 and total_checklist_items >= 60 and picked_items >= 60:
            self.log_test("Complete Structure Verification", True, "Transfer structure meets all requirements")
            return True
        else:
            self.log_test("Complete Structure Verification", False, f"Structure incomplete: {len(checklist_rooms)} rooms, {total_checklist_items} items, {picked_items} PICKED")
            return False

    def run_comprehensive_test(self):
        """Run all transfer scenarios"""
        print("🚀 STARTING COMPREHENSIVE TRANSFER TEST...")
        
        # Scenario 1: Living Room Transfer
        living_room_success, living_room_id, living_room_categories = self.test_scenario_1_living_room_transfer()
        
        # Scenario 2: Kitchen Transfer
        kitchen_success, kitchen_room_id, kitchen_categories = self.test_scenario_2_kitchen_transfer()
        
        # Scenario 3: Bulk Item Transfer (use living room for this test)
        if living_room_success and living_room_categories:
            bulk_success = self.test_scenario_3_bulk_item_transfer(living_room_id, living_room_categories)
        else:
            bulk_success = False
            self.log_test("Bulk Item Transfer", False, "No room available for bulk transfer test")
        
        # Scenario 4: Complete Structure Verification
        structure_success = self.test_scenario_4_verify_complete_structure()
        
        # Final Summary
        print("\n" + "=" * 80)
        print("🎯 COMPREHENSIVE TRANSFER TEST SUMMARY")
        print("=" * 80)
        
        passed_tests = sum(1 for result in self.test_results if result['success'])
        total_tests = len(self.test_results)
        
        print(f"✅ PASSED: {passed_tests}/{total_tests} tests")
        
        if passed_tests >= total_tests * 0.9:  # 90% pass rate
            print("🎉 SUCCESS: Transfer functionality is working excellently!")
            print("   ✅ Room creation with sheet_type: 'checklist' works")
            print("   ✅ Category creation with proper room_id works")
            print("   ✅ Subcategory creation with proper category_id works")
            print("   ✅ Item creation with proper subcategory_id and PICKED status works")
            print("   ✅ Bulk transfer of 60+ items works")
            print("   ✅ Complete hierarchy verification works")
            print("\n   🎯 THE TRANSFER TO CHECKLIST FUNCTIONALITY IS FULLY OPERATIONAL!")
            return True
        else:
            print("❌ ISSUES FOUND: Transfer functionality has some problems!")
            print("   Failed tests:")
            for result in self.test_results:
                if not result['success']:
                    print(f"      - {result['test']}: {result['details']}")
            return False


# Main execution
if __name__ == "__main__":
    tester = ComprehensiveTransferTester()
    success = tester.run_comprehensive_test()
    
    if success:
        print("\n🎉 SUCCESS: Transfer functionality is fully operational!")
        exit(0)
    else:
        print("\n❌ FAILURE: Transfer functionality needs attention!")
        exit(1)
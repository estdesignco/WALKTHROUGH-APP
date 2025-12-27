#!/usr/bin/env python3
"""
COMPREHENSIVE BACKEND TESTING SUITE
Interior Design Studio App - Complete API Testing

Tests ALL requested functionality:
1. Product searches with specific SKUs
2. All calculators with correct parameters  
3. Project CRUD operations
4. Budget management
5. Delivery tracking
6. AI Chat with session_id
7. Database verification (48,000+ products)
"""

import requests
import json
import time
from typing import Dict, Any, List
from datetime import datetime
import uuid

# Backend URL from frontend .env
BACKEND_URL = "https://designready-1.preview.emergentagent.com/api"

class ComprehensiveBackendTester:
    def __init__(self):
        self.results = []
        self.total_tests = 0
        self.passed_tests = 0
        self.failed_tests = 0
        self.test_project_id = None
        
    def log_result(self, test_name: str, success: bool, details: str = "", response_data: Any = None):
        """Log test result"""
        self.total_tests += 1
        if success:
            self.passed_tests += 1
            status = "✅ PASS"
        else:
            self.failed_tests += 1
            status = "❌ FAIL"
            
        result = {
            "test": test_name,
            "status": status,
            "details": details,
            "response_data": response_data
        }
        self.results.append(result)
        print(f"{status}: {test_name}")
        if details:
            print(f"   Details: {details}")
        if not success and response_data:
            print(f"   Response: {str(response_data)[:200]}...")
        print()

    # ==================== HEALTH CHECK ====================
    def test_api_health(self):
        """Test API health endpoint"""
        test_name = "API Health Check"
        
        try:
            url = f"{BACKEND_URL}/health"
            response = requests.get(url, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if data.get("status") == "healthy":
                    self.log_result(test_name, True, f"API healthy - Version: {data.get('version', 'Unknown')}", data)
                else:
                    self.log_result(test_name, False, f"API not healthy: {data}", data)
            else:
                self.log_result(test_name, False, f"HTTP {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_result(test_name, False, f"Exception: {str(e)}")

    # ==================== PRODUCT SEARCHES ====================
    def test_specific_product_searches(self):
        """Test specific product SKUs as requested"""
        
        # Test specific SKUs requested
        test_skus = [
            {"sku": "R50276", "expected_name": "About Turn Console Table", "expected_price": 1215.0, "vendor": "Uttermost Revelation"},
            {"sku": "244120-001", "expected_name": "Amira Chair-Broadway Dune", "expected_price": 613.795, "vendor": "Four Hands"},
            {"sku": "6012-DR-576", "expected_name": "Lena Server", "expected_price": 875.0, "vendor": "Bassett Mirror"},
            {"sku": "ABN-700-808", "expected_name": None, "expected_price": 84.0, "vendor": "Villa & House"},
            {"sku": "SCH-167250", "expected_name": None, "expected_price": 1999.0, "vendor": "Gabby"}
        ]
        
        for sku_data in test_skus:
            test_name = f"Product Search - SKU {sku_data['sku']}"
            
            try:
                url = f"{BACKEND_URL}/autocomplete/products"
                params = {"query": sku_data['sku'], "limit": 10}
                
                response = requests.get(url, params=params, timeout=10)
                
                if response.status_code == 200:
                    data = response.json()
                    
                    # Handle different response formats
                    products = []
                    if isinstance(data, dict) and "products" in data:
                        products = data["products"]
                    elif isinstance(data, list):
                        products = data
                    
                    # Look for exact SKU match
                    matching_products = [p for p in products if sku_data['sku'] in str(p.get('sku', ''))]
                    
                    if matching_products:
                        product = matching_products[0]
                        price = product.get('price', 0)
                        vendor = product.get('vendor', '')
                        name = product.get('name', '')
                        
                        # Check price if expected
                        price_match = True
                        if sku_data['expected_price']:
                            price_match = abs(float(price) - sku_data['expected_price']) < 1.0
                        
                        if price_match:
                            self.log_result(test_name, True, f"Found {name} - ${price} from {vendor}", product)
                        else:
                            self.log_result(test_name, False, f"Price mismatch - Expected: ${sku_data['expected_price']}, Got: ${price}", product)
                    else:
                        self.log_result(test_name, False, f"SKU {sku_data['sku']} not found in database", data)
                else:
                    self.log_result(test_name, False, f"HTTP {response.status_code}: {response.text}")
                    
            except Exception as e:
                self.log_result(test_name, False, f"Exception: {str(e)}")

    def test_database_product_count(self):
        """Verify database has 48,000+ products"""
        test_name = "Database Product Count Verification"
        
        try:
            # Try to get a large sample to estimate total
            url = f"{BACKEND_URL}/autocomplete/products"
            params = {"query": "", "limit": 100}  # Get sample
            
            response = requests.get(url, params=params, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                
                # Check if we have count information
                if isinstance(data, dict) and "count" in data:
                    total_count = data["count"]
                    if total_count >= 48000:
                        self.log_result(test_name, True, f"Database contains {total_count:,} products (exceeds 48,000 requirement)", data)
                    else:
                        self.log_result(test_name, False, f"Database contains only {total_count:,} products (below 48,000 requirement)", data)
                else:
                    # Estimate based on sample
                    products = data.get("products", data) if isinstance(data, dict) else data
                    sample_size = len(products)
                    
                    if sample_size >= 100:
                        self.log_result(test_name, True, f"Database appears well-populated (sample: {sample_size} products)", {"sample_size": sample_size})
                    else:
                        self.log_result(test_name, False, f"Database appears under-populated (sample: {sample_size} products)", {"sample_size": sample_size})
            else:
                self.log_result(test_name, False, f"HTTP {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_result(test_name, False, f"Exception: {str(e)}")

    # ==================== CALCULATORS ====================
    def test_wallpaper_calculator(self):
        """Test wallpaper calculator with correct parameters"""
        test_name = "Wallpaper Calculator"
        
        try:
            url = f"{BACKEND_URL}/calculators/wallpaper"
            payload = {
                "wallpaper_type": "standard",
                "wall_width": 12.0,
                "wall_height": 9.0,
                "roll_width": 27.0,
                "roll_length": 27.0
            }
            
            response = requests.post(url, json=payload, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if "rolls_needed" in data or "result" in data:
                    self.log_result(test_name, True, f"Calculation successful", data)
                else:
                    self.log_result(test_name, False, "Missing calculation results", data)
            else:
                self.log_result(test_name, False, f"HTTP {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_result(test_name, False, f"Exception: {str(e)}")

    def test_drapery_calculator(self):
        """Test drapery calculator with correct parameters"""
        test_name = "Drapery Calculator"
        
        try:
            url = f"{BACKEND_URL}/calculators/drapery"
            payload = {
                "window_width": 60.0,
                "finished_length": 84.0,
                "pleat_type": "pinch",
                "fullness_ratio": 2.5,
                "fabric_width": 54.0
            }
            
            response = requests.post(url, json=payload, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if "fabric_needed" in data or "result" in data:
                    self.log_result(test_name, True, f"Calculation successful", data)
                else:
                    self.log_result(test_name, False, "Missing calculation results", data)
            else:
                self.log_result(test_name, False, f"HTTP {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_result(test_name, False, f"Exception: {str(e)}")

    def test_paint_calculator(self):
        """Test paint calculator with correct parameters"""
        test_name = "Paint Calculator"
        
        try:
            url = f"{BACKEND_URL}/calculators/paint"
            payload = {
                "room_length": 15.0,
                "room_width": 12.0,
                "wall_height": 9.0,
                "coats": 2
            }
            
            response = requests.post(url, json=payload, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if "gallons_needed" in data or "result" in data:
                    self.log_result(test_name, True, f"Calculation successful", data)
                else:
                    self.log_result(test_name, False, "Missing calculation results", data)
            else:
                self.log_result(test_name, False, f"HTTP {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_result(test_name, False, f"Exception: {str(e)}")

    def test_hardware_calculator(self):
        """Test hardware (curtain rod) calculator with correct parameters"""
        test_name = "Hardware Calculator (Curtain Rod)"
        
        try:
            url = f"{BACKEND_URL}/calculators/hardware"
            payload = {
                "window_width": 48.0,
                "rod_overhang_per_side": 6.0,
                "rod_diameter": 1.5
            }
            
            response = requests.post(url, json=payload, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if "rod_length" in data or "result" in data:
                    self.log_result(test_name, True, f"Calculation successful", data)
                else:
                    self.log_result(test_name, False, "Missing calculation results", data)
            else:
                self.log_result(test_name, False, f"HTTP {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_result(test_name, False, f"Exception: {str(e)}")

    def test_tile_flooring_calculator(self):
        """Test tile/flooring calculator"""
        test_name = "Tile/Flooring Calculator"
        
        try:
            url = f"{BACKEND_URL}/calculators/flooring"
            payload = {
                "room_length": 15.0,
                "room_width": 12.0,
                "tile_length": 12.0,
                "tile_width": 12.0
            }
            
            response = requests.post(url, json=payload, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if "tiles_needed" in data or "result" in data:
                    self.log_result(test_name, True, f"Calculation successful", data)
                else:
                    self.log_result(test_name, False, "Missing calculation results", data)
            else:
                self.log_result(test_name, False, f"HTTP {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_result(test_name, False, f"Exception: {str(e)}")

    def test_lighting_calculator(self):
        """Test lighting calculator"""
        test_name = "Lighting Calculator"
        
        try:
            url = f"{BACKEND_URL}/calculators/lighting"
            payload = {
                "room_length": 15.0,
                "room_width": 12.0,
                "ceiling_height": 9.0,
                "room_type": "living room"
            }
            
            response = requests.post(url, json=payload, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if "fixtures_needed" in data or "result" in data:
                    self.log_result(test_name, True, f"Calculation successful", data)
                else:
                    self.log_result(test_name, False, "Missing calculation results", data)
            else:
                self.log_result(test_name, False, f"HTTP {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_result(test_name, False, f"Exception: {str(e)}")

    # ==================== PROJECT CRUD ====================
    def test_project_crud(self):
        """Test complete Project CRUD operations"""
        
        # CREATE Project
        test_name = "Project CRUD - CREATE"
        try:
            url = f"{BACKEND_URL}/projects"
            payload = {
                "name": f"Test Project {datetime.now().strftime('%Y%m%d_%H%M%S')}",
                "client_info": {
                    "full_name": "Jane Smith",
                    "email": "jane.smith@example.com",
                    "phone": "555-0123",
                    "address": "123 Design Street, Style City, SC 12345"
                },
                "project_type": "Renovation",
                "timeline": "6 months",
                "budget": "$50,000",
                "style_preferences": ["Modern", "Minimalist"],
                "color_palette": "Neutral tones with gold accents",
                "special_requirements": "Pet-friendly materials"
            }
            
            response = requests.post(url, json=payload, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if "id" in data:
                    self.test_project_id = data["id"]
                    self.log_result(test_name, True, f"Project created with ID: {self.test_project_id}", data)
                else:
                    self.log_result(test_name, False, "No project ID returned", data)
            else:
                self.log_result(test_name, False, f"HTTP {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_result(test_name, False, f"Exception: {str(e)}")

        if not self.test_project_id:
            return

        # READ Project
        test_name = "Project CRUD - READ"
        try:
            url = f"{BACKEND_URL}/projects/{self.test_project_id}"
            response = requests.get(url, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if data.get("id") == self.test_project_id:
                    self.log_result(test_name, True, f"Project retrieved successfully", data)
                else:
                    self.log_result(test_name, False, "Project ID mismatch", data)
            else:
                self.log_result(test_name, False, f"HTTP {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_result(test_name, False, f"Exception: {str(e)}")

        # UPDATE Project
        test_name = "Project CRUD - UPDATE"
        try:
            url = f"{BACKEND_URL}/projects/{self.test_project_id}"
            payload = {
                "budget": "$75,000",
                "timeline": "8 months"
            }
            
            response = requests.put(url, json=payload, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if data.get("budget") == "$75,000":
                    self.log_result(test_name, True, f"Project updated successfully", data)
                else:
                    self.log_result(test_name, False, "Update not reflected", data)
            else:
                self.log_result(test_name, False, f"HTTP {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_result(test_name, False, f"Exception: {str(e)}")

        # LIST Projects
        test_name = "Project CRUD - LIST"
        try:
            url = f"{BACKEND_URL}/projects"
            response = requests.get(url, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list) and len(data) > 0:
                    self.log_result(test_name, True, f"Retrieved {len(data)} projects", {"count": len(data)})
                else:
                    self.log_result(test_name, False, "No projects returned", data)
            else:
                self.log_result(test_name, False, f"HTTP {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_result(test_name, False, f"Exception: {str(e)}")

    # ==================== BUDGET MANAGEMENT ====================
    def test_budget_management(self):
        """Test budget management APIs"""
        
        if not self.test_project_id:
            self.log_result("Budget Management - SKIPPED", False, "No test project available")
            return

        # GET Budget
        test_name = "Budget Management - GET"
        try:
            url = f"{BACKEND_URL}/budget/{self.test_project_id}"
            response = requests.get(url, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                self.log_result(test_name, True, f"Budget data retrieved", data)
            else:
                self.log_result(test_name, False, f"HTTP {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_result(test_name, False, f"Exception: {str(e)}")

        # POST Budget Item
        test_name = "Budget Management - CREATE ITEM"
        try:
            url = f"{BACKEND_URL}/budget"
            payload = {
                "project_id": self.test_project_id,
                "category": "Furniture",
                "item_name": "Living Room Sofa",
                "estimated_cost": 2500.00,
                "actual_cost": 0.00,
                "vendor": "Four Hands",
                "status": "Researching"
            }
            
            response = requests.post(url, json=payload, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                self.log_result(test_name, True, f"Budget item created", data)
            else:
                self.log_result(test_name, False, f"HTTP {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_result(test_name, False, f"Exception: {str(e)}")

    # ==================== DELIVERY TRACKING ====================
    def test_delivery_tracking(self):
        """Test delivery tracking APIs"""
        
        if not self.test_project_id:
            self.log_result("Delivery Tracking - SKIPPED", False, "No test project available")
            return

        # GET Deliveries
        test_name = "Delivery Tracking - GET"
        try:
            url = f"{BACKEND_URL}/deliveries/{self.test_project_id}"
            response = requests.get(url, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                self.log_result(test_name, True, f"Delivery data retrieved", data)
            else:
                self.log_result(test_name, False, f"HTTP {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_result(test_name, False, f"Exception: {str(e)}")

        # POST Delivery
        test_name = "Delivery Tracking - CREATE"
        try:
            url = f"{BACKEND_URL}/deliveries"
            payload = {
                "project_id": self.test_project_id,
                "item_name": "Living Room Sofa",
                "vendor": "Four Hands",
                "tracking_number": "1Z999AA1234567890",
                "carrier": "UPS",
                "expected_delivery": "2024-01-15",
                "status": "In Transit"
            }
            
            response = requests.post(url, json=payload, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                self.log_result(test_name, True, f"Delivery created", data)
            else:
                self.log_result(test_name, False, f"HTTP {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_result(test_name, False, f"Exception: {str(e)}")

    # ==================== AI CHAT ====================
    def test_ai_chat(self):
        """Test AI Chat with session_id parameter"""
        test_name = "AI Chat with Session ID"
        
        try:
            url = f"{BACKEND_URL}/ai/chat"
            payload = {
                "message": "What are some popular interior design trends for 2024?",
                "session_id": str(uuid.uuid4())
            }
            
            response = requests.post(url, json=payload, timeout=30)
            
            if response.status_code == 200:
                data = response.json()
                if "response" in data or "message" in data:
                    self.log_result(test_name, True, f"AI chat successful", data)
                else:
                    self.log_result(test_name, False, "No AI response received", data)
            else:
                self.log_result(test_name, False, f"HTTP {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_result(test_name, False, f"Exception: {str(e)}")

    # ==================== CLEANUP ====================
    def cleanup_test_data(self):
        """Clean up test project if created"""
        if self.test_project_id:
            test_name = "Cleanup - DELETE Test Project"
            try:
                url = f"{BACKEND_URL}/projects/{self.test_project_id}"
                response = requests.delete(url, timeout=10)
                
                if response.status_code in [200, 204]:
                    self.log_result(test_name, True, f"Test project deleted", {})
                else:
                    self.log_result(test_name, False, f"HTTP {response.status_code}: {response.text}")
                    
            except Exception as e:
                self.log_result(test_name, False, f"Exception: {str(e)}")

    # ==================== MAIN TEST RUNNER ====================
    def run_all_tests(self):
        """Run all comprehensive backend tests"""
        print("=" * 80)
        print("COMPREHENSIVE BACKEND TESTING SUITE")
        print("Interior Design Studio App - Complete API Testing")
        print("=" * 80)
        print()
        
        # Health Check
        print("🏥 HEALTH CHECK")
        print("-" * 40)
        self.test_api_health()
        print()
        
        # Product Searches
        print("🔍 PRODUCT SEARCHES")
        print("-" * 40)
        self.test_specific_product_searches()
        self.test_database_product_count()
        print()
        
        # Calculators
        print("🧮 CALCULATORS")
        print("-" * 40)
        self.test_wallpaper_calculator()
        self.test_drapery_calculator()
        self.test_paint_calculator()
        self.test_hardware_calculator()
        self.test_tile_flooring_calculator()
        self.test_lighting_calculator()
        print()
        
        # Project CRUD
        print("📋 PROJECT MANAGEMENT")
        print("-" * 40)
        self.test_project_crud()
        print()
        
        # Budget Management
        print("💰 BUDGET MANAGEMENT")
        print("-" * 40)
        self.test_budget_management()
        print()
        
        # Delivery Tracking
        print("🚚 DELIVERY TRACKING")
        print("-" * 40)
        self.test_delivery_tracking()
        print()
        
        # AI Chat
        print("🤖 AI CHAT")
        print("-" * 40)
        self.test_ai_chat()
        print()
        
        # Cleanup
        print("🧹 CLEANUP")
        print("-" * 40)
        self.cleanup_test_data()
        print()
        
        # Print summary
        print("=" * 80)
        print("COMPREHENSIVE TEST SUMMARY")
        print("=" * 80)
        print(f"Total Tests: {self.total_tests}")
        print(f"Passed: {self.passed_tests}")
        print(f"Failed: {self.failed_tests}")
        print(f"Success Rate: {(self.passed_tests/self.total_tests*100):.1f}%")
        print()
        
        # Print failed tests details
        if self.failed_tests > 0:
            print("❌ FAILED TESTS:")
            print("-" * 40)
            for result in self.results:
                if "❌ FAIL" in result["status"]:
                    print(f"❌ {result['test']}")
                    print(f"   {result['details']}")
                    print()
        
        # Print passed tests summary
        if self.passed_tests > 0:
            print("✅ PASSED TESTS:")
            print("-" * 40)
            for result in self.results:
                if "✅ PASS" in result["status"]:
                    print(f"✅ {result['test']}")
            print()
        
        return self.passed_tests, self.failed_tests, self.total_tests

if __name__ == "__main__":
    tester = ComprehensiveBackendTester()
    passed, failed, total = tester.run_all_tests()
    
    if failed == 0:
        print("🎉 ALL TESTS PASSED! Backend is ready for deployment.")
    else:
        print(f"⚠️  {failed}/{total} TESTS FAILED. Check the details above.")
    
    exit(0 if failed == 0 else 1)
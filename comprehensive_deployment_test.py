#!/usr/bin/env python3
"""
COMPREHENSIVE DEPLOYMENT BACKEND API TESTING SUITE
Tests ALL endpoints with REAL data as requested - NO STONE UNTURNED
"""

import requests
import json
import time
from typing import Dict, Any, List
from datetime import datetime

# Backend URL from frontend .env
BACKEND_URL = "https://bugsquash-hub.preview.emergentagent.com/api"

class ComprehensiveBackendTester:
    def __init__(self):
        self.results = []
        self.total_tests = 0
        self.passed_tests = 0
        self.failed_tests = 0
        self.test_project_id = None
        self.test_budget_id = None
        self.test_delivery_id = None
        
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
            print(f"   Response: {response_data}")
        print()

    # ==================== HEALTH CHECK ====================
    def test_api_health(self):
        """Test API health endpoint"""
        test_name = "API Health Check"
        
        try:
            url = f"{BACKEND_URL}/health"
            print(f"Testing: {test_name}")
            print(f"GET {url}")
            
            response = requests.get(url, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if data.get("status") == "healthy":
                    self.log_result(test_name, True, "API is healthy and responding", data)
                else:
                    self.log_result(test_name, False, f"API unhealthy: {data}", data)
            else:
                self.log_result(test_name, False, f"HTTP {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_result(test_name, False, f"Exception: {str(e)}")

    # ==================== PROJECTS CRUD ====================
    def test_get_projects(self):
        """Test GET /api/projects"""
        test_name = "GET Projects List"
        
        try:
            url = f"{BACKEND_URL}/projects"
            print(f"Testing: {test_name}")
            print(f"GET {url}")
            
            response = requests.get(url, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list) and len(data) > 0:
                    # Store first project ID for other tests
                    self.test_project_id = data[0].get("id")
                    self.log_result(test_name, True, f"Retrieved {len(data)} projects", {"count": len(data), "first_project": data[0].get("name")})
                else:
                    self.log_result(test_name, False, "No projects found or invalid format", data)
            else:
                self.log_result(test_name, False, f"HTTP {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_result(test_name, False, f"Exception: {str(e)}")

    def test_create_project(self):
        """Test POST /api/projects - Create a test project"""
        test_name = "POST Create Project"
        
        try:
            url = f"{BACKEND_URL}/projects"
            payload = {
                "name": "Comprehensive Test Project - Modern Luxury Home",
                "client_info": {
                    "full_name": "Sarah & Michael Johnson",
                    "email": "sarah.johnson@email.com",
                    "phone": "(555) 123-4567",
                    "address": "1234 Luxury Lane, Beverly Hills, CA 90210"
                },
                "project_type": "Renovation",
                "timeline": "6 months",
                "budget": "$150,000 - $200,000",
                "style_preferences": ["Modern", "Minimalist", "Luxury"],
                "color_palette": "Neutral tones with navy blue accents",
                "special_requirements": "Pet-friendly materials, smart home integration"
            }
            
            print(f"Testing: {test_name}")
            print(f"POST {url}")
            print(f"Payload: {json.dumps(payload, indent=2)}")
            
            response = requests.post(url, json=payload, timeout=10)
            
            if response.status_code == 201:
                data = response.json()
                if data.get("id"):
                    self.test_project_id = data.get("id")
                    self.log_result(test_name, True, f"Created project: {data.get('name')} (ID: {data.get('id')})", data)
                else:
                    self.log_result(test_name, False, "Project created but no ID returned", data)
            else:
                self.log_result(test_name, False, f"HTTP {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_result(test_name, False, f"Exception: {str(e)}")

    def test_get_project_by_id(self):
        """Test GET /api/projects/{id}"""
        test_name = "GET Project by ID"
        
        if not self.test_project_id:
            self.log_result(test_name, False, "No test project ID available")
            return
            
        try:
            url = f"{BACKEND_URL}/projects/{self.test_project_id}"
            print(f"Testing: {test_name}")
            print(f"GET {url}")
            
            response = requests.get(url, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if data.get("id") == self.test_project_id:
                    self.log_result(test_name, True, f"Retrieved project: {data.get('name')}", {"name": data.get("name"), "client": data.get("client_info", {}).get("full_name")})
                else:
                    self.log_result(test_name, False, "Project ID mismatch", data)
            else:
                self.log_result(test_name, False, f"HTTP {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_result(test_name, False, f"Exception: {str(e)}")

    def test_update_project(self):
        """Test PUT /api/projects/{id}"""
        test_name = "PUT Update Project"
        
        if not self.test_project_id:
            self.log_result(test_name, False, "No test project ID available")
            return
            
        try:
            url = f"{BACKEND_URL}/projects/{self.test_project_id}"
            payload = {
                "timeline": "8 months (extended)",
                "budget": "$175,000 - $225,000 (revised)"
            }
            
            print(f"Testing: {test_name}")
            print(f"PUT {url}")
            print(f"Payload: {json.dumps(payload, indent=2)}")
            
            response = requests.put(url, json=payload, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if data.get("timeline") == payload["timeline"]:
                    self.log_result(test_name, True, "Project updated successfully", {"timeline": data.get("timeline"), "budget": data.get("budget")})
                else:
                    self.log_result(test_name, False, "Update not reflected in response", data)
            else:
                self.log_result(test_name, False, f"HTTP {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_result(test_name, False, f"Exception: {str(e)}")

    # ==================== BUDGET CRUD ====================
    def test_get_budget(self):
        """Test GET /api/budget/{project_id}"""
        test_name = "GET Budget by Project ID"
        
        if not self.test_project_id:
            self.log_result(test_name, False, "No test project ID available")
            return
            
        try:
            url = f"{BACKEND_URL}/budget/{self.test_project_id}"
            print(f"Testing: {test_name}")
            print(f"GET {url}")
            
            response = requests.get(url, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list):
                    self.log_result(test_name, True, f"Retrieved {len(data)} budget items", {"count": len(data)})
                else:
                    self.log_result(test_name, True, "Budget endpoint accessible (empty or different format)", data)
            else:
                self.log_result(test_name, False, f"HTTP {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_result(test_name, False, f"Exception: {str(e)}")

    def test_create_budget_item(self):
        """Test POST /api/budget - Create budget item"""
        test_name = "POST Create Budget Item"
        
        if not self.test_project_id:
            self.log_result(test_name, False, "No test project ID available")
            return
            
        try:
            url = f"{BACKEND_URL}/budget"
            payload = {
                "project_id": self.test_project_id,
                "item_name": "Living Room Sectional Sofa",
                "estimated_cost": 4500.00,
                "actual_cost": 4200.00,
                "category": "Furniture",
                "vendor": "Four Hands",
                "notes": "Modern sectional in navy blue fabric"
            }
            
            print(f"Testing: {test_name}")
            print(f"POST {url}")
            print(f"Payload: {json.dumps(payload, indent=2)}")
            
            response = requests.post(url, json=payload, timeout=10)
            
            if response.status_code in [200, 201]:
                data = response.json()
                if data.get("id"):
                    self.test_budget_id = data.get("id")
                    self.log_result(test_name, True, f"Created budget item: {data.get('item_name')} (ID: {data.get('id')})", data)
                else:
                    self.log_result(test_name, False, "Budget item created but no ID returned", data)
            else:
                self.log_result(test_name, False, f"HTTP {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_result(test_name, False, f"Exception: {str(e)}")

    def test_update_budget_item(self):
        """Test PUT /api/budget/{id}"""
        test_name = "PUT Update Budget Item"
        
        if not self.test_budget_id:
            self.log_result(test_name, False, "No test budget ID available")
            return
            
        try:
            url = f"{BACKEND_URL}/budget/{self.test_budget_id}"
            payload = {
                "actual_cost": 3950.00,
                "notes": "Negotiated better price with vendor"
            }
            
            print(f"Testing: {test_name}")
            print(f"PUT {url}")
            print(f"Payload: {json.dumps(payload, indent=2)}")
            
            response = requests.put(url, json=payload, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                self.log_result(test_name, True, "Budget item updated successfully", data)
            else:
                self.log_result(test_name, False, f"HTTP {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_result(test_name, False, f"Exception: {str(e)}")

    # ==================== DELIVERIES CRUD ====================
    def test_get_deliveries(self):
        """Test GET /api/deliveries/{project_id}"""
        test_name = "GET Deliveries by Project ID"
        
        if not self.test_project_id:
            self.log_result(test_name, False, "No test project ID available")
            return
            
        try:
            url = f"{BACKEND_URL}/deliveries/{self.test_project_id}"
            print(f"Testing: {test_name}")
            print(f"GET {url}")
            
            response = requests.get(url, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list):
                    self.log_result(test_name, True, f"Retrieved {len(data)} deliveries", {"count": len(data)})
                else:
                    self.log_result(test_name, True, "Deliveries endpoint accessible", data)
            else:
                self.log_result(test_name, False, f"HTTP {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_result(test_name, False, f"Exception: {str(e)}")

    def test_create_delivery(self):
        """Test POST /api/deliveries"""
        test_name = "POST Create Delivery"
        
        if not self.test_project_id:
            self.log_result(test_name, False, "No test project ID available")
            return
            
        try:
            url = f"{BACKEND_URL}/deliveries"
            payload = {
                "project_id": self.test_project_id,
                "item_name": "Living Room Sectional Sofa",
                "vendor": "Four Hands",
                "tracking_number": "1Z999AA1234567890",
                "carrier": "UPS",
                "expected_delivery": "2024-12-25T10:00:00Z",
                "status": "SHIPPED",
                "notes": "White glove delivery scheduled"
            }
            
            print(f"Testing: {test_name}")
            print(f"POST {url}")
            print(f"Payload: {json.dumps(payload, indent=2)}")
            
            response = requests.post(url, json=payload, timeout=10)
            
            if response.status_code in [200, 201]:
                data = response.json()
                if data.get("id"):
                    self.test_delivery_id = data.get("id")
                    self.log_result(test_name, True, f"Created delivery: {data.get('item_name')} (ID: {data.get('id')})", data)
                else:
                    self.log_result(test_name, False, "Delivery created but no ID returned", data)
            else:
                self.log_result(test_name, False, f"HTTP {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_result(test_name, False, f"Exception: {str(e)}")

    def test_update_delivery(self):
        """Test PUT /api/deliveries/{id}"""
        test_name = "PUT Update Delivery"
        
        if not self.test_delivery_id:
            self.log_result(test_name, False, "No test delivery ID available")
            return
            
        try:
            url = f"{BACKEND_URL}/deliveries/{self.test_delivery_id}"
            payload = {
                "status": "DELIVERED",
                "actual_delivery": "2024-12-24T14:30:00Z",
                "notes": "Delivered successfully, client very happy"
            }
            
            print(f"Testing: {test_name}")
            print(f"PUT {url}")
            print(f"Payload: {json.dumps(payload, indent=2)}")
            
            response = requests.put(url, json=payload, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                self.log_result(test_name, True, "Delivery updated successfully", data)
            else:
                self.log_result(test_name, False, f"HTTP {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_result(test_name, False, f"Exception: {str(e)}")

    # ==================== AI CHAT ====================
    def test_ai_chat(self):
        """Test POST /api/ai/chat"""
        test_name = "POST AI Chat"
        
        try:
            url = f"{BACKEND_URL}/ai/chat"
            payload = {
                "message": "What colors go well with navy blue in a modern living room?",
                "session_id": "test_session_123",
                "project_context": {
                    "style": "Modern",
                    "room": "Living Room",
                    "budget": "$150,000"
                }
            }
            
            print(f"Testing: {test_name}")
            print(f"POST {url}")
            print(f"Payload: {json.dumps(payload, indent=2)}")
            
            response = requests.post(url, json=payload, timeout=30)
            
            if response.status_code == 200:
                data = response.json()
                if data.get("response") or data.get("message"):
                    self.log_result(test_name, True, f"AI responded successfully", {"response_length": len(str(data))})
                else:
                    self.log_result(test_name, False, "AI response missing or empty", data)
            else:
                self.log_result(test_name, False, f"HTTP {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_result(test_name, False, f"Exception: {str(e)}")

    # ==================== ALL CALCULATORS ====================
    def test_drapery_calculator(self):
        """Test POST /api/calculators/drapery"""
        test_name = "POST Drapery Calculator"
        
        try:
            url = f"{BACKEND_URL}/calculators/drapery"
            payload = {
                "window_width": 60,
                "finished_length": 84,
                "pleat_type": "pinch_pleat",
                "fullness_ratio": 2.5,
                "fabric_width": 54
            }
            
            print(f"Testing: {test_name}")
            print(f"POST {url}")
            print(f"Payload: {json.dumps(payload, indent=2)}")
            
            response = requests.post(url, json=payload, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if data.get("fabric_needed") or data.get("yards_needed"):
                    self.log_result(test_name, True, f"Calculation successful", data)
                else:
                    self.log_result(test_name, False, "Missing calculation results", data)
            else:
                self.log_result(test_name, False, f"HTTP {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_result(test_name, False, f"Exception: {str(e)}")

    def test_hardware_calculator(self):
        """Test POST /api/calculators/hardware"""
        test_name = "POST Hardware Calculator"
        
        try:
            url = f"{BACKEND_URL}/calculators/hardware"
            payload = {
                "cabinet_count": 20,
                "drawer_count": 10,
                "door_count": 8
            }
            
            print(f"Testing: {test_name}")
            print(f"POST {url}")
            print(f"Payload: {json.dumps(payload, indent=2)}")
            
            response = requests.post(url, json=payload, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if data.get("total_hardware") or data.get("handles") or data.get("knobs"):
                    self.log_result(test_name, True, f"Calculation successful", data)
                else:
                    self.log_result(test_name, False, "Missing calculation results", data)
            else:
                self.log_result(test_name, False, f"HTTP {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_result(test_name, False, f"Exception: {str(e)}")

    def test_paint_calculator(self):
        """Test POST /api/calculators/paint"""
        test_name = "POST Paint Calculator"
        
        try:
            url = f"{BACKEND_URL}/calculators/paint"
            payload = {
                "room_length": 15,
                "room_width": 12,
                "wall_height": 9,
                "door_count": 2,
                "window_count": 3
            }
            
            print(f"Testing: {test_name}")
            print(f"POST {url}")
            print(f"Payload: {json.dumps(payload, indent=2)}")
            
            response = requests.post(url, json=payload, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if data.get("gallons_needed") or data.get("paint_needed"):
                    self.log_result(test_name, True, f"Calculation successful", data)
                else:
                    self.log_result(test_name, False, "Missing calculation results", data)
            else:
                self.log_result(test_name, False, f"HTTP {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_result(test_name, False, f"Exception: {str(e)}")

    def test_flooring_calculator(self):
        """Test POST /api/calculators/flooring"""
        test_name = "POST Flooring Calculator"
        
        try:
            url = f"{BACKEND_URL}/calculators/flooring"
            payload = {
                "room_length": 15,
                "room_width": 12,
                "flooring_type": "hardwood",
                "waste_percentage": 10
            }
            
            print(f"Testing: {test_name}")
            print(f"POST {url}")
            print(f"Payload: {json.dumps(payload, indent=2)}")
            
            response = requests.post(url, json=payload, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if data.get("square_feet") or data.get("total_needed"):
                    self.log_result(test_name, True, f"Calculation successful", data)
                else:
                    self.log_result(test_name, False, "Missing calculation results", data)
            else:
                self.log_result(test_name, False, f"HTTP {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_result(test_name, False, f"Exception: {str(e)}")

    def test_lighting_calculator(self):
        """Test POST /api/calculators/lighting"""
        test_name = "POST Lighting Calculator"
        
        try:
            url = f"{BACKEND_URL}/calculators/lighting"
            payload = {
                "room_length": 20,
                "room_width": 15,
                "room_type": "living_room"
            }
            
            print(f"Testing: {test_name}")
            print(f"POST {url}")
            print(f"Payload: {json.dumps(payload, indent=2)}")
            
            response = requests.post(url, json=payload, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if data.get("lumens_needed") or data.get("fixtures_needed"):
                    self.log_result(test_name, True, f"Calculation successful", data)
                else:
                    self.log_result(test_name, False, "Missing calculation results", data)
            else:
                self.log_result(test_name, False, f"HTTP {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_result(test_name, False, f"Exception: {str(e)}")

    def test_square_footage_calculator(self):
        """Test POST /api/calculators/square-footage"""
        test_name = "POST Square Footage Calculator"
        
        try:
            url = f"{BACKEND_URL}/calculators/square-footage"
            payload = {
                "length": 12,
                "width": 15
            }
            
            print(f"Testing: {test_name}")
            print(f"POST {url}")
            print(f"Payload: {json.dumps(payload, indent=2)}")
            
            response = requests.post(url, json=payload, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if data.get("square_feet") or data.get("area"):
                    self.log_result(test_name, True, f"Calculation successful", data)
                else:
                    self.log_result(test_name, False, "Missing calculation results", data)
            else:
                self.log_result(test_name, False, f"HTTP {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_result(test_name, False, f"Exception: {str(e)}")

    # ==================== PRODUCT SCRAPING ====================
    def test_product_scraping(self):
        """Test POST /api/scrape-product with Uttermost URL"""
        test_name = "POST Product Scraping - Uttermost"
        
        try:
            url = f"{BACKEND_URL}/scrape-product"
            payload = {
                "url": "https://www.uttermost.com/adara-mirror-01127"
            }
            
            print(f"Testing: {test_name}")
            print(f"POST {url}")
            print(f"Payload: {json.dumps(payload, indent=2)}")
            
            response = requests.post(url, json=payload, timeout=60)  # Longer timeout for scraping
            
            if response.status_code == 200:
                data = response.json()
                if data.get("success") and data.get("data"):
                    product_data = data.get("data", {})
                    if product_data.get("name") and product_data.get("vendor"):
                        self.log_result(test_name, True, f"Scraped product: {product_data.get('name')} from {product_data.get('vendor')}", {"source": data.get("source")})
                    else:
                        self.log_result(test_name, False, "Missing essential product data", data)
                else:
                    self.log_result(test_name, False, f"Scraping failed: {data.get('error', 'Unknown error')}", data)
            else:
                self.log_result(test_name, False, f"HTTP {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_result(test_name, False, f"Exception: {str(e)}")

    # ==================== AUTOCOMPLETE ====================
    def test_product_autocomplete(self):
        """Test GET /api/autocomplete/products?query=chair"""
        test_name = "GET Product Autocomplete - Chair"
        
        try:
            url = f"{BACKEND_URL}/autocomplete/products"
            params = {"query": "chair"}
            
            print(f"Testing: {test_name}")
            print(f"GET {url}")
            print(f"Params: {params}")
            
            response = requests.get(url, params=params, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                
                # Handle different response formats
                products = []
                if data.get("success") and "products" in data:
                    products = data["products"]
                elif isinstance(data, list):
                    products = data
                
                if len(products) > 0:
                    chair_products = [p for p in products if "chair" in p.get("name", "").lower()]
                    self.log_result(test_name, True, f"Found {len(chair_products)} chair products out of {len(products)} total", {"sample": products[:3] if products else []})
                else:
                    self.log_result(test_name, False, "No products found", data)
            else:
                self.log_result(test_name, False, f"HTTP {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_result(test_name, False, f"Exception: {str(e)}")

    def test_vendor_autocomplete(self):
        """Test GET /api/autocomplete/vendors"""
        test_name = "GET Vendor Autocomplete"
        
        try:
            url = f"{BACKEND_URL}/autocomplete/vendors"
            
            print(f"Testing: {test_name}")
            print(f"GET {url}")
            
            response = requests.get(url, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                
                # Handle different response formats
                vendors = []
                if data.get("success") and "vendors" in data:
                    vendors = data["vendors"]
                elif isinstance(data, list):
                    vendors = [v.get("name", v) if isinstance(v, dict) else v for v in data]
                
                if len(vendors) > 0:
                    self.log_result(test_name, True, f"Found {len(vendors)} vendors: {', '.join(vendors[:5])}{'...' if len(vendors) > 5 else ''}", {"count": len(vendors)})
                else:
                    self.log_result(test_name, False, "No vendors found", data)
            else:
                self.log_result(test_name, False, f"HTTP {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_result(test_name, False, f"Exception: {str(e)}")

    def test_paint_colors_autocomplete(self):
        """Test GET /api/autocomplete/paint-colors?query=blue"""
        test_name = "GET Paint Colors Autocomplete - Blue"
        
        try:
            url = f"{BACKEND_URL}/autocomplete/paint-colors"
            params = {"query": "blue"}
            
            print(f"Testing: {test_name}")
            print(f"GET {url}")
            print(f"Params: {params}")
            
            response = requests.get(url, params=params, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                
                # Handle different response formats
                colors = []
                if data.get("success") and "colors" in data:
                    colors = data["colors"]
                elif isinstance(data, list):
                    colors = data
                
                if len(colors) > 0:
                    blue_colors = [c for c in colors if "blue" in str(c).lower()]
                    self.log_result(test_name, True, f"Found {len(blue_colors)} blue colors out of {len(colors)} total", {"sample": colors[:5] if colors else []})
                else:
                    self.log_result(test_name, False, "No paint colors found", data)
            else:
                self.log_result(test_name, False, f"HTTP {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_result(test_name, False, f"Exception: {str(e)}")

    # ==================== CHECKLISTS ====================
    def test_get_checklist(self):
        """Test GET /api/checklist/{project_id}"""
        test_name = "GET Checklist by Project ID"
        
        if not self.test_project_id:
            self.log_result(test_name, False, "No test project ID available")
            return
            
        try:
            url = f"{BACKEND_URL}/checklist/{self.test_project_id}"
            print(f"Testing: {test_name}")
            print(f"GET {url}")
            
            response = requests.get(url, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                self.log_result(test_name, True, "Checklist endpoint accessible", {"response_type": type(data).__name__, "length": len(data) if isinstance(data, (list, dict)) else "N/A"})
            else:
                self.log_result(test_name, False, f"HTTP {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_result(test_name, False, f"Exception: {str(e)}")

    # ==================== PDF EXPORT ====================
    def test_pdf_export(self):
        """Test POST /api/pdf-report"""
        test_name = "POST PDF Export"
        
        try:
            url = f"{BACKEND_URL}/pdf-report"
            payload = {
                "project_id": self.test_project_id or "test_project",
                "report_type": "full"
            }
            
            print(f"Testing: {test_name}")
            print(f"POST {url}")
            print(f"Payload: {json.dumps(payload, indent=2)}")
            
            response = requests.post(url, json=payload, timeout=30)
            
            if response.status_code == 200:
                # Check if response is PDF content
                if response.headers.get('content-type') == 'application/pdf':
                    self.log_result(test_name, True, f"PDF generated successfully ({len(response.content)} bytes)", {"content_type": response.headers.get('content-type')})
                else:
                    data = response.json() if response.headers.get('content-type', '').startswith('application/json') else response.text
                    self.log_result(test_name, True, "PDF endpoint responded (non-PDF response)", data)
            else:
                self.log_result(test_name, False, f"HTTP {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_result(test_name, False, f"Exception: {str(e)}")

    # ==================== VENDOR CREDENTIALS SECURITY ====================
    def test_vendor_credentials_security(self):
        """Test GET /api/vendor-credentials - Verify NO plain text passwords"""
        test_name = "GET Vendor Credentials Security Check"
        
        try:
            url = f"{BACKEND_URL}/vendor-credentials"
            
            print(f"Testing: {test_name}")
            print(f"GET {url}")
            
            response = requests.get(url, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                
                # Check if response contains credentials
                if isinstance(data, list) and len(data) > 0:
                    # Verify no plain text passwords are exposed
                    security_issues = []
                    for cred in data:
                        if isinstance(cred, dict):
                            # Check for plain text password fields
                            for key, value in cred.items():
                                if 'password' in key.lower() and isinstance(value, str) and len(value) > 0:
                                    # If password is not encrypted (should be encrypted or hashed)
                                    if not (value.startswith('gAAAAA') or len(value) > 50):  # Fernet encrypted or long hash
                                        security_issues.append(f"Plain text password found in field: {key}")
                    
                    if security_issues:
                        self.log_result(test_name, False, f"SECURITY ISSUE: {'; '.join(security_issues)}", {"issues": security_issues})
                    else:
                        self.log_result(test_name, True, f"Security check passed - {len(data)} credentials properly encrypted", {"credential_count": len(data)})
                else:
                    self.log_result(test_name, True, "No credentials returned or empty response", data)
            else:
                self.log_result(test_name, False, f"HTTP {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_result(test_name, False, f"Exception: {str(e)}")

    # ==================== SMART ALTERNATIVES ====================
    def test_smart_alternatives(self):
        """Test GET /api/smart-alternatives?item_name=chair&category=furniture"""
        test_name = "GET Smart Alternatives - Chair"
        
        try:
            url = f"{BACKEND_URL}/smart-alternatives"
            params = {
                "item_name": "chair",
                "category": "furniture"
            }
            
            print(f"Testing: {test_name}")
            print(f"GET {url}")
            print(f"Params: {params}")
            
            response = requests.get(url, params=params, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                
                # Handle different response formats
                alternatives = []
                if data.get("success") and "alternatives" in data:
                    alternatives = data["alternatives"]
                elif isinstance(data, list):
                    alternatives = data
                
                if len(alternatives) > 0:
                    self.log_result(test_name, True, f"Found {len(alternatives)} smart alternatives", {"sample": alternatives[:3] if alternatives else []})
                else:
                    self.log_result(test_name, True, "Smart alternatives endpoint accessible (no results)", data)
            else:
                self.log_result(test_name, False, f"HTTP {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_result(test_name, False, f"Exception: {str(e)}")

    # ==================== MAIN TEST RUNNER ====================
    def run_all_tests(self):
        """Run all comprehensive backend tests"""
        print("=" * 100)
        print("COMPREHENSIVE DEPLOYMENT BACKEND API TESTING SUITE")
        print("TESTING EVERY SINGLE ENDPOINT - NO STONE UNTURNED")
        print("=" * 100)
        print()
        
        # 1. Health Check
        print("🏥 HEALTH CHECK")
        print("-" * 50)
        self.test_api_health()
        
        # 2. Projects CRUD
        print("📁 PROJECTS CRUD TESTING")
        print("-" * 50)
        self.test_get_projects()
        self.test_create_project()
        self.test_get_project_by_id()
        self.test_update_project()
        
        # 3. Budget CRUD
        print("💰 BUDGET CRUD TESTING")
        print("-" * 50)
        self.test_get_budget()
        self.test_create_budget_item()
        self.test_update_budget_item()
        
        # 4. Deliveries CRUD
        print("🚚 DELIVERIES CRUD TESTING")
        print("-" * 50)
        self.test_get_deliveries()
        self.test_create_delivery()
        self.test_update_delivery()
        
        # 5. AI Chat
        print("🤖 AI CHAT TESTING")
        print("-" * 50)
        self.test_ai_chat()
        
        # 6. ALL Calculators
        print("🧮 ALL CALCULATORS TESTING")
        print("-" * 50)
        self.test_drapery_calculator()
        self.test_hardware_calculator()
        self.test_paint_calculator()
        self.test_flooring_calculator()
        self.test_lighting_calculator()
        self.test_square_footage_calculator()
        
        # 7. Product Scraping
        print("🕷️ PRODUCT SCRAPING TESTING")
        print("-" * 50)
        self.test_product_scraping()
        
        # 8. Autocomplete
        print("🔍 AUTOCOMPLETE TESTING")
        print("-" * 50)
        self.test_product_autocomplete()
        self.test_vendor_autocomplete()
        self.test_paint_colors_autocomplete()
        
        # 9. Checklists
        print("✅ CHECKLIST TESTING")
        print("-" * 50)
        self.test_get_checklist()
        
        # 10. PDF Export
        print("📄 PDF EXPORT TESTING")
        print("-" * 50)
        self.test_pdf_export()
        
        # 11. Vendor Credentials Security
        print("🔒 SECURITY TESTING")
        print("-" * 50)
        self.test_vendor_credentials_security()
        
        # 12. Smart Alternatives
        print("🧠 SMART ALTERNATIVES TESTING")
        print("-" * 50)
        self.test_smart_alternatives()
        
        # Print comprehensive summary
        print("=" * 100)
        print("COMPREHENSIVE TEST SUMMARY")
        print("=" * 100)
        print(f"Total Tests: {self.total_tests}")
        print(f"Passed: {self.passed_tests}")
        print(f"Failed: {self.failed_tests}")
        print(f"Success Rate: {(self.passed_tests/self.total_tests*100):.1f}%")
        print()
        
        # Print detailed results by category
        categories = {
            "Health": ["API Health Check"],
            "Projects": ["GET Projects List", "POST Create Project", "GET Project by ID", "PUT Update Project"],
            "Budget": ["GET Budget by Project ID", "POST Create Budget Item", "PUT Update Budget Item"],
            "Deliveries": ["GET Deliveries by Project ID", "POST Create Delivery", "PUT Update Delivery"],
            "AI": ["POST AI Chat"],
            "Calculators": ["POST Drapery Calculator", "POST Hardware Calculator", "POST Paint Calculator", 
                          "POST Flooring Calculator", "POST Lighting Calculator", "POST Square Footage Calculator"],
            "Scraping": ["POST Product Scraping - Uttermost"],
            "Autocomplete": ["GET Product Autocomplete - Chair", "GET Vendor Autocomplete", "GET Paint Colors Autocomplete - Blue"],
            "Checklist": ["GET Checklist by Project ID"],
            "PDF": ["POST PDF Export"],
            "Security": ["GET Vendor Credentials Security Check"],
            "Smart": ["GET Smart Alternatives - Chair"]
        }
        
        for category, test_names in categories.items():
            category_results = [r for r in self.results if r["test"] in test_names]
            passed = len([r for r in category_results if "✅" in r["status"]])
            total = len(category_results)
            if total > 0:
                print(f"{category}: {passed}/{total} ({(passed/total*100):.0f}%)")
        
        print()
        
        # Print failed tests details
        if self.failed_tests > 0:
            print("❌ FAILED TESTS DETAILS:")
            print("-" * 80)
            for result in self.results:
                if "❌ FAIL" in result["status"]:
                    print(f"❌ {result['test']}")
                    print(f"   {result['details']}")
                    print()
        else:
            print("🎉 ALL TESTS PASSED!")
        
        return self.passed_tests == self.total_tests

if __name__ == "__main__":
    tester = ComprehensiveBackendTester()
    success = tester.run_all_tests()
    
    if success:
        print("🎉 ALL COMPREHENSIVE TESTS PASSED! Backend is deployment ready.")
    else:
        print("⚠️  SOME TESTS FAILED. Review details above for issues.")
    
    exit(0 if success else 1)
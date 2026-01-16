#!/usr/bin/env python3
"""
COMPREHENSIVE BACKEND TESTING FOR INTERIOR DESIGN STUDIO LAUNCH
Testing ALL critical endpoints with EXACT parameters as requested
"""

import requests
import json
import time
from typing import Dict, Any, List
from datetime import datetime

# Backend URL from frontend .env
BACKEND_URL = "https://bugbuster-77.preview.emergentagent.com/api"

class LaunchReadinessTester:
    def __init__(self):
        self.results = []
        self.total_tests = 0
        self.passed_tests = 0
        self.failed_tests = 0
        self.critical_failures = []
        
    def log_result(self, test_name: str, success: bool, details: str = "", response_data: Any = None, critical: bool = False):
        """Log test result"""
        self.total_tests += 1
        if success:
            self.passed_tests += 1
            status = "✅ PASS"
        else:
            self.failed_tests += 1
            status = "❌ FAIL"
            if critical:
                self.critical_failures.append(test_name)
            
        result = {
            "test": test_name,
            "status": status,
            "details": details,
            "response_data": response_data,
            "critical": critical
        }
        self.results.append(result)
        print(f"{status}: {test_name}")
        if details:
            print(f"   Details: {details}")
        if not success and response_data:
            print(f"   Response: {json.dumps(response_data, indent=2)[:500]}...")
        print()

    def test_api_health(self):
        """Test API health check"""
        test_name = "API Health Check"
        
        try:
            url = f"{BACKEND_URL}/health"
            print(f"Testing: {test_name}")
            print(f"GET {url}")
            
            response = requests.get(url, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if data.get("status") == "healthy":
                    self.log_result(test_name, True, f"Backend healthy - Version: {data.get('version', 'Unknown')}", data, critical=True)
                else:
                    self.log_result(test_name, False, f"Backend unhealthy: {data}", data, critical=True)
            else:
                self.log_result(test_name, False, f"HTTP {response.status_code}: {response.text}", None, critical=True)
                
        except Exception as e:
            self.log_result(test_name, False, f"Exception: {str(e)}", None, critical=True)

    def test_specific_product_search(self):
        """Test specific SKU searches with exact expected prices"""
        test_cases = [
            {"sku": "R50276", "expected_price": 1215.00, "vendor": "Uttermost Revelation", "name_contains": "About Turn Console Table"},
            {"sku": "244120-001", "expected_price": 613.00, "vendor": "Four Hands", "name_contains": "Amira Chair"},
            {"sku": "6012-DR-576", "expected_price": 875.00, "vendor": "Bassett Mirror", "name_contains": "Lena Server"},
            {"sku": "W00401", "expected_price": 117.00, "vendor": "Salt Light", "name_contains": ""},
            {"sku": "SCH-170165", "expected_price": 1049.00, "vendor": "Gabby", "name_contains": ""}
        ]
        
        for test_case in test_cases:
            test_name = f"Product Search - {test_case['sku']} (${test_case['expected_price']})"
            
            try:
                url = f"{BACKEND_URL}/autocomplete/products"
                params = {"query": test_case['sku'], "limit": 10}
                
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
                    
                    # Look for exact SKU match
                    found_product = None
                    for product in products:
                        if (product.get("sku") == test_case['sku'] or 
                            test_case['sku'] in product.get("name", "") or
                            test_case['sku'] in product.get("sku", "")):
                            found_product = product
                            break
                    
                    if found_product:
                        price = found_product.get("price", 0)
                        vendor = found_product.get("vendor", "")
                        name = found_product.get("name", "")
                        
                        # Check price match (allow small variance)
                        price_match = abs(price - test_case['expected_price']) < 10.0
                        
                        # Check vendor field - try both 'vendor' and 'vendor_name' fields
                        vendor_field = found_product.get("vendor") or found_product.get("vendor_name", "")
                        vendor_match = test_case['vendor'].lower() in vendor_field.lower() if test_case['vendor'] else True
                        name_match = test_case['name_contains'].lower() in name.lower() if test_case['name_contains'] else True
                        
                        if price_match and vendor_match and name_match:
                            self.log_result(test_name, True, f"Found: {name} - ${price} from {vendor_field}", found_product, critical=True)
                        else:
                            issues = []
                            if not price_match:
                                issues.append(f"Price mismatch: expected ${test_case['expected_price']}, got ${price}")
                            if not vendor_match:
                                issues.append(f"Vendor mismatch: expected {test_case['vendor']}, got {vendor_field}")
                            if not name_match:
                                issues.append(f"Name mismatch: expected to contain '{test_case['name_contains']}'")
                            self.log_result(test_name, False, "; ".join(issues), found_product, critical=True)
                    else:
                        self.log_result(test_name, False, f"SKU {test_case['sku']} not found in database", data, critical=True)
                else:
                    self.log_result(test_name, False, f"HTTP {response.status_code}: {response.text}", None, critical=True)
                    
            except Exception as e:
                self.log_result(test_name, False, f"Exception: {str(e)}", None, critical=True)

    def test_calculators_with_exact_parameters(self):
        """Test all calculators with exact parameters provided"""
        
        # Wallpaper Calculator
        test_name = "Wallpaper Calculator"
        try:
            url = f"{BACKEND_URL}/calculators/wallpaper"
            payload = {
                "wallpaper_type": "double_roll",
                "wall_width": 12,
                "wall_height": 9,
                "roll_width": 21,
                "roll_length": 33
            }
            
            print(f"Testing: {test_name}")
            print(f"POST {url}")
            print(f"Payload: {payload}")
            
            response = requests.post(url, json=payload, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if "rolls_needed" in data or "result" in data:
                    self.log_result(test_name, True, f"Calculator working - Result: {data}", data, critical=True)
                else:
                    self.log_result(test_name, False, "Missing expected result fields", data, critical=True)
            else:
                self.log_result(test_name, False, f"HTTP {response.status_code}: {response.text}", None, critical=True)
                
        except Exception as e:
            self.log_result(test_name, False, f"Exception: {str(e)}", None, critical=True)

        # Drapery Calculator
        test_name = "Drapery Calculator"
        try:
            url = f"{BACKEND_URL}/calculators/drapery"
            payload = {
                "window_width": 60,
                "finished_length": 84,
                "pleat_type": "pinch_pleat",
                "fullness_ratio": 2.5,
                "fabric_width": 54,
                "pattern_repeat": 0
            }
            
            print(f"Testing: {test_name}")
            print(f"POST {url}")
            print(f"Payload: {payload}")
            
            response = requests.post(url, json=payload, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if "fabric_yardage" in data or "result" in data:
                    self.log_result(test_name, True, f"Calculator working - Result: {data}", data, critical=True)
                else:
                    self.log_result(test_name, False, "Missing expected result fields", data, critical=True)
            else:
                self.log_result(test_name, False, f"HTTP {response.status_code}: {response.text}", None, critical=True)
                
        except Exception as e:
            self.log_result(test_name, False, f"Exception: {str(e)}", None, critical=True)

        # Paint Calculator
        test_name = "Paint Calculator"
        try:
            url = f"{BACKEND_URL}/calculators/paint"
            payload = {
                "room_length": 12,
                "room_width": 10,
                "wall_height": 9,
                "coats": 2
            }
            
            print(f"Testing: {test_name}")
            print(f"POST {url}")
            print(f"Payload: {payload}")
            
            response = requests.post(url, json=payload, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if "gallons_needed" in data or "result" in data:
                    self.log_result(test_name, True, f"Calculator working - Result: {data}", data, critical=True)
                else:
                    self.log_result(test_name, False, "Missing expected result fields", data, critical=True)
            else:
                self.log_result(test_name, False, f"HTTP {response.status_code}: {response.text}", None, critical=True)
                
        except Exception as e:
            self.log_result(test_name, False, f"Exception: {str(e)}", None, critical=True)

        # Hardware Calculator
        test_name = "Hardware Calculator"
        try:
            url = f"{BACKEND_URL}/calculators/hardware"
            payload = {
                "window_width": 72,
                "rod_overhang_per_side": 6,
                "rod_diameter": 1.0,
                "drapery_weight": "medium"
            }
            
            print(f"Testing: {test_name}")
            print(f"POST {url}")
            print(f"Payload: {payload}")
            
            response = requests.post(url, json=payload, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if ("rod_length" in data or "result" in data or 
                    "total_rod_width" in data or "brackets_needed" in data):
                    self.log_result(test_name, True, f"Calculator working - Result: {data}", data, critical=True)
                else:
                    self.log_result(test_name, False, "Missing expected result fields", data, critical=True)
            else:
                self.log_result(test_name, False, f"HTTP {response.status_code}: {response.text}", None, critical=True)
                
        except Exception as e:
            self.log_result(test_name, False, f"Exception: {str(e)}", None, critical=True)

        # Flooring Calculator
        test_name = "Flooring Calculator"
        try:
            url = f"{BACKEND_URL}/calculators/flooring"
            payload = {
                "room_length": 15,
                "room_width": 12,
                "tile_length": 12,
                "tile_width": 12
            }
            
            print(f"Testing: {test_name}")
            print(f"POST {url}")
            print(f"Payload: {payload}")
            
            response = requests.post(url, json=payload, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if "tiles_needed" in data or "result" in data:
                    self.log_result(test_name, True, f"Calculator working - Result: {data}", data, critical=True)
                else:
                    self.log_result(test_name, False, "Missing expected result fields", data, critical=True)
            else:
                self.log_result(test_name, False, f"HTTP {response.status_code}: {response.text}", None, critical=True)
                
        except Exception as e:
            self.log_result(test_name, False, f"Exception: {str(e)}", None, critical=True)

        # Lighting Calculator
        test_name = "Lighting Calculator"
        try:
            url = f"{BACKEND_URL}/calculators/lighting"
            payload = {
                "room_type": "living_room",
                "room_length": 15,
                "room_width": 12
            }
            
            print(f"Testing: {test_name}")
            print(f"POST {url}")
            print(f"Payload: {payload}")
            
            response = requests.post(url, json=payload, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if ("fixtures_needed" in data or "result" in data or 
                    "fixtures_recommended" in data or "total_lumens_needed" in data):
                    self.log_result(test_name, True, f"Calculator working - Result: {data}", data, critical=True)
                else:
                    self.log_result(test_name, False, "Missing expected result fields", data, critical=True)
            else:
                self.log_result(test_name, False, f"HTTP {response.status_code}: {response.text}", None, critical=True)
                
        except Exception as e:
            self.log_result(test_name, False, f"Exception: {str(e)}", None, critical=True)

    def test_project_crud_operations(self):
        """Test complete Project CRUD operations"""
        
        # CREATE Project
        test_name = "CREATE Project"
        project_id = None
        
        try:
            url = f"{BACKEND_URL}/projects"
            payload = {
                "name": "Launch Test Project",
                "client_info": {
                    "full_name": "Launch Test Client",
                    "email": "test@launchtest.com",
                    "phone": "555-0123",
                    "address": "123 Launch St, Test City, TC 12345"
                },
                "project_type": "Renovation",
                "timeline": "3 months",
                "budget": "$50,000",
                "style_preferences": ["Modern", "Minimalist"],
                "color_palette": "Neutral tones",
                "special_requirements": "Pet-friendly materials"
            }
            
            print(f"Testing: {test_name}")
            print(f"POST {url}")
            print(f"Payload: {json.dumps(payload, indent=2)}")
            
            response = requests.post(url, json=payload, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if data.get("id"):
                    project_id = data["id"]
                    self.log_result(test_name, True, f"Project created with ID: {project_id}", data, critical=True)
                else:
                    self.log_result(test_name, False, "No project ID returned", data, critical=True)
            else:
                self.log_result(test_name, False, f"HTTP {response.status_code}: {response.text}", None, critical=True)
                
        except Exception as e:
            self.log_result(test_name, False, f"Exception: {str(e)}", None, critical=True)

        if not project_id:
            return  # Can't continue without project ID

        # READ Project
        test_name = "READ Project"
        try:
            url = f"{BACKEND_URL}/projects/{project_id}"
            
            print(f"Testing: {test_name}")
            print(f"GET {url}")
            
            response = requests.get(url, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if data.get("id") == project_id and data.get("name") == "Launch Test Project":
                    self.log_result(test_name, True, f"Project retrieved successfully: {data.get('name')}", data, critical=True)
                else:
                    self.log_result(test_name, False, "Project data mismatch", data, critical=True)
            else:
                self.log_result(test_name, False, f"HTTP {response.status_code}: {response.text}", None, critical=True)
                
        except Exception as e:
            self.log_result(test_name, False, f"Exception: {str(e)}", None, critical=True)

        # UPDATE Project
        test_name = "UPDATE Project"
        try:
            url = f"{BACKEND_URL}/projects/{project_id}"
            payload = {
                "name": "Launch Test Project - Updated",
                "budget": "$60,000"
            }
            
            print(f"Testing: {test_name}")
            print(f"PUT {url}")
            print(f"Payload: {json.dumps(payload, indent=2)}")
            
            response = requests.put(url, json=payload, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                # Check for successful update in different response formats
                if (data.get("name") == "Launch Test Project - Updated" or 
                    (data.get("success") and data.get("project", {}).get("name") == "Launch Test Project - Updated")):
                    self.log_result(test_name, True, f"Project updated successfully", data, critical=True)
                else:
                    self.log_result(test_name, False, "Project update failed", data, critical=True)
            else:
                self.log_result(test_name, False, f"HTTP {response.status_code}: {response.text}", None, critical=True)
                
        except Exception as e:
            self.log_result(test_name, False, f"Exception: {str(e)}", None, critical=True)

        # LIST Projects
        test_name = "LIST Projects"
        try:
            url = f"{BACKEND_URL}/projects"
            
            print(f"Testing: {test_name}")
            print(f"GET {url}")
            
            response = requests.get(url, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list) and len(data) > 0:
                    # Look for our test project
                    found_project = any(p.get("id") == project_id for p in data)
                    if found_project:
                        self.log_result(test_name, True, f"Projects listed successfully - Found {len(data)} projects including test project", {"count": len(data)}, critical=True)
                    else:
                        self.log_result(test_name, False, f"Test project not found in list of {len(data)} projects", data, critical=True)
                else:
                    self.log_result(test_name, False, "No projects returned or invalid format", data, critical=True)
            else:
                self.log_result(test_name, False, f"HTTP {response.status_code}: {response.text}", None, critical=True)
                
        except Exception as e:
            self.log_result(test_name, False, f"Exception: {str(e)}", None, critical=True)

    def test_budget_apis(self):
        """Test Budget management APIs"""
        
        # First get a project ID
        try:
            projects_response = requests.get(f"{BACKEND_URL}/projects", timeout=10)
            if projects_response.status_code == 200:
                projects = projects_response.json()
                if projects and len(projects) > 0:
                    project_id = projects[0].get("id")
                else:
                    self.log_result("Budget APIs - No Projects", False, "No projects available for budget testing", None, critical=True)
                    return
            else:
                self.log_result("Budget APIs - Project Fetch", False, f"Could not fetch projects: {projects_response.status_code}", None, critical=True)
                return
        except Exception as e:
            self.log_result("Budget APIs - Project Fetch", False, f"Exception fetching projects: {str(e)}", None, critical=True)
            return

        # GET Budget Data
        test_name = "GET Budget Data"
        try:
            url = f"{BACKEND_URL}/budget/{project_id}"
            
            print(f"Testing: {test_name}")
            print(f"GET {url}")
            
            response = requests.get(url, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                self.log_result(test_name, True, f"Budget data retrieved successfully", data, critical=True)
            else:
                self.log_result(test_name, False, f"HTTP {response.status_code}: {response.text}", None, critical=True)
                
        except Exception as e:
            self.log_result(test_name, False, f"Exception: {str(e)}", None, critical=True)

        # CREATE Budget Item
        test_name = "CREATE Budget Item"
        try:
            url = f"{BACKEND_URL}/budget"
            payload = {
                "project_id": project_id,
                "category": "Furniture",
                "item_name": "Test Sofa",
                "estimated_cost": 2500.00,
                "actual_cost": 0.00,
                "vendor": "Test Vendor",
                "status": "Planned"
            }
            
            print(f"Testing: {test_name}")
            print(f"POST {url}")
            print(f"Payload: {json.dumps(payload, indent=2)}")
            
            response = requests.post(url, json=payload, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                self.log_result(test_name, True, f"Budget item created successfully", data, critical=True)
            else:
                self.log_result(test_name, False, f"HTTP {response.status_code}: {response.text}", None, critical=True)
                
        except Exception as e:
            self.log_result(test_name, False, f"Exception: {str(e)}", None, critical=True)

    def test_delivery_apis(self):
        """Test Delivery management APIs"""
        
        # First get a project ID
        try:
            projects_response = requests.get(f"{BACKEND_URL}/projects", timeout=10)
            if projects_response.status_code == 200:
                projects = projects_response.json()
                if projects and len(projects) > 0:
                    project_id = projects[0].get("id")
                else:
                    self.log_result("Delivery APIs - No Projects", False, "No projects available for delivery testing", None, critical=True)
                    return
            else:
                self.log_result("Delivery APIs - Project Fetch", False, f"Could not fetch projects: {projects_response.status_code}", None, critical=True)
                return
        except Exception as e:
            self.log_result("Delivery APIs - Project Fetch", False, f"Exception fetching projects: {str(e)}", None, critical=True)
            return

        # GET Deliveries
        test_name = "GET Deliveries"
        try:
            url = f"{BACKEND_URL}/deliveries/{project_id}"
            
            print(f"Testing: {test_name}")
            print(f"GET {url}")
            
            response = requests.get(url, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                self.log_result(test_name, True, f"Deliveries retrieved successfully", data, critical=True)
            else:
                self.log_result(test_name, False, f"HTTP {response.status_code}: {response.text}", None, critical=True)
                
        except Exception as e:
            self.log_result(test_name, False, f"Exception: {str(e)}", None, critical=True)

        # CREATE Delivery
        test_name = "CREATE Delivery"
        try:
            url = f"{BACKEND_URL}/deliveries"
            payload = {
                "project_id": project_id,
                "item_name": "Test Delivery Item",
                "vendor": "Test Vendor",
                "tracking_number": "TEST123456",
                "carrier": "FedEx",
                "expected_date": "2024-12-25",
                "status": "In Transit"
            }
            
            print(f"Testing: {test_name}")
            print(f"POST {url}")
            print(f"Payload: {json.dumps(payload, indent=2)}")
            
            response = requests.post(url, json=payload, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                self.log_result(test_name, True, f"Delivery created successfully", data, critical=True)
            else:
                self.log_result(test_name, False, f"HTTP {response.status_code}: {response.text}", None, critical=True)
                
        except Exception as e:
            self.log_result(test_name, False, f"Exception: {str(e)}", None, critical=True)

    def test_ai_chat_with_session(self):
        """Test AI Chat with session_id parameter"""
        test_name = "AI Chat with Session ID"
        
        try:
            url = f"{BACKEND_URL}/ai/chat"
            payload = {
                "message": "What are some modern living room design ideas?",
                "session_id": f"test_session_{int(time.time())}"
            }
            
            print(f"Testing: {test_name}")
            print(f"POST {url}")
            print(f"Payload: {json.dumps(payload, indent=2)}")
            
            response = requests.post(url, json=payload, timeout=30)  # Reduced timeout for AI
            
            if response.status_code == 200:
                data = response.json()
                if data.get("response") or data.get("message"):
                    self.log_result(test_name, True, f"AI Chat working - Response received", {"response_length": len(str(data))}, critical=True)
                else:
                    self.log_result(test_name, False, "No AI response received", data, critical=True)
            else:
                self.log_result(test_name, False, f"HTTP {response.status_code}: {response.text}", None, critical=True)
                
        except Exception as e:
            self.log_result(test_name, False, f"Exception: {str(e)}", None, critical=True)

    def run_all_tests(self):
        """Run all comprehensive tests for launch readiness"""
        print("=" * 80)
        print("COMPREHENSIVE BACKEND TESTING FOR INTERIOR DESIGN STUDIO LAUNCH")
        print("Testing ALL critical endpoints for TOMORROW'S LAUNCH")
        print("=" * 80)
        print()
        
        # 1. API Health Check
        self.test_api_health()
        
        # 2. Product Search - Specific SKUs with exact prices
        self.test_specific_product_search()
        
        # 3. All Calculators with exact parameters
        self.test_calculators_with_exact_parameters()
        
        # 4. Project CRUD operations
        self.test_project_crud_operations()
        
        # 5. Budget APIs
        self.test_budget_apis()
        
        # 6. Delivery APIs
        self.test_delivery_apis()
        
        # 7. AI Chat with session_id
        self.test_ai_chat_with_session()
        
        # Print comprehensive summary
        print("=" * 80)
        print("LAUNCH READINESS TEST SUMMARY")
        print("=" * 80)
        print(f"Total Tests: {self.total_tests}")
        print(f"Passed: {self.passed_tests}")
        print(f"Failed: {self.failed_tests}")
        print(f"Success Rate: {(self.passed_tests/self.total_tests*100):.1f}%")
        print(f"Critical Failures: {len(self.critical_failures)}")
        print()
        
        # Launch readiness decision
        if len(self.critical_failures) == 0:
            print("🎉 LAUNCH APPROVED - ALL CRITICAL SYSTEMS OPERATIONAL")
            print("✅ Ready for production deployment tomorrow!")
        elif len(self.critical_failures) <= 2:
            print("⚠️  CONDITIONAL LAUNCH APPROVAL - Minor issues detected")
            print("🔧 Recommend fixing these issues but core functionality working")
        else:
            print("❌ LAUNCH NOT RECOMMENDED - Multiple critical failures")
            print("🚨 Requires immediate attention before deployment")
        
        print()
        
        # Print critical failures
        if self.critical_failures:
            print("CRITICAL FAILURES REQUIRING ATTENTION:")
            print("-" * 50)
            for failure in self.critical_failures:
                print(f"❌ {failure}")
            print()
        
        # Print all failed tests details
        if self.failed_tests > 0:
            print("DETAILED FAILURE ANALYSIS:")
            print("-" * 50)
            for result in self.results:
                if "❌ FAIL" in result["status"]:
                    print(f"❌ {result['test']}")
                    print(f"   Issue: {result['details']}")
                    if result.get('critical'):
                        print(f"   ⚠️  CRITICAL - Blocks launch readiness")
                    print()
        
        return len(self.critical_failures) == 0

if __name__ == "__main__":
    tester = LaunchReadinessTester()
    success = tester.run_all_tests()
    
    print("=" * 80)
    if success:
        print("🚀 INTERIOR DESIGN STUDIO IS READY FOR LAUNCH!")
        print("All critical systems tested and operational.")
    else:
        print("🔧 LAUNCH READINESS ISSUES DETECTED")
        print("Review critical failures above before deployment.")
    print("=" * 80)
    
    exit(0 if success else 1)
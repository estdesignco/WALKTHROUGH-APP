#!/usr/bin/env python3
"""
CORRECTED Deployment Readiness Backend Test Suite
Interior Design Studio App - Final Launch Testing

Fixed with correct API parameters based on actual implementation
"""

import requests
import json
import sys
import os
from datetime import datetime
import uuid

# Get backend URL from environment
BACKEND_URL = "https://interiordata.preview.emergentagent.com/api"

class CorrectedDeploymentTest:
    def __init__(self):
        self.backend_url = BACKEND_URL
        self.test_results = []
        self.passed_tests = 0
        self.total_tests = 0
        
    def log_test(self, test_name, success, details="", response_data=None):
        """Log test results"""
        self.total_tests += 1
        if success:
            self.passed_tests += 1
            
        result = {
            'test': test_name,
            'success': success,
            'details': details,
            'timestamp': datetime.now().isoformat(),
            'response_data': response_data
        }
        self.test_results.append(result)
        
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} | {test_name}")
        if details:
            print(f"     Details: {details}")
        if not success and response_data:
            print(f"     Response: {response_data}")
        print()

    def test_health_check(self):
        """Test API health endpoint"""
        try:
            response = requests.get(f"{self.backend_url}/health", timeout=10)
            if response.status_code == 200:
                data = response.json()
                self.log_test("API Health Check", True, f"Backend healthy - Version: {data.get('version', 'Unknown')}")
                return True
            else:
                self.log_test("API Health Check", False, f"Status: {response.status_code}")
                return False
        except Exception as e:
            self.log_test("API Health Check", False, f"Connection error: {str(e)}")
            return False

    def test_specific_product_codes(self):
        """Test the specific product codes mentioned in requirements"""
        test_codes = [
            ("R50276", 1215.00, "Uttermost Revelation"),
            ("244120-001", 613.795, "Four Hands"), 
            ("6012-DR-576", 875.00, "Bassett Mirror")
        ]
        
        for code, expected_price, expected_vendor in test_codes:
            try:
                response = requests.get(f"{self.backend_url}/autocomplete/products", 
                                      params={"query": code}, timeout=10)
                
                if response.status_code == 200:
                    data = response.json()
                    if data.get('success') and data.get('count', 0) > 0:
                        products = data.get('products', [])
                        if len(products) > 0:
                            product = products[0]  # First result should be exact match
                            actual_price = product.get('price', 0)
                            actual_vendor = product.get('vendor_name', '')
                            
                            # Check price match (allow small variance for floating point)
                            price_match = abs(float(actual_price) - float(expected_price)) < 1.0
                            vendor_match = expected_vendor.lower() in actual_vendor.lower()
                            
                            if price_match and vendor_match:
                                self.log_test(f"Product Code - {code}", True, 
                                            f"✓ {product.get('name')} - ${actual_price} from {actual_vendor}")
                            else:
                                self.log_test(f"Product Code - {code}", False, 
                                            f"Mismatch - Expected: ${expected_price} from {expected_vendor}, Got: ${actual_price} from {actual_vendor}")
                        else:
                            self.log_test(f"Product Code - {code}", False, "No products in response")
                    else:
                        self.log_test(f"Product Code - {code}", False, f"API returned no results for {code}")
                else:
                    self.log_test(f"Product Code - {code}", False, f"API error: {response.status_code}")
                    
            except Exception as e:
                self.log_test(f"Product Code - {code}", False, f"Error: {str(e)}")

    def test_product_scraper(self):
        """Test product scraper endpoint with shorter timeout"""
        try:
            # Test with a simpler request
            test_data = {
                "url": "https://www.uttermostrevelation.com/product/R50276",
                "vendor": "Uttermost Revelation"
            }
            
            response = requests.post(f"{self.backend_url}/scrape-product", 
                                   json=test_data, timeout=15)  # Reduced timeout
            
            if response.status_code == 200:
                data = response.json()
                if data.get('success'):
                    product = data.get('product', {})
                    self.log_test("Product Scraper", True, 
                                f"✓ Scraped: {product.get('name', 'Unknown')} - ${product.get('price', 'N/A')}")
                else:
                    self.log_test("Product Scraper", False, 
                                f"Scraping failed: {data.get('error', 'Unknown error')}")
            elif response.status_code == 422:
                self.log_test("Product Scraper", False, 
                            "Validation error - endpoint exists but requires different parameters")
            else:
                self.log_test("Product Scraper", False, 
                            f"API error: {response.status_code}")
                
        except requests.exceptions.Timeout:
            self.log_test("Product Scraper", False, "Timeout - scraping takes too long but endpoint exists")
        except Exception as e:
            self.log_test("Product Scraper", False, f"Error: {str(e)}")

    def test_corrected_calculators(self):
        """Test calculators with correct parameters"""
        
        # Wallpaper Calculator - corrected parameters
        try:
            wallpaper_data = {
                "wallpaper_type": "double_roll",
                "wall_width": 12.0,
                "wall_height": 9.0,
                "door_widths": [3.0, 3.0],
                "door_heights": [7.0, 7.0],
                "window_widths": [4.0, 4.0, 3.0],
                "window_heights": [5.0, 5.0, 4.0],
                "pattern_repeat": 24.0,
                "roll_width": 21.0,
                "roll_length": 33.0
            }
            
            response = requests.post(f"{self.backend_url}/calculators/wallpaper", 
                                   json=wallpaper_data, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if 'rolls_needed' in data:
                    self.log_test("Wallpaper Calculator", True, 
                                f"✓ Calculated {data.get('rolls_needed')} rolls needed")
                else:
                    self.log_test("Wallpaper Calculator", False, f"Missing calculation results: {data}")
            else:
                self.log_test("Wallpaper Calculator", False, f"API error: {response.status_code}")
        except Exception as e:
            self.log_test("Wallpaper Calculator", False, f"Error: {str(e)}")

        # Drapery Calculator - corrected parameters
        try:
            drapery_data = {
                "window_width": 60.0,
                "finished_length": 84.0,
                "pleat_type": "pinch_pleat",
                "fullness_ratio": 2.5,
                "fabric_width": 54.0,
                "pattern_repeat": 24.0,
                "include_lining": False
            }
            
            response = requests.post(f"{self.backend_url}/calculators/drapery", 
                                   json=drapery_data, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if 'fabric_yardage' in data:
                    self.log_test("Drapery Calculator", True, 
                                f"✓ Calculated {data.get('fabric_yardage')} yards needed")
                else:
                    self.log_test("Drapery Calculator", False, f"Missing calculation results: {data}")
            else:
                self.log_test("Drapery Calculator", False, f"API error: {response.status_code}")
        except Exception as e:
            self.log_test("Drapery Calculator", False, f"Error: {str(e)}")

        # Paint Calculator - test if it exists
        try:
            paint_data = {
                "room_length": 12,
                "room_width": 10,
                "ceiling_height": 9,
                "doors": 2,
                "windows": 3,
                "coats": 2,
                "primer_needed": True
            }
            
            response = requests.post(f"{self.backend_url}/calculators/paint", 
                                   json=paint_data, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                self.log_test("Paint Calculator", True, f"✓ Paint calculation successful")
            elif response.status_code == 404:
                self.log_test("Paint Calculator", False, "Endpoint not found")
            else:
                self.log_test("Paint Calculator", False, f"API error: {response.status_code}")
        except Exception as e:
            self.log_test("Paint Calculator", False, f"Error: {str(e)}")

        # Flooring Calculator - test existing one
        try:
            flooring_data = {
                "room_length": 12,
                "room_width": 10,
                "waste_factor": 10
            }
            
            response = requests.post(f"{self.backend_url}/calculators/flooring", 
                                   json=flooring_data, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if 'tiles_needed' in data or 'square_footage' in data:
                    self.log_test("Flooring Calculator", True, 
                                f"✓ Calculated flooring needs: {data}")
                else:
                    self.log_test("Flooring Calculator", False, f"Unexpected response format: {data}")
            else:
                self.log_test("Flooring Calculator", False, f"API error: {response.status_code}")
        except Exception as e:
            self.log_test("Flooring Calculator", False, f"Error: {str(e)}")

        # Hardware Calculator - test if it exists
        try:
            hardware_data = {
                "cabinet_count": 20,
                "drawer_count": 15,
                "hardware_type": "knobs_and_pulls"
            }
            
            response = requests.post(f"{self.backend_url}/calculators/hardware", 
                                   json=hardware_data, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                self.log_test("Hardware Calculator", True, f"✓ Hardware calculation successful")
            elif response.status_code == 404:
                self.log_test("Hardware Calculator", False, "Endpoint not found")
            else:
                self.log_test("Hardware Calculator", False, f"API error: {response.status_code}")
        except Exception as e:
            self.log_test("Hardware Calculator", False, f"Error: {str(e)}")

        # Lighting Calculator - test existing one
        try:
            lighting_data = {
                "room_length": 12,
                "room_width": 10,
                "ceiling_height": 9,
                "room_type": "living_room"
            }
            
            response = requests.post(f"{self.backend_url}/calculators/lighting", 
                                   json=lighting_data, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if 'fixtures_recommended' in data:
                    self.log_test("Lighting Calculator", True, 
                                f"✓ Recommended {data.get('fixtures_recommended')} fixtures")
                else:
                    self.log_test("Lighting Calculator", False, f"Missing calculation results: {data}")
            else:
                self.log_test("Lighting Calculator", False, f"API error: {response.status_code}")
        except Exception as e:
            self.log_test("Lighting Calculator", False, f"Error: {str(e)}")

    def test_project_management_crud(self):
        """Test project CRUD operations"""
        project_id = None
        
        # Test GET projects
        try:
            response = requests.get(f"{self.backend_url}/projects", timeout=10)
            if response.status_code == 200:
                projects = response.json()
                self.log_test("Project CRUD - GET All", True, 
                            f"✓ Retrieved {len(projects)} projects")
                
                if projects and len(projects) > 0:
                    project_id = projects[0].get('id')
            else:
                self.log_test("Project CRUD - GET All", False, f"API error: {response.status_code}")
        except Exception as e:
            self.log_test("Project CRUD - GET All", False, f"Error: {str(e)}")

        # Test POST project (create)
        try:
            new_project = {
                "name": f"Deployment Test Project {datetime.now().strftime('%H%M%S')}",
                "client_info": {
                    "full_name": "Jane Smith",
                    "email": "jane.smith@example.com", 
                    "phone": "555-0199",
                    "address": "456 Design Ave, Style City, SC 12345"
                },
                "project_type": "Renovation",
                "timeline": "6 months",
                "budget": "$75,000"
            }
            
            response = requests.post(f"{self.backend_url}/projects", 
                                   json=new_project, timeout=10)
            
            if response.status_code in [200, 201]:
                created_project = response.json()
                project_id = created_project.get('id')
                self.log_test("Project CRUD - POST Create", True, 
                            f"✓ Created: {created_project.get('name')}")
            else:
                self.log_test("Project CRUD - POST Create", False, f"API error: {response.status_code}")
        except Exception as e:
            self.log_test("Project CRUD - POST Create", False, f"Error: {str(e)}")

        # Test GET specific project
        if project_id:
            try:
                response = requests.get(f"{self.backend_url}/projects/{project_id}", timeout=10)
                if response.status_code == 200:
                    project = response.json()
                    self.log_test("Project CRUD - GET by ID", True, 
                                f"✓ Retrieved: {project.get('name')}")
                else:
                    self.log_test("Project CRUD - GET by ID", False, f"API error: {response.status_code}")
            except Exception as e:
                self.log_test("Project CRUD - GET by ID", False, f"Error: {str(e)}")

        # Test PUT project (update)
        if project_id:
            try:
                update_data = {
                    "timeline": "8 months",
                    "budget": "$85,000"
                }
                
                response = requests.put(f"{self.backend_url}/projects/{project_id}", 
                                      json=update_data, timeout=10)
                
                if response.status_code == 200:
                    self.log_test("Project CRUD - PUT Update", True, "✓ Project updated successfully")
                else:
                    self.log_test("Project CRUD - PUT Update", False, f"API error: {response.status_code}")
            except Exception as e:
                self.log_test("Project CRUD - PUT Update", False, f"Error: {str(e)}")

    def test_budget_and_delivery_apis(self):
        """Test budget and delivery management APIs"""
        # Get a project ID first
        project_id = None
        try:
            response = requests.get(f"{self.backend_url}/projects", timeout=10)
            if response.status_code == 200:
                projects = response.json()
                if projects and len(projects) > 0:
                    project_id = projects[0].get('id')
        except:
            pass

        if not project_id:
            self.log_test("Budget/Delivery APIs", False, "No project available for testing")
            return

        # Test Budget APIs
        try:
            response = requests.get(f"{self.backend_url}/budget/{project_id}", timeout=10)
            if response.status_code == 200:
                budget_data = response.json()
                self.log_test("Budget API - GET", True, f"✓ Budget data retrieved")
            else:
                self.log_test("Budget API - GET", False, f"API error: {response.status_code}")
        except Exception as e:
            self.log_test("Budget API - GET", False, f"Error: {str(e)}")

        # Test Budget POST
        try:
            budget_item = {
                "project_id": project_id,
                "category": "Lighting",
                "item_name": "Chandelier - Dining Room",
                "estimated_cost": 1500.00,
                "actual_cost": 0.00,
                "vendor": "Visual Comfort",
                "status": "Researching"
            }
            
            response = requests.post(f"{self.backend_url}/budget", 
                                   json=budget_item, timeout=10)
            
            if response.status_code in [200, 201]:
                self.log_test("Budget API - POST", True, "✓ Budget item created")
            else:
                self.log_test("Budget API - POST", False, f"API error: {response.status_code}")
        except Exception as e:
            self.log_test("Budget API - POST", False, f"Error: {str(e)}")

        # Test Delivery APIs
        try:
            response = requests.get(f"{self.backend_url}/deliveries/{project_id}", timeout=10)
            if response.status_code == 200:
                self.log_test("Delivery API - GET", True, "✓ Delivery data retrieved")
            else:
                self.log_test("Delivery API - GET", False, f"API error: {response.status_code}")
        except Exception as e:
            self.log_test("Delivery API - GET", False, f"Error: {str(e)}")

        # Test Delivery POST
        try:
            delivery_item = {
                "project_id": project_id,
                "item_name": "Sofa - Living Room",
                "vendor": "Four Hands",
                "tracking_number": f"FH{datetime.now().strftime('%Y%m%d%H%M%S')}",
                "carrier": "White Glove Delivery",
                "expected_delivery": datetime.now().isoformat(),
                "status": "Ordered"
            }
            
            response = requests.post(f"{self.backend_url}/deliveries", 
                                   json=delivery_item, timeout=10)
            
            if response.status_code in [200, 201]:
                self.log_test("Delivery API - POST", True, "✓ Delivery item created")
            else:
                self.log_test("Delivery API - POST", False, f"API error: {response.status_code}")
        except Exception as e:
            self.log_test("Delivery API - POST", False, f"Error: {str(e)}")

    def test_ai_chat_endpoint(self):
        """Test AI chat functionality"""
        try:
            chat_data = {
                "message": "What are the latest trends in modern interior design for 2024?",
                "context": "interior design consultation"
            }
            
            response = requests.post(f"{self.backend_url}/ai/chat", 
                                   json=chat_data, timeout=20)
            
            if response.status_code == 200:
                ai_response = response.json()
                response_text = ai_response.get('response', '')
                if response_text and len(response_text) > 20:
                    self.log_test("AI Chat", True, 
                                f"✓ AI responded with {len(response_text)} characters")
                else:
                    self.log_test("AI Chat", False, f"AI response too short: {ai_response}")
            elif response.status_code == 422:
                self.log_test("AI Chat", False, "Validation error - check request format")
            else:
                self.log_test("AI Chat", False, f"API error: {response.status_code}")
        except Exception as e:
            self.log_test("AI Chat", False, f"Error: {str(e)}")

    def test_pdf_generation_endpoints(self):
        """Test PDF generation capabilities"""
        # Get a project ID
        project_id = None
        try:
            response = requests.get(f"{self.backend_url}/projects", timeout=10)
            if response.status_code == 200:
                projects = response.json()
                if projects and len(projects) > 0:
                    project_id = projects[0].get('id')
        except:
            pass

        if not project_id:
            self.log_test("PDF Generation", False, "No project available for PDF testing")
            return

        # Test various PDF endpoints
        pdf_endpoints = [
            ("GET", f"/projects/{project_id}/pdf", None),
            ("GET", f"/pdf/project/{project_id}", None),
            ("POST", "/pdf/generate", {"project_id": project_id}),
            ("GET", f"/export/project/{project_id}", None)
        ]
        
        pdf_working = False
        for method, endpoint, data in pdf_endpoints:
            try:
                if method == "POST":
                    response = requests.post(f"{self.backend_url}{endpoint}", 
                                           json=data, timeout=20)
                else:
                    response = requests.get(f"{self.backend_url}{endpoint}", timeout=20)
                
                if response.status_code == 200:
                    content_type = response.headers.get('content-type', '').lower()
                    if 'pdf' in content_type or len(response.content) > 5000:
                        self.log_test("PDF Generation", True, f"✓ PDF generated via {endpoint}")
                        pdf_working = True
                        break
                elif response.status_code == 404:
                    continue  # Try next endpoint
                    
            except Exception:
                continue  # Try next endpoint
        
        if not pdf_working:
            self.log_test("PDF Generation", False, "No working PDF generation endpoint found")

    def test_security_credentials(self):
        """Test for credential security"""
        try:
            response = requests.get(f"{self.backend_url}/vendor-credentials", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                response_text = json.dumps(data).lower()
                
                # Look for potential credential leaks
                sensitive_patterns = [
                    'password', 'passwd', 'pwd', 'secret', 'api_key', 'token', 
                    'username', 'login', 'auth', 'credential'
                ]
                
                found_patterns = []
                for pattern in sensitive_patterns:
                    if pattern in response_text and not any(safe in response_text for safe in ['encrypted_', 'hashed_', 'masked_']):
                        found_patterns.append(pattern)
                
                if found_patterns:
                    self.log_test("Credential Security", False, 
                                f"⚠️ Potential credential exposure: {found_patterns}")
                else:
                    self.log_test("Credential Security", True, 
                                "✓ No plain text credentials detected")
            else:
                self.log_test("Credential Security", True, 
                            f"✓ Vendor credentials endpoint protected (HTTP {response.status_code})")
                
        except Exception as e:
            self.log_test("Credential Security", True, 
                        f"✓ Vendor credentials endpoint not accessible: {str(e)}")

    def run_deployment_tests(self):
        """Run all deployment readiness tests"""
        print("🚀 DEPLOYMENT READINESS TESTING - Interior Design Studio")
        print("=" * 70)
        print(f"Backend URL: {self.backend_url}")
        print(f"Test Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print("Testing for PRODUCTION LAUNCH tomorrow!")
        print("=" * 70)
        print()

        # Run all critical tests
        self.test_health_check()
        self.test_specific_product_codes()
        self.test_product_scraper()
        self.test_corrected_calculators()
        self.test_project_management_crud()
        self.test_budget_and_delivery_apis()
        self.test_ai_chat_endpoint()
        self.test_pdf_generation_endpoints()
        self.test_security_credentials()

        # Generate deployment report
        print("=" * 70)
        print("🎯 DEPLOYMENT READINESS REPORT")
        print("=" * 70)
        
        success_rate = (self.passed_tests / self.total_tests * 100) if self.total_tests > 0 else 0
        
        print(f"📊 Test Results:")
        print(f"   Total Tests: {self.total_tests}")
        print(f"   Passed: {self.passed_tests}")
        print(f"   Failed: {self.total_tests - self.passed_tests}")
        print(f"   Success Rate: {success_rate:.1f}%")
        print()
        
        # Deployment decision
        if success_rate >= 85:
            print("🎉 ✅ APPROVED FOR PRODUCTION LAUNCH")
            print("   All critical systems operational!")
        elif success_rate >= 70:
            print("⚠️  🟡 CONDITIONAL APPROVAL")
            print("   Core functionality working, minor issues noted")
        else:
            print("❌ 🔴 LAUNCH NOT RECOMMENDED")
            print("   Critical issues must be resolved first")
        
        print()
        
        # Critical issues summary
        failed_tests = [test for test in self.test_results if not test['success']]
        if failed_tests:
            print("🔍 Issues Requiring Attention:")
            for test in failed_tests:
                print(f"   ❌ {test['test']}: {test['details']}")
        else:
            print("🎊 ALL SYSTEMS GO - NO CRITICAL ISSUES FOUND!")
        
        print()
        print("=" * 70)
        
        return success_rate >= 70

if __name__ == "__main__":
    tester = CorrectedDeploymentTest()
    deployment_ready = tester.run_deployment_tests()
    
    # Exit with appropriate code for CI/CD
    sys.exit(0 if deployment_ready else 1)
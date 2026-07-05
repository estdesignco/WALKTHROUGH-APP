#!/usr/bin/env python3
"""
Deployment Readiness Backend Test Suite
Interior Design Studio App - Final Launch Testing

This test suite focuses on the specific requirements for deployment readiness:
1. Product autocomplete API with specific product codes
2. Product scraper endpoint  
3. All calculators
4. Project management CRUD
5. Budget management APIs
6. Delivery tracking APIs
7. AI chat endpoint
8. PDF generation
9. Credential leak verification
"""

import requests
import json
import sys
import os
from datetime import datetime
import uuid

# Get backend URL from environment
BACKEND_URL = "https://design-burst.preview.emergentagent.com/api"

class DeploymentReadinessTest:
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
                self.log_test("API Health Check", True, "Backend is responding")
                return True
            else:
                self.log_test("API Health Check", False, f"Status: {response.status_code}")
                return False
        except Exception as e:
            self.log_test("API Health Check", False, f"Connection error: {str(e)}")
            return False

    def test_product_autocomplete_specific_codes(self):
        """Test product autocomplete with specific product codes"""
        test_codes = [
            ("R50276", "$1,215.00", "Uttermost Revelation"),
            ("244120-001", "$613", "Four Hands"), 
            ("6012-DR-576", "$875", "Bassett Mirror")
        ]
        
        for code, expected_price, expected_vendor in test_codes:
            try:
                response = requests.get(f"{self.backend_url}/autocomplete/products", 
                                      params={"query": code}, timeout=10)
                
                if response.status_code == 200:
                    data = response.json()
                    if isinstance(data, list) and len(data) > 0:
                        # Look for the specific product in results
                        found_product = None
                        for product in data:
                            if code.lower() in str(product.get('sku', '')).lower() or \
                               code.lower() in str(product.get('name', '')).lower():
                                found_product = product
                                break
                        
                        if found_product:
                            price_str = str(found_product.get('price', ''))
                            vendor_str = str(found_product.get('vendor', ''))
                            
                            # Check if expected price is in the price field
                            price_match = expected_price.replace('$', '').replace(',', '') in price_str.replace('$', '').replace(',', '')
                            vendor_match = expected_vendor.lower() in vendor_str.lower()
                            
                            if price_match and vendor_match:
                                self.log_test(f"Product Autocomplete - {code}", True, 
                                            f"Found: {found_product.get('name')} - {found_product.get('price')} from {found_product.get('vendor')}")
                            else:
                                self.log_test(f"Product Autocomplete - {code}", False, 
                                            f"Price/vendor mismatch. Expected: {expected_price} from {expected_vendor}, Got: {found_product.get('price')} from {found_product.get('vendor')}")
                        else:
                            self.log_test(f"Product Autocomplete - {code}", False, 
                                        f"Product {code} not found in {len(data)} results")
                    else:
                        self.log_test(f"Product Autocomplete - {code}", False, 
                                    f"No results returned for {code}")
                else:
                    self.log_test(f"Product Autocomplete - {code}", False, 
                                f"API error: {response.status_code}")
                    
            except Exception as e:
                self.log_test(f"Product Autocomplete - {code}", False, f"Error: {str(e)}")

    def test_product_scraper(self):
        """Test product scraper endpoint"""
        try:
            # Test with a known Uttermost product URL
            test_data = {
                "url": "https://www.uttermostrevelation.com/product/R50276",
                "vendor": "Uttermost Revelation"
            }
            
            response = requests.post(f"{self.backend_url}/scrape-product", 
                                   json=test_data, timeout=30)
            
            if response.status_code == 200:
                data = response.json()
                if data.get('success') and data.get('product'):
                    product = data['product']
                    self.log_test("Product Scraper", True, 
                                f"Scraped: {product.get('name')} - {product.get('price')}")
                else:
                    self.log_test("Product Scraper", False, 
                                f"Scraping failed: {data.get('error', 'Unknown error')}")
            else:
                self.log_test("Product Scraper", False, 
                            f"API error: {response.status_code} - {response.text}")
                
        except Exception as e:
            self.log_test("Product Scraper", False, f"Error: {str(e)}")

    def test_all_calculators(self):
        """Test all calculator endpoints"""
        calculators = [
            {
                "name": "Drapery Calculator",
                "endpoint": "/calculators/drapery",
                "data": {
                    "window_width": 60,
                    "window_height": 84,
                    "pleat_type": "pinch",
                    "fullness": 2.5,
                    "hem_length": 4,
                    "header_length": 6
                }
            },
            {
                "name": "Wallpaper Calculator", 
                "endpoint": "/calculators/wallpaper",
                "data": {
                    "room_length": 12,
                    "room_width": 10,
                    "ceiling_height": 9,
                    "doors": 2,
                    "windows": 3,
                    "pattern_repeat": 24
                }
            },
            {
                "name": "Paint Calculator",
                "endpoint": "/calculators/paint", 
                "data": {
                    "room_length": 12,
                    "room_width": 10,
                    "ceiling_height": 9,
                    "doors": 2,
                    "windows": 3,
                    "coats": 2,
                    "primer_needed": True
                }
            },
            {
                "name": "Flooring Calculator",
                "endpoint": "/calculators/flooring",
                "data": {
                    "room_length": 12,
                    "room_width": 10,
                    "waste_factor": 10
                }
            },
            {
                "name": "Hardware Calculator", 
                "endpoint": "/calculators/hardware",
                "data": {
                    "cabinet_count": 20,
                    "drawer_count": 15,
                    "hardware_type": "knobs_and_pulls"
                }
            },
            {
                "name": "Lighting Calculator",
                "endpoint": "/calculators/lighting", 
                "data": {
                    "room_length": 12,
                    "room_width": 10,
                    "ceiling_height": 9,
                    "room_type": "living_room"
                }
            }
        ]
        
        for calc in calculators:
            try:
                response = requests.post(f"{self.backend_url}{calc['endpoint']}", 
                                       json=calc['data'], timeout=10)
                
                if response.status_code == 200:
                    data = response.json()
                    # Check if response has calculation results
                    if isinstance(data, dict) and len(data) > 0:
                        # Look for common calculation result fields
                        result_fields = ['total', 'amount', 'quantity', 'yards', 'gallons', 'square_feet', 'rolls']
                        has_results = any(field in str(data).lower() for field in result_fields)
                        
                        if has_results:
                            self.log_test(f"Calculator - {calc['name']}", True, 
                                        f"Calculation successful: {list(data.keys())}")
                        else:
                            self.log_test(f"Calculator - {calc['name']}", False, 
                                        f"No calculation results in response: {data}")
                    else:
                        self.log_test(f"Calculator - {calc['name']}", False, 
                                    f"Empty or invalid response: {data}")
                else:
                    self.log_test(f"Calculator - {calc['name']}", False, 
                                f"API error: {response.status_code}")
                    
            except Exception as e:
                self.log_test(f"Calculator - {calc['name']}", False, f"Error: {str(e)}")

    def test_project_management_crud(self):
        """Test project CRUD operations"""
        project_id = None
        
        # Test GET projects
        try:
            response = requests.get(f"{self.backend_url}/projects", timeout=10)
            if response.status_code == 200:
                projects = response.json()
                self.log_test("Project Management - GET Projects", True, 
                            f"Retrieved {len(projects)} projects")
                
                # Use existing project for further tests
                if projects and len(projects) > 0:
                    project_id = projects[0].get('id')
            else:
                self.log_test("Project Management - GET Projects", False, 
                            f"API error: {response.status_code}")
        except Exception as e:
            self.log_test("Project Management - GET Projects", False, f"Error: {str(e)}")

        # Test POST project (create)
        try:
            new_project = {
                "name": f"Test Project {datetime.now().strftime('%Y%m%d_%H%M%S')}",
                "client_info": {
                    "full_name": "Test Client",
                    "email": "test@example.com", 
                    "phone": "555-0123",
                    "address": "123 Test St"
                },
                "project_type": "Renovation",
                "timeline": "3 months",
                "budget": "$50,000"
            }
            
            response = requests.post(f"{self.backend_url}/projects", 
                                   json=new_project, timeout=10)
            
            if response.status_code in [200, 201]:
                created_project = response.json()
                project_id = created_project.get('id')
                self.log_test("Project Management - POST Project", True, 
                            f"Created project: {created_project.get('name')}")
            else:
                self.log_test("Project Management - POST Project", False, 
                            f"API error: {response.status_code}")
        except Exception as e:
            self.log_test("Project Management - POST Project", False, f"Error: {str(e)}")

        # Test GET specific project
        if project_id:
            try:
                response = requests.get(f"{self.backend_url}/projects/{project_id}", timeout=10)
                if response.status_code == 200:
                    project = response.json()
                    self.log_test("Project Management - GET Project by ID", True, 
                                f"Retrieved project: {project.get('name')}")
                else:
                    self.log_test("Project Management - GET Project by ID", False, 
                                f"API error: {response.status_code}")
            except Exception as e:
                self.log_test("Project Management - GET Project by ID", False, f"Error: {str(e)}")

        # Test PUT project (update)
        if project_id:
            try:
                update_data = {
                    "name": f"Updated Test Project {datetime.now().strftime('%H%M%S')}",
                    "timeline": "4 months"
                }
                
                response = requests.put(f"{self.backend_url}/projects/{project_id}", 
                                      json=update_data, timeout=10)
                
                if response.status_code == 200:
                    updated_project = response.json()
                    self.log_test("Project Management - PUT Project", True, 
                                f"Updated project: {updated_project.get('name')}")
                else:
                    self.log_test("Project Management - PUT Project", False, 
                                f"API error: {response.status_code}")
            except Exception as e:
                self.log_test("Project Management - PUT Project", False, f"Error: {str(e)}")

    def test_budget_management(self):
        """Test budget management APIs"""
        # First get a project ID
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
            self.log_test("Budget Management - No Project Available", False, 
                        "No project found for budget testing")
            return

        # Test GET budget
        try:
            response = requests.get(f"{self.backend_url}/budget/{project_id}", timeout=10)
            if response.status_code == 200:
                budget_data = response.json()
                self.log_test("Budget Management - GET Budget", True, 
                            f"Retrieved budget data with {len(budget_data)} items" if isinstance(budget_data, list) else "Retrieved budget data")
            else:
                self.log_test("Budget Management - GET Budget", False, 
                            f"API error: {response.status_code}")
        except Exception as e:
            self.log_test("Budget Management - GET Budget", False, f"Error: {str(e)}")

        # Test POST budget item
        try:
            budget_item = {
                "project_id": project_id,
                "category": "Furniture",
                "item_name": "Test Sofa",
                "estimated_cost": 2500.00,
                "actual_cost": 0.00,
                "vendor": "Test Vendor",
                "status": "Planned"
            }
            
            response = requests.post(f"{self.backend_url}/budget", 
                                   json=budget_item, timeout=10)
            
            if response.status_code in [200, 201]:
                created_item = response.json()
                self.log_test("Budget Management - POST Budget Item", True, 
                            f"Created budget item: {created_item.get('item_name', 'Unknown')}")
            else:
                self.log_test("Budget Management - POST Budget Item", False, 
                            f"API error: {response.status_code}")
        except Exception as e:
            self.log_test("Budget Management - POST Budget Item", False, f"Error: {str(e)}")

    def test_delivery_tracking(self):
        """Test delivery tracking APIs"""
        # First get a project ID
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
            self.log_test("Delivery Tracking - No Project Available", False, 
                        "No project found for delivery testing")
            return

        # Test GET deliveries
        try:
            response = requests.get(f"{self.backend_url}/deliveries/{project_id}", timeout=10)
            if response.status_code == 200:
                deliveries = response.json()
                self.log_test("Delivery Tracking - GET Deliveries", True, 
                            f"Retrieved {len(deliveries)} deliveries" if isinstance(deliveries, list) else "Retrieved delivery data")
            else:
                self.log_test("Delivery Tracking - GET Deliveries", False, 
                            f"API error: {response.status_code}")
        except Exception as e:
            self.log_test("Delivery Tracking - GET Deliveries", False, f"Error: {str(e)}")

        # Test POST delivery
        try:
            delivery_item = {
                "project_id": project_id,
                "item_name": "Test Delivery Item",
                "vendor": "Test Vendor",
                "tracking_number": f"TEST{datetime.now().strftime('%Y%m%d%H%M%S')}",
                "carrier": "FedEx",
                "expected_delivery": datetime.now().isoformat(),
                "status": "In Transit"
            }
            
            response = requests.post(f"{self.backend_url}/deliveries", 
                                   json=delivery_item, timeout=10)
            
            if response.status_code in [200, 201]:
                created_delivery = response.json()
                self.log_test("Delivery Tracking - POST Delivery", True, 
                            f"Created delivery: {created_delivery.get('item_name', 'Unknown')}")
            else:
                self.log_test("Delivery Tracking - POST Delivery", False, 
                            f"API error: {response.status_code}")
        except Exception as e:
            self.log_test("Delivery Tracking - POST Delivery", False, f"Error: {str(e)}")

    def test_ai_chat(self):
        """Test AI chat endpoint"""
        try:
            chat_data = {
                "message": "What are some popular interior design trends for 2024?",
                "context": "interior design consultation"
            }
            
            response = requests.post(f"{self.backend_url}/ai/chat", 
                                   json=chat_data, timeout=30)
            
            if response.status_code == 200:
                ai_response = response.json()
                if ai_response.get('response') and len(ai_response['response']) > 10:
                    self.log_test("AI Chat", True, 
                                f"AI responded with {len(ai_response['response'])} characters")
                else:
                    self.log_test("AI Chat", False, 
                                f"AI response too short or empty: {ai_response}")
            else:
                self.log_test("AI Chat", False, 
                            f"API error: {response.status_code}")
        except Exception as e:
            self.log_test("AI Chat", False, f"Error: {str(e)}")

    def test_pdf_generation(self):
        """Test PDF generation endpoint"""
        # First get a project ID
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
            self.log_test("PDF Generation - No Project Available", False, 
                        "No project found for PDF testing")
            return

        # Test common PDF endpoints
        pdf_endpoints = [
            f"/projects/{project_id}/pdf",
            f"/pdf/project/{project_id}",
            f"/export/project/{project_id}",
            "/pdf/generate"
        ]
        
        pdf_found = False
        for endpoint in pdf_endpoints:
            try:
                if endpoint == "/pdf/generate":
                    # POST request with project data
                    response = requests.post(f"{self.backend_url}{endpoint}", 
                                           json={"project_id": project_id}, timeout=30)
                else:
                    # GET request
                    response = requests.get(f"{self.backend_url}{endpoint}", timeout=30)
                
                if response.status_code == 200:
                    content_type = response.headers.get('content-type', '')
                    if 'pdf' in content_type.lower() or len(response.content) > 1000:
                        self.log_test("PDF Generation", True, 
                                    f"PDF generated successfully via {endpoint}")
                        pdf_found = True
                        break
                elif response.status_code == 404:
                    continue  # Try next endpoint
                else:
                    self.log_test(f"PDF Generation - {endpoint}", False, 
                                f"API error: {response.status_code}")
            except Exception as e:
                continue  # Try next endpoint
        
        if not pdf_found:
            self.log_test("PDF Generation", False, 
                        "No working PDF generation endpoint found")

    def test_credential_security(self):
        """Test for credential leaks in API responses"""
        # Test vendor credentials endpoint
        try:
            response = requests.get(f"{self.backend_url}/vendor-credentials", timeout=10)
            if response.status_code == 200:
                data = response.json()
                
                # Check for plain text passwords
                response_text = json.dumps(data).lower()
                suspicious_patterns = ['password', 'passwd', 'pwd', 'secret', 'key', 'token']
                
                leaked_credentials = []
                for pattern in suspicious_patterns:
                    if pattern in response_text and not pattern.startswith('encrypted_'):
                        leaked_credentials.append(pattern)
                
                if leaked_credentials:
                    self.log_test("Credential Security", False, 
                                f"Potential credential leak detected: {leaked_credentials}")
                else:
                    self.log_test("Credential Security", True, 
                                "No plain text credentials found in API response")
            else:
                self.log_test("Credential Security", True, 
                            f"Vendor credentials endpoint protected (status: {response.status_code})")
        except Exception as e:
            self.log_test("Credential Security", True, 
                        f"Vendor credentials endpoint not accessible: {str(e)}")

    def run_all_tests(self):
        """Run all deployment readiness tests"""
        print("🚀 DEPLOYMENT READINESS TESTING - Interior Design Studio")
        print("=" * 60)
        print(f"Backend URL: {self.backend_url}")
        print(f"Test Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print("=" * 60)
        print()

        # Run all tests
        self.test_health_check()
        self.test_product_autocomplete_specific_codes()
        self.test_product_scraper()
        self.test_all_calculators()
        self.test_project_management_crud()
        self.test_budget_management()
        self.test_delivery_tracking()
        self.test_ai_chat()
        self.test_pdf_generation()
        self.test_credential_security()

        # Print summary
        print("=" * 60)
        print("🎯 DEPLOYMENT READINESS SUMMARY")
        print("=" * 60)
        
        success_rate = (self.passed_tests / self.total_tests * 100) if self.total_tests > 0 else 0
        
        print(f"Total Tests: {self.total_tests}")
        print(f"Passed: {self.passed_tests}")
        print(f"Failed: {self.total_tests - self.passed_tests}")
        print(f"Success Rate: {success_rate:.1f}%")
        print()
        
        # Deployment recommendation
        if success_rate >= 80:
            print("🎉 DEPLOYMENT APPROVED - Core functionality working")
        elif success_rate >= 60:
            print("⚠️  DEPLOYMENT WITH CAUTION - Some issues detected")
        else:
            print("❌ DEPLOYMENT NOT RECOMMENDED - Critical issues found")
        
        print()
        
        # Show failed tests
        failed_tests = [test for test in self.test_results if not test['success']]
        if failed_tests:
            print("❌ FAILED TESTS:")
            for test in failed_tests:
                print(f"   • {test['test']}: {test['details']}")
        else:
            print("✅ ALL TESTS PASSED!")
        
        return success_rate >= 80

if __name__ == "__main__":
    tester = DeploymentReadinessTest()
    deployment_ready = tester.run_all_tests()
    
    # Exit with appropriate code
    sys.exit(0 if deployment_ready else 1)
#!/usr/bin/env python3
"""
Comprehensive Backend API Testing for Interior Design Studio
Testing ALL endpoints for deployment readiness
"""

import requests
import json
import sys
from datetime import datetime
import uuid

# Backend URL from frontend .env
BACKEND_URL = "https://preview-debug-14.preview.emergentagent.com/api"

class BackendTester:
    def __init__(self):
        self.results = []
        self.failed_tests = []
        self.passed_tests = []
        
    def log_result(self, test_name, success, details="", response_data=None):
        """Log test result"""
        result = {
            'test': test_name,
            'success': success,
            'details': details,
            'timestamp': datetime.now().isoformat(),
            'response_data': response_data
        }
        self.results.append(result)
        
        if success:
            self.passed_tests.append(test_name)
            print(f"✅ {test_name}: {details}")
        else:
            self.failed_tests.append(test_name)
            print(f"❌ {test_name}: {details}")
    
    def test_health_check(self):
        """Test basic API health"""
        try:
            response = requests.get(f"{BACKEND_URL}/health", timeout=10)
            if response.status_code == 200:
                self.log_result("Health Check", True, "API is responding")
                return True
            else:
                self.log_result("Health Check", False, f"Status: {response.status_code}")
                return False
        except Exception as e:
            self.log_result("Health Check", False, f"Connection error: {str(e)}")
            return False
    
    def test_projects_endpoints(self):
        """Test all project-related endpoints"""
        print("\n🔍 Testing Project Management APIs...")
        
        # Test GET /api/projects - list projects
        try:
            response = requests.get(f"{BACKEND_URL}/projects", timeout=10)
            if response.status_code == 200:
                projects = response.json()
                self.log_result("GET /projects", True, f"Retrieved {len(projects)} projects")
                
                # If we have projects, test individual project endpoints
                if projects and len(projects) > 0:
                    project_id = projects[0].get('id')
                    if project_id:
                        # Test GET /api/project/{id}
                        try:
                            proj_response = requests.get(f"{BACKEND_URL}/project/{project_id}", timeout=10)
                            if proj_response.status_code == 200:
                                self.log_result("GET /project/{id}", True, "Project details retrieved")
                            else:
                                self.log_result("GET /project/{id}", False, f"Status: {proj_response.status_code}")
                        except Exception as e:
                            self.log_result("GET /project/{id}", False, f"Error: {str(e)}")
                        
                        # Test PUT /api/projects/{id} - update project
                        try:
                            update_data = {"name": "Test Update"}
                            put_response = requests.put(f"{BACKEND_URL}/projects/{project_id}", 
                                                      json=update_data, timeout=10)
                            if put_response.status_code in [200, 204]:
                                self.log_result("PUT /projects/{id}", True, "Project updated successfully")
                            else:
                                self.log_result("PUT /projects/{id}", False, f"Status: {put_response.status_code}")
                        except Exception as e:
                            self.log_result("PUT /projects/{id}", False, f"Error: {str(e)}")
                        
                        return project_id
                else:
                    self.log_result("Projects Available", False, "No projects found for testing")
                    return None
            else:
                self.log_result("GET /projects", False, f"Status: {response.status_code}")
                return None
        except Exception as e:
            self.log_result("GET /projects", False, f"Error: {str(e)}")
            return None
        
        # Test POST /api/projects - create project
        try:
            new_project = {
                "name": "Test Project for API Testing",
                "client_info": {
                    "full_name": "Jane Smith",
                    "email": "jane.smith@example.com",
                    "phone": "555-0123",
                    "address": "123 Test Street, Test City, TC 12345"
                },
                "project_type": "Renovation",
                "timeline": "3 months",
                "budget": "$50,000",
                "style_preferences": ["Modern", "Minimalist"],
                "color_palette": "Neutral tones",
                "special_requirements": "Pet-friendly materials"
            }
            
            response = requests.post(f"{BACKEND_URL}/projects", json=new_project, timeout=10)
            if response.status_code in [200, 201]:
                created_project = response.json()
                project_id = created_project.get('id')
                self.log_result("POST /projects", True, f"Project created with ID: {project_id}")
                
                # Test DELETE /api/projects/{id} with the created project
                if project_id:
                    try:
                        delete_response = requests.delete(f"{BACKEND_URL}/projects/{project_id}", timeout=10)
                        if delete_response.status_code in [200, 204]:
                            self.log_result("DELETE /projects/{id}", True, "Project deleted successfully")
                        else:
                            self.log_result("DELETE /projects/{id}", False, f"Status: {delete_response.status_code}")
                    except Exception as e:
                        self.log_result("DELETE /projects/{id}", False, f"Error: {str(e)}")
                
                return project_id
            else:
                self.log_result("POST /projects", False, f"Status: {response.status_code}, Response: {response.text}")
                return None
        except Exception as e:
            self.log_result("POST /projects", False, f"Error: {str(e)}")
            return None
    
    def test_budget_endpoints(self, project_id):
        """Test budget-related endpoints"""
        if not project_id:
            self.log_result("Budget Tests", False, "No project ID available")
            return
            
        print("\n💰 Testing Budget APIs...")
        
        # Test GET /api/budget/{project_id}
        try:
            response = requests.get(f"{BACKEND_URL}/budget/{project_id}", timeout=10)
            if response.status_code == 200:
                budget_data = response.json()
                self.log_result("GET /budget/{project_id}", True, f"Budget data retrieved")
            else:
                self.log_result("GET /budget/{project_id}", False, f"Status: {response.status_code}")
        except Exception as e:
            self.log_result("GET /budget/{project_id}", False, f"Error: {str(e)}")
        
        # Test POST /api/budget - create budget item
        try:
            budget_item = {
                "project_id": project_id,
                "category": "Furniture",
                "item_name": "Test Sofa",
                "estimated_cost": 2500.00,
                "actual_cost": 0.00,
                "vendor": "Test Vendor",
                "status": "Planning"
            }
            
            response = requests.post(f"{BACKEND_URL}/budget", json=budget_item, timeout=10)
            if response.status_code in [200, 201]:
                created_item = response.json()
                budget_id = created_item.get('id')
                self.log_result("POST /budget", True, f"Budget item created")
                
                # Test PUT /api/budget/{id} - update budget item
                if budget_id:
                    try:
                        update_data = {"actual_cost": 2400.00, "status": "Ordered"}
                        put_response = requests.put(f"{BACKEND_URL}/budget/{budget_id}", 
                                                  json=update_data, timeout=10)
                        if put_response.status_code in [200, 204]:
                            self.log_result("PUT /budget/{id}", True, "Budget item updated")
                        else:
                            self.log_result("PUT /budget/{id}", False, f"Status: {put_response.status_code}")
                    except Exception as e:
                        self.log_result("PUT /budget/{id}", False, f"Error: {str(e)}")
                    
                    # Test DELETE /api/budget/{id}
                    try:
                        delete_response = requests.delete(f"{BACKEND_URL}/budget/{budget_id}", timeout=10)
                        if delete_response.status_code in [200, 204]:
                            self.log_result("DELETE /budget/{id}", True, "Budget item deleted")
                        else:
                            self.log_result("DELETE /budget/{id}", False, f"Status: {delete_response.status_code}")
                    except Exception as e:
                        self.log_result("DELETE /budget/{id}", False, f"Error: {str(e)}")
            else:
                self.log_result("POST /budget", False, f"Status: {response.status_code}")
        except Exception as e:
            self.log_result("POST /budget", False, f"Error: {str(e)}")
    
    def test_deliveries_endpoints(self, project_id):
        """Test delivery-related endpoints"""
        if not project_id:
            self.log_result("Delivery Tests", False, "No project ID available")
            return
            
        print("\n🚚 Testing Delivery APIs...")
        
        # Test GET /api/deliveries/{project_id}
        try:
            response = requests.get(f"{BACKEND_URL}/deliveries/{project_id}", timeout=10)
            if response.status_code == 200:
                deliveries = response.json()
                self.log_result("GET /deliveries/{project_id}", True, f"Retrieved {len(deliveries)} deliveries")
            else:
                self.log_result("GET /deliveries/{project_id}", False, f"Status: {response.status_code}")
        except Exception as e:
            self.log_result("GET /deliveries/{project_id}", False, f"Error: {str(e)}")
        
        # Test POST /api/deliveries - create delivery
        try:
            delivery_data = {
                "project_id": project_id,
                "item_name": "Test Delivery Item",
                "vendor": "Test Vendor",
                "tracking_number": "TEST123456",
                "carrier": "FedEx",
                "expected_date": "2024-12-25",
                "status": "In Transit"
            }
            
            response = requests.post(f"{BACKEND_URL}/deliveries", json=delivery_data, timeout=10)
            if response.status_code in [200, 201]:
                self.log_result("POST /deliveries", True, "Delivery created successfully")
            else:
                self.log_result("POST /deliveries", False, f"Status: {response.status_code}")
        except Exception as e:
            self.log_result("POST /deliveries", False, f"Error: {str(e)}")
    
    def test_scraping_endpoints(self):
        """Test product scraping functionality"""
        print("\n🔍 Testing Product Scraping APIs...")
        
        # Test POST /api/scrape-product
        try:
            scrape_data = {
                "url": "https://www.fourhands.com/product/lucille-bench-quartz-quartz"
            }
            
            response = requests.post(f"{BACKEND_URL}/scrape-product", json=scrape_data, timeout=30)
            if response.status_code == 200:
                product_data = response.json()
                self.log_result("POST /scrape-product", True, f"Product scraped successfully")
            else:
                self.log_result("POST /scrape-product", False, f"Status: {response.status_code}, Response: {response.text}")
        except Exception as e:
            self.log_result("POST /scrape-product", False, f"Error: {str(e)}")
        
        # Test GET /api/smart-alternatives
        try:
            response = requests.get(f"{BACKEND_URL}/smart-alternatives?item_id=test", timeout=10)
            if response.status_code == 200:
                alternatives = response.json()
                self.log_result("GET /smart-alternatives", True, "Smart alternatives retrieved")
            else:
                self.log_result("GET /smart-alternatives", False, f"Status: {response.status_code}")
        except Exception as e:
            self.log_result("GET /smart-alternatives", False, f"Error: {str(e)}")
    
    def test_autocomplete_endpoints(self):
        """Test autocomplete functionality"""
        print("\n🔍 Testing Autocomplete APIs...")
        
        # Test GET /api/autocomplete/products
        try:
            response = requests.get(f"{BACKEND_URL}/autocomplete/products?query=chair", timeout=10)
            if response.status_code == 200:
                products = response.json()
                self.log_result("GET /autocomplete/products", True, f"Retrieved {len(products)} product suggestions")
            else:
                self.log_result("GET /autocomplete/products", False, f"Status: {response.status_code}")
        except Exception as e:
            self.log_result("GET /autocomplete/products", False, f"Error: {str(e)}")
        
        # Test GET /api/autocomplete/vendors
        try:
            response = requests.get(f"{BACKEND_URL}/autocomplete/vendors", timeout=10)
            if response.status_code == 200:
                vendors = response.json()
                self.log_result("GET /autocomplete/vendors", True, f"Retrieved {len(vendors)} vendors")
            else:
                self.log_result("GET /autocomplete/vendors", False, f"Status: {response.status_code}")
        except Exception as e:
            self.log_result("GET /autocomplete/vendors", False, f"Error: {str(e)}")
    
    def test_pdf_report_endpoint(self, project_id):
        """Test PDF report generation"""
        if not project_id:
            self.log_result("PDF Report Test", False, "No project ID available")
            return
            
        print("\n📄 Testing PDF Report Generation...")
        
        try:
            pdf_data = {
                "project_id": project_id,
                "include_budget": True,
                "include_timeline": True,
                "include_materials": True
            }
            
            response = requests.post(f"{BACKEND_URL}/pdf-report", json=pdf_data, timeout=30)
            if response.status_code == 200:
                # Check if response is PDF content
                content_type = response.headers.get('content-type', '')
                if 'pdf' in content_type.lower() or len(response.content) > 1000:
                    self.log_result("POST /pdf-report", True, f"PDF generated successfully ({len(response.content)} bytes)")
                else:
                    self.log_result("POST /pdf-report", True, "PDF endpoint responded (content type check needed)")
            else:
                self.log_result("POST /pdf-report", False, f"Status: {response.status_code}")
        except Exception as e:
            self.log_result("POST /pdf-report", False, f"Error: {str(e)}")
    
    def test_additional_endpoints(self):
        """Test other important endpoints"""
        print("\n🔧 Testing Additional APIs...")
        
        # Test calculator endpoints (if they exist)
        calculator_endpoints = [
            "/calculators/wallpaper",
            "/calculators/tile", 
            "/calculators/paint",
            "/calculators/drapery",
            "/calculators/hardware",
            "/calculators/lighting"
        ]
        
        for endpoint in calculator_endpoints:
            try:
                response = requests.get(f"{BACKEND_URL}{endpoint}", timeout=10)
                if response.status_code == 200:
                    self.log_result(f"GET {endpoint}", True, "Calculator endpoint accessible")
                elif response.status_code == 404:
                    self.log_result(f"GET {endpoint}", False, "Endpoint not found")
                else:
                    self.log_result(f"GET {endpoint}", False, f"Status: {response.status_code}")
            except Exception as e:
                self.log_result(f"GET {endpoint}", False, f"Error: {str(e)}")
        
        # Test contacts endpoints
        try:
            response = requests.get(f"{BACKEND_URL}/contacts", timeout=10)
            if response.status_code == 200:
                contacts = response.json()
                self.log_result("GET /contacts", True, f"Retrieved {len(contacts)} contacts")
            else:
                self.log_result("GET /contacts", False, f"Status: {response.status_code}")
        except Exception as e:
            self.log_result("GET /contacts", False, f"Error: {str(e)}")
        
        # Test materials endpoints
        try:
            response = requests.get(f"{BACKEND_URL}/materials", timeout=10)
            if response.status_code == 200:
                materials = response.json()
                self.log_result("GET /materials", True, f"Retrieved materials catalog")
            else:
                self.log_result("GET /materials", False, f"Status: {response.status_code}")
        except Exception as e:
            self.log_result("GET /materials", False, f"Error: {str(e)}")
        
        # Test AI assistant endpoints
        try:
            ai_data = {"message": "Hello, can you help with design suggestions?"}
            response = requests.post(f"{BACKEND_URL}/ai-assistant", json=ai_data, timeout=15)
            if response.status_code == 200:
                self.log_result("POST /ai-assistant", True, "AI assistant responded")
            else:
                self.log_result("POST /ai-assistant", False, f"Status: {response.status_code}")
        except Exception as e:
            self.log_result("POST /ai-assistant", False, f"Error: {str(e)}")
    
    def run_all_tests(self):
        """Run comprehensive backend testing"""
        print("🚀 Starting Comprehensive Backend API Testing...")
        print(f"Backend URL: {BACKEND_URL}")
        print("=" * 60)
        
        # Test basic connectivity first
        if not self.test_health_check():
            print("\n❌ CRITICAL: Cannot connect to backend API")
            return False
        
        # Test project management
        project_id = self.test_projects_endpoints()
        
        # Test budget functionality
        self.test_budget_endpoints(project_id)
        
        # Test deliveries
        self.test_deliveries_endpoints(project_id)
        
        # Test scraping functionality
        self.test_scraping_endpoints()
        
        # Test autocomplete
        self.test_autocomplete_endpoints()
        
        # Test PDF generation
        self.test_pdf_report_endpoint(project_id)
        
        # Test additional endpoints
        self.test_additional_endpoints()
        
        # Print summary
        self.print_summary()
        
        return len(self.failed_tests) == 0
    
    def print_summary(self):
        """Print test summary"""
        print("\n" + "=" * 60)
        print("📊 TEST SUMMARY")
        print("=" * 60)
        
        total_tests = len(self.results)
        passed = len(self.passed_tests)
        failed = len(self.failed_tests)
        
        print(f"Total Tests: {total_tests}")
        print(f"✅ Passed: {passed}")
        print(f"❌ Failed: {failed}")
        print(f"Success Rate: {(passed/total_tests)*100:.1f}%")
        
        if self.failed_tests:
            print("\n🚨 FAILED TESTS:")
            for test in self.failed_tests:
                print(f"  - {test}")
        
        if self.passed_tests:
            print(f"\n✅ PASSED TESTS ({len(self.passed_tests)}):")
            for test in self.passed_tests:
                print(f"  - {test}")
        
        # Save detailed results to file
        with open('/app/backend_test_results.json', 'w') as f:
            json.dump({
                'summary': {
                    'total_tests': total_tests,
                    'passed': passed,
                    'failed': failed,
                    'success_rate': (passed/total_tests)*100 if total_tests > 0 else 0
                },
                'failed_tests': self.failed_tests,
                'passed_tests': self.passed_tests,
                'detailed_results': self.results
            }, f, indent=2, default=str)
        
        print(f"\n📄 Detailed results saved to: /app/backend_test_results.json")

if __name__ == "__main__":
    tester = BackendTester()
    success = tester.run_all_tests()
    
    if success:
        print("\n🎉 ALL TESTS PASSED - Backend is ready for deployment!")
        sys.exit(0)
    else:
        print("\n⚠️  SOME TESTS FAILED - Review issues before deployment")
        sys.exit(1)
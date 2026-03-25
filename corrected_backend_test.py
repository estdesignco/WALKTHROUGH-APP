#!/usr/bin/env python3
"""
Corrected Backend API Testing for Interior Design Studio
Testing with proper endpoint methods and paths
"""

import requests
import json
import sys
from datetime import datetime
import uuid

# Backend URL from frontend .env
BACKEND_URL = "https://finish-schedule.preview.emergentagent.com/api"

class CorrectedBackendTester:
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
        """Test all project-related endpoints with correct paths"""
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
                        # Test GET /api/projects/{id} (correct path)
                        try:
                            proj_response = requests.get(f"{BACKEND_URL}/projects/{project_id}", timeout=10)
                            if proj_response.status_code == 200:
                                self.log_result("GET /projects/{id}", True, "Project details retrieved")
                            else:
                                self.log_result("GET /projects/{id}", False, f"Status: {proj_response.status_code}")
                        except Exception as e:
                            self.log_result("GET /projects/{id}", False, f"Error: {str(e)}")
                        
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
    
    def test_calculator_endpoints(self):
        """Test calculator endpoints with POST methods"""
        print("\n🧮 Testing Calculator APIs...")
        
        # Test Wallpaper Calculator
        try:
            wallpaper_data = {
                "wallpaper_type": "double_roll",
                "wall_width": 12.0,
                "wall_height": 9.0,
                "door_widths": [3.0],
                "door_heights": [7.0],
                "window_widths": [4.0],
                "window_heights": [3.0],
                "pattern_repeat": 24.0,
                "roll_width": 21.0,
                "roll_length": 33.0,
                "cost_per_unit": 150.0
            }
            
            response = requests.post(f"{BACKEND_URL}/calculators/wallpaper", json=wallpaper_data, timeout=10)
            if response.status_code == 200:
                result = response.json()
                self.log_result("POST /calculators/wallpaper", True, f"Wallpaper calculation successful")
            else:
                self.log_result("POST /calculators/wallpaper", False, f"Status: {response.status_code}")
        except Exception as e:
            self.log_result("POST /calculators/wallpaper", False, f"Error: {str(e)}")
        
        # Test Tile Calculator
        try:
            tile_data = {
                "room_length": 12.0,
                "room_width": 10.0,
                "tile_length": 12.0,
                "tile_width": 12.0,
                "grout_width": 0.125,
                "waste_percentage": 10.0,
                "cost_per_sqft": 8.50
            }
            
            response = requests.post(f"{BACKEND_URL}/calculators/tile", json=tile_data, timeout=10)
            if response.status_code == 200:
                result = response.json()
                self.log_result("POST /calculators/tile", True, f"Tile calculation successful")
            else:
                self.log_result("POST /calculators/tile", False, f"Status: {response.status_code}")
        except Exception as e:
            self.log_result("POST /calculators/tile", False, f"Error: {str(e)}")
        
        # Test Paint Calculator
        try:
            paint_data = {
                "room_length": 12.0,
                "room_width": 10.0,
                "room_height": 9.0,
                "door_count": 2,
                "window_count": 3,
                "coats": 2,
                "coverage_per_gallon": 350.0,
                "cost_per_gallon": 65.0
            }
            
            response = requests.post(f"{BACKEND_URL}/calculators/paint", json=paint_data, timeout=10)
            if response.status_code == 200:
                result = response.json()
                self.log_result("POST /calculators/paint", True, f"Paint calculation successful")
            else:
                self.log_result("POST /calculators/paint", False, f"Status: {response.status_code}")
        except Exception as e:
            self.log_result("POST /calculators/paint", False, f"Error: {str(e)}")
    
    def test_scraping_functionality(self):
        """Test product scraping with shorter timeout"""
        print("\n🔍 Testing Product Scraping...")
        
        try:
            scrape_data = {
                "url": "https://www.fourhands.com/product/lucille-bench-quartz-quartz"
            }
            
            # Use shorter timeout since we saw it was timing out
            response = requests.post(f"{BACKEND_URL}/scrape-product", json=scrape_data, timeout=60)
            if response.status_code == 200:
                product_data = response.json()
                self.log_result("POST /scrape-product", True, f"Product scraped successfully")
            else:
                self.log_result("POST /scrape-product", False, f"Status: {response.status_code}")
        except requests.exceptions.Timeout:
            self.log_result("POST /scrape-product", False, "Request timed out (scraping may be slow)")
        except Exception as e:
            self.log_result("POST /scrape-product", False, f"Error: {str(e)}")
    
    def test_ai_assistant(self):
        """Test AI assistant endpoint"""
        print("\n🤖 Testing AI Assistant...")
        
        # Check if ai-assistant endpoint exists
        try:
            ai_data = {"message": "Hello, can you help with design suggestions?"}
            response = requests.post(f"{BACKEND_URL}/ai-assistant", json=ai_data, timeout=15)
            if response.status_code == 200:
                self.log_result("POST /ai-assistant", True, "AI assistant responded")
            elif response.status_code == 404:
                # Check alternative AI endpoints
                try:
                    response = requests.post(f"{BACKEND_URL}/ai/chat", json=ai_data, timeout=15)
                    if response.status_code == 200:
                        self.log_result("POST /ai/chat", True, "AI chat endpoint working")
                    else:
                        self.log_result("AI Assistant", False, "No working AI endpoint found")
                except:
                    self.log_result("AI Assistant", False, "No working AI endpoint found")
            else:
                self.log_result("POST /ai-assistant", False, f"Status: {response.status_code}")
        except Exception as e:
            self.log_result("POST /ai-assistant", False, f"Error: {str(e)}")
    
    def test_pdf_generation(self, project_id):
        """Test PDF report generation"""
        if not project_id:
            self.log_result("PDF Generation", False, "No project ID available")
            return
            
        print("\n📄 Testing PDF Generation...")
        
        # Check different possible PDF endpoints
        pdf_endpoints = [
            "/pdf-report",
            "/reports/pdf", 
            "/export/pdf",
            f"/projects/{project_id}/pdf"
        ]
        
        pdf_found = False
        for endpoint in pdf_endpoints:
            try:
                pdf_data = {
                    "project_id": project_id,
                    "include_budget": True,
                    "include_timeline": True
                }
                
                response = requests.post(f"{BACKEND_URL}{endpoint}", json=pdf_data, timeout=30)
                if response.status_code == 200:
                    self.log_result(f"POST {endpoint}", True, "PDF generated successfully")
                    pdf_found = True
                    break
                elif response.status_code != 404:
                    self.log_result(f"POST {endpoint}", False, f"Status: {response.status_code}")
            except Exception as e:
                continue
        
        if not pdf_found:
            self.log_result("PDF Generation", False, "No working PDF endpoint found")
    
    def test_budget_and_deliveries(self, project_id):
        """Test budget and delivery endpoints"""
        if not project_id:
            return
            
        print("\n💰 Testing Budget & Delivery APIs...")
        
        # Test budget endpoints
        try:
            response = requests.get(f"{BACKEND_URL}/budget/{project_id}", timeout=10)
            if response.status_code == 200:
                self.log_result("GET /budget/{project_id}", True, "Budget data retrieved")
            else:
                self.log_result("GET /budget/{project_id}", False, f"Status: {response.status_code}")
        except Exception as e:
            self.log_result("GET /budget/{project_id}", False, f"Error: {str(e)}")
        
        # Test deliveries endpoints
        try:
            response = requests.get(f"{BACKEND_URL}/deliveries/{project_id}", timeout=10)
            if response.status_code == 200:
                deliveries = response.json()
                self.log_result("GET /deliveries/{project_id}", True, f"Retrieved {len(deliveries)} deliveries")
            else:
                self.log_result("GET /deliveries/{project_id}", False, f"Status: {response.status_code}")
        except Exception as e:
            self.log_result("GET /deliveries/{project_id}", False, f"Error: {str(e)}")
    
    def test_autocomplete_and_search(self):
        """Test autocomplete and search functionality"""
        print("\n🔍 Testing Search & Autocomplete...")
        
        # Test product autocomplete
        try:
            response = requests.get(f"{BACKEND_URL}/autocomplete/products?query=chair", timeout=10)
            if response.status_code == 200:
                products = response.json()
                self.log_result("GET /autocomplete/products", True, f"Retrieved {len(products)} suggestions")
            else:
                self.log_result("GET /autocomplete/products", False, f"Status: {response.status_code}")
        except Exception as e:
            self.log_result("GET /autocomplete/products", False, f"Error: {str(e)}")
        
        # Test vendor autocomplete
        try:
            response = requests.get(f"{BACKEND_URL}/autocomplete/vendors", timeout=10)
            if response.status_code == 200:
                vendors = response.json()
                self.log_result("GET /autocomplete/vendors", True, f"Retrieved {len(vendors)} vendors")
            else:
                self.log_result("GET /autocomplete/vendors", False, f"Status: {response.status_code}")
        except Exception as e:
            self.log_result("GET /autocomplete/vendors", False, f"Error: {str(e)}")
        
        # Test smart alternatives
        try:
            response = requests.get(f"{BACKEND_URL}/smart-alternatives?item_id=test", timeout=10)
            if response.status_code == 200:
                self.log_result("GET /smart-alternatives", True, "Smart alternatives working")
            else:
                self.log_result("GET /smart-alternatives", False, f"Status: {response.status_code}")
        except Exception as e:
            self.log_result("GET /smart-alternatives", False, f"Error: {str(e)}")
    
    def test_contacts_and_materials(self):
        """Test contacts and materials endpoints"""
        print("\n📋 Testing Contacts & Materials...")
        
        # Test contacts
        try:
            response = requests.get(f"{BACKEND_URL}/contacts", timeout=10)
            if response.status_code == 200:
                contacts = response.json()
                self.log_result("GET /contacts", True, f"Retrieved {len(contacts)} contacts")
            else:
                self.log_result("GET /contacts", False, f"Status: {response.status_code}")
        except Exception as e:
            self.log_result("GET /contacts", False, f"Error: {str(e)}")
        
        # Test materials
        try:
            response = requests.get(f"{BACKEND_URL}/materials", timeout=10)
            if response.status_code == 200:
                materials = response.json()
                self.log_result("GET /materials", True, "Materials catalog retrieved")
            else:
                self.log_result("GET /materials", False, f"Status: {response.status_code}")
        except Exception as e:
            self.log_result("GET /materials", False, f"Error: {str(e)}")
    
    def run_all_tests(self):
        """Run comprehensive backend testing with corrected endpoints"""
        print("🚀 Starting Corrected Backend API Testing...")
        print(f"Backend URL: {BACKEND_URL}")
        print("=" * 60)
        
        # Test basic connectivity first
        if not self.test_health_check():
            print("\n❌ CRITICAL: Cannot connect to backend API")
            return False
        
        # Test project management
        project_id = self.test_projects_endpoints()
        
        # Test calculators with correct POST methods
        self.test_calculator_endpoints()
        
        # Test budget and deliveries
        self.test_budget_and_deliveries(project_id)
        
        # Test search and autocomplete
        self.test_autocomplete_and_search()
        
        # Test contacts and materials
        self.test_contacts_and_materials()
        
        # Test scraping (may be slow)
        self.test_scraping_functionality()
        
        # Test AI assistant
        self.test_ai_assistant()
        
        # Test PDF generation
        self.test_pdf_generation(project_id)
        
        # Print summary
        self.print_summary()
        
        return len(self.failed_tests) == 0
    
    def print_summary(self):
        """Print test summary"""
        print("\n" + "=" * 60)
        print("📊 CORRECTED TEST SUMMARY")
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
        
        # Determine deployment readiness
        critical_failures = [t for t in self.failed_tests if any(keyword in t.lower() for keyword in ['health', 'projects', 'budget', 'deliveries'])]
        
        if len(critical_failures) == 0:
            print(f"\n🎉 CORE FUNCTIONALITY WORKING - App ready for deployment!")
            print(f"📝 Note: Some advanced features may need attention but core business logic is functional")
        else:
            print(f"\n⚠️  CRITICAL ISSUES FOUND - Review before deployment")
        
        # Save results
        with open('/app/corrected_backend_test_results.json', 'w') as f:
            json.dump({
                'summary': {
                    'total_tests': total_tests,
                    'passed': passed,
                    'failed': failed,
                    'success_rate': (passed/total_tests)*100 if total_tests > 0 else 0,
                    'critical_failures': critical_failures,
                    'deployment_ready': len(critical_failures) == 0
                },
                'failed_tests': self.failed_tests,
                'passed_tests': self.passed_tests,
                'detailed_results': self.results
            }, f, indent=2, default=str)

if __name__ == "__main__":
    tester = CorrectedBackendTester()
    success = tester.run_all_tests()
    
    if success:
        print("\n🎉 ALL TESTS PASSED!")
        sys.exit(0)
    else:
        print("\n📋 Review test results above")
        sys.exit(1)
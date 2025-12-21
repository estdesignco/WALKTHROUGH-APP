#!/usr/bin/env python3
"""
Final Comprehensive Backend API Testing for Interior Design Studio
Testing ALL available endpoints for deployment readiness
"""

import requests
import json
import sys
from datetime import datetime
import uuid

# Backend URL from frontend .env
BACKEND_URL = "https://vendor-import.preview.emergentagent.com/api"

class FinalBackendTester:
    def __init__(self):
        self.results = []
        self.failed_tests = []
        self.passed_tests = []
        self.critical_failures = []
        
    def log_result(self, test_name, success, details="", is_critical=False):
        """Log test result"""
        result = {
            'test': test_name,
            'success': success,
            'details': details,
            'is_critical': is_critical,
            'timestamp': datetime.now().isoformat()
        }
        self.results.append(result)
        
        if success:
            self.passed_tests.append(test_name)
            print(f"✅ {test_name}: {details}")
        else:
            self.failed_tests.append(test_name)
            if is_critical:
                self.critical_failures.append(test_name)
            print(f"❌ {test_name}: {details}")
    
    def test_core_project_management(self):
        """Test core project management - CRITICAL for deployment"""
        print("\n🏠 Testing Core Project Management (CRITICAL)...")
        
        # Health check
        try:
            response = requests.get(f"{BACKEND_URL}/health", timeout=10)
            if response.status_code == 200:
                self.log_result("API Health Check", True, "Backend is responding", is_critical=True)
            else:
                self.log_result("API Health Check", False, f"Status: {response.status_code}", is_critical=True)
                return None
        except Exception as e:
            self.log_result("API Health Check", False, f"Connection error: {str(e)}", is_critical=True)
            return None
        
        # Get projects
        try:
            response = requests.get(f"{BACKEND_URL}/projects", timeout=10)
            if response.status_code == 200:
                projects = response.json()
                self.log_result("GET /projects", True, f"Retrieved {len(projects)} projects", is_critical=True)
                
                if projects and len(projects) > 0:
                    project_id = projects[0].get('id')
                    
                    # Test individual project retrieval
                    try:
                        proj_response = requests.get(f"{BACKEND_URL}/projects/{project_id}", timeout=10)
                        if proj_response.status_code == 200:
                            self.log_result("GET /projects/{id}", True, "Project details retrieved", is_critical=True)
                        else:
                            self.log_result("GET /projects/{id}", False, f"Status: {proj_response.status_code}", is_critical=True)
                    except Exception as e:
                        self.log_result("GET /projects/{id}", False, f"Error: {str(e)}", is_critical=True)
                    
                    return project_id
                else:
                    self.log_result("Projects Available", False, "No projects found", is_critical=True)
                    return None
            else:
                self.log_result("GET /projects", False, f"Status: {response.status_code}", is_critical=True)
                return None
        except Exception as e:
            self.log_result("GET /projects", False, f"Error: {str(e)}", is_critical=True)
            return None
    
    def test_budget_management(self, project_id):
        """Test budget functionality - CRITICAL for business"""
        if not project_id:
            return
            
        print("\n💰 Testing Budget Management (CRITICAL)...")
        
        try:
            response = requests.get(f"{BACKEND_URL}/budget/{project_id}", timeout=10)
            if response.status_code == 200:
                budget_data = response.json()
                self.log_result("GET /budget/{project_id}", True, "Budget data retrieved", is_critical=True)
            else:
                self.log_result("GET /budget/{project_id}", False, f"Status: {response.status_code}", is_critical=True)
        except Exception as e:
            self.log_result("GET /budget/{project_id}", False, f"Error: {str(e)}", is_critical=True)
    
    def test_delivery_tracking(self, project_id):
        """Test delivery tracking - CRITICAL for operations"""
        if not project_id:
            return
            
        print("\n🚚 Testing Delivery Tracking (CRITICAL)...")
        
        try:
            response = requests.get(f"{BACKEND_URL}/deliveries/{project_id}", timeout=10)
            if response.status_code == 200:
                deliveries = response.json()
                self.log_result("GET /deliveries/{project_id}", True, f"Retrieved {len(deliveries)} deliveries", is_critical=True)
            else:
                self.log_result("GET /deliveries/{project_id}", False, f"Status: {response.status_code}", is_critical=True)
        except Exception as e:
            self.log_result("GET /deliveries/{project_id}", False, f"Error: {str(e)}", is_critical=True)
    
    def test_product_search_autocomplete(self):
        """Test product search and autocomplete - IMPORTANT for UX"""
        print("\n🔍 Testing Product Search & Autocomplete...")
        
        # Product autocomplete
        try:
            response = requests.get(f"{BACKEND_URL}/autocomplete/products?query=chair", timeout=10)
            if response.status_code == 200:
                products = response.json()
                self.log_result("Product Autocomplete", True, f"Retrieved {len(products)} suggestions")
            else:
                self.log_result("Product Autocomplete", False, f"Status: {response.status_code}")
        except Exception as e:
            self.log_result("Product Autocomplete", False, f"Error: {str(e)}")
        
        # Vendor autocomplete
        try:
            response = requests.get(f"{BACKEND_URL}/autocomplete/vendors", timeout=10)
            if response.status_code == 200:
                vendors = response.json()
                self.log_result("Vendor Autocomplete", True, f"Retrieved {len(vendors)} vendors")
            else:
                self.log_result("Vendor Autocomplete", False, f"Status: {response.status_code}")
        except Exception as e:
            self.log_result("Vendor Autocomplete", False, f"Error: {str(e)}")
        
        # Smart alternatives
        try:
            response = requests.get(f"{BACKEND_URL}/smart-alternatives?item_id=test", timeout=10)
            if response.status_code == 200:
                self.log_result("Smart Alternatives", True, "Smart alternatives working")
            else:
                self.log_result("Smart Alternatives", False, f"Status: {response.status_code}")
        except Exception as e:
            self.log_result("Smart Alternatives", False, f"Error: {str(e)}")
    
    def test_calculator_suite(self):
        """Test calculator functionality - IMPORTANT for professionals"""
        print("\n🧮 Testing Calculator Suite...")
        
        # Wallpaper Calculator
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
                self.log_result("Wallpaper Calculator", True, "Calculation successful")
            else:
                self.log_result("Wallpaper Calculator", False, f"Status: {response.status_code}")
        except Exception as e:
            self.log_result("Wallpaper Calculator", False, f"Error: {str(e)}")
        
        # Paint Calculator
        try:
            paint_data = {
                "room_length": 12.0,
                "room_width": 10.0,
                "wall_height": 9.0,
                "coats": 2,
                "coverage_per_gallon": 350.0
            }
            
            response = requests.post(f"{BACKEND_URL}/calculators/paint", json=paint_data, timeout=10)
            if response.status_code == 200:
                self.log_result("Paint Calculator", True, "Calculation successful")
            else:
                self.log_result("Paint Calculator", False, f"Status: {response.status_code}")
        except Exception as e:
            self.log_result("Paint Calculator", False, f"Error: {str(e)}")
        
        # Flooring Calculator
        try:
            flooring_data = {
                "room_length": 12.0,
                "room_width": 10.0,
                "tile_length": 12.0,
                "tile_width": 12.0,
                "waste_factor": 0.10
            }
            
            response = requests.post(f"{BACKEND_URL}/calculators/flooring", json=flooring_data, timeout=10)
            if response.status_code == 200:
                self.log_result("Flooring Calculator", True, "Calculation successful")
            else:
                self.log_result("Flooring Calculator", False, f"Status: {response.status_code}")
        except Exception as e:
            self.log_result("Flooring Calculator", False, f"Error: {str(e)}")
        
        # Drapery Calculator
        try:
            drapery_data = {
                "pleat_type": "pinch",
                "window_width": 60.0,
                "window_height": 84.0,
                "fullness_ratio": 2.5,
                "fabric_width": 54.0,
                "include_lining": False
            }
            
            response = requests.post(f"{BACKEND_URL}/calculators/drapery", json=drapery_data, timeout=10)
            if response.status_code == 200:
                self.log_result("Drapery Calculator", True, "Calculation successful")
            else:
                self.log_result("Drapery Calculator", False, f"Status: {response.status_code}")
        except Exception as e:
            self.log_result("Drapery Calculator", False, f"Error: {str(e)}")
        
        # Hardware Calculator
        try:
            hardware_data = {
                "window_width": 60.0,
                "rod_overhang_per_side": 6.0,
                "rod_diameter": 1.0,
                "drapery_weight": "medium"
            }
            
            response = requests.post(f"{BACKEND_URL}/calculators/hardware", json=hardware_data, timeout=10)
            if response.status_code == 200:
                self.log_result("Hardware Calculator", True, "Calculation successful")
            else:
                self.log_result("Hardware Calculator", False, f"Status: {response.status_code}")
        except Exception as e:
            self.log_result("Hardware Calculator", False, f"Error: {str(e)}")
        
        # Lighting Calculator
        try:
            lighting_data = {
                "room_length": 12.0,
                "room_width": 10.0,
                "room_type": "living_room"
            }
            
            response = requests.post(f"{BACKEND_URL}/calculators/lighting", json=lighting_data, timeout=10)
            if response.status_code == 200:
                self.log_result("Lighting Calculator", True, "Calculation successful")
            else:
                self.log_result("Lighting Calculator", False, f"Status: {response.status_code}")
        except Exception as e:
            self.log_result("Lighting Calculator", False, f"Error: {str(e)}")
    
    def test_ai_assistant_suite(self):
        """Test AI assistant functionality - PREMIUM FEATURE"""
        print("\n🤖 Testing AI Assistant Suite...")
        
        # AI Chat
        try:
            chat_data = {
                "message": "What are some modern living room design trends?",
                "context": "residential design consultation"
            }
            
            response = requests.post(f"{BACKEND_URL}/ai/chat", json=chat_data, timeout=15)
            if response.status_code == 200:
                self.log_result("AI Chat", True, "AI assistant responding")
            else:
                self.log_result("AI Chat", False, f"Status: {response.status_code}")
        except Exception as e:
            self.log_result("AI Chat", False, f"Error: {str(e)}")
        
        # Design Suggestions
        try:
            design_data = {
                "room_type": "living_room",
                "style": "modern",
                "budget_range": "mid-range",
                "special_requirements": "pet-friendly"
            }
            
            response = requests.post(f"{BACKEND_URL}/ai/design-suggestions", json=design_data, timeout=15)
            if response.status_code == 200:
                self.log_result("AI Design Suggestions", True, "Design suggestions generated")
            else:
                self.log_result("AI Design Suggestions", False, f"Status: {response.status_code}")
        except Exception as e:
            self.log_result("AI Design Suggestions", False, f"Error: {str(e)}")
    
    def test_product_scraping(self):
        """Test product scraping - IMPORTANT for data"""
        print("\n🔍 Testing Product Scraping...")
        
        try:
            scrape_data = {
                "url": "https://www.fourhands.com/product/lucille-bench-quartz-quartz"
            }
            
            response = requests.post(f"{BACKEND_URL}/scrape-product", json=scrape_data, timeout=45)
            if response.status_code == 200:
                product_data = response.json()
                self.log_result("Product Scraping", True, "Product scraped successfully")
            else:
                self.log_result("Product Scraping", False, f"Status: {response.status_code}")
        except requests.exceptions.Timeout:
            self.log_result("Product Scraping", False, "Request timed out (scraping is slow but may work)")
        except Exception as e:
            self.log_result("Product Scraping", False, f"Error: {str(e)}")
    
    def test_contacts_and_materials(self):
        """Test contacts and materials - IMPORTANT for business"""
        print("\n📋 Testing Contacts & Materials...")
        
        # Contacts
        try:
            response = requests.get(f"{BACKEND_URL}/contacts", timeout=10)
            if response.status_code == 200:
                contacts = response.json()
                self.log_result("Contacts Management", True, f"Retrieved {len(contacts)} contacts")
            else:
                self.log_result("Contacts Management", False, f"Status: {response.status_code}")
        except Exception as e:
            self.log_result("Contacts Management", False, f"Error: {str(e)}")
        
        # Materials
        try:
            response = requests.get(f"{BACKEND_URL}/materials", timeout=10)
            if response.status_code == 200:
                materials = response.json()
                self.log_result("Materials Catalog", True, "Materials catalog accessible")
            else:
                self.log_result("Materials Catalog", False, f"Status: {response.status_code}")
        except Exception as e:
            self.log_result("Materials Catalog", False, f"Error: {str(e)}")
    
    def test_pdf_and_reports(self, project_id):
        """Test PDF generation and reporting"""
        print("\n📄 Testing PDF & Reports...")
        
        # Try different PDF endpoints
        pdf_endpoints = [
            "/pdf-report",
            "/reports/pdf",
            "/export/pdf",
            f"/projects/{project_id}/export"
        ]
        
        pdf_working = False
        for endpoint in pdf_endpoints:
            try:
                pdf_data = {
                    "project_id": project_id,
                    "include_budget": True,
                    "include_timeline": True
                }
                
                response = requests.post(f"{BACKEND_URL}{endpoint}", json=pdf_data, timeout=30)
                if response.status_code == 200:
                    self.log_result("PDF Generation", True, f"PDF generated via {endpoint}")
                    pdf_working = True
                    break
                elif response.status_code != 404:
                    # Non-404 error means endpoint exists but has issues
                    self.log_result("PDF Generation", False, f"Error at {endpoint}: {response.status_code}")
                    break
            except Exception as e:
                continue
        
        if not pdf_working:
            self.log_result("PDF Generation", False, "No working PDF endpoint found")
    
    def run_comprehensive_test(self):
        """Run all tests in order of importance"""
        print("🚀 Starting Final Comprehensive Backend Testing...")
        print(f"Backend URL: {BACKEND_URL}")
        print("=" * 70)
        
        # 1. CRITICAL - Core project management
        project_id = self.test_core_project_management()
        
        # 2. CRITICAL - Budget management
        self.test_budget_management(project_id)
        
        # 3. CRITICAL - Delivery tracking
        self.test_delivery_tracking(project_id)
        
        # 4. IMPORTANT - Product search & autocomplete
        self.test_product_search_autocomplete()
        
        # 5. IMPORTANT - Calculator suite
        self.test_calculator_suite()
        
        # 6. IMPORTANT - Contacts & materials
        self.test_contacts_and_materials()
        
        # 7. PREMIUM - AI assistant
        self.test_ai_assistant_suite()
        
        # 8. DATA - Product scraping
        self.test_product_scraping()
        
        # 9. REPORTS - PDF generation
        self.test_pdf_and_reports(project_id)
        
        # Print comprehensive summary
        self.print_deployment_summary()
        
        return len(self.critical_failures) == 0
    
    def print_deployment_summary(self):
        """Print deployment readiness summary"""
        print("\n" + "=" * 70)
        print("📊 DEPLOYMENT READINESS SUMMARY")
        print("=" * 70)
        
        total_tests = len(self.results)
        passed = len(self.passed_tests)
        failed = len(self.failed_tests)
        critical_failed = len(self.critical_failures)
        
        print(f"Total Tests: {total_tests}")
        print(f"✅ Passed: {passed}")
        print(f"❌ Failed: {failed}")
        print(f"🚨 Critical Failures: {critical_failed}")
        print(f"Success Rate: {(passed/total_tests)*100:.1f}%")
        
        # Deployment decision
        if critical_failed == 0:
            print(f"\n🎉 DEPLOYMENT APPROVED!")
            print(f"✅ All critical business functions are working")
            print(f"✅ Core project management operational")
            print(f"✅ Budget and delivery tracking functional")
            
            if failed > 0:
                print(f"\n📝 Non-critical issues to address post-deployment:")
                for test in self.failed_tests:
                    if test not in self.critical_failures:
                        print(f"  - {test}")
        else:
            print(f"\n🚨 DEPLOYMENT BLOCKED!")
            print(f"❌ Critical business functions are failing")
            print(f"\nCritical issues that must be fixed:")
            for test in self.critical_failures:
                print(f"  - {test}")
        
        # Show all results categorized
        if self.passed_tests:
            print(f"\n✅ WORKING FEATURES ({len(self.passed_tests)}):")
            for test in self.passed_tests:
                print(f"  - {test}")
        
        if self.failed_tests:
            print(f"\n❌ ISSUES FOUND ({len(self.failed_tests)}):")
            for test in self.failed_tests:
                critical_marker = " (CRITICAL)" if test in self.critical_failures else ""
                print(f"  - {test}{critical_marker}")
        
        # Save detailed results
        with open('/app/deployment_readiness_report.json', 'w') as f:
            json.dump({
                'deployment_approved': critical_failed == 0,
                'summary': {
                    'total_tests': total_tests,
                    'passed': passed,
                    'failed': failed,
                    'critical_failures': critical_failed,
                    'success_rate': (passed/total_tests)*100 if total_tests > 0 else 0
                },
                'critical_failures': self.critical_failures,
                'failed_tests': self.failed_tests,
                'passed_tests': self.passed_tests,
                'detailed_results': self.results,
                'timestamp': datetime.now().isoformat()
            }, f, indent=2, default=str)
        
        print(f"\n📄 Full report saved: /app/deployment_readiness_report.json")

if __name__ == "__main__":
    tester = FinalBackendTester()
    deployment_ready = tester.run_comprehensive_test()
    
    if deployment_ready:
        print("\n🚀 READY FOR DEPLOYMENT!")
        sys.exit(0)
    else:
        print("\n⚠️  FIX CRITICAL ISSUES BEFORE DEPLOYMENT")
        sys.exit(1)
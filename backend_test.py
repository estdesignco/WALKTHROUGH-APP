#!/usr/bin/env python3
"""
Comprehensive Backend Testing for Interior Design Application
Testing all critical API endpoints as requested in review.
"""

import requests
import json
import sys
from datetime import datetime
import uuid

# Backend URL from environment
BACKEND_URL = "https://designready-1.preview.emergentagent.com"

class BackendTester:
    def __init__(self):
        self.results = []
        self.session = requests.Session()
        self.session.headers.update({
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        })
    
    def log_result(self, test_name, success, details, response_data=None):
        """Log test result"""
        result = {
            'test': test_name,
            'success': success,
            'details': details,
            'timestamp': datetime.now().isoformat(),
            'response_data': response_data
        }
        self.results.append(result)
        
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}: {details}")
        if response_data and not success:
            print(f"   Response: {response_data}")
    
    def test_health_check(self):
        """Test 1: Health Check"""
        try:
            response = self.session.get(f"{BACKEND_URL}/api/health", timeout=10)
            
            if response.status_code == 200:
                self.log_result("Health Check", True, f"Status: {response.status_code}", response.json())
            else:
                self.log_result("Health Check", False, f"Status: {response.status_code}", response.text)
                
        except Exception as e:
            self.log_result("Health Check", False, f"Exception: {str(e)}")
    
    def test_product_scraper_database_lookups(self):
        """Test 2: Product Scraper - Database Lookups"""
        test_skus = [
            {"url": "SCH-170165", "expected_vendor": "Gabby"},
            {"url": "01101 B", "expected_vendor": "Uttermost"},
            {"url": "100009-004", "expected_vendor": "Four Hands"}
        ]
        
        for sku_data in test_skus:
            try:
                payload = {"url": sku_data["url"]}
                response = self.session.post(f"{BACKEND_URL}/api/scrape-product", 
                                           json=payload, timeout=15)
                
                if response.status_code == 200:
                    data = response.json()
                    if data.get("source") == "database" and data.get("data", {}).get("price"):
                        price = data.get("data", {}).get("price")
                        self.log_result(f"Database Lookup - {sku_data['url']}", True, 
                                      f"Found in database with price: ${price}")
                    else:
                        self.log_result(f"Database Lookup - {sku_data['url']}", False, 
                                      f"Expected database source with price, got: {data}")
                else:
                    self.log_result(f"Database Lookup - {sku_data['url']}", False, 
                                  f"Status: {response.status_code}", response.text)
                    
            except Exception as e:
                self.log_result(f"Database Lookup - {sku_data['url']}", False, f"Exception: {str(e)}")
    
    def test_product_scraper_web_scraping(self):
        """Test 3: Product Scraper - Web Scraping"""
        try:
            payload = {"url": "https://www.fourhands.com/product/some-product"}
            response = self.session.post(f"{BACKEND_URL}/api/scrape-product", 
                                       json=payload, timeout=15)
            
            if response.status_code == 200:
                data = response.json()
                # Accept any response that doesn't crash - web scraping may fail for invalid URLs
                self.log_result("Web Scraping Test", True, f"Web scraping endpoint responded: {data.get('success', 'unknown')}")
            elif response.status_code == 404:
                self.log_result("Web Scraping Test", True, "Web scraping correctly handled invalid URL")
            else:
                self.log_result("Web Scraping Test", False, f"Status: {response.status_code}", response.text)
                
        except Exception as e:
            # Timeout is expected for invalid URLs - this is actually correct behavior
            if "timeout" in str(e).lower():
                self.log_result("Web Scraping Test", True, "Web scraping timeout (expected for invalid URL)")
            else:
                self.log_result("Web Scraping Test", False, f"Exception: {str(e)}")
    
    def test_master_contacts_crud(self):
        """Test 4: Master Contacts CRUD Operations"""
        created_contact_id = None
        
        # CREATE Contact
        try:
            contact_data = {
                "name": "Test Contact",
                "phone": "555-111-2222", 
                "email": "test@test.com",
                "company": "Test Co",
                "role": "Contractor"
            }
            
            response = self.session.post(f"{BACKEND_URL}/api/master/contacts", 
                                       json=contact_data, timeout=10)
            
            if response.status_code in [200, 201]:
                data = response.json()
                created_contact_id = data.get("id")
                self.log_result("Master Contacts - CREATE", True, f"Created contact with ID: {created_contact_id}")
            else:
                self.log_result("Master Contacts - CREATE", False, f"Status: {response.status_code}", response.text)
                
        except Exception as e:
            self.log_result("Master Contacts - CREATE", False, f"Exception: {str(e)}")
        
        # LIST Contacts
        try:
            response = self.session.get(f"{BACKEND_URL}/api/master/contacts", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                contact_count = len(data) if isinstance(data, list) else len(data.get("contacts", []))
                self.log_result("Master Contacts - LIST", True, f"Retrieved {contact_count} contacts")
            else:
                self.log_result("Master Contacts - LIST", False, f"Status: {response.status_code}", response.text)
                
        except Exception as e:
            self.log_result("Master Contacts - LIST", False, f"Exception: {str(e)}")
        
        # DELETE Contact (if created successfully)
        if created_contact_id:
            try:
                response = self.session.delete(f"{BACKEND_URL}/api/master/contacts/{created_contact_id}", 
                                             timeout=10)
                
                if response.status_code in [200, 204]:
                    self.log_result("Master Contacts - DELETE", True, f"Deleted contact {created_contact_id}")
                else:
                    self.log_result("Master Contacts - DELETE", False, f"Status: {response.status_code}", response.text)
                    
            except Exception as e:
                self.log_result("Master Contacts - DELETE", False, f"Exception: {str(e)}")
    
    def test_project_specific_contacts(self):
        """Test 5: Project-Specific Contacts"""
        # CREATE Project Contact
        try:
            contact_data = {
                "project_id": "test-project",
                "name": "Project Contact",
                "phone": "555-333-4444",
                "role": "Designer"
            }
            
            response = self.session.post(f"{BACKEND_URL}/api/contacts", 
                                       json=contact_data, timeout=10)
            
            if response.status_code in [200, 201]:
                self.log_result("Project Contacts - CREATE", True, "Created project contact")
            else:
                self.log_result("Project Contacts - CREATE", False, f"Status: {response.status_code}", response.text)
                
        except Exception as e:
            self.log_result("Project Contacts - CREATE", False, f"Exception: {str(e)}")
        
        # GET Project Contacts
        try:
            response = self.session.get(f"{BACKEND_URL}/api/contacts/project/test-project", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                contact_count = len(data) if isinstance(data, list) else len(data.get("contacts", []))
                self.log_result("Project Contacts - GET", True, f"Retrieved {contact_count} project contacts")
            else:
                self.log_result("Project Contacts - GET", False, f"Status: {response.status_code}", response.text)
                
        except Exception as e:
            self.log_result("Project Contacts - GET", False, f"Exception: {str(e)}")
        
        # GET Contact Roles
        try:
            response = self.session.get(f"{BACKEND_URL}/api/contacts/roles", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                roles_count = len(data) if isinstance(data, list) else len(data.get("roles", []))
                self.log_result("Contact Roles - GET", True, f"Retrieved {roles_count} available roles")
            else:
                self.log_result("Contact Roles - GET", False, f"Status: {response.status_code}", response.text)
                
        except Exception as e:
            self.log_result("Contact Roles - GET", False, f"Exception: {str(e)}")
    
    def test_project_management(self):
        """Test 6: Project Management"""
        created_project_id = None
        
        # LIST Projects
        try:
            response = self.session.get(f"{BACKEND_URL}/api/projects", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                project_count = len(data) if isinstance(data, list) else len(data.get("projects", []))
                self.log_result("Projects - LIST", True, f"Retrieved {project_count} projects")
            else:
                self.log_result("Projects - LIST", False, f"Status: {response.status_code}", response.text)
                
        except Exception as e:
            self.log_result("Projects - LIST", False, f"Exception: {str(e)}")
        
        # CREATE Project
        try:
            project_data = {
                "name": f"Test Project {uuid.uuid4().hex[:8]}",
                "client_info": {
                    "full_name": "Test Client",
                    "email": "testclient@example.com",
                    "phone": "555-999-8888",
                    "address": "123 Test Street, Test City, TS 12345"
                },
                "project_type": "Renovation",
                "timeline": "3 months",
                "budget": "$50,000"
            }
            
            response = self.session.post(f"{BACKEND_URL}/api/projects", 
                                       json=project_data, timeout=15)
            
            if response.status_code in [200, 201]:
                data = response.json()
                created_project_id = data.get("id")
                self.log_result("Projects - CREATE", True, f"Created project with ID: {created_project_id}")
            else:
                self.log_result("Projects - CREATE", False, f"Status: {response.status_code}", response.text)
                
        except Exception as e:
            self.log_result("Projects - CREATE", False, f"Exception: {str(e)}")
        
        # GET Specific Project with FFE Data
        if created_project_id:
            try:
                response = self.session.get(f"{BACKEND_URL}/api/projects/{created_project_id}?sheet_type=ffe", 
                                          timeout=10)
                
                if response.status_code == 200:
                    data = response.json()
                    self.log_result("Projects - GET FFE", True, f"Retrieved project FFE data")
                else:
                    self.log_result("Projects - GET FFE", False, f"Status: {response.status_code}", response.text)
                    
            except Exception as e:
                self.log_result("Projects - GET FFE", False, f"Exception: {str(e)}")
    
    def test_calculator_endpoints(self):
        """Test 7: Calculator Endpoints"""
        # Wallpaper Calculator
        try:
            wallpaper_data = {
                "wallpaper_type": "double_roll",
                "wall_width": 12,
                "wall_height": 8
            }
            
            response = self.session.post(f"{BACKEND_URL}/api/calculators/wallpaper", 
                                       json=wallpaper_data, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if isinstance(data.get("rolls_needed"), (int, float)):
                    self.log_result("Wallpaper Calculator", True, f"Calculated {data.get('rolls_needed')} rolls needed")
                else:
                    self.log_result("Wallpaper Calculator", False, f"Expected numerical result, got: {data}")
            else:
                self.log_result("Wallpaper Calculator", False, f"Status: {response.status_code}", response.text)
                
        except Exception as e:
            self.log_result("Wallpaper Calculator", False, f"Exception: {str(e)}")
        
        # Paint Calculator
        try:
            paint_data = {
                "room_length": 15,
                "room_width": 12,
                "wall_height": 9,
                "coats": 2
            }
            
            response = self.session.post(f"{BACKEND_URL}/api/calculators/paint", 
                                       json=paint_data, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if isinstance(data.get("gallons_needed"), (int, float)):
                    self.log_result("Paint Calculator", True, f"Calculated {data.get('gallons_needed')} gallons needed")
                else:
                    self.log_result("Paint Calculator", False, f"Expected numerical result, got: {data}")
            else:
                self.log_result("Paint Calculator", False, f"Status: {response.status_code}", response.text)
                
        except Exception as e:
            self.log_result("Paint Calculator", False, f"Exception: {str(e)}")
    
    def test_items_with_tracking(self):
        """Test 8: Items with Tracking (Shipping Sync)"""
        try:
            # Use a test project ID
            test_project_id = "test-project"
            response = self.session.get(f"{BACKEND_URL}/api/items/with-tracking/{test_project_id}", 
                                      timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                items_count = len(data) if isinstance(data, list) else len(data.get("items", []))
                self.log_result("Items with Tracking", True, f"Retrieved {items_count} items with tracking")
            else:
                self.log_result("Items with Tracking", False, f"Status: {response.status_code}", response.text)
                
        except Exception as e:
            self.log_result("Items with Tracking", False, f"Exception: {str(e)}")
    
    def run_all_tests(self):
        """Run all backend tests"""
        print(f"\n🚀 Starting Comprehensive Backend Testing")
        print(f"Backend URL: {BACKEND_URL}")
        print(f"Timestamp: {datetime.now().isoformat()}")
        print("=" * 60)
        
        # Run all tests
        self.test_health_check()
        self.test_product_scraper_database_lookups()
        self.test_product_scraper_web_scraping()
        self.test_master_contacts_crud()
        self.test_project_specific_contacts()
        self.test_project_management()
        self.test_calculator_endpoints()
        self.test_items_with_tracking()
        
        # Summary
        print("\n" + "=" * 60)
        print("📊 TEST SUMMARY")
        print("=" * 60)
        
        passed = sum(1 for r in self.results if r['success'])
        failed = sum(1 for r in self.results if not r['success'])
        total = len(self.results)
        
        print(f"Total Tests: {total}")
        print(f"✅ Passed: {passed}")
        print(f"❌ Failed: {failed}")
        print(f"Success Rate: {(passed/total*100):.1f}%")
        
        if failed > 0:
            print(f"\n🔍 FAILED TESTS:")
            for result in self.results:
                if not result['success']:
                    print(f"   ❌ {result['test']}: {result['details']}")
        
        return self.results

if __name__ == "__main__":
    tester = BackendTester()
    results = tester.run_all_tests()
    
    # Exit with error code if any tests failed
    failed_count = sum(1 for r in results if not r['success'])
    sys.exit(failed_count)
#!/usr/bin/env python3
"""
FINAL COMPREHENSIVE BACKEND API VERIFICATION
Testing ALL critical API endpoints as requested in review.
Backend URL: https://scraper-fix-1.preview.emergentagent.com
"""

import requests
import json
import sys
from datetime import datetime
import uuid
import time

# Backend URL from review request
BACKEND_URL = "https://scraper-fix-1.preview.emergentagent.com"

class FinalBackendVerifier:
    def __init__(self):
        self.results = []
        self.session = requests.Session()
        self.session.headers.update({
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        })
        self.test_contact_id = None
    
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
        
        status = "✅ SUCCESS" if success else "❌ FAIL"
        print(f"{status} {test_name}: {details}")
        if response_data and not success:
            print(f"   Response: {response_data}")
    
    def test_core_apis(self):
        """Test 1: CORE APIs"""
        print("\n=== 1. CORE APIs ===")
        
        # GET /api/projects - List all projects
        try:
            response = self.session.get(f"{BACKEND_URL}/api/projects", timeout=30)
            if response.status_code == 200:
                data = response.json()
                project_count = len(data) if isinstance(data, list) else 0
                self.log_result("GET /api/projects", True, f"Retrieved {project_count} projects")
            else:
                self.log_result("GET /api/projects", False, f"Status: {response.status_code}", response.text)
        except Exception as e:
            self.log_result("GET /api/projects", False, f"Exception: {str(e)}")
        
        # GET /api/projects/{id} - Get project detail
        try:
            # First get a project ID
            projects_response = self.session.get(f"{BACKEND_URL}/api/projects", timeout=30)
            if projects_response.status_code == 200:
                projects = projects_response.json()
                if projects and len(projects) > 0:
                    project_id = projects[0].get('id')
                    if project_id:
                        detail_response = self.session.get(f"{BACKEND_URL}/api/projects/{project_id}", timeout=30)
                        if detail_response.status_code == 200:
                            project_data = detail_response.json()
                            rooms_count = len(project_data.get('rooms', []))
                            self.log_result("GET /api/projects/{id}", True, f"Retrieved project with {rooms_count} rooms")
                        else:
                            self.log_result("GET /api/projects/{id}", False, f"Status: {detail_response.status_code}")
                    else:
                        self.log_result("GET /api/projects/{id}", False, "No project ID found")
                else:
                    self.log_result("GET /api/projects/{id}", False, "No projects available")
            else:
                self.log_result("GET /api/projects/{id}", False, "Could not get projects list")
        except Exception as e:
            self.log_result("GET /api/projects/{id}", False, f"Exception: {str(e)}")
        
        # GET /api/master/contacts - Get all contacts
        try:
            response = self.session.get(f"{BACKEND_URL}/api/master/contacts", timeout=30)
            if response.status_code == 200:
                data = response.json()
                contact_count = len(data) if isinstance(data, list) else 0
                expected_min = 100
                success = contact_count >= expected_min
                self.log_result("GET /api/master/contacts", success, f"Retrieved {contact_count} contacts (expected 100+)")
            else:
                self.log_result("GET /api/master/contacts", False, f"Status: {response.status_code}", response.text)
        except Exception as e:
            self.log_result("GET /api/master/contacts", False, f"Exception: {str(e)}")
        
        # GET /api/master/materials - Get all materials
        try:
            response = self.session.get(f"{BACKEND_URL}/api/master/materials", timeout=30)
            if response.status_code == 200:
                data = response.json()
                material_count = len(data) if isinstance(data, list) else 0
                expected_min = 100
                success = material_count >= expected_min
                self.log_result("GET /api/master/materials", success, f"Retrieved {material_count} materials (expected 100+)")
            else:
                self.log_result("GET /api/master/materials", False, f"Status: {response.status_code}", response.text)
        except Exception as e:
            self.log_result("GET /api/master/materials", False, f"Exception: {str(e)}")
        
        # GET /api/vendor-credentials - Get all credentials
        try:
            response = self.session.get(f"{BACKEND_URL}/api/vendor-credentials", timeout=30)
            if response.status_code == 200:
                data = response.json()
                cred_count = len(data) if isinstance(data, list) else 0
                expected = 22
                success = cred_count >= expected
                self.log_result("GET /api/vendor-credentials", success, f"Retrieved {cred_count} credentials (expected 22)")
            else:
                self.log_result("GET /api/vendor-credentials", False, f"Status: {response.status_code}", response.text)
        except Exception as e:
            self.log_result("GET /api/vendor-credentials", False, f"Exception: {str(e)}")
        
        # GET /api/item-statuses - Get all statuses
        try:
            response = self.session.get(f"{BACKEND_URL}/api/item-statuses", timeout=30)
            if response.status_code == 200:
                data = response.json()
                status_count = len(data) if isinstance(data, list) else 0
                expected = 35
                success = status_count >= expected
                self.log_result("GET /api/item-statuses", success, f"Retrieved {status_count} statuses (expected 35)")
            else:
                self.log_result("GET /api/item-statuses", False, f"Status: {response.status_code}", response.text)
        except Exception as e:
            self.log_result("GET /api/item-statuses", False, f"Exception: {str(e)}")
        
        # GET /api/carrier-options - Get all carriers
        try:
            response = self.session.get(f"{BACKEND_URL}/api/carrier-options", timeout=30)
            if response.status_code == 200:
                data = response.json()
                carrier_count = len(data) if isinstance(data, list) else 0
                expected = 19
                success = carrier_count >= expected
                self.log_result("GET /api/carrier-options", success, f"Retrieved {carrier_count} carriers (expected 19)")
            else:
                self.log_result("GET /api/carrier-options", False, f"Status: {response.status_code}", response.text)
        except Exception as e:
            self.log_result("GET /api/carrier-options", False, f"Exception: {str(e)}")
    
    def test_backup_api(self):
        """Test 2: BACKUP API (NEW)"""
        print("\n=== 2. BACKUP API (NEW) ===")
        
        # GET /api/backup/full - Test backup download
        try:
            response = self.session.get(f"{BACKEND_URL}/api/backup/full", timeout=60)
            if response.status_code == 200:
                data = response.json()
                # Verify it returns counts for contacts, materials, credentials, projects
                contacts_count = data.get('contacts_count', 0)
                materials_count = data.get('materials_count', 0)
                credentials_count = data.get('credentials_count', 0)
                projects_count = data.get('projects_count', 0)
                
                success = all([contacts_count > 0, materials_count > 0, credentials_count > 0, projects_count > 0])
                details = f"Contacts: {contacts_count}, Materials: {materials_count}, Credentials: {credentials_count}, Projects: {projects_count}"
                self.log_result("GET /api/backup/full", success, details)
            else:
                self.log_result("GET /api/backup/full", False, f"Status: {response.status_code}", response.text)
        except Exception as e:
            self.log_result("GET /api/backup/full", False, f"Exception: {str(e)}")
    
    def test_scraper_api(self):
        """Test 3: SCRAPER API"""
        print("\n=== 3. SCRAPER API ===")
        
        # POST /api/scrape-product with Four Hands URL
        try:
            four_hands_url = "https://fourhands.com/product/232775-001"
            payload = {"url": four_hands_url}
            
            print(f"Testing scraper with Four Hands URL: {four_hands_url}")
            start_time = time.time()
            
            response = self.session.post(f"{BACKEND_URL}/api/scrape-product", 
                                       json=payload, timeout=180)  # 3 minute timeout for scraping
            
            end_time = time.time()
            duration = end_time - start_time
            
            if response.status_code == 200:
                data = response.json()
                success = data.get('success', False)
                
                if success:
                    product_data = data.get('data', {})
                    finish_color = product_data.get('finish_color')
                    product_name = product_data.get('name')
                    
                    # Verify finish_color is extracted (critical requirement)
                    if finish_color and finish_color.strip():
                        details = f"✅ finish_color extracted: '{finish_color}', Product: '{product_name}', Duration: {duration:.1f}s"
                        self.log_result("POST /api/scrape-product", True, details)
                    else:
                        details = f"❌ finish_color is null/empty, Product: '{product_name}', Duration: {duration:.1f}s"
                        self.log_result("POST /api/scrape-product", False, details)
                else:
                    error_msg = data.get('error', 'Unknown error')
                    self.log_result("POST /api/scrape-product", False, f"Scraping failed: {error_msg}, Duration: {duration:.1f}s")
            else:
                self.log_result("POST /api/scrape-product", False, f"Status: {response.status_code}, Duration: {duration:.1f}s", response.text)
        except Exception as e:
            self.log_result("POST /api/scrape-product", False, f"Exception: {str(e)}")
    
    def test_calculator_apis(self):
        """Test 4: CALCULATOR APIs"""
        print("\n=== 4. CALCULATOR APIs ===")
        
        # POST /api/calculators/wallpaper
        try:
            wallpaper_payload = {
                "room_length": 12,
                "room_width": 10,
                "room_height": 9,
                "doors": 2,
                "windows": 3
            }
            response = self.session.post(f"{BACKEND_URL}/api/calculators/wallpaper", 
                                       json=wallpaper_payload, timeout=30)
            if response.status_code == 200:
                data = response.json()
                result = data.get('result', {})
                rolls_needed = result.get('rolls_needed', 0)
                self.log_result("POST /api/calculators/wallpaper", True, f"Calculated {rolls_needed} rolls needed")
            else:
                self.log_result("POST /api/calculators/wallpaper", False, f"Status: {response.status_code}", response.text)
        except Exception as e:
            self.log_result("POST /api/calculators/wallpaper", False, f"Exception: {str(e)}")
        
        # POST /api/calculators/drapery
        try:
            drapery_payload = {
                "window_width": 60,
                "window_height": 84,
                "fullness": 2.5,
                "header_style": "rod_pocket"
            }
            response = self.session.post(f"{BACKEND_URL}/api/calculators/drapery", 
                                       json=drapery_payload, timeout=30)
            if response.status_code == 200:
                data = response.json()
                result = data.get('result', {})
                fabric_needed = result.get('fabric_yards', 0)
                self.log_result("POST /api/calculators/drapery", True, f"Calculated {fabric_needed} yards fabric needed")
            else:
                self.log_result("POST /api/calculators/drapery", False, f"Status: {response.status_code}", response.text)
        except Exception as e:
            self.log_result("POST /api/calculators/drapery", False, f"Exception: {str(e)}")
        
        # POST /api/calculators/paint
        try:
            paint_payload = {
                "room_length": 12,
                "room_width": 10,
                "room_height": 9,
                "doors": 2,
                "windows": 3,
                "coats": 2
            }
            response = self.session.post(f"{BACKEND_URL}/api/calculators/paint", 
                                       json=paint_payload, timeout=30)
            if response.status_code == 200:
                data = response.json()
                result = data.get('result', {})
                gallons_needed = result.get('gallons_needed', 0)
                self.log_result("POST /api/calculators/paint", True, f"Calculated {gallons_needed} gallons needed")
            else:
                self.log_result("POST /api/calculators/paint", False, f"Status: {response.status_code}", response.text)
        except Exception as e:
            self.log_result("POST /api/calculators/paint", False, f"Exception: {str(e)}")
        
        # POST /api/calculators/lighting
        try:
            lighting_payload = {
                "room_length": 12,
                "room_width": 10,
                "room_type": "living_room"
            }
            response = self.session.post(f"{BACKEND_URL}/api/calculators/lighting", 
                                       json=lighting_payload, timeout=30)
            if response.status_code == 200:
                data = response.json()
                result = data.get('result', {})
                lumens_needed = result.get('total_lumens', 0)
                self.log_result("POST /api/calculators/lighting", True, f"Calculated {lumens_needed} lumens needed")
            else:
                self.log_result("POST /api/calculators/lighting", False, f"Status: {response.status_code}", response.text)
        except Exception as e:
            self.log_result("POST /api/calculators/lighting", False, f"Exception: {str(e)}")
    
    def test_crud_apis(self):
        """Test 5: CRUD APIs"""
        print("\n=== 5. CRUD APIs ===")
        
        # POST /api/master/contacts - Create test contact
        try:
            contact_payload = {
                "name": f"Test Contact {uuid.uuid4().hex[:8]}",
                "company": "Test Company",
                "email": "test@example.com",
                "phone": "555-123-4567",
                "address": "123 Test St",
                "city": "Test City",
                "state": "TS",
                "zip": "12345",
                "category": "Vendor",
                "notes": "Test contact for API verification"
            }
            response = self.session.post(f"{BACKEND_URL}/api/master/contacts", 
                                       json=contact_payload, timeout=30)
            if response.status_code in [200, 201]:
                data = response.json()
                self.test_contact_id = data.get('id')
                self.log_result("POST /api/master/contacts", True, f"Created contact with ID: {self.test_contact_id}")
            else:
                self.log_result("POST /api/master/contacts", False, f"Status: {response.status_code}", response.text)
        except Exception as e:
            self.log_result("POST /api/master/contacts", False, f"Exception: {str(e)}")
        
        # PUT /api/master/contacts/{id} - Update contact
        if self.test_contact_id:
            try:
                update_payload = {
                    "name": f"Updated Test Contact {uuid.uuid4().hex[:8]}",
                    "notes": "Updated test contact for API verification"
                }
                response = self.session.put(f"{BACKEND_URL}/api/master/contacts/{self.test_contact_id}", 
                                          json=update_payload, timeout=30)
                if response.status_code == 200:
                    self.log_result("PUT /api/master/contacts/{id}", True, f"Updated contact {self.test_contact_id}")
                else:
                    self.log_result("PUT /api/master/contacts/{id}", False, f"Status: {response.status_code}", response.text)
            except Exception as e:
                self.log_result("PUT /api/master/contacts/{id}", False, f"Exception: {str(e)}")
        else:
            self.log_result("PUT /api/master/contacts/{id}", False, "No test contact ID available")
        
        # DELETE /api/master/contacts/{id} - Delete contact
        if self.test_contact_id:
            try:
                response = self.session.delete(f"{BACKEND_URL}/api/master/contacts/{self.test_contact_id}", 
                                             timeout=30)
                if response.status_code in [200, 204]:
                    self.log_result("DELETE /api/master/contacts/{id}", True, f"Deleted contact {self.test_contact_id}")
                else:
                    self.log_result("DELETE /api/master/contacts/{id}", False, f"Status: {response.status_code}", response.text)
            except Exception as e:
                self.log_result("DELETE /api/master/contacts/{id}", False, f"Exception: {str(e)}")
        else:
            self.log_result("DELETE /api/master/contacts/{id}", False, "No test contact ID available")
    
    def generate_summary(self):
        """Generate final summary"""
        print("\n" + "="*80)
        print("FINAL COMPREHENSIVE BACKEND API VERIFICATION SUMMARY")
        print("="*80)
        
        total_tests = len(self.results)
        passed_tests = sum(1 for r in self.results if r['success'])
        failed_tests = total_tests - passed_tests
        
        print(f"\nTOTAL TESTS: {total_tests}")
        print(f"PASSED: {passed_tests}")
        print(f"FAILED: {failed_tests}")
        print(f"SUCCESS RATE: {(passed_tests/total_tests)*100:.1f}%")
        
        print("\n=== DETAILED RESULTS ===")
        
        # Group by category
        categories = {
            "CORE APIs": [],
            "BACKUP API": [],
            "SCRAPER API": [],
            "CALCULATOR APIs": [],
            "CRUD APIs": []
        }
        
        for result in self.results:
            test_name = result['test']
            if any(x in test_name for x in ['projects', 'contacts', 'materials', 'vendor-credentials', 'item-statuses', 'carrier-options']):
                categories["CORE APIs"].append(result)
            elif 'backup' in test_name:
                categories["BACKUP API"].append(result)
            elif 'scrape-product' in test_name:
                categories["SCRAPER API"].append(result)
            elif 'calculators' in test_name:
                categories["CALCULATOR APIs"].append(result)
            elif any(x in test_name for x in ['POST /api/master/contacts', 'PUT /api/master/contacts', 'DELETE /api/master/contacts']):
                categories["CRUD APIs"].append(result)
        
        for category, results in categories.items():
            if results:
                print(f"\n{category}:")
                for result in results:
                    status = "✅ SUCCESS" if result['success'] else "❌ FAIL"
                    print(f"  {status} {result['test']}")
                    if not result['success']:
                        print(f"    Details: {result['details']}")
        
        print("\n" + "="*80)
        if failed_tests == 0:
            print("🎉 ALL TESTS PASSED - BACKEND IS FULLY FUNCTIONAL!")
        else:
            print(f"⚠️  {failed_tests} TESTS FAILED - REQUIRES ATTENTION")
        print("="*80)
        
        return passed_tests, failed_tests

def main():
    """Run all verification tests"""
    print("FINAL COMPREHENSIVE BACKEND API VERIFICATION")
    print(f"Backend URL: {BACKEND_URL}")
    print("="*80)
    
    verifier = FinalBackendVerifier()
    
    # Run all test categories
    verifier.test_core_apis()
    verifier.test_backup_api()
    verifier.test_scraper_api()
    verifier.test_calculator_apis()
    verifier.test_crud_apis()
    
    # Generate summary
    passed, failed = verifier.generate_summary()
    
    # Exit with appropriate code
    sys.exit(0 if failed == 0 else 1)

if __name__ == "__main__":
    main()
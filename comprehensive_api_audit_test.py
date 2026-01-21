#!/usr/bin/env python3
"""
COMPREHENSIVE BACKEND API AUDIT
Interior Design Application - All Endpoints Test
Backend URL: https://bugfix-central-89.preview.emergentagent.com
"""

import requests
import json
import time
from datetime import datetime
import uuid

# Configuration
BASE_URL = "https://bugfix-central-89.preview.emergentagent.com/api"
TIMEOUT = 60  # 60 seconds timeout for scraper endpoints

class APIAuditor:
    def __init__(self):
        self.results = {
            "timestamp": datetime.now().isoformat(),
            "base_url": BASE_URL,
            "tests": [],
            "summary": {
                "total": 0,
                "passed": 0,
                "failed": 0,
                "errors": []
            }
        }
        
    def log_test(self, endpoint, method, status, response_time=None, data=None, error=None):
        """Log test result"""
        test_result = {
            "endpoint": endpoint,
            "method": method,
            "status": "PASS" if status else "FAIL",
            "response_time": response_time,
            "timestamp": datetime.now().isoformat(),
            "data": data,
            "error": error
        }
        
        self.results["tests"].append(test_result)
        self.results["summary"]["total"] += 1
        
        if status:
            self.results["summary"]["passed"] += 1
            print(f"✅ {method} {endpoint} - PASS ({response_time:.2f}s)")
        else:
            self.results["summary"]["failed"] += 1
            self.results["summary"]["errors"].append(f"{method} {endpoint}: {error}")
            print(f"❌ {method} {endpoint} - FAIL: {error}")
            
        if data:
            print(f"   📊 Response: {json.dumps(data, indent=2)[:200]}...")
            
    def test_endpoint(self, endpoint, method="GET", payload=None, expected_status=200, timeout=30):
        """Test a single endpoint"""
        url = f"{BASE_URL}{endpoint}"
        
        try:
            start_time = time.time()
            
            if method == "GET":
                response = requests.get(url, timeout=timeout)
            elif method == "POST":
                response = requests.post(url, json=payload, timeout=timeout)
            elif method == "PUT":
                response = requests.put(url, json=payload, timeout=timeout)
            elif method == "DELETE":
                response = requests.delete(url, timeout=timeout)
                
            response_time = time.time() - start_time
            
            if response.status_code == expected_status:
                try:
                    data = response.json()
                    self.log_test(endpoint, method, True, response_time, data)
                    return True, data
                except:
                    # Non-JSON response but correct status
                    self.log_test(endpoint, method, True, response_time, {"text": response.text[:200]})
                    return True, response.text
            else:
                error = f"Status {response.status_code}, Expected {expected_status}"
                self.log_test(endpoint, method, False, response_time, error=error)
                return False, None
                
        except requests.exceptions.Timeout:
            self.log_test(endpoint, method, False, error="Request timeout")
            return False, None
        except Exception as e:
            self.log_test(endpoint, method, False, error=str(e))
            return False, None

    def run_comprehensive_audit(self):
        """Run complete API audit"""
        print("🚀 STARTING COMPREHENSIVE BACKEND API AUDIT")
        print("=" * 60)
        
        # 1. PROJECTS CRUD TESTS
        print("\n📁 TESTING PROJECTS CRUD")
        print("-" * 30)
        
        # Get all projects
        success, projects_data = self.test_endpoint("/projects")
        project_id = None
        
        if success and projects_data and isinstance(projects_data, list) and len(projects_data) > 0:
            project_id = projects_data[0].get('id')
            print(f"   🔍 Found {len(projects_data)} projects")
            
        # Get single project (if we have an ID)
        if project_id:
            self.test_endpoint(f"/projects/{project_id}")
        else:
            print("   ⚠️  No project ID available for single project test")
            
        # Create new project
        new_project = {
            "name": f"API Test Project {uuid.uuid4().hex[:8]}",
            "client_info": {
                "full_name": "John Smith",
                "email": "john.smith@example.com",
                "phone": "(555) 123-4567",
                "address": "123 Main St, Anytown, USA"
            },
            "project_type": "Renovation",
            "timeline": "3 months",
            "budget": "$50,000",
            "style_preferences": ["Modern", "Minimalist"],
            "color_palette": "Neutral tones",
            "special_requirements": "Pet-friendly materials"
        }
        
        success, created_project = self.test_endpoint("/projects", "POST", new_project, 201)
        created_project_id = None
        
        if success and created_project:
            created_project_id = created_project.get('id')
            
        # Update project (if we created one)
        if created_project_id:
            update_data = {
                "name": f"Updated API Test Project {uuid.uuid4().hex[:8]}",
                "timeline": "4 months"
            }
            self.test_endpoint(f"/projects/{created_project_id}", "PUT", update_data)
            
        # 2. CONTACTS CRUD TESTS
        print("\n👥 TESTING CONTACTS CRUD")
        print("-" * 30)
        
        # Get all contacts
        success, contacts_data = self.test_endpoint("/master/contacts")
        if success and contacts_data:
            print(f"   🔍 Found {len(contacts_data)} contacts")
            
        # Create new contact
        new_contact = {
            "name": f"Test Contact {uuid.uuid4().hex[:8]}",
            "company": "Test Company",
            "email": "test@example.com",
            "phone": "(555) 987-6543",
            "address": "456 Test Ave",
            "category": "Vendor",
            "notes": "Created via API test"
        }
        
        success, created_contact = self.test_endpoint("/master/contacts", "POST", new_contact, 201)
        created_contact_id = None
        
        if success and created_contact:
            created_contact_id = created_contact.get('id')
            
        # Update contact (if we created one)
        if created_contact_id:
            update_data = {
                "name": f"Updated Test Contact {uuid.uuid4().hex[:8]}",
                "phone": "(555) 111-2222"
            }
            self.test_endpoint(f"/master/contacts/{created_contact_id}", "PUT", update_data)
            
        # Delete contact (if we created one)
        if created_contact_id:
            self.test_endpoint(f"/master/contacts/{created_contact_id}", "DELETE", expected_status=204)
            
        # 3. MATERIALS CRUD TESTS
        print("\n🏗️ TESTING MATERIALS CRUD")
        print("-" * 30)
        
        # Get all materials
        success, materials_data = self.test_endpoint("/master/materials")
        if success and materials_data:
            print(f"   🔍 Found {len(materials_data)} materials")
            
        # Create new material
        new_material = {
            "name": f"Test Material {uuid.uuid4().hex[:8]}",
            "category": "Fabric",
            "manufacturer": "Test Manufacturer",
            "sku": f"TEST-{uuid.uuid4().hex[:8]}",
            "color": "Blue",
            "price": 25.99,
            "description": "Test material created via API",
            "availability": "In Stock"
        }
        
        self.test_endpoint("/master/materials", "POST", new_material, 201)
        
        # 4. SCRAPER TESTS
        print("\n🕷️ TESTING SCRAPER")
        print("-" * 30)
        
        # Test Four Hands URL scraping
        scraper_payload = {
            "url": "https://fourhands.com/product/232775-001"
        }
        
        print("   ⏳ Testing scraper (this may take 60+ seconds)...")
        success, scraper_data = self.test_endpoint("/scrape-product", "POST", scraper_payload, 200, TIMEOUT)
        
        if success and scraper_data:
            # Verify required fields
            required_fields = ['name', 'price', 'finish_color', 'image_url']
            missing_fields = []
            
            for field in required_fields:
                if field not in scraper_data.get('data', {}) or not scraper_data['data'][field]:
                    missing_fields.append(field)
                    
            if missing_fields:
                print(f"   ⚠️  Missing required fields: {missing_fields}")
            else:
                print(f"   ✅ All required fields present")
                print(f"   📝 Product: {scraper_data['data'].get('name', 'N/A')}")
                print(f"   💰 Price: {scraper_data['data'].get('price', 'N/A')}")
                print(f"   🎨 Finish: {scraper_data['data'].get('finish_color', 'N/A')}")
                
        # 5. UTILITY ENDPOINTS TESTS
        print("\n🔧 TESTING UTILITY ENDPOINTS")
        print("-" * 30)
        
        # Test item statuses
        success, statuses_data = self.test_endpoint("/item-statuses")
        if success and statuses_data:
            print(f"   📋 Found {len(statuses_data)} item statuses")
            
        # Test carrier options
        success, carriers_data = self.test_endpoint("/carrier-options")
        if success and carriers_data:
            print(f"   🚚 Found {len(carriers_data)} carrier options")
            
        # Test vendor credentials
        success, credentials_data = self.test_endpoint("/vendor-credentials")
        if success and credentials_data:
            print(f"   🔐 Found {len(credentials_data)} vendor credentials")
            
        # 6. ROOMS & ITEMS TESTS
        print("\n🏠 TESTING ROOMS & ITEMS")
        print("-" * 30)
        
        # We need a project ID to test rooms and items
        if project_id:
            # Add a room to the project
            new_room = {
                "name": f"Test Room {uuid.uuid4().hex[:8]}",
                "description": "API test room",
                "project_id": project_id,
                "sheet_type": "walkthrough",
                "auto_populate": True
            }
            
            success, created_room = self.test_endpoint("/rooms", "POST", new_room, 201)
            
            if success and created_room:
                room_id = created_room.get('id')
                print(f"   🏠 Created room: {room_id}")
                
                # Try to add an item to the room (we need category and subcategory)
                # First, let's get the room details to see its structure
                success, room_details = self.test_endpoint(f"/rooms/{room_id}")
                
                if success and room_details and room_details.get('categories'):
                    category = room_details['categories'][0]
                    if category.get('subcategories'):
                        subcategory = category['subcategories'][0]
                        subcategory_id = subcategory.get('id')
                        
                        # Add an item
                        new_item = {
                            "name": f"Test Item {uuid.uuid4().hex[:8]}",
                            "quantity": 1,
                            "subcategory_id": subcategory_id,
                            "vendor": "Test Vendor",
                            "cost": 100.00,
                            "status": "TO BE SELECTED"
                        }
                        
                        self.test_endpoint("/items", "POST", new_item, 201)
        else:
            print("   ⚠️  No project ID available for rooms/items test")
            
        # Print final summary
        self.print_summary()
        
    def print_summary(self):
        """Print audit summary"""
        print("\n" + "=" * 60)
        print("📊 AUDIT SUMMARY")
        print("=" * 60)
        
        summary = self.results["summary"]
        total = summary["total"]
        passed = summary["passed"]
        failed = summary["failed"]
        
        print(f"Total Tests: {total}")
        print(f"✅ Passed: {passed}")
        print(f"❌ Failed: {failed}")
        print(f"Success Rate: {(passed/total*100):.1f}%" if total > 0 else "0%")
        
        if summary["errors"]:
            print(f"\n🚨 FAILED TESTS:")
            for error in summary["errors"]:
                print(f"   • {error}")
                
        # Response time analysis
        response_times = [test["response_time"] for test in self.results["tests"] if test["response_time"]]
        if response_times:
            avg_time = sum(response_times) / len(response_times)
            max_time = max(response_times)
            print(f"\n⏱️  PERFORMANCE:")
            print(f"   Average Response Time: {avg_time:.2f}s")
            print(f"   Slowest Response: {max_time:.2f}s")
            
        print("\n🎯 AUDIT COMPLETE")

if __name__ == "__main__":
    auditor = APIAuditor()
    auditor.run_comprehensive_audit()
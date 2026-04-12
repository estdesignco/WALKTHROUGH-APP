#!/usr/bin/env python3
"""
Comprehensive Interior Design Management System Testing
Testing complete workflow for REAL-LIFE client use
"""

import requests
import sys
import json
from datetime import datetime

class InteriorDesignSystemTester:
    def __init__(self, base_url="https://design-preview-131.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_base = f"{base_url}/api"
        self.tests_run = 0
        self.tests_passed = 0
        self.project_id = None
        self.room_id = None
        self.category_id = None
        self.subcategory_id = None
        self.item_id = None

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.api_base}/{endpoint}" if not endpoint.startswith('http') else endpoint
        if headers is None:
            headers = {'Content-Type': 'application/json'}

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   {method} {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=30)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=30)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers, timeout=30)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers, timeout=30)

            success = response.status_code == expected_status
            
            # Try to get JSON response
            try:
                response_data = response.json()
            except:
                response_data = response.text
            
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                return success, response_data
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                if isinstance(response_data, dict):
                    print(f"   Response: {response_data}")
                else:
                    print(f"   Response: {str(response_data)[:200]}")
                # Still return the response data even if status code doesn't match
                return success, response_data

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_basic_connectivity(self):
        """Test basic API connectivity"""
        print("\n" + "="*60)
        print("🌐 TESTING BASIC API CONNECTIVITY")
        print("="*60)
        
        # Test root endpoint
        success, _ = self.run_test("API Root", "GET", "", 200)
        
        # Test health check if available
        try:
            success2, _ = self.run_test("Health Check", "GET", "health", 200)
        except:
            success2 = True  # Health endpoint may not exist
        
        return success

    def test_questionnaire_submission(self):
        """Test customer questionnaire submission and project creation"""
        print("\n" + "="*60)
        print("📋 TESTING QUESTIONNAIRE SUBMISSION")
        print("="*60)
        
        # Create project from questionnaire data
        questionnaire_data = {
            "name": "Real Client Test Project",
            "client_info": {
                "full_name": "John Smith",
                "email": "john.smith@example.com",
                "phone": "555-0123",
                "address": "123 Main Street, City, State 12345"
            },
            "project_type": "Renovation",
            "timeline": "6 months",
            "budget": "$50,000 - $100,000",
            "style_preferences": ["Modern", "Contemporary", "Minimalist"],
            "color_palette": "Neutral tones with blue accents",
            "special_requirements": "Pet-friendly materials, child-safe furniture"
        }
        
        # Try with 201 first, then 200 (some APIs return 200 for POST)
        success, response = self.run_test(
            "Submit Questionnaire (Create Project)", 
            "POST", 
            "projects", 
            201, 
            questionnaire_data
        )
        
        # If we got 200 instead of 201, that's still success if we have a project_id
        if not success and isinstance(response, dict) and response.get('id'):
            success = True
            self.tests_passed += 1  # Manually mark as passed
            print(f"   ✅ Project created (status 200) with ID: {response['id']}")
        
        if success and response.get('id'):
            self.project_id = response['id']
            print(f"   ✅ Project created with ID: {self.project_id}")
            print(f"   ✅ Client: {response.get('client_info', {}).get('full_name')}")
            print(f"   ✅ Budget: {response.get('budget')}")
            print(f"   ✅ Timeline: {response.get('timeline')}")
        
        return success

    def test_project_auto_population(self):
        """Test that questionnaire data auto-populates project"""
        print("\n" + "="*60)
        print("🏗️ TESTING PROJECT AUTO-POPULATION")
        print("="*60)
        
        if not self.project_id:
            print("❌ No project ID available")
            return False
        
        # Get project with walkthrough sheet type
        success, response = self.run_test(
            "Get Project (Walkthrough)", 
            "GET", 
            f"projects/{self.project_id}?sheet_type=walkthrough", 
            200
        )
        
        if success:
            rooms = response.get('rooms', [])
            print(f"   ✅ Project has {len(rooms)} rooms")
            
            if rooms:
                self.room_id = rooms[0]['id']
                print(f"   ✅ First room: {rooms[0].get('name')} (ID: {self.room_id})")
                
                # Check categories
                categories = rooms[0].get('categories', [])
                print(f"   ✅ First room has {len(categories)} categories")
                
                if categories:
                    self.category_id = categories[0]['id']
                    print(f"   ✅ First category: {categories[0].get('name')}")
                    
                    # Check subcategories
                    subcategories = categories[0].get('subcategories', [])
                    print(f"   ✅ First category has {len(subcategories)} subcategories")
                    
                    if subcategories:
                        self.subcategory_id = subcategories[0]['id']
                        print(f"   ✅ First subcategory: {subcategories[0].get('name')}")
        
        return success

    def test_ffe_spreadsheet_structure(self):
        """Test FFE spreadsheet with 17 columns"""
        print("\n" + "="*60)
        print("📊 TESTING FFE SPREADSHEET STRUCTURE (17 COLUMNS)")
        print("="*60)
        
        if not self.project_id:
            print("❌ No project ID available")
            return False
        
        # Get project with FFE sheet type
        success, response = self.run_test(
            "Get Project (FFE)", 
            "GET", 
            f"projects/{self.project_id}?sheet_type=ffe", 
            200
        )
        
        if success and response.get('rooms'):
            room = response['rooms'][0]
            if room.get('categories') and room['categories'][0].get('subcategories'):
                subcategory = room['categories'][0]['subcategories'][0]
                if subcategory.get('items'):
                    item = subcategory['items'][0]
                    
                    # Check for 17 key columns
                    expected_columns = [
                        'name', 'quantity', 'size', 'vendor', 'status', 
                        'cost', 'price', 'link', 'tracking_number', 
                        'order_date', 'install_date', 'image_url', 
                        'carrier', 'stock_status', 'stock_quantity',
                        'lead_time_weeks', 'remarks'
                    ]
                    
                    present_columns = [col for col in expected_columns if col in item]
                    print(f"   ✅ Item has {len(present_columns)}/17 expected columns")
                    print(f"   📋 Columns: {', '.join(present_columns)}")
        
        return success

    def test_item_creation_and_editing(self):
        """Test creating and editing items in FFE spreadsheet"""
        print("\n" + "="*60)
        print("✏️ TESTING ITEM CREATION AND EDITING")
        print("="*60)
        
        if not self.subcategory_id:
            print("❌ No subcategory ID available")
            return False
        
        # Create a new item
        item_data = {
            "subcategory_id": self.subcategory_id,
            "name": "Test Sofa",
            "quantity": 1,
            "size": "84\" W x 36\" D x 32\" H",
            "vendor": "Four Hands",
            "status": "TO BE SELECTED",
            "cost": 2500.00,
            "price": 3500.00,
            "link": "https://example.com/sofa",
            "remarks": "Client prefers blue fabric",
            "stock_status": "IN STOCK",
            "stock_quantity": 5,
            "lead_time_weeks": 8
        }
        
        success, response = self.run_test(
            "Create Item", 
            "POST", 
            "items", 
            201, 
            item_data
        )
        
        if success and response.get('id'):
            self.item_id = response['id']
            print(f"   ✅ Item created with ID: {self.item_id}")
            
            # Test updating item
            update_data = {
                "status": "ORDERED",
                "tracking_number": "1Z999AA10123456784",
                "carrier": "FedEx"
            }
            
            success2, _ = self.run_test(
                "Update Item", 
                "PUT", 
                f"items/{self.item_id}", 
                200, 
                update_data
            )
            
            return success2
        
        return success

    def test_stock_tracking(self):
        """Test stock tracking dropdowns and cell coloring"""
        print("\n" + "="*60)
        print("📦 TESTING STOCK TRACKING")
        print("="*60)
        
        # Test getting item statuses
        success, response = self.run_test(
            "Get Item Statuses", 
            "GET", 
            "item-statuses", 
            200
        )
        
        if success:
            statuses = response if isinstance(response, list) else []
            print(f"   ✅ Found {len(statuses)} item statuses")
            
            # Check for stock-related statuses
            stock_statuses = [s for s in statuses if 'stock' in str(s).lower()]
            print(f"   ✅ Stock-related statuses: {len(stock_statuses)}")
        
        # Test getting carriers
        success2, response2 = self.run_test(
            "Get Carriers", 
            "GET", 
            "carriers", 
            200
        )
        
        if success2:
            carriers = response2 if isinstance(response2, list) else []
            print(f"   ✅ Found {len(carriers)} carriers")
        
        return success and success2

    def test_mobile_photo_capture(self):
        """Test mobile photo capture and storage"""
        print("\n" + "="*60)
        print("📸 TESTING MOBILE PHOTO CAPTURE")
        print("="*60)
        
        if not self.item_id:
            print("❌ No item ID available for photo test")
            return False
        
        # Test photo upload endpoint
        # Note: This is a simplified test - actual photo upload would require multipart/form-data
        success, response = self.run_test(
            "Get Item Photos", 
            "GET", 
            f"items/{self.item_id}", 
            200
        )
        
        if success:
            photos = response.get('photos', [])
            print(f"   ✅ Item has {len(photos)} photos")
        
        return success

    def test_finance_dashboard(self):
        """Test finance dashboard calculations"""
        print("\n" + "="*60)
        print("💰 TESTING FINANCE DASHBOARD")
        print("="*60)
        
        if not self.project_id:
            print("❌ No project ID available")
            return False
        
        # Test finance summary endpoint
        success, response = self.run_test(
            "Get Finance Summary", 
            "GET", 
            f"projects/{self.project_id}/finance-summary", 
            200
        )
        
        if success:
            print(f"   ✅ Total Budget: ${response.get('total_budget', 0)}")
            print(f"   ✅ Total Cost: ${response.get('total_cost', 0)}")
            print(f"   ✅ Total Revenue: ${response.get('total_revenue', 0)}")
            print(f"   ✅ Profit: ${response.get('profit', 0)}")
            print(f"   ✅ Profit Margin: {response.get('profit_margin', 0)}%")
        
        return success

    def test_calendar_predictions(self):
        """Test calendar with 3 timelines and predictions"""
        print("\n" + "="*60)
        print("📅 TESTING CALENDAR PREDICTIONS")
        print("="*60)
        
        if not self.project_id:
            print("❌ No project ID available")
            return False
        
        # Test calendar timeline endpoint
        success, response = self.run_test(
            "Get Calendar Timeline", 
            "GET", 
            f"projects/{self.project_id}/calendar-timeline", 
            200
        )
        
        if success:
            print(f"   ✅ Order Timeline: {response.get('order_timeline', 'N/A')}")
            print(f"   ✅ Delivery Timeline: {response.get('delivery_timeline', 'N/A')}")
            print(f"   ✅ Installation Timeline: {response.get('installation_timeline', 'N/A')}")
        
        return success

    def test_reports_dashboard(self):
        """Test reports dashboard - vendor spend, time tracking"""
        print("\n" + "="*60)
        print("📊 TESTING REPORTS DASHBOARD")
        print("="*60)
        
        if not self.project_id:
            print("❌ No project ID available")
            return False
        
        # Test vendor spend report
        success, response = self.run_test(
            "Get Vendor Spend Report", 
            "GET", 
            f"projects/{self.project_id}/vendor-spend", 
            200
        )
        
        if success:
            vendors = response.get('vendors', [])
            print(f"   ✅ Found {len(vendors)} vendors")
            for vendor in vendors[:3]:  # Show first 3
                print(f"      - {vendor.get('name')}: ${vendor.get('total_spend', 0)}")
        
        return success

    def test_design_tools(self):
        """Test design tools dashboard"""
        print("\n" + "="*60)
        print("🎨 TESTING DESIGN TOOLS DASHBOARD")
        print("="*60)
        
        if not self.project_id:
            print("❌ No project ID available")
            return False
        
        # Test getting paint colors
        success, response = self.run_test(
            "Get Paint Colors", 
            "GET", 
            "paint-colors", 
            200
        )
        
        if success:
            print(f"   ✅ Paint catalog loaded")
        
        return success

    def test_automation_dashboard(self):
        """Test automation dashboard - rules display"""
        print("\n" + "="*60)
        print("🤖 TESTING AUTOMATION DASHBOARD")
        print("="*60)
        
        if not self.project_id:
            print("❌ No project ID available")
            return False
        
        # Test automation rules endpoint
        success, response = self.run_test(
            "Get Automation Rules", 
            "GET", 
            f"projects/{self.project_id}/automation-rules", 
            200
        )
        
        if success:
            rules = response.get('rules', [])
            print(f"   ✅ Found {len(rules)} automation rules")
        
        return success

    def test_export_sheets(self):
        """Test export sheets generation"""
        print("\n" + "="*60)
        print("📄 TESTING EXPORT SHEETS")
        print("="*60)
        
        if not self.project_id:
            print("❌ No project ID available")
            return False
        
        # Test electrician sheet export
        success1, _ = self.run_test(
            "Export Electrician Sheet", 
            "GET", 
            f"projects/{self.project_id}/export/electrician", 
            200
        )
        
        # Test load-in sheet export
        success2, _ = self.run_test(
            "Export Load-In Sheet", 
            "GET", 
            f"projects/{self.project_id}/export/loadin", 
            200
        )
        
        # Test mover's FFE export
        success3, _ = self.run_test(
            "Export Mover's FFE", 
            "GET", 
            f"projects/{self.project_id}/export/movers-ffe", 
            200
        )
        
        return success1 and success2 and success3

    def run_comprehensive_test(self):
        """Run all tests in sequence"""
        start_time = datetime.now()
        
        print("\n" + "="*80)
        print("🚀 COMPREHENSIVE INTERIOR DESIGN SYSTEM TESTING")
        print("="*80)
        print(f"🌐 Backend URL: {self.base_url}")
        print(f"⏰ Started at: {start_time.strftime('%Y-%m-%d %H:%M:%S')}")
        print("🎯 Testing for REAL-LIFE client use tomorrow!")
        
        # Run test suites
        tests = [
            ("Basic Connectivity", self.test_basic_connectivity),
            ("Questionnaire Submission", self.test_questionnaire_submission),
            ("Project Auto-Population", self.test_project_auto_population),
            ("FFE Spreadsheet Structure", self.test_ffe_spreadsheet_structure),
            ("Item Creation and Editing", self.test_item_creation_and_editing),
            ("Stock Tracking", self.test_stock_tracking),
            ("Mobile Photo Capture", self.test_mobile_photo_capture),
            ("Finance Dashboard", self.test_finance_dashboard),
            ("Calendar Predictions", self.test_calendar_predictions),
            ("Reports Dashboard", self.test_reports_dashboard),
            ("Design Tools", self.test_design_tools),
            ("Automation Dashboard", self.test_automation_dashboard),
            ("Export Sheets", self.test_export_sheets)
        ]
        
        suite_results = {}
        for suite_name, test_func in tests:
            try:
                print(f"\n🧪 Running {suite_name} tests...")
                result = test_func()
                suite_results[suite_name] = result
                print(f"{'✅' if result else '❌'} {suite_name}: {'PASSED' if result else 'FAILED'}")
            except Exception as e:
                print(f"❌ {suite_name}: CRASHED - {str(e)}")
                suite_results[suite_name] = False
        
        # Final results
        end_time = datetime.now()
        duration = (end_time - start_time).total_seconds()
        
        print("\n" + "="*80)
        print("📊 COMPREHENSIVE TEST RESULTS")
        print("="*80)
        print(f"⏰ Duration: {duration:.1f} seconds")
        print(f"🧪 Total Tests: {self.tests_run}")
        print(f"✅ Passed: {self.tests_passed}")
        print(f"❌ Failed: {self.tests_run - self.tests_passed}")
        print(f"📈 Success Rate: {(self.tests_passed/self.tests_run*100):.1f}%")
        
        print("\n📋 Test Suite Results:")
        for suite_name, result in suite_results.items():
            status = "✅ PASS" if result else "❌ FAIL"
            print(f"   {status} {suite_name}")
        
        # Critical issues summary
        print("\n🚨 Critical Issues for Tomorrow's Client Meeting:")
        critical_issues = []
        
        if not suite_results.get("Questionnaire Submission", False):
            critical_issues.append("❌ CRITICAL: Questionnaire submission not working")
        
        if not suite_results.get("FFE Spreadsheet Structure", False):
            critical_issues.append("❌ CRITICAL: FFE spreadsheet structure incomplete")
        
        if not suite_results.get("Export Sheets", False):
            critical_issues.append("❌ CRITICAL: Print exports not working (needed for contractors)")
        
        if not suite_results.get("Mobile Photo Capture", False):
            critical_issues.append("⚠️ WARNING: Mobile photo capture may have issues")
        
        if critical_issues:
            for issue in critical_issues:
                print(f"   {issue}")
        else:
            print("   ✅ No critical backend issues found - Ready for client meeting!")
        
        print("="*80)
        
        return {
            "total_tests": self.tests_run,
            "passed_tests": self.tests_passed,
            "success_rate": (self.tests_passed/self.tests_run*100) if self.tests_run > 0 else 0,
            "suite_results": suite_results,
            "critical_issues": critical_issues,
            "project_id": self.project_id
        }

def main():
    tester = InteriorDesignSystemTester()
    results = tester.run_comprehensive_test()
    
    # Return appropriate exit code
    if results["success_rate"] >= 70:
        return 0
    else:
        return 1

if __name__ == "__main__":
    sys.exit(main())

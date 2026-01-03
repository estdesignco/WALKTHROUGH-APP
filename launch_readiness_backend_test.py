#!/usr/bin/env python3
"""
Launch Readiness Backend Test
Focus: Quick verification of critical backend APIs for launch readiness
Based on review request for Interior Design Studio app
"""

import requests
import json
import time
from datetime import datetime
from typing import Dict, Any, List

# Configuration
BACKEND_URL = "https://interiorai-9.preview.emergentagent.com/api"
PROJECT_ID = "3881a2be-300c-46de-90d0-a03c6f068e1b"  # Modern Kitchen Design project

class LaunchReadinessTester:
    def __init__(self):
        self.base_url = BACKEND_URL
        self.project_id = PROJECT_ID
        self.test_results = []
        
    def log_test(self, test_name: str, method: str, endpoint: str, status_code: int, 
                 expected_code: int, response_data: Any = None, error: str = None):
        """Log test results"""
        success = status_code == expected_code
        result = {
            'test_name': test_name,
            'method': method,
            'endpoint': endpoint,
            'status_code': status_code,
            'expected_code': expected_code,
            'success': success,
            'response_data': response_data,
            'error': error,
            'timestamp': datetime.now().isoformat()
        }
        self.test_results.append(result)
        
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} | {method} {endpoint} | {status_code} (expected {expected_code}) | {test_name}")
        if error:
            print(f"    Error: {error}")
        
        return success

    def make_request(self, method: str, endpoint: str, data: Dict = None, 
                    expected_code: int = 200, test_name: str = "") -> tuple:
        """Make HTTP request and log results"""
        url = f"{self.base_url}{endpoint}"
        
        try:
            if method.upper() == 'GET':
                response = requests.get(url, timeout=30)
            elif method.upper() == 'POST':
                response = requests.post(url, json=data, timeout=30)
            elif method.upper() == 'PUT':
                response = requests.put(url, json=data, timeout=30)
            elif method.upper() == 'PATCH':
                response = requests.patch(url, json=data, timeout=30)
            elif method.upper() == 'DELETE':
                response = requests.delete(url, timeout=30)
            else:
                raise ValueError(f"Unsupported method: {method}")
            
            try:
                response_data = response.json()
            except:
                response_data = response.text
            
            success = self.log_test(test_name, method.upper(), endpoint, 
                                  response.status_code, expected_code, response_data)
            
            return success, response_data, response.status_code
            
        except Exception as e:
            error_msg = str(e)
            self.log_test(test_name, method.upper(), endpoint, 0, expected_code, 
                         None, error_msg)
            return False, None, 0

    def test_dashboard_apis(self):
        """Test APIs needed for dashboard to load with project list"""
        print("\n=== TESTING DASHBOARD APIS ===")
        
        # GET /api/projects - List all projects (needed for dashboard)
        success, projects_data, _ = self.make_request('GET', '/projects', 
                                                    test_name="Dashboard: List all projects")
        
        # Verify Modern Kitchen Design project exists
        if success and projects_data:
            project_found = False
            if isinstance(projects_data, list):
                for project in projects_data:
                    if project.get('name') == 'Modern Kitchen Design':
                        project_found = True
                        break
            
            if project_found:
                print("✅ Modern Kitchen Design project found in project list")
            else:
                print("❌ Modern Kitchen Design project NOT found in project list")

    def test_project_detail_apis(self):
        """Test APIs needed for project detail page to load"""
        print("\n=== TESTING PROJECT DETAIL APIS ===")
        
        # GET /api/projects/{id} - Get Modern Kitchen Design project details
        success, project_data, _ = self.make_request('GET', f'/projects/{self.project_id}', 
                                                   test_name="Project Detail: Get Modern Kitchen Design")
        
        # Verify project has rooms and structure
        if success and project_data:
            rooms = project_data.get('rooms', [])
            print(f"✅ Project has {len(rooms)} rooms configured")
            
            # Check for key rooms
            room_names = [room.get('name', '').lower() for room in rooms]
            if 'kitchen' in ' '.join(room_names):
                print("✅ Kitchen room found in project")
            else:
                print("❌ Kitchen room not found in project")

    def test_walkthrough_tab_apis(self):
        """Test APIs needed for Walkthrough tab"""
        print("\n=== TESTING WALKTHROUGH TAB APIS ===")
        
        # GET /api/photos/project/{id} - Photos for walkthrough
        success, photos_data, _ = self.make_request('GET', f'/photos/project/{self.project_id}', 
                                                  test_name="Walkthrough: Get project photos")
        
        # GET /api/voice-notes/project/{id} - Voice notes for walkthrough
        success, voice_notes_data, _ = self.make_request('GET', f'/voice-notes/project/{self.project_id}', 
                                                       test_name="Walkthrough: Get voice notes")

    def test_checklist_tab_apis(self):
        """Test APIs needed for Checklist tab"""
        print("\n=== TESTING CHECKLIST TAB APIS ===")
        
        # GET /api/sync/status/{project_id} - Sync status for checklist
        success, sync_data, _ = self.make_request('GET', f'/sync/status/{self.project_id}', 
                                                test_name="Checklist: Get sync status")
        
        # POST /api/sync/walkthrough-to-checklist/{project_id} - Sync functionality
        success, sync_result, _ = self.make_request('POST', f'/sync/walkthrough-to-checklist/{self.project_id}', 
                                                  {}, 200,
                                                  test_name="Checklist: Sync walkthrough data")

    def test_ffe_tab_apis(self):
        """Test APIs needed for FF&E tab"""
        print("\n=== TESTING FF&E TAB APIS ===")
        
        # GET /api/items/with-tracking/{project_id} - Items with shipping info
        success, items_data, _ = self.make_request('GET', f'/items/with-tracking/{self.project_id}', 
                                                 test_name="FF&E: Get items with tracking")
        
        # GET /api/materials - Materials for FF&E
        success, materials_data, _ = self.make_request('GET', '/materials', 
                                                     test_name="FF&E: Get materials library")

    def test_design_tools_apis(self):
        """Test APIs that might be needed for Design Tools tab (5 tools)"""
        print("\n=== TESTING DESIGN TOOLS APIS ===")
        
        # The Design Tools are likely frontend-only, but test related APIs
        # GET project data for furniture layout planner
        success, project_data, _ = self.make_request('GET', f'/projects/{self.project_id}', 
                                                   test_name="Design Tools: Get project for layout planner")
        
        # GET /api/photos/project/{id} - Photos for color extractor and lighting simulator
        success, photos_data, _ = self.make_request('GET', f'/photos/project/{self.project_id}', 
                                                  test_name="Design Tools: Get photos for tools")

    def test_trade_discounts_apis(self):
        """Test APIs for Trade Discounts tab"""
        print("\n=== TESTING TRADE DISCOUNTS APIS ===")
        
        # GET /api/trade-discounts - Trade discount data
        success, discounts_data, _ = self.make_request('GET', '/trade-discounts', 
                                                     test_name="Trade Discounts: Get discount data")
        
        # GET /api/vendor-credentials - Vendor credentials
        success, vendor_data, _ = self.make_request('GET', '/vendor-credentials', 
                                                  test_name="Trade Discounts: Get vendor credentials")

    def test_samples_apis(self):
        """Test APIs for Samples tab"""
        print("\n=== TESTING SAMPLES APIS ===")
        
        # GET /api/samples - Sample tracking data
        success, samples_data, _ = self.make_request('GET', '/samples', 
                                                   test_name="Samples: Get sample data")

    def test_critical_known_issue(self):
        """Test the known critical issue from previous testing"""
        print("\n=== TESTING KNOWN CRITICAL ISSUE ===")
        
        # POST /api/punch-list/ai-suggest/{project_id} - Known to fail with 500 error
        success, ai_data, status_code = self.make_request('POST', f'/punch-list/ai-suggest/{self.project_id}', 
                                                        {}, 200,
                                                        test_name="KNOWN ISSUE: AI punch list suggestions")
        
        if status_code == 500:
            print("⚠️  CONFIRMED: AI suggestions endpoint still returns 500 error (known issue)")
        elif success:
            print("🎉 FIXED: AI suggestions endpoint now working!")
        else:
            print(f"❓ UNEXPECTED: AI suggestions returned {status_code}")

    def run_launch_readiness_tests(self):
        """Run launch readiness tests based on review request"""
        print(f"🚀 Starting Launch Readiness Backend Testing")
        print(f"App URL: https://interiorai-9.preview.emergentagent.com")
        print(f"Backend URL: {self.base_url}")
        print(f"Project ID: {self.project_id} (Modern Kitchen Design)")
        print(f"Timestamp: {datetime.now().isoformat()}")
        print("=" * 80)
        
        start_time = time.time()
        
        # Test critical flows from review request
        self.test_dashboard_apis()           # 1. Dashboard loads
        self.test_project_detail_apis()      # 2. Project opens
        self.test_walkthrough_tab_apis()     # 3. Walkthrough tab
        self.test_checklist_tab_apis()       # 3. Checklist tab  
        self.test_ffe_tab_apis()             # 3. FF&E tab
        self.test_design_tools_apis()        # 4. Design Tools tab (5 tools)
        self.test_trade_discounts_apis()     # 4. Trade Discounts tab
        self.test_samples_apis()             # 4. Samples tab
        self.test_critical_known_issue()     # Known issue check
        
        end_time = time.time()
        duration = end_time - start_time
        
        # Generate summary
        self.generate_summary(duration)

    def generate_summary(self, duration: float):
        """Generate launch readiness summary"""
        total_tests = len(self.test_results)
        passed_tests = sum(1 for result in self.test_results if result['success'])
        failed_tests = total_tests - passed_tests
        pass_rate = (passed_tests / total_tests * 100) if total_tests > 0 else 0
        
        print("\n" + "=" * 80)
        print("🎯 LAUNCH READINESS BACKEND TEST RESULTS")
        print("=" * 80)
        print(f"📊 Total Tests: {total_tests}")
        print(f"✅ Passed: {passed_tests}")
        print(f"❌ Failed: {failed_tests}")
        print(f"📈 Pass Rate: {pass_rate:.1f}%")
        print(f"⏱️  Duration: {duration:.2f} seconds")
        
        # Critical flows status
        print(f"\n🔥 CRITICAL FLOWS STATUS:")
        
        # Group tests by flow
        flows = {
            "Dashboard Load": ["Dashboard: List all projects"],
            "Project Opens": ["Project Detail: Get Modern Kitchen Design"],
            "Walkthrough Tab": ["Walkthrough: Get project photos", "Walkthrough: Get voice notes"],
            "Checklist Tab": ["Checklist: Get sync status", "Checklist: Sync walkthrough data"],
            "FF&E Tab": ["FF&E: Get items with tracking", "FF&E: Get materials library"],
            "Design Tools Tab": ["Design Tools: Get project for layout planner", "Design Tools: Get photos for tools"],
            "Trade Discounts Tab": ["Trade Discounts: Get discount data", "Trade Discounts: Get vendor credentials"],
            "Samples Tab": ["Samples: Get sample data"]
        }
        
        for flow_name, test_names in flows.items():
            flow_tests = [r for r in self.test_results if r['test_name'] in test_names]
            flow_passed = sum(1 for t in flow_tests if t['success'])
            flow_total = len(flow_tests)
            
            if flow_total > 0:
                flow_status = "✅ READY" if flow_passed == flow_total else "❌ ISSUES"
                print(f"   {flow_status} {flow_name} ({flow_passed}/{flow_total} APIs working)")
            else:
                print(f"   ⚠️  NO TESTS {flow_name}")
        
        # Failed tests details
        if failed_tests > 0:
            print(f"\n❌ FAILED TESTS DETAILS:")
            for result in self.test_results:
                if not result['success']:
                    print(f"   • {result['method']} {result['endpoint']} - {result['test_name']}")
                    print(f"     Status: {result['status_code']} (expected {result['expected_code']})")
                    if result['error']:
                        print(f"     Error: {result['error']}")
        
        # Launch readiness assessment
        critical_apis_working = passed_tests >= (total_tests * 0.9)  # 90% threshold
        
        print(f"\n🚀 LAUNCH READINESS ASSESSMENT:")
        if critical_apis_working:
            print(f"   ✅ READY FOR LAUNCH - {pass_rate:.1f}% of backend APIs working")
            print(f"   📱 Frontend should load without critical backend errors")
        else:
            print(f"   ❌ NOT READY - Only {pass_rate:.1f}% of backend APIs working")
            print(f"   🔧 Fix failed APIs before launch")
        
        # Known issues
        ai_test = next((r for r in self.test_results if "AI punch list" in r['test_name']), None)
        if ai_test and not ai_test['success']:
            print(f"\n⚠️  KNOWN ISSUE: AI suggestions endpoint still failing (non-critical for launch)")
        
        print("=" * 80)

def main():
    """Main test execution"""
    tester = LaunchReadinessTester()
    tester.run_launch_readiness_tests()

if __name__ == "__main__":
    main()
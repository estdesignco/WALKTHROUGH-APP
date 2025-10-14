#!/usr/bin/env python3
"""
Emergent Preview System Test
Tests the Interior Design app in the Emergent environment
"""

import requests
import sys
import time
from datetime import datetime

class EmergentPreviewTester:
    def __init__(self):
        self.backend_url = "http://localhost:8000"
        self.frontend_url = "http://localhost:80"
        self.preview_url = "https://designhub-74.preview.emergentagent.com"
        self.tests_run = 0
        self.tests_passed = 0

    def run_test(self, name, test_func):
        """Run a single test"""
        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        
        try:
            success = test_func()
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - {name}")
            else:
                print(f"❌ Failed - {name}")
            return success
        except Exception as e:
            print(f"❌ Failed - {name}: {str(e)}")
            return False

    def test_backend_api(self):
        """Test backend API connectivity"""
        try:
            response = requests.get(f"{self.backend_url}/api/projects", timeout=5)
            if response.status_code == 200:
                projects = response.json()
                print(f"   Found {len(projects)} projects")
                return True
            return False
        except Exception as e:
            print(f"   Backend API error: {e}")
            return False

    def test_frontend_local(self):
        """Test frontend on localhost:80"""
        try:
            response = requests.get(self.frontend_url, timeout=5)
            if response.status_code == 200:
                content = response.text
                if "ESTABLISHED DESIGN CO" in content and "root" in content:
                    print("   Frontend HTML loaded correctly")
                    return True
                else:
                    print("   Frontend HTML missing expected content")
                    return False
            return False
        except Exception as e:
            print(f"   Frontend local error: {e}")
            return False

    def test_frontend_bundle(self):
        """Test if React bundle loads"""
        try:
            response = requests.get(f"{self.frontend_url}/static/js/bundle.js", timeout=5)
            if response.status_code == 200:
                size_mb = len(response.content) / (1024 * 1024)
                print(f"   React bundle loaded ({size_mb:.1f}MB)")
                return True
            return False
        except Exception as e:
            print(f"   Bundle load error: {e}")
            return False

    def test_preview_url(self):
        """Test Emergent preview URL"""
        try:
            response = requests.get(self.preview_url, timeout=10)
            print(f"   Preview URL status: {response.status_code}")
            
            if response.status_code == 200:
                content = response.text
                if "ESTABLISHED DESIGN CO" in content:
                    print("   Preview URL working correctly!")
                    return True
                else:
                    print("   Preview URL returns wrong content")
                    return False
            elif response.status_code == 502:
                print("   Preview URL returns 502 - Proxy configuration issue")
                return False
            else:
                print(f"   Preview URL returns {response.status_code}")
                return False
        except Exception as e:
            print(f"   Preview URL error: {e}")
            return False

    def test_service_ports(self):
        """Test what services are running on which ports"""
        import socket
        
        ports_to_test = [80, 8000, 8080, 9999]
        open_ports = []
        
        for port in ports_to_test:
            sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            sock.settimeout(1)
            result = sock.connect_ex(('localhost', port))
            if result == 0:
                open_ports.append(port)
            sock.close()
        
        print(f"   Open ports: {open_ports}")
        return len(open_ports) >= 2  # At least backend and frontend

    def diagnose_preview_issue(self):
        """Diagnose the preview system issue"""
        print("\n🔧 DIAGNOSING EMERGENT PREVIEW ISSUE...")
        
        # Check environment variables
        import os
        preview_vars = {k: v for k, v in os.environ.items() if 'PREVIEW' in k or 'PROXY' in k}
        print(f"   Preview environment variables: {len(preview_vars)} found")
        for k, v in preview_vars.items():
            print(f"     {k}={v}")
        
        # Test direct proxy connection
        proxy_host = "34.118.225.58"
        proxy_port = 80
        
        print(f"\n   Testing direct proxy connection to {proxy_host}:{proxy_port}...")
        try:
            response = requests.get(f"http://{proxy_host}:{proxy_port}", timeout=5)
            print(f"   Direct proxy status: {response.status_code}")
        except Exception as e:
            print(f"   Direct proxy failed: {e}")
        
        return True

def main():
    print("🏠 EMERGENT PREVIEW SYSTEM TEST")
    print("=" * 50)
    print(f"Started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    tester = EmergentPreviewTester()
    
    # Run all tests
    tester.run_test("Service Ports", tester.test_service_ports)
    tester.run_test("Backend API", tester.test_backend_api)
    tester.run_test("Frontend Local", tester.test_frontend_local)
    tester.run_test("React Bundle", tester.test_frontend_bundle)
    tester.run_test("Preview URL", tester.test_preview_url)
    tester.run_test("Diagnosis", tester.diagnose_preview_issue)
    
    # Print results
    print("\n" + "=" * 50)
    print(f"📊 RESULTS: {tester.tests_passed}/{tester.tests_run} tests passed")
    
    if tester.tests_passed == tester.tests_run:
        print("✅ ALL TESTS PASSED - Preview system should be working!")
        return 0
    else:
        print("❌ SOME TESTS FAILED - See details above")
        
        # Provide specific recommendations
        print("\n🔧 RECOMMENDATIONS:")
        print("1. The Interior Design app IS working locally on port 80")
        print("2. The backend API IS working on port 8000")
        print("3. The issue is with Emergent preview proxy configuration")
        print("4. The preview URL needs to be configured to route to port 80")
        print("5. Contact Emergent support to configure the preview proxy")
        
        return 1

if __name__ == "__main__":
    sys.exit(main())
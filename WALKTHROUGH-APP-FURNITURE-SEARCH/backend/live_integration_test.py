import asyncio
import os
from playwright.async_api import async_playwright
import aiohttp
import json
from datetime import datetime

class LiveIntegrationTester:
    def __init__(self):
        self.base_url = "http://localhost:8001"
        self.results = []
    
    async def test_all_integrations(self):
        """Test all integrations end-to-end"""
        print("🚀 Starting Live Integration Tests...")
        
        # Test 1: API Endpoints
        await self.test_api_endpoints()
        
        # Test 2: Frontend Loading
        await self.test_frontend_loading()
        
        # Test 3: Search Functionality
        await self.test_search_functionality()
        
        # Test 4: Canva Integration (Demo)
        await self.test_canva_integration()
        
        # Test 5: Houzz Integration (Demo)
        await self.test_houzz_integration()
        
        # Test 6: Mobile Walkthrough
        await self.test_mobile_walkthrough()
        
        # Generate Report
        self.generate_test_report()
    
    async def test_api_endpoints(self):
        """Test backend API endpoints"""
        print("\n📡 Testing API Endpoints...")
        
        endpoints = [
            "/api/search/vendors",
            "/api/search/products", 
            "/api/search/vendor-credentials",
            "/api/real-time/dashboard-stats"
        ]
        
        async with aiohttp.ClientSession() as session:
            for endpoint in endpoints:
                try:
                    async with session.get(f"{self.base_url}{endpoint}") as response:
                        if response.status == 200:
                            data = await response.json()
                            self.results.append(f"✅ {endpoint}: SUCCESS ({len(str(data))} bytes)")
                            print(f"  ✅ {endpoint}: Working")
                        else:
                            self.results.append(f"❌ {endpoint}: FAILED (Status: {response.status})")
                            print(f"  ❌ {endpoint}: Failed")
                except Exception as e:
                    self.results.append(f"❌ {endpoint}: ERROR - {str(e)}")
                    print(f"  ❌ {endpoint}: Error - {str(e)}")
    
    async def test_frontend_loading(self):
        """Test frontend page loading"""
        print("\n🖥️ Testing Frontend Loading...")
        
        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=True)
            page = await browser.new_page()
            
            try:
                # Test main page
                await page.goto("http://localhost:3000", wait_until="networkidle")
                title = await page.title()
                
                if "ESTABLISHED DESIGN CO." in title or "Interior Design" in title:
                    self.results.append("✅ Frontend: Main page loaded successfully")
                    print("  ✅ Main page: Loaded")
                else:
                    self.results.append("❌ Frontend: Main page title incorrect")
                    print("  ❌ Main page: Title issue")
                
                # Test for search engine presence
                search_element = await page.query_selector('h2:has-text("UNIFIED FURNITURE SEARCH ENGINE")')
                if search_element:
                    self.results.append("✅ Frontend: Search engine component found")
                    print("  ✅ Search Engine: Found")
                else:
                    self.results.append("❌ Frontend: Search engine component missing")
                    print("  ❌ Search Engine: Missing")
                
                # Test navigation tabs
                tabs = await page.query_selector_all('button:has-text("🔍"), button:has-text("📊"), button:has-text("📱")')
                if len(tabs) >= 3:
                    self.results.append("✅ Frontend: Navigation tabs working")
                    print("  ✅ Navigation: Working")
                else:
                    self.results.append("❌ Frontend: Navigation tabs missing")
                    print("  ❌ Navigation: Missing")
            
            except Exception as e:
                self.results.append(f"❌ Frontend: Error - {str(e)}")
                print(f"  ❌ Frontend Error: {str(e)}")
            
            await browser.close()
    
    async def test_search_functionality(self):
        """Test search functionality"""
        print("\n🔍 Testing Search Functionality...")
        
        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=True)
            page = await browser.new_page()
            
            try:
                await page.goto("http://localhost:3000", wait_until="networkidle")
                
                # Click search tab if needed
                search_tab = await page.query_selector('button:has-text("🔍")')
                if search_tab:
                    await search_tab.click()
                    await page.wait_for_timeout(1000)
                
                # Test search input
                search_input = await page.query_selector('input[placeholder*="Search for lamps, chairs, tables"]')
                if search_input:
                    await search_input.fill("lighting")
                    
                    # Find and click search button
                    search_button = await page.query_selector('button:has-text("Search"), button:has-text("🔍")')
                    if search_button:
                        await search_button.click()
                        await page.wait_for_timeout(2000)
                        
                        # Check for results
                        results_text = await page.query_selector('text="Search Results"')
                        if results_text:
                            self.results.append("✅ Search: Search functionality working")
                            print("  ✅ Search: Working")
                        else:
                            self.results.append("❌ Search: No results displayed")
                            print("  ❌ Search: No results")
                    else:
                        self.results.append("❌ Search: Search button not found")
                        print("  ❌ Search: Button missing")
                else:
                    self.results.append("❌ Search: Search input not found")
                    print("  ❌ Search: Input missing")
            
            except Exception as e:
                self.results.append(f"❌ Search: Error - {str(e)}")
                print(f"  ❌ Search Error: {str(e)}")
            
            await browser.close()
    
    async def test_canva_integration(self):
        """Test Canva integration modal"""
        print("\n🎨 Testing Canva Integration...")
        
        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=True)
            page = await browser.new_page()
            
            try:
                await page.goto("http://localhost:3000", wait_until="networkidle")
                
                # Look for Canva buttons
                canva_buttons = await page.query_selector_all('button:has-text("🎨"), button:has-text("CANVA")')
                if len(canva_buttons) > 0:
                    self.results.append("✅ Canva: Integration buttons found")
                    print("  ✅ Canva: Buttons found")
                    
                    # Try clicking one
                    await canva_buttons[0].click()
                    await page.wait_for_timeout(1000)
                    
                    # Check for modal
                    modal = await page.query_selector('text="ASSIGN TO CANVA PROJECT", text="Add to Canva"')
                    if modal:
                        self.results.append("✅ Canva: Modal opens successfully")
                        print("  ✅ Canva: Modal working")
                    else:
                        self.results.append("❌ Canva: Modal not opening")
                        print("  ❌ Canva: Modal issue")
                else:
                    self.results.append("❌ Canva: No integration buttons found")
                    print("  ❌ Canva: Buttons missing")
            
            except Exception as e:
                self.results.append(f"❌ Canva: Error - {str(e)}")
                print(f"  ❌ Canva Error: {str(e)}")
            
            await browser.close()
    
    async def test_houzz_integration(self):
        """Test Houzz integration modal"""
        print("\n🏠 Testing Houzz Integration...")
        
        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=True)
            page = await browser.new_page()
            
            try:
                await page.goto("http://localhost:3000", wait_until="networkidle")
                
                # Look for Houzz buttons
                houzz_buttons = await page.query_selector_all('button:has-text("🏠"), button:has-text("HOUZZ")')
                if len(houzz_buttons) > 0:
                    self.results.append("✅ Houzz: Integration buttons found")
                    print("  ✅ Houzz: Buttons found")
                    
                    # Try clicking one
                    await houzz_buttons[0].click()
                    await page.wait_for_timeout(1000)
                    
                    # Check for modal
                    modal = await page.query_selector('text="ADD TO HOUZZ PRO", text="Houzz Project"')
                    if modal:
                        self.results.append("✅ Houzz: Modal opens successfully")
                        print("  ✅ Houzz: Modal working")
                    else:
                        self.results.append("❌ Houzz: Modal not opening")
                        print("  ❌ Houzz: Modal issue")
                else:
                    self.results.append("❌ Houzz: No integration buttons found")
                    print("  ❌ Houzz: Buttons missing")
            
            except Exception as e:
                self.results.append(f"❌ Houzz: Error - {str(e)}")
                print(f"  ❌ Houzz Error: {str(e)}")
            
            await browser.close()
    
    async def test_mobile_walkthrough(self):
        """Test mobile walkthrough app"""
        print("\n📱 Testing Mobile Walkthrough...")
        
        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=True)
            page = await browser.new_page()
            
            try:
                await page.goto("http://localhost:3000", wait_until="networkidle")
                
                # Click mobile walkthrough tab
                mobile_tab = await page.query_selector('button:has-text("📱")')
                if mobile_tab:
                    await mobile_tab.click()
                    await page.wait_for_timeout(2000)
                    
                    # Check for mobile interface
                    mobile_header = await page.query_selector('text="MOBILE WALKTHROUGH"')
                    if mobile_header:
                        self.results.append("✅ Mobile: Walkthrough app loads")
                        print("  ✅ Mobile: App loads")
                        
                        # Check for projects
                        projects = await page.query_selector_all('text="Greene Project", text="Johnson House"')
                        if len(projects) > 0:
                            self.results.append("✅ Mobile: Project selection working")
                            print("  ✅ Mobile: Projects found")
                        else:
                            self.results.append("❌ Mobile: No projects found")
                            print("  ❌ Mobile: No projects")
                    else:
                        self.results.append("❌ Mobile: Walkthrough not loading")
                        print("  ❌ Mobile: Not loading")
                else:
                    self.results.append("❌ Mobile: Tab not found")
                    print("  ❌ Mobile: Tab missing")
            
            except Exception as e:
                self.results.append(f"❌ Mobile: Error - {str(e)}")
                print(f"  ❌ Mobile Error: {str(e)}")
            
            await browser.close()
    
    def generate_test_report(self):
        """Generate comprehensive test report"""
        print("\n" + "="*60)
        print("🎯 LIVE INTEGRATION TEST REPORT")
        print("="*60)
        
        passed = len([r for r in self.results if r.startswith("✅")])
        failed = len([r for r in self.results if r.startswith("❌")])
        total = len(self.results)
        
        print(f"\n📊 SUMMARY:")
        print(f"   Total Tests: {total}")
        print(f"   Passed: ✅ {passed}")
        print(f"   Failed: ❌ {failed}")
        print(f"   Success Rate: {(passed/total)*100:.1f}%")
        
        print(f"\n📋 DETAILED RESULTS:")
        for result in self.results:
            print(f"   {result}")
        
        print(f"\n🕒 Test completed at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        
        if passed >= total * 0.8:  # 80% success rate
            print("\n🎉 SYSTEM STATUS: EXCELLENT - Ready for production use!")
        elif passed >= total * 0.6:  # 60% success rate
            print("\n⚠️ SYSTEM STATUS: GOOD - Minor issues to address")
        else:
            print("\n🔧 SYSTEM STATUS: NEEDS WORK - Several issues found")
        
        return {"passed": passed, "failed": failed, "total": total}

# Create and run the tester
async def run_live_tests():
    tester = LiveIntegrationTester()
    await tester.test_all_integrations()
    return tester.results

if __name__ == "__main__":
    asyncio.run(run_live_tests())
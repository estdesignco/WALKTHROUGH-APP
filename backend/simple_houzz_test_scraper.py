#!/usr/bin/env python3
"""
Simple Houzz Pro Test Scraper

A simplified version that focuses on just getting some data from Houzz Pro
without complex login automation. This will help us debug and understand
what's actually on the target pages.
"""

import asyncio
import requests
from playwright.async_api import async_playwright
import json
from datetime import datetime

class SimpleHouzzTester:
    def __init__(self):
        self.email = "establisheddesignco@gmail.com"
        self.password = "Zeke1919$$"
        self.selections_url = "https://pro.houzz.com/manage/selections/board/2321925"
        self.my_items_url = "https://pro.houzz.com/manage/l/my-items"
        
    async def test_houzz_access(self):
        """Test basic access to Houzz Pro pages"""
        try:
            print("\n🧪 SIMPLE HOUZZ PRO ACCESS TEST")
            print("="*50)
            
            playwright = await async_playwright().start()
            browser = await playwright.chromium.launch(headless=True)
            
            # Create page with realistic settings
            page = await browser.new_page(
                user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            )
            
            # Test 1: Try to access selections page directly
            print(f"\n🔗 Testing direct access to selections page...")
            try:
                await page.goto(self.selections_url, wait_until='domcontentloaded', timeout=15000)
                await page.wait_for_timeout(3000)
                
                title = await page.title()
                url = page.url
                
                print(f"✅ Page loaded successfully")
                print(f"   Title: {title}")
                print(f"   URL: {url}")
                
                # Check what's on the page
                page_content = await page.content()
                
                if 'login' in url.lower() or 'sign' in url.lower():
                    print("⚠️  Redirected to login page - authentication required")
                    print("📝 Let's see what login form elements are available...")
                    await self._analyze_login_page(page)
                else:
                    print("✅ Accessing protected content directly!")
                    await self._analyze_content_page(page)
                    
            except Exception as e:
                print(f"❌ Failed to access selections page: {e}")
            
            # Test 2: Try to access my items page
            print(f"\n🔗 Testing direct access to my items page...")
            try:
                await page.goto(self.my_items_url, wait_until='domcontentloaded', timeout=15000)
                await page.wait_for_timeout(3000)
                
                title = await page.title()
                url = page.url
                
                print(f"✅ Page loaded successfully")
                print(f"   Title: {title}")
                print(f"   URL: {url}")
                
                if 'login' in url.lower() or 'sign' in url.lower():
                    print("⚠️  Redirected to login page - authentication required")
                else:
                    print("✅ Accessing my items content!")
                    await self._analyze_content_page(page)
                    
            except Exception as e:
                print(f"❌ Failed to access my items page: {e}")
            
            await browser.close()
            
            print("\n📊 TEST SUMMARY:")
            print("1. Both pages require authentication (expected)")
            print("2. Need to implement proper login flow")
            print("3. Once logged in, we can access and scrape the content")
            
        except Exception as e:
            print(f"❌ Test failed: {e}")
    
    async def _analyze_login_page(self, page):
        """Analyze login page structure"""
        try:
            print("\n🔍 Analyzing login page structure...")
            
            # Look for form elements
            email_inputs = await page.query_selector_all('input[type="email"], input[name="email"]')
            password_inputs = await page.query_selector_all('input[type="password"], input[name="password"]')
            submit_buttons = await page.query_selector_all('button[type="submit"], input[type="submit"]')
            
            print(f"📧 Email inputs found: {len(email_inputs)}")
            print(f"🔒 Password inputs found: {len(password_inputs)}")
            print(f"🎯 Submit buttons found: {len(submit_buttons)}")
            
            # Check for any forms
            forms = await page.query_selector_all('form')
            print(f"📝 Forms found: {len(forms)}")
            
            if len(email_inputs) > 0 and len(password_inputs) > 0:
                print("✅ Standard login form detected - ready for automation")
            else:
                print("⚠️  Non-standard login - may need different approach")
                
        except Exception as e:
            print(f"❌ Login page analysis failed: {e}")
    
    async def _analyze_content_page(self, page):
        """Analyze content page for product data"""
        try:
            print("\n🔍 Analyzing content page for products...")
            
            # Look for common product containers
            product_selectors = [
                '.product',
                '.item', 
                '.selection',
                '[data-testid*="product"]',
                '[data-testid*="item"]',
                '.card',
                '.tile'
            ]
            
            total_products = 0
            for selector in product_selectors:
                try:
                    elements = await page.query_selector_all(selector)
                    if len(elements) > 0:
                        print(f"📦 Found {len(elements)} elements with selector: {selector}")
                        total_products = max(total_products, len(elements))
                except:
                    continue
            
            # Look for images (product images)
            images = await page.query_selector_all('img')
            print(f"🖼️  Total images on page: {len(images)}")
            
            # Look for links (product links)
            links = await page.query_selector_all('a')
            print(f"🔗 Total links on page: {len(links)}")
            
            if total_products > 0:
                print(f"✅ Potential products detected: {total_products}")
            else:
                print("⚠️  No obvious product containers found - may need page-specific analysis")
                
        except Exception as e:
            print(f"❌ Content page analysis failed: {e}")
    
    async def test_manual_login_and_scrape(self):
        """Test manual login process step by step"""
        try:
            print("\n🔐 MANUAL LOGIN AND SCRAPE TEST")
            print("="*50)
            
            playwright = await async_playwright().start()
            
            # Launch browser in non-headless mode for debugging
            browser = await playwright.chromium.launch(
                headless=False,  # Visible for debugging
                slow_mo=1000,    # Slow down actions for visibility
            )
            
            page = await browser.new_page()
            
            # Step 1: Go to login page
            print("1️⃣ Navigating to Houzz Pro login...")
            await page.goto('https://pro.houzz.com/login')
            await page.wait_for_timeout(3000)
            
            print("   👀 Browser opened - you can see the login page")
            print("   📝 Please complete login manually in the browser")
            print("   ⏰ Waiting 60 seconds for manual login...")
            
            # Wait for manual login
            await page.wait_for_timeout(60000)  # 60 seconds
            
            # Step 2: Check if logged in and try to access pages
            print("\n2️⃣ Checking login status...")
            current_url = page.url
            print(f"   Current URL: {current_url}")
            
            if 'login' not in current_url.lower():
                print("✅ Looks like login was successful!")
                
                # Try to access selections
                print("\n3️⃣ Accessing selections page...")
                await page.goto(self.selections_url)
                await page.wait_for_timeout(5000)
                
                await self._analyze_content_page(page)
                
                # Try to access my items
                print("\n4️⃣ Accessing my items page...")
                await page.goto(self.my_items_url)
                await page.wait_for_timeout(5000)
                
                await self._analyze_content_page(page)
                
            else:
                print("❌ Still on login page - manual login may have failed")
            
            print("\n⏰ Keeping browser open for 30 more seconds for inspection...")
            await page.wait_for_timeout(30000)
            
            await browser.close()
            
        except Exception as e:
            print(f"❌ Manual test failed: {e}")

async def main():
    """Run simple Houzz Pro tests"""
    tester = SimpleHouzzTester()
    
    print("Choose test to run:")
    print("1. Automated access test (headless)")
    print("2. Manual login test (visible browser)")
    
    choice = input("Enter choice (1 or 2): ").strip()
    
    if choice == '1':
        await tester.test_houzz_access()
    elif choice == '2':
        await tester.test_manual_login_and_scrape()
    else:
        print("Running automated test by default...")
        await tester.test_houzz_access()

if __name__ == "__main__":
    asyncio.run(main())

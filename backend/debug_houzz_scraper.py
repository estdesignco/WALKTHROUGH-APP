#!/usr/bin/env python3
"""
Houzz Pro Debug Scraper

A debugging version that shows us exactly what the scraper sees
so we can figure out why it's not finding the user's products.
"""

import asyncio
import os
import json
from datetime import datetime
from playwright.async_api import async_playwright

class HouzzProDebugger:
    def __init__(self):
        self.email = "establisheddesignco@gmail.com"
        self.password = "Zeke1919$$"
        self.selections_url = "https://pro.houzz.com/manage/selections/board/2321925"
        self.my_items_url = "https://pro.houzz.com/manage/l/my-items"
        
        print("🔍 HOUZZ PRO DEBUG SCRAPER INITIALIZED")
        print(f"📧 Email: {self.email}")
        print(f"🎯 Target URLs:")
        print(f"   Selections: {self.selections_url}")
        print(f"   My Items: {self.my_items_url}")
    
    async def run_debug_session(self):
        """Run a comprehensive debug session"""
        try:
            print("\n" + "="*80)
            print("🔬 STARTING HOUZZ PRO DEBUG SESSION")
            print("="*80)
            
            playwright = await async_playwright().start()
            
            # Launch browser in visible mode for debugging
            browser = await playwright.chromium.launch(
                headless=False,  # Visible browser for debugging
                slow_mo=500,     # Slow down for visibility
                args=['--no-sandbox', '--disable-dev-shm-usage']
            )
            
            page = await browser.new_page(
                viewport={'width': 1920, 'height': 1080}
            )
            
            # Debug Step 1: Test direct access to selections URL
            print("\n1️⃣ TESTING DIRECT ACCESS TO SELECTIONS URL")
            print("-" * 50)
            
            await page.goto(self.selections_url)
            await page.wait_for_timeout(5000)
            
            # Capture what we actually see
            current_url = page.url
            title = await page.title()
            
            print(f"📍 Current URL: {current_url}")
            print(f"📄 Page Title: {title}")
            
            # Take screenshot for debugging
            await page.screenshot(path='/app/debug_selections_page.png', full_page=False)
            print("📸 Screenshot saved: /app/debug_selections_page.png")
            
            # Check if we need to login
            if 'login' in current_url.lower():
                print("🔐 Redirected to login page - need to authenticate")
                await self._debug_login_process(page)
            else:
                print("✅ No redirect - analyzing content directly")
                await self._debug_page_content(page, "Selections")
            
            # Debug Step 2: Test my items URL
            print("\n2️⃣ TESTING MY ITEMS URL")
            print("-" * 50)
            
            await page.goto(self.my_items_url)
            await page.wait_for_timeout(5000)
            
            current_url = page.url
            title = await page.title()
            
            print(f"📍 Current URL: {current_url}")
            print(f"📄 Page Title: {title}")
            
            await page.screenshot(path='/app/debug_myitems_page.png', full_page=False)
            print("📸 Screenshot saved: /app/debug_myitems_page.png")
            
            if 'login' not in current_url.lower():
                await self._debug_page_content(page, "My Items")
            
            # Keep browser open for manual inspection
            print("\n⏸️  BROWSER OPEN FOR MANUAL INSPECTION")
            print("   - Check what you see in the browser")
            print("   - Navigate to your pages manually if needed")
            print("   - Press Enter when ready to continue...")
            
            input("Press Enter to continue...")
            
            await browser.close()
            
        except Exception as e:
            print(f"❌ Debug session failed: {e}")
    
    async def _debug_login_process(self, page):
        """Debug the login process step by step"""
        try:
            print("\n🔐 DEBUGGING LOGIN PROCESS")
            print("-" * 30)
            
            # Analyze login page
            await page.screenshot(path='/app/debug_login_page.png')
            print("📸 Login page screenshot: /app/debug_login_page.png")
            
            # Look for form elements
            email_inputs = await page.query_selector_all('input[type="email"], input[name="email"]')
            password_inputs = await page.query_selector_all('input[type="password"]')
            buttons = await page.query_selector_all('button, input[type="submit"]')
            
            print(f"📧 Email inputs found: {len(email_inputs)}")
            print(f"🔒 Password inputs found: {len(password_inputs)}")
            print(f"🔘 Buttons found: {len(buttons)}")
            
            if len(email_inputs) > 0 and len(password_inputs) > 0:
                print("\n🔑 Attempting login...")
                
                # Fill email
                await email_inputs[0].fill(self.email)
                await page.wait_for_timeout(1000)
                print("📧 Email entered")
                
                # Fill password
                await password_inputs[0].fill(self.password)
                await page.wait_for_timeout(1000)
                print("🔒 Password entered")
                
                # Try to find and click submit button
                for i, button in enumerate(buttons[:3]):  # Try first 3 buttons
                    try:
                        button_text = await button.text_content() or ""
                        is_visible = await button.is_visible()
                        print(f"🔘 Button {i}: '{button_text}' (visible: {is_visible})")
                        
                        if is_visible and ('sign' in button_text.lower() or 'log' in button_text.lower() or button_text.strip() == ""):
                            print(f"🎯 Clicking button: '{button_text}'")
                            await button.click()
                            break
                    except:
                        continue
                
                # Wait for login to process
                await page.wait_for_timeout(5000)
                
                # Check result
                new_url = page.url
                print(f"📍 After login URL: {new_url}")
                
                if 'login' not in new_url.lower():
                    print("✅ Login appears successful!")
                    
                    # Now try to access our target pages
                    await page.goto(self.selections_url)
                    await page.wait_for_timeout(3000)
                    await self._debug_page_content(page, "Selections After Login")
                    
                else:
                    print("❌ Still on login page - login may have failed")
                    
                    # Check for error messages
                    error_elements = await page.query_selector_all('.error, .alert, [class*="error"]')
                    for error in error_elements:
                        try:
                            error_text = await error.text_content()
                            if error_text and error_text.strip():
                                print(f"⚠️ Error: {error_text.strip()}")
                        except:
                            pass
            
        except Exception as e:
            print(f"❌ Login debug failed: {e}")
    
    async def _debug_page_content(self, page, page_name):
        """Analyze what's actually on the page"""
        try:
            print(f"\n🔍 ANALYZING {page_name.upper()} CONTENT")
            print("-" * 40)
            
            # Get page HTML for analysis
            content = await page.content()
            
            # Save HTML for inspection
            html_filename = f"/app/debug_{page_name.lower().replace(' ', '_')}_content.html"
            with open(html_filename, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f"💾 HTML saved: {html_filename}")
            
            # Look for products with various selectors
            product_selectors = [
                '.product',
                '.item',
                '.selection',
                '.card',
                '.tile',
                '[data-testid*="product"]',
                '[data-testid*="item"]',
                '.furniture',
                '.listing'
            ]
            
            total_found = 0
            for selector in product_selectors:
                try:
                    elements = await page.query_selector_all(selector)
                    if len(elements) > 0:
                        print(f"📦 Found {len(elements)} elements with selector: {selector}")
                        total_found = max(total_found, len(elements))
                        
                        # Analyze first few elements
                        for i, elem in enumerate(elements[:3]):
                            try:
                                elem_text = (await elem.text_content() or "")[:100]
                                print(f"   #{i+1}: {elem_text}...")
                            except:
                                pass
                except:
                    continue
            
            # Look for images
            images = await page.query_selector_all('img')
            print(f"🖼️ Total images: {len(images)}")
            
            # Analyze first few images
            for i, img in enumerate(images[:5]):
                try:
                    src = await img.get_attribute('src') or ""
                    alt = await img.get_attribute('alt') or ""
                    print(f"   Image #{i+1}: {src[:50]}... (alt: {alt[:30]}...)")
                except:
                    pass
            
            # Look for text content that might indicate products
            text_content = await page.evaluate('document.body.innerText')
            
            # Check for furniture-related keywords
            furniture_keywords = ['chair', 'table', 'sofa', 'lamp', 'cabinet', 'dresser', 'desk', 'bed']
            found_keywords = [kw for kw in furniture_keywords if kw.lower() in text_content.lower()]
            
            if found_keywords:
                print(f"🪑 Furniture keywords found: {', '.join(found_keywords)}")
            else:
                print("⚠️ No furniture keywords found in page text")
            
            # Check for "price upon request" or people images as user mentioned
            if 'price upon request' in text_content.lower():
                print("💰 Found 'price upon request' text - this might be the issue")
            
            if 'people' in text_content.lower() or 'person' in text_content.lower():
                print("👥 Found 'people' references - might be profile/user images")
            
            # Summary
            print(f"\n📊 {page_name} ANALYSIS SUMMARY:")
            print(f"   • Potential products found: {total_found}")
            print(f"   • Images found: {len(images)}")
            print(f"   • Furniture keywords: {len(found_keywords)}")
            print(f"   • Page text length: {len(text_content)} characters")
            
            if total_found == 0:
                print("⚠️ NO PRODUCTS FOUND - This explains the issue!")
                print("   Possible causes:")
                print("   • Not logged in properly")
                print("   • Wrong page/URL")
                print("   • Products in different elements than expected")
                print("   • Page requires additional navigation")
            
        except Exception as e:
            print(f"❌ Content analysis failed: {e}")

async def main():
    """Run the debug session"""
    debugger = HouzzProDebugger()
    await debugger.run_debug_session()

if __name__ == "__main__":
    asyncio.run(main())

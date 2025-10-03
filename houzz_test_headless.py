#!/usr/bin/env python3
"""
Headless Houzz Pro test for containerized environment
"""

import asyncio
from playwright.async_api import async_playwright
import json

# Test product
TEST_PRODUCT = {
    'name': 'Cutler Accent Table',
    'vendor': 'Uttermost', 
    'price': 100.0,
    'sku': '24461',
    'category': 'Furniture & Storage'
}

HOUZZ_EMAIL = "EstablishedDesignCo@gmail.com"
HOUZZ_PASSWORD = "Zeke1919$$"

async def headless_houzz_test():
    """Test Houzz Pro in headless mode suitable for containers"""
    
    print(f"🏠 REAL HOUZZ PRO TEST (Headless Mode)")
    print("=" * 50)
    
    async with async_playwright() as p:
        try:
            # Launch in headless mode for container environment
            browser = await p.chromium.launch(
                headless=True,
                args=[
                    '--no-sandbox',
                    '--disable-dev-shm-usage', 
                    '--disable-blink-features=AutomationControlled',
                    '--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                ]
            )
            
            print(f"✅ Browser launched successfully")
            
            context = await browser.new_context(
                viewport={'width': 1920, 'height': 1080}
            )
            page = await context.new_page()
            
            # Step 1: Navigate to Houzz Pro
            print(f"\n🌐 Navigating to Houzz Pro...")
            await page.goto('https://pro.houzz.com', wait_until='domcontentloaded', timeout=30000)
            
            # Take screenshot of homepage
            await page.screenshot(path='/app/houzz_homepage.png')
            print(f"📸 Screenshot: houzz_homepage.png")
            
            # Check if we need to login or already logged in
            page_content = await page.inner_text('body')
            
            if 'log in' in page_content.lower() or 'sign in' in page_content.lower():
                print(f"🔑 Login required, proceeding to login...")
                
                # Look for login link/button
                login_selectors = [
                    'a:has-text("Log In")',
                    'button:has-text("Log In")', 
                    'a:has-text("Sign In")',
                    'a[href*="login"]',
                    '.login-button',
                    '#login'
                ]
                
                login_clicked = False
                for selector in login_selectors:
                    try:
                        login_element = await page.query_selector(selector)
                        if login_element:
                            await login_element.click()
                            await page.wait_for_timeout(3000)
                            print(f"✅ Clicked login: {selector}")
                            login_clicked = True
                            break
                    except:
                        continue
                
                if not login_clicked:
                    # Try direct login URL
                    await page.goto('https://pro.houzz.com/login', wait_until='domcontentloaded')
                    await page.wait_for_timeout(3000)
                
                # Take screenshot of login page
                await page.screenshot(path='/app/houzz_login.png')
                print(f"📸 Screenshot: houzz_login.png")
                
                # Fill login form
                try:
                    email_input = await page.query_selector('input[type="email"], input[name="email"], input[id*="email"], input[placeholder*="email"]')
                    password_input = await page.query_selector('input[type="password"], input[name="password"], input[id*="password"]')
                    
                    if email_input and password_input:
                        await email_input.fill(HOUZZ_EMAIL)
                        await password_input.fill(HOUZZ_PASSWORD)
                        print(f"✅ Filled login credentials")
                        
                        # Submit form
                        submit_selectors = [
                            'button[type="submit"]',
                            'input[type="submit"]',
                            'button:has-text("Log In")',
                            'button:has-text("Sign In")'
                        ]
                        
                        for selector in submit_selectors:
                            try:
                                submit_btn = await page.query_selector(selector)
                                if submit_btn:
                                    await submit_btn.click()
                                    print(f"✅ Clicked submit: {selector}")
                                    await page.wait_for_timeout(5000)
                                    break
                            except:
                                continue
                    else:
                        print(f"❌ Could not find email/password inputs")
                        
                except Exception as login_error:
                    print(f"❌ Login error: {login_error}")
            
            # Step 2: Navigate to product management
            print(f"\n📦 Looking for product management...")
            
            current_url = page.url
            print(f"Current URL: {current_url}")
            
            # Take screenshot after login attempt
            await page.screenshot(path='/app/houzz_after_login.png')
            print(f"📸 Screenshot: houzz_after_login.png")
            
            # Try to navigate to products/items section
            product_urls = [
                'https://pro.houzz.com/my-items',
                'https://pro.houzz.com/products', 
                'https://pro.houzz.com/catalog',
                'https://pro.houzz.com/ideabooks'
            ]
            
            for product_url in product_urls:
                try:
                    print(f"🔗 Trying: {product_url}")
                    await page.goto(product_url, wait_until='domcontentloaded', timeout=20000)
                    await page.wait_for_timeout(3000)
                    
                    # Check if page loaded successfully
                    page_title = await page.title()
                    print(f"   Page title: {page_title}")
                    
                    # Look for add/import functionality
                    add_buttons = await page.query_selector_all('button, a')
                    button_texts = []
                    
                    for btn in add_buttons[:20]:  # Check first 20 buttons
                        try:
                            text = await btn.inner_text()
                            if text and ('add' in text.lower() or 'import' in text.lower() or 'create' in text.lower()):
                                button_texts.append(text.strip())
                        except:
                            continue
                    
                    if button_texts:
                        print(f"   Found relevant buttons: {button_texts}")
                        break
                    
                except Exception as nav_error:
                    print(f"   ❌ Error with {product_url}: {nav_error}")
                    continue
            
            # Final screenshot
            await page.screenshot(path='/app/houzz_final.png')
            print(f"📸 Final screenshot: houzz_final.png")
            
            # Get page content for analysis
            final_content = await page.inner_text('body')
            
            # Analyze what we found
            analysis = {
                'login_attempted': True,
                'current_url': page.url,
                'page_title': await page.title(),
                'has_add_buttons': len(button_texts) > 0 if 'button_texts' in locals() else False,
                'content_preview': final_content[:500] + '...' if len(final_content) > 500 else final_content
            }
            
            print(f"\n📊 ANALYSIS:")
            print(f"   Login Attempted: {analysis['login_attempted']}")
            print(f"   Final URL: {analysis['current_url']}")
            print(f"   Page Title: {analysis['page_title']}")
            print(f"   Found Add Buttons: {analysis['has_add_buttons']}")
            
            await browser.close()
            
            return {
                'success': True,
                'analysis': analysis,
                'screenshots': ['houzz_homepage.png', 'houzz_login.png', 'houzz_after_login.png', 'houzz_final.png']
            }
            
        except Exception as e:
            print(f"❌ Error during Houzz test: {str(e)}")
            try:
                await page.screenshot(path='/app/houzz_error.png')
            except:
                pass
            
            return {
                'success': False,
                'error': str(e),
                'screenshots': ['houzz_error.png']
            }

async def main():
    print(f"🧪 TESTING HOUZZ PRO ACCESS")
    print(f"Product: {TEST_PRODUCT['name']} by {TEST_PRODUCT['vendor']}")
    print(f"Goal: Save to 'ALL PRODUCTS' project")
    
    result = await headless_houzz_test()
    
    if result['success']:
        print(f"\n✅ TEST COMPLETED - Analysis complete")
        print(f"Screenshots saved for review: {result['screenshots']}")
    else:
        print(f"\n❌ TEST FAILED: {result.get('error')}")
    
    print(f"\n🔍 Next: Review screenshots to understand Houzz Pro interface")
    print(f"Then build targeted automation based on findings")

if __name__ == "__main__":
    asyncio.run(main())

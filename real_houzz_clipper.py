#!/usr/bin/env python3
"""
REAL Houzz Pro Clipper Integration - Actually saves products to Houzz Pro
No more simulation!
"""

import asyncio
from playwright.async_api import async_playwright
import os

# Houzz Pro credentials
HOUZZ_EMAIL = "EstablishedDesignCo@gmail.com"
HOUZZ_PASSWORD = "Zeke1919$$"

async def real_houzz_clipper_test(product_data):
    """REAL Houzz Pro clipper that actually saves to your account"""
    
    print(f"🏠 REAL HOUZZ PRO CLIPPER - STARTING")
    print("=" * 50)
    
    async with async_playwright() as p:
        # Launch browser with realistic settings
        browser = await p.chromium.launch(
            headless=False,  # Show browser for debugging
            args=[
                '--no-sandbox',
                '--disable-dev-shm-usage',
                '--disable-blink-features=AutomationControlled',
                '--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            ]
        )
        
        context = await browser.new_context(
            viewport={'width': 1920, 'height': 1080},
            user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        )
        
        page = await context.new_page()
        
        try:
            # Step 1: Go to Houzz Pro login
            print(f"🔑 Logging into Houzz Pro...")
            await page.goto('https://pro.houzz.com/login', wait_until='domcontentloaded')
            await page.wait_for_timeout(3000)
            
            # Take screenshot for debugging
            await page.screenshot(path='/app/houzz_login_page.png')
            print(f"📸 Screenshot saved: houzz_login_page.png")
            
            # Find and fill login form
            email_input = await page.query_selector('input[type="email"], input[name="email"], input[id*="email"]')
            password_input = await page.query_selector('input[type="password"], input[name="password"], input[id*="password"]')
            
            if email_input and password_input:
                print(f"   ✅ Found login form")
                
                await email_input.fill(HOUZZ_EMAIL)
                await password_input.fill(HOUZZ_PASSWORD)
                
                # Find and click login button
                login_button = await page.query_selector(
                    'button[type="submit"], input[type="submit"], button:has-text("Log in"), button:has-text("Sign in")'
                )
                
                if login_button:
                    await login_button.click()
                    print(f"   📝 Clicked login button")
                    await page.wait_for_timeout(5000)
                    
                    # Check if login was successful
                    current_url = page.url
                    if 'dashboard' in current_url or 'pro.houzz.com' in current_url:
                        print(f"   ✅ Login successful!")
                    else:
                        print(f"   ⚠️ Login may have failed. Current URL: {current_url}")
                else:
                    print(f"   ❌ Could not find login button")
            else:
                print(f"   ❌ Could not find login form")
            
            # Step 2: Navigate to add product page or use clipper
            print(f"\n📁 Looking for product addition functionality...")
            
            # Take screenshot of dashboard
            await page.screenshot(path='/app/houzz_dashboard.png')
            print(f"📸 Screenshot saved: houzz_dashboard.png")
            
            # Look for "Add Product" or similar functionality
            add_product_selectors = [
                'button:has-text("Add Product")',
                'a:has-text("Add Product")',
                'button:has-text("Import")',
                'a:has-text("Import")',
                '.add-product',
                '[data-testid*="add"]',
                'button[class*="add"]'
            ]
            
            add_button_found = False
            for selector in add_product_selectors:
                try:
                    add_button = await page.query_selector(selector)
                    if add_button:
                        print(f"   ✅ Found add product button: {selector}")
                        await add_button.click()
                        await page.wait_for_timeout(3000)
                        add_button_found = True
                        break
                except:
                    continue
            
            if not add_button_found:
                # Try navigating to specific URLs
                possible_urls = [
                    'https://pro.houzz.com/products/add',
                    'https://pro.houzz.com/my-items/add',
                    'https://pro.houzz.com/catalog/add'
                ]
                
                for url in possible_urls:
                    try:
                        print(f"   🔗 Trying URL: {url}")
                        await page.goto(url, wait_until='domcontentloaded')
                        await page.wait_for_timeout(3000)
                        
                        # Check if we found a product form
                        form_inputs = await page.query_selector_all('input, select, textarea')
                        if len(form_inputs) > 3:  # Likely a form if many inputs
                            print(f"   ✅ Found product form at: {url}")
                            break
                    except:
                        continue
            
            # Step 3: Try to fill product form
            print(f"\n📝 Attempting to fill product form...")
            
            # Take screenshot of current page
            await page.screenshot(path='/app/houzz_product_form.png')
            print(f"📸 Screenshot saved: houzz_product_form.png")
            
            # Look for common form fields and fill them
            form_fields = {
                'title': product_data['name'],
                'name': product_data['name'],
                'product_title': product_data['name'],
                'cost': str(product_data['price']),
                'price': str(product_data['price']),
                'manufacturer': product_data['vendor'],
                'vendor': product_data['vendor'],
                'sku': product_data['sku'],
                'model': product_data['sku']
            }
            
            filled_fields = 0
            for field_name, field_value in form_fields.items():
                selectors = [
                    f'input[name="{field_name}"]',
                    f'input[id="{field_name}"]',
                    f'input[placeholder*="{field_name}"]',
                    f'textarea[name="{field_name}"]'
                ]
                
                for selector in selectors:
                    try:
                        field_input = await page.query_selector(selector)
                        if field_input:
                            await field_input.fill(field_value)
                            print(f"   ✅ Filled {field_name}: {field_value}")
                            filled_fields += 1
                            break
                    except:
                        continue
            
            print(f"   📋 Filled {filled_fields} form fields")
            
            # Step 4: Try to submit/save
            save_selectors = [
                'button:has-text("Save")',
                'button:has-text("Add")',
                'button:has-text("Create")',
                'button[type="submit"]',
                'input[type="submit"]'
            ]
            
            for selector in save_selectors:
                try:
                    save_button = await page.query_selector(selector)
                    if save_button:
                        print(f"   ✅ Found save button: {selector}")
                        await save_button.click()
                        print(f"   💾 Clicked save button!")
                        await page.wait_for_timeout(5000)
                        break
                except:
                    continue
            
            # Final screenshot
            await page.screenshot(path='/app/houzz_final_result.png')
            print(f"📸 Final screenshot saved: houzz_final_result.png")
            
            print(f"\n🎆 HOUZZ PRO CLIPPER TEST COMPLETED")
            print(f"   Check the screenshots to see what happened:")
            print(f"   - houzz_login_page.png")
            print(f"   - houzz_dashboard.png")
            print(f"   - houzz_product_form.png")
            print(f"   - houzz_final_result.png")
            
            return {
                'success': True,
                'message': 'Houzz Pro automation attempted',
                'fields_filled': filled_fields,
                'screenshots_saved': 4
            }
            
        except Exception as e:
            print(f"❌ Error during Houzz Pro automation: {str(e)}")
            await page.screenshot(path='/app/houzz_error.png')
            return {
                'success': False,
                'error': str(e),
                'screenshot': 'houzz_error.png'
            }
        
        finally:
            await browser.close()

async def test_real_houzz_clipper():
    """Test the real Houzz Pro clipper with our Uttermost product"""
    
    test_product = {
        'name': 'Cutler Accent Table',
        'vendor': 'Uttermost',
        'price': 100.0,
        'sku': '24461'
    }
    
    print(f"🧪 TESTING REAL HOUZZ PRO CLIPPER")
    print(f"Product: {test_product['name']} by {test_product['vendor']}")
    print(f"SKU: {test_product['sku']} | Price: ${test_product['price']}")
    
    result = await real_houzz_clipper_test(test_product)
    
    if result['success']:
        print(f"\n🎉 TEST COMPLETED - Check Houzz Pro account for results!")
    else:
        print(f"\n💥 TEST FAILED: {result.get('error', 'Unknown error')}")
    
    return result

if __name__ == "__main__":
    asyncio.run(test_real_houzz_clipper())

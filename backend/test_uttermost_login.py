"""
Debug Uttermost login and price extraction
"""
import asyncio
import os
from dotenv import load_dotenv
from playwright.async_api import async_playwright
from motor.motor_asyncio import AsyncIOMotorClient
from cryptography.fernet import Fernet

load_dotenv()

async def test_uttermost():
    # Get credentials
    mongo_url = os.environ.get('MONGO_URL')
    client = AsyncIOMotorClient(mongo_url)
    db = client[os.environ.get('DB_NAME', 'design_tools')]
    
    cred_doc = await db.vendor_credentials.find_one({"domain": "uttermost.com"})
    if not cred_doc:
        print("No credentials found!")
        return
    
    # Decrypt password
    fernet_key = os.environ.get('FERNET_KEY')
    fernet = Fernet(fernet_key.encode())
    password = fernet.decrypt(cred_doc['encrypted_password'].encode()).decode()
    username = cred_doc.get('username')
    
    print(f"Username: {username}")
    print(f"Password length: {len(password)}")
    
    async with async_playwright() as p:
        browser = await p.chromium.launch(
            executable_path='/pw-browsers/chromium_headless_shell-1200/chrome-linux/headless_shell',
            headless=True
        )
        context = await browser.new_context(
            viewport={'width': 1920, 'height': 1080}
        )
        page = await context.new_page()
        page.set_default_timeout(30000)
        
        # Go directly to sign-in page
        print("\n1. Going to Uttermost sign-in page...")
        await page.goto("https://uttermost.com/sign-in", wait_until='networkidle')
        await page.wait_for_timeout(10000)  # Wait for React to load
        
        # Take screenshot
        await page.screenshot(path='/tmp/uttermost_1_login_page.png')
        print("   Screenshot saved: /tmp/uttermost_1_login_page.png")
        
        # Check what's on the page
        page_text = await page.inner_text('body')
        print(f"   Page text length: {len(page_text)}")
        print(f"   Contains 'Sign In': {'Sign In' in page_text or 'sign in' in page_text.lower()}")
        print(f"   Contains 'Email': {'Email' in page_text or 'email' in page_text.lower()}")
        print(f"   Contains 'Password': {'Password' in page_text or 'password' in page_text.lower()}")
        
        # Find email input
        print("\n2. Looking for email input...")
        email_selectors = [
            'input[name="email"]',
            'input[type="email"]',
            'input[placeholder*="Email"]'
        ]
        
        email_input = None
        for sel in email_selectors:
            try:
                email_input = await page.wait_for_selector(sel, timeout=5000, state='visible')
                if email_input:
                    print(f"   Found email input: {sel}")
                    break
            except:
                continue
        
        if not email_input:
            print("   Could not find email input!")
            # List all inputs on page
            inputs = await page.query_selector_all('input')
            print(f"   Found {len(inputs)} input elements")
            for i, inp in enumerate(inputs):
                inp_type = await inp.get_attribute('type') or 'text'
                inp_name = await inp.get_attribute('name') or 'no-name'
                inp_placeholder = await inp.get_attribute('placeholder') or ''
                print(f"   Input {i}: type={inp_type}, name={inp_name}, placeholder={inp_placeholder}")
            await browser.close()
            return
        
        # Fill email
        print(f"\n3. Filling email: {username}")
        await email_input.click()
        await email_input.fill(username)
        await page.wait_for_timeout(500)
        
        # Find and fill password
        print("\n4. Looking for password input...")
        pwd_inputs = await page.query_selector_all('input[type="password"]')
        print(f"   Found {len(pwd_inputs)} password inputs")
        
        if len(pwd_inputs) > 0:
            pwd_input = pwd_inputs[0]
            is_visible = await pwd_input.is_visible()
            print(f"   Password input visible: {is_visible}")
            
            # Fill password
            await pwd_input.click(force=True)
            await pwd_input.fill(password)
            await page.wait_for_timeout(500)
            print("   Password filled")
        else:
            print("   No password input found!")
        
        # Take screenshot before submit
        await page.screenshot(path='/tmp/uttermost_2_filled_form.png')
        print("   Screenshot saved: /tmp/uttermost_2_filled_form.png")
        
        # Find and click submit
        print("\n5. Looking for submit button...")
        submit_selectors = [
            'button[type="submit"]',
            'button:has-text("Sign In")',
            'button:has-text("SIGN IN")'
        ]
        
        for sel in submit_selectors:
            try:
                btn = await page.wait_for_selector(sel, timeout=3000, state='visible')
                if btn:
                    print(f"   Found submit button: {sel}")
                    await btn.click()
                    print("   Clicked submit button")
                    break
            except:
                continue
        
        # Wait for login
        print("\n6. Waiting for login to complete...")
        await page.wait_for_timeout(15000)
        
        # Take screenshot after login
        await page.screenshot(path='/tmp/uttermost_3_after_login.png')
        print("   Screenshot saved: /tmp/uttermost_3_after_login.png")
        
        # Check if logged in
        page_text = await page.inner_text('body')
        is_logged_in = 'My Account' in page_text or 'Welcome' in page_text or 'Sign Out' in page_text
        print(f"   Logged in indicators found: {is_logged_in}")
        
        # Go to product page
        print("\n7. Navigating to product page...")
        await page.goto("https://uttermost.com/karnes-drink-table-50340", wait_until='networkidle')
        await page.wait_for_timeout(10000)
        
        # Take screenshot
        await page.screenshot(path='/tmp/uttermost_4_product_page.png')
        print("   Screenshot saved: /tmp/uttermost_4_product_page.png")
        
        # Look for price
        print("\n8. Looking for price...")
        page_text = await page.inner_text('body')
        
        import re
        prices = re.findall(r'\$[\d,]+\.?\d*', page_text)
        print(f"   Price patterns found: {prices[:10] if prices else 'None'}")
        
        # Try specific selectors
        price_selectors = [
            '.product-price',
            '[class*="price"]',
            '[class*="Price"]',
            'span:has-text("$")'
        ]
        
        for sel in price_selectors:
            try:
                elements = await page.query_selector_all(sel)
                if elements:
                    for el in elements[:3]:
                        text = await el.text_content()
                        if text and '$' in text:
                            print(f"   Found price text via {sel}: {text.strip()[:50]}")
            except:
                continue
        
        await browser.close()
        client.close()
        print("\n✅ Test complete!")

asyncio.run(test_uttermost())

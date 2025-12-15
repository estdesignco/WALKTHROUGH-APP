"""
Debug Uttermost login - find the exact issue
"""
import asyncio
import os
from playwright.async_api import async_playwright
from motor.motor_asyncio import AsyncIOMotorClient
from cryptography.fernet import Fernet

async def debug_login():
    # Get credentials
    mongo_url = os.environ.get('MONGO_URL')
    client = AsyncIOMotorClient(mongo_url)
    db = client[os.environ.get('DB_NAME', 'design_tools')]
    
    cred = await db.vendor_credentials.find_one({'domain': 'uttermost.com'})
    fernet_key = os.environ.get('FERNET_KEY')
    fernet = Fernet(fernet_key.encode())
    password = fernet.decrypt(cred['encrypted_password'].encode()).decode()
    username = cred['username']
    
    print(f"Username: {username}")
    print(f"Password: {password}")
    
    async with async_playwright() as p:
        browser = await p.chromium.launch(
            executable_path='/pw-browsers/chromium_headless_shell-1200/chrome-linux/headless_shell',
            headless=True
        )
        context = await browser.new_context(viewport={'width': 1920, 'height': 1080})
        page = await context.new_page()
        
        print("\n1. Going to sign-in page...")
        await page.goto("https://uttermost.com/sign-in", wait_until='networkidle')
        await page.wait_for_timeout(8000)
        
        # Get all form fields
        print("\n2. Analyzing form structure...")
        form_info = await page.evaluate('''() => {
            const inputs = document.querySelectorAll('input');
            const info = [];
            inputs.forEach((inp, i) => {
                const rect = inp.getBoundingClientRect();
                info.push({
                    index: i,
                    type: inp.type,
                    name: inp.name,
                    id: inp.id,
                    placeholder: inp.placeholder,
                    y: rect.top,
                    visible: rect.width > 0 && rect.height > 0
                });
            });
            return info;
        }''')
        
        for f in form_info:
            if f['visible'] and f['y'] < 800:
                print(f"   Input: type={f['type']}, name={f['name']}, id={f['id']}, y={f['y']:.0f}")
        
        # Find the login form email input specifically
        print("\n3. Finding login form email...")
        login_email = await page.query_selector('form input[type="email"], form input[name="email"], #email')
        if login_email:
            box = await login_email.bounding_box()
            print(f"   Found email input at y={box['y']:.0f}")
            
            # Fill email
            await login_email.click()
            await page.keyboard.type(username, delay=30)
            await page.wait_for_timeout(500)
            
            val = await login_email.input_value()
            print(f"   Email value after typing: {val}")
        
        # Find password
        print("\n4. Finding password field...")
        pwd_inputs = await page.query_selector_all('input[type="password"]')
        print(f"   Found {len(pwd_inputs)} password inputs")
        
        for i, pwd in enumerate(pwd_inputs):
            box = await pwd.bounding_box()
            if box and box['y'] < 800:
                print(f"   Password {i+1} at y={box['y']:.0f} - using this one")
                await pwd.click()
                await page.keyboard.type(password, delay=30)
                await page.wait_for_timeout(500)
                
                val = await pwd.input_value()
                print(f"   Password filled: {len(val)} chars")
                break
        
        # Screenshot before submit
        await page.screenshot(path='/tmp/utt_before_submit.png')
        print("\n5. Screenshot saved: /tmp/utt_before_submit.png")
        
        # Find and analyze submit button
        print("\n6. Finding submit button...")
        buttons = await page.query_selector_all('button')
        for btn in buttons:
            text = await btn.text_content()
            box = await btn.bounding_box()
            btn_type = await btn.get_attribute('type')
            if box and text and box['y'] < 800:
                print(f"   Button: '{text.strip()}', type={btn_type}, y={box['y']:.0f}")
        
        # Click submit
        print("\n7. Clicking submit...")
        submit = await page.query_selector('button[type="submit"]')
        if submit:
            await submit.click()
            print("   Clicked submit button")
        else:
            # Try LOGIN button
            login_btn = await page.query_selector('button:has-text("LOGIN")')
            if login_btn:
                await login_btn.click()
                print("   Clicked LOGIN button")
        
        # Wait and check result
        await page.wait_for_timeout(10000)
        
        # Screenshot after submit
        await page.screenshot(path='/tmp/utt_after_submit.png')
        print("\n8. Screenshot saved: /tmp/utt_after_submit.png")
        
        # Check for errors
        page_text = await page.inner_text('body')
        current_url = page.url
        print(f"\n9. Current URL: {current_url}")
        
        if 'error' in page_text.lower():
            # Find the error message
            error_elements = await page.query_selector_all('[class*="error"], [class*="Error"], .alert, .message')
            for el in error_elements:
                text = await el.text_content()
                if text and len(text.strip()) > 0:
                    print(f"   ERROR MESSAGE: {text.strip()[:100]}")
        
        # Check if logged in
        if 'account' in page_text.lower() or 'sign out' in page_text.lower() or 'logout' in page_text.lower():
            print("   ✅ LOGIN SUCCESSFUL!")
        elif 'sign-in' in current_url:
            print("   ❌ Still on sign-in page - login failed")
        
        # Now try going to product page
        print("\n10. Going to product page...")
        await page.goto("https://uttermost.com/karnes-drink-table-50340", wait_until='networkidle')
        await page.wait_for_timeout(8000)
        
        await page.screenshot(path='/tmp/utt_product.png')
        print("    Screenshot saved: /tmp/utt_product.png")
        
        # Look for price
        page_text = await page.inner_text('body')
        import re
        prices = re.findall(r'\$[\d,]+\.?\d*', page_text)
        print(f"    Prices found: {prices[:5] if prices else 'NONE'}")
        
        # Check for wholesale/trade price indicators
        if 'wholesale' in page_text.lower() or 'trade' in page_text.lower() or 'dealer' in page_text.lower():
            print("    Trade/wholesale content detected on page")
        else:
            print("    No trade/wholesale indicators - likely NOT logged in")
        
        await browser.close()
        client.close()

asyncio.run(debug_login())

"""
Debug Uttermost login with detailed screenshots at each step
"""
import asyncio
import os
from playwright.async_api import async_playwright
from motor.motor_asyncio import AsyncIOMotorClient
from cryptography.fernet import Fernet

async def debug():
    mongo_url = os.environ.get('MONGO_URL')
    client = AsyncIOMotorClient(mongo_url)
    db = client[os.environ.get('DB_NAME', 'design_tools')]
    
    cred = await db.vendor_credentials.find_one({'domain': 'uttermost.com'})
    if not cred:
        print("No credentials found!")
        return
        
    fernet_key = os.environ.get('FERNET_KEY')
    fernet = Fernet(fernet_key.encode())
    password = fernet.decrypt(cred['encrypted_password'].encode()).decode()
    username = cred['username']
    
    print(f"Credentials: {username} / {password}")
    
    async with async_playwright() as p:
        browser = await p.chromium.launch(
            executable_path='/pw-browsers/chromium_headless_shell-1200/chrome-linux/headless_shell',
            headless=True
        )
        context = await browser.new_context(viewport={'width': 1920, 'height': 1080})
        page = await context.new_page()
        
        # STEP 1: Go to sign-in page
        print("\n=== STEP 1: Loading sign-in page ===")
        await page.goto("https://uttermost.com/sign-in", wait_until='networkidle')
        await page.wait_for_timeout(8000)
        await page.screenshot(path='/tmp/step1_login_page.png')
        print("Screenshot: /tmp/step1_login_page.png")
        
        # STEP 2: Fill email
        print("\n=== STEP 2: Filling email ===")
        email_input = page.locator('#email')
        await email_input.fill(username)
        await page.wait_for_timeout(500)
        email_val = await email_input.input_value()
        print(f"Email field value: {email_val}")
        await page.screenshot(path='/tmp/step2_email_filled.png')
        
        # STEP 3: Fill password
        print("\n=== STEP 3: Filling password ===")
        pwd_input = page.locator('#Password')
        await pwd_input.fill(password)
        await page.wait_for_timeout(500)
        pwd_val = await pwd_input.input_value()
        print(f"Password field value length: {len(pwd_val)}")
        await page.screenshot(path='/tmp/step3_password_filled.png')
        
        # STEP 4: Click LOGIN
        print("\n=== STEP 4: Clicking LOGIN ===")
        login_btn = page.locator('button:has-text("LOGIN")')
        await login_btn.click()
        print("LOGIN button clicked")
        
        # Wait and take multiple screenshots to see what happens
        await page.wait_for_timeout(3000)
        await page.screenshot(path='/tmp/step4a_3sec.png')
        print("Screenshot at 3 seconds")
        
        await page.wait_for_timeout(5000)
        await page.screenshot(path='/tmp/step4b_8sec.png')
        print("Screenshot at 8 seconds")
        
        await page.wait_for_timeout(5000)
        await page.screenshot(path='/tmp/step4c_13sec.png')
        print("Screenshot at 13 seconds")
        
        # Check current state
        current_url = page.url
        page_text = await page.inner_text('body')
        
        print(f"\n=== FINAL STATE ===")
        print(f"Current URL: {current_url}")
        print(f"'error' in page: {'error' in page_text.lower()}")
        print(f"'invalid' in page: {'invalid' in page_text.lower()}")
        print(f"'sign-in' in URL: {'sign-in' in current_url.lower()}")
        
        # Get any error messages
        if 'error' in page_text.lower():
            import re
            errors = re.findall(r'([^.]*error[^.]*\.)', page_text, re.IGNORECASE)
            for e in errors[:3]:
                print(f"Error found: {e[:100]}")
        
        # If logged in, go to product page
        if 'sign-in' not in current_url.lower():
            print("\n=== LOGGED IN - Testing product page ===")
            await page.goto("https://uttermost.com/karnes-drink-table-50340", wait_until='networkidle')
            await page.wait_for_timeout(8000)
            await page.screenshot(path='/tmp/step5_product_page.png')
            
            page_text = await page.inner_text('body')
            import re
            prices = re.findall(r'\$[\d,]+\.?\d*', page_text)
            print(f"Prices on page: {prices[:5] if prices else 'NONE'}")
        
        await browser.close()
        client.close()

asyncio.run(debug())

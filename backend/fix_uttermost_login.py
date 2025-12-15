"""
Fix Uttermost login - use explicit field targeting
"""
import asyncio
import os
from playwright.async_api import async_playwright
from motor.motor_asyncio import AsyncIOMotorClient
from cryptography.fernet import Fernet

async def test_login():
    mongo_url = os.environ.get('MONGO_URL')
    client = AsyncIOMotorClient(mongo_url)
    db = client[os.environ.get('DB_NAME', 'design_tools')]
    
    cred = await db.vendor_credentials.find_one({'domain': 'uttermost.com'})
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
        page.set_default_timeout(20000)
        
        print("\n1. Loading sign-in page...")
        await page.goto("https://uttermost.com/sign-in", wait_until='networkidle')
        await page.wait_for_timeout(10000)  # Wait for React to fully render
        
        # The form has specific IDs:
        # Email: #email (in signIn-form-vN4)
        # Password: #Password (in signIn-form-vN4)
        
        print("\n2. Filling email (#email)...")
        email_input = page.locator('form.signIn-form-vN4 #email, #email').first
        await email_input.click()
        await page.wait_for_timeout(300)
        await email_input.fill('')  # Clear first
        await email_input.type(username, delay=20)
        await page.wait_for_timeout(500)
        
        val = await email_input.input_value()
        print(f"   Email value: {val}")
        
        print("\n3. Filling password (#Password)...")
        # Click on password field by its ID (note: capital P)
        pwd_input = page.locator('form.signIn-form-vN4 #Password, #Password').first
        await pwd_input.click()
        await page.wait_for_timeout(300)
        await pwd_input.fill('')  # Clear first
        await pwd_input.type(password, delay=20)
        await page.wait_for_timeout(500)
        
        # Verify password was filled (check length of masked chars)
        pwd_val = await pwd_input.input_value()
        print(f"   Password length: {len(pwd_val)}")
        
        # Screenshot
        await page.screenshot(path='/tmp/utt_ready_submit.png')
        print("\n4. Screenshot: /tmp/utt_ready_submit.png")
        
        # Click the LOGIN button
        print("\n5. Clicking LOGIN button...")
        login_btn = page.locator('form.signIn-form-vN4 button[type="submit"], button:has-text("LOGIN")').first
        await login_btn.click()
        
        # Wait for login to process
        print("   Waiting 15 seconds...")
        await page.wait_for_timeout(15000)
        
        await page.screenshot(path='/tmp/utt_after_login.png')
        current_url = page.url
        print(f"\n6. Current URL: {current_url}")
        
        page_text = await page.inner_text('body')
        if 'error' in page_text.lower():
            print("   ❌ Error detected on page")
            import re
            error = re.search(r'error[^.]*\.?', page_text, re.IGNORECASE)
            if error:
                print(f"   Error: {error.group()[:100]}")
        elif 'sign-in' not in current_url.lower():
            print("   ✅ SUCCESS - Redirected!")
        else:
            print("   ⚠️ Still on sign-in page")
        
        # Go to product page
        print("\n7. Loading product page...")
        await page.goto("https://uttermost.com/karnes-drink-table-50340", wait_until='networkidle')
        await page.wait_for_timeout(10000)
        
        await page.screenshot(path='/tmp/utt_product_test.png')
        
        # Extract prices
        page_text = await page.inner_text('body')
        import re
        prices = re.findall(r'\$[\d,]+\.?\d*', page_text)
        print(f"\n8. Prices found: {prices[:10] if prices else 'NONE'}")
        
        # Check for wholesale content
        wholesale_indicators = ['wholesale', 'trade', 'dealer', 'net price', 'your price', 'msrp']
        found_indicators = [ind for ind in wholesale_indicators if ind in page_text.lower()]
        print(f"   Wholesale indicators: {found_indicators if found_indicators else 'NONE'}")
        
        await browser.close()
        client.close()
        print("\n✅ Test complete")

asyncio.run(test_login())

"""
Debug Uttermost login - V2 with force clicks
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
    
    print(f"Credentials: {username} / {password}")
    
    async with async_playwright() as p:
        browser = await p.chromium.launch(
            executable_path='/pw-browsers/chromium_headless_shell-1200/chrome-linux/headless_shell',
            headless=True
        )
        context = await browser.new_context(viewport={'width': 1920, 'height': 1080})
        page = await context.new_page()
        page.set_default_timeout(15000)
        
        print("\n1. Going to sign-in page...")
        await page.goto("https://uttermost.com/sign-in", wait_until='networkidle')
        await page.wait_for_timeout(8000)
        
        # Use the specific login form IDs found
        print("\n2. Filling email field (id=email)...")
        try:
            email_field = await page.wait_for_selector('#email', timeout=10000)
            await email_field.click(force=True)
            await page.wait_for_timeout(300)
            await email_field.fill(username)
            val = await email_field.input_value()
            print(f"   Email filled: {val}")
        except Exception as e:
            print(f"   Error: {e}")
            # Try alternative
            await page.locator('#email').fill(username, force=True)
        
        print("\n3. Filling password field...")
        try:
            # Use the password field at the lower Y position (the login form one)
            pwd_field = await page.wait_for_selector('#Password, #login-password', timeout=10000)
            await pwd_field.click(force=True)
            await page.wait_for_timeout(300)
            await pwd_field.fill(password)
            val = await pwd_field.input_value()
            print(f"   Password filled: {len(val)} chars")
        except Exception as e:
            print(f"   Error: {e}")
        
        await page.screenshot(path='/tmp/utt_filled.png')
        print("\n4. Screenshot: /tmp/utt_filled.png")
        
        # Submit the form
        print("\n5. Submitting form...")
        try:
            # Find submit button in the sign-in form
            submit_btn = await page.wait_for_selector('form button[type="submit"], button:has-text("LOGIN")', timeout=5000)
            await submit_btn.click(force=True)
            print("   Clicked submit")
        except Exception as e:
            print(f"   Submit error: {e}")
            # Try pressing Enter
            await page.keyboard.press('Enter')
            print("   Pressed Enter instead")
        
        # Wait for response
        await page.wait_for_timeout(12000)
        
        await page.screenshot(path='/tmp/utt_after.png')
        print("\n6. Screenshot: /tmp/utt_after.png")
        
        # Check result
        current_url = page.url
        page_text = await page.inner_text('body')
        
        print(f"\n7. Current URL: {current_url}")
        
        if 'error' in page_text.lower() or 'invalid' in page_text.lower():
            print("   ❌ ERROR DETECTED IN PAGE")
            # Try to find error message
            import re
            error_match = re.search(r'(error[^.]*\.)', page_text, re.IGNORECASE)
            if error_match:
                print(f"   Error text: {error_match.group(1)}")
        
        if 'sign-in' not in current_url.lower() and 'login' not in current_url.lower():
            print("   ✅ REDIRECTED - Login may have worked!")
        else:
            print("   ⚠️ Still on login page")
        
        # Go to product page
        print("\n8. Going to product page...")
        await page.goto("https://uttermost.com/karnes-drink-table-50340", wait_until='networkidle')
        await page.wait_for_timeout(8000)
        
        await page.screenshot(path='/tmp/utt_product.png')
        
        # Look for prices
        page_text = await page.inner_text('body')
        import re
        prices = re.findall(r'\$[\d,]+\.?\d*', page_text)
        print(f"\n9. Prices found on product page: {prices[:10] if prices else 'NONE'}")
        
        # Check for wholesale indicators
        has_wholesale = any(x in page_text.lower() for x in ['wholesale', 'trade', 'dealer', 'net price', 'your price'])
        print(f"   Wholesale indicators: {has_wholesale}")
        
        await browser.close()
        client.close()
        print("\n✅ Debug complete!")

asyncio.run(debug_login())

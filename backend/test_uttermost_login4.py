"""
Uttermost login - Using keyboard input simulation for React app
"""
import asyncio
import os
from dotenv import load_dotenv
from playwright.async_api import async_playwright
from motor.motor_asyncio import AsyncIOMotorClient
from cryptography.fernet import Fernet

load_dotenv()

async def test_uttermost():
    mongo_url = os.environ.get('MONGO_URL')
    client = AsyncIOMotorClient(mongo_url)
    db = client[os.environ.get('DB_NAME', 'design_tools')]
    
    cred_doc = await db.vendor_credentials.find_one({"domain": "uttermost.com"})
    fernet_key = os.environ.get('FERNET_KEY')
    fernet = Fernet(fernet_key.encode())
    password = fernet.decrypt(cred_doc['encrypted_password'].encode()).decode()
    username = cred_doc.get('username')
    
    print(f"Username: {username}")
    
    async with async_playwright() as p:
        browser = await p.chromium.launch(
            executable_path='/pw-browsers/chromium_headless_shell-1200/chrome-linux/headless_shell',
            headless=True
        )
        context = await browser.new_context(viewport={'width': 1920, 'height': 1080})
        page = await context.new_page()
        page.set_default_timeout(45000)
        
        print("1. Going to Uttermost sign-in page...")
        await page.goto("https://uttermost.com/sign-in", wait_until='networkidle')
        await page.wait_for_timeout(10000)  # Long wait for React
        
        # Find and click email input, then TYPE character by character
        print("2. Typing email character by character...")
        email_input = await page.wait_for_selector('input[type="email"]', state='visible')
        await email_input.click()
        await page.wait_for_timeout(300)
        
        # Clear any existing text
        await page.keyboard.press('Control+A')
        await page.keyboard.press('Backspace')
        await page.wait_for_timeout(200)
        
        # Type slowly
        await page.keyboard.type(username, delay=50)
        await page.wait_for_timeout(500)
        print(f"   Typed: {username}")
        
        # Verify email was entered
        email_value = await email_input.input_value()
        print(f"   Email field value: {email_value}")
        
        # Now password - find ALL password inputs and click the visible one
        print("3. Finding password input...")
        pwd_inputs = await page.query_selector_all('input[type="password"]')
        print(f"   Found {len(pwd_inputs)} password inputs")
        
        pwd_input = None
        for i, inp in enumerate(pwd_inputs):
            box = await inp.bounding_box()
            if box and box['width'] > 0 and box['height'] > 0:
                print(f"   Password input {i+1} has bounding box: {box}")
                pwd_input = inp
                break
            else:
                print(f"   Password input {i+1} has no valid bounding box")
        
        if not pwd_input:
            # Try pressing Tab to move to password field
            print("   No visible password input, pressing Tab...")
            await page.keyboard.press('Tab')
            await page.wait_for_timeout(500)
        else:
            await pwd_input.click()
            await page.wait_for_timeout(300)
        
        # Type password
        print("4. Typing password...")
        await page.keyboard.type(password, delay=30)
        await page.wait_for_timeout(500)
        print(f"   Typed password ({len(password)} chars)")
        
        # Screenshot before login
        await page.screenshot(path='/tmp/uttermost_before_login.png')
        print("   Screenshot: /tmp/uttermost_before_login.png")
        
        # Click login or press Enter
        print("5. Submitting form...")
        await page.keyboard.press('Enter')
        await page.wait_for_timeout(2000)
        
        # Also try clicking the button just in case
        try:
            login_btn = await page.query_selector('button[type="submit"]')
            if login_btn:
                await login_btn.click()
        except:
            pass
        
        print("   Waiting 15 seconds for login...")
        await page.wait_for_timeout(15000)
        
        # Screenshot after login
        await page.screenshot(path='/tmp/uttermost_after_login.png')
        current_url = page.url
        print(f"   Current URL after login: {current_url}")
        
        # Check for success indicators
        page_text = await page.inner_text('body')
        print(f"   'Account' in page: {'Account' in page_text}")
        print(f"   'Sign Out' in page: {'Sign Out' in page_text}")
        print(f"   'Invalid' in page: {'invalid' in page_text.lower()}")
        
        # Go to product page
        print("\n6. Going to product page...")
        await page.goto("https://uttermost.com/karnes-drink-table-50340", wait_until='networkidle')
        await page.wait_for_timeout(10000)
        
        await page.screenshot(path='/tmp/uttermost_product.png')
        
        # Check for prices
        page_text = await page.inner_text('body')
        import re
        prices = re.findall(r'\$\s*[\d,]+\.?\d*', page_text)
        print(f"   Prices found: {prices[:10] if prices else 'NONE'}")
        
        await browser.close()
        client.close()
        print("\n✅ Done!")

asyncio.run(test_uttermost())

"""
Uttermost login - Target login form specifically
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
    
    async with async_playwright() as p:
        browser = await p.chromium.launch(
            executable_path='/pw-browsers/chromium_headless_shell-1200/chrome-linux/headless_shell',
            headless=True
        )
        context = await browser.new_context(viewport={'width': 1920, 'height': 1080})
        page = await context.new_page()
        
        print("1. Going to Uttermost sign-in...")
        await page.goto("https://uttermost.com/sign-in", wait_until='networkidle', timeout=60000)
        await page.wait_for_timeout(8000)
        
        # Take initial screenshot
        await page.screenshot(path='/tmp/utt_initial.png')
        print("   Initial screenshot: /tmp/utt_initial.png")
        
        # Find ALL email inputs on the page
        email_inputs = await page.query_selector_all('input[type="email"]')
        print(f"2. Found {len(email_inputs)} email input(s)")
        
        # Find the one that's in the upper part of the page (login form)
        login_email = None
        for i, inp in enumerate(email_inputs):
            box = await inp.bounding_box()
            if box:
                print(f"   Email input {i+1} at y={box['y']:.0f}")
                # The login form should be in the upper part of the page (y < 700)
                if box['y'] < 700:
                    login_email = inp
                    print(f"   -> This is likely the LOGIN form email input")
                    break
        
        if not login_email:
            print("   Could not find login email input!")
            await browser.close()
            return
        
        # Click and fill the LOGIN email input
        print("3. Filling login email...")
        await login_email.click(force=True)
        await page.wait_for_timeout(300)
        await page.keyboard.type(username, delay=30)
        await page.wait_for_timeout(500)
        
        # Verify
        value = await login_email.input_value()
        print(f"   Email value: {value}")
        
        # Find password input (should be near the email input)
        print("4. Finding login password...")
        pwd_inputs = await page.query_selector_all('input[type="password"]')
        print(f"   Found {len(pwd_inputs)} password input(s)")
        
        login_pwd = None
        for i, inp in enumerate(pwd_inputs):
            box = await inp.bounding_box()
            if box:
                print(f"   Password input {i+1} at y={box['y']:.0f}")
                # Login password should be in upper part too
                if box['y'] < 700:
                    login_pwd = inp
                    print(f"   -> This is likely the LOGIN form password input")
                    break
        
        if login_pwd:
            print("5. Filling password...")
            await login_pwd.click(force=True)
            await page.wait_for_timeout(300)
            await page.keyboard.type(password, delay=30)
            await page.wait_for_timeout(500)
        else:
            # Try Tab from email field
            print("5. No visible password, trying Tab...")
            await page.keyboard.press('Tab')
            await page.wait_for_timeout(500)
            await page.keyboard.type(password, delay=30)
        
        # Screenshot before submit
        await page.screenshot(path='/tmp/utt_filled.png')
        print("   Filled screenshot: /tmp/utt_filled.png")
        
        # Find and click LOGIN button (not the footer SUBMIT)
        print("6. Looking for LOGIN button...")
        buttons = await page.query_selector_all('button')
        for btn in buttons:
            text = await btn.text_content()
            box = await btn.bounding_box()
            if text and box:
                print(f"   Button '{text.strip()[:20]}' at y={box['y']:.0f}")
                if 'login' in text.lower() and box['y'] < 700:
                    print(f"   -> Clicking LOGIN button")
                    await btn.click(force=True)
                    break
        
        # Wait for login
        print("7. Waiting for login...")
        await page.wait_for_timeout(15000)
        
        # Screenshot after
        await page.screenshot(path='/tmp/utt_after.png')
        url = page.url
        print(f"   URL: {url}")
        
        # Go to product
        print("8. Product page...")
        await page.goto("https://uttermost.com/karnes-drink-table-50340", wait_until='networkidle', timeout=60000)
        await page.wait_for_timeout(8000)
        await page.screenshot(path='/tmp/utt_product.png')
        
        text = await page.inner_text('body')
        import re
        prices = re.findall(r'\$\s*[\d,]+\.?\d*', text)
        print(f"   Prices: {prices[:5] if prices else 'NONE'}")
        
        await browser.close()
        client.close()

asyncio.run(test_uttermost())

"""
Debug Uttermost login - V3 fixed JS
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
        page.set_default_timeout(30000)
        
        print("1. Going to Uttermost sign-in page...")
        await page.goto("https://uttermost.com/sign-in", wait_until='networkidle')
        await page.wait_for_timeout(8000)
        
        # Fill email using type with force
        print("2. Filling email...")
        email_input = await page.query_selector('input[type="email"]')
        if email_input:
            await email_input.fill(username, force=True)
            print(f"   Email filled: {username}")
        else:
            print("   Email input NOT FOUND")
        await page.wait_for_timeout(1000)
        
        # Get all password inputs and try each
        print("3. Filling password...")
        pwd_inputs = await page.query_selector_all('input[type="password"]')
        print(f"   Found {len(pwd_inputs)} password inputs")
        
        for i, pwd_inp in enumerate(pwd_inputs):
            try:
                # Use JavaScript to set value directly
                await page.evaluate('''(element) => {
                    element.value = arguments[0];
                    element.dispatchEvent(new Event('input', { bubbles: true }));
                    element.dispatchEvent(new Event('change', { bubbles: true }));
                }''', pwd_inp)
                await pwd_inp.type(password, delay=20)
                print(f"   Password input {i+1} typed")
            except Exception as e:
                print(f"   Password input {i+1} error: {e}")
        
        await page.wait_for_timeout(500)
        
        # Screenshot before clicking login
        await page.screenshot(path='/tmp/uttermost_filled.png')
        print("   Screenshot: /tmp/uttermost_filled.png")
        
        # Click login button
        print("4. Clicking login button...")
        login_btn = await page.query_selector('button[type="submit"]')
        if login_btn:
            await login_btn.click(force=True)
            print("   Login button clicked")
        else:
            # Try other buttons
            buttons = await page.query_selector_all('button')
            for btn in buttons:
                text = await btn.text_content()
                if 'login' in text.lower() or 'sign' in text.lower():
                    await btn.click(force=True)
                    print(f"   Clicked button with text: {text}")
                    break
        
        print("5. Waiting for login (15 seconds)...")
        await page.wait_for_timeout(15000)
        
        # Screenshot after login
        await page.screenshot(path='/tmp/uttermost_after_login.png')
        print("   Screenshot: /tmp/uttermost_after_login.png")
        
        current_url = page.url
        print(f"   Current URL: {current_url}")
        
        # Go to product page
        print("\n6. Going to product page...")
        await page.goto("https://uttermost.com/karnes-drink-table-50340", wait_until='networkidle')
        await page.wait_for_timeout(10000)
        
        # Screenshot
        await page.screenshot(path='/tmp/uttermost_product.png')
        print("   Screenshot: /tmp/uttermost_product.png")
        
        # Look for price in page text
        page_text = await page.inner_text('body')
        import re
        prices = re.findall(r'\$[\d,]+\.?\d*', page_text)
        print(f"   Prices found in text: {prices[:10] if prices else 'NONE'}")
        
        # Get HTML of any price-like elements
        price_elements = await page.query_selector_all('[class*="price"], [class*="Price"]')
        print(f"   Price elements found: {len(price_elements)}")
        for i, el in enumerate(price_elements[:5]):
            text = await el.text_content()
            if text:
                print(f"     Element {i+1}: {text.strip()[:80]}")
        
        await browser.close()
        client.close()
        print("\n✅ Done!")

asyncio.run(test_uttermost())

"""
Uttermost login - FINAL version with all workarounds
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
        
        # Scroll to ensure login form is visible
        await page.evaluate("window.scrollTo(0, 0)")
        await page.wait_for_timeout(1000)
        
        # Type email
        print("2. Filling email...")
        await page.click('input[type="email"]', force=True, timeout=10000)
        await page.keyboard.type(username, delay=30)
        await page.wait_for_timeout(500)
        
        # Tab to password field (safest method)
        print("3. Tab to password and type...")
        await page.keyboard.press('Tab')
        await page.wait_for_timeout(500)
        await page.keyboard.type(password, delay=30)
        await page.wait_for_timeout(500)
        
        # Screenshot
        await page.screenshot(path='/tmp/utt_ready.png')
        print("   Screenshot saved: /tmp/utt_ready.png")
        
        # Submit
        print("4. Submitting...")
        await page.keyboard.press('Enter')
        await page.wait_for_timeout(15000)
        
        # Check result
        await page.screenshot(path='/tmp/utt_after.png')
        url = page.url
        print(f"   URL after submit: {url}")
        
        if 'sign-in' in url:
            print("   Login FAILED - still on sign-in page")
            # Check for error messages
            text = await page.inner_text('body')
            if 'invalid' in text.lower() or 'incorrect' in text.lower():
                print("   Found error message about invalid credentials")
        else:
            print("   Login might have SUCCEEDED")
        
        # Try product page anyway
        print("\n5. Going to product page...")
        await page.goto("https://uttermost.com/karnes-drink-table-50340", wait_until='networkidle', timeout=60000)
        await page.wait_for_timeout(8000)
        await page.screenshot(path='/tmp/utt_product.png')
        
        # Look for price
        text = await page.inner_text('body')
        import re
        prices = re.findall(r'\$\s*[\d,]+\.?\d*', text)
        print(f"   Prices: {prices[:5] if prices else 'NONE FOUND'}")
        
        # Check cookies and storage - see if we're logged in
        cookies = await context.cookies()
        login_cookies = [c for c in cookies if 'auth' in c['name'].lower() or 'session' in c['name'].lower() or 'token' in c['name'].lower()]
        print(f"   Login-related cookies: {[c['name'] for c in login_cookies]}")
        
        await browser.close()
        client.close()

asyncio.run(test_uttermost())

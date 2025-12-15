"""
Test with actual keyboard input simulation
"""
import asyncio
import os
from playwright.async_api import async_playwright
from motor.motor_asyncio import AsyncIOMotorClient
from cryptography.fernet import Fernet

async def test():
    mongo_url = os.environ.get('MONGO_URL')
    client = AsyncIOMotorClient(mongo_url)
    db = client[os.environ.get('DB_NAME', 'design_tools')]
    
    cred = await db.vendor_credentials.find_one({'domain': 'uttermost.com'})
    fernet_key = os.environ.get('FERNET_KEY')
    fernet = Fernet(fernet_key.encode())
    password = fernet.decrypt(cred['encrypted_password'].encode()).decode()
    username = cred['username']
    
    async with async_playwright() as p:
        browser = await p.chromium.launch(
            executable_path='/pw-browsers/chromium_headless_shell-1200/chrome-linux/headless_shell',
            headless=True
        )
        context = await browser.new_context(viewport={'width': 1920, 'height': 1080})
        page = await context.new_page()
        
        print("1. Loading login page...")
        await page.goto("https://uttermost.com/sign-in", wait_until='networkidle')
        await page.wait_for_timeout(8000)
        
        # Click and type email - character by character
        print("2. Clicking email field and typing...")
        await page.click('#email')
        await page.wait_for_timeout(500)
        
        # Clear first
        await page.keyboard.press('Control+A')
        await page.keyboard.press('Backspace')
        await page.wait_for_timeout(200)
        
        # Type each character
        for char in username:
            await page.keyboard.type(char)
            await page.wait_for_timeout(50)
        
        await page.wait_for_timeout(500)
        
        # Verify email
        email_val = await page.input_value('#email')
        print(f"   Email typed: {email_val}")
        
        # Now password
        print("3. Clicking password field and typing...")
        await page.click('#Password')
        await page.wait_for_timeout(500)
        
        # Clear first
        await page.keyboard.press('Control+A')
        await page.keyboard.press('Backspace')
        await page.wait_for_timeout(200)
        
        # Type each character - handle $ specially
        for char in password:
            if char == '$':
                await page.keyboard.press('Shift+4')  # $ is Shift+4
            else:
                await page.keyboard.type(char)
            await page.wait_for_timeout(50)
        
        await page.wait_for_timeout(500)
        
        # Verify password
        pwd_val = await page.input_value('#Password')
        print(f"   Password length: {len(pwd_val)}")
        print(f"   Password chars: {[c for c in pwd_val]}")
        
        await page.screenshot(path='/tmp/keyboard_filled.png')
        
        # Submit
        print("4. Clicking LOGIN...")
        await page.click('button:has-text("LOGIN")')
        await page.wait_for_timeout(15000)
        
        await page.screenshot(path='/tmp/keyboard_result.png')
        
        current_url = page.url
        print(f"\nURL: {current_url}")
        
        if 'sign-in' not in current_url.lower():
            print("✅ SUCCESS!")
            
            # Go to product
            await page.goto("https://uttermost.com/karnes-drink-table-50340", wait_until='networkidle')
            await page.wait_for_timeout(8000)
            
            page_text = await page.inner_text('body')
            import re
            prices = re.findall(r'\$[\d,]+\.?\d*', page_text)
            print(f"Prices: {prices[:5] if prices else 'NONE'}")
            
            await page.screenshot(path='/tmp/keyboard_product.png')
        else:
            print("❌ FAILED")
        
        await browser.close()
        client.close()

asyncio.run(test())

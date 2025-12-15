"""
Test login with human-like behavior
"""
import asyncio
import os
import random
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
        # Use a realistic browser configuration
        browser = await p.chromium.launch(
            executable_path='/pw-browsers/chromium_headless_shell-1200/chrome-linux/headless_shell',
            headless=True,
            args=['--disable-blink-features=AutomationControlled']
        )
        
        context = await browser.new_context(
            viewport={'width': 1920, 'height': 1080},
            user_agent='Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        )
        
        # Add stealth script
        await context.add_init_script("""
            Object.defineProperty(navigator, 'webdriver', {get: () => undefined});
        """)
        
        page = await context.new_page()
        
        print("1. Loading sign-in page...")
        await page.goto("https://uttermost.com/sign-in", wait_until='networkidle')
        await page.wait_for_timeout(5000 + random.randint(1000, 3000))
        
        print("2. Clicking email field...")
        email_input = page.locator('#email')
        await email_input.click()
        await page.wait_for_timeout(random.randint(300, 800))
        
        # Type like a human with random delays
        print(f"3. Typing email: {username}")
        await email_input.type(username, delay=random.randint(50, 150))
        await page.wait_for_timeout(random.randint(500, 1000))
        
        print("4. Clicking password field...")
        pwd_input = page.locator('#Password')
        await pwd_input.click()
        await page.wait_for_timeout(random.randint(300, 800))
        
        print("5. Typing password...")
        await pwd_input.type(password, delay=random.randint(50, 150))
        await page.wait_for_timeout(random.randint(500, 1000))
        
        await page.screenshot(path='/tmp/human_before_login.png')
        
        print("6. Clicking LOGIN...")
        await page.locator('button:has-text("LOGIN")').click()
        
        # Wait for response
        await page.wait_for_timeout(15000)
        
        await page.screenshot(path='/tmp/human_after_login.png')
        
        current_url = page.url
        print(f"\nCurrent URL: {current_url}")
        
        if 'sign-in' not in current_url.lower():
            print("✅ LOGIN SUCCESSFUL!")
            
            # Go to product page
            await page.goto("https://uttermost.com/karnes-drink-table-50340", wait_until='networkidle')
            await page.wait_for_timeout(8000)
            await page.screenshot(path='/tmp/human_product.png')
            
            page_text = await page.inner_text('body')
            import re
            prices = re.findall(r'\$[\d,]+\.?\d*', page_text)
            print(f"Prices: {prices[:5] if prices else 'NONE'}")
        else:
            print("❌ Login failed")
            page_text = await page.inner_text('body')
            if 'error' in page_text.lower():
                print("Error message detected on page")
        
        await browser.close()
        client.close()

asyncio.run(test())

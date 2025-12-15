"""
Test Four Hands login - V2 using placeholders
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
    
    cred = await db.vendor_credentials.find_one({'domain': 'fourhands.com'})
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
        
        print("\n1. Loading login page...")
        await page.goto("https://www.fourhands.com/login", wait_until='networkidle')
        await page.wait_for_timeout(5000)
        
        print("\n2. Filling username by placeholder...")
        username_input = page.locator('input[placeholder*="customer number"], input[type="text"]').first
        await username_input.click()
        await username_input.fill(username)
        print(f"   Filled: {username}")
        
        print("\n3. Filling password...")
        pwd_input = page.locator('input[type="password"]').first
        await pwd_input.click()
        await pwd_input.fill(password)
        print("   Password filled")
        
        await page.screenshot(path='/tmp/fh_ready.png')
        
        print("\n4. Submitting...")
        submit_btn = page.locator('button[type="submit"], button:has-text("Log In"), button:has-text("LOGIN")').first
        await submit_btn.click()
        await page.wait_for_timeout(10000)
        
        await page.screenshot(path='/tmp/fh_result.png')
        current_url = page.url
        print(f"\n5. URL: {current_url}")
        
        if 'login' not in current_url.lower():
            print("   ✅ SUCCESS!")
            
            # Try a product
            print("\n6. Testing product page...")
            await page.goto("https://www.fourhands.com/product/benedict-sofa", wait_until='networkidle')
            await page.wait_for_timeout(5000)
            
            page_text = await page.inner_text('body')
            import re
            prices = re.findall(r'\$[\d,]+\.?\d*', page_text)
            print(f"   Prices: {prices[:5] if prices else 'NONE'}")
        else:
            print("   ❌ Login failed")
        
        await browser.close()
        client.close()

asyncio.run(test_login())

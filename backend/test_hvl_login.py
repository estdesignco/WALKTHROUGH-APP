"""
Test HVL Group login - this was reported as working before
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
    
    cred = await db.vendor_credentials.find_one({'domain': 'hvlgroup.com'})
    fernet_key = os.environ.get('FERNET_KEY')
    fernet = Fernet(fernet_key.encode())
    password = fernet.decrypt(cred['encrypted_password'].encode()).decode()
    username = cred['username']
    
    print(f"HVL Credentials: {username} / {password}")
    
    async with async_playwright() as p:
        browser = await p.chromium.launch(
            executable_path='/pw-browsers/chromium_headless_shell-1200/chrome-linux/headless_shell',
            headless=True
        )
        context = await browser.new_context(viewport={'width': 1920, 'height': 1080})
        page = await context.new_page()
        page.set_default_timeout(20000)
        
        print("\n1. Loading HVL login page...")
        await page.goto("https://www.hvlgroup.com/customer/account/login/", wait_until='networkidle')
        await page.wait_for_timeout(5000)
        
        print("\n2. Filling email...")
        await page.fill('#email', username)
        await page.wait_for_timeout(500)
        
        print("\n3. Filling password...")
        await page.fill('#pass', password)
        await page.wait_for_timeout(500)
        
        await page.screenshot(path='/tmp/hvl_ready.png')
        
        print("\n4. Submitting...")
        await page.click('#send2')  # HVL uses this ID for login button
        await page.wait_for_timeout(10000)
        
        await page.screenshot(path='/tmp/hvl_after.png')
        current_url = page.url
        print(f"\n5. Current URL: {current_url}")
        
        if 'login' not in current_url.lower():
            print("   ✅ LOGIN SUCCESSFUL - Redirected!")
            
            # Try a product page
            print("\n6. Testing product page...")
            # Need a real HVL product URL
            await page.goto("https://www.hvlgroup.com/quorum-quorum-quorum-quorum-quorum.html", wait_until='networkidle')
            await page.wait_for_timeout(5000)
            
            page_text = await page.inner_text('body')
            import re
            prices = re.findall(r'\$[\d,]+\.?\d*', page_text)
            print(f"   Prices: {prices[:5] if prices else 'NONE'}")
        else:
            print("   ❌ Still on login page")
            page_text = await page.inner_text('body')
            if 'invalid' in page_text.lower() or 'incorrect' in page_text.lower():
                print("   Invalid credentials error")
        
        await browser.close()
        client.close()

asyncio.run(test_login())

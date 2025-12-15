"""
Test Four Hands login
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
    
    print(f"Four Hands Credentials: {username} / {password}")
    
    async with async_playwright() as p:
        browser = await p.chromium.launch(
            executable_path='/pw-browsers/chromium_headless_shell-1200/chrome-linux/headless_shell',
            headless=True
        )
        context = await browser.new_context(viewport={'width': 1920, 'height': 1080})
        page = await context.new_page()
        page.set_default_timeout(20000)
        
        print("\n1. Loading Four Hands login...")
        await page.goto("https://www.fourhands.com/login", wait_until='networkidle')
        await page.wait_for_timeout(5000)
        
        await page.screenshot(path='/tmp/fh_login.png')
        
        # Find and fill the form
        print("\n2. Finding form elements...")
        form_html = await page.evaluate('''() => {
            const inputs = document.querySelectorAll('input');
            return Array.from(inputs).map(i => ({
                type: i.type,
                name: i.name,
                id: i.id,
                placeholder: i.placeholder
            }));
        }''')
        
        for f in form_html:
            print(f"   Input: {f}")
        
        # Fill username/account number
        print("\n3. Filling credentials...")
        try:
            await page.fill('input[name="username"], input[name="accountNumber"], #username', username)
            print(f"   Username filled: {username}")
        except Exception as e:
            print(f"   Username error: {e}")
        
        try:
            await page.fill('input[name="password"], input[type="password"], #password', password)
            print(f"   Password filled")
        except Exception as e:
            print(f"   Password error: {e}")
        
        await page.screenshot(path='/tmp/fh_filled.png')
        
        # Submit
        print("\n4. Submitting...")
        try:
            await page.click('button[type="submit"]')
            await page.wait_for_timeout(10000)
        except:
            await page.keyboard.press('Enter')
            await page.wait_for_timeout(10000)
        
        await page.screenshot(path='/tmp/fh_after.png')
        current_url = page.url
        print(f"\n5. Current URL: {current_url}")
        
        if 'login' not in current_url.lower():
            print("   ✅ LOGIN SUCCESS!")
        else:
            print("   ❌ Still on login")
            page_text = await page.inner_text('body')
            if 'error' in page_text.lower() or 'invalid' in page_text.lower():
                print("   Invalid credentials")
        
        await browser.close()
        client.close()

asyncio.run(test_login())

"""
Test with correct dollar sign input
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
    
    print(f"Password to type: {password}")
    
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
        
        # Type email using page.type which handles special chars correctly
        print("2. Filling email...")
        email_input = page.locator('#email')
        await email_input.click()
        await email_input.press_sequentially(username, delay=50)
        await page.wait_for_timeout(500)
        
        email_val = await email_input.input_value()
        print(f"   Email: {email_val}")
        
        # Type password using press_sequentially which handles $ correctly
        print("3. Filling password...")
        pwd_input = page.locator('#Password')
        await pwd_input.click()
        await pwd_input.press_sequentially(password, delay=50)
        await page.wait_for_timeout(500)
        
        pwd_val = await pwd_input.input_value()
        print(f"   Password length: {len(pwd_val)}")
        print(f"   Password: {pwd_val}")
        print(f"   Matches original: {pwd_val == password}")
        
        await page.screenshot(path='/tmp/correct_filled.png')
        
        # Submit
        print("4. Clicking LOGIN...")
        await page.click('button:has-text("LOGIN")')
        await page.wait_for_timeout(15000)
        
        await page.screenshot(path='/tmp/correct_result.png')
        
        current_url = page.url
        print(f"\nURL: {current_url}")
        
        page_text = await page.inner_text('body')
        if 'error' in page_text.lower():
            print("Error detected on page")
            import re
            errors = re.findall(r'error[^.]*\.', page_text, re.IGNORECASE)
            for e in errors[:2]:
                print(f"  {e[:80]}")
        
        if 'sign-in' not in current_url.lower():
            print("✅ SUCCESS!")
        else:
            print("❌ FAILED")
        
        await browser.close()
        client.close()

asyncio.run(test())

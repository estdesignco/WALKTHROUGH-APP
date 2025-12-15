"""
Debug Four Hands login and product access
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
        
        # Go to login page
        print("\n1. Going to Four Hands login...")
        await page.goto("https://fourhands.com/login", wait_until='networkidle')
        await page.wait_for_timeout(5000)
        
        await page.screenshot(path='/tmp/fh_login.png')
        print("   Screenshot: /tmp/fh_login.png")
        
        # Find form fields
        inputs = await page.query_selector_all('input')
        print(f"\n2. Found {len(inputs)} input fields:")
        for inp in inputs:
            inp_type = await inp.get_attribute('type') or 'text'
            inp_name = await inp.get_attribute('name') or ''
            inp_placeholder = await inp.get_attribute('placeholder') or ''
            print(f"   type={inp_type}, name={inp_name}, placeholder={inp_placeholder}")
        
        # Fill username (customer number)
        print("\n3. Filling username...")
        username_input = await page.query_selector('input[type="text"]')
        if username_input:
            await username_input.fill(username)
            print(f"   Filled: {username}")
        
        # Fill password
        print("\n4. Filling password...")
        pwd_input = await page.query_selector('input[type="password"]')
        if pwd_input:
            await pwd_input.fill(password)
            print("   Password filled")
        
        await page.screenshot(path='/tmp/fh_filled.png')
        
        # Submit
        print("\n5. Submitting...")
        submit_btn = await page.query_selector('button[type="submit"]')
        if submit_btn:
            await submit_btn.click()
            print("   Clicked submit")
        
        await page.wait_for_timeout(10000)
        
        await page.screenshot(path='/tmp/fh_after.png')
        current_url = page.url
        print(f"\n6. Current URL: {current_url}")
        
        if 'login' in current_url.lower():
            print("   ❌ Still on login page - login failed")
            page_text = await page.inner_text('body')
            if 'error' in page_text.lower() or 'invalid' in page_text.lower():
                print("   Error message detected")
        else:
            print("   ✅ Login successful!")
            
            # Try to find products
            print("\n7. Looking for products...")
            await page.goto("https://www.fourhands.com", wait_until='networkidle')
            await page.wait_for_timeout(5000)
            
            await page.screenshot(path='/tmp/fh_home.png')
            
            # Find product links
            links = await page.evaluate('''() => {
                return Array.from(document.querySelectorAll('a')).filter(a => 
                    a.href.includes('product') || a.href.includes('item')
                ).map(a => a.href).slice(0, 5);
            }''')
            
            print(f"   Product links: {links}")
        
        await browser.close()
        client.close()

asyncio.run(test())

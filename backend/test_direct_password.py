"""
Test with direct JavaScript password insertion
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
    
    print(f"Password: {repr(password)}")
    
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
        
        # Use JavaScript to set values directly
        print("2. Setting email via JavaScript...")
        await page.evaluate(f'''() => {{
            const email = document.querySelector('#email');
            if (email) {{
                email.value = "{username}";
                email.dispatchEvent(new Event('input', {{ bubbles: true }}));
                email.dispatchEvent(new Event('change', {{ bubbles: true }}));
            }}
        }}''')
        
        print("3. Setting password via JavaScript...")
        await page.evaluate(f'''() => {{
            const pwd = document.querySelector('#Password');
            if (pwd) {{
                pwd.value = "{password}";
                pwd.dispatchEvent(new Event('input', {{ bubbles: true }}));
                pwd.dispatchEvent(new Event('change', {{ bubbles: true }}));
            }}
        }}''')
        
        await page.wait_for_timeout(1000)
        
        # Verify values
        email_val = await page.evaluate('() => document.querySelector("#email").value')
        pwd_val = await page.evaluate('() => document.querySelector("#Password").value')
        print(f"Email value: {email_val}")
        print(f"Password length: {len(pwd_val)}")
        print(f"Password matches: {pwd_val == password}")
        
        await page.screenshot(path='/tmp/js_filled.png')
        
        # Click login
        print("4. Clicking LOGIN...")
        await page.click('button:has-text("LOGIN")')
        await page.wait_for_timeout(15000)
        
        await page.screenshot(path='/tmp/js_result.png')
        
        current_url = page.url
        print(f"\nURL: {current_url}")
        
        if 'sign-in' not in current_url.lower():
            print("✅ SUCCESS!")
        else:
            print("❌ FAILED")
            # Get any error text
            error_text = await page.evaluate('''() => {
                const elements = document.querySelectorAll('[class*="error"], [class*="Error"], .alert');
                return Array.from(elements).map(e => e.textContent).join(' ');
            }''')
            if error_text:
                print(f"Error: {error_text[:200]}")
        
        await browser.close()
        client.close()

asyncio.run(test())

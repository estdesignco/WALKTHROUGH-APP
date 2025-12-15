"""
Debug Uttermost - Find the exact password field
"""
import asyncio
import os
from playwright.async_api import async_playwright
from motor.motor_asyncio import AsyncIOMotorClient
from cryptography.fernet import Fernet

async def debug_login():
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
        page.set_default_timeout(15000)
        
        print("1. Going to sign-in page...")
        await page.goto("https://uttermost.com/sign-in", wait_until='networkidle')
        await page.wait_for_timeout(8000)
        
        # Get ALL password fields with their HTML
        print("\n2. Getting all password field details...")
        pwd_info = await page.evaluate('''() => {
            const pwds = document.querySelectorAll('input[type="password"]');
            const info = [];
            pwds.forEach((p, i) => {
                const rect = p.getBoundingClientRect();
                // Get parent form if exists
                const form = p.closest('form');
                const formId = form ? form.id || form.className : 'no-form';
                info.push({
                    index: i,
                    id: p.id,
                    name: p.name,
                    className: p.className,
                    y: rect.top,
                    height: rect.height,
                    visible: rect.width > 0 && rect.height > 0,
                    formId: formId,
                    outerHTML: p.outerHTML.substring(0, 200)
                });
            });
            return info;
        }''')
        
        print(f"   Found {len(pwd_info)} password fields:")
        for p in pwd_info:
            print(f"   - id='{p['id']}', name='{p['name']}', y={p['y']:.0f}, visible={p['visible']}")
            print(f"     form: {p['formId'][:50]}")
            print(f"     HTML: {p['outerHTML'][:100]}")
        
        # Fill email first using locator
        print("\n3. Filling email...")
        await page.locator('#email').fill(username)
        await page.wait_for_timeout(500)
        print(f"   Filled: {username}")
        
        # Now fill password using the EXACT id from the form
        # Based on the analysis, there's a password field in the login form
        print("\n4. Filling password using different methods...")
        
        # Method 1: Try by name
        try:
            await page.locator('input[name="password"]').first.fill(password)
            print("   Method 1 (name=password): SUCCESS")
        except Exception as e:
            print(f"   Method 1 failed: {e}")
        
        # Method 2: Try by type within form
        try:
            await page.locator('form input[type="password"]').first.fill(password, force=True)
            print("   Method 2 (form input[type=password]): SUCCESS")
        except Exception as e:
            print(f"   Method 2 failed: {e}")
        
        # Method 3: Try using Tab from email field
        print("\n5. Using Tab navigation method...")
        await page.locator('#email').click()
        await page.keyboard.press('Tab')
        await page.wait_for_timeout(500)
        await page.keyboard.type(password, delay=30)
        print("   Typed password via Tab navigation")
        
        await page.wait_for_timeout(500)
        await page.screenshot(path='/tmp/utt_pwd_filled.png')
        print("\n6. Screenshot: /tmp/utt_pwd_filled.png")
        
        # Submit
        print("\n7. Submitting...")
        await page.keyboard.press('Enter')
        await page.wait_for_timeout(12000)
        
        await page.screenshot(path='/tmp/utt_result.png')
        current_url = page.url
        print(f"\n8. URL after submit: {current_url}")
        
        # Go to product
        print("\n9. Going to product page...")
        await page.goto("https://uttermost.com/karnes-drink-table-50340", wait_until='networkidle')
        await page.wait_for_timeout(8000)
        
        await page.screenshot(path='/tmp/utt_product_final.png')
        
        page_text = await page.inner_text('body')
        import re
        prices = re.findall(r'\$[\d,]+\.?\d*', page_text)
        print(f"\n10. Prices: {prices[:5] if prices else 'NONE'}")
        
        await browser.close()
        client.close()

asyncio.run(debug_login())

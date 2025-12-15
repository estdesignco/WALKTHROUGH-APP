"""
Debug Uttermost login - V2 with force fill
"""
import asyncio
import os
from dotenv import load_dotenv
from playwright.async_api import async_playwright
from motor.motor_asyncio import AsyncIOMotorClient
from cryptography.fernet import Fernet

load_dotenv()

async def test_uttermost():
    # Get credentials
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
        page.set_default_timeout(30000)
        
        print("1. Going to Uttermost sign-in page...")
        await page.goto("https://uttermost.com/sign-in", wait_until='networkidle')
        await page.wait_for_timeout(8000)
        
        # Fill email using JavaScript to bypass visibility issues
        print("2. Filling email via JavaScript...")
        await page.evaluate(f'''
            document.querySelector('input[type="email"]').value = "{username}";
            document.querySelector('input[type="email"]').dispatchEvent(new Event('input', {{ bubbles: true }}));
        ''')
        await page.wait_for_timeout(1000)
        
        # Fill password using JavaScript
        print("3. Filling password via JavaScript...")
        pwd_filled = await page.evaluate(f'''
            const pwdInputs = document.querySelectorAll('input[type="password"]');
            console.log("Found " + pwdInputs.length + " password inputs");
            for (let pwd of pwdInputs) {{
                pwd.value = "{password}";
                pwd.dispatchEvent(new Event('input', {{ bubbles: true }}));
            }}
            return pwdInputs.length;
        ''')
        print(f"   Filled {pwd_filled} password fields")
        await page.wait_for_timeout(500)
        
        # Screenshot before clicking login
        await page.screenshot(path='/tmp/uttermost_filled.png')
        print("   Screenshot: /tmp/uttermost_filled.png")
        
        # Click login button via JavaScript
        print("4. Clicking login button...")
        await page.evaluate('''
            const btn = document.querySelector('button[type="submit"]') || 
                        Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('LOGIN') || b.textContent.includes('Log'));
            if (btn) btn.click();
        ''')
        
        # Wait for login
        print("5. Waiting for login (15 seconds)...")
        await page.wait_for_timeout(15000)
        
        # Screenshot after login
        await page.screenshot(path='/tmp/uttermost_after_login.png')
        print("   Screenshot: /tmp/uttermost_after_login.png")
        
        # Check URL - if still on sign-in, login failed
        current_url = page.url
        print(f"   Current URL: {current_url}")
        
        page_text = await page.inner_text('body')
        has_error = 'invalid' in page_text.lower() or 'incorrect' in page_text.lower() or 'error' in page_text.lower()
        print(f"   Error messages found: {has_error}")
        
        # If login looks successful, go to product
        if 'sign-in' not in current_url.lower() or not has_error:
            print("\n6. Going to product page...")
            await page.goto("https://uttermost.com/karnes-drink-table-50340", wait_until='networkidle')
            await page.wait_for_timeout(8000)
            
            # Screenshot
            await page.screenshot(path='/tmp/uttermost_product.png')
            print("   Screenshot: /tmp/uttermost_product.png")
            
            # Look for price
            page_text = await page.inner_text('body')
            import re
            prices = re.findall(r'\$[\d,]+\.?\d*', page_text)
            print(f"   Prices found: {prices[:5] if prices else 'NONE'}")
            
            # Look for elements with price-related classes
            price_html = await page.evaluate('''
                const elements = document.querySelectorAll('[class*="price"], [class*="Price"], [data-price]');
                return Array.from(elements).slice(0, 5).map(e => e.outerHTML.substring(0, 200));
            ''')
            if price_html:
                print("   Price elements HTML:")
                for h in price_html:
                    print(f"     {h}")
        
        await browser.close()
        client.close()
        print("\n✅ Done!")

asyncio.run(test_uttermost())

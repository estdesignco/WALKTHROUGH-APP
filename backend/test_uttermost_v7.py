"""
Uttermost login - Use React-compatible input methods
"""
import asyncio
import os
from dotenv import load_dotenv
from playwright.async_api import async_playwright
from motor.motor_asyncio import AsyncIOMotorClient
from cryptography.fernet import Fernet

load_dotenv()

async def test_uttermost():
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
        
        print("1. Going to Uttermost sign-in...")
        await page.goto("https://uttermost.com/sign-in", wait_until='networkidle', timeout=60000)
        await page.wait_for_timeout(5000)
        
        # Find the login form email input using its label 'for' attribute
        print("2. Finding email input via for=email or id=email...")
        
        # The label says "for=email", so input should have id="email"
        email_selector = '#email, input#email, input[id="email"], form input[type="text"]:first-child'
        
        try:
            # Use locator fill which is React-friendly
            await page.locator('#email').fill(username, timeout=10000)
            print(f"   Email filled: {username}")
        except Exception as e:
            print(f"   #email failed: {e}")
            
            # Try finding any input inside the form
            form_inputs = await page.query_selector_all('form.signIn-form-vN4 input')
            print(f"   Found {len(form_inputs)} inputs in form")
            
            for i, inp in enumerate(form_inputs):
                inp_type = await inp.get_attribute('type') or 'text'
                inp_id = await inp.get_attribute('id') or 'no-id'
                print(f"   Input {i}: type={inp_type}, id={inp_id}")
                
                if inp_type != 'password' and inp_type != 'hidden':
                    # This should be the email input
                    print(f"   -> Filling this input as email...")
                    await inp.focus()
                    await inp.fill(username)
                    # Trigger React events
                    await page.evaluate('''(el) => {
                        el.dispatchEvent(new Event('input', { bubbles: true }));
                        el.dispatchEvent(new Event('change', { bubbles: true }));
                        el.dispatchEvent(new Event('blur', { bubbles: true }));
                    }''', inp)
                    break
        
        await page.wait_for_timeout(1000)
        
        # Screenshot after email
        await page.screenshot(path='/tmp/utt_after_email.png')
        print("   Screenshot: /tmp/utt_after_email.png")
        
        # Now password
        print("3. Finding password input...")
        try:
            await page.locator('form.signIn-form-vN4 input[type="password"]').first.fill(password, timeout=10000)
            print("   Password filled")
        except Exception as e:
            print(f"   Password fill failed: {e}")
            # Try via query selector
            pwd = await page.query_selector('form input[type="password"]')
            if pwd:
                await pwd.focus()
                await pwd.fill(password)
                await page.evaluate('''(el) => {
                    el.dispatchEvent(new Event('input', { bubbles: true }));
                    el.dispatchEvent(new Event('change', { bubbles: true }));
                }''', pwd)
                print("   Password filled via query selector")
        
        await page.wait_for_timeout(500)
        await page.screenshot(path='/tmp/utt_after_pwd.png')
        
        # Submit
        print("4. Submitting...")
        try:
            await page.locator('form.signIn-form-vN4 button[type="submit"]').click(timeout=5000)
            print("   Submit clicked")
        except:
            await page.keyboard.press('Enter')
            print("   Submitted via Enter")
        
        print("5. Waiting for login...")
        await page.wait_for_timeout(15000)
        await page.screenshot(path='/tmp/utt_after_submit.png')
        
        url = page.url
        print(f"   URL: {url}")
        
        if 'sign-in' not in url:
            print("   LOGIN SUCCESSFUL!")
        else:
            page_text = await page.inner_text('body')
            if 'incorrect' in page_text.lower() or 'invalid' in page_text.lower():
                print("   INVALID CREDENTIALS")
            else:
                print("   Still on sign-in page, login may have failed")
        
        # Go to product
        print("6. Product page...")
        await page.goto("https://uttermost.com/karnes-drink-table-50340", wait_until='networkidle', timeout=60000)
        await page.wait_for_timeout(10000)
        await page.screenshot(path='/tmp/utt_product.png')
        
        text = await page.inner_text('body')
        import re
        prices = re.findall(r'\$\s*[\d,]+\.?\d*', text)
        print(f"   Prices: {prices[:5] if prices else 'NONE'}")
        
        await browser.close()
        client.close()

asyncio.run(test_uttermost())

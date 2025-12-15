"""
Uttermost login - Wait for specific elements + fallback strategies
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
        
        # Wait specifically for the login form to appear
        print("2. Waiting for login form...")
        try:
            # Wait for a heading or label that indicates login form
            await page.wait_for_selector('text=Log In', timeout=20000)
            print("   Found 'Log In' text")
        except:
            print("   Could not find 'Log In' text")
        
        await page.wait_for_timeout(3000)
        
        # Get form using JavaScript - look for login-specific containers
        print("3. Finding login form via JS...")
        form_info = await page.evaluate('''() => {
            // Find the login heading
            const headings = Array.from(document.querySelectorAll('h1, h2, h3, div'));
            for (const h of headings) {
                if (h.textContent && h.textContent.trim().toLowerCase() === 'log in') {
                    // Found login heading - look for nearby inputs
                    const parent = h.closest('form') || h.parentElement;
                    if (parent) {
                        const emailInput = parent.querySelector('input[type="email"]') || 
                                          parent.querySelector('input[placeholder*="mail"]');
                        const pwdInput = parent.querySelector('input[type="password"]');
                        return {
                            foundHeading: true,
                            hasEmailInput: !!emailInput,
                            hasPasswordInput: !!pwdInput,
                            parentHTML: parent.innerHTML.substring(0, 500)
                        };
                    }
                }
            }
            
            // Alternative: just find all email inputs and their parents
            const allEmails = document.querySelectorAll('input[type="email"]');
            const info = [];
            allEmails.forEach((e, i) => {
                const rect = e.getBoundingClientRect();
                info.push({
                    index: i,
                    y: rect.top,
                    placeholder: e.placeholder,
                    parentClasses: e.parentElement ? e.parentElement.className : ''
                });
            });
            
            return { foundHeading: false, emailInputs: info };
        }''')
        
        print(f"   Form info: {form_info}")
        
        # Try using locator with label text
        print("4. Finding email via label...")
        try:
            # Use the label to find the input
            email_input = await page.locator('label:has-text("Email") + input, label:has-text("Email") >> xpath=following-sibling::input, input[placeholder*="Email"]').first.element_handle()
            if email_input:
                box = await email_input.bounding_box()
                print(f"   Found email input at y={box['y']:.0f}")
                await email_input.click()
                await page.keyboard.type(username, delay=30)
                print(f"   Typed email: {username}")
        except Exception as e:
            print(f"   Label method failed: {e}")
            
            # Fallback: click on coordinates where form should be
            print("   Trying coordinate click fallback...")
            # Based on screenshot analysis, login form is around x=700-900, y=400-600
            await page.mouse.click(850, 435)  # Click where email field should be
            await page.wait_for_timeout(500)
            await page.keyboard.type(username, delay=30)
        
        await page.wait_for_timeout(500)
        
        # Screenshot
        await page.screenshot(path='/tmp/utt_email_typed.png')
        print("   Screenshot: /tmp/utt_email_typed.png")
        
        # Tab to password or click on password field
        print("5. Filling password...")
        try:
            pwd_input = await page.locator('label:has-text("Password") + input, input[type="password"]').first.element_handle()
            if pwd_input:
                box = await pwd_input.bounding_box()
                if box and box['y'] < 700:  # Make sure it's the login password, not footer
                    await pwd_input.click()
                    await page.keyboard.type(password, delay=30)
                    print("   Password typed via locator")
                else:
                    raise Exception("Password field too low on page")
        except Exception as e:
            print(f"   Password locator failed: {e}")
            # Fallback: Tab from email
            await page.keyboard.press('Tab')
            await page.wait_for_timeout(300)
            await page.keyboard.type(password, delay=30)
            print("   Password typed via Tab")
        
        await page.wait_for_timeout(500)
        await page.screenshot(path='/tmp/utt_pwd_typed.png')
        
        # Submit
        print("6. Submitting login...")
        try:
            login_btn = await page.locator('button:has-text("LOGIN"), button:has-text("Log In")').first.element_handle()
            if login_btn:
                box = await login_btn.bounding_box()
                if box and box['y'] < 700:
                    await login_btn.click()
                    print("   Login button clicked")
        except:
            await page.keyboard.press('Enter')
            print("   Submitted via Enter key")
        
        # Wait for login
        print("7. Waiting for login...")
        await page.wait_for_timeout(15000)
        await page.screenshot(path='/tmp/utt_after_login.png')
        print(f"   URL: {page.url}")
        
        # Go to product
        print("8. Product page...")
        await page.goto("https://uttermost.com/karnes-drink-table-50340", wait_until='networkidle', timeout=60000)
        await page.wait_for_timeout(8000)
        await page.screenshot(path='/tmp/utt_product.png')
        
        text = await page.inner_text('body')
        import re
        prices = re.findall(r'\$\s*[\d,]+\.?\d*', text)
        print(f"   Prices: {prices[:5] if prices else 'NONE'}")
        
        await browser.close()
        client.close()

asyncio.run(test_uttermost())

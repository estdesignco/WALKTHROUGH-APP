#!/usr/bin/env python3
import asyncio
from playwright.async_api import async_playwright

async def test_full_login():
    async with async_playwright() as p:
        browser = await p.chromium.launch(
            executable_path='/pw-browsers/chromium_headless_shell-1187/chrome-linux/headless_shell',
            headless=False
        )
        page = await browser.new_page()
        
        print("Step 1: Go to Loloi homepage")
        await page.goto('https://www.loloirugs.com/')
        await page.wait_for_timeout(3000)
        await page.screenshot(path='/tmp/step1_homepage.png')
        
        print("Step 2: Find and click account/login")
        # Try to find login link
        login_links = await page.query_selector_all('a[href*="account"], a:has-text("Account"), a:has-text("Sign In")')
        if login_links:
            await login_links[0].click()
            await page.wait_for_timeout(3000)
            await page.screenshot(path='/tmp/step2_login_page.png')
        
        print("Step 3: Fill in credentials")
        # Fill email
        await page.type('input[type="email"], input[name="email"]', 'estdesignco@gmail.com', delay=100)
        await page.wait_for_timeout(1000)
        
        # Fill password
        await page.type('input[type="password"]', 'momandnet1991', delay=100)
        await page.wait_for_timeout(1000)
        await page.screenshot(path='/tmp/step3_filled.png')
        
        print("Step 4: Click login button")
        await page.click('button[type="submit"], input[type="submit"]')
        await page.wait_for_timeout(5000)
        await page.screenshot(path='/tmp/step4_after_login.png')
        
        print("Step 5: Go to product page")
        await page.goto('https://www.loloirugs.com/products/bar-05-jm-ivory-taupe')
        await page.wait_for_timeout(5000)
        await page.screenshot(path='/tmp/step5_product_page.png')
        
        # Get price info
        price_text = await page.inner_text('body')
        print("\n=== PAGE CONTENT (searching for price) ===")
        if '$' in price_text:
            lines = price_text.split('\n')
            for line in lines:
                if '$' in line and len(line) < 100:
                    print(f"Price line: {line}")
        
        print("\nScreenshots saved to /tmp/step*.png")
        print("Check them to see what's happening!")
        
        await browser.close()

if __name__ == '__main__':
    asyncio.run(test_full_login())

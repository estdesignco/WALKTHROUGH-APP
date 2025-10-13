#!/usr/bin/env python3
import asyncio
from playwright.async_api import async_playwright

async def test_loloi():
    async with async_playwright() as p:
        browser = await p.chromium.launch(
            executable_path='/pw-browsers/chromium_headless_shell-1187/chrome-linux/headless_shell',
            headless=False  # VISIBLE so we can see what's happening
        )
        page = await browser.new_page()
        
        print("Navigating to Loloi...")
        await page.goto('https://www.loloirugs.com/collections/rugs-collection')
        await page.wait_for_timeout(3000)
        
        # Take screenshot of login page
        await page.screenshot(path='/tmp/loloi_before_login.png')
        print("Screenshot saved: /tmp/loloi_before_login.png")
        
        # Check if there's a login button
        login_buttons = await page.query_selector_all('a:has-text("Account"), a:has-text("Sign In"), a:has-text("Log In")')
        print(f"Found {len(login_buttons)} potential login buttons")
        
        if login_buttons:
            await login_buttons[0].click()
            await page.wait_for_timeout(3000)
            await page.screenshot(path='/tmp/loloi_login_page.png')
            print("Login page screenshot: /tmp/loloi_login_page.png")
        
        # Check page content
        content = await page.content()
        print(f"\nPage has {len(content)} characters")
        print(f"Has 'password' field: {'password' in content.lower()}")
        print(f"Has 'email' field: {'email' in content.lower()}")
        print(f"Has 'sign in': {'sign in' in content.lower()}")
        
        await browser.close()

if __name__ == '__main__':
    asyncio.run(test_loloi())

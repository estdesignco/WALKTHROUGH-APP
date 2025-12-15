"""
Find a real Four Hands product URL
"""
import asyncio
from playwright.async_api import async_playwright

async def find_product():
    async with async_playwright() as p:
        browser = await p.chromium.launch(
            executable_path='/pw-browsers/chromium_headless_shell-1200/chrome-linux/headless_shell',
            headless=True
        )
        context = await browser.new_context(viewport={'width': 1920, 'height': 1080})
        page = await context.new_page()
        
        # Go to Four Hands homepage
        await page.goto("https://www.fourhands.com", wait_until='networkidle')
        await page.wait_for_timeout(5000)
        
        # Get all links
        links = await page.evaluate('''() => {
            return Array.from(document.querySelectorAll('a[href*="product"]')).map(a => a.href).slice(0, 10);
        }''')
        
        print("Product links found:")
        for link in links:
            print(f"  {link}")
        
        await browser.close()

asyncio.run(find_product())

"""
Find actual Four Hands product URL structure
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
    
    async with async_playwright() as p:
        browser = await p.chromium.launch(
            executable_path='/pw-browsers/chromium_headless_shell-1200/chrome-linux/headless_shell',
            headless=True
        )
        context = await browser.new_context(viewport={'width': 1920, 'height': 1080})
        page = await context.new_page()
        
        # Login first
        await page.goto("https://fourhands.com/login", wait_until='networkidle')
        await page.wait_for_timeout(5000)
        
        await page.fill('input[type="text"]', username)
        await page.fill('input[type="password"]', password)
        await page.click('button[type="submit"]')
        await page.wait_for_timeout(10000)
        
        # Navigate to shop
        print("Navigating to shop...")
        await page.goto("https://fourhands.com/shop", wait_until='networkidle')
        await page.wait_for_timeout(5000)
        
        await page.screenshot(path='/tmp/fh_shop.png')
        
        # Get all links
        all_links = await page.evaluate('''() => {
            return Array.from(document.querySelectorAll('a')).map(a => ({
                href: a.href,
                text: a.textContent.trim().substring(0, 50)
            })).filter(l => l.href.includes('fourhands.com')).slice(0, 50);
        }''')
        
        print("\nAll links on shop page:")
        for link in all_links:
            if '/product/' in link['href'] or '/item/' in link['href'] or '/shop/' in link['href']:
                print(f"  {link['href']}")
        
        # Try clicking on a product
        product_links = await page.query_selector_all('a[href*="QUARTZ"], a[href*="product"]')
        print(f"\nFound {len(product_links)} product-related links")
        
        if len(product_links) > 0:
            href = await product_links[0].get_attribute('href')
            print(f"First product link: {href}")
        
        await browser.close()
        client.close()

asyncio.run(test())

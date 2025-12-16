import asyncio
from playwright.async_api import async_playwright
import json

async def test():
    async with async_playwright() as p:
        browser = await p.chromium.launch(
            executable_path='/pw-browsers/chromium_headless_shell-1200/chrome-linux/headless_shell',
            headless=True
        )
        page = await browser.new_page()
        await page.goto("https://www.bernhardt.com/shop/K1089", wait_until='networkidle')
        await page.wait_for_timeout(5000)
        
        json_ld = await page.locator('script[type="application/ld+json"]').all_text_contents()
        for script in json_ld:
            try:
                data = json.loads(script)
                if 'image' in data:
                    print(f"IMAGE TYPE: {type(data['image'])}")
                    print(f"IMAGE VALUE: {data['image']}")
                    
                    img = data['image']
                    img_url = img if isinstance(img, str) else (img[0] if isinstance(img, list) and img else None)
                    print(f"EXTRACTED URL: {img_url}")
            except Exception as e:
                print(f"Error: {e}")
        
        await browser.close()

asyncio.run(test())

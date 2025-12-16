"""
Debug Bernhardt image extraction specifically
"""
import asyncio
from playwright.async_api import async_playwright
import json
import re

async def test():
    async with async_playwright() as p:
        browser = await p.chromium.launch(
            executable_path='/pw-browsers/chromium_headless_shell-1200/chrome-linux/headless_shell',
            headless=True
        )
        context = await browser.new_context(viewport={'width': 1920, 'height': 1080})
        page = await context.new_page()
        
        print("Loading Bernhardt product page...")
        await page.goto("https://www.bernhardt.com/shop/K1089?position=-1", wait_until='networkidle')
        await page.wait_for_timeout(5000)
        
        # Check for JSON-LD
        print("\n=== JSON-LD Data ===")
        json_ld = await page.locator('script[type="application/ld+json"]').all_text_contents()
        for i, script in enumerate(json_ld):
            try:
                data = json.loads(script)
                print(f"JSON-LD {i+1}: {json.dumps(data, indent=2)[:500]}")
                if isinstance(data, dict) and 'image' in data:
                    print(f"IMAGE FOUND: {data['image']}")
            except:
                pass
        
        # Check for OG image
        print("\n=== OG:IMAGE ===")
        og_image = await page.locator('meta[property="og:image"]').get_attribute('content')
        print(f"OG Image: {og_image}")
        
        # Check for Twitter image
        print("\n=== TWITTER:IMAGE ===")
        try:
            tw_image = await page.locator('meta[name="twitter:image"]').get_attribute('content')
            print(f"Twitter Image: {tw_image}")
        except:
            print("No Twitter image")
        
        # Check for all images on page
        print("\n=== ALL IMAGES (first 10) ===")
        images = await page.query_selector_all('img')
        for i, img in enumerate(images[:10]):
            src = await img.get_attribute('src') or ''
            alt = await img.get_attribute('alt') or ''
            print(f"  {i+1}. {src[:80]}...")
        
        await browser.close()

asyncio.run(test())

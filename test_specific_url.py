#!/usr/bin/env python3
import asyncio
from playwright.async_api import async_playwright
import os

os.environ['PLAYWRIGHT_BROWSERS_PATH'] = '/pw-browsers'

async def test():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True, args=['--no-sandbox'])
        context = await browser.new_context(
            user_agent='Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
        )
        page = await context.new_page()
        
        # Login
        print("Logging in...")
        await page.goto('https://fourhands.com/login', wait_until='networkidle', timeout=60000)
        await page.wait_for_timeout(5000)
        
        inputs = await page.query_selector_all('input')
        await inputs[0].fill('81887')
        await inputs[1].fill('momandneil')
        await inputs[1].press('Enter')
        
        try:
            await page.wait_for_navigation(timeout=15000)
        except:
            await page.wait_for_timeout(8000)
        
        print(f"Logged in! URL: {page.url}\n")
        
        # Try the exact URL you provided
        test_url = "https://fourhands.com/product/234804-001"
        print(f"Testing URL: {test_url}")
        
        await page.goto(test_url, wait_until='domcontentloaded', timeout=30000)
        await page.wait_for_timeout(5000)
        
        print(f"Final URL: {page.url}")
        print(f"Page title: {await page.title()}")
        
        # Check if we're on a product page
        has_product = await page.query_selector('.product, [itemtype*="Product"], .product-single, img[alt]')
        print(f"Has product content: {has_product is not None}")
        
        if has_product:
            # Get images
            imgs = await page.query_selector_all('img')
            print(f"\nFound {len(imgs)} images")
            
            for i, img in enumerate(imgs[:5]):
                src = await img.get_attribute('src')
                alt = await img.get_attribute('alt')
                if src:
                    print(f"  {i+1}. {src[:80]}...")
                    if alt:
                        print(f"      Alt: {alt[:50]}")
        else:
            print("No product content found - saving page")
            await page.screenshot(path='/tmp/test_product.png')
            content = await page.content()
            with open('/tmp/test_product.html', 'w') as f:
                f.write(content)
        
        await browser.close()

asyncio.run(test())

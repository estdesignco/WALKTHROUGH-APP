#!/usr/bin/env python3
import asyncio
from playwright.async_api import async_playwright
import os

os.environ['PLAYWRIGHT_BROWSERS_PATH'] = '/pw-browsers'

async def debug():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True, args=['--no-sandbox'])
        page = await browser.new_page()
        
        # Set a real user agent
        await page.set_extra_http_headers({
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        })
        
        print("🔍 Loading Perigold...")
        response = await page.goto('https://www.perigold.com/keyword.php?keyword=244120-001', 
                                   wait_until='networkidle', timeout=30000)
        
        print(f"Status: {response.status}")
        print(f"URL: {page.url}")
        
        # Wait longer for content to load
        await page.wait_for_timeout(5000)
        
        # Get page title
        title = await page.title()
        print(f"Title: {title}")
        
        # Check if we got redirected to product page
        if '/pdp/' in page.url or '/product/' in page.url:
            print("✓ On product page!")
            
            # Wait for images to load
            await page.wait_for_selector('img', timeout=10000)
            
            # Get all images
            images = await page.query_selector_all('img')
            print(f"\nFound {len(images)} total images")
            
            product_imgs = []
            for i, img in enumerate(images):
                src = await img.get_attribute('src')
                alt = await img.get_attribute('alt')
                
                if src:
                    # Check for product images
                    if any(x in src for x in ['secure.img', 'assets.wfcdn', 'product', 'furniture']):
                        product_imgs.append(src)
                        print(f"\n✓ Product Image {len(product_imgs)}:")
                        print(f"  URL: {src[:100]}...")
                        if alt:
                            print(f"  Alt: {alt[:50]}")
            
            if product_imgs:
                print(f"\n✅ SUCCESS! Found {len(product_imgs)} product images")
            else:
                print(f"\n⚠️ No product images identified")
                print(f"\nShowing all image URLs:")
                for img in images[:5]:
                    src = await img.get_attribute('src')
                    if src:
                        print(f"  - {src[:100]}")
        else:
            print(f"✗ Not on product page, showing page content snippet:")
            content = await page.content()
            print(content[:500])
        
        await browser.close()

asyncio.run(debug())

#!/usr/bin/env python3
"""Test Playwright with proper browser path"""
import asyncio
from playwright.async_api import async_playwright
import os

# Set browser path
os.environ['PLAYWRIGHT_BROWSERS_PATH'] = '/pw-browsers'

async def test_playwright():
    async with async_playwright() as p:
        print("✓ Playwright started")
        
        browser = await p.chromium.launch(
            headless=True,
            args=['--no-sandbox', '--disable-setuid-sandbox']
        )
        print("✓ Browser launched")
        
        page = await browser.new_page()
        print("✓ Page created")
        
        # Test with Perigold
        print("\n🔍 Testing Perigold scraping...")
        await page.goto('https://www.perigold.com/keyword.php?keyword=244120-001', timeout=30000)
        print(f"✓ Loaded: {page.url}")
        
        # Wait for images to load
        await page.wait_for_timeout(3000)
        
        # Get all image elements
        images = await page.query_selector_all('img')
        print(f"✓ Found {len(images)} img tags")
        
        # Find product images
        product_images = []
        for img in images[:20]:
            src = await img.get_attribute('src')
            if src and ('secure.img' in src or 'assets.wfcdn' in src):
                product_images.append(src)
                print(f"  📸 {src[:80]}...")
        
        print(f"\n✅ Found {len(product_images)} product images!")
        
        await browser.close()
        
        return len(product_images) > 0

asyncio.run(test_playwright())

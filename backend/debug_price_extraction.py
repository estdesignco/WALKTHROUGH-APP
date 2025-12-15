"""
Debug what prices are actually on the Uttermost product page
"""
import asyncio
import os
from playwright.async_api import async_playwright

async def debug():
    async with async_playwright() as p:
        browser = await p.chromium.launch(
            executable_path='/pw-browsers/chromium_headless_shell-1200/chrome-linux/headless_shell',
            headless=True
        )
        context = await browser.new_context(viewport={'width': 1920, 'height': 1080})
        page = await context.new_page()
        
        print("1. Loading Uttermost product page...")
        await page.goto("https://uttermost.com/karnes-drink-table-50340", wait_until='networkidle')
        await page.wait_for_timeout(10000)
        
        # Get all text on page
        all_text = await page.inner_text('body')
        
        # Find ALL dollar amounts
        import re
        prices = re.findall(r'\$[\d,]+\.?\d*', all_text)
        print(f"\n2. ALL dollar amounts found on page: {prices}")
        
        # Check for any element with 'price' in class/id
        print("\n3. Looking for price-related elements...")
        price_elements = await page.evaluate('''() => {
            const results = [];
            
            // Get elements with 'price' in class or id
            const allElements = document.querySelectorAll('[class*="price"], [class*="Price"], [id*="price"], [id*="Price"], [class*="cost"], [class*="Cost"]');
            allElements.forEach(el => {
                const text = el.textContent.trim();
                if (text && text.length < 100) {
                    results.push({
                        tag: el.tagName,
                        class: el.className,
                        id: el.id,
                        text: text.substring(0, 80)
                    });
                }
            });
            
            // Also check for elements containing $ symbol
            const allSpans = document.querySelectorAll('span, div, p');
            allSpans.forEach(el => {
                const text = el.textContent.trim();
                if (text && text.includes('$') && text.length < 50) {
                    results.push({
                        tag: el.tagName,
                        class: el.className,
                        text: text.substring(0, 50),
                        hasPrice: true
                    });
                }
            });
            
            return results.slice(0, 30);
        }''')
        
        for el in price_elements:
            print(f"   {el.get('tag')} class='{el.get('class', '')[:40]}' text='{el.get('text')}'")
        
        # Check for finish/color elements
        print("\n4. Looking for finish/color elements...")
        finish_elements = await page.evaluate('''() => {
            const results = [];
            const allElements = document.querySelectorAll('[class*="finish"], [class*="Finish"], [class*="color"], [class*="Color"], [class*="material"], [class*="Material"]');
            allElements.forEach(el => {
                const text = el.textContent.trim();
                if (text && text.length < 100) {
                    results.push({
                        class: el.className.substring(0, 40),
                        text: text.substring(0, 60)
                    });
                }
            });
            return results.slice(0, 20);
        }''')
        
        for el in finish_elements:
            print(f"   class='{el.get('class')}' text='{el.get('text')}'")
        
        # Screenshot
        await page.screenshot(path='/tmp/debug_product_page.png')
        print("\n5. Screenshot: /tmp/debug_product_page.png")
        
        # Get specific product info section
        print("\n6. Looking for product details section...")
        product_info = await page.evaluate('''() => {
            // Look for common product info containers
            const containers = document.querySelectorAll('.product-info, .product-details, .product-specs, [class*="ProductDetail"], [class*="productInfo"]');
            const results = [];
            containers.forEach(c => {
                results.push({
                    class: c.className.substring(0, 50),
                    html: c.innerHTML.substring(0, 500)
                });
            });
            return results;
        }''')
        
        for info in product_info:
            print(f"   Container: {info.get('class')}")
            print(f"   HTML preview: {info.get('html')[:200]}...")
        
        await browser.close()
        print("\n✅ Debug complete")

asyncio.run(debug())

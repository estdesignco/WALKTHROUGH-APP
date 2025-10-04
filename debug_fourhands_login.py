#!/usr/bin/env python3
"""
DEBUG Four Hands login - see what's actually happening
"""
import asyncio
from playwright.async_api import async_playwright
import os

os.environ['PLAYWRIGHT_BROWSERS_PATH'] = '/pw-browsers'

async def debug_login():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True, args=['--no-sandbox'])
        context = await browser.new_context(
            user_agent='Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
        )
        
        page = await context.new_page()
        
        # Capture network requests
        requests_log = []
        
        def log_request(request):
            if 'login' in request.url or 'auth' in request.url or 'api' in request.url:
                requests_log.append({
                    'url': request.url,
                    'method': request.method,
                    'post_data': request.post_data
                })
        
        page.on('request', log_request)
        
        print("Loading login page...")
        await page.goto('https://fourhands.com/login', wait_until='networkidle', timeout=60000)
        await page.wait_for_timeout(5000)
        
        # Get page content to see actual HTML
        content = await page.content()
        
        # Save HTML for inspection
        with open('/tmp/fourhands_login.html', 'w') as f:
            f.write(content)
        print("✓ Saved page HTML to /tmp/fourhands_login.html")
        
        # Find all inputs
        inputs = await page.query_selector_all('input')
        print(f"\nFound {len(inputs)} inputs:")
        for i, inp in enumerate(inputs):
            name = await inp.get_attribute('name')
            placeholder = await inp.get_attribute('placeholder')
            input_type = await inp.get_attribute('type')
            print(f"  {i+1}. type={input_type}, name={name}, placeholder={placeholder}")
        
        # Fill form
        print(f"\nFilling form with credentials...")
        if len(inputs) >= 2:
            await inputs[0].fill('81887')
            await inputs[1].fill('momandneil')
            print("✓ Filled")
        
        # Find button
        buttons = await page.query_selector_all('button')
        print(f"\nFound {len(buttons)} buttons:")
        for i, btn in enumerate(buttons):
            text = await btn.text_content()
            btn_type = await btn.get_attribute('type')
            print(f"  {i+1}. type={btn_type}, text={text}")
        
        # Click submit
        print(f"\nClicking submit button...")
        if buttons:
            await buttons[0].click()
            await page.wait_for_timeout(10000)
        
        print(f"\nNetwork requests captured:")
        for req in requests_log:
            print(f"  {req['method']} {req['url']}")
            if req['post_data']:
                print(f"    Data: {req['post_data'][:200]}")
        
        print(f"\nFinal URL: {page.url}")
        
        # Check for errors
        page_text = await page.content()
        if 'error' in page_text.lower() or 'invalid' in page_text.lower():
            print("\n⚠️ Possible error message on page")
            # Find error text
            error_elems = await page.query_selector_all('.error, .alert, [class*="error"], [class*="invalid"]')
            for elem in error_elems:
                text = await elem.text_content()
                if text and text.strip():
                    print(f"  Error: {text.strip()}")
        
        await browser.close()

asyncio.run(debug_login())

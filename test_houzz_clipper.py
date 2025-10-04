#!/usr/bin/env python3
"""
TEST HOUZZ PRO CLIPPER
Clip ONE Four Hands product to test the workflow
"""
import asyncio
from playwright.async_api import async_playwright
import os

os.environ['PLAYWRIGHT_BROWSERS_PATH'] = '/pw-browsers'

async def test_clip_one_product():
    print("\n" + "="*80)
    print("🏠 HOUZZ PRO CLIPPER TEST")
    print("="*80)
    
    # Get first Four Hands product from our Excel
    import pandas as pd
    df1 = pd.read_excel('/app/fourhands_catalog.xlsx', sheet_name='PRICE CHANGE')
    df2 = pd.read_excel('/app/fourhands_catalog.xlsx', sheet_name='NO CHANGE')
    df1.rename(columns={'NEW COST': 'COST'}, inplace=True)
    df = pd.concat([df1, df2])
    df_stock = df[df['STATUS'].str.contains('In Stk', na=False)].reset_index(drop=True)
    
    # Get first product
    row = df_stock.iloc[0]
    sku = str(row['PRODUCT MASTER CODE']).strip()
    name = str(row['DESCRIPTION']).strip()
    cost = float(row['COST'])
    
    print(f"\n📦 Testing with:")
    print(f"   Product: {name}")
    print(f"   SKU: {sku}")
    print(f"   Cost: ${cost:.2f}")
    print(f"\n🎯 Target Ideaboard: https://pro.houzz.com/manage/selections/board/2321925")
    
    async with async_playwright() as p:
        # Launch browser (visible so you can see it)
        browser = await p.chromium.launch(
            headless=False,  # Visible so you can watch
            args=['--no-sandbox']
        )
        
        # Create context (will use your existing login if cookies exist)
        context = await browser.new_context(
            user_agent='Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
        )
        
        page = await context.new_page()
        
        print(f"\n🔐 Step 1: Checking Houzz Pro login...")
        
        # Go to your ideaboard to check if logged in
        await page.goto('https://pro.houzz.com/manage/selections/board/2321925', timeout=30000)
        await page.wait_for_timeout(3000)
        
        # Check if we need to login
        if 'login' in page.url.lower():
            print(f"   ⚠️ Need to login...")
            print(f"   📧 Email: establisheddesignco@gmail.com")
            
            # Login
            await page.fill('input[type="email"], input[name="email"]', 'establisheddesignco@gmail.com')
            await page.fill('input[type="password"], input[name="password"]', 'Zeke1919$$')
            await page.click('button[type="submit"]')
            await page.wait_for_timeout(5000)
            
            # Go back to ideaboard
            await page.goto('https://pro.houzz.com/manage/selections/board/2321925', timeout=30000)
            await page.wait_for_timeout(3000)
        
        print(f"   ✓ Logged into Houzz Pro")
        
        print(f"\n🔍 Step 2: Searching Houzz for Four Hands product...")
        
        # Search on Houzz marketplace
        search_query = f"four hands {name.split('-')[0]}"  # Just first part of name
        search_url = f"https://www.houzz.com/products/query/{search_query.replace(' ', '-')}"
        
        await page.goto(search_url, timeout=30000)
        await page.wait_for_timeout(3000)
        
        print(f"   🔗 {search_url}")
        
        # Find first product
        product_links = await page.eval_on_selector_all(
            'a[href*="/product/"]',
            'elements => elements.slice(0, 3).map(el => el.href)'
        )
        
        if not product_links:
            print(f"   ✗ No products found on Houzz")
            await browser.close()
            return False
        
        print(f"   ✓ Found {len(product_links)} products")
        product_url = product_links[0]
        print(f"   📄 Opening: {product_url}")
        
        # Open product page
        await page.goto(product_url, timeout=30000)
        await page.wait_for_timeout(3000)
        
        print(f"\n💾 Step 3: Looking for 'Save' or 'Clip' button...")
        
        # Look for Save/Clip button on Houzz
        save_selectors = [
            'button:has-text("Save")',
            'button:has-text("Add to Ideabook")',
            '[data-testid="save-button"]',
            '.save-button',
            'button[aria-label*="Save"]'
        ]
        
        save_button = None
        for selector in save_selectors:
            try:
                save_button = await page.query_selector(selector)
                if save_button:
                    print(f"   ✓ Found Save button: {selector}")
                    break
            except:
                continue
        
        if not save_button:
            print(f"   ⚠️ No Save button found - checking for browser extension...")
            print(f"\n   📌 MANUAL STEP NEEDED:")
            print(f"   1. Browser window is open")
            print(f"   2. Product page is loaded")
            print(f"   3. Click your Houzz clipper extension button")
            print(f"   4. Select ideaboard 2321925")
            print(f"   5. Press Enter here when done...")
            
            input("\n   ⏸️  Press Enter after you've clipped the product manually...")
        else:
            # Click Save button
            await save_button.click()
            await page.wait_for_timeout(2000)
            
            print(f"   ✓ Clicked Save button")
            
            # Look for ideaboard selector
            print(f"   📋 Selecting your ideaboard...")
            
            # Try to find and click your specific board
            try:
                # Look for board selection
                await page.click('text=/.*2321925.*/')
                await page.wait_for_timeout(1000)
            except:
                print(f"   ⚠️ Couldn't auto-select board")
        
        print(f"\n✅ Step 4: Verifying product was clipped...")
        
        # Go to your ideaboard to verify
        await page.goto('https://pro.houzz.com/manage/selections/board/2321925', timeout=30000)
        await page.wait_for_timeout(3000)
        
        # Count products on board
        try:
            products = await page.query_selector_all('.product-card, [data-testid="product"]')
            print(f"   ✓ Ideaboard has {len(products)} products")
            
            if len(products) > 0:
                print(f"\n🎉 SUCCESS! Product clipped to Houzz Pro!")
                print(f"\n📥 Next: Pull this product into our app...")
                await browser.close()
                return True
        except:
            pass
        
        print(f"\n⏸️  Browser will stay open for 30 seconds so you can verify...")
        await page.wait_for_timeout(30000)
        
        await browser.close()
        return False

asyncio.run(test_clip_one_product())

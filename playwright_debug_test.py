#!/usr/bin/env python3
"""
Debug Playwright functionality for Four Hands scraping
"""

import asyncio
import os
from playwright.async_api import async_playwright

# Set Playwright browser path
os.environ['PLAYWRIGHT_BROWSERS_PATH'] = '/pw-browsers'

async def test_playwright_basic():
    """Test basic Playwright functionality"""
    print("🔍 Testing Playwright Basic Functionality")
    print("=" * 50)
    
    async with async_playwright() as p:
        print("✅ Playwright imported successfully")
        
        try:
            browser = await p.chromium.launch(headless=True)
            print("✅ Browser launched successfully")
            
            context = await browser.new_context(
                user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            )
            print("✅ Browser context created")
            
            page = await context.new_page()
            print("✅ New page created")
            
            # Test with example.com first (simple site)
            print("\n--- Testing example.com ---")
            try:
                await page.goto('https://example.com', timeout=30000)
                print("✅ Successfully navigated to example.com")
                
                title = await page.title()
                print(f"✅ Page title: {title}")
                
                h1_element = await page.query_selector('h1')
                if h1_element:
                    h1_text = await h1_element.inner_text()
                    print(f"✅ H1 text: {h1_text}")
                else:
                    print("❌ No H1 element found")
                    
            except Exception as e:
                print(f"❌ Error with example.com: {str(e)}")
            
            # Test with Four Hands (complex site)
            print("\n--- Testing Four Hands ---")
            try:
                print("🔄 Navigating to Four Hands (this may take a while)...")
                await page.goto('https://fourhands.com/product/248067-003', 
                               wait_until='networkidle', timeout=30000)
                print("✅ Successfully navigated to Four Hands")
                
                title = await page.title()
                print(f"✅ Page title: {title}")
                
                # Wait for content to load
                print("🔄 Waiting for content to load...")
                await page.wait_for_timeout(5000)
                
                # Try to find product elements
                h1_element = await page.query_selector('h1')
                if h1_element:
                    h1_text = await h1_element.inner_text()
                    print(f"✅ H1 text: {h1_text}")
                else:
                    print("❌ No H1 element found")
                
                # Check for any product-related elements
                product_selectors = [
                    '.product-title',
                    '.product-name', 
                    '[class*="product"]',
                    '[class*="title"]'
                ]
                
                for selector in product_selectors:
                    try:
                        element = await page.query_selector(selector)
                        if element:
                            text = await element.inner_text()
                            if text and len(text.strip()) > 0:
                                print(f"✅ Found element with selector '{selector}': {text[:50]}...")
                                break
                    except:
                        continue
                else:
                    print("❌ No product elements found with common selectors")
                
                # Get page content length as a basic check
                content = await page.content()
                print(f"✅ Page content length: {len(content)} characters")
                
                # Check if page contains expected Four Hands content
                if 'fourhands' in content.lower() or 'four hands' in content.lower():
                    print("✅ Page contains Four Hands branding")
                else:
                    print("❌ Page does not contain expected Four Hands content")
                    
            except Exception as e:
                print(f"❌ Error with Four Hands: {str(e)}")
            
            await browser.close()
            print("✅ Browser closed successfully")
            
        except Exception as e:
            print(f"❌ Browser launch failed: {str(e)}")

async def test_playwright_with_different_settings():
    """Test Playwright with different timeout and wait settings"""
    print("\n🔧 Testing Playwright with Different Settings")
    print("=" * 50)
    
    async with async_playwright() as p:
        try:
            browser = await p.chromium.launch(
                headless=True,
                args=['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
            )
            
            context = await browser.new_context(
                user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                viewport={'width': 1920, 'height': 1080}
            )
            
            page = await context.new_page()
            
            # Set longer timeouts
            page.set_default_timeout(90000)  # 90 seconds
            
            print("🔄 Testing Four Hands with extended settings...")
            
            try:
                # Try different wait strategies
                await page.goto('https://fourhands.com/product/248067-003', 
                               wait_until='domcontentloaded', timeout=45000)
                print("✅ Page loaded with domcontentloaded")
                
                # Wait for network to be idle
                try:
                    await page.wait_for_load_state('networkidle', timeout=30000)
                    print("✅ Network idle achieved")
                except:
                    print("⚠️  Network idle timeout, but continuing...")
                
                # Wait for specific elements
                try:
                    await page.wait_for_selector('body', timeout=10000)
                    print("✅ Body element found")
                except:
                    print("❌ Body element not found")
                
                # Try to extract basic information
                title = await page.title()
                print(f"✅ Page title: {title}")
                
                # Check for JavaScript execution
                js_result = await page.evaluate('() => document.readyState')
                print(f"✅ Document ready state: {js_result}")
                
                # Check for specific Four Hands elements
                try:
                    # Look for any text content that might indicate the product
                    page_text = await page.evaluate('() => document.body.innerText')
                    if 'fenn' in page_text.lower() or 'chair' in page_text.lower():
                        print("✅ Found product-related text on page")
                    else:
                        print("❌ No product-related text found")
                        
                    # Print first 500 characters of page text for debugging
                    print(f"📄 Page text sample: {page_text[:500]}...")
                        
                except Exception as e:
                    print(f"❌ Error extracting page text: {str(e)}")
                
            except Exception as e:
                print(f"❌ Error loading Four Hands page: {str(e)}")
            
            await browser.close()
            
        except Exception as e:
            print(f"❌ Browser setup failed: {str(e)}")

if __name__ == "__main__":
    print("🚀 PLAYWRIGHT DEBUG TESTING")
    print("=" * 70)
    
    asyncio.run(test_playwright_basic())
    asyncio.run(test_playwright_with_different_settings())
    
    print("\n" + "=" * 70)
    print("🏁 PLAYWRIGHT DEBUG TESTING COMPLETE")
    print("=" * 70)
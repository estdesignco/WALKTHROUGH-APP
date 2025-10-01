#!/usr/bin/env python3
"""
Focused Houzz Pro Scraper

Specifically targets the selections board with 4 items to test data extraction
https://pro.houzz.com/manage/selections/board/2321925
"""

import asyncio
import os
import json
import base64
import requests
from datetime import datetime
from playwright.async_api import async_playwright
from urllib.parse import urljoin

class FocusedHouzzScraper:
    def __init__(self):
        self.email = "establisheddesignco@gmail.com"
        self.password = "Zeke1919$$"
        self.target_url = "https://pro.houzz.com/manage/selections/board/2321925"
        
        print("\n🎯 FOCUSED HOUZZ PRO SCRAPER")
        print(f"📧 Email: {self.email}")
        print(f"🔗 Target: {self.target_url}")
        print("🎯 Goal: Extract 4 items with 5 pictures each")
    
    async def run_focused_scrape(self):
        """Run focused scraping on the specific selections board"""
        try:
            print("\n" + "="*80)
            print("🚀 STARTING FOCUSED HOUZZ PRO SCRAPE")
            print("="*80)
            
            playwright = await async_playwright().start()
            
            # Launch browser with different executable paths
            browser = None
            executable_paths = [
                '/pw-browsers/chromium-1187/chrome-linux/chrome',
                '/pw-browsers/chromium-1091/chrome-linux/chrome',
                None
            ]
            
            for executable_path in executable_paths:
                try:
                    browser = await playwright.chromium.launch(
                        headless=True,
                        executable_path=executable_path,
                        args=[
                            '--no-sandbox',
                            '--disable-dev-shm-usage',
                            '--disable-blink-features=AutomationControlled',
                            '--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                        ]
                    )
                    print(f"✅ Browser launched with: {executable_path or 'auto-detect'}")
                    break
                except Exception as e:
                    continue
            
            if not browser:
                raise Exception("Could not launch browser")
            
            page = await browser.new_page(
                viewport={'width': 1920, 'height': 1080},
                user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            )
            
            # Strategy 1: Try direct access with longer delays
            print("\n1️⃣ STRATEGY 1: Direct access with anti-rate-limiting")
            success = await self._try_direct_access_with_delays(page)
            
            if success:
                products = await self._extract_products_detailed(page)
                await self._save_products_to_api(products)
            else:
                print("❌ Direct access failed, trying login flow...")
                
                # Strategy 2: Login flow
                print("\n2️⃣ STRATEGY 2: Login flow")
                success = await self._try_login_flow(page)
                
                if success:
                    products = await self._extract_products_detailed(page)
                    await self._save_products_to_api(products)
                else:
                    print("❌ Both strategies failed")
            
            await browser.close()
            
        except Exception as e:
            print(f"❌ Focused scrape failed: {e}")
    
    async def _try_direct_access_with_delays(self, page) -> bool:
        """Try direct access with strategic delays to avoid rate limiting"""
        try:
            print("⏳ Waiting 30 seconds to avoid immediate rate limiting...")
            await asyncio.sleep(30)
            
            print("🌐 Attempting direct access to selections board...")
            
            # Try multiple times with increasing delays
            for attempt in range(3):
                try:
                    await page.goto(self.target_url, wait_until='domcontentloaded', timeout=45000)
                    await asyncio.sleep(10)
                    
                    title = await page.title()
                    current_url = page.url
                    
                    print(f"📍 Current URL: {current_url}")
                    print(f"📄 Page Title: {title}")
                    
                    # Check for rate limiting
                    if '429' in title or 'too many requests' in title.lower():
                        wait_time = (attempt + 1) * 60  # 60, 120, 180 seconds
                        print(f"⚠️ Rate limited, waiting {wait_time} seconds...")
                        await asyncio.sleep(wait_time)
                        continue
                    
                    # Check if we need login (redirected to login page)
                    if 'login' in current_url.lower():
                        print("🔐 Redirected to login - need authentication")
                        return False
                    
                    # Check if we got the selections page
                    if 'selections' in current_url:
                        print("✅ Successfully accessed selections board!")
                        return True
                    
                    print(f"⚠️ Unexpected redirect to: {current_url}")
                    return False
                    
                except Exception as e:
                    print(f"❌ Attempt {attempt + 1} failed: {e}")
                    if attempt < 2:
                        await asyncio.sleep(45)
                    
            return False
            
        except Exception as e:
            print(f"❌ Direct access strategy failed: {e}")
            return False
    
    async def _try_login_flow(self, page) -> bool:
        """Try login flow to access protected content"""
        try:
            print("🔐 Starting login flow...")
            
            # Go to main Houzz login (not pro.houzz.com/login which might be rate limited)
            login_url = "https://www.houzz.com/login"
            print(f"🌐 Navigating to: {login_url}")
            
            await page.goto(login_url, wait_until='domcontentloaded', timeout=30000)
            await asyncio.sleep(5)
            
            # Fill login form
            print("📝 Filling login form...")
            
            # Find email input
            email_selectors = [
                'input[type="email"]',
                'input[name="email"]',
                'input[id="email"]'
            ]
            
            email_input = None
            for selector in email_selectors:
                try:
                    email_input = await page.wait_for_selector(selector, timeout=5000)
                    if email_input and await email_input.is_visible():
                        break
                except:
                    continue
            
            if not email_input:
                print("❌ Could not find email input")
                return False
            
            await email_input.fill(self.email)
            print("📧 Email entered")
            
            # Find password input
            password_input = await page.wait_for_selector('input[type="password"]', timeout=5000)
            if not password_input:
                print("❌ Could not find password input")
                return False
            
            await password_input.fill(self.password)
            print("🔒 Password entered")
            
            # Submit form
            submit_button = await page.wait_for_selector('button[type="submit"], input[type="submit"]', timeout=5000)
            if submit_button:
                await submit_button.click()
                print("🎯 Login submitted")
            else:
                # Try pressing Enter
                await page.keyboard.press('Enter')
                print("⌨️ Pressed Enter to submit")
            
            # Wait for login to process
            await asyncio.sleep(8)
            
            # Check if login was successful
            current_url = page.url
            if 'login' not in current_url.lower():
                print("✅ Login appears successful!")
                
                # Now navigate to our target page
                print("🎯 Navigating to selections board after login...")
                await asyncio.sleep(5)  # Brief delay
                
                await page.goto(self.target_url, wait_until='domcontentloaded', timeout=30000)
                await asyncio.sleep(5)
                
                final_url = page.url
                if 'selections' in final_url:
                    print("🎉 Successfully accessed selections board after login!")
                    return True
                else:
                    print(f"❌ Still redirected after login: {final_url}")
                    return False
            else:
                print("❌ Login failed - still on login page")
                return False
                
        except Exception as e:
            print(f"❌ Login flow failed: {e}")
            return False
    
    async def _extract_products_detailed(self, page):
        """Extract detailed product information including images"""
        try:
            print("\n🔍 EXTRACTING DETAILED PRODUCT DATA")
            print("-" * 50)
            
            # Wait for content to load
            await asyncio.sleep(5)
            
            # Take screenshot for debugging
            await page.screenshot(path='/app/selections_board_content.png')
            print("📸 Screenshot saved: /app/selections_board_content.png")
            
            # Save page HTML for analysis
            content = await page.content()
            with open('/app/selections_board_content.html', 'w', encoding='utf-8') as f:
                f.write(content)
            print("💾 HTML saved: /app/selections_board_content.html")
            
            products = []
            
            # Look for product containers with various selectors
            product_selectors = [
                '[data-testid="selection-item"]',
                '.selection-item',
                '.product-card',
                '.item-card',
                '.selection-card',
                '.hz-card',
                '.product',
                '.item',
                '[class*="selection"]',
                '[class*="product"]',
                '[data-testid*="item"]',
                '[data-testid*="product"]'
            ]
            
            product_elements = []
            for selector in product_selectors:
                try:
                    elements = await page.query_selector_all(selector)
                    if elements:
                        print(f"🔍 Found {len(elements)} elements with selector: {selector}")
                        if len(elements) >= 4:  # Looking for 4 items
                            product_elements = elements
                            break
                        elif len(elements) > len(product_elements):
                            product_elements = elements
                except:
                    continue
            
            if not product_elements:
                print("⚠️ No product elements found with standard selectors")
                # Try to find any interactive elements that might be products
                product_elements = await page.query_selector_all('div[role="button"], a, [onclick], [data-*]')
                print(f"🔍 Fallback: Found {len(product_elements)} potential elements")
            
            print(f"\n📦 Processing {len(product_elements)} potential product elements...")
            
            for i, element in enumerate(product_elements[:10]):  # Process up to 10 elements
                try:
                    print(f"\n🔍 Analyzing element #{i+1}...")
                    
                    # Extract text content
                    text_content = (await element.text_content() or "").strip()
                    if len(text_content) < 5:  # Skip empty elements
                        continue
                    
                    print(f"📝 Text content (first 100 chars): {text_content[:100]}...")
                    
                    # Look for product images within this element
                    images = await element.query_selector_all('img')
                    image_urls = []
                    
                    for img in images:
                        try:
                            src = await img.get_attribute('src')
                            if src:
                                # Convert relative URLs to absolute
                                if src.startswith('//'):
                                    src = 'https:' + src
                                elif src.startswith('/'):
                                    src = 'https://pro.houzz.com' + src
                                
                                if src.startswith('http'):
                                    image_urls.append(src)
                        except:
                            continue
                    
                    print(f"🖼️ Found {len(image_urls)} images")
                    
                    # Try to extract product details
                    product_name = await self._extract_product_name(element)
                    vendor = await self._extract_vendor(element)
                    price = await self._extract_price(element)
                    
                    # Create product data
                    if product_name or len(image_urls) > 0:
                        product_data = {
                            "name": product_name or f"Selection Item #{i+1}",
                            "vendor": vendor or "Houzz Pro Selection",
                            "manufacturer": vendor or "Unknown",
                            "category": "Furniture",
                            "cost": price,
                            "msrp": price,
                            "sku": "",
                            "dimensions": "",
                            "description": text_content[:500],
                            "images": image_urls,
                            "image_url": image_urls[0] if image_urls else "",
                            "tags": [],
                            "notes": f"Extracted from Houzz Pro selections board",
                            "source": "houzz_pro_selections_board",
                            "scraped_date": datetime.utcnow().isoformat(),
                            "raw_text": text_content,
                            "element_index": i
                        }
                        
                        products.append(product_data)
                        print(f"✅ Product #{len(products)}: {product_name} ({len(image_urls)} images)")
                    
                except Exception as e:
                    print(f"❌ Error processing element #{i+1}: {e}")
                    continue
            
            print(f"\n📊 EXTRACTION COMPLETE: {len(products)} products found")
            
            # Save detailed extraction results
            with open('/app/extracted_products.json', 'w') as f:
                json.dump(products, f, indent=2)
            print("💾 Products saved to: /app/extracted_products.json")
            
            return products
            
        except Exception as e:
            print(f"❌ Product extraction failed: {e}")
            return []
    
    async def _extract_product_name(self, element):
        """Extract product name from element"""
        name_selectors = [
            'h1', 'h2', 'h3', 'h4',
            '.product-title',
            '.item-title',
            '.name',
            '[data-testid*="title"]',
            '[data-testid*="name"]'
        ]
        
        for selector in name_selectors:
            try:
                name_elem = await element.query_selector(selector)
                if name_elem:
                    name = await name_elem.text_content()
                    if name and len(name.strip()) > 2:
                        return name.strip()
            except:
                continue
        
        return None
    
    async def _extract_vendor(self, element):
        """Extract vendor/brand from element"""
        vendor_selectors = [
            '.vendor',
            '.brand',
            '.manufacturer',
            '[data-testid*="vendor"]',
            '[data-testid*="brand"]'
        ]
        
        for selector in vendor_selectors:
            try:
                vendor_elem = await element.query_selector(selector)
                if vendor_elem:
                    vendor = await vendor_elem.text_content()
                    if vendor and len(vendor.strip()) > 1:
                        return vendor.strip()
            except:
                continue
        
        return None
    
    async def _extract_price(self, element):
        """Extract price from element"""
        price_selectors = [
            '.price',
            '.cost',
            '[data-testid*="price"]'
        ]
        
        for selector in price_selectors:
            try:
                price_elem = await element.query_selector(selector)
                if price_elem:
                    price_text = await price_elem.text_content()
                    if price_text and '$' in price_text:
                        # Extract numeric price
                        import re
                        price_match = re.search(r'\$[\d,]+\.?\d*', price_text)
                        if price_match:
                            return float(price_match.group().replace('$', '').replace(',', ''))
            except:
                continue
        
        return 0.0
    
    async def _save_products_to_api(self, products):
        """Save products to the furniture catalog API"""
        try:
            print(f"\n💾 SAVING {len(products)} PRODUCTS TO API")
            print("-" * 40)
            
            saved_count = 0
            failed_count = 0
            
            for i, product in enumerate(products):
                try:
                    print(f"💾 Saving product {i+1}/{len(products)}: {product['name'][:50]}...")
                    
                    # Post to furniture catalog API
                    response = requests.post(
                        "http://localhost:8001/api/furniture/manual-webhook-test",
                        json={
                            "productTitle": product["name"],
                            "vendor": product["vendor"],
                            "manufacturer": product["manufacturer"],
                            "category": product["category"],
                            "cost": product["cost"],
                            "msrp": product["msrp"],
                            "sku": product["sku"],
                            "dimensions": product["dimensions"],
                            "description": product["description"],
                            "images": product["images"],
                            "productUrl": "",
                            "internalNotes": product["notes"]
                        },
                        timeout=30
                    )
                    
                    if response.status_code == 200:
                        saved_count += 1
                        print(f"✅ Saved successfully")
                    else:
                        failed_count += 1
                        print(f"❌ Failed: {response.status_code}")
                        
                except Exception as e:
                    failed_count += 1
                    print(f"❌ Error saving: {e}")
                
                await asyncio.sleep(1)  # Small delay between saves
            
            print(f"\n📊 SAVE RESULTS:")
            print(f"✅ Successfully saved: {saved_count}")
            print(f"❌ Failed to save: {failed_count}")
            print(f"📈 Success rate: {(saved_count/len(products)*100):.1f}%")
            
        except Exception as e:
            print(f"❌ Failed to save products: {e}")

async def main():
    """Run the focused scraper"""
    scraper = FocusedHouzzScraper()
    await scraper.run_focused_scrape()

if __name__ == "__main__":
    asyncio.run(main())

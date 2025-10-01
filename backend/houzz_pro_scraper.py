#!/usr/bin/env python3
"""
HOUZZ PRO SCRAPER
Automated scraping of user's existing Houzz Pro saved items

This scraper logs into the user's Houzz Pro account and extracts
all products they have already saved/clipped to:
1. Their "Selections" board
2. Their "My Items" collection

The scraped data is then posted to the furniture catalog API
to populate the unified furniture search database.
"""

import asyncio
import os
import re
import time
import json
import base64
from typing import List, Dict, Optional
from urllib.parse import urljoin, urlparse
from datetime import datetime

from playwright.async_api import async_playwright, Page, Browser
import requests
from motor.motor_asyncio import AsyncIOMotorClient

# MongoDB connection
MONGO_URL = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
client = AsyncIOMotorClient(MONGO_URL)
db = client.get_database('furniture_tracker')

# Backend API URL for posting scraped data
BACKEND_URL = os.environ.get('BACKEND_URL', 'http://localhost:8001')
API_BASE = f"{BACKEND_URL}/api/furniture"

class HouzzProScraper:
    """
    Automated scraper for Houzz Pro user account
    
    Logs into pro.houzz.com using provided credentials and scrapes
    existing saved products from specified URLs:
    - Selections board: https://pro.houzz.com/manage/selections/board/2321925
    - My Items: https://pro.houzz.com/manage/l/my-items
    """
    
    def __init__(self):
        self.browser: Optional[Browser] = None
        self.page: Optional[Page] = None
        self.scraped_products = []
        
        # Houzz Pro credentials
        self.email = "establisheddesignco@gmail.com"
        self.password = "Zeke1919$$"
        
        # URLs to scrape
        self.selections_url = "https://pro.houzz.com/manage/selections/board/2321925"
        self.my_items_url = "https://pro.houzz.com/manage/l/my-items"
        
        # Login URLs - Houzz redirects to their main login
        self.login_url = "https://www.houzz.com/login"
        self.pro_login_url = "https://pro.houzz.com/login"
        
        print("🏠 Houzz Pro Scraper initialized")
        print(f"📧 Email: {self.email}")
        print(f"🎯 Targets: {len([self.selections_url, self.my_items_url])} URLs")
    
    async def start_browser(self):
        """Start Playwright browser with appropriate settings"""
        try:
            playwright = await async_playwright().start()
            
            # Launch browser with stealth settings to avoid detection
            # Try different browser paths to work around version issues
            executable_paths = [
                '/pw-browsers/chromium-1187/chrome-linux/chrome',
                '/pw-browsers/chromium-1091/chrome-linux/chrome',
                None  # Let Playwright find it automatically
            ]
            
            browser_launched = False
            for executable_path in executable_paths:
                try:
                    self.browser = await playwright.chromium.launch(
                        headless=True,  # Use headless for server environment
                        executable_path=executable_path,
                        args=[
                            '--no-sandbox',
                            '--disable-dev-shm-usage',
                            '--disable-blink-features=AutomationControlled',
                            '--disable-web-security',
                            '--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                        ]
                    )
                    browser_launched = True
                    print(f"✅ Browser launched with executable: {executable_path or 'auto-detected'}")
                    break
                except Exception as e:
                    print(f"⚠️ Failed to launch with {executable_path or 'auto-detect'}: {e}")
                    continue
            
            if not browser_launched:
                raise Exception("Could not launch browser with any executable path")
            
            # Create new page with realistic viewport and headers
            self.page = await self.browser.new_page(
                viewport={'width': 1920, 'height': 1080},
                user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            )
            
            # Set additional headers to look more like a real browser
            await self.page.set_extra_http_headers({
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5',
                'Accept-Encoding': 'gzip, deflate, br',
                'DNT': '1',
                'Connection': 'keep-alive',
                'Upgrade-Insecure-Requests': '1'
            })
            
            # Add longer delay and jitter to avoid rate limiting
            await asyncio.sleep(10 + (asyncio.get_event_loop().time() % 5))
            
            print("✅ Browser started successfully")
            return True
            
        except Exception as e:
            print(f"❌ Failed to start browser: {e}")
            return False
    
    async def login_to_houzz_pro(self) -> bool:
        """Log into Houzz Pro with provided credentials with rate limit handling"""
        try:
            print("\n🔐 LOGGING INTO HOUZZ PRO...")
            print(f"📧 Using email: {self.email}")
            
            # First, add a delay to avoid being immediately rate limited
            print("⏳ Waiting to avoid rate limits...")
            await asyncio.sleep(15)  # Wait 15 seconds before starting
            
            # Navigate directly to selections URL which will redirect to login if needed
            print("🔍 Accessing selections URL (will redirect to login if needed)...")
            
            max_retries = 3
            for attempt in range(max_retries):
                try:
                    await self.page.goto(self.selections_url, wait_until='domcontentloaded', timeout=30000)
                    await self.page.wait_for_timeout(8000)  # Longer wait
                    
                    # Check for rate limiting
                    title = await self.page.title()
                    content = await self.page.content()
                    
                    if '429' in title or '429' in content or 'too many requests' in content.lower():
                        wait_time = (attempt + 1) * 30  # 30, 60, 90 seconds
                        print(f"⚠️ Rate limited (attempt {attempt + 1}), waiting {wait_time} seconds...")
                        await asyncio.sleep(wait_time)
                        continue
                    else:
                        print("✅ Successfully loaded page without rate limiting")
                        break
                        
                except Exception as e:
                    print(f"❌ Attempt {attempt + 1} failed: {e}")
                    if attempt < max_retries - 1:
                        await asyncio.sleep(20)
                    else:
                        return False
            else:
                print("❌ All attempts failed due to rate limiting")
                return False
            
            current_url = self.page.url
            print(f"📍 Redirected to: {current_url}")
            
            # If we're not on a login page, we might already be logged in
            if 'login' not in current_url.lower() and 'houzz.com/manage' in current_url:
                print("✅ Already logged in!")
                return True
            
            # We're on login page, proceed with login
            if 'login' in current_url.lower():
                print("📄 On login page, proceeding with authentication...")
                
                success = await self._perform_login_flow()
                if success:
                    # After login, try to access the original page again
                    print("🔄 Login successful, accessing selections page...")
                    await self.page.goto(self.selections_url, wait_until='domcontentloaded', timeout=15000)
                    await self.page.wait_for_timeout(3000)
                    
                    final_url = self.page.url
                    if 'login' not in final_url.lower():
                        print("🎉 LOGIN SUCCESS - Can access protected pages!")
                        return True
                    else:
                        print("❌ Still redirected to login after authentication")
                        return False
                else:
                    return False
            else:
                print("❌ Unexpected page after redirect")
                return False
                
        except Exception as e:
            print(f"❌ Login process failed: {e}")
            return False
    
    async def _perform_login_flow(self) -> bool:
        """Perform the actual login steps"""
        try:
            print("🔑 Performing login flow...")
            
            # Wait for form elements to be present
            await self.page.wait_for_timeout(3000)
            
            # Find email input
            email_selectors = [
                'input[type="email"]',
                'input[name="email"]',
                'input[id="email"]',
                'input[placeholder*="email" i]',
                'input[autocomplete="username"]'
            ]
            
            email_input = None
            for selector in email_selectors:
                try:
                    email_input = await self.page.wait_for_selector(selector, timeout=3000)
                    if email_input and await email_input.is_visible():
                        print(f"✅ Found email input: {selector}")
                        break
                except:
                    continue
            
            if not email_input:
                print("❌ No email input found")
                return False
            
            # Clear and enter email
            await email_input.click()
            await email_input.fill('')
            await email_input.type(self.email, delay=100)
            await self.page.wait_for_timeout(1000)
            print("📧 Email entered")
            
            # Find password input
            password_selectors = [
                'input[type="password"]',
                'input[name="password"]',
                'input[id="password"]',
                'input[autocomplete="current-password"]'
            ]
            
            password_input = None
            for selector in password_selectors:
                try:
                    password_input = await self.page.wait_for_selector(selector, timeout=3000)
                    if password_input and await password_input.is_visible():
                        print(f"✅ Found password input: {selector}")
                        break
                except:
                    continue
            
            if not password_input:
                print("❌ No password input found")
                return False
            
            # Clear and enter password
            await password_input.click()
            await password_input.fill('')
            await password_input.type(self.password, delay=100)
            await self.page.wait_for_timeout(1000)
            print("🔒 Password entered")
            
            # Find and click submit button
            submit_selectors = [
                'button[type="submit"]',
                'input[type="submit"]',
                'button:has-text("Sign In")',
                'button:has-text("Log In")',
                'button:has-text("Login")',
                '[data-testid*="login"]',
                '[data-testid*="submit"]'
            ]
            
            submit_clicked = False
            for selector in submit_selectors:
                try:
                    submit_button = await self.page.wait_for_selector(selector, timeout=2000)
                    if submit_button and await submit_button.is_visible():
                        print(f"✅ Found submit button: {selector}")
                        await submit_button.click()
                        print("🎯 Submit button clicked")
                        submit_clicked = True
                        break
                except:
                    continue
            
            if not submit_clicked:
                # Try form submission as fallback
                print("⚠️ No submit button found, trying form submission...")
                try:
                    await self.page.keyboard.press('Enter')
                    print("⌨️ Pressed Enter to submit")
                except:
                    return False
            
            # Wait for login to process
            print("⏳ Waiting for login to process...")
            await self.page.wait_for_timeout(8000)
            
            # Check if we're still on login page
            current_url = self.page.url
            if 'login' not in current_url.lower():
                print("✅ Login successful - redirected away from login page")
                return True
            else:
                print("❌ Still on login page - login may have failed")
                
                # Check for error messages
                try:
                    error_elements = await self.page.query_selector_all('.error, .alert, [class*="error"], [class*="alert"]')
                    if len(error_elements) > 0:
                        for error_elem in error_elements:
                            error_text = await error_elem.text_content()
                            if error_text and error_text.strip():
                                print(f"⚠️ Error message: {error_text.strip()}")
                except:
                    pass
                
                return False
                
        except Exception as e:
            print(f"❌ Login flow failed: {e}")
            return False
    
    # Login helper methods removed - using simplified flow
    
    async def scrape_selections_board(self) -> List[Dict]:
        """Scrape the user's Selections board"""
        try:
            print("\n📋 SCRAPING SELECTIONS BOARD...")
            print(f"🔗 URL: {self.selections_url}")
            
            # Navigate to selections board
            await self.page.goto(self.selections_url, wait_until='networkidle')
            await self.page.wait_for_timeout(3000)
            
            print("📄 Selections board loaded")
            
            # Extract products from the selections board
            products = await self.extract_products_from_page("Selections Board")
            
            print(f"✅ Extracted {len(products)} products from Selections board")
            return products
            
        except Exception as e:
            print(f"❌ Failed to scrape selections board: {e}")
            return []
    
    async def scrape_my_items(self) -> List[Dict]:
        """Scrape the user's My Items collection"""
        try:
            print("\n📚 SCRAPING MY ITEMS COLLECTION...")
            print(f"🔗 URL: {self.my_items_url}")
            
            # Navigate to my items
            await self.page.goto(self.my_items_url, wait_until='networkidle')
            await self.page.wait_for_timeout(3000)
            
            print("📄 My Items page loaded")
            
            # Extract products from my items page
            products = await self.extract_products_from_page("My Items")
            
            print(f"✅ Extracted {len(products)} products from My Items")
            return products
            
        except Exception as e:
            print(f"❌ Failed to scrape my items: {e}")
            return []
    
    async def extract_products_from_page(self, page_name: str) -> List[Dict]:
        """Extract product data from the current page"""
        try:
            products = []
            
            # Wait for content to load
            await self.page.wait_for_timeout(2000)
            
            # Look for product containers with various selectors
            product_selectors = [
                '.product-item',
                '.product-card', 
                '.item-card',
                '.selection-item',
                '.product',
                '.item',
                '[data-testid="product"]',
                '[data-testid="item"]'
            ]
            
            product_elements = []
            for selector in product_selectors:
                try:
                    elements = await self.page.query_selector_all(selector)
                    if elements:
                        print(f"✅ Found {len(elements)} products with selector: {selector}")
                        product_elements = elements
                        break
                except:
                    continue
            
            if not product_elements:
                print(f"⚠️  No products found on {page_name} with standard selectors")
                # Try to extract any elements that might contain products
                product_elements = await self.page.query_selector_all('div, article, section')
                print(f"🔍 Fallback: Found {len(product_elements)} potential containers")
            
            print(f"🔍 Processing {len(product_elements)} potential product elements...")
            
            for i, element in enumerate(product_elements[:50]):  # Limit to 50 to avoid timeouts
                try:
                    # Extract product data from element
                    product_data = await self.extract_single_product(element, i)
                    
                    if product_data and product_data.get('name'):
                        products.append(product_data)
                        print(f"✅ Product {len(products)}: {product_data['name'][:50]}...")
                    
                except Exception:
                    # Don't log individual element errors as they're common
                    pass
            
            print(f"📊 {page_name} extraction complete: {len(products)} valid products")
            return products
            
        except Exception as e:
            print(f"❌ Failed to extract products from {page_name}: {e}")
            return []
    
    async def extract_single_product(self, element, index: int) -> Optional[Dict]:
        """Extract data from a single product element"""
        try:
            # Get text content to check if this element contains product info
            text_content = await element.text_content() or ""
            
            # Skip if element doesn't seem to contain product info
            if len(text_content) < 10:
                return None
            
            # Extract product name
            name_selectors = [
                '.product-title',
                '.item-title', 
                '.product-name',
                '.title',
                'h1, h2, h3, h4',
                '.name',
                '[data-testid="product-title"]'
            ]
            
            name = await self.get_text_from_selectors(element, name_selectors)
            
            if not name or len(name) < 3:
                return None
            
            # Extract vendor/manufacturer
            vendor_selectors = [
                '.vendor',
                '.manufacturer',
                '.brand',
                '.supplier',
                '.company'
            ]
            vendor = await self.get_text_from_selectors(element, vendor_selectors)
            
            # Extract price
            price_selectors = [
                '.price',
                '.cost',
                '.amount',
                '[data-testid="price"]'
            ]
            price_text = await self.get_text_from_selectors(element, price_selectors)
            price = self.extract_price_from_text(price_text) if price_text else 0.0
            
            # Extract image
            image_url = await self.extract_product_image(element)
            
            # Extract SKU/model
            sku_selectors = [
                '.sku',
                '.model',
                '.item-number',
                '.product-id'
            ]
            sku = await self.get_text_from_selectors(element, sku_selectors)
            
            # Extract dimensions
            dimension_selectors = [
                '.dimensions',
                '.size',
                '.measurements'
            ]
            dimensions = await self.get_text_from_selectors(element, dimension_selectors)
            
            # Extract description
            desc_selectors = [
                '.description',
                '.details',
                '.product-details'
            ]
            description = await self.get_text_from_selectors(element, desc_selectors)
            
            # Create product data structure
            product_data = {
                "name": name.strip(),
                "vendor": vendor.strip() if vendor else "",
                "manufacturer": vendor.strip() if vendor else "",
                "category": "Furniture",  # Default category
                "cost": price,
                "msrp": price,  # Use same price for both
                "sku": sku.strip() if sku else "",
                "dimensions": dimensions.strip() if dimensions else "",
                "description": description.strip() if description else "",
                "image_url": image_url,
                "images": [image_url] if image_url else [],
                "tags": [],
                "notes": "Scraped from Houzz Pro account",
                "source": "houzz_pro_scraper",
                "scraped_date": datetime.utcnow().isoformat(),
                "houzz_pro_data": {
                    "original_text": text_content[:500],  # First 500 chars for debugging
                    "extraction_index": index
                }
            }
            
            return product_data
            
        except Exception:
            # Silent fail for individual products
            return None
    
    async def get_text_from_selectors(self, parent_element, selectors: List[str]) -> Optional[str]:
        """Try multiple selectors to get text from an element"""
        for selector in selectors:
            try:
                element = await parent_element.query_selector(selector)
                if element:
                    text = await element.text_content()
                    if text and text.strip():
                        return text.strip()
            except:
                continue
        return None
    
    async def extract_product_image(self, element) -> Optional[str]:
        """Extract product image from element"""
        try:
            # Look for image elements
            img_selectors = [
                'img',
                '.product-image img',
                '.item-image img',
                '[data-testid="product-image"] img'
            ]
            
            for selector in img_selectors:
                try:
                    img_element = await element.query_selector(selector)
                    if img_element:
                        src = await img_element.get_attribute('src')
                        if src and src.startswith('http'):
                            return src
                except:
                    continue
            
            return None
            
        except:
            return None
    
    def extract_price_from_text(self, price_text: str) -> float:
        """Extract numeric price from text"""
        try:
            # Remove currency symbols and extract numbers
            price_match = re.search(r'[\d,]+\.?\d*', price_text.replace('$', '').replace(',', ''))
            if price_match:
                return float(price_match.group())
        except:
            pass
        return 0.0
    
    async def save_products_to_database(self, products: List[Dict]) -> bool:
        """Save scraped products to the furniture catalog API"""
        try:
            print(f"\n💾 SAVING {len(products)} PRODUCTS TO DATABASE...")
            
            saved_count = 0
            failed_count = 0
            
            for i, product in enumerate(products):
                try:
                    # Post to the furniture catalog API endpoint
                    response = requests.post(
                        f"{API_BASE}/manual-webhook-test",
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
                            "productUrl": product.get("product_url", ""),
                            "internalNotes": product["notes"]
                        },
                        timeout=30
                    )
                    
                    if response.status_code == 200:
                        saved_count += 1
                        print(f"✅ Saved {i+1}/{len(products)}: {product['name'][:50]}...")
                    else:
                        failed_count += 1
                        print(f"❌ Failed to save {product['name'][:30]}...: {response.status_code}")
                        
                except Exception as e:
                    failed_count += 1
                    print(f"❌ Error saving {product['name'][:30]}...: {e}")
                
                # Small delay between saves
                await asyncio.sleep(0.5)
            
            print("\n📊 SAVE RESULTS:")
            print(f"✅ Saved: {saved_count}")
            print(f"❌ Failed: {failed_count}")
            print(f"📈 Success rate: {(saved_count/len(products)*100):.1f}%")
            
            return saved_count > 0
            
        except Exception as e:
            print(f"❌ Failed to save products to database: {e}")
            return False
    
    async def close_browser(self):
        """Clean up browser resources"""
        try:
            if self.browser:
                await self.browser.close()
                print("✅ Browser closed")
        except Exception as e:
            print(f"⚠️  Error closing browser: {e}")
    
    async def run_full_scraping(self) -> Dict:
        """Run the complete scraping workflow"""
        start_time = time.time()
        
        print("\n" + "="*80)
        print("🚀 STARTING HOUZZ PRO SCRAPING OPERATION")
        print("="*80)
        
        try:
            # Start browser
            if not await self.start_browser():
                return {"success": False, "error": "Failed to start browser"}
            
            # Login to Houzz Pro
            if not await self.login_to_houzz_pro():
                return {"success": False, "error": "Failed to login to Houzz Pro"}
            
            all_products = []
            
            # Scrape Selections board
            selections_products = await self.scrape_selections_board()
            all_products.extend(selections_products)
            
            # Small delay between scraping operations
            await asyncio.sleep(2)
            
            # Scrape My Items
            my_items_products = await self.scrape_my_items()
            all_products.extend(my_items_products)
            
            print("\n📊 SCRAPING SUMMARY:")
            print(f"📋 Selections Board: {len(selections_products)} products")
            print(f"📚 My Items: {len(my_items_products)} products")
            print(f"📦 Total Unique: {len(all_products)} products")
            
            if not all_products:
                print("⚠️  No products found to save")
                return {
                    "success": True,
                    "message": "Scraping completed but no products found",
                    "products_found": 0
                }
            
            # Save to database
            save_success = await self.save_products_to_database(all_products)
            
            elapsed_time = time.time() - start_time
            
            print("\n" + "="*80)
            print("🎉 HOUZZ PRO SCRAPING COMPLETED!")
            print("="*80)
            print(f"⏱️  Total time: {elapsed_time:.1f} seconds")
            print(f"📦 Products scraped: {len(all_products)}")
            print(f"💾 Database save: {'✅ Success' if save_success else '❌ Failed'}")
            print("="*80)
            
            return {
                "success": True,
                "message": "Houzz Pro scraping completed successfully",
                "products_found": len(all_products),
                "selections_count": len(selections_products),
                "my_items_count": len(my_items_products),
                "database_saved": save_success,
                "elapsed_time": elapsed_time
            }
            
        except Exception as e:
            print(f"\n❌ SCRAPING FAILED: {e}")
            return {"success": False, "error": str(e)}
        
        finally:
            await self.close_browser()


# Standalone function for API endpoint
async def run_houzz_pro_scraper() -> Dict:
    """Run the Houzz Pro scraper and return results"""
    scraper = HouzzProScraper()
    return await scraper.run_full_scraping()


# Command line interface for testing
if __name__ == "__main__":
    async def main():
        scraper = HouzzProScraper()
        result = await scraper.run_full_scraping()
        print(f"\nFinal Result: {json.dumps(result, indent=2)}")
    
    asyncio.run(main())

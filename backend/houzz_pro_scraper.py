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
            self.browser = await playwright.chromium.launch(
                headless=True,  # Use headless for server environment
                args=[
                    '--no-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-blink-features=AutomationControlled',
                    '--disable-web-security',
                    '--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                ]
            )
            
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
            
            # Add random delay to avoid rate limiting
            await asyncio.sleep(2)
            
            print("✅ Browser started successfully")
            return True
            
        except Exception as e:
            print(f"❌ Failed to start browser: {e}")
            return False
    
    async def login_to_houzz_pro(self) -> bool:
        """Log into Houzz Pro with provided credentials"""
        try:
            print("\n🔐 LOGGING INTO HOUZZ PRO...")
            print(f"📧 Using email: {self.email}")
            
            # Navigate directly to selections URL which will redirect to login if needed
            print("🔍 Accessing selections URL (will redirect to login if needed)...")
            
            await self.page.goto(self.selections_url, wait_until='domcontentloaded', timeout=20000)
            await self.page.wait_for_timeout(5000)
            
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
                'input[type=\"email\"]',
                'input[name=\"email\"]',
                'input[id=\"email\"]',
                'input[placeholder*=\"email\" i]',\n                'input[autocomplete=\"username\"]'\n            ]\n            \n            email_input = None\n            for selector in email_selectors:\n                try:\n                    email_input = await self.page.wait_for_selector(selector, timeout=3000)\n                    if email_input and await email_input.is_visible():\n                        print(f\"✅ Found email input: {selector}\")\n                        break\n                except:\n                    continue\n            \n            if not email_input:\n                print(\"❌ No email input found\")\n                return False\n            \n            # Clear and enter email\n            await email_input.click()\n            await email_input.fill('')\n            await email_input.type(self.email, delay=100)\n            await self.page.wait_for_timeout(1000)\n            print(\"📧 Email entered\")\n            \n            # Find password input\n            password_selectors = [\n                'input[type=\"password\"]',\n                'input[name=\"password\"]',\n                'input[id=\"password\"]',\n                'input[autocomplete=\"current-password\"]'\n            ]\n            \n            password_input = None\n            for selector in password_selectors:\n                try:\n                    password_input = await self.page.wait_for_selector(selector, timeout=3000)\n                    if password_input and await password_input.is_visible():\n                        print(f\"✅ Found password input: {selector}\")\n                        break\n                except:\n                    continue\n            \n            if not password_input:\n                print(\"❌ No password input found\")\n                return False\n            \n            # Clear and enter password\n            await password_input.click()\n            await password_input.fill('')\n            await password_input.type(self.password, delay=100)\n            await self.page.wait_for_timeout(1000)\n            print(\"🔒 Password entered\")\n            \n            # Find and click submit button\n            submit_selectors = [\n                'button[type=\"submit\"]',\n                'input[type=\"submit\"]',\n                'button:has-text(\"Sign In\")',\n                'button:has-text(\"Log In\")',\n                'button:has-text(\"Login\")',\n                '[data-testid*=\"login\"]',\n                '[data-testid*=\"submit\"]'\n            ]\n            \n            submit_clicked = False\n            for selector in submit_selectors:\n                try:\n                    submit_button = await self.page.wait_for_selector(selector, timeout=2000)\n                    if submit_button and await submit_button.is_visible():\n                        print(f\"✅ Found submit button: {selector}\")\n                        await submit_button.click()\n                        print(\"🎯 Submit button clicked\")\n                        submit_clicked = True\n                        break\n                except:\n                    continue\n            \n            if not submit_clicked:\n                # Try form submission as fallback\n                print(\"⚠️ No submit button found, trying form submission...\")\n                try:\n                    await self.page.keyboard.press('Enter')\n                    print(\"⌨️ Pressed Enter to submit\")\n                except:\n                    return False\n            \n            # Wait for login to process\n            print(\"⏳ Waiting for login to process...\")\n            await self.page.wait_for_timeout(8000)\n            \n            # Check if we're still on login page\n            current_url = self.page.url\n            if 'login' not in current_url.lower():\n                print(\"✅ Login successful - redirected away from login page\")\n                return True\n            else:\n                print(\"❌ Still on login page - login may have failed\")\n                \n                # Check for error messages\n                try:\n                    error_elements = await self.page.query_selector_all('.error, .alert, [class*=\"error\"], [class*=\"alert\"]')\n                    if len(error_elements) > 0:\n                        for error_elem in error_elements:\n                            error_text = await error_elem.text_content()\n                            if error_text and error_text.strip():\n                                print(f\"⚠️ Error message: {error_text.strip()}\")\n                except:\n                    pass\n                \n                return False\n                \n        except Exception as e:\n            print(f\"❌ Login flow failed: {e}\")\n            return False
    
    async def _try_standard_login(self) -> bool:
        """Try standard email/password login"""
        print("🔑 Trying standard login...")
        
        # Look for email input
        email_selectors = [
            'input[type="email"]',
            'input[name="email"]', 
            'input[id="email"]',
            'input[placeholder*="email" i]',
            '#email',
            '.email-input',
            'input[autocomplete="username"]'
        ]
        
        email_input = None
        for selector in email_selectors:
            try:
                email_input = await self.page.wait_for_selector(selector, timeout=2000)
                if email_input and await email_input.is_visible():
                    print(f"✅ Found email input: {selector}")
                    break
            except:
                continue
        
        if not email_input:
            print("❌ No email input found")
            return False
        
        # Enter email with realistic typing
        await email_input.click()
        await email_input.fill('')  # Clear first
        await email_input.type(self.email, delay=50)
        await self.page.wait_for_timeout(1000)
        print("📧 Email entered")
        
        # Look for password input
        password_selectors = [
            'input[type="password"]',
            'input[name="password"]',
            'input[id="password"]',
            '#password',
            'input[autocomplete="current-password"]'
        ]
        
        password_input = None
        for selector in password_selectors:
            try:
                password_input = await self.page.wait_for_selector(selector, timeout=2000)
                if password_input and await password_input.is_visible():
                    print(f"✅ Found password input: {selector}")
                    break
            except:
                continue
        
        if not password_input:
            print("❌ No password input found")
            return False
        
        # Enter password with realistic typing
        await password_input.click()
        await password_input.fill('')  # Clear first
        await password_input.type(self.password, delay=50)
        await self.page.wait_for_timeout(1000)
        print("🔒 Password entered")
        
        # Look for and click login button
        login_selectors = [
            'button[type="submit"]',
            'input[type="submit"]',
            'button:has-text("Sign In")',
            'button:has-text("Log In")', 
            'button:has-text("Login")',
            '[data-testid="login-button"]',
            '.login-button',
            '.sign-in-button'
        ]
        
        for selector in login_selectors:
            try:
                login_button = await self.page.wait_for_selector(selector, timeout=2000)
                if login_button and await login_button.is_visible():
                    print(f"✅ Found login button: {selector}")
                    await login_button.click()
                    print("🎯 Login button clicked")
                    break
            except:
                continue
        
        # Wait for navigation after login
        await self.page.wait_for_timeout(5000)
        
        return await self._verify_login()
    
    async def _try_alternative_login(self) -> bool:
        """Try alternative login method (form submission, etc.)"""
        print("🔄 Trying alternative login...")
        
        # Try form submission approach
        try:
            # Fill form using JavaScript
            await self.page.evaluate(f"""
                const emailInputs = document.querySelectorAll('input[type="email"], input[name="email"]');
                const passwordInputs = document.querySelectorAll('input[type="password"], input[name="password"]');
                
                if (emailInputs.length > 0) emailInputs[0].value = '{self.email}';
                if (passwordInputs.length > 0) passwordInputs[0].value = '{self.password}';
                
                // Try to submit the form
                const forms = document.querySelectorAll('form');
                if (forms.length > 0) forms[0].submit();
            """)
            
            await self.page.wait_for_timeout(5000)
            return await self._verify_login()
            
        except Exception as e:
            print(f"❌ Alternative login failed: {e}")
            return False
    
    async def _verify_login(self) -> bool:
        """Verify if login was successful"""
        try:
            current_url = self.page.url
            print(f"📍 Current URL: {current_url}")
            
            # Check if we're redirected away from login page
            if 'login' not in current_url.lower():
                print("✅ Redirected away from login page")
                
                # Try to access protected content
                try:
                    await self.page.goto(self.selections_url, wait_until='domcontentloaded', timeout=10000)
                    await self.page.wait_for_timeout(3000)
                    
                    final_url = self.page.url
                    if 'login' not in final_url.lower():
                        print("🎉 LOGIN SUCCESSFUL - Can access protected pages!")
                        return True
                    
                except:
                    pass
            
            # Look for login success indicators
            success_indicators = [
                'text=Dashboard',
                'text=Manage',
                'text=Profile',
                '[data-testid="user-menu"]',
                '.user-dropdown',
                '.account-menu'
            ]
            
            for indicator in success_indicators:
                try:
                    element = await self.page.wait_for_selector(indicator, timeout=2000)
                    if element:
                        print(f"✅ Login indicator found: {indicator}")
                        return True
                except:
                    continue
            
            print("❌ Login verification failed")
            return False
            
        except Exception as e:
            print(f"❌ Login verification error: {e}")
            return False
    
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

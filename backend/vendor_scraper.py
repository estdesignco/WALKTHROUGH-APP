"""
Real-Time Vendor Portal Scraper
Uses Playwright to authenticate and scrape product data from vendor dealer portals
"""
import asyncio
import re
import logging
from typing import Dict, List, Optional
from playwright.async_api import async_playwright, Browser, BrowserContext, Page
from datetime import datetime, timezone

logger = logging.getLogger(__name__)

class VendorPortalScraper:
    """Scrapes vendor dealer portals using authenticated sessions"""
    
    def __init__(self):
        self.browser: Optional[Browser] = None
        self.contexts: Dict[str, BrowserContext] = {}  # Store logged-in contexts per vendor
        self.playwright = None
    
    async def initialize(self):
        """Initialize the browser"""
        if not self.playwright:
            self.playwright = await async_playwright().start()
            self.browser = await self.playwright.chromium.launch(
                headless=True,
                args=['--no-sandbox', '--disable-setuid-sandbox']
            )
            logger.info("Browser initialized")
    
    async def close(self):
        """Close browser and cleanup"""
        for context in self.contexts.values():
            await context.close()
        if self.browser:
            await self.browser.close()
        if self.playwright:
            await self.playwright.stop()
    
    async def login_to_vendor(self, vendor_key: str, portal_config: Dict, credentials: Dict) -> bool:
        """Log into a vendor portal and store the authenticated context"""
        await self.initialize()
        
        try:
            # Create a new context for this vendor
            context = await self.browser.new_context(
                user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                viewport={'width': 1920, 'height': 1080}
            )
            
            page = await context.new_page()
            
            # Navigate to login page
            logger.info(f"Navigating to {portal_config['login_url']}")
            await page.goto(portal_config['login_url'], wait_until='domcontentloaded', timeout=30000)
            await asyncio.sleep(2)
            
            selectors = portal_config.get('selectors', {})
            
            # Fill in credentials based on login type
            login_type = portal_config.get('login_type', 'email')
            
            if login_type == 'account_number':
                # Use account number
                username_value = credentials.get('account_number') or credentials.get('username')
            elif login_type == 'dealer_code':
                # Use dealer code
                username_value = credentials.get('dealer_code') or credentials.get('username')
            else:
                # Use email/username
                username_value = credentials.get('username')
            
            password_value = credentials.get('password')
            
            logger.info(f"Attempting login with username type: {login_type}")
            
            # Try to find and fill username field - use multiple strategies
            username_filled = False
            username_selectors = [
                selectors.get('username_field', ''),
                'input[type="text"]:visible',
                'input[type="email"]:visible',
                'input[name*="account"]',
                'input[name*="email"]',
                'input[name*="user"]',
                'input[placeholder*="account" i]',
                'input[placeholder*="email" i]',
                'input:not([type="password"]):not([type="hidden"]):not([type="submit"])'
            ]
            
            for selector in username_selectors:
                if not selector:
                    continue
                try:
                    element = await page.query_selector(selector)
                    if element:
                        await element.fill(username_value)
                        logger.info(f"Filled username with selector: {selector}")
                        username_filled = True
                        break
                except Exception as e:
                    continue
            
            if not username_filled:
                logger.error("Could not find username field with any selector")
                await context.close()
                return False
            
            # Fill password - use multiple strategies
            password_filled = False
            password_selectors = [
                selectors.get('password_field', ''),
                'input[type="password"]',
                'input[name*="password"]',
                'input[placeholder*="password" i]'
            ]
            
            for selector in password_selectors:
                if not selector:
                    continue
                try:
                    element = await page.query_selector(selector)
                    if element:
                        await element.fill(password_value)
                        logger.info(f"Filled password with selector: {selector}")
                        password_filled = True
                        break
                except Exception as e:
                    continue
            
            if not password_filled:
                logger.error("Could not find password field")
                await context.close()
                return False
            
            await asyncio.sleep(1)
            
            # Click login button - try multiple strategies
            login_clicked = False
            login_selectors = [
                selectors.get('login_button', ''),
                'button[type="submit"]',
                'input[type="submit"]',
                'button:has-text("Login")',
                'button:has-text("Sign In")',
                'button:has-text("Log In")',
                '[data-testid*="login"]',
                'form button'
            ]
            
            for selector in login_selectors:
                if not selector:
                    continue
                try:
                    element = await page.query_selector(selector)
                    if element:
                        await element.click()
                        logger.info(f"Clicked login button with selector: {selector}")
                        login_clicked = True
                        break
                except Exception as e:
                    continue
            
            if not login_clicked:
                # Try pressing Enter as fallback
                await page.keyboard.press('Enter')
                logger.info("Pressed Enter as login fallback")
            
            # Wait for navigation/login to complete
            await asyncio.sleep(3)
            try:
                await page.wait_for_load_state('networkidle', timeout=15000)
            except:
                pass  # Some sites don't fully settle
            
            # Check if login was successful
            current_url = page.url
            page_content = await page.content()
            
            logger.info(f"Post-login URL: {current_url}")
            
            # Check for login failure indicators
            failure_indicators = ['invalid', 'incorrect', 'error', 'failed', 'wrong password', 'try again']
            if any(x in page_content.lower() for x in failure_indicators):
                # Check if we're still on login page
                if 'login' in current_url.lower():
                    logger.error(f"Login failed for {vendor_key} - still on login page")
                    await context.close()
                    return False
            
            # Check for success indicators
            success_indicators = ['account', 'dashboard', 'welcome', 'home', 'catalog', 'products', 'logout', 'sign out']
            is_success = any(x in page_content.lower() for x in success_indicators) or 'login' not in current_url.lower()
            
            if is_success:
                # Store the authenticated context
                self.contexts[vendor_key] = context
                logger.info(f"Successfully logged into {vendor_key}")
                return True
            else:
                logger.error(f"Login status unclear for {vendor_key}")
                await context.close()
                return False
            
        except Exception as e:
            logger.error(f"Error logging into {vendor_key}: {type(e).__name__}: {e}")
            import traceback
            logger.error(traceback.format_exc())
            return False
    
    async def search_vendor(self, vendor_key: str, query: str, portal_config: Dict) -> List[Dict]:
        """Search for products on a vendor portal"""
        if vendor_key not in self.contexts:
            logger.error(f"Not logged into {vendor_key}")
            return []
        
        try:
            context = self.contexts[vendor_key]
            page = await context.new_page()
            
            # Build search URL
            search_url = portal_config.get('search_url', '').format(query=query)
            
            logger.info(f"Searching {vendor_key}: {search_url}")
            await page.goto(search_url, wait_until='domcontentloaded', timeout=60000)
            await asyncio.sleep(5)  # Wait for JS to render products
            
            # Extract product data
            products = await self._extract_products(page, portal_config)
            
            await page.close()
            return products
            
        except Exception as e:
            logger.error(f"Error searching {vendor_key}: {e}")
            return []
    
    async def _extract_products(self, page: Page, portal_config: Dict) -> List[Dict]:
        """Extract product data from a search results page"""
        products = []
        selectors = portal_config.get('selectors', {})
        vendor_name = portal_config.get('name', '')
        base_url = portal_config.get('base_url', '')
        
        # Get all product images
        image_selector = selectors.get('product_image', 'img.product-image, img[data-product]')
        link_selector = selectors.get('product_link', 'a.product-link, a[href*="/product/"]')
        
        # For Four Hands, the images are inside product cards/links
        if 'fourhands' in base_url.lower():
            # Find product links first, then get images within them
            product_cards = await page.query_selector_all('a[href*="/product/"]')
            logger.info(f"Found {len(product_cards)} product cards on Four Hands")
            
            seen_skus = set()
            for card in product_cards[:100]:  # Get up to 100 products
                try:
                    href = await card.get_attribute('href') or ''
                    # Extract SKU from URL like /product/IBAR-273
                    sku_match = href.split('/product/')[-1].split('?')[0] if '/product/' in href else ''
                    
                    if sku_match and sku_match not in seen_skus:
                        seen_skus.add(sku_match)
                        
                        # Get image inside this card
                        img = await card.query_selector('img[src*="cloudfront"]')
                        img_src = ''
                        img_alt = ''
                        
                        if img:
                            img_src = await img.get_attribute('src') or await img.get_attribute('data-src') or ''
                            img_alt = await img.get_attribute('alt') or ''
                        
                        # Extract price from card text
                        card_text = await card.inner_text()
                        price = None
                        import re
                        price_match = re.search(r'\$[\d,]+\.?\d*', card_text)
                        if price_match:
                            price_str = price_match.group().replace('$', '').replace(',', '')
                            try:
                                price = float(price_str)
                            except:
                                pass
                        
                        # Extract product name from text (usually after badges like "New", "Performance Options")
                        name_lines = [l.strip() for l in card_text.split('\n') if l.strip() and not l.strip().startswith('$') and l.strip() not in ['New', 'Performance Options', 'Hospitality', 'More Options', 'In Stock']]
                        product_name = name_lines[0] if name_lines else img_alt or sku_match
                        
                        if img_src:
                            products.append({
                                'sku': sku_match,
                                'image_url': img_src,
                                'name': product_name,
                                'price': price,
                                'cost': price,
                                'product_link': base_url + href if not href.startswith('http') else href,
                                'vendor': vendor_name,
                                'source': 'live',
                                'scraped_at': datetime.now(timezone.utc).isoformat()
                            })
                except Exception as e:
                    logger.debug(f"Error extracting Four Hands product: {e}")
                    continue
        elif 'globalviews' in base_url.lower():
            # Global Views uses Klevu search - get more products by clicking 36 per page
            try:
                dropdown = await page.wait_for_selector('.kuDropdown.kuDropItemsPerpage', timeout=5000)
                await dropdown.click()
                await asyncio.sleep(0.5)
                option_36 = await page.wait_for_selector('.kuDropOption.kuLimit[data-value="36"]', timeout=3000)
                await option_36.click()
                await asyncio.sleep(3)
            except:
                pass  # Continue with default if dropdown fails
            
            # Get all Klevu images
            klevu_images = await page.query_selector_all('img[src*="klevu_images"], img[src*="media/catalog"]')
            logger.info(f"Found {len(klevu_images)} product images on Global Views")
            
            # Also try to get product links with prices
            product_items = await page.query_selector_all('.kuResultContent, [class*="product-item"]')
            
            for img in klevu_images[:50]:  # Get up to 50 products
                try:
                    img_src = await img.get_attribute('src') or ''
                    img_alt = await img.get_attribute('alt') or ''
                    
                    # Try to get parent link
                    href = ''
                    try:
                        parent_link = await img.evaluate('el => el.closest("a")?.href')
                        if parent_link:
                            href = parent_link
                    except:
                        pass
                    
                    if img_src and img_alt:  # Only add if we have image and name
                        products.append({
                            'image_url': img_src,
                            'name': img_alt.strip(),
                            'product_link': href,
                            'vendor': vendor_name,
                            'source': 'live',
                            'scraped_at': datetime.now(timezone.utc).isoformat()
                        })
                except Exception as e:
                    logger.debug(f"Error extracting Global Views product: {e}")
                    continue
        else:
            # Generic extraction for other vendors
            images = await page.query_selector_all(image_selector)
            links = await page.query_selector_all(link_selector)
            
            for i, img in enumerate(images[:20]):
                try:
                    src = await img.get_attribute('src') or await img.get_attribute('data-src')
                    alt = await img.get_attribute('alt') or ''
                    
                    link = ''
                    if i < len(links):
                        link = await links[i].get_attribute('href') or ''
                        if link and not link.startswith('http'):
                            link = base_url + link
                    
                    if src:
                        if not src.startswith('http'):
                            src = base_url + src
                        
                        products.append({
                            'image_url': src,
                            'name': alt,
                            'product_link': link,
                            'vendor': vendor_name,
                            'source': 'live',
                            'scraped_at': datetime.now(timezone.utc).isoformat()
                        })
                except Exception as e:
                    logger.debug(f"Error extracting product: {e}")
                    continue
        
        logger.info(f"Extracted {len(products)} products from {vendor_name}")
        return products
    
    async def get_product_details(self, vendor_key: str, product_url: str, portal_config: Dict) -> Dict:
        """Get detailed product information from a product page"""
        if vendor_key not in self.contexts:
            return {}
        
        try:
            context = self.contexts[vendor_key]
            page = await context.new_page()
            
            await page.goto(product_url, wait_until='networkidle', timeout=30000)
            await asyncio.sleep(2)
            
            # Extract product details
            details = {
                'url': product_url,
                'vendor': portal_config.get('name', ''),
                'scraped_at': datetime.now(timezone.utc).isoformat()
            }
            
            # Try to get product name
            for selector in ['h1.product-name', 'h1.product-title', 'h1', '.product-name', '[data-product-name]']:
                try:
                    element = await page.query_selector(selector)
                    if element:
                        details['name'] = await element.inner_text()
                        break
                except:
                    continue
            
            # Try to get price
            for selector in ['.product-price', '.price', '[data-price]', '.product-info-price']:
                try:
                    element = await page.query_selector(selector)
                    if element:
                        price_text = await element.inner_text()
                        # Extract numeric price
                        price_match = re.search(r'\$?([\d,]+\.?\d*)', price_text)
                        if price_match:
                            details['price'] = float(price_match.group(1).replace(',', ''))
                        break
                except:
                    continue
            
            # Get all images
            images = []
            for img in await page.query_selector_all('img.product-image, img.gallery-image, .product-gallery img'):
                src = await img.get_attribute('src') or await img.get_attribute('data-src')
                if src:
                    if not src.startswith('http'):
                        src = portal_config.get('base_url', '') + src
                    images.append(src)
            details['images'] = images[:10]  # Limit to 10 images
            
            # Try to get SKU
            page_content = await page.content()
            sku_match = re.search(r'(?:SKU|Item|Style)[:\s#]*([A-Z0-9-]+)', page_content, re.I)
            if sku_match:
                details['sku'] = sku_match.group(1)
            
            await page.close()
            return details
            
        except Exception as e:
            logger.error(f"Error getting product details: {e}")
            return {}


# Singleton instance
_scraper_instance = None

async def get_scraper() -> VendorPortalScraper:
    """Get or create the scraper instance"""
    global _scraper_instance
    if _scraper_instance is None:
        _scraper_instance = VendorPortalScraper()
    return _scraper_instance

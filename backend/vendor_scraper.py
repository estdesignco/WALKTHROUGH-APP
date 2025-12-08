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
            await page.goto(portal_config['login_url'], wait_until='networkidle', timeout=30000)
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
            
            # Try to find and fill username field
            username_selector = selectors.get('username_field', 'input[type="email"], input[name="email"], input[name="username"]')
            try:
                await page.wait_for_selector(username_selector, timeout=10000)
                await page.fill(username_selector, username_value)
                logger.info(f"Filled username field")
            except Exception as e:
                logger.error(f"Could not find username field: {e}")
                # Try alternative selectors
                for alt_selector in ['input[type="email"]', 'input[name="email"]', 'input#email', 'input[name="username"]']:
                    try:
                        await page.fill(alt_selector, username_value)
                        logger.info(f"Filled username with {alt_selector}")
                        break
                    except:
                        continue
            
            # Fill password
            password_selector = selectors.get('password_field', 'input[type="password"]')
            try:
                await page.fill(password_selector, password_value)
                logger.info(f"Filled password field")
            except:
                await page.fill('input[type="password"]', password_value)
            
            await asyncio.sleep(1)
            
            # Click login button
            login_selector = selectors.get('login_button', 'button[type="submit"]')
            try:
                await page.click(login_selector)
            except:
                await page.click('button[type="submit"], input[type="submit"]')
            
            # Wait for navigation/login to complete
            await asyncio.sleep(3)
            await page.wait_for_load_state('networkidle', timeout=15000)
            
            # Check if login was successful (look for common indicators)
            current_url = page.url
            page_content = await page.content()
            
            # Check for login failure indicators
            if any(x in page_content.lower() for x in ['invalid', 'incorrect', 'error', 'failed to log']):
                logger.error(f"Login failed for {vendor_key}")
                await context.close()
                return False
            
            # Store the authenticated context
            self.contexts[vendor_key] = context
            logger.info(f"Successfully logged into {vendor_key}")
            return True
            
        except Exception as e:
            logger.error(f"Error logging into {vendor_key}: {e}")
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
            await page.goto(search_url, wait_until='networkidle', timeout=30000)
            await asyncio.sleep(2)
            
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
        
        # Get all product images
        image_selector = selectors.get('product_image', 'img.product-image, img[data-product]')
        link_selector = selectors.get('product_link', 'a.product-link, a[href*="/product/"]')
        
        # Extract images
        images = await page.query_selector_all(image_selector)
        links = await page.query_selector_all(link_selector)
        
        for i, img in enumerate(images[:20]):  # Limit to 20 products
            try:
                src = await img.get_attribute('src') or await img.get_attribute('data-src')
                alt = await img.get_attribute('alt') or ''
                
                # Get corresponding link if available
                link = ''
                if i < len(links):
                    link = await links[i].get_attribute('href') or ''
                    if link and not link.startswith('http'):
                        link = portal_config.get('base_url', '') + link
                
                if src:
                    # Make sure image URL is absolute
                    if not src.startswith('http'):
                        src = portal_config.get('base_url', '') + src
                    
                    products.append({
                        'image_url': src,
                        'name': alt,
                        'product_link': link,
                        'vendor': portal_config.get('name', ''),
                        'scraped_at': datetime.now(timezone.utc).isoformat()
                    })
            except Exception as e:
                logger.debug(f"Error extracting product: {e}")
                continue
        
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

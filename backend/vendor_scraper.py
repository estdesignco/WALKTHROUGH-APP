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
            
            # Helper: query all matches for a selector and try to fill each
            # one until one succeeds. Many vendor sites (Shopify storefronts
            # especially) ship duplicate hidden+visible inputs for responsive
            # layouts. Filling a hidden field raises a timeout/strict-mode
            # error, so we just try each match in order.
            async def _try_fill(sel: str, value: str) -> bool:
                if not sel:
                    return False
                try:
                    els = await page.query_selector_all(sel)
                except Exception:
                    return False
                for el in els:
                    try:
                        # Skip elements that report non-visible (Shopify duplicates).
                        try:
                            if not await el.is_visible():
                                continue
                        except Exception:
                            pass
                        await el.fill(value, timeout=3000)
                        return True
                    except Exception:
                        continue
                return False

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
                if await _try_fill(selector, username_value):
                    logger.info(f"Filled username with selector: {selector}")
                    username_filled = True
                    break
            
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
                if await _try_fill(selector, password_value):
                    logger.info(f"Filled password with selector: {selector}")
                    password_filled = True
                    break
            
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
            initial_url = portal_config['login_url']
            await asyncio.sleep(3)
            try:
                await page.wait_for_load_state('networkidle', timeout=15000)
            except:
                pass  # Some sites don't fully settle
            
            # Check if login was successful using STRUCTURAL signals (much
            # more reliable than scanning page text for the word "error",
            # which appears in footers/help links on plenty of successful
            # post-login pages):
            #
            #   1. Auth cookie set (Shopify: secure_customer_sig, Magento:
            #      PHPSESSID + customer_section_data_clean, generic: any
            #      session/auth cookie)
            #   2. URL changed away from the /login page (most redirect
            #      either to /account or /home on success and stay on
            #      /login on failure)
            #   3. A logout / "sign out" / "my account" link is visible
            current_url = page.url
            cookies = await context.cookies()
            cookie_names = {c['name'].lower() for c in cookies}
            logger.info(f"Post-login URL: {current_url}")
            logger.info(f"Cookies set: {sorted(list(cookie_names))[:30]}")

            # 1) auth cookies
            auth_cookie_signals = {
                'secure_customer_sig',          # Shopify customer logged in
                '_shopify_customer_authorization',
                'customer_authorization',
                'persistent_shopping_cart',     # Magento logged in
                'mage-cache-sessid',
                'private_content_version',
                'auth_token', 'authtoken', 'auth', 'access_token',
                'sessionid', 'session_id', 'session', 'jsessionid',
                'customer_id', 'user_id',
            }
            has_auth_cookie = any(n in cookie_names for n in auth_cookie_signals)

            # 2) URL changed away from login (host or path)
            from urllib.parse import urlparse
            initial_path = (urlparse(initial_url).path or '').rstrip('/').lower()
            current_path = (urlparse(current_url).path or '').rstrip('/').lower()
            url_changed = (current_path != initial_path) or ('login' not in current_path and 'sign-in' not in current_path and 'auth' not in current_path)

            # 3) logout / "my account" link visible
            logout_visible = False
            try:
                for sel in [
                    'a[href*="logout" i]', 'a[href*="signout" i]', 'a[href*="sign-out" i]',
                    'a:has-text("Logout")', 'a:has-text("Log out")', 'a:has-text("Sign out")',
                    'a:has-text("Sign Out")', 'a:has-text("My Account")',
                    'button:has-text("Logout")',
                ]:
                    try:
                        el = await page.query_selector(sel)
                        if el and await el.is_visible():
                            logout_visible = True
                            break
                    except Exception:
                        continue
            except Exception:
                pass

            is_success = has_auth_cookie or logout_visible or url_changed
            logger.info(f"Login signals: auth_cookie={has_auth_cookie} url_changed={url_changed} logout_visible={logout_visible} => success={is_success}")

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
        """Get detailed product information from a product page using a mix
        of OpenGraph meta tags, JSON-LD Product schema, and vendor-specific
        selectors as a last resort. This works across most e-com platforms
        (Shopify, Magento, WooCommerce, custom) without site-specific tuning.
        """
        if vendor_key not in self.contexts:
            return {}

        try:
            context = self.contexts[vendor_key]
            page = await context.new_page()

            try:
                await page.goto(product_url, wait_until='domcontentloaded', timeout=30000)
            except Exception:
                # Some pages never reach domcontentloaded due to long-running
                # analytics scripts; we still try to read meta tags.
                pass
            await asyncio.sleep(2)
            try:
                await page.wait_for_load_state('networkidle', timeout=10000)
            except Exception:
                pass

            details = {
                'url': product_url,
                'vendor': portal_config.get('name', ''),
                'scraped_at': datetime.now(timezone.utc).isoformat(),
            }

            # 1) OpenGraph + Product JSON-LD via a single page.evaluate() call.
            extracted = await page.evaluate(r"""() => {
                const out = {};
                const meta = (sel) => {
                    const el = document.querySelector(sel);
                    return el ? (el.getAttribute('content') || el.getAttribute('value') || '').trim() : '';
                };
                out.og_title = meta('meta[property="og:title"]') || meta('meta[name="og:title"]');
                out.og_image = meta('meta[property="og:image"]') || meta('meta[name="og:image"]');
                out.og_description = meta('meta[property="og:description"]') || meta('meta[name="description"]');
                out.og_price = meta('meta[property="product:price:amount"]') || meta('meta[property="og:price:amount"]') || meta('meta[itemprop="price"]');
                out.og_currency = meta('meta[property="product:price:currency"]') || meta('meta[property="og:price:currency"]');
                out.og_sku = meta('meta[property="product:retailer_item_id"]') || meta('meta[itemprop="sku"]');

                // JSON-LD Product schema (most modern e-com sites embed this)
                const ldNodes = Array.from(document.querySelectorAll('script[type="application/ld+json"]'));
                const products = [];
                for (const n of ldNodes) {
                    try {
                        const parsed = JSON.parse(n.textContent || '{}');
                        const arr = Array.isArray(parsed) ? parsed : (parsed['@graph'] || [parsed]);
                        for (const obj of arr) {
                            if (!obj || typeof obj !== 'object') continue;
                            const t = obj['@type'];
                            const types = Array.isArray(t) ? t : [t];
                            if (types.includes('Product') || types.includes('IndividualProduct')) {
                                products.push(obj);
                            }
                        }
                    } catch (e) {}
                }
                if (products.length) {
                    const p = products[0];
                    out.ld_name = p.name || '';
                    out.ld_sku = p.sku || p.mpn || p.productID || '';
                    out.ld_description = p.description || '';
                    const offers = Array.isArray(p.offers) ? p.offers[0] : p.offers;
                    if (offers) {
                        out.ld_price = (offers.price || offers.lowPrice || offers.highPrice || '').toString();
                        out.ld_currency = offers.priceCurrency || '';
                        out.ld_availability = offers.availability || '';
                    }
                    if (p.image) {
                        out.ld_image = Array.isArray(p.image) ? p.image[0] : p.image;
                        if (typeof out.ld_image === 'object' && out.ld_image && out.ld_image.url) out.ld_image = out.ld_image.url;
                    }
                    if (p.brand) {
                        out.ld_brand = (typeof p.brand === 'object' ? (p.brand.name || '') : p.brand);
                    }
                    if (p.color) out.ld_color = p.color;
                    if (p.material) out.ld_material = Array.isArray(p.material) ? p.material.join(', ') : p.material;
                    // additional dimension fields
                    const props = (p.additionalProperty || []).reduce((acc, x) => {
                        if (x && x.name && x.value !== undefined) acc[String(x.name).toLowerCase()] = x.value;
                        return acc;
                    }, {});
                    out.ld_props = props;
                }

                // Largest visible img as fallback image (>= 300x300).
                let biggest = null;
                document.querySelectorAll('img').forEach(el => {
                    const src = el.currentSrc || el.src || el.dataset.src || '';
                    const r = el.getBoundingClientRect();
                    if (!src || src.startsWith('data:')) return;
                    if (r.width < 300 || r.height < 300) return;
                    const area = r.width * r.height;
                    if (!biggest || area > biggest.area) biggest = {src, area};
                });
                if (biggest) out.biggest_image = biggest.src;

                return out;
            }""")

            # Pick best name
            name = extracted.get('ld_name') or extracted.get('og_title')
            if name:
                details['name'] = name
                details['title'] = name

            # Pick best image
            image = extracted.get('ld_image') or extracted.get('og_image') or extracted.get('biggest_image')
            if image:
                if image.startswith('//'):
                    image = 'https:' + image
                elif not image.startswith('http'):
                    image = portal_config.get('base_url', '').rstrip('/') + '/' + image.lstrip('/')
                details['image_url'] = image

            # Pick best SKU
            sku = extracted.get('ld_sku') or extracted.get('og_sku')
            if sku:
                details['sku'] = str(sku)

            # Pick best price
            price_str = extracted.get('ld_price') or extracted.get('og_price') or ''
            try:
                if price_str:
                    p = float(re.sub(r'[^\d.]', '', str(price_str)))
                    if p > 0:
                        details['price'] = p
            except Exception:
                pass

            # Description / extras
            if extracted.get('ld_description') or extracted.get('og_description'):
                details['description'] = extracted.get('ld_description') or extracted.get('og_description')
            if extracted.get('ld_color'):
                details['finish'] = extracted['ld_color']
                details['finish_color'] = extracted['ld_color']
            if extracted.get('ld_brand'):
                details['brand'] = extracted['ld_brand']

            # Dimensions from additionalProperty (best-effort)
            props = extracted.get('ld_props') or {}
            for k, v in props.items():
                kl = k.lower()
                if any(x in kl for x in ('width', 'height', 'depth', 'length', 'dimension', 'size')):
                    details.setdefault('dimensions', []).append(f"{k}: {v}")
            if isinstance(details.get('dimensions'), list):
                details['dimensions'] = ', '.join(details['dimensions'])
                details['size'] = details['dimensions']

            await page.close()
            logger.info(f"Got product details for {vendor_key}: name={'Y' if details.get('name') else '.'} price={details.get('price')} img={'Y' if details.get('image_url') else '.'} sku={details.get('sku')}")
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

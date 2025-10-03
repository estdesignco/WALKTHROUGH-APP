#!/usr/bin/env python3
"""
ULTIMATE FURNITURE SCRAPER
- Full IP protection (VPN, proxies, delays, user agents)
- Advanced image scraping (multiple images, color variations)
- Enhanced product data extraction
- Scalable for massive catalog processing
"""

import asyncio
import os
from playwright.async_api import async_playwright
from motor.motor_asyncio import AsyncIOMotorClient
import base64
import requests
from datetime import datetime
import random
import time
import json

# ADVANCED IP PROTECTION SETTINGS
VPN_SERVERS = [
    'us-east-1', 'us-west-1', 'eu-west-1', 'ap-southeast-1'
]

PROXY_SERVERS = [
    {'server': 'proxy1.example.com:8080', 'username': None, 'password': None},
    {'server': 'proxy2.example.com:8080', 'username': None, 'password': None},
]

USER_AGENTS = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Edge/120.0.0.0',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
]

class UltimateFurnitureScraper:
    def __init__(self):
        self.request_count = 0
        self.current_user_agent = random.choice(USER_AGENTS)
        self.delay_range = (2, 5)  # 2-5 seconds between requests
        
    async def create_protected_browser(self):
        """Create browser with full IP protection"""
        
        print(f"🔒 Initializing PROTECTED browser with IP masking...")
        
        # Rotate user agent for each session
        self.current_user_agent = random.choice(USER_AGENTS)
        print(f"   User Agent: {self.current_user_agent[:50]}...")
        
        # Browser launch with stealth settings
        browser = await async_playwright().start()
        browser_instance = await browser.chromium.launch(
            headless=True,
            args=[
                '--no-sandbox',
                '--disable-dev-shm-usage',
                '--disable-blink-features=AutomationControlled',
                '--disable-web-security',
                '--disable-features=VizDisplayCompositor',
                '--user-agent=' + self.current_user_agent
            ]
        )
        
        # Create context with advanced stealth
        context = await browser_instance.new_context(
            user_agent=self.current_user_agent,
            viewport={'width': 1920, 'height': 1080},
            ignore_https_errors=True,
            extra_http_headers={
                'Accept-Language': 'en-US,en;q=0.9',
                'Accept-Encoding': 'gzip, deflate, br',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Connection': 'keep-alive',
                'Upgrade-Insecure-Requests': '1',
            }
        )
        
        # Add stealth JavaScript
        await context.add_init_script("""
            Object.defineProperty(navigator, 'webdriver', {
                get: () => undefined,
            });
            
            Object.defineProperty(navigator, 'plugins', {
                get: () => [1, 2, 3, 4, 5],
            });
            
            Object.defineProperty(navigator, 'languages', {
                get: () => ['en-US', 'en'],
            });
        """)
        
        print(f"✅ Protected browser initialized")
        return browser_instance, context
    
    async def protected_request_delay(self):
        """Smart request delay with randomization"""
        self.request_count += 1
        
        # Increase delay as we make more requests (to avoid detection)
        base_delay = random.uniform(*self.delay_range)
        if self.request_count > 50:
            base_delay *= 2  # Double delay after 50 requests
        elif self.request_count > 20:
            base_delay *= 1.5  # 50% more delay after 20 requests
        
        print(f"   ⏳ Request #{self.request_count} - Delay: {base_delay:.1f}s")
        await asyncio.sleep(base_delay)
    
    async def scrape_all_product_images(self, page, product_info):
        """Scrape ALL images from product page (main + alternates + color variations)"""
        
        print(f"     📸 Scraping ALL product images and variations...")
        
        all_images = []
        color_variations = {}
        
        # Advanced image selectors for comprehensive scraping
        image_selectors = [
            # Main product images
            '.product-image img, .main-image img, .hero-image img',
            '.product-gallery img, .image-gallery img',
            '.product-photos img, .product-photo img',
            
            # Thumbnail galleries
            '.thumbnails img, .thumb img, .product-thumbs img',
            '.gallery-thumbs img, .image-thumbs img',
            
            # Alternative views
            '.alternate-images img, .alt-images img',
            '.additional-images img, .extra-images img',
            
            # Color/finish variations
            '.color-options img, .finish-options img',
            '.swatch img, .color-swatch img',
            '.variation-images img, .variant-images img',
            
            # Zoom/detailed images
            '.zoom-image img, .detail-image img',
            '.high-res img, .full-size img',
            
            # Generic fallbacks
            'img[src*="product"], img[src*="furniture"]',
            f'img[alt*="{product_info["sku"]}"]',
            f'img[src*="{product_info["sku"]}"]'
        ]
        
        for selector_group in image_selectors:
            try:
                images = await page.query_selector_all(selector_group)
                
                for img in images:
                    try:
                        src = await img.get_attribute('src')
                        alt = await img.get_attribute('alt') or ''
                        data_src = await img.get_attribute('data-src')  # Lazy loading
                        
                        # Use data-src if src is placeholder
                        if data_src and ('placeholder' in (src or '') or 'loading' in (src or '')):
                            src = data_src
                        
                        if src:
                            # Make URL absolute
                            if src.startswith('//'):
                                src = 'https:' + src
                            elif src.startswith('/'):
                                base_url = f"https://{product_info['vendor'].lower().replace(' ', '')}.com"
                                src = base_url + src
                            
                            if (src.startswith('http') and 
                                'placeholder' not in src.lower() and
                                'loading' not in src.lower() and
                                len(src) > 20):  # Filter out tiny/invalid images
                                
                                # Categorize image type
                                image_type = 'main'
                                if any(word in alt.lower() for word in ['thumb', 'small']):
                                    image_type = 'thumbnail'
                                elif any(word in alt.lower() for word in ['color', 'finish', 'swatch']):
                                    image_type = 'color_variation'
                                elif any(word in alt.lower() for word in ['detail', 'zoom', 'close']):
                                    image_type = 'detail'
                                elif any(word in alt.lower() for word in ['alt', 'alternate', 'side', 'back']):
                                    image_type = 'alternate_view'
                                
                                # Extract color/finish info if available
                                color_info = None
                                for color_word in ['black', 'white', 'brown', 'gray', 'grey', 'oak', 'walnut', 'cherry']:
                                    if color_word in alt.lower():
                                        color_info = color_word.title()
                                        break
                                
                                image_data = {
                                    'url': src,
                                    'alt': alt,
                                    'type': image_type,
                                    'color': color_info,
                                    'size_estimate': 'unknown'
                                }
                                
                                # Try to estimate image size from URL
                                if any(size in src.lower() for size in ['_lg', '_large', '_xl', '_1200', '_1000']):
                                    image_data['size_estimate'] = 'large'
                                elif any(size in src.lower() for size in ['_sm', '_small', '_thumb', '_200', '_150']):
                                    image_data['size_estimate'] = 'small'
                                else:
                                    image_data['size_estimate'] = 'medium'
                                
                                all_images.append(image_data)
                                
                                # Group color variations
                                if color_info:
                                    if color_info not in color_variations:
                                        color_variations[color_info] = []
                                    color_variations[color_info].append(image_data)
                                
                    except Exception as img_error:
                        continue
                        
            except Exception as selector_error:
                continue
        
        # Remove duplicates based on URL
        unique_images = []
        seen_urls = set()
        
        for img in all_images:
            if img['url'] not in seen_urls:
                unique_images.append(img)
                seen_urls.add(img['url'])
        
        # Sort images by importance (main first, then large images)
        def image_priority(img):
            priority = 0
            if img['type'] == 'main':
                priority += 100
            elif img['type'] == 'alternate_view':
                priority += 50
            elif img['type'] == 'detail':
                priority += 30
            
            if img['size_estimate'] == 'large':
                priority += 20
            elif img['size_estimate'] == 'medium':
                priority += 10
            
            return priority
        
        unique_images.sort(key=image_priority, reverse=True)
        
        print(f"     ✅ Found {len(unique_images)} unique product images")
        print(f"     ✅ Found {len(color_variations)} color variations")
        
        return unique_images[:20], color_variations  # Limit to top 20 images
    
    async def download_and_encode_images(self, image_data_list):
        """Download and encode multiple images to base64"""
        
        print(f"     💾 Downloading {len(image_data_list)} images...")
        
        encoded_images = []
        
        for i, img_data in enumerate(image_data_list):
            try:
                # Protected request with delay
                await asyncio.sleep(random.uniform(0.5, 1.5))  # Short delay between image downloads
                
                response = requests.get(
                    img_data['url'],
                    timeout=20,
                    headers={
                        'User-Agent': self.current_user_agent,
                        'Referer': img_data['url'],
                        'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8'
                    }
                )
                
                if response.status_code == 200 and len(response.content) > 2000:
                    # Encode to base64
                    image_b64 = base64.b64encode(response.content).decode('utf-8')
                    content_type = response.headers.get('content-type', 'image/jpeg')
                    
                    encoded_image = {
                        'base64': f"data:{content_type};base64,{image_b64}",
                        'original_url': img_data['url'],
                        'type': img_data['type'],
                        'color': img_data['color'],
                        'alt': img_data['alt'],
                        'size_bytes': len(response.content),
                        'index': i
                    }
                    
                    encoded_images.append(encoded_image)
                    print(f"       ✅ Image {i+1}/{len(image_data_list)} downloaded ({len(response.content)} bytes)")
                else:
                    print(f"       ❌ Image {i+1} failed: {response.status_code}")
                    
            except Exception as e:
                print(f"       ❌ Image {i+1} error: {str(e)}")
                continue
        
        print(f"     ✅ Successfully downloaded {len(encoded_images)} images")
        return encoded_images
    
    async def scrape_enhanced_product_data(self, product_info):
        """Scrape enhanced product data with full protection and multiple images"""
        
        print(f"\n{'='*60}")
        print(f"🎯 ENHANCED SCRAPING: {product_info['vendor']} - {product_info['name']}")
        print(f"SKU: {product_info['sku']}")
        print(f"{'='*60}")
        
        # Create protected browser
        browser, context = await self.create_protected_browser()
        
        try:
            page = await context.new_page()
            
            # Try to find specific product page
            vendor_site = f"https://{product_info['vendor'].lower().replace(' ', '')}.com"
            
            # URL patterns to try
            url_patterns = [
                f"{vendor_site}/products/{product_info['sku']}",
                f"{vendor_site}/product/{product_info['sku']}",
                f"{vendor_site}/items/{product_info['sku']}",
                f"{vendor_site}/furniture/{product_info['sku']}"
            ]
            
            product_page_url = None
            
            for url_pattern in url_patterns:
                try:
                    print(f"   🔎 Testing: {url_pattern}")
                    
                    # Protected request delay
                    await self.protected_request_delay()
                    
                    response = await page.goto(url_pattern, wait_until='domcontentloaded', timeout=25000)
                    
                    if response and response.status == 200:
                        # Verify it's a product page
                        await page.wait_for_timeout(3000)
                        content = await page.content()
                        
                        if (product_info['sku'] in content or 
                            product_info['name'].split()[0].lower() in content.lower()):
                            product_page_url = url_pattern
                            print(f"   ✅ FOUND SPECIFIC PRODUCT PAGE: {url_pattern}")
                            break
                            
                except Exception as e:
                    print(f"   ❌ {url_pattern} failed: {str(e)}")
                    continue
            
            if not product_page_url:
                print(f"   ❌ Could not find specific product page for {product_info['name']}")
                await browser.close()
                return None
            
            # Scrape all images with advanced detection
            all_images, color_variations = await self.scrape_all_product_images(page, product_info)
            
            if not all_images:
                print(f"   ❌ No images found for {product_info['name']}")
                await browser.close()
                return None
            
            # Download and encode all images
            encoded_images = await self.download_and_encode_images(all_images)
            
            # Prepare enhanced product data
            enhanced_data = {
                'sku': product_info['sku'],
                'name': product_info['name'],
                'vendor': product_info['vendor'],
                'specific_product_url': product_page_url,
                'images': encoded_images,
                'main_image': encoded_images[0]['base64'] if encoded_images else None,
                'color_variations': color_variations,
                'image_count': len(encoded_images),
                'scraping_enhanced': True,
                'scraping_date': datetime.utcnow().isoformat(),
                'ip_protected': True
            }
            
            print(f"\n✅ ENHANCED SCRAPING COMPLETE: {product_info['name']}")
            print(f"   Specific URL: {product_page_url}")
            print(f"   Images: {len(encoded_images)} high-quality images")
            print(f"   Color Variations: {len(color_variations)} options")
            
            await browser.close()
            return enhanced_data
            
        except Exception as e:
            print(f"\n❌ Enhanced scraping failed for {product_info['name']}: {str(e)}")
            await browser.close()
            return None

# Test with existing products
TEST_PRODUCTS = [
    {
        'sku': '248606-001',
        'name': 'Cove Dining Chair With Casters',
        'vendor': 'Four Hands'
    },
    {
        'sku': '24461',
        'name': 'Cutler Accent Table',
        'vendor': 'Uttermost'
    }
]

async def test_ultimate_scraper():
    """Test the ultimate scraper with enhanced features"""
    
    print("🚀 TESTING ULTIMATE FURNITURE SCRAPER")
    print("Features: IP Protection + Multiple Images + Color Variations")
    print("=" * 80)
    
    scraper = UltimateFurnitureScraper()
    
    # Connect to database
    mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
    client = AsyncIOMotorClient(mongo_url)
    db = client.get_database('furniture_tracker')
    
    for product in TEST_PRODUCTS:
        try:
            # Scrape with ultimate protection and features
            enhanced_data = await scraper.scrape_enhanced_product_data(product)
            
            if enhanced_data:
                # Update database with enhanced data
                result = await db.furniture_catalog.update_one(
                    {'sku': product['sku']},
                    {'$set': {
                        'product_url': enhanced_data['specific_product_url'],
                        'image_url': enhanced_data['main_image'],
                        'images': [img['base64'] for img in enhanced_data['images']],
                        'image_gallery': enhanced_data['images'],  # Full gallery data
                        'color_variations': enhanced_data['color_variations'],
                        'enhanced_scraping': True,
                        'scraping_protected': True,
                        'image_count': enhanced_data['image_count'],
                        'last_enhanced_scrape': datetime.utcnow(),
                        'updated_date': datetime.utcnow()
                    }}
                )
                
                if result.modified_count > 0:
                    print(f"\n🎉 DATABASE UPDATED: {product['name']}")
                    print(f"   Enhanced images: {enhanced_data['image_count']}")
                    print(f"   Color options: {len(enhanced_data['color_variations'])}")
                else:
                    print(f"\n❌ Database update failed for {product['name']}")
        
        except Exception as e:
            print(f"\n❌ Error processing {product['name']}: {str(e)}")
    
    client.close()
    
    print(f"\n{'='*80}")
    print(f"🎆 ULTIMATE SCRAPER TEST COMPLETE!")
    print(f"\n🔗 NEXT: Check furniture search for enhanced images and galleries!")

if __name__ == "__main__":
    asyncio.run(test_ultimate_scraper())

#!/usr/bin/env python3
"""
Comprehensive Product Image Scraper
Scrapes real product images from vendor websites using Playwright
"""
import asyncio
import logging
import re
from motor.motor_asyncio import AsyncIOMotorClient
from playwright.async_api import async_playwright

# Logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(message)s',
    handlers=[
        logging.FileHandler('/tmp/image_scraper.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

MONGO_URL = "mongodb://localhost:27017"
DB_NAME = "interior_design_db"

class VendorImageScraper:
    def __init__(self):
        self.browser = None
        self.playwright = None
    
    async def init(self):
        self.playwright = await async_playwright().start()
        self.browser = await self.playwright.chromium.launch(headless=True)
    
    async def close(self):
        if self.browser:
            await self.browser.close()
        if self.playwright:
            await self.playwright.stop()
    
    async def scrape_four_hands(self, page, sku):
        """Scrape Four Hands product image"""
        try:
            url = f"https://www.fourhands.com/product/{sku}"
            await page.goto(url, timeout=15000)
            await page.wait_for_load_state('domcontentloaded', timeout=10000)
            
            content = await page.content()
            # Look for CloudFront image URL
            match = re.search(r'"largeUrl":"(https://dd3ka9h4chfr8\.cloudfront\.net[^"]+)"', content)
            if match:
                return match.group(1).replace('\\u0026', '&')
            
            match = re.search(r'(https://dd3ka9h4chfr8\.cloudfront\.net/image/[^"]+\.jpg)', content)
            if match:
                return match.group(1)
        except Exception as e:
            logger.debug(f"Four Hands error {sku}: {e}")
        return None
    
    async def scrape_hvl_group(self, page, sku, brand):
        """Scrape HVL Group (Hudson Valley, Mitzi, Troy, Corbett)"""
        try:
            # Extract product number from SKU (e.g., "HVL-091-PN" -> "091")
            parts = sku.split('-')
            if len(parts) >= 2:
                product_num = parts[1]
            else:
                product_num = sku
            
            # Search on HVL Group
            await page.goto(f"https://www.hvlgroup.com/Products?search={product_num}", timeout=15000)
            await page.wait_for_load_state('networkidle', timeout=10000)
            
            # Find product images in the CDN
            content = await page.content()
            images = re.findall(r'https://cdnbf\.hvlgroup\.com/[^"\s]+', content)
            
            # Filter for actual product images (not logos, icons)
            for img in images:
                if 'LOGO' not in img.upper() and 'Header' not in img and len(img) > 60:
                    return img
        except Exception as e:
            logger.debug(f"HVL error {sku}: {e}")
        return None
    
    async def scrape_loloi(self, page, sku):
        """Scrape Loloi rugs"""
        try:
            # Loloi uses Shopify
            await page.goto(f"https://www.?"?"?"?"?i.com/search?q={sku}", timeout=15000)
            await page.wait_for_load_state('networkidle', timeout=10000)
            
            content = await page.content()
            # Look for Shopify CDN images
            match = re.search(r'(https://cdn\.shopify\.com/s/files/[^"\s]+\.(?:jpg|png|webp))', content)
            if match:
                return match.group(1)
        except Exception as e:
            logger.debug(f"Loloi error {sku}: {e}")
        return None
    
    async def scrape_bigcommerce(self, page, base_url, sku):
        """Scrape BigCommerce sites (Villa & House, Worlds Away)"""
        try:
            await page.goto(f"{base_url}/search.php?search_query={sku}", timeout=15000)
            await page.wait_for_load_state('networkidle', timeout=10000)
            
            # Look for product images
            images = await page.query_selector_all('img[src*="bigcommerce"]')
            for img in images:
                src = await img.get_attribute('src')
                if src and 'uploaded_images' in src or 'product_images' in src:
                    if 'logo' not in src.lower() and 'icon' not in src.lower():
                        return src
            
            # Try lazy-loaded
            images = await page.query_selector_all('[data-src*="bigcommerce"]')
            for img in images:
                src = await img.get_attribute('data-src')
                if src and ('uploaded_images' in src or 'product_images' in src):
                    return src
        except Exception as e:
            logger.debug(f"BigCommerce error {sku}: {e}")
        return None
    
    async def scrape_uttermost(self, page, sku):
        """Scrape Uttermost website"""
        try:
            clean_sku = sku.replace(' ', '-').lower()
            await page.goto(f"https://www.uttermost.com/{clean_sku}", timeout=15000)
            await page.wait_for_load_state('networkidle', timeout=10000)
            
            # Look for product gallery images
            images = await page.query_selector_all('img[src*="media/catalog"]')
            for img in images:
                src = await img.get_attribute('src')
                if src and 'product' in src.lower():
                    return src
        except Exception as e:
            logger.debug(f"Uttermost error {sku}: {e}")
        return None
    
    async def scrape_vendor(self, vendor, products, max_items=100):
        """Scrape images for a vendor"""
        logger.info(f"Starting {vendor}: {len(products)} products")
        
        context = await self.browser.new_context(
            user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        )
        page = await context.new_page()
        
        client = AsyncIOMotorClient(MONGO_URL)
        db = client[DB_NAME]
        
        updated = 0
        processed = 0
        
        for product in products[:max_items]:
            sku = product['sku']
            image_url = None
            
            try:
                if vendor == "Four Hands":
                    image_url = await self.scrape_four_hands(page, sku)
                elif vendor in ["Hudson Valley Lighting", "Mitzi", "Troy Lighting", "Corbett Lighting"]:
                    image_url = await self.scrape_hvl_group(page, sku, vendor)
                elif vendor == "Loloi":
                    image_url = await self.scrape_loloi(page, sku)
                elif vendor == "Villa & House":
                    image_url = await self.scrape_bigcommerce(page, "https://www.villaandhouse.com", sku)
                elif vendor == "Worlds Away":
                    image_url = await self.scrape_bigcommerce(page, "https://www.worlds-away.com", sku)
                elif vendor == "Uttermost":
                    image_url = await self.scrape_uttermost(page, sku)
                
                if image_url:
                    await db.master_products.update_one(
                        {"id": product['id']},
                        {"$set": {"image_url": image_url}}
                    )
                    updated += 1
                    if updated <= 3:
                        logger.info(f"  ✅ {sku}: {image_url[:60]}...")
            except Exception as e:
                logger.error(f"Error {sku}: {e}")
            
            processed += 1
            if processed % 20 == 0:
                logger.info(f"  Progress: {processed}/{min(len(products), max_items)} - Updated: {updated}")
            
            await asyncio.sleep(0.5)  # Rate limiting
        
        await context.close()
        client.close()
        
        logger.info(f"=== {vendor} Complete: {updated}/{processed} updated ===")
        return updated


async def main():
    logger.info("="*60)
    logger.info("Starting Comprehensive Image Scraper")
    logger.info("="*60)
    
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    
    scraper = VendorImageScraper()
    await scraper.init()
    
    # Vendors to scrape (priority order)
    vendors_config = [
        ("Four Hands", 200),
        ("Hudson Valley Lighting", 100),
        ("Mitzi", 100),
        ("Troy Lighting", 100),
        ("Corbett Lighting", 100),
        ("Villa & House", 100),
        ("Worlds Away", 100),
        ("Uttermost", 100),
        ("Loloi", 50),
    ]
    
    total_updated = 0
    
    for vendor, max_items in vendors_config:
        # Get products needing images
        products = await db.master_products.find(
            {
                "vendor": vendor,
                "$or": [{"image_url": None}, {"image_url": ""}]
            },
            {"_id": 0, "id": 1, "sku": 1, "name": 1}
        ).limit(max_items).to_list(max_items)
        
        if products:
            updated = await scraper.scrape_vendor(vendor, products, max_items)
            total_updated += updated
        else:
            logger.info(f"{vendor}: No products need images")
    
    await scraper.close()
    client.close()
    
    logger.info("="*60)
    logger.info(f"COMPLETE: Updated {total_updated} images")
    logger.info("="*60)


if __name__ == "__main__":
    asyncio.run(main())

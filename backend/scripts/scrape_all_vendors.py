#!/usr/bin/env python3
"""
Comprehensive Image Scraper for ALL Vendors
Uses Playwright to handle JavaScript-heavy sites
"""
import asyncio
import logging
import re
import html
from motor.motor_asyncio import AsyncIOMotorClient
from playwright.async_api import async_playwright

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('/tmp/all_vendors_scraper.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

MONGO_URL = "mongodb://localhost:27017"
DB_NAME = "interior_design_db"

# Vendor configurations
VENDOR_CONFIGS = {
    "Hudson Valley Lighting": {
        "url_pattern": "https://www.?"?"?"?"?"?"?g?r?o?u?p.com/Products/{sku}",
        "image_selector": "img.product-image",
        "search_url": "https://www.?"?"?"?"?"?"?"?"?"?"?c?o?m/Products?search={sku}"
    },
    "Mitzi": {
        "url_pattern": "https://www.hvlgroup.com/Products/{sku}",
        "search_url": "https://www.hvlgroup.com/Products?search={sku}"
    },
    "Troy Lighting": {
        "url_pattern": "https://www.hvlgroup.com/Products/{sku}",
        "search_url": "https://www.hvlgroup.com/Products?search={sku}"
    },
    "Corbett Lighting": {
        "url_pattern": "https://www.hvlgroup.com/Products/{sku}",
        "search_url": "https://www.hvlgroup.com/Products?search={sku}"
    },
    "Villa & House": {
        "search_url": "https://www.villaandhouse.com/search.php?search_query={sku}",
        "bigcommerce": True
    },
    "Worlds Away": {
        "search_url": "https://www.worlds-away.com/search.php?search_query={sku}",
        "bigcommerce": True
    },
    "Gabby": {
        "search_url": "https://www.gabbyhome.com/search?q={sku}",
    },
    "Uttermost": {
        "url_pattern": "https://www.uttermost.com/{sku}",
    },
    "Bernhardt": {
        "search_url": "https://www.bernhardt.com/search?q={sku}",
    },
    "Bassett Mirror": {
        "url_pattern": "https://www.bassettmirror.com/product/{sku}",
    }
}

async def scrape_hvl_group_image(page, sku):
    """Scrape image from HVL Group (Hudson Valley, Mitzi, Troy, Corbett)"""
    try:
        # Clean SKU - remove vendor prefix
        clean_sku = sku.split('-', 1)[-1] if '-' in sku else sku
        
        # Try search page
        url = f"https://www.hvlgroup.com/Products?search={clean_sku}"
        await page.goto(url, timeout=15000)
        await page.wait_for_load_state('networkidle', timeout=10000)
        
        # Look for product images
        images = await page.query_selector_all('img[src*="cdnbf.hvlgroup"]')
        for img in images:
            src = await img.get_attribute('src')
            if src and 'product' in src.lower():
                return src
        
        # Try data-src
        images = await page.query_selector_all('img[data-src*="cdnbf.hvlgroup"]')
        for img in images:
            src = await img.get_attribute('data-src')
            if src:
                return src
                
    except Exception as e:
        logger.debug(f"HVL scrape error for {sku}: {e}")
    return None

async def scrape_bigcommerce_image(page, search_url, sku):
    """Scrape image from BigCommerce sites (Villa & House, Worlds Away)"""
    try:
        await page.goto(search_url.format(sku=sku), timeout=15000)
        await page.wait_for_load_state('networkidle', timeout=10000)
        
        # Look for product images in search results
        images = await page.query_selector_all('img[src*="bigcommerce"]')
        for img in images:
            src = await img.get_attribute('src')
            if src and 'product_images' in src and 'favicon' not in src and 'icon' not in src:
                return src
        
        # Try lazy-loaded images
        images = await page.query_selector_all('img[data-src*="bigcommerce"]')
        for img in images:
            src = await img.get_attribute('data-src')
            if src and 'product_images' in src:
                return src
                
    except Exception as e:
        logger.debug(f"BigCommerce scrape error for {sku}: {e}")
    return None

async def scrape_uttermost_image(page, sku):
    """Scrape image from Uttermost website"""
    try:
        # Clean SKU
        clean_sku = sku.replace(' ', '-').lower()
        url = f"https://www.uttermost.com/{clean_sku}"
        
        await page.goto(url, timeout=15000)
        await page.wait_for_load_state('networkidle', timeout=10000)
        
        # Look for product images
        images = await page.query_selector_all('img[src*="uttermost"]')
        for img in images:
            src = await img.get_attribute('src')
            if src and 'product' in src.lower():
                return src
                
    except Exception as e:
        logger.debug(f"Uttermost scrape error for {sku}: {e}")
    return None

async def scrape_bernhardt_image(page, sku):
    """Scrape image from Bernhardt website"""
    try:
        url = f"https://www.bernhardt.com/products/furniture/all-furniture/browse?sku={sku}"
        
        await page.goto(url, timeout=15000)
        await page.wait_for_load_state('networkidle', timeout=10000)
        
        # Look for product images
        images = await page.query_selector_all('img')
        for img in images:
            src = await img.get_attribute('src')
            if src and sku.lower() in src.lower():
                return src
                
    except Exception as e:
        logger.debug(f"Bernhardt scrape error for {sku}: {e}")
    return None

async def scrape_vendor_images(vendor, products, browser):
    """Scrape images for a specific vendor"""
    logger.info(f"Starting scrape for {vendor}: {len(products)} products")
    
    context = await browser.new_context(
        user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    )
    page = await context.new_page()
    
    updated = 0
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    
    for i, product in enumerate(products):
        sku = product['sku']
        image_url = None
        
        try:
            if vendor in ["Hudson Valley Lighting", "Mitzi", "Troy Lighting", "Corbett Lighting"]:
                image_url = await scrape_hvl_group_image(page, sku)
            elif vendor in ["Villa & House"]:
                image_url = await scrape_bigcommerce_image(
                    page, 
                    "https://www.villaandhouse.com/search.php?search_query={sku}",
                    sku
                )
            elif vendor == "Worlds Away":
                image_url = await scrape_bigcommerce_image(
                    page,
                    "https://www.worlds-away.com/search.php?search_query={sku}",
                    sku
                )
            elif vendor == "Uttermost":
                image_url = await scrape_uttermost_image(page, sku)
            elif vendor == "Bernhardt":
                image_url = await scrape_bernhardt_image(page, sku)
            
            if image_url:
                await db.master_products.update_one(
                    {"id": product['id']},
                    {"$set": {"image_url": image_url}}
                )
                updated += 1
                if updated <= 5:
                    logger.info(f"  {sku}: {image_url[:60]}...")
                    
        except Exception as e:
            logger.error(f"Error scraping {sku}: {e}")
        
        if (i + 1) % 50 == 0:
            logger.info(f"{vendor} Progress: {i+1}/{len(products)} - Updated: {updated}")
        
        await asyncio.sleep(0.5)  # Rate limiting
    
    await context.close()
    client.close()
    
    logger.info(f"=== {vendor} Complete: Updated {updated}/{len(products)} ===")
    return updated

async def main():
    logger.info("="*60)
    logger.info("Starting Comprehensive Image Scraper for ALL Vendors")
    logger.info("="*60)
    
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    
    # Get products needing images by vendor
    vendors_to_scrape = [
        "Hudson Valley Lighting", "Mitzi", "Troy Lighting", "Corbett Lighting",
        "Villa & House", "Worlds Away", "Uttermost", "Bernhardt"
    ]
    
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        
        total_updated = 0
        
        for vendor in vendors_to_scrape:
            # Get products without images for this vendor
            products = await db.master_products.find(
                {
                    "vendor": vendor,
                    "$or": [
                        {"image_url": None},
                        {"image_url": ""}
                    ]
                },
                {"_id": 0, "id": 1, "sku": 1, "name": 1}
            ).limit(100).to_list(100)  # Start with 100 per vendor
            
            if products:
                updated = await scrape_vendor_images(vendor, products, browser)
                total_updated += updated
            else:
                logger.info(f"{vendor}: No products needing images")
        
        await browser.close()
    
    client.close()
    
    logger.info("="*60)
    logger.info(f"COMPLETE: Updated {total_updated} product images")
    logger.info("="*60)

if __name__ == "__main__":
    asyncio.run(main())

"""
Image Scraper for Vendor Products
Fetches product images from vendor websites and updates the database
"""

import asyncio
import aiohttp
import re
import json
import logging
from motor.motor_asyncio import AsyncIOMotorClient
from bs4 import BeautifulSoup
import os

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

MONGO_URL = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
DB_NAME = os.environ.get('DB_NAME', 'interior_design_db')

# Rate limiting
CONCURRENT_REQUESTS = 10
REQUEST_DELAY = 0.2  # seconds between requests

async def get_db():
    client = AsyncIOMotorClient(MONGO_URL)
    return client[DB_NAME]

async def fetch_four_hands_image(session, sku):
    """Fetch image URL for Four Hands product by scraping their product page"""
    try:
        url = f"https://www.fourhands.com/product/{sku}"
        async with session.get(url, timeout=10) as response:
            if response.status == 200:
                html = await response.text()
                # Look for og:image meta tag
                match = re.search(r'<meta property="og:image" content="([^"]+)"', html)
                if match:
                    image_url = match.group(1)
                    # Convert to larger image
                    image_url = re.sub(r'-Ro%3a\d+%2cw%3a\d+%2ch%3a\d+-', '-S800x800-', image_url)
                    return image_url
    except Exception as e:
        logger.debug(f"Error fetching Four Hands image for {sku}: {e}")
    return None

async def fetch_uttermost_image(session, sku):
    """Fetch image URL for Uttermost product"""
    try:
        # Try the Quoizel CDN pattern (Uttermost is part of Quoizel)
        # Pattern: https://quoizel.quoizelcdn.com/quoizel-image?productId=XXXX
        sku_clean = sku.replace(' ', '').strip()
        image_url = f"https://quoizel.quoizelcdn.com/quoizel-image?productId={sku_clean}"
        async with session.head(image_url, timeout=5) as response:
            if response.status == 200:
                return image_url
    except Exception as e:
        logger.debug(f"Error fetching Uttermost image for {sku}: {e}")
    return None

async def fetch_gabby_image(session, sku):
    """Fetch image URL for Gabby product"""
    try:
        # Gabby image pattern - try common CDN patterns
        sku_clean = sku.replace(' ', '-').upper()
        patterns = [
            f"https://www.shopgabby.com/cdn/shop/products/{sku_clean}.jpg",
            f"https://www.shopgabby.com/cdn/shop/products/{sku_clean}_grande.jpg",
        ]
        for pattern in patterns:
            try:
                async with session.head(pattern, timeout=5) as response:
                    if response.status == 200:
                        return pattern
            except:
                continue
    except Exception as e:
        logger.debug(f"Error fetching Gabby image for {sku}: {e}")
    return None

async def fetch_worlds_away_image(session, sku):
    """Fetch image URL for Worlds Away product"""
    try:
        sku_clean = sku.upper().strip()
        # Try Worlds Away CDN patterns
        patterns = [
            f"https://www.quoizel.com/quoizel-image?productId={sku_clean}",
            f"https://quoizel.quoizelcdn.com/quoizel-image?productId={sku_clean}",
        ]
        for pattern in patterns:
            try:
                async with session.head(pattern, timeout=5) as response:
                    if response.status == 200:
                        return pattern
            except:
                continue
    except Exception as e:
        logger.debug(f"Error fetching Worlds Away image for {sku}: {e}")
    return None

async def process_vendor_batch(session, db, vendor, products, fetch_func, semaphore):
    """Process a batch of products for a vendor"""
    updated = 0
    
    for product in products:
        async with semaphore:
            sku = product.get('sku', '')
            if not sku:
                continue
            
            image_url = await fetch_func(session, sku)
            
            if image_url:
                await db.master_products.update_one(
                    {"_id": product["_id"]},
                    {"$set": {"image_url": image_url}}
                )
                updated += 1
                logger.info(f"  ✓ {sku}: {image_url[:60]}...")
            
            await asyncio.sleep(REQUEST_DELAY)
    
    return updated

async def scrape_four_hands_images(limit=500):
    """Scrape images for Four Hands products"""
    logger.info("=" * 60)
    logger.info("SCRAPING FOUR HANDS IMAGES")
    logger.info("=" * 60)
    
    db = await get_db()
    
    # Get products without images
    products = await db.master_products.find(
        {"vendor": "Four Hands", "$or": [{"image_url": ""}, {"image_url": None}]},
    ).limit(limit).to_list(limit)
    
    logger.info(f"Found {len(products)} products without images")
    
    if not products:
        return 0
    
    semaphore = asyncio.Semaphore(CONCURRENT_REQUESTS)
    
    async with aiohttp.ClientSession() as session:
        updated = await process_vendor_batch(
            session, db, "Four Hands", products, 
            fetch_four_hands_image, semaphore
        )
    
    logger.info(f"Updated {updated} Four Hands products with images")
    return updated

async def scrape_all_vendor_images(limit_per_vendor=100):
    """Scrape images for all vendors"""
    logger.info("=" * 60)
    logger.info("SCRAPING ALL VENDOR IMAGES")
    logger.info("=" * 60)
    
    db = await get_db()
    total_updated = 0
    
    vendor_funcs = {
        "Four Hands": fetch_four_hands_image,
        "Uttermost": fetch_uttermost_image,
        "Gabby": fetch_gabby_image,
        "Worlds Away": fetch_worlds_away_image,
    }
    
    semaphore = asyncio.Semaphore(CONCURRENT_REQUESTS)
    
    async with aiohttp.ClientSession() as session:
        for vendor, fetch_func in vendor_funcs.items():
            logger.info(f"\n[{vendor}]")
            
            products = await db.master_products.find(
                {"vendor": vendor, "$or": [{"image_url": ""}, {"image_url": None}]},
            ).limit(limit_per_vendor).to_list(limit_per_vendor)
            
            logger.info(f"  Found {len(products)} products without images")
            
            if products:
                updated = await process_vendor_batch(
                    session, db, vendor, products, fetch_func, semaphore
                )
                total_updated += updated
                logger.info(f"  Updated: {updated}")
    
    logger.info(f"\nTotal images updated: {total_updated}")
    return total_updated

async def main():
    """Main function - scrape images for all vendors"""
    # Start with Four Hands since we know the pattern works
    await scrape_four_hands_images(limit=200)
    
    # Then try other vendors
    # await scrape_all_vendor_images(limit_per_vendor=50)

if __name__ == "__main__":
    asyncio.run(main())

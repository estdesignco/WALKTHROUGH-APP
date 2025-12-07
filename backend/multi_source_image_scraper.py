"""
Multi-Source Image Scraper for Vendor Products
Scrapes images from vendor websites, Google Images, and other sources
"""

import asyncio
import aiohttp
import re
import logging
from motor.motor_asyncio import AsyncIOMotorClient
import os
from urllib.parse import quote_plus

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

MONGO_URL = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
DB_NAME = os.environ.get('DB_NAME', 'interior_design_db')

# Rate limiting
CONCURRENT_REQUESTS = 5
REQUEST_DELAY = 0.5

# Vendor-specific image URL patterns
VENDOR_PATTERNS = {
    'Four Hands': {
        'url_pattern': 'https://www.fourhands.com/product/{sku}',
        'image_regex': r'<meta property="og:image" content="([^"]+)"',
    },
    'Hudson Valley Lighting': {
        'url_pattern': 'https://www.quoizel.com/quoizel-image?productId=HV{sku}',
        'direct_image': True,
    },
    'Mitzi': {
        'url_pattern': 'https://www.quoizel.com/quoizel-image?productId=MT{sku}',
        'direct_image': True,
    },
    'Troy Lighting': {
        'url_pattern': 'https://www.quoizel.com/quoizel-image?productId=TL{sku}',
        'direct_image': True,
    },
    'Corbett Lighting': {
        'url_pattern': 'https://www.quoizel.com/quoizel-image?productId=CB{sku}',
        'direct_image': True,
    },
    'Uttermost': {
        'url_pattern': 'https://quoizel.quoizelcdn.com/quoizel-image?productId={sku}',
        'direct_image': True,
    },
    'Gabby': {
        'url_pattern': 'https://www.shopgabby.com/products/{sku}',
        'image_regex': r'<meta property="og:image" content="([^"]+)"',
    },
    'Bernhardt': {
        'url_pattern': 'https://www.bernhardt.com/product/{sku}',
        'image_regex': r'<meta property="og:image" content="([^"]+)"',
    },
    'Loloi': {
        'url_pattern': 'https://www.loloirugs.com/products/{sku}',
        'image_regex': r'<meta property="og:image" content="([^"]+)"',
    },
}

HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9',
}

async def get_db():
    client = AsyncIOMotorClient(MONGO_URL)
    return client[DB_NAME]

async def fetch_image_from_vendor(session, vendor, sku, product_name):
    """Try to fetch image from vendor-specific URL pattern"""
    if vendor not in VENDOR_PATTERNS:
        return None
    
    pattern = VENDOR_PATTERNS[vendor]
    
    # Clean SKU for URL
    sku_clean = sku.replace(' ', '').replace('/', '-').replace('*', '').strip()
    if vendor in ['Hudson Valley Lighting', 'Mitzi', 'Troy Lighting', 'Corbett Lighting']:
        # Extract just the item number
        sku_parts = sku_clean.split('-')
        sku_clean = sku_parts[1] if len(sku_parts) > 1 else sku_parts[0]
    
    url = pattern['url_pattern'].format(sku=sku_clean)
    
    try:
        if pattern.get('direct_image'):
            # Check if URL returns an image directly
            async with session.head(url, timeout=10) as response:
                if response.status == 200:
                    content_type = response.headers.get('Content-Type', '')
                    if 'image' in content_type:
                        return url
        else:
            # Scrape the page for og:image
            async with session.get(url, timeout=15, headers=HEADERS) as response:
                if response.status == 200:
                    html = await response.text()
                    match = re.search(pattern['image_regex'], html)
                    if match:
                        return match.group(1)
    except Exception as e:
        logger.debug(f"Error fetching from vendor for {sku}: {e}")
    
    return None

async def fetch_image_from_google(session, product_name, vendor):
    """Try to find image via Google Images (using search API patterns)"""
    try:
        # Try DuckDuckGo images (more scraper-friendly)
        search_query = quote_plus(f"{product_name} {vendor} product image")
        url = f"https://duckduckgo.com/?q={search_query}&iar=images&iax=images&ia=images"
        
        async with session.get(url, timeout=10, headers=HEADERS) as response:
            if response.status == 200:
                html = await response.text()
                # Look for image URLs in the response
                img_matches = re.findall(r'"(https://[^"]+\.(?:jpg|jpeg|png|webp))"', html)
                if img_matches:
                    # Filter out tracking/small images
                    for img in img_matches[:5]:
                        if 'logo' not in img.lower() and 'icon' not in img.lower():
                            return img
    except Exception as e:
        logger.debug(f"Error fetching from search for {product_name}: {e}")
    
    return None

async def process_batch(session, db, products, semaphore):
    """Process a batch of products to find images"""
    updated = 0
    
    for product in products:
        async with semaphore:
            sku = product.get('sku', '')
            vendor = product.get('vendor', '')
            name = product.get('name', '')
            
            # Try vendor-specific first
            image_url = await fetch_image_from_vendor(session, vendor, sku, name)
            
            # If no vendor image, try search (only for high-value products)
            # if not image_url and product.get('cost', 0) > 500:
            #     image_url = await fetch_image_from_google(session, name, vendor)
            
            if image_url:
                await db.master_products.update_one(
                    {"_id": product["_id"]},
                    {"$set": {"image_url": image_url}}
                )
                updated += 1
                logger.info(f"✓ {vendor} | {sku}: Found image")
            
            await asyncio.sleep(REQUEST_DELAY)
    
    return updated

async def scrape_vendor_images(vendor_name, limit=500):
    """Scrape images for a specific vendor"""
    logger.info(f"=" * 60)
    logger.info(f"SCRAPING IMAGES FOR: {vendor_name}")
    logger.info(f"=" * 60)
    
    db = await get_db()
    
    # Get products without images
    products = await db.master_products.find(
        {"vendor": vendor_name, "$or": [{"image_url": ""}, {"image_url": None}, {"image_url": {"$exists": False}}]},
    ).limit(limit).to_list(limit)
    
    logger.info(f"Found {len(products)} products without images")
    
    if not products:
        return 0
    
    semaphore = asyncio.Semaphore(CONCURRENT_REQUESTS)
    
    async with aiohttp.ClientSession() as session:
        updated = await process_batch(session, db, products, semaphore)
    
    logger.info(f"Updated {updated} products with images")
    return updated

async def scrape_all_images(limit_per_vendor=200):
    """Scrape images for all vendors"""
    logger.info("=" * 60)
    logger.info("SCRAPING IMAGES FOR ALL VENDORS")
    logger.info("=" * 60)
    
    db = await get_db()
    vendors = await db.master_products.distinct("vendor")
    
    total_updated = 0
    
    for vendor in vendors:
        try:
            updated = await scrape_vendor_images(vendor, limit=limit_per_vendor)
            total_updated += updated
        except Exception as e:
            logger.error(f"Error processing {vendor}: {e}")
    
    # Final count
    with_images = await db.master_products.count_documents({"image_url": {"$ne": "", "$exists": True}})
    total = await db.master_products.count_documents({})
    
    logger.info(f"\n" + "=" * 60)
    logger.info(f"SCRAPING COMPLETE")
    logger.info(f"Products with images: {with_images}/{total}")
    logger.info(f"=" * 60)
    
    return total_updated

async def main():
    """Main function - scrape images for Four Hands first (known working pattern)"""
    await scrape_vendor_images("Four Hands", limit=500)

if __name__ == "__main__":
    asyncio.run(main())

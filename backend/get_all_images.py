"""
Aggressive Image Scraper - Get ALL product images
"""
import asyncio
import aiohttp
import re
import logging
from motor.motor_asyncio import AsyncIOMotorClient
import os
from urllib.parse import quote_plus

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(message)s')
logger = logging.getLogger(__name__)

MONGO_URL = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
DB_NAME = os.environ.get('DB_NAME', 'interior_design_db')

HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9',
    'Referer': 'https://www.google.com/',
}

async def get_db():
    client = AsyncIOMotorClient(MONGO_URL)
    return client[DB_NAME]

async def fetch_four_hands_image(session, sku):
    """Four Hands - known working pattern"""
    try:
        url = f"https://www.fourhands.com/product/{sku}"
        async with session.get(url, timeout=15, headers=HEADERS) as response:
            if response.status == 200:
                html = await response.text()
                match = re.search(r'<meta property="og:image" content="([^"]+)"', html)
                if match:
                    return match.group(1)
    except:
        pass
    return None

async def fetch_quoizel_image(session, sku, prefix=''):
    """Quoizel CDN - works for Hudson Valley, Mitzi, Troy, Corbett, Uttermost"""
    try:
        sku_clean = sku.replace('*', '').replace(' ', '').split('-')[0]
        url = f"https://quoizel.quoizelcdn.com/quoizel-image?productId={prefix}{sku_clean}"
        async with session.head(url, timeout=10) as response:
            if response.status == 200:
                content_type = response.headers.get('Content-Type', '')
                if 'image' in content_type:
                    return url
    except:
        pass
    return None

async def fetch_gabby_image(session, sku):
    """Gabby - try Shopify CDN"""
    try:
        sku_clean = sku.replace(' ', '-').upper()
        url = f"https://www.shopgabby.com/products/{sku_clean.lower()}"
        async with session.get(url, timeout=15, headers=HEADERS) as response:
            if response.status == 200:
                html = await response.text()
                match = re.search(r'<meta property="og:image" content="([^"]+)"', html)
                if match:
                    return match.group(1)
    except:
        pass
    return None

async def fetch_bernhardt_image(session, sku):
    """Bernhardt"""
    try:
        url = f"https://www.bernhardt.com/search?q={sku}"
        async with session.get(url, timeout=15, headers=HEADERS) as response:
            if response.status == 200:
                html = await response.text()
                match = re.search(r'"image"\s*:\s*"([^"]+)"', html)
                if match:
                    return match.group(1)
    except:
        pass
    return None

async def fetch_generic_image(session, product_name, vendor, sku):
    """Generic search - try multiple sources"""
    search_terms = [
        f"{vendor} {sku}",
        f"{product_name} {vendor}",
        f"{sku} furniture"
    ]
    
    for term in search_terms:
        try:
            # Try Bing Images
            query = quote_plus(term)
            url = f"https://www.bing.com/images/search?q={query}&first=1"
            async with session.get(url, timeout=10, headers=HEADERS) as response:
                if response.status == 200:
                    html = await response.text()
                    # Find image URLs
                    matches = re.findall(r'murl&quot;:&quot;(https?://[^&]+\.(?:jpg|jpeg|png|webp))', html)
                    if matches:
                        return matches[0]
        except:
            pass
    return None

async def get_image_for_product(session, product):
    """Get image for a single product - try multiple methods"""
    vendor = product.get('vendor', '')
    sku = product.get('sku', '')
    name = product.get('name', '')
    
    image_url = None
    
    # Vendor-specific methods
    if vendor == 'Four Hands':
        image_url = await fetch_four_hands_image(session, sku)
    elif vendor == 'Hudson Valley Lighting':
        sku_num = sku.split('-')[1] if '-' in sku else sku
        image_url = await fetch_quoizel_image(session, sku_num, 'HV')
    elif vendor == 'Mitzi':
        sku_num = sku.split('-')[1] if '-' in sku else sku
        image_url = await fetch_quoizel_image(session, sku_num, 'MT')
    elif vendor == 'Troy Lighting':
        sku_num = sku.split('-')[1] if '-' in sku else sku
        image_url = await fetch_quoizel_image(session, sku_num, 'TL')
    elif vendor == 'Corbett Lighting':
        sku_num = sku.split('-')[1] if '-' in sku else sku
        image_url = await fetch_quoizel_image(session, sku_num, 'CB')
    elif vendor == 'Uttermost':
        image_url = await fetch_quoizel_image(session, sku)
    elif vendor == 'Gabby':
        image_url = await fetch_gabby_image(session, sku)
    elif vendor == 'Bernhardt':
        image_url = await fetch_bernhardt_image(session, sku)
    
    # Fallback to generic search if no vendor-specific image
    if not image_url:
        image_url = await fetch_generic_image(session, name, vendor, sku)
    
    return image_url

async def process_vendor(db, session, vendor, semaphore, batch_size=100):
    """Process all products for a vendor"""
    logger.info(f"\n{'='*60}")
    logger.info(f"PROCESSING: {vendor}")
    logger.info(f"{'='*60}")
    
    # Count products without images
    total_without = await db.master_products.count_documents({
        "vendor": vendor,
        "$or": [{"image_url": ""}, {"image_url": None}, {"image_url": {"$exists": False}}]
    })
    
    logger.info(f"Products without images: {total_without}")
    
    if total_without == 0:
        return 0
    
    updated = 0
    processed = 0
    
    while True:
        # Get batch of products without images
        products = await db.master_products.find({
            "vendor": vendor,
            "$or": [{"image_url": ""}, {"image_url": None}, {"image_url": {"$exists": False}}]
        }).limit(batch_size).to_list(batch_size)
        
        if not products:
            break
        
        for product in products:
            async with semaphore:
                try:
                    image_url = await get_image_for_product(session, product)
                    
                    if image_url:
                        await db.master_products.update_one(
                            {"_id": product["_id"]},
                            {"$set": {"image_url": image_url}}
                        )
                        updated += 1
                        logger.info(f"  ✓ {product['sku']}: Found image")
                    else:
                        # Mark as checked so we don't retry
                        await db.master_products.update_one(
                            {"_id": product["_id"]},
                            {"$set": {"image_url": ""}}
                        )
                    
                    processed += 1
                    if processed % 50 == 0:
                        logger.info(f"  Progress: {processed}/{total_without} ({updated} images found)")
                    
                    await asyncio.sleep(0.3)  # Rate limit
                except Exception as e:
                    logger.error(f"  Error processing {product.get('sku')}: {e}")
    
    logger.info(f"  COMPLETE: {updated}/{processed} images found")
    return updated

async def main():
    """Main function - process ALL vendors"""
    logger.info("="*60)
    logger.info("STARTING AGGRESSIVE IMAGE SCRAPER")
    logger.info("="*60)
    
    db = await get_db()
    
    # Get all vendors
    vendors = await db.master_products.distinct("vendor")
    logger.info(f"Found {len(vendors)} vendors to process")
    
    # Count totals
    total = await db.master_products.count_documents({})
    with_images = await db.master_products.count_documents({"image_url": {"$ne": "", "$exists": True}})
    logger.info(f"Current status: {with_images}/{total} have images")
    
    semaphore = asyncio.Semaphore(10)  # 10 concurrent requests
    
    total_updated = 0
    
    async with aiohttp.ClientSession() as session:
        # Process vendors in order of importance
        priority_vendors = ['Four Hands', 'Hudson Valley Lighting', 'Mitzi', 'Troy Lighting', 
                           'Corbett Lighting', 'Uttermost', 'Gabby', 'Bernhardt', 'Loloi',
                           'Rowe', 'Villa & House', 'Worlds Away', 'Wendy Jane']
        
        for vendor in priority_vendors:
            if vendor in vendors:
                updated = await process_vendor(db, session, vendor, semaphore)
                total_updated += updated
        
        # Process any remaining vendors
        for vendor in vendors:
            if vendor not in priority_vendors:
                updated = await process_vendor(db, session, vendor, semaphore)
                total_updated += updated
    
    # Final count
    with_images = await db.master_products.count_documents({"image_url": {"$ne": "", "$exists": True}})
    total = await db.master_products.count_documents({})
    
    logger.info("\n" + "="*60)
    logger.info("SCRAPING COMPLETE!")
    logger.info(f"Total images found: {total_updated}")
    logger.info(f"Products with images: {with_images}/{total}")
    logger.info("="*60)

if __name__ == "__main__":
    asyncio.run(main())

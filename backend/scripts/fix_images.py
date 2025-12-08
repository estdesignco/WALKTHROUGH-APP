#!/usr/bin/env python3
"""
Product Image URL Fixer Script
Fetches and corrects image URLs for products with missing/broken images
"""
import asyncio
import aiohttp
import json
import re
import logging
from motor.motor_asyncio import AsyncIOMotorClient
from typing import Optional, Dict, List
import time

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('/tmp/image_fixer.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

MONGO_URL = "mongodb://localhost:27017"
DB_NAME = "interior_design_db"

# Rate limiting
REQUESTS_PER_SECOND = 2
DELAY_BETWEEN_REQUESTS = 1.0 / REQUESTS_PER_SECOND


async def fetch_with_retry(session: aiohttp.ClientSession, url: str, max_retries: int = 3) -> Optional[str]:
    """Fetch URL with retry logic"""
    for attempt in range(max_retries):
        try:
            async with session.get(url, timeout=aiohttp.ClientTimeout(total=15)) as response:
                if response.status == 200:
                    return await response.text()
                elif response.status == 404:
                    return None
                else:
                    logger.warning(f"HTTP {response.status} for {url}")
        except asyncio.TimeoutError:
            logger.warning(f"Timeout for {url}, attempt {attempt + 1}")
        except Exception as e:
            logger.warning(f"Error fetching {url}: {e}")
        
        if attempt < max_retries - 1:
            await asyncio.sleep(1)
    
    return None


async def extract_fourhands_image(session: aiohttp.ClientSession, sku: str) -> Optional[str]:
    """Extract image URL from Four Hands product page"""
    url = f"https://www.fourhands.com/product/{sku}"
    
    content = await fetch_with_retry(session, url)
    if not content:
        return None
    
    # Look for CloudFront image URLs in the page JSON data
    patterns = [
        # Primary image pattern - get larger version
        r'"largeUrl":"(https://dd3ka9h4chfr8\.cloudfront\.net[^"]+_PRM_1\.jpg)"',
        r'"thumbUrl":"(https://dd3ka9h4chfr8\.cloudfront\.net[^"]+_PRM_1\.jpg)"',
        # Any CloudFront image
        r'(https://dd3ka9h4chfr8\.cloudfront\.net/image/[^"]+\.jpg)',
    ]
    
    for pattern in patterns:
        match = re.search(pattern, content)
        if match:
            image_url = match.group(1)
            # Clean up URL encoding
            image_url = image_url.replace('\\u0026', '&')
            # Prefer larger images - convert to 800x800 size
            if '-Ro%3a5%2cw%3a200' in image_url:
                image_url = image_url.replace('-Ro%3a5%2cw%3a200%2ch%3a200', '-S800x800')
            return image_url
    
    return None


async def fix_fourhands_images(db, session: aiohttp.ClientSession, batch_size: int = 50):
    """Fix images for Four Hands products"""
    logger.info("=== Starting Four Hands Image Fix ===")
    
    # Get products without images or with placeholder images
    products = await db.master_products.find(
        {
            "vendor": "Four Hands",
            "$or": [
                {"image_url": None},
                {"image_url": ""},
                {"image_url": {"$regex": "pixabay"}}  # Placeholder images
            ]
        },
        {"_id": 0, "id": 1, "sku": 1, "name": 1}
    ).to_list(10000)
    
    logger.info(f"Found {len(products)} Four Hands products needing images")
    
    fixed_count = 0
    failed_count = 0
    
    for i, product in enumerate(products):
        sku = product.get('sku', '')
        if not sku:
            continue
        
        # Rate limiting
        await asyncio.sleep(DELAY_BETWEEN_REQUESTS)
        
        # Try to get image
        image_url = await extract_fourhands_image(session, sku)
        
        if image_url:
            # Update database
            result = await db.master_products.update_one(
                {"id": product['id']},
                {"$set": {"image_url": image_url}}
            )
            if result.modified_count > 0:
                fixed_count += 1
                logger.info(f"[{i+1}/{len(products)}] Fixed: {sku}")
        else:
            failed_count += 1
            if failed_count <= 10:  # Only log first 10 failures
                logger.warning(f"[{i+1}/{len(products)}] No image found: {sku}")
        
        # Progress update every 100 items
        if (i + 1) % 100 == 0:
            logger.info(f"Progress: {i+1}/{len(products)} - Fixed: {fixed_count}, Failed: {failed_count}")
    
    logger.info(f"=== Four Hands Complete: Fixed {fixed_count}, Failed {failed_count} ===")
    return fixed_count


async def fix_bernhardt_images(db, session: aiohttp.ClientSession):
    """
    Fix images for Bernhardt products
    Bernhardt uses their own CDN - we need to construct URLs based on SKU
    """
    logger.info("=== Starting Bernhardt Image Fix ===")
    
    # Get Bernhardt products without images
    products = await db.master_products.find(
        {
            "vendor": "Bernhardt",
            "$or": [{"image_url": None}, {"image_url": ""}]
        },
        {"_id": 0, "id": 1, "sku": 1, "name": 1}
    ).to_list(10000)
    
    logger.info(f"Found {len(products)} Bernhardt products needing images")
    
    # Bernhardt image URL patterns to try
    cdn_patterns = [
        "https://www.bernhardt.com/media/catalog/product/{sku}_main.jpg",
        "https://bernhardt.blob.core.windows.net/product-images/{sku}.jpg",
        "https://bernhardt.blob.core.windows.net/images/{sku}_1.jpg",
    ]
    
    fixed_count = 0
    
    for i, product in enumerate(products):
        sku = product.get('sku', '')
        if not sku:
            continue
        
        # Rate limiting
        await asyncio.sleep(DELAY_BETWEEN_REQUESTS)
        
        # Try each pattern
        found_url = None
        for pattern in cdn_patterns:
            test_url = pattern.format(sku=sku)
            try:
                async with session.head(test_url, timeout=aiohttp.ClientTimeout(total=5)) as response:
                    if response.status == 200:
                        found_url = test_url
                        break
            except:
                continue
        
        if found_url:
            await db.master_products.update_one(
                {"id": product['id']},
                {"$set": {"image_url": found_url}}
            )
            fixed_count += 1
            logger.info(f"[{i+1}/{len(products)}] Fixed Bernhardt: {sku}")
        
        if (i + 1) % 100 == 0:
            logger.info(f"Bernhardt Progress: {i+1}/{len(products)}")
    
    logger.info(f"=== Bernhardt Complete: Fixed {fixed_count} ===")
    return fixed_count


async def verify_image_url(session: aiohttp.ClientSession, url: str) -> bool:
    """Verify that an image URL is actually accessible"""
    if not url:
        return False
    try:
        async with session.head(url, timeout=aiohttp.ClientTimeout(total=5)) as response:
            return response.status == 200
    except:
        return False


async def cleanup_bad_images(db, session: aiohttp.ClientSession):
    """Find and mark products with broken image URLs"""
    logger.info("=== Checking for broken image URLs ===")
    
    # Sample check - verify random images
    sample = await db.master_products.aggregate([
        {"$match": {"image_url": {"$ne": None, "$ne": ""}}},
        {"$sample": {"size": 100}}
    ]).to_list(100)
    
    broken_count = 0
    for product in sample:
        if not await verify_image_url(session, product.get('image_url')):
            broken_count += 1
            logger.warning(f"Broken image: {product.get('sku')} - {product.get('vendor')}")
    
    logger.info(f"Sample check: {broken_count}/100 images broken")


async def get_coverage_report(db) -> Dict:
    """Generate image coverage report"""
    pipeline = [
        {"$group": {
            "_id": "$vendor",
            "total": {"$sum": 1},
            "with_image": {"$sum": {"$cond": [
                {"$and": [
                    {"$ne": ["$image_url", None]}, 
                    {"$ne": ["$image_url", ""]}
                ]}, 
                1, 0
            ]}}
        }},
        {"$sort": {"total": -1}}
    ]
    
    results = await db.master_products.aggregate(pipeline).to_list(100)
    
    report = {}
    for r in results:
        vendor = r["_id"] or "Unknown"
        total = r["total"]
        with_img = r["with_image"]
        pct = round(with_img/total*100, 1) if total > 0 else 0
        report[vendor] = {
            "total": total,
            "with_image": with_img,
            "percentage": pct
        }
    
    return report


async def main():
    """Main function to run image fixes"""
    logger.info("="*50)
    logger.info("Starting Image Fix Script")
    logger.info("="*50)
    
    # Connect to MongoDB
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    
    # Initial coverage report
    logger.info("\n=== INITIAL COVERAGE ===")
    report = await get_coverage_report(db)
    total_products = sum(r["total"] for r in report.values())
    total_with_images = sum(r["with_image"] for r in report.values())
    logger.info(f"Overall: {total_with_images}/{total_products} ({round(total_with_images/total_products*100, 1)}%)")
    
    for vendor, data in sorted(report.items(), key=lambda x: x[1]["total"], reverse=True):
        status = "✅" if data["percentage"] >= 90 else "⚠️" if data["percentage"] >= 50 else "❌"
        logger.info(f"{status} {vendor}: {data['with_image']}/{data['total']} ({data['percentage']}%)")
    
    # Create aiohttp session
    connector = aiohttp.TCPConnector(limit=10)
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    }
    
    async with aiohttp.ClientSession(connector=connector, headers=headers) as session:
        # Fix Four Hands images
        fh_fixed = await fix_fourhands_images(db, session)
        
        # Don't fix Bernhardt for now - their CDN patterns are unclear
        # bh_fixed = await fix_bernhardt_images(db, session)
    
    # Final coverage report
    logger.info("\n=== FINAL COVERAGE ===")
    report = await get_coverage_report(db)
    total_products = sum(r["total"] for r in report.values())
    total_with_images = sum(r["with_image"] for r in report.values())
    logger.info(f"Overall: {total_with_images}/{total_products} ({round(total_with_images/total_products*100, 1)}%)")
    
    for vendor, data in sorted(report.items(), key=lambda x: x[1]["total"], reverse=True):
        status = "✅" if data["percentage"] >= 90 else "⚠️" if data["percentage"] >= 50 else "❌"
        logger.info(f"{status} {vendor}: {data['with_image']}/{data['total']} ({data['percentage']}%)")
    
    client.close()
    logger.info("="*50)
    logger.info("Image Fix Script Complete")
    logger.info("="*50)


if __name__ == "__main__":
    asyncio.run(main())

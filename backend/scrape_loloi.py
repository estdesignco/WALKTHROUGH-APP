"""
Loloi Image Scraper - Uses Shopify products.json API
"""
import asyncio
import aiohttp
import json
import logging
from motor.motor_asyncio import AsyncIOMotorClient
from pathlib import Path
import os
import re

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(message)s')
logger = logging.getLogger(__name__)

MONGO_URL = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
DB_NAME = 'interior_design_db'
DATA_DIR = Path('/app/backend/data/products')

HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
    'Accept': 'application/json',
}

async def get_db():
    client = AsyncIOMotorClient(MONGO_URL)
    return client[DB_NAME]

async def fetch_collection_products(session, collection_name):
    """Fetch products from a Loloi collection via Shopify API"""
    try:
        # Try collection products.json endpoint
        url = f"https://www.loloirugs.com/collections/{collection_name.lower()}/products.json?limit=250"
        async with session.get(url, headers=HEADERS, timeout=15) as r:
            if r.status == 200:
                data = await r.json()
                products = data.get('products', [])
                
                # Extract image URLs keyed by product code
                images = {}
                for p in products:
                    title = p.get('title', '')
                    # Title format: "ADE-01 IVORY / NATURAL"
                    code_match = re.match(r'^([A-Z]{2,4}-\d{2})', title)
                    if code_match:
                        code = code_match.group(1)
                        imgs = p.get('images', [])
                        if imgs:
                            images[code] = imgs[0].get('src', '')
                
                return images
    except Exception as e:
        logger.debug(f"Error fetching {collection_name}: {e}")
    return {}

async def main():
    logger.info('🚀 LOLOI IMAGE SCRAPER')
    logger.info('Using Shopify products.json API')
    logger.info('='*60)
    
    db = await get_db()
    
    # Get all Loloi products
    products = await db.master_products.find({'vendor': 'Loloi'}).to_list(10000)
    logger.info(f'Found {len(products)} Loloi products in database')
    
    # Extract unique collection names
    collections = set()
    for p in products:
        name = p.get('name', '')
        if name:
            collection = name.split()[0].upper()
            collections.add(collection)
    
    logger.info(f'Found {len(collections)} unique collections to fetch')
    
    # Build image lookup from all collections
    all_images = {}
    
    async with aiohttp.ClientSession() as session:
        for i, collection in enumerate(sorted(collections)):
            logger.info(f'  Fetching {collection} ({i+1}/{len(collections)})...')
            images = await fetch_collection_products(session, collection)
            all_images.update(images)
            
            if images:
                logger.info(f'    Found {len(images)} images')
            
            await asyncio.sleep(0.5)  # Rate limiting
    
    logger.info(f'\nTotal images found: {len(all_images)}')
    
    # Update products in database
    updated = 0
    for p in products:
        sku = p.get('sku', '')
        name = p.get('name', '')
        
        # Extract collection code from SKU (e.g., ADE from ADE-2-0x3-0)
        code_match = re.match(r'^([A-Z]{2,4})', sku)
        if code_match:
            collection_code = code_match.group(1)
            
            # Look for matching image (try different patterns)
            for code, img_url in all_images.items():
                if code.startswith(collection_code):
                    if not p.get('image_url'):
                        await db.master_products.update_one(
                            {'_id': p['_id']},
                            {'$set': {'image_url': img_url}}
                        )
                        updated += 1
                    break
    
    logger.info(f'✅ Updated {updated} Loloi products with images')
    
    # Save to JSON
    products = await db.master_products.find({'vendor': 'Loloi'}, {'_id': 0}).to_list(10000)
    with open(DATA_DIR / 'loloi.json', 'w') as f:
        json.dump(products, f, indent=2, default=str)
    logger.info(f'💾 Saved to loloi.json')
    
    # Final count
    with_img = sum(1 for p in products if p.get('image_url'))
    logger.info(f'Final: {with_img}/{len(products)} Loloi products have images')

if __name__ == '__main__':
    asyncio.run(main())

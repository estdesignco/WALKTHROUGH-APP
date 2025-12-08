"""
Rowe Furniture Image Scraper
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
    'Accept': 'text/html,application/xhtml+xml',
}

async def get_db():
    client = AsyncIOMotorClient(MONGO_URL)
    return client[DB_NAME]

async def search_rowe_images(session, search_term):
    """Search Rowe website for images"""
    try:
        url = f"https://www.rowefurniture.com/search?q={search_term}"
        async with session.get(url, headers=HEADERS, timeout=15) as r:
            if r.status == 200:
                html = await r.text()
                # Find all Azure blob images
                images = re.findall(r'https://rffblob\.blob\.core\.windows\.net/rffblobcontainer/[^"]+_350\.(?:jpg|jpeg|png)', html)
                return list(set(images))
    except Exception as e:
        logger.debug(f"Error searching {search_term}: {e}")
    return []

async def main():
    logger.info('🚀 ROWE IMAGE SCRAPER')
    logger.info('='*60)
    
    db = await get_db()
    
    # Get Rowe products missing images
    products = await db.master_products.find({
        'vendor': 'Rowe',
        '$or': [{'image_url': ''}, {'image_url': None}]
    }).to_list(10000)
    
    logger.info(f'Found {len(products)} Rowe products needing images')
    
    # Extract unique collection/model names
    collections = set()
    for p in products:
        sku = p.get('sku', '')
        name = p.get('name', '')
        
        # Try to extract collection name from SKU (e.g., LILAH from LILAH-585)
        if '-' in sku:
            collection = sku.split('-')[0]
            if collection.isalpha():
                collections.add(collection)
        
        # Also try from name
        if name:
            words = name.replace('Rowe ', '').split()
            if words and words[0].isalpha():
                collections.add(words[0].upper())
    
    logger.info(f'Found {len(collections)} unique collections to search')
    
    # Search for each collection and build image lookup
    all_images = {}
    
    async with aiohttp.ClientSession() as session:
        for i, collection in enumerate(sorted(collections)):
            logger.info(f'  Searching {collection} ({i+1}/{len(collections)})...')
            images = await search_rowe_images(session, collection)
            
            if images:
                logger.info(f'    Found {len(images)} images')
                for img in images:
                    # Map this image to the collection
                    all_images[collection] = img
            
            await asyncio.sleep(0.5)
    
    # Update products
    updated = 0
    for p in products:
        sku = p.get('sku', '')
        collection = sku.split('-')[0] if '-' in sku else sku
        
        if collection in all_images and not p.get('image_url'):
            await db.master_products.update_one(
                {'_id': p['_id']},
                {'$set': {'image_url': all_images[collection]}}
            )
            updated += 1
    
    logger.info(f'✅ Updated {updated} Rowe products')
    
    # Save to JSON
    products = await db.master_products.find({'vendor': 'Rowe'}, {'_id': 0}).to_list(10000)
    with open(DATA_DIR / 'rowe.json', 'w') as f:
        json.dump(products, f, indent=2, default=str)
    
    with_img = sum(1 for p in products if p.get('image_url'))
    logger.info(f'Final: {with_img}/{len(products)} Rowe products have images')

if __name__ == '__main__':
    asyncio.run(main())

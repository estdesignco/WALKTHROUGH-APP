"""
Scrape images for remaining vendors: Four Hands, Rowe, Loloi, Bernhardt
"""
import asyncio
import aiohttp
import re
import json
import logging
from motor.motor_asyncio import AsyncIOMotorClient
from pathlib import Path
import os

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(message)s')
logger = logging.getLogger(__name__)

MONGO_URL = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
DB_NAME = 'interior_design_db'
DATA_DIR = Path('/app/backend/data/products')

HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
}

async def get_db():
    client = AsyncIOMotorClient(MONGO_URL)
    return client[DB_NAME]

async def scrape_four_hands_image(session, sku):
    """Scrape Four Hands product page to get CloudFront image URL"""
    try:
        url = f"https://www.fourhands.com/product/{sku}"
        async with session.get(url, headers=HEADERS, timeout=15) as r:
            if r.status == 200:
                html = await r.text()
                # Find CloudFront image URL in the page
                match = re.search(r'(https://dd3ka9h4chfr8\.cloudfront\.net/[^"]+_PRM_1\.jpg)', html)
                if match:
                    # Get the large version
                    img_url = match.group(1)
                    # Convert to large size
                    large_url = re.sub(r'-Ro[^-]+-FJPG', '-S1200x1200-FJPG', img_url)
                    return large_url
    except Exception as e:
        pass
    return None

async def scrape_rowe_image(session, sku, name):
    """Search Rowe website for product image"""
    try:
        search_url = f"https://www.rowefurniture.com/search?q={sku}"
        async with session.get(search_url, headers=HEADERS, timeout=15) as r:
            if r.status == 200:
                html = await r.text()
                # Find Azure blob image URL containing the SKU
                sku_pattern = sku.replace('-', '[-_]?')
                match = re.search(rf'(https://rffblob\.blob\.core\.windows\.net/rffblobcontainer/[^"]*{sku_pattern}[^"]*\.(?:jpg|jpeg|png))', html, re.I)
                if match:
                    return match.group(1)
                # Try any image from search results
                match = re.search(r'(https://rffblob\.blob\.core\.windows\.net/rffblobcontainer/[^"]+_350\.(?:jpg|jpeg|png))', html)
                if match:
                    return match.group(1)
    except Exception as e:
        pass
    return None

async def scrape_loloi_image(session, sku, name):
    """Search Loloi for rug images"""
    try:
        # Extract collection name from the sku (e.g., "ADE" from "ADE-2-0x3-0")
        collection_code = sku.split('-')[0] if '-' in sku else sku[:3]
        collection_name = name.split()[0].lower() if name else collection_code.lower()
        
        # Try the collection page
        search_url = f"https://www.loloirugs.com/search?q={collection_name}"
        async with session.get(search_url, headers=HEADERS, timeout=15) as r:
            if r.status == 200:
                html = await r.text()
                # Find Shopify CDN images
                match = re.search(r'(https://cdn\.shopify\.com/s/files/[^"]+\.(?:jpg|png|webp))', html)
                if match:
                    return match.group(1)
    except Exception as e:
        pass
    return None

async def process_vendor(db, session, vendor, scrape_func, limit=500):
    """Process a vendor using the specified scrape function"""
    logger.info(f"\n{'='*60}\n📦 PROCESSING: {vendor}\n{'='*60}")
    
    products = await db.master_products.find({
        'vendor': vendor,
        '$or': [{'image_url': ''}, {'image_url': None}, {'image_url': {'$exists': False}}]
    }).limit(limit).to_list(limit)
    
    if not products:
        logger.info('✅ All products already have images')
        return 0
    
    logger.info(f'🔍 Found {len(products)} products needing images')
    
    updated = 0
    semaphore = asyncio.Semaphore(5)
    
    async def process_one(p):
        nonlocal updated
        async with semaphore:
            img = await scrape_func(session, p['sku'], p.get('name', ''))
            if img:
                await db.master_products.update_one({'_id': p['_id']}, {'$set': {'image_url': img}})
                updated += 1
            await asyncio.sleep(0.3)
    
    batch_size = 20
    for i in range(0, len(products), batch_size):
        batch = products[i:i+batch_size]
        await asyncio.gather(*[process_one(p) for p in batch])
        logger.info(f'  Processed {min(i+batch_size, len(products))}/{len(products)} - Found {updated} images')
    
    return updated

async def save_vendor_json(db, vendor):
    """Save vendor data to JSON"""
    products = await db.master_products.find({'vendor': vendor}, {'_id': 0}).to_list(50000)
    filename = vendor.lower().replace(' ', '_').replace('&', 'and') + '.json'
    with open(DATA_DIR / filename, 'w') as f:
        json.dump(products, f, indent=2, default=str)
    logger.info(f'💾 Saved {len(products)} products to {filename}')

async def main():
    logger.info('🚀 SCRAPING REMAINING VENDOR IMAGES')
    
    db = await get_db()
    
    async with aiohttp.ClientSession() as session:
        # Four Hands - scrape from product pages
        updated = await process_vendor(db, session, 'Four Hands', 
            lambda s, sku, name: scrape_four_hands_image(s, sku), limit=1000)
        logger.info(f'✅ Four Hands: {updated} new images')
        await save_vendor_json(db, 'Four Hands')
        
        # Rowe - search their website
        updated = await process_vendor(db, session, 'Rowe',
            lambda s, sku, name: scrape_rowe_image(s, sku, name), limit=500)
        logger.info(f'✅ Rowe: {updated} new images')
        await save_vendor_json(db, 'Rowe')
        
        # Loloi - search their website  
        updated = await process_vendor(db, session, 'Loloi',
            lambda s, sku, name: scrape_loloi_image(s, sku, name), limit=500)
        logger.info(f'✅ Loloi: {updated} new images')
        await save_vendor_json(db, 'Loloi')
    
    # Final stats
    pipeline = [
        {'$group': {
            '_id': '$vendor',
            'total': {'$sum': 1},
            'with_image': {'$sum': {'$cond': [{'$and': [{'$ne': ['$image_url', '']}, {'$ne': ['$image_url', None]}]}, 1, 0]}}
        }},
        {'$sort': {'total': -1}}
    ]
    results = await db.master_products.aggregate(pipeline).to_list(50)
    
    logger.info('\n' + '='*60)
    logger.info('📊 FINAL IMAGE COVERAGE')
    logger.info('='*60)
    total_p, total_i = 0, 0
    for r in results:
        pct = 100*r['with_image']/r['total'] if r['total'] > 0 else 0
        logger.info(f"{r['_id']:<25} {r['with_image']:>5}/{r['total']:<5} {pct:>6.1f}%")
        total_p += r['total']
        total_i += r['with_image']
    logger.info('='*60)
    logger.info(f"{'TOTAL':<25} {total_i:>5}/{total_p:<5} {100*total_i/total_p:>6.1f}%")

if __name__ == '__main__':
    asyncio.run(main())

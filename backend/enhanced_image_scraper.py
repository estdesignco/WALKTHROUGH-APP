"""
Enhanced Image Scraper - Multiple strategies to get product images
Strategy 1: Direct vendor website scraping
Strategy 2: Google/Bing image search
Strategy 3: Known CDN patterns
"""
import asyncio
import aiohttp
import re
import json
import logging
from motor.motor_asyncio import AsyncIOMotorClient
from pathlib import Path
import os
from urllib.parse import quote_plus

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(message)s')
logger = logging.getLogger(__name__)

MONGO_URL = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
DB_NAME = os.environ.get('DB_NAME', 'interior_design_db')
DATA_DIR = Path(__file__).parent / 'data' / 'products'

HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9',
    'Accept-Encoding': 'gzip, deflate, br',
    'Connection': 'keep-alive',
    'Upgrade-Insecure-Requests': '1',
}

async def get_db():
    client = AsyncIOMotorClient(MONGO_URL)
    return client[DB_NAME]

async def search_bing_images(session, query, num_results=1):
    """Search Bing for product images"""
    try:
        search_query = quote_plus(query)
        url = f"https://www.bing.com/images/search?q={search_query}&first=1"
        
        async with session.get(url, headers=HEADERS, timeout=10) as r:
            if r.status == 200:
                html = await r.text()
                # Find image URLs in Bing results
                # Pattern for murl (main URL) in Bing image results
                matches = re.findall(r'"murl":"(https?://[^"]+\.(?:jpg|jpeg|png|webp))"', html)
                if matches:
                    # Filter out tiny images and icons
                    for img in matches[:5]:
                        if 'icon' not in img.lower() and 'logo' not in img.lower():
                            return img
    except Exception as e:
        logger.debug(f"Bing search error: {e}")
    return None

async def search_google_images(session, query):
    """Search Google for product images"""
    try:
        search_query = quote_plus(query)
        url = f"https://www.google.com/search?q={search_query}&tbm=isch"
        
        async with session.get(url, headers=HEADERS, timeout=10) as r:
            if r.status == 200:
                html = await r.text()
                # Find image URLs in Google results
                matches = re.findall(r'"(https://[^"]+\.(?:jpg|jpeg|png|webp)[^"]*)"', html)
                for img in matches[:10]:
                    if 'google' not in img.lower() and 'gstatic' not in img.lower():
                        if 'icon' not in img.lower() and 'logo' not in img.lower():
                            return img
    except Exception as e:
        logger.debug(f"Google search error: {e}")
    return None

async def get_image_for_product(session, product):
    """Try multiple strategies to find product image"""
    vendor = product.get('vendor', '')
    sku = product.get('sku', '')
    name = product.get('name', '')
    
    # Build search queries
    queries = [
        f"{vendor} {sku} product",
        f"{vendor} {name}",
        f"{sku} {vendor} furniture",
    ]
    
    # Try Bing first (usually better for product images)
    for query in queries:
        img = await search_bing_images(session, query)
        if img:
            return img
        await asyncio.sleep(0.5)
    
    # Fallback to Google
    for query in queries[:1]:
        img = await search_google_images(session, query)
        if img:
            return img
        await asyncio.sleep(0.5)
    
    return None

async def process_vendor(db, session, vendor, limit=200):
    """Process products for a vendor that's missing images"""
    logger.info(f"\n{'='*60}\n📦 PROCESSING: {vendor}\n{'='*60}")
    
    # Find products without images
    products = await db.master_products.find({
        'vendor': vendor,
        '$or': [
            {'image_url': ''},
            {'image_url': None},
            {'image_url': {'$exists': False}}
        ]
    }).limit(limit).to_list(limit)
    
    if not products:
        logger.info('✅ All products already have images')
        return 0
    
    logger.info(f'🔍 Found {len(products)} products needing images')
    
    updated = 0
    semaphore = asyncio.Semaphore(2)  # Very conservative rate limiting
    
    async def process_one(p):
        nonlocal updated
        async with semaphore:
            img = await get_image_for_product(session, p)
            
            if img:
                await db.master_products.update_one(
                    {'_id': p['_id']}, 
                    {'$set': {'image_url': img}}
                )
                updated += 1
                logger.info(f'✓ {p["sku"]} - Found image')
            
            await asyncio.sleep(1)  # Rate limiting between requests
    
    # Process in small batches
    batch_size = 10
    for i in range(0, len(products), batch_size):
        batch = products[i:i+batch_size]
        await asyncio.gather(*[process_one(p) for p in batch])
        logger.info(f'  Processed {min(i+batch_size, len(products))}/{len(products)}...')
    
    logger.info(f'📊 Updated {updated}/{len(products)} products')
    return updated

async def save_vendor_to_json(db, vendor):
    """Save vendor products to JSON file"""
    products = await db.master_products.find(
        {'vendor': vendor}, 
        {'_id': 0}
    ).to_list(50000)
    
    if not products:
        return
    
    filename = vendor.lower().replace(' ', '_').replace('&', 'and') + '.json'
    filepath = DATA_DIR / filename
    
    with open(filepath, 'w') as f:
        json.dump(products, f, indent=2, default=str)
    
    logger.info(f'💾 Saved {len(products)} products to {filename}')

async def main():
    """Main function - focus on vendors missing images"""
    logger.info('🚀 ENHANCED IMAGE SCRAPER - Using Web Search')
    logger.info('='*60)
    
    db = await get_db()
    
    # Vendors that need images (Four Hands already has most)
    vendors_needing_images = [
        'Uttermost', 'Gabby', 'Bernhardt', 'Loloi', 'Rowe',
        'Villa & House', 'Wendy Jane', 'Bassett Mirror'
    ]
    
    total_updated = 0
    
    async with aiohttp.ClientSession() as session:
        for vendor in vendors_needing_images:
            try:
                updated = await process_vendor(db, session, vendor, limit=100)
                total_updated += updated
                
                # Save to JSON after each vendor
                await save_vendor_to_json(db, vendor)
                
            except Exception as e:
                logger.error(f'❌ Error with {vendor}: {e}')
    
    # Final stats
    with_images = await db.master_products.count_documents({'image_url': {'$ne': '', '$ne': None}})
    total = await db.master_products.count_documents({})
    
    logger.info('\n' + '='*60)
    logger.info('📊 FINAL STATISTICS')
    logger.info('='*60)
    logger.info(f'   Total Updated This Run: {total_updated}')
    logger.info(f'   Total With Images: {with_images}/{total} ({100*with_images/total:.1f}%)')
    logger.info('='*60)

if __name__ == '__main__':
    asyncio.run(main())

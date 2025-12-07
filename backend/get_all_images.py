"""
Aggressive Image Scraper - Get ALL product images from multiple sources
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
}

async def get_db():
    client = AsyncIOMotorClient(MONGO_URL)
    return client[DB_NAME]

async def fetch_four_hands(session, sku):
    try:
        url = f"https://www.fourhands.com/product/{sku}"
        async with session.get(url, timeout=15, headers=HEADERS) as r:
            if r.status == 200:
                html = await r.text()
                m = re.search(r'<meta property="og:image" content="([^"]+)"', html)
                if m: return m.group(1)
    except: pass
    return None

async def fetch_uttermost(session, sku):
    try:
        sku_clean = sku.replace('*', '').strip()
        url = f"https://quoizel.quoizelcdn.com/quoizel-image?productId={sku_clean}"
        async with session.head(url, timeout=8) as r:
            if r.status == 200: return url
    except: pass
    return None

async def fetch_worlds_away(session, sku):
    try:
        sku_clean = sku.upper().strip()
        url = f"https://quoizel.quoizelcdn.com/quoizel-image?productId={sku_clean}"
        async with session.head(url, timeout=8) as r:
            if r.status == 200: return url
    except: pass
    return None

async def fetch_gabby(session, sku, name):
    try:
        # Try Gabby website search
        url = f"https://www.shopgabby.com/search?q={sku}"
        async with session.get(url, timeout=15, headers=HEADERS) as r:
            if r.status == 200:
                html = await r.text()
                m = re.search(r'"image"\s*:\s*"(https://[^"]+)"', html)
                if m: return m.group(1)
    except: pass
    return None

async def fetch_loloi(session, sku, name):
    try:
        # Loloi CDN pattern
        collection = name.split()[0].upper() if name else ''
        url = f"https://cdn.shopify.com/s/files/1/0558/8310/8905/products/{collection}.jpg"
        async with session.head(url, timeout=8) as r:
            if r.status == 200: return url
    except: pass
    return None

async def fetch_bernhardt(session, sku):
    try:
        # Bernhardt website
        url = f"https://www.bernhardt.com/product/{sku}"
        async with session.get(url, timeout=15, headers=HEADERS) as r:
            if r.status == 200:
                html = await r.text()
                m = re.search(r'<meta property="og:image" content="([^"]+)"', html)
                if m: return m.group(1)
    except: pass
    return None

async def fetch_rowe(session, sku, name):
    try:
        # Rowe furniture website
        url = f"https://www.rowefurniture.com/search?q={sku}"
        async with session.get(url, timeout=15, headers=HEADERS) as r:
            if r.status == 200:
                html = await r.text()
                m = re.search(r'"image"\s*:\s*"(https://[^"]+)"', html)
                if m: return m.group(1)
    except: pass
    return None

async def fetch_generic(session, name, vendor, sku):
    """Fallback: search Google/Bing for product image"""
    try:
        query = quote_plus(f"{vendor} {sku} product")
        url = f"https://www.google.com/search?q={query}&tbm=isch"
        async with session.get(url, timeout=10, headers=HEADERS) as r:
            if r.status == 200:
                html = await r.text()
                matches = re.findall(r'"(https://[^"]+\.(?:jpg|jpeg|png|webp))"', html)
                for img in matches[:5]:
                    if 'google' not in img.lower() and 'gstatic' not in img.lower():
                        return img
    except: pass
    return None

async def get_image(session, product):
    vendor = product.get('vendor', '')
    sku = product.get('sku', '')
    name = product.get('name', '')
    
    if vendor == 'Four Hands':
        return await fetch_four_hands(session, sku)
    elif vendor in ['Uttermost', 'Uttermost Additional']:
        return await fetch_uttermost(session, sku)
    elif vendor == 'Worlds Away':
        return await fetch_worlds_away(session, sku)
    elif vendor == 'Gabby':
        return await fetch_gabby(session, sku, name)
    elif vendor == 'Loloi':
        return await fetch_loloi(session, sku, name)
    elif vendor == 'Bernhardt':
        return await fetch_bernhardt(session, sku)
    elif vendor == 'Rowe':
        return await fetch_rowe(session, sku, name)
    else:
        return await fetch_generic(session, name, vendor, sku)

async def process_vendor(db, session, vendor, limit=500):
    logger.info(f"\n{'='*50}\nPROCESSING: {vendor}\n{'='*50}")
    
    products = await db.master_products.find({
        'vendor': vendor,
        '$or': [{'image_url': ''}, {'image_url': None}, {'image_url': {'$exists': False}}]
    }).limit(limit).to_list(limit)
    
    if not products:
        logger.info('No products without images')
        return 0
    
    logger.info(f'Found {len(products)} products to process')
    
    updated = 0
    semaphore = asyncio.Semaphore(10)
    
    async def process_one(p):
        nonlocal updated
        async with semaphore:
            img = await get_image(session, p)
            if img:
                await db.master_products.update_one({'_id': p['_id']}, {'$set': {'image_url': img}})
                updated += 1
                logger.info(f'✓ {p["sku"]}')
            await asyncio.sleep(0.2)
    
    await asyncio.gather(*[process_one(p) for p in products])
    
    logger.info(f'Found {updated}/{len(products)} images')
    return updated

async def main():
    logger.info('STARTING IMAGE SCRAPER')
    db = await get_db()
    
    vendors = ['Four Hands', 'Uttermost', 'Worlds Away', 'Gabby', 'Bernhardt', 
               'Loloi', 'Rowe', 'Villa & House', 'Wendy Jane', 'Hudson Valley Lighting',
               'Mitzi', 'Troy Lighting', 'Corbett Lighting']
    
    total = 0
    async with aiohttp.ClientSession() as session:
        for vendor in vendors:
            try:
                updated = await process_vendor(db, session, vendor, limit=1000)
                total += updated
            except Exception as e:
                logger.error(f'Error with {vendor}: {e}')
    
    w = await db.master_products.count_documents({'image_url': {'$ne': ''}})
    t = await db.master_products.count_documents({})
    logger.info(f'\nTOTAL: {w}/{t} have images')

if __name__ == '__main__':
    asyncio.run(main())

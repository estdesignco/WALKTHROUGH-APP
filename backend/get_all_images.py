"""
Complete Product Scraper - Get IMAGE, SIZE, and PRODUCT LINK for all products
This creates a complete catalog so you don't have to search vendor sites!
"""
import asyncio
import aiohttp
import re
import json
import logging
from motor.motor_asyncio import AsyncIOMotorClient
import os
from urllib.parse import quote_plus
from pathlib import Path

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(message)s')
logger = logging.getLogger(__name__)

MONGO_URL = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
DB_NAME = os.environ.get('DB_NAME', 'interior_design_db')
DATA_DIR = Path(__file__).parent / 'data' / 'products'

HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9',
    'Accept-Encoding': 'gzip, deflate, br',
    'Connection': 'keep-alive',
}

async def get_db():
    client = AsyncIOMotorClient(MONGO_URL)
    return client[DB_NAME]

# =============================================================================
# FOUR HANDS - fourhands.com
# =============================================================================
async def fetch_four_hands(session, sku, name):
    """Scrape Four Hands product page for image, size, and link"""
    result = {'image_url': None, 'product_link': None, 'dimensions': None}
    try:
        url = f"https://www.fourhands.com/product/{sku}"
        async with session.get(url, timeout=20, headers=HEADERS) as r:
            if r.status == 200:
                html = await r.text()
                result['product_link'] = url
                
                # Get image from og:image meta tag
                m = re.search(r'<meta property="og:image" content="([^"]+)"', html)
                if m:
                    result['image_url'] = m.group(1)
                
                # Get dimensions - look for patterns like "W: 24" H: 36" D: 18""
                dim_match = re.search(r'(?:Dimensions?|Size)[:\s]*([^<\n]+?)(?:</|<br|\n)', html, re.I)
                if dim_match:
                    result['dimensions'] = dim_match.group(1).strip()
                else:
                    # Try pattern W x H x D
                    dim_match = re.search(r'(\d+(?:\.\d+)?["\']?\s*[xX×]\s*\d+(?:\.\d+)?["\']?\s*(?:[xX×]\s*\d+(?:\.\d+)?["\']?)?)', html)
                    if dim_match:
                        result['dimensions'] = dim_match.group(1).strip()
    except Exception as e:
        logger.debug(f"Four Hands error {sku}: {e}")
    return result

# =============================================================================
# UTTERMOST & QUOIZEL BRANDS (Uttermost, Worlds Away, Hudson Valley, Mitzi, Troy, Corbett)
# =============================================================================
async def fetch_quoizel_brand(session, sku, vendor):
    """Scrape Quoizel-family brands"""
    result = {'image_url': None, 'product_link': None, 'dimensions': None}
    try:
        sku_clean = sku.replace('*', '').strip().upper()
        
        # Image URL pattern for Quoizel CDN
        img_url = f"https://quoizel.quoizelcdn.com/quoizel-image?productId={sku_clean}"
        async with session.head(img_url, timeout=8) as r:
            if r.status == 200:
                result['image_url'] = img_url
        
        # Try to find product page
        vendor_urls = {
            'Uttermost': f"https://www.quoizel.com/search?q={sku_clean}",
            'Hudson Valley Lighting': f"https://www.quoizel.com/search?q={sku_clean}",
            'Mitzi': f"https://www.quoizel.com/search?q={sku_clean}",
            'Troy Lighting': f"https://www.quoizel.com/search?q={sku_clean}",
            'Corbett Lighting': f"https://www.quoizel.com/search?q={sku_clean}",
            'Worlds Away': f"https://www.quoizel.com/search?q={sku_clean}",
        }
        
        search_url = vendor_urls.get(vendor, f"https://www.quoizel.com/search?q={sku_clean}")
        result['product_link'] = search_url
        
        # Try to get dimensions from product page
        async with session.get(search_url, timeout=15, headers=HEADERS) as r:
            if r.status == 200:
                html = await r.text()
                # Look for dimensions
                dim_match = re.search(r'(?:Dimensions?|Size)[:\s]*([^<\n]+?)(?:</|<br|\n)', html, re.I)
                if dim_match:
                    result['dimensions'] = dim_match.group(1).strip()
                    
    except Exception as e:
        logger.debug(f"Quoizel brand error {sku}: {e}")
    return result

# =============================================================================
# GABBY - shopgabby.com
# =============================================================================
async def fetch_gabby(session, sku, name):
    """Scrape Gabby product page"""
    result = {'image_url': None, 'product_link': None, 'dimensions': None}
    try:
        search_url = f"https://www.shopgabby.com/search?q={sku}"
        async with session.get(search_url, timeout=15, headers=HEADERS) as r:
            if r.status == 200:
                html = await r.text()
                
                # Find product link
                link_match = re.search(r'href="(/products/[^"]+)"', html)
                if link_match:
                    result['product_link'] = f"https://www.shopgabby.com{link_match.group(1)}"
                else:
                    result['product_link'] = search_url
                
                # Find image
                img_match = re.search(r'"image"\s*:\s*"(https://[^"]+)"', html)
                if img_match:
                    result['image_url'] = img_match.group(1)
                
                # Find dimensions
                dim_match = re.search(r'(\d+(?:\.\d+)?["\']?\s*[Ww]\s*[xX×]\s*\d+(?:\.\d+)?["\']?\s*[Hh])', html)
                if dim_match:
                    result['dimensions'] = dim_match.group(1)
                    
    except Exception as e:
        logger.debug(f"Gabby error {sku}: {e}")
    return result

# =============================================================================
# LOLOI RUGS - loloirugs.com
# =============================================================================
async def fetch_loloi(session, sku, name):
    """Scrape Loloi rugs"""
    result = {'image_url': None, 'product_link': None, 'dimensions': None}
    try:
        # Loloi product URL pattern
        sku_slug = sku.lower().replace(' ', '-').replace('/', '-')
        url = f"https://www.loloirugs.com/products/{sku_slug}"
        
        async with session.get(url, timeout=15, headers=HEADERS) as r:
            if r.status == 200:
                html = await r.text()
                result['product_link'] = url
                
                # Get image
                img_match = re.search(r'<meta property="og:image" content="([^"]+)"', html)
                if img_match:
                    result['image_url'] = img_match.group(1)
                
                # Get rug sizes - usually in format like "2'-0" x 3'-0""
                size_match = re.search(r'(\d+\'-\d+"\s*x\s*\d+\'-\d+")', html)
                if size_match:
                    result['dimensions'] = size_match.group(1)
            else:
                # Try search
                search_url = f"https://www.loloirugs.com/search?q={sku}"
                result['product_link'] = search_url
                
    except Exception as e:
        logger.debug(f"Loloi error {sku}: {e}")
    return result

# =============================================================================
# BERNHARDT - bernhardt.com
# =============================================================================
async def fetch_bernhardt(session, sku, name):
    """Scrape Bernhardt product page"""
    result = {'image_url': None, 'product_link': None, 'dimensions': None}
    try:
        url = f"https://www.bernhardt.com/search?q={sku}"
        async with session.get(url, timeout=15, headers=HEADERS) as r:
            if r.status == 200:
                html = await r.text()
                
                # Find product link
                link_match = re.search(r'href="(/product/[^"]+)"', html)
                if link_match:
                    result['product_link'] = f"https://www.bernhardt.com{link_match.group(1)}"
                else:
                    result['product_link'] = url
                
                # Get image from og:image
                img_match = re.search(r'<meta property="og:image" content="([^"]+)"', html)
                if img_match:
                    result['image_url'] = img_match.group(1)
                
                # Get dimensions
                dim_match = re.search(r'(?:Dimensions?)[:\s]*([^<\n]+?)(?:</|<br|\n)', html, re.I)
                if dim_match:
                    result['dimensions'] = dim_match.group(1).strip()
                    
    except Exception as e:
        logger.debug(f"Bernhardt error {sku}: {e}")
    return result

# =============================================================================
# ROWE FURNITURE - rowefurniture.com
# =============================================================================
async def fetch_rowe(session, sku, name):
    """Scrape Rowe Furniture product page"""
    result = {'image_url': None, 'product_link': None, 'dimensions': None}
    try:
        url = f"https://www.rowefurniture.com/search?q={sku}"
        async with session.get(url, timeout=15, headers=HEADERS) as r:
            if r.status == 200:
                html = await r.text()
                result['product_link'] = url
                
                # Find image
                img_match = re.search(r'"image"\s*:\s*"(https://[^"]+)"', html)
                if img_match:
                    result['image_url'] = img_match.group(1)
                
                # Find dimensions
                dim_match = re.search(r'(\d+(?:\.\d+)?["\']?\s*[Ww]?\s*[xX×]\s*\d+(?:\.\d+)?["\']?\s*[Hh]?\s*[xX×]?\s*\d*(?:\.\d+)?["\']?\s*[Dd]?)', html)
                if dim_match:
                    result['dimensions'] = dim_match.group(1).strip()
                    
    except Exception as e:
        logger.debug(f"Rowe error {sku}: {e}")
    return result

# =============================================================================
# VILLA & HOUSE - villaandhouse.com
# =============================================================================
async def fetch_villa_house(session, sku, name):
    """Scrape Villa & House"""
    result = {'image_url': None, 'product_link': None, 'dimensions': None}
    try:
        url = f"https://www.villaandhouse.com/search?q={sku}"
        async with session.get(url, timeout=15, headers=HEADERS) as r:
            if r.status == 200:
                html = await r.text()
                result['product_link'] = url
                
                img_match = re.search(r'"image"\s*:\s*"(https://[^"]+)"', html)
                if img_match:
                    result['image_url'] = img_match.group(1)
                    
    except Exception as e:
        logger.debug(f"Villa & House error {sku}: {e}")
    return result

# =============================================================================
# MAIN DISPATCHER
# =============================================================================
async def get_product_data(session, product):
    """Get image, size, and link for a product based on vendor"""
    vendor = product.get('vendor', '')
    sku = product.get('sku', '')
    name = product.get('name', '')
    
    if vendor == 'Four Hands':
        return await fetch_four_hands(session, sku, name)
    elif vendor in ['Uttermost', 'Uttermost Additional', 'Hudson Valley Lighting', 
                    'Mitzi', 'Troy Lighting', 'Corbett Lighting', 'Worlds Away']:
        return await fetch_quoizel_brand(session, sku, vendor)
    elif vendor == 'Gabby':
        return await fetch_gabby(session, sku, name)
    elif vendor == 'Loloi':
        return await fetch_loloi(session, sku, name)
    elif vendor == 'Bernhardt':
        return await fetch_bernhardt(session, sku, name)
    elif vendor == 'Rowe':
        return await fetch_rowe(session, sku, name)
    elif vendor == 'Villa & House':
        return await fetch_villa_house(session, sku, name)
    else:
        # Generic fallback
        return {'image_url': None, 'product_link': None, 'dimensions': None}

async def process_vendor(db, session, vendor, limit=500):
    """Process all products for a vendor, getting image, size, and link"""
    logger.info(f"\n{'='*60}\n📦 PROCESSING: {vendor}\n{'='*60}")
    
    # Find products that need data (missing image OR missing product_link)
    products = await db.master_products.find({
        'vendor': vendor,
        '$or': [
            {'image_url': {'$in': ['', None]}},
            {'product_link': {'$in': ['', None]}},
            {'product_link': {'$exists': False}}
        ]
    }).limit(limit).to_list(limit)
    
    if not products:
        logger.info('✅ All products already have complete data')
        return 0
    
    logger.info(f'🔍 Found {len(products)} products needing data')
    
    updated = 0
    semaphore = asyncio.Semaphore(5)  # Limit concurrent requests
    
    async def process_one(p):
        nonlocal updated
        async with semaphore:
            data = await get_product_data(session, p)
            
            update_fields = {}
            if data['image_url']:
                update_fields['image_url'] = data['image_url']
            if data['product_link']:
                update_fields['product_link'] = data['product_link']
            if data['dimensions']:
                update_fields['dimensions'] = data['dimensions']
            
            if update_fields:
                await db.master_products.update_one({'_id': p['_id']}, {'$set': update_fields})
                updated += 1
                fields_got = ', '.join(k for k in update_fields.keys())
                logger.info(f'✓ {p["sku"]} - Got: {fields_got}')
            
            await asyncio.sleep(0.3)  # Rate limiting
    
    await asyncio.gather(*[process_one(p) for p in products])
    
    logger.info(f'📊 Updated {updated}/{len(products)} products')
    return updated

async def save_vendor_to_json(db, vendor):
    """Save vendor products to JSON file for persistence"""
    products = await db.master_products.find(
        {'vendor': vendor}, 
        {'_id': 0}
    ).to_list(50000)
    
    if not products:
        return
    
    # Create filename from vendor name
    filename = vendor.lower().replace(' ', '_').replace('&', 'and') + '.json'
    filepath = DATA_DIR / filename
    
    with open(filepath, 'w') as f:
        json.dump(products, f, indent=2, default=str)
    
    logger.info(f'💾 Saved {len(products)} products to {filename}')

async def main():
    """Main function - scrape all vendors and save to JSON"""
    logger.info('🚀 STARTING COMPLETE PRODUCT SCRAPER')
    logger.info('   Getting: IMAGE, SIZE, and PRODUCT LINK for all products')
    logger.info('='*60)
    
    db = await get_db()
    
    # All vendors to process
    vendors = [
        'Four Hands', 'Uttermost', 'Uttermost Additional', 'Worlds Away', 
        'Gabby', 'Bernhardt', 'Loloi', 'Rowe', 'Villa & House', 'Wendy Jane',
        'Hudson Valley Lighting', 'Mitzi', 'Troy Lighting', 'Corbett Lighting'
    ]
    
    total_updated = 0
    
    async with aiohttp.ClientSession() as session:
        for vendor in vendors:
            try:
                updated = await process_vendor(db, session, vendor, limit=2000)
                total_updated += updated
                
                # Save to JSON after each vendor
                await save_vendor_to_json(db, vendor)
                
            except Exception as e:
                logger.error(f'❌ Error with {vendor}: {e}')
    
    # Final stats
    stats = await db.master_products.aggregate([
        {'$group': {
            '_id': None,
            'total': {'$sum': 1},
            'with_image': {'$sum': {'$cond': [{'$and': [{'$ne': ['$image_url', '']}, {'$ne': ['$image_url', None]}]}, 1, 0]}},
            'with_link': {'$sum': {'$cond': [{'$and': [{'$ne': ['$product_link', '']}, {'$ne': ['$product_link', None]}]}, 1, 0]}},
            'with_dimensions': {'$sum': {'$cond': [{'$and': [{'$ne': ['$dimensions', '']}, {'$ne': ['$dimensions', None]}]}, 1, 0]}}
        }}
    ]).to_list(1)
    
    if stats:
        s = stats[0]
        logger.info('\n' + '='*60)
        logger.info('📊 FINAL STATISTICS')
        logger.info('='*60)
        logger.info(f'   Total Products: {s["total"]}')
        logger.info(f'   With Image:     {s["with_image"]} ({100*s["with_image"]/s["total"]:.1f}%)')
        logger.info(f'   With Link:      {s["with_link"]} ({100*s["with_link"]/s["total"]:.1f}%)')
        logger.info(f'   With Size:      {s["with_dimensions"]} ({100*s["with_dimensions"]/s["total"]:.1f}%)')
        logger.info('='*60)

if __name__ == '__main__':
    asyncio.run(main())

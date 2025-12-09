#!/usr/bin/env python3
"""Scrape dimensions from Four Hands website and update database"""
import asyncio
import aiohttp
import re
import html
import logging
from motor.motor_asyncio import AsyncIOMotorClient

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(message)s',
    handlers=[
        logging.FileHandler('/tmp/dimensions_scraper.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

MONGO_URL = "mongodb://localhost:27017"
DB_NAME = "interior_design_db"

async def scrape_dimensions(session, sku):
    """Scrape dimensions from Four Hands product page"""
    url = f"https://www.fourhands.com/product/{sku}"
    try:
        async with session.get(url, timeout=aiohttp.ClientTimeout(total=10)) as response:
            if response.status == 200:
                content = await response.text()
                content = html.unescape(content)
                match = re.search(r'"dimensionsImperial":"([^"]+)"', content)
                if match:
                    dims = match.group(1).replace('\\u0022', '"')
                    return dims
    except:
        pass
    return None

async def main():
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    
    # Get all Four Hands products with images but no dimensions
    products = await db.master_products.find(
        {
            "vendor": "Four Hands",
            "image_url": {"$ne": None, "$ne": ""},
            "$or": [
                {"dimensions": None},
                {"dimensions": ""},
                {"dimensions": {"$exists": False}}
            ]
        },
        {"_id": 0, "id": 1, "sku": 1}
    ).to_list(10000)
    
    logger.info(f"Found {len(products)} products to update")
    
    headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'}
    connector = aiohttp.TCPConnector(limit=5)
    updated = 0
    
    async with aiohttp.ClientSession(connector=connector, headers=headers) as session:
        for i, product in enumerate(products):
            sku = product['sku']
            dims = await scrape_dimensions(session, sku)
            
            if dims:
                await db.master_products.update_one(
                    {"id": product['id']},
                    {"$set": {"dimensions": dims}}
                )
                updated += 1
            
            if (i + 1) % 100 == 0:
                logger.info(f"Progress: {i+1}/{len(products)} - Updated: {updated}")
            
            await asyncio.sleep(0.3)
    
    logger.info(f"=== Complete: Updated {updated} products with dimensions ===")
    client.close()

if __name__ == "__main__":
    asyncio.run(main())

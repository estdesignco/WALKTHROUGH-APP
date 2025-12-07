"""
Database Seeder Script
Loads vendor product data from JSON files into MongoDB on application startup.
This ensures data persistence across sessions and deployments.
"""

import os
import json
import asyncio
import logging
from pathlib import Path
from motor.motor_asyncio import AsyncIOMotorClient

logger = logging.getLogger(__name__)

# Data directory
DATA_DIR = Path(__file__).parent / 'data' / 'products'

async def seed_products(db):
    """
    Load all product JSON files and insert/update in database.
    Uses upsert to avoid duplicates.
    """
    if not DATA_DIR.exists():
        logger.info(f"No data directory found at {DATA_DIR}")
        return 0
    
    total_loaded = 0
    json_files = list(DATA_DIR.glob('*.json'))
    
    if not json_files:
        logger.info("No JSON files found to seed")
        return 0
    
    # Create indexes
    collection = db.master_products
    await collection.create_index([("sku", 1), ("vendor", 1)], unique=True)
    await collection.create_index([("name", "text")])
    await collection.create_index([("vendor", 1)])
    await collection.create_index([("category", 1)])
    
    for json_file in json_files:
        try:
            with open(json_file, 'r') as f:
                products = json.load(f)
            
            if not products:
                continue
            
            vendor = products[0].get('vendor', 'Unknown')
            
            # Check if data already exists for this vendor
            existing_count = await collection.count_documents({"vendor": vendor})
            
            if existing_count >= len(products):
                logger.info(f"  {vendor}: Already seeded ({existing_count} products)")
                total_loaded += existing_count
                continue
            
            # Upsert products
            loaded = 0
            for product in products:
                try:
                    await collection.update_one(
                        {"sku": product['sku'], "vendor": product['vendor']},
                        {"$set": product},
                        upsert=True
                    )
                    loaded += 1
                except Exception as e:
                    logger.debug(f"Error upserting product {product.get('sku')}: {e}")
            
            logger.info(f"  {vendor}: Loaded {loaded} products")
            total_loaded += loaded
            
        except Exception as e:
            logger.error(f"Error processing {json_file}: {e}")
    
    return total_loaded


async def run_seeder():
    """Main seeder function - run on startup"""
    mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
    db_name = os.environ.get('DB_NAME', 'interior_design_db')
    
    client = AsyncIOMotorClient(mongo_url)
    db = client[db_name]
    
    logger.info("=" * 50)
    logger.info("Running database seeder...")
    
    # Check current product count
    current_count = await db.master_products.count_documents({})
    logger.info(f"Current products in database: {current_count}")
    
    if current_count == 0:
        logger.info("Database empty - seeding from JSON files...")
        total = await seed_products(db)
        logger.info(f"Seeding complete: {total} products loaded")
    else:
        logger.info("Database already has products - checking for updates...")
        total = await seed_products(db)
        new_count = await db.master_products.count_documents({})
        logger.info(f"Database now has {new_count} products")
    
    logger.info("=" * 50)
    
    return await db.master_products.count_documents({})


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    asyncio.run(run_seeder())

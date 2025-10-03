#!/usr/bin/env python3
"""
Fix Four Hands URLs to use working pages
"""

import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime

async def fix_fourhands_urls():
    """Fix Four Hands URLs to use main website"""
    
    mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
    client = AsyncIOMotorClient(mongo_url)
    db = client.get_database('furniture_tracker')
    
    print("🔧 FIXING FOUR HANDS URLS")
    
    try:
        # Update all Four Hands products to use main website
        result = await db.furniture_catalog.update_many(
            {"vendor": "Four Hands"},
            {"$set": {
                "product_url": "https://fourhands.com",
                "updated_date": datetime.utcnow()
            }}
        )
        
        print(f"✅ Updated {result.modified_count} Four Hands products")
        print(f"   All now point to: https://fourhands.com")
        
        client.close()
        return result.modified_count
        
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        client.close()
        return 0

if __name__ == "__main__":
    asyncio.run(fix_fourhands_urls())

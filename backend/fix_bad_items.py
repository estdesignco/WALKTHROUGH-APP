#!/usr/bin/env python3
"""Fix items with None names in database"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv

load_dotenv()

async def fix_bad_items():
    client = AsyncIOMotorClient(os.environ.get('MONGO_URL'))
    db = client.design_db
    
    # Find items with None or empty names
    bad_items = await db.items.find({"$or": [{"name": None}, {"name": ""}]}).to_list(None)
    
    print(f"Found {len(bad_items)} items with None/empty names")
    
    # Update them
    for item in bad_items:
        await db.items.update_one(
            {"id": item["id"]},
            {"$set": {"name": "Unknown Product"}}
        )
        print(f"Fixed item {item['id']}")
    
    print("Done!")
    client.close()

if __name__ == "__main__":
    asyncio.run(fix_bad_items())

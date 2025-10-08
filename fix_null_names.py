import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv

async def fix():
    load_dotenv('/app/backend/.env')
    mongo_url = os.environ['MONGO_URL']
    client = AsyncIOMotorClient(mongo_url)
    db = client[os.environ['DB_NAME']]
    
    # Find items with null names
    null_items = await db.items.find({"name": None}).to_list(None)
    print(f"Found {len(null_items)} items with null names")
    
    for item in null_items:
        # Update to have a default name
        await db.items.update_one(
            {"id": item["id"]},
            {"$set": {"name": "Unknown Product"}}
        )
        print(f"  Fixed: {item.get('link', 'N/A')[:50]}")
    
    print("\n✅ All null names fixed!")
    client.close()

asyncio.run(fix())

import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv
from datetime import datetime, timedelta

async def check():
    load_dotenv('/app/backend/.env')
    mongo_url = os.environ['MONGO_URL']
    client = AsyncIOMotorClient(mongo_url)
    db = client[os.environ['DB_NAME']]
    
    # Get recent items
    cutoff = datetime.utcnow() - timedelta(minutes=30)
    items = await db.items.find({"created_at": {"$gte": cutoff}}).to_list(5)
    
    print("Recent items with details:")
    for item in items[:3]:
        print(f"\n📦 {item.get('name', 'N/A')}")
        print(f"   Vendor: {item.get('vendor', 'N/A')}")
        print(f"   SKU: {item.get('sku', 'N/A')}")
        print(f"   Size: {item.get('size', 'N/A')}")
        print(f"   Finish/Color: {item.get('finish_color', 'N/A')}")
        print(f"   Cost: ${item.get('cost', 0)}")
    
    client.close()

asyncio.run(check())

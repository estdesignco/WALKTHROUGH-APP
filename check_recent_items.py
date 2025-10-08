import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv
from datetime import datetime, timedelta

async def check_items():
    load_dotenv('/app/backend/.env')
    mongo_url = os.environ['MONGO_URL']
    client = AsyncIOMotorClient(mongo_url)
    db = client[os.environ['DB_NAME']]
    
    # Get items created in the last 30 minutes
    cutoff_time = datetime.utcnow() - timedelta(minutes=30)
    recent_items = await db.items.find({
        "created_at": {"$gte": cutoff_time}
    }).to_list(None)
    
    print(f"✅ Found {len(recent_items)} items created in the last 30 minutes:")
    for item in recent_items:
        print(f"  - {item.get('name', 'N/A')}")
        print(f"    Vendor: {item.get('vendor', 'N/A')}")
        print(f"    Cost: ${item.get('cost', 0)}")
        print(f"    Link: {item.get('link', 'N/A')[:50]}...")
        print(f"    Created: {item.get('created_at')}")
        print()
    
    client.close()

asyncio.run(check_items())

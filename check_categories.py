import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv

async def check():
    load_dotenv('/app/backend/.env')
    mongo_url = os.environ['MONGO_URL']
    client = AsyncIOMotorClient(mongo_url)
    db = client[os.environ['DB_NAME']]
    
    # Get Living Room
    room = await db.rooms.find_one({"name": "Living Room"})
    if room:
        print(f"Room: {room['name']} (ID: {room['id']})")
        
        # Get categories
        categories = await db.categories.find({"room_id": room['id']}).to_list(None)
        print(f"\nCategories in Living Room: {len(categories)}")
        for cat in categories:
            print(f"\n  📁 {cat['name']}")
            subcats = await db.subcategories.find({"category_id": cat['id']}).to_list(None)
            for subcat in subcats:
                print(f"     - {subcat['name']}")
    
    client.close()

asyncio.run(check())

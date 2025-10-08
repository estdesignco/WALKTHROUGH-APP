import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv

async def check():
    load_dotenv('/app/backend/.env')
    mongo_url = os.environ['MONGO_URL']
    client = AsyncIOMotorClient(mongo_url)
    db = client[os.environ['DB_NAME']]
    
    projects = await db.projects.find().to_list(None)
    print(f"📊 Total projects in database: {len(projects)}")
    for p in projects:
        print(f"  - {p.get('name', 'N/A')} (ID: {p.get('id', 'N/A')})")
    
    client.close()

asyncio.run(check())

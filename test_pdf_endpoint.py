import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv

async def check_jobs():
    load_dotenv('/app/backend/.env')
    mongo_url = os.environ['MONGO_URL']
    client = AsyncIOMotorClient(mongo_url)
    db = client[os.environ['DB_NAME']]
    
    # Find any existing PDF import jobs
    jobs = await db.pdf_import_jobs.find().to_list(10)
    print(f"Found {len(jobs)} PDF import jobs:")
    for job in jobs:
        print(f"  - Job ID: {job.get('id', 'N/A')}")
        print(f"    Status: {job.get('status', 'N/A')}")
        print(f"    Filename: {job.get('filename', 'N/A')}")
        print(f"    Total links: {job.get('total_links', 0)}")
        print(f"    Imported: {job.get('imported_items', 0)}")
        print(f"    Failed: {job.get('failed_items', 0)}")
        print()
    
    client.close()

asyncio.run(check_jobs())

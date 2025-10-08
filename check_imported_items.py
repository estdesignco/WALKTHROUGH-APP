import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv

async def check_items():
    load_dotenv('/app/backend/.env')
    mongo_url = os.environ['MONGO_URL']
    client = AsyncIOMotorClient(mongo_url)
    db = client[os.environ['DB_NAME']]
    
    # Get the job details
    job = await db.pdf_import_jobs.find_one({"id": "f4e55c20-ecc9-4679-b110-20bf179cf787"})
    if job:
        print(f"Job Status: {job['status']}")
        print(f"Total Links: {job['total_links']}")
        print(f"Imported: {job['imported_items']}")
        print(f"Failed: {job['failed_items']}")
        print(f"Room: {job['room_name']}")
        
        # Find items in that room
        room_id = job['room_id']
        
        # Get categories for that room
        categories = await db.categories.find({"room_id": room_id}).to_list(None)
        print(f"\n✅ Found {len(categories)} categories in {job['room_name']}")
        
        for cat in categories:
            # Get subcategories
            subcats = await db.subcategories.find({"category_id": cat['id']}).to_list(None)
            for subcat in subcats:
                # Get items in this subcategory
                items = await db.items.find({"subcategory_id": subcat['id']}).to_list(None)
                if items:
                    print(f"\n  Category: {cat['name']} > {subcat['name']}")
                    print(f"  Items: {len(items)}")
                    for item in items[:3]:  # Show first 3
                        print(f"    - {item.get('name', 'N/A')} | ${item.get('cost', 0)} | {item.get('vendor', 'N/A')}")
    
    client.close()

asyncio.run(check_items())

"""
Comprehensive vendor scraper test
"""
import asyncio
import os
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient
from cryptography.fernet import Fernet

load_dotenv()

# Sample product URLs for testing
TEST_URLS = {
    "fourhands.com": "https://www.fourhands.com/product/harmon-dining-table/?"
}

async def test_scraper():
    mongo_url = os.environ.get('MONGO_URL')
    client = AsyncIOMotorClient(mongo_url)
    db = client[os.environ.get('DB_NAME', 'design_tools')]
    
    vendors = await db.vendor_credentials.find({}, {"_id": 0}).to_list(100)
    print(f"Found {len(vendors)} vendors in database\n")
    
    fernet_key = os.environ.get('FERNET_KEY')
    fernet = Fernet(fernet_key.encode())
    
    for v in vendors:
        try:
            pwd = fernet.decrypt(v['encrypted_password'].encode()).decode()
            print(f"✅ {v['name']}: {v['username']} / {'*' * len(pwd)}")
        except Exception as e:
            print(f"❌ {v['name']}: Error decrypting - {e}")
    
    client.close()

asyncio.run(test_scraper())

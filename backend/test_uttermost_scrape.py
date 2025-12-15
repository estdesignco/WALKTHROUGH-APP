import asyncio
import os
from dotenv import load_dotenv

load_dotenv()

from motor.motor_asyncio import AsyncIOMotorClient
from cryptography.fernet import Fernet

async def test_uttermost():
    # Connect to database
    mongo_url = os.environ.get('MONGO_URL')
    client = AsyncIOMotorClient(mongo_url)
    db = client[os.environ.get('DB_NAME', 'design_tools')]
    
    # Check credentials exist
    cred_doc = await db.vendor_credentials.find_one({"domain": "uttermost.com"})
    print(f"Credentials found: {cred_doc is not None}")
    
    if cred_doc:
        print(f"Username: {cred_doc.get('username')}")
        print(f"Has encrypted password: {'encrypted_password' in cred_doc}")
        
        # Try to decrypt
        fernet_key = os.environ.get('FERNET_KEY')
        if fernet_key and cred_doc.get('encrypted_password'):
            try:
                fernet = Fernet(fernet_key.encode())
                password = fernet.decrypt(cred_doc['encrypted_password'].encode()).decode()
                print(f"Password decrypted successfully: {len(password)} chars")
            except Exception as e:
                print(f"Decrypt error: {e}")
    
    client.close()

asyncio.run(test_uttermost())

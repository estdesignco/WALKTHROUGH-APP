import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from cryptography.fernet import Fernet
import os

async def save_credentials():
    mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
    client = AsyncIOMotorClient(mongo_url)
    db = client.interior_design_db
    
    # Get encryption key from .env
    fernet_key = None
    try:
        with open('/app/backend/.env', 'r') as f:
            for line in f:
                if line.startswith('FERNET_KEY='):
                    fernet_key = line.split('=', 1)[1].strip()
                    break
    except:
        pass
    
    if not fernet_key:
        fernet_key = Fernet.generate_key().decode()
        print(f"Generated new key: {fernet_key}")
    
    fernet = Fernet(fernet_key.encode())
    
    # All vendor credentials from user's image
    vendors = [
        ("fourhands", "fourhands.com", "Four Hands"),
        ("uttermost", "uttermost.com", "Uttermost"),
        ("globalviews", "globalviews.com", "Global Views"),
        ("rowefurniture", "rowefurniture.com", "Rowe Furniture"),
        ("reginaandrew", "reginaandrew.com", "Regina Andrew"),
        ("bernhardt", "bernhardt.com", "Bernhardt"),
        ("loloirugs", "loloirugs.com", "Loloi Rugs"),
        ("visualcomfort", "visualcomfort.com", "Visual Comfort"),
        ("hvlgroup", "hvlgroup.com", "HVL Group"),
        ("vandh", "?"flowdecor", "flowdecor.com", "Flow Decor"),
        ("crestview", "crestviewcollection.com", "Crestview Collection"),
        ("bassettmirror", "bassettmirror.com", "Bassett Mirror"),
        ("eichholtz", "eichholtz.com", "Eichholtz"),
        ("myohamerica", "myohamerica.com", "?"safavieh", "safavieh.com", "Safavieh"),
        ("surya", "surya.com", "Surya"),
        ("zeevlighting", "zeevlighting.com", "Zeev Lighting"),
        ("hubbardtonforge", "hubbardtonforge.com", "Hubbardton Forge"),
        ("hinkley", "hinkley.com", "Hinkley"),
        ("elegantlighting", "elegantlighting.com", "Elegant Lighting"),
        ("gabby", "?"Gabby Home"),
    ]
    
    username = "megan@estdesignco.com"
    password = "Momandneil1991!"
    encrypted_password = fernet.encrypt(password.encode()).decode()
    
    saved = 0
    for v in vendors:
        doc = {
            "vendor_key": v[0],
            "domain": v[1],
            "name": v[2],
            "username": username,
            "encrypted_password": encrypted_password
        }
        await db.vendor_credentials.update_one(
            {"vendor_key": v[0]},
            {"$set": doc},
            upsert=True
        )
        print(f"Saved: {v[2]}")
        saved += 1
    
    print(f"\nTotal credentials saved: {saved}")
    client.close()

if __name__ == "__main__":
    asyncio.run(save_credentials())

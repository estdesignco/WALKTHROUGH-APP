import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from cryptography.fernet import Fernet
import os

async def save_credentials():
    mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
    client = AsyncIOMotorClient(mongo_url)
    db = client.interior_design_db
    
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
    
    vendors = [
        # From user's image - EXACT credentials
        ("fourhands", "fourhands.com", "Four Hands", "81887", "momandneil"),
        ("uttermost", "uttermost.com", "Uttermost", "Orders@estdesignco.com", "Zeke1919$$$$"),
        ("globalviews", "globalviews.com", "Global Views", "orders@estdesignco.com", "Zeke1991$$$$"),
        ("rowefurniture", "rowefurniture.com", "Rowe Furniture", "EstDesignCo@gmail.com", "Momandneil1991!"),
        ("reginaandrew", "reginaandrew.com", "Regina Andrew", "establisheddesignco@gmail.com", "momandneil"),
        ("bernhardt", "bernhardt.com", "Bernhardt", "neil", "Bernhard"),
        ("loloirugs", "loloirugs.com", "Loloi Rugs", "estdesigninc@gmail.com", "momandneil"),
        ("visualcomfort", "visualcomfort.com", "Visual Comfort", "Neil@EstDesignCo.com", "Momandneil1991"),
        ("hvlgroup", "hvlgroup.com", "HVL Group", "establisheddesignco@gmail.com", "Momandneil1991!"),
        ("vandh", "vandh.com", "V and H", "EstDesignCo@gmail.com", "Zeke1991$$$$"),
        ("flowdecor", "flowdecor.com", "Flow Decor", "establisheddesignco@gmail.com", "shine"),
        ("crestview", "crestviewcollection.com", "Crestview Collection", "Orders@estdesignco.com", "Establish1234!"),
        ("bassettmirror", "bassettmirror.com", "Bassett Mirror", "EstDesignCo@gmail.com", "Momandneil1991!"),
        ("eichholtz", "eichholtz.com", "Eichholtz", "thegibsoncoshop@gmail", "Gibson5341"),
        ("myohamerica", "myohamerica.com", "MYO America", "Neil@EstDesignCo.com", "Momandneil1991"),
        ("safavieh", "safavieh.com", "Safavieh", "EST3669", "Zeke1919$$$$$$"),
        ("surya", "surya.com", "Surya", "Orders@estdesignco.com", "Zeke191955$$$$"),
        ("zeevlighting", "zeevlighting.com", "Zeev Lighting", "Orders@estdesignco.com", "Momandneil1991!"),
        ("hubbardtonforge", "hubbardtonforge.com", "Hubbardton Forge", "Orders@estdesignco.com", "Momandneil1991!"),
        ("hinkley", "hinkley.com", "Hinkley", "Orders@estdesignco.com", "Momandneil1991!"),
        ("elegantlighting", "elegantlighting.com", "Elegant Lighting", "Orders@estdesignco.com", "Momandneil1991!"),
        ("gabby", "gabby.com", "Gabby Home", "Orders@estdesignco.com", "Momandneil1991!"),
    ]
    
    saved = 0
    for v in vendors:
        encrypted_password = fernet.encrypt(v[4].encode()).decode()
        doc = {
            "vendor_key": v[0],
            "domain": v[1],
            "name": v[2],
            "username": v[3],
            "encrypted_password": encrypted_password
        }
        await db.vendor_credentials.update_one(
            {"vendor_key": v[0]},
            {"$set": doc},
            upsert=True
        )
        print(f"Saved: {v[2]} ({v[1]})")
        saved += 1
    
    print(f"\nTotal credentials saved: {saved}")
    client.close()

if __name__ == "__main__":
    asyncio.run(save_credentials())

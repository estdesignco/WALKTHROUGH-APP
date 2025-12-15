import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from cryptography.fernet import Fernet
from dotenv import load_dotenv

load_dotenv()

async def update_credentials():
    mongo_url = os.environ.get('MONGO_URL')
    client = AsyncIOMotorClient(mongo_url)
    db = client[os.environ.get('DB_NAME', 'design_tools')]
    
    fernet_key = os.environ.get('FERNET_KEY')
    fernet = Fernet(fernet_key.encode())
    
    # Updated credentials from user's image
    vendors = [
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
    
    # Delete all existing and reinsert
    await db.vendor_credentials.delete_many({})
    
    for v in vendors:
        encrypted_password = fernet.encrypt(v[4].encode()).decode()
        doc = {
            "vendor_key": v[0],
            "domain": v[1],
            "name": v[2],
            "username": v[3],
            "encrypted_password": encrypted_password
        }
        await db.vendor_credentials.insert_one(doc)
        print(f"✅ {v[2]}")
    
    print(f"\nTotal: {len(vendors)} vendors updated")
    client.close()

asyncio.run(update_credentials())

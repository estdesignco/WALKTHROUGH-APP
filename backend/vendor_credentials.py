#!/usr/bin/env python3
"""Store vendor credentials in database"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv
import uuid

load_dotenv()

# All vendor credentials from the user's image
VENDOR_CREDENTIALS = [
    {
        "id": str(uuid.uuid4()),
        "vendor": "Four Hands",
        "domain": "fourhands.com",
        "login_url": "https://fourhands.com/login",
        "username": "Orders@estdesignco.com",
        "password": "Zeke1919$$$$$"
    },
    {
        "id": str(uuid.uuid4()),
        "vendor": "Uttermost",
        "domain": "uttermost.com",
        "login_url": "https://uttermost.com/",
        "username": "Orders@estdesignco.com",
        "password": "Zeke1919$$$$$"
    },
    {
        "id": str(uuid.uuid4()),
        "vendor": "Global Views",
        "domain": "globeviews.com",
        "login_url": "https://www.globeviews.com/",
        "username": "orders@estdesignco.com",
        "password": "Zeke1919$$$$$"
    },
    {
        "id": str(uuid.uuid4()),
        "vendor": "Have Furniture",
        "domain": "havefurniture.com",
        "login_url": "https://havefurniture.com/login",
        "username": "EstDesignCo@gmail.com",
        "password": "Momandnet1991"
    },
    {
        "id": str(uuid.uuid4()),
        "vendor": "Regina Andrew",
        "domain": "reginaandrew.com",
        "login_url": "https://www.reginaandrew.com/?toggle=Tawnhence",
        "username": "establisheddesignco@gmail.com",
        "password": "momandnet1991"
    },
    {
        "id": str(uuid.uuid4()),
        "vendor": "Bernhardt",
        "domain": "bernhardt.com",
        "login_url": "https://www.bernhardt.com/",
        "username": "net",
        "password": "Bernhard"
    },
    {
        "id": str(uuid.uuid4()),
        "vendor": "Loloi Rugs",
        "domain": "loloirugs.com",
        "login_url": "https://www.loloirugs.com/collections/rugs-collection",
        "username": "estdesignco@gmail.com",
        "password": "momandnet1991"
    },
    {
        "id": str(uuid.uuid4()),
        "vendor": "Visual Comfort",
        "domain": "visualcomfort.com",
        "login_url": "https://www.visualcomfort.com/customer/account/login/",
        "username": "Net@EstDesignCo.com",
        "password": "Momandnet1991"
    },
    {
        "id": str(uuid.uuid4()),
        "vendor": "HVL Group",
        "domain": "hvlgroup.com",
        "login_url": "https://www.hvlgroup.com/AuthyLoginReturnUrl=%2F",
        "username": "establisheddesignco@gmail.com",
        "password": "Momandnett1991"
    },
    {
        "id": str(uuid.uuid4()),
        "vendor": "VandH",
        "domain": "vandh.com",
        "login_url": "https://vandh.com/",
        "username": "EstDesignCo@gmail.com",
        "password": "Zeke1991$$$$$"
    },
    {
        "id": str(uuid.uuid4()),
        "vendor": "Llow Decor",
        "domain": "llowdecor.com",
        "login_url": "https://llowdecor.com/sign-in/",
        "username": "establisheddesignco@gmail.com",
        "password": "Momandnet1991"
    },
    {
        "id": str(uuid.uuid4()),
        "vendor": "Crestview Collection",
        "domain": "crestviewcollection.com",
        "login_url": "https://www.crestviewcollection.com/",
        "username": "Orders@estdesignco.com",
        "password": "Estabish1234"
    },
    {
        "id": str(uuid.uuid4()),
        "vendor": "Basset Mirror",
        "domain": "bassetmirror.com",
        "login_url": "https://www.bassetmirror.com/",
        "username": "EstDesignCo@gmail.com",
        "password": "Momandnett1991"
    },
    {
        "id": str(uuid.uuid4()),
        "vendor": "Eichholtz",
        "domain": "eichholtz.com",
        "login_url": "https://www.eichholtz.com/en/customer/account/login/",
        "username": "theglasoncoshop@gmail",
        "password": "Gibson5341"
    },
    {
        "id": str(uuid.uuid4()),
        "vendor": "MYS America",
        "domain": "myshomerica.com",
        "login_url": "https://myshomerica.com/customer/account/login/",
        "username": "Net@EstDesignC.o.com",
        "password": "Momandnett1991"
    },
    {
        "id": str(uuid.uuid4()),
        "vendor": "Safavieh",
        "domain": "safavieh.com",
        "login_url": "https://safavieh.com/dealer-login?redirect_by",
        "username": "EST3469",
        "password": "Zeke1919$$$$$"
    },
    {
        "id": str(uuid.uuid4()),
        "vendor": "Surya",
        "domain": "surya.com",
        "login_url": "https://www.surya.com/",
        "username": "Orders@estdesignco.com",
        "password": "Zeke1919$$$$$"
    },
    {
        "id": str(uuid.uuid4()),
        "vendor": "Zee Lighting",
        "domain": "zeelighting.com",
        "login_url": "https://zeelighting.com/index.php",
        "username": "Orders@estdesignco.com",
        "password": "Zeke1919$$$$$"
    },
    {
        "id": str(uuid.uuid4()),
        "vendor": "Hubbardton Forge",
        "domain": "hubbardtonforge.com",
        "login_url": "https://hubbardtonforge.com/",
        "username": "Orders@estdesignco.com",
        "password": "Zeke1919$$$$$"
    },
    {
        "id": str(uuid.uuid4()),
        "vendor": "Hinkley",
        "domain": "hinkley.com",
        "login_url": "https://www.hinkley.com/",
        "username": "Orders@estdesignco.com",
        "password": "Zeke1919$$$$$"
    },
    {
        "id": str(uuid.uuid4()),
        "vendor": "Elegant Lighting",
        "domain": "elegantlighting.com",
        "login_url": "https://elegantlighting.com/",
        "username": "Orders@estdesignco.com",
        "password": "Zeke1919$$$$$"
    },
    {
        "id": str(uuid.uuid4()),
        "vendor": "Gabby",
        "domain": "gabby.com",
        "login_url": "https://gabby.com/",
        "username": "Orders@estdesignco.com",
        "password": "Zeke1919$$$$$"
    }
]

async def store_credentials():
    client = AsyncIOMotorClient(os.environ.get('MONGO_URL'))
    db = client.design_db
    
    # Drop existing collection and recreate
    await db.vendor_credentials.drop()
    print("✅ Dropped old vendor_credentials collection")
    
    # Insert all credentials
    result = await db.vendor_credentials.insert_many(VENDOR_CREDENTIALS)
    print(f"✅ Stored {len(result.inserted_ids)} vendor credentials")
    
    # Create index on domain for fast lookups
    await db.vendor_credentials.create_index("domain")
    print("✅ Created index on domain")
    
    # Verify
    count = await db.vendor_credentials.count_documents({})
    print(f"\n📊 Total vendors in database: {count}")
    
    # List all vendors
    vendors = await db.vendor_credentials.find({}, {"vendor": 1, "domain": 1, "_id": 0}).to_list(None)
    print("\n📋 Stored vendors:")
    for v in vendors:
        print(f"   - {v['vendor']} ({v['domain']})")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(store_credentials())

"""
Master Database Seeder - Populates vendor and material databases for predictive text.
"""
import asyncio
import os
from datetime import datetime, timezone
import uuid
from motor.motor_asyncio import AsyncIOMotorClient

mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ.get('DB_NAME', 'interior_design_db')]

# FABRIC VENDORS
FABRIC_VENDORS = [
    {"name": "Magnolia Home Fashions", "notes": "Joanna Gaines collection"},
    {"name": "Kravet", "notes": "Premium designer fabrics"},
    {"name": "Norbar Fabrics", "notes": "High-end upholstery and drapery"},
    {"name": "JF Fabrics", "notes": "Contemporary and traditional"},
    {"name": "4 Spaces", "notes": "Indoor/outdoor performance"},
    {"name": "Anna Elisabeth", "notes": "Luxury European fabrics"},
    {"name": "Barrow Industries", "notes": "Traditional and contemporary"},
    {"name": "Alexandra Brook", "notes": "Designer collections"},
    {"name": "Stout Fabrics", "notes": "Performance fabrics"},
    {"name": "Sunbrella", "notes": "Indoor/outdoor - stain resistant"},
    {"name": "Bernhardt", "notes": "Luxury furniture and fabrics"},
    {"name": "Rowe Furniture", "notes": "Custom upholstery"},
    {"name": "Gabby Home", "notes": "French-inspired"},
    {"name": "Uttermost", "notes": "Accent furniture and fabrics"},
    {"name": "Revelation", "notes": "Designer fabric and furniture"},
    {"name": "Schumacher", "notes": "Luxury since 1889"},
    {"name": "Robert Allen", "notes": "Contemporary and traditional"},
    {"name": "Duralee", "notes": "Highland Court collections"},
]

# WALLPAPER VENDORS
WALLPAPER_VENDORS = [
    {"name": "York Wallcoverings", "notes": "America's oldest wallpaper company"},
    {"name": "Phillip Jeffries", "notes": "Natural materials - grasscloth, hemp, silk"},
    {"name": "Kravet Wallcoverings", "notes": "Designer wallpaper collections"},
    {"name": "Thibaut", "notes": "Classic American wallpaper"},
    {"name": "Cole & Son", "notes": "British heritage - iconic patterns"},
    {"name": "Scalamandre", "notes": "Luxury heritage wallcoverings"},
    {"name": "Brewster Home Fashions", "notes": "Wide range of styles"},
]

# HARDWARE VENDORS
HARDWARE_VENDORS = [
    {"name": "Delta Faucet", "notes": "Kitchen and bath faucets"},
    {"name": "Kohler", "notes": "Premium kitchen and bath fixtures"},
    {"name": "Emtek", "notes": "Door and cabinet hardware"},
    {"name": "Top Knobs", "notes": "Cabinet hardware specialist"},
    {"name": "Moen", "notes": "Kitchen and bath faucets"},
    {"name": "Brizo", "notes": "Luxury fixtures"},
    {"name": "Grohe", "notes": "German engineering"},
    {"name": "Hansgrohe", "notes": "Axor luxury line"},
    {"name": "Newport Brass", "notes": "Solid brass fixtures"},
    {"name": "Rohl", "notes": "European-style fixtures"},
    {"name": "Waterworks", "notes": "Ultra-luxury bath"},
    {"name": "Schaub + Company", "notes": "Cabinet hardware"},
    {"name": "Baldwin Hardware", "notes": "Door hardware - solid brass"},
    {"name": "Rocky Mountain Hardware", "notes": "Bronze - handcrafted USA"},
]

# APPLIANCE VENDORS
APPLIANCE_VENDORS = [
    {"name": "Wolf", "notes": "Professional-grade ranges"},
    {"name": "Sub-Zero", "notes": "Premium refrigeration"},
    {"name": "KitchenAid", "notes": "Iconic appliances"},
    {"name": "Jenn-Air", "notes": "Luxury cooking"},
    {"name": "Frigidaire", "notes": "Full range appliances"},
    {"name": "Viking", "notes": "Professional-style"},
    {"name": "Thermador", "notes": "German engineering"},
    {"name": "Miele", "notes": "German quality"},
    {"name": "Bosch", "notes": "Quiet dishwashers"},
    {"name": "GE Profile", "notes": "Smart home integration"},
    {"name": "Dacor", "notes": "California luxury"},
    {"name": "Fisher & Paykel", "notes": "New Zealand innovation"},
    {"name": "Gaggenau", "notes": "Ultra-luxury German"},
    {"name": "BlueStar", "notes": "Custom color ranges"},
    {"name": "La Cornue", "notes": "French artisan ranges"},
]

# TILE VENDORS
TILE_VENDORS = [
    {"name": "Ann Sacks", "notes": "Luxury stone and tile"},
    {"name": "Walker Zanger", "notes": "Artisan tile and stone"},
    {"name": "Artistic Tile", "notes": "Designer collections"},
    {"name": "Daltile", "notes": "Porcelain, ceramic, stone"},
    {"name": "Cle Tile", "notes": "Zellige and cement tiles"},
    {"name": "Fireclay Tile", "notes": "Handcrafted ceramic"},
    {"name": "Jeffrey Court", "notes": "Natural stone and glass"},
    {"name": "Emser Tile", "notes": "Natural stone and porcelain"},
    {"name": "Porcelanosa", "notes": "Spanish luxury"},
    {"name": "MSI Surfaces", "notes": "Quartz and natural stone"},
    {"name": "Bedrosians", "notes": "Tile and stone since 1948"},
    {"name": "The Tile Shop", "notes": "Wide retail selection"},
]

# LIGHTING VENDORS
LIGHTING_VENDORS = [
    {"name": "Visual Comfort", "notes": "Designer lighting"},
    {"name": "Currey and Company", "notes": "Artisan chandeliers"},
    {"name": "Hudson Valley Lighting", "notes": "Troy, Mitzi collections"},
    {"name": "Regina Andrew", "notes": "Statement pieces"},
    {"name": "Arteriors", "notes": "Modern luxury"},
    {"name": "Circa Lighting", "notes": "Part of Visual Comfort"},
    {"name": "Progress Lighting", "notes": "Wide range of styles"},
    {"name": "Kichler", "notes": "Traditional to contemporary"},
    {"name": "Generation Lighting", "notes": "Monte Carlo fans, Feiss"},
    {"name": "Hinkley Lighting", "notes": "Indoor and outdoor"},
    {"name": "Capital Lighting", "notes": "Value-oriented designer"},
    {"name": "Savoy House", "notes": "Classic and transitional"},
]

# BENJAMIN MOORE PAINT COLORS
BM_COLORS = [
    {"name": "White Dove", "code": "OC-17", "hex": "#F3EEE4"},
    {"name": "Simply White", "code": "OC-117", "hex": "#F8F6F0"},
    {"name": "Chantilly Lace", "code": "OC-65", "hex": "#F5F3EF"},
    {"name": "Decorator's White", "code": "OC-149", "hex": "#ECEAE3"},
    {"name": "Cloud White", "code": "OC-130", "hex": "#F2EEE4"},
    {"name": "Swiss Coffee", "code": "OC-45", "hex": "#F0EBDD"},
    {"name": "Revere Pewter", "code": "HC-172", "hex": "#C4BAA2"},
    {"name": "Edgecomb Gray", "code": "HC-173", "hex": "#D3CABC"},
    {"name": "Pale Oak", "code": "OC-20", "hex": "#DDD5C9"},
    {"name": "Balboa Mist", "code": "OC-27", "hex": "#D7D2C4"},
    {"name": "Classic Gray", "code": "OC-23", "hex": "#D5D0C8"},
    {"name": "Gray Owl", "code": "OC-52", "hex": "#C5C2B9"},
    {"name": "Stonington Gray", "code": "HC-170", "hex": "#B9B7AC"},
    {"name": "Hale Navy", "code": "HC-154", "hex": "#3E4B59"},
    {"name": "Kendall Charcoal", "code": "HC-166", "hex": "#686763"},
    {"name": "Chelsea Gray", "code": "HC-168", "hex": "#8C8984"},
    {"name": "Sea Salt", "code": "2040-50", "hex": "#D1D8D8"},
    {"name": "Palladian Blue", "code": "HC-144", "hex": "#B5C5C1"},
    {"name": "Aegean Teal", "code": "2136-40", "hex": "#79A6A5"},
]

# SHERWIN WILLIAMS PAINT COLORS
SW_COLORS = [
    {"name": "Alabaster", "code": "SW 7008", "hex": "#F2EDE3"},
    {"name": "Pure White", "code": "SW 7005", "hex": "#F1EDE6"},
    {"name": "Extra White", "code": "SW 7006", "hex": "#F1F0EA"},
    {"name": "Snowbound", "code": "SW 7004", "hex": "#EFEEE9"},
    {"name": "Greek Villa", "code": "SW 7551", "hex": "#F3EDE2"},
    {"name": "Repose Gray", "code": "SW 7015", "hex": "#C2BDB3"},
    {"name": "Agreeable Gray", "code": "SW 7029", "hex": "#CEC8BC"},
    {"name": "Accessible Beige", "code": "SW 7036", "hex": "#CFC5B5"},
    {"name": "Mindful Gray", "code": "SW 7016", "hex": "#B4AFA5"},
    {"name": "Sea Salt", "code": "SW 6204", "hex": "#C8D3CD"},
    {"name": "Naval", "code": "SW 6244", "hex": "#323B4C"},
    {"name": "Iron Ore", "code": "SW 7069", "hex": "#4E4C4A"},
    {"name": "Peppercorn", "code": "SW 7674", "hex": "#5D5B5A"},
    {"name": "Tricorn Black", "code": "SW 6258", "hex": "#2E2E2E"},
    {"name": "Urbane Bronze", "code": "SW 7048", "hex": "#544D43"},
]

# FARROW & BALL PAINT COLORS
FB_COLORS = [
    {"name": "All White", "code": "No.2005", "hex": "#FEFEFD"},
    {"name": "Pointing", "code": "No.2003", "hex": "#F9F4E8"},
    {"name": "Wimborne White", "code": "No.239", "hex": "#F3EFE1"},
    {"name": "Skimming Stone", "code": "No.241", "hex": "#E0D8C8"},
    {"name": "Elephant's Breath", "code": "No.229", "hex": "#C9C0B5"},
    {"name": "Pavilion Gray", "code": "No.242", "hex": "#B7B4A8"},
    {"name": "Down Pipe", "code": "No.26", "hex": "#5B5D5E"},
    {"name": "Railings", "code": "No.31", "hex": "#3B3B3B"},
    {"name": "Hague Blue", "code": "No.30", "hex": "#3E5265"},
    {"name": "Stiffkey Blue", "code": "No.281", "hex": "#3E4C5C"},
    {"name": "Inchyra Blue", "code": "No.289", "hex": "#4C5355"},
]

# BEHR PAINT COLORS
BEHR_COLORS = [
    {"name": "Ultra Pure White", "code": "PPU18-06", "hex": "#FFFFFF"},
    {"name": "Polar Bear", "code": "PPU18-07", "hex": "#F2F2ED"},
    {"name": "Swiss Coffee", "code": "PPU5-12", "hex": "#EDE4D4"},
    {"name": "Blank Canvas", "code": "DC-003", "hex": "#EDE8DC"},
    {"name": "Blueprint", "code": "S470-5", "hex": "#425E73"},
    {"name": "In The Navy", "code": "N510-7", "hex": "#2D3B4D"},
    {"name": "Dark Everglade", "code": "PPU11-19", "hex": "#4A5A52"},
]

async def seed_vendors():
    print("Seeding vendors...")
    categories = {
        "fabric": FABRIC_VENDORS,
        "wallpaper": WALLPAPER_VENDORS,
        "hardware": HARDWARE_VENDORS,
        "appliances": APPLIANCE_VENDORS,
        "tile": TILE_VENDORS,
        "lighting": LIGHTING_VENDORS,
    }
    
    count = 0
    for category, vendors in categories.items():
        for v in vendors:
            existing = await db.master_materials.find_one({"name": v["name"], "category": category})
            if not existing:
                doc = {
                    "id": str(uuid.uuid4()),
                    "name": v["name"],
                    "category": category,
                    "manufacturer": v["name"],
                    "vendor": "",
                    "sku": "",
                    "color": "",
                    "color_code": "",
                    "pattern": "",
                    "width": None,
                    "height": None,
                    "repeat": None,
                    "price_per_unit": None,
                    "unit": "each",
                    "lead_time": "",
                    "photo_url": "",
                    "photo_data": "",
                    "notes": v.get("notes", ""),
                    "tags": [category, "vendor", v["name"].lower()],
                    "is_vendor": True,
                    "created_at": datetime.now(timezone.utc).isoformat(),
                    "updated_at": datetime.now(timezone.utc).isoformat(),
                    "used_in_projects": []
                }
                await db.master_materials.insert_one(doc)
                count += 1
    print(f"Seeded {count} vendors")
    return count

async def seed_paint_colors():
    print("Seeding paint colors...")
    paints = [
        ("Benjamin Moore", BM_COLORS),
        ("Sherwin Williams", SW_COLORS),
        ("Farrow & Ball", FB_COLORS),
        ("Behr", BEHR_COLORS),
    ]
    
    count = 0
    for manufacturer, colors in paints:
        for c in colors:
            existing = await db.master_materials.find_one({
                "name": c["name"],
                "manufacturer": manufacturer,
                "category": "paint"
            })
            if not existing:
                doc = {
                    "id": str(uuid.uuid4()),
                    "name": c["name"],
                    "category": "paint",
                    "manufacturer": manufacturer,
                    "vendor": manufacturer,
                    "sku": c.get("code", ""),
                    "color": c["name"],
                    "color_code": c.get("hex", ""),
                    "pattern": "",
                    "width": None,
                    "height": None,
                    "repeat": None,
                    "price_per_unit": None,
                    "unit": "gallon",
                    "lead_time": "",
                    "photo_url": "",
                    "photo_data": "",
                    "notes": f"{manufacturer} {c.get('code', '')}",
                    "tags": ["paint", manufacturer.lower(), c["name"].lower()],
                    "is_paint_color": True,
                    "hex_color": c.get("hex", ""),
                    "created_at": datetime.now(timezone.utc).isoformat(),
                    "updated_at": datetime.now(timezone.utc).isoformat(),
                    "used_in_projects": []
                }
                await db.master_materials.insert_one(doc)
                count += 1
    print(f"Seeded {count} paint colors")
    return count

async def seed_all():
    print("=" * 50)
    print("SEEDING MASTER DATABASES")
    print("=" * 50)
    
    vendor_count = await seed_vendors()
    paint_count = await seed_paint_colors()
    
    total = await db.master_materials.count_documents({})
    print("=" * 50)
    print(f"COMPLETE: {vendor_count} vendors, {paint_count} paints")
    print(f"Total master_materials: {total}")
    print("=" * 50)
    
    return {"vendors": vendor_count, "paints": paint_count, "total": total}

if __name__ == "__main__":
    asyncio.run(seed_all())

"""
Master Database Seeder - Populates all vendor and material databases
for predictive text / autocomplete functionality.

This includes:
- Fabric vendors (Magnolia, Kravet, Norbar, JF Fabrics, etc.)
- Wallpaper vendors (York, Phillip Jeffries, Kravet)
- Hardware vendors (Delta, Kohler, Emtek, Top Knobs)
- Appliance vendors (Wolf, Sub-Zero, KitchenAid, etc.)
- Tile vendors
- Paint colors (Benjamin Moore, Sherwin Williams, Farrow & Ball, Behr)
"""

import asyncio
import os
from datetime import datetime, timezone
import uuid
from motor.motor_asyncio import AsyncIOMotorClient

# MongoDB connection
mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ.get('DB_NAME', 'interior_design_db')]

# ============================================
# FABRIC VENDORS AND MATERIALS
# ============================================
FABRIC_VENDORS = [
    {
        "name": "Magnolia Home Fashions",
        "category": "fabric",
        "website": "https://www.magnoliahomefashions.com",
        "notes": "Joanna Gaines collection - farmhouse and transitional fabrics"
    },
    {
        "name": "Kravet",
        "category": "fabric",
        "website": "https://www.kravet.com",
        "notes": "Premium designer fabrics, Lee Jofa, Brunschwig & Fils"
    },
    {
        "name": "Norbar Fabrics",
        "category": "fabric",
        "website": "https://www.norbar.com",
        "notes": "High-end upholstery and drapery fabrics"
    },
    {
        "name": "JF Fabrics",
        "category": "fabric",
        "website": "https://www.jffabrics.com",
        "notes": "Contemporary and traditional fabrics"
    },
    {
        "name": "4 Spaces",
        "category": "fabric",
        "website": "https://www.4-spaces.com",
        "notes": "Indoor/outdoor performance fabrics"
    },
    {
        "name": "Anna Elisabeth",
        "category": "fabric",
        "website": "https://www.annaelisabeth.com",
        "notes": "Luxury European fabrics"
    },
    {
        "name": "Barrow Industries",
        "category": "fabric",
        "website": "https://www.barrowindustries.com",
        "notes": "Traditional and contemporary fabrics"
    },
    {
        "name": "Alexandra Brook",
        "category": "fabric",
        "website": "https://www.alexandrabrook.com",
        "notes": "Designer fabric collections"
    },
    {
        "name": "Stout Fabrics",
        "category": "fabric",
        "website": "https://www.stoutfabrics.com",
        "notes": "Performance and decorative fabrics"
    },
    {
        "name": "Sunbrella",
        "category": "fabric",
        "website": "https://www.sunbrella.com",
        "notes": "Indoor/outdoor performance fabrics - stain resistant"
    },
    {
        "name": "Bernhardt",
        "category": "fabric",
        "website": "https://www.bernhardt.com",
        "notes": "Luxury furniture and fabric collections"
    },
    {
        "name": "Rowe Furniture",
        "category": "fabric",
        "website": "https://www.rowefurniture.com",
        "notes": "Custom upholstery and fabric selection"
    },
    {
        "name": "Gabby Home",
        "category": "fabric",
        "website": "https://www.gabbyhome.com",
        "notes": "French-inspired furniture and fabrics"
    },
    {
        "name": "Uttermost",
        "category": "fabric",
        "website": "https://www.uttermost.com",
        "notes": "Accent furniture and fabric collections"
    },
    {
        "name": "Revelation",
        "category": "fabric",
        "website": "https://www.revelationhome.com",
        "notes": "Designer fabric and furniture"
    },
    {
        "name": "Schumacher",
        "category": "fabric",
        "website": "https://www.fschumacher.com",
        "notes": "Luxury designer fabrics since 1889"
    },
    {
        "name": "Robert Allen",
        "category": "fabric",
        "website": "https://www.robertallendesign.com",
        "notes": "Contemporary and traditional fabrics"
    },
    {
        "name": "Duralee",
        "category": "fabric",
        "website": "https://www.duralee.com",
        "notes": "Highland Court, Bailey & Griffin collections"
    },
]

# ============================================
# WALLPAPER VENDORS AND MATERIALS
# ============================================
WALLPAPER_VENDORS = [
    {
        "name": "York Wallcoverings",
        "category": "wallpaper",
        "website": "https://www.yorkwallcoverings.com",
        "notes": "America's oldest wallpaper company - traditional to contemporary"
    },
    {
        "name": "Phillip Jeffries",
        "category": "wallpaper",
        "website": "https://www.phillipjeffries.com",
        "notes": "Natural materials - grasscloth, hemp, silk"
    },
    {
        "name": "Kravet Wallcoverings",
        "category": "wallpaper",
        "website": "https://www.kravet.com/wallcovering",
        "notes": "Designer wallpaper collections"
    },
    {
        "name": "Thibaut",
        "category": "wallpaper",
        "website": "https://www.thibautdesign.com",
        "notes": "Classic American wallpaper company"
    },
    {
        "name": "Cole & Son",
        "category": "wallpaper",
        "website": "https://www.cole-and-son.com",
        "notes": "British heritage - iconic patterns"
    },
    {
        "name": "Scalamandré",
        "category": "wallpaper",
        "website": "https://www.scalamandre.com",
        "notes": "Luxury heritage wallcoverings"
    },
    {
        "name": "Brewster Home Fashions",
        "category": "wallpaper",
        "website": "https://www.brewsterwallcovering.com",
        "notes": "Wide range of styles and price points"
    },
]

# ============================================
# HARDWARE VENDORS
# ============================================
HARDWARE_VENDORS = [
    {
        "name": "Delta Faucet",
        "category": "hardware",
        "website": "https://www.deltafaucet.com",
        "notes": "Kitchen and bath faucets, Touch2O technology"
    },
    {
        "name": "Kohler",
        "category": "hardware",
        "website": "https://www.kohler.com",
        "notes": "Premium kitchen and bath fixtures"
    },
    {
        "name": "Emtek",
        "category": "hardware",
        "website": "https://www.emtek.com",
        "notes": "Door hardware, cabinet hardware - customizable"
    },
    {
        "name": "Top Knobs",
        "category": "hardware",
        "website": "https://www.topknobs.com",
        "notes": "Cabinet hardware - knobs, pulls, handles"
    },
    {
        "name": "Moen",
        "category": "hardware",
        "website": "https://www.moen.com",
        "notes": "Kitchen and bath faucets"
    },
    {
        "name": "Brizo",
        "category": "hardware",
        "website": "https://www.brizo.com",
        "notes": "Luxury kitchen and bath fixtures"
    },
    {
        "name": "Grohe",
        "category": "hardware",
        "website": "https://www.grohe.com",
        "notes": "German engineering - kitchen and bath"
    },
    {
        "name": "Hansgrohe",
        "category": "hardware",
        "website": "https://www.hansgrohe-usa.com",
        "notes": "Axor luxury line - innovative designs"
    },
    {
        "name": "Newport Brass",
        "category": "hardware",
        "website": "https://www.newportbrass.com",
        "notes": "Luxury solid brass fixtures"
    },
    {
        "name": "Rohl",
        "category": "hardware",
        "website": "https://www.rohlhome.com",
        "notes": "European-style fixtures"
    },
    {
        "name": "Waterworks",
        "category": "hardware",
        "website": "https://www.waterworks.com",
        "notes": "Ultra-luxury bath fixtures"
    },
    {
        "name": "Schaub + Company",
        "category": "hardware",
        "website": "https://www.?"schaubandcompany.com",
        "notes": "Cabinet hardware specialist"
    },
    {
        "name": "Baldwin Hardware",
        "category": "hardware",
        "website": "https://www.baldwinhardware.com",
        "notes": "Door hardware - solid brass"
    },
    {
        "name": "Rocky Mountain Hardware",
        "category": "hardware",
        "website": "https://www.?"rockymountainhardware.com",
        "notes": "Bronze hardware - handcrafted in USA"
    },
]

# ============================================
# APPLIANCE VENDORS
# ============================================
APPLIANCE_VENDORS = [
    {
        "name": "Wolf",
        "category": "appliances",
        "website": "https://www.subzero-wolf.com",
        "notes": "Professional-grade ranges and ovens"
    },
    {
        "name": "Sub-Zero",
        "category": "appliances",
        "website": "https://www.subzero-wolf.com",
        "notes": "Premium refrigeration"
    },
    {
        "name": "KitchenAid",
        "category": "appliances",
        "website": "https://www.kitchenaid.com",
        "notes": "Iconic stand mixers and appliances"
    },
    {
        "name": "Jenn-Air",
        "category": "appliances",
        "website": "https://www.jennair.com",
        "notes": "Luxury cooking appliances"
    },
    {
        "name": "Frigidaire",
        "category": "appliances",
        "website": "https://www.frigidaire.com",
        "notes": "Full range of kitchen appliances"
    },
    {
        "name": "Viking",
        "category": "appliances",
        "website": "https://www.?"
        "notes": "Professional-style appliances"
    },
    {
        "name": "Thermador",
        "category": "appliances",
        "website": "https://www.thermador.com",
        "notes": "German engineering - luxury appliances"
    },
    {
        "name": "Miele",
        "category": "appliances",
        "website": "https://www.mieleusa.com",
        "notes": "German quality - built to last"
    },
    {
        "name": "Bosch",
        "category": "appliances",
        "website": "https://www.bosch-home.com",
        "notes": "Quiet dishwashers, reliable appliances"
    },
    {
        "name": "GE Profile",
        "category": "appliances",
        "website": "https://www.?"
        "notes": "Smart home integration"
    },
    {
        "name": "Dacor",
        "category": "appliances",
        "website": "https://www.dacor.com",
        "notes": "California luxury appliances"
    },
    {
        "name": "Fisher & Paykel",
        "category": "appliances",
        "website": "https://www.?"
        "notes": "New Zealand innovation"
    },
    {
        "name": "Gaggenau",
        "category": "appliances",
        "website": "https://www.?"
        "notes": "Ultra-luxury German appliances"
    },
    {
        "name": "BlueStar",
        "category": "appliances",
        "website": "https://www.?"
        "notes": "Custom color ranges"
    },
    {
        "name": "La Cornue",
        "category": "appliances",
        "website": "https://www.?"
        "notes": "French artisan ranges"
    },
]

# ============================================
# TILE VENDORS
# ============================================
TILE_VENDORS = [
    {
        "name": "Ann Sacks",
        "category": "tile",
        "website": "https://www.?"
        "notes": "Luxury stone and tile"
    },
    {
        "name": "Walker Zanger",
        "category": "tile",
        "website": "https://www.?"
        "notes": "Artisan tile and stone"
    },
    {
        "name": "Artistic Tile",
        "category": "tile",
        "website": "https://www.?"
        "notes": "Designer tile collections"
    },
    {
        "name": "Daltile",
        "category": "tile",
        "website": "https://www.daltile.com",
        "notes": "Wide range - porcelain, ceramic, stone"
    },
    {
        "name": "Clé Tile",
        "category": "tile",
        "website": "https://www.?"
        "notes": "Zellige and cement tiles"
    },
    {
        "name": "Fireclay Tile",
        "category": "tile",
        "website": "https://www.?"
        "notes": "Handcrafted ceramic tile"
    },
    {
        "name": "Jeffrey Court",
        "category": "tile",
        "website": "https://www.jeffreycourt.com",
        "notes": "Natural stone and glass"
    },
    {
        "name": "Emser Tile",
        "category": "tile",
        "website": "https://www.?"
        "notes": "Natural stone and porcelain"
    },
    {
        "name": "Porcelanosa",
        "category": "tile",
        "website": "https://www.?"
        "notes": "Spanish luxury tile"
    },
    {
        "name": "MSI",
        "category": "tile",
        "website": "https://www.msisurfaces.com",
        "notes": "Quartz, natural stone, tile"
    },
    {
        "name": "Bedrosians",
        "category": "tile",
        "website": "https://www.?"
        "notes": "Tile and stone - since 1948"
    },
    {
        "name": "The Tile Shop",
        "category": "tile",
        "website": "https://www.?"
        "notes": "Wide retail selection"
    },
]

# ============================================
# PAINT COLORS - Benjamin Moore
# ============================================
BENJAMIN_MOORE_COLORS = [
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
    {"name": "Wickham Gray", "code": "HC-171", "hex": "#C7C4BA"},
    {"name": "Chelsea Gray", "code": "HC-168", "hex": "#8C8984"},
    {"name": "Kendall Charcoal", "code": "HC-166", "hex": "#686763"},
    {"name": "Hale Navy", "code": "HC-154", "hex": "#3E4B59"},
    {"name": "Newburyport Blue", "code": "HC-155", "hex": "#4E5B67"},
    {"name": "Van Deusen Blue", "code": "HC-156", "hex": "#486983"},
    {"name": "Gentleman's Gray", "code": "2062-20", "hex": "#3B4557"},
    {"name": "Black Panther", "code": "2125-10", "hex": "#393D3F"},
    {"name": "Onyx", "code": "2133-10", "hex": "#383838"},
    {"name": "Tricorn Black", "code": "2131-10", "hex": "#343434"},
    {"name": "Sea Salt", "code": "2040-50", "hex": "#D1D8D8"},
    {"name": "Palladian Blue", "code": "HC-144", "hex": "#B5C5C1"},
    {"name": "Wythe Blue", "code": "HC-143", "hex": "#A8BEB3"},
    {"name": "Aegean Teal", "code": "2136-40", "hex": "#79A6A5"},
    {"name": "Smoke", "code": "2122-40", "hex": "#C2C6C9"},
    {"name": "Silver Chain", "code": "1472", "hex": "#C0BDB6"},
    {"name": "Nimbus", "code": "1465", "hex": "#DCDAD6"},
]

# ============================================
# PAINT COLORS - Sherwin Williams
# ============================================
SHERWIN_WILLIAMS_COLORS = [
    {"name": "Alabaster", "code": "SW 7008", "hex": "#F2EDE3"},
    {"name": "Pure White", "code": "SW 7005", "hex": "#F1EDE6"},
    {"name": "Extra White", "code": "SW 7006", "hex": "#F1F0EA"},
    {"name": "Snowbound", "code": "SW 7004", "hex": "#EFEEE9"},
    {"name": "Greek Villa", "code": "SW 7551", "hex": "#F3EDE2"},
    {"name": "Repose Gray", "code": "SW 7015", "hex": "#C2BDB3"},
    {"name": "Agreeable Gray", "code": "SW 7029", "hex": "#CEC8BC"},
    {"name": "Accessible Beige", "code": "SW 7036", "hex": "#CFC5B5"},
    {"name": "Mindful Gray", "code": "SW 7016", "hex": "#B4AFA5"},
    {"name": "Amazing Gray", "code": "SW 7044", "hex": "#A9A198"},
    {"name": "Dorian Gray", "code": "SW 7017", "hex": "#A19D94"},
    {"name": "Colonnade Gray", "code": "SW 7641", "hex": "#BDB6A9"},
    {"name": "Worldly Gray", "code": "SW 7043", "hex": "#BDB7AC"},
    {"name": "Passive", "code": "SW 7064", "hex": "#C8C5C0"},
    {"name": "Sea Salt", "code": "SW 6204", "hex": "#C8D3CD"},
    {"name": "Comfort Gray", "code": "SW 6205", "hex": "#B5C4BB"},
    {"name": "Rainwashed", "code": "SW 6211", "hex": "#BFD1C8"},
    {"name": "Silvermist", "code": "SW 7621", "hex": "#C1CDCA"},
    {"name": "Naval", "code": "SW 6244", "hex": "#323B4C"},
    {"name": "Cyberspace", "code": "SW 7076", "hex": "#4E5358"},
    {"name": "Iron Ore", "code": "SW 7069", "hex": "#4E4C4A"},
    {"name": "Peppercorn", "code": "SW 7674", "hex": "#5D5B5A"},
    {"name": "Urbane Bronze", "code": "SW 7048", "hex": "#544D43"},
    {"name": "Black Magic", "code": "SW 6991", "hex": "#3B3A39"},
    {"name": "Tricorn Black", "code": "SW 6258", "hex": "#2E2E2E"},
    {"name": "Snowfall", "code": "SW 6000", "hex": "#EFEDE6"},
    {"name": "Natural Choice", "code": "SW 7011", "hex": "#E4DDD0"},
    {"name": "Kilim Beige", "code": "SW 6106", "hex": "#C8B8A3"},
    {"name": "Creamy", "code": "SW 7012", "hex": "#EDE5D4"},
    {"name": "Dover White", "code": "SW 6385", "hex": "#F0EAE1"},
]

# ============================================
# PAINT COLORS - Farrow & Ball
# ============================================
FARROW_BALL_COLORS = [
    {"name": "All White", "code": "No.2005", "hex": "#FEFEFD"},
    {"name": "Pointing", "code": "No.2003", "hex": "#F9F4E8"},
    {"name": "White Tie", "code": "No.2002", "hex": "#F5F0E1"},
    {"name": "Wimborne White", "code": "No.239", "hex": "#F3EFE1"},
    {"name": "Slipper Satin", "code": "No.2004", "hex": "#EDE8DA"},
    {"name": "Skimming Stone", "code": "No.241", "hex": "#E0D8C8"},
    {"name": "Elephant's Breath", "code": "No.229", "hex": "#C9C0B5"},
    {"name": "Pavilion Gray", "code": "No.242", "hex": "#B7B4A8"},
    {"name": "Manor House Gray", "code": "No.265", "hex": "#A5A093"},
    {"name": "Lamp Room Gray", "code": "No.88", "hex": "#8A887D"},
    {"name": "Down Pipe", "code": "No.26", "hex": "#5B5D5E"},
    {"name": "Railings", "code": "No.31", "hex": "#3B3B3B"},
    {"name": "Pitch Black", "code": "No.256", "hex": "#2A2A2A"},
    {"name": "Off-Black", "code": "No.57", "hex": "#353535"},
    {"name": "Hague Blue", "code": "No.30", "hex": "#3E5265"},
    {"name": "Stiffkey Blue", "code": "No.281", "hex": "#3E4C5C"},
    {"name": "Inchyra Blue", "code": "No.289", "hex": "#4C5355"},
    {"name": "De Nimes", "code": "No.299", "hex": "#697B87"},
    {"name": "Oval Room Blue", "code": "No.85", "hex": "#8DA4AA"},
    {"name": "Light Blue", "code": "No.22", "hex": "#9CB4BC"},
    {"name": "Teresa's Green", "code": "No.236", "hex": "#A5B4A5"},
    {"name": "Vert de Terre", "code": "No.234", "hex": "#C3C7B8"},
    {"name": "Cooking Apple Green", "code": "No.32", "hex": "#BCC4A7"},
    {"name": "Card Room Green", "code": "No.79", "hex": "#6D7158"},
    {"name": "Studio Green", "code": "No.93", "hex": "#525C4F"},
]

# ============================================
# PAINT COLORS - Behr
# ============================================
BEHR_COLORS = [
    {"name": "Ultra Pure White", "code": "PPU18-06", "hex": "#FFFFFF"},
    {"name": "Polar Bear", "code": "PPU18-07", "hex": "#F2F2ED"},
    {"name": "Cameo White", "code": "PPU7-11", "hex": "#EBE6DA"},
    {"name": "Swiss Coffee", "code": "PPU5-12", "hex": "#EDE4D4"},
    {"name": "Cottage White", "code": "PPU7-12", "hex": "#EDE5D5"},
    {"name": "Gray Owl", "code": "PPU26-09", "hex": "#B8B5AB"},
    {"name": "Silver Drop", "code": "PPU26-11", "hex": "#C5C3BB"},
    {"name": "Classic Silver", "code": "PPU26-10", "hex": "#BDB9B1"},
    {"name": "Antique White", "code": "PPU5-11", "hex": "#E9E0CF"},
    {"name": "Blank Canvas", "code": "DC-003", "hex": "#EDE8DC"},
    {"name": "Creamy Mushroom", "code": "PPU5-13", "hex": "#E1D8C8"},
    {"name": "Wheat Bread", "code": "PPU4-13", "hex": "#D8CDBB"},
    {"name": "Perfect Taupe", "code": "PPU18-13", "hex": "#9E978B"},
    {"name": "Intellectual", "code": "PPU18-14", "hex": "#6B655C"},
    {"name": "Dark Pewter", "code": "PPU18-04", "hex": "#494541"},
    {"name": "Black Suede", "code": "PPU18-20", "hex": "#3A3835"},
    {"name": "Limousine Leather", "code": "PPU18-19", "hex": "#2E2C2A"},
    {"name": "Blueprint", "code": "S470-5", "hex": "#425E73"},
    {"name": "Dark Navy", "code": "PPU15-19", "hex": "#37414D"},
    {"name": "In The Navy", "code": "N510-7", "hex": "#2D3B4D"},
    {"name": "Juniper Ash", "code": "PPU12-16", "hex": "#6B7B72"},
    {"name": "Dark Everglade", "code": "PPU11-19", "hex": "#4A5A52"},
]

# ============================================
# LIGHTING VENDORS
# ============================================
LIGHTING_VENDORS = [
    {"name": "Visual Comfort", "category": "lighting", "website": "https://www.?"notes": "Designer lighting - Studio McGee, Kelly Wearstler"},
    {"name": "Currey and Company", "category": "lighting", "website": "https://www.?"notes": "Artisan chandeliers and lamps"},
    {"name": "Hudson Valley Lighting", "category": "lighting", "website": "https://www.?"notes": "Troy Lighting, Mitzi collections"},
    {"name": "Regina Andrew", "category": "lighting", "website": "https://www.?"notes": "Statement lighting pieces"},
    {"name": "Arteriors", "category": "lighting", "website": "https://www.?"notes": "Modern luxury lighting"},
    {"name": "Circa Lighting", "category": "lighting", "website": "https://www.?"notes": "Part of Visual Comfort"},
    {"name": "Progress Lighting", "category": "lighting", "website": "https://www.?"notes": "Wide range of styles"},
    {"name": "Kichler", "category": "lighting", "website": "https://www.?"notes": "Traditional to contemporary"},
    {"name": "Generation Lighting", "category": "lighting", "website": "https://www.?"notes": "Monte Carlo fans, Feiss"},
    {"name": "Hinkley Lighting", "category": "lighting", "website": "https://www.?"notes": "Indoor and outdoor lighting"},
    {"name": "Capital Lighting", "category": "lighting", "website": "https://www.?"notes": "Value-oriented designer styles"},
    {"name": "Savoy House", "category": "lighting", "website": "https://www.?"notes": "Classic and transitional"},
]

async def seed_vendors():
    """Seed all vendor records into master_materials for predictive text"""
    print("Seeding vendors...")
    
    all_vendors = (
        FABRIC_VENDORS + 
        WALLPAPER_VENDORS + 
        HARDWARE_VENDORS + 
        APPLIANCE_VENDORS + 
        TILE_VENDORS +
        LIGHTING_VENDORS
    )
    
    count = 0
    for vendor in all_vendors:
        # Check if already exists
        existing = await db.master_materials.find_one({
            "name": vendor["name"],
            "category": vendor["category"]
        })
        
        if not existing:
            material_dict = {
                "id": str(uuid.uuid4()),
                "name": vendor["name"],
                "category": vendor["category"],
                "manufacturer": vendor["name"],
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
                "notes": vendor.get("notes", ""),
                "tags": [vendor["category"], "vendor", vendor["name"].lower()],
                "website": vendor.get("website", ""),
                "is_vendor": True,
                "created_at": datetime.now(timezone.utc).isoformat(),
                "updated_at": datetime.now(timezone.utc).isoformat(),
                "used_in_projects": []
            }
            await db.master_materials.insert_one(material_dict)
            count += 1
    
    print(f"Seeded {count} vendors")
    return count

async def seed_paint_colors():
    """Seed all paint colors into master_materials"""
    print("Seeding paint colors...")
    
    all_paints = []
    
    # Benjamin Moore
    for color in BENJAMIN_MOORE_COLORS:
        all_paints.append({
            "manufacturer": "Benjamin Moore",
            **color
        })
    
    # Sherwin Williams
    for color in SHERWIN_WILLIAMS_COLORS:
        all_paints.append({
            "manufacturer": "Sherwin Williams",
            **color
        })
    
    # Farrow & Ball
    for color in FARROW_BALL_COLORS:
        all_paints.append({
            "manufacturer": "Farrow & Ball",
            **color
        })
    
    # Behr
    for color in BEHR_COLORS:
        all_paints.append({
            "manufacturer": "Behr",
            **color
        })
    
    count = 0
    for paint in all_paints:
        # Check if already exists
        existing = await db.master_materials.find_one({
            "name": paint["name"],
            "manufacturer": paint["manufacturer"],
            "category": "paint"
        })
        
        if not existing:
            material_dict = {
                "id": str(uuid.uuid4()),
                "name": paint["name"],
                "category": "paint",
                "manufacturer": paint["manufacturer"],
                "vendor": paint["manufacturer"],
                "sku": paint.get("code", ""),
                "color": paint["name"],
                "color_code": paint.get("hex", ""),
                "pattern": "",
                "width": None,
                "height": None,
                "repeat": None,
                "price_per_unit": None,
                "unit": "gallon",
                "lead_time": "",
                "photo_url": "",
                "photo_data": "",
                "notes": f"{paint['manufacturer']} {paint.get('code', '')}",
                "tags": ["paint", paint["manufacturer"].lower(), paint["name"].lower()],
                "is_paint_color": True,
                "hex_color": paint.get("hex", ""),
                "created_at": datetime.now(timezone.utc).isoformat(),
                "updated_at": datetime.now(timezone.utc).isoformat(),
                "used_in_projects": []
            }
            await db.master_materials.insert_one(material_dict)
            count += 1
    
    print(f"Seeded {count} paint colors")
    return count

async def seed_all():
    """Run all seeding functions"""
    print("=" * 50)
    print("SEEDING MASTER DATABASES")
    print("=" * 50)
    
    vendor_count = await seed_vendors()
    paint_count = await seed_paint_colors()
    
    print("=" * 50)
    print(f"COMPLETE: {vendor_count} vendors, {paint_count} paint colors")
    print("=" * 50)
    
    # Show totals
    total_materials = await db.master_materials.count_documents({})
    total_contacts = await db.master_contacts.count_documents({})
    
    print(f"Total master_materials: {total_materials}")
    print(f"Total master_contacts: {total_contacts}")
    
    return {
        "vendors": vendor_count,
        "paint_colors": paint_count,
        "total_materials": total_materials,
        "total_contacts": total_contacts
    }

if __name__ == "__main__":
    asyncio.run(seed_all())

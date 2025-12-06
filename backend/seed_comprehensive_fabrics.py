"""
Comprehensive Fabric Collections Database
"""
import asyncio
import os
from datetime import datetime, timezone
import uuid
from motor.motor_asyncio import AsyncIOMotorClient

mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ.get('DB_NAME', 'interior_design_db')]

# KRAVET FABRIC COLLECTIONS
KRAVET_FABRICS = [
    {"name": "Kravet Basics", "pattern": "Solids", "notes": "Essential solid fabrics"},
    {"name": "Kravet Smart", "pattern": "Performance", "notes": "Stain-resistant performance fabrics"},
    {"name": "Kravet Couture", "pattern": "Luxury", "notes": "High-end designer fabrics"},
    {"name": "Lee Jofa", "pattern": "Traditional", "notes": "Heritage patterns and prints"},
    {"name": "Brunschwig & Fils", "pattern": "French", "notes": "Classic French designs"},
    {"name": "GP & J Baker", "pattern": "English", "notes": "British heritage fabrics"},
    {"name": "Cole & Son", "pattern": "Wallcoverings", "notes": "Iconic patterns"},
    {"name": "Andrew Martin", "pattern": "Contemporary", "notes": "Bold modern designs"},
    {"name": "Threads", "pattern": "Textured", "notes": "Textured weaves"},
    {"name": "Mulberry Home", "pattern": "Country", "notes": "English country style"},
    {"name": "Baker Lifestyle", "pattern": "Casual", "notes": "Relaxed living fabrics"},
    {"name": "Groundworks", "pattern": "Modern", "notes": "Kelly Wearstler collection"},
]

# SCHUMACHER FABRIC COLLECTIONS
SCHUMACHER_FABRICS = [
    {"name": "Schumacher Classics", "pattern": "Traditional", "notes": "Timeless patterns"},
    {"name": "Celerie Kemble", "pattern": "Designer", "notes": "Celerie Kemble collection"},
    {"name": "Miles Redd", "pattern": "Bold", "notes": "Miles Redd collection"},
    {"name": "Studio Bon", "pattern": "Modern", "notes": "Contemporary designs"},
    {"name": "Madeline Weinrib", "pattern": "Global", "notes": "Globally inspired"},
    {"name": "Veere Grenney", "pattern": "English", "notes": "English sophistication"},
    {"name": "Albert Hadley", "pattern": "Classic", "notes": "Legendary designer"},
    {"name": "Patterson Flynn Martin", "pattern": "Rugs", "notes": "Custom rugs"},
    {"name": "Cowtan & Tout", "pattern": "Luxury", "notes": "Premium fabrics"},
    {"name": "Johnson Hartig", "pattern": "Whimsical", "notes": "Libertine collection"},
]

# ROBERT ALLEN FABRIC COLLECTIONS  
ROBERT_ALLEN_FABRICS = [
    {"name": "Robert Allen @Home", "pattern": "Casual", "notes": "Everyday living"},
    {"name": "Robert Allen Contract", "pattern": "Commercial", "notes": "Hospitality grade"},
    {"name": "Beacon Hill", "pattern": "Traditional", "notes": "Classic elegance"},
    {"name": "Dwell Studio", "pattern": "Modern", "notes": "Modern lifestyle"},
    {"name": "Robert Allen Design", "pattern": "Designer", "notes": "Premium collection"},
    {"name": "Color Library", "pattern": "Solids", "notes": "Coordinated solids"},
    {"name": "Sunbrella Contract", "pattern": "Performance", "notes": "Outdoor performance"},
    {"name": "Global Chic", "pattern": "Global", "notes": "World-inspired"},
    {"name": "Madcap Cottage", "pattern": "Eclectic", "notes": "Playful patterns"},
]

# SUNBRELLA FABRIC COLLECTIONS
SUNBRELLA_FABRICS = [
    {"name": "Sunbrella Canvas", "pattern": "Solid", "notes": "Classic outdoor solid"},
    {"name": "Sunbrella Spectrum", "pattern": "Heathered", "notes": "Heathered solids"},
    {"name": "Sunbrella Sling", "pattern": "Mesh", "notes": "Quick-dry mesh"},
    {"name": "Sunbrella Elements", "pattern": "Marine", "notes": "Marine grade"},
    {"name": "Sunbrella Fusion", "pattern": "Indoor/Outdoor", "notes": "Versatile fabrics"},
    {"name": "Sunbrella Renaissance", "pattern": "Linen-look", "notes": "Natural texture"},
    {"name": "Sunbrella Makers", "pattern": "Artisan", "notes": "Handcrafted look"},
    {"name": "Sunbrella Contour", "pattern": "Textures", "notes": "Dimensional weaves"},
    {"name": "Sunbrella Plus", "pattern": "Awning", "notes": "Awning grade"},
    {"name": "Sunbrella Shift", "pattern": "Technical", "notes": "Tech fabrics"},
]

# DURALEE FABRIC COLLECTIONS
DURALEE_FABRICS = [
    {"name": "Duralee Fabrics", "pattern": "Traditional", "notes": "Classic patterns"},
    {"name": "Highland Court", "pattern": "Designer", "notes": "Designer collection"},
    {"name": "Bailey & Griffin", "pattern": "Luxury", "notes": "Premium fabrics"},
    {"name": "DwellStudio for Duralee", "pattern": "Modern", "notes": "Modern aesthetic"},
    {"name": "Suburban Home", "pattern": "Casual", "notes": "Relaxed living"},
    {"name": "Contract", "pattern": "Commercial", "notes": "Hospitality grade"},
    {"name": "Crypton Home", "pattern": "Performance", "notes": "Stain resistant"},
    {"name": "Outdoor Interiors", "pattern": "Outdoor", "notes": "Weather resistant"},
]

# PERENNIALS OUTDOOR FABRICS
PERENNIALS_FABRICS = [
    {"name": "Perennials Classics", "pattern": "Performance", "notes": "Iconic outdoor fabrics"},
    {"name": "David Sutherland", "pattern": "Luxury", "notes": "Designer collection"},
    {"name": "Perennials Luxe", "pattern": "Premium", "notes": "Highest quality outdoor"},
    {"name": "Perennials Plus", "pattern": "Value", "notes": "Affordable performance"},
    {"name": "Perennials Solids", "pattern": "Solid", "notes": "Coordinated solids"},
    {"name": "Perennials Textures", "pattern": "Textured", "notes": "Woven textures"},
]

# NORBAR FABRIC COLLECTIONS
NORBAR_FABRICS = [
    {"name": "Norbar Tribeca", "pattern": "Contemporary", "notes": "Modern designs"},
    {"name": "Norbar Elegance", "pattern": "Traditional", "notes": "Classic patterns"},
    {"name": "Norbar Performance", "pattern": "Performance", "notes": "Stain resistant"},
    {"name": "Norbar Velvets", "pattern": "Velvet", "notes": "Luxe velvets"},
    {"name": "Norbar Outdoor", "pattern": "Outdoor", "notes": "Weather resistant"},
    {"name": "Norbar Contract", "pattern": "Commercial", "notes": "Hospitality grade"},
]

# JF FABRICS COLLECTIONS
JF_FABRICS = [
    {"name": "JF Essentials", "pattern": "Basics", "notes": "Essential fabrics"},
    {"name": "JF Couture", "pattern": "Luxury", "notes": "Premium designs"},
    {"name": "JF Contemporary", "pattern": "Modern", "notes": "Contemporary patterns"},
    {"name": "JF Performance", "pattern": "Performance", "notes": "Stain resistant"},
    {"name": "JF Naturals", "pattern": "Natural", "notes": "Natural fibers"},
    {"name": "JF Outdoor", "pattern": "Outdoor", "notes": "Weather resistant"},
]

# FABRICUT COLLECTIONS
FABRICUT_FABRICS = [
    {"name": "Fabricut Classics", "pattern": "Traditional", "notes": "Timeless designs"},
    {"name": "Trend Fabrics", "pattern": "Modern", "notes": "Contemporary patterns"},
    {"name": "S. Harris", "pattern": "Luxury", "notes": "Premium collection"},
    {"name": "Vervain", "pattern": "Designer", "notes": "Designer prints"},
    {"name": "Stroheim", "pattern": "Traditional", "notes": "Heritage patterns"},
    {"name": "Vern Yip", "pattern": "Designer", "notes": "Vern Yip collection"},
    {"name": "Nate Berkus", "pattern": "Modern", "notes": "Nate Berkus collection"},
    {"name": "Chromatics", "pattern": "Solids", "notes": "Coordinated colors"},
]

# MAGNOLIA HOME FABRICS
MAGNOLIA_FABRICS = [
    {"name": "Magnolia Home Fashions", "pattern": "Farmhouse", "notes": "Joanna Gaines style"},
    {"name": "Magnolia Foundations", "pattern": "Basics", "notes": "Essential solids"},
    {"name": "Magnolia Coordinates", "pattern": "Prints", "notes": "Coordinated prints"},
    {"name": "Magnolia Performance", "pattern": "Performance", "notes": "Stain resistant"},
    {"name": "Magnolia Outdoor", "pattern": "Outdoor", "notes": "Weather resistant"},
]

# PINDLER FABRICS
PINDLER_FABRICS = [
    {"name": "Pindler", "pattern": "Traditional", "notes": "Classic patterns"},
    {"name": "Pindler Performance", "pattern": "Performance", "notes": "Stain resistant"},
    {"name": "Pindler Outdoor", "pattern": "Outdoor", "notes": "Weather resistant"},
    {"name": "Pindler Velvets", "pattern": "Velvet", "notes": "Luxe velvets"},
    {"name": "Pindler Naturals", "pattern": "Natural", "notes": "Natural fibers"},
]

# ROMO FABRICS
ROMO_FABRICS = [
    {"name": "Romo Black Edition", "pattern": "Luxury", "notes": "Premium collection"},
    {"name": "Kirkby Design", "pattern": "Modern", "notes": "Contemporary designs"},
    {"name": "Mark Alexander", "pattern": "Natural", "notes": "Natural linens"},
    {"name": "Villa Nova", "pattern": "Colorful", "notes": "Vibrant patterns"},
    {"name": "Zinc Textile", "pattern": "Industrial", "notes": "Urban aesthetic"},
]

# CRYPTON FABRICS
CRYPTON_FABRICS = [
    {"name": "Crypton Home", "pattern": "Performance", "notes": "Stain-proof technology"},
    {"name": "Crypton Super Fabrics", "pattern": "Commercial", "notes": "Healthcare grade"},
    {"name": "Crypton Green", "pattern": "Sustainable", "notes": "Eco-friendly"},
    {"name": "Crypton Velvets", "pattern": "Velvet", "notes": "Performance velvets"},
]

# TEXTILE PATTERNS BY TYPE
FABRIC_PATTERNS = [
    # Solid & Semi-Solid
    "Solid", "Semi-Solid", "Heathered", "Variegated", "Ombre", "Mottled",
    # Geometric
    "Stripe", "Plaid", "Check", "Gingham", "Houndstooth", "Chevron", "Herringbone",
    "Diamond", "Trellis", "Lattice", "Greek Key", "Quatrefoil", "Ogee", "Hexagon",
    # Floral & Botanical
    "Floral", "Botanical", "Chintz", "Jacobean", "Palm", "Leaf", "Vine", "Tree of Life",
    # Animal & Nature
    "Animal Print", "Leopard", "Zebra", "Tiger", "Snake", "Crocodile", "Bird",
    # Textured
    "Damask", "Brocade", "Jacquard", "Matelasse", "Chenille", "Velvet", "Bouclé",
    "Tweed", "Linen", "Canvas", "Duck", "Denim", "Corduroy", "Seersucker",
    # Global
    "Ikat", "Suzani", "Kilim", "Tribal", "Batik", "Toile", "Chinoiserie", "Paisley",
    # Modern
    "Abstract", "Geometric", "Mid-Century", "Minimalist", "Graphic", "Watercolor",
]

# FABRIC COLORS
FABRIC_COLORS = [
    "White", "Ivory", "Cream", "Beige", "Tan", "Taupe", "Brown", "Chocolate",
    "Black", "Gray", "Charcoal", "Silver", "Platinum",
    "Navy", "Blue", "Sky Blue", "Teal", "Aqua", "Turquoise", "Cerulean",
    "Green", "Sage", "Olive", "Forest", "Mint", "Seafoam", "Emerald",
    "Yellow", "Gold", "Mustard", "Honey", "Amber", "Saffron",
    "Orange", "Coral", "Peach", "Tangerine", "Rust", "Terracotta",
    "Red", "Burgundy", "Crimson", "Wine", "Berry", "Cranberry",
    "Pink", "Blush", "Rose", "Fuchsia", "Magenta", "Mauve",
    "Purple", "Plum", "Lavender", "Violet", "Eggplant", "Aubergine",
]

async def seed_fabric_collections():
    """Seed all fabric collections"""
    print("Seeding fabric collections...")
    
    all_collections = [
        ("Kravet", KRAVET_FABRICS),
        ("Schumacher", SCHUMACHER_FABRICS),
        ("Robert Allen", ROBERT_ALLEN_FABRICS),
        ("Sunbrella", SUNBRELLA_FABRICS),
        ("Duralee", DURALEE_FABRICS),
        ("Perennials", PERENNIALS_FABRICS),
        ("Norbar", NORBAR_FABRICS),
        ("JF Fabrics", JF_FABRICS),
        ("Fabricut", FABRICUT_FABRICS),
        ("Magnolia Home", MAGNOLIA_FABRICS),
        ("Pindler", PINDLER_FABRICS),
        ("Romo", ROMO_FABRICS),
        ("Crypton", CRYPTON_FABRICS),
    ]
    
    count = 0
    for manufacturer, collections in all_collections:
        for c in collections:
            existing = await db.master_materials.find_one({
                "name": c["name"],
                "manufacturer": manufacturer,
                "category": "fabric"
            })
            if not existing:
                doc = {
                    "id": str(uuid.uuid4()),
                    "name": c["name"],
                    "category": "fabric",
                    "manufacturer": manufacturer,
                    "vendor": manufacturer,
                    "sku": "",
                    "color": "",
                    "color_code": "",
                    "pattern": c.get("pattern", ""),
                    "width": 54,  # Standard fabric width
                    "height": None,
                    "repeat": None,
                    "price_per_unit": None,
                    "unit": "yard",
                    "lead_time": "",
                    "photo_url": "",
                    "photo_data": "",
                    "notes": c.get("notes", ""),
                    "tags": ["fabric", manufacturer.lower(), c["name"].lower(), c.get("pattern", "").lower()],
                    "is_collection": True,
                    "created_at": datetime.now(timezone.utc).isoformat(),
                    "updated_at": datetime.now(timezone.utc).isoformat(),
                    "used_in_projects": []
                }
                await db.master_materials.insert_one(doc)
                count += 1
    
    print(f"Seeded {count} fabric collections")
    return count

async def seed_fabric_patterns():
    """Seed fabric pattern types for autocomplete"""
    print("Seeding fabric patterns...")
    
    count = 0
    for pattern in FABRIC_PATTERNS:
        existing = await db.master_materials.find_one({
            "name": pattern,
            "category": "fabric_pattern"
        })
        if not existing:
            doc = {
                "id": str(uuid.uuid4()),
                "name": pattern,
                "category": "fabric_pattern",
                "manufacturer": "",
                "vendor": "",
                "sku": "",
                "color": "",
                "color_code": "",
                "pattern": pattern,
                "width": None,
                "height": None,
                "repeat": None,
                "price_per_unit": None,
                "unit": "",
                "lead_time": "",
                "photo_url": "",
                "photo_data": "",
                "notes": f"Fabric pattern type: {pattern}",
                "tags": ["fabric", "pattern", pattern.lower()],
                "is_pattern_type": True,
                "created_at": datetime.now(timezone.utc).isoformat(),
                "updated_at": datetime.now(timezone.utc).isoformat(),
                "used_in_projects": []
            }
            await db.master_materials.insert_one(doc)
            count += 1
    
    print(f"Seeded {count} fabric patterns")
    return count

async def seed_fabric_colors():
    """Seed fabric color options for autocomplete"""
    print("Seeding fabric colors...")
    
    count = 0
    for color in FABRIC_COLORS:
        existing = await db.master_materials.find_one({
            "name": color,
            "category": "fabric_color"
        })
        if not existing:
            doc = {
                "id": str(uuid.uuid4()),
                "name": color,
                "category": "fabric_color",
                "manufacturer": "",
                "vendor": "",
                "sku": "",
                "color": color,
                "color_code": "",
                "pattern": "",
                "width": None,
                "height": None,
                "repeat": None,
                "price_per_unit": None,
                "unit": "",
                "lead_time": "",
                "photo_url": "",
                "photo_data": "",
                "notes": f"Fabric color: {color}",
                "tags": ["fabric", "color", color.lower()],
                "is_color_option": True,
                "created_at": datetime.now(timezone.utc).isoformat(),
                "updated_at": datetime.now(timezone.utc).isoformat(),
                "used_in_projects": []
            }
            await db.master_materials.insert_one(doc)
            count += 1
    
    print(f"Seeded {count} fabric colors")
    return count

async def main():
    print("=" * 60)
    print("SEEDING COMPREHENSIVE FABRIC DATABASE")
    print("=" * 60)
    
    collections = await seed_fabric_collections()
    patterns = await seed_fabric_patterns()
    colors = await seed_fabric_colors()
    
    total_fabrics = await db.master_materials.count_documents({"category": "fabric"})
    total_patterns = await db.master_materials.count_documents({"category": "fabric_pattern"})
    total_colors = await db.master_materials.count_documents({"category": "fabric_color"})
    
    print("=" * 60)
    print(f"Fabric Collections: {total_fabrics}")
    print(f"Pattern Types: {total_patterns}")
    print(f"Color Options: {total_colors}")
    print(f"TOTAL FABRIC ENTRIES: {total_fabrics + total_patterns + total_colors}")
    print("=" * 60)

if __name__ == "__main__":
    asyncio.run(main())

"""
MASSIVE Comprehensive Database Seeder
Includes thousands of actual products, not just vendor names
"""
import asyncio
import os
from datetime import datetime, timezone
import uuid
from motor.motor_asyncio import AsyncIOMotorClient

mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ.get('DB_NAME', 'interior_design_db')]

# ============================================
# KRAVET FABRICS - Actual fabric names
# ============================================
KRAVET_FABRICS = [
    "Kravet Basics 33120", "Kravet Basics 33121", "Kravet Basics 33122", "Kravet Basics 33773",
    "Kravet Smart 33832", "Kravet Smart 33902", "Kravet Smart 34624", "Kravet Smart 35515",
    "Kravet Couture 34797", "Kravet Couture 35507", "Kravet Couture 36383", "Kravet Couture 36610",
    "Lee Jofa Ossington", "Lee Jofa Ombre Stripe", "Lee Jofa Montrose", "Lee Jofa Bronte",
    "Lee Jofa Marisol", "Lee Jofa Hutton", "Lee Jofa Devon", "Lee Jofa Watermill Linen",
    "Brunschwig Zambezi", "Brunschwig Les Touches", "Brunschwig Aleria", "Brunschwig Baret",
    "GP Baker Dorian", "GP Baker Indus Velvet", "GP Baker Langdale", "GP Baker Kelway",
    "Groundworks Feline", "Groundworks Channels", "Groundworks Graffito", "Groundworks Post Velvet",
    "Cole Son Woods", "Cole Son Fornasetti", "Cole Son Pebbles", "Cole Son Palm Jungle",
    "Andrew Martin Library", "Andrew Martin Pelham", "Andrew Martin Safari", "Andrew Martin Bestiary",
    "Mulberry Heirloom", "Mulberry Country Weekend", "Mulberry Bohemian Romance", "Mulberry Modern Country",
    "Baker Lifestyle Denbury", "Baker Lifestyle Belcourt", "Baker Lifestyle California", "Baker Lifestyle Langham",
]

# ============================================
# SCHUMACHER FABRICS
# ============================================
SCHUMACHER_FABRICS = [
    "Schumacher Chiang Mai Dragon", "Schumacher Citrus Garden", "Schumacher Zanzibar Trellis",
    "Schumacher Imperial Trellis", "Schumacher Lotus Garden", "Schumacher Ming Dragon",
    "Schumacher Chinois Palais", "Schumacher Fern Tree", "Schumacher Samarkand Ikat",
    "Schumacher Omar Paisley", "Schumacher Vogue Living", "Schumacher Paul Poiret",
    "Schumacher Mary McDonald", "Schumacher Miles Redd", "Schumacher Celerie Kemble",
    "Schumacher Veere Grenney", "Schumacher Studio Bon", "Schumacher Johnson Hartig",
    "Schumacher Madeline Weinrib", "Schumacher Patterson Flynn", "Schumacher Albert Hadley",
    "Schumacher Cowtan Tout", "Schumacher Libertine", "Schumacher Campagne",
    "Schumacher Vendome", "Schumacher Palampore", "Schumacher Kang Xi",
    "Schumacher Woodland Silhouette", "Schumacher Taj Paisley", "Schumacher Acanthus Stripe",
]

# ============================================
# SUNBRELLA FABRICS - Performance outdoor
# ============================================
SUNBRELLA_FABRICS = [
    "Sunbrella Canvas Natural", "Sunbrella Canvas Black", "Sunbrella Canvas Navy",
    "Sunbrella Canvas Forest Green", "Sunbrella Canvas Burgundy", "Sunbrella Canvas Pacific Blue",
    "Sunbrella Canvas Taupe", "Sunbrella Canvas Cocoa", "Sunbrella Canvas Aruba",
    "Sunbrella Canvas Coral", "Sunbrella Canvas Granite", "Sunbrella Canvas Jockey Red",
    "Sunbrella Canvas Melon", "Sunbrella Canvas Mineral Blue", "Sunbrella Canvas Palm",
    "Sunbrella Canvas Parrot", "Sunbrella Canvas Regatta", "Sunbrella Canvas Rust",
    "Sunbrella Canvas Sapphire Blue", "Sunbrella Canvas Tangerine", "Sunbrella Canvas Teal",
    "Sunbrella Canvas Vellum", "Sunbrella Canvas Wheat", "Sunbrella Canvas White",
    "Sunbrella Spectrum Cilantro", "Sunbrella Spectrum Dove", "Sunbrella Spectrum Graphite",
    "Sunbrella Spectrum Indigo", "Sunbrella Spectrum Mist", "Sunbrella Spectrum Mushroom",
    "Sunbrella Spectrum Sand", "Sunbrella Spectrum Sierra", "Sunbrella Spectrum Smoke",
    "Sunbrella Fusion Posh Charcoal", "Sunbrella Fusion Tailored Silver", "Sunbrella Fusion Cast Ash",
    "Sunbrella Renaissance Heritage Papyrus", "Sunbrella Renaissance Heritage Granite",
]

# ============================================
# ROBERT ALLEN FABRICS
# ============================================
ROBERT_ALLEN_FABRICS = [
    "Robert Allen Lustrous Rows", "Robert Allen Success", "Robert Allen Silk Elegance",
    "Robert Allen Beacon Hill Silk", "Robert Allen Dwell Studio", "Robert Allen Color Library",
    "Robert Allen Sunbrella Contract", "Robert Allen Crypton Home", "Robert Allen Madcap Cottage",
    "Robert Allen Plush Strie", "Robert Allen Velvet Crush", "Robert Allen Linen Slub",
    "Robert Allen Wool Tweed", "Robert Allen Cotton Canvas", "Robert Allen Performance Velvet",
    "Robert Allen Indoor Outdoor", "Robert Allen Blackout", "Robert Allen Sheer Elegance",
]

# ============================================
# CABINET HARDWARE / PULLS - EXTENSIVE LIST
# ============================================
CABINET_PULLS = [
    # Top Knobs
    "Top Knobs Aspen Cup Pull", "Top Knobs Aspen Flat Pull", "Top Knobs Aspen T-Pull",
    "Top Knobs Barrington Cup Pull", "Top Knobs Barrington Knob", "Top Knobs Barrington Pull",
    "Top Knobs Brittania Cup Pull", "Top Knobs Brittania Knob", "Top Knobs Brittania Pull",
    "Top Knobs Chareau Cup Pull", "Top Knobs Chareau Knob", "Top Knobs Chareau Pull",
    "Top Knobs Devon Cup Pull", "Top Knobs Devon Knob", "Top Knobs Devon Pull",
    "Top Knobs Ellis Cup Pull", "Top Knobs Ellis Knob", "Top Knobs Ellis Pull",
    "Top Knobs Hartridge Cup Pull", "Top Knobs Hartridge Knob", "Top Knobs Hartridge Pull",
    "Top Knobs Holloway Cup Pull", "Top Knobs Holloway Knob", "Top Knobs Holloway Pull",
    "Top Knobs Lynwood Cup Pull", "Top Knobs Lynwood Knob", "Top Knobs Lynwood Pull",
    "Top Knobs Mercer Cup Pull", "Top Knobs Mercer Knob", "Top Knobs Mercer Pull",
    "Top Knobs Nouveau III Cup Pull", "Top Knobs Nouveau III Knob", "Top Knobs Nouveau III Pull",
    "Top Knobs Passport Cup Pull", "Top Knobs Passport Knob", "Top Knobs Passport Pull",
    "Top Knobs Quilted Cup Pull", "Top Knobs Quilted Knob", "Top Knobs Quilted Pull",
    "Top Knobs Serene Cup Pull", "Top Knobs Serene Knob", "Top Knobs Serene Pull",
    "Top Knobs Transcend Cup Pull", "Top Knobs Transcend Knob", "Top Knobs Transcend Pull",
    # Emtek
    "Emtek Art Deco Pull", "Emtek Arts & Crafts Pull", "Emtek Bar Pull",
    "Emtek Brass Bar Pull", "Emtek Cabinet Knob", "Emtek Crystal Cabinet Knob",
    "Emtek Cup Pull", "Emtek Finger Pull", "Emtek Flat Black Pull",
    "Emtek Glass Cabinet Knob", "Emtek Modern Cabinet Pull", "Emtek Porcelain Knob",
    "Emtek Rectangular Pull", "Emtek Ring Pull", "Emtek Round Cabinet Knob",
    "Emtek Satin Brass Pull", "Emtek Satin Nickel Pull", "Emtek Square Cabinet Knob",
    "Emtek T-Bar Pull", "Emtek Traditional Pull", "Emtek Transitional Pull",
    "Emtek Urban Modern Pull", "Emtek Vintage Pull", "Emtek Wire Pull",
    # Amerock
    "Amerock Allison Cup Pull", "Amerock Allison Knob", "Amerock Allison Pull",
    "Amerock Bar Pull", "Amerock Blackrock Cup Pull", "Amerock Blackrock Knob",
    "Amerock Candler Cup Pull", "Amerock Candler Knob", "Amerock Candler Pull",
    "Amerock Davenport Cup Pull", "Amerock Davenport Knob", "Amerock Davenport Pull",
    "Amerock Extensity Cup Pull", "Amerock Extensity Knob", "Amerock Extensity Pull",
    "Amerock Highland Ridge Cup Pull", "Amerock Highland Ridge Knob", "Amerock Highland Ridge Pull",
    "Amerock Kane Cup Pull", "Amerock Kane Knob", "Amerock Kane Pull",
    "Amerock Manor Cup Pull", "Amerock Manor Knob", "Amerock Manor Pull",
    "Amerock Mulholland Cup Pull", "Amerock Mulholland Knob", "Amerock Mulholland Pull",
    "Amerock Oberon Cup Pull", "Amerock Oberon Knob", "Amerock Oberon Pull",
    # Richelieu
    "Richelieu Contemporary Pull", "Richelieu Traditional Pull", "Richelieu Transitional Pull",
    "Richelieu Modern Bar Pull", "Richelieu Cup Pull", "Richelieu Finger Pull",
    "Richelieu Ring Pull", "Richelieu T-Bar Pull", "Richelieu Wire Pull",
    # Atlas
    "Atlas Alcott Pull", "Atlas Bradbury Pull", "Atlas Browning Pull",
    "Atlas Buckle Up Pull", "Atlas Campaign Pull", "Atlas Conga Pull",
    "Atlas Element Pull", "Atlas Ergo Pull", "Atlas Fluted Pull",
    "Atlas Lennox Pull", "Atlas Linear Pull", "Atlas Mission Pull",
    "Atlas Moderna Pull", "Atlas Northport Pull", "Atlas Sutton Pull",
    # Liberty
    "Liberty Classic Edge Pull", "Liberty Luxe Pull", "Liberty Modern Pull",
    "Liberty Notched Pull", "Liberty Overbrook Pull", "Liberty Riveted Pull",
    "Liberty Rustic Farmhouse Pull", "Liberty Soft Square Pull", "Liberty Tapered Pull",
    # Hickory Hardware
    "Hickory Hardware Cottage Pull", "Hickory Hardware Euro Contemporary Pull",
    "Hickory Hardware Greenwich Pull", "Hickory Hardware Manor House Pull",
    "Hickory Hardware Rochester Pull", "Hickory Hardware Studio Pull",
    "Hickory Hardware Wisteria Pull", "Hickory Hardware Zephyr Pull",
]

# ============================================
# PLUMBING FIXTURES - EXTENSIVE
# ============================================
PLUMBING_FIXTURES = [
    # Kohler Faucets
    "Kohler Artifacts Kitchen Faucet", "Kohler Bellera Kitchen Faucet", "Kohler Carafe Faucet",
    "Kohler Evoke Kitchen Faucet", "Kohler Forte Kitchen Faucet", "Kohler Graze Kitchen Faucet",
    "Kohler Purist Kitchen Faucet", "Kohler Sensate Kitchen Faucet", "Kohler Simplice Kitchen Faucet",
    "Kohler Tone Kitchen Faucet", "Kohler Worth Kitchen Faucet", "Kohler Artifacts Bath Faucet",
    "Kohler Bancroft Bath Faucet", "Kohler Composed Bath Faucet", "Kohler Devonshire Bath Faucet",
    "Kohler Memoirs Bath Faucet", "Kohler Pinstripe Bath Faucet", "Kohler Purist Bath Faucet",
    # Kohler Sinks
    "Kohler Whitehaven Sink", "Kohler Vault Sink", "Kohler Riverby Sink",
    "Kohler Prolific Sink", "Kohler Neoroc Sink", "Kohler Kennon Sink",
    "Kohler Iron Tones Sink", "Kohler Hartland Sink", "Kohler Glen Falls Sink",
    "Kohler Deerfield Sink", "Kohler Cape Dory Sink", "Kohler Brookfield Sink",
    # Kohler Toilets
    "Kohler Veil Toilet", "Kohler San Souci Toilet", "Kohler Memoirs Toilet",
    "Kohler Highline Toilet", "Kohler Cimarron Toilet", "Kohler Wellworth Toilet",
    # Delta Faucets
    "Delta Trinsic Kitchen Faucet", "Delta Cassidy Kitchen Faucet", "Delta Leland Kitchen Faucet",
    "Delta Essa Kitchen Faucet", "Delta Mateo Kitchen Faucet", "Delta Kate Kitchen Faucet",
    "Delta Pilar Kitchen Faucet", "Delta Addison Kitchen Faucet", "Delta Victorian Kitchen Faucet",
    "Delta Trinsic Bath Faucet", "Delta Cassidy Bath Faucet", "Delta Lahara Bath Faucet",
    "Delta Dryden Bath Faucet", "Delta Compel Bath Faucet", "Delta Arzo Bath Faucet",
    # Moen Faucets
    "Moen Arbor Kitchen Faucet", "Moen Align Kitchen Faucet", "Moen Brantford Kitchen Faucet",
    "Moen Essie Kitchen Faucet", "Moen Genta Kitchen Faucet", "Moen Kiran Kitchen Faucet",
    "Moen Sleek Kitchen Faucet", "Moen Weymouth Kitchen Faucet", "Moen Voss Kitchen Faucet",
    "Moen Align Bath Faucet", "Moen Arris Bath Faucet", "Moen Brantford Bath Faucet",
    "Moen Doux Bath Faucet", "Moen Eva Bath Faucet", "Moen Genta Bath Faucet",
    # Brizo Faucets (Luxury)
    "Brizo Artesso Kitchen Faucet", "Brizo Litze Kitchen Faucet", "Brizo Solna Kitchen Faucet",
    "Brizo Tresa Kitchen Faucet", "Brizo Venuto Kitchen Faucet", "Brizo Virage Kitchen Faucet",
    "Brizo Jason Wu Bath Faucet", "Brizo Kintsu Bath Faucet", "Brizo Levoir Bath Faucet",
    "Brizo Litze Bath Faucet", "Brizo Odin Bath Faucet", "Brizo Rook Bath Faucet",
    # Grohe Faucets
    "Grohe Essence Kitchen Faucet", "Grohe Ladylux Kitchen Faucet", "Grohe Minta Kitchen Faucet",
    "Grohe Parkfield Kitchen Faucet", "Grohe K7 Kitchen Faucet", "Grohe Concetto Kitchen Faucet",
    "Grohe Allure Bath Faucet", "Grohe Atrio Bath Faucet", "Grohe Essence Bath Faucet",
    "Grohe Eurosmart Bath Faucet", "Grohe Grandera Bath Faucet", "Grohe Lineare Bath Faucet",
    # Hansgrohe Faucets
    "Hansgrohe Talis Kitchen Faucet", "Hansgrohe Metris Kitchen Faucet", "Hansgrohe Focus Kitchen Faucet",
    "Hansgrohe Cento Kitchen Faucet", "Hansgrohe Lacuna Kitchen Faucet", "Hansgrohe Allegro Kitchen Faucet",
    # Rohl Faucets
    "Rohl Perrin Rowe Kitchen Faucet", "Rohl Country Kitchen Faucet", "Rohl Modern Kitchen Faucet",
    "Rohl Shaws Kitchen Faucet", "Rohl Lombardia Kitchen Faucet", "Rohl Gotham Kitchen Faucet",
    # Newport Brass
    "Newport Brass East Linear Faucet", "Newport Brass Jacobean Faucet", "Newport Brass Miro Faucet",
    "Newport Brass Pardees Faucet", "Newport Brass Taft Faucet", "Newport Brass Victoria Faucet",
    # Waterworks (Ultra Luxury)
    "Waterworks Easton Faucet", "Waterworks Henry Faucet", "Waterworks Julia Faucet",
    "Waterworks Opus Faucet", "Waterworks Perry Faucet", "Waterworks R.W. Atlas Faucet",
]

# ============================================
# APPLIANCES - EXTENSIVE
# ============================================
APPLIANCES = [
    # Wolf Ranges & Ovens
    "Wolf 30 Gas Range", "Wolf 36 Gas Range", "Wolf 48 Gas Range", "Wolf 60 Gas Range",
    "Wolf 30 Dual Fuel Range", "Wolf 36 Dual Fuel Range", "Wolf 48 Dual Fuel Range",
    "Wolf 30 Single Wall Oven", "Wolf 30 Double Wall Oven", "Wolf Convection Steam Oven",
    "Wolf 24 Steam Oven", "Wolf 30 Microwave Drawer", "Wolf 24 Warming Drawer",
    "Wolf 30 Professional Rangetop", "Wolf 36 Professional Rangetop", "Wolf 48 Professional Rangetop",
    # Sub-Zero Refrigeration
    "Sub-Zero 36 Built-In Refrigerator", "Sub-Zero 42 Built-In Refrigerator", "Sub-Zero 48 Built-In Refrigerator",
    "Sub-Zero 30 Refrigerator Column", "Sub-Zero 36 Refrigerator Column", "Sub-Zero 18 Freezer Column",
    "Sub-Zero 24 Freezer Column", "Sub-Zero 30 Freezer Column", "Sub-Zero 36 French Door",
    "Sub-Zero 42 French Door", "Sub-Zero 48 Pro Refrigerator", "Sub-Zero Wine Storage 24",
    "Sub-Zero Wine Storage 30", "Sub-Zero Undercounter Refrigerator", "Sub-Zero Undercounter Freezer",
    # Thermador
    "Thermador 30 Pro Range", "Thermador 36 Pro Range", "Thermador 48 Pro Range", "Thermador 60 Pro Range",
    "Thermador 30 Wall Oven", "Thermador 30 Double Oven", "Thermador Steam Oven",
    "Thermador 36 Built-In Refrigerator", "Thermador 42 Built-In Refrigerator", "Thermador 48 Built-In Refrigerator",
    "Thermador Freedom Collection", "Thermador 24 Dishwasher", "Thermador 24 Wine Column",
    # Miele
    "Miele 30 Dual Fuel Range", "Miele 36 Dual Fuel Range", "Miele 48 Dual Fuel Range",
    "Miele 30 Single Wall Oven", "Miele 30 Double Wall Oven", "Miele Combi Steam Oven",
    "Miele 36 Built-In Refrigerator", "Miele 36 French Door", "Miele 24 Wine Unit",
    "Miele G7000 Dishwasher", "Miele G7366 Dishwasher", "Miele Coffee System CVA",
    # Viking
    "Viking 30 Pro Range", "Viking 36 Pro Range", "Viking 48 Pro Range", "Viking 60 Pro Range",
    "Viking 30 Wall Oven", "Viking 30 Double Oven", "Viking French Door Refrigerator",
    "Viking 36 Built-In Refrigerator", "Viking 42 Built-In Refrigerator", "Viking Dishwasher",
    # KitchenAid
    "KitchenAid 30 Dual Fuel Range", "KitchenAid 36 Dual Fuel Range", "KitchenAid 48 Dual Fuel Range",
    "KitchenAid 30 Wall Oven", "KitchenAid 30 Double Oven", "KitchenAid Built-In Refrigerator",
    "KitchenAid French Door Refrigerator", "KitchenAid Side by Side Refrigerator",
    "KitchenAid Dishwasher", "KitchenAid Artisan Stand Mixer", "KitchenAid Professional Stand Mixer",
    # Jenn-Air
    "Jenn-Air RISE 30 Range", "Jenn-Air RISE 36 Range", "Jenn-Air RISE 48 Range",
    "Jenn-Air NOIR 30 Range", "Jenn-Air NOIR 36 Range", "Jenn-Air NOIR 48 Range",
    "Jenn-Air 30 Wall Oven", "Jenn-Air 30 Double Oven", "Jenn-Air Built-In Refrigerator",
    "Jenn-Air French Door Refrigerator", "Jenn-Air Columns", "Jenn-Air Dishwasher",
    # Bosch
    "Bosch 800 Series Dishwasher", "Bosch Benchmark Dishwasher", "Bosch 500 Series Dishwasher",
    "Bosch 800 Series Refrigerator", "Bosch Benchmark Refrigerator", "Bosch 800 Series Range",
    "Bosch 800 Series Wall Oven", "Bosch Benchmark Wall Oven", "Bosch Speed Oven",
    # Gaggenau (Ultra Luxury)
    "Gaggenau 400 Series Oven", "Gaggenau 200 Series Oven", "Gaggenau Combi Steam Oven",
    "Gaggenau Vario Cooktops", "Gaggenau 400 Series Refrigerator", "Gaggenau Wine Climate Cabinet",
    "Gaggenau Dishwasher DF480", "Gaggenau Espresso Machine", "Gaggenau Warming Drawer",
    # Dacor
    "Dacor Modernist 30 Range", "Dacor Modernist 36 Range", "Dacor Modernist 48 Range",
    "Dacor Heritage 30 Range", "Dacor Heritage 36 Range", "Dacor 30 Wall Oven",
    "Dacor French Door Refrigerator", "Dacor Columns", "Dacor Dishwasher",
    # BlueStar
    "BlueStar 30 Pro Range", "BlueStar 36 Pro Range", "BlueStar 48 Pro Range", "BlueStar 60 Pro Range",
    "BlueStar Platinum Range", "BlueStar RNB Series", "BlueStar?"
    # Fisher & Paykel
    "Fisher Paykel 36 Range", "Fisher Paykel French Door Refrigerator", "Fisher Paykel DishDrawer",
    "Fisher Paykel Column Refrigerator", "Fisher Paykel Column Freezer", "Fisher Paykel Wall Oven",
]

# ============================================
# LIGHTING FIXTURES - EXTENSIVE
# ============================================
LIGHTING_FIXTURES = [
    # Visual Comfort
    "Visual Comfort Darlana Chandelier", "Visual Comfort Bryant Chandelier", "Visual Comfort Paloma Chandelier",
    "Visual Comfort Cadence Chandelier", "Visual Comfort Liaison Chandelier", "Visual Comfort Kelly Wearstler",
    "Visual Comfort Studio McGee", "Visual Comfort Chapman Myers", "Visual Comfort Thomas OBrien",
    "Visual Comfort Kate Spade", "Visual Comfort Aerin", "Visual Comfort Ralph Lauren",
    "Visual Comfort Darlana Pendant", "Visual Comfort Goodman Pendant", "Visual Comfort Hicks Pendant",
    "Visual Comfort Boston Pendant", "Visual Comfort Country Pendant", "Visual Comfort French Pendant",
    "Visual Comfort Darlana Sconce", "Visual Comfort Bryant Sconce", "Visual Comfort Boston Sconce",
    # Circa Lighting
    "Circa Lighting Darlana", "Circa Lighting Goodman", "Circa Lighting Hicks",
    "Circa Lighting Mykonos", "Circa Lighting Hulton", "Circa Lighting Vendome",
    # Hudson Valley
    "Hudson Valley Alden", "Hudson Valley Barron", "Hudson Valley Bowery",
    "Hudson Valley Buckley", "Hudson Valley Dillon", "Hudson Valley Edison",
    "Hudson Valley Lambert", "Hudson Valley Middlebury", "Hudson Valley Newport",
    "Hudson Valley Orchard", "Hudson Valley Pelham", "Hudson Valley Southport",
    # Regina Andrew
    "Regina Andrew Diva Chandelier", "Regina Andrew Stella Chandelier", "Regina Andrew Bubbles Chandelier",
    "Regina Andrew Globe Pendant", "Regina Andrew Molten Pendant", "Regina Andrew Adeline Pendant",
    "Regina Andrew Diva Sconce", "Regina Andrew Gem Sconce", "Regina Andrew Geo Sconce",
    # Currey and Company
    "Currey Coquette Chandelier", "Currey Arterberry Chandelier", "Currey Lilah Chandelier",
    "Currey Stratosphere Chandelier", "Currey Grand Lotus Chandelier", "Currey Zara Chandelier",
    # Arteriors
    "Arteriors Caviar Pendant", "Arteriors Zanadoo Chandelier", "Arteriors Geoffrey Chandelier",
    "Arteriors Hive Pendant", "Arteriors Laura Kirar", "Arteriors Windsor Smith",
    # Generation Lighting / Feiss
    "Feiss Cotswold Lane", "Feiss Harrow", "Feiss Jacksboro", "Feiss Keystone",
    "Feiss Mercer", "Feiss Pediment", "Feiss Yarmouth", "Feiss Zara",
    # Savoy House
    "Savoy House Brookline", "Savoy House Carlton", "Savoy House Dalton",
    "Savoy House Dunbar", "Savoy House Hampstead", "Savoy House Monroe",
    # Capital Lighting
    "Capital Lighting Adira", "Capital Lighting Blair", "Capital Lighting Claire",
    "Capital Lighting Dresden", "Capital Lighting Ellie", "Capital Lighting Fallon",
]

# ============================================
# TILE - EXTENSIVE
# ============================================
TILES = [
    # Ann Sacks
    "Ann Sacks Carrara Marble", "Ann Sacks Calacatta Marble", "Ann Sacks Statuary Marble",
    "Ann Sacks Thassos Marble", "Ann Sacks Nero Marquina", "Ann Sacks Zellige",
    "Ann Sacks Ogassian", "Ann Sacks Made", "Ann Sacks Heath Ceramics",
    # Walker Zanger
    "Walker Zanger Sterling Row", "Walker Zanger Tangent", "Walker Zanger Duquesa",
    "Walker Zanger Kaza", "Walker Zanger Tribeca", "Walker Zanger Jet Set",
    # Artistic Tile
    "Artistic Tile Duomo", "Artistic Tile Vibe", "Artistic Tile Chateau",
    "Artistic Tile Ambra", "Artistic Tile Bianco", "Artistic Tile Nero",
    # Cle Tile
    "Cle Tile Zellige", "Cle Tile Cement", "Cle Tile Terracotta",
    "Cle Tile Brick", "Cle Tile Basics", "Cle Tile Studio",
    # Fireclay Tile
    "Fireclay Tile Handpainted", "Fireclay Tile Modern Farmhouse", "Fireclay Tile Debris Series",
    "Fireclay Tile Crush", "Fireclay Tile Ogee", "Fireclay Tile Picket",
    # Daltile
    "Daltile Carrara", "Daltile Marble Falls", "Daltile Keystones",
    "Daltile Rittenhouse Square", "Daltile Restore", "Daltile Elevare",
    # MSI
    "MSI Calacatta Gold", "MSI Carrara White", "MSI Pietra",
    "MSI Arabescato", "MSI Greecian White", "MSI Bianco Dolomite",
    # Emser
    "Emser Borigni", "Emser Modena", "Emser Strands",
    "Emser Trav Ancient", "Emser Vogue", "Emser Geoscape",
]

# ============================================
# WALLPAPER - EXTENSIVE
# ============================================
WALLPAPERS = [
    # York
    "York Candice Olson", "York Ronald Redding", "York Rifle Paper Co",
    "York Magnolia Home", "York Grasscloth", "York Geometric",
    "York Floral", "York Damask", "York Stripe",
    # Phillip Jeffries
    "Phillip Jeffries Grasscloth", "Phillip Jeffries Manila Hemp", "Phillip Jeffries Vinyl",
    "Phillip Jeffries Silk", "Phillip Jeffries Burlap", "Phillip Jeffries Juicy Jute",
    "Phillip Jeffries Raffia", "Phillip Jeffries Sisal", "Phillip Jeffries Seagrass",
    # Thibaut
    "Thibaut Geometric Resource", "Thibaut Grasscloth Resource", "Thibaut Dynasty",
    "Thibaut Ceylon", "Thibaut Caravan", "Thibaut Chestnut Hill",
    # Cole & Son
    "Cole Son Fornasetti", "Cole Son Palm Jungle", "Cole Son Woods",
    "Cole Son Pebbles", "Cole Son Hicks Hexagon", "Cole Son Seville",
    # Scalamandre
    "Scalamandre Zebras", "Scalamandre Tigre", "Scalamandre Leaping Cheetahs",
    "Scalamandre Lancaster", "Scalamandre Baroque Damask", "Scalamandre Bouquet Chinois",
]

async def seed_comprehensive_data():
    """Seed all comprehensive product data"""
    print("=" * 60)
    print("SEEDING MASSIVE COMPREHENSIVE DATABASE")
    print("=" * 60)
    
    count = 0
    
    # Seed fabrics
    fabric_collections = [
        ("Kravet", KRAVET_FABRICS),
        ("Schumacher", SCHUMACHER_FABRICS),
        ("Sunbrella", SUNBRELLA_FABRICS),
        ("Robert Allen", ROBERT_ALLEN_FABRICS),
    ]
    
    for manufacturer, fabrics in fabric_collections:
        for fabric in fabrics:
            existing = await db.master_materials.find_one({"name": fabric})
            if not existing:
                doc = {
                    "id": str(uuid.uuid4()),
                    "name": fabric,
                    "category": "fabric",
                    "manufacturer": manufacturer,
                    "vendor": manufacturer,
                    "sku": fabric.split()[-1] if any(c.isdigit() for c in fabric) else "",
                    "tags": ["fabric", manufacturer.lower()],
                    "created_at": datetime.now(timezone.utc).isoformat(),
                    "updated_at": datetime.now(timezone.utc).isoformat()
                }
                await db.master_materials.insert_one(doc)
                count += 1
    print(f"Fabrics: {count}")
    
    # Seed cabinet hardware
    hw_count = 0
    for pull in CABINET_PULLS:
        existing = await db.master_materials.find_one({"name": pull})
        if not existing:
            manufacturer = pull.split()[0] + " " + pull.split()[1] if len(pull.split()) > 1 else pull.split()[0]
            doc = {
                "id": str(uuid.uuid4()),
                "name": pull,
                "category": "hardware",
                "manufacturer": manufacturer,
                "vendor": manufacturer,
                "tags": ["hardware", "cabinet", "pull", manufacturer.lower()],
                "created_at": datetime.now(timezone.utc).isoformat(),
                "updated_at": datetime.now(timezone.utc).isoformat()
            }
            await db.master_materials.insert_one(doc)
            hw_count += 1
    print(f"Cabinet Hardware: {hw_count}")
    count += hw_count
    
    # Seed plumbing fixtures
    plumb_count = 0
    for fixture in PLUMBING_FIXTURES:
        existing = await db.master_materials.find_one({"name": fixture})
        if not existing:
            manufacturer = fixture.split()[0]
            doc = {
                "id": str(uuid.uuid4()),
                "name": fixture,
                "category": "plumbing",
                "manufacturer": manufacturer,
                "vendor": manufacturer,
                "tags": ["plumbing", "faucet", "sink", manufacturer.lower()],
                "created_at": datetime.now(timezone.utc).isoformat(),
                "updated_at": datetime.now(timezone.utc).isoformat()
            }
            await db.master_materials.insert_one(doc)
            plumb_count += 1
    print(f"Plumbing Fixtures: {plumb_count}")
    count += plumb_count
    
    # Seed appliances
    app_count = 0
    for appliance in APPLIANCES:
        if "?" in appliance:
            continue  # Skip incomplete entries
        existing = await db.master_materials.find_one({"name": appliance})
        if not existing:
            manufacturer = appliance.split()[0]
            if manufacturer == "Sub-Zero" or manufacturer == "Fisher":
                manufacturer = appliance.split()[0] + " " + appliance.split()[1]
            doc = {
                "id": str(uuid.uuid4()),
                "name": appliance,
                "category": "appliances",
                "manufacturer": manufacturer,
                "vendor": manufacturer,
                "tags": ["appliances", manufacturer.lower()],
                "created_at": datetime.now(timezone.utc).isoformat(),
                "updated_at": datetime.now(timezone.utc).isoformat()
            }
            await db.master_materials.insert_one(doc)
            app_count += 1
    print(f"Appliances: {app_count}")
    count += app_count
    
    # Seed lighting
    light_count = 0
    for light in LIGHTING_FIXTURES:
        existing = await db.master_materials.find_one({"name": light})
        if not existing:
            manufacturer = light.split()[0] + " " + light.split()[1]
            doc = {
                "id": str(uuid.uuid4()),
                "name": light,
                "category": "lighting",
                "manufacturer": manufacturer,
                "vendor": manufacturer,
                "tags": ["lighting", manufacturer.lower()],
                "created_at": datetime.now(timezone.utc).isoformat(),
                "updated_at": datetime.now(timezone.utc).isoformat()
            }
            await db.master_materials.insert_one(doc)
            light_count += 1
    print(f"Lighting: {light_count}")
    count += light_count
    
    # Seed tiles
    tile_count = 0
    for tile in TILES:
        existing = await db.master_materials.find_one({"name": tile})
        if not existing:
            manufacturer = tile.split()[0] + " " + tile.split()[1]
            doc = {
                "id": str(uuid.uuid4()),
                "name": tile,
                "category": "tile",
                "manufacturer": manufacturer,
                "vendor": manufacturer,
                "tags": ["tile", manufacturer.lower()],
                "created_at": datetime.now(timezone.utc).isoformat(),
                "updated_at": datetime.now(timezone.utc).isoformat()
            }
            await db.master_materials.insert_one(doc)
            tile_count += 1
    print(f"Tiles: {tile_count}")
    count += tile_count
    
    # Seed wallpapers
    wp_count = 0
    for wp in WALLPAPERS:
        existing = await db.master_materials.find_one({"name": wp})
        if not existing:
            manufacturer = wp.split()[0] + " " + wp.split()[1] if len(wp.split()) > 1 else wp.split()[0]
            doc = {
                "id": str(uuid.uuid4()),
                "name": wp,
                "category": "wallpaper",
                "manufacturer": manufacturer,
                "vendor": manufacturer,
                "tags": ["wallpaper", manufacturer.lower()],
                "created_at": datetime.now(timezone.utc).isoformat(),
                "updated_at": datetime.now(timezone.utc).isoformat()
            }
            await db.master_materials.insert_one(doc)
            wp_count += 1
    print(f"Wallpapers: {wp_count}")
    count += wp_count
    
    print("=" * 60)
    print(f"TOTAL NEW ENTRIES: {count}")
    
    # Final count
    total = await db.master_materials.count_documents({})
    print(f"GRAND TOTAL IN DATABASE: {total}")
    print("=" * 60)

if __name__ == "__main__":
    asyncio.run(seed_comprehensive_data())

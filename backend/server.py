from fastapi import FastAPI, APIRouter, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import requests
from bs4 import BeautifulSoup
import asyncio
import re
from urllib.parse import urljoin, urlparse
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime
from enum import Enum
from playwright.async_api import async_playwright

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Set Playwright browser path
os.environ['PLAYWRIGHT_BROWSERS_PATH'] = '/pw-browsers'

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI(title="Interior Design Management System", version="1.0.0")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Room color constants - MORE MUTED
ROOM_COLORS = {
    "living room": "#7A5A8A",     # Muted purple
    "kitchen": "#5A6A5A", 
    "master bedroom": "#6A5A7A",
    "bedroom 2": "#7A5A5A",
    "bedroom 3": "#5A6A6A",
    "bathroom": "#5A5A7A",
    "master bathroom": "#6A4A4A",
    "powder room": "#4A6A6A",
    "dining room": "#7A6A8A",
    "office": "#4A5A5A",
    "family room": "#5A6A8A",
    "basement": "#8A7A5A",
    "laundry room": "#4A4A6A",
    "mudroom": "#5A6A4A",
    "pantry": "#8A8A5A",
    "closet": "#6A7A6A",
    "guest room": "#8A5A7A",
    "playroom": "#8A8A5A",
    "library": "#4A6A8A",
    "wine cellar": "#4A4A6A",
    "garage": "#6A7A4A",
    "patio": "#7A7A5A"
}

# Category colors - GREEN like your screenshots
CATEGORY_COLORS = {
    "lighting": "#5A7A5A",           # Muted green
    "furniture & storage": "#5A7A5A",
    "plumbing & fixtures": "#5A7A5A", 
    "decor & accessories": "#5A7A5A",
    "seating": "#5A7A5A",
    "equipment & furniture": "#5A7A5A",
    "misc.": "#5A7A5A",
    "flooring": "#5A7A5A"
}

# Sub-category colors - RED like your screenshots  
SUBCATEGORY_COLORS = {
    "installed": "#8A5A5A",      # Muted red
    "portable": "#8A5A5A",
    "molding": "#8A5A5A", 
    "wood": "#8A5A5A",
    "tile": "#8A5A5A",
    "carpet": "#8A5A5A",
    "concrete": "#8A5A5A"
}

# Professional Paint Color Catalog for Interior Design
PAINT_CATALOG = {
    'Sherwin Williams': {
        'Whites & Neutrals': ['Pure White (SW 7005)', 'Alabaster (SW 7008)', 'Creamy (SW 7012)', 'Natural Linen (SW 9109)', 'Accessible Beige (SW 7036)', 'Balanced Beige (SW 7037)', 'Diverse Beige (SW 6079)', 'Perfect Greige (SW 6073)', 'Agreeable Gray (SW 7029)', 'Repose Gray (SW 7015)', 'Mindful Gray (SW 7016)', 'Dorian Gray (SW 7017)', 'Cityscape (SW 7067)', 'Iron Ore (SW 7069)', 'Tricorn Black (SW 6258)'],
        'Warm Colors': ['Coral Reef (SW 6606)', 'Cavern Clay (SW 7701)', 'Accessible Beige (SW 7036)', 'Latte (SW 6108)', 'Safari (SW 7040)', 'Ramie (SW 6156)', 'Warm Stone (SW 7032)', 'Mushroom (SW 7737)', 'Tony Taupe (SW 7038)', 'Virtual Taupe (SW 7039)'],
        'Cool Colors': ['Sea Salt (SW 6204)', 'Rainwashed (SW 6211)', 'Misty (SW 6232)', 'Sleepy Blue (SW 6225)', 'Distance (SW 6243)', 'Krypton (SW 6247)', 'Storm Cloud (SW 6240)', 'Naval (SW 6244)', 'Indigo Batik (SW 7602)', 'In the Navy (SW 9178)'],
        'Popular Colors': ['Urbane Bronze (SW 7048)', 'Black Magic (SW 6991)', 'Dragon Fruit (SW 6855)', 'Oceanside (SW 6496)', 'Clary Sage (SW 6178)', 'Sage Green Light (SW 2851)', 'Evergreen Fog (SW 9130)', 'Olive Grove (SW 7734)', 'Rosemary (SW 2851)', 'Back Bay Green (SW 9140)']
    },
    'Benjamin Moore': {
        'Whites & Neutrals': ['White Dove (OC-17)', 'Cloud White (OC-130)', 'Chantilly Lace (OC-65)', 'Simply White (OC-117)', 'Swiss Coffee (OC-45)', 'Moonshine (OC-49)', 'Classic Gray (OC-23)', 'Edgecomb Gray (HC-173)', 'Revere Pewter (HC-172)', 'Stonington Gray (HC-170)', 'Nimbus Gray (2131-50)', 'Kendall Charcoal (HC-166)', 'Wrought Iron (2124-10)'],
        'Warm Colors': ['Hawthorne Yellow (HC-4)', 'Windham Cream (HC-6)', 'Putnam Ivory (HC-39)', 'Manchester Tan (HC-81)', 'Brandon Beige (2151-50)', 'Shaker Beige (HC-45)', 'Sandy Hook Gray (HC-108)', 'Bleeker Beige (HC-80)', 'Grant Beige (HC-83)', 'Natural Wicker (OC-13)'],
        'Cool Colors': ['Palladian Blue (HC-144)', 'Breath of Fresh Air (806)', 'Van Deusen Blue (HC-156)', 'Hale Navy (HC-154)', 'Newburyport Blue (HC-155)', 'Gentleman\'s Gray (2062-20)', 'Stratton Blue (HC-142)', 'Nimbus Gray (2131-50)', 'Gray Owl (OC-52)', 'Stonington Gray (HC-170)'],
        'Popular Colors': ['First Light (2102-70)', 'Morning Dew (2125-50)', 'Hunter Green (2041-10)', 'Forest Green (2047-10)', 'Caliente (AF-290)', 'Sedona Clay (2174-30)', 'Autumn Orange (2156-10)', 'Raspberry Blush (2008-30)', 'Lavender Mist (2070-60)', 'Amethyst Shadow (2067-40)']
    },
    'Farrow & Ball': {
        'Whites & Neutrals': ['All White (No.2005)', 'Pointing (No.2003)', 'Strong White (No.2001)', 'Wimborne White (No.239)', 'Slipper Satin (No.2004)', 'Skimming Stone (No.241)', 'Elephant\'s Breath (No.229)', 'Purbeck Stone (No.275)', 'London Clay (No.244)', 'Down Pipe (No.26)', 'Railings (No.31)', 'Off-Black (No.57)'],
        'Warm Colors': ['Setting Plaster (No.231)', 'Pink Ground (No.202)', 'Red Earth (No.64)', 'Picture Gallery Red (No.42)', 'Incarnadine (No.248)', 'Calamine (No.230)', 'Dead Salmon (No.28)', 'India Yellow (No.66)', 'Sudbury Yellow (No.51)', 'Citron (No.74)'],
        'Cool Colors': ['Borrowed Light (No.235)', 'Lulworth Blue (No.89)', 'Oval Room Blue (No.85)', 'Stiffkey Blue (No.281)', 'Hague Blue (No.30)', 'Inchyra Blue (No.289)', 'Stone Blue (No.86)', 'Parma Gray (No.27)', 'Pigeon (No.25)', 'Modern Eggshell'],
        'Popular Colors': ['Sulking Room Pink (No.295)', 'Nancy\'s Blushes (No.278)', 'Green Blue (No.84)', 'Card Room Green (No.79)', 'Calke Green (No.34)', 'Studio Green (No.93)', 'Bancha (No.298)', 'Treron (No.292)', 'Terre D\'Egypte (No.247)', 'Tanner\'s Brown (No.255)']
    }
}

# Professional Interior Design Room Structure with Complete Templates
ROOM_DEFAULT_STRUCTURE = {
    'living room': {
        'Lighting': {
            'INSTALLED': ['Chandelier', 'Recessed Lighting', 'Sconces', 'Track Lighting', 'Ceiling Fan w/ Light', 'Art Lights', 'Pendant Lights', 'Under Cabinet Lighting', 'Cove Lighting', 'Picture Lights'],
            'PORTABLE': ['Table Lamp', 'Floor Lamp', 'Accent Lamp', 'Desk Lamp', 'Buffet Lamp', 'Reading Lamp']
        },
        'Furniture': {
            'PIECE': ['Sofa', 'Sectional', 'Loveseat', 'Armchair', 'Accent Chair', 'Ottoman', 'Coffee Table', 'Side Table', 'Console Table', 'Media Console', 'Bookcase', 'Credenza', 'Display Cabinet', 'Bar Cart', 'Sofa Table', 'Storage Bench', 'Chaise Lounge', 'Daybed', 'Recliner', 'Storage Ottoman']
        },
        'Decor & Accessories': {
            'Misc.': ['Area Rug', 'Throw Pillows', 'Throw Blanket', 'Wall Art', 'Mirror', 'Decorative Vases', 'Sculptures', 'Candle Holders', 'Greenery/Plants', 'Curtains/Drapery', 'Sheer Curtains', 'Custom Shades', 'Fireplace Tools', 'Decorative Boxes', 'Trays', 'Photo Frames', 'Coasters']
        },
        'Paint, Wallpaper, and Finishes': {
            'Misc.': ['Paint color', 'Wallpaper', 'Finish']
        },
        'Millwork, Trim, and Architectural Elements': {
            'ARCHITECTURAL': ['Crown Molding', 'Baseboards', 'Chair Rails', 'Wainscoting', 'Built-in Columns', 'Coffered Ceilings', 'Tray Ceilings', 'Beam Work', 'Archways', 'Built-in Niches', 'Window Trim/Casings', 'Door Trim/Casings', 'Panel Molding', 'Ceiling Medallions']
        }
    },
    'dining room': {
        'Lighting': {
            'INSTALLED': ['Chandelier', 'Pendant Lights', 'Sconces', 'Recessed Lighting', 'Art Lights', 'Ceiling Medallion'],
            'PORTABLE': ['Buffet Lamp', 'Table Lamp']
        },
        'Furniture': {
            'PIECE': ['Dining Table', 'Dining Chairs', 'Host Chairs', 'Dining Bench', 'Buffet', 'Credenza', 'China Cabinet', 'Bar Cart', 'Console Table', 'Sideboard', 'Wine Cabinet']
        },
        'Decor & Accessories': {
            'MISC.': ['Area Rug', 'Wall Art', 'Mirror', 'Table Runner', 'Place Settings', 'Centerpiece', 'Curtains/Drapery', 'Sheer Curtains', 'Custom Shades', 'Decorative Bowls', 'Candle Holders', 'Serveware']
        },
        'Paint, Wallpaper, and Finishes': {
            'Misc.': ['Paint color', 'Wallpaper', 'Finish']
        },
        'Millwork, Trim, and Architectural Elements': {
            'ARCHITECTURAL': ['Crown Molding', 'Baseboards', 'Chair Rails', 'Wainscoting', 'Built-in Columns', 'Built-in Niches', 'Window Trim/Casings', 'Door Trim/Casings', 'Panel Molding']
        }
    },
    'kitchen': {
        'Lighting': {
            'INSTALLED': ['Pendant Lights (Island/Bar)', 'Recessed Lighting', 'Under Cabinet Lighting', 'Chandelier (Nook)', 'Sconces', 'Toe-Kick Lighting', 'Over-Cabinet Lighting', 'Pot Rack Light']
        },
        'Paint, Wallpaper, and Finishes': {
            'Misc.': ['Paint color', 'Wallpaper', 'Finish', 'Counter Tops']
        },
        'Appliances': {
            'UNIT': ['Refrigerator (Built-in/Freestanding)', 'Dishwasher', 'Range/Oven', 'Microwave (Built-in/Countertop)', 'Cooktop', 'Wall Oven (Single/Double)', 'Wine Fridge', 'Beverage Cooler', 'Ice Maker', 'Coffee Machine (Built-in)', 'Trash Compactor', 'Garbage Disposal', 'Vent Hood/Range Hood', 'Warming Drawer']
        },
        'Plumbing': {
            'FIXTURE': ['Kitchen Sink (Farmhouse/Undermount)', 'Prep Sink', 'Main Faucet', 'Prep Faucet', 'Pot Filler', 'Soap Dispenser (Built-in)', 'Water Filtration System']
        },
        'Furniture & Storage': {
            'PIECE': ['Bar Stools', 'Counter Stools', 'Kitchen Island', 'Pantry Cabinet', 'Breakfast Nook Table', 'Breakfast Nook Chairs/Bench', 'Shelving', 'Floating Shelves', 'Wine Rack (Built-in/Freestanding)', 'Cutting Board Storage', 'Pull-out Pantry', 'Spice Drawer']
        },
        'Decor & Accessories': {
            'MISC.': ['Area Rug/Runner', 'Wall Art', 'Decorative Bowls/Plates', 'Vases', 'Cookware Displays', 'Herb Garden', 'Curtains/Blinds/Shades', 'Dish Towels', 'Utensil Crocks', 'Fruit Bowls', 'Coffee Bar Accessories']
        },
        'Millwork, Trim, and Architectural Elements': {
            'ARCHITECTURAL': ['Crown Molding', 'Baseboards', 'Built-in Columns', 'Window Trim/Casings', 'Door Trim/Casings', 'Panel Molding']
        }
    },
    'primary bedroom': {
        'Lighting': {
            'INSTALLED': ['Chandelier/Ceiling Fixture', 'Recessed Lighting (Dimmable)', 'Sconces (Bedside)', 'Ceiling Fan w/ Light', 'Cove Lighting', 'Accent Lighting (Architectural)', 'Reading Lights (Wall Mounted)'],
            'PORTABLE': ['Nightstand Lamps', 'Floor Lamp', 'Dresser Lamp', 'Desk Lamp', 'Buffet Lamp', 'Reading Lamp']
        },
        'Paint, Wallpaper, and Finishes': {
            'Misc.': ['Paint color', 'Wallpaper', 'Finish']
        },
        'Furniture': {
            'PIECE': ['Bed Frame (King/Queen/Cal King)', 'Mattress', 'Box Spring/Foundation', 'Nightstands (Pair)', 'Dresser (Long/Tall)', 'Armoire', 'Vanity', 'Vanity Stool', 'Bench (Foot of Bed)', 'Seating Area Sofa/Chairs (Pair)', 'Coffee Table (Seating Area)', 'Bookcase', 'Media Console/TV Stand', 'Desk', 'Desk Chair', 'Chaise Lounge', 'Daybed', 'Recliner']
        },
        'Decor & Accessories': {
            'MISC.': ['Area Rug', 'Throw Pillows (Decorative)', 'Throw Blanket', 'Bedding Set (Duvet, Sheets, Shams)', 'Wall Art (Large Piece/Gallery)', 'Mirror (Full Length/Decorative)', 'Decorative Vases', 'Candles/Diffusers', 'Curtains/Drapery', 'Blackout Curtains', 'Sheer Curtains', 'Custom Shades (Roman/Roller)', 'Bedside Clock/Alarm', 'Trays (Nightstand/Dresser)', 'Jewelry Box', 'Plants/Faux Greenery']
        },
        'Millwork, Trim, and Architectural Elements': {
            'ARCHITECTURAL': ['Crown Molding', 'Baseboards', 'Chair Rails', 'Wainscoting', 'Built-in Columns', 'Coffered Ceilings', 'Tray Ceilings', 'Built-in Niches', 'Window Trim/Casings', 'Door Trim/Casings', 'Panel Molding']
        }
    },
    'primary bathroom': {
        'Lighting': {
            'INSTALLED': ['Vanity Lights (Over Mirror)', 'Sconces (Side of Mirror)', 'Recessed Lighting (Dimmable)', 'Shower Light', 'Toilet Area Light', 'Chandelier/Pendant (Freestanding Tub)', 'Exhaust Fan w/ Light', 'Under Vanity Lighting']
        },
        'Plumbing & Fixtures': {
            'FIXTURE': ['Vanity Sinks (Undermount/Vessel)', 'Vanity Faucets', 'Shower Head (Rainfall/Standard)', 'Handheld Shower', 'Body Jets', 'Shower Valve Trim', 'Freestanding Tub', 'Drop-in Tub', 'Tub Faucet (Deck Mount/Wall Mount)', 'Toilet', 'Bidet/Bidet Seat', 'Towel Warmer']
        },
        'Furniture & Storage': {
            'PIECE': ['Vanity Cabinet (Single/Double)', 'Linen Tower', 'Storage Cabinet', 'Accent Stool/Bench', 'Shower Bench (Built-in/Portable)', 'Hamper (Built-in/Freestanding)', 'Makeup Vanity/Desk']
        },
        'Decor & Accessories': {
            'MISC.': ['Vanity Mirrors (Framed/Frameless)', 'Full Length Mirror', 'Area Rug/Bath Mats', 'Towels (Bath/Hand/Washcloth)', 'Soap Dispensers', 'Toothbrush Holder', 'Tray Organizers', 'Wall Art', 'Shower Curtains/Glass Door', 'Toilet Paper Holder', 'Towel Bar/Ring/Hooks', 'Robe Hooks', 'Plants/Greenery', 'Waste Basket']
        },
        'Paint, Wallpaper, and Finishes': {
            'Misc.': ['Paint color', 'Wallpaper', 'Finish', 'Counter Tops']
        },
        'Millwork, Trim, and Architectural Elements': {
            'ARCHITECTURAL': ['Crown Molding', 'Baseboards', 'Wainscoting', 'Built-in Niches', 'Window Trim/Casings', 'Door Trim/Casings', 'Panel Molding']
        }
    },
    'powder bath': {
        'Lighting': {
            'INSTALLED': ['Vanity Light', 'Sconces', 'Recessed Lighting', 'Pendant Light', 'Exhaust Fan w/ Light']
        },
        'Paint, Wallpaper, and Finishes': {
            'Misc.': ['Paint color', 'Wallpaper', 'Finish', 'Counter Tops']
        },
        'Plumbing & Fixtures': {
            'FIXTURE': ['Pedestal Sink', 'Console Sink', 'Wall-mount Sink', 'Faucet', 'Toilet']
        },
        'Furniture & Storage': {
            'PIECE': ['Small Vanity Cabinet', 'Small Storage Cabinet', 'Accent Stool']
        },
        'Decor & Accessories': {
            'MISC.': ['Mirror (Decorative)', 'Wall Art', 'Small Area Rug/Bath Mat', 'Hand Towels', 'Soap Dispenser', 'Toilet Paper Holder', 'Towel Ring/Hooks', 'Waste Basket']
        },
        'Millwork, Trim, and Architectural Elements': {
            'ARCHITECTURAL': ['Crown Molding', 'Baseboards', 'Wainscoting', 'Window Trim/Casings', 'Door Trim/Casings']
        }
    },
    'laundry room': {
        'Lighting': {
            'INSTALLED': ['Flush Mount Light', 'Recessed Lighting', 'Task Lighting (over counter)', 'Utility Light', 'Under Cabinet Lighting']
        },
        'Appliances': {
            'UNIT': ['Washer (Front Load/Top Load)', 'Dryer (Electric/Gas)', 'Utility Sink', 'Steamer', 'Iron']
        },
        'Furniture & Storage': {
            'PIECE': ['Base Cabinets', 'Wall Cabinets', 'Countertop (Folding Area)', 'Laundry Folding Table', 'Hanging Rod', 'Shelving Units', 'Laundry Sorter/Hampers', 'Ironing Board (Built-in/Foldable)', 'Drying Rack (Wall-mounted/Freestanding)']
        },
        'Decor & Accessories': {
            'MISC.': ['Wall Art/Signage', 'Floor Mat', 'Storage Bins (Laundry Supplies)', 'Pegboard Organizer', 'Lint Bin', 'Cleaning Supplies Caddy']
        },
        'Paint, Wallpaper, and Finishes': {
            'Misc.': ['Paint color', 'Wallpaper', 'Finish', 'Counter Tops']
        },
        'Millwork, Trim, and Architectural Elements': {
            'ARCHITECTURAL': ['Crown Molding', 'Baseboards', 'Window Trim/Casings', 'Door Trim/Casings']
        }
    },
    'home office': {
        'Lighting': {
            'INSTALLED': ['Flush Mount/Pendant', 'Recessed Lighting', 'Track Lighting', 'Sconces', 'Ceiling Fan w/ Light'],
            'PORTABLE': ['Desk Lamp (Task Light)', 'Floor Lamp', 'Table Lamp']
        },
        'Furniture': {
            'PIECE': ['Desk (Executive/L-shaped/Standing)', 'Office Chair (Ergonomic/Guest)', 'Bookcase', 'Filing Cabinet (Lateral/Vertical)', 'Credenza', 'Storage Cabinet', 'Guest Chairs (Pair)', 'Sofa/Loveseat (if space allows)', 'Coffee Table/Side Table']
        },
        'Decor & Accessories': {
            'MISC.': ['Area Rug', 'Wall Art', 'Desk Organizers', 'Whiteboard/Corkboard', 'Plants', 'Curtains/Blinds/Shades', 'Photo Frames', 'Motivational Decor', 'Cable Management']
        },
        'Paint, Wallpaper, and Finishes': {
            'Misc.': ['Paint color', 'Wallpaper', 'Finish']
        },
        'Millwork, Trim, and Architectural Elements': {
            'ARCHITECTURAL': ['Crown Molding', 'Baseboards', 'Built-in Columns', 'Built-in Niches', 'Window Trim/Casings', 'Door Trim/Casings', 'Panel Molding']
        }
    },
    'guest bedroom': {
        'Lighting': {
            'INSTALLED': ['Ceiling Light', 'Recessed Lighting', 'Ceiling Fan w/ Light'],
            'PORTABLE': ['Nightstand Lamps', 'Floor Lamp']
        },
        'Furniture': {
            'PIECE': ['Bed (Queen/Full/Twin)', 'Nightstands (Pair)', 'Dresser', 'Mirror (Dresser/Wall)', 'Accent Chair', 'Small Desk/Table', 'Luggage Rack', 'Bench (Small)']
        },
        'Decor & Accessories': {
            'MISC.': ['Area Rug', 'Bedding Set (Duvet, Sheets, Shams)', 'Throw Pillows', 'Wall Art', 'Curtains/Blinds/Shades', 'Alarm Clock', 'Water Carafe', 'Guest Wi-Fi Info Frame']
        },
        'Paint, Wallpaper, and Finishes': {
            'Misc.': ['Paint color', 'Wallpaper', 'Finish']
        },
        'Millwork, Trim, and Architectural Elements': {
            'ARCHITECTURAL': ['Crown Molding', 'Baseboards', 'Chair Rails', 'Window Trim/Casings', 'Door Trim/Casings', 'Panel Molding']
        }
    },
    'guest bathroom': {
        'Lighting': {
            'INSTALLED': ['Vanity Light', 'Recessed Light', 'Exhaust Fan w/ Light']
        },
        'Plumbing & Fixtures': {
            'FIXTURE': ['Sink', 'Faucet', 'Toilet', 'Shower Head', 'Tub Faucet', 'Shower/Tub Combo']
        },
        'Furniture & Storage': {
            'PIECE': ['Vanity Cabinet', 'Linen Closet/Cabinet', 'Small Storage Shelf']
        },
        'Decor & Accessories': {
            'MISC.': ['Mirror', 'Bath Mat', 'Towels (Guest Set)', 'Soap Dispenser', 'Shower Curtain/Liner', 'Toilet Paper Holder', 'Towel Bar/Hooks', 'Waste Basket', 'Small Plant']
        },
        'Paint, Wallpaper, and Finishes': {
            'Misc.': ['Paint color', 'Wallpaper', 'Finish', 'Counter Tops']
        },
        'Millwork, Trim, and Architectural Elements': {
            'ARCHITECTURAL': ['Crown Molding', 'Baseboards', 'Window Trim/Casings', 'Door Trim/Casings']
        }
    },
    'family room': {
        'Lighting': {
            'INSTALLED': ['Recessed Lighting (Dimmable)', 'Ceiling Fan w/ Light', 'Sconces', 'Track Lighting', 'Accent Lighting'],
            'PORTABLE': ['Floor Lamp', 'Table Lamp', 'Console Lamp']
        },
        'Furniture': {
            'PIECE': ['Sectional Sofa', 'Recliner (Single/Dual)', 'Sofa', 'Loveseat', 'Armchair', 'Ottoman (Large/Storage)', 'Coffee Table', 'End Table (Pair)', 'Media Console/TV Stand', 'Built-in Entertainment Center', 'Bookcase', 'Game Table', 'Game Chairs', 'Bar Cart', 'Display Cabinet']
        },
        'Decor & Accessories': {
            'MISC.': ['Large Area Rug', 'Throw Pillows', 'Throw Blankets', 'Wall Art/Gallery Wall', 'Decorative Objects', 'Gaming Accessories Storage', 'Curtains/Blinds', 'DVD/Blu-ray Storage', 'Board Games']
        },
        'Paint, Wallpaper, and Finishes': {
            'Misc.': ['Paint color', 'Wallpaper', 'Finish']
        },
        'Millwork, Trim, and Architectural Elements': {
            'ARCHITECTURAL': ['Crown Molding', 'Baseboards', 'Chair Rails', 'Built-in Columns', 'Coffered Ceilings', 'Built-in Niches', 'Window Trim/Casings', 'Door Trim/Casings', 'Panel Molding']
        }
    },
    'home gym': {
        'Lighting': {
            'INSTALLED': ['Recessed Lighting', 'Track Lighting', 'LED Strip Lights']
        },
        'Equipment & Furniture': {
            'PORTABLE': ['Floor Fan', 'Portable Speaker'],
            'PIECE': ['Treadmill', 'Elliptical', 'Stationary Bike', 'Weight Rack', 'Dumbbells/Kettlebells', 'Exercise Bench', 'Yoga Mat', 'Resistance Bands', 'Stability Ball', 'Smart TV/Monitor', 'Sound System', 'Storage Shelves (for weights/gear)', 'Mini Fridge', 'Towel Rack', 'Water Cooler', 'Punching Bag', 'Rowing Machine']
        },
        'Decor & Accessories': {
            'MISC.': ['Rubber Flooring/Mats', 'Large Wall Mirror', 'Motivational Art/Quotes', 'Clock/Timer', 'Water Bottle Holder', 'Workout Towels']
        },
        'Paint, Wallpaper, and Finishes': {
            'Misc.': ['Paint color', 'Wallpaper', 'Finish']
        },
        'Millwork, Trim, and Architectural Elements': {
            'ARCHITECTURAL': ['Crown Molding', 'Baseboards', 'Window Trim/Casings', 'Door Trim/Casings']
        }
    },
    'nursery': {
        'Lighting': {
            'INSTALLED': ['Ceiling Light/Pendant (Dimmable)', 'Recessed Lighting (Dimmable)', 'Night Light (Plug-in/Wall)'],
            'PORTABLE': ['Table Lamp', 'Floor Lamp (for reading nook)']
        },
        'Furniture': {
            'PIECE': ['Crib', 'Changing Table/Dresser Combo', 'Glider/Rocker', 'Ottoman (for glider)', 'Bookcase (Low)', 'Toy Storage Unit', 'Wardrobe/Armoire', 'Humidifier/Air Purifier', 'Toddler Bed', 'Daybed (Twin)']
        },
        'Decor & Accessories': {
            'MISC.': ['Area Rug (Soft)', 'Blackout Curtains', 'Wall Art/Mural', 'Decorative Mobiles', 'Baby Monitor', 'Diaper Pail', 'Storage Baskets', 'Soft Toys/Plushies', 'Picture Frames', 'Crib Sheets/Bedding']
        },
        'Paint, Wallpaper, and Finishes': {
            'Misc.': ['Paint color', 'Wallpaper', 'Finish']
        },
        'Millwork, Trim, and Architectural Elements': {
            'ARCHITECTURAL': ['Crown Molding', 'Baseboards', 'Chair Rails', 'Wainscoting', 'Window Trim/Casings', 'Door Trim/Casings']
        }
    }
}

class ItemStatus(str, Enum):
    PICKED = "PICKED"
    ORDERED = "ORDERED"
    SHIPPED = "SHIPPED"
    DELIVERED_TO_RECEIVER = "DELIVERED TO RECEIVER"  
    DELIVERED_TO_JOB_SITE = "DELIVERED TO JOB SITE"
    INSTALLED = "INSTALLED"
    PARTIALLY_DELIVERED = "PARTIALLY DELIVERED"
    ON_HOLD = "ON HOLD"
    CANCELLED = "CANCELLED"
    BACKORDERED = "BACKORDERED"
    IN_TRANSIT = "IN TRANSIT"
    OUT_FOR_DELIVERY = "OUT FOR DELIVERY"
    RETURNED = "RETURNED"
    DAMAGED = "DAMAGED"
    MISSING = "MISSING"
    PENDING_APPROVAL = "PENDING APPROVAL"
    QUOTE_REQUESTED = "QUOTE REQUESTED"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"
    
# Vendor dropdown options - ONLY YOUR WHOLESALE SITES
class VendorType(str, Enum):
    FOUR_HANDS = "Four Hands"
    UTTERMOST = "Uttermost"
    ROWE_FURNITURE = "Rowe Furniture"
    REGINA_ANDREW = "Regina Andrew"
    BERNHARDT = "Bernhardt"
    LOLOI_RUGS = "Loloi Rugs"
    VANDH = "Vandh"
    VISUAL_COMFORT = "Visual Comfort"
    HVL_GROUP = "HVL Group"
    FLOW_DECOR = "Flow Decor"
    CLASSIC_HOME = "Classic Home"
    CRESTVIEW_COLLECTION = "Crestview Collection"
    BASSETT_MIRROR = "Bassett Mirror"
    EICHHOLTZ = "Eichholtz"
    YORK_WALLCOVERINGS = "York Wallcoverings"
    PHILLIPS_COLLECTION = "Phillips Collection"
    PHILLIP_JEFFRIES = "Phillip Jeffries"
    HINKLEY_LIGHTING = "Hinkley Lighting"
    ZEEV_LIGHTING = "Zeev Lighting"
    HUBBARDTON_FORGE = "Hubbardton Forge"
    CURREY_AND_COMPANY = "Currey and Company"
    SURYA = "Surya"
    MYOH_AMERICA = "Myoh America"
    GABBY = "Gabby"

# Carrier dropdown options from your screenshots - COMPLETE LIST  
class CarrierType(str, Enum):
    FEDEX = "FedEx"
    FEDEX_GROUND = "FedEx Ground"
    FEDEX_EXPRESS = "FedEx Express"
    UPS = "UPS"
    UPS_GROUND = "UPS Ground"
    UPS_EXPRESS = "UPS Express"
    USPS = "USPS"
    DHL = "DHL"
    WHITE_GLOVE = "White Glove Delivery"
    FREIGHT = "Freight"
    LOCAL_DELIVERY = "Local Delivery"
    CUSTOMER_PICKUP = "Customer Pickup"
    BROOKS = "Brooks"
    ZENITH = "Zenith"
    SUNBELT = "Sunbelt"
    SPECIALIZED_CARRIER = "Specialized Carrier"
    INSTALLATION_CREW = "Installation Crew"
    OTHER = "Other"

class ProjectType(str, Enum):
    RENOVATION = "Renovation"
    NEW_CONSTRUCTION = "New Construction"
    DESIGN_CONSULTATION = "Design Consultation"
    FURNITURE_ONLY = "Furniture Only"

# Pydantic Models
class ItemBase(BaseModel):
    name: str
    quantity: int = 1
    size: Optional[str] = ""
    remarks: Optional[str] = ""
    vendor: Optional[str] = ""
    status: ItemStatus = ItemStatus.PICKED
    cost: Optional[float] = 0.0
    link: Optional[str] = ""
    tracking_number: Optional[str] = ""
    order_date: Optional[datetime] = None
    install_date: Optional[datetime] = None
    image_url: Optional[str] = ""

class ItemCreate(ItemBase):
    subcategory_id: str
    
class ItemUpdate(BaseModel):
    name: Optional[str] = None
    quantity: Optional[int] = None
    size: Optional[str] = None
    remarks: Optional[str] = None
    vendor: Optional[str] = None
    status: Optional[ItemStatus] = None
    cost: Optional[float] = None
    link: Optional[str] = None
    tracking_number: Optional[str] = None
    order_date: Optional[datetime] = None
    install_date: Optional[datetime] = None
    image_url: Optional[str] = None

class Item(ItemBase):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    subcategory_id: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

# NEW: Sub-category model (RED headers like INSTALLED, MOLDING, etc.)
class SubCategoryBase(BaseModel):
    name: str
    description: Optional[str] = ""
    order_index: int = 0

class SubCategoryCreate(SubCategoryBase):
    category_id: str

class SubCategoryUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    order_index: Optional[int] = None

class SubCategory(SubCategoryBase):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    category_id: str
    color: str = "#8A5A5A"  # Red color
    items: List[Item] = []
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class CategoryBase(BaseModel):
    name: str
    description: Optional[str] = ""
    order_index: int = 0

class CategoryCreate(CategoryBase):
    room_id: str

class CategoryUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    order_index: Optional[int] = None

class Category(CategoryBase):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    room_id: str
    color: str = "#5A7A5A"  # Green color
    subcategories: List[SubCategory] = []
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class RoomBase(BaseModel):
    name: str
    description: Optional[str] = ""
    order_index: int = 0

class RoomCreate(RoomBase):
    project_id: str

class RoomUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    order_index: Optional[int] = None

class Room(RoomBase):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    project_id: str
    color: str = "#7A5A8A"  # Purple color
    categories: List[Category] = []
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class ClientInfo(BaseModel):
    full_name: str
    email: str
    phone: str
    address: str

class ProjectBase(BaseModel):
    name: str
    client_info: ClientInfo
    project_type: ProjectType = ProjectType.RENOVATION
    timeline: Optional[str] = ""
    budget: Optional[str] = ""
    style_preferences: Optional[List[str]] = []
    color_palette: Optional[str] = ""
    special_requirements: Optional[str] = ""

class ProjectCreate(ProjectBase):
    pass

class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    client_info: Optional[ClientInfo] = None
    project_type: Optional[ProjectType] = None
    timeline: Optional[str] = None
    budget: Optional[str] = None
    style_preferences: Optional[List[str]] = None
    color_palette: Optional[str] = None
    special_requirements: Optional[str] = None

class Project(ProjectBase):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    rooms: List[Room] = []
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

# Helper function to get room color
def get_room_color(room_name: str) -> str:
    return ROOM_COLORS.get(room_name.lower(), "#7A5A8A")

def get_category_color(category_name: str) -> str:
    return CATEGORY_COLORS.get(category_name.lower(), "#5A7A5A")

def get_subcategory_color(subcategory_name: str) -> str:
    return SUBCATEGORY_COLORS.get(subcategory_name.lower(), "#8A5A5A")

# LINK SCRAPING FUNCTIONALITY
def scrape_product_info(url: str) -> Dict[str, Any]:
    """Scrape product information from a URL"""
    try:
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
        
        response = requests.get(url, headers=headers, timeout=10)
        response.raise_for_status()
        
        soup = BeautifulSoup(response.content, 'html.parser')
        
        # Extract product information
        product_info = {
            'name': '',
            'price': '',
            'description': '',
            'image_url': '',
            'vendor': '',
            'sku': '',
            'size': '',
            'color': ''
        }
        
        # Try to extract product name - ENHANCED FOR WHOLESALE SITES
        name_selectors = [
            'h1[data-automation-id="product-title"]',  # Home Depot
            'h1.product-title',
            'h1#product-title', 
            '.product-name h1',
            'h1.a-size-large',  # Amazon
            '[data-testid="product-title"]',
            # Wholesale site selectors
            '.product-detail-title h1',  # Four Hands, Uttermost
            '.product-info h1',          # Bernhardt, Loloi
            '.product-header h1',        # Visual Comfort, Currey
            '.pdp-title h1',             # Regina Andrew
            '.item-name h1',             # Phillips Collection
            '.product-name-wrapper h1',  # Gabby
            'h1.entry-title',            # Many wholesale sites
            'h1.page-title',
            'h1.main-title',
            'h1',
            '.product-title',
            '.product-name'
        ]
        
        for selector in name_selectors:
            element = soup.select_one(selector)
            if element and element.get_text(strip=True):
                product_info['name'] = element.get_text(strip=True)[:100]  # Limit length
                break
        
        # Try to extract price - ENHANCED FOR WHOLESALE SITES
        price_selectors = [
            '.price-current',
            '.price .sr-only',
            '.a-price-whole',  # Amazon
            '[data-testid="price"]',
            '.price-now',
            '.current-price',
            '.product-price',
            # Wholesale site price selectors
            '.product-price-value',      # Four Hands, Uttermost
            '.price-box .price',         # Bernhardt, Loloi
            '.pricing .current-price',   # Visual Comfort
            '.product-pricing .price',   # Regina Andrew
            '.pdp-price',               # Many wholesale sites
            '.retail-price',
            '.wholesale-price',
            '.trade-price',
            '.net-price',
            '.msrp-price',
            '.price'
        ]
        
        for selector in price_selectors:
            element = soup.select_one(selector)
            if element:
                price_text = element.get_text(strip=True)
                # Extract price using regex
                price_match = re.search(r'\$[\d,]+\.?\d*', price_text)
                if price_match:
                    product_info['price'] = price_match.group().replace(',', '')
                    break
        
        # Try to extract main image - ENHANCED FOR WHOLESALE SITES
        image_selectors = [
            'img[data-testid="product-image"]',
            '.product-image img',
            '#landingImage',  # Amazon
            '.hero-image img',
            '.primary-image img',
            'img.product-image',
            # Wholesale site image selectors
            '.product-gallery .main-image img',    # Four Hands
            '.product-media .featured-image img',  # Uttermost
            '.product-images .primary img',        # Bernhardt
            '.product-slider .active img',         # Loloi, Visual Comfort
            '.pdp-gallery .main img',             # Regina Andrew
            '.product-photos .featured img',       # Gabby, Phillips Collection
            '.zoom-image img',                     # Many wholesale sites
            '.featured-image img',
            '.main-product-image img',
            '.media img'
        ]
        
        for selector in image_selectors:
            element = soup.select_one(selector)
            if element and element.get('src'):
                img_url = element.get('src')
                # Make sure it's a full URL
                if img_url.startswith('//'):
                    img_url = 'https:' + img_url
                elif img_url.startswith('/'):
                    img_url = urljoin(url, img_url)
                
                product_info['image_url'] = img_url
                break
        
        # Try to extract vendor from URL - YOUR WHOLESALE SITES
        domain = urlparse(url).netloc.lower()
        if 'fourhands.com' in domain:
            product_info['vendor'] = 'Four Hands'
        elif 'uttermost.com' in domain:
            product_info['vendor'] = 'Uttermost'
        elif 'rowefurniture.com' in domain:
            product_info['vendor'] = 'Rowe Furniture'
        elif 'reginaandrew.com' in domain:
            product_info['vendor'] = 'Regina Andrew'
        elif 'bernhardt.com' in domain:
            product_info['vendor'] = 'Bernhardt'
        elif 'loloirugs.com' in domain:
            product_info['vendor'] = 'Loloi Rugs'
        elif 'vandh.com' in domain:
            product_info['vendor'] = 'Vandh'
        elif 'visualcomfort.com' in domain:
            product_info['vendor'] = 'Visual Comfort'
        elif 'hvlgroup.com' in domain:
            product_info['vendor'] = 'HVL Group'
        elif 'flowdecor.com' in domain:
            product_info['vendor'] = 'Flow Decor'
        elif 'classichome.com' in domain:
            product_info['vendor'] = 'Classic Home'
        elif 'crestviewcollection.com' in domain:
            product_info['vendor'] = 'Crestview Collection'
        elif 'bassettmirror.com' in domain:
            product_info['vendor'] = 'Bassett Mirror'
        elif 'eichholtz.com' in domain:
            product_info['vendor'] = 'Eichholtz'
        elif 'yorkwallcoverings.com' in domain:
            product_info['vendor'] = 'York Wallcoverings'
        elif 'phillipscollection.com' in domain:
            product_info['vendor'] = 'Phillips Collection'
        elif 'phillipjeffries.com' in domain:
            product_info['vendor'] = 'Phillip Jeffries'
        elif 'hinkley.com' in domain:
            product_info['vendor'] = 'Hinkley Lighting'
        elif 'zeevlighting.com' in domain:
            product_info['vendor'] = 'Zeev Lighting'
        elif 'hubbardtonforge.com' in domain:
            product_info['vendor'] = 'Hubbardton Forge'
        elif 'curreyandcompany.com' in domain:
            product_info['vendor'] = 'Currey and Company'
        elif 'surya.com' in domain:
            product_info['vendor'] = 'Surya'
        elif 'myohamerica.com' in domain:
            product_info['vendor'] = 'Myoh America'
        elif 'gabby.com' in domain:
            product_info['vendor'] = 'Gabby'
        # Retail fallbacks (in case they're still used)
        elif 'homedepot' in domain:
            product_info['vendor'] = 'Home Depot'
        elif 'lowes' in domain:
            product_info['vendor'] = "Lowe's"
        elif 'amazon' in domain:
            product_info['vendor'] = 'Amazon'
        elif 'wayfair' in domain:
            product_info['vendor'] = 'Wayfair'
        elif 'potterybarn' in domain:
            product_info['vendor'] = 'Pottery Barn'
        elif 'restorationhardware' in domain:
            product_info['vendor'] = 'Restoration Hardware'
        elif 'westelm' in domain:
            product_info['vendor'] = 'West Elm'
        elif 'crateandbarrel' in domain:
            product_info['vendor'] = 'Crate & Barrel'
        
        # Extract SKU/Model number
        sku_selectors = [
            '[data-testid="sku"]',
            '.sku',
            '.model-number',
            '.product-sku'
        ]
        
        for selector in sku_selectors:
            element = soup.select_one(selector)
            if element:
                product_info['sku'] = element.get_text(strip=True)
                break
        
        return product_info
        
    except Exception as e:
        logging.error(f"Error scraping URL {url}: {e}")
        return {
            'name': '',
            'price': '',
            'description': '',
            'image_url': '',
            'vendor': '',
            'sku': '',
            'size': '',
            'color': '',
            'error': str(e)
        }
    """Scrape product information from a URL"""
    try:
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
        
        response = requests.get(url, headers=headers, timeout=10)
        response.raise_for_status()
        
        soup = BeautifulSoup(response.content, 'html.parser')
        
        # Extract product information
        product_info = {
            'name': '',
            'price': '',
            'description': '',
            'image_url': '',
            'vendor': '',
            'sku': '',
            'size': '',
            'color': ''
        }
        
        # Try to extract product name - ENHANCED FOR WHOLESALE SITES
        name_selectors = [
            'h1[data-automation-id="product-title"]',  # Home Depot
            'h1.product-title',
            'h1#product-title', 
            '.product-name h1',
            'h1.a-size-large',  # Amazon
            '[data-testid="product-title"]',
            # Wholesale site selectors
            '.product-detail-title h1',  # Four Hands, Uttermost
            '.product-info h1',          # Bernhardt, Loloi
            '.product-header h1',        # Visual Comfort, Currey
            '.pdp-title h1',             # Regina Andrew
            '.item-name h1',             # Phillips Collection
            '.product-name-wrapper h1',  # Gabby
            'h1.entry-title',            # Many wholesale sites
            'h1.page-title',
            'h1.main-title',
            'h1',
            '.product-title',
            '.product-name'
        ]
        
        for selector in name_selectors:
            element = soup.select_one(selector)
            if element and element.get_text(strip=True):
                product_info['name'] = element.get_text(strip=True)[:100]  # Limit length
                break
        
        # Try to extract price - ENHANCED FOR WHOLESALE SITES
        price_selectors = [
            '.price-current',
            '.price .sr-only',
            '.a-price-whole',  # Amazon
            '[data-testid="price"]',
            '.price-now',
            '.current-price',
            '.product-price',
            # Wholesale site price selectors
            '.product-price-value',      # Four Hands, Uttermost
            '.price-box .price',         # Bernhardt, Loloi
            '.pricing .current-price',   # Visual Comfort
            '.product-pricing .price',   # Regina Andrew
            '.pdp-price',               # Many wholesale sites
            '.retail-price',
            '.wholesale-price',
            '.trade-price',
            '.net-price',
            '.msrp-price',
            '.price'
        ]
        
        for selector in price_selectors:
            element = soup.select_one(selector)
            if element:
                price_text = element.get_text(strip=True)
                # Extract price using regex
                price_match = re.search(r'\$[\d,]+\.?\d*', price_text)
                if price_match:
                    product_info['price'] = price_match.group().replace(',', '')
                    break
        
        # Try to extract main image - ENHANCED FOR WHOLESALE SITES
        image_selectors = [
            'img[data-testid="product-image"]',
            '.product-image img',
            '#landingImage',  # Amazon
            '.hero-image img',
            '.primary-image img',
            'img.product-image',
            # Wholesale site image selectors
            '.product-gallery .main-image img',    # Four Hands
            '.product-media .featured-image img',  # Uttermost
            '.product-images .primary img',        # Bernhardt
            '.product-slider .active img',         # Loloi, Visual Comfort
            '.pdp-gallery .main img',             # Regina Andrew
            '.product-photos .featured img',       # Gabby, Phillips Collection
            '.zoom-image img',                     # Many wholesale sites
            '.featured-image img',
            '.main-product-image img',
            '.media img'
        ]
        
        for selector in image_selectors:
            element = soup.select_one(selector)
            if element and element.get('src'):
                img_url = element.get('src')
                # Make sure it's a full URL
                if img_url.startswith('//'):
                    img_url = 'https:' + img_url
                elif img_url.startswith('/'):
                    img_url = urljoin(url, img_url)
                
                product_info['image_url'] = img_url
                break
        
        # Try to extract vendor from URL - YOUR WHOLESALE SITES
        domain = urlparse(url).netloc.lower()
        if 'fourhands.com' in domain:
            product_info['vendor'] = 'Four Hands'
        elif 'uttermost.com' in domain:
            product_info['vendor'] = 'Uttermost'
        elif 'rowefurniture.com' in domain:
            product_info['vendor'] = 'Rowe Furniture'
        elif 'reginaandrew.com' in domain:
            product_info['vendor'] = 'Regina Andrew'
        elif 'bernhardt.com' in domain:
            product_info['vendor'] = 'Bernhardt'
        elif 'loloirugs.com' in domain:
            product_info['vendor'] = 'Loloi Rugs'
        elif 'vandh.com' in domain:
            product_info['vendor'] = 'Vandh'
        elif 'visualcomfort.com' in domain:
            product_info['vendor'] = 'Visual Comfort'
        elif 'hvlgroup.com' in domain:
            product_info['vendor'] = 'HVL Group'
        elif 'flowdecor.com' in domain:
            product_info['vendor'] = 'Flow Decor'
        elif 'classichome.com' in domain:
            product_info['vendor'] = 'Classic Home'
        elif 'crestviewcollection.com' in domain:
            product_info['vendor'] = 'Crestview Collection'
        elif 'bassettmirror.com' in domain:
            product_info['vendor'] = 'Bassett Mirror'
        elif 'eichholtz.com' in domain:
            product_info['vendor'] = 'Eichholtz'
        elif 'yorkwallcoverings.com' in domain:
            product_info['vendor'] = 'York Wallcoverings'
        elif 'phillipscollection.com' in domain:
            product_info['vendor'] = 'Phillips Collection'
        elif 'phillipjeffries.com' in domain:
            product_info['vendor'] = 'Phillip Jeffries'
        elif 'hinkley.com' in domain:
            product_info['vendor'] = 'Hinkley Lighting'
        elif 'zeevlighting.com' in domain:
            product_info['vendor'] = 'Zeev Lighting'
        elif 'hubbardtonforge.com' in domain:
            product_info['vendor'] = 'Hubbardton Forge'
        elif 'curreyandcompany.com' in domain:
            product_info['vendor'] = 'Currey and Company'
        elif 'surya.com' in domain:
            product_info['vendor'] = 'Surya'
        elif 'myohamerica.com' in domain:
            product_info['vendor'] = 'Myoh America'
        elif 'gabby.com' in domain:
            product_info['vendor'] = 'Gabby'
        # Retail fallbacks (in case they're still used)
        elif 'homedepot' in domain:
            product_info['vendor'] = 'Home Depot'
        elif 'lowes' in domain:
            product_info['vendor'] = "Lowe's"
        elif 'amazon' in domain:
            product_info['vendor'] = 'Amazon'
        elif 'wayfair' in domain:
            product_info['vendor'] = 'Wayfair'
        elif 'potterybarn' in domain:
            product_info['vendor'] = 'Pottery Barn'
        elif 'restorationhardware' in domain:
            product_info['vendor'] = 'Restoration Hardware'
        elif 'westelm' in domain:
            product_info['vendor'] = 'West Elm'
        elif 'crateandbarrel' in domain:
            product_info['vendor'] = 'Crate & Barrel'
        
        # Extract SKU/Model number
        sku_selectors = [
            '[data-testid="sku"]',
            '.sku',
            '.model-number',
            '.product-sku'
        ]
        
        for selector in sku_selectors:
            element = soup.select_one(selector)
            if element:
                product_info['sku'] = element.get_text(strip=True)
                break
        
        return product_info
        
    except Exception as e:
        logging.error(f"Error scraping URL {url}: {e}")
        return {
            'name': '',
            'price': '',
            'description': '',
            'image_url': '',
            'vendor': '',
            'sku': '',
            'size': '',
            'color': '',
            'error': str(e)
        }

# PROJECT ENDPOINTS
@api_router.post("/projects", response_model=Project)
async def create_project(project: ProjectCreate):
    project_dict = project.dict()
    project_obj = Project(**project_dict)
    
    # Insert project into database
    result = await db.projects.insert_one(project_obj.dict())
    
    if result.inserted_id:
        return project_obj
    raise HTTPException(status_code=400, detail="Failed to create project")

@api_router.get("/projects", response_model=List[Project])
async def get_projects():
    projects = await db.projects.find().to_list(1000)
    result = []
    
    for project_data in projects:
        # Fetch rooms for each project
        rooms = await db.rooms.find({"project_id": project_data["id"]}).to_list(1000)
        project_data["rooms"] = []
        
        for room_data in rooms:
            # Fetch categories for each room
            categories = await db.categories.find({"room_id": room_data["id"]}).to_list(1000)
            room_data["categories"] = []
            
            for category_data in categories:
                # Fetch subcategories for each category
                subcategories = await db.subcategories.find({"category_id": category_data["id"]}).to_list(1000)
                category_data["subcategories"] = []
                
                for subcategory_data in subcategories:
                    # Fetch items for each subcategory
                    items = await db.items.find({"subcategory_id": subcategory_data["id"]}).to_list(1000)
                    subcategory_data["items"] = [Item(**item) for item in items]
                    
                category_data["subcategories"] = [SubCategory(**subcat) for subcat in subcategories]
                
            room_data["categories"] = [Category(**cat) for cat in categories]
            
        project_data["rooms"] = [Room(**room) for room in rooms]
        result.append(Project(**project_data))
    
    return result

@api_router.get("/projects/{project_id}", response_model=Project)
async def get_project(project_id: str):
    project_data = await db.projects.find_one({"id": project_id})
    if not project_data:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Fetch rooms
    rooms = await db.rooms.find({"project_id": project_id}).sort("order_index", 1).to_list(1000)
    project_data["rooms"] = []
    
    for room_data in rooms:
        # Fetch categories
        categories = await db.categories.find({"room_id": room_data["id"]}).sort("order_index", 1).to_list(1000)
        room_data["categories"] = []
        
        for category_data in categories:
            # Fetch subcategories
            subcategories = await db.subcategories.find({"category_id": category_data["id"]}).sort("order_index", 1).to_list(1000)
            category_data["subcategories"] = []
            
            for subcategory_data in subcategories:
                # Fetch items
                items = await db.items.find({"subcategory_id": subcategory_data["id"]}).to_list(1000)
                subcategory_data["items"] = [Item(**item) for item in items]
                
            category_data["subcategories"] = [SubCategory(**subcat) for subcat in subcategories]
            
        room_data["categories"] = [Category(**cat) for cat in categories]
        
    project_data["rooms"] = [Room(**room) for room in rooms]
    
    return Project(**project_data)

# ROOM ENDPOINTS with 3-level auto-population
@api_router.post("/rooms", response_model=Room)
async def create_room(room: RoomCreate):
    room_dict = room.dict()
    room_obj = Room(**room_dict)
    room_obj.color = get_room_color(room_obj.name)
    
    result = await db.rooms.insert_one(room_obj.dict())
    
    if result.inserted_id:
        # Auto-create 3-level structure
        room_type = room_obj.name.lower()
        structure = ROOM_DEFAULT_STRUCTURE.get(room_type, {
            'Lighting': ['Installed', 'Portable']
        })
        
        for cat_index, (category_name, subcategories) in enumerate(structure.items()):
            # Create category (GREEN level)
            category_data = {
                "id": str(uuid.uuid4()),
                "name": category_name,
                "room_id": room_obj.id,
                "color": get_category_color(category_name),
                "description": f"{category_name} for {room_obj.name}",
                "order_index": cat_index,
                "subcategories": [],
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            }
            await db.categories.insert_one(category_data)
            
            # Create subcategories (RED level)
            for sub_index, subcategory_name in enumerate(subcategories):
                subcategory_data = {
                    "id": str(uuid.uuid4()),
                    "name": subcategory_name,
                    "category_id": category_data["id"],
                    "color": get_subcategory_color(subcategory_name),
                    "description": f"{subcategory_name} items",
                    "order_index": sub_index,
                    "items": [],
                    "created_at": datetime.utcnow(),
                    "updated_at": datetime.utcnow()
                }
                await db.subcategories.insert_one(subcategory_data)
        
        return room_obj
    raise HTTPException(status_code=400, detail="Failed to create room")

# SUBCATEGORY ENDPOINTS
@api_router.post("/subcategories", response_model=SubCategory)
async def create_subcategory(subcategory: SubCategoryCreate):
    subcategory_dict = subcategory.dict()
    subcategory_obj = SubCategory(**subcategory_dict)
    subcategory_obj.color = get_subcategory_color(subcategory_obj.name)
    
    result = await db.subcategories.insert_one(subcategory_obj.dict())
    
    if result.inserted_id:
        return subcategory_obj
    raise HTTPException(status_code=400, detail="Failed to create subcategory")

# ITEM ENDPOINTS (updated to use subcategory_id)
@api_router.post("/items", response_model=Item)
async def create_item(item: ItemCreate):
    item_dict = item.dict()
    item_obj = Item(**item_dict)
    
    result = await db.items.insert_one(item_obj.dict())
    
    if result.inserted_id:
        return item_obj
    raise HTTPException(status_code=400, detail="Failed to create item")

@api_router.get("/items/{item_id}", response_model=Item)  
async def get_item(item_id: str):
    item_data = await db.items.find_one({"id": item_id})
    if not item_data:
        raise HTTPException(status_code=404, detail="Item not found")
    
    return Item(**item_data)

@api_router.put("/items/{item_id}", response_model=Item)
async def update_item(item_id: str, item_update: ItemUpdate):
    update_data = {k: v for k, v in item_update.dict().items() if v is not None}
    update_data["updated_at"] = datetime.utcnow()
    
    result = await db.items.update_one(
        {"id": item_id}, 
        {"$set": update_data}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Item not found")
    
    return await get_item(item_id)

@api_router.delete("/items/{item_id}")
async def delete_item(item_id: str):
    result = await db.items.delete_one({"id": item_id})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Item not found")
    
    return {"message": "Item deleted successfully"}

# UTILITY ENDPOINTS
@api_router.get("/room-colors")
async def get_room_colors():
    return ROOM_COLORS

@api_router.get("/category-colors") 
async def get_category_colors():
    return CATEGORY_COLORS

@api_router.get("/subcategory-colors")
async def get_subcategory_colors():
    return SUBCATEGORY_COLORS

@api_router.get("/item-statuses")
async def get_item_statuses():
    return [status.value for status in ItemStatus]

@api_router.get("/vendor-types")
async def get_vendor_types():
    return [vendor.value for vendor in VendorType]

@api_router.get("/carrier-types")
async def get_carrier_types():
    return [carrier.value for carrier in CarrierType]

@api_router.get("/paint-colors")
async def get_paint_colors():
    """Get comprehensive paint color catalog for interior design"""
    return {"data": PAINT_CATALOG}

@api_router.get("/paint-suggestions/{room_type}")
async def get_paint_suggestions(room_type: str):
    """Get paint color suggestions based on room type"""
    room_suggestions = {
        'living room': {
            'recommended': ['Agreeable Gray (SW 7029)', 'Revere Pewter (HC-172)', 'White Dove (OC-17)', 'Accessible Beige (SW 7036)', 'Elephant\'s Breath (No.229)'],
            'accent_colors': ['Naval (SW 6244)', 'Hague Blue (No.30)', 'Hunter Green (2041-10)', 'Caliente (AF-290)'],
            'style_notes': 'Neutral base colors work best for living rooms, allowing flexibility with furniture and decor changes.'
        },
        'kitchen': {
            'recommended': ['Pure White (SW 7005)', 'Chantilly Lace (OC-65)', 'Sea Salt (SW 6204)', 'Classic Gray (OC-23)', 'Pointing (No.2003)'],
            'accent_colors': ['Evergreen Fog (SW 9130)', 'Hale Navy (HC-154)', 'Studio Green (No.93)', 'Calke Green (No.34)'],
            'style_notes': 'Light, clean colors enhance the sense of cleanliness and space in kitchens.'
        },
        'primary bedroom': {
            'recommended': ['Repose Gray (SW 7015)', 'Stonington Gray (HC-170)', 'Palladian Blue (HC-144)', 'Sulking Room Pink (No.295)', 'Setting Plaster (No.231)'],
            'accent_colors': ['Indigo Batik (SW 7602)', 'Van Deusen Blue (HC-156)', 'Treron (No.292)', 'Calamine (No.230)'],
            'style_notes': 'Calming, sophisticated colors promote rest and relaxation in bedrooms.'
        },
        'dining room': {
            'recommended': ['Urbane Bronze (SW 7048)', 'Kendall Charcoal (HC-166)', 'London Clay (No.244)', 'Dorian Gray (SW 7017)', 'Pigeon (No.25)'],
            'accent_colors': ['Dragon Fruit (SW 6855)', 'Picture Gallery Red (No.42)', 'Card Room Green (No.79)', 'India Yellow (No.66)'],
            'style_notes': 'Deeper, more dramatic colors create an intimate dining atmosphere.'
        },
        'bathroom': {
            'recommended': ['Rainwashed (SW 6211)', 'Borrowed Light (No.235)', 'Sea Salt (SW 6204)', 'Misty (SW 6232)', 'All White (No.2005)'],
            'accent_colors': ['Lulworth Blue (No.89)', 'Stiffkey Blue (No.281)', 'Sleepy Blue (SW 6225)', 'Stone Blue (No.86)'],
            'style_notes': 'Light, airy colors with spa-like qualities work well in bathrooms.'
        }
    }
    
    suggestions = room_suggestions.get(room_type.lower(), {
        'recommended': ['Agreeable Gray (SW 7029)', 'White Dove (OC-17)', 'Revere Pewter (HC-172)'],
        'accent_colors': ['Naval (SW 6244)', 'Hunter Green (2041-10)', 'Caliente (AF-290)'],
        'style_notes': 'Classic neutral colors work well in most spaces.'
    })
    
    return {"data": suggestions}

# Helper function to filter product images
def _is_product_image(src: str) -> bool:
    """
    Filter function to identify likely product images and exclude common non-product images
    """
    if not src:
        return False
    
    src_lower = src.lower()
    
    # Exclude common non-product image patterns
    exclude_patterns = [
        'logo', 'icon', 'banner', 'header', 'footer', 'nav', 'menu',
        'social', 'facebook', 'twitter', 'instagram', 'pinterest',
        'badge', 'award', 'certification', 'payment', 'shipping',
        'thumbnail', 'avatar', 'profile', 'user', 'author',
        'advertisement', 'ad', 'promo', 'sale', 'discount',
        'background', 'bg', 'pattern', 'texture', 'watermark',
        'placeholder', 'loading', 'spinner', 'arrow', 'button',
        'star', 'rating', 'review', 'comment', 'share'
    ]
    
    # Check if any exclude pattern is in the image source
    for pattern in exclude_patterns:
        if pattern in src_lower:
            return False
    
    # Prefer images with product-related keywords
    product_patterns = [
        'product', 'item', 'main', 'hero', 'primary', 'featured',
        'gallery', 'zoom', 'large', 'detail', 'view'
    ]
    
    # Give preference to images with product keywords
    for pattern in product_patterns:
        if pattern in src_lower:
            return True
    
    # Check image dimensions if available in URL (some sites include dimensions)
    # Prefer larger images (likely product images)
    dimension_match = re.search(r'(\d+)x(\d+)', src_lower)
    if dimension_match:
        width, height = int(dimension_match.group(1)), int(dimension_match.group(2))
        # Prefer images larger than 200x200 but not too large (banners)
        if 200 <= width <= 2000 and 200 <= height <= 2000:
            return True
        elif width < 100 or height < 100:  # Too small, likely icon
            return False
    
    # Default to True if no exclusion patterns found
    return True

# Helper function to filter description text
def _is_description_text(text: str) -> bool:
    """
    Filter function to identify likely product description text
    """
    if not text or len(text.strip()) <= 10:
        return False
    
    text_lower = text.lower().strip()
    
    # Exclude common non-description patterns
    exclude_patterns = [
        'add to cart', 'buy now', 'purchase', 'checkout', 'price', 'shipping',
        'return policy', 'warranty', 'guarantee', 'contact us', 'customer service',
        'sign up', 'newsletter', 'subscribe', 'follow us', 'social media',
        'copyright', '©', 'all rights reserved', 'terms', 'privacy',
        'menu', 'navigation', 'search', 'filter', 'sort by', 'view all',
        'related products', 'you may also like', 'recently viewed',
        'breadcrumb', 'home >', 'category >', 'product >', 
        'quantity', 'size guide', 'color options', 'select option',
        'out of stock', 'in stock', 'availability', 'sku:', 'model:',
        'share this', 'print', 'email', 'wishlist', 'compare'
    ]
    
    # Check if any exclude pattern is in the text
    for pattern in exclude_patterns:
        if pattern in text_lower:
            return False
    
    # Prefer text with description-related keywords
    description_indicators = [
        'description', 'details', 'features', 'specifications', 'about',
        'overview', 'product information', 'made from', 'crafted',
        'designed', 'perfect for', 'ideal for', 'suitable for',
        'dimensions', 'material', 'finish', 'style', 'collection'
    ]
    
    # Give preference to text with description keywords
    for indicator in description_indicators:
        if indicator in text_lower:
            return True
    
    # Check for reasonable description length (not too short, not too long)
    word_count = len(text.split())
    if 5 <= word_count <= 100:  # Reasonable description length
        return True
    
    return False

# Helper function to extract SKU from text
def _extract_sku_from_text(text: str) -> Optional[str]:
    """
    Extract SKU/Item Number from text with enhanced filtering
    """
    if not text or len(text.strip()) <= 2:
        return None
    
    text = text.strip()
    
    # Look for common SKU patterns
    sku_patterns = [
        r'(?:SKU|Item|Model|Part)[\s#:]*([A-Z0-9\-]{3,})',  # SKU: ABC123
        r'([A-Z]{2,}[0-9]{2,}[A-Z0-9\-]*)',  # ABC123, AB12CD
        r'([0-9]{3,}[A-Z]{1,}[0-9A-Z\-]*)',  # 123A, 123ABC
        r'([A-Z0-9\-]{5,})'  # Generic alphanumeric 5+ chars
    ]
    
    for pattern in sku_patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            sku = match.group(1) if match.groups() else match.group()
            # Filter out common non-SKU patterns
            if not re.match(r'^(ADD|BUY|CART|SHOP|VIEW|MORE|LESS|SIZE|COLOR)$', sku, re.IGNORECASE):
                return sku
    
    return None

# Helper function to extract dimensions from text
def _extract_dimensions_from_text(text: str) -> Optional[str]:
    """
    Extract dimension information from text with enhanced filtering
    """
    if not text or len(text.strip()) <= 5:
        return None
    
    text = text.strip()
    
    # Look for dimension patterns like "24"W x 18"H x 12"D", "12 x 8 x 6 inches", etc.
    dimension_patterns = [
        r'[\d.]+"?\s*[WwHhDdLl][\s\x]*[\d.]+"?\s*[WwHhDdLl][\s\x]*[\d.]+"?\s*[WwHhDdLl]',  # 24"W x 18"H x 12"D
        r'[\d.]+"?\s*[WwHhDdLl][\s\x]*[\d.]+"?\s*[WwHhDdLl]',  # 24"W x 18"H
        r'\d+\.?\d*\s*[x×]\s*\d+\.?\d*\s*[x×]\s*\d+\.?\d*\s*(?:inches?|in\.?|cm|mm)',  # 12 x 8 x 6 inches
        r'\d+\.?\d*\s*[x×]\s*\d+\.?\d*\s*(?:inches?|in\.?|cm|mm)',  # 12 x 8 inches
        r'(?:dimensions?|size):\s*[\d.]+"?\s*[WwHhDdLl][\s\x]*[\d.]+"?\s*[WwHhDdLl]',  # Dimensions: 24"W x 18"H
    ]
    
    for pattern in dimension_patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            return match.group().strip()
    
    return None

# Advanced Product Scraping with Playwright for JavaScript-rendered content
async def scrape_product_with_playwright(url: str) -> Dict[str, Optional[str]]:
    """
    Advanced product scraping using Playwright for JavaScript-rendered wholesale sites
    Handles Four Hands, Uttermost, and other wholesale vendors with dynamic content
    """
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(
            user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        )
        page = await context.new_page()
        
        try:
            # Navigate to the URL with extended timeout and different wait strategy
            await page.goto(url, wait_until='domcontentloaded', timeout=60000)
            
            # Wait for potential dynamic content to load
            await page.wait_for_timeout(5000)
            
            # Try to wait for common product elements to appear
            try:
                await page.wait_for_selector('h1, [class*="title"], [class*="product"]', timeout=10000)
            except:
                pass  # Continue even if specific selectors don't appear
            
            # Initialize result structure
            result = {
                'name': None,
                'vendor': None,
                'cost': None,
                'price': None,
                'image_url': None,
                'finish_color': None,
                'size': None,
                'description': None,
                'sku': None,
                'availability': None
            }
            
            # Extract vendor from URL
            domain = url.split('/')[2].lower()
            vendor_mapping = {
                'fourhands.com': 'Four Hands',
                'uttermost.com': 'Uttermost',
                'rowefurniture.com': 'Rowe Furniture',
                'reginaandrew.com': 'Regina Andrew',
                'bernhardt.com': 'Bernhardt',
                'loloi.com': 'Loloi Rugs',
                'vandh.com': 'Vandh',
                'visualcomfort.com': 'Visual Comfort',
                'hvlgroup.com': 'HVL Group',
                'flowdecor.com': 'Flow Decor',
                'classichome.com': 'Classic Home',
                'crestviewcollection.com': 'Crestview Collection',
                'bassettmirror.com': 'Bassett Mirror',
                'eichholtz.com': 'Eichholtz'
            }
            
            for domain_key, vendor_name in vendor_mapping.items():
                if domain_key in domain:
                    result['vendor'] = vendor_name
                    break
            
            # Universal selectors for common product information
            name_selectors = [
                'h1[class*="product"], h1[class*="title"], h1.title, h1.product-title',
                '[data-testid="product-title"], [data-test="product-title"]',
                '.product-name, .product-title, .item-title, .page-title',
                'h1, h2:first-of-type'
            ]
            
            # Enhanced price selectors for JavaScript-rendered content
            price_selectors = [
                # Four Hands specific selectors (JavaScript-rendered)
                '.price .money, .product-price .money, [data-price], .price-current',
                '.product-form__price, .product__price, .price__sale, .price__regular',
                '.price-item--regular, .price__regular, .price--highlight',
                'span[class*="price"], div[class*="price"]',
                # Shopify common selectors
                '.product__price .money, .product-form__price .money',
                '.price-list .price-item, .product-price-wrap .price',
                # Generic selectors
                '[class*="price"]:not([class*="original"]):not([class*="old"])',
                '[data-testid*="price"], [data-test*="price"]',
                '.cost, .pricing, .product-price, .price-current',
                # Text-based approach for dynamic content
                'span, div, p'  # Will filter for $ content in code
            ]
            
            # Enhanced image selectors for JavaScript-rendered content  
            image_selectors = [
                # Four Hands and Shopify specific selectors
                '.product__media img, .product-media img, .product-photos img',
                '.product-gallery img, .hero-image img, .main-image img',
                'img[class*="product"], img[class*="hero"], img[class*="main"]',
                'img[class*="featured"], img[class*="primary"]',
                # Generic product image selectors
                '[data-testid*="image"] img, [data-test*="image"] img',
                '.product-image img, .hero-image img, .main-image img',
                'img[src*="product"], img[src*="item"], img[src*="cdn"]',
                # Last resort - all images, will filter for product images
                'img'
            ]
            
            # Enhanced description selectors for JavaScript-rendered content
            description_selectors = [
                # Shopify and modern e-commerce selectors
                '.product__description, .product-description, .product-content',
                '.product-single__description, .product-form__description',
                '[class*="description"], [class*="detail"], [class*="content"]',
                '[data-testid*="description"], [data-test*="description"]',
                '.rte, .rich-text, .formatted-text',
                # Generic selectors
                '.product-description, .item-details, .product-details',
                'p, div'  # Will filter for description-like content
            ]
            
            # Try to extract product name
            for selector in name_selectors:
                try:
                    element = await page.query_selector(selector)
                    if element:
                        text = await element.inner_text()
                        if text and len(text.strip()) > 0:
                            result['name'] = text.strip()
                            break
                except:
                    continue
            
            # Try to extract price with enhanced JavaScript handling
            for selector in price_selectors:
                try:
                    if selector == 'span, div, p':  # Special handling for text-based search
                        elements = await page.query_selector_all(selector)
                        for element in elements[:50]:  # Limit to first 50 elements for performance
                            try:
                                text = await element.inner_text()
                                if '$' in text:
                                    price_match = re.search(r'\$[\d,]+\.?\d*', text)
                                    if price_match:
                                        result['cost'] = price_match.group()
                                        result['price'] = price_match.group()
                                        break
                            except:
                                continue
                        if result['price']:  # If found, break outer loop
                            break
                    else:  # Regular selector handling
                        element = await page.query_selector(selector)
                        if element:
                            text = await element.inner_text()
                            price_match = re.search(r'\$[\d,]+\.?\d*', text)
                            if price_match:
                                result['cost'] = price_match.group()
                                result['price'] = price_match.group()
                                break
                except:
                    continue
            
            # Try to extract main product image with better filtering
            for selector in image_selectors:
                try:
                    if selector == 'img':  # Special handling for all images
                        elements = await page.query_selector_all(selector)
                        for element in elements:
                            try:
                                src = await element.get_attribute('src')
                                if src and _is_product_image(src):
                                    # Convert relative URLs to absolute
                                    if src.startswith('//'):
                                        src = 'https:' + src
                                    elif src.startswith('/'):
                                        base_url = '/'.join(url.split('/')[:3])
                                        src = base_url + src
                                    result['image_url'] = src
                                    break
                            except:
                                continue
                        if result['image_url']:  # If found, break outer loop
                            break
                    else:  # Regular selector handling
                        element = await page.query_selector(selector)
                        if element:
                            src = await element.get_attribute('src')
                            if src:
                                # Convert relative URLs to absolute
                                if src.startswith('//'):
                                    src = 'https:' + src
                                elif src.startswith('/'):
                                    base_url = '/'.join(url.split('/')[:3])
                                    src = base_url + src
                                result['image_url'] = src
                                break
                except:
                    continue
            
            # Try to extract description with enhanced filtering
            for selector in description_selectors:
                try:
                    if selector == 'p, div':  # Special handling for generic elements
                        elements = await page.query_selector_all(selector)
                        for element in elements:
                            try:
                                text = await element.inner_text()
                                if text and _is_description_text(text):
                                    result['description'] = text.strip()[:500]  # Limit length
                                    break
                            except:
                                continue
                        if result['description']:  # If found, break outer loop
                            break
                    else:  # Regular selector handling
                        element = await page.query_selector(selector)
                        if element:
                            text = await element.inner_text()
                            if text and len(text.strip()) > 10:
                                result['description'] = text.strip()[:500]  # Limit length
                                break
                except:
                    continue
            
            # Enhanced dimensions/size selectors for JavaScript-rendered content
            size_selectors = [
                # Specific dimension/size selectors
                '.product-dimensions, .product-size, .dimensions, .size-info',
                '[class*="dimension"], [class*="size"], [class*="measurement"]',
                '[data-testid*="dimension"], [data-test*="size"]',
                '.product-details .dimensions, .product-specs .size',
                # Generic elements that might contain size info
                'span, div, p'  # Will filter for dimension-like content
            ]
            
            for selector in size_selectors:
                try:
                    element = await page.query_selector(selector)
                    if element:
                        text = await element.inner_text()
                        # Look for dimension patterns like "24"W x 18"H x 12"D"
                        size_match = re.search(r'[\d.]+"?\s*[WwHhDdLl][\s\x]*[\d.]+"?\s*[WwHhDdLl]', text)
                        if size_match:
                            result['size'] = size_match.group()
                            break
                except:
                    continue
            
            # Enhanced SKU/Item Number selectors for JavaScript-rendered content
            sku_selectors = [
                # Shopify and modern e-commerce selectors
                '.product-form__sku, .product__sku, .sku-value',
                '.product-meta .sku, .product-info .sku',
                '[class*="sku"], [class*="item-number"], [class*="product-id"]',
                '[class*="model"], [class*="part-number"]',
                '[data-testid*="sku"], [data-test*="sku"]',
                'span, div, p'  # Will filter for SKU-like content
            ]
            
            # Try to extract SKU/Item Number with enhanced filtering
            for selector in sku_selectors:
                try:
                    if selector == 'span, div, p':  # Special handling for generic elements
                        elements = await page.query_selector_all(selector)
                        for element in elements:
                            try:
                                text = await element.inner_text()
                                if text and _extract_sku_from_text(text):
                                    result['sku'] = _extract_sku_from_text(text)
                                    break
                            except:
                                continue
                        if result['sku']:  # If found, break outer loop
                            break
                    else:  # Regular selector handling
                        element = await page.query_selector(selector)
                        if element:
                            text = await element.inner_text()
                            sku_match = re.search(r'[A-Z0-9\-]{3,}', text)
                            if sku_match:
                                result['sku'] = sku_match.group()
                                break
                except:
                    continue
            
            # Extract color/finish information
            color_selectors = [
                '[class*="color"], [class*="finish"], [class*="material"]',
                'span:contains("Color"), span:contains("Finish"), div:contains("Material")'
            ]
            
            for selector in color_selectors:
                try:
                    element = await page.query_selector(selector)
                    if element:
                        text = await element.inner_text()
                        if 'color' in text.lower() or 'finish' in text.lower():
                            result['finish_color'] = text.strip()
                            break
                except:
                    continue
            
            return result
            
        except Exception as e:
            print(f"Error scraping {url}: {str(e)}")
            return {
                'name': None,
                'vendor': None,
                'cost': None,
                'price': None,
                'image_url': None,
                'finish_color': None,
                'size': None,
                'description': f"Error scraping product: {str(e)}",
                'sku': None,
                'availability': None
            }
        finally:
            await browser.close()

@api_router.post("/scrape-product")
async def scrape_product_advanced(data: dict):
    """
    Advanced product scraping endpoint using Playwright
    Handles JavaScript-rendered wholesale sites like Four Hands, Uttermost, etc.
    """
    url = data.get('url', '')
    if not url:
        raise HTTPException(status_code=400, detail="URL is required")
    
    try:
        product_info = await scrape_product_with_playwright(url)
        return {"success": True, "data": product_info}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to scrape URL: {str(e)}")

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
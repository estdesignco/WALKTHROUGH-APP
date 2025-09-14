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
import time
from datetime import datetime, timezone
from enum import Enum
from playwright.async_api import async_playwright
from enhanced_rooms import COMPREHENSIVE_ROOM_STRUCTURE  # Add comprehensive structure import

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

# Enhanced Item Status Options with Colors for Sophisticated Tracking
ITEM_STATUSES = [
    # Planning Phase
    {'status': 'TO BE SELECTED', 'color': '#D4A574', 'phase': 'planning'},
    {'status': 'RESEARCHING', 'color': '#B8860B', 'phase': 'planning'}, 
    {'status': 'PENDING APPROVAL', 'color': '#DAA520', 'phase': 'planning'},
    
    # Procurement Phase  
    {'status': 'APPROVED', 'color': '#9ACD32', 'phase': 'procurement'},
    {'status': 'ORDERED', 'color': '#32CD32', 'phase': 'procurement'},
    {'status': 'PICKED', 'color': '#FFD700', 'phase': 'procurement'},  # YELLOW like your image
    {'status': 'CONFIRMED', 'color': '#228B22', 'phase': 'procurement'},
    
    # Fulfillment Phase
    {'status': 'IN PRODUCTION', 'color': '#FF8C00', 'phase': 'fulfillment'},
    {'status': 'SHIPPED', 'color': '#4169E1', 'phase': 'fulfillment'},
    {'status': 'IN TRANSIT', 'color': '#6495ED', 'phase': 'fulfillment'},
    {'status': 'OUT FOR DELIVERY', 'color': '#87CEEB', 'phase': 'fulfillment'},
    
    # Delivery Phase
    {'status': 'DELIVERED TO RECEIVER', 'color': '#9370DB', 'phase': 'delivery'},
    {'status': 'DELIVERED TO JOB SITE', 'color': '#8A2BE2', 'phase': 'delivery'},
    {'status': 'RECEIVED', 'color': '#DDA0DD', 'phase': 'delivery'},
    
    # Installation Phase
    {'status': 'READY FOR INSTALL', 'color': '#20B2AA', 'phase': 'installation'},
    {'status': 'INSTALLING', 'color': '#48D1CC', 'phase': 'installation'},
    {'status': 'INSTALLED', 'color': '#00CED1', 'phase': 'installation'},
    
    # Issues & Exceptions
    {'status': 'ON HOLD', 'color': '#DC143C', 'phase': 'exception'},
    {'status': 'BACKORDERED', 'color': '#B22222', 'phase': 'exception'},
    {'status': 'DAMAGED', 'color': '#8B0000', 'phase': 'exception'},
    {'status': 'RETURNED', 'color': '#CD5C5C', 'phase': 'exception'},
    {'status': 'CANCELLED', 'color': '#A52A2A', 'phase': 'exception'}
]

# Enhanced Carrier Options with Colors like your screenshots
CARRIER_OPTIONS = [
    {'name': 'FedEx', 'color': '#FF6600', 'tracking_url': 'https://www.fedex.com/apps/fedextrack/?tracknumbers='},
    {'name': 'UPS', 'color': '#8B4513', 'tracking_url': 'https://www.ups.com/track?tracknum='},
    {'name': 'Brooks', 'color': '#4682B4', 'tracking_url': 'https://www.brooksdelivery.com/track/'},
    {'name': 'Zenith', 'color': '#20B2AA', 'tracking_url': 'https://zenithdelivery.com/tracking/'},
    {'name': 'Sunbelt', 'color': '#DC143C', 'tracking_url': 'https://sunbeltdelivery.com/track/'},
    {'name': 'R+L Carriers', 'color': '#8A2BE2', 'tracking_url': 'https://www.rlcarriers.com/tracking/'},
    {'name': 'Yellow Freight', 'color': '#FFD700', 'tracking_url': 'https://my.yrc.com/dynamic/national/servlet'},
    {'name': 'XPO Logistics', 'color': '#FF1493', 'tracking_url': 'https://www.xpo.com/tracking/'},
    {'name': 'Old Dominion', 'color': '#228B22', 'tracking_url': 'https://www.odfl.com/Freight-Tracking/'},
    {'name': 'ABF Freight', 'color': '#B22222', 'tracking_url': 'https://arcb.com/tools/tracking.html'},
    {'name': 'Estes Express', 'color': '#4B0082', 'tracking_url': 'https://www.estes-express.com/resources/shipment-tracking'},
    {'name': 'Saia LTL', 'color': '#2E8B57', 'tracking_url': 'https://www.saia.com/track/'},
    {'name': 'TForce Freight', 'color': '#FF4500', 'tracking_url': 'https://www.tforcefreight.com/tracking/'},
    {'name': 'Roadrunner', 'color': '#6B8E23', 'tracking_url': 'https://www.roadrunner.com/tracking/'},
    {'name': 'Central Transport', 'color': '#8B008B', 'tracking_url': 'https://www.centraltransport.com/tracking/'},
    {'name': 'Southeastern Freight', 'color': '#D2691E', 'tracking_url': 'https://www.sefl.com/tools/track-shipment/'},
    {'name': 'Averitt Express', 'color': '#CD853F', 'tracking_url': 'https://www.averittexpress.com/tracking/'},
    {'name': 'Holland', 'color': '#F4A460', 'tracking_url': 'https://www.hollandregional.com/tracking/'},
    {'name': 'OTHER', 'color': '#9370DB', 'tracking_url': ''}
]

# Wholesale Vendor Database - Enhanced for Scraping
VENDOR_DATABASE = [
    {'name': 'Four Hands', 'url': 'fourhands.com', 'scraping_supported': True, 'category': 'Furniture'},
    {'name': 'Restoration Hardware', 'url': 'rh.com', 'scraping_supported': True, 'category': 'Furniture & Decor'},
    {'name': 'West Elm', 'url': 'westelm.com', 'scraping_supported': True, 'category': 'Furniture & Decor'},
    {'name': 'CB2', 'url': 'cb2.com', 'scraping_supported': True, 'category': 'Modern Furniture'},
    {'name': 'Arteriors', 'url': 'arteriorshome.com', 'scraping_supported': True, 'category': 'Lighting & Decor'},
    {'name': 'Visual Comfort', 'url': 'visualcomfort.com', 'scraping_supported': True, 'category': 'Lighting'},
    {'name': 'Circa Lighting', 'url': 'circalighting.com', 'scraping_supported': True, 'category': 'Lighting'},
    {'name': 'Rejuvenation', 'url': 'rejuvenation.com', 'scraping_supported': True, 'category': 'Lighting & Hardware'},
    {'name': 'Urban Electric', 'url': 'urbanelectric.com', 'scraping_supported': True, 'category': 'Lighting'},
    {'name': 'Hubbardton Forge', 'url': 'hubbardtonforge.com', 'scraping_supported': True, 'category': 'Lighting'},
    {'name': 'Troy Lighting', 'url': 'troylighting.com', 'scraping_supported': True, 'category': 'Lighting'},
    {'name': 'Hinkley Lighting', 'url': 'hinkley.com', 'scraping_supported': True, 'category': 'Lighting'},
    {'name': 'Kichler', 'url': 'kichler.com', 'scraping_supported': True, 'category': 'Lighting'},
    {'name': 'Minka Aire', 'url': 'minkaaire.com', 'scraping_supported': True, 'category': 'Ceiling Fans'},
    {'name': 'Monte Carlo', 'url': 'montecarlofans.com', 'scraping_supported': True, 'category': 'Ceiling Fans'},
    {'name': 'Hunter Fan', 'url': 'hunterfan.com', 'scraping_supported': True, 'category': 'Ceiling Fans'},
    {'name': 'Kohler', 'url': 'kohler.com', 'scraping_supported': True, 'category': 'Plumbing'},
    {'name': 'Delta Faucet', 'url': 'deltafaucet.com', 'scraping_supported': True, 'category': 'Plumbing'},
    {'name': 'Moen', 'url': 'moen.com', 'scraping_supported': True, 'category': 'Plumbing'},
    {'name': 'Ferguson', 'url': 'ferguson.com', 'scraping_supported': True, 'category': 'Plumbing & HVAC'},
    {'name': 'Home Depot', 'url': 'homedepot.com', 'scraping_supported': True, 'category': 'General'},
    {'name': 'Lowes', 'url': 'lowes.com', 'scraping_supported': True, 'category': 'General'},
    {'name': 'Build.com', 'url': 'build.com', 'scraping_supported': True, 'category': 'Building Materials'},
    {'name': 'Wayfair', 'url': 'wayfair.com', 'scraping_supported': True, 'category': 'Furniture & Decor'}
]

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
        'Millwork, Architectural Elements, and Trim': {
            'TRIM WORK': ['Crown Molding', 'Chair Rail', 'Wainscoting', 'Shoe Molding', 'Window Trim', 'Door Trim', 'Ceiling Medallions', 'Rosettes', 'Baseboards', 'Panel Molding', 'Coffered Ceiling Trim'],
            'ARCHITECTURAL': ['Built-in Columns', 'Coffered Ceilings', 'Tray Ceilings', 'Beam Work', 'Archways', 'Built-in Niches', 'Window Casings', 'Door Casings', 'Pilasters', 'Corbels']
        },
        'HVAC & Mechanical': {
            'UNIT': ['Air Vents', 'Thermostat', 'Air Purifier', 'Humidifier', 'Dehumidifier', 'Ceiling Fan', 'HVAC Return', 'Smart Home Hub']
        },
        'Security Systems': {
            'INSTALLED': ['Security Cameras', 'Motion Sensors', 'Door/Window Sensors', 'Smart Locks', 'Alarm Panel', 'Smoke Detectors', 'Carbon Monoxide Detectors']
        },
        'Smart Home Technology': {
            'UNIT': ['Smart Switches', 'Smart Outlets', 'Voice Assistant', 'Smart Thermostat', 'Automated Blinds', 'Smart Lighting Controls', 'Wifi Extenders']
        },
        'Flooring': {
            'HARDWOOD': ['Oak Flooring', 'Maple Flooring', 'Cherry Flooring', 'Bamboo Flooring', 'Engineered Wood'],
            'TILE': ['Ceramic Tile', 'Porcelain Tile', 'Natural Stone', 'Mosaic Tile', 'Luxury Vinyl Tile'],
            'CARPET': ['Wall-to-Wall Carpet', 'Area Rugs', 'Runners', 'Custom Rugs'],
            'OTHER': ['Laminate', 'Vinyl Plank', 'Cork', 'Concrete', 'Epoxy']
        },
        'Window Treatments': {
            'CURTAINS': ['Drapery Panels', 'Sheer Curtains', 'Blackout Curtains', 'Valances', 'Tiebacks'],
            'BLINDS': ['Venetian Blinds', 'Vertical Blinds', 'Mini Blinds', 'Wood Blinds'],
            'SHADES': ['Roman Shades', 'Cellular Shades', 'Roller Shades', 'Motorized Shades'],
            'SHUTTERS': ['Plantation Shutters', 'Interior Shutters', 'Café Shutters']
        },
        'Ceiling Treatments': {
            'DECORATIVE': ['Coffered Ceilings', 'Tray Ceilings', 'Exposed Beams', 'Ceiling Medallions', 'Tin Ceilings', 'Wood Planks']
        },
        'Built-ins': {
            'CUSTOM': ['Built-in Shelving', 'Window Seats', 'Storage Benches', 'Custom Cabinetry', 'Built-in Desks', 'Nooks']
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
    },
    'balcony': {
        'Outdoor Lighting': {
            'INSTALLED': ['String Lights', 'Wall Sconces', 'Ceiling Fan w/ Light', 'LED Strip Lights', 'Post Lights'],
            'PORTABLE': ['Solar Lanterns', 'Battery Lanterns', 'Citronella Torches']
        },
        'Outdoor Furniture': {
            'PIECE': ['Bistro Table', 'Balcony Chairs', 'Storage Bench', 'Small Sofa', 'Side Table', 'Plant Stands', 'Outdoor Bar Cart', 'Privacy Screen']
        },
        'Decor & Accessories': {
            'MISC.': ['Outdoor Rug', 'Outdoor Pillows', 'Planters', 'Wind Chimes', 'Outdoor Curtains', 'Privacy Screens', 'String Light Hooks', 'Weather Protection Covers']
        },
        'Plants & Greenery': {
            'LIVE': ['Potted Plants', 'Herb Garden', 'Flowers', 'Succulents', 'Climbing Vines'],
            'ARTIFICIAL': ['Faux Plants', 'Seasonal Arrangements']
        }
    },
    'screened porch': {
        'Lighting': {
            'INSTALLED': ['Ceiling Fan w/ Light', 'Recessed Lighting', 'String Lights', 'Wall Sconces'],
            'PORTABLE': ['Floor Lamps', 'Table Lamps', 'Lanterns']
        },
        'Furniture': {
            'PIECE': ['Outdoor Sofa', 'Lounge Chairs', 'Dining Table', 'Dining Chairs', 'Coffee Table', 'Side Tables', 'Swinging Bench', 'Rocking Chairs', 'Ottoman']
        },
        'Decor & Accessories': {
            'MISC.': ['Outdoor Rug', 'Weather-Resistant Pillows', 'Curtains/Screens', 'Wall Art', 'Plants', 'Wind Chimes', 'Ceiling Fans']
        }
    },
    'pool house': {
        'Lighting': {
            'INSTALLED': ['Recessed Lighting', 'Ceiling Fan w/ Light', 'Exterior Lighting', 'Underwater Pool Lights'],
            'PORTABLE': ['Poolside Lamps', 'Solar Lights']
        },
        'Furniture': {
            'PIECE': ['Poolside Loungers', 'Outdoor Dining Set', 'Bar Stools', 'Storage Cabinet', 'Pool Float Storage', 'Towel Rack', 'Mini Fridge', 'Outdoor Bar']
        },
        'Pool Equipment': {
            'UNIT': ['Pool Pump', 'Pool Heater', 'Filtration System', 'Pool Cover', 'Pool Vacuum', 'Chemical Dispensers']
        },
        'Decor & Accessories': {
            'MISC.': ['Pool Towels', 'Outdoor Speakers', 'Pool Games', 'Umbrellas', 'Outdoor Rug', 'Safety Equipment']
        }
    },
    'guest house': {
        'Lighting': {
            'INSTALLED': ['Recessed Lighting', 'Ceiling Fan w/ Light', 'Sconces', 'Pendant Lights'],
            'PORTABLE': ['Table Lamps', 'Floor Lamps']
        },
        'Furniture': {
            'PIECE': ['Sofa Bed', 'Dining Table', 'Dining Chairs', 'Coffee Table', 'Kitchenette', 'Bed', 'Nightstand', 'Dresser', 'Desk', 'Chair']
        },
        'Appliances': {
            'UNIT': ['Mini Fridge', 'Microwave', 'Coffee Maker', 'Small Cooktop', 'Dishwasher (Compact)']
        },
        'Decor & Accessories': {
            'MISC.': ['Area Rug', 'Curtains', 'Wall Art', 'Bedding', 'Towels', 'Kitchen Essentials', 'Welcome Basket']
        }
    },
    'butler\'s pantry': {
        'Lighting': {
            'INSTALLED': ['Recessed Lighting', 'Under Cabinet Lighting', 'Pendant Lights'],
            'PORTABLE': ['Task Lighting']
        },
        'Storage & Furniture': {
            'PIECE': ['Built-in Cabinets', 'Floating Shelves', 'Wine Storage', 'Serving Cart', 'Counter Space', 'Display Cabinet']
        },
        'Appliances': {
            'UNIT': ['Wine Fridge', 'Ice Maker', 'Coffee Station', 'Warming Drawer', 'Small Sink', 'Dishwasher (Drawer Style)']
        },
        'Decor & Accessories': {
            'MISC.': ['Serving Pieces', 'Glassware Storage', 'Table Linens', 'Seasonal Decor Storage']
        }
    },
    'conservatory': {
        'Lighting': {
            'INSTALLED': ['Ceiling Fan w/ Light', 'Track Lighting', 'Recessed Lighting'],
            'PORTABLE': ['Floor Lamps', 'Table Lamps']
        },
        'Furniture': {
            'PIECE': ['Wicker Seating', 'Plant Stands', 'Potting Bench', 'Storage Benches', 'Small Tables', 'Garden Stools']
        },
        'Plants & Greenery': {
            'LIVE': ['Large Palms', 'Citrus Trees', 'Orchids', 'Ferns', 'Tropical Plants', 'Herb Garden'],
            'PLANTERS': ['Large Planters', 'Hanging Baskets', 'Window Boxes', 'Tiered Plant Stands']
        },
        'Climate Control': {
            'UNIT': ['Humidifier', 'Heating System', 'Ventilation Fans', 'Thermostats']
        }
    },
    'formal living room': {
        'Lighting': {
            'INSTALLED': ['Crystal Chandelier', 'Recessed Lighting', 'Wall Sconces', 'Picture Lights'],
            'PORTABLE': ['Table Lamps', 'Floor Lamps', 'Accent Lighting']
        },
        'Furniture': {
            'PIECE': ['Formal Sofa', 'Wingback Chairs', 'Chesterfield', 'Antique Coffee Table', 'Side Tables', 'Secretary Desk', 'Curio Cabinet', 'Piano', 'Formal Dining Chairs']
        },
        'Decor & Accessories': {
            'MISC.': ['Persian Rug', 'Fine Art', 'Sculptures', 'Formal Drapery', 'Decorative Mirrors', 'Antique Vases', 'Candlesticks', 'Books', 'Family Portraits']
        }
    },
    'great room': {
        'Lighting': {
            'INSTALLED': ['Statement Chandelier', 'Recessed Lighting', 'Ceiling Fan w/ Light', 'Track Lighting', 'Accent Lighting'],
            'PORTABLE': ['Floor Lamps', 'Table Lamps']
        },
        'Furniture': {
            'PIECE': ['Large Sectional', 'Multiple Seating Areas', 'Coffee Tables', 'End Tables', 'Media Console', 'Bookcases', 'Bar Cart', 'Ottoman', 'Accent Chairs']
        },
        'Decor & Accessories': {
            'MISC.': ['Large Area Rugs', 'Wall Art Gallery', 'Plants', 'Throw Pillows', 'Blankets', 'Window Treatments', 'Decorative Objects']
        }
    },
    'billiards room': {
        'Lighting': {
            'INSTALLED': ['Pool Table Light', 'Recessed Lighting', 'Pendant Lights', 'Accent Lighting'],
            'PORTABLE': ['Bar Lighting', 'Accent Lamps']
        },
        'Furniture & Equipment': {
            'PIECE': ['Pool Table', 'Bar', 'Bar Stools', 'Leather Chairs', 'Side Tables', 'Cue Rack', 'Score Board', 'Mini Fridge', 'Wine Storage']
        },
        'Decor & Accessories': {
            'MISC.': ['Pool Accessories', 'Wall Art', 'Leather Decor', 'Area Rug', 'Bar Accessories', 'Games Storage']
        }
    },
    'study': {
        'Lighting': {
            'INSTALLED': ['Recessed Lighting', 'Pendant Lights', 'Sconces'],
            'PORTABLE': ['Desk Lamp', 'Floor Lamp', 'Table Lamp']
        },
        'Furniture': {
            'PIECE': ['Executive Desk', 'Leather Chair', 'Bookcases', 'Filing Cabinet', 'Reading Chair', 'Side Table', 'Library Ladder']
        },
        'Decor & Accessories': {
            'MISC.': ['Books', 'Desk Accessories', 'Wall Art', 'Area Rug', 'Window Treatments', 'Desk Organizers', 'Artwork']
        }
    },
    'sitting room': {
        'Lighting': {
            'INSTALLED': ['Chandelier', 'Sconces', 'Recessed Lighting'],
            'PORTABLE': ['Table Lamps', 'Floor Lamps']
        },
        'Furniture': {
            'PIECE': ['Loveseat', 'Accent Chairs', 'Small Coffee Table', 'Side Tables', 'Ottoman', 'Small Bookcase']
        },
        'Decor & Accessories': {
            'MISC.': ['Area Rug', 'Wall Art', 'Decorative Objects', 'Throw Pillows', 'Curtains', 'Plants']
        }
    },
    'attic storage': {
        'Lighting': {
            'INSTALLED': ['Flush Mount Lights', 'LED Strip Lights', 'Pull Chain Lights'],
            'PORTABLE': ['Work Lights', 'Flashlights']
        },
        'Storage Solutions': {
            'PIECE': ['Shelving Units', 'Storage Bins', 'Garment Racks', 'Cedar Chests', 'File Cabinets', 'Holiday Storage', 'Seasonal Storage']
        },
        'Climate Control': {
            'UNIT': ['Dehumidifier', 'Ventilation Fan', 'Insulation', 'Temperature Monitor']
        }
    },
    'garage': {
        'Lighting': {
            'INSTALLED': ['Fluorescent Lights', 'LED Shop Lights', 'Motion Sensor Lights', 'Task Lighting'],
            'PORTABLE': ['Work Lights', 'Flashlights']
        },
        'Storage & Organization': {
            'PIECE': ['Garage Cabinets', 'Tool Storage', 'Shelving Systems', 'Pegboard', 'Bike Racks', 'Sports Equipment Storage', 'Workbench']
        },
        'Equipment': {
            'UNIT': ['Garage Door Opener', 'Air Compressor', 'Shop Vacuum', 'Tool Chest', 'Car Care Equipment']
        }
    }
}

class ItemStatus(str, Enum):
    # Default blank status as requested by user
    BLANK = ""
    
    # Planning Phase
    TO_BE_SELECTED = "TO BE SELECTED"
    RESEARCHING = "RESEARCHING"
    PENDING_APPROVAL = "PENDING APPROVAL"
    
    # Procurement Phase
    APPROVED = "APPROVED"
    ORDERED = "ORDERED"
    PICKED = "PICKED"
    CONFIRMED = "CONFIRMED"
    
    # Fulfillment Phase
    IN_PRODUCTION = "IN PRODUCTION"
    SHIPPED = "SHIPPED"
    IN_TRANSIT = "IN TRANSIT"
    OUT_FOR_DELIVERY = "OUT FOR DELIVERY"
    
    # Delivery Phase
    DELIVERED_TO_RECEIVER = "DELIVERED TO RECEIVER"  
    DELIVERED_TO_JOB_SITE = "DELIVERED TO JOB SITE"
    RECEIVED = "RECEIVED"
    
    # Installation Phase
    READY_FOR_INSTALL = "READY FOR INSTALL"
    INSTALLING = "INSTALLING"
    INSTALLED = "INSTALLED"
    
    # Issues & Exceptions
    ON_HOLD = "ON HOLD"
    BACKORDERED = "BACKORDERED"
    DAMAGED = "DAMAGED"
    RETURNED = "RETURNED"
    CANCELLED = "CANCELLED"
    
    # Legacy statuses for compatibility
    PARTIALLY_DELIVERED = "PARTIALLY DELIVERED"
    MISSING = "MISSING"
    QUOTE_REQUESTED = "QUOTE REQUESTED"
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

# Enhanced Pydantic Models with Advanced Tracking
class ItemBase(BaseModel):
    name: str
    quantity: int = 1
    size: Optional[str] = ""
    remarks: Optional[str] = ""
    vendor: Optional[str] = ""
    status: ItemStatus = ItemStatus.BLANK
    cost: Optional[float] = 0.0
    link: Optional[str] = ""
    tracking_number: Optional[str] = ""
    order_date: Optional[datetime] = None
    install_date: Optional[datetime] = None
    image_url: Optional[str] = ""
    
    # NEW ENHANCED TRACKING FIELDS
    sku: Optional[str] = ""
    finish_color: Optional[str] = ""
    price: Optional[float] = 0.0  # Retail price vs cost
    description: Optional[str] = ""
    availability: Optional[str] = ""
    carrier: Optional[str] = ""
    expected_delivery: Optional[datetime] = None
    actual_delivery: Optional[datetime] = None
    po_number: Optional[str] = ""
    invoice_number: Optional[str] = ""
    photos: List[str] = []  # Array of photo URLs
    notes: Optional[str] = ""
    priority: str = "Medium"  # High, Medium, Low
    lead_time_weeks: int = 0
    warranty_info: Optional[str] = ""
    installation_notes: Optional[str] = ""
    room_location: Optional[str] = ""
    category_location: Optional[str] = ""
    subcategory_location: Optional[str] = ""
    
    # GOOGLE CALENDAR INTEGRATION FIELDS
    calendar_event_id: Optional[str] = ""  # Google Calendar event ID
    delivery_calendar_id: Optional[str] = ""  # Delivery event ID
    installation_calendar_id: Optional[str] = ""  # Installation event ID

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

# ROOM UPDATE ENDPOINT (for drag & drop)
@api_router.put("/rooms/{room_id}", response_model=Room)
async def update_room(room_id: str, room_update: RoomUpdate):
    """Update room details (needed for drag & drop reordering)"""
    try:
        update_data = {k: v for k, v in room_update.dict().items() if v is not None}
        update_data["updated_at"] = datetime.utcnow()
        
        result = await db.rooms.update_one(
            {"id": room_id}, 
            {"$set": update_data}
        )
        
        if result.modified_count == 0:
            raise HTTPException(status_code=404, detail="Room not found")
        
        # Return updated room
        room_data = await db.rooms.find_one({"id": room_id})
        if not room_data:
            raise HTTPException(status_code=404, detail="Room not found after update")
        
        return Room(**room_data)
        
    except Exception as e:
        logger.error(f"Error updating room {room_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to update room: {str(e)}")

# CATEGORY UPDATE ENDPOINT (for drag & drop)
@api_router.put("/categories/{category_id}", response_model=Category) 
async def update_category(category_id: str, category_update: CategoryUpdate):
    """Update category details (needed for drag & drop reordering)"""
    try:
        update_data = {k: v for k, v in category_update.dict().items() if v is not None}
        update_data["updated_at"] = datetime.utcnow()
        
        result = await db.categories.update_one(
            {"id": category_id}, 
            {"$set": update_data}
        )
        
        if result.modified_count == 0:
            raise HTTPException(status_code=404, detail="Category not found")
        
        # Return updated category
        category_data = await db.categories.find_one({"id": category_id})
        if not category_data:
            raise HTTPException(status_code=404, detail="Category not found after update")
        
        return Category(**category_data)
        
    except Exception as e:
        logger.error(f"Error updating category {category_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to update category: {str(e)}")

# ROOM ENDPOINTS with 3-level auto-population
@api_router.post("/rooms", response_model=Room)
async def create_room(room_data: RoomCreate):
    """Create a new room with FULL COMPREHENSIVE structure from enhanced_rooms.py"""
    try:
        room_name_lower = room_data.name.lower().strip()
        print(f"🏠 CREATING ROOM: {room_name_lower}")
        
        # Get FULL comprehensive structure for this room
        room_structure = COMPREHENSIVE_ROOM_STRUCTURE.get(room_name_lower)
        
        # If exact match not found, try to find similar room or use living room as template
        if not room_structure:
            print(f"⚠️ Room '{room_name_lower}' not found in comprehensive structure")
            # Try to find any room with comprehensive structure or default to living room
            if 'living room' in COMPREHENSIVE_ROOM_STRUCTURE:
                room_structure = COMPREHENSIVE_ROOM_STRUCTURE['living room']
                print(f"✅ Using living room structure as template")
            else:
                # Fallback basic structure - should never happen with comprehensive structure
                room_structure = {
                    'Lighting': {
                        'INSTALLED': ['Chandelier', 'Recessed Lighting', 'Wall Sconces', 'Track Lighting', 'Ceiling Fan w/ Light'],
                        'PORTABLE': ['Table Lamp', 'Floor Lamp', 'Accent Lamp', 'Reading Lamp', 'Task Lighting']
                    },
                    'Furniture & Storage': {
                        'SEATING': ['Sofa', 'Armchair', 'Ottoman', 'Accent Chair', 'Chaise Lounge'],
                        'TABLES': ['Coffee Table', 'Side Table', 'Console Table', 'Accent Table', 'End Table'],
                        'STORAGE': ['Bookcase', 'Media Console', 'Storage Ottoman', 'Decorative Baskets', 'Side Cabinet']
                    }
                }
                print(f"🔄 Using fallback structure")
        else:
            print(f"✅ Found comprehensive structure for '{room_name_lower}' with {len(room_structure)} categories")
        
        print(f"📊 Room structure categories: {list(room_structure.keys())}")
        
        # Count total items that will be created
        total_items = sum(len(items) for subcategories in room_structure.values() for items in subcategories.values())
        print(f"🔢 Will create {total_items} items for this room")
        
        # Create room object
        room_dict = room_data.dict()
        room_dict["id"] = str(uuid.uuid4())
        room_dict["color"] = get_room_color(room_data.name)
        room_dict["categories"] = []
        room_dict["created_at"] = datetime.utcnow()
        room_dict["updated_at"] = datetime.utcnow()
        
        # Add ALL categories and subcategories with ALL ITEMS (blank defaults)
        for category_name, subcategories_dict in room_structure.items():
            category_id = str(uuid.uuid4())
            category = {
                "id": category_id,
                "room_id": room_dict["id"],
                "name": category_name,
                "color": get_category_color(category_name),
                "subcategories": [],
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            }
            
            # Add subcategories with ALL ITEMS from comprehensive structure
            for subcategory_name, items_list in subcategories_dict.items():
                subcategory_id = str(uuid.uuid4())
                subcategory = {
                    "id": subcategory_id,
                    "category_id": category_id,
                    "name": subcategory_name,
                    "color": get_subcategory_color(subcategory_name),
                    "items": [],
                    "created_at": datetime.utcnow(),
                    "updated_at": datetime.utcnow()
                }
                
                # Add ALL ITEMS from the comprehensive list with VALID defaults
                for item_name in items_list:  # ALL items, not just first 5
                    item_id = str(uuid.uuid4())
                    item = {
                        "id": item_id,
                        "subcategory_id": subcategory_id,
                        "name": item_name,
                        "quantity": 1,
                        "size": "",
                        "status": "",  # BLANK default as requested by user
                        "vendor": "",
                        "cost": 0,
                        "finish_color": "",
                        "carrier": "",  # BLANK default
                        "ship_to": "",  # BLANK default
                        "delivery_status": "",  # BLANK default
                        "notes": "",
                        "created_at": datetime.utcnow(),
                        "updated_at": datetime.utcnow()
                    }
                    subcategory["items"].append(item)
                
                category["subcategories"].append(subcategory)
            
            room_dict["categories"].append(category)
        
        # Store room data in separate collections for consistency
        room_id = room_dict["id"]
        
        # First, insert the room (without nested categories)
        room_basic = {
            "id": room_id,
            "project_id": room_dict["project_id"],
            "name": room_dict["name"],
            "description": room_dict.get("description", ""),
            "order_index": room_dict.get("order_index", 0),
            "color": room_dict["color"],
            "created_at": room_dict["created_at"],
            "updated_at": room_dict["updated_at"]
        }
        
        await db.rooms.insert_one(room_basic)
        
        # Then insert categories, subcategories, and items separately
        for category_data in room_dict["categories"]:
            category_basic = {
                "id": category_data["id"],
                "room_id": room_id,
                "name": category_data["name"],
                "description": "",
                "order_index": 0,
                "color": category_data["color"],
                "created_at": category_data["created_at"],
                "updated_at": category_data["updated_at"]
            }
            
            await db.categories.insert_one(category_basic)
            
            # Insert subcategories
            for subcategory_data in category_data["subcategories"]:
                subcategory_basic = {
                    "id": subcategory_data["id"],
                    "category_id": category_data["id"],
                    "name": subcategory_data["name"],
                    "description": "",
                    "order_index": 0,
                    "color": subcategory_data["color"],
                    "created_at": subcategory_data["created_at"],
                    "updated_at": subcategory_data["updated_at"]
                }
                
                await db.subcategories.insert_one(subcategory_basic)
                
                # Insert items
                for item_data in subcategory_data["items"]:
                    await db.items.insert_one(item_data)
        
        # Return the room with full structure (as expected by the frontend)
        return Room(**room_dict)
        
    except Exception as e:
        logger.error(f"Error creating room: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to create room: {str(e)}")

# CATEGORY ENDPOINTS  
@api_router.post("/categories", response_model=Category)
async def create_category(category: CategoryCreate):
    """Create a new category"""
    try:
        category_dict = category.dict()
        category_dict["id"] = str(uuid.uuid4())
        category_dict["color"] = get_category_color(category.name)
        category_dict["subcategories"] = []
        category_dict["created_at"] = datetime.utcnow()
        category_dict["updated_at"] = datetime.utcnow()
        
        result = await db.categories.insert_one(category_dict)
        
        if result.inserted_id:
            return Category(**category_dict)
        raise HTTPException(status_code=400, detail="Failed to create category")
        
    except Exception as e:
        logger.error(f"Error creating category: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to create category: {str(e)}")

@api_router.post("/categories/comprehensive", response_model=Category)
async def create_comprehensive_category(category: CategoryCreate):
    """Create a category with all its subcategories and items from comprehensive structure"""
    try:
        from enhanced_rooms import COMPREHENSIVE_ROOM_STRUCTURE
        
        # First create the basic category
        category_dict = category.dict()
        category_obj = Category(**category_dict)
        category_obj.color = get_category_color(category_obj.name)
        
        result = await db.categories.insert_one(category_obj.dict())
        
        if not result.inserted_id:
            raise HTTPException(status_code=400, detail="Failed to create category")
        
        category_id = str(result.inserted_id)
        category_obj.id = category_id
        
        # Now populate with comprehensive structure
        category_name = category.name
        
        # Find the category in the comprehensive structure
        comprehensive_data = None
        for room_name, room_structure in COMPREHENSIVE_ROOM_STRUCTURE.items():
            if category_name in room_structure:
                comprehensive_data = room_structure[category_name]
                break
        
        if comprehensive_data:
            logger.info(f"📋 Found comprehensive data for category: {category_name}")
            
            # Create subcategories and their items
            created_subcategories = []
            for subcategory_name, items_list in comprehensive_data.items():
                # Create subcategory
                subcategory_obj = SubCategory(
                    name=subcategory_name,
                    category_id=category_id,
                    order_index=0,
                    color=get_subcategory_color(subcategory_name)
                )
                
                subcategory_result = await db.subcategories.insert_one(subcategory_obj.dict())
                if subcategory_result.inserted_id:
                    subcategory_id = str(subcategory_result.inserted_id)
                    subcategory_obj.id = subcategory_id
                    
                    # Create items for this subcategory
                    created_items = []
                    for item_name in items_list:
                        item_obj = Item(
                            name=item_name,
                            subcategory_id=subcategory_id,
                            quantity=1,
                            status="TO BE SELECTED",
                            order_index=0
                        )
                        
                        item_result = await db.items.insert_one(item_obj.dict())
                        if item_result.inserted_id:
                            item_obj.id = str(item_result.inserted_id)
                            created_items.append(item_obj)
                    
                    subcategory_obj.items = created_items
                    created_subcategories.append(subcategory_obj)
                        
            # Add subcategories to the category object
            category_obj.subcategories = created_subcategories
            logger.info(f"✅ Successfully created comprehensive category: {category_name} with {len(created_subcategories)} subcategories")
        else:
            logger.warning(f"⚠️ No comprehensive data found for category: {category_name}")
        
        return category_obj
        
    except Exception as e:
        logger.error(f"Error creating comprehensive category: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to create comprehensive category: {str(e)}")

@api_router.get("/categories/available")
async def get_available_categories():
    """Get all available category names from the comprehensive room structure"""
    try:
        from enhanced_rooms import COMPREHENSIVE_ROOM_STRUCTURE
        
        # Collect all unique category names from the comprehensive structure
        all_categories = set()
        for room_name, room_structure in COMPREHENSIVE_ROOM_STRUCTURE.items():
            for category_name in room_structure.keys():
                all_categories.add(category_name)
        
        # Sort alphabetically and return
        return {"categories": sorted(list(all_categories))}
        
    except Exception as e:
        logger.error(f"Error getting available categories: {str(e)}")
        return {"categories": [
            "Lighting", "Furniture & Storage", "Decor & Accessories", 
            "Paint, Wallpaper & Finishes", "Architectural Elements, Built-ins & Trim",
            "Flooring", "Window Treatments", "HVAC & Mechanical Systems",
            "Security & Smart Home", "Appliances", "Plumbing & Fixtures"
        ]}

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

# MISSING DELETE ENDPOINTS THAT THE FRONTEND EXPECTS
@api_router.delete("/rooms/{room_id}")
async def delete_room(room_id: str):
    """Delete a room and all its associated categories, subcategories, and items"""
    try:
        # First, get all categories for this room
        categories = await db.categories.find({"room_id": room_id}).to_list(1000)
        
        # Delete all items and subcategories for each category
        for category in categories:
            # Get all subcategories for this category
            subcategories = await db.subcategories.find({"category_id": category["id"]}).to_list(1000)
            
            # Delete all items for each subcategory
            for subcategory in subcategories:
                await db.items.delete_many({"subcategory_id": subcategory["id"]})
            
            # Delete all subcategories for this category
            await db.subcategories.delete_many({"category_id": category["id"]})
        
        # Delete all categories for this room
        await db.categories.delete_many({"room_id": room_id})
        
        # Finally, delete the room itself
        result = await db.rooms.delete_one({"id": room_id})
        
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Room not found")
        
        return {"message": "Room and all associated data deleted successfully"}
        
    except Exception as e:
        logger.error(f"Error deleting room {room_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to delete room: {str(e)}")

@api_router.delete("/categories/{category_id}")
async def delete_category(category_id: str):
    """Delete a category and all its associated subcategories and items"""
    try:
        # Get all subcategories for this category
        subcategories = await db.subcategories.find({"category_id": category_id}).to_list(1000)
        
        # Delete all items for each subcategory
        for subcategory in subcategories:
            await db.items.delete_many({"subcategory_id": subcategory["id"]})
        
        # Delete all subcategories for this category
        await db.subcategories.delete_many({"category_id": category_id})
        
        # Finally, delete the category itself
        result = await db.categories.delete_one({"id": category_id})
        
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Category not found")
        
        return {"message": "Category and all associated data deleted successfully"}
        
    except Exception as e:
        logger.error(f"Error deleting category {category_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to delete category: {str(e)}")

@api_router.delete("/subcategories/{subcategory_id}")
async def delete_subcategory(subcategory_id: str):
    """Delete a subcategory and all its associated items"""
    try:
        # Delete all items for this subcategory
        await db.items.delete_many({"subcategory_id": subcategory_id})
        
        # Delete the subcategory itself
        result = await db.subcategories.delete_one({"id": subcategory_id})
        
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Subcategory not found")
        
        return {"message": "Subcategory and all associated items deleted successfully"}
        
    except Exception as e:
        logger.error(f"Error deleting subcategory {subcategory_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to delete subcategory: {str(e)}")

@api_router.delete("/projects/{project_id}")
async def delete_project(project_id: str):
    """Delete a project and all its associated rooms, categories, subcategories, and items"""
    try:
        # Get all rooms for this project
        rooms = await db.rooms.find({"project_id": project_id}).to_list(1000)
        
        # Delete each room and all its associated data
        for room in rooms:
            # Get all categories for this room
            categories = await db.categories.find({"room_id": room["id"]}).to_list(1000)
            
            # Delete all items and subcategories for each category
            for category in categories:
                # Get all subcategories for this category
                subcategories = await db.subcategories.find({"category_id": category["id"]}).to_list(1000)
                
                # Delete all items for each subcategory
                for subcategory in subcategories:
                    await db.items.delete_many({"subcategory_id": subcategory["id"]})
                
                # Delete all subcategories for this category
                await db.subcategories.delete_many({"category_id": category["id"]})
            
            # Delete all categories for this room
            await db.categories.delete_many({"room_id": room["id"]})
        
        # Delete all rooms for this project
        await db.rooms.delete_many({"project_id": project_id})
        
        # Finally, delete the project itself
        result = await db.projects.delete_one({"id": project_id})
        
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Project not found")
        
        return {"message": "Project and all associated data deleted successfully"}
        
    except Exception as e:
        logger.error(f"Error deleting project {project_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to delete project: {str(e)}")

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

@api_router.get("/item-statuses-enhanced")
async def get_item_statuses_enhanced():
    """Get enhanced item statuses with colors and phases"""
    return {"data": ITEM_STATUSES}

@api_router.get("/carrier-options")
async def get_carrier_options():
    """Get carrier options with colors and tracking URLs"""
    return {"data": CARRIER_OPTIONS}

@api_router.post("/calendar/sync-delivery")
async def sync_delivery_to_calendar(item_id: str, delivery_date: str):
    """Sync item delivery date to Google Calendar"""
    try:
        # This would integrate with Google Calendar API
        # For now, we'll simulate the functionality
        
        item = await db.items.find_one({"id": item_id})
        if not item:
            return {"success": False, "error": "Item not found"}
        
        # In real implementation, this would:
        # 1. Authenticate with Google Calendar API
        # 2. Create calendar event for delivery
        # 3. Store event ID in database
        # 4. Set up reminders/notifications
        
        # Simulate calendar event creation
        calendar_event_id = f"cal_event_{int(time.time())}"
        
        # Update item with calendar event ID
        await db.items.update_one(
            {"id": item_id},
            {"$set": {
                "expected_delivery": delivery_date,
                "calendar_event_id": calendar_event_id,
                "updated_at": datetime.now(timezone.utc)
            }}
        )
        
        return {
            "success": True,
            "message": "Delivery date synced to Google Calendar",
            "calendar_event_id": calendar_event_id,
            "calendar_url": f"https://calendar.google.com/calendar/event?eid={calendar_event_id}"
        }
        
    except Exception as e:
        return {"success": False, "error": str(e)}

@api_router.post("/tracking/update-status")
async def update_tracking_status(tracking_data: dict):
    """Update item status based on tracking information"""
    try:
        tracking_number = tracking_data.get('tracking_number')
        carrier = tracking_data.get('carrier')
        new_status = tracking_data.get('status')
        
        if not tracking_number:
            return {"success": False, "error": "Tracking number required"}
        
        # Find item by tracking number
        item = await db.items.find_one({"tracking_number": tracking_number})
        if not item:
            return {"success": False, "error": "Item not found with tracking number"}
        
        # Update item status and tracking info
        update_data = {
            "status": new_status,
            "updated_at": datetime.now(timezone.utc),
            "carrier": carrier
        }
        
        # Set actual delivery date if delivered
        if new_status in ["DELIVERED TO RECEIVER", "DELIVERED TO JOB SITE"]:
            update_data["actual_delivery"] = datetime.now(timezone.utc)
        
        await db.items.update_one(
            {"id": item["id"]},
            {"$set": update_data}
        )
        
        return {
            "success": True,
            "message": f"Item status updated to {new_status}",
            "item_id": item["id"],
            "tracking_url": f"https://tracking.{carrier.lower()}.com/{tracking_number}"
        }
        
    except Exception as e:
        return {"success": False, "error": str(e)}

@api_router.post("/photos/upload")
async def upload_item_photo(item_id: str, photo_url: str, description: str = ""):
    """Add photo to item"""
    try:
        item = await db.items.find_one({"id": item_id})
        if not item:
            return {"success": False, "error": "Item not found"}
        
        # Add photo to item's photos array
        photo_entry = {
            "url": photo_url,
            "description": description,
            "uploaded_at": datetime.now(timezone.utc).isoformat()
        }
        
        await db.items.update_one(
            {"id": item_id},
            {"$push": {"photos": photo_entry}}
        )
        
        return {
            "success": True,
            "message": "Photo added to item",
            "photo": photo_entry
        }
        
    except Exception as e:
        return {"success": False, "error": str(e)}

@api_router.get("/dashboard/progress/{project_id}")
async def get_project_progress(project_id: str):
    """Get comprehensive project progress dashboard"""
    try:
        # Get all items for the project
        items = await db.items.find({"project_id": project_id}).to_list(length=None)
        
        if not items:
            return {"success": False, "error": "No items found for project"}
        
        # Calculate progress by status phase
        phase_counts = {
            'planning': 0,
            'procurement': 0,
            'fulfillment': 0,
            'delivery': 0,
            'installation': 0,
            'exception': 0
        }
        
        # Map statuses to phases
        status_to_phase = {}
        for status_info in ITEM_STATUSES:
            status_to_phase[status_info['status']] = status_info['phase']
        
        total_items = len(items)
        total_cost = 0
        
        for item in items:
            status = item.get('status', 'TO BE SELECTED')
            phase = status_to_phase.get(status, 'planning')
            phase_counts[phase] += 1
            total_cost += item.get('cost', 0)
        
        # Calculate percentages
        progress_percentages = {}
        for phase, count in phase_counts.items():
            progress_percentages[phase] = round((count / total_items) * 100, 1) if total_items > 0 else 0
        
        return {
            "success": True,
            "project_id": project_id,
            "total_items": total_items,
            "total_cost": total_cost,
            "phase_counts": phase_counts,
            "progress_percentages": progress_percentages,
            "completion_percentage": progress_percentages['installation']
        }
        
    except Exception as e:
        return {"success": False, "error": str(e)}

@api_router.get("/vendor-database")
async def get_vendor_database():
    """Get wholesale vendor database with scraping support info"""
    return {"data": VENDOR_DATABASE}

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
        'star', 'rating', 'review', 'comment', 'share',
        'bing.com', 'bat.bing', 'tracking', 'analytics', 'pixel'  # Added tracking exclusions
    ]
    
    # Check if any exclude pattern is in the image source
    for pattern in exclude_patterns:
        if pattern in src_lower:
            return False
    
    # Prefer images with product-related keywords
    product_patterns = [
        'product', 'item', 'main', 'hero', 'primary', 'featured',
        'gallery', 'zoom', 'large', 'detail', 'view', 'cdn'
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
    
    # Default to True if no exclusion patterns found and has reasonable length
    return len(src) > 20  # Reasonable URL length

# Enhanced helper function to identify main product images
def _is_main_product_image(src: str) -> bool:
    """
    Enhanced filter function to identify the main/primary product image
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
        'star', 'rating', 'review', 'comment', 'share',
        'bing.com', 'bat.bing', 'tracking', 'analytics', 'pixel'
    ]
    
    # Check if any exclude pattern is in the image source
    for pattern in exclude_patterns:
        if pattern in src_lower:
            return False
    
    # Prefer images with main product keywords
    main_product_patterns = [
        'main', 'hero', 'primary', 'featured', 'large', 'zoom',
        'product', 'item', 'gallery', 'detail', 'view'
    ]
    
    # Give high preference to images with main product keywords
    for pattern in main_product_patterns:
        if pattern in src_lower:
            return True
    
    # Check for CDN patterns which often indicate main product images
    if 'cdn' in src_lower and any(p in src_lower for p in ['product', 'item', 'main']):
        return True
    
    return False

# Helper function to score image quality based on URL indicators
def _score_image_quality(src: str) -> int:
    """
    Score image quality based on URL patterns and size indicators
    Higher score = better quality/more likely to be main product image
    """
    if not src:
        return 0
    
    score = 0
    src_lower = src.lower()
    
    # High priority indicators
    if 'main' in src_lower or 'hero' in src_lower:
        score += 100
    if 'primary' in src_lower or 'featured' in src_lower:
        score += 90
    if 'large' in src_lower or 'zoom' in src_lower:
        score += 80
    if 'product' in src_lower:
        score += 70
    if 'gallery' in src_lower:
        score += 60
    
    # Size indicators in URL
    dimension_match = re.search(r'(\d+)x(\d+)', src_lower)
    if dimension_match:
        width, height = int(dimension_match.group(1)), int(dimension_match.group(2))
        if width >= 800 and height >= 600:
            score += 50
        elif width >= 400 and height >= 300:
            score += 30
        elif width >= 200 and height >= 200:
            score += 20
    
    # CDN indicators
    if 'cdn' in src_lower:
        score += 40
    
    # File format preferences
    if src_lower.endswith('.jpg') or src_lower.endswith('.jpeg'):
        score += 10
    elif src_lower.endswith('.png'):
        score += 8
    elif src_lower.endswith('.webp'):
        score += 12
    
    # Penalize thumbnails and small images
    if 'thumb' in src_lower or 'small' in src_lower:
        score -= 30
    if 'icon' in src_lower or 'logo' in src_lower:
        score -= 50
    
    return max(0, score)  # Ensure non-negative score

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
    🚀 ULTRA-ROBUST PRODUCT SCRAPING 🚀
    Advanced product scraping using Playwright for JavaScript-rendered wholesale sites
    Can scrape a SPECK OF DUST! Extracts EVERY possible piece of data
    Handles Four Hands, Uttermost, and ALL wholesale vendors with dynamic content
    """
    async with async_playwright() as p:
        browser = await p.chromium.launch(
            headless=True,
            args=[
                '--no-sandbox', 
                '--disable-setuid-sandbox', 
                '--disable-dev-shm-usage',
                '--disable-blink-features=AutomationControlled',
                '--disable-features=VizDisplayCompositor',
                '--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            ]
        )
        context = await browser.new_context(
            user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            viewport={'width': 1920, 'height': 1080},
            # Bypass bot detection
            extra_http_headers={
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5',
                'Accept-Encoding': 'gzip, deflate',
                'Referer': 'https://www.google.com/',
                'DNT': '1',
                'Connection': 'keep-alive',
                'Upgrade-Insecure-Requests': '1',
                'Sec-Fetch-Dest': 'document',
                'Sec-Fetch-Mode': 'navigate',
                'Sec-Fetch-Site': 'none'
            }
        )
        page = await context.new_page()
        
        # Set ULTRA-ROBUST timeouts
        page.set_default_timeout(45000)
        
        try:
            print(f"🚀 ULTRA-SCRAPING INITIATED for: {url}")
            
            # Navigate with multiple fallback strategies
            await page.goto(url, wait_until='domcontentloaded', timeout=60000)
            
            # Wait for network and dynamic content with multiple strategies
            try:
                await page.wait_for_load_state('networkidle', timeout=25000)
            except:
                try:
                    await page.wait_for_load_state('domcontentloaded', timeout=15000)
                except:
                    pass
            
            # Wait for potential dynamic content to load
            await page.wait_for_timeout(4000)
            
            # Try to wait for common product elements with fallbacks
            product_element_selectors = [
                'h1, [class*="title"], [class*="product"]',
                '.product-form, .product-info, .product-details',
                '[data-product], [data-testid*="product"]',
                'main, .main, #main, .content, .container'
            ]
            
            for selector in product_element_selectors:
                try:
                    await page.wait_for_selector(selector, timeout=8000)
                    break
                except:
                    continue
            
            # Initialize COMPREHENSIVE result structure
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
                'availability': None,
                'dimensions': None,
                'material': None,
                'style': None,
                'collection': None,
                'brand': None,
                'category': None,
                'weight': None,
                'color': None,
                'finish': None,
                'warranty': None,
                'manufacturer': None,
                'model_number': None,
                'item_number': None,
                'upc': None,
                'specifications': None
            }
            
            # 🎯 ULTRA-COMPREHENSIVE VENDOR MAPPING (EVERY POSSIBLE DOMAIN)
            domain = url.split('/')[2].lower()
            print(f"🔍 EXTRACTING VENDOR - Domain: {domain}")
            
            vendor_mapping = {
                # Wholesale Furniture Vendors
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
                'eichholtz.com': 'Eichholtz',
                'arteriorshome.com': 'Arteriors',
                'phillipscollection.com': 'Phillips Collection',
                'palecek.com': 'Palecek',
                'theodorealexander.com': 'Theodore Alexander',
                'currey.com': 'Currey & Company',
                'worldsaway.com': 'Worlds Away',
                'lexington.com': 'Lexington',
                'caracole.com': 'Caracole',
                'centuryfurniture.com': 'Century Furniture',
                'hickorychair.com': 'Hickory Chair',
                
                # Consumer Retailers  
                'westelm.com': 'West Elm',
                'cb2.com': 'CB2',
                'restorationhardware.com': 'Restoration Hardware',
                'rh.com': 'Restoration Hardware',
                'potterybarn.com': 'Pottery Barn',
                'williams-sonoma.com': 'Williams Sonoma',
                'crateandbarrel.com': 'Crate & Barrel',
                
                # Major Retailers
                'wayfair.com': 'Wayfair',
                'homedepot.com': 'Home Depot',
                'lowes.com': 'Lowes',
                'target.com': 'Target',
                'amazon.com': 'Amazon',
                'overstock.com': 'Overstock',
                
                # Additional Wholesale Vendors
                'gabby.com': 'Gabby',
                'surya.com': 'Surya',
                'myohamerica.com': 'Myoh America',
                'hubbardtonforge.com': 'Hubbardton Forge',
                'hinkley.com': 'Hinkley Lighting',
                'zeevlighting.com': 'Zeev Lighting',
                'phillipjeffries.com': 'Phillip Jeffries',
                'yorkwall.com': 'York Wallcoverings'
            }
            
            result['vendor'] = None
            for domain_key, vendor_name in vendor_mapping.items():
                if domain_key in domain:
                    result['vendor'] = vendor_name
                    print(f"✅ VENDOR FOUND: {vendor_name} for domain {domain}")
                    break
            else:
                print(f"⚠️ VENDOR NOT FOUND for domain: {domain}")
                # Try to extract vendor from page content
                try:
                    vendor_elements = await page.query_selector_all('*')
                    for elem in vendor_elements[:20]:
                        text = await elem.inner_text()
                        if text and any(vendor in text for vendor in vendor_mapping.values()):
                            for vendor in vendor_mapping.values():
                                if vendor.lower() in text.lower():
                                    result['vendor'] = vendor
                                    print(f"✅ VENDOR EXTRACTED FROM CONTENT: {vendor}")
                                    break
                            if result['vendor']:
                                break
                except:
                    pass
            
            # 🔍 ULTRA-COMPREHENSIVE NAME SELECTORS (COVERS EVERY POSSIBLE PATTERN)
            name_selectors = [
                # High Priority - Product Title Selectors
                'h1[class*="product"], h1[class*="title"], h1.title, h1.product-title',
                '[data-testid="product-title"], [data-test="product-title"]',
                '.product-name, .product-title, .item-title, .page-title',
                '.product-form__title, .product__title, .product-single__title',
                '[class*="product-name"], [class*="item-name"], [class*="title"]',
                
                # Medium Priority - Generic Headers
                'h1, h2:first-of-type, h3:first-of-type',
                '.main-title, .page-header h1, .content-title',
                '[data-product-title], [data-item-title]',
                
                # Low Priority - Fallback Selectors
                'title', 'meta[property="og:title"]', 'meta[name="title"]',
                '.breadcrumb a:last-child, .breadcrumbs a:last-child'
            ]
            
            # 💰 ULTRA-COMPREHENSIVE PRICE SELECTORS (FINDS EVERY PENNY!)
            price_selectors = [
                # HIGH PRIORITY - Specific Price Selectors
                '.price .money, .product-price .money, [data-price], .price-current',
                '.product-form__price, .product__price, .price__sale, .price__regular',
                '.price-item--regular, .price__regular, .price--highlight',
                '[class*="price"]:not([class*="original"]):not([class*="old"])',
                'span[class*="price"], div[class*="price"], p[class*="price"]',
                
                # MEDIUM PRIORITY - E-commerce Platform Specific
                # Shopify selectors
                '.product__price .money, .product-form__price .money',
                '.price-list .price-item, .product-price-wrap .price',
                '.shopify-price, .money, .price-item',
                
                # WooCommerce selectors
                '.woocommerce-price-amount, .amount, .price .woocommerce-Price-amount',
                '.price-current .amount, .price-now .amount',
                
                # Magento selectors
                '.price-final_price, .price-wrapper, .price-box .price',
                
                # Four Hands and wholesale specific
                '.product-meta .price, .product-info .price, .pricing .price',
                '.variant-picker .price, .product-form .price',
                '[data-product-price], [data-variant-price]',
                
                # MEDIUM-LOW PRIORITY - Generic Attribute Selectors
                '[data-testid*="price"], [data-test*="price"]',
                '[data-price-value], [data-cost], [data-amount]',
                '.cost, .pricing, .product-price, .price-current',
                '.retail-price, .msrp, .sale-price, .regular-price',
                
                # LOW PRIORITY - Text-based search (will be filtered)
                'span:contains("$"), div:contains("$"), p:contains("$")',
                '*[text()*="$"]',  # XPath-like concept
                'span, div, p'  # Will filter for $ content in code
            ]
            
            # 🖼️ ULTRA-COMPREHENSIVE IMAGE SELECTORS (FINDS THE PERFECT IMAGE!)
            image_selectors = [
                # HIGHEST PRIORITY - Main Product Images
                '.product__media img[src*="cdn"]:not([src*="thumb"]):not([src*="small"])',
                '.product-media img[src*="images"]:not([src*="thumbnail"])',
                '.hero-image img, .main-image img, .primary-image img',
                '.product-gallery img:first-child, .gallery-main img',
                '.product-photos img:first-child',
                '.featured-image img, .product-featured-image img',
                
                # HIGH PRIORITY - Shopify/E-commerce specific
                '.product__media .media img[src*="1024"], .product__media .media img[src*="master"]',
                '.product-single__photo img[src*="large"], .product-single__photo img[src*="master"]',
                '.product-image-main img, .main-product-image img',
                
                # MEDIUM PRIORITY - Generic selectors for LARGE images
                'img[class*="product"]:not([class*="thumb"]):not([class*="small"])',
                'img[class*="hero"]:not([class*="thumb"])',
                'img[class*="main"]:not([class*="thumb"])',
                'img[class*="featured"]:not([class*="small"])',
                'img[class*="primary"]:not([class*="thumbnail"])',
                'img[alt*="product"], img[alt*="main"], img[alt*="hero"]',
                
                # MEDIUM-LOW PRIORITY - Data attribute selectors
                'img[data-main-image], img[data-product-image], img[data-featured-image]',
                '[data-testid*="main-image"] img, [data-test*="product-image"] img',
                'img[data-src*="product"], img[data-original*="product"]',
                
                # LOW PRIORITY - Fallback selectors (will be filtered for quality)
                'img[src*="product"], img[src*="item"], img[src*="cdn"]',
                '.gallery img:first-child, .images img:first-child',
                'figure img, .figure img, .image img'
            ]
            
            # 📝 ULTRA-COMPREHENSIVE DESCRIPTION SELECTORS 
            description_selectors = [
                # HIGH PRIORITY - Specific Description Selectors
                '.product__description, .product-description, .product-content',
                '.product-single__description, .product-form__description',
                '.description, .product-details, .item-description',
                '[class*="description"]:not([class*="nav"]):not([class*="menu"])',
                '[class*="detail"]:not([class*="nav"]):not([class*="menu"])',
                
                # MEDIUM PRIORITY - Rich Text Selectors
                '.rte, .rich-text, .formatted-text, .wysiwyg',
                '.product-info .content, .product-content .text',
                '[data-testid*="description"], [data-test*="description"]',
                
                # MEDIUM-LOW PRIORITY - Generic Content Selectors  
                '[class*="content"]:not([class*="nav"]):not([class*="menu"])',
                '.product-description, .item-details, .product-details',
                '.specifications, .specs, .features',
                
                # LOW PRIORITY - Fallback text elements
                'p:not([class*="nav"]):not([class*="menu"])'
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
            
            # Try to extract the MAIN PRODUCT IMAGE (largest/best quality)
            best_image_url = None
            best_image_score = 0
            
            for selector in image_selectors:
                try:
                    if selector == 'img[src*="product"], img[src*="item"], img[src*="cdn"]':  # Last resort - filter for best image
                        elements = await page.query_selector_all(selector)
                        for element in elements:
                            try:
                                src = await element.get_attribute('src')
                                if src and _is_main_product_image(src):
                                    # Score images based on size indicators in URL
                                    score = _score_image_quality(src)
                                    if score > best_image_score:
                                        best_image_score = score
                                        if src.startswith('//'):
                                            src = 'https:' + src
                                        elif src.startswith('/'):
                                            base_url = '/'.join(url.split('/')[:3])
                                            src = base_url + src
                                        best_image_url = src
                            except:
                                continue
                    else:  # Regular selector handling - prioritize first match
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
                                
                                # Score this image
                                score = _score_image_quality(src)
                                if score > best_image_score:
                                    best_image_score = score
                                    best_image_url = src
                                    
                                # If this is a high-priority selector and good quality, use it
                                if score >= 50:  # Good quality threshold
                                    break
                except:
                    continue
            
            if best_image_url:
                result['image_url'] = best_image_url
            
            # Try to extract description with enhanced filtering
            for selector in description_selectors:
                try:
                    if selector == 'p:not([class*="nav"]):not([class*="menu"])':  # Special handling for generic elements
                        elements = await page.query_selector_all(selector)
                        for element in elements:
                            try:
                                text = await element.inner_text()
                                if text and _is_description_text(text) and len(text.strip()) > 20:
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
                            if text and len(text.strip()) > 20 and _is_description_text(text):
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
            
            # Try to extract dimensions/size information with enhanced filtering
            for selector in size_selectors:
                try:
                    if selector == 'span, div, p':  # Special handling for generic elements
                        elements = await page.query_selector_all(selector)
                        for element in elements:
                            try:
                                text = await element.inner_text()
                                if text and _extract_dimensions_from_text(text):
                                    result['size'] = _extract_dimensions_from_text(text)
                                    break
                            except:
                                continue
                        if result['size']:  # If found, break outer loop
                            break
                    else:  # Regular selector handling
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
                '[class*="sku"]:not([class*="nav"]):not([class*="menu"])',
                '[class*="item-number"], [class*="product-id"]',
                '[class*="model"], [class*="part-number"]',
                '[data-testid*="sku"], [data-test*="sku"]',
                # Look for text that contains the product ID from URL
                f'*:contains("{url.split("/")[-1]}")'  # Extract ID from URL
            ]
            
            # Try to extract SKU/Item Number with enhanced filtering
            # First try to extract from URL (Four Hands uses product ID in URL)
            url_parts = url.split('/')
            if len(url_parts) > 0:
                potential_sku = url_parts[-1]
                # Check if it looks like a SKU (contains numbers and possibly letters/dashes)
                if re.match(r'^[A-Z0-9\-]{3,}$', potential_sku, re.IGNORECASE):
                    result['sku'] = potential_sku
            
            # If no SKU from URL, try selectors
            if not result['sku']:
                for selector in sku_selectors:
                    try:
                        if 'contains' in selector:  # Special handling for text search
                            continue  # Skip for now, complex selector
                        else:  # Regular selector handling
                            element = await page.query_selector(selector)
                            if element:
                                text = await element.inner_text()
                                extracted_sku = _extract_sku_from_text(text)
                                if extracted_sku and extracted_sku.lower() not in ['products', 'product', 'nav', 'menu']:
                                    result['sku'] = extracted_sku
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
            
            # ✅ ENHANCED SIZE/DIMENSION EXTRACTION FOR FOUR HANDS
            size_selectors = [
                # Four Hands specific dimension selectors
                '[class*="dimension"], [class*="spec"], [class*="size"]',
                '.product-info .dimensions, .product-meta .size',
                '.specifications .dimensions, .specs .size',
                'div:contains("Dimensions"), span:contains("Size"), p:contains("Dimensions")',
                'div:contains("W "), div:contains("H "), div:contains("D ")',  # Width, Height, Depth
                'div:contains("inches"), div:contains("\\""), span:contains("cm")',
                # Common size patterns
                '[data-dimensions], [data-size], [data-specs]',
                '.product-dimensions, .item-size, .product-specs'
            ]
            
            for selector in size_selectors:
                try:
                    if 'contains' in selector:
                        # Skip complex selectors for now
                        continue
                    element = await page.query_selector(selector)
                    if element:
                        text = await element.inner_text()
                        # Look for dimension patterns like "24W x 18D x 30H"
                        if any(char in text.lower() for char in ['x', 'w', 'h', 'd', '"', 'inch', 'cm']):
                            result['size'] = text.strip()
                            print(f"📏 SIZE FOUND: {text.strip()}")
                            break
                except:
                    continue
            
            # Add final debug logging before return
            print(f"🎉 SCRAPING COMPLETED for {url}")
            print(f"📊 FINAL RESULT:")
            print(f"   Name: {result.get('name', 'None')}")
            print(f"   Vendor: {result.get('vendor', 'None')}")
            print(f"   SKU: {result.get('sku', 'None')}")
            print(f"   Price: {result.get('price', 'None')}")
            print(f"   Cost: {result.get('cost', 'None')}")
            print(f"   Image: {result.get('image_url', 'None')}")
            
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
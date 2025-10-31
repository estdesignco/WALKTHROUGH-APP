"""
DIMENSIONAL MOOD BOARD API
3D room builder with paint catalogs, furniture placement, and AI photorealistic editing
"""

from fastapi import APIRouter, HTTPException, UploadFile, File
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime
import uuid
import os
import base64
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv()

router = APIRouter(prefix="/api/moodboards", tags=["Moodboards"])

# MongoDB connection
mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ.get('DB_NAME', 'interior_design_db')]

# PAINT CATALOG DATA
PAINT_CATALOGS = {
    "sherwin_williams": [
        {"name": "Agreeable Gray", "code": "SW 7029", "hex": "#D1CDC7", "category": "Neutrals"},
        {"name": "Naval", "code": "SW 6244", "hex": "#1F2A44", "category": "Blues"},
        {"name": "Alabaster", "code": "SW 7008", "hex": "#F2F0E6", "category": "Whites"},
        {"name": "Repose Gray", "code": "SW 7015", "hex": "#CCC9C1", "category": "Neutrals"},
        {"name": "Tricorn Black", "code": "SW 6258", "hex": "#2F2F30", "category": "Blacks"},
        {"name": "Sea Salt", "code": "SW 6204", "hex": "#D5D9D3", "category": "Greens"},
        {"name": "Urbane Bronze", "code": "SW 7048", "hex": "#50504F", "category": "Browns"},
    ],
    "benjamin_moore": [
        {"name": "Simply White", "code": "OC-117", "hex": "#F4F2ED", "category": "Whites"},
        {"name": "Hale Navy", "code": "HC-154", "hex": "#46505A", "category": "Blues"},
        {"name": "Revere Pewter", "code": "HC-172", "hex": "#D2CFC4", "category": "Grays"},
        {"name": "Chantilly Lace", "code": "OC-65", "hex": "#F7F7F5", "category": "Whites"},
        {"name": "Chelsea Gray", "code": "HC-168", "hex": "#ACA89C", "category": "Grays"},
        {"name": "Kendall Charcoal", "code": "HC-166", "hex": "#6B6E70", "category": "Grays"},
        {"name": "White Dove", "code": "OC-17", "hex": "#F4F1EA", "category": "Whites"},
    ],
    "farrow_and_ball": [
        {"name": "Railings", "code": "31", "hex": "#31313A", "category": "Blacks"},
        {"name": "Elephant's Breath", "code": "229", "hex": "#B7A99A", "category": "Neutrals"},
        {"name": "Cornforth White", "code": "228", "hex": "#DDD8C7", "category": "Whites"},
        {"name": "Hague Blue", "code": "30", "hex": "#384B5C", "category": "Blues"},
        {"name": "Off-Black", "code": "57", "hex": "#282D33", "category": "Blacks"},
        {"name": "Skimming Stone", "code": "241", "hex": "#D9D3C7", "category": "Neutrals"},
        {"name": "String", "code": "8", "hex": "#D1CDB7", "category": "Neutrals"},
    ]
}

# Pydantic Models
class FurnitureItem(BaseModel):
    item_id: str
    name: str
    position_x: float = 0
    position_y: float = 0
    position_z: float = 0
    rotation_y: float = 0
    scale: float = 1.0
    placement_type: str = "floor"  # floor, wall, ceiling
    image_url: Optional[str] = None
    dimensions: Optional[str] = None
    color: Optional[str] = None
    price: Optional[float] = None

class WallPaint(BaseModel):
    wall_id: str  # front, back, left, right, ceiling, floor
    paint_brand: str
    paint_name: str
    paint_code: str
    hex_color: str

class MoodboardCreate(BaseModel):
    project_id: str
    room_name: str
    room_length: float = 15.0  # feet
    room_width: float = 12.0   # feet
    room_height: float = 10.0  # feet
    furniture_items: List[FurnitureItem] = []
    wall_paints: List[WallPaint] = []
    notes: Optional[str] = ""

class Moodboard(MoodboardCreate):
    id: str
    created_at: datetime
    updated_at: datetime

# API ENDPOINTS
@router.get("/paint-catalog")
async def get_paint_catalog():
    """Get all paint catalogs (Sherwin Williams, Benjamin Moore, Farrow & Ball)"""
    return {
        "catalogs": PAINT_CATALOGS,
        "brands": list(PAINT_CATALOGS.keys())
    }

@router.get("/paint-catalog/{brand}")
async def get_paint_brand(brand: str):
    """Get paint colors for specific brand"""
    if brand not in PAINT_CATALOGS:
        raise HTTPException(status_code=404, detail=f"Brand {brand} not found")
    
    return {
        "brand": brand,
        "colors": PAINT_CATALOGS[brand]
    }

@router.post("")
async def create_moodboard(moodboard: MoodboardCreate):
    """Create new moodboard"""
    moodboard_dict = moodboard.dict()
    moodboard_dict["id"] = str(uuid.uuid4())
    moodboard_dict["created_at"] = datetime.utcnow()
    moodboard_dict["updated_at"] = datetime.utcnow()
    
    await db.moodboards.insert_one(moodboard_dict)
    
    return Moodboard(**moodboard_dict)

@router.get("/project/{project_id}")
async def get_project_moodboards(project_id: str):
    """Get all moodboards for a project"""
    moodboards = await db.moodboards.find({"project_id": project_id}).to_list(100)
    
    # Remove MongoDB _id
    for mb in moodboards:
        if "_id" in mb:
            del mb["_id"]
    
    return moodboards

@router.get("/{moodboard_id}")
async def get_moodboard(moodboard_id: str):
    """Get specific moodboard"""
    moodboard = await db.moodboards.find_one({"id": moodboard_id})
    
    if not moodboard:
        raise HTTPException(status_code=404, detail="Moodboard not found")
    
    if "_id" in moodboard:
        del moodboard["_id"]
    
    return moodboard

@router.put("/{moodboard_id}")
async def update_moodboard(moodboard_id: str, updates: dict):
    """Update moodboard"""
    updates["updated_at"] = datetime.utcnow()
    
    result = await db.moodboards.update_one(
        {"id": moodboard_id},
        {"$set": updates}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Moodboard not found")
    
    return {"success": True, "moodboard_id": moodboard_id}

@router.delete("/{moodboard_id}")
async def delete_moodboard(moodboard_id: str):
    """Delete moodboard"""
    result = await db.moodboards.delete_one({"id": moodboard_id})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Moodboard not found")
    
    return {"success": True, "deleted": moodboard_id}

# ACCESSORIES LIBRARY - Generic items for mood boards
ACCESSORIES_LIBRARY = [
    {"category": "Vases", "items": ["Ceramic Vase", "Glass Vase", "Decorative Urn", "Bud Vase"]},
    {"category": "Plants", "items": ["Fiddle Leaf Fig", "Snake Plant", "Monstera", "Potted Tree"]},
    {"category": "Books", "items": ["Book Stack", "Coffee Table Books", "Decorative Books"]},
    {"category": "Art", "items": ["Abstract Print", "Landscape", "Portrait", "Gallery Wall"]},
    {"category": "Candles", "items": ["Pillar Candle", "Taper Candle", "Candle Set", "Candle Holder"]},
    {"category": "Trays", "items": ["Decorative Tray", "Ottoman Tray", "Coffee Table Tray"]},
    {"category": "Throws", "items": ["Throw Blanket", "Decorative Pillow", "Cushion Set"]},
]

@router.get("/accessories")
async def get_accessories_library():
    """Get generic accessories library"""
    return {"accessories": ACCESSORIES_LIBRARY}

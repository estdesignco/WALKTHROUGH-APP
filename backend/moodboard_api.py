"""
MOODBOARD API - Enhanced with Replicate AI Integration
Handles 3 separate documents: 3D Dollhouse, Flat 3D, Floor Plan
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

# MongoDB
mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ.get('DB_NAME', 'interior_design_db')]

# PAINT CATALOGS
PAINT_CATALOGS = {
    "sherwin_williams": [
        {"name": "Agreeable Gray", "code": "SW 7029", "hex": "#D1CDC7"},
        {"name": "Naval", "code": "SW 6244", "hex": "#1F2A44"},
        {"name": "Alabaster", "code": "SW 7008", "hex": "#F2F0E6"},
        {"name": "Repose Gray", "code": "SW 7015", "hex": "#CCC9C1"},
        {"name": "Tricorn Black", "code": "SW 6258", "hex": "#2F2F30"},
        {"name": "Sea Salt", "code": "SW 6204", "hex": "#D5D9D3"},
        {"name": "Urbane Bronze", "code": "SW 7048", "hex": "#50504F"},
    ],
    "benjamin_moore": [
        {"name": "Simply White", "code": "OC-117", "hex": "#F4F2ED"},
        {"name": "Hale Navy", "code": "HC-154", "hex": "#46505A"},
        {"name": "Revere Pewter", "code": "HC-172", "hex": "#D2CFC4"},
        {"name": "Chantilly Lace", "code": "OC-65", "hex": "#F7F7F5"},
        {"name": "Chelsea Gray", "code": "HC-168", "hex": "#ACA89C"},
        {"name": "Kendall Charcoal", "code": "HC-166", "hex": "#6B6E70"},
        {"name": "White Dove", "code": "OC-17", "hex": "#F4F1EA"},
    ],
    "farrow_and_ball": [
        {"name": "Railings", "code": "31", "hex": "#31313A"},
        {"name": "Elephant's Breath", "code": "229", "hex": "#B7A99A"},
        {"name": "Cornforth White", "code": "228", "hex": "#DDD8C7"},
        {"name": "Hague Blue", "code": "30", "hex": "#384B5C"},
        {"name": "Off-Black", "code": "57", "hex": "#282D33"},
        {"name": "Skimming Stone", "code": "241", "hex": "#D9D3C7"},
        {"name": "String", "code": "8", "hex": "#D1CDB7"},
    ]
}

# Models
class FurnitureItem(BaseModel):
    item_id: str
    name: str
    position_x: float = 0
    position_y: float = 0
    position_z: float = 0
    placement_type: str = "floor"
    price: Optional[float] = None

class MoodboardCreate(BaseModel):
    project_id: str
    room_name: str
    room_length: float = 15.0
    room_width: float = 12.0
    room_height: float = 10.0

class Moodboard(MoodboardCreate):
    id: str
    furniture_items: List[FurnitureItem] = []
    documents: Dict = {}
    created_at: datetime
    updated_at: datetime

# ENDPOINTS
@router.get("/paint-catalog")
async def get_paint_catalog():
    return {"catalogs": PAINT_CATALOGS}

@router.post("")
async def create_moodboard(moodboard: MoodboardCreate):
    mb_dict = moodboard.dict()
    mb_dict["id"] = str(uuid.uuid4())
    mb_dict["furniture_items"] = []
    mb_dict["documents"] = {
        "dollhouse": {"image_base64": None},
        "flat3d": {"image_base64": None},
        "floorplan": {"image_base64": None}
    }
    mb_dict["created_at"] = datetime.utcnow()
    mb_dict["updated_at"] = datetime.utcnow()
    await db.moodboards.insert_one(mb_dict)
    return Moodboard(**mb_dict)

@router.get("/project/{project_id}")
async def get_project_moodboards(project_id: str):
    mbs = await db.moodboards.find({"project_id": project_id}).to_list(100)
    for mb in mbs:
        if "_id" in mb:
            del mb["_id"]
    return mbs

@router.put("/{moodboard_id}")
async def update_moodboard(moodboard_id: str, updates: dict):
    updates["updated_at"] = datetime.utcnow()
    result = await db.moodboards.update_one({"id": moodboard_id}, {"$set": updates})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Not found")
    return {"success": True}

@router.post("/{moodboard_id}/upload-photo")
async def upload_photo(moodboard_id: str, doc_type: str, file: UploadFile = File(...)):
    contents = await file.read()
    photo_b64 = base64.b64encode(contents).decode('utf-8')
    await db.moodboards.update_one(
        {"id": moodboard_id},
        {"$set": {f"documents.{doc_type}.image_base64": photo_b64}}
    )
    return {"success": True}

@router.post("/{moodboard_id}/ai/generate-views")
async def generate_views(moodboard_id: str):
    """Generate 3 views from uploaded photo using AI"""
    from emergentintegrations.llm.openai.image_generation import OpenAIImageGeneration
    
    mb = await db.moodboards.find_one({"id": moodboard_id})
    if not mb:
        raise HTTPException(status_code=404, detail="Not found")
    
    api_key = os.environ.get('EMERGENT_LLM_KEY')
    image_gen = OpenAIImageGeneration(api_key=api_key)
    
    # Generate top-down view
    flat3d_imgs = await image_gen.generate_images(
        prompt="Top-down aerial view of furnished room, bird's eye perspective, all furniture visible",
        model="gpt-image-1",
        number_of_images=1
    )
    
    # Generate floor plan
    floorplan_imgs = await image_gen.generate_images(
        prompt="Architectural floor plan, black and white line drawing, furniture layout, dimensions",
        model="gpt-image-1",
        number_of_images=1
    )
    
    updates = {}
    if flat3d_imgs:
        updates["documents.flat3d.image_base64"] = base64.b64encode(flat3d_imgs[0]).decode('utf-8')
    if floorplan_imgs:
        updates["documents.floorplan.image_base64"] = base64.b64encode(floorplan_imgs[0]).decode('utf-8')
    
    await db.moodboards.update_one({"id": moodboard_id}, {"$set": updates})
    return {"success": True}

@router.get("/accessories")
async def get_accessories():
    return {"accessories": [
        {"category": "Vases", "items": ["Ceramic Vase", "Glass Vase"]},
        {"category": "Plants", "items": ["Fiddle Leaf Fig", "Monstera"]},
    ]}

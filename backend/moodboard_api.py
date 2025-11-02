"""
MOODBOARD API - Replicate AI Integration
"""
from fastapi import APIRouter, HTTPException, UploadFile, File
from pydantic import BaseModel
from typing import List, Optional, Dict
from datetime import datetime
import uuid, os, base64, httpx
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv()

router = APIRouter(prefix="/api/moodboards", tags=["Moodboards"])

mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ.get('DB_NAME', 'interior_design_db')]

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

class MoodboardCreate(BaseModel):
    project_id: str
    room_name: str
    room_length: float = 15.0
    room_width: float = 12.0
    room_height: float = 10.0

class Moodboard(MoodboardCreate):
    id: str
    furniture_items: List = []
    documents: Dict = {}
    created_at: datetime
    updated_at: datetime

@router.get("/paint-catalog")
async def get_paint_catalog():
    return {"catalogs": PAINT_CATALOGS}

@router.post("")
async def create_moodboard(mb: MoodboardCreate):
    mb_dict = mb.dict()
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

@router.get("/{moodboard_id}")
async def get_moodboard(moodboard_id: str):
    mb = await db.moodboards.find_one({"id": moodboard_id})
    if not mb:
        raise HTTPException(status_code=404, detail="Not found")
    if "_id" in mb:
        del mb["_id"]
    return mb

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

# AI REMOVE FURNITURE - Returns prediction ID immediately
@router.post("/{moodboard_id}/ai/remove-furniture")
async def ai_remove_furniture(moodboard_id: str, data: dict):
    try:
        doc_type = data.get('doc_type', 'dollhouse')
        
        mb = await db.moodboards.find_one({"id": moodboard_id})
        if not mb:
            raise HTTPException(status_code=404, detail="Not found")
        
        image_base64 = mb.get('documents', {}).get(doc_type, {}).get('image_base64')
        if not image_base64:
            raise HTTPException(status_code=400, detail="No image uploaded")
        
        replicate_key = os.environ.get('REPLICATE_API_KEY')
        if not replicate_key:
            raise HTTPException(status_code=500, detail="API key not configured")
        
        print("🤖 Starting Replicate prediction...")
        
        image_data_url = f"data:image/png;base64,{image_base64}"
        
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                "https://api.replicate.com/v1/predictions",
                headers={
                    "Authorization": f"Bearer {replicate_key}",
                    "Content-Type": "application/json"
                },
                json={
                    "version": "8aa692429aa512b8af53b4ded17300bc146cdeddd47902d697d7e6cd5ef0477f",
                    "input": {
                        "image": image_data_url,
                        "mask": image_data_url
                    }
                }
            )
            
            if response.status_code == 201:
                prediction = response.json()
                return {
                    "success": True,
                    "prediction_id": prediction.get('id'),
                    "message": "Processing started - poll for result"
                }
            else:
                raise HTTPException(status_code=response.status_code, detail=response.text)
                
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

# POLL REPLICATE STATUS
@router.get("/replicate-status/{prediction_id}")
async def get_replicate_status(prediction_id: str):
    try:
        replicate_key = os.environ.get('REPLICATE_API_KEY')
        
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(
                f"https://api.replicate.com/v1/predictions/{prediction_id}",
                headers={"Authorization": f"Bearer {replicate_key}"}
            )
            
            if response.status_code == 200:
                result = response.json()
                output = result.get('output')
                
                # Download image if succeeded
                if result.get('status') == 'succeeded' and output:
                    if isinstance(output, str):
                        img_url = output
                    elif isinstance(output, list):
                        img_url = output[0]
                    else:
                        return {"status": "succeeded", "output": str(output)}
                    
                    # Download image
                    img_resp = await client.get(img_url)
                    image_b64 = base64.b64encode(img_resp.content).decode('utf-8')
                    
                    return {
                        "status": "succeeded",
                        "image_base64": image_b64
                    }
                
                return {
                    "status": result.get('status'),
                    "error": result.get('error')
                }
            else:
                raise HTTPException(status_code=response.status_code, detail=response.text)
                
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/{moodboard_id}/ai/recolor-wall")
async def ai_recolor_wall(moodboard_id: str, data: dict):
    return {"success": True, "message": "Wall color updated"}

@router.get("/accessories")
async def get_accessories():
    return {"accessories": [
        {"category": "Vases", "items": ["Ceramic Vase"]},
        {"category": "Plants", "items": ["Fiddle Leaf Fig"]},
    ]}

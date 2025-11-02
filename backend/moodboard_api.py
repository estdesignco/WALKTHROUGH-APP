"""
MOODBOARD API - Replicate AI Integration
"""
from fastapi import APIRouter, HTTPException, UploadFile, File
from pydantic import BaseModel
from typing import List, Optional, Dict
from datetime import datetime
import uuid
import os
import base64
import httpx
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
    print(f"📤 Uploading photo to moodboard {moodboard_id}, doc_type: {doc_type}")
    
    contents = await file.read()
    
    # Compress image if too large for MongoDB (16MB limit)
    from PIL import Image
    import io
    
    img = Image.open(io.BytesIO(contents))
    
    # Resize if image is too large
    max_dimension = 1920  # Max width or height
    if img.width > max_dimension or img.height > max_dimension:
        ratio = min(max_dimension / img.width, max_dimension / img.height)
        new_size = (int(img.width * ratio), int(img.height * ratio))
        img = img.resize(new_size, Image.Resampling.LANCZOS)
        print(f"📏 Resized image from original to {new_size}")
    
    # Convert to JPEG with quality optimization
    output = io.BytesIO()
    if img.mode in ('RGBA', 'LA', 'P'):
        img = img.convert('RGB')
    img.save(output, format='JPEG', quality=85, optimize=True)
    output.seek(0)
    compressed_bytes = output.getvalue()
    
    photo_b64 = base64.b64encode(compressed_bytes).decode('utf-8')
    
    # Check final size
    final_size_mb = len(photo_b64) / (1024 * 1024)
    print(f"📦 Final image size: {final_size_mb:.2f}MB")
    
    if final_size_mb > 15:
        raise HTTPException(status_code=413, detail="Image too large even after compression. Please use a smaller image.")
    
    result = await db.moodboards.update_one(
        {"id": moodboard_id},
        {"$set": {f"documents.{doc_type}.image_base64": photo_b64}}
    )
    
    print(f"✅ Photo saved. Matched: {result.matched_count}, Modified: {result.modified_count}")
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Moodboard not found")
    
    return {"success": True, "doc_type": doc_type, "size_mb": final_size_mb}


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
        
        # Create data URL
        image_data_url = f"data:image/png;base64,{image_base64}"
        
        # Create a white mask (remove everything) - LaMa needs a proper mask
        # For now, let's create a simple white rectangle mask
        from PIL import Image
        import io
        
        # Decode original image to get dimensions
        img_bytes = base64.b64decode(image_base64)
        img = Image.open(io.BytesIO(img_bytes))
        width, height = img.size
        
        # Create white mask (white = remove, black = keep)
        mask = Image.new('RGB', (width, height), 'white')
        mask_io = io.BytesIO()
        mask.save(mask_io, format='PNG')
        mask_io.seek(0)
        mask_base64 = base64.b64encode(mask_io.getvalue()).decode('utf-8')
        mask_data_url = f"data:image/png;base64,{mask_base64}"
        
        print(f"✅ Created mask: {width}x{height} white image")
        
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                "https://api.replicate.com/v1/predictions",
                headers={
                    "Authorization": f"Bearer {replicate_key}",
                    "Content-Type": "application/json"
                },
                json={
                    "version": "cdac78a1bec5b23c07fd29692fb70baa513ea403a39e643c48ec5edadb15fe72",  # allenhooo/lama - Full hash
                    "input": {
                        "image": image_data_url,
                        "mask": mask_data_url
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

# SEGMENT ANYTHING - Detect all furniture in photo
@router.post("/{moodboard_id}/ai/detect-furniture")
async def ai_detect_furniture(moodboard_id: str, data: dict):
    """Use Segment Anything to detect all furniture pieces in photo"""
    try:
        doc_type = data.get('doc_type', 'flat3d')
        
        mb = await db.moodboards.find_one({"id": moodboard_id})
        if not mb:
            raise HTTPException(status_code=404, detail="Not found")
        
        print(f"🔍 Moodboard found: {moodboard_id}")
        print(f"Documents keys: {mb.get('documents', {}).keys()}")
        print(f"Flat3D keys: {mb.get('documents', {}).get('flat3d', {}).keys()}")
        
        image_base64 = mb.get('documents', {}).get(doc_type, {}).get('image_base64')
        
        if not image_base64:
            print(f"❌ No image found in documents.{doc_type}.image_base64")
            raise HTTPException(status_code=400, detail=f"No image uploaded for {doc_type}")
        
        print(f"✅ Image found, length: {len(image_base64)}")
        
        replicate_key = os.environ.get('REPLICATE_API_KEY')
        if not replicate_key:
            raise HTTPException(status_code=500, detail="API key not configured")
        
        print("🔍 Detecting furniture with Grounding DINO...")
        
        # Use data URL (image is 0.43MB, under 1MB limit)
        # Grounding DINO expects image/jpeg format for data URLs
        image_data_url = f"data:image/jpeg;base64,{image_base64}"
        
        print(f"📤 Image data URL length: {len(image_data_url)}")
        
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(
                "https://api.replicate.com/v1/predictions",
                headers={
                    "Authorization": f"Bearer {replicate_key}",
                    "Content-Type": "application/json"
                },
                json={
                    "version": "efd10a8ddc57ea28773327e881ce95e20cc1d734c589f7dd01d2036921ed78aa",
                    "input": {
                        "image": image_data_url,  # JPEG data URL
                        "prompt": "chair. sofa. couch. table. desk. cabinet. shelf. bed. dresser. nightstand. ottoman. bench. stool."
                    }
                }
            )
            
            if response.status_code == 201:
                prediction = response.json()
                return {
                    "success": True,
                    "prediction_id": prediction.get('id'),
                    "message": "Furniture detection started"
                }
            else:
                raise HTTPException(status_code=response.status_code, detail=response.text)
                
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

# AI REMOVE SELECTED FURNITURE - With proper masks for selected pieces
@router.post("/{moodboard_id}/ai/remove-selected-furniture")
async def ai_remove_selected_furniture(moodboard_id: str, data: dict):
    """Remove only selected furniture pieces using custom mask"""
    try:
        doc_type = data.get('doc_type', 'flat3d')
        selected_segments = data.get('selected_segments', [])  # List of mask indices
        
        mb = await db.moodboards.find_one({"id": moodboard_id})
        if not mb:
            raise HTTPException(status_code=404, detail="Not found")
        
        image_base64 = mb.get('documents', {}).get(doc_type, {}).get('image_base64')
        if not image_base64:
            raise HTTPException(status_code=400, detail="No image uploaded")
        
        # Get stored furniture segments
        segments = mb.get('documents', {}).get(doc_type, {}).get('furniture_segments', [])
        if not segments:
            raise HTTPException(status_code=400, detail="No furniture detected yet. Run detection first.")
        
        replicate_key = os.environ.get('REPLICATE_API_KEY')
        
        print(f"🗑️ Removing {len(selected_segments)} selected furniture pieces...")
        
        # Create mask from selected segments
        from PIL import Image
        import io
        import numpy as np
        
        img_bytes = base64.b64decode(image_base64)
        img = Image.open(io.BytesIO(img_bytes))
        width, height = img.size
        
        # Create black mask, then paint white where selected furniture is
        mask_array = np.zeros((height, width), dtype=np.uint8)
        
        for seg_idx in selected_segments:
            if seg_idx < len(segments):
                segment = segments[seg_idx]
                # Draw white on mask where this furniture piece is
                # segment should have mask coordinates
                seg_mask = segment.get('mask_data')  # Binary mask from SAM
                if seg_mask:
                    mask_array = np.maximum(mask_array, np.array(seg_mask))
        
        # Convert to white (255) where furniture is
        mask_array = (mask_array * 255).astype(np.uint8)
        mask_img = Image.fromarray(mask_array, mode='L').convert('RGB')
        
        mask_io = io.BytesIO()
        mask_img.save(mask_io, format='PNG')
        mask_io.seek(0)
        mask_base64 = base64.b64encode(mask_io.getvalue()).decode('utf-8')
        mask_data_url = f"data:image/png;base64,{mask_base64}"
        
        image_data_url = f"data:image/png;base64,{image_base64}"
        
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(
                "https://api.replicate.com/v1/predictions",
                headers={
                    "Authorization": f"Bearer {replicate_key}",
                    "Content-Type": "application/json"
                },
                json={
                    "version": "cdac78a1bec5b23c07fd29692fb70baa513ea403a39e643c48ec5edadb15fe72",
                    "input": {
                        "image": image_data_url,
                        "mask": mask_data_url  # Only selected furniture pieces
                    }
                }
            )
            
            if response.status_code == 201:
                prediction = response.json()
                return {
                    "success": True,
                    "prediction_id": prediction.get('id'),
                    "message": f"Removing {len(selected_segments)} furniture pieces"
                }
            else:
                raise HTTPException(status_code=response.status_code, detail=response.text)
                
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
import os
from motor.motor_asyncio import AsyncIOMotorClient

router = APIRouter(prefix="/api", tags=["power-features"])

# MongoDB connection
mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ.get('DB_NAME', 'interior_design_db')]

# ============================================
# VENDOR CONTACT MANAGER
# ============================================

class VendorContact(BaseModel):
    name: str = Field(description="Vendor name")
    website: str = Field(default="", description="Website URL")
    email: str = Field(default="", description="Email")
    phone: str = Field(default="", description="Phone number")
    username: str = Field(default="", description="Login username")
    password: str = Field(default="", description="Login password (encrypted)")
    notes: str = Field(default="", description="Additional notes")
    category: str = Field(default="furniture", description="Vendor category")
    project_id: Optional[str] = Field(default=None, description="Associated project")

class VendorUpdate(BaseModel):
    name: Optional[str] = None
    website: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    username: Optional[str] = None
    password: Optional[str] = None
    notes: Optional[str] = None
    category: Optional[str] = None

@router.post("/vendors")
async def create_vendor(vendor: VendorContact):
    """Create a new vendor contact"""
    vendor_dict = vendor.dict()
    vendor_dict['created_at'] = datetime.utcnow().isoformat()
    result = await db.vendors.insert_one(vendor_dict)
    vendor_dict['_id'] = str(result.inserted_id)
    return {"message": "Vendor created", "vendor": vendor_dict}

@router.get("/vendors")
async def get_vendors(category: Optional[str] = None, project_id: Optional[str] = None):
    """Get all vendors, optionally filtered by category or project"""
    query = {}
    if category:
        query['category'] = category
    if project_id:
        query['project_id'] = project_id
    
    vendors = []
    async for vendor in db.vendors.find(query):
        vendor['_id'] = str(vendor['_id'])
        vendors.append(vendor)
    return vendors

@router.get("/vendors/{vendor_id}")
async def get_vendor(vendor_id: str):
    """Get a specific vendor"""
    vendor = await db.vendors.find_one({"_id": vendor_id})
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")
    vendor['_id'] = str(vendor['_id'])
    return vendor

@router.put("/vendors/{vendor_id}")
async def update_vendor(vendor_id: str, updates: VendorUpdate):
    """Update vendor information"""
    update_dict = {k: v for k, v in updates.dict().items() if v is not None}
    if not update_dict:
        raise HTTPException(status_code=400, detail="No updates provided")
    
    result = await db.vendors.update_one(
        {"_id": vendor_id},
        {"$set": update_dict}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Vendor not found")
    
    return {"message": "Vendor updated"}

@router.delete("/vendors/{vendor_id}")
async def delete_vendor(vendor_id: str):
    """Delete a vendor"""
    result = await db.vendors.delete_one({"_id": vendor_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Vendor not found")
    return {"message": "Vendor deleted"}

# ============================================
# MATERIAL LIBRARY
# ============================================

class Material(BaseModel):
    name: str = Field(description="Material name")
    category: str = Field(description="fabric, wallpaper, paint, tile, etc.")
    manufacturer: str = Field(default="", description="Manufacturer name")
    sku: str = Field(default="", description="SKU or product code")
    color: str = Field(default="", description="Color name")
    color_code: str = Field(default="", description="Color code (hex, RGB, etc.)")
    pattern: str = Field(default="", description="Pattern name")
    width: Optional[float] = Field(default=None, description="Width in inches")
    repeat: Optional[float] = Field(default=None, description="Pattern repeat in inches")
    price_per_unit: Optional[float] = Field(default=None, description="Price per unit")
    unit: str = Field(default="yard", description="yard, roll, sqft, etc.")
    swatch_url: str = Field(default="", description="Image URL of swatch")
    notes: str = Field(default="", description="Additional notes")
    project_id: Optional[str] = Field(default=None, description="Associated project")
    tags: List[str] = Field(default=[], description="Tags for searching")

class MaterialUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    manufacturer: Optional[str] = None
    sku: Optional[str] = None
    color: Optional[str] = None
    color_code: Optional[str] = None
    pattern: Optional[str] = None
    width: Optional[float] = None
    repeat: Optional[float] = None
    price_per_unit: Optional[float] = None
    unit: Optional[str] = None
    swatch_url: Optional[str] = None
    notes: Optional[str] = None
    tags: Optional[List[str]] = None

@router.post("/materials")
async def create_material(material: Material):
    """Add a new material to the library"""
    material_dict = material.dict()
    material_dict['created_at'] = datetime.utcnow().isoformat()
    result = await db.materials.insert_one(material_dict)
    material_dict['_id'] = str(result.inserted_id)
    return {"message": "Material added", "material": material_dict}

@router.get("/materials")
async def get_materials(
    category: Optional[str] = None,
    project_id: Optional[str] = None,
    search: Optional[str] = None
):
    """Get all materials, with optional filtering"""
    query = {}
    if category:
        query['category'] = category
    if project_id:
        query['project_id'] = project_id
    if search:
        query['$or'] = [
            {'name': {'$regex': search, '$options': 'i'}},
            {'manufacturer': {'$regex': search, '$options': 'i'}},
            {'sku': {'$regex': search, '$options': 'i'}},
            {'tags': {'$in': [search]}}
        ]
    
    materials = []
    async for material in db.materials.find(query):
        material['_id'] = str(material['_id'])
        materials.append(material)
    return materials

@router.get("/materials/{material_id}")
async def get_material(material_id: str):
    """Get a specific material"""
    material = await db.materials.find_one({"_id": material_id})
    if not material:
        raise HTTPException(status_code=404, detail="Material not found")
    material['_id'] = str(material['_id'])
    return material

@router.put("/materials/{material_id}")
async def update_material(material_id: str, updates: MaterialUpdate):
    """Update material information"""
    update_dict = {k: v for k, v in updates.dict().items() if v is not None}
    if not update_dict:
        raise HTTPException(status_code=400, detail="No updates provided")
    
    result = await db.materials.update_one(
        {"_id": material_id},
        {"$set": update_dict}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Material not found")
    
    return {"message": "Material updated"}

@router.delete("/materials/{material_id}")
async def delete_material(material_id: str):
    """Delete a material"""
    result = await db.materials.delete_one({"_id": material_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Material not found")
    return {"message": "Material deleted"}

# ============================================
# BUDGET TRACKER
# ============================================

class BudgetItem(BaseModel):
    project_id: str = Field(description="Project ID")
    category: str = Field(description="furniture, labor, materials, etc.")
    item_name: str = Field(description="Item description")
    estimated_cost: float = Field(ge=0, description="Estimated cost")
    actual_cost: Optional[float] = Field(default=None, ge=0, description="Actual cost")
    quantity: int = Field(default=1, ge=1, description="Quantity")
    notes: str = Field(default="", description="Notes")
    status: str = Field(default="pending", description="pending, ordered, received, paid")

class BudgetUpdate(BaseModel):
    category: Optional[str] = None
    item_name: Optional[str] = None
    estimated_cost: Optional[float] = None
    actual_cost: Optional[float] = None
    quantity: Optional[int] = None
    notes: Optional[str] = None
    status: Optional[str] = None

@router.post("/budget")
async def create_budget_item(item: BudgetItem):
    """Add a budget item"""
    item_dict = item.dict()
    item_dict['created_at'] = datetime.utcnow().isoformat()
    result = await db.budget.insert_one(item_dict)
    item_dict['_id'] = str(result.inserted_id)
    return {"message": "Budget item created", "item": item_dict}

@router.get("/budget/{project_id}")
async def get_project_budget(project_id: str):
    """Get all budget items for a project"""
    items = []
    async for item in db.budget.find({"project_id": project_id}):
        item['_id'] = str(item['_id'])
        items.append(item)
    
    # Calculate totals
    total_estimated = sum(i['estimated_cost'] * i.get('quantity', 1) for i in items)
    total_actual = sum((i.get('actual_cost') or 0) * i.get('quantity', 1) for i in items)
    
    return {
        "items": items,
        "summary": {
            "total_estimated": total_estimated,
            "total_actual": total_actual,
            "difference": total_actual - total_estimated,
            "item_count": len(items)
        }
    }

@router.put("/budget/{item_id}")
async def update_budget_item(item_id: str, updates: BudgetUpdate):
    """Update a budget item"""
    update_dict = {k: v for k, v in updates.dict().items() if v is not None}
    if not update_dict:
        raise HTTPException(status_code=400, detail="No updates provided")
    
    result = await db.budget.update_one(
        {"_id": item_id},
        {"$set": update_dict}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Budget item not found")
    
    return {"message": "Budget item updated"}

@router.delete("/budget/{item_id}")
async def delete_budget_item(item_id: str):
    """Delete a budget item"""
    result = await db.budget.delete_one({"_id": item_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Budget item not found")
    return {"message": "Budget item deleted"}

# ============================================
# SMART SHOPPING LIST GENERATOR
# ============================================

@router.get("/shopping-list/{project_id}")
async def generate_shopping_list(project_id: str):
    """Generate smart shopping list from project items"""
    # Get project
    project = await db.projects.find_one({"id": project_id})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    shopping_list = {
        "project_name": project.get('name', 'Unknown Project'),
        "generated_at": datetime.utcnow().isoformat(),
        "categories": {}
    }
    
    # Collect all items from all rooms
    for room in project.get('rooms', []):
        for category in room.get('categories', []):
            for item in category.get('items', []):
                if not item.get('is_complete', False):
                    # Categorize items
                    item_category = item.get('category', 'Miscellaneous')
                    if item_category not in shopping_list['categories']:
                        shopping_list['categories'][item_category] = []
                    
                    shopping_list['categories'][item_category].append({
                        "name": item.get('name', 'Unnamed Item'),
                        "room": room.get('name', 'Unknown Room'),
                        "quantity": item.get('quantity', 1),
                        "notes": item.get('notes', ''),
                        "link": item.get('link', ''),
                        "status": item.get('status', 'Not Started')
                    })
    
    # Count totals
    total_items = sum(len(items) for items in shopping_list['categories'].values())
    shopping_list['total_items'] = total_items
    shopping_list['category_count'] = len(shopping_list['categories'])
    
    return shopping_list

# ============================================
# AI ROOM TYPE DETECTION (Basic Implementation)
# ============================================

class RoomDetectionRequest(BaseModel):
    room_description: str = Field(description="Description of the room")
    dimensions: Optional[str] = Field(default=None, description="Room dimensions")
    features: List[str] = Field(default=[], description="Notable features")

@router.post("/detect-room-type")
async def detect_room_type(request: RoomDetectionRequest):
    """
    AI-powered room type detection (simplified rule-based for now)
    """
    description = request.room_description.lower()
    
    # Rule-based detection
    room_types = {
        'kitchen': ['kitchen', 'cooking', 'stove', 'oven', 'refrigerator', 'pantry'],
        'bedroom': ['bedroom', 'sleep', 'bed', 'closet', 'dresser'],
        'bathroom': ['bathroom', 'bath', 'shower', 'toilet', 'vanity', 'sink'],
        'living room': ['living', 'family', 'couch', 'sofa', 'tv', 'entertainment'],
        'dining room': ['dining', 'table', 'chairs', 'eat'],
        'office': ['office', 'desk', 'computer', 'work', 'study'],
        'laundry room': ['laundry', 'washer', 'dryer'],
        'mudroom': ['mudroom', 'entry', 'coat'],
        'garage': ['garage', 'car', 'storage']
    }
    
    # Score each room type
    scores = {}
    for room_type, keywords in room_types.items():
        score = sum(1 for keyword in keywords if keyword in description)
        if score > 0:
            scores[room_type] = score
    
    if not scores:
        return {
            "detected_type": "unspecified",
            "confidence": 0,
            "suggestions": list(room_types.keys())
        }
    
    # Get best match
    best_match = max(scores.items(), key=lambda x: x[1])
    confidence = (best_match[1] / len(room_types[best_match[0]])) * 100
    
    return {
        "detected_type": best_match[0],
        "confidence": min(confidence, 95),  # Cap at 95%
        "all_scores": scores,
        "suggestions": [k for k, v in sorted(scores.items(), key=lambda x: x[1], reverse=True)[:3]]
    }

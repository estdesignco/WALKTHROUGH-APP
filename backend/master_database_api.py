"""
Master Database API - Global Contacts and Materials Database
This module handles the master contacts and materials lists that can be used
across all projects with predictive text/autocomplete functionality.
"""

from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from pydantic import BaseModel, Field, EmailStr
from typing import Optional, List
from datetime import datetime, timezone
import uuid
import os
import base64
from motor.motor_asyncio import AsyncIOMotorClient

router = APIRouter(prefix="/api/master", tags=["master-database"])

# MongoDB connection
mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ.get('DB_NAME', 'interior_design_db')]

# ============================================
# MASTER CONTACTS DATABASE
# ============================================

class MasterContactCreate(BaseModel):
    name: str = Field(description="Contact name")
    phone: Optional[str] = Field(default="", description="Phone number")
    email: Optional[str] = Field(default="", description="Email address")
    company: Optional[str] = Field(default="", description="Company name")
    role: Optional[str] = Field(default="", description="Role/profession (Builder, Architect, etc.)")
    address: Optional[str] = Field(default="", description="Address")
    website: Optional[str] = Field(default="", description="Website URL")
    notes: Optional[str] = Field(default="", description="Additional notes")
    tags: Optional[List[str]] = Field(default=[], description="Tags for categorization")

class MasterContact(MasterContactCreate):
    id: str
    created_at: str
    updated_at: str
    used_in_projects: List[str] = Field(default=[], description="Project IDs where this contact is used")

@router.post("/contacts", response_model=MasterContact)
async def create_master_contact(contact: MasterContactCreate):
    """Create a new master contact"""
    contact_dict = contact.dict()
    contact_dict["id"] = str(uuid.uuid4())
    contact_dict["created_at"] = datetime.now(timezone.utc).isoformat()
    contact_dict["updated_at"] = datetime.now(timezone.utc).isoformat()
    contact_dict["used_in_projects"] = []
    
    await db.master_contacts.insert_one(contact_dict)
    return MasterContact(**contact_dict)

@router.get("/contacts", response_model=List[MasterContact])
async def get_master_contacts(
    search: Optional[str] = None,
    role: Optional[str] = None,
    limit: int = 100
):
    """Get all master contacts with optional search/filter"""
    query = {}
    
    if search:
        query["$or"] = [
            {"name": {"$regex": search, "$options": "i"}},
            {"company": {"$regex": search, "$options": "i"}},
            {"email": {"$regex": search, "$options": "i"}},
            {"phone": {"$regex": search, "$options": "i"}}
        ]
    
    if role:
        query["role"] = {"$regex": role, "$options": "i"}
    
    contacts = await db.master_contacts.find(query, {"_id": 0}).limit(limit).to_list(limit)
    return [MasterContact(**c) for c in contacts]

@router.get("/contacts/autocomplete")
async def autocomplete_contacts(q: str, limit: int = 10):
    """Get contact suggestions for autocomplete based on partial name/company"""
    if len(q) < 1:
        return []
    
    query = {
        "$or": [
            {"name": {"$regex": f"^{q}", "$options": "i"}},
            {"company": {"$regex": f"^{q}", "$options": "i"}}
        ]
    }
    
    contacts = await db.master_contacts.find(query, {"_id": 0}).limit(limit).to_list(limit)
    return contacts

@router.get("/contacts/{contact_id}", response_model=MasterContact)
async def get_master_contact(contact_id: str):
    """Get a specific master contact"""
    contact = await db.master_contacts.find_one({"id": contact_id}, {"_id": 0})
    if not contact:
        raise HTTPException(status_code=404, detail="Contact not found")
    return MasterContact(**contact)

@router.put("/contacts/{contact_id}", response_model=MasterContact)
async def update_master_contact(contact_id: str, updates: dict):
    """Update a master contact"""
    updates["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    result = await db.master_contacts.update_one(
        {"id": contact_id},
        {"$set": updates}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Contact not found")
    
    contact = await db.master_contacts.find_one({"id": contact_id}, {"_id": 0})
    return MasterContact(**contact)

@router.delete("/contacts/{contact_id}")
async def delete_master_contact(contact_id: str):
    """Delete a master contact"""
    result = await db.master_contacts.delete_one({"id": contact_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Contact not found")
    return {"message": "Contact deleted successfully"}

@router.post("/contacts/{contact_id}/link-project/{project_id}")
async def link_contact_to_project(contact_id: str, project_id: str):
    """Link a master contact to a project"""
    result = await db.master_contacts.update_one(
        {"id": contact_id},
        {"$addToSet": {"used_in_projects": project_id}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Contact not found")
    
    return {"message": "Contact linked to project"}

@router.get("/contacts/roles/list")
async def get_contact_roles():
    """Get list of all available contact roles"""
    return {
        "roles": [
            "Client",
            "Builder/General Contractor",
            "Architect",
            "Interior Designer",
            "Electrician",
            "Plumber",
            "HVAC Technician",
            "Painter",
            "Flooring Specialist",
            "Tile Installer",
            "Cabinet Maker",
            "Countertop Installer",
            "Window/Door Installer",
            "Landscaper",
            "Pool Contractor",
            "Audio/Visual Specialist",
            "Lighting Designer",
            "Custom Furniture Maker",
            "Upholsterer",
            "Art Consultant",
            "Staging Professional",
            "Real Estate Agent",
            "Property Manager",
            "Vendor/Supplier",
            "Showroom Representative",
            "Other"
        ]
    }

# ============================================
# MASTER MATERIALS DATABASE
# ============================================

class MasterMaterialCreate(BaseModel):
    name: str = Field(description="Material name")
    category: str = Field(description="fabric, wallpaper, paint, tile, flooring, hardware, lighting, etc.")
    manufacturer: Optional[str] = Field(default="", description="Manufacturer/Brand")
    vendor: Optional[str] = Field(default="", description="Vendor/Supplier")
    sku: Optional[str] = Field(default="", description="SKU or product code")
    color: Optional[str] = Field(default="", description="Color name")
    color_code: Optional[str] = Field(default="", description="Color code (hex, RGB, Pantone, etc.)")
    pattern: Optional[str] = Field(default="", description="Pattern name/description")
    width: Optional[float] = Field(default=None, description="Width in inches")
    height: Optional[float] = Field(default=None, description="Height in inches")
    repeat: Optional[float] = Field(default=None, description="Pattern repeat in inches")
    price_per_unit: Optional[float] = Field(default=None, description="Price per unit")
    unit: Optional[str] = Field(default="yard", description="Unit: yard, roll, sqft, each, etc.")
    lead_time: Optional[str] = Field(default="", description="Lead time for ordering")
    photo_url: Optional[str] = Field(default="", description="URL of photo/swatch image")
    photo_data: Optional[str] = Field(default="", description="Base64 encoded photo data")
    notes: Optional[str] = Field(default="", description="Additional notes")
    tags: Optional[List[str]] = Field(default=[], description="Tags for searching")
    
class MasterMaterial(MasterMaterialCreate):
    id: str
    created_at: str
    updated_at: str
    used_in_projects: List[str] = Field(default=[], description="Project IDs where this material is used")

@router.post("/materials", response_model=MasterMaterial)
async def create_master_material(material: MasterMaterialCreate):
    """Create a new master material"""
    material_dict = material.dict()
    material_dict["id"] = str(uuid.uuid4())
    material_dict["created_at"] = datetime.now(timezone.utc).isoformat()
    material_dict["updated_at"] = datetime.now(timezone.utc).isoformat()
    material_dict["used_in_projects"] = []
    
    await db.master_materials.insert_one(material_dict)
    return MasterMaterial(**material_dict)

@router.post("/materials/with-photo")
async def create_material_with_photo(
    name: str = Form(...),
    category: str = Form(...),
    manufacturer: str = Form(""),
    vendor: str = Form(""),
    sku: str = Form(""),
    color: str = Form(""),
    color_code: str = Form(""),
    pattern: str = Form(""),
    width: Optional[float] = Form(None),
    height: Optional[float] = Form(None),
    repeat: Optional[float] = Form(None),
    price_per_unit: Optional[float] = Form(None),
    unit: str = Form("yard"),
    lead_time: str = Form(""),
    notes: str = Form(""),
    tags: str = Form(""),  # Comma-separated
    photo: Optional[UploadFile] = File(None)
):
    """Create a new master material with photo upload"""
    
    # Handle photo upload
    photo_data = ""
    if photo:
        content = await photo.read()
        photo_data = base64.b64encode(content).decode('utf-8')
        photo_data = f"data:{photo.content_type};base64,{photo_data}"
    
    # Parse tags
    tags_list = [t.strip() for t in tags.split(",") if t.strip()] if tags else []
    
    material_dict = {
        "id": str(uuid.uuid4()),
        "name": name,
        "category": category,
        "manufacturer": manufacturer,
        "vendor": vendor,
        "sku": sku,
        "color": color,
        "color_code": color_code,
        "pattern": pattern,
        "width": width,
        "height": height,
        "repeat": repeat,
        "price_per_unit": price_per_unit,
        "unit": unit,
        "lead_time": lead_time,
        "photo_url": "",
        "photo_data": photo_data,
        "notes": notes,
        "tags": tags_list,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat(),
        "used_in_projects": []
    }
    
    await db.master_materials.insert_one(material_dict)
    
    # Don't return photo_data in response to keep it light
    response = {k: v for k, v in material_dict.items() if k != "photo_data"}
    response["has_photo"] = bool(photo_data)
    return response

@router.get("/materials", response_model=List[MasterMaterial])
async def get_master_materials(
    search: Optional[str] = None,
    category: Optional[str] = None,
    manufacturer: Optional[str] = None,
    limit: int = 100
):
    """Get all master materials with optional search/filter"""
    query = {}
    
    if search:
        query["$or"] = [
            {"name": {"$regex": search, "$options": "i"}},
            {"manufacturer": {"$regex": search, "$options": "i"}},
            {"vendor": {"$regex": search, "$options": "i"}},
            {"sku": {"$regex": search, "$options": "i"}},
            {"color": {"$regex": search, "$options": "i"}},
            {"tags": {"$in": [search]}}
        ]
    
    if category:
        query["category"] = {"$regex": category, "$options": "i"}
    
    if manufacturer:
        query["manufacturer"] = {"$regex": manufacturer, "$options": "i"}
    
    # Exclude photo_data from list view to keep response light
    materials = await db.master_materials.find(
        query, 
        {"_id": 0, "photo_data": 0}
    ).limit(limit).to_list(limit)
    
    return materials

@router.get("/materials/autocomplete")
async def autocomplete_materials(q: str, limit: int = 10):
    """Get material suggestions for autocomplete"""
    if len(q) < 1:
        return []
    
    query = {
        "$or": [
            {"name": {"$regex": q, "$options": "i"}},
            {"manufacturer": {"$regex": q, "$options": "i"}},
            {"sku": {"$regex": q, "$options": "i"}},
            {"color": {"$regex": q, "$options": "i"}}
        ]
    }
    
    materials = await db.master_materials.find(
        query, 
        {"_id": 0, "photo_data": 0}
    ).limit(limit).to_list(limit)
    
    return materials

@router.get("/materials/{material_id}")
async def get_master_material(material_id: str, include_photo: bool = False):
    """Get a specific master material"""
    projection = {"_id": 0}
    if not include_photo:
        projection["photo_data"] = 0
    
    material = await db.master_materials.find_one({"id": material_id}, projection)
    if not material:
        raise HTTPException(status_code=404, detail="Material not found")
    
    return material

@router.get("/materials/{material_id}/photo")
async def get_material_photo(material_id: str):
    """Get just the photo data for a material"""
    material = await db.master_materials.find_one(
        {"id": material_id}, 
        {"_id": 0, "photo_data": 1, "photo_url": 1}
    )
    if not material:
        raise HTTPException(status_code=404, detail="Material not found")
    
    return {
        "photo_data": material.get("photo_data", ""),
        "photo_url": material.get("photo_url", "")
    }

@router.put("/materials/{material_id}")
async def update_master_material(material_id: str, updates: dict):
    """Update a master material"""
    updates["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    result = await db.master_materials.update_one(
        {"id": material_id},
        {"$set": updates}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Material not found")
    
    material = await db.master_materials.find_one({"id": material_id}, {"_id": 0, "photo_data": 0})
    return material

@router.post("/materials/{material_id}/photo")
async def upload_material_photo(material_id: str, photo: UploadFile = File(...)):
    """Upload/update photo for a material"""
    content = await photo.read()
    photo_data = base64.b64encode(content).decode('utf-8')
    photo_data = f"data:{photo.content_type};base64,{photo_data}"
    
    result = await db.master_materials.update_one(
        {"id": material_id},
        {"$set": {
            "photo_data": photo_data,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Material not found")
    
    return {"message": "Photo uploaded successfully"}

@router.delete("/materials/{material_id}")
async def delete_master_material(material_id: str):
    """Delete a master material"""
    result = await db.master_materials.delete_one({"id": material_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Material not found")
    return {"message": "Material deleted successfully"}

@router.post("/materials/{material_id}/link-project/{project_id}")
async def link_material_to_project(material_id: str, project_id: str):
    """Link a master material to a project"""
    result = await db.master_materials.update_one(
        {"id": material_id},
        {"$addToSet": {"used_in_projects": project_id}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Material not found")
    
    return {"message": "Material linked to project"}

@router.get("/materials/categories/list")
async def get_material_categories():
    """Get list of all material categories"""
    return {
        "categories": [
            "fabric",
            "wallpaper",
            "paint",
            "tile",
            "flooring",
            "stone",
            "wood",
            "metal",
            "glass",
            "hardware",
            "lighting",
            "trim",
            "molding",
            "countertop",
            "backsplash",
            "carpet",
            "rug",
            "window_treatment",
            "upholstery",
            "leather",
            "accessory",
            "other"
        ]
    }

# ============================================
# AUTO-SYNC: Create contact from any field
# ============================================

@router.post("/contacts/auto-sync")
async def auto_sync_contact(
    name: str,
    phone: Optional[str] = "",
    email: Optional[str] = "",
    role: Optional[str] = "",
    company: Optional[str] = "",
    project_id: Optional[str] = None
):
    """
    Auto-sync a contact - check if exists, create if not, and link to project
    Called whenever a contact is entered in any field in the app
    """
    # Check if contact already exists (by name + phone or name + email)
    existing = None
    
    if phone:
        existing = await db.master_contacts.find_one({
            "name": {"$regex": f"^{name}$", "$options": "i"},
            "phone": phone
        }, {"_id": 0})
    
    if not existing and email:
        existing = await db.master_contacts.find_one({
            "name": {"$regex": f"^{name}$", "$options": "i"},
            "email": {"$regex": f"^{email}$", "$options": "i"}
        }, {"_id": 0})
    
    if existing:
        # Link to project if provided
        if project_id:
            await db.master_contacts.update_one(
                {"id": existing["id"]},
                {"$addToSet": {"used_in_projects": project_id}}
            )
        return {"status": "existing", "contact": existing}
    
    # Create new contact
    contact_dict = {
        "id": str(uuid.uuid4()),
        "name": name,
        "phone": phone or "",
        "email": email or "",
        "company": company or "",
        "role": role or "",
        "address": "",
        "website": "",
        "notes": "",
        "tags": [],
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat(),
        "used_in_projects": [project_id] if project_id else []
    }
    
    await db.master_contacts.insert_one(contact_dict)
    return {"status": "created", "contact": contact_dict}

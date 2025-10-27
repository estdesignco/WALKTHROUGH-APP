from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime
import uuid

router = APIRouter(prefix="/api/contacts", tags=["contacts"])

# Pydantic Models
class ContactCreate(BaseModel):
    project_id: str
    name: str
    phone: str
    email: Optional[EmailStr] = None
    role: str  # Builder, Architect, Electrician, etc.
    company: Optional[str] = None
    address: Optional[str] = None
    notes: Optional[str] = None

class Contact(BaseModel):
    id: str
    project_id: str
    name: str
    phone: str
    email: Optional[str] = None
    role: str
    company: Optional[str] = None
    address: Optional[str] = None
    notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime

# This will be injected from server.py
db = None

def set_db(database):
    global db
    db = database

@router.get("/project/{project_id}", response_model=List[Contact])
async def get_project_contacts(project_id: str):
    """Get all contacts for a project"""
    contacts = await db.contacts.find({"project_id": project_id}).to_list(1000)
    return [Contact(**{k: v for k, v in c.items() if k != '_id'}) for c in contacts]

@router.post("", response_model=Contact)
async def create_contact(contact: ContactCreate):
    """Create a new contact"""
    contact_dict = contact.dict()
    contact_dict["id"] = str(uuid.uuid4())
    contact_dict["created_at"] = datetime.utcnow()
    contact_dict["updated_at"] = datetime.utcnow()
    
    await db.contacts.insert_one(contact_dict)
    return Contact(**contact_dict)

@router.put("/{contact_id}", response_model=Contact)
async def update_contact(contact_id: str, updates: dict):
    """Update a contact"""
    updates["updated_at"] = datetime.utcnow()
    result = await db.contacts.update_one({"id": contact_id}, {"$set": updates})
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Contact not found")
    
    contact = await db.contacts.find_one({"id": contact_id})
    return Contact(**{k: v for k, v in contact.items() if k != '_id'})

@router.delete("/{contact_id}")
async def delete_contact(contact_id: str):
    """Delete a contact"""
    result = await db.contacts.delete_one({"id": contact_id})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Contact not found")
    
    return {"message": "Contact deleted successfully"}

@router.get("/roles")
async def get_contact_roles():
    """Get list of available contact roles"""
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
            "Furniture Vendor",
            "Fabric/Textile Supplier",
            "Art Consultant",
            "Other"
        ]
    }

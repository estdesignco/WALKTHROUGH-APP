import os
import sys
from pathlib import Path
import subprocess
from fastapi import FastAPI, HTTPException, Depends, UploadFile, File, Form, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Dict, Any, Union
import asyncio
import aiofiles
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId
from datetime import datetime, timezone
from enum import Enum
import time
from datetime import datetime, timezone
from enum import Enum
from playwright.async_api import async_playwright
from enhanced_rooms import COMPREHENSIVE_ROOM_STRUCTURE  # Add comprehensive structure import
from enhanced_rooms_intelligent import INTELLIGENT_ROOM_STRUCTURE  # Add intelligent structure import
import aiosmtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from teams_integration import notify_status_change
from dotenv import load_dotenv

# Import Google Sheets functionality
from google_sheets_routes import router as google_sheets_router

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

app = FastAPI(title="Interior Design FF&E Manager", version="1.0.0")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Google Sheets import routes
app.include_router(google_sheets_router)

# ... [rest of existing server.py code remains the same] ...

# Database connection
MONGODB_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017")
DATABASE_NAME = os.getenv("DB_NAME", "interior_design_db")

client = AsyncIOMotorClient(MONGODB_URL)
db = client[DATABASE_NAME]

# Collections
projects_collection = db.projects
rooms_collection = db.rooms
categories_collection = db.categories
items_collection = db.items

# Pydantic models
class ProjectType(str, Enum):
    RENOVATION = "Renovation"
    NEW_CONSTRUCTION = "New Construction"
    DESIGN_CONSULTATION = "Design Consultation"
    FURNITURE_ONLY = "Furniture Only"

class ItemStatus(str, Enum):
    WALKTHROUGH = "Walkthrough"
    TO_BE_SELECTED = "To Be Selected"
    PENDING_APPROVAL = "Pending Approval"
    APPROVED = "Approved"
    ORDERED = "Ordered"
    RECEIVED = "Received"
    DELIVERED = "Delivered"
    INSTALLED = "Installed"

class ClientInfo(BaseModel):
    full_name: str = Field(..., min_length=1)
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    address: Optional[str] = None

class Project(BaseModel):
    name: Optional[str] = None
    client_info: ClientInfo
    project_type: Optional[ProjectType] = None
    timeline: Optional[str] = None
    budget: Optional[str] = None
    rooms_involved: Optional[List[str]] = []
    contact_preferences: Optional[List[str]] = []
    style_preferences: Optional[List[str]] = []
    color_palette: Optional[str] = None
    special_requirements: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

class Room(BaseModel):
    project_id: str
    name: str
    description: Optional[str] = None
    notes: Optional[str] = None
    created_at: Optional[datetime] = None

class Category(BaseModel):
    room_id: str
    name: str
    color: Optional[str] = None
    order: Optional[int] = 0

class Item(BaseModel):
    project_id: str
    room_id: str
    category_id: Optional[str] = None
    name: str
    description: Optional[str] = None
    brand: Optional[str] = None
    model: Optional[str] = None
    size: Optional[str] = None
    finish: Optional[str] = None
    vendor: Optional[str] = None
    cost: Optional[float] = None
    quantity: Optional[int] = 1
    status: Optional[ItemStatus] = ItemStatus.WALKTHROUGH
    notes: Optional[str] = None
    url: Optional[str] = None
    sku: Optional[str] = None
    order_date: Optional[datetime] = None
    expected_delivery: Optional[datetime] = None
    tracking_number: Optional[str] = None
    carrier: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

# Helper functions
def serialize_doc(doc):
    if doc is None:
        return None
    doc['id'] = str(doc['_id'])
    del doc['_id']
    return doc

def serialize_docs(docs):
    return [serialize_doc(doc) for doc in docs]

# API Routes

@app.get("/")
async def root():
    return {"message": "Interior Design FF&E Manager API", "version": "1.0.0"}

# Projects
@app.post("/api/projects")
async def create_project(project: Project):
    project_dict = project.dict()
    project_dict['created_at'] = datetime.now(timezone.utc)
    project_dict['updated_at'] = datetime.now(timezone.utc)
    
    if not project_dict.get('name') and project_dict.get('client_info', {}).get('full_name'):
        project_dict['name'] = f"{project_dict['client_info']['full_name']} Project"
    
    result = await projects_collection.insert_one(project_dict)
    created_project = await projects_collection.find_one({"_id": result.inserted_id})
    
    return serialize_doc(created_project)

@app.get("/api/projects")
async def get_projects():
    projects = await projects_collection.find().sort("updated_at", -1).to_list(length=None)
    return serialize_docs(projects)

@app.get("/api/projects/{project_id}")
async def get_project(project_id: str):
    try:
        # Get the project
        project = await projects_collection.find_one({"_id": ObjectId(project_id)})
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")
        
        # Get all rooms for this project
        rooms_cursor = rooms_collection.find({"project_id": project_id})
        rooms = await rooms_cursor.to_list(length=None)
        
        # For each room, get its items
        for room in rooms:
            room_id = room["id"]
            items_cursor = items_collection.find({"room_id": room_id})
            items = await items_cursor.to_list(length=None)
            room["items"] = [serialize_doc(item) for item in items]
        
        # Add rooms to project
        project_data = serialize_doc(project)
        project_data["rooms"] = [serialize_doc(room) for room in rooms]
        
        return project_data
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid project ID: {str(e)}")

@app.put("/api/projects/{project_id}")
async def update_project(project_id: str, project: Project):
    try:
        project_dict = project.dict(exclude_unset=True)
        project_dict['updated_at'] = datetime.now(timezone.utc)
        
        result = await projects_collection.update_one(
            {"_id": ObjectId(project_id)},
            {"$set": project_dict}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Project not found")
        
        updated_project = await projects_collection.find_one({"_id": ObjectId(project_id)})
        return serialize_doc(updated_project)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Update failed: {str(e)}")

@app.delete("/api/projects/{project_id}")
async def delete_project(project_id: str):
    try:
        # Delete associated rooms, categories, and items
        await rooms_collection.delete_many({"project_id": project_id})
        await categories_collection.delete_many({"project_id": project_id})
        await items_collection.delete_many({"project_id": project_id})
        
        result = await projects_collection.delete_one({"_id": ObjectId(project_id)})
        
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Project not found")
        
        return {"message": "Project deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Delete failed: {str(e)}")

# Rooms
@app.post("/api/rooms")
async def create_room(room: Room):
    room_dict = room.dict()
    room_dict['created_at'] = datetime.now(timezone.utc)
    
    result = await rooms_collection.insert_one(room_dict)
    created_room = await rooms_collection.find_one({"_id": result.inserted_id})
    
    return serialize_doc(created_room)

@app.get("/api/projects/{project_id}/rooms")
async def get_project_rooms(project_id: str):
    rooms = await rooms_collection.find({"project_id": project_id}).to_list(length=None)
    return serialize_docs(rooms)

@app.get("/api/rooms/{room_id}")
async def get_room(room_id: str):
    try:
        room = await rooms_collection.find_one({"_id": ObjectId(room_id)})
        if not room:
            raise HTTPException(status_code=404, detail="Room not found")
        return serialize_doc(room)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid room ID: {str(e)}")

# Items
@app.post("/api/items")
async def create_item(item: Item):
    item_dict = item.dict()
    item_dict['created_at'] = datetime.now(timezone.utc)
    item_dict['updated_at'] = datetime.now(timezone.utc)
    
    result = await items_collection.insert_one(item_dict)
    created_item = await items_collection.find_one({"_id": result.inserted_id})
    
    return serialize_doc(created_item)

@app.get("/api/projects/{project_id}/items")
async def get_project_items(project_id: str):
    items = await items_collection.find({"project_id": project_id}).to_list(length=None)
    return serialize_docs(items)

@app.put("/api/items/{item_id}")
async def update_item(item_id: str, item: Item):
    try:
        item_dict = item.dict(exclude_unset=True)
        item_dict['updated_at'] = datetime.now(timezone.utc)
        
        result = await items_collection.update_one(
            {"_id": ObjectId(item_id)},
            {"$set": item_dict}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Item not found")
        
        updated_item = await items_collection.find_one({"_id": ObjectId(item_id)})
        return serialize_doc(updated_item)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Update failed: {str(e)}")

# Utility endpoints for frontend
@app.get("/api/room-colors")
async def get_room_colors():
    return [
        {"name": "Living Room", "color": "#8B4513"},
        {"name": "Kitchen", "color": "#228B22"},
        {"name": "Bedroom", "color": "#4169E1"},
        {"name": "Bathroom", "color": "#20B2AA"},
        {"name": "Dining Room", "color": "#DC143C"},
        {"name": "Office", "color": "#FF8C00"}
    ]

@app.get("/api/item-statuses")
async def get_item_statuses():
    return [status.value for status in ItemStatus]

@app.get("/api/vendor-types")
async def get_vendor_types():
    return [
        "Wayfair", "West Elm", "CB2", "Pottery Barn", "Williams Sonoma",
        "Restoration Hardware", "Room & Board", "Design Within Reach"
    ]

@app.get("/api/carrier-types")
async def get_carrier_types():
    return ["FedEx", "UPS", "USPS", "DHL", "Local Delivery", "White Glove"]

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
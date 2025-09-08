from fastapi import FastAPI, APIRouter, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import requests
from bs4 import BeautifulSoup
import re
from urllib.parse import urljoin, urlparse
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime
from enum import Enum

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

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

# Default room structure with 3-level hierarchy
ROOM_DEFAULT_STRUCTURE = {
    'living room': {
        'Lighting': ['Installed', 'Portable'],
        'Furniture & Storage': ['Seating', 'Storage'],
        'Decor & Accessories': ['Window Treatments', 'Art & Decor']
    },
    'kitchen': {
        'Lighting': ['Installed', 'Portable'],
        'Plumbing & Fixtures': ['Faucets', 'Sinks'],
        'Equipment & Furniture': ['Appliances', 'Cabinetry'],
        'Decor & Accessories': ['Window Treatments', 'Art & Decor']
    },
    'master bedroom': {
        'Lighting': ['Installed', 'Portable'],
        'Furniture & Storage': ['Seating', 'Storage'],
        'Decor & Accessories': ['Window Treatments', 'Art & Decor']
    },
    'bedroom 2': {
        'Lighting': ['Installed', 'Portable'],
        'Furniture & Storage': ['Storage'],
        'Decor & Accessories': ['Window Treatments', 'Art & Decor']
    },
    'bathroom': {
        'Lighting': ['Installed'],
        'Plumbing & Fixtures': ['Faucets', 'Sinks'],
        'Decor & Accessories': ['Window Treatments', 'Art & Decor']
    },
    'master bathroom': {
        'Lighting': ['Installed'],
        'Plumbing & Fixtures': ['Faucets', 'Sinks'],
        'Decor & Accessories': ['Window Treatments', 'Art & Decor']
    },
    'powder room': {
        'Lighting': ['Installed'],
        'Plumbing & Fixtures': ['Faucets', 'Sinks'],
        'Decor & Accessories': ['Art & Decor']
    },
    'dining room': {
        'Lighting': ['Installed', 'Portable'],
        'Furniture & Storage': ['Seating', 'Storage'],
        'Decor & Accessories': ['Window Treatments', 'Art & Decor']
    },
    'office': {
        'Lighting': ['Installed', 'Portable'],
        'Furniture & Storage': ['Storage'],
        'Equipment & Furniture': ['Appliances'],
        'Decor & Accessories': ['Window Treatments', 'Art & Decor']
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
    
# Vendor dropdown options from your screenshots - COMPLETE LIST
class VendorType(str, Enum):
    CLASSIC_DESIGN = "Classic Design"
    EST_DESIGN_CO = "Est. Design Co."
    JOB_SITE = "Job Site"
    VENDOR = "Vendor"
    HOME_DEPOT = "Home Depot"
    LOWES = "Lowe's"
    WAYFAIR = "Wayfair"
    POTTERY_BARN = "Pottery Barn"
    RESTORATION_HARDWARE = "Restoration Hardware"
    WEST_ELM = "West Elm"
    CB2 = "CB2"
    CRATE_BARREL = "Crate & Barrel"
    WILLIAMS_SONOMA = "Williams Sonoma"
    AMAZON = "Amazon"
    OVERSTOCK = "Overstock"
    DIRECT_FROM_MANUFACTURER = "Direct from Manufacturer"
    LOCAL_VENDOR = "Local Vendor"
    CUSTOM_FABRICATION = "Custom Fabrication"

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
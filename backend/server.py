from fastapi import FastAPI, APIRouter, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
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

# Room color constants from Google Sheets system
ROOM_COLORS = {
    "living room": "#B22222",
    "kitchen": "#008080", 
    "master bedroom": "#7B68EE",
    "bedroom 2": "#B52727",
    "bedroom 3": "#097474",
    "bathroom": "#574AA4",
    "master bathroom": "#871C1C",
    "powder room": "#1D7E7E",
    "dining room": "#9186D3",
    "office": "#094949",
    "family room": "#68B9EE",
    "basement": "#B28722",
    "laundry room": "#0C0080",
    "mudroom": "#388A66",
    "pantry": "#B2B022",
    "closet": "#A0DBC1",
    "guest room": "#A75183",
    "playroom": "#FFD966",
    "library": "#11A3C4",
    "wine cellar": "#1A0A79",
    "garage": "#7F8F2B",
    "patio": "#AEA762"
}

CATEGORY_COLORS = {
    "lighting": "#104131",
    "furniture & storage": "#B82F13",
    "plumbing & fixtures": "#104131",
    "decor & accessories": "#B82F13",
    "seating": "#104131",
    "equipment & furniture": "#B82F13",
    "installed": "#104131",
    "portable": "#B82F13"
}

class ItemStatus(str, Enum):
    PICKED = "PICKED"
    ORDERED = "ORDERED"
    SHIPPED = "SHIPPED"
    DELIVERED = "DELIVERED"
    INSTALLED = "INSTALLED"
    PARTIALLY_DELIVERED = "PARTIALLY_DELIVERED"
    ON_HOLD = "ON_HOLD"
    CANCELLED = "CANCELLED"

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
    category_id: str
    
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
    category_id: str
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
    color: str = "#104131"
    items: List[Item] = []
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
    color: str = "#B22222"
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
    return ROOM_COLORS.get(room_name.lower(), "#B22222")

def get_category_color(category_name: str) -> str:
    return CATEGORY_COLORS.get(category_name.lower(), "#104131")

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
                # Fetch items for each category
                items = await db.items.find({"category_id": category_data["id"]}).to_list(1000)
                category_data["items"] = [Item(**item) for item in items]
                
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
            # Fetch items
            items = await db.items.find({"category_id": category_data["id"]}).to_list(1000)
            category_data["items"] = [Item(**item) for item in items]
            
        room_data["categories"] = [Category(**cat) for cat in categories]
        
    project_data["rooms"] = [Room(**room) for room in rooms]
    
    return Project(**project_data)

@api_router.put("/projects/{project_id}", response_model=Project)
async def update_project(project_id: str, project_update: ProjectUpdate):
    update_data = {k: v for k, v in project_update.dict().items() if v is not None}
    update_data["updated_at"] = datetime.utcnow()
    
    result = await db.projects.update_one(
        {"id": project_id}, 
        {"$set": update_data}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Project not found")
    
    return await get_project(project_id)

@api_router.delete("/projects/{project_id}")
async def delete_project(project_id: str):
    # Delete all related data
    await db.items.delete_many({"category_id": {"$in": await get_category_ids_for_project(project_id)}})
    await db.categories.delete_many({"room_id": {"$in": await get_room_ids_for_project(project_id)}})
    await db.rooms.delete_many({"project_id": project_id})
    result = await db.projects.delete_one({"id": project_id})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Project not found")
    
    return {"message": "Project deleted successfully"}

# ROOM ENDPOINTS
@api_router.post("/rooms", response_model=Room)
async def create_room(room: RoomCreate):
    room_dict = room.dict()
    room_obj = Room(**room_dict)
    room_obj.color = get_room_color(room_obj.name)
    
    result = await db.rooms.insert_one(room_obj.dict())
    
    if result.inserted_id:
        return room_obj
    raise HTTPException(status_code=400, detail="Failed to create room")

@api_router.get("/rooms/{room_id}", response_model=Room)
async def get_room(room_id: str):
    room_data = await db.rooms.find_one({"id": room_id})
    if not room_data:
        raise HTTPException(status_code=404, detail="Room not found")
    
    # Fetch categories
    categories = await db.categories.find({"room_id": room_id}).sort("order_index", 1).to_list(1000)
    room_data["categories"] = []
    
    for category_data in categories:
        # Fetch items
        items = await db.items.find({"category_id": category_data["id"]}).to_list(1000)
        category_data["items"] = [Item(**item) for item in items]
        
    room_data["categories"] = [Category(**cat) for cat in categories]
    
    return Room(**room_data)

@api_router.put("/rooms/{room_id}", response_model=Room)
async def update_room(room_id: str, room_update: RoomUpdate):
    update_data = {k: v for k, v in room_update.dict().items() if v is not None}
    update_data["updated_at"] = datetime.utcnow()
    
    if "name" in update_data:
        update_data["color"] = get_room_color(update_data["name"])
    
    result = await db.rooms.update_one(
        {"id": room_id}, 
        {"$set": update_data}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Room not found")
    
    return await get_room(room_id)

@api_router.delete("/rooms/{room_id}")
async def delete_room(room_id: str):
    # Delete all related data
    category_ids = [cat["id"] for cat in await db.categories.find({"room_id": room_id}).to_list(1000)]
    await db.items.delete_many({"category_id": {"$in": category_ids}})
    await db.categories.delete_many({"room_id": room_id})
    result = await db.rooms.delete_one({"id": room_id})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Room not found")
    
    return {"message": "Room deleted successfully"}

# CATEGORY ENDPOINTS  
@api_router.post("/categories", response_model=Category)
async def create_category(category: CategoryCreate):
    category_dict = category.dict()
    category_obj = Category(**category_dict)
    category_obj.color = get_category_color(category_obj.name)
    
    result = await db.categories.insert_one(category_obj.dict())
    
    if result.inserted_id:
        return category_obj
    raise HTTPException(status_code=400, detail="Failed to create category")

@api_router.get("/categories/{category_id}", response_model=Category)
async def get_category(category_id: str):
    category_data = await db.categories.find_one({"id": category_id})
    if not category_data:
        raise HTTPException(status_code=404, detail="Category not found")
    
    # Fetch items
    items = await db.items.find({"category_id": category_id}).to_list(1000)
    category_data["items"] = [Item(**item) for item in items]
    
    return Category(**category_data)

@api_router.put("/categories/{category_id}", response_model=Category)
async def update_category(category_id: str, category_update: CategoryUpdate):
    update_data = {k: v for k, v in category_update.dict().items() if v is not None}
    update_data["updated_at"] = datetime.utcnow()
    
    if "name" in update_data:
        update_data["color"] = get_category_color(update_data["name"])
    
    result = await db.categories.update_one(
        {"id": category_id}, 
        {"$set": update_data}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Category not found")
    
    return await get_category(category_id)

@api_router.delete("/categories/{category_id}")
async def delete_category(category_id: str):
    # Delete all related items
    await db.items.delete_many({"category_id": category_id})
    result = await db.categories.delete_one({"id": category_id})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Category not found")
    
    return {"message": "Category deleted successfully"}

# ITEM ENDPOINTS
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

@api_router.get("/item-statuses")
async def get_item_statuses():
    return [status.value for status in ItemStatus]

# Helper functions
async def get_room_ids_for_project(project_id: str) -> List[str]:
    rooms = await db.rooms.find({"project_id": project_id}).to_list(1000)
    return [room["id"] for room in rooms]

async def get_category_ids_for_project(project_id: str) -> List[str]:
    room_ids = await get_room_ids_for_project(project_id)
    categories = await db.categories.find({"room_id": {"$in": room_ids}}).to_list(1000)
    return [cat["id"] for cat in categories]

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
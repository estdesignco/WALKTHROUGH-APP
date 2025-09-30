# FURNITURE SEARCH DATABASE - Central catalog of all clipped furniture
from fastapi import APIRouter, HTTPException
from motor.motor_asyncio import AsyncIOMotorClient
import os
from datetime import datetime
import uuid

router = APIRouter()

# MongoDB connection
MONGO_URL = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
client = AsyncIOMotorClient(MONGO_URL)
db = client.get_database('furniture_tracker')

# FURNITURE CATALOG COLLECTION - Central database of all furniture
# Each document is a furniture item clipped from vendor sites

@router.post("/houzz-webhook")
async def houzz_clipper_webhook(data: dict):
    """Webhook for Houzz Pro clipper - receives data on its way to Houzz"""
    try:
        print("\n" + "="*60)
        print("🏠 HOUZZ CLIPPER DATA RECEIVED!")
        print("="*60)
        print(f"Product: {data.get('productTitle', data.get('name'))}")
        print(f"Vendor: {data.get('vendor', data.get('manufacturer'))}")
        print(f"Cost: {data.get('cost')}")
        print("="*60 + "\n")
        
        # Transform Houzz data to our format
        furniture_item = {
            "id": str(uuid.uuid4()),
            "name": data.get('productTitle') or data.get('name', ''),
            "vendor": data.get('vendor') or data.get('manufacturer', ''),
            "manufacturer": data.get('manufacturer', ''),
            "category": data.get('category', ''),
            "cost": float(data.get('cost', 0)) if data.get('cost') else 0,
            "msrp": float(data.get('msrp', 0)) if data.get('msrp') else 0,
            "sku": data.get('sku', ''),
            "dimensions": data.get('dimensions', ''),
            "finish_color": data.get('finishColor') or data.get('finish_color', ''),
            "materials": data.get('materials', ''),
            "description": data.get('clientDescription') or data.get('description', ''),
            "image_url": data.get('images', [None])[0] if data.get('images') else '',
            "images": data.get('images', []),
            "product_url": data.get('productUrl') or data.get('link', ''),
            "tags": data.get('tags', '').split(',') if isinstance(data.get('tags'), str) else data.get('tags', []),
            "notes": data.get('internalNotes', ''),
            "clipped_date": datetime.utcnow(),
            "updated_date": datetime.utcnow(),
            "times_used": 0
        }
        
        # Check if already exists
        existing = None
        if furniture_item['sku']:
            existing = await db.furniture_catalog.find_one({"sku": furniture_item['sku']})
        if not existing and furniture_item['product_url']:
            existing = await db.furniture_catalog.find_one({"product_url": furniture_item['product_url']})
        
        if existing:
            await db.furniture_catalog.update_one(
                {"id": existing['id']},
                {"$set": {**furniture_item, "id": existing['id'], "updated_date": datetime.utcnow()}}
            )
            return {"success": True, "message": "Furniture updated", "item_id": existing['id']}
        else:
            await db.furniture_catalog.insert_one(furniture_item)
            return {"success": True, "message": "Furniture added to catalog", "item_id": furniture_item['id']}
        
    except Exception as e:
        print(f"Error in Houzz webhook: {e}")
        # Don't fail - let Houzz clipper continue
        return {"success": False, "error": str(e)}


@router.post("/furniture-catalog/add")
async def add_to_furniture_catalog(data: dict):
    """Add clipped furniture to central catalog"""
    try:
        furniture_item = {
            "id": str(uuid.uuid4()),
            "name": data.get('name'),
            "vendor": data.get('vendor'),
            "manufacturer": data.get('manufacturer'),
            "category": data.get('category'),  # Chairs, Tables, Lighting, etc.
            "subcategory": data.get('subcategory', ''),
            "cost": data.get('cost', 0),
            "msrp": data.get('msrp', 0),
            "sku": data.get('sku', ''),
            "dimensions": data.get('dimensions', ''),
            "finish_color": data.get('finish_color', ''),
            "materials": data.get('materials', ''),
            "description": data.get('description', ''),
            "image_url": data.get('image_url', ''),
            "images": data.get('images', []),  # Multiple images
            "product_url": data.get('product_url', ''),
            "tags": data.get('tags', []),
            "style": data.get('style', []),  # Modern, Traditional, etc.
            "room_type": data.get('room_type', []),  # Living Room, Bedroom, etc.
            "in_stock": data.get('in_stock', True),
            "lead_time": data.get('lead_time', ''),
            "notes": data.get('notes', ''),
            "clipped_date": datetime.utcnow(),
            "updated_date": datetime.utcnow(),
            "times_used": 0  # Track how many times used in projects
        }
        
        # Check if already exists (by SKU or product URL)
        existing = None
        if furniture_item['sku']:
            existing = await db.furniture_catalog.find_one({"sku": furniture_item['sku']})
        if not existing and furniture_item['product_url']:
            existing = await db.furniture_catalog.find_one({"product_url": furniture_item['product_url']})
        
        if existing:
            # Update existing item
            await db.furniture_catalog.update_one(
                {"id": existing['id']},
                {"$set": {**furniture_item, "id": existing['id'], "updated_date": datetime.utcnow()}}
            )
            return {"success": True, "message": "Furniture updated in catalog", "item_id": existing['id']}
        else:
            # Add new item
            await db.furniture_catalog.insert_one(furniture_item)
            return {"success": True, "message": "Furniture added to catalog", "item_id": furniture_item['id']}
        
    except Exception as e:
        print(f"Error adding to furniture catalog: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/furniture-catalog/search")
async def search_furniture_catalog(query: str = "", category: str = "", vendor: str = "", 
                                   min_price: float = 0, max_price: float = 999999,
                                   style: str = "", room_type: str = "", limit: int = 100):
    """Search furniture catalog across ALL vendors"""
    try:
        # Build search filter
        search_filter = {}
        
        # Text search on name, description, tags
        if query:
            search_filter["$or"] = [
                {"name": {"$regex": query, "$options": "i"}},
                {"description": {"$regex": query, "$options": "i"}},
                {"tags": {"$regex": query, "$options": "i"}},
                {"materials": {"$regex": query, "$options": "i"}}
            ]
        
        # Category filter
        if category:
            search_filter["category"] = {"$regex": category, "$options": "i"}
        
        # Vendor filter
        if vendor:
            search_filter["vendor"] = {"$regex": vendor, "$options": "i"}
        
        # Price range
        search_filter["cost"] = {"$gte": min_price, "$lte": max_price}
        
        # Style filter
        if style:
            search_filter["style"] = {"$regex": style, "$options": "i"}
        
        # Room type filter
        if room_type:
            search_filter["room_type"] = {"$regex": room_type, "$options": "i"}
        
        # Execute search
        cursor = db.furniture_catalog.find(search_filter).sort("name", 1).limit(limit)
        results = await cursor.to_list(length=limit)
        
        # Remove MongoDB _id from results
        for item in results:
            item.pop('_id', None)
        
        return {
            "success": True,
            "count": len(results),
            "results": results,
            "query": {
                "search": query,
                "category": category,
                "vendor": vendor,
                "price_range": f"${min_price}-${max_price}"
            }
        }
        
    except Exception as e:
        print(f"Error searching furniture catalog: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/furniture-catalog/categories")
async def get_furniture_categories():
    """Get all unique categories in catalog"""
    try:
        categories = await db.furniture_catalog.distinct("category")
        return {"success": True, "categories": sorted([c for c in categories if c])}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/furniture-catalog/vendors")
async def get_furniture_vendors():
    """Get all unique vendors in catalog"""
    try:
        vendors = await db.furniture_catalog.distinct("vendor")
        return {"success": True, "vendors": sorted([v for v in vendors if v])}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/furniture-catalog/add-to-project")
async def add_catalog_item_to_project(data: dict):
    """Add furniture from catalog to project Checklist + Canva board"""
    try:
        item_id = data.get('item_id')
        project_id = data.get('project_id')
        room_name = data.get('room_name', 'Living Room')
        
        # Get the furniture item from catalog
        furniture = await db.furniture_catalog.find_one({"id": item_id})
        if not furniture:
            raise HTTPException(status_code=404, detail="Furniture not found in catalog")
        
        # Get the project
        project = await db.projects.find_one({"id": project_id})
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")
        
        # Find or create room in Checklist
        room = None
        for r in project.get('rooms', []):
            if r['name'].lower() == room_name.lower() and r.get('sheet_type') == 'checklist':
                room = r
                break
        
        if not room:
            room = {
                "id": str(uuid.uuid4()),
                "name": room_name,
                "sheet_type": "checklist",
                "categories": []
            }
            await db.projects.update_one(
                {"id": project_id},
                {"$push": {"rooms": room}}
            )
        
        # Find or create category based on furniture category
        category_name = furniture.get('category', 'Furniture')
        category = None
        for cat in room.get('categories', []):
            if cat['name'].lower() == category_name.lower():
                category = cat
                break
        
        if not category:
            category = {
                "id": str(uuid.uuid4()),
                "name": category_name,
                "subcategories": [{
                    "id": str(uuid.uuid4()),
                    "name": "NEEDED",
                    "items": []
                }]
            }
            await db.projects.update_one(
                {"id": project_id, "rooms.id": room['id']},
                {"$push": {"rooms.$.categories": category}}
            )
        
        # Create item for project
        new_item = {
            "id": str(uuid.uuid4()),
            "name": furniture.get('name', ''),
            "vendor": furniture.get('vendor', ''),
            "cost": furniture.get('cost', 0),
            "sku": furniture.get('sku', ''),
            "size": furniture.get('dimensions', ''),
            "finish_color": furniture.get('finish_color', ''),
            "image_url": furniture.get('image_url', ''),
            "link": furniture.get('product_url', ''),
            "remarks": furniture.get('notes', ''),
            "status": "PICKED",
            "quantity": 1
        }
        
        # Add to project
        await db.projects.update_one(
            {"id": project_id, "rooms.id": room['id']},
            {"$push": {"rooms.$[room].categories.$[cat].subcategories.0.items": new_item}},
            array_filters=[
                {"room.id": room['id']},
                {"cat.name": category_name}
            ]
        )
        
        # Increment times_used counter
        await db.furniture_catalog.update_one(
            {"id": item_id},
            {"$inc": {"times_used": 1}}
        )
        
        # TODO: Add to Canva board via API
        # Will implement Canva API integration separately
        
        return {
            "success": True,
            "message": "Item added to Checklist",
            "item_id": new_item['id'],
            "canva_status": "pending"  # Will be "added" once Canva API is integrated
        }
        
    except Exception as e:
        print(f"Error adding to project: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/furniture-catalog/stats")
async def get_catalog_stats():
    """Get statistics about furniture catalog"""
    try:
        total_items = await db.furniture_catalog.count_documents({})
        
        # Count by category
        category_counts = {}
        categories = await db.furniture_catalog.distinct("category")
        for cat in categories:
            if cat:
                count = await db.furniture_catalog.count_documents({"category": cat})
                category_counts[cat] = count
        
        # Count by vendor
        vendor_counts = {}
        vendors = await db.furniture_catalog.distinct("vendor")
        for vendor in vendors:
            if vendor:
                count = await db.furniture_catalog.count_documents({"vendor": vendor})
                vendor_counts[vendor] = count
        
        return {
            "success": True,
            "total_items": total_items,
            "categories": category_counts,
            "vendors": vendor_counts
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

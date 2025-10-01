# FURNITURE SEARCH DATABASE - Central catalog of all clipped furniture
from fastapi import APIRouter, HTTPException, BackgroundTasks
from motor.motor_asyncio import AsyncIOMotorClient
import os
from datetime import datetime
import uuid
import requests
from typing import Optional, Dict, List
import asyncio
from pydantic import BaseModel
import base64
import json

router = APIRouter()

# MongoDB connection
MONGO_URL = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
client = AsyncIOMotorClient(MONGO_URL)
db = client.get_database('furniture_tracker')

# TRADE FURNITURE VENDOR DATABASE - YOUR ACTUAL VENDORS
TRADE_VENDORS = [
    {'name': 'Four Hands', 'url': 'fourhands.com', 'category': 'Furniture'},
    {'name': 'Regina Andrew', 'url': 'reginaandrew.com', 'category': 'Lighting & Decor'},
    {'name': 'Global Views', 'url': 'globalviews.com', 'category': 'Accessories & Decor'},
    {'name': 'Rowe Furniture', 'url': 'rowefurniture.com', 'category': 'Upholstery'},
    {'name': 'Bernhardt', 'url': 'bernhardt.com', 'category': 'Case Goods & Upholstery'},
    {'name': 'Bello Reps', 'url': 'belloreps.com', 'category': 'Rugs'},
    {'name': 'Visual Comfort', 'url': 'visualcomfort.com', 'category': 'Lighting'},
    {'name': 'Hudson Valley Lighting', 'url': 'hudsonvalleylighting.com', 'category': 'Lighting'},
    {'name': 'Arteriors', 'url': 'arteriors.com', 'category': 'Lighting & Accessories'},
    {'name': 'Riad', 'url': 'riad.com', 'category': 'Textiles'},
    {'name': 'Florescence', 'url': 'florescence.com', 'category': 'Lighting'},
    {'name': 'Crystal Corp', 'url': 'crystalcorp.com', 'category': 'Lighting'},
    {'name': 'Uttermost', 'url': 'uttermost.com', 'category': 'Accessories & Mirrors'},
    {'name': 'Currey & Company', 'url': 'curreyco.com', 'category': 'Lighting & Furniture'},
    {'name': 'Gabby Home', 'url': 'gabbyhome.com', 'category': 'Furniture & Decor'},
    {'name': 'Worlds Away', 'url': 'worldsaway.com', 'category': 'Furniture & Accessories'},
    {'name': 'Surya', 'url': 'surya.com', 'category': 'Rugs & Textiles'}
]

# FURNITURE CATEGORIES FOR QUICK SEARCH BUTTONS
FURNITURE_CATEGORIES = [
    'Seating',
    'Tables', 
    'Case Goods',
    'Lighting',
    'Textiles',
    'Rugs',
    'Accessories',
    'Mirrors',
    'Art',
    'Console Tables',
    'Dining Tables',
    'Coffee Tables',
    'Side Tables',
    'Sofas',
    'Chairs',
    'Bar Stools',
    'Ottomans',
    'Dressers',
    'Nightstands',
    'Bookcases',
    'Desks'
]

# Pydantic models for request validation
class HouzzWebhookData(BaseModel):
    productTitle: Optional[str] = None
    name: Optional[str] = None
    vendor: Optional[str] = None
    manufacturer: Optional[str] = None
    category: Optional[str] = None
    cost: Optional[float] = None
    msrp: Optional[float] = None
    sku: Optional[str] = None
    dimensions: Optional[str] = None
    finishColor: Optional[str] = None
    finish_color: Optional[str] = None
    materials: Optional[str] = None
    clientDescription: Optional[str] = None
    description: Optional[str] = None
    images: Optional[List[str]] = None
    productUrl: Optional[str] = None
    link: Optional[str] = None
    tags: Optional[str] = None
    internalNotes: Optional[str] = None

class AddToCatalogData(BaseModel):
    name: str
    vendor: Optional[str] = None
    manufacturer: Optional[str] = None
    category: Optional[str] = None
    subcategory: Optional[str] = None
    cost: Optional[float] = 0
    msrp: Optional[float] = 0
    sku: Optional[str] = None
    dimensions: Optional[str] = None
    finish_color: Optional[str] = None
    materials: Optional[str] = None
    description: Optional[str] = None
    image_url: Optional[str] = None
    images: Optional[List[str]] = None
    product_url: Optional[str] = None
    tags: Optional[List[str]] = None
    style: Optional[List[str]] = None
    room_type: Optional[List[str]] = None
    in_stock: Optional[bool] = True
    lead_time: Optional[str] = None
    notes: Optional[str] = None

class AddToProjectData(BaseModel):
    item_id: str
    project_id: str
    room_name: Optional[str] = "Living Room"

# WEBHOOK ENDPOINTS

@router.post("/houzz-webhook")
async def houzz_clipper_webhook(data: HouzzWebhookData, background_tasks: BackgroundTasks):
    """
    MAIN WEBHOOK ENDPOINT for Houzz Pro clipper
    
    This endpoint receives furniture data when items are clipped in Houzz Pro.
    It intercepts the data and saves it to our unified furniture catalog.
    """
    try:
        print("\n" + "="*80)
        print("🏠 HOUZZ PRO CLIPPER DATA INTERCEPTED!")
        print("="*80)
        print(f"Product: {data.productTitle or data.name}")
        print(f"Vendor: {data.vendor or data.manufacturer}")
        print(f"Cost: ${data.cost if data.cost else 'N/A'}")
        print(f"SKU: {data.sku or 'N/A'}")
        print(f"URL: {data.productUrl or data.link}")
        print("="*80 + "\n")
        
        # Transform Houzz data to our unified format
        furniture_item = {
            "id": str(uuid.uuid4()),
            "name": data.productTitle or data.name or "Unnamed Product",
            "vendor": data.vendor or data.manufacturer or "",
            "manufacturer": data.manufacturer or "",
            "category": data.category or "Furniture",
            "cost": float(data.cost) if data.cost else 0.0,
            "msrp": float(data.msrp) if data.msrp else 0.0,
            "sku": data.sku or "",
            "dimensions": data.dimensions or "",
            "finish_color": data.finishColor or data.finish_color or "",
            "materials": data.materials or "",
            "description": data.clientDescription or data.description or "",
            "image_url": (data.images[0] if data.images and len(data.images) > 0 else ""),
            "images": data.images or [],
            "product_url": data.productUrl or data.link or "",
            "tags": data.tags.split(',') if isinstance(data.tags, str) else [],
            "notes": data.internalNotes or "",
            "clipped_date": datetime.utcnow(),
            "updated_date": datetime.utcnow(),
            "times_used": 0,
            "source": "houzz_pro_clipper",
            "clipper_data": data.dict()  # Store original clipper data for reference
        }
        
        # Save to database
        result = await save_furniture_to_catalog(furniture_item)
        
        # Add to background processing queue for additional tasks
        background_tasks.add_task(process_new_furniture_item, furniture_item)
        
        return {
            "success": True, 
            "message": "Furniture intercepted and added to unified catalog",
            "item_id": result["item_id"],
            "action": result["action"]  # "added" or "updated"
        }
        
    except Exception as e:
        print(f"❌ Error in Houzz webhook: {e}")
        # Don't fail - let Houzz clipper continue working
        return {"success": False, "error": str(e), "message": "Error logged, clipper can continue"}


@router.post("/manual-webhook-test")
async def manual_webhook_test(data: dict):
    """Manual webhook test endpoint for development"""
    print("\n🧪 MANUAL WEBHOOK TEST:")
    print(json.dumps(data, indent=2))
    
    # Convert to HouzzWebhookData format and process
    houzz_data = HouzzWebhookData(**data)
    return await houzz_clipper_webhook(houzz_data, BackgroundTasks())


@router.post("/browser-extension-webhook") 
async def browser_extension_webhook(data: dict, background_tasks: BackgroundTasks):
    """
    Webhook for our custom browser extension
    
    This receives data from our own browser extension that clips furniture 
    from various furniture websites (not just Houzz)
    """
    try:
        print("\n" + "="*80)
        print("🌐 BROWSER EXTENSION CLIPPER DATA RECEIVED!")
        print("="*80)
        print(f"Product: {data.get('name')}")
        print(f"Website: {data.get('website')}")
        print(f"Cost: {data.get('price')}")
        print("="*80 + "\n")
        
        # Transform extension data to our format
        furniture_item = {
            "id": str(uuid.uuid4()),
            "name": data.get('name', 'Unnamed Product'),
            "vendor": data.get('vendor', data.get('website', '')),
            "manufacturer": data.get('brand', ''),
            "category": data.get('category', 'Furniture'),
            "cost": float(data.get('price', 0)) if data.get('price') else 0.0,
            "sku": data.get('sku', ''),
            "dimensions": data.get('dimensions', ''),
            "finish_color": data.get('color', ''),
            "materials": data.get('materials', ''),
            "description": data.get('description', ''),
            "image_url": data.get('image_url', ''),
            "images": data.get('images', []),
            "product_url": data.get('url', ''),
            "tags": data.get('tags', []),
            "notes": data.get('notes', ''),
            "clipped_date": datetime.utcnow(),
            "updated_date": datetime.utcnow(),
            "times_used": 0,
            "source": "browser_extension",
            "website": data.get('website', ''),
            "extension_data": data
        }
        
        result = await save_furniture_to_catalog(furniture_item)
        background_tasks.add_task(process_new_furniture_item, furniture_item)
        
        return {
            "success": True,
            "message": "Furniture clipped successfully",
            "item_id": result["item_id"],
            "action": result["action"]
        }
        
    except Exception as e:
        print(f"❌ Error in browser extension webhook: {e}")
        return {"success": False, "error": str(e)}


# CORE DATABASE OPERATIONS

async def save_furniture_to_catalog(furniture_item: dict) -> dict:
    """Save or update furniture item in catalog"""
    try:
        # Check for duplicates (by SKU or product URL)
        existing = None
        if furniture_item.get('sku'):
            existing = await db.furniture_catalog.find_one({"sku": furniture_item['sku']})
        if not existing and furniture_item.get('product_url'):
            existing = await db.furniture_catalog.find_one({"product_url": furniture_item['product_url']})
        
        if existing:
            # Update existing item
            furniture_item['id'] = existing['id']  # Keep original ID
            furniture_item['created_date'] = existing.get('created_date', existing.get('clipped_date'))
            await db.furniture_catalog.update_one(
                {"id": existing['id']},
                {"$set": furniture_item}
            )
            return {"item_id": existing['id'], "action": "updated"}
        else:
            # Add new item
            furniture_item['created_date'] = furniture_item['clipped_date']
            await db.furniture_catalog.insert_one(furniture_item)
            return {"item_id": furniture_item['id'], "action": "added"}
            
    except Exception as e:
        print(f"Error saving to catalog: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to save furniture: {e}")


async def process_new_furniture_item(furniture_item: dict):
    """Background task to process newly added furniture"""
    try:
        # Extract and save images if needed
        if furniture_item.get('image_url') and not furniture_item['image_url'].startswith('data:'):
            # Could download and convert to base64 here for local storage
            pass
        
        # Update search indexes, categories, etc.
        await update_catalog_metadata()
        
        print(f"✅ Processed furniture item: {furniture_item['name']}")
        
    except Exception as e:
        print(f"Error processing furniture item: {e}")


async def update_catalog_metadata():
    """Update catalog metadata for search optimization"""
    try:
        # This could update search indexes, category lists, etc.
        # For now, just log that it ran
        total_items = await db.furniture_catalog.count_documents({})
        print(f"📊 Catalog updated: {total_items} total items")
    except Exception as e:
        print(f"Error updating metadata: {e}")


# SEARCH AND RETRIEVAL ENDPOINTS

@router.get("/furniture-catalog/search")
async def search_furniture_catalog(
    query: str = "", 
    category: str = "", 
    vendor: str = "", 
    min_price: float = 0, 
    max_price: float = 999999,
    style: str = "", 
    room_type: str = "", 
    source: str = "",
    limit: int = 100
):
    """
    ENHANCED SEARCH: Search furniture catalog across ALL vendors
    
    Now supports searching by source (houzz_pro_clipper, browser_extension, etc.)
    """
    try:
        # Build search filter
        search_filter = {}
        
        # Text search on name, description, tags
        if query:
            search_filter["$or"] = [
                {"name": {"$regex": query, "$options": "i"}},
                {"description": {"$regex": query, "$options": "i"}},
                {"materials": {"$regex": query, "$options": "i"}},
                {"category": {"$regex": query, "$options": "i"}}
            ]
        
        # Filter by category
        if category:
            search_filter["category"] = {"$regex": category, "$options": "i"}
        
        # Filter by vendor
        if vendor:
            search_filter["vendor"] = {"$regex": vendor, "$options": "i"}
        
        # Price range filter
        if min_price > 0 or max_price < 999999:
            search_filter["cost"] = {"$gte": min_price, "$lte": max_price}
        
        # Style filter
        if style:
            search_filter["style"] = {"$regex": style, "$options": "i"}
        
        # Room type filter  
        if room_type:
            search_filter["room_type"] = {"$regex": room_type, "$options": "i"}
            
        # Source filter (houzz, extension, etc.)
        if source:
            search_filter["source"] = {"$regex": source, "$options": "i"}
        
        # Execute search with sorting (most recent first)
        cursor = db.furniture_catalog.find(search_filter).sort("clipped_date", -1).limit(limit)
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
                "price_range": f"${min_price}-${max_price}",
                "source": source
            }
        }
        
    except Exception as e:
        print(f"Error searching furniture catalog: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/furniture-catalog/categories")
async def get_furniture_categories():
    """Get all unique categories in catalog + standard furniture categories"""
    try:
        # Get categories from database
        db_categories = await db.furniture_catalog.distinct("category")
        
        # Combine with standard furniture categories
        all_categories = list(set(FURNITURE_CATEGORIES + [c for c in db_categories if c]))
        
        return {"success": True, "categories": sorted(all_categories)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/furniture-catalog/quick-categories")
async def get_quick_search_categories():
    """Get quick search categories for the buttons that weren't working"""
    try:
        return {
            "success": True, 
            "categories": FURNITURE_CATEGORIES,
            "description": "Quick search categories for instant filtering"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/furniture-catalog/trade-vendors")
async def get_trade_vendors():
    """Get your actual trade furniture vendors"""
    try:
        return {
            "success": True, 
            "vendors": TRADE_VENDORS,
            "description": "Your actual trade furniture vendor websites"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/furniture-catalog/vendors")
async def get_furniture_vendors():
    """Get all unique vendors in catalog + trade vendors"""
    try:
        # Get vendors from database
        db_vendors = await db.furniture_catalog.distinct("vendor")
        
        # Get trade vendor names
        trade_vendor_names = [v['name'] for v in TRADE_VENDORS]
        
        # Combine
        all_vendors = list(set(trade_vendor_names + [v for v in db_vendors if v]))
        
        return {"success": True, "vendors": sorted(all_vendors)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/furniture-catalog/stats")
async def get_catalog_stats():
    """Get comprehensive statistics about furniture catalog"""
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
        for vendor in vendors[:20]:  # Limit to top 20 vendors
            if vendor:
                count = await db.furniture_catalog.count_documents({"vendor": vendor})
                vendor_counts[vendor] = count
        
        # Count by source
        source_counts = {}
        sources = await db.furniture_catalog.distinct("source")
        for source in sources:
            if source:
                count = await db.furniture_catalog.count_documents({"source": source})
                source_counts[source] = count
        
        # Recent additions (last 7 days)
        seven_days_ago = datetime.utcnow().replace(day=max(1, datetime.utcnow().day-7))
        recent_count = await db.furniture_catalog.count_documents(
            {"clipped_date": {"$gte": seven_days_ago}}
        )
        
        return {
            "success": True,
            "total_items": total_items,
            "categories": category_counts,
            "vendors": vendor_counts,
            "sources": source_counts,
            "recent_additions": recent_count,
            "trade_vendors_configured": len(TRADE_VENDORS),
            "quick_categories_available": len(FURNITURE_CATEGORIES),
            "last_updated": datetime.utcnow().isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# PROJECT INTEGRATION ENDPOINTS

@router.post("/furniture-catalog/add-to-project")
async def add_catalog_item_to_project(data: AddToProjectData):
    """
    ENHANCED: Add furniture from catalog to project Checklist + prepare for Canva
    
    This is the "Add to Checklist" function from the unified search
    """
    try:
        # Get the furniture item from catalog
        furniture = await db.furniture_catalog.find_one({"id": data.item_id})
        if not furniture:
            raise HTTPException(status_code=404, detail="Furniture not found in catalog")
        
        # Get the project
        project = await db.projects.find_one({"id": data.project_id})
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")
        
        # Find or create room in Checklist
        room = None
        for r in project.get('rooms', []):
            if r['name'].lower() == data.room_name.lower() and r.get('sheet_type') == 'checklist':
                room = r
                break
        
        if not room:
            room = {
                "id": str(uuid.uuid4()),
                "name": data.room_name,
                "sheet_type": "checklist",
                "categories": []
            }
            await db.projects.update_one(
                {"id": data.project_id},
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
                {"id": data.project_id, "rooms.id": room['id']},
                {"$push": {"rooms.$.categories": category}}
            )
        
        # Create item for project checklist
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
            "quantity": 1,
            "catalog_item_id": data.item_id,  # Link back to catalog
            "added_from_catalog": True,
            "added_date": datetime.utcnow().isoformat()
        }
        
        # Add to project checklist
        await db.projects.update_one(
            {"id": data.project_id, "rooms.id": room['id']},
            {"$push": {"rooms.$[room].categories.$[cat].subcategories.0.items": new_item}},
            array_filters=[
                {"room.id": room['id']},
                {"cat.name": category_name}
            ]
        )
        
        # Increment usage counter in catalog
        await db.furniture_catalog.update_one(
            {"id": data.item_id},
            {"$inc": {"times_used": 1}}
        )
        
        # Prepare for Canva integration (will be implemented separately)
        canva_data = {
            "item_id": new_item['id'],
            "project_id": data.project_id,
            "furniture_data": furniture,
            "room_name": data.room_name
        }
        
        return {
            "success": True,
            "message": "Item added to Checklist successfully",
            "item_id": new_item['id'],
            "catalog_item_id": data.item_id,
            "room_name": data.room_name,
            "canva_ready": True,
            "canva_data": canva_data
        }
        
    except Exception as e:
        print(f"Error adding to project: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# UTILITY ENDPOINTS

@router.get("/furniture-catalog/item/{item_id}")
async def get_catalog_item(item_id: str):
    """Get detailed information about a specific catalog item"""
    try:
        item = await db.furniture_catalog.find_one({"id": item_id})
        if not item:
            raise HTTPException(status_code=404, detail="Item not found")
        
        item.pop('_id', None)
        return {"success": True, "item": item}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/furniture-catalog/item/{item_id}")
async def delete_catalog_item(item_id: str):
    """Delete an item from the furniture catalog"""
    try:
        result = await db.furniture_catalog.delete_one({"id": item_id})
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Item not found")
        
        return {"success": True, "message": "Item deleted from catalog"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/furniture-catalog/recent")
async def get_recent_items(limit: int = 20):
    """Get most recently clipped furniture items"""
    try:
        cursor = db.furniture_catalog.find({}).sort("clipped_date", -1).limit(limit)
        results = await cursor.to_list(length=limit)
        
        for item in results:
            item.pop('_id', None)
        
        return {"success": True, "items": results, "count": len(results)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# WEBHOOK STATUS AND TESTING

@router.get("/webhook-status")
async def webhook_status():
    """Get webhook system status and recent activity"""
    try:
        # Get recent webhook activity (last 24 hours)
        yesterday = datetime.utcnow().replace(day=max(1, datetime.utcnow().day-1))
        recent_items = await db.furniture_catalog.count_documents(
            {"clipped_date": {"$gte": yesterday}}
        )
        
        # Get total items by source
        total_houzz = await db.furniture_catalog.count_documents({"source": "houzz_pro_clipper"})
        total_extension = await db.furniture_catalog.count_documents({"source": "browser_extension"})
        
        return {
            "success": True,
            "webhook_active": True,
            "recent_24h": recent_items,
            "total_houzz_items": total_houzz,
            "total_extension_items": total_extension,
            "trade_vendors_configured": len(TRADE_VENDORS),
            "endpoints": {
                "houzz_webhook": "/api/furniture/houzz-webhook",
                "extension_webhook": "/api/furniture/browser-extension-webhook",
                "manual_test": "/api/furniture/manual-webhook-test"
            },
            "last_checked": datetime.utcnow().isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/start-houzz-clipper-bot")
async def start_houzz_clipper_bot(background_tasks: BackgroundTasks):
    """
    START HOUZZ PRO CLIPPER BOT
    
    This will use YOUR Houzz Pro clipper extension to automatically clip
    ALL products from ALL your trade vendor catalogs
    """
    try:
        print("\n" + "="*80)
        print("🤖 STARTING HOUZZ PRO CLIPPER BOT")
        print("="*80)
        
        # Run Houzz clipper bot in background
        background_tasks.add_task(run_houzz_clipper_bot_task)
        
        return {
            "success": True,
            "message": "Houzz Pro Clipper Bot started successfully",
            "status": "running",
            "description": "Bot is now using your Houzz Pro clipper to clip all vendor products",
            "vendors": [
                "Four Hands", "Regina Andrew", "Visual Comfort", 
                "Hudson Valley Lighting", "Global Views"
            ],
            "estimated_time": "2-3 hours for complete catalog clipping"
        }
        
    except Exception as e:
        print(f"❌ Error starting Houzz clipper bot: {e}")
        raise HTTPException(status_code=500, detail=str(e))


async def run_houzz_clipper_bot_task():
    """Background task to run Houzz clipper bot"""
    try:
        print("🤖 Starting Houzz Pro Clipper Bot background task...")
        
        # Import and run the clipper bot
        import sys
        import os
        sys.path.append(os.path.dirname(__file__))
        
        from houzz_clipper_bot import HouzzClipperBot
        
        bot = HouzzClipperBot()
        await bot.run_mass_houzz_clipping()
        
        print("✅ Houzz clipper bot task completed successfully")
        
    except Exception as e:
        print(f"❌ Houzz clipper bot task failed: {e}")


# MASS CATALOG SCRAPING ENDPOINTS

@router.post("/furniture-catalog/start-mass-scraping")
async def start_mass_scraping(background_tasks: BackgroundTasks, max_vendors: int = None):
    """
    START MASS SCRAPING OPERATION
    
    This will scrape ALL products from ALL your trade vendor websites
    and populate the furniture catalog database
    """
    try:
        from mass_catalog_scraper import MassCatalogScraper
        
        print("\n" + "="*80)
        print("🚀 STARTING MASS CATALOG SCRAPING OPERATION")
        print("="*80)
        
        # Run scraping in background
        background_tasks.add_task(run_mass_scraping_task, max_vendors)
        
        return {
            "success": True,
            "message": "Mass scraping operation started in background",
            "status": "running",
            "vendors_to_process": max_vendors or len(TRADE_VENDORS),
            "estimated_time": "30-60 minutes depending on catalog sizes"
        }
        
    except Exception as e:
        print(f"❌ Error starting mass scraping: {e}")
        raise HTTPException(status_code=500, detail=str(e))


async def run_mass_scraping_task(max_vendors: int = None):
    """Background task to run mass scraping"""
    try:
        from mass_catalog_scraper import MassCatalogScraper
        
        scraper = MassCatalogScraper()
        products = await scraper.run_mass_scraping(max_vendors)
        
        print(f"✅ Mass scraping complete: {len(products)} products scraped")
        
    except Exception as e:
        print(f"❌ Mass scraping task failed: {e}")


@router.get("/furniture-catalog/scraping-status")
async def get_scraping_status():
    """Get status of mass scraping operation"""
    try:
        # Get current catalog stats
        total_items = await db.furniture_catalog.count_documents({})
        
        # Get items by vendor
        vendor_counts = {}
        for vendor in TRADE_VENDORS:
            count = await db.furniture_catalog.count_documents({"vendor": vendor['name']})
            vendor_counts[vendor['name']] = count
        
        # Get recent scraping activity
        one_hour_ago = datetime.utcnow().replace(hour=datetime.utcnow().hour-1)
        recent_scraped = await db.furniture_catalog.count_documents({
            "scraped_date": {"$gte": one_hour_ago},
            "source": "mass_catalog_scraper"
        })
        
        return {
            "success": True,
            "total_products_in_catalog": total_items,
            "vendor_breakdown": vendor_counts,
            "recent_scraped_1h": recent_scraped,
            "configured_vendors": len(TRADE_VENDORS),
            "scraping_sources": ["mass_catalog_scraper", "houzz_pro_clipper", "browser_extension"]
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# CANVA INTEGRATION PREPARATION

@router.post("/furniture-catalog/prepare-canva-board")
async def prepare_canva_board(project_id: str, room_name: str):
    """
    Prepare data for Canva board creation with selected furniture
    
    This will be enhanced once Canva API integration is complete
    """
    try:
        # Get project
        project = await db.projects.find_one({"id": project_id})
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")
        
        # Find room and collect furniture items
        furniture_items = []
        for room in project.get('rooms', []):
            if room['name'].lower() == room_name.lower() and room.get('sheet_type') == 'checklist':
                for category in room.get('categories', []):
                    for subcategory in category.get('subcategories', []):
                        for item in subcategory.get('items', []):
                            if item.get('catalog_item_id'):
                                # Get full catalog data
                                catalog_item = await db.furniture_catalog.find_one(
                                    {"id": item['catalog_item_id']}
                                )
                                if catalog_item:
                                    furniture_items.append({
                                        "checklist_item": item,
                                        "catalog_data": catalog_item
                                    })
        
        return {
            "success": True,
            "project_id": project_id,
            "room_name": room_name,
            "furniture_count": len(furniture_items),
            "furniture_items": furniture_items,
            "canva_ready": True,
            "message": "Data prepared for Canva board creation"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
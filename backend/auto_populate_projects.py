#!/usr/bin/env python3
"""
AUTO-POPULATE PROJECTS ON STARTUP
==================================
This script runs on backend startup to ensure test projects ALWAYS exist
with fully populated rooms and items
"""

import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime, timezone
import uuid
from enhanced_rooms import COMPREHENSIVE_ROOM_STRUCTURE

async def create_full_room_with_items(db, project_id, room_name, color="#8B7355"):
    """Create a room with full item population using the comprehensive structure"""
    try:
        room_id = str(uuid.uuid4())
        room_name_lower = room_name.lower().strip()
        
        # Map room names to structure keys
        room_mapping = {
            "kitchen": "kitchen",
            "living room": "living room",
            "primary bedroom": "primary bedroom",
            "primary bathroom": "primary bathroom",
            "master bedroom": "primary bedroom",
            "master bathroom": "primary bathroom"
        }
        
        structure_key = room_mapping.get(room_name_lower, "living room")
        room_structure = COMPREHENSIVE_ROOM_STRUCTURE.get(structure_key, {})
        
        # Create room document
        room_doc = {
            "id": room_id,
            "project_id": project_id,
            "name": room_name,
            "color": color,
            "sheet_type": "walkthrough",
            "created_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc)
        }
        
        await db.rooms.insert_one(room_doc)
        
        # Create categories, subcategories, and items
        item_count = 0
        for category_obj in room_structure.get("categories", []):
            category_id = str(uuid.uuid4())
            category_doc = {
                "id": category_id,
                "room_id": room_id,
                "name": category_obj["name"],
                "description": "",
                "order_index": 0,
                "color": category_obj.get("color", "#8B7355"),
                "created_at": datetime.now(timezone.utc),
                "updated_at": datetime.now(timezone.utc)
            }
            await db.categories.insert_one(category_doc)
            
            # Create subcategories and items
            for subcat_obj in category_obj.get("subcategories", []):
                subcat_id = str(uuid.uuid4())
                subcat_doc = {
                    "id": subcat_id,
                    "category_id": category_id,
                    "name": subcat_obj["name"],
                    "description": "",
                    "order_index": 0,
                    "created_at": datetime.now(timezone.utc),
                    "updated_at": datetime.now(timezone.utc)
                }
                await db.subcategories.insert_one(subcat_doc)
                
                # Create items
                for item_obj in subcat_obj.get("items", []):
                    item_id = str(uuid.uuid4())
                    item_doc = {
                        "id": item_id,
                        "subcategory_id": subcat_id,
                        "category_id": category_id,
                        "name": item_obj["name"],
                        "quantity": item_obj.get("quantity", 1),
                        "size": item_obj.get("size", ""),
                        "finish_color": item_obj.get("finish_color", ""),
                        "price": item_obj.get("price", 0.0),
                        "cost": item_obj.get("cost", 0.0),
                        "vendor": item_obj.get("vendor", ""),
                        "status": item_obj.get("status", "Needs Selection"),
                        "sku": "",
                        "remarks": "",
                        "link": "",
                        "tracking_number": "",
                        "image_url": "",
                        "created_at": datetime.now(timezone.utc),
                        "updated_at": datetime.now(timezone.utc)
                    }
                    await db.items.insert_one(item_doc)
                    item_count += 1
        
        print(f"  ✅ Created room '{room_name}' with {item_count} items")
        return room_id
        
    except Exception as e:
        print(f"  ❌ Error creating room '{room_name}': {e}")
        return None

async def ensure_test_projects_exist():
    """Create test projects if they don't exist"""
    
    mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
    db_name = os.environ.get('DB_NAME', 'interior_design_db')
    
    client = AsyncIOMotorClient(mongo_url)
    db = client[db_name]
    
    print("🔍 AUTO-POPULATE: Checking for existing projects...")
    
    # Check if we have any projects with rooms that have items
    project_count = await db.projects.count_documents({})
    item_count = await db.items.count_documents({})
    
    if project_count >= 3 and item_count > 100:
        print(f"✅ Found {project_count} projects with {item_count} items - skipping auto-population")
        client.close()
        return
    
    print(f"⚠️  Only {project_count} projects with {item_count} items - creating test projects...")
    
    # Define test projects to create
    test_projects = [
        {
            "name": "Modern Kitchen Design",
            "client_info": {
                "full_name": "Sarah Designer",
                "email": "info@estdesignco.com",
                "phone": "615-555-1234",
                "address": "123 Design Street, Nashville, TN"
            },
            "rooms": [{"name": "Kitchen", "color": "#7B6755"}]
        },
        {
            "name": "Luxury Master Suite",
            "client_info": {
                "full_name": "John & Mary Smith",
                "email": "smiths@example.com",
                "phone": "615-555-5678",
                "address": "456 Home Avenue, Nashville, TN"
            },
            "rooms": [
                {"name": "Primary Bedroom", "color": "#6B5745"},
                {"name": "Primary Bathroom", "color": "#9B8365"}
            ]
        },
        {
            "name": "Designer Living Room",
            "client_info": {
                "full_name": "Emily Johnson",
                "email": "emily@example.com",
                "phone": "615-555-9999",
                "address": "789 Living Boulevard, Nashville, TN"
            },
            "rooms": [{"name": "Living Room", "color": "#8B7355"}]
        }
    ]
    
    created_count = 0
    
    for project_data in test_projects:
        try:
            # Check if project with this name already exists
            existing = await db.projects.find_one({"name": project_data["name"]})
            if existing:
                # Check if it has items
                existing_rooms = await db.rooms.find({"project_id": existing["id"]}).to_list(10)
                if existing_rooms:
                    room_ids = [r["id"] for r in existing_rooms]
                    cat_count = await db.categories.count_documents({"room_id": {"$in": room_ids}})
                    if cat_count > 0:
                        print(f"✓ Project '{project_data['name']}' already exists with data")
                        continue
            
            # Delete existing incomplete project if any
            if existing:
                await db.projects.delete_one({"id": existing["id"]})
                print(f"🗑️  Removed incomplete project '{project_data['name']}'")
            
            # Create project
            project_id = str(uuid.uuid4())
            project_doc = {
                "id": project_id,
                "name": project_data["name"],
                "client_info": project_data["client_info"],
                "timeline": "",
                "budget": "",
                "status": "active",
                "created_at": datetime.now(timezone.utc),
                "updated_at": datetime.now(timezone.utc)
            }
            
            await db.projects.insert_one(project_doc)
            print(f"✅ Created project: {project_data['name']} (ID: {project_id[:8]}...)")
            
            # Create rooms with full item population
            for room_info in project_data["rooms"]:
                await create_full_room_with_items(
                    db, 
                    project_id, 
                    room_info["name"], 
                    room_info.get("color", "#8B7355")
                )
            
            created_count += 1
            
        except Exception as e:
            print(f"❌ Error creating project '{project_data['name']}': {e}")
    
    final_count = await db.projects.count_documents({})
    final_items = await db.items.count_documents({})
    
    if created_count > 0:
        print(f"\n🎉 AUTO-POPULATE COMPLETE!")
        print(f"   Total projects: {final_count}")
        print(f"   Total items: {final_items}")
        print(f"   Projects are ready to use!")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(ensure_test_projects_exist())

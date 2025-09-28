#!/usr/bin/env python3
import asyncio
import motor.motor_asyncio
import os
from datetime import datetime
import uuid

# Database connection
MONG_URL = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
client = motor.motor_asyncio.AsyncIOMotorClient(MONG_URL)
db = client.test_database

async def populate_walkthrough_data():
    """Add walkthrough, checklist, and FFE data to existing projects"""
    
    # Get all projects
    projects = await db.projects.find().to_list(1000)
    print(f"Found {len(projects)} projects to populate")
    
    for project in projects:
        project_id = project['id']
        project_name = project['name']
        print(f"\nPopulating project: {project_name} ({project_id})")
        
        # Create sample rooms for walkthrough
        sample_rooms = [
            {
                "id": str(uuid.uuid4()),
                "project_id": project_id,
                "name": "Living Room",
                "sheet_type": "walkthrough",
                "order_index": 1,
                "created_at": datetime.now(),
                "updated_at": datetime.now()
            },
            {
                "id": str(uuid.uuid4()),
                "project_id": project_id,
                "name": "Kitchen",
                "sheet_type": "walkthrough",
                "order_index": 2,
                "created_at": datetime.now(),
                "updated_at": datetime.now()
            },
            {
                "id": str(uuid.uuid4()),
                "project_id": project_id,
                "name": "Master Bedroom",
                "sheet_type": "walkthrough",
                "order_index": 3,
                "created_at": datetime.now(),
                "updated_at": datetime.now()
            }
        ]
        
        # Insert rooms
        for room in sample_rooms:
            existing_room = await db.rooms.find_one({"project_id": project_id, "name": room["name"], "sheet_type": "walkthrough"})
            if not existing_room:
                await db.rooms.insert_one(room)
                print(f"  Added room: {room['name']}")
                
                # Add sample categories for each room
                sample_categories = [
                    {
                        "id": str(uuid.uuid4()),
                        "room_id": room["id"],
                        "name": "Furniture",
                        "order_index": 1,
                        "created_at": datetime.now(),
                        "updated_at": datetime.now()
                    },
                    {
                        "id": str(uuid.uuid4()),
                        "room_id": room["id"],
                        "name": "Lighting",
                        "order_index": 2,
                        "created_at": datetime.now(),
                        "updated_at": datetime.now()
                    },
                    {
                        "id": str(uuid.uuid4()),
                        "room_id": room["id"],
                        "name": "Decor",
                        "order_index": 3,
                        "created_at": datetime.now(),
                        "updated_at": datetime.now()
                    }
                ]
                
                # Insert categories
                for category in sample_categories:
                    await db.categories.insert_one(category)
                    print(f"    Added category: {category['name']}")
                    
                    # Add sample items for each category
                    sample_items = [
                        {
                            "id": str(uuid.uuid4()),
                            "category_id": category["id"],
                            "name": f"{category['name']} Item 1",
                            "status": "pending",
                            "order_index": 1,
                            "created_at": datetime.now(),
                            "updated_at": datetime.now()
                        },
                        {
                            "id": str(uuid.uuid4()),
                            "category_id": category["id"],
                            "name": f"{category['name']} Item 2",
                            "status": "pending",
                            "order_index": 2,
                            "created_at": datetime.now(),
                            "updated_at": datetime.now()
                        }
                    ]
                    
                    # Insert subcategories (items)
                    for item in sample_items:
                        await db.subcategories.insert_one(item)
                        print(f"      Added item: {item['name']}")
            else:
                print(f"  Room {room['name']} already exists")
        
        # Also create checklist and FFE versions
        for sheet_type in ["checklist", "ffe"]:
            for room in sample_rooms:
                room_copy = room.copy()
                room_copy["id"] = str(uuid.uuid4())
                room_copy["sheet_type"] = sheet_type
                
                existing_room = await db.rooms.find_one({"project_id": project_id, "name": room["name"], "sheet_type": sheet_type})
                if not existing_room:
                    await db.rooms.insert_one(room_copy)
                    print(f"  Added {sheet_type} room: {room_copy['name']}")
    
    print("\n✅ Finished populating walkthrough data!")

if __name__ == "__main__":
    asyncio.run(populate_walkthrough_data())
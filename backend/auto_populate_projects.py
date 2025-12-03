#!/usr/bin/env python3
"""
AUTO-POPULATE PROJECTS ON STARTUP
==================================
This script runs on backend startup to ensure test projects always exist
"""

import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime
import uuid

async def ensure_test_projects_exist():
    """Create test projects if they don't exist"""
    
    mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
    db_name = os.environ.get('DB_NAME', 'interior_design_db')
    
    client = AsyncIOMotorClient(mongo_url)
    db = client[db_name]
    
    print("🔍 Checking for existing projects...")
    
    # Check if we have any projects
    project_count = await db.projects.count_documents({})
    
    if project_count >= 3:
        print(f"✅ Found {project_count} existing projects - skipping auto-population")
        client.close()
        return
    
    print(f"⚠️  Only {project_count} projects found - creating test projects...")
    
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
            "rooms": ["Kitchen"]
        },
        {
            "name": "Luxury Master Suite",
            "client_info": {
                "full_name": "John & Mary Smith",
                "email": "smiths@example.com",
                "phone": "615-555-5678",
                "address": "456 Home Avenue, Nashville, TN"
            },
            "rooms": ["Primary Bedroom", "Primary Bathroom"]
        },
        {
            "name": "Designer Living Room",
            "client_info": {
                "full_name": "Emily Johnson",
                "email": "emily@example.com",
                "phone": "615-555-9999",
                "address": "789 Living Boulevard, Nashville, TN"
            },
            "rooms": ["Living Room"]
        }
    ]
    
    created_count = 0
    
    for project_data in test_projects:
        try:
            # Check if project with this name already exists
            existing = await db.projects.find_one({"name": project_data["name"]})
            if existing:
                print(f"✓ Project '{project_data['name']}' already exists")
                continue
            
            # Create project
            project_id = str(uuid.uuid4())
            project_doc = {
                "id": project_id,
                "name": project_data["name"],
                "client_info": project_data["client_info"],
                "timeline": "",
                "budget": "",
                "status": "active",
                "created_at": datetime.now(),
                "updated_at": datetime.now()
            }
            
            await db.projects.insert_one(project_doc)
            print(f"✅ Created project: {project_data['name']} (ID: {project_id})")
            
            # Create rooms for this project
            for room_name in project_data["rooms"]:
                room_id = str(uuid.uuid4())
                room_doc = {
                    "id": room_id,
                    "project_id": project_id,
                    "name": room_name,
                    "color": "#8B7355",
                    "sheet_type": "walkthrough",
                    "created_at": datetime.now(),
                    "updated_at": datetime.now()
                }
                
                await db.rooms.insert_one(room_doc)
                print(f"  ✅ Created room: {room_name}")
            
            created_count += 1
            
        except Exception as e:
            print(f"❌ Error creating project '{project_data['name']}': {e}")
    
    if created_count > 0:
        print(f"\n🎉 Successfully created {created_count} test projects!")
        print("Projects will now auto-populate with items via room creation API")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(ensure_test_projects_exist())

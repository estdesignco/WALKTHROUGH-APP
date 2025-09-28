#!/usr/bin/env python3
import asyncio
import motor.motor_asyncio
import os
import uuid

# Database connection
MONG_URL = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
client = motor.motor_asyncio.AsyncIOMotorClient(MONG_URL)
db = client.test_database

async def add_project_ids():
    """Add UUID ids to existing projects"""
    
    # Get all projects
    projects = await db.projects.find().to_list(1000)
    print(f"Found {len(projects)} projects to update")
    
    for project in projects:
        if 'id' not in project:
            # Add UUID id
            new_id = str(uuid.uuid4())
            await db.projects.update_one(
                {"_id": project["_id"]},
                {"$set": {"id": new_id}}
            )
            print(f"Added ID {new_id} to project: {project['name']}")
        else:
            print(f"Project {project['name']} already has ID: {project['id']}")
    
    print("\n✅ Finished adding project IDs!")

if __name__ == "__main__":
    asyncio.run(add_project_ids())
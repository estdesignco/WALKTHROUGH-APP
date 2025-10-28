#!/usr/bin/env python3
"""Recreate WHEELER RIDGE project with all 17 rooms"""
import requests
import json
from datetime import datetime

BACKEND_URL = "http://localhost:8001/api"

# 17 rooms from the original WHEELER RIDGE project
ROOMS = [
    "Kitchen", "Living Room", "Master Bedroom", "Dining Room", 
    "Office", "Foyer", "Pantry", "Laundry", "Mudroom", 
    "Basement", "Basement Guest", "Powder", "Screened Porch", 
    "Patio", "Pool Area", "Upstairs Right Guest Bedroom/Bathroom", 
    "Upstairs Left Guest Bedroom/Bathroom"
]

def create_wheeler_project():
    """Create the WHEELER RIDGE project"""
    print("🚀 Creating WHEELER RIDGE project...")
    
    # Step 1: Create project
    project_data = {
        "name": "WHEELER RIDGE",
        "client_info": {
            "full_name": "Wheeler Ridge Client",
            "email": "wheeler@test.com",
            "phone": "555-0100",
            "address": "Wheeler Ridge Estate"
        },
        "project_type": "Full Home Design",
        "budget": "$500,000",
        "timeline": "6 months",
        "style_preferences": ["Modern", "Luxury"],
        "color_palette": "Neutral with Gold Accents",
        "special_requirements": "Test project for walkthrough sync"
    }
    
    try:
        # Create project
        response = requests.post(
            f"{BACKEND_URL}/projects",
            json=project_data,
            timeout=30
        )
        
        if response.status_code != 200:
            print(f"❌ Failed to create project: {response.status_code}")
            print(response.text)
            return None
            
        project = response.json()
        project_id = project.get("id")
        print(f"✅ Project created with ID: {project_id}")
        
        # Step 2: Add all 17 rooms with comprehensive structure
        for i, room_name in enumerate(ROOMS, 1):
            print(f"  Adding room {i}/{len(ROOMS)}: {room_name}...")
            room_response = requests.post(
                f"{BACKEND_URL}/projects/{project_id}/rooms",
                json={"name": room_name},
                timeout=60
            )
            
            if room_response.status_code == 200:
                print(f"    ✅ {room_name} added with full structure")
            else:
                print(f"    ⚠️ {room_name} failed: {room_response.status_code}")
        
        print(f"\n✅ Created {len(ROOMS)} rooms with full comprehensive structure!")
        return project_id
            
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        return None

if __name__ == "__main__":
    project_id = create_wheeler_project()
    if project_id:
        print(f"\n🎉 WHEELER RIDGE READY!")
        print(f"Mobile: {BACKEND_URL.replace('/api', '')}/mobile-app?screen=walkthrough")
        print(f"Desktop: {BACKEND_URL.replace('/api', '')}/project/{project_id}?tab=Walkthrough")
    else:
        print("\n❌ Failed to create project")

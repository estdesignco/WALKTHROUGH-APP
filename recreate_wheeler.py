#!/usr/bin/env python3
"""Recreate WHEELER RIDGE project with all 17 rooms"""
import requests
import json
from datetime import datetime

BACKEND_URL = "https://designflow-hub-1.preview.emergentagent.com/api"

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
    
    # Create project via questionnaire endpoint
    questionnaire_data = {
        "client_name": "WHEELER RIDGE",
        "client_email": "wheeler@test.com",
        "project_address": "Wheeler Ridge Estate",
        "project_type": "Full Home Design",
        "budget": "$500,000",
        "timeline": "6 months",
        "style_preferences": "Modern Luxury",
        "rooms": ROOMS
    }
    
    try:
        response = requests.post(
            f"{BACKEND_URL}/submit-questionnaire",
            json=questionnaire_data,
            timeout=60
        )
        
        if response.status_code == 200:
            data = response.json()
            project_id = data.get("project_id")
            print(f"✅ Project created with ID: {project_id}")
            print(f"✅ Created {len(ROOMS)} rooms")
            return project_id
        else:
            print(f"❌ Failed: {response.status_code}")
            print(response.text)
            return None
            
    except Exception as e:
        print(f"❌ Error: {e}")
        return None

if __name__ == "__main__":
    project_id = create_wheeler_project()
    if project_id:
        print(f"\n🎉 WHEELER RIDGE READY!")
        print(f"Mobile: {BACKEND_URL.replace('/api', '')}/mobile-app?screen=walkthrough")
        print(f"Desktop: {BACKEND_URL.replace('/api', '')}/project/{project_id}?tab=Walkthrough")
    else:
        print("\n❌ Failed to create project")

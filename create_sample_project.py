#!/usr/bin/env python3
"""
Create a sample project for testing FF&E functionality
"""

import requests
import json
import uuid

# Get backend URL from frontend .env file
def get_backend_url():
    try:
        with open('/app/frontend/.env', 'r') as f:
            for line in f:
                if line.startswith('REACT_APP_BACKEND_URL='):
                    return line.split('=', 1)[1].strip()
    except Exception as e:
        print(f"Error reading frontend .env: {e}")
        return "http://localhost:8001"
    return "http://localhost:8001"

BASE_URL = get_backend_url() + "/api"

def create_sample_project():
    """Create a sample project with client info"""
    
    project_data = {
        "name": "Greene Renovation",
        "client_info": {
            "full_name": "John and Jane Greene",
            "email": "john.greene@email.com",
            "phone": "(555) 123-4567",
            "address": "123 Main Street, Anytown, ST 12345"
        },
        "project_type": "Renovation",
        "timeline": "6 months",
        "budget": "$150,000",
        "style_preferences": ["Modern", "Transitional"],
        "color_palette": "Neutral with blue accents",
        "special_requirements": "Pet-friendly materials"
    }
    
    try:
        response = requests.post(f"{BASE_URL}/projects", json=project_data)
        
        if response.status_code == 200 or response.status_code == 201:
            project = response.json()
            project_id = project.get('id')
            print(f"✅ Created sample project: {project.get('name')}")
            print(f"   Project ID: {project_id}")
            return project_id
        else:
            print(f"❌ Failed to create project: {response.status_code}")
            print(f"   Response: {response.text}")
            return None
            
    except Exception as e:
        print(f"❌ Error creating project: {e}")
        return None

def add_sample_rooms(project_id):
    """Add sample rooms to the project"""
    
    rooms_to_create = [
        {"name": "Living Room", "description": "Main living area"},
        {"name": "Kitchen", "description": "Kitchen with island"},
        {"name": "Primary Bedroom", "description": "Master bedroom suite"}
    ]
    
    created_rooms = []
    
    for room_data in rooms_to_create:
        room_data["project_id"] = project_id
        room_data["order_index"] = len(created_rooms)
        
        try:
            response = requests.post(f"{BASE_URL}/rooms", json=room_data)
            
            if response.status_code == 200 or response.status_code == 201:
                room = response.json()
                created_rooms.append(room)
                print(f"✅ Created room: {room.get('name')} (ID: {room.get('id')})")
                
                # Count items in the room
                categories = room.get('categories', [])
                total_items = 0
                for category in categories:
                    for subcategory in category.get('subcategories', []):
                        total_items += len(subcategory.get('items', []))
                
                print(f"   Auto-populated with {len(categories)} categories, {total_items} items")
            else:
                print(f"❌ Failed to create room {room_data['name']}: {response.status_code}")
                print(f"   Response: {response.text}")
                
        except Exception as e:
            print(f"❌ Error creating room {room_data['name']}: {e}")
    
    return created_rooms

def add_sample_items(project_id):
    """Add some sample items to test the system"""
    
    # First get the project to find subcategories
    try:
        response = requests.get(f"{BASE_URL}/projects/{project_id}")
        if response.status_code != 200:
            print(f"❌ Could not retrieve project for adding items")
            return []
            
        project = response.json()
        
        # Find a lighting subcategory to add items to
        subcategory_id = None
        for room in project.get('rooms', []):
            for category in room.get('categories', []):
                if 'lighting' in category.get('name', '').lower():
                    for subcategory in category.get('subcategories', []):
                        if 'installed' in subcategory.get('name', '').lower():
                            subcategory_id = subcategory.get('id')
                            break
                if subcategory_id:
                    break
            if subcategory_id:
                break
        
        if not subcategory_id:
            print("❌ Could not find suitable subcategory for sample items")
            return []
        
        # Create sample items
        sample_items = [
            {
                "name": "Crystal Chandelier",
                "quantity": 1,
                "size": "36\" diameter",
                "remarks": "For dining room",
                "vendor": "Restoration Hardware",
                "status": "DELIVERED TO JOB SITE",
                "cost": 2500.00,
                "link": "https://rh.com/catalog/product/product.jsp?productId=prod123",
                "subcategory_id": subcategory_id
            },
            {
                "name": "LED Recessed Lights",
                "quantity": 8,
                "size": "6\" diameter",
                "remarks": "Dimmable LED",
                "vendor": "Visual Comfort",
                "status": "ORDERED",
                "cost": 150.00,
                "link": "https://visualcomfort.com/led-recessed",
                "subcategory_id": subcategory_id
            }
        ]
        
        created_items = []
        for item_data in sample_items:
            try:
                response = requests.post(f"{BASE_URL}/items", json=item_data)
                
                if response.status_code == 200 or response.status_code == 201:
                    item = response.json()
                    created_items.append(item)
                    print(f"✅ Created item: {item.get('name')} (Status: {item.get('status')})")
                else:
                    print(f"❌ Failed to create item {item_data['name']}: {response.status_code}")
                    print(f"   Response: {response.text}")
                    
            except Exception as e:
                print(f"❌ Error creating item {item_data['name']}: {e}")
        
        return created_items
        
    except Exception as e:
        print(f"❌ Error adding sample items: {e}")
        return []

if __name__ == "__main__":
    print("🚀 Creating Sample Project for FF&E Testing")
    print("=" * 50)
    
    # Create project
    project_id = create_sample_project()
    
    if project_id:
        print(f"\n📁 Adding sample rooms to project {project_id}...")
        rooms = add_sample_rooms(project_id)
        
        print(f"\n📦 Adding sample items to project {project_id}...")
        items = add_sample_items(project_id)
        
        print(f"\n🎉 Sample project setup complete!")
        print(f"   Project ID: {project_id}")
        print(f"   Rooms created: {len(rooms)}")
        print(f"   Items created: {len(items)}")
        print(f"\n🔗 You can now test with this project ID: {project_id}")
    else:
        print("❌ Failed to create sample project")
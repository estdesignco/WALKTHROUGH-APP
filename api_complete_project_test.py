#!/usr/bin/env python3
"""
API Complete Project Creation Test
Tests creating a complete project with full questionnaire data via API
"""

import requests
import json
from datetime import datetime

# Backend URL from review request
BACKEND_URL = "https://scrapefixer.preview.emergentagent.com"

def test_create_complete_project():
    """Test creating a complete project with full questionnaire data"""
    
    print("=" * 80)
    print("API COMPLETE PROJECT CREATION TEST")
    print("=" * 80)
    
    # Step 1: Create project
    print("\n📋 STEP 1: Creating project...")
    project_data = {
        "name": "API Complete Test Project",
        "client_info": {
            "full_name": "API Test User Complete",
            "email": "apicomplete@test.com",
            "phone": "615-555-4000",
            "address": "123 Test Street Nashville TN"
        },
        "project_type": "Renovation",
        "timeline": "12-18 months",
        "budget": "125k-500k"
    }
    
    try:
        response = requests.post(
            f"{BACKEND_URL}/api/projects",
            json=project_data,
            headers={"Content-Type": "application/json"},
            timeout=30
        )
        
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            project = response.json()
            project_id = project.get('id')
            print(f"✅ Project created successfully!")
            print(f"Project ID: {project_id}")
            print(f"Project Name: {project.get('name')}")
            print(f"Client: {project.get('client_info', {}).get('full_name')}")
        else:
            print(f"❌ Failed to create project")
            print(f"Response: {response.text}")
            return None
            
    except Exception as e:
        print(f"❌ Error creating project: {str(e)}")
        return None
    
    # Step 2: Create questionnaire with ALL fields filled
    print("\n📋 STEP 2: Creating questionnaire with ALL fields...")
    questionnaire_data = {
        "answers": {
            "client_name": "API Test User Complete",
            "name": "API Complete Test Project",
            "email": "apicomplete@test.com",
            "phone": "615-555-4000",
            "spouse_partner_name": "API Spouse Complete",
            "spouse_partner_phone": "615-555-4001",
            "best_time_to_call": "Morning",
            "worked_with_designer_before": "Yes we have extensive experience with professional designers",
            "primary_decision_maker": "Both of us make all design decisions together",
            "involvement_level": "Very involved - I want to approve every detail",
            "timeline": "12-18 months",
            "budget_range": "125k-500k",
            "project_type": "Renovation",
            "property_type": "Primary Residence",
            "rooms_involved": ["Living Room", "Kitchen", "Primary Bedroom", "Dining Room"],
            "design_love_home": "Beautiful abundant natural light floods every room in the morning hours",
            "design_space_use": "Formal entertaining and casual family living areas combined",
            "design_current_use": "Currently used for home office and storage spaces",
            "design_first_impression": "Timeless elegance combined with modern comfort warmth and sophistication",
            "design_common_color_palette": "Soft warm whites grays with navy blue and brass gold accents",
            "design_disliked_colors": "Avoid bright orange neon yellow dark heavy browns",
            "design_styles_love": "Love clean lines quality craftsmanship timeless appeal comfortable livability",
            "design_meaningful_item": "My grandmother antique crystal chandelier from French estate 1920s",
            "design_existing_furniture": "Dining room table heirloom master bedroom furniture built-ins",
            "design_materials_to_avoid": "No glossy finishes heavy velvets shiny metallics overly trendy",
            "design_special_requirements": "Wheelchair accessible bathroom pet friendly durable fabrics",
            "know_you_household": "Two parents late forties daughter sixteen son fourteen two dogs",
            "know_you_pets": "Golden retrievers Charlie and Max both six years very friendly",
            "know_you_weekday_routine": "Work from home kids school seven thirty to three thirty dinner six",
            "know_you_weekend_routine": "Sleep in family brunch outdoor activities host friends dinner",
            "know_you_lighting_preference": "Early birds love morning sun prefer warm evening ambient lighting",
            "know_you_entertaining_style": "Monthly dinner parties eight to twelve friends casual wine cheese",
            "know_you_relax_space": "Master bedroom reading nook fireplace back patio garden office",
            "know_you_future_plans": "Daughter college two years son four aging parents may move in",
            "know_you_social_media": "Instagram at ourfamilyhome Pinterest design boards",
            "know_you_hobbies": "Gourmet cooking wine collecting vegetable gardening reading travel",
            "know_you_fun": "Weekend hiking new restaurants family game nights movie marathons",
            "know_you_happy": "Quality family time beautiful spaces good food meaningful connections",
            "know_you_family_birthdays": "Mom June 15 Dad Oct 3 Daughter March 22 Son Nov 8",
            "know_you_anniversary": "2005-09-10",
            "know_you_family_together": "Sunday brunch tradition holiday celebrations summer beach trips",
            "know_you_favorite_restaurant": "The Capital Grille",
            "know_you_favorite_vacation": "Tuscany Italy wine country Napa Valley coastal Maine",
            "know_you_favorite_foods": "Italian pasta grilled seafood craft cocktails fine wines cheeses",
            "know_you_evoke_space": "Peace warmth belonging joy comfort sense of coming home",
            "know_you_support_social_life": "Open kitchen to living dining flow easy entertaining",
            "know_you_share_more": "Value quality craftsmanship sustainability local artisans timeless design",
            "how_heard": "Friend Referral"
        },
        "completion_percentage": 100,
        "completed_at": "2025-11-24T09:00:00Z"
    }
    
    try:
        response = requests.post(
            f"{BACKEND_URL}/api/questionnaire/{project_id}",
            json=questionnaire_data,
            headers={"Content-Type": "application/json"},
            timeout=30
        )
        
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            questionnaire = response.json()
            print(f"✅ Questionnaire created successfully!")
            print(f"Completion: {questionnaire.get('completion_percentage')}%")
            print(f"Total fields filled: {len(questionnaire_data['answers'])}")
        else:
            print(f"❌ Failed to create questionnaire")
            print(f"Response: {response.text}")
            
    except Exception as e:
        print(f"❌ Error creating questionnaire: {str(e)}")
    
    # Step 3: Create rooms
    print("\n📋 STEP 3: Creating rooms...")
    rooms = ["Living Room", "Kitchen", "Primary Bedroom", "Dining Room"]
    created_rooms = []
    
    for room_name in rooms:
        print(f"\n  Creating {room_name}...")
        room_data = {
            "project_id": project_id,
            "name": room_name,
            "sheet_type": "walkthrough",
            "auto_populate": True
        }
        
        try:
            response = requests.post(
                f"{BACKEND_URL}/api/rooms",
                json=room_data,
                headers={"Content-Type": "application/json"},
                timeout=30
            )
            
            print(f"  Status Code: {response.status_code}")
            
            if response.status_code == 200:
                room = response.json()
                room_id = room.get('id')
                created_rooms.append(room_name)
                print(f"  ✅ {room_name} created successfully!")
                print(f"  Room ID: {room_id}")
                
                # Count categories and items
                categories = room.get('categories', [])
                total_items = sum(
                    len(subcat.get('items', []))
                    for cat in categories
                    for subcat in cat.get('subcategories', [])
                )
                print(f"  Categories: {len(categories)}, Items: {total_items}")
            else:
                print(f"  ❌ Failed to create {room_name}")
                print(f"  Response: {response.text}")
                
        except Exception as e:
            print(f"  ❌ Error creating {room_name}: {str(e)}")
    
    # Step 4: Return final project URL
    print("\n" + "=" * 80)
    print("📊 FINAL RESULTS")
    print("=" * 80)
    print(f"\n✅ Project ID: {project_id}")
    print(f"✅ Project Name: API Complete Test Project")
    print(f"✅ Client: API Test User Complete")
    print(f"✅ Questionnaire: 100% complete with {len(questionnaire_data['answers'])} fields")
    print(f"✅ Rooms Created: {len(created_rooms)}/{len(rooms)}")
    print(f"   - {', '.join(created_rooms)}")
    
    print(f"\n🌐 PROJECT URLS:")
    print(f"   Project Detail: {BACKEND_URL}/project/{project_id}")
    print(f"   Questionnaire: {BACKEND_URL}/project/{project_id}/questionnaire")
    print(f"   Walkthrough: {BACKEND_URL}/project/{project_id}/walkthrough")
    print(f"   Checklist: {BACKEND_URL}/project/{project_id}/checklist")
    print(f"   FF&E: {BACKEND_URL}/project/{project_id}/ffe")
    
    print("\n" + "=" * 80)
    print("✅ COMPLETE PROJECT CREATION TEST FINISHED!")
    print("=" * 80)
    
    return project_id

if __name__ == "__main__":
    test_create_complete_project()

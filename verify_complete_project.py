#!/usr/bin/env python3
"""
Verify Complete Project Data
Verifies that all data was saved correctly
"""

import requests
import json

BACKEND_URL = "https://interiordata.preview.emergentagent.com"
PROJECT_ID = "de2af37b-9a03-48d4-a17e-93148f98bfda"

def verify_project_data():
    """Verify all project data was saved correctly"""
    
    print("=" * 80)
    print("VERIFYING COMPLETE PROJECT DATA")
    print("=" * 80)
    
    # Verify project
    print("\n📋 Verifying Project...")
    try:
        response = requests.get(f"{BACKEND_URL}/api/projects/{PROJECT_ID}", timeout=30)
        if response.status_code == 200:
            project = response.json()
            print(f"✅ Project retrieved successfully")
            print(f"   Name: {project.get('name')}")
            print(f"   Client: {project.get('client_info', {}).get('full_name')}")
            print(f"   Email: {project.get('client_info', {}).get('email')}")
            print(f"   Phone: {project.get('client_info', {}).get('phone')}")
            print(f"   Address: {project.get('client_info', {}).get('address')}")
            print(f"   Project Type: {project.get('project_type')}")
            print(f"   Timeline: {project.get('timeline')}")
            print(f"   Budget: {project.get('budget')}")
            print(f"   Rooms: {len(project.get('rooms', []))}")
        else:
            print(f"❌ Failed to retrieve project: {response.status_code}")
    except Exception as e:
        print(f"❌ Error: {str(e)}")
    
    # Verify questionnaire
    print("\n📋 Verifying Questionnaire...")
    try:
        response = requests.get(f"{BACKEND_URL}/api/questionnaire/{PROJECT_ID}", timeout=30)
        if response.status_code == 200:
            questionnaire = response.json()
            answers = questionnaire.get('answers', {})
            print(f"✅ Questionnaire retrieved successfully")
            print(f"   Completion: {questionnaire.get('completion_percentage')}%")
            print(f"   Total fields: {len(answers)}")
            
            # Verify key fields
            print("\n   Key Fields Verification:")
            key_fields = [
                'client_name', 'name', 'email', 'phone',
                'spouse_partner_name', 'spouse_partner_phone',
                'best_time_to_call', 'worked_with_designer_before',
                'primary_decision_maker', 'involvement_level',
                'timeline', 'budget_range', 'project_type', 'property_type',
                'design_love_home', 'design_first_impression',
                'know_you_household', 'know_you_pets',
                'know_you_favorite_restaurant', 'how_heard'
            ]
            
            for field in key_fields:
                value = answers.get(field, 'NOT FOUND')
                if value and value != 'NOT FOUND':
                    print(f"   ✅ {field}: {value[:50]}..." if len(str(value)) > 50 else f"   ✅ {field}: {value}")
                else:
                    print(f"   ❌ {field}: MISSING")
            
            # Check rooms_involved
            rooms = answers.get('rooms_involved', [])
            print(f"\n   Rooms Involved: {rooms}")
            
        else:
            print(f"❌ Failed to retrieve questionnaire: {response.status_code}")
    except Exception as e:
        print(f"❌ Error: {str(e)}")
    
    # Verify rooms
    print("\n📋 Verifying Rooms...")
    try:
        response = requests.get(f"{BACKEND_URL}/api/projects/{PROJECT_ID}", timeout=30)
        if response.status_code == 200:
            project = response.json()
            rooms = project.get('rooms', [])
            print(f"✅ Found {len(rooms)} rooms")
            
            for room in rooms:
                print(f"\n   Room: {room.get('name')}")
                print(f"   - ID: {room.get('id')}")
                print(f"   - Sheet Type: {room.get('sheet_type')}")
                print(f"   - Categories: {len(room.get('categories', []))}")
                
                # Count items
                total_items = sum(
                    len(subcat.get('items', []))
                    for cat in room.get('categories', [])
                    for subcat in cat.get('subcategories', [])
                )
                print(f"   - Total Items: {total_items}")
        else:
            print(f"❌ Failed to retrieve rooms: {response.status_code}")
    except Exception as e:
        print(f"❌ Error: {str(e)}")
    
    print("\n" + "=" * 80)
    print("✅ VERIFICATION COMPLETE!")
    print("=" * 80)
    print(f"\n🌐 View the project at:")
    print(f"   {BACKEND_URL}/project/{PROJECT_ID}")

if __name__ == "__main__":
    verify_project_data()

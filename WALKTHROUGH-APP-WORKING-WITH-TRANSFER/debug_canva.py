#!/usr/bin/env python3
"""
DEBUG CANVA PDF ISSUE
Check the actual project structure and room names
"""

import requests
import json

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
PROJECT_ID = "5cccfb11-0ac0-45ed-91ab-a56088d65b5a"

print(f"🔍 DEBUGGING CANVA PDF ISSUE")
print(f"Backend URL: {BASE_URL}")
print(f"Project ID: {PROJECT_ID}")

# Get project structure
try:
    response = requests.get(f"{BASE_URL}/projects/{PROJECT_ID}")
    if response.status_code == 200:
        project_data = response.json()
        
        print(f"\n✅ Project found: {project_data.get('name', 'Unknown')}")
        print(f"Client: {project_data.get('client_info', {}).get('full_name', 'Unknown')}")
        
        rooms = project_data.get('rooms', [])
        print(f"\n📋 ROOMS IN PROJECT ({len(rooms)} total):")
        
        for i, room in enumerate(rooms):
            room_name = room.get('name', 'Unknown')
            room_id = room.get('id', 'No ID')
            categories = room.get('categories', [])
            
            print(f"  {i+1}. Room: '{room_name}' (ID: {room_id})")
            print(f"     Categories: {len(categories)}")
            
            # Show first few categories
            for j, category in enumerate(categories[:3]):
                cat_name = category.get('name', 'Unknown')
                subcategories = category.get('subcategories', [])
                print(f"       - {cat_name} ({len(subcategories)} subcategories)")
                
                # Show first subcategory
                if subcategories:
                    subcat = subcategories[0]
                    subcat_name = subcat.get('name', 'Unknown')
                    items = subcat.get('items', [])
                    print(f"         └─ {subcat_name} ({len(items)} items)")
            
            if len(categories) > 3:
                print(f"       ... and {len(categories) - 3} more categories")
            print()
        
        # Test with exact room name
        test_room_name = rooms[0]['name'] if rooms else "Living Room"
        print(f"🧪 TESTING CANVA PDF with room name: '{test_room_name}'")
        
        # Create minimal PDF
        test_pdf_content = b"""%PDF-1.4
1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj
2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj
3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 612 792]/Contents 4 0 R>>endobj
4 0 obj<</Length 44>>stream
BT /F1 12 Tf 72 720 Td (Canva Test Chair) Tj ET
endstream endobj
xref 0 5
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000189 00000 n 
trailer<</Size 5/Root 1 0 R>>
startxref 284
%%EOF"""
        
        files = {
            'file': ('debug_canva.pdf', test_pdf_content, 'application/pdf')
        }
        
        data = {
            'room_name': test_room_name,
            'project_id': PROJECT_ID
        }
        
        canva_response = requests.post(f"{BASE_URL}/upload-canva-pdf", data=data, files=files)
        
        print(f"Canva PDF Response Status: {canva_response.status_code}")
        print(f"Canva PDF Response: {canva_response.text}")
        
        if canva_response.status_code == 200:
            result = canva_response.json()
            if result.get('success'):
                print(f"✅ Canva PDF processing successful!")
                items_created = result.get('items_created', 0)
                print(f"Items created: {items_created}")
            else:
                print(f"❌ Canva PDF processing failed: {result.get('error')}")
        else:
            print(f"❌ Canva PDF request failed")
            
    else:
        print(f"❌ Could not access project: {response.status_code}")
        print(f"Response: {response.text}")
        
except Exception as e:
    print(f"❌ Exception: {e}")
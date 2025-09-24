#!/usr/bin/env python3
import requests
import json

# Backend URL
BACKEND_URL = "http://localhost:8001"

# Project and Room IDs  
PROJECT_ID = "68d416da03bc0492cc3df52c"
GREAT_ROOM_ID = "68d42f4903bc0492cc3df538"
PRIMARY_BATH_ID = "68d42f5803bc0492cc3df539"
KITCHEN_ID = "68d42d8c03bc0492cc3df534"
MASTER_BEDROOM_ID = "68d42d8603bc0492cc3df533"

# Great Room Items - Full Furniture Layout
great_room_items = [
    {"name": "Sectional Sofa with Chaise", "status": "Approved", "notes": "Custom fabric, down-filled cushions"},
    {"name": "Coffee Table - Live Edge Walnut", "status": "Ordered", "notes": "72\" x 36\" with steel base"},
    {"name": "Accent Chairs (2)", "status": "Delivered", "notes": "Velvet upholstery in deep emerald"},
    {"name": "Area Rug - Persian Style", "status": "Installed", "notes": "9x12 hand-knotted wool"},
    {"name": "Floor Lamp - Brass Arc", "status": "Pending Approval", "notes": "Adjustable height with marble base"},
    {"name": "Table Lamps (2)", "status": "To Be Selected", "notes": "For accent chairs side tables"},
    {"name": "Chandelier - Crystal Modern", "status": "Received", "notes": "36\" diameter with dimmer"},
    {"name": "Side Tables (2)", "status": "Walkthrough", "notes": "Matching walnut to coffee table"},
    {"name": "Throw Pillows (6)", "status": "Approved", "notes": "Mix of textures and patterns"},
    {"name": "Artwork - Large Abstract", "status": "Ordered", "notes": "60\"x48\" above sofa"},
    {"name": "Window Treatments", "status": "Delivered", "notes": "Custom drapery with blackout lining"},
    {"name": "Console Table", "status": "Installed", "notes": "72\" behind sofa with storage"},
    {"name": "Decorative Objects", "status": "To Be Selected", "notes": "Vases, books, sculptural pieces"},
    {"name": "Ottoman - Leather", "status": "Received", "notes": "Round tufted ottoman for extra seating"},
    {"name": "Dining Table", "status": "Approved", "notes": "84\" extension table seats 8-10"},
    {"name": "Dining Chairs (8)", "status": "Ordered", "notes": "Upholstered in performance fabric"},
    {"name": "Dining Chandelier", "status": "Delivered", "notes": "Linear fixture 48\" length"},
    {"name": "Buffet/Credenza", "status": "Installed", "notes": "Media storage with wine fridge"},
    {"name": "Bar Stools (3)", "status": "Pending Approval", "notes": "Counter height with backs"},
    {"name": "Pendant Lights (3)", "status": "Walkthrough", "notes": "Over kitchen island"}
]

# Kitchen Items
kitchen_items = [
    {"name": "Quartz Countertops", "status": "Installed", "notes": "Calacatta marble pattern"},
    {"name": "Professional Range - 48\"", "status": "Delivered", "notes": "Dual fuel with griddle"},
    {"name": "Range Hood - Custom", "status": "Received", "notes": "Stainless steel with LED lighting"},
    {"name": "Refrigerator - Panel Ready", "status": "Ordered", "notes": "48\" built-in with ice maker"},
    {"name": "Dishwasher - Panel Ready", "status": "Approved", "notes": "Quiet operation 38dB"},
    {"name": "Kitchen Island", "status": "Installed", "notes": "10ft with breakfast bar"},
    {"name": "Cabinet Hardware", "status": "Delivered", "notes": "Brass pulls and knobs"},
    {"name": "Backsplash Tile", "status": "Received", "notes": "Marble subway with dark grout"},
    {"name": "Kitchen Sink - Farmhouse", "status": "Installed", "notes": "36\" apron front fireclay"},
    {"name": "Faucet - Bridge Style", "status": "Delivered", "notes": "Brass with spray attachment"},
    {"name": "Wine Refrigerator", "status": "Pending Approval", "notes": "Dual zone 46 bottles"},
    {"name": "Microwave Drawer", "status": "Ordered", "notes": "Panel ready under island"},
    {"name": "Pantry Shelving", "status": "To Be Selected", "notes": "Custom built-ins with pullouts"},
    {"name": "Under Cabinet Lighting", "status": "Walkthrough", "notes": "LED strips with dimmer"}
]

# Master Bedroom Items  
master_bedroom_items = [
    {"name": "King Platform Bed", "status": "Installed", "notes": "Walnut with built-in nightstands"},
    {"name": "Mattress & Box Spring", "status": "Delivered", "notes": "Luxury memory foam king"},
    {"name": "Dresser - 9 Drawer", "status": "Received", "notes": "Matching walnut finish"},
    {"name": "Bedside Lamps (2)", "status": "Approved", "notes": "Touch control with USB charging"},
    {"name": "Accent Chair", "status": "Ordered", "notes": "Reading chair by window"},
    {"name": "Ottoman for Chair", "status": "Pending Approval", "notes": "Matching fabric to chair"},
    {"name": "Area Rug", "status": "Delivered", "notes": "8x10 under bed extending to chair"},
    {"name": "Blackout Curtains", "status": "Installed", "notes": "Motorized with remote control"},
    {"name": "Ceiling Fan", "status": "Received", "notes": "52\" with LED and remote"},
    {"name": "Artwork - Photography", "status": "To Be Selected", "notes": "Black & white series above bed"},
    {"name": "Throw Blanket", "status": "Walkthrough", "notes": "Cashmere blend in neutral tone"},
    {"name": "Decorative Pillows (4)", "status": "Approved", "notes": "Mix of textures and sizes"}
]

# Primary Bathroom Items
primary_bath_items = [
    {"name": "Dual Vanity - 72\"", "status": "Installed", "notes": "Walnut with undermount sinks"},
    {"name": "Quartz Countertops", "status": "Installed", "notes": "White with grey veining"},
    {"name": "Faucets (2)", "status": "Delivered", "notes": "Brass widespread with pop-up drains"},
    {"name": "Mirrors (2)", "status": "Received", "notes": "36\" round with LED backlighting"},
    {"name": "Vanity Lighting (2)", "status": "Approved", "notes": "Linear LED sconces"},
    {"name": "Freestanding Tub", "status": "Ordered", "notes": "67\" acrylic with overflow"},
    {"name": "Tub Filler - Floor Mount", "status": "Pending Approval", "notes": "Brass finish with hand shower"},
    {"name": "Walk-in Shower", "status": "Delivered", "notes": "Frameless glass with rain head"},
    {"name": "Shower System", "status": "Installed", "notes": "Thermostatic with body sprays"},
    {"name": "Floor Tile", "status": "Received", "notes": "12x24 marble in herringbone"},
    {"name": "Wall Tile", "status": "Delivered", "notes": "Subway tile to ceiling"},
    {"name": "Heated Floors", "status": "Installed", "notes": "Electric radiant system"},
    {"name": "Towel Warmers (2)", "status": "Approved", "notes": "Wall mounted brass finish"},
    {"name": "Medicine Cabinets (2)", "status": "Ordered", "notes": "Recessed with LED interior"},
    {"name": "Toilet", "status": "To Be Selected", "notes": "Wall hung with bidet function"},
    {"name": "Accessories Set", "status": "Walkthrough", "notes": "Towel bars, hooks, tissue holder"}
]

def create_items(room_id, items_list, room_name):
    print(f"\n🏠 Creating items for {room_name}...")
    created_count = 0
    
    for item in items_list:
        item_data = {
            "project_id": PROJECT_ID,
            "room_id": room_id,
            "name": item["name"],
            "status": item["status"],
            "quantity": 1,
            "notes": item["notes"]
        }
        
        try:
            response = requests.post(f"{BACKEND_URL}/api/items", 
                                   json=item_data,
                                   headers={"Content-Type": "application/json"})
            
            if response.status_code == 200:
                created_count += 1
                print(f"  ✅ {item['name']} - {item['status']}")
            else:
                print(f"  ❌ Failed to create {item['name']}: {response.text}")
                
        except Exception as e:
            print(f"  ❌ Error creating {item['name']}: {e}")
    
    print(f"✨ Created {created_count} items for {room_name}")

if __name__ == "__main__":
    print("🎨 Populating rooms with comprehensive item lists...")
    
    # Create items for each room
    create_items(GREAT_ROOM_ID, great_room_items, "Great Room")
    create_items(KITCHEN_ID, kitchen_items, "Kitchen") 
    create_items(MASTER_BEDROOM_ID, master_bedroom_items, "Master Bedroom")
    create_items(PRIMARY_BATH_ID, primary_bath_items, "Primary Bathroom")
    
    print("\n🎉 COMPLETE! All rooms populated with items and status colors!")
    print("\n🌈 Status Colors You'll See:")
    print("  🟢 Approved, Delivered, Installed")
    print("  🟡 Pending Approval, To Be Selected")  
    print("  🔵 Ordered, Received")
    print("  🟠 Walkthrough")
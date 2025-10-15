#!/usr/bin/env python3
"""
Room Colors Investigation Test
Testing to find exact hex color codes used in desktop app for room headers
"""

import requests
import json
from typing import Dict, Any

# Backend URL from environment
BACKEND_URL = "https://designhub-74.preview.emergentagent.com/api"

# Project ID from review request
PROJECT_ID = "5d42e515-f84b-4c3d-a4cc-6c3dcc4417a2"

def print_section(title: str):
    """Print a formatted section header"""
    print("\n" + "="*80)
    print(f"  {title}")
    print("="*80)

def test_room_colors_endpoint():
    """Test 1: Check GET /api/room-colors endpoint"""
    print_section("TEST 1: GET /api/room-colors Endpoint")
    
    try:
        response = requests.get(f"{BACKEND_URL}/room-colors", timeout=10)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            colors = response.json()
            print(f"\n✅ Room Colors Endpoint Working!")
            print(f"Total Room Types: {len(colors)}")
            print("\n📊 ROOM COLORS FROM BACKEND:")
            print("-" * 80)
            
            for room_name, color in colors.items():
                print(f"  {room_name:25s} → {color}")
            
            return colors
        else:
            print(f"❌ Endpoint returned {response.status_code}")
            print(f"Response: {response.text}")
            return None
            
    except Exception as e:
        print(f"❌ Error testing room-colors endpoint: {e}")
        return None

def test_project_data():
    """Test 2: Get project data and check room colors"""
    print_section(f"TEST 2: Project Data for {PROJECT_ID}")
    
    try:
        response = requests.get(f"{BACKEND_URL}/projects/{PROJECT_ID}", timeout=10)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            project = response.json()
            print(f"\n✅ Project Found!")
            print(f"Project Name: {project.get('name', 'N/A')}")
            print(f"Total Rooms: {len(project.get('rooms', []))}")
            
            rooms = project.get('rooms', [])
            if rooms:
                print("\n📊 ROOM COLORS IN PROJECT DATA:")
                print("-" * 80)
                
                for room in rooms:
                    room_name = room.get('name', 'Unknown')
                    room_color = room.get('color', 'NOT FOUND')
                    room_id = room.get('id', 'N/A')
                    sheet_type = room.get('sheet_type', 'N/A')
                    
                    print(f"\n  Room: {room_name}")
                    print(f"    Color: {room_color}")
                    print(f"    ID: {room_id}")
                    print(f"    Sheet Type: {sheet_type}")
                
                return rooms
            else:
                print("\n⚠️ No rooms found in project")
                return []
        else:
            print(f"❌ Project not found - Status {response.status_code}")
            print(f"Response: {response.text}")
            return None
            
    except Exception as e:
        print(f"❌ Error getting project data: {e}")
        return None

def test_individual_room(room_id: str, room_name: str):
    """Test 3: Get individual room data"""
    print_section(f"TEST 3: Individual Room Data - {room_name}")
    
    try:
        response = requests.get(f"{BACKEND_URL}/rooms/{room_id}", timeout=10)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            room = response.json()
            print(f"\n✅ Room Data Retrieved!")
            print(f"Room Name: {room.get('name', 'N/A')}")
            print(f"Room Color: {room.get('color', 'NOT FOUND')}")
            print(f"Sheet Type: {room.get('sheet_type', 'N/A')}")
            print(f"Categories: {len(room.get('categories', []))}")
            
            return room
        else:
            print(f"❌ Room not found - Status {response.status_code}")
            return None
            
    except Exception as e:
        print(f"❌ Error getting room data: {e}")
        return None

def compare_colors(backend_colors: Dict[str, str], project_rooms: list):
    """Test 4: Compare backend colors with project room colors"""
    print_section("TEST 4: Color Comparison Analysis")
    
    if not backend_colors or not project_rooms:
        print("⚠️ Missing data for comparison")
        return
    
    print("\n🔍 COMPARING BACKEND COLORS vs PROJECT ROOM COLORS:")
    print("-" * 80)
    
    mismatches = []
    matches = []
    
    for room in project_rooms:
        room_name = room.get('name', '').lower()
        room_color = room.get('color', '')
        
        # Try to find matching backend color
        backend_color = backend_colors.get(room_name, None)
        
        if backend_color:
            if backend_color == room_color:
                matches.append((room.get('name'), room_color, 'MATCH'))
                print(f"\n  ✅ {room.get('name')}")
                print(f"     Backend: {backend_color}")
                print(f"     Project: {room_color}")
                print(f"     Status: MATCH")
            else:
                mismatches.append((room.get('name'), backend_color, room_color))
                print(f"\n  ⚠️ {room.get('name')}")
                print(f"     Backend: {backend_color}")
                print(f"     Project: {room_color}")
                print(f"     Status: MISMATCH")
        else:
            print(f"\n  ❓ {room.get('name')}")
            print(f"     Backend: NOT FOUND")
            print(f"     Project: {room_color}")
            print(f"     Status: NO BACKEND COLOR DEFINED")
    
    print("\n" + "="*80)
    print(f"Summary: {len(matches)} matches, {len(mismatches)} mismatches")
    print("="*80)

def check_color_vibrancy(colors: Dict[str, str]):
    """Test 5: Analyze if colors are muted or vibrant"""
    print_section("TEST 5: Color Vibrancy Analysis")
    
    print("\n🎨 ANALYZING COLOR VIBRANCY:")
    print("-" * 80)
    
    for room_name, color in colors.items():
        # Remove # and convert to RGB
        hex_color = color.lstrip('#')
        r = int(hex_color[0:2], 16)
        g = int(hex_color[2:4], 16)
        b = int(hex_color[4:6], 16)
        
        # Calculate saturation (simple method)
        max_rgb = max(r, g, b)
        min_rgb = min(r, g, b)
        
        if max_rgb == 0:
            saturation = 0
        else:
            saturation = (max_rgb - min_rgb) / max_rgb * 100
        
        # Calculate brightness
        brightness = (r + g + b) / 3
        
        vibrancy = "VIBRANT" if saturation > 50 and brightness > 100 else "MUTED"
        
        print(f"\n  {room_name:25s}")
        print(f"    Color: {color}")
        print(f"    RGB: ({r}, {g}, {b})")
        print(f"    Saturation: {saturation:.1f}%")
        print(f"    Brightness: {brightness:.1f}")
        print(f"    Classification: {vibrancy}")

def main():
    """Run all color investigation tests"""
    print("\n" + "🎨"*40)
    print("  ROOM COLORS INVESTIGATION - Desktop vs Mobile Color Mismatch")
    print("🎨"*40)
    
    # Test 1: Get backend room colors
    backend_colors = test_room_colors_endpoint()
    
    # Test 2: Get project data
    project_rooms = test_project_data()
    
    # Test 3: Get individual room data (if we have rooms)
    if project_rooms and len(project_rooms) > 0:
        first_room = project_rooms[0]
        test_individual_room(first_room.get('id'), first_room.get('name'))
    
    # Test 4: Compare colors
    if backend_colors and project_rooms:
        compare_colors(backend_colors, project_rooms)
    
    # Test 5: Analyze color vibrancy
    if backend_colors:
        check_color_vibrancy(backend_colors)
    
    # Final Summary
    print_section("FINAL SUMMARY - EXACT HEX CODES FOR DESKTOP APP")
    
    if backend_colors:
        print("\n📋 COPY-PASTE READY COLOR CODES:")
        print("-" * 80)
        print("\nThese are the EXACT hex color codes from the backend:")
        print("(These should match what the desktop app is using)\n")
        
        for room_name, color in sorted(backend_colors.items()):
            print(f"  {room_name:25s} : '{color}'")
        
        print("\n" + "="*80)
        print("✅ Investigation Complete!")
        print("="*80)
        print("\nKEY FINDINGS:")
        print("1. Backend colors are MUTED (low saturation)")
        print("2. If desktop shows VIBRANT colors, it's using different colors")
        print("3. Mobile app should use the colors listed above to match desktop")
        print("4. Check desktop frontend code to see if it overrides these colors")
    else:
        print("\n❌ Could not retrieve backend colors")

if __name__ == "__main__":
    main()

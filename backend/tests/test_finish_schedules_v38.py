"""
Test Room Finish Schedules Feature - Backend API Tests (Iteration 38)
Tests CRUD operations for finish schedules with visual wall diagram features
Updated with correct project/room IDs from current environment
"""

import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://design-burst.preview.emergentagent.com').rstrip('/')

# Test data from the review request - UPDATED for iteration 38
TEST_PROJECT_ID = "b952bc05-30f0-4dfd-92fa-6462d7a387a1"
TEST_ROOM_IDS = {
    "master_bathroom": "80231e5b-b360-45c7-9faf-57a6dd530e44",
    "kitchen": "504b6428-beb0-49cf-85fc-cac585615e42"
}
EXISTING_SCHEDULE_ID = "dd260251-b27a-4929-9c5a-43c08069cc73"


class TestFinishSchedulesAPI:
    """Test Room Finish Schedules CRUD operations"""
    
    def test_get_project_exists(self):
        """Verify test project exists"""
        response = requests.get(f"{BASE_URL}/api/projects/{TEST_PROJECT_ID}")
        print(f"GET project: {response.status_code}")
        assert response.status_code == 200
        data = response.json()
        assert data.get("id") == TEST_PROJECT_ID
        assert data.get("name") == "Wheeler Ridge Residence"
        assert "rooms" in data
        print(f"Project has {len(data.get('rooms', []))} rooms")
    
    def test_get_finish_schedules_for_room(self):
        """Test GET /api/projects/{pid}/rooms/{rid}/finish-schedules"""
        room_id = TEST_ROOM_IDS["master_bathroom"]
        response = requests.get(f"{BASE_URL}/api/projects/{TEST_PROJECT_ID}/rooms/{room_id}/finish-schedules")
        print(f"GET schedules: {response.status_code}")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"Master Bathroom has {len(data)} schedules")
        
        # Check if existing schedule exists and has required fields
        for schedule in data:
            assert "id" in schedule
            assert "name" in schedule
            assert "schedule_type" in schedule
            assert "surfaces" in schedule
            assert "measurement_lines" in schedule
            print(f"  Schedule: {schedule['name']} ({schedule['schedule_type']})")
    
    def test_existing_schedule_has_materials_with_patterns(self):
        """Test that existing schedule has materials with tile patterns"""
        room_id = TEST_ROOM_IDS["master_bathroom"]
        response = requests.get(f"{BASE_URL}/api/projects/{TEST_PROJECT_ID}/rooms/{room_id}/finish-schedules")
        assert response.status_code == 200
        data = response.json()
        
        # Find the existing schedule
        existing_schedule = None
        for s in data:
            if s.get("id") == EXISTING_SCHEDULE_ID:
                existing_schedule = s
                break
        
        assert existing_schedule is not None, f"Schedule {EXISTING_SCHEDULE_ID} not found"
        print(f"Found existing schedule: {existing_schedule['name']}")
        
        # Check Back Wall surface has materials with patterns
        back_wall = None
        for surface in existing_schedule.get("surfaces", []):
            if surface.get("name") == "Back Wall":
                back_wall = surface
                break
        
        assert back_wall is not None, "Back Wall surface not found"
        materials = back_wall.get("materials", [])
        print(f"Back Wall has {len(materials)} materials")
        
        # Verify materials have patterns
        patterns_found = []
        for mat in materials:
            pattern = mat.get("pattern", "")
            position = mat.get("position_label", "")
            print(f"  Material: {mat.get('name')} at {position} with pattern: {pattern}")
            if pattern:
                patterns_found.append(pattern)
        
        # Should have herringbone, offset, stacked_horizontal based on test data
        assert len(patterns_found) >= 1, "No patterns found on materials"
        print(f"Patterns found: {patterns_found}")
    
    def test_create_finish_schedule_tile(self):
        """Test POST /api/projects/{pid}/rooms/{rid}/finish-schedules - Tile type"""
        room_id = TEST_ROOM_IDS["kitchen"]
        test_name = f"TEST_Kitchen_Backsplash_{uuid.uuid4().hex[:6]}"
        
        response = requests.post(
            f"{BASE_URL}/api/projects/{TEST_PROJECT_ID}/rooms/{room_id}/finish-schedules",
            json={
                "schedule_type": "tile",
                "name": test_name
            }
        )
        print(f"POST create schedule: {response.status_code}")
        assert response.status_code == 200
        
        data = response.json()
        assert data.get("name") == test_name
        assert data.get("schedule_type") == "tile"
        assert data.get("project_id") == TEST_PROJECT_ID
        assert data.get("room_id") == room_id
        assert "id" in data
        assert "surfaces" in data
        assert "measurement_lines" in data
        
        # Verify default tile surfaces were created
        surfaces = data.get("surfaces", [])
        surface_names = [s.get("name") for s in surfaces]
        print(f"Created surfaces: {surface_names}")
        assert "Back Wall" in surface_names
        assert "Floor" in surface_names
        
        # Store for cleanup
        self.__class__.created_schedule_id = data.get("id")
        print(f"✓ Created schedule: {data.get('id')}")
    
    def test_update_finish_schedule_add_material_with_pattern(self):
        """Test PUT - Update surface with material and pattern"""
        schedule_id = getattr(self.__class__, 'created_schedule_id', None)
        if not schedule_id:
            pytest.skip("No schedule created to update")
        
        # Get current schedule
        room_id = TEST_ROOM_IDS["kitchen"]
        get_resp = requests.get(f"{BASE_URL}/api/projects/{TEST_PROJECT_ID}/rooms/{room_id}/finish-schedules")
        schedules = get_resp.json()
        current = next((s for s in schedules if s.get("id") == schedule_id), None)
        
        if not current:
            pytest.skip("Schedule not found")
        
        # Update first surface with a material that has a pattern
        surfaces = current.get("surfaces", [])
        if surfaces:
            surfaces[0]["materials"] = [{
                "id": str(uuid.uuid4()),
                "name": "Test Marble Tile",
                "vendor": "TestVendor",
                "sku": "TEST-001",
                "size": "12x24",
                "color": "White",
                "image": "https://example.com/tile.jpg",
                "link": "https://example.com",
                "position_label": "main_wall",
                "pattern": "herringbone"  # Testing pattern field
            }]
        
        response = requests.put(
            f"{BASE_URL}/api/projects/{TEST_PROJECT_ID}/finish-schedules/{schedule_id}",
            json={"surfaces": surfaces}
        )
        print(f"PUT update surfaces: {response.status_code}")
        assert response.status_code == 200
        
        data = response.json()
        updated_surfaces = data.get("surfaces", [])
        first_surface_materials = updated_surfaces[0].get("materials", []) if updated_surfaces else []
        assert len(first_surface_materials) >= 1
        
        # Verify pattern was saved
        material = first_surface_materials[0]
        assert material.get("pattern") == "herringbone"
        print(f"✓ Added material with pattern: {material.get('name')} - {material.get('pattern')}")
    
    def test_update_finish_schedule_change_pattern(self):
        """Test PUT - Change pattern on existing material"""
        schedule_id = getattr(self.__class__, 'created_schedule_id', None)
        if not schedule_id:
            pytest.skip("No schedule created to update")
        
        # Get current schedule
        room_id = TEST_ROOM_IDS["kitchen"]
        get_resp = requests.get(f"{BASE_URL}/api/projects/{TEST_PROJECT_ID}/rooms/{room_id}/finish-schedules")
        schedules = get_resp.json()
        current = next((s for s in schedules if s.get("id") == schedule_id), None)
        
        if not current:
            pytest.skip("Schedule not found")
        
        # Change pattern from herringbone to basket_weave
        surfaces = current.get("surfaces", [])
        if surfaces and surfaces[0].get("materials"):
            surfaces[0]["materials"][0]["pattern"] = "basket_weave"
        
        response = requests.put(
            f"{BASE_URL}/api/projects/{TEST_PROJECT_ID}/finish-schedules/{schedule_id}",
            json={"surfaces": surfaces}
        )
        print(f"PUT change pattern: {response.status_code}")
        assert response.status_code == 200
        
        data = response.json()
        updated_surfaces = data.get("surfaces", [])
        if updated_surfaces and updated_surfaces[0].get("materials"):
            new_pattern = updated_surfaces[0]["materials"][0].get("pattern")
            assert new_pattern == "basket_weave"
            print(f"✓ Pattern changed to: {new_pattern}")
    
    def test_delete_finish_schedule(self):
        """Test DELETE /api/projects/{pid}/finish-schedules/{sid}"""
        schedule_id = getattr(self.__class__, 'created_schedule_id', None)
        if not schedule_id:
            pytest.skip("No schedule to delete")
        
        response = requests.delete(
            f"{BASE_URL}/api/projects/{TEST_PROJECT_ID}/finish-schedules/{schedule_id}"
        )
        print(f"DELETE schedule: {response.status_code}")
        assert response.status_code == 200
        
        data = response.json()
        assert data.get("status") == "deleted"
        print(f"✓ Deleted schedule: {schedule_id}")
    
    def test_delete_nonexistent_schedule(self):
        """Test DELETE returns 404 for nonexistent schedule"""
        fake_id = str(uuid.uuid4())
        response = requests.delete(
            f"{BASE_URL}/api/projects/{TEST_PROJECT_ID}/finish-schedules/{fake_id}"
        )
        print(f"DELETE nonexistent: {response.status_code}")
        assert response.status_code == 404
        print("✓ Correctly returns 404 for nonexistent schedule")


class TestFinishSchedulesDataIntegrity:
    """Test data integrity and edge cases"""
    
    def test_all_8_tile_patterns_supported(self):
        """Verify all 8 tile patterns are valid values"""
        valid_patterns = [
            'stacked_horizontal',
            'stacked_vertical', 
            'offset',
            'one_third_offset',
            'herringbone',
            'basket_weave',
            'stepladder',
            'diagonal'
        ]
        
        room_id = TEST_ROOM_IDS["kitchen"]
        test_name = f"TEST_Pattern_Validation_{uuid.uuid4().hex[:6]}"
        
        # Create a schedule
        response = requests.post(
            f"{BASE_URL}/api/projects/{TEST_PROJECT_ID}/rooms/{room_id}/finish-schedules",
            json={"schedule_type": "tile", "name": test_name}
        )
        assert response.status_code == 200
        schedule = response.json()
        schedule_id = schedule.get("id")
        
        # Test each pattern
        surfaces = schedule.get("surfaces", [])
        if surfaces:
            for pattern in valid_patterns:
                surfaces[0]["materials"] = [{
                    "id": str(uuid.uuid4()),
                    "name": f"Test {pattern}",
                    "position_label": "main_wall",
                    "pattern": pattern
                }]
                
                update_resp = requests.put(
                    f"{BASE_URL}/api/projects/{TEST_PROJECT_ID}/finish-schedules/{schedule_id}",
                    json={"surfaces": surfaces}
                )
                assert update_resp.status_code == 200
                updated = update_resp.json()
                saved_pattern = updated["surfaces"][0]["materials"][0].get("pattern")
                assert saved_pattern == pattern, f"Pattern {pattern} not saved correctly"
                print(f"✓ Pattern {pattern} validated")
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/projects/{TEST_PROJECT_ID}/finish-schedules/{schedule_id}")
        print("✓ All 8 patterns validated successfully")
    
    def test_project_rooms_listed(self):
        """Verify project has rooms that can be used for finish schedules"""
        response = requests.get(f"{BASE_URL}/api/projects/{TEST_PROJECT_ID}")
        assert response.status_code == 200
        
        data = response.json()
        rooms = data.get("rooms", [])
        assert len(rooms) > 0
        
        room_names = [r.get("name") for r in rooms]
        print(f"Project rooms: {room_names}")
        
        # Check test rooms exist
        room_ids = [r.get("id") for r in rooms]
        for name, room_id in TEST_ROOM_IDS.items():
            assert room_id in room_ids, f"Room {name} ({room_id}) should exist in project"
        print("✓ All test rooms exist in project")
    
    def test_room_items_available_for_palette(self):
        """Verify room has items that can be used in material palette"""
        response = requests.get(f"{BASE_URL}/api/projects/{TEST_PROJECT_ID}")
        assert response.status_code == 200
        
        data = response.json()
        rooms = data.get("rooms", [])
        
        # Find Master Bathroom
        master_bath = next((r for r in rooms if r.get("id") == TEST_ROOM_IDS["master_bathroom"]), None)
        assert master_bath is not None
        
        # Count items with images
        items_with_images = 0
        for cat in master_bath.get("categories", []):
            for subcat in cat.get("subcategories", []):
                for item in subcat.get("items", []):
                    if item.get("image_url"):
                        items_with_images += 1
                        print(f"  Item: {item.get('name')} - {item.get('image_url')[:50]}...")
        
        assert items_with_images >= 4, f"Expected at least 4 items with images, found {items_with_images}"
        print(f"✓ Found {items_with_images} items with images for material palette")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])

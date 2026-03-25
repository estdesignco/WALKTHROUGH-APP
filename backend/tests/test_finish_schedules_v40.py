"""
Test Finish Schedule API - Iteration 40
Tests CRUD operations for finish schedules with CSS mask-image pattern rendering
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://finish-schedule.preview.emergentagent.com')

# Test data
TEST_PROJECT_ID = "b952bc05-30f0-4dfd-92fa-6462d7a387a1"
TEST_ROOM_ID = "80231e5b-b360-45c7-9faf-57a6dd530e44"
EXISTING_SCHEDULE_ID = "dd260251-b27a-4929-9c5a-43c08069cc73"


class TestFinishScheduleAPI:
    """Test finish schedule CRUD operations"""
    
    def test_get_room_finish_schedules(self):
        """GET /api/projects/{project_id}/rooms/{room_id}/finish-schedules"""
        response = requests.get(f"{BASE_URL}/api/projects/{TEST_PROJECT_ID}/rooms/{TEST_ROOM_ID}/finish-schedules")
        assert response.status_code == 200
        
        schedules = response.json()
        assert isinstance(schedules, list)
        assert len(schedules) >= 1
        
        # Verify schedule structure
        schedule = schedules[0]
        assert "id" in schedule
        assert "project_id" in schedule
        assert "room_id" in schedule
        assert "schedule_type" in schedule
        assert "name" in schedule
        assert "surfaces" in schedule
        print(f"✅ Found {len(schedules)} finish schedules for Master Bathroom")
    
    def test_get_existing_schedule_has_surfaces(self):
        """Verify existing schedule has surfaces with materials"""
        response = requests.get(f"{BASE_URL}/api/projects/{TEST_PROJECT_ID}/rooms/{TEST_ROOM_ID}/finish-schedules")
        assert response.status_code == 200
        
        schedules = response.json()
        schedule = next((s for s in schedules if s["id"] == EXISTING_SCHEDULE_ID), None)
        assert schedule is not None, "Existing schedule not found"
        
        surfaces = schedule.get("surfaces", [])
        assert len(surfaces) >= 1, "Schedule should have surfaces"
        
        # Check Back Wall has materials with patterns
        back_wall = next((s for s in surfaces if s["name"] == "Back Wall"), None)
        assert back_wall is not None, "Back Wall surface not found"
        
        materials = back_wall.get("materials", [])
        assert len(materials) >= 1, "Back Wall should have materials"
        
        # Verify material has pattern
        material_with_pattern = next((m for m in materials if m.get("pattern")), None)
        assert material_with_pattern is not None, "At least one material should have a pattern"
        print(f"✅ Back Wall has {len(materials)} materials with patterns")
    
    def test_create_finish_schedule(self):
        """POST /api/projects/{project_id}/rooms/{room_id}/finish-schedules"""
        test_name = f"TEST_Schedule_{uuid.uuid4().hex[:8]}"
        
        response = requests.post(
            f"{BASE_URL}/api/projects/{TEST_PROJECT_ID}/rooms/{TEST_ROOM_ID}/finish-schedules",
            json={
                "schedule_type": "tile",
                "name": test_name
            }
        )
        assert response.status_code == 200
        
        schedule = response.json()
        assert schedule["name"] == test_name
        assert schedule["schedule_type"] == "tile"
        assert schedule["project_id"] == TEST_PROJECT_ID
        assert schedule["room_id"] == TEST_ROOM_ID
        assert "surfaces" in schedule
        assert len(schedule["surfaces"]) >= 1  # Should have default surfaces
        
        # Store for cleanup
        self.__class__.created_schedule_id = schedule["id"]
        print(f"✅ Created schedule: {test_name}")
        return schedule["id"]
    
    def test_update_finish_schedule(self):
        """PUT /api/projects/{project_id}/finish-schedules/{schedule_id}"""
        schedule_id = getattr(self.__class__, 'created_schedule_id', None)
        if not schedule_id:
            schedule_id = self.test_create_finish_schedule()
        
        # Update with new surfaces containing materials and patterns
        updated_surfaces = [
            {
                "id": str(uuid.uuid4()),
                "name": "Test Wall",
                "surface_type": "wall",
                "materials": [
                    {
                        "id": str(uuid.uuid4()),
                        "item_id": "test-item-1",
                        "name": "Test Tile",
                        "vendor": "Test Vendor",
                        "sku": "TEST-001",
                        "size": "12x12",
                        "color": "White",
                        "image": "https://example.com/tile.jpg",
                        "link": "",
                        "position_label": "main_wall",
                        "pattern": "herringbone"  # CSS mask-image pattern
                    }
                ],
                "measurement_lines": []
            }
        ]
        
        response = requests.put(
            f"{BASE_URL}/api/projects/{TEST_PROJECT_ID}/finish-schedules/{schedule_id}",
            json={
                "surfaces": updated_surfaces
            }
        )
        assert response.status_code == 200
        
        updated = response.json()
        assert len(updated["surfaces"]) == 1
        assert updated["surfaces"][0]["name"] == "Test Wall"
        assert len(updated["surfaces"][0]["materials"]) == 1
        assert updated["surfaces"][0]["materials"][0]["pattern"] == "herringbone"
        print(f"✅ Updated schedule with herringbone pattern material")
    
    def test_delete_finish_schedule(self):
        """DELETE /api/projects/{project_id}/finish-schedules/{schedule_id}"""
        schedule_id = getattr(self.__class__, 'created_schedule_id', None)
        if not schedule_id:
            schedule_id = self.test_create_finish_schedule()
        
        response = requests.delete(
            f"{BASE_URL}/api/projects/{TEST_PROJECT_ID}/finish-schedules/{schedule_id}"
        )
        assert response.status_code == 200
        
        result = response.json()
        assert result.get("status") == "deleted"
        print(f"✅ Deleted test schedule")
    
    def test_all_8_patterns_supported(self):
        """Verify all 8 tile patterns are supported in the API"""
        patterns = [
            "stacked_horizontal",
            "stacked_vertical", 
            "offset",
            "one_third_offset",
            "herringbone",
            "basket_weave",
            "stepladder",
            "diagonal"
        ]
        
        # Create a schedule with all patterns
        test_name = f"TEST_AllPatterns_{uuid.uuid4().hex[:8]}"
        
        response = requests.post(
            f"{BASE_URL}/api/projects/{TEST_PROJECT_ID}/rooms/{TEST_ROOM_ID}/finish-schedules",
            json={
                "schedule_type": "tile",
                "name": test_name
            }
        )
        assert response.status_code == 200
        schedule = response.json()
        schedule_id = schedule["id"]
        
        # Update with materials using all patterns
        surfaces = []
        for i, pattern in enumerate(patterns):
            surfaces.append({
                "id": str(uuid.uuid4()),
                "name": f"Wall {i+1}",
                "surface_type": "wall",
                "materials": [{
                    "id": str(uuid.uuid4()),
                    "item_id": f"test-item-{i}",
                    "name": f"Tile {pattern}",
                    "vendor": "Test",
                    "sku": f"TEST-{i}",
                    "size": "12x12",
                    "color": "",
                    "image": "https://example.com/tile.jpg",
                    "link": "",
                    "position_label": "main_wall",
                    "pattern": pattern
                }],
                "measurement_lines": []
            })
        
        response = requests.put(
            f"{BASE_URL}/api/projects/{TEST_PROJECT_ID}/finish-schedules/{schedule_id}",
            json={"surfaces": surfaces}
        )
        assert response.status_code == 200
        
        updated = response.json()
        assert len(updated["surfaces"]) == 8
        
        # Verify all patterns saved correctly
        saved_patterns = [s["materials"][0]["pattern"] for s in updated["surfaces"]]
        for pattern in patterns:
            assert pattern in saved_patterns, f"Pattern {pattern} not saved"
        
        print(f"✅ All 8 patterns supported: {patterns}")
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/projects/{TEST_PROJECT_ID}/finish-schedules/{schedule_id}")


class TestProjectAPI:
    """Test project API for room data"""
    
    def test_get_project_has_rooms(self):
        """GET /api/projects/{project_id} returns rooms"""
        response = requests.get(f"{BASE_URL}/api/projects/{TEST_PROJECT_ID}")
        assert response.status_code == 200
        
        project = response.json()
        assert project["name"] == "Wheeler Ridge Residence"
        assert "rooms" in project
        assert len(project["rooms"]) >= 1
        
        # Find Master Bathroom
        master_bath = next((r for r in project["rooms"] if r["id"] == TEST_ROOM_ID), None)
        assert master_bath is not None
        assert master_bath["name"] == "Master Bathroom"
        print(f"✅ Project has {len(project['rooms'])} rooms including Master Bathroom")
    
    def test_room_has_tile_items(self):
        """Verify room has tile items for material palette"""
        response = requests.get(f"{BASE_URL}/api/projects/{TEST_PROJECT_ID}")
        assert response.status_code == 200
        
        project = response.json()
        master_bath = next((r for r in project["rooms"] if r["id"] == TEST_ROOM_ID), None)
        assert master_bath is not None
        
        # Count items with images
        items_with_images = 0
        for cat in master_bath.get("categories", []):
            for sub in cat.get("subcategories", []):
                for item in sub.get("items", []):
                    if item.get("image_url") or item.get("finish_image") or item.get("photos"):
                        items_with_images += 1
        
        assert items_with_images >= 1, "Room should have items with images for material palette"
        print(f"✅ Master Bathroom has {items_with_images} items with images")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])

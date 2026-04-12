"""
Test Suite for Room Finish Schedule Feature - Iteration 43
Tests the tile extraction and pattern rendering feature including:
- GET /api/projects/{id}/rooms/{room_id}/finish-schedules
- POST /api/projects/{id}/rooms/{room_id}/finish-schedules
- PUT /api/projects/{id}/finish-schedules/{schedule_id}
- DELETE /api/projects/{id}/finish-schedules/{schedule_id}
- tile_crop field persistence
"""

import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://design-preview-131.preview.emergentagent.com').rstrip('/')

# Test project and room IDs from the demo data (updated for iteration 44)
TEST_PROJECT_ID = "a3f6f6c5-0cbd-41c3-a997-34321e21cea4"
TEST_ROOM_ID = "c607262f-28b6-418c-a5b3-2812e0830bc7"


class TestFinishScheduleAPI:
    """Test finish schedule CRUD operations"""
    
    def test_get_room_finish_schedules(self):
        """Test GET /api/projects/{id}/rooms/{room_id}/finish-schedules"""
        response = requests.get(f"{BASE_URL}/api/projects/{TEST_PROJECT_ID}/rooms/{TEST_ROOM_ID}/finish-schedules")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        
        # Should have at least one schedule (Primary Shower)
        assert len(data) >= 1, "Should have at least one schedule"
        
        # Check schedule structure
        schedule = data[0]
        assert "id" in schedule, "Schedule should have id"
        assert "name" in schedule, "Schedule should have name"
        assert "schedule_type" in schedule, "Schedule should have schedule_type"
        assert "surfaces" in schedule, "Schedule should have surfaces"
        
        print(f"✓ Found {len(data)} schedules for room")
        for s in data:
            print(f"  - {s['name']} (type: {s['schedule_type']}, surfaces: {len(s.get('surfaces', []))})")
    
    def test_create_finish_schedule(self):
        """Test POST /api/projects/{id}/rooms/{room_id}/finish-schedules"""
        unique_name = f"Test Schedule {uuid.uuid4().hex[:8]}"
        
        payload = {
            "schedule_type": "tile",
            "name": unique_name
        }
        
        response = requests.post(
            f"{BASE_URL}/api/projects/{TEST_PROJECT_ID}/rooms/{TEST_ROOM_ID}/finish-schedules",
            json=payload
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data["name"] == unique_name, "Name should match"
        assert data["schedule_type"] == "tile", "Type should be tile"
        assert "surfaces" in data, "Should have surfaces"
        assert len(data["surfaces"]) > 0, "Should have default surfaces"
        
        # Store for cleanup
        self.created_schedule_id = data["id"]
        
        print(f"✓ Created schedule: {unique_name}")
        print(f"  - ID: {data['id']}")
        print(f"  - Surfaces: {len(data['surfaces'])}")
        
        return data["id"]
    
    def test_update_finish_schedule_with_tile_crop(self):
        """Test PUT /api/projects/{id}/finish-schedules/{schedule_id} with tile_crop data"""
        # First create a schedule
        unique_name = f"Crop Test {uuid.uuid4().hex[:8]}"
        
        create_response = requests.post(
            f"{BASE_URL}/api/projects/{TEST_PROJECT_ID}/rooms/{TEST_ROOM_ID}/finish-schedules",
            json={"schedule_type": "tile", "name": unique_name}
        )
        assert create_response.status_code == 200
        schedule = create_response.json()
        schedule_id = schedule["id"]
        
        # Update with tile_crop data
        tile_crop = {"x": 50, "y": 50, "w": 100, "h": 100}
        
        updated_surfaces = schedule["surfaces"]
        if len(updated_surfaces) > 0:
            # Add a material with tile_crop to the first surface
            updated_surfaces[0]["materials"] = [{
                "id": str(uuid.uuid4()),
                "item_id": "test-item-id",
                "name": "Test Tile",
                "vendor": "Test Vendor",
                "sku": "TEST-001",
                "size": "12x12",
                "color": "White",
                "image": "https://example.com/tile.png",
                "link": "",
                "position_label": "ceiling",
                "pattern": "herringbone",
                "tile_crop": tile_crop
            }]
        
        update_payload = {
            "surfaces": updated_surfaces
        }
        
        response = requests.put(
            f"{BASE_URL}/api/projects/{TEST_PROJECT_ID}/finish-schedules/{schedule_id}",
            json=update_payload
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        
        # Verify tile_crop was saved
        if len(data["surfaces"]) > 0 and len(data["surfaces"][0]["materials"]) > 0:
            saved_crop = data["surfaces"][0]["materials"][0].get("tile_crop")
            assert saved_crop is not None, "tile_crop should be saved"
            assert saved_crop["x"] == 50, "tile_crop x should be 50"
            assert saved_crop["y"] == 50, "tile_crop y should be 50"
            assert saved_crop["w"] == 100, "tile_crop w should be 100"
            assert saved_crop["h"] == 100, "tile_crop h should be 100"
            print(f"✓ tile_crop saved correctly: {saved_crop}")
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/projects/{TEST_PROJECT_ID}/finish-schedules/{schedule_id}")
        
        print(f"✓ Updated schedule with tile_crop data")
    
    def test_update_finish_schedule_with_pattern(self):
        """Test updating a schedule with pattern selection"""
        # First create a schedule
        unique_name = f"Pattern Test {uuid.uuid4().hex[:8]}"
        
        create_response = requests.post(
            f"{BASE_URL}/api/projects/{TEST_PROJECT_ID}/rooms/{TEST_ROOM_ID}/finish-schedules",
            json={"schedule_type": "tile", "name": unique_name}
        )
        assert create_response.status_code == 200
        schedule = create_response.json()
        schedule_id = schedule["id"]
        
        # Update with pattern
        updated_surfaces = schedule["surfaces"]
        if len(updated_surfaces) > 0:
            updated_surfaces[0]["materials"] = [{
                "id": str(uuid.uuid4()),
                "item_id": "test-item-id",
                "name": "Test Tile",
                "vendor": "Test Vendor",
                "sku": "TEST-001",
                "size": "12x12",
                "color": "White",
                "image": "https://example.com/tile.png",
                "link": "",
                "position_label": "main_wall",
                "pattern": "basket_weave",
                "tile_crop": {"x": 10, "y": 10, "w": 80, "h": 80}
            }]
        
        update_payload = {
            "surfaces": updated_surfaces
        }
        
        response = requests.put(
            f"{BASE_URL}/api/projects/{TEST_PROJECT_ID}/finish-schedules/{schedule_id}",
            json=update_payload
        )
        
        assert response.status_code == 200
        
        data = response.json()
        
        # Verify pattern was saved
        if len(data["surfaces"]) > 0 and len(data["surfaces"][0]["materials"]) > 0:
            saved_pattern = data["surfaces"][0]["materials"][0].get("pattern")
            assert saved_pattern == "basket_weave", f"Pattern should be basket_weave, got {saved_pattern}"
            print(f"✓ Pattern saved correctly: {saved_pattern}")
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/projects/{TEST_PROJECT_ID}/finish-schedules/{schedule_id}")
        
        print(f"✓ Updated schedule with pattern")
    
    def test_delete_finish_schedule(self):
        """Test DELETE /api/projects/{id}/finish-schedules/{schedule_id}"""
        # First create a schedule to delete
        unique_name = f"Delete Test {uuid.uuid4().hex[:8]}"
        
        create_response = requests.post(
            f"{BASE_URL}/api/projects/{TEST_PROJECT_ID}/rooms/{TEST_ROOM_ID}/finish-schedules",
            json={"schedule_type": "tile", "name": unique_name}
        )
        assert create_response.status_code == 200
        schedule_id = create_response.json()["id"]
        
        # Delete the schedule
        response = requests.delete(
            f"{BASE_URL}/api/projects/{TEST_PROJECT_ID}/finish-schedules/{schedule_id}"
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        # Verify it's deleted
        get_response = requests.get(
            f"{BASE_URL}/api/projects/{TEST_PROJECT_ID}/rooms/{TEST_ROOM_ID}/finish-schedules"
        )
        schedules = get_response.json()
        schedule_ids = [s["id"] for s in schedules]
        assert schedule_id not in schedule_ids, "Deleted schedule should not be in list"
        
        print(f"✓ Deleted schedule: {schedule_id}")
    
    def test_all_8_patterns_supported(self):
        """Test that all 8 tile patterns are supported"""
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
        
        # Create a schedule
        unique_name = f"Pattern Support Test {uuid.uuid4().hex[:8]}"
        
        create_response = requests.post(
            f"{BASE_URL}/api/projects/{TEST_PROJECT_ID}/rooms/{TEST_ROOM_ID}/finish-schedules",
            json={"schedule_type": "tile", "name": unique_name}
        )
        assert create_response.status_code == 200
        schedule = create_response.json()
        schedule_id = schedule["id"]
        
        # Test each pattern
        for pattern in patterns:
            updated_surfaces = schedule["surfaces"]
            if len(updated_surfaces) > 0:
                updated_surfaces[0]["materials"] = [{
                    "id": str(uuid.uuid4()),
                    "item_id": "test-item-id",
                    "name": "Test Tile",
                    "vendor": "Test Vendor",
                    "sku": "TEST-001",
                    "size": "12x12",
                    "color": "White",
                    "image": "https://example.com/tile.png",
                    "link": "",
                    "position_label": "main_wall",
                    "pattern": pattern,
                    "tile_crop": {"x": 10, "y": 10, "w": 80, "h": 80}
                }]
            
            response = requests.put(
                f"{BASE_URL}/api/projects/{TEST_PROJECT_ID}/finish-schedules/{schedule_id}",
                json={"surfaces": updated_surfaces}
            )
            
            assert response.status_code == 200, f"Pattern {pattern} should be supported"
            
            data = response.json()
            saved_pattern = data["surfaces"][0]["materials"][0].get("pattern")
            assert saved_pattern == pattern, f"Pattern should be {pattern}, got {saved_pattern}"
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/projects/{TEST_PROJECT_ID}/finish-schedules/{schedule_id}")
        
        print(f"✓ All 8 patterns supported: {', '.join(patterns)}")


class TestMaterialPalette:
    """Test that material palette items are available"""
    
    def test_room_has_tile_items(self):
        """Test that the room has tile items with images for the palette"""
        response = requests.get(f"{BASE_URL}/api/projects/{TEST_PROJECT_ID}")
        
        assert response.status_code == 200
        
        project = response.json()
        rooms = project.get("rooms", [])
        
        # Find Master Bathroom
        master_bath = None
        for room in rooms:
            if room["id"] == TEST_ROOM_ID:
                master_bath = room
                break
        
        assert master_bath is not None, "Master Bathroom should exist"
        
        # Count items with images
        items_with_images = []
        for cat in master_bath.get("categories", []):
            for sub in cat.get("subcategories", []):
                for item in sub.get("items", []):
                    if item.get("image_url"):
                        items_with_images.append(item)
        
        assert len(items_with_images) >= 4, f"Should have at least 4 items with images, got {len(items_with_images)}"
        
        print(f"✓ Found {len(items_with_images)} items with images:")
        for item in items_with_images:
            print(f"  - {item['name']} ({item.get('vendor', 'N/A')})")


class TestProxyImage:
    """Test the proxy-image endpoint for CORS bypass"""
    
    def test_proxy_image_endpoint(self):
        """Test GET /api/proxy-image?url=..."""
        test_url = "https://static.prod-images.emergentagent.com/jobs/7932d827-12dd-45f6-923f-dedc2d66add5/images/1ac7f6ff8285b0790a13035bff206ee25bc5a88f0c649fd5ac5f6eafd371cc04.png"
        
        response = requests.get(
            f"{BASE_URL}/api/proxy-image",
            params={"url": test_url}
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        assert "image" in response.headers.get("Content-Type", ""), "Should return image content type"
        
        print(f"✓ Proxy image endpoint working")
        print(f"  - Content-Type: {response.headers.get('Content-Type')}")
        print(f"  - Content-Length: {response.headers.get('Content-Length', 'N/A')}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])

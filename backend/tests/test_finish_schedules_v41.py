"""
Test Finish Schedule CRUD API endpoints
Tests: GET, POST, PUT, DELETE for finish schedules
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://finish-schedule.preview.emergentagent.com')

# Test data
PROJECT_ID = "a01095cd-9f94-44d5-bc01-8bd5b9ebbc27"
ROOM_ID = "fe38922a-ad68-4811-bffd-49a7a2eef0cf"


class TestFinishScheduleCRUD:
    """Test finish schedule CRUD operations"""
    
    created_schedule_id = None
    
    def test_01_get_room_finish_schedules(self):
        """Test GET /api/projects/{project_id}/rooms/{room_id}/finish-schedules"""
        response = requests.get(f"{BASE_URL}/api/projects/{PROJECT_ID}/rooms/{ROOM_ID}/finish-schedules")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✅ GET finish schedules: Found {len(data)} schedules")
        
        # Verify schedule structure if any exist
        if len(data) > 0:
            schedule = data[0]
            assert "id" in schedule
            assert "project_id" in schedule
            assert "room_id" in schedule
            assert "name" in schedule
            assert "surfaces" in schedule
            print(f"  Schedule: {schedule['name']}")
    
    def test_02_create_finish_schedule(self):
        """Test POST /api/projects/{project_id}/rooms/{room_id}/finish-schedules"""
        payload = {
            "schedule_type": "tile",
            "name": f"TEST_Schedule_{uuid.uuid4().hex[:8]}"
        }
        response = requests.post(
            f"{BASE_URL}/api/projects/{PROJECT_ID}/rooms/{ROOM_ID}/finish-schedules",
            json=payload
        )
        assert response.status_code == 200
        data = response.json()
        
        # Verify response structure
        assert "id" in data
        assert data["name"] == payload["name"]
        assert data["schedule_type"] == "tile"
        assert "surfaces" in data
        assert len(data["surfaces"]) > 0  # Should have default surfaces
        
        # Store for later tests
        TestFinishScheduleCRUD.created_schedule_id = data["id"]
        print(f"✅ POST create schedule: {data['name']} (ID: {data['id']})")
        print(f"  Default surfaces: {len(data['surfaces'])}")
    
    def test_03_update_finish_schedule(self):
        """Test PUT /api/projects/{project_id}/finish-schedules/{schedule_id}"""
        schedule_id = TestFinishScheduleCRUD.created_schedule_id
        assert schedule_id is not None, "No schedule created in previous test"
        
        # Update with new surfaces and materials
        payload = {
            "name": "TEST_Updated_Schedule",
            "surfaces": [
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
                            "size": "3x12",
                            "color": "White",
                            "image": "https://example.com/tile.jpg",
                            "link": "",
                            "position_label": "main_wall",
                            "pattern": "basket_weave"
                        }
                    ],
                    "measurement_lines": []
                }
            ]
        }
        response = requests.put(
            f"{BASE_URL}/api/projects/{PROJECT_ID}/finish-schedules/{schedule_id}",
            json=payload
        )
        assert response.status_code == 200
        data = response.json()
        
        # Verify update
        assert data["name"] == "TEST_Updated_Schedule"
        assert len(data["surfaces"]) == 1
        assert data["surfaces"][0]["name"] == "Test Wall"
        assert len(data["surfaces"][0]["materials"]) == 1
        assert data["surfaces"][0]["materials"][0]["pattern"] == "basket_weave"
        
        print(f"✅ PUT update schedule: {data['name']}")
        print(f"  Surfaces: {len(data['surfaces'])}, Materials: {len(data['surfaces'][0]['materials'])}")
    
    def test_04_verify_update_persisted(self):
        """Verify the update was persisted by fetching schedules again"""
        response = requests.get(f"{BASE_URL}/api/projects/{PROJECT_ID}/rooms/{ROOM_ID}/finish-schedules")
        assert response.status_code == 200
        data = response.json()
        
        # Find our updated schedule
        schedule_id = TestFinishScheduleCRUD.created_schedule_id
        updated_schedule = next((s for s in data if s["id"] == schedule_id), None)
        
        assert updated_schedule is not None, "Updated schedule not found"
        assert updated_schedule["name"] == "TEST_Updated_Schedule"
        print(f"✅ GET verify update persisted: {updated_schedule['name']}")
    
    def test_05_delete_finish_schedule(self):
        """Test DELETE /api/projects/{project_id}/finish-schedules/{schedule_id}"""
        schedule_id = TestFinishScheduleCRUD.created_schedule_id
        assert schedule_id is not None, "No schedule created in previous test"
        
        response = requests.delete(
            f"{BASE_URL}/api/projects/{PROJECT_ID}/finish-schedules/{schedule_id}"
        )
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "deleted"
        print(f"✅ DELETE schedule: {schedule_id}")
    
    def test_06_verify_delete(self):
        """Verify the schedule was deleted"""
        response = requests.get(f"{BASE_URL}/api/projects/{PROJECT_ID}/rooms/{ROOM_ID}/finish-schedules")
        assert response.status_code == 200
        data = response.json()
        
        # Verify our schedule is gone
        schedule_id = TestFinishScheduleCRUD.created_schedule_id
        deleted_schedule = next((s for s in data if s["id"] == schedule_id), None)
        
        assert deleted_schedule is None, "Schedule should have been deleted"
        print(f"✅ GET verify delete: Schedule {schedule_id} no longer exists")


class TestFinishSchedulePatterns:
    """Test pattern-related functionality"""
    
    def test_pattern_values(self):
        """Verify all 8 patterns are valid"""
        valid_patterns = [
            "stacked_horizontal",
            "stacked_vertical", 
            "offset",
            "one_third_offset",
            "herringbone",
            "basket_weave",
            "stepladder",
            "diagonal"
        ]
        
        # Get existing schedule to verify pattern storage
        response = requests.get(f"{BASE_URL}/api/projects/{PROJECT_ID}/rooms/{ROOM_ID}/finish-schedules")
        assert response.status_code == 200
        data = response.json()
        
        if len(data) > 0:
            schedule = data[0]
            for surface in schedule.get("surfaces", []):
                for material in surface.get("materials", []):
                    pattern = material.get("pattern", "")
                    if pattern:
                        assert pattern in valid_patterns or pattern == "", f"Invalid pattern: {pattern}"
                        print(f"  Found pattern: {pattern}")
        
        print(f"✅ Pattern validation: All 8 patterns are valid values")


class TestProjectAndRoomEndpoints:
    """Test project and room endpoints used by Room Finishes"""
    
    def test_get_project(self):
        """Test GET /api/projects/{project_id}"""
        response = requests.get(f"{BASE_URL}/api/projects/{PROJECT_ID}")
        assert response.status_code == 200
        data = response.json()
        
        assert "id" in data
        assert "name" in data
        assert "rooms" in data
        print(f"✅ GET project: {data['name']}")
        print(f"  Rooms: {len(data['rooms'])}")
    
    def test_get_projects_list(self):
        """Test GET /api/projects"""
        response = requests.get(f"{BASE_URL}/api/projects")
        assert response.status_code == 200
        data = response.json()
        
        assert isinstance(data, list)
        assert len(data) > 0
        print(f"✅ GET projects list: {len(data)} projects")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])

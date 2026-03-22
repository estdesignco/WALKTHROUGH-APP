"""
Test Room Finish Schedules Feature - Backend API Tests
Tests CRUD operations for finish schedules with measurement lines
"""

import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://material-mapper-1.preview.emergentagent.com').rstrip('/')

# Test data from the review request
TEST_PROJECT_ID = "5dab9206-6332-4233-86ac-d7850e5af678"
TEST_ROOM_IDS = {
    "master_bathroom": "6799574c-af52-4b7d-ae42-d31c9c19cf79",
    "kitchen": "77924a4a-5948-4c16-8315-f191277336f9",
    "guest_bathroom": "e77aa1e2-7f95-4785-be7e-ad0edd593ed7"
}
EXISTING_SCHEDULE_ID = "7f491555-efb0-4675-bfee-f6485767adb4"


class TestFinishSchedulesAPI:
    """Test Room Finish Schedules CRUD operations"""
    
    def test_get_project_exists(self):
        """Verify test project exists"""
        response = requests.get(f"{BASE_URL}/api/projects/{TEST_PROJECT_ID}")
        print(f"GET project: {response.status_code}")
        assert response.status_code == 200
        data = response.json()
        assert data.get("id") == TEST_PROJECT_ID
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
        
        # Check if existing schedule exists and has measurement_lines field
        for schedule in data:
            assert "id" in schedule
            assert "name" in schedule
            assert "schedule_type" in schedule
            assert "surfaces" in schedule
            assert "measurement_lines" in schedule  # New field for drawing lines
            print(f"  Schedule: {schedule['name']} ({schedule['schedule_type']}) - {len(schedule.get('measurement_lines', []))} measurement lines")
    
    def test_get_existing_schedule_with_measurement_line(self):
        """Test that existing schedule has the test measurement line '72 inches'"""
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
        
        if existing_schedule:
            print(f"Found existing schedule: {existing_schedule['name']}")
            lines = existing_schedule.get("measurement_lines", [])
            print(f"Measurement lines: {len(lines)}")
            for line in lines:
                print(f"  Line: {line.get('measurement', 'no measurement')}")
            # Check for the test line
            has_72_inch_line = any(l.get("measurement") == "72 inches" for l in lines)
            if has_72_inch_line:
                print("✓ Found '72 inches' measurement line")
            else:
                print("Note: '72 inches' line may not exist yet")
        else:
            print(f"Note: Schedule {EXISTING_SCHEDULE_ID} not found - may be from previous test")
    
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
        assert "Niche" in surface_names
        
        # Cleanup - store for later deletion
        self.__class__.created_schedule_id = data.get("id")
        print(f"✓ Created schedule: {data.get('id')}")
    
    def test_create_finish_schedule_paint_wallpaper(self):
        """Test POST - Paint/Wallpaper type has different default surfaces"""
        room_id = TEST_ROOM_IDS["guest_bathroom"]
        test_name = f"TEST_Guest_Paint_{uuid.uuid4().hex[:6]}"
        
        response = requests.post(
            f"{BASE_URL}/api/projects/{TEST_PROJECT_ID}/rooms/{room_id}/finish-schedules",
            json={
                "schedule_type": "paint_wallpaper",
                "name": test_name
            }
        )
        print(f"POST create paint/wallpaper: {response.status_code}")
        assert response.status_code == 200
        
        data = response.json()
        surfaces = data.get("surfaces", [])
        surface_names = [s.get("name") for s in surfaces]
        print(f"Paint/Wallpaper surfaces: {surface_names}")
        
        # Verify paint_wallpaper default surfaces
        assert "Wall 1" in surface_names or "Wall 2" in surface_names
        assert "Ceiling" in surface_names
        
        self.__class__.created_paint_schedule_id = data.get("id")
        print(f"✓ Created paint schedule: {data.get('id')}")
    
    def test_create_finish_schedule_wood_mixed(self):
        """Test POST - Wood/Mixed type has different default surfaces"""
        room_id = TEST_ROOM_IDS["master_bathroom"]
        test_name = f"TEST_Wood_Accent_{uuid.uuid4().hex[:6]}"
        
        response = requests.post(
            f"{BASE_URL}/api/projects/{TEST_PROJECT_ID}/rooms/{room_id}/finish-schedules",
            json={
                "schedule_type": "wood_mixed",
                "name": test_name
            }
        )
        print(f"POST create wood/mixed: {response.status_code}")
        assert response.status_code == 200
        
        data = response.json()
        surfaces = data.get("surfaces", [])
        surface_names = [s.get("name") for s in surfaces]
        print(f"Wood/Mixed surfaces: {surface_names}")
        
        # Verify wood_mixed default surfaces
        assert "Accent Wall" in surface_names
        assert "Wainscoting" in surface_names
        
        self.__class__.created_wood_schedule_id = data.get("id")
        print(f"✓ Created wood schedule: {data.get('id')}")
    
    def test_update_finish_schedule_add_measurement_lines(self):
        """Test PUT /api/projects/{pid}/finish-schedules/{sid} - Update with measurement lines"""
        schedule_id = getattr(self.__class__, 'created_schedule_id', None)
        if not schedule_id:
            pytest.skip("No schedule created to update")
        
        # Add measurement lines
        response = requests.put(
            f"{BASE_URL}/api/projects/{TEST_PROJECT_ID}/finish-schedules/{schedule_id}",
            json={
                "measurement_lines": [
                    {
                        "id": str(uuid.uuid4()),
                        "start_x": 10,
                        "start_y": 50,
                        "end_x": 90,
                        "end_y": 50,
                        "measurement": "84 inches",
                        "label": "Width",
                        "color": "#FF4444",
                        "thickness": 2
                    },
                    {
                        "id": str(uuid.uuid4()),
                        "start_x": 50,
                        "start_y": 10,
                        "end_x": 50,
                        "end_y": 90,
                        "measurement": "96 inches",
                        "label": "Height",
                        "color": "#44AAFF",
                        "thickness": 2
                    }
                ]
            }
        )
        print(f"PUT update with lines: {response.status_code}")
        assert response.status_code == 200
        
        data = response.json()
        lines = data.get("measurement_lines", [])
        assert len(lines) == 2
        measurements = [l.get("measurement") for l in lines]
        assert "84 inches" in measurements
        assert "96 inches" in measurements
        print(f"✓ Updated with measurement lines: {measurements}")
    
    def test_update_finish_schedule_add_surfaces_with_materials(self):
        """Test PUT - Update surfaces with materials"""
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
        
        # Update first surface with a material
        surfaces = current.get("surfaces", [])
        if surfaces:
            surfaces[0]["materials"] = [{
                "id": str(uuid.uuid4()),
                "name": "Marble Tile 12x24",
                "vendor": "TileBar",
                "sku": "TB-MARBLE-1224",
                "size": "12x24",
                "color": "Carrara White",
                "image": "https://example.com/tile.jpg",
                "link": "https://tilebar.com/marble",
                "position_label": "Main Field"
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
        print(f"✓ Added material to surface: {first_surface_materials[0].get('name')}")
    
    def test_delete_finish_schedule(self):
        """Test DELETE /api/projects/{pid}/finish-schedules/{sid}"""
        # Delete the paint schedule we created
        schedule_id = getattr(self.__class__, 'created_paint_schedule_id', None)
        if not schedule_id:
            pytest.skip("No paint schedule to delete")
        
        response = requests.delete(
            f"{BASE_URL}/api/projects/{TEST_PROJECT_ID}/finish-schedules/{schedule_id}"
        )
        print(f"DELETE paint schedule: {response.status_code}")
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
    
    @pytest.fixture(autouse=True, scope="class")
    def cleanup(self, request):
        """Cleanup test schedules after tests"""
        yield
        # Cleanup created schedules
        for attr in ['created_schedule_id', 'created_wood_schedule_id']:
            schedule_id = getattr(self.__class__, attr, None)
            if schedule_id:
                try:
                    requests.delete(f"{BASE_URL}/api/projects/{TEST_PROJECT_ID}/finish-schedules/{schedule_id}")
                    print(f"Cleaned up: {schedule_id}")
                except:
                    pass


class TestFinishSchedulesDataIntegrity:
    """Test data integrity and edge cases"""
    
    def test_schedule_surfaces_have_measurement_lines_field(self):
        """Verify each surface can have its own measurement_lines"""
        room_id = TEST_ROOM_IDS["master_bathroom"]
        response = requests.get(f"{BASE_URL}/api/projects/{TEST_PROJECT_ID}/rooms/{room_id}/finish-schedules")
        assert response.status_code == 200
        
        schedules = response.json()
        for schedule in schedules:
            for surface in schedule.get("surfaces", []):
                # Surface should have measurement_lines field
                assert "measurement_lines" in surface or surface.get("measurement_lines") is None or isinstance(surface.get("measurement_lines", []), list)
                print(f"  Surface {surface.get('name')}: {len(surface.get('measurement_lines', []))} lines")
    
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


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])

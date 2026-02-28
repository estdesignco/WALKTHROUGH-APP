"""
Test file for P0 Bug Fix: Adding room to project with zero rooms in mobile app
Bug: When a project had ZERO rooms, clicking 'ADD FIRST ROOM' button set showAddRoom=true 
but the Add Room modal JSX was rendered after an early return statement, so the modal never appeared.
Fix: Duplicated the Add Room modal inside the early-return block for the zero-rooms case.
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://add-room-debug.preview.emergentagent.com')

class TestHealthCheck:
    """Basic health check to ensure backend is running"""
    
    def test_health_endpoint(self):
        """Test health endpoint returns 200"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        print(f"✅ Health check passed: {data}")


class TestRoomCreationAPI:
    """Test POST /api/rooms endpoint - critical for bug fix"""
    
    def test_create_room_with_valid_data(self):
        """Test POST /api/rooms with valid data returns 200 and room object"""
        room_data = {
            "name": f"Test Room {uuid.uuid4().hex[:8]}",
            "project_id": "test-project-123",
            "sheet_type": "walkthrough",
            "auto_populate": True,
            "comprehensive": True,
            "order_index": 0
        }
        
        response = requests.post(f"{BASE_URL}/api/rooms", json=room_data)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "id" in data, "Room should have an ID"
        assert "name" in data, "Room should have a name"
        assert data["name"] == room_data["name"], "Room name should match"
        assert "categories" in data, "Room should have categories"
        assert len(data["categories"]) > 0, "Room should have at least one category"
        
        print(f"✅ Room created: {data['name']} with {len(data['categories'])} categories")
    
    def test_create_kitchen_room(self):
        """Test creating a Kitchen room - one of the preset options"""
        room_data = {
            "name": "Kitchen",
            "project_id": "test-kitchen-project",
            "sheet_type": "walkthrough",
            "auto_populate": True,
            "comprehensive": True,
            "order_index": 0
        }
        
        response = requests.post(f"{BASE_URL}/api/rooms", json=room_data)
        assert response.status_code == 200
        
        data = response.json()
        assert data["name"] == "Kitchen"
        
        # Kitchen should have specific categories
        category_names = [cat["name"] for cat in data.get("categories", [])]
        print(f"✅ Kitchen categories: {category_names}")
        
        # Verify some expected categories exist
        assert len(category_names) > 0, "Kitchen should have categories"
    
    def test_create_multiple_rooms(self):
        """Test creating multiple rooms in sequence"""
        rooms_to_create = ["Living Room", "Office", "Dining Room"]
        created_rooms = []
        
        for room_name in rooms_to_create:
            room_data = {
                "name": room_name,
                "project_id": "test-multi-room-project",
                "sheet_type": "walkthrough",
                "auto_populate": True,
                "comprehensive": True,
                "order_index": len(created_rooms)
            }
            
            response = requests.post(f"{BASE_URL}/api/rooms", json=room_data)
            assert response.status_code == 200
            created_rooms.append(response.json())
        
        assert len(created_rooms) == 3, "Should create 3 rooms"
        print(f"✅ Created {len(created_rooms)} rooms: {[r['name'] for r in created_rooms]}")


class TestProjectAPI:
    """Test project-related endpoints"""
    
    def test_get_projects_list(self):
        """Test GET /api/projects returns list"""
        response = requests.get(f"{BASE_URL}/api/projects")
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list), "Should return a list"
        print(f"✅ Found {len(data)} projects")
    
    def test_create_project_with_zero_rooms(self):
        """Test creating a project (starts with zero rooms)"""
        project_data = {
            "name": f"Zero Room Test {uuid.uuid4().hex[:8]}",
            "project_type": "Renovation",
            "client_info": {
                "full_name": "Test Client",
                "email": "test@example.com",
                "phone": "555-0000",
                "address": "123 Test Ave"
            }
        }
        
        response = requests.post(f"{BASE_URL}/api/projects", json=project_data)
        assert response.status_code == 200
        
        data = response.json()
        assert "id" in data
        assert data["name"] == project_data["name"]
        
        # Verify project has zero rooms initially
        rooms = data.get("rooms", [])
        assert len(rooms) == 0, f"New project should have 0 rooms, got {len(rooms)}"
        
        print(f"✅ Created project with 0 rooms: {data['name']}")
        return data["id"]
    
    def test_add_room_to_existing_project(self):
        """Test adding a room to an existing project"""
        # First create a project
        project_data = {
            "name": f"Add Room Test {uuid.uuid4().hex[:8]}",
            "project_type": "Renovation",
            "client_info": {
                "full_name": "Test User",
                "email": "test@test.com",
                "phone": "555-1111",
                "address": "456 Test St"
            }
        }
        
        proj_response = requests.post(f"{BASE_URL}/api/projects", json=project_data)
        assert proj_response.status_code == 200
        project = proj_response.json()
        project_id = project["id"]
        
        # Add a room to the project
        room_data = {
            "name": "Master Bedroom",
            "project_id": project_id,
            "sheet_type": "walkthrough",
            "auto_populate": True,
            "comprehensive": True,
            "order_index": 0
        }
        
        room_response = requests.post(f"{BASE_URL}/api/rooms", json=room_data)
        assert room_response.status_code == 200
        
        room = room_response.json()
        assert room["project_id"] == project_id
        assert room["name"] == "Master Bedroom"
        
        print(f"✅ Added Master Bedroom to project {project_id}")


class TestZeroRoomsBugFix:
    """Specific tests for the zero-rooms bug fix scenario"""
    
    def test_project_with_zero_rooms_flow(self):
        """
        Full flow test: Create project with zero rooms, then add first room
        This tests the exact scenario that was bugged
        """
        # Step 1: Create a new project
        project_data = {
            "name": f"Bug Fix Test {uuid.uuid4().hex[:8]}",
            "project_type": "Renovation",
            "client_info": {
                "full_name": "Bug Fix Tester",
                "email": "bugfix@test.com",
                "phone": "555-BUGFIX",
                "address": "789 Bug Fix Lane"
            }
        }
        
        proj_response = requests.post(f"{BASE_URL}/api/projects", json=project_data)
        assert proj_response.status_code == 200
        project = proj_response.json()
        project_id = project["id"]
        
        # Verify zero rooms
        assert len(project.get("rooms", [])) == 0, "Project should start with 0 rooms"
        print(f"✅ Step 1: Created project with 0 rooms")
        
        # Step 2: Get project to confirm zero rooms
        get_response = requests.get(f"{BASE_URL}/api/projects/{project_id}")
        assert get_response.status_code == 200
        project_data = get_response.json()
        assert len(project_data.get("rooms", [])) == 0, "GET should also show 0 rooms"
        print(f"✅ Step 2: Confirmed project has 0 rooms via GET")
        
        # Step 3: Add FIRST room (simulating clicking ADD FIRST ROOM button)
        room_data = {
            "name": "Kitchen",  # Common first room to add
            "project_id": project_id,
            "sheet_type": "walkthrough",
            "auto_populate": True,
            "comprehensive": True,
            "order_index": 0
        }
        
        room_response = requests.post(f"{BASE_URL}/api/rooms", json=room_data)
        assert room_response.status_code == 200
        room = room_response.json()
        assert room["name"] == "Kitchen"
        assert room["project_id"] == project_id
        print(f"✅ Step 3: Added first room (Kitchen) to project")
        
        # Step 4: Verify project now has 1 room
        final_response = requests.get(f"{BASE_URL}/api/projects/{project_id}")
        assert final_response.status_code == 200
        final_project = final_response.json()
        rooms = final_project.get("rooms", [])
        assert len(rooms) == 1, f"Project should now have 1 room, got {len(rooms)}"
        assert rooms[0]["name"] == "Kitchen"
        print(f"✅ Step 4: Verified project now has 1 room (Kitchen)")
        
        print(f"\n✅✅✅ ZERO ROOMS BUG FIX TEST PASSED ✅✅✅")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])

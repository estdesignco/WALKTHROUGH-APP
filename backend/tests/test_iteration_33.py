"""
Test Suite for Interior Design App - Iteration 33
Testing: Project loading, API endpoints, ToDo status, bulk deletion support
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://fix-verification-1.preview.emergentagent.com')
# Use the correct project ID from the API
TEST_PROJECT_ID = "82c5fb51-fd53-4338-807b-7bb58f4d3386"
VENTURE_PROJECT_ID = "82c5fb51-fd53-4338-807b-7bb58f4d3386"  # VENTURE DR. - Test Project


class TestHealthAndBasicAPIs:
    """Test health and basic API endpoints"""
    
    def test_health_endpoint(self):
        """Test /api/health returns healthy status"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data.get("status") == "healthy"
        print(f"✅ Health check passed: {data}")
    
    def test_projects_list(self):
        """Test /api/projects returns list of projects"""
        response = requests.get(f"{BASE_URL}/api/projects")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) > 0
        print(f"✅ Projects list: {len(data)} projects found")


class TestProjectLoading:
    """Test project loading without 'Project not found' error"""
    
    def test_venture_dr_project_loads(self):
        """Test VENTURE DR. project loads correctly"""
        response = requests.get(f"{BASE_URL}/api/projects/{VENTURE_PROJECT_ID}?sheet_type=checklist")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert data.get("name") is not None
        assert "VENTURE" in data.get("name", "").upper()
        print(f"✅ VENTURE DR. project loaded: {data.get('name')}")
    
    def test_project_walkthrough_view(self):
        """Test project loads with walkthrough sheet_type"""
        response = requests.get(f"{BASE_URL}/api/projects/{VENTURE_PROJECT_ID}?sheet_type=walkthrough")
        assert response.status_code == 200
        data = response.json()
        assert "id" in data
        print(f"✅ Walkthrough view loaded for: {data.get('name')}")
    
    def test_project_ffe_view(self):
        """Test project loads with ffe sheet_type"""
        response = requests.get(f"{BASE_URL}/api/projects/{VENTURE_PROJECT_ID}?sheet_type=ffe")
        assert response.status_code == 200
        data = response.json()
        assert "id" in data
        print(f"✅ FFE view loaded for: {data.get('name')}")


class TestToDoAPIs:
    """Test To-Do list API endpoints and status changes"""
    
    def test_get_todos_for_project(self):
        """Test getting To-Do items for a project"""
        response = requests.get(f"{BASE_URL}/api/todos/{VENTURE_PROJECT_ID}")
        assert response.status_code == 200
        data = response.json()
        assert "todos" in data or "success" in data
        print(f"✅ To-Do list retrieved: {len(data.get('todos', []))} items")
    
    def test_create_and_update_todo(self):
        """Test creating a To-Do and updating its status"""
        # Create a new To-Do
        new_todo = {
            "project_id": VENTURE_PROJECT_ID,
            "text": "TEST_TASK: Verify status change works",
            "description": "Testing status dropdown functionality",
            "priority": "medium",
            "status": "pending"
        }
        
        create_response = requests.post(
            f"{BASE_URL}/api/todos",
            json=new_todo,
            headers={"Content-Type": "application/json"}
        )
        assert create_response.status_code == 200, f"Create failed: {create_response.text}"
        created = create_response.json()
        todo_id = created.get("todo", {}).get("id") or created.get("id")
        assert todo_id is not None
        print(f"✅ To-Do created with ID: {todo_id}")
        
        # Update status to 'done'
        update_response = requests.put(
            f"{BASE_URL}/api/todos/{todo_id}",
            json={"status": "done", "completed": True},
            headers={"Content-Type": "application/json"}
        )
        assert update_response.status_code == 200, f"Update failed: {update_response.text}"
        print(f"✅ To-Do status updated to 'done'")
        
        # Delete the test To-Do
        delete_response = requests.delete(f"{BASE_URL}/api/todos/{todo_id}")
        assert delete_response.status_code == 200
        print(f"✅ Test To-Do deleted")


class TestItemStatuses:
    """Test item statuses API"""
    
    def test_get_item_statuses(self):
        """Test getting available item statuses"""
        response = requests.get(f"{BASE_URL}/api/item-statuses")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) > 0
        # Check for checklist-specific statuses
        status_values = [s.get('status', s) if isinstance(s, dict) else s for s in data]
        print(f"✅ Item statuses: {len(status_values)} statuses available")


class TestRoomAndCategoryAPIs:
    """Test room and category APIs for bulk operations support"""
    
    def test_get_rooms_for_project(self):
        """Test getting rooms for a project"""
        response = requests.get(f"{BASE_URL}/api/projects/{VENTURE_PROJECT_ID}?sheet_type=checklist")
        assert response.status_code == 200
        data = response.json()
        rooms = data.get("rooms", [])
        print(f"✅ Project has {len(rooms)} rooms")
    
    def test_categories_available(self):
        """Test getting available categories"""
        response = requests.get(f"{BASE_URL}/api/categories/available")
        assert response.status_code == 200
        data = response.json()
        categories = data.get("categories", [])
        assert len(categories) > 0
        print(f"✅ Available categories: {len(categories)}")


class TestSyncAPIs:
    """Test sync APIs"""
    
    def test_sync_status(self):
        """Test getting sync status for a project"""
        response = requests.get(f"{BASE_URL}/api/sync/status/{VENTURE_PROJECT_ID}")
        # May return 200 or 404 depending on if sync data exists
        assert response.status_code in [200, 404]
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Sync status retrieved: walkthrough={data.get('walkthrough', {}).get('rooms', 0)} rooms")
        else:
            print(f"✅ Sync status endpoint available (no sync data yet)")


class TestRoomColors:
    """Test room colors API"""
    
    def test_get_room_colors(self):
        """Test getting room colors"""
        response = requests.get(f"{BASE_URL}/api/room-colors")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, dict)
        print(f"✅ Room colors: {len(data)} colors available")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])

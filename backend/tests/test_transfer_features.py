"""
Backend API tests for Interior Design Project Management App
Tests for: Item transfers, Photo management, Walkthrough/Checklist features
"""
import pytest
import requests
import os

# Use the preview URL for testing
BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://bugfix-sprint-9.preview.emergentagent.com')

# Test project ID provided
TEST_PROJECT_ID = "26a02fff-c661-478c-b26f-3694c4bb72c8"


class TestHealthAndBasicAPIs:
    """Basic health and connectivity tests"""
    
    def test_health_check(self):
        """Test API health endpoint"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200, f"Health check failed: {response.status_code}"
        print("✅ Health check passed")
    
    def test_root_endpoint(self):
        """Test root endpoint"""
        response = requests.get(f"{BASE_URL}/api/")
        assert response.status_code == 200
        data = response.json()
        assert "message" in data or "status" in data
        print("✅ Root endpoint working")


class TestProjectAPIs:
    """Project-related API tests"""
    
    def test_get_projects_list(self):
        """Test getting list of projects"""
        response = requests.get(f"{BASE_URL}/api/projects")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✅ Got {len(data)} projects")
    
    def test_get_test_project(self):
        """Test getting the specific test project"""
        response = requests.get(f"{BASE_URL}/api/projects/{TEST_PROJECT_ID}")
        assert response.status_code == 200
        data = response.json()
        assert "name" in data
        assert "rooms" in data
        print(f"✅ Got project: {data.get('name')}")
    
    def test_get_project_with_walkthrough_sheet_type(self):
        """Test getting project with walkthrough sheet type"""
        response = requests.get(f"{BASE_URL}/api/projects/{TEST_PROJECT_ID}?sheet_type=walkthrough")
        assert response.status_code == 200
        data = response.json()
        assert "rooms" in data
        print(f"✅ Got project walkthrough with {len(data.get('rooms', []))} rooms")
    
    def test_get_project_with_checklist_sheet_type(self):
        """Test getting project with checklist sheet type"""
        response = requests.get(f"{BASE_URL}/api/projects/{TEST_PROJECT_ID}?sheet_type=checklist")
        assert response.status_code == 200
        data = response.json()
        assert "rooms" in data
        print(f"✅ Got project checklist with {len(data.get('rooms', []))} rooms")


class TestRoomAPIs:
    """Room-related API tests"""
    
    def test_list_rooms(self):
        """Test listing rooms for a project"""
        response = requests.get(f"{BASE_URL}/api/rooms?project_id={TEST_PROJECT_ID}")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✅ Got {len(data)} rooms")
    
    def test_list_walkthrough_rooms(self):
        """Test listing walkthrough rooms"""
        response = requests.get(f"{BASE_URL}/api/rooms?project_id={TEST_PROJECT_ID}&sheet_type=walkthrough")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✅ Got {len(data)} walkthrough rooms")
    
    def test_list_checklist_rooms(self):
        """Test listing checklist rooms"""
        response = requests.get(f"{BASE_URL}/api/rooms?project_id={TEST_PROJECT_ID}&sheet_type=checklist")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✅ Got {len(data)} checklist rooms")


class TestItemAPIs:
    """Item-related API tests"""
    
    def test_create_item(self):
        """Test creating an item - First get a subcategory ID"""
        # Get project to find a valid subcategory
        project_response = requests.get(f"{BASE_URL}/api/projects/{TEST_PROJECT_ID}?sheet_type=walkthrough")
        assert project_response.status_code == 200
        project_data = project_response.json()
        
        subcategory_id = None
        for room in project_data.get('rooms', []):
            for cat in room.get('categories', []):
                for subcat in cat.get('subcategories', []):
                    subcategory_id = subcat.get('id')
                    break
                if subcategory_id:
                    break
            if subcategory_id:
                break
        
        if not subcategory_id:
            pytest.skip("No subcategory found to create item")
        
        # Create an item with proper data types (no empty string for quantity)
        item_data = {
            "name": "TEST_Transfer_Item",
            "vendor": "Test Vendor",
            "sku": "TEST-SKU-001",
            "cost": 100.0,
            "size": "24x36",
            "finish_color": "",
            "quantity": None,  # null instead of empty string
            "subcategory_id": subcategory_id,
            "status": ""
        }
        
        response = requests.post(
            f"{BASE_URL}/api/items",
            json=item_data
        )
        assert response.status_code in [200, 201], f"Failed to create item: {response.status_code} - {response.text}"
        
        created_item = response.json()
        assert "id" in created_item
        print(f"✅ Created item: {created_item.get('name')}")
        
        # Cleanup - delete the test item
        item_id = created_item.get('id')
        if item_id:
            delete_response = requests.delete(f"{BASE_URL}/api/items/{item_id}")
            assert delete_response.status_code in [200, 204]
            print("✅ Cleaned up test item")
    
    def test_update_item_status(self):
        """Test updating an item status (checkbox behavior)"""
        # Get project to find an item
        project_response = requests.get(f"{BASE_URL}/api/projects/{TEST_PROJECT_ID}?sheet_type=walkthrough")
        assert project_response.status_code == 200
        project_data = project_response.json()
        
        item_id = None
        original_status = None
        for room in project_data.get('rooms', []):
            for cat in room.get('categories', []):
                for subcat in cat.get('subcategories', []):
                    for item in subcat.get('items', []):
                        item_id = item.get('id')
                        original_status = item.get('status', '')
                        break
                    if item_id:
                        break
                if item_id:
                    break
            if item_id:
                break
        
        if not item_id:
            pytest.skip("No item found to update")
        
        # Update status to PICKED
        response = requests.put(
            f"{BASE_URL}/api/items/{item_id}",
            json={"status": "PICKED"}
        )
        assert response.status_code == 200, f"Failed to update status: {response.status_code}"
        
        # Verify update
        get_response = requests.get(f"{BASE_URL}/api/items/{item_id}")
        assert get_response.status_code == 200
        updated_item = get_response.json()
        assert updated_item.get('status') == "PICKED"
        print(f"✅ Updated item status to PICKED")
        
        # Restore original status
        requests.put(
            f"{BASE_URL}/api/items/{item_id}",
            json={"status": original_status if original_status else ""}
        )


class TestCategoryAPIs:
    """Category-related API tests"""
    
    def test_get_available_categories(self):
        """Test getting available categories"""
        response = requests.get(f"{BASE_URL}/api/categories/available")
        assert response.status_code == 200
        data = response.json()
        assert "categories" in data
        assert len(data["categories"]) > 0
        print(f"✅ Got {len(data['categories'])} available categories")
    
    def test_get_category_options(self):
        """Test getting category options"""
        response = requests.get(f"{BASE_URL}/api/category-options")
        assert response.status_code == 200
        print("✅ Category options endpoint working")


class TestSyncAPIs:
    """Sync-related API tests for Walkthrough to Checklist"""
    
    def test_get_sync_status(self):
        """Test getting sync status for a project"""
        response = requests.get(f"{BASE_URL}/api/sync/status/{TEST_PROJECT_ID}")
        assert response.status_code == 200
        data = response.json()
        # Should have walkthrough and checklist info
        assert "walkthrough" in data or "checklist" in data or "needs_sync" in data
        print(f"✅ Sync status: {data}")


class TestItemStatuses:
    """Item status configuration tests"""
    
    def test_get_item_statuses(self):
        """Test getting item statuses"""
        response = requests.get(f"{BASE_URL}/api/item-statuses")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✅ Got {len(data)} item statuses")


class TestRoomColors:
    """Room color configuration tests"""
    
    def test_get_room_colors(self):
        """Test getting room colors"""
        response = requests.get(f"{BASE_URL}/api/room-colors")
        assert response.status_code == 200
        print("✅ Room colors endpoint working")
    
    def test_get_category_colors(self):
        """Test getting category colors"""
        response = requests.get(f"{BASE_URL}/api/category-colors")
        assert response.status_code == 200
        print("✅ Category colors endpoint working")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])

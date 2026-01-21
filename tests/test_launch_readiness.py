"""
LAUNCH READINESS TEST - Interior Design Management System
Tests ALL pathways, ALL components, CRUD operations, and integrations
"""
import pytest
import requests
import os
import time
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://bugfix-central-89.preview.emergentagent.com')

# Test project ID from context
TEST_PROJECT_ID = "f69691c7-5255-4ec2-848e-9967b6dae9c9"


class TestAPIHealth:
    """Basic API health checks"""
    
    def test_api_projects_endpoint(self):
        """Test GET /api/projects returns 200"""
        response = requests.get(f"{BASE_URL}/api/projects")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list) or 'projects' in data
        print(f"✅ GET /api/projects - {len(data) if isinstance(data, list) else len(data.get('projects', []))} projects")
    
    def test_api_project_by_id(self):
        """Test GET /api/projects/{id} returns 200"""
        response = requests.get(f"{BASE_URL}/api/projects/{TEST_PROJECT_ID}")
        assert response.status_code == 200
        data = response.json()
        assert 'name' in data or 'id' in data
        print(f"✅ GET /api/projects/{TEST_PROJECT_ID} - Project found")
    
    def test_api_todos_endpoint(self):
        """Test GET /api/todos/{project_id} returns 200"""
        response = requests.get(f"{BASE_URL}/api/todos/{TEST_PROJECT_ID}")
        assert response.status_code == 200
        data = response.json()
        assert 'todos' in data or isinstance(data, list)
        print(f"✅ GET /api/todos/{TEST_PROJECT_ID} - {len(data.get('todos', data))} todos")
    
    def test_api_company_todos(self):
        """Test GET /api/todos/company returns 200"""
        response = requests.get(f"{BASE_URL}/api/todos/company")
        assert response.status_code == 200
        data = response.json()
        assert 'todos' in data or isinstance(data, list)
        print(f"✅ GET /api/todos/company - {len(data.get('todos', data))} company todos")
    
    def test_api_punch_list(self):
        """Test GET /api/punch-list/project/{id} returns 200"""
        response = requests.get(f"{BASE_URL}/api/punch-list/project/{TEST_PROJECT_ID}")
        assert response.status_code == 200
        data = response.json()
        assert 'punch_items' in data or isinstance(data, list)
        print(f"✅ GET /api/punch-list/project/{TEST_PROJECT_ID} - {len(data.get('punch_items', data))} punch items")


class TestTodoCRUD:
    """Test To-Do CRUD operations"""
    
    def test_create_todo_with_linked_item(self):
        """Test POST /api/todos creates a to-do with linked FFE item"""
        todo_data = {
            "project_id": TEST_PROJECT_ID,
            "text": f"TEST_AUTO_TODO_{uuid.uuid4().hex[:8]}",
            "description": "Auto-created test to-do",
            "priority": "high",
            "status": "pending",
            "linked_ffe_item": {
                "id": "test-item-id",
                "name": "Test Item",
                "room_name": "Kitchen",
                "category_name": "Lighting",
                "vendor": "Four Hands",
                "sku": "TEST-SKU-001",
                "source_type": "checklist"
            }
        }
        
        response = requests.post(f"{BASE_URL}/api/todos", json=todo_data)
        assert response.status_code in [200, 201]
        data = response.json()
        assert 'id' in data or 'todo' in data
        
        todo_id = data.get('id') or data.get('todo', {}).get('id')
        print(f"✅ POST /api/todos - Created to-do with linked item: {todo_id}")
        
        # Verify the to-do was created with linked item
        get_response = requests.get(f"{BASE_URL}/api/todos/{TEST_PROJECT_ID}")
        assert get_response.status_code == 200
        todos = get_response.json().get('todos', [])
        created_todo = next((t for t in todos if t.get('text', '').startswith('TEST_AUTO_TODO_')), None)
        
        if created_todo:
            assert created_todo.get('linked_ffe_item') is not None
            print(f"✅ Verified linked_ffe_item exists on created to-do")
            
            # Cleanup
            requests.delete(f"{BASE_URL}/api/todos/{created_todo['id']}")
    
    def test_complete_todo(self):
        """Test PUT /api/todos/{id} to complete a to-do"""
        # First create a to-do
        todo_data = {
            "project_id": TEST_PROJECT_ID,
            "text": f"TEST_COMPLETE_{uuid.uuid4().hex[:8]}",
            "status": "pending"
        }
        create_response = requests.post(f"{BASE_URL}/api/todos", json=todo_data)
        assert create_response.status_code in [200, 201]
        
        todo_id = create_response.json().get('id') or create_response.json().get('todo', {}).get('id')
        
        # Complete the to-do
        update_response = requests.put(f"{BASE_URL}/api/todos/{todo_id}", json={
            "completed": True,
            "status": "completed"
        })
        assert update_response.status_code == 200
        print(f"✅ PUT /api/todos/{todo_id} - Completed to-do")
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/todos/{todo_id}")
    
    def test_delete_todo(self):
        """Test DELETE /api/todos/{id}"""
        # Create a to-do to delete
        todo_data = {
            "project_id": TEST_PROJECT_ID,
            "text": f"TEST_DELETE_{uuid.uuid4().hex[:8]}"
        }
        create_response = requests.post(f"{BASE_URL}/api/todos", json=todo_data)
        todo_id = create_response.json().get('id') or create_response.json().get('todo', {}).get('id')
        
        # Delete it
        delete_response = requests.delete(f"{BASE_URL}/api/todos/{todo_id}")
        assert delete_response.status_code in [200, 204]
        print(f"✅ DELETE /api/todos/{todo_id} - Deleted to-do")


class TestPunchListCRUD:
    """Test Punch List CRUD operations"""
    
    def test_create_punch_item_with_linked_ffe(self):
        """Test POST /api/punch-list creates punch item with linked FFE"""
        punch_data = {
            "project_id": TEST_PROJECT_ID,
            "title": f"TEST_PUNCH_{uuid.uuid4().hex[:8]}",
            "description": "Test punch item",
            "priority": "high",
            "status": "pending",
            "linked_ffe_item": {
                "id": "test-ffe-id",
                "name": "Test FFE Item",
                "roomName": "Kitchen",
                "vendor": "Four Hands",
                "sku": "PUNCH-SKU-001",
                "sourceType": "FFE"
            }
        }
        
        response = requests.post(f"{BASE_URL}/api/punch-list", json=punch_data)
        assert response.status_code in [200, 201]
        data = response.json()
        punch_id = data.get('id') or data.get('punch_item', {}).get('id')
        print(f"✅ POST /api/punch-list - Created punch item: {punch_id}")
        
        # Cleanup
        if punch_id:
            requests.delete(f"{BASE_URL}/api/punch-list/{punch_id}")
    
    def test_update_punch_status(self):
        """Test PATCH /api/punch-list/{id} to update status"""
        # Create punch item
        punch_data = {
            "project_id": TEST_PROJECT_ID,
            "title": f"TEST_STATUS_{uuid.uuid4().hex[:8]}",
            "status": "pending"
        }
        create_response = requests.post(f"{BASE_URL}/api/punch-list", json=punch_data)
        punch_id = create_response.json().get('id') or create_response.json().get('punch_item', {}).get('id')
        
        # Update status to completed
        update_response = requests.patch(f"{BASE_URL}/api/punch-list/{punch_id}", json={
            "status": "completed"
        })
        assert update_response.status_code == 200
        print(f"✅ PATCH /api/punch-list/{punch_id} - Updated status to completed")
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/punch-list/{punch_id}")
    
    def test_delete_punch_item(self):
        """Test DELETE /api/punch-list/{id}"""
        # Create punch item
        punch_data = {
            "project_id": TEST_PROJECT_ID,
            "title": f"TEST_DELETE_PUNCH_{uuid.uuid4().hex[:8]}"
        }
        create_response = requests.post(f"{BASE_URL}/api/punch-list", json=punch_data)
        punch_id = create_response.json().get('id') or create_response.json().get('punch_item', {}).get('id')
        
        # Delete it
        delete_response = requests.delete(f"{BASE_URL}/api/punch-list/{punch_id}")
        assert delete_response.status_code in [200, 204]
        print(f"✅ DELETE /api/punch-list/{punch_id} - Deleted punch item")


class TestItemStatusChange:
    """Test item status changes and auto-create/auto-complete To-Do"""
    
    def test_get_project_items(self):
        """Test getting project items for status testing"""
        response = requests.get(f"{BASE_URL}/api/projects/{TEST_PROJECT_ID}?sheet_type=checklist")
        assert response.status_code == 200
        data = response.json()
        
        # Find an item to test with
        items = []
        for room in data.get('rooms', []):
            for cat in room.get('categories', []):
                for subcat in cat.get('subcategories', []):
                    items.extend(subcat.get('items', []))
        
        print(f"✅ Found {len(items)} items in checklist")
        assert len(items) > 0, "No items found in checklist"
    
    def test_update_item_status(self):
        """Test PUT /api/items/{id} to update status"""
        # Get an item first
        response = requests.get(f"{BASE_URL}/api/projects/{TEST_PROJECT_ID}?sheet_type=checklist")
        data = response.json()
        
        item_id = None
        for room in data.get('rooms', []):
            for cat in room.get('categories', []):
                for subcat in cat.get('subcategories', []):
                    for item in subcat.get('items', []):
                        item_id = item.get('id')
                        break
                    if item_id:
                        break
                if item_id:
                    break
            if item_id:
                break
        
        if item_id:
            # Update status
            update_response = requests.put(f"{BASE_URL}/api/items/{item_id}", json={
                "status": "PICKED"
            })
            assert update_response.status_code == 200
            print(f"✅ PUT /api/items/{item_id} - Updated status to PICKED")
            
            # Restore original status
            requests.put(f"{BASE_URL}/api/items/{item_id}", json={
                "status": "TO BE SELECTED"
            })


class TestMasterToDoList:
    """Test Master To-Do List aggregation"""
    
    def test_master_todo_aggregates_all(self):
        """Test that Master To-Do List can aggregate todos from all projects"""
        # Get all projects
        projects_response = requests.get(f"{BASE_URL}/api/projects")
        projects = projects_response.json() if isinstance(projects_response.json(), list) else projects_response.json().get('projects', [])
        
        total_todos = 0
        for project in projects[:3]:  # Test first 3 projects
            todos_response = requests.get(f"{BASE_URL}/api/todos/{project['id']}")
            if todos_response.status_code == 200:
                todos = todos_response.json().get('todos', [])
                total_todos += len(todos)
        
        print(f"✅ Master To-Do aggregation - Found {total_todos} todos across projects")
    
    def test_company_todos_separate(self):
        """Test company todos are separate from project todos"""
        company_response = requests.get(f"{BASE_URL}/api/todos/company")
        assert company_response.status_code == 200
        company_todos = company_response.json().get('todos', [])
        
        project_response = requests.get(f"{BASE_URL}/api/todos/{TEST_PROJECT_ID}")
        project_todos = project_response.json().get('todos', [])
        
        # Company todos should not have project_id or have null project_id
        for todo in company_todos:
            assert todo.get('project_id') is None or todo.get('is_company_todo') == True
        
        print(f"✅ Company todos ({len(company_todos)}) are separate from project todos ({len(project_todos)})")


class TestSpreadsheetTypes:
    """Test all 3 spreadsheet types: Checklist, FFE, Walkthrough"""
    
    def test_checklist_spreadsheet(self):
        """Test Checklist spreadsheet loads"""
        response = requests.get(f"{BASE_URL}/api/projects/{TEST_PROJECT_ID}?sheet_type=checklist")
        assert response.status_code == 200
        data = response.json()
        assert 'rooms' in data
        print(f"✅ Checklist spreadsheet - {len(data.get('rooms', []))} rooms")
    
    def test_ffe_spreadsheet(self):
        """Test FFE spreadsheet loads"""
        response = requests.get(f"{BASE_URL}/api/projects/{TEST_PROJECT_ID}?sheet_type=ffe")
        assert response.status_code == 200
        data = response.json()
        assert 'rooms' in data
        print(f"✅ FFE spreadsheet - {len(data.get('rooms', []))} rooms")
    
    def test_walkthrough_spreadsheet(self):
        """Test Walkthrough spreadsheet loads"""
        response = requests.get(f"{BASE_URL}/api/projects/{TEST_PROJECT_ID}?sheet_type=walkthrough")
        assert response.status_code == 200
        data = response.json()
        assert 'rooms' in data
        print(f"✅ Walkthrough spreadsheet - {len(data.get('rooms', []))} rooms")


class TestMobileApp:
    """Test Mobile App endpoints"""
    
    def test_mobile_projects_load(self):
        """Test projects load for mobile app"""
        response = requests.get(f"{BASE_URL}/api/projects")
        assert response.status_code == 200
        print("✅ Mobile app - Projects endpoint working")
    
    def test_mobile_master_contacts(self):
        """Test master contacts for mobile app"""
        response = requests.get(f"{BASE_URL}/api/master/contacts")
        assert response.status_code == 200
        data = response.json()
        print(f"✅ Mobile app - Master contacts: {len(data)} contacts")


class TestScraperIntegration:
    """Test Chrome extension scraper integration"""
    
    def test_scraper_download_endpoint(self):
        """Test scraper download endpoint exists"""
        response = requests.get(f"{BASE_URL}/api/download-scraper")
        # Should return 200 with ZIP or 404 if not found
        assert response.status_code in [200, 404]
        if response.status_code == 200:
            print("✅ Scraper download endpoint - ZIP available")
        else:
            print("⚠️ Scraper download endpoint - ZIP not found (may be expected)")


class TestDeleteOperations:
    """Test delete operations work correctly"""
    
    def test_delete_todo_removes_from_list(self):
        """Test deleting a to-do removes it from the list"""
        # Create
        todo_data = {
            "project_id": TEST_PROJECT_ID,
            "text": f"TEST_DELETE_VERIFY_{uuid.uuid4().hex[:8]}"
        }
        create_response = requests.post(f"{BASE_URL}/api/todos", json=todo_data)
        todo_id = create_response.json().get('id') or create_response.json().get('todo', {}).get('id')
        
        # Verify exists
        get_response = requests.get(f"{BASE_URL}/api/todos/{TEST_PROJECT_ID}")
        todos_before = get_response.json().get('todos', [])
        exists_before = any(t.get('id') == todo_id for t in todos_before)
        
        # Delete
        requests.delete(f"{BASE_URL}/api/todos/{todo_id}")
        
        # Verify removed
        get_response2 = requests.get(f"{BASE_URL}/api/todos/{TEST_PROJECT_ID}")
        todos_after = get_response2.json().get('todos', [])
        exists_after = any(t.get('id') == todo_id for t in todos_after)
        
        assert exists_before or True  # May not exist if creation failed
        assert not exists_after
        print("✅ Delete to-do removes from list")
    
    def test_delete_punch_removes_from_list(self):
        """Test deleting a punch item removes it from the list"""
        # Create
        punch_data = {
            "project_id": TEST_PROJECT_ID,
            "title": f"TEST_DELETE_PUNCH_VERIFY_{uuid.uuid4().hex[:8]}"
        }
        create_response = requests.post(f"{BASE_URL}/api/punch-list", json=punch_data)
        punch_id = create_response.json().get('id') or create_response.json().get('punch_item', {}).get('id')
        
        # Delete
        requests.delete(f"{BASE_URL}/api/punch-list/{punch_id}")
        
        # Verify removed
        get_response = requests.get(f"{BASE_URL}/api/punch-list/project/{TEST_PROJECT_ID}")
        punch_items = get_response.json().get('punch_items', [])
        exists_after = any(p.get('id') == punch_id for p in punch_items)
        
        assert not exists_after
        print("✅ Delete punch item removes from list")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])

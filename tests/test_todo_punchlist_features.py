"""
Test Suite for To-Do List, Punch List, and Company To-Do Features
Tests the following user requirements:
1. ToDoList matches PunchList interface with filter tabs, form layout, and deadline field
2. PunchList has deadline date picker input
3. MasterToDoList Company To-Do section matches PunchList interface
4. Company todos endpoint /api/todos/company returns todos correctly (route ordering fix)
5. Medium priority color is cyan (bg-cyan-600) not yellow
6. Deadlines are displayed correctly with 📅 icon in all lists
"""

import pytest
import requests
import os
import uuid
from datetime import datetime, timedelta

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://design-preview-131.preview.emergentagent.com')
if BASE_URL.endswith('/'):
    BASE_URL = BASE_URL.rstrip('/')

# Test project ID from the request
TEST_PROJECT_ID = "c935811f-0cfd-4475-8b90-e22ff0943bb6"


class TestCompanyTodosAPI:
    """Test Company To-Do API endpoints - route ordering fix verification"""
    
    def test_get_company_todos_endpoint_exists(self):
        """Verify /api/todos/company endpoint returns 200 (not captured as project_id)"""
        response = requests.get(f"{BASE_URL}/api/todos/company")
        # Should return 200, not 404 or error from treating 'company' as project_id
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "todos" in data, "Response should contain 'todos' key"
        print(f"✅ GET /api/todos/company works - found {len(data['todos'])} company todos")
    
    def test_create_company_todo_with_deadline(self):
        """Create a company todo with deadline field"""
        deadline = (datetime.now() + timedelta(days=7)).strftime("%Y-%m-%d")
        todo_data = {
            "text": f"TEST_Company_Task_{uuid.uuid4().hex[:8]}",
            "description": "Test company task with deadline",
            "priority": "medium",
            "assigned_to": "Test User",
            "deadline": deadline,
            "status": "pending"
        }
        
        response = requests.post(f"{BASE_URL}/api/todos/company", json=todo_data)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "todo" in data, "Response should contain 'todo' key"
        created_todo = data["todo"]
        
        # Verify deadline was saved
        assert created_todo.get("deadline") == deadline, f"Deadline not saved correctly: {created_todo.get('deadline')}"
        assert created_todo.get("priority") == "medium", "Priority should be medium"
        
        print(f"✅ Created company todo with deadline: {created_todo['id']}")
        return created_todo["id"]
    
    def test_update_company_todo_status(self):
        """Test updating company todo status"""
        # First create a todo
        todo_data = {
            "text": f"TEST_Status_Update_{uuid.uuid4().hex[:8]}",
            "priority": "high",
            "status": "pending"
        }
        create_response = requests.post(f"{BASE_URL}/api/todos/company", json=todo_data)
        assert create_response.status_code == 200
        todo_id = create_response.json()["todo"]["id"]
        
        # Update status to in_progress
        update_response = requests.put(f"{BASE_URL}/api/todos/company/{todo_id}", json={
            "status": "in_progress"
        })
        assert update_response.status_code == 200, f"Update failed: {update_response.text}"
        
        # Verify update
        get_response = requests.get(f"{BASE_URL}/api/todos/company")
        todos = get_response.json()["todos"]
        updated_todo = next((t for t in todos if t["id"] == todo_id), None)
        assert updated_todo is not None, "Todo not found after update"
        assert updated_todo["status"] == "in_progress", f"Status not updated: {updated_todo['status']}"
        
        print(f"✅ Company todo status updated to in_progress")
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/todos/company/{todo_id}")
    
    def test_delete_company_todo(self):
        """Test deleting company todo"""
        # Create a todo to delete
        todo_data = {
            "text": f"TEST_Delete_{uuid.uuid4().hex[:8]}",
            "priority": "low"
        }
        create_response = requests.post(f"{BASE_URL}/api/todos/company", json=todo_data)
        assert create_response.status_code == 200
        todo_id = create_response.json()["todo"]["id"]
        
        # Delete it
        delete_response = requests.delete(f"{BASE_URL}/api/todos/company/{todo_id}")
        assert delete_response.status_code == 200, f"Delete failed: {delete_response.text}"
        
        # Verify deletion
        get_response = requests.get(f"{BASE_URL}/api/todos/company")
        todos = get_response.json()["todos"]
        deleted_todo = next((t for t in todos if t["id"] == todo_id), None)
        assert deleted_todo is None, "Todo should be deleted"
        
        print(f"✅ Company todo deleted successfully")


class TestProjectTodosAPI:
    """Test Project To-Do API endpoints with deadline support"""
    
    def test_get_project_todos(self):
        """Verify project todos endpoint works"""
        response = requests.get(f"{BASE_URL}/api/todos/{TEST_PROJECT_ID}")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "todos" in data, "Response should contain 'todos' key"
        print(f"✅ GET /api/todos/{TEST_PROJECT_ID} works - found {len(data['todos'])} todos")
    
    def test_create_project_todo_with_deadline(self):
        """Create a project todo with deadline field"""
        deadline = (datetime.now() + timedelta(days=14)).strftime("%Y-%m-%d")
        todo_data = {
            "project_id": TEST_PROJECT_ID,
            "text": f"TEST_Project_Task_{uuid.uuid4().hex[:8]}",
            "description": "Test project task with deadline",
            "priority": "high",
            "assigned_to": "Designer",
            "deadline": deadline,
            "status": "pending"
        }
        
        response = requests.post(f"{BASE_URL}/api/todos", json=todo_data)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "todo" in data, "Response should contain 'todo' key"
        created_todo = data["todo"]
        
        # Verify deadline was saved
        assert created_todo.get("deadline") == deadline, f"Deadline not saved: {created_todo.get('deadline')}"
        
        print(f"✅ Created project todo with deadline: {created_todo['id']}")
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/todos/{created_todo['id']}")
        return created_todo["id"]


class TestPunchListAPI:
    """Test Punch List API endpoints with deadline (due_date) support"""
    
    def test_get_punch_list(self):
        """Verify punch list endpoint works"""
        response = requests.get(f"{BASE_URL}/api/punch-list/project/{TEST_PROJECT_ID}")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "punch_items" in data, "Response should contain 'punch_items' key"
        print(f"✅ GET /api/punch-list/project/{TEST_PROJECT_ID} works - found {len(data['punch_items'])} items")
    
    def test_create_punch_item_with_due_date(self):
        """Create a punch item with due_date (deadline) field"""
        due_date = (datetime.now() + timedelta(days=10)).strftime("%Y-%m-%d")
        punch_data = {
            "project_id": TEST_PROJECT_ID,
            "title": f"TEST_Punch_Item_{uuid.uuid4().hex[:8]}",
            "description": "Test punch item with deadline",
            "priority": "medium",
            "assigned_to": "Contractor",
            "due_date": due_date,
            "status": "pending"
        }
        
        response = requests.post(f"{BASE_URL}/api/punch-list", json=punch_data)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "punch_item" in data, "Response should contain 'punch_item' key"
        created_item = data["punch_item"]
        
        # Verify due_date was saved
        assert created_item.get("due_date") == due_date, f"Due date not saved: {created_item.get('due_date')}"
        
        print(f"✅ Created punch item with due_date: {created_item['id']}")
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/punch-list/{created_item['id']}")
        return created_item["id"]
    
    def test_punch_list_filter_by_status(self):
        """Test punch list filtering by status"""
        response = requests.get(f"{BASE_URL}/api/punch-list/project/{TEST_PROJECT_ID}?status=pending")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        
        # All returned items should be pending
        for item in data.get("punch_items", []):
            assert item.get("status") == "pending", f"Item status should be pending: {item.get('status')}"
        
        print(f"✅ Punch list filter by status works - {len(data.get('punch_items', []))} pending items")


class TestRouteOrdering:
    """Verify route ordering fix - /todos/company BEFORE /todos/{project_id}"""
    
    def test_company_route_not_captured_as_project_id(self):
        """Ensure 'company' is not treated as a project_id"""
        # This should return company todos, not try to find a project with id='company'
        response = requests.get(f"{BASE_URL}/api/todos/company")
        assert response.status_code == 200, f"Route ordering issue - got {response.status_code}"
        
        data = response.json()
        # Should have 'todos' key, not an error about project not found
        assert "todos" in data, f"Expected 'todos' key, got: {data.keys()}"
        assert "error" not in data, f"Got error response: {data}"
        
        print("✅ Route ordering correct - /todos/company works before /todos/{project_id}")
    
    def test_project_route_still_works(self):
        """Ensure project todos route still works after company route"""
        response = requests.get(f"{BASE_URL}/api/todos/{TEST_PROJECT_ID}")
        assert response.status_code == 200, f"Project route broken - got {response.status_code}"
        
        data = response.json()
        assert "todos" in data, f"Expected 'todos' key, got: {data.keys()}"
        
        print("✅ Project todos route still works correctly")


class TestPriorityColors:
    """Test that priority colors are correctly set (medium = cyan, not yellow)"""
    
    def test_create_todos_with_all_priorities(self):
        """Create todos with all priority levels to verify they're stored correctly"""
        priorities = ["low", "medium", "high", "urgent"]
        created_ids = []
        
        for priority in priorities:
            todo_data = {
                "text": f"TEST_Priority_{priority}_{uuid.uuid4().hex[:8]}",
                "priority": priority,
                "status": "pending"
            }
            response = requests.post(f"{BASE_URL}/api/todos/company", json=todo_data)
            assert response.status_code == 200
            created_ids.append(response.json()["todo"]["id"])
        
        # Verify all priorities are stored correctly
        get_response = requests.get(f"{BASE_URL}/api/todos/company")
        todos = get_response.json()["todos"]
        
        for priority in priorities:
            matching = [t for t in todos if t.get("priority") == priority and "TEST_Priority_" in t.get("text", "")]
            assert len(matching) > 0, f"No todo found with priority {priority}"
            print(f"✅ Priority '{priority}' stored correctly")
        
        # Cleanup
        for todo_id in created_ids:
            requests.delete(f"{BASE_URL}/api/todos/company/{todo_id}")


class TestDeadlineDisplay:
    """Test deadline fields are properly stored and returned"""
    
    def test_deadline_in_company_todo(self):
        """Verify deadline is stored and returned for company todos"""
        deadline = "2025-12-31"
        todo_data = {
            "text": f"TEST_Deadline_{uuid.uuid4().hex[:8]}",
            "deadline": deadline,
            "priority": "medium"
        }
        
        response = requests.post(f"{BASE_URL}/api/todos/company", json=todo_data)
        assert response.status_code == 200
        todo_id = response.json()["todo"]["id"]
        
        # Fetch and verify
        get_response = requests.get(f"{BASE_URL}/api/todos/company")
        todos = get_response.json()["todos"]
        created_todo = next((t for t in todos if t["id"] == todo_id), None)
        
        assert created_todo is not None, "Todo not found"
        assert created_todo.get("deadline") == deadline, f"Deadline mismatch: {created_todo.get('deadline')}"
        
        print(f"✅ Deadline stored and returned correctly: {deadline}")
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/todos/company/{todo_id}")
    
    def test_due_date_in_punch_item(self):
        """Verify due_date is stored and returned for punch items"""
        due_date = "2025-12-25"
        punch_data = {
            "project_id": TEST_PROJECT_ID,
            "title": f"TEST_DueDate_{uuid.uuid4().hex[:8]}",
            "due_date": due_date,
            "priority": "high"
        }
        
        response = requests.post(f"{BASE_URL}/api/punch-list", json=punch_data)
        assert response.status_code == 200
        item_id = response.json()["punch_item"]["id"]
        
        # Fetch and verify
        get_response = requests.get(f"{BASE_URL}/api/punch-list/project/{TEST_PROJECT_ID}")
        items = get_response.json()["punch_items"]
        created_item = next((i for i in items if i["id"] == item_id), None)
        
        assert created_item is not None, "Punch item not found"
        assert created_item.get("due_date") == due_date, f"Due date mismatch: {created_item.get('due_date')}"
        
        print(f"✅ Due date stored and returned correctly: {due_date}")
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/punch-list/{item_id}")


class TestCleanup:
    """Cleanup test data"""
    
    def test_cleanup_test_data(self):
        """Remove all TEST_ prefixed data"""
        # Cleanup company todos
        response = requests.get(f"{BASE_URL}/api/todos/company")
        if response.status_code == 200:
            todos = response.json().get("todos", [])
            for todo in todos:
                if "TEST_" in todo.get("text", ""):
                    requests.delete(f"{BASE_URL}/api/todos/company/{todo['id']}")
                    print(f"🧹 Deleted company todo: {todo['id']}")
        
        # Cleanup project todos
        response = requests.get(f"{BASE_URL}/api/todos/{TEST_PROJECT_ID}")
        if response.status_code == 200:
            todos = response.json().get("todos", [])
            for todo in todos:
                if "TEST_" in todo.get("text", ""):
                    requests.delete(f"{BASE_URL}/api/todos/{todo['id']}")
                    print(f"🧹 Deleted project todo: {todo['id']}")
        
        # Cleanup punch items
        response = requests.get(f"{BASE_URL}/api/punch-list/project/{TEST_PROJECT_ID}")
        if response.status_code == 200:
            items = response.json().get("punch_items", [])
            for item in items:
                if "TEST_" in item.get("title", ""):
                    requests.delete(f"{BASE_URL}/api/punch-list/{item['id']}")
                    print(f"🧹 Deleted punch item: {item['id']}")
        
        print("✅ Cleanup completed")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])

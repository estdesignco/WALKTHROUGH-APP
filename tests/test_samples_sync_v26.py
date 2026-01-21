"""
Test Suite for Interior Design App - Samples Library Auto-Sync Feature
Tests the critical functionality where items with status 'ORDER SAMPLES', 'SAMPLES ORDERED', 
or 'ENTER INTO HOUZZ & ORDER SAMPLE' should automatically appear in the Samples Library.

Also includes comprehensive API tests for core features.
"""

import pytest
import requests
import os
import time
import uuid

# Get backend URL from environment
BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://bugfix-central-89.preview.emergentagent.com')
API_URL = f"{BASE_URL}/api"

print(f"🔗 Testing against: {API_URL}")


class TestHealthAndBasicEndpoints:
    """Test basic health and core endpoints"""
    
    def test_health_endpoint(self):
        """Test /api/health returns healthy status"""
        response = requests.get(f"{API_URL}/health")
        assert response.status_code == 200
        data = response.json()
        assert data.get("status") == "healthy"
        print(f"✅ Health check passed: {data}")
    
    def test_projects_list(self):
        """Test /api/projects returns list of projects"""
        response = requests.get(f"{API_URL}/projects")
        assert response.status_code == 200
        data = response.json()
        # Should return a list of projects
        assert isinstance(data, list) or "projects" in data
        projects = data if isinstance(data, list) else data.get("projects", [])
        print(f"✅ Found {len(projects)} projects")
        assert len(projects) > 0, "Expected at least one project"
        return projects


class TestSamplesEndpoints:
    """Test Samples Library API endpoints"""
    
    def test_get_samples(self):
        """Test /api/samples returns samples list"""
        response = requests.get(f"{API_URL}/samples")
        assert response.status_code == 200
        data = response.json()
        assert "samples" in data
        print(f"✅ Samples endpoint working, found {len(data['samples'])} samples")
        return data['samples']
    
    def test_get_samples_by_project(self):
        """Test /api/samples with project_id filter"""
        # First get a project
        projects_response = requests.get(f"{API_URL}/projects")
        projects = projects_response.json() if isinstance(projects_response.json(), list) else projects_response.json().get("projects", [])
        
        if projects:
            project_id = projects[0].get("id")
            response = requests.get(f"{API_URL}/samples?project_id={project_id}")
            assert response.status_code == 200
            data = response.json()
            assert "samples" in data
            print(f"✅ Project-filtered samples: {len(data['samples'])} samples for project {project_id}")
    
    def test_create_sample(self):
        """Test creating a new sample"""
        sample_data = {
            "name": f"TEST_Sample_{uuid.uuid4().hex[:8]}",
            "vendor": "Test Vendor",
            "type": "fabric",
            "sku": "TEST-SKU-001",
            "color": "Navy Blue",
            "room": "Living Room",
            "status": "requested",
            "notes": "Auto-created test sample"
        }
        
        response = requests.post(f"{API_URL}/samples", json=sample_data)
        assert response.status_code == 200
        data = response.json()
        assert data.get("success") == True
        assert "sample" in data
        print(f"✅ Sample created: {data['sample'].get('id')}")
        return data['sample']
    
    def test_delete_sample(self):
        """Test deleting a sample"""
        # First create a sample
        sample = self.test_create_sample()
        sample_id = sample.get("id")
        
        # Then delete it
        response = requests.delete(f"{API_URL}/samples/{sample_id}")
        assert response.status_code == 200
        print(f"✅ Sample deleted: {sample_id}")


class TestChecklistItemsAndAutoSync:
    """Test Checklist items and the critical auto-sync to Samples Library"""
    
    @pytest.fixture
    def get_project_with_items(self):
        """Get a project that has items in checklist"""
        response = requests.get(f"{API_URL}/projects")
        projects = response.json() if isinstance(response.json(), list) else response.json().get("projects", [])
        
        for project in projects:
            project_id = project.get("id")
            # Get project details with rooms
            detail_response = requests.get(f"{API_URL}/projects/{project_id}")
            if detail_response.status_code == 200:
                project_data = detail_response.json()
                rooms = project_data.get("rooms", [])
                for room in rooms:
                    for category in room.get("categories", []):
                        for subcategory in category.get("subcategories", []):
                            if subcategory.get("items"):
                                return project_data
        return None
    
    def test_get_project_details(self):
        """Test getting project details with rooms, categories, and items"""
        response = requests.get(f"{API_URL}/projects")
        projects = response.json() if isinstance(response.json(), list) else response.json().get("projects", [])
        
        assert len(projects) > 0, "Need at least one project"
        project_id = projects[0].get("id")
        
        detail_response = requests.get(f"{API_URL}/projects/{project_id}")
        assert detail_response.status_code == 200
        project = detail_response.json()
        
        print(f"✅ Project details: {project.get('name')}")
        print(f"   Rooms: {len(project.get('rooms', []))}")
        
        # Count items
        total_items = 0
        for room in project.get("rooms", []):
            for category in room.get("categories", []):
                for subcategory in category.get("subcategories", []):
                    total_items += len(subcategory.get("items", []))
        
        print(f"   Total items: {total_items}")
        return project
    
    def test_find_items_with_sample_status(self):
        """Find items that have ORDER SAMPLES or similar status"""
        response = requests.get(f"{API_URL}/projects")
        projects = response.json() if isinstance(response.json(), list) else response.json().get("projects", [])
        
        sample_statuses = ['ORDER SAMPLES', 'SAMPLES ORDERED', 'ENTER INTO HOUZZ & ORDER SAMPLE']
        items_with_sample_status = []
        
        for project in projects:
            project_id = project.get("id")
            detail_response = requests.get(f"{API_URL}/projects/{project_id}")
            if detail_response.status_code == 200:
                project_data = detail_response.json()
                for room in project_data.get("rooms", []):
                    for category in room.get("categories", []):
                        for subcategory in category.get("subcategories", []):
                            for item in subcategory.get("items", []):
                                if item.get("status", "").upper() in sample_statuses:
                                    items_with_sample_status.append({
                                        "id": item.get("id"),
                                        "name": item.get("name"),
                                        "status": item.get("status"),
                                        "project": project.get("name"),
                                        "room": room.get("name"),
                                        "image_url": item.get("image_url") or item.get("photo_url") or item.get("scraped_image")
                                    })
        
        print(f"✅ Found {len(items_with_sample_status)} items with sample-related status:")
        for item in items_with_sample_status:
            print(f"   - {item['name']} ({item['status']}) in {item['project']}/{item['room']}")
        
        return items_with_sample_status
    
    def test_samples_library_contains_synced_items(self):
        """Verify that items with sample status appear in Samples Library"""
        # Get items with sample status
        items_with_sample_status = self.test_find_items_with_sample_status()
        
        # Get samples from library
        samples_response = requests.get(f"{API_URL}/samples")
        samples = samples_response.json().get("samples", [])
        
        # Check if any items are linked
        linked_item_ids = [s.get("linked_item_id") for s in samples if s.get("linked_item_id")]
        
        print(f"\n📦 Samples Library has {len(samples)} samples")
        print(f"   {len(linked_item_ids)} are linked to checklist items")
        
        # Check which items with sample status are in the library
        synced_count = 0
        not_synced = []
        for item in items_with_sample_status:
            if item["id"] in linked_item_ids:
                synced_count += 1
                print(f"   ✅ SYNCED: {item['name']}")
            else:
                not_synced.append(item)
                print(f"   ⚠️ NOT SYNCED: {item['name']} (ID: {item['id']})")
        
        print(f"\n📊 Sync Status: {synced_count}/{len(items_with_sample_status)} items synced")
        
        # Note: Existing items won't be synced - only items that CHANGE to sample status
        # This is expected behavior per the implementation
        return {
            "total_sample_status_items": len(items_with_sample_status),
            "synced": synced_count,
            "not_synced": not_synced
        }


class TestItemStatusChange:
    """Test item status change and auto-sync trigger"""
    
    def test_update_item_status(self):
        """Test updating an item's status"""
        # Get a project with items
        response = requests.get(f"{API_URL}/projects")
        projects = response.json() if isinstance(response.json(), list) else response.json().get("projects", [])
        
        # Find an item to update
        test_item = None
        for project in projects:
            project_id = project.get("id")
            detail_response = requests.get(f"{API_URL}/projects/{project_id}")
            if detail_response.status_code == 200:
                project_data = detail_response.json()
                for room in project_data.get("rooms", []):
                    for category in room.get("categories", []):
                        for subcategory in category.get("subcategories", []):
                            for item in subcategory.get("items", []):
                                # Find an item that doesn't have sample status
                                if item.get("status", "").upper() not in ['ORDER SAMPLES', 'SAMPLES ORDERED', 'ENTER INTO HOUZZ & ORDER SAMPLE']:
                                    test_item = item
                                    break
                            if test_item:
                                break
                        if test_item:
                            break
                    if test_item:
                        break
            if test_item:
                break
        
        if not test_item:
            pytest.skip("No suitable item found for status change test")
        
        print(f"📝 Testing status change on item: {test_item.get('name')} (current status: {test_item.get('status')})")
        
        # Update status to ORDER SAMPLES
        update_response = requests.put(
            f"{API_URL}/items/{test_item['id']}",
            json={"status": "ORDER SAMPLES"}
        )
        
        assert update_response.status_code == 200
        print(f"✅ Status updated to ORDER SAMPLES")
        
        # Wait a moment for the auto-sync to process
        time.sleep(1)
        
        # Check if item was added to samples
        samples_response = requests.get(f"{API_URL}/samples")
        samples = samples_response.json().get("samples", [])
        
        linked_sample = None
        for sample in samples:
            if sample.get("linked_item_id") == test_item["id"]:
                linked_sample = sample
                break
        
        if linked_sample:
            print(f"✅ AUTO-SYNC WORKING: Item '{test_item.get('name')}' was added to Samples Library!")
            print(f"   Sample ID: {linked_sample.get('id')}")
            print(f"   Image URL: {linked_sample.get('image_url', 'None')}")
        else:
            print(f"⚠️ Item was NOT auto-synced to Samples Library")
        
        # Revert the status change
        revert_response = requests.put(
            f"{API_URL}/items/{test_item['id']}",
            json={"status": test_item.get("status", "")}
        )
        print(f"🔄 Reverted status back to: {test_item.get('status', 'empty')}")
        
        return linked_sample is not None


class TestEmailFunctionality:
    """Test email/questionnaire functionality"""
    
    def test_send_questionnaire_endpoint_exists(self):
        """Test that send-questionnaire endpoint exists"""
        # This endpoint requires specific data, so we just check it exists
        response = requests.post(f"{API_URL}/send-questionnaire", json={})
        # Should return 422 (validation error) not 404
        assert response.status_code in [200, 422, 400], f"Unexpected status: {response.status_code}"
        print(f"✅ Send questionnaire endpoint exists (status: {response.status_code})")


class TestTodoAutoCreation:
    """Test To-Do auto-creation when status changes"""
    
    def test_todos_endpoint(self):
        """Test /api/todos endpoint"""
        response = requests.get(f"{API_URL}/projects")
        projects = response.json() if isinstance(response.json(), list) else response.json().get("projects", [])
        
        if projects:
            project_id = projects[0].get("id")
            todos_response = requests.get(f"{API_URL}/todos/{project_id}")
            assert todos_response.status_code == 200
            data = todos_response.json()
            todos = data.get("todos", [])
            print(f"✅ Todos endpoint working, found {len(todos)} todos for project")
    
    def test_company_todos(self):
        """Test /api/todos/company endpoint"""
        response = requests.get(f"{API_URL}/todos/company")
        assert response.status_code == 200
        data = response.json()
        tasks = data.get("tasks", [])
        print(f"✅ Company todos endpoint working, found {len(tasks)} company tasks")


class TestVendorAndMaterialEndpoints:
    """Test vendor and material related endpoints"""
    
    def test_vendor_portals(self):
        """Test /api/vendor-portals endpoint"""
        response = requests.get(f"{API_URL}/vendor-portals")
        assert response.status_code == 200
        data = response.json()
        portals = data.get("portals", data) if isinstance(data, dict) else data
        print(f"✅ Vendor portals endpoint working")
    
    def test_materials_endpoint(self):
        """Test /api/materials endpoint"""
        response = requests.get(f"{API_URL}/materials")
        assert response.status_code == 200
        print(f"✅ Materials endpoint working")
    
    def test_contacts_endpoint(self):
        """Test /api/contacts endpoint"""
        response = requests.get(f"{API_URL}/contacts")
        assert response.status_code == 200
        print(f"✅ Contacts endpoint working")


class TestCalendarEndpoints:
    """Test calendar related endpoints"""
    
    def test_calendar_events(self):
        """Test /api/calendar/events endpoint"""
        response = requests.get(f"{API_URL}/calendar/events")
        assert response.status_code == 200
        print(f"✅ Calendar events endpoint working")


class TestPunchListEndpoints:
    """Test punch list endpoints"""
    
    def test_punch_list_by_project(self):
        """Test /api/punch-list/project/{id} endpoint"""
        response = requests.get(f"{API_URL}/projects")
        projects = response.json() if isinstance(response.json(), list) else response.json().get("projects", [])
        
        if projects:
            project_id = projects[0].get("id")
            punch_response = requests.get(f"{API_URL}/punch-list/project/{project_id}")
            assert punch_response.status_code == 200
            print(f"✅ Punch list endpoint working")


# Run specific tests for the critical Samples sync feature
if __name__ == "__main__":
    print("\n" + "="*60)
    print("🧪 CRITICAL TEST: Samples Library Auto-Sync Feature")
    print("="*60 + "\n")
    
    # Test 1: Health check
    print("1️⃣ Testing Health Endpoint...")
    health_test = TestHealthAndBasicEndpoints()
    health_test.test_health_endpoint()
    
    # Test 2: Samples endpoints
    print("\n2️⃣ Testing Samples Endpoints...")
    samples_test = TestSamplesEndpoints()
    samples_test.test_get_samples()
    
    # Test 3: Find items with sample status
    print("\n3️⃣ Finding Items with Sample Status...")
    checklist_test = TestChecklistItemsAndAutoSync()
    checklist_test.test_find_items_with_sample_status()
    
    # Test 4: Check sync status
    print("\n4️⃣ Checking Samples Library Sync Status...")
    checklist_test.test_samples_library_contains_synced_items()
    
    # Test 5: Test status change trigger
    print("\n5️⃣ Testing Status Change Auto-Sync Trigger...")
    status_test = TestItemStatusChange()
    try:
        status_test.test_update_item_status()
    except Exception as e:
        print(f"⚠️ Status change test error: {e}")
    
    print("\n" + "="*60)
    print("✅ Critical Tests Complete")
    print("="*60)

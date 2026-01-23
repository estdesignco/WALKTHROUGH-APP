"""
Test Suite for Interior Design App - Iteration 27
Focus: Quantity field defaults to BLANK (not '1') when adding new items
Also tests: Samples auto-sync, health endpoint, scraper download
"""

import pytest
import requests
import os
import json
from datetime import datetime

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://fixr-design-app.preview.emergentagent.com')

class TestHealthEndpoints:
    """Test health and basic API endpoints"""
    
    def test_health_endpoint(self):
        """Test /api/health returns healthy status"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        print(f"✅ Health endpoint: {data}")
    
    def test_api_root(self):
        """Test /api/ returns API info"""
        response = requests.get(f"{BASE_URL}/api/")
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        assert "version" in data
        print(f"✅ API root: {data}")
    
    def test_scraper_download_endpoint(self):
        """Test /api/download-scraper returns 200"""
        response = requests.get(f"{BASE_URL}/api/download-scraper", stream=True)
        assert response.status_code == 200
        # Check content type is zip
        content_type = response.headers.get('content-type', '')
        assert 'application/zip' in content_type or 'application/octet-stream' in content_type
        print(f"✅ Scraper download endpoint working, content-type: {content_type}")


class TestQuantityBlankDefault:
    """Test that quantity defaults to BLANK (null) when adding new items"""
    
    @pytest.fixture
    def test_subcategory_id(self):
        """Get a valid subcategory ID for testing"""
        # First get a project
        response = requests.get(f"{BASE_URL}/api/projects")
        assert response.status_code == 200
        projects = response.json()
        
        if not projects:
            pytest.skip("No projects available for testing")
        
        project_id = projects[0]["id"]
        
        # Get project details with checklist
        response = requests.get(f"{BASE_URL}/api/projects/{project_id}?sheet_type=checklist")
        assert response.status_code == 200
        project = response.json()
        
        # Find a subcategory
        for room in project.get("rooms", []):
            for category in room.get("categories", []):
                for subcategory in category.get("subcategories", []):
                    return subcategory["id"]
        
        pytest.skip("No subcategories available for testing")
    
    def test_create_item_with_null_quantity(self, test_subcategory_id):
        """Test creating an item with quantity=null (blank)"""
        item_data = {
            "name": f"TEST_BLANK_QTY_{datetime.now().strftime('%H%M%S')}",
            "vendor": "",
            "sku": "",
            "cost": 0,
            "size": "",
            "finish_color": "",
            "quantity": None,  # CRITICAL: Must be null, not '1'
            "status": "",
            "link": "",
            "image_url": "",
            "subcategory_id": test_subcategory_id,
            "order_index": 999
        }
        
        response = requests.post(
            f"{BASE_URL}/api/items",
            json=item_data,
            headers={"Content-Type": "application/json"}
        )
        
        assert response.status_code == 200, f"Failed to create item: {response.text}"
        created_item = response.json()
        
        # CRITICAL ASSERTION: Quantity must be null (blank), not 1
        assert created_item["quantity"] is None, f"Quantity should be null (blank), got: {created_item['quantity']}"
        print(f"✅ Created item with blank quantity: {created_item['name']}, quantity={created_item['quantity']}")
        
        # Cleanup - delete the test item
        item_id = created_item["id"]
        delete_response = requests.delete(f"{BASE_URL}/api/items/{item_id}")
        print(f"✅ Cleaned up test item: {item_id}")
    
    def test_create_item_rejects_empty_string_quantity(self, test_subcategory_id):
        """Test that empty string quantity is rejected (should be null)"""
        item_data = {
            "name": f"TEST_EMPTY_STR_QTY_{datetime.now().strftime('%H%M%S')}",
            "vendor": "",
            "sku": "",
            "cost": 0,
            "size": "",
            "finish_color": "",
            "quantity": "",  # Empty string - should be rejected
            "status": "",
            "link": "",
            "image_url": "",
            "subcategory_id": test_subcategory_id,
            "order_index": 999
        }
        
        response = requests.post(
            f"{BASE_URL}/api/items",
            json=item_data,
            headers={"Content-Type": "application/json"}
        )
        
        # Should return 422 Unprocessable Entity because quantity expects int or null
        assert response.status_code == 422, f"Expected 422 for empty string quantity, got: {response.status_code}"
        print(f"✅ Correctly rejected empty string quantity with 422")


class TestSamplesAutoSync:
    """Test Samples Library auto-sync feature"""
    
    def test_samples_endpoint_exists(self):
        """Test /api/samples endpoint exists"""
        response = requests.get(f"{BASE_URL}/api/samples")
        assert response.status_code == 200
        samples = response.json()
        print(f"✅ Samples endpoint working, found {len(samples)} samples")
    
    def test_samples_by_project(self):
        """Test filtering samples by project"""
        # Get a project first
        response = requests.get(f"{BASE_URL}/api/projects")
        assert response.status_code == 200
        projects = response.json()
        
        if not projects:
            pytest.skip("No projects available for testing")
        
        project_id = projects[0]["id"]
        
        # Get samples for this project
        response = requests.get(f"{BASE_URL}/api/samples?project_id={project_id}")
        assert response.status_code == 200
        samples = response.json()
        print(f"✅ Samples by project working, found {len(samples)} samples for project {project_id}")


class TestProjectEndpoints:
    """Test project-related endpoints"""
    
    def test_get_projects(self):
        """Test /api/projects returns list of projects"""
        response = requests.get(f"{BASE_URL}/api/projects")
        assert response.status_code == 200
        projects = response.json()
        assert isinstance(projects, list)
        print(f"✅ Projects endpoint working, found {len(projects)} projects")
    
    def test_get_project_checklist(self):
        """Test getting project with checklist sheet type"""
        response = requests.get(f"{BASE_URL}/api/projects")
        assert response.status_code == 200
        projects = response.json()
        
        if not projects:
            pytest.skip("No projects available for testing")
        
        project_id = projects[0]["id"]
        
        response = requests.get(f"{BASE_URL}/api/projects/{project_id}?sheet_type=checklist")
        assert response.status_code == 200
        project = response.json()
        assert "name" in project
        assert "rooms" in project
        print(f"✅ Project checklist working: {project['name']}, {len(project.get('rooms', []))} rooms")


class TestItemCRUD:
    """Test item CRUD operations"""
    
    @pytest.fixture
    def test_subcategory_id(self):
        """Get a valid subcategory ID for testing"""
        response = requests.get(f"{BASE_URL}/api/projects")
        projects = response.json()
        
        if not projects:
            pytest.skip("No projects available for testing")
        
        project_id = projects[0]["id"]
        response = requests.get(f"{BASE_URL}/api/projects/{project_id}?sheet_type=checklist")
        project = response.json()
        
        for room in project.get("rooms", []):
            for category in room.get("categories", []):
                for subcategory in category.get("subcategories", []):
                    return subcategory["id"]
        
        pytest.skip("No subcategories available for testing")
    
    def test_item_crud_flow(self, test_subcategory_id):
        """Test full CRUD flow for items"""
        # CREATE
        item_data = {
            "name": f"TEST_CRUD_ITEM_{datetime.now().strftime('%H%M%S')}",
            "vendor": "Test Vendor",
            "sku": "TEST-SKU-001",
            "cost": 100.00,
            "size": "Large",
            "finish_color": "Blue",
            "quantity": None,  # Blank quantity
            "status": "PICKED",
            "link": "https://example.com",
            "image_url": "",
            "subcategory_id": test_subcategory_id,
            "order_index": 999
        }
        
        create_response = requests.post(f"{BASE_URL}/api/items", json=item_data)
        assert create_response.status_code == 200
        created_item = create_response.json()
        item_id = created_item["id"]
        print(f"✅ Created item: {item_id}")
        
        # READ
        get_response = requests.get(f"{BASE_URL}/api/items/{item_id}")
        assert get_response.status_code == 200
        fetched_item = get_response.json()
        assert fetched_item["name"] == item_data["name"]
        assert fetched_item["quantity"] is None  # Verify blank quantity persisted
        print(f"✅ Read item: {fetched_item['name']}, quantity={fetched_item['quantity']}")
        
        # UPDATE
        update_data = {"name": "UPDATED_TEST_ITEM", "quantity": 5}
        update_response = requests.put(f"{BASE_URL}/api/items/{item_id}", json=update_data)
        assert update_response.status_code == 200
        updated_item = update_response.json()
        assert updated_item["name"] == "UPDATED_TEST_ITEM"
        assert updated_item["quantity"] == 5
        print(f"✅ Updated item: {updated_item['name']}, quantity={updated_item['quantity']}")
        
        # DELETE
        delete_response = requests.delete(f"{BASE_URL}/api/items/{item_id}")
        assert delete_response.status_code == 200
        print(f"✅ Deleted item: {item_id}")
        
        # VERIFY DELETION
        verify_response = requests.get(f"{BASE_URL}/api/items/{item_id}")
        assert verify_response.status_code == 404
        print(f"✅ Verified item deleted")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])

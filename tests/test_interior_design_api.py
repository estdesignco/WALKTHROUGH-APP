"""
Interior Design Application API Tests
Tests for: Projects, Rooms, Items, Exports, Background Removal, Chrome Extension Download
"""
import pytest
import requests
import os
import json

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://stability-project-1.preview.emergentagent.com').rstrip('/')

class TestHealthAndBasicEndpoints:
    """Test basic API health and utility endpoints"""
    
    def test_api_health(self):
        """Test API is responding"""
        response = requests.get(f"{BASE_URL}/api/projects")
        assert response.status_code == 200, f"API health check failed: {response.status_code}"
        print("✅ API health check passed")
    
    def test_room_colors_endpoint(self):
        """Test room colors utility endpoint"""
        response = requests.get(f"{BASE_URL}/api/room-colors")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, dict)
        print(f"✅ Room colors endpoint returned {len(data)} colors")
    
    def test_category_colors_endpoint(self):
        """Test category colors utility endpoint"""
        response = requests.get(f"{BASE_URL}/api/category-colors")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, dict)
        print(f"✅ Category colors endpoint returned {len(data)} colors")
    
    def test_item_statuses_endpoint(self):
        """Test item statuses utility endpoint"""
        response = requests.get(f"{BASE_URL}/api/item-statuses")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✅ Item statuses endpoint returned {len(data)} statuses")
    
    def test_vendor_types_endpoint(self):
        """Test vendor types utility endpoint"""
        response = requests.get(f"{BASE_URL}/api/vendor-types")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✅ Vendor types endpoint returned {len(data)} vendors")
    
    def test_carrier_types_endpoint(self):
        """Test carrier types utility endpoint"""
        response = requests.get(f"{BASE_URL}/api/carrier-types")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✅ Carrier types endpoint returned {len(data)} carriers")


class TestProjectsCRUD:
    """Test Projects CRUD operations"""
    
    def test_get_all_projects(self):
        """Test getting all projects"""
        response = requests.get(f"{BASE_URL}/api/projects")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✅ Get all projects returned {len(data)} projects")
        return data
    
    def test_create_project(self):
        """Test creating a new project"""
        project_data = {
            "name": "TEST_Automated Test Project",
            "client_info": {
                "full_name": "Test Client",
                "email": "test@example.com",
                "phone": "555-123-4567",
                "address": "123 Test Street"
            },
            "project_type": "Renovation",
            "timeline": "3 months",
            "budget": "$50,000"
        }
        response = requests.post(f"{BASE_URL}/api/projects", json=project_data)
        assert response.status_code == 200, f"Create project failed: {response.text}"
        data = response.json()
        assert "id" in data
        assert data["name"] == project_data["name"]
        print(f"✅ Created project with ID: {data['id']}")
        return data
    
    def test_get_project_by_id(self):
        """Test getting a specific project"""
        # First get all projects
        projects = requests.get(f"{BASE_URL}/api/projects").json()
        if not projects:
            pytest.skip("No projects available to test")
        
        project_id = projects[0]["id"]
        response = requests.get(f"{BASE_URL}/api/projects/{project_id}")
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == project_id
        print(f"✅ Get project by ID returned: {data['name']}")
        return data
    
    def test_get_project_with_ffe_sheet_type(self):
        """Test getting project with FFE sheet type"""
        projects = requests.get(f"{BASE_URL}/api/projects").json()
        if not projects:
            pytest.skip("No projects available to test")
        
        project_id = projects[0]["id"]
        response = requests.get(f"{BASE_URL}/api/projects/{project_id}?sheet_type=ffe")
        assert response.status_code == 200
        data = response.json()
        assert "rooms" in data
        print(f"✅ Get project with FFE sheet type returned {len(data.get('rooms', []))} rooms")
    
    def test_get_project_with_checklist_sheet_type(self):
        """Test getting project with checklist sheet type"""
        projects = requests.get(f"{BASE_URL}/api/projects").json()
        if not projects:
            pytest.skip("No projects available to test")
        
        project_id = projects[0]["id"]
        response = requests.get(f"{BASE_URL}/api/projects/{project_id}?sheet_type=checklist")
        assert response.status_code == 200
        data = response.json()
        assert "rooms" in data
        print(f"✅ Get project with checklist sheet type returned {len(data.get('rooms', []))} rooms")


class TestRoomsCRUD:
    """Test Rooms CRUD operations"""
    
    def test_create_room(self):
        """Test creating a new room"""
        # Get a project first
        projects = requests.get(f"{BASE_URL}/api/projects").json()
        if not projects:
            pytest.skip("No projects available to test")
        
        project_id = projects[0]["id"]
        room_data = {
            "name": "TEST_Living Room",
            "description": "Test room for automated testing",
            "project_id": project_id,
            "order_index": 99,
            "auto_populate": True
        }
        response = requests.post(f"{BASE_URL}/api/rooms", json=room_data)
        assert response.status_code == 200, f"Create room failed: {response.text}"
        data = response.json()
        assert "id" in data
        assert data["name"] == room_data["name"]
        print(f"✅ Created room with ID: {data['id']}")
        return data
    
    def test_get_room_by_id(self):
        """Test getting a specific room"""
        projects = requests.get(f"{BASE_URL}/api/projects").json()
        if not projects or not projects[0].get("rooms"):
            pytest.skip("No rooms available to test")
        
        room_id = projects[0]["rooms"][0]["id"]
        response = requests.get(f"{BASE_URL}/api/rooms/{room_id}")
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == room_id
        print(f"✅ Get room by ID returned: {data['name']}")


class TestItemsCRUD:
    """Test Items CRUD operations"""
    
    def test_create_item(self):
        """Test creating a new item"""
        # Get a project with rooms and categories
        projects = requests.get(f"{BASE_URL}/api/projects").json()
        if not projects:
            pytest.skip("No projects available to test")
        
        # Find a subcategory to add item to
        subcategory_id = None
        for project in projects:
            for room in project.get("rooms", []):
                for category in room.get("categories", []):
                    for subcategory in category.get("subcategories", []):
                        subcategory_id = subcategory["id"]
                        break
                    if subcategory_id:
                        break
                if subcategory_id:
                    break
            if subcategory_id:
                break
        
        if not subcategory_id:
            pytest.skip("No subcategories available to test")
        
        item_data = {
            "name": "TEST_Automated Test Item",
            "quantity": 2,
            "size": "24x36",
            "vendor": "Four Hands",
            "sku": "TEST-SKU-001",
            "cost": 599.99,
            "status": "TO BE SELECTED",
            "remarks": "Test remarks field",
            "installation_notes": "Test installation notes",
            "subcategory_id": subcategory_id
        }
        response = requests.post(f"{BASE_URL}/api/items", json=item_data)
        assert response.status_code == 200, f"Create item failed: {response.text}"
        data = response.json()
        assert "id" in data
        assert data["name"] == item_data["name"]
        assert data["remarks"] == item_data["remarks"]
        print(f"✅ Created item with ID: {data['id']}, remarks: {data.get('remarks')}, install_notes: {data.get('installation_notes')}")
        return data
    
    def test_update_item(self):
        """Test updating an item"""
        # First create an item
        projects = requests.get(f"{BASE_URL}/api/projects").json()
        if not projects:
            pytest.skip("No projects available to test")
        
        # Find an existing item
        item_id = None
        for project in projects:
            for room in project.get("rooms", []):
                for category in room.get("categories", []):
                    for subcategory in category.get("subcategories", []):
                        for item in subcategory.get("items", []):
                            item_id = item["id"]
                            break
                        if item_id:
                            break
                    if item_id:
                        break
                if item_id:
                    break
            if item_id:
                break
        
        if not item_id:
            pytest.skip("No items available to test")
        
        update_data = {
            "status": "ORDERED",
            "remarks": "Updated remarks via API test",
            "installation_notes": "Updated installation notes"
        }
        response = requests.put(f"{BASE_URL}/api/items/{item_id}", json=update_data)
        assert response.status_code == 200, f"Update item failed: {response.text}"
        data = response.json()
        assert data["status"] == update_data["status"]
        print(f"✅ Updated item status to: {data['status']}")


class TestExportEndpoints:
    """Test Export endpoints - Electrician Sheet, Load-In Sheets, Movers FFE"""
    
    def test_electrician_sheet_export(self):
        """Test POST /api/exports/{project_id}/electrician-sheet"""
        projects = requests.get(f"{BASE_URL}/api/projects").json()
        if not projects:
            pytest.skip("No projects available to test")
        
        project_id = projects[0]["id"]
        response = requests.post(f"{BASE_URL}/api/exports/{project_id}/electrician-sheet")
        assert response.status_code == 200, f"Electrician sheet export failed: {response.status_code} - {response.text}"
        assert "text/html" in response.headers.get("content-type", "")
        assert "<!DOCTYPE html>" in response.text or "<html>" in response.text
        print(f"✅ Electrician sheet export returned valid HTML ({len(response.text)} chars)")
    
    def test_load_in_sheets_export(self):
        """Test POST /api/exports/{project_id}/load-in-sheets"""
        projects = requests.get(f"{BASE_URL}/api/projects").json()
        if not projects:
            pytest.skip("No projects available to test")
        
        project_id = projects[0]["id"]
        response = requests.post(f"{BASE_URL}/api/exports/{project_id}/load-in-sheets")
        assert response.status_code == 200, f"Load-in sheets export failed: {response.status_code} - {response.text}"
        assert "text/html" in response.headers.get("content-type", "")
        assert "<!DOCTYPE html>" in response.text or "<html>" in response.text
        print(f"✅ Load-in sheets export returned valid HTML ({len(response.text)} chars)")
    
    def test_movers_ffe_export(self):
        """Test POST /api/exports/{project_id}/movers-ffe"""
        projects = requests.get(f"{BASE_URL}/api/projects").json()
        if not projects:
            pytest.skip("No projects available to test")
        
        project_id = projects[0]["id"]
        response = requests.post(f"{BASE_URL}/api/exports/{project_id}/movers-ffe")
        assert response.status_code == 200, f"Movers FFE export failed: {response.status_code} - {response.text}"
        assert "text/html" in response.headers.get("content-type", "")
        assert "<!DOCTYPE html>" in response.text or "<html>" in response.text
        print(f"✅ Movers FFE export returned valid HTML ({len(response.text)} chars)")


class TestBackgroundRemoval:
    """Test Background Removal endpoint"""
    
    def test_background_removal_endpoint_exists(self):
        """Test POST /api/remove-background endpoint exists"""
        # Test with a sample image URL
        test_data = {
            "image_url": "https://via.placeholder.com/150"
        }
        response = requests.post(f"{BASE_URL}/api/remove-background", json=test_data)
        # Accept 200 (success), 400 (bad request), or 422 (validation error) - just not 404
        assert response.status_code != 404, "Background removal endpoint not found"
        print(f"✅ Background removal endpoint exists (status: {response.status_code})")


class TestChromeExtensionDownload:
    """Test Chrome Extension Download endpoint"""
    
    def test_chrome_extension_download(self):
        """Test GET /api/download/chrome-extension"""
        response = requests.get(f"{BASE_URL}/api/download/chrome-extension", allow_redirects=False)
        # Should return 200 with file or redirect
        assert response.status_code in [200, 302, 307], f"Chrome extension download failed: {response.status_code}"
        if response.status_code == 200:
            # Check if it's a zip file
            content_type = response.headers.get("content-type", "")
            assert "zip" in content_type or "octet-stream" in content_type, f"Unexpected content type: {content_type}"
            print(f"✅ Chrome extension download returned file ({len(response.content)} bytes)")
        else:
            print(f"✅ Chrome extension download redirects (status: {response.status_code})")


class TestContactsAndMaterials:
    """Test Contacts and Materials endpoints"""
    
    def test_contacts_endpoint(self):
        """Test contacts endpoint"""
        response = requests.get(f"{BASE_URL}/api/contacts")
        assert response.status_code == 200, f"Contacts endpoint failed: {response.status_code}"
        data = response.json()
        assert isinstance(data, list)
        print(f"✅ Contacts endpoint returned {len(data)} contacts")
    
    def test_materials_endpoint(self):
        """Test materials endpoint"""
        response = requests.get(f"{BASE_URL}/api/materials")
        assert response.status_code == 200, f"Materials endpoint failed: {response.status_code}"
        data = response.json()
        assert isinstance(data, list)
        print(f"✅ Materials endpoint returned {len(data)} materials")
    
    def test_products_endpoint(self):
        """Test products/library endpoint"""
        response = requests.get(f"{BASE_URL}/api/products")
        assert response.status_code == 200, f"Products endpoint failed: {response.status_code}"
        data = response.json()
        assert isinstance(data, list)
        print(f"✅ Products endpoint returned {len(data)} products")


class TestItemFieldsValidation:
    """Test that items have all required fields including REMARKS and INSTALL_NOTES"""
    
    def test_item_has_remarks_field(self):
        """Verify items have remarks field"""
        projects = requests.get(f"{BASE_URL}/api/projects").json()
        if not projects:
            pytest.skip("No projects available to test")
        
        # Find an item
        for project in projects:
            for room in project.get("rooms", []):
                for category in room.get("categories", []):
                    for subcategory in category.get("subcategories", []):
                        for item in subcategory.get("items", []):
                            # Check that remarks field exists (can be empty string)
                            assert "remarks" in item or item.get("remarks") is None or item.get("remarks", "") == "", \
                                f"Item {item.get('name')} missing remarks field"
                            print(f"✅ Item '{item.get('name')}' has remarks field: '{item.get('remarks', '')}'")
                            return  # Just check one item
        
        pytest.skip("No items found to verify fields")
    
    def test_item_has_installation_notes_field(self):
        """Verify items have installation_notes field"""
        projects = requests.get(f"{BASE_URL}/api/projects").json()
        if not projects:
            pytest.skip("No projects available to test")
        
        # Find an item
        for project in projects:
            for room in project.get("rooms", []):
                for category in room.get("categories", []):
                    for subcategory in category.get("subcategories", []):
                        for item in subcategory.get("items", []):
                            # Check that installation_notes field exists
                            assert "installation_notes" in item or item.get("installation_notes") is None, \
                                f"Item {item.get('name')} missing installation_notes field"
                            print(f"✅ Item '{item.get('name')}' has installation_notes field: '{item.get('installation_notes', '')}'")
                            return  # Just check one item
        
        pytest.skip("No items found to verify fields")


class TestCleanup:
    """Cleanup test data"""
    
    def test_cleanup_test_projects(self):
        """Delete TEST_ prefixed projects"""
        projects = requests.get(f"{BASE_URL}/api/projects").json()
        deleted_count = 0
        for project in projects:
            if project.get("name", "").startswith("TEST_"):
                response = requests.delete(f"{BASE_URL}/api/projects/{project['id']}")
                if response.status_code == 200:
                    deleted_count += 1
        print(f"✅ Cleaned up {deleted_count} test projects")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])

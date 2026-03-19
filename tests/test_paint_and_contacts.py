"""
Test Paint Catalog and Master Contacts APIs
Tests for iteration 31 - Paint Catalog Page, Vendor Tabs, Paint Color Autocomplete
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://stability-first-2.preview.emergentagent.com').rstrip('/')

class TestPaintColorsAPI:
    """Test /api/paint-colors endpoint"""
    
    def test_paint_colors_endpoint_returns_200(self):
        """Test that paint colors endpoint returns 200"""
        response = requests.get(f"{BASE_URL}/api/paint-colors")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
    
    def test_paint_colors_returns_data_structure(self):
        """Test that paint colors returns proper data structure"""
        response = requests.get(f"{BASE_URL}/api/paint-colors")
        data = response.json()
        
        assert "data" in data, "Response should have 'data' key"
        assert isinstance(data["data"], dict), "Data should be a dictionary"
    
    def test_paint_colors_has_sherwin_williams(self):
        """Test that Sherwin Williams colors are present"""
        response = requests.get(f"{BASE_URL}/api/paint-colors")
        data = response.json()
        
        assert "Sherwin Williams" in data["data"], "Should have Sherwin Williams manufacturer"
        sw_data = data["data"]["Sherwin Williams"]
        assert isinstance(sw_data, dict), "Sherwin Williams data should be a dict of categories"
        assert len(sw_data) > 0, "Sherwin Williams should have categories"
    
    def test_paint_colors_has_benjamin_moore(self):
        """Test that Benjamin Moore colors are present"""
        response = requests.get(f"{BASE_URL}/api/paint-colors")
        data = response.json()
        
        assert "Benjamin Moore" in data["data"], "Should have Benjamin Moore manufacturer"
        bm_data = data["data"]["Benjamin Moore"]
        assert isinstance(bm_data, dict), "Benjamin Moore data should be a dict of categories"
        assert len(bm_data) > 0, "Benjamin Moore should have categories"
    
    def test_paint_colors_has_farrow_ball(self):
        """Test that Farrow & Ball colors are present"""
        response = requests.get(f"{BASE_URL}/api/paint-colors")
        data = response.json()
        
        assert "Farrow & Ball" in data["data"], "Should have Farrow & Ball manufacturer"
        fb_data = data["data"]["Farrow & Ball"]
        assert isinstance(fb_data, dict), "Farrow & Ball data should be a dict of categories"
        assert len(fb_data) > 0, "Farrow & Ball should have categories"
    
    def test_paint_colors_has_color_names(self):
        """Test that color names are strings in arrays"""
        response = requests.get(f"{BASE_URL}/api/paint-colors")
        data = response.json()
        
        # Check Sherwin Williams has actual color names
        sw_data = data["data"]["Sherwin Williams"]
        for category, colors in sw_data.items():
            assert isinstance(colors, list), f"Category {category} should have list of colors"
            assert len(colors) > 0, f"Category {category} should have colors"
            for color in colors:
                assert isinstance(color, str), f"Color should be string, got {type(color)}"
    
    def test_paint_colors_count(self):
        """Test that we have expected number of colors (130 per context)"""
        response = requests.get(f"{BASE_URL}/api/paint-colors")
        data = response.json()
        
        total_colors = 0
        for manufacturer, categories in data["data"].items():
            for category, colors in categories.items():
                total_colors += len(colors)
        
        # Should have around 130 colors as mentioned in context
        assert total_colors >= 100, f"Expected at least 100 colors, got {total_colors}"
        print(f"Total paint colors: {total_colors}")


class TestMasterContactsAPI:
    """Test /api/master/contacts endpoint"""
    
    def test_master_contacts_returns_200(self):
        """Test that master contacts endpoint returns 200"""
        response = requests.get(f"{BASE_URL}/api/master/contacts")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
    
    def test_master_contacts_returns_list(self):
        """Test that master contacts returns a list"""
        response = requests.get(f"{BASE_URL}/api/master/contacts")
        data = response.json()
        
        assert isinstance(data, list), "Response should be a list"
    
    def test_master_contacts_has_expected_count(self):
        """Test that we have expected number of contacts (134 vendors per context)"""
        response = requests.get(f"{BASE_URL}/api/master/contacts")
        data = response.json()
        
        # Should have around 134 vendor contacts as mentioned in context
        assert len(data) >= 100, f"Expected at least 100 contacts, got {len(data)}"
        print(f"Total contacts: {len(data)}")
    
    def test_master_contacts_vendor_filter(self):
        """Test that type=vendor filter works"""
        response = requests.get(f"{BASE_URL}/api/master/contacts?type=vendor")
        assert response.status_code == 200
        data = response.json()
        
        assert isinstance(data, list), "Response should be a list"
        # All returned contacts should be vendors
        for contact in data:
            if contact.get("type"):
                assert contact["type"].lower() == "vendor", f"Expected vendor type, got {contact.get('type')}"
        
        print(f"Vendor contacts: {len(data)}")
    
    def test_master_contacts_contact_filter(self):
        """Test that type=contact filter works"""
        response = requests.get(f"{BASE_URL}/api/master/contacts?type=contact")
        assert response.status_code == 200
        data = response.json()
        
        assert isinstance(data, list), "Response should be a list"
        # All returned contacts should be contacts (not vendors)
        for contact in data:
            if contact.get("type"):
                assert contact["type"].lower() == "contact", f"Expected contact type, got {contact.get('type')}"
        
        print(f"Non-vendor contacts: {len(data)}")
    
    def test_master_contacts_has_required_fields(self):
        """Test that contacts have required fields"""
        response = requests.get(f"{BASE_URL}/api/master/contacts")
        data = response.json()
        
        if len(data) > 0:
            contact = data[0]
            # Check for expected fields
            assert "id" in contact, "Contact should have id"
            assert "name" in contact, "Contact should have name"
            # Optional fields that should exist
            expected_fields = ["company", "role", "email", "phone"]
            for field in expected_fields:
                assert field in contact, f"Contact should have {field} field"
    
    def test_master_contacts_search_filter(self):
        """Test that search filter works"""
        response = requests.get(f"{BASE_URL}/api/master/contacts?search=Amazon")
        assert response.status_code == 200
        data = response.json()
        
        # Should find Amazon if it exists
        if len(data) > 0:
            found_amazon = any("amazon" in str(c.get("name", "")).lower() or 
                             "amazon" in str(c.get("company", "")).lower() 
                             for c in data)
            assert found_amazon, "Search for 'Amazon' should return Amazon contact"
    
    def test_master_contacts_roles_list(self):
        """Test that roles list endpoint works"""
        response = requests.get(f"{BASE_URL}/api/master/contacts/roles/list")
        assert response.status_code == 200
        data = response.json()
        
        assert "roles" in data, "Response should have 'roles' key"
        assert isinstance(data["roles"], list), "Roles should be a list"
        assert len(data["roles"]) > 0, "Should have at least one role"
        assert "Vendor" in data["roles"], "Should have 'Vendor' role"


class TestContactsCRUD:
    """Test CRUD operations for master contacts"""
    
    def test_create_and_delete_contact(self):
        """Test creating and deleting a contact"""
        # Create a test contact
        test_contact = {
            "name": "TEST_Contact_Delete_Me",
            "company": "TEST Company",
            "phone": "555-555-5555",
            "email": "test@test.com",
            "role": "Vendor",
            "type": "vendor"
        }
        
        # Create
        create_response = requests.post(f"{BASE_URL}/api/master/contacts", json=test_contact)
        assert create_response.status_code == 200, f"Create failed: {create_response.text}"
        
        created_data = create_response.json()
        assert created_data.get("success") == True, "Create should return success=True"
        assert "contact" in created_data, "Create should return contact data"
        
        contact_id = created_data["contact"]["id"]
        
        # Verify it exists
        get_response = requests.get(f"{BASE_URL}/api/master/contacts?search=TEST_Contact_Delete_Me")
        assert get_response.status_code == 200
        contacts = get_response.json()
        assert len(contacts) > 0, "Created contact should be findable"
        
        # Delete
        delete_response = requests.delete(f"{BASE_URL}/api/master/contacts/{contact_id}")
        assert delete_response.status_code == 200, f"Delete failed: {delete_response.text}"
        
        # Verify it's deleted
        verify_response = requests.get(f"{BASE_URL}/api/master/contacts?search=TEST_Contact_Delete_Me")
        verify_contacts = verify_response.json()
        found = any(c.get("id") == contact_id for c in verify_contacts)
        assert not found, "Contact should be deleted"


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])

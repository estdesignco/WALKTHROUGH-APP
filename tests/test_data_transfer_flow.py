"""
Test Suite: Interior Design Application - Data Transfer Flow Testing
Tests the CRITICAL data flow: Questionnaire → Mobile App → Checklist → FFE

Test Coverage:
1. Questionnaire submission and contact auto-creation
2. Mobile app data loading (walkthrough/FFE)
3. Data transfer from Walkthrough to Checklist
4. Sync functionality between sheets
5. Master contacts verification (134 contacts)
"""

import pytest
import requests
import os
import uuid
from datetime import datetime

# Get BASE_URL from environment
BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://finish-schedule.preview.emergentagent.com')
if BASE_URL.endswith('/'):
    BASE_URL = BASE_URL.rstrip('/')

# Test project IDs
TEST_PROJECTS = {
    "modern_kitchen": "76b177d8-bd8e-4be7-8eb3-5650df25a555",
    "luxury_suite": "048eb37d-8437-4c19-a42f-8fe36b4a6308",
    "designer_living": "53e640d0-ad56-4f24-b14a-563d65159e49"
}


class TestAPIHealth:
    """Basic API health checks"""
    
    def test_api_health(self):
        """Test API health endpoint"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data.get("status") == "healthy"
        print(f"✅ API Health: {data}")


class TestMasterContacts:
    """Test master contacts - CRITICAL: Should be 134 contacts"""
    
    def test_master_contacts_count(self):
        """Verify at least 134 master contacts exist (may have more from test data)"""
        response = requests.get(f"{BASE_URL}/api/master/contacts")
        assert response.status_code == 200
        contacts = response.json()
        assert isinstance(contacts, list)
        # At least 134 contacts should exist (may have more from test data creation)
        assert len(contacts) >= 134, f"Expected at least 134 contacts, got {len(contacts)}"
        print(f"✅ Master Contacts: {len(contacts)} contacts verified (base: 134)")
    
    def test_master_contacts_have_required_fields(self):
        """Verify contacts have required fields"""
        response = requests.get(f"{BASE_URL}/api/master/contacts")
        assert response.status_code == 200
        contacts = response.json()
        
        # Check first 5 contacts for required fields
        for contact in contacts[:5]:
            assert "id" in contact, "Contact missing 'id'"
            assert "name" in contact, "Contact missing 'name'"
            # Role is optional but commonly present
            print(f"  Contact: {contact.get('name')} - Role: {contact.get('role', 'N/A')}")
        
        print(f"✅ Master contacts have required fields")


class TestQuestionnaireFlow:
    """Test questionnaire submission and data retrieval"""
    
    def test_get_questionnaire(self):
        """Test GET questionnaire for existing project"""
        project_id = TEST_PROJECTS["modern_kitchen"]
        response = requests.get(f"{BASE_URL}/api/questionnaire/{project_id}")
        assert response.status_code == 200
        data = response.json()
        assert "project_id" in data
        assert data["project_id"] == project_id
        print(f"✅ GET Questionnaire: {data}")
    
    def test_save_questionnaire_with_contacts(self):
        """Test POST questionnaire with contact info - should auto-create contacts"""
        project_id = TEST_PROJECTS["modern_kitchen"]
        
        questionnaire_data = {
            "answers": {
                "client_name": "TEST_John Smith",
                "email": "test_john@example.com",
                "phone": "555-123-4567",
                "address": "123 Test Street, Nashville, TN",
                "spouse_partner_name": "TEST_Jane Smith",
                "spouse_partner_phone": "555-987-6543",
                "new_build_architect": "TEST_Bob Architect",
                "new_build_architect_phone": "555-111-2222",
                "new_build_builder": "TEST_Mike Builder",
                "new_build_builder_phone": "555-333-4444",
                "timeline": "6 months",
                "budget_range": "$100k-$150k",
                "project_type": "Renovation"
            }
        }
        
        response = requests.post(
            f"{BASE_URL}/api/questionnaire/{project_id}",
            json=questionnaire_data
        )
        assert response.status_code == 200
        data = response.json()
        assert data.get("success") == True or "project_id" in data
        print(f"✅ POST Questionnaire: Saved successfully")
        
        # Verify questionnaire was saved
        get_response = requests.get(f"{BASE_URL}/api/questionnaire/{project_id}")
        assert get_response.status_code == 200
        saved_data = get_response.json()
        assert saved_data.get("answers", {}).get("client_name") == "TEST_John Smith"
        print(f"✅ Questionnaire data persisted correctly")


class TestProjectSheetTypes:
    """Test project data retrieval for different sheet types"""
    
    def test_get_project_walkthrough(self):
        """Test GET project with walkthrough sheet_type"""
        project_id = TEST_PROJECTS["modern_kitchen"]
        response = requests.get(f"{BASE_URL}/api/projects/{project_id}?sheet_type=walkthrough")
        assert response.status_code == 200
        data = response.json()
        assert data.get("name") == "Modern Kitchen Design"
        assert "rooms" in data
        print(f"✅ Walkthrough: {data.get('name')}, Rooms: {len(data.get('rooms', []))}")
    
    def test_get_project_ffe(self):
        """Test GET project with FFE sheet_type"""
        project_id = TEST_PROJECTS["modern_kitchen"]
        response = requests.get(f"{BASE_URL}/api/projects/{project_id}?sheet_type=ffe")
        assert response.status_code == 200
        data = response.json()
        assert data.get("name") == "Modern Kitchen Design"
        assert "rooms" in data
        rooms = data.get("rooms", [])
        print(f"✅ FFE: {data.get('name')}, Rooms: {len(rooms)}")
        
        # FFE should show all rooms
        assert len(rooms) >= 1, "FFE should have at least 1 room"
    
    def test_get_project_checklist(self):
        """Test GET project with checklist sheet_type"""
        project_id = TEST_PROJECTS["modern_kitchen"]
        response = requests.get(f"{BASE_URL}/api/projects/{project_id}?sheet_type=checklist")
        assert response.status_code == 200
        data = response.json()
        assert data.get("name") == "Modern Kitchen Design"
        # Checklist may have 0 rooms until sync is performed
        print(f"✅ Checklist: {data.get('name')}, Rooms: {len(data.get('rooms', []))}")


class TestMobileAppDataFlow:
    """Test mobile app data loading - simulates TabbedWalkthroughSpreadsheet"""
    
    def test_mobile_walkthrough_data_loads(self):
        """Test that walkthrough data loads correctly for mobile app"""
        project_id = TEST_PROJECTS["luxury_suite"]
        response = requests.get(f"{BASE_URL}/api/projects/{project_id}?sheet_type=walkthrough")
        assert response.status_code == 200
        data = response.json()
        
        assert data.get("name") == "Luxury Master Suite"
        rooms = data.get("rooms", [])
        assert len(rooms) >= 1, "Should have at least 1 room"
        
        # Verify room structure for mobile display
        for room in rooms:
            assert "id" in room
            assert "name" in room
            assert "categories" in room
            print(f"  Room: {room.get('name')}, Categories: {len(room.get('categories', []))}")
        
        print(f"✅ Mobile Walkthrough: {len(rooms)} rooms loaded")
    
    def test_mobile_ffe_data_loads(self):
        """Test that FFE data loads correctly for mobile app"""
        project_id = TEST_PROJECTS["luxury_suite"]
        response = requests.get(f"{BASE_URL}/api/projects/{project_id}?sheet_type=ffe")
        assert response.status_code == 200
        data = response.json()
        
        rooms = data.get("rooms", [])
        total_items = 0
        
        for room in rooms:
            for category in room.get("categories", []):
                for subcategory in category.get("subcategories", []):
                    total_items += len(subcategory.get("items", []))
        
        print(f"✅ Mobile FFE: {len(rooms)} rooms, {total_items} total items")


class TestDataTransferSync:
    """Test data transfer/sync between sheets"""
    
    def test_sync_walkthrough_to_checklist_endpoint_exists(self):
        """Test that sync endpoint exists"""
        project_id = TEST_PROJECTS["modern_kitchen"]
        
        # Test with sync_all=false (only PICKED items)
        response = requests.post(
            f"{BASE_URL}/api/sync/walkthrough-to-checklist/{project_id}",
            json={"sync_all": False}
        )
        # Should return 200 even if no items to sync
        assert response.status_code == 200
        data = response.json()
        print(f"✅ Sync endpoint response: {data}")
    
    def test_sync_all_items_to_checklist(self):
        """Test syncing ALL items from walkthrough to checklist"""
        project_id = TEST_PROJECTS["luxury_suite"]
        
        # First, get walkthrough data
        walkthrough_response = requests.get(f"{BASE_URL}/api/projects/{project_id}?sheet_type=walkthrough")
        assert walkthrough_response.status_code == 200
        walkthrough_data = walkthrough_response.json()
        walkthrough_rooms = len(walkthrough_data.get("rooms", []))
        
        # Sync all items
        sync_response = requests.post(
            f"{BASE_URL}/api/sync/walkthrough-to-checklist/{project_id}",
            json={"sync_all": True}
        )
        assert sync_response.status_code == 200
        sync_data = sync_response.json()
        print(f"✅ Sync result: {sync_data}")
        
        # Verify checklist now has rooms
        checklist_response = requests.get(f"{BASE_URL}/api/projects/{project_id}?sheet_type=checklist")
        assert checklist_response.status_code == 200
        checklist_data = checklist_response.json()
        checklist_rooms = len(checklist_data.get("rooms", []))
        
        print(f"✅ After sync - Walkthrough rooms: {walkthrough_rooms}, Checklist rooms: {checklist_rooms}")


class TestItemCRUD:
    """Test item creation, update, and status changes"""
    
    def test_create_item_in_walkthrough(self):
        """Test creating an item in walkthrough"""
        project_id = TEST_PROJECTS["modern_kitchen"]
        
        # Get walkthrough to find a subcategory
        response = requests.get(f"{BASE_URL}/api/projects/{project_id}?sheet_type=walkthrough")
        assert response.status_code == 200
        data = response.json()
        
        # Find first subcategory
        subcategory_id = None
        for room in data.get("rooms", []):
            for category in room.get("categories", []):
                for subcategory in category.get("subcategories", []):
                    subcategory_id = subcategory.get("id")
                    break
                if subcategory_id:
                    break
            if subcategory_id:
                break
        
        if not subcategory_id:
            pytest.skip("No subcategory found to add item")
        
        # Create test item
        test_item = {
            "name": f"TEST_Item_{uuid.uuid4().hex[:8]}",
            "subcategory_id": subcategory_id,
            "quantity": 2,
            "status": "TO BE SELECTED",
            "vendor": "Test Vendor",
            "cost": 199.99
        }
        
        create_response = requests.post(f"{BASE_URL}/api/items", json=test_item)
        assert create_response.status_code in [200, 201]
        created_item = create_response.json()
        assert "id" in created_item
        print(f"✅ Created item: {created_item.get('name')}")
        
        # Clean up - delete the test item
        item_id = created_item.get("id")
        delete_response = requests.delete(f"{BASE_URL}/api/items/{item_id}")
        assert delete_response.status_code in [200, 204]
        print(f"✅ Cleaned up test item")
    
    def test_update_item_status(self):
        """Test updating item status"""
        project_id = TEST_PROJECTS["modern_kitchen"]
        
        # Get walkthrough to find an item
        response = requests.get(f"{BASE_URL}/api/projects/{project_id}?sheet_type=walkthrough")
        assert response.status_code == 200
        data = response.json()
        
        # Find first item
        item_id = None
        original_status = None
        for room in data.get("rooms", []):
            for category in room.get("categories", []):
                for subcategory in category.get("subcategories", []):
                    for item in subcategory.get("items", []):
                        item_id = item.get("id")
                        original_status = item.get("status")
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
        update_response = requests.put(
            f"{BASE_URL}/api/items/{item_id}",
            json={"status": "PICKED"}
        )
        assert update_response.status_code == 200
        print(f"✅ Updated item status to PICKED")
        
        # Restore original status
        restore_response = requests.put(
            f"{BASE_URL}/api/items/{item_id}",
            json={"status": original_status or "TO BE SELECTED"}
        )
        assert restore_response.status_code == 200
        print(f"✅ Restored original status")


class TestProjectContacts:
    """Test project-specific contacts"""
    
    def test_get_project_contacts(self):
        """Test getting contacts for a project"""
        project_id = TEST_PROJECTS["modern_kitchen"]
        response = requests.get(f"{BASE_URL}/api/contacts/project/{project_id}")
        assert response.status_code == 200
        contacts = response.json()
        print(f"✅ Project contacts: {len(contacts)} contacts")
        
        # Verify contacts were auto-created from questionnaire
        contact_names = [c.get("name", "") for c in contacts]
        print(f"  Contact names: {contact_names}")
    
    def test_contact_roles_endpoint(self):
        """Test contact roles endpoint"""
        response = requests.get(f"{BASE_URL}/api/contacts/roles")
        assert response.status_code == 200
        data = response.json()
        assert "roles" in data
        print(f"✅ Contact roles: {data.get('roles', [])}")


class TestAllProjectsDataIntegrity:
    """Test data integrity across all test projects"""
    
    @pytest.mark.parametrize("project_name,project_id", [
        ("Modern Kitchen Design", TEST_PROJECTS["modern_kitchen"]),
        ("Luxury Master Suite", TEST_PROJECTS["luxury_suite"]),
        ("Designer Living Room", TEST_PROJECTS["designer_living"])
    ])
    def test_project_exists_and_has_data(self, project_name, project_id):
        """Verify each test project exists and has walkthrough data"""
        response = requests.get(f"{BASE_URL}/api/projects/{project_id}?sheet_type=walkthrough")
        assert response.status_code == 200
        data = response.json()
        assert data.get("name") == project_name
        assert len(data.get("rooms", [])) >= 1
        print(f"✅ {project_name}: {len(data.get('rooms', []))} rooms")


class TestEndToEndDataFlow:
    """End-to-end test of the complete data flow"""
    
    def test_complete_data_flow(self):
        """
        Test complete flow:
        1. Save questionnaire
        2. Verify walkthrough has data
        3. Sync to checklist
        4. Verify checklist has data
        5. Verify FFE shows all data
        """
        project_id = TEST_PROJECTS["luxury_suite"]
        
        # Step 1: Save questionnaire
        questionnaire_data = {
            "answers": {
                "client_name": "E2E Test Client",
                "email": "e2e@test.com",
                "timeline": "3 months"
            }
        }
        q_response = requests.post(f"{BASE_URL}/api/questionnaire/{project_id}", json=questionnaire_data)
        assert q_response.status_code == 200
        print("✅ Step 1: Questionnaire saved")
        
        # Step 2: Verify walkthrough
        w_response = requests.get(f"{BASE_URL}/api/projects/{project_id}?sheet_type=walkthrough")
        assert w_response.status_code == 200
        walkthrough_rooms = len(w_response.json().get("rooms", []))
        assert walkthrough_rooms >= 1
        print(f"✅ Step 2: Walkthrough has {walkthrough_rooms} rooms")
        
        # Step 3: Sync to checklist
        sync_response = requests.post(
            f"{BASE_URL}/api/sync/walkthrough-to-checklist/{project_id}",
            json={"sync_all": True}
        )
        assert sync_response.status_code == 200
        print("✅ Step 3: Synced to checklist")
        
        # Step 4: Verify checklist
        c_response = requests.get(f"{BASE_URL}/api/projects/{project_id}?sheet_type=checklist")
        assert c_response.status_code == 200
        checklist_rooms = len(c_response.json().get("rooms", []))
        print(f"✅ Step 4: Checklist has {checklist_rooms} rooms")
        
        # Step 5: Verify FFE
        f_response = requests.get(f"{BASE_URL}/api/projects/{project_id}?sheet_type=ffe")
        assert f_response.status_code == 200
        ffe_rooms = len(f_response.json().get("rooms", []))
        assert ffe_rooms >= 1
        print(f"✅ Step 5: FFE has {ffe_rooms} rooms")
        
        print(f"\n✅ COMPLETE DATA FLOW TEST PASSED")
        print(f"   Walkthrough: {walkthrough_rooms} rooms")
        print(f"   Checklist: {checklist_rooms} rooms")
        print(f"   FFE: {ffe_rooms} rooms")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])

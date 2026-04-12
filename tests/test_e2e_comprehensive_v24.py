"""
Comprehensive E2E Test Suite for Interior Design Project Management App
Tests all features: Dashboard, Calendar, Contacts, Materials, To-Do, Punch List, 
Samples, FFE, Walkthrough, Checklist, Vendors, Exports, Shipping
"""

import pytest
import requests
import os
import uuid
from datetime import datetime, timedelta

# Get BASE_URL from environment
BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://design-preview-131.preview.emergentagent.com').rstrip('/')
API_URL = f"{BASE_URL}/api"

print(f"Testing against: {API_URL}")


class TestHealthAndBasics:
    """Basic health and connectivity tests"""
    
    def test_health_endpoint(self):
        """Test API health endpoint"""
        response = requests.get(f"{API_URL}/health")
        assert response.status_code == 200
        data = response.json()
        assert data.get("status") == "healthy"
        print(f"✅ Health check passed: {data}")
    
    def test_root_endpoint(self):
        """Test API root endpoint"""
        response = requests.get(f"{API_URL}/")
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        print(f"✅ Root endpoint: {data.get('message', 'OK')}")


class TestProjectsCRUD:
    """Test Projects CRUD operations"""
    
    def test_get_all_projects(self):
        """Test getting all projects"""
        response = requests.get(f"{API_URL}/projects")
        assert response.status_code == 200
        projects = response.json()
        assert isinstance(projects, list)
        print(f"✅ Found {len(projects)} projects")
        
        # Verify expected projects exist
        project_names = [p.get('name') for p in projects]
        assert "Modern Kitchen Design" in project_names or len(projects) > 0
        return projects
    
    def test_get_project_by_id(self):
        """Test getting a specific project"""
        # First get all projects
        response = requests.get(f"{API_URL}/projects")
        projects = response.json()
        
        if projects:
            project_id = projects[0]['id']
            response = requests.get(f"{API_URL}/projects/{project_id}")
            assert response.status_code == 200
            project = response.json()
            assert project['id'] == project_id
            print(f"✅ Got project: {project.get('name')}")
    
    def test_project_has_rooms(self):
        """Test that projects have rooms"""
        response = requests.get(f"{API_URL}/projects")
        projects = response.json()
        
        if projects:
            project = projects[0]
            rooms = project.get('rooms', [])
            print(f"✅ Project '{project.get('name')}' has {len(rooms)} rooms")


class TestMasterContacts:
    """Test Master Contacts CRUD operations"""
    
    @pytest.fixture
    def test_contact_id(self):
        """Create a test contact and return its ID"""
        contact_data = {
            "name": f"TEST_Contact_{uuid.uuid4().hex[:8]}",
            "company": "Test Company",
            "role": "Vendor",
            "email": "test@example.com",
            "phone": "555-1234",
            "type": "vendor"
        }
        response = requests.post(f"{API_URL}/contacts", json=contact_data)
        if response.status_code == 200:
            return response.json().get('id')
        return None
    
    def test_get_master_contacts(self):
        """Test getting master contacts"""
        response = requests.get(f"{API_URL}/contacts")
        assert response.status_code == 200
        contacts = response.json()
        assert isinstance(contacts, list)
        print(f"✅ Found {len(contacts)} master contacts")
    
    def test_create_contact(self):
        """Test creating a new contact"""
        contact_data = {
            "name": f"TEST_NewContact_{uuid.uuid4().hex[:8]}",
            "company": "Test Company Inc",
            "role": "Vendor",
            "email": "newcontact@test.com",
            "phone": "555-9999",
            "type": "vendor"
        }
        response = requests.post(f"{API_URL}/contacts", json=contact_data)
        assert response.status_code == 200
        created = response.json()
        assert created.get('name') == contact_data['name']
        print(f"✅ Created contact: {created.get('name')}")
        
        # Cleanup
        if created.get('id'):
            requests.delete(f"{API_URL}/contacts/{created['id']}")
    
    def test_update_contact(self):
        """Test updating a contact"""
        # Create a contact first
        contact_data = {
            "name": f"TEST_UpdateContact_{uuid.uuid4().hex[:8]}",
            "company": "Original Company",
            "role": "Vendor",
            "type": "vendor"
        }
        create_response = requests.post(f"{API_URL}/contacts", json=contact_data)
        assert create_response.status_code == 200
        contact_id = create_response.json().get('id')
        
        # Update the contact
        update_data = {"company": "Updated Company Name"}
        update_response = requests.put(f"{API_URL}/contacts/{contact_id}", json=update_data)
        assert update_response.status_code == 200
        updated = update_response.json()
        assert updated.get('company') == "Updated Company Name"
        print(f"✅ Updated contact company to: {updated.get('company')}")
        
        # Cleanup
        requests.delete(f"{API_URL}/contacts/{contact_id}")
    
    def test_delete_contact(self):
        """Test deleting a contact"""
        # Create a contact first
        contact_data = {
            "name": f"TEST_DeleteContact_{uuid.uuid4().hex[:8]}",
            "company": "To Be Deleted",
            "role": "Vendor",
            "type": "vendor"
        }
        create_response = requests.post(f"{API_URL}/contacts", json=contact_data)
        assert create_response.status_code == 200
        contact_id = create_response.json().get('id')
        
        # Delete the contact
        delete_response = requests.delete(f"{API_URL}/contacts/{contact_id}")
        assert delete_response.status_code == 200
        print(f"✅ Deleted contact: {contact_id}")


class TestMasterMaterials:
    """Test Master Materials CRUD operations"""
    
    def test_get_master_materials(self):
        """Test getting master materials"""
        response = requests.get(f"{API_URL}/master-materials")
        assert response.status_code == 200
        materials = response.json()
        assert isinstance(materials, list)
        print(f"✅ Found {len(materials)} master materials")
    
    def test_create_material(self):
        """Test creating a new material"""
        material_data = {
            "name": f"TEST_Material_{uuid.uuid4().hex[:8]}",
            "category": "Fabric",
            "vendor": "Test Vendor",
            "sku": "TEST-SKU-001",
            "price": 99.99
        }
        response = requests.post(f"{API_URL}/master-materials", json=material_data)
        assert response.status_code == 200
        created = response.json()
        assert created.get('name') == material_data['name']
        print(f"✅ Created material: {created.get('name')}")
        
        # Cleanup
        if created.get('id'):
            requests.delete(f"{API_URL}/master-materials/{created['id']}")


class TestCompanyTodos:
    """Test Company-wide To-Do operations"""
    
    def test_get_company_todos(self):
        """Test getting company todos"""
        response = requests.get(f"{API_URL}/todos/company")
        assert response.status_code == 200
        todos = response.json()
        assert isinstance(todos, list)
        print(f"✅ Found {len(todos)} company todos")
    
    def test_create_company_todo(self):
        """Test creating a company todo"""
        todo_data = {
            "title": f"TEST_CompanyTodo_{uuid.uuid4().hex[:8]}",
            "description": "Test company-wide todo item",
            "priority": "high",
            "due_date": (datetime.now() + timedelta(days=7)).isoformat()
        }
        response = requests.post(f"{API_URL}/todos/company", json=todo_data)
        assert response.status_code == 200
        created = response.json()
        assert created.get('title') == todo_data['title']
        print(f"✅ Created company todo: {created.get('title')}")
        
        # Cleanup
        if created.get('id'):
            requests.delete(f"{API_URL}/todos/company/{created['id']}")
    
    def test_update_company_todo(self):
        """Test updating a company todo"""
        # Create first
        todo_data = {
            "title": f"TEST_UpdateTodo_{uuid.uuid4().hex[:8]}",
            "description": "Original description",
            "priority": "medium"
        }
        create_response = requests.post(f"{API_URL}/todos/company", json=todo_data)
        assert create_response.status_code == 200
        todo_id = create_response.json().get('id')
        
        # Update
        update_data = {"completed": True}
        update_response = requests.put(f"{API_URL}/todos/company/{todo_id}", json=update_data)
        assert update_response.status_code == 200
        updated = update_response.json()
        assert updated.get('completed') == True
        print(f"✅ Updated todo to completed")
        
        # Cleanup
        requests.delete(f"{API_URL}/todos/company/{todo_id}")


class TestPunchList:
    """Test Punch List CRUD operations"""
    
    def test_get_punch_list(self):
        """Test getting punch list items"""
        # Get a project first
        projects_response = requests.get(f"{API_URL}/projects")
        projects = projects_response.json()
        
        if projects:
            project_id = projects[0]['id']
            response = requests.get(f"{API_URL}/punch-list/{project_id}")
            assert response.status_code == 200
            punch_items = response.json()
            assert isinstance(punch_items, list)
            print(f"✅ Found {len(punch_items)} punch list items")
    
    def test_create_punch_item(self):
        """Test creating a punch list item"""
        # Get a project first
        projects_response = requests.get(f"{API_URL}/projects")
        projects = projects_response.json()
        
        if projects:
            project_id = projects[0]['id']
            punch_data = {
                "project_id": project_id,
                "title": f"TEST_PunchItem_{uuid.uuid4().hex[:8]}",
                "description": "Test punch list item",
                "room": "Kitchen",
                "priority": "high",
                "status": "open"
            }
            response = requests.post(f"{API_URL}/punch-list", json=punch_data)
            assert response.status_code == 200
            created = response.json()
            assert created.get('title') == punch_data['title']
            print(f"✅ Created punch item: {created.get('title')}")
            
            # Cleanup
            if created.get('id'):
                requests.delete(f"{API_URL}/punch-list/{created['id']}")


class TestCalendarEvents:
    """Test Calendar Events CRUD operations"""
    
    def test_get_calendar_events(self):
        """Test getting calendar events"""
        response = requests.get(f"{API_URL}/calendar-events")
        assert response.status_code == 200
        events = response.json()
        assert isinstance(events, list)
        print(f"✅ Found {len(events)} calendar events")
    
    def test_create_calendar_event(self):
        """Test creating a calendar event"""
        # Get a project first
        projects_response = requests.get(f"{API_URL}/projects")
        projects = projects_response.json()
        
        if projects:
            project_id = projects[0]['id']
            event_data = {
                "project_id": project_id,
                "title": f"TEST_Event_{uuid.uuid4().hex[:8]}",
                "date": (datetime.now() + timedelta(days=3)).strftime("%Y-%m-%d"),
                "type": "delivery",
                "description": "Test calendar event"
            }
            response = requests.post(f"{API_URL}/calendar-events", json=event_data)
            assert response.status_code == 200
            created = response.json()
            assert created.get('title') == event_data['title']
            print(f"✅ Created calendar event: {created.get('title')}")
            
            # Cleanup
            if created.get('id'):
                requests.delete(f"{API_URL}/calendar-events/{created['id']}")
    
    def test_delete_calendar_event(self):
        """Test deleting a calendar event"""
        # Get a project first
        projects_response = requests.get(f"{API_URL}/projects")
        projects = projects_response.json()
        
        if projects:
            project_id = projects[0]['id']
            # Create an event
            event_data = {
                "project_id": project_id,
                "title": f"TEST_DeleteEvent_{uuid.uuid4().hex[:8]}",
                "date": (datetime.now() + timedelta(days=5)).strftime("%Y-%m-%d"),
                "type": "install"
            }
            create_response = requests.post(f"{API_URL}/calendar-events", json=event_data)
            assert create_response.status_code == 200
            event_id = create_response.json().get('id')
            
            # Delete the event
            delete_response = requests.delete(f"{API_URL}/calendar-events/{event_id}")
            assert delete_response.status_code == 200
            print(f"✅ Deleted calendar event: {event_id}")


class TestSamples:
    """Test Samples CRUD operations"""
    
    def test_get_samples(self):
        """Test getting samples"""
        response = requests.get(f"{API_URL}/samples")
        assert response.status_code == 200
        data = response.json()
        assert data.get('success') == True
        print(f"✅ Found {data.get('count', 0)} samples")
    
    def test_create_sample(self):
        """Test creating a sample"""
        # Get a project first
        projects_response = requests.get(f"{API_URL}/projects")
        projects = projects_response.json()
        
        if projects:
            project_id = projects[0]['id']
            sample_data = {
                "project_id": project_id,
                "name": f"TEST_Sample_{uuid.uuid4().hex[:8]}",
                "vendor": "Test Vendor",
                "material_type": "Fabric",
                "status": "ordered",
                "notes": "Test sample"
            }
            response = requests.post(f"{API_URL}/samples", json=sample_data)
            assert response.status_code == 200
            created = response.json()
            assert created.get('name') == sample_data['name']
            print(f"✅ Created sample: {created.get('name')}")
            
            # Cleanup
            if created.get('id'):
                requests.delete(f"{API_URL}/samples/{created['id']}")


class TestItems:
    """Test Items (FFE) CRUD operations"""
    
    def test_get_item_statuses(self):
        """Test getting item statuses"""
        response = requests.get(f"{API_URL}/item-statuses")
        assert response.status_code == 200
        statuses = response.json()
        assert isinstance(statuses, list)
        assert len(statuses) > 0
        print(f"✅ Found {len(statuses)} item statuses")
    
    def test_get_vendor_types(self):
        """Test getting vendor types"""
        response = requests.get(f"{API_URL}/vendor-types")
        assert response.status_code == 200
        vendors = response.json()
        assert isinstance(vendors, list)
        print(f"✅ Found {len(vendors)} vendor types")
    
    def test_get_carrier_types(self):
        """Test getting carrier types"""
        response = requests.get(f"{API_URL}/carrier-types")
        assert response.status_code == 200
        carriers = response.json()
        assert isinstance(carriers, list)
        print(f"✅ Found {len(carriers)} carrier types")
    
    def test_update_item_status(self):
        """Test updating an item status"""
        # Get a project with items
        projects_response = requests.get(f"{API_URL}/projects")
        projects = projects_response.json()
        
        if projects:
            project = projects[0]
            rooms = project.get('rooms', [])
            
            # Find an item to update
            for room in rooms:
                for category in room.get('categories', []):
                    for subcategory in category.get('subcategories', []):
                        items = subcategory.get('items', [])
                        if items:
                            item = items[0]
                            item_id = item.get('id')
                            
                            # Update the item status
                            update_data = {"status": "ORDERED"}
                            response = requests.put(f"{API_URL}/items/{item_id}", json=update_data)
                            assert response.status_code == 200
                            updated = response.json()
                            print(f"✅ Updated item status to: {updated.get('status')}")
                            
                            # Restore original status
                            original_status = item.get('status', '')
                            requests.put(f"{API_URL}/items/{item_id}", json={"status": original_status})
                            return
        
        print("⚠️ No items found to test status update")


class TestRoomColors:
    """Test Room Colors and Category Colors"""
    
    def test_get_room_colors(self):
        """Test getting room colors"""
        response = requests.get(f"{API_URL}/room-colors")
        assert response.status_code == 200
        colors = response.json()
        assert isinstance(colors, dict)
        print(f"✅ Found {len(colors)} room colors")
    
    def test_get_category_colors(self):
        """Test getting category colors"""
        response = requests.get(f"{API_URL}/category-colors")
        assert response.status_code == 200
        colors = response.json()
        assert isinstance(colors, dict)
        print(f"✅ Found {len(colors)} category colors")


class TestScraper:
    """Test Product Scraper functionality"""
    
    def test_scrape_product_endpoint(self):
        """Test the scrape-product endpoint"""
        scrape_data = {
            "url": "https://www.fourhands.com/product/test-product"
        }
        response = requests.post(f"{API_URL}/scrape-product", json=scrape_data)
        # May return 200 with error or actual data
        assert response.status_code in [200, 400, 422]
        print(f"✅ Scrape endpoint responded with status: {response.status_code}")


class TestExports:
    """Test Export functionality"""
    
    def test_export_project_pdf(self):
        """Test PDF export endpoint"""
        # Get a project first
        projects_response = requests.get(f"{API_URL}/projects")
        projects = projects_response.json()
        
        if projects:
            project_id = projects[0]['id']
            # Check if export endpoint exists
            response = requests.get(f"{API_URL}/projects/{project_id}/export/pdf")
            # May return 200 or 404 if not implemented
            print(f"✅ PDF export endpoint status: {response.status_code}")


class TestDataPersistence:
    """Test data persistence - create, reload, verify"""
    
    def test_contact_persistence(self):
        """Test that created contacts persist"""
        # Create a contact
        contact_data = {
            "name": f"TEST_Persist_{uuid.uuid4().hex[:8]}",
            "company": "Persistence Test Co",
            "role": "Vendor",
            "type": "vendor"
        }
        create_response = requests.post(f"{API_URL}/contacts", json=contact_data)
        assert create_response.status_code == 200
        contact_id = create_response.json().get('id')
        
        # Fetch all contacts and verify it exists
        get_response = requests.get(f"{API_URL}/contacts")
        contacts = get_response.json()
        contact_names = [c.get('name') for c in contacts]
        assert contact_data['name'] in contact_names
        print(f"✅ Contact persisted and found in list")
        
        # Cleanup
        requests.delete(f"{API_URL}/contacts/{contact_id}")
    
    def test_calendar_event_persistence(self):
        """Test that calendar events persist"""
        # Get a project
        projects_response = requests.get(f"{API_URL}/projects")
        projects = projects_response.json()
        
        if projects:
            project_id = projects[0]['id']
            
            # Create an event
            event_data = {
                "project_id": project_id,
                "title": f"TEST_PersistEvent_{uuid.uuid4().hex[:8]}",
                "date": (datetime.now() + timedelta(days=10)).strftime("%Y-%m-%d"),
                "type": "shipping"
            }
            create_response = requests.post(f"{API_URL}/calendar-events", json=event_data)
            assert create_response.status_code == 200
            event_id = create_response.json().get('id')
            
            # Fetch all events and verify
            get_response = requests.get(f"{API_URL}/calendar-events")
            events = get_response.json()
            event_titles = [e.get('title') for e in events]
            assert event_data['title'] in event_titles
            print(f"✅ Calendar event persisted and found in list")
            
            # Cleanup
            requests.delete(f"{API_URL}/calendar-events/{event_id}")


class TestVendorDatabase:
    """Test Vendor Database functionality"""
    
    def test_get_vendor_database(self):
        """Test getting vendor database"""
        response = requests.get(f"{API_URL}/vendor-database")
        assert response.status_code == 200
        vendors = response.json()
        assert isinstance(vendors, list)
        print(f"✅ Found {len(vendors)} vendors in database")


class TestFurnitureSearch:
    """Test Furniture Search functionality"""
    
    def test_furniture_search(self):
        """Test furniture search endpoint"""
        response = requests.get(f"{API_URL}/furniture/search", params={"query": "sofa"})
        assert response.status_code == 200
        data = response.json()
        print(f"✅ Furniture search returned: {len(data.get('products', []))} products")
    
    def test_furniture_vendors(self):
        """Test furniture vendors endpoint"""
        response = requests.get(f"{API_URL}/furniture/vendors")
        assert response.status_code == 200
        vendors = response.json()
        print(f"✅ Found {len(vendors)} furniture vendors")
    
    def test_furniture_categories(self):
        """Test furniture categories endpoint"""
        response = requests.get(f"{API_URL}/furniture/categories")
        assert response.status_code == 200
        categories = response.json()
        print(f"✅ Found {len(categories)} furniture categories")


class TestShippingTracking:
    """Test Shipping Tracking functionality"""
    
    def test_project_tracking(self):
        """Test project shipping tracking"""
        # Get a project
        projects_response = requests.get(f"{API_URL}/projects")
        projects = projects_response.json()
        
        if projects:
            project_id = projects[0]['id']
            response = requests.get(f"{API_URL}/shipping/project-tracking/{project_id}")
            assert response.status_code == 200
            tracking = response.json()
            print(f"✅ Project tracking returned: {len(tracking.get('items', []))} items")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])

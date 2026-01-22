"""
Launch-Critical Test Suite for Interior Design Project Management App - v25
Tests all 50+ features for production readiness
"""

import pytest
import requests
import os
import uuid
from datetime import datetime, timedelta

# Get BASE_URL from environment
BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://app-stability-fix-4.preview.emergentagent.com').rstrip('/')
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
        print(f"✅ Health check passed")
    
    def test_root_endpoint(self):
        """Test API root endpoint"""
        response = requests.get(f"{API_URL}/")
        assert response.status_code == 200
        print(f"✅ Root endpoint OK")


class TestProjectsCRUD:
    """Test Projects CRUD operations"""
    
    def test_get_all_projects(self):
        """Test getting all projects"""
        response = requests.get(f"{API_URL}/projects")
        assert response.status_code == 200
        projects = response.json()
        assert isinstance(projects, list)
        assert len(projects) > 0, "No projects found"
        print(f"✅ Found {len(projects)} projects")
    
    def test_get_project_by_id(self):
        """Test getting a specific project"""
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
            assert len(rooms) > 0, "Project should have rooms"
    
    def test_create_project(self):
        """Test creating a new project"""
        project_data = {
            "name": f"TEST_Project_{uuid.uuid4().hex[:8]}",
            "client_info": {
                "full_name": "Test Client",
                "email": "test@example.com",
                "phone": "555-1234"
            },
            "project_type": "New Construction"
        }
        response = requests.post(f"{API_URL}/projects", json=project_data)
        assert response.status_code == 200
        created = response.json()
        assert created.get('name') == project_data['name']
        print(f"✅ Created project: {created.get('name')}")
        
        # Cleanup
        project_id = created.get('id')
        if project_id:
            requests.delete(f"{API_URL}/projects/{project_id}")


class TestMasterContacts:
    """Test Master Contacts CRUD operations"""
    
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
            "name": f"TEST_Contact_{uuid.uuid4().hex[:8]}",
            "company": "Test Company Inc",
            "role": "Vendor",
            "email": "test@vendor.com",
            "phone": "555-9999",
            "type": "vendor"
        }
        response = requests.post(f"{API_URL}/contacts", json=contact_data)
        assert response.status_code in [200, 201]
        data = response.json()
        # Response may have 'contact' key or direct object
        created = data.get('contact', data)
        assert created.get('name') == contact_data['name']
        print(f"✅ Created contact: {created.get('name')}")
        
        # Cleanup
        contact_id = created.get('id')
        if contact_id:
            requests.delete(f"{API_URL}/contacts/{contact_id}")


class TestMasterMaterials:
    """Test Master Materials CRUD operations"""
    
    def test_get_master_materials(self):
        """Test getting master materials"""
        response = requests.get(f"{API_URL}/materials")
        assert response.status_code == 200
        materials = response.json()
        assert isinstance(materials, list)
        print(f"✅ Found {len(materials)} master materials")
    
    def test_create_material(self):
        """Test creating a new material"""
        material_data = {
            "name": f"TEST_Material_{uuid.uuid4().hex[:8]}",
            "category": "Fabric",
            "manufacturer": "Test Manufacturer",
            "sku": "TEST-SKU-001"
        }
        response = requests.post(f"{API_URL}/materials", json=material_data)
        assert response.status_code in [200, 201]
        data = response.json()
        created = data.get('material', data)
        assert created.get('name') == material_data['name']
        print(f"✅ Created material: {created.get('name')}")
        
        # Cleanup
        material_id = created.get('id')
        if material_id:
            requests.delete(f"{API_URL}/materials/{material_id}")


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
        event_data = {
            "title": f"TEST_Event_{uuid.uuid4().hex[:8]}",
            "date": (datetime.now() + timedelta(days=7)).isoformat(),
            "type": "Delivery",
            "description": "Test delivery event"
        }
        response = requests.post(f"{API_URL}/calendar-events", json=event_data)
        assert response.status_code in [200, 201]
        data = response.json()
        created = data.get('event', data)
        assert created.get('title') == event_data['title']
        print(f"✅ Created calendar event: {created.get('title')}")
        
        # Cleanup
        event_id = created.get('id')
        if event_id:
            requests.delete(f"{API_URL}/calendar-events/{event_id}")


class TestCompanyTodos:
    """Test Company To-Do operations"""
    
    def test_get_company_todos(self):
        """Test getting company todos"""
        response = requests.get(f"{API_URL}/todos/company")
        assert response.status_code == 200
        data = response.json()
        assert data.get('success') == True
        print(f"✅ Company todos endpoint working")
    
    def test_create_company_todo(self):
        """Test creating a company todo"""
        todo_data = {
            "text": f"TEST_Todo_{uuid.uuid4().hex[:8]}",
            "description": "Test company-wide todo item",
            "priority": "high"
        }
        response = requests.post(f"{API_URL}/todos/company", json=todo_data)
        assert response.status_code in [200, 201]
        data = response.json()
        # Response structure may vary
        assert data.get('success') == True or 'id' in str(data)
        print(f"✅ Created company todo")


class TestPunchList:
    """Test Punch List operations"""
    
    def test_get_punch_list(self):
        """Test getting punch list for a project"""
        # Get a project first
        response = requests.get(f"{API_URL}/projects")
        projects = response.json()
        if projects:
            project_id = projects[0]['id']
            response = requests.get(f"{API_URL}/punch-list/project/{project_id}")
            assert response.status_code == 200
            data = response.json()
            assert data.get('success') == True
            print(f"✅ Punch list endpoint working")
    
    def test_create_punch_item(self):
        """Test creating a punch list item"""
        response = requests.get(f"{API_URL}/projects")
        projects = response.json()
        if projects:
            project_id = projects[0]['id']
            punch_data = {
                "project_id": project_id,
                "description": f"TEST_Punch_{uuid.uuid4().hex[:8]}",
                "priority": "high",
                "room": "Kitchen"
            }
            response = requests.post(f"{API_URL}/punch-list", json=punch_data)
            assert response.status_code in [200, 201]
            print(f"✅ Created punch list item")


class TestSamples:
    """Test Samples operations"""
    
    def test_get_samples(self):
        """Test getting samples"""
        response = requests.get(f"{API_URL}/samples")
        assert response.status_code == 200
        data = response.json()
        assert data.get('success') == True
        print(f"✅ Samples endpoint working")


class TestScraper:
    """Test Scraper functionality"""
    
    def test_scrape_product_endpoint(self):
        """Test product scraping endpoint"""
        scrape_data = {
            "url": "https://www.fourhands.com/product/248067-003"
        }
        response = requests.post(f"{API_URL}/scrape-product", json=scrape_data, timeout=120)
        assert response.status_code == 200
        data = response.json()
        assert data.get('success') == True
        assert 'data' in data
        product = data['data']
        assert product.get('name') is not None
        print(f"✅ Scraped product: {product.get('name')}")
    
    def test_download_scraper_endpoint(self):
        """Test scraper download endpoint"""
        response = requests.get(f"{API_URL}/download-scraper")
        assert response.status_code == 200
        assert len(response.content) > 10000  # Should be a substantial ZIP file
        print(f"✅ Scraper download working ({len(response.content)} bytes)")


class TestExports:
    """Test Export functionality"""
    
    def test_electrician_sheet_export(self):
        """Test electrician sheet export"""
        response = requests.get(f"{API_URL}/projects")
        projects = response.json()
        if projects:
            project_id = projects[0]['id']
            response = requests.post(f"{API_URL}/exports/{project_id}/electrician-sheet")
            assert response.status_code == 200
            assert 'Electrician' in response.text or 'html' in response.text.lower()
            print(f"✅ Electrician sheet export working")
    
    def test_load_in_sheets_export(self):
        """Test load-in sheets export"""
        response = requests.get(f"{API_URL}/projects")
        projects = response.json()
        if projects:
            project_id = projects[0]['id']
            response = requests.post(f"{API_URL}/exports/{project_id}/load-in-sheets")
            assert response.status_code == 200
            print(f"✅ Load-in sheets export working")
    
    def test_movers_ffe_export(self):
        """Test mover's FFE export"""
        response = requests.get(f"{API_URL}/projects")
        projects = response.json()
        if projects:
            project_id = projects[0]['id']
            response = requests.post(f"{API_URL}/exports/{project_id}/movers-ffe")
            assert response.status_code == 200
            print(f"✅ Mover's FFE export working")


class TestVendorPortals:
    """Test Vendor Portal functionality"""
    
    def test_get_vendor_portals(self):
        """Test getting vendor portals"""
        response = requests.get(f"{API_URL}/vendor-portals")
        assert response.status_code == 200
        portals = response.json()
        assert isinstance(portals, list)
        print(f"✅ Found {len(portals)} vendor portals")
    
    def test_get_vendor_credentials(self):
        """Test getting vendor credentials"""
        response = requests.get(f"{API_URL}/vendor-credentials")
        assert response.status_code == 200
        data = response.json()
        assert data.get('success') == True
        credentials = data.get('credentials', [])
        print(f"✅ Found {len(credentials)} vendor credentials")


class TestItemStatuses:
    """Test Item Status and Carrier options"""
    
    def test_get_item_statuses(self):
        """Test getting item statuses"""
        response = requests.get(f"{API_URL}/item-statuses")
        assert response.status_code == 200
        statuses = response.json()
        assert isinstance(statuses, list)
        assert len(statuses) > 10  # Should have many status options
        print(f"✅ Found {len(statuses)} item statuses")
    
    def test_get_carrier_types(self):
        """Test getting carrier types"""
        response = requests.get(f"{API_URL}/carrier-types")
        assert response.status_code == 200
        carriers = response.json()
        assert isinstance(carriers, list)
        assert len(carriers) > 5  # Should have multiple carriers
        print(f"✅ Found {len(carriers)} carrier types")


class TestFurnitureSearch:
    """Test Furniture Search functionality"""
    
    def test_furniture_search(self):
        """Test furniture search endpoint"""
        response = requests.get(f"{API_URL}/furniture/search", params={"query": "chair"})
        assert response.status_code == 200
        data = response.json()
        assert 'products' in data or isinstance(data, list)
        print(f"✅ Furniture search working")
    
    def test_furniture_vendors(self):
        """Test furniture vendors endpoint"""
        response = requests.get(f"{API_URL}/furniture/vendors")
        assert response.status_code == 200
        vendors = response.json()
        assert isinstance(vendors, list)
        print(f"✅ Found {len(vendors)} furniture vendors")


class TestShippingTracking:
    """Test Shipping Tracking functionality"""
    
    def test_project_tracking(self):
        """Test project shipping tracking"""
        response = requests.get(f"{API_URL}/projects")
        projects = response.json()
        if projects:
            project_id = projects[0]['id']
            response = requests.get(f"{API_URL}/shipping/project-tracking/{project_id}")
            assert response.status_code == 200
            print(f"✅ Project shipping tracking working")


class TestWalkthroughAndChecklist:
    """Test Walkthrough and Checklist sync"""
    
    def test_sync_walkthrough_to_checklist(self):
        """Test syncing walkthrough to checklist"""
        response = requests.get(f"{API_URL}/projects")
        projects = response.json()
        if projects:
            project_id = projects[0]['id']
            response = requests.post(f"{API_URL}/sync/walkthrough-to-checklist/{project_id}")
            assert response.status_code == 200
            print(f"✅ Walkthrough to checklist sync working")
    
    def test_get_sync_status(self):
        """Test getting sync status"""
        response = requests.get(f"{API_URL}/projects")
        projects = response.json()
        if projects:
            project_id = projects[0]['id']
            response = requests.get(f"{API_URL}/sync/status/{project_id}")
            assert response.status_code == 200
            print(f"✅ Sync status endpoint working")


class TestVendorDatabase:
    """Test Vendor Database"""
    
    def test_get_vendor_database(self):
        """Test getting vendor database"""
        response = requests.get(f"{API_URL}/vendor-database")
        assert response.status_code == 200
        vendors = response.json()
        assert isinstance(vendors, list)
        assert len(vendors) > 10  # Should have many vendors
        print(f"✅ Found {len(vendors)} vendors in database")


class TestRoomColors:
    """Test Room and Category Colors"""
    
    def test_get_room_colors(self):
        """Test getting room colors"""
        response = requests.get(f"{API_URL}/room-colors")
        assert response.status_code == 200
        colors = response.json()
        assert isinstance(colors, dict)
        print(f"✅ Room colors endpoint working")
    
    def test_get_category_colors(self):
        """Test getting category colors"""
        response = requests.get(f"{API_URL}/category-colors")
        assert response.status_code == 200
        colors = response.json()
        assert isinstance(colors, dict)
        print(f"✅ Category colors endpoint working")


class TestBackup:
    """Test Backup functionality"""
    
    def test_backup_contacts(self):
        """Test contacts backup"""
        response = requests.get(f"{API_URL}/backup/contacts")
        assert response.status_code == 200
        print(f"✅ Contacts backup working")
    
    def test_backup_materials(self):
        """Test materials backup"""
        response = requests.get(f"{API_URL}/backup/materials")
        assert response.status_code == 200
        print(f"✅ Materials backup working")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])

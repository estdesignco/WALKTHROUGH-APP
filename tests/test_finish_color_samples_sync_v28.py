"""
Test Suite for Finish Color Auto-Sync to Samples Library (Iteration 28)

CRITICAL FEATURE: When an item's finish_color field is updated with content like 'Kravet/Blue Velvet',
the backend should:
1. Parse the vendor from finish_color (e.g., 'Kravet')
2. Parse the sample name from finish_color (e.g., 'Blue Velvet')
3. Auto-sync to Samples Library with the item's image_url
4. NOT sync based on status dropdown - only based on finish_color content

Test scenarios:
- Create item with image
- Update item's finish_color to 'TestVendor/TestFinish'
- Verify sample created in /api/samples with correct vendor, name, and image_url
"""

import pytest
import requests
import os
import uuid
from datetime import datetime

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestFinishColorSamplesSync:
    """Test finish_color auto-sync to Samples Library"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test data"""
        self.test_prefix = f"TEST_V28_{uuid.uuid4().hex[:6]}"
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        self.created_project_id = None
        self.created_room_id = None
        self.created_category_id = None
        self.created_subcategory_id = None
        self.created_item_id = None
        yield
        # Cleanup after tests
        self._cleanup()
    
    def _cleanup(self):
        """Clean up test data"""
        try:
            # Delete test samples
            samples_resp = self.session.get(f"{BASE_URL}/api/samples")
            if samples_resp.status_code == 200:
                samples = samples_resp.json()
                for sample in samples:
                    if self.test_prefix in sample.get("name", "") or self.test_prefix in sample.get("notes", ""):
                        self.session.delete(f"{BASE_URL}/api/samples/{sample['id']}")
            
            # Delete test project (cascades to rooms, categories, subcategories, items)
            if self.created_project_id:
                self.session.delete(f"{BASE_URL}/api/projects/{self.created_project_id}")
        except Exception as e:
            print(f"Cleanup error: {e}")
    
    def test_01_health_check(self):
        """Verify backend is healthy"""
        response = self.session.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data.get("status") == "healthy"
        print("✅ Backend health check passed")
    
    def test_02_create_project_for_testing(self):
        """Create a test project"""
        project_data = {
            "name": f"{self.test_prefix}_Project",
            "client_info": {
                "full_name": "Test Client",
                "email": "test@example.com",
                "phone": "555-1234",
                "address": "123 Test St"
            },
            "project_type": "Renovation"
        }
        response = self.session.post(f"{BASE_URL}/api/projects", json=project_data)
        assert response.status_code == 200, f"Failed to create project: {response.text}"
        data = response.json()
        self.created_project_id = data.get("id")
        assert self.created_project_id, "Project ID not returned"
        print(f"✅ Created test project: {self.created_project_id}")
    
    def test_03_create_room_for_testing(self):
        """Create a test room in the project"""
        # First create project
        self.test_02_create_project_for_testing()
        
        room_data = {
            "name": f"{self.test_prefix}_Room",
            "project_id": self.created_project_id,
            "sheet_type": "checklist",
            "auto_populate": False
        }
        response = self.session.post(f"{BASE_URL}/api/rooms", json=room_data)
        assert response.status_code == 200, f"Failed to create room: {response.text}"
        data = response.json()
        self.created_room_id = data.get("id")
        assert self.created_room_id, "Room ID not returned"
        print(f"✅ Created test room: {self.created_room_id}")
    
    def test_04_create_category_for_testing(self):
        """Create a test category in the room"""
        # First create room
        self.test_03_create_room_for_testing()
        
        category_data = {
            "name": f"{self.test_prefix}_Category",
            "room_id": self.created_room_id
        }
        response = self.session.post(f"{BASE_URL}/api/categories", json=category_data)
        assert response.status_code == 200, f"Failed to create category: {response.text}"
        data = response.json()
        self.created_category_id = data.get("id")
        assert self.created_category_id, "Category ID not returned"
        print(f"✅ Created test category: {self.created_category_id}")
    
    def test_05_create_subcategory_for_testing(self):
        """Create a test subcategory in the category"""
        # First create category
        self.test_04_create_category_for_testing()
        
        subcategory_data = {
            "name": f"{self.test_prefix}_Subcategory",
            "category_id": self.created_category_id
        }
        response = self.session.post(f"{BASE_URL}/api/subcategories", json=subcategory_data)
        assert response.status_code == 200, f"Failed to create subcategory: {response.text}"
        data = response.json()
        self.created_subcategory_id = data.get("id")
        assert self.created_subcategory_id, "Subcategory ID not returned"
        print(f"✅ Created test subcategory: {self.created_subcategory_id}")
    
    def test_06_create_item_with_image(self):
        """Create a test item with an image URL"""
        # First create subcategory
        self.test_05_create_subcategory_for_testing()
        
        item_data = {
            "name": f"{self.test_prefix}_TestItem",
            "subcategory_id": self.created_subcategory_id,
            "image_url": "https://example.com/test-image.jpg",
            "vendor": "InitialVendor",
            "quantity": None  # Blank quantity as per requirements
        }
        response = self.session.post(f"{BASE_URL}/api/items", json=item_data)
        assert response.status_code == 200, f"Failed to create item: {response.text}"
        data = response.json()
        self.created_item_id = data.get("id")
        assert self.created_item_id, "Item ID not returned"
        assert data.get("image_url") == "https://example.com/test-image.jpg", "Image URL not saved"
        print(f"✅ Created test item with image: {self.created_item_id}")
    
    def test_07_update_finish_color_triggers_sample_sync(self):
        """
        CRITICAL TEST: Update item's finish_color and verify sample is created
        
        When finish_color is set to 'TestVendor/TestFinish':
        - vendor should be 'TestVendor'
        - name should be 'TestFinish'
        - image_url should be from the item
        """
        # First create item with image
        self.test_06_create_item_with_image()
        
        # Update finish_color to trigger auto-sync
        update_data = {
            "finish_color": f"TestVendor_{self.test_prefix}/TestFinish_{self.test_prefix}"
        }
        response = self.session.put(f"{BASE_URL}/api/items/{self.created_item_id}", json=update_data)
        assert response.status_code == 200, f"Failed to update item: {response.text}"
        
        updated_item = response.json()
        assert updated_item.get("finish_color") == update_data["finish_color"], "finish_color not updated"
        print(f"✅ Updated item finish_color: {updated_item.get('finish_color')}")
        
        # Verify sample was created in Samples Library
        samples_response = self.session.get(f"{BASE_URL}/api/samples")
        assert samples_response.status_code == 200, f"Failed to get samples: {samples_response.text}"
        
        samples = samples_response.json()
        
        # Find the sample linked to our item
        linked_sample = None
        for sample in samples:
            if sample.get("linked_item_id") == self.created_item_id:
                linked_sample = sample
                break
        
        assert linked_sample is not None, f"Sample not created for item {self.created_item_id}"
        
        # Verify sample data
        expected_vendor = f"TestVendor_{self.test_prefix}"
        expected_name = f"TestFinish_{self.test_prefix}"
        
        assert linked_sample.get("vendor") == expected_vendor, \
            f"Sample vendor mismatch. Expected: {expected_vendor}, Got: {linked_sample.get('vendor')}"
        
        assert linked_sample.get("name") == expected_name, \
            f"Sample name mismatch. Expected: {expected_name}, Got: {linked_sample.get('name')}"
        
        assert linked_sample.get("image_url") == "https://example.com/test-image.jpg", \
            f"Sample image_url mismatch. Expected: https://example.com/test-image.jpg, Got: {linked_sample.get('image_url')}"
        
        print(f"✅ Sample created with correct data:")
        print(f"   - vendor: {linked_sample.get('vendor')}")
        print(f"   - name: {linked_sample.get('name')}")
        print(f"   - image_url: {linked_sample.get('image_url')}")
        print(f"   - linked_item_id: {linked_sample.get('linked_item_id')}")
    
    def test_08_finish_color_without_slash_uses_item_vendor(self):
        """
        Test that finish_color without '/' uses the item's vendor field
        """
        # First create item with image
        self.test_06_create_item_with_image()
        
        # Update finish_color without slash
        update_data = {
            "finish_color": f"SimpleFinish_{self.test_prefix}"
        }
        response = self.session.put(f"{BASE_URL}/api/items/{self.created_item_id}", json=update_data)
        assert response.status_code == 200, f"Failed to update item: {response.text}"
        
        # Verify sample was created
        samples_response = self.session.get(f"{BASE_URL}/api/samples")
        assert samples_response.status_code == 200
        
        samples = samples_response.json()
        linked_sample = None
        for sample in samples:
            if sample.get("linked_item_id") == self.created_item_id:
                linked_sample = sample
                break
        
        assert linked_sample is not None, "Sample not created"
        
        # When no slash, vendor should be from item's vendor field
        assert linked_sample.get("vendor") == "InitialVendor", \
            f"Sample vendor should be item's vendor. Got: {linked_sample.get('vendor')}"
        
        # Name should be the full finish_color
        assert linked_sample.get("name") == f"SimpleFinish_{self.test_prefix}", \
            f"Sample name mismatch. Got: {linked_sample.get('name')}"
        
        print(f"✅ Sample created with item's vendor when no slash in finish_color")
    
    def test_09_samples_endpoint_returns_correct_data(self):
        """Verify /api/samples returns samples with correct structure"""
        response = self.session.get(f"{BASE_URL}/api/samples")
        assert response.status_code == 200, f"Failed to get samples: {response.text}"
        
        samples = response.json()
        assert isinstance(samples, list), "Samples should be a list"
        
        if len(samples) > 0:
            sample = samples[0]
            # Verify sample has expected fields
            expected_fields = ["id", "name", "vendor", "type", "status"]
            for field in expected_fields:
                assert field in sample, f"Sample missing field: {field}"
            print(f"✅ Samples endpoint returns {len(samples)} samples with correct structure")
        else:
            print("⚠️ No samples found in database")
    
    def test_10_quantity_default_is_blank(self):
        """Verify quantity defaults to blank (null) not '1'"""
        # First create subcategory
        self.test_05_create_subcategory_for_testing()
        
        # Create item without specifying quantity
        item_data = {
            "name": f"{self.test_prefix}_QuantityTest",
            "subcategory_id": self.created_subcategory_id
        }
        response = self.session.post(f"{BASE_URL}/api/items", json=item_data)
        assert response.status_code == 200, f"Failed to create item: {response.text}"
        
        data = response.json()
        # Quantity should be None/null, not 1
        assert data.get("quantity") is None, \
            f"Quantity should be None (blank), got: {data.get('quantity')}"
        
        print("✅ Quantity defaults to blank (null) as expected")


class TestMigrationEndpoint:
    """Test the migration endpoint for existing items with finish_color"""
    
    def test_migration_endpoint_exists(self):
        """Verify migration endpoint is accessible"""
        session = requests.Session()
        session.headers.update({"Content-Type": "application/json"})
        
        response = session.post(f"{BASE_URL}/api/samples/sync-existing")
        assert response.status_code == 200, f"Migration endpoint failed: {response.text}"
        
        data = response.json()
        assert data.get("success") == True, "Migration should return success"
        assert "synced_count" in data, "Migration should return synced_count"
        assert "already_synced" in data, "Migration should return already_synced"
        assert "skipped_no_finish" in data, "Migration should return skipped_no_finish"
        
        print(f"✅ Migration endpoint works:")
        print(f"   - synced_count: {data.get('synced_count')}")
        print(f"   - already_synced: {data.get('already_synced')}")
        print(f"   - skipped_no_finish: {data.get('skipped_no_finish')}")


class TestSamplesAPIEndpoints:
    """Test all Samples API endpoints"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test data"""
        self.test_prefix = f"TEST_SAMPLES_{uuid.uuid4().hex[:6]}"
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        self.created_sample_id = None
        yield
        # Cleanup
        if self.created_sample_id:
            try:
                self.session.delete(f"{BASE_URL}/api/samples/{self.created_sample_id}")
            except:
                pass
    
    def test_get_samples(self):
        """Test GET /api/samples"""
        response = self.session.get(f"{BASE_URL}/api/samples")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✅ GET /api/samples returns {len(data)} samples")
    
    def test_create_sample_directly(self):
        """Test POST /api/samples - create sample directly"""
        sample_data = {
            "name": f"{self.test_prefix}_DirectSample",
            "vendor": "TestVendor",
            "type": "fabric",
            "sku": "TEST-SKU-123",
            "color": "Blue",
            "room": "Living Room",
            "status": "requested",
            "notes": f"Test sample {self.test_prefix}"
        }
        response = self.session.post(f"{BASE_URL}/api/samples", json=sample_data)
        assert response.status_code == 200, f"Failed to create sample: {response.text}"
        
        data = response.json()
        self.created_sample_id = data.get("id")
        assert self.created_sample_id, "Sample ID not returned"
        assert data.get("name") == sample_data["name"]
        assert data.get("vendor") == sample_data["vendor"]
        print(f"✅ Created sample directly: {self.created_sample_id}")
    
    def test_update_sample(self):
        """Test PUT /api/samples - update sample"""
        # First create a sample
        self.test_create_sample_directly()
        
        update_data = {
            "id": self.created_sample_id,
            "status": "received",
            "received_date": "2025-01-20"
        }
        response = self.session.put(f"{BASE_URL}/api/samples", json=update_data)
        assert response.status_code == 200, f"Failed to update sample: {response.text}"
        
        data = response.json()
        assert data.get("status") == "received"
        print(f"✅ Updated sample status to 'received'")
    
    def test_delete_sample(self):
        """Test DELETE /api/samples/{sample_id}"""
        # First create a sample
        self.test_create_sample_directly()
        
        response = self.session.delete(f"{BASE_URL}/api/samples/{self.created_sample_id}")
        assert response.status_code == 200, f"Failed to delete sample: {response.text}"
        
        # Verify deletion
        get_response = self.session.get(f"{BASE_URL}/api/samples")
        samples = get_response.json()
        sample_ids = [s.get("id") for s in samples]
        assert self.created_sample_id not in sample_ids, "Sample should be deleted"
        
        self.created_sample_id = None  # Already deleted
        print(f"✅ Deleted sample successfully")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])

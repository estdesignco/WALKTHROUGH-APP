"""
Chrome Extension API Tests - v6.1.0
Tests for:
1. Chrome extension download endpoint
2. Extension scrape endpoints
3. AI scrape endpoint
4. Projects API (used by extension)
"""

import pytest
import requests
import os
import json
import zipfile
import io

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestChromeExtensionDownload:
    """Tests for Chrome Extension download endpoint"""
    
    def test_download_endpoint_returns_200(self):
        """Test that download endpoint returns 200 OK"""
        response = requests.get(f"{BASE_URL}/api/download/chrome-extension")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        print("✅ Download endpoint returns 200 OK")
    
    def test_download_returns_zip_file(self):
        """Test that download returns a valid zip file"""
        response = requests.get(f"{BASE_URL}/api/download/chrome-extension")
        assert response.status_code == 200
        
        # Check content type
        content_type = response.headers.get('content-type', '')
        assert 'application/zip' in content_type or 'application/octet-stream' in content_type, \
            f"Expected zip content type, got {content_type}"
        
        # Verify it's a valid zip
        try:
            z = zipfile.ZipFile(io.BytesIO(response.content))
            files = z.namelist()
            assert len(files) > 0, "Zip file is empty"
            print(f"✅ Download returns valid zip with {len(files)} files")
        except zipfile.BadZipFile:
            pytest.fail("Downloaded file is not a valid zip")
    
    def test_zip_contains_manifest(self):
        """Test that zip contains manifest.json"""
        response = requests.get(f"{BASE_URL}/api/download/chrome-extension")
        z = zipfile.ZipFile(io.BytesIO(response.content))
        
        assert 'manifest.json' in z.namelist(), "manifest.json not found in zip"
        print("✅ Zip contains manifest.json")
    
    def test_manifest_version_is_6_1_0(self):
        """Test that manifest version is 6.1.0"""
        response = requests.get(f"{BASE_URL}/api/download/chrome-extension")
        z = zipfile.ZipFile(io.BytesIO(response.content))
        
        manifest_content = z.read('manifest.json').decode('utf-8')
        manifest = json.loads(manifest_content)
        
        assert manifest.get('version') == '6.1.0', \
            f"Expected version 6.1.0, got {manifest.get('version')}"
        print("✅ Manifest version is 6.1.0")
    
    def test_zip_contains_popup_js(self):
        """Test that zip contains popup.js with scraper logic"""
        response = requests.get(f"{BASE_URL}/api/download/chrome-extension")
        z = zipfile.ZipFile(io.BytesIO(response.content))
        
        assert 'popup.js' in z.namelist(), "popup.js not found in zip"
        
        popup_content = z.read('popup.js').decode('utf-8')
        # Verify Four Hands specific logic exists
        assert 'fourhands' in popup_content.lower(), "Four Hands vendor logic not found in popup.js"
        assert 'scrapePageData' in popup_content, "scrapePageData function not found"
        print("✅ Zip contains popup.js with Four Hands scraper logic")
    
    def test_download_filename_header(self):
        """Test that download has correct filename in header"""
        response = requests.get(f"{BASE_URL}/api/download/chrome-extension")
        
        content_disposition = response.headers.get('content-disposition', '')
        assert 'design-ready-scraper-v6.1.0.zip' in content_disposition, \
            f"Expected v6.1.0 filename, got {content_disposition}"
        print("✅ Download filename is design-ready-scraper-v6.1.0.zip")


class TestProjectsAPI:
    """Tests for Projects API (used by extension to load projects)"""
    
    def test_get_projects_returns_200(self):
        """Test that GET /api/projects returns 200"""
        response = requests.get(f"{BASE_URL}/api/projects")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        print("✅ GET /api/projects returns 200")
    
    def test_get_projects_returns_list(self):
        """Test that GET /api/projects returns a list"""
        response = requests.get(f"{BASE_URL}/api/projects")
        data = response.json()
        
        assert isinstance(data, list), f"Expected list, got {type(data)}"
        print(f"✅ GET /api/projects returns list with {len(data)} projects")
    
    def test_projects_have_required_fields(self):
        """Test that projects have id and name fields (needed by extension)"""
        response = requests.get(f"{BASE_URL}/api/projects")
        data = response.json()
        
        if len(data) > 0:
            project = data[0]
            assert 'id' in project, "Project missing 'id' field"
            assert 'name' in project, "Project missing 'name' field"
            print(f"✅ Projects have required fields (id, name)")
        else:
            print("⚠️ No projects found to verify fields")


class TestExtensionScrapeAPI:
    """Tests for Extension Scrape endpoints"""
    
    def test_post_extension_scrape(self):
        """Test POST /api/extension-scrape accepts scraped data"""
        test_data = {
            "url": "https://test.fourhands.com/product/test-123",
            "vendor": "Four Hands",
            "name": "Test Product",
            "sku": "TEST-123",
            "price": 499.99,
            "size": "24\"W x 18\"D x 30\"H",
            "finish_color": "Natural Oak",
            "finish_image": "https://example.com/swatch.jpg",
            "image_url": "https://example.com/product.jpg"
        }
        
        response = requests.post(f"{BASE_URL}/api/extension-scrape", json=test_data)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert data.get('success') == True, f"Expected success=True, got {data}"
        print("✅ POST /api/extension-scrape accepts data")
    
    def test_get_extension_scrape_cache(self):
        """Test GET /api/extension-scrape-cache returns cached data"""
        response = requests.get(f"{BASE_URL}/api/extension-scrape-cache")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        print("✅ GET /api/extension-scrape-cache returns 200")
    
    def test_get_extension_scrape_cache_by_url(self):
        """Test GET /api/extension-scrape-cache with URL parameter"""
        # First post some data
        test_data = {
            "url": "https://test.fourhands.com/product/cache-test-456",
            "vendor": "Four Hands",
            "name": "Cache Test Product",
            "sku": "CACHE-456"
        }
        requests.post(f"{BASE_URL}/api/extension-scrape", json=test_data)
        
        # Then retrieve it
        response = requests.get(
            f"{BASE_URL}/api/extension-scrape-cache",
            params={"url": "https://test.fourhands.com/product/cache-test-456"}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        print("✅ GET /api/extension-scrape-cache with URL parameter works")
    
    def test_get_latest_extension_scrape(self):
        """Test GET /api/extension-scrape-latest returns most recent scrape"""
        response = requests.get(f"{BASE_URL}/api/extension-scrape-latest")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        print("✅ GET /api/extension-scrape-latest returns 200")


class TestAIScrapeAPI:
    """Tests for AI-powered scraping endpoint"""
    
    def test_ai_scrape_endpoint_exists(self):
        """Test POST /api/ai-scrape endpoint exists"""
        test_data = {
            "page_text": "Product Name: Test Chair\nSKU: CHAIR-001\nPrice: $599.00\nDimensions: 24W x 26D x 34H",
            "page_url": "https://test.fourhands.com/product/test-chair"
        }
        
        response = requests.post(f"{BASE_URL}/api/ai-scrape", json=test_data)
        # Should return 200 or 422 (validation error) - not 404
        assert response.status_code != 404, "AI scrape endpoint not found"
        print(f"✅ POST /api/ai-scrape endpoint exists (status: {response.status_code})")
    
    def test_ai_scrape_with_four_hands_format(self):
        """Test AI scrape with Four Hands page format"""
        # Simulate Four Hands page text with their specific format
        test_data = {
            "page_text": """
            Abound Swivel Chair
            Dulane Mahogany • 247447-002
            
            21.50"w x 23.00"d x 38.50"h
            
            $1,299.00
            
            Cushion Options:
            Dulane Mahogany
            """,
            "page_url": "https://www.fourhands.com/product/247447-002"
        }
        
        response = requests.post(f"{BASE_URL}/api/ai-scrape", json=test_data)
        if response.status_code == 200:
            data = response.json()
            print(f"✅ AI scrape returned: {data}")
        else:
            print(f"⚠️ AI scrape returned status {response.status_code}")


class TestScraperLogicVerification:
    """Verify the scraper logic in popup.js handles Four Hands correctly"""
    
    def test_popup_js_has_four_hands_sku_logic(self):
        """Verify popup.js has Four Hands SKU extraction logic"""
        response = requests.get(f"{BASE_URL}/api/download/chrome-extension")
        z = zipfile.ZipFile(io.BytesIO(response.content))
        popup_content = z.read('popup.js').decode('utf-8')
        
        # Check for Four Hands SKU logic (from subtitle or URL)
        assert 'text-neutral-50' in popup_content, "Four Hands subtitle selector not found"
        assert '/product/' in popup_content, "Four Hands URL SKU pattern not found"
        print("✅ popup.js has Four Hands SKU extraction logic")
    
    def test_popup_js_has_four_hands_dimensions_logic(self):
        """Verify popup.js has Four Hands dimensions format (w x d x h)"""
        response = requests.get(f"{BASE_URL}/api/download/chrome-extension")
        z = zipfile.ZipFile(io.BytesIO(response.content))
        popup_content = z.read('popup.js').decode('utf-8')
        
        # Check for w x d x h format
        assert 'w\\s*x' in popup_content.lower() or 'w x' in popup_content.lower(), \
            "Four Hands dimension format (w x d x h) not found"
        print("✅ popup.js has Four Hands dimensions logic (w x d x h format)")
    
    def test_popup_js_has_four_hands_swatch_logic(self):
        """Verify popup.js has Four Hands swatch/label extraction logic"""
        response = requests.get(f"{BASE_URL}/api/download/chrome-extension")
        z = zipfile.ZipFile(io.BytesIO(response.content))
        popup_content = z.read('popup.js').decode('utf-8')
        
        # Check for label[title] selector for swatches
        assert 'label[title]' in popup_content or "label.querySelector('img')" in popup_content, \
            "Four Hands swatch label logic not found"
        print("✅ popup.js has Four Hands swatch extraction logic (label elements)")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])

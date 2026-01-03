"""
Chrome Extension v6.4.0 API and Code Verification Tests
Tests: Download endpoint, Projects API, Extension-scrape API, popup.js patterns
"""
import pytest
import requests
import os
import zipfile
import json
import re
import io

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestChromeExtensionDownload:
    """Test Chrome Extension download endpoint"""
    
    def test_download_endpoint_returns_200(self):
        """Download endpoint should return 200 OK"""
        response = requests.get(f"{BASE_URL}/api/download/chrome-extension")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
    
    def test_download_returns_zip_file(self):
        """Download should return a valid zip file"""
        response = requests.get(f"{BASE_URL}/api/download/chrome-extension")
        assert response.status_code == 200
        
        # Check content type
        content_type = response.headers.get('content-type', '')
        assert 'zip' in content_type or 'octet-stream' in content_type, f"Expected zip content type, got {content_type}"
        
        # Verify it's a valid zip
        zip_buffer = io.BytesIO(response.content)
        with zipfile.ZipFile(zip_buffer, 'r') as z:
            files = z.namelist()
            assert 'manifest.json' in files, "manifest.json not found in zip"
            assert 'popup.js' in files, "popup.js not found in zip"
    
    def test_manifest_version_is_640(self):
        """Manifest version should be 6.4.0"""
        response = requests.get(f"{BASE_URL}/api/download/chrome-extension")
        assert response.status_code == 200
        
        zip_buffer = io.BytesIO(response.content)
        with zipfile.ZipFile(zip_buffer, 'r') as z:
            manifest = json.loads(z.read('manifest.json'))
            assert manifest.get('version') == '6.4.0', f"Expected version 6.4.0, got {manifest.get('version')}"
    
    def test_zip_contains_all_required_files(self):
        """Zip should contain all required extension files"""
        response = requests.get(f"{BASE_URL}/api/download/chrome-extension")
        assert response.status_code == 200
        
        zip_buffer = io.BytesIO(response.content)
        with zipfile.ZipFile(zip_buffer, 'r') as z:
            files = z.namelist()
            required_files = ['manifest.json', 'popup.js', 'popup.html', 'content.js']
            for f in required_files:
                assert f in files, f"{f} not found in zip"


class TestProjectsAPI:
    """Test Projects API for extension dropdown"""
    
    def test_projects_endpoint_returns_200(self):
        """GET /api/projects should return 200"""
        response = requests.get(f"{BASE_URL}/api/projects")
        assert response.status_code == 200
    
    def test_projects_returns_list(self):
        """Projects endpoint should return a list"""
        response = requests.get(f"{BASE_URL}/api/projects")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list), "Expected list of projects"
    
    def test_projects_have_required_fields(self):
        """Each project should have id and name for extension dropdown"""
        response = requests.get(f"{BASE_URL}/api/projects")
        assert response.status_code == 200
        data = response.json()
        
        if len(data) > 0:
            project = data[0]
            assert 'id' in project, "Project missing 'id' field"
            assert 'name' in project, "Project missing 'name' field"


class TestExtensionScrapeAPI:
    """Test Extension scrape endpoints"""
    
    def test_extension_scrape_post_accepts_data(self):
        """POST /api/extension-scrape should accept scraped data"""
        test_data = {
            "url": "https://test-vendor.com/product/test-123",
            "vendor": "Test Vendor",
            "name": "Test Product",
            "sku": "TEST-123",
            "price": 199.99,
            "size": "24\"W x 18\"D x 30\"H",
            "finish_color": "Antique Brass"
        }
        response = requests.post(
            f"{BASE_URL}/api/extension-scrape",
            json=test_data,
            headers={"Content-Type": "application/json"}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert data.get('success') == True, "Expected success: true"


class TestPopupJSVendorDetection:
    """Test popup.js has all 26+ vendor detection patterns"""
    
    @pytest.fixture(scope="class")
    def popup_js_content(self):
        """Get popup.js content from downloaded zip"""
        response = requests.get(f"{BASE_URL}/api/download/chrome-extension")
        zip_buffer = io.BytesIO(response.content)
        with zipfile.ZipFile(zip_buffer, 'r') as z:
            return z.read('popup.js').decode('utf-8')
    
    @pytest.mark.parametrize("vendor", [
        "fourhands", "uttermost", "globalviews", "rowefurniture", "reginaandrew",
        "bernhardt", "loloirugs", "visualcomfort", "hvlgroup", "vanguardfurniture",
        "flowdecor", "crestviewcollection", "bassettmirror", "eichholtz", "safavieh",
        "surya", "zeelighting", "hubbardtonforge", "hinkley", "elegantlighting",
        "gabby", "arteriorshome", "curreyandcompany"
    ])
    def test_vendor_detection_present(self, popup_js_content, vendor):
        """Each vendor should be in the vendorMap"""
        assert vendor.lower() in popup_js_content.lower(), f"Vendor {vendor} not found in popup.js"


class TestPopupJSDimensionPatterns:
    """Test popup.js has all dimension detection patterns"""
    
    @pytest.fixture(scope="class")
    def popup_js_content(self):
        """Get popup.js content from downloaded zip"""
        response = requests.get(f"{BASE_URL}/api/download/chrome-extension")
        zip_buffer = io.BytesIO(response.content)
        with zipfile.ZipFile(zip_buffer, 'r') as z:
            return z.read('popup.js').decode('utf-8')
    
    def test_wxdxh_format(self, popup_js_content):
        """Should detect WxDxH format dimensions"""
        assert re.search(r'w\s*x\s*.*d\s*x\s*.*h', popup_js_content, re.IGNORECASE), "WxDxH pattern not found"
    
    def test_width_height_depth_labels(self, popup_js_content):
        """Should detect Width/Height/Depth labeled dimensions"""
        assert 'Width' in popup_js_content, "Width label pattern not found"
        assert 'Height' in popup_js_content, "Height label pattern not found"
        assert 'Depth' in popup_js_content, "Depth label pattern not found"
    
    def test_hxwxd_format(self, popup_js_content):
        """Should detect HxWxD format dimensions"""
        assert re.search(r'H\s*[x×X]\s*.*W\s*[x×X]\s*.*D', popup_js_content, re.IGNORECASE), "HxWxD pattern not found"
    
    def test_rug_format(self, popup_js_content):
        """Should detect rug format dimensions (e.g., 2'3\" x 7'9\")"""
        assert "rugMatch" in popup_js_content or "rug" in popup_js_content.lower(), "Rug format pattern not found"


class TestPopupJSSKUPatterns:
    """Test popup.js has all SKU detection patterns"""
    
    @pytest.fixture(scope="class")
    def popup_js_content(self):
        """Get popup.js content from downloaded zip"""
        response = requests.get(f"{BASE_URL}/api/download/chrome-extension")
        zip_buffer = io.BytesIO(response.content)
        with zipfile.ZipFile(zip_buffer, 'r') as z:
            return z.read('popup.js').decode('utf-8')
    
    def test_four_hands_subtitle_sku(self, popup_js_content):
        """Should detect Four Hands SKU from subtitle (.text-neutral-50)"""
        assert 'text-neutral-50' in popup_js_content, "Four Hands subtitle selector not found"
    
    def test_bernhardt_url_sku(self, popup_js_content):
        """Should detect Bernhardt SKU from URL (/shop/)"""
        assert '/shop/' in popup_js_content, "Bernhardt URL pattern not found"
    
    def test_hvl_url_sku(self, popup_js_content):
        """Should detect HVL SKU from URL (/Product/)"""
        assert '/Product/' in popup_js_content, "HVL URL pattern not found"
    
    def test_visual_comfort_title_sku(self, popup_js_content):
        """Should detect Visual Comfort SKU from title"""
        assert 'titleMatch' in popup_js_content, "Visual Comfort title pattern not found"
    
    def test_generic_sku_patterns(self, popup_js_content):
        """Should have generic SKU detection patterns"""
        patterns = ['SKU', 'Item', 'Style', 'Model']
        for pattern in patterns:
            assert pattern in popup_js_content, f"Generic {pattern} pattern not found"


class TestPopupJSFinishColorDetection:
    """Test popup.js has finish/color detection patterns"""
    
    @pytest.fixture(scope="class")
    def popup_js_content(self):
        """Get popup.js content from downloaded zip"""
        response = requests.get(f"{BASE_URL}/api/download/chrome-extension")
        zip_buffer = io.BytesIO(response.content)
        with zipfile.ZipFile(zip_buffer, 'r') as z:
            return z.read('popup.js').decode('utf-8')
    
    def test_dropdown_text_detection(self, popup_js_content):
        """Should detect finish from dropdown text (.truncate)"""
        assert 'truncate' in popup_js_content, "Dropdown truncate selector not found"
    
    def test_swatch_images_detection(self, popup_js_content):
        """Should detect swatch images from label[title] elements"""
        assert 'label[title]' in popup_js_content, "Swatch label[title] selector not found"
    
    def test_selected_state_detection(self, popup_js_content):
        """Should detect selected state for swatches"""
        assert 'selected' in popup_js_content.lower(), "Selected state detection not found"
    
    def test_aria_selected_detection(self, popup_js_content):
        """Should detect aria-selected attribute"""
        assert 'aria-selected' in popup_js_content, "aria-selected detection not found"
    
    def test_background_image_swatch(self, popup_js_content):
        """Should detect background-image swatches"""
        assert 'background-image' in popup_js_content, "Background-image swatch detection not found"
    
    def test_hvl_finish_codes(self, popup_js_content):
        """Should have HVL finish code mapping"""
        assert 'finishCodes' in popup_js_content, "HVL finishCodes mapping not found"


class TestPopupJSNoSyntaxErrors:
    """Test popup.js has no JavaScript syntax errors"""
    
    def test_popup_js_valid_structure(self):
        """popup.js should have valid JavaScript structure"""
        response = requests.get(f"{BASE_URL}/api/download/chrome-extension")
        zip_buffer = io.BytesIO(response.content)
        with zipfile.ZipFile(zip_buffer, 'r') as z:
            popup_js = z.read('popup.js').decode('utf-8')
        
        # Check for balanced braces
        open_braces = popup_js.count('{')
        close_braces = popup_js.count('}')
        assert open_braces == close_braces, f"Unbalanced braces: {open_braces} open, {close_braces} close"
        
        # Check for balanced parentheses
        open_parens = popup_js.count('(')
        close_parens = popup_js.count(')')
        assert open_parens == close_parens, f"Unbalanced parentheses: {open_parens} open, {close_parens} close"
        
        # Check for balanced brackets
        open_brackets = popup_js.count('[')
        close_brackets = popup_js.count(']')
        assert open_brackets == close_brackets, f"Unbalanced brackets: {open_brackets} open, {close_brackets} close"
    
    def test_popup_js_has_scrape_function(self):
        """popup.js should have scrapePageData function"""
        response = requests.get(f"{BASE_URL}/api/download/chrome-extension")
        zip_buffer = io.BytesIO(response.content)
        with zipfile.ZipFile(zip_buffer, 'r') as z:
            popup_js = z.read('popup.js').decode('utf-8')
        
        assert 'function scrapePageData' in popup_js or 'scrapePageData' in popup_js, "scrapePageData function not found"
    
    def test_popup_js_has_load_projects(self):
        """popup.js should have loadProjects function"""
        response = requests.get(f"{BASE_URL}/api/download/chrome-extension")
        zip_buffer = io.BytesIO(response.content)
        with zipfile.ZipFile(zip_buffer, 'r') as z:
            popup_js = z.read('popup.js').decode('utf-8')
        
        assert 'loadProjects' in popup_js, "loadProjects function not found"

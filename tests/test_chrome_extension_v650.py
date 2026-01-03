"""
Chrome Extension v6.5.0 Tests - Click to Select Feature
Tests the new Click to Select functionality and all backend APIs
"""
import pytest
import requests
import os
import zipfile
import json
import io

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestExtensionDownload:
    """Test Chrome Extension download endpoint"""
    
    def test_extension_download_returns_200(self):
        """Extension download endpoint returns 200 OK"""
        response = requests.get(f"{BASE_URL}/api/download/chrome-extension")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
    
    def test_extension_download_returns_zip(self):
        """Extension download returns valid zip file"""
        response = requests.get(f"{BASE_URL}/api/download/chrome-extension")
        assert response.status_code == 200
        # Check content type
        content_type = response.headers.get('content-type', '')
        assert 'zip' in content_type or 'octet-stream' in content_type, f"Expected zip content type, got {content_type}"
        # Check zip header (PK)
        assert response.content[:2] == b'PK', "Response is not a valid zip file"
    
    def test_extension_zip_contains_required_files(self):
        """Extension zip contains all required files"""
        response = requests.get(f"{BASE_URL}/api/download/chrome-extension")
        assert response.status_code == 200
        
        with zipfile.ZipFile(io.BytesIO(response.content)) as z:
            files = z.namelist()
            required_files = ['manifest.json', 'popup.js', 'popup.html', 'content.js']
            for req_file in required_files:
                assert req_file in files, f"Missing required file: {req_file}"
    
    def test_extension_manifest_version_650(self):
        """Extension manifest version is 6.5.0"""
        response = requests.get(f"{BASE_URL}/api/download/chrome-extension")
        assert response.status_code == 200
        
        with zipfile.ZipFile(io.BytesIO(response.content)) as z:
            manifest = json.loads(z.read('manifest.json'))
            assert manifest.get('version') == '6.5.0', f"Expected version 6.5.0, got {manifest.get('version')}"


class TestClickToSelectPopupJS:
    """Test Click to Select functionality in popup.js"""
    
    @pytest.fixture
    def popup_js_content(self):
        """Get popup.js content from extension zip"""
        response = requests.get(f"{BASE_URL}/api/download/chrome-extension")
        with zipfile.ZipFile(io.BytesIO(response.content)) as z:
            return z.read('popup.js').decode('utf-8')
    
    def test_toggle_click_to_select_function(self, popup_js_content):
        """popup.js contains toggleClickToSelect function"""
        assert 'toggleClickToSelect' in popup_js_content, "toggleClickToSelect function not found"
        assert 'async function toggleClickToSelect' in popup_js_content or 'toggleClickToSelect()' in popup_js_content
    
    def test_field_selected_message_listener(self, popup_js_content):
        """popup.js contains fieldSelected message listener"""
        assert 'fieldSelected' in popup_js_content, "fieldSelected message listener not found"
        assert "request.action === 'fieldSelected'" in popup_js_content
    
    def test_update_field_display_function(self, popup_js_content):
        """popup.js contains updateFieldDisplay function"""
        assert 'updateFieldDisplay' in popup_js_content, "updateFieldDisplay function not found"
        assert 'function updateFieldDisplay' in popup_js_content
    
    def test_click_select_btn_reference(self, popup_js_content):
        """popup.js references clickSelectBtn element"""
        assert 'clickSelectBtn' in popup_js_content, "clickSelectBtn reference not found"
        assert "getElementById('clickSelectBtn')" in popup_js_content
    
    def test_click_to_select_active_state(self, popup_js_content):
        """popup.js has clickToSelectActive state variable"""
        assert 'clickToSelectActive' in popup_js_content, "clickToSelectActive state not found"
        assert 'let clickToSelectActive = false' in popup_js_content
    
    def test_update_field_display_handles_all_fields(self, popup_js_content):
        """updateFieldDisplay handles all field types"""
        fields = ['name', 'price', 'sku', 'size', 'finish_color', 'finish_image', 'image_url', 'msrp']
        for field in fields:
            assert f"case '{field}':" in popup_js_content, f"updateFieldDisplay missing case for {field}"


class TestClickToSelectContentJS:
    """Test Click to Select functionality in content.js"""
    
    @pytest.fixture
    def content_js_content(self):
        """Get content.js content from extension zip"""
        response = requests.get(f"{BASE_URL}/api/download/chrome-extension")
        with zipfile.ZipFile(io.BytesIO(response.content)) as z:
            return z.read('content.js').decode('utf-8')
    
    def test_activate_click_to_select_function(self, content_js_content):
        """content.js contains activateClickToSelect function"""
        assert 'activateClickToSelect' in content_js_content, "activateClickToSelect function not found"
        assert 'function activateClickToSelect' in content_js_content
    
    def test_deactivate_click_to_select_function(self, content_js_content):
        """content.js contains deactivateClickToSelect function"""
        assert 'deactivateClickToSelect' in content_js_content, "deactivateClickToSelect function not found"
        assert 'function deactivateClickToSelect' in content_js_content
    
    def test_create_highlight_overlay_function(self, content_js_content):
        """content.js contains createHighlightOverlay function"""
        assert 'createHighlightOverlay' in content_js_content, "createHighlightOverlay function not found"
        assert 'function createHighlightOverlay' in content_js_content
    
    def test_create_dropdown_menu_function(self, content_js_content):
        """content.js contains createDropdownMenu function"""
        assert 'createDropdownMenu' in content_js_content, "createDropdownMenu function not found"
        assert 'function createDropdownMenu' in content_js_content
    
    def test_handle_field_selection_function(self, content_js_content):
        """content.js contains handleFieldSelection function"""
        assert 'handleFieldSelection' in content_js_content, "handleFieldSelection function not found"
        assert 'function handleFieldSelection' in content_js_content
    
    def test_dropdown_contains_all_field_options(self, content_js_content):
        """Dropdown menu contains all field options"""
        field_labels = ['Product Title', 'Price', 'SKU', 'Dimensions', 'Finish/Color', 'Finish Image', 'Main Image']
        for label in field_labels:
            assert label in content_js_content, f"Dropdown missing field option: {label}"
    
    def test_highlight_overlay_styling(self, content_js_content):
        """Highlight overlay has proper styling"""
        assert 'dr-scraper-highlight' in content_js_content, "Highlight overlay ID not found"
        assert 'border: 3px solid #4ade80' in content_js_content, "Highlight border styling not found"
    
    def test_dropdown_menu_styling(self, content_js_content):
        """Dropdown menu has proper styling"""
        assert 'dr-scraper-dropdown' in content_js_content, "Dropdown menu ID not found"
        assert 'z-index: 2147483647' in content_js_content, "Dropdown z-index not found"
    
    def test_escape_key_handler(self, content_js_content):
        """Escape key deactivates Click to Select mode"""
        assert "e.key === 'Escape'" in content_js_content, "Escape key handler not found"
        assert 'clickToSelectDeactivated' in content_js_content, "clickToSelectDeactivated message not found"


class TestClickToSelectPopupHTML:
    """Test Click to Select button in popup.html"""
    
    @pytest.fixture
    def popup_html_content(self):
        """Get popup.html content from extension zip"""
        response = requests.get(f"{BASE_URL}/api/download/chrome-extension")
        with zipfile.ZipFile(io.BytesIO(response.content)) as z:
            return z.read('popup.html').decode('utf-8')
    
    def test_click_select_btn_element(self, popup_html_content):
        """popup.html contains clickSelectBtn button element"""
        assert 'clickSelectBtn' in popup_html_content, "clickSelectBtn element not found"
        assert 'id="clickSelectBtn"' in popup_html_content
    
    def test_click_select_btn_class_styling(self, popup_html_content):
        """popup.html contains click-select-btn class styling"""
        assert 'click-select-btn' in popup_html_content, "click-select-btn class not found"
        assert '.click-select-btn' in popup_html_content, "click-select-btn CSS not found"
    
    def test_click_to_select_button_text(self, popup_html_content):
        """popup.html contains CLICK TO SELECT button text"""
        assert 'CLICK TO SELECT' in popup_html_content, "CLICK TO SELECT text not found"
    
    def test_click_select_help_text(self, popup_html_content):
        """popup.html contains help text for Click to Select"""
        assert 'Missing data?' in popup_html_content, "Help text not found"
    
    def test_click_select_btn_active_animation(self, popup_html_content):
        """popup.html contains active state animation for button"""
        assert '.click-select-btn.active' in popup_html_content, "Active state styling not found"
        assert 'pulse' in popup_html_content, "Pulse animation not found"


class TestBackendAPIs:
    """Test backend APIs used by extension"""
    
    def test_health_endpoint(self):
        """Health endpoint returns healthy status"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data.get('status') == 'healthy'
    
    def test_projects_endpoint(self):
        """Projects endpoint returns list of projects"""
        response = requests.get(f"{BASE_URL}/api/projects")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list), "Expected list of projects"
        assert len(data) > 0, "Expected at least one project"
        # Verify project structure
        project = data[0]
        assert 'id' in project, "Project missing id field"
        assert 'name' in project, "Project missing name field"
    
    def test_extension_scrape_endpoint(self):
        """Extension scrape endpoint accepts and returns data"""
        test_data = {
            "name": "Test Product v6.5.0",
            "price": 499.99,
            "sku": "TEST-650",
            "size": "24\"W x 18\"D x 36\"H",
            "finish_color": "Antique Brass",
            "vendor": "Test Vendor",
            "url": "https://example.com/test-product"
        }
        response = requests.post(
            f"{BASE_URL}/api/extension-scrape",
            json=test_data,
            headers={"Content-Type": "application/json"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data.get('success') == True, "Expected success: true"
        assert 'data' in data, "Expected data in response"


class TestVendorSupport:
    """Test vendor detection patterns in popup.js"""
    
    @pytest.fixture
    def popup_js_content(self):
        """Get popup.js content from extension zip"""
        response = requests.get(f"{BASE_URL}/api/download/chrome-extension")
        with zipfile.ZipFile(io.BytesIO(response.content)) as z:
            return z.read('popup.js').decode('utf-8')
    
    def test_vendor_map_exists(self, popup_js_content):
        """popup.js contains vendorMap for vendor detection"""
        assert 'vendorMap' in popup_js_content, "vendorMap not found"
    
    def test_all_26_vendors_supported(self, popup_js_content):
        """All 26 vendors are in vendorMap"""
        vendors = [
            'uttermost', 'visualcomfort', 'fourhands', 'bernhardt', 'hvlgroup',
            'gabby', 'loloirugs', 'rowefurniture', 'globalviews', 'reginaandrew',
            'surya', 'safavieh', 'eichholtz', 'crestviewcollection', 'bassettmirror',
            'flowdecor', 'hubbardtonforge', 'hinkley', 'elegantlighting', 'zeelighting',
            'vanguardfurniture', 'arteriorshome', 'curreyandcompany'
        ]
        for vendor in vendors:
            assert vendor in popup_js_content.lower(), f"Vendor {vendor} not found in vendorMap"


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])

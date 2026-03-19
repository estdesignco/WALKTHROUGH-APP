"""
Test Google Calendar endpoints
Tests the calendar status and sync endpoints
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://stability-first-2.preview.emergentagent.com')

class TestGoogleCalendarEndpoints:
    """Test Google Calendar integration endpoints"""
    
    def test_google_calendar_status_endpoint(self):
        """Test GET /api/auth/google/status returns proper response"""
        response = requests.get(f"{BASE_URL}/api/auth/google/status")
        
        # Should return 200
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        # Should return JSON with 'connected' field
        data = response.json()
        assert 'connected' in data, "Response should have 'connected' field"
        assert isinstance(data['connected'], bool), "'connected' should be boolean"
        
        # If connected, should have email and connected_at
        if data['connected']:
            assert 'email' in data, "Connected response should have 'email'"
            assert 'connected_at' in data, "Connected response should have 'connected_at'"
        
        print(f"✅ Google Calendar status: connected={data['connected']}")
    
    def test_google_calendar_sync_endpoint_without_connection(self):
        """Test POST /api/calendar/google/sync/{project_id} without connection"""
        # Use a test project ID
        test_project_id = "test-project-id"
        
        response = requests.post(f"{BASE_URL}/api/calendar/google/sync/{test_project_id}")
        
        # Should return 200 with requires_auth message
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert 'success' in data, "Response should have 'success' field"
        assert data['success'] == False, "Should return success=False when not connected"
        assert 'requires_auth' in data, "Should have 'requires_auth' field"
        assert data['requires_auth'] == True, "Should require auth when not connected"
        
        print(f"✅ Google Calendar sync (not connected): {data['message']}")
    
    def test_google_calendar_login_endpoint(self):
        """Test GET /api/auth/google/login returns authorization URL"""
        response = requests.get(f"{BASE_URL}/api/auth/google/login")
        
        # Should return 200
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert 'authorization_url' in data, "Response should have 'authorization_url'"
        assert 'accounts.google.com' in data['authorization_url'], "URL should be Google OAuth URL"
        
        print(f"✅ Google Calendar login URL generated")


class TestHealthEndpoint:
    """Test health endpoint"""
    
    def test_health_endpoint(self):
        """Test GET /api/health returns healthy status"""
        response = requests.get(f"{BASE_URL}/api/health")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert data.get('status') == 'healthy', "Should return healthy status"
        
        print(f"✅ Health check passed: {data}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])

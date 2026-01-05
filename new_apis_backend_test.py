#!/usr/bin/env python3
"""
Comprehensive Backend API Testing for Design Studio App
Testing all new APIs as requested in the review request
"""

import requests
import json
import time
import base64
from datetime import datetime
import uuid

# Configuration
BACKEND_URL = "https://scrapefixer.preview.emergentagent.com/api"
PROJECT_ID = "e2f3e36d-1972-4ae4-aa61-22381aaf0bdb"

# Test data
TEST_ROOM_ID = str(uuid.uuid4())
TEST_VOICE_NOTE_ID = None
TEST_PUNCH_LIST_ID = None
TEST_ITEM_ID = None
TEST_PHOTO_ID = None

def log_test(test_name, status, details=""):
    """Log test results"""
    timestamp = datetime.now().strftime("%H:%M:%S")
    status_symbol = "✅" if status == "PASS" else "❌" if status == "FAIL" else "⚠️"
    print(f"[{timestamp}] {status_symbol} {test_name}")
    if details:
        print(f"    {details}")
    print()

def test_sync_apis():
    """Test Sync APIs (CRITICAL)"""
    print("=" * 60)
    print("TESTING SYNC APIs (CRITICAL)")
    print("=" * 60)
    
    # Test 1: GET /api/sync/status/{project_id}
    try:
        response = requests.get(f"{BACKEND_URL}/sync/status/{PROJECT_ID}")
        if response.status_code == 200:
            data = response.json()
            log_test("GET /api/sync/status/{project_id}", "PASS", 
                    f"Status: {response.status_code}, Response: {json.dumps(data, indent=2)}")
        else:
            log_test("GET /api/sync/status/{project_id}", "FAIL", 
                    f"Status: {response.status_code}, Error: {response.text}")
    except Exception as e:
        log_test("GET /api/sync/status/{project_id}", "FAIL", f"Exception: {str(e)}")
    
    # Test 2: POST /api/sync/walkthrough-to-checklist/{project_id}
    try:
        response = requests.post(f"{BACKEND_URL}/sync/walkthrough-to-checklist/{PROJECT_ID}")
        if response.status_code in [200, 201]:
            data = response.json()
            log_test("POST /api/sync/walkthrough-to-checklist/{project_id}", "PASS", 
                    f"Status: {response.status_code}, Response: {json.dumps(data, indent=2)}")
        else:
            log_test("POST /api/sync/walkthrough-to-checklist/{project_id}", "FAIL", 
                    f"Status: {response.status_code}, Error: {response.text}")
    except Exception as e:
        log_test("POST /api/sync/walkthrough-to-checklist/{project_id}", "FAIL", f"Exception: {str(e)}")

def test_voice_notes_apis():
    """Test Voice Notes APIs"""
    global TEST_VOICE_NOTE_ID
    
    print("=" * 60)
    print("TESTING VOICE NOTES APIs")
    print("=" * 60)
    
    # Test 1: POST /api/voice-notes - Create voice note
    try:
        # Create sample audio data (base64 encoded)
        sample_audio = base64.b64encode(b"fake_audio_data_for_testing").decode('utf-8')
        
        payload = {
            "project_id": PROJECT_ID,
            "room_id": TEST_ROOM_ID,
            "audio_data": sample_audio,
            "duration": 30
        }
        
        response = requests.post(f"{BACKEND_URL}/voice-notes", json=payload)
        if response.status_code in [200, 201]:
            data = response.json()
            TEST_VOICE_NOTE_ID = data.get('id') or data.get('note_id')
            log_test("POST /api/voice-notes", "PASS", 
                    f"Status: {response.status_code}, Created note ID: {TEST_VOICE_NOTE_ID}")
        else:
            log_test("POST /api/voice-notes", "FAIL", 
                    f"Status: {response.status_code}, Error: {response.text}")
    except Exception as e:
        log_test("POST /api/voice-notes", "FAIL", f"Exception: {str(e)}")
    
    # Test 2: GET /api/voice-notes/project/{project_id}
    try:
        response = requests.get(f"{BACKEND_URL}/voice-notes/project/{PROJECT_ID}")
        if response.status_code == 200:
            data = response.json()
            log_test("GET /api/voice-notes/project/{project_id}", "PASS", 
                    f"Status: {response.status_code}, Found {len(data)} voice notes")
        else:
            log_test("GET /api/voice-notes/project/{project_id}", "FAIL", 
                    f"Status: {response.status_code}, Error: {response.text}")
    except Exception as e:
        log_test("GET /api/voice-notes/project/{project_id}", "FAIL", f"Exception: {str(e)}")
    
    # Test 3: GET /api/voice-notes/room/{room_id}
    try:
        response = requests.get(f"{BACKEND_URL}/voice-notes/room/{TEST_ROOM_ID}")
        if response.status_code == 200:
            data = response.json()
            log_test("GET /api/voice-notes/room/{room_id}", "PASS", 
                    f"Status: {response.status_code}, Found {len(data)} voice notes for room")
        else:
            log_test("GET /api/voice-notes/room/{room_id}", "FAIL", 
                    f"Status: {response.status_code}, Error: {response.text}")
    except Exception as e:
        log_test("GET /api/voice-notes/room/{room_id}", "FAIL", f"Exception: {str(e)}")
    
    # Test 4: DELETE /api/voice-notes/{note_id}
    if TEST_VOICE_NOTE_ID:
        try:
            response = requests.delete(f"{BACKEND_URL}/voice-notes/{TEST_VOICE_NOTE_ID}")
            if response.status_code in [200, 204]:
                log_test("DELETE /api/voice-notes/{note_id}", "PASS", 
                        f"Status: {response.status_code}, Voice note deleted successfully")
            else:
                log_test("DELETE /api/voice-notes/{note_id}", "FAIL", 
                        f"Status: {response.status_code}, Error: {response.text}")
        except Exception as e:
            log_test("DELETE /api/voice-notes/{note_id}", "FAIL", f"Exception: {str(e)}")

def test_punch_list_apis():
    """Test Punch List APIs"""
    global TEST_PUNCH_LIST_ID
    
    print("=" * 60)
    print("TESTING PUNCH LIST APIs")
    print("=" * 60)
    
    # Test 1: POST /api/punch-list - Create punch list item
    try:
        payload = {
            "project_id": PROJECT_ID,
            "title": "Test Punch List Item",
            "description": "This is a test punch list item for API testing",
            "priority": "high"
        }
        
        response = requests.post(f"{BACKEND_URL}/punch-list", json=payload)
        if response.status_code in [200, 201]:
            data = response.json()
            TEST_PUNCH_LIST_ID = data.get('id') or data.get('item_id')
            log_test("POST /api/punch-list", "PASS", 
                    f"Status: {response.status_code}, Created item ID: {TEST_PUNCH_LIST_ID}")
        else:
            log_test("POST /api/punch-list", "FAIL", 
                    f"Status: {response.status_code}, Error: {response.text}")
    except Exception as e:
        log_test("POST /api/punch-list", "FAIL", f"Exception: {str(e)}")
    
    # Test 2: GET /api/punch-list/project/{project_id}
    try:
        response = requests.get(f"{BACKEND_URL}/punch-list/project/{PROJECT_ID}")
        if response.status_code == 200:
            data = response.json()
            log_test("GET /api/punch-list/project/{project_id}", "PASS", 
                    f"Status: {response.status_code}, Found {len(data)} punch list items")
        else:
            log_test("GET /api/punch-list/project/{project_id}", "FAIL", 
                    f"Status: {response.status_code}, Error: {response.text}")
    except Exception as e:
        log_test("GET /api/punch-list/project/{project_id}", "FAIL", f"Exception: {str(e)}")
    
    # Test 3: PATCH /api/punch-list/{item_id} - Update punch list item
    if TEST_PUNCH_LIST_ID:
        try:
            payload = {
                "title": "Updated Test Punch List Item",
                "status": "in_progress"
            }
            
            response = requests.patch(f"{BACKEND_URL}/punch-list/{TEST_PUNCH_LIST_ID}", json=payload)
            if response.status_code == 200:
                data = response.json()
                log_test("PATCH /api/punch-list/{item_id}", "PASS", 
                        f"Status: {response.status_code}, Item updated successfully")
            else:
                log_test("PATCH /api/punch-list/{item_id}", "FAIL", 
                        f"Status: {response.status_code}, Error: {response.text}")
        except Exception as e:
            log_test("PATCH /api/punch-list/{item_id}", "FAIL", f"Exception: {str(e)}")
    
    # Test 4: POST /api/punch-list/ai-suggest/{project_id} - Generate AI suggestions
    try:
        response = requests.post(f"{BACKEND_URL}/punch-list/ai-suggest/{PROJECT_ID}")
        if response.status_code in [200, 201]:
            data = response.json()
            log_test("POST /api/punch-list/ai-suggest/{project_id}", "PASS", 
                    f"Status: {response.status_code}, AI suggestions generated")
        else:
            log_test("POST /api/punch-list/ai-suggest/{project_id}", "FAIL", 
                    f"Status: {response.status_code}, Error: {response.text}")
    except Exception as e:
        log_test("POST /api/punch-list/ai-suggest/{project_id}", "FAIL", f"Exception: {str(e)}")
    
    # Test 5: DELETE /api/punch-list/{item_id}
    if TEST_PUNCH_LIST_ID:
        try:
            response = requests.delete(f"{BACKEND_URL}/punch-list/{TEST_PUNCH_LIST_ID}")
            if response.status_code in [200, 204]:
                log_test("DELETE /api/punch-list/{item_id}", "PASS", 
                        f"Status: {response.status_code}, Punch list item deleted successfully")
            else:
                log_test("DELETE /api/punch-list/{item_id}", "FAIL", 
                        f"Status: {response.status_code}, Error: {response.text}")
        except Exception as e:
            log_test("DELETE /api/punch-list/{item_id}", "FAIL", f"Exception: {str(e)}")

def test_team_chat_apis():
    """Test Team Chat APIs"""
    print("=" * 60)
    print("TESTING TEAM CHAT APIs")
    print("=" * 60)
    
    test_phone = "+1234567890"
    
    # Test 1: POST /api/chat/send - Send message
    try:
        payload = {
            "project_id": PROJECT_ID,
            "sender_phone": test_phone,
            "sender_name": "Test User",
            "message": "This is a test message for API testing"
        }
        
        response = requests.post(f"{BACKEND_URL}/chat/send", json=payload)
        if response.status_code in [200, 201]:
            data = response.json()
            log_test("POST /api/chat/send", "PASS", 
                    f"Status: {response.status_code}, Message sent successfully")
        else:
            log_test("POST /api/chat/send", "FAIL", 
                    f"Status: {response.status_code}, Error: {response.text}")
    except Exception as e:
        log_test("POST /api/chat/send", "FAIL", f"Exception: {str(e)}")
    
    # Test 2: GET /api/chat/messages/{project_id}
    try:
        response = requests.get(f"{BACKEND_URL}/chat/messages/{PROJECT_ID}")
        if response.status_code == 200:
            data = response.json()
            log_test("GET /api/chat/messages/{project_id}", "PASS", 
                    f"Status: {response.status_code}, Found {len(data)} chat messages")
        else:
            log_test("GET /api/chat/messages/{project_id}", "FAIL", 
                    f"Status: {response.status_code}, Error: {response.text}")
    except Exception as e:
        log_test("GET /api/chat/messages/{project_id}", "FAIL", f"Exception: {str(e)}")
    
    # Test 3: GET /api/chat/unread/{project_id}/{phone}
    try:
        response = requests.get(f"{BACKEND_URL}/chat/unread/{PROJECT_ID}/{test_phone}")
        if response.status_code == 200:
            data = response.json()
            unread_count = data.get('unread_count', 0)
            log_test("GET /api/chat/unread/{project_id}/{phone}", "PASS", 
                    f"Status: {response.status_code}, Unread count: {unread_count}")
        else:
            log_test("GET /api/chat/unread/{project_id}/{phone}", "FAIL", 
                    f"Status: {response.status_code}, Error: {response.text}")
    except Exception as e:
        log_test("GET /api/chat/unread/{project_id}/{phone}", "FAIL", f"Exception: {str(e)}")
    
    # Test 4: POST /api/chat/mark-read/{project_id}?phone={phone}
    try:
        response = requests.post(f"{BACKEND_URL}/chat/mark-read/{PROJECT_ID}?phone={test_phone}")
        if response.status_code in [200, 201]:
            log_test("POST /api/chat/mark-read/{project_id}?phone={phone}", "PASS", 
                    f"Status: {response.status_code}, Messages marked as read")
        else:
            log_test("POST /api/chat/mark-read/{project_id}?phone={phone}", "FAIL", 
                    f"Status: {response.status_code}, Error: {response.text}")
    except Exception as e:
        log_test("POST /api/chat/mark-read/{project_id}?phone={phone}", "FAIL", f"Exception: {str(e)}")

def test_shipping_tracking_apis():
    """Test Shipping/Tracking APIs"""
    global TEST_ITEM_ID
    
    print("=" * 60)
    print("TESTING SHIPPING/TRACKING APIs")
    print("=" * 60)
    
    # First, let's try to get items with tracking to find a valid item ID
    try:
        response = requests.get(f"{BACKEND_URL}/items/with-tracking/{PROJECT_ID}")
        if response.status_code == 200:
            data = response.json()
            if data and len(data) > 0:
                TEST_ITEM_ID = data[0].get('id')
                log_test("GET /api/items/with-tracking/{project_id}", "PASS", 
                        f"Status: {response.status_code}, Found {len(data)} items with tracking")
            else:
                log_test("GET /api/items/with-tracking/{project_id}", "PASS", 
                        f"Status: {response.status_code}, No items with tracking found (empty project)")
        else:
            log_test("GET /api/items/with-tracking/{project_id}", "FAIL", 
                    f"Status: {response.status_code}, Error: {response.text}")
    except Exception as e:
        log_test("GET /api/items/with-tracking/{project_id}", "FAIL", f"Exception: {str(e)}")
    
    # Test PATCH /api/items/{item_id}/tracking - Update item tracking info
    if TEST_ITEM_ID:
        try:
            payload = {
                "tracking_number": "TEST123456789",
                "carrier": "FedEx",
                "status": "shipped"
            }
            
            response = requests.patch(f"{BACKEND_URL}/items/{TEST_ITEM_ID}/tracking", json=payload)
            if response.status_code == 200:
                log_test("PATCH /api/items/{item_id}/tracking", "PASS", 
                        f"Status: {response.status_code}, Tracking info updated successfully")
            else:
                log_test("PATCH /api/items/{item_id}/tracking", "FAIL", 
                        f"Status: {response.status_code}, Error: {response.text}")
        except Exception as e:
            log_test("PATCH /api/items/{item_id}/tracking", "FAIL", f"Exception: {str(e)}")
    else:
        log_test("PATCH /api/items/{item_id}/tracking", "SKIP", "No valid item ID found to test tracking update")

def test_photos_gps_apis():
    """Test Photos with GPS APIs"""
    global TEST_PHOTO_ID
    
    print("=" * 60)
    print("TESTING PHOTOS WITH GPS APIs")
    print("=" * 60)
    
    # Test 1: GET /api/photos/with-location/{project_id}
    try:
        response = requests.get(f"{BACKEND_URL}/photos/with-location/{PROJECT_ID}")
        if response.status_code == 200:
            data = response.json()
            if data and len(data) > 0:
                TEST_PHOTO_ID = data[0].get('id')
            log_test("GET /api/photos/with-location/{project_id}", "PASS", 
                    f"Status: {response.status_code}, Found {len(data)} photos with GPS data")
        else:
            log_test("GET /api/photos/with-location/{project_id}", "FAIL", 
                    f"Status: {response.status_code}, Error: {response.text}")
    except Exception as e:
        log_test("GET /api/photos/with-location/{project_id}", "FAIL", f"Exception: {str(e)}")
    
    # Test 2: GET /api/photos/by-room-name/{project_id}/{room_name}
    try:
        test_room_name = "kitchen"
        response = requests.get(f"{BACKEND_URL}/photos/by-room-name/{PROJECT_ID}/{test_room_name}")
        if response.status_code == 200:
            data = response.json()
            log_test("GET /api/photos/by-room-name/{project_id}/{room_name}", "PASS", 
                    f"Status: {response.status_code}, Found {len(data)} photos for room '{test_room_name}'")
        else:
            log_test("GET /api/photos/by-room-name/{project_id}/{room_name}", "FAIL", 
                    f"Status: {response.status_code}, Error: {response.text}")
    except Exception as e:
        log_test("GET /api/photos/by-room-name/{project_id}/{room_name}", "FAIL", f"Exception: {str(e)}")
    
    # Test 3: PATCH /api/photos/{photo_id}/location - Add GPS location to photo
    if TEST_PHOTO_ID:
        try:
            payload = {
                "latitude": 40.7128,
                "longitude": -74.0060,
                "address": "New York, NY"
            }
            
            response = requests.patch(f"{BACKEND_URL}/photos/{TEST_PHOTO_ID}/location", json=payload)
            if response.status_code == 200:
                log_test("PATCH /api/photos/{photo_id}/location", "PASS", 
                        f"Status: {response.status_code}, GPS location added to photo")
            else:
                log_test("PATCH /api/photos/{photo_id}/location", "FAIL", 
                        f"Status: {response.status_code}, Error: {response.text}")
        except Exception as e:
            log_test("PATCH /api/photos/{photo_id}/location", "FAIL", f"Exception: {str(e)}")
    else:
        log_test("PATCH /api/photos/{photo_id}/location", "SKIP", "No valid photo ID found to test GPS location update")

def main():
    """Run all API tests"""
    print("🚀 STARTING COMPREHENSIVE API TESTING")
    print(f"Backend URL: {BACKEND_URL}")
    print(f"Project ID: {PROJECT_ID}")
    print(f"Test started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print()
    
    # Run all test suites
    test_sync_apis()
    test_voice_notes_apis()
    test_punch_list_apis()
    test_team_chat_apis()
    test_shipping_tracking_apis()
    test_photos_gps_apis()
    
    print("=" * 60)
    print("🏁 API TESTING COMPLETED")
    print(f"Test completed at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 60)

if __name__ == "__main__":
    main()
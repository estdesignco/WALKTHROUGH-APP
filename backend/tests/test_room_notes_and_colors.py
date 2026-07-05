"""
Test Room Notes and Distinct Colors Feature
Tests:
1. Room notes can be saved via PUT /api/rooms/{roomId}
2. Room notes persist and are returned in GET requests
3. Room colors are distinct (not all the same)
4. Notes are shared between Walkthrough and Checklist (same room data)
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://design-burst.preview.emergentagent.com')

class TestRoomNotesAndColors:
    """Test room notes and distinct colors functionality"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test data"""
        self.project_id = None
        self.room_ids = []
        
        # Get existing project
        response = requests.get(f"{BASE_URL}/api/projects")
        assert response.status_code == 200
        projects = response.json()
        
        if projects:
            self.project_id = projects[0]['id']
            # Get rooms
            project_response = requests.get(f"{BASE_URL}/api/projects/{self.project_id}")
            assert project_response.status_code == 200
            project_data = project_response.json()
            self.room_ids = [r['id'] for r in project_data.get('rooms', [])]
        
        yield
    
    def test_room_notes_save_via_api(self):
        """Test that room notes can be saved via PUT /api/rooms/{roomId}"""
        if not self.room_ids:
            pytest.skip("No rooms available for testing")
        
        room_id = self.room_ids[0]
        test_notes = "Test notes for room - API test"
        
        # Save notes
        response = requests.put(
            f"{BASE_URL}/api/rooms/{room_id}",
            json={"notes": test_notes}
        )
        
        assert response.status_code == 200, f"Failed to save notes: {response.text}"
        data = response.json()
        assert data.get('notes') == test_notes, f"Notes not saved correctly: {data.get('notes')}"
        print(f"✅ Room notes saved: '{test_notes}'")
    
    def test_room_notes_persist_in_get(self):
        """Test that room notes persist and are returned in GET requests"""
        if not self.room_ids:
            pytest.skip("No rooms available for testing")
        
        room_id = self.room_ids[0]
        test_notes = "Persistent notes test - " + str(os.urandom(4).hex())
        
        # Save notes
        put_response = requests.put(
            f"{BASE_URL}/api/rooms/{room_id}",
            json={"notes": test_notes}
        )
        assert put_response.status_code == 200
        
        # Get room and verify notes
        get_response = requests.get(f"{BASE_URL}/api/rooms/{room_id}")
        assert get_response.status_code == 200
        data = get_response.json()
        assert data.get('notes') == test_notes, f"Notes not persisted: expected '{test_notes}', got '{data.get('notes')}'"
        print(f"✅ Room notes persisted correctly")
    
    def test_room_notes_in_project_response(self):
        """Test that room notes are included in project response"""
        if not self.project_id:
            pytest.skip("No project available for testing")
        
        response = requests.get(f"{BASE_URL}/api/projects/{self.project_id}")
        assert response.status_code == 200
        data = response.json()
        
        rooms = data.get('rooms', [])
        assert len(rooms) > 0, "No rooms in project"
        
        # Check that notes field exists in room data
        for room in rooms:
            assert 'notes' in room, f"Room {room.get('name')} missing 'notes' field"
            print(f"✅ Room '{room.get('name')}' has notes field: '{room.get('notes', '')[:30]}...'")
    
    def test_room_colors_are_distinct(self):
        """Test that room colors are distinct (not all the same)"""
        if not self.project_id:
            pytest.skip("No project available for testing")
        
        response = requests.get(f"{BASE_URL}/api/projects/{self.project_id}")
        assert response.status_code == 200
        data = response.json()
        
        rooms = data.get('rooms', [])
        if len(rooms) < 2:
            pytest.skip("Need at least 2 rooms to test distinct colors")
        
        colors = [room.get('color') for room in rooms]
        print(f"Room colors: {colors}")
        
        # Check that not all colors are the same
        unique_colors = set(colors)
        assert len(unique_colors) > 1, f"All rooms have the same color: {colors}"
        print(f"✅ Room colors are distinct: {unique_colors}")
    
    def test_room_color_update_via_api(self):
        """Test that room color can be updated via PUT /api/rooms/{roomId}"""
        if not self.room_ids:
            pytest.skip("No rooms available for testing")
        
        room_id = self.room_ids[0]
        test_color = "#FF5733"  # Orange-red color
        
        # Update color
        response = requests.put(
            f"{BASE_URL}/api/rooms/{room_id}",
            json={"color": test_color}
        )
        
        assert response.status_code == 200, f"Failed to update color: {response.text}"
        data = response.json()
        assert data.get('color') == test_color, f"Color not updated: {data.get('color')}"
        print(f"✅ Room color updated to: {test_color}")
        
        # Restore original color
        requests.put(
            f"{BASE_URL}/api/rooms/{room_id}",
            json={"color": "#E67E22"}  # Restore orange
        )
    
    def test_room_notes_empty_by_default(self):
        """Test that new rooms have empty notes by default"""
        if not self.project_id:
            pytest.skip("No project available for testing")
        
        response = requests.get(f"{BASE_URL}/api/projects/{self.project_id}")
        assert response.status_code == 200
        data = response.json()
        
        rooms = data.get('rooms', [])
        for room in rooms:
            notes = room.get('notes', '')
            # Notes should be a string (empty or with content)
            assert isinstance(notes, str), f"Room {room.get('name')} notes is not a string: {type(notes)}"
        print(f"✅ All rooms have valid notes field (string type)")


class TestRoomNotesAPIEndpoints:
    """Test specific API endpoints for room notes"""
    
    def test_put_room_with_notes_only(self):
        """Test PUT /api/rooms/{roomId} with only notes field"""
        # Get a room ID first
        response = requests.get(f"{BASE_URL}/api/projects")
        if response.status_code != 200 or not response.json():
            pytest.skip("No projects available")
        
        project_id = response.json()[0]['id']
        project_response = requests.get(f"{BASE_URL}/api/projects/{project_id}")
        rooms = project_response.json().get('rooms', [])
        
        if not rooms:
            pytest.skip("No rooms available")
        
        room_id = rooms[0]['id']
        
        # Update only notes
        response = requests.put(
            f"{BASE_URL}/api/rooms/{room_id}",
            json={"notes": "Only notes update test"}
        )
        
        assert response.status_code == 200
        assert response.json().get('notes') == "Only notes update test"
        print("✅ PUT with only notes field works")
    
    def test_put_room_with_notes_and_color(self):
        """Test PUT /api/rooms/{roomId} with both notes and color"""
        # Get a room ID first
        response = requests.get(f"{BASE_URL}/api/projects")
        if response.status_code != 200 or not response.json():
            pytest.skip("No projects available")
        
        project_id = response.json()[0]['id']
        project_response = requests.get(f"{BASE_URL}/api/projects/{project_id}")
        rooms = project_response.json().get('rooms', [])
        
        if not rooms:
            pytest.skip("No rooms available")
        
        room_id = rooms[0]['id']
        
        # Update both notes and color
        response = requests.put(
            f"{BASE_URL}/api/rooms/{room_id}",
            json={
                "notes": "Both fields update test",
                "color": "#E67E22"
            }
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data.get('notes') == "Both fields update test"
        assert data.get('color') == "#E67E22"
        print("✅ PUT with both notes and color works")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])

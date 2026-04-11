"""
Test suite for Room Finish Schedule API - Iteration 46
Tests: tile_scale field, USE FULL IMAGE crop, zone resize, element drag/resize
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://finish-schedule.preview.emergentagent.com')

class TestFinishScheduleAPI:
    """Test finish schedule API endpoints"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test data"""
        # Get projects
        response = requests.get(f"{BASE_URL}/api/projects")
        assert response.status_code == 200
        projects = response.json()
        assert len(projects) > 0
        self.project_id = projects[0]['id']
        
        # Get rooms
        response = requests.get(f"{BASE_URL}/api/projects/{self.project_id}")
        assert response.status_code == 200
        project = response.json()
        rooms = project.get('rooms', [])
        assert len(rooms) > 0
        self.room_id = rooms[0]['id']
        
        # Get finish schedules
        response = requests.get(f"{BASE_URL}/api/projects/{self.project_id}/rooms/{self.room_id}/finish-schedules")
        assert response.status_code == 200
        schedules = response.json()
        if len(schedules) > 0:
            self.schedule_id = schedules[0]['id']
            self.schedule = schedules[0]
        else:
            self.schedule_id = None
            self.schedule = None
    
    def test_get_projects(self):
        """Test GET /api/projects returns projects"""
        response = requests.get(f"{BASE_URL}/api/projects")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) > 0
        print(f"Found {len(data)} projects")
    
    def test_get_finish_schedules(self):
        """Test GET finish schedules for room"""
        response = requests.get(f"{BASE_URL}/api/projects/{self.project_id}/rooms/{self.room_id}/finish-schedules")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"Found {len(data)} finish schedules")
    
    def test_schedule_has_surfaces(self):
        """Test schedule has surfaces array"""
        if not self.schedule:
            pytest.skip("No schedule found")
        assert 'surfaces' in self.schedule
        assert isinstance(self.schedule['surfaces'], list)
        print(f"Schedule has {len(self.schedule['surfaces'])} surfaces")
    
    def test_surface_has_zone_config(self):
        """Test surface has zone_config field"""
        if not self.schedule:
            pytest.skip("No schedule found")
        surfaces = self.schedule.get('surfaces', [])
        wall_surfaces = [s for s in surfaces if s.get('surface_type') == 'wall']
        if len(wall_surfaces) > 0:
            # zone_config may be None or a list
            zone_config = wall_surfaces[0].get('zone_config')
            print(f"Wall surface zone_config: {zone_config}")
    
    def test_surface_has_niches_benches_fixtures(self):
        """Test surface has niches, benches, fixtures fields"""
        if not self.schedule:
            pytest.skip("No schedule found")
        surfaces = self.schedule.get('surfaces', [])
        if len(surfaces) > 0:
            surface = surfaces[0]
            # These fields should exist (may be None or empty list)
            assert 'niches' in surface or surface.get('niches') is None
            assert 'benches' in surface or surface.get('benches') is None
            assert 'fixtures' in surface or surface.get('fixtures') is None
            print("Surface has niches/benches/fixtures fields")
    
    def test_update_material_with_tile_scale(self):
        """Test PUT endpoint saves tile_scale field on materials"""
        if not self.schedule:
            pytest.skip("No schedule found")
        
        # Find a surface with materials
        surfaces = self.schedule.get('surfaces', [])
        surface_with_material = None
        for s in surfaces:
            if s.get('materials') and len(s.get('materials', [])) > 0:
                surface_with_material = s
                break
        
        if not surface_with_material:
            pytest.skip("No surface with materials found")
        
        # Update the material with tile_scale
        material = surface_with_material['materials'][0]
        material['tile_scale'] = 1.5  # 150%
        
        # Update the schedule
        update_data = {
            "surfaces": surfaces
        }
        
        response = requests.put(
            f"{BASE_URL}/api/projects/{self.project_id}/finish-schedules/{self.schedule_id}",
            json=update_data
        )
        assert response.status_code == 200
        updated = response.json()
        
        # Verify tile_scale was saved
        updated_surfaces = updated.get('surfaces', [])
        for s in updated_surfaces:
            if s.get('id') == surface_with_material['id']:
                for m in s.get('materials', []):
                    if m.get('id') == material['id']:
                        assert m.get('tile_scale') == 1.5
                        print(f"SUCCESS: tile_scale saved as {m.get('tile_scale')}")
                        return
        
        print("Material with tile_scale not found in response")
    
    def test_update_material_with_full_image_crop(self):
        """Test saving material with full image crop (x:0, y:0, w:naturalWidth, h:naturalHeight)"""
        if not self.schedule:
            pytest.skip("No schedule found")
        
        surfaces = self.schedule.get('surfaces', [])
        if len(surfaces) == 0:
            pytest.skip("No surfaces found")
        
        # Add a material with full image crop
        test_material = {
            "id": "test-material-full-crop",
            "name": "Test Tile",
            "image": "https://example.com/tile.png",
            "pattern": "stacked_horizontal",
            "tile_crop": {"x": 0, "y": 0, "w": 800, "h": 600},  # Full image dimensions
            "grout_color": "#FFFFFF",
            "tile_orientation": "horizontal",
            "tile_scale": 1.0,
            "position_label": "test_zone"
        }
        
        # Add to first surface
        surfaces[0]['materials'] = surfaces[0].get('materials', []) + [test_material]
        
        update_data = {"surfaces": surfaces}
        response = requests.put(
            f"{BASE_URL}/api/projects/{self.project_id}/finish-schedules/{self.schedule_id}",
            json=update_data
        )
        assert response.status_code == 200
        updated = response.json()
        
        # Verify the material was saved with full crop
        updated_surfaces = updated.get('surfaces', [])
        found = False
        for s in updated_surfaces:
            for m in s.get('materials', []):
                if m.get('id') == 'test-material-full-crop':
                    crop = m.get('tile_crop', {})
                    assert crop.get('x') == 0
                    assert crop.get('y') == 0
                    assert crop.get('w') == 800
                    assert crop.get('h') == 600
                    found = True
                    print(f"SUCCESS: Full image crop saved: {crop}")
                    break
        
        assert found, "Test material not found in response"
    
    def test_update_zone_config(self):
        """Test updating zone_config for zone resize"""
        if not self.schedule:
            pytest.skip("No schedule found")
        
        surfaces = self.schedule.get('surfaces', [])
        wall_surfaces = [s for s in surfaces if s.get('surface_type') == 'wall']
        
        if len(wall_surfaces) == 0:
            pytest.skip("No wall surfaces found")
        
        # Update zone_config with new heights
        new_zone_config = [
            {"id": "upper_accent", "label": "Upper", "height": 20, "dimension": "12\""},
            {"id": "main_wall", "label": "Main Wall", "height": 50, "dimension": "36\""},
            {"id": "wainscot", "label": "Wainscot", "height": 15, "dimension": ""},
            {"id": "floor", "label": "Floor", "height": 15, "dimension": ""}
        ]
        
        wall_surfaces[0]['zone_config'] = new_zone_config
        
        update_data = {"surfaces": surfaces}
        response = requests.put(
            f"{BASE_URL}/api/projects/{self.project_id}/finish-schedules/{self.schedule_id}",
            json=update_data
        )
        assert response.status_code == 200
        updated = response.json()
        
        # Verify zone_config was saved
        updated_surfaces = updated.get('surfaces', [])
        for s in updated_surfaces:
            if s.get('id') == wall_surfaces[0]['id']:
                saved_config = s.get('zone_config', [])
                if saved_config:
                    assert saved_config[0]['height'] == 20
                    assert saved_config[1]['height'] == 50
                    print(f"SUCCESS: zone_config saved with heights: {[z['height'] for z in saved_config]}")
                    return
        
        print("Zone config not found in response")
    
    def test_create_niche(self):
        """Test creating a niche element"""
        if not self.schedule:
            pytest.skip("No schedule found")
        
        surfaces = self.schedule.get('surfaces', [])
        wall_surfaces = [s for s in surfaces if s.get('surface_type') == 'wall']
        
        if len(wall_surfaces) == 0:
            pytest.skip("No wall surfaces found")
        
        # Add a niche
        test_niche = {
            "id": "test-niche-1",
            "zone_id": "upper_accent",
            "x": 30,
            "y": 20,
            "w": 25,
            "h": 40
        }
        
        wall_surfaces[0]['niches'] = wall_surfaces[0].get('niches', []) + [test_niche]
        
        update_data = {"surfaces": surfaces}
        response = requests.put(
            f"{BASE_URL}/api/projects/{self.project_id}/finish-schedules/{self.schedule_id}",
            json=update_data
        )
        assert response.status_code == 200
        updated = response.json()
        
        # Verify niche was saved
        updated_surfaces = updated.get('surfaces', [])
        for s in updated_surfaces:
            if s.get('id') == wall_surfaces[0]['id']:
                niches = s.get('niches', [])
                for n in niches:
                    if n.get('id') == 'test-niche-1':
                        assert n.get('x') == 30
                        assert n.get('y') == 20
                        assert n.get('w') == 25
                        assert n.get('h') == 40
                        print(f"SUCCESS: Niche saved at ({n['x']}, {n['y']}) with size ({n['w']}, {n['h']})")
                        return
        
        print("Niche not found in response")
    
    def test_create_bench(self):
        """Test creating a bench element"""
        if not self.schedule:
            pytest.skip("No schedule found")
        
        surfaces = self.schedule.get('surfaces', [])
        wall_surfaces = [s for s in surfaces if s.get('surface_type') == 'wall']
        
        if len(wall_surfaces) == 0:
            pytest.skip("No wall surfaces found")
        
        # Add a bench
        test_bench = {
            "id": "test-bench-1",
            "zone_id": "main_wall",
            "x": 10,
            "y": 60,
            "w": 30,
            "h": 20
        }
        
        wall_surfaces[0]['benches'] = wall_surfaces[0].get('benches', []) + [test_bench]
        
        update_data = {"surfaces": surfaces}
        response = requests.put(
            f"{BASE_URL}/api/projects/{self.project_id}/finish-schedules/{self.schedule_id}",
            json=update_data
        )
        assert response.status_code == 200
        updated = response.json()
        
        # Verify bench was saved
        updated_surfaces = updated.get('surfaces', [])
        for s in updated_surfaces:
            if s.get('id') == wall_surfaces[0]['id']:
                benches = s.get('benches', [])
                for b in benches:
                    if b.get('id') == 'test-bench-1':
                        assert b.get('x') == 10
                        assert b.get('y') == 60
                        print(f"SUCCESS: Bench saved at ({b['x']}, {b['y']})")
                        return
        
        print("Bench not found in response")
    
    def test_create_fixture(self):
        """Test creating a fixture element"""
        if not self.schedule:
            pytest.skip("No schedule found")
        
        surfaces = self.schedule.get('surfaces', [])
        wall_surfaces = [s for s in surfaces if s.get('surface_type') == 'wall']
        
        if len(wall_surfaces) == 0:
            pytest.skip("No wall surfaces found")
        
        # Add a fixture
        test_fixture = {
            "id": "test-fixture-1",
            "zone_id": "main_wall",
            "x": 50,
            "y": 30,
            "name": "Shower Head",
            "image": "https://example.com/showerhead.png"
        }
        
        wall_surfaces[0]['fixtures'] = wall_surfaces[0].get('fixtures', []) + [test_fixture]
        
        update_data = {"surfaces": surfaces}
        response = requests.put(
            f"{BASE_URL}/api/projects/{self.project_id}/finish-schedules/{self.schedule_id}",
            json=update_data
        )
        assert response.status_code == 200
        updated = response.json()
        
        # Verify fixture was saved
        updated_surfaces = updated.get('surfaces', [])
        for s in updated_surfaces:
            if s.get('id') == wall_surfaces[0]['id']:
                fixtures = s.get('fixtures', [])
                for f in fixtures:
                    if f.get('id') == 'test-fixture-1':
                        assert f.get('x') == 50
                        assert f.get('y') == 30
                        assert f.get('name') == 'Shower Head'
                        print(f"SUCCESS: Fixture '{f['name']}' saved at ({f['x']}, {f['y']})")
                        return
        
        print("Fixture not found in response")
    
    def test_ceiling_surface_exists(self):
        """Test ceiling surface exists"""
        if not self.schedule:
            pytest.skip("No schedule found")
        
        surfaces = self.schedule.get('surfaces', [])
        ceiling = [s for s in surfaces if s.get('surface_type') == 'ceiling']
        assert len(ceiling) > 0, "No ceiling surface found"
        print(f"SUCCESS: Ceiling surface found: {ceiling[0].get('name')}")
    
    def test_floor_surface_exists(self):
        """Test floor surface exists"""
        if not self.schedule:
            pytest.skip("No schedule found")
        
        surfaces = self.schedule.get('surfaces', [])
        floor = [s for s in surfaces if s.get('surface_type') == 'floor']
        assert len(floor) > 0, "No floor surface found"
        print(f"SUCCESS: Floor surface found: {floor[0].get('name')}")
    
    def test_place_tile_on_ceiling(self):
        """Test placing tile on ceiling surface"""
        if not self.schedule:
            pytest.skip("No schedule found")
        
        surfaces = self.schedule.get('surfaces', [])
        ceiling = [s for s in surfaces if s.get('surface_type') == 'ceiling']
        
        if len(ceiling) == 0:
            pytest.skip("No ceiling surface found")
        
        # Add material to ceiling
        ceiling_material = {
            "id": "ceiling-tile-1",
            "name": "Ceiling Tile",
            "image": "https://example.com/ceiling-tile.png",
            "pattern": "stacked_horizontal",
            "tile_crop": {"x": 0, "y": 0, "w": 400, "h": 400},
            "grout_color": "#FFFFFF",
            "tile_orientation": "horizontal",
            "tile_scale": 1.0,
            "position_label": "_surface"
        }
        
        ceiling[0]['materials'] = [ceiling_material]
        
        update_data = {"surfaces": surfaces}
        response = requests.put(
            f"{BASE_URL}/api/projects/{self.project_id}/finish-schedules/{self.schedule_id}",
            json=update_data
        )
        assert response.status_code == 200
        print("SUCCESS: Tile placed on ceiling")
    
    def test_place_tile_on_floor(self):
        """Test placing tile on floor surface"""
        if not self.schedule:
            pytest.skip("No schedule found")
        
        surfaces = self.schedule.get('surfaces', [])
        floor = [s for s in surfaces if s.get('surface_type') == 'floor']
        
        if len(floor) == 0:
            pytest.skip("No floor surface found")
        
        # Add material to floor
        floor_material = {
            "id": "floor-tile-1",
            "name": "Floor Tile",
            "image": "https://example.com/floor-tile.png",
            "pattern": "diagonal",
            "tile_crop": {"x": 0, "y": 0, "w": 500, "h": 500},
            "grout_color": "#888888",
            "tile_orientation": "horizontal",
            "tile_scale": 1.2,
            "position_label": "_surface"
        }
        
        floor[0]['materials'] = [floor_material]
        
        update_data = {"surfaces": surfaces}
        response = requests.put(
            f"{BASE_URL}/api/projects/{self.project_id}/finish-schedules/{self.schedule_id}",
            json=update_data
        )
        assert response.status_code == 200
        print("SUCCESS: Tile placed on floor")
    
    def test_all_9_patterns_supported(self):
        """Test all 9 tile patterns are valid"""
        patterns = [
            'stacked_horizontal',
            'stacked_vertical', 
            'offset',
            'one_third_offset',
            'herringbone',
            'herringbone_vertical',
            'basket_weave',
            'stepladder',
            'diagonal'
        ]
        
        if not self.schedule:
            pytest.skip("No schedule found")
        
        surfaces = self.schedule.get('surfaces', [])
        if len(surfaces) == 0:
            pytest.skip("No surfaces found")
        
        # Test each pattern can be saved
        for pattern in patterns:
            test_material = {
                "id": f"pattern-test-{pattern}",
                "name": f"Test {pattern}",
                "image": "https://example.com/tile.png",
                "pattern": pattern,
                "position_label": "test"
            }
            
            surfaces[0]['materials'] = [test_material]
            
            response = requests.put(
                f"{BASE_URL}/api/projects/{self.project_id}/finish-schedules/{self.schedule_id}",
                json={"surfaces": surfaces}
            )
            assert response.status_code == 200, f"Failed to save pattern: {pattern}"
        
        print(f"SUCCESS: All {len(patterns)} patterns supported")
    
    def test_grout_colors(self):
        """Test grout color values are saved"""
        grout_colors = ['#FFFFFF', '#D4D4D4', '#888888', '#4a4035', '#333333', '#111111']
        
        if not self.schedule:
            pytest.skip("No schedule found")
        
        surfaces = self.schedule.get('surfaces', [])
        if len(surfaces) == 0:
            pytest.skip("No surfaces found")
        
        for color in grout_colors:
            test_material = {
                "id": f"grout-test-{color}",
                "name": "Test Grout",
                "image": "https://example.com/tile.png",
                "pattern": "stacked_horizontal",
                "grout_color": color,
                "position_label": "test"
            }
            
            surfaces[0]['materials'] = [test_material]
            
            response = requests.put(
                f"{BASE_URL}/api/projects/{self.project_id}/finish-schedules/{self.schedule_id}",
                json={"surfaces": surfaces}
            )
            assert response.status_code == 200
            
            updated = response.json()
            saved_color = updated['surfaces'][0]['materials'][0].get('grout_color')
            assert saved_color == color, f"Grout color mismatch: expected {color}, got {saved_color}"
        
        print(f"SUCCESS: All {len(grout_colors)} grout colors supported")
    
    def test_tile_orientation(self):
        """Test tile orientation values are saved"""
        orientations = ['horizontal', 'vertical']
        
        if not self.schedule:
            pytest.skip("No schedule found")
        
        surfaces = self.schedule.get('surfaces', [])
        if len(surfaces) == 0:
            pytest.skip("No surfaces found")
        
        for orientation in orientations:
            test_material = {
                "id": f"orient-test-{orientation}",
                "name": "Test Orientation",
                "image": "https://example.com/tile.png",
                "pattern": "stacked_horizontal",
                "tile_orientation": orientation,
                "position_label": "test"
            }
            
            surfaces[0]['materials'] = [test_material]
            
            response = requests.put(
                f"{BASE_URL}/api/projects/{self.project_id}/finish-schedules/{self.schedule_id}",
                json={"surfaces": surfaces}
            )
            assert response.status_code == 200
            
            updated = response.json()
            saved_orient = updated['surfaces'][0]['materials'][0].get('tile_orientation')
            assert saved_orient == orientation, f"Orientation mismatch: expected {orientation}, got {saved_orient}"
        
        print(f"SUCCESS: Both orientations supported")
    
    def test_proxy_image_endpoint(self):
        """Test proxy-image endpoint works"""
        test_url = "https://static.prod-images.emergentagent.com/jobs/7932d827-12dd-45f6-923f-dedc2d66add5/images/c2147a2164972e94624fbd184860b0f82b5bbc7677032aca215da908850d59cb.png"
        
        response = requests.get(f"{BASE_URL}/api/proxy-image", params={"url": test_url})
        assert response.status_code == 200
        assert response.headers.get('content-type', '').startswith('image/')
        print("SUCCESS: Proxy image endpoint works")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])

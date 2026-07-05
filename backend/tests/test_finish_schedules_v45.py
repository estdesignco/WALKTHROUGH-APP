"""
Test suite for Room Finish Schedule 3D Shower View features
Tests: zone_config, niches, benches, fixtures, tile patterns, grout colors, orientation
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://design-burst.preview.emergentagent.com').rstrip('/')
PROJECT_ID = 'a3f6f6c5-0cbd-41c3-a997-34321e21cea4'
ROOM_ID = 'c607262f-28b6-418c-a5b3-2812e0830bc7'


class TestFinishScheduleAPI:
    """Test finish schedule CRUD operations"""
    
    def test_get_projects(self):
        """Test GET /api/projects returns projects"""
        r = requests.get(f'{BASE_URL}/api/projects')
        assert r.status_code == 200
        projects = r.json()
        assert len(projects) > 0
        assert any(p.get('name') == 'Wheeler Ridge Residence' for p in projects)
    
    def test_get_project_details(self):
        """Test GET /api/projects/{id} returns project with rooms"""
        r = requests.get(f'{BASE_URL}/api/projects/{PROJECT_ID}')
        assert r.status_code == 200
        project = r.json()
        assert project.get('name') == 'Wheeler Ridge Residence'
        rooms = project.get('rooms', [])
        assert len(rooms) >= 1
        assert any(r.get('name') == 'Master Bathroom' for r in rooms)
    
    def test_get_room_finish_schedules(self):
        """Test GET /api/projects/{id}/rooms/{room_id}/finish-schedules"""
        r = requests.get(f'{BASE_URL}/api/projects/{PROJECT_ID}/rooms/{ROOM_ID}/finish-schedules')
        assert r.status_code == 200
        schedules = r.json()
        assert len(schedules) >= 1
        
        # Verify schedule structure
        schedule = schedules[0]
        assert 'id' in schedule
        assert 'name' in schedule
        assert 'surfaces' in schedule
        assert schedule.get('schedule_type') == 'tile'
    
    def test_finish_schedule_has_surfaces(self):
        """Test that finish schedules have surfaces with proper structure"""
        r = requests.get(f'{BASE_URL}/api/projects/{PROJECT_ID}/rooms/{ROOM_ID}/finish-schedules')
        assert r.status_code == 200
        schedules = r.json()
        
        schedule = schedules[0]
        surfaces = schedule.get('surfaces', [])
        assert len(surfaces) >= 1
        
        # Check surface structure
        surface = surfaces[0]
        assert 'id' in surface
        assert 'name' in surface
        assert 'surface_type' in surface


class TestZoneConfig:
    """Test zone configuration features"""
    
    def test_surface_has_zone_config(self):
        """Test that surfaces have zone_config field"""
        r = requests.get(f'{BASE_URL}/api/projects/{PROJECT_ID}/rooms/{ROOM_ID}/finish-schedules')
        assert r.status_code == 200
        schedules = r.json()
        
        schedule = schedules[0]
        surfaces = schedule.get('surfaces', [])
        
        # Find a wall surface
        wall_surface = next((s for s in surfaces if s.get('surface_type') == 'wall'), None)
        assert wall_surface is not None
        
        zone_config = wall_surface.get('zone_config')
        assert zone_config is not None
        assert isinstance(zone_config, list)
        assert len(zone_config) >= 1
    
    def test_zone_config_structure(self):
        """Test zone_config has proper structure (id, label, height, dimension)"""
        r = requests.get(f'{BASE_URL}/api/projects/{PROJECT_ID}/rooms/{ROOM_ID}/finish-schedules')
        assert r.status_code == 200
        schedules = r.json()
        
        schedule = schedules[0]
        surfaces = schedule.get('surfaces', [])
        wall_surface = next((s for s in surfaces if s.get('surface_type') == 'wall'), None)
        
        zone_config = wall_surface.get('zone_config', [])
        for zone in zone_config:
            assert 'id' in zone
            assert 'label' in zone
            assert 'height' in zone
            # dimension is optional
    
    def test_update_zone_dimension(self):
        """Test updating zone dimension via PUT"""
        # Get current schedule
        r = requests.get(f'{BASE_URL}/api/projects/{PROJECT_ID}/rooms/{ROOM_ID}/finish-schedules')
        assert r.status_code == 200
        schedules = r.json()
        schedule = schedules[0]
        schedule_id = schedule.get('id')
        
        # Update zone_config with dimension
        surfaces = schedule.get('surfaces', [])
        if surfaces:
            surfaces[0]['zone_config'] = [
                {'id': 'upper', 'label': 'Upper', 'height': 25, 'dimension': '24"'},
                {'id': 'main', 'label': 'Main Wall', 'height': 50, 'dimension': '48"'},
                {'id': 'wainscot', 'label': 'Wainscot', 'height': 25, 'dimension': '24"'}
            ]
        
        r2 = requests.put(
            f'{BASE_URL}/api/projects/{PROJECT_ID}/finish-schedules/{schedule_id}',
            json={'surfaces': surfaces}
        )
        assert r2.status_code == 200
        
        # Verify update
        updated = r2.json()
        updated_surface = updated.get('surfaces', [])[0]
        zone_config = updated_surface.get('zone_config', [])
        assert len(zone_config) == 3
        assert zone_config[1].get('dimension') == '48"'


class TestNichesBenchesFixtures:
    """Test niche, bench, and fixture placement features"""
    
    def test_surface_has_niches_field(self):
        """Test that surfaces have niches field"""
        r = requests.get(f'{BASE_URL}/api/projects/{PROJECT_ID}/rooms/{ROOM_ID}/finish-schedules')
        assert r.status_code == 200
        schedules = r.json()
        
        schedule = schedules[0]
        surfaces = schedule.get('surfaces', [])
        
        # Check that niches field exists (may be empty or have items)
        for surface in surfaces:
            # niches should be a list or None
            niches = surface.get('niches')
            if niches is not None:
                assert isinstance(niches, list)
    
    def test_create_niche(self):
        """Test creating a niche via PUT"""
        r = requests.get(f'{BASE_URL}/api/projects/{PROJECT_ID}/rooms/{ROOM_ID}/finish-schedules')
        assert r.status_code == 200
        schedules = r.json()
        schedule = schedules[0]
        schedule_id = schedule.get('id')
        
        # Add a niche to first surface
        surfaces = schedule.get('surfaces', [])
        if surfaces:
            niche_id = str(uuid.uuid4())
            surfaces[0]['niches'] = [
                {'id': niche_id, 'zone_id': 'main_wall', 'x': 30, 'y': 20, 'w': 30, 'h': 25, 'material': None}
            ]
        
        r2 = requests.put(
            f'{BASE_URL}/api/projects/{PROJECT_ID}/finish-schedules/{schedule_id}',
            json={'surfaces': surfaces}
        )
        assert r2.status_code == 200
        
        # Verify niche was saved
        updated = r2.json()
        updated_surface = updated.get('surfaces', [])[0]
        niches = updated_surface.get('niches', [])
        assert len(niches) >= 1
        assert niches[0].get('x') == 30
        assert niches[0].get('y') == 20
    
    def test_create_bench(self):
        """Test creating a bench via PUT"""
        r = requests.get(f'{BASE_URL}/api/projects/{PROJECT_ID}/rooms/{ROOM_ID}/finish-schedules')
        assert r.status_code == 200
        schedules = r.json()
        schedule = schedules[0]
        schedule_id = schedule.get('id')
        
        # Add a bench to first surface
        surfaces = schedule.get('surfaces', [])
        if surfaces:
            bench_id = str(uuid.uuid4())
            surfaces[0]['benches'] = [
                {'id': bench_id, 'zone_id': 'wainscot', 'x': 10, 'y': 50, 'w': 40, 'h': 30, 'material': None}
            ]
        
        r2 = requests.put(
            f'{BASE_URL}/api/projects/{PROJECT_ID}/finish-schedules/{schedule_id}',
            json={'surfaces': surfaces}
        )
        assert r2.status_code == 200
        
        # Verify bench was saved
        updated = r2.json()
        updated_surface = updated.get('surfaces', [])[0]
        benches = updated_surface.get('benches', [])
        assert len(benches) >= 1
        assert benches[0].get('w') == 40
        assert benches[0].get('h') == 30
    
    def test_create_fixture(self):
        """Test creating a fixture via PUT"""
        r = requests.get(f'{BASE_URL}/api/projects/{PROJECT_ID}/rooms/{ROOM_ID}/finish-schedules')
        assert r.status_code == 200
        schedules = r.json()
        schedule = schedules[0]
        schedule_id = schedule.get('id')
        
        # Add a fixture to first surface
        surfaces = schedule.get('surfaces', [])
        if surfaces:
            fixture_id = str(uuid.uuid4())
            surfaces[0]['fixtures'] = [
                {'id': fixture_id, 'zone_id': 'main_wall', 'x': 70, 'y': 30, 'name': 'Shower Head', 'image': ''}
            ]
        
        r2 = requests.put(
            f'{BASE_URL}/api/projects/{PROJECT_ID}/finish-schedules/{schedule_id}',
            json={'surfaces': surfaces}
        )
        assert r2.status_code == 200
        
        # Verify fixture was saved
        updated = r2.json()
        updated_surface = updated.get('surfaces', [])[0]
        fixtures = updated_surface.get('fixtures', [])
        assert len(fixtures) >= 1
        assert fixtures[0].get('name') == 'Shower Head'


class TestTileMaterials:
    """Test tile material placement and pattern features"""
    
    def test_place_tile_material(self):
        """Test placing a tile material on a zone"""
        r = requests.get(f'{BASE_URL}/api/projects/{PROJECT_ID}/rooms/{ROOM_ID}/finish-schedules')
        assert r.status_code == 200
        schedules = r.json()
        schedule = schedules[0]
        schedule_id = schedule.get('id')
        
        # Add a material to first surface
        surfaces = schedule.get('surfaces', [])
        if surfaces:
            mat_id = str(uuid.uuid4())
            surfaces[0]['materials'] = [
                {
                    'id': mat_id,
                    'item_id': 'test-item-1',
                    'name': 'Test Tile',
                    'vendor': 'Test Vendor',
                    'image': 'https://example.com/tile.jpg',
                    'position_label': 'main_wall',
                    'pattern': 'offset',
                    'tile_crop': {'x': 100, 'y': 100, 'w': 200, 'h': 200},
                    'grout_color': '#333333',
                    'tile_orientation': 'horizontal'
                }
            ]
        
        r2 = requests.put(
            f'{BASE_URL}/api/projects/{PROJECT_ID}/finish-schedules/{schedule_id}',
            json={'surfaces': surfaces}
        )
        assert r2.status_code == 200
        
        # Verify material was saved
        updated = r2.json()
        updated_surface = updated.get('surfaces', [])[0]
        materials = updated_surface.get('materials', [])
        assert len(materials) >= 1
        
        mat = materials[0]
        assert mat.get('pattern') == 'offset'
        assert mat.get('grout_color') == '#333333'
        assert mat.get('tile_orientation') == 'horizontal'
        assert mat.get('tile_crop') is not None
    
    def test_all_9_patterns_supported(self):
        """Test that all 9 tile patterns are supported"""
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
        
        r = requests.get(f'{BASE_URL}/api/projects/{PROJECT_ID}/rooms/{ROOM_ID}/finish-schedules')
        assert r.status_code == 200
        schedules = r.json()
        schedule = schedules[0]
        schedule_id = schedule.get('id')
        
        # Test each pattern can be saved
        for pattern in patterns:
            surfaces = schedule.get('surfaces', [])
            if surfaces:
                surfaces[0]['materials'] = [
                    {
                        'id': str(uuid.uuid4()),
                        'name': f'Test {pattern}',
                        'position_label': 'main_wall',
                        'pattern': pattern,
                        'grout_color': '#4a4035',
                        'tile_orientation': 'horizontal'
                    }
                ]
            
            r2 = requests.put(
                f'{BASE_URL}/api/projects/{PROJECT_ID}/finish-schedules/{schedule_id}',
                json={'surfaces': surfaces}
            )
            assert r2.status_code == 200, f"Failed to save pattern: {pattern}"
            
            updated = r2.json()
            mat = updated.get('surfaces', [])[0].get('materials', [])[0]
            assert mat.get('pattern') == pattern, f"Pattern mismatch: expected {pattern}, got {mat.get('pattern')}"
    
    def test_grout_colors(self):
        """Test that grout colors can be saved"""
        grout_colors = ['#FFFFFF', '#D4D4D4', '#888888', '#4a4035', '#333333', '#111111']
        
        r = requests.get(f'{BASE_URL}/api/projects/{PROJECT_ID}/rooms/{ROOM_ID}/finish-schedules')
        assert r.status_code == 200
        schedules = r.json()
        schedule = schedules[0]
        schedule_id = schedule.get('id')
        
        for color in grout_colors:
            surfaces = schedule.get('surfaces', [])
            if surfaces:
                surfaces[0]['materials'] = [
                    {
                        'id': str(uuid.uuid4()),
                        'name': 'Test Tile',
                        'position_label': 'main_wall',
                        'pattern': 'offset',
                        'grout_color': color,
                        'tile_orientation': 'horizontal'
                    }
                ]
            
            r2 = requests.put(
                f'{BASE_URL}/api/projects/{PROJECT_ID}/finish-schedules/{schedule_id}',
                json={'surfaces': surfaces}
            )
            assert r2.status_code == 200
            
            updated = r2.json()
            mat = updated.get('surfaces', [])[0].get('materials', [])[0]
            assert mat.get('grout_color') == color
    
    def test_tile_orientation(self):
        """Test that tile orientation (horizontal/vertical) can be saved"""
        r = requests.get(f'{BASE_URL}/api/projects/{PROJECT_ID}/rooms/{ROOM_ID}/finish-schedules')
        assert r.status_code == 200
        schedules = r.json()
        schedule = schedules[0]
        schedule_id = schedule.get('id')
        
        for orientation in ['horizontal', 'vertical']:
            surfaces = schedule.get('surfaces', [])
            if surfaces:
                surfaces[0]['materials'] = [
                    {
                        'id': str(uuid.uuid4()),
                        'name': 'Test Tile',
                        'position_label': 'main_wall',
                        'pattern': 'offset',
                        'grout_color': '#4a4035',
                        'tile_orientation': orientation
                    }
                ]
            
            r2 = requests.put(
                f'{BASE_URL}/api/projects/{PROJECT_ID}/finish-schedules/{schedule_id}',
                json={'surfaces': surfaces}
            )
            assert r2.status_code == 200
            
            updated = r2.json()
            mat = updated.get('surfaces', [])[0].get('materials', [])[0]
            assert mat.get('tile_orientation') == orientation


class TestCeilingFloor:
    """Test ceiling and floor surface features"""
    
    def test_ceiling_surface_exists(self):
        """Test that ceiling surface type is supported"""
        r = requests.get(f'{BASE_URL}/api/projects/{PROJECT_ID}/rooms/{ROOM_ID}/finish-schedules')
        assert r.status_code == 200
        schedules = r.json()
        
        # Check if any schedule has ceiling surface
        for schedule in schedules:
            surfaces = schedule.get('surfaces', [])
            ceiling = next((s for s in surfaces if s.get('surface_type') == 'ceiling'), None)
            if ceiling:
                assert ceiling.get('name') is not None
                return
        
        # If no ceiling found, create one
        schedule = schedules[0]
        schedule_id = schedule.get('id')
        surfaces = schedule.get('surfaces', [])
        surfaces.append({
            'id': str(uuid.uuid4()),
            'name': 'Ceiling',
            'surface_type': 'ceiling',
            'materials': []
        })
        
        r2 = requests.put(
            f'{BASE_URL}/api/projects/{PROJECT_ID}/finish-schedules/{schedule_id}',
            json={'surfaces': surfaces}
        )
        assert r2.status_code == 200
    
    def test_floor_surface_exists(self):
        """Test that floor surface type is supported"""
        r = requests.get(f'{BASE_URL}/api/projects/{PROJECT_ID}/rooms/{ROOM_ID}/finish-schedules')
        assert r.status_code == 200
        schedules = r.json()
        
        # Check if any schedule has floor surface
        for schedule in schedules:
            surfaces = schedule.get('surfaces', [])
            floor = next((s for s in surfaces if s.get('surface_type') == 'floor'), None)
            if floor:
                assert floor.get('name') is not None
                return
        
        # If no floor found, create one
        schedule = schedules[0]
        schedule_id = schedule.get('id')
        surfaces = schedule.get('surfaces', [])
        surfaces.append({
            'id': str(uuid.uuid4()),
            'name': 'Floor',
            'surface_type': 'floor',
            'materials': []
        })
        
        r2 = requests.put(
            f'{BASE_URL}/api/projects/{PROJECT_ID}/finish-schedules/{schedule_id}',
            json={'surfaces': surfaces}
        )
        assert r2.status_code == 200


class TestProxyImage:
    """Test proxy image endpoint for CORS bypass"""
    
    def test_proxy_image_endpoint(self):
        """Test /api/proxy-image endpoint"""
        test_url = 'https://static.prod-images.emergentagent.com/jobs/7932d827-12dd-45f6-923f-dedc2d66add5/images/1ac7f6ff8285b0790a13035bff206ee25bc5a88f0c649fd5ac5f6eafd371cc04.png'
        r = requests.get(f'{BASE_URL}/api/proxy-image', params={'url': test_url})
        # Should return image or redirect
        assert r.status_code in [200, 302, 307]


if __name__ == '__main__':
    pytest.main([__file__, '-v', '--tb=short'])

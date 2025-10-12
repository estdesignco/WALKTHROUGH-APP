import React, { useState, useEffect } from 'react';
import { Button, Rows, Text, Title, LoadingIndicator, Box, Columns, FormField, TextInput } from '@canva/app-ui-kit';
import { ChecklistPanel } from './components/ChecklistPanel';
import { DesignMonitor } from './components/DesignMonitor';
import './App.css';

interface Project {
  id: string;
  name: string;
  client_name?: string;
  project_data?: {
    walkthrough?: any;
    checklist?: any;
    ffe?: any;
  };
}

interface Room {
  id: string;
  name: string;
  color: string;
  categories: Category[];
  collapsed?: boolean;
}

interface Category {
  id: string;
  name: string;
  items: ChecklistItem[];
}

interface ChecklistItem {
  id: string;
  name: string;
  link?: string;
  image_url?: string;
  price?: string;
  status?: string;
  checked?: boolean;
  size?: string;
  color?: string;
  sku?: string;
}

const BACKEND_URL = 'https://designflow-master.preview.emergentagent.com';

export const App = () => {
  const [projectId, setProjectId] = useState<string>('');
  const [project, setProject] = useState<Project | null>(null);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    console.log('🎨 Canva Live Checklist App Initialized');
    
    // Try to get project ID from URL params or localStorage
    const urlParams = new URLSearchParams(window.location.search);
    const urlProjectId = urlParams.get('projectId');
    const storedProjectId = localStorage.getItem('canva_project_id');
    
    if (urlProjectId) {
      console.log('📋 Project ID from URL:', urlProjectId);
      setProjectId(urlProjectId);
      localStorage.setItem('canva_project_id', urlProjectId);
      loadProject(urlProjectId);
    } else if (storedProjectId) {
      console.log('📋 Project ID from localStorage:', storedProjectId);
      setProjectId(storedProjectId);
      loadProject(storedProjectId);
    } else {
      console.log('❌ No project ID found');
    }
  }, []);

  const loadProject = async (id: string) => {
    console.log('🔄 Loading project:', id);
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${BACKEND_URL}/api/projects/${id}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        }
      });
      
      console.log('📡 Response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`Failed to load project: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('✅ Project loaded:', data);
      
      setProject(data);
      
      // Transform project data to rooms format for checklist
      const transformedRooms = transformProjectToRooms(data);
      console.log('🏠 Transformed rooms:', transformedRooms);
      setRooms(transformedRooms);
      
      setConnected(true);
    } catch (err) {
      console.error('❌ Error loading project:', err);
      setError(err instanceof Error ? err.message : 'Failed to load project');
      setConnected(false);
    } finally {
      setLoading(false);
    }
  };

  const transformProjectToRooms = (projectData: Project): Room[] => {
    const rooms: Room[] = [];
    
    // Get checklist data from project
    const checklistData = projectData.project_data?.checklist || {};
    
    // Transform each room
    Object.entries(checklistData).forEach(([roomName, roomData]: [string, any]) => {
      const room: Room = {
        id: roomData.id || `room_${roomName}`,
        name: roomName,
        color: roomData.color || '#D4A574',
        categories: [],
        collapsed: false
      };
      
      // Transform categories
      if (roomData.categories && Array.isArray(roomData.categories)) {
        room.categories = roomData.categories.map((cat: any) => ({
          id: cat.id || `cat_${cat.name}`,
          name: cat.name,
          items: (cat.items || []).map((item: any) => ({
            id: item.id || `item_${item.name}`,
            name: item.name || item.product_name || 'Unnamed Item',
            link: item.link || item.product_link || '',
            image_url: item.image_url || item.image || '',
            price: item.price || item.cost || '',
            status: item.status || '',
            checked: item.checked || false,
            size: item.size || '',
            color: item.color || '',
            sku: item.sku || ''
          }))
        }));
      }
      
      // Only add rooms that have items
      if (room.categories.length > 0 && room.categories.some(cat => cat.items.length > 0)) {
        rooms.push(room);
      }
    });
    
    console.log(`📊 Transformed ${rooms.length} rooms with items`);
    return rooms;
  };

  const handleProjectIdSubmit = () => {
    const trimmedId = projectId.trim();
    console.log('🔗 Connecting to project:', trimmedId);
    
    if (trimmedId) {
      localStorage.setItem('canva_project_id', trimmedId);
      loadProject(trimmedId);
    }
  };

  const handleItemCheck = async (roomId: string, categoryId: string, itemId: string, checked: boolean) => {
    console.log('✅ Toggling item:', { roomId, categoryId, itemId, checked });
    
    try {
      // Update item in backend
      const response = await fetch(`${BACKEND_URL}/api/items/${itemId}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ checked })
      });
      
      if (!response.ok) {
        console.error('❌ Failed to update item:', response.status);
      }
      
      // Update local state
      setRooms(prevRooms => {
        const newRooms = [...prevRooms];
        const room = newRooms.find(r => r.id === roomId);
        if (room) {
          const category = room.categories.find(c => c.id === categoryId);
          if (category) {
            const item = category.items.find(i => i.id === itemId);
            if (item) {
              item.checked = checked;
            }
          }
        }
        return newRooms;
      });
    } catch (err) {
      console.error('❌ Error updating item:', err);
    }
  };

  const handleStatusChange = async (roomId: string, categoryId: string, itemId: string, status: string) => {
    console.log('📊 Changing status:', { roomId, categoryId, itemId, status });
    
    try {
      const response = await fetch(`${BACKEND_URL}/api/items/${itemId}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ status })
      });
      
      if (!response.ok) {
        console.error('❌ Failed to update status:', response.status);
      }
      
      // Update local state
      setRooms(prevRooms => {
        const newRooms = [...prevRooms];
        const room = newRooms.find(r => r.id === roomId);
        if (room) {
          const category = room.categories.find(c => c.id === categoryId);
          if (category) {
            const item = category.items.find(i => i.id === itemId);
            if (item) {
              item.status = status;
            }
          }
        }
        return newRooms;
      });
    } catch (err) {
      console.error('❌ Error updating status:', err);
    }
  };

  const handleRoomToggle = (roomId: string) => {
    setRooms(prevRooms => 
      prevRooms.map(room => 
        room.id === roomId 
          ? { ...room, collapsed: !room.collapsed }
          : room
      )
    );
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px', gap: '16px' }}>
        <LoadingIndicator size="large" />
        <Text tone="tertiary">Loading checklist...</Text>
      </div>
    );
  }

  if (!connected || !project) {
    return (
      <div style={{ padding: '24px' }}>
        <Rows spacing="3u">
          <Title size="medium">🎨 Live Checklist</Title>
          
          {error && (
            <div style={{ 
              backgroundColor: '#FEE2E2', 
              border: '1px solid #EF4444',
              borderRadius: '8px', 
              padding: '16px' 
            }}>
              <Text tone="critical">⚠️ {error}</Text>
            </div>
          )}
          
          <Text>Enter your Project ID to connect:</Text>
          
          <FormField
            label="Project ID"
            value={projectId}
            control={(props) => (
              <TextInput
                {...props}
                onChange={(value) => setProjectId(value)}
                placeholder="e.g., abc-123-def"
              />
            )}
          />
          
          <Button 
            variant="primary" 
            onClick={handleProjectIdSubmit}
            disabled={!projectId.trim()}
          >
            Connect to Project
          </Button>
          
          <div style={{ 
            backgroundColor: '#F3F4F6', 
            borderRadius: '8px', 
            padding: '16px',
            borderLeft: '4px solid #D4A574'
          }}>
            <Text tone="tertiary">
              💡 <strong>Tip:</strong> Find your Project ID in the main app's URL or project settings.
            </Text>
          </div>
        </Rows>
      </div>
    );
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Rows spacing="0">
        {/* Header */}
        <div style={{ 
          backgroundColor: '#D4A574', 
          padding: '20px 24px',
          borderBottom: '2px solid #C19663'
        }}>
          <Columns spacing="2u" alignY="center">
            <div style={{ flex: 1 }}>
              <Title size="small">
                {project.name || project.client_name || 'Live Checklist'}
              </Title>
            </div>
            <Button 
              variant="secondary" 
              onClick={() => loadProject(projectId)}
              icon={() => <span>🔄</span>}
            >
              Refresh
            </Button>
          </Columns>
        </div>

        {/* Design Monitor - Auto-detect products in Canva */}
        <DesignMonitor 
          projectId={projectId} 
          onItemDetected={(item) => {
            console.log('🎯 Item detected in Canva design:', item);
            // TODO: Auto-add logic
          }} 
        />

        {/* Checklist Panel */}
        {rooms.length > 0 ? (
          <ChecklistPanel 
            rooms={rooms}
            onItemCheck={handleItemCheck}
            onStatusChange={handleStatusChange}
            onRoomToggle={handleRoomToggle}
          />
        ) : (
          <div style={{ padding: '48px', textAlign: 'center' }}>
            <Text tone="tertiary">
              📋 No checklist items found for this project.
            </Text>
          </div>
        )}
      </Rows>
    </div>
  );
};
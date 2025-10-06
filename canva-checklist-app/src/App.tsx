import React, { useState, useEffect } from 'react';
import { Button, Rows, Text, Title, LoadingIndicator, Box, Columns } from '@canva/app-ui-kit';
import { ChecklistPanel } from './components/ChecklistPanel';
import { DesignMonitor } from './components/DesignMonitor';
import './App.css';

interface Project {
  id: string;
  name: string;
  rooms: Room[];
}

interface Room {
  id: string;
  name: string;
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
  link: string;
  image_url?: string;
  price?: string;
  status?: string;
  checked?: boolean;
}

const BACKEND_URL = 'https://designtool-mobile.preview.emergentagent.com';

export const App: React.FC = () => {
  const [projectId, setProjectId] = useState<string>('');
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    // Try to get project ID from URL params or localStorage
    const urlParams = new URLSearchParams(window.location.search);
    const urlProjectId = urlParams.get('projectId');
    const storedProjectId = localStorage.getItem('canva_project_id');
    
    if (urlProjectId) {
      setProjectId(urlProjectId);
      localStorage.setItem('canva_project_id', urlProjectId);
      loadProject(urlProjectId);
    } else if (storedProjectId) {
      setProjectId(storedProjectId);
      loadProject(storedProjectId);
    }
  }, []);

  const loadProject = async (id: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${BACKEND_URL}/api/projects/${id}?sheet_type=checklist`);
      
      if (!response.ok) {
        throw new Error('Failed to load project');
      }
      
      const data = await response.json();
      setProject(data);
      setConnected(true);
    } catch (err) {
      console.error('Error loading project:', err);
      setError(err instanceof Error ? err.message : 'Failed to load project');
      setConnected(false);
    } finally {
      setLoading(false);
    }
  };

  const handleProjectIdSubmit = () => {
    if (projectId.trim()) {
      localStorage.setItem('canva_project_id', projectId.trim());
      loadProject(projectId.trim());
    }
  };

  const handleItemCheck = async (roomId: string, categoryId: string, itemId: string, checked: boolean) => {
    try {
      // Update item in backend
      await fetch(`${BACKEND_URL}/api/items/${itemId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ checked })
      });
      
      // Update local state
      if (project) {
        const updatedProject = { ...project };
        const room = updatedProject.rooms.find(r => r.id === roomId);
        if (room) {
          const category = room.categories.find(c => c.id === categoryId);
          if (category) {
            const item = category.items.find(i => i.id === itemId);
            if (item) {
              item.checked = checked;
              setProject(updatedProject);
            }
          }
        }
      }
    } catch (err) {
      console.error('Error updating item:', err);
    }
  };

  const handleStatusChange = async (roomId: string, categoryId: string, itemId: string, status: string) => {
    try {
      await fetch(`${BACKEND_URL}/api/items/${itemId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      
      // Update local state
      if (project) {
        const updatedProject = { ...project };
        const room = updatedProject.rooms.find(r => r.id === roomId);
        if (room) {
          const category = room.categories.find(c => c.id === categoryId);
          if (category) {
            const item = category.items.find(i => i.id === itemId);
            if (item) {
              item.status = status;
              setProject(updatedProject);
            }
          }
        }
      }
    } catch (err) {
      console.error('Error updating status:', err);
    }
  };

  if (loading) {
    return (
      <Box padding="3u" display="flex" alignItems="center" justifyContent="center">
        <LoadingIndicator size="large" />
        <Text>Loading checklist...</Text>
      </Box>
    );
  }

  if (!connected || !project) {
    return (
      <Box padding="3u">
        <Rows spacing="2u">
          <Title size="medium">Live Checklist</Title>
          
          {error && (
            <Box background="critical" padding="1u" borderRadius="standard">
              <Text tone="critical">{error}</Text>
            </Box>
          )}
          
          <Text>Enter your Project ID to connect:</Text>
          
          <input
            type="text"
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
            placeholder="Project ID"
            style={{
              padding: '8px',
              border: '1px solid #ccc',
              borderRadius: '4px',
              width: '100%'
            }}
          />
          
          <Button variant="primary" onClick={handleProjectIdSubmit}>
            Connect to Project
          </Button>
          
          <Box background="neutral" padding="1u" borderRadius="standard">
            <Text size="small">
              💡 Tip: Get your Project ID from the main app URL
            </Text>
          </Box>
        </Rows>
      </Box>
    );
  }

  return (
    <Box className="app-container">
      <Rows spacing="1u">
        {/* Header */}
        <Box padding="2u" style={{ backgroundColor: '#D4A574' }}>
          <Columns spacing="1u" alignY="center">
            <Title size="medium">{project.name}</Title>
            <Button variant="tertiary" onClick={() => loadProject(projectId)}>
              🔄 Refresh
            </Button>
          </Columns>
        </Box>

        {/* Design Monitor */}
        <DesignMonitor projectId={projectId} onItemDetected={(item) => {
          console.log('Item detected in design:', item);
          // Auto-add logic will go here
        }} />

        {/* Checklist Panel */}
        <ChecklistPanel 
          project={project}
          onItemCheck={handleItemCheck}
          onStatusChange={handleStatusChange}
        />
      </Rows>
    </Box>
  );
};
import { Button, Rows, Title, LoadingIndicator } from "@canva/app-ui-kit";
import { requestOpenExternalUrl } from "@canva/platform";
import * as React from "react";
import * as styles from "styles/components.css";

const BACKEND_URL = "https://designflow-master.preview.emergentagent.com";

const STATUS_OPTIONS = ['PICKED','ORDER SAMPLES','SAMPLES ARRIVED','ASK NEIL','ASK CHARLENE','ASK JALA','GET QUOTE','WAITING ON QT','READY FOR PRESENTATION'];

const getStatusColor = (status: string) => {
  const colors: Record<string, string> = {
    'PICKED': '#3B82F6', 'ORDER SAMPLES': '#D4A574', 'SAMPLES ARRIVED': '#9ACD32',
    'ASK NEIL': '#DAA520', 'ASK CHARLENE': '#B8860B', 'ASK JALA': '#8B7355',
    'GET QUOTE': '#7A5A8A', 'WAITING ON QT': '#5A7A5A', 'READY FOR PRESENTATION': '#006400'
  };
  return colors[status] || '#1E293B';
};

export const App = () => {
  // PERSISTENT STATE - Load from localStorage on mount
  const [projectId, setProjectId] = React.useState(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const urlProjectId = urlParams.get('projectId');
    if (urlProjectId) return urlProjectId;
    return localStorage.getItem('canva_project_id') || "";
  });
  
  const [roomId, setRoomId] = React.useState(() => {
    return localStorage.getItem('canva_room_id') || "";
  });
  
  const [project, setProject] = React.useState<any>(() => {
    const saved = localStorage.getItem('canva_project_data');
    return saved ? JSON.parse(saved) : null;
  });
  
  const [selectedRoom, setSelectedRoom] = React.useState<any>(() => {
    const saved = localStorage.getItem('canva_selected_room');
    return saved ? JSON.parse(saved) : null;
  });
  
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [collapsedCats, setCollapsedCats] = React.useState<Set<string>>(new Set());
  const [lastSync, setLastSync] = React.useState(new Date());
  const [lastSyncTimestamp, setLastSyncTimestamp] = React.useState<number>(Date.now() / 1000);
  const [isSyncing, setIsSyncing] = React.useState(false);
  const [syncStatus, setSyncStatus] = React.useState<'synced' | 'syncing' | 'error'>('synced');

  // PERSIST TO LOCALSTORAGE whenever project data changes
  React.useEffect(() => {
    if (projectId) {
      localStorage.setItem('canva_project_id', projectId);
    }
  }, [projectId]);

  React.useEffect(() => {
    if (project) {
      localStorage.setItem('canva_project_data', JSON.stringify(project));
    }
  }, [project]);

  React.useEffect(() => {
    if (selectedRoom) {
      localStorage.setItem('canva_selected_room', JSON.stringify(selectedRoom));
      localStorage.setItem('canva_room_id', selectedRoom.id);
    }
  }, [selectedRoom]);

  // FETCH PROJECTS LIST on mount
  const [projects, setProjects] = React.useState<any[]>([]);
  const [fetchError, setFetchError] = React.useState<string | null>(null);
  const [debugInfo, setDebugInfo] = React.useState<string>('');
  
  React.useEffect(() => {
    // First, try to fetch projects list to test connectivity
    const testConnection = async () => {
      try {
        console.log('🔌 Testing backend connection:', BACKEND_URL);
        setDebugInfo('Attempting fetch to: ' + BACKEND_URL + '/api/projects');
        
        const res = await fetch(`${BACKEND_URL}/api/projects`, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          },
          mode: 'cors', // Explicitly set CORS mode
        });
        
        console.log('Response status:', res.status);
        setDebugInfo(`Response received: ${res.status} ${res.statusText}`);
        
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        }
        
        const data = await res.json();
        console.log('✅ Backend connected! Projects:', data.length);
        setProjects(data);
        setFetchError(null);
        setDebugInfo(`✅ Success! Found ${data.length} projects`);
        
        // Auto-load project if we have a saved ID
        if (projectId && !project && !loading) {
          console.log('🔄 Auto-loading saved project:', projectId);
          loadProject(projectId, roomId || undefined);
        }
      } catch (e: any) {
        console.error('❌ Backend connection failed:', e);
        const errorMsg = e.message || 'Failed to connect to backend';
        const errorType = e.name || 'Unknown error';
        setFetchError(`${errorType}: ${errorMsg}`);
        setDebugInfo(`Error: ${errorType} - ${errorMsg}\n\nThis might be a CORS or CSP issue.`);
      }
    };
    
    testConnection();
  }, []); // Only run on mount

  // BIDIRECTIONAL SYNC - Fetch only changed items every 5 seconds
  React.useEffect(() => {
    if (!project || !selectedRoom) return;
    
    const syncChanges = async () => {
      try {
        setIsSyncing(true);
        setSyncStatus('syncing');
        
        // Fetch only items changed since last sync
        const res = await fetch(
          `${BACKEND_URL}/api/projects/${projectId}/changes?since=${lastSyncTimestamp}`
        );
        
        if (!res.ok) throw new Error('Sync failed');
        
        const data = await res.json();
        
        // If there are changes, apply them to the current state
        if (data.change_count > 0) {
          console.log(`🔄 Syncing ${data.change_count} changes...`);
          
          // Reload project to get fresh data
          const projectRes = await fetch(`${BACKEND_URL}/api/projects/${projectId}?sheet_type=checklist`);
          if (projectRes.ok) {
            const projectData = await projectRes.json();
            setProject(projectData);
            
            // Update selected room
            const room = projectData.rooms?.find((r: any) => r.id === selectedRoom.id);
            if (room) setSelectedRoom(room);
            
            console.log(`✅ Applied ${data.change_count} changes`);
          }
        }
        
        // Update sync timestamp
        setLastSyncTimestamp(data.timestamp);
        setLastSync(new Date());
        setSyncStatus('synced');
        
      } catch (e) {
        console.error('Sync error:', e);
        setSyncStatus('error');
      } finally {
        setIsSyncing(false);
      }
    };
    
    // Initial sync
    syncChanges();
    
    // Set up interval for continuous sync
    const interval = setInterval(syncChanges, 5000);
    
    return () => clearInterval(interval);
  }, [project, projectId, selectedRoom]);

  // REMOVED - Now handled in state initialization above

  const loadProject = async (targetProjectId: string, targetRoomId?: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${BACKEND_URL}/api/projects/${targetProjectId}?sheet_type=checklist`);
      if (!res.ok) throw new Error('Failed to load project');
      const data = await res.json();
      setProject(data);

      if (targetRoomId) {
        const room = data.rooms?.find((r: any) => r.id === targetRoomId);
        if (room) {
          setSelectedRoom(room);
          console.log('✅ Loaded room:', room.name);
        }
      }
    } catch (e: any) {
      setError(e.message);
      console.error('Load error:', e);
    } finally {
      setLoading(false);
    }
  };

  const selectRoom = (room: any) => {
    setSelectedRoom(room);
    setRoomId(room.id);
    localStorage.setItem('canva_saved_roomId', room.id);
    console.log('Selected room:', room.name);
  };

  const toggleCategory = (catId: string) => {
    const newSet = new Set(collapsedCats);
    if (newSet.has(catId)) {
      newSet.delete(catId);
    } else {
      newSet.add(catId);
    }
    setCollapsedCats(newSet);
  };

  const updateStatus = async (itemId: string, status: string) => {
    try {
      setSyncStatus('syncing');
      
      // Use quick-update endpoint for instant sync
      const res = await fetch(`${BACKEND_URL}/api/items/${itemId}/quick-update`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      
      if (!res.ok) throw new Error('Update failed');
      
      // Immediately refresh to show the change
      const projectRes = await fetch(`${BACKEND_URL}/api/projects/${projectId}?sheet_type=checklist`);
      if (projectRes.ok) {
        const projectData = await projectRes.json();
        setProject(projectData);
        
        const room = projectData.rooms?.find((r: any) => r.id === selectedRoom.id);
        if (room) setSelectedRoom(room);
      }
      
      setSyncStatus('synced');
      console.log('✅ Status updated and synced');
      
    } catch (e) {
      console.error('Update failed:', e);
      setSyncStatus('error');
    }
  };

  const openLink = (url: string) => {
    if (url) {
      requestOpenExternalUrl({ url });
    }
  };

  // LOADING STATE
  if (loading) {
    return (
      <div style={{
        background: 'linear-gradient(135deg, #000000 0%, #1e293b 50%, #000000 100%)',
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center"
      }}>
        <LoadingIndicator size="large" />
      </div>
    );
  }

  // NO PROJECT LOADED - Show project selector
  if (!project) {
    return (
      <div style={{
        background: 'linear-gradient(135deg, #000000 0%, #0f172a 30%, #1e293b 70%, #000000 100%)',
        minHeight: "100vh",
        padding: "24px"
      }}>
        <Rows spacing="3u">
          <div style={{ textAlign: "center", padding: "40px 20px" }}>
            <Title size="large">🎨 Canva Live Checklist</Title>
          </div>
          
          {/* CONNECTION STATUS */}
          {fetchError ? (
            <div style={{
              background: "rgba(220, 38, 38, 0.1)",
              padding: "30px",
              borderRadius: "16px",
              border: "2px solid #DC2626",
              textAlign: "center"
            }}>
              <div style={{ color: "#EF4444", fontSize: "18px", fontWeight: "bold", marginBottom: "16px" }}>
                ❌ Connection Failed
              </div>
              <div style={{ color: "#FCA5A5", fontSize: "14px", marginBottom: "12px" }}>
                {fetchError}
              </div>
              <div style={{ color: "#FCA5A5", fontSize: "12px", marginTop: "16px", whiteSpace: 'pre-wrap' }}>
                Backend: {BACKEND_URL}
                {debugInfo && `\n\n${debugInfo}`}
              </div>
              <Button
                variant="primary"
                onClick={() => window.location.reload()}
                stretch
                style={{ marginTop: "20px" }}
              >
                🔄 Retry Connection
              </Button>
            </div>
          ) : projects.length === 0 ? (
            <div style={{
              background: "rgba(30, 41, 59, 0.9)",
              padding: "30px",
              borderRadius: "16px",
              border: "2px solid #D4A574",
              textAlign: "center"
            }}>
              <LoadingIndicator size="large" />
              <div style={{ color: "#D4A574", fontSize: "16px", marginTop: "20px" }}>
                Connecting to backend...
              </div>
            </div>
          ) : (
            <div style={{
              background: "rgba(30, 41, 59, 0.9)",
              padding: "30px",
              borderRadius: "16px",
              border: "2px solid #D4A574"
            }}>
              <div style={{ color: "#D4A574", fontSize: "18px", fontWeight: "bold", marginBottom: "20px", textAlign: "center" }}>
                ✅ Connected! Select a project:
              </div>
              {projects.map((proj: any) => (
                <div
                  key={proj.id}
                  onClick={() => {
                    setProjectId(proj.id);
                    loadProject(proj.id);
                  }}
                  style={{
                    background: "#1e293b",
                    padding: "16px",
                    marginBottom: "12px",
                    borderRadius: "8px",
                    cursor: "pointer",
                    border: "2px solid #D4A574",
                    transition: "transform 0.2s"
                  }}
                  onMouseEnter={(e: any) => e.currentTarget.style.transform = "scale(1.02)"}
                  onMouseLeave={(e: any) => e.currentTarget.style.transform = "scale(1)"}
                >
                  <div style={{ color: "#D4A574", fontSize: "16px", fontWeight: "bold" }}>
                    {proj.name}
                  </div>
                  <div style={{ color: "#B49B7E", fontSize: "12px", marginTop: "4px" }}>
                    {proj.rooms?.length || 0} rooms
                  </div>
                </div>
              ))}
            </div>
          )}
        </Rows>
      </div>
    );
  }

  // ROOM SELECTION
  if (!selectedRoom) {
    const rooms = project.rooms || [];
    
    return (
      <div style={{
        background: 'linear-gradient(135deg, #000000 0%, #0f172a 30%, #1e293b 70%, #000000 100%)',
        minHeight: "100vh",
        padding: "24px"
      }}>
        <Rows spacing="2u">
          <div style={{ textAlign: "center", padding: "20px 0" }}>
            <Title size="large">{project.name || "Select Room"}</Title>
          </div>

          <div style={{ textAlign: "center", color: "#B49B7E", fontSize: "16px" }}>
            Select a room to view its live checklist:
          </div>

          {rooms.map((room: any) => (
            <div
              key={room.id}
              onClick={() => selectRoom(room)}
              style={{
                background: room.color || "#D4A574",
                color: "#FFFFFF",
                padding: "20px",
                borderRadius: "12px",
                cursor: "pointer",
                textAlign: "center",
                fontWeight: "bold",
                fontSize: "18px",
                border: "3px solid #B49B7E",
                transition: "transform 0.2s",
                textShadow: "2px 2px 4px rgba(0,0,0,0.8)"
              }}
              onMouseEnter={(e: any) => e.currentTarget.style.transform = "scale(1.05)"}
              onMouseLeave={(e: any) => e.currentTarget.style.transform = "scale(1)"}
            >
              {room.name}
            </div>
          ))}

          <Button
            variant="secondary"
            onClick={() => {
              // Clear all saved data
              localStorage.removeItem('canva_project_id');
              localStorage.removeItem('canva_room_id');
              localStorage.removeItem('canva_project_data');
              localStorage.removeItem('canva_selected_room');
              setProject(null);
              setSelectedRoom(null);
              setProjectId('');
              setRoomId('');
              console.log('✅ Project cleared - ready for new project');
            }}
            stretch
          >
            🔄 Change Project
          </Button>
        </Rows>
      </div>
    );
  }

  // MAIN CHECKLIST VIEW
  return (
    <div style={{
      background: 'linear-gradient(135deg, #000000 0%, #0f172a 30%, #1e293b 70%, #000000 100%)',
      minHeight: "100vh",
      padding: "20px"
    }}>
      <Rows spacing="2u">
        {/* HEADER WITH SYNC STATUS */}
        <div style={{
          background: "rgba(30, 41, 59, 0.9)",
          padding: "16px 20px",
          borderBottom: "2px solid #B49B7E",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "12px"
        }}>
          <div>
            <div style={{ color: "#D4A574", fontSize: "20px", fontWeight: "bold" }}>
              📋 {selectedRoom.name}
            </div>
            <div style={{ 
              color: "#B49B7E", 
              fontSize: "12px", 
              marginTop: "4px",
              display: "flex",
              alignItems: "center",
              gap: "8px"
            }}>
              {/* Sync Status Indicator */}
              <span style={{
                display: "inline-block",
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                backgroundColor: syncStatus === 'synced' ? '#9ACD32' : 
                                syncStatus === 'syncing' ? '#FFA500' : '#ff6b6b',
                animation: syncStatus === 'syncing' ? 'pulse 1.5s infinite' : 'none'
              }} />
              <span>
                {syncStatus === 'synced' && `✅ Synced ${lastSync.toLocaleTimeString()}`}
                {syncStatus === 'syncing' && '🔄 Syncing...'}
                {syncStatus === 'error' && '❌ Sync error'}
              </span>
              <span style={{ color: "#8B7355" }}>• Auto-sync every 5s</span>
            </div>
          </div>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            <Button variant="secondary" onClick={() => setSelectedRoom(null)}>
              ← Change Room
            </Button>
            <Button 
              variant="secondary" 
              onClick={() => loadProject(projectId, selectedRoom?.id)}
              disabled={isSyncing}
            >
              🔄 Refresh Now
            </Button>
          </div>
        </div>
        
        {/* Add CSS animation for pulse effect */}
        <style>{`
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.3; }
          }
        `}</style>

        {/* CATEGORIES AND ITEMS */}
        {(selectedRoom.categories || []).map((category: any) => {
          const isCollapsed = collapsedCats.has(category.id);
          
          return (
            <div key={category.id}>
              {/* CATEGORY HEADER */}
              <div
                onClick={() => toggleCategory(category.id)}
                style={{
                  background: category.color || "#D4A574",
                  color: "#FFFFFF",
                  padding: "12px 20px",
                  fontWeight: "bold",
                  fontSize: "16px",
                  cursor: "pointer",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  borderRadius: "8px",
                  textShadow: "2px 2px 4px rgba(0,0,0,0.8)"
                }}
              >
                <span>{category.name}</span>
                <span>{isCollapsed ? '▼' : '▲'}</span>
              </div>

              {/* ITEMS */}
              {!isCollapsed && (category.subcategories || []).map((subcat: any) => (
                <div key={subcat.id}>
                  {(subcat.items || []).map((item: any) => (
                    <div
                      key={item.id}
                      style={{
                        background: "rgba(15, 23, 42, 0.9)",
                        padding: "12px",
                        marginTop: "8px",
                        borderRadius: "8px",
                        border: "1px solid rgba(212, 165, 116, 0.3)"
                      }}
                    >
                      <div style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
                        {/* IMAGE */}
                        {item.image && (
                          <img
                            src={item.image}
                            alt={item.name}
                            style={{
                              width: "80px",
                              height: "80px",
                              objectFit: "cover",
                              borderRadius: "6px",
                              border: "2px solid #D4A574",
                              cursor: "pointer"
                            }}
                            onClick={() => openLink(item.link)}
                          />
                        )}

                        {/* ITEM INFO */}
                        <div style={{ flex: 1 }}>
                          <div
                            onClick={() => openLink(item.link)}
                            style={{
                              color: "#D4A574",
                              fontSize: "14px",
                              fontWeight: "bold",
                              marginBottom: "4px",
                              cursor: "pointer",
                              textDecoration: "underline"
                            }}
                          >
                            {item.name}
                          </div>
                          <div style={{ color: "#B49B7E", fontSize: "12px", marginBottom: "8px" }}>
                            {item.price && <span>💰 {item.price}</span>}
                            {item.sku && <span style={{ marginLeft: "12px" }}>🏷️ {item.sku}</span>}
                          </div>

                          {/* STATUS DROPDOWN */}
                          <select
                            value={item.status || ''}
                            onChange={(e: any) => updateStatus(item.id, e.target.value)}
                            style={{
                              background: getStatusColor(item.status || ''),
                              color: "#FFFFFF",
                              padding: "6px 10px",
                              border: "none",
                              borderRadius: "6px",
                              fontSize: "12px",
                              fontWeight: "bold",
                              cursor: "pointer"
                            }}
                          >
                            <option value="">-- Select Status --</option>
                            {STATUS_OPTIONS.map(opt => (
                              <option key={opt} value={opt}>{opt}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          );
        })}

        {/* INFO FOOTER */}
        <div style={{
          background: "rgba(154, 205, 50, 0.1)",
          padding: "16px",
          borderRadius: "8px",
          border: "1px solid rgba(154, 205, 50, 0.3)",
          textAlign: "center"
        }}>
          <div style={{ color: "#9ACD32", fontSize: "13px" }}>
            💡 <strong>Live Checklist:</strong> This updates automatically every 5 seconds. Add items in your main app and watch them appear here!
          </div>
        </div>
      </Rows>
    </div>
  );
};
import { Button, Rows, Title, LoadingIndicator } from "@canva/app-ui-kit";
import { requestOpenExternalUrl } from "@canva/platform";
import * as React from "react";
import * as styles from "styles/components.css";

const BACKEND_URL = "https://designhub-74.preview.emergentagent.com";

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
  const [projectId, setProjectId] = React.useState("");
  const [roomId, setRoomId] = React.useState("");
  const [project, setProject] = React.useState<any>(null);
  const [selectedRoom, setSelectedRoom] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [collapsedCats, setCollapsedCats] = React.useState<Set<string>>(new Set());
  const [lastSync, setLastSync] = React.useState(new Date());

  // AUTO-REFRESH every 5 seconds
  React.useEffect(() => {
    if (!project || !selectedRoom) return;
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/api/projects/${projectId}?sheet_type=checklist`);
        if (res.ok) {
          const data = await res.json();
          setProject(data);
          const room = data.rooms?.find((r: any) => r.id === selectedRoom.id);
          if (room) setSelectedRoom(room);
          setLastSync(new Date());
          console.log('✅ Synced at', new Date().toLocaleTimeString());
        }
      } catch (e) {
        console.log('Sync error:', e);
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [project, projectId, selectedRoom]);

  // Check URL params or localStorage on mount
  React.useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const urlProjectId = urlParams.get('projectId');
    const urlRoomId = urlParams.get('roomId');

    const savedProjectId = localStorage.getItem('canva_saved_projectId');
    const savedRoomId = localStorage.getItem('canva_saved_roomId');

    const finalProjectId = urlProjectId || savedProjectId || '';
    const finalRoomId = urlRoomId || savedRoomId || '';

    if (finalProjectId) {
      setProjectId(finalProjectId);
      localStorage.setItem('canva_saved_projectId', finalProjectId);
    }
    if (finalRoomId) {
      setRoomId(finalRoomId);
      localStorage.setItem('canva_saved_roomId', finalRoomId);
    }

    if (finalProjectId) {
      loadProject(finalProjectId, finalRoomId);
    }
  }, []);

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
      await fetch(`${BACKEND_URL}/api/items/${itemId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      // Reload to refresh
      loadProject(projectId, selectedRoom?.id);
    } catch (e) {
      console.error('Update failed:', e);
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

  // NO PROJECT LOADED
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
          <div style={{
            background: "rgba(30, 41, 59, 0.9)",
            padding: "30px",
            borderRadius: "16px",
            border: "2px solid #D4A574",
            textAlign: "center"
          }}>
            <div style={{ color: "#D4A574", fontSize: "16px", marginBottom: "20px" }}>
              To use this app, click the <strong>"CANVA LIVE CHECKLIST"</strong> button in your main Interior Design app.
            </div>
            <div style={{ color: "#B49B7E", fontSize: "14px" }}>
              It will automatically connect to your project and room.
            </div>
          </div>
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
              localStorage.removeItem('canva_saved_projectId');
              localStorage.removeItem('canva_saved_roomId');
              setProject(null);
              setProjectId('');
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
        {/* HEADER */}
        <div style={{
          background: "rgba(30, 41, 59, 0.9)",
          padding: "16px 20px",
          borderBottom: "2px solid #B49B7E",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center"
        }}>
          <div>
            <div style={{ color: "#D4A574", fontSize: "20px", fontWeight: "bold" }}>
              📋 {selectedRoom.name}
            </div>
            <div style={{ color: "#B49B7E", fontSize: "12px", marginTop: "4px" }}>
              🔄 Last synced: {lastSync.toLocaleTimeString()} • Auto-refresh every 5s
            </div>
          </div>
          <Button variant="secondary" onClick={() => setSelectedRoom(null)}>
            ← Change Room
          </Button>
        </div>

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
import { Button, Rows, Text, Title, LoadingIndicator } from "@canva/app-ui-kit";
import { requestOpenExternalUrl } from "@canva/platform";
import * as React from "react";
import * as styles from "styles/components.css";

const BACKEND_URL = "https://interior-checklist.preview.emergentagent.com";

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
  const [project, setProject] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [collapsedRooms, setCollapsedRooms] = React.useState<Set<string>>(new Set());
  const [collapsedCats, setCollapsedCats] = React.useState<Set<string>>(new Set());
  const [lastSync, setLastSync] = React.useState(new Date());

  // REAL-TIME SYNC every 5 seconds
  React.useEffect(() => {
    if (!project) return;
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/api/projects/${projectId}?sheet_type=checklist`);
        if (res.ok) {
          setProject(await res.json());
          setLastSync(new Date());
        }
      } catch (e) {
        console.log('Sync error:', e);
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [project, projectId]);

  const loadProject = async () => {
    if (!projectId.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${BACKEND_URL}/api/projects/${projectId.trim()}?sheet_type=checklist`);
      if (!res.ok) throw new Error(`Failed: ${res.status}`);
      setProject(await res.json());
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (itemId: string, status: string) => {
    try {
      await fetch(`${BACKEND_URL}/api/items/${itemId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
    } catch (e) {
      console.error('Update failed:', e);
    }
  };

  const openLink = async (url: string) => {
    if (url) await requestOpenExternalUrl({ url });
  };

  const toggleRoom = (rid: string) => {
    const n = new Set(collapsedRooms);
    n.has(rid) ? n.delete(rid) : n.add(rid);
    setCollapsedRooms(n);
  };

  const toggleCat = (cid: string) => {
    const n = new Set(collapsedCats);
    n.has(cid) ? n.delete(cid) : n.add(cid);
    setCollapsedCats(n);
  };

  if (loading) {
    return (
      <div style={{ 
        background: 'linear-gradient(135deg, #000000 0%, #1e293b 50%, #000000 100%)',
        padding: "48px", 
        textAlign: "center",
        minHeight: "400px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center"
      }}>
        <LoadingIndicator size="large" />
        <div style={{ marginTop: "16px" }}>
          <Text>Loading checklist...</Text>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div style={{
        background: 'linear-gradient(135deg, #000000 0%, #0f172a 30%, #1e293b 70%, #000000 100%)',
        padding: "24px",
        minHeight: "500px"
      }}>
        <Rows spacing="3u">
          <div style={{ textAlign: "center", padding: "20px 0" }}>
            <Title size="large">Live Checklist</Title>
          </div>
          
          {error && (
            <div style={{ 
              background: "#8B4444", 
              padding: "16px", 
              borderRadius: "8px", 
              border: "2px solid #B49B7E" 
            }}>
              <Text>⚠️ {error}</Text>
            </div>
          )}
          
          <div style={{ marginTop: "20px" }}>
            <Text>Enter your Project ID:</Text>
          </div>
          
          <input
            type="text"
            value={projectId}
            onChange={(e: any) => setProjectId(e.target.value)}
            placeholder="e.g., 8bb8cbf2-e691-4227-9892-d78c79d5b0a4"
            style={{
              width: "100%",
              padding: "14px",
              background: "rgba(15, 23, 42, 0.9)",
              border: "2px solid #D4A574",
              borderRadius: "8px",
              color: "#D4A574",
              fontSize: "14px",
              fontFamily: "monospace"
            }}
          />
          
          <Button 
            variant="primary" 
            onClick={loadProject} 
            stretch 
            disabled={!projectId.trim()}
          >
            Load Checklist
          </Button>
          
          <div style={{ 
            background: "rgba(30, 41, 59, 0.6)", 
            padding: "16px", 
            borderRadius: "8px", 
            borderLeft: "4px solid #D4A574",
            marginTop: "20px"
          }}>
            <Text>💡 <strong>Tip:</strong> Find your Project ID in the main app URL</Text>
          </div>
        </Rows>
      </div>
    );
  }

  const rooms = project.rooms || [];

  return (
    <div style={{
      background: 'linear-gradient(135deg, #000000 0%, #0f172a 30%, #1e293b 70%, #000000 100%)',
      minHeight: "100vh",
      padding: "0"
    }}>
      {/* HEADER */}
      <div style={{ 
        background: "#D4A574", 
        padding: "16px 20px",
        borderBottom: "3px solid #B49B7E",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: "10px"
      }}>
        <div style={{ color: "#1E293B", fontWeight: "bold", fontSize: "18px" }}>
          {project.name || "Live Checklist"}
        </div>
        <div style={{ color: "#1E293B", fontSize: "11px" }}>
          🔄 Synced: {lastSync.toLocaleTimeString()}
        </div>
      </div>

      {/* ROOMS */}
      <div style={{ padding: "16px" }}>
        <Rows spacing="2u">
          {rooms.map((room: any) => {
            const isRoomCollapsed = collapsedRooms.has(room.id);
            const categories = room.categories || [];
            
            return (
              <div key={room.id}>
                {/* ROOM HEADER */}
                <div
                  onClick={() => toggleRoom(room.id)}
                  style={{
                    background: room.color || "#D4A574",
                    color: "#1E293B",
                    padding: "14px 18px",
                    cursor: "pointer",
                    borderRadius: "8px 8px 0 0",
                    fontWeight: "bold",
                    fontSize: "15px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center"
                  }}
                >
                  <span>{room.name?.toUpperCase() || "ROOM"}</span>
                  <span style={{ fontSize: "18px" }}>{isRoomCollapsed ? "▼" : "▲"}</span>
                </div>

                {/* CATEGORIES */}
                {!isRoomCollapsed && categories.map((cat: any) => {
                  const isCatCollapsed = collapsedCats.has(cat.id);
                  const subcats = cat.subcategories || [];
                  
                  return (
                    <div key={cat.id} style={{ 
                      background: "rgba(30, 41, 59, 0.8)",
                      marginBottom: "12px",
                      border: "1px solid #B49B7E"
                    }}>
                      {/* CATEGORY HEADER */}
                      <div
                        onClick={() => toggleCat(cat.id)}
                        style={{
                          background: "#8B4444",
                          color: "#D4C5A9",
                          padding: "10px 16px",
                          cursor: "pointer",
                          fontWeight: "bold",
                          fontSize: "13px",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center"
                        }}
                      >
                        <span>{cat.name?.toUpperCase()}</span>
                        <span>{isCatCollapsed ? "▶" : "▼"}</span>
                      </div>

                      {/* ITEMS TABLE */}
                      {!isCatCollapsed && subcats.map((sub: any) => {
                        const items = sub.items || [];
                        if (items.length === 0) return null;
                        
                        return (
                          <div key={sub.id} style={{ padding: "12px" }}>
                            {/* SUBCATEGORY NAME */}
                            <div style={{ 
                              color: "#D4A574", 
                              fontSize: "12px", 
                              fontWeight: "bold",
                              marginBottom: "8px",
                              paddingLeft: "4px"
                            }}>
                              {sub.name?.toUpperCase()}
                            </div>

                            {/* ITEMS */}
                            {items.map((item: any, idx: number) => (
                              <div key={item.id} style={{
                                background: idx % 2 === 0 ? 'rgba(15, 23, 42, 0.7)' : 'rgba(30, 41, 59, 0.7)',
                                padding: "12px",
                                marginBottom: "8px",
                                borderRadius: "6px",
                                border: "1px solid rgba(180, 155, 126, 0.3)"
                              }}>
                                <Rows spacing="1u">
                                  {/* ITEM NAME & IMAGE */}
                                  <div style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
                                    {item.image_url && (
                                      <img 
                                        src={item.image_url}
                                        alt={item.name}
                                        style={{
                                          width: "60px",
                                          height: "60px",
                                          objectFit: "cover",
                                          borderRadius: "6px",
                                          border: "1px solid #B49B7E"
                                        }}
                                      />
                                    )}
                                    <div style={{ flex: 1 }}>
                                      <Text><strong style={{ color: "#D4A574" }}>{item.name}</strong></Text>
                                      {item.size && (
                                        <Text style={{ fontSize: "11px", color: "#B49B7E" }}>
                                          Size: {item.size}
                                        </Text>
                                      )}
                                      {item.finish_color && (
                                        <Text style={{ fontSize: "11px", color: "#B49B7E" }}>
                                          Finish: {item.finish_color}
                                        </Text>
                                      )}
                                    </div>
                                  </div>

                                  {/* STATUS */}
                                  <div style={{ marginTop: "8px" }}>
                                    <select
                                      value={item.status || ''}
                                      onChange={(e: any) => {
                                        item.status = e.target.value;
                                        updateStatus(item.id, e.target.value);
                                      }}
                                      style={{
                                        width: "100%",
                                        padding: "6px 10px",
                                        background: getStatusColor(item.status || ''),
                                        color: "white",
                                        border: "2px solid " + getStatusColor(item.status || ''),
                                        borderRadius: "6px",
                                        fontSize: "12px",
                                        fontWeight: "bold",
                                        cursor: "pointer"
                                      }}
                                    >
                                      <option value="">- Select Status -</option>
                                      {STATUS_OPTIONS.map(s => (
                                        <option key={s} value={s}>{s}</option>
                                      ))}
                                    </select>
                                  </div>

                                  {/* LINK BUTTON */}
                                  {item.link && (
                                    <Button
                                      variant="secondary"
                                      onClick={() => openLink(item.link)}
                                      stretch
                                    >
                                      🔗 View Product
                                    </Button>
                                  )}
                                </Rows>
                              </div>
                            ))}
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </Rows>
      </div>

      {/* BACK BUTTON */}
      <div style={{ padding: "0 16px 20px" }}>
        <Button variant="secondary" onClick={() => setProject(null)} stretch>
          ← Back to Project Selection
        </Button>
      </div>
    </div>
  );
};
import { Button, Rows, Text, Title, LoadingIndicator, TextInput } from "@canva/app-ui-kit";
import { requestOpenExternalUrl } from "@canva/platform";
import * as React from "react";
import * as styles from "styles/components.css";

const BACKEND_URL = "https://interior-checklist.preview.emergentagent.com";

export const App = () => {
  const [projectId, setProjectId] = React.useState("");
  const [project, setProject] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [collapsedRooms, setCollapsedRooms] = React.useState<Set<string>>(new Set());

  const loadProject = async () => {
    if (!projectId.trim()) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${BACKEND_URL}/api/projects/${projectId.trim()}`);
      
      if (!response.ok) {
        throw new Error(`Failed to load project: ${response.status}`);
      }
      
      const data = await response.json();
      setProject(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load project");
    } finally {
      setLoading(false);
    }
  };

  const toggleRoom = (roomId: string) => {
    const newCollapsed = new Set(collapsedRooms);
    if (newCollapsed.has(roomId)) {
      newCollapsed.delete(roomId);
    } else {
      newCollapsed.add(roomId);
    }
    setCollapsedRooms(newCollapsed);
  };

  const openLink = async (url: string) => {
    if (!url) return;
    await requestOpenExternalUrl({ url });
  };

  if (loading) {
    return (
      <div className={styles.scrollContainer} style={{ textAlign: "center", padding: "48px" }}>
        <LoadingIndicator size="large" />
        <Text>Loading checklist...</Text>
      </div>
    );
  }

  if (!project) {
    return (
      <div className={styles.scrollContainer}>
        <Rows spacing="2u">
          <Title size="medium">Live Checklist</Title>
          {error && (
            <div style={{ background: "#FEE2E2", padding: "12px", borderRadius: "8px" }}>
              <Text>{error}</Text>
            </div>
          )}
          <Text>Enter your Project ID:</Text>
          <TextInput
            value={projectId}
            onChange={setProjectId}
            placeholder="e.g., 8bb8cbf2-e691-4227-9892-d78c79d5b0a4"
          />
          <Button variant="primary" onClick={loadProject} stretch disabled={!projectId.trim()}>
            Load Checklist
          </Button>
          <div style={{ background: "#F3F4F6", padding: "12px", borderRadius: "8px", borderLeft: "4px solid #D4A574" }}>
            <Text>💡 Find your Project ID in the main app URL</Text>
          </div>
        </Rows>
      </div>
    );
  }

  // Display checklist
  const rooms = project.rooms || [];

  return (
    <div className={styles.scrollContainer}>
      <Rows spacing="2u">
        <div style={{ background: "#D4A574", padding: "16px", borderRadius: "8px", marginBottom: "8px" }}>
          <Title size="small">{project.name || "Project Checklist"}</Title>
        </div>

        {rooms.length === 0 ? (
          <Text>No rooms found in this project.</Text>
        ) : (
          rooms.map((room: any) => {
            const isCollapsed = collapsedRooms.has(room.id);
            const categories = room.categories || [];
            
            return (
              <div key={room.id} style={{ border: "1px solid #E5E7EB", borderRadius: "8px", overflow: "hidden" }}>
                <div
                  onClick={() => toggleRoom(room.id)}
                  style={{
                    background: room.color || "#D4A574",
                    color: "white",
                    padding: "12px 16px",
                    cursor: "pointer",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center"
                  }}
                >
                  <Text style={{ color: "white", fontWeight: "bold" }}>
                    {room.name?.toUpperCase() || "ROOM"}
                  </Text>
                  <span style={{ fontSize: "16px" }}>{isCollapsed ? "▼" : "▲"}</span>
                </div>

                {!isCollapsed && (
                  <div style={{ padding: "12px" }}>
                    {categories.map((category: any) => {
                      const subcategories = category.subcategories || [];
                      
                      return (
                        <div key={category.id} style={{ marginBottom: "16px" }}>
                          {category.name && (
                            <div style={{ background: "#F9FAFB", padding: "8px", borderRadius: "6px", marginBottom: "8px" }}>
                              <Text><strong>{category.name}</strong></Text>
                            </div>
                          )}
                          
                          {subcategories.map((subcategory: any) => {
                            const items = subcategory.items || [];
                            
                            return (
                              <div key={subcategory.id} style={{ marginBottom: "12px" }}>
                                {subcategory.name && (
                                  <Text style={{ fontSize: "12px", marginBottom: "4px" }}>
                                    {subcategory.name}
                                  </Text>
                                )}
                                
                                {items.map((item: any) => (
                                  <div
                                    key={item.id}
                                    style={{
                                      padding: "8px",
                                      background: "white",
                                      border: "1px solid #E5E7EB",
                                      borderRadius: "6px",
                                      marginBottom: "4px"
                                    }}
                                  >
                                    <div style={{ display: "flex", alignItems: "flex-start", gap: "8px" }}>
                                      {item.image_url && (
                                        <img
                                          src={item.image_url}
                                          alt={item.name}
                                          style={{
                                            width: "40px",
                                            height: "40px",
                                            objectFit: "cover",
                                            borderRadius: "4px",
                                            border: "1px solid #E5E7EB"
                                          }}
                                        />
                                      )}
                                      <div style={{ flex: 1 }}>
                                        <Text><strong>{item.name || "Unnamed Item"}</strong></Text>
                                        {item.price && (
                                          <Text style={{ fontSize: "11px" }}>💰 {item.price}</Text>
                                        )}
                                        {item.status && (
                                          <div
                                            style={{
                                              display: "inline-block",
                                              background: "#D4A574",
                                              color: "white",
                                              padding: "2px 6px",
                                              borderRadius: "4px",
                                              fontSize: "10px",
                                              marginTop: "4px"
                                            }}
                                          >
                                            {item.status}
                                          </div>
                                        )}
                                        {item.link && (
                                          <Button
                                            variant="tertiary"
                                            onClick={() => openLink(item.link)}
                                            style={{ marginTop: "4px", fontSize: "10px" }}
                                          >
                                            🔗 View
                                          </Button>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            );
                          })}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })
        )}

        <Button variant="secondary" onClick={() => setProject(null)} stretch>
          ← Back to Project Selection
        </Button>
      </Rows>
    </div>
  );
};

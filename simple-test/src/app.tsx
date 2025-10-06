import { Button, Rows, Text, Title, LoadingIndicator } from "@canva/app-ui-kit";
import { requestOpenExternalUrl } from "@canva/platform";
import { findAllVisualImages } from "@canva/design";
import * as React from "react";
import * as styles from "styles/components.css";

const BACKEND_URL = "https://interior-checklist.preview.emergentagent.com";

// Status colors - MUTED only!
const getStatusColor = (status: string): string => {
  const statusColors: Record<string, string> = {
    'PICKED': '#3B82F6',
    'ORDER SAMPLES': '#D4A574',
    'SAMPLES ARRIVED': '#9ACD32',
    'ASK NEIL': '#DAA520',
    'ASK CHARLENE': '#B8860B',
    'ASK JALA': '#8B7355',
    'GET QUOTE': '#7A5A8A',
    'WAITING ON QT': '#5A7A5A',
    'READY FOR PRESENTATION': '#006400',
    'APPROVED': '#9ACD32',
    'ORDERED': '#32CD32'
  };
  return statusColors[status] || '#1E293B';
};

export const App = () => {
  const [projectId, setProjectId] = React.useState("");
  const [project, setProject] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [collapsedRooms, setCollapsedRooms] = React.useState<Set<string>>(new Set());
  const [collapsedCategories, setCollapsedCategories] = React.useState<Set<string>>(new Set());
  const [autoDetecting, setAutoDetecting] = React.useState(false);
  const [lastSync, setLastSync] = React.useState<Date>(new Date());

  // AUTO-DETECTION - Monitor Canva design for new images
  React.useEffect(() => {
    if (!project) return;
    
    const detectInterval = setInterval(async () => {
      try {
        setAutoDetecting(true);
        const images = await findAllVisualImages();
        
        // Check for images with external URLs (pasted from web)
        for (const image of images) {
          const imageData = await image.read();
          if (imageData.externalUrl) {
            console.log('🎯 Detected external image:', imageData.externalUrl);
            // Scrape and add to checklist
            await scrapeAndAddItem(imageData.externalUrl);
          }
        }
      } catch (err) {
        console.log('Auto-detection running...');
      } finally {
        setAutoDetecting(false);
      }
    }, 10000); // Check every 10 seconds
    
    return () => clearInterval(detectInterval);
  }, [project]);

  // REAL-TIME SYNC - Refresh from backend every 5 seconds
  React.useEffect(() => {
    if (!project) return;
    
    const syncInterval = setInterval(async () => {
      try {
        const response = await fetch(`${BACKEND_URL}/api/projects/${projectId}?sheet_type=checklist`);
        if (response.ok) {
          const data = await response.json();
          setProject(data);
          setLastSync(new Date());
        }
      } catch (err) {
        console.log('Sync error:', err);
      }
    }, 5000); // Sync every 5 seconds
    
    return () => clearInterval(syncInterval);
  }, [project, projectId]);

  const scrapeAndAddItem = async (url: string) => {
    try {
      console.log('🔍 Scraping URL:', url);
      const response = await fetch(`${BACKEND_URL}/api/scrape`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      });
      
      if (response.ok) {
        const scrapedData = await response.json();
        console.log('✅ Scraped data:', scrapedData);
        
        // Find first available subcategory to add item
        let subcategoryId = null;
        for (const room of project.rooms || []) {
          for (const category of room.categories || []) {
            for (const subcategory of category.subcategories || []) {
              subcategoryId = subcategory.id;
              break;
            }
            if (subcategoryId) break;
          }
          if (subcategoryId) break;
        }
        
        if (subcategoryId) {
          // Add item to checklist
          const itemResponse = await fetch(`${BACKEND_URL}/api/items`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              ...scrapedData,
              subcategory_id: subcategoryId,
              status: ''
            })
          });
          
          if (itemResponse.ok) {
            console.log('✅ Item added to checklist!');
            // Reload project
            loadProject();
          }
        }
      }
    } catch (err) {
      console.error('❌ Scraping error:', err);
    }
  };

  const loadProject = async () => {
    if (!projectId.trim()) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${BACKEND_URL}/api/projects/${projectId.trim()}?sheet_type=checklist`);
      
      if (!response.ok) {
        throw new Error(`Failed to load: ${response.status}`);
      }
      
      const data = await response.json();
      setProject(data);
      
      // Initialize all rooms/categories as expanded
      const roomIds = new Set<string>();
      const catIds = new Set<string>();
      data.rooms?.forEach((room: any) => {
        roomIds.add(room.id);
        room.categories?.forEach((cat: any) => {
          catIds.add(cat.id);
        });
      });
      setCollapsedRooms(new Set());
      setCollapsedCategories(new Set());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
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

  const toggleCategory = (catId: string) => {
    const newCollapsed = new Set(collapsedCategories);
    if (newCollapsed.has(catId)) {
      newCollapsed.delete(catId);
    } else {
      newCollapsed.add(catId);
    }
    setCollapsedCategories(newCollapsed);
  };

  const updateItemStatus = async (itemId: string, newStatus: string) => {
    try {
      await fetch(`${BACKEND_URL}/api/items/${itemId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      console.log('✅ Status updated');
    } catch (err) {
      console.error('❌ Update failed:', err);
    }
  };

  const openLink = async (url: string) => {
    if (!url) return;
    await requestOpenExternalUrl({ url });
  };

  // LOADING STATE
  if (loading) {
    return (
      <div className={styles.scrollContainer} style={{ 
        background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.95) 0%, rgba(30, 30, 50, 0.9) 50%, rgba(0, 0, 0, 0.95) 100%)',
        textAlign: "center", 
        padding: "48px" 
      }}>
        <LoadingIndicator size="large" />
        <Text style={{ color: "#D4A574" }}>Loading checklist...</Text>
      </div>
    );
  }

  // PROJECT SELECT SCREEN
  if (!project) {
    return (
      <div className={styles.scrollContainer} style={{
        background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.95) 0%, rgba(30, 30, 50, 0.9) 50%, rgba(0, 0, 0, 0.95) 100%)',
        padding: "24px"
      }}>
        <Rows spacing="2u">
          <Title size="medium" style={{ color: "#D4A574" }}>🎨 Live Checklist</Title>
          
          {error && (
            <div style={{ background: "#8B4444", padding: "12px", borderRadius: "8px", border: "1px solid #B49B7E" }}>
              <Text style={{ color: "#D4A574" }}>{error}</Text>
            </div>
          )}
          
          <Text style={{ color: "#B49B7E" }}>Enter Project ID:</Text>
          
          <input
            type="text"
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
            placeholder="8bb8cbf2-e691-4227-9892-d78c79d5b0a4"
            style={{
              width: "100%",
              padding: "12px",
              background: "rgba(15, 23, 42, 0.8)",
              border: "1px solid #D4A574",
              borderRadius: "6px",
              color: "#D4A574",
              fontSize: "14px"
            }}
          />
          
          <Button variant="primary" onClick={loadProject} stretch disabled={!projectId.trim()}>
            Load Checklist
          </Button>
          
          <div style={{ background: "rgba(30, 41, 59, 0.5)", padding: "16px", borderRadius: "8px", borderLeft: "4px solid #D4A574" }}>
            <Text style={{ color: "#B49B7E", fontSize: "12px" }}>
              💡 Get Project ID from main app URL
            </Text>
          </div>
        </Rows>
      </div>
    );
  }

  // MAIN CHECKLIST VIEW
  const rooms = project.rooms || [];

  return (
    <div className={styles.scrollContainer} style={{
      background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.95) 0%, rgba(15, 23, 42, 0.9) 30%, rgba(30, 41, 59, 0.95) 70%, rgba(0, 0, 0, 0.95) 100%)',
      minHeight: "100vh"
    }}>
      <Rows spacing="1u">
        {/* HEADER */}
        <div style={{ 
          background: "#D4A574", 
          padding: "20px", 
          borderBottom: "2px solid #B49B7E",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center"
        }}>
          <div>
            <Text style={{ color: "#1E293B", fontWeight: "bold", fontSize: "16px" }}>
              {project.name || "Live Checklist"}
            </Text>
            {autoDetecting && (
              <Text style={{ color: "#1E293B", fontSize: "10px" }}>
                🔍 Auto-detecting products...
              </Text>
            )}
          </div>
          <Text style={{ color: "#1E293B", fontSize: "10px" }}>
            Last sync: {lastSync.toLocaleTimeString()}
          </Text>
        </div>

        {/* ROOMS */}
        {rooms.map((room: any) => {
          const isCollapsed = collapsedRooms.has(room.id);
          const categories = room.categories || [];
          
          return (
            <div key={room.id} style={{ marginBottom: "16px" }}>
              {/* ROOM HEADER */}
              <div
                onClick={() => toggleRoom(room.id)}
                style={{
                  background: room.color || "#D4A574",
                  color: "#1E293B",
                  padding: "16px",
                  cursor: "pointer",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  borderRadius: "8px 8px 0 0"
                }}
              >
                <Text style={{ color: "#1E293B", fontWeight: "bold" }}>
                  {room.name?.toUpperCase() || "ROOM"}
                </Text>
                <span style={{ fontSize: "16px", color: "#1E293B" }}>
                
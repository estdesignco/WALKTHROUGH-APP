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
  const [roomId, setRoomId] = React.useState("");
  const [project, setProject] = React.useState<any>(null);
  const [selectedRoom, setSelectedRoom] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [collapsedCats, setCollapsedCats] = React.useState<Set<string>>(new Set());
  const [lastSync, setLastSync] = React.useState(new Date());
  const [scrapingUrl, setScrapingUrl] = React.useState("");

  // REAL-TIME SYNC every 5 seconds
  React.useEffect(() => {
    if (!project || !selectedRoom) return;
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/api/projects/${projectId}?sheet_type=checklist`);
        if (res.ok) {
          const data = await res.json();
          setProject(data);
          // Update selected room
          const room = data.rooms?.find((r: any) => r.id === selectedRoom.id);
          if (room) setSelectedRoom(room);
          setLastSync(new Date());
        }
      } catch (e) {
        console.log('Sync error:', e);
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [project, projectId, selectedRoom]);

  // Check URL params for projectId and roomId, OR load from localStorage
  React.useEffect(() => {
    // FORCE VERSION CHECK ON LOAD
    alert('🎨 CANVA APP VERSION: 2.1.0 - Gold Text + Refresh Button');
    console.log('🎨 CANVA APP VERSION: 2.1.0');
    console.log('🎨 Build Date: Oct 6, 2025 - 2:10 PM');
    
    const params = new URLSearchParams(window.location.search);
    const urlProjectId = params.get('projectId');
    const urlRoomId = params.get('roomId');
    
    // Priority: URL params > localStorage > nothing
    let finalProjectId = urlProjectId;
    let finalRoomId = urlRoomId;
    
    if (!finalProjectId) {
      finalProjectId = localStorage.getItem('canva_saved_projectId') || '';
    }
    
    if (!finalRoomId) {
      finalRoomId = localStorage.getItem('canva_saved_roomId') || '';
    }
    
    if (finalProjectId) {
      console.log('🔄 Auto-loading saved project:', finalProjectId, 'room:', finalRoomId);
      setProjectId(finalProjectId);
      setRoomId(finalRoomId);
      loadProject(finalProjectId, finalRoomId);
    }
  }, []);

  const loadProject = async (pid?: string, rid?: string) => {
    const targetProjectId = pid || projectId.trim();
    const targetRoomId = rid || roomId.trim();
    
    if (!targetProjectId) return;
    
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${BACKEND_URL}/api/projects/${targetProjectId}?sheet_type=checklist`);
      if (!res.ok) throw new Error(`Failed: ${res.status}`);
      const data = await res.json();
      setProject(data);
      
      // SAVE to localStorage for next time
      localStorage.setItem('canva_saved_projectId', targetProjectId);
      if (targetRoomId) {
        localStorage.setItem('canva_saved_roomId', targetRoomId);
      }
      
      // If roomId provided, select that room
      if (targetRoomId) {
        const room = data.rooms?.find((r: any) => r.id === targetRoomId);
        if (room) {
          setSelectedRoom(room);
          console.log('✅ Room auto-selected:', room.name);
        } else {
          console.log('⚠️ Room not found:', targetRoomId);
          setError(`Room not found: ${targetRoomId}`);
        }
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const autoImportFromCanva = async () => {
    if (!selectedRoom) return;
    
    setLoading(true);
    try {
      // NOTE: Canva's SDK doesn't expose a way to get images with links yet
      // This would require Canva Design API access which is still in beta
      alert('🚧 Auto-Import Feature Coming Soon!\n\nThis will scan all product links on your Canva page and import them automatically.\n\nFor now, please use:\n1. Copy/paste individual product URLs\n2. Or use "Import Page" button in main app');
      
      // FUTURE IMPLEMENTATION:
      // 1. Use Canva Design API to get all elements
      // 2. Filter elements with external URLs
      // 3. For each URL: scrape → categorize → add to checklist
      // 4. Use keywords in product name to match categories
      
    } catch (e: any) {
      alert('❌ Error: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  const scrapeAndAdd = async () => {
    if (!scrapingUrl.trim() || !selectedRoom) return;
    
    console.log('🔍 Starting scrape for URL:', scrapingUrl.trim());
    setLoading(true);
    
    try {
      // Scrape URL
      console.log('📡 Sending scrape request...');
      const scrapeRes = await fetch(`${BACKEND_URL}/api/scrape-product`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          url: scrapingUrl.trim(),
          auto_clip_to_houzz: true
        })
      });
      
      console.log('📡 Scrape response status:', scrapeRes.status);
      
      if (!scrapeRes.ok) {
        const errorText = await scrapeRes.text();
        console.error('❌ Scrape failed:', errorText);
        throw new Error(`Scraping failed: ${scrapeRes.status} - ${errorText}`);
      }
      
      const scrapedData = await scrapeRes.json();
      console.log('✅ Scraped data:', scrapedData);
      
      // Find first subcategory to add item
      let subcategoryId = null;
      console.log('🔍 Looking for subcategory in room:', selectedRoom.name);
      
      for (const cat of selectedRoom.categories || []) {
        console.log('  Category:', cat.name);
        for (const sub of cat.subcategories || []) {
          console.log('    Subcategory:', sub.name, sub.id);
          subcategoryId = sub.id;
          break;
        }
        if (subcategoryId) break;
      }
      
      if (!subcategoryId) {
        console.error('❌ No subcategory found');
        alert('❌ No subcategory found to add item.\n\nPlease make sure this room has at least one category with a subcategory.');
        return;
      }
      
      console.log('📝 Adding item to subcategory:', subcategoryId);
      
      // Add item
      const addRes = await fetch(`${BACKEND_URL}/api/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...scrapedData,
          subcategory_id: subcategoryId,
          status: '',
          quantity: 1
        })
      });
      
      console.log('📡 Add item response status:', addRes.status);
      
      if (addRes.ok) {
        console.log('✅ Item added successfully!');
        alert('✅ Item added successfully!');
        setScrapingUrl('');
        // Reload project
        loadProject(projectId, selectedRoom.id);
      } else {
        const errorText = await addRes.text();
        console.error('❌ Add item failed:', errorText);
        throw new Error(`Failed to add item: ${addRes.status}`);
      }
    } catch (e: any) {
      console.error('❌ Error in scrapeAndAdd:', e);
      alert('❌ Error: ' + e.message + '\n\nCheck console for details (F12)');
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

  const updateItem = async (itemId: string, data: any) => {
    try {
      await fetch(`${BACKEND_URL}/api/items/${itemId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      
      // If checkbox is checked, auto-set status to PICKED
      if (data.checked === true && (!data.status || data.status === '')) {
        await updateStatus(itemId, 'PICKED');
      }
    } catch (e) {
      console.error('Update failed:', e);
    }
  };

  const toggleCat = (cid: string) => {
    const n = new Set(collapsedCats);
    n.has(cid) ? n.delete(cid) : n.add(cid);
    setCollapsedCats(n);
  };

  const selectRoom = (room: any) => {
    setSelectedRoom(room);
    setRoomId(room.id);
    // Save to localStorage
    localStorage.setItem('canva_saved_roomId', room.id);
    console.log('✅ Room selected and saved:', room.name);
  };

  const openLink = async (url: string) => {
    if (url) await requestOpenExternalUrl({ url });
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
            <Text>Enter Project ID:</Text>
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

          <div style={{ marginTop: "12px" }}>
            <Text style={{ fontSize: "11px", color: "#B49B7E" }}>(Optional - leave blank to choose from list)</Text>
          </div>
          
          <input
            type="text"
            value={roomId}
            onChange={(e: any) => setRoomId(e.target.value)}
            placeholder="Leave blank to select from list"
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
            onClick={() => loadProject()} 
            stretch 
            disabled={!projectId.trim()}
          >
            Load Checklist
          </Button>
          
          {(localStorage.getItem('canva_saved_projectId')) && (
            <Button 
              variant="secondary" 
              onClick={() => {
                localStorage.removeItem('canva_saved_projectId');
                localStorage.removeItem('canva_saved_roomId');
                setProjectId('');
                setRoomId('');
                alert('✅ Saved connection cleared!');
              }}
              stretch
            >
              🗑️ Clear Saved Connection
            </Button>
          )}
          
          <div style={{ 
            background: "rgba(30, 41, 59, 0.6)", 
            padding: "16px", 
            borderRadius: "8px", 
            borderLeft: "4px solid #D4A574",
            marginTop: "20px"
          }}>
            <Text>💡 <strong>Tip:</strong> Use the "Connect to Canva" button in the main app to get a direct link!</Text>
          </div>
        </Rows>
      </div>
    );
  }

  // ROOM SELECTION if no room selected
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

          <Text style={{ textAlign: "center", color: "#B49B7E" }}>
            Select a room to view its checklist:
          </Text>

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
              {room.name?.toUpperCase() || "ROOM"}
            </div>
          ))}

          <Button variant="secondary" onClick={() => setProject(null)} stretch>
            ← Change Project
          </Button>
        </Rows>
      </div>
    );
  }

  // MAIN CHECKLIST VIEW - ONE ROOM
  const categories = selectedRoom.categories || [];

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
        borderBottom: "3px solid #B49B7E"
      }}>
        <div style={{ 
          display: "flex", 
          justifyContent: "space-between", 
          alignItems: "center",
          flexWrap: "wrap",
          gap: "10px"
        }}>
          <div>
            <div style={{ color: "#FFFFFF", fontWeight: "bold", fontSize: "18px", marginBottom: "4px", textShadow: "2px 2px 4px rgba(0,0,0,0.5)" }}>
              {selectedRoom.name?.toUpperCase() || "ROOM"}
            </div>
            <div style={{ color: "#FFFFFF", fontSize: "11px", textShadow: "1px 1px 2px rgba(0,0,0,0.5)" }}>
              🔄 Synced: {lastSync.toLocaleTimeString()}
            </div>
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            <Button 
              variant="primary" 
              onClick={() => {
                console.log('🔄 Manual refresh triggered');
                loadProject(projectId, selectedRoom.id);
              }}
            >
              🔄 REFRESH
            </Button>
            <Button variant="secondary" onClick={() => setSelectedRoom(null)}>
              ← Change Room
            </Button>
          </div>
        </div>
      </div>

      {/* SCRAPE SECTION */}
      <div style={{ 
        background: "rgba(30, 41, 59, 0.9)", 
        padding: "16px 20px",
        borderBottom: "2px solid #B49B7E"
      }}>
        <Rows spacing="2u">
          <Text style={{ color: "#D4A574", fontWeight: "bold", fontSize: "13px" }}>
            🔗 ADD SINGLE PRODUCT
          </Text>
          <div style={{ display: "flex", gap: "8px" }}>
            <input
              type="text"
              value={scrapingUrl}
              onChange={(e: any) => setScrapingUrl(e.target.value)}
              placeholder="Paste product URL here to scrape and add..."
              style={{
                flex: 1,
                padding: "12px",
                background: "rgba(15, 23, 42, 0.9)",
                border: "2px solid #D4A574",
                borderRadius: "8px",
                color: "#D4A574",
                fontSize: "13px"
              }}
            />
            <Button
              variant="primary"
              onClick={scrapeAndAdd}
              disabled={!scrapingUrl.trim() || loading}
            >
              SCRAPE & ADD
            </Button>
          </div>
          
          {/* AUTO-IMPORT ALL LINKS FROM CANVA PAGE */}
          <div style={{ 
            marginTop: "16px", 
            paddingTop: "16px", 
            borderTop: "1px solid rgba(180, 155, 126, 0.3)" 
          }}>
            <div style={{ marginBottom: "8px" }}>
              <Text style={{ color: "#9ACD32", fontWeight: "bold", fontSize: "14px" }}>
                ✨ AUTO-IMPORT ALL PRODUCTS FROM CANVA PAGE
              </Text>
            </div>
            <div style={{ marginBottom: "10px" }}>
              <Text style={{ color: "#D4A574", fontSize: "12px" }}>
                Scans all images with links on this Canva page, scrapes them, and adds to checklist with smart categorization
              </Text>
            </div>
            <Button
              variant="secondary"
              onClick={autoImportFromCanva}
              disabled={loading}
              stretch
            >
              🎨 AUTO-IMPORT ALL PRODUCTS
            </Button>
          </div>
          
          <div style={{ marginTop: "10px" }}>
            <Text style={{ color: "#D4A574", fontSize: "11px" }}>
              💡 Single: Paste URL above | Bulk: Click Auto-Import to scan entire Canva page
            </Text>
          </div>
        </Rows>
      </div>

      {/* CATEGORIES */}
      <div style={{ padding: "16px" }}>
        <Rows spacing="2u">
          {categories.map((cat: any) => {
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
                                  {/* ROW 1: CHECKBOX + IMAGE + NAME + QUANTITY */}
                                  <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                                    {/* CHECKBOX */}
                                    <input
                                      type="checkbox"
                                      checked={item.checked || false}
                                      onChange={(e: any) => {
                                        const isChecked = e.target.checked;
                                        item.checked = isChecked;
                                        
                                        // Auto-set status to PICKED if checked and no status
                                        if (isChecked && (!item.status || item.status === '')) {
                                          item.status = 'PICKED';
                                          updateStatus(item.id, 'PICKED');
                                        }
                                        
                                        updateItem(item.id, { checked: isChecked });
                                      }}
                                      style={{
                                        width: "20px",
                                        height: "20px",
                                        cursor: "pointer",
                                        accentColor: "#D4A574"
                                      }}
                                    />

                                    {/* IMAGE */}
                                    {item.image_url ? (
                                      <img 
                                        src={item.image_url}
                                        alt={item.name}
                                        style={{
                                          width: "50px",
                                          height: "50px",
                                          objectFit: "cover",
                                          borderRadius: "6px",
                                          border: "1px solid #B49B7E",
                                          cursor: "pointer"
                                        }}
                                        onClick={() => {
                                          // Open in modal
                                          alert('Image preview: ' + item.image_url);
                                        }}
                                      />
                                    ) : (
                                      <div style={{
                                        width: "50px",
                                        height: "50px",
                                        background: "#1E293B",
                                        borderRadius: "6px",
                                        border: "1px solid #B49B7E",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        fontSize: "10px",
                                        color: "#B49B7E"
                                      }}>
                                        No Img
                                      </div>
                                    )}

                                    {/* NAME + QTY */}
                                    <div style={{ flex: 1 }}>
                                      <div style={{ color: "#D4A574", fontSize: "14px", fontWeight: "bold", marginBottom: "4px" }}>
                                        {item.name}
                                      </div>
                                      <div style={{ fontSize: "11px", color: "#D4A574" }}>
                                        Qty: {item.quantity || 1}
                                      </div>
                                    </div>
                                  </div>

                                  {/* ROW 2: STATUS DROPDOWN */}
                                  <div style={{ marginTop: "10px" }}>
                                    <div style={{ fontSize: "11px", color: "#D4A574", marginBottom: "4px", fontWeight: "bold" }}>STATUS:</div>
                                    <select
                                      value={item.status || ''}
                                      onChange={(e: any) => {
                                        item.status = e.target.value;
                                        updateStatus(item.id, e.target.value);
                                      }}
                                      style={{
                                        width: "100%",
                                        padding: "8px 12px",
                                        background: item.status ? getStatusColor(item.status) : '#1E293B',
                                        color: "white",
                                        border: "2px solid " + (item.status ? getStatusColor(item.status) : '#B49B7E'),
                                        borderRadius: "6px",
                                        fontSize: "12px",
                                        fontWeight: "bold",
                                        cursor: "pointer"
                                      }}
                                    >
                                      <option value="" style={{ background: '#1E293B' }}>- Select Status -</option>
                                      {STATUS_OPTIONS.map(s => (
                                        <option key={s} value={s} style={{ background: getStatusColor(s) }}>{s}</option>
                                      ))}
                                    </select>
                                  </div>

                                  {/* ROW 3: DETAILS */}
                                  <div style={{ marginTop: "10px", display: "flex", flexWrap: "wrap", gap: "10px" }}>
                                    {item.size && (
                                      <div style={{ fontSize: "11px", color: "#D4A574" }}>
                                        📏 <strong>Size:</strong> {item.size}
                                      </div>
                                    )}
                                    {item.finish_color && (
                                      <div style={{ fontSize: "11px", color: "#D4A574" }}>
                                        🎨 <strong>Finish:</strong> {item.finish_color}
                                      </div>
                                    )}
                                    {item.sku && (
                                      <div style={{ fontSize: "11px", color: "#D4A574" }}>
                                        🔖 <strong>SKU:</strong> {item.sku}
                                      </div>
                                    )}
                                    {item.vendor && (
                                      <div style={{ fontSize: "11px", color: "#D4A574" }}>
                                        🏪 <strong>Vendor:</strong> {item.vendor}
                                      </div>
                                    )}
                                    {(item.cost || item.price) && (
                                      <div style={{ fontSize: "11px", color: "#9ACD32", fontWeight: "bold" }}>
                                        💰 ${item.cost || item.price}
                                      </div>
                                    )}
                                  </div>

                                  {/* ROW 4: LINK INPUT + SCRAPE */}
                                  <div style={{ marginTop: "10px" }}>
                                    <div style={{ fontSize: "11px", color: "#D4A574", marginBottom: "4px", fontWeight: "bold" }}>PRODUCT LINK:</div>
                                    <div style={{ display: "flex", gap: "8px" }}>
                                      <input
                                        type="text"
                                        value={item.link || ''}
                                        onChange={(e: any) => {
                                          item.link = e.target.value;
                                        }}
                                        onBlur={(e: any) => {
                                          updateItem(item.id, { link: e.target.value });
                                        }}
                                        placeholder="Paste product URL here"
                                        style={{
                                          flex: 1,
                                          padding: "8px",
                                          background: "rgba(15, 23, 42, 0.9)",
                                          border: "1px solid #B49B7E",
                                          borderRadius: "6px",
                                          color: "#D4A574",
                                          fontSize: "11px"
                                        }}
                                      />
                                      {item.link && (
                                        <Button
                                          variant="tertiary"
                                          onClick={() => openLink(item.link)}
                                        >
                                          🔗
                                        </Button>
                                      )}
                                    </div>
                                  </div>

                                  {/* ROW 5: REMARKS */}
                                  {item.remarks && (
                                    <div style={{ marginTop: "10px" }}>
                                      <div style={{ fontSize: "11px", color: "#D4A574", marginBottom: "4px", fontWeight: "bold" }}>REMARKS:</div>
                                      <div style={{
                                        padding: "8px",
                                        background: "rgba(15, 23, 42, 0.7)",
                                        border: "1px solid rgba(180, 155, 126, 0.3)",
                                        borderRadius: "6px",
                                        color: "#D4A574",
                                        fontSize: "11px"
                                      }}>
                                        {item.remarks}
                                      </div>
                                    </div>
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
              </Rows>
            </div>

            {/* BACK BUTTON */}
            <div style={{ padding: "0 16px 20px" }}>
              <Button variant="secondary" onClick={() => setSelectedRoom(null)} stretch>
                ← Back to Room Selection
              </Button>
            </div>
          </div>
        );
      };
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useOfflineSync } from '../hooks/useOfflineSync';
import MobileAddItemModal from './MobileAddItemModal';
import MobilePhotoCapture from './MobilePhotoCapture';

const API_URL = process.env.REACT_APP_BACKEND_URL + '/api';

export default function MobileWalkthroughSpreadsheet({ projectId }) {
  const [project, setProject] = useState(null);
  const [expandedRooms, setExpandedRooms] = useState({});
  const [expandedCategories, setExpandedCategories] = useState({});
  const [loading, setLoading] = useState(true);
  const [showAddRoom, setShowAddRoom] = useState(false);
  const [showAddItem, setShowAddItem] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');
  
  // Offline sync hook
  const {
    online,
    syncStatus,
    pendingCount,
    performSync,
    updateItemOffline,
    cacheProject,
    loadProjectFromCache
  } = useOfflineSync(projectId);

  // EXACT SAME ROOM COLORS AS DESKTOP - MATCHING DESKTOP VERSION
  const getRoomColor = (roomName) => {
    const roomColors = {
      'living room': '#7C3AED',      // Purple
      'dining room': '#DC2626',      // Red
      'kitchen': '#EA580C',          // Orange  
      'primary bedroom': '#059669',  // Green
      'master bedroom': '#059669',   // Green
      'bedroom': '#3B82F6',          // Blue
      'primary bathroom': '#2563EB', // Blue
      'bathroom': '#8B5CF6',         // Violet
      'powder room': '#7C2D12',      // Brown
      'guest room': '#BE185D',       // Pink
      'office': '#6366F1',           // Indigo
      'laundry room': '#16A34A',     // Green
      'mudroom': '#0891B2',          // Cyan
      'family room': '#CA8A04',      // Yellow
      'basement': '#6B7280',         // Gray
      'attic storage': '#78716C',    // Stone
      'garage': '#374151',           // Gray-800
      'balcony': '#7C3AED'           // Purple
    };
    return roomColors[roomName.toLowerCase()] || '#7C3AED';
  };

  const getCategoryColor = () => '#065F46'; // Dark green - EXACT SAME

  useEffect(() => {
    loadProject();
  }, [projectId]);

  const loadProject = async () => {
    try {
      setLoading(true);
      
      if (online) {
        const response = await axios.get(`${API_URL}/projects/${projectId}?sheet_type=walkthrough`);
        setProject(response.data);
        await cacheProject(response.data);
      } else {
        console.log('📴 Offline - loading walkthrough from cache');
        const cachedProject = await loadProjectFromCache();
        if (cachedProject) {
          setProject(cachedProject);
        }
      }
    } catch (error) {
      console.error('Failed to load walkthrough:', error);
      const cachedProject = await loadProjectFromCache();
      if (cachedProject) {
        setProject(cachedProject);
      }
    } finally {
      setLoading(false);
    }
  };

  const toggleRoom = (roomId) => {
    setExpandedRooms(prev => ({ ...prev, [roomId]: !prev[roomId] }));
  };

  const toggleCategory = (categoryId) => {
    setExpandedCategories(prev => ({ ...prev, [categoryId]: !prev[categoryId] }));
  };

  const handleAddRoom = async () => {
    if (!newRoomName.trim()) return;
    try {
      await axios.post(`${API_URL}/rooms`, {
        name: newRoomName,
        project_id: projectId,
        sheet_type: 'walkthrough',
        auto_populate: true,
        color: getRoomColor(newRoomName),
        order_index: project?.rooms?.length || 0
      });
      await loadProject();
      setShowAddRoom(false);
      setNewRoomName('');
    } catch (error) {
      alert('Failed to add room');
    }
  };

  const toggleItemCheck = async (item) => {
    try {
      const newChecked = !item.checked;
      
      // Use offline-capable update
      await updateItemOffline(item.id, { checked: newChecked });
      
      // Update local state immediately
      setProject(prevProject => {
        const updatedProject = { ...prevProject };
        updatedProject.rooms = updatedProject.rooms.map(room => ({
          ...room,
          categories: room.categories.map(cat => ({
            ...cat,
            subcategories: cat.subcategories.map(sub => ({
              ...sub,
              items: sub.items.map(i => 
                i.id === item.id ? { ...i, checked: newChecked } : i
              )
            }))
          }))
        }));
        return updatedProject;
      });
      
      // Reload if online
      if (online) {
        await loadProject();
      }
    } catch (error) {
      console.error('Failed to toggle:', error);
    }
  };

  const handleDeleteItem = async (itemId) => {
    if (!window.confirm('Delete this item?')) return;
    
    try {
      await axios.delete(`${API_URL}/items/${itemId}`);
      
      // Update local state immediately
      setProject(prevProject => {
        const updatedProject = { ...prevProject };
        updatedProject.rooms = updatedProject.rooms.map(room => ({
          ...room,
          categories: room.categories.map(cat => ({
            ...cat,
            subcategories: cat.subcategories.map(sub => ({
              ...sub,
              items: sub.items.filter(i => i.id !== itemId)
            }))
          }))
        }));
        return updatedProject;
      });
      
      // Reload if online
      if (online) {
        await loadProject();
      }
    } catch (error) {
      console.error('Failed to delete:', error);
      alert('Failed to delete item');
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-full" style={{ backgroundColor: '#0F172A' }}>
      <div className="text-white">Loading Walkthrough...</div>
    </div>;
  }

  return (
    <div className="w-full h-full overflow-auto" style={{ backgroundColor: '#0F172A' }}>
      {/* OFFLINE STATUS INDICATOR */}
      {!online && (
        <div className="bg-orange-600 text-white px-4 py-2 text-center font-bold text-sm">
          📴 OFFLINE MODE - Changes will sync when online
          {pendingCount > 0 && ` (${pendingCount} pending)`}
        </div>
      )}
      
      {/* SYNC STATUS */}
      {online && syncStatus === 'syncing' && (
        <div className="bg-blue-600 text-white px-4 py-2 text-center font-bold text-sm">
          🔄 Syncing...
        </div>
      )}
      
      {online && syncStatus === 'success' && (
        <div className="bg-green-600 text-white px-4 py-2 text-center font-bold text-sm">
          ✅ Synced successfully!
        </div>
      )}
      
      {/* ACTION BUTTONS */}
      <div className="p-4 border-b border-gray-700 flex gap-2">
        <button
          onClick={() => setShowAddRoom(true)}
          className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded text-sm"
        >
          ➕ ROOM
        </button>
        
        <button
          onClick={() => setShowAddItem(true)}
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded text-sm"
        >
          ➕ ITEM
        </button>
        
        {online && pendingCount > 0 && (
          <button
            onClick={performSync}
            className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded text-sm"
          >
            🔄 ({pendingCount})
          </button>
        )}
      </div>

      {/* WALKTHROUGH TABLE - EXACT DESKTOP STRUCTURE */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse" style={{ minWidth: '800px' }}>
          <tbody>
            {project?.rooms?.map((room) => (
              <React.Fragment key={room.id}>
                {/* ROOM HEADER ROW */}
                <tr>
                  <td colSpan="6" 
                      className="border border-gray-400 px-3 py-2 text-white text-sm font-bold"
                      style={{ backgroundColor: getRoomColor(room.name) }}>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <button onClick={() => toggleRoom(room.id)} className="text-white">
                          {expandedRooms[room.id] ? '▼' : '▶'}
                        </button>
                        <span>{room.name.toUpperCase()}</span>
                      </div>
                    </div>
                  </td>
                </tr>

                {/* CATEGORIES - Show when room expanded */}
                {expandedRooms[room.id] && room.categories?.map((category) => (
                  <React.Fragment key={category.id}>
                    {/* CATEGORY HEADER ROW */}
                    <tr>
                      <td colSpan="6"
                          className="border border-gray-400 px-4 py-2 text-white text-sm font-bold"
                          style={{ backgroundColor: getCategoryColor() }}>
                        <div className="flex items-center gap-2">
                          <button onClick={() => toggleCategory(category.id)} className="text-white">
                            {expandedCategories[category.id] ? '▼' : '▶'}
                          </button>
                          <span>{category.name.toUpperCase()}</span>
                        </div>
                      </td>
                    </tr>

                    {/* HEADERS - Show when category expanded (BELOW category header) */}
                    {expandedCategories[category.id] && (
                      <tr>
                        <th className="border border-gray-400 px-3 py-2 text-xs font-bold text-white" style={{ backgroundColor: '#8b7355' }}>✓</th>
                        <th className="border border-gray-400 px-3 py-2 text-xs font-bold text-white" style={{ backgroundColor: '#8B4444' }}>ITEM NAME</th>
                        <th className="border border-gray-400 px-3 py-2 text-xs font-bold text-white" style={{ backgroundColor: '#8B4444' }}>QTY</th>
                        <th className="border border-gray-400 px-3 py-2 text-xs font-bold text-white" style={{ backgroundColor: '#8B4444' }}>SIZE</th>
                        <th className="border border-gray-400 px-3 py-2 text-xs font-bold text-white" style={{ backgroundColor: '#8B4444' }}>FINISH/COLOR</th>
                        <th className="border border-gray-400 px-3 py-2 text-xs font-bold text-white" style={{ backgroundColor: '#8B4444' }}>DELETE</th>
                      </tr>
                    )}

                    {/* ITEMS - Show when category expanded */}
                    {expandedCategories[category.id] && category.subcategories?.map((subcategory) => (
                      <React.Fragment key={subcategory.id}>
                        {subcategory.items?.map((item) => (
                          <tr key={item.id} className="hover:bg-gray-800">
                            {/* CHECKBOX */}
                            <td className="border border-gray-400 px-3 py-2 text-center">
                              <input
                                type="checkbox"
                                checked={item.checked || false}
                                onChange={() => toggleItemCheck(item)}
                                className="w-5 h-5 cursor-pointer"
                              />
                            </td>
                            
                            {/* ITEM NAME - Editable */}
                            <td className="border border-gray-400 px-3 py-2 text-white text-sm">
                              <input
                                type="text"
                                value={item.name}
                                onChange={(e) => updateItemOffline(item.id, { name: e.target.value })}
                                className="w-full bg-transparent text-white font-bold text-sm border-none focus:outline-none focus:bg-gray-800 px-1 py-1 rounded"
                              />
                              {item.vendor && <div className="text-xs text-gray-400 mt-1">{item.vendor}</div>}
                              {item.sku && <div className="text-xs text-gray-400">SKU: {item.sku}</div>}
                            </td>
                            
                            {/* QTY - Editable */}
                            <td className="border border-gray-400 px-3 py-2 text-white text-sm text-center">
                              <input
                                type="number"
                                value={item.quantity || '1'}
                                onChange={(e) => updateItemOffline(item.id, { quantity: e.target.value })}
                                className="w-full bg-transparent text-white text-sm text-center border-none focus:outline-none focus:bg-gray-800 px-1 py-1 rounded"
                                min="1"
                              />
                            </td>
                            
                            {/* SIZE - Editable */}
                            <td className="border border-gray-400 px-3 py-2 text-white text-sm">
                              <input
                                type="text"
                                value={item.size || ''}
                                onChange={(e) => updateItemOffline(item.id, { size: e.target.value })}
                                placeholder="-"
                                className="w-full bg-transparent text-white text-sm border-none focus:outline-none focus:bg-gray-800 px-1 py-1 rounded"
                              />
                            </td>
                            
                            {/* FINISH/COLOR - Editable */}
                            <td className="border border-gray-400 px-3 py-2 text-white text-sm">
                              <input
                                type="text"
                                value={item.finish_color || ''}
                                onChange={(e) => updateItemOffline(item.id, { finish_color: e.target.value })}
                                placeholder="-"
                                className="w-full bg-transparent text-white text-sm border-none focus:outline-none focus:bg-gray-800 px-1 py-1 rounded"
                              />
                            </td>
                            
                            {/* DELETE BUTTON */}
                            <td className="border border-gray-400 px-3 py-2 text-center">
                              <button 
                                onClick={() => handleDeleteItem(item.id)}
                                className="text-red-400 hover:text-red-300 text-xs"
                              >
                                🗑️
                              </button>
                            </td>
                          </tr>
                        ))}
                      </React.Fragment>
                    ))}
                  </React.Fragment>
                ))}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>

      {/* ADD ROOM MODAL */}
      {showAddRoom && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-white mb-4">Add Room</h3>
            <input
              type="text"
              value={newRoomName}
              onChange={(e) => setNewRoomName(e.target.value)}
              placeholder="Enter room name"
              className="w-full bg-gray-700 text-white px-4 py-2 rounded mb-4"
              onKeyPress={(e) => e.key === 'Enter' && handleAddRoom()}
            />
            <div className="flex gap-2">
              <button onClick={handleAddRoom} className="flex-1 bg-green-600 text-white px-4 py-2 rounded font-bold">
                Add
              </button>
              <button onClick={() => setShowAddRoom(false)} className="flex-1 bg-gray-600 text-white px-4 py-2 rounded">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* ADD ITEM MODAL */}
      {showAddItem && (
        <MobileAddItemModal
          onClose={() => setShowAddItem(false)}
          projectId={projectId}
          rooms={project?.rooms || []}
          onItemAdded={loadProject}
        />
      )}
    </div>
  );
}
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useOfflineSync } from '../hooks/useOfflineSync';
import MobileAddItemModal from './MobileAddItemModal';
import MobilePhotoCapture from './MobilePhotoCapture';
import MobileSearchFilter from './MobileSearchFilter';
import MobileQuickAddTemplates from './MobileQuickAddTemplates';
import { exportProjectToCSV, exportProjectSummary, calculateProjectStats } from '../utils/exportUtils';

const API_URL = process.env.REACT_APP_BACKEND_URL + '/api';

export default function MobileFFESpreadsheet({ projectId }) {
  const [project, setProject] = useState(null);
  const [expandedRooms, setExpandedRooms] = useState({});
  const [expandedCategories, setExpandedCategories] = useState({});
  const [loading, setLoading] = useState(true);
  const [showAddRoom, setShowAddRoom] = useState(false);
  const [showAddItem, setShowAddItem] = useState(false);
  const [showPhotoCapture, setShowPhotoCapture] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [selectedRoomForPhoto, setSelectedRoomForPhoto] = useState(null);
  const [newRoomName, setNewRoomName] = useState('');
  const [filteredProject, setFilteredProject] = useState(null);
  
  const displayProject = filteredProject || project;
  const stats = displayProject ? calculateProjectStats(displayProject) : null;
  
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

  const statuses = ['PICKED', 'ORDERED', 'SHIPPED', 'DELIVERED TO RECEIVER', 'DELIVERED TO JOB SITE', 'INSTALLED'];
  const carriers = ['FedEx', 'UPS', 'USPS', 'DHL', 'Other'];

  // EXACT SAME COLORS AS DESKTOP FFE
  const getRoomColor = (roomName) => {
    const roomColors = {
      'living room': '#8B5CF6',      // Purple/violet - EXACT DESKTOP MATCH
      'dining room': '#EAB308',
      'kitchen': '#F59E0B',
      'master bedroom': '#3B82F6',
      'bedroom': '#3B82F6',
      'bathroom': '#8B5CF6',
      'office': '#10B981',
      'guest room': '#06B6D4',
      'laundry room': '#16A34A',
      'mudroom': '#0891B2',
      'family room': '#CA8A04',
      'basement': '#6B7280',
      'attic storage': '#78716C',
      'garage': '#374151',
      'balcony': '#7C3AED'
    };
    return roomColors[roomName.toLowerCase()] || '#8B5CF6';
  };

  const getCategoryColor = () => '#065F46';

  useEffect(() => {
    loadProject();
  }, [projectId]);

  const loadProject = async () => {
    try {
      setLoading(true);
      
      if (online) {
        // Try to load from server
        const response = await axios.get(`${API_URL}/projects/${projectId}?sheet_type=ffe`);
        setProject(response.data);
        // Cache for offline use
        await cacheProject(response.data);
      } else {
        // Load from offline cache
        console.log('📴 Offline - loading from cache');
        const cachedProject = await loadProjectFromCache();
        if (cachedProject) {
          setProject(cachedProject);
        } else {
          console.error('No cached data available');
        }
      }
    } catch (error) {
      console.error('Failed to load FFE:', error);
      // Try loading from cache on error
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
        sheet_type: 'ffe',
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

  const updateItem = async (itemId, data) => {
    try {
      // Use offline-capable update
      await updateItemOffline(itemId, data);
      
      // Update local state immediately for responsive UI
      setProject(prevProject => {
        const updatedProject = { ...prevProject };
        updatedProject.rooms = updatedProject.rooms.map(room => ({
          ...room,
          categories: room.categories.map(cat => ({
            ...cat,
            subcategories: cat.subcategories.map(sub => ({
              ...sub,
              items: sub.items.map(item => 
                item.id === itemId ? { ...item, ...data } : item
              )
            }))
          }))
        }));
        return updatedProject;
      });
      
      // Reload from server if online
      if (online) {
        await loadProject();
      }
    } catch (error) {
      console.error('Update failed:', error);
    }
  };

  const toggleItemCheck = (item) => updateItem(item.id, { checked: !item.checked });

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
      <div className="text-white">Loading FF&E...</div>
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
      <div className="p-4 border-b border-gray-700 flex flex-wrap gap-2">
        <button
          onClick={() => setShowAddRoom(true)}
          className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-3 rounded text-sm"
        >
          ➕ ROOM
        </button>
        
        <button
          onClick={() => setShowAddItem(true)}
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-3 rounded text-sm"
        >
          ➕ ITEM
        </button>
        
        <button
          onClick={() => setShowQuickAdd(true)}
          className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-3 rounded text-sm"
        >
          ⚡ TEMPLATES
        </button>
        
        <button
          onClick={() => {
            if (project?.rooms?.length > 0) {
              setSelectedRoomForPhoto(project.rooms[0]);
              setShowPhotoCapture(true);
            } else {
              alert('Please add a room first');
            }
          }}
          className="flex-1 bg-orange-600 hover:bg-orange-700 text-white font-bold py-2 px-3 rounded text-sm"
        >
          📸 PHOTO
        </button>
        
        <button
          onClick={() => setShowSearch(!showSearch)}
          className={`flex-1 ${showSearch ? 'bg-yellow-600' : 'bg-gray-600'} hover:bg-yellow-700 text-white font-bold py-2 px-3 rounded text-sm`}
        >
          🔍 SEARCH
        </button>
        
        {online && pendingCount > 0 && (
          <button
            onClick={performSync}
            className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-3 rounded text-sm"
          >
            🔄 ({pendingCount})
          </button>
        )}
      </div>
      
      {/* SEARCH & FILTER PANEL */}
      {showSearch && (
        <MobileSearchFilter 
          project={project} 
          onFilterChange={setFilteredProject} 
        />
      )}
      
      {/* STATS BAR */}
      {stats && !showStats && (
        <div className="px-4 py-2 bg-gray-800 border-b border-gray-700 flex justify-between items-center text-xs">
          <div className="text-gray-400">
            <span className="text-white font-bold">{stats.totalItems}</span> items
          </div>
          <div className="text-gray-400">
            Progress: <span className="text-yellow-400 font-bold">{stats.completionPercentage}%</span>
          </div>
          <button
            onClick={() => setShowStats(true)}
            className="text-blue-400 hover:text-blue-300"
          >
            Details →
          </button>
        </div>
      )}

      {/* STATS MODAL */}
      {showStats && stats && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-white">📊 FFE Stats</h3>
              <button
                onClick={() => setShowStats(false)}
                className="text-white text-2xl hover:text-red-400"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="bg-gray-700 p-4 rounded">
                <div className="text-gray-400 text-sm">Total Items</div>
                <div className="text-white text-2xl font-bold">{stats.totalItems}</div>
              </div>
              
              <div className="bg-gray-700 p-4 rounded">
                <div className="text-gray-400 text-sm">Progress</div>
                <div className="flex items-baseline gap-2">
                  <div className="text-green-400 text-2xl font-bold">{stats.completionPercentage}%</div>
                </div>
              </div>
              
              <div className="bg-gray-700 p-4 rounded">
                <div className="text-gray-400 text-sm mb-2">Breakdown</div>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between text-white">
                    <span>Rooms:</span>
                    <span className="font-bold">{stats.totalRooms}</span>
                  </div>
                  <div className="flex justify-between text-white">
                    <span>Categories:</span>
                    <span className="font-bold">{stats.totalCategories}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    exportProjectToCSV(project);
                    alert('✅ CSV exported!');
                  }}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded font-bold text-sm"
                >
                  📄 Export CSV
                </button>
                <button
                  onClick={() => {
                    exportProjectSummary(project);
                    alert('✅ Summary exported!');
                  }}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded font-bold text-sm"
                >
                  📋 Summary
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* FFE TABLE - EXACT DESKTOP STRUCTURE */}
      <div className="overflow-x-auto">
        <table className="border-collapse" style={{ width: 'auto', minWidth: '100%', tableLayout: 'auto' }}>
          <tbody>
            {displayProject?.rooms?.map((room) => (
              <React.Fragment key={room.id}>
                {/* ROOM HEADER ROW */}
                <tr>
                  <td colSpan="15" 
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

                {/* CATEGORIES */}
                {expandedRooms[room.id] && room.categories?.map((category) => (
                  <React.Fragment key={category.id}>
                    {/* CATEGORY HEADER ROW */}
                    <tr>
                      <td colSpan="15"
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

                    {/* SHOW HEADERS WHEN CATEGORY IS EXPANDED - BELOW CATEGORY HEADER */}
                    {expandedCategories[category.id] && (
                      <React.Fragment>
                        {/* ROW 1: Section Headers (Brown and Purple) */}
                        <tr>
                          <td colSpan="4" className="border-gray-400 px-2 py-1 text-xs font-bold text-white text-center" 
                              style={{ backgroundColor: '#8B4444', borderLeft: '1px solid #9CA3AF', borderRight: 'none', borderTop: '1px solid #9CA3AF', borderBottom: '1px solid #9CA3AF' }}>
                          </td>
                          <td colSpan="3" className="border border-gray-400 px-2 py-1 text-xs font-bold text-white text-center" 
                              style={{ backgroundColor: '#8B4513' }}>
                            ADDITIONAL INFO.
                          </td>
                          <td colSpan="5" className="border border-gray-400 px-2 py-1 text-xs font-bold text-white text-center" 
                              style={{ backgroundColor: '#6B46C1' }}>
                            SHIPPING INFO.
                          </td>
                          <td colSpan="3" className="border-gray-400 px-2 py-1 text-xs font-bold text-white text-center" 
                              style={{ backgroundColor: '#8B4444', borderRight: '1px solid #9CA3AF', borderLeft: 'none', borderTop: '1px solid #9CA3AF', borderBottom: '1px solid #9CA3AF' }}>
                          </td>
                        </tr>
                        
                        {/* ROW 2: Column Headers (Red Row) */}
                        <tr>
                          <td className="border border-gray-400 px-2 py-2 text-xs font-bold text-white" style={{ backgroundColor: '#8B4444' }}>INSTALLED</td>
                          <td className="border border-gray-400 px-2 py-2 text-xs font-bold text-white" style={{ backgroundColor: '#8B4444' }}>QTY</td>
                          <td className="border border-gray-400 px-2 py-2 text-xs font-bold text-white" style={{ backgroundColor: '#8B4444' }}>SIZE</td>
                          <td className="border border-gray-400 px-2 py-2 text-xs font-bold text-white" style={{ backgroundColor: '#6B46C1' }}>STATUS</td>
                          <td className="border border-gray-400 px-2 py-2 text-xs font-bold text-white" style={{ backgroundColor: '#8B4444' }}>VENDOR</td>
                          <td className="border border-gray-400 px-2 py-2 text-xs font-bold text-white" style={{ backgroundColor: '#8B4444' }}>IMAGE</td>
                          <td className="border border-gray-400 px-2 py-2 text-xs font-bold text-white" style={{ backgroundColor: '#8B4444' }}>LINK</td>
                          <td className="border border-gray-400 px-2 py-2 text-xs font-bold text-white" style={{ backgroundColor: '#6B46C1' }}>ORDER DATE</td>
                          <td className="border border-gray-400 px-2 py-2 text-xs font-bold text-white" style={{ backgroundColor: '#6B46C1' }}>STATUS/ORDER#</td>
                          <td className="border border-gray-400 px-2 py-2 text-xs font-bold text-white" style={{ backgroundColor: '#6B46C1' }}>EST DATES</td>
                          <td className="border border-gray-400 px-2 py-2 text-xs font-bold text-white" style={{ backgroundColor: '#6B46C1' }}>INSTALL/SHIP TO</td>
                          <td className="border border-gray-400 px-2 py-2 text-xs font-bold text-white" style={{ backgroundColor: '#6B46C1' }}>TRACKING/CARRIER</td>
                          <td className="border border-gray-400 px-2 py-2 text-xs font-bold text-white" style={{ backgroundColor: '#8B4444' }}>NOTES</td>
                          <td className="border border-gray-400 px-2 py-2 text-xs font-bold text-white" style={{ backgroundColor: '#8B4444' }}>LINK</td>
                          <td className="border border-gray-400 px-2 py-2 text-xs font-bold text-white" style={{ backgroundColor: '#DC2626' }}>DELETE</td>
                        </tr>
                      </React.Fragment>
                    )}

                    {/* ITEMS - Only show when category is expanded */}
                    {expandedCategories[category.id] && category.subcategories?.map((subcategory) => (
                      <React.Fragment key={subcategory.id}>
                        {subcategory.items?.map((item) => (
                          <tr key={item.id} className="hover:bg-gray-800">
                            {/* INSTALLED - Click to Edit */}
                            <td className="border border-gray-400 px-2 py-2 text-white text-sm whitespace-nowrap">
                              <div
                                contentEditable
                                suppressContentEditableWarning
                                onBlur={(e) => updateItem(item.id, { name: e.target.textContent })}
                                className="font-bold outline-none focus:bg-gray-800 focus:ring-1 focus:ring-blue-500 px-1 py-1 rounded"
                                style={{ minWidth: 'max-content' }}
                              >
                                {item.name}
                              </div>
                            </td>
                            
                            {/* QTY - Click to Edit */}
                            <td className="border border-gray-400 px-2 py-2 text-white text-sm text-center whitespace-nowrap">
                              <div
                                contentEditable
                                suppressContentEditableWarning
                                onBlur={(e) => updateItem(item.id, { quantity: e.target.textContent })}
                                className="outline-none focus:bg-gray-800 focus:ring-1 focus:ring-blue-500 px-1 py-1 rounded inline-block"
                                style={{ minWidth: 'max-content' }}
                              >
                                {item.quantity || '-'}
                              </div>
                            </td>
                            
                            {/* SIZE - Click to Edit */}
                            <td className="border border-gray-400 px-2 py-2 text-white text-sm whitespace-nowrap">
                              <div
                                contentEditable
                                suppressContentEditableWarning
                                onBlur={(e) => updateItem(item.id, { size: e.target.textContent })}
                                className="outline-none focus:bg-gray-800 focus:ring-1 focus:ring-blue-500 px-1 py-1 rounded"
                                style={{ minWidth: 'max-content' }}
                              >
                                {item.size || '-'}
                              </div>
                            </td>
                            
                            {/* STATUS */}
                            <td className="border border-gray-400 px-2 py-2">
                              <select
                                value={item.status || ''}
                                onChange={(e) => updateItem(item.id, { status: e.target.value })}
                                className="w-full bg-gray-700 text-white text-xs px-1 py-1 rounded border-none"
                              >
                                <option value="">Select</option>
                                {statuses.map(s => <option key={s} value={s}>{s}</option>)}
                              </select>
                            </td>
                            
                            {/* VENDOR - Click to Edit */}
                            <td className="border border-gray-400 px-2 py-2 text-white text-sm">
                              <div 
                                contentEditable
                                suppressContentEditableWarning
                                onBlur={(e) => updateItem(item.id, { vendor: e.target.textContent })}
                                className="text-xs outline-none focus:bg-gray-800 focus:ring-1 focus:ring-blue-500 px-1 py-1 rounded min-w-[80px]"
                              >
                                {item.vendor || '-'}
                              </div>
                              {item.sku && <div className="text-xs text-gray-400">SKU: {item.sku}</div>}
                            </td>
                            
                            {/* IMAGE */}
                            <td className="border border-gray-400 px-2 py-2">
                              {item.image_url ? (
                                <img src={item.image_url} alt={item.name} className="w-12 h-12 object-cover rounded" />
                              ) : (
                                <div className="w-12 h-12 bg-gray-700 rounded flex items-center justify-center text-xs">No Img</div>
                              )}
                            </td>
                            
                            {/* LINK */}
                            <td className="border border-gray-400 px-2 py-2">
                              {item.link && (
                                <a href={item.link} target="_blank" rel="noopener noreferrer" className="text-blue-400 text-xs">
                                  🔗
                                </a>
                              )}
                            </td>
                            
                            {/* ORDER DATE */}
                            <td className="border border-gray-400 px-2 py-2 text-white text-xs">
                              <input
                                type="date"
                                value={item.order_date || ''}
                                onChange={(e) => updateItem(item.id, { order_date: e.target.value })}
                                className="w-full bg-transparent text-white text-xs border-none"
                              />
                            </td>
                            
                            {/* STATUS/ORDER# - STACKED */}
                            <td className="border border-gray-400 px-1 py-1">
                              <div className="flex flex-col gap-1">
                                <select
                                  value={item.status || ''}
                                  onChange={(e) => updateItem(item.id, { status: e.target.value })}
                                  className="w-full bg-gray-700 text-white text-xs px-1 py-1 rounded"
                                >
                                  <option value="">Status</option>
                                  {statuses.map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                                <input
                                  type="text"
                                  placeholder="Order #"
                                  value={item.order_number || ''}
                                  onChange={(e) => updateItem(item.id, { order_number: e.target.value })}
                                  className="w-full bg-gray-700 text-white text-xs px-1 py-1 rounded"
                                />
                              </div>
                            </td>
                            
                            {/* EST DATES - STACKED */}
                            <td className="border border-gray-400 px-1 py-1">
                              <div className="flex flex-col gap-1">
                                <input
                                  type="date"
                                  placeholder="Ship"
                                  className="w-full bg-transparent text-white text-xs border-none"
                                />
                                <input
                                  type="date"
                                  placeholder="Delivery"
                                  value={item.delivery_date || ''}
                                  onChange={(e) => updateItem(item.id, { delivery_date: e.target.value })}
                                  className="w-full bg-transparent text-white text-xs border-none"
                                />
                              </div>
                            </td>
                            
                            {/* INSTALL/SHIP TO - STACKED */}
                            <td className="border border-gray-400 px-1 py-1">
                              <div className="flex flex-col gap-1">
                                <input
                                  type="date"
                                  placeholder="Install"
                                  className="w-full bg-transparent text-white text-xs border-none"
                                />
                                <select className="w-full bg-gray-700 text-white text-xs px-1 py-1 rounded">
                                  <option value="">Ship To</option>
                                  <option value="JOB SITE">JOB SITE</option>
                                  <option value="RECEIVER">RECEIVER</option>
                                </select>
                              </div>
                            </td>
                            
                            {/* TRACKING/CARRIER - STACKED */}
                            <td className="border border-gray-400 px-1 py-1">
                              <div className="flex flex-col gap-1">
                                <input
                                  type="text"
                                  placeholder="Tracking #"
                                  value={item.tracking_number || ''}
                                  onChange={(e) => updateItem(item.id, { tracking_number: e.target.value })}
                                  className="w-full bg-gray-700 text-white text-xs px-1 py-1 rounded"
                                />
                                <select
                                  value={item.carrier || ''}
                                  onChange={(e) => updateItem(item.id, { carrier: e.target.value })}
                                  className="w-full bg-gray-700 text-white text-xs px-1 py-1 rounded"
                                >
                                  <option value="">Carrier</option>
                                  {carriers.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                              </div>
                            </td>
                            
                            {/* NOTES */}
                            <td className="border border-gray-400 px-2 py-2">
                              <input
                                type="text"
                                placeholder="Notes"
                                value={item.notes || ''}
                                onChange={(e) => updateItem(item.id, { notes: e.target.value })}
                                className="w-full bg-gray-700 text-white text-xs px-1 py-1 rounded"
                              />
                            </td>
                            
                            {/* LINK */}
                            <td className="border border-gray-400 px-2 py-2">
                              {item.link ? (
                                <a href={item.link} target="_blank" rel="noopener noreferrer" className="text-blue-400 text-xs">
                                  View
                                </a>
                              ) : (
                                <span className="text-gray-500 text-xs">-</span>
                              )}
                            </td>
                            
                            {/* DELETE */}
                            <td className="border border-gray-400 px-2 py-2 text-center">
                              <button 
                                onClick={() => handleDeleteItem(item.id)}
                                className="text-red-400 hover:text-red-300 text-sm font-bold"
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
      
      {/* PHOTO CAPTURE */}
      {showPhotoCapture && selectedRoomForPhoto && (
        <MobilePhotoCapture
          projectId={projectId}
          roomId={selectedRoomForPhoto.id}
          onPhotoAdded={loadProject}
          onClose={() => {
            setShowPhotoCapture(false);
            setSelectedRoomForPhoto(null);
          }}
        />
      )}
      
      {/* QUICK ADD TEMPLATES */}
      {showQuickAdd && (
        <MobileQuickAddTemplates
          onClose={() => setShowQuickAdd(false)}
          projectId={projectId}
          rooms={project?.rooms || []}
          onComplete={loadProject}
        />
      )}
    </div>
  );
}
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useOfflineSync } from '../hooks/useOfflineSync';
import MobileAddItemModal from './MobileAddItemModal';
import MobilePhotoCapture from './MobilePhotoCapture';
import MobileSearchFilter from './MobileSearchFilter';
import MobileQuickAddTemplates from './MobileQuickAddTemplates';
import SimplePhotoCapture from './SimplePhotoCapture';
import { exportProjectToCSV, exportProjectSummary, calculateProjectStats } from '../utils/exportUtils';

const API_URL = process.env.REACT_APP_BACKEND_URL + '/api';

export default function MobileWalkthroughSpreadsheet({ projectId }) {
  const [project, setProject] = useState(null);
  const [expandedRooms, setExpandedRooms] = useState({});
  const [expandedCategories, setExpandedCategories] = useState({});
  const [loading, setLoading] = useState(true);
  const [showAddRoom, setShowAddRoom] = useState(false);
  const [showAddItem, setShowAddItem] = useState(false);
  const [showPhotoCapture, setShowPhotoCapture] = useState(false);
  const [showPhotoManagement, setShowPhotoManagement] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [selectedRoomForPhoto, setSelectedRoomForPhoto] = useState(null);
  const [newRoomName, setNewRoomName] = useState('');
  const [filteredProject, setFilteredProject] = useState(null);
  const [availableCategories, setAvailableCategories] = useState([]);
  
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

  // EXACT SAME ROOM COLORS AS DESKTOP CHECKLIST - MATCHING DESKTOP VERSION
  const getRoomColor = (roomName, index = 0) => {
    const mutedColors = [
      '#8B5A6B',  // Muted rose
      '#6B7C93',  // Muted blue
      '#7A8B5A',  // Muted olive
      '#9B6B8B',  // Muted purple
      '#8B7A5A',  // Muted brown
      '#5A8B7A',  // Muted teal
      '#8B5A7A',  // Muted mauve
      '#7A5A8B',  // Muted violet
      '#5A7A8B',  // Muted slate
      '#8B6B5A'   // Muted tan
    ];
    
    // Use room name hash for consistent color per room
    let hash = 0;
    for (let i = 0; i < roomName.length; i++) {
      hash = roomName.charCodeAt(i) + ((hash << 5) - hash);
    }
    return mutedColors[Math.abs(hash) % mutedColors.length];
  };

  const getCategoryColor = () => '#065F46'; // Dark green - EXACT SAME

  useEffect(() => {
    loadProject();
  }, [projectId]);

  // Load available categories for dropdown
  useEffect(() => {
    const loadAvailableCategories = async () => {
      try {
        const response = await axios.get(`${API_URL}/category-options`);
        setAvailableCategories(response.data || []);
      } catch (error) {
        console.error('Failed to load available categories:', error);
      }
    };
    loadAvailableCategories();
  }, []);

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

  const handleAddCategory = async (roomId, categoryName) => {
    try {
      await axios.post(`${API_URL}/categories`, {
        name: categoryName,
        room_id: roomId,
        project_id: projectId,
        sheet_type: 'walkthrough'
      });
      await loadProject();
    } catch (error) {
      console.error('Failed to add category:', error);
      alert('Failed to add category');
    }
  };

  const handleDeleteCategory = async (categoryId) => {
    if (!window.confirm('Delete this category and all its items?')) return;
    
    try {
      await axios.delete(`${API_URL}/categories/${categoryId}`);
      await loadProject();
    } catch (error) {
      console.error('Failed to delete category:', error);
      alert('Failed to delete category');
    }
  };

  const handleDeleteSubcategory = async (subcategoryId) => {
    try {
      await axios.delete(`${API_URL}/subcategories/${subcategoryId}`);
      await loadProject();
    } catch (error) {
      console.error('Failed to delete subcategory:', error);
      alert('Failed to delete subcategory');
    }
  };

  const handleSendPhotosToCanva = async () => {
    const confirmed = window.confirm('Send all Walkthrough photos to Canva?');
    if (!confirmed) return;

    try {
      const response = await axios.post(`${API_URL}/canva/upload-walkthrough-photos`, {
        project_id: projectId
      });

      if (response.data.success) {
        alert(`✅ ${response.data.message}\n\nUploaded: ${response.data.uploaded_count} photos`);
      } else {
        alert(`⚠️ ${response.data.message}`);
      }
    } catch (error) {
      console.error('Failed to send photos to Canva:', error);
      if (error.response?.status === 401) {
        alert('❌ Not connected to Canva.\n\nPlease connect to Canva first from the Checklist page on desktop.');
      } else {
        alert('❌ Failed to send photos to Canva. Please try again.');
      }
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
      {/* EXACT DESKTOP HEADER STYLE */}
      <div className="bg-gradient-to-r from-[#1E293B] to-[#0F172A] p-6 border-b-4 border-[#D4A574] shadow-2xl">
        <div className="max-w-7xl mx-auto">
          {/* Project Name - Large and Prominent */}
          <div className="text-center mb-6">
            <h1 className="text-5xl font-bold text-[#D4A574] mb-2 tracking-wide">
              {displayProject?.name || 'PROJECT NAME'}
            </h1>
            <div className="text-xl text-[#D4C5A9] font-medium">
              {displayProject?.client_info?.full_name || 'Client Name'} • {displayProject?.client_info?.address || 'Address'}
            </div>
            <div className="text-lg text-[#B49B7E] mt-2">
              {displayProject?.client_info?.phone || ''} • {displayProject?.client_info?.email || ''}
            </div>
          </div>
          
          {/* Spreadsheet Type Header */}
          <div className="text-center">
            <div className="inline-block bg-gradient-to-r from-[#D4A574] to-[#B49B7E] px-8 py-3 rounded-full">
              <span className="text-2xl font-bold text-black tracking-wider">WALKTHROUGH SPREADSHEET</span>
            </div>
          </div>
        </div>
      </div>
      
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
      
      {/* SIMPLE PHOTO BUTTON - MINIMAL AT TOP */}
      <div className="p-4 bg-[#1E293B] border-b border-[#D4A574]/30">
        <button
          onClick={() => setShowPhotoManagement(true)}
          className="bg-gradient-to-br from-[#D4A574] to-[#B48554] hover:from-[#E4B584] hover:to-[#C49564] text-black px-8 py-3 rounded-xl font-bold text-lg shadow-xl"
        >
          📸 PHOTOS & MEASUREMENTS
        </button>
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
            <span className="text-green-400 font-bold">{stats.checkedItems}</span> checked
          </div>
          <div className="text-gray-400">
            <span className="text-yellow-400 font-bold">{stats.completionPercentage}%</span> complete
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
              <h3 className="text-xl font-bold text-white">📊 Project Stats</h3>
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
                <div className="text-gray-400 text-sm">Completion</div>
                <div className="flex items-baseline gap-2">
                  <div className="text-green-400 text-2xl font-bold">{stats.completionPercentage}%</div>
                  <div className="text-gray-400 text-sm">
                    ({stats.checkedItems}/{stats.totalItems})
                  </div>
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

      {/* WALKTHROUGH TABLE - EXACT DESKTOP STRUCTURE FOR 13" IPAD */}
      <div className="overflow-x-auto">
        {displayProject?.rooms?.map((room) => (
          <React.Fragment key={room.id}>
            {/* ROOM HEADER - Exact like desktop */}
            <div className="mb-6">
              <div 
                className="border border-[#B49B7E] p-3 font-bold text-[#D4C5A9] text-lg shadow-lg shadow-[#B49B7E]/10"
                style={{ backgroundColor: getRoomColor(room.name) }}
              >
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <button onClick={() => toggleRoom(room.id)} className="text-[#D4C5A9] text-xl">
                      {expandedRooms[room.id] ? '▼' : '▶'}
                    </button>
                    <span className="text-xl font-bold">{room.name.toUpperCase()}</span>
                  </div>
                  <div className="text-sm text-[#D4C5A9]">
                    {room.categories?.length || 0} categories
                  </div>
                </div>
              </div>

              {/* CATEGORIES - Show when room expanded */}
              {expandedRooms[room.id] && room.categories?.map((category) => (
                <div key={category.id} className="mt-4">
                  {/* CATEGORY HEADER - Exact like desktop */}
                  <div 
                    className="border border-[#B49B7E] p-2 font-bold text-[#D4C5A9] shadow-lg shadow-[#B49B7E]/10"
                    style={{ backgroundColor: getCategoryColor() }}
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <button onClick={() => toggleCategory(category.id)} className="text-[#D4C5A9]">
                          {expandedCategories[category.id] ? '▼' : '▶'}
                        </button>
                        <span className="font-bold">{category.name.toUpperCase()}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <select
                          onChange={(e) => {
                            if (e.target.value) {
                              handleAddCategory(room.id, e.target.value);
                              e.target.value = '';
                            }
                          }}
                          className="bg-green-600 text-[#B49B7E] text-xs px-2 py-1 rounded border-none"
                        >
                          <option value="">+ Add Category</option>
                          {availableCategories.map(categoryName => (
                            <option key={categoryName} value={categoryName}>
                              {categoryName}
                            </option>
                          ))}
                        </select>
                        <button
                          onClick={() => handleDeleteCategory(category.id)}
                          className="text-red-300 hover:text-red-100 text-lg"
                          title="Delete Category"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* SUBCATEGORIES - Show when category expanded - EXACT DESKTOP TABLE */}
                  {expandedCategories[category.id] && category.subcategories?.map((subcategory) => (
                    <React.Fragment key={subcategory.id || subcategory.name}>
                      <table className="w-full border-collapse border border-[#B49B7E] mb-4 mt-2 shadow-lg shadow-[#B49B7E]/10">
                        <thead>
                          <tr>
                            <th className="border border-[#B49B7E] px-1 py-2 text-xs font-bold text-[#D4C5A9] w-8 shadow-inner shadow-[#B49B7E]/20" style={{ backgroundColor: '#8B4444' }}>✓</th>
                            <th className="border border-[#B49B7E] px-2 py-2 text-xs font-bold text-[#D4C5A9] shadow-inner shadow-[#B49B7E]/20" style={{ backgroundColor: '#8B4444' }}>
                              {subcategory.name.toUpperCase()}
                              <button
                                onClick={() => {
                                  setSelectedSubCategoryId(subcategory.id);
                                  setShowAddItem(true);
                                }}
                                className="ml-2 bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded text-xs font-bold"
                                title={`Add item to ${subcategory.name}`}
                              >
                                + ADD ITEM
                              </button>
                              <button
                                onClick={() => {
                                  if (window.confirm(`Delete subcategory "${subcategory.name}" and all its items?`)) {
                                    handleDeleteSubcategory(subcategory.id);
                                  }
                                }}
                                className="ml-2 text-[#B49B7E] hover:text-red-200 text-xs"
                                title={`Delete ${subcategory.name} subcategory`}
                              >
                                🗑️
                              </button>
                            </th>
                            <th className="border border-[#B49B7E] px-2 py-2 text-xs font-bold text-[#B49B7E] shadow-inner shadow-[#B49B7E]/20" style={{ backgroundColor: '#8B4444' }}>VENDOR/SKU</th>
                            <th className="border border-[#B49B7E] px-2 py-2 text-xs font-bold text-[#B49B7E] w-16 shadow-inner shadow-[#B49B7E]/20" style={{ backgroundColor: '#8B4444' }}>QTY</th>
                            <th className="border border-[#B49B7E] px-2 py-2 text-xs font-bold text-[#B49B7E] shadow-inner shadow-[#B49B7E]/20" style={{ backgroundColor: '#8B4444' }}>SIZE</th>
                            <th className="border border-[#B49B7E] px-2 py-2 text-xs font-bold text-[#B49B7E] shadow-inner shadow-[#B49B7E]/20" style={{ backgroundColor: '#8B4444' }}>FINISH/COLOR</th>
                            <th className="border border-[#B49B7E] px-2 py-2 text-xs font-bold text-[#B49B7E] shadow-inner shadow-[#B49B7E]/20" style={{ backgroundColor: '#8B4444' }}>COST</th>
                            <th className="border border-[#B49B7E] px-2 py-2 text-xs font-bold text-[#B49B7E] shadow-inner shadow-[#B49B7E]/20" style={{ backgroundColor: '#8B4444' }}>STATUS</th>
                            <th className="border border-[#B49B7E] px-2 py-2 text-xs font-bold text-[#B49B7E] w-20 shadow-inner shadow-[#B49B7E]/20" style={{ backgroundColor: '#8B4444' }}>IMAGE</th>
                            <th className="border border-[#B49B7E] px-2 py-2 text-xs font-bold text-[#B49B7E] w-24 shadow-inner shadow-[#B49B7E]/20" style={{ backgroundColor: '#8B4444' }}>PRODUCT LINK</th>
                            <th className="border border-[#B49B7E] px-2 py-2 text-xs font-bold text-[#B49B7E] shadow-inner shadow-[#B49B7E]/20" style={{ backgroundColor: '#8B4444' }}>REMARKS</th>
                            <th className="border border-[#B49B7E] px-2 py-2 text-xs font-bold text-[#B49B7E] w-12 shadow-inner shadow-[#B49B7E]/20" style={{ backgroundColor: '#8B4444' }}>DELETE</th>
                          </tr>
                        </thead>
                        <tbody>
                          {/* ITEMS UNDER THIS SUBCATEGORY - Exact like desktop */}
                          {subcategory.items?.map((item, itemIndex) => (
                            <tr key={item.id} style={{ 
                              background: itemIndex % 2 === 0 
                                ? 'linear-gradient(135deg, rgba(0, 0, 0, 0.95) 0%, rgba(30, 30, 30, 0.9) 30%, rgba(15, 15, 25, 0.95) 70%, rgba(0, 0, 0, 0.95) 100%)'
                                : 'linear-gradient(135deg, rgba(15, 15, 25, 0.95) 0%, rgba(45, 45, 55, 0.9) 30%, rgba(25, 25, 35, 0.95) 70%, rgba(15, 15, 25, 0.95) 100%)'
                            }}>
                              {/* CHECKBOX - AUTO SET TO PICKED */}
                              <td className="border border-[#B49B7E] px-1 py-1 text-center w-8">
                                <input 
                                  type="checkbox" 
                                  className="w-4 h-4 cursor-pointer" 
                                  checked={item.status === 'PICKED'}
                                  onChange={async (e) => {
                                    const newStatus = e.target.checked ? 'PICKED' : '';
                                    await updateItemOffline(item.id, { status: newStatus });
                                    
                                    // Update local state immediately
                                    setProject(prevProject => {
                                      const updatedProject = JSON.parse(JSON.stringify(prevProject));
                                      updatedProject.rooms = updatedProject.rooms.map(r => ({
                                        ...r,
                                        categories: r.categories.map(c => ({
                                          ...c,
                                          subcategories: c.subcategories.map(s => ({
                                            ...s,
                                            items: s.items.map(i => 
                                              i.id === item.id ? { ...i, status: newStatus } : i
                                            )
                                          }))
                                        }))
                                      }));
                                      return updatedProject;
                                    });
                                  }}
                                />
                              </td>
                              
                              {/* ITEM NAME - EDITABLE */}
                              <td className="border border-[#B49B7E] px-2 py-1 text-[#B49B7E] text-sm">
                                <div 
                                  contentEditable={true}
                                  suppressContentEditableWarning={true}
                                  className="w-full bg-transparent text-[#B49B7E] text-sm outline-none"
                                  onBlur={(e) => updateItemOffline(item.id, { name: e.target.textContent })}
                                >
                                  {item.name}
                                </div>
                              </td>
                              
                              {/* VENDOR/SKU - EDITABLE */}
                              <td className="border border-[#B49B7E] px-2 py-1 text-[#B49B7E] text-sm">
                                <div 
                                  contentEditable={true}
                                  suppressContentEditableWarning={true}
                                  className="w-full bg-transparent text-[#B49B7E] text-sm outline-none"
                                  onBlur={(e) => updateItemOffline(item.id, { vendor: e.target.textContent })}
                                >
                                  {item.vendor ? `${item.vendor}${item.sku ? ` / ${item.sku}` : ''}` : item.sku || ''}
                                </div>
                              </td>
                              
                              {/* QTY - EDITABLE */}
                              <td className="border border-[#B49B7E] px-2 py-1 text-[#B49B7E] text-sm text-center">
                                <div 
                                  contentEditable={true}
                                  suppressContentEditableWarning={true}
                                  className="w-full bg-transparent text-[#B49B7E] text-sm text-center outline-none"
                                  onBlur={(e) => updateItemOffline(item.id, { quantity: e.target.textContent })}
                                >
                                  {item.quantity || ''}
                                </div>
                              </td>
                              
                              {/* SIZE - EDITABLE */}
                              <td className="border border-[#B49B7E] px-2 py-1 text-[#B49B7E] text-sm">
                                <div 
                                  contentEditable={true}
                                  suppressContentEditableWarning={true}
                                  className="w-full bg-transparent text-[#B49B7E] text-sm outline-none"
                                  onBlur={(e) => updateItemOffline(item.id, { size: e.target.textContent })}
                                >
                                  {item.size || ''}
                                </div>
                              </td>
                              
                              {/* FINISH/COLOR - EDITABLE */}
                              <td className="border border-[#B49B7E] px-2 py-1 text-[#B49B7E] text-sm">
                                <div 
                                  contentEditable={true}
                                  suppressContentEditableWarning={true}
                                  className="w-full bg-transparent text-[#B49B7E] text-sm outline-none"
                                  onBlur={(e) => updateItemOffline(item.id, { finish_color: e.target.textContent })}
                                >
                                  {item.finish_color || ''}
                                </div>
                              </td>
                              
                              {/* COST - EDITABLE */}
                              <td className="border border-[#B49B7E] px-2 py-1 text-[#B49B7E] text-sm">
                                <div 
                                  contentEditable={true}
                                  suppressContentEditableWarning={true}
                                  className="w-full bg-transparent text-[#B49B7E] text-sm outline-none"
                                  onBlur={(e) => updateItemOffline(item.id, { cost: e.target.textContent })}
                                >
                                  {item.cost || ''}
                                </div>
                              </td>
                              
                              {/* STATUS - DROPDOWN */}
                              <td className="border border-[#B49B7E] px-1 py-1">
                                <select
                                  value={item.status || ''}
                                  onChange={(e) => updateItemOffline(item.id, { status: e.target.value })}
                                  className="w-full bg-gray-700 text-[#B49B7E] text-xs px-1 py-1 rounded border-none"
                                >
                                  <option value="">Select Status</option>
                                  <option value="PICKED">PICKED</option>
                                  <option value="TO BE PICKED">TO BE PICKED</option>
                                  <option value="ORDER SAMPLES">ORDER SAMPLES</option>
                                  <option value="SAMPLES ARRIVED">SAMPLES ARRIVED</option>
                                  <option value="ASK NEIL">ASK NEIL</option>
                                  <option value="ASK CHARLENE">ASK CHARLENE</option>
                                  <option value="ASK JALA">ASK JALA</option>
                                  <option value="GET QUOTE">GET QUOTE</option>
                                  <option value="WAITING ON QT">WAITING ON QT</option>
                                  <option value="READY FOR PRESENTATION">READY FOR PRESENTATION</option>
                                </select>
                              </td>
                              
                              {/* IMAGE */}
                              <td className="border border-[#B49B7E] px-1 py-1 text-center w-20">
                                {item.image_url ? (
                                  <img src={item.image_url} alt={item.name} className="w-12 h-12 object-cover rounded" />
                                ) : (
                                  <div className="w-12 h-12 bg-gray-700 rounded flex items-center justify-center text-xs text-[#B49B7E]">No Image</div>
                                )}
                              </td>
                              
                              {/* PRODUCT LINK */}
                              <td className="border border-[#B49B7E] px-1 py-1 text-center w-24">
                                {item.link ? (
                                  <a href={item.link} target="_blank" rel="noopener noreferrer" className="text-[#D4A574] text-xs hover:underline">
                                    🔗 View
                                  </a>
                                ) : (
                                  <span className="text-gray-500 text-xs">-</span>
                                )}
                              </td>
                              
                              {/* REMARKS - EDITABLE */}
                              <td className="border border-[#B49B7E] px-2 py-1 text-[#B49B7E] text-sm">
                                <div 
                                  contentEditable={true}
                                  suppressContentEditableWarning={true}
                                  className="w-full bg-transparent text-[#B49B7E] text-sm outline-none"
                                  onBlur={(e) => updateItemOffline(item.id, { notes: e.target.textContent })}
                                >
                                  {item.notes || ''}
                                </div>
                              </td>
                              
                              {/* DELETE BUTTON */}
                              <td className="border border-[#B49B7E] px-1 py-1 text-center w-12">
                                <button 
                                  onClick={() => handleDeleteItem(item.id)}
                                  className="text-red-400 hover:text-red-300 text-sm font-bold"
                                >
                                  🗑️
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </React.Fragment>
                  ))}
                </div>
              ))}
            </div>
          </React.Fragment>
        ))}
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
      
      {/* SIMPLE PHOTO MANAGEMENT */}
      {showPhotoManagement && (
        <SimplePhotoCapture
          projectId={projectId}
          roomId={selectedRoomForPhoto?.id || (project?.rooms?.[0]?.id)}
          roomName={selectedRoomForPhoto?.name || (project?.rooms?.[0]?.name) || 'Room'}
          onPhotoAdded={loadProject}
          onClose={() => {
            setShowPhotoManagement(false);
            setSelectedRoomForPhoto(null);
          }}
        />
      )}
    </div>
  );
}
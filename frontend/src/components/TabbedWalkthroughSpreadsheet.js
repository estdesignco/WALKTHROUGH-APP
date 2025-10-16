import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useOfflineSync } from '../hooks/useOfflineSync';
import MobileAddItemModal from './MobileAddItemModal';
import { exportProjectToCSV, exportProjectSummary, calculateProjectStats } from '../utils/exportUtils';
import { leicaManager } from '../utils/leicaD5Manager';

const API_URL = process.env.REACT_APP_BACKEND_URL + '/api';

export default function TabbedWalkthroughSpreadsheet({ projectId }) {
  const [project, setProject] = useState(null);
  const [activeRoomTab, setActiveRoomTab] = useState(0);
  const [expandedCategories, setExpandedCategories] = useState({});
  const [loading, setLoading] = useState(true);
  const [showAddRoom, setShowAddRoom] = useState(false);
  const [showAddItem, setShowAddItem] = useState(false);
  const [selectedSubCategoryId, setSelectedSubCategoryId] = useState(null);
  const [newRoomName, setNewRoomName] = useState('');
  const [availableCategories, setAvailableCategories] = useState([]);
  const [roomPhotos, setRoomPhotos] = useState({});
  
  // Photo capture states
  const [showPhotoCapture, setShowPhotoCapture] = useState(false);
  const [capturedPhoto, setCapturedPhoto] = useState(null);
  const [measurements, setMeasurements] = useState([]);
  const [drawingArrow, setDrawingArrow] = useState(null);
  const [leicaConnected, setLeicaConnected] = useState(false);
  const [lastMeasurement, setLastMeasurement] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [dragginArrow, setDraggingArrow] = useState(null); // Track which arrow is being dragged
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 }); // Offset from arrow center
  const [editingArrow, setEditingArrow] = useState(null); // Track which arrow is being edited
  const [measurementText, setMeasurementText] = useState(''); // Current measurement text
  const [photoZoom, setPhotoZoom] = useState(1); // Photo zoom level
  const [photoPan, setPhotoPan] = useState({ x: 0, y: 0 }); // Photo pan position
  const [photoRotation, setPhotoRotation] = useState(0); // Photo rotation in degrees
  const [photoNotes, setPhotoNotes] = useState(''); // Notes for current photo
  const [measurementHistory, setMeasurementHistory] = useState([]); // Undo/redo history
  const [historyIndex, setHistoryIndex] = useState(-1); // Current position in history
  const [autoSaveInterval, setAutoSaveInterval] = useState(null); // Auto-save timer
  const [photoBrightness, setPhotoBrightness] = useState(100); // Brightness %
  const [photoContrast, setPhotoContrast] = useState(100); // Contrast %
  const [arrowThickness, setArrowThickness] = useState(0.3); // Arrow stroke width
  const [showAdvancedControls, setShowAdvancedControls] = useState(false); // Toggle advanced panel
  
  const displayProject = project;
  
  // Helper function to add measurement state to history
  const addToHistory = (newMeasurements) => {
    const newHistory = measurementHistory.slice(0, historyIndex + 1);
    newHistory.push([...newMeasurements]);
    setMeasurementHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };
  
  // Undo function
  const handleUndo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setMeasurements(measurementHistory[newIndex]);
      console.log('⬅️ Undo:', measurementHistory[newIndex]);
    }
  };
  
  // Redo function
  const handleRedo = () => {
    if (historyIndex < measurementHistory.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setMeasurements(measurementHistory[newIndex]);
      console.log('➡️ Redo:', measurementHistory[newIndex]);
    }
  };
  
  // Duplicate arrow function
  const handleDuplicateArrow = (index) => {
    const arrow = measurements[index];
    const duplicated = {
      ...arrow,
      x1: arrow.x1 + 5, // Offset slightly
      y1: arrow.y1 + 5,
      x2: arrow.x2 + 5,
      y2: arrow.y2 + 5
    };
    const newMeasurements = [...measurements, duplicated];
    setMeasurements(newMeasurements);
    addToHistory(newMeasurements);
    console.log('📋 Arrow duplicated');
  };
  
  // Auto-save function
  const performAutoSave = async () => {
    if (!selectedPhoto || measurements.length === 0) return;
    
    try {
      console.log('💾 Auto-saving...');
      await axios.post(`${API_URL}/photos/upload`, {
        project_id: projectId,
        room_id: activeRoom.id,
        photo_data: selectedPhoto.photo_data,
        file_name: `autosave_${selectedPhoto.file_name}`,
        metadata: {
          room_name: activeRoom.name,
          timestamp: new Date().toISOString(),
          has_measurements: true,
          measurement_count: measurements.length,
          measurements: measurements,
          notes: photoNotes,
          rotation: photoRotation,
          auto_saved: true
        }
      });
      console.log('✅ Auto-save successful');
    } catch (error) {
      console.error('❌ Auto-save failed:', error);
    }
  };
  
  // Setup auto-save interval when photo is selected
  useEffect(() => {
    if (selectedPhoto && measurements.length > 0) {
      // Clear any existing interval
      if (autoSaveInterval) {
        clearInterval(autoSaveInterval);
      }
      
      // Setup new auto-save every 2 minutes
      const interval = setInterval(performAutoSave, 120000); // 120000ms = 2 minutes
      setAutoSaveInterval(interval);
      
      return () => {
        if (interval) clearInterval(interval);
      };
    }
  }, [selectedPhoto, measurements, photoNotes, photoRotation]);
  
  // Load photo metadata when selecting a photo
  useEffect(() => {
    if (selectedPhoto) {
      setPhotoRotation(selectedPhoto.metadata?.rotation || 0);
      setPhotoNotes(selectedPhoto.metadata?.notes || '');
      
      // Initialize history with loaded measurements
      if (selectedPhoto.metadata?.measurements && Array.isArray(selectedPhoto.metadata.measurements)) {
        setMeasurementHistory([selectedPhoto.metadata.measurements]);
        setHistoryIndex(0);
      } else {
        setMeasurementHistory([[]]);
        setHistoryIndex(0);
      }
    }
  }, [selectedPhoto?.id]);
  
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

  // EXACT DESKTOP COLORS - NO MODIFICATIONS - COPY FROM ExactFFESpreadsheet.js
  const getRoomColor = (roomName) => {
    const roomColors = {
      'living room': '#7C3AED',      // Purple
      'dining room': '#DC2626',      // Red
      'kitchen': '#EA580C',          // Orange  
      'primary bedroom': '#059669',  // Green
      'master bedroom': '#059669',   // Green - same as primary
      'primary bathroom': '#2563EB', // Blue
      'bathroom': '#2563EB',         // Blue - same as primary
      'master bathroom': '#2563EB',  // Blue - same as primary
      'powder room': '#7C2D12',      // Brown
      'guest room': '#BE185D',       // Pink
      'office': '#6366F1',           // Indigo
      'laundry room': '#16A34A',     // Green
      'mudroom': '#0891B2',          // Cyan
      'family room': '#CA8A04',      // Yellow
      'basement': '#6B7280',         // Gray
      'attic storage': '#78716C',    // Stone
      'garage': '#374151',           // Gray-800
      'balcony': '#7C3AED',          // Purple
      'foyer': '#7C3AED'             // Purple - same as living room/balcony
    };
    return roomColors[roomName.toLowerCase()] || '#7C3AED';
  };

  const getCategoryColor = () => '#065F46';

  useEffect(() => {
    loadProject();
    loadAllPhotos();
    loadAvailableCategories();
  }, [projectId]);

  const loadProject = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/projects/${projectId}?sheet_type=walkthrough`);
      setProject(response.data);
      
      // Set first room as active tab
      if (response.data.rooms && response.data.rooms.length > 0) {
        setActiveRoomTab(0);
      }
    } catch (error) {
      console.error('Failed to load project:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAllPhotos = async () => {
    if (!projectId) return;
    try {
      const response = await axios.get(`${API_URL}/projects/${projectId}?sheet_type=walkthrough`);
      const rooms = response.data?.rooms || [];
      
      const photosData = {};
      for (const room of rooms) {
        try {
          const photoResponse = await axios.get(`${API_URL}/photos/by-room/${projectId}/${room.id}`);
          photosData[room.id] = photoResponse.data.photos || [];
        } catch (err) {
          photosData[room.id] = [];
        }
      }
      
      setRoomPhotos(photosData);
    } catch (error) {
      console.error('Failed to load photos:', error);
    }
  };

  const loadAvailableCategories = async () => {
    try {
      const response = await axios.get(`${API_URL}/category-options`);
      setAvailableCategories(response.data || []);
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  };

  const handleAddRoom = async () => {
    if (!newRoomName.trim()) return;
    try {
      await axios.post(`${API_URL}/rooms`, {
        name: newRoomName,
        project_id: projectId,
        sheet_type: 'walkthrough',
        auto_populate: true,
        comprehensive: true,
        color: getRoomColor(newRoomName),
        order_index: project?.rooms?.length || 0
      });
      await loadProject();
      setShowAddRoom(false);
      setNewRoomName('');
      alert(`✅ Room "${newRoomName}" added with full categories and items!`);
    } catch (error) {
      console.error('Failed to add room:', error);
      alert('Failed to add room: ' + error.message);
    }
  };

  const handleDeleteItem = async (itemId) => {
    if (!window.confirm('Delete this item?')) return;
    
    try {
      await axios.delete(`${API_URL}/items/${itemId}`);
      await loadProject();
    } catch (error) {
      console.error('Failed to delete item:', error);
      alert('Failed to delete item');
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

  const handleAddBlankItem = async (subcategoryId) => {
    try {
      console.log('➕ Adding blank item to subcategory:', subcategoryId);
      
      // Create a blank item that can be filled in
      await axios.post(`${API_URL}/items`, {
        name: 'New Item',
        vendor: '',
        sku: '',
        quantity: '1',
        size: '',
        finish_color: '',
        cost: '',
        status: '',
        notes: '',
        subcategory_id: subcategoryId,
        order_index: 0
      });
      
      console.log('✅ Blank item added successfully');
      await loadProject();
    } catch (error) {
      console.error('Failed to add blank item:', error);
      alert('Failed to add item: ' + error.message);
    }
  };

  // SIMPLE PHOTO CAPTURE
  const handleTakePhoto = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.capture = 'environment';
    
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = async (e) => {
        const photoData = e.target.result;
        
        try {
          console.log('🔄 Saving photo for room:', project.rooms[activeRoomTab]?.name);
          
          const response = await axios.post(`${API_URL}/photos/upload`, {
            project_id: projectId,
            room_id: project.rooms[activeRoomTab]?.id,
            photo_data: photoData,
            file_name: `photo_${project.rooms[activeRoomTab]?.name}_${Date.now()}.jpg`,
            metadata: {
              room_name: project.rooms[activeRoomTab]?.name,
              timestamp: new Date().toISOString(),
              has_measurements: false
            }
          });
          
          console.log('✅ Photo upload response:', response.data);
          alert('✅ Photo saved successfully!');
          
          // Reload photos immediately
          await loadAllPhotos();
          
        } catch (error) {
          console.error('❌ Photo upload failed:', error);
          alert('❌ Photo save failed: ' + error.message);
        }
      };
      reader.readAsDataURL(file);
    };
    
    input.click();
  };

  // Connect to Leica
  const connectLeica = async () => {
    if (!leicaManager.isSupported()) {
      alert('❌ Web Bluetooth not supported.\n\nUse Chrome on Android or desktop (NOT iPad).');
      return;
    }

    try {
      const result = await leicaManager.connect();
      setLeicaConnected(true);
      alert(`✅ Leica D5 Connected!\nPress measurement button on Leica.`);

      leicaManager.setOnMeasurement((measurement) => {
        console.log('📏 NEW MEASUREMENT:', measurement.feetInches);
        setLastMeasurement(measurement);
        
        // Visual feedback
        const notification = document.createElement('div');
        notification.innerHTML = `
          <div style="position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); 
                      background: linear-gradient(135deg, #4ade80, #22c55e); 
                      color: white; padding: 30px; border-radius: 20px; 
                      z-index: 9999; font-weight: bold; font-size: 24px;
                      box-shadow: 0 10px 50px rgba(34, 197, 94, 0.8);
                      border: 3px solid white;">
            📏 ${measurement.feetInches}
          </div>
        `;
        document.body.appendChild(notification);
        setTimeout(() => document.body.removeChild(notification), 4000);
      });
    } catch (error) {
      alert(`❌ Connection failed: ${error.message}`);
    }
  };

  const toggleCategory = (categoryId) => {
    setExpandedCategories(prev => ({ ...prev, [categoryId]: !prev[categoryId] }));
  };

  if (loading) {
    return <div className="flex items-center justify-center h-full" style={{ backgroundColor: '#0F172A' }}>
      <div className="text-white text-2xl">Loading Walkthrough...</div>
    </div>;
  }

  if (!project || !project.rooms || project.rooms.length === 0) {
    return (
      <div className="w-full p-8" style={{ backgroundColor: '#0F172A' }}>
        <div className="text-center">
          <h2 className="text-3xl font-bold text-[#D4A574] mb-4">No Rooms Available</h2>
          <button 
            onClick={() => setShowAddRoom(true)}
            className="px-8 py-4 bg-[#D4A574] hover:bg-[#C49564] text-black rounded-xl font-bold text-xl"
          >
            + ADD FIRST ROOM
          </button>
        </div>
      </div>
    );
  }

  const activeRoom = project.rooms[activeRoomTab];

  return (
    <div className="w-full h-full flex flex-col" style={{ backgroundColor: '#0F172A' }}>
      {/* EXACT DESKTOP HEADER */}
      <div className="bg-gradient-to-r from-[#1E293B] to-[#0F172A] p-6 border-b-4 border-[#D4A574] shadow-2xl">
        <div className="max-w-7xl mx-auto">
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
          
          <div className="text-center">
            <div className="inline-flex items-center gap-6">
              <button
                onClick={() => setShowAddRoom(true)}
                className="bg-gradient-to-r from-[#B49B7E] to-[#A08B6F] hover:from-[#A08B6F] hover:to-[#8B7355] px-8 py-3 rounded-full text-black font-bold text-lg shadow-xl"
              >
                ✥ ADD ROOM
              </button>
              
              <div className="bg-gradient-to-r from-[#D4A574] to-[#B49B7E] px-8 py-3 rounded-full">
                <span className="text-2xl font-bold text-black tracking-wider">WALKTHROUGH SPREADSHEET</span>
              </div>
              
              <button
                onClick={connectLeica}
                disabled={leicaConnected}
                className={`px-8 py-3 rounded-full font-bold text-lg shadow-xl ${
                  leicaConnected 
                    ? 'bg-green-600 text-white' 
                    : 'bg-gray-700 hover:bg-gray-600 text-white'
                }`}
              >
                📏 {leicaConnected ? 'Leica Connected' : 'Connect Leica'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ROOM TABS - OPTIMIZED FOR 13" IPAD */}
      <div className="bg-[#1E293B] border-b-2 border-[#D4A574] overflow-x-auto">
        <div className="flex">
          {project.rooms.map((room, index) => (
            <button
              key={room.id}
              onClick={() => setActiveRoomTab(index)}
              className={`px-6 py-4 font-bold text-lg border-b-4 transition-all min-w-max ${
                activeRoomTab === index
                  ? 'border-[#D4A574] text-[#D4A574] bg-[#D4A574]/10'
                  : 'border-transparent text-[#B49B7E] hover:text-[#D4C5A9] hover:bg-[#D4A574]/5'
              }`}
              style={{ 
                backgroundColor: activeRoomTab === index 
                  ? getRoomColor(room.name) + '40' 
                  : 'transparent',
                borderTopColor: getRoomColor(room.name),
                borderTopWidth: '4px',
                borderTopStyle: 'solid'
              }}
            >
              {room.name}
              <div className="text-xs">
                {roomPhotos[room.id]?.length || 0} photos
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* ACTIVE ROOM CONTENT */}
      <div className="flex-1 overflow-auto">
        {activeRoom && (
          <div>
            {/* SPREADSHEET FOR ACTIVE ROOM - EXACT DESKTOP LAYOUT */}
            <div className="p-4">
              {activeRoom.categories?.map((category) => (
                <div key={category.id} className="mb-6">
                  {/* CATEGORY HEADER */}
                  <div 
                    className="border border-[#B49B7E] p-3 font-bold text-[#D4C5A9] shadow-lg cursor-pointer"
                    style={{ backgroundColor: getCategoryColor() }}
                    onClick={() => toggleCategory(category.id)}
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <span>{expandedCategories[category.id] ? '▼' : '▶'}</span>
                        <span>{category.name.toUpperCase()}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <select
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => {
                            if (e.target.value) {
                              handleAddCategory(activeRoom.id, e.target.value);
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
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteCategory(category.id);
                          }}
                          className="text-red-300 hover:text-red-100 text-lg"
                          title="Delete Category"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* SUBCATEGORIES - EXACT DESKTOP TABLE STRUCTURE */}
                  {expandedCategories[category.id] && category.subcategories?.map((subcategory) => (
                    <React.Fragment key={subcategory.id}>
                      <table className="w-full border-collapse border border-[#B49B7E] mb-4 mt-2 shadow-lg shadow-[#B49B7E]/10">
                        <thead>
                          <tr>
                            <th className="border border-[#B49B7E] px-1 py-2 text-xs font-bold text-[#D4C5A9] w-8 shadow-inner shadow-[#B49B7E]/20" style={{ backgroundColor: '#8B4444' }}>✓</th>
                            <th className="border border-[#B49B7E] px-2 py-2 text-xs font-bold text-[#D4C5A9] shadow-inner shadow-[#B49B7E]/20" style={{ backgroundColor: '#8B4444' }}>
                              {subcategory.name.toUpperCase()}
                              <button
                                onClick={() => handleAddBlankItem(subcategory.id)}
                                className="ml-2 bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded text-xs font-bold"
                                title={`Add blank item to ${subcategory.name}`}
                              >
                                + ADD ITEM
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
                          {subcategory.items?.map((item, itemIndex) => (
                            <tr key={item.id} style={{ 
                              background: itemIndex % 2 === 0 
                                ? 'linear-gradient(135deg, rgba(0, 0, 0, 0.95) 0%, rgba(30, 30, 30, 0.9) 30%, rgba(15, 15, 25, 0.95) 70%, rgba(0, 0, 0, 0.95) 100%)'
                                : 'linear-gradient(135deg, rgba(15, 15, 25, 0.95) 0%, rgba(45, 45, 55, 0.9) 30%, rgba(25, 25, 35, 0.95) 70%, rgba(15, 15, 25, 0.95) 100%)'
                            }}>
                              <td className="border border-[#B49B7E] px-1 py-1 text-center w-8">
                                <input 
                                  type="checkbox" 
                                  className="w-4 h-4 cursor-pointer" 
                                  checked={item.status === 'PICKED'}
                                  onChange={async (e) => {
                                    const newStatus = e.target.checked ? 'PICKED' : '';
                                    await updateItemOffline(item.id, { status: newStatus });
                                    await loadProject();
                                  }}
                                />
                              </td>
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
                              <td className="border border-[#B49B7E] px-1 py-1 text-center w-20">
                                {item.image_url ? (
                                  <img src={item.image_url} alt={item.name} className="w-12 h-12 object-cover rounded" />
                                ) : (
                                  <div className="w-12 h-12 bg-gray-700 rounded flex items-center justify-center text-xs text-[#B49B7E]">No Image</div>
                                )}
                              </td>
                              <td className="border border-[#B49B7E] px-1 py-1 text-center w-24">
                                {item.link ? (
                                  <a href={item.link} target="_blank" rel="noopener noreferrer" className="text-[#D4A574] text-xs hover:underline">
                                    🔗 View
                                  </a>
                                ) : (
                                  <span className="text-gray-500 text-xs">-</span>
                                )}
                              </td>
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

            {/* PHOTO SECTION AT BOTTOM OF EACH ROOM */}
            <div className="bg-[#1E293B] p-6 border-t-4 border-[#D4A574] mt-8">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-2xl font-bold text-[#D4A574]">📸 {activeRoom.name} Photos</h3>
                <div className="flex gap-4">
                  <button
                    onClick={handleTakePhoto}
                    className="bg-gradient-to-r from-[#D4A574] to-[#B48554] hover:from-[#E4B584] hover:to-[#C49564] text-black px-6 py-3 rounded-xl font-bold text-lg"
                  >
                    📸 Take Photo
                  </button>
                  {leicaConnected && lastMeasurement && (
                    <div className="bg-green-600 text-white px-4 py-2 rounded-xl font-bold">
                      📏 {lastMeasurement.feetInches}
                    </div>
                  )}
                </div>
              </div>

              {/* PHOTO THUMBNAILS */}
              <div className="grid grid-cols-6 gap-4">
                {(roomPhotos[activeRoom.id] || []).map((photo, index) => (
                  <div
                    key={photo.id || index}
                    className="relative border-2 border-[#D4A574]/50 rounded-xl overflow-hidden hover:border-[#D4A574] transition-all cursor-pointer group"
                    onClick={() => {
                      setSelectedPhoto(photo);
                      // Load existing measurements if photo has them
                      if (photo.metadata?.measurements && Array.isArray(photo.metadata.measurements)) {
                        setMeasurements(photo.metadata.measurements);
                        console.log('✅ Loaded existing measurements:', photo.metadata.measurements.length);
                      } else {
                        setMeasurements([]);
                      }
                    }}
                  >
                    <img 
                      src={photo.photo_data} 
                      alt={photo.file_name}
                      className="w-full h-32 object-cover"
                    />
                    <div className="absolute inset-x-0 bottom-0 bg-black bg-opacity-75 text-white text-xs p-2">
                      {photo.metadata?.has_measurements ? (
                        <div className="text-[#FFD700] font-bold">📏 {photo.metadata?.measurement_count || 0} measurements</div>
                      ) : (
                        <div className="text-gray-300">Photo only</div>
                      )}
                    </div>
                  </div>
                ))}
                
                {/* Add Photo Placeholder */}
                <button
                  onClick={handleTakePhoto}
                  className="h-32 border-2 border-dashed border-[#D4A574]/50 rounded-xl hover:border-[#D4A574] hover:bg-[#D4A574]/10 transition-all flex items-center justify-center"
                >
                  <div className="text-center text-[#D4A574]">
                    <div className="text-3xl mb-1">📸</div>
                    <div className="text-sm font-bold">Add Photo</div>
                  </div>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* PHOTO EDITOR MODAL - EDIT EXISTING PHOTOS */}
      {selectedPhoto && (
        <div className="fixed inset-0 bg-black z-50 flex flex-col">
          <div className="bg-[#1E293B] p-4 border-b-2 border-[#D4A574]">
            <div className="flex justify-between items-center">
              <h3 className="text-2xl font-bold text-[#D4A574]">📏 Edit Measurements</h3>
              <div className="flex items-center gap-4">
                <div className="text-[#D4C5A9] font-bold">
                  {measurements.length} measurements
                </div>
                <button
                  onClick={() => {
                    setSelectedPhoto(null);
                    setMeasurements([]);
                    setDrawingArrow(null);
                  }}
                  className="text-[#D4A574] text-3xl hover:text-red-400"
                >
                  ✕
                </button>
              </div>
            </div>
          </div>

          {/* LEICA CONNECTION BAR WITH COLOR PICKER */}
          <div className="bg-[#0F172A] p-3 border-b border-[#D4A574]/30">
            <div className="flex items-center justify-between flex-wrap gap-4">
              {/* LEFT SIDE - Leica Controls */}
              <div className="flex items-center gap-4">
                <div className={`px-4 py-2 rounded-xl font-bold text-sm ${
                  leicaConnected ? 'bg-green-600 text-white' : 'bg-gray-700 text-gray-300'
                }`}>
                  📏 Leica D5: {leicaConnected ? 'Connected' : 'Not Connected'}
                </div>
                <button
                  onClick={leicaConnected ? () => leicaManager.disconnect() : connectLeica}
                  className="px-4 py-2 bg-[#D4A574] hover:bg-[#C49564] text-black rounded-xl font-bold text-sm"
                >
                  {leicaConnected ? 'Disconnect' : 'Connect Leica D5'}
                </button>
                
                {/* SIMPLE MEASUREMENT BUTTONS */}
                {leicaConnected && (
                  <div className="flex gap-2">
                    <button
                      onClick={async () => {
                        console.log('🎯 CHECKING FOR LEICA MEASUREMENT...');
                        
                        // Show instructions first
                        if (!confirm('STEP 1: Point your Leica D5 at something\\nSTEP 2: Press the measurement button on your Leica\\nSTEP 3: Click OK when you see measurement on Leica screen\\n\\nReady to read measurement?')) {
                          return;
                        }
                        
                        try {
                          // Read whatever measurement is currently on the Leica
                          const measurement = await leicaManager.readMeasurement();
                          if (measurement) {
                            setLastMeasurement(measurement);
                            console.log('✅ Measurement retrieved:', measurement.feetInches);
                            alert(`📏 SUCCESS! Measurement: ${measurement.feetInches}\\n\\nNow click and drag on photo to place arrow.`);
                          } else {
                            alert('❌ No measurement found.\\n\\nPlease:\\n1. Point Leica at something\\n2. Press measurement button on Leica\\n3. Wait for result on Leica screen\\n4. Try again');
                          }
                        } catch (error) {
                          console.error('❌ Read measurement failed:', error);
                          alert('❌ Failed to read measurement.\\n\\nTroubleshooting:\\n1. Make sure Leica D5 is connected\\n2. Take a measurement with Leica first\\n3. Try clicking button again\\n\\nOr use MANUAL button instead.');
                        }
                      }}
                      className="px-6 py-3 bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-black rounded-xl font-bold text-lg"
                    >
                      📏 READ LEICA MEASUREMENT
                    </button>
                    
                    <button
                      onClick={() => {
                        const manualMeasurement = prompt('Enter manual measurement:', "8'6\"");
                        if (manualMeasurement && manualMeasurement.trim()) {
                          setLastMeasurement({
                            feetInches: manualMeasurement.trim(),
                            manual: true
                          });
                          alert(`📝 Manual measurement ready: ${manualMeasurement}\\n\\nNow click and drag on photo to place arrow.`);
                        }
                      }}
                      className="px-4 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl font-bold"
                    >
                      📝 MANUAL
                    </button>
                  </div>
                )}
              </div>
              
              {/* CENTER - Zoom Controls */}
              <div className="flex items-center gap-3 bg-[#1E293B] px-4 py-2 rounded-xl border-2 border-[#D4A574]">
                <span className="text-[#D4A574] font-bold text-sm">Zoom:</span>
                <button
                  onClick={() => setPhotoZoom(Math.max(0.5, photoZoom - 0.25))}
                  className="px-4 py-2 bg-[#D4A574] hover:bg-[#C49564] text-black rounded-lg font-bold text-lg"
                  title="Zoom Out"
                >
                  🔍−
                </button>
                <span className="text-white font-bold min-w-[60px] text-center">{Math.round(photoZoom * 100)}%</span>
                <button
                  onClick={() => setPhotoZoom(Math.min(3, photoZoom + 0.25))}
                  className="px-4 py-2 bg-[#D4A574] hover:bg-[#C49564] text-black rounded-lg font-bold text-lg"
                  title="Zoom In"
                >
                  🔍+
                </button>
                <button
                  onClick={() => {
                    setPhotoZoom(1);
                    setPhotoPan({ x: 0, y: 0 });
                  }}
                  className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-bold text-sm"
                  title="Reset View"
                >
                  Reset
                </button>
                
                <div className="w-px h-8 bg-[#D4A574]"></div>
                
                {/* Rotation Control */}
                <button
                  onClick={() => setPhotoRotation((photoRotation + 90) % 360)}
                  className="px-4 py-2 bg-[#D4A574] hover:bg-[#C49564] text-black rounded-lg font-bold text-lg"
                  title="Rotate 90°"
                >
                  🔄
                </button>
                
                <div className="w-px h-8 bg-[#D4A574]"></div>
                
                {/* Undo/Redo Controls */}
                <button
                  onClick={handleUndo}
                  disabled={historyIndex <= 0}
                  className={`px-4 py-2 rounded-lg font-bold text-lg ${
                    historyIndex <= 0 
                      ? 'bg-gray-700 text-gray-500 cursor-not-allowed' 
                      : 'bg-[#D4A574] hover:bg-[#C49564] text-black'
                  }`}
                  title="Undo"
                >
                  ↶
                </button>
                <button
                  onClick={handleRedo}
                  disabled={historyIndex >= measurementHistory.length - 1}
                  className={`px-4 py-2 rounded-lg font-bold text-lg ${
                    historyIndex >= measurementHistory.length - 1
                      ? 'bg-gray-700 text-gray-500 cursor-not-allowed' 
                      : 'bg-[#D4A574] hover:bg-[#C49564] text-black'
                  }`}
                  title="Redo"
                >
                  ↷
                </button>
              </div>
              
              {/* RIGHT SIDE - Arrow Color Picker */}
              <div className="flex gap-2 items-center">
                <span className="text-[#D4A574] font-bold text-sm">Next Arrow Color:</span>
                {[
                  { color: '#FFD700', name: 'Gold' },
                  { color: '#FF6B6B', name: 'Red' },
                  { color: '#4ECDC4', name: 'Teal' },
                  { color: '#95E1D3', name: 'Mint' },
                  { color: '#F38181', name: 'Pink' },
                  { color: '#AA96DA', name: 'Purple' },
                  { color: '#FCBAD3', name: 'Rose' },
                  { color: '#FFFFD2', name: 'Cream' }
                ].map((colorOption) => (
                  <button
                    key={colorOption.color}
                    onClick={() => {
                      window.selectedArrowColor = colorOption.color;
                      alert(`✅ Next arrow will be ${colorOption.name}`);
                    }}
                    className="w-8 h-8 rounded-full border-2 border-white hover:scale-110 transition-all"
                    style={{ backgroundColor: colorOption.color }}
                    title={colorOption.name}
                  />
                ))}
              </div>
              
              {lastMeasurement && (
                <div className="bg-gradient-to-r from-green-600 to-green-700 text-white px-4 py-2 rounded-xl">
                  <div className="text-lg font-bold">📏 {lastMeasurement.feetInches}</div>
                  <div className="text-sm">Ready to place on photo</div>
                </div>
              )}
            </div>
          </div>

          {/* ADVANCED CONTROLS PANEL - TOGGLE */}
          <div className="bg-[#0F172A] border-b border-[#D4A574]/30">
            <button
              onClick={() => setShowAdvancedControls(!showAdvancedControls)}
              className="w-full px-4 py-2 text-[#D4A574] hover:bg-[#1E293B] font-bold text-sm flex items-center justify-center gap-2"
            >
              {showAdvancedControls ? '▲' : '▼'} Advanced Controls
            </button>
            
            {showAdvancedControls && (
              <div className="p-4 bg-[#1E293B] border-t border-[#D4A574]/30">
                <div className="grid grid-cols-3 gap-6">
                  {/* Brightness Control */}
                  <div className="flex flex-col gap-2">
                    <label className="text-[#D4A574] font-bold text-sm">☀️ Brightness: {photoBrightness}%</label>
                    <input
                      type="range"
                      min="25"
                      max="200"
                      value={photoBrightness}
                      onChange={(e) => setPhotoBrightness(Number(e.target.value))}
                      className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                      style={{
                        background: `linear-gradient(to right, #D4A574 0%, #D4A574 ${(photoBrightness - 25) / 1.75}%, #374151 ${(photoBrightness - 25) / 1.75}%, #374151 100%)`
                      }}
                    />
                    <button
                      onClick={() => setPhotoBrightness(100)}
                      className="text-xs text-gray-400 hover:text-white"
                    >
                      Reset
                    </button>
                  </div>

                  {/* Contrast Control */}
                  <div className="flex flex-col gap-2">
                    <label className="text-[#D4A574] font-bold text-sm">🎨 Contrast: {photoContrast}%</label>
                    <input
                      type="range"
                      min="25"
                      max="200"
                      value={photoContrast}
                      onChange={(e) => setPhotoContrast(Number(e.target.value))}
                      className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                      style={{
                        background: `linear-gradient(to right, #D4A574 0%, #D4A574 ${(photoContrast - 25) / 1.75}%, #374151 ${(photoContrast - 25) / 1.75}%, #374151 100%)`
                      }}
                    />
                    <button
                      onClick={() => setPhotoContrast(100)}
                      className="text-xs text-gray-400 hover:text-white"
                    >
                      Reset
                    </button>
                  </div>

                  {/* Arrow Thickness Control */}
                  <div className="flex flex-col gap-2">
                    <label className="text-[#D4A574] font-bold text-sm">📏 Arrow Width: {arrowThickness.toFixed(1)}px</label>
                    <input
                      type="range"
                      min="0.1"
                      max="1.5"
                      step="0.1"
                      value={arrowThickness}
                      onChange={(e) => setArrowThickness(Number(e.target.value))}
                      className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                      style={{
                        background: `linear-gradient(to right, #D4A574 0%, #D4A574 ${((arrowThickness - 0.1) / 1.4) * 100}%, #374151 ${((arrowThickness - 0.1) / 1.4) * 100}%, #374151 100%)`
                      }}
                    />
                    <button
                      onClick={() => setArrowThickness(0.3)}
                      className="text-xs text-gray-400 hover:text-white"
                    >
                      Reset
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* MUCH LARGER PHOTO WITH MOVABLE ARROWS */}
          <div className="flex-1 p-2 flex items-center justify-center bg-black overflow-hidden">
            <div 
              className="relative inline-block"
              style={{
                transform: `scale(${photoZoom}) translate(${photoPan.x}px, ${photoPan.y}px) rotate(${photoRotation}deg)`,
                transition: 'transform 0.1s ease-out'
              }}
            >
              <img 
                id="measurement-photo"
                src={selectedPhoto.photo_data}
                alt={selectedPhoto.file_name}
                className="max-w-full max-h-[75vh] border-2 border-[#D4A574] rounded-xl cursor-crosshair"
                style={{ 
                  minWidth: '60vw', 
                  minHeight: '50vh', 
                  display: 'block',
                  filter: `brightness(${photoBrightness}%) contrast(${photoContrast}%)`
                }}
                onMouseDown={(e) => {
                  // Only create new arrows if not editing existing ones
                  if (editingArrow !== null) return;
                  
                  const rect = e.target.getBoundingClientRect();
                  const x = ((e.clientX - rect.left) / rect.width) * 100;
                  const y = ((e.clientY - rect.top) / rect.height) * 100;
                  console.log('🎯 Starting arrow at:', x, y);
                  
                  const selectedColor = window.selectedArrowColor || '#FFD700';
                  setDrawingArrow({ 
                    x1: x, y1: y, x2: x, y2: y, 
                    color: selectedColor 
                  });
                }}
                onMouseMove={(e) => {
                  if (!drawingArrow || editingArrow !== null) return;
                  const rect = e.target.getBoundingClientRect();
                  const x = ((e.clientX - rect.left) / rect.width) * 100;
                  const y = ((e.clientY - rect.top) / rect.height) * 100;
                  setDrawingArrow({ ...drawingArrow, x2: x, y2: y });
                }}
                onMouseUp={() => {
                  if (!drawingArrow || editingArrow !== null) return;
                  const dx = drawingArrow.x2 - drawingArrow.x1;
                  const dy = drawingArrow.y2 - drawingArrow.y1;
                  const length = Math.sqrt(dx * dx + dy * dy);
                  
                  if (length > 3) {
                    const text = lastMeasurement?.feetInches || measurementText || prompt('Enter measurement:', "8'6");
                    if (text && text.trim()) {
                      const newMeasurement = {
                        x1: drawingArrow.x1,
                        y1: drawingArrow.y1,
                        x2: drawingArrow.x2,
                        y2: drawingArrow.y2,
                        text: text.trim(),
                        color: drawingArrow.color
                      };
                      
                      console.log('✅ Arrow created with measurement:', text);
                      
                      // Add to history for undo/redo
                      const newMeasurements = [...measurements, newMeasurement];
                      setMeasurements(newMeasurements);
                      addToHistory(newMeasurements);
                      
                      setLastMeasurement(null); // Clear after use
                      setMeasurementText('');
                    }
                  }
                  setDrawingArrow(null);
                }}
                draggable={false}
              />
              
              {/* ULTRA-THIN DRAGGABLE ARROWS - NOW MATCHES IMAGE EXACTLY */}
              <svg 
                className="absolute top-0 left-0" 
                style={{ 
                  width: '100%', 
                  height: '100%',
                  zIndex: 10,
                  pointerEvents: 'none'
                }} 
                viewBox="0 0 100 100" 
                preserveAspectRatio="none"
              >
                <defs>
                  {/* Ultra-thin arrowheads for each color */}
                  {[
                    '#FFD700', '#FF6B6B', '#4ECDC4', '#95E1D3',
                    '#F38181', '#AA96DA', '#FCBAD3', '#FFFFD2'
                  ].map((color) => (
                    <marker
                      key={color}
                      id={`arrowhead-${color.replace('#', '')}`}
                      markerWidth="4"
                      markerHeight="4"
                      refX="3"
                      refY="1.5"
                      orient="auto"
                    >
                      <polygon points="0 0, 4 1.5, 0 3" fill={color} />
                    </marker>
                  ))}
                </defs>
                
                {/* ULTRA-THIN measurement arrows - FULLY DRAGGABLE */}
                {measurements.map((m, index) => (
                  <g key={index} style={{ pointerEvents: 'auto' }}>
                    <line
                      x1={m.x1} y1={m.y1} x2={m.x2} y2={m.y2}
                      stroke={m.color || '#FFD700'} 
                      strokeWidth={editingArrow === index ? (arrowThickness * 2).toString() : arrowThickness.toString()}
                      markerEnd={`url(#arrowhead-${(m.color || '#FFD700').replace('#', '')})`}
                      className="cursor-move"
                      style={{ pointerEvents: 'auto' }}
                      onClick={(e) => {
                        e.stopPropagation();
                        console.log('🎯 Arrow clicked, selecting for edit:', index);
                        setEditingArrow(index);
                      }}
                      onMouseDown={(e) => {
                        // Only start dragging if already selected
                        if (editingArrow !== index) {
                          e.preventDefault();
                          return;
                        }
                        
                        e.preventDefault();
                        console.log('🎯 Starting to move arrow', index);
                        
                        const rect = e.target.closest('svg').getBoundingClientRect();
                        const startX = e.clientX;
                        const startY = e.clientY;
                        const initialArrow = { ...m };
                        
                        const moveArrow = (event) => {
                          const deltaX = ((event.clientX - startX) / rect.width) * 100;
                          const deltaY = ((event.clientY - startY) / rect.height) * 100;
                          
                          setMeasurements(prev => prev.map((arrow, i) => 
                            i === index ? {
                              ...arrow,
                              x1: initialArrow.x1 + deltaX,
                              y1: initialArrow.y1 + deltaY,
                              x2: initialArrow.x2 + deltaX,
                              y2: initialArrow.y2 + deltaY
                            } : arrow
                          ));
                        };
                        
                        const stopMove = () => {
                          console.log('✅ Finished moving arrow');
                          document.removeEventListener('mousemove', moveArrow);
                          document.removeEventListener('mouseup', stopMove);
                          // Don't clear editingArrow - keep it selected
                        };
                        
                        document.addEventListener('mousemove', moveArrow);
                        document.addEventListener('mouseup', stopMove);
                      }}
                    />
                    
                    {/* Stretch handles - only show when selected */}
                    {editingArrow === index && (
                      <>
                        {/* Start point handle */}
                        <circle
                          cx={m.x1} cy={m.y1} r="0.8"
                          fill="white" stroke={m.color} strokeWidth="0.2"
                          className="cursor-nw-resize"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            
                            const rect = e.target.closest('svg').getBoundingClientRect();
                            const stretchStart = (event) => {
                              const x = ((event.clientX - rect.left) / rect.width) * 100;
                              const y = ((event.clientY - rect.top) / rect.height) * 100;
                              
                              setMeasurements(prev => prev.map((arrow, i) => 
                                i === index ? { ...arrow, x1: x, y1: y } : arrow
                              ));
                            };
                            
                            const stopStretch = () => {
                              document.removeEventListener('mousemove', stretchStart);
                              document.removeEventListener('mouseup', stopStretch);
                            };
                            
                            document.addEventListener('mousemove', stretchStart);
                            document.addEventListener('mouseup', stopStretch);
                          }}
                        />
                        
                        {/* End point handle */}
                        <circle
                          cx={m.x2} cy={m.y2} r="0.8"
                          fill="white" stroke={m.color} strokeWidth="0.2"
                          className="cursor-nw-resize"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            
                            const rect = e.target.closest('svg').getBoundingClientRect();
                            const stretchEnd = (event) => {
                              const x = ((event.clientX - rect.left) / rect.width) * 100;
                              const y = ((event.clientY - rect.top) / rect.height) * 100;
                              
                              setMeasurements(prev => prev.map((arrow, i) => 
                                i === index ? { ...arrow, x2: x, y2: y } : arrow
                              ));
                            };
                            
                            const stopStretch = () => {
                              document.removeEventListener('mousemove', stretchEnd);
                              document.removeEventListener('mouseup', stopStretch);
                            };
                            
                            document.addEventListener('mousemove', stretchEnd);
                            document.addEventListener('mouseup', stopStretch);
                          }}
                        />
                      </>
                    )}
                  </g>
                ))}
                
                {/* Ultra-thin drawing arrow */}
                {drawingArrow && (
                  <line
                    x1={drawingArrow.x1} y1={drawingArrow.y1} x2={drawingArrow.x2} y2={drawingArrow.y2}
                    stroke={drawingArrow.color} strokeWidth="0.3" opacity="0.8"
                  />
                )}
              </svg>
              
              {/* Measurement labels - MINIMAL, JUST TEXT */}
              {measurements.map((m, index) => (
                <div
                  key={index}
                  className="absolute pointer-events-auto cursor-pointer"
                  style={{
                    left: `${(m.x1 + m.x2) / 2}%`,
                    top: `${(m.y1 + m.y2) / 2 - 4}%`,
                    transform: 'translate(-50%, -100%)',
                    zIndex: 20
                  }}
                  onClick={() => {
                    const manualMeasurement = prompt(`Enter measurement for Arrow ${index + 1}:`, m.text || "8'6\"");
                    if (manualMeasurement && manualMeasurement.trim()) {
                      setMeasurements(prev => prev.map((arrow, i) => 
                        i === index 
                          ? { ...arrow, text: manualMeasurement.trim() }
                          : arrow
                      ));
                    }
                  }}
                >
                  <div 
                    className="bg-black bg-opacity-90 px-2 py-1 rounded text-sm font-bold border"
                    style={{ 
                      color: m.color || '#FFD700',
                      borderColor: m.color || '#FFD700'
                    }}
                  >
                    {m.text || 'Click to measure'}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* BOTTOM ACTION BAR - ALWAYS VISIBLE */}
          <div className="bg-[#1E293B] p-4 border-t-4 border-[#D4A574]">
            <div className="flex gap-3 justify-center">
              {editingArrow !== null ? (
                <>
                  {/* EDITING MODE */}
                  <div className="flex gap-3 items-center">
                    <span className="text-xl font-bold text-[#D4A574]">📏 Edit Arrow {editingArrow + 1}</span>
                    
                    {leicaConnected && (
                      <button
                        onClick={async () => {
                          console.log(`📏 Getting Leica measurement for arrow ${editingArrow}...`);
                          try {
                            const measurement = await leicaManager.readCurrentMeasurement();
                            if (measurement) {
                              setMeasurements(prev => prev.map((arrow, i) => 
                                i === editingArrow ? { ...arrow, text: measurement.feetInches } : arrow
                              ));
                              alert('✅ Measurement applied: ' + measurement.feetInches);
                              setEditingArrow(null);
                            } else {
                              alert('❌ No measurement found. Press Leica button first.');
                            }
                          } catch (error) {
                            console.error('Leica read error:', error);
                            alert('❌ Leica read failed: ' + error.message);
                          }
                        }}
                        className="px-6 py-3 bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-black rounded-xl font-bold"
                      >
                        📏 LEICA
                      </button>
                    )}
                    
                    <button
                      onClick={() => {
                        const manualMeasurement = prompt(`Enter measurement for Arrow ${editingArrow + 1}:`, measurements[editingArrow]?.text || "8'6\"");
                        if (manualMeasurement && manualMeasurement.trim()) {
                          setMeasurements(prev => prev.map((arrow, i) => 
                            i === editingArrow ? { ...arrow, text: manualMeasurement.trim() } : arrow
                          ));
                          setEditingArrow(null);
                        }
                      }}
                      className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl font-bold"
                    >
                      📝 MANUAL
                    </button>
                    
                    <button
                      onClick={() => {
                        const newMeasurements = measurements.filter((_, i) => i !== editingArrow);
                        setMeasurements(newMeasurements);
                        addToHistory(newMeasurements);
                        setEditingArrow(null);
                      }}
                      className="px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-xl font-bold"
                    >
                      🗑️ DELETE
                    </button>
                    
                    <button
                      onClick={() => setEditingArrow(null)}
                      className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-xl font-bold"
                    >
                      DONE
                    </button>
                  </div>
                </>
              ) : (
                <>
                  {/* NORMAL MODE - SAVE PHOTO */}
                  <div className="flex flex-col gap-3 w-full">
                    {/* Notes Field */}
                    <div className="flex items-center gap-3">
                      <label className="text-[#D4A574] font-bold text-sm whitespace-nowrap">📝 Photo Notes:</label>
                      <input
                        type="text"
                        value={photoNotes}
                        onChange={(e) => setPhotoNotes(e.target.value)}
                        placeholder="Add notes about this photo..."
                        className="flex-1 bg-gray-700 text-white px-4 py-2 rounded-xl border-2 border-gray-600 focus:border-[#D4A574] focus:outline-none"
                      />
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="flex gap-3 justify-center">
                      <button
                        onClick={async () => {
                          if (measurements.length === 0) {
                            alert('⚠️ No measurements added yet. Add at least one measurement before saving.');
                            return;
                          }
                          
                          setUploading(true);
                          try {
                            // Save photo with measurements as metadata
                            const response = await axios.post(`${API_URL}/photos/upload`, {
                              project_id: projectId,
                              room_id: activeRoom.id,
                              photo_data: selectedPhoto.photo_data,
                              file_name: `measured_${selectedPhoto.file_name}`,
                              metadata: {
                                room_name: activeRoom.name,
                                timestamp: new Date().toISOString(),
                                has_measurements: true,
                                measurement_count: measurements.length,
                                measurements: measurements,
                                notes: photoNotes,
                                rotation: photoRotation
                              }
                            });
                            
                            console.log('✅ Photo with measurements saved:', response.data);
                            alert(`✅ Photo saved with ${measurements.length} measurements!`);
                            
                            // Close modal and refresh
                            setSelectedPhoto(null);
                            setMeasurements([]);
                            setDrawingArrow(null);
                            setPhotoNotes('');
                            setPhotoRotation(0);
                            await loadAllPhotos();
                            
                          } catch (error) {
                            console.error('❌ Failed to save photo:', error);
                            alert('❌ Failed to save photo: ' + error.message);
                          } finally {
                            setUploading(false);
                          }
                        }}
                        disabled={uploading || measurements.length === 0}
                        className={`px-8 py-4 rounded-xl font-bold text-xl ${
                          uploading || measurements.length === 0
                            ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                            : 'bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white'
                        }`}
                      >
                        {uploading ? '💾 Saving...' : `💾 SAVE ${measurements.length} MEASUREMENTS`}
                      </button>
                      
                      <button
                        onClick={() => {
                          setSelectedPhoto(null);
                          setMeasurements([]);
                          setDrawingArrow(null);
                          setPhotoNotes('');
                          setPhotoRotation(0);
                        }}
                        className="px-8 py-4 bg-gray-600 hover:bg-gray-700 text-white rounded-xl font-bold text-xl"
                      >
                        ✕ CLOSE
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ADD ROOM MODAL */}
      {showAddRoom && (
        <div className="fixed inset-0 bg-black bg-opacity-95 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1E293B] rounded-2xl p-8 max-w-4xl w-full border-2 border-[#D4A574] max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-3xl font-bold text-[#D4A574]">Add New Room</h3>
              <button
                onClick={() => setShowAddRoom(false)}
                className="text-[#D4A574] text-3xl hover:text-red-400 font-bold"
              >
                ✕
              </button>
            </div>
            
            <div className="mb-8">
              <label className="text-white text-lg font-bold mb-3 block">Room Name *</label>
              <input
                type="text"
                value={newRoomName}
                onChange={(e) => setNewRoomName(e.target.value)}
                placeholder="Enter room name..."
                className="w-full bg-gray-700 text-white px-6 py-4 rounded-xl text-xl border-2 border-gray-600 focus:border-[#D4A574] focus:outline-none"
                onKeyPress={(e) => e.key === 'Enter' && newRoomName.trim() && handleAddRoom()}
              />
            </div>

            <div className="mb-8">
              <h4 className="text-white text-lg font-bold mb-4">Quick Select Common Rooms</h4>
              <div className="grid grid-cols-3 gap-4">
                {[
                  'Living Room', 'Kitchen', 'Master Bedroom',
                  'Bedroom 2', 'Bedroom 3', 'Bathroom', 
                  'Master Bathroom', 'Powder Room', 'Dining Room',
                  'Office', 'Family Room', 'Basement',
                  'Laundry Room', 'Mudroom', 'Pantry',
                  'Closet', 'Guest Room', 'Playroom',
                  'Library', 'Wine Cellar', 'Garage',
                  'Patio'
                ].map((roomName) => (
                  <button
                    key={roomName}
                    onClick={() => setNewRoomName(roomName)}
                    className={`p-4 rounded-xl border-2 font-bold text-lg transition-all transform hover:scale-105 ${
                      newRoomName === roomName
                        ? 'bg-[#D4A574] text-black border-[#D4A574]'
                        : 'bg-gray-700 hover:bg-gray-600 text-white border-gray-600 hover:border-[#D4A574]'
                    }`}
                  >
                    <div className="text-xs text-red-500 font-bold mb-1">🟥</div>
                    {roomName}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-6">
              <button 
                onClick={() => setShowAddRoom(false)}
                className="flex-1 bg-gray-600 hover:bg-gray-700 text-white px-8 py-4 rounded-xl font-bold text-xl"
              >
                Cancel
              </button>
              <button 
                onClick={() => {
                  if (newRoomName.trim()) {
                    handleAddRoom();
                  } else {
                    alert('Please enter a room name');
                  }
                }}
                disabled={!newRoomName.trim()}
                className="flex-1 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 disabled:from-gray-500 disabled:to-gray-600 text-white px-8 py-4 rounded-xl font-bold text-xl"
              >
                Add Room
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
          rooms={[activeRoom]}
          selectedSubCategoryId={selectedSubCategoryId}
          onItemAdded={loadProject}
        />
      )}
    </div>
  );
}
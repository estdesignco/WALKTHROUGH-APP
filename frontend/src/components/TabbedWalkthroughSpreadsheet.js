import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useOfflineSync } from '../hooks/useOfflineSync';
import MobileAddItemModal from './MobileAddItemModal';
import VoiceNoteRecorder from './VoiceNoteRecorder';
import { exportProjectToCSV, exportProjectSummary, calculateProjectStats } from '../utils/exportUtils';
import { leicaManager } from '../utils/leicaD5Manager';
import { getRoomColor, getCategoryColor, ROOM_COLORS } from '../utils/roomColors';
import { getStatusColor, STATUS_COLORS } from '../utils/statusColors';
import StatusOverview from './StatusOverview';

const API_URL = (window.ENV?.REACT_APP_BACKEND_URL || window.location.origin) + '/api';

const getStockStatusColor = (stockStatus) => {
  const stockColors = {
    'IN STOCK': '#10B981',
    'LOW STOCK': '#F59E0B',
    'OUT OF STOCK': '#EF4444',
    'BACKORDERED': '#DC2626',
    'DISCONTINUED': '#991B1B'
  };
  return stockColors[stockStatus] || 'transparent';
};

const getCarrierColor = (carrier) => {
  const colors = {
    'FedEx': '#FF6600',
    'FedEx Ground': '#FF6600',
    'UPS': '#8B4513',
    'UPS Ground': '#8B4513',
    'USPS': '#004B87',
    'DHL': '#FFD700',
    'Brooks': '#4682B4',
    'Zenith': '#20B2AA',
    'Sunbelt': '#FF4500',
    'R+L Carriers': '#32CD32'
  };
  return colors[carrier] || '#6B7280';
};

export default function TabbedWalkthroughSpreadsheet({ projectId, sheetType = 'walkthrough' }) {
  const [project, setProject] = useState(null);
  const [activeRoomTab, setActiveRoomTab] = useState(0);
  const [expandedCategories, setExpandedCategories] = useState({});
  const hasExpandedInitially = useRef(false);
  const [loading, setLoading] = useState(true);
  const [showAddRoom, setShowAddRoom] = useState(false);
  const [showAddItem, setShowAddItem] = useState(false);
  const [selectedSubCategoryId, setSelectedSubCategoryId] = useState(null);
  const [newRoomName, setNewRoomName] = useState('');
  const [selectedRoomsToAdd, setSelectedRoomsToAdd] = useState([]);  // Multi-room selection
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
  const [showCalculator, setShowCalculator] = useState(false); // Toggle calculator
  const [calcInput, setCalcInput] = useState(''); // Calculator input
  const [calcResult, setCalcResult] = useState(''); // Calculator result
  const [showGrid, setShowGrid] = useState(false); // Grid overlay toggle
  const [compareMode, setCompareMode] = useState(false); // Side-by-side compare mode
  const [comparePhoto, setComparePhoto] = useState(null); // Second photo for comparison
  const [punchListMode, setPunchListMode] = useState(false); // Punch List Mode toggle
  const [showVoiceNotes, setShowVoiceNotes] = useState(false); // Voice notes panel toggle
  
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

  useEffect(() => {
    loadProject();
    loadAllPhotos();
    loadAvailableCategories();
  }, [projectId]);

  // REAL-TIME SYNC - Auto-refresh every 10 seconds when online (for both walkthrough and FFE)
  useEffect(() => {
    if (online) {
      const interval = setInterval(() => {
        console.log(`🔄 ${sheetType.toUpperCase()} Real-time sync...`);
        loadProject();
      }, 10000); // Every 10 seconds for live sync
      
      return () => clearInterval(interval);
    }
  }, [sheetType, online, projectId]);

  // Auto-expand all categories when project loads
  useEffect(() => {
    // Only auto-expand ONCE on initial load
    if (project?.rooms && !hasExpandedInitially.current) {
      const allExpanded = {};
      project.rooms.forEach(room => {
        room.categories?.forEach(category => {
          allExpanded[category.id] = true;
        });
      });
      setExpandedCategories(allExpanded);
      hasExpandedInitially.current = true;
      console.log('✅ Auto-expanded all categories on initial load:', Object.keys(allExpanded).length);
    }
  }, [project?.rooms, hasExpandedInitially.current]); // Don't re-run after initial expansion

  const loadProject = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/projects/${projectId}?sheet_type=${sheetType}`);
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
      const response = await axios.get(`${API_URL}/projects/${projectId}?sheet_type=${sheetType}`);
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
      const response = await axios.get(`${API_URL}/categories/available`);
      setAvailableCategories(response.data.categories || []);
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
      // Use comprehensive endpoint to create category with ALL items
      await axios.post(`${API_URL}/categories/comprehensive?room_id=${roomId}&category_name=${categoryName}`);
      await loadProject();
    } catch (error) {
      console.error('Failed to add category:', error);
      alert('Failed to add category: ' + (error.response?.data?.detail || error.message));
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
      
      // Create a blank item
      const response = await axios.post(`${API_URL}/items`, {
        name: '',
        vendor: '',
        sku: '',
        quantity: 1,
        size: '',
        finish_color: '',
        cost: 0,
        status: '',
        notes: '',
        subcategory_id: subcategoryId
      });
      
      console.log('✅ Blank item added successfully');
      
      // Update local state instead of reloading entire project
      const newItem = response.data;
      setProject(prevProject => {
        const updated = JSON.parse(JSON.stringify(prevProject));
        updated.rooms = updated.rooms.map(r => ({
          ...r,
          categories: r.categories.map(c => ({
            ...c,
            subcategories: c.subcategories.map(s => 
              s.id === subcategoryId 
                ? { ...s, items: [...s.items, newItem] }
                : s
            )
          }))
        }));
        return updated;
      });
    } catch (error) {
      console.error('Failed to add blank item:', error);
      alert('Failed to add item: ' + error.message);
    }
  };

  // SIMPLE PHOTO CAPTURE WITH GPS
  const handleTakePhoto = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.capture = 'environment';
    
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      // Try to get GPS location
      let gpsLocation = null;
      if (navigator.geolocation) {
        try {
          const position = await new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              enableHighAccuracy: true,
              timeout: 5000,
              maximumAge: 0
            });
          });
          gpsLocation = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy
          };
          console.log('📍 GPS location captured:', gpsLocation);
        } catch (gpsError) {
          console.warn('📍 GPS not available:', gpsError.message);
        }
      }

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
              has_measurements: false,
              has_gps: !!gpsLocation,
              location: gpsLocation
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

  // Calculate FFE stats for StatusOverview
  const getTotalItems = () => {
    if (!project || !project.rooms) return 0;
    return project.rooms.reduce((total, room) => 
      total + (room.categories || []).reduce((catTotal, category) => 
        catTotal + (category.subcategories || []).reduce((subTotal, subcategory) =>
          subTotal + (subcategory.items || []).length, 0
        ), 0
      ), 0
    );
  };

  const getStatusBreakdown = () => {
    const breakdown = {};
    if (!project || !project.rooms) return breakdown;
    
    project.rooms.forEach(room => {
      (room.categories || []).forEach(category => {
        (category.subcategories || []).forEach(subcategory => {
          (subcategory.items || []).forEach(item => {
            const status = item.status || 'TO BE SELECTED';
            breakdown[status] = (breakdown[status] || 0) + 1;
          });
        });
      });
    });
    
    return breakdown;
  };

  const getCarrierBreakdown = () => {
    const carriers = {};
    if (!project || !project.rooms) return carriers;
    
    project.rooms.forEach(room => {
      (room.categories || []).forEach(category => {
        (category.subcategories || []).forEach(subcategory => {
          (subcategory.items || []).forEach(item => {
            if (item.carrier) {
              carriers[item.carrier] = (carriers[item.carrier] || 0) + 1;
            }
          });
        });
      });
    });
    
    return carriers;
  };

  return (
    <div className="w-full h-full" style={{ backgroundColor: '#0F172A', overflow: 'auto' }}>
      {/* EXACT DESKTOP HEADER - WITH ENHANCED SHIMMER */}
      <div className="bg-gradient-to-r from-[#1E293B] to-[#0F172A] p-6 border-b-4 border-[#D4A574] shadow-2xl" style={{
        boxShadow: '0 4px 20px rgba(212, 165, 116, 0.3), inset 0 0 60px rgba(212, 165, 116, 0.05)'
      }}>
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-6">
            <h1 className="text-5xl font-bold text-[#D4A574] mb-2 tracking-wide" style={{
              textShadow: '0 0 20px rgba(212, 165, 116, 0.4), 0 0 40px rgba(212, 165, 116, 0.2)'
            }}>
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
            {/* ONLINE/OFFLINE STATUS INDICATOR */}
            <div className="mb-4 flex justify-center items-center gap-4">
              <div className={`flex items-center gap-2 px-4 py-2 rounded-full ${online ? 'bg-green-600/20 text-green-400' : 'bg-red-600/20 text-red-400'}`}>
                <span className={`w-3 h-3 rounded-full ${online ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></span>
                <span className="font-bold">{online ? '🌐 ONLINE' : '📴 OFFLINE'}</span>
              </div>
              {pendingCount > 0 && (
                <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-yellow-600/20 text-yellow-400">
                  <span className="font-bold">📤 {pendingCount} pending sync</span>
                </div>
              )}
              {syncStatus === 'syncing' && (
                <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-blue-600/20 text-blue-400">
                  <span className="animate-spin">🔄</span>
                  <span className="font-bold">Syncing...</span>
                </div>
              )}
              {sheetType === 'ffe' && online && (
                <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-purple-600/20 text-purple-400">
                  <span className="font-bold">⚡ Real-time sync active</span>
                </div>
              )}
            </div>
            
            <div className="inline-flex items-center gap-6">
              <button
                onClick={() => setShowAddRoom(true)}
                className="bg-gradient-to-r from-[#B49B7E] to-[#A08B6F] hover:from-[#A08B6F] hover:to-[#8B7355] px-8 py-3 rounded-full text-black font-bold text-lg shadow-xl"
              >
                ✥ ADD ROOM
              </button>
              
              <button
                onClick={async () => {
                  console.log('🔄 MANUAL SYNC - Reloading from server');
                  await performSync();
                  await loadProject();
                  alert('✅ Synced with server!');
                }}
                className={`px-8 py-3 rounded-full font-bold text-lg shadow-xl ${online ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-600'} text-white`}
                disabled={!online}
              >
                🔄 SYNC {pendingCount > 0 ? `(${pendingCount})` : ''}
              </button>
              
              <div className="bg-gradient-to-r from-[#D4A574] to-[#B49B7E] px-8 py-3 rounded-full" style={{
                boxShadow: '0 0 30px rgba(212, 165, 116, 0.4), inset 0 0 20px rgba(255, 255, 255, 0.1)'
              }}>
                <span className="text-2xl font-bold text-black tracking-wider">
                  {sheetType === 'ffe' ? 'FFE SPREADSHEET' : 'WALKTHROUGH SPREADSHEET'}
                </span>
              </div>
              
              <button
                onClick={connectLeica}
                disabled={leicaConnected}
                className={`px-8 py-3 rounded-full font-bold text-lg shadow-xl ${
                  leicaConnected 
                    ? 'bg-green-600 text-white' 
                    : 'bg-gray-700 hover:bg-gray-600 text-[#D4C5A9]'
                }`}
              >
                📏 {leicaConnected ? 'Leica Connected' : 'Connect Leica'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* STATUS OVERVIEW - ONLY FOR FFE */}
      {sheetType === 'ffe' && (
        <div className="px-4 py-4">
          <StatusOverview
            totalItems={getTotalItems()}
            statusBreakdown={getStatusBreakdown()}
            carrierBreakdown={getCarrierBreakdown()}
            itemStatuses={['PICKED', 'ORDERED', 'SHIPPED', 'DELIVERED', 'INSTALLED']}
          />
        </div>
      )}

      {/* ROOM TABS - WITH ENHANCED SHIMMER */}
      <div className="bg-[#1E293B] border-b-2 border-[#D4A574] overflow-x-auto" style={{
        boxShadow: 'inset 0 0 40px rgba(212, 165, 116, 0.08)'
      }}>
        <div className="flex">
          {project.rooms.map((room, index) => (
            <button
              key={room.id}
              onClick={() => setActiveRoomTab(index)}
              className={`px-6 py-4 font-bold text-lg border-b-4 transition-all min-w-max relative overflow-hidden ${
                activeRoomTab === index
                  ? 'text-[#D4A574]'
                  : 'text-[#D4C5A9] hover:text-[#D4A574]'
              }`}
              style={{ 
                background: activeRoomTab === index 
                  ? 'linear-gradient(135deg, rgba(0,0,0,0.95) 0%, rgba(30,30,30,0.9) 30%, rgba(15,15,25,0.95) 70%, rgba(0,0,0,0.95) 100%)'
                  : 'linear-gradient(135deg, rgba(15,15,25,0.95) 0%, rgba(45,45,55,0.9) 30%, rgba(25,25,35,0.95) 70%, rgba(15,15,25,0.95) 100%)',
                borderTop: `4px solid ${getRoomColor(room.name)}`,
                borderBottom: activeRoomTab === index ? '4px solid #D4A574' : '4px solid transparent',
                boxShadow: activeRoomTab === index 
                  ? `0 -2px 15px ${getRoomColor(room.name)}60, inset 0 0 30px ${getRoomColor(room.name)}08` 
                  : `0 -2px 6px ${getRoomColor(room.name)}30, inset 0 0 15px ${getRoomColor(room.name)}04`
              }}
            >
              {room.name}
              <div className="text-xs text-[#B49B7E]">
                {roomPhotos[room.id]?.length || 0} photos
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* ACTIVE ROOM CONTENT - SIMPLE SCROLLABLE */}
      <div className="p-4">
        {/* MOBILE TOOLBAR - Voice Notes & Punch List */}
        {activeRoom && (
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            {/* Voice Notes Button */}
            <button
              onClick={() => setShowVoiceNotes(!showVoiceNotes)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                showVoiceNotes 
                  ? 'bg-[#D4A574] text-white' 
                  : 'bg-[#D4A574]/20 text-[#D4A574] border border-[#D4A574]/30'
              }`}
            >
              🎤 Voice Notes
            </button>
            
            {/* Punch List Mode Button */}
            <button
              onClick={() => setPunchListMode(!punchListMode)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                punchListMode 
                  ? 'bg-orange-600 text-white' 
                  : 'bg-orange-600/20 text-orange-400 border border-orange-600/30'
              }`}
            >
              📋 {punchListMode ? 'Exit Punch List' : 'Punch List Mode'}
            </button>
            
            {/* GPS Status Indicator */}
            <div className="ml-auto flex items-center gap-1 text-xs text-gray-400">
              <span>📍</span>
              <span>GPS Active</span>
            </div>
          </div>
        )}
        
        {/* VOICE NOTES PANEL */}
        {showVoiceNotes && activeRoom && (
          <div className="mb-4">
            <VoiceNoteRecorder 
              projectId={projectId}
              roomId={activeRoom.id}
              onNoteSaved={(note) => {
                console.log('Voice note saved:', note);
              }}
            />
          </div>
        )}
        
        {/* PUNCH LIST MODE INDICATOR */}
        {punchListMode && (
          <div className="mb-4 p-4 rounded-lg border border-orange-500/30 bg-orange-500/10">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl">📋</span>
              <span className="text-orange-400 font-bold">PUNCH LIST MODE ACTIVE</span>
            </div>
            <p className="text-gray-400 text-sm">
              Tap items to add them to your punch list. Items with issues will be flagged for review.
            </p>
          </div>
        )}
        
        {activeRoom && activeRoom.categories?.map((category) => (
                <div key={category.id} className="mb-6">
                  {/* CATEGORY HEADER - GREEN GRADIENT WITH BALANCED SHIMMER */}
                  <div 
                    className="border-2 border-[#D4A574] p-3 font-bold text-white shadow-lg cursor-pointer rounded-lg overflow-hidden"
                    style={{ 
                      background: `linear-gradient(135deg, ${getCategoryColor()} 0%, ${getCategoryColor()}DD 50%, ${getCategoryColor()} 100%)`,
                      boxShadow: `0 0 22px ${getCategoryColor()}55, inset 0 0 45px rgba(255, 255, 255, 0.12), inset 0 0 85px rgba(0, 0, 0, 0.4)`,
                      textShadow: '0 2px 4px rgba(0, 0, 0, 0.7), 0 0 14px rgba(255, 255, 255, 0.3)'
                    }}
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
                      {sheetType === 'ffe' ? (
                        // FFE TABLE - 15 COLUMNS WITH SECTION HEADERS
                      <table className="w-full border-collapse border border-[#B49B7E] mb-4 mt-2 shadow-lg shadow-[#B49B7E]/10">
                        <thead>
                          {/* SECTION HEADERS */}
                          <tr>
                            <th colSpan="4" className="border border-[#B49B7E] px-2 py-1 text-xs font-bold text-white text-center" style={{ backgroundColor: '#8B4444' }}></th>
                            <th colSpan="3" className="border border-[#B49B7E] px-2 py-1 text-xs font-bold text-white text-center" style={{ 
                              background: 'linear-gradient(135deg, #8B4513FF 0%, #8B4513AA 20%, #8B4513 40%, #8B4513AA 80%, #8B4513FF 100%)',
                              boxShadow: '0 0 25px #8B451360, inset 0 0 50px rgba(255, 255, 255, 0.14), inset 0 0 80px rgba(0, 0, 0, 0.45)',
                              textShadow: '0 2px 6px rgba(0, 0, 0, 0.75), 0 0 16px rgba(255, 255, 255, 0.35)'
                            }}>ADDITIONAL INFO.</th>
                            <th colSpan="2" className="border border-[#D4A574] px-2 py-1 text-xs font-bold text-white text-center" style={{ 
                              background: 'linear-gradient(135deg, #D4A574FF 0%, #D4A574AA 20%, #D4A574 40%, #D4A574AA 80%, #D4A574FF 100%)',
                              boxShadow: '0 0 25px #D4A57460, inset 0 0 50px rgba(255, 255, 255, 0.14), inset 0 0 80px rgba(0, 0, 0, 0.45)',
                              textShadow: '0 2px 6px rgba(0, 0, 0, 0.75), 0 0 16px rgba(255, 255, 255, 0.35)'
                            }}>STOCK INFO.</th>
                            <th colSpan="6" className="border border-[#B49B7E] px-2 py-1 text-xs font-bold text-white text-center" style={{ 
                              background: 'linear-gradient(135deg, #6B46C1FF 0%, #6B46C1AA 20%, #6B46C1 40%, #6B46C1AA 80%, #6B46C1FF 100%)',
                              boxShadow: '0 0 25px #6B46C160, inset 0 0 50px rgba(255, 255, 255, 0.14), inset 0 0 80px rgba(0, 0, 0, 0.45)',
                              textShadow: '0 2px 6px rgba(0, 0, 0, 0.75), 0 0 16px rgba(255, 255, 255, 0.35)'
                            }}>SHIPPING INFO.</th>
                            <th colSpan="2" className="border border-[#B49B7E] px-2 py-1 text-xs font-bold text-white text-center" style={{ backgroundColor: '#8B4444' }}></th>
                          </tr>
                          {/* COLUMN HEADERS */}
                          <tr>
                            <th className="border border-[#B49B7E] px-2 py-2 text-xs font-bold text-white" style={{ 
                              background: 'linear-gradient(135deg, #8B4444FF 0%, #8B4444AA 20%, #8B4444 40%, #8B4444AA 80%, #8B4444FF 100%)',
                              boxShadow: '0 0 20px #8B444450, inset 0 0 40px rgba(255, 255, 255, 0.12), inset 0 0 70px rgba(0, 0, 0, 0.4)',
                              textShadow: '0 2px 4px rgba(0, 0, 0, 0.7), 0 0 12px rgba(255, 255, 255, 0.3)'
                            }}>INSTALLED</th>
                            <th className="border border-[#B49B7E] px-2 py-2 text-xs font-bold text-white" style={{ 
                              background: 'linear-gradient(135deg, #8B4444FF 0%, #8B4444AA 20%, #8B4444 40%, #8B4444AA 80%, #8B4444FF 100%)',
                              boxShadow: '0 0 20px #8B444450, inset 0 0 40px rgba(255, 255, 255, 0.12), inset 0 0 70px rgba(0, 0, 0, 0.4)',
                              textShadow: '0 2px 4px rgba(0, 0, 0, 0.7), 0 0 12px rgba(255, 255, 255, 0.3)'
                            }}>VENDOR/SKU</th>
                            <th className="border border-[#B49B7E] px-2 py-2 text-xs font-bold text-white" style={{ 
                              background: 'linear-gradient(135deg, #8B4444FF 0%, #8B4444AA 20%, #8B4444 40%, #8B4444AA 80%, #8B4444FF 100%)',
                              boxShadow: '0 0 20px #8B444450, inset 0 0 40px rgba(255, 255, 255, 0.12), inset 0 0 70px rgba(0, 0, 0, 0.4)',
                              textShadow: '0 2px 4px rgba(0, 0, 0, 0.7), 0 0 12px rgba(255, 255, 255, 0.3)'
                            }}>QTY</th>
                            <th className="border border-[#B49B7E] px-2 py-2 text-xs font-bold text-white" style={{ 
                              background: 'linear-gradient(135deg, #8B4444FF 0%, #8B4444AA 20%, #8B4444 40%, #8B4444AA 80%, #8B4444FF 100%)',
                              boxShadow: '0 0 20px #8B444450, inset 0 0 40px rgba(255, 255, 255, 0.12), inset 0 0 70px rgba(0, 0, 0, 0.4)',
                              textShadow: '0 2px 4px rgba(0, 0, 0, 0.7), 0 0 12px rgba(255, 255, 255, 0.3)'
                            }}>SIZE</th>
                            <th className="border border-[#B49B7E] px-2 py-2 text-xs font-bold text-white" style={{ 
                              background: 'linear-gradient(135deg, #8B4513FF 0%, #8B4513AA 20%, #8B4513 40%, #8B4513AA 80%, #8B4513FF 100%)',
                              boxShadow: '0 0 20px #8B451350, inset 0 0 40px rgba(255, 255, 255, 0.12), inset 0 0 70px rgba(0, 0, 0, 0.4)',
                              textShadow: '0 2px 4px rgba(0, 0, 0, 0.7), 0 0 12px rgba(255, 255, 255, 0.3)'
                            }}>FINISH/COLOR</th>
                            <th className="border border-[#B49B7E] px-2 py-2 text-xs font-bold text-white" style={{ 
                              background: 'linear-gradient(135deg, #8B4513FF 0%, #8B4513AA 20%, #8B4513 40%, #8B4513AA 80%, #8B4513FF 100%)',
                              boxShadow: '0 0 20px #8B451350, inset 0 0 40px rgba(255, 255, 255, 0.12), inset 0 0 70px rgba(0, 0, 0, 0.4)',
                              textShadow: '0 2px 4px rgba(0, 0, 0, 0.7), 0 0 12px rgba(255, 255, 255, 0.3)'
                            }}>COST/PRICE</th>
                            <th className="border border-[#B49B7E] px-2 py-2 text-xs font-bold text-white" style={{ 
                              background: 'linear-gradient(135deg, #8B4513FF 0%, #8B4513AA 20%, #8B4513 40%, #8B4513AA 80%, #8B4513FF 100%)',
                              boxShadow: '0 0 20px #8B451350, inset 0 0 40px rgba(255, 255, 255, 0.12), inset 0 0 70px rgba(0, 0, 0, 0.4)',
                              textShadow: '0 2px 4px rgba(0, 0, 0, 0.7), 0 0 12px rgba(255, 255, 255, 0.3)'
                            }}>IMAGE</th>
                            <th className="border border-[#D4A574] px-2 py-2 text-xs font-bold text-white" style={{ 
                              background: 'linear-gradient(135deg, #D4A574FF 0%, #D4A574AA 20%, #D4A574 40%, #D4A574AA 80%, #D4A574FF 100%)',
                              boxShadow: '0 0 20px #D4A57450, inset 0 0 40px rgba(255, 255, 255, 0.12), inset 0 0 70px rgba(0, 0, 0, 0.4)',
                              textShadow: '0 2px 4px rgba(0, 0, 0, 0.7), 0 0 12px rgba(255, 255, 255, 0.3)'
                            }}>STOCK STATUS/QTY</th>
                            <th className="border border-[#D4A574] px-2 py-2 text-xs font-bold text-white" style={{ 
                              background: 'linear-gradient(135deg, #D4A574FF 0%, #D4A574AA 20%, #D4A574 40%, #D4A574AA 80%, #D4A574FF 100%)',
                              boxShadow: '0 0 20px #D4A57450, inset 0 0 40px rgba(255, 255, 255, 0.12), inset 0 0 70px rgba(0, 0, 0, 0.4)',
                              textShadow: '0 2px 4px rgba(0, 0, 0, 0.7), 0 0 12px rgba(255, 255, 255, 0.3)'
                            }}>RESTOCK/LEAD TIME</th>
                            <th className="border border-[#B49B7E] px-2 py-2 text-xs font-bold text-white" style={{ 
                              background: 'linear-gradient(135deg, #6B46C1FF 0%, #6B46C1AA 20%, #6B46C1 40%, #6B46C1AA 80%, #6B46C1FF 100%)',
                              boxShadow: '0 0 20px #6B46C150, inset 0 0 40px rgba(255, 255, 255, 0.12), inset 0 0 70px rgba(0, 0, 0, 0.4)',
                              textShadow: '0 2px 4px rgba(0, 0, 0, 0.7), 0 0 12px rgba(255, 255, 255, 0.3)'
                            }}>ORDER DATE</th>
                            <th className="border border-[#B49B7E] px-2 py-2 text-xs font-bold text-white" style={{ 
                              background: 'linear-gradient(135deg, #6B46C1FF 0%, #6B46C1AA 20%, #6B46C1 40%, #6B46C1AA 80%, #6B46C1FF 100%)',
                              boxShadow: '0 0 20px #6B46C150, inset 0 0 40px rgba(255, 255, 255, 0.12), inset 0 0 70px rgba(0, 0, 0, 0.4)',
                              textShadow: '0 2px 4px rgba(0, 0, 0, 0.7), 0 0 12px rgba(255, 255, 255, 0.3)'
                            }}>STATUS/ORDER#</th>
                            <th className="border border-[#B49B7E] px-2 py-2 text-xs font-bold text-white" style={{ 
                              background: 'linear-gradient(135deg, #6B46C1FF 0%, #6B46C1AA 20%, #6B46C1 40%, #6B46C1AA 80%, #6B46C1FF 100%)',
                              boxShadow: '0 0 20px #6B46C150, inset 0 0 40px rgba(255, 255, 255, 0.12), inset 0 0 70px rgba(0, 0, 0, 0.4)',
                              textShadow: '0 2px 4px rgba(0, 0, 0, 0.7), 0 0 12px rgba(255, 255, 255, 0.3)'
                            }}>EST. DATES</th>
                            <th className="border border-[#B49B7E] px-2 py-2 text-xs font-bold text-white" style={{ 
                              background: 'linear-gradient(135deg, #6B46C1FF 0%, #6B46C1AA 20%, #6B46C1 40%, #6B46C1AA 80%, #6B46C1FF 100%)',
                              boxShadow: '0 0 20px #6B46C150, inset 0 0 40px rgba(255, 255, 255, 0.12), inset 0 0 70px rgba(0, 0, 0, 0.4)',
                              textShadow: '0 2px 4px rgba(0, 0, 0, 0.7), 0 0 12px rgba(255, 255, 255, 0.3)'
                            }}>INSTALL/SHIP TO</th>
                            <th className="border border-[#B49B7E] px-2 py-2 text-xs font-bold text-white" style={{ 
                              background: 'linear-gradient(135deg, #6B46C1FF 0%, #6B46C1AA 20%, #6B46C1 40%, #6B46C1AA 80%, #6B46C1FF 100%)',
                              boxShadow: '0 0 20px #6B46C150, inset 0 0 40px rgba(255, 255, 255, 0.12), inset 0 0 70px rgba(0, 0, 0, 0.4)',
                              textShadow: '0 2px 4px rgba(0, 0, 0, 0.7), 0 0 12px rgba(255, 255, 255, 0.3)'
                            }}>TRACKING/CARRIER</th>
                            <th className="border border-[#B49B7E] px-2 py-2 text-xs font-bold text-white" style={{ 
                              background: 'linear-gradient(135deg, #6B46C1FF 0%, #6B46C1AA 20%, #6B46C1 40%, #6B46C1AA 80%, #6B46C1FF 100%)',
                              boxShadow: '0 0 20px #6B46C150, inset 0 0 40px rgba(255, 255, 255, 0.12), inset 0 0 70px rgba(0, 0, 0, 0.4)',
                              textShadow: '0 2px 4px rgba(0, 0, 0, 0.7), 0 0 12px rgba(255, 255, 255, 0.3)'
                            }}>NOTES</th>
                            <th className="border border-[#B49B7E] px-2 py-2 text-xs font-bold text-white" style={{ 
                              background: 'linear-gradient(135deg, #8B4444FF 0%, #8B4444AA 20%, #8B4444 40%, #8B4444AA 80%, #8B4444FF 100%)',
                              boxShadow: '0 0 20px #8B444450, inset 0 0 40px rgba(255, 255, 255, 0.12), inset 0 0 70px rgba(0, 0, 0, 0.4)',
                              textShadow: '0 2px 4px rgba(0, 0, 0, 0.7), 0 0 12px rgba(255, 255, 255, 0.3)'
                            }}>LINK</th>
                            <th className="border border-[#B49B7E] px-2 py-2 text-xs font-bold text-white" style={{ 
                              background: 'linear-gradient(135deg, #8B4444FF 0%, #8B4444AA 20%, #8B4444 40%, #8B4444AA 80%, #8B4444FF 100%)',
                              boxShadow: '0 0 20px #8B444450, inset 0 0 40px rgba(255, 255, 255, 0.12), inset 0 0 70px rgba(0, 0, 0, 0.4)',
                              textShadow: '0 2px 4px rgba(0, 0, 0, 0.7), 0 0 12px rgba(255, 255, 255, 0.3)'
                            }}>DELETE</th>
                          </tr>
                        </thead>
                        <tbody>
                          {subcategory.items?.map((item, itemIndex) => (
                            <tr key={item.id} style={{ 
                              background: itemIndex % 2 === 0 
                                ? 'linear-gradient(135deg, rgba(0, 0, 0, 0.95) 0%, rgba(30, 30, 30, 0.9) 30%, rgba(15, 15, 25, 0.95) 70%, rgba(0, 0, 0, 0.95) 100%)'
                                : 'linear-gradient(135deg, rgba(15, 15, 25, 0.95) 0%, rgba(45, 45, 55, 0.9) 30%, rgba(25, 25, 35, 0.95) 70%, rgba(15, 15, 25, 0.95) 100%)'
                            }}>
                              <td className="border border-[#B49B7E] px-2 py-1 text-[#B49B7E] text-sm">{item.name}</td>
                              <td className="border border-[#B49B7E] px-2 py-1 text-[#B49B7E] text-sm">
                                <div contentEditable suppressContentEditableWarning className="outline-none" onBlur={(e) => updateItemOffline(item.id, { vendor: e.target.textContent })}>
                                  {item.vendor || ''}
                                </div>
                              </td>
                              <td className="border border-[#B49B7E] px-2 py-1 text-[#B49B7E] text-sm text-center">
                                <div contentEditable suppressContentEditableWarning className="outline-none" onBlur={(e) => updateItemOffline(item.id, { quantity: e.target.textContent })}>
                                  {item.quantity || ''}
                                </div>
                              </td>
                              <td className="border border-[#B49B7E] px-2 py-1 text-[#B49B7E] text-sm">
                                <div contentEditable suppressContentEditableWarning className="outline-none" onBlur={(e) => updateItemOffline(item.id, { size: e.target.textContent })}>
                                  {item.size || ''}
                                </div>
                              </td>
                              <td className="border border-[#B49B7E] px-2 py-1 text-[#B49B7E] text-sm">
                                <div contentEditable suppressContentEditableWarning className="outline-none" onBlur={(e) => updateItemOffline(item.id, { finish_color: e.target.textContent })}>
                                  {item.finish_color || ''}
                                </div>
                              </td>
                              <td className="border border-[#B49B7E] px-2 py-1 text-[#B49B7E] text-sm">
                                <div contentEditable suppressContentEditableWarning className="outline-none" onBlur={(e) => updateItemOffline(item.id, { cost: e.target.textContent })}>
                                  {item.cost || ''}
                                </div>
                              </td>
                              <td className="border border-[#B49B7E] px-2 py-1 text-center">
                                {item.image_url ? <img src={item.image_url} alt={item.name} className="w-12 h-12 object-cover rounded" /> : <span className="text-gray-500 text-xs">No image</span>}
                              </td>
                              <td className="border border-[#D4A574] px-1 py-1" style={{
                                background: item.stock_status ? `linear-gradient(135deg, ${getStockStatusColor(item.stock_status)}FF 0%, ${getStockStatusColor(item.stock_status)}AA 20%, ${getStockStatusColor(item.stock_status)} 40%, ${getStockStatusColor(item.stock_status)}AA 80%, ${getStockStatusColor(item.stock_status)}FF 100%)` : 'transparent',
                                boxShadow: item.stock_status ? `0 0 15px ${getStockStatusColor(item.stock_status)}40` : 'none'
                              }}>
                                <div className="flex flex-col h-full">
                                  <div className="h-6 mb-1">
                                    <select value={item.stock_status || ''} onChange={(e) => updateItemOffline(item.id, { stock_status: e.target.value })} className="w-full h-full bg-transparent border-none text-white text-xs p-0">
                                      <option value="">—</option>
                                      <option value="IN STOCK">✅ IN STOCK</option>
                                      <option value="LOW STOCK">⚠️ LOW STOCK</option>
                                      <option value="OUT OF STOCK">❌ OUT OF STOCK</option>
                                      <option value="BACKORDERED">⏳ BACKORDERED</option>
                                      <option value="DISCONTINUED">🚫 DISCONTINUED</option>
                                    </select>
                                  </div>
                                  <div className="h-6">
                                    <input type="number" defaultValue={item.stock_quantity || ''} placeholder="Qty" onBlur={(e) => updateItemOffline(item.id, { stock_quantity: e.target.value })} className="w-full h-full bg-transparent border-none text-white text-xs text-center p-0" />
                                  </div>
                                </div>
                              </td>
                              <td className="border border-[#D4A574] px-1 py-1">
                                <div className="flex flex-col h-full">
                                  <div className="h-6 mb-1">
                                    <input type="date" defaultValue={item.restock_date || ''} onBlur={(e) => updateItemOffline(item.id, { restock_date: e.target.value })} className="w-full h-full bg-transparent border-none text-white text-xs p-0" />
                                  </div>
                                  <div className="h-6">
                                    <input type="number" defaultValue={item.lead_time_weeks || ''} placeholder="8" onBlur={(e) => updateItemOffline(item.id, { lead_time_weeks: e.target.value })} className="w-full h-full bg-transparent border-none text-[#D4A574] text-xs text-center p-0" />
                                  </div>
                                </div>
                              </td>
                              <td className="border border-[#B49B7E] px-1 py-1">
                                <input type="date" defaultValue={item.order_date || ''} onBlur={(e) => updateItemOffline(item.id, { order_date: e.target.value })} className="bg-transparent text-[#B49B7E] text-xs w-full" />
                              </td>
                              <td className="border border-[#B49B7E] px-1 py-1" style={{
                                background: item.status ? `linear-gradient(135deg, ${getStatusColor(item.status)}FF 0%, ${getStatusColor(item.status)}AA 20%, ${getStatusColor(item.status)} 40%, ${getStatusColor(item.status)}AA 80%, ${getStatusColor(item.status)}FF 100%)` : 'transparent',
                                boxShadow: item.status ? `0 0 15px ${getStatusColor(item.status)}40, inset 0 0 30px rgba(255, 255, 255, 0.1)` : 'none'
                              }}>
                                <div className="flex flex-col h-full">
                                  <div className="h-6 mb-1">
                                    <select value={item.status || ''} onChange={(e) => updateItemOffline(item.id, { status: e.target.value })} className="w-full h-full bg-transparent border-none text-white text-xs p-0">
                                      <option value="">—</option>
                                      <option value="TO BE SELECTED">⚪ TO BE SELECTED</option>
                                      <option value="RESEARCHING">🔵 RESEARCHING</option>
                                      <option value="PENDING APPROVAL">🟡 PENDING APPROVAL</option>
                                      <option value="APPROVED">🟢 APPROVED</option>
                                      <option value="ORDERED">🔷 ORDERED</option>
                                      <option value="PICKED">⭐ PICKED</option>
                                      <option value="CONFIRMED">🟩 CONFIRMED</option>
                                      <option value="IN PRODUCTION">🟠 IN PRODUCTION</option>
                                      <option value="SHIPPED">🚢 SHIPPED</option>
                                      <option value="IN TRANSIT">🟣 IN TRANSIT</option>
                                      <option value="OUT FOR DELIVERY">📦 OUT FOR DELIVERY</option>
                                      <option value="DELIVERED TO RECEIVER">💜 DELIVERED TO RECEIVER</option>
                                      <option value="DELIVERED TO JOB SITE">💗 DELIVERED TO JOB SITE</option>
                                      <option value="RECEIVED">📥 RECEIVED</option>
                                      <option value="READY FOR INSTALL">🔧 READY FOR INSTALL</option>
                                      <option value="INSTALLING">🛠️ INSTALLING</option>
                                      <option value="INSTALLED">✅ INSTALLED</option>
                                      <option value="ON HOLD">⏸️ ON HOLD</option>
                                      <option value="BACKORDERED">⏳ BACKORDERED</option>
                                      <option value="DAMAGED">💔 DAMAGED</option>
                                      <option value="RETURNED">↩️ RETURNED</option>
                                      <option value="CANCELLED">❌ CANCELLED</option>
                                    </select>
                                  </div>
                                  <div className="h-6">
                                    <input type="text" defaultValue={item.order_number || ''} placeholder="Order #" onBlur={(e) => updateItemOffline(item.id, { order_number: e.target.value })} className="w-full h-full bg-transparent border-none text-[#B49B7E] text-xs p-0" />
                                  </div>
                                </div>
                              </td>
                              <td className="border border-[#B49B7E] px-1 py-1">
                                <div className="flex flex-col h-full">
                                  <div className="h-6 mb-1">
                                    <input type="date" className="w-full h-full bg-transparent border-none text-white text-xs p-0" />
                                  </div>
                                  <div className="h-6">
                                    <input type="date" className="w-full h-full bg-transparent border-none text-white text-xs p-0" />
                                  </div>
                                </div>
                              </td>
                              <td className="border border-[#B49B7E] px-1 py-1">
                                <div className="flex flex-col h-full">
                                  <div className="h-6 mb-1">
                                    <input type="date" className="w-full h-full bg-transparent border-none text-white text-xs p-0" />
                                  </div>
                                  <div className="h-6">
                                    <select className="w-full h-full bg-gray-800 border-none text-white text-xs p-0">
                                      <option value="">Ship To...</option>
                                      <option value="CLIENT HOME">CLIENT HOME</option>
                                      <option value="JOB SITE">JOB SITE</option>
                                    </select>
                                  </div>
                                </div>
                              </td>
                              <td className="border border-[#B49B7E] px-1 py-1" style={{
                                background: item.carrier ? `linear-gradient(135deg, ${getCarrierColor(item.carrier)}FF 0%, ${getCarrierColor(item.carrier)}AA 20%, ${getCarrierColor(item.carrier)} 40%, ${getCarrierColor(item.carrier)}AA 80%, ${getCarrierColor(item.carrier)}FF 100%)` : 'transparent',
                                boxShadow: item.carrier ? `0 0 15px ${getCarrierColor(item.carrier)}40, inset 0 0 30px rgba(255, 255, 255, 0.1)` : 'none'
                              }}>
                                <div className="flex flex-col h-full">
                                  <div className="h-6 mb-1">
                                    <input type="text" defaultValue={item.tracking_number || ''} placeholder="Live Tracking #" onBlur={(e) => updateItemOffline(item.id, { tracking_number: e.target.value })} className="w-full h-full bg-transparent border-none text-white text-xs p-0" />
                                  </div>
                                  <div className="h-6">
                                    <select value={item.carrier || ''} onChange={(e) => updateItemOffline(item.id, { carrier: e.target.value })} className="w-full h-full bg-transparent border-none text-white text-xs p-0">
                                      <option value="">—</option>
                                      <option value="FedEx">FedEx</option>
                                      <option value="FedEx Ground">FedEx Ground</option>
                                      <option value="FedEx Express">FedEx Express</option>
                                      <option value="UPS">UPS</option>
                                      <option value="UPS Ground">UPS Ground</option>
                                      <option value="UPS Express">UPS Express</option>
                                      <option value="USPS">USPS</option>
                                      <option value="DHL">DHL</option>
                                      <option value="Brooks">Brooks</option>
                                      <option value="Zenith">Zenith</option>
                                      <option value="Sunbelt">Sunbelt</option>
                                      <option value="R+L Carriers">R+L Carriers</option>
                                    </select>
                                  </div>
                                </div>
                              </td>
                              <td className="border border-[#B49B7E] px-2 py-1">
                                <textarea className="bg-transparent text-[#B49B7E] text-xs w-full" rows="2" placeholder="Notes"></textarea>
                              </td>
                              <td className="border border-[#B49B7E] px-1 py-1">
                                <div className="flex flex-col h-full gap-1">
                                  <input type="text" placeholder="Product URL" className="w-full bg-transparent border border-gray-600 text-blue-400 text-xs px-1 rounded" />
                                  <button className="w-full bg-green-600 text-white text-xs px-2 py-1 rounded">SCRAPE</button>
                                </div>
                              </td>
                              <td className="border border-[#B49B7E] px-1 py-1 text-center">
                                <button onClick={() => handleDeleteItem(item.id)} className="text-red-400 hover:text-red-300 text-sm font-bold">🗑️</button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      ) : (
                        // WALKTHROUGH TABLE - 6 COLUMNS
                      <table className="w-full border-collapse border border-[#B49B7E] mb-4 mt-2 shadow-lg shadow-[#B49B7E]/10">
                        <thead>
                          <tr>
                            <th className="border border-[#B49B7E] px-1 py-2 text-xs font-bold text-white w-8" style={{ 
                                    background: 'linear-gradient(135deg, #8B4444FF 0%, #8B4444AA 20%, #8B4444 40%, #8B4444AA 80%, #8B4444FF 100%)',
                                    boxShadow: '0 0 20px #8B444450, inset 0 0 40px rgba(255, 255, 255, 0.12), inset 0 0 70px rgba(0, 0, 0, 0.4)',
                                    textShadow: '0 2px 4px rgba(0, 0, 0, 0.7), 0 0 12px rgba(255, 255, 255, 0.3)'
                                  }}>✓</th>
                            <th className="border border-[#B49B7E] px-2 py-2 text-xs font-bold text-white" style={{ 
                                    background: 'linear-gradient(135deg, #8B4444FF 0%, #8B4444AA 20%, #8B4444 40%, #8B4444AA 80%, #8B4444FF 100%)',
                                    boxShadow: '0 0 20px #8B444450, inset 0 0 40px rgba(255, 255, 255, 0.12), inset 0 0 70px rgba(0, 0, 0, 0.4)',
                                    textShadow: '0 2px 4px rgba(0, 0, 0, 0.7), 0 0 12px rgba(255, 255, 255, 0.3)'
                                  }}>
                              {subcategory.name.toUpperCase()}
                              <button onClick={() => handleAddBlankItem(subcategory.id)} className="ml-2 bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded text-xs font-bold">
                                + ADD ITEM
                              </button>
                            </th>
                            <th className="border border-[#B49B7E] px-2 py-2 text-xs font-bold text-white w-16" style={{ 
                                    background: 'linear-gradient(135deg, #8B4444FF 0%, #8B4444AA 20%, #8B4444 40%, #8B4444AA 80%, #8B4444FF 100%)',
                                    boxShadow: '0 0 20px #8B444450, inset 0 0 40px rgba(255, 255, 255, 0.12), inset 0 0 70px rgba(0, 0, 0, 0.4)',
                                    textShadow: '0 2px 4px rgba(0, 0, 0, 0.7), 0 0 12px rgba(255, 255, 255, 0.3)'
                                  }}>QTY</th>
                            <th className="border border-[#B49B7E] px-2 py-2 text-xs font-bold text-white" style={{ 
                                    background: 'linear-gradient(135deg, #8B4444FF 0%, #8B4444AA 20%, #8B4444 40%, #8B4444AA 80%, #8B4444FF 100%)',
                                    boxShadow: '0 0 20px #8B444450, inset 0 0 40px rgba(255, 255, 255, 0.12), inset 0 0 70px rgba(0, 0, 0, 0.4)',
                                    textShadow: '0 2px 4px rgba(0, 0, 0, 0.7), 0 0 12px rgba(255, 255, 255, 0.3)'
                                  }}>SIZE</th>
                            <th className="border border-[#B49B7E] px-2 py-2 text-xs font-bold text-white" style={{ 
                                    background: 'linear-gradient(135deg, #8B4444FF 0%, #8B4444AA 20%, #8B4444 40%, #8B4444AA 80%, #8B4444FF 100%)',
                                    boxShadow: '0 0 20px #8B444450, inset 0 0 40px rgba(255, 255, 255, 0.12), inset 0 0 70px rgba(0, 0, 0, 0.4)',
                                    textShadow: '0 2px 4px rgba(0, 0, 0, 0.7), 0 0 12px rgba(255, 255, 255, 0.3)'
                                  }}>FINISH/COLOR</th>
                            <th className="border border-[#B49B7E] px-2 py-2 text-xs font-bold text-white w-12" style={{ 
                                    background: 'linear-gradient(135deg, #8B4444FF 0%, #8B4444AA 20%, #8B4444 40%, #8B4444AA 80%, #8B4444FF 100%)',
                                    boxShadow: '0 0 20px #8B444450, inset 0 0 40px rgba(255, 255, 255, 0.12), inset 0 0 70px rgba(0, 0, 0, 0.4)',
                                    textShadow: '0 2px 4px rgba(0, 0, 0, 0.7), 0 0 12px rgba(255, 255, 255, 0.3)'
                                  }}>DELETE</th>
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
                                    const BACKEND_URL = (window.ENV?.REACT_APP_BACKEND_URL || window.location.origin) || window.location.origin;
                                    
                                    // DIRECT BACKEND SAVE
                                    try {
                                      await fetch(`${BACKEND_URL}/api/items/${item.id}`, {
                                        method: 'PUT',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({ status: newStatus })
                                      });
                                      console.log('✅ Mobile checkbox saved to backend!');
                                      
                                      // AUTO-SYNC TO CHECKLIST: Only PICKED items sync to desktop
                                      await fetch(`${BACKEND_URL}/api/sync/walkthrough-to-checklist/${project.id}`, {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({ sync_all: false })
                                      });
                                      console.log('✅ Auto-synced to checklist!');
                                      
                                    } catch (err) {
                                      console.error('❌ Failed to save/sync:', err);
                                    }
                                    
                                    // Update local state immediately - NO RELOAD
                                    setProject(prevProject => {
                                      const updated = JSON.parse(JSON.stringify(prevProject));
                                      updated.rooms = updated.rooms.map(r => ({
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
                                      return updated;
                                    });
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
                      )}
                    </React.Fragment>
                  ))}
                </div>
              ))}
            {activeRoom && (
            <div className="bg-[#1E293B] p-6 border-t-4 border-[#D4A574] mt-8">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-2xl font-bold text-[#D4A574]">📸 {activeRoom.name} Photos</h3>
                <div className="flex gap-4">
                  {compareMode && (
                    <button
                      onClick={() => {
                        setCompareMode(false);
                        setComparePhoto(null);
                      }}
                      className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-xl font-bold text-lg"
                    >
                      ✕ Exit Compare
                    </button>
                  )}
                  
                  <button
                    onClick={() => {
                      const sorted = [...(roomPhotos[activeRoom.id] || [])].sort((a, b) => {
                        const timeA = new Date(a.metadata?.timestamp || 0).getTime();
                        const timeB = new Date(b.metadata?.timestamp || 0).getTime();
                        return timeA - timeB;
                      });
                      
                      let timeline = `📅 PHOTO TIMELINE - ${activeRoom.name}\n\n`;
                      sorted.forEach((p, i) => {
                        const time = new Date(p.metadata?.timestamp || 0).toLocaleString();
                        const measurements = p.metadata?.measurement_count || 0;
                        timeline += `${i + 1}. ${time}${measurements > 0 ? ` - 📏 ${measurements} measurements` : ''}\n`;
                      });
                      
                      alert(timeline);
                    }}
                    className="bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 text-white px-6 py-3 rounded-xl font-bold text-lg"
                  >
                    📅 Timeline
                  </button>
                  
                  <button
                    onClick={handleTakePhoto}
                    className="bg-gradient-to-r from-[#D4A574] to-[#B48554] hover:from-[#E4B584] hover:to-[#C49564] text-black px-6 py-3 rounded-xl font-bold text-lg"
                  >
                    📸 Take Photo
                  </button>
                  
                  <label className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white px-6 py-3 rounded-xl font-bold text-lg cursor-pointer flex items-center gap-2">
                    📤 Upload Multiple
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      className="hidden"
                      onChange={async (e) => {
                        const files = Array.from(e.target.files);
                        if (files.length === 0) return;
                        
                        console.log(`📤 Uploading ${files.length} photos...`);
                        let successCount = 0;
                        
                        for (const file of files) {
                          try {
                            const reader = new FileReader();
                            await new Promise((resolve, reject) => {
                              reader.onload = async (event) => {
                                try {
                                  await axios.post(`${API_URL}/photos/upload`, {
                                    project_id: projectId,
                                    room_id: activeRoom.id,
                                    photo_data: event.target.result,
                                    file_name: file.name,
                                    metadata: {
                                      room_name: activeRoom.name,
                                      timestamp: new Date().toISOString(),
                                      has_measurements: false,
                                      batch_upload: true
                                    }
                                  });
                                  successCount++;
                                  resolve();
                                } catch (error) {
                                  console.error('Error uploading:', file.name, error);
                                  reject(error);
                                }
                              };
                              reader.onerror = reject;
                              reader.readAsDataURL(file);
                            });
                          } catch (error) {
                            console.error('Failed to upload:', file.name);
                          }
                        }
                        
                        alert(`✅ Successfully uploaded ${successCount} of ${files.length} photos!`);
                        await loadAllPhotos();
                        e.target.value = ''; // Reset input
                      }}
                    />
                  </label>
                  
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
                      if (compareMode) {
                        if (!comparePhoto) {
                          setComparePhoto(photo);
                          alert('✅ First photo selected. Now click another photo to compare.');
                        } else if (comparePhoto.id !== photo.id) {
                          setSelectedPhoto(photo);
                        }
                      } else {
                        setSelectedPhoto(photo);
                        if (photo.metadata?.measurements && Array.isArray(photo.metadata.measurements)) {
                          setMeasurements(photo.metadata.measurements);
                          console.log('✅ Loaded existing measurements:', photo.metadata.measurements.length);
                        } else {
                          setMeasurements([]);
                        }
                      }
                    }}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      if (!compareMode) {
                        setCompareMode(true);
                        setComparePhoto(photo);
                        alert('📊 Compare Mode activated! Click another photo to view side-by-side.');
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
            )}
        )}
      </div>

      {/* PHOTO EDITOR MODAL - EDIT EXISTING PHOTOS */}
      {selectedPhoto && !compareMode && (
        <div className="fixed inset-0 bg-black z-50 flex flex-col">
          {/* EXACT DESKTOP HEADER STYLE */}
          <div className="bg-gradient-to-r from-[#1E293B] to-[#0F172A] p-6 border-b-4 border-[#D4A574] shadow-2xl">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-3xl font-bold text-[#D4A574] mb-1">📏 Edit Measurements</h3>
                <div className="text-lg text-[#D4C5A9]">
                  {selectedPhoto.metadata?.room_name || 'Photo'} • {measurements.length} measurements
                </div>
              </div>
              <button
                onClick={() => {
                  setSelectedPhoto(null);
                  setMeasurements([]);
                  setDrawingArrow(null);
                }}
                className="text-[#D4A574] text-4xl hover:text-red-400"
              >
                ✕
              </button>
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
                
                <div className="w-px h-8 bg-[#D4A574]"></div>
                
                {/* Calculator Toggle */}
                <button
                  onClick={() => setShowCalculator(!showCalculator)}
                  className="px-4 py-2 bg-[#D4A574] hover:bg-[#C49564] text-black rounded-lg font-bold text-lg"
                  title="Measurement Calculator"
                >
                  🧮
                </button>
                
                <div className="w-px h-8 bg-[#D4A574]"></div>
                
                {/* Grid Overlay Toggle */}
                <button
                  onClick={() => setShowGrid(!showGrid)}
                  className={`px-4 py-2 rounded-lg font-bold text-lg ${
                    showGrid 
                      ? 'bg-green-600 text-white' 
                      : 'bg-[#D4A574] hover:bg-[#C49564] text-black'
                  }`}
                  title="Rule of Thirds Grid"
                >
                  {showGrid ? '✓' : '#'}
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
          <div className="flex-1 p-2 flex items-center justify-center bg-black overflow-hidden relative">
            {/* CALCULATOR POPUP */}
            {showCalculator && (
              <div className="absolute top-4 right-4 bg-[#1E293B] border-2 border-[#D4A574] rounded-xl p-4 shadow-2xl z-50 w-80">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="text-[#D4A574] font-bold">🧮 Measurement Calculator</h4>
                  <button
                    onClick={() => setShowCalculator(false)}
                    className="text-[#D4A574] hover:text-red-400 text-xl"
                  >
                    ✕
                  </button>
                </div>
                
                <div className="space-y-3">
                  <input
                    type="text"
                    value={calcInput}
                    onChange={(e) => setCalcInput(e.target.value)}
                    placeholder="e.g., 3 × 8'6&quot; or 12'3&quot; + 5'9&quot;"
                    className="w-full bg-gray-700 text-white px-3 py-2 rounded border-2 border-gray-600 focus:border-[#D4A574] focus:outline-none"
                  />
                  
                  <button
                    onClick={() => {
                      try {
                        // Parse feet/inches and calculate
                        let expression = calcInput;
                        
                        // Convert feet-inches to decimal feet
                        const feetInchPattern = /(\d+)'(\d+)"/g;
                        expression = expression.replace(feetInchPattern, (match, feet, inches) => {
                          return (parseFloat(feet) + parseFloat(inches) / 12).toString();
                        });
                        
                        // Replace × with *
                        expression = expression.replace(/×/g, '*');
                        
                        // Evaluate
                        const result = eval(expression);
                        
                        // Convert back to feet-inches
                        const totalFeet = Math.floor(result);
                        const inches = Math.round((result - totalFeet) * 12);
                        
                        const resultStr = `${totalFeet}'${inches}"`;
                        setCalcResult(resultStr);
                        setLastMeasurement({ feetInches: resultStr, manual: true });
                        
                      } catch (error) {
                        setCalcResult('Error: Invalid expression');
                      }
                    }}
                    className="w-full bg-gradient-to-r from-[#D4A574] to-[#B48554] hover:from-[#E4B584] hover:to-[#C49564] text-black px-4 py-2 rounded-xl font-bold"
                  >
                    Calculate
                  </button>
                  
                  {calcResult && (
                    <div className="bg-green-600 text-white px-3 py-2 rounded-xl font-bold text-center">
                      Result: {calcResult}
                    </div>
                  )}
                  
                  <div className="text-xs text-gray-400">
                    <p className="font-bold mb-1">Examples:</p>
                    <p>• 3 × 8'6&quot; (multiply)</p>
                    <p>• 12'3&quot; + 5'9&quot; (add)</p>
                    <p>• 20'0&quot; - 3'4&quot; (subtract)</p>
                  </div>
                </div>
              </div>
            )}
            
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
              
              {/* RULE OF THIRDS GRID OVERLAY */}
              {showGrid && (
                <svg className="absolute top-0 left-0 w-full h-full pointer-events-none" style={{ zIndex: 5 }}>
                  {/* Vertical lines */}
                  <line x1="33.33%" y1="0" x2="33.33%" y2="100%" stroke="#FFD700" strokeWidth="1" opacity="0.5" strokeDasharray="5,5" />
                  <line x1="66.66%" y1="0" x2="66.66%" y2="100%" stroke="#FFD700" strokeWidth="1" opacity="0.5" strokeDasharray="5,5" />
                  {/* Horizontal lines */}
                  <line x1="0" y1="33.33%" x2="100%" y2="33.33%" stroke="#FFD700" strokeWidth="1" opacity="0.5" strokeDasharray="5,5" />
                  <line x1="0" y1="66.66%" x2="100%" y2="66.66%" stroke="#FFD700" strokeWidth="1" opacity="0.5" strokeDasharray="5,5" />
                </svg>
              )}
              
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
                    stroke={drawingArrow.color} strokeWidth={arrowThickness.toString()} opacity="0.8"
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
                      onClick={() => {
                        handleDuplicateArrow(editingArrow);
                        setEditingArrow(null);
                      }}
                      className="px-6 py-3 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white rounded-xl font-bold"
                    >
                      📋 DUPLICATE
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

      {/* SIDE-BY-SIDE COMPARE MODAL */}
      {compareMode && selectedPhoto && comparePhoto && (
        <div className="fixed inset-0 bg-black z-50 flex flex-col">
          <div className="bg-[#1E293B] p-4 border-b-2 border-[#D4A574]">
            <div className="flex justify-between items-center">
              <h3 className="text-2xl font-bold text-[#D4A574]">📊 Side-by-Side Compare</h3>
              <button
                onClick={() => {
                  setCompareMode(false);
                  setSelectedPhoto(null);
                  setComparePhoto(null);
                }}
                className="text-[#D4A574] text-3xl hover:text-red-400"
              >
                ✕
              </button>
            </div>
          </div>
          
          <div className="flex-1 flex gap-4 p-4 bg-black">
            <div className="flex-1 flex flex-col">
              <div className="bg-[#1E293B] px-4 py-2 rounded-t-xl">
                <h4 className="text-[#D4A574] font-bold">Photo 1</h4>
                <p className="text-sm text-gray-300">{comparePhoto.metadata?.room_name || 'Photo'} - {comparePhoto.metadata?.measurement_count || 0} measurements</p>
              </div>
              <div className="relative flex-1 flex items-center justify-center bg-gray-900 rounded-b-xl border-2 border-[#D4A574]">
                <img src={comparePhoto.photo_data} alt="Compare 1" className="max-w-full max-h-full object-contain" />
              </div>
            </div>
            
            <div className="flex-1 flex flex-col">
              <div className="bg-[#1E293B] px-4 py-2 rounded-t-xl">
                <h4 className="text-[#D4A574] font-bold">Photo 2</h4>
                <p className="text-sm text-gray-300">{selectedPhoto.metadata?.room_name || 'Photo'} - {selectedPhoto.metadata?.measurement_count || 0} measurements</p>
              </div>
              <div className="relative flex-1 flex items-center justify-center bg-gray-900 rounded-b-xl border-2 border-[#D4A574]">
                <img src={selectedPhoto.photo_data} alt="Compare 2" className="max-w-full max-h-full object-contain" />
              </div>
            </div>
          </div>
          
          <div className="bg-[#1E293B] p-4 border-t-4 border-[#D4A574]">
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => {
                  const temp = selectedPhoto;
                  setSelectedPhoto(comparePhoto);
                  setComparePhoto(temp);
                }}
                className="px-8 py-3 bg-[#D4A574] hover:bg-[#C49564] text-black rounded-xl font-bold text-lg"
              >
                🔄 SWAP
              </button>
              <button
                onClick={() => {
                  setCompareMode(false);
                  setSelectedPhoto(null);
                  setComparePhoto(null);
                }}
                className="px-8 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-xl font-bold text-lg"
              >
                ✕ CLOSE
              </button>
            </div>
          </div>
        </div>
      )}\n\n      {/* ADD ROOM MODAL */}
      {showAddRoom && (
        <div className="fixed inset-0 bg-black bg-opacity-95 flex items-center justify-center z-50 p-4">
          <div className="rounded-2xl p-8 max-w-4xl w-full border-2 border-[#D4A574] max-h-[90vh] overflow-y-auto" style={{
            background: 'linear-gradient(135deg, rgba(0,0,0,0.98) 0%, rgba(30,30,30,0.95) 20%, rgba(15,15,25,0.98) 40%, rgba(30,30,30,0.95) 60%, rgba(15,15,25,0.98) 80%, rgba(0,0,0,0.98) 100%)',
            boxShadow: '0 0 60px rgba(212, 165, 116, 0.3), inset 0 0 80px rgba(212, 165, 116, 0.05)'
          }}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-3xl font-bold text-[#D4A574]">Add New Room(s)</h3>
              <button
                onClick={() => setShowAddRoom(false)}
                className="text-[#D4A574] text-3xl hover:text-red-400 font-bold"
              >
                ✕
              </button>
            </div>
            
            <div className="mb-8">
              <label className="text-[#D4C5A9] text-lg font-bold mb-3 block">Custom Room Name</label>
              <input
                type="text"
                value={newRoomName}
                onChange={(e) => setNewRoomName(e.target.value)}
                placeholder="Enter custom room name..."
                className="w-full bg-gray-900 text-[#D4C5A9] px-6 py-4 rounded-xl text-xl border-2 border-[#B49B7E] focus:border-[#D4A574] focus:outline-none"
                style={{
                  background: 'linear-gradient(135deg, rgba(0,0,0,0.95) 0%, rgba(20,20,30,0.9) 50%, rgba(0,0,0,0.95) 100%)'
                }}
                onKeyPress={(e) => e.key === 'Enter' && newRoomName.trim() && handleAddRoom()}
              />
            </div>

            <div className="mb-8">
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-[#D4C5A9] text-lg font-bold">Quick Select Rooms (Multi-Select)</h4>
                <span className="text-[#D4A574] text-sm">
                  {selectedRoomsToAdd?.length || 0} room(s) selected
                </span>
              </div>
              <div className="grid grid-cols-3 gap-4">
                {[
                  'Living Room', 'Kitchen', 'Master Bedroom',
                  'Bedroom 2', 'Bedroom 3', 'Bathroom', 
                  'Master Bathroom', 'Powder Room', 'Dining Room',
                  'Office', 'Family Room', 'Basement',
                  'Laundry Room', 'Mudroom', 'Pantry',
                  'Closet', 'Guest Room', 'Playroom',
                  'Library', 'Wine Cellar', 'Garage',
                  'Patio', 'Balcony', 'Foyer'
                ].map((roomName) => {
                  const roomColor = getRoomColor(roomName);
                  const isSelected = selectedRoomsToAdd?.includes(roomName);
                  return (
                    <button
                      key={roomName}
                      onClick={() => {
                        if (isSelected) {
                          setSelectedRoomsToAdd(prev => prev.filter(r => r !== roomName));
                        } else {
                          setSelectedRoomsToAdd(prev => [...(prev || []), roomName]);
                        }
                      }}
                      className={`p-4 rounded-xl border-2 font-bold text-lg transition-all transform hover:scale-105 overflow-hidden ${
                        isSelected ? 'border-green-500 text-green-400' : 'border-[#B49B7E] hover:border-[#D4A574] text-[#D4C5A9]'
                      }`}
                      style={{ 
                        background: isSelected 
                          ? 'linear-gradient(135deg, rgba(34,197,94,0.2) 0%, rgba(30,30,30,0.9) 30%, rgba(15,15,25,0.95) 70%, rgba(34,197,94,0.2) 100%)'
                          : 'linear-gradient(135deg, rgba(0,0,0,0.95) 0%, rgba(30,30,30,0.9) 30%, rgba(15,15,25,0.95) 70%, rgba(0,0,0,0.95) 100%)',
                        borderTop: `4px solid ${isSelected ? '#22c55e' : roomColor}`,
                        boxShadow: isSelected 
                          ? `0 0 25px rgba(34,197,94,0.5), 0 -3px 15px rgba(34,197,94,0.3), inset 0 0 30px rgba(34,197,94,0.1)` 
                          : `0 -2px 8px ${roomColor}40, inset 0 0 20px ${roomColor}05`
                      }}
                    >
                      {isSelected && <span className="mr-2">✓</span>}
                      {roomName}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex gap-6">
              <button 
                onClick={() => {
                  setShowAddRoom(false);
                  setSelectedRoomsToAdd([]);
                  setNewRoomName('');
                }}
                className="flex-1 bg-gray-600 hover:bg-gray-700 text-white px-8 py-4 rounded-xl font-bold text-xl"
              >
                Cancel
              </button>
              <button 
                onClick={async () => {
                  // Add custom room if entered
                  if (newRoomName.trim()) {
                    await handleAddRoom();
                  }
                  // Add all selected rooms
                  if (selectedRoomsToAdd?.length > 0) {
                    for (const roomName of selectedRoomsToAdd) {
                      setNewRoomName(roomName);
                      await handleAddRoom();
                    }
                  }
                  setSelectedRoomsToAdd([]);
                  setNewRoomName('');
                  setShowAddRoom(false);
                }}
                disabled={!newRoomName.trim() && (!selectedRoomsToAdd || selectedRoomsToAdd.length === 0)}
                className="flex-1 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 disabled:from-gray-500 disabled:to-gray-600 text-white px-8 py-4 rounded-xl font-bold text-xl"
              >
                Add {(selectedRoomsToAdd?.length || 0) + (newRoomName.trim() ? 1 : 0)} Room(s)
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
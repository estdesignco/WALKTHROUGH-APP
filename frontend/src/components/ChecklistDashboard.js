import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { projectAPI, roomAPI, categoryAPI, itemAPI } from '../App';
import ExactChecklistSpreadsheet from './ExactChecklistSpreadsheet';
import ChecklistStatusOverview from './ChecklistStatusOverview';
import AddMultipleRoomsModal from './AddMultipleRoomsModal';
import AddItemModal from './AddItemModal';
import CompletePageLayout from './CompletePageLayout';
import RoomSpecificCanvaImporter from './RoomSpecificCanvaImporter';
import PhotoManagerModal from './PhotoManagerModal';
import { getColorByIndex } from '../utils/roomColors';

const ChecklistDashboard = ({ isOffline, hideNavigation = false, projectId: propProjectId }) => {
  console.log("📋 Checklist Dashboard initializing...");
  const { projectId: paramProjectId } = useParams();
  const projectId = propProjectId || paramProjectId;
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddRoom, setShowAddRoom] = useState(false);
  const [roomCanvaImports, setRoomCanvaImports] = useState({}); // Track which room's import modal is open
  const [roomColors, setRoomColors] = useState({});
  const [categoryColors, setCategoryColors] = useState({});
  const [itemStatuses, setItemStatuses] = useState([]);
  const [vendorTypes, setVendorTypes] = useState([]);
  const [carrierTypes, setCarrierTypes] = useState([]);
  const [showPhotoManager, setShowPhotoManager] = useState(false);
  const [selectedRoomForPhotos, setSelectedRoomForPhotos] = useState(null);
  const [roomPhotos, setRoomPhotos] = useState({});
  const [photosCollapsed, setPhotosCollapsed] = useState(true); // COLLAPSED by default
  
  // Sync state - for walkthrough to checklist sync
  const [syncStatus, setSyncStatus] = useState(null);
  const [syncing, setSyncing] = useState(false);
  
  // ✅ Check for URL parameters from extension and store in localStorage
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('action') === 'add-item' && params.get('source') === 'extension') {
      const scrapedData = {
        name: params.get('name') || '',
        price: params.get('price') || '',
        sku: params.get('sku') || '',
        size: params.get('size') || '',
        finish_color: params.get('finish') || '',
        finish_image: params.get('finish_image') || '',
        vendor: params.get('vendor') || '',
        url: params.get('link') || '',
        link: params.get('link') || '',
        image_url: params.get('image') || '',
        msrp: params.get('msrp') || '',
        remarks: params.get('remarks') || ''
      };
      
      // Store if we have actual data
      if (scrapedData.name || scrapedData.sku || scrapedData.price) {
        localStorage.setItem('extensionScrapedData', JSON.stringify(scrapedData));
        console.log('✅ ChecklistDashboard: Stored scraper data from URL:', scrapedData);
        
        // Clean URL without reloading
        const cleanUrl = window.location.pathname;
        window.history.replaceState({}, '', cleanUrl);
      }
    }
  }, []);
  
  useEffect(() => {
    if (projectId) {
      console.log('🚀 Loading project:', projectId);
      console.log('📍 Current URL:', window.location.href);
      console.log('📍 Pathname:', window.location.pathname);
      
      // IMMEDIATE TEST - Force load project data WITH CHECKLIST SHEET_TYPE
      const apiUrl = `${(window.ENV?.REACT_APP_BACKEND_URL || window.location.origin) || window.location.origin}/api/projects/${projectId}?sheet_type=checklist`;
      console.log('📞 Fetching from:', apiUrl);
      
      fetch(apiUrl)
        .then(response => {
          console.log('📡 Checklist Response received:', response.status);
          if (response.ok) {
            return response.json();
          } else {
            throw new Error(`HTTP ${response.status}`);
          }
        })
        .then(projectData => {
          console.log('✅ SUCCESS - Checklist Project data:', projectData.name);
          setProject(projectData);
          setLoading(false);
        })
        .catch(err => {
          console.error('❌ ERROR loading checklist project:', err);
          setError('Failed to load project: ' + err.message);
          setLoading(false);
        });
    } else {
      console.warn('⚠️ No projectId available!');
      console.log('📍 useParams projectId:', paramProjectId);
      console.log('📍 prop projectId:', propProjectId);
    }
  }, [projectId, paramProjectId, propProjectId]);

  // REMOVED AUTO-REFRESH - Only refresh on user action or page load
  // This prevents disruptive re-renders while working

  const loadSimpleProject = async () => {
    try {
      console.log('🚀 Loading CHECKLIST project data for:', projectId);
      
      const response = await fetch(`${(window.ENV?.REACT_APP_BACKEND_URL || window.location.origin) || window.location.origin}/api/projects/${projectId}?sheet_type=checklist`);
      
      if (response.ok) {
        const projectData = await response.json();
        console.log('✅ Project loaded successfully:', projectData.name);
        setProject(projectData);
        setError(null);
      } else {
        console.error('❌ Failed to load project:', response.status);
        setError('Failed to load project');
      }
    } catch (err) {
      console.error('❌ Error loading project:', err);
      setError('Error loading project: ' + err.message);
    } finally {
      console.log('🚀 FORCE SETTING LOADING = FALSE');
      setLoading(false);
      
      // Load dynamic checklist statuses from API instead of hardcoded values
      try {
        const statusResponse = await fetch(`${(window.ENV?.REACT_APP_BACKEND_URL || window.location.origin) || window.location.origin}/api/item-statuses`);
        if (statusResponse.ok) {
          const statusData = await statusResponse.json();
          const statusList = statusData.map(status => status.status || status);
          console.log('✅ Loaded dynamic checklist statuses:', statusList.length);
          setItemStatuses(statusList);
        } else {
          console.warn('⚠️ Failed to load dynamic statuses, using checklist defaults');
          // Use checklist-specific statuses as fallback
          setItemStatuses(['PICKED', 'ORDER SAMPLES', 'SAMPLES ARRIVED', 'ASK NEIL', 'ASK CHARLENE', 'ASK JALA', 'GET QUOTE', 'WAITING ON QT', 'READY FOR PRESENTATION']);
        }
      } catch (statusErr) {
        console.warn('⚠️ Error loading statuses, using checklist defaults:', statusErr);
        // Use checklist-specific statuses as fallback
        setItemStatuses(['PICKED', 'ORDER SAMPLES', 'SAMPLES ARRIVED', 'ASK NEIL', 'ASK CHARLENE', 'ASK JALA', 'GET QUOTE', 'WAITING ON QT', 'READY FOR PRESENTATION']);
      }
      
      setVendorTypes(['Four Hands', 'Uttermost', 'Visual Comfort']);
      setCarrierTypes(['FedEx', 'UPS', 'USPS', 'DHL']);
    }
  };

  // PREVENT LOADING LOOP WITH useEffect  
  useEffect(() => {
    if (loading && project) {
      console.log('🔧 FORCE STOPPING LOADING LOOP');
      setLoading(false);
    }
  }, [loading, project]);

  // Load sync status when project loads
  useEffect(() => {
    const loadSyncStatus = async () => {
      if (!projectId) return;
      try {
        const response = await fetch(`${(window.ENV?.REACT_APP_BACKEND_URL || window.location.origin)}/api/sync/status/${projectId}`);
        if (response.ok) {
          const data = await response.json();
          setSyncStatus(data);
        }
      } catch (err) {
        console.warn('Failed to load sync status:', err);
      }
    };
    loadSyncStatus();
  }, [projectId, project]);

  const handleAddRoom = async (roomData) => {
    try {
      const newRoom = {
        ...roomData,
        project_id: projectId,
        order_index: project.rooms.length,
        sheet_type: 'checklist'  // Make rooms independent per sheet
      };
      
      console.log('🏠 Creating room with data:', newRoom);
      const roomResponse = await roomAPI.create(newRoom);
      console.log('🏠 Room created successfully:', roomResponse);
      
      // RELOAD PROJECT TO SHOW NEW ROOM
      await loadSimpleProject();
      setShowAddRoom(false);
    } catch (err) {
      setError('Failed to create room');
      console.error('Error creating room:', err);
    }
  };

  const handleRoomCanvaImportComplete = async (roomName, importResults) => {
    try {
      console.log(`🎨 Canva import completed for ${roomName}:`, importResults);
      
      // Reload the project to show newly imported items
      const updatedProject = await projectAPI.get(projectId, 'checklist');
      setProject(updatedProject);
      
      // Close the modal for this room
      setRoomCanvaImports(prev => ({
        ...prev,
        [roomName]: false
      }));
      
    } catch (error) {
      console.error('❌ Error reloading after Canva import:', error);
    }
  };

  const openRoomCanvaImport = (roomName) => {
    setRoomCanvaImports(prev => ({
      ...prev,
      [roomName]: true
    }));
  };

  const closeRoomCanvaImport = (roomName) => {
    setRoomCanvaImports(prev => ({
      ...prev,
      [roomName]: false
    }));
  };

  const handleDeleteRoom = async (roomId) => {
    try {
      await roomAPI.delete(roomId);
      await loadSimpleProject();
    } catch (err) {
      setError('Failed to delete room');
      console.error('Error deleting room:', err);
    }
  };

  const handleBulkDeleteRooms = async (roomIds) => {
    if (roomIds.length === 0) return;
    if (!window.confirm(`Delete ${roomIds.length} room${roomIds.length > 1 ? 's' : ''}? This will delete all categories and items within them.`)) return;
    try {
      for (const roomId of roomIds) {
        await roomAPI.delete(roomId);
      }
      await loadSimpleProject();
    } catch (err) {
      setError('Failed to delete room');
      console.error('Error deleting room:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-500 mx-auto"></div>
          <p className="text-gray-400 mt-4">Loading FF&E data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">❌</div>
        <h2 className="text-2xl font-bold text-gray-200 mb-2">Error Loading Project</h2>
        <p className="text-gray-400">{error}</p>
        <button 
          onClick={() => {
            setError(null);
            setLoading(true);
            loadSimpleProject();
          }}
          className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">❌</div>
        <h2 className="text-2xl font-bold text-gray-200 mb-2">Project Not Found</h2>
        <p className="text-gray-400">The project you are looking for does not exist or could not be loaded.</p>
      </div>
    );
  }

  const getTotalItems = () => {
    return project.rooms.reduce((total, room) => 
      total + room.categories.reduce((catTotal, category) => 
        catTotal + (category.subcategories || []).reduce((subTotal, subcategory) =>
          subTotal + (subcategory.items || []).length, 0
        ), 0
      ), 0
    );
  };

  const getStatusBreakdown = () => {
    const breakdown = {};
    
    project.rooms.forEach(room => {
      room.categories.forEach(category => {
        (category.subcategories || []).forEach(subcategory => {
          (subcategory.items || []).forEach(item => {
            const status = item.status || 'TO BE PICKED';
            breakdown[status] = (breakdown[status] || 0) + 1;
          });
        });
      });
    });
    
    return breakdown;
  };

  const getCarrierBreakdown = () => {
    const carriers = {};
    
    project.rooms.forEach(room => {
      room.categories.forEach(category => {
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

  // Handle sync from walkthrough
  const handleSyncFromWalkthrough = async (syncAll = false) => {
    console.log('🔄 Sync button clicked, syncAll:', syncAll);
    
    if (!window.confirm(
      syncAll 
        ? 'Sync ALL items from Walkthrough to Checklist?\n\nThis will copy all room data from your mobile walkthrough to this checklist view.'
        : 'Sync PICKED items from Walkthrough to Checklist?\n\nThis will only copy items that were checked/picked during the walkthrough.'
    )) {
      console.log('❌ Sync cancelled by user');
      return;
    }

    setSyncing(true);
    const apiUrl = `${(window.ENV?.REACT_APP_BACKEND_URL || window.location.origin)}/api/sync/walkthrough-to-checklist/${projectId}`;
    console.log('📡 Calling sync API:', apiUrl);
    
    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sync_all: syncAll, include_photos: true })
      });

      console.log('📥 Sync response status:', response.status);

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Sync result:', result);
        alert(`✅ Sync Complete!\n\n${result.message}\n\nNew rooms: ${result.synced_rooms}\nItems synced: ${result.synced_items}`);
        await loadSimpleProject();
        
        // Refresh sync status
        const statusResponse = await fetch(`${(window.ENV?.REACT_APP_BACKEND_URL || window.location.origin)}/api/sync/status/${projectId}`);
        if (statusResponse.ok) {
          setSyncStatus(await statusResponse.json());
        }
      } else {
        const errData = await response.json();
        console.error('❌ Sync failed:', errData);
        alert(`❌ Sync failed: ${errData.detail || 'Unknown error'}`);
      }
    } catch (err) {
      console.error('❌ Sync error:', err);
      alert(`❌ Sync error: ${err.message}`);
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="relative">
      <CompletePageLayout 
        projectId={projectId}
        activeTab="checklist"
        title={`CHECKLIST - ${project?.client_info?.full_name || project?.name || 'PROJECT'}`}
        hideNavigation={hideNavigation}
        onAddRoom={() => setShowAddRoom(true)}
      >
      
      {/* WALKTHROUGH SYNC PANEL - Critical for mobile → desktop data flow */}
      {syncStatus && (syncStatus.walkthrough?.rooms > 0 || syncStatus.needs_sync) && (
        <div className="mb-6 rounded-xl border border-[#D4A574]/40 overflow-hidden"
             style={{ background: 'linear-gradient(135deg, rgba(20,20,30,0.95) 0%, rgba(30,35,45,0.9) 100%)' }}>
          <div className="px-6 py-4 flex items-center justify-between"
               style={{ background: 'linear-gradient(135deg, rgba(212, 165, 116, 0.15) 0%, rgba(180, 155, 126, 0.1) 100%)' }}>
            <div className="flex items-center gap-4">
              <span className="text-2xl">📱➡️💻</span>
              <div>
                <h3 className="text-[#D4A574] font-bold text-lg">Walkthrough Data Available</h3>
                <p className="text-gray-400 text-sm">
                  {syncStatus.walkthrough?.rooms || 0} rooms, {syncStatus.walkthrough?.picked_items || 0} picked items ready to sync
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => handleSyncFromWalkthrough(false)}
                disabled={syncing}
                className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-500 hover:to-green-600 text-white px-4 py-2 rounded-lg font-bold text-sm transition-all disabled:opacity-50 flex items-center gap-2"
              >
                {syncing ? (
                  <>
                    <span className="animate-spin">🔄</span> Syncing...
                  </>
                ) : (
                  <>
                    ✅ Sync Picked Items
                  </>
                )}
              </button>
              <button
                onClick={() => handleSyncFromWalkthrough(true)}
                disabled={syncing}
                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white px-4 py-2 rounded-lg font-bold text-sm transition-all disabled:opacity-50 flex items-center gap-2"
              >
                {syncing ? (
                  <>
                    <span className="animate-spin">🔄</span> Syncing...
                  </>
                ) : (
                  <>
                    📋 Sync All Items
                  </>
                )}
              </button>
            </div>
          </div>
          
          {/* Sync Status Details */}
          <div className="px-6 py-3 flex items-center gap-8 text-sm border-t border-[#B49B7E]/20">
            <div className="flex items-center gap-2">
              <span className="text-[#D4A574]">📱 Walkthrough:</span>
              <span className="text-white">{syncStatus.walkthrough?.rooms || 0} rooms</span>
              <span className="text-gray-500">|</span>
              <span className="text-white">{syncStatus.walkthrough?.items || 0} items</span>
              <span className="text-gray-500">|</span>
              <span className="text-green-400">{syncStatus.walkthrough?.picked_items || 0} picked</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[#D4A574]">💻 Checklist:</span>
              <span className="text-white">{syncStatus.checklist?.rooms || 0} rooms</span>
              <span className="text-gray-500">|</span>
              <span className="text-white">{syncStatus.checklist?.items || 0} items</span>
            </div>
          </div>
        </div>
      )}

      {/* PHOTO MANAGEMENT SECTION - Collapsible */}
      <div className="mb-6 p-6 border border-[#B49B7E]/30 rounded-2xl" style={{ 
        background: 'linear-gradient(135deg, rgba(0,0,0,0.95) 0%, rgba(30,30,30,0.9) 30%, rgba(0,0,0,0.95) 100%)'
      }}>
        <div 
          className="flex items-center justify-between cursor-pointer"
          onClick={() => setPhotosCollapsed(!photosCollapsed)}
        >
          <h2 className="text-2xl font-bold text-[#D4A574]">📸 PHOTO MANAGEMENT</h2>
          <button className="text-[#D4A574] text-xl">
            {photosCollapsed ? '▶' : '▼'}
          </button>
        </div>
        
        {!photosCollapsed && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 mt-4">
              <div className="p-4 border border-[#D4A574]/50 rounded" style={{ background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.95) 0%, rgba(10, 10, 10, 0.9) 30%, rgba(5, 5, 5, 0.95) 70%, rgba(0, 0, 0, 0.95) 100%)' }}>
                <div className="text-[#D4A574] text-sm mb-1">Photos Captured</div>
                <div className="text-3xl font-bold text-[#D4C5A9]">
                  {Object.values(roomPhotos).reduce((sum, photos) => sum + photos.length, 0)}
                </div>
              </div>
              <div className="p-4 border border-[#D4A574]/50 rounded" style={{ background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.95) 0%, rgba(10, 10, 10, 0.9) 30%, rgba(5, 5, 5, 0.95) 70%, rgba(0, 0, 0, 0.95) 100%)' }}>
                <div className="text-[#D4A574] text-sm mb-1">Measurements Added</div>
                <div className="text-3xl font-bold text-[#D4C5A9]">
                  {Object.values(roomPhotos).reduce((sum, photos) => sum + photos.filter(p => p.measurements?.length > 0).length, 0)}
                </div>
              </div>
              <div className="p-4 border border-[#D4A574]/50 rounded" style={{ background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.95) 0%, rgba(10, 10, 10, 0.9) 30%, rgba(5, 5, 5, 0.95) 70%, rgba(0, 0, 0, 0.95) 100%)' }}>
                <div className="text-[#D4A574] text-sm mb-1">Rooms Photographed</div>
                <div className="text-3xl font-bold text-[#D4C5A9]">
                  {Object.keys(roomPhotos).length} / {project?.rooms?.length || 0}
                </div>
              </div>
              <div className="p-4 border border-[#D4A574]/50 rounded" style={{ background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.95) 0%, rgba(10, 10, 10, 0.9) 30%, rgba(5, 5, 5, 0.95) 70%, rgba(0, 0, 0, 0.95) 100%)' }}>
                <div className="text-[#D4A574] text-sm mb-1">Add Room</div>
                <button 
                  onClick={() => setShowAddRoom(true)}
                  className="mt-1 px-4 py-2 bg-[#D4A574] hover:bg-[#C49564] text-black rounded font-medium w-full"
                >
                  + Add Room
                </button>
              </div>
            </div>
            
            <div className="border-t border-[#D4A574]/30 pt-4">
              <h3 className="text-lg font-bold text-[#D4A574] mb-3">📁 Photos by Room</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {project?.rooms?.map((room, index) => {
                  // Use the SAME color system as the spreadsheet - getColorByIndex
                  const roomColor = roomColors[room.id] || getColorByIndex(index);
                  return (
                    <button
                      key={room.id}
                      onClick={() => {
                        setSelectedRoomForPhotos(room);
                        setShowPhotoManager(true);
                      }}
                      className="p-3 border-2 rounded-lg hover:scale-105 transition-all cursor-pointer"
                      style={{ 
                        background: `linear-gradient(135deg, ${roomColor}40 0%, ${roomColor}20 50%, ${roomColor}40 100%)`,
                        borderColor: roomColor,
                        boxShadow: `0 4px 15px ${roomColor}30`
                      }}
                    >
                      <div className="text-2xl mb-1">📁</div>
                      <div className="text-sm text-white font-medium truncate">{room.name}</div>
                      <div className="text-xs" style={{ color: roomColor }}>
                        {roomPhotos[room.id]?.length || 0} photos
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>

      {/* STATUS OVERVIEW SECTION */}
      <ChecklistStatusOverview
        totalItems={getTotalItems()}
        statusBreakdown={getStatusBreakdown()}
        carrierBreakdown={getCarrierBreakdown()}
        itemStatuses={itemStatuses}
      />

      {/* CHECKLIST SPREADSHEET */}
      <ExactChecklistSpreadsheet
        project={project}
        roomColors={roomColors}
        categoryColors={categoryColors}
        itemStatuses={itemStatuses}
        vendorTypes={vendorTypes}
        carrierTypes={carrierTypes}
        onDeleteRoom={(roomId) => handleDeleteRoom(roomId)}
        onBulkDeleteRooms={handleBulkDeleteRooms}
        onAddRoom={() => setShowAddRoom(true)}
        onReload={loadSimpleProject}
        onRoomCanvaImport={openRoomCanvaImport}
      />

      {/* Add Multiple Rooms Modal */}
      {showAddRoom && (
        <AddMultipleRoomsModal
          onClose={() => setShowAddRoom(false)}
          onSubmit={handleAddRoom}
          roomColors={roomColors}
          existingRooms={project?.rooms || []}
        />
      )}

      {/* Photo Manager Modal - For adding photos to rooms */}
      {showPhotoManager && selectedRoomForPhotos && (
        <PhotoManagerModal
          room={selectedRoomForPhotos}
          photos={roomPhotos[selectedRoomForPhotos.id] || []}
          onClose={() => {
            setShowPhotoManager(false);
            setSelectedRoomForPhotos(null);
          }}
          onSavePhotos={(roomId, photos) => {
            setRoomPhotos(prev => ({
              ...prev,
              [roomId]: photos
            }));
          }}
        />
      )}

      {/* Room-Specific Canva Import Modals */}
      {project?.rooms?.map(room => (
        <RoomSpecificCanvaImporter
          key={room.id}
          isOpen={roomCanvaImports[room.name] || false}
          onClose={() => closeRoomCanvaImport(room.name)}
          onImportComplete={(results) => handleRoomCanvaImportComplete(room.name, results)}
          projectId={projectId}
          roomName={room.name}
          roomId={room.id}
        />
      ))}
    </CompletePageLayout>

    {/* No more floating action buttons - each room will have its own import button */}
  </div>
  );
};

export default ChecklistDashboard;
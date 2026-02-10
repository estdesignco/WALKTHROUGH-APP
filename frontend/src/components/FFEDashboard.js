import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { projectAPI, roomAPI, categoryAPI, itemAPI } from '../App';
import ExactFFESpreadsheet from './ExactFFESpreadsheet';
import StatusOverview from './StatusOverview';
import AddMultipleRoomsModal from './AddMultipleRoomsModal';
import AddItemModal from './AddItemModal';
import CompletePageLayout from './CompletePageLayout';
import ShippingTracker from './ShippingTracker';
import PhotoManagerModal from './PhotoManagerModal';
import { getColorByIndex } from '../utils/roomColors';

const FFEDashboard = ({ isOffline, hideNavigation = false, projectId: propProjectId }) => {
  console.error("🚨 FFE DASHBOARD IS LOADING!");
  const { projectId: paramProjectId } = useParams();
  const projectId = propProjectId || paramProjectId;
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddRoom, setShowAddRoom] = useState(false);
  const [roomColors, setRoomColors] = useState({});
  const [categoryColors, setCategoryColors] = useState({});
  const [itemStatuses, setItemStatuses] = useState([]);
  const [vendorTypes, setVendorTypes] = useState([]);
  const [carrierTypes, setCarrierTypes] = useState([]);
  const [showShippingTracker, setShowShippingTracker] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showPhotoManager, setShowPhotoManager] = useState(false);
  const [selectedRoomForPhotos, setSelectedRoomForPhotos] = useState(null);
  const [roomPhotos, setRoomPhotos] = useState({});
  const [photosCollapsed, setPhotosCollapsed] = useState(false);
  
  const loadSimpleProject = async () => {
    try {
      console.log('🚀 FF&E: Loading project data for:', projectId);
      
      const BACKEND_URL = (window.ENV?.REACT_APP_BACKEND_URL || window.location.origin);
      const response = await fetch(`${BACKEND_URL}/api/projects/${projectId}?sheet_type=ffe`);
      
      if (response.ok) {
        const projectData = await response.json();
        console.log('✅ FF&E: Project loaded successfully:', projectData.name);
        setProject(projectData);
        setError(null);
        
        // Set utility data
        setItemStatuses(['PICKED', 'ORDERED', 'SHIPPED', 'DELIVERED TO RECEIVER', 'DELIVERED TO JOB SITE', 'INSTALLED']);
        setVendorTypes(['Four Hands', 'Uttermost', 'Visual Comfort']);
        setCarrierTypes(['FedEx', 'UPS', 'USPS', 'DHL']);
      } else {
        console.error('❌ FF&E: Failed to load project:', response.status);
        setError('Failed to load project');
      }
    } catch (err) {
      console.error('❌ FF&E: Error loading project:', err);
      setError('Error loading project: ' + err.message);
    } finally {
      console.log('🚀 FF&E: Setting loading = false');
      setLoading(false);
    }
  };

  useEffect(() => {
    if (projectId) {
      console.log('🚀 FF&E useEffect: Starting load for projectId:', projectId);
      loadSimpleProject();
      
      // REAL-TIME SYNC: Reload FF&E data every 10 seconds for live sync with mobile
      const interval = setInterval(() => {
        console.log('🔄 FF&E Real-time sync - refreshing from server...');
        loadSimpleProject();
      }, 10000);
      
      return () => clearInterval(interval);
    }
  }, [projectId]);

  const handleAddRoom = async (roomData) => {
    try {
      const newRoom = {
        ...roomData,
        project_id: projectId,
        order_index: project.rooms.length,
        sheet_type: 'ffe'  // Make rooms independent per sheet
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

  const handleDeleteRoom = async (roomId) => {
    if (!window.confirm('Are you sure you want to delete this room? This will delete all categories and items within it.')) {
      return;
    }
    
    try {
      await roomAPI.delete(roomId);
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
    console.error('🚨 FFE: No project data available!');
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">❌</div>
        <h2 className="text-2xl font-bold text-gray-200 mb-2">Project Not Found</h2>
        <p className="text-gray-400">The project you're looking for doesn't exist or couldn't be loaded.</p>
      </div>
    );
  }

  console.log('✅ FFE: Project data available, rendering...', project.name);

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

  return (
    <CompletePageLayout 
      projectId={projectId}
      activeTab="ffe"
      title={`FF&E - ${project?.name?.toUpperCase() || 'PROJECT'}`}
      hideNavigation={hideNavigation}
      onAddRoom={() => setShowAddRoom(true)}
    >
      {/* SEARCH BAR */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search items, vendors, SKUs..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-3 bg-black/50 border border-[#D4A574]/30 rounded-lg text-[#D4C5A9] placeholder-[#D4A574]/50 focus:border-[#D4A574] focus:outline-none"
        />
      </div>

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

      {/* SHIPPING TRACKER TOGGLE */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => setShowShippingTracker(!showShippingTracker)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
            showShippingTracker 
              ? 'bg-[#D4A574] text-white' 
              : 'bg-[#D4A574]/20 text-[#D4A574] border border-[#D4A574]/30 hover:bg-[#D4A574]/30'
          }`}
        >
          📦 {showShippingTracker ? 'Hide Shipping Tracker' : 'Show Shipping Tracker'}
        </button>
      </div>
      
      {/* SHIPPING TRACKER PANEL */}
      {showShippingTracker && (
        <div className="mb-6">
          <ShippingTracker projectId={projectId} />
        </div>
      )}
      
      {/* STATUS OVERVIEW SECTION */}
      <StatusOverview
        totalItems={getTotalItems()}
        statusBreakdown={getStatusBreakdown()}
        carrierBreakdown={getCarrierBreakdown()}
        itemStatuses={itemStatuses}
      />

      {/* FFE SPREADSHEET */}
      <ExactFFESpreadsheet
        project={project}
        roomColors={roomColors}
        categoryColors={categoryColors}
        itemStatuses={itemStatuses}
        vendorTypes={vendorTypes}
        carrierTypes={carrierTypes}
        onDeleteRoom={handleDeleteRoom}
        onAddRoom={() => setShowAddRoom(true)}
        onReload={loadSimpleProject}
        searchTerm={searchTerm}
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
      
      {/* Photo Manager Modal */}
      {showPhotoManager && selectedRoomForPhotos && (
        <PhotoManagerModal
          room={selectedRoomForPhotos}
          projectId={projectId}
          onClose={() => {
            setShowPhotoManager(false);
            setSelectedRoomForPhotos(null);
          }}
          onPhotosUpdate={(photos) => {
            setRoomPhotos(prev => ({
              ...prev,
              [selectedRoomForPhotos.id]: photos
            }));
          }}
        />
      )}
    </CompletePageLayout>
  );
};

export default FFEDashboard;
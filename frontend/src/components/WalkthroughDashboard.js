import React, { useState, useEffect, useRef } from 'react';

import { useParams } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { projectAPI, roomAPI, categoryAPI, itemAPI } from '../App';
import SimpleWalkthroughSpreadsheet from './SimpleWalkthroughSpreadsheet';
import StatusOverview from './StatusOverview';
import PhotoManagerModal from './PhotoManagerModal';
import AddRoomModal from './AddRoomModal';
import AddItemModal from './AddItemModal';
import CompletePageLayout from './CompletePageLayout';

const WalkthroughDashboard = ({ isOffline, hideNavigation = false, projectId: propProjectId }) => {
  console.log("🚀 WALKTHROUGH DASHBOARD IS LOADING");
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
  
  // PHOTO MANAGEMENT STATE
  const [showPhotoManager, setShowPhotoManager] = useState(false);
  const [selectedRoomForPhotos, setSelectedRoomForPhotos] = useState(null);
  const [roomPhotos, setRoomPhotos] = useState({});  // {roomId: [{photo, measurements}]}
  const [leicaConnected, setLeicaConnected] = useState(false);
  
  useEffect(() => {
    if (projectId) {
      console.log('🚀 Loading project:', projectId);
      
      const loadProjectData = async () => {
        try {
          const backendUrl = process.env.REACT_APP_BACKEND_URL || window.location.origin;
          console.log('🌐 Using backend URL:', backendUrl);
          
          const response = await fetch(`${backendUrl}/api/projects/${projectId}?sheet_type=walkthrough`, {
            headers: {
              'Content-Type': 'application/json'
            }
          });
          
          console.log('📡 Response received:', response.status);
          
          if (response.ok) {
            const projectData = await response.json();
            console.log('✅ SUCCESS - Project data loaded:', projectData.name);
            setProject(projectData);
            setError(null);
          } else {
            const errorText = await response.text();
            throw new Error(`HTTP ${response.status}: ${errorText}`);
          }
        } catch (err) {
          console.error('❌ ERROR loading project:', err);
          setError('Failed to load project: ' + err.message);
        } finally {
          setLoading(false);
        }
      };
      
      loadProjectData();
    } else {
      setLoading(false);
      setError('No project ID provided');
    }
  }, [projectId]);

  const loadSimpleProject = async () => {
    try {
      console.log('🚀 Loading project data for:', projectId);
      
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL || window.location.origin}/api/projects/${projectId}?sheet_type=walkthrough`);
      
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
      
      // Set utility data
      setItemStatuses(['PICKED', 'ORDERED', 'SHIPPED', 'DELIVERED TO RECEIVER', 'DELIVERED TO JOB SITE', 'INSTALLED']);
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

  const handleAddRoom = async (roomData) => {
    try {
      const newRoom = {
        ...roomData,
        project_id: projectId,
        order_index: project.rooms.length,
        sheet_type: 'walkthrough'  // Make rooms independent per sheet
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
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">❌</div>
        <h2 className="text-2xl font-bold text-gray-200 mb-2">Project Not Found</h2>
        <p className="text-gray-400">The project you're looking for doesn't exist or couldn't be loaded.</p>
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
      activeTab="walkthrough"
      title="WALKTHROUGH - GREENE"
      onAddRoom={() => setShowAddRoom(true)}
    >
      {/* EXISTING WALKTHROUGH CONTENT - UNCHANGED */}
      <div>
        {!hideNavigation && (
          <>
            {/* Search and Controls - Already exists in new layout, so hiding this */}
            {/* The new layout already has search controls, so we hide the duplicate */}
          </>
        )}

        {/* DIVIDER LINE */}
        <div className="w-full h-px bg-gradient-to-r from-transparent via-[#B49B7E]/20 to-transparent my-1"></div>
        
        {/* PHOTO MANAGEMENT HEADER - Replaces status/shipping for Walkthrough */}
        <div className="mb-6 p-6 rounded-2xl shadow-xl backdrop-blur-sm border border-[#D4A574]/60 mx-6" 
             style={{
               background: 'linear-gradient(135deg, rgba(0,0,0,0.95) 0%, rgba(30,30,30,0.9) 30%, rgba(15,15,25,0.95) 70%, rgba(0,0,0,0.95) 100%)'
             }}>
          <h2 className="text-2xl font-bold text-[#D4A574] mb-6">📸 PHOTO MANAGEMENT</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            {/* Photos Captured */}
            <div className="p-4 border border-[#D4A574]/50 rounded" style={{ background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.95) 0%, rgba(10, 10, 10, 0.9) 30%, rgba(5, 5, 5, 0.95) 70%, rgba(0, 0, 0, 0.95) 100%)' }}>
              <div className="text-[#D4A574] text-sm mb-1">Photos Captured</div>
              <div className="text-3xl font-bold text-[#D4C5A9]">
                {Object.values(roomPhotos).reduce((sum, photos) => sum + photos.length, 0)}
              </div>
            </div>
            
            {/* Measurements Added */}
            <div className="p-4 border border-[#D4A574]/50 rounded" style={{ background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.95) 0%, rgba(10, 10, 10, 0.9) 30%, rgba(5, 5, 5, 0.95) 70%, rgba(0, 0, 0, 0.95) 100%)' }}>
              <div className="text-[#D4A574] text-sm mb-1">Measurements Added</div>
              <div className="text-3xl font-bold text-[#D4C5A9]">
                {Object.values(roomPhotos).reduce((sum, photos) => sum + photos.filter(p => p.measurements?.length > 0).length, 0)}
              </div>
            </div>
            
            {/* Rooms Photographed */}
            <div className="p-4 border border-[#D4A574]/50 rounded" style={{ background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.95) 0%, rgba(10, 10, 10, 0.9) 30%, rgba(5, 5, 5, 0.95) 70%, rgba(0, 0, 0, 0.95) 100%)' }}>
              <div className="text-[#D4A574] text-sm mb-1">Rooms Photographed</div>
              <div className="text-3xl font-bold text-[#D4C5A9]">
                {Object.keys(roomPhotos).length} / {project?.rooms?.length || 0}
              </div>
            </div>
            
            {/* Leica D5 Status */}
            <div className="p-4 border border-[#D4A574]/50 rounded" style={{ background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.95) 0%, rgba(10, 10, 10, 0.9) 30%, rgba(5, 5, 5, 0.95) 70%, rgba(0, 0, 0, 0.95) 100%)' }}>
              <div className="text-[#D4A574] text-sm mb-1">Leica D5 Status</div>
              <div className={`text-xl font-bold ${leicaConnected ? 'text-green-400' : 'text-red-400'}`}>
                {leicaConnected ? '✓ Connected' : '✗ Not Connected'}
              </div>
              <button 
                onClick={() => {
                  setLeicaConnected(!leicaConnected);
                  if (!leicaConnected) {
                    alert('Leica D5 Connected! (Simulated - real Bluetooth integration coming soon)');
                  }
                }}
                className="mt-2 px-3 py-1 bg-[#D4A574] hover:bg-[#C49564] text-black rounded text-sm font-medium"
              >
                {leicaConnected ? 'Disconnect' : 'Connect Leica D5'}
              </button>
            </div>
          </div>
          
          {/* Room Photo Folders */}
          <div className="border-t border-[#D4A574]/30 pt-4">
            <h3 className="text-lg font-bold text-[#D4A574] mb-3">📁 Photos by Room</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {project?.rooms?.map(room => (
                <button
                  key={room.id}
                  onClick={() => {
                    setSelectedRoomForPhotos(room);
                    setShowPhotoManager(true);
                  }}
                  className="p-3 border border-[#D4A574]/50 rounded hover:bg-[#D4A574]/20 transition-colors"
                  style={{ background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.95) 0%, rgba(10, 10, 10, 0.9) 50%, rgba(0, 0, 0, 0.95) 100%)' }}
                >
                  <div className="text-2xl mb-1">📁</div>
                  <div className="text-sm text-[#D4C5A9] font-medium truncate">{room.name}</div>
                  <div className="text-xs text-[#D4A574]">
                    {roomPhotos[room.id]?.length || 0} photos
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* DIVIDER LINE */}
        <div className="w-full h-px bg-gradient-to-r from-transparent via-[#B49B7E]/20 to-transparent my-1"></div>

        {/* FF&E Spreadsheet - ZERO SPACING */}
        <div className="px-6 mt-1 border border-[#B49B7E]/20 rounded-2xl bg-gradient-to-b from-black via-gray-900 to-black">
          <SimpleWalkthroughSpreadsheet
            project={project}
            roomColors={roomColors}
            categoryColors={categoryColors}
            itemStatuses={itemStatuses}
            vendorTypes={vendorTypes}
            carrierTypes={carrierTypes}
            onDeleteRoom={handleDeleteRoom}
            onAddRoom={() => setShowAddRoom(true)}
            onReload={loadSimpleProject}
          />
        </div>

        {/* Add Room Modal */}
        {showAddRoom && (
          <AddRoomModal
            onClose={() => setShowAddRoom(false)}
            onSubmit={handleAddRoom}
            roomColors={roomColors}
          />
        )}
      </div>
      
      {/* Photo Manager Modal */}
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
            // TODO: Save to backend API
            console.log('📸 Photos saved for room:', roomId, photos.length, 'photos');
          }}
          leicaConnected={leicaConnected}
          onConnectLeica={async () => {
            try {
              // TODO: Implement real Leica D5 Bluetooth connection
              setLeicaConnected(true);
              alert('Leica D5 Connected! You can now use laser measurements on photos.');
            } catch (error) {
              console.error('Failed to connect to Leica D5:', error);
              alert('Failed to connect to Leica D5. Please try again.');
            }
          }}
        />
      )}
    </CompletePageLayout>
  );
};

export default WalkthroughDashboard;
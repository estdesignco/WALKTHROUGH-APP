import React, { useState, useEffect, useRef } from 'react';

import { useParams } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { projectAPI, roomAPI, categoryAPI, itemAPI } from '../App';
import SimpleWalkthroughSpreadsheet from './SimpleWalkthroughSpreadsheet';
import StatusOverview from './StatusOverview';
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

        {/* PIE CHART AND STATUS BREAKDOWN - ALWAYS VISIBLE */}
        <StatusOverview
          totalItems={getTotalItems()}
          statusBreakdown={getStatusBreakdown()}
          carrierBreakdown={getCarrierBreakdown()}
          itemStatuses={itemStatuses}
        />

        {/* FF&E Spreadsheet - COMPLETELY UNCHANGED */}
        <div className="px-6 mt-4">
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
    </CompletePageLayout>
  );
};

export default WalkthroughDashboard;
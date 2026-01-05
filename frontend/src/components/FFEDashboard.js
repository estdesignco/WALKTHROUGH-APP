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
      
      // AUTO-REFRESH: Reload FF&E data every 30 seconds to show mobile changes
      const interval = setInterval(() => {
        console.log('🔄 Auto-refreshing FF&E data...');
        loadSimpleProject();
      }, 30000);
      
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
      title="FF&E - GREENE"
      hideNavigation={hideNavigation}
      onAddRoom={() => setShowAddRoom(true)}
    >
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
    </CompletePageLayout>
  );
};

export default FFEDashboard;
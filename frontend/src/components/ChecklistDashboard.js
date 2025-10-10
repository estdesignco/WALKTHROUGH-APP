import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { projectAPI, roomAPI, categoryAPI, itemAPI } from '../App';
import ExactChecklistSpreadsheet from './ExactChecklistSpreadsheet';
import ChecklistStatusOverview from './ChecklistStatusOverview';
import AddRoomModal from './AddRoomModal';
import AddItemModal from './AddItemModal';
import CompletePageLayout from './CompletePageLayout';
import RoomSpecificCanvaImporter from './RoomSpecificCanvaImporter';

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
  
  useEffect(() => {
    if (projectId) {
      console.log('🚀 Loading project:', projectId);
      
      // IMMEDIATE TEST - Force load project data WITH CHECKLIST SHEET_TYPE
      fetch(`${process.env.REACT_APP_BACKEND_URL || window.location.origin}/api/projects/${projectId}?sheet_type=checklist`)
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
    }
  }, [projectId]);

  const loadSimpleProject = async () => {
    try {
      console.log('🚀 Loading CHECKLIST project data for:', projectId);
      
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL || window.location.origin}/api/projects/${projectId}?sheet_type=checklist`);
      
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
        const statusResponse = await fetch(`${process.env.REACT_APP_BACKEND_URL || window.location.origin}/api/item-statuses`);
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

  return (
    <div className="relative">
      <CompletePageLayout 
        projectId={projectId}
        activeTab="checklist"
        title="CHECKLIST - GREENE"
        hideNavigation={hideNavigation}
        onAddRoom={() => setShowAddRoom(true)}
      >
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
        onAddRoom={() => setShowAddRoom(true)}
        onReload={loadSimpleProject}
        onRoomCanvaImport={openRoomCanvaImport}
      />

      {/* Add Room Modal */}
      {showAddRoom && (
        <AddRoomModal
          onClose={() => setShowAddRoom(false)}
          onSubmit={handleAddRoom}
          roomColors={roomColors}
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
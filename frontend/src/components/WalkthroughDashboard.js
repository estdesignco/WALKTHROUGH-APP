import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { projectAPI, roomAPI, categoryAPI, itemAPI } from '../App';
import ExactWalkthroughSpreadsheet from './ExactWalkthroughSpreadsheet';
import StatusOverview from './StatusOverview';
import AddRoomModal from './AddRoomModal';
import AddItemModal from './AddItemModal';

const FFEDashboard = ({ isOffline }) => {
  const { projectId } = useParams();
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
      
      // IMMEDIATE TEST - Force load project data
      fetch(`https://code-scanner-14.preview.emergentagent.com/api/projects/${projectId}`)
        .then(response => {
          console.log('📡 Response received:', response.status);
          if (response.ok) {
            return response.json();
          } else {
            throw new Error(`HTTP ${response.status}`);
          }
        })
        .then(projectData => {
          console.log('✅ SUCCESS - Project data:', projectData.name);
          setProject(projectData);
          setLoading(false);
        })
        .catch(err => {
          console.error('❌ ERROR loading project:', err);
          setError('Failed to load project: ' + err.message);
          setLoading(false);
        });
    }
  }, [projectId]);

  const loadSimpleProject = async () => {
    try {
      console.log('🚀 Loading project data for:', projectId);
      
      const response = await fetch(`https://code-scanner-14.preview.emergentagent.com/api/projects/${projectId}`);
      
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
        order_index: project.rooms.length
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
    <div className="max-w-full mx-auto bg-gray-950 min-h-screen">
      {/* TOP HEADER */}
      <div className="mb-6">
        <div className="text-center mb-4">
          <h1 className="text-4xl font-bold text-white mb-2" style={{ color: '#8b7355' }}>GREENE</h1>
          <p className="text-gray-300">Emileigh Greene - 4567 Crooked Creek Road, Gainesville, Georgia, 30506</p>
        </div>

        {/* Navigation Tabs */}
        <div className="flex justify-center space-x-8 mb-6">
          <a href={`/project/${projectId}/questionnaire`} className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors">
            <span>📋</span>
            <span>Questionnaire</span>
          </a>
          <a href={`/project/${projectId}/walkthrough`} className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors">
            <span>🚶</span>
            <span>Walkthrough</span>
          </a>
          <a href={`/project/${projectId}/checklist`} className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors">
            <span>✅</span>
            <span>Checklist</span>
          </a>
          <div className="flex items-center space-x-2" style={{ color: '#8b7355' }}>
            <span>📊</span>
            <span className="font-semibold">FF&E</span>
          </div>
        </div>

        {/* LOGO BANNER */}
        <div className="rounded-lg mb-6" style={{ backgroundColor: '#8b7355', padding: '1px 0', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'fit-content' }}>
          <img 
            src="/established-logo.png" 
            alt="Established Design Co. Logo" 
            style={{ height: '200px', width: 'auto', objectFit: 'contain', display: 'block' }}
          />
        </div>

        {/* FF&E TITLE WITH EXPORT BUTTONS */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold" style={{ color: '#8b7355' }}>FF&E - GREENE</h3>
          <div className="flex space-x-4">
            <button
              style={{ backgroundColor: '#8b7355' }}
              className="hover:opacity-90 text-white px-4 py-2 rounded font-medium transition-colors flex items-center space-x-2"
            >
              <span>📥</span>
              <span>Export FF&E</span>
            </button>
            <button
              style={{ backgroundColor: '#8b7355' }}
              className="hover:opacity-90 text-white px-4 py-2 rounded font-medium transition-colors flex items-center space-x-2"
            >
              <span>📋</span>
              <span>Spec Sheet</span>
            </button>
          </div>
        </div>

        {/* PIE CHART AND STATUS BREAKDOWN */}
        <StatusOverview
          totalItems={getTotalItems()}
          statusBreakdown={getStatusBreakdown()}
          carrierBreakdown={getCarrierBreakdown()}
          itemStatuses={itemStatuses}
        />

        {/* SEARCH BAR AND ADD ROOM BUTTON */}
        <div className="flex items-center justify-between mt-6 p-4 bg-gray-800 rounded-lg">
          <div className="flex items-center space-x-4 flex-1">
            <input
              type="text"
              placeholder="Search Items..."
              className="flex-1 bg-gray-700 text-white px-4 py-2 rounded border border-gray-600 focus:border-blue-500"
            />
            <select className="bg-gray-700 text-white px-3 py-2 rounded border border-gray-600">
              <option>All Rooms</option>
            </select>
            <select className="bg-gray-700 text-white px-3 py-2 rounded border border-gray-600">
              <option>All Statuses</option>
            </select>
          </div>
          <button
            onClick={() => setShowAddRoom(true)}
            style={{ backgroundColor: '#8b7355' }}
            className="hover:opacity-90 text-white px-6 py-2 rounded font-medium transition-colors ml-4"
          >
            ➕ Add Room
          </button>
        </div>
      </div>

      {/* FF&E Spreadsheet */}
      <div className="px-6 mt-4">
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
  );
};

export default FFEDashboard;
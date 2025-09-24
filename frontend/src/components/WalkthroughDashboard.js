import React, { useState, useEffect, useRef } from 'react';

import { useParams } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { projectAPI, roomAPI, categoryAPI, itemAPI } from '../App';
import SimpleWalkthroughSpreadsheet from './SimpleWalkthroughSpreadsheet';
import StatusOverview from './StatusOverview';
import AddRoomModal from './AddRoomModal';
import AddItemModal from './AddItemModal';

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
          
          const response = await fetch(`${backendUrl}/api/projects/${projectId}`, {
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
      
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL || window.location.origin}/api/projects/${projectId}`);
      
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
        // sheet_type: 'walkthrough'  // Removed for now to fix room display
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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#B49B7E] mx-auto"></div>
          <p className="mt-4" style={{ color: '#F5F5DC', opacity: '0.8' }}>Loading FF&E data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">❌</div>
        <h2 className="text-2xl font-light mb-2" style={{ color: '#F5F5DC' }}>Error Loading Project</h2>
        <p style={{ color: '#F5F5DC', opacity: '0.7' }}>{error}</p>
        <button 
          onClick={() => {
            setError(null);
            setLoading(true);
            loadSimpleProject();
          }}
          className="mt-4 bg-gradient-to-r from-[#B49B7E] to-[#A08B6F] hover:from-[#A08B6F] hover:to-[#8B7355] px-6 py-3 rounded-lg transition-all duration-300"
          style={{ color: '#F5F5DC' }}
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
        <h2 className="text-2xl font-light mb-2" style={{ color: '#F5F5DC' }}>Project Not Found</h2>
        <p style={{ color: '#F5F5DC', opacity: '0.7' }}>The project you're looking for doesn't exist or couldn't be loaded.</p>
      </div>
    );
  }

  const getTotalItems = () => {
    if (!project || !project.rooms || !Array.isArray(project.rooms)) {
      return 0;
    }
    
    return project.rooms.reduce((total, room) => {
      if (!room || !room.categories || !Array.isArray(room.categories)) {
        return total;
      }
      return total + room.categories.reduce((catTotal, category) => {
        if (!category) return catTotal;
        return catTotal + (category.subcategories || []).reduce((subTotal, subcategory) =>
          subTotal + (subcategory && subcategory.items && Array.isArray(subcategory.items) ? subcategory.items.length : 0), 0
        );
      }, 0);
    }, 0);
  };

  const getStatusBreakdown = () => {
    const breakdown = {};
    
    if (!project || !project.rooms || !Array.isArray(project.rooms)) {
      return breakdown;
    }
    
    project.rooms.forEach(room => {
      if (!room || !room.categories || !Array.isArray(room.categories)) {
        return;
      }
      room.categories.forEach(category => {
        if (!category) return;
        (category.subcategories || []).forEach(subcategory => {
          if (!subcategory) return;
          (subcategory.items || []).forEach(item => {
            if (!item) return;
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
    
    if (!project || !project.rooms || !Array.isArray(project.rooms)) {
      return carriers;
    }
    
    project.rooms.forEach(room => {
      if (!room || !room.categories || !Array.isArray(room.categories)) {
        return;
      }
      room.categories.forEach(category => {
        if (!category) return;
        (category.subcategories || []).forEach(subcategory => {
          if (!subcategory) return;
          (subcategory.items || []).forEach(item => {
            if (!item) return;
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
    <div className="max-w-full mx-auto bg-gradient-to-b from-black via-gray-900 to-black min-h-screen">
      {/* TOP HEADER */}
      <div className="mb-6">
        <div className="text-center mb-4">
          <h1 className="text-4xl font-bold text-white mb-2" style={{ color: '#8b7355' }}>GREENE</h1>
          <p style={{ color: '#F5F5DC', opacity: '0.8' }}>Emileigh Greene - 4567 Crooked Creek Road, Gainesville, Georgia, 30506</p>
        </div>

        {!hideNavigation && (
          <>
            {/* Navigation Tabs */}
            <div className="flex justify-center space-x-8 mb-6">
              <a href={`/project/${projectId}/questionnaire`} className="flex items-center space-x-2 transition-colors" style={{ color: '#F5F5DC', opacity: '0.7' }} onMouseEnter={(e) => e.target.style.opacity = '1'} onMouseLeave={(e) => e.target.style.opacity = '0.7'}>
                <span>📋</span>
                <span>Questionnaire</span>
              </a>
              <a href={`/project/${projectId}/walkthrough`} className="flex items-center space-x-2 transition-colors" style={{ color: '#F5F5DC', opacity: '0.7' }} onMouseEnter={(e) => e.target.style.opacity = '1'} onMouseLeave={(e) => e.target.style.opacity = '0.7'}>
                <span>🚶</span>
                <span>Walkthrough</span>
              </a>
              <a href={`/project/${projectId}/checklist`} className="flex items-center space-x-2 transition-colors" style={{ color: '#F5F5DC', opacity: '0.7' }} onMouseEnter={(e) => e.target.style.opacity = '1'} onMouseLeave={(e) => e.target.style.opacity = '0.7'}>
                <span>✅</span>
                <span>Checklist</span>
              </a>
              <div className="flex items-center space-x-2" style={{ color: '#8b7355' }}>
                <span>📊</span>
                <span className="font-semibold">FF&E</span>
              </div>
            </div>
          </>
        )}

        {/* LOGO BANNER */}
        <div className="rounded-lg mb-6" style={{ backgroundColor: '#8b7355', padding: '1px 0', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'fit-content' }}>
          <img 
            src="https://customer-assets.emergentagent.com/job_sleek-showcase-46/artifacts/c5c84fh5_Established%20logo.png"
            alt="Established Design Co. Logo" 
            style={{ height: '200px', width: 'auto', objectFit: 'contain', display: 'block' }}
          />
        </div>

        {!hideNavigation && (
          <>
            {/* FF&E TITLE WITH EXPORT BUTTONS */}
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold" style={{ color: '#8b7355' }}>WALKTHROUGH - GREENE</h3>
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
          </>
        )}

        {/* PIE CHART AND STATUS BREAKDOWN - ALWAYS VISIBLE */}
        <StatusOverview
          totalItems={getTotalItems()}
          statusBreakdown={getStatusBreakdown()}
          carrierBreakdown={getCarrierBreakdown()}
          itemStatuses={itemStatuses}
        />
      </div>

      {/* FF&E Spreadsheet */}
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
  );
};

export default WalkthroughDashboard;
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
    <div className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-black" style={{ fontFamily: 'Century Gothic, sans-serif' }}>
      {/* Header with Logo - Same as Studio Dashboard */}
      <div className="bg-gradient-to-r from-[#B49B7E] to-[#A08B6F] shadow-2xl flex items-center justify-center px-2 py-1" style={{ height: '180px' }}>
        <img
          src="https://customer-assets.emergentagent.com/job_sleek-showcase-46/artifacts/c5c84fh5_Established%20logo.png"
          alt="Established Design Co."
          className="w-full h-full object-contain"
          style={{ transform: 'scale(2.2)', maxWidth: '98%', maxHeight: '95%' }}
        />
      </div>

      {/* Project Header */}
      <div className="text-center py-6">
        <h1 className="text-4xl font-light text-[#B49B7E] mb-2 tracking-wide">GREENE</h1>
        <p className="text-lg" style={{ color: '#F5F5DC', opacity: '0.8' }}>Emileigh Greene - 4567 Crooked Creek Road, Gainesville, Georgia, 30506</p>
      </div>

      {/* Main Content Container - MAXIMUM WIDTH for spreadsheet data */}
      <div className="w-full max-w-[95%] mx-auto bg-gradient-to-br from-black/60 to-gray-900/80 p-8 rounded-3xl shadow-2xl border border-[#B49B7E]/20 backdrop-blur-sm mx-4 my-8">
        
        {!hideNavigation && (
          <>
            {/* Navigation Tabs - Luxury Style */}
            <div className="flex justify-center space-x-8 mb-8">
              <a href={`/project/${projectId}/questionnaire`} 
                 className="flex items-center space-x-2 transition-all duration-300 hover:scale-105" 
                 style={{ color: '#F5F5DC', opacity: '0.7' }} 
                 onMouseEnter={(e) => e.target.style.opacity = '1'} 
                 onMouseLeave={(e) => e.target.style.opacity = '0.7'}>
                <span>📋</span>
                <span className="font-light tracking-wide">Questionnaire</span>
              </a>
              <div className="flex items-center space-x-2 bg-gradient-to-r from-[#B49B7E] to-[#A08B6F] px-6 py-3 rounded-full shadow-lg">
                <span>🚶</span>
                <span className="font-medium text-[#F5F5DC] tracking-wide">Walkthrough</span>
              </div>
              <a href={`/project/${projectId}/checklist`} 
                 className="flex items-center space-x-2 transition-all duration-300 hover:scale-105" 
                 style={{ color: '#F5F5DC', opacity: '0.7' }} 
                 onMouseEnter={(e) => e.target.style.opacity = '1'} 
                 onMouseLeave={(e) => e.target.style.opacity = '0.7'}>
                <span>✅</span>
                <span className="font-light tracking-wide">Checklist</span>
              </a>
              <a href={`/project/${projectId}/ffe`} 
                 className="flex items-center space-x-2 transition-all duration-300 hover:scale-105" 
                 style={{ color: '#F5F5DC', opacity: '0.7' }} 
                 onMouseEnter={(e) => e.target.style.opacity = '1'} 
                 onMouseLeave={(e) => e.target.style.opacity = '0.7'}>
                <span>📊</span>
                <span className="font-light tracking-wide">FF&E</span>
              </a>
            </div>
          </>
        )}

        {/* Page Title - Luxury Style */}
        <div className="text-center mb-12">
          <h2 className="text-3xl font-light text-[#B49B7E] tracking-wide mb-6">WALKTHROUGH - GREENE</h2>
          <div className="w-32 h-0.5 bg-gradient-to-r from-transparent via-[#B49B7E] to-transparent mx-auto"></div>
        </div>

        {!hideNavigation && (
          <>
            {/* Action Buttons - Same style as Studio Dashboard */}
            <div className="flex justify-center gap-4 mb-8">
              <button className="bg-gradient-to-r from-[#B49B7E] to-[#A08B6F] hover:from-[#A08B6F] hover:to-[#8B7355] px-8 py-4 text-xl font-medium rounded-full shadow-2xl hover:shadow-[#B49B7E]/25 transition-all duration-300 transform hover:scale-105 tracking-wide flex items-center space-x-2"
                      style={{ color: '#F5F5DC' }}>
                <span>📥</span>
                <span>Export FF&E</span>
              </button>
              <button className="bg-gradient-to-r from-[#B49B7E] to-[#A08B6F] hover:from-[#A08B6F] hover:to-[#8B7355] px-8 py-4 text-xl font-medium rounded-full shadow-2xl hover:shadow-[#B49B7E]/25 transition-all duration-300 transform hover:scale-105 tracking-wide flex items-center space-x-2"
                      style={{ color: '#F5F5DC' }}>
                <span>📋</span>
                <span>Spec Sheet</span>
              </button>
            </div>

            {/* Search and Controls - Darker Gradient to Match Top */}
            <div className="flex items-center justify-between mt-6 p-6 bg-gradient-to-b from-black via-gray-900 to-black rounded-2xl border border-[#B49B7E]/20 shadow-xl backdrop-blur-sm">
              <div className="flex items-center space-x-4 flex-1">
                <input
                  type="text"
                  placeholder="Search Items..."
                  className="flex-1 bg-black/40 border border-[#B49B7E]/30 text-[#F5F5DC] px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#B49B7E] focus:border-[#B49B7E] focus:bg-black/60 transition-all duration-300 placeholder:text-[#B49B7E]/50"
                />
                <select className="bg-black/40 border border-[#B49B7E]/30 text-[#F5F5DC] px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#B49B7E] focus:border-[#B49B7E] transition-all duration-300">
                  <option>All Rooms</option>
                </select>
                <select className="bg-black/40 border border-[#B49B7E]/30 text-[#F5F5DC] px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#B49B7E] focus:border-[#B49B7E] transition-all duration-300">
                  <option>All Statuses</option>
                </select>
              </div>
              <button
                onClick={() => setShowAddRoom(true)}
                className="bg-gradient-to-r from-[#B49B7E] to-[#A08B6F] hover:from-[#A08B6F] hover:to-[#8B7355] px-6 py-3 rounded-full shadow-xl hover:shadow-[#B49B7E]/25 transition-all duration-300 transform hover:scale-105 tracking-wide ml-4 font-medium"
                style={{ color: '#F5F5DC' }}
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

        {/* FF&E Spreadsheet - Inside main container */}
        <div className="mt-8">
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
import React, { useState, useEffect, useRef } from 'react';

import { useParams } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
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
      </div>

      {/* Main Content Container - MAXIMUM WIDTH with Darker Gradient */}
      <div className="w-full max-w-[95%] mx-auto bg-gradient-to-b from-black via-gray-900 to-black p-8 rounded-3xl shadow-2xl border border-[#B49B7E]/20 backdrop-blur-sm mx-4 my-8">
        
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

            {/* Search and Controls - Darker Gradient to Match Content Areas */}
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
      </div>

      {/* Main Content Container - MAXIMUM WIDTH with Darker Gradient */}
      <div className="w-full max-w-[95%] mx-auto bg-gradient-to-b from-black via-gray-900 to-black p-8 rounded-3xl shadow-2xl border border-[#B49B7E]/20 backdrop-blur-sm mx-4 my-8">
        
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

            {/* Search and Controls - Darker Gradient to Match Content Areas */}
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
import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { projectAPI, roomAPI, categoryAPI, itemAPI } from '../App';
import SimpleSpreadsheet from './SimpleSpreadsheet';
import StatusOverview from './StatusOverview';
import AddRoomModal from './AddRoomModal';

// Default categories for each room type (from Google Sheets)
const ROOM_DEFAULT_CATEGORIES = {
  'living room': ['Lighting', 'Furniture & Storage', 'Decor & Accessories', 'Seating'],
  'kitchen': ['Lighting', 'Plumbing & Fixtures', 'Equipment & Furniture', 'Decor & Accessories'],
  'master bedroom': ['Lighting', 'Furniture & Storage', 'Decor & Accessories', 'Seating'],
  'bedroom 2': ['Lighting', 'Furniture & Storage', 'Decor & Accessories'],
  'bedroom 3': ['Lighting', 'Furniture & Storage', 'Decor & Accessories'],
  'bathroom': ['Lighting', 'Plumbing & Fixtures', 'Decor & Accessories'],
  'master bathroom': ['Lighting', 'Plumbing & Fixtures', 'Decor & Accessories'],
  'powder room': ['Lighting', 'Plumbing & Fixtures', 'Decor & Accessories'],
  'dining room': ['Lighting', 'Furniture & Storage', 'Decor & Accessories', 'Seating'],
  'office': ['Lighting', 'Furniture & Storage', 'Equipment & Furniture', 'Decor & Accessories'],
  'family room': ['Lighting', 'Furniture & Storage', 'Decor & Accessories', 'Seating'],
  'basement': ['Lighting', 'Furniture & Storage', 'Equipment & Furniture', 'Misc.'],
  'laundry room': ['Lighting', 'Equipment & Furniture', 'Plumbing & Fixtures'],
  'mudroom': ['Lighting', 'Furniture & Storage', 'Decor & Accessories'],
  'pantry': ['Lighting', 'Furniture & Storage'],
  'closet': ['Lighting', 'Furniture & Storage'],
  'guest room': ['Lighting', 'Furniture & Storage', 'Decor & Accessories', 'Seating'],
  'playroom': ['Lighting', 'Furniture & Storage', 'Decor & Accessories', 'Seating'],
  'library': ['Lighting', 'Furniture & Storage', 'Decor & Accessories', 'Seating'],
  'wine cellar': ['Lighting', 'Equipment & Furniture', 'Furniture & Storage'],
  'garage': ['Lighting', 'Equipment & Furniture'],
  'patio': ['Lighting', 'Furniture & Storage', 'Decor & Accessories', 'Seating']
};

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
  const loadingRef = useRef(false);

  useEffect(() => {
    if (projectId) {
      // FORCE SIMPLE LOADING - NO COMPLEX LOGIC
      console.log('🚀 FORCE LOADING PROJECT:', projectId);
      
      setLoading(true);
      loadSimpleProject();
    }
  }, [projectId]);

  const loadSimpleProject = async () => {
    try {
      console.log('🚀 Loading project data...');
      const response = await fetch(`${import.meta.env?.REACT_APP_BACKEND_URL || process.env.REACT_APP_BACKEND_URL || 'https://furnishpro.preview.emergentagent.com'}/api/projects/${projectId}`);
      
      if (response.ok) {
        const projectData = await response.json();
        console.log('🚀 Project loaded:', projectData.name);
        setProject(projectData);
        setError(null);
      } else {
        console.error('🚀 Failed to load project:', response.status);
        setError('Failed to load project');
      }
    } catch (err) {
      console.error('🚀 Error loading project:', err);
      setError('Error loading project: ' + err.message);
    } finally {
      console.log('🚀 FORCE SETTING LOADING = FALSE');
      setLoading(false);
      
      // Set default utility data
      setRoomColors({});
      setCategoryColors({});
      setItemStatuses(['ORDERED', 'DELIVERED TO JOB SITE', 'INSTALLED']);
      setVendorTypes(['Four Hands', 'Uttermost']);
      setCarrierTypes(['FedEx', 'UPS']);
    }
  };

  const loadUtilityDataAsync = async () => {
    try {
      // SIMPLE FIX: Just use default values instead of trying to fetch from API
      console.log('🔧 Loading default utility data...');
      
      setRoomColors({});
      setCategoryColors({});
      setItemStatuses(['PICKED', 'ORDERED', 'SHIPPED', 'DELIVERED TO RECEIVER', 'DELIVERED TO JOB SITE', 'INSTALLED', 'PARTIALLY DELIVERED', 'ON HOLD', 'CANCELLED', 'BACKORDERED', 'IN TRANSIT', 'OUT FOR DELIVERY', 'RETURNED', 'DAMAGED', 'MISSING', 'PENDING APPROVAL', 'QUOTE REQUESTED', 'APPROVED', 'REJECTED']);
      setVendorTypes(['Four Hands', 'Uttermost', 'Rowe Furniture', 'Regina Andrew', 'Bernhardt', 'Loloi Rugs', 'Vandh', 'Visual Comfort', 'HVL Group', 'Flow Decor', 'Classic Home', 'Crestview Collection', 'Bassett Mirror', 'Eichholtz', 'York Wallcoverings', 'Phillips Collection', 'Phillip Jeffries', 'Hinkley Lighting', 'Zeev Lighting', 'Hubbardton Forge', 'Currey and Company', 'Surya', 'Myoh America', 'Gabby']);
      setCarrierTypes(['FedEx', 'FedEx Ground', 'FedEx Express', 'UPS', 'UPS Ground', 'UPS Express', 'USPS', 'DHL', 'White Glove Delivery', 'Freight', 'Local Delivery', 'Customer Pickup', 'Brooks', 'Zenith', 'Sunbelt', 'Specialized Carrier', 'Installation Crew', 'Other']);
      
      console.log('✅ Default utility data loaded successfully');
      return true;
    } catch (err) {
      console.error('Error loading utility data:', err);
      // Fallback values
      setRoomColors({});
      setCategoryColors({});
      setItemStatuses(['ORDERED', 'DELIVERED TO JOB SITE', 'INSTALLED']);
      setVendorTypes(['Four Hands', 'Uttermost', 'Rowe Furniture']);
      setCarrierTypes(['FedEx', 'UPS', 'USPS']);
      return true;
    }
  };

  const handleAddRoom = async (roomData) => {
    try {
      const newRoom = {
        ...roomData,
        project_id: projectId,
        order_index: project.rooms.length
      };
      
      // Create the room - backend will auto-populate categories and subcategories
      const roomResponse = await roomAPI.create(newRoom);
      
      // Reload project to show the newly created room with full structure
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

  const handleDragEnd = async (result) => {
    if (!result.destination) return;

    const { source, destination, type } = result;

    if (type === 'room') {
      // Reorder rooms
      const newRooms = Array.from(project.rooms);
      const [reorderedRoom] = newRooms.splice(source.index, 1);
      newRooms.splice(destination.index, 0, reorderedRoom);
      
      // Update order indices
      const updatedRooms = newRooms.map((room, index) => ({
        ...room,
        order_index: index
      }));
      
      setProject({ ...project, rooms: updatedRooms });
      
      // Update order in backend
      try {
        for (const room of updatedRooms) {
          await roomAPI.update(room.id, { order_index: room.order_index });
        }
      } catch (err) {
        console.error('Error updating room order:', err);
        // Revert on error
        await loadSimpleProject();
      }
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
            breakdown[item.status] = (breakdown[item.status] || 0) + 1;
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
            if (item.tracking_number && item.vendor) {
              const carrier = extractCarrier(item.vendor, item.tracking_number);
              if (carrier) {
                carriers[carrier] = (carriers[carrier] || 0) + 1;
              }
            }
          });
        });
      });
    });
    return carriers;
  };

  const extractCarrier = (vendor, trackingNumber) => {
    if (!trackingNumber) return null;
    
    // Simple carrier detection based on tracking number patterns
    if (trackingNumber.match(/^1Z/)) return 'UPS';
    if (trackingNumber.match(/^\d{12,14}$/)) return 'FedEx';
    if (trackingNumber.match(/^(94|92|93|95)/)) return 'USPS';
    if (vendor && vendor.toLowerCase().includes('fedex')) return 'FedEx';
    if (vendor && vendor.toLowerCase().includes('ups')) return 'UPS';
    if (vendor && vendor.toLowerCase().includes('usps')) return 'USPS';
    
    return 'Other';
  };

  return (
    <div className="max-w-full mx-auto bg-gray-950 min-h-screen">
      {error && (
        <div className="bg-red-900 border border-red-700 text-red-100 p-4 rounded-lg mb-6">
          {error}
        </div>
      )}

      {/* TOP HEADER - LARGE GREENE + ADDRESS - FIRST! */}
      <div className="mb-6">
        <div className="text-center mb-4">
          <h1 className="text-4xl font-bold text-white mb-2" style={{ color: '#8b7355' }}>GREENE</h1>
          <p className="text-gray-300">Emileigh Greene - 4567 Crooked Creek Road, Gainesville, Georgia, 30506</p>
        </div>

        {/* SHEET NAVIGATION TABS */}
        <div className="flex justify-center space-x-8 mb-6">
          <div className="flex items-center space-x-2 text-gray-400">
            <span>📋</span>
            <span>Questionnaire</span>
          </div>
          <div className="flex items-center space-x-2 text-gray-400">
            <span>🚶</span>
            <span>Walkthrough</span>
          </div>
          <div className="flex items-center space-x-2 text-gray-400">
            <span>✅</span>
            <span>Checklist</span>
          </div>
          <div className="flex items-center space-x-2" style={{ color: '#8b7355' }}>
            <span>📊</span>
            <span className="font-semibold">FF&E</span>
          </div>
        </div>

        {/* LOGO BANNER - BARELY ANY TOP/BOTTOM PADDING */}
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

        {/* PIE CHART AND STATUS BREAKDOWN - UNDER FF&E TITLE */}
        <StatusOverview
          totalItems={getTotalItems()}
          statusBreakdown={getStatusBreakdown()}
          itemStatuses={itemStatuses}
        />

        {/* SHIPPING CARRIER BREAKDOWN - UNDER STATUS */}
        <div className="bg-gray-800 rounded-xl p-6 mt-6">
          <h3 className="text-lg font-semibold text-white mb-4">Shipping Carrier Breakdown</h3>
          
          {Object.keys(getCarrierBreakdown()).length > 0 ? (
            <div className="space-y-2">
              {Object.entries(getCarrierBreakdown()).map(([carrier, count]) => (
                <div key={carrier} className="flex justify-between items-center p-2 bg-gray-700 rounded">
                  <span className="text-gray-300">{carrier}</span>
                  <span className="text-gray-200 font-medium">{count}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-gray-500">
              <div className="text-4xl mb-2">📦</div>
              <p className="text-sm">No items with assigned carriers.</p>
            </div>
          )}
        </div>

        {/* SEARCH BAR AND ADD ROOM BUTTON - LAST */}
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
      <div className="px-6">
        <FFESpreadsheet
          project={project}
          roomColors={roomColors}
          categoryColors={categoryColors}
          itemStatuses={itemStatuses}
          vendorTypes={vendorTypes}
          carrierTypes={carrierTypes}
          onDeleteRoom={handleDeleteRoom}
          onReload={loadSimpleProject}
          isOffline={isOffline}
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
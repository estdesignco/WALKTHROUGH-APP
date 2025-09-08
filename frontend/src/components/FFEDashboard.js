import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { projectAPI, roomAPI, categoryAPI, itemAPI } from '../App';
import FFESpreadsheet from './FFESpreadsheet';
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

  useEffect(() => {
    if (projectId) {
      loadProject();
      loadUtilityData();
    }
  }, [projectId]);

  const loadProject = async () => {
    try {
      setLoading(true);
      const response = await projectAPI.getById(projectId);
      setProject(response.data);
      
      // Cache for offline use
      localStorage.setItem(`project_${projectId}`, JSON.stringify(response.data));
      setError(null);
    } catch (err) {
      setError('Failed to load project');
      console.error('Error loading project:', err);
      
      // Try to load from cache
      const cachedProject = localStorage.getItem(`project_${projectId}`);
      if (cachedProject) {
        setProject(JSON.parse(cachedProject));
        setError('Using cached data - changes may not be saved');
      }
    } finally {
      setLoading(false);
    }
  };

  const loadUtilityData = async () => {
    try {
      const { utilityAPI } = await import('../App');
      const [roomColorsRes, categoryColorsRes, statusesRes, vendorsRes, carriersRes] = await Promise.all([
        utilityAPI.getRoomColors(),
        utilityAPI.getCategoryColors(), 
        utilityAPI.getItemStatuses(),
        utilityAPI.getVendorTypes(),
        utilityAPI.getCarrierTypes()
      ]);
      
      setRoomColors(roomColorsRes.data);
      setCategoryColors(categoryColorsRes.data);
      setItemStatuses(statusesRes.data);
      setVendorTypes(vendorsRes.data);
      setCarrierTypes(carriersRes.data);
    } catch (err) {
      console.error('Error loading utility data:', err);
      // Use default values
      setRoomColors({});
      setCategoryColors({});
      setItemStatuses(['PICKED', 'ORDERED', 'SHIPPED', 'DELIVERED TO RECEIVER', 'DELIVERED TO JOB SITE', 'INSTALLED', 'PARTIALLY DELIVERED', 'ON HOLD', 'CANCELLED', 'BACKORDERED', 'IN TRANSIT', 'OUT FOR DELIVERY', 'RETURNED', 'DAMAGED', 'MISSING', 'PENDING APPROVAL', 'QUOTE REQUESTED', 'APPROVED', 'REJECTED']);
      setVendorTypes(['Four Hands', 'Uttermost', 'Rowe Furniture', 'Regina Andrew', 'Bernhardt', 'Loloi Rugs', 'Vandh', 'Visual Comfort', 'HVL Group', 'Flow Decor', 'Classic Home', 'Crestview Collection', 'Bassett Mirror', 'Eichholtz', 'York Wallcoverings', 'Phillips Collection', 'Phillip Jeffries', 'Hinkley Lighting', 'Zeev Lighting', 'Hubbardton Forge', 'Currey and Company', 'Surya', 'Myoh America', 'Gabby']);
      setCarrierTypes(['FedEx', 'FedEx Ground', 'FedEx Express', 'UPS', 'UPS Ground', 'UPS Express', 'USPS', 'DHL', 'White Glove Delivery', 'Freight', 'Local Delivery', 'Customer Pickup', 'Brooks', 'Zenith', 'Sunbelt', 'Specialized Carrier', 'Installation Crew', 'Other']);
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
      await loadProject();
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
      await loadProject();
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
        await loadProject();
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

      {/* Status Overview - Two Row Layout ABOVE client header */}
      <div className="mb-6 grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
        <StatusOverview 
          totalItems={getTotalItems()}
          statusBreakdown={getStatusBreakdown()}
          itemStatuses={itemStatuses}
        />
        

      </div>

      {/* FF&E HEADER LAYOUT - EXACTLY AS USER'S IMAGE */}
      <div className="px-6 mb-6">
        {/* Top Header Row */}
        <div className="flex items-center justify-between mb-6 bg-gradient-to-r from-yellow-600 to-yellow-700 rounded-lg p-4">
          <div className="flex items-center space-x-4">
            <img src="/logo.png" alt="Logo" className="h-10 w-auto" />
            <h1 className="text-2xl font-bold text-black">FF&E - {project?.name || 'PROJECT'}</h1>
          </div>
          <div className="text-right text-black">
            <p className="font-semibold">{project?.client_info?.full_name || 'Client Name'}</p>
            <p className="text-sm">{project?.client_info?.address || 'Address'}</p>
          </div>
        </div>
        
        {/* Button Groups - EXACTLY AS USER'S UPLOADED IMAGES */}
        <div className="grid grid-cols-3 gap-6">
          
          {/* Left Group - Import & Export */}
          <div className="space-y-2">
            <button
              onClick={() => {/* TODO: Implement import */}}
              style={{ backgroundColor: '#8b7355' }}
              className="w-full hover:opacity-90 text-black px-4 py-3 rounded-lg font-bold transition-colors flex items-center justify-center space-x-2"
            >
              <span>📥</span>
              <span>IMPORT</span>
            </button>
            <button
              onClick={() => {/* TODO: Implement export */}}
              style={{ backgroundColor: '#8b7355' }}
              className="w-full hover:opacity-90 text-black px-4 py-3 rounded-lg font-bold transition-colors flex items-center justify-center space-x-2"
            >
              <span>📤</span>
              <span>EXPORT</span>
            </button>
          </div>

          {/* Center Group - Room Management */}
          <div className="space-y-2">
            <button
              onClick={() => setShowAddRoom(true)}
              style={{ backgroundColor: '#8b7355' }}
              className="w-full hover:opacity-90 text-black px-4 py-3 rounded-lg font-bold transition-colors flex items-center justify-center space-x-2"
            >
              <span>➕</span>
              <span>ADD ROOM</span>
            </button>
            <button
              onClick={() => {/* TODO: Implement delete room */}}
              style={{ backgroundColor: '#8b7355' }}
              className="w-full hover:opacity-90 text-black px-4 py-3 rounded-lg font-bold transition-colors flex items-center justify-center space-x-2"
            >
              <span>🗑️</span>
              <span>DELETE ROOM</span>
            </button>
          </div>

          {/* Right Group - Actions */}
          <div className="space-y-2">
            <button
              onClick={() => {/* TODO: Implement move to selection */}}
              style={{ backgroundColor: '#8b7355' }}
              className="w-full hover:opacity-90 text-black px-4 py-3 rounded-lg font-bold transition-colors flex items-center justify-center space-x-2"
            >
              <span>▶️</span>
              <span>MOVE TO SELECTION</span>
            </button>
            <button
              onClick={() => {/* TODO: Implement add item */}}
              style={{ backgroundColor: '#D4AF37' }}
              className="w-full hover:opacity-90 text-black px-4 py-3 rounded-lg font-bold transition-colors flex items-center justify-center space-x-2"
            >
              <span>📋</span>
              <span>ADD ITEM</span>
            </button>
          </div>
        </div>

        {/* Secondary Button Row */}
        <div className="flex justify-center space-x-4 mt-4">
          <button
            onClick={() => {/* TODO: Implement add section */}}
            style={{ backgroundColor: '#D4AF37' }}
            className="hover:opacity-90 text-black px-6 py-2 rounded-lg font-bold transition-colors flex items-center space-x-2"
          >
            <span>📂</span>
            <span>ADD SECTION</span>
          </button>
          <button
            onClick={() => {/* TODO: Implement delete section */}}
            style={{ backgroundColor: '#D4AF37' }}
            className="hover:opacity-90 text-black px-6 py-2 rounded-lg font-bold transition-colors flex items-center space-x-2"
          >
            <span>🗂️</span>
            <span>DELETE SECTION</span>
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
          onReload={loadProject}
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
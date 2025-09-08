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
      const [roomColorsRes, categoryColorsRes, statusesRes] = await Promise.all([
        utilityAPI.getRoomColors(),
        utilityAPI.getCategoryColors(), 
        utilityAPI.getItemStatuses()
      ]);
      
      setRoomColors(roomColorsRes.data);
      setCategoryColors(categoryColorsRes.data);
      setItemStatuses(statusesRes.data);
    } catch (err) {
      console.error('Error loading utility data:', err);
      // Use default values
      setRoomColors({});
      setCategoryColors({});
      setItemStatuses(['PICKED', 'ORDERED', 'SHIPPED', 'DELIVERED', 'INSTALLED']);
    }
  };

  const handleAddRoom = async (roomData) => {
    try {
      const newRoom = {
        ...roomData,
        project_id: projectId,
        order_index: project.rooms.length
      };
      
      // Create the room
      const roomResponse = await roomAPI.create(newRoom);
      const createdRoom = roomResponse.data;
      
      // Auto-create default categories for this room type
      const roomType = roomData.name.toLowerCase();
      const defaultCategories = ROOM_DEFAULT_CATEGORIES[roomType] || ['Lighting', 'Furniture & Storage'];
      
      for (let i = 0; i < defaultCategories.length; i++) {
        const categoryData = {
          name: defaultCategories[i],
          room_id: createdRoom.id,
          order_index: i,
          description: `${defaultCategories[i]} items for ${roomData.name}`
        };
        await categoryAPI.create(categoryData);
      }
      
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
        catTotal + category.items.length, 0
      ), 0
    );
  };

  const getStatusBreakdown = () => {
    const breakdown = {};
    project.rooms.forEach(room => {
      room.categories.forEach(category => {
        category.items.forEach(item => {
          breakdown[item.status] = (breakdown[item.status] || 0) + 1;
        });
      });
    });
    return breakdown;
  };

  const getCarrierBreakdown = () => {
    const carriers = {};
    project.rooms.forEach(room => {
      room.categories.forEach(category => {
        category.items.forEach(item => {
          if (item.tracking_number && item.vendor) {
            // Extract carrier from tracking or vendor info
            const carrier = extractCarrier(item.vendor, item.tracking_number);
            if (carrier) {
              carriers[carrier] = (carriers[carrier] || 0) + 1;
            }
          }
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
        
        {/* Shipping Carrier Breakdown */}
        <div className="bg-gray-800 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-gray-200 mb-4">Shipping Carrier Breakdown</h3>
          
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
      </div>

      {/* Client Header - MOVED BELOW status overview */}
      <div className="mb-6 px-6">
        <div className="bg-gray-700 text-gray-200 p-6 rounded-xl">
          <h1 className="text-3xl font-bold mb-2">
            FF&E - {project.client_info.full_name.split(' ').pop().toUpperCase()}
          </h1>
          <p className="text-lg text-gray-300">
            {project.client_info.full_name} - {project.client_info.address}
          </p>
        </div>
      </div>

      {/* Add Room Button */}
      <div className="mb-6 flex justify-end px-6">
        <button
          onClick={() => setShowAddRoom(true)}
          className="bg-gray-600 hover:bg-gray-500 text-gray-200 px-6 py-2 rounded-lg transition-colors font-medium"
        >
          ➕ Add Room
        </button>
      </div>

      {/* FF&E Spreadsheet */}
      <div className="px-6">
        <FFESpreadsheet
          project={project}
          roomColors={roomColors}
          categoryColors={categoryColors}
          itemStatuses={itemStatuses}
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
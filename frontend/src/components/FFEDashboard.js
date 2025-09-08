import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { projectAPI, roomAPI, categoryAPI, itemAPI } from '../App';
import RoomSection from './RoomSection';
import StatusOverview from './StatusOverview';
import AddRoomModal from './AddRoomModal';

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
      
      await roomAPI.create(newRoom);
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
    } else if (type === 'category') {
      // Handle category reordering within rooms
      const roomId = result.source.droppableId.replace('categories-', '');
      const room = project.rooms.find(r => r.id === roomId);
      
      if (room) {
        const newCategories = Array.from(room.categories);
        const [reorderedCategory] = newCategories.splice(source.index, 1);
        newCategories.splice(destination.index, 0, reorderedCategory);
        
        // Update order indices
        const updatedCategories = newCategories.map((category, index) => ({
          ...category,
          order_index: index
        }));
        
        // Update project state
        const updatedRooms = project.rooms.map(r => 
          r.id === roomId ? { ...r, categories: updatedCategories } : r
        );
        setProject({ ...project, rooms: updatedRooms });
        
        // Update order in backend
        try {
          for (const category of updatedCategories) {
            await categoryAPI.update(category.id, { order_index: category.order_index });
          }
        } catch (err) {
          console.error('Error updating category order:', err);
          await loadProject();
        }
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400 mx-auto"></div>
          <p className="text-gray-400 mt-4">Loading FF&E data...</p>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">❌</div>
        <h2 className="text-2xl font-bold text-white mb-2">Project Not Found</h2>
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

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="bg-yellow-600 text-black p-6 rounded-xl">
          <h1 className="text-3xl font-bold mb-2">
            FF&E - {project.client_info.full_name.split(' ').pop().toUpperCase()}
          </h1>
          <p className="text-lg">
            {project.client_info.full_name} - {project.client_info.address}
          </p>
        </div>
      </div>

      {error && (
        <div className="bg-red-900 border border-red-700 text-red-100 p-4 rounded-lg mb-6">
          {error}
        </div>
      )}

      {/* Status Overview */}
      <StatusOverview 
        totalItems={getTotalItems()}
        statusBreakdown={getStatusBreakdown()}
        itemStatuses={itemStatuses}
      />

      {/* Search and Filters */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <input
              type="text"
              placeholder="🔍 Search items..."
              className="bg-gray-800 text-white px-4 py-2 pl-10 rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
            />
          </div>
          <select className="bg-gray-800 text-white px-4 py-2 rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none">
            <option>All Rooms</option>
            {project.rooms.map(room => (
              <option key={room.id} value={room.id}>{room.name}</option>
            ))}
          </select>
          <select className="bg-gray-800 text-white px-4 py-2 rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none">
            <option>All Categories</option>
            <option>Lighting</option>
            <option>Furniture</option>
            <option>Accessories</option>
          </select>
        </div>
        
        <button
          onClick={() => setShowAddRoom(true)}
          className="bg-yellow-600 hover:bg-yellow-700 text-black px-6 py-2 rounded-lg transition-colors font-medium"
        >
          ➕ Add Room
        </button>
      </div>

      {/* Rooms with Drag & Drop */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="rooms" type="room">
          {(provided) => (
            <div
              {...provided.droppableProps}
              ref={provided.innerRef}
              className="space-y-6"
            >
              {project.rooms.map((room, index) => (
                <Draggable key={room.id} draggableId={room.id} index={index}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      className={`transition-transform ${
                        snapshot.isDragging ? 'scale-105 shadow-2xl' : ''
                      }`}
                    >
                      <RoomSection
                        room={room}
                        roomColors={roomColors}
                        categoryColors={categoryColors}
                        itemStatuses={itemStatuses}
                        onDeleteRoom={handleDeleteRoom}
                        onReload={loadProject}
                        dragHandleProps={provided.dragHandleProps}
                        isOffline={isOffline}
                      />
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      {project.rooms.length === 0 && (
        <div className="bg-gray-800 rounded-xl p-12 text-center">
          <div className="text-6xl mb-4">🏠</div>
          <h3 className="text-xl font-semibold text-white mb-2">No Rooms Added</h3>
          <p className="text-gray-400 mb-6">Start by adding rooms to organize your FF&E items</p>
          <button
            onClick={() => setShowAddRoom(true)}
            className="bg-yellow-600 hover:bg-yellow-700 text-black px-8 py-3 rounded-lg transition-colors"
          >
            Add Your First Room
          </button>
        </div>
      )}

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
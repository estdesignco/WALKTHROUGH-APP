import React, { useState } from 'react';
import { Droppable, Draggable } from '@hello-pangea/dnd';
import { categoryAPI, itemAPI } from '../App';
import CategorySection from './CategorySection';
import AddCategoryModal from './AddCategoryModal';

const RoomSection = ({ 
  room, 
  roomColors, 
  categoryColors, 
  itemStatuses, 
  onDeleteRoom, 
  onReload,
  dragHandleProps,
  isOffline 
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [loading, setLoading] = useState(false);

  const getRoomColor = () => {
    return roomColors[room.name.toLowerCase()] || room.color || '#B22222';
  };

  const getTotalItems = () => {
    return room.categories.reduce((total, category) => total + category.items.length, 0);
  };

  const getStatusCounts = () => {
    const counts = {};
    room.categories.forEach(category => {
      category.items.forEach(item => {
        counts[item.status] = (counts[item.status] || 0) + 1;
      });
    });
    return counts;
  };

  const handleAddCategory = async (categoryData) => {
    try {
      setLoading(true);
      const newCategory = {
        ...categoryData,
        room_id: room.id,
        order_index: room.categories.length
      };
      
      await categoryAPI.create(newCategory);
      await onReload();
      setShowAddCategory(false);
    } catch (err) {
      console.error('Error creating category:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCategory = async (categoryId) => {
    if (!window.confirm('Are you sure you want to delete this category? This will delete all items within it.')) {
      return;
    }
    
    try {
      setLoading(true);
      await categoryAPI.delete(categoryId);
      await onReload();
    } catch (err) {
      console.error('Error deleting category:', err);
    } finally {
      setLoading(false);
    }
  };

  const statusCounts = getStatusCounts();
  const totalItems = getTotalItems();

  return (
    <div className="bg-gray-800 rounded-xl overflow-hidden shadow-lg">
      {/* Room Header */}
      <div 
        className="p-4 flex items-center justify-between cursor-pointer"
        style={{ backgroundColor: getRoomColor() }}
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        <div className="flex items-center space-x-4">
          {/* Drag Handle */}
          <div {...dragHandleProps} className="cursor-grab active:cursor-grabbing">
            <div className="flex flex-col space-y-1">
              <div className="w-1 h-1 bg-black rounded-full"></div>
              <div className="w-1 h-1 bg-black rounded-full"></div>
              <div className="w-1 h-1 bg-black rounded-full"></div>
            </div>
          </div>
          
          <div>
            <h2 className="text-xl font-bold text-black">
              {room.name.toUpperCase()} ({room.categories.length} categories)
            </h2>
            {room.description && (
              <p className="text-black text-opacity-80 text-sm">{room.description}</p>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-4">
          {/* Status Summary */}
          <div className="flex items-center space-x-2 text-black text-sm">
            <span>📦 {totalItems} items</span>
            {statusCounts['DELIVERED'] && (
              <span>✅ {statusCounts['DELIVERED']} delivered</span>
            )}
          </div>

          {/* Room Actions */}
          <div className="flex items-center space-x-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowAddCategory(true);
              }}
              className="bg-black bg-opacity-20 hover:bg-opacity-30 text-black px-3 py-1 rounded text-sm transition-colors"
              title="Add Category"
            >
              ➕ Add Category
            </button>
            
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDeleteRoom(room.id);
              }}
              className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm transition-colors"
              title="Delete Room"
            >
              🗑️ Delete Room
            </button>
            
            <button className="text-black hover:text-gray-700 transition-colors">
              {isCollapsed ? '▼' : '▲'}
            </button>
          </div>
        </div>
      </div>

      {/* Room Content */}
      {!isCollapsed && (
        <div className="p-6">
          {room.categories.length > 0 ? (
            <Droppable droppableId={`categories-${room.id}`} type="category">
              {(provided) => (
                <div
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  className="space-y-4"
                >
                  {room.categories.map((category, index) => (
                    <Draggable key={category.id} draggableId={category.id} index={index}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          className={`transition-transform ${
                            snapshot.isDragging ? 'scale-105 shadow-xl' : ''
                          }`}
                        >
                          <CategorySection
                            category={category}
                            categoryColors={categoryColors}
                            itemStatuses={itemStatuses}
                            onDeleteCategory={handleDeleteCategory}
                            onReload={onReload}
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
          ) : (
            <div className="text-center py-12 bg-gray-700 rounded-lg">
              <div className="text-4xl mb-4">📂</div>
              <h3 className="text-lg font-semibold text-white mb-2">No Categories</h3>
              <p className="text-gray-400 mb-4">Add categories like Lighting, Furniture, etc.</p>
              <button
                onClick={() => setShowAddCategory(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
              >
                Add First Category
              </button>
            </div>
          )}
        </div>
      )}

      {/* Add Category Modal */}
      {showAddCategory && (
        <AddCategoryModal
          onClose={() => setShowAddCategory(false)}
          onSubmit={handleAddCategory}
          categoryColors={categoryColors}
          loading={loading}
        />
      )}
    </div>
  );
};

export default RoomSection;
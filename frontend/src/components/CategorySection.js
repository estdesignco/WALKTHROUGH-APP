// RED BANNER TEST
import React, { useState } from 'react';
import { itemAPI } from '../App';
import ItemRow from './ItemRow';
import AddItemModal from './AddItemModal';

const CategorySection = ({ 
  category, 
  categoryColors, 
  itemStatuses, 
  onDeleteCategory, 
  onReload,
  dragHandleProps,
  isOffline 
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showAddItem, setShowAddItem] = useState(false);
  const [loading, setLoading] = useState(false);

  const getCategoryColor = () => {
    return categoryColors[category.name.toLowerCase()] || category.color || '#104131';
  };

  const handleAddItem = async (itemData) => {
    try {
      setLoading(true);
      const newItem = {
        ...itemData,
        category_id: category.id
      };
      
      await itemAPI.create(newItem);
      await onReload();
      setShowAddItem(false);
    } catch (err) {
      console.error('Error creating item:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteItem = async (itemId) => {
    if (!window.confirm('Are you sure you want to delete this item?')) {
      return;
    }
    
    try {
      setLoading(true);
      await itemAPI.delete(itemId);
      await onReload();
    } catch (err) {
      console.error('Error deleting item:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateItem = async (itemId, updateData) => {
    try {
      await itemAPI.update(itemId, updateData);
      await onReload();
    } catch (err) {
      console.error('Error updating item:', err);
    }
  };

    <div className="bg-gray-700 rounded-lg overflow-hidden">
      {/* Category Header */}
      <div 
        className="p-3 flex items-center justify-between cursor-pointer"
        style={{ backgroundColor: getCategoryColor() }}
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        <div className="flex items-center space-x-3">
          {/* Drag Handle */}
          <div {...dragHandleProps} className="cursor-grab active:cursor-grabbing">
            <div className="flex space-x-1">
              <div className="w-1 h-4 bg-white bg-opacity-30 rounded-full"></div>
              <div className="w-1 h-4 bg-white bg-opacity-30 rounded-full"></div>
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold text-white">
              {category.name.toUpperCase()} ({category.items.length} items)
            </h3>
            {category.description && (
              <p className="text-white text-opacity-80 text-sm">{category.description}</p>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowAddItem(true);
            }}
            className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white px-2 py-1 rounded text-sm transition-colors"
            title="Add Item"
          >
            ➕ Add Item
          </button>
          
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDeleteCategory(category.id);
            }}
            className="bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded text-sm transition-colors"
            title="Delete Category"
          >
            🗑️
          </button>
          
          <button className="text-white hover:text-gray-300 transition-colors">
            {isCollapsed ? '▼' : '▲'}
          </button>
        </div>
      </div>

      {/* Category Content */}
      {!isCollapsed && (
        <div className="p-4">
          {category.items.length > 0 ? (
            <div className="space-y-2">
              {/* Table Header */}
              <div className="grid grid-cols-12 gap-4 px-4 py-2 bg-gray-600 rounded text-sm font-semibold text-gray-300">
                <div className="col-span-3">INSTALLED NAME</div>
                <div className="col-span-1">QTY</div>
                <div className="col-span-1">SIZE</div>
                <div className="col-span-2">STATUS</div>
                <div className="col-span-2">VENDOR</div>
                <div className="col-span-2">VENDOR/SKU</div>
                <div className="col-span-1">ACTIONS</div>
              </div>
              
              {/* Items */}
              {category.items.map((item, index) => (
                <ItemRow
                  key={item.id}
                  item={item}
                  itemStatuses={itemStatuses}
                  onUpdate={handleUpdateItem}
                  onDelete={handleDeleteItem}
                  isEven={index % 2 === 0}
                  isOffline={isOffline}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-8 bg-gray-600 rounded-lg">
              <div className="text-3xl mb-2">📝</div>
              <h4 className="text-md font-semibold text-white mb-2">No Items</h4>
              <p className="text-gray-400 mb-4">Add items to this category</p>
              <button
                onClick={() => setShowAddItem(true)}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Add First Item
              </button>
            </div>
          )}
        </div>
      )}

      {/* Add Item Modal */}
      {showAddItem && (
        <AddItemModal
          onClose={() => setShowAddItem(false)}
          onSubmit={handleAddItem}
          itemStatuses={itemStatuses}
          loading={loading}
        />
      )}
    </div>
  );
};

export default CategorySection;
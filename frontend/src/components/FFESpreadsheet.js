import React, { useState } from 'react';
import { itemAPI } from '../App';
import AddSubCategoryModal from './AddSubCategoryModal';
import AddItemModal from './AddItemModal';

const FFESpreadsheet = ({ 
  project, 
  roomColors, 
  categoryColors, 
  itemStatuses, 
  onDeleteRoom, 
  onReload,
  isOffline 
}) => {
  const [showAddSubCategory, setShowAddSubCategory] = useState(false);
  const [showAddItem, setShowAddItem] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);
  const [selectedSubCategoryId, setSelectedSubCategoryId] = useState(null);
  const [loading, setLoading] = useState(false);

  // EXACT colors from your screenshots - even more muted
  const getRoomColor = (roomName) => {
    const mutedColors = {
      'living room': '#7A5A8A',  // Purple like your screenshot
      'kitchen': '#5A6A5A',      
      'master bedroom': '#6A5A7A', 
      'bedroom 2': '#7A5A5A',    
      'bedroom 3': '#5A6A6A',
      'bathroom': '#5A5A7A',     
      'master bathroom': '#6A4A4A', 
      'powder room': '#4A6A6A',  
      'dining room': '#7A6A8A',     
      'office': '#4A5A5A',          
      'family room': '#5A6A8A',     
      'basement': '#8A7A5A',        
      'laundry room': '#4A4A6A',    
      'mudroom': '#5A6A4A',         
      'pantry': '#8A8A5A',          
      'closet': '#6A7A6A',          
      'guest room': '#8A5A7A',      
      'playroom': '#8A8A5A',        
      'library': '#4A6A8A',         
      'wine cellar': '#4A4A6A',     
      'garage': '#6A7A4A',          
      'patio': '#7A7A5A'            
    };
    return mutedColors[roomName.toLowerCase()] || '#6A6A6A';
  };

  // GREEN for categories (like LIGHTING)
  const getCategoryColor = (categoryName) => {
    return '#5A7A5A'; // Muted green like your screenshot
  };

  // RED for sub-categories (like INSTALLED, MOLDING)
  const getSubCategoryColor = (subCategoryName) => {
    return '#8A5A5A'; // Muted red like your screenshot
  };

  const handleAddSubCategory = async (subCategoryData) => {
    try {
      setLoading(true);
      const newSubCategory = {
        ...subCategoryData,
        category_id: selectedCategoryId,
        order_index: 0
      };
      
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/subcategories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSubCategory)
      });
      
      if (response.ok) {
        await onReload();
        setShowAddSubCategory(false);
        setSelectedCategoryId(null);
      }
    } catch (err) {
      console.error('Error creating subcategory:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddItem = async (itemData) => {
    try {
      setLoading(true);
      const newItem = {
        ...itemData,
        subcategory_id: selectedSubCategoryId
      };
      
      await itemAPI.create(newItem);
      await onReload();
      setShowAddItem(false);
      setSelectedSubCategoryId(null);
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

  const getStatusColor = (status) => {
    // Even more muted status colors
    const colors = {
      'PICKED': '#A69A5A',      // More muted yellow
      'ORDERED': '#5A6A8A',     // More muted blue
      'SHIPPED': '#A06A5A',     // More muted orange
      'DELIVERED': '#5A8A6A',   // More muted green
      'INSTALLED': '#6A8A6A',   // More muted bright green
      'PARTIALLY_DELIVERED': '#7A6A8A', // More muted purple
      'ON_HOLD': '#8A5A5A',     // More muted red
      'CANCELLED': '#6A6A6A'    // More muted gray
    };
    return colors[status] || '#6A6A6A';
  };

  if (project.rooms.length === 0) {
    return (
      <div className="bg-gray-800 rounded-xl p-12 text-center">
        <div className="text-6xl mb-4">🏠</div>
        <h3 className="text-xl font-semibold text-gray-200 mb-2">No Rooms Added</h3>
        <p className="text-gray-400 mb-6">Start by adding rooms to organize your FF&E items</p>
      </div>
    );
  }

  return (
    <div className="bg-neutral-900 rounded-lg overflow-hidden shadow-lg">
      {/* Horizontal Scrollable Container */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[3200px] border-collapse" style={{ tableLayout: 'fixed' }}>
          {/* NO HEADER ROW - Headers go on the red subcategory lines as per your requirements */}
          <tbody>
            {project.rooms.map((room) => (
              <React.Fragment key={room.id}>
                {/* 1. ROOM Header Row - PURPLE like LIVING ROOM - CENTERED */}
                <tr>
                  <td 
                    colSpan="13" 
                    className="p-4 font-bold text-white text-lg border border-neutral-600 fit-text text-center"
                    style={{ backgroundColor: getRoomColor(room.name) }}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <span></span>
                      <span>{room.name.toUpperCase()}</span>
                      <div className="flex space-x-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteRoom(room.id);
                          }}
                          className="bg-neutral-800 bg-opacity-50 hover:bg-opacity-70 text-white px-2 py-1 rounded text-sm"
                          title="Delete Room"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  </td>
                </tr>

                {/* 2. CATEGORIES for this room - GREEN like LIGHTING - CENTERED */}
                {room.categories.map((category) => (
                  <React.Fragment key={category.id}>
                    <tr>
                      <td 
                        colSpan="13" 
                        className="p-3 font-semibold text-white text-md border border-neutral-600 fit-text text-center"
                        style={{ backgroundColor: getCategoryColor(category.name) }}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <span></span>
                          <span>{category.name.toUpperCase()}</span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedCategoryId(category.id);
                              setShowAddSubCategory(true);
                            }}
                            className="bg-neutral-800 bg-opacity-50 hover:bg-opacity-70 text-white px-2 py-1 rounded text-xs"
                            title="Add Sub-Category"
                          >
                            ➕ Section
                          </button>
                        </div>
                      </td>
                    </tr>

                    {/* 3. SUB-CATEGORIES with COLUMN HEADERS - RED like INSTALLED */}
                    {category.subcategories?.map((subcategory) => (
                      <React.Fragment key={subcategory.id}>
                        {/* RED HEADER ROW WITH BOTH SUBCATEGORY NAME AND COLUMN HEADERS */}
                        <tr>
                          <td 
                            className="w-48 p-2 font-semibold text-white text-sm border border-neutral-600 fit-text text-center"
                            style={{ backgroundColor: getSubCategoryColor(subcategory.name) }}
                          >
                            {subcategory.name.toUpperCase()}
                          </td>
                          <td 
                            className="w-32 p-2 font-semibold text-white text-sm border border-neutral-600 fit-text text-center"
                            style={{ backgroundColor: getSubCategoryColor(subcategory.name) }}
                          >
                            ITEM
                          </td>
                          <td 
                            className="w-32 p-2 font-semibold text-white text-sm border border-neutral-600 fit-text text-center"
                            style={{ backgroundColor: getSubCategoryColor(subcategory.name) }}
                          >
                            VENDOR/SKU
                          </td>
                          <td 
                            className="w-16 p-2 font-semibold text-white text-sm border border-neutral-600 fit-text text-center"
                            style={{ backgroundColor: getSubCategoryColor(subcategory.name) }}
                          >
                            QTY
                          </td>
                          <td 
                            className="w-24 p-2 font-semibold text-white text-sm border border-neutral-600 fit-text text-center"
                            style={{ backgroundColor: getSubCategoryColor(subcategory.name) }}
                          >
                            SIZE
                          </td>
                          <td 
                            className="w-32 p-2 font-semibold text-white text-sm border border-neutral-600 fit-text text-center"
                            style={{ backgroundColor: getSubCategoryColor(subcategory.name) }}
                          >
                            STATUS
                          </td>
                          <td 
                            className="w-24 p-2 font-semibold text-white text-sm border border-neutral-600 fit-text text-center"
                            style={{ backgroundColor: getSubCategoryColor(subcategory.name) }}
                          >
                            COST
                          </td>
                          <td 
                            className="w-32 p-2 font-semibold text-white text-sm border border-neutral-600 fit-text text-center"
                            style={{ backgroundColor: getSubCategoryColor(subcategory.name) }}
                          >
                            LINK
                          </td>
                          <td 
                            className="w-32 p-2 font-semibold text-white text-sm border border-neutral-600 fit-text text-center"
                            style={{ backgroundColor: getSubCategoryColor(subcategory.name) }}
                          >
                            TRACKING #
                          </td>
                          <td 
                            className="w-32 p-2 font-semibold text-white text-sm border border-neutral-600 fit-text text-center"
                            style={{ backgroundColor: getSubCategoryColor(subcategory.name) }}
                          >
                            ORDER DATE
                          </td>
                          <td 
                            className="w-32 p-2 font-semibold text-white text-sm border border-neutral-600 fit-text text-center"
                            style={{ backgroundColor: getSubCategoryColor(subcategory.name) }}
                          >
                            INSTALL DATE
                          </td>
                          <td 
                            className="w-32 p-2 font-semibold text-white text-sm border border-neutral-600 fit-text text-center"
                            style={{ backgroundColor: getSubCategoryColor(subcategory.name) }}
                          >
                            REMARKS
                          </td>
                          <td 
                            className="w-24 p-2 font-semibold text-white text-sm border border-neutral-600 fit-text text-center"
                            style={{ backgroundColor: getSubCategoryColor(subcategory.name) }}
                          >
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedSubCategoryId(subcategory.id);
                                setShowAddItem(true);
                              }}
                              className="bg-neutral-800 bg-opacity-50 hover:bg-opacity-70 text-white px-2 py-1 rounded text-xs"
                              title="Add Item"
                            >
                              ➕ Item
                            </button>
                          </td>
                        </tr>

                        {/* 4. ITEMS for this sub-category */}
                        {subcategory.items?.map((item, itemIndex) => (
                          <FFEItemRow
                            key={item.id}
                            item={item}
                            itemIndex={itemIndex}
                            onUpdate={handleUpdateItem}
                            onDelete={handleDeleteItem}
                            getStatusColor={getStatusColor}
                            itemStatuses={itemStatuses}
                            isOffline={isOffline}
                          />
                        ))}

                        {/* Empty state for sub-category */}
                        {(!subcategory.items || subcategory.items.length === 0) && (
                          <tr>
                            <td colSpan="8" className="p-4 text-center text-neutral-400 border border-neutral-600" style={{ backgroundColor: '#2A2A2A' }}>
                              No items in {subcategory.name.toLowerCase()}. 
                              <button
                                onClick={() => {
                                  setSelectedSubCategoryId(subcategory.id);
                                  setShowAddItem(true);
                                }}
                                className="ml-2 text-neutral-300 hover:text-neutral-200 underline"
                              >
                                Add first item
                              </button>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    )) || (
                      <tr>
                        <td colSpan="8" className="p-4 text-center text-neutral-400 border border-neutral-600" style={{ backgroundColor: '#2A2A2A' }}>
                          No sections in {category.name.toLowerCase()}. 
                          <button
                            onClick={() => {
                              setSelectedCategoryId(category.id);
                              setShowAddSubCategory(true);
                            }}
                            className="ml-2 text-neutral-300 hover:text-neutral-200 underline"
                          >
                            Add first section
                          </button>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}

                {/* Empty state for room */}
                {room.categories.length === 0 && (
                  <tr>
                    <td colSpan="8" className="p-8 text-center text-neutral-400 border border-neutral-600" style={{ backgroundColor: '#2A2A2A' }}>
                      <p>No categories in this room.</p>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modals */}
      {showAddSubCategory && (
        <AddSubCategoryModal
          onClose={() => {
            setShowAddSubCategory(false);
            setSelectedCategoryId(null);
          }}
          onSubmit={handleAddSubCategory}
          loading={loading}
        />
      )}

      {showAddItem && (
        <AddItemModal
          onClose={() => {
            setShowAddItem(false);
            setSelectedSubCategoryId(null);
          }}
          onSubmit={handleAddItem}
          itemStatuses={itemStatuses}
          loading={loading}
        />
      )}
    </div>
  );
};

// Individual Item Row Component - matching your exact layout
const FFEItemRow = ({ 
  item, 
  itemIndex, 
  onUpdate, 
  onDelete, 
  getStatusColor, 
  itemStatuses, 
  isOffline 
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    name: item.name,
    vendor: item.vendor || '',
    quantity: item.quantity,
    size: item.size || '',
    status: item.status,
    remarks: item.remarks || ''
  });

  const handleSave = async () => {
    try {
      await onUpdate(item.id, editData);
      setIsEditing(false);
    } catch (err) {
      console.error('Error updating item:', err);
    }
  };

  const handleCancel = () => {
    setEditData({
      name: item.name,
      vendor: item.vendor || '',
      quantity: item.quantity,
      size: item.size || '',
      status: item.status,
      remarks: item.remarks || ''
    });
    setIsEditing(false);
  };

  // Alternating row colors - MUCH more muted
  const bgColor = itemIndex % 2 === 0 ? '#3A4A5A' : '#4A5A6A';

  return (
    <tr style={{ backgroundColor: bgColor }} className="text-neutral-200 text-sm">
      {/* Item Name */}
      <td className="p-2 border border-neutral-600 fit-text">
        {isEditing ? (
          <input
            type="text"
            value={editData.name}
            onChange={(e) => setEditData({ ...editData, name: e.target.value })}
            className="w-full bg-neutral-800 text-neutral-200 px-2 py-1 rounded text-sm border border-neutral-600"
          />
        ) : (
          <span className="font-medium">{item.name}</span>
        )}
      </td>

      {/* Vendor/SKU */}
      <td className="p-2 border border-neutral-600 fit-text">
        {isEditing ? (
          <input
            type="text"
            value={editData.vendor}
            onChange={(e) => setEditData({ ...editData, vendor: e.target.value })}
            className="w-full bg-neutral-800 text-neutral-200 px-2 py-1 rounded text-sm border border-neutral-600"
          />
        ) : (
          <span>{item.vendor || '-'}</span>
        )}
      </td>

      {/* Quantity */}
      <td className="p-2 border border-neutral-600 text-center fit-text">
        {isEditing ? (
          <input
            type="number"
            value={editData.quantity}
            onChange={(e) => setEditData({ ...editData, quantity: parseInt(e.target.value) || 1 })}
            className="w-full bg-neutral-800 text-neutral-200 px-2 py-1 rounded text-sm border border-neutral-600"
            min="1"
          />
        ) : (
          <span>{item.quantity}</span>
        )}
      </td>

      {/* Size */}
      <td className="p-2 border border-neutral-600 fit-text">
        {isEditing ? (
          <input
            type="text"
            value={editData.size}
            onChange={(e) => setEditData({ ...editData, size: e.target.value })}
            className="w-full bg-neutral-800 text-neutral-200 px-2 py-1 rounded text-sm border border-neutral-600"
          />
        ) : (
          <span>{item.size || '-'}</span>
        )}
      </td>

      {/* Status - DROPDOWN MENU as requested */}
      <td className="p-2 border border-neutral-600 fit-text">
        {isEditing ? (
          <select
            value={editData.status}
            onChange={(e) => setEditData({ ...editData, status: e.target.value })}
            className="w-full bg-neutral-800 text-neutral-200 px-2 py-1 rounded text-sm border border-neutral-600"
          >
            {itemStatuses.map(status => (
              <option key={status} value={status}>
                {status.replace('_', ' ')}
              </option>
            ))}
          </select>
        ) : (
          <select
            value={item.status}
            onChange={(e) => onUpdate(item.id, { status: e.target.value })}
            className="w-full bg-neutral-800 text-neutral-200 px-2 py-1 rounded text-sm border border-neutral-600"
            style={{ 
              backgroundColor: getStatusColor(item.status),
              color: '#2A2A2A'
            }}
          >
            {itemStatuses.map(status => (
              <option key={status} value={status}>
                {status.replace('_', ' ')}
              </option>
            ))}
          </select>
        )}
      </td>

      {/* Vendor/SKU (duplicate column) */}
      <td className="p-2 border border-neutral-600 fit-text">
        <span>{item.vendor || '-'}</span>
      </td>

      {/* Remarks */}
      <td className="p-2 border border-neutral-600 fit-text">
        {isEditing ? (
          <input
            type="text"
            value={editData.remarks}
            onChange={(e) => setEditData({ ...editData, remarks: e.target.value })}
            className="w-full bg-neutral-800 text-neutral-200 px-2 py-1 rounded text-sm border border-neutral-600"
          />
        ) : (
          <span className="truncate" title={item.remarks}>
            {item.remarks || '-'}
          </span>
        )}
      </td>

      {/* Actions */}
      <td className="p-2 border border-neutral-600 text-center fit-text">
        <div className="flex justify-center space-x-1">
          {isEditing ? (
            <>
              <button
                onClick={handleSave}
                className="bg-green-700 hover:bg-green-600 text-neutral-200 px-2 py-1 rounded text-xs"
                disabled={isOffline}
              >
                ✓
              </button>
              <button
                onClick={handleCancel}
                className="bg-neutral-600 hover:bg-neutral-500 text-neutral-200 px-2 py-1 rounded text-xs"
              >
                ✕
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setIsEditing(true)}
                className="bg-neutral-600 hover:bg-neutral-500 text-neutral-200 px-2 py-1 rounded text-xs"
                title="Edit Item"
              >
                ✏️
              </button>
              <button
                onClick={() => onDelete(item.id)}
                className="bg-red-700 hover:bg-red-600 text-neutral-200 px-2 py-1 rounded text-xs"
                title="Delete Item"
                disabled={isOffline}
              >
                🗑️
              </button>
            </>
          )}
        </div>
      </td>
    </tr>
  );
};

export default FFESpreadsheet;
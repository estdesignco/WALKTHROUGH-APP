import React, { useState } from 'react';
import { categoryAPI, itemAPI } from '../App';
import AddCategoryModal from './AddCategoryModal';
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
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [showAddItem, setShowAddItem] = useState(false);
  const [selectedRoomId, setSelectedRoomId] = useState(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);
  const [loading, setLoading] = useState(false);

  // Muted, professional colors
  const getRoomColor = (roomName) => {
    const mutedColors = {
      'living room': '#8B4444',  // Muted red
      'kitchen': '#4A6B6B',      // Muted teal
      'master bedroom': '#5A5A8B', // Muted purple
      'bedroom 2': '#7A4A4A',    // Muted red variant
      'bedroom 3': '#4A5A5A',    // Muted blue-gray
      'bathroom': '#4A4A6B',     // Muted purple
      'master bathroom': '#6B3A3A', // Muted dark red
      'powder room': '#3A5A5A',  // Muted teal
      'dining room': '#6B5A7A',  // Muted purple
      'office': '#3A4A4A',       // Muted dark gray
      'family room': '#4A5A7A',  // Muted blue
      'basement': '#7A6A3A',     // Muted brown
      'laundry room': '#3A3A5A', // Muted dark blue
      'mudroom': '#4A5A3A',      // Muted green
      'pantry': '#7A7A3A',       // Muted olive
      'closet': '#5A6B5A',       // Muted green
      'guest room': '#7A4A6B',   // Muted purple-red
      'playroom': '#7A7A4A',     // Muted yellow
      'library': '#3A5A7A',      // Muted blue
      'wine cellar': '#3A3A5A',  // Muted dark purple
      'garage': '#5A6B3A',       // Muted olive
      'patio': '#6B6B4A'         // Muted tan
    };
    return mutedColors[roomName.toLowerCase()] || '#5A5A5A';
  };

  const getCategoryColor = (categoryName) => {
    const mutedCategoryColors = {
      'lighting': '#3A4A3A',           // Muted dark green
      'furniture & storage': '#6B3A3A', // Muted red-brown
      'plumbing & fixtures': '#3A4A3A',
      'decor & accessories': '#6B3A3A',
      'seating': '#3A4A3A',
      'equipment & furniture': '#6B3A3A',
      'installed': '#3A4A3A',
      'portable': '#6B3A3A',
      'misc.': '#4A4A4A'
    };
    return mutedCategoryColors[categoryName.toLowerCase()] || '#4A4A4A';
  };

  const handleAddCategory = async (categoryData) => {
    try {
      setLoading(true);
      const newCategory = {
        ...categoryData,
        room_id: selectedRoomId,
        order_index: 0
      };
      
      await categoryAPI.create(newCategory);
      await onReload();
      setShowAddCategory(false);
      setSelectedRoomId(null);
    } catch (err) {
      console.error('Error creating category:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddItem = async (itemData) => {
    try {
      setLoading(true);
      const newItem = {
        ...itemData,
        category_id: selectedCategoryId
      };
      
      await itemAPI.create(newItem);
      await onReload();
      setShowAddItem(false);
      setSelectedCategoryId(null);
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
    // Muted status colors
    const colors = {
      'PICKED': '#B8A84A',      // Muted yellow
      'ORDERED': '#4A6B8B',     // Muted blue
      'SHIPPED': '#B86A4A',     // Muted orange
      'DELIVERED': '#4A8B6A',   // Muted green
      'INSTALLED': '#5A8B5A',   // Muted bright green
      'PARTIALLY_DELIVERED': '#6A5A8B', // Muted purple
      'ON_HOLD': '#8B4A4A',     // Muted red
      'CANCELLED': '#5A5A5A'    // Muted gray
    };
    return colors[status] || '#5A5A5A';
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
    <div className="bg-gray-850 rounded-lg overflow-hidden shadow-lg">
      {/* Horizontal Scrollable Container */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[2400px] border-collapse" style={{ tableLayout: 'fixed' }}>
          <thead>
            {/* Main Header Row */}
            <tr className="bg-gray-600 text-gray-200 text-sm font-bold">
              <th className="w-48 p-3 border border-gray-500 text-left" style={{ whiteSpace: 'nowrap', width: 'fit-content' }}>ITEM</th>
              <th className="w-32 p-3 border border-gray-500 text-left" style={{ whiteSpace: 'nowrap', width: 'fit-content' }}>VENDOR/SKU</th>
              <th className="w-16 p-3 border border-gray-500 text-center" style={{ whiteSpace: 'nowrap', width: 'fit-content' }}>QTY</th>
              <th className="w-24 p-3 border border-gray-500 text-left" style={{ whiteSpace: 'nowrap', width: 'fit-content' }}>SIZE</th>
              <th className="w-32 p-3 border border-gray-500 text-left" style={{ whiteSpace: 'nowrap', width: 'fit-content' }}>ORDER STATUS</th>
              
              {/* ADDITIONAL INFO Section Header */}
              <th colSpan="3" className="p-3 border border-gray-500 text-center" style={{ backgroundColor: '#A0704A', color: '#E5D5C5' }}>
                ADDITIONAL INFO.
              </th>
              
              <th className="w-20 p-3 border border-gray-500 text-center" style={{ whiteSpace: 'nowrap', width: 'fit-content' }}>LINK</th>
              
              {/* SHIPPING INFO Section Header */}
              <th colSpan="5" className="p-3 border border-gray-500 text-center" style={{ backgroundColor: '#6B5B8B', color: '#E5D5E5' }}>
                SHIPPING INFO.
              </th>
              
              <th className="w-48 p-3 border border-gray-500 text-left" style={{ whiteSpace: 'nowrap', width: 'fit-content' }}>NOTES</th>
              
              {/* INSTALLED Section Header */}
              <th colSpan="2" className="p-3 border border-gray-500 text-center" style={{ backgroundColor: '#8B4A4A', color: '#E5D5D5' }}>
                INSTALLED
              </th>
            </tr>
            
            {/* Sub Header Row */}
            <tr className="bg-gray-700 text-gray-300 text-xs font-semibold">
              <th className="p-2 border border-gray-500"></th>
              <th className="p-2 border border-gray-500"></th>
              <th className="p-2 border border-gray-500"></th>
              <th className="p-2 border border-gray-500"></th>
              <th className="p-2 border border-gray-500"></th>
              
              {/* Additional Info Sub Headers */}
              <th className="p-2 border border-gray-500 text-center" style={{ backgroundColor: '#A0704A', color: '#E5D5C5' }}>FINISH/Color</th>
              <th className="p-2 border border-gray-500 text-center" style={{ backgroundColor: '#A0704A', color: '#E5D5C5' }}>Cost/Price</th>
              <th className="p-2 border border-gray-500 text-center" style={{ backgroundColor: '#A0704A', color: '#E5D5C5' }}>Image</th>
              
              <th className="p-2 border border-gray-500"></th>
              
              {/* Shipping Info Sub Headers */}
              <th className="p-2 border border-gray-500 text-center" style={{ backgroundColor: '#6B5B8B', color: '#E5D5E5' }}>Order Status / Est. Ship Date / Est. Delivery Date</th>
              <th className="p-2 border border-gray-500 text-center" style={{ backgroundColor: '#6B5B8B', color: '#E5D5E5' }}>Install Date / Shipping TO</th>
              <th className="p-2 border border-gray-500 text-center" style={{ backgroundColor: '#6B5B8B', color: '#E5D5E5' }}>TRACKING #</th>
              <th className="p-2 border border-gray-500 text-center" style={{ backgroundColor: '#6B5B8B', color: '#E5D5E5' }}>Carrier</th>
              <th className="p-2 border border-gray-500 text-center" style={{ backgroundColor: '#6B5B8B', color: '#E5D5E5' }}>Order Date</th>
              
              <th className="p-2 border border-gray-500"></th>
              
              {/* Installed Sub Headers */}
              <th className="p-2 border border-gray-500 text-center" style={{ backgroundColor: '#8B4A4A', color: '#E5D5D5' }}>Status</th>
              <th className="p-2 border border-gray-500 text-center" style={{ backgroundColor: '#8B4A4A', color: '#E5D5D5' }}>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {project.rooms.map((room) => (
              <React.Fragment key={room.id}>
                {/* Room Header Row */}
                <tr>
                  <td 
                    colSpan="17" 
                    className="p-3 font-bold text-gray-200 text-lg border border-gray-500"
                    style={{ backgroundColor: getRoomColor(room.name), whiteSpace: 'nowrap', width: 'fit-content' }}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <span>{room.name.toUpperCase()}</span>
                      <div className="flex space-x-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedRoomId(room.id);
                            setShowAddCategory(true);
                          }}
                          className="bg-gray-900 bg-opacity-30 hover:bg-opacity-50 text-gray-200 px-2 py-1 rounded text-sm"
                          title="Add Category"
                        >
                          ➕ Category
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteRoom(room.id);
                          }}
                          className="bg-red-700 hover:bg-red-600 text-gray-200 px-2 py-1 rounded text-sm"
                          title="Delete Room"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  </td>
                </tr>

                {/* Categories and Items for this room */}
                {room.categories.map((category) => (
                  <React.Fragment key={category.id}>
                    {/* Category Header Row */}
                    <tr>
                      <td 
                        colSpan="17" 
                        className="p-2 font-semibold text-gray-200 text-md border border-gray-500"
                        style={{ backgroundColor: getCategoryColor(category.name), whiteSpace: 'nowrap', width: 'fit-content' }}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <span>{category.name.toUpperCase()}</span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedCategoryId(category.id);
                              setShowAddItem(true);
                            }}
                            className="bg-gray-900 bg-opacity-30 hover:bg-opacity-50 text-gray-200 px-2 py-1 rounded text-xs"
                            title="Add Item"
                          >
                            ➕ Item
                          </button>
                        </div>
                      </td>
                    </tr>

                    {/* Items for this category */}
                    {category.items.map((item, itemIndex) => (
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

                    {/* Empty state for category */}
                    {category.items.length === 0 && (
                      <tr>
                        <td colSpan="17" className="p-4 text-center text-gray-400 border border-gray-500" style={{ backgroundColor: '#2A2A2A' }}>
                          No items in this category. 
                          <button
                            onClick={() => {
                              setSelectedCategoryId(category.id);
                              setShowAddItem(true);
                            }}
                            className="ml-2 text-gray-300 hover:text-gray-200 underline"
                          >
                            Add first item
                          </button>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}

                {/* Empty state for room */}
                {room.categories.length === 0 && (
                  <tr>
                    <td colSpan="17" className="p-8 text-center text-gray-400 border border-gray-500" style={{ backgroundColor: '#2A2A2A' }}>
                      <p>No categories in this room.</p>
                      <button
                        onClick={() => {
                          setSelectedRoomId(room.id);
                          setShowAddCategory(true);
                        }}
                        className="mt-2 text-gray-300 hover:text-gray-200 underline"
                      >
                        Add first category
                      </button>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modals */}
      {showAddCategory && (
        <AddCategoryModal
          onClose={() => {
            setShowAddCategory(false);
            setSelectedRoomId(null);
          }}
          onSubmit={handleAddCategory}
          categoryColors={categoryColors}
          loading={loading}
        />
      )}

      {showAddItem && (
        <AddItemModal
          onClose={() => {
            setShowAddItem(false);
            setSelectedCategoryId(null);
          }}
          onSubmit={handleAddItem}
          itemStatuses={itemStatuses}
          loading={loading}
        />
      )}
    </div>
  );
};

// Individual Item Row Component - Exactly matching your spreadsheet
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
    remarks: item.remarks || '',
    cost: item.cost || 0,
    link: item.link || '',
    tracking_number: item.tracking_number || '',
    install_date: item.install_date ? item.install_date.split('T')[0] : '',
    order_date: item.order_date ? item.order_date.split('T')[0] : '',
    image_url: item.image_url || ''
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
      remarks: item.remarks || '',
      cost: item.cost || 0,
      link: item.link || '',
      tracking_number: item.tracking_number || '',
      install_date: item.install_date ? item.install_date.split('T')[0] : '',
      order_date: item.order_date ? item.order_date.split('T')[0] : '',
      image_url: item.image_url || ''
    });
    setIsEditing(false);
  };

  // Alternating row colors - much more muted
  const bgColor = itemIndex % 2 === 0 ? '#2A3A4A' : '#3A4A5A';

  return (
    <tr style={{ backgroundColor: bgColor }} className="text-gray-200 text-sm">
      {/* Item Name */}
      <td className="p-2 border border-gray-500" style={{ whiteSpace: 'nowrap', width: 'fit-content' }}>
        {isEditing ? (
          <input
            type="text"
            value={editData.name}
            onChange={(e) => setEditData({ ...editData, name: e.target.value })}
            className="w-full bg-gray-800 text-gray-200 px-2 py-1 rounded text-sm border border-gray-600"
          />
        ) : (
          <span className="font-medium">{item.name}</span>
        )}
      </td>

      {/* Vendor/SKU */}
      <td className="p-2 border border-gray-500" style={{ whiteSpace: 'nowrap', width: 'fit-content' }}>
        {isEditing ? (
          <input
            type="text"
            value={editData.vendor}
            onChange={(e) => setEditData({ ...editData, vendor: e.target.value })}
            className="w-full bg-gray-800 text-gray-200 px-2 py-1 rounded text-sm border border-gray-600"
          />
        ) : (
          <span>{item.vendor || '-'}</span>
        )}
      </td>

      {/* Quantity */}
      <td className="p-2 border border-gray-500 text-center" style={{ whiteSpace: 'nowrap', width: 'fit-content' }}>
        {isEditing ? (
          <input
            type="number"
            value={editData.quantity}
            onChange={(e) => setEditData({ ...editData, quantity: parseInt(e.target.value) || 1 })}
            className="w-full bg-gray-800 text-gray-200 px-2 py-1 rounded text-sm border border-gray-600"
            min="1"
          />
        ) : (
          <span>{item.quantity}</span>
        )}
      </td>

      {/* Size */}
      <td className="p-2 border border-gray-500" style={{ whiteSpace: 'nowrap', width: 'fit-content' }}>
        {isEditing ? (
          <input
            type="text"
            value={editData.size}
            onChange={(e) => setEditData({ ...editData, size: e.target.value })}
            className="w-full bg-gray-800 text-gray-200 px-2 py-1 rounded text-sm border border-gray-600"
          />
        ) : (
          <span>{item.size || '-'}</span>
        )}
      </td>

      {/* Order Status */}
      <td className="p-2 border border-gray-500" style={{ whiteSpace: 'nowrap', width: 'fit-content' }}>
        {isEditing ? (
          <select
            value={editData.status}
            onChange={(e) => setEditData({ ...editData, status: e.target.value })}
            className="w-full bg-gray-800 text-gray-200 px-2 py-1 rounded text-sm border border-gray-600"
          >
            {itemStatuses.map(status => (
              <option key={status} value={status}>
                {status.replace('_', ' ')}
              </option>
            ))}
          </select>
        ) : (
          <span 
            className="px-2 py-1 rounded text-xs font-medium"
            style={{ 
              backgroundColor: getStatusColor(item.status),
              color: '#2A2A2A'
            }}
          >
            {item.status.replace('_', ' ')}
          </span>
        )}
      </td>

      {/* Finish/Color */}
      <td className="p-2 border border-gray-500" style={{ whiteSpace: 'nowrap', width: 'fit-content' }}>
        <span>-</span>
      </td>

      {/* Cost/Price */}
      <td className="p-2 border border-gray-500 text-right" style={{ whiteSpace: 'nowrap', width: 'fit-content' }}>
        {isEditing ? (
          <input
            type="number"
            value={editData.cost}
            onChange={(e) => setEditData({ ...editData, cost: parseFloat(e.target.value) || 0 })}
            className="w-full bg-gray-800 text-gray-200 px-2 py-1 rounded text-sm border border-gray-600"
            step="0.01"
          />
        ) : (
          <span>${item.cost ? item.cost.toFixed(2) : '0.00'}</span>
        )}
      </td>

      {/* Image */}
      <td className="p-2 border border-gray-500 text-center" style={{ whiteSpace: 'nowrap', width: 'fit-content' }}>
        {item.image_url ? (
          <img 
            src={item.image_url} 
            alt={item.name}
            className="w-12 h-12 object-cover rounded mx-auto border border-gray-600"
          />
        ) : (
          <div className="w-12 h-12 bg-gray-700 rounded flex items-center justify-center text-xs mx-auto border border-gray-600">
            📷
          </div>
        )}
      </td>

      {/* Link */}
      <td className="p-2 border border-gray-500 text-center" style={{ whiteSpace: 'nowrap', width: 'fit-content' }}>
        {isEditing ? (
          <input
            type="url"
            value={editData.link}
            onChange={(e) => setEditData({ ...editData, link: e.target.value })}
            className="w-full bg-gray-800 text-gray-200 px-2 py-1 rounded text-sm border border-gray-600"
          />
        ) : (
          item.link ? (
            <a 
              href={item.link} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-gray-300"
            >
              🔗
            </a>
          ) : (
            <span>-</span>
          )
        )}
      </td>

      {/* Order Status / Ship / Delivery */}
      <td className="p-2 border border-gray-500 text-center" style={{ whiteSpace: 'nowrap', width: 'fit-content' }}>
        <span 
          className="px-2 py-1 rounded text-xs font-medium"
          style={{ 
            backgroundColor: getStatusColor(item.status),
            color: '#2A2A2A'
          }}
        >
          {item.status.replace('_', ' ')}
        </span>
      </td>

      {/* Install Date / Shipping TO */}
      <td className="p-2 border border-gray-500 text-center" style={{ whiteSpace: 'nowrap', width: 'fit-content' }}>
        {isEditing ? (
          <input
            type="date"
            value={editData.install_date}
            onChange={(e) => setEditData({ ...editData, install_date: e.target.value })}
            className="w-full bg-gray-800 text-gray-200 px-2 py-1 rounded text-sm border border-gray-600"
          />
        ) : (
          <span>{item.install_date ? new Date(item.install_date).toLocaleDateString() : '-'}</span>
        )}
      </td>

      {/* Tracking # */}
      <td className="p-2 border border-gray-500" style={{ whiteSpace: 'nowrap', width: 'fit-content' }}>
        {isEditing ? (
          <input
            type="text"
            value={editData.tracking_number}
            onChange={(e) => setEditData({ ...editData, tracking_number: e.target.value })}
            className="w-full bg-gray-800 text-gray-200 px-2 py-1 rounded text-sm border border-gray-600"
          />
        ) : (
          <span>{item.tracking_number || 'Add Tracking #'}</span>
        )}
      </td>

      {/* Carrier */}
      <td className="p-2 border border-gray-500" style={{ whiteSpace: 'nowrap', width: 'fit-content' }}>
        <span>-</span>
      </td>

      {/* Order Date */}
      <td className="p-2 border border-gray-500 text-center" style={{ whiteSpace: 'nowrap', width: 'fit-content' }}>
        {isEditing ? (
          <input
            type="date"
            value={editData.order_date}
            onChange={(e) => setEditData({ ...editData, order_date: e.target.value })}
            className="w-full bg-gray-800 text-gray-200 px-2 py-1 rounded text-sm border border-gray-600"
          />
        ) : (
          <span>{item.order_date ? new Date(item.order_date).toLocaleDateString() : '-'}</span>
        )}
      </td>

      {/* Notes */}
      <td className="p-2 border border-gray-500" style={{ whiteSpace: 'nowrap', width: 'fit-content' }}>
        {isEditing ? (
          <input
            type="text"
            value={editData.remarks}
            onChange={(e) => setEditData({ ...editData, remarks: e.target.value })}
            className="w-full bg-gray-800 text-gray-200 px-2 py-1 rounded text-sm border border-gray-600"
          />
        ) : (
          <span className="truncate" title={item.remarks}>
            {item.remarks || '-'}
          </span>
        )}
      </td>

      {/* Install Status */}
      <td className="p-2 border border-gray-500 text-center" style={{ whiteSpace: 'nowrap', width: 'fit-content' }}>
        <span>-</span>
      </td>

      {/* Actions */}
      <td className="p-2 border border-gray-500 text-center" style={{ whiteSpace: 'nowrap', width: 'fit-content' }}>
        <div className="flex justify-center space-x-1">
          {isEditing ? (
            <>
              <button
                onClick={handleSave}
                className="bg-green-700 hover:bg-green-600 text-gray-200 px-2 py-1 rounded text-xs"
                disabled={isOffline}
              >
                ✓
              </button>
              <button
                onClick={handleCancel}
                className="bg-gray-600 hover:bg-gray-500 text-gray-200 px-2 py-1 rounded text-xs"
              >
                ✕
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setIsEditing(true)}
                className="bg-gray-600 hover:bg-gray-500 text-gray-200 px-2 py-1 rounded text-xs"
                title="Edit Item"
              >
                ✏️
              </button>
              <button
                onClick={() => onDelete(item.id)}
                className="bg-red-700 hover:bg-red-600 text-gray-200 px-2 py-1 rounded text-xs"
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
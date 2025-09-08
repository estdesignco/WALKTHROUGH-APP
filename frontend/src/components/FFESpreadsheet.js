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

  const getRoomColor = (roomName) => {
    return roomColors[roomName.toLowerCase()] || '#B22222';
  };

  const getCategoryColor = (categoryName) => {
    return categoryColors[categoryName.toLowerCase()] || '#104131';
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
    const colors = {
      'PICKED': '#FFD966',
      'ORDERED': '#3B82F6', 
      'SHIPPED': '#F97316',
      'DELIVERED': '#10B981',
      'INSTALLED': '#22C55E',
      'PARTIALLY_DELIVERED': '#8B5CF6',
      'ON_HOLD': '#EF4444',
      'CANCELLED': '#6B7280'
    };
    return colors[status] || '#6B7280';
  };

  if (project.rooms.length === 0) {
    return (
      <div className="bg-gray-800 rounded-xl p-12 text-center">
        <div className="text-6xl mb-4">🏠</div>
        <h3 className="text-xl font-semibold text-white mb-2">No Rooms Added</h3>
        <p className="text-gray-400 mb-6">Start by adding rooms to organize your FF&E items</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg overflow-hidden shadow-lg">
      {/* Fixed Table Headers - Exactly like your spreadsheet */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[2000px]" style={{ tableLayout: 'fixed' }}>
          <thead>
            <tr className="bg-gray-200 text-black text-sm font-bold">
              <th className="w-48 p-2 border border-gray-300 text-left">ITEM</th>
              <th className="w-32 p-2 border border-gray-300 text-left">VENDOR/SKU</th>
              <th className="w-16 p-2 border border-gray-300 text-center">QTY</th>
              <th className="w-24 p-2 border border-gray-300 text-left">SIZE</th>
              <th className="w-32 p-2 border border-gray-300 text-left">ORDER STATUS</th>
              <th className="w-24 p-2 border border-gray-300 text-left">FINISH/COLOR</th>
              <th className="w-24 p-2 border border-gray-300 text-right">COST/PRICE</th>
              <th className="w-20 p-2 border border-gray-300 text-center">IMAGE</th>
              <th className="w-20 p-2 border border-gray-300 text-center">LINK</th>
              <th className="w-28 p-2 border border-gray-300 text-center">ORDER STATUS</th>
              <th className="w-28 p-2 border border-gray-300 text-center">INSTALL STATUS</th>
              <th className="w-28 p-2 border border-gray-300 text-center">INSTALL DATE</th>
              <th className="w-32 p-2 border border-gray-300 text-left">TRACKING #</th>
              <th className="w-24 p-2 border border-gray-300 text-left">CARRIER</th>
              <th className="w-28 p-2 border border-gray-300 text-center">ORDER DATE</th>
              <th className="w-48 p-2 border border-gray-300 text-left">NOTES</th>
              <th className="w-24 p-2 border border-gray-300 text-center">ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {project.rooms.map((room) => (
              <React.Fragment key={room.id}>
                {/* Room Header Row - Exactly like your spreadsheet */}
                <tr>
                  <td 
                    colSpan="17" 
                    className="p-3 font-bold text-black text-lg border border-gray-300"
                    style={{ backgroundColor: getRoomColor(room.name) }}
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
                          className="bg-black bg-opacity-20 hover:bg-opacity-30 text-black px-2 py-1 rounded text-sm"
                          title="Add Category"
                        >
                          ➕ Category
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteRoom(room.id);
                          }}
                          className="bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded text-sm"
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
                        className="p-2 font-semibold text-white text-md border border-gray-300"
                        style={{ backgroundColor: getCategoryColor(category.name) }}
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
                            className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white px-2 py-1 rounded text-xs"
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
                        <td colSpan="17" className="p-4 text-center text-gray-500 border border-gray-300">
                          No items in this category. 
                          <button
                            onClick={() => {
                              setSelectedCategoryId(category.id);
                              setShowAddItem(true);
                            }}
                            className="ml-2 text-blue-600 hover:text-blue-800 underline"
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
                    <td colSpan="17" className="p-8 text-center text-gray-500 border border-gray-300">
                      <p>No categories in this room.</p>
                      <button
                        onClick={() => {
                          setSelectedRoomId(room.id);
                          setShowAddCategory(true);
                        }}
                        className="mt-2 text-blue-600 hover:text-blue-800 underline"
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

  // Alternating row colors exactly like your spreadsheet
  const bgColor = itemIndex % 2 === 0 ? '#1A2B3A' : '#263D54';

  return (
    <tr style={{ backgroundColor: bgColor }} className="text-yellow-100 text-sm">
      {/* Item Name */}
      <td className="p-2 border border-gray-300">
        {isEditing ? (
          <input
            type="text"
            value={editData.name}
            onChange={(e) => setEditData({ ...editData, name: e.target.value })}
            className="w-full bg-gray-800 text-white px-2 py-1 rounded text-sm"
          />
        ) : (
          <span className="font-medium">{item.name}</span>
        )}
      </td>

      {/* Vendor/SKU */}
      <td className="p-2 border border-gray-300">
        {isEditing ? (
          <input
            type="text"
            value={editData.vendor}
            onChange={(e) => setEditData({ ...editData, vendor: e.target.value })}
            className="w-full bg-gray-800 text-white px-2 py-1 rounded text-sm"
          />
        ) : (
          <span>{item.vendor || '-'}</span>
        )}
      </td>

      {/* Quantity */}
      <td className="p-2 border border-gray-300 text-center">
        {isEditing ? (
          <input
            type="number"
            value={editData.quantity}
            onChange={(e) => setEditData({ ...editData, quantity: parseInt(e.target.value) || 1 })}
            className="w-full bg-gray-800 text-white px-2 py-1 rounded text-sm"
            min="1"
          />
        ) : (
          <span>{item.quantity}</span>
        )}
      </td>

      {/* Size */}
      <td className="p-2 border border-gray-300">
        {isEditing ? (
          <input
            type="text"
            value={editData.size}
            onChange={(e) => setEditData({ ...editData, size: e.target.value })}
            className="w-full bg-gray-800 text-white px-2 py-1 rounded text-sm"
          />
        ) : (
          <span>{item.size || '-'}</span>
        )}
      </td>

      {/* Order Status */}
      <td className="p-2 border border-gray-300">
        {isEditing ? (
          <select
            value={editData.status}
            onChange={(e) => setEditData({ ...editData, status: e.target.value })}
            className="w-full bg-gray-800 text-white px-2 py-1 rounded text-sm"
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
              backgroundColor: getStatusColor(item.status) + '20',
              color: getStatusColor(item.status)
            }}
          >
            {item.status.replace('_', ' ')}
          </span>
        )}
      </td>

      {/* Finish/Color */}
      <td className="p-2 border border-gray-300">
        <span>-</span>
      </td>

      {/* Cost/Price */}
      <td className="p-2 border border-gray-300 text-right">
        {isEditing ? (
          <input
            type="number"
            value={editData.cost}
            onChange={(e) => setEditData({ ...editData, cost: parseFloat(e.target.value) || 0 })}
            className="w-full bg-gray-800 text-white px-2 py-1 rounded text-sm"
            step="0.01"
          />
        ) : (
          <span>${item.cost ? item.cost.toFixed(2) : '0.00'}</span>
        )}
      </td>

      {/* Image */}
      <td className="p-2 border border-gray-300 text-center">
        {item.image_url ? (
          <img 
            src={item.image_url} 
            alt={item.name}
            className="w-12 h-12 object-cover rounded mx-auto"
          />
        ) : (
          <div className="w-12 h-12 bg-gray-600 rounded flex items-center justify-center text-xs mx-auto">
            📷
          </div>
        )}
      </td>

      {/* Link */}
      <td className="p-2 border border-gray-300 text-center">
        {isEditing ? (
          <input
            type="url"
            value={editData.link}
            onChange={(e) => setEditData({ ...editData, link: e.target.value })}
            className="w-full bg-gray-800 text-white px-2 py-1 rounded text-sm"
          />
        ) : (
          item.link ? (
            <a 
              href={item.link} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300"
            >
              🔗
            </a>
          ) : (
            <span>-</span>
          )
        )}
      </td>

      {/* Order Status (duplicate column as per your layout) */}
      <td className="p-2 border border-gray-300 text-center">
        <span 
          className="px-2 py-1 rounded text-xs font-medium"
          style={{ 
            backgroundColor: getStatusColor(item.status) + '20',
            color: getStatusColor(item.status)
          }}
        >
          {item.status.replace('_', ' ')}
        </span>
      </td>

      {/* Install Status */}
      <td className="p-2 border border-gray-300 text-center">
        <span>-</span>
      </td>

      {/* Install Date */}
      <td className="p-2 border border-gray-300 text-center">
        {isEditing ? (
          <input
            type="date"
            value={editData.install_date}
            onChange={(e) => setEditData({ ...editData, install_date: e.target.value })}
            className="w-full bg-gray-800 text-white px-2 py-1 rounded text-sm"
          />
        ) : (
          <span>{item.install_date ? new Date(item.install_date).toLocaleDateString() : '-'}</span>
        )}
      </td>

      {/* Tracking # */}
      <td className="p-2 border border-gray-300">
        {isEditing ? (
          <input
            type="text"
            value={editData.tracking_number}
            onChange={(e) => setEditData({ ...editData, tracking_number: e.target.value })}
            className="w-full bg-gray-800 text-white px-2 py-1 rounded text-sm"
          />
        ) : (
          <span>{item.tracking_number || '-'}</span>
        )}
      </td>

      {/* Carrier */}
      <td className="p-2 border border-gray-300">
        <span>-</span>
      </td>

      {/* Order Date */}
      <td className="p-2 border border-gray-300 text-center">
        {isEditing ? (
          <input
            type="date"
            value={editData.order_date}
            onChange={(e) => setEditData({ ...editData, order_date: e.target.value })}
            className="w-full bg-gray-800 text-white px-2 py-1 rounded text-sm"
          />
        ) : (
          <span>{item.order_date ? new Date(item.order_date).toLocaleDateString() : '-'}</span>
        )}
      </td>

      {/* Notes */}
      <td className="p-2 border border-gray-300">
        {isEditing ? (
          <input
            type="text"
            value={editData.remarks}
            onChange={(e) => setEditData({ ...editData, remarks: e.target.value })}
            className="w-full bg-gray-800 text-white px-2 py-1 rounded text-sm"
          />
        ) : (
          <span className="truncate" title={item.remarks}>
            {item.remarks || '-'}
          </span>
        )}
      </td>

      {/* Actions */}
      <td className="p-2 border border-gray-300 text-center">
        <div className="flex justify-center space-x-1">
          {isEditing ? (
            <>
              <button
                onClick={handleSave}
                className="bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded text-xs"
                disabled={isOffline}
              >
                ✓
              </button>
              <button
                onClick={handleCancel}
                className="bg-gray-600 hover:bg-gray-700 text-white px-2 py-1 rounded text-xs"
              >
                ✕
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setIsEditing(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded text-xs"
                title="Edit Item"
              >
                ✏️
              </button>
              <button
                onClick={() => onDelete(item.id)}
                className="bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded text-xs"
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
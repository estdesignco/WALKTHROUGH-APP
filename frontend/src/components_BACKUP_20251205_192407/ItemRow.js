import React, { useState } from 'react';

const ItemRow = ({ item, itemStatuses, onUpdate, onDelete, isEven, isOffline }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    name: item.name,
    quantity: item.quantity,
    size: item.size || '',
    status: item.status,
    vendor: item.vendor || '',
    remarks: item.remarks || '',
    cost: item.cost || 0,
    link: item.link || '',
    tracking_number: item.tracking_number || ''
  });

  const getStatusColor = (status) => {
    const colors = {
      'PICKED': '#FFD966',     // Yellow
      'ORDERED': '#3B82F6',    // Blue  
      'SHIPPED': '#F97316',    // Orange
      'DELIVERED': '#10B981',  // Green
      'INSTALLED': '#22C55E',  // Bright Green
      'PARTIALLY_DELIVERED': '#8B5CF6', // Purple
      'ON_HOLD': '#EF4444',    // Red
      'CANCELLED': '#6B7280'   // Gray
    };
    return colors[status] || '#6B7280';
  };

  const getStatusIcon = (status) => {
    const icons = {
      'PICKED': '🟡',
      'ORDERED': '🔵', 
      'SHIPPED': '🟠',
      'DELIVERED': '🟢',
      'INSTALLED': '✅',
      'PARTIALLY_DELIVERED': '🟣',
      'ON_HOLD': '🔴',
      'CANCELLED': '⚫'
    };
    return icons[status] || '⚪';
  };

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
      quantity: item.quantity,
      size: item.size || '',
      status: item.status,
      vendor: item.vendor || '',
      remarks: item.remarks || '',
      cost: item.cost || 0,
      link: item.link || '',
      tracking_number: item.tracking_number || ''
    });
    setIsEditing(false);
  };

  const bgColor = isEven ? '#1A2B3A' : '#263D54';

  return (
    <div 
      className="grid grid-cols-12 gap-4 px-4 py-3 rounded text-sm items-center"
      style={{ backgroundColor: bgColor }}
    >
      {/* Item Name */}
      <div className="col-span-3">
        {isEditing ? (
          <input
            type="text"
            value={editData.name}
            onChange={(e) => setEditData({ ...editData, name: e.target.value })}
            className="w-full bg-gray-800 text-white px-2 py-1 rounded border border-gray-600 focus:border-blue-500 focus:outline-none text-sm"
          />
        ) : (
          <span className="text-yellow-100 font-medium">{item.name}</span>
        )}
      </div>

      {/* Quantity */}
      <div className="col-span-1">
        {isEditing ? (
          <input
            type="number"
            value={editData.quantity}
            onChange={(e) => setEditData({ ...editData, quantity: parseInt(e.target.value) || 1 })}
            className="w-full bg-gray-800 text-white px-2 py-1 rounded border border-gray-600 focus:border-blue-500 focus:outline-none text-sm"
            min="1"
          />
        ) : (
          <span className="text-yellow-100">{item.quantity}</span>
        )}
      </div>

      {/* Size */}
      <div className="col-span-1">
        {isEditing ? (
          <input
            type="text"
            value={editData.size}
            onChange={(e) => setEditData({ ...editData, size: e.target.value })}
            className="w-full bg-gray-800 text-white px-2 py-1 rounded border border-gray-600 focus:border-blue-500 focus:outline-none text-sm"
          />
        ) : (
          <span className="text-yellow-100">{item.size || '-'}</span>
        )}
      </div>

      {/* Status */}
      <div className="col-span-2">
        {isEditing ? (
          <select
            value={editData.status}
            onChange={(e) => setEditData({ ...editData, status: e.target.value })}
            className="w-full bg-gray-800 text-white px-2 py-1 rounded border border-gray-600 focus:border-blue-500 focus:outline-none text-sm"
          >
            {itemStatuses.map(status => (
              <option key={status} value={status}>
                {status.replace('_', ' ')}
              </option>
            ))}
          </select>
        ) : (
          <div className="flex items-center space-x-2">
            <span style={{ color: getStatusColor(item.status) }}>
              {getStatusIcon(item.status)}
            </span>
            <span 
              className="px-2 py-1 rounded text-xs font-medium"
              style={{ 
                backgroundColor: getStatusColor(item.status) + '20',
                color: getStatusColor(item.status)
              }}
            >
              {item.status.replace('_', ' ')}
            </span>
          </div>
        )}
      </div>

      {/* Vendor */}
      <div className="col-span-2">
        {isEditing ? (
          <input
            type="text"
            value={editData.vendor}
            onChange={(e) => setEditData({ ...editData, vendor: e.target.value })}
            className="w-full bg-gray-800 text-white px-2 py-1 rounded border border-gray-600 focus:border-blue-500 focus:outline-none text-sm"
          />
        ) : (
          <span className="text-yellow-100">{item.vendor || '-'}</span>
        )}
      </div>

      {/* Remarks */}
      <div className="col-span-2">
        {isEditing ? (
          <input
            type="text"
            value={editData.remarks}
            onChange={(e) => setEditData({ ...editData, remarks: e.target.value })}
            className="w-full bg-gray-800 text-white px-2 py-1 rounded border border-gray-600 focus:border-blue-500 focus:outline-none text-sm"
          />
        ) : (
          <span className="text-yellow-100 truncate" title={item.remarks}>
            {item.remarks || '-'}
          </span>
        )}
      </div>

      {/* Actions */}
      <div className="col-span-1">
        <div className="flex items-center space-x-1">
          {isEditing ? (
            <>
              <button
                onClick={handleSave}
                className="bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded text-xs transition-colors"
                disabled={isOffline}
              >
                ✓
              </button>
              <button
                onClick={handleCancel}
                className="bg-gray-600 hover:bg-gray-700 text-white px-2 py-1 rounded text-xs transition-colors"
              >
                ✕
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setIsEditing(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded text-xs transition-colors"
                title="Edit Item"
              >
                ✏️
              </button>
              <button
                onClick={() => onDelete(item.id)}
                className="bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded text-xs transition-colors"
                title="Delete Item"
                disabled={isOffline}
              >
                🗑️
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ItemRow;
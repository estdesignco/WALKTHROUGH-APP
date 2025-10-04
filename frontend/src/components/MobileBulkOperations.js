import React, { useState } from 'react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL + '/api';

export default function MobileBulkOperations({ 
  items, 
  onComplete, 
  onClose 
}) {
  const [operation, setOperation] = useState('');
  const [selectedItems, setSelectedItems] = useState([]);
  const [processing, setProcessing] = useState(false);
  
  // Bulk operations
  const [bulkStatus, setBulkStatus] = useState('');
  const [bulkVendor, setBulkVendor] = useState('');

  const toggleItemSelection = (itemId) => {
    if (selectedItems.includes(itemId)) {
      setSelectedItems(selectedItems.filter(id => id !== itemId));
    } else {
      setSelectedItems([...selectedItems, itemId]);
    }
  };

  const selectAll = () => {
    setSelectedItems(items.map(item => item.id));
  };

  const deselectAll = () => {
    setSelectedItems([]);
  };

  const handleBulkUpdate = async () => {
    if (selectedItems.length === 0) {
      alert('Please select at least one item');
      return;
    }

    if (!operation) {
      alert('Please select an operation');
      return;
    }

    try {
      setProcessing(true);

      const updates = {};
      if (operation === 'status' && bulkStatus) {
        updates.status = bulkStatus;
      } else if (operation === 'vendor' && bulkVendor) {
        updates.vendor = bulkVendor;
      } else if (operation === 'check') {
        updates.checked = true;
      } else if (operation === 'uncheck') {
        updates.checked = false;
      }

      // Update all selected items
      for (const itemId of selectedItems) {
        await axios.put(`${API_URL}/items/${itemId}`, updates);
      }

      alert(`✅ Updated ${selectedItems.length} items successfully!`);
      onComplete();
      onClose();
    } catch (error) {
      console.error('Bulk update failed:', error);
      alert('Failed to update items');
    } finally {
      setProcessing(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedItems.length === 0) {
      alert('Please select at least one item');
      return;
    }

    if (!window.confirm(`Delete ${selectedItems.length} items? This cannot be undone.`)) {
      return;
    }

    try {
      setProcessing(true);

      // Delete all selected items
      for (const itemId of selectedItems) {
        await axios.delete(`${API_URL}/items/${itemId}`);
      }

      alert(`✅ Deleted ${selectedItems.length} items successfully!`);
      onComplete();
      onClose();
    } catch (error) {
      console.error('Bulk delete failed:', error);
      alert('Failed to delete items');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-95 z-50 flex flex-col">
      {/* Header */}
      <div className="bg-gray-900 p-4 flex justify-between items-center border-b border-gray-700">
        <h3 className="text-white font-bold text-lg">⚡ Bulk Operations</h3>
        <button
          onClick={onClose}
          className="text-white text-2xl hover:text-red-400"
        >
          ✕
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* Selection Controls */}
        <div className="bg-gray-800 p-4 rounded-lg mb-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-white font-bold">
              {selectedItems.length} of {items.length} selected
            </span>
            <div className="flex gap-2">
              <button
                onClick={selectAll}
                className="text-blue-400 hover:text-blue-300 text-sm"
              >
                Select All
              </button>
              <span className="text-gray-600">|</span>
              <button
                onClick={deselectAll}
                className="text-blue-400 hover:text-blue-300 text-sm"
              >
                Clear
              </button>
            </div>
          </div>
        </div>

        {/* Items List */}
        <div className="bg-gray-800 rounded-lg p-4 mb-4 max-h-64 overflow-y-auto">
          {items.map((item) => (
            <div
              key={item.id}
              onClick={() => toggleItemSelection(item.id)}
              className={`flex items-center gap-3 p-3 rounded mb-2 cursor-pointer ${
                selectedItems.includes(item.id)
                  ? 'bg-blue-600'
                  : 'bg-gray-700 hover:bg-gray-600'
              }`}
            >
              <input
                type="checkbox"
                checked={selectedItems.includes(item.id)}
                onChange={() => {}}
                className="w-5 h-5"
              />
              <div className="flex-1">
                <div className="text-white font-bold">{item.name}</div>
                {item.vendor && (
                  <div className="text-gray-400 text-xs">{item.vendor}</div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Operation Selection */}
        <div className="bg-gray-800 p-4 rounded-lg mb-4">
          <label className="text-white font-bold mb-2 block">
            Select Operation
          </label>
          <select
            value={operation}
            onChange={(e) => setOperation(e.target.value)}
            className="w-full bg-gray-700 text-white px-4 py-3 rounded mb-3"
          >
            <option value="">Choose operation...</option>
            <option value="check">✓ Check All Selected</option>
            <option value="uncheck">☐ Uncheck All Selected</option>
            <option value="status">📊 Update Status</option>
            <option value="vendor">🏢 Update Vendor</option>
          </select>

          {/* Status Selection */}
          {operation === 'status' && (
            <div className="mt-3">
              <label className="text-white text-sm mb-2 block">New Status</label>
              <select
                value={bulkStatus}
                onChange={(e) => setBulkStatus(e.target.value)}
                className="w-full bg-gray-700 text-white px-4 py-2 rounded"
              >
                <option value="">Select status...</option>
                <option value="Ordered">Ordered</option>
                <option value="In Transit">In Transit</option>
                <option value="Delivered">Delivered</option>
                <option value="Installed">Installed</option>
                <option value="On Hold">On Hold</option>
              </select>
            </div>
          )}

          {/* Vendor Input */}
          {operation === 'vendor' && (
            <div className="mt-3">
              <label className="text-white text-sm mb-2 block">Vendor Name</label>
              <input
                type="text"
                value={bulkVendor}
                onChange={(e) => setBulkVendor(e.target.value)}
                placeholder="e.g., West Elm"
                className="w-full bg-gray-700 text-white px-4 py-2 rounded"
              />
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="space-y-2">
          <button
            onClick={handleBulkUpdate}
            disabled={processing || !operation || selectedItems.length === 0}
            className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white px-4 py-3 rounded-lg font-bold"
          >
            {processing ? '⏳ Processing...' : '✅ Apply to Selected Items'}
          </button>

          <button
            onClick={handleBulkDelete}
            disabled={processing || selectedItems.length === 0}
            className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white px-4 py-3 rounded-lg font-bold"
          >
            🗑️ Delete Selected Items
          </button>

          <button
            onClick={onClose}
            className="w-full bg-gray-600 hover:bg-gray-700 text-white px-4 py-3 rounded-lg font-bold"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
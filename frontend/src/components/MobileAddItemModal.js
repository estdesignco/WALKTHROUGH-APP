import React, { useState } from 'react';
import axios from 'axios';

const API_URL = (window.ENV?.REACT_APP_BACKEND_URL || window.location.origin) + '/api';

export default function MobileAddItemModal({ 
  onClose, 
  projectId, 
  rooms, 
  selectedSubCategoryId,
  onItemAdded 
}) {
  const [selectedRoom, setSelectedRoom] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [itemName, setItemName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [size, setSize] = useState('');
  const [vendor, setVendor] = useState('');
  const [sku, setSku] = useState('');
  const [loading, setLoading] = useState(false);

  const selectedRoomData = rooms.find(r => r.id === selectedRoom);
  const categories = selectedRoomData?.categories || [];

  const handleSubmit = async () => {
    if (!itemName.trim()) {
      alert('Please enter item name');
      return;
    }

    try {
      setLoading(true);
      
      // Use the passed selectedSubCategoryId if available, otherwise find from selection
      let subcategoryId = selectedSubCategoryId;
      
      if (!subcategoryId) {
        if (!selectedRoom || !selectedCategory) {
          alert('Please select room and category');
          return;
        }
        
        const category = categories.find(c => c.id === selectedCategory);
        subcategoryId = category?.subcategories?.[0]?.id;
        
        if (!subcategoryId) {
          alert('No subcategory found');
          return;
        }
      }

      const newItem = {
        name: itemName.trim(),
        quantity: parseInt(quantity) || 1,
        size: size || "",
        vendor: vendor || "",
        sku: sku || "",
        subcategory_id: subcategoryId,
        finish_color: "",
        status: "",
        cost: 0,
        remarks: "",
        link: "",
        image_url: ""
      };

      console.log('Adding item:', newItem);
      const response = await axios.post(`${API_URL}/items`, newItem);
      
      console.log('✅ Item created:', response.data);
      alert('✅ Item added successfully!');
      onItemAdded();
      onClose();
    } catch (error) {
      console.error('Failed to add item:', error);
      const errorMsg = error.response?.data?.detail 
        ? (Array.isArray(error.response.data.detail) 
            ? error.response.data.detail.map(e => `${e.loc?.join('.')}: ${e.msg}`).join('\n')
            : JSON.stringify(error.response.data.detail))
        : error.message;
      alert('Failed to add item:\n' + errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
        <h3 className="text-xl font-bold text-white mb-4">➕ Add New Item</h3>
        
        {/* Room Selection */}
        <div className="mb-4">
          <label className="text-white text-sm font-bold mb-2 block">Room *</label>
          <select
            value={selectedRoom}
            onChange={(e) => {
              setSelectedRoom(e.target.value);
              setSelectedCategory('');
            }}
            className="w-full bg-gray-700 text-white px-4 py-2 rounded"
          >
            <option value="">Select Room</option>
            {rooms.map(room => (
              <option key={room.id} value={room.id}>{room.name}</option>
            ))}
          </select>
        </div>

        {/* Category Selection */}
        {selectedRoom && (
          <div className="mb-4">
            <label className="text-white text-sm font-bold mb-2 block">Category *</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full bg-gray-700 text-white px-4 py-2 rounded"
            >
              <option value="">Select Category</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>
        )}

        {/* Item Name */}
        <div className="mb-4">
          <label className="text-white text-sm font-bold mb-2 block">Item Name *</label>
          <input
            type="text"
            value={itemName}
            onChange={(e) => setItemName(e.target.value)}
            placeholder="e.g., Pendant Light"
            className="w-full bg-gray-700 text-white px-4 py-2 rounded"
          />
        </div>

        {/* Quantity */}
        <div className="mb-4">
          <label className="text-white text-sm font-bold mb-2 block">Quantity</label>
          <input
            type="number"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            className="w-full bg-gray-700 text-white px-4 py-2 rounded"
            min="1"
          />
        </div>

        {/* Size */}
        <div className="mb-4">
          <label className="text-white text-sm font-bold mb-2 block">Size</label>
          <input
            type="text"
            value={size}
            onChange={(e) => setSize(e.target.value)}
            placeholder="e.g., 24'' x 36''"
            className="w-full bg-gray-700 text-white px-4 py-2 rounded"
          />
        </div>

        {/* Vendor */}
        <div className="mb-4">
          <label className="text-white text-sm font-bold mb-2 block">Vendor</label>
          <input
            type="text"
            value={vendor}
            onChange={(e) => setVendor(e.target.value)}
            placeholder="e.g., Visual Comfort"
            className="w-full bg-gray-700 text-white px-4 py-2 rounded"
          />
        </div>

        {/* SKU */}
        <div className="mb-4">
          <label className="text-white text-sm font-bold mb-2 block">SKU</label>
          <input
            type="text"
            value={sku}
            onChange={(e) => setSku(e.target.value)}
            placeholder="e.g., VC-12345"
            className="w-full bg-gray-700 text-white px-4 py-2 rounded"
          />
        </div>

        {/* Buttons */}
        <div className="flex gap-2 mt-6">
          <button
            onClick={handleSubmit}
            disabled={loading || !itemName || !selectedRoom || !selectedCategory}
            className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-4 py-2 rounded font-bold"
          >
            {loading ? 'Adding...' : '✅ Add Item'}
          </button>
          <button
            onClick={onClose}
            className="flex-1 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded font-bold"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
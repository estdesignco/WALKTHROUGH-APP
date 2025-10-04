import React, { useState } from 'react';
import axios from 'axios';
import { getTemplatesByRoom, ITEM_TEMPLATES } from '../utils/itemTemplates';

const API_URL = process.env.REACT_APP_BACKEND_URL + '/api';

export default function MobileQuickAddTemplates({ 
  onClose, 
  projectId, 
  rooms, 
  onComplete 
}) {
  const [selectedRoom, setSelectedRoom] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedTemplates, setSelectedTemplates] = useState([]);
  const [adding, setAdding] = useState(false);
  const [templateCategory, setTemplateCategory] = useState('ALL');

  const selectedRoomData = rooms.find(r => r.id === selectedRoom);
  const categories = selectedRoomData?.categories || [];
  
  // Get suggested templates based on room
  const suggestedTemplates = selectedRoom && selectedRoomData 
    ? getTemplatesByRoom(selectedRoomData.name) 
    : [];
  
  // Get all templates by category
  const displayTemplates = templateCategory === 'ALL' 
    ? suggestedTemplates.length > 0 ? suggestedTemplates : Object.values(ITEM_TEMPLATES).flat()
    : ITEM_TEMPLATES[templateCategory] || [];

  const toggleTemplate = (template) => {
    const exists = selectedTemplates.find(t => t.name === template.name);
    if (exists) {
      setSelectedTemplates(selectedTemplates.filter(t => t.name !== template.name));
    } else {
      setSelectedTemplates([...selectedTemplates, template]);
    }
  };

  const handleQuickAdd = async () => {
    if (!selectedRoom || !selectedCategory || selectedTemplates.length === 0) {
      alert('Please select room, category, and at least one item');
      return;
    }

    try {
      setAdding(true);

      // Find subcategory
      const category = categories.find(c => c.id === selectedCategory);
      const subcategoryId = category?.subcategories?.[0]?.id;

      if (!subcategoryId) {
        alert('No subcategory found');
        return;
      }

      // Add all selected templates
      for (const template of selectedTemplates) {
        await axios.post(`${API_URL}/items`, {
          name: template.name,
          quantity: template.quantity || 1,
          size: template.size || '',
          vendor: template.vendor || '',
          subcategory_id: subcategoryId,
          order_index: 0
        });
      }

      alert(`✅ Added ${selectedTemplates.length} items successfully!`);
      onComplete();
      onClose();
    } catch (error) {
      console.error('Failed to add templates:', error);
      alert('Failed to add items');
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-95 z-50 flex flex-col">
      {/* Header */}
      <div className="bg-gray-900 p-4 flex justify-between items-center border-b border-gray-700">
        <h3 className="text-white font-bold text-lg">⚡ Quick Add Templates</h3>
        <button
          onClick={onClose}
          className="text-white text-2xl hover:text-red-400"
        >
          ✕
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* Room Selection */}
        <div className="mb-4">
          <label className="text-white text-sm font-bold mb-2 block">Room *</label>
          <select
            value={selectedRoom}
            onChange={(e) => {
              setSelectedRoom(e.target.value);
              setSelectedCategory('');
              setSelectedTemplates([]);
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

        {/* Template Category Filter */}
        {selectedRoom && (
          <div className="mb-4">
            <label className="text-white text-sm font-bold mb-2 block">Template Type</label>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setTemplateCategory('ALL')}
                className={`px-3 py-1 rounded text-sm font-bold ${templateCategory === 'ALL' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300'}`}
              >
                Suggested
              </button>
              <button
                onClick={() => setTemplateCategory('FURNITURE')}
                className={`px-3 py-1 rounded text-sm font-bold ${templateCategory === 'FURNITURE' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300'}`}
              >
                Furniture
              </button>
              <button
                onClick={() => setTemplateCategory('LIGHTING')}
                className={`px-3 py-1 rounded text-sm font-bold ${templateCategory === 'LIGHTING' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300'}`}
              >
                Lighting
              </button>
              <button
                onClick={() => setTemplateCategory('TEXTILES')}
                className={`px-3 py-1 rounded text-sm font-bold ${templateCategory === 'TEXTILES' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300'}`}
              >
                Textiles
              </button>
              <button
                onClick={() => setTemplateCategory('DECOR')}
                className={`px-3 py-1 rounded text-sm font-bold ${templateCategory === 'DECOR' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300'}`}
              >
                Decor
              </button>
            </div>
          </div>
        )}

        {/* Template Selection */}
        {selectedRoom && displayTemplates.length > 0 && (
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <label className="text-white text-sm font-bold">Select Items ({selectedTemplates.length})</label>
              {selectedTemplates.length > 0 && (
                <button
                  onClick={() => setSelectedTemplates([])}
                  className="text-red-400 hover:text-red-300 text-sm"
                >
                  Clear All
                </button>
              )}
            </div>
            
            <div className="space-y-2 max-h-96 overflow-y-auto bg-gray-800 p-3 rounded">
              {displayTemplates.map((template, index) => {
                const isSelected = selectedTemplates.find(t => t.name === template.name);
                return (
                  <div
                    key={index}
                    onClick={() => toggleTemplate(template)}
                    className={`p-3 rounded cursor-pointer ${isSelected ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'}`}
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={!!isSelected}
                        onChange={() => {}}
                        className="mt-1 w-5 h-5"
                      />
                      <div className="flex-1">
                        <div className="text-white font-bold">{template.name}</div>
                        <div className="text-gray-300 text-xs mt-1">
                          {template.quantity && <span>Qty: {template.quantity}</span>}
                          {template.size && <span className="ml-3">Size: {template.size}</span>}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 sticky bottom-0 bg-gray-900 py-4 -mx-4 px-4">
          <button
            onClick={handleQuickAdd}
            disabled={adding || !selectedRoom || !selectedCategory || selectedTemplates.length === 0}
            className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white px-4 py-3 rounded-lg font-bold"
          >
            {adding ? `⏳ Adding ${selectedTemplates.length}...` : `✅ Add ${selectedTemplates.length} Items`}
          </button>
          <button
            onClick={onClose}
            className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-3 rounded-lg font-bold"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
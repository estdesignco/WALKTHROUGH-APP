import React, { useState, useEffect } from 'react';

const BasicSheet = ({ 
  project, 
  onDeleteItem, 
  onUpdateItem, 
  onAddItem, 
  itemStatuses = [], 
  vendorTypes = [], 
  carrierTypes = [] 
}) => {
  const [items, setItems] = useState([]);
  const [editingCell, setEditingCell] = useState(null);
  const [newItem, setNewItem] = useState({
    name: '',
    status: 'TO BE SELECTED',
    vendor: '',
    model: '',
    cost: '',
    quantity: 1,
    notes: '',
    carrier: '',
    tracking: ''
  });

  // Extract all items from project (if it has rooms structure) or use direct items
  useEffect(() => {
    if (project && project.items) {
      // Direct items array
      setItems(project.items);
    } else if (project && project.rooms) {
      // Extract from rooms structure
      const allItems = [];
      project.rooms.forEach(room => {
        if (room.categories) {
          room.categories.forEach(category => {
            if (category.subcategories) {
              category.subcategories.forEach(subcategory => {
                if (subcategory.items) {
                  subcategory.items.forEach(item => {
                    allItems.push({
                      ...item,
                      room_name: room.name,
                      category_name: category.name,
                      subcategory_name: subcategory.name
                    });
                  });
                }
              });
            }
          });
        }
      });
      setItems(allItems);
    }
  }, [project]);

  // Status colors
  const getStatusColor = (status) => {
    const colors = {
      'TO BE SELECTED': '#6B7280',
      'RESEARCHING': '#3B82F6',
      'PENDING APPROVAL': '#F59E0B',
      'APPROVED': '#10B981',
      'ORDERED': '#10B981',
      'PICKED': '#FFD700',
      'CONFIRMED': '#10B981',
      'IN PRODUCTION': '#F97316',
      'SHIPPED': '#3B82F6',
      'IN TRANSIT': '#3B82F6',
      'DELIVERED': '#8B5CF6',
      'RECEIVED': '#8B5CF6',
      'INSTALLED': '#10B981'
    };
    return colors[status] || '#6B7280';
  };

  // Handle cell editing
  const handleCellClick = (itemId, field) => {
    setEditingCell(`${itemId}-${field}`);
  };

  const handleCellChange = (itemId, field, value) => {
    const updatedItems = items.map(item => 
      item.id === itemId ? { ...item, [field]: value } : item
    );
    setItems(updatedItems);
    
    // Call parent update function
    if (onUpdateItem) {
      const updatedItem = updatedItems.find(item => item.id === itemId);
      onUpdateItem(updatedItem);
    }
  };

  const handleCellBlur = () => {
    setEditingCell(null);
  };

  // Add new item
  const handleAddItem = () => {
    const item = {
      ...newItem,
      id: Date.now().toString(),
      project_id: project?.id
    };
    
    setItems([...items, item]);
    
    if (onAddItem) {
      onAddItem(item);
    }
    
    // Reset form
    setNewItem({
      name: '',
      status: 'TO BE SELECTED',
      vendor: '',
      model: '',
      cost: '',
      quantity: 1,
      notes: '',
      carrier: '',
      tracking: ''
    });
  };

  // Delete item
  const handleDeleteItem = (itemId) => {
    setItems(items.filter(item => item.id !== itemId));
    if (onDeleteItem) {
      onDeleteItem(itemId);
    }
  };

  // Render editable cell
  const renderEditableCell = (item, field, type = 'text') => {
    const cellKey = `${item.id}-${field}`;
    const isEditing = editingCell === cellKey;
    const value = item[field] || '';

    if (isEditing) {
      if (type === 'select' && field === 'status') {
        return (
          <select
            value={value}
            onChange={(e) => handleCellChange(item.id, field, e.target.value)}
            onBlur={handleCellBlur}
            autoFocus
            className="w-full px-2 py-1 bg-gray-700 text-white border border-gray-600 rounded text-sm"
          >
            {itemStatuses.map(status => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
        );
      } else if (type === 'select' && field === 'carrier') {
        return (
          <select
            value={value}
            onChange={(e) => handleCellChange(item.id, field, e.target.value)}
            onBlur={handleCellBlur}
            autoFocus
            className="w-full px-2 py-1 bg-gray-700 text-white border border-gray-600 rounded text-sm"
          >
            <option value="">Select Carrier</option>
            {carrierTypes.map(carrier => (
              <option key={carrier} value={carrier}>{carrier}</option>
            ))}
          </select>
        );
      } else {
        return (
          <input
            type={type}
            value={value}
            onChange={(e) => handleCellChange(item.id, field, e.target.value)}
            onBlur={handleCellBlur}
            autoFocus
            className="w-full px-2 py-1 bg-gray-700 text-white border border-gray-600 rounded text-sm"
          />
        );
      }
    }

    return (
      <div
        onClick={() => handleCellClick(item.id, field)}
        className="px-2 py-1 cursor-pointer hover:bg-gray-700 rounded min-h-[24px] flex items-center text-sm"
        style={field === 'status' ? { color: getStatusColor(value) } : {}}
      >
        {field === 'status' && (
          <div 
            className="w-3 h-3 rounded-full mr-2" 
            style={{ backgroundColor: getStatusColor(value) }}
          />
        )}
        {value || (field === 'cost' ? '$0' : '')}
      </div>
    );
  };

  return (
    <div className="bg-gradient-to-b from-black via-gray-900 to-black rounded-2xl border border-[#B49B7E]/20 shadow-xl backdrop-blur-sm p-6">
      <div className="mb-4 flex justify-between items-center">
        <h3 className="text-xl font-semibold text-[#B49B7E]">Project Items</h3>
        <div className="text-sm text-[#F5F5DC]/70">
          Total Items: {items.length}
        </div>
      </div>

      {/* Add New Item Form */}
      <div className="mb-6 p-4 bg-black/40 rounded-lg border border-[#B49B7E]/10">
        <h4 className="text-md font-medium text-[#B49B7E] mb-3">Add New Item</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-2">
          <input
            type="text"
            placeholder="Item Name"
            value={newItem.name}
            onChange={(e) => setNewItem({...newItem, name: e.target.value})}
            className="px-3 py-2 bg-gray-700 text-white border border-gray-600 rounded text-sm col-span-2"
          />
          <select
            value={newItem.status}
            onChange={(e) => setNewItem({...newItem, status: e.target.value})}
            className="px-3 py-2 bg-gray-700 text-white border border-gray-600 rounded text-sm"
          >
            {itemStatuses.map(status => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
          <input
            type="text"
            placeholder="Vendor"
            value={newItem.vendor}
            onChange={(e) => setNewItem({...newItem, vendor: e.target.value})}
            className="px-3 py-2 bg-gray-700 text-white border border-gray-600 rounded text-sm"
          />
          <input
            type="text"
            placeholder="Model"
            value={newItem.model}
            onChange={(e) => setNewItem({...newItem, model: e.target.value})}
            className="px-3 py-2 bg-gray-700 text-white border border-gray-600 rounded text-sm"
          />
          <input
            type="number"
            placeholder="Cost"
            value={newItem.cost}
            onChange={(e) => setNewItem({...newItem, cost: e.target.value})}
            className="px-3 py-2 bg-gray-700 text-white border border-gray-600 rounded text-sm"
          />
          <input
            type="number"
            placeholder="Qty"
            value={newItem.quantity}
            onChange={(e) => setNewItem({...newItem, quantity: parseInt(e.target.value)})}
            className="px-3 py-2 bg-gray-700 text-white border border-gray-600 rounded text-sm"
          />
          <button
            onClick={handleAddItem}
            disabled={!newItem.name}
            className="px-4 py-2 bg-gradient-to-r from-[#B49B7E] to-[#A08B6F] hover:from-[#A08B6F] hover:to-[#8B7355] text-[#F5F5DC] rounded text-sm font-medium disabled:opacity-50"
          >
            Add Item
          </button>
        </div>
      </div>

      {/* Spreadsheet Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#B49B7E]/20">
              <th className="text-left p-3 text-[#B49B7E] font-medium">#</th>
              <th className="text-left p-3 text-[#B49B7E] font-medium">Item Name</th>
              <th className="text-left p-3 text-[#B49B7E] font-medium">Status</th>
              <th className="text-left p-3 text-[#B49B7E] font-medium">Vendor</th>
              <th className="text-left p-3 text-[#B49B7E] font-medium">Model</th>
              <th className="text-left p-3 text-[#B49B7E] font-medium">Cost</th>
              <th className="text-left p-3 text-[#B49B7E] font-medium">Qty</th>
              <th className="text-left p-3 text-[#B49B7E] font-medium">Carrier</th>
              <th className="text-left p-3 text-[#B49B7E] font-medium">Tracking</th>
              <th className="text-left p-3 text-[#B49B7E] font-medium">Notes</th>
              <th className="text-left p-3 text-[#B49B7E] font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => (
              <tr key={item.id} className="border-b border-gray-700/30 hover:bg-gray-800/30">
                <td className="p-3 text-[#F5F5DC]/70 text-sm">{index + 1}</td>
                <td className="p-1 text-[#F5F5DC]">
                  {renderEditableCell(item, 'name')}
                </td>
                <td className="p-1">
                  {renderEditableCell(item, 'status', 'select')}
                </td>
                <td className="p-1 text-[#F5F5DC]">
                  {renderEditableCell(item, 'vendor')}
                </td>
                <td className="p-1 text-[#F5F5DC]">
                  {renderEditableCell(item, 'model')}
                </td>
                <td className="p-1 text-[#F5F5DC]">
                  {renderEditableCell(item, 'cost', 'number')}
                </td>
                <td className="p-1 text-[#F5F5DC]">
                  {renderEditableCell(item, 'quantity', 'number')}
                </td>
                <td className="p-1 text-[#F5F5DC]">
                  {renderEditableCell(item, 'carrier', 'select')}
                </td>
                <td className="p-1 text-[#F5F5DC]">
                  {renderEditableCell(item, 'tracking')}
                </td>
                <td className="p-1 text-[#F5F5DC]">
                  {renderEditableCell(item, 'notes')}
                </td>
                <td className="p-3">
                  <button
                    onClick={() => handleDeleteItem(item.id)}
                    className="text-red-400 hover:text-red-300 text-sm"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {items.length === 0 && (
        <div className="text-center py-8 text-[#F5F5DC]/50">
          No items yet. Add your first item using the form above.
        </div>
      )}
    </div>
  );
};

export default BasicSheet;
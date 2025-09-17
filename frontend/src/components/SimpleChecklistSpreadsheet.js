import React, { useState, useEffect } from 'react';
import AddItemModal from './AddItemModal';

const SimpleChecklistSpreadsheet = ({ 
  project, 
  roomColors, 
  categoryColors, 
  itemStatuses = [],
  vendorTypes = [],
  carrierTypes = [],
  onDeleteRoom, 
  onAddRoom,
  onReload 
}) => {
  console.log('🎯 SimpleChecklistSpreadsheet rendering with project:', project);

  const [showAddItem, setShowAddItem] = useState(false);
  const [selectedSubCategoryId, setSelectedSubCategoryId] = useState(null);

  // Status colors mapping for checklist
  const getStatusColor = (status) => {
    const statusColors = {
      '': '#6B7280',                        // Gray for blank/default
      'BLANK': '#6B7280',                   // Gray for blank
      'PICKED': '#3B82F6',                  // Blue
      'ORDER SAMPLES': '#10B981',           // Green
      'SAMPLES ARRIVED': '#8B5CF6',         // Purple
      'ASK NEIL': '#F59E0B',                // Yellow
      'ASK CHARLENE': '#EF4444',            // Red
      'ASK JALA': '#EC4899',                // Pink
      'GET QUOTE': '#06B6D4',               // Cyan
      'WAITING ON QT': '#F97316',           // Orange
      'READY FOR PRESENTATION': '#84CC16'   // Lime
    };
    return statusColors[status] || '#6B7280'; // Default gray
  };

  // Handle status change
  const handleStatusChange = async (itemId, newStatus) => {
    console.log('🔄 Checklist status change request:', { itemId, newStatus });
    
    try {
      const response = await fetch(`https://spreadsheet-revamp.preview.emergentagent.com/api/items/${itemId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      
      if (response.ok) {
        console.log('✅ Checklist status updated successfully, reloading...');
        window.location.reload();
      } else {
        const errorData = await response.text();
        console.error('❌ Checklist status update failed:', response.status, errorData);
      }
    } catch (error) {
      console.error('❌ Checklist status update error:', error);
    }
  };

  // Handle adding new items
  const handleAddItem = async (itemData) => {
    try {
      if (!selectedSubCategoryId) {
        console.error('❌ No subcategory selected for adding item');
        alert('Please select a category first by clicking "Add Item" in a specific category section.');
        return;
      }

      const newItem = {
        ...itemData,
        subcategory_id: selectedSubCategoryId,
        status: '', // Start with blank status as requested
        order_index: 0
      };

      console.log('📤 Creating checklist item:', newItem);

      const response = await fetch(`https://spreadsheet-revamp.preview.emergentagent.com/api/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newItem)
      });

      if (response.ok) {
        console.log('✅ Checklist item added successfully');
        setShowAddItem(false);
        setSelectedSubCategoryId(null);
        window.location.reload();
      } else {
        const errorData = await response.text();
        console.error('❌ Backend error:', errorData);
        throw new Error(`HTTP ${response.status}: ${errorData}`);
      }
    } catch (error) {
      console.error('❌ Error adding checklist item:', error);
      alert('Failed to add item: ' + error.message);
    }
  };

  // Handle deleting an item - RESTORED DELETE FUNCTIONALITY
  const handleDeleteItem = async (itemId) => {
    if (!window.confirm('Are you sure you want to delete this item?')) {
      return;
    }

    try {
      const response = await fetch(`https://spreadsheet-revamp.preview.emergentagent.com/api/items/${itemId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        console.log('✅ Checklist item deleted successfully');
        window.location.reload();
      } else {
        console.error('❌ Delete failed with status:', response.status);
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (error) {
      console.error('❌ Error deleting checklist item:', error);
      alert('Failed to delete item: ' + error.message);
    }
  };

  // Handle deleting a category - RESTORED DELETE FUNCTIONALITY
  const handleDeleteCategory = async (categoryId) => {
    if (!window.confirm('Are you sure you want to delete this entire category and all its items?')) {
      return;
    }

    try {
      const response = await fetch(`https://spreadsheet-revamp.preview.emergentagent.com/api/categories/${categoryId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        console.log('✅ Checklist category deleted successfully');
        window.location.reload();
      } else {
        console.error('❌ Category delete failed with status:', response.status);
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (error) {
      console.error('❌ Error deleting checklist category:', error);
      alert('Failed to delete category: ' + error.message);
    }
  };

  // Handle Canva PDF scraping - ENHANCED FEATURE
  const handleCanvaPdfScrape = async (canvaUrl, roomName) => {
    if (!canvaUrl) {
      console.log('⚠️ No Canva URL provided');
      return;
    }

    try {
      console.log('🎨 Scraping Canva PDF for room:', roomName, 'URL:', canvaUrl);
      
      const response = await fetch('https://spreadsheet-revamp.preview.emergentagent.com/api/scrape-canva-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          canva_url: canvaUrl,
          room_name: roomName,
          project_id: project.id
        })
      });
      
      if (response.ok) {
        const canvaData = await response.json();
        console.log('✅ Canva PDF scraped successfully:', canvaData);
        alert(`Success! Scraped ${canvaData.items_created || 0} items from Canva PDF`);
        window.location.reload();
      } else {
        console.error('❌ Canva PDF scraping failed:', response.status);
        alert('Failed to scrape Canva PDF. Please check the URL.');
      }
    } catch (error) {
      console.error('❌ Canva PDF scraping error:', error);
      alert('Error scraping Canva PDF: ' + error.message);
    }
  };

  if (!project) {
    return (
      <div className="text-center text-red-400 py-8 bg-red-900 m-4 p-4 rounded">
        <p className="text-lg">🚨 SimpleChecklistSpreadsheet: NO PROJECT DATA</p>
      </div>
    );
  }

  if (!project.rooms || project.rooms.length === 0) {
    return (
      <div className="text-center text-yellow-400 py-8 bg-yellow-900 m-4 p-4 rounded">
        <p className="text-lg">🚨 SimpleChecklistSpreadsheet: NO ROOMS</p>
        <p className="text-sm mt-2">Project has {project.rooms?.length || 0} rooms</p>
      </div>
    );
  }

  console.log('✅ SimpleChecklistSpreadsheet: Rendering with', project.rooms.length, 'rooms');

  return (
    <div className="w-full" style={{ backgroundColor: '#0F172A' }}>
      
      {/* BASIC FILTER SECTION */}
      <div className="mb-6 p-4" style={{ backgroundColor: '#1E293B' }}>
        <div className="flex gap-4 items-center">
          <input
            type="text"
            placeholder="Search Items..."
            className="flex-1 px-4 py-2 rounded bg-gray-700 text-white border border-gray-600"
          />
          <button className="px-4 py-2 bg-blue-600 text-white rounded">🔍 FILTER</button>
          <button className="px-4 py-2 bg-red-600 text-white rounded">CLEAR</button>
          <button 
            onClick={onAddRoom}
            className="px-4 py-2 bg-amber-600 text-white rounded"
          >
            ✚ ADD ROOM
          </button>
        </div>
      </div>

      {/* ENHANCED CHECKLIST TABLE WITH DELETE BUTTONS */}
      <div className="w-full">
        {project.rooms.map((room) => (
          <div key={room.id} className="mb-8">
            {/* ROOM HEADER WITH DELETE BUTTON */}
            <div 
              className="px-4 py-2 text-white font-bold mb-4"
              style={{ backgroundColor: '#7C3AED' }}
            >
              <div className="flex justify-between items-center">
                <span>{room.name.toUpperCase()}</span>
                <div className="flex items-center gap-2">
                  {/* CANVA PDF SCRAPING INPUT */}
                  <input
                    type="url"
                    placeholder="Canva PDF URL..."
                    className="bg-gray-800 text-white text-sm px-2 py-1 rounded border border-gray-600"
                    onBlur={(e) => {
                      if (e.target.value) {
                        handleCanvaPdfScrape(e.target.value, room.name);
                        e.target.value = '';
                      }
                    }}
                  />
                  <button
                    onClick={() => {
                      const input = event.target.previousElementSibling;
                      if (input && input.value) {
                        handleCanvaPdfScrape(input.value, room.name);
                        input.value = '';
                      }
                    }}
                    className="bg-purple-600 text-white text-xs px-2 py-1 rounded hover:bg-purple-700"
                    title="Scrape Canva PDF"
                  >
                    🎨 Scrape PDF
                  </button>
                  <button
                    onClick={() => onDeleteRoom && onDeleteRoom(room.id)}
                    className="text-red-300 hover:text-red-100 text-lg"
                    title="Delete Room"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            </div>

            {/* CATEGORIES */}
            {room.categories?.map((category) => (
              <div key={category.id} className="mb-6">
                {/* CATEGORY HEADER WITH DELETE BUTTON */}
                <div 
                  className="px-4 py-2 text-white font-bold mb-2"
                  style={{ backgroundColor: '#065F46' }}
                >
                  <div className="flex justify-between items-center">
                    <span>{category.name.toUpperCase()}</span>
                    <button
                      onClick={() => handleDeleteCategory(category.id)}
                      className="text-red-300 hover:text-red-100 text-lg"
                      title="Delete Category"
                    >
                      🗑️
                    </button>
                  </div>
                </div>

                {/* CHECKLIST TABLE - 7 COLUMNS */}
                <table className="w-full border-collapse border border-gray-400 mb-4">
                  <thead>
                    <tr>
                      <th className="border border-gray-400 px-2 py-2 text-xs font-bold text-white" style={{ backgroundColor: '#8B4444' }}>ITEM</th>
                      <th className="border border-gray-400 px-2 py-2 text-xs font-bold text-white w-16" style={{ backgroundColor: '#8B4444' }}>QTY</th>
                      <th className="border border-gray-400 px-2 py-2 text-xs font-bold text-white" style={{ backgroundColor: '#8B4444' }}>SIZE</th>
                      <th className="border border-gray-400 px-2 py-2 text-xs font-bold text-white" style={{ backgroundColor: '#8B4444' }}>STATUS</th>
                      <th className="border border-gray-400 px-2 py-2 text-xs font-bold text-white w-20" style={{ backgroundColor: '#8B4444' }}>IMAGE</th>
                      <th className="border border-gray-400 px-2 py-2 text-xs font-bold text-white w-20" style={{ backgroundColor: '#8B4444' }}>LINK</th>
                      <th className="border border-gray-400 px-2 py-2 text-xs font-bold text-white" style={{ backgroundColor: '#8B4444' }}>REMARKS</th>
                      <th className="border border-gray-400 px-2 py-2 text-xs font-bold text-white w-12" style={{ backgroundColor: '#8B4444' }}>DELETE</th>
                    </tr>
                  </thead>
                  <tbody>
                    {category.subcategories?.map((subcategory) => 
                      subcategory.items?.map((item, itemIndex) => (
                        <tr key={item.id} className={itemIndex % 2 === 0 ? 'bg-slate-800' : 'bg-slate-700'}>
                          <td className="border border-gray-400 px-2 py-1 text-white text-sm">{item.name}</td>
                          <td className="border border-gray-400 px-2 py-1 text-white text-sm text-center">{item.quantity || ''}</td>
                          <td className="border border-gray-400 px-2 py-1 text-white text-sm">{item.size || ''}</td>
                          <td className="border border-gray-400 px-2 py-1 text-white text-sm">
                            <select 
                              className="bg-gray-800 text-white text-xs border-none w-full"
                              value={item.status || ''}
                              style={{ backgroundColor: getStatusColor(item.status || ''), color: 'white' }}
                              onChange={(e) => handleStatusChange(item.id, e.target.value)}
                            >
                              <option value="" style={{ backgroundColor: '#6B7280', color: 'white' }}>Select Status</option>
                              <option value="PICKED" style={{ backgroundColor: '#3B82F6', color: 'white' }}>PICKED</option>
                              <option value="ORDER SAMPLES" style={{ backgroundColor: '#10B981', color: 'white' }}>ORDER SAMPLES</option>
                              <option value="SAMPLES ARRIVED" style={{ backgroundColor: '#8B5CF6', color: 'white' }}>SAMPLES ARRIVED</option>
                              <option value="ASK NEIL" style={{ backgroundColor: '#F59E0B', color: 'white' }}>ASK NEIL</option>
                              <option value="ASK CHARLENE" style={{ backgroundColor: '#EF4444', color: 'white' }}>ASK CHARLENE</option>
                              <option value="ASK JALA" style={{ backgroundColor: '#EC4899', color: 'white' }}>ASK JALA</option>
                              <option value="GET QUOTE" style={{ backgroundColor: '#06B6D4', color: 'white' }}>GET QUOTE</option>
                              <option value="WAITING ON QT" style={{ backgroundColor: '#F97316', color: 'white' }}>WAITING ON QT</option>
                              <option value="READY FOR PRESENTATION" style={{ backgroundColor: '#84CC16', color: 'white' }}>READY FOR PRESENTATION</option>
                            </select>
                          </td>
                          <td className="border border-gray-400 px-2 py-1 text-white text-sm w-20">
                            {item.image_url ? (
                              <img src={item.image_url} alt={item.name} className="w-8 h-8 object-cover rounded" />
                            ) : ''}
                          </td>
                          <td className="border border-gray-400 px-2 py-1 text-white text-sm w-20">
                            {item.link_url ? (
                              <a href={item.link_url} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300">
                                🔗 Link
                              </a>
                            ) : ''}
                          </td>
                          <td className="border border-gray-400 px-2 py-1 text-white text-sm">{item.remarks || ''}</td>
                          <td className="border border-gray-400 px-2 py-1 text-center w-12">
                            <button
                              onClick={() => handleDeleteItem(item.id)}
                              className="text-red-400 hover:text-red-300 text-sm"
                              title="Delete Item"
                            >
                              🗑️
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>

                {/* ADD ITEM BUTTON - FIXED */}
                <div className="mb-4">
                  <button 
                    onClick={() => {
                      if (category.subcategories?.length > 0) {
                        setSelectedSubCategoryId(category.subcategories[0].id);
                        setShowAddItem(true);
                        console.log('🎯 Selected subcategory for new item:', category.subcategories[0].id);
                      } else {
                        alert('This category has no subcategories. Please contact support.');
                      }
                    }}
                    className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded text-sm"
                  >
                    + Add Item
                  </button>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Add Item Modal - FIXED */}
      {showAddItem && selectedSubCategoryId && (
        <AddItemModal
          onClose={() => {
            setShowAddItem(false);
            setSelectedSubCategoryId(null);
          }}
          onSubmit={handleAddItem}
          availableVendors={vendorTypes}
          availableStatuses={itemStatuses}
        />
      )}
    </div>
  );
};

export default SimpleChecklistSpreadsheet;
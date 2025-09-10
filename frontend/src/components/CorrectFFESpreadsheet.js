import React, { useState, useEffect } from 'react';
import AddItemModal from './AddItemModal';

const CorrectFFESpreadsheet = ({ 
  project, 
  roomColors, 
  categoryColors, 
  itemStatuses = [],
  vendorTypes = [],
  carrierTypes = [],
  onDeleteRoom, 
  onReload 
}) => {
  const [expandedRooms, setExpandedRooms] = useState({});
  const [expandedCategories, setExpandedCategories] = useState({});
  const [expandedSubcategories, setExpandedSubcategories] = useState({});
  const [showAddItem, setShowAddItem] = useState(false);
  const [selectedSubCategoryId, setSelectedSubCategoryId] = useState(null);

  // Handle adding new items
  const handleAddItem = async (itemData) => {
    if (!selectedSubCategoryId) {
      alert('❌ No subcategory selected');
      return;
    }

    try {
      const backendUrl = import.meta.env?.REACT_APP_BACKEND_URL || process.env.REACT_APP_BACKEND_URL;
      
      const newItem = {
        ...itemData,
        subcategory_id: selectedSubCategoryId,
        id: `item-${Date.now()}`,
      };

      const response = await fetch(`${backendUrl}/api/items`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newItem)
      });

      if (response.ok) {
        // ✅ SUCCESS BANNER REMOVED AS REQUESTED
        setShowAddItem(false);
        setSelectedSubCategoryId(null);
        
        if (onReload) {
          await onReload();
        }
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (error) {
      console.error('❌ Error adding item:', error);
      alert('❌ Failed to add item: ' + error.message);
    }
  };

  // Toggle functions
  const toggleRoom = (roomId) => {
    setExpandedRooms(prev => ({
      ...prev,
      [roomId]: !prev[roomId]
    }));
  };

  const toggleCategory = (categoryId) => {
    setExpandedCategories(prev => ({
      ...prev,
      [categoryId]: !prev[categoryId]
    }));
  };

  const toggleSubcategory = (subcategoryId) => {
    setExpandedSubcategories(prev => ({
      ...prev,
      [subcategoryId]: !prev[subcategoryId]
    }));
  };

  // EXACT COLORS FROM YOUR IMAGES - Muted professional colors
  const getRoomColor = (roomName) => {
    return '#9B8E9B'; // Exact muted purple from your LIVING ROOM
  };

  const getCategoryColor = () => {
    return '#8B9B8B'; // Exact muted green from your LIGHTING  
  };

  const getSubcategoryColor = () => {
    return '#B8A5A8'; // Exact muted reddish from your PORTABLE
  };

  if (!project || !project.rooms) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Loading FF&E Project...</h2>
      </div>
    );
  }

  return (
    <div className="w-full bg-white flex" style={{ height: '80vh' }}>
      
      {/* LEFT PANEL - Hierarchical Navigation EXACTLY like your FFE LEFT.png */}
      <div className="w-80 bg-gray-50 border-r border-gray-300 overflow-y-auto flex-shrink-0">
        <div className="p-4">
          <h3 className="text-lg font-semibold text-gray-700 mb-4">Project Structure</h3>
          
          {project.rooms.map((room) => (
            <div key={room.id} className="mb-2">
              {/* ROOM HEADER - Exact muted purple from your image */}
              <div
                className="px-3 py-2 text-white text-sm font-medium cursor-pointer rounded-sm flex items-center justify-between"
                style={{ backgroundColor: getRoomColor(room.name) }}
                onClick={() => toggleRoom(room.id)}
              >
                <span>{room.name.toUpperCase()}</span>
                <span className="text-xs">{expandedRooms[room.id] ? '−' : '+'}</span>
              </div>

              {/* ROOM CONTENT */}
              {expandedRooms[room.id] && room.categories && (
                <div className="ml-3 mt-1">
                  {room.categories.map((category) => (
                    <div key={category.id} className="mb-1">
                      {/* CATEGORY HEADER - Exact muted green from your image */}
                      <div
                        className="px-3 py-1 text-white text-sm cursor-pointer rounded-sm flex items-center justify-between"
                        style={{ backgroundColor: getCategoryColor() }}
                        onClick={() => toggleCategory(category.id)}
                      >
                        <span>{category.name.toUpperCase()}</span>
                        <span className="text-xs">{expandedCategories[category.id] ? '−' : '+'}</span>
                      </div>

                      {/* CATEGORY CONTENT */}
                      {expandedCategories[category.id] && category.subcategories && (
                        <div className="ml-3 mt-1">
                          {category.subcategories.map((subcategory) => (
                            <div key={subcategory.id} className="mb-1">
                              {/* SUBCATEGORY HEADER - Exact muted red from your image */}
                              <div
                                className="px-3 py-1 text-white text-xs cursor-pointer rounded-sm flex items-center justify-between"
                                style={{ backgroundColor: getSubcategoryColor() }}
                                onClick={() => toggleSubcategory(subcategory.id)}
                              >
                                <span>{subcategory.name.toUpperCase()}</span>
                                <span className="text-xs">{expandedSubcategories[subcategory.id] ? '−' : '+'}</span>
                              </div>

                              {/* ITEMS LIST - Individual items like Console Lamp, Table Lamp */}
                              {expandedSubcategories[subcategory.id] && subcategory.items && (
                                <div className="ml-3 mt-1">
                                  {subcategory.items.map((item, itemIndex) => (
                                    <div key={item.id || itemIndex} className="px-2 py-1 text-xs text-gray-700 bg-white border border-gray-200 rounded-sm mb-1 shadow-sm">
                                      {item.name || 'Unnamed Item'}
                                    </div>
                                  ))}
                                  
                                  {/* ADD ITEM BUTTON */}
                                  <button
                                    onClick={() => {
                                      setSelectedSubCategoryId(subcategory.id);
                                      setShowAddItem(true);
                                    }}
                                    className="w-full px-2 py-1 text-xs bg-blue-50 text-blue-700 border border-blue-200 rounded-sm hover:bg-blue-100 transition-colors"
                                  >
                                    + Add Item
                                  </button>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* RIGHT PANEL - ONE CONTINUOUS HORIZONTAL TABLE EXACTLY like your FFE RIGHT.png */}
      <div className="flex-1 bg-white overflow-hidden flex flex-col">
        
        {/* TABLE HEADER */}
        <div className="px-4 py-3 bg-gray-100 border-b border-gray-300 flex-shrink-0">
          <h3 className="text-lg font-semibold text-gray-700">FF&E Spreadsheet</h3>
        </div>

        {/* HORIZONTAL SCROLLING TABLE - ONE CONTINUOUS TABLE */}
        <div className="flex-1 overflow-auto">
          <div style={{ minWidth: '2000px' }}>
            
            <table className="w-full border-collapse">
              
              {/* COLUMN GROUP HEADERS spanning across - EXACTLY like your image */}
              <thead>
                {/* Group headers spanning multiple columns */}
                <tr>
                  <th className="border border-gray-300 px-2 py-2 text-xs font-medium text-white text-center" 
                      style={{ backgroundColor: '#8B7355' }} colSpan="8">
                    ADDITIONAL INFO.
                  </th>
                  <th className="border border-gray-300 px-2 py-2 text-xs font-medium text-white text-center" 
                      style={{ backgroundColor: '#9B8E9B' }} colSpan="7">
                    SHIPPING INFO.
                  </th>
                </tr>
                
                {/* Individual column headers */}
                <tr className="bg-gray-50">
                  {/* ADDITIONAL INFO columns */}
                  <th className="border border-gray-300 px-2 py-2 text-left text-xs font-medium text-gray-700 min-w-[200px]">ITEM NAME</th>
                  <th className="border border-gray-300 px-2 py-2 text-left text-xs font-medium text-gray-700 min-w-[150px]">VENDOR/SKU</th>
                  <th className="border border-gray-300 px-2 py-2 text-center text-xs font-medium text-gray-700 min-w-[60px]">QTY</th>
                  <th className="border border-gray-300 px-2 py-2 text-left text-xs font-medium text-gray-700 min-w-[100px]">SIZE</th>
                  <th className="border border-gray-300 px-2 py-2 text-left text-xs font-medium text-gray-700 min-w-[120px]">ORDER STATUS</th>
                  <th className="border border-gray-300 px-2 py-2 text-left text-xs font-medium text-gray-700 min-w-[120px]">FINISH/Color</th>
                  <th className="border border-gray-300 px-2 py-2 text-right text-xs font-medium text-gray-700 min-w-[100px]">Cost/Price</th>
                  <th className="border border-gray-300 px-2 py-2 text-center text-xs font-medium text-gray-700 min-w-[80px]">Image</th>
                  
                  {/* SHIPPING INFO columns - continuing horizontally */}
                  <th className="border border-gray-300 px-2 py-2 text-left text-xs font-medium text-gray-700 min-w-[100px]">CARRIER</th>
                  <th className="border border-gray-300 px-2 py-2 text-left text-xs font-medium text-gray-700 min-w-[140px]">TRACKING #</th>
                  <th className="border border-gray-300 px-2 py-2 text-left text-xs font-medium text-gray-700 min-w-[110px]">ORDER DATE</th>
                  <th className="border border-gray-300 px-2 py-2 text-left text-xs font-medium text-gray-700 min-w-[120px]">DELIVERY DATE</th>
                  <th className="border border-gray-300 px-2 py-2 text-left text-xs font-medium text-gray-700 min-w-[110px]">INSTALL DATE</th>
                  <th className="border border-gray-300 px-2 py-2 text-left text-xs font-medium text-gray-700 min-w-[150px]">NOTES</th>
                  <th className="border border-gray-300 px-2 py-2 text-center text-xs font-medium text-gray-700 min-w-[80px]">ACTIONS</th>
                </tr>
              </thead>
              
              <tbody>
                {/* Data rows spanning all columns horizontally */}
                {project.rooms.map((room) => 
                  room.categories?.map((category) =>
                    category.subcategories?.map((subcategory) =>
                      subcategory.items?.map((item, itemIndex) => (
                        <tr key={`${room.id}-${category.id}-${subcategory.id}-${itemIndex}`} 
                            className="hover:bg-gray-50 transition-colors">
                          
                          {/* ADDITIONAL INFO columns */}
                          <td className="border border-gray-300 px-2 py-2 text-sm">
                            <input 
                              type="text" 
                              value={item.name || ''} 
                              className="w-full bg-transparent border-none outline-none text-gray-800"
                              placeholder="Item name..."
                            />
                          </td>
                          <td className="border border-gray-300 px-2 py-2 text-sm">
                            <input 
                              type="text" 
                              value={item.vendor || ''} 
                              className="w-full bg-transparent border-none outline-none text-gray-800"
                              placeholder="Vendor/SKU..."
                            />
                          </td>
                          <td className="border border-gray-300 px-2 py-2 text-center text-sm">
                            <input 
                              type="number" 
                              value={item.quantity || 1} 
                              className="w-full text-center bg-transparent border-none outline-none text-gray-800"
                            />
                          </td>
                          <td className="border border-gray-300 px-2 py-2 text-sm">
                            <input 
                              type="text" 
                              value={item.size || ''} 
                              className="w-full bg-transparent border-none outline-none text-gray-800"
                              placeholder="Size..."
                            />
                          </td>
                          <td className="border border-gray-300 px-2 py-2 text-sm">
                            <select 
                              value={item.status || 'PICKED'} 
                              className="w-full border-none outline-none rounded px-2 py-1 text-xs text-gray-800"
                              style={{ 
                                backgroundColor: item.status === 'PICKED' ? '#FEF3C7' : 
                                                item.status === 'ORDERED' ? '#DBEAFE' :
                                                item.status === 'DELIVERED TO JOB SITE' ? '#D1FAE5' : '#F3F4F6'
                              }}
                            >
                              <option value="PICKED">PICKED</option>
                              <option value="ORDERED">ORDERED</option>
                              <option value="SHIPPED">SHIPPED</option>
                              <option value="DELIVERED TO JOB SITE">DELIVERED TO JOB SITE</option>
                            </select>
                          </td>
                          <td className="border border-gray-300 px-2 py-2 text-sm">
                            <input 
                              type="text" 
                              value={item.finish_color || ''} 
                              className="w-full bg-transparent border-none outline-none text-gray-800"
                              placeholder="Finish/Color..."
                            />
                          </td>
                          <td className="border border-gray-300 px-2 py-2 text-right text-sm">
                            <input 
                              type="number" 
                              value={item.cost || ''} 
                              className="w-full text-right bg-transparent border-none outline-none text-gray-800"
                              placeholder="0.00"
                              step="0.01"
                            />
                          </td>
                          <td className="border border-gray-300 px-2 py-2 text-center">
                            {item.image_url ? (
                              <img 
                                src={item.image_url} 
                                alt={item.name}
                                className="w-12 h-12 object-cover rounded cursor-pointer border border-gray-200"
                                onClick={() => window.open(item.image_url, '_blank')}
                              />
                            ) : (
                              <button className="text-blue-600 hover:text-blue-800 text-xs px-2 py-1 border border-blue-200 rounded">
                                + Image
                              </button>
                            )}
                          </td>
                          
                          {/* SHIPPING INFO columns - continuing horizontally */}
                          <td className="border border-gray-300 px-2 py-2 text-sm">
                            <select 
                              value={item.carrier || ''} 
                              className="w-full bg-transparent border-none outline-none text-xs text-gray-800"
                            >
                              <option value="">Select...</option>
                              <option value="FedEx">FedEx</option>
                              <option value="UPS">UPS</option>
                              <option value="Brooks">Brooks</option>
                              <option value="Zenith">Zenith</option>
                              <option value="Sunbelt">Sunbelt</option>
                            </select>
                          </td>
                          <td className="border border-gray-300 px-2 py-2 text-sm">
                            <input 
                              type="text" 
                              value={item.tracking_number || ''} 
                              className="w-full bg-transparent border-none outline-none text-gray-800"
                              placeholder="Add Tracking #"
                            />
                          </td>
                          <td className="border border-gray-300 px-2 py-2 text-sm">
                            <input 
                              type="date" 
                              value={item.order_date || ''} 
                              className="w-full bg-transparent border-none outline-none text-xs text-gray-800"
                            />
                          </td>
                          <td className="border border-gray-300 px-2 py-2 text-sm">
                            <input 
                              type="date" 
                              value={item.expected_delivery || ''} 
                              className="w-full bg-transparent border-none outline-none text-xs text-gray-800"
                            />
                          </td>
                          <td className="border border-gray-300 px-2 py-2 text-sm">
                            <input 
                              type="date" 
                              value={item.install_date || ''} 
                              className="w-full bg-transparent border-none outline-none text-xs text-gray-800"
                            />
                          </td>
                          <td className="border border-gray-300 px-2 py-2 text-sm">
                            <textarea 
                              value={item.notes || ''} 
                              className="w-full bg-transparent border-none outline-none text-xs resize-none text-gray-800"
                              placeholder="Notes..."
                              rows="1"
                            />
                          </td>
                          <td className="border border-gray-300 px-2 py-2 text-center">
                            <button className="text-red-600 hover:text-red-800 text-xs px-2 py-1 border border-red-200 rounded">
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))
                    )
                  )
                )}
              </tbody>
            </table>

          </div>
        </div>
      </div>

      {/* ADD ITEM MODAL */}
      {showAddItem && (
        <AddItemModal
          onClose={() => setShowAddItem(false)}
          onSubmit={handleAddItem}
          itemStatuses={itemStatuses}
          vendorTypes={vendorTypes}
          loading={false}
        />
      )}
    </div>
  );
};

export default CorrectFFESpreadsheet;
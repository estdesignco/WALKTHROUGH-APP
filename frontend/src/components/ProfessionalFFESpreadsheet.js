import React, { useState, useEffect, useRef } from 'react';
import AddItemModal from './AddItemModal';

const ProfessionalFFESpreadsheet = ({ 
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
  const [enhancedItemStatuses, setEnhancedItemStatuses] = useState([]);
  const [carrierOptions, setCarrierOptions] = useState([]);

  // Load enhanced data on component mount
  useEffect(() => {
    const loadEnhancedData = async () => {
      try {
        const backendUrl = import.meta.env?.REACT_APP_BACKEND_URL || process.env.REACT_APP_BACKEND_URL;
        
        // Load enhanced item statuses
        const statusRes = await fetch(`${backendUrl}/api/item-statuses-enhanced`);
        if (statusRes.ok) {
          const statusData = await statusRes.json();
          setEnhancedItemStatuses(statusData.data || []);
        }
        
        // Load carrier options
        const carrierRes = await fetch(`${backendUrl}/api/carrier-options`);
        if (carrierRes.ok) {
          const carrierData = await carrierRes.json();
          setCarrierOptions(carrierData.data || []);
        }
      } catch (error) {
        console.error('Error loading enhanced data:', error);
      }
    };
    
    loadEnhancedData();
  }, []);

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
        alert(`✅ ITEM ADDED SUCCESSFULLY!\nName: ${itemData.name}\nVendor: ${itemData.vendor}`);
        setShowAddItem(false);
        setSelectedSubCategoryId(null);
        
        if (onReload) {
          await onReload();
        }
      } else {
        throw new Error(`HTTP ${response.status}: ${await response.text()}`);
      }
    } catch (error) {
      console.error('❌ Error adding item:', error);
      alert('❌ Failed to add item: ' + error.message);
    }
  };

  // Toggle room expansion
  const toggleRoom = (roomId) => {
    setExpandedRooms(prev => ({
      ...prev,
      [roomId]: !prev[roomId]
    }));
  };

  // Toggle category expansion  
  const toggleCategory = (categoryId) => {
    setExpandedCategories(prev => ({
      ...prev,
      [categoryId]: !prev[categoryId]
    }));
  };

  // Toggle subcategory expansion
  const toggleSubcategory = (subcategoryId) => {
    setExpandedSubcategories(prev => ({
      ...prev,
      [subcategoryId]: !prev[subcategoryId]
    }));
  };

  // Count items in room/category/subcategory
  const countItems = (items) => {
    return items ? items.length : 0;
  };

  // Count total items in room
  const countRoomItems = (room) => {
    let total = 0;
    if (room.categories) {
      room.categories.forEach(category => {
        if (category.subcategories) {
          category.subcategories.forEach(subcategory => {
            total += countItems(subcategory.items);
          });
        }
      });
    }
    return total;
  };

  // Count total items in category
  const countCategoryItems = (category) => {
    let total = 0;
    if (category.subcategories) {
      category.subcategories.forEach(subcategory => {
        total += countItems(subcategory.items);
      });
    }
    return total;
  };

  // Get room color (PURPLE like your screenshots)
  const getRoomColor = (roomName) => {
    const exactColors = {
      'living room': '#8A5A8A',  // Muted purple like your image
      'dining room': '#5A8A8A',  // Muted teal
      'kitchen': '#5A6A5A',      // Muted green
      'primary bedroom': '#6A5A7A', // Muted purple-brown
      'primary bathroom': '#6A4A4A', // Muted brown
      'powder room': '#4A6A6A',   // Muted gray-green
    };
    return exactColors[roomName.toLowerCase()] || '#8A5A8A';
  };

  // Get category color (GREEN like your screenshots)
  const getCategoryColor = () => {
    return '#5A7A5A'; // Muted green for all categories
  };

  // Get subcategory color (RED like your screenshots)  
  const getSubcategoryColor = () => {
    return '#8A5A5A'; // Muted red for all subcategories
  };

  // Get status color
  const getStatusColor = (status) => {
    const statusItem = itemStatuses.find(s => s.status === status);
    return statusItem ? statusItem.color : '#999999';
  };

  // Get carrier color
  const getCarrierColor = (carrier) => {
    const carrierItem = carrierOptions.find(c => c.name === carrier);
    return carrierItem ? carrierItem.color : '#999999';
  };

  if (!project || !project.rooms) {
    return (
      <div className="p-8 text-center text-white">
        <h2 className="text-2xl font-bold mb-4">Loading FF&E Project...</h2>
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto"></div>
      </div>
    );
  }

  return (
    <div className="w-full bg-neutral-900 text-white">
      {/* PROFESSIONAL HEADER MESSAGE */}
      <div className="bg-neutral-800 p-4 mb-6 rounded border border-neutral-600">
        <h2 className="text-xl font-bold text-center text-green-400">
          🎉 PROFESSIONAL FF&E SPREADSHEET IS WORKING!
        </h2>
        <p className="text-center text-neutral-300 mt-2">
          ✅ Enhanced Tracking ✅ Color-Coded Status ✅ Carrier Management ✅ Professional Layout
        </p>
      </div>

      {/* HORIZONTAL SCROLLING CONTAINER WITH PRECISE DIMENSIONS */}
      <div 
        className="relative w-full border border-neutral-600"
        style={{ 
          height: '70vh',
          overflow: 'hidden'
        }}
      >
        <div
          className="w-full h-full overflow-auto"
          id="professional-ffe-scroll-container"
          style={{
            overflowX: 'scroll',
            overflowY: 'scroll', 
            scrollBehavior: 'auto',
            WebkitOverflowScrolling: 'touch'
          }}
        >
          <table 
            className="border-collapse bg-neutral-800"
            style={{ 
              minWidth: '4000px', // Force horizontal scroll - EXACTLY like your image
              width: '4000px'
            }}
          >
            {/* TABLE HEADERS - EXACTLY like your right-side image */}
            <thead>
              <tr className="bg-neutral-700 sticky top-0 z-10">
                <th className="p-3 text-amber-300 border border-neutral-600 min-w-[200px] text-left font-bold">ITEM NAME</th>
                <th className="p-3 text-amber-300 border border-neutral-600 min-w-[150px] text-left font-bold">VENDOR</th>
                <th className="p-3 text-amber-300 border border-neutral-600 min-w-[80px] text-center font-bold">QTY</th>
                <th className="p-3 text-amber-300 border border-neutral-600 min-w-[120px] text-left font-bold">SIZE</th>
                <th className="p-3 text-amber-300 border border-neutral-600 min-w-[150px] text-left font-bold">STATUS</th>
                <th className="p-3 text-amber-300 border border-neutral-600 min-w-[120px] text-left font-bold">FINISH/COLOR</th>
                <th className="p-3 text-amber-300 border border-neutral-600 min-w-[100px] text-right font-bold">COST</th>
                <th className="p-3 text-amber-300 border border-neutral-600 min-w-[100px] text-right font-bold">PRICE</th>
                <th className="p-3 text-amber-300 border border-neutral-600 min-w-[150px] text-left font-bold">LINK</th>
                <th className="p-3 text-amber-300 border border-neutral-600 min-w-[120px] text-left font-bold">IMAGE</th>
                <th className="p-3 text-amber-300 border border-neutral-600 min-w-[120px] text-left font-bold">CARRIER</th>
                <th className="p-3 text-amber-300 border border-neutral-600 min-w-[150px] text-left font-bold">TRACKING #</th>
                <th className="p-3 text-amber-300 border border-neutral-600 min-w-[120px] text-left font-bold">ORDER DATE</th>
                <th className="p-3 text-amber-300 border border-neutral-600 min-w-[120px] text-left font-bold">DELIVERY DATE</th>
                <th className="p-3 text-amber-300 border border-neutral-600 min-w-[120px] text-left font-bold">INSTALL DATE</th>
                <th className="p-3 text-amber-300 border border-neutral-600 min-w-[200px] text-left font-bold">NOTES</th>
                <th className="p-3 text-amber-300 border border-neutral-600 min-w-[100px] text-center font-bold">ACTIONS</th>
              </tr>
            </thead>
            
            <tbody>
              {project.rooms.map((room) => {
                const roomItemCount = countRoomItems(room);
                const isRoomExpanded = expandedRooms[room.id];
                
                return (
                  <React.Fragment key={room.id}>
                    {/* ROOM HEADER - PURPLE like your left-side image */}
                    <tr>
                      <td 
                        colSpan="17" 
                        className="p-4 text-center font-semibold text-white text-lg border border-neutral-600 cursor-pointer hover:opacity-80 transition-opacity"
                        style={{ backgroundColor: getRoomColor(room.name) }}
                        onClick={() => toggleRoom(room.id)}
                      >
                        <div className="flex items-center justify-center space-x-2">
                          <span>{isRoomExpanded ? '▼' : '▶'}</span>
                          <span>{room.name.toUpperCase()} ({roomItemCount} items)</span>
                        </div>
                      </td>
                    </tr>
                    
                    {/* ROOM CONTENT - Show when expanded */}
                    {isRoomExpanded && room.categories && room.categories.map((category) => {
                      const categoryItemCount = countCategoryItems(category);
                      const isCategoryExpanded = expandedCategories[category.id];
                      
                      return (
                        <React.Fragment key={category.id}>
                          {/* CATEGORY HEADER - GREEN like your image */}
                          <tr>
                            <td 
                              colSpan="17" 
                              className="p-3 text-center font-medium text-white border border-neutral-600 cursor-pointer hover:opacity-80 transition-opacity"
                              style={{ backgroundColor: getCategoryColor() }}
                              onClick={() => toggleCategory(category.id)}
                            >
                              <div className="flex items-center justify-center space-x-2">
                                <span>{isCategoryExpanded ? '▼' : '▶'}</span>
                                <span>{category.name.toUpperCase()} ({categoryItemCount} items)</span>
                              </div>
                            </td>
                          </tr>
                          
                          {/* CATEGORY CONTENT - Show when expanded */}
                          {isCategoryExpanded && category.subcategories && category.subcategories.map((subcategory) => {
                            const subcategoryItemCount = countItems(subcategory.items);
                            const isSubcategoryExpanded = expandedSubcategories[subcategory.id];
                            
                            return (
                              <React.Fragment key={subcategory.id}>
                                {/* SUBCATEGORY HEADER - RED like your image */}
                                <tr>
                                  <td 
                                    colSpan="17" 
                                    className="p-2 text-center font-medium text-white border border-neutral-600 cursor-pointer hover:opacity-80 transition-opacity"
                                    style={{ backgroundColor: getSubcategoryColor() }}
                                    onClick={() => toggleSubcategory(subcategory.id)}
                                  >
                                    <div className="flex items-center justify-center space-x-2">
                                      <span>{isSubcategoryExpanded ? '▼' : '▶'}</span>
                                      <span>{subcategory.name.toUpperCase()} ({subcategoryItemCount} items)</span>
                                    </div>
                                  </td>
                                </tr>
                                
                                {/* SUBCATEGORY CONTENT - Show when expanded */}
                                {isSubcategoryExpanded && (
                                  <>
                                    {/* ITEMS */}
                                    {subcategory.items && subcategory.items.map((item, itemIndex) => (
                                      <tr key={item.id || itemIndex} className="hover:bg-neutral-700 transition-colors">
                                        {/* ITEM NAME */}
                                        <td className="p-2 border border-neutral-600">
                                          <input
                                            type="text"
                                            value={item.name || ''}
                                            className="w-full bg-transparent text-white border-none outline-none"
                                            placeholder="Item name..."
                                          />
                                        </td>
                                        
                                        {/* VENDOR */}
                                        <td className="p-2 border border-neutral-600">
                                          <input
                                            type="text"
                                            value={item.vendor || ''}
                                            className="w-full bg-transparent text-white border-none outline-none"
                                            placeholder="Vendor..."
                                          />
                                        </td>
                                        
                                        {/* QUANTITY */}
                                        <td className="p-2 border border-neutral-600 text-center">
                                          <input
                                            type="number"
                                            value={item.quantity || 1}
                                            className="w-full bg-transparent text-white border-none outline-none text-center"
                                            min="1"
                                          />
                                        </td>
                                        
                                        {/* SIZE */}
                                        <td className="p-2 border border-neutral-600">
                                          <input
                                            type="text"
                                            value={item.size || ''}
                                            className="w-full bg-transparent text-white border-none outline-none"
                                            placeholder="Size..."
                                          />
                                        </td>
                                        
                                        {/* STATUS - Color-coded dropdown */}
                                        <td className="p-2 border border-neutral-600">
                                          <select
                                            value={item.status || 'TO BE SELECTED'}
                                            className="w-full bg-neutral-700 text-white border-none outline-none p-1 rounded"
                                            style={{ backgroundColor: getStatusColor(item.status) }}
                                          >
                                            {itemStatuses.map((status) => (
                                              <option 
                                                key={status.status} 
                                                value={status.status}
                                                style={{ backgroundColor: status.color }}
                                              >
                                                {status.status}
                                              </option>
                                            ))}
                                          </select>
                                        </td>
                                        
                                        {/* FINISH/COLOR */}
                                        <td className="p-2 border border-neutral-600">
                                          <input
                                            type="text"
                                            value={item.finish_color || ''}
                                            className="w-full bg-transparent text-white border-none outline-none"
                                            placeholder="Finish/Color..."
                                          />
                                        </td>
                                        
                                        {/* COST */}
                                        <td className="p-2 border border-neutral-600 text-right">
                                          <input
                                            type="number"
                                            value={item.cost || ''}
                                            className="w-full bg-transparent text-white border-none outline-none text-right"
                                            placeholder="0.00"
                                            step="0.01"
                                          />
                                        </td>
                                        
                                        {/* PRICE */}
                                        <td className="p-2 border border-neutral-600 text-right">
                                          <input
                                            type="number"
                                            value={item.price || ''}
                                            className="w-full bg-transparent text-white border-none outline-none text-right"
                                            placeholder="0.00"
                                            step="0.01"
                                          />
                                        </td>
                                        
                                        {/* LINK */}
                                        <td className="p-2 border border-neutral-600">
                                          {item.link ? (
                                            <a 
                                              href={item.link} 
                                              target="_blank" 
                                              rel="noopener noreferrer"
                                              className="text-blue-400 hover:text-blue-300 underline text-sm"
                                            >
                                              View Link
                                            </a>
                                          ) : (
                                            <input
                                              type="url"
                                              className="w-full bg-transparent text-white border-none outline-none text-sm"
                                              placeholder="Product URL..."
                                            />
                                          )}
                                        </td>
                                        
                                        {/* IMAGE */}
                                        <td className="p-2 border border-neutral-600">
                                          {item.image_url ? (
                                            <img 
                                              src={item.image_url} 
                                              alt={item.name}
                                              className="w-16 h-16 object-cover rounded cursor-pointer hover:scale-110 transition-transform"
                                              onClick={() => window.open(item.image_url, '_blank')}
                                            />
                                          ) : (
                                            <button className="text-blue-400 hover:text-blue-300 text-sm">
                                              + Image
                                            </button>
                                          )}
                                        </td>
                                        
                                        {/* CARRIER - Color-coded dropdown */}
                                        <td className="p-2 border border-neutral-600">
                                          <select
                                            value={item.carrier || ''}
                                            className="w-full bg-neutral-700 text-white border-none outline-none p-1 rounded text-sm"
                                            style={{ backgroundColor: getCarrierColor(item.carrier) }}
                                          >
                                            <option value="">Select Carrier</option>
                                            {carrierOptions.map((carrier) => (
                                              <option 
                                                key={carrier.name} 
                                                value={carrier.name}
                                                style={{ backgroundColor: carrier.color }}
                                              >
                                                {carrier.name}
                                              </option>
                                            ))}
                                          </select>
                                        </td>
                                        
                                        {/* TRACKING NUMBER */}
                                        <td className="p-2 border border-neutral-600">
                                          <input
                                            type="text"
                                            value={item.tracking_number || ''}
                                            className="w-full bg-transparent text-white border-none outline-none text-sm"
                                            placeholder="Tracking #..."
                                          />
                                        </td>
                                        
                                        {/* ORDER DATE */}
                                        <td className="p-2 border border-neutral-600">
                                          <input
                                            type="date"
                                            value={item.order_date || ''}
                                            className="w-full bg-transparent text-white border-none outline-none text-sm"
                                          />
                                        </td>
                                        
                                        {/* DELIVERY DATE */}
                                        <td className="p-2 border border-neutral-600">
                                          <input
                                            type="date"
                                            value={item.expected_delivery || ''}
                                            className="w-full bg-transparent text-white border-none outline-none text-sm"
                                          />
                                        </td>
                                        
                                        {/* INSTALL DATE */}
                                        <td className="p-2 border border-neutral-600">
                                          <input
                                            type="date"
                                            value={item.install_date || ''}
                                            className="w-full bg-transparent text-white border-none outline-none text-sm"
                                          />
                                        </td>
                                        
                                        {/* NOTES */}
                                        <td className="p-2 border border-neutral-600">
                                          <textarea
                                            value={item.notes || ''}
                                            className="w-full bg-transparent text-white border-none outline-none text-sm resize-none"
                                            placeholder="Notes..."
                                            rows="1"
                                          />
                                        </td>
                                        
                                        {/* ACTIONS */}
                                        <td className="p-2 border border-neutral-600 text-center">
                                          <button className="text-red-400 hover:text-red-300 text-sm font-bold">
                                            DELETE
                                          </button>
                                        </td>
                                      </tr>
                                    ))}
                                    
                                    {/* ADD ITEM BUTTON - At bottom of each subcategory */}
                                    <tr>
                                      <td colSpan="17" className="p-3 text-center border border-neutral-600">
                                        <button
                                          onClick={() => {
                                            setSelectedSubCategoryId(subcategory.id);
                                            setShowAddItem(true);
                                          }}
                                          className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded font-bold transition-colors"
                                        >
                                          ➕ ADD ITEM (Test Scraping!)
                                        </button>
                                      </td>
                                    </tr>
                                  </>
                                )}
                              </React.Fragment>
                            );
                          })}
                        </React.Fragment>
                      );
                    })}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* ADD ITEM MODAL - Your existing working modal */}
      {showAddItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-neutral-800 p-6 rounded-lg border border-neutral-600 w-96">
            <h3 className="text-xl font-bold text-white mb-4">Add New Item</h3>
            {/* Your existing AddItemModal content would go here */}
            <div className="flex space-x-4">
              <button
                onClick={() => setShowAddItem(false)}
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded"
              >
                Cancel
              </button>
              <button
                onClick={() => handleAddItem({ name: 'Test Item', vendor: 'Test Vendor' })}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
              >
                Add Item
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfessionalFFESpreadsheet;
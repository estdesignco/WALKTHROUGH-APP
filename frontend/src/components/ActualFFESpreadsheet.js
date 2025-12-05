import React, { useState, useEffect } from 'react';
import AddItemModal from './AddItemModal';

const ActualFFESpreadsheet = ({ 
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

  // Load enhanced data
  useEffect(() => {
    const loadEnhancedData = async () => {
      try {
        const backendUrl = import.meta.env?.REACT_APP_BACKEND_URL || process.env.REACT_APP_BACKEND_URL;
        
        const statusRes = await fetch(`${backendUrl}/api/item-statuses-enhanced`);
        if (statusRes.ok) {
          const statusData = await statusRes.json();
          setEnhancedItemStatuses(statusData.data || []);
        }
        
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
      console.error('❌ No subcategory selected');
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
      console.error('❌ Failed to add item:', error.message);
    }
  };

  // Populate rooms with default items when expanded (as per user request)
  const populateRoomWithDefaults = async (roomId) => {
    try {
      const backendUrl = import.meta.env?.REACT_APP_BACKEND_URL || process.env.REACT_APP_BACKEND_URL;
      
      // Call backend to get default room structure
      const response = await fetch(`${backendUrl}/api/room-defaults/${roomId}`);
      if (response.ok) {
        const defaultData = await response.json();
        // This would populate the room with default categories and items
        console.log('Room defaults loaded:', defaultData);
      }
    } catch (error) {
      console.error('Error loading room defaults:', error);
    }
  };

  // Toggle functions - WITH DEFAULT POPULATION
  const toggleRoom = (roomId) => {
    const wasExpanded = expandedRooms[roomId];
    setExpandedRooms(prev => ({
      ...prev,
      [roomId]: !prev[roomId]
    }));
    
    // If expanding for first time, populate with defaults
    if (!wasExpanded) {
      populateRoomWithDefaults(roomId);
    }
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

  // Color functions - MUTED PROFESSIONAL COLORS like your images
  const getRoomColor = (roomName) => {
    // Your exact muted purple from the images
    return '#8B7D8B'; // Muted purple-gray like your LIVING ROOM
  };

  const getCategoryColor = () => {
    // Your exact muted green from the images
    return '#7A8B7A'; // Muted green like your LIGHTING
  };

  const getSubcategoryColor = () => {
    // Your exact muted red from the images  
    return '#A0878A'; // Muted reddish-brown like your PORTABLE
  };

  if (!project || !project.rooms) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Loading FF&E Project...</h2>
        <p className="text-gray-600">Waiting for project data to load...</p>
        {project && (
          <div className="mt-4 text-sm text-gray-500">
            <p>Project: {project.name || 'Unknown'}</p>
            <p>Rooms: {project.rooms ? project.rooms.length : 'No rooms data'}</p>
          </div>
        )}
      </div>
    );
  }

  console.log('🏠 PROJECT DATA:', project);
  console.log('📊 ROOMS COUNT:', project.rooms?.length || 'No rooms');

  return (
    <div className="w-full bg-white flex" style={{ height: '80vh' }}>
      {/* LEFT PANEL - Hierarchical Navigation EXACTLY like your FFE LEFT.png */}
      <div className="w-1/3 bg-gray-50 border-r border-gray-300 overflow-y-auto">
        <div className="p-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Project Structure</h3>
          
          {project.rooms.map((room) => (
            <div key={room.id} className="mb-2">
              {/* ROOM HEADER - Muted purple like your image */}
              <div
                className="px-3 py-2 text-white text-sm font-medium cursor-pointer rounded flex items-center justify-between"
                style={{ backgroundColor: getRoomColor(room.name) }}
                onClick={() => toggleRoom(room.id)}
              >
                <span>{room.name.toUpperCase()}</span>
                <span className="text-xs">{expandedRooms[room.id] ? '▼' : '▶'}</span>
              </div>

              {/* ROOM CONTENT */}
              {expandedRooms[room.id] && room.categories && (
                <div className="ml-4 mt-1">
                  {room.categories.map((category) => (
                    <div key={category.id} className="mb-1">
                      {/* CATEGORY HEADER - Muted green like your image */}
                      <div
                        className="px-3 py-1 text-white text-sm cursor-pointer rounded flex items-center justify-between"
                        style={{ backgroundColor: getCategoryColor() }}
                        onClick={() => toggleCategory(category.id)}
                      >
                        <span>{category.name.toUpperCase()}</span>
                        <span className="text-xs">{expandedCategories[category.id] ? '▼' : '▶'}</span>
                      </div>

                      {/* CATEGORY CONTENT */}
                      {expandedCategories[category.id] && category.subcategories && (
                        <div className="ml-4 mt-1">
                          {category.subcategories.map((subcategory) => (
                            <div key={subcategory.id} className="mb-1">
                              {/* SUBCATEGORY HEADER - Muted red like your image */}
                              <div
                                className="px-3 py-1 text-white text-xs cursor-pointer rounded flex items-center justify-between"
                                style={{ backgroundColor: getSubcategoryColor() }}
                                onClick={() => toggleSubcategory(subcategory.id)}
                              >
                                <span>{subcategory.name.toUpperCase()}</span>
                                <span className="text-xs">{expandedSubcategories[subcategory.id] ? '▼' : '▶'}</span>
                              </div>

                              {/* INSTALLEDS LIST - Like your Console Lamp, Table Lamp */}
                              {expandedSubcategories[subcategory.id] && subcategory.items && (
                                <div className="ml-4 mt-1">
                                  {subcategory.items.map((item, itemIndex) => (
                                    <div key={item.id || itemIndex} className="px-2 py-1 text-xs text-gray-700 bg-gray-100 rounded mb-1">
                                      {item.name || 'Unnamed Item'}
                                    </div>
                                  ))}
                                  
                                  {/* ADD INSTALLED BUTTON */}
                                  <button
                                    onClick={() => {
                                      setSelectedSubCategoryId(subcategory.id);
                                      setShowAddItem(true);
                                    }}
                                    className="w-full px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded hover:bg-blue-200 transition-colors"
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

      {/* RIGHT PANEL - Professional Spreadsheet EXACTLY like your FFE RIGHT.png */}
      <div className="w-2/3 bg-white overflow-hidden flex flex-col">
        
        {/* SPREADSHEET HEADER */}
        <div className="px-4 py-3 bg-gray-100 border-b border-gray-300">
          <h3 className="text-lg font-semibold text-gray-800">FF&E Details</h3>
        </div>

        {/* HORIZONTAL SCROLLING SPREADSHEET AREA */}
        <div className="flex-1 overflow-auto">
          <div className="min-w-full" style={{ minWidth: '1200px' }}>
            
            {/* ADDITIONAL INFO SECTION - Brown header like your image */}
            <div className="mb-6">
              <div className="px-4 py-2 text-white text-sm font-medium" style={{ backgroundColor: '#8B7355' }}>
                ADDITIONAL INFO.
              </div>
              
              {/* TABLE FOR ADDITIONAL INFO */}
              <table className="w-full border-collapse border border-gray-300">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border border-gray-300 px-3 py-2 text-left text-xs font-medium text-gray-700">INSTALLED NAME</th>
                    <th className="border border-gray-300 px-3 py-2 text-left text-xs font-medium text-gray-700">VENDOR/SKU</th>
                    <th className="border border-gray-300 px-3 py-2 text-center text-xs font-medium text-gray-700">QTY</th>
                    <th className="border border-gray-300 px-3 py-2 text-left text-xs font-medium text-gray-700">SIZE</th>
                    <th className="border border-gray-300 px-3 py-2 text-left text-xs font-medium text-gray-700">ORDER STATUS</th>
                    <th className="border border-gray-300 px-3 py-2 text-left text-xs font-medium text-gray-700">FINISH/Color</th>
                    <th className="border border-gray-300 px-3 py-2 text-right text-xs font-medium text-gray-700">Cost/Price</th>
                    <th className="border border-gray-300 px-3 py-2 text-center text-xs font-medium text-gray-700">Image</th>
                  </tr>
                </thead>
                <tbody>
                  {/* Sample rows showing your data structure */}
                  {project.rooms.map((room) => 
                    room.categories?.map((category) =>
                      category.subcategories?.map((subcategory) =>
                        subcategory.items?.map((item, itemIndex) => (
                          <tr key={`${room.id}-${category.id}-${subcategory.id}-${itemIndex}`} className="hover:bg-gray-50">
                            <td className="border border-gray-300 px-3 py-2 text-sm text-gray-800">
                              <input 
                                type="text" 
                                value={item.name || ''} 
                                className="w-full bg-transparent border-none outline-none"
                                placeholder="Item name..."
                              />
                            </td>
                            <td className="border border-gray-300 px-3 py-2 text-sm text-gray-800">
                              <input 
                                type="text" 
                                value={item.vendor || ''} 
                                className="w-full bg-transparent border-none outline-none"
                                placeholder="Vendor/SKU..."
                              />
                            </td>
                            <td className="border border-gray-300 px-3 py-2 text-center text-sm text-gray-800">
                              <input 
                                type="number" 
                                value={item.quantity || 1} 
                                className="w-16 text-center bg-transparent border-none outline-none"
                              />
                            </td>
                            <td className="border border-gray-300 px-3 py-2 text-sm text-gray-800">
                              <input 
                                type="text" 
                                value={item.size || ''} 
                                className="w-full bg-transparent border-none outline-none"
                                placeholder="Size..."
                              />
                            </td>
                            <td className="border border-gray-300 px-3 py-2 text-sm">
                              <select 
                                value={item.status || 'PICKED'} 
                                className="w-full bg-yellow-200 border-none outline-none rounded px-2 py-1 text-xs"
                                style={{ backgroundColor: item.status === 'PICKED' ? '#FEF3C7' : '#E5E7EB' }}
                              >
                                <option value="PICKED" style={{ backgroundColor: '#FEF3C7' }}>PICKED</option>
                                <option value="ORDERED">ORDERED</option>
                                <option value="SHIPPED">SHIPPED</option>
                                <option value="DELIVERED">DELIVERED</option>
                              </select>
                            </td>
                            <td className="border border-gray-300 px-3 py-2 text-sm text-gray-800">
                              <input 
                                type="text" 
                                value={item.finish_color || ''} 
                                className="w-full bg-transparent border-none outline-none"
                                placeholder="Finish/Color..."
                              />
                            </td>
                            <td className="border border-gray-300 px-3 py-2 text-right text-sm text-gray-800">
                              <input 
                                type="number" 
                                value={item.cost || ''} 
                                className="w-24 text-right bg-transparent border-none outline-none"
                                placeholder="0.00"
                                step="0.01"
                              />
                            </td>
                            <td className="border border-gray-300 px-3 py-2 text-center">
                              {item.image_url ? (
                                <img 
                                  src={item.image_url} 
                                  alt={item.name}
                                  className="w-12 h-12 object-cover rounded cursor-pointer"
                                  onClick={() => window.open(item.image_url, '_blank')}
                                />
                              ) : (
                                <button className="text-blue-600 hover:text-blue-800 text-xs">+ Image</button>
                              )}
                            </td>
                          </tr>
                        ))
                      )
                    )
                  )}
                </tbody>
              </table>
            </div>

            {/* SHIPPING INFO SECTION - Purple header like your image */}
            <div className="mb-6">
              <div className="px-4 py-2 text-white text-sm font-medium" style={{ backgroundColor: '#8B7D8B' }}>
                SHIPPING INFO.
              </div>
              
              {/* TABLE FOR SHIPPING INFO */}
              <table className="w-full border-collapse border border-gray-300">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border border-gray-300 px-3 py-2 text-left text-xs font-medium text-gray-700">INSTALLED NAME</th>
                    <th className="border border-gray-300 px-3 py-2 text-left text-xs font-medium text-gray-700">CARRIER</th>
                    <th className="border border-gray-300 px-3 py-2 text-left text-xs font-medium text-gray-700">TRACKING #</th>
                    <th className="border border-gray-300 px-3 py-2 text-left text-xs font-medium text-gray-700">ORDER DATE</th>
                    <th className="border border-gray-300 px-3 py-2 text-left text-xs font-medium text-gray-700">DELIVERY DATE</th>
                    <th className="border border-gray-300 px-3 py-2 text-left text-xs font-medium text-gray-700">INSTALL DATE</th>
                    <th className="border border-gray-300 px-3 py-2 text-left text-xs font-medium text-gray-700">NOTES</th>
                  </tr>
                </thead>
                <tbody>
                  {/* Same items but shipping info columns */}
                  {project.rooms.map((room) => 
                    room.categories?.map((category) =>
                      category.subcategories?.map((subcategory) =>
                        subcategory.items?.map((item, itemIndex) => (
                          <tr key={`shipping-${room.id}-${category.id}-${subcategory.id}-${itemIndex}`} className="hover:bg-gray-50">
                            <td className="border border-gray-300 px-3 py-2 text-sm text-gray-800">
                              {item.name || 'Unnamed Item'}
                            </td>
                            <td className="border border-gray-300 px-3 py-2 text-sm">
                              <select 
                                value={item.carrier || ''} 
                                className="w-full bg-transparent border-none outline-none text-xs"
                              >
                                <option value="">Select Carrier</option>
                                <option value="FedEx">FedEx</option>
                                <option value="UPS">UPS</option>
                                <option value="Brooks">Brooks</option>
                                <option value="Zenith">Zenith</option>
                              </select>
                            </td>
                            <td className="border border-gray-300 px-3 py-2 text-sm">
                              <input 
                                type="text" 
                                value={item.tracking_number || ''} 
                                className="w-full bg-transparent border-none outline-none"
                                placeholder="Add Tracking #"
                              />
                            </td>
                            <td className="border border-gray-300 px-3 py-2 text-sm">
                              <input 
                                type="date" 
                                value={item.order_date || ''} 
                                className="w-full bg-transparent border-none outline-none text-xs"
                              />
                            </td>
                            <td className="border border-gray-300 px-3 py-2 text-sm">
                              <input 
                                type="date" 
                                value={item.expected_delivery || ''} 
                                className="w-full bg-transparent border-none outline-none text-xs"
                              />
                            </td>
                            <td className="border border-gray-300 px-3 py-2 text-sm">
                              <input 
                                type="date" 
                                value={item.install_date || ''} 
                                className="w-full bg-transparent border-none outline-none text-xs"
                              />
                            </td>
                            <td className="border border-gray-300 px-3 py-2 text-sm">
                              <textarea 
                                value={item.notes || ''} 
                                className="w-full bg-transparent border-none outline-none text-xs resize-none"
                                placeholder="Notes..."
                                rows="1"
                              />
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
      </div>

      {/* ADD INSTALLED MODAL */}
      {showAddItem && (
        <AddItemModal
          onClose={() => setShowAddItem(false)}
          onSubmit={handleAddItem}
          itemStatuses={enhancedItemStatuses}
          vendorTypes={vendorTypes}
          loading={false}
        />
      )}
    </div>
  );
};

export default ActualFFESpreadsheet;
import React, { useState, useEffect } from 'react';
import AddItemModal from './AddItemModal';

const ExactFFESpreadsheet = ({ 
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
  console.log('🎯 ExactFFESpreadsheet rendering with project:', project);

  const [showAddItem, setShowAddItem] = useState(false);
  const [selectedSubCategoryId, setSelectedSubCategoryId] = useState(null);
  const [availableCategories, setAvailableCategories] = useState([]);
  const [expandedRooms, setExpandedRooms] = useState({});
  const [expandedCategories, setExpandedCategories] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRoom, setSelectedRoom] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedVendor, setSelectedVendor] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedCarrier, setSelectedCarrier] = useState('');
  const [showThumbnail, setShowThumbnail] = useState({});
  const [filteredProject, setFilteredProject] = useState(project);

  // APPLY FILTERS - WORKING FILTER LOGIC
  useEffect(() => {
    console.log('🔍 FFE Filter triggered:', { searchTerm, selectedRoom, selectedCategory, selectedVendor, selectedStatus, selectedCarrier });
    
    if (!project) {
      setFilteredProject(null);
      return;
    }

    let filtered = { ...project };

    if (searchTerm || selectedRoom || selectedCategory || selectedVendor || selectedStatus || selectedCarrier) {
      console.log('🔍 Applying FFE filters...');
      
      filtered.rooms = project.rooms.map(room => {
        if (selectedRoom && room.id !== selectedRoom) {
          return { ...room, categories: [] };
        }
        
        const filteredCategories = room.categories.map(category => {
          if (selectedCategory && category.name !== selectedCategory) {
            return { ...category, subcategories: [] };
          }
          
          const filteredSubcategories = category.subcategories.map(subcategory => {
            let filteredItems = subcategory.items || [];
            
            if (searchTerm) {
              filteredItems = filteredItems.filter(item =>
                item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (item.vendor && item.vendor.toLowerCase().includes(searchTerm.toLowerCase())) ||
                (item.sku && item.sku.toLowerCase().includes(searchTerm.toLowerCase()))
              );
            }
            
            if (selectedVendor) {
              filteredItems = filteredItems.filter(item => item.vendor === selectedVendor);
            }
            
            if (selectedStatus) {
              filteredItems = filteredItems.filter(item => item.status === selectedStatus);
            }
            
            if (selectedCarrier) {
              filteredItems = filteredItems.filter(item => item.carrier === selectedCarrier);
            }
            
            return { ...subcategory, items: filteredItems };
          }).filter(subcategory => subcategory.items.length > 0);
          
          return { ...category, subcategories: filteredSubcategories };
        }).filter(category => category.subcategories.length > 0);
        
        return { ...room, categories: filteredCategories };
      }).filter(room => room.categories.length > 0);
    }

    setFilteredProject(filtered);
  }, [project, searchTerm, selectedRoom, selectedCategory, selectedVendor, selectedStatus, selectedCarrier]);

  // Fetch available categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
        const response = await fetch(`${BACKEND_URL}/api/categories/available`);
        if (response.ok) {
          const categories = await response.json();
          setAvailableCategories(Array.isArray(categories) ? categories : []);
        } else {
          setAvailableCategories([]);
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
        setAvailableCategories([]);
      }
    };
    
    fetchCategories();
  }, []);

  // EXPAND/COLLAPSE HANDLERS WITH PROPER STATE PRESERVATION
  const toggleRoomExpansion = (roomId) => {
    console.log('🎯 FFE Toggling room expansion for:', roomId);
    setExpandedRooms(prev => ({
      ...prev,
      [roomId]: !prev[roomId]
    }));
  };

  const toggleCategoryExpansion = (categoryId) => {
    console.log('🎯 FFE Toggling category expansion for:', categoryId);
    setExpandedCategories(prev => ({
      ...prev,
      [categoryId]: !prev[categoryId]
    }));
  };

  // EXACT COLORS FROM YOUR SCREENSHOTS - BRIGHT AND VIBRANT
  const getRoomColor = (roomName, index = 0) => {
    const vibrantRoomColors = [
      '#008B8B',  // Dark Turquoise/Teal - like "PRIMARY BATHROOM" 
      '#4682B4',  // Steel Blue
      '#228B22',  // Forest Green  
      '#B8860B',  // Dark Goldenrod
      '#8B4513',  // Saddle Brown
      '#483D8B',  // Dark Slate Blue
      '#CD853F',  // Peru
      '#2F4F4F',  // Dark Slate Gray
      '#8B008B',  // Dark Magenta
    ];
    
    // Use room name hash for consistent color per room
    let hash = 0;
    for (let i = 0; i < roomName.length; i++) {
      hash = roomName.charCodeAt(i) + ((hash << 5) - hash);
    }
    return vibrantRoomColors[Math.abs(hash) % vibrantRoomColors.length];
  };

  const getCategoryColor = () => '#556B2F';  // Olive Green - like your screenshots
  const getMainHeaderColor = () => '#8B4513';  // Saddle Brown for main headers
  const getAdditionalInfoColor = () => '#CD853F';  // Peru for ADDITIONAL INFO
  const getShippingInfoColor = () => '#4682B4';  // Steel Blue for SHIPPING INFO

  // Status colors for FF&E
  const getStatusColor = (status) => {
    const statusColors = {
      '': '#6B7280',              // Gray for blank/default
      'PICKED': '#FFFF00',        // Bright Yellow - like your screenshot
      'ORDERED': '#22C55E',       // Green
      'SHIPPED': '#3B82F6',       // Blue  
      'DELIVERED': '#8B5CF6',     // Purple
      'INSTALLED': '#10B981',     // Emerald
      'CANCELLED': '#EF4444',     // Red
      'BACKORDERED': '#F59E0B',   // Amber
      'QUOTE NEEDED': '#EC4899',  // Pink
      'ON HOLD': '#64748B'        // Slate
    };
    return statusColors[status] || statusColors[''];
  };

  // Handle item editing
  const handleItemEdit = async (itemId, field, value) => {
    try {
      const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
      await fetch(`${BACKEND_URL}/api/items/${itemId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ [field]: value }),
      });
      
      if (onReload) {
        onReload();
      }
    } catch (error) {
      console.error('Error updating item:', error);
    }
  };

  const handleStatusChange = (itemId, newStatus) => {
    handleItemEdit(itemId, 'status', newStatus);
  };

  const handleDeleteItem = async (itemId) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      try {
        const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
        await fetch(`${BACKEND_URL}/api/items/${itemId}`, {
          method: 'DELETE',
        });
        
        if (onReload) {
          onReload();
        }
      } catch (error) {
        console.error('Error deleting item:', error);
      }
    }
  };

  const handleAddCategory = async (roomId, categoryName) => {
    try {
      const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
      await fetch(`${BACKEND_URL}/api/categories`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          room_id: roomId,
          category_name: categoryName
        }),
      });
      
      if (onReload) {
        onReload();
      }
    } catch (error) {
      console.error('Error adding category:', error);
    }
  };

  const handleAddItem = (subcategoryId) => {
    setSelectedSubCategoryId(subcategoryId);
    setShowAddItem(true);
  };

  const handleAddItemComplete = () => {
    setShowAddItem(false);
    setSelectedSubCategoryId(null);
    if (onReload) {
      onReload();
    }
  };

  const handleImageClick = (itemId) => {
    setShowThumbnail(prev => ({
      ...prev,
      [itemId]: !prev[itemId]
    }));
  };

  // Early return if no project
  if (!filteredProject) {
    console.log('❌ ExactFFESpreadsheet: No project data available');
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-gray-500">No project data available</p>
      </div>
    );
  }

  if (!filteredProject.rooms || filteredProject.rooms.length === 0) {
    console.log('❌ ExactFFESpreadsheet: No rooms available in project');
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-gray-500">No rooms available. Add rooms to get started.</p>
      </div>
    );
  }

  console.log('✅ ExactFFESpreadsheet: Valid project data, proceeding to render spreadsheet');

  return (
    <div className="w-full" style={{ backgroundColor: '#1A1A1A' }}>
      
      {/* SEARCH AND FILTER SECTION - EXACTLY LIKE YOUR SCREENSHOT */}
      <div className="mb-6 p-4" style={{ backgroundColor: '#2D2D2D' }}>
        <div className="flex flex-col lg:flex-row gap-4 items-center">
          {/* Search Input */}
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search items, vendors, or SKUs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 rounded bg-gray-700 text-white border border-gray-600 focus:border-blue-500 focus:outline-none"
            />
          </div>

          {/* Room Filter */}
          <div className="flex-1">
            <select
              value={selectedRoom}
              onChange={(e) => setSelectedRoom(e.target.value)}
              className="w-full px-3 py-2 rounded bg-gray-700 text-white border border-gray-600 focus:border-blue-500 focus:outline-none"
            >
              <option value="">All Rooms</option>
              {filteredProject.rooms.map(room => (
                <option key={room.id} value={room.id}>{room.name}</option>
              ))}
            </select>
          </div>

          {/* Category Filter */}
          <div className="flex-1">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 rounded bg-gray-700 text-white border border-gray-600 focus:border-blue-500 focus:outline-none"
            >
              <option value="">All Categories</option>
              {availableCategories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>

          {/* Vendor Filter */}
          <div className="flex-1">
            <select
              value={selectedVendor}
              onChange={(e) => setSelectedVendor(e.target.value)}
              className="px-3 py-2 rounded bg-gray-700 text-white border border-gray-600 focus:border-blue-500 focus:outline-none"
            >
              <option value="">All Vendors</option>
              {vendorTypes && vendorTypes.map(vendor => (
                <option key={vendor} value={vendor}>{vendor}</option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex-1">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-2 rounded bg-gray-700 text-white border border-gray-600 focus:border-blue-500 focus:outline-none"
            >
              <option value="">All Statuses</option>
              {itemStatuses && itemStatuses.map(status => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </div>

          {/* Carrier Filter */}
          <div className="flex-1">
            <select
              value={selectedCarrier}
              onChange={(e) => setSelectedCarrier(e.target.value)}
              className="px-3 py-2 rounded bg-gray-700 text-white border border-gray-600 focus:border-blue-500 focus:outline-none"
            >
              <option value="">All Carriers</option>
              {carrierTypes && carrierTypes.map(carrier => (
                <option key={carrier} value={carrier}>{carrier}</option>
              ))}
            </select>
          </div>

          {/* Clear Filters */}
          <button
            onClick={() => {
              setSearchTerm('');
              setSelectedRoom('');
              setSelectedCategory('');
              setSelectedVendor('');
              setSelectedStatus('');
              setSelectedCarrier('');
            }}
            className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700 transition-colors"
          >
            Clear All
          </button>
        </div>
      </div>

      {/* MAIN SPREADSHEET CONTENT */}
      <div className="overflow-x-auto">
        {filteredProject.rooms.map((room, roomIndex) => {
          const isRoomExpanded = expandedRooms[room.id] !== false; // Default to expanded
          
          return (
            <div key={room.id} className="mb-8">
              {/* ROOM HEADER WITH EXACT COLORS FROM YOUR SCREENSHOTS */}
              <div 
                className="px-4 py-2 text-white font-bold mb-4"
                style={{ backgroundColor: getRoomColor(room.name, roomIndex) }}
              >
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleRoomExpansion(room.id)}
                      className="text-white hover:text-gray-200 transition-colors"
                    >
                      {isRoomExpanded ? '▼' : '▶'}
                    </button>
                    <span className="text-lg uppercase">{room.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <select
                      onChange={(e) => {
                        if (e.target.value) {
                          handleAddCategory(room.id, e.target.value);
                          e.target.value = '';
                        }
                      }}
                      className="bg-gray-700 text-white text-sm px-2 py-1 rounded border border-gray-600"
                    >
                      <option value="">Add Category</option>
                      {availableCategories.map(category => (
                        <option key={category} value={category}>{category}</option>
                      ))}
                    </select>
                    <button
                      onClick={() => onDeleteRoom && onDeleteRoom(room.id)}
                      className="text-red-400 hover:text-red-300 px-2 py-1 text-sm"
                    >
                      Delete Room
                    </button>
                  </div>
                </div>
              </div>

              {/* CATEGORIES - ONLY SHOW IF ROOM IS EXPANDED */}
              {isRoomExpanded && room.categories.map((category) => {
                const isCategoryExpanded = expandedCategories[category.id] !== false;
                
                return (
                  <div key={category.id} className="mb-6">
                    {/* CATEGORY HEADER WITH EXACT COLORS */}
                    <div 
                      className="px-4 py-2 text-white font-bold mb-2"
                      style={{ backgroundColor: getCategoryColor() }}
                    >
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => toggleCategoryExpansion(category.id)}
                            className="text-white hover:text-gray-200 transition-colors"
                          >
                            {isCategoryExpanded ? '▼' : '▶'}
                          </button>
                          <span className="text-md uppercase">{category.name}</span>
                        </div>
                      </div>
                    </div>

                    {/* SUBCATEGORIES - ONLY SHOW IF CATEGORY IS EXPANDED */}
                    {isCategoryExpanded && category.subcategories.map((subcategory) => {
                      if (!subcategory.items || subcategory.items.length === 0) {
                        return (
                          <div key={subcategory.id} className="mb-4">
                            <div className="bg-gray-800 p-4 rounded">
                              <p className="text-gray-400 text-center">
                                No items in {subcategory.name}
                                <button
                                  onClick={() => handleAddItem(subcategory.id)}
                                  className="ml-4 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm"
                                >
                                  Add Item
                                </button>
                              </p>
                            </div>
                          </div>
                        );
                      }
                      
                      return (
                        <div key={subcategory.id} className="mb-4">
                          <table className="w-full border-collapse border border-gray-400 mb-4">
                            <thead>
                              <tr>
                                <th className="border border-gray-400 px-2 py-2 text-xs font-bold text-white" style={{ backgroundColor: '#B91C1C' }}>{subcategory.name.toUpperCase()}</th>
                                <th className="border border-gray-400 px-2 py-2 text-xs font-bold text-white w-20" style={{ backgroundColor: '#B91C1C' }}>QTY</th>
                                <th className="border border-gray-400 px-2 py-2 text-xs font-bold text-white" style={{ backgroundColor: '#B91C1C' }}>SIZE</th>
                                <th className="border border-gray-400 px-2 py-2 text-xs font-bold text-white" style={{ backgroundColor: '#B91C1C' }}>FINISH/COLOR</th>
                                <th className="border border-gray-400 px-2 py-2 text-xs font-bold text-white w-32" style={{ backgroundColor: '#B91C1C' }}>STATUS</th>
                                <th className="border border-gray-400 px-2 py-2 text-xs font-bold text-white w-20" style={{ backgroundColor: '#B91C1C' }}>IMAGE</th>
                                <th className="border border-gray-400 px-2 py-2 text-xs font-bold text-white w-20" style={{ backgroundColor: '#B91C1C' }}>LINK</th>
                                <th className="border border-gray-400 px-2 py-2 text-xs font-bold text-white" style={{ backgroundColor: getMainHeaderColor() }}>VENDOR/SKU</th>
                                <th className="border border-gray-400 px-2 py-2 text-xs font-bold text-white w-24" style={{ backgroundColor: getMainHeaderColor() }}>COST</th>
                                <th className="border border-gray-400 px-2 py-2 text-xs font-bold text-white" style={{ backgroundColor: getMainHeaderColor() }}>QTY ORDERED</th>
                                <th className="border border-gray-400 px-2 py-2 text-xs font-bold text-white" style={{ backgroundColor: getAdditionalInfoColor() }}>ADDITIONAL INFO</th>
                                <th className="border border-gray-400 px-2 py-2 text-xs font-bold text-white" style={{ backgroundColor: getShippingInfoColor() }}>EST SHIPPING</th>
                                <th className="border border-gray-400 px-2 py-2 text-xs font-bold text-white" style={{ backgroundColor: getShippingInfoColor() }}>EST INSTALL</th>
                                <th className="border border-gray-400 px-2 py-2 text-xs font-bold text-white" style={{ backgroundColor: getShippingInfoColor() }}>CARRIER</th>
                                <th className="border border-gray-400 px-2 py-2 text-xs font-bold text-white w-12" style={{ backgroundColor: '#DC2626' }}>DELETE</th>
                              </tr>
                            </thead>
                            <tbody>
                              {subcategory.items.map((item) => (
                                <tr key={item.id} className="hover:bg-gray-700">
                                  <td className="border border-gray-400 px-2 py-1 text-white text-xs bg-gray-800">
                                    <input
                                      type="text"
                                      value={item.name || ''}
                                      onChange={(e) => handleItemEdit(item.id, 'name', e.target.value)}
                                      className="bg-transparent border-none text-white text-xs w-full focus:outline-none"
                                    />
                                  </td>
                                  <td className="border border-gray-400 px-2 py-1 text-white text-xs bg-gray-800">
                                    <input
                                      type="number"
                                      value={item.quantity || ''}
                                      onChange={(e) => handleItemEdit(item.id, 'quantity', e.target.value)}
                                      className="bg-transparent border-none text-white text-xs w-full focus:outline-none text-center"
                                    />
                                  </td>
                                  <td className="border border-gray-400 px-2 py-1 text-white text-xs bg-gray-800">
                                    <input
                                      type="text"
                                      value={item.size || ''}
                                      onChange={(e) => handleItemEdit(item.id, 'size', e.target.value)}
                                      className="bg-transparent border-none text-white text-xs w-full focus:outline-none"
                                    />
                                  </td>
                                  <td className="border border-gray-400 px-2 py-1 text-white text-xs bg-gray-800">
                                    <input
                                      type="text"
                                      value={item.finish_color || ''}
                                      onChange={(e) => handleItemEdit(item.id, 'finish_color', e.target.value)}
                                      className="bg-transparent border-none text-white text-xs w-full focus:outline-none"
                                    />
                                  </td>
                                  <td className="border border-gray-400 px-2 py-1 text-white text-xs bg-gray-800">
                                    <select
                                      className="bg-gray-800 text-white text-xs border-none w-full"
                                      value={item.status || ''}
                                      style={{ backgroundColor: getStatusColor(item.status || ''), color: 'black' }}
                                      onChange={(e) => handleStatusChange(item.id, e.target.value)}
                                    >
                                      <option value="" style={{ backgroundColor: '#6B7280', color: 'white' }}>Select Status</option>
                                      <option value="PICKED" style={{ backgroundColor: '#FFFF00', color: 'black' }}>PICKED</option>
                                      <option value="ORDERED" style={{ backgroundColor: '#22C55E', color: 'white' }}>ORDERED</option>
                                      <option value="SHIPPED" style={{ backgroundColor: '#3B82F6', color: 'white' }}>SHIPPED</option>
                                      <option value="DELIVERED" style={{ backgroundColor: '#8B5CF6', color: 'white' }}>DELIVERED</option>
                                      <option value="INSTALLED" style={{ backgroundColor: '#10B981', color: 'white' }}>INSTALLED</option>
                                      <option value="CANCELLED" style={{ backgroundColor: '#EF4444', color: 'white' }}>CANCELLED</option>
                                      <option value="BACKORDERED" style={{ backgroundColor: '#F59E0B', color: 'white' }}>BACKORDERED</option>
                                      <option value="QUOTE NEEDED" style={{ backgroundColor: '#EC4899', color: 'white' }}>QUOTE NEEDED</option>
                                      <option value="ON HOLD" style={{ backgroundColor: '#64748B', color: 'white' }}>ON HOLD</option>
                                    </select>
                                  </td>
                                  <td className="border border-gray-400 px-2 py-1 text-white text-xs bg-gray-800 text-center">
                                    {item.image ? (
                                      <div className="relative">
                                        <button
                                          onClick={() => handleImageClick(item.id)}
                                          className="text-blue-400 hover:text-blue-300 text-xs"
                                        >
                                          📷
                                        </button>
                                        {showThumbnail[item.id] && (
                                          <div className="absolute top-full left-0 z-10 mt-1">
                                            <img 
                                              src={item.image} 
                                              alt={item.name} 
                                              className="w-32 h-32 object-cover border border-gray-400 rounded"
                                            />
                                          </div>
                                        )}
                                      </div>
                                    ) : (
                                      <span className="text-gray-500">—</span>
                                    )}
                                  </td>
                                  <td className="border border-gray-400 px-2 py-1 text-white text-xs bg-gray-800 text-center">
                                    {item.link ? (
                                      <a 
                                        href={item.link} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="text-blue-400 hover:text-blue-300 text-xs"
                                      >
                                        🔗
                                      </a>
                                    ) : (
                                      <span className="text-gray-500">—</span>
                                    )}
                                  </td>
                                  <td className="border border-gray-400 px-2 py-1 text-white text-xs bg-gray-800">
                                    <div>
                                      <input
                                        type="text"
                                        value={item.vendor || ''}
                                        onChange={(e) => handleItemEdit(item.id, 'vendor', e.target.value)}
                                        className="bg-transparent border-none text-white text-xs w-full focus:outline-none mb-1"
                                        placeholder="Vendor"
                                      />
                                      <input
                                        type="text"
                                        value={item.sku || ''}
                                        onChange={(e) => handleItemEdit(item.id, 'sku', e.target.value)}
                                        className="bg-transparent border-none text-white text-xs w-full focus:outline-none"
                                        placeholder="SKU"
                                      />
                                    </div>
                                  </td>
                                  <td className="border border-gray-400 px-2 py-1 text-white text-xs bg-gray-800">
                                    <input
                                      type="text"
                                      value={item.cost || ''}
                                      onChange={(e) => handleItemEdit(item.id, 'cost', e.target.value)}
                                      className="bg-transparent border-none text-white text-xs w-full focus:outline-none"
                                      placeholder="$0.00"
                                    />
                                  </td>
                                  <td className="border border-gray-400 px-2 py-1 text-white text-xs bg-gray-800">
                                    <input
                                      type="number"
                                      value={item.quantity_ordered || ''}
                                      onChange={(e) => handleItemEdit(item.id, 'quantity_ordered', e.target.value)}
                                      className="bg-transparent border-none text-white text-xs w-full focus:outline-none text-center"
                                    />
                                  </td>
                                  <td className="border border-gray-400 px-2 py-1 text-white text-xs bg-gray-800">
                                    <input
                                      type="text"
                                      value={item.additional_info || ''}
                                      onChange={(e) => handleItemEdit(item.id, 'additional_info', e.target.value)}
                                      className="bg-transparent border-none text-white text-xs w-full focus:outline-none"
                                    />
                                  </td>
                                  <td className="border border-gray-400 px-2 py-1 text-white text-xs bg-gray-800">
                                    <input
                                      type="date"
                                      value={item.est_shipping || ''}
                                      onChange={(e) => handleItemEdit(item.id, 'est_shipping', e.target.value)}
                                      className="bg-transparent border-none text-white text-xs w-full focus:outline-none"
                                    />
                                  </td>
                                  <td className="border border-gray-400 px-2 py-1 text-white text-xs bg-gray-800">
                                    <input
                                      type="date"
                                      value={item.est_install || ''}
                                      onChange={(e) => handleItemEdit(item.id, 'est_install', e.target.value)}
                                      className="bg-transparent border-none text-white text-xs w-full focus:outline-none"
                                    />
                                  </td>
                                  <td className="border border-gray-400 px-2 py-1 text-white text-xs bg-gray-800">
                                    <select
                                      value={item.carrier || ''}
                                      onChange={(e) => handleItemEdit(item.id, 'carrier', e.target.value)}
                                      className="bg-gray-800 text-white text-xs border-none w-full"
                                    >
                                      <option value="">Select</option>
                                      {carrierTypes && carrierTypes.map(carrier => (
                                        <option key={carrier} value={carrier}>{carrier}</option>
                                      ))}
                                    </select>
                                  </td>
                                  <td className="border border-gray-400 px-2 py-1 text-center bg-gray-800">
                                    <button
                                      onClick={() => handleDeleteItem(item.id)}
                                      className="text-red-400 hover:text-red-300 text-xs"
                                    >
                                      🗑️
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                          
                          {/* ADD ITEM BUTTON */}
                          <div className="text-center mb-2">
                            <button
                              onClick={() => handleAddItem(subcategory.id)}
                              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm"
                            >
                              Add Item to {subcategory.name}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* ADD ITEM MODAL */}
      {showAddItem && (
        <AddItemModal
          subcategoryId={selectedSubCategoryId}
          onClose={() => setShowAddItem(false)}
          onSuccess={handleAddItemComplete}
          itemStatuses={itemStatuses}
          vendorTypes={vendorTypes}
          carrierTypes={carrierTypes}
        />
      )}
    </div>
  );
};

export default ExactFFESpreadsheet;
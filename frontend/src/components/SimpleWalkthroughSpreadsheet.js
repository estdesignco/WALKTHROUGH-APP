import React, { useState, useEffect } from 'react';
import AddItemModal from './AddItemModal';

const SimpleWalkthroughSpreadsheet = ({
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
  const [showAddItem, setShowAddItem] = useState(false);
  const [selectedSubCategoryId, setSelectedSubCategoryId] = useState(null);
  const [availableCategories, setAvailableCategories] = useState([]);
  const [expandedRooms, setExpandedRooms] = useState({});
  const [expandedCategories, setExpandedCategories] = useState({});
  const [filteredProject, setFilteredProject] = useState(project);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRoom, setSelectedRoom] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedVendor, setSelectedVendor] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  // API CALLS
  const handleAddItem = async (itemData) => {
    try {
      if (!selectedSubCategoryId) {
        console.log('Please expand a category first to add items to it.');
        return;
      }

      const newItem = {
        ...itemData,
        subcategory_id: selectedSubCategoryId,
        order_index: 0
      };

      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL || window.location.origin}/api/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newItem)
      });

      if (response.ok) {
        console.log('✅ Walkthrough item added successfully');
        setShowAddItem(false);
        if (onReload) onReload();
      }
    } catch (error) {
      console.error('❌ Error adding walkthrough item:', error);
    }
  };

  const handleDeleteItem = async (itemId) => {
    if (!window.confirm('Are you sure you want to delete this item?')) return;

    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL || window.location.origin}/api/items/${itemId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        console.log('✅ Walkthrough item deleted successfully');
        if (onReload) onReload();
      }
    } catch (error) {
      console.error('❌ Error deleting walkthrough item:', error);
    }
  };

  const handleAddCategory = async (roomId, categoryName) => {
    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL || window.location.origin}/api/categories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: categoryName,
          room_id: roomId,
          order_index: 0
        })
      });

      if (response.ok) {
        console.log('✅ Walkthrough category added successfully');
        if (onReload) onReload();
      }
    } catch (error) {
      console.error('❌ Error adding walkthrough category:', error);
    }
  };

  // Initialize expanded states - EXPAND ALL BY DEFAULT
  useEffect(() => {
    if (project?.rooms) {
      const roomExpansion = {};
      const categoryExpansion = {};
      project.rooms.forEach(room => {
        roomExpansion[room.id] = true; // EXPANDED by default
        room.categories?.forEach(category => {
          categoryExpansion[category.id] = true; // EXPANDED by default
        });
      });
      setExpandedRooms(roomExpansion);
      setExpandedCategories(categoryExpansion);
      console.log('✅ All rooms and categories expanded by default');
    }
  }, [project]);

  // Filtering logic
  useEffect(() => {
    if (!project) {
      setFilteredProject(null);
      return;
    }

    let filtered = { ...project };

    if (searchTerm || selectedRoom || selectedCategory || selectedVendor || selectedStatus) {
      filtered.rooms = project.rooms.map(room => {
        if (selectedRoom && room.id !== selectedRoom) {
          return { ...room, categories: [] };
        }
        
        const filteredCategories = room.categories.map(category => {
          if (selectedCategory && category.name.toLowerCase() !== selectedCategory.toLowerCase()) {
            return { ...category, subcategories: [] };
          }
          
          const filteredSubcategories = category.subcategories.map(subcategory => {
            const filteredItems = subcategory.items.filter(item => {
              if (searchTerm) {
                const searchLower = searchTerm.toLowerCase();
                const itemMatch = 
                  item.name.toLowerCase().includes(searchLower) ||
                  (item.vendor && item.vendor.toLowerCase().includes(searchLower)) ||
                  (item.sku && item.sku.toLowerCase().includes(searchLower));
                if (!itemMatch) return false;
              }
              
              if (selectedVendor && item.vendor !== selectedVendor) return false;
              if (selectedStatus && item.status !== selectedStatus) return false;
              
              return true;
            });
            
            return { ...subcategory, items: filteredItems };
          });
          
          return { ...category, subcategories: filteredSubcategories };
        });
        
        return { ...room, categories: filteredCategories };
      });
    }

    setFilteredProject(filtered);
  }, [project, searchTerm, selectedRoom, selectedCategory, selectedVendor, selectedStatus]);

  const toggleRoomExpansion = (roomId) => {
    setExpandedRooms(prev => ({
      ...prev,
      [roomId]: !prev[roomId]
    }));
  };

  const toggleCategoryExpansion = (categoryId) => {
    setExpandedCategories(prev => ({
      ...prev,
      [categoryId]: !prev[categoryId]
    }));
  };

  // Color functions
  const getRoomColor = (roomName) => {
    const roomColors = {
      'living room': '#7C3AED',
      'dining room': '#DC2626',
      'kitchen': '#EA580C',
      'primary bedroom': '#059669',
      'primary bathroom': '#2563EB',
      'powder room': '#7C2D12',
      'guest room': '#BE185D',
      'office': '#6366F1'
    };
    return roomColors[roomName.toLowerCase()] || '#7C3AED';
  };

  const getCategoryColor = () => '#065F46';

  // DEBUG: Log the project data
  console.log('🔍 SimpleWalkthroughSpreadsheet rendering with:', { project, roomsCount: project?.rooms?.length });

  if (!project) {
    console.log('❌ SimpleWalkthroughSpreadsheet: No project data');
    return (
      <div className="text-center text-red-400 py-8 bg-red-900 m-4 p-4 rounded">
        <p className="text-lg font-bold">🚨 WALKTHROUGH COMPONENT LOADED - NO PROJECT DATA</p>
      </div>
    );
  }

  if (!project.rooms) {
    return (
      <div className="text-center text-orange-400 py-8 bg-orange-900 m-4 p-4 rounded">
        <p className="text-lg font-bold">🚨 WALKTHROUGH: NO ROOMS PROPERTY</p>
        <p className="text-sm mt-2">Project keys: {Object.keys(project).join(', ')}</p>
      </div>
    );
  }

  if (project.rooms.length === 0) {
    return (
      <div className="text-center text-yellow-400 py-8 bg-yellow-900 m-4 p-4 rounded">
        <p className="text-lg font-bold">🚨 WALKTHROUGH: EMPTY ROOMS ARRAY</p>
        <p className="text-sm mt-2">Rooms length: {project.rooms.length}</p>
      </div>
    );
  }

  console.log('✅ SimpleWalkthroughSpreadsheet: Valid project data, proceeding to render spreadsheet');
  console.log('🏠 Rooms data:', project.rooms?.map(r => ({ name: r.name, categoriesCount: r.categories?.length })));
  console.log('📊 Expanded rooms:', expandedRooms);
  console.log('📂 Expanded categories:', expandedCategories);

  return (
    <div className="w-full" style={{ backgroundColor: '#0F172A' }}>
      
      {/* FORCE VISIBLE TEST */}
      <div className="bg-red-900 text-red-400 p-8 m-4 rounded border-4 border-red-500">
        <h1 className="text-3xl font-bold">🚨 SIMPLE WALKTHROUGH SPREADSHEET IS RENDERING!</h1>
        <p className="text-xl mt-4">Project: {project.name}</p>
        <p className="text-lg">Rooms: {project.rooms?.length}</p>
        <p className="text-lg">Total Items: {project.rooms?.reduce((sum, r) => sum + (r.categories?.reduce((catSum, c) => catSum + (c.subcategories?.reduce((subSum, s) => subSum + (s.items?.length || 0), 0) || 0), 0) || 0), 0)}</p>
      </div>

      {/* SEARCH AND FILTER SECTION */}
      <div className="mb-6 p-4" style={{ backgroundColor: '#1E293B' }}>
        <div className="flex flex-col lg:flex-row gap-4 items-center">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search Items, Vendors, SKUs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 rounded bg-gray-700 text-white border border-gray-600 focus:border-blue-500 focus:outline-none"
            />
          </div>
          
          <div className="flex gap-3 flex-wrap">
            <select 
              value={selectedRoom}
              onChange={(e) => setSelectedRoom(e.target.value)}
              className="px-3 py-2 rounded bg-gray-700 text-white border border-gray-600 focus:border-blue-500 focus:outline-none"
            >
              <option value="">All Rooms</option>
              {project.rooms.map(room => (
                <option key={room.id} value={room.id}>{room.name}</option>
              ))}
            </select>
            
            <select 
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 rounded bg-gray-700 text-white border border-gray-600 focus:border-blue-500 focus:outline-none"
            >
              <option value="">All Categories</option>
              <option value="Lighting">Lighting</option>
              <option value="Furniture">Furniture</option>
              <option value="Decor & Accessories">Decor & Accessories</option>
            </select>
            
            <button 
              onClick={() => {
                console.log('🔍 WALKTHROUGH FILTER APPLIED');
              }}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium"
            >
              🔍 FILTER
            </button>
            <button 
              onClick={() => {
                setSearchTerm('');
                setSelectedRoom('');
                setSelectedCategory('');
                setSelectedVendor('');
                setSelectedStatus('');
                console.log('🧹 WALKTHROUGH FILTER CLEARED');
              }}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded font-medium"
            >
              CLEAR
            </button>
          </div>
          
          <button 
            onClick={() => onAddRoom && onAddRoom()}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded font-medium"
          >
            ✚ ADD ROOM
          </button>
        </div>
      </div>

      {/* TEST MESSAGE */}
      <div className="bg-blue-900 text-blue-400 p-4 m-4 rounded">
        <p className="text-lg font-bold">🎯 WALKTHROUGH TABLE COMPONENT REACHED!</p>
        <p className="text-sm">Rooms: {project.rooms?.length}, Items: {project.rooms?.reduce((sum, r) => sum + (r.categories?.reduce((catSum, c) => catSum + (c.subcategories?.reduce((subSum, s) => subSum + (s.items?.length || 0), 0) || 0), 0) || 0), 0)}</p>
      </div>

      {/* WALKTHROUGH TABLE - 4 COLUMNS ONLY */}
      <div className="w-full overflow-x-auto" style={{ backgroundColor: '#0F172A', touchAction: 'pan-x' }}>
        <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch', minWidth: '800px' }}>
          <div className="w-full" style={{ touchAction: 'pan-x pan-y' }}>
            <table className="w-full border-collapse border border-gray-400">
              
              <thead>
                <tr>
                  <th className="border border-gray-400 px-3 py-2 text-xs font-bold text-white" style={{ backgroundColor: '#7F1D1D' }}>INSTALLED</th>
                  <th className="border border-gray-400 px-3 py-2 text-xs font-bold text-white" style={{ backgroundColor: '#92400E' }}>VENDOR/SKU</th>
                  <th className="border border-gray-400 px-3 py-2 text-xs font-bold text-white" style={{ backgroundColor: '#92400E' }}>QTY</th>
                  <th className="border border-gray-400 px-3 py-2 text-xs font-bold text-white" style={{ backgroundColor: '#92400E' }}>SIZE</th>
                </tr>
              </thead>

              <tbody>
                {/* DEBUG: Force display room data */}
                {console.log('🔍 Attempting to render rooms:', (filteredProject || project).rooms?.length)}
                {(filteredProject || project).rooms?.map((room, roomIndex) => {
                  console.log('🏠 Rendering room:', room.name, 'Categories:', room.categories?.length);
                  const isRoomExpanded = expandedRooms[room.id];
                  
                  return (
                    <React.Fragment key={room.id}>
                      {/* ROOM HEADER ROW */}
                      <tr>
                        <td colSpan="4" 
                            className="border border-gray-400 px-3 py-2 text-white text-sm font-bold"
                            style={{ backgroundColor: getRoomColor(room.name) }}>
                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => toggleRoomExpansion(room.id)}
                                className="text-white hover:text-gray-200"
                              >
                                {isRoomExpanded ? '🔽' : '▶️'}
                              </button>
                              <span>🏠 {room.name.toUpperCase()}</span>
                            </div>
                            <button
                              onClick={() => onDeleteRoom && onDeleteRoom(room.id)}
                              className="text-red-300 hover:text-red-100 text-lg ml-2"
                              title="Delete Room"
                            >
                              🗑️
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* CATEGORIES AND ITEMS */}
                      {isRoomExpanded && room.categories?.map((category, categoryIndex) => {
                        const isCategoryExpanded = expandedCategories[category.id];
                        
                        return (
                          <React.Fragment key={category.id}>
                            {/* CATEGORY HEADER */}
                            <tr>
                              <td colSpan="4"
                                  className="border border-gray-400 px-4 py-2 text-white text-sm font-bold"
                                  style={{ backgroundColor: getCategoryColor() }}>
                                <div className="flex justify-between items-center">
                                  <div className="flex items-center gap-2">
                                    <button
                                      onClick={() => toggleCategoryExpansion(category.id)}
                                      className="text-white hover:text-gray-200"
                                    >
                                      {isCategoryExpanded ? '🔽' : '▶️'}
                                    </button>
                                    <span>📂 {category.name.toUpperCase()}</span>
                                  </div>
                                </div>
                              </td>
                            </tr>

                            {/* SUBCATEGORY ITEMS */}
                            {isCategoryExpanded && category.subcategories?.map((subcategory) => (
                              <React.Fragment key={subcategory.id}>
                                {/* REMOVED SUBCATEGORY HEADER - Items now go directly under category */}

                                {/* ITEMS - 4 COLUMNS: INSTALLED, VENDOR/SKU, QTY, SIZE */}
                                {subcategory.items?.map((item) => (
                                  <tr key={item.id}>
                                    {/* INSTALLED - directly editable text */}
                                    <td className="border border-gray-400 px-3 py-2 text-white text-sm">
                                      {item.name}
                                    </td>
                                    
                                    {/* VENDOR/SKU - directly editable text */}
                                    <td className="border border-gray-400 px-3 py-2 text-white text-sm">
                                      {item.vendor || ''}
                                    </td>
                                    
                                    {/* QTY - directly editable text */}
                                    <td className="border border-gray-400 px-3 py-2 text-white text-sm">
                                      {item.quantity || 1}
                                    </td>
                                    
                                    {/* SIZE - directly editable text */}
                                    <td className="border border-gray-400 px-3 py-2 text-white text-sm">
                                      {item.size || ''}
                                    </td>
                                  </tr>
                                ))}

                                {/* ADD ITEM BUTTON ROW */}
                                <tr>
                                  <td colSpan="4" className="border border-gray-400 px-6 py-2 bg-slate-900">
                                    <div className="flex justify-start items-center space-x-4">
                                      <button
                                        onClick={() => {
                                          setSelectedSubCategoryId(subcategory.id);
                                          setShowAddItem(true);
                                        }}
                                        className="bg-amber-700 hover:bg-amber-600 text-white px-3 py-1 rounded text-sm font-medium"
                                      >
                                        ✚ Add Item
                                      </button>
                                      
                                      <select
                                        value=""
                                        onChange={(e) => {
                                          if (e.target.value) {
                                            handleAddCategory(room.id, e.target.value);
                                          }
                                        }}
                                        className="bg-amber-700 hover:bg-amber-600 text-white px-3 py-1 rounded text-sm font-medium border-none outline-none"
                                      >
                                        <option value="">Add Category ▼</option>
                                        <option value="Lighting">Lighting</option>
                                        <option value="Furniture">Furniture</option>
                                        <option value="Decor & Accessories">Decor & Accessories</option>
                                        <option value="Plumbing & Fixtures">Plumbing & Fixtures</option>
                                      </select>
                                    </div>
                                  </td>
                                </tr>
                              </React.Fragment>
                            ))}
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

export default SimpleWalkthroughSpreadsheet;
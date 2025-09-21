import React, { useState, useEffect } from 'react';

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
  console.log('🎯 SimpleWalkthroughSpreadsheet rendering with project:', project);

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
  const [filteredProject, setFilteredProject] = useState(project);

  // APPLY FILTERS - WORKING FILTER LOGIC
  useEffect(() => {
    console.log('🔍 Walkthrough Filter triggered:', { searchTerm, selectedRoom, selectedCategory, selectedVendor, selectedStatus });
    
    if (!project) {
      setFilteredProject(null);
      return;
    }

    let filtered = { ...project };

    if (searchTerm || selectedRoom || selectedCategory || selectedVendor || selectedStatus) {
      console.log('🔍 Applying walkthrough filters...');
      
      filtered.rooms = project.rooms.map(room => {
        if (selectedRoom && room.id !== selectedRoom) {
          return { ...room, categories: [] };
        }
        
        const filteredCategories = room.categories.map(category => {
          if (selectedCategory && category.name !== selectedCategory) {
            return { ...category, subcategories: [] };
          }
          
          const filteredSubcategories = category.subcategories.map(subcategory => {
            const filteredItems = subcategory.items.filter(item => {
              if (searchTerm) {
                const searchLower = searchTerm.toLowerCase();
                const itemMatch = 
                  item.name.toLowerCase().includes(searchLower) ||
                  (item.vendor && item.vendor.toLowerCase().includes(searchLower)) ||
                  (item.sku && item.sku.toLowerCase().includes(searchLower)) ||
                  (item.remarks && item.remarks.toLowerCase().includes(searchLower));
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

  // Initialize all rooms and categories as expanded
  useEffect(() => {
    if (project?.rooms) {
      const roomExpansion = {};
      const categoryExpansion = {};
      
      project.rooms.forEach(room => {
        roomExpansion[room.id] = true;
        room.categories?.forEach(category => {
          categoryExpansion[category.id] = true;
        });
      });
      
      setExpandedRooms(roomExpansion);
      setExpandedCategories(categoryExpansion);
    }
  }, [project]);

  // Fetch available categories from backend API
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const backendUrl = process.env.REACT_APP_BACKEND_URL || window.location.origin;
        const response = await fetch(`${backendUrl}/api/categories/available`);
        if (response.ok) {
          const data = await response.json();
          setAvailableCategories(data.categories || []);
          console.log('✅ Loaded categories from API:', data.categories);
        } else {
          console.warn('⚠️ Failed to fetch categories, using fallback');
          setAvailableCategories([
            "Lighting", "Furniture", "Appliances", "Plumbing", 
            "Decor & Accessories", "Paint, Wallpaper, and Finishes"
          ]);
        }
      } catch (error) {
        console.error('❌ Error fetching categories:', error);
        setAvailableCategories([
          "Lighting", "Furniture", "Appliances", "Plumbing", 
          "Decor & Accessories", "Paint, Wallpaper, and Finishes"
        ]);
      }
    };
    
    fetchCategories();
  }, []);

  // Handle adding a new category WITH ALL SUBCATEGORIES AND ITEMS
  const handleAddCategory = async (roomId, categoryName) => {
    if (!roomId || !categoryName) {
      console.error('❌ Missing roomId or categoryName');
      return;
    }

    try {
      console.log('🔄 Creating comprehensive walkthrough category:', categoryName, 'for room:', roomId);
      
      const tempRoomResponse = await fetch(`${process.env.REACT_APP_BACKEND_URL || window.location.origin}/api/rooms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `temp_${categoryName}_${Date.now()}`,
          description: `Temporary room to extract ${categoryName} structure`,
          project_id: "temp",
          order_index: 999
        })
      });

      if (tempRoomResponse.ok) {
        const tempRoom = await tempRoomResponse.json();
        
        const matchingCategory = tempRoom.categories.find(cat => 
          cat.name.toLowerCase() === categoryName.toLowerCase()
        );
        
        if (matchingCategory) {
          // First add the category
          const categoryData = {
            ...matchingCategory,
            room_id: roomId,
            id: undefined
          };
          
          const addResponse = await fetch(`${process.env.REACT_APP_BACKEND_URL || window.location.origin}/api/categories`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(categoryData)
          });
          
          if (addResponse.ok) {
            const newCategory = await addResponse.json();
            console.log('✅ Category added:', newCategory.name);
            
            // Now add ALL subcategories with their items
            for (const subcategory of matchingCategory.subcategories) {
              const subcategoryData = {
                ...subcategory,
                category_id: newCategory.id,
                id: undefined
              };
              
              const subResponse = await fetch(`${process.env.REACT_APP_BACKEND_URL || window.location.origin}/api/subcategories`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(subcategoryData)
              });
              
              if (subResponse.ok) {
                const newSubcategory = await subResponse.json();
                console.log('✅ Subcategory added:', newSubcategory.name);
                
                // Add ALL items for this subcategory
                for (const item of subcategory.items) {
                  const itemData = {
                    ...item,
                    subcategory_id: newSubcategory.id,
                    id: undefined,
                    status: '' // BLANK status for walkthrough items
                  };
                  
                  await fetch(`${process.env.REACT_APP_BACKEND_URL || window.location.origin}/api/items`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(itemData)
                  });
                }
              }
            }
            
            await fetch(`${process.env.REACT_APP_BACKEND_URL || window.location.origin}/api/rooms/${tempRoom.id}`, {
              method: 'DELETE'
            });
            
            // Reload to show all new items
            if (onReload) {
              onReload();
            }
          }
        }
        
        await fetch(`${process.env.REACT_APP_BACKEND_URL || window.location.origin}/api/rooms/${tempRoom.id}`, {
          method: 'DELETE'
        });
      }
    } catch (error) {
      console.error('❌ Error adding comprehensive walkthrough category:', error);
    }
  };

  // Handle adding new BLANK ROWS for Walkthrough (not actual items like other sheets)
  const handleAddBlankRow = async (categoryId) => {
    try {
      // Find the category's first subcategory to add a blank row to
      let subcategoryId = null;
      
      for (const room of project.rooms) {
        for (const category of room.categories || []) {
          if (category.id === categoryId && category.subcategories?.length > 0) {
            subcategoryId = category.subcategories[0].id;
            break;
          }
        }
        if (subcategoryId) break;
      }

      if (!subcategoryId) {
        console.error('No subcategory found to add blank row to');
        alert('Please expand a category first to add items to it.');
        return;
      }

      const backendUrl = process.env.REACT_APP_BACKEND_URL || window.location.origin;
      
      // Create a blank row item - WITH DEFAULT FINISH COLOR
      const blankItem = {
        name: 'New Item',
        vendor: '',
        sku: '',
        cost: '',
        size: '',
        finish_color: 'Natural',  // DEFAULT VALUE AS REQUESTED
        quantity: '1',
        subcategory_id: subcategoryId,
        status: '',
        order_index: 0
      };

      console.log('📝 Creating blank row for walkthrough:', blankItem);

      const response = await fetch(`${backendUrl}/api/items`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(blankItem)
      });

      if (response.ok) {
        console.log('✅ Blank row added successfully');
        if (onReload) {
          onReload();
        }
      } else {
        const errorData = await response.text();
        console.error('❌ Backend error:', errorData);
        alert(`Failed to add item: ${errorData}`);
      }
    } catch (error) {
      console.error('❌ Error adding blank row:', error);
      alert(`Error adding item: ${error.message}`);
    }
  };
  const handleAddItem = async (itemData) => {
    try {
      // Find the first available subcategory if none selected
      let subcategoryId = selectedSubCategoryId;
      
      if (!subcategoryId) {
        // Find the first subcategory from any expanded room/category
        for (const room of project.rooms) {
          if (expandedRooms[room.id]) {
            for (const category of room.categories || []) {
              if (expandedCategories[category.id] && category.subcategories?.length > 0) {
                subcategoryId = category.subcategories[0].id;
                console.log(`🔍 Auto-selected subcategory: ${category.subcategories[0].name}`);
                break;
              }
            }
            if (subcategoryId) break;
          }
        }
      }

      if (!subcategoryId) {
        console.error('Please expand a category first to add items to it.');
        return;
      }

      const backendUrl = process.env.REACT_APP_BACKEND_URL || window.location.origin;
      
      const newItem = {
        ...itemData,
        subcategory_id: subcategoryId,
        status: '', // Start with blank status as requested
        order_index: 0
      };

      console.log('📤 Creating walkthrough item:', newItem);

      const response = await fetch(`${backendUrl}/api/items`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newItem)
      });

      if (response.ok) {
        console.log('✅ Walkthrough item added successfully');
        setShowAddItem(false);
        // Call onReload to refresh data WITHOUT RESETTING MINIMIZE STATE
        const currentExpandedState = expandedRooms;
        if (onReload) {
          await onReload();
          // Restore expanded state after reload
          setExpandedRooms(currentExpandedState);
        }
      } else {
        const errorData = await response.text();
        console.error('❌ Backend error:', errorData);
        throw new Error(`HTTP ${response.status}: ${errorData}`);
      }
    } catch (error) {
      console.error('❌ Error adding walkthrough item:', error);
      console.error(`Failed to add item: ${error.message}`);
    }
  };

  // Toggle room expansion
  const toggleRoomExpansion = (roomId) => {
    setExpandedRooms(prev => ({
      ...prev,
      [roomId]: !prev[roomId]
    }));
  };

  // Toggle category expansion  
  const toggleCategoryExpansion = (categoryId) => {
    setExpandedCategories(prev => ({
      ...prev,
      [categoryId]: !prev[categoryId]
    }));
  };

  // Handle deleting a room
  const handleDeleteRoom = async (roomId) => {
    if (!window.confirm('Are you sure you want to delete this entire room? This will delete all categories and items in this room.')) {
      return;
    }

    try {
      console.log('🗑️ DELETING ROOM:', roomId);
      const backendUrl = process.env.REACT_APP_BACKEND_URL || window.location.origin;
      console.log('🌐 Using backend URL:', backendUrl);
      
      const response = await fetch(`${backendUrl}/api/rooms/${roomId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      console.log('📡 Delete response status:', response.status);

      if (response.ok) {
        console.log('✅ Walkthrough room deleted successfully');
        alert('✅ Room deleted successfully!');
        if (onReload) {
          console.log('🔄 Calling onReload after successful delete');
          onReload();
        }
      } else {
        const errorText = await response.text();
        console.error('❌ Delete room failed with status:', response.status, 'Error:', errorText);
        alert(`❌ Failed to delete room: ${response.status} - ${errorText}`);
      }
    } catch (error) {
      console.error('❌ Error deleting walkthrough room:', error);
      alert('❌ Failed to delete room: ' + error.message);
    }
  };

  // Handle deleting a category
  const handleDeleteCategory = async (categoryId) => {
    if (!window.confirm('Are you sure you want to delete this category? This will delete all items in this category.')) {
      return;
    }

    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL || window.location.origin}/api/categories/${categoryId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        console.log('✅ Walkthrough category deleted successfully');
        if (onReload) {
          onReload();
        }
      } else {
        console.error('❌ Delete category failed with status:', response.status);
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (error) {
      console.error('❌ Error deleting walkthrough category:', error);
      alert('Failed to delete category: ' + error.message);
    }
  };

  // Drag and drop functionality removed for now to fix compilation

  const handleTransferToChecklist = async () => {
    try {
      console.log('🚀 Starting transfer from Walkthrough to Checklist');
      
      // Get all items from current walkthrough project
      const allItems = [];
      
      if (filteredProject?.rooms) {
        filteredProject.rooms.forEach(room => {
          room.categories?.forEach(category => {
            category.subcategories?.forEach(subcategory => {
              subcategory.items?.forEach(item => {
                if (item.name && item.name !== 'New Item') {  // Only transfer real items
                  allItems.push({
                    ...item,
                    status: 'PICKED',  // Set status to PICKED for checklist
                    source_sheet: 'walkthrough'
                  });
                }
              });
            });
          });
        });
      }

      console.log(`📝 Found ${allItems.length} items to transfer`);

      if (allItems.length === 0) {
        alert('No items found to transfer. Please add some items first.');
        return;
      }

      // Transfer each item to checklist by updating status
      const backendUrl = process.env.REACT_APP_BACKEND_URL || window.location.origin;
      let successCount = 0;

      for (const item of allItems) {
        try {
          const response = await fetch(`${backendUrl}/api/items/${item.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              ...item,
              status: 'PICKED',
              transferred_from: 'walkthrough',
              transferred_at: new Date().toISOString()
            })
          });

          if (response.ok) {
            successCount++;
          } else {
            console.error(`❌ Failed to transfer item ${item.name}`);
          }
        } catch (error) {
          console.error(`❌ Error transferring item ${item.name}:`, error);
        }
      }

      alert(`✅ Successfully transferred ${successCount} items from Walkthrough to Checklist!`);
      
      if (onReload) {
        onReload();
      }

    } catch (error) {
      console.error('❌ Transfer error:', error);
      alert('Transfer failed: ' + error.message);
    }
  };
  const handleDeleteItem = async (itemId) => {
    if (!window.confirm('Are you sure you want to delete this item?')) {
      return;
    }

    try {
      console.log('🗑️ DELETING ITEM:', itemId);
      const backendUrl = process.env.REACT_APP_BACKEND_URL || window.location.origin;
      console.log('🌐 Using backend URL:', backendUrl);

      const response = await fetch(`${backendUrl}/api/items/${itemId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      console.log('📡 Delete response status:', response.status);

      if (response.ok) {
        console.log('✅ Walkthrough item deleted successfully');
        alert('✅ Item deleted successfully!');
        
        // Call onReload to refresh data WITHOUT RESETTING MINIMIZE STATE
        const currentExpandedState = expandedRooms;
        if (onReload) {
          console.log('🔄 Calling onReload after successful delete');
          await onReload();
          // Restore expanded state after reload
          setExpandedRooms(currentExpandedState);
        }
      } else {
        const errorText = await response.text();
        console.error('❌ Delete item failed with status:', response.status, 'Error:', errorText);
        alert(`❌ Failed to delete item: ${response.status} - ${errorText}`);
      }
    } catch (error) {
      console.error('❌ Error deleting walkthrough item:', error);
      alert('❌ Failed to delete item: ' + error.message);
    }
  };
  
  if (!project) {
    return (
      <div className="text-center text-red-400 py-8 bg-red-900 m-4 p-4 rounded">
        <p className="text-lg">🚨 SimpleWalkthroughSpreadsheet: NO PROJECT DATA</p>
      </div>
    );
  }

  if (!project.rooms || project.rooms.length === 0) {
    return (
      <div className="w-full p-4" style={{ backgroundColor: '#0F172A' }}>
        <div className="text-center text-yellow-400 py-8 bg-yellow-900 m-4 p-4 rounded">
          <p className="text-lg">🚶 No Rooms Available</p>
          <p className="text-sm mt-2">This project has {project.rooms?.length || 0} rooms</p>
          <div className="mt-4">
            <button 
              onClick={onAddRoom}
              className="px-6 py-3 bg-amber-600 hover:bg-amber-700 text-white rounded font-medium"
            >
              + ADD FIRST ROOM
            </button>
          </div>
        </div>
      </div>
    );
  }

  console.log('✅ SimpleWalkthroughSpreadsheet: Rendering with', project.rooms.length, 'rooms');

  return (
    <div className="w-full p-4" style={{ backgroundColor: '#0F172A' }}>
      
      {/* ENHANCED FILTER SECTION - MATCHING OTHER SHEETS FUNCTIONALITY */}
      <div className="mb-6 p-4" style={{ backgroundColor: '#1E293B' }}>
        <div className="flex flex-col gap-4">
          {/* Search Bar */}
          <div className="w-full">
            <input
              type="text"
              placeholder="Search Items, Vendors, SKUs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 rounded bg-gray-700 text-white border border-gray-600 focus:border-blue-500 focus:outline-none"
            />
          </div>
          
          {/* Filter Dropdowns */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <select 
              value={selectedRoom}
              onChange={(e) => setSelectedRoom(e.target.value)}
              className="px-3 py-2 rounded bg-gray-700 text-white border border-gray-600"
            >
              <option value="">All Rooms</option>
              {(project?.rooms || []).map(room => (
                <option key={room.id} value={room.id}>{room.name}</option>
              ))}
            </select>
            <select 
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 rounded bg-gray-700 text-white border border-gray-600"
            >
              <option value="">All Categories</option>
              <option value="Lighting">Lighting</option>
              <option value="Furniture">Furniture</option>
              <option value="Decor">Decor & Accessories</option>
              <option value="Paint">Paint, Wallpaper & Finishes</option>
              <option value="Architectural">Architectural Elements</option>
            </select>
            <select 
              value={selectedVendor}
              onChange={(e) => setSelectedVendor(e.target.value)}
              className="px-3 py-2 rounded bg-gray-700 text-white border border-gray-600"
            >
              <option value="">All Vendors</option>
              {(vendorTypes || []).map(vendor => (
                <option key={vendor} value={vendor}>{vendor}</option>
              ))}
            </select>
            <select 
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-2 rounded bg-gray-700 text-white border border-gray-600"
            >
              <option value="">All Status</option>
              <option value="PICKED">PICKED</option>
              <option value="ORDER SAMPLES">ORDER SAMPLES</option>
              <option value="SAMPLES ARRIVED">SAMPLES ARRIVED</option>
              <option value="ASK NEIL">ASK NEIL</option>
              <option value="ASK CHARLENE">ASK CHARLENE</option>
              <option value="ASK JALA">ASK JALA</option>
              <option value="GET QUOTE">GET QUOTE</option>
              <option value="WAITING ON QT">WAITING ON QT</option>
              <option value="READY FOR PRESENTATION">READY FOR PRESENTATION</option>
            </select>
          </div>
          
          {/* Filter Buttons - TONED DOWN */}
          <div className="flex gap-4">
            <button 
              onClick={() => console.log('🔍 WALKTHROUGH FILTER APPLIED')}
              className="bg-gray-600 hover:bg-gray-500 text-white px-4 py-2 rounded font-medium opacity-80"
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
              className="bg-gray-600 hover:bg-gray-500 text-white px-4 py-2 rounded font-medium opacity-80"
            >
              CLEAR
            </button>
          </div>
          
          {/* Action Buttons */}
          <div className="flex gap-3">
            <button 
              onClick={onAddRoom}
              className="text-white px-4 py-2 rounded font-medium" 
              style={{ backgroundColor: '#8b7355' }}
            >
              + ADD ROOM
            </button>
            <button 
              onClick={handleTransferToChecklist}
              className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded font-medium"
            >
              → TRANSFER TO CHECKLIST
            </button>
          </div>
        </div>
      </div>
      
      {/* DYNAMIC SPREADSHEET WITH REAL DATA */}
      <div className="overflow-x-auto">
        
        {/* USE FILTERED PROJECT DATA */}
        {((filteredProject || project)?.rooms || []).map((room, roomIndex) => {
          const isRoomExpanded = expandedRooms[room.id];
          
          return (
            <div key={room.id} className="mb-8">
              {/* ROOM HEADER WITH DIFFERENT COLORS AND EXPAND/COLLAPSE - EXACTLY LIKE OTHER SHEETS */}
              <div className="mt-8 mb-4 px-4 py-2 text-white font-bold" style={{ backgroundColor: roomIndex % 2 === 0 ? '#7C3AED' : '#059669' }}>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleRoomExpansion(room.id)}
                      className="text-white hover:text-gray-200"
                    >
                      {isRoomExpanded ? '▼' : '▶'}
                    </button>
                    <span>{room.name.toUpperCase()}</span>
                  </div>
                  <button
                    onClick={() => handleDeleteRoom(room.id)}
                    className="text-red-300 hover:text-red-100 text-lg"
                    title="Delete Room"
                  >
                    🗑️
                  </button>
                </div>
              </div>
              
              {/* CATEGORIES - ONLY SHOW WHEN EXPANDED */}
              {isRoomExpanded && (
                <div>
                  {(room.categories || []).map((category, catIndex) => {
                    const isCategoryExpanded = expandedCategories[category.id];
                    
                    return (
                      <div key={category.id} className="mb-4">
                        {/* CATEGORY HEADER (GREEN) WITH EXPAND/COLLAPSE - EXACTLY LIKE OTHER SHEETS */}
                        <div className="mb-4 px-4 py-2 text-white font-bold" style={{ backgroundColor: '#065F46' }}>
                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => toggleCategoryExpansion(category.id)}
                                className="text-white hover:text-gray-200"
                              >
                                {isCategoryExpanded ? '▼' : '▶'}
                              </button>
                              <span>{category.name.toUpperCase()}</span>
                            </div>
                            <button
                              onClick={() => handleDeleteCategory(category.id)}
                              className="text-red-300 hover:text-red-100 text-lg"
                              title="Delete Category"
                            >
                              🗑️
                            </button>
                          </div>
                        </div>
                        
                        {/* TABLE - ONLY SHOW WHEN CATEGORY EXPANDED */}
                        {isCategoryExpanded && (
                          <div>
                            {/* TABLE WITH CORRECT HEADERS - MATCHING CHECKLIST EXACTLY */}
                            <table className="w-full border-collapse border border-gray-400 mb-6">
                              <thead>
                                <tr>
                                  <th className="border border-gray-400 px-1 py-2 text-xs font-bold text-white w-6" style={{ backgroundColor: '#8b7355' }}>✓</th>
                                  <th className="border border-gray-400 px-2 py-2 text-xs font-bold text-white" style={{ backgroundColor: '#8B4444' }}>INSTALLED</th>
                                  <th className="border border-gray-400 px-2 py-2 text-xs font-bold text-white w-16" style={{ backgroundColor: '#8B4444' }}>QTY</th>
                                  <th className="border border-gray-400 px-2 py-2 text-xs font-bold text-white" style={{ backgroundColor: '#8B4444' }}>SIZE</th>
                                  <th className="border border-gray-400 px-2 py-2 text-xs font-bold text-white" style={{ backgroundColor: '#8B4444' }}>FINISH/COLOR</th>
                                  <th className="border border-gray-400 px-1 py-2 text-xs font-bold text-white w-12" style={{ backgroundColor: '#8B4444' }}>DELETE</th>
                                </tr>
                              </thead>
                              <tbody>
                                {/* REAL DATA FROM SUBCATEGORIES */}
                                {(category.subcategories || []).map((subcategory) => 
                                  (subcategory.items || []).map((item, itemIndex) => (
                                    <tr key={item.id} className={itemIndex % 2 === 0 ? 'bg-slate-800' : 'bg-slate-700'}>
                                      <td className="border border-gray-400 px-1 py-1 text-center w-6">
                                        <input type="checkbox" className="w-6 h-6 cursor-pointer" />
                                      </td>
                                      <td className="border border-gray-400 px-2 py-1 text-white text-sm">{item.name}</td>
                                      <td className="border border-gray-400 px-2 py-1 text-white text-sm text-center w-16">{item.quantity || 1}</td>
                                      <td className="border border-gray-400 px-2 py-1 text-white text-sm">{item.size || ''}</td>
                                      <td className="border border-gray-400 px-2 py-1 text-white text-sm">{item.finish_color || ''}</td>
                                      <td className="border border-gray-400 px-1 py-1 text-center w-12">
                                        <button 
                                          onClick={() => handleDeleteItem(item.id)}
                                          className="text-red-400 hover:text-red-300 text-xs"
                                        >
                                          🗑️
                                        </button>
                                      </td>
                                    </tr>
                                  ))
                                )}
                              </tbody>
                            </table>
                            
                            {/* ADD ITEM BUTTON ONLY */}
                            <div className="mb-4 flex gap-3">
                              <button 
                                onClick={() => handleAddBlankRow(category.id)}
                                className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded text-sm"
                              >
                                + ADD ITEM
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* BOTTOM SECTION - ADD CATEGORY AND ADD ITEM BUTTONS - MATCHING OTHER SHEETS */}
      <div className="mt-6 flex gap-3">
          <select
            value=""
            onChange={(e) => {
              // Find first room to add category to
              const firstRoom = project?.rooms?.[0];
              if (firstRoom) {
                if (e.target.value === 'CREATE_NEW') {
                  const categoryName = window.prompt('Enter new category name:');
                  if (categoryName && categoryName.trim()) {
                    handleAddCategory(firstRoom.id, categoryName.trim());
                  }
                } else if (e.target.value) {
                  handleAddCategory(firstRoom.id, e.target.value);
                }
              } else {
                console.error('❌ No rooms available. Please add a room first.');
                alert('Please add a room first before adding categories.');
              }
            }}
            className="text-white px-4 py-2 rounded font-medium border-none outline-none" 
            style={{ backgroundColor: '#8b7355' }}
          >
            <option value="">+ ADD CATEGORY ▼</option>
            <option value="Lighting">Lighting</option>
            <option value="Furniture">Furniture</option>
            <option value="Decor & Accessories">Decor & Accessories</option>
            <option value="Paint, Wallpaper, and Finishes">Paint, Wallpaper, and Finishes</option>
            <option value="Millwork, Trim, and Architectural Elements">Millwork, Trim, and Architectural Elements</option>
            <option value="Plumbing & Fixtures">Plumbing & Fixtures</option>
            <option value="Furniture & Storage">Furniture & Storage</option>
            <option value="Equipment & Furniture">Equipment & Furniture</option>
            <option value="Electronics & Technology">Electronics & Technology</option>
            <option value="Appliances">Appliances</option>
            <option value="Textiles & Soft Goods">Textiles & Soft Goods</option>
            <option value="Surfaces & Materials">Surfaces & Materials</option>
            <option value="CREATE_NEW">+ Create New Category</option>
          </select>
          <button 
            onClick={handleTransferToChecklist}
            className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded font-medium"
          >
            → TRANSFER TO CHECKLIST
          </button>
          <button 
            onClick={() => {
              // Find first available category to add blank row to
              const firstRoom = project?.rooms?.[0];
              const firstCategory = firstRoom?.categories?.[0];
              
              if (firstCategory) {
                handleAddBlankRow(firstCategory.id);
                console.log('🎯 Adding blank row to first available category:', firstCategory.id);
              } else {
                alert('Please add a category first before adding items.');
              }
            }}
            className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded font-medium"
          >
            + ADD ITEM
          </button>
        </div>
      
      {/* ADD ITEM MODAL */}
      {showAddItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 p-6 rounded-lg w-96">
            <h3 className="text-white text-lg mb-4">Add Item</h3>
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Item Name"
                className="w-full px-3 py-2 bg-gray-700 text-white rounded border border-gray-600"
              />
              <input
                type="text"
                placeholder="Vendor"
                className="w-full px-3 py-2 bg-gray-700 text-white rounded border border-gray-600"
              />
              <input
                type="text"
                placeholder="SKU"
                className="w-full px-3 py-2 bg-gray-700 text-white rounded border border-gray-600"
              />
              <div className="flex gap-3">
                <button
                  onClick={() => setShowAddItem(false)}
                  className="flex-1 px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-500"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    // Simple add item logic
                    console.log('Adding item...');
                    setShowAddItem(false);
                  }}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-500"
                >
                  Add Item
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SimpleWalkthroughSpreadsheet;
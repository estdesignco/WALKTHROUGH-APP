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
  
  // State to track checked items for transfer
  const [checkedItems, setCheckedItems] = useState(new Set());
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

  // Handle adding a new category WITH ALL SUBCATEGORIES AND ITEMS - SIMPLIFIED
  const handleAddCategory = async (roomId, categoryName) => {
    if (!roomId || !categoryName) {
      console.error('❌ Missing roomId or categoryName');
      return;
    }

    try {
      console.log('🔄 Creating comprehensive walkthrough category:', categoryName, 'for room:', roomId);
      const backendUrl = process.env.REACT_APP_BACKEND_URL || window.location.origin;
      
      // Use the enhanced backend category creation that loads full structure
      const categoryData = {
        name: categoryName,
        room_id: roomId,
        description: `${categoryName} category with full subcategories and items`,
        order_index: 0
      };
      
      console.log('📤 Creating category with data:', categoryData);
      
      const response = await fetch(`${backendUrl}/api/categories`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(categoryData)
      });

      console.log('📡 Category creation response:', response.status);

      if (response.ok) {
        const newCategory = await response.json();
        console.log('✅ Category created with full structure:', newCategory.name);
        alert(`✅ Successfully added ${categoryName} category with all subcategories and items!`);
        
        // Reload to show the new category
        if (onReload) {
          await onReload();
        }
      } else {
        const errorText = await response.text();
        console.error('❌ Category creation failed:', response.status, errorText);
        alert(`❌ Failed to create ${categoryName} category: ${errorText}`);
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
      
      // Create a blank row item - WITH PROPER DATA TYPES
      const blankItem = {
        name: 'New Item',
        vendor: '',
        sku: '',
        cost: 0.0,  // Float value instead of empty string
        size: '',
        finish_color: '',  // BLANK AS REQUESTED
        quantity: 1,  // Integer value instead of string
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

      console.log('📡 Delete room response:', response.status, response.statusText);

      if (response.ok) {
        console.log('✅ Walkthrough room deleted successfully');
        
        if (onReload) {
          console.log('🔄 Calling onReload after successful delete');
          await onReload();
        }
      } else {
        const errorText = await response.text();
        console.error('❌ Delete room failed:', response.status, errorText);
        alert(`Failed to delete room: ${response.status} - ${errorText}`);
      }
    } catch (error) {
      console.error('❌ Error deleting walkthrough room:', error);
      alert('Failed to delete room: ' + error.message);
    }
  };

  // Handle deleting a category
  const handleDeleteCategory = async (categoryId) => {
    if (!window.confirm('Are you sure you want to delete this category? This will delete all items in this category.')) {
      return;
    }

    try {
      console.log('🗑️ DELETING CATEGORY:', categoryId);
      const backendUrl = process.env.REACT_APP_BACKEND_URL || window.location.origin;
      
      const response = await fetch(`${backendUrl}/api/categories/${categoryId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      console.log('📡 Delete category response:', response.status, response.statusText);

      if (response.ok) {
        console.log('✅ Walkthrough category deleted successfully');
        
        // Preserve expansion states during reload
        const currentExpandedRooms = {...expandedRooms};
        const currentExpandedCategories = {...expandedCategories};
        
        if (onReload) {
          await onReload();
          
          // Restore expansion states
          setTimeout(() => {
            setExpandedRooms(currentExpandedRooms);
            setExpandedCategories(currentExpandedCategories);
          }, 100);
        }
      } else {
        const errorText = await response.text();
        console.error('❌ Delete category failed:', response.status, errorText);
        alert(`Failed to delete category: ${response.status} - ${errorText}`);
      }
    } catch (error) {
      console.error('❌ Error deleting walkthrough category:', error);
      alert('Failed to delete category: ' + error.message);
    }
  };

  // Drag and drop functionality removed for now to fix compilation

  const handleTransferToChecklist = async () => {
    try {
      console.log('🚀 Starting transfer from Walkthrough to Checklist - CHECKED ITEMS ONLY');
      
      // Get ONLY CHECKED items from current walkthrough project
      const checkedItemsToTransfer = [];
      
      if (filteredProject?.rooms) {
        filteredProject.rooms.forEach(room => {
          room.categories?.forEach(category => {
            category.subcategories?.forEach(subcategory => {
              subcategory.items?.forEach(item => {
                // ONLY transfer CHECKED items
                if (checkedItems.has(item.id) && item.name && item.name !== 'New Item') {
                  checkedItemsToTransfer.push(item);
                }
              });
            });
          });
        });
      }

      console.log(`📝 Found ${checkedItemsToTransfer.length} CHECKED items to transfer`);
      console.log(`✅ Checked items IDs:`, Array.from(checkedItems));

      if (checkedItemsToTransfer.length === 0) {
        alert('No items are checked for transfer. Please check the items you want to transfer first.');
        return;
      }

      // Create COMPLETE room structure for checklist first, then transfer items
      const backendUrl = process.env.REACT_APP_BACKEND_URL || window.location.origin;
      let successCount = 0;
      
      // Track what structures we need to create
      const roomsToCreate = new Map(); // roomId -> room data
      const categoriesToCreate = new Map(); // categoryId -> category data  
      const subcategoriesToCreate = new Map(); // subcategoryId -> subcategory data

      // Analyze what structures we need for the checked items
      for (const item of checkedItemsToTransfer) {
        // Find the room, category, and subcategory for this item
        for (const room of filteredProject.rooms) {
          for (const category of room.categories || []) {
            for (const subcategory of category.subcategories || []) {
              if (subcategory.items?.some(i => i.id === item.id)) {
                roomsToCreate.set(room.id, {...room, sheet_type: 'checklist'});
                categoriesToCreate.set(category.id, {...category, room_id: room.id});
                subcategoriesToCreate.set(subcategory.id, {...subcategory, category_id: category.id});
                break;
              }
            }
          }
        }
      }

      console.log(`🏗️ Need to create ${roomsToCreate.size} rooms, ${categoriesToCreate.size} categories, ${subcategoriesToCreate.size} subcategories`);

      try {
        // Step 1: Create rooms for checklist
        const roomMapping = new Map(); // old room id -> new room id
        for (const [oldRoomId, roomData] of roomsToCreate) {
          const newRoomData = {
            name: roomData.name,
            description: roomData.description || '',
            project_id: roomData.project_id,
            sheet_type: 'checklist',
            order_index: roomData.order_index || 0
          };
          
          const roomResponse = await fetch(`${backendUrl}/api/rooms`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newRoomData)
          });
          
          if (roomResponse.ok) {
            const newRoom = await roomResponse.json();
            roomMapping.set(oldRoomId, newRoom.id);
            console.log(`✅ Created checklist room: ${newRoom.name}`);
          }
        }

        // Step 2: Create categories for checklist
        const categoryMapping = new Map(); // old category id -> new category id
        for (const [oldCategoryId, categoryData] of categoriesToCreate) {
          const newRoomId = roomMapping.get(categoryData.room_id);
          if (newRoomId) {
            const newCategoryData = {
              name: categoryData.name,
              description: categoryData.description || '',
              room_id: newRoomId,
              color: categoryData.color,
              order_index: categoryData.order_index || 0
            };
            
            const categoryResponse = await fetch(`${backendUrl}/api/categories`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(newCategoryData)
            });
            
            if (categoryResponse.ok) {
              const newCategory = await categoryResponse.json();
              categoryMapping.set(oldCategoryId, newCategory.id);
              console.log(`✅ Created checklist category: ${newCategory.name}`);
            }
          }
        }

        // Step 3: Create subcategories for checklist
        const subcategoryMapping = new Map(); // old subcategory id -> new subcategory id
        for (const [oldSubcategoryId, subcategoryData] of subcategoriesToCreate) {
          const newCategoryId = categoryMapping.get(subcategoryData.category_id);
          if (newCategoryId) {
            const newSubcategoryData = {
              name: subcategoryData.name,
              description: subcategoryData.description || '',
              category_id: newCategoryId,
              color: subcategoryData.color,
              order_index: subcategoryData.order_index || 0
            };
            
            const subcategoryResponse = await fetch(`${backendUrl}/api/subcategories`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(newSubcategoryData)
            });
            
            if (subcategoryResponse.ok) {
              const newSubcategory = await subcategoryResponse.json();
              subcategoryMapping.set(oldSubcategoryId, newSubcategory.id);
              console.log(`✅ Created checklist subcategory: ${newSubcategory.name}`);
            }
          }
        }

        // Step 4: Finally create the items in the new structure
        for (const item of checkedItemsToTransfer) {
          const newSubcategoryId = subcategoryMapping.get(item.subcategory_id);
          if (newSubcategoryId) {
            const newItemForChecklist = {
              name: item.name,
              vendor: item.vendor || '',
              sku: item.sku || '',
              cost: item.cost || 0,
              size: item.size || '',
              finish_color: item.finish_color || '',
              quantity: item.quantity || 1,
              subcategory_id: newSubcategoryId,
              status: 'PICKED',
              order_index: item.order_index || 0
            };

            console.log(`📦 Creating checklist item: ${item.name}`);

            const response = await fetch(`${backendUrl}/api/items`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(newItemForChecklist)
            });

            if (response.ok) {
              successCount++;
              console.log(`✅ Successfully transferred: ${item.name}`);
            }
          }
        }
      } catch (structureError) {
        console.error('❌ Error creating checklist structure:', structureError);
        alert('❌ Failed to create checklist structure');
        return;
      }

      alert(`✅ Successfully transferred ${successCount} CHECKED items from Walkthrough to Checklist!`);
      
      // Clear checked items after successful transfer
      setCheckedItems(new Set());
      
      if (onReload) {
        onReload();
      }

    } catch (error) {
      console.error('❌ Error in transfer process:', error);
      alert('❌ Failed to transfer items to checklist');
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

      console.log('📡 Delete response status:', response.status, response.statusText);

      if (response.ok) {
        console.log('✅ Walkthrough item deleted successfully');
        
        // Immediate reload - PRESERVE EXPANSION STATE
        const currentExpandedRooms = {...expandedRooms};
        const currentExpandedCategories = {...expandedCategories};
        
        if (onReload) {
          console.log('🔄 Calling onReload after successful delete');
          await onReload();
          
          // Restore expansion state
          setTimeout(() => {
            setExpandedRooms(currentExpandedRooms);
            setExpandedCategories(currentExpandedCategories);
          }, 100);
        }
      } else {
        const errorText = await response.text();
        console.error('❌ Delete item failed:', response.status, errorText);
        alert(`Failed to delete item: ${response.status} - ${errorText}`);
      }
    } catch (error) {
      console.error('❌ Error deleting walkthrough item:', error);
      alert('Error deleting item: ' + error.message);
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
          
          {/* Filter Buttons - WORKING FILTER */}
          <div className="flex gap-4">
            <button 
              onClick={() => {
                console.log('🔍 WALKTHROUGH FILTER APPLIED');
                // Filters are already applied via useEffect, just trigger a manual update
                setFilteredProject({...filteredProject});
              }}
              className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded font-medium"
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
                setFilteredProject(project); // Reset to original project
                console.log('🧹 WALKTHROUGH FILTER CLEARED');
              }}
              className="bg-gray-600 hover:bg-gray-500 text-white px-4 py-2 rounded font-medium"
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
              {/* ROOM HEADER WITH DIFFERENT MUTED COLORS FOR EACH ROOM */}
              <div className="mt-8 mb-4 px-4 py-2 text-white font-bold" style={{ 
                backgroundColor: roomColors?.[room.name.toLowerCase()] || 
                  ['#7A5A8A', '#5A6A5A', '#6A5A7A', '#7A5A5A', '#5A6A6A', '#5A5A7A', '#6A4A4A', '#4A6A6A'][roomIndex % 8]
              }}>
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
                                        <input 
                                          type="checkbox" 
                                          className="w-6 h-6 cursor-pointer" 
                                          checked={checkedItems.has(item.id)}
                                          onChange={(e) => {
                                            const newCheckedItems = new Set(checkedItems);
                                            if (e.target.checked) {
                                              newCheckedItems.add(item.id);
                                            } else {
                                              newCheckedItems.delete(item.id);
                                            }
                                            setCheckedItems(newCheckedItems);
                                          }}
                                        />
                                      </td>
                                      <td className="border border-gray-400 px-2 py-1 text-white text-sm">
                                        <div 
                                          contentEditable
                                          suppressContentEditableWarning={true}
                                          className="w-full bg-transparent text-white text-sm outline-none"
                                          onBlur={(e) => console.log('Item name updated:', e.target.textContent)}
                                        >
                                          {item.name}
                                        </div>
                                      </td>
                                      <td className="border border-gray-400 px-2 py-1 text-white text-sm text-center w-16">
                                        <div 
                                          contentEditable
                                          suppressContentEditableWarning={true}
                                          className="w-full bg-transparent text-white text-sm outline-none text-center"
                                          onBlur={(e) => console.log('Quantity updated:', e.target.textContent)}
                                        >
                                          {item.quantity || 1}
                                        </div>
                                      </td>
                                      <td className="border border-gray-400 px-2 py-1 text-white text-sm">
                                        <div 
                                          contentEditable
                                          suppressContentEditableWarning={true}
                                          className="w-full bg-transparent text-white text-sm outline-none"
                                          onBlur={(e) => console.log('Size updated:', e.target.textContent)}
                                        >
                                          {item.size || ''}
                                        </div>
                                      </td>
                                      <td className="border border-gray-400 px-2 py-1 text-white text-sm">
                                        <div 
                                          contentEditable
                                          suppressContentEditableWarning={true}
                                          className="w-full bg-transparent text-white text-sm outline-none"
                                          onBlur={(e) => console.log('Finish/Color updated:', e.target.textContent)}
                                        >
                                          {item.finish_color || ''}
                                        </div>
                                      </td>
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
                            <div className="mb-4 flex justify-between items-center">
                              <select
                                value=""
                                onChange={(e) => {
                                  if (e.target.value === 'CREATE_NEW') {
                                    const categoryName = window.prompt('Enter new category name:');
                                    if (categoryName && categoryName.trim()) {
                                      handleAddCategory(room.id, categoryName.trim());
                                    }
                                  } else if (e.target.value) {
                                    handleAddCategory(room.id, e.target.value);
                                  }
                                }}
                                className="text-white px-3 py-2 rounded font-medium border-none outline-none text-sm" 
                                style={{ backgroundColor: '#8b7355' }}
                              >
                                <option value="">+ ADD CATEGORY ▼</option>
                                <option value="Lighting">Lighting</option>
                                <option value="Furniture">Furniture</option>
                                <option value="Decor & Accessories">Decor & Accessories</option>
                                <option value="Paint, Wallpaper, and Finishes">Paint, Wallpaper, and Finishes</option>
                                <option value="Plumbing & Fixtures">Plumbing & Fixtures</option>
                                <option value="Appliances">Appliances</option>
                                <option value="CREATE_NEW">+ Create New Category</option>
                              </select>
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

      {/* FOOTER REMOVED - ADD CATEGORY NOW IN EACH SECTION */}
      
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
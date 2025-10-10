import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

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
  
  // Load expanded states from localStorage
  const [expandedRooms, setExpandedRooms] = useState(() => {
    const saved = localStorage.getItem('walkthrough_expandedRooms');
    return saved ? JSON.parse(saved) : {};
  });
  const [expandedCategories, setExpandedCategories] = useState(() => {
    const saved = localStorage.getItem('walkthrough_expandedCategories');
    return saved ? JSON.parse(saved) : {};
  });
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRoom, setSelectedRoom] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedVendor, setSelectedVendor] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [filteredProject, setFilteredProject] = useState(project);

  // DRAG AND DROP HANDLER
  const handleDragEnd = async (result) => {
    console.log('🎯 WALKTHROUGH DRAG END CALLED!', result);
    const { source, destination, type } = result;

    if (!destination) {
      console.log('❌ No destination');
      return;
    }
    if (source.droppableId === destination.droppableId && source.index === destination.index) {
      console.log('❌ Same position');
      return;
    }

    try {
      console.log('🔄 Processing drag for type:', type);
      if (type === 'ROOM') {
        const newRooms = Array.from(project.rooms);
        const [removed] = newRooms.splice(source.index, 1);
        newRooms.splice(destination.index, 0, removed);

        for (let i = 0; i < newRooms.length; i++) {
          await fetch(`${process.env.REACT_APP_BACKEND_URL || window.location.origin}/api/rooms/${newRooms[i].id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ order_index: i })
          });
        }

        if (onReload) await onReload();
      } else if (type === 'CATEGORY') {
        const roomId = source.droppableId.replace('categories-', '');
        const room = project.rooms.find(r => r.id === roomId);
        if (!room) return;

        const newCategories = Array.from(room.categories);
        const [removed] = newCategories.splice(source.index, 1);
        newCategories.splice(destination.index, 0, removed);

        for (let i = 0; i < newCategories.length; i++) {
          await fetch(`${process.env.REACT_APP_BACKEND_URL || window.location.origin}/api/categories/${newCategories[i].id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ order_index: i })
          });
        }

        if (onReload) await onReload();
      }
    } catch (error) {
      console.error('Drag and drop error:', error);
    }
  };

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
    try {
      console.log(`🚀 WALKTHROUGH ADD CATEGORY: Creating comprehensive '${categoryName}' with ALL subcategories and items`);
      
      // Use the new comprehensive endpoint that auto-populates with ALL items and subcategories
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL || window.location.origin}/api/categories/comprehensive?room_id=${roomId}&category_name=${encodeURIComponent(categoryName)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.ok) {
        const newCategory = await response.json();
        console.log(`✅ WALKTHROUGH SUCCESS: Created comprehensive category '${categoryName}' with ${newCategory.subcategories?.length || 0} subcategories`);
        
        alert(`✅ Added comprehensive category '${categoryName}' with all subcategories and items!`);
        
        if (onReload) onReload();
      } else {
        const errorText = await response.text();
        console.error(`❌ Failed to create comprehensive category: ${errorText}`);
        alert(`Failed to add category '${categoryName}'. Please try again.`);
      }
    } catch (error) {
      console.error('Error adding comprehensive category:', error);
      alert(`Error adding category '${categoryName}'. Please try again.`);
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
      // 🚨 EXACT REPLICATION OF GOOGLE APPS SCRIPT populateChecklistFromWalkthroughApp() LOGIC
      console.log('🚀 GOOGLE APPS SCRIPT TRANSFER: populateChecklistFromWalkthroughApp()');
      
      // STEP 1: Validation - Mirror Google Apps Script lines 462-467
      if (checkedItems.size === 0) {
        alert('Please select items in the Walkthrough App by checking their checkboxes (Column A) before attempting to transfer.');
        return;
      }
      
      console.log(`Attempting to transfer ${checkedItems.size} items to Checklist.`);
      
      // STEP 2: Collect ONLY checked items - Mirror Google Apps Script itemsToInsert array
      const itemsToTransfer = [];
      
      // Convert Set to Array for direct iteration - like Google Apps Script's approach
      const checkedItemIds = Array.from(checkedItems);
      console.log('🔍 Checked Item IDs:', checkedItemIds);
      
      // Find actual item objects for the checked IDs
      if (filteredProject?.rooms) {
        filteredProject.rooms.forEach(room => {
          room.categories?.forEach(category => {
            category.subcategories?.forEach(subcategory => {
              subcategory.items?.forEach(item => {
                // CRITICAL: Only include if this item's ID is in the checked list
                if (checkedItemIds.includes(item.id)) {
                  console.log(`✅ MATCHED CHECKED ITEM: "${item.name}" (ID: ${item.id})`);
                  itemsToTransfer.push({
                    item,
                    roomName: room.name,
                    categoryName: category.name,
                    subcategoryName: subcategory.name
                  });
                }
              });
            });
          });
        });
      }
      
      // VALIDATION: Ensure we found all checked items
      if (itemsToTransfer.length !== checkedItems.size) {
        console.error(`🚨 MISMATCH: Found ${itemsToTransfer.length} items but expected ${checkedItems.size}`);
        alert(`Error: Could not find all checked items. Expected ${checkedItems.size}, found ${itemsToTransfer.length}`);
        return;
      }
      
      console.log(`Verified: ${itemsToTransfer.length} items ready for transfer`);
      
      // Confirm transfer - like Google Apps Script
      if (!confirm(`Transfer ${itemsToTransfer.length} selected items to Checklist?`)) {
        return;
      }

      // STEP 2: Google Apps Script Transfer Logic - Create structure then add ONLY checked items
      const backendUrl = process.env.REACT_APP_BACKEND_URL || window.location.origin;
      const projectId = filteredProject.id;
      
      let successCount = 0;
      const createdStructures = new Map();
      
      console.log(`🚀 GOOGLE APPS SCRIPT TRANSFER: Creating structure and adding ${itemsToTransfer.length} checked items`);

      for (const itemData of itemsToTransfer) {
        try {
          const roomKey = `${itemData.roomName}_checklist`;
          const categoryKey = `${roomKey}_${itemData.categoryName}`;
          const subcategoryKey = `${categoryKey}_${itemData.subcategoryName}`;
          
          // Create EMPTY checklist room if needed (backend now creates empty rooms for checklist)
          let roomId = createdStructures.get(roomKey);
          if (!roomId) {
            console.log(`📁 Creating EMPTY checklist room: ${itemData.roomName}`);
            const roomResponse = await fetch(`${backendUrl}/api/rooms`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                name: itemData.roomName,
                project_id: projectId,
                sheet_type: 'checklist',  // Backend will create EMPTY room
                description: `Transferred from walkthrough`,
                auto_populate: false  // CRITICAL: Don't auto-populate for transfer
              })
            });
            
            if (roomResponse.ok) {
              const newRoom = await roomResponse.json();
              roomId = newRoom.id;
              createdStructures.set(roomKey, roomId);
              console.log(`✅ Created empty checklist room: ${itemData.roomName}`);
            } else {
              console.error(`❌ Failed to create room: ${itemData.roomName}`);
              continue;
            }
          }
          
          // Create category if needed
          let categoryId = createdStructures.get(categoryKey);
          if (!categoryId) {
            console.log(`📂 Creating category: ${itemData.categoryName}`);
            const categoryResponse = await fetch(`${backendUrl}/api/categories`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                name: itemData.categoryName,
                room_id: roomId,
                description: '',
                color: '#4A90E2',
                order_index: 0
              })
            });
            
            if (categoryResponse.ok) {
              const newCategory = await categoryResponse.json();
              categoryId = newCategory.id;
              createdStructures.set(categoryKey, categoryId);
              console.log(`✅ Created category: ${itemData.categoryName}`);
            } else {
              console.error(`❌ Failed to create category: ${itemData.categoryName}`);
              continue;
            }
          }
          
          // Create subcategory if needed
          let subcategoryId = createdStructures.get(subcategoryKey);
          if (!subcategoryId) {
            console.log(`📄 Creating subcategory: ${itemData.subcategoryName}`);
            const subcategoryResponse = await fetch(`${backendUrl}/api/subcategories`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                name: itemData.subcategoryName,
                category_id: categoryId,
                description: '',
                color: '#6BA3E6',
                order_index: 0
              })
            });
            
            if (subcategoryResponse.ok) {
              const newSubcategory = await subcategoryResponse.json();
              subcategoryId = newSubcategory.id;
              createdStructures.set(subcategoryKey, subcategoryId);
              console.log(`✅ Created subcategory: ${itemData.subcategoryName}`);
            } else {
              console.error(`❌ Failed to create subcategory: ${itemData.subcategoryName}`);
              continue;
            }
          }
          
          // Create ONLY the checked item - Google Apps Script insertRows() equivalent
          console.log(`📝 Creating ONLY CHECKED ITEM: "${itemData.item.name}"`);
          const itemResponse = await fetch(`${backendUrl}/api/items`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: itemData.item.name,
              vendor: itemData.item.vendor || '',
              sku: itemData.item.sku || '',
              cost: itemData.item.cost || 0,
              size: itemData.item.size || '',
              finish_color: '', // ALWAYS BLANK as requested
              quantity: itemData.item.quantity || 1,
              subcategory_id: subcategoryId,
              status: '', // BLANK STATUS as required for transfer
              order_index: 0
            })
          });
          
          if (itemResponse.ok) {
            successCount++;
            console.log(`✅ SUCCESSFULLY CREATED CHECKED ITEM: ${itemData.item.name}`);
          } else {
            console.error(`❌ Failed to create checked item: ${itemData.item.name}`);
          }
          
        } catch (error) {
          console.error(`❌ Error processing ${itemData.item.name}:`, error);
        }
      }

      // STEP 4: Clear checkboxes and notify - Mirror Google Apps Script success handling
      if (successCount > 0) {
        // Clear checkboxes like Google Apps Script: "checkboxRange.setValue(false)"
        setCheckedItems(new Set());
        console.log(`Cleared ${checkedItems.size} checkboxes in Walkthrough App.`);
        
        alert(`Successfully transferred ${successCount} items to the Checklist.`);
        
        if (onReload) onReload();
      } else {
        alert('No items were transferred.');
      }

    } catch (error) {
      console.error('❌ Transfer error:', error);
      alert('❌ Transfer failed: ' + error.message);
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
      
      {/* ENHANCED FILTER SECTION - EXACT SAME TREATMENT AS GRAPHS */}
      <div className="rounded-2xl shadow-xl backdrop-blur-sm p-6 border border-[#B49B7E]/20 mb-6" 
           style={{
             background: 'linear-gradient(135deg, rgba(0,0,0,0.95) 0%, rgba(30,30,30,0.9) 30%, rgba(0,0,0,0.95) 100%)'
           }}>
        <div className="flex flex-col gap-4">
          {/* Search Bar */}
          <div className="w-full">
            <input
              type="text"
              placeholder="Search Items, Vendors, SKUs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 rounded bg-gray-900/50 text-[#D4A574] border border-[#D4A574]/50 focus:border-[#D4A574] focus:outline-none placeholder-[#D4A574]/70"
            />
          </div>
          
          {/* Filter Dropdowns */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <select 
              value={selectedRoom}
              onChange={(e) => setSelectedRoom(e.target.value)}
              className="px-3 py-2 rounded bg-gray-900/50 text-[#B49B7E] border border-[#B49B7E]/50 focus:border-[#B49B7E] focus:outline-none"
            >
              <option value="">All Rooms</option>
              {(project?.rooms || []).map(room => (
                <option key={room.id} value={room.id}>{room.name}</option>
              ))}
            </select>
            <select 
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 rounded bg-gray-900/50 text-[#B49B7E] border border-[#B49B7E]/50 focus:border-[#B49B7E] focus:outline-none"
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
              className="px-3 py-2 rounded bg-gray-900/50 text-[#B49B7E] border border-[#B49B7E]/50 focus:border-[#B49B7E] focus:outline-none"
            >
              <option value="">All Vendors</option>
              {(vendorTypes || []).map(vendor => (
                <option key={vendor} value={vendor}>{vendor}</option>
              ))}
            </select>
            <select 
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-2 rounded bg-gray-900/50 text-[#B49B7E] border border-[#B49B7E]/50 focus:border-[#B49B7E] focus:outline-none"
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
          
          {/* Action Buttons */}
          <div className="flex gap-3">
            <button 
              onClick={onAddRoom}
              className="bg-gradient-to-r from-[#B49B7E] to-[#A08B6F] hover:from-[#A08B6F] hover:to-[#8B7355] px-6 py-2 rounded-full shadow-xl hover:shadow-[#B49B7E]/30 transition-all duration-300 transform hover:scale-105 tracking-wide font-medium border border-[#D4C5A9]/20 text-black"
            >
              ➕ ADD ROOM
            </button>
            <button 
              onClick={handleTransferToChecklist}
              className="bg-gradient-to-r from-[#8B7355] to-[#6B5B4B] hover:from-[#7A6749] hover:to-[#5A4F40] px-6 py-2 rounded-full shadow-xl hover:shadow-[#8B7355]/30 transition-all duration-300 transform hover:scale-105 tracking-wide font-medium border border-[#A08B6F]/20 text-[#F5F5DC]"
            >
              → TRANSFER TO CHECKLIST
            </button>
          </div>
        </div>
      </div>
      
      {/* DYNAMIC SPREADSHEET WITH REAL DATA - EXACT SAME TREATMENT AS GRAPHS */}
      <div className="rounded-2xl shadow-xl backdrop-blur-sm p-6 border border-[#B49B7E]/20 mb-6" 
           style={{
             background: 'linear-gradient(135deg, rgba(0,0,0,0.95) 0%, rgba(30,30,30,0.9) 30%, rgba(0,0,0,0.95) 100%)'
           }}>
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="walkthrough-rooms" type="ROOM">
            {(provided) => (
              <div className="overflow-x-auto" ref={provided.innerRef} {...provided.droppableProps}>
          
          {/* USE FILTERED PROJECT DATA */}
          {((filteredProject || project)?.rooms || []).map((room, roomIndex) => {
          const isRoomExpanded = expandedRooms[room.id];
          
          return (
            <Draggable key={room.id} draggableId={room.id} index={roomIndex}>
              {(provided, snapshot) => (
                <div 
                  ref={provided.innerRef}
                  {...provided.draggableProps}
                  {...provided.dragHandleProps}
                  className="mb-8"
                  style={{
                    ...provided.draggableProps.style,
                    opacity: snapshot.isDragging ? 0.8 : 1,
                    transform: provided.draggableProps.style?.transform || 'none'
                  }}
                >
              {/* ROOM HEADER WITH DIFFERENT MUTED COLORS FOR EACH ROOM */}
              <div className="mt-8 mb-4 px-4 py-2 text-[#F5F5DC] font-bold" style={{ 
                backgroundColor: roomColors?.[room.name.toLowerCase()] || 
                  ['#7A5A8A', '#5A6A5A', '#6A5A7A', '#7A5A5A', '#5A6A6A', '#5A5A7A', '#6A4A4A', '#4A6A6A'][roomIndex % 8]
              }}>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className="cursor-move text-[#F5F5DC] hover:text-[#F5F5DC]/80 px-2">
                      ⋮⋮
                    </div>
                    <button
                      onClick={() => toggleRoomExpansion(room.id)}
                      className="text-[#F5F5DC] hover:text-[#F5F5DC]/80"
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
              
              {/* CATEGORIES - ONLY SHOW WHEN EXPANDED WITH DRAG DROP */}
              {isRoomExpanded && (
                <Droppable droppableId={`categories-${room.id}`} type="CATEGORY">
                  {(provided) => (
                    <div ref={provided.innerRef} {...provided.droppableProps}>
                  {(room.categories || []).map((category, catIndex) => {
                    const isCategoryExpanded = expandedCategories[category.id];
                    
                    return (
                      <Draggable key={category.id} draggableId={category.id} index={catIndex}>
                        {(provided, snapshot) => (
                          <div 
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className="mb-4"
                            style={{
                              ...provided.draggableProps.style,
                              opacity: snapshot.isDragging ? 0.8 : 1,
                              transform: provided.draggableProps.style?.transform || 'none'
                            }}
                          >
                        {/* CATEGORY HEADER (GREEN) WITH EXPAND/COLLAPSE - EXACTLY LIKE OTHER SHEETS */}
                        <div className="mb-4 px-4 py-2 text-[#F5F5DC] font-bold" style={{ backgroundColor: '#065F46' }}>
                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-2">
                              <div className="cursor-move text-[#F5F5DC] hover:text-[#F5F5DC]/80 px-1">
                                ⋮⋮
                              </div>
                              <button
                                onClick={() => toggleCategoryExpansion(category.id)}
                                className="text-[#F5F5DC] hover:text-[#F5F5DC]/80"
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
                        
                        {/* SUBCATEGORY TABLES - EXACTLY LIKE CHECKLIST AND FFE */}
                        {isCategoryExpanded && (
                          <>
                            {category.subcategories?.map((subcategory) => (
                              <React.Fragment key={subcategory.id || subcategory.name}>
                                {/* TABLE WITH SUBCATEGORY NAME IN HEADER - MATCHING CHECKLIST */}
                                <table className="w-full border-collapse border border-[#B49B7E] mb-4 shadow-lg shadow-[#B49B7E]/10">
                                  <thead>
                                    <tr>
                                      <th className="border border-[#B49B7E] px-1 py-2 text-xs font-bold text-[#F5F5DC] w-6 shadow-inner shadow-[#B49B7E]/20" style={{ backgroundColor: '#8b7355' }}>✓</th>
                                      <th className="border border-[#B49B7E] px-2 py-2 text-xs font-bold text-[#F5F5DC] shadow-inner shadow-[#B49B7E]/20" style={{ backgroundColor: '#8B4444' }}>{subcategory.name.toUpperCase()}</th>
                                      <th className="border border-[#B49B7E] px-2 py-2 text-xs font-bold text-[#F5F5DC] w-16 shadow-inner shadow-[#B49B7E]/20" style={{ backgroundColor: '#8B4444' }}>QTY</th>
                                      <th className="border border-[#B49B7E] px-2 py-2 text-xs font-bold text-[#F5F5DC] shadow-inner shadow-[#B49B7E]/20" style={{ backgroundColor: '#8B4444' }}>SIZE</th>
                                      <th className="border border-[#B49B7E] px-2 py-2 text-xs font-bold text-[#F5F5DC] shadow-inner shadow-[#B49B7E]/20" style={{ backgroundColor: '#8B4444' }}>FINISH/COLOR</th>
                                      <th className="border border-[#B49B7E] px-1 py-2 text-xs font-bold text-[#F5F5DC] w-12 shadow-inner shadow-[#B49B7E]/20" style={{ backgroundColor: '#8B4444' }}>DELETE</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {/* ITEMS FOR THIS SUBCATEGORY */}
                                    {(subcategory.items || []).map((item, itemIndex) => (
                                    <tr key={item.id} className={itemIndex % 2 === 0 ? 'bg-gradient-to-r from-black/80 to-gray-900/80' : 'bg-gradient-to-r from-gray-900/60 to-black/60'}>
                                      <td className="border border-[#B49B7E]/20 px-1 py-1 text-center w-6">
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
                                      <td className="border border-[#B49B7E]/20 px-2 py-1 text-sm" style={{ color: '#F5F5DC' }}>
                                        <div 
                                          contentEditable
                                          suppressContentEditableWarning={true}
                                          className="w-full bg-transparent text-sm outline-none"
                                          style={{ color: '#F5F5DC' }}
                                          onBlur={(e) => console.log('Item name updated:', e.target.textContent)}
                                        >
                                          {item.name}
                                        </div>
                                      </td>
                                      <td className="border border-[#B49B7E]/20 px-2 py-1 text-sm text-center w-16" style={{ color: '#F5F5DC' }}>
                                        <div 
                                          contentEditable
                                          suppressContentEditableWarning={true}
                                          className="w-full bg-transparent text-sm outline-none text-center"
                                          style={{ color: '#F5F5DC' }}
                                          onBlur={(e) => console.log('Quantity updated:', e.target.textContent)}
                                        >
                                          {item.quantity || 1}
                                        </div>
                                      </td>
                                      <td className="border border-[#B49B7E]/20 px-2 py-1 text-sm" style={{ color: '#F5F5DC' }}>
                                        <div 
                                          contentEditable
                                          suppressContentEditableWarning={true}
                                          className="w-full bg-transparent text-sm outline-none"
                                          style={{ color: '#F5F5DC' }}
                                          onBlur={(e) => console.log('Size updated:', e.target.textContent)}
                                        >
                                          {item.size || ''}
                                        </div>
                                      </td>
                                      <td className="border border-[#B49B7E]/20 px-2 py-1 text-sm" style={{ color: '#F5F5DC' }}>
                                        <div 
                                          contentEditable
                                          suppressContentEditableWarning={true}
                                          className="w-full bg-transparent text-sm outline-none"
                                          style={{ color: '#F5F5DC' }}
                                          onBlur={(e) => console.log('Finish/Color updated:', e.target.textContent)}
                                        >
                                          {item.finish_color || ''}
                                        </div>
                                      </td>
                                      <td className="border border-[#B49B7E]/20 px-1 py-1 text-center w-12">
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
                                <option value="Window Treatments">Window Treatments</option>
                                <option value="Textiles & Soft Goods">Textiles & Soft Goods</option>
                                <option value="Art & Accessories">Art & Accessories</option>
                                <option value="Fireplace & Built-ins">Fireplace & Built-ins</option>
                                <option value="Paint, Wallpaper, and Finishes">Paint, Wallpaper, and Finishes</option>
                                <option value="Plumbing & Fixtures">Plumbing & Fixtures</option>
                                <option value="Furniture & Storage">Furniture & Storage</option>
                                <option value="Cabinets & Storage">Cabinets & Storage</option>
                                <option value="Cabinets, Built-ins, and Trim">Cabinets, Built-ins, and Trim</option>
                                <option value="Tile and Tops">Tile and Tops</option>
                                <option value="Appliances">Appliances</option>
                                <option value="Decor & Accessories">Decor & Accessories</option>
                                <option value="CREATE_NEW">+ Create New Category</option>
                              </select>
                              <button 
                                onClick={() => handleAddBlankRow(category.id)}
                                className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded text-sm"
                              >
                                + ADD ITEM
                              </button>
                            </div>
                              </React.Fragment>
                            ))}
                          </>
                        )}
                          </div>
                        )}
                      </Draggable>
                    );
                  })}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              )}
                </div>
              )}
            </Draggable>
          );
        })}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      </div> {/* END DARK NAVY SPREADSHEET CONTAINER */}

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
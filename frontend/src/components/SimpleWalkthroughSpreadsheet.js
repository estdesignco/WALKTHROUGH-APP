import React, { useState, useEffect, useRef } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { getRoomColor, getCategoryColor } from '../utils/roomColors';

const SimpleWalkthroughSpreadsheet = ({ 
  project, 
  roomColors, 
  categoryColors, 
  itemStatuses = [],
  vendorTypes = [],
  carrierTypes = [],
  onDeleteRoom, 
  onBulkDeleteRooms,
  onAddRoom,
  onReload 
}) => {
  
  // State to track checked items for transfer - Initialize from PICKED status
  const [checkedItems, setCheckedItems] = useState(new Set());
  const [selectedRoomsForDelete, setSelectedRoomsForDelete] = useState(new Set());
  console.log('🎯 SimpleWalkthroughSpreadsheet rendering with project:', project);

  // Initialize checkedItems from items with PICKED status
  useEffect(() => {
    if (project?.rooms) {
      const pickedItemIds = new Set();
      project.rooms.forEach(room => {
        room.categories?.forEach(cat => {
          cat.subcategories?.forEach(subcat => {
            subcat.items?.forEach(item => {
              if (item.status === 'PICKED') {
                pickedItemIds.add(item.id);
              }
            });
          });
        });
      });
      setCheckedItems(pickedItemIds);
      console.log('✅ Initialized checkedItems from PICKED status:', pickedItemIds.size, 'items');
    }
  }, [project]);

  const [showAddItem, setShowAddItem] = useState(false);
  const [selectedSubCategoryId, setSelectedSubCategoryId] = useState(null);
  const [availableCategories, setAvailableCategories] = useState([]);
  
  // Get project-specific storage keys
  const getStorageKey = (suffix) => `walkthrough_${project?.id || 'default'}_${suffix}`;
  
  // Load expanded states from localStorage (project-specific)
  const [expandedRooms, setExpandedRooms] = useState({});
  const [expandedCategories, setExpandedCategories] = useState({});
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRoom, setSelectedRoom] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedVendor, setSelectedVendor] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [filteredProject, setFilteredProject] = useState(project);
  const [expandedFloors, setExpandedFloors] = useState({});

  // Get ordered floor list — user-controlled order, not hardcoded
  const getFloorOrder = () => {
    const p = filteredProject || project;
    if (p?.floor_order?.length) return p.floor_order;
    // Derive from rooms if no stored order
    const floors = [];
    (p?.rooms || []).forEach(r => {
      const f = r.floor || '1ST FLOOR';
      if (!floors.includes(f)) floors.push(f);
    });
    return floors.length ? floors : ['1ST FLOOR'];
  };

  const toggleFloor = (floorName) => {
    setExpandedFloors(prev => ({ ...prev, [floorName]: prev[floorName] === false ? true : false }));
  };

  const saveFloorOrder = async (newOrder) => {
    try {
      const backendUrl = (window.ENV?.REACT_APP_BACKEND_URL || process.env.REACT_APP_BACKEND_URL || window.location.origin);
      await fetch(`${backendUrl}/api/projects/${project.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ floor_order: newOrder })
      });
    } catch (err) { console.error('Failed to save floor order:', err); }
  };

  const addFloor = async (name) => {
    const floors = getFloorOrder();
    if (!floors.includes(name)) {
      const newOrder = [...floors, name];
      await saveFloorOrder(newOrder);
      if (onReload) onReload();
    }
  };

  const deleteFloor = async (floorName) => {
    const floors = getFloorOrder().filter(f => f !== floorName);
    const backendUrl = (window.ENV?.REACT_APP_BACKEND_URL || process.env.REACT_APP_BACKEND_URL || window.location.origin);
    // Move rooms from deleted floor to first remaining floor
    const targetFloor = floors[0] || '1ST FLOOR';
    const roomsOnFloor = (project?.rooms || []).filter(r => (r.floor || '1ST FLOOR') === floorName);
    await Promise.all(roomsOnFloor.map(r =>
      fetch(`${backendUrl}/api/rooms/${r.id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ floor: targetFloor })
      })
    ));
    await saveFloorOrder(floors);
    if (onReload) onReload();
  };

  const moveFloor = async (fromIndex, toIndex) => {
    const floors = [...getFloorOrder()];
    const [moved] = floors.splice(fromIndex, 1);
    floors.splice(toIndex, 0, moved);
    await saveFloorOrder(floors);
    setFilteredProject(prev => prev ? { ...prev, floor_order: floors } : prev);
  };

  const renameFloor = async (oldName, newName) => {
    if (!newName || newName === oldName) return;
    const backendUrl = (window.ENV?.REACT_APP_BACKEND_URL || process.env.REACT_APP_BACKEND_URL || window.location.origin);
    const roomsOnFloor = (project?.rooms || []).filter(r => (r.floor || '1ST FLOOR') === oldName);
    await Promise.all(roomsOnFloor.map(r =>
      fetch(`${backendUrl}/api/rooms/${r.id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ floor: newName })
      })
    ));
    const floors = getFloorOrder().map(f => f === oldName ? newName : f);
    await saveFloorOrder(floors);
    if (onReload) onReload();
  };

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
        // Build ordered room list matching render order (grouped by floor)
        const allRooms = (filteredProject || project)?.rooms || [];
        const floors = getFloorOrder();
        allRooms.forEach(r => { const f = r.floor || '1ST FLOOR'; if (!floors.includes(f)) floors.push(f); });
        const orderedRooms = [];
        floors.forEach(floorName => {
          allRooms.filter(r => (r.floor || '1ST FLOOR') === floorName).forEach(r => orderedRooms.push(r));
        });

        const newRooms = Array.from(orderedRooms);
        const [removed] = newRooms.splice(source.index, 1);
        newRooms.splice(destination.index, 0, removed);
        
        const updatedProject = {...project, rooms: newRooms};
        
        console.log('🔄 WALKTHROUGH: Moving room from', source.index, 'to', destination.index);
        
        // Force React to re-render immediately
        setFilteredProject(updatedProject);

        // Update backend and WAIT for it to complete
        await Promise.all(newRooms.map((room, i) => 
          fetch(`${(window.ENV?.REACT_APP_BACKEND_URL || window.location.origin) || window.location.origin}/api/rooms/${room.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ order_index: i })
          })
        ));

        console.log('✅ WALKTHROUGH: Rooms reordered and saved!');
      } else if (type === 'CATEGORY') {
        // Create deep copy of project
        const updatedProject = {...project};
        const roomId = source.droppableId.replace('categories-', '');
        const room = updatedProject.rooms.find(r => r.id === roomId);
        if (!room) return;

        const newCategories = Array.from(room.categories);
        const [removed] = newCategories.splice(source.index, 1);
        newCategories.splice(destination.index, 0, removed);
        
        room.categories = newCategories;
        
        console.log('🔄 WALKTHROUGH: Moving category from', source.index, 'to', destination.index);
        
        // Force React to re-render immediately
        setFilteredProject(updatedProject);

        // Update backend and WAIT for it to complete
        await Promise.all(newCategories.map((category, i) => 
          fetch(`${(window.ENV?.REACT_APP_BACKEND_URL || window.location.origin) || window.location.origin}/api/categories/${category.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ order_index: i })
          })
        ));

        console.log('✅ WALKTHROUGH: Categories reordered and saved!');
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

  // Initialize all rooms and categories as expanded ONLY on first load
  // Use a ref to track if we've already initialized for this project
  const hasInitialized = useRef(false);
  const lastProjectId = useRef(null);
  
  useEffect(() => {
    // Reset initialization if project changes
    if (project?.id && project.id !== lastProjectId.current) {
      hasInitialized.current = false;
      lastProjectId.current = project.id;
    }
    
    if (project?.rooms && !hasInitialized.current) {
      const storageKeyRooms = `walkthrough_${project.id}_expandedRooms`;
      const storageKeyCategories = `walkthrough_${project.id}_expandedCategories`;
      
      // Migration: clear old "everything expanded" cache
      const versionKey = `walkthrough_${project.id}_expansion_v2`;
      if (!localStorage.getItem(versionKey)) {
        localStorage.removeItem(storageKeyRooms);
        localStorage.removeItem(storageKeyCategories);
        localStorage.setItem(versionKey, '1');
      }
      
      // Check if we have saved state in localStorage for this project
      const savedRooms = localStorage.getItem(storageKeyRooms);
      const savedCategories = localStorage.getItem(storageKeyCategories);
      
      if (savedRooms && savedCategories) {
        // Use saved state, but ensure new rooms are expanded
        const savedRoomState = JSON.parse(savedRooms);
        const savedCategoryState = JSON.parse(savedCategories);
        
        // Only add new rooms/categories that aren't in saved state
        project.rooms.forEach(room => {
          if (savedRoomState[room.id] === undefined) {
            savedRoomState[room.id] = false;
          }
          room.categories?.forEach(category => {
            if (savedCategoryState[category.id] === undefined) {
              savedCategoryState[category.id] = false;
            }
          });
        });
        
        setExpandedRooms(savedRoomState);
        setExpandedCategories(savedCategoryState);
      } else {
        // First time - collapse all for performance
        const roomExpansion = {};
        const categoryExpansion = {};
        
        project.rooms.forEach(room => {
          roomExpansion[room.id] = false;
          room.categories?.forEach(category => {
            categoryExpansion[category.id] = false;
          });
        });
        
        setExpandedRooms(roomExpansion);
        setExpandedCategories(categoryExpansion);
        localStorage.setItem(storageKeyRooms, JSON.stringify(roomExpansion));
        localStorage.setItem(storageKeyCategories, JSON.stringify(categoryExpansion));
      }
      
      hasInitialized.current = true;
    }
  }, [project]);

  // Fetch available categories from backend API
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const backendUrl = (window.ENV?.REACT_APP_BACKEND_URL || window.location.origin) || window.location.origin;
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
      const response = await fetch(`${(window.ENV?.REACT_APP_BACKEND_URL || window.location.origin) || window.location.origin}/api/categories/comprehensive?room_id=${roomId}&category_name=${encodeURIComponent(categoryName)}`, {
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

      const backendUrl = (window.ENV?.REACT_APP_BACKEND_URL || window.location.origin) || window.location.origin;
      
      // Create a blank row item - ALL CELLS BLANK as requested
      const blankItem = {
        name: '',
        vendor: '',
        sku: '',
        cost: 0.0,
        size: '',
        finish_color: '',
        quantity: null,
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

      const backendUrl = (window.ENV?.REACT_APP_BACKEND_URL || window.location.origin) || window.location.origin;
      
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
    setExpandedRooms(prev => {
      const newState = {
        ...prev,
        [roomId]: !prev[roomId]
      };
      if (project?.id) {
        localStorage.setItem(`walkthrough_${project.id}_expandedRooms`, JSON.stringify(newState));
      }
      return newState;
    });
  };

  // Toggle category expansion  
  const toggleCategoryExpansion = (categoryId) => {
    setExpandedCategories(prev => {
      const newState = {
        ...prev,
        [categoryId]: !prev[categoryId]
      };
      if (project?.id) {
        localStorage.setItem(`walkthrough_${project.id}_expandedCategories`, JSON.stringify(newState));
      }
      return newState;
    });
  };

  // Handle deleting a room
  const handleDeleteRoom = async (roomId) => {
    try {
      console.log('🗑️ DELETING ROOM:', roomId);
      const backendUrl = (window.ENV?.REACT_APP_BACKEND_URL || window.location.origin) || window.location.origin;
      
      const response = await fetch(`${backendUrl}/api/rooms/${roomId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.ok) {
        if (onReload) await onReload();
      } else {
        const errorText = await response.text();
        console.error('❌ Delete room failed:', response.status, errorText);
      }
    } catch (error) {
      console.error('❌ Error deleting walkthrough room:', error);
    }
  };

  // Handle deleting a category
  const handleDeleteCategory = async (categoryId) => {
    if (!window.confirm('Are you sure you want to delete this category? This will delete all items in this category.')) {
      return;
    }

    try {
      console.log('🗑️ DELETING CATEGORY:', categoryId);
      const backendUrl = (window.ENV?.REACT_APP_BACKEND_URL || window.location.origin) || window.location.origin;
      
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
      
      // Find actual item objects for the checked IDs - USE ORIGINAL PROJECT, NOT FILTERED!
      if (project?.rooms) {
        project.rooms.forEach(room => {
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
      const backendUrl = (window.ENV?.REACT_APP_BACKEND_URL || window.location.origin) || window.location.origin;
      const projectId = project.id; // USE ORIGINAL PROJECT ID, NOT FILTERED!
      
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
              finish_color: '',
              quantity: itemData.item.quantity ? parseInt(itemData.item.quantity) : null,
              subcategory_id: subcategoryId,
              status: ''
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
      const backendUrl = (window.ENV?.REACT_APP_BACKEND_URL || window.location.origin) || window.location.origin;
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

  // Handle updating any item field (finish_color, etc.) with Material Library sync
  const handleUpdateItemField = async (itemId, field, value) => {
    console.log('🔄 Walkthrough: Updating item field:', { itemId, field, value });
    
    try {
      const backendUrl = (window.ENV?.REACT_APP_BACKEND_URL || window.location.origin) || window.location.origin;
      
      const response = await fetch(`${backendUrl}/api/items/${itemId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: value })
      });
      
      if (response.ok) {
        console.log(`✅ Walkthrough: Item ${field} updated successfully to:`, value);
        
        // If finish_color was updated, sync to Material Libraries
        if (field === 'finish_color' && value && value.trim()) {
          // Find the item to get vendor, name, sku info
          let itemData = null;
          project?.rooms?.forEach(room => {
            room.categories?.forEach(category => {
              category.subcategories?.forEach(subcategory => {
                subcategory.items?.forEach(item => {
                  if (item.id === itemId) {
                    itemData = item;
                  }
                });
              });
            });
          });
          
          if (itemData) {
            // Sync to Material Libraries (with duplicate check)
            try {
              const materialData = {
                name: value.trim(),
                category: 'finish',
                manufacturer: itemData.vendor || '',
                vendor: itemData.vendor || '',
                sku: itemData.sku ? `${itemData.sku}-FINISH` : '',
                color: value.trim(),
                photo_url: itemData.finish_image || '',
                notes: `From product: ${itemData.name || 'Unknown'}`,
                tags: ['scraped', 'auto-added', itemData.vendor || ''].filter(Boolean).join(','),
                project_id: project?.id || null
              };
              
              // Add to Global Master Materials (with duplicate check)
              await fetch(`${backendUrl}/api/materials/from-scraper`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(materialData)
              });
              console.log('📚 Walkthrough: Synced finish to Global Materials Library:', value);
              
              // Add to Project Materials (with duplicate check)
              if (project?.id) {
                await fetch(`${backendUrl}/api/materials`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(materialData)
                });
                console.log('📚 Walkthrough: Synced finish to Project Materials Library:', value);
              }
            } catch (materialErr) {
              console.warn('⚠️ Walkthrough: Could not sync to Materials Library:', materialErr);
            }
          }
        }
        
        // Reload to update state
        if (onReload) {
          onReload();
        }
      } else {
        console.error(`❌ Walkthrough: Failed to update item ${field}:`, response.status);
      }
    } catch (error) {
      console.error(`❌ Walkthrough: Error updating item ${field}:`, error);
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
          {/* Filter Dropdowns */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            <select 
              value={selectedRoom}
              onChange={(e) => setSelectedRoom(e.target.value)}
              className="px-3 py-2 rounded-lg border border-[#B49B7E] text-[#D4C5A9] focus:outline-none"
              style={{
                background: 'linear-gradient(135deg, rgba(0,0,0,0.95) 0%, rgba(20,20,30,0.9) 50%, rgba(0,0,0,0.95) 100%)',
                boxShadow: '0 0 15px rgba(212, 165, 116, 0.2), inset 0 0 25px rgba(212, 165, 116, 0.06)'
              }}
            >
              <option value="">All Rooms</option>
              {(project?.rooms || []).map(room => (
                <option key={room.id} value={room.id}>{room.name}</option>
              ))}
            </select>
            <select 
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 rounded-lg border border-[#B49B7E] text-[#D4C5A9] focus:outline-none"
              style={{
                background: 'linear-gradient(135deg, rgba(0,0,0,0.95) 0%, rgba(20,20,30,0.9) 50%, rgba(0,0,0,0.95) 100%)',
                boxShadow: '0 0 15px rgba(212, 165, 116, 0.2), inset 0 0 25px rgba(212, 165, 116, 0.06)'
              }}
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
              className="px-3 py-2 rounded-lg border border-[#B49B7E] text-[#D4C5A9] focus:outline-none"
              style={{
                background: 'linear-gradient(135deg, rgba(0,0,0,0.95) 0%, rgba(20,20,30,0.9) 50%, rgba(0,0,0,0.95) 100%)',
                boxShadow: '0 0 15px rgba(212, 165, 116, 0.2), inset 0 0 25px rgba(212, 165, 116, 0.06)'
              }}
            >
              <option value="">All Vendors</option>
              {(vendorTypes || []).map(vendor => (
                <option key={vendor} value={vendor}>{vendor}</option>
              ))}
            </select>
            <select 
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-2 rounded-lg border border-[#B49B7E] text-[#D4C5A9] focus:outline-none"
              style={{
                background: 'linear-gradient(135deg, rgba(0,0,0,0.95) 0%, rgba(20,20,30,0.9) 50%, rgba(0,0,0,0.95) 100%)',
                boxShadow: '0 0 15px rgba(212, 165, 116, 0.2), inset 0 0 25px rgba(212, 165, 116, 0.06)'
              }}
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
          <div className="flex gap-3 flex-wrap">
            {selectedRoomsForDelete.size > 0 && (
              <button 
                onClick={() => {
                  if (onBulkDeleteRooms) {
                    onBulkDeleteRooms(Array.from(selectedRoomsForDelete));
                    setSelectedRoomsForDelete(new Set());
                  }
                }}
                className="px-4 py-2 rounded-full bg-red-700 hover:bg-red-800 text-white font-bold text-sm animate-pulse"
              >
                🗑️ Delete {selectedRoomsForDelete.size} Room{selectedRoomsForDelete.size > 1 ? 's' : ''}
              </button>
            )}
            {/* EXPAND / COLLAPSE ALL */}
            <button
              data-testid="walkthrough-expand-all"
              onClick={() => {
                const newRoomState = {};
                const newCatState = {};
                (project?.rooms || []).forEach(room => {
                  newRoomState[room.id] = true;
                  room.categories?.forEach(cat => { newCatState[cat.id] = true; });
                });
                setExpandedRooms(newRoomState);
                setExpandedCategories(newCatState);
                setExpandedFloors({});
                const sk1 = `walkthrough_${project?.id || 'default'}_expandedRooms`;
                const sk2 = `walkthrough_${project?.id || 'default'}_expandedCategories`;
                localStorage.setItem(sk1, JSON.stringify(newRoomState));
                localStorage.setItem(sk2, JSON.stringify(newCatState));
              }}
              className="px-4 py-2 rounded-full bg-[#D4A574]/20 hover:bg-[#D4A574]/40 text-[#D4A574] font-bold text-sm border border-[#D4A574]/30"
            >
              EXPAND ALL
            </button>
            <button
              data-testid="walkthrough-collapse-all"
              onClick={() => {
                const newRoomState = {};
                const newCatState = {};
                const newFloorState = {};
                const floors = getFloorOrder();
                floors.forEach(f => { newFloorState[f] = false; });
                (project?.rooms || []).forEach(room => {
                  newRoomState[room.id] = false;
                  room.categories?.forEach(cat => { newCatState[cat.id] = false; });
                });
                setExpandedRooms(newRoomState);
                setExpandedCategories(newCatState);
                setExpandedFloors(newFloorState);
                const sk1 = `walkthrough_${project?.id || 'default'}_expandedRooms`;
                const sk2 = `walkthrough_${project?.id || 'default'}_expandedCategories`;
                localStorage.setItem(sk1, JSON.stringify(newRoomState));
                localStorage.setItem(sk2, JSON.stringify(newCatState));
              }}
              className="px-4 py-2 rounded-full bg-gray-600/30 hover:bg-gray-600/50 text-gray-300 font-bold text-sm border border-gray-600/30"
            >
              COLLAPSE ALL
            </button>
            <button 
              onClick={onAddRoom}
              className="bg-gradient-to-r from-[#B49B7E] to-[#A08B6F] hover:from-[#A08B6F] hover:to-[#8B7355] px-6 py-2 rounded-full shadow-xl hover:shadow-[#B49B7E]/30 transition-all duration-300 transform hover:scale-105 tracking-wide font-medium border border-[#D4C5A9]/20 text-black"
            >
              ➕ ADD ROOM
            </button>
            <button 
              onClick={handleTransferToChecklist}
              className="bg-gradient-to-r from-[#8B7355] to-[#6B5B4B] hover:from-[#7A6749] hover:to-[#5A4F40] px-6 py-2 rounded-full shadow-xl hover:shadow-[#8B7355]/30 transition-all duration-300 transform hover:scale-105 tracking-wide font-medium border border-[#A08B6F]/20 text-white"
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
          
          {/* FLOOR-BASED ROOM RENDERING - FLAT SEQUENTIAL FOR DND */}
          {(() => {
            const allRooms = (filteredProject || project)?.rooms || [];
            const floors = getFloorOrder();
            allRooms.forEach(r => { const f = r.floor || '1ST FLOOR'; if (!floors.includes(f)) floors.push(f); });
            
            // Build flat ordered list grouped by floor (sequential indices for DnD)
            const orderedRooms = [];
            floors.forEach(floorName => {
              allRooms.filter(r => (r.floor || '1ST FLOOR') === floorName).forEach(r => orderedRooms.push(r));
            });
            
            let lastFloor = null;
            return (
              <>
              {orderedRooms.map((room, seqIndex) => {
                const currentFloor = room.floor || '1ST FLOOR';
                const showFloorBanner = currentFloor !== lastFloor;
                const floorIdx = floors.indexOf(currentFloor);
                lastFloor = currentFloor;
                const isFloorCollapsed = expandedFloors[currentFloor] === false;
                const floorRoomCount = orderedRooms.filter(r => (r.floor || '1ST FLOOR') === currentFloor).length;
                const isRoomExpanded = !isFloorCollapsed && expandedRooms[room.id];
                const roomIndex = seqIndex;
                
                return (
                  <React.Fragment key={room.id}>
                    {/* FLOOR BANNER */}
                    {showFloorBanner && (
                    <div className="mt-4 mb-1" style={{
                      background: 'linear-gradient(90deg, #1a1a1a 0%, #2a2218 15%, #3d3020 50%, #2a2218 85%, #1a1a1a 100%)',
                      borderTop: '3px solid #D4A574', borderBottom: '3px solid #D4A574',
                      padding: '10px 16px', position: 'relative', overflow: 'hidden',
                    }}>
                      <div style={{ position: 'absolute', inset: 0, opacity: 0.05,
                        backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, #D4A574 10px, #D4A574 11px)',
                      }} />
                      <div className="flex items-center justify-between relative">
                        <div className="flex items-center gap-3">
                          <div className="flex flex-col gap-0" style={{ opacity: 0.6 }}>
                            {floorIdx > 0 && (
                              <button onClick={() => moveFloor(floorIdx, floorIdx - 1)}
                                className="text-[#D4A574] hover:text-white text-xs leading-none px-1" title="Move up">&#9650;</button>
                            )}
                            {floorIdx < floors.length - 1 && (
                              <button onClick={() => moveFloor(floorIdx, floorIdx + 1)}
                                className="text-[#D4A574] hover:text-white text-xs leading-none px-1" title="Move down">&#9660;</button>
                            )}
                          </div>
                          <button onClick={() => toggleFloor(currentFloor)} className="text-[#D4A574] text-lg w-6 text-center">
                            {isFloorCollapsed ? '▶' : '▼'}
                          </button>
                          <div style={{ width: '36px', height: '36px', borderRadius: '8px',
                            background: 'linear-gradient(135deg, #D4A574, #8B6914)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '16px', fontWeight: '900', color: '#000',
                            boxShadow: '0 2px 12px rgba(212, 165, 116, 0.4)',
                          }}>
                            {currentFloor.match(/\d+/) ? currentFloor.match(/\d+/)[0] : currentFloor.charAt(0)}
                          </div>
                          <span contentEditable={true} suppressContentEditableWarning={true}
                            className="outline-none px-1"
                            style={{ fontSize: '20px', fontWeight: '900', letterSpacing: '5px', color: '#D4A574',
                              textShadow: '0 2px 8px rgba(0,0,0,0.8), 0 0 20px rgba(212,165,116,0.3)',
                            }}
                            onBlur={(e) => {
                              const n = e.target.textContent?.trim()?.toUpperCase();
                              if (n && n !== currentFloor) renameFloor(currentFloor, n);
                            }}
                          >{currentFloor}</span>
                        </div>
                        <div className="flex items-center gap-4">
                          <span style={{ color: '#D4A574', opacity: 0.5, fontSize: '11px', letterSpacing: '2px', fontWeight: '700' }}>
                            {floorRoomCount} ROOM{floorRoomCount !== 1 ? 'S' : ''}
                          </span>
                          {floors.length > 1 && (
                            <button onClick={() => { if (window.confirm(`Delete "${currentFloor}"? Rooms move to ${floors.find(f => f !== currentFloor)}.`)) deleteFloor(currentFloor); }}
                              className="text-red-500/50 hover:text-red-400 text-sm px-2" title="Delete floor">&#10005;</button>
                          )}
                        </div>
                      </div>
                    </div>
                    )}
                    
            <Draggable key={room.id} draggableId={room.id} index={seqIndex}>
              {(provided, snapshot) => (
                <div 
                  ref={provided.innerRef}
                  {...provided.draggableProps}
                  {...provided.dragHandleProps}
                  className={isFloorCollapsed ? '' : 'mb-8'}
                  style={{
                    ...provided.draggableProps.style,
                    opacity: snapshot.isDragging ? 0.8 : 1,
                    transform: provided.draggableProps.style?.transform || 'none',
                    ...(isFloorCollapsed ? { height: 0, overflow: 'hidden', margin: 0, padding: 0 } : {})
                  }}
                >
              {/* ROOM HEADER - GRADIENT WITH SHIMMER */}
              <div className="mt-8 mb-4 px-4 py-2 text-white font-bold border border-[#B49B7E]" style={{ 
                background: `linear-gradient(135deg, ${room.color || getRoomColor(room.name, roomIndex)}FF 0%, ${room.color || getRoomColor(room.name, roomIndex)}AA 20%, ${room.color || getRoomColor(room.name, roomIndex)} 40%, ${room.color || getRoomColor(room.name, roomIndex)}AA 80%, ${room.color || getRoomColor(room.name, roomIndex)}FF 100%)`,
                boxShadow: `0 0 35px ${room.color || getRoomColor(room.name, roomIndex)}80, inset 0 0 70px rgba(255, 255, 255, 0.16), inset 0 0 110px rgba(0, 0, 0, 0.5)`,
                textShadow: '0 2px 8px rgba(0, 0, 0, 0.8), 0 0 20px rgba(255, 255, 255, 0.4)'
              }}>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className="cursor-move text-white hover:text-white/80 px-2">
                      ⋮⋮
                    </div>
                    <button
                      onClick={() => toggleRoomExpansion(room.id)}
                      className="text-white hover:text-white/80"
                    >
                      {isRoomExpanded ? '▼' : '▶'}
                    </button>
                    <span
                      contentEditable={true}
                      suppressContentEditableWarning={true}
                      className="outline-none px-1"
                      onBlur={async (e) => {
                        const newName = e.target.textContent?.trim();
                        if (newName && newName.toUpperCase() !== room.name.toUpperCase()) {
                          try {
                            const backendUrl = (window.ENV?.REACT_APP_BACKEND_URL || process.env.REACT_APP_BACKEND_URL || window.location.origin);
                            await fetch(`${backendUrl}/api/rooms/${room.id}`, {
                              method: 'PUT',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ name: newName.toUpperCase() })
                            });
                            if (onReload) onReload();
                          } catch (err) { console.error('Failed to update room name:', err); }
                        }
                      }}
                    >{room.name.toUpperCase()}</span>
                    {/* FLOOR SELECTOR */}
                    <select
                      data-testid={`floor-select-${room.id}`}
                      className="ml-3 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider cursor-pointer"
                      style={{
                        background: 'rgba(0,0,0,0.6)',
                        border: '1px solid #D4A574',
                        color: '#D4A574',
                        outline: 'none',
                      }}
                      value={room.floor || '1ST FLOOR'}
                      onClick={(e) => e.stopPropagation()}
                      onChange={async (e) => {
                        e.stopPropagation();
                        let newFloor = e.target.value;
                        if (newFloor === '__CUSTOM__') {
                          const custom = window.prompt('Enter custom floor/section name:');
                          if (!custom) return;
                          newFloor = custom.toUpperCase();
                          // Add to floor order if new
                          const floors = getFloorOrder();
                          if (!floors.includes(newFloor)) await saveFloorOrder([...floors, newFloor]);
                        }
                        try {
                          const backendUrl = (window.ENV?.REACT_APP_BACKEND_URL || process.env.REACT_APP_BACKEND_URL || window.location.origin);
                          await fetch(`${backendUrl}/api/rooms/${room.id}`, {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ floor: newFloor })
                          });
                          if (onReload) onReload();
                        } catch (err) {
                          console.error('Failed to update floor:', err);
                        }
                      }}
                    >
                      {getFloorOrder().map(f => (
                        <option key={f} value={f}>{f}</option>
                      ))}
                      <option value="__CUSTOM__">+ CUSTOM...</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={selectedRoomsForDelete.has(room.id)}
                      onChange={(e) => {
                        e.stopPropagation();
                        const newSet = new Set(selectedRoomsForDelete);
                        if (e.target.checked) newSet.add(room.id);
                        else newSet.delete(room.id);
                        setSelectedRoomsForDelete(newSet);
                      }}
                      className="w-5 h-5 cursor-pointer accent-red-500"
                      title="Select room for bulk delete"
                    />
                    <button
                      onClick={() => handleDeleteRoom(room.id)}
                      className="text-red-300 hover:text-red-100 text-lg"
                      title="Delete Room"
                    >
                      🗑️
                    </button>
                  </div>
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
                        {/* CATEGORY HEADER - GREEN GRADIENT WITH SHIMMER */}
                        <div className="mb-4 px-4 py-2 text-white font-bold border border-[#B49B7E]" style={{ 
                          background: `linear-gradient(135deg, ${getCategoryColor()}FF 0%, ${getCategoryColor()}AA 20%, ${getCategoryColor()} 40%, ${getCategoryColor()}AA 80%, ${getCategoryColor()}FF 100%)`,
                          boxShadow: `0 0 28px ${getCategoryColor()}65, inset 0 0 55px rgba(255, 255, 255, 0.14), inset 0 0 95px rgba(0, 0, 0, 0.45)`,
                          textShadow: '0 2px 6px rgba(0, 0, 0, 0.75), 0 0 16px rgba(255, 255, 255, 0.35)'
                        }}>
                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-2">
                              <div className="cursor-move text-white hover:text-white/80 px-1">
                                ⋮⋮
                              </div>
                              <button
                                onClick={() => toggleCategoryExpansion(category.id)}
                                className="text-white hover:text-white/80"
                              >
                                {isCategoryExpanded ? '▼' : '▶'}
                              </button>
                              <span
                                contentEditable={true}
                                suppressContentEditableWarning={true}
                                className="outline-none px-1"
                                onBlur={async (e) => {
                                  const newName = e.target.textContent?.trim();
                                  if (newName && newName.toUpperCase() !== category.name.toUpperCase()) {
                                    try {
                                      const backendUrl = (window.ENV?.REACT_APP_BACKEND_URL || process.env.REACT_APP_BACKEND_URL || window.location.origin);
                                      await fetch(`${backendUrl}/api/categories/${category.id}`, {
                                        method: 'PUT',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({ name: newName.toUpperCase() })
                                      });
                                      if (onReload) onReload();
                                    } catch (err) { console.error('Failed to update category name:', err); }
                                  }
                                }}
                              >{category.name.toUpperCase()}</span>
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
                                <table className="border-collapse border border-[#B49B7E] mb-4 shadow-lg shadow-[#B49B7E]/10" style={{ width: 'max-content' }}>
                                  <thead>
                                    <tr>
                                      <th className="border border-[#B49B7E] px-1 py-2 text-xs font-bold text-white shadow-inner shadow-[#B49B7E]/20" style={{ backgroundColor: '#8b7355' }}>✓</th>
                                      <th className="border border-[#B49B7E] px-2 py-2 text-xs font-bold text-white shadow-inner shadow-[#B49B7E]/20" style={{ 
                                    background: 'linear-gradient(135deg, #8B4444FF 0%, #8B4444AA 20%, #8B4444 40%, #8B4444AA 80%, #8B4444FF 100%)',
                                    boxShadow: '0 0 20px #8B444450, inset 0 0 40px rgba(255, 255, 255, 0.12), inset 0 0 70px rgba(0, 0, 0, 0.4)',
                                    textShadow: '0 2px 4px rgba(0, 0, 0, 0.7), 0 0 12px rgba(255, 255, 255, 0.3)'
                                  }}><span
                                    contentEditable={true}
                                    suppressContentEditableWarning={true}
                                    className="outline-none px-1"
                                    onBlur={async (e) => {
                                      const newName = e.target.textContent?.trim();
                                      if (newName && newName.toUpperCase() !== subcategory.name.toUpperCase()) {
                                        try {
                                          const backendUrl = (window.ENV?.REACT_APP_BACKEND_URL || process.env.REACT_APP_BACKEND_URL || window.location.origin);
                                          await fetch(`${backendUrl}/api/subcategories/${subcategory.id}`, {
                                            method: 'PUT',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify({ name: newName.toUpperCase() })
                                          });
                                          if (onReload) onReload();
                                        } catch (err) { console.error('Failed to update subcategory name:', err); }
                                      }
                                    }}
                                  >{subcategory.name.toUpperCase()}</span></th>
                                      <th className="border border-[#B49B7E] px-2 py-2 text-xs font-bold text-white shadow-inner shadow-[#B49B7E]/20" style={{ 
                                    background: 'linear-gradient(135deg, #8B4444FF 0%, #8B4444AA 20%, #8B4444 40%, #8B4444AA 80%, #8B4444FF 100%)',
                                    boxShadow: '0 0 20px #8B444450, inset 0 0 40px rgba(255, 255, 255, 0.12), inset 0 0 70px rgba(0, 0, 0, 0.4)',
                                    textShadow: '0 2px 4px rgba(0, 0, 0, 0.7), 0 0 12px rgba(255, 255, 255, 0.3)'
                                  }}>QTY</th>
                                      <th className="border border-[#B49B7E] px-2 py-2 text-xs font-bold text-white shadow-inner shadow-[#B49B7E]/20" style={{ 
                                    background: 'linear-gradient(135deg, #8B4444FF 0%, #8B4444AA 20%, #8B4444 40%, #8B4444AA 80%, #8B4444FF 100%)',
                                    boxShadow: '0 0 20px #8B444450, inset 0 0 40px rgba(255, 255, 255, 0.12), inset 0 0 70px rgba(0, 0, 0, 0.4)',
                                    textShadow: '0 2px 4px rgba(0, 0, 0, 0.7), 0 0 12px rgba(255, 255, 255, 0.3)'
                                  }}>SIZE</th>
                                      <th className="border border-[#B49B7E] px-2 py-2 text-xs font-bold text-white shadow-inner shadow-[#B49B7E]/20" style={{ 
                                    background: 'linear-gradient(135deg, #8B4444FF 0%, #8B4444AA 20%, #8B4444 40%, #8B4444AA 80%, #8B4444FF 100%)',
                                    boxShadow: '0 0 20px #8B444450, inset 0 0 40px rgba(255, 255, 255, 0.12), inset 0 0 70px rgba(0, 0, 0, 0.4)',
                                    textShadow: '0 2px 4px rgba(0, 0, 0, 0.7), 0 0 12px rgba(255, 255, 255, 0.3)'
                                  }}>FINISH/COLOR</th>
                                      <th className="border border-[#B49B7E] px-1 py-2 text-xs font-bold text-white shadow-inner shadow-[#B49B7E]/20" style={{ 
                                    background: 'linear-gradient(135deg, #8B4444FF 0%, #8B4444AA 20%, #8B4444 40%, #8B4444AA 80%, #8B4444FF 100%)',
                                    boxShadow: '0 0 20px #8B444450, inset 0 0 40px rgba(255, 255, 255, 0.12), inset 0 0 70px rgba(0, 0, 0, 0.4)',
                                    textShadow: '0 2px 4px rgba(0, 0, 0, 0.7), 0 0 12px rgba(255, 255, 255, 0.3)',
                                    width: '80px'
                                  }}>DELETE</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {/* ITEMS FOR THIS SUBCATEGORY - SHOW ALL ITEMS */}
                                    {(subcategory.items || [])
                                      .map((item, itemIndex) => (
                                    <tr key={item.id} className={itemIndex % 2 === 0 ? 'bg-gradient-to-r from-black/80 to-gray-900/80' : 'bg-gradient-to-r from-gray-900/60 to-black/60'}>
                                      <td className="border border-[#B49B7E]/20 px-1 py-1 text-center w-6">
                                        <input 
                                          type="checkbox" 
                                          className="w-6 h-6 cursor-pointer" 
                                          checked={checkedItems.has(item.id)}
                                          onChange={async (e) => {
                                            const newStatus = e.target.checked ? 'PICKED' : '';
                                            const newCheckedItems = new Set(checkedItems);
                                            
                                            if (e.target.checked) {
                                              newCheckedItems.add(item.id);
                                            } else {
                                              newCheckedItems.delete(item.id);
                                            }
                                            setCheckedItems(newCheckedItems);
                                            
                                            // SAVE TO BACKEND
                                            try {
                                              const BACKEND_URL = (window.ENV?.REACT_APP_BACKEND_URL || window.location.origin);
                                              await fetch(`${BACKEND_URL}/api/items/${item.id}`, {
                                                method: 'PUT',
                                                headers: { 'Content-Type': 'application/json' },
                                                body: JSON.stringify({ status: newStatus })
                                              });
                                              console.log('✅ Desktop checkbox saved to backend!', item.name, newStatus);
                                            } catch (err) {
                                              console.error('❌ Failed to save checkbox:', err);
                                            }
                                          }}
                                        />
                                      </td>
                                      <td className="border border-[#B49B7E]/20 px-2 py-1 text-sm" style={{ color: '#F5F5DC' }}>
                                        <div 
                                          contentEditable
                                          suppressContentEditableWarning={true}
                                          className="w-full bg-transparent text-sm outline-none"
                                          style={{ color: '#F5F5DC' }}
                                          onBlur={(e) => {
                                            const newValue = e.target.textContent?.trim();
                                            if (newValue !== item.name) {
                                              handleUpdateItemField(item.id, 'name', newValue);
                                            }
                                          }}
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
                                          onBlur={(e) => {
                                            const newValue = e.target.textContent?.trim();
                                            if (newValue !== (item.quantity || '')) {
                                              handleUpdateItemField(item.id, 'quantity', newValue);
                                            }
                                          }}
                                        >
                                          {item.quantity || ''}
                                        </div>
                                      </td>
                                      <td className="border border-[#B49B7E]/20 px-2 py-1 text-sm" style={{ color: '#F5F5DC' }}>
                                        <div 
                                          contentEditable
                                          suppressContentEditableWarning={true}
                                          className="w-full bg-transparent text-sm outline-none"
                                          style={{ color: '#F5F5DC' }}
                                          onBlur={(e) => {
                                            const newValue = e.target.textContent?.trim();
                                            if (newValue !== (item.size || '')) {
                                              handleUpdateItemField(item.id, 'size', newValue);
                                            }
                                          }}
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
                                          onBlur={(e) => {
                                            const newValue = e.target.textContent?.trim();
                                            if (newValue !== item.finish_color) {
                                              handleUpdateItemField(item.id, 'finish_color', newValue);
                                            }
                                          }}
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

              {/* ROOM NOTES SECTION */}
              {isRoomExpanded && (
                <div className="mx-1 mb-4 p-3 border border-[#B49B7E]/30 rounded-lg" style={{ background: 'rgba(0,0,0,0.4)' }}>
                  <label className="block text-xs font-bold text-[#D4A574] mb-1 uppercase tracking-wider">Room Notes</label>
                  <textarea
                    data-testid={`room-notes-${room.id}`}
                    className="w-full bg-black/60 border border-[#B49B7E]/20 rounded p-2 text-sm text-[#F5F5DC] placeholder-[#B49B7E]/40 focus:border-[#D4A574] focus:outline-none resize-y"
                    rows={3}
                    placeholder="Add notes for this room..."
                    defaultValue={room.notes || ''}
                    onBlur={async (e) => {
                      const newNotes = e.target.value;
                      if (newNotes !== (room.notes || '')) {
                        try {
                          const backendUrl = (window.ENV?.REACT_APP_BACKEND_URL || process.env.REACT_APP_BACKEND_URL || window.location.origin);
                          await fetch(`${backendUrl}/api/rooms/${room.id}`, {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ notes: newNotes })
                          });
                        } catch (err) {
                          console.error('Failed to save notes:', err);
                        }
                      }
                    }}
                  />
                </div>
              )}
                </div>
              )}
            </Draggable>
                  </React.Fragment>
                );
              })}

              {/* ADD FLOOR BUTTON */}
              <div className="mt-4 mb-2 flex justify-center">
                <button
                  data-testid="add-floor-btn"
                  onClick={() => {
                    const input = document.getElementById('new-floor-input');
                    if (input) {
                      input.style.display = input.style.display === 'none' ? 'flex' : 'none';
                      if (input.style.display === 'flex') input.querySelector('input')?.focus();
                    }
                  }}
                  className="px-6 py-2 text-[#D4A574] border border-[#D4A574]/30 rounded-lg hover:bg-[#D4A574]/10 text-sm font-bold tracking-wider"
                >
                  + ADD FLOOR / SECTION
                </button>
                <button
                  data-testid="migrate-legacy-floors-btn"
                  onClick={async () => {
                    if (!window.confirm('This will detect rooms that look like floor headers (e.g., "1ST FLOOR", "BASEMENT") with no items, convert them to actual floor separators, and remove the dummy rooms. Continue?')) return;
                    try {
                      const backendUrl = (window.ENV?.REACT_APP_BACKEND_URL || process.env.REACT_APP_BACKEND_URL || window.location.origin);
                      const res = await fetch(`${backendUrl}/api/projects/${project.id}/migrate-legacy-floors`, { method: 'POST' });
                      const data = await res.json();
                      alert(data.message || `Migrated ${data.migrated} floor headers`);
                      if (data.migrated > 0 && onReload) await onReload();
                    } catch (err) { alert('Migration failed: ' + err.message); }
                  }}
                  className="px-4 py-2 text-yellow-400/70 border border-yellow-600/30 rounded-lg hover:bg-yellow-600/10 text-xs font-bold tracking-wider"
                >
                  FIX LEGACY FLOORS
                </button>
              </div>
              <div id="new-floor-input" className="mb-4 flex justify-center gap-2" style={{ display: 'none' }}>
                <input
                  type="text"
                  placeholder="Enter floor or section name (e.g., BASEMENT, POOL HOUSE)..."
                  className="px-4 py-2 bg-black/60 border border-[#D4A574]/40 rounded-lg text-[#F5F5DC] placeholder-[#B49B7E]/40 text-sm w-80 focus:border-[#D4A574] focus:outline-none"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && e.target.value.trim()) {
                      addFloor(e.target.value.trim().toUpperCase());
                      e.target.value = '';
                      document.getElementById('new-floor-input').style.display = 'none';
                    }
                  }}
                />
                <button
                  onClick={(e) => {
                    const input = e.target.previousElementSibling || e.target.parentElement.querySelector('input');
                    if (input?.value?.trim()) {
                      addFloor(input.value.trim().toUpperCase());
                      input.value = '';
                      document.getElementById('new-floor-input').style.display = 'none';
                    }
                  }}
                  className="px-4 py-2 bg-[#D4A574] text-black rounded-lg font-bold text-sm hover:bg-[#C4955A]"
                >ADD</button>
              </div>
              </>
            );
          })()}
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
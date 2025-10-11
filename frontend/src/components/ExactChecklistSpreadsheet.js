import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import AddItemModal from './AddItemModal';
import CanvaIntegrationModal from './CanvaIntegrationModal';

const ExactChecklistSpreadsheet = ({ 
  project, 
  roomColors, 
  categoryColors, 
  itemStatuses = [],
  vendorTypes = [],
  carrierTypes = [],
  onDeleteRoom, 
  onAddRoom,
  onReload,
  onRoomCanvaImport
}) => {
  console.log('🎯 SimpleChecklistSpreadsheet rendering with project:', project);

  const [showAddItem, setShowAddItem] = useState(false);
  const [selectedSubCategoryId, setSelectedSubCategoryId] = useState(null);
  
  // State to track checked items (for PICKED status)
  const [checkedItems, setCheckedItems] = useState(new Set());
  const [availableCategories, setAvailableCategories] = useState([]);
  
  // Load expanded states from localStorage
  const [expandedRooms, setExpandedRooms] = useState(() => {
    const saved = localStorage.getItem('checklist_expandedRooms');
    return saved ? JSON.parse(saved) : {};
  });
  const [expandedCategories, setExpandedCategories] = useState(() => {
    const saved = localStorage.getItem('checklist_expandedCategories');
    return saved ? JSON.parse(saved) : {};
  });
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRoom, setSelectedRoom] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedVendor, setSelectedVendor] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [filteredProject, setFilteredProject] = useState(project);
  const [showCanvaModal, setShowCanvaModal] = useState(false);

  // DRAG AND DROP HANDLER for rooms, categories, and subcategories
  const handleDragEnd = async (result) => {
    console.log('🎯 CHECKLIST DRAG END CALLED!', result);
    const { source, destination, type } = result;

    // Dropped outside the list
    if (!destination) {
      console.log('❌ No destination');
      return;
    }

    // No movement
    if (source.droppableId === destination.droppableId && source.index === destination.index) {
      console.log('❌ Same position');
      return;
    }

    try {
      console.log('🔄 Processing drag for type:', type);
      if (type === 'ROOM') {
        // Reorder rooms locally
        const newRooms = Array.from(project.rooms);
        const [removed] = newRooms.splice(source.index, 1);
        newRooms.splice(destination.index, 0, removed);

        // Update visual order immediately
        project.rooms = newRooms;
        setFilteredProject({...project});

        // Update backend silently
        Promise.all(newRooms.map((room, i) => 
          fetch(`${process.env.REACT_APP_BACKEND_URL || window.location.origin}/api/rooms/${room.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ order_index: i })
          })
        ));

        console.log('✅ Rooms reordered and displayed!');
      } else if (type === 'CATEGORY') {
        // Reorder categories within a room
        const roomId = source.droppableId.replace('categories-', '');
        const room = project.rooms.find(r => r.id === roomId);
        if (!room) return;

        const newCategories = Array.from(room.categories);
        const [removed] = newCategories.splice(source.index, 1);
        newCategories.splice(destination.index, 0, removed);

        // Update visual order immediately
        room.categories = newCategories;
        setFilteredProject({...project});

        // Update backend silently
        Promise.all(newCategories.map((category, i) => 
          fetch(`${process.env.REACT_APP_BACKEND_URL || window.location.origin}/api/categories/${category.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ order_index: i })
          })
        ));

        console.log('✅ Categories reordered and displayed!');
      } else if (type === 'SUBCATEGORY') {
        // Reorder subcategories within a category
        const categoryId = source.droppableId.replace('subcategories-', '');
        let category = null;
        for (const room of project.rooms) {
          category = room.categories.find(c => c.id === categoryId);
          if (category) break;
        }
        if (!category) return;

        const newSubcategories = Array.from(category.subcategories);
        const [removed] = newSubcategories.splice(source.index, 1);
        newSubcategories.splice(destination.index, 0, removed);

        // Update order_index for all affected subcategories
        for (let i = 0; i < newSubcategories.length; i++) {
          await fetch(`${process.env.REACT_APP_BACKEND_URL || window.location.origin}/api/subcategories/${newSubcategories[i].id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ order_index: i })
          });
        }

        if (onReload) await onReload();
      }
    } catch (error) {
      console.error('Drag and drop error:', error);
      alert('Failed to reorder items');
    }
  };

  // APPLY FILTERS - ENHANCED COMBINATION FILTER LOGIC
  useEffect(() => {
    console.log('🔍 Enhanced Checklist Filter triggered:', { searchTerm, selectedRoom, selectedCategory, selectedVendor, selectedStatus });
    
    if (!project) {
      setFilteredProject(null);
      return;
    }

    let filtered = { ...project };

    if (searchTerm || selectedRoom || selectedCategory || selectedVendor || selectedStatus) {
      console.log('🔍 Applying COMBINATION checklist filters...');
      
      filtered.rooms = project.rooms.map(room => {
        // Room filter - if room is selected and this isn't it, hide all categories
        if (selectedRoom && room.id !== selectedRoom) {
          return { ...room, categories: [] };
        }
        
        const filteredCategories = room.categories.map(category => {
          // Category filter - if category is selected and this isn't it, hide all subcategories
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

  // Toggle room expansion
  const toggleRoomExpansion = (roomId) => {
    setExpandedRooms(prev => {
      const newState = {
        ...prev,
        [roomId]: !prev[roomId]
      };
      localStorage.setItem('checklist_expandedRooms', JSON.stringify(newState));
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
      localStorage.setItem('checklist_expandedCategories', JSON.stringify(newState));
      return newState;
    });
  };

  // Different muted room colors for checklist
  const getRoomColor = (roomName, index = 0) => {
    const mutedColors = [
      '#8B5A6B',  // Muted rose
      '#6B7C93',  // Muted blue
      '#7A8B5A',  // Muted olive
      '#9B6B8B',  // Muted purple
      '#8B7A5A',  // Muted brown
      '#5A8B7A',  // Muted teal
      '#8B5A7A',  // Muted mauve
      '#7A5A8B',  // Muted violet
      '#5A7A8B',  // Muted slate
      '#8B6B5A'   // Muted tan
    ];
    
    // Use room name hash for consistent color per room
    let hash = 0;
    for (let i = 0; i < roomName.length; i++) {
      hash = roomName.charCodeAt(i) + ((hash << 5) - hash);
    }
    return mutedColors[Math.abs(hash) % mutedColors.length];
  };

  const getCategoryColor = () => '#065F46';  // Dark green for categories

  // Status colors mapping for checklist - MATCHES STATUS BREAKDOWN COLORS
  const getStatusColor = (status) => {
    const statusColors = {
      '': '#6B7280',                        // Gray for blank/default (TO BE PICKED)
      'BLANK': '#6B7280',                   // Gray for blank
      'PICKED': '#3B82F6',                  // Blue for picked items
      'TO BE PICKED': '#6B7280',            // Gray - same as blank
      'ORDER SAMPLES': '#10B981',           // Green
      'SAMPLES ARRIVED': '#8B5CF6',         // Purple
      'ASK NEIL': '#F59E0B',                // Yellow/Amber
      'ASK CHARLENE': '#EF4444',            // Red
      'ASK JALA': '#EC4899',                // Pink
      'GET QUOTE': '#06B6D4',               // Cyan
      'WAITING ON QT': '#F97316',           // Orange
      'READY FOR PRESENTATION': '#84CC16'   // Lime Green
    };
    return statusColors[status] || '#6B7280'; // Default gray
  };

  // Handle status change with improved error handling
  const handleStatusChange = async (itemId, newStatus) => {
    console.log('🔄 Checklist status change request:', { itemId, newStatus });
    
    try {
      const backendUrl = process.env.REACT_APP_BACKEND_URL || window.location.origin;
      console.log('🌐 Using backend URL:', backendUrl);
      
      const response = await fetch(`${backendUrl}/api/items/${itemId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      
      console.log('📡 Response status:', response.status, response.statusText);
      
      if (response.ok) {
        console.log('✅ Checklist status updated successfully');
        // Use onReload instead of window.location.reload to prevent navigation issues
        if (onReload) {
          console.log('🔄 Calling onReload function');
          onReload();
        } else {
          console.warn('⚠️ No onReload function provided');
        }
      } else {
        const errorData = await response.text();
        console.error('❌ Checklist status update failed:', response.status, errorData);
        alert(`Failed to update status: ${response.status} ${errorData}`);
      }
    } catch (error) {
      console.error('❌ Checklist status update error:', error);
      alert(`Error updating status: ${error.message}`);
    }
  };

  // Handle scraping product information
  const handleScrapeProduct = async (productLink, itemId) => {
    if (!productLink?.trim()) {
      alert('Please enter a product URL first');
      return;
    }

    try {
      console.log('🔍 Scraping product from:', productLink);
      
      const backendUrl = process.env.REACT_APP_BACKEND_URL || window.location.origin;
      const response = await fetch(`${backendUrl}/api/scrape-product`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: productLink })
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Scraping successful:', result);

        // Update the item with scraped data
        const updateData = {
          ...result.data,
          link: productLink // Ensure link is preserved
        };

        // Remove fields we don't want to overwrite if they're empty
        if (!updateData.name) delete updateData.name;
        
        const updateResponse = await fetch(`${backendUrl}/api/items/${itemId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updateData)
        });

        if (updateResponse.ok) {
          console.log('✅ Item updated with scraped data');
          alert(`✅ Successfully scraped: ${result.data.name || 'Product information'}`);
          if (onReload) onReload();
        } else {
          console.error('❌ Failed to update item with scraped data');
          alert('❌ Failed to update item with scraped data');
        }
      } else {
        const errorData = await response.json();
        console.error('❌ Scraping failed:', errorData);
        alert(`❌ Scraping failed: ${errorData.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('❌ Scraping error:', error);
      alert(`❌ Error during scraping: ${error.message}`);
    }
  };

  // Handle adding new items - COPIED EXACTLY FROM WORKING FFE
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

      console.log('📤 Creating checklist item:', newItem);

      const response = await fetch(`${backendUrl}/api/items`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newItem)
      });

      if (response.ok) {
        console.log('✅ Checklist item added successfully');
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
      console.error('❌ Error adding checklist item:', error);
      console.error(`Failed to add item: ${error.message}`);
    }
  };

  // Handle deleting an item - NO PAGE RELOAD
  const handleDeleteItem = async (itemId) => {
    if (!window.confirm('Are you sure you want to delete this item?')) {
      return;
    }

    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL || window.location.origin}/api/items/${itemId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        console.log('✅ Checklist item deleted successfully');
        // Call onReload to refresh data WITHOUT RESETTING MINIMIZE STATE
        const currentExpandedState = expandedRooms;
        if (onReload) {
          await onReload();
          // Restore expanded state after reload
          setExpandedRooms(currentExpandedState);
        }
      } else {
        console.error('❌ Delete failed with status:', response.status);
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (error) {
      console.error('❌ Error deleting checklist item:', error);
      alert('Failed to delete item: ' + error.message);
    }
  };

  // Handle deleting a category - NO PAGE RELOAD
  const handleDeleteCategory = async (categoryId) => {
    if (!window.confirm('Are you sure you want to delete this entire category and all its items?')) {
      return;
    }

    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL || window.location.origin}/api/categories/${categoryId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        console.log('✅ Checklist category deleted successfully');
        // Call onReload to refresh data without full page reload
        if (onReload) {
          onReload();
        }
      } else {
        console.error('❌ Category delete failed with status:', response.status);
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (error) {
      console.error('❌ Error deleting checklist category:', error);
      alert('Failed to delete category: ' + error.message);
    }
  };

  // Handle deleting a subcategory and all its items
  const handleDeleteSubcategory = async (subcategoryId) => {
    try {
      const backendUrl = process.env.REACT_APP_BACKEND_URL || window.location.origin;
      
      // First delete all items in the subcategory
      const subcategoryItems = project.rooms.flatMap(room => 
        room.categories.flatMap(category => 
          category.subcategories.filter(sub => sub.id === subcategoryId)
            .flatMap(sub => sub.items || [])
        )
      );
      
      // Delete each item
      for (const item of subcategoryItems) {
        await fetch(`${backendUrl}/api/items/${item.id}`, {
          method: 'DELETE'
        });
      }
      
      // Then delete the subcategory
      const response = await fetch(`${backendUrl}/api/subcategories/${subcategoryId}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        console.log('✅ Subcategory deleted successfully');
        if (onReload) onReload();
      } else {
        throw new Error('Failed to delete subcategory');
      }
    } catch (error) {
      console.error('❌ Error deleting subcategory:', error);
      alert('Failed to delete subcategory: ' + error.message);
    }
  };

  // Handle adding a new category - FIXED TO USE COMPREHENSIVE ENDPOINT
  const handleAddCategory = async (roomId, categoryName) => {
    if (!roomId || !categoryName) {
      console.error('❌ Missing roomId or categoryName');
      return;
    }

    try {
      console.log('🔄 Creating comprehensive checklist category:', categoryName, 'for room:', roomId);
      
      // Use comprehensive endpoint directly
      const backendUrl = process.env.REACT_APP_BACKEND_URL || window.location.origin;
      const response = await fetch(`${backendUrl}/api/categories/comprehensive?room_id=${roomId}&category_name=${encodeURIComponent(categoryName)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.ok) {
        const newCategory = await response.json();
        console.log('✅ Category added successfully:', newCategory.name);
        
        // Reload data to show new category
        if (onReload) {
          onReload();
        }
      } else {
        console.error('❌ Category creation failed with status:', response.status);
        const errorData = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorData}`);
      }
    } catch (error) {
      console.error('❌ Error adding checklist category:', error);
      alert('Failed to add category: ' + error.message);
    }
  };  

  // Handle Canva items extracted
  const handleCanvaItemsExtracted = async (extractedItems) => {
    console.log('🎨 Processing Canva extracted items:', extractedItems);
    
    try {
      let addedCount = 0;
      
      for (const item of extractedItems) {
        // Find first available subcategory for each item
        let targetSubcategoryId = null;
        
        for (const room of project?.rooms || []) {
          for (const category of room.categories || []) {
            if (category.subcategories && category.subcategories.length > 0) {
              targetSubcategoryId = category.subcategories[0].id;
              break;
            }
          }
          if (targetSubcategoryId) break;
        }
        
        if (targetSubcategoryId) {
          const itemData = {
            name: item.name || 'Canva Import Item',
            vendor: item.vendor || '',
            sku: item.sku || '',
            cost: item.cost || '',
            size: '',
            finish_color: item.finish_color || '',
            quantity: 1,
            status: 'PICKED',
            link: item.link || '',
            image_url: item.image_url || '',
            subcategory_id: targetSubcategoryId,
            order_index: 0
          };
          
          const response = await fetch(`${process.env.REACT_APP_BACKEND_URL || window.location.origin}/api/items`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(itemData)
          });
          
          if (response.ok) {
            addedCount++;
          }
        }
      }
      
      alert(`✅ Successfully imported ${addedCount} items from Canva!`);
      
      if (onReload) {
        onReload();
      }
      
      setShowCanvaModal(false);
      
    } catch (error) {
      console.error('❌ Error importing Canva items:', error);
      alert('❌ Failed to import some items from Canva: ' + error.message);
    }
  };

  // Handle upload to Canva - NOW OPENS IMPORT MODAL
  const handleUploadToCanva = () => {
    console.log('🎨 Opening Canva import modal');
    setShowCanvaModal(true);
  };

  const handleCanvaPdfUpload = async (file, roomName) => {
    if (!file) {
      console.log('⚠️ No file provided');
      return;
    }

    try {
      console.log('🎨 Uploading Canva PDF for room:', roomName, 'File:', file.name);
      
      const formData = new FormData();
      formData.append('file', file);
      formData.append('room_name', roomName);
      formData.append('project_id', project.id);
      
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL || window.location.origin}/api/upload-canva-pdf`, {
        method: 'POST',
        body: formData
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log('✅ Canva PDF uploaded successfully:', result);
        alert(`Success! Processed ${result.items_created || 0} items from Canva PDF`);
        if (onReload) {
          onReload();
        }
      } else {
        console.error('❌ Canva PDF upload failed:', response.status);
        alert('Failed to upload Canva PDF. Please try again.');
      }
    } catch (error) {
      console.error('❌ Canva PDF upload error:', error);
      alert('Error uploading Canva PDF: ' + error.message);
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
      
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL || window.location.origin}/api/scrape-canva-pdf`, {
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
        if (onReload) {
          onReload();
        }
      } else {
        console.error('❌ Canva PDF scraping failed:', response.status);
        alert('Failed to scrape Canva PDF. Please check the URL.');
      }
    } catch (error) {
      console.error('❌ Canva PDF scraping error:', error);
      alert('Error scraping Canva PDF: ' + error.message);
    }
  };

  // CHECKLIST → FFE TRANSFER: Transfer ALL written items (using proven logic)
  const handleTransferToFFE = async () => {
    try {
      console.log('🚀 TRANSFER TO FFE: ALL WRITTEN ITEMS (using proven walkthrough logic)');
      
      // Step 1: Collect ALL items that have real content (not just "New Item")
      const allItemsToTransfer = [];
      
      if (filteredProject?.rooms) {
        filteredProject.rooms.forEach(room => {
          room.categories?.forEach(category => {
            category.subcategories?.forEach(subcategory => {
              subcategory.items?.forEach(item => {
                // Transfer ALL items with real names (not empty or "New Item")
                if (item.name && item.name.trim() !== '' && item.name !== 'New Item') {
                  allItemsToTransfer.push({
                    item,
                    roomId: room.id,
                    roomName: room.name,
                    categoryId: category.id,
                    categoryName: category.name,
                    subcategoryId: subcategory.id,
                    subcategoryName: subcategory.name
                  });
                }
              });
            });
          });
        });
      }
      
      console.log(`📝 EXACT COUNT: ${allItemsToTransfer.length} ALL written items to transfer to FFE`);
      console.log('📋 All items:', allItemsToTransfer.map(ci => ci.item.name));

      if (allItemsToTransfer.length === 0) {
        alert('No written items found for transfer to FFE.');
        return;
      }

      // Step 2: Transfer ALL written items to FFE (create minimal structure as needed)
      const backendUrl = process.env.REACT_APP_BACKEND_URL || window.location.origin;
      const projectId = filteredProject.id;
      
      let successCount = 0;
      const createdStructures = new Map(); // Track what we've already created
      
      console.log(`🏢 Creating FFE structure for ALL ${allItemsToTransfer.length} written items`);

      // Process each written item individually
      for (const itemContext of allItemsToTransfer) {
        try {
          const roomKey = `${itemContext.roomName}_ffe`;
          const categoryKey = `${roomKey}_${itemContext.categoryName}`;
          const subcategoryKey = `${categoryKey}_${itemContext.subcategoryName}`;
          
          // Create room if not exists
          let roomId = createdStructures.get(roomKey);
          if (!roomId) {
            const newRoomData = {
              name: itemContext.roomName,
              project_id: projectId,
              sheet_type: 'ffe',
              description: `Transferred from checklist - ${itemContext.roomName}`,
              auto_populate: false  // CRITICAL: Create empty FFE room for transfer
            };
            
            console.log(`🏠 Creating FFE room: ${itemContext.roomName}`);
            
            const roomResponse = await fetch(`${backendUrl}/api/rooms`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(newRoomData)
            });
            
            if (roomResponse.ok) {
              const newRoom = await roomResponse.json();
              roomId = newRoom.id;
              createdStructures.set(roomKey, roomId);
              console.log(`✅ Created FFE room: ${newRoom.name}`);
            } else {
              console.error(`❌ Failed to create FFE room: ${itemContext.roomName}`);
              continue;
            }
          }
          
          // Create category if not exists
          let categoryId = createdStructures.get(categoryKey);
          if (!categoryId) {
            const newCategoryData = {
              name: itemContext.categoryName,
              room_id: roomId,
              description: `${itemContext.categoryName} category for FFE`,
              color: '#4A90E2',
              order_index: 0
            };
            
            console.log(`📋 Creating FFE category: ${itemContext.categoryName}`);
            
            const categoryResponse = await fetch(`${backendUrl}/api/categories`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(newCategoryData)
            });
            
            if (categoryResponse.ok) {
              const newCategory = await categoryResponse.json();
              categoryId = newCategory.id;
              createdStructures.set(categoryKey, categoryId);
              console.log(`✅ Created FFE category: ${newCategory.name}`);
            } else {
              console.error(`❌ Failed to create FFE category: ${itemContext.categoryName}`);
              continue;
            }
          }
          
          // Create subcategory if not exists
          let subcategoryId = createdStructures.get(subcategoryKey);
          if (!subcategoryId) {
            const newSubcategoryData = {
              name: itemContext.subcategoryName,
              category_id: categoryId,
              description: `${itemContext.subcategoryName} subcategory for FFE`,
              color: '#6BA3E6',
              order_index: 0
            };
            
            console.log(`📝 Creating FFE subcategory: ${itemContext.subcategoryName}`);
            
            const subcategoryResponse = await fetch(`${backendUrl}/api/subcategories`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(newSubcategoryData)
            });
            
            if (subcategoryResponse.ok) {
              const newSubcategory = await subcategoryResponse.json();
              subcategoryId = newSubcategory.id;
              createdStructures.set(subcategoryKey, subcategoryId);
              console.log(`✅ Created FFE subcategory: ${newSubcategory.name}`);
            } else {
              console.error(`❌ Failed to create FFE subcategory: ${itemContext.subcategoryName}`);
              continue;
            }
          }
          
          // Create the FFE item
          const newItemData = {
            name: itemContext.item.name,
            vendor: itemContext.item.vendor || '',
            sku: itemContext.item.sku || '',
            cost: itemContext.item.cost || 0,
            size: itemContext.item.size || '',
            finish_color: itemContext.item.finish_color || '',
            quantity: itemContext.item.quantity || 1,
            subcategory_id: subcategoryId,
            status: '', // Set to BLANK for FFE (not APPROVED)
            order_index: itemContext.item.order_index || 0,
            link: itemContext.item.link || '',
            image_url: itemContext.item.image_url || ''
          };
          
          console.log(`📦 Creating FFE item: ${itemContext.item.name}`);
          
          const itemResponse = await fetch(`${backendUrl}/api/items`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newItemData)
          });
          
          if (itemResponse.ok) {
            successCount++;
            console.log(`✅ Created FFE item: ${itemContext.item.name}`);
          } else {
            console.error(`❌ Failed to create FFE item: ${itemContext.item.name}`);
          }
          
        } catch (itemError) {
          console.error(`❌ Error processing item ${itemContext.item.name} for FFE:`, itemError);
        }
      }

      if (successCount > 0) {
        alert(`✅ Successfully transferred ${successCount} ALL written items to FFE!`);
        
        if (onReload) {
          onReload();
        }
      } else {
        alert('❌ Failed to transfer items to FFE. Please check the console for errors.');
      }

    } catch (error) {
      console.error('❌ Error in FFE transfer process:', error);
      alert('❌ Failed to transfer to FFE: ' + error.message);
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
      <div className="w-full p-4" style={{ backgroundColor: '#0F172A' }}>
        <div className="text-center text-yellow-400 py-8 bg-yellow-900 m-4 p-4 rounded">
          <p className="text-lg">📋 No Rooms Available</p>
          <p className="text-sm mt-2">This project has {project.rooms?.length || 0} rooms</p>
          <div className="mt-4">
            <button 
              onClick={onAddRoom}
              className="px-6 py-3 bg-amber-600 hover:bg-amber-700 text-[#B49B7E] rounded font-medium"
            >
              + ADD FIRST ROOM
            </button>
          </div>
        </div>
      </div>
    );
  }

  console.log('✅ SimpleChecklistSpreadsheet: Rendering with', project.rooms.length, 'rooms');

  return (
    <div className="w-full" style={{ backgroundColor: '#0F172A' }}>
      
      {/* ENHANCED FILTER SECTION - MATCHING FFE FUNCTIONALITY */}
      <div className="mb-6 p-4" style={{ backgroundColor: '#1E293B' }}>
        <div className="flex flex-col lg:flex-row gap-4 items-center">
          {/* Search Input */}
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search Items, Vendors, SKUs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 rounded bg-gray-900/50 text-[#D4A574] border border-[#D4A574]/50 focus:border-[#D4A574] focus:outline-none placeholder-[#D4A574]/70"
            />
          </div>
          
          {/* Filter Dropdowns */}
          <div className="flex gap-3 flex-wrap">
            <select 
              value={selectedRoom}
              onChange={(e) => setSelectedRoom(e.target.value)}
              className="px-3 py-2 rounded bg-gray-900/50 text-[#D4A574] border border-[#D4A574]/50 focus:border-[#D4A574] focus:outline-none"
            >
              <option value="">All Rooms</option>
              {(project?.rooms || []).map(room => (
                <option key={room.id} value={room.id}>{room.name}</option>
              ))}
            </select>
            
            <select 
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 rounded bg-gray-900/50 text-[#D4A574] border border-[#D4A574]/50 focus:border-[#D4A574] focus:outline-none"
            >
              <option value="">All Categories</option>
              <option value="Lighting">Lighting</option>
              <option value="Furniture">Furniture & Storage</option>
              <option value="Decor">Decor & Accessories</option>
              <option value="Paint">Paint, Wallpaper & Finishes</option>
              <option value="Architectural">Architectural Elements</option>
            </select>
            
            <select 
              value={selectedVendor}
              onChange={(e) => setSelectedVendor(e.target.value)}
              className="px-3 py-2 rounded bg-gray-900/50 text-[#D4A574] border border-[#D4A574]/50 focus:border-[#D4A574] focus:outline-none"
            >
              <option value="">All Vendors</option>
              {(vendorTypes || []).map(vendor => (
                <option key={vendor} value={vendor}>{vendor}</option>
              ))}
            </select>
            
            <select 
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-2 rounded bg-gray-900/50 text-[#D4A574] border border-[#D4A574]/50 focus:border-[#D4A574] focus:outline-none"
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
              <option value="GET QUOTE">GET QUOTE</option>
              <option value="WAITING ON QT">WAITING ON QT</option>
              <option value="READY FOR PRESENTATION">READY FOR PRESENTATION</option>
            </select>
          </div>
          
          {/* Action Buttons - ADD ROOM, CANVA LIVE CHECKLIST, SCANNER, AND TRANSFER */}
          <div className="flex gap-3 flex-wrap">
            <button 
              onClick={onAddRoom}
              className="bg-gradient-to-r from-[#B49B7E] to-[#A08B6F] hover:from-[#A08B6F] hover:to-[#8B7355] px-6 py-2 rounded-full shadow-xl hover:shadow-[#B49B7E]/30 transition-all duration-300 transform hover:scale-105 tracking-wide font-medium border border-[#D4C5A9]/20 text-[#B49B7E]"
            >
              ✥ ADD ROOM
            </button>
            <button
              onClick={() => {
                // Open the Canva editor with your app
                const canvaEditorUrl = `https://www.canva.com/design?addExtension=AAG0-jYpGz4`;
                window.open(canvaEditorUrl, '_blank');
                
                // Show instructions
                alert('Opening Canva editor...\n\n1. Open your app from the Apps panel (left sidebar)\n2. Your project will automatically load\n\nProject ID: ' + project?.id + '\n\nThe app will auto-connect to this project!');
                
                // Store project ID in localStorage for the Canva app to access
                localStorage.setItem('canva_project_id', project?.id);
              }}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 px-6 py-2 rounded-full shadow-xl hover:shadow-blue-500/30 transition-all duration-300 transform hover:scale-105 tracking-wide font-medium border border-blue-400/20 text-white flex items-center gap-2"
              title="Open Live Checklist in Canva - Real-time sync!"
            >
              <span>🎨</span>
              <span>CANVA LIVE CHECKLIST</span>
              <span style={{ fontSize: '10px', opacity: 0.8 }}>✓ LIVE SYNC</span>
            </button>
            <button 
              onClick={() => {
                window.open('/canva-scanner-guide.html', '_blank');
              }}
              className="bg-gradient-to-r from-[#D4A574] to-[#B49B7E] hover:from-[#E8D4B8] hover:to-[#D4A574] px-6 py-2 rounded-full shadow-xl hover:shadow-[#D4A574]/50 transition-all duration-300 transform hover:scale-105 tracking-wide font-medium border border-[#D4A574]/30 text-black flex items-center gap-2"
              title="Download Chrome Extension to scan Canva boards"
            >
              <span>🔍</span>
              <span>GET CANVA SCANNER</span>
            </button>
            <button 
              onClick={handleTransferToFFE}
              className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-500 hover:to-green-600 px-6 py-2 rounded-full shadow-xl hover:shadow-green-500/30 transition-all duration-300 transform hover:scale-105 tracking-wide font-medium border border-green-500/20 text-[#B49B7E]"
            >
              → TRANSFER TO FF&E
            </button>
          </div>
        </div>
      </div>

      {/* ENHANCED CHECKLIST TABLE WITH MINIMIZE/EXPAND AND FILTERING - EXACT SAME TREATMENT AS GRAPHS */}
      <div className="rounded-2xl shadow-xl backdrop-blur-sm p-6 border border-[#B49B7E]/20 mb-6" 
           style={{
             background: 'linear-gradient(135deg, rgba(0,0,0,0.95) 0%, rgba(30,30,30,0.9) 30%, rgba(0,0,0,0.95) 100%)'
           }}>
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="rooms" type="ROOM">
            {(provided) => (
              <div className="w-full" ref={provided.innerRef} {...provided.droppableProps}>
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
              {/* ROOM HEADER WITH DIFFERENT MUTED COLORS AND EXPAND/COLLAPSE */}
              <div 
                className="px-4 py-2 text-[#D4C5A9] font-bold mb-4"
                style={{ backgroundColor: getRoomColor(room.name, roomIndex) }}
              >
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className="cursor-move text-[#B49B7E] hover:text-gray-200 px-2">
                      ⋮⋮
                    </div>
                    <button
                      onClick={() => toggleRoomExpansion(room.id)}
                      className="text-[#B49B7E] hover:text-gray-200"
                    >
                      {isRoomExpanded ? '▼' : '▶'}
                    </button>
                    <span>{room.name.toUpperCase()}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {/* CONNECT TO CANVA BUTTON */}
                    <button
                      onClick={() => {
                        const projectId = project.id;
                        const roomId = room.id;
                        
                        // Show modal with connection info
                        const modal = document.createElement('div');
                        modal.style.cssText = `
                          position: fixed;
                          top: 0;
                          left: 0;
                          width: 100%;
                          height: 100%;
                          background: rgba(0,0,0,0.9);
                          display: flex;
                          align-items: center;
                          justify-content: center;
                          z-index: 9999;
                        `;
                        
                        modal.innerHTML = `
                          <div style="background: linear-gradient(135deg, #000 0%, #1e293b 50%, #000 100%); padding: 40px; border-radius: 16px; max-width: 600px; border: 3px solid #D4A574;">
                            <h2 style="color: #D4A574; font-size: 24px; margin-bottom: 20px; text-align: center;">🎨 Connect "${room.name}" to Canva</h2>
                            
                            <div style="background: rgba(30, 41, 59, 0.8); padding: 20px; border-radius: 12px; margin-bottom: 20px; border: 2px solid #B49B7E;">
                              <p style="color: #B49B7E; margin-bottom: 10px; font-size: 14px;"><strong>Step 1: Copy Project ID</strong></p>
                              <input type="text" readonly value="${projectId}" style="width: 100%; padding: 12px; background: #0f172a; border: 2px solid #D4A574; border-radius: 8px; color: #D4A574; font-family: monospace; font-size: 13px; margin-bottom: 10px;" onclick="this.select();">
                              
                              <p style="color: #B49B7E; margin-bottom: 10px; font-size: 14px; margin-top: 16px;"><strong>Step 2: Then select "${room.name}" from list</strong></p>
                            </div>
                            
                            <div style="background: rgba(139, 68, 68, 0.3); padding: 16px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #D4A574;">
                              <p style="color: #D4C5A9; font-size: 13px; line-height: 1.6;">
                                <strong>📋 Instructions:</strong><br>
                                1. Open Canva.com → Open any design<br>
                                2. Open "Live Checklist" app from sidebar<br>
                                3. Paste the Project ID<br>
                                4. Click "Load Checklist"<br>
                                5. Select "${room.name}" from the room list<br>
                                6. Done! It will remember your choice!
                              </p>
                            </div>
                            
                            <button onclick="
                              navigator.clipboard.writeText('${projectId}');
                              alert('✅ Project ID copied! Now open Canva and paste it.');
                            " style="width: 100%; padding: 14px; background: #D4A574; color: #1E293B; border: none; border-radius: 8px; font-weight: bold; cursor: pointer; margin-bottom: 10px; font-size: 14px;">
                              📋 COPY PROJECT ID
                            </button>
                            
                            <button onclick="this.parentElement.parentElement.remove()" style="width: 100%; padding: 14px; background: rgba(30, 41, 59, 0.8); color: #B49B7E; border: 2px solid #B49B7E; border-radius: 8px; font-weight: bold; cursor: pointer; font-size: 14px;">
                              ✖ CLOSE
                            </button>
                          </div>
                        `;
                        
                        document.body.appendChild(modal);
                      }}
                      className="bg-green-600 text-white text-xs px-3 py-1 rounded hover:bg-green-700 transition-colors font-bold"
                      title={`Connect ${room.name} to Canva`}
                    >
                      🔗 CONNECT TO CANVA
                    </button>
                    
                    {/* IMPORT FROM PDF */}
                    <button
                      onClick={async () => {
                        const input = document.createElement('input');
                        input.type = 'file';
                        input.accept = '.pdf';
                        input.onchange = async (e) => {
                          const file = e.target.files[0];
                          if (!file) return;
                          
                          if (!confirm(`Import products from "${file.name}" to "${room.name}"?\n\nThis will:\n• Extract all product links from PDF\n• Scrape product details\n• Add to ${room.name}\n\nMake sure the PDF is exported from Canva with links!`)) {
                            return;
                          }
                          
                          try {
                            const formData = new FormData();
                            formData.append('file', file);
                            
                            const response = await fetch(`${process.env.REACT_APP_BACKEND_URL || window.location.origin}/api/import/pdf-links?project_id=${project.id}&room_id=${room.id}`, {
                              method: 'POST',
                              body: formData
                            });
                            
                            if (response.ok) {
                              const result = await response.json();
                              alert(`✅ PDF import started!\n\nJob ID: ${result.job_id}\n\nProcessing links in background...`);
                              
                              // Show progress modal
                              const modal = document.createElement('div');
                              modal.style.cssText = `
                                position: fixed;
                                top: 0;
                                left: 0;
                                width: 100%;
                                height: 100%;
                                background: rgba(0,0,0,0.9);
                                display: flex;
                                align-items: center;
                                justify-content: center;
                                z-index: 9999;
                              `;
                              
                              modal.innerHTML = `
                                <div style="background: linear-gradient(135deg, #000 0%, #1e293b 50%, #000 100%); padding: 40px; border-radius: 16px; max-width: 500px; border: 3px solid #D4A574;">
                                  <h2 style="color: #D4A574; font-size: 24px; margin-bottom: 20px; text-align: center;">📄 Importing from PDF</h2>
                                  
                                  <div id="pdf-progress-${result.job_id}" style="background: rgba(30, 41, 59, 0.8); padding: 20px; border-radius: 12px; margin-bottom: 20px; border: 2px solid #B49B7E;">
                                    <p style="color: #B49B7E; margin-bottom: 10px; text-align: center;">⏳ Extracting links...</p>
                                    <div style="background: rgba(0,0,0,0.5); border-radius: 8px; overflow: hidden; height: 30px;">
                                      <div id="pdf-bar-${result.job_id}" style="background: linear-gradient(90deg, #D4A574, #B49B7E); height: 100%; width: 0%; transition: width 0.5s; display: flex; align-items: center; justify-content: center; color: #000; font-weight: bold; font-size: 12px;"></div>
                                    </div>
                                    <p id="pdf-status-${result.job_id}" style="color: #D4A574; margin-top: 10px; text-align: center; font-size: 14px;">Starting...</p>
                                  </div>
                                  
                                  <button onclick="this.parentElement.parentElement.remove()" style="width: 100%; padding: 14px; background: rgba(30, 41, 59, 0.8); color: #B49B7E; border: 2px solid #B49B7E; border-radius: 8px; font-weight: bold; cursor: pointer; font-size: 14px;">
                                    ✖ CLOSE (Import continues)
                                  </button>
                                </div>
                              `;
                              
                              document.body.appendChild(modal);
                              
                              // Poll for progress
                              const pollProgress = setInterval(async () => {
                                try {
                                  const progressRes = await fetch(`${process.env.REACT_APP_BACKEND_URL || window.location.origin}/api/import/pdf-job/${result.job_id}`);
                                  if (progressRes.ok) {
                                    const job = await progressRes.json();
                                    const progress = job.total_links > 0 ? (job.imported_items / job.total_links * 100).toFixed(0) : 0;
                                    
                                    const progressBar = document.getElementById(`pdf-bar-${result.job_id}`);
                                    const statusText = document.getElementById(`pdf-status-${result.job_id}`);
                                    
                                    if (progressBar) {
                                      progressBar.style.width = progress + '%';
                                      progressBar.textContent = progress + '%';
                                    }
                                    
                                    if (statusText) {
                                      if (job.status === 'processing') {
                                        statusText.textContent = `Found ${job.total_links} links • Imported ${job.imported_items}/${job.total_links}`;
                                      } else if (job.status === 'completed') {
                                        statusText.textContent = `✅ Complete! ${job.imported_items} products imported`;
                                        if (job.failed_items > 0) {
                                          statusText.textContent += ` (${job.failed_items} failed)`;
                                        }
                                        statusText.style.color = '#9ACD32';
                                        clearInterval(pollProgress);
                                        
                                        // Refresh the page to show new items (force hard reload to bypass cache)
                                        setTimeout(() => {
                                          window.location.reload(true);
                                        }, 3000);
                                      } else if (job.status === 'failed') {
                                        statusText.textContent = '❌ Import failed';
                                        statusText.style.color = '#ff6b6b';
                                        clearInterval(pollProgress);
                                      }
                                    }
                                  }
                                } catch (e) {
                                  console.error('Progress poll error:', e);
                                }
                              }, 2000);
                              
                              setTimeout(() => clearInterval(pollProgress), 300000);
                              
                            } else {
                              const error = await response.json();
                              alert(`❌ PDF import failed: ${error.detail || 'Unknown error'}`);
                            }
                          } catch (error) {
                            alert(`❌ Error: ${error.message}`);
                          }
                        };
                        input.click();
                      }}
                      className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white text-xs px-3 py-1 rounded transition-colors font-bold"
                      title={`Import products from Canva PDF to ${room.name}`}
                    >
                      📄 IMPORT FROM PDF
                    </button>
                    
                    {/* UPLOAD IMAGES TO CANVA */}
                    <button
                      onClick={async () => {
                        if (!confirm(`Upload all images from "${room.name}" to Canva?\n\nThis will upload:\n• Item images\n• Walkthrough photos\n• Product images\n\nThey will be tagged with the project and room name in Canva.`)) {
                          return;
                        }
                        
                        try {
                          const response = await fetch(`${process.env.REACT_APP_BACKEND_URL || window.location.origin}/api/canva/upload-room-images?project_id=${project.id}&room_id=${room.id}`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' }
                          });
                          
                          if (response.ok) {
                            const result = await response.json();
                            alert(`✅ Upload started!\n\nJob ID: ${result.job_id}\n\nImages will be uploaded to your Canva account in the background. Check your Canva uploads folder.`);
                            
                            // Show progress modal
                            const modal = document.createElement('div');
                            modal.style.cssText = `
                              position: fixed;
                              top: 0;
                              left: 0;
                              width: 100%;
                              height: 100%;
                              background: rgba(0,0,0,0.9);
                              display: flex;
                              align-items: center;
                              justify-content: center;
                              z-index: 9999;
                            `;
                            
                            modal.innerHTML = `
                              <div style="background: linear-gradient(135deg, #000 0%, #1e293b 50%, #000 100%); padding: 40px; border-radius: 16px; max-width: 500px; border: 3px solid #D4A574;">
                                <h2 style="color: #D4A574; font-size: 24px; margin-bottom: 20px; text-align: center;">📤 Uploading to Canva</h2>
                                
                                <div id="upload-progress-${result.job_id}" style="background: rgba(30, 41, 59, 0.8); padding: 20px; border-radius: 12px; margin-bottom: 20px; border: 2px solid #B49B7E;">
                                  <p style="color: #B49B7E; margin-bottom: 10px; text-align: center;">⏳ Processing...</p>
                                  <div style="background: rgba(0,0,0,0.5); border-radius: 8px; overflow: hidden; height: 30px;">
                                    <div id="progress-bar-${result.job_id}" style="background: linear-gradient(90deg, #D4A574, #B49B7E); height: 100%; width: 0%; transition: width 0.5s; display: flex; align-items: center; justify-content: center; color: #000; font-weight: bold; font-size: 12px;"></div>
                                  </div>
                                  <p id="status-text-${result.job_id}" style="color: #D4A574; margin-top: 10px; text-align: center; font-size: 14px;">Starting upload...</p>
                                </div>
                                
                                <button onclick="this.parentElement.parentElement.remove()" style="width: 100%; padding: 14px; background: rgba(30, 41, 59, 0.8); color: #B49B7E; border: 2px solid #B49B7E; border-radius: 8px; font-weight: bold; cursor: pointer; font-size: 14px;">
                                  ✖ CLOSE (Upload continues in background)
                                </button>
                              </div>
                            `;
                            
                            document.body.appendChild(modal);
                            
                            // Poll for progress
                            const pollProgress = setInterval(async () => {
                              try {
                                const progressRes = await fetch(`${process.env.REACT_APP_BACKEND_URL || window.location.origin}/api/canva/upload-job/${result.job_id}`);
                                if (progressRes.ok) {
                                  const job = await progressRes.json();
                                  const progress = job.total_images > 0 ? (job.uploaded_images / job.total_images * 100).toFixed(0) : 0;
                                  
                                  const progressBar = document.getElementById(`progress-bar-${result.job_id}`);
                                  const statusText = document.getElementById(`status-text-${result.job_id}`);
                                  
                                  if (progressBar) {
                                    progressBar.style.width = progress + '%';
                                    progressBar.textContent = progress + '%';
                                  }
                                  
                                  if (statusText) {
                                    statusText.textContent = `${job.uploaded_images} / ${job.total_images} images uploaded`;
                                    
                                    if (job.status === 'completed') {
                                      statusText.textContent = `✅ Complete! ${job.uploaded_images} images uploaded`;
                                      if (job.failed_images > 0) {
                                        statusText.textContent += ` (${job.failed_images} failed)`;
                                      }
                                      clearInterval(pollProgress);
                                    } else if (job.status === 'failed') {
                                      statusText.textContent = '❌ Upload failed';
                                      statusText.style.color = '#ff6b6b';
                                      clearInterval(pollProgress);
                                    }
                                  }
                                }
                              } catch (e) {
                                console.error('Progress poll error:', e);
                              }
                            }, 2000);
                            
                            // Stop polling after 5 minutes
                            setTimeout(() => clearInterval(pollProgress), 300000);
                            
                          } else {
                            const error = await response.json();
                            alert(`❌ Upload failed: ${error.detail || 'Unknown error'}`);
                          }
                        } catch (error) {
                          alert(`❌ Upload error: ${error.message}`);
                        }
                      }}
                      className="bg-gradient-to-r from-[#D4A574] to-[#B49B7E] text-black text-xs px-3 py-1 rounded hover:from-[#E8D4B8] hover:to-[#D4A574] transition-colors font-bold"
                      title={`Upload all images from ${room.name} to Canva`}
                    >
                      📤 UPLOAD TO CANVA
                    </button>
                    
                    {/* CANVA PAGE-SPECIFIC IMPORT BUTTON */}
                    <button
                      onClick={() => {
                        console.log(`🎨 Canva import clicked for room: ${room.name}`);
                        if (onRoomCanvaImport) {
                          onRoomCanvaImport(room.name);
                        } else {
                          alert(`Canva import for ${room.name} - Function not connected yet`);
                        }
                      }}
                      className="bg-purple-600 text-white text-xs px-3 py-1 rounded hover:bg-purple-700 transition-colors"
                      title={`Import from Canva Page for ${room.name}`}
                    >
                      🎨 Import Page
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

              {/* CATEGORIES - Only show when room expanded */}
              {isRoomExpanded && (
                <Droppable droppableId={`categories-${room.id}`} type="CATEGORY">
                  {(provided) => (
                    <div ref={provided.innerRef} {...provided.droppableProps}>
                      {room.categories?.map((category, categoryIndex) => {
                        const isCategoryExpanded = expandedCategories[category.id];
                        
                        return (
                          <Draggable key={category.id} draggableId={category.id} index={categoryIndex}>
                            {(provided, snapshot) => (
                              <div 
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className="mb-6"
                                style={{
                                  ...provided.draggableProps.style,
                                  opacity: snapshot.isDragging ? 0.8 : 1,
                                  transform: provided.draggableProps.style?.transform || 'none'
                                }}
                              >
                                {/* CATEGORY HEADER WITH EXPAND/COLLAPSE */}
                                <div 
                                  className="px-4 py-2 text-[#D4C5A9] font-bold mb-2"
                                  style={{ backgroundColor: getCategoryColor() }}
                                >
                                  <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-2">
                                      <div className="cursor-move text-[#B49B7E] hover:text-gray-200 px-1">
                                        ⋮⋮
                                      </div>
                                      <button
                                        onClick={() => toggleCategoryExpansion(category.id)}
                                        className="text-[#B49B7E] hover:text-gray-200"
                                      >
                                        {isCategoryExpanded ? '▼' : '▶'}
                                      </button>
                                      <span>{category.name.toUpperCase()}</span>
                                    </div>
                        <div className="flex items-center gap-2">
                          {/* ADD CATEGORY DROPDOWN - FIXED */}
                          <select 
                            onChange={(e) => {
                              if (e.target.value) {
                                console.log('🎯 Adding category:', e.target.value, 'to room:', room.id);
                                handleAddCategory(room.id, e.target.value);
                                e.target.value = '';
                              }
                            }}
                            className="bg-green-600 text-[#B49B7E] text-xs px-2 py-1 rounded border-none"
                          >
                            <option value="">+ Add Category</option>
                            {availableCategories.map(categoryName => (
                              <option key={categoryName} value={categoryName}>
                                {categoryName}
                              </option>
                            ))}
                          </select>
                          <button
                            onClick={() => handleDeleteCategory(category.id)}
                            className="text-red-300 hover:text-red-100 text-lg"
                            title="Delete Category"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* CHECKLIST TABLE - Only show when category expanded */}
                    {isCategoryExpanded && (
                      <>
                        {category.subcategories?.map((subcategory) => (
                          <React.Fragment key={subcategory.id || subcategory.name}>
                            {/* TABLE WITH SUBCATEGORY NAME IN HEADER */}
                            <table className="w-full border-collapse border border-[#B49B7E] mb-4 shadow-lg shadow-[#B49B7E]/10">
                              <thead>
                                <tr>
                                  <th className="border border-[#B49B7E] px-1 py-2 text-xs font-bold text-[#D4C5A9] w-8 shadow-inner shadow-[#B49B7E]/20" style={{ backgroundColor: '#8B4444' }}>✓</th>
                                  <th className="border border-[#B49B7E] px-2 py-2 text-xs font-bold text-[#D4C5A9] shadow-inner shadow-[#B49B7E]/20" style={{ backgroundColor: '#8B4444' }}>
                                    {subcategory.name.toUpperCase()}
                                    <button
                                      onClick={() => {
                                        if (window.confirm(`Delete subcategory "${subcategory.name}" and all its items?`)) {
                                          handleDeleteSubcategory(subcategory.id);
                                        }
                                      }}
                                      className="ml-2 text-[#B49B7E] hover:text-red-200 text-xs"
                                      title={`Delete ${subcategory.name} subcategory`}
                                    >
                                      🗑️
                                    </button>
                                  </th>
                                  <th className="border border-[#B49B7E] px-2 py-2 text-xs font-bold text-[#B49B7E] shadow-inner shadow-[#B49B7E]/20" style={{ backgroundColor: '#8B4444' }}>VENDOR/SKU</th>
                                  <th className="border border-[#B49B7E] px-2 py-2 text-xs font-bold text-[#B49B7E] w-16 shadow-inner shadow-[#B49B7E]/20" style={{ backgroundColor: '#8B4444' }}>QTY</th>
                                  <th className="border border-[#B49B7E] px-2 py-2 text-xs font-bold text-[#B49B7E] shadow-inner shadow-[#B49B7E]/20" style={{ backgroundColor: '#8B4444' }}>SIZE</th>
                                  <th className="border border-[#B49B7E] px-2 py-2 text-xs font-bold text-[#B49B7E] shadow-inner shadow-[#B49B7E]/20" style={{ backgroundColor: '#8B4444' }}>FINISH/COLOR</th>
                                  <th className="border border-[#B49B7E] px-2 py-2 text-xs font-bold text-[#B49B7E] shadow-inner shadow-[#B49B7E]/20" style={{ backgroundColor: '#8B4444' }}>COST</th>
                                  <th className="border border-[#B49B7E] px-2 py-2 text-xs font-bold text-[#B49B7E] shadow-inner shadow-[#B49B7E]/20" style={{ backgroundColor: '#8B4444' }}>STATUS</th>
                                  <th className="border border-[#B49B7E] px-2 py-2 text-xs font-bold text-[#B49B7E] w-20 shadow-inner shadow-[#B49B7E]/20" style={{ backgroundColor: '#8B4444' }}>IMAGE</th>
                                  <th className="border border-[#B49B7E] px-2 py-2 text-xs font-bold text-[#B49B7E] w-24 shadow-inner shadow-[#B49B7E]/20" style={{ backgroundColor: '#8B4444' }}>PRODUCT LINK</th>
                                  <th className="border border-[#B49B7E] px-2 py-2 text-xs font-bold text-[#B49B7E] shadow-inner shadow-[#B49B7E]/20" style={{ backgroundColor: '#8B4444' }}>REMARKS</th>
                                  <th className="border border-[#B49B7E] px-2 py-2 text-xs font-bold text-[#B49B7E] w-12 shadow-inner shadow-[#B49B7E]/20" style={{ backgroundColor: '#8B4444' }}>DELETE</th>
                                </tr>
                              </thead>
                              <tbody>
                                {/* ITEMS UNDER THIS SUBCATEGORY */}
                                {subcategory.items?.map((item, itemIndex) => (
                                      <tr key={item.id} style={{ 
                                        background: itemIndex % 2 === 0 
                                          ? 'linear-gradient(135deg, rgba(0, 0, 0, 0.95) 0%, rgba(30, 30, 30, 0.9) 30%, rgba(15, 15, 25, 0.95) 70%, rgba(0, 0, 0, 0.95) 100%)'
                                          : 'linear-gradient(135deg, rgba(15, 15, 25, 0.95) 0%, rgba(45, 45, 55, 0.9) 30%, rgba(25, 25, 35, 0.95) 70%, rgba(15, 15, 25, 0.95) 100%)'
                                      }}>
                                        {/* CHECKBOX - AUTO SET TO PICKED */}
                                        <td className="border border-[#B49B7E] px-1 py-1 text-center w-8">
                                          <input 
                                            type="checkbox" 
                                            className="w-4 h-4 cursor-pointer" 
                                            checked={checkedItems.has(item.id) || item.status === 'PICKED'}
                                            onChange={async (e) => {
                                              const newCheckedItems = new Set(checkedItems);
                                              const newStatus = e.target.checked ? 'PICKED' : '';
                                              
                                              if (e.target.checked) {
                                                newCheckedItems.add(item.id);
                                              } else {
                                                newCheckedItems.delete(item.id);
                                              }
                                              setCheckedItems(newCheckedItems);
                                              
                                              // Update item status immediately in local data
                                              item.status = newStatus;
                                              
                                              // Update backend
                                              try {
                                                const backendUrl = process.env.REACT_APP_BACKEND_URL || window.location.origin;
                                                await fetch(`${backendUrl}/api/items/${item.id}`, {
                                                  method: 'PUT',
                                                  headers: { 'Content-Type': 'application/json' },
                                                  body: JSON.stringify({ status: newStatus })
                                                });
                                                console.log(`✅ Status updated: ${newStatus}`);
                                              } catch (error) {
                                                console.error('❌ Failed to update status:', error);
                                                // Revert local change on error
                                                item.status = item.status;
                                              }
                                            }}
                                          />
                                        </td>
                                        {/* ITEM - EDITABLE */}
                                        <td className="border border-[#B49B7E] px-2 py-1 text-[#B49B7E] text-sm">
                                          <div 
                                            contentEditable={true}
                                            suppressContentEditableWarning={true}
                                            className="w-full bg-transparent text-[#B49B7E] text-sm outline-none"
                                            onBlur={(e) => console.log('Item name updated:', e.target.textContent)}
                                          >
                                            {item.name}
                                          </div>
                                        </td>
                                  
                                  {/* VENDOR/SKU - EDITABLE */}
                                  <td className="border border-[#B49B7E] px-2 py-1 text-[#B49B7E] text-sm">
                                    <div 
                                      contentEditable={true}
                                      suppressContentEditableWarning={true}
                                      className="w-full bg-transparent text-[#B49B7E] text-sm outline-none"
                                      onBlur={(e) => console.log('Vendor/SKU updated:', e.target.textContent)}
                                    >
                                      {item.vendor ? `${item.vendor}${item.sku ? ` / ${item.sku}` : ''}` : item.sku || ''}
                                    </div>
                                  </td>
                                  
                                  {/* QTY - EDITABLE */}
                                  <td className="border border-[#B49B7E] px-2 py-1 text-[#B49B7E] text-sm text-center">
                                    <div 
                                      contentEditable={true}
                                      suppressContentEditableWarning={true}
                                      className="w-full bg-transparent text-[#B49B7E] text-sm text-center outline-none"
                                      onBlur={(e) => console.log('Quantity updated:', e.target.textContent)}
                                    >
                                      {item.quantity || ''}
                                    </div>
                                  </td>
                                  
                                  {/* SIZE - EDITABLE */}
                                  <td className="border border-[#B49B7E] px-2 py-1 text-[#B49B7E] text-sm">
                                    <div 
                                      contentEditable={true}
                                      suppressContentEditableWarning={true}
                                      className="w-full bg-transparent text-[#B49B7E] text-sm outline-none"
                                      onBlur={(e) => console.log('Size updated:', e.target.textContent)}
                                    >
                                      {item.size || ''}
                                    </div>
                                  </td>
                                  
                                  {/* FINISH/COLOR - EDITABLE */}
                                  <td className="border border-[#B49B7E] px-2 py-1 text-[#D4C5A9] text-sm">
                                    <div 
                                      contentEditable={true}
                                      suppressContentEditableWarning={true}
                                      className="w-full bg-transparent text-[#D4C5A9] text-sm outline-none"
                                      onBlur={(e) => console.log('Finish/Color updated:', e.target.textContent)}
                                    >
                                      {item.finish_color || ''}
                                    </div>
                                  </td>
                                  
                                  {/* COST - EDITABLE */}
                                  <td className="border border-[#B49B7E] px-2 py-1 text-[#B49B7E] text-sm">
                                    <div 
                                      contentEditable={true}
                                      suppressContentEditableWarning={true}
                                      className="w-full bg-transparent text-[#B49B7E] text-sm outline-none"
                                      onBlur={(e) => console.log('Cost updated:', e.target.textContent)}
                                    >
                                      ${item.cost || 0}
                                    </div>
                                  </td>
                                  
                                  {/* STATUS - DROPDOWN WITH FORCED COLORED CELL */}
                                  <td 
                                    className="border border-[#B49B7E] px-1 py-1 text-[#D4C5A9] text-sm"
                                    style={{ 
                                      backgroundColor: getStatusColor(item.status || '') + ' !important',
                                      background: getStatusColor(item.status || ''),
                                      minWidth: '120px'
                                    }}
                                  >
                                    <select 
                                      className="w-full text-[#D4C5A9] text-xs"
                                      value={item.status || ''}
                                      style={{ 
                                        backgroundColor: getStatusColor(item.status || ''),
                                        background: getStatusColor(item.status || ''),
                                        color: 'white !important',
                                        border: '2px solid ' + getStatusColor(item.status || ''),
                                        borderRadius: '4px',
                                        padding: '2px',
                                        outline: 'none',
                                        fontWeight: 'bold'
                                      }}
                                      onChange={(e) => handleStatusChange(item.id, e.target.value)}
                                    >
                                      <option value=""></option>
                                      <option value="PICKED">PICKED</option>
                                      <option value="ORDER SAMPLES">ORDER SAMPLES</option>
                                      <option value="SAMPLES ARRIVED">SAMPLES ARRIVED</option>
                                      <option value="ASK NEIL">ASK NEIL</option>
                                      <option value="ASK CHARLENE">ASK CHARLENE</option>
                                      <option value="ASK JALA">ASK JALA</option>
                                      <option value="GET QUOTE">GET QUOTE</option>
                                      <option value="WAITING ON QT">WAITING ON QT</option>
                                      <option value="READY FOR PRESENTATION">READY FOR PRESENTATION</option>
                                      <option value="GET QUOTE" style={{ backgroundColor: '#06B6D4', color: 'white' }}>GET QUOTE</option>
                                      <option value="WAITING ON QT" style={{ backgroundColor: '#F97316', color: 'white' }}>WAITING ON QT</option>
                                      <option value="READY FOR PRESENTATION" style={{ backgroundColor: '#84CC16', color: 'white' }}>READY FOR PRESENTATION</option>
                                    </select>
                                  </td>
                                  
                                  {/* IMAGE */}
                                  <td className="border border-[#B49B7E] px-2 py-1 text-[#D4C5A9] text-sm w-20">
                                    {item.image_url ? (
                                      <img 
                                        src={item.image_url} 
                                        alt={item.name}
                                        className="w-12 h-12 object-cover cursor-pointer hover:scale-150 transition-transform duration-200 z-10"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          console.log('🖼️ Opening LARGE image popup - 98vw x 95vh');
                                          // Create full-size overlay with better styling
                                          const overlay = document.createElement('div');
                                          overlay.style.cssText = `
                                            position: fixed;
                                            top: 0;
                                            left: 0;
                                            width: 100%;
                                            height: 100%;
                                            background: rgba(0, 0, 0, 0.8);
                                            display: flex;
                                            align-items: center;
                                            justify-content: center;
                                            z-index: 9999;
                                            cursor: pointer;
                                          `;
                                          
                                          const container = document.createElement('div');
                                          container.style.cssText = `
                                            width: 100vw;
                                            height: 100vh;
                                            padding: 10px;
                                            text-align: center;
                                            display: flex;
                                            flex-direction: column;
                                            align-items: center;
                                            justify-content: center;
                                          `;
                                          
                                          const img = document.createElement('img');
                                          img.src = item.image_url;
                                          img.alt = item.name;
                                          img.style.cssText = `
                                            max-width: 98vw;
                                            max-height: 95vh;
                                            width: auto;
                                            height: auto;
                                            object-fit: contain;
                                            border-radius: 8px;
                                            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.8);
                                          `;
                                          
                                          const title = document.createElement('p');
                                          title.textContent = item.name;
                                          title.style.cssText = `
                                            color: white;
                                            margin-top: 15px;
                                            font-size: 18px;
                                            font-weight: bold;
                                          `;
                                          
                                          container.appendChild(img);
                                          container.appendChild(title);
                                          overlay.appendChild(container);
                                          
                                          overlay.addEventListener('click', () => {
                                            document.body.removeChild(overlay);
                                          });
                                          
                                          document.body.appendChild(overlay);
                                        }}
                                      />
                                    ) : (
                                      <div className="w-12 h-12 bg-gray-600 flex items-center justify-center text-xs">No Image</div>
                                    )}
                                  </td>
                                  
                                  {/* PRODUCT LINK - CLICKABLE */}
                                  <td className="border border-[#B49B7E] px-2 py-1 text-center w-24">
                                    {item.link ? (
                                      <a 
                                        href={item.link}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-1 rounded transition-colors duration-200"
                                        title={`Open ${item.name} in new tab`}
                                      >
                                        🔗 VIEW
                                      </a>
                                    ) : (
                                      <span className="text-gray-500 text-xs">No Link</span>
                                    )}
                                  </td>
                                  
                                  {/* REMARKS - EDITABLE */}
                                  <td className="border border-[#B49B7E] px-2 py-1 text-[#D4C5A9] text-sm">
                                    <div 
                                      contentEditable={true}
                                      suppressContentEditableWarning={true}
                                      className="w-full bg-transparent text-[#D4C5A9] text-sm outline-none"
                                      onBlur={(e) => console.log('Remarks updated:', e.target.textContent)}
                                    >
                                      {item.remarks || ''}
                                    </div>
                                  </td>
                                  
                                  {/* DELETE BUTTON */}
                                  <td className="border border-[#B49B7E] px-2 py-1 text-center w-12">
                                    <button
                                      onClick={() => handleDeleteItem(item.id)}
                                      className="text-red-400 hover:text-red-300 text-sm"
                                      title="Delete Item"
                                    >
                                      🗑️
                                    </button>
                                  </td>
                                </tr>
                                ))}
                              </tbody>
                            </table>
                          </React.Fragment>
                        ))}

                        {/* ADD CATEGORY AND ADD ITEM BUTTONS - SECTION FOOTER */}
                        <div className="mb-4 flex gap-3">
                          <select 
                            onChange={(e) => {
                              if (e.target.value === 'ADD_NEW') {
                                const customCategory = prompt('Enter new category name:');
                                if (customCategory && customCategory.trim()) {
                                  handleAddCategory(room.id, customCategory.trim());
                                }
                              } else if (e.target.value) {
                                handleAddCategory(room.id, e.target.value);
                              }
                              e.target.value = ''; // Reset dropdown
                            }}
                            className="text-[#D4C5A9] px-3 py-2 rounded font-medium border-none outline-none text-sm" 
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
                            <option value="ADD_NEW">+ ADD NEW CATEGORY</option>
                          </select>
                          <button 
                            onClick={() => {
                              if (category.subcategories?.length > 0) {
                                setSelectedSubCategoryId(category.subcategories[0].id);
                                setShowAddItem(true);
                                console.log('🎯 Selected subcategory for checklist item:', category.subcategories[0].id);
                              } else {
                                alert('This category has no subcategories. Please contact support.');
                              }
                            }}
                            className="bg-blue-600 hover:bg-blue-500 text-[#D4C5A9] px-4 py-2 rounded text-sm"
                          >
                            + ADD ITEM
                          </button>
                        </div>
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

      {/* FOOTER SECTION - ADD CATEGORY */}
      <div className="mt-8 p-4 border-t-2 border-[#B49B7E]/50">
        <div className="flex gap-3 justify-center">
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
                alert('Please add a room first before adding categories.');
              }
            }}
            className="text-[#D4C5A9] px-6 py-3 rounded font-bold border-none outline-none text-lg" 
            style={{ backgroundColor: '#8b7355' }}
          >
            <option value="">+ ADD CATEGORY ▼</option>
            <option value="Lighting">Lighting</option>
            <option value="Furniture">Furniture</option>
            <option value="Decor & Accessories">Decor & Accessories</option>
            <option value="Paint, Wallpaper, and Finishes">Paint, Wallpaper, and Finishes</option>
            <option value="Plumbing & Fixtures">Plumbing & Fixtures</option>
            <option value="Appliances">Appliances</option>
            <option value="CREATE_NEW">+ CREATE NEW CATEGORY</option>
          </select>
          <button
            onClick={handleUploadToCanva}
            className="bg-purple-600 hover:bg-purple-500 text-[#D4C5A9] px-6 py-3 rounded font-bold text-lg"
          >
            🎨 CANVA IMPORT
          </button>
        </div>
      </div>
      
      {/* CANVA MODAL */}
      {showCanvaModal && (
        <CanvaIntegrationModal
          isOpen={showCanvaModal}
          onClose={() => setShowCanvaModal(false)}
          checkedItems={Array.from(checkedItems)}
          onItemsExtracted={handleCanvaItemsExtracted}
        />
      )}
    </div>
  );
};

export default ExactChecklistSpreadsheet;
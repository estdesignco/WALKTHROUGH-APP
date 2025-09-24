import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import AddItemModal from './AddItemModal';
import CanvaIntegrationModal from './CanvaIntegrationModal';

const SimpleChecklistSpreadsheet = ({ 
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
  console.log('🎯 SimpleChecklistSpreadsheet rendering with project:', project);

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
  const [showCanvaModal, setShowCanvaModal] = useState(false);

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

  // Status colors mapping for checklist
  const getStatusColor = (status) => {
    const statusColors = {
      '': '#6B7280',                        // Gray for blank/default
      'BLANK': '#6B7280',                   // Gray for blank
      'PICKED': '#3B82F6',                  // Blue
      'ORDER SAMPLES': '#10B981',           // Green
      'SAMPLES ARRIVED': '#8B5CF6',         // Purple
      'ASK NEIL': '#F59E0B',                // Yellow
      'ASK CHARLENE': '#EF4444',            // Red
      'ASK JALA': '#EC4899',                // Pink
      'GET QUOTE': '#06B6D4',               // Cyan
      'WAITING ON QT': '#F97316',           // Orange
      'READY FOR PRESENTATION': '#84CC16'   // Lime
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

  // Handle adding a new category - COPIED FROM WORKING FFE
  const handleAddCategory = async (roomId, categoryName) => {
    if (!roomId || !categoryName) {
      console.error('❌ Missing roomId or categoryName');
      return;
    }

    try {
      console.log('🔄 Creating comprehensive checklist category:', categoryName, 'for room:', roomId);
      
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
                    status: '' // BLANK status for checklist items
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
      console.error('❌ Error adding comprehensive checklist category:', error);
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
      
      console.log(`🏗️ Creating FFE structure for ALL ${allItemsToTransfer.length} written items`);

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
              description: `Transferred from checklist - ${itemContext.roomName}`
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
            status: 'APPROVED', // Set to APPROVED for FFE
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
              className="px-6 py-3 bg-amber-600 hover:bg-amber-700 text-white rounded font-medium"
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
              className="w-full px-4 py-2 rounded bg-gray-700 text-white border border-gray-600 focus:border-blue-500 focus:outline-none"
            />
          </div>
          
          {/* Filter Dropdowns */}
          <div className="flex gap-3 flex-wrap">
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
              <option value="Furniture">Furniture & Storage</option>
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
            
            {/* Filter and Clear Buttons */}
            <button 
              onClick={() => console.log('🔍 CHECKLIST FILTER APPLIED')}
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
                console.log('🧹 CHECKLIST FILTER CLEARED');
              }}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded font-medium"
            >
              CLEAR
            </button>
          </div>
          
          {/* Action Buttons - ADD ROOM AND TRANSFER */}
          <div className="flex gap-3">
            <button 
              onClick={onAddRoom}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded font-medium"
            >
              ✚ ADD ROOM
            </button>
            <button 
              onClick={handleTransferToFFE}
              className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded font-medium"
            >
              → TRANSFER TO FF&E
            </button>
          </div>
        </div>
      </div>

      {/* ENHANCED CHECKLIST TABLE WITH MINIMIZE/EXPAND AND FILTERING */}
      <div className="w-full">
        {((filteredProject || project)?.rooms || []).map((room, roomIndex) => {
          const isRoomExpanded = expandedRooms[room.id];
          
          return (
            <div key={room.id} className="mb-8">
              {/* ROOM HEADER WITH DIFFERENT MUTED COLORS AND EXPAND/COLLAPSE */}
              <div 
                className="px-4 py-2 text-white font-bold mb-4"
                style={{ backgroundColor: getRoomColor(room.name, roomIndex) }}
              >
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
                  <div className="flex items-center gap-2">
                    {/* FILE UPLOAD FOR CANVA PDF */}
                    <input
                      type="file"
                      accept=".pdf,.png,.jpg,.jpeg"
                      className="hidden"
                      id={`canva-upload-${room.id}`}
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (file) {
                          handleCanvaPdfUpload(file, room.name);
                        }
                      }}
                    />
                    <label
                      htmlFor={`canva-upload-${room.id}`}
                      className="bg-purple-600 text-white text-xs px-2 py-1 rounded hover:bg-purple-700 cursor-pointer"
                      title="Upload Canva PDF/Image"
                    >
                      🎨 Upload Canva
                    </label>
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
              {isRoomExpanded && room.categories?.map((category) => {
                const isCategoryExpanded = expandedCategories[category.id];
                
                return (
                  <div key={category.id} className="mb-6">
                    {/* CATEGORY HEADER WITH EXPAND/COLLAPSE */}
                    <div 
                      className="px-4 py-2 text-white font-bold mb-2"
                      style={{ backgroundColor: getCategoryColor() }}
                    >
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
                            className="bg-green-600 text-white text-xs px-2 py-1 rounded border-none"
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
                            <table className="w-full border-collapse border border-gray-400 mb-4">
                              <thead>
                                <tr>
                                  <th className="border border-gray-400 px-2 py-2 text-xs font-bold text-white" style={{ backgroundColor: '#8B4444' }}>{subcategory.name.toUpperCase()}</th>
                                  <th className="border border-gray-400 px-2 py-2 text-xs font-bold text-white w-16" style={{ backgroundColor: '#8B4444' }}>QTY</th>
                                  <th className="border border-gray-400 px-2 py-2 text-xs font-bold text-white" style={{ backgroundColor: '#8B4444' }}>SIZE</th>
                                  <th className="border border-gray-400 px-2 py-2 text-xs font-bold text-white" style={{ backgroundColor: '#8B4444' }}>FINISH/COLOR</th>
                                  <th className="border border-gray-400 px-2 py-2 text-xs font-bold text-white" style={{ backgroundColor: '#8B4444' }}>STATUS</th>
                                  <th className="border border-gray-400 px-2 py-2 text-xs font-bold text-white w-20" style={{ backgroundColor: '#8B4444' }}>IMAGE</th>
                                  <th className="border border-gray-400 px-2 py-2 text-xs font-bold text-white w-20" style={{ backgroundColor: '#8B4444' }}>LINK</th>
                                  <th className="border border-gray-400 px-2 py-2 text-xs font-bold text-white" style={{ backgroundColor: '#8B4444' }}>REMARKS</th>
                                  <th className="border border-gray-400 px-2 py-2 text-xs font-bold text-white w-12" style={{ backgroundColor: '#8B4444' }}>DELETE</th>
                                </tr>
                              </thead>
                              <tbody>
                                {/* ITEMS UNDER THIS SUBCATEGORY */}
                                {subcategory.items?.map((item, itemIndex) => (
                                      <tr key={item.id} className={itemIndex % 2 === 0 ? 'bg-slate-800' : 'bg-slate-700'}>
                                        {/* ITEM - EDITABLE */}
                                        <td className="border border-gray-400 px-2 py-1 text-white text-sm">
                                          <div 
                                            contentEditable={true}
                                            suppressContentEditableWarning={true}
                                            className="w-full bg-transparent text-white text-sm outline-none"
                                            onBlur={(e) => console.log('Item name updated:', e.target.textContent)}
                                          >
                                            {item.name}
                                          </div>
                                        </td>
                                  
                                  {/* QTY - EDITABLE */}
                                  <td className="border border-gray-400 px-2 py-1 text-white text-sm text-center">
                                    <div 
                                      contentEditable={true}
                                      suppressContentEditableWarning={true}
                                      className="w-full bg-transparent text-white text-sm text-center outline-none"
                                      onBlur={(e) => console.log('Quantity updated:', e.target.textContent)}
                                    >
                                      {item.quantity || ''}
                                    </div>
                                  </td>
                                  
                                  {/* SIZE - EDITABLE */}
                                  <td className="border border-gray-400 px-2 py-1 text-white text-sm">
                                    <div 
                                      contentEditable={true}
                                      suppressContentEditableWarning={true}
                                      className="w-full bg-transparent text-white text-sm outline-none"
                                      onBlur={(e) => console.log('Size updated:', e.target.textContent)}
                                    >
                                      {item.size || ''}
                                    </div>
                                  </td>
                                  
                                  {/* FINISH/COLOR - EDITABLE */}
                                  <td className="border border-gray-400 px-2 py-1 text-white text-sm">
                                    <div 
                                      contentEditable={true}
                                      suppressContentEditableWarning={true}
                                      className="w-full bg-transparent text-white text-sm outline-none"
                                      onBlur={(e) => console.log('Finish/Color updated:', e.target.textContent)}
                                    >
                                      {item.finish_color || ''}
                                    </div>
                                  </td>
                                  
                                  {/* STATUS - DROPDOWN (KEEP AS IS) */}
                                  <td className="border border-gray-400 px-2 py-1 text-white text-sm">
                                    <select 
                                      className="bg-gray-800 text-white text-xs border-none w-full"
                                      value={item.status || ''}
                                      style={{ backgroundColor: getStatusColor(item.status || ''), color: 'white' }}
                                      onChange={(e) => handleStatusChange(item.id, e.target.value)}
                                    >
                                      <option value="" style={{ backgroundColor: '#6B7280', color: 'white' }}>Select Status</option>
                                      <option value="PICKED" style={{ backgroundColor: '#3B82F6', color: 'white' }}>PICKED</option>
                                      <option value="ORDER SAMPLES" style={{ backgroundColor: '#10B981', color: 'white' }}>ORDER SAMPLES</option>
                                      <option value="SAMPLES ARRIVED" style={{ backgroundColor: '#8B5CF6', color: 'white' }}>SAMPLES ARRIVED</option>
                                      <option value="ASK NEIL" style={{ backgroundColor: '#F59E0B', color: 'white' }}>ASK NEIL</option>
                                      <option value="ASK CHARLENE" style={{ backgroundColor: '#EF4444', color: 'white' }}>ASK CHARLENE</option>
                                      <option value="ASK JALA" style={{ backgroundColor: '#EC4899', color: 'white' }}>ASK JALA</option>
                                      <option value="GET QUOTE" style={{ backgroundColor: '#06B6D4', color: 'white' }}>GET QUOTE</option>
                                      <option value="WAITING ON QT" style={{ backgroundColor: '#F97316', color: 'white' }}>WAITING ON QT</option>
                                      <option value="READY FOR PRESENTATION" style={{ backgroundColor: '#84CC16', color: 'white' }}>READY FOR PRESENTATION</option>
                                    </select>
                                  </td>
                                  
                                  {/* IMAGE */}
                                  <td className="border border-gray-400 px-2 py-1 text-white text-sm w-20">
                                    {item.image_url ? (
                                      <img 
                                        src={item.image_url} 
                                        alt={item.name}
                                        className="w-12 h-12 object-cover cursor-pointer hover:scale-150 transition-transform duration-200 z-10"
                                        onClick={(e) => {
                                          e.stopPropagation();
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
                                            max-width: 80vw;
                                            max-height: 80vh;
                                            padding: 20px;
                                            text-align: center;
                                          `;
                                          
                                          const img = document.createElement('img');
                                          img.src = item.image_url;
                                          img.alt = item.name;
                                          img.style.cssText = `
                                            max-width: 100%;
                                            max-height: 100%;
                                            object-fit: contain;
                                            border-radius: 8px;
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
                                  
                                  {/* LINK - EDITABLE */}
                                  <td className="border border-gray-400 px-2 py-1 text-white text-sm w-20">
                                    <div 
                                      contentEditable={true}
                                      suppressContentEditableWarning={true}
                                      className="w-full bg-transparent text-blue-400 text-xs outline-none"
                                      onBlur={(e) => console.log('Link updated:', e.target.textContent)}
                                    >
                                      {item.link_url || ''}
                                    </div>
                                  </td>
                                  
                                  {/* REMARKS - EDITABLE */}
                                  <td className="border border-gray-400 px-2 py-1 text-white text-sm">
                                    <div 
                                      contentEditable={true}
                                      suppressContentEditableWarning={true}
                                      className="w-full bg-transparent text-white text-sm outline-none"
                                      onBlur={(e) => console.log('Remarks updated:', e.target.textContent)}
                                    >
                                      {item.remarks || ''}
                                    </div>
                                  </td>
                                  
                                  {/* DELETE BUTTON */}
                                  <td className="border border-gray-400 px-2 py-1 text-center w-12">
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

                        {/* ADD CATEGORY AND ADD ITEM BUTTONS - BOTTOM SECTION */}
                        <div className="mb-4 flex gap-3">
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
                            className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded text-sm"
                          >
                            + ADD ITEM
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

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
      <div className="mt-8 p-4 border-t-2 border-gray-600">
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
                    // handleAddCategory(firstRoom.id, categoryName.trim());
                    console.log('Add new category:', categoryName);
                  }
                } else if (e.target.value) {
                  // handleAddCategory(firstRoom.id, e.target.value);
                  console.log('Add existing category:', e.target.value);
                }
              } else {
                alert('Please add a room first before adding categories.');
              }
            }}
            className="text-white px-6 py-3 rounded font-bold border-none outline-none text-lg" 
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
        </div>
      </div>

      {/* Canva Integration Modal */}
      {showCanvaModal && (
        <CanvaIntegrationModal
          onClose={() => setShowCanvaModal(false)}
          onItemsExtracted={handleCanvaItemsExtracted}
          project={project}
        />
      )}
    </div>
  );
};

export default SimpleChecklistSpreadsheet;
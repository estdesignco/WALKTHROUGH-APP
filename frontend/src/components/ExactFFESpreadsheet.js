import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import AddItemModal from './AddItemModal';
import AdvancedFFEFeatures from './AdvancedFFEFeatures';
import { getRoomColor, getCategoryColor } from '../utils/roomColors';
import { getStatusColor, STATUS_COLORS } from '../utils/statusColors';

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
  // ✅ DEBUG LOGGING TO FIND EMPTY SPREADSHEET ISSUE
  console.log('📊 ExactFFESpreadsheet - Project data:', project);
  console.log('📊 ExactFFESpreadsheet - Rooms count:', project?.rooms?.length || 0);
  console.log('📊 ExactFFESpreadsheet - First room:', project?.rooms?.[0] || 'No rooms');
  
  const [showAddItem, setShowAddItem] = useState(false);
  const [selectedSubCategoryId, setSelectedSubCategoryId] = useState(null);
  const [availableCategories, setAvailableCategories] = useState([]);
  
  // Load expanded states from localStorage
  const [expandedRooms, setExpandedRooms] = useState(() => {
    const saved = localStorage.getItem('ffe_expandedRooms');
    return saved ? JSON.parse(saved) : {};
  });
  const [expandedCategories, setExpandedCategories] = useState(() => {
    const saved = localStorage.getItem('ffe_expandedCategories');
    return saved ? JSON.parse(saved) : {};
  });
  
  const [expandedImage, setExpandedImage] = useState(null);  // For image modal
  
  // Room photos state - for displaying walkthrough photos
  const [roomPhotos, setRoomPhotos] = useState({});
  const [expandedPhotoRooms, setExpandedPhotoRooms] = useState({});
  const [selectedPhotoView, setSelectedPhotoView] = useState(null);

  // FILTER STATE - MAKE IT ACTUALLY WORK
  const [filteredProject, setFilteredProject] = useState(project);
  
  // ✅ SCRAPER CLIPBOARD STATE - For pasting scraped data into specific rows
  const [scraperClipboard, setScraperClipboard] = useState(null);
  const [selectedItemForPaste, setSelectedItemForPaste] = useState(null); // Which item row is selected
  const [showScraperNotification, setShowScraperNotification] = useState(false);
  
  // Check for URL parameters from extension (action=add-item&source=extension)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('action') === 'add-item' && params.get('source') === 'extension') {
      const scrapedData = {
        name: params.get('name') || '',
        price: params.get('price') || '',
        sku: params.get('sku') || '',
        size: params.get('size') || '',
        finish_color: params.get('finish') || '',
        finish_image: params.get('finish_image') || '',
        vendor: params.get('vendor') || '',
        url: params.get('link') || '',
        link: params.get('link') || '',
        image_url: params.get('image') || '',
        msrp: params.get('msrp') || ''
      };
      
      // Only store if we have actual data
      if (scrapedData.name || scrapedData.sku || scrapedData.price) {
        localStorage.setItem('extensionScrapedData', JSON.stringify(scrapedData));
        console.log('Stored scraper data from URL:', scrapedData);
        
        // Clean URL without reloading
        const cleanUrl = window.location.pathname + '?tab=Checklist';
        window.history.replaceState({}, '', cleanUrl);
      }
    }
  }, []);
  
  // Check for scraped data in localStorage on mount and periodically
  useEffect(() => {
    const checkForScrapedData = () => {
      const data = localStorage.getItem('extensionScrapedData');
      if (data) {
        try {
          const parsed = JSON.parse(data);
          setScraperClipboard(parsed);
          setShowScraperNotification(true);
        } catch (e) {}
      }
    };
    
    checkForScrapedData();
    // Check every 2 seconds for new scraped data
    const interval = setInterval(checkForScrapedData, 2000);
    return () => clearInterval(interval);
  }, []);
  
  // ✅ Search and Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRoom, setSelectedRoom] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedVendor, setSelectedVendor] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedCarrier, setSelectedCarrier] = useState('');
  
  // Load photos for all rooms from walkthrough
  useEffect(() => {
    const loadRoomPhotos = async () => {
      if (!project?.id || !project?.rooms) return;
      
      const backendUrl = window.ENV?.REACT_APP_BACKEND_URL || window.location.origin;
      const photosData = {};
      
      for (const room of project.rooms) {
        try {
          const response = await fetch(`${backendUrl}/api/photos/by-room-name/${project.id}/${encodeURIComponent(room.name)}`);
          if (response.ok) {
            const data = await response.json();
            photosData[room.id] = data.photos || [];
          } else {
            const fallbackResponse = await fetch(`${backendUrl}/api/photos/by-room/${project.id}/${room.id}`);
            if (fallbackResponse.ok) {
              const fallbackData = await fallbackResponse.json();
              photosData[room.id] = fallbackData.photos || [];
            } else {
              photosData[room.id] = [];
            }
          }
        } catch (error) {
          console.warn(`Failed to load photos for room ${room.name}:`, error);
          photosData[room.id] = [];
        }
      }
      
      setRoomPhotos(photosData);
      console.log('📸 FF&E: Loaded room photos:', Object.keys(photosData).length, 'rooms');
    };

    loadRoomPhotos();
  }, [project?.id, project?.rooms]);
  
  // Toggle photo folder
  const togglePhotoFolder = (roomId) => {
    setExpandedPhotoRooms(prev => ({ ...prev, [roomId]: !prev[roomId] }));
  };

  // ACTUAL API CALLS - WITH PROPER ERROR HANDLING
  const handleStatusChange = async (itemId, newStatus) => {
    console.log('🔄 Status change request:', { itemId, newStatus });
    
    // Save scroll position before update
    const scrollY = window.scrollY || window.pageYOffset;
    console.log('💾 Saving scroll position:', scrollY);
    
    try {
      const response = await fetch(`${(window.ENV?.REACT_APP_BACKEND_URL || window.location.origin) || window.location.origin}/api/items/${itemId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      
      console.log('📡 Status change response:', response.status, response.statusText);
      
      if (response.ok) {
        console.log('✅ Status updated successfully');
        
        // Update local state to avoid scroll jump - create proper deep copy
        const updatedProject = JSON.parse(JSON.stringify(filteredProject));
        let itemFound = false;
        
        updatedProject.rooms?.forEach(room => {
          room.categories?.forEach(category => {
            category.subcategories?.forEach(subcategory => {
              subcategory.items?.forEach(item => {
                if (item.id === itemId) {
                  item.status = newStatus;
                  itemFound = true;
                  console.log('✅ Updated item status in local state:', item.name, '→', newStatus);
                }
              });
            });
          });
        });
        
        if (itemFound) {
          setFilteredProject(updatedProject);
          // Restore scroll position after state update
          setTimeout(() => {
            window.scrollTo(0, scrollY);
            console.log('📜 Restored scroll position:', scrollY);
          }, 0);
        } else {
          console.warn('⚠️ Item not found in local state, calling onReload');
          if (onReload) {
            onReload();
          }
          // Restore scroll position after reload
          setTimeout(() => {
            window.scrollTo(0, scrollY);
            console.log('📜 Restored scroll position after reload:', scrollY);
          }, 100);
        }
      } else {
        const errorData = await response.text();
        console.error('❌ Status update failed:', response.status, errorData);
        alert(`Failed to update status: ${response.status} ${response.statusText}\n${errorData}`);
      }
    } catch (error) {
      console.error('❌ Status update error:', error);
      alert(`Error updating status: ${error.message}`);
    }
  };

  const handleCarrierChange = async (itemId, newCarrier) => {
    console.log('🔄 Carrier change request:', { itemId, newCarrier });
    
    try {
      const response = await fetch(`${(window.ENV?.REACT_APP_BACKEND_URL || window.location.origin) || window.location.origin}/api/items/${itemId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ carrier: newCarrier })
      });
      
      if (response.ok) {
        console.log('✅ Carrier updated successfully');
        
        // Update local state to avoid scroll jump - create proper deep copy
        const updatedProject = JSON.parse(JSON.stringify(filteredProject));
        let itemFound = false;
        
        updatedProject.rooms?.forEach(room => {
          room.categories?.forEach(category => {
            category.subcategories?.forEach(subcategory => {
              subcategory.items?.forEach(item => {
                if (item.id === itemId) {
                  item.carrier = newCarrier;
                  itemFound = true;
                  console.log('✅ Updated item carrier in local state:', item.name, '→', newCarrier);
                }
              });
            });
          });
        });
        
        if (itemFound) {
          setFilteredProject(updatedProject);
        } else {
          console.warn('⚠️ Item not found in local state, calling onReload');
          if (onReload) {
            onReload();
          }
        }
      } else {
        const errorData = await response.text();
        console.error('❌ Carrier update failed:', response.status, errorData);
        alert(`Failed to update carrier: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.error('❌ Carrier update error:', error);
      alert(`Error updating carrier: ${error.message}`);
    }
  };

  // APPLY FILTERS - SIMPLE WORKING VERSION
  useEffect(() => {
    console.log('🔍 Filter triggered:', { searchTerm, selectedRoom, selectedCategory, selectedVendor, selectedStatus, selectedCarrier });
    
    if (!project) {
      setFilteredProject(null);
      return;
    }

    let filtered = { ...project };

    // Apply filters if any are selected
    if (searchTerm || selectedRoom || selectedCategory || selectedVendor || selectedStatus || selectedCarrier) {
      console.log('🔍 Applying filters...');
      
      filtered.rooms = project.rooms.map(room => {
        // Room filter
        if (selectedRoom && room.id !== selectedRoom) {
          return { ...room, categories: [] }; // Hide room content but keep room header
        }
        
        // Filter categories and items
        const filteredCategories = room.categories.map(category => {
          // Category filter
          if (selectedCategory && category.name.toLowerCase() !== selectedCategory.toLowerCase()) {
            return { ...category, subcategories: [] };
          }
          
          // Filter subcategories and items
          const filteredSubcategories = category.subcategories.map(subcategory => {
            const filteredItems = subcategory.items.filter(item => {
              // Search term filter
              if (searchTerm) {
                const searchLower = searchTerm.toLowerCase();
                const itemMatch = 
                  item.name.toLowerCase().includes(searchLower) ||
                  (item.vendor && item.vendor.toLowerCase().includes(searchLower)) ||
                  (item.sku && item.sku.toLowerCase().includes(searchLower));
                if (!itemMatch) return false;
              }
              
              // Vendor filter
              if (selectedVendor && item.vendor !== selectedVendor) {
                return false;
              }
              
              // Status filter
              if (selectedStatus && item.status !== selectedStatus) {
                return false;
              }
              
              // Carrier filter
              if (selectedCarrier && item.carrier !== selectedCarrier) {
                return false;
              }
              
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
    console.log('🔍 Filter applied, rooms:', filtered.rooms.length);
  }, [project, searchTerm, selectedRoom, selectedCategory, selectedVendor, selectedStatus, selectedCarrier]);

  // Load available categories on component mount
  useEffect(() => {
    const loadAvailableCategories = async () => {
      try {
        const backendUrl = (window.ENV?.REACT_APP_BACKEND_URL || window.location.origin) || window.location.origin;
        const response = await fetch(`${backendUrl}/api/categories/available`);
        if (response.ok) {
          const data = await response.json();
          setAvailableCategories(data.categories || []);
        }
      } catch (error) {
        console.error('❌ Error loading available categories:', error);
        setAvailableCategories([
          "Lighting", "Furniture & Storage", "Decor & Accessories", 
          "Paint, Wallpaper & Finishes", "Architectural Elements, Built-ins & Trim",
          "Flooring", "Window Treatments", "HVAC & Mechanical Systems",
          "Security & Smart Home", "Appliances", "Plumbing & Fixtures"
        ]);
      }
    };
    
    loadAvailableCategories();
    
    // Initialize all rooms and categories as expanded by default
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

  // Handle scraping product information
  const handleScrapeProduct = async (productLink, itemId) => {
    if (!productLink?.trim()) {
      alert('Please enter a product URL first');
      return;
    }

    try {
      console.log('🔍 FFE: Scraping product from:', productLink);
      
      const backendUrl = (window.ENV?.REACT_APP_BACKEND_URL || window.location.origin) || window.location.origin;
      const response = await fetch(`${backendUrl}/api/scrape-product`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: productLink })
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ FFE: Scraping successful:', result);

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
          console.log('✅ FFE: Item updated with scraped data');
          alert(`✅ Successfully scraped: ${result.data.name || 'Product information'}`);
          if (onReload) {
            onReload();
          }
        } else {
          console.error('❌ FFE: Failed to update item with scraped data');
          alert('❌ Failed to update item with scraped data');
        }
      } else {
        const errorData = await response.json();
        console.error('❌ FFE: Scraping failed:', errorData);
        alert(`❌ Scraping failed: ${errorData.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('❌ FFE: Scraping error:', error);
      alert(`❌ Error during scraping: ${error.message}`);
    }
  };

  // ✅ PASTE SCRAPED DATA INTO A SPECIFIC ITEM ROW
  const handlePasteScrapedData = async (itemId) => {
    if (!scraperClipboard) {
      alert('No scraped data available. Use the Chrome extension to scrape a product first!');
      return;
    }
    
    try {
      const backendUrl = (window.ENV?.REACT_APP_BACKEND_URL || window.location.origin) || window.location.origin;
      
      // Prepare update data from scraped clipboard
      const updateData = {
        vendor: scraperClipboard.vendor || undefined,
        sku: scraperClipboard.sku || undefined,
        cost: scraperClipboard.price ? parseFloat(scraperClipboard.price) : undefined,
        size: scraperClipboard.size || undefined,
        finish_color: scraperClipboard.finish_color || undefined,
        finish_image: scraperClipboard.finish_image || undefined,
        image_url: scraperClipboard.image_url || undefined,
        link: scraperClipboard.link || scraperClipboard.url || undefined
      };
      
      // Remove undefined values
      Object.keys(updateData).forEach(key => updateData[key] === undefined && delete updateData[key]);
      
      console.log('📋 Pasting scraped data into item:', itemId, updateData);
      
      const response = await fetch(`${backendUrl}/api/items/${itemId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
      });
      
      if (response.ok) {
        // Clear the clipboard after successful paste
        localStorage.removeItem('extensionScrapedData');
        setScraperClipboard(null);
        setShowScraperNotification(false);
        setSelectedItemForPaste(null);
        
        alert(`✅ Pasted: ${scraperClipboard.name || 'Product data'}\n\nVendor: ${updateData.vendor || 'N/A'}\nPrice: $${updateData.cost || 'N/A'}\nFinish: ${updateData.finish_color || 'N/A'}`);
        
        if (onReload) {
          onReload();
        }
      } else {
        alert('❌ Failed to paste data. Please try again.');
      }
    } catch (error) {
      console.error('❌ Paste error:', error);
      alert(`❌ Error: ${error.message}`);
    }
  };
  
  // Clear the scraper clipboard
  const clearScraperClipboard = () => {
    localStorage.removeItem('extensionScrapedData');
    setScraperClipboard(null);
    setShowScraperNotification(false);
  };

  // Handle adding new items - FIX THE SUBCATEGORY SELECTION
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
        alert('Please expand a category first to add items to it.');
        return;
      }

      const backendUrl = (window.ENV?.REACT_APP_BACKEND_URL || window.location.origin) || window.location.origin;
      
      const newItem = {
        ...itemData,
        subcategory_id: subcategoryId,
        order_index: 0
      };

      console.log('📤 Creating item:', newItem);

      const response = await fetch(`${backendUrl}/api/items`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newItem)
      });

      if (response.ok) {
        console.log('✅ Item added successfully');
        setShowAddItem(false);
        // Use onReload prop instead of window.location.reload to prevent page jump
        if (onReload) {
          onReload();
        }
      } else {
        const errorData = await response.text();
        console.error('❌ Backend error:', errorData);
        throw new Error(`HTTP ${response.status}: ${errorData}`);
      }
    } catch (error) {
      console.error('❌ Error adding item:', error);
      alert(`Failed to add item: ${error.message}`);
    }
  };

  // Handle deleting a room
  const handleDeleteRoom = async (roomId) => {
    if (!roomId) {
      console.error('❌ No room ID provided');
      return;
    }

    if (!window.confirm('Are you sure you want to delete this room? This will delete all categories and items in this room.')) {
      return;
    }

    try {
      const backendUrl = (window.ENV?.REACT_APP_BACKEND_URL || window.location.origin) || window.location.origin;
      const response = await fetch(`${backendUrl}/api/rooms/${roomId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        console.log('✅ Room deleted successfully');
        // Force reload to show updated data
        if (onReload) {
          onReload();
        }
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (error) {
      console.error('❌ Error deleting room:', error);
    }
  };

  // Handle deleting an item - NO RELOAD
  const handleDeleteItem = async (itemId) => {
    if (!window.confirm('Are you sure you want to delete this item?')) {
      return;
    }

    try {
      const backendUrl = (window.ENV?.REACT_APP_BACKEND_URL || window.location.origin) || window.location.origin;
      const response = await fetch(`${backendUrl}/api/items/${itemId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        console.log('✅ Item deleted successfully');
        alert('Item deleted successfully!');
        // Force reload to show updated data
        if (onReload) {
          onReload();
        }
      } else {
        console.error('❌ Delete failed with status:', response.status);
        alert(`Delete failed: ${response.status}`);
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (error) {
      console.error('❌ Error deleting item:', error);
      alert(`Delete error: ${error.message}`);
      alert('Failed to delete item. Please try again.');
    }
  };

  // Handle adding a new room - SIMPLE VERSION LIKE BEFORE
  const handleAddRoom = () => {
    if (onAddRoom) {
      onAddRoom();
    }
  };

  // Handle adding a new category WITH ALL SUBCATEGORIES AND INSTALLEDS
  const handleAddCategory = async (roomId, categoryName) => {
    if (!roomId || !categoryName) {
      console.error('❌ Missing roomId or categoryName');
      return;
    }

    try {
      console.log('🔄 Creating comprehensive category:', categoryName, 'for room:', roomId);
      
      // DIRECT APPROACH: Create a new room with the category structure, then merge
      const tempRoomResponse = await fetch(`${(window.ENV?.REACT_APP_BACKEND_URL || window.location.origin) || window.location.origin}/api/rooms`, {
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
        
        // Find the matching category from the temp room
        const matchingCategory = tempRoom.categories.find(cat => 
          cat.name.toLowerCase() === categoryName.toLowerCase()
        );
        
        if (matchingCategory) {
          // Add the comprehensive category to the actual room
          const categoryData = {
            ...matchingCategory,
            room_id: roomId,
            id: undefined // Let backend generate new ID
          };
          
          const addResponse = await fetch(`${(window.ENV?.REACT_APP_BACKEND_URL || window.location.origin) || window.location.origin}/api/categories`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(categoryData)
          });
          
          if (addResponse.ok) {
            console.log('✅ Comprehensive category added successfully');
            
            // Delete the temp room
            await fetch(`${(window.ENV?.REACT_APP_BACKEND_URL || window.location.origin) || window.location.origin}/api/rooms/${tempRoom.id}`, {
              method: 'DELETE'
            });
            
            // Reload to show new category with all items
            if (onReload) {
              onReload();
            }
          }
        }
        
        // Clean up temp room regardless
        await fetch(`${(window.ENV?.REACT_APP_BACKEND_URL || window.location.origin) || window.location.origin}/api/rooms/${tempRoom.id}`, {
          method: 'DELETE'
        });
      } else {
        throw new Error('Failed to create comprehensive category structure');
      }
    } catch (error) {
      console.error('❌ Error adding comprehensive category:', error);
      alert('Failed to add category with items. Please try again.');
    }
  };

  // Drag and drop functionality removed

  // Handle drag and drop for rooms and categories
  const handleDragEnd = async (result) => {
    console.log('🎯 FFE DRAG END CALLED!', result);
    if (!result.destination) {
      console.log('❌ No destination');
      return;
    }

    const { source, destination, type } = result;

    try {
      if (type === 'room') {
        // Create deep copy of project
        const updatedProject = {...project};
        const newRooms = Array.from(updatedProject.rooms);
        const [removed] = newRooms.splice(source.index, 1);
        newRooms.splice(destination.index, 0, removed);
        
        updatedProject.rooms = newRooms;
        
        console.log('🔄 FFE: Moving room from', source.index, 'to', destination.index);
        console.log('📦 FFE: New room order:', newRooms.map(r => r.name));
        
        // Force React to re-render
        setFilteredProject(updatedProject);

        // Update backend silently
        Promise.all(newRooms.map((room, i) => 
          fetch(`${(window.ENV?.REACT_APP_BACKEND_URL || window.location.origin) || window.location.origin}/api/rooms/${room.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ order_index: i })
          })
        ));

        console.log('✅ FFE: Rooms reordered!');
      } else if (type === 'category') {
        // Create deep copy of project
        const updatedProject = {...project};
        const roomId = source.droppableId.replace('categories-', '');
        const room = updatedProject.rooms.find(r => r.id === roomId);
        if (!room) return;

        const newCategories = Array.from(room.categories);
        const [removed] = newCategories.splice(source.index, 1);
        newCategories.splice(destination.index, 0, removed);
        
        room.categories = newCategories;
        
        console.log('🔄 FFE: Moving category from', source.index, 'to', destination.index);
        
        // Force React to re-render
        setFilteredProject(updatedProject);

        // Update backend silently
        Promise.all(newCategories.map((category, i) => 
          fetch(`${(window.ENV?.REACT_APP_BACKEND_URL || window.location.origin) || window.location.origin}/api/categories/${category.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ order_index: i })
          })
        ));

        console.log('✅ FFE: Categories reordered!');
      }
    } catch (error) {
      console.error('❌ Drag error:', error);
    }
  };

  // Toggle room expansion
  const toggleRoomExpansion = (roomId) => {
    setExpandedRooms(prev => {
      const newState = {
        ...prev,
        [roomId]: !prev[roomId]
      };
      localStorage.setItem('ffe_expandedRooms', JSON.stringify(newState));
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
      localStorage.setItem('ffe_expandedCategories', JSON.stringify(newState));
      return newState;
    });
  };

  // Handle tracking items
  const handleTrackItem = async (item) => {
    if (!item.tracking_number) {
      console.error('❌ No tracking number available');
      return;
    }

    try {
      const backendUrl = (window.ENV?.REACT_APP_BACKEND_URL || window.location.origin) || window.location.origin;
      const response = await fetch(`${backendUrl}/api/track-shipment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tracking_number: item.tracking_number,
          carrier: item.carrier || 'auto-detect'
        })
      });

      if (response.ok) {
        const trackingData = await response.json();
        console.log('✅ Tracking data retrieved');
      } else {
        console.error('❌ Failed to get tracking information');
      }
    } catch (error) {
      console.error('❌ Tracking error:', error);
    }
  };

  const getMainHeaderColor = () => '#8B4444';  // Dark red for main headers
  const getAdditionalInfoColor = () => '#8B4444';  // Brown for ADDITIONAL INFO.
  const getShippingInfoColor = () => '#6B21A8';  // Purple for SHIPPING INFO.
  const getNotesActionsColor = () => '#8B4444';  // Red for NOTES and ACTIONS

  // Get carrier color to match header colors
  const getCarrierColor = (carrier) => {
    const colors = {
      'FedEx': '#FF6600',           // FedEx Orange
      'FedEx Ground': '#FF6600',    // FedEx Orange
      'FedEx Express': '#FF6600',   // FedEx Orange
      'UPS': '#8B4513',            // UPS Brown
      'UPS Ground': '#8B4513',     // UPS Brown
      'UPS Express': '#8B4513',    // UPS Brown
      'USPS': '#004B87',           // USPS Blue
      'DHL': '#FFD700',            // DHL Yellow
      'Brooks': '#4682B4',         // Steel Blue
      'Zenith': '#20B2AA',         // Light Sea Green
      'Sunbelt': '#FF4500',        // Orange Red
      'R+L Carriers': '#32CD32',   // Lime Green
      'Yellow Freight': '#FFD700', // Yellow
      'XPO Logistics': '#6A5ACD',  // Slate Blue
      'Old Dominion': '#DC143C',   // Crimson
      'ABF Freight': '#FF6347',    // Tomato
      'Con-Way': '#48D1CC',        // Medium Turquoise
      'Estes Express': '#9370DB',  // Medium Purple
      'YRC Freight': '#FF1493',    // Deep Pink
      'Saia': '#00CED1',           // Dark Turquoise
      'OTHER': '#808080'           // Gray
    };
    return colors[carrier] || '#6B7280';
  };

  const getShipToColor = (shipTo) => {
    const shipToColors = {
      'CLIENT HOME': '#4169E1',
      'JOB SITE': '#228B22',
      'DESIGN CENTER': '#FF8C00',
      'WAREHOUSE': '#8B4513',
      'VENDOR LOCATION': '#9370DB'
    };
    return shipToColors[shipTo] || '#FEF08A';
  };

  const getStockStatusColor = (stockStatus) => {
    const stockColors = {
      'IN STOCK': '#10B981',        // Green
      'LOW STOCK': '#F59E0B',       // Orange
      'OUT OF STOCK': '#EF4444',    // Red
      'BACKORDERED': '#DC2626',     // Dark Red
      'DISCONTINUED': '#991B1B'     // Very Dark Red
    };
    return stockColors[stockStatus] || 'transparent';
  };

  const getDeliveryStatusColor = (status) => {
    const deliveryColors = {
      'PENDING': '#FEF08A',
      'SCHEDULED': '#BEF264',
      'PROCESSING': '#FDE047',
      'IN TRANSIT': '#FACC15',
      'OUT FOR DELIVERY': '#A3E635',
      'ATTEMPTED DELIVERY': '#F87171',
      'DELIVERED': '#4ADE80',
      'DELIVERED TO RECEIVER': '#22C55E',
      'AVAILABLE FOR PICKUP': '#16A34A',
      'DELAYED': '#EF4444',
      'EXCEPTION': '#DC2626',
      'DAMAGED': '#B91C1C',
      'LOST': '#991B1B',
      'RETURNED TO SENDER': '#8B4444'
    };
    return deliveryColors[status] || '#FEF08A';
  };

  if (!project || !project.rooms || project.rooms.length === 0) {
    return (
      <div className="text-center text-gray-400 py-8">
        <p className="text-lg">Loading FF&E data...</p>
        <p className="text-sm mt-2">Please wait while we load your project information.</p>
      </div>
    );
  }

  return (
    <div className="w-full" style={{ backgroundColor: '#0F172A' }}>
      
      {/* SEARCH AND FILTER SECTION - EXACTLY LIKE YOUR SCREENSHOT */}
      <div className="mb-6 p-4" style={{ backgroundColor: '#1E293B' }}>
        <div className="flex flex-col lg:flex-row gap-4 items-center">
          {/* Search Input */}
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search Items, Vendors, SKUs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-[#B49B7E] text-white focus:outline-none placeholder-[#D4C5A9]/70"
              style={{
                background: 'linear-gradient(135deg, rgba(0,0,0,0.95) 0%, rgba(20,20,30,0.9) 50%, rgba(0,0,0,0.95) 100%)',
                boxShadow: '0 0 20px rgba(212, 165, 116, 0.3), inset 0 0 30px rgba(212, 165, 116, 0.08)'
              }}
            />
          </div>
          
          {/* Filter Dropdowns */}
          <div className="flex gap-3 flex-wrap">
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
              {project.rooms.map(room => (
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
              {availableCategories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
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
              <option value="Visual Comfort">Visual Comfort</option>
              <option value="Four Hands">Four Hands</option>
              <option value="West Elm">West Elm</option>
              <option value="Pottery Barn">Pottery Barn</option>
              <option value="Williams Sonoma">Williams Sonoma</option>
              <option value="Crate & Barrel">Crate & Barrel</option>
              <option value="CB2">CB2</option>
              <option value="Restoration Hardware">Restoration Hardware</option>
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
              <option value="TO BE SELECTED">TO BE SELECTED</option>
              <option value="RESEARCHING">RESEARCHING</option>
              <option value="PENDING APPROVAL">PENDING APPROVAL</option>
              <option value="APPROVED">APPROVED</option>
              <option value="ORDERED">ORDERED</option>
              <option value="PICKED">PICKED</option>
              <option value="CONFIRMED">CONFIRMED</option>
              <option value="IN PRODUCTION">IN PRODUCTION</option>
              <option value="SHIPPED">SHIPPED</option>
              <option value="IN TRANSIT">IN TRANSIT</option>
              <option value="OUT FOR DELIVERY">OUT FOR DELIVERY</option>
              <option value="DELIVERED TO RECEIVER">DELIVERED TO RECEIVER</option>
              <option value="DELIVERED TO JOB SITE">DELIVERED TO JOB SITE</option>
              <option value="RECEIVED">RECEIVED</option>
              <option value="READY FOR INSTALL">READY FOR INSTALL</option>
              <option value="INSTALLING">INSTALLING</option>
              <option value="INSTALLED">INSTALLED</option>
              <option value="ON HOLD">ON HOLD</option>
              <option value="BACKORDERED">BACKORDERED</option>
              <option value="DAMAGED">DAMAGED</option>
              <option value="RETURNED">RETURNED</option>
              <option value="CANCELLED">CANCELLED</option>
            </select>
            
            <select 
              value={selectedCarrier}
              onChange={(e) => setSelectedCarrier(e.target.value)}
              className="px-3 py-2 rounded-lg border border-[#B49B7E] text-[#D4C5A9] focus:outline-none"
              style={{
                background: 'linear-gradient(135deg, rgba(0,0,0,0.95) 0%, rgba(20,20,30,0.9) 50%, rgba(0,0,0,0.95) 100%)',
                boxShadow: '0 0 15px rgba(212, 165, 116, 0.2), inset 0 0 25px rgba(212, 165, 116, 0.06)'
              }}
            >
              <option value="">All Carriers</option>
              <option value="FedEx" style={{ backgroundColor: '#FF6600', color: 'white' }}>FedEx</option>
              <option value="UPS" style={{ backgroundColor: '#8B4513', color: 'white' }}>UPS</option>
              <option value="USPS" style={{ backgroundColor: '#004B87', color: 'white' }}>USPS</option>
              <option value="DHL" style={{ backgroundColor: '#FFD700', color: 'black' }}>DHL</option>
              <option value="Brooks" style={{ backgroundColor: '#4682B4', color: 'white' }}>Brooks</option>
              <option value="Zenith" style={{ backgroundColor: '#20B2AA', color: 'white' }}>Zenith</option>
              <option value="Sunbelt" style={{ backgroundColor: '#FF4500', color: 'white' }}>Sunbelt</option>
              <option value="R+L Carriers" style={{ backgroundColor: '#32CD32', color: 'white' }}>R+L Carriers</option>
            </select>
            
            {/* Filter and Clear Buttons */}
            <button 
              onClick={() => {
                console.log('🔍 FILTER APPLIED - Search:', searchTerm, 'Room:', selectedRoom, 'Category:', selectedCategory, 'Vendor:', selectedVendor, 'Status:', selectedStatus, 'Carrier:', selectedCarrier);
                // Filters are applied automatically via useEffect
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
                setSelectedCarrier('');
                console.log('🧹 FILTER CLEARED');
              }}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded font-medium"
            >
              CLEAR
            </button>
          </div>
          
          {/* Add Room Button - GOLD/AMBER COLOR */}
          <button 
            onClick={handleAddRoom}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded font-medium"
          >
            ✚ ADD ROOM
          </button>
        </div>
      </div>

      {/* ✅ SCRAPER CLIPBOARD NOTIFICATION - Shows when data is ready to paste */}
      {scraperClipboard && showScraperNotification && (
        <div className="mx-4 mb-4 p-4 rounded-lg border-2 border-green-500 animate-pulse" 
             style={{ 
               background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.2) 0%, rgba(22, 101, 52, 0.3) 100%)',
               boxShadow: '0 0 20px rgba(34, 197, 94, 0.3)'
             }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="text-3xl">📋</div>
              <div>
                <div className="text-green-400 font-bold text-lg">SCRAPED DATA READY TO PASTE!</div>
                <div className="text-white text-sm">
                  <span className="font-semibold">{scraperClipboard.name}</span>
                  {scraperClipboard.vendor && <span className="text-gray-300"> • {scraperClipboard.vendor}</span>}
                  {scraperClipboard.price && <span className="text-green-400"> • ${scraperClipboard.price}</span>}
                  {scraperClipboard.finish_color && <span className="text-amber-400"> • {scraperClipboard.finish_color}</span>}
                </div>
                <div className="text-gray-400 text-xs mt-1">👆 Click the <span className="text-green-400 font-bold">📋 PASTE</span> button on any item row to apply this data</div>
              </div>
            </div>
            <button 
              onClick={clearScraperClipboard}
              className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-sm"
            >
              ✕ Clear
            </button>
          </div>
        </div>
      )}

      {/* ORIGINAL TABLE STRUCTURE - DO NOT CHANGE */}
      <div className="w-full overflow-x-auto" style={{ backgroundColor: '#0F172A', touchAction: 'pan-x' }}>
        <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch', minWidth: '1200px' }}>
          
          <div className="w-full" style={{ touchAction: 'pan-x pan-y' }}>
            <table className="w-full border-collapse border border-[#B49B7E]">
                  
                  <thead>
                    {/* EMPTY HEADER FOR STRUCTURE */}
                  </thead>

                  {/* TABLE BODY WITH SMOOTH DRAG AND DROP */}
                  <DragDropContext onDragEnd={handleDragEnd}>
                  <Droppable droppableId="ffe-rooms" type="room">
                    {(provided) => (
                      <tbody ref={provided.innerRef} {...provided.droppableProps}>
                {/* USE FILTERED PROJECT DATA */}
                {(filteredProject || project).rooms.map((room, roomIndex) => {
                  const isRoomExpanded = expandedRooms[room.id];
                  console.log(`🏠 RENDERING ROOM ${roomIndex}: ${room.name} with ${room.categories?.length || 0} categories`);
                  
                  return (
                    <Draggable key={room.id} draggableId={room.id} index={roomIndex}>
                      {(provided, snapshot) => (
                        <>
                          <tr
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            style={{
                              ...provided.draggableProps.style,
                              display: snapshot.isDragging ? 'table' : '',
                              backgroundColor: snapshot.isDragging ? 'rgba(212, 165, 116, 0.3)' : ''
                            }}
                          >
                            <td colSpan="12" 
                                className="border border-[#B49B7E] px-3 py-2 text-white text-sm font-bold"
                                style={{ 
                                  background: `linear-gradient(135deg, ${getRoomColor(room.name)}FF 0%, ${getRoomColor(room.name)}AA 20%, ${getRoomColor(room.name)} 40%, ${getRoomColor(room.name)}AA 80%, ${getRoomColor(room.name)}FF 100%)`,
                                  boxShadow: `0 0 35px ${getRoomColor(room.name)}80, inset 0 0 70px rgba(255, 255, 255, 0.16), inset 0 0 110px rgba(0, 0, 0, 0.5)`,
                                  textShadow: '0 2px 8px rgba(0, 0, 0, 0.8), 0 0 20px rgba(255, 255, 255, 0.4)'
                                }}>
                              <div className="flex justify-between items-center">
                                <div className="flex items-center gap-2">
                                  <div className="cursor-move text-white hover:text-gray-200 px-2">
                                    ⋮⋮
                                  </div>
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
                                        className="text-red-300 hover:text-red-100 text-lg ml-2"
                                        title="Delete Room"
                                      >
                                        🗑️
                                      </button>
                                    </div>
                                  </td>
                                  <td className="border border-[#B49B7E] px-2 py-2 text-center rounded-lg text-[#D4C5A9]"
                                      style={{ 
                                        background: 'linear-gradient(135deg, rgba(0,0,0,0.95) 0%, rgba(30,30,30,0.9) 50%, rgba(0,0,0,0.95) 100%)',
                                        borderTop: `4px solid ${getRoomColor(room.name)}`,
                                        boxShadow: `0 0 15px ${getRoomColor(room.name)}40, inset 0 0 30px rgba(212, 165, 116, 0.04)`
                                      }}>
                                    <button
                                      onClick={() => handleAddRoom()}
                                      className="text-green-300 hover:text-green-100 text-sm font-bold"
                                      title="Add Room"
                                    >
                                      +
                                    </button>
                                  </td>
                                </tr>

                                {/* ROOM PHOTOS SECTION */}
                                {isRoomExpanded && roomPhotos[room.id]?.length > 0 && (
                                  <tr>
                                    <td colSpan="14" className="p-0">
                                      <div className="rounded-lg border border-[#D4A574]/30 overflow-hidden mx-2 my-2" 
                                           style={{ background: 'linear-gradient(135deg, rgba(20,20,30,0.95) 0%, rgba(30,30,40,0.9) 100%)' }}>
                                        <div 
                                          className="px-4 py-2 cursor-pointer flex items-center justify-between"
                                          style={{ 
                                            background: 'linear-gradient(135deg, rgba(212, 165, 116, 0.2) 0%, rgba(180, 155, 126, 0.15) 100%)',
                                            borderBottom: expandedPhotoRooms[room.id] ? '1px solid rgba(212, 165, 116, 0.3)' : 'none'
                                          }}
                                          onClick={() => togglePhotoFolder(room.id)}
                                        >
                                          <div className="flex items-center gap-3">
                                            <span className="text-xl">📁</span>
                                            <span className="text-[#D4A574] font-semibold text-sm">
                                              ROOM PHOTOS ({roomPhotos[room.id]?.length || 0})
                                            </span>
                                          </div>
                                          <span className="text-[#B49B7E]">
                                            {expandedPhotoRooms[room.id] ? '▼' : '▶'}
                                          </span>
                                        </div>
                                        
                                        {expandedPhotoRooms[room.id] && (
                                          <div className="p-4">
                                            <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
                                              {roomPhotos[room.id]?.map((photo, idx) => (
                                                <div 
                                                  key={photo.id || idx} 
                                                  className="relative group cursor-pointer rounded-lg overflow-hidden border border-[#B49B7E]/30 hover:border-[#D4A574] transition-all hover:scale-105"
                                                  style={{ aspectRatio: '1/1' }}
                                                  onClick={() => setSelectedPhotoView(photo)}
                                                >
                                                  <img 
                                                    src={photo.photo_data || photo.url || photo.image_url} 
                                                    alt={photo.file_name || `Photo ${idx + 1}`}
                                                    className="w-full h-full object-cover"
                                                    loading="lazy"
                                                  />
                                                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                    <span className="text-white text-2xl">🔍</span>
                                                  </div>
                                                </div>
                                              ))}
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    </td>
                                  </tr>
                                )}

                                {/* ROOM CATEGORIES WITH SMOOTH DRAG DROP */}
                                {isRoomExpanded && (
                                  <Droppable droppableId={`categories-${room.id}`} type="category">
                                    {(provided) => (
                                      <>
                                        <tr ref={provided.innerRef} {...provided.droppableProps} style={{ display: 'none' }}>
                                          <td></td>
                                        </tr>
                                        {room.categories?.map((category, catIndex) => {
                                          const isCategoryExpanded = expandedCategories[category.id];
                                          console.log(`📁 RENDERING CATEGORY ${catIndex}: ${category.name} with ${category.subcategories?.length || 0} subcategories`);
                                          
                                          return (
                                            <Draggable key={category.id} draggableId={category.id} index={catIndex}>
                                              {(provided, snapshot) => (
                                                <>
                                                  {/* CATEGORY HEADER ROW */}
                                                  <tr
                                                    ref={provided.innerRef}
                                                    {...provided.draggableProps}
                                                    {...provided.dragHandleProps}
                                                    style={{
                                                      ...provided.draggableProps.style,
                                                      display: snapshot.isDragging ? 'table' : '',
                                                      backgroundColor: snapshot.isDragging ? 'rgba(212, 165, 116, 0.3)' : ''
                                                    }}
                                                  >
                                                    <td colSpan="14" 
                                                        className="border border-[#B49B7E] px-4 py-2 text-white text-sm font-bold"
                                                        style={{ 
                                                          background: `linear-gradient(135deg, ${getCategoryColor()} 0%, ${getCategoryColor()}DD 50%, ${getCategoryColor()} 100%)`,
                                                          boxShadow: `0 0 22px ${getCategoryColor()}55, inset 0 0 45px rgba(255, 255, 255, 0.12), inset 0 0 85px rgba(0, 0, 0, 0.4)`,
                                                          textShadow: '0 2px 4px rgba(0, 0, 0, 0.7), 0 0 14px rgba(255, 255, 255, 0.3)'
                                                        }}>
                                                      <div className="flex items-center gap-2">
                                                        <div className="cursor-move text-white hover:text-gray-200 px-1">
                                                          ⋮⋮
                                                        </div>
                                                        <button
                                                          onClick={() => toggleCategoryExpansion(category.id)}
                                                          className="text-white hover:text-gray-200"
                                                        >
                                                          {isCategoryExpanded ? '▼' : '▶'}
                                                        </button>
                                                        <span>{category.name.toUpperCase()}</span>
                                                      </div>
                                                    </td>
                                                  </tr>

                                                  {/* SUBCATEGORIES - Only show when category expanded */}
                                                  {isCategoryExpanded && (
                                                    <React.Fragment>
                                                      {/* SECTION HEADER - GROUPS COLUMNS */}
                                                      <tr>
                                                        <td colSpan="4" className="border-gray-400 px-2 py-1 text-xs font-bold text-white text-center" 
                                                            style={{ backgroundColor: '#8B4444', borderLeft: '1px solid #9CA3AF', borderRight: 'none', borderTop: '1px solid #9CA3AF', borderBottom: '1px solid #9CA3AF' }}>
                                                        </td>
                                                        <td colSpan="3" className="border border-[#B49B7E] px-2 py-1 text-xs font-bold text-white text-center rounded" 
                                                            style={{ 
                                                              background: 'linear-gradient(135deg, #8B4513FF 0%, #8B4513AA 20%, #8B4513 40%, #8B4513AA 80%, #8B4513FF 100%)',
                                                              boxShadow: '0 0 25px #8B451360, inset 0 0 50px rgba(255, 255, 255, 0.14), inset 0 0 80px rgba(0, 0, 0, 0.45)',
                                                              textShadow: '0 2px 6px rgba(0, 0, 0, 0.75), 0 0 16px rgba(255, 255, 255, 0.35)'
                                                            }}>
                                                          ADDITIONAL INFO.
                                                        </td>
                                                        <td colSpan="2" className="border border-[#D4A574] px-2 py-1 text-xs font-bold text-white text-center rounded" 
                                                            style={{ 
                                                              background: 'linear-gradient(135deg, #D4A574FF 0%, #D4A574AA 20%, #D4A574 40%, #D4A574AA 80%, #D4A574FF 100%)',
                                                              boxShadow: '0 0 25px #D4A57460, inset 0 0 50px rgba(255, 255, 255, 0.14), inset 0 0 80px rgba(0, 0, 0, 0.45)',
                                                              textShadow: '0 2px 6px rgba(0, 0, 0, 0.75), 0 0 16px rgba(255, 255, 255, 0.35)'
                                                            }}>
                                                          STOCK INFO.
                                                        </td>
                                                        <td colSpan="6" className="border border-[#B49B7E] px-2 py-1 text-xs font-bold text-white text-center rounded" 
                                                            style={{ 
                                                              background: 'linear-gradient(135deg, #6B46C1FF 0%, #6B46C1AA 20%, #6B46C1 40%, #6B46C1AA 80%, #6B46C1FF 100%)',
                                                              boxShadow: '0 0 25px #6B46C160, inset 0 0 50px rgba(255, 255, 255, 0.14), inset 0 0 80px rgba(0, 0, 0, 0.45)',
                                                              textShadow: '0 2px 6px rgba(0, 0, 0, 0.75), 0 0 16px rgba(255, 255, 255, 0.35)'
                                                            }}>
                                                          SHIPPING INFO.
                                                        </td>
                                                        <td colSpan="2" className="border-gray-400 px-2 py-1 text-xs font-bold text-white text-center" 
                                                            style={{ backgroundColor: '#8B4444', borderRight: '1px solid #9CA3AF', borderLeft: 'none', borderTop: '1px solid #9CA3AF', borderBottom: '1px solid #9CA3AF' }}>
                                                        </td>
                                                      </tr>
                                                      
                                                      {/* MAIN RED HEADER ROW - PERFECTLY ALIGNED WITH DATA COLUMNS */}
                                                      <tr>
                                                        <td className="border border-[#B49B7E] px-3 py-2 text-xs font-bold text-white" style={{ 
                                    background: 'linear-gradient(135deg, #8B4444FF 0%, #8B4444AA 20%, #8B4444 40%, #8B4444AA 80%, #8B4444FF 100%)',
                                    boxShadow: '0 0 20px #8B444450, inset 0 0 40px rgba(255, 255, 255, 0.12), inset 0 0 70px rgba(0, 0, 0, 0.4)',
                                    textShadow: '0 2px 4px rgba(0, 0, 0, 0.7), 0 0 12px rgba(255, 255, 255, 0.3)'
                                  }}>INSTALLED</td>
                                                        <td className="border border-[#B49B7E] px-3 py-2 text-xs font-bold text-white" style={{ 
                                    background: 'linear-gradient(135deg, #8B4444FF 0%, #8B4444AA 20%, #8B4444 40%, #8B4444AA 80%, #8B4444FF 100%)',
                                    boxShadow: '0 0 20px #8B444450, inset 0 0 40px rgba(255, 255, 255, 0.12), inset 0 0 70px rgba(0, 0, 0, 0.4)',
                                    textShadow: '0 2px 4px rgba(0, 0, 0, 0.7), 0 0 12px rgba(255, 255, 255, 0.3)'
                                  }}>VENDOR/SKU</td>
                                                        <td className="border border-[#B49B7E] px-3 py-2 text-xs font-bold text-white" style={{ 
                                    background: 'linear-gradient(135deg, #8B4444FF 0%, #8B4444AA 20%, #8B4444 40%, #8B4444AA 80%, #8B4444FF 100%)',
                                    boxShadow: '0 0 20px #8B444450, inset 0 0 40px rgba(255, 255, 255, 0.12), inset 0 0 70px rgba(0, 0, 0, 0.4)',
                                    textShadow: '0 2px 4px rgba(0, 0, 0, 0.7), 0 0 12px rgba(255, 255, 255, 0.3)'
                                  }}>QTY</td>
                                                        <td className="border border-[#B49B7E] px-3 py-2 text-xs font-bold text-white" style={{ 
                                    background: 'linear-gradient(135deg, #8B4444FF 0%, #8B4444AA 20%, #8B4444 40%, #8B4444AA 80%, #8B4444FF 100%)',
                                    boxShadow: '0 0 20px #8B444450, inset 0 0 40px rgba(255, 255, 255, 0.12), inset 0 0 70px rgba(0, 0, 0, 0.4)',
                                    textShadow: '0 2px 4px rgba(0, 0, 0, 0.7), 0 0 12px rgba(255, 255, 255, 0.3)'
                                  }}>SIZE</td>
                                                        <td className="border border-[#B49B7E] px-3 py-2 text-xs font-bold text-white" style={{ 
                                    background: 'linear-gradient(135deg, #8B4513FF 0%, #8B4513AA 20%, #8B4513 40%, #8B4513AA 80%, #8B4513FF 100%)',
                                    boxShadow: '0 0 20px #8B451350, inset 0 0 40px rgba(255, 255, 255, 0.12), inset 0 0 70px rgba(0, 0, 0, 0.4)',
                                    textShadow: '0 2px 4px rgba(0, 0, 0, 0.7), 0 0 12px rgba(255, 255, 255, 0.3)'
                                  }}>FINISH/COLOR</td>
                                                        <td className="border border-[#B49B7E] px-3 py-2 text-xs font-bold text-white" style={{ 
                                    background: 'linear-gradient(135deg, #8B4513FF 0%, #8B4513AA 20%, #8B4513 40%, #8B4513AA 80%, #8B4513FF 100%)',
                                    boxShadow: '0 0 20px #8B451350, inset 0 0 40px rgba(255, 255, 255, 0.12), inset 0 0 70px rgba(0, 0, 0, 0.4)',
                                    textShadow: '0 2px 4px rgba(0, 0, 0, 0.7), 0 0 12px rgba(255, 255, 255, 0.3)'
                                  }}>COST/PRICE</td>
                                                        <td className="border border-[#B49B7E] px-3 py-2 text-xs font-bold text-white" style={{ 
                                    background: 'linear-gradient(135deg, #8B4513FF 0%, #8B4513AA 20%, #8B4513 40%, #8B4513AA 80%, #8B4513FF 100%)',
                                    boxShadow: '0 0 20px #8B451350, inset 0 0 40px rgba(255, 255, 255, 0.12), inset 0 0 70px rgba(0, 0, 0, 0.4)',
                                    textShadow: '0 2px 4px rgba(0, 0, 0, 0.7), 0 0 12px rgba(255, 255, 255, 0.3)'
                                  }}>IMAGE</td>
                                                        <td className="border border-[#D4A574] px-3 py-2 text-xs font-bold text-white" style={{ 
                                    background: 'linear-gradient(135deg, #D4A574FF 0%, #D4A574AA 20%, #D4A574 40%, #D4A574AA 80%, #D4A574FF 100%)',
                                    boxShadow: '0 0 20px #D4A57450, inset 0 0 40px rgba(255, 255, 255, 0.12), inset 0 0 70px rgba(0, 0, 0, 0.4)',
                                    textShadow: '0 2px 4px rgba(0, 0, 0, 0.7), 0 0 12px rgba(255, 255, 255, 0.3)'
                                  }}>STOCK STATUS/QTY</td>
                                                        <td className="border border-[#D4A574] px-3 py-2 text-xs font-bold text-white" style={{ 
                                    background: 'linear-gradient(135deg, #D4A574FF 0%, #D4A574AA 20%, #D4A574 40%, #D4A574AA 80%, #D4A574FF 100%)',
                                    boxShadow: '0 0 20px #D4A57450, inset 0 0 40px rgba(255, 255, 255, 0.12), inset 0 0 70px rgba(0, 0, 0, 0.4)',
                                    textShadow: '0 2px 4px rgba(0, 0, 0, 0.7), 0 0 12px rgba(255, 255, 255, 0.3)'
                                  }}>RESTOCK/LEAD TIME</td>
                                                        <td className="border border-[#B49B7E] px-3 py-2 text-xs font-bold text-white" style={{ 
                                    background: 'linear-gradient(135deg, #6B46C1FF 0%, #6B46C1AA 20%, #6B46C1 40%, #6B46C1AA 80%, #6B46C1FF 100%)',
                                    boxShadow: '0 0 20px #6B46C150, inset 0 0 40px rgba(255, 255, 255, 0.12), inset 0 0 70px rgba(0, 0, 0, 0.4)',
                                    textShadow: '0 2px 4px rgba(0, 0, 0, 0.7), 0 0 12px rgba(255, 255, 255, 0.3)'
                                  }}>ORDER DATE</td>
                                                        <td className="border border-[#B49B7E] px-3 py-2 text-xs font-bold text-white" style={{ 
                                    background: 'linear-gradient(135deg, #6B46C1FF 0%, #6B46C1AA 20%, #6B46C1 40%, #6B46C1AA 80%, #6B46C1FF 100%)',
                                    boxShadow: '0 0 20px #6B46C150, inset 0 0 40px rgba(255, 255, 255, 0.12), inset 0 0 70px rgba(0, 0, 0, 0.4)',
                                    textShadow: '0 2px 4px rgba(0, 0, 0, 0.7), 0 0 12px rgba(255, 255, 255, 0.3)'
                                  }}>STATUS/ORDER#</td>
                                                        <td className="border border-[#B49B7E] px-3 py-2 text-xs font-bold text-white" style={{ 
                                    background: 'linear-gradient(135deg, #6B46C1FF 0%, #6B46C1AA 20%, #6B46C1 40%, #6B46C1AA 80%, #6B46C1FF 100%)',
                                    boxShadow: '0 0 20px #6B46C150, inset 0 0 40px rgba(255, 255, 255, 0.12), inset 0 0 70px rgba(0, 0, 0, 0.4)',
                                    textShadow: '0 2px 4px rgba(0, 0, 0, 0.7), 0 0 12px rgba(255, 255, 255, 0.3)'
                                  }}>EST. DATES</td>
                                                        <td className="border border-[#B49B7E] px-3 py-2 text-xs font-bold text-white" style={{ 
                                    background: 'linear-gradient(135deg, #6B46C1FF 0%, #6B46C1AA 20%, #6B46C1 40%, #6B46C1AA 80%, #6B46C1FF 100%)',
                                    boxShadow: '0 0 20px #6B46C150, inset 0 0 40px rgba(255, 255, 255, 0.12), inset 0 0 70px rgba(0, 0, 0, 0.4)',
                                    textShadow: '0 2px 4px rgba(0, 0, 0, 0.7), 0 0 12px rgba(255, 255, 255, 0.3)'
                                  }}>INSTALL/SHIP TO</td>
                                                        <td className="border border-[#B49B7E] px-3 py-2 text-xs font-bold text-white" style={{ 
                                    background: 'linear-gradient(135deg, #6B46C1FF 0%, #6B46C1AA 20%, #6B46C1 40%, #6B46C1AA 80%, #6B46C1FF 100%)',
                                    boxShadow: '0 0 20px #6B46C150, inset 0 0 40px rgba(255, 255, 255, 0.12), inset 0 0 70px rgba(0, 0, 0, 0.4)',
                                    textShadow: '0 2px 4px rgba(0, 0, 0, 0.7), 0 0 12px rgba(255, 255, 255, 0.3)'
                                  }}>TRACKING/CARRIER</td>
                                                        <td className="border border-[#B49B7E] px-3 py-2 text-xs font-bold text-white" style={{ 
                                    background: 'linear-gradient(135deg, #6B46C1FF 0%, #6B46C1AA 20%, #6B46C1 40%, #6B46C1AA 80%, #6B46C1FF 100%)',
                                    boxShadow: '0 0 20px #6B46C150, inset 0 0 40px rgba(255, 255, 255, 0.12), inset 0 0 70px rgba(0, 0, 0, 0.4)',
                                    textShadow: '0 2px 4px rgba(0, 0, 0, 0.7), 0 0 12px rgba(255, 255, 255, 0.3)'
                                  }}>NOTES</td>
                                                        <td className="border border-[#B49B7E] px-3 py-2 text-xs font-bold text-white" style={{ 
                                    background: 'linear-gradient(135deg, #8B4444FF 0%, #8B4444AA 20%, #8B4444 40%, #8B4444AA 80%, #8B4444FF 100%)',
                                    boxShadow: '0 0 20px #8B444450, inset 0 0 40px rgba(255, 255, 255, 0.12), inset 0 0 70px rgba(0, 0, 0, 0.4)',
                                    textShadow: '0 2px 4px rgba(0, 0, 0, 0.7), 0 0 12px rgba(255, 255, 255, 0.3)'
                                  }}>LINK</td>
                                                        <td className="border border-[#B49B7E] px-3 py-2 text-xs font-bold text-white" style={{ 
                                    background: 'linear-gradient(135deg, #8B4444FF 0%, #8B4444AA 20%, #8B4444 40%, #8B4444AA 80%, #8B4444FF 100%)',
                                    boxShadow: '0 0 20px #8B444450, inset 0 0 40px rgba(255, 255, 255, 0.12), inset 0 0 70px rgba(0, 0, 0, 0.4)',
                                    textShadow: '0 2px 4px rgba(0, 0, 0, 0.7), 0 0 12px rgba(255, 255, 255, 0.3)'
                                  }}>DELETE</td>
                                                      </tr>
                                                      
                                                      {/* INSTALLEDS GO DIRECTLY UNDER RED HEADER */}
                                                      {/* ACTUAL INSTALLEDS FROM BACKEND DATA */}
                                                      {category.subcategories?.map((subcategory) => (
                                                        subcategory.items?.map((item, itemIndex) => (
                                                        <tr key={item.id} style={{ 
                                                          background: itemIndex % 2 === 0 
                                                            ? 'linear-gradient(135deg, rgba(0, 0, 0, 0.95) 0%, rgba(30, 30, 30, 0.9) 30%, rgba(15, 15, 25, 0.95) 70%, rgba(0, 0, 0, 0.95) 100%)'
                                                            : 'linear-gradient(135deg, rgba(15, 15, 25, 0.95) 0%, rgba(45, 45, 55, 0.9) 30%, rgba(25, 25, 35, 0.95) 70%, rgba(15, 15, 25, 0.95) 100%)'
                                                        }}>
                                                          {/* INSTALLED - INSTALLED NAME GOES HERE */}
                                                          <td className="border border-[#B49B7E] px-2 py-2 text-sm text-[#B49B7E]">
                                                            {item.name}
                                                          </td>
                                                          
                                                          {/* VENDOR/SKU - EDITABLE INLINE */}
                                                          <td className="border border-[#B49B7E] px-2 py-2 text-sm text-[#B49B7E]">
                                                            <div 
                                                              contentEditable={true}
                                                              suppressContentEditableWarning={true}
                                                              className="w-full bg-transparent text-white text-sm outline-none"
                                                              onBlur={(e) => console.log('Vendor updated:', e.target.textContent)}
                                                            >
                                                              {item.vendor || ''}
                                                            </div>
                                                          </td>
                                                          
                                                          {/* QTY - EDITABLE INLINE */}
                                                          <td className="border border-[#B49B7E] px-2 py-2 text-sm text-center text-white">
                                                            <div 
                                                              contentEditable={true}
                                                              suppressContentEditableWarning={true}
                                                              className="w-full bg-transparent text-white text-sm text-center outline-none"
                                                              onBlur={(e) => console.log('Quantity updated:', e.target.textContent)}
                                                            >
                                                              {item.quantity || ''}
                                                            </div>
                                                          </td>
                                                          
                                                          {/* SIZE - EDITABLE INLINE */}
                                                          <td className="border border-[#B49B7E] px-2 py-2 text-sm text-[#B49B7E]">
                                                            <div 
                                                              contentEditable={true}
                                                              suppressContentEditableWarning={true}
                                                              className="w-full bg-transparent text-white text-sm outline-none"
                                                              onBlur={(e) => console.log('Size updated:', e.target.textContent)}
                                                            >
                                                              {item.size || ''}
                                                            </div>
                                                          </td>
                                                          
                                                          {/* FINISH/Color with Swatch Image - EDITABLE INLINE */}
                                                          <td className="border border-[#B49B7E] px-2 py-2 text-sm text-[#B49B7E]">
                                                            <div className="flex items-center gap-2">
                                                              {/* Finish Swatch Image */}
                                                              {item.finish_image && (
                                                                <img 
                                                                  src={item.finish_image} 
                                                                  alt={item.finish_color || 'Finish'} 
                                                                  className="w-8 h-8 object-cover rounded border border-[#B49B7E] cursor-pointer hover:scale-110 transition-transform" 
                                                                  onClick={() => setExpandedImage(item.finish_image)}
                                                                  title={`Click to view ${item.finish_color || 'finish'} swatch`}
                                                                />
                                                              )}
                                                              <div 
                                                                contentEditable={true}
                                                                suppressContentEditableWarning={true}
                                                                className="flex-1 bg-transparent text-white text-sm outline-none"
                                                                onBlur={(e) => console.log('Finish/Color updated:', e.target.textContent)}
                                                              >
                                                                {item.finish_color || ''}
                                                              </div>
                                                            </div>
                                                          </td>
                                                          
                                                          {/* Cost/Price - EDITABLE INLINE */}
                                                          <td className="border border-[#B49B7E] px-2 py-2 text-sm text-[#B49B7E]">
                                                            <div 
                                                              contentEditable={true}
                                                              suppressContentEditableWarning={true}
                                                              className="w-full bg-transparent text-white text-sm outline-none"
                                                              onBlur={(e) => console.log('Cost updated:', e.target.textContent)}
                                                            >
                                                              {item.cost ? `$${item.cost}` : ''}
                                                            </div>
                                                          </td>
                                                          
                                                          {/* Image - SCRAPED AUTOMATICALLY - CLICKABLE TO EXPAND */}
                                                          <td className="border border-[#B49B7E] px-2 py-2 text-center text-white">
                                                            {item.image_url ? (
                                                              <img 
                                                                src={item.image_url} 
                                                                alt={item.name} 
                                                                className="w-16 h-16 object-cover rounded cursor-pointer hover:opacity-80 transition-opacity" 
                                                                onClick={() => setExpandedImage(item.image_url)}
                                                                title="Click to expand"
                                                              />
                                                            ) : (
                                                              <div className="w-16 h-16 bg-gray-700 rounded flex items-center justify-center text-xs">No Image</div>
                                                            )}
                                                          </td>
                                                          
                                                          {/* STOCK STATUS/QTY - STACKED - COLORED BY STOCK STATUS */}
                                                          <td className="border border-[#D4A574] px-1 py-1 text-sm" style={{
                                                            background: item.stock_status ? `linear-gradient(135deg, ${getStockStatusColor(item.stock_status)}FF 0%, ${getStockStatusColor(item.stock_status)}AA 20%, ${getStockStatusColor(item.stock_status)} 40%, ${getStockStatusColor(item.stock_status)}AA 80%, ${getStockStatusColor(item.stock_status)}FF 100%)` : 'transparent',
                                                            boxShadow: item.stock_status ? `0 0 15px ${getStockStatusColor(item.stock_status)}40, inset 0 0 30px rgba(255, 255, 255, 0.1), inset 0 0 50px rgba(0, 0, 0, 0.3)` : 'none'
                                                          }}>
                                                            <div className="flex flex-col h-full">
                                                              <div className="h-6 mb-1">
                                                                <select 
                                                                  value={item.stock_status || ''}
                                                                  className="w-full h-full bg-transparent border-none text-white text-xs p-0"
                                                                  onChange={async (e) => {
                                                                    try {
                                                                      const backendUrl = (window.ENV?.REACT_APP_BACKEND_URL || window.location.origin) || window.location.origin;
                                                                      const response = await fetch(`${backendUrl}/api/items/${item.id}`, {
                                                                        method: 'PUT',
                                                                        headers: { 'Content-Type': 'application/json' },
                                                                        body: JSON.stringify({ stock_status: e.target.value })
                                                                      });
                                                                      
                                                                      if (response.ok) {
                                                                        console.log('✅ Stock status saved:', e.target.value);
                                                                        // Update local state and reload
                                                                        item.stock_status = e.target.value;
                                                                        if (onReload) {
                                                                          onReload();
                                                                        }
                                                                      } else {
                                                                        console.error('❌ Failed to save stock status');
                                                                        alert('Failed to save stock status');
                                                                      }
                                                                    } catch (error) {
                                                                      console.error('❌ Error saving stock status:', error);
                                                                      alert('Error saving stock status');
                                                                    }
                                                                  }}
                                                                >
                                                                  <option value="">—</option>
                                                                  <option value="IN STOCK">✅ IN STOCK</option>
                                                                  <option value="LOW STOCK">⚠️ LOW STOCK</option>
                                                                  <option value="OUT OF STOCK">❌ OUT OF STOCK</option>
                                                                  <option value="BACKORDERED">⏳ BACKORDERED</option>
                                                                  <option value="DISCONTINUED">🚫 DISCONTINUED</option>
                                                                </select>
                                                              </div>
                                                              <div className="h-6">
                                                                <input 
                                                                  type="number" 
                                                                  defaultValue={item.stock_quantity || ''}
                                                                  placeholder="Stock Qty"
                                                                  className="w-full h-full bg-transparent border-none text-white text-xs text-center p-0"
                                                                  onBlur={async (e) => {
                                                                    const backendUrl = (window.ENV?.REACT_APP_BACKEND_URL || window.location.origin) || window.location.origin;
                                                                    await fetch(`${backendUrl}/api/items/${item.id}`, {
                                                                      method: 'PUT',
                                                                      headers: { 'Content-Type': 'application/json' },
                                                                      body: JSON.stringify({ stock_quantity: parseInt(e.target.value) || 0 })
                                                                    });
                                                                    console.log('Stock qty saved:', e.target.value);
                                                                  }}
                                                                />
                                                              </div>
                                                            </div>
                                                          </td>
                                                          
                                                          {/* RESTOCK DATE/LEAD TIME - STACKED */}
                                                          <td className="border border-[#D4A574] px-1 py-1 text-sm">
                                                            <div className="flex flex-col h-full">
                                                              <div className="h-6 mb-1">
                                                                <input 
                                                                  type="date"
                                                                  defaultValue={item.restock_date || ''}
                                                                  className="w-full h-full bg-transparent border-none text-white text-xs p-0"
                                                                  onBlur={async (e) => {
                                                                    const backendUrl = (window.ENV?.REACT_APP_BACKEND_URL || window.location.origin) || window.location.origin;
                                                                    await fetch(`${backendUrl}/api/items/${item.id}`, {
                                                                      method: 'PUT',
                                                                      headers: { 'Content-Type': 'application/json' },
                                                                      body: JSON.stringify({ restock_date: e.target.value })
                                                                    });
                                                                    console.log('Restock date saved:', e.target.value);
                                                                  }}
                                                                />
                                                              </div>
                                                              <div className="h-6">
                                                                <input 
                                                                  type="number"
                                                                  defaultValue={item.lead_time_weeks || ''}
                                                                  placeholder="Lead (wks)"
                                                                  className="w-full h-full bg-transparent border-none text-[#D4A574] text-xs text-center p-0"
                                                                  onBlur={async (e) => {
                                                                    const backendUrl = (window.ENV?.REACT_APP_BACKEND_URL || window.location.origin) || window.location.origin;
                                                                    await fetch(`${backendUrl}/api/items/${item.id}`, {
                                                                      method: 'PUT',
                                                                      headers: { 'Content-Type': 'application/json' },
                                                                      body: JSON.stringify({ lead_time_weeks: e.target.value })
                                                                    });
                                                                    console.log('Lead time saved:', e.target.value);
                                                                  }}
                                                                />
                                                              </div>
                                                            </div>
                                                          </td>
                                                          
                                                          {/* RIGHT SIDE - STACKED COLUMNS AS USER SPECIFIED */}
                                                          
                                                          {/* Order Date (ALONE) */}
                                                          <td className="border border-[#B49B7E] px-2 py-2 text-sm text-[#B49B7E]">
                                                            <input 
                                                              type="date" 
                                                              className="w-full bg-transparent border-none text-white text-sm"
                                                              onChange={(e) => console.log('Order date changed:', e.target.value)}
                                                            />
                                                          </td>
                                                          
                                                          {/* Order Status/Order Number (STACKED VERTICALLY) - COLORED BY STATUS */}
                                                          <td className="border border-[#B49B7E] px-1 py-1 text-sm" style={{
                                                            background: item.status ? `linear-gradient(135deg, ${getStatusColor(item.status)}FF 0%, ${getStatusColor(item.status)}AA 20%, ${getStatusColor(item.status)} 40%, ${getStatusColor(item.status)}AA 80%, ${getStatusColor(item.status)}FF 100%)` : 'transparent',
                                                            boxShadow: item.status ? `0 0 15px ${getStatusColor(item.status)}40, inset 0 0 30px rgba(255, 255, 255, 0.1), inset 0 0 50px rgba(0, 0, 0, 0.3)` : 'none'
                                                          }}>
                                                            <div className="flex flex-col h-full">
                                                              <div className="h-6 mb-1">
                                                                <select 
                                                                  className="w-full h-full bg-transparent border-none text-white text-xs p-0"
                                                                  value={item.status || ''}
                                                                  style={{ backgroundColor: getStatusColor(item.status || '') }}
                                                                  onChange={(e) => {
                                                                    const newStatus = e.target.value;
                                                                    handleStatusChange(item.id, newStatus);
                                                                  }}
                                                                >
                                                                  <option value="" style={{ background: 'linear-gradient(135deg, #6B7280FF 0%, #6B7280AA 50%, #6B7280FF 100%)', color: 'white' }}>—</option>
                                                                  <option value="TO BE SELECTED" style={{ background: 'linear-gradient(135deg, #94A3B8FF 0%, #94A3B8AA 50%, #94A3B8FF 100%)', color: 'white' }}>⚪ TO BE SELECTED</option>
                                                                  <option value="RESEARCHING" style={{ background: 'linear-gradient(135deg, #3B82F6FF 0%, #3B82F6AA 50%, #3B82F6FF 100%)', color: 'white' }}>🔵 RESEARCHING</option>
                                                                  <option value="PENDING APPROVAL" style={{ background: 'linear-gradient(135deg, #F59E0BFF 0%, #F59E0BAA 50%, #F59E0BFF 100%)', color: 'white' }}>🟡 PENDING APPROVAL</option>
                                                                  <option value="APPROVED" style={{ background: 'linear-gradient(135deg, #10B981FF 0%, #10B981AA 50%, #10B981FF 100%)', color: 'white' }}>🟢 APPROVED</option>
                                                                  <option value="ORDERED" style={{ background: 'linear-gradient(135deg, #06B6D4FF 0%, #06B6D4AA 50%, #06B6D4FF 100%)', color: 'white' }}>🔷 ORDERED</option>
                                                                  <option value="PICKED" style={{ background: 'linear-gradient(135deg, #FFD700FF 0%, #FFD700AA 50%, #FFD700FF 100%)', color: 'black' }}>⭐ PICKED</option>
                                                                  <option value="CONFIRMED" style={{ background: 'linear-gradient(135deg, #84CC16FF 0%, #84CC16AA 50%, #84CC16FF 100%)', color: 'white' }}>🟩 CONFIRMED</option>
                                                                  <option value="IN PRODUCTION" style={{ background: 'linear-gradient(135deg, #F97316FF 0%, #F97316AA 50%, #F97316FF 100%)', color: 'white' }}>🟠 IN PRODUCTION</option>
                                                                  <option value="SHIPPED" style={{ background: 'linear-gradient(135deg, #0EA5E9FF 0%, #0EA5E9AA 50%, #0EA5E9FF 100%)', color: 'white' }}>🚢 SHIPPED</option>
                                                                  <option value="IN TRANSIT" style={{ background: 'linear-gradient(135deg, #8B5CF6FF 0%, #8B5CF6AA 50%, #8B5CF6FF 100%)', color: 'white' }}>🟣 IN TRANSIT</option>
                                                                  <option value="OUT FOR DELIVERY" style={{ background: 'linear-gradient(135deg, #6366F1FF 0%, #6366F1AA 50%, #6366F1FF 100%)', color: 'white' }}>📦 OUT FOR DELIVERY</option>
                                                                  <option value="DELIVERED TO RECEIVER" style={{ background: 'linear-gradient(135deg, #A855F7FF 0%, #A855F7AA 50%, #A855F7FF 100%)', color: 'white' }}>💜 DELIVERED TO RECEIVER</option>
                                                                  <option value="DELIVERED TO JOB SITE" style={{ background: 'linear-gradient(135deg, #EC4899FF 0%, #EC4899AA 50%, #EC4899FF 100%)', color: 'white' }}>💗 DELIVERED TO JOB SITE</option>
                                                                  <option value="RECEIVED" style={{ background: 'linear-gradient(135deg, #D946EFFF 0%, #D946EFAA 50%, #D946EFFF 100%)', color: 'white' }}>📥 RECEIVED</option>
                                                                  <option value="READY FOR INSTALL" style={{ background: 'linear-gradient(135deg, #14B8A6FF 0%, #14B8A6AA 50%, #14B8A6FF 100%)', color: 'white' }}>🔧 READY FOR INSTALL</option>
                                                                  <option value="INSTALLING" style={{ background: 'linear-gradient(135deg, #22C55EFF 0%, #22C55EAA 50%, #22C55EFF 100%)', color: 'white' }}>🛠️ INSTALLING</option>
                                                                  <option value="INSTALLED" style={{ background: 'linear-gradient(135deg, #65A30DFF 0%, #65A30DAA 50%, #65A30DFF 100%)', color: 'white' }}>✅ INSTALLED</option>
                                                                  <option value="ON HOLD" style={{ background: 'linear-gradient(135deg, #EF4444FF 0%, #EF4444AA 50%, #EF4444FF 100%)', color: 'white' }}>⏸️ ON HOLD</option>
                                                                  <option value="BACKORDERED" style={{ background: 'linear-gradient(135deg, #DC2626FF 0%, #DC2626AA 50%, #DC2626FF 100%)', color: 'white' }}>⏳ BACKORDERED</option>
                                                                  <option value="DAMAGED" style={{ background: 'linear-gradient(135deg, #991B1BFF 0%, #991B1BAA 50%, #991B1BFF 100%)', color: 'white' }}>💔 DAMAGED</option>
                                                                  <option value="RETURNED" style={{ background: 'linear-gradient(135deg, #FB923CFF 0%, #FB923CAA 50%, #FB923CFF 100%)', color: 'white' }}>↩️ RETURNED</option>
                                                                  <option value="CANCELLED" style={{ background: 'linear-gradient(135deg, #7C2D12FF 0%, #7C2D12AA 50%, #7C2D12FF 100%)', color: 'white' }}>❌ CANCELLED</option>
                                                                </select>
                                                              </div>
                                                              <div className="h-6">
                                                                <input 
                                                                  type="text" 
                                                                  placeholder="Order #"
                                                                  className="w-full h-full bg-transparent border-none text-white text-xs p-0"
                                                                  onChange={(e) => console.log('Order number changed:', e.target.value)}
                                                                />
                                                              </div>
                                                            </div>
                                                          </td>
                                                          
                                                          {/* Estimated Ship Date/Estimated Delivery Date (STACKED VERTICALLY) */}
                                                          <td className="border border-[#B49B7E] px-1 py-1 text-sm">
                                                            <div className="flex flex-col h-full">
                                                              <div className="h-6 mb-1">
                                                                <input 
                                                                  type="date" 
                                                                  className="w-full h-full bg-transparent border-none text-white text-xs p-0"
                                                                  onChange={(e) => console.log('Estimated ship date changed:', e.target.value)}
                                                                />
                                                              </div>
                                                              <div className="h-6">
                                                                <input 
                                                                  type="date" 
                                                                  className="w-full h-full bg-transparent border-none text-white text-xs p-0"
                                                                  onChange={(e) => console.log('Estimated delivery date changed:', e.target.value)}
                                                                />
                                                              </div>
                                                            </div>
                                                          </td>
                                                          
                                                          {/* Install Date/Ship To (STACKED VERTICALLY) */}
                                                          <td className="border border-[#B49B7E] px-1 py-1 text-sm">
                                                            <div className="flex flex-col h-full">
                                                              <div className="h-6 mb-1">
                                                                <input 
                                                                  type="date" 
                                                                  className="w-full h-full bg-transparent border-none text-white text-xs p-0"
                                                                  onChange={(e) => console.log('Install date changed:', e.target.value)}
                                                                />
                                                              </div>
                                                              <div className="h-6">
                                                                <select 
                                                                  className="w-full h-full bg-transparent border-none text-white text-xs p-0"
                                                                  onChange={(e) => console.log('Ship to changed:', e.target.value)}
                                                                >
                                                                  <option value="">Ship To...</option>
                                                                  <option value="CLIENT HOME">CLIENT HOME</option>
                                                                  <option value="JOB SITE">JOB SITE</option>
                                                                  <option value="DESIGN CENTER">DESIGN CENTER</option>
                                                                  <option value="WAREHOUSE">WAREHOUSE</option>
                                                                  <option value="VENDOR LOCATION">VENDOR LOCATION</option>
                                                                  <option value="CLASSIC DESIGN SERVICES">CLASSIC DESIGN SERVICES</option>
                                                                  <option value="RECEIVER">RECEIVER</option>
                                                                  <option value="ADD_NEW">+ Add New Location</option>
                                                                </select>
                                                              </div>
                                                            </div>
                                                          </td>
                                                          
                                                          {/* Tracking/Carrier (STACKED VERTICALLY) - COLORED BY CARRIER */}
                                                          <td className="border border-[#B49B7E] px-1 py-1 text-sm" style={{
                                                            background: item.carrier ? `linear-gradient(135deg, ${getCarrierColor(item.carrier)}FF 0%, ${getCarrierColor(item.carrier)}AA 20%, ${getCarrierColor(item.carrier)} 40%, ${getCarrierColor(item.carrier)}AA 80%, ${getCarrierColor(item.carrier)}FF 100%)` : 'transparent',
                                                            boxShadow: item.carrier ? `0 0 15px ${getCarrierColor(item.carrier)}40, inset 0 0 30px rgba(255, 255, 255, 0.1), inset 0 0 50px rgba(0, 0, 0, 0.3)` : 'none'
                                                          }}>
                                                            <div className="flex flex-col h-full">
                                                              <div className="h-6 mb-1">
                                                                <input 
                                                                  type="text" 
                                                                  placeholder="Live Tracking #"
                                                                  className="w-full h-full bg-transparent border-none text-white text-xs p-0"
                                                                  onChange={(e) => console.log('Live tracking changed:', e.target.value)}
                                                                />
                                                              </div>
                                                              <div className="h-6">
                                                                <select 
                                                                  className="w-full h-full bg-transparent border-none text-white text-xs p-0"
                                                                  value={item.carrier || ''}
                                                                  style={{ backgroundColor: getCarrierColor(item.carrier || '') }}
                                                                  onChange={(e) => handleCarrierChange(item.id, e.target.value)}
                                                                >
                                                                  <option value="" style={{ backgroundColor: '#6B7280', color: 'white' }}>—</option>
                                                                  <option value="FedEx" style={{ backgroundColor: '#FF6600', color: 'white' }}>FedEx</option>
                                                                  <option value="FedEx Ground" style={{ backgroundColor: '#FF6600', color: 'white' }}>FedEx Ground</option>
                                                                  <option value="UPS" style={{ backgroundColor: '#8B4513', color: 'white' }}>UPS</option>
                                                                  <option value="UPS Ground" style={{ backgroundColor: '#8B4513', color: 'white' }}>UPS Ground</option>
                                                                  <option value="USPS" style={{ backgroundColor: '#004B87', color: 'white' }}>USPS</option>
                                                                  <option value="DHL" style={{ backgroundColor: '#FFD700', color: 'black' }}>DHL</option>
                                                                  <option value="Brooks" style={{ backgroundColor: '#4682B4', color: 'white' }}>Brooks</option>
                                                                  <option value="Zenith" style={{ backgroundColor: '#20B2AA', color: 'white' }}>Zenith</option>
                                                                  <option value="Sunbelt" style={{ backgroundColor: '#FF4500', color: 'white' }}>Sunbelt</option>
                                                                  <option value="R+L Carriers" style={{ backgroundColor: '#32CD32', color: 'white' }}>R+L Carriers</option>
                                                                  <option value="Yellow Freight" style={{ backgroundColor: '#FFD700', color: 'black' }}>Yellow Freight</option>
                                                                  <option value="XPO Logistics" style={{ backgroundColor: '#6A5ACD', color: 'white' }}>XPO Logistics</option>
                                                                  <option value="Old Dominion" style={{ backgroundColor: '#DC143C', color: 'white' }}>Old Dominion</option>
                                                                  <option value="ABF Freight" style={{ backgroundColor: '#FF6347', color: 'white' }}>ABF Freight</option>
                                                                  <option value="Con-Way" style={{ backgroundColor: '#48D1CC', color: 'white' }}>Con-Way</option>
                                                                  <option value="Estes Express" style={{ backgroundColor: '#9370DB', color: 'white' }}>Estes Express</option>
                                                                  <option value="YRC Freight" style={{ backgroundColor: '#FF1493', color: 'white' }}>YRC Freight</option>
                                                                  <option value="Saia" style={{ backgroundColor: '#00CED1', color: 'white' }}>Saia</option>
                                                                  <option value="OTHER" style={{ backgroundColor: '#808080', color: 'white' }}>OTHER</option>
                                                                  <option value="ADD_NEW" style={{ backgroundColor: '#6B7280', color: 'white' }}>+ Add New Carrier</option>
                                                                </select>
                                                              </div>
                                                            </div>
                                                          </td>
                                                          
                                                          {/* NOTES */}
                                                          <td className="border border-[#B49B7E] px-2 py-2 text-sm text-[#B49B7E]">
                                                            <input 
                                                              type="text" 
                                                              placeholder="Notes"
                                                              className="w-full bg-transparent border-none text-white text-sm"
                                                              onChange={(e) => console.log('Notes changed:', e.target.value)}
                                                            />
                                                          </td>
                                                          
                                                          {/* LINK WITH CLICKABLE OPEN BUTTON AND SCRAPE */}
                                                          <td className="border border-[#B49B7E] px-1 py-1 text-white w-32">
                                                            <div className="flex flex-col gap-1">
                                                              <input 
                                                                type="text" 
                                                                value={item.link || item.link_url || ''}
                                                                placeholder="Product URL"
                                                                className="w-full bg-transparent text-blue-400 text-xs outline-none border border-gray-600 rounded px-1"
                                                                onChange={(e) => {
                                                                  // Update item link immediately for scraping
                                                                  item.link = e.target.value;
                                                                  item.link_url = e.target.value;
                                                                }}
                                                                onBlur={(e) => console.log('Link updated:', e.target.value)}
                                                              />
                                                              <div className="flex gap-1">
                                                                {(item.link || item.link_url) && (
                                                                  <a
                                                                    href={item.link || item.link_url}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-xs px-2 py-1 rounded text-center font-bold"
                                                                    title="Open product link in new tab"
                                                                  >
                                                                    🔗 OPEN
                                                                  </a>
                                                                )}
                                                                <button
                                                                  onClick={() => handleScrapeProduct(item.link || item.link_url, item.id)}
                                                                  className="flex-1 bg-green-600 hover:bg-green-700 text-white text-xs px-2 py-1 rounded"
                                                                  disabled={!item.link && !item.link_url}
                                                                  title="Scrape product information from URL"
                                                                >
                                                                  SCRAPE
                                                                </button>
                                                              </div>
                                                            </div>
                                                          </td>
                                                          
                                                          {/* ACTIONS - PASTE & DELETE */}
                                                          <td className="border border-[#B49B7E] px-2 py-2 text-center">
                                                            <div className="flex items-center justify-center gap-1">
                                                              {/* PASTE BUTTON - Only shows when scraper data is available */}
                                                              {scraperClipboard && (
                                                                <button 
                                                                  onClick={() => handlePasteScrapedData(item.id)}
                                                                  className="bg-green-600 hover:bg-green-500 text-white text-xs px-2 py-1 rounded animate-pulse"
                                                                  title={`Paste: ${scraperClipboard.name}`}
                                                                >
                                                                  📋
                                                                </button>
                                                              )}
                                                              <button 
                                                                onClick={() => handleDeleteItem(item.id)}
                                                                className="bg-red-600 hover:bg-red-500 text-white text-xs px-2 py-1 rounded"
                                                                title="Delete Item"
                                                              >
                                                                🗑️
                                                              </button>
                                                            </div>
                                                          </td>
                                                        </tr>
                                                        ))
                                                      ))}
                                                      
                                                      {/* INLINE ADD ITEM ROW */}
                                                      <tr className="hover:bg-[#1a1a2a]">
                                                        <td colSpan="14" className="border border-[#B49B7E]/30 px-2 py-1">
                                                          <button
                                                            onClick={() => {
                                                              const firstSubcategory = category.subcategories?.[0];
                                                              if (firstSubcategory) {
                                                                setSelectedSubCategoryId(firstSubcategory.id);
                                                              }
                                                              setShowAddItem(true);
                                                            }}
                                                            className="text-[#D4A574] hover:text-[#E8D4B8] text-xs flex items-center gap-1 opacity-60 hover:opacity-100 transition-opacity"
                                                          >
                                                            <span>➕</span>
                                                            <span>Add item to {category.name}</span>
                                                          </button>
                                                        </td>
                                                      </tr>
                                                      
                                                      {/* BUTTONS ROW - LEFT ALIGNED WITH GOLD COLOR */}
                                                      <tr>
                                                        <td colSpan="7" className="border border-[#B49B7E] px-6 py-2 bg-slate-900">
                                                          <div className="flex justify-start items-center space-x-4">
                                                            {/* Add Item Button - GOLD/AMBER COLOR */}
                                                            <button
                                                              onClick={() => setShowAddItem(true)}
                                                              className="bg-amber-700 hover:bg-amber-600 text-white px-3 py-1 rounded text-sm font-medium"
                                                            >
                                                              ✚ Add Item
                                                            </button>
                                                            
                                                            {/* Add Category Dropdown - GOLD/AMBER COLOR */}
                                                            <select
                                                              value=""
                                                              onChange={(e) => {
                                                                if (e.target.value === 'CREATE_NEW') {
                                                                  const categoryName = prompt('Enter new category name:');
                                                                  if (categoryName && categoryName.trim()) {
                                                                    handleAddCategory(room.id, categoryName.trim());
                                                                  }
                                                                } else if (e.target.value) {
                                                                  handleAddCategory(room.id, e.target.value);
                                                                }
                                                              }}
                                                              className="bg-amber-700 hover:bg-amber-600 text-white px-3 py-1 rounded text-sm font-medium border-none outline-none"
                                                            >
                                                              <option value="">Add Category ▼</option>
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
                                                            
                                                            {/* Delete Section Button - RED COLOR */}
                                                            <button
                                                              onClick={() => handleDeleteRoom(room.id)}
                                                              className="bg-red-700 hover:bg-red-600 text-white px-3 py-1 rounded text-sm font-medium"
                                                            >
                                                              🗑️ Delete Section
                                                            </button>
                                                          </div>
                                                        </td>
                                                      </tr>
                                                    </React.Fragment>
                                                  )}
                                                </>
                                              )}
                                            </Draggable>
                                          );
                                        })}
                                        {provided.placeholder}
                                      </>
                                    )}
                                  </Droppable>
                                )}
                        </>
                      )}
                    </Draggable>
                  );
                })}
                        {provided.placeholder}
                      </tbody>
                    )}
                  </Droppable>
                </DragDropContext>
                </table>
            </div>
          </div>
        </div>

      {/* ADD INSTALLED MODAL */}
      {showAddItem && (
        <AddItemModal
          onClose={() => setShowAddItem(false)}
          onSubmit={handleAddItem}
          itemStatuses={itemStatuses}
          vendorTypes={vendorTypes}
          loading={false}
        />
      )}

      {/* IMAGE EXPANSION MODAL */}
      {expandedImage && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-90 flex items-start justify-center z-50 p-4 overflow-y-auto"
          onClick={() => setExpandedImage(null)}
        >
          <div className="relative max-w-4xl max-h-screen mt-4">
            <button
              onClick={() => setExpandedImage(null)}
              className="absolute top-4 right-4 bg-red-600 hover:bg-red-700 text-white rounded-full w-10 h-10 flex items-center justify-center text-2xl font-bold z-10"
              title="Close"
            >
              ×
            </button>
            <img 
              src={expandedImage} 
              alt="Expanded view" 
              className="max-w-full max-h-screen object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}

      {/* PHOTO VIEWER MODAL */}
      {selectedPhotoView && (
        <div 
          className="fixed inset-0 bg-black/95 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedPhotoView(null)}
        >
          <div className="relative max-w-5xl max-h-[90vh]">
            <button
              onClick={() => setSelectedPhotoView(null)}
              className="absolute -top-4 -right-4 bg-red-600 hover:bg-red-700 text-white rounded-full w-10 h-10 flex items-center justify-center text-2xl font-bold z-10"
            >
              ×
            </button>
            <img 
              src={selectedPhotoView.photo_data || selectedPhotoView.url || selectedPhotoView.image_url} 
              alt={selectedPhotoView.file_name || 'Photo'} 
              className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
            {selectedPhotoView.notes && (
              <div className="mt-2 text-center text-[#D4A574] bg-black/80 px-4 py-2 rounded">
                {selectedPhotoView.notes}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ExactFFESpreadsheet;
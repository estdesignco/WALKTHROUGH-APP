import React, { useState, useEffect, useCallback, useRef } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import AddItemModal from './AddItemModal';
import CanvaIntegrationModal from './CanvaIntegrationModal';
import CalculatorPopup from './CalculatorPopup';
import AutocompleteInput from './AutocompleteInput';
import { InlineProductAutocomplete, VendorDropdown } from './InlineProductAutocomplete';
import ProductVariantPicker from './ProductVariantPicker';
import SmartAlternatives from './SmartAlternatives';
import { getRoomColor, getCategoryColor } from '../utils/roomColors';
import { getStatusColor, STATUS_COLORS } from '../utils/statusColors';
import { toast } from 'sonner';

// CRITICAL: Statuses that mean item is PICKED or beyond - checkbox should STAY CHECKED
// These items still need to transfer to FFE!
const PICKED_OR_BEYOND_STATUSES = [
  'PICKED',
  'ORDER SAMPLES',
  'SAMPLES ORDERED',
  'SAMPLES ARRIVED', 
  'GET QUOTE',
  'WAITING ON QT',
  'READY FOR PRESENTATION',
  'ENTER INTO HOUZZ',
  'ENTER INTO HOUZZ & ORDER SAMPLE'
];

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
  
  // Calculator popup state
  const [showCalculator, setShowCalculator] = useState(false);
  const [calculatorItem, setCalculatorItem] = useState(null);
  const [calculatorCategory, setCalculatorCategory] = useState('');
  
  // Variant picker state
  const [showVariantPicker, setShowVariantPicker] = useState(false);
  const [variantPickerSku, setVariantPickerSku] = useState(null);
  const [pendingVariantItem, setPendingVariantItem] = useState(null);
  const [pendingVariantProduct, setPendingVariantProduct] = useState(null);
  
  // Smart Alternatives state
  const [showAlternatives, setShowAlternatives] = useState(false);
  const [alternativesItem, setAlternativesItem] = useState(null);
  
  // State to track checked items (for PICKED status)
  const [checkedItems, setCheckedItems] = useState(new Set());
  const [availableCategories, setAvailableCategories] = useState([]);
  
  // DELETE MULTIPLE - state for selected items
  const [selectedForDelete, setSelectedForDelete] = useState(new Set());
  const [deleteMode, setDeleteMode] = useState(false);
  
  // State to track items on To-Do or Punch List (for highlighting)
  // Map format: { itemId: { completed: boolean, status: string } }
  const [todoLinkedItems, setTodoLinkedItems] = useState(new Map());
  const [punchLinkedItems, setPunchLinkedItems] = useState(new Map());
  
  // Refs to track previous state for notification when highlights are removed
  const prevTodoLinkedRef = useRef(new Map());
  const prevPunchLinkedRef = useRef(new Map());
  
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
  
  // SCRAPER CLIPBOARD STATE
  const [scraperClipboard, setScraperClipboard] = useState(null);
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
        msrp: params.get('msrp') || '',
        remarks: params.get('remarks') || ''
      };
      
      // Only store if we have actual data
      if (scrapedData.name || scrapedData.sku || scrapedData.price) {
        localStorage.setItem('extensionScrapedData', JSON.stringify(scrapedData));
        console.log('✅ Stored scraper data from URL:', scrapedData);
        
        // Set clipboard immediately
        setScraperClipboard(scrapedData);
        setShowScraperNotification(true);
        
        // Clean URL without reloading
        const cleanUrl = window.location.pathname;
        window.history.replaceState({}, '', cleanUrl);
      }
    }
  }, []);
  
  // Check for scraped data in localStorage on mount
  useEffect(() => {
    const data = localStorage.getItem('extensionScrapedData');
    if (data) {
      try {
        const parsed = JSON.parse(data);
        setScraperClipboard(parsed);
        setShowScraperNotification(true);
        console.log('📋 Loaded scraper data from localStorage:', parsed);
      } catch (e) {
        console.error('Failed to parse scraper data:', e);
      }
    }
  }, []);
  
  // Handle paste scraped data into a specific item row
  const handlePasteScrapedData = async (itemId) => {
    if (!scraperClipboard) {
      alert('No scraped data to paste. Use the extension to scrape a product first.');
      return;
    }
    
    try {
      const backendUrl = window.ENV?.REACT_APP_BACKEND_URL || window.location.origin;
      
      const updateData = {
        name: scraperClipboard.name || undefined,
        vendor: scraperClipboard.vendor || undefined,
        sku: scraperClipboard.sku || undefined,
        cost: scraperClipboard.price ? parseFloat(String(scraperClipboard.price).replace(/[^0-9.]/g, '')) : undefined,
        size: scraperClipboard.size || undefined,
        finish_color: scraperClipboard.finish_color || undefined,
        finish_image: scraperClipboard.finish_image || undefined,
        image_url: scraperClipboard.image_url || undefined,
        link: scraperClipboard.link || scraperClipboard.url || undefined,
        remarks: scraperClipboard.remarks || undefined
      };
      
      // Debug: Log the price conversion
      console.log('💰 PRICE DEBUG:');
      console.log('   Raw price from clipboard:', scraperClipboard.price);
      console.log('   Type:', typeof scraperClipboard.price);
      console.log('   Parsed cost:', updateData.cost);
      console.log('   Full clipboard data:', JSON.stringify(scraperClipboard, null, 2));
      
      // Remove undefined values
      Object.keys(updateData).forEach(key => updateData[key] === undefined && delete updateData[key]);
      
      console.log('📋 Pasting data:', updateData);
      console.log('📋 Original clipboard:', scraperClipboard);
      
      const response = await fetch(`${backendUrl}/api/items/${itemId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
      });
      
      const responseData = await response.json();
      console.log('📋 API Response:', responseData);
      console.log('📋 Response cost value:', responseData.cost);
      
      if (response.ok) {
        // Clear the clipboard after successful paste
        localStorage.removeItem('extensionScrapedData');
        setScraperClipboard(null);
        setShowScraperNotification(false);
        
        // Show success with the ACTUAL cost from API response
        const savedCost = responseData.cost || updateData.cost || 0;
        alert(`✅ Pasted: ${scraperClipboard.name || 'Product data'}\n\nVendor: ${updateData.vendor || 'N/A'}\nPrice: $${savedCost}\nFinish: ${updateData.finish_color || 'N/A'}`);
        
        // Force reload to show updated data (including cost)
        if (onReload) {
          console.log('🔄 Calling onReload to refresh data...');
          onReload();
        } else {
          // Fallback: reload the page
          console.log('🔄 No onReload, refreshing page...');
          window.location.reload();
        }
      } else {
        console.error('❌ API Error:', responseData);
        throw new Error('Failed to update item');
      }
    } catch (error) {
      console.error('Error pasting scraped data:', error);
      alert('❌ Failed to paste data. Please try again.');
    }
  };
  
  // Clear scraped data
  const clearScrapedData = () => {
    localStorage.removeItem('extensionScrapedData');
    setScraperClipboard(null);
    setShowScraperNotification(false);
  };
  
  // Room photos state - for displaying walkthrough photos above each room
  const [roomPhotos, setRoomPhotos] = useState({});
  const [expandedPhotoRooms, setExpandedPhotoRooms] = useState({});
  const [selectedPhotoView, setSelectedPhotoView] = useState(null);

  // Load photos for all rooms from walkthrough
  useEffect(() => {
    const loadRoomPhotos = async () => {
      if (!project?.id || !project?.rooms) return;
      
      const backendUrl = window.ENV?.REACT_APP_BACKEND_URL || window.location.origin;
      const photosData = {};
      
      // Load photos for each room - check both walkthrough and checklist room photos
      for (const room of project.rooms) {
        try {
          // First, try to get photos from the walkthrough version of this room
          const response = await fetch(`${backendUrl}/api/photos/by-room-name/${project.id}/${encodeURIComponent(room.name)}`);
          if (response.ok) {
            const data = await response.json();
            photosData[room.id] = data.photos || [];
          } else {
            // Fallback to regular room photos
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
      console.log('📸 Loaded room photos for checklist:', Object.keys(photosData).length, 'rooms');
    };
    
    loadRoomPhotos();
  }, [project?.id, project?.rooms?.length]);

  // Toggle photo folder expansion for a room
  const togglePhotoFolder = (roomId) => {
    setExpandedPhotoRooms(prev => ({
      ...prev,
      [roomId]: !prev[roomId]
    }));
  };

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
        // Create deep copy of project
        const updatedProject = {...project};
        const newRooms = Array.from(updatedProject.rooms);
        const [removed] = newRooms.splice(source.index, 1);
        newRooms.splice(destination.index, 0, removed);
        
        updatedProject.rooms = newRooms;
        
        console.log('🔄 Moving room from', source.index, 'to', destination.index);
        console.log('📦 New room order:', newRooms.map(r => r.name));
        
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

        console.log('✅ Rooms reordered! Check if visual updated.');
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
        
        console.log('🔄 Moving category from', source.index, 'to', destination.index);
        
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

        console.log('✅ Categories reordered!');
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
          await fetch(`${(window.ENV?.REACT_APP_BACKEND_URL || window.location.origin) || window.location.origin}/api/subcategories/${newSubcategories[i].id}`, {
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

  // Handle calculator popup open
  const openCalculator = (item, categoryName) => {
    setCalculatorItem(item);
    setCalculatorCategory(categoryName);
    setShowCalculator(true);
  };

  // Handle cost update from calculator - NOW ALSO UPDATES QTY
  const handleCostCalculated = async (newCost, newQty, newSize, newRemarks) => {
    if (!calculatorItem) return;
    
    try {
      // Update ALL fields from calculator: cost, quantity, size, and remarks
      const updateData = { cost: newCost };
      
      if (newQty !== undefined && newQty > 0) {
        updateData.quantity = newQty;
      }
      
      if (newSize) {
        updateData.size = newSize;
      }
      
      if (newRemarks) {
        updateData.remarks = newRemarks;
      }
      
      const response = await fetch(`${(window.ENV?.REACT_APP_BACKEND_URL || window.location.origin)}/api/items/${calculatorItem.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
      });
      
      if (response.ok) {
        console.log('✅ All fields updated successfully:', { cost: newCost, qty: newQty, size: newSize, remarks: newRemarks });
        // Refresh the page to show updated values
        if (onReload) {
          onReload();
        } else {
          window.location.reload();
        }
      } else {
        console.error('❌ Failed to update fields');
        alert('Failed to update item');
      }
    } catch (error) {
      console.error('❌ Error updating item:', error);
      alert('Error updating: ' + error.message);
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

  // Initialize checkedItems with items that have 'PICKED' status
  // PRESERVE collapsed state from localStorage - only set defaults for NEW rooms/categories
  useEffect(() => {
    if (project?.rooms) {
      const initialCheckedItems = new Set();
      
      // Get saved states from localStorage
      const savedRoomExpansion = localStorage.getItem('checklist_expandedRooms');
      const savedCategoryExpansion = localStorage.getItem('checklist_expandedCategories');
      const existingRoomState = savedRoomExpansion ? JSON.parse(savedRoomExpansion) : {};
      const existingCategoryState = savedCategoryExpansion ? JSON.parse(savedCategoryExpansion) : {};
      
      // Only set expansion state for rooms/categories that don't have a saved state
      const roomExpansion = { ...existingRoomState };
      const categoryExpansion = { ...existingCategoryState };
      
      project.rooms.forEach(room => {
        // Only default to expanded if no saved state exists for this room
        if (roomExpansion[room.id] === undefined) {
          roomExpansion[room.id] = true;
        }
        room.categories?.forEach(category => {
          // Only default to expanded if no saved state exists for this category
          if (categoryExpansion[category.id] === undefined) {
            categoryExpansion[category.id] = true;
          }
          // Initialize checkedItems with PICKED or any post-picked status items
          category.subcategories?.forEach(subcategory => {
            subcategory.items?.forEach(item => {
              if (PICKED_OR_BEYOND_STATUSES.includes(item.status)) {
                initialCheckedItems.add(item.id);
              }
            });
          });
        });
      });
      
      setExpandedRooms(roomExpansion);
      setExpandedCategories(categoryExpansion);
      
      // CRITICAL: Initialize checkedItems with items that have PICKED or post-picked status
      if (initialCheckedItems.size > 0) {
        console.log(`📋 Initialized ${initialCheckedItems.size} pre-checked items from PICKED/post-picked status`);
        setCheckedItems(initialCheckedItems);
      }
    }
  }, [project]);

  // Load items that are linked to To-Do or Punch List
  const loadLinkedItems = useCallback(async () => {
    if (!project?.id) return;
    const backendUrl = (window.ENV?.REACT_APP_BACKEND_URL || window.location.origin) || window.location.origin;
    
    let completedTodoItems = [];
    let completedPunchItems = [];
    
    try {
      // Load To-Do items - track completion status
      const todoRes = await fetch(`${backendUrl}/api/todos/${project.id}`);
      if (todoRes.ok) {
        const todoData = await todoRes.json();
        const todos = todoData.todos || [];
        const linkedTodoMap = new Map();
        todos.forEach(todo => {
          if (todo.linked_ffe_item?.id) {
            // Track if the TO-DO is completed, not the item
            const isComplete = todo.completed || todo.status === 'completed';
            linkedTodoMap.set(todo.linked_ffe_item.id, { 
              completed: isComplete,
              status: todo.status,
              itemName: todo.linked_ffe_item.name || todo.text || 'Item'
            });
            
            // Check if this item was just completed (wasn't completed before, is now)
            const prevState = prevTodoLinkedRef.current.get(todo.linked_ffe_item.id);
            if (prevState && !prevState.completed && isComplete) {
              completedTodoItems.push(todo.linked_ffe_item.name || todo.text || 'Item');
            }
          }
        });
        
        // Update ref for next comparison
        prevTodoLinkedRef.current = linkedTodoMap;
        setTodoLinkedItems(linkedTodoMap);
        console.log(`📋 Found ${linkedTodoMap.size} items linked to To-Do`);
      }
    } catch (e) {
      console.log('No todos loaded');
    }
    
    try {
      // Load Punch List items - track completion status
      const punchRes = await fetch(`${backendUrl}/api/punch-list/project/${project.id}`);
      if (punchRes.ok) {
        const punchData = await punchRes.json();
        const punchItems = punchData.punch_items || punchData || [];
        const linkedPunchMap = new Map();
        punchItems.forEach(item => {
          const itemId = item.linked_ffe_item_id || item.linked_ffe_item?.id;
          if (itemId) {
            // Track if the PUNCH LIST item is completed, not the checklist item
            const isComplete = item.status === 'completed' || item.status === 'verified';
            const itemName = item.linked_ffe_item?.name || item.description || 'Item';
            linkedPunchMap.set(itemId, {
              completed: isComplete,
              status: item.status,
              itemName: itemName
            });
            
            // Check if this item was just completed
            const prevState = prevPunchLinkedRef.current.get(itemId);
            if (prevState && !prevState.completed && isComplete) {
              completedPunchItems.push(itemName);
            }
          }
        });
        
        // Update ref for next comparison
        prevPunchLinkedRef.current = linkedPunchMap;
        setPunchLinkedItems(linkedPunchMap);
        console.log(`🔨 Found ${linkedPunchMap.size} items linked to Punch List`);
      }
    } catch (e) {
      console.log('No punch list items loaded');
    }
    
    // Show toast notifications for newly completed items (highlights removed)
    if (completedTodoItems.length > 0) {
      toast.success(`✅ To-Do Completed: ${completedTodoItems.join(', ')}`, {
        description: 'Highlight removed from checklist',
        duration: 4000,
      });
    }
    if (completedPunchItems.length > 0) {
      toast.success(`✅ Punch List Completed: ${completedPunchItems.join(', ')}`, {
        description: 'Highlight removed from checklist',
        duration: 4000,
      });
    }
  }, [project?.id]);

  // Poll for linked item status changes every 30 seconds (reduced from 5 to prevent flicker)
  // This allows highlights to disappear when items are completed on Master To-Do List
  useEffect(() => {
    if (!project?.id) return;
    
    // Initial load
    loadLinkedItems();
    
    // Set up polling interval - refresh every 30 seconds (reduced frequency)
    const pollInterval = setInterval(() => {
      loadLinkedItems();
    }, 30000); // Changed from 5000 to 30000
    
    return () => clearInterval(pollInterval);
  }, [project?.id]); // Removed loadLinkedItems from deps to prevent loop

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

  const getCategoryColor = () => '#065F46';  // Dark green for categories

  // Checklist status colors - DIFFERENT from FFE
  const getStatusColor = (status) => {
    const statusColors = {
      '': '#6B7280',                        // Gray
      'PICKED': '#3B82F6',                  // Blue
      'ORDER SAMPLES': '#10B981',           // Green
      'SAMPLES ARRIVED': '#8B5CF6',         // Purple
      'ASK NEIL': '#F59E0B',                // Amber
      'ASK CHARLENE': '#EF4444',            // Red
      'ASK JALA': '#EC4899',                // Pink
      'GET QUOTE': '#06B6D4',               // Cyan
      'WAITING ON QT': '#F97316',           // Orange
      'READY FOR PRESENTATION': '#84CC16', // Lime
      'ENTER INTO HOUZZ': '#7C3AED',        // Violet
      'ENTER INTO HOUZZ & ORDER SAMPLE': '#DB2777' // Deep Pink
    };
    return statusColors[status] || '#6B7280';
  };

  // Handle updating any item field (vendor, quantity, size, finish_color, cost)
  const handleUpdateItemField = async (itemId, field, value) => {
    console.log('🔄 Updating item field:', { itemId, field, value });
    
    try {
      const backendUrl = (window.ENV?.REACT_APP_BACKEND_URL || window.location.origin) || window.location.origin;
      
      const response = await fetch(`${backendUrl}/api/items/${itemId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: value })
      });
      
      if (response.ok) {
        console.log(`✅ Item ${field} updated successfully to:`, value);
        
        // If finish_color was updated, sync to Material Libraries
        if (field === 'finish_color' && value && value.trim()) {
          // Find the item to get vendor, name, sku info
          let itemData = null;
          filteredProject?.rooms?.forEach(room => {
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
              console.log('📚 Synced finish to Global Materials Library:', value);
              
              // Add to Project Materials (with duplicate check)
              if (project?.id) {
                await fetch(`${backendUrl}/api/materials`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(materialData)
                });
                console.log('📚 Synced finish to Project Materials Library:', value);
              }
            } catch (materialErr) {
              console.warn('⚠️ Could not sync to Materials Library:', materialErr);
            }
          }
        }
        
        // Update local state
        const updatedProject = JSON.parse(JSON.stringify(filteredProject));
        updatedProject.rooms?.forEach(room => {
          room.categories?.forEach(category => {
            category.subcategories?.forEach(subcategory => {
              subcategory.items?.forEach(item => {
                if (item.id === itemId) {
                  item[field] = value;
                }
              });
            });
          });
        });
        setFilteredProject(updatedProject);
      } else {
        console.error(`❌ Failed to update item ${field}:`, response.status);
      }
    } catch (error) {
      console.error(`❌ Error updating item ${field}:`, error);
    }
  };

  // Handle batch update of multiple item fields at once (avoids race conditions)
  const handleBatchUpdateItem = async (itemId, updates) => {
    console.log('🔄 Batch updating item fields:', { itemId, updates });
    
    try {
      const backendUrl = (window.ENV?.REACT_APP_BACKEND_URL || window.location.origin) || window.location.origin;
      
      const response = await fetch(`${backendUrl}/api/items/${itemId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      
      if (response.ok) {
        console.log('✅ Item batch updated successfully:', updates);
        
        // Update local state with all fields at once
        const updatedProject = JSON.parse(JSON.stringify(filteredProject));
        updatedProject.rooms?.forEach(room => {
          room.categories?.forEach(category => {
            category.subcategories?.forEach(subcategory => {
              subcategory.items?.forEach(item => {
                if (item.id === itemId) {
                  Object.assign(item, updates);
                }
              });
            });
          });
        });
        setFilteredProject(updatedProject);
      } else {
        console.error('❌ Failed to batch update item:', response.status);
      }
    } catch (error) {
      console.error('❌ Error batch updating item:', error);
    }
  };

  // Handle status change with improved error handling
  const handleStatusChange = async (itemId, newStatus) => {
    console.log('🔄 Checklist status change request:', { itemId, newStatus });
    
    // Save scroll position before update
    const scrollY = window.scrollY || window.pageYOffset;
    console.log('💾 Saving scroll position:', scrollY);
    
    try {
      const backendUrl = (window.ENV?.REACT_APP_BACKEND_URL || window.location.origin) || window.location.origin;
      console.log('🌐 Using backend URL:', backendUrl);
      
      const response = await fetch(`${backendUrl}/api/items/${itemId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      
      console.log('📡 Response status:', response.status, response.statusText);
      
      if (response.ok) {
        console.log('✅ Checklist status updated successfully');
        
        // Find item details for automation
        let itemName = '';
        let roomName = '';
        let vendorName = '';
        let categoryName = '';
        let sku = '';
        
        filteredProject?.rooms?.forEach(room => {
          room.categories?.forEach(category => {
            category.subcategories?.forEach(subcategory => {
              subcategory.items?.forEach(item => {
                if (item.id === itemId) {
                  itemName = item.name || 'Unknown Item';
                  roomName = room.name || '';
                  vendorName = item.vendor || '';
                  categoryName = category.name || '';
                  sku = item.sku || '';
                }
              });
            });
          });
        });
        
        // AUTO-CREATE TO-DO for specific statuses
        const autoTodoStatuses = ['CHANGE OUT', 'GET QUOTE', 'ORDER SAMPLES', 'ENTER INTO HOUZZ', 'ENTER INTO HOUZZ & ORDER SAMPLE'];
        if (autoTodoStatuses.includes(newStatus.toUpperCase())) {
          // Create the To-Do automatically
          try {
            const todoText = `${newStatus}: ${itemName}${roomName ? ` (${roomName})` : ''}`;
            const todoResponse = await fetch(`${backendUrl}/api/todos`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                project_id: project?.id,
                text: todoText,
                description: `Auto-created from Checklist status change. Vendor: ${vendorName || 'N/A'}`,
                priority: newStatus.toUpperCase() === 'CHANGE OUT' ? 'high' : 'medium',
                status: 'pending',
                source_type: 'checklist',
                linked_ffe_item: {
                  id: itemId,
                  name: itemName,
                  room_name: roomName,
                  category_name: categoryName,
                  vendor: vendorName,
                  sku: sku,
                  source_type: 'checklist'
                }
              })
            });
            
            if (todoResponse.ok) {
              console.log('✅ Auto-created To-Do for status:', newStatus, todoText);
              toast.info(`📋 To-Do Created: ${newStatus} - ${itemName}`, {
                description: `Added to your Master To-Do List`,
                duration: 3000,
              });
            } else {
              console.warn('⚠️ Failed to auto-create To-Do:', await todoResponse.text());
            }
          } catch (todoError) {
            console.error('❌ Error auto-creating To-Do:', todoError);
          }
        }
        
        // NOTE: Samples Library sync is now handled by backend based on FINISH_COLOR content
        // When finish_color field is updated, backend automatically syncs to Samples Library
        
        // AUTO-COMPLETE TO-DO when status changes to completion states
        const completionStatuses = ['ORDERED', 'RECEIVED', 'INSTALLED', 'COMPLETE', 'DELIVERED', 'SAMPLES ARRIVED', 'PICKED'];
        if (completionStatuses.includes(newStatus.toUpperCase())) {
          // Find and complete any linked To-Dos for this item
          try {
            const todosRes = await fetch(`${backendUrl}/api/todos/${project?.id}`);
            if (todosRes.ok) {
              const todosData = await todosRes.json();
              const todos = todosData.todos || [];
              
              // Find todos linked to this item
              for (const todo of todos) {
                if (todo.linked_ffe_item?.id === itemId && !todo.completed) {
                  // Mark this to-do as completed
                  await fetch(`${backendUrl}/api/todos/${todo.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ completed: true, status: 'completed' })
                  });
                  console.log('✅ Auto-completed To-Do:', todo.text);
                  toast.success(`✅ To-Do Completed: ${todo.text}`, {
                    description: `Status changed to ${newStatus}`,
                    duration: 3000,
                  });
                }
              }
            }
          } catch (todoError) {
            console.error('❌ Error auto-completing To-Dos:', todoError);
          }
          
          // Refresh linked items to update highlights
          loadLinkedItems();
        }
        
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
      
      const backendUrl = (window.ENV?.REACT_APP_BACKEND_URL || window.location.origin) || window.location.origin;
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
      
      // If still no subcategory, try to find ANY subcategory
      if (!subcategoryId) {
        for (const room of project.rooms) {
          for (const category of room.categories || []) {
            if (category.subcategories?.length > 0) {
              subcategoryId = category.subcategories[0].id;
              console.log(`🔍 Auto-selected first available subcategory: ${category.subcategories[0].name}`);
              break;
            }
          }
          if (subcategoryId) break;
        }
      }

      if (!subcategoryId) {
        alert('Please add a room and category first before adding items.');
        return;
      }

      const backendUrl = (window.ENV?.REACT_APP_BACKEND_URL || window.location.origin) || window.location.origin;
      
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
      alert(`Failed to add item: ${error.message}`);
    }
  };

  // Handle deleting an item - NO PAGE RELOAD
  const handleDeleteItem = async (itemId) => {
    try {
      const response = await fetch(`${(window.ENV?.REACT_APP_BACKEND_URL || window.location.origin) || window.location.origin}/api/items/${itemId}`, {
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
    try {
      const response = await fetch(`${(window.ENV?.REACT_APP_BACKEND_URL || window.location.origin) || window.location.origin}/api/categories/${categoryId}`, {
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
      const backendUrl = (window.ENV?.REACT_APP_BACKEND_URL || window.location.origin) || window.location.origin;
      
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

  // DELETE MULTIPLE - Delete all selected items
  const handleDeleteMultiple = async () => {
    if (selectedForDelete.size === 0) return;
    
    try {
      const backendUrl = (window.ENV?.REACT_APP_BACKEND_URL || window.location.origin) || window.location.origin;
      const itemIds = Array.from(selectedForDelete);
      
      console.log(`🗑️ Deleting ${itemIds.length} items...`);
      
      // Delete all selected items
      await Promise.all(itemIds.map(itemId => 
        fetch(`${backendUrl}/api/items/${itemId}`, { method: 'DELETE' })
      ));
      
      console.log('✅ Multiple items deleted');
      setSelectedForDelete(new Set());
      setDeleteMode(false);
      if (onReload) onReload();
    } catch (error) {
      console.error('❌ Error deleting multiple items:', error);
      alert('Failed to delete some items: ' + error.message);
    }
  };

  // Toggle item selection for delete
  const toggleSelectForDelete = (itemId) => {
    const newSelected = new Set(selectedForDelete);
    if (newSelected.has(itemId)) {
      newSelected.delete(itemId);
    } else {
      newSelected.add(itemId);
    }
    setSelectedForDelete(newSelected);
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
      const backendUrl = (window.ENV?.REACT_APP_BACKEND_URL || window.location.origin) || window.location.origin;
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
            quantity: null,
            status: 'PICKED',
            link: item.link || '',
            image_url: item.image_url || '',
            subcategory_id: targetSubcategoryId,
            order_index: 0
          };
          
          const response = await fetch(`${(window.ENV?.REACT_APP_BACKEND_URL || window.location.origin) || window.location.origin}/api/items`, {
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

  // ADD BLANK ITEM - Just adds an empty row, no modal
  const addBlankItem = async (subcategoryId) => {
    try {
      const backendUrl = (window.ENV?.REACT_APP_BACKEND_URL || window.location.origin) || window.location.origin;
      
      const response = await fetch(`${backendUrl}/api/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: '',
          vendor: '',
          sku: '',
          cost: 0,
          size: '',
          finish_color: '',
          quantity: null,
          status: '',
          link: '',
          image_url: '',
          subcategory_id: subcategoryId,
          order_index: 999
        })
      });
      
      if (response.ok) {
        console.log('✅ Blank item added');
        if (onReload) {
          onReload();
        }
      } else {
        console.error('❌ Failed to add blank item');
      }
    } catch (error) {
      console.error('❌ Error adding blank item:', error);
    }
  };

  // UPLOAD IMAGE FOR ITEM - Manual image upload when scraper fails
  const handleImageUpload = async (itemId, file) => {
    if (!file) return;
    
    try {
      const backendUrl = (window.ENV?.REACT_APP_BACKEND_URL || window.location.origin) || window.location.origin;
      const formData = new FormData();
      formData.append('file', file);
      formData.append('item_id', itemId);
      
      // Upload image to server
      const uploadResponse = await fetch(`${backendUrl}/api/upload-item-image`, {
        method: 'POST',
        body: formData
      });
      
      if (uploadResponse.ok) {
        const result = await uploadResponse.json();
        console.log('✅ Image uploaded:', result);
        
        // Update item with new image URL
        if (result.image_url) {
          await handleUpdateItemField(itemId, 'image_url', result.image_url);
          if (onReload) onReload();
        }
      } else {
        console.error('❌ Image upload failed');
        alert('Failed to upload image');
      }
    } catch (error) {
      console.error('❌ Image upload error:', error);
      alert('Error uploading image: ' + error.message);
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
      
      const response = await fetch(`${(window.ENV?.REACT_APP_BACKEND_URL || window.location.origin) || window.location.origin}/api/upload-canva-pdf`, {
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
      
      const response = await fetch(`${(window.ENV?.REACT_APP_BACKEND_URL || window.location.origin) || window.location.origin}/api/scrape-canva-pdf`, {
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

  // CHECKLIST → FFE TRANSFER: Transfer ONLY CHECKED items (like walkthrough)
  const handleTransferToFFE = async () => {
    try {
      console.log('🚀 TRANSFER TO FFE: ONLY CHECKED ITEMS');
      
      // Step 1: Collect checked items - INCLUDE manual checks AND items with PICKED/post-picked status
      const checkedItemIds = Array.from(checkedItems);
      const itemsToTransfer = [];
      
      if (filteredProject?.rooms) {
        filteredProject.rooms.forEach(room => {
          room.categories?.forEach(category => {
            category.subcategories?.forEach(subcategory => {
              subcategory.items?.forEach(item => {
                // Include if manually checked OR has PICKED/post-picked status
                const isChecked = checkedItemIds.includes(item.id) || PICKED_OR_BEYOND_STATUSES.includes(item.status);
                if (isChecked) {
                  console.log(`✅ CHECKED ITEM: "${item.name}" (ID: ${item.id}, Status: ${item.status})`);
                  itemsToTransfer.push({
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
      
      console.log(`📝 EXACT COUNT: ${itemsToTransfer.length} CHECKED items to transfer to FFE`);
      console.log('📋 Items:', itemsToTransfer.map(ci => ci.item.name));

      if (itemsToTransfer.length === 0) {
        alert('No checked items found for transfer to FFE.');
        return;
      }
      
      // Confirm transfer
      if (!confirm(`Transfer ${itemsToTransfer.length} checked items to FFE?`)) {
        return;
      }

      // Step 3: Transfer checked items to FFE
      const backendUrl = (window.ENV?.REACT_APP_BACKEND_URL || window.location.origin) || window.location.origin;
      const projectId = filteredProject.id;
      
      let successCount = 0;
      const createdStructures = new Map();
      
      console.log(`🏢 Creating FFE structure for ${itemsToTransfer.length} checked items`);

      // Process each checked item individually
      for (const itemContext of itemsToTransfer) {
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
            quantity: itemContext.item.quantity || '',
            subcategory_id: subcategoryId,
            status: itemContext.item.status || '', // TRANSFER STATUS FROM CHECKLIST
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
      
      {/* SCRAPER CLIPBOARD NOTIFICATION - Shows when data is ready to paste */}
      {scraperClipboard && showScraperNotification && (
        <div className="mb-4 p-4 bg-gradient-to-r from-green-900 to-green-800 border border-green-500 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="text-green-400 font-bold text-lg">📋 SCRAPED DATA READY TO PASTE!</div>
              <div className="text-white text-sm mt-1">
                <span className="font-semibold">{scraperClipboard.name}</span>
                {scraperClipboard.vendor && <span className="text-gray-300"> • {scraperClipboard.vendor}</span>}
                {scraperClipboard.price && <span className="text-green-400"> • ${scraperClipboard.price}</span>}
                {scraperClipboard.finish_color && <span className="text-amber-400"> • {scraperClipboard.finish_color}</span>}
              </div>
              <div className="text-gray-400 text-xs mt-1">👆 Click the <span className="text-green-400 font-bold">📋 PASTE</span> button on any item row to apply this data</div>
            </div>
            <button
              onClick={clearScrapedData}
              className="ml-4 bg-red-600 hover:bg-red-500 text-white px-3 py-1 rounded text-sm"
              title="Clear scraped data"
            >
              ✕ Clear
            </button>
          </div>
        </div>
      )}
      
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
              <option value="Furniture">Furniture & Storage</option>
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
              <option value="ORDERED">ORDERED</option>
              <option value="CHANGE OUT">CHANGE OUT</option>
              <option value="ORDER SAMPLES">ORDER SAMPLES</option>
              <option value="SAMPLES ORDERED">SAMPLES ORDERED</option>
              <option value="SAMPLES ARRIVED">SAMPLES ARRIVED</option>
              <option value="ASK NEIL">ASK NEIL</option>
              <option value="ASK CHARLENE">ASK CHARLENE</option>
              <option value="ASK JALA">ASK JALA</option>
              <option value="GET QUOTE">GET QUOTE</option>
              <option value="WAITING ON QT">WAITING ON QT</option>
              <option value="READY FOR PRESENTATION">READY FOR PRESENTATION</option>
              <option value="APPROVED">APPROVED</option>
              <option value="ON HOLD">ON HOLD</option>
              <option value="ENTER INTO HOUZZ">ENTER INTO HOUZZ</option>
              <option value="ENTER INTO HOUZZ & ORDER SAMPLE">ENTER INTO HOUZZ & ORDER SAMPLE</option>
            </select>
          </div>
          
          {/* Action Buttons - ADD ROOM, DELETE MULTIPLE, CANVA LIVE CHECKLIST, SCANNER, AND TRANSFER */}
          <div className="flex gap-3 flex-wrap">
            {/* DELETE MULTIPLE TOGGLE */}
            {deleteMode ? (
              <div className="flex items-center gap-2">
                <button 
                  onClick={handleDeleteMultiple}
                  disabled={selectedForDelete.size === 0}
                  className={`px-4 py-2 rounded-full font-bold text-sm ${selectedForDelete.size > 0 ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-gray-600 text-gray-400 cursor-not-allowed'}`}
                >
                  🗑️ Delete {selectedForDelete.size} Items
                </button>
                <button 
                  onClick={() => { setDeleteMode(false); setSelectedForDelete(new Set()); }}
                  className="px-4 py-2 rounded-full bg-gray-600 hover:bg-gray-700 text-white font-bold text-sm"
                >
                  ✖ Cancel
                </button>
              </div>
            ) : (
              <button 
                onClick={() => setDeleteMode(true)}
                className="px-4 py-2 rounded-full bg-red-600/20 hover:bg-red-600/40 text-red-400 hover:text-red-300 font-bold text-sm border border-red-600/30"
              >
                🗑️ Delete Multiple
              </button>
            )}
            
            <button 
              onClick={onAddRoom}
              className="px-6 py-2 rounded-full shadow-xl hover:shadow-[#D4A574]/40 transition-all duration-300 transform hover:scale-105 tracking-wide font-bold text-black border border-[#B49B7E]"
              style={{
                background: 'linear-gradient(135deg, #D4A574 0%, #B49B7E 50%, #D4A574 100%)',
                boxShadow: '0 0 20px rgba(212, 165, 116, 0.4), inset 0 0 30px rgba(255, 255, 255, 0.15), inset 0 0 50px rgba(0, 0, 0, 0.2)'
              }}
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
              {/* ROOM HEADER - GRADIENT WITH SHIMMER */}
              <div 
                className="px-4 py-2 text-white font-bold mb-4 border border-[#B49B7E]"
                style={{ 
                  background: `linear-gradient(135deg, ${getRoomColor(room.name)}FF 0%, ${getRoomColor(room.name)}AA 20%, ${getRoomColor(room.name)} 40%, ${getRoomColor(room.name)}AA 80%, ${getRoomColor(room.name)}FF 100%)`,
                  boxShadow: `0 0 35px ${getRoomColor(room.name)}80, inset 0 0 70px rgba(255, 255, 255, 0.16), inset 0 0 110px rgba(0, 0, 0, 0.5)`,
                  textShadow: '0 2px 8px rgba(0, 0, 0, 0.8), 0 0 20px rgba(255, 255, 255, 0.4)'
                }}
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
                    <span 
                      contentEditable={true}
                      suppressContentEditableWarning={true}
                      className="outline-none px-1"
                      onBlur={async (e) => {
                        const newName = e.target.textContent?.trim();
                        if (newName && newName.toUpperCase() !== room.name.toUpperCase()) {
                          try {
                            const backendUrl = window.ENV?.REACT_APP_BACKEND_URL || window.location.origin;
                            const response = await fetch(`${backendUrl}/api/rooms/${room.id}`, {
                              method: 'PUT',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ name: newName.toUpperCase() })
                            });
                            if (response.ok && onReload) {
                              onReload();
                            }
                          } catch (error) {
                            console.error('Failed to update room name:', error);
                          }
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          e.target.blur();
                        }
                      }}
                    >{room.name.toUpperCase()}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {/* ADD ITEM BUTTON - TOP LEVEL */}
                    <button
                      onClick={() => {
                        console.log('🎯 TOP LEVEL ADD ITEM clicked for room:', room.name);
                        // Find first category with subcategories
                        const firstCategory = room.categories?.find(cat => cat.subcategories?.length > 0);
                        if (firstCategory) {
                          setSelectedSubCategoryId(firstCategory.subcategories[0].id);
                          setShowAddItem(true);
                          console.log('🎯 Opening AddItemModal with subcategory:', firstCategory.subcategories[0].id);
                        } else {
                          alert('Please add a category with items first!');
                        }
                      }}
                      className="bg-blue-600 hover:bg-blue-500 text-white text-xs px-3 py-1 rounded transition-colors font-bold"
                      title="Add new item to checklist"
                    >
                      ➕ ADD ITEM
                    </button>
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
                            
                            const response = await fetch(`${(window.ENV?.REACT_APP_BACKEND_URL || window.location.origin) || window.location.origin}/api/import/pdf-links?project_id=${project.id}&room_id=${room.id}`, {
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
                                  const progressRes = await fetch(`${(window.ENV?.REACT_APP_BACKEND_URL || window.location.origin) || window.location.origin}/api/import/pdf-job/${result.job_id}`);
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
                                        
                                        // Refresh the page to show new items
                                        setTimeout(() => {
                                          if (onReload) {
                                            onReload();
                                          }
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
                          const response = await fetch(`${(window.ENV?.REACT_APP_BACKEND_URL || window.location.origin) || window.location.origin}/api/canva/upload-room-images?project_id=${project.id}&room_id=${room.id}`, {
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
                                const progressRes = await fetch(`${(window.ENV?.REACT_APP_BACKEND_URL || window.location.origin) || window.location.origin}/api/canva/upload-job/${result.job_id}`);
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
                      onClick={async () => {
                        const newName = prompt(`Copy room "${room.name}" as:`, `${room.name} (Copy)`);
                        if (newName) {
                          try {
                            const response = await fetch(`${(window.ENV?.REACT_APP_BACKEND_URL || window.location.origin)}/api/rooms/${room.id}/copy?new_name=${encodeURIComponent(newName)}`, {
                              method: 'POST'
                            });
                            if (response.ok) {
                              alert(`✅ Room copied as "${newName}"`);
                              if (onReload) onReload();
                            } else {
                              alert('Failed to copy room');
                            }
                          } catch (error) {
                            alert('Error: ' + error.message);
                          }
                        }
                      }}
                      className="bg-blue-600 text-white text-xs px-3 py-1 rounded hover:bg-blue-700 transition-colors"
                      title="Copy Room"
                    >
                      📋 Copy
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

              {/* ROOM PHOTOS FOLDER - Walkthrough Photos */}
              {isRoomExpanded && roomPhotos[room.id]?.length > 0 && (
                <div className="mb-4 rounded-lg border border-[#D4A574]/30 overflow-hidden" 
                     style={{ background: 'linear-gradient(135deg, rgba(20,20,30,0.95) 0%, rgba(30,30,40,0.9) 100%)' }}>
                  {/* Photo Folder Header */}
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
                        WALKTHROUGH PHOTOS ({roomPhotos[room.id]?.length || 0})
                      </span>
                    </div>
                    <span className="text-[#B49B7E]">
                      {expandedPhotoRooms[room.id] ? '▼' : '▶'}
                    </span>
                  </div>
                  
                  {/* Photo Grid - Expanded View */}
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
                            {photo.metadata?.has_measurements && (
                              <div className="absolute top-1 right-1 bg-green-600 text-white text-xs px-1 rounded">
                                📏
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                      {roomPhotos[room.id]?.length === 0 && (
                        <p className="text-gray-500 text-sm text-center py-4">
                          No walkthrough photos for this room yet.
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}

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
                                {/* CATEGORY HEADER - GREEN GRADIENT WITH SHIMMER */}
                                <div 
                                  className="px-4 py-2 text-white font-bold mb-2 border border-[#B49B7E]"
                                  style={{ 
                                    background: `linear-gradient(135deg, ${getCategoryColor()}EE 0%, ${getCategoryColor()} 25%, ${getCategoryColor()}CC 50%, ${getCategoryColor()} 75%, ${getCategoryColor()}EE 100%)`,
                                    boxShadow: `0 0 28px ${getCategoryColor()}65, inset 0 0 55px rgba(255, 255, 255, 0.14), inset 0 0 95px rgba(0, 0, 0, 0.45)`,
                                    textShadow: '0 2px 6px rgba(0, 0, 0, 0.75), 0 0 16px rgba(255, 255, 255, 0.35)'
                                  }}
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
                                      <span 
                                        contentEditable={true}
                                        suppressContentEditableWarning={true}
                                        className="outline-none px-1"
                                        onBlur={async (e) => {
                                          const newName = e.target.textContent?.trim();
                                          if (newName && newName.toUpperCase() !== category.name.toUpperCase()) {
                                            try {
                                              const backendUrl = window.ENV?.REACT_APP_BACKEND_URL || window.location.origin;
                                              const response = await fetch(`${backendUrl}/api/categories/${category.id}`, {
                                                method: 'PUT',
                                                headers: { 'Content-Type': 'application/json' },
                                                body: JSON.stringify({ name: newName.toUpperCase() })
                                              });
                                              if (response.ok && onReload) {
                                                onReload();
                                              }
                                            } catch (error) {
                                              console.error('Failed to update category name:', error);
                                            }
                                          }
                                        }}
                                        onKeyDown={(e) => {
                                          if (e.key === 'Enter') {
                                            e.preventDefault();
                                            e.target.blur();
                                          }
                                        }}
                                      >{category.name.toUpperCase()}</span>
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
                        {/* SINGLE TABLE FOR ALL SUBCATEGORIES - NO NESTED TABLES */}
                        <table className="w-full border-collapse border border-[#B49B7E] mb-4 shadow-lg shadow-[#B49B7E]/10">
                          <thead>
                            <tr>
                              <th className="border border-[#B49B7E] px-1 py-2 text-xs font-bold text-white w-8" style={{ background: 'linear-gradient(135deg, #8B4444EE 0%, #8B4444 50%, #8B4444EE 100%)' }}>✓</th>
                              <th className="border border-[#B49B7E] px-2 py-2 text-xs font-bold text-white" style={{ background: 'linear-gradient(135deg, #8B4444EE 0%, #8B4444 50%, #8B4444EE 100%)' }}>ITEM</th>
                              <th className="border border-[#B49B7E] px-2 py-2 text-xs font-bold text-white" style={{ background: 'linear-gradient(135deg, #8B4444EE 0%, #8B4444 50%, #8B4444EE 100%)' }}>VENDOR/SKU</th>
                              <th className="border border-[#B49B7E] px-2 py-2 text-xs font-bold text-white w-12" style={{ background: 'linear-gradient(135deg, #8B4444EE 0%, #8B4444 50%, #8B4444EE 100%)' }}>QTY</th>
                              <th className="border border-[#B49B7E] px-2 py-2 text-xs font-bold text-white" style={{ background: 'linear-gradient(135deg, #8B4444EE 0%, #8B4444 50%, #8B4444EE 100%)' }}>SIZE</th>
                              <th className="border border-[#B49B7E] px-2 py-2 text-xs font-bold text-white" style={{ background: 'linear-gradient(135deg, #8B4444EE 0%, #8B4444 50%, #8B4444EE 100%)' }}>FINISH</th>
                              <th className="border border-[#B49B7E] px-2 py-2 text-xs font-bold text-white w-20" style={{ background: 'linear-gradient(135deg, #8B4444EE 0%, #8B4444 50%, #8B4444EE 100%)' }}>COST</th>
                              <th className="border border-[#B49B7E] px-2 py-2 text-xs font-bold text-white" style={{ background: 'linear-gradient(135deg, #8B4444EE 0%, #8B4444 50%, #8B4444EE 100%)' }}>STATUS</th>
                              <th className="border border-[#B49B7E] px-2 py-2 text-xs font-bold text-white w-16" style={{ background: 'linear-gradient(135deg, #8B4444EE 0%, #8B4444 50%, #8B4444EE 100%)' }}>IMAGE</th>
                              <th className="border border-[#B49B7E] px-2 py-2 text-xs font-bold text-white" style={{ background: 'linear-gradient(135deg, #8B4444EE 0%, #8B4444 50%, #8B4444EE 100%)' }}>LINK</th>
                              <th className="border border-[#B49B7E] px-2 py-2 text-xs font-bold text-white" style={{ background: 'linear-gradient(135deg, #8B4444EE 0%, #8B4444 50%, #8B4444EE 100%)' }}>REMARKS</th>
                              <th className="border border-[#B49B7E] px-2 py-2 text-xs font-bold text-white w-16" style={{ background: 'linear-gradient(135deg, #8B4444EE 0%, #8B4444 50%, #8B4444EE 100%)' }}>+</th>
                            </tr>
                          </thead>
                          <tbody>
                        {category.subcategories?.map((subcategory, subIndex) => (
                          <React.Fragment key={subcategory.id || subcategory.name}>
                            {/* SUBCATEGORY HEADER ROW */}
                            <tr style={{ background: 'linear-gradient(135deg, rgba(180, 155, 126, 0.3) 0%, rgba(212, 165, 116, 0.2) 100%)' }}>
                              <td colSpan="12" className="border border-[#B49B7E] px-3 py-2">
                                <div className="flex items-center justify-between">
                                  <span className="text-[#D4A574] font-bold text-sm">
                                    {subcategory.name.toUpperCase()}
                                  </span>
                                  <div className="flex items-center gap-2">
                                    <button
                                      onClick={() => addBlankItem(subcategory.id)}
                                      className="text-[#D4A574] hover:text-white text-xs px-2 py-1 rounded bg-[#D4A574]/20 hover:bg-[#D4A574]/40"
                                    >
                                      + Add Item
                                    </button>
                                    <button
                                      onClick={() => {
                                        handleDeleteSubcategory(subcategory.id);
                                      }}
                                      className="text-red-400 hover:text-red-300 text-xs"
                                    >
                                      🗑️
                                    </button>
                                  </div>
                                </div>
                              </td>
                            </tr>
                                {/* ITEMS UNDER THIS SUBCATEGORY - Items on To-Do/Punch List at TOP with BRIGHT highlighter colors */}
                                {(() => {
                                  // Sort items: Items on INCOMPLETE To-Do or Punch List FIRST, then others
                                  const sortedItems = [...(subcategory.items || [])].sort((a, b) => {
                                    const aTodoInfo = todoLinkedItems.get(a.id);
                                    const aPunchInfo = punchLinkedItems.get(a.id);
                                    const aOnIncompleteList = (aTodoInfo && !aTodoInfo.completed) || (aPunchInfo && !aPunchInfo.completed);
                                    
                                    const bTodoInfo = todoLinkedItems.get(b.id);
                                    const bPunchInfo = punchLinkedItems.get(b.id);
                                    const bOnIncompleteList = (bTodoInfo && !bTodoInfo.completed) || (bPunchInfo && !bPunchInfo.completed);
                                    
                                    if (aOnIncompleteList && !bOnIncompleteList) return -1;
                                    if (!aOnIncompleteList && bOnIncompleteList) return 1;
                                    return 0;
                                  });
                                  
                                  // Count highlighted items for alternating colors
                                  let highlightIndex = 0;
                                  
                                  return sortedItems.map((item, itemIndex) => {
                                    // CRITICAL: Checkbox stays checked for PICKED and ALL post-picked statuses
                                    const isChecked = checkedItems.has(item.id) || PICKED_OR_BEYOND_STATUSES.includes(item.status);
                                    
                                    // Get linked To-Do and Punch info
                                    const todoInfo = todoLinkedItems.get(item.id);
                                    const punchInfo = punchLinkedItems.get(item.id);
                                    const isOnTodo = !!todoInfo;
                                    const isOnPunch = !!punchInfo;
                                    
                                    // Check if the LINKED To-Do or Punch is complete (not the item itself!)
                                    const todoComplete = todoInfo?.completed === true;
                                    const punchComplete = punchInfo?.completed === true;
                                    
                                    // Only highlight if on list AND the linked item is NOT complete
                                    const shouldHighlight = (isOnTodo && !todoComplete) || (isOnPunch && !punchComplete);
                                    
                                    // BRIGHT alternating highlighter colors - ONLY for items on To-Do or Punch List
                                    const highlighterColors = [
                                      '#FFFF00',  // Bright Yellow
                                      '#00FF7F',  // Bright Spring Green
                                      '#FF69B4',  // Hot Pink
                                      '#00BFFF',  // Deep Sky Blue
                                      '#FFA500',  // Bright Orange
                                      '#DA70D6',  // Orchid/Plum
                                    ];
                                    
                                    let rowStyle;
                                    // Text color: BLACK for highlighted rows - use inline style to override CSS
                                    const textColor = shouldHighlight ? '#000000' : '#B49B7E';
                                    const cellStyle = { color: textColor };
                                    const inputStyle = { color: textColor, background: 'transparent', border: 'none', outline: 'none', width: '100%' };
                                    
                                    if (shouldHighlight) {
                                      rowStyle = { background: highlighterColors[highlightIndex % highlighterColors.length] };
                                      highlightIndex++;
                                    } else {
                                      rowStyle = { 
                                        background: itemIndex % 2 === 0 
                                          ? 'linear-gradient(135deg, rgba(0, 0, 0, 0.95) 0%, rgba(30, 30, 30, 0.9) 30%, rgba(15, 15, 25, 0.95) 70%, rgba(0, 0, 0, 0.95) 100%)'
                                          : 'linear-gradient(135deg, rgba(15, 15, 25, 0.95) 0%, rgba(45, 45, 55, 0.9) 30%, rgba(25, 25, 35, 0.95) 70%, rgba(15, 15, 25, 0.95) 100%)'
                                      };
                                    }
                                    
                                    return (
                                      <tr key={item.id} style={rowStyle}>
                                        {/* CHECKBOX - AUTO SET TO PICKED */}
                                        <td className="border border-[#B49B7E] px-1 py-1 text-center w-8">
                                          <input 
                                            type="checkbox" 
                                            className="w-4 h-4 cursor-pointer" 
                                            checked={isChecked}
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
                                                const backendUrl = (window.ENV?.REACT_APP_BACKEND_URL || window.location.origin) || window.location.origin;
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
                                        {/* ITEM - EDITABLE WITH AUTOCOMPLETE + INLINE TO-DO/PUNCH BADGE */}
                                        <td className="border border-[#B49B7E] px-2 py-1 text-sm" style={cellStyle}>
                                          <div className="flex items-center gap-2">
                                            {isOnTodo && !todoComplete && (
                                              <span className="text-xs font-bold px-1.5 py-0.5 rounded bg-blue-600 text-white flex-shrink-0">TO-DO</span>
                                            )}
                                            {isOnPunch && !punchComplete && (
                                              <span className="text-xs font-bold px-1.5 py-0.5 rounded bg-red-600 text-white flex-shrink-0">PUNCH</span>
                                            )}
                                            <InlineProductAutocomplete
                                              value={item.name}
                                              onChange={(newName) => {
                                                if (newName !== item.name) {
                                                  handleUpdateItemField(item.id, 'name', newName);
                                                }
                                              }}
                                              onProductSelect={async (product) => {
                                              // Auto-fill all fields when product is selected
                                              console.log('🎯 Product selected from autocomplete:', product);
                                              
                                              // Check if this product has variants (other finishes/colors)
                                              try {
                                                const backendUrl = window.ENV?.REACT_APP_BACKEND_URL || window.location.origin;
                                                const response = await fetch(`${backendUrl}/api/product-variants/${encodeURIComponent(product.sku)}`);
                                                const variantData = await response.json();
                                                
                                                if (variantData.success && variantData.variant_count > 1) {
                                                  // Has multiple variants - show picker
                                                  console.log('📦 Product has variants:', variantData.variant_count);
                                                  setVariantPickerSku(product.sku);
                                                  setPendingVariantItem(item);
                                                  setPendingVariantProduct(product);
                                                  setShowVariantPicker(true);
                                                  return;
                                                }
                                              } catch (error) {
                                                console.log('No variants or error checking:', error);
                                              }
                                              
                                              // No variants - apply directly using batch update
                                              const updates = {
                                                name: product.name,
                                                vendor: product.vendor,
                                                sku: product.sku,
                                                cost: product.cost || product.price || 0
                                              };
                                              if (product.image_url) {
                                                updates.image_url = product.image_url;
                                              }
                                              // Also save dimensions (size) and product link if available
                                              if (product.dimensions) {
                                                updates.size = product.dimensions;
                                              }
                                              if (product.product_link) {
                                                updates.product_link = product.product_link;
                                              }
                                              handleBatchUpdateItem(item.id, updates);
                                            }}
                                            placeholder="Type to search products..."
                                            className="text-sm"
                                            style={{ color: textColor }}
                                          />
                                          </div>
                                        </td>
                                  
                                  {/* VENDOR/SKU - EDITABLE WITH DROPDOWN */}
                                  <td className="border border-[#B49B7E] px-2 py-1 text-sm" style={cellStyle}>
                                    <div className="flex flex-col gap-1">
                                      <VendorDropdown
                                        value={item.vendor || ''}
                                        onChange={(newVendor) => {
                                          if (newVendor !== item.vendor) {
                                            handleUpdateItemField(item.id, 'vendor', newVendor);
                                          }
                                        }}
                                        className="text-sm"
                                        style={{ color: textColor }}
                                      />
                                      <input
                                        type="text"
                                        value={item.sku || ''}
                                        onChange={(e) => handleUpdateItemField(item.id, 'sku', e.target.value)}
                                        placeholder="SKU..."
                                        className="w-full bg-transparent text-xs outline-none border-t border-gray-600 pt-1"
                                        style={{ color: textColor }}
                                      />
                                    </div>
                                  </td>
                                  
                                  {/* QTY - EDITABLE */}
                                  <td className="border border-[#B49B7E] px-2 py-1 text-sm text-center" style={cellStyle}>
                                    <input
                                      type="text"
                                      defaultValue={item.quantity || ''}
                                      className="w-full bg-transparent text-sm text-center outline-none focus:ring-1 focus:ring-[#D4A574] rounded"
                                      style={{ color: textColor }}
                                      onBlur={(e) => {
                                        const newValue = parseInt(e.target.value) || 0;
                                        if (newValue !== item.quantity) {
                                          handleUpdateItemField(item.id, 'quantity', newValue);
                                          item.quantity = newValue;
                                        }
                                      }}
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                          e.preventDefault();
                                          e.target.blur();
                                        }
                                      }}
                                      onClick={(e) => e.target.select()}
                                    />
                                  </td>
                                  
                                  {/* SIZE - EDITABLE */}
                                  <td className="border border-[#B49B7E] px-2 py-1 text-sm" style={cellStyle}>
                                    <input
                                      type="text"
                                      defaultValue={item.size || ''}
                                      className="w-full bg-transparent text-sm outline-none focus:ring-1 focus:ring-[#D4A574] rounded"
                                      style={{ color: textColor }}
                                      onBlur={(e) => {
                                        const newValue = e.target.value;
                                        if (newValue !== item.size) {
                                          handleUpdateItemField(item.id, 'size', newValue);
                                          item.size = newValue;
                                        }
                                      }}
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                          e.preventDefault();
                                          e.target.blur();
                                        }
                                      }}
                                    />
                                  </td>
                                  
                                  {/* FINISH/COLOR - EDITABLE WITH SWATCH IMAGE */}
                                  <td className="border border-[#B49B7E] px-2 py-1 text-sm" style={cellStyle}>
                                    <div className="flex items-center gap-2">
                                      {/* Swatch Image */}
                                      {item.finish_image && (
                                        <img 
                                          src={item.finish_image} 
                                          alt={item.finish_color || 'Swatch'} 
                                          className="w-8 h-8 rounded border border-[#B49B7E] object-cover flex-shrink-0"
                                          onError={(e) => { e.target.style.display = 'none'; }}
                                        />
                                      )}
                                      {/* Color Name - Editable */}
                                      <input
                                        type="text"
                                        defaultValue={item.finish_color || ''}
                                        className="flex-1 bg-transparent text-sm outline-none focus:ring-1 focus:ring-[#D4A574] rounded"
                                        style={{ color: textColor }}
                                        onBlur={(e) => {
                                          const newValue = e.target.value;
                                          if (newValue !== item.finish_color) {
                                            handleUpdateItemField(item.id, 'finish_color', newValue);
                                            item.finish_color = newValue;
                                          }
                                        }}
                                        onKeyDown={(e) => {
                                          if (e.key === 'Enter') {
                                            e.preventDefault();
                                            e.target.blur();
                                          }
                                        }}
                                      />
                                    </div>
                                  </td>
                                  
                                  {/* COST - EDITABLE INLINE WITH OPTIONAL CALCULATOR */}
                                  <td 
                                    className="border border-[#B49B7E] px-2 py-1 text-sm"
                                    style={cellStyle}
                                  >
                                    <div className="flex items-center gap-1">
                                      <span style={{ color: textColor }}>$</span>
                                      <input
                                        type="text"
                                        key={`cost-${item.id}-${item.cost}`}
                                        defaultValue={item.cost || ''}
                                        className="flex-1 bg-transparent text-sm outline-none min-w-[40px] border-none focus:ring-1 focus:ring-[#D4A574] rounded px-1"
                                        style={{ color: textColor, background: 'transparent' }}
                                        placeholder="0"
                                        onBlur={(e) => {
                                          const newValue = parseFloat(e.target.value.replace(/[^0-9.]/g, '')) || 0;
                                          if (newValue !== item.cost) {
                                            handleUpdateItemField(item.id, 'cost', newValue);
                                            item.cost = newValue; // Update local state
                                          }
                                        }}
                                        onKeyDown={(e) => {
                                          if (e.key === 'Enter') {
                                            e.preventDefault();
                                            e.target.blur();
                                          }
                                        }}
                                        onClick={(e) => e.target.select()}
                                      />
                                      <button
                                        onClick={() => openCalculator(item, category.name)}
                                        className="text-[#8B7355] hover:text-[#D4A574] text-xs ml-1 opacity-50 hover:opacity-100"
                                        title="Open calculator"
                                      >
                                        🧮
                                      </button>
                                    </div>
                                  </td>
                                  
                                  {/* STATUS - DROPDOWN WITH GRADIENT SHIMMER CELL */}
                                  <td 
                                    className="border border-[#B49B7E] px-1 py-1 text-white text-sm"
                                    style={{ 
                                      background: item.status ? `linear-gradient(135deg, ${getStatusColor(item.status)}FF 0%, ${getStatusColor(item.status)}AA 20%, ${getStatusColor(item.status)} 40%, ${getStatusColor(item.status)}AA 80%, ${getStatusColor(item.status)}FF 100%)` : 'transparent',
                                      boxShadow: item.status ? `0 0 15px ${getStatusColor(item.status)}40, inset 0 0 30px rgba(255, 255, 255, 0.1), inset 0 0 50px rgba(0, 0, 0, 0.3)` : 'none',
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
                                      <option value="ORDERED">ORDERED</option>
                                      <option value="CHANGE OUT">CHANGE OUT</option>
                                      <option value="ORDER SAMPLES">ORDER SAMPLES</option>
                                      <option value="SAMPLES ORDERED">SAMPLES ORDERED</option>
                                      <option value="SAMPLES ARRIVED">SAMPLES ARRIVED</option>
                                      <option value="ASK NEIL">ASK NEIL</option>
                                      <option value="ASK CHARLENE">ASK CHARLENE</option>
                                      <option value="ASK JALA">ASK JALA</option>
                                      <option value="GET QUOTE">GET QUOTE</option>
                                      <option value="WAITING ON QT">WAITING ON QT</option>
                                      <option value="READY FOR PRESENTATION">READY FOR PRESENTATION</option>
                                      <option value="APPROVED">APPROVED</option>
                                      <option value="ON HOLD">ON HOLD</option>
                                      <option value="ENTER INTO HOUZZ">ENTER INTO HOUZZ</option>
                                      <option value="ENTER INTO HOUZZ & ORDER SAMPLE">ENTER INTO HOUZZ & ORDER SAMPLE</option>
                                    </select>
                                  </td>
                                  
                                  {/* IMAGE - With upload option */}
                                  <td className="border border-[#B49B7E] px-2 py-1 text-[#D4C5A9] text-sm w-20">
                                    <div className="relative group">
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
                                        <label className="w-12 h-12 bg-gray-700 hover:bg-gray-600 flex flex-col items-center justify-center text-xs cursor-pointer rounded border border-dashed border-gray-500 hover:border-[#D4A574]">
                                          <span className="text-lg">📷</span>
                                          <span className="text-[8px] text-gray-400">Upload</span>
                                          <input 
                                            type="file" 
                                            accept="image/*"
                                            className="hidden"
                                            onChange={(e) => {
                                              if (e.target.files[0]) {
                                                handleImageUpload(item.id, e.target.files[0]);
                                              }
                                            }}
                                          />
                                        </label>
                                      )}
                                      {/* Replace image button - shows on hover when image exists */}
                                      {item.image_url && (
                                        <label className="absolute -bottom-1 -right-1 w-5 h-5 bg-[#D4A574] hover:bg-[#c49564] rounded-full flex items-center justify-center cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity" title="Replace image">
                                          <span className="text-[10px]">📷</span>
                                          <input 
                                            type="file" 
                                            accept="image/*"
                                            className="hidden"
                                            onChange={(e) => {
                                              if (e.target.files[0]) {
                                                handleImageUpload(item.id, e.target.files[0]);
                                              }
                                            }}
                                          />
                                        </label>
                                      )}
                                    </div>
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
                                  
                                  {/* REMARKS - EDITABLE INPUT */}
                                  <td className="border border-[#B49B7E] px-2 py-1 text-sm" style={cellStyle}>
                                    <input
                                      type="text"
                                      defaultValue={item.remarks || ''}
                                      placeholder="Add remarks..."
                                      className="w-full bg-transparent text-sm outline-none focus:ring-1 focus:ring-[#D4A574] rounded px-1"
                                      style={{ color: textColor }}
                                      onBlur={(e) => {
                                        const newValue = e.target.value?.trim() || '';
                                        if (newValue !== (item.remarks || '')) {
                                          console.log('💾 Saving remarks:', newValue);
                                          handleUpdateItemField(item.id, 'remarks', newValue);
                                          item.remarks = newValue;
                                        }
                                      }}
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                          e.preventDefault();
                                          e.target.blur();
                                        }
                                      }}
                                    />
                                  </td>
                                  
                                  {/* ACTION BUTTONS: Select for Delete / Add, Alternatives, Delete */}
                                  <td className="border border-[#B49B7E] px-1 py-1 text-center w-20">
                                    <div className="flex items-center justify-center gap-1">
                                      {/* DELETE MODE - Show selection checkbox */}
                                      {deleteMode && (
                                        <input
                                          type="checkbox"
                                          checked={selectedForDelete.has(item.id)}
                                          onChange={() => toggleSelectForDelete(item.id)}
                                          className="w-4 h-4 accent-red-500 cursor-pointer"
                                          title="Select for deletion"
                                        />
                                      )}
                                      {!deleteMode && (
                                        <>
                                          <button
                                            onClick={() => addBlankItem(subcategory.id)}
                                            className="text-green-400 hover:text-green-300 text-sm font-bold"
                                            title="Add New Item"
                                          >
                                            +
                                          </button>
                                          <button
                                            onClick={() => {
                                              setAlternativesItem({...item, category_name: category.name});
                                              setShowAlternatives(true);
                                            }}
                                            className="text-[#D4A574] hover:text-[#E8D4B8] text-sm"
                                            title="Find Alternatives"
                                          >
                                            ✨
                                          </button>
                                          {/* PASTE BUTTON - Shows when scraper data is available */}
                                          <button
                                            onClick={() => scraperClipboard && handlePasteScrapedData(item.id)}
                                            disabled={!scraperClipboard}
                                            className={`text-sm px-2 py-1 rounded font-bold ${
                                              scraperClipboard 
                                                ? 'bg-green-600 hover:bg-green-500 text-white animate-pulse cursor-pointer' 
                                                : 'bg-gray-700 text-gray-500 opacity-50 cursor-not-allowed'
                                            }`}
                                            title={scraperClipboard ? `📋 Paste: ${scraperClipboard.name}` : 'No data to paste - scrape a product first'}
                                          >
                                            📋 PASTE
                                          </button>
                                          <button
                                            onClick={() => handleDeleteItem(item.id)}
                                            className="text-red-400 hover:text-red-300 text-sm"
                                            title="Delete Item"
                                          >
                                            🗑️
                                          </button>
                                        </>
                                      )}
                                    </div>
                                  </td>
                                </tr>
                                    );
                                  });
                                })()}
                          </React.Fragment>
                        ))}
                          </tbody>
                        </table>

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
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              console.log('🎯 ADD ITEM clicked for category:', category?.name);
                              console.log('🎯 Subcategories:', category?.subcategories);
                              if (category?.subcategories?.length > 0) {
                                const subId = category.subcategories[0].id;
                                console.log('🎯 Setting subcategory ID:', subId);
                                setSelectedSubCategoryId(subId);
                                setShowAddItem(true);
                              } else {
                                alert('This category has no subcategories. Please add a subcategory first or contact support.');
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
      {showAddItem && (
        <AddItemModal
          onClose={() => {
            setShowAddItem(false);
            setSelectedSubCategoryId(null);
          }}
          onSubmit={handleAddItem}
          availableVendors={vendorTypes}
          availableStatuses={itemStatuses}
          itemStatuses={itemStatuses}
          vendorTypes={vendorTypes}
          projectId={project?.id}
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

      {/* CALCULATOR POPUP */}
      <CalculatorPopup
        isOpen={showCalculator}
        onClose={() => {
          setShowCalculator(false);
          setCalculatorItem(null);
        }}
        onCalculate={handleCostCalculated}
        itemName={calculatorItem?.name || ''}
        categoryName={calculatorCategory}
        currentCost={calculatorItem?.cost || 0}
      />
      
      {/* PRODUCT VARIANT PICKER */}
      {showVariantPicker && variantPickerSku && (
        <ProductVariantPicker
          baseSku={variantPickerSku}
          currentSelection={pendingVariantProduct?.sku}
          onSelectVariant={(selectedVariant) => {
            // Apply the selected variant to the item
            if (pendingVariantItem) {
              const updates = {
                name: selectedVariant.name || pendingVariantProduct?.name,
                vendor: pendingVariantProduct?.vendor,
                sku: selectedVariant.sku,
                selected_variant_sku: selectedVariant.sku,
                cost: selectedVariant.cost || selectedVariant.price || 0,
                finish_color: selectedVariant.finish_names?.join(', ') || '',
              };
              if (selectedVariant.image_url) {
                updates.image_url = selectedVariant.image_url;
              }
              if (selectedVariant.dimensions) {
                updates.size = selectedVariant.dimensions;
              }
              if (selectedVariant.product_link) {
                updates.product_link = selectedVariant.product_link;
              }
              handleBatchUpdateItem(pendingVariantItem.id, updates);
            }
            // Close picker
            setShowVariantPicker(false);
            setVariantPickerSku(null);
            setPendingVariantItem(null);
            setPendingVariantProduct(null);
          }}
          onClose={() => {
            // If closed without selection, still apply the base product
            if (pendingVariantItem && pendingVariantProduct) {
              const updates = {
                name: pendingVariantProduct.name,
                vendor: pendingVariantProduct.vendor,
                sku: pendingVariantProduct.sku,
                cost: pendingVariantProduct.cost || pendingVariantProduct.price || 0
              };
              if (pendingVariantProduct.image_url) {
                updates.image_url = pendingVariantProduct.image_url;
              }
              handleBatchUpdateItem(pendingVariantItem.id, updates);
            }
            setShowVariantPicker(false);
            setVariantPickerSku(null);
            setPendingVariantItem(null);
            setPendingVariantProduct(null);
          }}
        />
      )}
      
      {/* PHOTO VIEWER MODAL */}
      {selectedPhotoView && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.95)' }}
          onClick={() => setSelectedPhotoView(null)}
        >
          <div 
            className="relative max-w-5xl max-h-[90vh] rounded-lg overflow-hidden border-2 border-[#D4A574]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button 
              onClick={() => setSelectedPhotoView(null)}
              className="absolute top-4 right-4 z-10 bg-black/70 text-white w-10 h-10 rounded-full flex items-center justify-center hover:bg-black transition-colors text-xl"
            >
              ✕
            </button>
            
            {/* Photo Image */}
            <img 
              src={selectedPhotoView.photo_data || selectedPhotoView.url || selectedPhotoView.image_url} 
              alt={selectedPhotoView.file_name || 'Walkthrough Photo'}
              className="max-w-full max-h-[85vh] object-contain"
            />
            
            {/* Photo Info Footer */}
            <div 
              className="absolute bottom-0 left-0 right-0 p-4"
              style={{ background: 'linear-gradient(transparent, rgba(0,0,0,0.9))' }}
            >
              <div className="flex items-center justify-between text-white">
                <div>
                  <p className="text-[#D4A574] font-semibold">
                    {selectedPhotoView.metadata?.room_name || 'Room Photo'}
                  </p>
                  <p className="text-gray-400 text-sm">
                    {selectedPhotoView.file_name || 'Walkthrough capture'}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  {selectedPhotoView.metadata?.has_measurements && (
                    <span className="bg-green-600 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
                      📏 Has Measurements
                    </span>
                  )}
                  {selectedPhotoView.metadata?.timestamp && (
                    <span className="text-gray-400 text-sm">
                      {new Date(selectedPhotoView.metadata.timestamp).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SMART ALTERNATIVES MODAL */}
      {showAlternatives && alternativesItem && (
        <SmartAlternatives
          item={alternativesItem}
          onClose={() => {
            setShowAlternatives(false);
            setAlternativesItem(null);
          }}
          onSelectAlternative={(alt) => {
            // Update the item with the alternative's info
            console.log('Selected alternative:', alt);
            // Could auto-fill the item fields here
            setShowAlternatives(false);
            setAlternativesItem(null);
          }}
        />
      )}
    </div>
  );
};

export default ExactChecklistSpreadsheet;
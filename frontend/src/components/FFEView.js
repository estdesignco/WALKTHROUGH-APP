import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import AddItemModal from './AddItemModal';
import AdvancedFFEFeatures from './AdvancedFFEFeatures';

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
  const [expandedRooms, setExpandedRooms] = useState({});
  const [expandedCategories, setExpandedCategories] = useState({});

  // FILTER STATE - MAKE IT ACTUALLY WORK
  const [filteredProject, setFilteredProject] = useState(project);
  
  // ✅ Search and Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRoom, setSelectedRoom] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedVendor, setSelectedVendor] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedCarrier, setSelectedCarrier] = useState('');

  // ACTUAL API CALLS - WITH PROPER ERROR HANDLING
  // Handle status change with improved error handling
  const handleStatusChange = async (itemId, newStatus) => {
    console.log('🔄 FFE status change request:', { itemId, newStatus });
    
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
        console.log('✅ FFE status updated successfully');
        // Use onReload instead of window.location.reload to prevent navigation issues
        if (onReload) {
          console.log('🔄 Calling onReload function');
          onReload();
        } else {
          console.warn('⚠️ No onReload function provided');
        }
      } else {
        const errorData = await response.text();
        console.error('❌ FFE status update failed:', response.status, errorData);
        alert(`Failed to update status: ${response.status} ${errorData}`);
      }
    } catch (error) {
      console.error('❌ FFE status update error:', error);
      alert(`Error updating status: ${error.message}`);
    }
  };

  const handleCarrierChange = async (itemId, newCarrier) => {
    console.log('🔄 Carrier change request:', { itemId, newCarrier });
    
    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL || window.location.origin}/api/items/${itemId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ carrier: newCarrier })
      });
      
      if (response.ok) {
        console.log('✅ Carrier updated successfully, reloading...');
        if (onReload) {
          onReload();
        }
      } else {
        const errorData = await response.text();
        console.error('❌ Carrier update failed:', response.status, errorData);
        console.error(`Failed to update carrier: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.error('❌ Carrier update error:', error);
      console.error(`Error updating carrier: ${error.message}`);
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
        const backendUrl = process.env.REACT_APP_BACKEND_URL || window.location.origin;
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
        console.error('Please expand a category first to add items to it.');
        return;
      }

      const backendUrl = process.env.REACT_APP_BACKEND_URL || window.location.origin;
      
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
        // Force reload to show the new item
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
      console.error(`Failed to add item: ${error.message}`);
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
      const backendUrl = process.env.REACT_APP_BACKEND_URL || window.location.origin;
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
      console.log('🗑️ FFE DELETING ITEM:', itemId);
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
        console.log('✅ FFE item deleted successfully');
        alert('✅ Item deleted successfully!');
        
        // Force reload to show updated data
        if (onReload) {
          console.log('🔄 Calling onReload after successful FFE delete');
          await onReload();
        }
      } else {
        const errorText = await response.text();
        console.error('❌ FFE Delete failed with status:', response.status, errorText);
        alert(`❌ Delete failed: ${response.status} - ${errorText}`);
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (error) {
      console.error('❌ Error deleting FFE item:', error);
      alert('❌ Failed to delete item: ' + error.message);
    }
  };

  // Handle adding a new room - SIMPLE VERSION LIKE BEFORE
  const handleAddRoom = () => {
    if (onAddRoom) {
      onAddRoom();
    }
  };

  // Handle adding a new category WITH ALL SUBCATEGORIES AND ITEMS
  const handleAddCategory = async (roomId, categoryName) => {
    try {
      console.log(`🚀 FFE ADD CATEGORY: Creating comprehensive '${categoryName}' with ALL subcategories and items`);
      
      // Use the new comprehensive endpoint that auto-populates with ALL items and subcategories
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL || window.location.origin}/api/categories/comprehensive?room_id=${roomId}&category_name=${encodeURIComponent(categoryName)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.ok) {
        const newCategory = await response.json();
        console.log(`✅ FFE SUCCESS: Created comprehensive category '${categoryName}' with ${newCategory.subcategories?.length || 0} subcategories`);
        
        alert(`✅ Added comprehensive category '${categoryName}' with all subcategories and items!`);
        
        // Reload to show the new category
        window.location.reload();
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

  // Drag and drop functionality removed

  // Handle drag and drop for rooms and categories
  const handleDragEnd = async (result) => {
    if (!result.destination) return;

    const { source, destination, type } = result;

    if (type === 'room') {
      console.log('🔄 Reordering rooms...');
      
      // Update backend room order
      try {
        const response = await fetch(`${process.env.REACT_APP_BACKEND_URL || window.location.origin}/api/rooms/reorder`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            source_index: source.index,
            destination_index: destination.index,
            project_id: project.id
          })
        });
        
        if (response.ok) {
          console.log('✅ Room order updated');
          // Reload to show changes
          if (onReload) onReload();
        }
      } catch (err) {
        console.error('❌ Error updating room order:', err);
      }
    }
    
    if (type === 'category') {
      console.log('🔄 Reordering categories...');
      
      // Update backend category order  
      try {
        const roomId = source.droppableId.replace('categories-', '');
        const response = await fetch(`${process.env.REACT_APP_BACKEND_URL || window.location.origin}/api/categories/reorder`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            room_id: roomId,
            source_index: source.index,
            destination_index: destination.index
          })
        });
        
        if (response.ok) {
          console.log('✅ Category order updated');
          if (onReload) onReload();
        }
      } catch (err) {
        console.error('❌ Error updating category order:', err);
      }
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

  // Handle item field changes - FIXES CURSOR JUMPING BUG
  const handleItemFieldChange = async (itemId, field, value) => {
    console.log('🔄 Item field change request:', { itemId, field, value });
    
    try {
      const backendUrl = process.env.REACT_APP_BACKEND_URL || window.location.origin;
      console.log('🌐 Using backend URL:', backendUrl);
      
      const response = await fetch(`${backendUrl}/api/items/${itemId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: value })
      });
      
      console.log('📡 Response status:', response.status, response.statusText);
      
      if (response.ok) {
        console.log(`✅ Item ${field} updated successfully`);
        // Use onReload instead of window.location.reload to prevent navigation issues
        if (onReload) {
          console.log('🔄 Calling onReload function');
          onReload();
        } else {
          console.warn('⚠️ No onReload function provided');
        }
      } else {
        const errorData = await response.text();
        console.error(`❌ Item ${field} update failed:`, response.status, errorData);
        alert(`Failed to update ${field}: ${response.status} ${errorData}`);
      }
    } catch (error) {
      console.error(`❌ Item ${field} update error:`, error);
      alert(`Error updating ${field}: ${error.message}`);
    }
  };

  // Handle tracking items
  const handleTrackItem = async (item) => {
    if (!item.tracking_number) {
      console.error('❌ No tracking number available');
      return;
    }

    try {
      const backendUrl = process.env.REACT_APP_BACKEND_URL || window.location.origin;
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

  // MUTED ROOM COLORS FOR FFE - CONSISTENT WITH OTHER SHEETS
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

  const getCategoryColor = () => '#065F46';  // Dark green
  const getMainHeaderColor = () => '#7F1D1D';  // Dark red for main headers
  const getAdditionalInfoColor = () => '#92400E';  // Brown for ADDITIONAL INFO.
  const getShippingInfoColor = () => '#6B21A8';  // Purple for SHIPPING INFO.
  const getNotesActionsColor = () => '#7F1D1D';  // Red for NOTES and ACTIONS

  // Get status color
  const getStatusColor = (status) => {
    const colors = {
      '': '#6B7280',                        // Gray for blank/default
      'TO BE SELECTED': '#6B7280',          // Gray
      'RESEARCHING': '#3B82F6',             // Blue
      'PENDING APPROVAL': '#F59E0B',        // Amber
      'APPROVED': '#10B981',                // Emerald
      'ORDERED': '#10B981',                 // Emerald
      'PICKED': '#FFD700',                  // Gold - but user wants this NOT as default
      'CONFIRMED': '#10B981',               // Emerald
      'IN PRODUCTION': '#F97316',           // Orange
      'SHIPPED': '#3B82F6',                 // Blue
      'IN TRANSIT': '#3B82F6',              // Blue  
      'OUT FOR DELIVERY': '#3B82F6',        // Blue
      'DELIVERED TO RECEIVER': '#8B5CF6',   // Violet
      'DELIVERED TO JOB SITE': '#8B5CF6',   // Violet
      'RECEIVED': '#8B5CF6',                // Violet
      'READY FOR INSTALL': '#10B981',       // Emerald
      'INSTALLING': '#10B981',              // Emerald
      'INSTALLED': '#10B981',               // Emerald
      'ON HOLD': '#EF4444',                 // Red
      'BACKORDERED': '#EF4444',             // Red
      'DAMAGED': '#EF4444',                 // Red
      'RETURNED': '#EF4444',                // Red
      'CANCELLED': '#EF4444'                // Red
    };
    return colors[status] || '#6B7280';
  };

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
      'RETURNED TO SENDER': '#7F1D1D'
    };
    return deliveryColors[status] || '#FEF08A';
  };

  // FORCE VISIBLE DEBUG - Show component is rendering
  console.log('🔍 ExactFFESpreadsheet rendering with:', { project, roomsCount: project?.rooms?.length });

  // ALWAYS show debug info temporarily
  if (!project) {
    return (
      <div className="text-center text-red-400 py-8 bg-red-900 m-4 p-4 rounded">
        <p className="text-lg">🚨 ExactFFESpreadsheet: NO PROJECT DATA</p>
        <p className="text-sm mt-2">Component is rendering but project is null/undefined</p>
      </div>
    );
  }

  if (!project.rooms) {
    return (
      <div className="text-center text-orange-400 py-8 bg-orange-900 m-4 p-4 rounded">
        <p className="text-lg">🚨 ExactFFESpreadsheet: NO ROOMS PROPERTY</p>
        <p className="text-sm mt-2">Project exists but has no 'rooms' property</p>
        <p className="text-xs mt-1">Project keys: {Object.keys(project).join(', ')}</p>
      </div>
    );
  }

  if (project.rooms.length === 0) {
    return (
      <div className="w-full p-4" style={{ backgroundColor: '#0F172A' }}>
        <div className="text-center text-yellow-400 py-8 bg-yellow-900 m-4 p-4 rounded">
          <p className="text-lg">🏠 No Rooms Available</p>
          <p className="text-sm mt-2">This project has {project.rooms?.length || 0} rooms</p>
          <div className="mt-4">
            <button 
              onClick={handleAddRoom}
              className="px-6 py-3 bg-amber-600 hover:bg-amber-700 text-[#D4C5A9] rounded font-medium"
            >
              + ADD FIRST ROOM
            </button>
          </div>
        </div>
      </div>
    );
  }

  // If we get here, we have valid data - show success message
  console.log('✅ ExactFFESpreadsheet: Valid project data, proceeding to render spreadsheet');

  return (
    <div className="w-full" style={{ backgroundColor: '#0F172A' }}>
      
      {/* SEARCH AND FILTER SECTION - MATCHING CHECKLIST AND WALKTHROUGH */}
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
              {project.rooms.map(room => (
                <option key={room.id} value={room.id}>{room.name}</option>
              ))}
            </select>
            
            <select 
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 rounded bg-gray-900/50 text-[#D4A574] border border-[#D4A574]/50 focus:border-[#D4A574] focus:outline-none"
            >
              <option value="">All Categories</option>
              {availableCategories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
            
            <select 
              value={selectedVendor}
              onChange={(e) => setSelectedVendor(e.target.value)}
              className="px-3 py-2 rounded bg-gray-900/50 text-[#D4A574] border border-[#D4A574]/50 focus:border-[#D4A574] focus:outline-none"
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
              className="px-3 py-2 rounded bg-gray-900/50 text-[#D4A574] border border-[#D4A574]/50 focus:border-[#D4A574] focus:outline-none"
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
              className="px-3 py-2 rounded bg-gray-900/50 text-[#D4A574] border border-[#D4A574]/50 focus:border-[#D4A574] focus:outline-none"
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
          </div>
          
          {/* Action Buttons - ADD ROOM AND TRANSFER */}
          <div className="flex gap-3">
            <button 
              onClick={handleAddRoom}
              className="bg-gradient-to-r from-[#B49B7E] to-[#A08B6F] hover:from-[#A08B6F] hover:to-[#8B7355] px-6 py-2 rounded-full shadow-xl hover:shadow-[#B49B7E]/30 transition-all duration-300 transform hover:scale-105 tracking-wide font-medium border border-[#D4C5A9]/20 text-[#D4C5A9]"
            >
              ✚ ADD ROOM
            </button>
            <button 
              onClick={() => {
                console.log('🚀 FF&E Filter Transfer button clicked');
                alert('Transfer functionality will be implemented next.');
              }}
              className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-500 hover:to-green-600 px-6 py-2 rounded-full shadow-xl hover:shadow-green-500/30 transition-all duration-300 transform hover:scale-105 tracking-wide font-medium border border-green-500/20 text-[#D4C5A9]"
            >
              → TRANSFER FROM CHECKLIST
            </button>
          </div>
        </div>
      </div>

      {/* SPREADSHEET CONTAINER - EXACT SAME TREATMENT AS GRAPHS */}
      <div className="rounded-2xl shadow-xl backdrop-blur-sm p-6 border border-[#D4A574]/20 mb-6" 
           style={{
             background: 'linear-gradient(135deg, rgba(0,0,0,0.95) 0%, rgba(30,30,30,0.9) 30%, rgba(0,0,0,0.95) 100%)'
           }}>
        
        {/* ORIGINAL TABLE STRUCTURE - DO NOT CHANGE */}
        <div className="w-full overflow-x-auto" style={{ backgroundColor: 'rgba(15,23,42,0.8)', touchAction: 'pan-x' }}>
          <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch', minWidth: '1200px' }}>
            
            <div className="w-full" style={{ touchAction: 'pan-x pan-y' }}>
              <table className="w-full border-collapse border border-[#D4A574]">
                  
                  <thead>
                    {/* EMPTY HEADER FOR STRUCTURE */}
                  </thead>

                  {/* TABLE BODY - Keep original hierarchical structure */}
                  <tbody>
                {/* USE FILTERED PROJECT DATA */}
                {(filteredProject || project).rooms.map((room, roomIndex) => {
                  const isRoomExpanded = expandedRooms[room.id];
                  console.log(`🏠 RENDERING ROOM ${roomIndex}: ${room.name} with ${room.categories?.length || 0} categories`);
                  
                  return (
                              <React.Fragment key={room.id}>
                                {/* ROOM HEADER ROW - Full width like your screenshots */}
                                <tr>
                                  <td colSpan="12" 
                                      className="border border-[#D4A574] px-3 py-2 text-[#D4C5A9] text-sm font-bold"
                                      style={{ backgroundColor: getRoomColor(room.name) }}>
                                    <div className="flex justify-between items-center">
                                      <div className="flex items-center gap-2">
                                        <button
                                          onClick={() => toggleRoomExpansion(room.id)}
                                          className="text-[#D4C5A9] hover:text-[#D4A574]"
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
                                  <td className="border border-[#D4A574] px-2 py-2 text-center"
                                      style={{ backgroundColor: getRoomColor(room.name) }}>
                                    <button
                                      onClick={() => handleAddRoom()}
                                      className="text-green-300 hover:text-green-100 text-sm font-bold"
                                      title="Add Room"
                                    >
                                      +
                                    </button>
                                  </td>
                                </tr>

                                {/* ROOM CATEGORIES - Only show when expanded */}
                                {isRoomExpanded && (
                                      <React.Fragment>
                                        {room.categories?.map((category, catIndex) => {
                                          const isCategoryExpanded = expandedCategories[category.id];
                                          console.log(`📁 RENDERING CATEGORY ${catIndex}: ${category.name} with ${category.subcategories?.length || 0} subcategories`);
                                          
                                          return (
                                                <React.Fragment key={category.id}>
                                                  {/* CATEGORY HEADER ROW */}
                                                  <tr>
                                                    <td colSpan="14" 
                                                        className="border border-[#D4A574] px-4 py-2 text-[#D4C5A9] text-sm font-bold"
                                                        style={{ backgroundColor: getCategoryColor() }}>
                                                      <div className="flex items-center gap-2">
                                                        <button
                                                          onClick={() => toggleCategoryExpansion(category.id)}
                                                          className="text-[#D4C5A9] hover:text-[#D4A574]"
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
                                                      {/* RED HEADER GOES AFTER CATEGORY - LAST IN HIERARCHY */}
                                                      <tr>
                                                        <td colSpan="4" className="border-gray-400 px-2 py-1 text-xs font-bold text-[#D4C5A9] text-center" 
                                                            style={{ backgroundColor: '#7F1D1D', borderLeft: '1px solid #9CA3AF', borderRight: 'none', borderTop: '1px solid #9CA3AF', borderBottom: '1px solid #9CA3AF' }}>
                                                        </td>
                                                        <td colSpan="3" className="border border-[#D4A574] px-2 py-1 text-xs font-bold text-[#D4C5A9] text-center" 
                                                            style={{ backgroundColor: '#8B4513' }}>
                                                          ADDITIONAL INFO.
                                                        </td>
                                                        <td colSpan="5" className="border border-[#D4A574] px-2 py-1 text-xs font-bold text-[#D4C5A9] text-center" 
                                                            style={{ backgroundColor: '#6B46C1' }}>
                                                          SHIPPING INFO.
                                                        </td>
                                                        <td colSpan="2" className="border-gray-400 px-2 py-1 text-xs font-bold text-[#D4C5A9] text-center" 
                                                            style={{ backgroundColor: '#7F1D1D', borderRight: '1px solid #9CA3AF', borderLeft: 'none', borderTop: '1px solid #9CA3AF', borderBottom: '1px solid #9CA3AF' }}>
                                                        </td>
                                                      </tr>
                                                      
                                                      {/* MAIN RED HEADER ROW */}
                                                      <tr>
                                                        <td className="border-l border-r border-b border-gray-400 px-3 py-2 text-xs font-bold text-[#D4C5A9]" style={{ backgroundColor: '#7F1D1D' }}>INSTALLED</td>
                                                        <td className="border-r border-b border-gray-400 px-3 py-2 text-xs font-bold text-[#D4C5A9]" style={{ backgroundColor: '#7F1D1D' }}>VENDOR/SKU</td>
                                                        <td className="border-r border-b border-gray-400 px-3 py-2 text-xs font-bold text-[#D4C5A9]" style={{ backgroundColor: '#7F1D1D' }}>QTY</td>
                                                        <td className="border-r border-b border-gray-400 px-3 py-2 text-xs font-bold text-[#D4C5A9]" style={{ backgroundColor: '#7F1D1D' }}>SIZE</td>
                                                        <td className="border border-[#D4A574] px-3 py-2 text-xs font-bold text-[#D4C5A9]" style={{ backgroundColor: '#8B4513' }}>FINISH/Color</td>
                                                        <td className="border border-[#D4A574] px-3 py-2 text-xs font-bold text-[#D4C5A9]" style={{ backgroundColor: '#8B4513' }}>Cost/Price</td>
                                                        <td className="border border-[#D4A574] px-3 py-2 text-xs font-bold text-[#D4C5A9]" style={{ backgroundColor: '#8B4513' }}>Image</td>
                                                        <td className="border border-[#D4A574] px-3 py-2 text-xs font-bold text-[#D4C5A9]" style={{ backgroundColor: '#6B46C1' }}>Order Date</td>
                                                        <td className="border border-[#D4A574] px-3 py-2 text-xs font-bold text-[#D4C5A9]" style={{ backgroundColor: '#6B46C1' }}>Order Status<br/>Order Number</td>
                                                        <td className="border border-[#D4A574] px-3 py-2 text-xs font-bold text-[#D4C5A9]" style={{ backgroundColor: '#6B46C1' }}>Estimated Ship Date<br/>Estimated Delivery Date</td>
                                                        <td className="border border-[#D4A574] px-3 py-2 text-xs font-bold text-[#D4C5A9]" style={{ backgroundColor: '#6B46C1' }}>Install Date<br/>Ship To</td>
                                                        <td className="border border-[#D4A574] px-3 py-2 text-xs font-bold text-[#D4C5A9]" style={{ backgroundColor: '#6B46C1' }}>Tracking<br/>Carrier</td>
                                                        <td className="border-l border-r border-b border-gray-400 px-3 py-2 text-xs font-bold text-[#D4C5A9]" style={{ backgroundColor: '#7F1D1D' }}>NOTES</td>
                                                        <td className="border-l border-r border-b border-gray-400 px-3 py-2 text-xs font-bold text-[#D4C5A9]" style={{ backgroundColor: '#7F1D1D' }}>LINK</td>
                                                        <td className="border-l border-r border-b border-gray-400 px-3 py-2 text-xs font-bold text-[#D4C5A9]" style={{ backgroundColor: '#7F1D1D' }}>ACTIONS</td>
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
                                                          <td className="border border-[#D4A574] px-2 py-2 text-sm text-[#D4C5A9]">
                                                            {item.name}
                                                          </td>
                                                          
                                                          {/* VENDOR/SKU - DIRECTLY EDITABLE */}
                                                          <td 
                                                            className="border border-[#D4A574] px-2 py-2 text-sm text-[#D4C5A9]"
                                                            contentEditable
                                                            suppressContentEditableWarning={true}
                                                            onBlur={(e) => handleItemFieldChange(item.id, 'vendor', e.target.textContent)}
                                                            style={{ minHeight: '20px' }}
                                                          >
                                                            {item.vendor || ''}
                                                          </td>
                                                          
                                                          {/* QTY */}
                                                          <td className="border border-[#D4A574] px-2 py-2 text-sm text-center text-[#D4C5A9]">
                                                            <div 
                                                              contentEditable
                                                              suppressContentEditableWarning={true}
                                                              className="w-full bg-transparent text-[#D4C5A9] text-sm text-center outline-none"
                                                              onBlur={(e) => handleItemFieldChange(item.id, 'quantity', parseInt(e.target.textContent) || 1)}
                                                            >
                                                              {item.quantity || 1}
                                                            </div>
                                                          </td>
                                                          
                                                          {/* SIZE */}
                                                          <td className="border border-[#D4A574] px-2 py-2 text-sm text-[#D4C5A9]">
                                                            <div 
                                                              contentEditable
                                                              suppressContentEditableWarning={true}
                                                              className="w-full bg-transparent text-[#D4C5A9] text-sm outline-none"
                                                              onBlur={(e) => handleItemFieldChange(item.id, 'size', e.target.textContent)}
                                                            >
                                                              {item.size || ''}
                                                            </div>
                                                          </td>
                                                          
                                                          {/* FINISH/Color */}
                                                          <td className="border border-[#D4A574] px-2 py-2 text-sm text-[#D4C5A9]">
                                                            <div 
                                                              contentEditable
                                                              suppressContentEditableWarning={true}
                                                              className="w-full bg-transparent text-[#D4C5A9] text-sm outline-none"
                                                              onBlur={(e) => handleItemFieldChange(item.id, 'finish_color', e.target.textContent)}
                                                            >
                                                              {item.finish_color || ''}
                                                            </div>
                                                          </td>
                                                          
                                                          {/* Cost/Price - DIRECTLY EDITABLE */}
                                                          <td 
                                                            className="border border-[#D4A574] px-2 py-2 text-sm text-[#D4C5A9]"
                                                            contentEditable
                                                            suppressContentEditableWarning={true}
                                                            onBlur={(e) => {
                                                              const value = e.target.textContent;
                                                              handleItemFieldChange(item.id, 'cost', parseFloat(value) || 0);
                                                            }}
                                                            style={{ minHeight: '20px' }}
                                                          >
                                                            {item.cost || ''}
                                                          </td>
                                                          
                                                          {/* Image - SCRAPED AUTOMATICALLY */}
                                                          <td className="border border-[#D4A574] px-2 py-2 text-center text-[#D4C5A9]">
                                                            {item.image_url ? (
                                                              <img src={item.image_url} alt={item.name} className="w-8 h-8 object-cover rounded" />
                                                            ) : (
                                                              ''
                                                            )}
                                                          </td>
                                                          
                                                          {/* RIGHT SIDE - STACKED COLUMNS AS USER SPECIFIED */}
                                                          
                                                          {/* Order Date (ALONE) */}
                                                          <td className="border border-[#D4A574] px-2 py-2 text-sm text-[#D4C5A9]">
                                                            <input 
                                                              type="date" 
                                                              value={item.order_date || ''}
                                                              className="w-full bg-transparent border-none text-[#D4C5A9] text-sm"
                                                              onChange={(e) => {
                                                                handleItemFieldChange(item.id, 'order_date', e.target.value);
                                                              }}
                                                            />
                                                          </td>
                                                          
                                                          {/* Order Status/Order Number (STACKED VERTICALLY) */}
                                                          <td 
                                                            className="border border-[#D4A574] px-1 py-1 text-sm"
                                                            style={{ 
                                                              backgroundColor: getStatusColor(item.status || '') + ' !important',
                                                              background: getStatusColor(item.status || ''),
                                                              minWidth: '120px'
                                                            }}
                                                          >
                                                            <div className="flex flex-col h-full">
                                                              <div className="h-6 mb-1">
                                                                <select 
                                                                  className="w-full h-full text-[#D4C5A9] text-xs p-0"
                                                                  value={item.status || ''}
                                                                  style={{ 
                                                                    backgroundColor: getStatusColor(item.status || ''),
                                                                    background: getStatusColor(item.status || ''),
                                                                    color: 'white !important',
                                                                    border: '2px solid ' + getStatusColor(item.status || ''),
                                                                    borderRadius: '4px',
                                                                    outline: 'none',
                                                                    fontWeight: 'bold'
                                                                  }}
                                                                  onChange={(e) => {
                                                                    const newStatus = e.target.value;
                                                                    handleStatusChange(item.id, newStatus);
                                                                  }}
                                                                >
                                                                  <option value="">—</option>
                                                                  <option value="TO BE SELECTED">🔵 TO BE SELECTED</option>
                                                                  <option value="RESEARCHING">🔵 RESEARCHING</option>
                                                                  <option value="PENDING APPROVAL">🟡 PENDING APPROVAL</option>
                                                                  <option value="APPROVED">🟢 APPROVED</option>
                                                                  <option value="ORDERED">🟢 ORDERED</option>
                                                                  <option value="PICKED">🟡 PICKED</option>
                                                                  <option value="CONFIRMED">🟢 CONFIRMED</option>
                                                                  <option value="IN PRODUCTION">🟠 IN PRODUCTION</option>
                                                                  <option value="SHIPPED">🔵 SHIPPED</option>
                                                                  <option value="IN TRANSIT">🔵 IN TRANSIT</option>
                                                                  <option value="OUT FOR DELIVERY">🔵 OUT FOR DELIVERY</option>
                                                                  <option value="DELIVERED TO RECEIVER">🟣 DELIVERED TO RECEIVER</option>
                                                                  <option value="DELIVERED TO JOB SITE">🟣 DELIVERED TO JOB SITE</option>
                                                                  <option value="RECEIVED">🟣 RECEIVED</option>
                                                                  <option value="READY FOR INSTALL">🟢 READY FOR INSTALL</option>
                                                                  <option value="INSTALLING">🟢 INSTALLING</option>
                                                                  <option value="INSTALLED">🟢 INSTALLED</option>
                                                                  <option value="ON HOLD">🔴 ON HOLD</option>
                                                                  <option value="BACKORDERED">🔴 BACKORDERED</option>
                                                                  <option value="DAMAGED">🔴 DAMAGED</option>
                                                                  <option value="RETURNED">🔴 RETURNED</option>
                                                                  <option value="CANCELLED">🔴 CANCELLED</option>
                                                                </select>
                                                              </div>
                                                              <div className="h-6">
                                                                <input 
                                                                  type="text" 
                                                                  value={item.order_number || ''}
                                                                  placeholder="Order #"
                                                                  className="w-full h-full bg-transparent border-none text-[#D4C5A9] text-xs p-0"
                                                                  onChange={(e) => {
                                                                    handleItemFieldChange(item.id, 'order_number', e.target.value);
                                                                  }}
                                                                />
                                                              </div>
                                                            </div>
                                                          </td>
                                                          
                                                          {/* Estimated Ship Date/Estimated Delivery Date (STACKED VERTICALLY) */}
                                                          <td className="border border-[#D4A574] px-1 py-1 text-sm">
                                                            <div className="flex flex-col h-full">
                                                              <div className="h-6 mb-1">
                                                                <input 
                                                                  type="date" 
                                                                  className="w-full h-full bg-transparent border-none text-[#D4C5A9] text-xs p-0"
                                                                  onChange={(e) => console.log('Estimated ship date changed:', e.target.value)}
                                                                />
                                                              </div>
                                                              <div className="h-6">
                                                                <input 
                                                                  type="date" 
                                                                  className="w-full h-full bg-transparent border-none text-[#D4C5A9] text-xs p-0"
                                                                  onChange={(e) => console.log('Estimated delivery date changed:', e.target.value)}
                                                                />
                                                              </div>
                                                            </div>
                                                          </td>
                                                          
                                                          {/* Install Date/Ship To (STACKED VERTICALLY) */}
                                                          <td className="border border-[#D4A574] px-1 py-1 text-sm">
                                                            <div className="flex flex-col h-full">
                                                              <div className="h-6 mb-1">
                                                                <input 
                                                                  type="date" 
                                                                  className="w-full h-full bg-transparent border-none text-[#D4C5A9] text-xs p-0"
                                                                  onChange={(e) => console.log('Install date changed:', e.target.value)}
                                                                />
                                                              </div>
                                                              <div className="h-6">
                                                                <select 
                                                                  className="w-full h-full bg-transparent border-none text-[#D4C5A9] text-xs p-0"
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
                                                          
                                                          {/* Tracking/Carrier (STACKED VERTICALLY) */}
                                                          <td 
                                                            className="border border-[#D4A574] px-1 py-1 text-sm"
                                                            style={{ 
                                                              backgroundColor: getCarrierColor(item.carrier || '') + ' !important',
                                                              background: getCarrierColor(item.carrier || ''),
                                                              minWidth: '120px'
                                                            }}
                                                          >
                                                            <div className="flex flex-col h-full">
                                                              <div className="h-6 mb-1">
                                                                <input 
                                                                  type="text" 
                                                                  placeholder="Live Tracking #"
                                                                  className="w-full h-full text-[#D4C5A9] text-xs p-0"
                                                                  style={{ 
                                                                    backgroundColor: getCarrierColor(item.carrier || ''),
                                                                    background: getCarrierColor(item.carrier || ''),
                                                                    border: '2px solid ' + getCarrierColor(item.carrier || ''),
                                                                    borderRadius: '4px',
                                                                    outline: 'none'
                                                                  }}
                                                                  value={item.tracking_number || ''}
                                                                  onChange={(e) => handleItemFieldChange(item.id, 'tracking_number', e.target.value)}
                                                                />
                                                              </div>
                                                              <div className="h-6">
                                                                <select 
                                                                  className="w-full h-full text-[#D4C5A9] text-xs p-0"
                                                                  value={item.carrier || ''}
                                                                  style={{ 
                                                                    backgroundColor: getCarrierColor(item.carrier || ''),
                                                                    background: getCarrierColor(item.carrier || ''),
                                                                    color: 'white !important',
                                                                    border: '2px solid ' + getCarrierColor(item.carrier || ''),
                                                                    borderRadius: '4px',
                                                                    outline: 'none',
                                                                    fontWeight: 'bold'
                                                                  }}
                                                                  onChange={(e) => handleCarrierChange(item.id, e.target.value)}
                                                                >
                                                                  <option value="">—</option>
                                                                  <option value="FedEx">FedEx</option>
                                                                  <option value="FedEx Ground">FedEx Ground</option>
                                                                  <option value="UPS">UPS</option>
                                                                  <option value="UPS Ground">UPS Ground</option>
                                                                  <option value="USPS">USPS</option>
                                                                  <option value="DHL">DHL</option>
                                                                  <option value="Brooks">Brooks</option>
                                                                  <option value="Zenith">Zenith</option>
                                                                  <option value="Sunbelt">Sunbelt</option>
                                                                  <option value="R+L Carriers">R+L Carriers</option>
                                                                  <option value="Yellow Freight">Yellow Freight</option>
                                                                  <option value="XPO Logistics">XPO Logistics</option>
                                                                  <option value="Old Dominion">Old Dominion</option>
                                                                  <option value="ABF Freight">ABF Freight</option>
                                                                  <option value="Con-Way">Con-Way</option>
                                                                  <option value="Estes Express">Estes Express</option>
                                                                  <option value="YRC Freight">YRC Freight</option>
                                                                  <option value="Saia">Saia</option>
                                                                  <option value="OTHER">OTHER</option>
                                                                  <option value="ADD_NEW">+ Add New Carrier</option>
                                                                </select>
                                                              </div>
                                                            </div>
                                                          </td>
                                                          
                                                          {/* NOTES */}
                                                          <td className="border border-[#D4A574] px-2 py-2 text-sm text-[#D4C5A9]">
                                                            <input 
                                                              type="text" 
                                                              placeholder="Notes"
                                                              className="w-full bg-transparent border-none text-[#D4C5A9] text-sm"
                                                              onChange={(e) => console.log('Notes changed:', e.target.value)}
                                                            />
                                                          </td>
                                                          
                                                          {/* LINK */}
                                                          <td className="border border-[#D4A574] px-2 py-2 text-sm text-[#D4C5A9]">
                                                            {item.link ? (
                                                              <a 
                                                                href={item.link} 
                                                                target="_blank" 
                                                                rel="noopener noreferrer"
                                                                className="text-blue-400 hover:text-blue-300 text-xs underline"
                                                                title="View Product Link"
                                                              >
                                                                🔗 LINK
                                                              </a>
                                                            ) : (
                                                              <span className="text-[#D4A574] text-xs">No Link</span>
                                                            )}
                                                          </td>
                                                          
                                                          {/* ACTIONS - DELETE INSTALLED */}
                                                          <td className="border border-[#D4A574] px-2 py-2 text-center">
                                                            <button 
                                                              onClick={() => handleDeleteItem(item.id)}
                                                              className="bg-red-600 hover:bg-red-500 text-[#D4C5A9] text-xs px-2 py-1 rounded"
                                                              title="Delete Item"
                                                            >
                                                              🗑️
                                                            </button>
                                                          </td>
                                                        </tr>
                                                        ))
                                                      ))}
                                                      
                                                      {/* BUTTONS ROW - LEFT ALIGNED WITH GOLD COLOR */}
                                                      <tr>
                                                        <td colSpan="15" className="border border-[#D4A574] px-6 py-2 bg-slate-900">
                                                          <div className="flex justify-start items-center space-x-4">
                                                            {/* Add Item Button - FIXED */}
                                                            <button
                                                              onClick={() => {
                                                                if (category.subcategories?.length > 0) {
                                                                  setSelectedSubCategoryId(category.subcategories[0].id);
                                                                  setShowAddItem(true);
                                                                  console.log('🎯 Selected subcategory for FFE item:', category.subcategories[0].id);
                                                                } else {
                                                                  alert('This category has no subcategories. Please contact support.');
                                                                }
                                                              }}
                                                              className="bg-amber-700 hover:bg-amber-600 text-[#D4C5A9] px-3 py-1 rounded text-sm font-medium"
                                                            >
                                                              ✚ Add Item
                                                            </button>
                                                            

                                                            
                                                            {/* Delete Section Button - RED COLOR */}
                                                            <button
                                                              onClick={() => handleDeleteRoom(room.id)}
                                                              className="bg-red-700 hover:bg-red-600 text-[#D4C5A9] px-3 py-1 rounded text-sm font-medium"
                                                            >
                                                              🗑️ Delete Section
                                                            </button>
                                                          </div>
                                                        </td>
                                                      </tr>
                                                    </React.Fragment>
                                                  )}
                                                </React.Fragment>
                                          );
                                        })}
                                      </React.Fragment>
                                )}
                              </React.Fragment>
                        );
                      })}
                  </tbody>
                </table>
            </div>
          </div>
        </div>

        {/* BOTTOM SECTION - ADD CATEGORY AND ADD ITEM BUTTONS - MATCHING WALKTHROUGH */}
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
            className="text-[#D4C5A9] px-4 py-2 rounded font-medium border border-[#D4A574]/20" 
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
            onClick={() => {
              console.log('🚀 FF&E Transfer button clicked');
              alert('Transfer functionality will be implemented next.');
            }}
            className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-500 hover:to-green-600 px-6 py-2 rounded-full shadow-xl hover:shadow-green-500/30 transition-all duration-300 transform hover:scale-105 tracking-wide font-medium border border-green-500/20 text-[#D4C5A9]"
          >
            → TRANSFER TO CHECKLIST
          </button>
          <button 
            onClick={() => {
              // Find first available subcategory to add item to
              const firstRoom = project?.rooms?.[0];
              const firstCategory = firstRoom?.categories?.[0];
              const firstSubcategory = firstCategory?.subcategories?.[0];
              
              if (firstSubcategory) {
                setSelectedSubCategoryId(firstSubcategory.id);
                setShowAddItem(true);
                console.log('🎯 Adding item to first available subcategory:', firstSubcategory.id);
              } else {
                alert('Please add a category first before adding items.');
              }
            }}
            className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 px-6 py-2 rounded-full shadow-xl hover:shadow-blue-500/30 transition-all duration-300 transform hover:scale-105 tracking-wide font-medium border border-blue-500/20 text-[#D4C5A9]"
          >
            + ADD ITEM
          </button>
        </div>
      
      </div> {/* END BLUE SPREADSHEET CONTAINER */}

      {/* ADD INSTALLED MODAL */}
      {/* FOOTER SECTION - ADD CATEGORY */}
      <div className="mt-8 p-4 border-t-2 border-[#D4A574]/20">
        <div className="flex gap-3 justify-center">
          <select
            value=""
            onChange={(e) => {
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
            className="text-[#D4C5A9] px-6 py-3 rounded font-bold border border-[#D4A574]/20 text-lg" 
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
            <option value="Appliances">Appliances</option>
            <option value="CREATE_NEW">+ Create New Category</option>
          </select>
        </div>
      </div>

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

export default ExactFFESpreadsheet;
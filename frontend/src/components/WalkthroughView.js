import React, { useState, useEffect } from 'react';

import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import AddItemModal from './AddItemModal';
import AdvancedFFEFeatures from './AdvancedFFEFeatures';

const ExactWalkthroughSpreadsheet = ({ 
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
  const handleStatusChange = async (itemId, newStatus) => {
    console.log('🔄 Status change request:', { itemId, newStatus });
    
    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL || window.location.origin}/api/items/${itemId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      
      console.log('📡 Status change response:', response.status, response.statusText);
      
      if (response.ok) {
        console.log('✅ Status updated successfully, reloading...');
        window.location.reload();
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
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL || window.location.origin}/api/items/${itemId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ carrier: newCarrier })
      });
      
      if (response.ok) {
        console.log('✅ Carrier updated successfully, reloading...');
        window.location.reload();
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
        alert('Please expand a category first to add items to it.');
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
        window.location.reload();
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
      const backendUrl = process.env.REACT_APP_BACKEND_URL || window.location.origin;
      const response = await fetch(`${backendUrl}/api/rooms/${roomId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        console.log('✅ Room deleted successfully');
        // Force reload to show updated data
        window.location.reload();
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
      const backendUrl = process.env.REACT_APP_BACKEND_URL || window.location.origin;
      const response = await fetch(`${backendUrl}/api/items/${itemId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        console.log('✅ Item deleted successfully');
        alert('Item deleted successfully!');
        // Force reload to show updated data
        window.location.reload();
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
          
          const addResponse = await fetch(`${process.env.REACT_APP_BACKEND_URL || window.location.origin}/api/categories`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(categoryData)
          });
          
          if (addResponse.ok) {
            console.log('✅ Comprehensive category added successfully');
            
            // Delete the temp room
            await fetch(`${process.env.REACT_APP_BACKEND_URL || window.location.origin}/api/rooms/${tempRoom.id}`, {
              method: 'DELETE'
            });
            
            // Reload to show new category with all items
            window.location.reload();
          }
        }
        
        // Clean up temp room regardless
        await fetch(`${process.env.REACT_APP_BACKEND_URL || window.location.origin}/api/rooms/${tempRoom.id}`, {
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

  // EXACT COLORS FROM YOUR SCREENSHOTS
  const getRoomColor = (roomName) => {
    const roomColors = {
      'living room': '#7C3AED',      // Purple
      'dining room': '#DC2626',      // Red
      'kitchen': '#EA580C',          // Orange  
      'primary bedroom': '#059669',  // Green
      'primary bathroom': '#2563EB', // Blue
      'powder room': '#7C2D12',      // Brown
      'guest room': '#BE185D',       // Pink
      'office': '#6366F1',           // Indigo
      'laundry room': '#16A34A',     // Green
      'mudroom': '#0891B2',          // Cyan
      'family room': '#CA8A04',      // Yellow
      'basement': '#6B7280',         // Gray
      'attic storage': '#78716C',    // Stone
      'garage': '#374151',           // Gray-800
      'balcony': '#7C3AED'           // Purple
    };
    return roomColors[roomName.toLowerCase()] || '#7C3AED';
  };

  const getCategoryColor = () => '#065F46';  // Dark green
  const getMainHeaderColor = () => '#8B4444';  // Dark red for main headers
  const getAdditionalInfoColor = () => '#8B4444';  // Brown for ADDITIONAL INFO.
  const getShippingInfoColor = () => '#6B21A8';  // Purple for SHIPPING INFO.
  const getNotesActionsColor = () => '#8B4444';  // Red for NOTES and ACTIONS

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
      'RETURNED TO SENDER': '#8B4444'
    };
    return deliveryColors[status] || '#FEF08A';
  };

  if (!project || !project.rooms || project.rooms.length === 0) {
    return (
      <div className="text-center text-[#D4A574] py-8">
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
            
            {/* Filter and Clear Buttons */}
            <button 
              onClick={() => {
                console.log('🔍 FILTER APPLIED - Search:', searchTerm, 'Room:', selectedRoom, 'Category:', selectedCategory, 'Vendor:', selectedVendor, 'Status:', selectedStatus, 'Carrier:', selectedCarrier);
                // Filters are applied automatically via useEffect
              }}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-[#D4C5A9] rounded font-medium"
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
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-[#D4C5A9] rounded font-medium"
            >
              CLEAR
            </button>
          </div>
          
          {/* Add Room button removed per user request */}
        </div>
      </div>

      {/* ORIGINAL TABLE STRUCTURE - DO NOT CHANGE */}
      <div className="w-full overflow-x-auto" style={{ backgroundColor: '#0F172A', touchAction: 'pan-x' }}>
        <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch', minWidth: '1200px' }}>
          
          <div className="w-full" style={{ touchAction: 'pan-x pan-y' }}>
            <table className="w-full border-collapse border border-gray-400">
                  
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
                                      className="border border-gray-400 px-3 py-2 text-[#D4C5A9] text-sm font-bold"
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
                                  <td className="border border-gray-400 px-2 py-2 text-center"
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
                                                        className="border border-gray-400 px-4 py-2 text-[#D4C5A9] text-sm font-bold"
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
                                                        <td className="border border-gray-400 px-3 py-2 text-xs font-bold text-[#D4C5A9]" style={{ backgroundColor: '#8B4444' }}>INSTALLED</td>
                                                        <td className="border border-gray-400 px-3 py-2 text-xs font-bold text-[#D4C5A9]" style={{ backgroundColor: '#8B4444' }}>VENDOR/SKU</td>
                                                        <td className="border border-gray-400 px-3 py-2 text-xs font-bold text-[#D4C5A9]" style={{ backgroundColor: '#8B4444' }}>QTY</td>
                                                        <td className="border border-gray-400 px-3 py-2 text-xs font-bold text-[#D4C5A9]" style={{ backgroundColor: '#8B4444' }}>SIZE</td>
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
                                                          {/* INSTALLED */}
                                                          <td className="border border-gray-400 px-2 py-2 text-[#D4C5A9] text-sm">
                                                            {item.name}
                                                          </td>
                                                          
                                                          {/* VENDOR/SKU */}
                                                          <td className="border border-gray-400 px-2 py-2 text-[#D4C5A9] text-sm">
                                                            {item.vendor || ''}
                                                          </td>
                                                          
                                                          {/* QTY */}
                                                          <td className="border border-gray-400 px-2 py-2 text-[#D4C5A9] text-sm text-center">
                                                            {item.quantity || 1}
                                                          </td>
                                                          
                                                          {/* SIZE */}
                                                          <td className="border border-gray-400 px-2 py-2 text-[#D4C5A9] text-sm">
                                                            {item.size || ''}
                                                          </td>
                                                        </tr>
                                                        ))
                                                      ))}
                                                      
                                                      {/* BUTTONS ROW - LEFT ALIGNED WITH GOLD COLOR */}
                                                      <tr>
                                                        <td colSpan="5" className="border border-gray-400 px-6 py-2 bg-slate-900">
                                                          <div className="flex justify-start items-center space-x-4">
                                                            {/* Add Item Button - GOLD/AMBER COLOR */}
                                                            <button
                                                              onClick={() => setShowAddItem(true)}
                                                              className="bg-amber-700 hover:bg-amber-600 text-[#D4C5A9] px-3 py-1 rounded text-sm font-medium"
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
                                                              className="bg-amber-700 hover:bg-amber-600 text-[#D4C5A9] px-3 py-1 rounded text-sm font-medium border-none outline-none"
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
    </div>
  );
};

export default ExactWalkthroughSpreadsheet;
import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
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
  const handleStatusChange = async (itemId, newStatus) => {
    console.log('🔄 Status change request:', { itemId, newStatus });
    
    try {
      const response = await fetch(`https://code-scanner-14.preview.emergentagent.com/api/items/${itemId}`, {
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
      const response = await fetch(`https://code-scanner-14.preview.emergentagent.com/api/items/${itemId}`, {
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

  // APPLY FILTERS - ACTUALLY MAKE FILTERING WORK
  useEffect(() => {
    if (!project) {
      setFilteredProject(null);
      return;
    }

    let filtered = { ...project };

    if (searchTerm || selectedRoom || selectedCategory || selectedVendor || selectedStatus || selectedCarrier) {
      filtered.rooms = project.rooms.filter(room => {
        // Room filter - Fixed to use room.id instead of room.name
        if (selectedRoom && room.id !== selectedRoom) {
          return false;
        }

        // Search term in room name
        if (searchTerm && !room.name.toLowerCase().includes(searchTerm.toLowerCase())) {
          let hasMatchingItem = false;
          
          // Check if any item in room matches search term
          room.categories?.forEach(category => {
            category.subcategories?.forEach(subcategory => {
              subcategory.items?.forEach(item => {
                if (item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    (item.vendor && item.vendor.toLowerCase().includes(searchTerm.toLowerCase())) ||
                    (item.sku && item.sku.toLowerCase().includes(searchTerm.toLowerCase()))) {
                  hasMatchingItem = true;
                }
              });
            });
          });
          
          if (!hasMatchingItem) return false;
        }

        // Filter categories and items within room
        if (selectedCategory || selectedVendor || selectedStatus || selectedCarrier || searchTerm) {
          const filteredCategories = room.categories?.filter(category => {
            // Category filter
            if (selectedCategory && category.name.toLowerCase() !== selectedCategory.toLowerCase()) {
              return false;
            }

            // Filter items within category
            const filteredSubcategories = category.subcategories?.map(subcategory => {
              const filteredItems = subcategory.items?.filter(item => {
                // Vendor filter
                if (selectedVendor && (!item.vendor || item.vendor.toLowerCase() !== selectedVendor.toLowerCase())) {
                  return false;
                }

                // Status filter
                if (selectedStatus && (!item.status || item.status !== selectedStatus)) {
                  return false;
                }

                // Carrier filter
                if (selectedCarrier && (!item.carrier || item.carrier !== selectedCarrier)) {
                  return false;
                }

                // Search term filter for items
                if (searchTerm) {
                  const searchLower = searchTerm.toLowerCase();
                  if (!item.name.toLowerCase().includes(searchLower) &&
                      !(item.vendor && item.vendor.toLowerCase().includes(searchLower)) &&
                      !(item.sku && item.sku.toLowerCase().includes(searchLower))) {
                    return false;
                  }
                }

                return true;
              }) || [];

              return {
                ...subcategory,
                items: filteredItems
              };
            }) || [];

            return {
              ...category,
              subcategories: filteredSubcategories.filter(sub => 
                sub.items && sub.items.length > 0
              )
            };
          }) || [];

          return {
            ...room,
            categories: filteredCategories
          };
        }

        return room;
      });
    }

    setFilteredProject(filtered);
  }, [project, searchTerm, selectedRoom, selectedCategory, selectedVendor, selectedStatus, selectedCarrier]);

  // Load available categories on component mount
  useEffect(() => {
    const loadAvailableCategories = async () => {
      try {
        const backendUrl = "https://code-scanner-14.preview.emergentagent.com";
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

      const backendUrl = "https://code-scanner-14.preview.emergentagent.com";
      
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
      const backendUrl = "https://code-scanner-14.preview.emergentagent.com";
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
      const backendUrl = "https://code-scanner-14.preview.emergentagent.com";
      const response = await fetch(`${backendUrl}/api/items/${itemId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        console.log('✅ Item deleted successfully');
        // Force reload to show updated data
        window.location.reload();
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (error) {
      console.error('❌ Error deleting item:', error);
      alert('Failed to delete item. Please try again.');
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
    if (!roomId || !categoryName) {
      console.error('❌ Missing roomId or categoryName');
      return;
    }

    try {
      const backendUrl = "https://code-scanner-14.preview.emergentagent.com";
      const response = await fetch(`${backendUrl}/api/categories/comprehensive`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: categoryName,
          room_id: roomId,
          order_index: 0,
          populate_comprehensive: true,
          create_all_items: true,
          populate_all_subcategories: true
        })
      });

      if (response.ok) {
        console.log('✅ Category with full structure added successfully');
        // Force reload to show the new category with all subcategories and items
        window.location.reload();
      } else {
        console.error('❌ Comprehensive category endpoint failed, trying basic endpoint');
        // Fallback to basic category creation
        const basicResponse = await fetch(`${backendUrl}/api/categories`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: categoryName,
            room_id: roomId,
            order_index: 0
          })
        });

        if (basicResponse.ok) {
          console.log('✅ Basic category added successfully');
          window.location.reload();
        } else {
          throw new Error(`HTTP ${basicResponse.status}`);
        }
      }
    } catch (error) {
      console.error('❌ Error adding category:', error);
      alert('Failed to add category. Please try again.');
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
        const response = await fetch('https://code-scanner-14.preview.emergentagent.com/api/rooms/reorder', {
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
        const response = await fetch('https://code-scanner-14.preview.emergentagent.com/api/categories/reorder', {
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
      const backendUrl = "https://code-scanner-14.preview.emergentagent.com";
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
              className="w-full px-4 py-2 rounded bg-gray-700 text-white border border-gray-600 focus:border-blue-500 focus:outline-none"
            />
          </div>
          
          {/* Filter Dropdowns */}
          <div className="flex gap-3 flex-wrap">
            <select 
              value={selectedRoom}
              onChange={(e) => setSelectedRoom(e.target.value)}
              className="px-3 py-2 rounded bg-gray-700 text-white border border-gray-600 focus:border-blue-500 focus:outline-none"
            >
              <option value="">All Rooms</option>
              {project.rooms.map(room => (
                <option key={room.id} value={room.id}>{room.name}</option>
              ))}
            </select>
            
            <select 
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 rounded bg-gray-700 text-white border border-gray-600 focus:border-blue-500 focus:outline-none"
            >
              <option value="">All Categories</option>
              {availableCategories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
            
            <select 
              value={selectedVendor}
              onChange={(e) => setSelectedVendor(e.target.value)}
              className="px-3 py-2 rounded bg-gray-700 text-white border border-gray-600 focus:border-blue-500 focus:outline-none"
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
              className="px-3 py-2 rounded bg-gray-700 text-white border border-gray-600 focus:border-blue-500 focus:outline-none"
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
              className="px-3 py-2 rounded bg-gray-700 text-white border border-gray-600 focus:border-blue-500 focus:outline-none"
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

      {/* ORIGINAL TABLE STRUCTURE - DO NOT CHANGE */}
      <DragDropContext onDragEnd={handleDragEnd}>
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
                <Droppable droppableId="rooms" type="room">
                  {(provided) => (
                    <div ref={provided.innerRef} {...provided.droppableProps}>
                      {(filteredProject || project).rooms.map((room, roomIndex) => {
                  const isRoomExpanded = expandedRooms[room.id];
                  console.log(`🏠 RENDERING ROOM ${roomIndex}: ${room.name} with ${room.categories?.length || 0} categories`);
                  
                  return (
                              <React.Fragment key={room.id}>
                                {/* ROOM HEADER ROW - Full width like your screenshots */}
                                <tr>
                                  <td colSpan="12" 
                                      className="border border-gray-400 px-3 py-2 text-white text-sm font-bold"
                                      style={{ backgroundColor: getRoomColor(room.name) }}>
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
                                                        className="border border-gray-400 px-4 py-2 text-white text-sm font-bold"
                                                        style={{ backgroundColor: getCategoryColor() }}>
                                                      <div className="flex items-center gap-2">
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
                                                      {/* RED HEADER GOES AFTER CATEGORY - LAST IN HIERARCHY */}
                                                      <tr>
                                                        <td colSpan="4" className="border-gray-400 px-2 py-1 text-xs font-bold text-white text-center" 
                                                            style={{ backgroundColor: '#7F1D1D', borderLeft: '1px solid #9CA3AF', borderRight: 'none', borderTop: '1px solid #9CA3AF', borderBottom: '1px solid #9CA3AF' }}>
                                                        </td>
                                                        <td colSpan="3" className="border border-gray-400 px-2 py-1 text-xs font-bold text-white text-center" 
                                                            style={{ backgroundColor: '#8B4513' }}>
                                                          ADDITIONAL INFO.
                                                        </td>
                                                        <td colSpan="5" className="border border-gray-400 px-2 py-1 text-xs font-bold text-white text-center" 
                                                            style={{ backgroundColor: '#6B46C1' }}>
                                                          SHIPPING INFO.
                                                        </td>
                                                        <td colSpan="2" className="border-gray-400 px-2 py-1 text-xs font-bold text-white text-center" 
                                                            style={{ backgroundColor: '#7F1D1D', borderRight: '1px solid #9CA3AF', borderLeft: 'none', borderTop: '1px solid #9CA3AF', borderBottom: '1px solid #9CA3AF' }}>
                                                        </td>
                                                      </tr>
                                                      
                                                      {/* MAIN RED HEADER ROW */}
                                                      <tr>
                                                        <td className="border-l border-r border-b border-gray-400 px-3 py-2 text-xs font-bold text-white" style={{ backgroundColor: '#7F1D1D' }}>INSTALLED</td>
                                                        <td className="border-r border-b border-gray-400 px-3 py-2 text-xs font-bold text-white" style={{ backgroundColor: '#7F1D1D' }}>VENDOR/SKU</td>
                                                        <td className="border-r border-b border-gray-400 px-3 py-2 text-xs font-bold text-white" style={{ backgroundColor: '#7F1D1D' }}>QTY</td>
                                                        <td className="border-r border-b border-gray-400 px-3 py-2 text-xs font-bold text-white" style={{ backgroundColor: '#7F1D1D' }}>SIZE</td>
                                                        <td className="border border-gray-400 px-3 py-2 text-xs font-bold text-white" style={{ backgroundColor: '#8B4513' }}>FINISH/Color</td>
                                                        <td className="border border-gray-400 px-3 py-2 text-xs font-bold text-white" style={{ backgroundColor: '#8B4513' }}>Cost/Price</td>
                                                        <td className="border border-gray-400 px-3 py-2 text-xs font-bold text-white" style={{ backgroundColor: '#8B4513' }}>Image</td>
                                                        <td className="border border-gray-400 px-3 py-2 text-xs font-bold text-white" style={{ backgroundColor: '#6B46C1' }}>Order Date</td>
                                                        <td className="border border-gray-400 px-3 py-2 text-xs font-bold text-white" style={{ backgroundColor: '#6B46C1' }}>Order Status<br/>Order Number</td>
                                                        <td className="border border-gray-400 px-3 py-2 text-xs font-bold text-white" style={{ backgroundColor: '#6B46C1' }}>Estimated Ship Date<br/>Estimated Delivery Date</td>
                                                        <td className="border border-gray-400 px-3 py-2 text-xs font-bold text-white" style={{ backgroundColor: '#6B46C1' }}>Install Date<br/>Ship To</td>
                                                        <td className="border border-gray-400 px-3 py-2 text-xs font-bold text-white" style={{ backgroundColor: '#6B46C1' }}>Tracking<br/>Carrier</td>
                                                        <td className="border-l border-r border-b border-gray-400 px-3 py-2 text-xs font-bold text-white" style={{ backgroundColor: '#7F1D1D' }}>NOTES</td>
                                                        <td className="border-l border-r border-b border-gray-400 px-3 py-2 text-xs font-bold text-white" style={{ backgroundColor: '#7F1D1D' }}>LINK</td>
                                                        <td className="border-l border-r border-b border-gray-400 px-3 py-2 text-xs font-bold text-white" style={{ backgroundColor: '#7F1D1D' }}>ACTIONS</td>
                                                      </tr>
                                                      
                                                      {/* ITEMS GO DIRECTLY UNDER RED HEADER */}
                                                      {/* ACTUAL ITEMS FROM BACKEND DATA */}
                                                      {category.subcategories?.map((subcategory) => (
                                                        subcategory.items?.map((item, itemIndex) => (
                                                        <tr key={item.id} className={itemIndex % 2 === 0 ? 'bg-slate-800' : 'bg-slate-700'}>
                                                          {/* INSTALLED - ITEM NAME GOES HERE */}
                                                          <td className="border border-gray-400 px-2 py-2 text-sm text-white">
                                                            {item.name}
                                                          </td>
                                                          
                                                          {/* VENDOR/SKU - EDITABLE INLINE */}
                                                          <td className="border border-gray-400 px-2 py-2 text-sm text-white">
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
                                                          <td className="border border-gray-400 px-2 py-2 text-sm text-center text-white">
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
                                                          <td className="border border-gray-400 px-2 py-2 text-sm text-white">
                                                            <div 
                                                              contentEditable={true}
                                                              suppressContentEditableWarning={true}
                                                              className="w-full bg-transparent text-white text-sm outline-none"
                                                              onBlur={(e) => console.log('Size updated:', e.target.textContent)}
                                                            >
                                                              {item.size || ''}
                                                            </div>
                                                          </td>
                                                          
                                                          {/* FINISH/Color - EDITABLE INLINE */}
                                                          <td className="border border-gray-400 px-2 py-2 text-sm text-white">
                                                            <div 
                                                              contentEditable={true}
                                                              suppressContentEditableWarning={true}
                                                              className="w-full bg-transparent text-white text-sm outline-none"
                                                              onBlur={(e) => console.log('Finish/Color updated:', e.target.textContent)}
                                                            >
                                                              {item.finish_color || ''}
                                                            </div>
                                                          </td>
                                                          
                                                          {/* Cost/Price - EDITABLE INLINE */}
                                                          <td className="border border-gray-400 px-2 py-2 text-sm text-white">
                                                            <div 
                                                              contentEditable={true}
                                                              suppressContentEditableWarning={true}
                                                              className="w-full bg-transparent text-white text-sm outline-none"
                                                              onBlur={(e) => console.log('Cost updated:', e.target.textContent)}
                                                            >
                                                              {item.cost ? `$${item.cost}` : ''}
                                                            </div>
                                                          </td>
                                                          
                                                          {/* Image - SCRAPED AUTOMATICALLY */}
                                                          <td className="border border-gray-400 px-2 py-2 text-center text-white">
                                                            {item.image_url ? (
                                                              <img src={item.image_url} alt={item.name} className="w-8 h-8 object-cover rounded" />
                                                            ) : (
                                                              ''
                                                            )}
                                                          </td>
                                                          
                                                          {/* RIGHT SIDE - STACKED COLUMNS AS USER SPECIFIED */}
                                                          
                                                          {/* Order Date (ALONE) */}
                                                          <td className="border border-gray-400 px-2 py-2 text-sm text-white">
                                                            <input 
                                                              type="date" 
                                                              className="w-full bg-transparent border-none text-white text-sm"
                                                              onChange={(e) => console.log('Order date changed:', e.target.value)}
                                                            />
                                                          </td>
                                                          
                                                          {/* Order Status/Order Number (STACKED VERTICALLY) */}
                                                          <td className="border border-gray-400 px-1 py-1 text-sm">
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
                                                                  <option value="" style={{ backgroundColor: '#6B7280', color: 'white' }}>—</option>
                                                                  <option value="TO BE SELECTED" style={{ backgroundColor: '#6B7280', color: 'white' }}>🔵 TO BE SELECTED</option>
                                                                  <option value="RESEARCHING" style={{ backgroundColor: '#3B82F6', color: 'white' }}>🔵 RESEARCHING</option>
                                                                  <option value="PENDING APPROVAL" style={{ backgroundColor: '#F59E0B', color: 'white' }}>🟡 PENDING APPROVAL</option>
                                                                  <option value="APPROVED" style={{ backgroundColor: '#10B981', color: 'white' }}>🟢 APPROVED</option>
                                                                  <option value="ORDERED" style={{ backgroundColor: '#10B981', color: 'white' }}>🟢 ORDERED</option>
                                                                  <option value="PICKED" style={{ backgroundColor: '#FFD700', color: 'black' }}>🟡 PICKED</option>
                                                                  <option value="CONFIRMED" style={{ backgroundColor: '#10B981', color: 'white' }}>🟢 CONFIRMED</option>
                                                                  <option value="IN PRODUCTION" style={{ backgroundColor: '#F97316', color: 'white' }}>🟠 IN PRODUCTION</option>
                                                                  <option value="SHIPPED" style={{ backgroundColor: '#3B82F6', color: 'white' }}>🔵 SHIPPED</option>
                                                                  <option value="IN TRANSIT" style={{ backgroundColor: '#3B82F6', color: 'white' }}>🔵 IN TRANSIT</option>
                                                                  <option value="OUT FOR DELIVERY" style={{ backgroundColor: '#3B82F6', color: 'white' }}>🔵 OUT FOR DELIVERY</option>
                                                                  <option value="DELIVERED TO RECEIVER" style={{ backgroundColor: '#8B5CF6', color: 'white' }}>🟣 DELIVERED TO RECEIVER</option>
                                                                  <option value="DELIVERED TO JOB SITE" style={{ backgroundColor: '#8B5CF6', color: 'white' }}>🟣 DELIVERED TO JOB SITE</option>
                                                                  <option value="RECEIVED" style={{ backgroundColor: '#8B5CF6', color: 'white' }}>🟣 RECEIVED</option>
                                                                  <option value="READY FOR INSTALL" style={{ backgroundColor: '#10B981', color: 'white' }}>🟢 READY FOR INSTALL</option>
                                                                  <option value="INSTALLING" style={{ backgroundColor: '#10B981', color: 'white' }}>🟢 INSTALLING</option>
                                                                  <option value="INSTALLED" style={{ backgroundColor: '#10B981', color: 'white' }}>🟢 INSTALLED</option>
                                                                  <option value="ON HOLD" style={{ backgroundColor: '#EF4444', color: 'white' }}>🔴 ON HOLD</option>
                                                                  <option value="BACKORDERED" style={{ backgroundColor: '#EF4444', color: 'white' }}>🔴 BACKORDERED</option>
                                                                  <option value="DAMAGED" style={{ backgroundColor: '#EF4444', color: 'white' }}>🔴 DAMAGED</option>
                                                                  <option value="RETURNED" style={{ backgroundColor: '#EF4444', color: 'white' }}>🔴 RETURNED</option>
                                                                  <option value="CANCELLED" style={{ backgroundColor: '#EF4444', color: 'white' }}>🔴 CANCELLED</option>
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
                                                          <td className="border border-gray-400 px-1 py-1 text-sm">
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
                                                          <td className="border border-gray-400 px-1 py-1 text-sm">
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
                                                          
                                                          {/* Tracking/Carrier (STACKED VERTICALLY) */}
                                                          <td className="border border-gray-400 px-1 py-1 text-sm">
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
                                                          <td className="border border-gray-400 px-2 py-2 text-sm text-white">
                                                            <input 
                                                              type="text" 
                                                              placeholder="Notes"
                                                              className="w-full bg-transparent border-none text-white text-sm"
                                                              onChange={(e) => console.log('Notes changed:', e.target.value)}
                                                            />
                                                          </td>
                                                          
                                                          {/* LINK */}
                                                          <td className="border border-gray-400 px-2 py-2 text-sm text-white">
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
                                                              <span className="text-gray-500 text-xs">No Link</span>
                                                            )}
                                                          </td>
                                                          
                                                          {/* ACTIONS - DELETE ITEM */}
                                                          <td className="border border-gray-400 px-2 py-2 text-center">
                                                            <button 
                                                              onClick={() => handleDeleteItem(item.id)}
                                                              className="bg-red-600 hover:bg-red-500 text-white text-xs px-2 py-1 rounded"
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
                                                        <td colSpan="15" className="border border-gray-400 px-6 py-2 bg-slate-900">
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
                                                </React.Fragment>
                                          );
                                        })}
                                      </React.Fragment>
                                )}
                              </React.Fragment>
                        );
                      })}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
                  </tbody>
                </table>
            </div>

        </div>
      </div>
      </DragDropContext>

      {/* ADD ITEM MODAL */}
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
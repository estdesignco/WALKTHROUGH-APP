import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import AddItemModal from './AddItemModal';

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

  // Load available categories on component mount
  useEffect(() => {
    const loadAvailableCategories = async () => {
      try {
        const backendUrl = import.meta.env?.REACT_APP_BACKEND_URL || process.env.REACT_APP_BACKEND_URL;
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

  // Handle adding new items with proper scraping
  const handleAddItem = async (itemData) => {
    if (!selectedSubCategoryId) {
      console.error('❌ No subcategory selected');
      return;
    }

    try {
      const backendUrl = import.meta.env?.REACT_APP_BACKEND_URL || process.env.REACT_APP_BACKEND_URL;
      
      const newItem = {
        ...itemData,
        subcategory_id: selectedSubCategoryId,
        id: `item-${Date.now()}`,
      };

      const response = await fetch(`${backendUrl}/api/items`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newItem)
      });

      if (response.ok) {
        const result = await response.json();
        setShowAddItem(false);
        setSelectedSubCategoryId(null);
        
        if (onReload) {
          await onReload();
        }
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (error) {
      console.error('❌ Error adding item:', error);
    }
  };

  // Handle deleting an item
  const handleDeleteItem = async (itemId) => {
    if (!window.confirm('Are you sure you want to delete this item?')) {
      return;
    }

    try {
      const backendUrl = import.meta.env?.REACT_APP_BACKEND_URL || process.env.REACT_APP_BACKEND_URL;
      const response = await fetch(`${backendUrl}/api/items/${itemId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        console.log('✅ Item deleted successfully');
        if (onReload) {
          await onReload();
        }
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (error) {
      console.error('❌ Error deleting item:', error);
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
      const backendUrl = import.meta.env?.REACT_APP_BACKEND_URL || process.env.REACT_APP_BACKEND_URL;
      const response = await fetch(`${backendUrl}/api/rooms/${roomId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        console.log('✅ Room deleted successfully');
        if (onReload) {
          await onReload();
        }
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (error) {
      console.error('❌ Error deleting room:', error);
    }
  };

  // Handle adding a new room
  const handleAddRoom = () => {
    if (onAddRoom) {
      onAddRoom();
    }
  };

  // Handle adding a new category
  const handleAddCategory = async (roomId, categoryName) => {
    if (!roomId || !categoryName) {
      console.error('❌ Room ID and category name required');
      return;
    }

    try {
      const backendUrl = import.meta.env?.REACT_APP_BACKEND_URL || process.env.REACT_APP_BACKEND_URL;
      const newCategory = {
        room_id: roomId,
        name: categoryName,
        order_index: 0
      };

      const response = await fetch(`${backendUrl}/api/categories`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newCategory)
      });

      if (response.ok) {
        console.log('✅ Category added successfully');
        if (onReload) {
          await onReload();
        }
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (error) {
      console.error('❌ Error adding category:', error);
    }
  };

  // Handle drag and drop for rooms and categories
  const handleDragEnd = async (result) => {
    const { destination, source, type } = result;

    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    try {
      const backendUrl = import.meta.env?.REACT_APP_BACKEND_URL || process.env.REACT_APP_BACKEND_URL;

      if (type === 'room') {
        const rooms = [...project.rooms];
        const [reorderedRoom] = rooms.splice(source.index, 1);
        rooms.splice(destination.index, 0, reorderedRoom);

        for (let i = 0; i < rooms.length; i++) {
          const response = await fetch(`${backendUrl}/api/rooms/${rooms[i].id}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ order_index: i })
          });
          if (!response.ok) {
            throw new Error(`Failed to update room order: ${response.status}`);
          }
        }
        console.log('✅ Room order updated successfully');
      }
      
      else if (type === 'category') {
        const roomId = source.droppableId.replace('categories-', '');
        const room = project.rooms.find(r => r.id === roomId);
        
        if (room) {
          const categories = [...room.categories];
          const [reorderedCategory] = categories.splice(source.index, 1);
          categories.splice(destination.index, 0, reorderedCategory);

          for (let i = 0; i < categories.length; i++) {
            const response = await fetch(`${backendUrl}/api/categories/${categories[i].id}`, {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ order_index: i })
            });
            if (!response.ok) {
              throw new Error(`Failed to update category order: ${response.status}`);
            }
          }
          console.log('✅ Category order updated successfully');
        }
      }

      if (onReload) {
        await onReload();
      }

    } catch (error) {
      console.error('❌ Error updating drag & drop order:', error);
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
      const backendUrl = import.meta.env?.REACT_APP_BACKEND_URL || process.env.REACT_APP_BACKEND_URL;
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

  // Color functions for dropdowns
  const getStatusColor = (status) => {
    const statusColors = {
      'TO BE SELECTED': '#D4A574',
      'RESEARCHING': '#B8860B', 
      'PENDING APPROVAL': '#DAA520',
      'APPROVED': '#9ACD32',
      'ORDERED': '#32CD32',
      'PICKED': '#FFD700',
      'CONFIRMED': '#228B22',
      'IN PRODUCTION': '#FF8C00',
      'SHIPPED': '#4169E1',
      'IN TRANSIT': '#6495ED',
      'OUT FOR DELIVERY': '#87CEEB',
      'DELIVERED TO RECEIVER': '#9370DB',
      'DELIVERED TO JOB SITE': '#8A2BE2',
      'RECEIVED': '#DDA0DD',
      'READY FOR INSTALL': '#20B2AA',
      'INSTALLING': '#48D1CC',
      'INSTALLED': '#00CED1',
      'ON HOLD': '#DC143C',
      'BACKORDERED': '#B22222',
      'DAMAGED': '#8B0000',
      'RETURNED': '#CD5C5C',
      'CANCELLED': '#A52A2A'
    };
    return statusColors[status] || '#D4A574';
  };

  const getCarrierColor = (carrier) => {
    const carrierColors = {
      'FedEx': '#FF6600',
      'UPS': '#8B4513',
      'Brooks': '#4682B4',
      'Zenith': '#20B2AA',
      'Sunbelt': '#DC143C',
      'R+L Carriers': '#8A2BE2',
      'Yellow Freight': '#FFD700',
      'XPO Logistics': '#FF1493',
      'Old Dominion': '#228B22',
      'ABF Freight': '#B22222',
      'OTHER': '#9370DB'
    };
    return carrierColors[carrier] || '#9370DB';
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
              className="w-full px-4 py-2 rounded bg-gray-700 text-white border border-gray-600 focus:border-blue-500 focus:outline-none"
            />
          </div>
          
          {/* Filter Dropdowns */}
          <div className="flex gap-3 flex-wrap">
            <select className="px-3 py-2 rounded bg-gray-700 text-white border border-gray-600 focus:border-blue-500 focus:outline-none">
              <option>All Rooms</option>
              {project.rooms.map(room => (
                <option key={room.id} value={room.id}>{room.name}</option>
              ))}
            </select>
            
            <select className="px-3 py-2 rounded bg-gray-700 text-white border border-gray-600 focus:border-blue-500 focus:outline-none">
              <option>All Categories</option>
              {availableCategories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
            
            <select className="px-3 py-2 rounded bg-gray-700 text-white border border-gray-600 focus:border-blue-500 focus:outline-none">
              <option>All Vendors</option>
              <option>Visual Comfort</option>
              <option>Four Hands</option>
              <option>West Elm</option>
            </select>
            
            <select className="px-3 py-2 rounded bg-gray-700 text-white border border-gray-600 focus:border-blue-500 focus:outline-none">
              <option>All Carriers</option>
              <option>FedEx</option>
              <option>UPS</option>
              <option>Brooks</option>
            </select>
            
            <select className="px-3 py-2 rounded bg-gray-700 text-white border border-gray-600 focus:border-blue-500 focus:outline-none">
              <option>All Statuses</option>
              <option>TO BE SELECTED</option>
              <option>ORDERED</option>
              <option>SHIPPED</option>
              <option>DELIVERED</option>
            </select>
            
            {/* Filter and Clear Buttons */}
            <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium">
              🔍 FILTER
            </button>
            <button className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded font-medium">
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
      <div className="w-full overflow-x-auto" style={{ backgroundColor: '#0F172A' }}>
        <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
          
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="rooms" type="room" isDropDisabled={false}>
              {(provided) => (
                <table className="w-full border-collapse border border-gray-400">
                  
                  <thead>
                    {/* EMPTY HEADER FOR STRUCTURE */}
                  </thead>

                  {/* TABLE BODY - Keep original hierarchical structure */}
                  <tbody ref={provided.innerRef} {...provided.droppableProps}>
                {/* HIERARCHICAL STRUCTURE AS ROW HEADERS - KEEP ORIGINAL */}
                {project.rooms.map((room, roomIndex) => {
                  const isRoomExpanded = expandedRooms[room.id];
                  console.log(`🏠 RENDERING ROOM ${roomIndex}: ${room.name} with ${room.categories?.length || 0} categories`);
                  
                  return (
                    <Draggable key={room.id} draggableId={room.id} index={roomIndex}>
                      {(provided, snapshot) => (
                        <React.Fragment>
                                {/* ROOM HEADER ROW - Full width like your screenshots */}
                                <tr
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  style={{
                                    ...provided.draggableProps.style,
                                    ...(snapshot.isDragging ? { boxShadow: '0 5px 15px rgba(0,0,0,0.3)' } : {})
                                  }}
                                >
                                  <td colSpan="13" 
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
                                {isRoomExpanded && room.categories?.map((category, catIndex) => {
                                          const isCategoryExpanded = expandedCategories[category.id];
                                          console.log(`📁 RENDERING CATEGORY ${catIndex}: ${category.name} with ${category.subcategories?.length || 0} subcategories`);
                                          
                                          return (
                                            <Draggable key={category.id} draggableId={category.id} index={catIndex}>
                                              {(provided, snapshot) => (
                                                <React.Fragment>
                                                  {/* CATEGORY HEADER ROW */}
                                                  <tr
                                                    ref={provided.innerRef}
                                                    {...provided.draggableProps}
                                                    {...provided.dragHandleProps}
                                                    style={{
                                                      ...provided.draggableProps.style,
                                                      ...(snapshot.isDragging ? { boxShadow: '0 3px 10px rgba(0,0,0,0.2)' } : {})
                                                    }}
                                                  >
                                                    <td colSpan="13" 
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
                                                        <td colSpan="1" className="border-gray-400 px-2 py-1 text-xs font-bold text-white text-center" 
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
                                                      </tr>
                                                      
                                                      {/* ITEMS GO DIRECTLY UNDER RED HEADER */}
                                                      {['Ceiling Fixture', 'Recessed Lighting', 'Wall Sconces'].map((itemName, itemIndex) => (
                                                      {/* ACTUAL ITEMS - DARK/BLACK BACKGROUND LIKE YOUR SCREENSHOTS */}
                                                      {['Ceiling Fixture', 'Recessed Lighting', 'Wall Sconces'].map((itemName, itemIndex) => (
                                                        <tr key={itemIndex} className={itemIndex % 2 === 0 ? 'bg-slate-800' : 'bg-slate-700'}>
                                                          {/* INSTALLED - ITEM NAME GOES HERE */}
                                                          <td className="border border-gray-400 px-2 py-2 text-sm text-white">
                                                            {itemName}
                                                          </td>
                                                          
                                                          {/* VENDOR/SKU */}
                                                          <td className="border border-gray-400 px-2 py-2 text-sm text-white">
                                                            <input 
                                                              type="text" 
                                                              placeholder="Vendor/SKU"
                                                              className="w-full bg-transparent border-none text-white text-sm"
                                                              onChange={(e) => console.log('Vendor changed:', e.target.value)}
                                                            />
                                                          </td>
                                                          
                                                          {/* QTY */}
                                                          <td className="border border-gray-400 px-2 py-2 text-sm text-center text-white">
                                                            <input 
                                                              type="number" 
                                                              defaultValue="1"
                                                              className="w-full bg-transparent border-none text-white text-sm text-center"
                                                              onChange={(e) => console.log('Qty changed:', e.target.value)}
                                                            />
                                                          </td>
                                                          
                                                          {/* SIZE */}
                                                          <td className="border border-gray-400 px-2 py-2 text-sm text-white">
                                                            <input 
                                                              type="text" 
                                                              placeholder="Size"
                                                              className="w-full bg-transparent border-none text-white text-sm"
                                                              onChange={(e) => console.log('Size changed:', e.target.value)}
                                                            />
                                                          </td>
                                                          
                                                          {/* FINISH/Color */}
                                                          <td className="border border-gray-400 px-2 py-2 text-sm text-white">
                                                            <input 
                                                              type="text" 
                                                              placeholder="Finish/Color"
                                                              className="w-full bg-transparent border-none text-white text-sm"
                                                              onChange={(e) => console.log('Finish changed:', e.target.value)}
                                                            />
                                                          </td>
                                                          
                                                          {/* Cost/Price */}
                                                          <td className="border border-gray-400 px-2 py-2 text-sm text-white">
                                                            <input 
                                                              type="text" 
                                                              placeholder="$0.00"
                                                              className="w-full bg-transparent border-none text-white text-sm"
                                                              onChange={(e) => console.log('Cost changed:', e.target.value)}
                                                            />
                                                          </td>
                                                          
                                                          {/* Image */}
                                                          <td className="border border-gray-400 px-2 py-2 text-center text-white">
                                                            📷 Image
                                                          </td>
                                                          
                                                          {/* RIGHT SIDE - STACKED COLUMNS AS USER SPECIFIED */}
                                                          
                                                          {/* Order Date (ALONE) */}
                                                          <td className="border border-gray-400 px-2 py-2 text-sm">
                                                            <input 
                                                              type="date" 
                                                              className="w-full bg-transparent border-none text-white text-sm"
                                                              onChange={(e) => console.log('Order date changed:', e.target.value)}
                                                            />
                                                          </td>
                                                          
                                                          {/* Order Status/Order Number (STACKED) */}
                                                          <td className="border border-gray-400 px-2 py-2 text-sm">
                                                            <div className="space-y-1">
                                                              <select 
                                                                className="w-full bg-transparent border-none text-white text-xs"
                                                                onChange={(e) => console.log('Order status changed:', e.target.value)}
                                                              >
                                                                <option value="">Status...</option>
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
                                                              <input 
                                                                type="text" 
                                                                placeholder="Order #"
                                                                className="w-full bg-transparent border-none text-white text-xs"
                                                                onChange={(e) => console.log('Order number changed:', e.target.value)}
                                                              />
                                                            </div>
                                                          </td>
                                                          
                                                          {/* Estimated Ship Date/Estimated Delivery Date (STACKED) */}
                                                          <td className="border border-gray-400 px-2 py-2 text-sm">
                                                            <div className="space-y-1">
                                                              <input 
                                                                type="date" 
                                                                className="w-full bg-transparent border-none text-white text-xs"
                                                                onChange={(e) => console.log('Estimated ship date changed:', e.target.value)}
                                                              />
                                                              <input 
                                                                type="date" 
                                                                className="w-full bg-transparent border-none text-white text-xs"
                                                                onChange={(e) => console.log('Estimated delivery date changed:', e.target.value)}
                                                              />
                                                            </div>
                                                          </td>
                                                          
                                                          {/* Install Date/Ship To (STACKED) */}
                                                          <td className="border border-gray-400 px-2 py-2 text-sm">
                                                            <div className="space-y-1">
                                                              <input 
                                                                type="date" 
                                                                className="w-full bg-transparent border-none text-white text-xs"
                                                                onChange={(e) => console.log('Install date changed:', e.target.value)}
                                                              />
                                                              <select 
                                                                className="w-full bg-transparent border-none text-white text-xs"
                                                                onChange={(e) => console.log('Ship to changed:', e.target.value)}
                                                              >
                                                                <option value="">Ship To...</option>
                                                                <option value="CLIENT_HOME">CLIENT HOME</option>
                                                                <option value="JOB_SITE">JOB SITE</option>
                                                                <option value="WAREHOUSE">WAREHOUSE</option>
                                                              </select>
                                                            </div>
                                                          </td>
                                                          
                                                          {/* Tracking/Carrier (STACKED) - LIVE TRACKING */}
                                                          <td className="border border-gray-400 px-2 py-2 text-sm">
                                                            <div className="space-y-1">
                                                              <input 
                                                                type="text" 
                                                                placeholder="Live Tracking #"
                                                                className="w-full bg-transparent border-none text-white text-xs"
                                                                onChange={(e) => console.log('Live tracking changed:', e.target.value)}
                                                              />
                                                              <select 
                                                                className="w-full bg-transparent border-none text-white text-xs"
                                                                onChange={(e) => console.log('Carrier changed:', e.target.value)}
                                                              >
                                                                <option value="">Carrier...</option>
                                                                <option value="FedEx">FedEx</option>
                                                                <option value="UPS">UPS</option>
                                                                <option value="USPS">USPS</option>
                                                                <option value="OTHER">OTHER</option>
                                                              </select>
                                                            </div>
                                                          </td>
                                                          
                                                          {/* NOTES - EDITABLE */}
                                                          <td className="border border-gray-400 px-2 py-2 text-sm">
                                                            <input 
                                                              type="text" 
                                                              placeholder="Notes"
                                                              className="w-full bg-transparent border-none text-white text-sm"
                                                              onChange={(e) => console.log('Notes changed:', e.target.value)}
                                                            />
                                                          </td>
                                                        </tr>
                                                      ))}
                                                      
                                                      {/* BUTTONS ROW - LEFT ALIGNED WITH GOLD COLOR */}
                                                      <tr>
                                                        <td colSpan="13" className="border border-gray-400 px-6 py-2 bg-slate-900">
                                                          <div className="flex justify-start items-center space-x-4">
                                                            {/* Add Item Button - GOLD/AMBER COLOR */}
                                                            <button
                                                              onClick={() => {
                                                                setSelectedSubCategoryId(subcategory.id);
                                                                setShowAddItem(true);
                                                              }}
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
                                                              {availableCategories.map((category) => (
                                                                <option key={category} value={category}>
                                                                  {category}
                                                                </option>
                                                              ))}
                                                              <option value="CREATE_NEW">➕ Create New Category</option>
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
                                                      ))}
                                                    </React.Fragment>
                                                  )}
                                            </Draggable>
                                          );
                                        })}
                                )}
                              </React.Fragment>
                            )}
                          </Draggable>
                        );
                      })}
                      {provided.placeholder}
                  </tbody>
                </table>
              )}
            </Droppable>
          </DragDropContext>

        </div>
      </div>

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
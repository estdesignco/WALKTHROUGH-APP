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
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [selectedRoomId, setSelectedRoomId] = useState(null);
  const [availableCategories, setAvailableCategories] = useState([]);

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
        // Set fallback categories
        setAvailableCategories([
          "Lighting", "Furniture & Storage", "Decor & Accessories", 
          "Paint, Wallpaper & Finishes", "Architectural Elements, Built-ins & Trim",
          "Flooring", "Window Treatments", "HVAC & Mechanical Systems",
          "Security & Smart Home", "Appliances", "Plumbing & Fixtures"
        ]);
      }
    };
    
    loadAvailableCategories();
  }, []);

  // Handle adding new items with proper scraping
  const handleAddItem = async (itemData) => {
    if (!selectedSubCategoryId) {
      console.error('❌ No subcategory selected');
      // ✅ ERROR BANNER REMOVED - NO MORE POPUPS
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
        // ✅ SUCCESS BANNER REMOVED AS REQUESTED
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
      console.error('❌ Failed to add item:', error.message);
      // ✅ ERROR BANNER REMOVED - NO MORE POPUPS
    }
  };

  // COMPLETE COLOR MAPPING FOR ALL DROPDOWN VALUES
  const getStatusColor = (status) => {
    const statusColors = {
      // Planning Phase
      'TO BE SELECTED': '#D4A574',
      'RESEARCHING': '#B8860B', 
      'PENDING APPROVAL': '#DAA520',
      
      // Procurement Phase  
      'APPROVED': '#9ACD32',
      'ORDERED': '#32CD32',
      'PICKED': '#FFD700',  // YELLOW like your image
      'CONFIRMED': '#228B22',
      
      // Fulfillment Phase
      'IN PRODUCTION': '#FF8C00',
      'SHIPPED': '#4169E1',
      'IN TRANSIT': '#6495ED',
      'OUT FOR DELIVERY': '#87CEEB',
      
      // Delivery Phase
      'DELIVERED TO RECEIVER': '#9370DB',
      'DELIVERED TO JOB SITE': '#8A2BE2',
      'RECEIVED': '#DDA0DD',
      
      // Installation Phase
      'READY FOR INSTALL': '#20B2AA',
      'INSTALLING': '#48D1CC',
      'INSTALLED': '#00CED1',
      
      // Issues & Exceptions
      'ON HOLD': '#DC143C',
      'BACKORDERED': '#B22222',
      'DAMAGED': '#8B0000',
      'RETURNED': '#CD5C5C',
      'CANCELLED': '#A52A2A'
    };
    return statusColors[status] || '#FFD700';
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
      'Estes Express': '#4B0082',
      'Saia LTL': '#2E8B57',
      'TForce Freight': '#FF4500',
      'Roadrunner': '#6B8E23',
      'Central Transport': '#8B008B',
      'Southeastern Freight': '#D2691E',
      'Averitt Express': '#CD853F',
      'Holland': '#F4A460',
      'USPS': '#0047AB',
      'DHL': '#FFCC00',
      'OTHER': '#9370DB'
    };
    return carrierColors[carrier] || '#9370DB';
  };

  const getShipToColor = (shipTo) => {
    const shipToColors = {
      'Client': '#FFD700',      // Yellow
      'Receiver': '#87CEEB',    // Sky Blue  
      'Store': '#DDA0DD',       // Plum
      'Jobsite': '#98FB98'      // Pale Green
    };
    return shipToColors[shipTo] || '#FFD700';
  };

  const getDeliveryStatusColor = (status) => {
    const deliveryColors = {
      'PENDING': '#C7D2FE',                  // Light Blue
      'SCHEDULED': '#E0E7FF',               // Very Light Blue
      'PROCESSING': '#FEF3C7',              // Light Yellow
      'IN TRANSIT': '#FEF08A',              // Light Yellow
      'OUT FOR DELIVERY': '#BFDBFE',        // Light Blue
      'ATTEMPTED DELIVERY': '#FECACA',      // Light Red
      'DELIVERED': '#A7F3D0',               // Light Green
      'DELIVERED TO RECEIVER': '#86EFAC',   // Green
      'AVAILABLE FOR PICKUP': '#D1FAE5',   // Very Light Green
      'DELAYED': '#FCA5A5',                 // Light Red
      'EXCEPTION': '#F87171',               // Red
      'DAMAGED': '#EF4444',                 // Dark Red
      'LOST': '#DC2626',                    // Darker Red
      'RETURNED TO SENDER': '#B91C1C'       // Darkest Red
    };
    return deliveryColors[status] || '#FEF08A';
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
        // ✅ SUCCESS BANNER REMOVED AS REQUESTED
      } else {
        console.error('❌ Failed to get tracking information');
        // ✅ ERROR BANNER REMOVED - NO MORE POPUPS
      }
    } catch (error) {
      console.error('❌ Tracking error:', error);
      console.error('❌ Tracking service unavailable');
      // ✅ ERROR BANNER REMOVED - NO MORE POPUPS
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
    // This will be connected to the main ADD ROOM button functionality
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

    // If dropped outside the list
    if (!destination) {
      return;
    }

    // If dropped in the same position
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    try {
      const backendUrl = import.meta.env?.REACT_APP_BACKEND_URL || process.env.REACT_APP_BACKEND_URL;

      // Handle room reordering
      if (type === 'room') {
        // Update room order_index in the backend
        const rooms = [...project.rooms];
        const [reorderedRoom] = rooms.splice(source.index, 1);
        rooms.splice(destination.index, 0, reorderedRoom);

        // Update order_index for each room based on new position
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
      
      // Handle category reordering within a room
      else if (type === 'category') {
        const roomId = source.droppableId.replace('categories-', '');
        const room = project.rooms.find(r => r.id === roomId);
        
        if (room) {
          const categories = [...room.categories];
          const [reorderedCategory] = categories.splice(source.index, 1);
          categories.splice(destination.index, 0, reorderedCategory);

          // Update order_index for each category based on new position
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

      // Reload data to reflect changes
      if (onReload) {
        await onReload();
      }

    } catch (error) {
      console.error('❌ Error updating drag & drop order:', error);
    }
  };

  // MUTED COLORS FOR EACH ROOM - Reduced from 10 to 7 intensity!
  const getRoomColor = (roomName) => {
    const roomColors = {
      'living room': '#553C9A',      // Much more muted (intensity 5)
      'dining room': '#991B1B',      // Much more muted (intensity 5)  
      'kitchen': '#92400E',          // Much more muted (intensity 5)
      'primary bedroom': '#065F46',  // Much more muted (intensity 5)
      'primary bathroom': '#1E3A8A', // Much more muted (intensity 5)
      'powder room': '#57534E',      // Much more muted (intensity 5)
      'guest room': '#9D174D',       // Much more muted (intensity 5)
      'office': '#312E81',           // Much more muted (intensity 5)
      'laundry room': '#365314',     // Much more muted (intensity 5)
      'mudroom': '#164E63',          // Much more muted (intensity 5)
      'family room': '#9A3412',      // Much more muted (intensity 5)
      'basement': '#4B5563',         // Keep Gray
      'attic storage': '#57534E',    // Much more muted (intensity 5)
      'garage': '#374151',           // Keep Gray-800
      'balcony': '#5B21B6',          // Much more muted (intensity 5)
      'screened porch': '#065F46',   // Much more muted (intensity 5)
      'pool house': '#0C4A6E',       // Much more muted (intensity 5)
      'guest house': '#991B1B',      // Much more muted (intensity 5)
      'butler\'s pantry': '#92400E', // Much more muted (intensity 5)
      'conservatory': '#365314',     // Much more muted (intensity 5)
      'formal living room': '#92400E', // Keep Orange-900
      'great room': '#312E81',       // Much more muted (intensity 5)
      'billiards room': '#831843',   // Much more muted (intensity 5)
      'study': '#374151',            // Keep Gray-700
      'sitting room': '#1E3A8A'      // Keep Blue-700
    };
    return roomColors[roomName.toLowerCase()] || '#7C3AED';
  };

  // LIGHTING much more muted (intensity 5)
  const getCategoryColor = () => '#0F2A19'; // Much more muted (intensity 5)

  // HEADER colors - much more muted (intensity 5)  
  const getMainHeaderColor = () => '#7F1D1D';        // Much more muted (intensity 5)
  const getAdditionalInfoColor = () => '#78350F';    // Much more muted (intensity 5)
  const getShippingInfoColor = () => '#581C87';      // Much more muted (intensity 5)  
  const getNotesActionsColor = () => '#991B1B';      // Much more muted (intensity 5)

  if (!project || !project.rooms) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Loading FF&E Project...</h2>
      </div>
    );
  }

  return (
    <div className="w-full bg-white">
      
      {/* ONE CONTINUOUS SPREADSHEET */}
      {/* ✅ FIXED SCROLLING ISSUE - PROPER CONTAINMENT */}
      <div 
        className="w-full overflow-x-auto overflow-y-visible" 
        style={{ 
          height: '80vh',
          overscrollBehavior: 'contain',
          scrollBehavior: 'smooth'
        }}
        onScroll={(e) => {
          // Prevent page navigation on scroll boundaries
          e.stopPropagation();
        }}
      >
        <div style={{ minWidth: '2500px' }}>
          
          <DragDropContext onDragEnd={handleDragEnd}>
            <table className="w-full border-collapse border border-gray-400">
              
              <thead></thead>
              
              <tbody>
                <Droppable droppableId="rooms" type="room">
                  {(provided) => (
                    <div ref={provided.innerRef} {...provided.droppableProps}>
                      {/* HIERARCHICAL STRUCTURE AS ROW HEADERS */}
                      {project.rooms.map((room, roomIndex) => {
                        console.log(`🏠 RENDERING ROOM ${roomIndex}: ${room.name} with ${room.categories?.length || 0} categories`);
                        return (
                          <Draggable key={room.id} draggableId={room.id} index={roomIndex}>
                            {(provided, snapshot) => (
                              <React.Fragment>
                  
                  {/* ROOM HEADER ROW - Muted colors with Delete Button */}
                  <tr
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    style={{
                      ...provided.draggableProps.style,
                      ...(snapshot.isDragging ? { boxShadow: '0 5px 15px rgba(0,0,0,0.3)' } : {})
                    }}
                  >
                    <td colSpan="14" 
                        className="border border-gray-400 px-3 py-2 text-white text-sm font-bold"
                        style={{ backgroundColor: getRoomColor(room.name) }}>
                      <div className="flex justify-between items-center">
                        <span>🏠 {room.name.toUpperCase()}</span>
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
                  
                  {/* ROOM CATEGORIES - Droppable within each room */}
                  <Droppable droppableId={`categories-${room.id}`} type="category">
                    {(provided) => (
                      <div ref={provided.innerRef} {...provided.droppableProps}>
                        {room.categories?.map((category, catIndex) => {
                          console.log(`📁 RENDERING CATEGORY ${catIndex}: ${category.name} with ${category.subcategories?.length || 0} subcategories`);
                          return (
                            <Draggable key={category.id} draggableId={category.id} index={catIndex}>
                              {(provided, snapshot) => (
                                <React.Fragment>
                                  <tr
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    {...provided.dragHandleProps}
                                    style={{
                                      ...provided.draggableProps.style,
                                      ...(snapshot.isDragging ? { boxShadow: '0 3px 10px rgba(0,0,0,0.2)' } : {})
                                    }}
                                  >
                                    <td colSpan="15" 
                                        className="border border-gray-400 px-4 py-2 text-white text-sm font-bold"
                                        style={{ backgroundColor: getCategoryColor() }}>
                                      📁 {category.name.toUpperCase()}
                                    </td>
                                  </tr>
                      
                      {/* SUBCATEGORIES */}
                      {category.subcategories?.map((subcategory) => (
                        <React.Fragment key={subcategory.id}>
                          
                          {/* NO SEPARATE SUBCATEGORY HEADER ROW - DELETED COMPLETELY */}
                          
                          {/* FIXED HEADER STRUCTURE - Only section headers on top */}
                          <tr>
                            {/* Empty cells for main data columns */}
                            <td className="border border-gray-400" style={{ backgroundColor: getMainHeaderColor() }}></td>
                            <td className="border border-gray-400" style={{ backgroundColor: getMainHeaderColor() }}></td>
                            <td className="border border-gray-400" style={{ backgroundColor: getMainHeaderColor() }}></td>
                            <td className="border border-gray-400" style={{ backgroundColor: getMainHeaderColor() }}></td>
                            <td className="border border-gray-400" style={{ backgroundColor: getMainHeaderColor() }}></td>
                            
                            {/* ADDITIONAL INFO section header */}
                            <th className="border border-gray-400 px-2 py-1 text-xs font-bold text-white text-center" 
                                style={{ backgroundColor: getAdditionalInfoColor() }} colSpan="3">
                              ADDITIONAL INFO.
                            </th>
                            
                            {/* SHIPPING INFO section header */}
                            <th className="border border-gray-400 px-2 py-1 text-xs font-bold text-white text-center" 
                                style={{ backgroundColor: getShippingInfoColor() }} colSpan="5">
                              SHIPPING INFO.
                            </th>
                            
                            {/* Empty cells for notes/actions */}
                            <td className="border border-gray-400" style={{ backgroundColor: getNotesActionsColor() }}></td>
                            <td className="border border-gray-400" style={{ backgroundColor: getNotesActionsColor() }}></td>
                          </tr>
                          
                          {/* COLUMN HEADERS - All moved down here */}
                          <tr>
                            <th className="border border-gray-400 px-2 py-2 text-left text-xs font-bold text-white min-w-[150px]" 
                                style={{ backgroundColor: getMainHeaderColor() }}>
                              {subcategory.name.toUpperCase()}
                            </th>
                            <th className="border border-gray-400 px-2 py-2 text-left text-xs font-bold text-white min-w-[120px]" 
                                style={{ backgroundColor: getMainHeaderColor() }}>
                              VENDOR/SKU
                            </th>
                            <th className="border border-gray-400 px-2 py-2 text-center text-xs font-bold text-white min-w-[50px]" 
                                style={{ backgroundColor: getMainHeaderColor() }}>
                              QTY
                            </th>
                            <th className="border border-gray-400 px-2 py-2 text-left text-xs font-bold text-white min-w-[80px]" 
                                style={{ backgroundColor: getMainHeaderColor() }}>
                              SIZE
                            </th>
                            <th className="border border-gray-400 px-2 py-2 text-left text-xs font-bold text-white min-w-[100px]" 
                                style={{ backgroundColor: getMainHeaderColor() }}>
                              ORDERS STATUS
                            </th>
                            
                            {/* ADDITIONAL INFO columns */}
                            <th className="border border-gray-400 px-2 py-2 text-left text-xs font-bold text-white" 
                                style={{ backgroundColor: getAdditionalInfoColor() }}>
                              FINISH/Color
                            </th>
                            <th className="border border-gray-400 px-2 py-2 text-right text-xs font-bold text-white" 
                                style={{ backgroundColor: getAdditionalInfoColor() }}>
                              Cost/Price
                            </th>
                            <th className="border border-gray-400 px-2 py-2 text-center text-xs font-bold text-white" 
                                style={{ backgroundColor: getAdditionalInfoColor() }}>
                              Image
                            </th>
                            
                            {/* SHIPPING INFO columns */}
                            <th className="border border-gray-400 px-2 py-2 text-left text-xs font-bold text-white" 
                                style={{ backgroundColor: getShippingInfoColor() }}>
                              SHIP TO
                            </th>
                            <th className="border border-gray-400 px-2 py-2 text-left text-xs font-bold text-white" 
                                style={{ backgroundColor: getShippingInfoColor() }}>
                              CARRIER
                            </th>
                            <th className="border border-gray-400 px-2 py-2 text-left text-xs font-bold text-white" 
                                style={{ backgroundColor: getShippingInfoColor() }}>
                              TRACKING # 
                            </th>
                            <th className="border border-gray-400 px-2 py-2 text-left text-xs font-bold text-white" 
                                style={{ backgroundColor: getShippingInfoColor() }}>
                              Order Date
                            </th>
                            <th className="border border-gray-400 px-2 py-2 text-left text-xs font-bold text-white" 
                                style={{ backgroundColor: getShippingInfoColor() }}>
                              DELIVERY STATUS
                            </th>
                            
                            {/* NOTES and ACTIONS */}
                            <th className="border border-gray-400 px-2 py-2 text-left text-xs font-bold text-white min-w-[150px]" 
                                style={{ backgroundColor: getNotesActionsColor() }}>
                              NOTES
                            </th>
                            <th className="border border-gray-400 px-2 py-2 text-center text-xs font-bold text-white min-w-[80px]" 
                                style={{ backgroundColor: getNotesActionsColor() }}>
                              ACTIONS
                            </th>
                          </tr>
                          
                          {/* CLEAN DATA ROWS - No extra containers */}
                          {subcategory.items?.map((item, itemIndex) => (
                            <tr key={`${subcategory.id}-${itemIndex}`} 
                                className="transition-colors hover:bg-gray-600"
                                style={{ 
                                  backgroundColor: itemIndex % 2 === 0 ? '#1F2937' : '#111827' 
                                }}>
                              
                              {/* ITEM NAME - Plain text, no input container */}
                              <td className="border border-gray-400 px-2 py-2 text-sm text-white">
                                {item.name || 'Crystal Chandelier'}
                              </td>
                              
                              {/* VENDOR/SKU - Plain text, no input container */}
                              <td className="border border-gray-400 px-2 py-2 text-sm text-white">
                                {item.vendor || 'Visual Comfort / CHC2175'}
                              </td>
                              
                              {/* QTY - Plain text, no input container */}
                              <td className="border border-gray-400 px-2 py-2 text-center text-sm text-white">
                                {item.quantity || 1}
                              </td>
                              
                              {/* SIZE - Plain text, no input container */}
                              <td className="border border-gray-400 px-2 py-2 text-sm text-white">
                                {item.size || '28"W x 30"H'}
                              </td>
                              
                              {/* ORDERS STATUS - BLANK DEFAULT */}
                              <td className="border border-gray-400 px-2 py-2 text-sm">
                                <select 
                                  value={item.status || ''}
                                  onChange={(e) => {
                                    console.log(`Status changed to: ${e.target.value} with color: ${getStatusColor(e.target.value)}`);
                                  }}
                                  className="w-full border-none outline-none rounded px-2 py-1 text-xs font-medium"
                                  style={{
                                    backgroundColor: item.status ? getStatusColor(item.status) : '#374151',
                                    color: '#000'
                                  }}
                                >
                                  <option value="">Select Status...</option>
                                  <option value="TO BE SELECTED">🟤 TO BE SELECTED</option>
                                  <option value="RESEARCHING">🟫 RESEARCHING</option>
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
                                  <option value="READY FOR INSTALL">🔷 READY FOR INSTALL</option>
                                  <option value="INSTALLING">🔷 INSTALLING</option>
                                  <option value="INSTALLED">🔷 INSTALLED</option>
                                  <option value="ON HOLD">🔴 ON HOLD</option>
                                  <option value="BACKORDERED">🔴 BACKORDERED</option>
                                  <option value="DAMAGED">🔴 DAMAGED</option>
                                  <option value="RETURNED">🔴 RETURNED</option>
                                  <option value="CANCELLED">🔴 CANCELLED</option>
                                </select>
                              </td>
                              
                              {/* FINISH/Color - Plain text, no container */}
                              <td className="border border-gray-400 px-2 py-2 text-sm text-white">
                                {item.finish_color || 'Antique Brass'}
                              </td>
                              
                              {/* Cost/Price - Plain text, no container */}
                              <td className="border border-gray-400 px-2 py-2 text-right text-sm text-white">
                                ${item.cost || 1250}
                              </td>
                              
                              {/* Image */}
                              <td className="border border-gray-400 px-2 py-2 text-center">
                                {item.image_url ? (
                                  <img src={item.image_url} alt={item.name}
                                       className="w-12 h-12 object-cover rounded border border-gray-300 cursor-pointer"
                                       onClick={() => window.open(item.image_url, '_blank')}
                                  />
                                ) : (
                                  <button className="text-blue-400 text-xs underline">+ Image</button>
                                )}
                              </td>
                              
                              {/* SHIP TO - BLANK DEFAULT */}
                              <td className="border border-gray-400 px-2 py-2 text-sm">
                                <select 
                                  value={item.ship_to || ''}
                                  onChange={(e) => {
                                    console.log(`Ship To changed to: ${e.target.value} with color: ${getShipToColor(e.target.value)}`);
                                  }}
                                  className="w-full border-none outline-none rounded px-1 py-1 text-xs font-medium"
                                  style={{
                                    backgroundColor: item.ship_to ? getShipToColor(item.ship_to) : '#374151',
                                    color: '#000'
                                  }}
                                >
                                  <option value="">Select Ship To...</option>
                                  <option value="Client">🟡 Client</option>
                                  <option value="Receiver">🔵 Receiver</option>
                                  <option value="Store">🟣 Store</option>
                                  <option value="Jobsite">🟢 Jobsite</option>
                                </select>
                              </td>
                              
                              {/* CARRIER - BLANK DEFAULT */}
                              <td className="border border-gray-400 px-2 py-2 text-sm">
                                <select 
                                  value={item.carrier || ''}
                                  onChange={(e) => {
                                    console.log(`Carrier changed to: ${e.target.value} with color: ${getCarrierColor(e.target.value)}`);
                                  }}
                                  className="w-full border-none outline-none rounded px-1 py-1 text-xs font-medium"
                                  style={{
                                    backgroundColor: item.carrier ? getCarrierColor(item.carrier) : '#374151',
                                    color: '#000'
                                  }}
                                >
                                  <option value="">Select Carrier...</option>
                                  <option value="FedEx">🟠 FedEx</option>
                                  <option value="UPS">🟫 UPS</option>
                                  <option value="USPS">🔵 USPS</option>
                                  <option value="DHL">🟡 DHL</option>
                                  <option value="Brooks">🔵 Brooks</option>
                                  <option value="Zenith">🔷 Zenith</option>
                                  <option value="Sunbelt">🔴 Sunbelt</option>
                                  <option value="R+L Carriers">🟣 R+L Carriers</option>
                                  <option value="Yellow Freight">🟡 Yellow Freight</option>
                                  <option value="XPO Logistics">🔴 XPO Logistics</option>
                                  <option value="Old Dominion">🟢 Old Dominion</option>
                                  <option value="ABF Freight">🔴 ABF Freight</option>
                                  <option value="Estes Express">🟣 Estes Express</option>
                                  <option value="Saia LTL">🟢 Saia LTL</option>
                                  <option value="TForce Freight">🟠 TForce Freight</option>
                                  <option value="Roadrunner">🟢 Roadrunner</option>
                                  <option value="Central Transport">🟣 Central Transport</option>
                                  <option value="Southeastern Freight">🟫 Southeastern Freight</option>
                                  <option value="Averitt Express">🟫 Averitt Express</option>
                                  <option value="Holland">🟫 Holland</option>
                                  <option value="OTHER">🟣 OTHER</option>
                                </select>
                              </td>
                              
                              {/* TRACKING # with LIVE TRACKING */}
                              <td className="border border-gray-400 px-2 py-2 text-sm">
                                {item.tracking_number ? (
                                  <div className="space-y-1">
                                    <div className="text-white text-xs">
                                      {item.tracking_number}
                                    </div>
                                    <button 
                                      onClick={() => handleTrackItem(item)}
                                      className="text-blue-400 text-xs underline hover:text-blue-300"
                                    >
                                      🔴 Track Live
                                    </button>
                                  </div>
                                ) : (
                                  <button className="text-blue-400 text-xs underline">Add Tracking #</button>
                                )}
                              </td>
                              
                              {/* Order Date - DATE PICKER in container (KEEP CONTAINER) */}
                              <td className="border border-gray-400 px-2 py-2 text-sm">
                                <div>
                                  <input 
                                    type="date"
                                    value={item.order_date || '2025-01-15'}
                                    className="w-full bg-gray-700 text-white text-xs rounded px-1"
                                  />
                                </div>
                              </td>
                              
                              {/* DELIVERY STATUS - BLANK DEFAULT */}
                              <td className="border border-gray-400 px-2 py-2 text-sm">
                                <select 
                                  value={item.delivery_status || ''}
                                  onChange={(e) => {
                                    console.log(`Delivery Status changed to: ${e.target.value} with color: ${getDeliveryStatusColor(e.target.value)}`);
                                  }}
                                  className="w-full border-none outline-none rounded px-1 py-1 text-xs font-medium"
                                  style={{
                                    backgroundColor: item.delivery_status ? getDeliveryStatusColor(item.delivery_status) : '#374151',
                                    color: '#000'
                                  }}
                                >
                                  <option value="">Select Delivery Status...</option>
                                  <option value="PENDING">🔵 PENDING</option>
                                  <option value="SCHEDULED">🔵 SCHEDULED</option>
                                  <option value="PROCESSING">🟡 PROCESSING</option>
                                  <option value="IN TRANSIT">🟡 IN TRANSIT</option>
                                  <option value="OUT FOR DELIVERY">🔵 OUT FOR DELIVERY</option>
                                  <option value="ATTEMPTED DELIVERY">🔴 ATTEMPTED DELIVERY</option>
                                  <option value="DELIVERED">🟢 DELIVERED</option>
                                  <option value="DELIVERED TO RECEIVER">🟢 DELIVERED TO RECEIVER</option>
                                  <option value="AVAILABLE FOR PICKUP">🟢 AVAILABLE FOR PICKUP</option>
                                  <option value="DELAYED">🔴 DELAYED</option>
                                  <option value="EXCEPTION">🔴 EXCEPTION</option>
                                  <option value="DAMAGED">🔴 DAMAGED</option>
                                  <option value="LOST">🔴 LOST</option>
                                  <option value="RETURNED TO SENDER">🔴 RETURNED TO SENDER</option>
                                </select>
                              </td>
                              
                              {/* NOTES - Plain text, no container */}
                              <td className="border border-gray-400 px-2 py-2 text-sm text-white">
                                {item.notes || 'For dining room entryway'}
                              </td>
                              
                              {/* ACTIONS */}
                              <td className="border border-gray-400 px-2 py-2 text-center">
                                <button className="text-red-400 hover:text-red-300 text-lg">
                                  🗑️
                                </button>
                              </td>
                            </tr>
                          ))}
                          
                          {/* ADD ITEM ROW */}
                          <tr>
                            <td colSpan="15" className="border border-gray-400 px-6 py-2 text-center">
                              <button
                                onClick={() => {
                                  setSelectedSubCategoryId(subcategory.id);
                                  setShowAddItem(true);
                                }}
                                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                              >
                                + Add Item
                              </button>
                            </td>
                          </tr>
                          
                        </React.Fragment>
                      ))}
                    </React.Fragment>
                  );})}
                  
                  {/* ADD CATEGORY ROW - Enhanced with dropdown */}
                  <tr>
                    <td colSpan="15" className="border border-gray-400 px-6 py-2 text-center bg-gray-100">
                      <div className="flex justify-center items-center space-x-4">
                        {/* Add Category Dropdown */}
                        <div className="flex items-center space-x-2">
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
                            className="border border-gray-300 rounded px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="">+ Add Category ▼</option>
                            {availableCategories.map((category) => (
                              <option key={category} value={category}>
                                {category}
                              </option>
                            ))}
                            <option value="CREATE_NEW">➕ Create New Category</option>
                          </select>
                        </div>
                        
                        {/* Delete Section Button */}
                        <button
                          onClick={() => handleDeleteRoom(room.id)}
                          className="text-red-600 hover:text-red-800 text-sm font-medium"
                          title="Delete Section"
                        >
                          🗑️ Delete Section
                        </button>
                      </div>
                    </td>
                  </tr>
                  
                                </React.Fragment>
                              )}
                            </Draggable>
                          );
                        })}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                  
                              </React.Fragment>
                            )}
                          </Draggable>
                        );
                      })}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </tbody>
            </table>
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
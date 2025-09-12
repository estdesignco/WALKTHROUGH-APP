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

  // ORIGINAL COLORS - EXACT MATCH FROM SCREENSHOTS
  const getRoomColor = (roomName) => {
    const roomColors = {
      'living room': '#553C9A',      
      'dining room': '#991B1B',      
      'kitchen': '#92400E',          
      'primary bedroom': '#065F46',  
      'primary bathroom': '#1E3A8A', 
      'powder room': '#57534E',      
      'guest room': '#9D174D',       
      'office': '#312E81',           
      'laundry room': '#365314',     
      'mudroom': '#164E63',          
      'family room': '#9A3412',      
      'basement': '#4B5563',         
      'attic storage': '#57534E',    
      'garage': '#374151',           
      'balcony': '#5B21B6',          
      'screened porch': '#065F46',   
      'pool house': '#0C4A6E',       
      'guest house': '#991B1B',      
      'butler\'s pantry': '#92400E', 
      'conservatory': '#365314',     
      'formal living room': '#92400E', 
      'great room': '#312E81',       
      'billiards room': '#831843',   
      'study': '#374151',            
      'sitting room': '#1E3A8A'      
    };
    return roomColors[roomName.toLowerCase()] || '#7C3AED';
  };

  // ORIGINAL COLORS - EXACT MATCH FROM SCREENSHOTS
  const getCategoryColor = () => '#0F2A19'; // Dark green from screenshots

  // ORIGINAL HEADER COLORS - EXACT MATCH FROM SCREENSHOTS
  const getMainHeaderColor = () => '#7F1D1D';        // Dark red for main headers
  const getAdditionalInfoColor = () => '#78350F';    // Brown for ADDITIONAL INFO.
  const getShippingInfoColor = () => '#581C87';      // Purple for SHIPPING INFO.  
  const getNotesActionsColor = () => '#991B1B';      // Red for NOTES and ACTIONS

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
      'PICKED': '#FFD700',  
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
    <div className="w-full bg-gray-900">
      
      {/* DARK BACKGROUND SPREADSHEET - ORIGINAL DESIGN WITH DRAG & DROP */}
      <div 
        className="w-full overflow-x-auto overflow-y-visible bg-gray-900" 
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
                                {/* ROOM HEADER ROW - With Delete Button */}
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
                                      <span>{room.name.toUpperCase()}</span>
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
                                
                                {/* ROOM CATEGORIES - Droppable */}
                                <Droppable droppableId={`categories-${room.id}`} type="category">
                                  {(provided) => (
                                    <div ref={provided.innerRef} {...provided.droppableProps}>
                                      {room.categories?.map((category, catIndex) => {
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
                                                  <td colSpan="15" 
                                                      className="border border-gray-400 px-4 py-2 text-white text-sm font-bold"
                                                      style={{ backgroundColor: getCategoryColor() }}>
                                                    {category.name.toUpperCase()}
                                                  </td>
                                                </tr>

                                                {/* SUBCATEGORIES AND ITEMS */}
                                                {category.subcategories?.map((subcategory) => (
                                                  <React.Fragment key={subcategory.id}>
                                                    
                                                    {/* SUBCATEGORY HEADER ROW WITH PROPER SECTION HEADERS */}
                                                    <tr>
                                                      <td className="border border-gray-400 px-2 py-1 text-xs font-bold text-white text-center" style={{ backgroundColor: getMainHeaderColor() }}>
                                                        {subcategory.name.toUpperCase()}
                                                      </td>
                                                      <td className="border border-gray-400 px-2 py-1 text-xs font-bold text-white text-center" style={{ backgroundColor: getMainHeaderColor() }}>
                                                        VENDOR/SKU
                                                      </td>
                                                      <td className="border border-gray-400 px-2 py-1 text-xs font-bold text-white text-center" style={{ backgroundColor: getMainHeaderColor() }}>
                                                        QTY
                                                      </td>
                                                      <td className="border border-gray-400 px-2 py-1 text-xs font-bold text-white text-center" style={{ backgroundColor: getMainHeaderColor() }}>
                                                        SIZE
                                                      </td>
                                                      <td className="border border-gray-400 px-2 py-1 text-xs font-bold text-white text-center" style={{ backgroundColor: getMainHeaderColor() }}>
                                                        REMARKS
                                                      </td>
                                                      <td className="border border-gray-400 px-2 py-1 text-xs font-bold text-white text-center" style={{ backgroundColor: getMainHeaderColor() }}>
                                                        STATUS
                                                      </td>
                                                      <td className="border border-gray-400 px-2 py-1 text-xs font-bold text-white text-center" style={{ backgroundColor: getMainHeaderColor() }}>
                                                        COST
                                                      </td>
                                                      
                                                      {/* BROWN "ADDITIONAL INFO." SECTION */}
                                                      <td className="border border-gray-400 px-2 py-1 text-xs font-bold text-white text-center" style={{ backgroundColor: getAdditionalInfoColor() }}>
                                                        ADDITIONAL INFO.
                                                      </td>
                                                      <td className="border border-gray-400 px-2 py-1 text-xs font-bold text-white text-center" style={{ backgroundColor: getAdditionalInfoColor() }}>
                                                        FINISH/Color
                                                      </td>
                                                      <td className="border border-gray-400 px-2 py-1 text-xs font-bold text-white text-center" style={{ backgroundColor: getAdditionalInfoColor() }}>
                                                        Cost/Price
                                                      </td>
                                                      <td className="border border-gray-400 px-2 py-1 text-xs font-bold text-white text-center" style={{ backgroundColor: getAdditionalInfoColor() }}>
                                                        Image
                                                      </td>
                                                      
                                                      {/* PURPLE "SHIPPING INFO." SECTION */}
                                                      <td className="border border-gray-400 px-2 py-1 text-xs font-bold text-white text-center" style={{ backgroundColor: getShippingInfoColor() }}>
                                                        SHIPPING INFO.
                                                      </td>
                                                      <td className="border border-gray-400 px-2 py-1 text-xs font-bold text-white text-center" style={{ backgroundColor: getShippingInfoColor() }}>
                                                        Order Date
                                                      </td>
                                                      
                                                      {/* RED "NOTES" AND "ACTIONS" SECTION */}
                                                      <td className="border border-gray-400 px-2 py-1 text-xs font-bold text-white text-center" style={{ backgroundColor: getNotesActionsColor() }}>
                                                        NOTES
                                                      </td>
                                                      <td className="border border-gray-400 px-2 py-1 text-xs font-bold text-white text-center" style={{ backgroundColor: getNotesActionsColor() }}>
                                                        ACTIONS
                                                      </td>
                                                    </tr>

                                                    {/* ITEMS */}
                                                    {subcategory.items?.map((item) => (
                                                      <tr key={item.id} className="bg-gray-800 hover:bg-gray-700 text-white">
                                                        {/* ITEM NAME */}
                                                        <td className="border border-gray-400 px-2 py-2 text-sm">
                                                          {item.name || 'Item Name'}
                                                        </td>
                                                        
                                                        {/* VENDOR/SKU */}
                                                        <td className="border border-gray-400 px-2 py-2 text-sm">
                                                          {item.vendor || 'Vendor Name'}
                                                        </td>
                                                        
                                                        {/* QTY */}
                                                        <td className="border border-gray-400 px-2 py-2 text-sm text-center">
                                                          {item.quantity || '1'}
                                                        </td>
                                                        
                                                        {/* SIZE */}
                                                        <td className="border border-gray-400 px-2 py-2 text-sm">
                                                          {item.size || 'Size'}
                                                        </td>
                                                        
                                                        {/* REMARKS */}
                                                        <td className="border border-gray-400 px-2 py-2 text-sm">
                                                          {item.remarks || 'Remarks'}
                                                        </td>
                                                        
                                                        {/* STATUS - Color-coded dropdown */}
                                                        <td className="border border-gray-400 px-2 py-2 text-sm">
                                                          <select 
                                                            value={item.status || 'TO BE SELECTED'}
                                                            onChange={(e) => {
                                                              console.log(`Status changed to: ${e.target.value}`);
                                                            }}
                                                            className="w-full border-none outline-none rounded px-1 py-1 text-xs font-medium"
                                                            style={{
                                                              backgroundColor: getStatusColor(item.status || 'TO BE SELECTED'),
                                                              color: '#000'
                                                            }}
                                                          >
                                                            <option value="">Select Status...</option>
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
                                                        </td>
                                                        
                                                        {/* COST */}
                                                        <td className="border border-gray-400 px-2 py-2 text-sm text-right">
                                                          ${item.cost || '0.00'}
                                                        </td>
                                                        
                                                        {/* ADDITIONAL INFO - FINISH/COLOR */}
                                                        <td className="border border-gray-400 px-2 py-2 text-sm">
                                                          {item.finish_color || 'Finish/Color'}
                                                        </td>
                                                        
                                                        {/* ADDITIONAL INFO - COST/PRICE */}
                                                        <td className="border border-gray-400 px-2 py-2 text-sm">
                                                          ${item.cost || '0.00'}
                                                        </td>
                                                        
                                                        {/* ADDITIONAL INFO - IMAGE */}
                                                        <td className="border border-gray-400 px-2 py-2 text-sm text-center">
                                                          {item.image_url ? (
                                                            <a href={item.image_url} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300">
                                                              🖼️ Image
                                                            </a>
                                                          ) : (
                                                            <button className="text-blue-400 hover:text-blue-300">
                                                              ➕ Image
                                                            </button>
                                                          )}
                                                        </td>
                                                        
                                                        {/* SHIPPING INFO */}
                                                        <td className="border border-gray-400 px-2 py-2 text-sm">
                                                          {item.tracking_number ? (
                                                            <button
                                                              onClick={() => handleTrackItem(item)}
                                                              className="text-blue-400 hover:text-blue-300 underline"
                                                              title="Track Package"
                                                            >
                                                              Track: {item.tracking_number.substring(0, 8)}...
                                                            </button>
                                                          ) : (
                                                            'No tracking yet'
                                                          )}
                                                        </td>
                                                        
                                                        {/* ORDER DATE */}
                                                        <td className="border border-gray-400 px-2 py-2 text-sm">
                                                          <input 
                                                            type="date" 
                                                            value={item.order_date || ''} 
                                                            className="bg-gray-700 text-white border-none outline-none w-full" 
                                                            placeholder="mm/dd/yyyy"
                                                          />
                                                        </td>
                                                        
                                                        {/* NOTES */}
                                                        <td className="border border-gray-400 px-2 py-2 text-sm">
                                                          {item.notes || 'Notes'}
                                                        </td>
                                                        
                                                        {/* ACTIONS - Blue + and Red Trash */}
                                                        <td className="border border-gray-400 px-2 py-2 text-center">
                                                          <div className="flex space-x-1">
                                                            <button 
                                                              onClick={() => {
                                                                setSelectedSubCategoryId(subcategory.id);
                                                                setShowAddItem(true);
                                                              }}
                                                              className="bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded text-xs"
                                                              title="Add Item"
                                                            >
                                                              +
                                                            </button>
                                                            <button 
                                                              onClick={() => handleDeleteItem(item.id)}
                                                              className="bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded text-xs"
                                                              title="Delete Item"
                                                            >
                                                              🗑️
                                                            </button>
                                                          </div>
                                                        </td>
                                                      </tr>
                                                    ))}
                                                    
                                                    {/* ADD ITEM ROW */}
                                                    <tr>
                                                      <td colSpan="16" className="border border-gray-400 px-6 py-2 text-center bg-gray-700">
                                                        <div className="flex justify-center items-center space-x-4">
                                                          <button
                                                            onClick={() => {
                                                              setSelectedSubCategoryId(subcategory.id);
                                                              setShowAddItem(true);
                                                            }}
                                                            className="text-gray-300 hover:text-white text-sm font-medium bg-gray-600 px-3 py-1 rounded"
                                                          >
                                                            ➕ Add Item
                                                          </button>
                                                          
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
                                                            className="bg-gray-600 text-white border border-gray-500 rounded px-3 py-1 text-sm"
                                                          >
                                                            <option value="">➕ Add Category ▼</option>
                                                            {availableCategories.map((category) => (
                                                              <option key={category} value={category}>
                                                                {category}
                                                              </option>
                                                            ))}
                                                            <option value="CREATE_NEW">➕ Create New Category</option>
                                                          </select>
                                                          
                                                          <button
                                                            onClick={() => handleDeleteRoom(room.id)}
                                                            className="text-red-400 hover:text-red-300 text-sm font-medium bg-red-900 px-3 py-1 rounded"
                                                            title="Delete Section"
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

      {/* ADD ITEM MODAL WITH ENHANCED SCRAPING */}
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
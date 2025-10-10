// RED BANNER TEST
import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
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

  // MUTED COLORS FOR EACH ROOM - Reduced from 10 to 7 intensity!
  const getRoomColor = (roomName) => {
    const roomColors = {
      'living room': '#553C9A',      // Much more muted (intensity 5)
      'dining room': '#991B1B',      // Much more muted (intensity 5)  
      'kitchen': '#92400E',          // Much more muted (intensity 5)
      'primary bedroom': '#065F46',  // Much more muted (intensity 5)
      'primary bathroom': '#1E3A8A', // Much more muted (intensity 5)
      'powder room': '#57534E',      // Much more muted (intensity 5)
      'guest bedroom': '#7C2D12',    // Much more muted (intensity 5)
      'guest bathroom': '#92400E',   // Much more muted (intensity 5)
      'laundry room': '#374151',     // Much more muted (intensity 5)
      'mudroom': '#44403C',          // Much more muted (intensity 5)
      'basement': '#1F2937',         // Much more muted (intensity 5)
      'garage': '#374151',           // Much more muted (intensity 5)
      'home office': '#1E40AF',      // Much more muted (intensity 5)
      'home gym': '#065F46',         // Much more muted (intensity 5)
      'nursery': '#BE185D',          // Much more muted (intensity 5)
      'balcony': '#065F46',          // Much more muted (intensity 5)
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
    return roomColors[roomName.toLowerCase()] || '#553C9A';
  };

  // GREEN COLORS FOR CATEGORIES
  const getCategoryColor = () => {
    return '#5A7A5A'; // Muted green consistent with design
  };

  // BROWN/RED COLORS FOR MAIN HEADERS (ADDITIONAL INFO., SHIPPING INFO.)
  const getMainHeaderColor = () => {
    return '#7F1D1D'; // Muted red header
  };

  const getAdditionalInfoColor = () => {
    return '#8B5A2B'; // Brown for ADDITIONAL INFO.
  };

  const getShippingInfoColor = () => {
    return '#553C9A'; // Purple for SHIPPING INFO.
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
      'Estes Express': '#4B0082',
      'Saia LTL': '#2E8B57',
      'TForce Freight': '#FF4500',
      'Roadrunner': '#6B8E23',
      'Central Transport': '#8B008B',
      'Southeastern Freight': '#D2691E',
      'Averitt Express': '#CD853F',
      'Holland': '#F4A460',
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
      <div className="text-center text-gray-400 py-8">
        <p className="text-lg">Loading FF&E data...</p>
        <p className="text-sm mt-2">Please wait while we load your project information.</p>
      </div>
    );
  }

    <div className="space-y-6">
      {/* EXACT SPREADSHEET TABLE */}
      <div className="bg-gray-900 border border-gray-600 rounded-lg shadow-lg overflow-hidden">
        <div className="overflow-x-auto" style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
          
          <DragDropContext onDragEnd={handleDragEnd}>
            <table className="w-full border-collapse border border-gray-400">
              {/* TABLE HEADERS */}
              <thead>
                <tr>
                  <th className="border border-gray-400 px-3 py-2 text-xs font-bold text-white" style={{ backgroundColor: getMainHeaderColor() }}>INSTALLED</th>
                  <th className="border border-gray-400 px-3 py-2 text-xs font-bold text-white" style={{ backgroundColor: getMainHeaderColor() }}>QTY</th>
                  <th className="border border-gray-400 px-3 py-2 text-xs font-bold text-white" style={{ backgroundColor: getMainHeaderColor() }}>SIZE</th>
                  <th className="border border-gray-400 px-3 py-2 text-xs font-bold text-white" style={{ backgroundColor: getMainHeaderColor() }}>VENDOR/SKU</th>
                  <th className="border border-gray-400 px-3 py-2 text-xs font-bold text-white" style={{ backgroundColor: getMainHeaderColor() }}>VENDOR</th>
                  <th className="border border-gray-400 px-3 py-2 text-xs font-bold text-white" style={{ backgroundColor: getMainHeaderColor() }}>STATUS</th>
                  <th className="border border-gray-400 px-3 py-2 text-xs font-bold text-white" style={{ backgroundColor: getMainHeaderColor() }}>COST</th>
                  <th className="border border-gray-400 px-3 py-2 text-xs font-bold text-white" style={{ backgroundColor: getAdditionalInfoColor() }}>ADDITIONAL INFO.</th>
                  <th className="border border-gray-400 px-3 py-2 text-xs font-bold text-white" style={{ backgroundColor: getAdditionalInfoColor() }}>FINISH/COLOR</th>
                  <th className="border border-gray-400 px-3 py-2 text-xs font-bold text-white" style={{ backgroundColor: getShippingInfoColor() }}>SHIPPING INFO.</th>
                  <th className="border border-gray-400 px-3 py-2 text-xs font-bold text-white" style={{ backgroundColor: getShippingInfoColor() }}>CARRIER</th>
                  <th className="border border-gray-400 px-3 py-2 text-xs font-bold text-white" style={{ backgroundColor: getShippingInfoColor() }}>SHIP TO</th>
                  <th className="border border-gray-400 px-3 py-2 text-xs font-bold text-white" style={{ backgroundColor: getShippingInfoColor() }}>DELIVERY STATUS</th>
                  <th className="border border-gray-400 px-3 py-2 text-xs font-bold text-white" style={{ backgroundColor: getMainHeaderColor() }}>NOTES</th>
                  <th className="border border-gray-400 px-3 py-2 text-xs font-bold text-white" style={{ backgroundColor: getMainHeaderColor() }}>ACTION</th>
                </tr>
              </thead>

              {/* TABLE BODY WITH DRAG & DROP */}
              <tbody>
                <Droppable droppableId="rooms" type="room">
                  {(provided) => (
                    <tr ref={provided.innerRef} {...provided.droppableProps}>
                      <td colSpan="15" style={{ padding: 0, border: 'none' }}>
                        {/* ROOMS - Draggable */}
                        {project.rooms.map((room, roomIndex) => {
                          console.log(`🏠 RENDERING ROOM ${roomIndex}: ${room.name} with ${room.categories?.length || 0} categories`);
                            <Draggable key={room.id} draggableId={room.id} index={roomIndex}>
                              {(provided, snapshot) => (
                                <table 
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  style={{
                                    ...provided.draggableProps.style,
                                    width: '100%',
                                    borderCollapse: 'collapse',
                                    ...(snapshot.isDragging ? { boxShadow: '0 5px 15px rgba(0,0,0,0.3)' } : {})
                                  }}
                                >
                                  <tbody>
                                    {/* ROOM HEADER ROW */}
                                    <tr {...provided.dragHandleProps}>
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

                                    {/* CATEGORIES - Droppable within each room */}
                                    <tr>
                                      <td colSpan="15" style={{ padding: 0, border: 'none' }}>
                                        <Droppable droppableId={`categories-${room.id}`} type="category">
                                          {(provided) => (
                                            <table 
                                              ref={provided.innerRef} 
                                              {...provided.droppableProps}
                                              style={{ width: '100%', borderCollapse: 'collapse' }}
                                            >
                                              <tbody>
                                                {room.categories?.map((category, catIndex) => {
                                                  console.log(`📁 RENDERING CATEGORY ${catIndex}: ${category.name} with ${category.subcategories?.length || 0} subcategories`);
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
                                                              📁 {category.name.toUpperCase()}
                                                            </td>
                                                          </tr>

                                                          {/* SUBCATEGORIES AND INSTALLEDS */}
                                                          {category.subcategories?.map((subcategory) => (
                                                            <React.Fragment key={subcategory.id}>
                                                              
                                                              {/* SUBCATEGORY HEADER ROW */}
                                                              <tr>
                                                                <td className="border border-gray-400" style={{ backgroundColor: getMainHeaderColor() }}></td>
                                                                <td className="border border-gray-400" style={{ backgroundColor: getMainHeaderColor() }}></td>
                                                                <td className="border border-gray-400" style={{ backgroundColor: getMainHeaderColor() }}></td>
                                                                <td className="border border-gray-400" style={{ backgroundColor: getMainHeaderColor() }}></td>
                                                                <td className="border border-gray-400" style={{ backgroundColor: getMainHeaderColor() }}></td>
                                                                <td className="border border-gray-400" style={{ backgroundColor: getMainHeaderColor() }}></td>
                                                                <td className="border border-gray-400" style={{ backgroundColor: getMainHeaderColor() }}></td>
                                                                
                                                                <td className="border border-gray-400 px-2 py-1 text-xs font-bold text-white text-center" style={{ backgroundColor: getAdditionalInfoColor() }}>
                                                                  {subcategory.name.toUpperCase()}
                                                                </td>
                                                                <td className="border border-gray-400" style={{ backgroundColor: getAdditionalInfoColor() }}></td>
                                                                
                                                                <td className="border border-gray-400 px-2 py-1 text-xs font-bold text-white text-center" style={{ backgroundColor: getShippingInfoColor() }}>
                                                                  {subcategory.name.toUpperCase()}
                                                                </td>
                                                                <td className="border border-gray-400" style={{ backgroundColor: getShippingInfoColor() }}></td>
                                                                <td className="border border-gray-400" style={{ backgroundColor: getShippingInfoColor() }}></td>
                                                                <td className="border border-gray-400" style={{ backgroundColor: getShippingInfoColor() }}></td>
                                                                
                                                                <td className="border border-gray-400" style={{ backgroundColor: getMainHeaderColor() }}></td>
                                                                <td className="border border-gray-400" style={{ backgroundColor: getMainHeaderColor() }}></td>
                                                              </tr>

                                                              {/* INSTALLEDS */}
                                                              {subcategory.items?.map((item) => (
                                                                <tr key={item.id}>
                                                                  {/* INSTALLED NAME */}
                                                                  <td className="border border-gray-400 px-2 py-2 text-sm text-white">
                                                                    {item.name || 'Chandelier'}
                                                                  </td>
                                                                  
                                                                  {/* QTY */}
                                                                  <td className="border border-gray-400 px-2 py-2 text-sm text-white text-center">
                                                                    {item.quantity || '1'}
                                                                  </td>
                                                                  
                                                                  {/* SIZE */}
                                                                  <td className="border border-gray-400 px-2 py-2 text-sm text-white">
                                                                    {item.size || '24"W x 30"H'}
                                                                  </td>
                                                                  
                                                                  {/* VENDOR/SKU */}
                                                                  <td className="border border-gray-400 px-2 py-2 text-sm text-white">
                                                                    {item.remarks || 'Matches living room theme'}
                                                                  </td>
                                                                  
                                                                  {/* VENDOR */}
                                                                  <td className="border border-gray-400 px-2 py-2 text-sm text-white">
                                                                    {item.vendor || 'Visual Comfort'}
                                                                  </td>
                                                                  
                                                                  {/* STATUS - Color-coded dropdown */}
                                                                  <td className="border border-gray-400 px-2 py-2 text-sm">
                                                                    <select 
                                                                      value={item.status || 'PICKED'}
                                                                      onChange={(e) => {
                                                                        console.log(`Status changed to: ${e.target.value} with color: ${getStatusColor(e.target.value)}`);
                                                                      }}
                                                                      className="w-full border-none outline-none rounded px-1 py-1 text-xs font-medium"
                                                                      style={{
                                                                        backgroundColor: getStatusColor(item.status || 'PICKED'),
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
                                                                  <td className="border border-gray-400 px-2 py-2 text-sm text-white text-right">
                                                                    ${item.cost || '450.00'}
                                                                  </td>
                                                                  
                                                                  {/* ADDITIONAL INFO - Plain text, no container */}
                                                                  <td className="border border-gray-400 px-2 py-2 text-sm text-white">
                                                                    {item.finish_color || 'Aged Brass'}
                                                                  </td>
                                                                  
                                                                  {/* FINISH/COLOR - Plain text, no container */}
                                                                  <td className="border border-gray-400 px-2 py-2 text-sm text-white">
                                                                    {item.finish_color || 'Aged Brass'}
                                                                  </td>
                                                                  
                                                                  {/* SHIPPING INFO - Plain text, no container */}
                                                                  <td className="border border-gray-400 px-2 py-2 text-sm text-white">
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
                                                                  
                                                                  {/* CARRIER - Color-coded dropdown */}
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
                                                                      <option value="FedEx">📦 FedEx</option>
                                                                      <option value="UPS">📦 UPS</option>
                                                                      <option value="Brooks">🚚 Brooks</option>
                                                                      <option value="Zenith">🚚 Zenith</option>
                                                                      <option value="Sunbelt">🚚 Sunbelt</option>
                                                                      <option value="R+L Carriers">🚚 R+L Carriers</option>
                                                                      <option value="Yellow Freight">🚚 Yellow Freight</option>
                                                                      <option value="XPO Logistics">🚚 XPO Logistics</option>
                                                                      <option value="Old Dominion">🚚 Old Dominion</option>
                                                                      <option value="ABF Freight">🚚 ABF Freight</option>
                                                                      <option value="OTHER">🚚 OTHER</option>
                                                                    </select>
                                                                  </td>
                                                                  
                                                                  {/* SHIP TO - Color-coded dropdown */}
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
                                                                      <option value="">Select Location...</option>
                                                                      <option value="CLIENT HOME">🏠 CLIENT HOME</option>
                                                                      <option value="JOB SITE">🏗️ JOB SITE</option>
                                                                      <option value="DESIGN CENTER">🏢 DESIGN CENTER</option>
                                                                      <option value="WAREHOUSE">📦 WAREHOUSE</option>
                                                                      <option value="VENDOR LOCATION">🏭 VENDOR LOCATION</option>
                                                                    </select>
                                                                  </td>
                                                                  
                                                                  {/* DELIVERY STATUS - Color-coded dropdown */}
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
                                                                  
                                                                  {/* NOTES */}
                                                                  <td className="border border-gray-400 px-2 py-2 text-sm text-white">
                                                                    {item.notes || 'For dining room entryway'}
                                                                  </td>
                                                                  
                                                                  {/* ACTIONS */}
                                                                  <td className="border border-gray-400 px-2 py-2 text-center">
                                                                    <button 
                                                                      onClick={() => {
                                                                        // Handle delete item
                                                                        console.log('Delete item:', item.id);
                                                                      }}
                                                                      className="text-red-400 hover:text-red-300 text-lg"
                                                                    >
                                                                      🗑️
                                                                    </button>
                                                                  </td>
                                                                </tr>
                                                              ))}
                                                              
                                                              {/* ADD INSTALLED ROW */}
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
                                                      )}
                                                    </Draggable>
                                                  );
                                                })}
                                                {provided.placeholder}
                                              </tbody>
                                            </table>
                                          )}
                                        </Droppable>
                                      </td>
                                    </tr>

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
                                  </tbody>
                                </table>
                              )}
                            </Draggable>
                          );
                        })}
                        {provided.placeholder}
                      </td>
                    </tr>
                  )}
                </Droppable>
              </tbody>
            </table>
          </DragDropContext>

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

export default ExactFFESpreadsheet;
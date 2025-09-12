import React, { useState, useEffect } from 'react';
// Drag and drop functionality removed
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
  
  // ✅ Search and Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRoom, setSelectedRoom] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedVendor, setSelectedVendor] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

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

      const backendUrl = import.meta.env?.REACT_APP_BACKEND_URL || process.env.REACT_APP_BACKEND_URL;
      
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
      const backendUrl = import.meta.env?.REACT_APP_BACKEND_URL || process.env.REACT_APP_BACKEND_URL;
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
      const backendUrl = import.meta.env?.REACT_APP_BACKEND_URL || process.env.REACT_APP_BACKEND_URL;
      const response = await fetch(`${backendUrl}/api/categories/comprehensive`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: categoryName,
          room_id: roomId,
          order_index: 0,
          populate_comprehensive: true
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
            
            {/* Filter and Clear Buttons */}
            <button 
              onClick={() => console.log('Filter applied:', { searchTerm, selectedRoom, selectedCategory, selectedVendor, selectedStatus })}
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
      <div className="w-full overflow-x-auto" style={{ backgroundColor: '#0F172A' }}>
        <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
          
          <div className="w-full overflow-x-auto" style={{ touchAction: 'pan-x pan-y' }}>
            <table className="w-full border-collapse border border-gray-400">
                  
                  <thead>
                    {/* EMPTY HEADER FOR STRUCTURE */}
                  </thead>

                  {/* TABLE BODY - Keep original hierarchical structure */}
                  <tbody>
                {/* HIERARCHICAL STRUCTURE AS ROW HEADERS - KEEP ORIGINAL */}
                {project.rooms.map((room, roomIndex) => {
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
                                                          
                                                          {/* VENDOR/SKU */}
                                                          <td className="border border-gray-400 px-2 py-2 text-sm text-white">
                                                            {item.vendor || 'Vendor/SKU'}
                                                          </td>
                                                          
                                                          {/* QTY */}
                                                          <td className="border border-gray-400 px-2 py-2 text-sm text-center text-white">
                                                            {item.quantity || 1}
                                                          </td>
                                                          
                                                          {/* SIZE */}
                                                          <td className="border border-gray-400 px-2 py-2 text-sm text-white">
                                                            {item.size || 'Size'}
                                                          </td>
                                                          
                                                          {/* FINISH/Color */}
                                                          <td className="border border-gray-400 px-2 py-2 text-sm text-white">
                                                            {item.finish_color || 'Finish/Color'}
                                                          </td>
                                                          
                                                          {/* Cost/Price */}
                                                          <td className="border border-gray-400 px-2 py-2 text-sm text-white">
                                                            ${item.cost || '0.00'}
                                                          </td>
                                                          
                                                          {/* Image */}
                                                          <td className="border border-gray-400 px-2 py-2 text-center text-white">
                                                            {item.image_url ? (
                                                              <img src={item.image_url} alt={item.name} className="w-8 h-8 object-cover rounded" />
                                                            ) : (
                                                              '📷 Image'
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
                                                                  onChange={(e) => console.log('Order status changed:', e.target.value)}
                                                                >
                                                                  <option value="">Status...</option>
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
                                                                  <option value="CLIENT HOME">🏠 CLIENT HOME</option>
                                                                  <option value="JOB SITE">🏗️ JOB SITE</option>
                                                                  <option value="DESIGN CENTER">🏢 DESIGN CENTER</option>
                                                                  <option value="WAREHOUSE">📦 WAREHOUSE</option>
                                                                  <option value="VENDOR LOCATION">🏭 VENDOR LOCATION</option>
                                                                  <option value="CLASSIC DESIGN SERVICES">🏢 CLASSIC DESIGN SERVICES</option>
                                                                  <option value="RECEIVER">📋 RECEIVER</option>
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
                                                                  onChange={(e) => console.log('Carrier changed:', e.target.value)}
                                                                >
                                                                  <option value="">Carrier...</option>
                                                                  <option value="FedEx">📦 FedEx</option>
                                                                  <option value="FedEx Ground">📦 FedEx Ground</option>
                                                                  <option value="UPS">📦 UPS</option>
                                                                  <option value="UPS Ground">📦 UPS Ground</option>
                                                                  <option value="USPS">📮 USPS</option>
                                                                  <option value="DHL">📦 DHL</option>
                                                                  <option value="Brooks">🚚 Brooks</option>
                                                                  <option value="Zenith">🚚 Zenith</option>
                                                                  <option value="Sunbelt">🚚 Sunbelt</option>
                                                                  <option value="R+L Carriers">🚚 R+L Carriers</option>
                                                                  <option value="Yellow Freight">🚚 Yellow Freight</option>
                                                                  <option value="XPO Logistics">🚚 XPO Logistics</option>
                                                                  <option value="Old Dominion">🚚 Old Dominion</option>
                                                                  <option value="ABF Freight">🚚 ABF Freight</option>
                                                                  <option value="Con-Way">🚚 Con-Way</option>
                                                                  <option value="Estes Express">🚚 Estes Express</option>
                                                                  <option value="YRC Freight">🚚 YRC Freight</option>
                                                                  <option value="Saia">🚚 Saia</option>
                                                                  <option value="OTHER">🚚 OTHER</option>
                                                                  <option value="ADD_NEW">+ Add New Carrier</option>
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
                                                      ))}
                                                      
                                                      {/* BUTTONS ROW - LEFT ALIGNED WITH GOLD COLOR */}
                                                      <tr>
                                                        <td colSpan="14" className="border border-gray-400 px-6 py-2 bg-slate-900">
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
                  </tbody>
                </table>
            </div>

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
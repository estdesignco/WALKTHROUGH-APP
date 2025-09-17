import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import AddItemModal from './AddItemModal';

const SimpleChecklistSpreadsheet = ({ 
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
  const [showAddItem, setShowAddItem] = useState(false);
  const [selectedSubCategoryId, setSelectedSubCategoryId] = useState(null);
  const [availableCategories, setAvailableCategories] = useState([]);
  const [expandedRooms, setExpandedRooms] = useState({});
  const [expandedCategories, setExpandedCategories] = useState({});

  // FILTER STATE
  const [filteredProject, setFilteredProject] = useState(project);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRoom, setSelectedRoom] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedVendor, setSelectedVendor] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  // Status colors mapping for checklist
  const getStatusColor = (status) => {
    const statusColors = {
      '': '#6B7280',                        // Gray for blank/default
      'BLANK': '#6B7280',                   // Gray for blank
      'PICKED': '#3B82F6',                  // Blue
      'ORDER SAMPLES': '#10B981',           // Green
      'SAMPLES ARRIVED': '#8B5CF6',         // Purple
      'ASK NEIL': '#F59E0B',                // Yellow
      'ASK CHARLENE': '#EF4444',            // Red
      'ASK JALA': '#EC4899',                // Pink
      'GET QUOTE': '#06B6D4',               // Cyan
      'WAITING ON QT': '#F97316',           // Orange
      'READY FOR PRESENTATION': '#84CC16'   // Lime
    };
    return statusColors[status] || '#6B7280'; // Default gray
  };

  // Handle status change
  const handleStatusChange = async (itemId, newStatus) => {
    console.log('🔄 Checklist status change request:', { itemId, newStatus });
    
    try {
      const response = await fetch(`https://spreadsheet-revamp.preview.emergentagent.com/api/items/${itemId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      
      if (response.ok) {
        console.log('✅ Checklist status updated successfully, reloading...');
        window.location.reload();
      } else {
        const errorData = await response.text();
        console.error('❌ Checklist status update failed:', response.status, errorData);
      }
    } catch (error) {
      console.error('❌ Checklist status update error:', error);
    }
  };

  // APPLY FILTERS
  useEffect(() => {
    console.log('🔍 Checklist Filter triggered:', { searchTerm, selectedRoom, selectedCategory, selectedVendor, selectedStatus });
    
    if (!project) {
      setFilteredProject(null);
      return;
    }

    let filtered = { ...project };

    if (searchTerm || selectedRoom || selectedCategory || selectedVendor || selectedStatus) {
      console.log('🔍 Applying checklist filters...');
      
      filtered.rooms = project.rooms.map(room => {
        if (selectedRoom && room.id !== selectedRoom) {
          return { ...room, categories: [] };
        }
        
        const filteredCategories = room.categories.map(category => {
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
                  (item.sku && item.sku.toLowerCase().includes(searchLower));
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

  // Load available categories and set initial expansion
  useEffect(() => {
    const loadAvailableCategories = async () => {
      try {
        const response = await fetch(`https://spreadsheet-revamp.preview.emergentagent.com/api/categories/available`);
        if (response.ok) {
          const data = await response.json();
          setAvailableCategories(data.categories || []);
        }
      } catch (error) {
        console.error('❌ Error loading available categories:', error);
        setAvailableCategories([
          "Lighting", "Furniture & Storage", "Decor & Accessories", 
          "Paint, Wallpaper & Finishes", "Architectural Elements, Built-ins & Trim"
        ]);
      }
    };
    
    loadAvailableCategories();
    
    // Initialize all rooms and categories as expanded
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

  // Handle adding new items
  const handleAddItem = async (itemData) => {
    try {
      let subcategoryId = selectedSubCategoryId;
      
      if (!subcategoryId) {
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

      const newItem = {
        ...itemData,
        subcategory_id: subcategoryId,
        status: '', // Start with blank status as requested
        order_index: 0
      };

      console.log('📤 Creating checklist item:', newItem);

      const response = await fetch(`https://spreadsheet-revamp.preview.emergentagent.com/api/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newItem)
      });

      if (response.ok) {
        console.log('✅ Checklist item added successfully');
        setShowAddItem(false);
        window.location.reload();
      } else {
        const errorData = await response.text();
        console.error('❌ Backend error:', errorData);
        throw new Error(`HTTP ${response.status}: ${errorData}`);
      }
    } catch (error) {
      console.error('❌ Error adding checklist item:', error);
    }
  };

  // Handle deleting an item
  const handleDeleteItem = async (itemId) => {
    if (!window.confirm('Are you sure you want to delete this item?')) {
      return;
    }

    try {
      const response = await fetch(`https://spreadsheet-revamp.preview.emergentagent.com/api/items/${itemId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        console.log('✅ Checklist item deleted successfully');
        window.location.reload();
      } else {
        console.error('❌ Delete failed with status:', response.status);
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (error) {
      console.error('❌ Error deleting checklist item:', error);
    }
  };

  // Handle adding a new category
  const handleAddCategory = async (roomId, categoryName) => {
    if (!roomId || !categoryName) {
      console.error('❌ Missing roomId or categoryName');
      return;
    }

    try {
      console.log('🔄 Creating comprehensive checklist category:', categoryName, 'for room:', roomId);
      
      const tempRoomResponse = await fetch(`https://spreadsheet-revamp.preview.emergentagent.com/api/rooms`, {
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
        
        const matchingCategory = tempRoom.categories.find(cat => 
          cat.name.toLowerCase() === categoryName.toLowerCase()
        );
        
        if (matchingCategory) {
          const categoryData = {
            ...matchingCategory,
            room_id: roomId,
            id: undefined
          };
          
          const addResponse = await fetch(`https://spreadsheet-revamp.preview.emergentagent.com/api/categories`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(categoryData)
          });
          
          if (addResponse.ok) {
            console.log('✅ Comprehensive checklist category added successfully');
            
            await fetch(`https://spreadsheet-revamp.preview.emergentagent.com/api/rooms/${tempRoom.id}`, {
              method: 'DELETE'
            });
            
            window.location.reload();
          }
        }
        
        await fetch(`https://spreadsheet-revamp.preview.emergentagent.com/api/rooms/${tempRoom.id}`, {
          method: 'DELETE'
        });
      }
    } catch (error) {
      console.error('❌ Error adding comprehensive checklist category:', error);
    }
  };

  // Handle drag and drop
  const handleDragEnd = async (result) => {
    if (!result.destination) return;

    const { source, destination, type } = result;

    if (type === 'room') {
      console.log('🔄 Reordering checklist rooms...');
      
      try {
        const response = await fetch('https://spreadsheet-revamp.preview.emergentagent.com/api/rooms/reorder', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            source_index: source.index,
            destination_index: destination.index,
            project_id: project.id
          })
        });
        
        if (response.ok) {
          console.log('✅ Checklist room order updated');
          if (onReload) onReload();
        }
      } catch (err) {
        console.error('❌ Error updating checklist room order:', err);
      }
    }
    
    if (type === 'category') {
      console.log('🔄 Reordering checklist categories...');
      
      try {
        const roomId = source.droppableId.replace('categories-', '');
        const response = await fetch('https://spreadsheet-revamp.preview.emergentagent.com/api/categories/reorder', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            room_id: roomId,
            source_index: source.index,
            destination_index: destination.index
          })
        });
        
        if (response.ok) {
          console.log('✅ Checklist category order updated');
          if (onReload) onReload();
        }
      } catch (err) {
        console.error('❌ Error updating checklist category order:', err);
      }
    }
  };

  // Handle Canva URL scraping - NEW FEATURE
  const handleCanvaUrlScrape = async (canvaUrl, itemId) => {
    if (!canvaUrl || !canvaUrl.includes('canva.com')) {
      console.log('⚠️ Not a Canva URL, skipping scrape');
      return;
    }

    try {
      console.log('🎨 Scraping Canva board:', canvaUrl);
      
      const response = await fetch('https://spreadsheet-revamp.preview.emergentagent.com/api/scrape-canva', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          canva_url: canvaUrl,
          item_id: itemId 
        })
      });
      
      if (response.ok) {
        const canvaData = await response.json();
        console.log('✅ Canva board scraped successfully:', canvaData);
        // Update item with scraped data
        window.location.reload();
      } else {
        console.error('❌ Canva scraping failed:', response.status);
      }
    } catch (error) {
      console.error('❌ Canva scraping error:', error);
    }
  };

  // Colors
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
      'family room': '#CA8A04',      // Yellow
    };
    return roomColors[roomName.toLowerCase()] || '#7C3AED';
  };

  const getCategoryColor = () => '#065F46';  // Dark green

  if (!project) {
    return (
      <div className="text-center text-red-400 py-8 bg-red-900 m-4 p-4 rounded">
        <p className="text-lg">🚨 SimpleChecklistSpreadsheet: NO PROJECT DATA</p>
      </div>
    );
  }

  if (!project.rooms || project.rooms.length === 0) {
    return (
      <div className="text-center text-yellow-400 py-8 bg-yellow-900 m-4 p-4 rounded">
        <p className="text-lg">🚨 SimpleChecklistSpreadsheet: NO ROOMS</p>
      </div>
    );
  }

  return (
    <div className="w-full" style={{ backgroundColor: '#0F172A' }}>
      
      {/* FILTER AND SEARCH SECTION */}
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
              className="px-3 py-2 rounded bg-gray-700 text-white border border-gray-600"
            >
              <option value="">All Rooms</option>
              {project.rooms.map(room => (
                <option key={room.id} value={room.id}>{room.name}</option>
              ))}
            </select>
            
            <select 
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 rounded bg-gray-700 text-white border border-gray-600"
            >
              <option value="">All Categories</option>
              {availableCategories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
            
            <select 
              value={selectedVendor}
              onChange={(e) => setSelectedVendor(e.target.value)}
              className="px-3 py-2 rounded bg-gray-700 text-white border border-gray-600"
            >
              <option value="">All Vendors</option>
              {vendorTypes.map(vendor => (
                <option key={vendor} value={vendor}>{vendor}</option>
              ))}
            </select>
            
            <select 
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-2 rounded bg-gray-700 text-white border border-gray-600"
            >
              <option value="">All Status</option>
              <option value="PICKED">PICKED</option>
              <option value="ORDER SAMPLES">ORDER SAMPLES</option>
              <option value="SAMPLES ARRIVED">SAMPLES ARRIVED</option>
              <option value="ASK NEIL">ASK NEIL</option>
              <option value="ASK CHARLENE">ASK CHARLENE</option>
              <option value="ASK JALA">ASK JALA</option>
              <option value="GET QUOTE">GET QUOTE</option>
              <option value="WAITING ON QT">WAITING ON QT</option>
              <option value="READY FOR PRESENTATION">READY FOR PRESENTATION</option>
            </select>
            
            {/* Filter and Clear Buttons */}
            <button 
              onClick={() => {
                console.log('🔍 CHECKLIST FILTER APPLIED');
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
                console.log('🧹 CHECKLIST FILTER CLEARED');
              }}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded font-medium"
            >
              CLEAR
            </button>
          </div>
          
          {/* Add Room Button */}
          <button 
            onClick={onAddRoom}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded font-medium"
          >
            ✚ ADD ROOM
          </button>
        </div>
      </div>

      {/* CHECKLIST SPREADSHEET WITH DRAG & DROP */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="w-full overflow-x-auto" style={{ backgroundColor: '#0F172A' }}>
          
          <table className="w-full border-collapse border border-gray-400">
            <thead>
              {/* EMPTY HEADER FOR STRUCTURE */}
            </thead>

            <tbody>
              <Droppable droppableId="rooms" type="room">
                {(provided) => (
                  <div {...provided.droppableProps} ref={provided.innerRef}>
                    {(filteredProject || project).rooms.map((room, roomIndex) => {
                      const isRoomExpanded = expandedRooms[room.id];
                      
                      return (
                        <Draggable key={room.id} draggableId={room.id} index={roomIndex}>
                          {(provided) => (
                            <React.Fragment>
                              {/* ROOM HEADER ROW */}
                              <tr 
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                              >
                                <td colSpan="7" 
                                    className="border border-gray-400 px-3 py-2 text-white text-sm font-bold"
                                    style={{ backgroundColor: getRoomColor(room.name) }}>
                                  <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-2">
                                      <span className="cursor-move">≡</span>
                                      <button
                                        onClick={() => toggleRoomExpansion(room.id)}
                                        className="text-white hover:text-gray-200"
                                      >
                                        {isRoomExpanded ? '▼' : '▶'}
                                      </button>
                                      <span>{room.name.toUpperCase()}</span>
                                    </div>
                                    <button
                                      onClick={() => onDeleteRoom(room.id)}
                                      className="text-red-300 hover:text-red-100 text-lg ml-2"
                                      title="Delete Room"
                                    >
                                      🗑️
                                    </button>
                                  </div>
                                </td>
                              </tr>

                              {/* ROOM CATEGORIES - Only show when expanded */}
                              {isRoomExpanded && (
                                <Droppable droppableId={`categories-${room.id}`} type="category">
                                  {(provided) => (
                                    <div {...provided.droppableProps} ref={provided.innerRef}>
                                      {room.categories?.map((category, catIndex) => {
                                        const isCategoryExpanded = expandedCategories[category.id];
                                        
                                        return (
                                          <Draggable key={category.id} draggableId={category.id} index={catIndex}>
                                            {(provided) => (
                                              <React.Fragment>
                                                {/* CATEGORY HEADER ROW */}
                                                <tr 
                                                  ref={provided.innerRef}
                                                  {...provided.draggableProps}
                                                  {...provided.dragHandleProps}
                                                >
                                                  <td colSpan="7" 
                                                      className="border border-gray-400 px-4 py-2 text-white text-sm font-bold"
                                                      style={{ backgroundColor: getCategoryColor() }}>
                                                    <div className="flex items-center justify-between">
                                                      <div className="flex items-center gap-2">
                                                        <span className="cursor-move">≡</span>
                                                        <button
                                                          onClick={() => toggleCategoryExpansion(category.id)}
                                                          className="text-white hover:text-gray-200"
                                                        >
                                                          {isCategoryExpanded ? '▼' : '▶'}
                                                        </button>
                                                        <span>{category.name.toUpperCase()}</span>
                                                      </div>
                                                      <select 
                                                        onChange={(e) => {
                                                          if (e.target.value) {
                                                            handleAddCategory(room.id, e.target.value);
                                                            e.target.value = '';
                                                          }
                                                        }}
                                                        className="bg-green-600 text-white text-xs px-2 py-1 rounded border-none"
                                                      >
                                                        <option value="">+ Add Category</option>
                                                        {availableCategories.map(cat => (
                                                          <option key={cat} value={cat}>{cat}</option>
                                                        ))}
                                                      </select>
                                                    </div>
                                                  </td>
                                                </tr>

                                                {/* CATEGORY ITEMS - Only show when category expanded */}
                                                {isCategoryExpanded && (
                                                  <React.Fragment>
                                                    {/* CHECKLIST HEADERS - 7 COLUMNS */}
                                                    <tr>
                                                      <th className="border border-gray-400 px-2 py-2 text-xs font-bold text-white" style={{ backgroundColor: '#8B4444' }}>ITEM</th>
                                                      <th className="border border-gray-400 px-2 py-2 text-xs font-bold text-white w-16" style={{ backgroundColor: '#8B4444' }}>QTY</th>
                                                      <th className="border border-gray-400 px-2 py-2 text-xs font-bold text-white" style={{ backgroundColor: '#8B4444' }}>SIZE</th>
                                                      <th className="border border-gray-400 px-2 py-2 text-xs font-bold text-white" style={{ backgroundColor: '#8B4444' }}>STATUS</th>
                                                      <th className="border border-gray-400 px-2 py-2 text-xs font-bold text-white w-20" style={{ backgroundColor: '#8B4444' }}>IMAGE</th>
                                                      <th className="border border-gray-400 px-2 py-2 text-xs font-bold text-white w-20" style={{ backgroundColor: '#8B4444' }}>LINK</th>
                                                      <th className="border border-gray-400 px-2 py-2 text-xs font-bold text-white" style={{ backgroundColor: '#8B4444' }}>REMARKS</th>
                                                    </tr>
                                                    
                                                    {/* ITEMS */}
                                                    {category.subcategories?.map((subcategory) => (
                                                      subcategory.items?.map((item, itemIndex) => (
                                                        <tr key={item.id} className={itemIndex % 2 === 0 ? 'bg-slate-800' : 'bg-slate-700'}>
                                                          {/* ITEM */}
                                                          <td className="border border-gray-400 px-2 py-1 text-white text-sm">{item.name}</td>
                                                          
                                                          {/* QTY */}
                                                          <td className="border border-gray-400 px-2 py-1 text-white text-sm text-center w-16">{item.quantity || ''}</td>
                                                          
                                                          {/* SIZE */}
                                                          <td className="border border-gray-400 px-2 py-1 text-white text-sm">{item.size || ''}</td>
                                                          
                                                          {/* STATUS */}
                                                          <td className="border border-gray-400 px-2 py-1 text-white text-sm">
                                                            <select 
                                                              className="bg-gray-800 text-white text-xs border-none w-full"
                                                              value={item.status || ''}
                                                              style={{ backgroundColor: getStatusColor(item.status || ''), color: 'white' }}
                                                              onChange={(e) => handleStatusChange(item.id, e.target.value)}
                                                            >
                                                              <option value="" style={{ backgroundColor: '#6B7280', color: 'white' }}>Select Status</option>
                                                              <option value="PICKED" style={{ backgroundColor: '#3B82F6', color: 'white' }}>PICKED</option>
                                                              <option value="ORDER SAMPLES" style={{ backgroundColor: '#10B981', color: 'white' }}>ORDER SAMPLES</option>
                                                              <option value="SAMPLES ARRIVED" style={{ backgroundColor: '#8B5CF6', color: 'white' }}>SAMPLES ARRIVED</option>
                                                              <option value="ASK NEIL" style={{ backgroundColor: '#F59E0B', color: 'white' }}>ASK NEIL</option>
                                                              <option value="ASK CHARLENE" style={{ backgroundColor: '#EF4444', color: 'white' }}>ASK CHARLENE</option>
                                                              <option value="ASK JALA" style={{ backgroundColor: '#EC4899', color: 'white' }}>ASK JALA</option>
                                                              <option value="GET QUOTE" style={{ backgroundColor: '#06B6D4', color: 'white' }}>GET QUOTE</option>
                                                              <option value="WAITING ON QT" style={{ backgroundColor: '#F97316', color: 'white' }}>WAITING ON QT</option>
                                                              <option value="READY FOR PRESENTATION" style={{ backgroundColor: '#84CC16', color: 'white' }}>READY FOR PRESENTATION</option>
                                                            </select>
                                                          </td>
                                                          
                                                          {/* IMAGE */}
                                                          <td className="border border-gray-400 px-2 py-1 text-white text-sm w-20">
                                                            {item.image_url ? (
                                                              <img src={item.image_url} alt={item.name} className="w-8 h-8 object-cover rounded" />
                                                            ) : ''}
                                                          </td>
                                                          
                                                          {/* LINK - WITH CANVA INTEGRATION */}
                                                          <td className="border border-gray-400 px-2 py-1 text-white text-sm w-20">
                                                            <div className="flex flex-col gap-1">
                                                              <input
                                                                type="url"
                                                                placeholder="Canva URL..."
                                                                className="w-full bg-transparent text-white text-xs border border-gray-500 rounded px-1"
                                                                onBlur={(e) => {
                                                                  if (e.target.value.includes('canva.com')) {
                                                                    console.log('🎨 Canva link detected:', e.target.value);
                                                                    handleCanvaUrlScrape(e.target.value, item.id);
                                                                  }
                                                                }}
                                                              />
                                                              <button
                                                                onClick={() => {
                                                                  const canvaUrl = event.target.previousElementSibling.value;
                                                                  if (canvaUrl) {
                                                                    handleCanvaUrlScrape(canvaUrl, item.id);
                                                                  }
                                                                }}
                                                                className="bg-purple-600 text-white text-xs px-1 py-0.5 rounded hover:bg-purple-700"
                                                                title="Scrape Canva Board"
                                                              >
                                                                🎨 Scrape Canva
                                                              </button>
                                                            </div>
                                                          </td>
                                                          
                                                          {/* REMARKS */}
                                                          <td className="border border-gray-400 px-2 py-1 text-white text-sm">{item.remarks || ''}</td>
                                                        </tr>
                                                      ))
                                                    ))}
                                                    
                                                    {/* ADD ITEM BUTTON ROW */}
                                                    <tr>
                                                      <td colSpan="7" className="border border-gray-400 px-2 py-2">
                                                        <div className="flex gap-2">
                                                          <button
                                                            onClick={() => {
                                                              if (category.subcategories?.length > 0) {
                                                                setSelectedSubCategoryId(category.subcategories[0].id);
                                                              }
                                                              setShowAddItem(true);
                                                            }}
                                                            className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded text-sm"
                                                          >
                                                            + Add Item
                                                          </button>
                                                        </div>
                                                      </td>
                                                    </tr>
                                                  </React.Fragment>
                                                )}
                                              </React.Fragment>
                                            )}
                                          </Draggable>
                                        );
                                      })}
                                      {provided.placeholder}
                                    </div>
                                  )}
                                </Droppable>
                              )}
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
        </div>
      </DragDropContext>

      {/* Add Item Modal */}
      {showAddItem && (
        <AddItemModal
          onClose={() => setShowAddItem(false)}
          onSubmit={handleAddItem}
          availableVendors={vendorTypes}
          availableStatuses={itemStatuses}
        />
      )}
    </div>
  );
};

export default SimpleChecklistSpreadsheet;
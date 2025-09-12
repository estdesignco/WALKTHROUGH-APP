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
    return roomColors[roomName.toLowerCase()] || '#7C3AED';  // Default purple
  };

  const getCategoryColor = () => '#065F46';  // Dark green from your screenshots
  const getSubcategoryColor = () => '#7F1D1D';  // Dark red from your screenshots
  const getAdditionalInfoColor = () => '#92400E';  // Brown from your screenshots  
  const getShippingInfoColor = () => '#6B21A8';  // Purple from your screenshots
  const getNotesActionsColor = () => '#7F1D1D';  // Red from your screenshots

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
          
          {/* Add Room Button */}
          <button 
            onClick={handleAddRoom}
            className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded font-medium"
          >
            ✚ ADD ROOM
          </button>
        </div>
      </div>

      {/* MAIN SPREADSHEET - DARK BACKGROUND LIKE YOUR SCREENSHOTS */}
      <div className="w-full overflow-x-auto" style={{ backgroundColor: '#0F172A' }}>
        <div style={{ minWidth: '1400px' }}>
          
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="rooms" type="room">
              {(provided) => (
                <div ref={provided.innerRef} {...provided.droppableProps}>
                  
                  {project.rooms.map((room, roomIndex) => {
                    const isRoomExpanded = expandedRooms[room.id];
                    
                    return (
                      <Draggable key={room.id} draggableId={room.id} index={roomIndex}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            style={{
                              ...provided.draggableProps.style,
                              ...(snapshot.isDragging ? { boxShadow: '0 5px 15px rgba(0,0,0,0.3)' } : {}),
                              marginBottom: '1px'
                            }}
                          >
                            {/* ROOM HEADER - FULL WIDTH LIKE YOUR SCREENSHOTS */}
                            <div 
                              {...provided.dragHandleProps}
                              className="flex items-center justify-between px-4 py-3 text-white font-bold text-sm cursor-move"
                              style={{ backgroundColor: getRoomColor(room.name) }}
                            >
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
                                className="text-red-300 hover:text-red-100 text-lg"
                                title="Delete Room"
                              >
                                🗑️
                              </button>
                            </div>

                            {/* ROOM CONTENT - ONLY SHOW WHEN EXPANDED */}
                            {isRoomExpanded && (
                              <Droppable droppableId={`categories-${room.id}`} type="category">
                                {(provided) => (
                                  <div ref={provided.innerRef} {...provided.droppableProps}>
                                    
                                    {room.categories?.map((category, catIndex) => {
                                      const isCategoryExpanded = expandedCategories[category.id];
                                      
                                      return (
                                        <Draggable key={category.id} draggableId={category.id} index={catIndex}>
                                          {(provided, snapshot) => (
                                            <div
                                              ref={provided.innerRef}
                                              {...provided.draggableProps}
                                              style={{
                                                ...provided.draggableProps.style,
                                                ...(snapshot.isDragging ? { boxShadow: '0 3px 10px rgba(0,0,0,0.2)' } : {}),
                                                marginBottom: '1px'
                                              }}
                                            >
                                              {/* CATEGORY HEADER - FULL WIDTH DARK GREEN */}
                                              <div 
                                                {...provided.dragHandleProps}
                                                className="flex items-center justify-between px-4 py-2 text-white font-bold text-sm cursor-move"
                                                style={{ backgroundColor: getCategoryColor() }}
                                              >
                                                <div className="flex items-center gap-2">
                                                  <button
                                                    onClick={() => toggleCategoryExpansion(category.id)}
                                                    className="text-white hover:text-gray-200"
                                                  >
                                                    {isCategoryExpanded ? '▼' : '▶'}
                                                  </button>
                                                  <span>{category.name.toUpperCase()}</span>
                                                </div>
                                              </div>

                                              {/* CATEGORY CONTENT - ONLY SHOW WHEN EXPANDED */}
                                              {isCategoryExpanded && (
                                                <div>
                                                  {category.subcategories?.map((subcategory) => (
                                                    <div key={subcategory.id}>
                                                      
                                                      {/* SUBCATEGORY AND COLUMN HEADERS */}
                                                      <div className="grid grid-cols-16 text-xs font-bold text-white">
                                                        {/* Left section columns */}
                                                        <div className="col-span-1 border border-gray-600 px-2 py-1 text-center" style={{ backgroundColor: getSubcategoryColor() }}>
                                                          {subcategory.name.toUpperCase()}
                                                        </div>
                                                        <div className="col-span-1 border border-gray-600 px-2 py-1 text-center" style={{ backgroundColor: getSubcategoryColor() }}>
                                                          VENDOR/SKU
                                                        </div>
                                                        <div className="col-span-1 border border-gray-600 px-2 py-1 text-center" style={{ backgroundColor: getSubcategoryColor() }}>
                                                          QTY
                                                        </div>
                                                        <div className="col-span-1 border border-gray-600 px-2 py-1 text-center" style={{ backgroundColor: getSubcategoryColor() }}>
                                                          SIZE
                                                        </div>
                                                        <div className="col-span-1 border border-gray-600 px-2 py-1 text-center" style={{ backgroundColor: getSubcategoryColor() }}>
                                                          REMARKS
                                                        </div>
                                                        <div className="col-span-1 border border-gray-600 px-2 py-1 text-center" style={{ backgroundColor: getSubcategoryColor() }}>
                                                          STATUS
                                                        </div>
                                                        <div className="col-span-1 border border-gray-600 px-2 py-1 text-center" style={{ backgroundColor: getSubcategoryColor() }}>
                                                          COST
                                                        </div>
                                                        
                                                        {/* ADDITIONAL INFO section */}
                                                        <div className="col-span-1 border border-gray-600 px-2 py-1 text-center" style={{ backgroundColor: getAdditionalInfoColor() }}>
                                                          ADDITIONAL INFO.
                                                        </div>
                                                        <div className="col-span-1 border border-gray-600 px-2 py-1 text-center" style={{ backgroundColor: getAdditionalInfoColor() }}>
                                                          FINISH/Color
                                                        </div>
                                                        <div className="col-span-1 border border-gray-600 px-2 py-1 text-center" style={{ backgroundColor: getAdditionalInfoColor() }}>
                                                          Cost/Price
                                                        </div>
                                                        <div className="col-span-1 border border-gray-600 px-2 py-1 text-center" style={{ backgroundColor: getAdditionalInfoColor() }}>
                                                          Image
                                                        </div>
                                                        
                                                        {/* SHIPPING INFO section */}
                                                        <div className="col-span-1 border border-gray-600 px-2 py-1 text-center" style={{ backgroundColor: getShippingInfoColor() }}>
                                                          SHIPPING INFO.
                                                        </div>
                                                        <div className="col-span-1 border border-gray-600 px-2 py-1 text-center" style={{ backgroundColor: getShippingInfoColor() }}>
                                                          Order Date
                                                        </div>
                                                        
                                                        {/* NOTES and ACTIONS */}
                                                        <div className="col-span-1 border border-gray-600 px-2 py-1 text-center" style={{ backgroundColor: getNotesActionsColor() }}>
                                                          NOTES
                                                        </div>
                                                        <div className="col-span-1 border border-gray-600 px-2 py-1 text-center" style={{ backgroundColor: getNotesActionsColor() }}>
                                                          ACTIONS
                                                        </div>
                                                      </div>

                                                      {/* ITEMS ROWS */}
                                                      {subcategory.items?.map((item, itemIndex) => (
                                                        <div 
                                                          key={item.id} 
                                                          className={`grid grid-cols-16 text-sm text-white border-b border-gray-600 ${
                                                            itemIndex % 2 === 0 ? 'bg-slate-800' : 'bg-slate-700'
                                                          }`}
                                                        >
                                                          <div className="col-span-1 border-r border-gray-600 px-2 py-2">{item.name || 'Item Name'}</div>
                                                          <div className="col-span-1 border-r border-gray-600 px-2 py-2">{item.vendor || 'Vendor'}</div>
                                                          <div className="col-span-1 border-r border-gray-600 px-2 py-2 text-center">{item.quantity || '1'}</div>
                                                          <div className="col-span-1 border-r border-gray-600 px-2 py-2">{item.size || 'Size'}</div>
                                                          <div className="col-span-1 border-r border-gray-600 px-2 py-2">{item.remarks || 'Remarks'}</div>
                                                          <div className="col-span-1 border-r border-gray-600 px-2 py-2">{item.status || 'TO BE SELECTED'}</div>
                                                          <div className="col-span-1 border-r border-gray-600 px-2 py-2 text-right">${item.cost || '0.00'}</div>
                                                          <div className="col-span-1 border-r border-gray-600 px-2 py-2">{item.finish_color || 'Finish'}</div>
                                                          <div className="col-span-1 border-r border-gray-600 px-2 py-2">{item.finish_color || 'Color'}</div>
                                                          <div className="col-span-1 border-r border-gray-600 px-2 py-2">${item.cost || '0.00'}</div>
                                                          <div className="col-span-1 border-r border-gray-600 px-2 py-2 text-center">
                                                            {item.image_url ? (
                                                              <a href={item.image_url} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300">
                                                                📷 Image
                                                              </a>
                                                            ) : (
                                                              <button className="text-blue-400 hover:text-blue-300">
                                                                ➕ Image
                                                              </button>
                                                            )}
                                                          </div>
                                                          <div className="col-span-1 border-r border-gray-600 px-2 py-2">
                                                            {item.tracking_number || 'No tracking'}
                                                          </div>
                                                          <div className="col-span-1 border-r border-gray-600 px-2 py-2">
                                                            <input 
                                                              type="date" 
                                                              value={item.order_date || ''} 
                                                              className="bg-transparent text-white border-none outline-none w-full text-xs" 
                                                              placeholder="mm/dd/yyyy"
                                                            />
                                                          </div>
                                                          <div className="col-span-1 border-r border-gray-600 px-2 py-2">{item.notes || 'Notes'}</div>
                                                          <div className="col-span-1 border-r border-gray-600 px-2 py-2 text-center">
                                                            <button 
                                                              onClick={() => handleDeleteItem(item.id)}
                                                              className="text-red-400 hover:text-red-300 text-sm"
                                                            >
                                                              🗑️
                                                            </button>
                                                          </div>
                                                        </div>
                                                      ))}
                                                      
                                                      {/* BUTTONS ROW - LEFT ALIGNED LIKE YOUR SCREENSHOTS */}
                                                      <div className="flex gap-2 p-3 bg-slate-900">
                                                        <button
                                                          onClick={() => {
                                                            setSelectedSubCategoryId(subcategory.id);
                                                            setShowAddItem(true);
                                                          }}
                                                          className="px-3 py-1 bg-amber-700 hover:bg-amber-600 text-white rounded text-sm font-medium"
                                                        >
                                                          ✚ Add Item
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
                                                          className="px-3 py-1 bg-amber-700 hover:bg-amber-600 text-white rounded text-sm font-medium border-none outline-none"
                                                        >
                                                          <option value="">Add Category ▼</option>
                                                          {availableCategories.map((category) => (
                                                            <option key={category} value={category}>
                                                              {category}
                                                            </option>
                                                          ))}
                                                          <option value="CREATE_NEW">➕ Create New Category</option>
                                                        </select>
                                                        
                                                        <button
                                                          onClick={() => handleDeleteRoom(room.id)}
                                                          className="px-3 py-1 bg-red-700 hover:bg-red-600 text-white rounded text-sm font-medium"
                                                        >
                                                          🗑️ Delete Section
                                                        </button>
                                                      </div>
                                                      
                                                    </div>
                                                  ))}
                                                </div>
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
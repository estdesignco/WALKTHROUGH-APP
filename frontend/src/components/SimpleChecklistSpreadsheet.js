import React from 'react';

const SimpleChecklistSpreadsheet = ({ project }) => {
  const [showAddItem, setShowAddItem] = useState(false);
  const [selectedSubCategoryId, setSelectedSubCategoryId] = useState(null);
  const [availableCategories, setAvailableCategories] = useState([]);
  const [expandedRooms, setExpandedRooms] = useState({});
  const [expandedCategories, setExpandedCategories] = useState({});
  const [filteredProject, setFilteredProject] = useState(project);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRoom, setSelectedRoom] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedVendor, setSelectedVendor] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  // API CALLS
  const handleAddItem = async (itemData) => {
    try {
      if (!selectedSubCategoryId) {
        alert('Please expand a category first to add items to it.');
        return;
      }

      const newItem = {
        ...itemData,
        subcategory_id: selectedSubCategoryId,
        order_index: 0
      };

      const response = await fetch(`https://app-finalizer-2.preview.emergentagent.com/api/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newItem)
      });

      if (response.ok) {
        console.log('✅ Checklist item added successfully');
        setShowAddItem(false);
        if (onReload) onReload();
      }
    } catch (error) {
      console.error('❌ Error adding checklist item:', error);
    }
  };

  const handleDeleteItem = async (itemId) => {
    if (!window.confirm('Are you sure you want to delete this item?')) return;

    try {
      const response = await fetch(`https://app-finalizer-2.preview.emergentagent.com/api/items/${itemId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        console.log('✅ Checklist item deleted successfully');
        if (onReload) onReload();
      }
    } catch (error) {
      console.error('❌ Error deleting checklist item:', error);
    }
  };

  const handleStatusChange = async (itemId, newStatus) => {
    try {
      const response = await fetch(`https://app-finalizer-2.preview.emergentagent.com/api/items/${itemId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        console.log('✅ Checklist status updated successfully');
        if (onReload) onReload();
      }
    } catch (error) {
      console.error('❌ Error updating checklist status:', error);
    }
  };

  const handleAddCategory = async (roomId, categoryName) => {
    try {
      const response = await fetch(`https://app-finalizer-2.preview.emergentagent.com/api/categories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: categoryName,
          room_id: roomId,
          order_index: 0
        })
      });

      if (response.ok) {
        console.log('✅ Checklist category added successfully');
        if (onReload) onReload();
      }
    } catch (error) {
      console.error('❌ Error adding checklist category:', error);
    }
  };

  // Initialize expanded states
  useEffect(() => {
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

  // Filtering logic
  useEffect(() => {
    if (!project) {
      setFilteredProject(null);
      return;
    }

    let filtered = { ...project };

    if (searchTerm || selectedRoom || selectedCategory || selectedVendor || selectedStatus) {
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

  const toggleRoomExpansion = (roomId) => {
    setExpandedRooms(prev => ({
      ...prev,
      [roomId]: !prev[roomId]
    }));
  };

  const toggleCategoryExpansion = (categoryId) => {
    setExpandedCategories(prev => ({
      ...prev,
      [categoryId]: !prev[categoryId]
    }));
  };

  // Color functions
  const getRoomColor = (roomName) => {
    const roomColors = {
      'living room': '#7C3AED',
      'dining room': '#DC2626',
      'kitchen': '#EA580C',
      'primary bedroom': '#059669',
      'primary bathroom': '#2563EB',
      'powder room': '#7C2D12',
      'guest room': '#BE185D',
      'office': '#6366F1'
    };
    return roomColors[roomName.toLowerCase()] || '#7C3AED';
  };

  const getCategoryColor = () => '#065F46';
  
  const getStatusColor = (status) => {
    const colors = {
      'PICKED': '#10B981',
      'ORDERED': '#3B82F6',
      'SHIPPED': '#F97316',
      'DELIVERED TO JOB SITE': '#8B5CF6',
      'INSTALLED': '#10B981'
    };
    return colors[status] || '#6B7280';
  };

  if (!project || !project.rooms || project.rooms.length === 0) {
    return (
      <div className="text-center text-gray-400 py-8">
        <p className="text-lg">Loading Checklist data...</p>
      </div>
    );
  }

  return (
    <div className="w-full" style={{ backgroundColor: '#0F172A' }}>
      
      {/* SEARCH AND FILTER SECTION */}
      <div className="mb-6 p-4" style={{ backgroundColor: '#1E293B' }}>
        <div className="flex flex-col lg:flex-row gap-4 items-center">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search Items, Vendors, SKUs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 rounded bg-gray-700 text-white border border-gray-600 focus:border-blue-500 focus:outline-none"
            />
          </div>
          
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
              <option value="Lighting">Lighting</option>
              <option value="Furniture">Furniture</option>
              <option value="Decor & Accessories">Decor & Accessories</option>
            </select>
            
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
          
          <button 
            onClick={() => onAddRoom && onAddRoom()}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded font-medium"
          >
            ✚ ADD ROOM
          </button>
        </div>
      </div>

      {/* CHECKLIST TABLE - 7 COLUMNS ONLY */}
      <div className="w-full overflow-x-auto" style={{ backgroundColor: '#0F172A', touchAction: 'pan-x' }}>
        <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch', minWidth: '1000px' }}>
          <div className="w-full" style={{ touchAction: 'pan-x pan-y' }}>
            <table className="w-full border-collapse border border-gray-400">
              
              <thead>
                <tr>
                  <th className="border border-gray-400 px-3 py-2 text-xs font-bold text-white" style={{ backgroundColor: '#7F1D1D' }}>ITEM</th>
                  <th className="border border-gray-400 px-3 py-2 text-xs font-bold text-white" style={{ backgroundColor: '#92400E' }}>QTY</th>
                  <th className="border border-gray-400 px-3 py-2 text-xs font-bold text-white" style={{ backgroundColor: '#92400E' }}>SIZE</th>
                  <th className="border border-gray-400 px-3 py-2 text-xs font-bold text-white" style={{ backgroundColor: '#6B46C1' }}>STATUS</th>
                  <th className="border border-gray-400 px-3 py-2 text-xs font-bold text-white" style={{ backgroundColor: '#92400E' }}>VENDOR/SKU</th>
                  <th className="border border-gray-400 px-3 py-2 text-xs font-bold text-white" style={{ backgroundColor: '#92400E' }}>IMAGE</th>
                  <th className="border border-gray-400 px-3 py-2 text-xs font-bold text-white" style={{ backgroundColor: '#7F1D1D' }}>LINK</th>
                </tr>
              </thead>

              <tbody>
                {(filteredProject || project).rooms.map((room, roomIndex) => {
                  const isRoomExpanded = expandedRooms[room.id];
                  
                  return (
                    <React.Fragment key={room.id}>
                      {/* ROOM HEADER ROW */}
                      <tr>
                        <td colSpan="7" 
                            className="border border-gray-400 px-3 py-2 text-white text-sm font-bold"
                            style={{ backgroundColor: getRoomColor(room.name) }}>
                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => toggleRoomExpansion(room.id)}
                                className="text-white hover:text-gray-200"
                              >
                                {isRoomExpanded ? '🔽' : '▶️'}
                              </button>
                              <span>🏠 {room.name.toUpperCase()}</span>
                            </div>
                            <button
                              onClick={() => onDeleteRoom && onDeleteRoom(room.id)}
                              className="text-red-300 hover:text-red-100 text-lg ml-2"
                              title="Delete Room"
                            >
                              🗑️
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* CATEGORIES AND ITEMS */}
                      {isRoomExpanded && room.categories?.map((category, categoryIndex) => {
                        const isCategoryExpanded = expandedCategories[category.id];
                        
                        return (
                          <React.Fragment key={category.id}>
                            {/* CATEGORY HEADER */}
                            <tr>
                              <td colSpan="7"
                                  className="border border-gray-400 px-4 py-2 text-white text-sm font-bold"
                                  style={{ backgroundColor: getCategoryColor() }}>
                                <div className="flex justify-between items-center">
                                  <div className="flex items-center gap-2">
                                    <button
                                      onClick={() => toggleCategoryExpansion(category.id)}
                                      className="text-white hover:text-gray-200"
                                    >
                                      {isCategoryExpanded ? '🔽' : '▶️'}
                                    </button>
                                    <span>📂 {category.name.toUpperCase()}</span>
                                  </div>
                                </div>
                              </td>
                            </tr>

                            {/* SUBCATEGORY ITEMS */}
                            {isCategoryExpanded && category.subcategories?.map((subcategory) => (
                              <React.Fragment key={subcategory.id}>
                                {/* SUBCATEGORY HEADER */}
                                <tr>
                                  <td colSpan="6"
                                      className="border border-gray-400 px-6 py-2 text-white text-sm font-bold"
                                      style={{ backgroundColor: '#8A5A5A' }}>
                                    {subcategory.name.toUpperCase()} ({subcategory.items?.length || 0})
                                  </td>
                                  <td className="border border-gray-400 px-2 py-2 text-center">
                                    <button 
                                      onClick={() => handleDeleteItem(subcategory.id)}
                                      className="bg-red-600 hover:bg-red-500 text-white text-xs px-1 py-1 rounded"
                                      title="Delete Subcategory"
                                    >
                                      🗑️
                                    </button>
                                  </td>
                                </tr>

                                {/* ITEMS - 7 COLUMNS ONLY */}
                                {subcategory.items?.map((item) => (
                                  <tr key={item.id}>
                                    {/* Item Name */}
                                    <td className="border border-gray-400 px-2 py-2 text-white text-sm">
                                      {item.name}
                                    </td>
                                    
                                    {/* Quantity */}
                                    <td className="border border-gray-400 px-2 py-2 text-white text-sm text-center">
                                      {item.quantity || 1}
                                    </td>
                                    
                                    {/* Size */}
                                    <td className="border border-gray-400 px-2 py-2 text-white text-sm">
                                      <input type="text" className="w-full bg-transparent border-none text-white text-sm" placeholder="Size" />
                                    </td>
                                    
                                    {/* Status */}
                                    <td className="border border-gray-400 px-2 py-2 text-white text-sm">
                                      <select 
                                        className="w-full bg-transparent border-none text-white text-xs"
                                        value={item.status || ''}
                                        style={{ backgroundColor: getStatusColor(item.status || '') }}
                                        onChange={(e) => handleStatusChange(item.id, e.target.value)}
                                      >
                                        <option value="">Status...</option>
                                        <option value="PICKED">PICKED</option>
                                        <option value="ORDERED">ORDERED</option>
                                        <option value="SHIPPED">SHIPPED</option>
                                        <option value="DELIVERED TO JOB SITE">DELIVERED TO JOB SITE</option>
                                        <option value="INSTALLED">INSTALLED</option>
                                      </select>
                                    </td>
                                    
                                    {/* Vendor/SKU */}
                                    <td className="border border-gray-400 px-2 py-2 text-white text-sm">
                                      <div className="text-xs">
                                        <div>{item.vendor || ''}</div>
                                        <div className="text-gray-400">{item.sku || ''}</div>
                                      </div>
                                    </td>
                                    
                                    {/* Image - Thumbnail with expand */}
                                    <td className="border border-gray-400 px-2 py-2 text-center">
                                      {item.image_url ? (
                                        <img 
                                          src={item.image_url} 
                                          alt={item.name} 
                                          className="w-8 h-8 object-cover rounded cursor-pointer hover:scale-110 transition-transform"
                                          onClick={() => {
                                            // Create modal for expanded image
                                            const modal = document.createElement('div');
                                            modal.className = 'fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50';
                                            modal.innerHTML = `
                                              <div class="relative max-w-4xl max-h-4xl">
                                                <img src="${item.image_url}" alt="${item.name}" class="max-w-full max-h-full object-contain" />
                                                <button class="absolute top-4 right-4 text-white bg-black bg-opacity-50 rounded-full w-8 h-8 flex items-center justify-center" onclick="this.parentElement.parentElement.remove()">✕</button>
                                              </div>
                                            `;
                                            document.body.appendChild(modal);
                                          }}
                                          title="Click to expand image"
                                        />
                                      ) : (
                                        <span className="text-gray-500 text-xs">No Image</span>
                                      )}
                                    </td>
                                    
                                    {/* Link - Canva Integration */}
                                    <td className="border border-gray-400 px-2 py-2 text-white text-sm">
                                      {item.link ? (
                                        <a 
                                          href={item.link} 
                                          target="_blank" 
                                          rel="noopener noreferrer"
                                          className="text-blue-400 hover:text-blue-300 text-xs underline"
                                          title="View Link"
                                        >
                                          🔗 LINK
                                        </a>
                                      ) : (
                                        <input 
                                          type="url" 
                                          className="w-full bg-transparent border border-gray-600 text-white text-xs px-1 py-1 rounded"
                                          placeholder="Canva URL"
                                          onBlur={async (e) => {
                                            if (e.target.value.includes('canva.com')) {
                                              console.log('🎨 Canva link detected:', e.target.value);
                                              
                                              // Scrape Canva board
                                              try {
                                                const response = await fetch('https://app-finalizer-2.preview.emergentagent.com/api/scrape-product', {
                                                  method: 'POST',
                                                  headers: { 'Content-Type': 'application/json' },
                                                  body: JSON.stringify({ url: e.target.value })
                                                });
                                                
                                                if (response.ok) {
                                                  const data = await response.json();
                                                  console.log('✅ Canva board scraped:', data);
                                                  alert(`Canva board scraped: ${data.data?.name || 'Success'}`);
                                                }
                                              } catch (error) {
                                                console.error('❌ Canva scraping failed:', error);
                                              }
                                            }
                                          }}
                                        />
                                      )}
                                    </td>
                                  </tr>
                                ))}

                                {/* ADD ITEM BUTTON ROW */}
                                <tr>
                                  <td colSpan="7" className="border border-gray-400 px-6 py-2 bg-slate-900">
                                    <div className="flex justify-start items-center space-x-4">
                                      <button
                                        onClick={() => {
                                          setSelectedSubCategoryId(subcategory.id);
                                          setShowAddItem(true);
                                        }}
                                        className="bg-amber-700 hover:bg-amber-600 text-white px-3 py-1 rounded text-sm font-medium"
                                      >
                                        ✚ Add Item
                                      </button>
                                      
                                      <select
                                        value=""
                                        onChange={(e) => {
                                          if (e.target.value) {
                                            handleAddCategory(room.id, e.target.value);
                                          }
                                        }}
                                        className="bg-amber-700 hover:bg-amber-600 text-white px-3 py-1 rounded text-sm font-medium border-none outline-none"
                                      >
                                        <option value="">Add Category ▼</option>
                                        <option value="Lighting">Lighting</option>
                                        <option value="Furniture">Furniture</option>
                                        <option value="Decor & Accessories">Decor & Accessories</option>
                                        <option value="Plumbing & Fixtures">Plumbing & Fixtures</option>
                                      </select>
                                      
                                      <button
                                        onClick={() => {
                                          // Scrape all Canva links in this subcategory
                                          const canvaLinks = subcategory.items
                                            .filter(item => item.link && item.link.includes('canva.com'))
                                            .map(item => item.link);
                                          
                                          if (canvaLinks.length > 0) {
                                            console.log('🎨 Batch scraping Canva boards:', canvaLinks);
                                            alert(`Found ${canvaLinks.length} Canva links - scraping now!`);
                                            
                                            canvaLinks.forEach(async (link, index) => {
                                              setTimeout(async () => {
                                                try {
                                                  const response = await fetch('https://app-finalizer-2.preview.emergentagent.com/api/scrape-product', {
                                                    method: 'POST',
                                                    headers: { 'Content-Type': 'application/json' },
                                                    body: JSON.stringify({ url: link })
                                                  });
                                                  
                                                  if (response.ok) {
                                                    const data = await response.json();
                                                    console.log(`✅ Canva board ${index + 1} scraped:`, data);
                                                  }
                                                } catch (error) {
                                                  console.error(`❌ Canva scraping ${index + 1} failed:`, error);
                                                }
                                              }, index * 2000); // 2 second delay between scrapes
                                            });
                                          } else {
                                            alert('No Canva links found in this section');
                                          }
                                        }}
                                        className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded text-sm font-medium"
                                      >
                                        🎨 Scrape Canva
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              </React.Fragment>
                            ))}
                          </React.Fragment>
                        );
                      })}
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

export default SimpleChecklistSpreadsheet;
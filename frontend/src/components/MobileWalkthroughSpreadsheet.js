// RED BANNER TEST
import React, { useState, useEffect } from 'react';

import AddItemModal from './AddItemModal';
import PhotoManagerModal from './PhotoManagerModal';

const MobileWalkthroughSpreadsheet = ({
  project,
  projectId,
  onOpenPhotos,
  roomColors = {},
  categoryColors = {},
  itemStatuses = [],
  vendorTypes = [],
  carrierTypes = [],
  onDeleteRoom,
  onAddRoom,
  onReload
}) => {
  // Load project if only projectId provided
  const [loadedProject, setLoadedProject] = React.useState(project);
  
  React.useEffect(() => {
    if (projectId && !project) {
      fetch(`${process.env.REACT_APP_BACKEND_URL}/api/projects/${projectId}?sheet_type=walkthrough`)
        .then(res => res.json())
        .then(data => setLoadedProject(data))
        .catch(err => console.error('Failed to load project:', err));
    } else {
      setLoadedProject(project);
    }
  }, [projectId, project]);
  
  const actualProject = loadedProject;
  const [showAddItem, setShowAddItem] = useState(false);
  const [selectedSubCategoryId, setSelectedSubCategoryId] = useState(null);
  const [availableCategories, setAvailableCategories] = useState([]);
  const [expandedRooms, setExpandedRooms] = useState({});
  const [expandedCategories, setExpandedCategories] = useState({});
  
  // PHOTO MANAGEMENT STATE
  const [showPhotoManager, setShowPhotoManager] = useState(false);
  const [selectedRoomForPhotos, setSelectedRoomForPhotos] = useState(null);
  const [roomPhotos, setRoomPhotos] = useState({});  // {roomId: [{photo, measurements}]}
  const [leicaConnected, setLeicaConnected] = useState(false);

  // FILTER STATE
  const [filteredProject, setFilteredProject] = useState(actualProject);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRoom, setSelectedRoom] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedVendor, setSelectedVendor] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  // API CALLS - WALKTHROUGH SPECIFIC
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

      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL || window.location.origin}/api/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newItem)
      });

      if (response.ok) {
        console.log('✅ Walkthrough item added successfully');
        setShowAddItem(false);
        window.location.reload();
      } else {
        const errorData = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorData}`);
      }
    } catch (error) {
      console.error('❌ Error adding walkthrough item:', error);
      alert(`Failed to add item: ${error.message}`);
    }
  };

  const handleDeleteItem = async (itemId) => {
    if (!window.confirm('Are you sure you want to delete this item?')) return;

    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL || window.location.origin}/api/items/${itemId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        console.log('✅ Walkthrough item deleted successfully');
        window.location.reload();
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (error) {
      console.error('❌ Error deleting walkthrough item:', error);
    }
  };

  const handleDeleteRoom = async (roomId) => {
    if (!window.confirm('Are you sure you want to delete this room?')) return;
    
    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL || window.location.origin}/api/rooms/${roomId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        console.log('✅ Walkthrough room deleted successfully');
        window.location.reload();
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (error) {
      console.error('❌ Error deleting walkthrough room:', error);
    }
  };

  const handleAddCategory = async (roomId, categoryName) => {
    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL || window.location.origin}/api/categories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: categoryName,
          room_id: roomId,
          order_index: 0
        })
      });

      if (response.ok) {
        console.log('✅ Walkthrough category added successfully');
        window.location.reload();
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (error) {
      console.error('❌ Error adding walkthrough category:', error);
    }
  };

  // FILTERING LOGIC
  useEffect(() => {
    if (!actualProject) {
      setFilteredProject(null);
      return;
    }

    let filtered = { ...actualProject };

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

  // Load available categories
  useEffect(() => {
    const loadAvailableCategories = async () => {
      try {
        const response = await fetch(`${process.env.REACT_APP_BACKEND_URL || window.location.origin}/api/categories/available`);
        if (response.ok) {
          const data = await response.json();
          setAvailableCategories(data.categories || []);
        }
      } catch (error) {
        console.error('❌ Error loading available categories:', error);
        setAvailableCategories(["Lighting", "Furniture & Storage", "Decor & Accessories"]);
      }
    };
    
    loadAvailableCategories();

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

  // Color functions - same as FF&E
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

  if (!project || !project.rooms || project.rooms.length === 0) {
      <div className="text-center text-gray-400 py-8">
        <p className="text-lg">Loading Walkthrough data...</p>
      </div>
    );
  }

    <div className="w-full" style={{ backgroundColor: '#0F172A' }}>
      
      {/* PHOTO MANAGEMENT HEADER */}
      <div className="mb-6 p-6 rounded-2xl shadow-xl backdrop-blur-sm border border-[#D4A574]/60" 
           style={{
             background: 'linear-gradient(135deg, rgba(0,0,0,0.95) 0%, rgba(30,30,30,0.9) 30%, rgba(15,15,25,0.95) 70%, rgba(0,0,0,0.95) 100%)'
           }}>
        <h2 className="text-2xl font-bold text-[#D4A574] mb-6">📸 PHOTO MANAGEMENT</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          {/* Photos Captured */}
          <div className="p-4 border border-[#D4A574]/50 rounded" style={{ background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.95) 0%, rgba(10, 10, 10, 0.9) 30%, rgba(5, 5, 5, 0.95) 70%, rgba(0, 0, 0, 0.95) 100%)' }}>
            <div className="text-[#D4A574] text-sm mb-1">Photos Captured</div>
            <div className="text-3xl font-bold text-[#D4C5A9]">
              {Object.values(roomPhotos).reduce((sum, photos) => sum + photos.length, 0)}
            </div>
          </div>
          
          {/* Measurements Added */}
          <div className="p-4 border border-[#D4A574]/50 rounded" style={{ background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.95) 0%, rgba(10, 10, 10, 0.9) 30%, rgba(5, 5, 5, 0.95) 70%, rgba(0, 0, 0, 0.95) 100%)' }}>
            <div className="text-[#D4A574] text-sm mb-1">Measurements Added</div>
            <div className="text-3xl font-bold text-[#D4C5A9]">
              {Object.values(roomPhotos).reduce((sum, photos) => sum + photos.filter(p => p.measurements?.length > 0).length, 0)}
            </div>
          </div>
          
          {/* Rooms Photographed */}
          <div className="p-4 border border-[#D4A574]/50 rounded" style={{ background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.95) 0%, rgba(10, 10, 10, 0.9) 30%, rgba(5, 5, 5, 0.95) 70%, rgba(0, 0, 0, 0.95) 100%)' }}>
            <div className="text-[#D4A574] text-sm mb-1">Rooms Photographed</div>
            <div className="text-3xl font-bold text-[#D4C5A9]">
              {Object.keys(roomPhotos).length} / {project?.rooms?.length || 0}
            </div>
          </div>
          
          {/* Leica D5 Status */}
          <div className="p-4 border border-[#D4A574]/50 rounded" style={{ background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.95) 0%, rgba(10, 10, 10, 0.9) 30%, rgba(5, 5, 5, 0.95) 70%, rgba(0, 0, 0, 0.95) 100%)' }}>
            <div className="text-[#D4A574] text-sm mb-1">Leica D5 Status</div>
            <div className={`text-xl font-bold ${leicaConnected ? 'text-green-400' : 'text-red-400'}`}>
              {leicaConnected ? '✓ Connected' : '✗ Not Connected'}
            </div>
            <button 
              onClick={() => {/* TODO: Leica Bluetooth connection */}}
              className="mt-2 px-3 py-1 bg-[#D4A574] hover:bg-[#C49564] text-black rounded text-sm font-medium"
            >
              {leicaConnected ? 'Disconnect' : 'Connect Leica D5'}
            </button>
          </div>
        </div>
        
        {/* Room Photo Folders */}
        <div className="border-t border-[#D4A574]/30 pt-4">
          <h3 className="text-lg font-bold text-[#D4A574] mb-3">📁 Photos by Room</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {project?.rooms?.map(room => (
              <button
                key={room.id}
                onClick={() => {
                  setSelectedRoomForPhotos(room);
                  setShowPhotoManager(true);
                }}
                className="p-3 border border-[#D4A574]/50 rounded hover:bg-[#D4A574]/20 transition-colors"
                style={{ background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.95) 0%, rgba(10, 10, 10, 0.9) 50%, rgba(0, 0, 0, 0.95) 100%)' }}
              >
                <div className="text-2xl mb-1">📁</div>
                <div className="text-sm text-[#D4C5A9] font-medium truncate">{room.name}</div>
                <div className="text-xs text-[#D4A574]">
                  {roomPhotos[room.id]?.length || 0} photos
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
      
      {/* SEARCH AND FILTER SECTION */}
      <div className="mb-6 p-4" style={{ backgroundColor: '#1E293B' }}>
        <div className="flex flex-col lg:flex-row gap-4 items-center">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search Items, Vendors, SKUs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 rounded bg-gray-900/50 text-[#D4A574] border border-[#D4A574]/50 focus:border-[#D4A574] focus:outline-none placeholder-[#D4A574]/70"
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
              {availableCategories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
            
            <button 
              onClick={() => {
                console.log('🔍 WALKTHROUGH FILTER APPLIED');
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
                console.log('🧹 WALKTHROUGH FILTER CLEARED');
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

      {/* WALKTHROUGH TABLE */}
      <div className="w-full overflow-x-auto" style={{ backgroundColor: '#0F172A', touchAction: 'pan-x' }}>
        <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch', minWidth: '1000px' }}>
          <div className="w-full" style={{ touchAction: 'pan-x pan-y' }}>
            <table className="w-full border-collapse border border-gray-400">
              
              <thead>
                <tr>
                  <th className="border border-gray-400 px-3 py-2 text-xs font-bold text-white" style={{ backgroundColor: '#8B4444' }}>INSTALLED</th>
                  <th className="border border-gray-400 px-3 py-2 text-xs font-bold text-white" style={{ backgroundColor: '#8B4444' }}>VENDOR/SKU</th>
                  <th className="border border-gray-400 px-3 py-2 text-xs font-bold text-white" style={{ backgroundColor: '#8B4444' }}>QTY</th>
                  <th className="border border-gray-400 px-3 py-2 text-xs font-bold text-white" style={{ backgroundColor: '#8B4444' }}>SIZE</th>
                </tr>
              </thead>

              <tbody>
                {(filteredProject || project).rooms.map((room, roomIndex) => {
                  const isRoomExpanded = expandedRooms[room.id];
                  
                    <React.Fragment key={room.id}>
                      {/* ROOM HEADER ROW */}
                      <tr>
                        <td colSpan="5" 
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
                              onClick={() => handleDeleteRoom(room.id)}
                              className="text-red-300 hover:text-red-100 text-lg ml-2"
                              title="Delete Room"
                            >
                              🗑️
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* CATEGORIES AND INSTALLEDS */}
                      {isRoomExpanded && room.categories?.map((category, categoryIndex) => {
                        const isCategoryExpanded = expandedCategories[category.id];
                        
                          <React.Fragment key={category.id}>
                            {/* CATEGORY HEADER */}
                            <tr>
                              <td colSpan="5"
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

                            {/* SUBCATEGORY INSTALLEDS */}
                            {isCategoryExpanded && category.subcategories?.map((subcategory) => (
                              <React.Fragment key={subcategory.id}>
                                {/* REMOVED SUBCATEGORY HEADER - Items go directly under category */}

                                {/* INSTALLEDS - 4 COLUMNS: INSTALLED | VENDOR/SKU | QTY | SIZE */}
                                {subcategory.items?.map((item) => (
                                  <tr key={item.id}>
                                    <td className="border border-gray-400 px-2 py-2 text-white text-sm">
                                      {item.name}
                                    </td>
                                    <td className="border border-gray-400 px-2 py-2 text-white text-sm">
                                      {item.vendor || ''}
                                    </td>
                                    <td className="border border-gray-400 px-2 py-2 text-white text-sm text-center">
                                      {item.quantity || 1}
                                    </td>
                                    <td className="border border-gray-400 px-2 py-2 text-white text-sm">
                                      {item.size || ''}
                                    </td>
                                  </tr>
                                ))}

                                {/* ADD INSTALLED BUTTON ROW */}
                                <tr>
                                  <td colSpan="4" className="border border-gray-400 px-6 py-2 bg-slate-900">
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
                                        <option value="Window Treatments">Window Treatments</option>
                                        <option value="Textiles & Soft Goods">Textiles & Soft Goods</option>
                                        <option value="Art & Accessories">Art & Accessories</option>
                                        <option value="Fireplace & Built-ins">Fireplace & Built-ins</option>
                                        <option value="Paint, Wallpaper, and Finishes">Paint, Wallpaper, and Finishes</option>
                                        <option value="Plumbing & Fixtures">Plumbing & Fixtures</option>
                                        <option value="Furniture & Storage">Furniture & Storage</option>
                                        <option value="Cabinets & Storage">Cabinets & Storage</option>
                                        <option value="Cabinets, Built-ins, and Trim">Cabinets, Built-ins, and Trim</option>
                                        <option value="Tile and Tops">Tile and Tops</option>
                                        <option value="Appliances">Appliances</option>
                                        <option value="Decor & Accessories">Decor & Accessories</option>
                                      </select>
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
      
      {/* Photo Manager Modal */}
      {showPhotoManager && selectedRoomForPhotos && (
        <PhotoManagerModal
          room={selectedRoomForPhotos}
          photos={roomPhotos[selectedRoomForPhotos.id] || []}
          onClose={() => {
            setShowPhotoManager(false);
            setSelectedRoomForPhotos(null);
          }}
          onSavePhotos={(roomId, photos) => {
            setRoomPhotos(prev => ({
              ...prev,
              [roomId]: photos
            }));
            // TODO: Save to backend
            console.log('📸 Photos saved for room:', roomId, photos);
          }}
          leicaConnected={leicaConnected}
          onConnectLeica={async () => {
            try {
              // TODO: Implement Leica D5 Bluetooth connection
              // For now, simulate connection
              setLeicaConnected(true);
              alert('Leica D5 Connected! (Simulated - Bluetooth integration pending)');
            } catch (error) {
              console.error('Failed to connect to Leica D5:', error);
              alert('Failed to connect to Leica D5. Please try again.');
            }
          }}
        />
      )}
    </div>
  );
};

export default MobileWalkthroughSpreadsheet;
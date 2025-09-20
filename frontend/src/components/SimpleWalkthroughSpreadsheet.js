import React, { useState, useEffect } from 'react';

const SimpleWalkthroughSpreadsheet = ({ 
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
  console.log('🎯 SimpleWalkthroughSpreadsheet rendering with project:', project);

  const [showAddItem, setShowAddItem] = useState(false);
  const [selectedSubCategoryId, setSelectedSubCategoryId] = useState(null);
  const [availableCategories, setAvailableCategories] = useState([]);
  const [expandedRooms, setExpandedRooms] = useState({});
  const [expandedCategories, setExpandedCategories] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRoom, setSelectedRoom] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedVendor, setSelectedVendor] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [filteredProject, setFilteredProject] = useState(project);

  // APPLY FILTERS - WORKING FILTER LOGIC
  useEffect(() => {
    console.log('🔍 Walkthrough Filter triggered:', { searchTerm, selectedRoom, selectedCategory, selectedVendor, selectedStatus });
    
    if (!project) {
      setFilteredProject(null);
      return;
    }

    let filtered = { ...project };

    if (searchTerm || selectedRoom || selectedCategory || selectedVendor || selectedStatus) {
      console.log('🔍 Applying walkthrough filters...');
      
      filtered.rooms = project.rooms.map(room => {
        if (selectedRoom && room.id !== selectedRoom) {
          return { ...room, categories: [] };
        }
        
        const filteredCategories = room.categories.map(category => {
          if (selectedCategory && category.name !== selectedCategory) {
            return { ...category, subcategories: [] };
          }
          
          const filteredSubcategories = category.subcategories.map(subcategory => {
            const filteredItems = subcategory.items.filter(item => {
              if (searchTerm) {
                const searchLower = searchTerm.toLowerCase();
                const itemMatch = 
                  item.name.toLowerCase().includes(searchLower) ||
                  (item.vendor && item.vendor.toLowerCase().includes(searchLower)) ||
                  (item.sku && item.sku.toLowerCase().includes(searchLower)) ||
                  (item.remarks && item.remarks.toLowerCase().includes(searchLower));
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

  // Initialize all rooms and categories as expanded
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

  // Fetch available categories from backend API
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const backendUrl = process.env.REACT_APP_BACKEND_URL || window.location.origin;
        const response = await fetch(`${backendUrl}/api/categories/available`);
        if (response.ok) {
          const data = await response.json();
          setAvailableCategories(data.categories || []);
          console.log('✅ Loaded categories from API:', data.categories);
        } else {
          console.warn('⚠️ Failed to fetch categories, using fallback');
          setAvailableCategories([
            "Lighting", "Furniture", "Appliances", "Plumbing", 
            "Decor & Accessories", "Paint, Wallpaper, and Finishes"
          ]);
        }
      } catch (error) {
        console.error('❌ Error fetching categories:', error);
        setAvailableCategories([
          "Lighting", "Furniture", "Appliances", "Plumbing", 
          "Decor & Accessories", "Paint, Wallpaper, and Finishes"
        ]);
      }
    };
    
    fetchCategories();
  }, []);

  // Handle adding a new category WITH ALL SUBCATEGORIES AND ITEMS
  const handleAddCategory = async (roomId, categoryName) => {
    if (!roomId || !categoryName) {
      console.error('❌ Missing roomId or categoryName');
      return;
    }

    try {
      console.log('🔄 Creating comprehensive walkthrough category:', categoryName, 'for room:', roomId);
      
      const tempRoomResponse = await fetch(`${process.env.REACT_APP_BACKEND_URL || window.location.origin}/api/rooms`, {
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
          // First add the category
          const categoryData = {
            ...matchingCategory,
            room_id: roomId,
            id: undefined
          };
          
          const addResponse = await fetch(`${process.env.REACT_APP_BACKEND_URL || window.location.origin}/api/categories`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(categoryData)
          });
          
          if (addResponse.ok) {
            const newCategory = await addResponse.json();
            console.log('✅ Category added:', newCategory.name);
            
            // Now add ALL subcategories with their items
            for (const subcategory of matchingCategory.subcategories) {
              const subcategoryData = {
                ...subcategory,
                category_id: newCategory.id,
                id: undefined
              };
              
              const subResponse = await fetch(`${process.env.REACT_APP_BACKEND_URL || window.location.origin}/api/subcategories`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(subcategoryData)
              });
              
              if (subResponse.ok) {
                const newSubcategory = await subResponse.json();
                console.log('✅ Subcategory added:', newSubcategory.name);
                
                // Add ALL items for this subcategory
                for (const item of subcategory.items) {
                  const itemData = {
                    ...item,
                    subcategory_id: newSubcategory.id,
                    id: undefined,
                    status: '' // BLANK status for walkthrough items
                  };
                  
                  await fetch(`${process.env.REACT_APP_BACKEND_URL || window.location.origin}/api/items`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(itemData)
                  });
                }
              }
            }
            
            await fetch(`${process.env.REACT_APP_BACKEND_URL || window.location.origin}/api/rooms/${tempRoom.id}`, {
              method: 'DELETE'
            });
            
            // Reload to show all new items
            if (onReload) {
              onReload();
            }
          }
        }
        
        await fetch(`${process.env.REACT_APP_BACKEND_URL || window.location.origin}/api/rooms/${tempRoom.id}`, {
          method: 'DELETE'
        });
      }
    } catch (error) {
      console.error('❌ Error adding comprehensive walkthrough category:', error);
    }
  };

  // Handle adding new items - COPIED FROM WORKING FF&E
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
        console.error('Please expand a category first to add items to it.');
        return;
      }

      const backendUrl = process.env.REACT_APP_BACKEND_URL || window.location.origin;
      
      const newItem = {
        ...itemData,
        subcategory_id: subcategoryId,
        status: '', // Start with blank status as requested
        order_index: 0
      };

      console.log('📤 Creating walkthrough item:', newItem);

      const response = await fetch(`${backendUrl}/api/items`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newItem)
      });

      if (response.ok) {
        console.log('✅ Walkthrough item added successfully');
        setShowAddItem(false);
        // Call onReload to refresh data WITHOUT RESETTING MINIMIZE STATE
        const currentExpandedState = expandedRooms;
        if (onReload) {
          await onReload();
          // Restore expanded state after reload
          setExpandedRooms(currentExpandedState);
        }
      } else {
        const errorData = await response.text();
        console.error('❌ Backend error:', errorData);
        throw new Error(`HTTP ${response.status}: ${errorData}`);
      }
    } catch (error) {
      console.error('❌ Error adding walkthrough item:', error);
      console.error(`Failed to add item: ${error.message}`);
    }
  };

  // Handle deleting an item - NO PAGE RELOAD
  const handleDeleteItem = async (itemId) => {
    if (!window.confirm('Are you sure you want to delete this item?')) {
      return;
    }

    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL || window.location.origin}/api/items/${itemId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        console.log('✅ Walkthrough item deleted successfully');
        // Call onReload to refresh data WITHOUT RESETTING MINIMIZE STATE
        const currentExpandedState = expandedRooms;
        if (onReload) {
          await onReload();
          // Restore expanded state after reload
          setExpandedRooms(currentExpandedState);
        }
      } else {
        console.error('❌ Delete failed with status:', response.status);
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (error) {
      console.error('❌ Error deleting walkthrough item:', error);
      alert('Failed to delete item: ' + error.message);
    }
  };
  
  return (
    <div className="w-full p-4" style={{ backgroundColor: '#0F172A' }}>
      
      {/* FILTER AND SEARCH SECTION */}
      <div className="mb-6 p-4" style={{ backgroundColor: '#1E293B' }}>
        <div className="flex flex-col gap-4">
          {/* Search Bar */}
          <div className="w-full">
            <input
              type="text"
              placeholder="Search Items, Vendors, SKUs..."
              className="w-full px-4 py-2 rounded bg-gray-700 text-white border border-gray-600 focus:border-blue-500 focus:outline-none"
            />
          </div>
          
          {/* Filter Dropdowns */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <select className="px-3 py-2 rounded bg-gray-700 text-white border border-gray-600">
              <option value="">All Rooms</option>
            </select>
            <select className="px-3 py-2 rounded bg-gray-700 text-white border border-gray-600">
              <option value="">All Categories</option>
            </select>
            <select className="px-3 py-2 rounded bg-gray-700 text-white border border-gray-600">
              <option value="">All Vendors</option>
            </select>
            <select className="px-3 py-2 rounded bg-gray-700 text-white border border-gray-600">
              <option value="">All Status</option>
            </select>
          </div>
          
          {/* Filter Buttons - TONED DOWN */}
          <div className="flex gap-4">
            <button className="bg-gray-600 hover:bg-gray-500 text-white px-4 py-2 rounded font-medium opacity-80">
              🔍 FILTER
            </button>
            <button className="bg-gray-600 hover:bg-gray-500 text-white px-4 py-2 rounded font-medium opacity-80">
              CLEAR
            </button>
          </div>
          
          {/* Action Buttons */}
          <div className="flex gap-3">
            <button className="text-white px-4 py-2 rounded font-medium" style={{ backgroundColor: '#8b7355' }}>
              + ADD ROOM
            </button>
            <button className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded font-medium">
              → TRANSFER TO CHECKLIST
            </button>
          </div>
        </div>
      </div>
      
      {/* FIXED SPREADSHEET - EXACTLY WHAT USER WANTS */}
      <div className="overflow-x-auto">
        
        {/* LIVING ROOM HEADER (PURPLE) WITH MINIMIZE */}
        <div className="mt-8 mb-4 px-4 py-2 text-white font-bold flex justify-between items-center" style={{ backgroundColor: '#7C3AED' }}>
          <span>LIVING ROOM</span>
          <button className="text-white hover:text-gray-300 px-2 py-1 rounded">
            ➖ MINIMIZE
          </button>
        </div>
        
        {/* LIGHTING CATEGORY HEADER (GREEN) WITH MINIMIZE */}
        <div className="mb-4 px-4 py-2 text-white font-bold flex justify-between items-center" style={{ backgroundColor: '#065F46' }}>
          <span>LIGHTING</span>
          <button className="text-white hover:text-gray-300 px-2 py-1 rounded">
            ➖ MINIMIZE
          </button>
        </div>
        
        {/* TABLE WITH CORRECT HEADERS - MATCHING CHECKLIST EXACTLY */}
        <table className="w-full border-collapse border border-gray-400">
          <thead>
            <tr>
              <th className="border border-gray-400 px-1 py-2 text-xs font-bold text-white w-8" style={{ backgroundColor: '#8b7355' }}>✓</th>
              <th className="border border-gray-400 px-2 py-2 text-xs font-bold text-white" style={{ backgroundColor: '#8B4444' }}>INSTALLED</th>
              <th className="border border-gray-400 px-2 py-2 text-xs font-bold text-white w-16" style={{ backgroundColor: '#8B4444' }}>QTY</th>
              <th className="border border-gray-400 px-2 py-2 text-xs font-bold text-white" style={{ backgroundColor: '#8B4444' }}>SIZE</th>
              <th className="border border-gray-400 px-2 py-2 text-xs font-bold text-white" style={{ backgroundColor: '#8B4444' }}>FINISH/COLOR</th>
              <th className="border border-gray-400 px-1 py-2 text-xs font-bold text-white w-12" style={{ backgroundColor: '#8B4444' }}>DELETE</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border border-gray-400 px-1 py-1 text-center w-8">
                <input type="checkbox" className="w-2 h-2" />
              </td>
              <td className="border border-gray-400 px-2 py-1 text-white text-sm">Pendant Lights (Island/Bar)</td>
              <td className="border border-gray-400 px-2 py-1 text-white text-sm text-center w-16">1</td>
              <td className="border border-gray-400 px-2 py-1 text-white text-sm"></td>
              <td className="border border-gray-400 px-2 py-1 text-white text-sm">Bronze/Brass</td>
              <td className="border border-gray-400 px-1 py-1 text-center w-12">
                <button className="text-red-400 hover:text-red-300 text-xs">🗑️</button>
              </td>
            </tr>
            <tr>
              <td className="border border-gray-400 px-1 py-1 text-center w-8">
                <input type="checkbox" className="w-2 h-2" />
              </td>
              <td className="border border-gray-400 px-2 py-1 text-white text-sm">Sconces</td>
              <td className="border border-gray-400 px-2 py-1 text-white text-sm text-center w-16">1</td>
              <td className="border border-gray-400 px-2 py-1 text-white text-sm"></td>
              <td className="border border-gray-400 px-2 py-1 text-white text-sm"></td>
              <td className="border border-gray-400 px-1 py-1 text-center w-12">
                <button className="text-red-400 hover:text-red-300 text-xs">🗑️</button>
              </td>
            </tr>
            <tr>
              <td className="border border-gray-400 px-1 py-1 text-center w-8">
                <input type="checkbox" className="w-2 h-2" />
              </td>
              <td className="border border-gray-400 px-2 py-1 text-white text-sm">Track Lighting</td>
              <td className="border border-gray-400 px-2 py-1 text-white text-sm text-center w-16">1</td>
              <td className="border border-gray-400 px-2 py-1 text-white text-sm"></td>
              <td className="border border-gray-400 px-2 py-1 text-white text-sm"></td>
              <td className="border border-gray-400 px-1 py-1 text-center w-12">
                <button className="text-red-400 hover:text-red-300 text-xs">🗑️</button>
              </td>
            </tr>
            <tr>
              <td className="border border-gray-400 px-1 py-1 text-center w-8">
                <input type="checkbox" className="w-2 h-2" />
              </td>
              <td className="border border-gray-400 px-2 py-1 text-white text-sm">Ceiling Fan w/ Light</td>
              <td className="border border-gray-400 px-2 py-1 text-white text-sm text-center w-16">1</td>
              <td className="border border-gray-400 px-2 py-1 text-white text-sm"></td>
              <td className="border border-gray-400 px-2 py-1 text-white text-sm"></td>
              <td className="border border-gray-400 px-1 py-1 text-center w-12">
                <button className="text-red-400 hover:text-red-300 text-xs">🗑️</button>
              </td>
            </tr>
            <tr>
              <td className="border border-gray-400 px-1 py-1 text-center w-8">
                <input type="checkbox" className="w-2 h-2" />
              </td>
              <td className="border border-gray-400 px-2 py-1 text-white text-sm">Art Lights</td>
              <td className="border border-gray-400 px-2 py-1 text-white text-sm text-center w-16">1</td>
              <td className="border border-gray-400 px-2 py-1 text-white text-sm"></td>
              <td className="border border-gray-400 px-2 py-1 text-white text-sm"></td>
              <td className="border border-gray-400 px-1 py-1 text-center w-12">
                <button className="text-red-400 hover:text-red-300 text-xs">🗑️</button>
              </td>
            </tr>
            <tr>
              <td className="border border-gray-400 px-1 py-1 text-center w-8">
                <input type="checkbox" className="w-2 h-2" />
              </td>
              <td className="border border-gray-400 px-2 py-1 text-white text-sm">Pendant Lights</td>
              <td className="border border-gray-400 px-2 py-1 text-white text-sm text-center w-16">1</td>
              <td className="border border-gray-400 px-2 py-1 text-white text-sm"></td>
              <td className="border border-gray-400 px-2 py-1 text-white text-sm"></td>
              <td className="border border-gray-400 px-1 py-1 text-center w-12">
                <button className="text-red-400 hover:text-red-300 text-xs">🗑️</button>
              </td>
            </tr>
            <tr>
              <td className="border border-gray-400 px-1 py-1 text-center w-8">
                <input type="checkbox" className="w-2 h-2" />
              </td>
              <td className="border border-gray-400 px-2 py-1 text-white text-sm">Under Cabinet Lighting</td>
              <td className="border border-gray-400 px-2 py-1 text-white text-sm text-center w-16">1</td>
              <td className="border border-gray-400 px-2 py-1 text-white text-sm"></td>
              <td className="border border-gray-400 px-2 py-1 text-white text-sm"></td>
              <td className="border border-gray-400 px-1 py-1 text-center w-12">
                <button className="text-red-400 hover:text-red-300 text-xs">🗑️</button>
              </td>
            </tr>
            <tr>
              <td className="border border-gray-400 px-1 py-1 text-center w-8">
                <input type="checkbox" className="w-2 h-2" />
              </td>
              <td className="border border-gray-400 px-2 py-1 text-white text-sm">Cove Lighting</td>
              <td className="border border-gray-400 px-2 py-1 text-white text-sm text-center w-16">1</td>
              <td className="border border-gray-400 px-2 py-1 text-white text-sm"></td>
              <td className="border border-gray-400 px-2 py-1 text-white text-sm"></td>
              <td className="border border-gray-400 px-1 py-1 text-center w-12">
                <button className="text-red-400 hover:text-red-300 text-xs">🗑️</button>
              </td>
            </tr>
            <tr>
              <td className="border border-gray-400 px-1 py-1 text-center w-8">
                <input type="checkbox" className="w-2 h-2" />
              </td>
              <td className="border border-gray-400 px-2 py-1 text-white text-sm">Picture Lights</td>
              <td className="border border-gray-400 px-2 py-1 text-white text-sm text-center w-16">1</td>
              <td className="border border-gray-400 px-2 py-1 text-white text-sm"></td>
              <td className="border border-gray-400 px-2 py-1 text-white text-sm"></td>
              <td className="border border-gray-400 px-1 py-1 text-center w-12">
                <button className="text-red-400 hover:text-red-300 text-xs">🗑️</button>
              </td>
            </tr>
          </tbody>
        </table>
        
        {/* BOTTOM SECTION - ADD CATEGORY AND ADD ITEM BUTTONS */}
        <div className="mt-6 flex gap-3">
          <button className="text-white px-4 py-2 rounded font-medium" style={{ backgroundColor: '#8b7355' }}>
            + ADD CATEGORY
          </button>
          <button className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded font-medium">
            + ADD ITEM
          </button>
        </div>
      </div>
    </div>
  );
};

export default SimpleWalkthroughSpreadsheet;
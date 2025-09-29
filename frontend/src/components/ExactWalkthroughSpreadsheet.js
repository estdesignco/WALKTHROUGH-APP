import React, { useState, useEffect } from 'react';

import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import AddItemModal from './AddItemModal';
import AdvancedFFEFeatures from './AdvancedFFEFeatures';

const ExactWalkthroughSpreadsheet = ({ 
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

  // FILTER STATE - MAKE IT ACTUALLY WORK
  const [filteredProject, setFilteredProject] = useState(project);
  
  // ✅ Search and Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRoom, setSelectedRoom] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedVendor, setSelectedVendor] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedCarrier, setSelectedCarrier] = useState('');

  // ACTUAL API CALLS - WITH PROPER ERROR HANDLING
  const handleStatusChange = async (itemId, newStatus) => {
    console.log('🔄 Status change request:', { itemId, newStatus });
    
    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL || window.location.origin}/api/items/${itemId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      
      console.log('📡 Status change response:', response.status, response.statusText);
      
      if (response.ok) {
        console.log('✅ Status updated successfully, reloading...');
        window.location.reload();
      } else {
        const errorData = await response.text();
        console.error('❌ Status update failed:', response.status, errorData);
        alert(`Failed to update status: ${response.status} ${response.statusText}\n${errorData}`);
      }
    } catch (error) {
      console.error('❌ Status update error:', error);
      alert(`Error updating status: ${error.message}`);
    }
  };

  const handleCarrierChange = async (itemId, newCarrier) => {
    console.log('🔄 Carrier change request:', { itemId, newCarrier });
    
    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL || window.location.origin}/api/items/${itemId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ carrier: newCarrier })
      });
      
      if (response.ok) {
        console.log('✅ Carrier updated successfully, reloading...');
        window.location.reload();
      } else {
        const errorData = await response.text();
        console.error('❌ Carrier update failed:', response.status, errorData);
        alert(`Failed to update carrier: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.error('❌ Carrier update error:', error);
      alert(`Error updating carrier: ${error.message}`);
    }
  };

  // APPLY FILTERS - SIMPLE WORKING VERSION
  useEffect(() => {
    console.log('🔍 Filter triggered:', { searchTerm, selectedRoom, selectedCategory, selectedVendor, selectedStatus, selectedCarrier });
    
    if (!project) {
      setFilteredProject(null);
      return;
    }

    let filtered = { ...project };

    // Apply filters if any are selected
    if (searchTerm || selectedRoom || selectedCategory || selectedVendor || selectedStatus || selectedCarrier) {
      console.log('🔍 Applying filters...');
      
      filtered.rooms = project.rooms.map(room => {
        // Room filter
        if (selectedRoom && room.id !== selectedRoom) {
          return { ...room, categories: [] }; // Hide room content but keep room header
        }
        
        // Filter categories and items
        const filteredCategories = room.categories.map(category => {
          // Category filter
          if (selectedCategory && category.name.toLowerCase() !== selectedCategory.toLowerCase()) {
            return { ...category, subcategories: [] };
          }
          
          // Filter subcategories and items
          const filteredSubcategories = category.subcategories.map(subcategory => {
            const filteredItems = subcategory.items.filter(item => {
              // Search term filter
              if (searchTerm) {
                const searchLower = searchTerm.toLowerCase();
                const itemMatch = 
                  item.name.toLowerCase().includes(searchLower) ||
                  (item.vendor && item.vendor.toLowerCase().includes(searchLower)) ||
                  (item.sku && item.sku.toLowerCase().includes(searchLower));
                if (!itemMatch) return false;
              }
              
              // Vendor filter
              if (selectedVendor && item.vendor !== selectedVendor) {
                return false;
              }
              
              // Status filter
              if (selectedStatus && item.status !== selectedStatus) {
                return false;
              }
              
              // Carrier filter
              if (selectedCarrier && item.carrier !== selectedCarrier) {
                return false;
              }
              
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
    console.log('🔍 Filter applied, rooms:', filtered.rooms.length);
  }, [project, searchTerm, selectedRoom, selectedCategory, selectedVendor, selectedStatus, selectedCarrier]);

  if (!project) {
    return (
      <div className="text-center text-red-400 py-8 bg-red-900 m-4 p-4 rounded">
        <p className="text-lg">🚨 ExactWalkthroughSpreadsheet: NO PROJECT DATA</p>
      </div>
    );
  }

  if (!project.rooms || project.rooms.length === 0) {
    return (
      <div className="w-full p-4" style={{ backgroundColor: '#0F172A' }}>
        <div className="text-center text-yellow-400 py-8 bg-yellow-900 m-4 p-4 rounded">
          <p className="text-lg">📋 No Rooms Available</p>
          <p className="text-sm mt-2">This project has {project.rooms?.length || 0} rooms</p>
          <div className="mt-4">
            <button 
              onClick={onAddRoom}
              className="px-6 py-3 bg-amber-600 hover:bg-amber-700 text-[#B49B7E] rounded font-medium"
            >
              + ADD FIRST ROOM
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* SEARCH AND FILTER SECTION */}
      <div className="mb-6 p-4" style={{ backgroundColor: '#1E293B' }}>
        <div className="flex flex-wrap gap-4 items-end">
          {/* Search Input */}
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search Items, Vendors, SKUs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 rounded bg-gray-900/50 text-[#D4A574] border border-[#D4A574]/50 focus:border-[#D4A574] focus:outline-none placeholder-[#D4A574]/70"
            />
          </div>
          
          {/* Room Filter */}
          <div>
            <select 
              value={selectedRoom}
              onChange={(e) => setSelectedRoom(e.target.value)}
              className="px-3 py-2 rounded bg-gray-900/50 text-[#D4A574] border border-[#D4A574]/50 focus:border-[#D4A574] focus:outline-none"
            >
              <option value="">All Rooms</option>
              {project?.rooms?.map(room => (
                <option key={room.id} value={room.id}>{room.name}</option>
              ))}
            </select>
          </div>
          
          {/* Category Filter */}
          <div>
            <select 
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 rounded bg-gray-900/50 text-[#D4A574] border border-[#D4A574]/50 focus:border-[#D4A574] focus:outline-none"
            >
              <option value="">All Categories</option>
              {/* Categories populated here */}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select 
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-2 rounded bg-gray-900/50 text-[#D4A574] border border-[#D4A574]/50 focus:border-[#D4A574] focus:outline-none"
            >
              <option value="">All Status</option>
              {itemStatuses?.map(status => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* SPREADSHEET CONTAINER */}
      <div className="w-full overflow-x-auto" style={{ backgroundColor: '#0F172A', touchAction: 'pan-x' }}>
        <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch', minWidth: '1200px' }}>
          <div className="w-full" style={{ touchAction: 'pan-x pan-y' }}>
            <table className="w-full border-collapse border border-gray-400">
              <thead>
                <tr style={{ backgroundColor: '#1E293B' }}>
                  <th className="border border-gray-400 px-2 py-2 text-xs font-bold text-[#D4C5A9]" style={{ backgroundColor: '#4A5568' }}>ITEM</th>
                  <th className="border border-gray-400 px-2 py-2 text-xs font-bold text-[#D4C5A9]" style={{ backgroundColor: '#2D3748' }}>VENDOR</th>
                  <th className="border border-gray-400 px-2 py-2 text-xs font-bold text-[#D4C5A9]" style={{ backgroundColor: '#4A5568' }}>SKU</th>
                  <th className="border border-gray-400 px-2 py-2 text-xs font-bold text-[#D4C5A9]" style={{ backgroundColor: '#2D3748' }}>COST</th>
                  <th className="border border-gray-400 px-2 py-2 text-xs font-bold text-[#D4C5A9]" style={{ backgroundColor: '#4A5568' }}>QTY</th>
                  <th className="border border-gray-400 px-2 py-2 text-xs font-bold text-[#D4C5A9]" style={{ backgroundColor: '#2D3748' }}>STATUS</th>
                  <th className="border border-gray-400 px-2 py-2 text-xs font-bold text-[#D4C5A9]" style={{ backgroundColor: '#4A5568' }}>NOTES</th>
                </tr>
              </thead>
              <tbody>
                {filteredProject?.rooms?.map((room, roomIndex) => (
                  room.categories?.map((category, categoryIndex) => (
                    category.subcategories?.map((subcategory, subcategoryIndex) => (
                      subcategory.items?.map((item, itemIndex) => (
                        <tr key={item.id} style={{ 
                          background: itemIndex % 2 === 0 
                            ? 'linear-gradient(135deg, rgba(0, 0, 0, 0.95) 0%, rgba(30, 30, 30, 0.9) 30%, rgba(15, 15, 25, 0.95) 70%, rgba(0, 0, 0, 0.95) 100%)'
                            : 'linear-gradient(135deg, rgba(15, 15, 25, 0.95) 0%, rgba(45, 45, 55, 0.9) 30%, rgba(25, 25, 35, 0.95) 70%, rgba(15, 15, 25, 0.95) 100%)'
                        }}>
                          <td className="border border-gray-400 px-2 py-2 text-[#D4C5A9] text-sm">{item.name}</td>
                          <td className="border border-gray-400 px-2 py-2 text-[#D4C5A9] text-sm">{item.vendor}</td>
                          <td className="border border-gray-400 px-2 py-2 text-[#D4C5A9] text-sm">{item.sku}</td>
                          <td className="border border-gray-400 px-2 py-2 text-[#D4C5A9] text-sm">{item.cost}</td>
                          <td className="border border-gray-400 px-2 py-2 text-[#D4C5A9] text-sm">{item.quantity}</td>
                          <td className="border border-gray-400 px-2 py-2 text-sm">
                            <select 
                              value={item.status || ''} 
                              onChange={(e) => handleStatusChange(item.id, e.target.value)}
                              className="w-full bg-transparent border-0 text-[#D4C5A9] text-sm focus:outline-none"
                            >
                              <option value="">Select Status</option>
                              {itemStatuses.map(status => (
                                <option key={status} value={status}>{status}</option>
                              ))}
                            </select>
                          </td>
                          <td className="border border-gray-400 px-2 py-2 text-[#D4C5A9] text-sm">{item.notes}</td>
                        </tr>
                      ))
                    ))
                  ))
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ADD ITEM MODAL */}
      {showAddItem && (
        <AddItemModal
          isOpen={showAddItem}
          onClose={() => setShowAddItem(false)}
          selectedSubCategoryId={selectedSubCategoryId}
          onItemAdded={() => {
            setShowAddItem(false);
            onReload?.();
          }}
        />
      )}
    </div>
  );
};

export default ExactWalkthroughSpreadsheet;
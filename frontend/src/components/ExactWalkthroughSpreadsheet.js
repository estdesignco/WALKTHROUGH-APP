// WALKTHROUGH SPREADSHEET COMPONENT
// File: ExactWalkthroughSpreadsheet.js

import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
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
  const [selectedCarrier, setSelectedCarrier] = useState('');

  // STATUS AND CARRIER CHANGE HANDLERS
  const handleStatusChange = async (itemId, newStatus) => {
    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/items/${itemId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      
      if (response.ok) {
        window.location.reload();
      } else {
        const errorData = await response.text();
        alert(`Failed to update status: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      alert(`Error updating status: ${error.message}`);
    }
  };

  const handleCarrierChange = async (itemId, newCarrier) => {
    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/items/${itemId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ carrier: newCarrier })
      });
      
      if (response.ok) {
        window.location.reload();
      } else {
        alert(`Failed to update carrier: ${response.status}`);
      }
    } catch (error) {
      alert(`Error updating carrier: ${error.message}`);
    }
  };

  // FILTERS LOGIC
  useEffect(() => {
    if (!project) {
      setFilteredProject(null);
      return;
    }

    let filtered = { ...project };
    
    if (selectedRoom) {
      filtered.rooms = filtered.rooms.filter(room => room.id === selectedRoom);
    }

    // Apply search and other filters...
    setFilteredProject(filtered);
  }, [project, searchTerm, selectedRoom, selectedCategory, selectedVendor, selectedStatus, selectedCarrier]);

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
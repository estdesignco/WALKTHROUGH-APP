// CHECKLIST SPREADSHEET COMPONENT
// File: SimpleChecklistSpreadsheet.js

import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import AddItemModal from './AddItemModal';
import CanvaIntegrationModal from './CanvaIntegrationModal';

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
  const [checkedItems, setCheckedItems] = useState(new Set());
  const [availableCategories, setAvailableCategories] = useState([]);
  const [expandedRooms, setExpandedRooms] = useState({});
  const [expandedCategories, setExpandedCategories] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRoom, setSelectedRoom] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedVendor, setSelectedVendor] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [filteredProject, setFilteredProject] = useState(project);
  const [showCanvaModal, setShowCanvaModal] = useState(false);

  // APPLY FILTERS - ENHANCED COMBINATION FILTER LOGIC
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

  // STATUS CHANGE HANDLERS
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
        alert(`Failed to update status: ${response.status}`);
      }
    } catch (error) {
      alert(`Error updating status: ${error.message}`);
    }
  };

  // SCRAPING HANDLER
  const handleScrapeProduct = async (item) => {
    if (!item.url) {
      alert('No URL provided for scraping');
      return;
    }

    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/scrape-product`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: item.url, item_id: item.id })
      });

      if (response.ok) {
        const scrapedData = await response.json();
        console.log('Scraped data:', scrapedData);
        alert('Product scraped successfully! Reloading page...');
        window.location.reload();
      } else {
        const errorData = await response.text();
        alert(`Scraping failed: ${response.status} ${response.statusText}\n${errorData}`);
      }
    } catch (error) {
      alert(`Scraping error: ${error.message}`);
    }
  };

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
                  <th className="border border-gray-400 px-2 py-2 text-xs font-bold text-[#D4C5A9]" style={{ backgroundColor: '#4A5568' }}>✓</th>
                  <th className="border border-gray-400 px-2 py-2 text-xs font-bold text-[#D4C5A9]" style={{ backgroundColor: '#2D3748' }}>IMAGE</th>
                  <th className="border border-gray-400 px-2 py-2 text-xs font-bold text-[#D4C5A9]" style={{ backgroundColor: '#4A5568' }}>ITEM</th>
                  <th className="border border-gray-400 px-2 py-2 text-xs font-bold text-[#D4C5A9]" style={{ backgroundColor: '#2D3748' }}>VENDOR</th>
                  <th className="border border-gray-400 px-2 py-2 text-xs font-bold text-[#D4C5A9]" style={{ backgroundColor: '#4A5568' }}>SKU</th>
                  <th className="border border-gray-400 px-2 py-2 text-xs font-bold text-[#D4C5A9]" style={{ backgroundColor: '#2D3748' }}>SIZE</th>
                  <th className="border border-gray-400 px-2 py-2 text-xs font-bold text-[#D4C5A9]" style={{ backgroundColor: '#4A5568' }}>FINISH/COLOR</th>
                  <th className="border border-gray-400 px-2 py-2 text-xs font-bold text-[#D4C5A9]" style={{ backgroundColor: '#2D3748' }}>COST</th>
                  <th className="border border-gray-400 px-2 py-2 text-xs font-bold text-[#D4C5A9]" style={{ backgroundColor: '#4A5568' }}>STATUS</th>
                  <th className="border border-gray-400 px-2 py-2 text-xs font-bold text-[#D4C5A9]" style={{ backgroundColor: '#2D3748' }}>SCRAPE</th>
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
                          {/* Checkbox */}
                          <td className="border border-gray-400 px-2 py-2 text-center">
                            <input 
                              type="checkbox" 
                              checked={checkedItems.has(item.id)} 
                              onChange={(e) => {
                                const newChecked = new Set(checkedItems);
                                if (e.target.checked) {
                                  newChecked.add(item.id);
                                } else {
                                  newChecked.delete(item.id);
                                }
                                setCheckedItems(newChecked);
                              }}
                              className="w-4 h-4"
                            />
                          </td>
                          
                          {/* Image */}
                          <td className="border border-gray-400 px-2 py-2 text-center">
                            {item.image_url ? (
                              <img 
                                src={item.image_url} 
                                alt={item.name} 
                                className="w-12 h-12 object-cover rounded"
                                onError={(e) => { e.target.style.display = 'none'; }}
                              />
                            ) : (
                              <div className="w-12 h-12 bg-gray-600 rounded flex items-center justify-center text-xs text-[#D4C5A9]">No Img</div>
                            )}
                          </td>
                          
                          {/* Item Name */}
                          <td className="border border-gray-400 px-2 py-2 text-[#D4C5A9] text-sm">{item.name}</td>
                          
                          {/* Vendor */}
                          <td className="border border-gray-400 px-2 py-2 text-[#D4C5A9] text-sm">{item.vendor}</td>
                          
                          {/* SKU */}
                          <td className="border border-gray-400 px-2 py-2 text-[#D4C5A9] text-sm">{item.sku}</td>
                          
                          {/* Size */}
                          <td className="border border-gray-400 px-2 py-2 text-[#D4C5A9] text-sm">{item.size || '-'}</td>
                          
                          {/* Finish/Color */}
                          <td className="border border-gray-400 px-2 py-2 text-[#D4C5A9] text-sm">{item.finish_color || '-'}</td>
                          
                          {/* Cost */}
                          <td className="border border-gray-400 px-2 py-2 text-[#D4C5A9] text-sm">{item.cost}</td>
                          
                          {/* Status */}
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
                          
                          {/* Scrape Button */}
                          <td className="border border-gray-400 px-2 py-2 text-center">
                            <button
                              onClick={() => handleScrapeProduct(item)}
                              disabled={!item.url}
                              className={`px-2 py-1 text-xs rounded ${
                                item.url 
                                  ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                                  : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                              }`}
                            >
                              🔍
                            </button>
                          </td>
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

      {/* CANVA MODAL */}
      {showCanvaModal && (
        <CanvaIntegrationModal
          isOpen={showCanvaModal}
          onClose={() => setShowCanvaModal(false)}
          checkedItems={Array.from(checkedItems)}
        />
      )}
    </div>
  );
};

export default SimpleChecklistSpreadsheet;
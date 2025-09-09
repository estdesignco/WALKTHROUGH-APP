import React, { useState } from 'react';
import AddItemModal from './AddItemModal';

const SimpleSpreadsheet = ({ 
  project, 
  roomColors, 
  categoryColors, 
  itemStatuses,
  vendorTypes = [],
  carrierTypes = [],
  onDeleteRoom, 
  onReload
}) => {
  const [showAddItem, setShowAddItem] = useState(false);
  const [selectedSubCategoryId, setSelectedSubCategoryId] = useState(null);

  const handleAddItem = async (itemData) => {
    if (!selectedSubCategoryId) {
      alert('❌ No subcategory selected');
      return;
    }

    try {
      const backendUrl = import.meta.env?.REACT_APP_BACKEND_URL || process.env.REACT_APP_BACKEND_URL;
      
      const newItem = {
        ...itemData,
        subcategory_id: selectedSubCategoryId,
        id: `item-${Date.now()}`, // Generate temporary ID
      };

      console.log('🔥 Adding item to backend:', newItem);

      const response = await fetch(`${backendUrl}/api/items`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newItem)
      });

      if (response.ok) {
        console.log('✅ Item added successfully');
        alert(`✅ ITEM ADDED SUCCESSFULLY!\nName: ${itemData.name}\nVendor: ${itemData.vendor}\nCost: $${itemData.cost}`);
        setShowAddItem(false);
        setSelectedSubCategoryId(null);
        
        // Reload project data if available
        if (onReload) {
          await onReload();
        }
      } else {
        throw new Error(`HTTP ${response.status}: ${await response.text()}`);
      }
    } catch (error) {
      console.error('❌ Error adding item:', error);
      alert('❌ Failed to add item: ' + error.message);
    }
  };
  if (!project || !project.rooms) {
    return (
      <div className="bg-neutral-900 rounded-lg p-8 text-center">
        <p className="text-neutral-300">No project data available</p>
      </div>
    );
  }

  return (
    <div className="bg-neutral-900 rounded-lg overflow-hidden shadow-lg">
      <h2 className="text-white p-4 text-xl font-bold">
        🎉 SPREADSHEET IS WORKING! Project: {project.name}
      </h2>
      
      {/* HORIZONTAL SCROLLING CONTAINER - COMPLETELY REBUILT */}
      <div 
        className="relative w-full border border-neutral-600"
        style={{ 
          height: '60vh',
          overflow: 'hidden'
        }}
      >
        <div
          className="w-full h-full"
          style={{
            overflowX: 'scroll',
            overflowY: 'scroll', 
            scrollBehavior: 'smooth',
            WebkitOverflowScrolling: 'touch',
            msOverflowStyle: 'scrollbar',
            scrollbarWidth: 'thin'
          }}
          onWheel={(e) => {
            // Allow all scrolling - don't interfere
            e.stopPropagation();
          }}
        >
        <table 
          className="border-collapse bg-neutral-800"
          style={{ 
            minWidth: '4000px', // Force horizontal scroll
            width: '4000px'
          }}
        >
          <thead>
            <tr className="bg-neutral-700">
              <th className="p-3 text-custom-gold border border-neutral-600 min-w-[200px]">Item Name</th>
              <th className="p-3 text-custom-gold border border-neutral-600 min-w-[150px]">Vendor</th>
              <th className="p-3 text-custom-gold border border-neutral-600 min-w-[80px]">QTY</th>
              <th className="p-3 text-custom-gold border border-neutral-600 min-w-[120px]">Size</th>
              <th className="p-3 text-custom-gold border border-neutral-600 min-w-[150px]">Status</th>
              <th className="p-3 text-custom-gold border border-neutral-600 min-w-[120px]">Finish/Color</th>
              <th className="p-3 text-custom-gold border border-neutral-600 min-w-[100px]">Cost</th>
              <th className="p-3 text-custom-gold border border-neutral-600 min-w-[200px]">Link</th>
              <th className="p-3 text-custom-gold border border-neutral-600 min-w-[100px]">Image</th>
              <th className="p-3 text-custom-gold border border-neutral-600 min-w-[150px]">Delivery</th>
              <th className="p-3 text-custom-gold border border-neutral-600 min-w-[120px]">Install Date</th>
              <th className="p-3 text-custom-gold border border-neutral-600 min-w-[150px]">Tracking</th>
              <th className="p-3 text-custom-gold border border-neutral-600 min-w-[100px]">Carrier</th>
              <th className="p-3 text-custom-gold border border-neutral-600 min-w-[120px]">Order Date</th>
              <th className="p-3 text-custom-gold border border-neutral-600 min-w-[200px]">Notes</th>
              <th className="p-3 text-custom-gold border border-neutral-600 min-w-[80px]">Delete</th>
            </tr>
          </thead>
          <tbody>
            {/* Test Row */}
            <tr className="bg-green-800">
              <td className="p-3 text-white border border-neutral-600 font-bold">✅ SCROLLING TEST ROW</td>
              <td className="p-3 text-white border border-neutral-600">Use 2 fingers</td>
              <td className="p-3 text-white border border-neutral-600">on Mac</td>
              <td className="p-3 text-white border border-neutral-600">trackpad</td>
              <td className="p-3 text-white border border-neutral-600">to scroll</td>
              <td className="p-3 text-white border border-neutral-600">horizontally</td>
              <td className="p-3 text-white border border-neutral-600">left/right</td>
              <td className="p-3 text-white border border-neutral-600">across this</td>
              <td className="p-3 text-white border border-neutral-600">wide table</td>
              <td className="p-3 text-white border border-neutral-600">to see</td>
              <td className="p-3 text-white border border-neutral-600">all the</td>
              <td className="p-3 text-white border border-neutral-600">columns</td>
              <td className="p-3 text-white border border-neutral-600">properly</td>
              <td className="p-3 text-white border border-neutral-600">working</td>
              <td className="p-3 text-white border border-neutral-600">on Mac!</td>
              <td className="p-3 text-white border border-neutral-600">🎉</td>
            </tr>
            
            {/* Actual Data */}
            {project.rooms.map((room) => (
              <React.Fragment key={room.id}>
                {/* Room Header */}
                <tr>
                  <td 
                    colSpan="16" 
                    className="p-4 text-center font-bold text-white text-lg border border-neutral-600"
                    style={{ backgroundColor: '#8E4EC6' }}
                  >
                    🏠 {room.name.toUpperCase()}
                  </td>
                </tr>
                
                {/* Categories */}
                {room.categories && room.categories.map((category) => (
                  <React.Fragment key={category.id}>
                    <tr>
                      <td 
                        colSpan="16" 
                        className="p-3 text-center font-medium text-white border border-neutral-600"
                        style={{ backgroundColor: '#0b4e38' }}
                      >
                        📁 {category.name.toUpperCase()}
                      </td>
                    </tr>
                    
                    {/* Subcategories & Items */}
                    {category.subcategories && category.subcategories.map((subcategory) => (
                      <React.Fragment key={subcategory.id}>
                        <tr>
                          <td 
                            colSpan="16" 
                            className="p-2 text-center font-medium text-white border border-neutral-600"
                            style={{ backgroundColor: '#b43535' }}
                          >
                            📋 {subcategory.name.toUpperCase()}
                            <div className="mt-2">
                              <button
                                onClick={() => {
                                  setSelectedSubCategoryId(subcategory.id);
                                  setShowAddItem(true);
                                }}
                                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded text-sm font-bold"
                              >
                                ➕ ADD ITEM (Test Scraping!)
                              </button>
                            </div>
                          </td>
                        </tr>
                        
                        {/* Items */}
                        {subcategory.items && subcategory.items.map((item) => (
                          <tr key={item.id} className="bg-neutral-800 hover:bg-neutral-700">
                            <td className="p-3 text-white border border-neutral-600">{item.name || 'Unnamed Item'}</td>
                            <td className="p-3 text-white border border-neutral-600">{item.vendor || 'No Vendor'}</td>
                            <td className="p-3 text-white border border-neutral-600">{item.quantity || '1'}</td>
                            <td className="p-3 text-white border border-neutral-600">{item.size || 'N/A'}</td>
                            <td className="p-3 text-white border border-neutral-600">{item.status || 'TBD'}</td>
                            <td className="p-3 text-white border border-neutral-600">{item.finish_color || 'N/A'}</td>
                            <td className="p-3 text-white border border-neutral-600">${item.cost || '0'}</td>
                            <td className="p-3 text-white border border-neutral-600">
                              {item.link && (
                                <a href={item.link} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300">
                                  View Link
                                </a>
                              )}
                            </td>
                            <td className="p-3 text-white border border-neutral-600">
                              {item.image_url && (
                                <img src={item.image_url} alt={item.name} className="w-12 h-12 object-cover rounded" />
                              )}
                            </td>
                            <td className="p-3 text-white border border-neutral-600">{item.delivery_status || 'TBD'}</td>
                            <td className="p-3 text-white border border-neutral-600">{item.install_date || 'TBD'}</td>
                            <td className="p-3 text-white border border-neutral-600">{item.tracking || 'N/A'}</td>
                            <td className="p-3 text-white border border-neutral-600">{item.carrier || 'TBD'}</td>
                            <td className="p-3 text-white border border-neutral-600">{item.order_date || 'TBD'}</td>
                            <td className="p-3 text-white border border-neutral-600">{item.remarks || 'N/A'}</td>
                            <td className="p-3 text-white border border-neutral-600">
                              <button className="text-red-400 hover:text-red-300">🗑️</button>
                            </td>
                          </tr>
                        ))}
                      </React.Fragment>
                    ))}
                  </React.Fragment>
                ))}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
      
      <div className="p-4 text-center">
        <p className="text-neutral-400 text-sm">
          ✅ Mac-friendly horizontal scrolling enabled - Use 2-finger gestures on trackpad
        </p>
      </div>
      
      {/* ADD ITEM MODAL */}
      {showAddItem && (
        <AddItemModal
          onClose={() => {
            setShowAddItem(false);
            setSelectedSubCategoryId(null);
          }}
          onSubmit={handleAddItem}
          itemStatuses={['ORDERED', 'DELIVERED TO JOB SITE', 'INSTALLED']}
          vendorTypes={['Four Hands', 'Uttermost', 'Rowe Furniture', 'Regina Andrew']}
          loading={false}
        />
      )}
    </div>
  );
};

export default SimpleSpreadsheet;
import React, { useState, useEffect } from 'react';
import AddItemModal from './AddItemModal';

const ExactFFESpreadsheet = ({ 
  project, 
  roomColors, 
  categoryColors, 
  itemStatuses = [],
  vendorTypes = [],
  carrierTypes = [],
  onDeleteRoom, 
  onReload 
}) => {
  const [showAddItem, setShowAddItem] = useState(false);
  const [selectedSubCategoryId, setSelectedSubCategoryId] = useState(null);

  // Handle adding new items
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
        alert(`✅ ITEM ADDED!\nName: ${itemData.name}\nVendor: ${itemData.vendor}`);
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
      alert('❌ Failed to add item: ' + error.message);
    }
  };

  // MUTED COLORS FOR EACH ROOM - Much more subtle!
  const getRoomColor = (roomName) => {
    const roomColors = {
      'living room': '#6B7280',      // Muted Gray
      'dining room': '#7C2D12',      // Muted Brown-Red  
      'kitchen': '#78716C',          // Muted Stone
      'primary bedroom': '#6B7280',  // Muted Gray
      'primary bathroom': '#64748B', // Muted Slate
      'powder room': '#78716C',      // Muted Stone
      'guest room': '#71717A',       // Muted Zinc
      'office': '#6B7280',           // Muted Gray
      'laundry room': '#78716C',     // Muted Stone
      'mudroom': '#64748B',          // Muted Slate
      'family room': '#71717A',      // Muted Zinc
      'basement': '#52525B',         // Dark Muted Gray
      'attic storage': '#57534E',    // Dark Muted Stone
      'garage': '#3F3F46',           // Very Dark Muted
      'balcony': '#6B7280',          // Muted Gray
      'screened porch': '#78716C',   // Muted Stone
      'pool house': '#64748B',       // Muted Slate
      'guest house': '#71717A',      // Muted Zinc
      'butler\'s pantry': '#78716C', // Muted Stone
      'conservatory': '#6B7280',     // Muted Gray
      'formal living room': '#57534E', // Dark Muted Stone
      'great room': '#52525B',       // Dark Muted Gray
      'billiards room': '#3F3F46',   // Very Dark Muted
      'study': '#374151',            // Dark Gray
      'sitting room': '#475569'      // Dark Slate
    };
    return roomColors[roomName.toLowerCase()] || '#6B7280';
  };

  // MUTED category color
  const getCategoryColor = () => {
    return '#4B5563'; // Muted gray for categories
  };

  // MUTED header colors - much more subtle
  const getInstalledColor = () => '#525252';        // Muted Gray-600 
  const getAdditionalInfoColor = () => '#57534E';   // Muted Stone-600 
  const getShippingInfoColor = () => '#4C4C4C';     // Muted Gray-700
  const getNotesActionsColor = () => '#4B5563';     // Muted Gray-600

  if (!project || !project.rooms) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Loading FF&E Project...</h2>
      </div>
    );
  }

  return (
    <div className="w-full bg-white">
      
      {/* ONE CONTINUOUS SPREADSHEET - Exactly like your images */}
      <div className="w-full overflow-auto" style={{ height: '80vh' }}>
        <div style={{ minWidth: '2500px' }}>
          
          <table className="w-full border-collapse border border-gray-400">
            
            {/* EMPTY THEAD - Headers are now in tbody under subcategories */}
            <thead>
            </thead>
            
            <tbody>
              {/* HIERARCHICAL STRUCTURE AS ROW HEADERS - Like your images */}
              {project.rooms.map((room) => (
                <React.Fragment key={room.id}>
                  
                  {/* ROOM HEADER ROW - Different color for each room */}
                  <tr>
                    <td colSpan="15" 
                        className="border border-gray-400 px-3 py-2 text-white text-sm font-bold"
                        style={{ backgroundColor: getRoomColor(room.name) }}>
                      {room.name.toUpperCase()}
                    </td>
                  </tr>
                  
                  {/* ROOM CATEGORIES */}
                  {room.categories?.map((category) => (
                    <React.Fragment key={category.id}>
                      
                      {/* CATEGORY HEADER ROW */}
                      <tr>
                        <td colSpan="15" 
                            className="border border-gray-400 px-4 py-2 text-white text-sm font-bold"
                            style={{ backgroundColor: getCategoryColor() }}>
                          {category.name.toUpperCase()}
                        </td>
                      </tr>
                      
                      {/* SUBCATEGORIES */}
                      {category.subcategories?.map((subcategory) => (
                        <React.Fragment key={subcategory.id}>
                          
                          {/* NO SEPARATE SUBCATEGORY HEADER ROW - DELETED COMPLETELY */}
                          
                          {/* COLUMN HEADERS - INSTALLED replaces ITEM NAME */}
                          <tr>
                            <th className="border border-gray-400 px-2 py-2 text-left text-xs font-bold text-white min-w-[150px]" 
                                style={{ backgroundColor: getInstalledColor() }}>
                              {subcategory.name.toUpperCase()}
                            </th>
                            <th className="border border-gray-400 px-2 py-2 text-left text-xs font-bold text-white min-w-[120px]" 
                                style={{ backgroundColor: getInstalledColor() }}>
                              VENDOR/SKU
                            </th>
                            <th className="border border-gray-400 px-2 py-2 text-center text-xs font-bold text-white min-w-[50px]" 
                                style={{ backgroundColor: getInstalledColor() }}>
                              QTY
                            </th>
                            <th className="border border-gray-400 px-2 py-2 text-left text-xs font-bold text-white min-w-[80px]" 
                                style={{ backgroundColor: getInstalledColor() }}>
                              SIZE
                            </th>
                            <th className="border border-gray-400 px-2 py-2 text-left text-xs font-bold text-white min-w-[100px]" 
                                style={{ backgroundColor: getInstalledColor() }}>
                              ORDERS STATUS
                            </th>
                            
                            {/* ADDITIONAL INFO section header */}
                            <th className="border border-gray-400 px-2 py-1 text-xs font-bold text-white text-center" 
                                style={{ backgroundColor: getAdditionalInfoColor() }} colSpan="3">
                              ADDITIONAL INFO.
                            </th>
                            
                            {/* SHIPPING INFO section header */}
                            <th className="border border-gray-400 px-2 py-1 text-xs font-bold text-white text-center" 
                                style={{ backgroundColor: getShippingInfoColor() }} colSpan="5">
                              SHIPPING INFO.
                            </th>
                            
                            {/* NOTES and ACTIONS */}
                            <th className="border border-gray-400 px-2 py-2 text-left text-xs font-bold text-white min-w-[150px]" 
                                style={{ backgroundColor: getNotesActionsColor() }}>
                              NOTES
                            </th>
                            <th className="border border-gray-400 px-2 py-2 text-center text-xs font-bold text-white min-w-[80px]" 
                                style={{ backgroundColor: getNotesActionsColor() }}>
                              ACTIONS
                            </th>
                          </tr>
                          
                          {/* ROW 2: Individual column headers for ADDITIONAL INFO and SHIPPING INFO */}
                          <tr>
                            {/* Empty cells for red columns already defined above */}
                            <td className="border border-gray-400" style={{ backgroundColor: getItemNameColor() }}></td>
                            <td className="border border-gray-400" style={{ backgroundColor: getItemNameColor() }}></td>
                            <td className="border border-gray-400" style={{ backgroundColor: getItemNameColor() }}></td>
                            <td className="border border-gray-400" style={{ backgroundColor: getItemNameColor() }}></td>
                            <td className="border border-gray-400" style={{ backgroundColor: getItemNameColor() }}></td>
                            
                            {/* ADDITIONAL INFO columns */}
                            <th className="border border-gray-400 px-2 py-2 text-left text-xs font-bold text-white min-w-[100px]" 
                                style={{ backgroundColor: getAdditionalInfoColor() }}>
                              FINISH/Color
                            </th>
                            <th className="border border-gray-400 px-2 py-2 text-right text-xs font-bold text-white min-w-[80px]" 
                                style={{ backgroundColor: getAdditionalInfoColor() }}>
                              Cost/Price
                            </th>
                            <th className="border border-gray-400 px-2 py-2 text-center text-xs font-bold text-white min-w-[80px]" 
                                style={{ backgroundColor: getAdditionalInfoColor() }}>
                              Image
                            </th>
                            
                            {/* SHIPPING INFO columns with stacked headers */}
                            <th className="border border-gray-400 px-2 py-2 text-left text-xs font-bold text-white min-w-[120px]" 
                                style={{ backgroundColor: getShippingInfoColor() }}>
                              <div>Order Status / Est.</div>
                              <div>Ship Date / Est.</div>
                              <div>Delivery Date</div>
                            </th>
                            <th className="border border-gray-400 px-2 py-2 text-left text-xs font-bold text-white min-w-[120px]" 
                                style={{ backgroundColor: getShippingInfoColor() }}>
                              <div>Install Date /</div>
                              <div>Shipping TO</div>
                            </th>
                            <th className="border border-gray-400 px-2 py-2 text-left text-xs font-bold text-white min-w-[120px]" 
                                style={{ backgroundColor: getShippingInfoColor() }}>
                              TRACKING #
                            </th>
                            <th className="border border-gray-400 px-2 py-2 text-left text-xs font-bold text-white min-w-[80px]" 
                                style={{ backgroundColor: getShippingInfoColor() }}>
                              Carrier
                            </th>
                            <th className="border border-gray-400 px-2 py-2 text-left text-xs font-bold text-white min-w-[100px]" 
                                style={{ backgroundColor: getShippingInfoColor() }}>
                              Order Date
                            </th>
                            
                            {/* Empty cells for NOTES/ACTIONS */}
                            <td className="border border-gray-400" style={{ backgroundColor: getNotesActionsColor() }}></td>
                            <td className="border border-gray-400" style={{ backgroundColor: getNotesActionsColor() }}></td>
                          </tr>
                          
                          {/* DATA ROWS with FUNCTIONAL DROPDOWNS and DATE PICKERS */}
                          {subcategory.items?.map((item, itemIndex) => (
                            <tr key={`${subcategory.id}-${itemIndex}`} 
                                className="transition-colors"
                                style={{ 
                                  backgroundColor: itemIndex % 2 === 0 ? '#2D3748' : '#1A202C' 
                                }}>
                              
                              {/* ITEM NAME - Editable */}
                              <td className="border border-gray-400 px-2 py-2 text-sm">
                                <input 
                                  type="text"
                                  value={item.name || ''}
                                  className="w-full bg-transparent text-white border-none outline-none"
                                  placeholder="Item name..."
                                />
                              </td>
                              
                              {/* VENDOR/SKU - Editable */}
                              <td className="border border-gray-400 px-2 py-2 text-sm">
                                <input 
                                  type="text"
                                  value={item.vendor || ''}
                                  className="w-full bg-transparent text-white border-none outline-none"
                                  placeholder="Vendor/SKU..."
                                />
                              </td>
                              
                              {/* QTY - Number input */}
                              <td className="border border-gray-400 px-2 py-2 text-center text-sm">
                                <input 
                                  type="number"
                                  value={item.quantity || 1}
                                  className="w-full bg-transparent text-white border-none outline-none text-center"
                                  min="1"
                                />
                              </td>
                              
                              {/* SIZE - Editable */}
                              <td className="border border-gray-400 px-2 py-2 text-sm">
                                <input 
                                  type="text"
                                  value={item.size || ''}
                                  className="w-full bg-transparent text-white border-none outline-none"
                                  placeholder="Size..."
                                />
                              </td>
                              
                              {/* ORDERS STATUS - Dropdown */}
                              <td className="border border-gray-400 px-2 py-2 text-sm">
                                <select 
                                  value={item.status || 'PICKED'}
                                  className="w-full bg-yellow-400 text-black border-none outline-none rounded px-2 py-1 text-xs font-medium"
                                >
                                  <option value="PICKED" style={{ backgroundColor: '#FEF08A' }}>PICKED</option>
                                  <option value="ORDERED" style={{ backgroundColor: '#DBEAFE' }}>ORDERED</option>
                                  <option value="SHIPPED" style={{ backgroundColor: '#C7D2FE' }}>SHIPPED</option>
                                  <option value="DELIVERED TO RECEIVER" style={{ backgroundColor: '#D1FAE5' }}>DELIVERED TO RECEIVER</option>
                                  <option value="DELIVERED TO JOB SITE" style={{ backgroundColor: '#A7F3D0' }}>DELIVERED TO JOB SITE</option>
                                  <option value="INSTALLED" style={{ backgroundColor: '#6EE7B7' }}>INSTALLED</option>
                                  <option value="ON HOLD" style={{ backgroundColor: '#FCA5A5' }}>ON HOLD</option>
                                  <option value="BACKORDERED" style={{ backgroundColor: '#F87171' }}>BACKORDERED</option>
                                </select>
                              </td>
                              
                              {/* FINISH/Color */}
                              <td className="border border-gray-400 px-2 py-2 text-sm">
                                <input 
                                  type="text"
                                  value={item.finish_color || ''}
                                  className="w-full bg-transparent text-white border-none outline-none"
                                  placeholder="Finish/Color..."
                                />
                              </td>
                              
                              {/* Cost/Price */}
                              <td className="border border-gray-400 px-2 py-2 text-right text-sm">
                                <input 
                                  type="number"
                                  value={item.cost || ''}
                                  className="w-full bg-transparent text-white border-none outline-none text-right"
                                  placeholder="0.00"
                                  step="0.01"
                                />
                              </td>
                              
                              {/* Image */}
                              <td className="border border-gray-400 px-2 py-2 text-center">
                                {item.image_url ? (
                                  <img src={item.image_url} alt={item.name}
                                       className="w-12 h-12 object-cover rounded border border-gray-300 cursor-pointer"
                                       onClick={() => window.open(item.image_url, '_blank')}
                                  />
                                ) : (
                                  <button className="text-blue-400 text-xs underline">+ Image</button>
                                )}
                              </td>
                              
                              {/* Order Status / Est Ship Date / Est Delivery Date */}
                              <td className="border border-gray-400 px-2 py-2 text-sm">
                                <div className="space-y-1">
                                  <input type="date" className="w-full bg-gray-700 text-white text-xs rounded" />
                                  <input type="date" className="w-full bg-gray-700 text-white text-xs rounded" />
                                  <input type="date" className="w-full bg-gray-700 text-white text-xs rounded" />
                                </div>
                              </td>
                              
                              {/* Install Date / Shipping TO */}
                              <td className="border border-gray-400 px-2 py-2 text-sm">
                                <div className="space-y-1">
                                  <input type="date" className="w-full bg-gray-700 text-white text-xs rounded" />
                                  <input type="text" placeholder="Ship to..." className="w-full bg-gray-700 text-white text-xs rounded px-1" />
                                </div>
                              </td>
                              
                              {/* TRACKING # with live tracking */}
                              <td className="border border-gray-400 px-2 py-2 text-sm">
                                {item.tracking_number ? (
                                  <div>
                                    <input 
                                      type="text"
                                      value={item.tracking_number}
                                      className="w-full bg-gray-700 text-white text-xs rounded px-1 mb-1"
                                    />
                                    <button className="text-blue-400 text-xs underline">Track Live</button>
                                  </div>
                                ) : (
                                  <button className="text-blue-400 text-xs underline">Add Tracking #</button>
                                )}
                              </td>
                              
                              {/* Carrier - Dropdown */}
                              <td className="border border-gray-400 px-2 py-2 text-sm">
                                <select className="w-full bg-gray-700 text-white text-xs rounded">
                                  <option value="">Select...</option>
                                  <option value="FedEx">FedEx</option>
                                  <option value="UPS">UPS</option>
                                  <option value="Brooks">Brooks</option>
                                  <option value="Zenith">Zenith</option>
                                  <option value="Sunbelt">Sunbelt</option>
                                  <option value="DHL">DHL</option>
                                  <option value="USPS">USPS</option>
                                </select>
                              </td>
                              
                              {/* Order Date - Date picker */}
                              <td className="border border-gray-400 px-2 py-2 text-sm">
                                <input 
                                  type="date"
                                  value={item.order_date || ''}
                                  className="w-full bg-gray-700 text-white text-xs rounded"
                                />
                              </td>
                              
                              {/* NOTES */}
                              <td className="border border-gray-400 px-2 py-2 text-sm">
                                <textarea 
                                  value={item.notes || ''}
                                  className="w-full bg-gray-700 text-white text-xs rounded px-1 resize-none"
                                  placeholder="Notes..."
                                  rows="2"
                                />
                              </td>
                              
                              {/* ACTIONS */}
                              <td className="border border-gray-400 px-2 py-2 text-center">
                                <button className="text-red-400 hover:text-red-300 text-lg">
                                  🗑️
                                </button>
                              </td>
                            </tr>
                          ))}
                          
                          {/* ADD ITEM ROW */}
                          <tr>
                            <td colSpan="15" className="border border-gray-400 px-6 py-2 text-center">
                              <button
                                onClick={() => {
                                  setSelectedSubCategoryId(subcategory.id);
                                  setShowAddItem(true);
                                }}
                                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                              >
                                + Add Item
                              </button>
                            </td>
                          </tr>
                          
                        </React.Fragment>
                      ))}
                    </React.Fragment>
                  ))}
                </React.Fragment>
              ))}
            </tbody>
          </table>

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
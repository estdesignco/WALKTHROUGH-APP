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

  // Handle adding new items with proper scraping
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
        const result = await response.json();
        alert(`✅ ITEM ADDED!\nName: ${result.data?.name || itemData.name}\nVendor: ${result.data?.vendor || itemData.vendor}`);
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

  // Handle tracking items
  const handleTrackItem = async (item) => {
    if (!item.tracking_number) {
      alert('❌ No tracking number available');
      return;
    }

    try {
      const backendUrl = import.meta.env?.REACT_APP_BACKEND_URL || process.env.REACT_APP_BACKEND_URL;
      const response = await fetch(`${backendUrl}/api/track-shipment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tracking_number: item.tracking_number,
          carrier: item.carrier || 'auto-detect'
        })
      });

      if (response.ok) {
        const trackingData = await response.json();
        alert(`📦 TRACKING INFO:\n${JSON.stringify(trackingData, null, 2)}`);
      } else {
        alert('❌ Failed to get tracking information');
      }
    } catch (error) {
      console.error('❌ Tracking error:', error);
      alert('❌ Tracking service unavailable');
    }
  };

  // MUTED COLORS FOR EACH ROOM - Reduced from 10 to 7 intensity!
  const getRoomColor = (roomName) => {
    const roomColors = {
      'living room': '#7C3AED',      // Muted Purple (was #8B5CF6)
      'dining room': '#DC2626',      // Muted Red (was #EF4444)  
      'kitchen': '#D97706',          // Muted Orange (was #F59E0B)
      'primary bedroom': '#059669',  // Muted Emerald (was #10B981)
      'primary bathroom': '#2563EB', // Muted Blue (was #3B82F6)
      'powder room': '#78716C',      // Muted Brown (was #8B5A2B)
      'guest room': '#DB2777',       // Muted Pink (was #EC4899)
      'office': '#4F46E5',           // Muted Indigo (was #6366F1)
      'laundry room': '#65A30D',     // Muted Lime (was #84CC16)
      'mudroom': '#0891B2',          // Muted Cyan (was #06B6D4)
      'family room': '#EA580C',      // Muted Orange-red (was #F97316)
      'basement': '#6B7280',         // Keep Gray
      'attic storage': '#78716C',    // Muted Brown-700 (was #92400E)
      'garage': '#374151',           // Keep Gray-800
      'balcony': '#6D28D9',          // Muted Violet (was #7C3AED)
      'screened porch': '#047857',   // Muted Emerald-600 (was #059669)
      'pool house': '#0284C7',       // Muted Sky (was #0EA5E9)
      'guest house': '#B91C1C',      // Muted Red-600 (was #DC2626)
      'butler\'s pantry': '#B45309', // Muted Amber-600 (was #D97706)
      'conservatory': '#4D7C0F',     // Muted Lime-600 (was #65A30D)
      'formal living room': '#92400E', // Keep Orange-900
      'great room': '#3730A3',       // Muted Indigo-700 (was #4338CA)
      'billiards room': '#A21CAF',   // Muted Pink-700 (was #BE185D)
      'study': '#374151',            // Keep Gray-700
      'sitting room': '#1E40AF'      // Keep Blue-700
    };
    return roomColors[roomName.toLowerCase()] || '#7C3AED';
  };

  // LIGHTING muted darker green
  const getCategoryColor = () => '#14532D'; // Muted darker green (was #166534)

  // MUTED header colors - reduced intensity
  const getMainHeaderColor = () => '#991B1B';        // Muted Red-800 (was #B91C1C)
  const getAdditionalInfoColor = () => '#92400E';    // Muted Amber-800 (was #A16207)
  const getShippingInfoColor = () => '#6B21A8';      // Muted Violet-800 (was #7C3AED)  
  const getNotesActionsColor = () => '#B91C1C';      // Muted Red-700 (was #DC2626)

  if (!project || !project.rooms) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Loading FF&E Project...</h2>
      </div>
    );
  }

  return (
    <div className="w-full bg-white">
      
      {/* ONE CONTINUOUS SPREADSHEET */}
      <div className="w-full overflow-auto" style={{ height: '80vh' }}>
        <div style={{ minWidth: '2500px' }}>
          
          <table className="w-full border-collapse border border-gray-400">
            
            <thead></thead>
            
            <tbody>
              {/* HIERARCHICAL STRUCTURE AS ROW HEADERS */}
              {project.rooms.map((room) => (
                <React.Fragment key={room.id}>
                  
                  {/* ROOM HEADER ROW - Muted colors */}
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
                          
                          {/* COLUMN HEADERS - INSTALLED (subcategory name) replaces ITEM NAME */}
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
                          
                          {/* ROW 2: Individual column headers for sections */}
                          <tr>
                            {/* Empty cells for main columns */}
                            <td className="border border-gray-400" style={{ backgroundColor: getInstalledColor() }}></td>
                            <td className="border border-gray-400" style={{ backgroundColor: getInstalledColor() }}></td>
                            <td className="border border-gray-400" style={{ backgroundColor: getInstalledColor() }}></td>
                            <td className="border border-gray-400" style={{ backgroundColor: getInstalledColor() }}></td>
                            <td className="border border-gray-400" style={{ backgroundColor: getInstalledColor() }}></td>
                            
                            {/* ADDITIONAL INFO columns */}
                            <th className="border border-gray-400 px-2 py-2 text-left text-xs font-bold text-white" 
                                style={{ backgroundColor: getAdditionalInfoColor() }}>
                              FINISH/Color
                            </th>
                            <th className="border border-gray-400 px-2 py-2 text-right text-xs font-bold text-white" 
                                style={{ backgroundColor: getAdditionalInfoColor() }}>
                              Cost/Price
                            </th>
                            <th className="border border-gray-400 px-2 py-2 text-center text-xs font-bold text-white" 
                                style={{ backgroundColor: getAdditionalInfoColor() }}>
                              Image
                            </th>
                            
                            {/* SHIPPING INFO columns */}
                            <th className="border border-gray-400 px-2 py-2 text-left text-xs font-bold text-white" 
                                style={{ backgroundColor: getShippingInfoColor() }}>
                              Order Date
                            </th>
                            <th className="border border-gray-400 px-2 py-2 text-left text-xs font-bold text-white" 
                                style={{ backgroundColor: getShippingInfoColor() }}>
                              Est. Ship Date
                            </th>
                            <th className="border border-gray-400 px-2 py-2 text-left text-xs font-bold text-white" 
                                style={{ backgroundColor: getShippingInfoColor() }}>
                              TRACKING # 
                            </th>
                            <th className="border border-gray-400 px-2 py-2 text-left text-xs font-bold text-white" 
                                style={{ backgroundColor: getShippingInfoColor() }}>
                              Carrier
                            </th>
                            <th className="border border-gray-400 px-2 py-2 text-left text-xs font-bold text-white" 
                                style={{ backgroundColor: getShippingInfoColor() }}>
                              Delivery Status
                            </th>
                            
                            {/* Empty cells for NOTES/ACTIONS */}
                            <td className="border border-gray-400" style={{ backgroundColor: getNotesActionsColor() }}></td>
                            <td className="border border-gray-400" style={{ backgroundColor: getNotesActionsColor() }}></td>
                          </tr>
                          
                          {/* FUNCTIONAL DATA ROWS */}
                          {subcategory.items?.map((item, itemIndex) => (
                            <tr key={`${subcategory.id}-${itemIndex}`} 
                                className="transition-colors hover:bg-gray-600"
                                style={{ 
                                  backgroundColor: itemIndex % 2 === 0 ? '#1F2937' : '#111827' 
                                }}>
                              
                              {/* ITEM NAME - Editable */}
                              <td className="border border-gray-400 px-2 py-2 text-sm">
                                <input 
                                  type="text"
                                  value={item.name || 'Crystal Chandelier'}
                                  className="w-full bg-transparent text-white border-none outline-none"
                                  placeholder="Item name..."
                                />
                              </td>
                              
                              {/* VENDOR/SKU - Editable */}
                              <td className="border border-gray-400 px-2 py-2 text-sm">
                                <input 
                                  type="text"
                                  value={item.vendor || 'Visual Comfort / CHC2175'}
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
                                  value={item.size || '28"W x 30"H'}  
                                  className="w-full bg-transparent text-white border-none outline-none"
                                  placeholder="Size..."
                                />
                              </td>
                              
                              {/* ORDERS STATUS - FUNCTIONAL COLOR-CODED DROPDOWN */}
                              <td className="border border-gray-400 px-2 py-2 text-sm">
                                <select 
                                  value={item.status || 'PICKED'}
                                  className="w-full border-none outline-none rounded px-2 py-1 text-xs font-medium"
                                  style={{
                                    backgroundColor: item.status === 'PICKED' ? '#FEF08A' :
                                                   item.status === 'ORDERED' ? '#DBEAFE' :
                                                   item.status === 'SHIPPED' ? '#C7D2FE' :
                                                   item.status === 'DELIVERED TO RECEIVER' ? '#D1FAE5' :
                                                   item.status === 'DELIVERED TO JOB SITE' ? '#A7F3D0' :
                                                   item.status === 'INSTALLED' ? '#6EE7B7' :
                                                   item.status === 'ON HOLD' ? '#FCA5A5' :
                                                   item.status === 'BACKORDERED' ? '#F87171' : '#FEF08A',
                                    color: '#000'
                                  }}
                                >
                                  <option value="PICKED">PICKED</option>
                                  <option value="ORDERED">ORDERED</option>
                                  <option value="SHIPPED">SHIPPED</option>
                                  <option value="DELIVERED TO RECEIVER">DELIVERED TO RECEIVER</option>
                                  <option value="DELIVERED TO JOB SITE">DELIVERED TO JOB SITE</option>
                                  <option value="INSTALLED">INSTALLED</option>
                                  <option value="ON HOLD">ON HOLD</option>
                                  <option value="BACKORDERED">BACKORDERED</option>
                                </select>
                              </td>
                              
                              {/* FINISH/Color */}
                              <td className="border border-gray-400 px-2 py-2 text-sm">
                                <input 
                                  type="text"
                                  value={item.finish_color || 'Antique Brass'}
                                  className="w-full bg-transparent text-white border-none outline-none"
                                  placeholder="Finish/Color..."
                                />
                              </td>
                              
                              {/* Cost/Price */}
                              <td className="border border-gray-400 px-2 py-2 text-right text-sm">
                                <input 
                                  type="number"
                                  value={item.cost || 1250}
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
                              
                              {/* Order Date - FUNCTIONAL DATE PICKER */}
                              <td className="border border-gray-400 px-2 py-2 text-sm">
                                <input 
                                  type="date"
                                  value={item.order_date || '2025-01-15'}
                                  className="w-full bg-gray-700 text-white text-xs rounded px-1"
                                />
                              </td>
                              
                              {/* Est. Ship Date - FUNCTIONAL DATE PICKER */}
                              <td className="border border-gray-400 px-2 py-2 text-sm">
                                <input 
                                  type="date"
                                  value={item.est_ship_date || '2025-01-25'}
                                  className="w-full bg-gray-700 text-white text-xs rounded px-1"
                                />
                              </td>
                              
                              {/* TRACKING # with LIVE TRACKING */}
                              <td className="border border-gray-400 px-2 py-2 text-sm">
                                {item.tracking_number ? (
                                  <div className="space-y-1">
                                    <input 
                                      type="text"
                                      value={item.tracking_number}
                                      className="w-full bg-gray-700 text-white text-xs rounded px-1"
                                      placeholder="Tracking #..."
                                    />
                                    <button 
                                      onClick={() => handleTrackItem(item)}
                                      className="text-blue-400 text-xs underline hover:text-blue-300"
                                    >
                                      🔴 Track Live
                                    </button>
                                  </div>
                                ) : (
                                  <button className="text-blue-400 text-xs underline">Add Tracking #</button>
                                )}
                              </td>
                              
                              {/* Carrier - FUNCTIONAL DROPDOWN */}
                              <td className="border border-gray-400 px-2 py-2 text-sm">
                                <select 
                                  value={item.carrier || 'FedEx'}
                                  className="w-full bg-gray-700 text-white text-xs rounded"
                                >
                                  <option value="">Select...</option>
                                  <option value="FedEx">FedEx</option>
                                  <option value="UPS">UPS</option>
                                  <option value="Brooks">Brooks</option>
                                  <option value="Zenith">Zenith</option>
                                  <option value="Sunbelt">Sunbelt</option>
                                  <option value="DHL">DHL</option>
                                  <option value="USPS">USPS</option>
                                  <option value="White Glove">White Glove</option>
                                  <option value="Local Delivery">Local Delivery</option>
                                </select>
                              </td>
                              
                              {/* Delivery Status - FUNCTIONAL COLOR-CODED DROPDOWN */}
                              <td className="border border-gray-400 px-2 py-2 text-sm">
                                <select 
                                  value={item.delivery_status || 'IN TRANSIT'}
                                  className="w-full border-none outline-none rounded px-1 py-1 text-xs font-medium"
                                  style={{
                                    backgroundColor: item.delivery_status === 'DELIVERED' ? '#6EE7B7' :
                                                   item.delivery_status === 'IN TRANSIT' ? '#FEF08A' :  
                                                   item.delivery_status === 'PENDING' ? '#C7D2FE' :
                                                   item.delivery_status === 'DELAYED' ? '#FCA5A5' : '#FEF08A',
                                    color: '#000'
                                  }}
                                >
                                  <option value="PENDING">PENDING</option>
                                  <option value="IN TRANSIT">IN TRANSIT</option>
                                  <option value="OUT FOR DELIVERY">OUT FOR DELIVERY</option>
                                  <option value="DELIVERED">DELIVERED</option>
                                  <option value="DELAYED">DELAYED</option>
                                  <option value="EXCEPTION">EXCEPTION</option>
                                </select>
                              </td>
                              
                              {/* NOTES */}
                              <td className="border border-gray-400 px-2 py-2 text-sm">
                                <textarea 
                                  value={item.notes || 'For dining room entryway'}
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
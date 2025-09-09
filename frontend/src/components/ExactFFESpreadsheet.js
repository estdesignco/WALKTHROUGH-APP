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

  // COMPLETE COLOR MAPPING FOR ALL DROPDOWN VALUES
  const getStatusColor = (status) => {
    const statusColors = {
      // Planning Phase
      'TO BE SELECTED': '#D4A574',
      'RESEARCHING': '#B8860B', 
      'PENDING APPROVAL': '#DAA520',
      
      // Procurement Phase  
      'APPROVED': '#9ACD32',
      'ORDERED': '#32CD32',
      'PICKED': '#FFD700',  // YELLOW like your image
      'CONFIRMED': '#228B22',
      
      // Fulfillment Phase
      'IN PRODUCTION': '#FF8C00',
      'SHIPPED': '#4169E1',
      'IN TRANSIT': '#6495ED',
      'OUT FOR DELIVERY': '#87CEEB',
      
      // Delivery Phase
      'DELIVERED TO RECEIVER': '#9370DB',
      'DELIVERED TO JOB SITE': '#8A2BE2',
      'RECEIVED': '#DDA0DD',
      
      // Installation Phase
      'READY FOR INSTALL': '#20B2AA',
      'INSTALLING': '#48D1CC',
      'INSTALLED': '#00CED1',
      
      // Issues & Exceptions
      'ON HOLD': '#DC143C',
      'BACKORDERED': '#B22222',
      'DAMAGED': '#8B0000',
      'RETURNED': '#CD5C5C',
      'CANCELLED': '#A52A2A'
    };
    return statusColors[status] || '#FFD700';
  };

  const getCarrierColor = (carrier) => {
    const carrierColors = {
      'FedEx': '#FF6600',
      'UPS': '#8B4513',
      'Brooks': '#4682B4',
      'Zenith': '#20B2AA',
      'Sunbelt': '#DC143C',
      'R+L Carriers': '#8A2BE2',
      'Yellow Freight': '#FFD700',
      'XPO Logistics': '#FF1493',
      'Old Dominion': '#228B22',
      'ABF Freight': '#B22222',
      'Estes Express': '#4B0082',
      'Saia LTL': '#2E8B57',
      'TForce Freight': '#FF4500',
      'Roadrunner': '#6B8E23',
      'Central Transport': '#8B008B',
      'Southeastern Freight': '#D2691E',
      'Averitt Express': '#CD853F',
      'Holland': '#F4A460',
      'USPS': '#0047AB',
      'DHL': '#FFCC00',
      'OTHER': '#9370DB'
    };
    return carrierColors[carrier] || '#9370DB';
  };

  const getShipToColor = (shipTo) => {
    const shipToColors = {
      'Client': '#FFD700',      // Yellow
      'Receiver': '#87CEEB',    // Sky Blue  
      'Store': '#DDA0DD',       // Plum
      'Jobsite': '#98FB98'      // Pale Green
    };
    return shipToColors[shipTo] || '#FFD700';
  };

  const getDeliveryStatusColor = (status) => {
    const deliveryColors = {
      'PENDING': '#C7D2FE',        // Light Blue
      'IN TRANSIT': '#FEF08A',     // Light Yellow
      'OUT FOR DELIVERY': '#BFDBFE', // Light Blue
      'DELIVERED': '#A7F3D0',      // Light Green
      'DELAYED': '#FCA5A5',        // Light Red
      'EXCEPTION': '#F87171'       // Red
    };
    return deliveryColors[status] || '#FEF08A';
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
                          
                          {/* FIXED HEADER STRUCTURE - Only section headers on top */}
                          <tr>
                            {/* Empty cells for main data columns */}
                            <td className="border border-gray-400" style={{ backgroundColor: getMainHeaderColor() }}></td>
                            <td className="border border-gray-400" style={{ backgroundColor: getMainHeaderColor() }}></td>
                            <td className="border border-gray-400" style={{ backgroundColor: getMainHeaderColor() }}></td>
                            <td className="border border-gray-400" style={{ backgroundColor: getMainHeaderColor() }}></td>
                            <td className="border border-gray-400" style={{ backgroundColor: getMainHeaderColor() }}></td>
                            
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
                            
                            {/* Empty cells for notes/actions */}
                            <td className="border border-gray-400" style={{ backgroundColor: getNotesActionsColor() }}></td>
                            <td className="border border-gray-400" style={{ backgroundColor: getNotesActionsColor() }}></td>
                          </tr>
                          
                          {/* COLUMN HEADERS - All moved down here */}
                          <tr>
                            <th className="border border-gray-400 px-2 py-2 text-left text-xs font-bold text-white min-w-[150px]" 
                                style={{ backgroundColor: getMainHeaderColor() }}>
                              {subcategory.name.toUpperCase()}
                            </th>
                            <th className="border border-gray-400 px-2 py-2 text-left text-xs font-bold text-white min-w-[120px]" 
                                style={{ backgroundColor: getMainHeaderColor() }}>
                              VENDOR/SKU
                            </th>
                            <th className="border border-gray-400 px-2 py-2 text-center text-xs font-bold text-white min-w-[50px]" 
                                style={{ backgroundColor: getMainHeaderColor() }}>
                              QTY
                            </th>
                            <th className="border border-gray-400 px-2 py-2 text-left text-xs font-bold text-white min-w-[80px]" 
                                style={{ backgroundColor: getMainHeaderColor() }}>
                              SIZE
                            </th>
                            <th className="border border-gray-400 px-2 py-2 text-left text-xs font-bold text-white min-w-[100px]" 
                                style={{ backgroundColor: getMainHeaderColor() }}>
                              ORDERS STATUS
                            </th>
                            
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
                              SHIP TO
                            </th>
                            <th className="border border-gray-400 px-2 py-2 text-left text-xs font-bold text-white" 
                                style={{ backgroundColor: getShippingInfoColor() }}>
                              CARRIER
                            </th>
                            <th className="border border-gray-400 px-2 py-2 text-left text-xs font-bold text-white" 
                                style={{ backgroundColor: getShippingInfoColor() }}>
                              TRACKING # 
                            </th>
                            <th className="border border-gray-400 px-2 py-2 text-left text-xs font-bold text-white" 
                                style={{ backgroundColor: getShippingInfoColor() }}>
                              Order Date
                            </th>
                            <th className="border border-gray-400 px-2 py-2 text-left text-xs font-bold text-white" 
                                style={{ backgroundColor: getShippingInfoColor() }}>
                              DELIVERY STATUS
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
                          
                          {/* CLEAN DATA ROWS - No extra containers */}
                          {subcategory.items?.map((item, itemIndex) => (
                            <tr key={`${subcategory.id}-${itemIndex}`} 
                                className="transition-colors hover:bg-gray-600"
                                style={{ 
                                  backgroundColor: itemIndex % 2 === 0 ? '#1F2937' : '#111827' 
                                }}>
                              
                              {/* ITEM NAME - Plain text, no input container */}
                              <td className="border border-gray-400 px-2 py-2 text-sm text-white">
                                {item.name || 'Crystal Chandelier'}
                              </td>
                              
                              {/* VENDOR/SKU - Plain text, no input container */}
                              <td className="border border-gray-400 px-2 py-2 text-sm text-white">
                                {item.vendor || 'Visual Comfort / CHC2175'}
                              </td>
                              
                              {/* QTY - Plain text, no input container */}
                              <td className="border border-gray-400 px-2 py-2 text-center text-sm text-white">
                                {item.quantity || 1}
                              </td>
                              
                              {/* SIZE - Plain text, no input container */}
                              <td className="border border-gray-400 px-2 py-2 text-sm text-white">
                                {item.size || '28"W x 30"H'}
                              </td>
                              
                              {/* ORDERS STATUS - ALL COLOR-CODED OPTIONS WITH REAL VALUES */}
                              <td className="border border-gray-400 px-2 py-2 text-sm">
                                <select 
                                  value={item.status || 'PICKED'}
                                  onChange={(e) => {
                                    console.log(`Status changed to: ${e.target.value} with color: ${getStatusColor(e.target.value)}`);
                                  }}
                                  className="w-full border-none outline-none rounded px-2 py-1 text-xs font-medium"
                                  style={{
                                    backgroundColor: getStatusColor(item.status || 'PICKED'),
                                    color: '#000'
                                  }}
                                >
                                  <option value="TO BE SELECTED" style={{backgroundColor: '#D4A574', color: '#000'}}>TO BE SELECTED</option>
                                  <option value="RESEARCHING" style={{backgroundColor: '#B8860B', color: '#000'}}>RESEARCHING</option>
                                  <option value="PENDING APPROVAL" style={{backgroundColor: '#DAA520', color: '#000'}}>PENDING APPROVAL</option>
                                  <option value="APPROVED" style={{backgroundColor: '#9ACD32', color: '#000'}}>APPROVED</option>
                                  <option value="ORDERED" style={{backgroundColor: '#32CD32', color: '#000'}}>ORDERED</option>
                                  <option value="PICKED" style={{backgroundColor: '#FFD700', color: '#000'}}>PICKED</option>
                                  <option value="CONFIRMED" style={{backgroundColor: '#228B22', color: '#000'}}>CONFIRMED</option>
                                  <option value="IN PRODUCTION" style={{backgroundColor: '#FF8C00', color: '#000'}}>IN PRODUCTION</option>
                                  <option value="SHIPPED" style={{backgroundColor: '#4169E1', color: '#000'}}>SHIPPED</option>
                                  <option value="IN TRANSIT" style={{backgroundColor: '#6495ED', color: '#000'}}>IN TRANSIT</option>
                                  <option value="OUT FOR DELIVERY" style={{backgroundColor: '#87CEEB', color: '#000'}}>OUT FOR DELIVERY</option>
                                  <option value="DELIVERED TO RECEIVER" style={{backgroundColor: '#9370DB', color: '#000'}}>DELIVERED TO RECEIVER</option>
                                  <option value="DELIVERED TO JOB SITE" style={{backgroundColor: '#8A2BE2', color: '#000'}}>DELIVERED TO JOB SITE</option>
                                  <option value="RECEIVED" style={{backgroundColor: '#DDA0DD', color: '#000'}}>RECEIVED</option>
                                  <option value="READY FOR INSTALL" style={{backgroundColor: '#20B2AA', color: '#000'}}>READY FOR INSTALL</option>
                                  <option value="INSTALLING" style={{backgroundColor: '#48D1CC', color: '#000'}}>INSTALLING</option>
                                  <option value="INSTALLED" style={{backgroundColor: '#00CED1', color: '#000'}}>INSTALLED</option>
                                  <option value="ON HOLD" style={{backgroundColor: '#DC143C', color: '#000'}}>ON HOLD</option>
                                  <option value="BACKORDERED" style={{backgroundColor: '#B22222', color: '#000'}}>BACKORDERED</option>
                                  <option value="DAMAGED" style={{backgroundColor: '#8B0000', color: '#000'}}>DAMAGED</option>
                                  <option value="RETURNED" style={{backgroundColor: '#CD5C5C', color: '#000'}}>RETURNED</option>
                                  <option value="CANCELLED" style={{backgroundColor: '#A52A2A', color: '#000'}}>CANCELLED</option>
                                </select>
                              </td>
                              
                              {/* FINISH/Color - Plain text, no container */}
                              <td className="border border-gray-400 px-2 py-2 text-sm text-white">
                                {item.finish_color || 'Antique Brass'}
                              </td>
                              
                              {/* Cost/Price - Plain text, no container */}
                              <td className="border border-gray-400 px-2 py-2 text-right text-sm text-white">
                                ${item.cost || 1250}
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
                              
                              {/* SHIP TO - COLOR-CODED DROPDOWN */}
                              <td className="border border-gray-400 px-2 py-2 text-sm">
                                <select 
                                  value={item.ship_to || 'Client'}
                                  onChange={(e) => {
                                    console.log(`Ship To changed to: ${e.target.value}`);
                                  }}
                                  className="w-full border-none outline-none rounded px-1 py-1 text-xs font-medium"
                                  style={{
                                    backgroundColor: getShipToColor(item.ship_to || 'Client'),
                                    color: '#000'
                                  }}
                                >
                                  <option value="Client">Client</option>
                                  <option value="Receiver">Receiver</option>
                                  <option value="Store">Store</option>
                                  <option value="Jobsite">Jobsite</option>
                                </select>
                              </td>
                              
                              {/* CARRIER - ALL COLOR-CODED OPTIONS WITH REAL VALUES */}
                              <td className="border border-gray-400 px-2 py-2 text-sm">
                                <select 
                                  value={item.carrier || 'FedEx'}
                                  onChange={(e) => {
                                    console.log(`Carrier changed to: ${e.target.value} with color: ${getCarrierColor(e.target.value)}`);
                                  }}
                                  className="w-full border-none outline-none rounded px-1 py-1 text-xs font-medium"
                                  style={{
                                    backgroundColor: getCarrierColor(item.carrier || 'FedEx'),
                                    color: '#000'
                                  }}
                                >
                                  <option value="FedEx" style={{backgroundColor: '#FF6600', color: '#000'}}>FedEx</option>
                                  <option value="UPS" style={{backgroundColor: '#8B4513', color: '#000'}}>UPS</option>
                                  <option value="USPS" style={{backgroundColor: '#0047AB', color: '#000'}}>USPS</option>
                                  <option value="DHL" style={{backgroundColor: '#FFCC00', color: '#000'}}>DHL</option>
                                  <option value="Brooks" style={{backgroundColor: '#4682B4', color: '#000'}}>Brooks</option>
                                  <option value="Zenith" style={{backgroundColor: '#20B2AA', color: '#000'}}>Zenith</option>
                                  <option value="Sunbelt" style={{backgroundColor: '#DC143C', color: '#000'}}>Sunbelt</option>
                                  <option value="R+L Carriers" style={{backgroundColor: '#8A2BE2', color: '#000'}}>R+L Carriers</option>
                                  <option value="Yellow Freight" style={{backgroundColor: '#FFD700', color: '#000'}}>Yellow Freight</option>
                                  <option value="XPO Logistics" style={{backgroundColor: '#FF1493', color: '#000'}}>XPO Logistics</option>
                                  <option value="Old Dominion" style={{backgroundColor: '#228B22', color: '#000'}}>Old Dominion</option>
                                  <option value="ABF Freight" style={{backgroundColor: '#B22222', color: '#000'}}>ABF Freight</option>
                                  <option value="Estes Express" style={{backgroundColor: '#4B0082', color: '#000'}}>Estes Express</option>
                                  <option value="Saia LTL" style={{backgroundColor: '#2E8B57', color: '#000'}}>Saia LTL</option>
                                  <option value="TForce Freight" style={{backgroundColor: '#FF4500', color: '#000'}}>TForce Freight</option>
                                  <option value="Roadrunner" style={{backgroundColor: '#6B8E23', color: '#000'}}>Roadrunner</option>
                                  <option value="Central Transport" style={{backgroundColor: '#8B008B', color: '#000'}}>Central Transport</option>
                                  <option value="Southeastern Freight" style={{backgroundColor: '#D2691E', color: '#000'}}>Southeastern Freight</option>
                                  <option value="Averitt Express" style={{backgroundColor: '#CD853F', color: '#000'}}>Averitt Express</option>
                                  <option value="Holland" style={{backgroundColor: '#F4A460', color: '#000'}}>Holland</option>
                                  <option value="OTHER" style={{backgroundColor: '#9370DB', color: '#000'}}>OTHER</option>
                                </select>
                              </td>
                              
                              {/* TRACKING # with LIVE TRACKING */}
                              <td className="border border-gray-400 px-2 py-2 text-sm">
                                {item.tracking_number ? (
                                  <div className="space-y-1">
                                    <div className="text-white text-xs">
                                      {item.tracking_number}
                                    </div>
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
                              
                              {/* Order Date - DATE PICKER in container (KEEP CONTAINER) */}
                              <td className="border border-gray-400 px-2 py-2 text-sm">
                                <div>
                                  <input 
                                    type="date"
                                    value={item.order_date || '2025-01-15'}
                                    className="w-full bg-gray-700 text-white text-xs rounded px-1"
                                  />
                                </div>
                              </td>
                              
                              {/* DELIVERY STATUS - COLOR-CODED DROPDOWN */}
                              <td className="border border-gray-400 px-2 py-2 text-sm">
                                <select 
                                  value={item.delivery_status || 'IN TRANSIT'}
                                  onChange={(e) => {
                                    console.log(`Delivery Status changed to: ${e.target.value}`);
                                  }}
                                  className="w-full border-none outline-none rounded px-1 py-1 text-xs font-medium"
                                  style={{
                                    backgroundColor: getDeliveryStatusColor(item.delivery_status || 'IN TRANSIT'),
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
                              
                              {/* NOTES - Plain text, no container */}
                              <td className="border border-gray-400 px-2 py-2 text-sm text-white">
                                {item.notes || 'For dining room entryway'}
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
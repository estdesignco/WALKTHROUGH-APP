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

  // EXACT COLORS FROM YOUR IMAGES - More precise muted colors
  const getRoomColor = (roomName) => {
    const roomColors = {
      'living room': '#A49AA4',      // Exact muted purple from your living room
      'dining room': '#9AA49A',      // Exact muted green for dining room  
      'kitchen': '#A4A09A',          // Exact muted beige for kitchen
      'primary bedroom': '#9A9AA4',  // Exact muted blue-gray for primary bedroom
      'primary bathroom': '#A4A49A', // Exact muted olive for primary bathroom
      'powder room': '#A0A4A0',      // Exact muted sage for powder room
      'guest room': '#A0A0A4',       // Exact muted lavender for guest room
      'office': '#A4A0A0',           // Exact muted tan for office
      'laundry room': '#A0A0A4',     // Exact muted light purple for laundry
      'mudroom': '#A0A4A0'           // Exact muted light green for mudroom
    };
    return roomColors[roomName.toLowerCase()] || '#A49AA4';
  };

  const getCategoryColor = () => {
    return '#9AA49A'; // Exact muted green from your LIGHTING category
  };

  const getSubcategoryColor = () => {
    return '#A4A09A'; // Exact muted beige from your INSTALLED/PORTABLE subcategories
  };

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
            
            {/* HEADERS RIGHT ABOVE THE DATA - EXACTLY LIKE YOUR IMAGES */}
            <thead>
              {/* Individual column headers FIRST */}
              <tr>
                <th className="border border-gray-400 px-2 py-2 text-left text-xs font-bold text-white min-w-[150px]" 
                    style={{ backgroundColor: '#B85A5A' }}>
                  ITEM NAME
                </th>
                <th className="border border-gray-400 px-2 py-2 text-left text-xs font-bold text-white min-w-[120px]" 
                    style={{ backgroundColor: '#B85A5A' }}>
                  VENDOR/SKU
                </th>
                <th className="border border-gray-400 px-2 py-2 text-center text-xs font-bold text-white min-w-[50px]" 
                    style={{ backgroundColor: '#B85A5A' }}>
                  QTY
                </th>
                <th className="border border-gray-400 px-2 py-2 text-left text-xs font-bold text-white min-w-[80px]" 
                    style={{ backgroundColor: '#B85A5A' }}>
                  SIZE
                </th>
                <th className="border border-gray-400 px-2 py-2 text-left text-xs font-bold text-white min-w-[100px]" 
                    style={{ backgroundColor: '#B85A5A' }}>
                  ORDERS STATUS
                </th>
                <th className="border border-gray-400 px-2 py-2 text-left text-xs font-bold text-white min-w-[100px]" 
                    style={{ backgroundColor: '#8B6F47' }}>
                  FINISH/Color
                </th>
                <th className="border border-gray-400 px-2 py-2 text-right text-xs font-bold text-white min-w-[80px]" 
                    style={{ backgroundColor: '#8B6F47' }}>
                  Cost/Price
                </th>
                <th className="border border-gray-400 px-2 py-2 text-center text-xs font-bold text-white min-w-[80px]" 
                    style={{ backgroundColor: '#8B6F47' }}>
                  Image
                </th>
                <th className="border border-gray-400 px-2 py-2 text-left text-xs font-bold text-white min-w-[120px]" 
                    style={{ backgroundColor: '#7A6B9A' }}>
                  <div>Order Status / Est.</div>
                  <div>Ship Date / Est.</div>
                  <div>Delivery Date</div>
                </th>
                <th className="border border-gray-400 px-2 py-2 text-left text-xs font-bold text-white min-w-[120px]" 
                    style={{ backgroundColor: '#7A6B9A' }}>
                  <div>Install Date /</div>
                  <div>Shipping TO</div>
                </th>
                <th className="border border-gray-400 px-2 py-2 text-left text-xs font-bold text-white min-w-[120px]" 
                    style={{ backgroundColor: '#7A6B9A' }}>
                  TRACKING #
                </th>
                <th className="border border-gray-400 px-2 py-2 text-left text-xs font-bold text-white min-w-[80px]" 
                    style={{ backgroundColor: '#7A6B9A' }}>
                  Carrier
                </th>
                <th className="border border-gray-400 px-2 py-2 text-left text-xs font-bold text-white min-w-[100px]" 
                    style={{ backgroundColor: '#7A6B9A' }}>
                  Order Date
                </th>
                <th className="border border-gray-400 px-2 py-2 text-left text-xs font-bold text-white min-w-[150px]" 
                    style={{ backgroundColor: '#B85A5A' }}>
                  NOTES
                </th>
                <th className="border border-gray-400 px-2 py-2 text-center text-xs font-bold text-white min-w-[80px]" 
                    style={{ backgroundColor: '#B85A5A' }}>
                  ACTIONS
                </th>
              </tr>
              
              {/* Section headers RIGHT ABOVE THE DATA - Like your images */}
              <tr>
                <th className="border border-gray-400 px-2 py-1 text-xs font-bold text-white text-center" 
                    style={{ backgroundColor: '#8B6F47' }} colSpan="8">
                  ADDITIONAL INFO.
                </th>
                <th className="border border-gray-400 px-2 py-1 text-xs font-bold text-white text-center" 
                    style={{ backgroundColor: '#7A6B9A' }} colSpan="5">
                  SHIPPING INFO.
                </th>
                <th className="border border-gray-400 px-2 py-1 text-xs font-bold text-white text-center" 
                    style={{ backgroundColor: '#B85A5A' }} colSpan="2">
                  
                </th>
              </tr>
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
                          
                          {/* SUBCATEGORY HEADER ROW */}
                          <tr>
                            <td colSpan="15" 
                                className="border border-gray-400 px-5 py-1 text-white text-xs font-bold"
                                style={{ backgroundColor: getSubcategoryColor() }}>
                              {subcategory.name.toUpperCase()}
                            </td>
                          </tr>
                          
                          {/* ITEMS ROWS with alternating colors */}
                          {subcategory.items?.map((item, itemIndex) => (
                            <tr key={`${subcategory.id}-${itemIndex}`} 
                                className={`${itemIndex % 2 === 0 ? 'bg-gray-50' : 'bg-white'} hover:bg-gray-100 transition-colors`}>
                              
                              <td className="border border-gray-400 px-2 py-2 text-sm">
                                {item.name || ''}
                              </td>
                              <td className="border border-gray-400 px-2 py-2 text-sm">
                                {item.vendor || ''}
                              </td>
                              <td className="border border-gray-400 px-2 py-2 text-center text-sm">
                                {item.quantity || 1}
                              </td>
                              <td className="border border-gray-400 px-2 py-2 text-sm">
                                {item.size || ''}
                              </td>
                              <td className="border border-gray-400 px-2 py-2 text-sm">
                                <span className="px-2 py-1 rounded text-xs font-medium"
                                      style={{ 
                                        backgroundColor: item.status === 'PICKED' ? '#FEF3C7' : 
                                                        item.status === 'ORDERED' ? '#DBEAFE' :
                                                        item.status === 'DELIVERED TO JOB SITE' ? '#D1FAE5' : '#F3F4F6'
                                      }}>
                                  {item.status || 'PICKED'}
                                </span>
                              </td>
                              <td className="border border-gray-400 px-2 py-2 text-sm">
                                {item.finish_color || ''}
                              </td>
                              <td className="border border-gray-400 px-2 py-2 text-right text-sm">
                                {item.cost ? `$${item.cost}` : ''}
                              </td>
                              <td className="border border-gray-400 px-2 py-2 text-center">
                                {item.image_url ? (
                                  <img src={item.image_url} alt={item.name}
                                       className="w-12 h-12 object-cover rounded border border-gray-300"
                                       onClick={() => window.open(item.image_url, '_blank')}
                                  />
                                ) : (
                                  <button className="text-blue-600 text-xs">+ Image</button>
                                )}
                              </td>
                              <td className="border border-gray-400 px-2 py-2 text-sm">
                                {item.carrier || ''}
                              </td>
                              <td className="border border-gray-400 px-2 py-2 text-sm">
                                {item.tracking_number || (
                                  <span className="text-blue-600 text-xs cursor-pointer">Add Tracking #</span>
                                )}
                              </td>
                              <td className="border border-gray-400 px-2 py-2 text-sm">
                                {item.order_date || ''}
                              </td>
                              <td className="border border-gray-400 px-2 py-2 text-sm">
                                {item.expected_delivery || ''}
                              </td>
                              <td className="border border-gray-400 px-2 py-2 text-sm">
                                {item.install_date || ''}
                              </td>
                              <td className="border border-gray-400 px-2 py-2 text-sm">
                                {item.notes || ''}
                              </td>
                              <td className="border border-gray-400 px-2 py-2 text-center">
                                <button className="text-red-600 hover:text-red-800 text-xs">
                                  Delete
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
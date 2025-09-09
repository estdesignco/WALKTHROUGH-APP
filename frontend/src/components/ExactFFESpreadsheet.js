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
                          
                          {/* SUBCATEGORY HEADER ROW */}
                          <tr>
                            <td colSpan="15" 
                                className="border border-gray-400 px-5 py-1 text-white text-xs font-bold"
                                style={{ backgroundColor: getSubcategoryColor() }}>
                              {subcategory.name.toUpperCase()}
                            </td>
                          </tr>
                          
                          {/* EXACT STRUCTURE FROM YOUR SCREENSHOTS */}
                          
                          {/* RED COLUMN HEADERS - ITEM NAME through ORDERS STATUS */}
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
                            
                            {/* BROWN SECTION HEADER spanning brown columns */}
                            <th className="border border-gray-400 px-2 py-1 text-xs font-bold text-white text-center" 
                                style={{ backgroundColor: '#8B6F47' }} colSpan="3">
                              ADDITIONAL INFO.
                            </th>
                            
                            {/* PURPLE SECTION HEADER spanning purple columns */}
                            <th className="border border-gray-400 px-2 py-1 text-xs font-bold text-white text-center" 
                                style={{ backgroundColor: '#7A6B9A' }} colSpan="5">
                              SHIPPING INFO.
                            </th>
                            
                            {/* RED SECTION - NOTES, ACTIONS */}
                            <th className="border border-gray-400 px-2 py-2 text-left text-xs font-bold text-white min-w-[150px]" 
                                style={{ backgroundColor: '#B85A5A' }}>
                              NOTES
                            </th>
                            <th className="border border-gray-400 px-2 py-2 text-center text-xs font-bold text-white min-w-[80px]" 
                                style={{ backgroundColor: '#B85A5A' }}>
                              ACTIONS
                            </th>
                          </tr>
                          
                          {/* SECOND ROW - Individual column headers for brown and purple sections */}
                          <tr>
                            {/* Empty cells for red columns already defined above */}
                            <td className="border border-gray-400" style={{ backgroundColor: '#B85A5A' }}></td>
                            <td className="border border-gray-400" style={{ backgroundColor: '#B85A5A' }}></td>
                            <td className="border border-gray-400" style={{ backgroundColor: '#B85A5A' }}></td>
                            <td className="border border-gray-400" style={{ backgroundColor: '#B85A5A' }}></td>
                            <td className="border border-gray-400" style={{ backgroundColor: '#B85A5A' }}></td>
                            
                            {/* BROWN columns */}
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
                            
                            {/* PURPLE columns with stacked headers */}
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
                            
                            {/* Empty cells for red NOTES/ACTIONS already defined above */}
                            <td className="border border-gray-400" style={{ backgroundColor: '#B85A5A' }}></td>
                            <td className="border border-gray-400" style={{ backgroundColor: '#B85A5A' }}></td>
                          </tr>
                          
                          {/* DATA ROWS with subtle dark alternating colors */}
                          {subcategory.items?.map((item, itemIndex) => (
                            <tr key={`${subcategory.id}-${itemIndex}`} 
                                className="transition-colors"
                                style={{ 
                                  backgroundColor: itemIndex % 2 === 0 ? '#2D3748' : '#1A202C' 
                                }}>
                              
                              <td className="border border-gray-400 px-2 py-2 text-sm text-white">
                                {item.name || ''}
                              </td>
                              <td className="border border-gray-400 px-2 py-2 text-sm text-white">
                                {item.vendor || ''}
                              </td>
                              <td className="border border-gray-400 px-2 py-2 text-center text-sm text-white">
                                {item.quantity || 1}
                              </td>
                              <td className="border border-gray-400 px-2 py-2 text-sm text-white">
                                {item.size || ''}
                              </td>
                              <td className="border border-gray-400 px-2 py-2 text-sm">
                                <span className="px-2 py-1 rounded text-xs font-medium"
                                      style={{ 
                                        backgroundColor: item.status === 'PICKED' ? '#FEF08A' : 
                                                        item.status === 'ORDERED' ? '#DBEAFE' :
                                                        item.status === 'DELIVERED TO JOB SITE' ? '#D1FAE5' : '#F3F4F6',
                                        color: '#000'
                                      }}>
                                  {item.status || 'PICKED'}
                                </span>
                              </td>
                              <td className="border border-gray-400 px-2 py-2 text-sm text-white">
                                {item.finish_color || ''}
                              </td>
                              <td className="border border-gray-400 px-2 py-2 text-right text-sm text-white">
                                {item.cost ? `$${item.cost}` : ''}
                              </td>
                              <td className="border border-gray-400 px-2 py-2 text-center">
                                {item.image_url ? (
                                  <img src={item.image_url} alt={item.name}
                                       className="w-12 h-12 object-cover rounded border border-gray-300"
                                       onClick={() => window.open(item.image_url, '_blank')}
                                  />
                                ) : (
                                  <button className="text-blue-400 text-xs">+ Image</button>
                                )}
                              </td>
                              <td className="border border-gray-400 px-2 py-2 text-sm text-white">
                                {/* Shipping status info */}
                              </td>
                              <td className="border border-gray-400 px-2 py-2 text-sm text-white">
                                {/* Install date / Shipping TO */}
                              </td>
                              <td className="border border-gray-400 px-2 py-2 text-sm text-white">
                                {item.tracking_number || (
                                  <span className="text-blue-400 text-xs cursor-pointer underline">Add Tracking #</span>
                                )}
                              </td>
                              <td className="border border-gray-400 px-2 py-2 text-sm text-white">
                                {item.carrier || ''}
                              </td>
                              <td className="border border-gray-400 px-2 py-2 text-sm text-white">
                                {item.order_date || ''}
                              </td>
                              <td className="border border-gray-400 px-2 py-2 text-sm text-white">
                                {item.notes || ''}
                              </td>
                              <td className="border border-gray-400 px-2 py-2 text-center">
                                <button className="text-red-400 hover:text-red-300 text-xs">
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
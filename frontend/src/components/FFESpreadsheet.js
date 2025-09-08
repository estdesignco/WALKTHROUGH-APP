import React, { useState } from 'react';
import { itemAPI } from '../App';
import AddSubCategoryModal from './AddSubCategoryModal';
import AddItemModal from './AddItemModal';

const FFESpreadsheet = ({ 
  project, 
  roomColors, 
  categoryColors, 
  itemStatuses,
  vendorTypes = [],
  carrierTypes = [],
  onDeleteRoom, 
  onReload,
  isOffline 
}) => {
  const [showAddSubCategory, setShowAddSubCategory] = useState(false);
  const [showAddItem, setShowAddItem] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);
  const [selectedSubCategoryId, setSelectedSubCategoryId] = useState(null);
  const [loading, setLoading] = useState(false);

  // EXACT colors from your screenshots - even more muted
  const getRoomColor = (roomName) => {
    const mutedColors = {
      'living room': '#7A5A8A',  // Purple like your screenshot
      'kitchen': '#5A6A5A',      
      'master bedroom': '#6A5A7A', 
      'bedroom 2': '#7A5A5A',    
      'bedroom 3': '#5A6A6A',
      'bathroom': '#5A5A7A',     
      'master bathroom': '#6A4A4A', 
      'powder room': '#4A6A6A',  
      'dining room': '#7A6A8A',     
      'office': '#4A5A5A',          
      'family room': '#5A6A8A',     
      'basement': '#8A7A5A',        
      'laundry room': '#4A4A6A',    
      'mudroom': '#5A6A4A',         
      'pantry': '#8A8A5A',          
      'closet': '#6A7A6A',          
      'guest room': '#8A5A7A',      
      'playroom': '#8A8A5A',        
      'library': '#4A6A8A',         
      'wine cellar': '#4A4A6A',     
      'garage': '#6A7A4A',          
      'patio': '#7A7A5A'            
    };
    return mutedColors[roomName.toLowerCase()] || '#6A6A6A';
  };

  // GREEN for categories (like LIGHTING)
  const getCategoryColor = (categoryName) => {
    return '#5A7A5A'; // Muted green like your screenshot
  };

  // RED for sub-categories (like INSTALLED) - BRIGHTER red
  const getSubCategoryColor = (subCategoryName) => {
    return '#B91C1C'; // Brighter red like your screenshot
  };

  const handleAddSubCategory = async (subCategoryData) => {
    try {
      setLoading(true);
      const newSubCategory = {
        ...subCategoryData,
        category_id: selectedCategoryId,
        order_index: 0
      };
      
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/subcategories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSubCategory)
      });
      
      if (response.ok) {
        await onReload();
        setShowAddSubCategory(false);
        setSelectedCategoryId(null);
      }
    } catch (err) {
      console.error('Error creating subcategory:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddItem = async (itemData) => {
    try {
      setLoading(true);
      const newItem = {
        ...itemData,
        subcategory_id: selectedSubCategoryId
      };
      
      await itemAPI.create(newItem);
      await onReload();
      setShowAddItem(false);
      setSelectedSubCategoryId(null);
    } catch (err) {
      console.error('Error creating item:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteItem = async (itemId) => {
    if (!window.confirm('Are you sure you want to delete this item?')) {
      return;
    }
    
    try {
      setLoading(true);
      await itemAPI.delete(itemId);
      await onReload();
    } catch (err) {
      console.error('Error deleting item:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateItem = async (itemId, updateData) => {
    try {
      await itemAPI.update(itemId, updateData);
      await onReload();
    } catch (err) {
      console.error('Error updating item:', err);
    }
  };

  const getStatusColor = (status) => {
    // Even more muted status colors
    const colors = {
      'PICKED': '#A69A5A',      // More muted yellow
      'ORDERED': '#5A6A8A',     // More muted blue
      'SHIPPED': '#A06A5A',     // More muted orange
      'DELIVERED': '#5A8A6A',   // More muted green
      'INSTALLED': '#6A8A6A',   // More muted bright green
      'PARTIALLY_DELIVERED': '#7A6A8A', // More muted purple
      'ON_HOLD': '#8A5A5A',     // More muted red
      'CANCELLED': '#6A6A6A'    // More muted gray
    };
    return colors[status] || '#6A6A6A';
  };

  if (project.rooms.length === 0) {
    return (
      <div className="bg-gray-800 rounded-xl p-12 text-center">
        <div className="text-6xl mb-4">🏠</div>
        <h3 className="text-xl font-semibold text-gray-200 mb-2">No Rooms Added</h3>
        <p className="text-gray-400 mb-6">Start by adding rooms to organize your FF&E items</p>
      </div>
    );
  }

  return (
    <div className="bg-neutral-900 rounded-lg overflow-hidden shadow-lg">
      {/* Horizontal Scrollable Container */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[3200px] border-collapse" style={{ tableLayout: 'fixed' }}>
          {/* NO HEADER ROW - Headers go on the red subcategory lines as per your requirements */}
          <tbody>
            {project.rooms.map((room) => (
              <React.Fragment key={room.id}>
                {/* 1. ROOM Header Row - PURPLE like LIVING ROOM - CENTERED */}
                <tr>
                  <td 
                    colSpan="13" 
                    className="p-4 font-bold text-white text-lg border border-neutral-600 fit-text text-center"
                    style={{ backgroundColor: getRoomColor(room.name) }}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <span></span>
                      <span>{room.name.toUpperCase()}</span>
                      <div className="flex space-x-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteRoom(room.id);
                          }}
                          className="bg-neutral-800 bg-opacity-50 hover:bg-opacity-70 text-white px-2 py-1 rounded text-sm"
                          title="Delete Room"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  </td>
                </tr>

                {/* 2. CATEGORIES for this room - GREEN like LIGHTING - CENTERED */}
                {room.categories.map((category) => (
                  <React.Fragment key={category.id}>
                    <tr>
                      <td 
                        colSpan="13" 
                        className="p-3 font-semibold text-white text-md border border-neutral-600 fit-text text-center"
                        style={{ backgroundColor: getCategoryColor(category.name) }}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <span></span>
                          <span>{category.name.toUpperCase()}</span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedCategoryId(category.id);
                              setShowAddSubCategory(true);
                            }}
                            className="bg-neutral-800 bg-opacity-50 hover:bg-opacity-70 text-white px-2 py-1 rounded text-xs"
                            title="Add Sub-Category"
                          >
                            ➕ Section
                          </button>
                        </div>
                      </td>
                    </tr>

                    {/* 3. SUB-CATEGORIES with MULTI-SECTION HEADERS - EXACTLY like your screenshots */}
                    {category.subcategories?.map((subcategory) => (
                      <React.Fragment key={subcategory.id}>
                        {/* FIRST ROW: Section Headers - RED + BROWN + PURPLE */}
                        <tr>
                          {/* RED SECTION - INSTALLED (spans 5 columns) */}
                          <td 
                            colSpan="5"
                            className="p-2 font-semibold text-white text-sm border border-neutral-600 fit-text text-center"
                            style={{ backgroundColor: getSubCategoryColor(subcategory.name) }}
                          >
                            <div className="flex items-center justify-between">
                              <span></span>
                              <span>{subcategory.name.toUpperCase()}</span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedSubCategoryId(subcategory.id);
                                  setShowAddItem(true);
                                }}
                                className="bg-neutral-800 bg-opacity-50 hover:bg-opacity-70 text-white px-2 py-1 rounded text-xs"
                                title="Add Item"
                              >
                                ➕ Item
                              </button>
                            </div>
                          </td>
                          {/* BROWN SECTION - ADDITIONAL INFO (spans 3 columns) */}
                          <td 
                            colSpan="3"
                            className="p-2 font-semibold text-white text-sm border border-neutral-600 fit-text text-center"
                            style={{ backgroundColor: '#92400E' }}
                          >
                            ADDITIONAL INFO.
                          </td>
                          {/* PURPLE SECTION - SHIPPING INFO (spans 5 columns) */}
                          <td 
                            colSpan="5"
                            className="p-2 font-semibold text-white text-sm border border-neutral-600 fit-text text-center"
                            style={{ backgroundColor: '#6B46C1' }}
                          >
                            SHIPPING INFO.
                          </td>
                        </tr>
                        
                        {/* SECOND ROW: Column Headers - Each in their section's color */}
                        <tr>
                          {/* RED SECTION COLUMNS */}
                          <td 
                            className="w-32 p-2 font-semibold text-white text-sm border border-neutral-600 fit-text text-center"
                            style={{ backgroundColor: getSubCategoryColor(subcategory.name) }}
                          >
                            ITEM NAME
                          </td>
                          <td 
                            className="w-32 p-2 font-semibold text-white text-sm border border-neutral-600 fit-text text-center"
                            style={{ backgroundColor: getSubCategoryColor(subcategory.name) }}
                          >
                            VENDOR/SKU
                          </td>
                          <td 
                            className="w-16 p-2 font-semibold text-white text-sm border border-neutral-600 fit-text text-center"
                            style={{ backgroundColor: getSubCategoryColor(subcategory.name) }}
                          >
                            QTY
                          </td>
                          <td 
                            className="w-24 p-2 font-semibold text-white text-sm border border-neutral-600 fit-text text-center"
                            style={{ backgroundColor: getSubCategoryColor(subcategory.name) }}
                          >
                            SIZE
                          </td>
                          <td 
                            className="w-32 p-2 font-semibold text-white text-sm border border-neutral-600 fit-text text-center"
                            style={{ backgroundColor: getSubCategoryColor(subcategory.name) }}
                          >
                            ORDERS STATUS
                          </td>
                          
                          {/* BROWN SECTION COLUMNS */}
                          <td 
                            className="w-32 p-2 font-semibold text-white text-sm border border-neutral-600 fit-text text-center"
                            style={{ backgroundColor: '#92400E' }}
                          >
                            FINISH/Color
                          </td>
                          <td 
                            className="w-32 p-2 font-semibold text-white text-sm border border-neutral-600 fit-text text-center"
                            style={{ backgroundColor: '#92400E' }}
                          >
                            Cost/Price
                          </td>
                          <td 
                            className="w-24 p-2 font-semibold text-white text-sm border border-neutral-600 fit-text text-center"
                            style={{ backgroundColor: '#92400E' }}
                          >
                            Image
                          </td>
                          
                          {/* PURPLE SECTION COLUMNS */}
                          <td 
                            className="w-32 p-2 font-semibold text-white text-xs border border-neutral-600 fit-text text-center"
                            style={{ backgroundColor: '#6B46C1' }}
                          >
                            Order Status / Est.<br/>Ship Date / Est.<br/>Delivery Date
                          </td>
                          <td 
                            className="w-32 p-2 font-semibold text-white text-xs border border-neutral-600 fit-text text-center"
                            style={{ backgroundColor: '#6B46C1' }}
                          >
                            Install Date /<br/>Shipping TO
                          </td>
                          <td 
                            className="w-32 p-2 font-semibold text-white text-sm border border-neutral-600 fit-text text-center"
                            style={{ backgroundColor: '#6B46C1' }}
                          >
                            TRACKING #
                          </td>
                          <td 
                            className="w-24 p-2 font-semibold text-white text-sm border border-neutral-600 fit-text text-center"
                            style={{ backgroundColor: '#6B46C1' }}
                          >
                            Carrier
                          </td>
                          <td 
                            className="w-24 p-2 font-semibold text-white text-sm border border-neutral-600 fit-text text-center"
                            style={{ backgroundColor: '#6B46C1' }}
                          >
                            Order Date
                          </td>
                        </tr>

                        {/* 4. ITEMS for this sub-category */}
                        {subcategory.items?.map((item, itemIndex) => (
                          <FFEItemRow
                            key={item.id}
                            item={item}
                            itemIndex={itemIndex}
                            onUpdate={handleUpdateItem}
                            onDelete={handleDeleteItem}
                            getStatusColor={getStatusColor}
                            itemStatuses={itemStatuses}
                            vendorTypes={vendorTypes}
                            carrierTypes={carrierTypes}
                            isOffline={isOffline}
                          />
                        ))}

                        {/* Empty state for sub-category */}
                        {(!subcategory.items || subcategory.items.length === 0) && (
                          <tr>
                            <td colSpan="13" className="p-4 text-center text-neutral-400 border border-neutral-600" style={{ backgroundColor: '#2A2A2A' }}>
                              No items in {subcategory.name.toLowerCase()}. 
                              <button
                                onClick={() => {
                                  setSelectedSubCategoryId(subcategory.id);
                                  setShowAddItem(true);
                                }}
                                className="ml-2 text-neutral-300 hover:text-neutral-200 underline"
                              >
                                Add first item
                              </button>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    )) || (
                      <tr>
                        <td colSpan="13" className="p-4 text-center text-neutral-400 border border-neutral-600" style={{ backgroundColor: '#2A2A2A' }}>
                          No sections in {category.name.toLowerCase()}. 
                          <button
                            onClick={() => {
                              setSelectedCategoryId(category.id);
                              setShowAddSubCategory(true);
                            }}
                            className="ml-2 text-neutral-300 hover:text-neutral-200 underline"
                          >
                            Add first section
                          </button>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}

                {/* Empty state for room */}
                {room.categories.length === 0 && (
                  <tr>
                    <td colSpan="13" className="p-8 text-center text-neutral-400 border border-neutral-600" style={{ backgroundColor: '#2A2A2A' }}>
                      <p>No categories in this room.</p>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modals */}
      {showAddSubCategory && (
        <AddSubCategoryModal
          onClose={() => {
            setShowAddSubCategory(false);
            setSelectedCategoryId(null);
          }}
          onSubmit={handleAddSubCategory}
          loading={loading}
        />
      )}

      {showAddItem && (
        <AddItemModal
          onClose={() => {
            setShowAddItem(false);
            setSelectedSubCategoryId(null);
          }}
          onSubmit={handleAddItem}
          itemStatuses={itemStatuses}
          loading={loading}
        />
      )}
    </div>
  );
};

// Individual Item Row Component - matching your exact layout
const FFEItemRow = ({ 
  item, 
  itemIndex, 
  onUpdate, 
  onDelete, 
  getStatusColor, 
  itemStatuses,
  vendorTypes = [],
  carrierTypes = [],
  isOffline 
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    name: item.name,
    vendor: item.vendor || '',
    quantity: item.quantity,
    size: item.size || '',
    status: item.status,
    finish_color: item.finish_color || '',
    cost: item.cost || 0,
    image_url: item.image_url || '',
    order_status: item.order_status || '',
    install_date: item.install_date || '',
    tracking_number: item.tracking_number || '',
    carrier: item.carrier || '',
    order_date: item.order_date || ''
  });

  const handleSave = async () => {
    try {
      await onUpdate(item.id, editData);
      setIsEditing(false);
    } catch (err) {
      console.error('Error updating item:', err);
    }
  };

  const handleCancel = () => {
    setEditData({
      name: item.name,
      vendor: item.vendor || '',
      quantity: item.quantity,
      size: item.size || '',
      status: item.status,
      finish_color: item.finish_color || '',
      cost: item.cost || 0,
      image_url: item.image_url || '',
      order_status: item.order_status || '',
      install_date: item.install_date || '',
      tracking_number: item.tracking_number || '',
      carrier: item.carrier || '',
      order_date: item.order_date || ''
    });
    setIsEditing(false);
  };

  // Alternating row colors - MORE BLACK/CHARCOAL as requested
  const bgColor = itemIndex % 2 === 0 ? '#1F2937' : '#374151';

  return (
    <tr style={{ backgroundColor: bgColor }} className="text-neutral-200 text-sm">
      {/* RED SECTION - Core Item Info */}
      
      {/* Item Name */}
      <td className="p-2 border border-neutral-600 fit-text">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            {isEditing ? (
              <input
                type="text"
                value={editData.name}
                onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                className="w-full bg-neutral-800 text-neutral-200 px-2 py-1 rounded text-sm border border-neutral-600"
              />
            ) : (
              <span className="font-medium">{item.name}</span>
            )}
          </div>
          {/* Actions in the first column */}
          <div className="flex space-x-1 ml-2">
            {isEditing ? (
              <>
                <button
                  onClick={handleSave}
                  className="bg-green-700 hover:bg-green-600 text-neutral-200 px-1 py-0.5 rounded text-xs"
                  disabled={isOffline}
                  title="Save"
                >
                  ✓
                </button>
                <button
                  onClick={handleCancel}
                  className="bg-neutral-600 hover:bg-neutral-500 text-neutral-200 px-1 py-0.5 rounded text-xs"
                  title="Cancel"
                >
                  ✕
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setIsEditing(true)}
                  className="bg-neutral-600 hover:bg-neutral-500 text-neutral-200 px-1 py-0.5 rounded text-xs"
                  title="Edit Item"
                >
                  ✏️
                </button>
                <button
                  onClick={() => onDelete(item.id)}
                  className="bg-red-700 hover:bg-red-600 text-neutral-200 px-1 py-0.5 rounded text-xs"
                  title="Delete Item"
                  disabled={isOffline}
                >
                  🗑️
                </button>
              </>
            )}
          </div>
        </div>
      </td>

      {/* Vendor/SKU */}
      <td className="p-2 border border-neutral-600 fit-text">
        {isEditing ? (
          <select
            value={editData.vendor}
            onChange={(e) => setEditData({ ...editData, vendor: e.target.value })}
            className="w-full bg-neutral-800 text-neutral-200 px-2 py-1 rounded text-sm border border-neutral-600"
          >
            <option value="">Select Vendor</option>
            {vendorTypes.map(vendor => (
              <option key={vendor} value={vendor}>
                {vendor}
              </option>
            ))}
          </select>
        ) : (
          <span>{item.vendor || '-'}</span>
        )}
      </td>

      {/* Quantity */}
      <td className="p-2 border border-neutral-600 text-center fit-text">
        {isEditing ? (
          <input
            type="number"
            value={editData.quantity}
            onChange={(e) => setEditData({ ...editData, quantity: parseInt(e.target.value) || 1 })}
            className="w-full bg-neutral-800 text-neutral-200 px-2 py-1 rounded text-sm border border-neutral-600"
            min="1"
          />
        ) : (
          <span>{item.quantity}</span>
        )}
      </td>

      {/* Size */}
      <td className="p-2 border border-neutral-600 fit-text">
        {isEditing ? (
          <input
            type="text"
            value={editData.size}
            onChange={(e) => setEditData({ ...editData, size: e.target.value })}
            className="w-full bg-neutral-800 text-neutral-200 px-2 py-1 rounded text-sm border border-neutral-600"
          />
        ) : (
          <span>{item.size || '-'}</span>
        )}
      </td>

      {/* Orders Status */}
      <td className="p-2 border border-neutral-600 fit-text">
        {isEditing ? (
          <select
            value={editData.status}
            onChange={(e) => setEditData({ ...editData, status: e.target.value })}
            className="w-full bg-neutral-800 text-neutral-200 px-2 py-1 rounded text-sm border border-neutral-600"
          >
            {itemStatuses.map(status => (
              <option key={status} value={status}>
                {status.replace('_', ' ')}
              </option>
            ))}
          </select>
        ) : (
          <select
            value={item.status}
            onChange={(e) => onUpdate(item.id, { status: e.target.value })}
            className="w-full bg-neutral-800 text-neutral-200 px-2 py-1 rounded text-sm border border-neutral-600"
            style={{ 
              backgroundColor: getStatusColor(item.status),
              color: '#2A2A2A'
            }}
          >
            {itemStatuses.map(status => (
              <option key={status} value={status}>
                {status.replace('_', ' ')}
              </option>
            ))}
          </select>
        )}
      </td>

      {/* BROWN SECTION - Additional Info */}
      
      {/* Finish/Color */}
      <td className="p-2 border border-neutral-600 fit-text">
        {isEditing ? (
          <input
            type="text"
            value={editData.finish_color}
            onChange={(e) => setEditData({ ...editData, finish_color: e.target.value })}
            className="w-full bg-neutral-800 text-neutral-200 px-2 py-1 rounded text-sm border border-neutral-600"
          />
        ) : (
          <span>{item.finish_color || item.remarks || '-'}</span>
        )}
      </td>

      {/* Cost/Price */}
      <td className="p-2 border border-neutral-600 fit-text">
        {isEditing ? (
          <input
            type="number"
            value={editData.cost}
            onChange={(e) => setEditData({ ...editData, cost: parseFloat(e.target.value) || 0 })}
            className="w-full bg-neutral-800 text-neutral-200 px-2 py-1 rounded text-sm border border-neutral-600"
            step="0.01"
          />
        ) : (
          <span>${item.cost || '0.00'}</span>
        )}
      </td>

      {/* Image */}
      <td className="p-2 border border-neutral-600 fit-text">
        {isEditing ? (
          <input
            type="url"
            value={editData.image_url}
            onChange={(e) => setEditData({ ...editData, image_url: e.target.value })}
            className="w-full bg-neutral-800 text-neutral-200 px-2 py-1 rounded text-sm border border-neutral-600"
            placeholder="Image URL"
          />
        ) : (
          item.image_url ? (
            <img src={item.image_url} alt="Item" className="w-8 h-8 object-cover rounded" />
          ) : (
            <span>-</span>
          )
        )}
      </td>

      {/* PURPLE SECTION - Shipping Info */}
      
      {/* Order Status / Est. Ship Date / Est. Delivery Date */}
      <td className="p-2 border border-neutral-600 fit-text">
        {isEditing ? (
          <textarea
            value={editData.order_status}
            onChange={(e) => setEditData({ ...editData, order_status: e.target.value })}
            className="w-full bg-neutral-800 text-neutral-200 px-2 py-1 rounded text-sm border border-neutral-600"
            rows="2"
          />
        ) : (
          <span className="text-xs">{item.order_status || '-'}</span>
        )}
      </td>

      {/* Install Date / Shipping TO */}
      <td className="p-2 border border-neutral-600 fit-text">
        {isEditing ? (
          <input
            type="date"
            value={editData.install_date}
            onChange={(e) => setEditData({ ...editData, install_date: e.target.value })}
            className="w-full bg-neutral-800 text-neutral-200 px-2 py-1 rounded text-sm border border-neutral-600"
          />
        ) : (
          <span className="text-xs">{item.install_date || '-'}</span>
        )}
      </td>

      {/* Tracking Number */}
      <td className="p-2 border border-neutral-600 fit-text">
        {isEditing ? (
          <input
            type="text"
            value={editData.tracking_number}
            onChange={(e) => setEditData({ ...editData, tracking_number: e.target.value })}
            className="w-full bg-neutral-800 text-neutral-200 px-2 py-1 rounded text-sm border border-neutral-600"
          />
        ) : (
          <span>{item.tracking_number || '-'}</span>
        )}
      </td>

      {/* Carrier */}
      <td className="p-2 border border-neutral-600 fit-text">
        {isEditing ? (
          <select
            value={editData.carrier}
            onChange={(e) => setEditData({ ...editData, carrier: e.target.value })}
            className="w-full bg-neutral-800 text-neutral-200 px-2 py-1 rounded text-sm border border-neutral-600"
          >
            <option value="">Select Carrier</option>
            <option value="UPS">UPS</option>
            <option value="FedEx">FedEx</option>
            <option value="USPS">USPS</option>
            <option value="DHL">DHL</option>
            <option value="Other">Other</option>
          </select>
        ) : (
          <span>{item.carrier || item.vendor || '-'}</span>
        )}
      </td>

      {/* Order Date */}
      <td className="p-2 border border-neutral-600 fit-text">
        {isEditing ? (
          <input
            type="date"
            value={editData.order_date}
            onChange={(e) => setEditData({ ...editData, order_date: e.target.value })}
            className="w-full bg-neutral-800 text-neutral-200 px-2 py-1 rounded text-sm border border-neutral-600"
          />
        ) : (
          <span>{item.order_date || '-'}</span>
        )}
      </td>
    </tr>
  );
};

export default FFESpreadsheet;
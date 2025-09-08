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

  // EXACT colors from your pictures - COMPLETELY UNIQUE FOR EACH ROOM
  const getRoomColor = (roomName) => {
    const exactColors = {
      'living room': '#8E4EC6',    // Purple from your picture  
      'kitchen': '#059669',        // Teal from your picture
      'master bedroom': '#DC2626', // Red from your picture
      'bedroom 2': '#D97706',      // Orange from your picture  
      'bedroom 3': '#7C3AED',      // Different purple from your picture
      'bathroom': '#0284C7',       // Blue from your picture
      'master bathroom': '#BE185D', // Pink from your picture
      'powder room': '#047857',    // Dark green from your picture
      'dining room': '#B91C1C',    // Dark red from your picture
      'office': '#7C2D12',         // Brown from your picture
      'family room': '#581C87',    // Dark purple from your picture
      'basement': '#92400E',       // Dark orange from your picture
      'laundry room': '#1E40AF',   // Dark blue from your picture
      'mudroom': '#166534',        // Forest green from your picture
      'pantry': '#A21CAF',         // Magenta from your picture
      'closet': '#0F766E',         // Teal green from your picture
      'guest room': '#BE123C',     // Rose from your picture
      'playroom': '#6366F1',       // Indigo from your picture
      'library': '#7C3AED',        // Violet from your picture
      'wine cellar': '#4338CA',    // Dark indigo from your picture
      'garage': '#6B7280',         // Gray from your picture
      'patio': '#65A30D'           // Lime from your picture
    };
    return exactColors[roomName.toLowerCase()] || '#6B7280';
  };

  // GREEN for categories - DISTINCT but not bright
  const getCategoryColor = (categoryName) => {
    return '#6B8E7A'; // Muted forest green - clearly different from room colors
  };

  // RED for sub-categories - DISTINCT but SUBTLE
  const getSubCategoryColor = (subCategoryName) => {
    return '#A8756C'; // Muted terracotta red - distinct but easy on eyes
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
    // Status colors from your pictures - DISTINCT for each status
    const colors = {
      'PICKED': '#FCD34D',           // Bright yellow
      'ORDERED': '#3B82F6',          // Blue
      'SHIPPED': '#F97316',          // Orange  
      'DELIVERED TO RECEIVER': '#10B981',     // Green
      'DELIVERED TO JOB SITE': '#059669',    // Dark green
      'INSTALLED': '#22C55E',        // Bright green
      'PARTIALLY DELIVERED': '#8B5CF6',  // Purple
      'ON HOLD': '#EF4444',          // Red
      'CANCELLED': '#6B7280',        // Gray
      'BACKORDERED': '#F59E0B',      // Amber
      'IN TRANSIT': '#06B6D4',       // Cyan
      'OUT FOR DELIVERY': '#84CC16', // Lime
      'RETURNED': '#EC4899',         // Pink
      'DAMAGED': '#DC2626',          // Dark red
      'MISSING': '#7C2D12',          // Brown
      'PENDING APPROVAL': '#D97706', // Dark orange
      'QUOTE REQUESTED': '#7C3AED',  // Violet
      'APPROVED': '#16A34A',         // Dark green
      'REJECTED': '#991B1B'          // Dark red
    };
    return colors[status] || '#6B7280';
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
        <table className="w-full min-w-[4200px] border-collapse" style={{ tableLayout: 'fixed' }}>
          {/* NO HEADER ROW - Headers go on the red subcategory lines as per your requirements */}
          <tbody>
            {project.rooms.map((room) => (
              <React.Fragment key={room.id}>
                {/* 1. ROOM Header Row - PURPLE like LIVING ROOM - CENTERED */}
                <tr>
                  <td 
                    colSpan="16" 
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
                          {/* BROWN SECTION - ADDITIONAL INFO (spans 4 columns) */}
                          <td 
                            colSpan="4"
                            className="p-2 font-semibold text-white text-sm border border-neutral-600 fit-text text-center"
                            style={{ backgroundColor: '#8B7355' }}
                          >
                            ADDITIONAL INFO.
                          </td>
                          {/* PURPLE SECTION - SHIPPING INFO (spans 5 columns) */}
                          <td 
                            colSpan="5"
                            className="p-2 font-semibold text-white text-sm border border-neutral-600 fit-text text-center"
                            style={{ backgroundColor: '#7B68A6' }}
                          >
                            SHIPPING INFO.
                          </td>
                          {/* RED SECTION - NOTES & DELETE (spans 2 columns) */}
                          <td 
                            colSpan="2"
                            className="p-2 font-semibold text-white text-sm border border-neutral-600 fit-text text-center"
                            style={{ backgroundColor: getSubCategoryColor(subcategory.name) }}
                          >
                            NOTES & DELETE
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
                            style={{ backgroundColor: '#8B7355' }}
                          >
                            FINISH/Color
                          </td>
                          <td 
                            className="w-32 p-2 font-semibold text-white text-sm border border-neutral-600 fit-text text-center"
                            style={{ backgroundColor: '#8B7355' }}
                          >
                            Cost/Price
                          </td>
                          <td 
                            className="w-32 p-2 font-semibold text-white text-sm border border-neutral-600 fit-text text-center"
                            style={{ backgroundColor: '#8B7355' }}
                          >
                            LINK
                          </td>
                          <td 
                            className="w-24 p-2 font-semibold text-white text-sm border border-neutral-600 fit-text text-center"
                            style={{ backgroundColor: '#8B7355' }}
                          >
                            Image
                          </td>
                          
                          {/* PURPLE SECTION COLUMNS */}
                          <td 
                            className="w-32 p-2 font-semibold text-white text-xs border border-neutral-600 fit-text text-center"
                            style={{ backgroundColor: '#7B68A6' }}
                          >
                            Order Status /<br/>Ship Date /<br/>Delivery Date
                          </td>
                          <td 
                            className="w-32 p-2 font-semibold text-white text-xs border border-neutral-600 fit-text text-center"
                            style={{ backgroundColor: '#7B68A6' }}
                          >
                            Install Date /<br/>Shipping TO
                          </td>
                          <td 
                            className="w-32 p-2 font-semibold text-white text-sm border border-neutral-600 fit-text text-center"
                            style={{ backgroundColor: '#7B68A6' }}
                          >
                            TRACKING #
                          </td>
                          <td 
                            className="w-24 p-2 font-semibold text-white text-sm border border-neutral-600 fit-text text-center"
                            style={{ backgroundColor: '#7B68A6' }}
                          >
                            Carrier
                          </td>
                          <td 
                            className="w-24 p-2 font-semibold text-white text-sm border border-neutral-600 fit-text text-center"
                            style={{ backgroundColor: '#7B68A6' }}
                          >
                            Order Date
                          </td>
                          
                          {/* RED DELETE COLUMN */}
                          <td 
                            className="w-32 p-2 font-semibold text-white text-sm border border-neutral-600 fit-text text-center"
                            style={{ backgroundColor: getSubCategoryColor(subcategory.name) }}
                          >
                            NOTES
                          </td>
                          <td 
                            className="w-24 p-2 font-semibold text-white text-sm border border-neutral-600 fit-text text-center"
                            style={{ backgroundColor: getSubCategoryColor(subcategory.name) }}
                          >
                            DELETE
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
                            <td colSpan="16" className="p-4 text-center text-neutral-400 border border-neutral-600" style={{ backgroundColor: '#2A2A2A' }}>
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
          vendorTypes={vendorTypes}
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
    link: item.link || '',
    image_url: item.image_url || '',
    order_status: item.order_status || '',
    ship_date: item.ship_date || '',
    delivery_date: item.delivery_date || '',
    install_date: item.install_date || '',
    tracking_number: item.tracking_number || '',
    carrier: item.carrier || '',
    order_date: item.order_date || '',
    notes: item.notes || item.remarks || ''
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
      link: item.link || '',
      image_url: item.image_url || '',
      order_status: item.order_status || '',
      ship_date: item.ship_date || '',
      delivery_date: item.delivery_date || '',
      install_date: item.install_date || '',
      tracking_number: item.tracking_number || '',
      carrier: item.carrier || '',
      order_date: item.order_date || '',
      notes: item.notes || item.remarks || ''
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

      {/* Orders Status - WITH VISIBLE COLORS */}
      <td className="p-2 border border-neutral-600 fit-text">
        {isEditing ? (
          <select
            value={editData.status}
            onChange={(e) => setEditData({ ...editData, status: e.target.value })}
            className="w-full text-black px-2 py-1 rounded text-sm border border-neutral-600 font-medium"
            style={{ backgroundColor: getStatusColor(editData.status) }}
          >
            {itemStatuses.map(status => (
              <option key={status} value={status}>
                {status.replace('_', ' ')}
              </option>
            ))}
          </select>
        ) : (
          <div 
            className="px-2 py-1 rounded text-center text-black font-medium text-xs"
            style={{ backgroundColor: getStatusColor(item.status) }}
          >
            {item.status.replace('_', ' ')}
          </div>
        )}
      </td>

      {/* BROWN SECTION - Additional Info */
      
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

      {/* LINK - MOST IMPORTANT COLUMN */}
      <td className="p-2 border border-neutral-600 fit-text">
        {isEditing ? (
          <input
            type="url"
            value={editData.link}
            onChange={(e) => setEditData({ ...editData, link: e.target.value })}
            className="w-full bg-neutral-800 text-neutral-200 px-2 py-1 rounded text-sm border border-neutral-600"
            placeholder="Product URL"
          />
        ) : (
          item.link ? (
            <a href={item.link} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 text-xs">
              🔗 View
            </a>
          ) : (
            <span>-</span>
          )
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
      
      {/* Order Status / Ship Date / Delivery Date - 3 SEPARATE SPACES */}
      <td className="p-2 border border-neutral-600 fit-text">
        {isEditing ? (
          <div className="space-y-1">
            <input
              type="text"
              value={editData.order_status}
              onChange={(e) => setEditData({ ...editData, order_status: e.target.value })}
              className="w-full bg-neutral-800 text-neutral-200 px-1 py-0.5 rounded text-xs border border-neutral-600"
              placeholder="Order Status"
            />
            <input
              type="date"
              value={editData.ship_date}
              onChange={(e) => setEditData({ ...editData, ship_date: e.target.value })}
              className="w-full bg-neutral-800 text-neutral-200 px-1 py-0.5 rounded text-xs border border-neutral-600"
              title="Ship Date"
            />
            <input
              type="date"
              value={editData.delivery_date}
              onChange={(e) => setEditData({ ...editData, delivery_date: e.target.value })}
              className="w-full bg-neutral-800 text-neutral-200 px-1 py-0.5 rounded text-xs border border-neutral-600"
              title="Delivery Date"
            />
          </div>
        ) : (
          <div className="text-xs space-y-1">
            <div>{item.order_status || '-'}</div>
            <div>{item.ship_date || '-'}</div>
            <div>{item.delivery_date || '-'}</div>
          </div>
        )}
      </td>

      {/* Install Date / Shipping TO */}
      <td className="p-2 border border-neutral-600 fit-text">
        {isEditing ? (
          <div className="flex flex-col space-y-1">
            <input
              type="date"
              value={editData.install_date}
              onChange={(e) => setEditData({ ...editData, install_date: e.target.value })}
              className="w-full bg-neutral-800 text-neutral-200 px-2 py-1 rounded text-xs border border-neutral-600"
              title="Install Date"
            />
            <input
              type="text"
              placeholder="Shipping TO"
              className="w-full bg-neutral-800 text-neutral-200 px-2 py-1 rounded text-xs border border-neutral-600"
            />
          </div>
        ) : (
          <div className="text-xs">
            <div>{item.install_date || '-'}</div>
            <div className="text-neutral-400">Ship TO: -</div>
          </div>
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
            placeholder="Enter tracking #"
          />
        ) : (
          item.tracking_number ? (
            <div className="flex items-center space-x-2">
              <span className="text-xs">{item.tracking_number}</span>
              <button
                onClick={() => {
                  // Create tracking URL based on carrier
                  let trackingUrl = '';
                  const carrier = item.carrier || item.vendor || '';
                  const trackingNum = item.tracking_number;
                  
                  if (carrier.toLowerCase().includes('ups')) {
                    trackingUrl = `https://www.ups.com/track?loc=null&tracknum=${trackingNum}`;
                  } else if (carrier.toLowerCase().includes('fedex')) {
                    trackingUrl = `https://www.fedex.com/fedextrack/?trknbr=${trackingNum}`;
                  } else if (carrier.toLowerCase().includes('usps')) {
                    trackingUrl = `https://tools.usps.com/go/TrackConfirmAction?tRef=fullpage&tLc=2&text28777=&tLabels=${trackingNum}`;
                  } else {
                    // Generic Google search for tracking
                    trackingUrl = `https://www.google.com/search?q=${encodeURIComponent(carrier + ' tracking ' + trackingNum)}`;
                  }
                  
                  window.open(trackingUrl, '_blank');
                }}
                className="text-blue-400 hover:text-blue-300 text-xs underline"
                title="Track Package"
              >
                🔗 Track
              </button>
            </div>
          ) : (
            <span>-</span>
          )
        )}
      </td>

      {/* Carrier - FIX THE DROPDOWN */}
      <td className="p-2 border border-neutral-600 fit-text">
        {isEditing ? (
          <select
            value={editData.carrier}
            onChange={(e) => setEditData({ ...editData, carrier: e.target.value })}
            className="w-full bg-neutral-800 text-neutral-200 px-2 py-1 rounded text-sm border border-neutral-600"
          >
            <option value="">Select Carrier</option>
            {carrierTypes.map(carrier => (
              <option key={carrier} value={carrier}>
                {carrier}
              </option>
            ))}
          </select>
        ) : (
          <span>{item.carrier || '-'}</span>
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
            title="Order Date - Click to open calendar"
          />
        ) : (
          <span>{item.order_date || '-'}</span>
        )}
      </td>

      {/* NOTES COLUMN - RED SECTION */}
      <td className="p-2 border border-neutral-600 fit-text">
        {isEditing ? (
          <textarea
            value={editData.notes}
            onChange={(e) => setEditData({ ...editData, notes: e.target.value })}
            className="w-full bg-neutral-800 text-neutral-200 px-2 py-1 rounded text-sm border border-neutral-600"
            rows="2"
            placeholder="Notes..."
          />
        ) : (
          <span className="text-xs">{item.notes || item.remarks || '-'}</span>
        )}
      </td>

      {/* DELETE COLUMN - RED SECTION */}
      <td className="p-2 border border-neutral-600 text-center fit-text">
        <div className="flex justify-center space-x-1">
          {isEditing ? (
            <>
              <button
                onClick={handleSave}
                className="bg-green-700 hover:bg-green-600 text-neutral-200 px-2 py-1 rounded text-xs"
                disabled={isOffline}
                title="Save Changes"
              >
                ✓
              </button>
              <button
                onClick={handleCancel}
                className="bg-neutral-600 hover:bg-neutral-500 text-neutral-200 px-2 py-1 rounded text-xs"
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
      </td>
    </tr>
  );
};

export default FFESpreadsheet;
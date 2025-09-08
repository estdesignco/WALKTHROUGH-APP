import React, { useState } from 'react';
import AddItemModal from './AddItemModal';
import AddSubCategoryModal from './AddSubCategoryModal';

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
  const [showAddItem, setShowAddItem] = useState(false);
  const [showAddSubCategory, setShowAddSubCategory] = useState(false);
  const [selectedSubCategoryId, setSelectedSubCategoryId] = useState(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);
  const [selectedRoomId, setSelectedRoomId] = useState(null);
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

  // GREEN for categories - YOUR EXACT COLOR
  const getCategoryColor = (categoryName) => {
    return '#0b4e38'; // Your exact green color
  };

  // RED for sub-categories - USER'S NEW COLOR  
  const getSubCategoryColor = (subCategoryName) => {
    return '#b43535'; // User's requested red color
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

  const handleAddItem = async (itemData) => {
    if (!selectedSubCategoryId) return;
    
    try {
      setLoading(true);
      const { itemAPI } = await import('../App');
      await itemAPI.create({
        ...itemData,
        subcategory_id: selectedSubCategoryId
      });
      
      await onReload();
      setShowAddItem(false);
      setSelectedSubCategoryId(null);
    } catch (err) {
      console.error('Error adding item:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddSubCategory = async (subCategoryData) => {
    if (!selectedCategoryId) return;
    
    try {
      setLoading(true);
      const { subCategoryAPI } = await import('../App');
      await subCategoryAPI.create({
        ...subCategoryData,
        category_id: selectedCategoryId
      });
      
      await onReload();
      setShowAddSubCategory(false);
      setSelectedCategoryId(null);
    } catch (err) {
      console.error('Error adding sub-category:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateItem = async (itemId, updateData) => {
    try {
      const { itemAPI } = await import('../App');
      await itemAPI.update(itemId, updateData);
      await onReload();
    } catch (err) {
      console.error('Error updating item:', err);
    }
  };

  const handleDeleteItem = async (itemId) => {
    if (!window.confirm('Are you sure you want to delete this item?')) return;
    
    try {
      const { itemAPI } = await import('../App');
      await itemAPI.delete(itemId);
      await onReload();
    } catch (err) {
      console.error('Error deleting item:', err);
    }
  };

  return (
    <div className="bg-neutral-900 rounded-lg overflow-hidden shadow-lg">
      {/* Scrollable Container with Fixed Scrolling Behavior */}
      <div 
        className="relative"
        style={{ 
          maxHeight: '80vh',
          overflowY: 'auto'
        }}
      >
        <div
          className="overflow-x-auto"
          style={{ 
            overscrollBehaviorX: 'contain'
          }}
        >
          <table className="w-full min-w-[4200px] border-collapse" style={{ tableLayout: 'fixed' }}>
            <tbody>
            {/* MAIN DATA STRUCTURE */}
            {project?.rooms?.map((room) => (
              <React.Fragment key={room.id}>
                {/* 1. ROOM Header Row - UNIQUE COLORS FROM YOUR PICTURES - CENTERED */}
                <tr>
                  <td 
                    colSpan="16" 
                    className="p-4 font-bold text-white text-lg border border-neutral-600 fit-text text-center"
                    style={{ backgroundColor: getRoomColor(room.name) }}
                  >
                    <div className="flex items-center justify-between">
                      <span></span>
                      <span>{room.name.toUpperCase()}</span>
                      <button
                        onClick={() => onDeleteRoom(room.id)}
                        className="bg-neutral-800 bg-opacity-50 hover:bg-opacity-70 text-white px-2 py-1 rounded text-sm"
                        title="Delete Room"
                      >
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>

                {/* 2. CATEGORIES for this room - GREEN - CENTERED */}
                {room.categories?.map((category) => (
                  <React.Fragment key={category.id}>
                    <tr>
                      <td 
                        colSpan="16" 
                        className="p-3 font-semibold text-white text-md border border-neutral-600 fit-text text-center"
                        style={{ backgroundColor: getCategoryColor(category.name) }}
                      >
                        <div className="flex items-center justify-between">
                          <span></span>
                          <span>{category.name.toUpperCase()}</span>
                          <button
                            onClick={() => {
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

                    {/* 3. SUB-CATEGORIES with MULTI-SECTION HEADERS */}
                    {category.subcategories?.map((subcategory) => (
                      <React.Fragment key={subcategory.id}>
                        {/* FIRST ROW: Section Headers - RED + BROWN + PURPLE + RED */}
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
                                onClick={() => {
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
                          {/* BROWN SECTION - ADDITIONAL INFO (spans 4 columns) - YOUR EXACT COLOR */}
                          <td 
                            colSpan="4"
                            className="p-2 font-semibold text-white text-sm border border-neutral-600 fit-text text-center"
                            style={{ backgroundColor: '#8b7355' }}
                          >
                            ADDITIONAL INFO.
                          </td>
                          {/* PURPLE SECTION - SHIPPING INFO (spans 5 columns) - YOUR PURPLE COLOR */}
                          <td 
                            colSpan="5"
                            className="p-2 font-semibold text-white text-sm border border-neutral-600 fit-text text-center"
                            style={{ backgroundColor: '#6B5B8B' }}
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
                          <td className="w-32 p-2 font-semibold text-white text-sm border border-neutral-600 fit-text text-center" style={{ backgroundColor: getSubCategoryColor(subcategory.name) }}>ITEM NAME</td>
                          <td className="w-32 p-2 font-semibold text-white text-sm border border-neutral-600 fit-text text-center" style={{ backgroundColor: getSubCategoryColor(subcategory.name) }}>VENDOR/SKU</td>
                          <td className="w-16 p-2 font-semibold text-white text-sm border border-neutral-600 fit-text text-center" style={{ backgroundColor: getSubCategoryColor(subcategory.name) }}>QTY</td>
                          <td className="w-24 p-2 font-semibold text-white text-sm border border-neutral-600 fit-text text-center" style={{ backgroundColor: getSubCategoryColor(subcategory.name) }}>SIZE</td>
                          <td className="w-32 p-2 font-semibold text-white text-sm border border-neutral-600 fit-text text-center" style={{ backgroundColor: getSubCategoryColor(subcategory.name) }}>ORDERS STATUS</td>
                          
                          {/* BROWN SECTION COLUMNS - YOUR EXACT COLOR */}
                          <td className="w-32 p-2 font-semibold text-white text-sm border border-neutral-600 fit-text text-center" style={{ backgroundColor: '#8b7355' }}>FINISH/Color</td>
                          <td className="w-32 p-2 font-semibold text-white text-sm border border-neutral-600 fit-text text-center" style={{ backgroundColor: '#8b7355' }}>Cost/Price</td>
                          <td className="w-32 p-2 font-semibold text-white text-sm border border-neutral-600 fit-text text-center" style={{ backgroundColor: '#8b7355' }}>LINK</td>
                          <td className="w-24 p-2 font-semibold text-white text-sm border border-neutral-600 fit-text text-center" style={{ backgroundColor: '#8b7355' }}>Image</td>
                          
                          {/* PURPLE SECTION COLUMNS - YOUR PURPLE COLOR */}
                          <td className="w-32 p-2 font-semibold text-white text-xs border border-neutral-600 fit-text text-center" style={{ backgroundColor: '#6B5B8B' }}>Order Status /<br/>Ship Date /<br/>Delivery Date</td>
                          <td className="w-32 p-2 font-semibold text-white text-xs border border-neutral-600 fit-text text-center" style={{ backgroundColor: '#6B5B8B' }}>Install Date /<br/>Shipping TO</td>
                          <td className="w-32 p-2 font-semibold text-white text-sm border border-neutral-600 fit-text text-center" style={{ backgroundColor: '#6B5B8B' }}>TRACKING #</td>
                          <td className="w-24 p-2 font-semibold text-white text-sm border border-neutral-600 fit-text text-center" style={{ backgroundColor: '#6B5B8B' }}>Carrier</td>
                          <td className="w-24 p-2 font-semibold text-white text-sm border border-neutral-600 fit-text text-center" style={{ backgroundColor: '#6B5B8B' }}>Order Date</td>
                          
                          {/* RED DELETE COLUMN */}
                          <td className="w-32 p-2 font-semibold text-white text-sm border border-neutral-600 fit-text text-center" style={{ backgroundColor: getSubCategoryColor(subcategory.name) }}>NOTES</td>
                          <td className="w-24 p-2 font-semibold text-white text-sm border border-neutral-600 fit-text text-center" style={{ backgroundColor: getSubCategoryColor(subcategory.name) }}>DELETE</td>
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
                                  setSelectedRoomId(room.id);
                                  setSelectedCategoryId(category.id);
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

                        {/* ACTION BUTTONS ROW - FAR LEFT */}
                        <tr>
                          <td colSpan="16" className="p-4 bg-neutral-800 border border-neutral-600">
                            <div className="flex items-center justify-start space-x-6">
                              <button
                                onClick={() => {
                                  setSelectedRoomId(room.id);
                                  setSelectedCategoryId(category.id);
                                  setSelectedSubCategoryId(subcategory.id);
                                  setShowAddItem(true);
                                }}
                                style={{ backgroundColor: '#8b7355' }}
                                className="hover:opacity-90 text-white px-6 py-2 rounded font-medium transition-colors"
                              >
                                ➕ Add Item
                              </button>
                              <button
                                onClick={() => {
                                  if (window.confirm('Delete this section and all its items?')) {
                                    // TODO: Implement delete section
                                  }
                                }}
                                className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded font-medium transition-colors"
                              >
                                🗑️ Delete Section
                              </button>
                            </div>
                          </td>
                        </tr>
                      </React.Fragment>
                    )) || (
                      <tr>
                        <td colSpan="16" className="p-4 text-center text-neutral-400 border border-neutral-600" style={{ backgroundColor: '#2A2A2A' }}>
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
                {(!room.categories || room.categories.length === 0) && (
                  <tr>
                    <td colSpan="16" className="p-8 text-center text-neutral-400 border border-neutral-600" style={{ backgroundColor: '#2A2A2A' }}>
                      <p>No categories in this room.</p>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
        </div>
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

// Individual Item Row Component - FREE FLOW EDITING (NO EDIT BUTTONS)
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
  // Always in edit mode for quick access - NO EDIT BUTTON NEEDED
  const [formData, setFormData] = useState({
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

  // Auto-save when any field changes - ABSOLUTELY NO PAGE JUMPING
  const handleFieldChange = (field, value) => {
    // ONLY update local state - NO API CALLS TO PREVENT JUMPING
    const newData = { ...formData, [field]: value };
    setFormData(newData);
  };

  // Alternating row colors
  const bgColor = itemIndex % 2 === 0 ? '#1F2937' : '#374151';

  return (
    <tr style={{ backgroundColor: bgColor }} className="text-neutral-200 text-sm">
      {/* RED SECTION - Core Item Info - FREE FLOW EDITING */}
      
      {/* Item Name - PLAIN TEXT ONLY */}
      <td className="p-2 border border-neutral-600 w-auto text-neutral-200 text-sm" style={{ width: 'fit-content' }}>
        <div
          contentEditable
          suppressContentEditableWarning={true}
          onBlur={(e) => handleFieldChange('name', e.target.textContent)}
          className="bg-transparent outline-none"
        >
          {formData.name || 'Item name...'}
        </div>
      </td>

      {/* Vendor/SKU - PLAIN TEXT ONLY */}
      <td className="p-2 border border-neutral-600 w-auto text-neutral-200 text-sm" style={{ width: 'fit-content' }}>
        <div
          contentEditable
          suppressContentEditableWarning={true}
          onBlur={(e) => handleFieldChange('vendor', e.target.textContent)}
          className="bg-transparent outline-none"
        >
          {formData.vendor || 'Vendor/SKU...'}
        </div>
      </td>

      {/* Quantity - PLAIN TEXT ONLY */}
      <td className="p-2 border border-neutral-600 w-auto text-neutral-200 text-sm" style={{ width: 'fit-content' }}>
        <div
          contentEditable
          suppressContentEditableWarning={true}
          onBlur={(e) => handleFieldChange('quantity', e.target.textContent)}
          className="bg-transparent outline-none"
        >
          {formData.quantity || 'Qty'}
        </div>
      </td>

      {/* Size - PLAIN TEXT ONLY */}
      <td className="p-2 border border-neutral-600 w-auto text-neutral-200 text-sm" style={{ width: 'fit-content' }}>
        <div
          contentEditable
          suppressContentEditableWarning={true}
          onBlur={(e) => handleFieldChange('size', e.target.textContent)}
          className="bg-transparent outline-none"
        >
          {formData.size || 'Size...'}
        </div>
      </td>

      {/* Orders Status - Always editable with visible colors */}
      <td className="p-2 border border-neutral-600 fit-text">
        <select
          value={formData.status}
          onChange={(e) => handleFieldChange('status', e.target.value)}
          className="w-full text-black px-2 py-1 rounded text-sm border-0 focus:border focus:border-blue-500 font-medium"
          style={{ backgroundColor: getStatusColor(formData.status) }}
        >
          {itemStatuses.map(status => (
            <option 
              key={status} 
              value={status} 
              className="text-black"
              style={{ backgroundColor: getStatusColor(status) }}
            >
              {status.replace('_', ' ')}
            </option>
          ))}
        </select>
      </td>

      {/* BROWN SECTION - Additional Info - Always editable */}
      
      {/* Finish/Color - PLAIN TEXT ONLY */}
      <td className="p-2 border border-neutral-600 w-auto text-neutral-200 text-sm" style={{ width: 'fit-content' }}>
        <div
          contentEditable
          suppressContentEditableWarning={true}
          onBlur={(e) => handleFieldChange('finish_color', e.target.textContent)}
          className="bg-transparent outline-none"
        >
          {formData.finish_color || 'Finish/Color...'}
        </div>
      </td>

      {/* Cost/Price - PLAIN TEXT ONLY */}
      <td className="p-2 border border-neutral-600 w-auto text-neutral-200 text-sm" style={{ width: 'fit-content' }}>
        <div
          contentEditable
          suppressContentEditableWarning={true}
          onBlur={(e) => handleFieldChange('cost', e.target.textContent)}
          className="bg-transparent outline-none"
        >
          {formData.cost || '0.00'}
        </div>
      </td>

      {/* LINK - PLAIN TEXT WITH WORKING LINK */}
      <td className="p-2 border border-neutral-600 w-auto text-neutral-200 text-sm" style={{ width: 'fit-content' }}>
        <div className="flex items-center space-x-2">
          <div
            contentEditable
            suppressContentEditableWarning={true}
            onBlur={(e) => handleFieldChange('link', e.target.textContent)}
            className="bg-transparent outline-none flex-1"
          >
            {formData.link || 'Product URL...'}
          </div>
          {formData.link && (
            <a 
              href={formData.link.startsWith('http') ? formData.link : `https://${formData.link}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300 text-xs"
              onClick={(e) => e.stopPropagation()}
            >
              🔗
            </a>
          )}
        </div>
      </td>

      {/* Image */}
      <td className="p-2 border border-neutral-600 fit-text">
        <input
          type="url"
          value={formData.image_url}
          onChange={(e) => handleFieldChange('image_url', e.target.value)}
          className="w-full bg-transparent text-neutral-200 px-2 py-1 rounded text-sm border-0 focus:border focus:border-blue-500 focus:bg-neutral-800"
          placeholder="Image URL..."
        />
        {formData.image_url && (
          <img src={formData.image_url} alt="Item" className="w-8 h-8 object-cover rounded mt-1" />
        )}
      </td>

      {/* PURPLE SECTION - Shipping Info - Always editable */}
      
      {/* Order Status / Ship Date / Delivery Date - PROPER SPACING */}
      <td className="p-3 border border-neutral-600 fit-text">
        <div className="space-y-3">
          <select
            value={formData.order_status}
            onChange={(e) => handleFieldChange('order_status', e.target.value)}
            className="w-full bg-transparent text-neutral-200 px-3 py-2 rounded text-sm border border-neutral-500 focus:border-blue-500 focus:bg-neutral-800"
          >
            <option value="">Order Status</option>
            {itemStatuses.map(status => (
              <option key={status} value={status} className="bg-neutral-800">
                {status.replace('_', ' ')}
              </option>
            ))}
          </select>
          <input
            type="date"
            value={formData.ship_date}
            onChange={(e) => handleFieldChange('ship_date', e.target.value)}
            className="w-full bg-transparent text-neutral-200 px-3 py-2 rounded text-sm border border-neutral-500 focus:border-blue-500 focus:bg-neutral-800"
            placeholder="Ship Date"
          />
          <input
            type="date"
            value={formData.delivery_date}
            onChange={(e) => handleFieldChange('delivery_date', e.target.value)}
            className="w-full bg-transparent text-neutral-200 px-3 py-2 rounded text-sm border border-neutral-500 focus:border-blue-500 focus:bg-neutral-800"
            placeholder="Delivery Date"
          />
        </div>
      </td>

      {/* Install Date / Shipping TO */}
      <td className="p-3 border border-neutral-600 fit-text">
        <div className="space-y-3">
          <input
            type="date"
            value={formData.install_date}
            onChange={(e) => handleFieldChange('install_date', e.target.value)}
            className="w-full bg-transparent text-neutral-200 px-3 py-2 rounded text-sm border border-neutral-500 focus:border-blue-500 focus:bg-neutral-800"
            placeholder="Install Date"
          />
          <input
            type="text"
            placeholder="Shipping TO"
            className="w-full bg-transparent text-neutral-200 px-3 py-2 rounded text-sm border border-neutral-500 focus:border-blue-500 focus:bg-neutral-800"
          />
        </div>
      </td>

      {/* Tracking Number - NO CONTAINER */}
      <td className="p-2 border border-neutral-600 fit-text">
        <input
          type="text"
          value={formData.tracking_number}
          onChange={(e) => handleFieldChange('tracking_number', e.target.value)}
          className="w-full bg-transparent text-neutral-200 px-2 py-1 rounded text-sm border-0 focus:border focus:border-blue-500 focus:bg-neutral-800"
          placeholder="Tracking #"
        />
      </td>

      {/* Carrier */}
      <td className="p-2 border border-neutral-600 fit-text">
        <select
          value={formData.carrier}
          onChange={(e) => handleFieldChange('carrier', e.target.value)}
          className="w-full bg-transparent text-neutral-200 px-2 py-1 rounded text-sm border-0 focus:border focus:border-blue-500 focus:bg-neutral-800"
        >
          <option value="">Select Carrier</option>
          {carrierTypes.map(carrier => (
            <option key={carrier} value={carrier} className="bg-neutral-800">
              {carrier}
            </option>
          ))}
        </select>
      </td>

      {/* Order Date */}
      <td className="p-2 border border-neutral-600 fit-text">
        <input
          type="date"
          value={formData.order_date}
          onChange={(e) => handleFieldChange('order_date', e.target.value)}
          className="w-full bg-transparent text-neutral-200 px-2 py-1 rounded text-sm border-0 focus:border focus:border-blue-500 focus:bg-neutral-800"
          title="Order Date"
        />
      </td>

      {/* NOTES - PLAIN TEXT ONLY */}
      <td className="p-2 border border-neutral-600 w-auto text-neutral-200 text-sm" style={{ width: 'fit-content' }}>
        <div
          contentEditable
          suppressContentEditableWarning={true}
          onBlur={(e) => handleFieldChange('notes', e.target.textContent)}
          className="bg-transparent outline-none"
        >
          {formData.notes || 'Notes...'}
        </div>
      </td>

      {/* DELETE COLUMN - RED SECTION - ONLY DELETE BUTTON */}
      <td className="p-2 border border-neutral-600 text-center fit-text">
        <button
          onClick={() => onDelete(item.id)}
          className="bg-red-700 hover:bg-red-600 text-neutral-200 px-2 py-1 rounded text-xs"
          title="Delete Item"
          disabled={isOffline}
        >
          🗑️
        </button>
      </td>
    </tr>
  );
};

export default FFESpreadsheet;
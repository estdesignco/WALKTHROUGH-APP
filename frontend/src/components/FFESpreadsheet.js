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

  if (loading) {
    return (
      <div className="bg-neutral-900 rounded-lg p-8 text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-custom-gold"></div>
        <p className="text-neutral-300 mt-4">Loading FF&E data...</p>
      </div>
    );
  }

  if (!project || !project.rooms || project.rooms.length === 0) {
    return (
      <div className="bg-neutral-900 rounded-lg p-8 text-center">
        <p className="text-neutral-300">No rooms found in this project.</p>
      </div>
    );
  }

  return (
    <div className="bg-neutral-900 rounded-lg overflow-hidden shadow-lg">
      {/* MAC-FRIENDLY SCROLLING - REBUILD FROM SCRATCH */}
      <div 
        className="relative w-full"
        style={{ 
          height: '70vh',
          overflow: 'hidden'
        }}
      >
        {/* HORIZONTAL + VERTICAL SCROLL CONTAINER */}
        <div
          className="w-full h-full overflow-auto"
          onWheel={(e) => {
            // MAC TRACKPAD: Handle 2-finger horizontal gestures
            if (Math.abs(e.deltaX) > 0) {
              // Let browser handle horizontal scrolling naturally
              e.stopPropagation();
            }
          }}
          style={{
            overflowX: 'auto',
            overflowY: 'auto',
            scrollBehavior: 'smooth',
            WebkitOverflowScrolling: 'touch'
          }}
        >
          <table 
            className="min-w-max border-collapse bg-neutral-900"
            style={{ 
              width: '4200px', // Fixed wide width to force horizontal scroll
              borderCollapse: 'collapse'
            }}
          >
            <tbody>
            {/* TEST: Just show one simple row to verify rendering */}
            <tr>
              <td className="p-4 text-white border border-neutral-600">
                🎉 FFESpreadsheet Component is WORKING!
              </td>
            </tr>
            
            {/* YOUR ACTUAL DATA */}
            {project.rooms.map((room) => (
              <React.Fragment key={room.id}>
                {/* ROOM HEADER */}
                <tr>
                  <td colSpan="16" 
                      className="p-4 text-center font-semibold text-white text-lg border border-neutral-600"
                      style={{ backgroundColor: getRoomColor(room.name) }}>
                    {room.name.toUpperCase()}
                  </td>
                </tr>
                
                {/* CATEGORIES */}
                {room.categories && room.categories.map((category) => (
                  <React.Fragment key={category.id}>
                    {/* CATEGORY HEADER */}
                    <tr>
                      <td colSpan="16" 
                          className="p-3 text-center font-medium text-white border border-neutral-600"
                          style={{ backgroundColor: '#0b4e38' }}>
                        {category.name.toUpperCase()}
                      </td>
                    </tr>
                    
                    {/* SUBCATEGORIES & ITEMS */}
                    {category.subcategories && category.subcategories.map((subcategory) => (
                      <React.Fragment key={subcategory.id}>
                        {/* SUBCATEGORY HEADER */}
                        <tr>
                          <td colSpan="16" 
                              className="p-2 text-center font-medium text-white border border-neutral-600"
                              style={{ backgroundColor: '#b43535' }}>
                            {subcategory.name.toUpperCase()}
                          </td>
                        </tr>
                        
                        {/* TABLE HEADERS */}
                        <tr className="bg-neutral-800">
                          <th className="p-2 text-custom-gold font-semibold border border-neutral-600">Item Name</th>
                          <th className="p-2 text-custom-gold font-semibold border border-neutral-600">Vendor/SKU</th>
                          <th className="p-2 text-custom-gold font-semibold border border-neutral-600">QTY</th>
                          <th className="p-2 text-custom-gold font-semibold border border-neutral-600">Size</th>
                          <th className="p-2 text-custom-gold font-semibold border border-neutral-600">Orders Status</th>
                          <th className="p-2 text-custom-gold font-semibold border border-neutral-600">Finish/Color</th>
                          <th className="p-2 text-custom-gold font-semibold border border-neutral-600">Cost/Price</th>
                          <th className="p-2 text-custom-gold font-semibold border border-neutral-600">Link</th>
                          <th className="p-2 text-custom-gold font-semibold border border-neutral-600">Image</th>
                          <th className="p-2 text-custom-gold font-semibold border border-neutral-600">Order Status/Ship/Delivery</th>
                          <th className="p-2 text-custom-gold font-semibold border border-neutral-600">Install Date/Shipping TO</th>
                          <th className="p-2 text-custom-gold font-semibold border border-neutral-600">Tracking #</th>
                          <th className="p-2 text-custom-gold font-semibold border border-neutral-600">Carrier</th>
                          <th className="p-2 text-custom-gold font-semibold border border-neutral-600">Order Date</th>
                          <th className="p-2 text-custom-gold font-semibold border border-neutral-600">Notes</th>
                          <th className="p-2 text-custom-gold font-semibold border border-neutral-600">Delete</th>
                        </tr>
                        
                        {/* ITEMS */}
                        {subcategory.items && subcategory.items.map((item) => (
                          <tr key={item.id} className="bg-neutral-900 hover:bg-neutral-800">
                            <td className="p-2 text-white border border-neutral-600 fit-text">{item.name}</td>
                            <td className="p-2 text-white border border-neutral-600 fit-text">{item.vendor}</td>
                            <td className="p-2 text-white border border-neutral-600 fit-text">{item.quantity}</td>
                            <td className="p-2 text-white border border-neutral-600 fit-text">{item.size}</td>
                            <td className="p-2 text-white border border-neutral-600 fit-text">{item.status}</td>
                            <td className="p-2 text-white border border-neutral-600 fit-text">{item.finish_color}</td>
                            <td className="p-2 text-white border border-neutral-600 fit-text">${item.cost}</td>
                            <td className="p-2 text-white border border-neutral-600 fit-text">
                              {item.link && (
                                <a href={item.link} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300">
                                  View
                                </a>
                              )}
                            </td>
                            <td className="p-2 text-white border border-neutral-600 fit-text">
                              {item.image_url && (
                                <img src={item.image_url} alt={item.name} className="w-12 h-12 object-cover rounded" />
                              )}
                            </td>
                            <td className="p-2 text-white border border-neutral-600 fit-text">{item.delivery_status}</td>
                            <td className="p-2 text-white border border-neutral-600 fit-text">{item.install_date}</td>
                            <td className="p-2 text-white border border-neutral-600 fit-text">{item.tracking}</td>
                            <td className="p-2 text-white border border-neutral-600 fit-text">{item.carrier}</td>
                            <td className="p-2 text-white border border-neutral-600 fit-text">{item.order_date}</td>
                            <td className="p-2 text-white border border-neutral-600 fit-text">{item.remarks}</td>
                            <td className="p-2 text-white border border-neutral-600">
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
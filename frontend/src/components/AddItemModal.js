import React, { useState } from 'react';

const AddItemModal = ({ onClose, onSubmit, itemStatuses, vendorTypes = [], loading }) => {
  const [formData, setFormData] = useState({
    name: '',
    quantity: 1,
    size: '',
    status: 'PICKED',
    vendor: '',
    remarks: '',
    cost: 0,
    link: '',
    tracking_number: '',
    image_url: '',
    finish_color: ''
  });

  const [isScraping, setIsScraping] = useState(false);
  const [scrapeError, setScrapeError] = useState('');

  const handleLinkScraping = async () => {
    if (!formData.link || !formData.link.startsWith('http')) {
      setScrapeError('Please enter a valid URL starting with http:// or https://');
      return;
    }

    setIsScraping(true);
    setScrapeError('');

    try {
      // FORCE CORRECT BACKEND URL
      const backendUrl = import.meta.env?.REACT_APP_BACKEND_URL || process.env.REACT_APP_BACKEND_URL || 'https://intsync-platform.preview.emergentagent.com';
      
      console.log('🔗 SCRAPING START - Backend URL:', backendUrl);
      console.log('🔗 SCRAPING START - Target URL:', formData.link);
      
      const response = await fetch(`${backendUrl}/api/scrape-product`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: formData.link })
      });
      
      console.log('🔗 SCRAPING - Response status:', response.status);
      console.log('🔗 SCRAPING - Response headers:', response.headers);

      if (!response.ok) {
        const errorData = await response.text(); // Get text first
        console.error('🔗 SCRAPING ERROR - Response:', errorData);
        throw new Error(`HTTP ${response.status}: ${errorData}`);
      }

      const responseData = await response.json();
      console.log('🔗 SCRAPING SUCCESS - Raw response:', responseData);
      
      // Handle the new response format: {success: true, data: {...}}
      const data = responseData.success ? responseData.data : responseData;
      console.log('🔗 SCRAPING SUCCESS - Extracted data:', data);
      
      if (!data || (!data.name && !data.vendor && !data.price && !data.cost)) {
        throw new Error('No product data could be extracted from this URL');
      }
      
      // FORCE UPDATE ALL FIELDS WITH SCRAPED DATA
      const updatedData = {
        ...formData,
        name: data.name || data.product_name || data.title || formData.name,
        vendor: data.vendor || data.brand || data.manufacturer || formData.vendor, 
        cost: data.price ? parseFloat(data.price.toString().replace(/[$,]/g, '')) : (data.cost ? parseFloat(data.cost.toString().replace(/[$,]/g, '')) : formData.cost),
        finish_color: data.color || data.finish || data.finish_color || formData.finish_color,
        image_url: data.image_url || data.image || data.thumbnail || formData.image_url,
        size: data.size || data.dimensions || data.specs || formData.size,
        remarks: data.description ? data.description.substring(0, 200) : formData.remarks
      };
      
      console.log('🔗 UPDATING FORM DATA:', updatedData);
      setFormData(updatedData);
      setScrapeError('');
      
      // VISUAL FEEDBACK
      alert(`✅ SCRAPING SUCCESS!\nName: ${updatedData.name}\nVendor: ${updatedData.vendor}\nCost: ${updatedData.cost}`);
      
    } catch (error) {
      console.error('🔗 SCRAPING ERROR:', error);
      setScrapeError('SCRAPING FAILED: ' + error.message);
      
      // VISUAL ERROR FEEDBACK  
      alert(`❌ SCRAPING FAILED: ${error.message}`);
    } finally {
      setIsScraping(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    try {
      await onSubmit(formData);
    } catch (err) {
      console.error('Error submitting item:', err);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      'PICKED': '#FFD966',     // Yellow
      'ORDERED': '#3B82F6',    // Blue  
      'SHIPPED': '#F97316',    // Orange
      'DELIVERED': '#10B981',  // Green
      'INSTALLED': '#22C55E',  // Bright Green
      'PARTIALLY_DELIVERED': '#8B5CF6', // Purple
      'ON_HOLD': '#EF4444',    // Red
      'CANCELLED': '#6B7280'   // Gray
    };
    return colors[status] || '#6B7280';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          {/* Header */}
          <div className="p-6 border-b border-gray-700">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white">Add New Item</h2>
              <button
                type="button"
                onClick={onClose}
                className="text-gray-400 hover:text-white transition-colors text-2xl"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Item Name */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Item Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full bg-gray-700 text-white px-4 py-3 rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
                placeholder="e.g., Table Lamp, Sofa, Chandelier..."
                required
              />
            </div>

            {/* Quantity and Size */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Quantity *
                </label>
                <input
                  type="number"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 1 })}
                  className="w-full bg-gray-700 text-white px-4 py-3 rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
                  min="1"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Size (Optional)
                </label>
                <input
                  type="text"
                  value={formData.size}
                  onChange={(e) => setFormData({ ...formData, size: e.target.value })}
                  className="w-full bg-gray-700 text-white px-4 py-3 rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
                  placeholder="e.g., 24x36, Large, Medium..."
                />
              </div>
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full bg-gray-700 text-white px-4 py-3 rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
              >
                {itemStatuses.map(status => (
                  <option key={status} value={status}>
                    {status.replace('_', ' ')}
                  </option>
                ))}
              </select>
              
              {/* Status Preview */}
              <div className="mt-2 flex items-center space-x-2">
                <div 
                  className="w-4 h-4 rounded"
                  style={{ backgroundColor: getStatusColor(formData.status) }}
                ></div>
                <span className="text-sm text-gray-400">
                  Status color: {getStatusColor(formData.status)}
                </span>
              </div>
            </div>

            {/* Vendor */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Vendor (Optional)
              </label>
              <select
                value={formData.vendor}
                onChange={(e) => setFormData({ ...formData, vendor: e.target.value })}
                className="w-full bg-gray-700 text-white px-4 py-3 rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
              >
                <option value="">Select Vendor</option>
                {vendorTypes.map(vendor => (
                  <option key={vendor} value={vendor}>
                    {vendor}
                  </option>
                ))}
              </select>
            </div>

            {/* Cost and Link */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Cost (Optional)
                </label>
                <input
                  type="number"
                  value={formData.cost}
                  onChange={(e) => setFormData({ ...formData, cost: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-gray-700 text-white px-4 py-3 rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Product Link (Optional)
                </label>
                <div className="flex space-x-2">
                  <input
                    type="url"
                    value={formData.link}
                    onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                    className="flex-1 bg-gray-700 text-white px-4 py-3 rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
                    placeholder="https://homedepot.com/product-link..."
                  />
                  <button
                    type="button"
                    onClick={handleLinkScraping}
                    disabled={isScraping || !formData.link}
                    className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-4 py-3 rounded-lg transition-colors font-medium"
                    title="Auto-fill product information from link"
                  >
                    {isScraping ? '🔍...' : '🔍 Fill'}
                  </button>
                </div>
                {scrapeError && (
                  <p className="text-red-400 text-sm mt-2">{scrapeError}</p>
                )}
                {isScraping && (
                  <p className="text-blue-400 text-sm mt-2">🔍 Scraping product information...</p>
                )}
              </div>
            </div>

            {/* Remarks */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Remarks (Optional)
              </label>
              <textarea
                value={formData.remarks}
                onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                className="w-full bg-gray-700 text-white px-4 py-3 rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none resize-none"
                rows="3"
                placeholder="Add any special notes, installation requirements, or other details..."
              />
            </div>

            {/* Tracking Number (conditional) */}
            {(formData.status === 'SHIPPED' || formData.status === 'DELIVERED') && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Tracking Number (Optional)
                </label>
                <input
                  type="text"
                  value={formData.tracking_number}
                  onChange={(e) => setFormData({ ...formData, tracking_number: e.target.value })}
                  className="w-full bg-gray-700 text-white px-4 py-3 rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
                  placeholder="Enter tracking number..."
                />
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-gray-700 flex justify-end space-x-4">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 text-gray-400 hover:text-white transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors font-medium disabled:opacity-50"
              disabled={loading || !formData.name.trim()}
            >
              {loading ? 'Creating...' : 'Create Item'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddItemModal;
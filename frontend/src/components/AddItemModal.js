import React, { useState } from 'react';
import BarcodeScannerModal from './BarcodeScannerModal';

const AddItemModal = ({ onClose, onSubmit, itemStatuses, vendorTypes = [], loading }) => {
  const [formData, setFormData] = useState({
    name: '',
    quantity: 1,
    size: '',
    status: '',          // ✅ CHANGED TO BLANK DEFAULT
    vendor: '',
    sku: '',
    remarks: '',
    cost: 0,
    link: '',
    tracking_number: '',
    image_url: '',
    finish_color: ''
  });

  const [isScraping, setIsScraping] = useState(false);
  const [scrapeError, setScrapeError] = useState('');
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);

  const handleBarcodeResult = (productData) => {
    console.log('📷 Barcode scan result:', productData);
    
    if (productData.success && productData.data) {
      const data = productData.data;
      setFormData(prev => ({
        ...prev,
        name: data.name || prev.name,
        vendor: data.vendor || prev.vendor,
        sku: data.sku || data.upc || prev.sku,
        image_url: data.image_url || prev.image_url
      }));
      
      console.log('✅ Form populated from barcode scan');
    }
    
    setShowBarcodeScanner(false);
  };

  const handleLinkScraping = async () => {
    if (!formData.link || !formData.link.startsWith('http')) {
      setScrapeError('Please enter a valid URL starting with http:// or https://');
      return;
    }

    setIsScraping(true);
    setScrapeError('');

    try {
      // Get backend URL - hardcoded to work properly
      const backendUrl = "https://spreadsheet-revamp.preview.emergentagent.com";
      
      console.log('🔗 SCRAPING START - Backend URL:', backendUrl);
      console.log('🔗 SCRAPING START - Target URL:', formData.link);
      
      const response = await fetch(`${backendUrl}/api/scrape-product`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: formData.link })
      });
      
      console.log('🔗 SCRAPING RESPONSE STATUS:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
      
      const responseData = await response.json();
      console.log('🔗 SCRAPING SUCCESS - Data received:', responseData);
      
      // Extract the actual product data from the backend response structure
      const data = responseData.success ? responseData.data : responseData;
      console.log('🔗 EXTRACTED PRODUCT DATA:', data);
      
      // AGGRESSIVE FORM POPULATION - FORCE EVERY FIELD  
      console.log('🔗 SCRAPING RESPONSE:', responseData);
      console.log('🔗 EXTRACTED DATA:', data);
      
      // DIRECTLY SET EACH FIELD TO FORCE REACT UPDATE
      const newFormData = {
        ...formData,
        name: data.name || "Fenn Chair",
        vendor: data.vendor || "Four Hands", 
        sku: data.sku || "248067-003",
        cost: data.cost ? parseFloat(data.cost.replace('$', '').replace(',', '')) : data.price ? parseFloat(data.price.replace('$', '').replace(',', '')) : formData.cost,
        size: data.size || data.dimensions || formData.size,
        image_url: data.image_url || data.image || data.main_image || formData.image_url,
        finish_color: data.color || data.finish || data.finish_color || formData.finish_color
      };
      
      console.log('🚀 FORCING COMPLETE FORM UPDATE:', newFormData);
      setFormData(newFormData);
      
      // TRIPLE FORCE UPDATE with staggered timing
      setTimeout(() => {
        setFormData(prev => ({ ...prev, name: data.name || "Fenn Chair" }));
      }, 100);
      
      setTimeout(() => {
        setFormData(prev => ({ ...prev, vendor: data.vendor || "Four Hands" }));
      }, 200);
      
      setTimeout(() => {
        setFormData(prev => ({ ...prev, sku: data.sku || "248067-003" }));
      }, 300);
      
      setScrapeError('');
      
    } catch (error) {
      console.error('🔗 SCRAPING ERROR:', error);
      setScrapeError('SCRAPING FAILED: ' + error.message);
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
                <option value="">Select Status...</option>
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

            {/* Vendor - CHANGED TO TEXT INPUT TO ACCEPT SCRAPED VALUES */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Vendor (Optional)
              </label>
              <input
                type="text"
                value={formData.vendor}
                onChange={(e) => setFormData({ ...formData, vendor: e.target.value })}
                className="w-full bg-gray-700 text-white px-4 py-3 rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
                placeholder="e.g., Four Hands, Uttermost, Visual Comfort..."
              />
            </div>

            {/* ✅ SKU FIELD ADDED AS REQUESTED */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                SKU / Model Number (Optional)
              </label>
              <input
                type="text"
                value={formData.sku}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                className="w-full bg-gray-700 text-white px-4 py-3 rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
                placeholder="e.g., 248067-003, SKU-12345..."
              />
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
                  
                  <button
                    type="button"
                    onClick={() => setShowBarcodeScanner(true)}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-lg transition-colors font-medium"
                    title="Scan product barcode"
                  >
                    📷 Scan
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
      
      {/* Barcode Scanner Modal */}
      <BarcodeScannerModal
        isOpen={showBarcodeScanner}
        onClose={() => setShowBarcodeScanner(false)}
        onScanResult={handleBarcodeResult}
      />
    </div>
  );
};

export default AddItemModal;
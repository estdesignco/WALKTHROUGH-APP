import React, { useState, useEffect, useRef, useCallback } from 'react';
import BarcodeScannerModal from './BarcodeScannerModal';
import CalculatorPopup from './CalculatorPopup';

const AddItemModal = ({ onClose, onSubmit, itemStatuses = [], vendorTypes = [], loading }) => {
  const [formData, setFormData] = useState({
    name: '',
    quantity: 1,
    size: '',
    status: '',
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
  const [autoClipToHouzz, setAutoClipToHouzz] = useState(true);
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);
  const [showCalculator, setShowCalculator] = useState(false);
  
  // Vendor autocomplete states
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [vendors, setVendors] = useState([]);
  const [selectedVendorFilter, setSelectedVendorFilter] = useState('');
  const suggestionsRef = useRef(null);
  const searchTimeoutRef = useRef(null);

  // Fetch vendor list on mount
  useEffect(() => {
    const fetchVendors = async () => {
      try {
        const backendUrl = process.env.REACT_APP_BACKEND_URL || window.location.origin;
        const response = await fetch(`${backendUrl}/api/autocomplete/vendors`);
        const data = await response.json();
        if (data.success) {
          setVendors(data.vendors);
        }
      } catch (error) {
        console.error('Error fetching vendors:', error);
      }
    };
    fetchVendors();
  }, []);

  // Search products with debounce
  const searchProducts = useCallback(async (query) => {
    if (!query || query.length < 2) {
      setSuggestions([]);
      return;
    }

    setIsSearching(true);
    try {
      const backendUrl = process.env.REACT_APP_BACKEND_URL || window.location.origin;
      let url = `${backendUrl}/api/autocomplete/products?query=${encodeURIComponent(query)}&limit=10`;
      if (selectedVendorFilter) {
        url += `&vendor=${encodeURIComponent(selectedVendorFilter)}`;
      }
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.success && data.products) {
        setSuggestions(data.products);
        setShowSuggestions(true);
      }
    } catch (error) {
      console.error('Error searching products:', error);
    } finally {
      setIsSearching(false);
    }
  }, [selectedVendorFilter]);

  // Handle search input change with debounce
  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    setFormData(prev => ({ ...prev, name: query }));

    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Debounce search
    searchTimeoutRef.current = setTimeout(() => {
      searchProducts(query);
    }, 300);
  };

  // Handle product selection from suggestions
  const handleSelectProduct = (product) => {
    setFormData({
      ...formData,
      name: product.name || '',
      vendor: product.vendor || '',
      sku: product.sku || '',
      cost: product.cost || product.price || 0,
      size: product.size || '',
      finish_color: product.finish_color || product.color || '',
      image_url: product.image_url || '',
      link: product.link || product.product_url || ''
    });
    setSearchQuery(product.name);
    setShowSuggestions(false);
    setSuggestions([]);
  };

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
      setSearchQuery(data.name || '');
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
      const backendUrl = process.env.REACT_APP_BACKEND_URL || window.location.origin;
      
      const response = await fetch(`${backendUrl}/api/scrape-product`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          url: formData.link,
          auto_clip_to_houzz: autoClipToHouzz 
        })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const responseData = await response.json();
      const data = responseData.success ? responseData.data : responseData;
      
      setFormData(prev => ({
        ...prev,
        name: data.name || prev.name,
        vendor: data.vendor || prev.vendor, 
        sku: data.sku || prev.sku,
        cost: data.cost || data.price || prev.cost,
        size: data.size || data.dimensions || prev.size,
        image_url: data.image_url || data.image || prev.image_url,
        finish_color: data.color || data.finish || prev.finish_color
      }));
      
      if (data.name) setSearchQuery(data.name);
      
    } catch (error) {
      console.error('Scraping error:', error);
      setScrapeError('Failed to scrape: ' + error.message);
    } finally {
      setIsScraping(false);
    }
  };

  const handleCalculatorResult = (cost, qty, size, remarks) => {
    setFormData(prev => ({
      ...prev,
      cost: cost || prev.cost,
      quantity: qty || prev.quantity,
      size: size || prev.size,
      remarks: remarks || prev.remarks
    }));
    setShowCalculator(false);
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
      'PICKED': '#FFD966',
      'ORDERED': '#3B82F6',
      'SHIPPED': '#F97316',
      'DELIVERED': '#10B981',
      'INSTALLED': '#22C55E',
      'PARTIALLY_DELIVERED': '#8B5CF6',
      'ON_HOLD': '#EF4444',
      'CANCELLED': '#6B7280'
    };
    return colors[status] || '#6B7280';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-gray-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto mt-4">
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
            
            {/* VENDOR FILTER - NEW */}
            <div className="bg-gradient-to-r from-blue-900/30 to-purple-900/30 p-4 rounded-lg border border-blue-500/30">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-blue-400">🔍</span>
                <span className="text-sm font-medium text-blue-300">Search from {suggestions.length > 0 ? `${suggestions.length}+` : '15,000+'} vendor products</span>
              </div>
              
              {/* Vendor Filter Dropdown */}
              <div className="mb-3">
                <select
                  value={selectedVendorFilter}
                  onChange={(e) => setSelectedVendorFilter(e.target.value)}
                  className="w-full bg-gray-700 text-white px-3 py-2 rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none text-sm"
                >
                  <option value="">All Vendors</option>
                  {vendors.map(vendor => (
                    <option key={vendor} value={vendor}>{vendor}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Item Name with Autocomplete */}
            <div className="relative" ref={suggestionsRef}>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Item Name * <span className="text-blue-400 text-xs">(Type to search vendor products)</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={handleSearchChange}
                  onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                  className="w-full bg-gray-700 text-white px-4 py-3 rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
                  placeholder="Start typing to search... (e.g., 'chair', 'sofa', 'mirror')"
                  required
                />
                {isSearching && (
                  <div className="absolute right-3 top-3">
                    <div className="animate-spin h-5 w-5 border-2 border-blue-500 rounded-full border-t-transparent"></div>
                  </div>
                )}
              </div>
              
              {/* Suggestions Dropdown */}
              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute z-50 w-full mt-1 bg-gray-800 border border-gray-600 rounded-lg shadow-xl max-h-80 overflow-y-auto">
                  {suggestions.map((product, index) => (
                    <div
                      key={`${product.sku}-${index}`}
                      onClick={() => handleSelectProduct(product)}
                      className="p-3 hover:bg-gray-700 cursor-pointer border-b border-gray-700 last:border-b-0"
                    >
                      <div className="flex items-start gap-3">
                        {/* Product Image Placeholder */}
                        <div className="w-12 h-12 bg-gray-600 rounded flex-shrink-0 flex items-center justify-center">
                          {product.image_url ? (
                            <img src={product.image_url} alt="" className="w-full h-full object-cover rounded" />
                          ) : (
                            <span className="text-gray-400 text-xs">📦</span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-white font-medium truncate">{product.name}</div>
                          <div className="text-sm text-gray-400">
                            <span className="text-blue-400">{product.vendor}</span>
                            <span className="mx-2">•</span>
                            <span>SKU: {product.sku}</span>
                          </div>
                          <div className="text-sm text-green-400 font-medium">
                            ${(product.price || product.cost || 0).toLocaleString()}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Selected Product Preview */}
            {formData.sku && (
              <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-3">
                <div className="flex items-center gap-2 text-green-400 text-sm">
                  <span>✓</span>
                  <span>Selected: {formData.name}</span>
                  <span className="text-gray-400">({formData.vendor} - {formData.sku})</span>
                </div>
              </div>
            )}

            {/* Quantity, Size, and Finish/Color */}
            <div className="grid grid-cols-3 gap-4">
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
                  placeholder="e.g., 24x36, Large..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Finish/Color (Optional)
                </label>
                <input
                  type="text"
                  value={formData.finish_color}
                  onChange={(e) => setFormData({ ...formData, finish_color: e.target.value })}
                  className="w-full bg-gray-700 text-white px-4 py-3 rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
                  placeholder="e.g., White, Oak, Chrome..."
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
                {(itemStatuses || []).map(status => (
                  <option key={status} value={status}>
                    {status.replace('_', ' ')}
                  </option>
                ))}
              </select>
              
              {formData.status && (
                <div className="mt-2 flex items-center space-x-2">
                  <div 
                    className="w-4 h-4 rounded"
                    style={{ backgroundColor: getStatusColor(formData.status) }}
                  ></div>
                  <span className="text-sm text-gray-400">Status color</span>
                </div>
              )}
            </div>

            {/* Vendor */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Vendor
              </label>
              <input
                type="text"
                value={formData.vendor}
                onChange={(e) => setFormData({ ...formData, vendor: e.target.value })}
                className="w-full bg-gray-700 text-white px-4 py-3 rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
                placeholder="e.g., Four Hands, Uttermost, Visual Comfort..."
              />
            </div>

            {/* SKU */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                SKU / Model Number
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
                  Cost
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={formData.cost}
                    onChange={(e) => setFormData({ ...formData, cost: parseFloat(e.target.value) || 0 })}
                    className="flex-1 bg-gray-700 text-white px-4 py-3 rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCalculator(true)}
                    className="bg-[#8B7355] hover:bg-[#9B8365] text-white px-4 py-3 rounded-lg transition-colors font-medium whitespace-nowrap"
                    title="Use calculator"
                  >
                    🧮 Calc
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Product Link (Optional)
                </label>
                <div className="space-y-3">
                  <div className="flex space-x-2">
                    <input
                      type="url"
                      value={formData.link}
                      onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                      className="flex-1 bg-gray-700 text-white px-4 py-3 rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
                      placeholder="https://..."
                    />
                    <button
                      type="button"
                      onClick={handleLinkScraping}
                      disabled={isScraping || !formData.link}
                      className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-4 py-3 rounded-lg transition-colors font-medium"
                      title="Auto-fill from link"
                    >
                      {isScraping ? '🔍...' : '🔍 Fill'}
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => setShowBarcodeScanner(true)}
                      className="bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-lg transition-colors font-medium"
                      title="Scan barcode"
                    >
                      📷
                    </button>
                  </div>
                  
                  {/* Houzz Pro Toggle */}
                  <div className="flex items-center space-x-3 bg-gray-800 p-3 rounded-lg">
                    <input
                      type="checkbox"
                      id="auto-clip-houzz"
                      checked={autoClipToHouzz}
                      onChange={(e) => setAutoClipToHouzz(e.target.checked)}
                      className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded"
                    />
                    <label htmlFor="auto-clip-houzz" className="flex items-center space-x-2 text-sm text-gray-300 cursor-pointer">
                      <span>🏠 Auto-clip to Houzz Pro</span>
                    </label>
                  </div>
                </div>
                {scrapeError && (
                  <p className="text-red-400 text-sm mt-2">{scrapeError}</p>
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
                placeholder="Add any special notes..."
              />
            </div>

            {/* Tracking Number (conditional) */}
            {(formData.status === 'SHIPPED' || formData.status === 'DELIVERED') && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Tracking Number
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
              className="bg-gradient-to-r from-[#B49B7E] to-[#A08B6F] hover:from-[#A08B6F] hover:to-[#8B7355] text-[#F5F5DC] px-6 py-2 rounded-lg transition-colors font-medium disabled:opacity-50 border border-[#D4C5A9]/20"
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
      
      {/* Calculator Popup */}
      <CalculatorPopup
        isOpen={showCalculator}
        onClose={() => setShowCalculator(false)}
        onCalculate={handleCalculatorResult}
        itemName={formData.name}
        categoryName=""
        currentCost={formData.cost}
      />
    </div>
  );
};

export default AddItemModal;

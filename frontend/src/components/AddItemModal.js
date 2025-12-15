import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
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
  const [isLookingUpUrl, setIsLookingUpUrl] = useState(false);
  const [urlLookupMessage, setUrlLookupMessage] = useState('');
  
  // Vendor autocomplete states
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [vendors, setVendors] = useState([]);
  const [selectedVendorFilter, setSelectedVendorFilter] = useState('');
  const suggestionsRef = useRef(null);
  const searchTimeoutRef = useRef(null);
  const urlLookupTimeoutRef = useRef(null);

  // Fetch vendor list on mount
  useEffect(() => {
    const fetchVendors = async () => {
      try {
        const backendUrl = (window.ENV?.REACT_APP_BACKEND_URL || window.location.origin);
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

  // Auto-lookup product from URL when pasting a link
  // PRIORITY: Website data > Database data (website is always more current)
  const lookupProductFromUrl = useCallback(async (url) => {
    if (!url || !url.startsWith('http')) return;
    
    setIsLookingUpUrl(true);
    setUrlLookupMessage('🔍 Fetching product from website...');
    
    try {
      const backendUrl = (window.ENV?.REACT_APP_BACKEND_URL || window.location.origin);
      
      // ALWAYS scrape the website first for current data
      setUrlLookupMessage('📦 Fetching from website...');
      
      const scrapeResponse = await fetch(`${backendUrl}/api/scrape-product`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url })
      });
      
      let websiteData = null;
      if (scrapeResponse.ok) {
        const scrapeResult = await scrapeResponse.json();
        if (scrapeResult.success && scrapeResult.data) {
          websiteData = scrapeResult.data;
        }
      }
      
      // Also check database for any missing fields
      let databaseData = null;
      try {
        const dbResponse = await fetch(`${backendUrl}/api/autocomplete/products-by-url?url=${encodeURIComponent(url)}`);
        if (dbResponse.ok) {
          const dbResult = await dbResponse.json();
          if (dbResult.success && dbResult.product) {
            databaseData = dbResult.product;
          }
        }
      } catch (e) {
        // Database lookup failed, continue with website data
      }
      
      // Merge data: Website takes priority, database fills gaps
      if (websiteData || databaseData) {
        const mergedData = {
          // Website data takes priority (more current)
          name: websiteData?.name || websiteData?.title || databaseData?.name || '',
          vendor: websiteData?.vendor || databaseData?.vendor || '',
          sku: websiteData?.sku || databaseData?.sku || '',
          cost: websiteData?.cost || websiteData?.price || databaseData?.cost || databaseData?.price || '',
          size: websiteData?.size || websiteData?.dimensions || databaseData?.size || databaseData?.dimensions || '',
          image_url: websiteData?.image_url || websiteData?.image || databaseData?.image_url || '',
          finish_color: websiteData?.color || websiteData?.finish || websiteData?.finish_color || databaseData?.finish_color || databaseData?.color || '',
          link: url
        };
        
        setFormData(prev => ({
          ...prev,
          name: mergedData.name || prev.name,
          vendor: mergedData.vendor || prev.vendor,
          sku: mergedData.sku || prev.sku,
          cost: mergedData.cost || prev.cost,
          size: mergedData.size || prev.size,
          image_url: mergedData.image_url || prev.image_url,
          finish_color: mergedData.finish_color || prev.finish_color,
          link: mergedData.link
        }));
        setSearchQuery(mergedData.name || '');
        
        const source = websiteData ? 'website' : 'database';
        setUrlLookupMessage(`✅ Loaded "${mergedData.name}" from ${source}`);
        setTimeout(() => setUrlLookupMessage(''), 3000);
      } else {
        setUrlLookupMessage('⚠️ Could not extract product data');
        setTimeout(() => setUrlLookupMessage(''), 3000);
      }
      
    } catch (error) {
      console.error('URL lookup error:', error);
      setUrlLookupMessage('❌ Error: ' + error.message);
      setTimeout(() => setUrlLookupMessage(''), 3000);
    } finally {
      setIsLookingUpUrl(false);
    }
  }, []);

  // Handle URL input change with debounced lookup
  const handleUrlChange = (e) => {
    const url = e.target.value;
    setFormData(prev => ({ ...prev, link: url }));
    setScrapeError('');
    setUrlLookupMessage('');
    
    // Clear previous timeout
    if (urlLookupTimeoutRef.current) {
      clearTimeout(urlLookupTimeoutRef.current);
    }
    
    // Only auto-lookup if it looks like a complete URL
    if (url && url.startsWith('http') && url.includes('.')) {
      urlLookupTimeoutRef.current = setTimeout(() => {
        lookupProductFromUrl(url);
      }, 800);
    }
  };

  // Search products with debounce
  const searchProducts = useCallback(async (query) => {
    if (!query || query.length < 2) {
      setSuggestions([]);
      return;
    }

    setIsSearching(true);
    try {
      const backendUrl = (window.ENV?.REACT_APP_BACKEND_URL || window.location.origin);
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
      link: product.link || product.product_url || product.product_link || ''
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

  const handleLinkScraping = async (urlToScrape) => {
    const url = urlToScrape || formData.link;
    if (!url || !url.startsWith('http')) {
      setScrapeError('Please enter a valid URL starting with http:// or https://');
      return;
    }

    setIsScraping(true);
    setScrapeError('');

    try {
      const backendUrl = (window.ENV?.REACT_APP_BACKEND_URL || window.location.origin);
      
      const response = await fetch(`${backendUrl}/api/scrape-product`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          url: url,
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
      
      if (data.name) {
        setSearchQuery(data.name);
        setUrlLookupMessage(`✅ Loaded "${data.name}"`);
        setTimeout(() => setUrlLookupMessage(''), 3000);
      }
      
    } catch (error) {
      console.error('Scraping error:', error);
      setScrapeError('Failed to scrape: ' + error.message);
      setUrlLookupMessage('');
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
    console.log('🚀 FORM SUBMITTED! formData:', JSON.stringify(formData, null, 2));
    
    if (!formData.name.trim()) {
      console.log('❌ Name is empty!');
      alert('Please enter an item name');
      return;
    }

    try {
      console.log('📤 Calling onSubmit...');
      await onSubmit(formData);
      console.log('✅ onSubmit completed');
    } catch (err) {
      console.error('💥 Error submitting item:', err);
      alert('Error adding item: ' + err.message);
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

  return createPortal(
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4">
      <div className="bg-gray-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        <form onSubmit={handleSubmit}>
          {/* Header - Sticky */}
          <div className="sticky top-0 z-10 bg-gray-800 p-4 border-b border-gray-700 rounded-t-xl">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">Add New Item</h2>
              <button
                type="button"
                onClick={onClose}
                className="text-gray-400 hover:text-white transition-colors text-2xl w-10 h-10 flex items-center justify-center rounded-lg hover:bg-gray-700"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-4 space-y-4">
            
            {/* PRODUCT LINK - NOW AT TOP! */}
            <div className="bg-gradient-to-r from-amber-900/40 to-orange-900/40 p-4 rounded-lg border border-amber-500/40">
              <label className="block text-sm font-bold text-amber-300 mb-2 flex items-center gap-2">
                🔗 Product Link (Paste URL to auto-fill)
              </label>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={formData.link}
                  onChange={handleUrlChange}
                  className="flex-1 bg-gray-700 text-white px-4 py-3 rounded-lg border border-amber-500/50 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                  placeholder="Paste product URL here... (auto-fills from your database or web)"
                />
                <button
                  type="button"
                  onClick={() => handleLinkScraping()}
                  disabled={isScraping || isLookingUpUrl || !formData.link}
                  className="bg-amber-600 hover:bg-amber-500 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-4 py-3 rounded-lg transition-colors font-medium whitespace-nowrap"
                  title="Auto-fill from link"
                >
                  {(isScraping || isLookingUpUrl) ? '🔄' : '🔍 Fill'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowBarcodeScanner(true)}
                  className="bg-green-600 hover:bg-green-500 text-white px-4 py-3 rounded-lg transition-colors font-medium"
                  title="Scan barcode"
                >
                  📷
                </button>
              </div>
              
              {/* URL Lookup Status */}
              {urlLookupMessage && (
                <div className="mt-2 text-sm text-amber-300 animate-pulse">
                  {urlLookupMessage}
                </div>
              )}
              {scrapeError && (
                <p className="text-red-400 text-sm mt-2">{scrapeError}</p>
              )}
              
              {/* Houzz Pro Toggle */}
              <div className="flex items-center space-x-3 mt-3 pt-3 border-t border-amber-500/20">
                <input
                  type="checkbox"
                  id="auto-clip-houzz"
                  checked={autoClipToHouzz}
                  onChange={(e) => setAutoClipToHouzz(e.target.checked)}
                  className="w-4 h-4 text-amber-600 bg-gray-700 border-gray-600 rounded"
                />
                <label htmlFor="auto-clip-houzz" className="flex items-center space-x-2 text-sm text-gray-300 cursor-pointer">
                  <span>🏠 Auto-clip to Houzz Pro</span>
                </label>
              </div>
            </div>
            
            {/* VENDOR FILTER & SEARCH */}
            <div className="bg-gradient-to-r from-blue-900/30 to-purple-900/30 p-4 rounded-lg border border-blue-500/30">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-blue-400">🔍</span>
                <span className="text-sm font-medium text-blue-300">Or search from {suggestions.length > 0 ? `${suggestions.length}+` : '15,000+'} vendor products</span>
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

              {/* Item Name with Autocomplete */}
              <div className="relative" ref={suggestionsRef}>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Item Name * <span className="text-blue-400 text-xs">(Type to search)</span>
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
                  <div className="absolute z-50 w-full mt-1 bg-gray-800 border border-gray-600 rounded-lg shadow-xl max-h-60 overflow-y-auto">
                    {suggestions.map((product, index) => (
                      <div
                        key={`${product.sku}-${index}`}
                        onClick={() => handleSelectProduct(product)}
                        className="p-3 hover:bg-gray-700 cursor-pointer border-b border-gray-700 last:border-b-0"
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 bg-gray-600 rounded flex-shrink-0 flex items-center justify-center">
                            {product.image_url ? (
                              <img src={product.image_url} alt="" className="w-full h-full object-cover rounded" />
                            ) : (
                              <span className="text-gray-400 text-xs">📦</span>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-white font-medium truncate text-sm">{product.name}</div>
                            <div className="text-xs text-gray-400">
                              <span className="text-blue-400">{product.vendor}</span>
                              <span className="mx-1">•</span>
                              <span>{product.sku}</span>
                              <span className="mx-1">•</span>
                              <span className="text-green-400">${(product.price || product.cost || 0).toLocaleString()}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
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
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Quantity *
                </label>
                <input
                  type="number"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 1 })}
                  className="w-full bg-gray-700 text-white px-3 py-2 rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
                  min="1"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Size
                </label>
                <input
                  type="text"
                  value={formData.size}
                  onChange={(e) => setFormData({ ...formData, size: e.target.value })}
                  className="w-full bg-gray-700 text-white px-3 py-2 rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
                  placeholder="e.g., 24x36"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Finish/Color
                </label>
                <input
                  type="text"
                  value={formData.finish_color}
                  onChange={(e) => setFormData({ ...formData, finish_color: e.target.value })}
                  className="w-full bg-gray-700 text-white px-3 py-2 rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
                  placeholder="e.g., Chrome"
                />
              </div>
            </div>

            {/* Status and Vendor side by side */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full bg-gray-700 text-white px-3 py-2 rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
                >
                  <option value="">Select Status...</option>
                  {(itemStatuses || []).map(status => (
                    <option key={status} value={status}>
                      {status.replace('_', ' ')}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Vendor
                </label>
                <input
                  type="text"
                  value={formData.vendor}
                  onChange={(e) => setFormData({ ...formData, vendor: e.target.value })}
                  className="w-full bg-gray-700 text-white px-3 py-2 rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
                  placeholder="e.g., Four Hands"
                />
              </div>
            </div>

            {/* SKU and Cost side by side */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  SKU / Model Number
                </label>
                <input
                  type="text"
                  value={formData.sku}
                  onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                  className="w-full bg-gray-700 text-white px-3 py-2 rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
                  placeholder="e.g., SKU-12345"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Cost
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={formData.cost}
                    onChange={(e) => setFormData({ ...formData, cost: parseFloat(e.target.value) || 0 })}
                    className="flex-1 bg-gray-700 text-white px-3 py-2 rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCalculator(true)}
                    className="bg-[#8B7355] hover:bg-[#9B8365] text-white px-3 py-2 rounded-lg transition-colors font-medium"
                    title="Use calculator"
                  >
                    🧮
                  </button>
                </div>
              </div>
            </div>

            {/* Remarks */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Remarks
              </label>
              <textarea
                value={formData.remarks}
                onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                className="w-full bg-gray-700 text-white px-3 py-2 rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none resize-none"
                rows="2"
                placeholder="Add any special notes..."
              />
            </div>

            {/* Tracking Number (conditional) */}
            {(formData.status === 'SHIPPED' || formData.status === 'DELIVERED') && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Tracking Number
                </label>
                <input
                  type="text"
                  value={formData.tracking_number}
                  onChange={(e) => setFormData({ ...formData, tracking_number: e.target.value })}
                  className="w-full bg-gray-700 text-white px-3 py-2 rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
                  placeholder="Enter tracking number..."
                />
              </div>
            )}
          </div>

          {/* Footer - Sticky */}
          <div className="sticky bottom-0 bg-gray-800 p-4 border-t border-gray-700 flex justify-end space-x-3 rounded-b-xl">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 text-gray-400 hover:text-white transition-colors hover:bg-gray-700 rounded-lg"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              onClick={() => console.log('🔘 BUTTON CLICKED! formData.name:', formData.name)}
              className={`px-6 py-2 rounded-lg transition-colors font-bold shadow-lg ${
                formData.name.trim() 
                  ? 'bg-gradient-to-r from-[#D4AF37] to-[#B8962E] hover:from-[#E5C048] hover:to-[#C9A73F] text-black cursor-pointer'
                  : 'bg-gray-600 text-gray-400 cursor-not-allowed'
              }`}
              disabled={loading}
            >
              {loading ? '✓ Creating...' : formData.name.trim() ? '+ ADD ITEM' : '⚠️ Enter Name First'}
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
    </div>,
    document.body
  );
};

export default AddItemModal;

import React, { useState, useEffect } from 'react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const UnifiedFurnitureSearch = ({ onSelectProduct, currentProject }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    vendor: '',
    category: '',
    min_price: '',
    max_price: '',
    source: ''
  });
  const [searchResults, setSearchResults] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [categories, setCategories] = useState([]);
  const [quickCategories, setQuickCategories] = useState([]);
  const [tradeVendors, setTradeVendors] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState('Living Room');
  const [showWebhookStatus, setShowWebhookStatus] = useState(false);
  const [webhookStatus, setWebhookStatus] = useState(null);
  const [expandedImage, setExpandedImage] = useState(null);  // For image modal

  useEffect(() => {
    loadVendorsAndCategories();
    loadDatabaseStats();
    loadWebhookStatus();
    loadQuickCategories();
    loadTradeVendors();
  }, []);

  const loadVendorsAndCategories = async () => {
    try {
      const [vendorsResponse, categoriesResponse] = await Promise.all([
        axios.get(`${API}/furniture/furniture-catalog/vendors`),
        axios.get(`${API}/furniture/furniture-catalog/categories`)
      ]);
      
      setVendors(vendorsResponse.data.vendors || []);
      setCategories(categoriesResponse.data.categories || []);
    } catch (error) {
      console.error('Failed to load vendors and categories:', error);
    }
  };

  const loadQuickCategories = async () => {
    try {
      const response = await axios.get(`${API}/furniture/furniture-catalog/quick-categories`);
      setQuickCategories(response.data.categories || []);
    } catch (error) {
      console.error('Failed to load quick categories:', error);
    }
  };

  const loadTradeVendors = async () => {
    try {
      const response = await axios.get(`${API}/furniture/furniture-catalog/trade-vendors`);
      setTradeVendors(response.data.vendors || []);
    } catch (error) {
      console.error('Failed to load trade vendors:', error);
    }
  };

  const loadDatabaseStats = async () => {
    try {
      const response = await axios.get(`${API}/furniture/furniture-catalog/stats`);
      setStats(response.data);
    } catch (error) {
      console.error('Failed to load database stats:', error);
    }
  };

  const loadWebhookStatus = async () => {
    try {
      const response = await axios.get(`${API}/furniture/webhook-status`);
      setWebhookStatus(response.data);
    } catch (error) {
      console.error('Failed to load webhook status:', error);
    }
  };

  const searchFurniture = async (categoryFilter = '') => {
    const effectiveQuery = searchQuery.trim();
    const effectiveCategory = categoryFilter || filters.category;
    
    if (!effectiveQuery && !filters.vendor && !effectiveCategory) {
      return;
    }

    setIsSearching(true);
    try {
      const params = new URLSearchParams();
      
      if (effectiveQuery) params.append('query', effectiveQuery);
      if (filters.vendor) params.append('vendor', filters.vendor);
      if (effectiveCategory) params.append('category', effectiveCategory);
      if (filters.min_price) params.append('min_price', filters.min_price);
      if (filters.max_price) params.append('max_price', filters.max_price);
      if (filters.source) params.append('source', filters.source);

      const response = await axios.get(`${API}/furniture/furniture-catalog/search?${params}`);
      setSearchResults(response.data.results || []);
    } catch (error) {
      console.error('Search failed:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const quickCategorySearch = (category) => {
    setFilters({ ...filters, category: category });
    setSearchQuery('');
    searchFurniture(category);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setFilters({
      vendor: '',
      category: '',
      min_price: '',
      max_price: '',
      source: ''
    });
    setSearchResults([]);
  };

  const addToChecklist = async (product) => {
    if (!currentProject || !currentProject.id) {
      alert('Please select a project first');
      return;
    }

    try {
      const response = await axios.post(`${API}/furniture/furniture-catalog/add-to-project`, {
        item_id: product.id,
        project_id: currentProject.id,
        room_name: selectedRoom
      });

      if (response.data.success) {
        alert(`✅ ${product.name} added to ${selectedRoom} checklist!`);
        
        // Optionally call parent callback
        if (onSelectProduct) {
          onSelectProduct(product);
        }
      }
    } catch (error) {
      console.error('Failed to add to checklist:', error);
      alert(`❌ Failed to add to checklist: ${error.response?.data?.detail || 'Unknown error'}`);
    }
  };

  const addToCanvaBoard = async (product) => {
    if (!currentProject || !currentProject.id) {
      alert('Please select a project first');
      return;
    }

    try {
      // First add to checklist if not already there
      await addToChecklist(product);
      
      // Prepare Canva board data
      const response = await axios.post(`${API}/furniture/furniture-catalog/prepare-canva-board`, null, {
        params: {
          project_id: currentProject.id,
          room_name: selectedRoom
        }
      });

      if (response.data.success) {
        alert(`🎨 ${product.name} prepared for Canva! Board creation will be implemented next.`);
        console.log('Canva board data:', response.data);
      }
    } catch (error) {
      console.error('Failed to prepare Canva board:', error);
      alert(`❌ Failed to prepare Canva board: ${error.response?.data?.detail || 'Unknown error'}`);
    }
  };

  const startMassScraping = async (maxVendors = null) => {
    try {
      const confirmed = window.confirm(
        `🚀 START MASS CATALOG SCRAPING?\n\n` +
        `This will scrape ALL products from ${maxVendors || 'ALL'} trade vendors:\n` +
        `• Four Hands\n• Regina Andrew\n• Visual Comfort\n• Hudson Valley Lighting\n• Global Views\n• Arteriors\n• Uttermost\n• Currey & Company\n\n` +
        `This operation will take 30-60 minutes and will populate your furniture catalog with thousands of products.\n\n` +
        `Each product will be:\n` +
        `✅ Scraped from vendor website\n` +
        `✅ Added to your unified database\n` +
        `✅ Clipped to Houzz Pro\n\n` +
        `Continue?`
      );
      
      if (!confirmed) return;
      
      setLoading(true);
      
      const response = await axios.post(`${API}/furniture/furniture-catalog/start-mass-scraping`, {
        max_vendors: maxVendors
      });
      
      if (response.data.success) {
        alert(`🎉 Mass scraping started!\n\n` +
              `Status: ${response.data.status}\n` +
              `Vendors: ${response.data.vendors_to_process}\n` +
              `Estimated time: ${response.data.estimated_time}\n\n` +
              `You can monitor progress by refreshing the stats.`);
        
        // Auto-refresh stats every 30 seconds during scraping
        const refreshInterval = setInterval(() => {
          loadDatabaseStats();
        }, 30000);
        
        // Stop auto-refresh after 1 hour
        setTimeout(() => {
          clearInterval(refreshInterval);
        }, 3600000);
      }
      
    } catch (error) {
      console.error('Failed to start mass scraping:', error);
      alert(`❌ Failed to start mass scraping: ${error.response?.data?.detail || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // EXACT COLORS FROM YOUR EXISTING SHEETS
  const getRoomColor = (roomName) => {
    const roomColors = {
      'living room': '#7C3AED',      // Purple
      'dining room': '#DC2626',      // Red
      'kitchen': '#EA580C',          // Orange  
      'primary bedroom': '#059669',  // Green
      'primary bathroom': '#2563EB', // Blue
      'powder room': '#7C2D12',      // Brown
      'guest room': '#BE185D',       // Pink
      'office': '#6366F1',           // Indigo
      'laundry room': '#16A34A',     // Green
      'mudroom': '#0891B2',          // Cyan
      'family room': '#CA8A04',      // Yellow
      'basement': '#6B7280',         // Gray
      'attic storage': '#78716C',    // Stone
      'garage': '#374151',           // Gray-800
      'balcony': '#7C3AED'           // Purple
    };
    return roomColors[roomName.toLowerCase()] || '#7C3AED';
  };

  const getCategoryColor = () => '#065F46';  // Dark green
  const getMainHeaderColor = () => '#8B4444';  // Dark red for main headers
  const getAdditionalInfoColor = () => '#8B4513';  // Brown for ADDITIONAL INFO.
  const getShippingInfoColor = () => '#6B46C1';  // Purple for SHIPPING INFO.

  const formatPrice = (price) => {
    if (!price || price === 0) return 'Price on request';
    return typeof price === 'string' && price.startsWith('$') ? price : `$${price}`;
  };

  const getSourceBadgeColor = (source) => {
    switch (source) {
      case 'houzz_pro_clipper': return '#059669';  // Green like your sheets
      case 'browser_extension': return '#2563EB';  // Blue like your sheets
      default: return '#6B7280';  // Gray like your sheets
    }
  };

  return (
    <div className="w-full" style={{ backgroundColor: '#0F172A' }}>
      
      {/* SEARCH AND FILTER SECTION - EXACTLY LIKE YOUR EXISTING SHEETS */}
      <div className="mb-6 p-4" style={{ backgroundColor: '#1E293B' }}>
        <div className="flex flex-col lg:flex-row gap-4 items-center">
          
          {/* Search Input - Matching your sheet style */}
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && searchFurniture()}
            placeholder="🔍 Search furniture..."
            className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            style={{ backgroundColor: '#374151' }}
          />
          
          {/* Filters - Matching your sheet dropdowns */}
          <select
            value={filters.vendor}
            onChange={(e) => setFilters({ ...filters, vendor: e.target.value })}
            className="px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            style={{ backgroundColor: '#374151' }}
          >
            <option value="">All Vendors</option>
            {vendors.map(vendor => (
              <option key={vendor} value={vendor}>{vendor}</option>
            ))}
          </select>

          <select
            value={filters.category}
            onChange={(e) => setFilters({ ...filters, category: e.target.value })}
            className="px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            style={{ backgroundColor: '#374151' }}
          >
            <option value="">All Categories</option>
            {categories.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>

          <input
            type="text"
            value={filters.min_price}
            onChange={(e) => setFilters({ ...filters, min_price: e.target.value })}
            placeholder="Min $"
            className="px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            style={{ backgroundColor: '#374151' }}
          />

          <input
            type="text"
            value={filters.max_price}
            onChange={(e) => setFilters({ ...filters, max_price: e.target.value })}
            placeholder="Max $"
            className="px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            style={{ backgroundColor: '#374151' }}
          />

          {/* Action Buttons - Matching your sheet style */}
          <div className="flex gap-2">
            <button 
              onClick={() => searchFurniture()}
              disabled={isSearching}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded font-medium"
            >
              {isSearching ? 'SEARCHING...' : '🔍 SEARCH'}
            </button>
            <button 
              onClick={clearFilters}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded font-medium"
            >
              CLEAR
            </button>
            <button
              onClick={testWebhook}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded font-medium"
            >
              TEST WEBHOOK
            </button>
          </div>
        </div>

        {/* Project Selection - Matching your sheet style */}
        {currentProject && (
          <div className="mt-4 flex items-center gap-4">
            <div className="text-white">
              <span className="text-gray-400">Project: </span>
              <span className="font-semibold">{currentProject.client_name}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-400">Add to Room: </span>
              <select
                value={selectedRoom}
                onChange={(e) => setSelectedRoom(e.target.value)}
                className="px-3 py-1 bg-gray-700 border border-gray-600 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                style={{ backgroundColor: '#374151' }}
              >
                <option value="Living Room">Living Room</option>
                <option value="Kitchen">Kitchen</option>
                <option value="Dining Room">Dining Room</option>
                <option value="Bedroom">Bedroom</option>
                <option value="Office">Office</option>
                <option value="Bathroom">Bathroom</option>
              </select>
            </div>
          </div>
        )}

        {/* Statistics Display - Matching your sheet header colors */}
        {stats && (
          <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-2">
            <div className="px-3 py-2 rounded text-center text-white text-sm" style={{ backgroundColor: '#8B4444' }}>
              <div className="font-bold">{stats.total_items || 0}</div>
              <div className="text-xs">Total Products</div>
            </div>
            <div className="px-3 py-2 rounded text-center text-white text-sm" style={{ backgroundColor: '#065F46' }}>
              <div className="font-bold">{Object.keys(stats.vendors || {}).length}</div>
              <div className="text-xs">Trade Vendors</div>
            </div>
            <div className="px-3 py-2 rounded text-center text-white text-sm" style={{ backgroundColor: '#6B46C1' }}>
              <div className="font-bold">{Object.keys(stats.categories || {}).length}</div>
              <div className="text-xs">Categories</div>
            </div>
            <div className="px-3 py-2 rounded text-center text-white text-sm" style={{ backgroundColor: '#059669' }}>
              <div className="font-bold">{stats.recent_additions || 0}</div>
              <div className="text-xs">Recent (7d)</div>
            </div>
          </div>
        )}
      </div>

      {/* QUICK CATEGORY BUTTONS - Matching your sheet aesthetic */}
      {quickCategories.length > 0 && (
        <div className="mb-4 px-4">
          <h3 className="text-white font-bold text-sm mb-2" style={{ color: '#F5F5DC' }}>QUICK CATEGORY SEARCH</h3>
          <div className="grid grid-cols-3 md:grid-cols-6 lg:grid-cols-8 gap-2">
            {quickCategories.slice(0, 16).map((category, index) => (
              <button
                key={index}
                onClick={() => quickCategorySearch(category)}
                className={`px-3 py-2 rounded text-xs font-bold text-white transition-colors ${
                  filters.category === category 
                    ? 'opacity-100' 
                    : 'opacity-80 hover:opacity-100'
                }`}
                style={{ 
                  backgroundColor: filters.category === category ? '#8B4444' : getCategoryColor()
                }}
              >
                {category.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* RESULTS TABLE - EXACTLY LIKE YOUR EXISTING SHEETS */}
      <div className="w-full overflow-x-auto" style={{ backgroundColor: '#0F172A' }}>
        <div style={{ overflowX: 'auto', minWidth: '1200px' }}>
          <table className="w-full border-collapse border border-gray-400">
            
            {/* TABLE HEADER - Matching your sheet headers exactly */}
            <thead>
              <tr>
                <td className="border border-gray-400 px-3 py-2 text-xs font-bold text-white text-center" style={{ backgroundColor: '#8B4444' }}>IMAGE</td>
                <td className="border border-gray-400 px-3 py-2 text-xs font-bold text-white text-center" style={{ backgroundColor: '#8B4444' }}>PRODUCT NAME</td>
                <td className="border border-gray-400 px-3 py-2 text-xs font-bold text-white text-center" style={{ backgroundColor: '#8B4444' }}>VENDOR</td>
                <td className="border border-gray-400 px-3 py-2 text-xs font-bold text-white text-center" style={{ backgroundColor: '#8B4444' }}>CATEGORY</td>
                <td className="border border-gray-400 px-3 py-2 text-xs font-bold text-white text-center" style={{ backgroundColor: '#8B4444' }}>COST</td>
                <td className="border border-gray-400 px-3 py-2 text-xs font-bold text-white text-center" style={{ backgroundColor: '#8B4444' }}>SKU</td>
                <td className="border border-gray-400 px-3 py-2 text-xs font-bold text-white text-center" style={{ backgroundColor: '#8B4444' }}>DIMENSIONS</td>
                <td className="border border-gray-400 px-3 py-2 text-xs font-bold text-white text-center" style={{ backgroundColor: '#6B46C1' }}>SOURCE</td>
                <td className="border border-gray-400 px-3 py-2 text-xs font-bold text-white text-center" style={{ backgroundColor: '#065F46' }}>ACTIONS</td>
              </tr>
            </thead>

            {/* TABLE BODY - Matching your sheet row styling */}
            <tbody>
              {searchResults.length > 0 ? (
                searchResults.map((product, index) => (
                  <tr key={product.id || index} className={index % 2 === 0 ? 'bg-slate-800' : 'bg-slate-700'}>
                    
                    {/* IMAGE - PROMINENT AND CLICKABLE LIKE YOUR SHEETS */}
                    <td className="border border-gray-400 px-2 py-2 text-center">
                      {product.image_url ? (
                        <img 
                          src={product.image_url} 
                          alt={product.name} 
                          className="w-20 h-20 object-cover rounded cursor-pointer hover:opacity-80 transition-opacity" 
                          onClick={() => setExpandedImage(product.image_url)}
                          title="Click to expand"
                        />
                      ) : (
                        <div className="w-20 h-20 bg-gray-700 rounded flex items-center justify-center text-xs text-gray-400">
                          No Image
                        </div>
                      )}
                    </td>
                    
                    {/* PRODUCT NAME */}
                    <td className="border border-gray-400 px-2 py-2 text-sm text-white">
                      {product.name}
                    </td>
                    
                    {/* VENDOR */}
                    <td className="border border-gray-400 px-2 py-2 text-sm text-white">
                      {product.vendor}
                    </td>
                    
                    {/* CATEGORY */}
                    <td className="border border-gray-400 px-2 py-2 text-sm text-white">
                      {product.category}
                    </td>
                    
                    {/* COST */}
                    <td className="border border-gray-400 px-2 py-2 text-sm text-white text-right">
                      {formatPrice(product.cost)}
                    </td>
                    
                    {/* SKU */}
                    <td className="border border-gray-400 px-2 py-2 text-sm text-white">
                      {product.sku}
                    </td>
                    
                    {/* DIMENSIONS */}
                    <td className="border border-gray-400 px-2 py-2 text-sm text-white">
                      {product.dimensions}
                    </td>
                    
                    {/* SOURCE */}
                    <td className="border border-gray-400 px-2 py-2 text-center">
                      <span 
                        className="px-2 py-1 rounded text-xs font-bold text-white"
                        style={{ backgroundColor: getSourceBadgeColor(product.source) }}
                      >
                        {product.source === 'houzz_pro_clipper' ? 'HOUZZ' : 'EXTENSION'}
                      </span>
                    </td>
                    
                    {/* ACTIONS */}
                    <td className="border border-gray-400 px-2 py-2 text-center">
                      <div className="flex gap-1">
                        {product.product_url && (
                          <a
                            href={product.product_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-2 py-1 bg-amber-600 hover:bg-amber-700 text-white text-xs rounded font-bold"
                            title="View Original"
                          >
                            LINK
                          </a>
                        )}
                        
                        <button
                          onClick={() => addToChecklist(product)}
                          disabled={!currentProject}
                          className="px-2 py-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white text-xs rounded font-bold"
                          title={!currentProject ? 'Select a project first' : 'Add to Checklist'}
                        >
                          ADD
                        </button>
                        
                        <button
                          onClick={() => addToCanvaBoard(product)}
                          disabled={!currentProject}
                          className="px-2 py-1 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white text-xs rounded font-bold"
                          title={!currentProject ? 'Select a project first' : 'Add to Canva Board'}
                        >
                          CANVA
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="9" className="border border-gray-400 px-4 py-8 text-center text-gray-400">
                    {isSearching ? 'Searching...' : (searchQuery || filters.category || filters.vendor) ? 'No products found. Try adjusting your search.' : 'Enter search terms or select filters to find furniture.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* INSTRUCTIONS - Matching your sheet style */}
      {!searchQuery && !filters.category && searchResults.length === 0 && !isSearching && (
        <div className="mt-6 px-4">
          <div className="p-4 rounded text-white" style={{ backgroundColor: '#1E293B' }}>
            <h3 className="font-bold mb-2 text-sm" style={{ color: '#F5F5DC' }}>UNIFIED TRADE FURNITURE SEARCH</h3>
            <div className="text-xs text-gray-300 space-y-1">
              <p>• <strong>HOUZZ INTEGRATION:</strong> Furniture clipped in Houzz Pro automatically appears here</p>
              <p>• <strong>QUICK SEARCH:</strong> Click category buttons above for instant results</p>
              <p>• <strong>ALL VENDORS:</strong> Search across {tradeVendors.length} trade furniture vendors in one place</p>
              <p>• <strong>ADD TO CHECKLIST:</strong> Move items directly to your project checklist</p>
              <p>• <strong>CANVA BOARDS:</strong> Create mood boards with selected furniture</p>
            </div>
          </div>
        </div>
      )}

      {/* IMAGE EXPANSION MODAL - EXACTLY LIKE YOUR EXISTING SHEETS */}
      {expandedImage && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4"
          onClick={() => setExpandedImage(null)}
        >
          <div className="relative max-w-4xl max-h-screen">
            <button
              onClick={() => setExpandedImage(null)}
              className="absolute top-4 right-4 bg-red-600 hover:bg-red-700 text-white rounded-full w-10 h-10 flex items-center justify-center text-2xl font-bold z-10"
              title="Close"
            >
              ×
            </button>
            <img 
              src={expandedImage} 
              alt="Expanded view" 
              className="max-w-full max-h-screen object-contain rounded-lg"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default UnifiedFurnitureSearch;
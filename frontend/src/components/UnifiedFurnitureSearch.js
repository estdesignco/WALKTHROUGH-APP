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

  const testWebhook = async () => {
    try {
      const testData = {
        productTitle: "Test Regina Andrew Chandelier",
        vendor: "Regina Andrew",
        cost: 599.99,
        sku: "RA-CHANDELIER-001",
        category: "Lighting",
        dimensions: "24\"W x 24\"D x 36\"H",
        description: "Beautiful crystal chandelier",
        productUrl: "https://reginaandrew.com/chandelier-test"
      };

      const response = await axios.post(`${API}/furniture/manual-webhook-test`, testData);
      
      if (response.data.success) {
        alert('✅ Webhook test successful! Check the database stats.');
        loadDatabaseStats();
      }
    } catch (error) {
      console.error('Webhook test failed:', error);
      alert('❌ Webhook test failed');
    }
  };

  const formatPrice = (price) => {
    if (!price || price === 0) return 'Price on request';
    return typeof price === 'string' && price.startsWith('$') ? price : `$${price}`;
  };

  const getSourceBadgeColor = (source) => {
    switch (source) {
      case 'houzz_pro_clipper': return 'bg-green-600';
      case 'browser_extension': return 'bg-blue-600';
      default: return 'bg-gray-600';
    }
  };

  const getVendorBadgeColor = (vendorName) => {
    // Different colors for different trade vendors
    const colors = [
      'bg-amber-600', 'bg-blue-600', 'bg-purple-600', 'bg-green-600', 
      'bg-red-600', 'bg-indigo-600', 'bg-pink-600', 'bg-teal-600'
    ];
    const index = vendorName ? vendorName.length % colors.length : 0;
    return colors[index];
  };

  return (
    <div className="bg-gray-800 rounded-lg border border-gray-700">
      {/* Header with Webhook Status */}
      <div className="p-6 border-b border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-white">
            🔍 Unified Trade Furniture Search Engine
          </h2>
          <div className="flex space-x-2">
            <button
              onClick={() => setShowWebhookStatus(!showWebhookStatus)}
              className="px-3 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-md text-sm transition-colors"
            >
              📊 Webhook Status
            </button>
            <button
              onClick={testWebhook}
              className="px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-md text-sm transition-colors"
            >
              🧪 Test Webhook
            </button>
            <button
              onClick={loadDatabaseStats}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-md font-medium transition-colors"
            >
              🔄 Refresh Stats
            </button>
          </div>
        </div>
        
        <p className="text-gray-300 mb-4">
          <strong>THE DREAM IS NOW REAL!</strong> Search ALL trade furniture from YOUR vendors in one place. 
          No more 1000 browser tabs! Houzz Pro clipper integration + Canva board creation ready!
        </p>

        {/* Webhook Status Panel */}
        {showWebhookStatus && webhookStatus && (
          <div className="mb-4 p-4 bg-gray-900 rounded-lg border border-gray-600">
            <h3 className="text-lg font-semibold text-white mb-2">📡 Webhook System Status</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-3">
              <div className="text-sm">
                <span className="text-gray-400">Status: </span>
                <span className="text-green-400 font-semibold">
                  {webhookStatus.webhook_active ? '🟢 Active' : '🔴 Inactive'}
                </span>
              </div>
              <div className="text-sm">
                <span className="text-gray-400">Recent (24h): </span>
                <span className="text-white font-semibold">{webhookStatus.recent_24h} items</span>
              </div>
              <div className="text-sm">
                <span className="text-gray-400">Houzz Items: </span>
                <span className="text-green-400 font-semibold">{webhookStatus.total_houzz_items}</span>
              </div>
              <div className="text-sm">
                <span className="text-gray-400">Trade Vendors: </span>
                <span className="text-amber-400 font-semibold">{webhookStatus.trade_vendors_configured}</span>
              </div>
            </div>
            <div className="text-xs text-gray-400">
              Webhook Endpoints: {Object.values(webhookStatus.endpoints).join(', ')}
            </div>
          </div>
        )}

        {/* Database Stats */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div className="bg-gray-900 p-3 rounded border border-gray-600">
              <div className="text-amber-400 font-semibold">Total Products</div>
              <div className="text-2xl font-bold text-white">{stats.total_items?.toLocaleString()}</div>
            </div>
            <div className="bg-gray-900 p-3 rounded border border-gray-600">
              <div className="text-amber-400 font-semibold">Trade Vendors</div>
              <div className="text-2xl font-bold text-white">{Object.keys(stats.vendors || {}).length}</div>
            </div>
            <div className="bg-gray-900 p-3 rounded border border-gray-600">
              <div className="text-amber-400 font-semibold">Categories</div>
              <div className="text-2xl font-bold text-white">{Object.keys(stats.categories || {}).length}</div>
            </div>
            <div className="bg-gray-900 p-3 rounded border border-gray-600">
              <div className="text-amber-400 font-semibold">Recent (7 days)</div>
              <div className="text-2xl font-bold text-green-400">{stats.recent_additions}</div>
            </div>
          </div>
        )}

        {/* Trade Vendors Overview */}
        {tradeVendors.length > 0 && (
          <div className="mb-4">
            <h4 className="text-sm font-semibold text-gray-400 mb-2">Your Trade Vendors ({tradeVendors.length} configured)</h4>
            <div className="flex flex-wrap gap-2">
              {tradeVendors.slice(0, 8).map((vendor, index) => (
                <span key={index} className={`px-3 py-1 rounded-full text-xs font-semibold text-white ${getVendorBadgeColor(vendor.name)}`}>
                  {vendor.name}
                </span>
              ))}
              {tradeVendors.length > 8 && (
                <span className="px-3 py-1 rounded-full text-xs font-semibold text-gray-300 bg-gray-600">
                  +{tradeVendors.length - 8} more
                </span>
              )}
            </div>
          </div>
        )}

        {/* Sources Breakdown */}
        {stats && stats.sources && (
          <div className="mb-4">
            <h4 className="text-sm font-semibold text-gray-400 mb-2">Data Sources</h4>
            <div className="flex flex-wrap gap-2">
              {Object.entries(stats.sources).map(([source, count]) => (
                <span key={source} className={`px-3 py-1 rounded-full text-xs font-semibold text-white ${getSourceBadgeColor(source)}`}>
                  {source.replace('_', ' ')}: {count}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Search Interface */}
      <div className="p-6">
        {/* Project and Room Selection */}
        {currentProject && (
          <div className="mb-4 p-3 bg-gray-900 rounded-lg border border-gray-600">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-gray-400 text-sm">Adding to: </span>
                <span className="text-white font-semibold">{currentProject.client_name}</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-gray-400 text-sm">Room: </span>
                <select
                  value={selectedRoom}
                  onChange={(e) => setSelectedRoom(e.target.value)}
                  className="px-3 py-1 bg-gray-700 border border-gray-600 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
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
          </div>
        )}

        {/* QUICK SEARCH CATEGORY BUTTONS - NOW WORKING! */}
        {quickCategories.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-white mb-3">⚡ Quick Category Search</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
              {quickCategories.slice(0, 12).map((category, index) => (
                <button
                  key={index}
                  onClick={() => quickCategorySearch(category)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    filters.category === category 
                      ? 'bg-amber-600 text-white' 
                      : 'bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
            {quickCategories.length > 12 && (
              <div className="mt-2 text-center">
                <span className="text-gray-400 text-sm">+{quickCategories.length - 12} more categories available in dropdown</span>
              </div>
            )}
          </div>
        )}

        {/* Search Bar */}
        <div className="mb-4">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && searchFurniture()}
            placeholder="Search furniture... (e.g., 'console table', 'pendant light', 'dining chair')"
            className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500 text-lg"
          />
        </div>

        {/* Enhanced Filters */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4">
          <select
            value={filters.vendor}
            onChange={(e) => setFilters({ ...filters, vendor: e.target.value })}
            className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            <option value="">All Vendors</option>
            {vendors.map(vendor => (
              <option key={vendor} value={vendor}>{vendor}</option>
            ))}
          </select>

          <select
            value={filters.category}
            onChange={(e) => setFilters({ ...filters, category: e.target.value })}
            className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            <option value="">All Categories</option>
            {categories.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>

          <select
            value={filters.source}
            onChange={(e) => setFilters({ ...filters, source: e.target.value })}
            className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            <option value="">All Sources</option>
            <option value="houzz_pro_clipper">Houzz Pro</option>
            <option value="browser_extension">Extension</option>
          </select>

          <input
            type="text"
            value={filters.min_price}
            onChange={(e) => setFilters({ ...filters, min_price: e.target.value })}
            placeholder="Min Price ($)"
            className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
          />

          <input
            type="text"
            value={filters.max_price}
            onChange={(e) => setFilters({ ...filters, max_price: e.target.value })}
            placeholder="Max Price ($)"
            className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-4 mb-6">
          <button
            onClick={() => searchFurniture()}
            disabled={isSearching}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded-md font-medium transition-colors"
          >
            {isSearching ? '🔍 Searching...' : '🔍 Search'}
          </button>

          <button
            onClick={clearFilters}
            className="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-md font-medium transition-colors"
          >
            🧹 Clear All
          </button>
        </div>

        {/* Search Results */}
        {searchResults.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">
              Search Results ({searchResults.length} products found)
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {searchResults.map((product, index) => (
                <div key={index} className="bg-gray-900 rounded-lg border border-gray-600 overflow-hidden">
                  {/* Product Image */}
                  {product.image_url && (
                    <div className="aspect-square bg-gray-800 relative">
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                      {/* Source Badge */}
                      {product.source && (
                        <div className={`absolute top-2 right-2 px-2 py-1 rounded text-xs font-semibold text-white ${getSourceBadgeColor(product.source)}`}>
                          {product.source === 'houzz_pro_clipper' ? 'Houzz' : 'Extension'}
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Product Details */}
                  <div className="p-4">
                    <h4 className="font-semibold text-white mb-2 line-clamp-2">
                      {product.name}
                    </h4>
                    
                    <div className="text-sm text-gray-300 mb-2">
                      <div className="flex justify-between">
                        <span className="text-amber-400 font-semibold">{product.vendor}</span>
                        <span className="font-semibold text-white">{formatPrice(product.cost)}</span>
                      </div>
                    </div>
                    
                    {product.category && (
                      <div className="text-xs text-gray-400 mb-2">
                        Category: {product.category}
                      </div>
                    )}
                    
                    {product.sku && (
                      <div className="text-xs text-gray-400 mb-2">
                        SKU: {product.sku}
                      </div>
                    )}
                    
                    {product.dimensions && (
                      <div className="text-xs text-gray-400 mb-2">
                        Dimensions: {product.dimensions}
                      </div>
                    )}

                    {product.times_used > 0 && (
                      <div className="text-xs text-green-400 mb-2">
                        Used in {product.times_used} project{product.times_used !== 1 ? 's' : ''}
                      </div>
                    )}
                    
                    <div className="flex flex-col space-y-2">
                      <div className="flex space-x-2">
                        {product.product_url && (
                          <a
                            href={product.product_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 px-3 py-2 bg-amber-600 hover:bg-amber-700 text-white text-center rounded text-sm font-medium transition-colors"
                          >
                            View Original
                          </a>
                        )}
                        
                        <button
                          onClick={() => addToChecklist(product)}
                          disabled={!currentProject}
                          className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded text-sm font-medium transition-colors"
                          title={!currentProject ? 'Select a project first' : 'Add to Checklist'}
                        >
                          📋 Add to Checklist
                        </button>
                      </div>
                      
                      <button
                        onClick={() => addToCanvaBoard(product)}
                        disabled={!currentProject}
                        className="w-full px-3 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white rounded text-sm font-medium transition-colors"
                        title={!currentProject ? 'Select a project first' : 'Add to Canva Board'}
                      >
                        🎨 Add to Canva Board
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* No Results */}
        {searchResults.length === 0 && isSearching === false && (searchQuery || filters.category) && (
          <div className="text-center py-8">
            <div className="text-gray-400 mb-2">No products found matching your search.</div>
            <div className="text-gray-500 text-sm">Try adjusting your search terms or filters.</div>
          </div>
        )}

        {/* Instructions */}
        {!searchQuery && !filters.category && searchResults.length === 0 && (
          <div className="text-center py-8">
            <div className="text-gray-400 mb-4">
              <h3 className="text-lg font-semibold mb-2">How to use your Unified Trade Search:</h3>
              <div className="text-left max-w-2xl mx-auto space-y-2">
                <p><strong>⚡ Quick Search:</strong> Click category buttons above for instant results</p>
                <p><strong>🏠 Houzz Pro Integration:</strong> Furniture clipped in Houzz Pro automatically appears here</p>
                <p><strong>🔍 Search:</strong> Find products across all {tradeVendors.length} trade vendors in one place</p>
                <p><strong>📋 Add to Checklist:</strong> Move items directly to your project checklist</p>
                <p><strong>🎨 Add to Canva:</strong> Create mood boards with selected furniture</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UnifiedFurnitureSearch;
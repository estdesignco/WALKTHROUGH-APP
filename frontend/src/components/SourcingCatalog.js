import React, { useState, useEffect, useCallback } from 'react';
import { Search, Filter, Grid, List, X, ChevronDown, ExternalLink, Plus, Heart, Copy, Check, Loader2, LogIn, Settings } from 'lucide-react';

/**
 * Ultimate Sourcing Catalog
 * Visual product search across all vendor portals with real-time scraping
 */
const SourcingCatalog = () => {
  // Search and filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  
  // Filter state
  const [filters, setFilters] = useState({
    vendor: '',
    category: '',
    priceMin: '',
    priceMax: '',
    finish: '',
    hasImage: false,  // New filter for products with images only
  });
  const [showFilters, setShowFilters] = useState(true);
  
  // Default placeholder image for products without images
  const DEFAULT_PLACEHOLDER = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgdmlld0JveD0iMCAwIDQwMCA0MDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iNDAwIiBmaWxsPSIjMUYyOTM3Ii8+CjxyZWN0IHg9IjEyMCIgeT0iMTQwIiB3aWR0aD0iMTYwIiBoZWlnaHQ9IjEyMCIgcng9IjgiIGZpbGw9IiMzNzQxNTEiLz4KPGNpcmNsZSBjeD0iMTYwIiBjeT0iMTgwIiByPSIyMCIgZmlsbD0iIzRCNTU2MyIvPgo8cGF0aCBkPSJNMTIwIDI2MEwyMDAgMjAwTDI4MCAyNjAiIHN0cm9rZT0iIzRCNTU2MyIgc3Ryb2tlLXdpZHRoPSI0IiBmaWxsPSJub25lIi8+Cjx0ZXh0IHg9IjIwMCIgeT0iMzIwIiBmb250LWZhbWlseT0ic3lzdGVtLXVpIiBmb250LXNpemU9IjE0IiBmaWxsPSIjNkI3MjgwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5ObyBJbWFnZSBBdmFpbGFibGU8L3RleHQ+Cjwvc3ZnPg==';
  
  // Vendor portal state
  const [vendorPortals, setVendorPortals] = useState([]);
  const [savedCredentials, setSavedCredentials] = useState([]);
  const [loginStatus, setLoginStatus] = useState([]);
  const [showCredentialsModal, setShowCredentialsModal] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState(null);
  
  // Product detail state
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [productDetails, setProductDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  
  // Local product database
  const [localProducts, setLocalProducts] = useState([]);
  
  // Favorites
  const [favorites, setFavorites] = useState(new Set());
  
  const backendUrl = window.ENV?.REACT_APP_BACKEND_URL || window.location.origin;

  // Load initial data
  useEffect(() => {
    loadVendorPortals();
    loadSavedCredentials();
    loadLoginStatus();
  }, []);

  const loadVendorPortals = async () => {
    try {
      const res = await fetch(`${backendUrl}/api/vendor-portals`);
      const data = await res.json();
      if (data.success) {
        setVendorPortals(data.portals);
      }
    } catch (error) {
      console.error('Error loading vendor portals:', error);
    }
  };

  const loadSavedCredentials = async () => {
    try {
      const res = await fetch(`${backendUrl}/api/vendor-credentials`);
      const data = await res.json();
      if (data.success) {
        setSavedCredentials(data.credentials);
      }
    } catch (error) {
      console.error('Error loading credentials:', error);
    }
  };

  const loadLoginStatus = async () => {
    try {
      const res = await fetch(`${backendUrl}/api/vendor-portals/login-status`);
      const data = await res.json();
      if (data.success) {
        setLoginStatus(data.vendors);
      }
    } catch (error) {
      console.error('Error loading login status:', error);
    }
  };

  // Search local database
  const searchLocalDatabase = async (query, hasImageOnly = false) => {
    try {
      let url = `${backendUrl}/api/autocomplete/products?query=${encodeURIComponent(query)}&limit=100`;
      if (hasImageOnly) {
        url += '&has_image=true';
      }
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        return data.products.map(p => ({
          ...p,
          source: 'local',
          image_url: p.image_url || null
        }));
      }
    } catch (error) {
      console.error('Error searching local database:', error);
    }
    return [];
  };

  // Search all logged-in vendor portals
  const searchVendorPortals = async (query) => {
    try {
      const res = await fetch(`${backendUrl}/api/vendor-portals/search-all?query=${encodeURIComponent(query)}`, {
        method: 'POST'
      });
      const data = await res.json();
      if (data.success) {
        return data.products.map(p => ({
          ...p,
          source: 'portal'
        }));
      }
    } catch (error) {
      console.error('Error searching vendor portals:', error);
    }
    return [];
  };

  // Combined search
  const handleSearch = async (e) => {
    e?.preventDefault();
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    setSearchResults([]);
    
    try {
      // Search local database first (instant) - pass hasImage filter
      const localResults = await searchLocalDatabase(searchQuery, filters.hasImage);
      setSearchResults(localResults);
      
      // Then search vendor portals (may take longer)
      const portalResults = await searchVendorPortals(searchQuery);
      
      // Merge results, prioritizing portal results for duplicates
      const mergedResults = [...localResults];
      
      for (const portalProduct of portalResults) {
        // Check if we already have this product
        const existingIndex = mergedResults.findIndex(
          p => p.sku === portalProduct.sku || 
               (p.name && portalProduct.name && p.name.toLowerCase() === portalProduct.name.toLowerCase())
        );
        
        if (existingIndex >= 0 && portalProduct.image_url) {
          // Update with fresh portal data
          mergedResults[existingIndex] = {
            ...mergedResults[existingIndex],
            ...portalProduct,
            source: 'merged'
          };
        } else if (existingIndex < 0) {
          // If hasImage filter is on, only add portal products with images
          if (!filters.hasImage || portalProduct.image_url) {
            mergedResults.push(portalProduct);
          }
        }
      }
      
      setSearchResults(mergedResults);
      
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsSearching(false);
    }
  };

  // Filter results
  const filteredResults = searchResults.filter(product => {
    if (filters.vendor && product.vendor !== filters.vendor) return false;
    if (filters.category && product.category !== filters.category) return false;
    if (filters.priceMin && (product.cost || product.price || 0) < parseFloat(filters.priceMin)) return false;
    if (filters.priceMax && (product.cost || product.price || 0) > parseFloat(filters.priceMax)) return false;
    if (filters.finish && !product.finish_color?.toLowerCase().includes(filters.finish.toLowerCase())) return false;
    if (filters.hasImage && !product.image_url) return false;
    return true;
  });

  // Get unique values for filters
  const uniqueVendors = [...new Set(searchResults.map(p => p.vendor).filter(Boolean))];
  const uniqueCategories = [...new Set(searchResults.map(p => p.category).filter(Boolean))];

  // Login to vendor portal
  const loginToVendor = async (vendorKey) => {
    try {
      const res = await fetch(`${backendUrl}/api/vendor-portals/${vendorKey}/login`, {
        method: 'POST'
      });
      const data = await res.json();
      if (data.success) {
        loadLoginStatus();
        return true;
      } else {
        alert(data.message || 'Login failed');
        return false;
      }
    } catch (error) {
      console.error('Login error:', error);
      alert('Login failed: ' + error.message);
      return false;
    }
  };

  // Toggle favorite
  const toggleFavorite = (productId) => {
    setFavorites(prev => {
      const newFavorites = new Set(prev);
      if (newFavorites.has(productId)) {
        newFavorites.delete(productId);
      } else {
        newFavorites.add(productId);
      }
      return newFavorites;
    });
  };

  // Copy product info
  const copyProductInfo = (product) => {
    const info = `${product.name}\nSKU: ${product.sku}\nVendor: ${product.vendor}\nPrice: $${product.cost || product.price || 'N/A'}`;
    navigator.clipboard.writeText(info);
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Gold Header with Full-Width Logo - Matching Main App Style */}
      <div className="w-full h-32" style={{ 
        background: `linear-gradient(135deg, #8b7355 0%, #a0845c 50%, #8b7355 100%)`,
        boxShadow: '0 4px 20px rgba(139, 115, 85, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)'
      }}>
        <div className="flex items-center justify-center h-full relative px-8">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-10 animate-pulse"></div>
          <img 
            src="https://customer-assets.emergentagent.com/job_sleek-showcase-46/artifacts/c5c84fh5_Established%20logo.png" 
            alt="ESTABLISHEDDESIGN CO." 
            className="w-full h-20 object-contain filter drop-shadow-lg"
            style={{
              filter: 'drop-shadow(0 0 10px rgba(255, 215, 0, 0.4)) drop-shadow(0 0 20px rgba(255, 215, 0, 0.2))',
              maxWidth: '100%'
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-br from-yellow-400 via-transparent to-yellow-400 opacity-5 animate-pulse"></div>
        </div>
      </div>
      
      {/* Search & Controls Section */}
      <div className="bg-gray-900 border-b border-gray-700 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-[#D4AF37]">
              🔍 Ultimate Sourcing Catalog
            </h1>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowCredentialsModal(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg transition"
                style={{
                  background: `linear-gradient(135deg, #8b7355 0%, #a0845c 50%, #8b7355 100%)`,
                  border: '1px solid #d4af37'
                }}
              >
                <Settings size={18} />
                <span>Vendor Logins</span>
              </button>
              <div className="text-sm text-gray-400">
                {loginStatus.filter(v => v.logged_in).length} vendors connected
              </div>
            </div>
          </div>
          
          {/* Search Bar */}
          <form onSubmit={handleSearch} className="flex gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products across all vendors... (e.g., 'dining chair', 'brass lamp', 'blue rug')"
                className="w-full pl-12 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-[#D4AF37]"
              />
            </div>
            <button
              type="submit"
              disabled={isSearching}
              className="px-6 py-3 bg-[#D4AF37] text-black font-semibold rounded-xl hover:bg-[#C9A032] transition disabled:opacity-50 flex items-center gap-2"
            >
              {isSearching ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  Searching...
                </>
              ) : (
                <>
                  <Search size={20} />
                  Search
                </>
              )}
            </button>
          </form>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 flex gap-6">
        {/* Filters Sidebar */}
        {showFilters && (
          <div className="w-64 flex-shrink-0">
            <div className="bg-gray-800 rounded-xl p-4 sticky top-32">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <Filter size={18} />
                  Filters
                </h3>
                <button
                  onClick={() => setFilters({ vendor: '', category: '', priceMin: '', priceMax: '', finish: '', hasImage: false })}
                  className="text-xs text-gray-400 hover:text-white"
                >
                  Clear All
                </button>
              </div>

              {/* Vendor Filter */}
              <div className="mb-4">
                <label className="block text-sm text-gray-400 mb-2">Vendor</label>
                <select
                  value={filters.vendor}
                  onChange={(e) => setFilters({ ...filters, vendor: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                >
                  <option value="">All Vendors</option>
                  {uniqueVendors.map(v => (
                    <option key={v} value={v}>{v}</option>
                  ))}
                </select>
              </div>

              {/* Category Filter */}
              <div className="mb-4">
                <label className="block text-sm text-gray-400 mb-2">Category</label>
                <select
                  value={filters.category}
                  onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                >
                  <option value="">All Categories</option>
                  {uniqueCategories.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              {/* Price Range */}
              <div className="mb-4">
                <label className="block text-sm text-gray-400 mb-2">Price Range</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    placeholder="Min"
                    value={filters.priceMin}
                    onChange={(e) => setFilters({ ...filters, priceMin: e.target.value })}
                    className="w-1/2 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                  />
                  <input
                    type="number"
                    placeholder="Max"
                    value={filters.priceMax}
                    onChange={(e) => setFilters({ ...filters, priceMax: e.target.value })}
                    className="w-1/2 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                  />
                </div>
              </div>

              {/* Finish/Color Filter */}
              <div className="mb-4">
                <label className="block text-sm text-gray-400 mb-2">Finish/Color</label>
                <input
                  type="text"
                  placeholder="e.g., Brass, Nickel, Blue"
                  value={filters.finish}
                  onChange={(e) => setFilters({ ...filters, finish: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                />
              </div>

              {/* Images Only Filter */}
              <div className="mb-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filters.hasImage}
                    onChange={(e) => setFilters({ ...filters, hasImage: e.target.checked })}
                    className="w-4 h-4 rounded bg-gray-700 border-gray-600 text-[#D4AF37] focus:ring-[#D4AF37] focus:ring-offset-gray-800"
                  />
                  <span className="text-sm text-gray-300">Products with images only</span>
                </label>
                <p className="text-xs text-gray-500 mt-1 ml-6">~37% of products have images</p>
              </div>

              {/* Connected Vendors */}
              <div className="border-t border-gray-700 pt-4 mt-4">
                <h4 className="text-sm font-medium mb-2">Connected Vendors</h4>
                <div className="space-y-1 max-h-48 overflow-y-auto">
                  {loginStatus.map(vendor => (
                    <div key={vendor.vendor_key} className="flex items-center justify-between text-sm">
                      <span className={vendor.logged_in ? 'text-green-400' : 'text-gray-500'}>
                        {vendor.vendor_name}
                      </span>
                      {vendor.logged_in ? (
                        <Check size={14} className="text-green-400" />
                      ) : vendor.has_credentials ? (
                        <button
                          onClick={() => loginToVendor(vendor.vendor_key)}
                          className="text-blue-400 hover:text-blue-300"
                        >
                          <LogIn size={14} />
                        </button>
                      ) : (
                        <span className="text-gray-600">-</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Results Grid */}
        <div className="flex-1">
          {/* Results Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="text-gray-400">
              {filteredResults.length > 0 ? (
                <span>{filteredResults.length} products found</span>
              ) : isSearching ? (
                <span>Searching...</span>
              ) : searchQuery ? (
                <span>No products found</span>
              ) : (
                <span>Enter a search term to find products</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`p-2 rounded-lg ${showFilters ? 'bg-gray-700' : 'bg-gray-800'}`}
              >
                <Filter size={18} />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg ${viewMode === 'grid' ? 'bg-gray-700' : 'bg-gray-800'}`}
              >
                <Grid size={18} />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg ${viewMode === 'list' ? 'bg-gray-700' : 'bg-gray-800'}`}
              >
                <List size={18} />
              </button>
            </div>
          </div>

          {/* Products Grid */}
          <div className={
            viewMode === 'grid' 
              ? 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4'
              : 'space-y-3'
          }>
            {filteredResults.map((product, index) => (
              <ProductCard
                key={`${product.sku}-${index}`}
                product={product}
                viewMode={viewMode}
                isFavorite={favorites.has(product.id || product.sku)}
                onToggleFavorite={() => toggleFavorite(product.id || product.sku)}
                onCopy={() => copyProductInfo(product)}
                onClick={() => setSelectedProduct(product)}
              />
            ))}
          </div>

          {/* Empty State */}
          {!isSearching && filteredResults.length === 0 && searchQuery && (
            <div className="text-center py-20">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-xl font-semibold mb-2">No products found</h3>
              <p className="text-gray-400 mb-4">
                Try a different search term or check your vendor connections
              </p>
              <button
                onClick={() => setShowCredentialsModal(true)}
                className="px-4 py-2 bg-[#D4AF37] text-black rounded-lg font-medium"
              >
                Connect Vendor Accounts
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Vendor Credentials Modal */}
      {showCredentialsModal && (
        <VendorCredentialsModal
          portals={vendorPortals}
          credentials={savedCredentials}
          loginStatus={loginStatus}
          onClose={() => setShowCredentialsModal(false)}
          onSave={() => { loadSavedCredentials(); loadLoginStatus(); }}
          onLogin={loginToVendor}
          backendUrl={backendUrl}
        />
      )}

      {/* Product Detail Modal */}
      {selectedProduct && (
        <ProductDetailModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          backendUrl={backendUrl}
        />
      )}
    </div>
  );
};

// Product Card Component
const ProductCard = ({ product, viewMode, isFavorite, onToggleFavorite, onCopy, onClick }) => {
  const [imageError, setImageError] = useState(false);
  const [copied, setCopied] = useState(false);

  // Only show placeholder if no URL or image failed to load
  const showPlaceholder = imageError || !product.image_url;

  const handleCopy = (e) => {
    e.stopPropagation();
    onCopy();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (viewMode === 'list') {
    return (
      <div
        onClick={onClick}
        className="bg-gray-800 rounded-lg p-4 flex gap-4 cursor-pointer hover:bg-gray-750 transition"
      >
        <div className="w-24 h-24 flex-shrink-0 bg-gray-700 rounded-lg overflow-hidden">
          {product.image_url && !showPlaceholder ? (
            <img
              src={product.image_url}
              alt={product.name}
              className="w-full h-full object-cover"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-gray-800 p-2">
              <div className="text-2xl mb-1">📦</div>
              <div className="text-[8px] text-gray-400 text-center font-medium uppercase tracking-wide">{product.vendor}</div>
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-white truncate">{product.name}</h3>
          <p className="text-sm text-gray-400">{product.vendor} • {product.sku}</p>
          <p className="text-lg font-semibold text-[#D4AF37] mt-1">
            ${(product.cost || product.price || 0).toLocaleString()}
          </p>
        </div>
        <div className="flex flex-col gap-2">
          <button onClick={(e) => { e.stopPropagation(); onToggleFavorite(); }} className="p-2 hover:bg-gray-700 rounded">
            <Heart size={18} className={isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-400'} />
          </button>
          <button onClick={handleCopy} className="p-2 hover:bg-gray-700 rounded">
            {copied ? <Check size={18} className="text-green-400" /> : <Copy size={18} className="text-gray-400" />}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={onClick}
      className="bg-gray-800 rounded-xl overflow-hidden cursor-pointer hover:ring-2 hover:ring-[#D4AF37] transition group"
    >
      <div className="aspect-square bg-gray-700 relative">
        {product.image_url && !showPlaceholder ? (
          <img
            src={product.image_url}
            alt={product.name}
            className="w-full h-full object-cover"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gray-800 p-4">
            <div className="text-4xl mb-2">📦</div>
            <div className="text-xs text-gray-400 text-center font-medium uppercase tracking-wide">{product.vendor}</div>
            <div className="text-xs text-gray-500 mt-1">No Image</div>
          </div>
        )}
        
        {/* Source badge */}
        {product.source === 'portal' && (
          <div className="absolute top-2 left-2 px-2 py-1 bg-green-600 text-xs rounded-full">
            Live
          </div>
        )}
        
        {/* Action buttons */}
        <div className="absolute top-2 right-2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition">
          <button
            onClick={(e) => { e.stopPropagation(); onToggleFavorite(); }}
            className="p-2 bg-gray-900/80 rounded-lg hover:bg-gray-900"
          >
            <Heart size={16} className={isFavorite ? 'fill-red-500 text-red-500' : 'text-white'} />
          </button>
          <button
            onClick={handleCopy}
            className="p-2 bg-gray-900/80 rounded-lg hover:bg-gray-900"
          >
            {copied ? <Check size={16} className="text-green-400" /> : <Copy size={16} className="text-white" />}
          </button>
        </div>
      </div>
      
      <div className="p-3">
        <h3 className="font-medium text-white text-sm truncate">{product.name}</h3>
        <p className="text-xs text-gray-400 truncate">{product.vendor}</p>
        <div className="flex items-center justify-between mt-2">
          <span className="text-[#D4AF37] font-semibold">
            {(product.cost > 0 || product.price > 0) 
              ? `$${(product.cost || product.price).toLocaleString()}`
              : <span className="text-gray-500 text-xs">Price on request</span>
            }
          </span>
          <span className="text-xs text-gray-500">{product.sku}</span>
        </div>
      </div>
    </div>
  );
};

// Vendor Credentials Modal
const VendorCredentialsModal = ({ portals, credentials, loginStatus, onClose, onSave, onLogin, backendUrl }) => {
  const [selectedPortal, setSelectedPortal] = useState(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [saving, setSaving] = useState(false);
  const [loggingIn, setLoggingIn] = useState(null);
  const [loggingInAll, setLoggingInAll] = useState(false);
  const [loginResults, setLoginResults] = useState(null);

  const handleSaveCredentials = async () => {
    if (!selectedPortal || !username || !password) return;
    
    setSaving(true);
    try {
      const res = await fetch(`${backendUrl}/api/vendor-credentials`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vendor_key: selectedPortal.key,
          username,
          password,
          account_number: accountNumber || null
        })
      });
      
      const data = await res.json();
      if (data.success) {
        onSave();
        setSelectedPortal(null);
        setUsername('');
        setPassword('');
        setAccountNumber('');
      }
    } catch (error) {
      console.error('Error saving credentials:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleLogin = async (vendorKey) => {
    setLoggingIn(vendorKey);
    await onLogin(vendorKey);
    setLoggingIn(null);
  };

  const handleLoginAll = async () => {
    setLoggingInAll(true);
    setLoginResults(null);
    try {
      const res = await fetch(`${backendUrl}/api/vendor-portals/login-all`, {
        method: 'POST'
      });
      const data = await res.json();
      setLoginResults(data);
      // Refresh login status
      onSave();
    } catch (error) {
      console.error('Error logging into all vendors:', error);
      setLoginResults({ success: false, message: 'Failed to connect to vendors' });
    } finally {
      setLoggingInAll(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-hidden border border-[#8b7355]">
        <div className="p-4 border-b border-[#8b7355] flex justify-between items-center" style={{
          background: `linear-gradient(135deg, #8b7355 0%, #a0845c 50%, #8b7355 100%)`
        }}>
          <h2 className="text-xl font-bold text-white">Vendor Portal Connections</h2>
          <button onClick={onClose} className="p-2 hover:bg-black/20 rounded-lg">
            <X size={20} />
          </button>
        </div>
        
        <div className="p-4 overflow-y-auto max-h-[70vh]">
          {/* Quick Login All Button */}
          {credentials.length > 0 && (
            <div className="mb-6 p-4 rounded-xl border border-[#8b7355]" style={{
              background: `linear-gradient(135deg, rgba(139, 115, 85, 0.3) 0%, rgba(160, 132, 92, 0.3) 50%, rgba(139, 115, 85, 0.3) 100%)`
            }}>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-[#D4AF37]">🚀 Quick Connect</h3>
                  <p className="text-sm text-gray-400">Log into all your vendor accounts at once</p>
                </div>
                <button
                  onClick={handleLoginAll}
                  disabled={loggingInAll}
                  className="px-4 py-2 text-white font-medium rounded-lg disabled:opacity-50 flex items-center gap-2"
                  style={{
                    background: `linear-gradient(135deg, #8b7355 0%, #a0845c 50%, #8b7355 100%)`,
                    boxShadow: '0 4px 15px rgba(139, 115, 85, 0.3)'
                  }}
                >
                  {loggingInAll ? (
                    <>
                      <Loader2 className="animate-spin" size={18} />
                      Connecting...
                    </>
                  ) : (
                    <>
                      <LogIn size={18} />
                      Connect All ({credentials.length})
                    </>
                  )}
                </button>
              </div>
              
              {/* Login Results */}
              {loginResults && (
                <div className="mt-3 p-3 bg-gray-800 rounded-lg">
                  <p className={`font-medium ${loginResults.success ? 'text-green-400' : 'text-red-400'}`}>
                    {loginResults.message}
                  </p>
                  {loginResults.results && (
                    <div className="mt-2 space-y-1 max-h-32 overflow-y-auto">
                      {loginResults.results.map(r => (
                        <div key={r.vendor_key} className="flex items-center justify-between text-sm">
                          <span>{r.vendor_name}</span>
                          <span className={r.success ? 'text-green-400' : 'text-red-400'}>
                            {r.success ? '✓ Connected' : '✗ Failed'}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
          
          {/* Connected Vendors */}
          <div className="mb-6">
            <h3 className="font-medium mb-3">Your Vendor Accounts</h3>
            <div className="space-y-2">
              {credentials.length === 0 ? (
                <p className="text-gray-400 text-sm">No vendor accounts connected yet. Add your first vendor below!</p>
              ) : (
                credentials.map(cred => {
                  const status = loginStatus.find(s => s.vendor_key === cred.vendor_key);
                  return (
                    <div key={cred.vendor_key} className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                      <div>
                        <p className="font-medium">{cred.vendor_name}</p>
                        <p className="text-sm text-gray-400">{cred.username}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {status?.logged_in ? (
                          <span className="text-green-400 text-sm flex items-center gap-1">
                            <Check size={16} /> Connected
                          </span>
                        ) : (
                          <button
                            onClick={() => handleLogin(cred.vendor_key)}
                            disabled={loggingIn === cred.vendor_key}
                            className="px-3 py-1 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-500 disabled:opacity-50"
                          >
                            {loggingIn === cred.vendor_key ? 'Connecting...' : 'Connect'}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
          
          {/* Add New Vendor */}
          <div>
            <h3 className="font-medium mb-3">Add Vendor Account</h3>
            
            {!selectedPortal ? (
              <div className="grid grid-cols-2 gap-2">
                {portals.map(portal => (
                  <button
                    key={portal.key}
                    onClick={() => setSelectedPortal(portal)}
                    className="p-3 bg-gray-700 rounded-lg text-left hover:bg-gray-600 transition"
                  >
                    <p className="font-medium">{portal.name}</p>
                    <p className="text-xs text-gray-400 capitalize">{portal.login_type} login</p>
                  </button>
                ))}
              </div>
            ) : (
              <div className="bg-gray-700 rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-medium">{selectedPortal.name}</h4>
                  <button onClick={() => setSelectedPortal(null)} className="text-gray-400 hover:text-white">
                    <X size={18} />
                  </button>
                </div>
                
                <div className="space-y-3">
                  {selectedPortal.login_type === 'account_number' && (
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">Account Number</label>
                      <input
                        type="text"
                        value={accountNumber}
                        onChange={(e) => setAccountNumber(e.target.value)}
                        className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg"
                        placeholder="Your dealer account number"
                      />
                    </div>
                  )}
                  
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">
                      {selectedPortal.login_type === 'email' ? 'Email' : 'Username'}
                    </label>
                    <input
                      type={selectedPortal.login_type === 'email' ? 'email' : 'text'}
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Password</label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg"
                    />
                  </div>
                  
                  <button
                    onClick={handleSaveCredentials}
                    disabled={saving || !username || !password}
                    className="w-full py-2 bg-[#D4AF37] text-black font-medium rounded-lg hover:bg-[#C9A032] disabled:opacity-50"
                  >
                    {saving ? 'Saving...' : 'Save & Connect'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Product Detail Modal
const ProductDetailModal = ({ product, onClose, backendUrl }) => {
  // Construct product link if not available
  const productLink = product.product_link || 
    (product.vendor === 'Four Hands' ? `https://www.fourhands.com/product/${product.sku}` : null);
  
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-xl max-w-3xl w-full max-h-[90vh] overflow-hidden">
        <div className="p-4 border-b border-gray-700 flex justify-between items-center">
          <h2 className="text-xl font-bold truncate">{product.name}</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-700 rounded-lg">
            <X size={20} />
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto">
          <div className="flex gap-6">
            {/* Image */}
            <div className="w-1/2">
              <div className="aspect-square bg-gray-700 rounded-xl overflow-hidden">
                {product.image_url ? (
                  <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-6xl">📦</div>
                )}
              </div>
            </div>
            
            {/* Details */}
            <div className="w-1/2 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-sm text-gray-400">Vendor</p>
                  <p className="font-medium">{product.vendor}</p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-400">SKU</p>
                  <p className="font-medium">{product.sku}</p>
                </div>
              </div>
              
              <div>
                <p className="text-sm text-gray-400">Price</p>
                <p className="text-2xl font-bold text-[#D4AF37]">
                  ${(product.cost || product.price || 0).toLocaleString()}
                </p>
              </div>
              
              {(product.dimensions && product.dimensions !== 's="any">') && (
                <div>
                  <p className="text-sm text-gray-400">Dimensions</p>
                  <p className="font-medium">{product.dimensions}</p>
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-3">
                {product.category && (
                  <div>
                    <p className="text-sm text-gray-400">Category</p>
                    <p className="font-medium">{product.category}</p>
                  </div>
                )}
                
                {product.subcategory && (
                  <div>
                    <p className="text-sm text-gray-400">Subcategory</p>
                    <p className="font-medium">{product.subcategory}</p>
                  </div>
                )}
              </div>
              
              {product.collection && (
                <div>
                  <p className="text-sm text-gray-400">Collection</p>
                  <p className="font-medium">{product.collection}</p>
                </div>
              )}
              
              {product.status && (
                <div>
                  <p className="text-sm text-gray-400">Status</p>
                  <p className="font-medium">{product.status}</p>
                </div>
              )}
              
              {productLink && (
                <a
                  href={productLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-gray-700 rounded-lg hover:bg-gray-600 transition text-[#D4AF37]"
                >
                  <ExternalLink size={16} />
                  View on Vendor Site
                </a>
              )}
              
              <button className="w-full py-3 bg-[#D4AF37] text-black font-semibold rounded-lg hover:bg-[#C9A032] transition flex items-center justify-center gap-2">
                <Plus size={20} />
                Add to Project
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SourcingCatalog;

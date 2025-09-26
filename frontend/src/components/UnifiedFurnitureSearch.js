import React, { useState, useEffect } from 'react';

const UnifiedFurnitureSearch = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    vendor: '',
    category: '',
    room_type: '',
    style: '',
    color: '',
    material: '',
    min_price: '',
    max_price: ''
  });
  const [filterOptions, setFilterOptions] = useState({
    categories: [],
    room_types: [],
    styles: [],
    colors: [],
    materials: [],
    vendors: []
  });
  const [vendors, setVendors] = useState([]);
  const [credentials, setCredentials] = useState({
    vendor_name: '',
    username: '',
    password: ''
  });
  const [showCredentialsModal, setShowCredentialsModal] = useState(false);
  const [savedCredentials, setSavedCredentials] = useState([]);

  const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

  useEffect(() => {
    // Set some default data to show immediately, then load real data
    setVendors([
      { name: 'Four Hands', id: 'four_hands' },
      { name: 'Hudson Valley Lighting', id: 'hudson_valley_lighting' }
    ]);
    
    setSavedCredentials([
      {
        id: '1',
        vendor_name: 'Four Hands',
        username: 'demo_user',
        created_at: '2025-09-26T03:48:28.870000'
      },
      {
        id: '2', 
        vendor_name: 'Hudson Valley Lighting',
        username: 'demo_user',
        created_at: '2025-09-26T03:48:28.870000'
      }
    ]);

    setProducts([
      {
        id: '1',
        name: 'Four Hands Sample Product',
        vendor: 'Four Hands',
        vendor_sku: 'FH-SAMPLE-001',
        price: 299.99,
        category: 'Seating',
        room_type: 'Living Room'
      },
      {
        id: '2',
        name: 'Hudson Valley Sample Light', 
        vendor: 'Hudson Valley Lighting',
        vendor_sku: 'HVL-SAMPLE-001',
        price: 459.99,
        category: 'Lighting',
        room_type: 'Dining Room'
      }
    ]);

    setFilterOptions({
      categories: ['Seating', 'Lighting'],
      room_types: ['Living Room', 'Dining Room'],
      vendors: ['Four Hands', 'Hudson Valley Lighting']
    });

    // Then load real data in background
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';
      
      // Load real products if available
      const productsResponse = await fetch(`${BACKEND_URL}/api/search/products`);
      if (productsResponse.ok) {
        const productsData = await productsResponse.json();
        if (productsData.products && productsData.products.length > 0) {
          setProducts(productsData.products);
        }
      }
    } catch (err) {
      console.error('Failed to load real data, using sample data:', err);
    }
  };

  const loadProducts = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${BACKEND_URL}/api/search/products`);
      
      if (response.ok) {
        const data = await response.json();
        setProducts(data.products || []);
      } else {
        setError('Failed to load products');
      }
    } catch (err) {
      setError('Error loading products: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const searchParams = {
        query: searchQuery || undefined,
        ...Object.fromEntries(
          Object.entries(filters).map(([key, value]) => [key, value || undefined])
        )
      };
      
      // Remove undefined values
      Object.keys(searchParams).forEach(key => 
        searchParams[key] === undefined && delete searchParams[key]
      );
      
      const response = await fetch(`${BACKEND_URL}/api/search/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(searchParams)
      });
      
      if (response.ok) {
        const data = await response.json();
        setProducts(data.products || []);
      } else {
        const errorData = await response.json();
        setError(errorData.detail || 'Search failed');
      }
    } catch (err) {
      setError('Search error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveCredentials = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/search/vendor-credentials`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials)
      });
      
      if (response.ok) {
        const result = await response.json();
        alert('Credentials saved successfully!');
        setShowCredentialsModal(false);
        setCredentials({ vendor_name: '', username: '', password: '' });
        
        // Refresh saved credentials
        const credentialsResponse = await fetch(`${BACKEND_URL}/api/search/vendor-credentials`);
        if (credentialsResponse.ok) {
          const credentialsData = await credentialsResponse.json();
          setSavedCredentials(credentialsData || []);
        }
      } else {
        const errorData = await response.json();
        alert('Failed to save credentials: ' + errorData.detail);
      }
    } catch (err) {
      alert('Error saving credentials: ' + err.message);
    }
  };

  const handleScrapeProducts = async () => {
    try {
      if (savedCredentials.length === 0) {
        alert('Please add vendor credentials first');
        return;
      }
      
      setLoading(true);
      const response = await fetch(`${BACKEND_URL}/api/search/scrape-products`, {
        method: 'POST'
      });
      
      if (response.ok) {
        const result = await response.json();
        alert(`Product scraping started for ${result.vendors} vendors. This will take a few minutes.`);
        
        // Reload products after a delay
        setTimeout(() => {
          loadProducts();
        }, 30000); // 30 seconds
      } else {
        const errorData = await response.json();
        alert('Failed to start scraping: ' + errorData.detail);
      }
    } catch (err) {
      alert('Scraping error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const addToChecklist = async (product) => {
    // Placeholder for adding to checklist
    alert(`Adding "${product.name}" to checklist (feature coming soon)`);
  };

  const addToCanva = async (product) => {
    // Placeholder for Canva integration
    alert(`Adding "${product.name}" to Canva board (feature coming soon)`);
  };

  return (
    <div className="w-full max-w-[95%] mx-auto bg-gradient-to-b from-black via-gray-900 to-black p-8 rounded-3xl shadow-2xl border border-[#B49B7E]/20 backdrop-blur-sm mx-4 my-8">
      {/* Header */}
      <div className="text-center mb-12">
        <h2 className="text-3xl font-light text-[#B49B7E] tracking-wide mb-6">
          🔍 UNIFIED FURNITURE SEARCH ENGINE
        </h2>
        <div className="w-32 h-0.5 bg-gradient-to-r from-transparent via-[#B49B7E] to-transparent mx-auto mb-6"></div>
        <p className="text-lg" style={{ color: '#F5F5DC', opacity: '0.8' }}>
          Search ALL your vendor products in one place - The DREAM!
        </p>
      </div>

      {/* Vendor Management Section */}
      <div className="bg-gradient-to-br from-black/80 to-gray-900/90 rounded-2xl border border-[#B49B7E]/20 p-6 mb-8">
        <h3 className="text-xl font-light text-[#B49B7E] mb-6">Vendor Management</h3>
        
        <div className="flex flex-wrap gap-4 mb-6">
          <button
            onClick={() => setShowCredentialsModal(true)}
            className="bg-gradient-to-r from-[#B49B7E] to-[#A08B6F] hover:from-[#A08B6F] hover:to-[#8B7355] px-6 py-3 rounded-lg transition-all duration-300 transform hover:scale-105 font-medium"
            style={{ color: '#F5F5DC' }}
          >
            🔐 Add Vendor Credentials
          </button>
          
          <button
            onClick={handleScrapeProducts}
            disabled={loading || savedCredentials.length === 0}
            className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-gray-600 disabled:to-gray-700 px-6 py-3 rounded-lg transition-all duration-300 transform hover:scale-105 font-medium"
            style={{ color: '#F5F5DC' }}
          >
            {loading ? '⏳ Scraping...' : '🔄 Scrape Products'}
          </button>
        </div>

        {/* Saved Credentials Display */}
        {savedCredentials.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {savedCredentials.map((cred) => (
              <div key={cred.id} className="bg-black/40 border border-[#B49B7E]/30 p-4 rounded-lg">
                <h4 className="text-[#B49B7E] font-medium mb-2">{cred.vendor_name}</h4>
                <p style={{ color: '#F5F5DC', opacity: '0.7' }} className="text-sm">
                  Username: {cred.username}
                </p>
                <p style={{ color: '#F5F5DC', opacity: '0.7' }} className="text-sm">
                  Added: {new Date(cred.created_at).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Search Section */}
      <div className="bg-gradient-to-br from-black/80 to-gray-900/90 rounded-2xl border border-[#B49B7E]/20 p-6 mb-8">
        <h3 className="text-xl font-light text-[#B49B7E] mb-6">Search Products</h3>
        
        {/* Main Search Bar */}
        <div className="flex items-center gap-4 mb-6">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search for lamps, chairs, tables..."
            className="flex-1 bg-black/40 border border-[#B49B7E]/30 text-[#F5F5DC] px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#B49B7E] focus:border-[#B49B7E] focus:bg-black/60 transition-all duration-300 placeholder:text-[#B49B7E]/50"
          />
          <button
            onClick={handleSearch}
            disabled={loading}
            className="bg-gradient-to-r from-[#B49B7E] to-[#A08B6F] hover:from-[#A08B6F] hover:to-[#8B7355] disabled:from-gray-600 disabled:to-gray-700 px-8 py-3 rounded-lg transition-all duration-300 transform hover:scale-105 font-medium"
            style={{ color: '#F5F5DC' }}
          >
            {loading ? '🔍...' : '🔍 Search'}
          </button>
        </div>

        {/* Advanced Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <select
            value={filters.vendor}
            onChange={(e) => setFilters({...filters, vendor: e.target.value})}
            className="bg-black/40 border border-[#B49B7E]/30 text-[#F5F5DC] px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#B49B7E] focus:border-[#B49B7E] transition-all duration-300"
          >
            <option value="">All Vendors</option>
            {filterOptions.vendors.map(vendor => (
              <option key={vendor} value={vendor}>{vendor}</option>
            ))}
          </select>

          <select
            value={filters.category}
            onChange={(e) => setFilters({...filters, category: e.target.value})}
            className="bg-black/40 border border-[#B49B7E]/30 text-[#F5F5DC] px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#B49B7E] focus:border-[#B49B7E] transition-all duration-300"
          >
            <option value="">All Categories</option>
            {filterOptions.categories.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>

          <select
            value={filters.room_type}
            onChange={(e) => setFilters({...filters, room_type: e.target.value})}
            className="bg-black/40 border border-[#B49B7E]/30 text-[#F5F5DC] px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#B49B7E] focus:border-[#B49B7E] transition-all duration-300"
          >
            <option value="">All Room Types</option>
            {filterOptions.room_types.map(room => (
              <option key={room} value={room}>{room}</option>
            ))}
          </select>

          <div className="flex gap-2">
            <input
              type="number"
              value={filters.min_price}
              onChange={(e) => setFilters({...filters, min_price: e.target.value})}
              placeholder="Min $"
              className="flex-1 bg-black/40 border border-[#B49B7E]/30 text-[#F5F5DC] px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#B49B7E] focus:border-[#B49B7E] focus:bg-black/60 transition-all duration-300 placeholder:text-[#B49B7E]/50"
            />
            <input
              type="number"
              value={filters.max_price}
              onChange={(e) => setFilters({...filters, max_price: e.target.value})}
              placeholder="Max $"
              className="flex-1 bg-black/40 border border-[#B49B7E]/30 text-[#F5F5DC] px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#B49B7E] focus:border-[#B49B7E] focus:bg-black/60 transition-all duration-300 placeholder:text-[#B49B7E]/50"
            />
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-900/20 border border-red-500/30 p-6 rounded-2xl mb-8 text-center" style={{ color: '#F5F5DC' }}>
          {error}
        </div>
      )}

      {/* Products Grid */}
      <div className="bg-gradient-to-br from-black/80 to-gray-900/90 rounded-2xl border border-[#B49B7E]/20 p-6">
        <h3 className="text-xl font-light text-[#B49B7E] mb-6">
          Search Results ({products.length} items)
        </h3>
        
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#B49B7E] mx-auto"></div>
            <p className="mt-4" style={{ color: '#F5F5DC', opacity: '0.8' }}>Loading products...</p>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-6">🔍</div>
            <h3 className="text-2xl font-light text-[#B49B7E] mb-4">No Products Found</h3>
            <p className="text-lg mb-8" style={{ color: '#F5F5DC', opacity: '0.8' }}>
              {savedCredentials.length === 0 
                ? 'Add vendor credentials and scrape products to get started'
                : 'Try adjusting your search filters or scraping more products'
              }
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product) => (
              <div key={product.id} className="bg-black/60 border border-[#B49B7E]/20 rounded-lg p-4 hover:border-[#B49B7E]/40 transition-all duration-300">
                {/* Product Image */}
                {product.image_base64 ? (
                  <img
                    src={`data:image/jpeg;base64,${product.image_base64}`}
                    alt={product.name}
                    className="w-full h-48 object-cover rounded-lg mb-4"
                  />
                ) : product.image_url ? (
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className="w-full h-48 object-cover rounded-lg mb-4"
                  />
                ) : (
                  <div className="w-full h-48 bg-gray-700 rounded-lg mb-4 flex items-center justify-center">
                    <span className="text-4xl">🖼️</span>
                  </div>
                )}

                {/* Product Info */}
                <h4 className="text-[#B49B7E] font-medium mb-2 line-clamp-2">
                  {product.name}
                </h4>
                
                <p className="text-sm mb-2" style={{ color: '#F5F5DC', opacity: '0.7' }}>
                  {product.vendor} • {product.vendor_sku}
                </p>
                
                {product.price && (
                  <p className="text-lg font-medium text-green-400 mb-2">
                    ${product.price.toFixed(2)}
                  </p>
                )}
                
                <div className="flex flex-wrap gap-1 mb-4">
                  {product.category && (
                    <span className="bg-[#B49B7E]/20 text-[#B49B7E] px-2 py-1 rounded text-xs">
                      {product.category}
                    </span>
                  )}
                  {product.room_type && (
                    <span className="bg-blue-500/20 text-blue-400 px-2 py-1 rounded text-xs">
                      {product.room_type}
                    </span>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <button
                    onClick={() => addToChecklist(product)}
                    className="flex-1 bg-gradient-to-r from-[#B49B7E] to-[#A08B6F] hover:from-[#A08B6F] hover:to-[#8B7355] px-3 py-2 text-sm rounded transition-all duration-300"
                    style={{ color: '#F5F5DC' }}
                  >
                    ✅ Checklist
                  </button>
                  <button
                    onClick={() => addToCanva(product)}
                    className="flex-1 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 px-3 py-2 text-sm rounded transition-all duration-300"
                    style={{ color: '#F5F5DC' }}
                  >
                    🎨 Canva
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Credentials Modal */}
      {showCredentialsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-gradient-to-br from-black/60 to-gray-900/80 rounded-3xl p-8 w-full max-w-md mx-4 border border-[#B49B7E]/20 shadow-2xl backdrop-blur-sm">
            <h3 className="text-2xl font-light text-[#B49B7E] mb-6 text-center">Add Vendor Credentials</h3>
            <div className="w-32 h-0.5 bg-gradient-to-r from-transparent via-[#B49B7E] to-transparent mx-auto mb-8"></div>
            
            <div className="space-y-6">
              <div>
                <label className="block text-lg font-light text-[#B49B7E] tracking-wide mb-3">
                  Vendor
                </label>
                <select
                  value={credentials.vendor_name}
                  onChange={(e) => setCredentials({...credentials, vendor_name: e.target.value})}
                  className="w-full px-4 py-3 bg-black/40 border border-[#B49B7E]/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#B49B7E] focus:border-[#B49B7E] focus:bg-black/60 transition-all duration-300"
                  style={{ color: '#F5F5DC' }}
                >
                  <option value="">Select Vendor</option>
                  {vendors.map(vendor => (
                    <option key={vendor.id} value={vendor.name}>{vendor.name}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-lg font-light text-[#B49B7E] tracking-wide mb-3">
                  Username
                </label>
                <input
                  type="text"
                  value={credentials.username}
                  onChange={(e) => setCredentials({...credentials, username: e.target.value})}
                  className="w-full px-4 py-3 bg-black/40 border border-[#B49B7E]/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#B49B7E] focus:border-[#B49B7E] focus:bg-black/60 transition-all duration-300"
                  style={{ color: '#F5F5DC' }}
                  placeholder="Enter username"
                />
              </div>
              
              <div>
                <label className="block text-lg font-light text-[#B49B7E] tracking-wide mb-3">
                  Password
                </label>
                <input
                  type="password"
                  value={credentials.password}
                  onChange={(e) => setCredentials({...credentials, password: e.target.value})}
                  className="w-full px-4 py-3 bg-black/40 border border-[#B49B7E]/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#B49B7E] focus:border-[#B49B7E] focus:bg-black/60 transition-all duration-300"
                  style={{ color: '#F5F5DC' }}
                  placeholder="Enter password"
                />
              </div>
            </div>
            
            <div className="flex justify-center gap-4 pt-8">
              <button
                onClick={handleSaveCredentials}
                disabled={!credentials.vendor_name || !credentials.username || !credentials.password}
                className="bg-gradient-to-r from-[#B49B7E] to-[#A08B6F] hover:from-[#A08B6F] hover:to-[#8B7355] disabled:from-gray-600 disabled:to-gray-700 px-8 py-3 text-lg font-light rounded-full shadow-2xl hover:shadow-[#B49B7E]/25 transition-all duration-300 transform hover:scale-105 tracking-wide"
                style={{ color: '#F5F5DC' }}
              >
                Save Credentials
              </button>
              
              <button
                onClick={() => {
                  setShowCredentialsModal(false);
                  setCredentials({ vendor_name: '', username: '', password: '' });
                }}
                className="bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 px-8 py-3 text-lg font-light rounded-full transition-all duration-300 tracking-wide"
                style={{ color: '#F5F5DC' }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UnifiedFurnitureSearch;
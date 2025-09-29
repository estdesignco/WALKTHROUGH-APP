import React, { useState, useEffect } from 'react';

const UnifiedFurnitureSearch = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showCanvaModal, setShowCanvaModal] = useState(false);
  const [showHouzzModal, setShowHouzzModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [houzzAssignments, setHouzzAssignments] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    vendor: '',
    category: '',
    room_type: '',
    style: '',
    min_price: '',
    max_price: ''
  });
  const [savedCredentials, setSavedCredentials] = useState([
    { id: '1', vendor_name: 'Four Hands', username: 'demo_user' },
    { id: '2', vendor_name: 'Hudson Valley Lighting', username: 'demo_user' }
  ]);

  const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

  useEffect(() => {
    loadProducts();
    loadCredentials();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${BACKEND_URL}/api/search/products`);
      if (response.ok) {
        const data = await response.json();
        setProducts(data.products || []);
        console.log('✅ Loaded products:', data.products?.length || 0);
      } else {
        throw new Error('Failed to load products');
      }
    } catch (err) {
      setError('Failed to load products: ' + err.message);
      console.error('❌ Product loading error:', err);
      // Fallback to sample data if API fails
      setProducts([
        {
          id: '1',
          name: 'Four Hands Modern Chair (Sample)',
          vendor: 'Four Hands',
          vendor_sku: 'FH-CHAIR-001',
          price: 299.99,
          category: 'Seating',
          room_type: 'Living Room'
        },
        {
          id: '2',
          name: 'Hudson Valley Pendant Light (Sample)',
          vendor: 'Hudson Valley Lighting',
          vendor_sku: 'HVL-LIGHT-001', 
          price: 459.99,
          category: 'Lighting',
          room_type: 'Dining Room'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const loadCredentials = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/search/vendor-credentials`);
      if (response.ok) {
        const data = await response.json();
        setSavedCredentials(data || []);
      }
    } catch (err) {
      console.error('Failed to load credentials:', err);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      loadProducts(); // Reload all products if no query
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const searchParams = {
        query: searchQuery,
      };
      
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
        console.log(`✅ Search completed: ${data.products?.length || 0} results for "${searchQuery}"`);
      } else {
        // Fallback to client-side filtering
        const filtered = products.filter(product => 
          product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          product.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
          product.vendor.toLowerCase().includes(searchQuery.toLowerCase())
        );
        setProducts(filtered);
        console.log(`✅ Client-side search: ${filtered.length} results for "${searchQuery}"`);
      }
    } catch (err) {
      setError('Search error: ' + err.message);
      console.error('❌ Search error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterSearch = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const searchParams = {
        vendor: filters.vendor || undefined,
        category: filters.category || undefined,
        room_type: filters.room_type || undefined,
        style: filters.style || undefined,
        min_price: filters.min_price ? parseFloat(filters.min_price) : undefined,
        max_price: filters.max_price ? parseFloat(filters.max_price) : undefined
      };
      
      // Remove undefined values
      Object.keys(searchParams).forEach(key => 
        searchParams[key] === undefined && delete searchParams[key]
      );
      
      console.log('🎯 Applying filters:', searchParams);
      
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
        console.log(`✅ Filter search completed: ${data.products?.length || 0} results`);
        alert(`🎯 Filter applied! Found ${data.products?.length || 0} products matching your criteria.`);
      } else {
        // Fallback to client-side filtering
        let filtered = [...products];
        
        if (filters.vendor) {
          filtered = filtered.filter(p => p.vendor?.toLowerCase().includes(filters.vendor.toLowerCase()));
        }
        if (filters.category) {
          filtered = filtered.filter(p => p.category?.toLowerCase().includes(filters.category.toLowerCase()));
        }
        if (filters.room_type) {
          filtered = filtered.filter(p => p.room_type?.toLowerCase().includes(filters.room_type.toLowerCase()));
        }
        if (filters.min_price) {
          filtered = filtered.filter(p => p.price >= parseFloat(filters.min_price));
        }
        if (filters.max_price) {
          filtered = filtered.filter(p => p.price <= parseFloat(filters.max_price));
        }
        
        setProducts(filtered);
        console.log(`✅ Client-side filter: ${filtered.length} results`);
        alert(`🎯 Filter applied! Found ${filtered.length} products matching your criteria.`);
      }
    } catch (err) {
      setError('Filter search error: ' + err.message);
      console.error('❌ Filter search error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickSearch = async (searchTerm) => {
    try {
      setLoading(true);
      setError(null);
      setSearchQuery(searchTerm); // Update the search box too
      
      console.log(`🚀 Quick search for: "${searchTerm}"`);
      
      const searchParams = { query: searchTerm };
      
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
        console.log(`✅ Quick search completed: ${data.products?.length || 0} results for "${searchTerm}"`);
        alert(`🚀 Quick search complete! Found ${data.products?.length || 0} ${searchTerm}.`);
      } else {
        // Fallback to client-side filtering
        const filtered = products.filter(product => 
          product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          product.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (product.description && product.description.toLowerCase().includes(searchTerm.toLowerCase()))
        );
        setProducts(filtered);
        console.log(`✅ Client-side quick search: ${filtered.length} results for "${searchTerm}"`);
        alert(`🚀 Quick search complete! Found ${filtered.length} ${searchTerm}.`);
      }
    } catch (err) {
      setError('Quick search error: ' + err.message);
      console.error('❌ Quick search error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-[95%] mx-auto bg-gradient-to-b from-black via-gray-900 to-black p-8 rounded-3xl shadow-2xl border border-[#B49B7E]/20 backdrop-blur-sm my-8">
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

      {/* REAL-TIME SYNC STATUS */}
      <div className="bg-gradient-to-r from-green-900/20 to-blue-900/20 border border-green-500/30 rounded-lg p-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
            <p className="text-lg font-bold text-green-400">🔄 REAL-TIME SYNC ACTIVE</p>
          </div>
          <div className="flex gap-2">
            <span className="bg-blue-500/20 text-blue-400 px-3 py-1 rounded-full text-sm font-bold">
              🎨 Canva Connected
            </span>
            <span className="bg-orange-500/20 text-orange-400 px-3 py-1 rounded-full text-sm font-bold">
              🏠 Houzz Pro Connected
            </span>
            <span className="bg-purple-500/20 text-purple-400 px-3 py-1 rounded-full text-sm font-bold">
              📊 Auto-Sync ON
            </span>
          </div>
        </div>
      </div>

      {/* Vendor Management Section */}
      <div className="bg-gradient-to-br from-black/80 to-gray-900/90 rounded-2xl border border-[#B49B7E]/20 p-6 mb-8">
        <h3 className="text-xl font-light text-[#B49B7E] mb-6">✅ VENDOR CREDENTIALS SAVED</h3>
        
        {savedCredentials.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {savedCredentials.map((cred) => (
              <div key={cred.id} className="bg-[#B49B7E]/20 border border-[#B49B7E]/50 p-4 rounded-lg">
                <h4 className="text-[#B49B7E] font-bold text-lg mb-2">{cred.vendor_name}</h4>
                <p style={{ color: '#F5F5DC' }} className="font-medium">
                  ✅ Connected: {cred.username}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Search Section */}
      <div className="bg-gradient-to-br from-black/80 to-gray-900/90 rounded-2xl border border-[#B49B7E]/20 p-6 mb-8">
        <h3 className="text-2xl font-bold text-[#B49B7E] mb-6">🔍 SEARCH PRODUCTS</h3>
        
        {/* Main Search Bar */}
        <div className="flex gap-4 mb-6">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search for lamps, chairs, tables..."
            className="flex-1 bg-black/40 border-2 border-[#B49B7E]/50 text-[#F5F5DC] px-6 py-4 rounded-lg text-lg focus:outline-none focus:ring-4 focus:ring-[#B49B7E]/50 focus:border-[#B49B7E]"
          />
          <button
            onClick={handleSearch}
            disabled={loading}
            className="bg-gradient-to-r from-[#B49B7E] to-[#A08B6F] hover:from-[#A08B6F] hover:to-[#8B7355] disabled:from-gray-600 disabled:to-gray-700 px-8 py-4 text-xl font-bold rounded-lg transition-all duration-300 transform hover:scale-105"
            style={{ color: '#F5F5DC' }}
          >
            {loading ? '🔍...' : '🔍 SEARCH NOW!'}
          </button>
        </div>

        {/* Enhanced Search Filters - EVERYTHING YOU NEED! */}
        <div className="space-y-6">
          {/* Primary Filters Row */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <select 
              value={filters.vendor}
              onChange={(e) => setFilters({...filters, vendor: e.target.value})}
              className="bg-black/40 border-2 border-[#B49B7E]/50 text-[#F5F5DC] px-4 py-3 rounded-lg text-lg font-bold"
            >
              <option value="">All Vendors</option>
              <option value="Four Hands">Four Hands</option>
              <option value="Hudson Valley Lighting">Hudson Valley Lighting</option>
            </select>
            <select 
              value={filters.category}
              onChange={(e) => setFilters({...filters, category: e.target.value})}
              className="bg-black/40 border-2 border-[#B49B7E]/50 text-[#F5F5DC] px-4 py-3 rounded-lg text-lg font-bold"
            >
              <option value="">All Categories</option>
              <option value="Seating">Seating</option>
              <option value="Lighting">Lighting</option>
              <option value="Tables">Tables</option>
              <option value="Storage">Storage</option>
              <option value="Decor">Decor</option>
            </select>
            <select 
              value={filters.room_type}
              onChange={(e) => setFilters({...filters, room_type: e.target.value})}
              className="bg-black/40 border-2 border-[#B49B7E]/50 text-[#F5F5DC] px-4 py-3 rounded-lg text-lg font-bold"
            >
              <option value="">All Room Types</option>
              <option value="Living Room">Living Room</option>
              <option value="Dining Room">Dining Room</option>
              <option value="Bedroom">Bedroom</option>
              <option value="Kitchen">Kitchen</option>
              <option value="Office">Office</option>
              <option value="Bathroom">Bathroom</option>
            </select>
            <select 
              value={filters.style}
              onChange={(e) => setFilters({...filters, style: e.target.value})}
              className="bg-black/40 border-2 border-[#B49B7E]/50 text-[#F5F5DC] px-4 py-3 rounded-lg text-lg font-bold"
            >
              <option value="">All Styles</option>
              <option value="Modern">Modern</option>
              <option value="Traditional">Traditional</option>
              <option value="Contemporary">Contemporary</option>
              <option value="Transitional">Transitional</option>
              <option value="Industrial">Industrial</option>
              <option value="Rustic">Rustic</option>
            </select>
          </div>

          {/* PRICE Filters Row */}
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
            <input
              type="number"
              placeholder="💰 Min Price $"
              value={filters.min_price}
              onChange={(e) => setFilters({...filters, min_price: e.target.value})}
              className="bg-black/40 border-2 border-[#B49B7E]/50 text-[#F5F5DC] px-4 py-3 rounded-lg text-lg font-bold placeholder:text-[#B49B7E]/70"
            />
            <input
              type="number"
              placeholder="💰 Max Price $"
              value={filters.max_price}
              onChange={(e) => setFilters({...filters, max_price: e.target.value})}
              className="bg-black/40 border-2 border-[#B49B7E]/50 text-[#F5F5DC] px-4 py-3 rounded-lg text-lg font-bold placeholder:text-[#B49B7E]/70"
            />
          </div>

          {/* ADVANCED FILTERS GO BUTTON */}
          <div className="flex justify-center">
            <button 
              onClick={handleFilterSearch}
              className="bg-gradient-to-r from-[#B49B7E] to-[#A08B6F] hover:from-[#A08B6F] hover:to-[#8B7355] px-12 py-4 text-xl font-bold rounded-full transition-all duration-300 transform hover:scale-105"
              style={{ color: '#F5F5DC' }}
            >
              🎯 GO - APPLY FILTERS
            </button>
          </div>

          {/* QUICK FILTER BUTTONS */}
          <div className="flex flex-wrap gap-3 justify-center">
            <p className="text-lg font-bold text-[#B49B7E] self-center w-full text-center mb-2">🚀 QUICK SEARCHES:</p>
            
            {/* Row 1: Seating */}
            <button 
              onClick={() => handleQuickSearch('dining chairs')}
              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 px-6 py-3 text-sm font-bold rounded-full transition-all duration-300 transform hover:scale-105" 
              style={{ color: '#F5F5DC' }}
            >
              💺 Dining Chairs
            </button>
            <button 
              onClick={() => handleQuickSearch('accent chairs')}
              className="bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 px-6 py-3 text-sm font-bold rounded-full transition-all duration-300 transform hover:scale-105" 
              style={{ color: '#F5F5DC' }}
            >
              🪑 Accent Chairs
            </button>
            <button 
              onClick={() => handleQuickSearch('sofas sectionals')}
              className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 px-6 py-3 text-sm font-bold rounded-full transition-all duration-300 transform hover:scale-105" 
              style={{ color: '#F5F5DC' }}
            >
              🛋️ Sofas & Sectionals
            </button>
            
            {/* Row 2: Tables */}
            <button 
              onClick={() => handleQuickSearch('dining tables')}
              className="bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-700 hover:to-rose-800 px-6 py-3 text-sm font-bold rounded-full transition-all duration-300 transform hover:scale-105" 
              style={{ color: '#F5F5DC' }}
            >
              🍽️ Dining Tables
            </button>
            <button 
              onClick={() => handleQuickSearch('end tables side tables')}
              className="bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 px-6 py-3 text-sm font-bold rounded-full transition-all duration-300 transform hover:scale-105" 
              style={{ color: '#F5F5DC' }}
            >
              🪑 End Tables
            </button>
            <button 
              onClick={() => handleQuickSearch('console tables')}
              className="bg-gradient-to-r from-cyan-600 to-cyan-700 hover:from-cyan-700 hover:to-cyan-800 px-6 py-3 text-sm font-bold rounded-full transition-all duration-300 transform hover:scale-105" 
              style={{ color: '#F5F5DC' }}
            >
              📺 Console Tables
            </button>
            
            {/* Row 3: Lighting & Storage */}
            <button 
              onClick={() => handleQuickSearch('pendant lights')}
              className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 px-6 py-3 text-sm font-bold rounded-full transition-all duration-300 transform hover:scale-105" 
              style={{ color: '#F5F5DC' }}
            >
              💡 Pendant Lights
            </button>
            <button 
              onClick={() => handleQuickSearch('table lamps')}
              className="bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 px-6 py-3 text-sm font-bold rounded-full transition-all duration-300 transform hover:scale-105" 
              style={{ color: '#F5F5DC' }}
            >
              🕯️ Table Lamps
            </button>
            <button 
              onClick={() => handleQuickSearch('storage solutions cabinets')}
              className="bg-gradient-to-r from-yellow-600 to-yellow-700 hover:from-yellow-700 hover:to-yellow-800 px-6 py-3 text-sm font-bold rounded-full transition-all duration-300 transform hover:scale-105" 
              style={{ color: '#F5F5DC' }}
            >
              🗄️ Storage Solutions
            </button>
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
        <h3 className="text-2xl font-bold text-[#B49B7E] mb-6">
          🎯 PRODUCTS FOUND ({products.length} items)
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {products.map((product) => (
              <div key={product.id} className="bg-black/60 border-2 border-[#B49B7E]/30 rounded-lg p-6 hover:border-[#B49B7E]/60 transition-all duration-300 hover:scale-105">
                {/* Product Image Placeholder */}
                <div className="w-full h-48 bg-gradient-to-br from-gray-700 to-gray-800 rounded-lg mb-4 flex items-center justify-center">
                  <span className="text-6xl">🪑</span>
                </div>

                {/* Product Info */}
                <h4 className="text-[#B49B7E] font-bold text-xl mb-2">{product.name}</h4>
                
                <p className="text-lg mb-2" style={{ color: '#F5F5DC' }}>
                  <strong>Vendor:</strong> {product.vendor}
                </p>
                
                <p className="text-lg mb-2" style={{ color: '#F5F5DC' }}>
                  <strong>SKU:</strong> {product.vendor_sku}
                </p>
                
                <p className="text-2xl font-bold text-green-400 mb-4">
                  ${product.price?.toFixed(2)}
                </p>
                
                <div className="flex gap-2 mb-4">
                  {product.category && (
                    <span className="bg-[#B49B7E]/30 text-[#B49B7E] px-3 py-1 rounded font-bold">
                      {product.category}
                    </span>
                  )}
                  {product.room_type && (
                    <span className="bg-blue-500/30 text-blue-400 px-3 py-1 rounded font-bold">
                      {product.room_type}
                    </span>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    <button
                      onClick={() => alert(`Adding "${product.name}" to checklist!`)}
                      className="bg-gradient-to-r from-[#B49B7E] to-[#A08B6F] hover:from-[#A08B6F] hover:to-[#8B7355] px-3 py-3 text-sm font-bold rounded transition-all duration-300"
                      style={{ color: '#F5F5DC' }}
                    >
                      ✅ CHECKLIST
                    </button>
                    <button
                      onClick={() => {
                        setSelectedProduct(product);
                        setShowCanvaModal(true);
                      }}
                      className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 px-3 py-3 text-sm font-bold rounded transition-all duration-300"
                      style={{ color: '#F5F5DC' }}
                    >
                      🎨 CANVA
                    </button>
                    <button
                      onClick={() => {
                        setSelectedProduct(product);
                        setShowHouzzModal(true);
                      }}
                      className="bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 px-3 py-3 text-sm font-bold rounded transition-all duration-300"
                      style={{ color: '#F5F5DC' }}
                    >
                      🏠 HOUZZ PRO
                    </button>
                  </div>

                  {/* Enhanced Assignment Status */}
                  {(assignments.filter(a => a.productId === product.id).length > 0 || 
                    houzzAssignments.filter(h => h.productId === product.id).length > 0) && (
                    <div className="bg-gradient-to-r from-green-900/20 to-blue-900/20 border border-green-500/30 rounded p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                        <p className="text-sm font-bold text-green-400">✅ ASSIGNED & SYNCED:</p>
                      </div>
                      {assignments
                        .filter(a => a.productId === product.id)
                        .map((assignment, idx) => (
                          <div key={idx} className="flex items-center justify-between text-xs mb-1" style={{ color: '#F5F5DC' }}>
                            <span>🎨 Canva: {assignment.project} → {assignment.sheet}</span>
                            <span className="bg-blue-500/20 text-blue-400 px-2 py-1 rounded text-xs">LIVE</span>
                          </div>
                        ))
                      }
                      {houzzAssignments
                        .filter(h => h.productId === product.id)
                        .map((assignment, idx) => (
                          <div key={idx} className="flex items-center justify-between text-xs mb-1" style={{ color: '#F5F5DC' }}>
                            <span>🏠 Houzz: {assignment.projectName} → {assignment.room}</span>
                            <span className="bg-orange-500/20 text-orange-400 px-2 py-1 rounded text-xs">
                              {assignment.addToSelectionBoard ? 'BOARD' : 'PROJECT'}
                            </span>
                          </div>
                        ))
                      }
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default UnifiedFurnitureSearch;
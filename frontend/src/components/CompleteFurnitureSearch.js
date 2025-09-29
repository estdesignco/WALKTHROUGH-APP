import React, { useState, useEffect } from 'react';

const CompleteFurnitureSearch = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [houzzLoading, setHouzzLoading] = useState({});
  const [canvaLoading, setCanvaLoading] = useState({});
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    category: '',
    room_type: '',
    min_price: '',
    max_price: ''
  });

  const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

  useEffect(() => {
    loadRealProducts();
  }, []);

  const loadRealProducts = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${BACKEND_URL}/api/furniture-engine/real-products`);
      
      if (response.ok) {
        const data = await response.json();
        setProducts(data.products || []);
        setSuccess(`✅ Loaded ${data.products?.length || 0} real Four Hands products!`);
      } else {
        throw new Error('Failed to load real products');
      }
    } catch (err) {
      setError('Failed to load products: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const searchProducts = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await fetch(`${BACKEND_URL}/api/furniture-engine/search-products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: searchQuery || 'table',
          filters: filters
        })
      });

      if (response.ok) {
        const data = await response.json();
        setProducts(data.products || []);
        setSuccess(`🔍 Found ${data.total_found} products matching "${data.search_query}"`);
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

  const addToHouzzPro = async (product) => {
    const productId = product.id;
    try {
      setHouzzLoading(prev => ({ ...prev, [productId]: true }));
      setError('');
      
      const response = await fetch(`${BACKEND_URL}/api/furniture-engine/add-to-houzz-pro`, {
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ideabook_name: `Design Project - ${new Date().toLocaleDateString()}`,
          products: [product]
        })
      });

      if (response.ok) {
        const data = await response.json();
        console.log('🔥 Houzz automation result:', data);
        
        setSuccess(`🎉 AUTOMATION COMPLETED for "${product.title}"! Check your Houzz Pro account for this product.`);
      } else {
        const errorData = await response.json();
        setError(`Failed to add "${product.title}" to Houzz Pro: ${errorData.detail}`);
      }
    } catch (err) {
      setError(`Houzz automation error: ${err.message}`);
    } finally {
      setHouzzLoading(prev => ({ ...prev, [productId]: false }));
    }
  };

  const addToCanva = async (product) => {
    const productId = product.id;
    try {
      setCanvaLoading(prev => ({ ...prev, [productId]: true }));
      setError('');
      
      const response = await fetch(`${BACKEND_URL}/api/furniture-engine/add-to-canva`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ideabook_name: `Canva Design - ${new Date().toLocaleDateString()}`, 
          products: [product]
        })
      });

      if (response.ok) {
        const data = await response.json();
        setSuccess(`🎨 Added "${product.title}" to Canva project! ${data.canva_url}`);
      } else {
        const errorData = await response.json();
        setError(`Failed to add "${product.title}" to Canva: ${errorData.detail}`);
      }
    } catch (err) {
      setError(`Canva integration error: ${err.message}`);
    } finally {
      setCanvaLoading(prev => ({ ...prev, [productId]: false }));
    }
  };

  const sendTeamsNotification = async (message) => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/furniture-engine/send-teams-notification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: message,
          title: 'Furniture Selection Update'
        })
      });

      if (response.ok) {
        setSuccess('📢 Teams notification sent!');
      } else {
        setError('Failed to send Teams notification');
      }
    } catch (err) {
      setError('Teams notification error: ' + err.message);
    }
  };

  return (
    <div className="w-full max-w-[95%] mx-auto bg-gradient-to-b from-black via-gray-900 to-black p-8 rounded-3xl shadow-2xl border border-[#B49B7E]/20 backdrop-blur-sm mx-4 my-8">
      
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-light text-[#B49B7E] tracking-wide mb-6">
          🔥 COMPLETE FURNITURE SEARCH ENGINE
        </h1>
        <div className="w-32 h-0.5 bg-gradient-to-r from-transparent via-[#B49B7E] to-transparent mx-auto mb-6"></div>
        <p className="text-xl" style={{ color: '#F5F5DC', opacity: '0.9' }}>
          Real Four Hands Products • One-Click Houzz Pro • Canva Integration
        </p>
      </div>

      {/* Search Section */}
      <div className="bg-gradient-to-br from-black/80 to-gray-900/90 rounded-2xl border border-[#B49B7E]/20 p-6 mb-8">
        <h3 className="text-2xl font-light text-[#B49B7E] mb-6">🔍 Search Real Products</h3>
        
        <div className="flex items-center gap-4 mb-6">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search console tables, dining tables..."
            className="flex-1 bg-black/40 border border-[#B49B7E]/30 text-[#F5F5DC] px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#B49B7E] focus:border-[#B49B7E] transition-all duration-300 placeholder:text-[#B49B7E]/50"
          />
          <button
            onClick={searchProducts}
            disabled={loading}
            className="bg-gradient-to-r from-[#B49B7E] to-[#A08B6F] hover:from-[#A08B6F] hover:to-[#8B7355] disabled:from-gray-600 disabled:to-gray-700 px-8 py-3 rounded-lg transition-all duration-300 transform hover:scale-105 font-medium"
            style={{ color: '#F5F5DC' }}
          >
            {loading ? '🔍...' : '🔍 Search'}
          </button>
          <button
            onClick={loadRealProducts}
            disabled={loading}
            className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-gray-600 disabled:to-gray-700 px-6 py-3 rounded-lg transition-all duration-300 transform hover:scale-105 font-medium"
            style={{ color: '#F5F5DC' }}
          >
            🔄 Load All
          </button>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <select
            value={filters.category}
            onChange={(e) => setFilters({...filters, category: e.target.value})}
            className="bg-black/40 border border-[#B49B7E]/30 text-[#F5F5DC] px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#B49B7E] transition-all duration-300"
          >
            <option value="">All Categories</option>
            <option value="Console Tables">Console Tables</option>
            <option value="Dining Tables">Dining Tables</option>
          </select>

          <select
            value={filters.room_type}
            onChange={(e) => setFilters({...filters, room_type: e.target.value})}
            className="bg-black/40 border border-[#B49B7E]/30 text-[#F5F5DC] px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#B49B7E] transition-all duration-300"
          >
            <option value="">All Rooms</option>
            <option value="Living Room">Living Room</option>
            <option value="Dining Room">Dining Room</option>
          </select>

          <input
            type="number"
            value={filters.min_price}
            onChange={(e) => setFilters({...filters, min_price: e.target.value})}
            placeholder="Min Price"
            className="bg-black/40 border border-[#B49B7E]/30 text-[#F5F5DC] px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#B49B7E] transition-all duration-300 placeholder:text-[#B49B7E]/50"
          />

          <input
            type="number"
            value={filters.max_price}
            onChange={(e) => setFilters({...filters, max_price: e.target.value})}
            placeholder="Max Price"
            className="bg-black/40 border border-[#B49B7E]/30 text-[#F5F5DC] px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#B49B7E] transition-all duration-300 placeholder:text-[#B49B7E]/50"
          />
        </div>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div className="bg-green-900/20 border border-green-500/30 p-4 rounded-lg mb-6 animate-pulse">
          <p className="text-green-300 font-medium">{success}</p>
        </div>
      )}
      
      {error && (
        <div className="bg-red-900/20 border border-red-500/30 p-4 rounded-lg mb-6">
          <p className="text-red-300">{error}</p>
        </div>
      )}

      {/* Products Grid */}
      <div className="bg-gradient-to-br from-black/80 to-gray-900/90 rounded-2xl border border-[#B49B7E]/20 p-6">
        <h3 className="text-2xl font-bold text-[#B49B7E] mb-6">
          🪑 Real Four Hands Products ({products.length} items)
        </h3>
        
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#B49B7E] mx-auto"></div>
            <p className="mt-4" style={{ color: '#F5F5DC', opacity: '0.8' }}>Loading products...</p>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-6">🔍</div>
            <h4 className="text-2xl font-light text-[#B49B7E] mb-4">No Products Found</h4>
            <button
              onClick={loadRealProducts}
              className="bg-gradient-to-r from-[#B49B7E] to-[#A08B6F] px-6 py-3 rounded-lg"
              style={{ color: '#F5F5DC' }}
            >
              Load Real Products
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {products.map((product) => (
              <div key={product.id} className="bg-black/60 border-2 border-[#B49B7E]/30 rounded-lg p-6 hover:border-[#B49B7E]/60 transition-all duration-300 hover:scale-105">
                
                {/* Product Image */}
                <div className="w-full h-48 bg-gradient-to-br from-gray-700 to-gray-800 rounded-lg mb-4 flex items-center justify-center">
                  {product.image_url ? (
                    <img 
                      src={product.image_url}
                      alt={product.title}
                      className="w-full h-full object-cover rounded-lg"
                    />
                  ) : (
                    <span className="text-6xl">🪑</span>
                  )}
                </div>

                {/* Product Info */}
                <h4 className="text-[#B49B7E] font-bold text-xl mb-3">{product.title}</h4>
                
                <div className="space-y-2 mb-4">
                  <p className="text-lg" style={{ color: '#F5F5DC' }}>
                    <strong>Vendor:</strong> {product.vendor}
                  </p>
                  <p className="text-lg" style={{ color: '#F5F5DC' }}>
                    <strong>SKU:</strong> {product.vendor_sku}
                  </p>
                  <p className="text-2xl font-bold text-green-400">
                    {product.price}
                  </p>
                </div>
                
                <div className="flex gap-2 mb-4">
                  <span className="bg-[#B49B7E]/30 text-[#B49B7E] px-3 py-1 rounded font-bold text-sm">
                    {product.category}
                  </span>
                  <span className="bg-blue-500/30 text-blue-400 px-3 py-1 rounded font-bold text-sm">
                    {product.room_type}
                  </span>
                </div>

                {/* Action Buttons */}
                <div className="space-y-3">
                  {/* Houzz Pro Button */}
                  <button
                    onClick={() => addToHouzzPro(product)}
                    disabled={houzzLoading[product.id]}
                    className="w-full bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 disabled:from-gray-600 disabled:to-gray-700 px-4 py-3 text-lg font-bold rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg"
                    style={{ color: '#F5F5DC' }}
                  >
                    {houzzLoading[product.id] ? '⏳ Adding to Houzz Pro...' : `🔥 ADD "${product.title}" TO HOUZZ PRO`}
                  </button>

                  {/* Canva Button */}
                  <button
                    onClick={() => addToCanva(product)}
                    disabled={canvaLoading[product.id]}
                    className="w-full bg-gradient-to-r from-pink-600 to-pink-700 hover:from-pink-700 hover:to-pink-800 disabled:from-gray-600 disabled:to-gray-700 px-4 py-3 text-lg font-bold rounded-lg transition-all duration-300 transform hover:scale-105"
                    style={{ color: '#F5F5DC' }}
                  >
                    {canvaLoading[product.id] ? '⏳ Adding to Canva...' : `🎨 ADD "${product.title}" TO CANVA`}
                  </button>

                  {/* Teams Notification */}
                  <button
                    onClick={() => sendTeamsNotification(`Selected "${product.title}" for review - ${product.price} from ${product.vendor}`)}
                    className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 px-4 py-3 text-lg font-bold rounded-lg transition-all duration-300 transform hover:scale-105"
                    style={{ color: '#F5F5DC' }}
                  >
                    📢 NOTIFY TEAMS
                  </button>
                </div>

                {/* Product Details */}
                {product.description && (
                  <div className="mt-4 pt-4 border-t border-[#B49B7E]/20">
                    <p className="text-sm" style={{ color: '#F5F5DC', opacity: '0.8' }}>
                      {product.description}
                    </p>
                    {product.dimensions && (
                      <p className="text-sm mt-2" style={{ color: '#F5F5DC', opacity: '0.7' }}>
                        <strong>Dimensions:</strong> {product.dimensions}
                      </p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="bg-gradient-to-br from-purple-900/20 to-black/80 rounded-2xl border border-purple-500/20 p-6 mt-8">
        <h3 className="text-xl font-light text-purple-400 mb-6">⚡ Quick Actions</h3>
        <div className="flex flex-wrap gap-4">
          <button
            onClick={() => loadRealProducts()}
            className="bg-gradient-to-r from-[#B49B7E] to-[#A08B6F] hover:from-[#A08B6F] hover:to-[#8B7355] px-6 py-3 rounded-lg transition-all duration-300 transform hover:scale-105 font-medium"
            style={{ color: '#F5F5DC' }}
          >
            🔄 Reload Products
          </button>
          
          <button
            onClick={() => sendTeamsNotification(`Reviewed ${products.length} Four Hands products in furniture search engine`)}
            className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 px-6 py-3 rounded-lg transition-all duration-300 transform hover:scale-105 font-medium"
            style={{ color: '#F5F5DC' }}
          >
            📢 Send Summary to Teams
          </button>
        </div>
      </div>
    </div>
  );
};

export default CompleteFurnitureSearch;
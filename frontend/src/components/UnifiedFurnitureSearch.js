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
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState('Living Room');
  const [expandedImage, setExpandedImage] = useState(null);
  const [viewMode, setViewMode] = useState('catalog'); // 'catalog' or 'list'

  useEffect(() => {
    loadVendorsAndCategories();
    loadDatabaseStats();
    loadQuickCategories();
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

  const loadDatabaseStats = async () => {
    try {
      const response = await axios.get(`${API}/furniture/furniture-catalog/stats`);
      setStats(response.data);
    } catch (error) {
      console.error('Failed to load database stats:', error);
    }
  };

  const searchFurniture = async (categoryFilter = '') => {
    const effectiveQuery = searchQuery.trim();
    const effectiveCategory = categoryFilter || filters.category;
    
    if (!effectiveQuery && !filters.vendor && !effectiveCategory) {
      // Load all products if no filters
      try {
        const response = await axios.get(`${API}/furniture/furniture-catalog/recent?limit=100`);
        setSearchResults(response.data.items || []);
      } catch (error) {
        console.error('Failed to load all products:', error);
      }
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

  const testSingleProduct = async () => {
    try {
      const confirmed = window.confirm(
        `🧪 TEST SINGLE PRODUCT CLIPPING?\n\n` +
        `This will test the entire Houzz Pro clipper workflow with ONE product:\n\n` +
        `✅ Navigate to Four Hands dining chair\n` +
        `✅ Extract product data (as Houzz clipper would)\n` +
        `✅ Send to database via webhook\n` +
        `✅ Verify it appears in catalog\n\n` +
        `This takes 30-60 seconds and verifies everything works before mass operation.\n\n` +
        `Continue?`
      );
      
      if (!confirmed) return;
      
      setLoading(true);
      
      const response = await axios.post(`${API}/furniture/test-single-product-clip`);
      
      if (response.data.success) {
        alert(`🧪 Single Product Test Started!\n\n` +
              `Testing: ${response.data.test_url}\n` +
              `Estimated time: ${response.data.estimated_time}\n\n` +
              `Watch for the product to appear in your catalog!`);
        
        // Refresh stats and results every 10 seconds during test
        const refreshInterval = setInterval(() => {
          loadDatabaseStats();
          searchFurniture();
        }, 10000);
        
        // Stop refresh after 2 minutes
        setTimeout(() => {
          clearInterval(refreshInterval);
          loadDatabaseStats();
          searchFurniture();
          alert('🧪 Single product test should be complete! Check your catalog for the new item.');
        }, 120000);
      }
      
    } catch (error) {
      console.error('Failed to start single product test:', error);
      alert(`❌ Failed to start test: ${error.response?.data?.detail || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const startHouzzProScraper = async () => {
    try {
      const confirmed = window.confirm(
        `🏠 SCRAPE YOUR HOUZZ PRO ACCOUNT?\n\n` +
        `This will log into your Houzz Pro account and mirror all products you've already saved:\n\n` +
        `📋 Your "Selections" board\n` +
        `📚 Your "My Items" collection\n\n` +
        `The scraper will:\n` +
        `✅ Log into pro.houzz.com safely\n` +
        `✅ Extract all your saved product data\n` +
        `✅ Download images and details\n` +
        `✅ Add everything to your unified catalog\n\n` +
        `This takes 2-5 minutes and mirrors your existing Houzz Pro collection.\n\n` +
        `Continue?`
      );
      
      if (!confirmed) return;
      
      setLoading(true);
      
      const response = await axios.post(`${API}/furniture/start-houzz-pro-scraper`);
      
      if (response.data.success) {
        alert(`🎉 Houzz Pro Scraper Started!\n\n` +
              `The scraper is now mirroring products from your Houzz Pro account.\n\n` +
              `URLs being scraped:\n` +
              `• ${response.data.urls[0]}\n` +
              `• ${response.data.urls[1]}\n\n` +
              `All your saved products will appear here in the catalog!`);
        
        // Auto-refresh stats every 10 seconds during scraping
        const refreshInterval = setInterval(() => {
          loadDatabaseStats();
          searchFurniture(); // Refresh results
        }, 10000);
        
        // Stop auto-refresh after 10 minutes
        setTimeout(() => {
          clearInterval(refreshInterval);
          loadDatabaseStats();
          searchFurniture();
          alert('🏠 Houzz Pro scraping should be complete! Check your catalog for the mirrored items.');
        }, 600000);
      }
      
    } catch (error) {
      console.error('Failed to start Houzz Pro scraper:', error);
      alert(`❌ Failed to start Houzz Pro scraper: ${error.response?.data?.detail || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price) => {
    if (!price || price === 0) return 'Price on request';
    return typeof price === 'string' && price.startsWith('$') ? price : `$${price.toFixed(2)}`;
  };

  // Load all products on initial render
  useEffect(() => {
    searchFurniture();
  }, []);

  return (
    <div className="min-h-screen" style={{ 
      background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)'
    }}>
      {/* Header Section */}
      <div className="relative overflow-hidden">
        {/* Gold trim at top */}
        <div className="h-1 bg-gradient-to-r from-transparent via-yellow-400 to-transparent"></div>
        
        <div className="container mx-auto px-6 py-8">
          {/* Hero Header */}
          <div className="text-center mb-8">
            <h1 className="text-5xl font-bold mb-4" style={{
              background: 'linear-gradient(135deg, #ffd700 0%, #ffed4e 50%, #ffd700 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              textShadow: '2px 2px 4px rgba(0,0,0,0.5)'
            }}>
              🔍 UNIFIED FURNITURE CATALOG
            </h1>
            <p className="text-xl text-gray-300 mb-6">
              Your complete trade furniture collection - all vendors, all products, one beautiful catalog
            </p>
            <div className="w-32 h-0.5 bg-gradient-to-r from-transparent via-yellow-400 to-transparent mx-auto"></div>
          </div>

          {/* Stats Dashboard */}
          {stats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-gradient-to-br from-black/60 to-gray-900/80 rounded-xl p-4 border border-yellow-400/30">
                <div className="text-3xl font-bold text-yellow-400">{stats.total_items?.toLocaleString()}</div>
                <div className="text-gray-300 text-sm">Total Products</div>
              </div>
              <div className="bg-gradient-to-br from-black/60 to-gray-900/80 rounded-xl p-4 border border-blue-400/30">
                <div className="text-3xl font-bold text-blue-400">{Object.keys(stats.vendors || {}).length}</div>
                <div className="text-gray-300 text-sm">Trade Vendors</div>
              </div>
              <div className="bg-gradient-to-br from-black/60 to-gray-900/80 rounded-xl p-4 border border-purple-400/30">
                <div className="text-3xl font-bold text-purple-400">{Object.keys(stats.categories || {}).length}</div>
                <div className="text-gray-300 text-sm">Categories</div>
              </div>
              <div className="bg-gradient-to-br from-black/60 to-gray-900/80 rounded-xl p-4 border border-green-400/30">
                <div className="text-3xl font-bold text-green-400">{stats.recent_additions || 0}</div>
                <div className="text-gray-300 text-sm">Recently Clipped</div>
              </div>
            </div>
          )}

          {/* Search and Filter Section */}
          <div className="bg-gradient-to-br from-black/60 to-gray-900/80 rounded-2xl p-6 border border-yellow-400/30 mb-8">
            {/* Main Search Bar */}
            <div className="flex gap-4 mb-6">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && searchFurniture()}
                placeholder="Search furniture... (chandeliers, dining chairs, console tables)"
                className="flex-1 px-6 py-4 bg-black/40 border-2 border-yellow-400/50 rounded-xl text-white placeholder-gray-400 text-lg focus:outline-none focus:ring-2 focus:ring-yellow-400"
              />
              
              <button
                onClick={() => searchFurniture()}
                disabled={isSearching}
                className="px-8 py-4 bg-gradient-to-r from-yellow-400 to-yellow-600 hover:from-yellow-500 hover:to-yellow-700 disabled:from-gray-600 disabled:to-gray-700 text-black font-bold rounded-xl text-lg transition-all transform hover:scale-105"
              >
                {isSearching ? '🔍...' : '🔍 SEARCH'}
              </button>
            </div>

            {/* Filters Row */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
              <select
                value={filters.vendor}
                onChange={(e) => setFilters({ ...filters, vendor: e.target.value })}
                className="px-4 py-3 bg-black/40 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-400"
              >
                <option value="">All Vendors</option>
                {vendors.map(vendor => (
                  <option key={vendor} value={vendor}>{vendor}</option>
                ))}
              </select>

              <select
                value={filters.category}
                onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                className="px-4 py-3 bg-black/40 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-400"
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
                placeholder="Min Price ($)"
                className="px-4 py-3 bg-black/40 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400"
              />

              <input
                type="text"
                value={filters.max_price}
                onChange={(e) => setFilters({ ...filters, max_price: e.target.value })}
                placeholder="Max Price ($)"
                className="px-4 py-3 bg-black/40 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400"
              />

              <div className="flex gap-2">
                <button
                  onClick={clearFilters}
                  className="px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-colors"
                >
                  CLEAR
                </button>
                <button
                  onClick={testSingleProduct}
                  disabled={loading}
                  className="px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:from-gray-600 disabled:to-gray-700 text-white rounded-lg font-semibold transition-colors"
                >
                  {loading ? '🧪...' : '🧪 TEST 1'}
                </button>
                <button
                  onClick={startHouzzClipperBot}
                  disabled={loading}
                  className="px-4 py-3 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 disabled:from-gray-600 disabled:to-gray-700 text-white rounded-lg font-semibold transition-colors"
                >
                  {loading ? '🤖...' : '🤖 CLIP ALL'}
                </button>
              </div>
            </div>

            {/* Quick Category Buttons */}
            {quickCategories.length > 0 && (
              <div>
                <h3 className="text-yellow-400 font-semibold mb-3">⚡ Quick Categories</h3>
                <div className="flex flex-wrap gap-2">
                  {quickCategories.slice(0, 12).map((category, index) => (
                    <button
                      key={index}
                      onClick={() => quickCategorySearch(category)}
                      className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                        filters.category === category 
                          ? 'bg-yellow-400 text-black' 
                          : 'bg-black/40 text-gray-300 hover:bg-yellow-400/20 hover:text-yellow-400'
                      }`}
                    >
                      {category.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* CATALOG VIEW - PICTURES FOCUSED */}
          <div className="bg-gradient-to-br from-black/60 to-gray-900/80 rounded-2xl p-6 border border-yellow-400/30">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-yellow-400">
                📸 PRODUCT CATALOG ({searchResults.length} items)
              </h2>
              <div className="text-gray-400 text-sm">
                Showing your clipped furniture collection
              </div>
            </div>

            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-yellow-400 mx-auto mb-4"></div>
                <p className="text-gray-300">Loading your furniture catalog...</p>
              </div>
            ) : searchResults.length === 0 ? (
              <div className="text-center py-16">
                <div className="text-8xl mb-6">🪑</div>
                <h3 className="text-3xl font-bold text-yellow-400 mb-4">Start Building Your Catalog</h3>
                <p className="text-gray-300 text-lg mb-8 max-w-2xl mx-auto">
                  Use the "🤖 CLIP ALL" button to automatically clip all products from your trade vendors using Houzz Pro clipper.
                  All clipped products will appear here as a beautiful, searchable catalog.
                </p>
                <button
                  onClick={startHouzzClipperBot}
                  disabled={loading}
                  className="px-8 py-4 bg-gradient-to-r from-yellow-400 to-yellow-600 hover:from-yellow-500 hover:to-yellow-700 text-black font-bold rounded-xl text-lg transition-all transform hover:scale-105"
                >
                  🤖 START CLIPPING ALL PRODUCTS
                </button>
              </div>
            ) : (
              /* BEAUTIFUL CATALOG GRID - PICTURE FOCUSED */
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {searchResults.map((product, index) => (
                  <div key={index} className="bg-gradient-to-br from-black/80 to-gray-900/90 rounded-xl overflow-hidden border border-yellow-400/20 hover:border-yellow-400/60 transition-all duration-300 hover:scale-105 hover:shadow-2xl">
                    
                    {/* PROMINENT PRODUCT IMAGE */}
                    <div className="aspect-square bg-gradient-to-br from-gray-800 to-gray-900 relative overflow-hidden">
                      {product.image_url ? (
                        <img
                          src={product.image_url}
                          alt={product.name}
                          className="w-full h-full object-cover cursor-pointer hover:scale-110 transition-transform duration-300"
                          onClick={() => setExpandedImage(product.image_url)}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <div className="text-6xl text-gray-600">🪑</div>
                        </div>
                      )}
                      
                      {/* Source Badge */}
                      <div className="absolute top-2 right-2">
                        <span className="px-2 py-1 bg-green-600 text-white text-xs font-bold rounded">
                          HOUZZ
                        </span>
                      </div>
                      
                      {/* Price Overlay */}
                      <div className="absolute bottom-2 left-2">
                        <div className="bg-black/80 px-3 py-1 rounded-lg">
                          <span className="text-yellow-400 font-bold text-lg">
                            {formatPrice(product.cost)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Product Details */}
                    <div className="p-4">
                      <h3 className="text-white font-bold text-lg mb-2 line-clamp-2">
                        {product.name}
                      </h3>
                      
                      <div className="text-yellow-400 font-semibold mb-2">
                        {product.vendor}
                      </div>
                      
                      <div className="flex flex-wrap gap-1 mb-3">
                        {product.category && (
                          <span className="bg-blue-600/30 text-blue-400 px-2 py-1 rounded text-xs">
                            {product.category}
                          </span>
                        )}
                        {product.sku && (
                          <span className="bg-gray-600/30 text-gray-400 px-2 py-1 rounded text-xs">
                            {product.sku}
                          </span>
                        )}
                      </div>
                      
                      {product.dimensions && (
                        <div className="text-gray-400 text-sm mb-3">
                          📏 {product.dimensions}
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="flex flex-col gap-2">
                        <div className="grid grid-cols-2 gap-2">
                          {product.product_url && (
                            <a
                              href={product.product_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-3 py-2 bg-yellow-400 hover:bg-yellow-500 text-black text-center rounded font-semibold text-sm transition-colors"
                            >
                              VIEW
                            </a>
                          )}
                          
                          <button
                            onClick={() => alert(`Adding "${product.name}" to checklist!`)}
                            className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-semibold text-sm transition-colors"
                          >
                            ADD
                          </button>
                        </div>
                        
                        <button
                          onClick={() => alert(`Creating Canva board with "${product.name}"!`)}
                          className="w-full px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded font-semibold text-sm transition-colors"
                        >
                          🎨 CANVA BOARD
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Gold trim at bottom */}
        <div className="h-1 bg-gradient-to-r from-transparent via-yellow-400 to-transparent"></div>
      </div>

      {/* IMAGE EXPANSION MODAL */}
      {expandedImage && (
        <div 
          className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4"
          onClick={() => setExpandedImage(null)}
        >
          <div className="relative max-w-5xl max-h-screen">
            <button
              onClick={() => setExpandedImage(null)}
              className="absolute -top-12 right-0 bg-yellow-400 hover:bg-yellow-500 text-black rounded-full w-10 h-10 flex items-center justify-center text-xl font-bold"
            >
              ×
            </button>
            <img 
              src={expandedImage} 
              alt="Expanded view" 
              className="max-w-full max-h-screen object-contain rounded-lg border-2 border-yellow-400"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default UnifiedFurnitureSearch;
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const UnifiedFurnitureSearch = ({ onSelectProduct }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    vendor: '',
    category: '',
    min_price: '',
    max_price: ''
  });
  const [searchResults, setSearchResults] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [categories, setCategories] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    loadVendorsAndCategories();
    loadDatabaseStats();
  }, []);

  const loadVendorsAndCategories = async () => {
    try {
      const [vendorsResponse, categoriesResponse] = await Promise.all([
        axios.get(`${API}/furniture/vendors`),
        axios.get(`${API}/furniture/categories`)
      ]);
      
      setVendors(vendorsResponse.data.vendors || []);
      setCategories(categoriesResponse.data.categories || []);
    } catch (error) {
      console.error('Failed to load vendors and categories:', error);
    }
  };

  const loadDatabaseStats = async () => {
    try {
      const response = await axios.get(`${API}/furniture/stats`);
      setStats(response.data);
    } catch (error) {
      console.error('Failed to load database stats:', error);
    }
  };

  const searchFurniture = async () => {
    if (!searchQuery.trim() && !filters.vendor && !filters.category) {
      return;
    }

    setIsSearching(true);
    try {
      const params = new URLSearchParams();
      
      if (searchQuery.trim()) params.append('query', searchQuery.trim());
      if (filters.vendor) params.append('vendor', filters.vendor);
      if (filters.category) params.append('category', filters.category);
      if (filters.min_price) params.append('min_price', filters.min_price);
      if (filters.max_price) params.append('max_price', filters.max_price);

      const response = await axios.get(`${API}/furniture/search?${params}`);
      setSearchResults(response.data.products || []);
    } catch (error) {
      console.error('Search failed:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const clearFilters = () => {
    setSearchQuery('');
    setFilters({
      vendor: '',
      category: '',
      min_price: '',
      max_price: ''
    });
    setSearchResults([]);
  };

  const scrapeAllVendors = async () => {
    setLoading(true);
    try {
      const response = await axios.post(`${API}/furniture/scrape-vendors`);
      
      if (response.data.status === 'success') {
        alert(`✅ Database updated! ${response.data.results.total_products} products scraped from ${response.data.results.vendors_scraped} vendors`);
        loadDatabaseStats();
        loadVendorsAndCategories();
      }
    } catch (error) {
      console.error('Scraping failed:', error);
      alert('❌ Failed to scrape vendors. Check console for details.');
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (priceStr) => {
    if (!priceStr) return 'Price on request';
    return priceStr.startsWith('$') ? priceStr : `$${priceStr}`;
  };

  return (
    <div className="bg-gray-800 rounded-lg border border-gray-700">
      {/* Header */}
      <div className="p-6 border-b border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-white">
            🔍 Unified Furniture Search Engine
          </h2>
          <button
            onClick={scrapeAllVendors}
            disabled={loading}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 disabled:bg-gray-600 text-white rounded-md font-medium transition-colors"
          >
            {loading ? '⏳ Updating...' : '🔄 Update Database'}
          </button>
        </div>
        
        <p className="text-gray-300 mb-4">
          <strong>THE DREAM IS REAL!</strong> Search ALL furniture from ALL vendors in one place. No more 1000 tabs!
        </p>

        {/* Database Stats */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="bg-gray-900 p-3 rounded border border-gray-600">
              <div className="text-amber-400 font-semibold">Total Products</div>
              <div className="text-2xl font-bold text-white">{stats.total_products.toLocaleString()}</div>
            </div>
            <div className="bg-gray-900 p-3 rounded border border-gray-600">
              <div className="text-amber-400 font-semibold">Vendors</div>
              <div className="text-2xl font-bold text-white">{stats.vendors.length}</div>
            </div>
            <div className="bg-gray-900 p-3 rounded border border-gray-600">
              <div className="text-amber-400 font-semibold">Categories</div>
              <div className="text-2xl font-bold text-white">{stats.categories.length}</div>
            </div>
          </div>
        )}
      </div>

      {/* Search Interface */}
      <div className="p-6">
        {/* Search Bar */}
        <div className="mb-4">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && searchFurniture()}
            placeholder="Search furniture... (e.g., 'dining chair', 'table lamp', 'sofa')"
            className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500 text-lg"
          />
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
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
            onClick={searchFurniture}
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
                    <div className="aspect-square bg-gray-800">
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                    </div>
                  )}
                  
                  {/* Product Details */}
                  <div className="p-4">
                    <h4 className="font-semibold text-white mb-2 line-clamp-2">
                      {product.name}
                    </h4>
                    
                    <div className="text-sm text-gray-300 mb-2">
                      <div className="flex justify-between">
                        <span className="text-amber-400">{product.vendor}</span>
                        <span className="font-semibold text-white">{formatPrice(product.price)}</span>
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
                      <div className="text-xs text-gray-400 mb-3">
                        Dimensions: {product.dimensions}
                      </div>
                    )}
                    
                    <div className="flex space-x-2">
                      {product.url && (
                        <a
                          href={product.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 px-3 py-2 bg-amber-600 hover:bg-amber-700 text-white text-center rounded text-sm font-medium transition-colors"
                        >
                          View Original
                        </a>
                      )}
                      
                      {onSelectProduct && (
                        <button
                          onClick={() => onSelectProduct(product)}
                          className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-medium transition-colors"
                        >
                          Add to Project
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* No Results */}
        {searchResults.length === 0 && isSearching === false && searchQuery && (
          <div className="text-center py-8">
            <div className="text-gray-400 mb-2">No products found matching your search.</div>
            <div className="text-gray-500 text-sm">Try adjusting your search terms or filters.</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UnifiedFurnitureSearch;
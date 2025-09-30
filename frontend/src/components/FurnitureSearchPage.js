import React, { useState, useEffect } from 'react';
import { Search, Filter, ShoppingCart, Eye } from 'lucide-react';
import ProductClipperModal from './ProductClipperModal';

const FurnitureSearchPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [stats, setStats] = useState({});
  
  // Filters
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedVendor, setSelectedVendor] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [selectedStyle, setSelectedStyle] = useState('');
  
  const [showClipperModal, setShowClipperModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [showAddToProjectModal, setShowAddToProjectModal] = useState(false);

  const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

  // Load initial data
  useEffect(() => {
    loadCategories();
    loadVendors();
    loadStats();
  }, []);

  const loadCategories = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/furniture-catalog/categories`);
      if (response.ok) {
        const data = await response.json();
        setCategories(data.categories || []);
      }
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const loadVendors = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/furniture-catalog/vendors`);
      if (response.ok) {
        const data = await response.json();
        setVendors(data.vendors || []);
      }
    } catch (error) {
      console.error('Error loading vendors:', error);
    }
  };

  const loadStats = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/furniture-catalog/stats`);
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handleSearch = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.append('query', searchQuery);
      if (selectedCategory) params.append('category', selectedCategory);
      if (selectedVendor) params.append('vendor', selectedVendor);
      if (minPrice) params.append('min_price', minPrice);
      if (maxPrice) params.append('max_price', maxPrice);
      if (selectedStyle) params.append('style', selectedStyle);

      const response = await fetch(`${BACKEND_URL}/api/furniture-catalog/search?${params}`);
      if (response.ok) {
        const data = await response.json();
        setResults(data.results || []);
      } else {
        alert('Search failed');
      }
    } catch (error) {
      console.error('Error searching:', error);
      alert('Error searching furniture catalog');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToProject = (item) => {
    setSelectedItem(item);
    setShowAddToProjectModal(true);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <h1 className="text-5xl font-bold text-[#D4A574] mb-4">FURNITURE SEARCH</h1>
        <p className="text-gray-400 text-lg">Search across ALL {stats.total_items || 0} items from {vendors.length} vendors</p>
        
        <button
          onClick={() => setShowClipperModal(true)}
          className="mt-4 px-6 py-3 bg-[#7AC142] hover:bg-[#6AB032] text-white rounded-lg font-semibold"
        >
          + CLIP NEW FURNITURE
        </button>
      </div>

      {/* Search and Filters */}
      <div className="max-w-7xl mx-auto mb-8 space-y-4">
        {/* Search Bar */}
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder="Search chairs, tables, lamps... (across ALL vendors)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className="w-full px-6 py-4 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 text-lg focus:outline-none focus:border-[#D4A574]"
            />
            <Search className="absolute right-4 top-4 text-gray-500" size={24} />
          </div>
          <button
            onClick={handleSearch}
            disabled={loading}
            className="px-8 py-4 bg-[#D4A574] hover:bg-[#C49564] text-black rounded-lg font-bold disabled:opacity-50"
          >
            {loading ? 'SEARCHING...' : 'SEARCH'}
          </button>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-5 gap-4">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white"
          >
            <option value="">All Categories</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>

          <select
            value={selectedVendor}
            onChange={(e) => setSelectedVendor(e.target.value)}
            className="px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white"
          >
            <option value="">All Vendors</option>
            {vendors.map(vendor => (
              <option key={vendor} value={vendor}>{vendor}</option>
            ))}
          </select>

          <input
            type="number"
            placeholder="Min Price"
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
            className="px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white"
          />

          <input
            type="number"
            placeholder="Max Price"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            className="px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white"
          />

          <select
            value={selectedStyle}
            onChange={(e) => setSelectedStyle(e.target.value)}
            className="px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white"
          >
            <option value="">All Styles</option>
            <option value="Modern">Modern</option>
            <option value="Traditional">Traditional</option>
            <option value="Transitional">Transitional</option>
            <option value="Contemporary">Contemporary</option>
            <option value="Rustic">Rustic</option>
          </select>
        </div>
      </div>

      {/* Results Grid */}
      <div className="max-w-7xl mx-auto">
        {loading ? (
          <div className="text-center py-20">
            <div className="text-2xl text-gray-400">Searching across all vendors...</div>
          </div>
        ) : results.length > 0 ? (
          <div className="grid grid-cols-4 gap-6">
            {results.map(item => (
              <div key={item.id} className="bg-gray-800 rounded-lg overflow-hidden border border-gray-700 hover:border-[#D4A574] transition-all">
                {/* Image */}
                <div className="aspect-square bg-gray-700 relative group">
                  {item.image_url ? (
                    <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-500">No Image</div>
                  )}
                  <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                    <button
                      onClick={() => window.open(item.product_url, '_blank')}
                      className="p-3 bg-white rounded-full hover:bg-gray-200"
                      title="View on vendor site"
                    >
                      <Eye size={20} className="text-black" />
                    </button>
                    <button
                      onClick={() => handleAddToProject(item)}
                      className="p-3 bg-[#D4A574] rounded-full hover:bg-[#C49564]"
                      title="Add to project"
                    >
                      <ShoppingCart size={20} className="text-black" />
                    </button>
                  </div>
                </div>
                
                {/* Details */}
                <div className="p-4">
                  <div className="text-xs text-[#D4A574] font-semibold mb-1">{item.vendor}</div>
                  <h3 className="text-white font-semibold mb-2 line-clamp-2">{item.name}</h3>
                  <div className="text-sm text-gray-400 mb-2">{item.sku}</div>
                  <div className="text-xl text-[#D4A574] font-bold">${item.cost?.toFixed(2)}</div>
                  {item.dimensions && (
                    <div className="text-xs text-gray-500 mt-2">{item.dimensions}</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <div className="text-2xl text-gray-400 mb-4">No results found</div>
            <div className="text-gray-500">Try a different search or clip more furniture to your catalog</div>
          </div>
        )}
      </div>

      {/* Clipper Modal */}
      {showClipperModal && (
        <ProductClipperModal
          isOpen={showClipperModal}
          onClose={() => setShowClipperModal(false)}
          scrapedData={{}}
          projects={[]}
          mode="catalog"  // Save to catalog instead of project
        />
      )}
    </div>
  );
};

export default FurnitureSearchPage;

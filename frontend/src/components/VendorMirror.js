import React, { useState, useEffect } from 'react';
import { Search, X, ExternalLink, Maximize2, Minimize2, RefreshCw, ChevronDown, ChevronUp, Grid, Columns } from 'lucide-react';

/**
 * Vendor Mirror - Multi-Vendor Search Interface
 * Displays multiple vendor sites in iframes for simultaneous browsing
 */

// Vendor configurations with their search URL patterns
const VENDORS = [
  {
    key: 'four_hands',
    name: 'Four Hands',
    color: '#8B7355',
    loginUrl: 'https://fourhands.com/login',
    searchUrl: 'https://fourhands.com/catalog?search={query}',
    homeUrl: 'https://fourhands.com/catalog'
  },
  {
    key: 'uttermost',
    name: 'Uttermost',
    color: '#4A5568',
    loginUrl: 'https://www.uttermost.com/customer/account/login/',
    searchUrl: 'https://www.uttermost.com/catalogsearch/result/?q={query}',
    homeUrl: 'https://www.uttermost.com/'
  },
  {
    key: 'rowe',
    name: 'Rowe Furniture',
    color: '#744210',
    loginUrl: 'https://www.rowefurniture.com/customer/account/login/',
    searchUrl: 'https://www.rowefurniture.com/catalogsearch/result/?q={query}',
    homeUrl: 'https://www.rowefurniture.com/'
  },
  {
    key: 'visual_comfort',
    name: 'Visual Comfort',
    color: '#1A365D',
    loginUrl: 'https://www.visualcomfort.com/account/login',
    searchUrl: 'https://www.visualcomfort.com/search?q={query}',
    homeUrl: 'https://www.visualcomfort.com/'
  },
  {
    key: 'loloi',
    name: 'Loloi Rugs',
    color: '#553C9A',
    loginUrl: 'https://www.loloirugs.com/account/login',
    searchUrl: 'https://www.loloirugs.com/search?q={query}',
    homeUrl: 'https://www.loloirugs.com/'
  },
  {
    key: 'gabby',
    name: 'Gabby',
    color: '#975A16',
    loginUrl: 'https://gabbyhome.com/customer/account/login/',
    searchUrl: 'https://gabbyhome.com/catalogsearch/result/?q={query}',
    homeUrl: 'https://gabbyhome.com/'
  },
  {
    key: 'regina_andrew',
    name: 'Regina Andrew',
    color: '#2D3748',
    loginUrl: 'https://www.reginaandrew.com/customer/account/login/',
    searchUrl: 'https://www.reginaandrew.com/catalogsearch/result/?q={query}',
    homeUrl: 'https://www.reginaandrew.com/'
  },
  {
    key: 'surya',
    name: 'Surya',
    color: '#285E61',
    loginUrl: 'https://www.surya.com/login',
    searchUrl: 'https://www.surya.com/search?q={query}',
    homeUrl: 'https://www.surya.com/'
  },
  {
    key: 'bernhardt',
    name: 'Bernhardt',
    color: '#742A2A',
    loginUrl: 'https://www.bernhardt.com/login',
    searchUrl: 'https://www.bernhardt.com/search?q={query}',
    homeUrl: 'https://www.bernhardt.com/'
  }
];

const VendorMirror = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSearch, setActiveSearch] = useState('');
  const [selectedVendors, setSelectedVendors] = useState(VENDORS.map(v => v.key));
  const [expandedVendor, setExpandedVendor] = useState(null);
  const [layout, setLayout] = useState('grid'); // 'grid' or 'columns'
  const [showVendorSelector, setShowVendorSelector] = useState(false);
  const [iframeKeys, setIframeKeys] = useState({}); // For forcing iframe refresh

  // Handle search
  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setActiveSearch(searchQuery.trim());
      // Reset iframe keys to force reload
      const newKeys = {};
      VENDORS.forEach(v => {
        newKeys[v.key] = Date.now();
      });
      setIframeKeys(newKeys);
    }
  };

  // Toggle vendor selection
  const toggleVendor = (vendorKey) => {
    setSelectedVendors(prev => 
      prev.includes(vendorKey) 
        ? prev.filter(k => k !== vendorKey)
        : [...prev, vendorKey]
    );
  };

  // Refresh a specific iframe
  const refreshVendor = (vendorKey) => {
    setIframeKeys(prev => ({
      ...prev,
      [vendorKey]: Date.now()
    }));
  };

  // Open vendor in new tab
  const openInNewTab = (vendor) => {
    const url = activeSearch 
      ? vendor.searchUrl.replace('{query}', encodeURIComponent(activeSearch))
      : vendor.homeUrl;
    window.open(url, '_blank');
  };

  // Get the current URL for a vendor
  const getVendorUrl = (vendor) => {
    if (activeSearch) {
      return vendor.searchUrl.replace('{query}', encodeURIComponent(activeSearch));
    }
    return vendor.loginUrl; // Show login page by default
  };

  // Filter vendors based on selection
  const activeVendors = VENDORS.filter(v => selectedVendors.includes(v.key));

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Gold Header */}
      <div className="w-full h-32" style={{ 
        background: `linear-gradient(135deg, #8b7355 0%, #a0845c 50%, #8b7355 100%)`,
        boxShadow: '0 4px 20px rgba(139, 115, 85, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)'
      }}>
        <div className="flex items-center justify-center h-full relative px-8">
          <img 
            src="https://customer-assets.emergentagent.com/job_sleek-showcase-46/artifacts/c5c84fh5_Established%20logo.png" 
            alt="ESTABLISHEDDESIGN CO." 
            className="w-full h-20 object-contain filter drop-shadow-lg"
            style={{
              filter: 'drop-shadow(0 0 10px rgba(255, 215, 0, 0.4))',
              maxWidth: '100%'
            }}
          />
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-gray-900 border-b border-gray-700 sticky top-0 z-50">
        <div className="max-w-full mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold text-[#D4AF37] whitespace-nowrap">
              🔍 Vendor Mirror
            </h1>
            
            <form onSubmit={handleSearch} className="flex-1 flex gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search ALL vendors at once... (e.g., 'sofa', 'dining chair', 'brass lamp')"
                  className="w-full pl-12 pr-4 py-3 bg-gray-800 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-[#D4AF37]"
                />
              </div>
              <button
                type="submit"
                className="px-6 py-3 text-black font-semibold rounded-xl transition flex items-center gap-2"
                style={{
                  background: `linear-gradient(135deg, #8b7355 0%, #D4AF37 50%, #8b7355 100%)`
                }}
              >
                <Search size={20} />
                Search All
              </button>
            </form>

            {/* Layout Toggle */}
            <div className="flex items-center gap-2 bg-gray-800 rounded-lg p-1">
              <button
                onClick={() => setLayout('grid')}
                className={`p-2 rounded ${layout === 'grid' ? 'bg-[#8b7355] text-white' : 'text-gray-400 hover:text-white'}`}
              >
                <Grid size={18} />
              </button>
              <button
                onClick={() => setLayout('columns')}
                className={`p-2 rounded ${layout === 'columns' ? 'bg-[#8b7355] text-white' : 'text-gray-400 hover:text-white'}`}
              >
                <Columns size={18} />
              </button>
            </div>

            {/* Vendor Selector */}
            <div className="relative">
              <button
                onClick={() => setShowVendorSelector(!showVendorSelector)}
                className="px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg flex items-center gap-2 hover:border-[#D4AF37]"
              >
                <span>{selectedVendors.length} Vendors</span>
                <ChevronDown size={16} className={`transition ${showVendorSelector ? 'rotate-180' : ''}`} />
              </button>
              
              {showVendorSelector && (
                <div className="absolute right-0 top-full mt-2 w-64 bg-gray-800 border border-gray-600 rounded-xl shadow-xl z-50 p-3">
                  <div className="text-sm text-gray-400 mb-2">Select vendors to display:</div>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {VENDORS.map(vendor => (
                      <label key={vendor.key} className="flex items-center gap-2 cursor-pointer hover:bg-gray-700 p-2 rounded">
                        <input
                          type="checkbox"
                          checked={selectedVendors.includes(vendor.key)}
                          onChange={() => toggleVendor(vendor.key)}
                          className="rounded border-gray-500"
                        />
                        <div 
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: vendor.color }}
                        />
                        <span>{vendor.name}</span>
                      </label>
                    ))}
                  </div>
                  <div className="mt-3 pt-3 border-t border-gray-700 flex gap-2">
                    <button
                      onClick={() => setSelectedVendors(VENDORS.map(v => v.key))}
                      className="flex-1 px-3 py-1 text-xs bg-gray-700 rounded hover:bg-gray-600"
                    >
                      Select All
                    </button>
                    <button
                      onClick={() => setSelectedVendors([])}
                      className="flex-1 px-3 py-1 text-xs bg-gray-700 rounded hover:bg-gray-600"
                    >
                      Clear All
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {activeSearch && (
            <div className="mt-3 flex items-center gap-2">
              <span className="text-gray-400">Showing results for:</span>
              <span className="px-3 py-1 bg-[#8b7355]/30 text-[#D4AF37] rounded-full font-medium">
                "{activeSearch}"
              </span>
              <button
                onClick={() => { setActiveSearch(''); setSearchQuery(''); }}
                className="text-gray-400 hover:text-white"
              >
                <X size={16} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Vendor Panels - Since most vendors block iframes, we show link cards instead */}
      <div className="p-4">
        {activeVendors.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <p className="text-xl mb-2">No vendors selected</p>
            <p>Click "Vendors" button to select which vendor sites to display</p>
          </div>
        ) : (
          <>
            {/* Quick Action: Open All in Tabs */}
            {activeSearch && (
              <div className="mb-6 p-4 rounded-xl border border-[#D4AF37] bg-[#8b7355]/20">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-[#D4AF37] font-semibold">🚀 Open Search in All Vendors</h3>
                    <p className="text-gray-400 text-sm">Click below to open "{activeSearch}" search in all {activeVendors.length} vendor sites</p>
                  </div>
                  <button
                    onClick={() => {
                      activeVendors.forEach(vendor => {
                        const url = vendor.searchUrl.replace('{query}', encodeURIComponent(activeSearch));
                        window.open(url, '_blank');
                      });
                    }}
                    className="px-6 py-3 text-black font-semibold rounded-xl"
                    style={{
                      background: `linear-gradient(135deg, #8b7355 0%, #D4AF37 50%, #8b7355 100%)`
                    }}
                  >
                    Open All {activeVendors.length} Tabs
                  </button>
                </div>
              </div>
            )}

            {/* Vendor Cards Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {activeVendors.map(vendor => (
                <div 
                  key={vendor.key}
                  className="bg-gray-900 rounded-xl overflow-hidden border border-gray-700 hover:border-[#D4AF37] transition group"
                >
                  {/* Vendor Header */}
                  <div 
                    className="px-4 py-3"
                    style={{ backgroundColor: vendor.color }}
                  >
                    <span className="font-semibold text-white">{vendor.name}</span>
                  </div>
                  
                  {/* Vendor Actions */}
                  <div className="p-4 space-y-3">
                    {activeSearch ? (
                      <>
                        <button
                          onClick={() => window.open(vendor.searchUrl.replace('{query}', encodeURIComponent(activeSearch)), '_blank')}
                          className="w-full py-3 px-4 bg-[#8b7355] text-white rounded-lg hover:bg-[#a0845c] transition flex items-center justify-center gap-2"
                        >
                          <Search size={18} />
                          Search "{activeSearch}"
                        </button>
                        <button
                          onClick={() => window.open(vendor.homeUrl, '_blank')}
                          className="w-full py-2 px-4 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition flex items-center justify-center gap-2 text-sm"
                        >
                          <ExternalLink size={16} />
                          Browse Catalog
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => window.open(vendor.loginUrl, '_blank')}
                          className="w-full py-3 px-4 bg-[#8b7355] text-white rounded-lg hover:bg-[#a0845c] transition flex items-center justify-center gap-2"
                        >
                          <ExternalLink size={18} />
                          Login & Browse
                        </button>
                        <p className="text-xs text-gray-500 text-center">
                          Opens in new tab
                        </p>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Usage Instructions */}
            {!activeSearch && (
              <div className="mt-8 p-6 bg-gray-900 rounded-xl border border-gray-700">
                <h3 className="text-[#D4AF37] font-semibold text-lg mb-4">📖 How to Use Vendor Mirror</h3>
                <div className="grid md:grid-cols-3 gap-6 text-gray-300">
                  <div>
                    <div className="text-2xl mb-2">1️⃣</div>
                    <p className="font-medium text-white">Login to Vendors</p>
                    <p className="text-sm text-gray-400">Click each vendor card above to open their login page. Log in with your dealer credentials.</p>
                  </div>
                  <div>
                    <div className="text-2xl mb-2">2️⃣</div>
                    <p className="font-medium text-white">Search Products</p>
                    <p className="text-sm text-gray-400">Type what you're looking for (e.g., "velvet sofa", "brass chandelier") in the search bar above.</p>
                  </div>
                  <div>
                    <div className="text-2xl mb-2">3️⃣</div>
                    <p className="font-medium text-white">Open All Results</p>
                    <p className="text-sm text-gray-400">Click "Open All Tabs" to see search results from ALL vendors at once in separate browser tabs.</p>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default VendorMirror;

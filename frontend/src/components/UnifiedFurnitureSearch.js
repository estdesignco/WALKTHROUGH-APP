import React, { useState, useEffect } from 'react';

const UnifiedFurnitureSearch = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [integrationStatus, setIntegrationStatus] = useState({});
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
  const [workflowSettings, setWorkflowSettings] = useState({
    create_canva: false,
    add_to_houzz: false,
    notify_teams: true
  });
  const [selectedProducts, setSelectedProducts] = useState([]);

  const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

  useEffect(() => {
    loadInitialData();
    checkIntegrationStatus();
  }, []);

  const checkIntegrationStatus = async () => {
    try {
      const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';
      const response = await fetch(`${BACKEND_URL}/api/real-integrations/integration-status`);
      if (response.ok) {
        const status = await response.json();
        setIntegrationStatus(status.integrations || {});
      }
    } catch (err) {
      console.error('Failed to check integration status:', err);
    }
  };

  const loadInitialData = async () => {
    try {
      const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';
      
      // Set vendors for real scraping
      setVendors([
        { name: 'Four Hands', id: 'fourhands' },
        { name: 'Hudson Valley Lighting', id: 'hudson-valley' },
        { name: 'Wayfair', id: 'wayfair' }
      ]);

      // Load sample products initially
      setProducts([
        {
          id: '1',
          title: 'Modern Dining Chair Set',
          seller: 'Four Hands',
          price: '$299.99',
          category: 'Seating',
          url: 'https://example.com/product1',
          image_url: 'https://via.placeholder.com/300x200',
          scraped_at: new Date().toISOString()
        },
        {
          id: '2',
          title: 'Hudson Valley Pendant Light',
          seller: 'Hudson Valley Lighting', 
          price: '$459.99',
          category: 'Lighting',
          url: 'https://example.com/product2',
          image_url: 'https://via.placeholder.com/300x200',
          scraped_at: new Date().toISOString()
        }
      ]);

      setFilterOptions({
        categories: ['Seating', 'Lighting', 'Tables', 'Storage'],
        room_types: ['Living Room', 'Dining Room', 'Bedroom', 'Kitchen'],
        vendors: ['Four Hands', 'Hudson Valley Lighting', 'Wayfair'],
        styles: ['Modern', 'Traditional', 'Contemporary', 'Rustic'],
        colors: ['Black', 'White', 'Brown', 'Gray', 'Natural'],
        materials: ['Wood', 'Metal', 'Fabric', 'Glass', 'Leather']
      });
      
    } catch (err) {
      console.error('Failed to load initial data:', err);
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

  const handleRealSearch = async () => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);
      
      const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';
      
      const searchRequest = {
        query: searchQuery || 'furniture',
        filters: {
          ...filters,
          price_min: filters.min_price ? parseFloat(filters.min_price) : undefined,
          price_max: filters.max_price ? parseFloat(filters.max_price) : undefined
        },
        max_results: 50
      };
      
      const response = await fetch(`${BACKEND_URL}/api/real-integrations/search-products`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(searchRequest)
      });
      
      if (response.ok) {
        const data = await response.json();
        setProducts(data.products || []);
        setSuccess(`Found ${data.products_found || 0} real products from vendor websites!`);
        
        if (data.teams_notified) {
          setSuccess(prev => prev + ' Teams notification sent.');
        }
      } else {
        const errorData = await response.json();
        setError(errorData.detail || 'Real search failed');
      }
    } catch (err) {
      setError('Real search error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = handleRealSearch;

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

  const handleQuickWorkflow = async () => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);
      
      const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';
      
      const response = await fetch(`${BACKEND_URL}/api/real-integrations/quick-workflow`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          search_query: searchQuery || 'furniture',
          create_canva: workflowSettings.create_canva,
          add_to_houzz: workflowSettings.add_to_houzz,
          notify_teams: workflowSettings.notify_teams
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        const results = data.workflow_results;
        
        setProducts(results.products || []);
        
        let successMessage = `Workflow completed! Found ${results.products.length} products.`;
        if (results.steps_completed.includes('canva')) {
          successMessage += ' Canva project created.';
        }
        if (results.steps_completed.includes('houzz')) {
          successMessage += ' Houzz ideabook updated.';
        }
        if (results.steps_completed.includes('teams_summary')) {
          successMessage += ' Teams notifications sent.';
        }
        
        setSuccess(successMessage);
      } else {
        const errorData = await response.json();
        setError(errorData.detail || 'Workflow failed');
      }
    } catch (err) {
      setError('Workflow error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCanva = async () => {
    try {
      if (selectedProducts.length === 0) {
        alert('Please select products first');
        return;
      }
      
      setLoading(true);
      const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';
      
      const response = await fetch(`${BACKEND_URL}/api/real-integrations/create-canva-project`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          project_name: `Design Project - ${new Date().toLocaleDateString()}`,
          products: selectedProducts
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        setSuccess(`Canva project created! ${data.products_added || 0} products added.`);
      } else {
        const errorData = await response.json();
        setError(errorData.detail || 'Failed to create Canva project');
      }
    } catch (err) {
      setError('Canva integration error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToHouzz = async () => {
    try {
      if (selectedProducts.length === 0) {
        alert('Please select products first');
        return;
      }
      
      setLoading(true);
      const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';
      
      const response = await fetch(`${BACKEND_URL}/api/real-integrations/add-to-houzz-ideabook`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ideabook_name: `Furniture Selection - ${new Date().toLocaleDateString()}`,
          products: selectedProducts
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        setSuccess(`Products added to Houzz ideabook! Processing ${data.products_count} items.`);
      } else {
        const errorData = await response.json();
        setError(errorData.detail || 'Failed to add to Houzz ideabook');
      }
    } catch (err) {
      setError('Houzz integration error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSendTeamsNotification = async () => {
    try {
      const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';
      
      const message = selectedProducts.length > 0 
        ? `Selected ${selectedProducts.length} products for review:\n${selectedProducts.slice(0, 3).map(p => `• ${p.title}`).join('\n')}`
        : `Search completed for "${searchQuery}" - ${products.length} products found`;
      
      const response = await fetch(`${BACKEND_URL}/api/real-integrations/send-teams-notification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: message,
          title: 'Interior Design Update'
        })
      });
      
      if (response.ok) {
        setSuccess('Teams notification sent successfully!');
      } else {
        const errorData = await response.json();
        setError(errorData.detail || 'Failed to send Teams notification');
      }
    } catch (err) {
      setError('Teams notification error: ' + err.message);
    }
  };

  const handleScrapeVendor = async (vendor) => {
    try {
      setLoading(true);
      setError(null);
      
      const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';
      
      const response = await fetch(`${BACKEND_URL}/api/real-integrations/scrape-vendor/${vendor}?search_query=${searchQuery || 'furniture'}&max_results=20`);
      
      if (response.ok) {
        const data = await response.json();
        setProducts(data.products || []);
        setSuccess(`Scraped ${data.products_found} products from ${data.vendor}`);
      } else {
        const errorData = await response.json();
        setError(errorData.detail || `Failed to scrape ${vendor}`);
      }
    } catch (err) {
      setError(`Vendor scraping error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleScrapeProducts = async () => {
    try {
      // Scrape all vendors
      await handleScrapeVendor('fourhands');
      
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

      {/* Integration Status */}
      {Object.keys(integrationStatus).length > 0 && (
        <div className="bg-gradient-to-br from-green-900/20 to-black/80 rounded-2xl border border-green-500/20 p-6 mb-8">
          <h3 className="text-xl font-light text-green-400 mb-4">🔗 Real Integration Status</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-black/40 border border-green-500/30 p-4 rounded-lg">
              <h4 className="text-green-400 font-medium mb-2">Canva</h4>
              <p className={`text-sm ${integrationStatus.canva?.configured ? 'text-green-300' : 'text-red-300'}`}>
                {integrationStatus.canva?.configured ? '✅ Connected' : '❌ Not Configured'}
              </p>
            </div>
            <div className="bg-black/40 border border-green-500/30 p-4 rounded-lg">
              <h4 className="text-green-400 font-medium mb-2">Houzz Pro</h4>
              <p className={`text-sm ${integrationStatus.houzz?.configured ? 'text-green-300' : 'text-red-300'}`}>
                {integrationStatus.houzz?.configured ? '✅ Connected' : '❌ Not Configured'}
              </p>
            </div>
            <div className="bg-black/40 border border-green-500/30 p-4 rounded-lg">
              <h4 className="text-green-400 font-medium mb-2">Teams</h4>
              <p className={`text-sm ${integrationStatus.teams?.configured ? 'text-green-300' : 'text-red-300'}`}>
                {integrationStatus.teams?.configured ? '✅ Connected' : '❌ Not Configured'}
              </p>
              {integrationStatus.teams?.test_result && (
                <p className="text-xs text-green-300 mt-1">Last test: Success</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Quick Workflow Section */}
      <div className="bg-gradient-to-br from-purple-900/20 to-black/80 rounded-2xl border border-purple-500/20 p-6 mb-8">
        <h3 className="text-xl font-light text-purple-400 mb-6">⚡ Quick Workflow</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <label className="flex items-center gap-3 bg-black/40 border border-purple-500/30 p-4 rounded-lg cursor-pointer">
            <input
              type="checkbox"
              checked={workflowSettings.create_canva}
              onChange={(e) => setWorkflowSettings({...workflowSettings, create_canva: e.target.checked})}
              className="text-purple-500 focus:ring-purple-500"
            />
            <span className="text-purple-300">🎨 Create Canva Project</span>
          </label>
          
          <label className="flex items-center gap-3 bg-black/40 border border-purple-500/30 p-4 rounded-lg cursor-pointer">
            <input
              type="checkbox"
              checked={workflowSettings.add_to_houzz}
              onChange={(e) => setWorkflowSettings({...workflowSettings, add_to_houzz: e.target.checked})}
              className="text-purple-500 focus:ring-purple-500"
            />
            <span className="text-purple-300">📋 Add to Houzz</span>
          </label>
          
          <label className="flex items-center gap-3 bg-black/40 border border-purple-500/30 p-4 rounded-lg cursor-pointer">
            <input
              type="checkbox"
              checked={workflowSettings.notify_teams}
              onChange={(e) => setWorkflowSettings({...workflowSettings, notify_teams: e.target.checked})}
              className="text-purple-500 focus:ring-purple-500"
            />
            <span className="text-purple-300">📢 Teams Notification</span>
          </label>
        </div>
        
        <button
          onClick={handleQuickWorkflow}
          disabled={loading}
          className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 disabled:from-gray-600 disabled:to-gray-700 px-8 py-4 rounded-lg transition-all duration-300 transform hover:scale-105 font-medium text-lg"
          style={{ color: '#F5F5DC' }}
        >
          {loading ? '⚡ Running Workflow...' : '⚡ Run Complete Workflow'}
        </button>
      </div>

      {/* Individual Vendor Scraping */}
      <div className="bg-gradient-to-br from-blue-900/20 to-black/80 rounded-2xl border border-blue-500/20 p-6 mb-8">
        <h3 className="text-xl font-light text-blue-400 mb-6">🏪 Individual Vendor Scraping</h3>
        
        <div className="flex flex-wrap gap-4">
          <button
            onClick={() => handleScrapeVendor('fourhands')}
            disabled={loading}
            className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-gray-600 disabled:to-gray-700 px-6 py-3 rounded-lg transition-all duration-300 transform hover:scale-105 font-medium"
            style={{ color: '#F5F5DC' }}
          >
            {loading ? '⏳ Scraping...' : '🪑 Four Hands'}
          </button>
          
          <button
            onClick={() => handleScrapeVendor('hudson-valley')}
            disabled={loading}
            className="bg-gradient-to-r from-yellow-600 to-yellow-700 hover:from-yellow-700 hover:to-yellow-800 disabled:from-gray-600 disabled:to-gray-700 px-6 py-3 rounded-lg transition-all duration-300 transform hover:scale-105 font-medium"
            style={{ color: '#F5F5DC' }}
          >
            {loading ? '⏳ Scraping...' : '💡 Hudson Valley'}
          </button>
          
          <button
            onClick={() => handleScrapeVendor('wayfair')}
            disabled={loading}
            className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 disabled:from-gray-600 disabled:to-gray-700 px-6 py-3 rounded-lg transition-all duration-300 transform hover:scale-105 font-medium"
            style={{ color: '#F5F5DC' }}
          >
            {loading ? '⏳ Scraping...' : '🏠 Wayfair'}
          </button>
        </div>
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

      {/* Success/Error Messages */}
      {success && (
        <div className="bg-green-900/20 border border-green-500/30 p-4 rounded-lg mb-6">
          <p className="text-green-300">✅ {success}</p>
        </div>
      )}
      
      {error && (
        <div className="bg-red-900/20 border border-red-500/30 p-4 rounded-lg mb-6">
          <p className="text-red-300">❌ {error}</p>
        </div>
      )}

      {/* Selected Products Actions */}
      {selectedProducts.length > 0 && (
        <div className="bg-gradient-to-br from-orange-900/20 to-black/80 rounded-2xl border border-orange-500/20 p-6 mb-8">
          <h3 className="text-xl font-light text-orange-400 mb-4">
            📝 Selected Products ({selectedProducts.length})
          </h3>
          
          <div className="flex flex-wrap gap-4">
            <button
              onClick={handleAddToCanva}
              disabled={loading}
              className="bg-gradient-to-r from-pink-600 to-pink-700 hover:from-pink-700 hover:to-pink-800 disabled:from-gray-600 disabled:to-gray-700 px-6 py-3 rounded-lg transition-all duration-300 transform hover:scale-105 font-medium"
              style={{ color: '#F5F5DC' }}
            >
              {loading ? '⏳ Adding...' : '🎨 Add to Canva'}
            </button>
            
            <button
              onClick={handleAddToHouzz}
              disabled={loading}
              className="bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 disabled:from-gray-600 disabled:to-gray-700 px-6 py-3 rounded-lg transition-all duration-300 transform hover:scale-105 font-medium"
              style={{ color: '#F5F5DC' }}
            >
              {loading ? '⏳ Adding...' : '📋 Add to Houzz'}
            </button>
            
            <button
              onClick={handleSendTeamsNotification}
              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 px-6 py-3 rounded-lg transition-all duration-300 transform hover:scale-105 font-medium"
              style={{ color: '#F5F5DC' }}
            >
              📢 Notify Teams
            </button>
            
            <button
              onClick={() => setSelectedProducts([])}
              className="bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 px-6 py-3 rounded-lg transition-all duration-300 transform hover:scale-105 font-medium"
              style={{ color: '#F5F5DC' }}
            >
              🗑️ Clear Selection
            </button>
          </div>
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
              <div key={product.id} className={`bg-black/60 border rounded-lg p-4 hover:border-[#B49B7E]/40 transition-all duration-300 ${
                selectedProducts.some(p => p.id === product.id) 
                  ? 'border-orange-500/60 bg-orange-900/10' 
                  : 'border-[#B49B7E]/20'
              }`}>
                {/* Selection Checkbox */}
                <div className="flex items-center justify-between mb-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedProducts.some(p => p.id === product.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedProducts([...selectedProducts, product]);
                        } else {
                          setSelectedProducts(selectedProducts.filter(p => p.id !== product.id));
                        }
                      }}
                      className="w-4 h-4 text-orange-500 bg-black/40 border-orange-500/30 rounded focus:ring-orange-500 focus:ring-2"
                    />
                    <span className="text-orange-400 text-sm font-medium">Select</span>
                  </label>
                  {selectedProducts.some(p => p.id === product.id) && (
                    <span className="text-orange-400 text-xs">✓ Selected</span>
                  )}
                </div>

                {/* Product Image */}
                {product.image_base64 ? (
                  <img
                    src={`data:image/jpeg;base64,${product.image_base64}`}
                    alt={product.title || product.name}
                    className="w-full h-48 object-cover rounded-lg mb-4"
                  />
                ) : product.image_url ? (
                  <img
                    src={product.image_url}
                    alt={product.title || product.name}
                    className="w-full h-48 object-cover rounded-lg mb-4"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'flex';
                    }}
                  />
                ) : null}
                
                {(!product.image_base64 && !product.image_url) && (
                  <div className="w-full h-48 bg-gray-700 rounded-lg mb-4 flex items-center justify-center">
                    <span className="text-4xl">🖼️</span>
                  </div>
                )}
                
                {product.image_url && !product.image_base64 && (
                  <div className="w-full h-48 bg-gray-700 rounded-lg mb-4 flex items-center justify-center" style={{display: 'none'}}>
                    <span className="text-4xl">🖼️</span>
                  </div>
                )}

                {/* Product Info */}
                <h4 className="text-[#B49B7E] font-medium mb-2 line-clamp-2">
                  {product.title || product.name || 'Unknown Product'}
                </h4>
                
                <p className="text-sm mb-2" style={{ color: '#F5F5DC', opacity: '0.7' }}>
                  {product.seller || product.vendor} • {product.id}
                </p>
                
                {product.price && (
                  <p className="text-lg font-medium text-green-400 mb-2">
                    {product.price}
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
                    onClick={() => {
                      if (selectedProducts.some(p => p.id === product.id)) {
                        setSelectedProducts(selectedProducts.filter(p => p.id !== product.id));
                      } else {
                        setSelectedProducts([...selectedProducts, product]);
                      }
                    }}
                    className={`flex-1 px-3 py-2 text-sm rounded transition-all duration-300 ${
                      selectedProducts.some(p => p.id === product.id)
                        ? 'bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800'
                        : 'bg-gradient-to-r from-[#B49B7E] to-[#A08B6F] hover:from-[#A08B6F] hover:to-[#8B7355]'
                    }`}
                    style={{ color: '#F5F5DC' }}
                  >
                    {selectedProducts.some(p => p.id === product.id) ? '✓ Selected' : '+ Select'}
                  </button>
                  <button
                    onClick={() => {
                      if (product.url) {
                        window.open(product.url, '_blank');
                      } else {
                        alert('Product URL not available');
                      }
                    }}
                    className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 px-3 py-2 text-sm rounded transition-all duration-300"
                    style={{ color: '#F5F5DC' }}
                  >
                    🔗 View
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
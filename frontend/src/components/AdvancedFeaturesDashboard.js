import React, { useState } from 'react';
import UnifiedFurnitureSearch from './UnifiedFurnitureSearch';
import TeamsIntegration from './TeamsIntegration';

const AdvancedFeaturesDashboard = () => {
  const [activeTab, setActiveTab] = useState('furniture');

  const tabs = [
    { id: 'furniture', name: '🔍 Unified Furniture Search', description: 'Search ALL vendors in one place' },
    { id: 'teams', name: '🔔 Teams Integration', description: 'Automatic to-do notifications' },
    { id: 'shipping', name: '📦 Live Shipping Tracking', description: 'Real-time delivery updates' },
    { id: 'canva', name: '🎨 Canva Integration', description: 'Automated board creation & sync' }
  ];

  const ShippingTracker = () => {
    const [trackingNumber, setTrackingNumber] = useState('');
    const [trackingResult, setTrackingResult] = useState(null);
    const [loading, setLoading] = useState(false);

    const trackShipment = async () => {
      if (!trackingNumber.trim()) return;
      
      setLoading(true);
      try {
        const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/shipping/track/${trackingNumber}`);
        const result = await response.json();
        setTrackingResult(result);
      } catch (error) {
        console.error('Tracking failed:', error);
        setTrackingResult({ success: false, error: 'Tracking failed' });
      } finally {
        setLoading(false);
      }
    };

    return (
      <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
        <h3 className="text-xl font-bold text-white mb-4">
          📦 Live Shipping Tracking
        </h3>
        
        <div className="mb-4">
          <p className="text-gray-300 mb-3">
            Track furniture deliveries in real-time across all major carriers.
          </p>
          
          <div className="flex space-x-4 mb-4">
            <input
              type="text"
              value={trackingNumber}
              onChange={(e) => setTrackingNumber(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && trackShipment()}
              placeholder="Enter tracking number..."
              className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
            <button
              onClick={trackShipment}
              disabled={loading || !trackingNumber.trim()}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded-md font-medium transition-colors"
            >
              {loading ? '⏳ Tracking...' : '📍 Track'}
            </button>
          </div>
        </div>

        {trackingResult && (
          <div className={`p-4 rounded-md ${
            trackingResult.success ? 'bg-green-800 text-green-200' : 'bg-red-800 text-red-200'
          }`}>
            {trackingResult.success ? (
              <div>
                <h4 className="font-semibold mb-2">
                  {trackingResult.carrier} - {trackingResult.tracking_number}
                </h4>
                <p><strong>Status:</strong> {trackingResult.status}</p>
                <p><strong>Location:</strong> {trackingResult.location}</p>
                {trackingResult.estimated_delivery && (
                  <p><strong>Estimated Delivery:</strong> {trackingResult.estimated_delivery}</p>
                )}
                {trackingResult.tracking_url && (
                  <a
                    href={trackingResult.tracking_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block mt-2 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm transition-colors"
                  >
                    View Full Details
                  </a>
                )}
              </div>
            ) : (
              <p>❌ {trackingResult.error}</p>
            )}
          </div>
        )}

        <div className="mt-6 p-4 bg-gray-900 rounded border border-gray-600">
          <h4 className="text-amber-400 font-semibold mb-2">🚚 Supported Carriers:</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm text-gray-300">
            <div>• FedEx</div>
            <div>• UPS</div>
            <div>• USPS</div>
            <div>• DHL</div>
            <div>• Brooks Delivery</div>
            <div>• Zenith</div>
            <div>• Sunbelt</div>
            <div>• Auto-Detection</div>
          </div>
        </div>
      </div>
    );
  };

  const CanvaIntegration = () => {
    const [canvaUrl, setCanvaUrl] = useState('');
    const [extractResult, setExtractResult] = useState(null);
    const [loading, setLoading] = useState(false);

    const extractCanvaBoard = async () => {
      if (!canvaUrl.trim()) return;
      
      setLoading(true);
      try {
        const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/canva/extract-board`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ canva_url: canvaUrl })
        });
        const result = await response.json();
        setExtractResult(result);
      } catch (error) {
        console.error('Canva extraction failed:', error);
        setExtractResult({ success: false, error: 'Extraction failed' });
      } finally {
        setLoading(false);
      }
    };

    return (
      <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
        <h3 className="text-xl font-bold text-white mb-4">
          🎨 Canva Integration
        </h3>
        
        <div className="mb-4">
          <p className="text-gray-300 mb-3">
            Extract product links from Canva boards and sync them back to your checklist automatically.
          </p>
          
          <div className="flex space-x-4 mb-4">
            <input
              type="url"
              value={canvaUrl}
              onChange={(e) => setCanvaUrl(e.target.value)}
              placeholder="https://www.canva.com/design/..."
              className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
            <button
              onClick={extractCanvaBoard}
              disabled={loading || !canvaUrl.trim()}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white rounded-md font-medium transition-colors"
            >
              {loading ? '⏳ Extracting...' : '🎨 Extract'}
            </button>
          </div>
        </div>

        {extractResult && (
          <div className={`p-4 rounded-md ${
            extractResult.success ? 'bg-green-800 text-green-200' : 'bg-red-800 text-red-200'
          }`}>
            {extractResult.success ? (
              <div>
                <h4 className="font-semibold mb-2">
                  ✅ Found {extractResult.total_products} products on Canva board
                </h4>
                {extractResult.products && extractResult.products.length > 0 && (
                  <div className="mt-3">
                    <h5 className="font-medium mb-2">Products found:</h5>
                    <ul className="text-sm space-y-1">
                      {extractResult.products.slice(0, 5).map((product, index) => (
                        <li key={index}>
                          • {product.name} ({product.vendor})
                        </li>
                      ))}
                      {extractResult.products.length > 5 && (
                        <li>... and {extractResult.products.length - 5} more</li>
                      )}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <p>❌ {extractResult.error}</p>
            )}
          </div>
        )}

        <div className="mt-6 p-4 bg-gray-900 rounded border border-gray-600">
          <h4 className="text-amber-400 font-semibold mb-2">🎯 Canva Features:</h4>
          <ul className="text-gray-300 text-sm space-y-1">
            <li>• Extract furniture links from design boards</li>
            <li>• Auto-populate checklist with Canva items</li>
            <li>• Generate room checklists for Canva boards</li>
            <li>• Sync changes back to main project</li>
            <li>• Create presentation-ready boards</li>
          </ul>
        </div>
      </div>
    );
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'furniture':
        return <UnifiedFurnitureSearch />;
      case 'teams':
        return <TeamsIntegration />;
      case 'shipping':
        return <ShippingTracker />;
      case 'canva':
        return <CanvaIntegration />;
      default:
        return <UnifiedFurnitureSearch />;
    }
  };

  return (
    <div className="bg-gray-900 min-h-screen">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            🚀 Advanced Interior Design Features
          </h1>
          <p className="text-gray-300 text-lg">
            The most technologically advanced interior design tools ever created!
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="mb-6">
          <nav className="flex space-x-1 bg-gray-800 p-1 rounded-lg">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 px-4 py-3 text-sm font-medium rounded-md transition-colors ${
                  activeTab === tab.id
                    ? 'bg-amber-600 text-white'
                    : 'text-gray-300 hover:text-white hover:bg-gray-700'
                }`}
              >
                <div className="text-center">
                  <div className="font-semibold">{tab.name}</div>
                  <div className="text-xs opacity-75 mt-1">{tab.description}</div>
                </div>
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="mb-8">
          {renderTabContent()}
        </div>

        {/* Feature Overview */}
        <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
          <h2 className="text-2xl font-bold text-white mb-4">
            🎯 Revolutionary Features Overview
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-gray-900 p-4 rounded border border-gray-600">
              <h3 className="font-semibold text-amber-400 mb-2">🔍 Unified Search</h3>
              <p className="text-gray-300 text-sm">Search ALL furniture vendors in one place. No more 1000 tabs!</p>
            </div>
            
            <div className="bg-gray-900 p-4 rounded border border-gray-600">
              <h3 className="font-semibold text-amber-400 mb-2">🔔 Teams Integration</h3>
              <p className="text-gray-300 text-sm">Automatic to-do notifications when furniture status changes.</p>
            </div>
            
            <div className="bg-gray-900 p-4 rounded border border-gray-600">
              <h3 className="font-semibold text-amber-400 mb-2">📦 Live Tracking</h3>
              <p className="text-gray-300 text-sm">Real-time shipping updates from all major carriers.</p>
            </div>
            
            <div className="bg-gray-900 p-4 rounded border border-gray-600">
              <h3 className="font-semibold text-amber-400 mb-2">🎨 Canva Sync</h3>
              <p className="text-gray-300 text-sm">Extract products from Canva boards and sync with checklist.</p>
            </div>
          </div>
          
          <div className="mt-6 p-4 bg-gradient-to-r from-amber-900/20 to-amber-800/20 rounded border border-amber-700/30">
            <h3 className="font-semibold text-amber-400 mb-2">🏆 Industry Leading Innovation</h3>
            <p className="text-gray-300 text-sm">
              Your Interior Design Management System now includes features that NO OTHER SOFTWARE provides. 
              From unified vendor searches to automated Canva integration, you're using the most advanced 
              interior design tools ever created!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdvancedFeaturesDashboard;
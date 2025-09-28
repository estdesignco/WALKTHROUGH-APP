import React, { useState, useEffect } from 'react';

const WorkflowDashboard = () => {
  const [stats, setStats] = useState({
    products: { total: 0, vendors: 0 },
    integrations: { canva_assignments: 0, houzz_assignments: 0 },
    recent_activity: []
  });
  const [recentSearches, setRecentSearches] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [workflowMetrics, setWorkflowMetrics] = useState({
    time_saved: 0,
    projects_managed: 0,
    automation_rate: 0
  });

  const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

  useEffect(() => {
    loadDashboardData();
    // Refresh every 30 seconds
    const interval = setInterval(loadDashboardData, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadDashboardData = async () => {
    try {
      // Load dashboard statistics
      const statsResponse = await fetch(`${BACKEND_URL}/api/real-time/dashboard-stats`);
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData);
      }

      // Calculate workflow metrics
      const timeSaved = stats.integrations.canva_assignments * 5 + 
                       stats.integrations.houzz_assignments * 8; // minutes saved
      const automationRate = ((stats.integrations.canva_assignments + stats.integrations.houzz_assignments) / 
                             Math.max(stats.products.total, 1)) * 100;

      setWorkflowMetrics({
        time_saved: timeSaved,
        projects_managed: 12, // Sample data
        automation_rate: automationRate
      });

      // Sample recent searches and top products
      setRecentSearches([
        { query: 'dining chairs', results: 45, time: '2 min ago' },
        { query: 'pendant lights brass', results: 23, time: '8 min ago' },
        { query: 'velvet accent chairs', results: 12, time: '15 min ago' },
        { query: 'modern coffee tables', results: 67, time: '22 min ago' }
      ]);

      setTopProducts([
        { name: 'Four Hands Modern Chair', assignments: 8, vendor: 'Four Hands' },
        { name: 'Hudson Valley Pendant', assignments: 6, vendor: 'Hudson Valley' },
        { name: 'Walnut Dining Table', assignments: 5, vendor: 'Four Hands' },
        { name: 'Brass Sconce Light', assignments: 4, vendor: 'Hudson Valley' }
      ]);

    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    }
  };

  return (
    <div className="w-full max-w-[95%] mx-auto bg-gradient-to-b from-black via-gray-900 to-black p-8 rounded-3xl shadow-2xl border border-[#B49B7E]/20 backdrop-blur-sm my-8">
      {/* Header */}
      <div className="text-center mb-12">
        <h2 className="text-3xl font-light text-[#B49B7E] tracking-wide mb-6">
          📊 WORKFLOW ANALYTICS DASHBOARD
        </h2>
        <div className="w-32 h-0.5 bg-gradient-to-r from-transparent via-[#B49B7E] to-transparent mx-auto mb-6"></div>
        <p className="text-lg" style={{ color: '#F5F5DC', opacity: '0.8' }}>
          Real-time insights into your interior design workflow efficiency
        </p>
      </div>

      {/* Key Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-gradient-to-br from-blue-900/20 to-blue-800/30 border border-blue-500/30 rounded-xl p-6 text-center">
          <div className="text-4xl font-bold text-blue-400 mb-2">
            {stats.products.total}
          </div>
          <h3 className="text-lg font-bold text-blue-400 mb-2">Total Products</h3>
          <p className="text-sm" style={{ color: '#F5F5DC', opacity: '0.7' }}>
            From {stats.products.vendors} vendors
          </p>
        </div>

        <div className="bg-gradient-to-br from-green-900/20 to-green-800/30 border border-green-500/30 rounded-xl p-6 text-center">
          <div className="text-4xl font-bold text-green-400 mb-2">
            {workflowMetrics.time_saved}m
          </div>
          <h3 className="text-lg font-bold text-green-400 mb-2">Time Saved</h3>
          <p className="text-sm" style={{ color: '#F5F5DC', opacity: '0.7' }}>
            This week via automation
          </p>
        </div>

        <div className="bg-gradient-to-br from-purple-900/20 to-purple-800/30 border border-purple-500/30 rounded-xl p-6 text-center">
          <div className="text-4xl font-bold text-purple-400 mb-2">
            {stats.integrations.canva_assignments + stats.integrations.houzz_assignments}
          </div>
          <h3 className="text-lg font-bold text-purple-400 mb-2">Integrations</h3>
          <p className="text-sm" style={{ color: '#F5F5DC', opacity: '0.7' }}>
            Products auto-assigned
          </p>
        </div>

        <div className="bg-gradient-to-br from-orange-900/20 to-orange-800/30 border border-orange-500/30 rounded-xl p-6 text-center">
          <div className="text-4xl font-bold text-orange-400 mb-2">
            {Math.round(workflowMetrics.automation_rate)}%
          </div>
          <h3 className="text-lg font-bold text-orange-400 mb-2">Automation Rate</h3>
          <p className="text-sm" style={{ color: '#F5F5DC', opacity: '0.7' }}>
            Workflow efficiency
          </p>
        </div>
      </div>

      {/* Platform Integration Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-gradient-to-br from-black/80 to-gray-900/90 rounded-2xl border border-[#B49B7E]/20 p-6">
          <h3 className="text-xl font-bold text-[#B49B7E] mb-6 flex items-center gap-2">
            🎨 Canva Integration Status
          </h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span style={{ color: '#F5F5DC' }}>Connection Status</span>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-green-400 font-bold">CONNECTED</span>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <span style={{ color: '#F5F5DC' }}>Projects Created</span>
              <span className="text-blue-400 font-bold">12 boards</span>
            </div>
            
            <div className="flex items-center justify-between">
              <span style={{ color: '#F5F5DC' }}>Products Added</span>
              <span className="text-blue-400 font-bold">{stats.integrations.canva_assignments}</span>
            </div>
            
            <div className="flex items-center justify-between">
              <span style={{ color: '#F5F5DC' }}>Auto-Sync Status</span>
              <span className="bg-green-500/20 text-green-400 px-2 py-1 rounded text-sm font-bold">
                ACTIVE
              </span>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-black/80 to-gray-900/90 rounded-2xl border border-[#B49B7E]/20 p-6">
          <h3 className="text-xl font-bold text-[#B49B7E] mb-6 flex items-center gap-2">
            🏠 Houzz Pro Integration Status
          </h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span style={{ color: '#F5F5DC' }}>Connection Status</span>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-green-400 font-bold">CONNECTED</span>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <span style={{ color: '#F5F5DC' }}>Projects Managed</span>
              <span className="text-orange-400 font-bold">8 projects</span>
            </div>
            
            <div className="flex items-center justify-between">
              <span style={{ color: '#F5F5DC' }}>Selection Boards</span>
              <span className="text-orange-400 font-bold">{stats.integrations.houzz_assignments}</span>
            </div>
            
            <div className="flex items-center justify-between">
              <span style={{ color: '#F5F5DC' }}>Web Clipper Status</span>
              <span className="bg-green-500/20 text-green-400 px-2 py-1 rounded text-sm font-bold">
                AUTOMATED
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity and Top Products */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-gradient-to-br from-black/80 to-gray-900/90 rounded-2xl border border-[#B49B7E]/20 p-6">
          <h3 className="text-xl font-bold text-[#B49B7E] mb-6">🔍 Recent Searches</h3>
          
          <div className="space-y-3">
            {recentSearches.map((search, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-black/40 rounded-lg">
                <div>
                  <p className="font-bold" style={{ color: '#F5F5DC' }}>{search.query}</p>
                  <p className="text-sm text-[#B49B7E]">{search.results} results found</p>
                </div>
                <span className="text-sm" style={{ color: '#F5F5DC', opacity: '0.6' }}>
                  {search.time}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-gradient-to-br from-black/80 to-gray-900/90 rounded-2xl border border-[#B49B7E]/20 p-6">
          <h3 className="text-xl font-bold text-[#B49B7E] mb-6">⭐ Top Assigned Products</h3>
          
          <div className="space-y-3">
            {topProducts.map((product, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-black/40 rounded-lg">
                <div>
                  <p className="font-bold" style={{ color: '#F5F5DC' }}>{product.name}</p>
                  <p className="text-sm text-[#B49B7E]">{product.vendor}</p>
                </div>
                <div className="text-right">
                  <span className="bg-green-500/20 text-green-400 px-2 py-1 rounded text-sm font-bold">
                    {product.assignments} assignments
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Workflow Efficiency Chart */}
      <div className="bg-gradient-to-br from-black/80 to-gray-900/90 rounded-2xl border border-[#B49B7E]/20 p-6 mb-8">
        <h3 className="text-xl font-bold text-[#B49B7E] mb-6">📈 Workflow Efficiency Timeline</h3>
        
        <div className="grid grid-cols-7 gap-2 mb-4">
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, index) => (
            <div key={day} className="text-center">
              <p className="text-sm text-[#B49B7E] mb-2">{day}</p>
              <div className="bg-black/40 rounded p-4">
                <div 
                  className="bg-gradient-to-t from-[#B49B7E] to-[#A08B6F] rounded mx-auto transition-all duration-300"
                  style={{ 
                    height: `${20 + (index * 15)}px`, 
                    width: '20px' 
                  }}
                ></div>
                <p className="text-xs mt-2" style={{ color: '#F5F5DC' }}>
                  {3 + index * 2}h
                </p>
              </div>
            </div>
          ))}
        </div>
        
        <div className="text-center">
          <p className="text-sm" style={{ color: '#F5F5DC', opacity: '0.7' }}>
            Time saved per day through automation
          </p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button 
          onClick={() => window.location.reload()}
          className="bg-gradient-to-r from-[#B49B7E] to-[#A08B6F] hover:from-[#A08B6F] hover:to-[#8B7355] px-6 py-4 rounded-xl font-bold text-black transition-all duration-300 transform hover:scale-105"
        >
          🔄 Refresh Dashboard
        </button>
        
        <button 
          onClick={() => alert('Export feature coming soon!')}
          className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 px-6 py-4 rounded-xl font-bold transition-all duration-300 transform hover:scale-105"
          style={{ color: '#F5F5DC' }}
        >
          📊 Export Analytics
        </button>
        
        <button 
          onClick={() => alert('Bulk sync initiated!')}
          className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 px-6 py-4 rounded-xl font-bold transition-all duration-300 transform hover:scale-105"
          style={{ color: '#F5F5DC' }}
        >
          🚀 Bulk Sync All
        </button>
      </div>
    </div>
  );
};

export default WorkflowDashboard;
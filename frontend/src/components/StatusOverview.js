import React from 'react';

const StatusOverview = ({ totalItems, statusBreakdown, itemStatuses }) => {
  const getStatusColor = (status) => {
    const colors = {
      'PICKED': '#FFD966',     // Yellow
      'ORDERED': '#3B82F6',    // Blue  
      'SHIPPED': '#F97316',    // Orange
      'DELIVERED': '#10B981',  // Green
      'INSTALLED': '#22C55E',  // Bright Green
      'PARTIALLY_DELIVERED': '#8B5CF6', // Purple
      'ON_HOLD': '#EF4444',    // Red
      'CANCELLED': '#6B7280'   // Gray
    };
    return colors[status] || '#6B7280';
  };

  const getStatusIcon = (status) => {
    const icons = {
      'PICKED': '🟡',
      'ORDERED': '🔵', 
      'SHIPPED': '🟠',
      'DELIVERED': '🟢',
      'INSTALLED': '✅',
      'PARTIALLY_DELIVERED': '🟣',
      'ON_HOLD': '🔴',
      'CANCELLED': '⚫'
    };
    return icons[status] || '⚪';
  };

  const calculatePercentage = (count) => {
    return totalItems > 0 ? Math.round((count / totalItems) * 100) : 0;
  };

  return (
    <div className="mb-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Status Overview Pie Chart Area */}
        <div className="bg-gray-800 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Status Overview</h3>
          
          {totalItems > 0 ? (
            <div className="flex items-center justify-center">
              {/* Simple Progress Ring */}
              <div className="relative w-32 h-32">
                <svg className="w-32 h-32 transform -rotate-90">
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke="#374151"
                    strokeWidth="12"
                    fill="transparent"
                  />
                  {/* Progress for completed items */}
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke="#10B981"
                    strokeWidth="12"
                    fill="transparent"
                    strokeDasharray={`${2 * Math.PI * 56}`}
                    strokeDashoffset={`${2 * Math.PI * 56 * (1 - (statusBreakdown['DELIVERED'] || 0) / totalItems)}`}
                    className="transition-all duration-500"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-white">
                      {calculatePercentage(statusBreakdown['DELIVERED'] || 0)}%
                    </div>
                    <div className="text-xs text-gray-400">Complete</div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center text-gray-500">
              <div className="text-4xl mb-2">📊</div>
              <p>No items to track yet</p>
            </div>
          )}
        </div>

        {/* Status Breakdown */}
        <div className="bg-gray-800 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Status Breakdown</h3>
          
          <div className="space-y-3">
            {itemStatuses.map(status => {
              const count = statusBreakdown[status] || 0;
              const percentage = calculatePercentage(count);
              
              return (
                <div key={status} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-lg">{getStatusIcon(status)}</span>
                    <span className="text-sm text-gray-300">
                      {status.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="bg-gray-700 rounded-full h-2 w-16">
                      <div
                        className="h-2 rounded-full transition-all duration-300"
                        style={{
                          backgroundColor: getStatusColor(status),
                          width: `${percentage}%`
                        }}
                      />
                    </div>
                    <span className="text-sm font-medium text-white w-8 text-right">
                      {count}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Shipping Carrier Breakdown */}
        <div className="bg-gray-800 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Shipping Carrier Breakdown</h3>
          
          <div className="text-center text-gray-500">
            <div className="text-4xl mb-2">📦</div>
            <p className="text-sm">No items with assigned carriers.</p>
          </div>
          
          {/* Placeholder for when we have shipping data */}
          <div className="hidden space-y-2">
            <div className="flex justify-between items-center p-2 bg-gray-700 rounded">
              <span className="text-gray-300">FedEx</span>
              <span className="text-white font-medium">12</span>
            </div>
            <div className="flex justify-between items-center p-2 bg-gray-700 rounded">
              <span className="text-gray-300">UPS</span>
              <span className="text-white font-medium">8</span>
            </div>
            <div className="flex justify-between items-center p-2 bg-gray-700 rounded">
              <span className="text-gray-300">USPS</span>
              <span className="text-white font-medium">3</span>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gray-800 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-white">{totalItems}</div>
          <div className="text-sm text-gray-400">Total Items</div>
        </div>
        <div className="bg-gray-800 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-green-400">
            {statusBreakdown['DELIVERED'] || 0}
          </div>
          <div className="text-sm text-gray-400">Delivered</div>
        </div>
        <div className="bg-gray-800 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-orange-400">
            {statusBreakdown['SHIPPED'] || 0}
          </div>
          <div className="text-sm text-gray-400">In Transit</div>
        </div>
        <div className="bg-gray-800 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-red-400">
            {statusBreakdown['ON_HOLD'] || 0}
          </div>
          <div className="text-sm text-gray-400">On Hold</div>
        </div>
      </div>
    </div>
  );
};

export default StatusOverview;
import React from 'react';

const StatusOverview = ({ totalItems, statusBreakdown, itemStatuses }) => {
  const getStatusColor = (status) => {
    // Complete status colors matching the spreadsheet - ALL 19 STATUS OPTIONS
    const colors = {
      'PICKED': '#FCD34D',           // Bright yellow
      'ORDERED': '#3B82F6',          // Blue
      'SHIPPED': '#F97316',          // Orange  
      'DELIVERED TO RECEIVER': '#10B981',     // Green
      'DELIVERED TO JOB SITE': '#059669',    // Dark green
      'INSTALLED': '#22C55E',        // Bright green
      'PARTIALLY DELIVERED': '#8B5CF6',  // Purple
      'ON HOLD': '#EF4444',          // Red
      'CANCELLED': '#6B7280',        // Gray
      'BACKORDERED': '#F59E0B',      // Amber
      'IN TRANSIT': '#06B6D4',       // Cyan
      'OUT FOR DELIVERY': '#84CC16', // Lime
      'RETURNED': '#EC4899',         // Pink
      'DAMAGED': '#DC2626',          // Dark red
      'MISSING': '#7C2D12',          // Brown
      'PENDING APPROVAL': '#D97706', // Dark orange
      'QUOTE REQUESTED': '#7C3AED',  // Violet
      'APPROVED': '#16A34A',         // Dark green
      'REJECTED': '#991B1B'          // Dark red
    };
    return colors[status] || '#6B7280';
  };

  const getStatusIcon = (status) => {
    const icons = {
      'PICKED': '🟡',
      'ORDERED': '🔵', 
      'SHIPPED': '🟠',
      'DELIVERED TO RECEIVER': '🟢',
      'DELIVERED TO JOB SITE': '🟢',
      'INSTALLED': '✅',
      'PARTIALLY DELIVERED': '🟣',
      'ON HOLD': '🔴',
      'CANCELLED': '⚫',
      'BACKORDERED': '🟠',
      'IN TRANSIT': '🔵',
      'OUT FOR DELIVERY': '🟢',
      'RETURNED': '🔴',
      'DAMAGED': '🔴',
      'MISSING': '🔴',
      'PENDING APPROVAL': '🟠',
      'QUOTE REQUESTED': '🟣',
      'APPROVED': '🟢',
      'REJECTED': '🔴'
    };
    return icons[status] || '⚪';
  };

  const calculatePercentage = (count) => {
    return totalItems > 0 ? Math.round((count / totalItems) * 100) : 0;
  };

  return (
    <div className="mb-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Status Overview Pie Chart Area - DOUBLE SIZE */}
        <div className="bg-gray-800 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Status Overview</h3>
          
          {totalItems > 0 ? (
            <div className="flex items-center justify-center">
              {/* Real Pie Chart with All Status Colors - DOUBLE SIZE */}
              <div className="relative w-64 h-64">
                <svg className="w-64 h-64 transform -rotate-90">
                  {(() => {
                    const centerX = 128;
                    const centerY = 128;
                    const radius = 100;
                    let currentAngle = 0;
                    
                    // Status colors matching your requirements
                    const statusColors = {
                      'PICKED': '#FCD34D',           // Bright yellow
                      'ORDERED': '#3B82F6',          // Blue
                      'SHIPPED': '#F97316',          // Orange  
                      'DELIVERED TO RECEIVER': '#10B981',     // Green
                      'DELIVERED TO JOB SITE': '#059669',    // Dark green
                      'INSTALLED': '#22C55E',        // Bright green
                      'PARTIALLY DELIVERED': '#8B5CF6',  // Purple
                      'ON HOLD': '#EF4444',          // Red
                      'CANCELLED': '#6B7280',        // Gray
                      'BACKORDERED': '#F59E0B',      // Amber
                      'IN TRANSIT': '#06B6D4',       // Cyan
                      'OUT FOR DELIVERY': '#84CC16', // Lime
                      'RETURNED': '#EC4899',         // Pink
                      'DAMAGED': '#DC2626',          // Dark red
                      'MISSING': '#7C2D12',          // Brown
                      'PENDING APPROVAL': '#D97706', // Dark orange
                      'QUOTE REQUESTED': '#7C3AED',  // Violet
                      'APPROVED': '#16A34A',         // Dark green
                      'REJECTED': '#991B1B'          // Dark red
                    };
                    
                    return Object.entries(statusBreakdown).map(([status, count]) => {
                      if (count === 0) return null;
                      
                      const percentage = count / totalItems;
                      const sliceAngle = percentage * 360;
                      
                      const startAngle = currentAngle;
                      const endAngle = currentAngle + sliceAngle;
                      
                      const startX = centerX + radius * Math.cos((startAngle * Math.PI) / 180);
                      const startY = centerY + radius * Math.sin((startAngle * Math.PI) / 180);
                      const endX = centerX + radius * Math.cos((endAngle * Math.PI) / 180);
                      const endY = centerY + radius * Math.sin((endAngle * Math.PI) / 180);
                      
                      const largeArcFlag = sliceAngle > 180 ? 1 : 0;
                      
                      const pathData = [
                        `M ${centerX} ${centerY}`,
                        `L ${startX} ${startY}`,
                        `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${endX} ${endY}`,
                        'Z'
                      ].join(' ');
                      
                      currentAngle += sliceAngle;
                      
                      return (
                        <path
                          key={status}
                          d={pathData}
                          fill={statusColors[status] || '#6B7280'}
                          stroke="#1F2937"
                          strokeWidth="2"
                        />
                      );
                    });
                  })()}
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-white">
                      {totalItems}
                    </div>
                    <div className="text-sm text-gray-400">Total Items</div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center text-gray-500">
              <div className="w-64 h-64 border-2 border-dashed border-gray-600 rounded-full flex items-center justify-center mx-auto">
                <div>
                  <div className="text-4xl mb-2">📦</div>
                  <div>No items yet</div>
                </div>
              </div>
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
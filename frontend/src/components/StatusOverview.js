import React from 'react';

const StatusOverview = ({ totalItems, statusBreakdown, itemStatuses, carrierBreakdown }) => {
  const getStatusColor = (status) => {
    // Complete status colors matching the spreadsheet - ALL 19 STATUS OPTIONS
    const colors = {
      'PICKED': '#FCD34D',           // Bright yellow
      'ORDERED': '#3B82F6',          // Blue
      'SHIPPED': '#F97316',          // Orange  
      'DELIVERED_TO_RECEIVER': '#10B981',     // Green
      'DELIVERED TO RECEIVER': '#10B981',     // Green (alt format)
      'DELIVERED_TO_JOB_SITE': '#059669',    // Dark green  
      'DELIVERED TO JOB SITE': '#059669',    // Dark green (alt format)
      'INSTALLED': '#22C55E',        // Bright green
      'PARTIALLY_DELIVERED': '#8B5CF6',  // Purple
      'PARTIALLY DELIVERED': '#8B5CF6',  // Purple (alt format)
      'ON_HOLD': '#EF4444',          // Red
      'ON HOLD': '#EF4444',          // Red (alt format)
      'CANCELLED': '#6B7280',        // Gray
      'BACKORDERED': '#F59E0B',      // Amber
      'IN_TRANSIT': '#06B6D4',       // Cyan
      'IN TRANSIT': '#06B6D4',       // Cyan (alt format)
      'OUT_FOR_DELIVERY': '#84CC16', // Lime
      'OUT FOR DELIVERY': '#84CC16', // Lime (alt format)
      'RETURNED': '#EC4899',         // Pink
      'DAMAGED': '#DC2626',          // Dark red
      'MISSING': '#7C2D12',          // Brown
      'PENDING_APPROVAL': '#D97706', // Dark orange
      'PENDING APPROVAL': '#D97706', // Dark orange (alt format)
      'QUOTE_REQUESTED': '#7C3AED',  // Violet
      'QUOTE REQUESTED': '#7C3AED',  // Violet (alt format)
      'APPROVED': '#16A34A',         // Dark green
      'REJECTED': '#991B1B'          // Dark red
    };
    return colors[status] || '#EF4444'; // Default to red if not found
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

        {/* STATUS BREAKDOWN - Show ALL statuses with colors */}
        <div className="mt-6">
          <h4 className="text-sm font-medium text-gray-300 mb-3">Status Breakdown</h4>
          <div className="space-y-2">
            {Object.entries(statusBreakdown)
              .filter(([status, count]) => count > 0)  // Only show statuses with items
              .map(([status, count]) => {
                const statusColors = {
                  // Planning Phase
                  'TO BE SELECTED': '#D4A574',
                  'RESEARCHING': '#B8860B', 
                  'PENDING APPROVAL': '#DAA520',
                  
                  // Procurement Phase  
                  'APPROVED': '#9ACD32',
                  'ORDERED': '#32CD32',
                  'PICKED': '#FFD700',
                  'CONFIRMED': '#228B22',
                  
                  // Fulfillment Phase
                  'IN PRODUCTION': '#FF8C00',
                  'SHIPPED': '#4169E1',
                  'IN TRANSIT': '#6495ED',
                  'OUT FOR DELIVERY': '#87CEEB',
                  
                  // Delivery Phase
                  'DELIVERED TO RECEIVER': '#9370DB',
                  'DELIVERED TO JOB SITE': '#8A2BE2',
                  'RECEIVED': '#DDA0DD',
                  
                  // Installation Phase
                  'READY FOR INSTALL': '#20B2AA',
                  'INSTALLING': '#48D1CC',
                  'INSTALLED': '#00CED1',
                  
                  // Issues & Exceptions
                  'ON HOLD': '#DC143C',
                  'BACKORDERED': '#B22222',
                  'DAMAGED': '#8B0000',
                  'RETURNED': '#CD5C5C',
                  'CANCELLED': '#A52A2A'
                };
                
                return (
                  <div key={status} className="flex items-center justify-between p-2 rounded text-xs" 
                       style={{ backgroundColor: statusColors[status] || '#6B7280', color: '#000' }}>
                    <span className="font-medium">{status}</span>
                    <span className="font-bold">{count}</span>
                  </div>
                );
              })}
          </div>
        </div>

        {/* SHIPPING CARRIER BREAKDOWN - Show ALL carriers with colors */}
        <div className="mt-6">
          <h4 className="text-sm font-medium text-gray-300 mb-3">Shipping Carrier Breakdown</h4>
          <div className="space-y-2">
            {Object.entries(carrierBreakdown)
              .filter(([carrier, count]) => count > 0)  // Only show carriers with items
              .map(([carrier, count]) => {
                const carrierColors = {
                  'FedEx': '#FF6600',
                  'UPS': '#8B4513',
                  'Brooks': '#4682B4',
                  'Zenith': '#20B2AA',
                  'Sunbelt': '#DC143C',
                  'R+L Carriers': '#8A2BE2',
                  'Yellow Freight': '#FFD700',
                  'XPO Logistics': '#FF1493',
                  'Old Dominion': '#228B22',
                  'ABF Freight': '#B22222',
                  'Estes Express': '#4B0082',
                  'Saia LTL': '#2E8B57',
                  'TForce Freight': '#FF4500',
                  'Roadrunner': '#6B8E23',
                  'Central Transport': '#8B008B',
                  'Southeastern Freight': '#D2691E',
                  'Averitt Express': '#CD853F',
                  'Holland': '#F4A460',
                  'USPS': '#0047AB',
                  'DHL': '#FFCC00',
                  'OTHER': '#9370DB'
                };
                
                return (
                  <div key={carrier} className="flex items-center justify-between p-2 rounded text-xs" 
                       style={{ backgroundColor: carrierColors[carrier] || '#6B7280', color: '#000' }}>
                    <span className="font-medium">{carrier}</span>
                    <span className="font-bold">{count}</span>
                  </div>
                );
              })}
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
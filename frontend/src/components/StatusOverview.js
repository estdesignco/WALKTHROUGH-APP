import React from 'react';

const StatusOverview = ({ totalItems, statusBreakdown, carrierBreakdown, itemStatuses }) => {
  // Status colors for pie chart and breakdown
  const getStatusColor = (status) => {
    const statusColors = {
      'TO BE SELECTED': '#D4A574', 'RESEARCHING': '#B8860B', 'PENDING APPROVAL': '#DAA520',
      'APPROVED': '#9ACD32', 'ORDERED': '#32CD32', 'PICKED': '#FFD700', 'CONFIRMED': '#228B22',
      'IN PRODUCTION': '#FF8C00', 'SHIPPED': '#4169E1', 'IN TRANSIT': '#6495ED', 'OUT FOR DELIVERY': '#87CEEB',
      'DELIVERED TO RECEIVER': '#9370DB', 'DELIVERED TO JOB SITE': '#8A2BE2', 'RECEIVED': '#DDA0DD',
      'READY FOR INSTALL': '#20B2AA', 'INSTALLING': '#48D1CC', 'INSTALLED': '#00CED1',
      'ON HOLD': '#DC143C', 'BACKORDERED': '#B22222', 'DAMAGED': '#8B0000', 'RETURNED': '#CD5C5C', 'CANCELLED': '#A52A2A'
    };
    return statusColors[status] || '#6B7280';
  };

  const getCarrierColor = (carrier) => {
    const carrierColors = {
      'FedEx': '#FF6600', 'UPS': '#8B4513', 'Brooks': '#4682B4', 'Zenith': '#20B2AA',
      'Sunbelt': '#DC143C', 'R+L Carriers': '#8A2BE2', 'Yellow Freight': '#FFD700',
      'XPO Logistics': '#FF1493', 'Old Dominion': '#228B22', 'ABF Freight': '#B22222',
      'Estes Express': '#4B0082', 'Saia LTL': '#2E8B57', 'TForce Freight': '#FF4500',
      'Roadrunner': '#6B8E23', 'Central Transport': '#8B008B', 'Southeastern Freight': '#D2691E',
      'Averitt Express': '#CD853F', 'Holland': '#F4A460', 'USPS': '#0047AB',
      'DHL': '#FFCC00', 'OTHER': '#9370DB'
    };
    return carrierColors[carrier] || '#6B7280';
  };

  const getCompletedItems = () => {
    return (statusBreakdown['INSTALLED'] || 0) + 
           (statusBreakdown['DELIVERED TO JOB SITE'] || 0) + 
           (statusBreakdown['DELIVERED TO RECEIVER'] || 0);
  };

  const getInTransitItems = () => {
    return (statusBreakdown['SHIPPED'] || 0) + 
           (statusBreakdown['IN TRANSIT'] || 0) + 
           (statusBreakdown['OUT FOR DELIVERY'] || 0);
  };

  const getPendingItems = () => {
    return (statusBreakdown['TO BE SELECTED'] || 0) + 
           (statusBreakdown['RESEARCHING'] || 0) + 
           (statusBreakdown['PENDING APPROVAL'] || 0) + 
           (statusBreakdown['APPROVED'] || 0) + 
           (statusBreakdown['ORDERED'] || 0) + 
           (statusBreakdown['PICKED'] || 0);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      
      {/* LEFT COLUMN - PIE CHART */}
      <div className="bg-gray-800 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Status Overview</h3>
        
        {/* PIE CHART PLACEHOLDER - Restore this! */}
        <div className="flex items-center justify-center h-48 mb-4">
          <div className="relative w-32 h-32">
            <div className="absolute inset-0 rounded-full border-8 border-gray-600"></div>
            <div className="absolute inset-0 rounded-full border-8 border-green-500 border-r-transparent border-b-transparent" 
                 style={{ transform: 'rotate(45deg)' }}></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="text-2xl font-bold text-white">{totalItems}</div>
                <div className="text-sm text-gray-400">Total Items</div>
              </div>
            </div>
          </div>
        </div>

        {/* SUMMARY COUNTS */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Completed</span>
            <span className="text-green-400 font-medium">{getCompletedItems()}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">In Transit</span>
            <span className="text-orange-400 font-medium">{getInTransitItems()}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Pending</span>
            <span className="text-yellow-400 font-medium">{getPendingItems()}</span>
          </div>
        </div>
      </div>

      {/* MIDDLE COLUMN - STATUS BREAKDOWN */}
      <div className="bg-gray-800 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Status Breakdown</h3>
        
        <div className="space-y-3">
          {[
            'TO BE SELECTED', 'RESEARCHING', 'PENDING APPROVAL',
            'APPROVED', 'ORDERED', 'PICKED', 'CONFIRMED',
            'IN PRODUCTION', 'SHIPPED', 'IN TRANSIT', 'OUT FOR DELIVERY',
            'DELIVERED TO RECEIVER', 'DELIVERED TO JOB SITE', 'RECEIVED',
            'READY FOR INSTALL', 'INSTALLING', 'INSTALLED',
            'ON HOLD', 'BACKORDERED', 'DAMAGED', 'RETURNED', 'CANCELLED'
          ].map(status => {
            const count = statusBreakdown[status] || 0;
            const percentage = totalItems > 0 ? (count / totalItems) * 100 : 0;
            
            return (
              <div key={status} className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: getStatusColor(status) }}
                  ></div>
                  <span className="text-sm text-gray-300">{status}</span>
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

      {/* RIGHT COLUMN - CARRIER BREAKDOWN */}
      <div className="bg-gray-800 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Shipping Carrier Breakdown</h3>
        
        <div className="space-y-3">
          {[
            'FedEx', 'UPS', 'USPS', 'DHL', 'Brooks', 'Zenith', 'Sunbelt',
            'R+L Carriers', 'Yellow Freight', 'XPO Logistics', 'Old Dominion',
            'ABF Freight', 'Estes Express', 'Saia LTL', 'TForce Freight',
            'Roadrunner', 'Central Transport', 'Southeastern Freight',
            'Averitt Express', 'Holland', 'OTHER'
          ].map(carrier => {
            const count = carrierBreakdown[carrier] || 0;
            const percentage = totalItems > 0 ? (count / totalItems) * 100 : 0;
            
            return (
              <div key={carrier} className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: getCarrierColor(carrier) }}
                  ></div>
                  <span className="text-sm text-gray-300">{carrier}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="bg-gray-700 rounded-full h-2 w-16">
                    <div
                      className="h-2 rounded-full transition-all duration-300"
                      style={{
                        backgroundColor: getCarrierColor(carrier),
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
      
    </div>
  );
};

export default StatusOverview;
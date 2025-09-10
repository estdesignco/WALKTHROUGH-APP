import React from 'react';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend
} from 'chart.js';
import { Pie } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend);

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

  // Prepare data for Status Overview pie chart
  const statusPieData = {
    labels: Object.keys(statusBreakdown).filter(status => statusBreakdown[status] > 0),
    datasets: [
      {
        data: Object.keys(statusBreakdown)
          .filter(status => statusBreakdown[status] > 0)
          .map(status => statusBreakdown[status]),
        backgroundColor: Object.keys(statusBreakdown)
          .filter(status => statusBreakdown[status] > 0)
          .map(status => getStatusColor(status)),
        borderWidth: 0,
        hoverBorderWidth: 2,
        hoverBorderColor: '#ffffff'
      }
    ]
  };

  // Prepare data for Carrier pie chart
  const carrierPieData = {
    labels: Object.keys(carrierBreakdown).filter(carrier => carrierBreakdown[carrier] > 0),
    datasets: [
      {
        data: Object.keys(carrierBreakdown)
          .filter(carrier => carrierBreakdown[carrier] > 0)
          .map(carrier => carrierBreakdown[carrier]),
        backgroundColor: Object.keys(carrierBreakdown)
          .filter(carrier => carrierBreakdown[carrier] > 0)
          .map(carrier => getCarrierColor(carrier)),
        borderWidth: 0,
        hoverBorderWidth: 2,
        hoverBorderColor: '#ffffff'
      }
    ]
  };

  // Chart options for real pie charts with labels and lines
  const pieOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
        labels: {
          color: '#ffffff',
          font: {
            size: 12
          },
          usePointStyle: true,
          pointStyle: 'circle',
          padding: 15,
          generateLabels: function(chart) {
            const data = chart.data;
            if (data.labels.length && data.datasets.length) {
              return data.labels.map((label, i) => {
                const dataset = data.datasets[0];
                const value = dataset.data[i];
                const total = dataset.data.reduce((sum, val) => sum + val, 0);
                const percentage = ((value / total) * 100).toFixed(1);
                
                return {
                  text: `${label} (${value}) ${percentage}%`,
                  fillStyle: dataset.backgroundColor[i],
                  strokeStyle: dataset.backgroundColor[i],
                  pointStyle: 'circle',
                  hidden: false,
                  index: i
                };
              });
            }
            return [];
          }
        }
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const label = context.label || '';
            const value = context.parsed;
            const total = context.dataset.data.reduce((sum, val) => sum + val, 0);
            const percentage = ((value / total) * 100).toFixed(1);
            return `${label}: ${value} items (${percentage}%)`;
          }
        }
      }
    },
    elements: {
      arc: {
        borderWidth: 0
      }
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      
      {/* LEFT COLUMN - STATUS PIE CHART */}
      <div className="bg-gray-800 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Status Overview</h3>
        
        {/* REAL PIE CHART WITH LABELS AND LINES */}
        <div className="h-64 mb-4">
          {totalItems > 0 ? (
            <Pie data={statusPieData} options={pieOptions} />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-400">
              No items to display
            </div>
          )}
        </div>
      </div>

      {/* MIDDLE COLUMN - STATUS BREAKDOWN LIST */}
      <div className="bg-gray-800 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Status Breakdown</h3>
        
        <div className="space-y-3 max-h-80 overflow-y-auto">
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

      {/* RIGHT COLUMN - SHIPPING SECTION */}
      <div className="bg-gray-800 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Shipping Information</h3>
        
        {/* 1. CARRIER PIE CHART */}
        <div className="mb-6">
          <h4 className="text-md font-medium text-gray-300 mb-3">Carrier Distribution</h4>
          <div className="h-48">
            {Object.values(carrierBreakdown).reduce((a, b) => a + b, 0) > 0 ? (
              <Pie data={carrierPieData} options={pieOptions} />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400">
                No carrier data
              </div>
            )}
          </div>
        </div>

        {/* 2. SHIPPING CARRIER BREAKDOWN */}
        <div className="mb-6">
          <h4 className="text-md font-medium text-gray-300 mb-3">Carrier Breakdown</h4>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {[
              'FedEx', 'UPS', 'USPS', 'DHL', 'Brooks', 'Zenith', 'Sunbelt',
              'R+L Carriers', 'Yellow Freight', 'XPO Logistics', 'Old Dominion',
              'ABF Freight', 'Estes Express', 'Saia LTL', 'TForce Freight',
              'Roadrunner', 'Central Transport', 'Southeastern Freight',
              'Averitt Express', 'Holland', 'OTHER'
            ].filter(carrier => carrierBreakdown[carrier] > 0).map(carrier => {
              const count = carrierBreakdown[carrier] || 0;
              
              return (
                <div key={carrier} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: getCarrierColor(carrier) }}
                    ></div>
                    <span className="text-sm text-gray-300">{carrier}</span>
                  </div>
                  <span className="text-sm font-medium text-white">
                    {count}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* 3. TOTAL COUNTS (SHIPPED, IN TRANSIT, ETC.) - PUT BACK! */}
        <div>
          <h4 className="text-md font-medium text-gray-300 mb-3">Shipping Status Totals</h4>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Total Items</span>
              <span className="text-white font-medium">{totalItems}</span>
            </div>
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
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">On Hold</span>
              <span className="text-red-400 font-medium">{statusBreakdown['ON HOLD'] || 0}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Backordered</span>
              <span className="text-red-400 font-medium">{statusBreakdown['BACKORDERED'] || 0}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Damaged</span>
              <span className="text-red-400 font-medium">{statusBreakdown['DAMAGED'] || 0}</span>
            </div>
          </div>
        </div>
      </div>
      
    </div>
  );
};

export default StatusOverview;
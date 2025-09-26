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
  // Status colors for pie chart and breakdown - MATCH ExactFFESpreadsheet colors
  const getStatusColor = (status) => {
    const colors = {
      '': '#6B7280',                        // Gray for blank/default
      'TO BE SELECTED': '#6B7280',          // Gray
      'RESEARCHING': '#3B82F6',             // Blue
      'PENDING APPROVAL': '#F59E0B',        // Amber
      'APPROVED': '#10B981',                // Emerald
      'ORDERED': '#10B981',                 // Emerald
      'PICKED': '#FFD700',                  // Gold
      'CONFIRMED': '#10B981',               // Emerald
      'IN PRODUCTION': '#F97316',           // Orange
      'SHIPPED': '#3B82F6',                 // Blue
      'IN TRANSIT': '#3B82F6',              // Blue  
      'OUT FOR DELIVERY': '#3B82F6',        // Blue
      'DELIVERED TO RECEIVER': '#8B5CF6',   // Violet
      'DELIVERED TO JOB SITE': '#8B5CF6',   // Violet
      'RECEIVED': '#8B5CF6',                // Violet
      'READY FOR INSTALL': '#10B981',       // Emerald
      'INSTALLING': '#10B981',              // Emerald
      'INSTALLED': '#10B981',               // Emerald
      'ON HOLD': '#EF4444',                 // Red
      'BACKORDERED': '#EF4444',             // Red
      'DAMAGED': '#EF4444',                 // Red
      'RETURNED': '#EF4444',                // Red
      'CANCELLED': '#EF4444'                // Red
    };
    return colors[status] || '#6B7280';
  };

  const getCarrierColor = (carrier) => {
    const colors = {
      'FedEx': '#FF6600',           // FedEx Orange
      'FedEx Ground': '#FF6600',    // FedEx Orange
      'FedEx Express': '#FF6600',   // FedEx Orange
      'UPS': '#8B4513',            // UPS Brown
      'UPS Ground': '#8B4513',     // UPS Brown
      'UPS Express': '#8B4513',    // UPS Brown
      'USPS': '#004B87',           // USPS Blue
      'DHL': '#FFD700',            // DHL Yellow
      'Brooks': '#4682B4',         // Steel Blue
      'Zenith': '#20B2AA',         // Light Sea Green
      'Sunbelt': '#FF4500',        // Orange Red
      'R+L Carriers': '#32CD32',   // Lime Green
      'Yellow Freight': '#FFD700', // Yellow
      'XPO Logistics': '#6A5ACD',  // Slate Blue
      'Old Dominion': '#DC143C',   // Crimson
      'ABF Freight': '#FF6347',    // Tomato
      'Con-Way': '#48D1CC',        // Medium Turquoise
      'Estes Express': '#9370DB',  // Medium Purple
      'YRC Freight': '#FF1493',    // Deep Pink
      'Saia': '#00CED1',           // Dark Turquoise
      'OTHER': '#808080'           // Gray
    };
    return colors[carrier] || '#6B7280';
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
          color: '#F5F5DC',
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
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6 border-t border-[#D4A574]/60 pt-4">
      
      {/* LEFT COLUMN - STATUS PIE CHART with DIMMED BORDER */}
      <div className="rounded-2xl shadow-xl backdrop-blur-sm p-6 border border-[#D4A574]/60" style={{
        background: 'linear-gradient(135deg, rgba(0,0,0,0.95) 0%, rgba(30,30,30,0.9) 30%, rgba(0,0,0,0.95) 100%)'
      }}>
        <h3 className="text-lg font-semibold mb-4 border-b border-[#D4A574]/60 pb-2" style={{ color: '#D4A574' }}>Status Overview</h3>
        
        {/* REAL PIE CHART WITH LABELS AND LINES */}
        <div className="h-64 mb-4">
          {totalItems > 0 ? (
            <Pie data={statusPieData} options={pieOptions} />
          ) : (
            <div className="flex items-center justify-center h-full text-[#B49B7E]/60">
              No items to display
            </div>
          )}
        </div>
      </div>

      {/* MIDDLE COLUMN - STATUS BREAKDOWN LIST with DIMMED BORDER */}
      <div className="rounded-2xl shadow-xl backdrop-blur-sm p-6 border border-[#D4A574]/60" style={{
        background: 'linear-gradient(135deg, rgba(0,0,0,0.95) 0%, rgba(30,30,30,0.9) 30%, rgba(0,0,0,0.95) 100%)'
      }}>
        <h3 className="text-lg font-semibold mb-4 border-b border-[#D4A574]/60 pb-2" style={{ color: '#D4A574' }}>Status Breakdown</h3>
        
        <div className="space-y-3 max-h-80 overflow-y-auto">
          {[
            'TO BE SELECTED', 'RESEARCHING', 'PENDING APPROVAL', 'APPROVED', 'ORDERED', 'PICKED', 'CONFIRMED',
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
                  <span className="text-sm text-[#F5F5DC]">{status}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="bg-black/40 rounded-full h-2 w-16">
                    <div
                      className="h-2 rounded-full transition-all duration-300"
                      style={{
                        backgroundColor: getStatusColor(status),
                        width: `${percentage}%`
                      }}
                    />
                  </div>
                  <span className="text-sm font-medium w-8 text-right" style={{ color: '#F5F5DC' }}>
                    {count}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* RIGHT COLUMN - SHIPPING SECTION with DIMMED BORDER */}
      <div className="rounded-2xl shadow-xl backdrop-blur-sm p-6 border border-[#D4A574]/60" style={{
        background: 'linear-gradient(135deg, rgba(0,0,0,0.95) 0%, rgba(30,30,30,0.9) 30%, rgba(0,0,0,0.95) 100%)'
      }}>
        <h3 className="text-lg font-semibold mb-4 border-b border-[#D4A574]/60 pb-2" style={{ color: '#D4A574' }}>Shipping Information</h3>
        
        {/* 1. CARRIER PIE CHART */}
        <div className="mb-6">
          <h4 className="text-md font-medium mb-3 border-b border-[#D4A574]/60 pb-1" style={{ 
            color: '#D4A574', 
            opacity: '0.9'
          }}>Carrier Distribution</h4>
          <div className="h-48">
            {Object.values(carrierBreakdown).reduce((a, b) => a + b, 0) > 0 ? (
              <Pie data={carrierPieData} options={pieOptions} />
            ) : (
              <div className="flex items-center justify-center h-full text-[#B49B7E]/60">
                No carrier data
              </div>
            )}
          </div>
        </div>

        {/* 2. SHIPPING BREAKDOWN - EXACTLY LIKE STATUS BREAKDOWN! */}
        <div className="mb-6">
          <h4 className="text-md font-medium mb-3 border-b border-[#D4A574]/60 pb-1" style={{ 
            color: '#D4A574', 
            opacity: '0.9'
          }}>Shipping Breakdown</h4>
          <div className="space-y-3 max-h-60 overflow-y-auto">{/*INCREASED HEIGHT*/}
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
                    <span className="text-sm text-[#F5F5DC]">{carrier}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="bg-black/40 rounded-full h-2 w-16">
                      <div
                        className="h-2 rounded-full transition-all duration-300"
                        style={{
                          backgroundColor: getCarrierColor(carrier),
                          width: `${percentage}%`
                        }}
                      />
                    </div>
                    <span className="text-sm font-medium w-8 text-right" style={{ color: '#F5F5DC' }}>
                      {count}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 3. SHIPPING STATUS GRID - REAL CALCULATIONS */}
        <div>
          <div className="grid grid-cols-2 gap-3">
            {/* Total Items */}
            <div className="bg-gray-700 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-white">{totalItems}</div>
              <div className="text-sm text-gray-400">Total Items</div>
            </div>
            
            {/* Delivered */}
            <div className="bg-gray-700 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-green-400">{getCompletedItems()}</div>
              <div className="text-sm text-gray-400">Delivered</div>
            </div>
            
            {/* In Transit */}
            <div className="bg-gray-700 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-orange-400">{getInTransitItems()}</div>
              <div className="text-sm text-gray-400">In Transit</div>
            </div>
            
            {/* On Hold */}
            <div className="bg-gray-700 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-red-400">{statusBreakdown['ON HOLD'] || 0}</div>
              <div className="text-sm text-gray-400">On Hold</div>
            </div>
          </div>
        </div>
      </div>
      
    </div>
  );
};

export default StatusOverview;
import React from 'react';
import { Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend
} from 'chart.js';
import { getStatusColor } from '../utils/statusColors';

ChartJS.register(ArcElement, Tooltip, Legend);

const ChecklistStatusOverview = ({ totalItems, statusBreakdown, carrierBreakdown, itemStatuses, carrierTypes }) => {
  
  const PICKED_AND_BEYOND = ['PICKED', 'ORDER SAMPLES', 'SAMPLES ARRIVED', 'SAMPLES ORDERED', 'GET QUOTE', 'WAITING ON QT', 'READY FOR PRESENTATION', 'APPROVED', 'ORDERED', 'RECEIVED', 'INSTALLED', 'ON HOLD'];
  
  const getTotalPicked = () => {
    let total = 0;
    PICKED_AND_BEYOND.forEach(status => {
      total += statusBreakdown[status] || 0;
    });
    return total;
  };
  
  const getChecklistStatusBreakdown = () => {
    const result = {};
    Object.keys(statusBreakdown).forEach(status => {
      const displayStatus = status === '' ? 'TO BE PICKED' : status;
      const color = getStatusColor(status);
      if (result[displayStatus]) {
        result[displayStatus].count += statusBreakdown[status];
      } else {
        result[displayStatus] = { count: statusBreakdown[status], color: color };
      }
    });
    return result;
  };

  const checklistBreakdown = getChecklistStatusBreakdown();
  const totalPicked = getTotalPicked();

  // Carrier colors
  const getCarrierColor = (carrier) => {
    const colors = {
      'FedEx': '#4B0082',              // Purple
      'UPS': '#8B4513',               // UPS Brown
      'UPS Ground': '#8B4513',        // UPS Brown
      'USPS': '#1E40AF',              // Blue
      'DHL': '#DC2626',               // Red
      'Brooks': '#059669',            // Green
      'Zenith': '#F59E0B',            // Amber
      'Surber': '#8B5CF6'             // Violet
    };
    return colors[carrier] || '#6B7280';
  };

  // Chart options
  const pieOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
        labels: {
          color: '#D4A574',
          font: {
            size: 12
          },
          usePointStyle: true,
          pointStyle: 'circle',
          padding: 15
        }
      },
      tooltip: {
        backgroundColor: '#1F2937',
        titleColor: '#F9FAFB',
        bodyColor: '#F9FAFB',
        borderColor: '#374151',
        borderWidth: 1,
        callbacks: {
          label: function(context) {
            const percentage = ((context.raw / totalItems) * 100).toFixed(1);
            return `${context.label}: ${context.raw} (${percentage}%)`;
          }
        }
      }
    }
  };

  // Calculate totals for percentage calculations
  const totalItemsFromStatus = Object.values(checklistBreakdown).reduce((sum, status) => sum + status.count, 0);

  // Prepare data for Status Overview pie chart with shimmer
  const statusPieData = {
    labels: Object.keys(checklistBreakdown).filter(status => checklistBreakdown[status].count > 0),
    datasets: [
      {
        data: Object.keys(checklistBreakdown)
          .filter(status => checklistBreakdown[status].count > 0)
          .map(status => checklistBreakdown[status].count),
        backgroundColor: Object.keys(checklistBreakdown)
          .filter(status => checklistBreakdown[status].count > 0)
          .map(status => checklistBreakdown[status].color),
        borderWidth: 3,
        borderColor: Object.keys(checklistBreakdown)
          .filter(status => checklistBreakdown[status].count > 0)
          .map(status => '#D4A574'),
        hoverBorderWidth: 4,
        hoverBorderColor: '#FFD700',
        shadowOffsetX: 0,
        shadowOffsetY: 0,
        shadowBlur: 15,
        shadowColor: Object.keys(checklistBreakdown)
          .filter(status => checklistBreakdown[status].count > 0)
          .map(status => checklistBreakdown[status].color + '80')
      }
    ]
  };

  // Prepare data for Carrier Distribution pie chart
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

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
      {/* LEFT COLUMN - STATUS OVERVIEW */}
      <div className="rounded-2xl shadow-xl backdrop-blur-sm p-6 border border-[#D4A574]/60" style={{
        background: 'linear-gradient(135deg, rgba(0,0,0,0.95) 0%, rgba(30,30,30,0.9) 30%, rgba(0,0,0,0.95) 100%)'
      }}>
        <h3 className="text-lg font-semibold text-[#D4C5A9] mb-4">Status Overview</h3>
        
        {/* STATUS PIE CHART */}
        <div className="mb-6">
          <div className="h-48">
            {totalItems > 0 ? (
              <Pie data={statusPieData} options={pieOptions} />
            ) : (
              <div className="flex items-center justify-center h-full text-[#D4A574]">
                No items to display
              </div>
            )}
          </div>
        </div>

        {/* STATUS SUMMARY */}
        <div className="text-center">
          <div className="text-2xl font-bold text-[#D4C5A9]">
            {totalItems} Total Items
          </div>
          <div className="text-sm text-[#D4A574] mt-1">
            ({totalPicked} PICKED - {totalItems > 0 ? Math.round((totalPicked / totalItems) * 100) : 0}%)
          </div>
        </div>
      </div>

      {/* MIDDLE COLUMN - STATUS BREAKDOWN */}
      <div className="rounded-2xl shadow-xl backdrop-blur-sm p-6 border border-[#D4A574]/60" style={{
        background: 'linear-gradient(135deg, rgba(0,0,0,0.95) 0%, rgba(30,30,30,0.9) 30%, rgba(0,0,0,0.95) 100%)'
      }}>
        <h3 className="text-lg font-semibold mb-4 border-b-2 border-[#D4A574] pb-2 text-white rounded-lg px-3 py-2" style={{ 
          background: 'linear-gradient(135deg, #D4A574FF 0%, #D4A574AA 20%, #D4A574 40%, #D4A574AA 80%, #D4A574FF 100%)',
          boxShadow: '0 0 25px #D4A57460, inset 0 0 50px rgba(255, 255, 255, 0.14), inset 0 0 80px rgba(0, 0, 0, 0.4)',
          textShadow: '0 2px 6px rgba(0, 0, 0, 0.75), 0 0 16px rgba(255, 255, 255, 0.35)'
        }}>Status Breakdown</h3>
        
        <div className="space-y-3 max-h-80 overflow-y-auto">
          {Object.keys(checklistBreakdown)
            .filter(status => checklistBreakdown[status].count > 0)
            .sort((a, b) => checklistBreakdown[b].count - checklistBreakdown[a].count)
            .map(status => {
            const statusData = checklistBreakdown[status] || { count: 0, color: '#6B7280' };
            const count = statusData.count;
            const percentage = totalItems > 0 ? (count / totalItems) * 100 : 0;
            
            return (
              <div key={status} className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div 
                    className="w-3 h-3 rounded-full border border-[#D4A574]" 
                    style={{ 
                      background: `linear-gradient(135deg, ${statusData.color}FF 0%, ${statusData.color}AA 50%, ${statusData.color}FF 100%)`,
                      boxShadow: `0 0 8px ${statusData.color}60, inset 0 0 4px rgba(255, 255, 255, 0.2)`
                    }}
                  ></div>
                  <span className="text-sm text-[#D4A574]">{status}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="bg-gray-700 rounded-full h-2 w-16">
                    <div
                      className="h-2 rounded-full transition-all duration-300"
                      style={{
                        background: `linear-gradient(90deg, ${statusData.color}FF 0%, ${statusData.color}AA 50%, ${statusData.color}FF 100%)`,
                        boxShadow: `0 0 6px ${statusData.color}40`,
                        width: `${percentage}%`
                      }}
                    />
                  </div>
                  <span className="text-sm font-medium text-[#D4C5A9] w-8 text-right">
                    {count}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* RIGHT COLUMN - CALCULATORS SECTION */}
      <div className="rounded-2xl shadow-xl backdrop-blur-sm p-6 border border-[#D4A574]/60" style={{
        background: 'linear-gradient(135deg, rgba(0,0,0,0.95) 0%, rgba(30,30,30,0.9) 30%, rgba(0,0,0,0.95) 100%)'
      }}>
        <h3 className="text-lg font-semibold text-[#D4C5A9] mb-4">🧮 Quick Calculators</h3>
        
        {/* CALCULATOR BUTTONS - HEAVY GRADIENT AND DEEP SHIMMER */}
        <div className="space-y-3">
          <a 
            href="/power-features" 
            className="block w-full p-4 rounded-lg text-center font-semibold transition-all duration-300 hover:scale-105"
            style={{
              background: 'linear-gradient(135deg, #c8a66c 0%, #a0845c 25%, #8b7355 50%, #6a5a4a 75%, #4a3a2a 100%)',
              color: '#1a1a1a',
              border: '1px solid #8b7355',
              boxShadow: '0 0 30px rgba(139, 115, 85, 0.5), inset 0 0 50px rgba(255, 255, 255, 0.15), inset 0 0 90px rgba(0, 0, 0, 0.5)'
            }}
          >
            📐 Wallpaper Calculator
          </a>
          
          <a 
            href="/power-features" 
            className="block w-full p-4 rounded-lg text-center font-semibold transition-all duration-300 hover:scale-105"
            style={{
              background: 'linear-gradient(135deg, #aa9a7a 0%, #8A7A6A 25%, #7A6A5A 50%, #5a4a3a 75%, #3a2a1a 100%)',
              color: '#1a1a1a',
              border: '1px solid #7A6A5A',
              boxShadow: '0 0 30px rgba(122, 106, 90, 0.5), inset 0 0 50px rgba(255, 255, 255, 0.15), inset 0 0 90px rgba(0, 0, 0, 0.5)'
            }}
          >
            🪟 Drapery Calculator
          </a>
          
          <a 
            href="/power-features" 
            className="block w-full p-4 rounded-lg text-center font-semibold transition-all duration-300 hover:scale-105"
            style={{
              background: 'linear-gradient(135deg, #9aaa7a 0%, #7A8A6A 25%, #6A7A5A 50%, #4a5a3a 75%, #2a3a1a 100%)',
              color: '#1a1a1a',
              border: '1px solid #6A7A5A',
              boxShadow: '0 0 30px rgba(106, 122, 90, 0.5), inset 0 0 50px rgba(255, 255, 255, 0.15), inset 0 0 90px rgba(0, 0, 0, 0.5)'
            }}
          >
            🔧 Hardware Calculator
          </a>
          
          <a 
            href="/power-features" 
            className="block w-full p-4 rounded-lg text-center font-semibold transition-all duration-300 hover:scale-105"
            style={{
              background: 'linear-gradient(135deg, #ba9a7a 0%, #9A7A6A 25%, #8A6A5A 50%, #5a4a3a 75%, #3a2a1a 100%)',
              color: '#1a1a1a',
              border: '1px solid #8A6A5A',
              boxShadow: '0 0 30px rgba(138, 106, 90, 0.5), inset 0 0 50px rgba(255, 255, 255, 0.15), inset 0 0 90px rgba(0, 0, 0, 0.5)'
            }}
          >
            🎨 Paint Calculator
          </a>
          
          <a 
            href="/power-features" 
            className="block w-full p-4 rounded-lg text-center font-semibold transition-all duration-300 hover:scale-105"
            style={{
              background: 'linear-gradient(135deg, #9a8aaa 0%, #7A6A9A 25%, #6A5A8A 50%, #4a3a5a 75%, #2a1a3a 100%)',
              color: '#1a1a1a',
              border: '1px solid #6A5A8A',
              boxShadow: '0 0 30px rgba(106, 90, 138, 0.5), inset 0 0 50px rgba(255, 255, 255, 0.15), inset 0 0 90px rgba(0, 0, 0, 0.5)'
            }}
          >
            ⬜ Flooring Calculator
          </a>
          
          <a 
            href="/power-features" 
            className="block w-full p-4 rounded-lg text-center font-semibold transition-all duration-300 hover:scale-105"
            style={{
              background: 'linear-gradient(135deg, #8aaa9a 0%, #6A8A7A 25%, #5A7A6A 50%, #3a5a4a 75%, #1a3a2a 100%)',
              color: '#1a1a1a',
              border: '1px solid #5A7A6A',
              boxShadow: '0 0 30px rgba(90, 122, 106, 0.5), inset 0 0 50px rgba(255, 255, 255, 0.15), inset 0 0 90px rgba(0, 0, 0, 0.5)'
            }}
          >
            💡 Lighting Calculator
          </a>
          
          <a 
            href="/power-features" 
            className="block w-full p-4 rounded-lg text-center font-semibold transition-all duration-300 hover:scale-105"
            style={{
              background: 'linear-gradient(135deg, #c8a66c 0%, #a0845c 25%, #8b7355 50%, #6a5a4a 75%, #4a3a2a 100%)',
              color: '#1a1a1a',
              border: '1px solid #8b7355',
              boxShadow: '0 0 30px rgba(139, 115, 85, 0.5), inset 0 0 50px rgba(255, 255, 255, 0.15), inset 0 0 90px rgba(0, 0, 0, 0.5)'
            }}
          >
            ✨ View All Features
          </a>
        </div>
      </div>
    </div>
  );
};

export default ChecklistStatusOverview;
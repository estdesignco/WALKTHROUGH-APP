import React from 'react';
import { Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

const ChecklistStatusOverview = ({ totalItems, statusBreakdown, carrierBreakdown, itemStatuses, carrierTypes }) => {
  
  // Convert regular status breakdown to checklist format
  const getChecklistStatusBreakdown = () => {
    const checklistStatuses = {
      'TO BE PICKED': { count: 0, color: '#6B7280' },        // Changed from BLANK to TO BE PICKED (gray)
      'PICKED': { count: 0, color: '#3B82F6' },
      'ORDER SAMPLES': { count: 0, color: '#10B981' },
      'SAMPLES ARRIVED': { count: 0, color: '#8B5CF6' },
      'ASK NEIL': { count: 0, color: '#F59E0B' },
      'ASK CHARLENE': { count: 0, color: '#EF4444' },
      'ASK JALA': { count: 0, color: '#EC4899' },
      'GET QUOTE': { count: 0, color: '#06B6D4' },
      'WAITING ON QT': { count: 0, color: '#F97316' },
      'READY FOR PRESENTATION': { count: 0, color: '#84CC16' }
    };
    
    // Map existing statuses to checklist statuses
    Object.keys(statusBreakdown).forEach(status => {
      if (checklistStatuses[status]) {
        checklistStatuses[status].count = statusBreakdown[status];
      } else if (status === '' || status === 'TO BE SELECTED' || status === 'TO BE PICKED') {
        // Map blank, "TO BE SELECTED", and "TO BE PICKED" to TO BE PICKED
        checklistStatuses['TO BE PICKED'].count += statusBreakdown[status];
      } else {
        // For any other unknown statuses, add them to TO BE PICKED as well
        checklistStatuses['TO BE PICKED'].count += statusBreakdown[status];
      }
    });
    
    return checklistStatuses;
  };

  const checklistBreakdown = getChecklistStatusBreakdown();

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
  const totalPicked = Object.values(checklistBreakdown).reduce((sum, status) => 
    sum + (status.count || 0), 0);

  // Prepare data for Status Overview pie chart
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
        borderWidth: 0,
        hoverBorderWidth: 2,
        hoverBorderColor: '#ffffff'
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
            ({checklistBreakdown['PICKED']?.count || 0} PICKED - {totalItems > 0 ? Math.round(((checklistBreakdown['PICKED']?.count || 0) / totalItems) * 100) : 0}%)
          </div>
        </div>
      </div>

      {/* MIDDLE COLUMN - STATUS BREAKDOWN */}
      <div className="rounded-2xl shadow-xl backdrop-blur-sm p-6 border border-[#D4A574]/60" style={{
        background: 'linear-gradient(135deg, rgba(0,0,0,0.95) 0%, rgba(30,30,30,0.9) 30%, rgba(0,0,0,0.95) 100%)'
      }}>
        <h3 className="text-lg font-semibold text-[#D4C5A9] mb-4">Status Breakdown</h3>
        
        <div className="space-y-3 max-h-80 overflow-y-auto">
          {[
            'BLANK', 'PICKED', 'ORDER SAMPLES', 'SAMPLES ARRIVED', 'ASK NEIL', 'ASK CHARLENE', 
            'ASK JALA', 'GET QUOTE', 'WAITING ON QT', 'READY FOR PRESENTATION'
          ].map(status => {
            const statusData = checklistBreakdown[status] || { count: 0, color: '#6B7280' };
            const count = statusData.count;
            const percentage = totalItems > 0 ? (count / totalItems) * 100 : 0;
            
            return (
              <div key={status} className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: statusData.color }}
                  ></div>
                  <span className="text-sm text-[#D4A574]">{status}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="bg-gray-700 rounded-full h-2 w-16">
                    <div
                      className="h-2 rounded-full transition-all duration-300"
                      style={{
                        backgroundColor: statusData.color,
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

      {/* RIGHT COLUMN - SHIPPING SECTION */}
      <div className="rounded-2xl shadow-xl backdrop-blur-sm p-6 border border-[#D4A574]/60" style={{
        background: 'linear-gradient(135deg, rgba(0,0,0,0.95) 0%, rgba(30,30,30,0.9) 30%, rgba(0,0,0,0.95) 100%)'
      }}>
        <h3 className="text-lg font-semibold text-[#D4C5A9] mb-4">Shipping Information</h3>
        
        {/* 1. CARRIER PIE CHART */}
        <div className="mb-6">
          <h4 className="text-md font-medium text-[#D4A574] mb-3">Carrier Distribution</h4>
          <div className="h-48">
            {Object.values(carrierBreakdown).reduce((a, b) => a + b, 0) > 0 ? (
              <Pie data={carrierPieData} options={pieOptions} />
            ) : (
              <div className="flex items-center justify-center h-full text-[#D4A574]">
                No carrier data
              </div>
            )}
          </div>
        </div>

        {/* 2. CARRIER BREAKDOWN LIST */}
        <div className="space-y-2">
          {Object.entries(carrierBreakdown).map(([carrier, count]) => {
            const percentage = totalItems > 0 ? (count / totalItems) * 100 : 0;
            return (
              <div key={carrier} className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: getCarrierColor(carrier) }}
                  ></div>
                  <span className="text-sm text-[#D4A574]">{carrier}</span>
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
                  <span className="text-sm font-medium text-[#D4C5A9] w-8 text-right">
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

export default ChecklistStatusOverview;
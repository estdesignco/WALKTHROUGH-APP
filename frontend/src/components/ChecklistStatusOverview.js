import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

const ChecklistStatusOverview = ({ totalItems, statusBreakdown, carrierBreakdown, itemStatuses }) => {
  const statusData = Object.entries(statusBreakdown || {}).map(([status, count]) => ({
    name: status || 'Unassigned',
    value: count,
    color: getStatusColor(status)
  }));

  const carrierData = Object.entries(carrierBreakdown || {}).map(([carrier, count]) => ({
    name: carrier,
    value: count
  }));

  const CARRIER_COLORS = ['#5A7A5A', '#8A7A5A', '#6A8A5A', '#7A5A6A', '#5A6A8A'];

  function getStatusColor(status) {
    const statusColors = {
      'TO BE SELECTED': '#D4A574',
      'RESEARCHING': '#B8860B',
      'PENDING APPROVAL': '#DAA520',
      'ORDER SAMPLES': '#10B981',
      'SAMPLES ARRIVED': '#8B5CF6',
      'ASK NEIL': '#F59E0B',
      'ASK CHARLENE': '#EF4444',
      'ASK JALA': '#EC4899',
      'GET QUOTE': '#06B6D4',
      'WAITING ON QT': '#F97316',
      'READY FOR PRESENTATION': '#84CC16',
      'PICKED': '#3B82F6',
      'APPROVED BY CLIENT': '#10B981',
      'ORDERED': '#32CD32',
      'BACKORDERED': '#FFA500',
      'IN PRODUCTION': '#FFD700',
      'SHIPPED': '#4169E1',
      'DELIVERED TO RECEIVER': '#9370DB',
      'DELIVERED TO JOB SITE': '#8A2BE2',
      'INSTALLED': '#00CED1',
      '': '#9CA3AF'
    };
    return statusColors[status] || '#9CA3AF';
  }

  return (
    <div className="space-y-8 mb-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-2xl shadow-xl backdrop-blur-sm p-6 border border-[#D4A574]/60" style={{
          background: 'linear-gradient(135deg, rgba(0,0,0,0.95) 0%, rgba(30,30,30,0.9) 30%, rgba(0,0,0,0.95) 100%)'
        }}>
          <h3 className="text-lg font-semibold text-[#D4C5A9] mb-6">📊 Status Breakdown</h3>
          
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-[#D4C5A9]">Total Items</span>
              <span className="text-2xl font-bold text-[#D4A574]">{totalItems || 0}</span>
            </div>
          </div>

          {statusData && statusData.length > 0 && (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          )}

          <div className="mt-6 space-y-2">
            {statusData.slice(0, 5).map(({ name, value, color }) => (
              <div key={name} className="flex justify-between items-center text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }}></div>
                  <span className="text-[#D4C5A9]">{name}</span>
                </div>
                <span className="text-[#D4A574] font-semibold">{value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl shadow-xl backdrop-blur-sm p-6 border border-[#D4A574]/60" style={{
          background: 'linear-gradient(135deg, rgba(0,0,0,0.95) 0%, rgba(30,30,30,0.9) 30%, rgba(0,0,0,0.95) 100%)'
        }}>
          <h3 className="text-lg font-semibold text-[#D4C5A9] mb-6">📦 Carrier Distribution</h3>
          
          {carrierData && carrierData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={carrierData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {carrierData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={CARRIER_COLORS[index % CARRIER_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              
              <div className="mt-6 space-y-2">
                {carrierData.map(({ name, value }, index) => (
                  <div key={name} className="flex justify-between items-center text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: CARRIER_COLORS[index % CARRIER_COLORS.length] }}></div>
                      <span className="text-[#D4C5A9]">{name}</span>
                    </div>
                    <span className="text-[#D4A574] font-semibold">{value}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="text-[#D4C5A9] text-center py-8">No carriers assigned yet</p>
          )}
        </div>
      </div>

      <div className="rounded-2xl shadow-xl backdrop-blur-sm p-6 border border-[#D4A574]/60" style={{
        background: 'linear-gradient(135deg, rgba(0,0,0,0.95) 0%, rgba(30,30,30,0.9) 30%, rgba(0,0,0,0.95) 100%)'
      }}>
        <h3 className="text-lg font-semibold text-[#D4C5A9] mb-4">🧮 Quick Calculators</h3>
        
        {/* CALCULATOR BUTTONS - STATIC SHIMMER NO ANIMATION */}
        <div className="space-y-3">
          <a 
            href="/power-features" 
            className="block w-full p-4 rounded-lg text-center font-semibold transition-all duration-300 hover:scale-105 hover:shadow-2xl"
            style={{
              background: 'linear-gradient(135deg, #8b7355 0%, #a0845c 50%, #8b7355 100%)',
              color: '#1a1a1a',
              boxShadow: '0 4px 15px rgba(139, 115, 85, 0.3), inset 0 2px 0 rgba(255, 255, 255, 0.2)'
            }}
          >
            📐 Wallpaper Calculator
          </a>
          
          <a 
            href="/power-features" 
            className="block w-full p-4 rounded-lg text-center font-semibold transition-all duration-300 hover:scale-105 hover:shadow-2xl"
            style={{
              background: 'linear-gradient(135deg, #7A6A5A 0%, #8A7A6A 50%, #7A6A5A 100%)',
              color: '#1a1a1a',
              boxShadow: '0 4px 15px rgba(122, 106, 90, 0.3), inset 0 2px 0 rgba(255, 255, 255, 0.2)'
            }}
          >
            🪟 Drapery Calculator
          </a>
          
          <a 
            href="/power-features" 
            className="block w-full p-4 rounded-lg text-center font-semibold transition-all duration-300 hover:scale-105 hover:shadow-2xl"
            style={{
              background: 'linear-gradient(135deg, #6A7A5A 0%, #7A8A6A 50%, #6A7A5A 100%)',
              color: '#1a1a1a',
              boxShadow: '0 4px 15px rgba(106, 122, 90, 0.3), inset 0 2px 0 rgba(255, 255, 255, 0.2)'
            }}
          >
            🔧 Hardware Calculator
          </a>
          
          <a 
            href="/power-features" 
            className="block w-full p-4 rounded-lg text-center font-semibold transition-all duration-300 hover:scale-105 hover:shadow-2xl"
            style={{
              background: 'linear-gradient(135deg, #8A6A5A 0%, #9A7A6A 50%, #8A6A5A 100%)',
              color: '#1a1a1a',
              boxShadow: '0 4px 15px rgba(138, 106, 90, 0.3), inset 0 2px 0 rgba(255, 255, 255, 0.2)'
            }}
          >
            🎨 Paint Calculator
          </a>
          
          <a 
            href="/power-features" 
            className="block w-full p-4 rounded-lg text-center font-semibold transition-all duration-300 hover:scale-105 hover:shadow-2xl"
            style={{
              background: 'linear-gradient(135deg, #6A5A8A 0%, #7A6A9A 50%, #6A5A8A 100%)',
              color: '#1a1a1a',
              boxShadow: '0 4px 15px rgba(106, 90, 138, 0.3), inset 0 2px 0 rgba(255, 255, 255, 0.2)'
            }}
          >
            ⬜ Flooring Calculator
          </a>
          
          <a 
            href="/power-features" 
            className="block w-full p-4 rounded-lg text-center font-semibold transition-all duration-300 hover:scale-105 hover:shadow-2xl"
            style={{
              background: 'linear-gradient(135deg, #5A7A6A 0%, #6A8A7A 50%, #5A7A6A 100%)',
              color: '#1a1a1a',
              boxShadow: '0 4px 15px rgba(90, 122, 106, 0.3), inset 0 2px 0 rgba(255, 255, 255, 0.2)'
            }}
          >
            💡 Lighting Calculator
          </a>
          
          <a 
            href="/power-features" 
            className="block w-full p-4 rounded-lg text-center font-semibold transition-all duration-300 hover:scale-105 hover:shadow-2xl"
            style={{
              background: 'linear-gradient(135deg, #8b7355 0%, #a0845c 50%, #8b7355 100%)',
              color: '#1a1a1a',
              boxShadow: '0 4px 15px rgba(139, 115, 85, 0.3), inset 0 2px 0 rgba(255, 255, 255, 0.2)'
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

import React, { useState, useEffect } from 'react';
import { DollarSign } from 'lucide-react';

const FinanceDashboard = ({ projectId }) => {
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [defaultMarkup, setDefaultMarkup] = useState(125);
  const [projectBudget, setProjectBudget] = useState(0);

  useEffect(() => {
    loadProjectFinancials();
  }, [projectId]);

  const loadProjectFinancials = async () => {
    try {
      const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
      const response = await fetch(`${BACKEND_URL}/api/projects/${projectId}?sheet_type=ffe`);
      if (response.ok) {
        const data = await response.json();
        setProject(data);
        setProjectBudget(data.budget || 0);
        setDefaultMarkup(data.default_markup || 125);
      }
    } catch (error) {
      console.error('Error loading financials:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateRoomFinancials = () => {
    if (!project?.rooms) return [];

    return project.rooms.map(room => {
      let totalCost = 0;
      let totalClientPrice = 0;

      room.categories?.forEach(category => {
        category.subcategories?.forEach(subcategory => {
          subcategory.items?.forEach(item => {
            const cost = parseFloat(item.cost) || 0;
            const quantity = parseFloat(item.quantity) || 1;
            const markup = parseFloat(item.markup) || defaultMarkup;
            
            const itemCost = cost * quantity;
            const itemClientPrice = itemCost * (markup / 100);
            
            totalCost += itemCost;
            totalClientPrice += itemClientPrice;
          });
        });
      });

      return {
        room_name: room.name,
        room_id: room.id,
        total_cost: totalCost,
        total_client_price: totalClientPrice,
        profit: totalClientPrice - totalCost,
        margin: totalCost > 0 ? ((totalClientPrice - totalCost) / totalClientPrice * 100) : 0
      };
    });
  };

  const calculateProjectTotals = (roomFinancials) => {
    const totalCost = roomFinancials.reduce((sum, room) => sum + room.total_cost, 0);
    const totalClientPrice = roomFinancials.reduce((sum, room) => sum + room.total_client_price, 0);
    const totalProfit = totalClientPrice - totalCost;
    const profitMargin = totalClientPrice > 0 ? (totalProfit / totalClientPrice * 100) : 0;
    const remainingBudget = projectBudget - totalCost;

    return {
      totalCost,
      totalClientPrice,
      totalProfit,
      profitMargin,
      remainingBudget,
      budgetUsed: projectBudget > 0 ? (totalCost / projectBudget * 100) : 0
    };
  };

  if (loading) {
    return <div className="text-center py-12 text-[#D4C5A9]">Loading financial data...</div>;
  }

  const roomFinancials = calculateRoomFinancials();
  const totals = calculateProjectTotals(roomFinancials);

  return (
    <div className="w-full" style={{ backgroundColor: '#0F172A', padding: '24px' }}>
      {/* PROJECT TOTALS */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-[#D4A574] mb-6">💰 Project Financials</h2>
        
        {/* BUDGET & MARKUP SETTINGS */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="rounded-2xl p-6 border border-[#D4A574]/60" style={{
            background: 'linear-gradient(135deg, rgba(0,0,0,0.95) 0%, rgba(30,30,30,0.9) 30%, rgba(0,0,0,0.95) 100%)'
          }}>
            <h3 className="text-xl font-bold text-[#D4A574] mb-4">Project Budget</h3>
            <input
              type="number"
              value={projectBudget}
              onChange={(e) => setProjectBudget(parseFloat(e.target.value) || 0)}
              className="w-full bg-transparent border-2 border-[#D4A574] text-white text-2xl px-4 py-3 rounded-lg"
              placeholder="Enter project budget"
            />
          </div>
          
          <div className="rounded-2xl p-6 border border-[#D4A574]/60" style={{
            background: 'linear-gradient(135deg, rgba(0,0,0,0.95) 0%, rgba(30,30,30,0.9) 30%, rgba(0,0,0,0.95) 100%)'
          }}>
            <h3 className="text-xl font-bold text-[#D4A574] mb-4">Default Markup %</h3>
            <input
              type="number"
              value={defaultMarkup}
              onChange={(e) => setDefaultMarkup(parseFloat(e.target.value) || 125)}
              className="w-full bg-transparent border-2 border-[#D4A574] text-white text-2xl px-4 py-3 rounded-lg"
              placeholder="125"
            />
            <p className="text-sm text-[#B49B7E] mt-2">Cost × {(defaultMarkup / 100).toFixed(2)} = Client Price</p>
          </div>
        </div>

        {/* FINANCIAL SUMMARY CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <div className="rounded-2xl p-6 border border-[#D4A574]/60" style={{
            background: 'linear-gradient(135deg, #8B4513FF 0%, #8B4513AA 50%, #8B4513FF 100%)',
            boxShadow: '0 0 25px #8B451360'
          }}>
            <div className="text-sm text-white mb-2">TOTAL COST</div>
            <div className="text-3xl font-bold text-white">${totals.totalCost.toFixed(2)}</div>
          </div>

          <div className="rounded-2xl p-6 border border-[#D4A574]/60" style={{
            background: 'linear-gradient(135deg, #6B46C1FF 0%, #6B46C1AA 50%, #6B46C1FF 100%)',
            boxShadow: '0 0 25px #6B46C160'
          }}>
            <div className="text-sm text-white mb-2">CLIENT PRICE</div>
            <div className="text-3xl font-bold text-white">${totals.totalClientPrice.toFixed(2)}</div>
          </div>

          <div className="rounded-2xl p-6 border border-[#D4A574]/60" style={{
            background: 'linear-gradient(135deg, #10B981FF 0%, #10B981AA 50%, #10B981FF 100%)',
            boxShadow: '0 0 25px #10B98160'
          }}>
            <div className="text-sm text-white mb-2">PROFIT</div>
            <div className="text-3xl font-bold text-white">${totals.totalProfit.toFixed(2)}</div>
            <div className="text-sm text-white mt-1">{totals.profitMargin.toFixed(1)}% margin</div>
          </div>

          <div className="rounded-2xl p-6 border border-[#D4A574]/60" style={{
            background: totals.remainingBudget < 0 
              ? 'linear-gradient(135deg, #EF4444FF 0%, #EF4444AA 50%, #EF4444FF 100%)'
              : 'linear-gradient(135deg, #D4A574FF 0%, #D4A574AA 50%, #D4A574FF 100%)',
            boxShadow: totals.remainingBudget < 0 ? '0 0 25px #EF444460' : '0 0 25px #D4A57460'
          }}>
            <div className="text-sm text-white mb-2">REMAINING BUDGET</div>
            <div className="text-3xl font-bold text-white">${totals.remainingBudget.toFixed(2)}</div>
            <div className="text-sm text-white mt-1">{totals.budgetUsed.toFixed(1)}% used</div>
          </div>
        </div>
      </div>

      {/* ROOM BREAKDOWN TABLE */}
      <div className="rounded-2xl border border-[#D4A574]/60 overflow-hidden" style={{
        background: 'linear-gradient(135deg, rgba(0,0,0,0.95) 0%, rgba(30,30,30,0.9) 30%, rgba(0,0,0,0.95) 100%)'
      }}>
        <h3 className="text-2xl font-bold text-[#D4A574] p-6 border-b border-[#D4A574]/60">💵 Room Breakdown</h3>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{
                background: 'linear-gradient(135deg, #8B4444FF 0%, #8B4444AA 50%, #8B4444FF 100%)'
              }}>
                <th className="px-6 py-4 text-left text-sm font-bold text-white border-b border-[#D4A574]">ROOM</th>
                <th className="px-6 py-4 text-right text-sm font-bold text-white border-b border-[#D4A574]">COST</th>
                <th className="px-6 py-4 text-right text-sm font-bold text-white border-b border-[#D4A574]">CLIENT PRICE</th>
                <th className="px-6 py-4 text-right text-sm font-bold text-white border-b border-[#D4A574]">PROFIT</th>
                <th className="px-6 py-4 text-right text-sm font-bold text-white border-b border-[#D4A574]">MARGIN %</th>
              </tr>
            </thead>
            <tbody>
              {roomFinancials.map((room, index) => (
                <tr key={room.room_id} style={{
                  background: index % 2 === 0 
                    ? 'linear-gradient(135deg, rgba(0, 0, 0, 0.95) 0%, rgba(30, 30, 30, 0.9) 50%, rgba(0, 0, 0, 0.95) 100%)'
                    : 'linear-gradient(135deg, rgba(15, 15, 25, 0.95) 0%, rgba(45, 45, 55, 0.9) 50%, rgba(15, 15, 25, 0.95) 100%)'
                }}>
                  <td className="px-6 py-4 text-[#D4A574] font-semibold border-b border-[#D4A574]/30">{room.room_name}</td>
                  <td className="px-6 py-4 text-white text-right border-b border-[#D4A574]/30">${room.total_cost.toFixed(2)}</td>
                  <td className="px-6 py-4 text-white text-right border-b border-[#D4A574]/30">${room.total_client_price.toFixed(2)}</td>
                  <td className="px-6 py-4 text-green-400 text-right font-semibold border-b border-[#D4A574]/30">${room.profit.toFixed(2)}</td>
                  <td className="px-6 py-4 text-white text-right border-b border-[#D4A574]/30">{room.margin.toFixed(1)}%</td>
                </tr>
              ))}
              
              {/* TOTALS ROW */}
              <tr style={{
                background: 'linear-gradient(135deg, #D4A574FF 0%, #D4A574AA 50%, #D4A574FF 100%)',
                boxShadow: '0 0 20px #D4A57440'
              }}>
                <td className="px-6 py-4 text-black font-bold">TOTAL</td>
                <td className="px-6 py-4 text-black font-bold text-right">${totals.totalCost.toFixed(2)}</td>
                <td className="px-6 py-4 text-black font-bold text-right">${totals.totalClientPrice.toFixed(2)}</td>
                <td className="px-6 py-4 text-black font-bold text-right">${totals.totalProfit.toFixed(2)}</td>
                <td className="px-6 py-4 text-black font-bold text-right">{totals.profitMargin.toFixed(1)}%</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default FinanceDashboard;
import React, { useState, useEffect } from 'react';
import { BarChart3, PieChart, TrendingUp, Download, Clock } from 'lucide-react';
import { Pie, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

const ReportsDashboard = ({ projectId }) => {
  const [project, setProject] = useState(null);
  const [allProjects, setAllProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeEntries, setTimeEntries] = useState([]);
  const [showTimeEntry, setShowTimeEntry] = useState(false);
  const [newTimeEntry, setNewTimeEntry] = useState({ hours: 0, task: '', date: new Date().toISOString().split('T')[0] });

  useEffect(() => {
    loadReportData();
  }, [projectId]);

  const loadReportData = async () => {
    try {
      const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
      
      // Load current project
      const projectResponse = await fetch(`${BACKEND_URL}/api/projects/${projectId}?sheet_type=ffe`);
      if (projectResponse.ok) {
        setProject(await projectResponse.json());
      }
      
      // Load all projects for comparison
      const allProjectsResponse = await fetch(`${BACKEND_URL}/api/projects`);
      if (allProjectsResponse.ok) {
        setAllProjects(await allProjectsResponse.json());
      }
      
      // Load time entries
      const timeResponse = await fetch(`${BACKEND_URL}/api/time-entries/${projectId}`);
      if (timeResponse.ok) {
        const data = await timeResponse.json();
        setTimeEntries(data.time_entries || []);
      }
    } catch (error) {
      console.error('Error loading report data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getVendorSpendAnalysis = () => {
    if (!project?.rooms) return {};
    
    const vendorSpend = {};
    project.rooms.forEach(room => {
      room.categories?.forEach(category => {
        category.subcategories?.forEach(subcategory => {
          subcategory.items?.forEach(item => {
            const vendor = item.vendor || 'Unknown';
            const cost = parseFloat(item.cost) || 0;
            const quantity = parseFloat(item.quantity) || 1;
            const totalCost = cost * quantity;
            
            vendorSpend[vendor] = (vendorSpend[vendor] || 0) + totalCost;
          });
        });
      });
    });
    
    return vendorSpend;
  };

  const getProjectComparison = () => {
    return allProjects.map(proj => {
      let totalCost = 0;
      let totalProfit = 0;
      
      proj.rooms?.forEach(room => {
        room.categories?.forEach(category => {
          category.subcategories?.forEach(subcategory => {
            subcategory.items?.forEach(item => {
              const cost = parseFloat(item.cost) || 0;
              const quantity = parseFloat(item.quantity) || 1;
              const markup = parseFloat(item.markup) || parseFloat(proj.default_markup) || 125;
              
              const itemCost = cost * quantity;
              const itemClientPrice = itemCost * (markup / 100);
              
              totalCost += itemCost;
              totalProfit += (itemClientPrice - itemCost);
            });
          });
        });
      });
      
      return {
        name: proj.name,
        cost: totalCost,
        profit: totalProfit,
        margin: totalCost > 0 ? (totalProfit / (totalCost + totalProfit) * 100) : 0
      };
    });
  };

  const handleAddTimeEntry = async () => {
    try {
      const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
      await fetch(`${BACKEND_URL}/api/time-entries`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_id: projectId,
          hours: parseFloat(newTimeEntry.hours),
          task: newTimeEntry.task,
          date: newTimeEntry.date
        })
      });
      
      setShowTimeEntry(false);
      setNewTimeEntry({ hours: 0, task: '', date: new Date().toISOString().split('T')[0] });
      loadReportData();
    } catch (error) {
      console.error('Error adding time entry:', error);
      alert('Failed to add time entry');
    }
  };

  const exportToCSV = (data, filename) => {
    const csv = data.map(row => Object.values(row).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
  };

  if (loading) {
    return <div className="text-center py-12 text-[#D4C5A9]">Loading reports...</div>;
  }

  const vendorSpend = getVendorSpendAnalysis();
  const projectComparison = getProjectComparison();
  const totalHours = timeEntries.reduce((sum, entry) => sum + parseFloat(entry.hours || 0), 0);

  // Vendor Spend Chart Data
  const vendorChartData = {
    labels: Object.keys(vendorSpend).slice(0, 10),
    datasets: [{
      data: Object.values(vendorSpend).slice(0, 10),
      backgroundColor: [
        '#D4A574', '#8B4513', '#6B46C1', '#B49B7E', '#8B4444',
        '#A08B6F', '#7B68AA', '#9B89B3', '#5A7A5A', '#8B7355'
      ],
      borderColor: '#D4A574',
      borderWidth: 2
    }]
  };

  // Project Comparison Chart Data
  const projectChartData = {
    labels: projectComparison.map(p => p.name.substring(0, 20)),
    datasets: [
      {
        label: 'Cost',
        data: projectComparison.map(p => p.cost),
        backgroundColor: '#8B4513',
        borderColor: '#D4A574',
        borderWidth: 2
      },
      {
        label: 'Profit',
        data: projectComparison.map(p => p.profit),
        backgroundColor: '#10B981',
        borderColor: '#D4A574',
        borderWidth: 2
      }
    ]
  };

  return (
    <div className="w-full" style={{ backgroundColor: '#0F172A', padding: '24px' }}>
      <h2 className="text-3xl font-bold text-[#D4A574] mb-6">📊 Reports & Analytics</h2>

      {/* VENDOR SPEND ANALYSIS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="rounded-2xl p-6 border border-[#D4A574]/60" style={{
          background: 'linear-gradient(135deg, rgba(0,0,0,0.95) 0%, rgba(30,30,30,0.9) 50%, rgba(0,0,0,0.95) 100%)'
        }}>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold text-[#D4A574]">💰 Vendor Spend Analysis</h3>
            <button
              onClick={() => {
                const data = Object.entries(vendorSpend).map(([vendor, spend]) => ({
                  Vendor: vendor,
                  'Total Spend': `$${spend.toFixed(2)}`
                }));
                exportToCSV(data, 'vendor_spend.csv');
              }}
              className="bg-[#8B4513] hover:bg-[#A0522D] text-white px-4 py-2 rounded-lg text-sm font-bold"
            >
              <Download className="w-4 h-4 inline mr-2" />
              Export CSV
            </button>
          </div>
          <div className="h-80">
            {Object.keys(vendorSpend).length > 0 ? (
              <Pie data={vendorChartData} options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'right',
                    labels: { color: '#D4A574', font: { size: 11 } }
                  }
                }
              }} />
            ) : (
              <div className="flex items-center justify-center h-full text-[#B49B7E]">No vendor data</div>
            )}
          </div>
          <div className="mt-4 max-h-48 overflow-y-auto">
            {Object.entries(vendorSpend)
              .sort((a, b) => b[1] - a[1])
              .slice(0, 10)
              .map(([vendor, spend], index) => (
                <div key={vendor} className="flex justify-between py-2 border-b border-[#D4A574]/30">
                  <span className="text-[#D4C5A9]">{index + 1}. {vendor}</span>
                  <span className="text-[#D4A574] font-bold">${spend.toFixed(2)}</span>
                </div>
              ))}
          </div>
        </div>

        {/* TIME TRACKING */}
        <div className="rounded-2xl p-6 border border-[#D4A574]/60" style={{
          background: 'linear-gradient(135deg, rgba(0,0,0,0.95) 0%, rgba(30,30,30,0.9) 50%, rgba(0,0,0,0.95) 100%)'
        }}>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold text-[#D4A574]">⏱️ Time Tracking</h3>
            <button
              onClick={() => setShowTimeEntry(true)}
              className="bg-[#6B46C1] hover:bg-[#7B56D1] text-white px-4 py-2 rounded-lg text-sm font-bold"
            >
              + Log Time
            </button>
          </div>
          
          <div className="text-center mb-6">
            <div className="text-5xl font-bold text-[#D4A574]">{totalHours.toFixed(1)}</div>
            <div className="text-[#B49B7E]">Total Hours Logged</div>
          </div>
          
          <div className="max-h-64 overflow-y-auto">
            {timeEntries.length === 0 ? (
              <div className="text-center text-[#B49B7E] py-8">No time entries yet</div>
            ) : (
              timeEntries.map((entry, index) => (
                <div key={index} className="flex justify-between py-3 border-b border-[#D4A574]/30">
                  <div>
                    <div className="text-[#D4C5A9] font-semibold">{entry.task}</div>
                    <div className="text-sm text-[#B49B7E]">{new Date(entry.date).toLocaleDateString()}</div>
                  </div>
                  <div className="text-[#D4A574] font-bold">{entry.hours}h</div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* PROJECT PROFITABILITY COMPARISON */}
      <div className="rounded-2xl p-6 border border-[#D4A574]/60 mb-8" style={{
        background: 'linear-gradient(135deg, rgba(0,0,0,0.95) 0%, rgba(30,30,30,0.9) 50%, rgba(0,0,0,0.95) 100%)'
      }}>
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-bold text-[#D4A574]">📈 Project Profitability Comparison</h3>
          <button
            onClick={() => {
              exportToCSV(
                projectComparison.map(p => ({
                  Project: p.name,
                  Cost: `$${p.cost.toFixed(2)}`,
                  Profit: `$${p.profit.toFixed(2)}`,
                  'Margin %': `${p.margin.toFixed(1)}%`
                })),
                'project_profitability.csv'
              );
            }}
            className="bg-[#8B4513] hover:bg-[#A0522D] text-white px-6 py-2 rounded-lg font-bold"
          >
            <Download className="w-4 h-4 inline mr-2" />
            Export Report
          </button>
        </div>
        
        <div className="h-96 mb-6">
          <Bar data={projectChartData} options={{
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                labels: { color: '#D4A574', font: { size: 12 } }
              }
            },
            scales: {
              x: { ticks: { color: '#B49B7E' }, grid: { color: '#D4A574/20' } },
              y: { ticks: { color: '#B49B7E' }, grid: { color: '#D4A574/20' } }
            }
          }} />
        </div>
        
        {/* PROJECT COMPARISON TABLE */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{
                background: 'linear-gradient(135deg, #8B4444FF 0%, #8B4444AA 50%, #8B4444FF 100%)'
              }}>
                <th className="px-6 py-4 text-left text-sm font-bold text-white">PROJECT</th>
                <th className="px-6 py-4 text-right text-sm font-bold text-white">COST</th>
                <th className="px-6 py-4 text-right text-sm font-bold text-white">PROFIT</th>
                <th className="px-6 py-4 text-right text-sm font-bold text-white">MARGIN %</th>
                <th className="px-6 py-4 text-right text-sm font-bold text-white">ITEMS</th>
              </tr>
            </thead>
            <tbody>
              {projectComparison.map((proj, index) => {
                const itemCount = allProjects.find(p => p.name === proj.name)?.rooms?.reduce((sum, r) => 
                  sum + (r.categories?.reduce((cSum, c) => 
                    cSum + (c.subcategories?.reduce((sSum, s) => 
                      sSum + (s.items?.length || 0), 0) || 0), 0) || 0), 0) || 0;
                
                return (
                  <tr key={index} style={{
                    background: index % 2 === 0 
                      ? 'linear-gradient(135deg, rgba(0, 0, 0, 0.95) 0%, rgba(30, 30, 30, 0.9) 50%, rgba(0, 0, 0, 0.95) 100%)'
                      : 'linear-gradient(135deg, rgba(15, 15, 25, 0.95) 0%, rgba(45, 45, 55, 0.9) 50%, rgba(15, 15, 25, 0.95) 100%)'
                  }}>
                    <td className="px-6 py-4 text-[#D4A574] font-semibold border-b border-[#D4A574]/30">{proj.name}</td>
                    <td className="px-6 py-4 text-white text-right border-b border-[#D4A574]/30">${proj.cost.toFixed(2)}</td>
                    <td className="px-6 py-4 text-green-400 text-right font-semibold border-b border-[#D4A574]/30">${proj.profit.toFixed(2)}</td>
                    <td className="px-6 py-4 text-white text-right border-b border-[#D4A574]/30">{proj.margin.toFixed(1)}%</td>
                    <td className="px-6 py-4 text-[#B49B7E] text-right border-b border-[#D4A574]/30">{itemCount}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* TIME ENTRY MODAL */}
      {showTimeEntry && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-[#1E293B] border-2 border-[#D4A574] rounded-2xl p-8 max-w-md w-full">
            <h3 className="text-2xl font-bold text-[#D4A574] mb-6">⏱️ Log Time Entry</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-[#B49B7E] mb-2">Task/Description</label>
                <input
                  type="text"
                  value={newTimeEntry.task}
                  onChange={(e) => setNewTimeEntry({ ...newTimeEntry, task: e.target.value })}
                  className="w-full bg-gray-800 text-white px-4 py-2 rounded-lg border border-[#D4A574]"
                  placeholder="e.g., Client meeting, Site visit"
                />
              </div>
              
              <div>
                <label className="block text-[#B49B7E] mb-2">Hours</label>
                <input
                  type="number"
                  step="0.5"
                  value={newTimeEntry.hours}
                  onChange={(e) => setNewTimeEntry({ ...newTimeEntry, hours: e.target.value })}
                  className="w-full bg-gray-800 text-white px-4 py-2 rounded-lg border border-[#D4A574]"
                  placeholder="e.g., 2.5"
                />
              </div>
              
              <div>
                <label className="block text-[#B49B7E] mb-2">Date</label>
                <input
                  type="date"
                  value={newTimeEntry.date}
                  onChange={(e) => setNewTimeEntry({ ...newTimeEntry, date: e.target.value })}
                  className="w-full bg-gray-800 text-white px-4 py-2 rounded-lg border border-[#D4A574]"
                />
              </div>
            </div>
            
            <div className="flex gap-4 mt-6">
              <button
                onClick={handleAddTimeEntry}
                className="flex-1 bg-[#D4A574] hover:bg-[#C49564] text-black px-6 py-3 rounded-lg font-bold"
              >
                Save Entry
              </button>
              <button
                onClick={() => setShowTimeEntry(false)}
                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white px-6 py-3 rounded-lg font-bold"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportsDashboard;
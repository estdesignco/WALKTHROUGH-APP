import React, { useState, useEffect } from 'react';
import { Calendar, Clock, AlertCircle, CheckCircle, TrendingUp } from 'lucide-react';

const InstallationCalendar = ({ projectId }) => {
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [predictedPresentationDate, setPredictedPresentationDate] = useState(null);
  const [predictedInstallDate, setPredictedInstallDate] = useState(null);
  const [criticalPathItems, setCriticalPathItems] = useState([]);

  useEffect(() => {
    loadProjectTimeline();
  }, [projectId]);

  const loadProjectTimeline = async () => {
    try {
      const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
      const response = await fetch(`${BACKEND_URL}/api/projects/${projectId}?sheet_type=ffe`);
      if (response.ok) {
        const data = await response.json();
        setProject(data);
        calculatePredictions(data);
      }
    } catch (error) {
      console.error('Error loading timeline:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculatePredictions = (projectData) => {
    if (!projectData?.rooms) return;

    const allItems = [];
    const blockers = [];
    
    projectData.rooms.forEach(room => {
      room.categories?.forEach(category => {
        category.subcategories?.forEach(subcategory => {
          subcategory.items?.forEach(item => {
            allItems.push({
              ...item,
              room_name: room.name,
              category_name: category.name
            });
          });
        });
      });
    });

    // Calculate Presentation Date (latest approval needed)
    let latestPresentationDate = new Date();
    allItems.forEach(item => {
      const status = item.status || '';
      if (!['APPROVED', 'ORDERED', 'PICKED', 'CONFIRMED', 'IN PRODUCTION', 'SHIPPED', 'DELIVERED', 'INSTALLED'].includes(status)) {
        // Item not approved yet
        const leadTime = parseInt(item.lead_time_weeks) || 2; // Default 2 weeks for selection
        const itemDate = new Date();
        itemDate.setDate(itemDate.getDate() + (leadTime * 7));
        
        if (itemDate > latestPresentationDate) {
          latestPresentationDate = itemDate;
        }
        
        if (status === 'TO BE SELECTED' || status === 'RESEARCHING') {
          blockers.push({
            ...item,
            reason: 'Not yet selected',
            days_delayed: Math.ceil((itemDate - new Date()) / (1000 * 60 * 60 * 24))
          });
        }
      }
    });

    // Calculate Install Date (latest delivery)
    let latestInstallDate = new Date();
    allItems.forEach(item => {
      let itemReadyDate = new Date();
      
      // Check EST. DATES from spreadsheet
      if (item.estimated_delivery_date) {
        itemReadyDate = new Date(item.estimated_delivery_date);
      } else if (item.order_date) {
        const leadTime = parseInt(item.lead_time_weeks) || 8; // Default 8 weeks
        itemReadyDate = new Date(item.order_date);
        itemReadyDate.setDate(itemReadyDate.getDate() + (leadTime * 7));
      } else {
        // Not ordered yet - use lead time from today
        const leadTime = parseInt(item.lead_time_weeks) || 12; // Default 12 weeks
        itemReadyDate.setDate(itemReadyDate.getDate() + (leadTime * 7));
      }

      if (itemReadyDate > latestInstallDate) {
        latestInstallDate = itemReadyDate;
      }

      // Check for blockers
      const status = item.status || '';
      if (!['DELIVERED TO RECEIVER', 'DELIVERED TO JOB SITE', 'RECEIVED', 'READY FOR INSTALL', 'INSTALLED'].includes(status)) {
        const daysUntilReady = Math.ceil((itemReadyDate - new Date()) / (1000 * 60 * 60 * 24));
        
        if (daysUntilReady > 30 || status === 'BACKORDERED' || item.stock_status === 'OUT OF STOCK') {
          blockers.push({
            ...item,
            reason: status === 'BACKORDERED' ? 'Backordered' : 
                    item.stock_status === 'OUT OF STOCK' ? 'Out of Stock' :
                    !item.order_date ? 'Not yet ordered' :
                    'Long lead time',
            days_delayed: daysUntilReady,
            expected_arrival: itemReadyDate.toLocaleDateString()
          });
        }
      }
    });

    setPredictedPresentationDate(latestPresentationDate);
    setPredictedInstallDate(latestInstallDate);
    setCriticalPathItems(blockers.sort((a, b) => b.days_delayed - a.days_delayed).slice(0, 10));
  };

  const getStatusSummary = () => {
    if (!project?.rooms) return {};

    const summary = {
      total: 0,
      to_be_selected: 0,
      ordered: 0,
      in_transit: 0,
      delivered: 0,
      installed: 0
    };

    project.rooms.forEach(room => {
      room.categories?.forEach(category => {
        category.subcategories?.forEach(subcategory => {
          subcategory.items?.forEach(item => {
            summary.total++;
            const status = item.status || '';
            
            if (['TO BE SELECTED', 'RESEARCHING'].includes(status)) summary.to_be_selected++;
            else if (['ORDERED', 'PICKED', 'CONFIRMED', 'IN PRODUCTION'].includes(status)) summary.ordered++;
            else if (['SHIPPED', 'IN TRANSIT', 'OUT FOR DELIVERY'].includes(status)) summary.in_transit++;
            else if (['DELIVERED TO RECEIVER', 'DELIVERED TO JOB SITE', 'RECEIVED'].includes(status)) summary.delivered++;
            else if (['READY FOR INSTALL', 'INSTALLING', 'INSTALLED'].includes(status)) summary.installed++;
          });
        });
      });
    });

    return summary;
  };

  if (loading) {
    return <div className="text-center py-12 text-[#D4C5A9]">Loading installation timeline...</div>;
  }

  const statusSummary = getStatusSummary();
  const today = new Date();
  const daysToPresentation = predictedPresentationDate ? Math.ceil((predictedPresentationDate - today) / (1000 * 60 * 60 * 24)) : 0;
  const daysToInstall = predictedInstallDate ? Math.ceil((predictedInstallDate - today) / (1000 * 60 * 60 * 24)) : 0;

  return (
    <div className="w-full" style={{ backgroundColor: '#0F172A', padding: '24px' }}>
      <h2 className="text-3xl font-bold text-[#D4A574] mb-6">📅 Installation Timeline</h2>

      {/* PREDICTED DATES */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="rounded-2xl p-8 border border-[#D4A574]/60" style={{
          background: 'linear-gradient(135deg, #6B46C1FF 0%, #6B46C1AA 50%, #6B46C1FF 100%)',
          boxShadow: '0 0 30px #6B46C160'
        }}>
          <div className="flex items-center gap-4 mb-4">
            <TrendingUp className="w-12 h-12 text-white" />
            <div>
              <h3 className="text-2xl font-bold text-white">Predicted Presentation Date</h3>
              <p className="text-sm text-white/80">When all items will be ready for client approval</p>
            </div>
          </div>
          <div className="text-4xl font-bold text-white mb-2">
            {predictedPresentationDate?.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </div>
          <div className="text-lg text-white">
            {daysToPresentation > 0 ? `${daysToPresentation} days from now` : 'Ready now!'}
          </div>
          <div className="mt-4 text-sm text-white/80">
            {statusSummary.to_be_selected} items still need to be selected
          </div>
        </div>

        <div className="rounded-2xl p-8 border border-[#D4A574]/60" style={{
          background: 'linear-gradient(135deg, #10B981FF 0%, #10B981AA 50%, #10B981FF 100%)',
          boxShadow: '0 0 30px #10B98160'
        }}>
          <div className="flex items-center gap-4 mb-4">
            <Calendar className="w-12 h-12 text-white" />
            <div>
              <h3 className="text-2xl font-bold text-white">Predicted Install Date</h3>
              <p className="text-sm text-white/80">When all items will be delivered and ready to install</p>
            </div>
          </div>
          <div className="text-4xl font-bold text-white mb-2">
            {predictedInstallDate?.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </div>
          <div className="text-lg text-white">
            {daysToInstall > 0 ? `${daysToInstall} days from now` : 'Ready to install!'}
          </div>
          <div className="mt-4 text-sm text-white/80">
            {statusSummary.delivered + statusSummary.installed} of {statusSummary.total} items delivered
          </div>
        </div>
      </div>

      {/* VISUAL TIMELINE */}
      <div className="rounded-2xl p-8 border border-[#D4A574]/60 mb-8" style={{
        background: 'linear-gradient(135deg, rgba(0,0,0,0.95) 0%, rgba(30,30,30,0.9) 50%, rgba(0,0,0,0.95) 100%)'
      }}>
        <h3 className="text-2xl font-bold text-[#D4A574] mb-6">📊 Project Progress</h3>
        
        <div className="relative h-24 mb-8">
          {/* Timeline Bar */}
          <div className="absolute top-1/2 left-0 right-0 h-2 bg-gray-700 rounded-full transform -translate-y-1/2"></div>
          
          {/* Today Marker */}
          <div className="absolute top-1/2 transform -translate-y-1/2" style={{ left: '10%' }}>
            <div className="w-4 h-4 bg-yellow-400 rounded-full"></div>
            <div className="text-xs text-yellow-400 mt-2 whitespace-nowrap">TODAY</div>
          </div>
          
          {/* Presentation Date Marker */}
          <div className="absolute top-1/2 transform -translate-y-1/2" style={{ left: '45%' }}>
            <div className="w-4 h-4 bg-purple-500 rounded-full"></div>
            <div className="text-xs text-purple-400 mt-2 whitespace-nowrap">PRESENTATION</div>
            <div className="text-xs text-gray-400 whitespace-nowrap">{daysToPresentation}d</div>
          </div>
          
          {/* Install Date Marker */}
          <div className="absolute top-1/2 transform -translate-y-1/2" style={{ left: '80%' }}>
            <div className="w-4 h-4 bg-green-500 rounded-full"></div>
            <div className="text-xs text-green-400 mt-2 whitespace-nowrap">INSTALL</div>
            <div className="text-xs text-gray-400 whitespace-nowrap">{daysToInstall}d</div>
          </div>
        </div>

        {/* Status Progress Bars */}
        <div className="grid grid-cols-5 gap-4">
          <div>
            <div className="text-sm text-[#B49B7E] mb-2">To Select</div>
            <div className="text-2xl font-bold text-white">{statusSummary.to_be_selected}</div>
          </div>
          <div>
            <div className="text-sm text-[#B49B7E] mb-2">Ordered</div>
            <div className="text-2xl font-bold text-blue-400">{statusSummary.ordered}</div>
          </div>
          <div>
            <div className="text-sm text-[#B49B7E] mb-2">In Transit</div>
            <div className="text-2xl font-bold text-yellow-400">{statusSummary.in_transit}</div>
          </div>
          <div>
            <div className="text-sm text-[#B49B7E] mb-2">Delivered</div>
            <div className="text-2xl font-bold text-purple-400">{statusSummary.delivered}</div>
          </div>
          <div>
            <div className="text-sm text-[#B49B7E] mb-2">Installed</div>
            <div className="text-2xl font-bold text-green-400">{statusSummary.installed}</div>
          </div>
        </div>
      </div>

      {/* CRITICAL PATH ITEMS */}
      <div className="rounded-2xl border border-[#D4A574]/60 overflow-hidden" style={{
        background: 'linear-gradient(135deg, rgba(0,0,0,0.95) 0%, rgba(30,30,30,0.9) 50%, rgba(0,0,0,0.95) 100%)'
      }}>
        <div className="p-6 border-b border-[#D4A574]/60 flex items-center gap-4">
          <AlertCircle className="w-8 h-8 text-red-400" />
          <div>
            <h3 className="text-2xl font-bold text-[#D4A574]">⚠️ Critical Path Items</h3>
            <p className="text-sm text-[#B49B7E]">Items that could delay your installation</p>
          </div>
        </div>
        
        {criticalPathItems.length === 0 ? (
          <div className="p-8 text-center">
            <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
            <div className="text-xl text-green-400 font-bold">All items on track! 🎉</div>
            <div className="text-sm text-[#B49B7E] mt-2">No critical delays detected</div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{
                  background: 'linear-gradient(135deg, #EF4444FF 0%, #EF4444AA 50%, #EF4444FF 100%)'
                }}>
                  <th className="px-6 py-4 text-left text-sm font-bold text-white">ITEM</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-white">ROOM</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-white">REASON</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-white">DAYS DELAYED</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-white">EXPECTED</th>
                </tr>
              </thead>
              <tbody>
                {criticalPathItems.map((item, index) => (
                  <tr key={item.id} style={{
                    background: index % 2 === 0 
                      ? 'linear-gradient(135deg, rgba(0, 0, 0, 0.95) 0%, rgba(30, 30, 30, 0.9) 50%, rgba(0, 0, 0, 0.95) 100%)'
                      : 'linear-gradient(135deg, rgba(15, 15, 25, 0.95) 0%, rgba(45, 45, 55, 0.9) 50%, rgba(15, 15, 25, 0.95) 100%)'
                  }}>
                    <td className="px-6 py-4 text-[#D4A574] font-semibold border-b border-[#D4A574]/30">{item.name}</td>
                    <td className="px-6 py-4 text-white border-b border-[#D4A574]/30">{item.room_name}</td>
                    <td className="px-6 py-4 text-red-400 border-b border-[#D4A574]/30">{item.reason}</td>
                    <td className="px-6 py-4 text-yellow-400 font-bold border-b border-[#D4A574]/30">{item.days_delayed}d</td>
                    <td className="px-6 py-4 text-white border-b border-[#D4A574]/30">{item.expected_arrival || 'TBD'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default InstallationCalendar;
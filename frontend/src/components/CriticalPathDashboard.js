import React, { useState, useEffect } from 'react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || window.location.origin;

const VENDOR_ORDER_URLS = {
  'Four Hands': 'https://fourhands.com/account/orders',
  'Rowe Furniture': 'https://rowefurniture.com/reports/order_status',
  'Visual Comfort': 'https://www.visualcomfort.com/orderview/orders/history/',
  'Uttermost': 'https://uttermost.com/account-dashboard/my-orders?page=1&perPage=10',
  'Regina Andrew': 'https://www.reginaandrew.com/app/my_account.ssp?fragment=overview#/purchases',
  'Loloi Rugs': 'https://www.loloirugs.com/account?view=order-history',
  'V&H': 'https://vandh.com/#/orders',
  'Crestview Collection': 'https://www.crestviewcollection.com/account-dashboard/my-orders',
  'Bassett Mirror': 'https://www.bassettmirror.com/customers/open_orders.cfm',
  'Safavieh': 'https://safavieh.com/my-orders',
  'York Wallcoverings': 'https://www.yorkwall.com/OrderHistory/Index',
  'Classic Home': 'https://www.classichome.com/pages/account-orders',
};

export default function CriticalPathDashboard({ projectId }) {
  const [project, setProject] = useState(null);
  const [orderedItems, setOrderedItems] = useState([]);
  const [groupedByVendor, setGroupedByVendor] = useState({});
  
  useEffect(() => {
    loadProject();
  }, [projectId]);
  
  const loadProject = async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/projects/${projectId}?sheet_type=ffe`);
      setProject(response.data);
      
      const ordered = [];
      response.data.rooms?.forEach(room => {
        room.categories?.forEach(cat => {
          cat.subcategories?.forEach(subcat => {
            subcat.items?.forEach(item => {
              if (['ORDERED', 'SHIPPED', 'IN TRANSIT', 'DELIVERED'].includes(item.status)) {
                ordered.push({ ...item, room_name: room.name });
              }
            });
          });
        });
      });
      
      setOrderedItems(ordered);
      
      const byVendor = {};
      ordered.forEach(item => {
        const vendor = item.vendor || 'Unknown';
        if (!byVendor[vendor]) byVendor[vendor] = [];
        byVendor[vendor].push(item);
      });
      setGroupedByVendor(byVendor);
      
    } catch (error) {
      console.error('Failed to load project:', error);
    }
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0F172A] via-[#1E293B] to-[#0F172A] p-6">
      <div className="bg-gradient-to-r from-[#1E293B] via-[#0F172A] to-[#1E293B] p-6 border-b-4 border-[#D4A574] shadow-2xl relative overflow-hidden mb-6">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#D4A574]/10 to-transparent opacity-50"></div>
        <div className="relative z-10">
          <h1 className="text-4xl font-bold text-[#D4A574] drop-shadow-lg">📊 CRITICAL PATH & ORDER TRACKING</h1>
          <p className="text-[#D4C5A9] text-lg mt-2">Track all ordered items and vendor deliveries</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="bg-gradient-to-br from-gray-900 to-black rounded-xl p-6 border-2 border-[#D4A574]/30">
          <h3 className="text-[#D4A574] font-bold text-xl mb-2">Total Items Ordered</h3>
          <div className="text-5xl font-bold text-[#D4C5A9]">{orderedItems.length}</div>
        </div>
        
        <div className="bg-gradient-to-br from-gray-900 to-black rounded-xl p-6 border-2 border-green-500/30">
          <h3 className="text-green-400 font-bold text-xl mb-2">Delivered</h3>
          <div className="text-5xl font-bold text-green-300">
            {orderedItems.filter(i => i.status === 'DELIVERED').length}
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-gray-900 to-black rounded-xl p-6 border-2 border-orange-500/30">
          <h3 className="text-orange-400 font-bold text-xl mb-2">In Transit</h3>
          <div className="text-5xl font-bold text-orange-300">
            {orderedItems.filter(i => ['SHIPPED', 'IN TRANSIT'].includes(i.status)).length}
          </div>
        </div>
      </div>
      
      <div className="space-y-6">
        {Object.keys(groupedByVendor).map(vendor => (
          <div key={vendor} className="bg-gradient-to-br from-gray-900 to-black rounded-xl p-6 border-2 border-[#D4A574]/30">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-[#D4A574]">{vendor}</h2>
              {VENDOR_ORDER_URLS[vendor] && (
                <a
                  href={VENDOR_ORDER_URLS[vendor]}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-6 py-3 bg-gradient-to-r from-[#D4A574] to-[#BCA888] hover:from-[#E4B584] hover:to-[#C49564] text-black rounded-lg font-bold"
                >
                  🔗 View {vendor} Orders
                </a>
              )}
            </div>
            
            <div className="space-y-3">
              {groupedByVendor[vendor].map((item, idx) => (
                <div key={idx} className="bg-gray-800 rounded-lg p-4 border border-[#D4A574]/20">
                  <div className="grid grid-cols-5 gap-4">
                    <div>
                      <div className="text-sm text-gray-400">Item</div>
                      <div className="text-[#D4C5A9] font-semibold">{item.name}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-400">Room</div>
                      <div className="text-[#D4C5A9]">{item.room_name}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-400">Status</div>
                      <div className="text-[#D4A574] font-semibold">{item.status}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-400">Tracking</div>
                      <div className="text-[#D4C5A9]">{item.tracking_number || 'N/A'}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-400">Carrier</div>
                      <div className="text-[#D4C5A9]">{item.carrier || 'N/A'}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

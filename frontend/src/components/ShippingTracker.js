import React, { useState, useEffect } from 'react';

const API_URL = (window.ENV?.REACT_APP_BACKEND_URL || window.location.origin) + '/api';

/**
 * ShippingTracker - Real-time shipping status tracking for FFE items
 * Shows all items with tracking info, grouped by status
 */
export default function ShippingTracker({ projectId }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [selectedItem, setSelectedItem] = useState(null);

  useEffect(() => {
    loadTrackingItems();
    
    // Poll for updates every 30 seconds
    const interval = setInterval(loadTrackingItems, 30000);
    return () => clearInterval(interval);
  }, [projectId]);

  const loadTrackingItems = async () => {
    try {
      const response = await fetch(`${API_URL}/items/with-tracking/${projectId}`);
      if (response.ok) {
        const data = await response.json();
        setItems(data.items || []);
      }
    } catch (error) {
      console.error('Failed to load tracking items:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      ordered: 'bg-blue-600',
      shipped: 'bg-cyan-600',
      in_transit: 'bg-yellow-600',
      out_for_delivery: 'bg-orange-600',
      delivered: 'bg-green-600',
      exception: 'bg-red-600'
    };
    return colors[status] || 'bg-gray-600';
  };

  const getStatusIcon = (status) => {
    const icons = {
      ordered: '📦',
      shipped: '🚚',
      in_transit: '🛣️',
      out_for_delivery: '📬',
      delivered: '✅',
      exception: '⚠️'
    };
    return icons[status] || '📦';
  };

  const getCarrierLogo = (carrier) => {
    const logos = {
      'FedEx': '🟠',
      'UPS': '🟤',
      'USPS': '🔵',
      'DHL': '🟡',
      'Zenith': '🟢',
      'Brooks': '🔷',
      'Sunbelt': '🔴'
    };
    return logos[carrier] || '📦';
  };

  // Carrier tracking URLs - for clickable tracking links
  const getTrackingUrl = (carrier, trackingNumber) => {
    // Handle special Zenith format - if tracking number contains full URL or lookup ID
    if (carrier === 'Zenith' || carrier?.toLowerCase()?.includes('zenith')) {
      // If it's already a full URL, use it directly
      if (trackingNumber?.startsWith('http')) {
        return trackingNumber;
      }
      // If it looks like a Zenith tracking ID (SHP...), construct the URL
      // Zenith uses format: https://secure.zenithcompanies.com/tracking/{uuid}/lookup/{trackingNumber}
      // Since we don't have the UUID, we'll use a search-style URL
      return `https://secure.zenithcompanies.com/tracking/?search=${trackingNumber}`;
    }
    
    const trackingUrls = {
      'FedEx': `https://www.fedex.com/apps/fedextrack/?tracknumbers=${trackingNumber}`,
      'UPS': `https://www.ups.com/track?tracknum=${trackingNumber}`,
      'USPS': `https://tools.usps.com/go/TrackConfirmAction?tLabels=${trackingNumber}`,
      'DHL': `https://www.dhl.com/us-en/home/tracking.html?tracking-id=${trackingNumber}`,
      'Brooks': `https://www.brooksdelivery.com/track/${trackingNumber}`,
      'Sunbelt': `https://sunbeltdelivery.com/track/${trackingNumber}`,
      'R+L Carriers': `https://www.rlcarriers.com/tracking/${trackingNumber}`,
      'XPO Logistics': `https://www.xpo.com/tracking/${trackingNumber}`,
      'Old Dominion': `https://www.odfl.com/Freight-Tracking/${trackingNumber}`,
      'Estes Express': `https://www.estes-express.com/resources/shipment-tracking?search=${trackingNumber}`,
      'Saia LTL': `https://www.saia.com/track/${trackingNumber}`,
    };
    return trackingUrls[carrier] || null;
  };

  const filteredItems = filter === 'all' 
    ? items 
    : items.filter(item => item.shipping?.status === filter);

  const statusCounts = {
    all: items.length,
    ordered: items.filter(i => i.shipping?.status === 'ordered').length,
    shipped: items.filter(i => i.shipping?.status === 'shipped').length,
    in_transit: items.filter(i => i.shipping?.status === 'in_transit').length,
    delivered: items.filter(i => i.shipping?.status === 'delivered').length,
    exception: items.filter(i => i.shipping?.status === 'exception').length
  };

  return (
    <div className="rounded-xl border border-[#D4A574]/30 overflow-hidden"
         style={{ background: 'linear-gradient(135deg, rgba(20,20,30,0.95) 0%, rgba(30,30,40,0.9) 100%)' }}>
      
      {/* Header */}
      <div 
        className="px-6 py-4 border-b border-[#B49B7E]/20"
        style={{ background: 'linear-gradient(135deg, rgba(212, 165, 116, 0.15) 0%, rgba(180, 155, 126, 0.1) 100%)' }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">📦</span>
            <div>
              <h3 className="text-[#D4A574] font-bold text-lg">Shipping & Tracking</h3>
              <p className="text-gray-500 text-sm">
                {items.length} items being tracked
              </p>
            </div>
          </div>
          <button
            onClick={loadTrackingItems}
            className="text-[#D4A574] hover:text-[#B49B7E] text-sm flex items-center gap-1"
          >
            🔄 Refresh
          </button>
        </div>
      </div>
      
      {/* Status Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 p-4 border-b border-[#B49B7E]/20">
        <div 
          className={`p-3 rounded-lg cursor-pointer transition-all ${filter === 'ordered' ? 'ring-2 ring-[#D4A574]' : ''}`}
          style={{ background: 'rgba(59, 130, 246, 0.2)' }}
          onClick={() => setFilter(filter === 'ordered' ? 'all' : 'ordered')}
        >
          <div className="flex items-center gap-2">
            <span>📝</span>
            <span className="text-blue-400 font-bold text-xl">{statusCounts.ordered}</span>
          </div>
          <p className="text-gray-400 text-xs mt-1">Ordered</p>
        </div>
        
        <div 
          className={`p-3 rounded-lg cursor-pointer transition-all ${filter === 'shipped' ? 'ring-2 ring-[#D4A574]' : ''}`}
          style={{ background: 'rgba(6, 182, 212, 0.2)' }}
          onClick={() => setFilter(filter === 'shipped' ? 'all' : 'shipped')}
        >
          <div className="flex items-center gap-2">
            <span>🚚</span>
            <span className="text-cyan-400 font-bold text-xl">{statusCounts.shipped}</span>
          </div>
          <p className="text-gray-400 text-xs mt-1">Shipped</p>
        </div>
        
        <div 
          className={`p-3 rounded-lg cursor-pointer transition-all ${filter === 'in_transit' ? 'ring-2 ring-[#D4A574]' : ''}`}
          style={{ background: 'rgba(234, 179, 8, 0.2)' }}
          onClick={() => setFilter(filter === 'in_transit' ? 'all' : 'in_transit')}
        >
          <div className="flex items-center gap-2">
            <span>🛣️</span>
            <span className="text-yellow-400 font-bold text-xl">{statusCounts.in_transit}</span>
          </div>
          <p className="text-gray-400 text-xs mt-1">In Transit</p>
        </div>
        
        <div 
          className={`p-3 rounded-lg cursor-pointer transition-all ${filter === 'delivered' ? 'ring-2 ring-[#D4A574]' : ''}`}
          style={{ background: 'rgba(34, 197, 94, 0.2)' }}
          onClick={() => setFilter(filter === 'delivered' ? 'all' : 'delivered')}
        >
          <div className="flex items-center gap-2">
            <span>✅</span>
            <span className="text-green-400 font-bold text-xl">{statusCounts.delivered}</span>
          </div>
          <p className="text-gray-400 text-xs mt-1">Delivered</p>
        </div>
        
        <div 
          className={`p-3 rounded-lg cursor-pointer transition-all ${filter === 'exception' ? 'ring-2 ring-[#D4A574]' : ''}`}
          style={{ background: 'rgba(239, 68, 68, 0.2)' }}
          onClick={() => setFilter(filter === 'exception' ? 'all' : 'exception')}
        >
          <div className="flex items-center gap-2">
            <span>⚠️</span>
            <span className="text-red-400 font-bold text-xl">{statusCounts.exception}</span>
          </div>
          <p className="text-gray-400 text-xs mt-1">Exception</p>
        </div>
      </div>
      
      {/* Items List */}
      <div className="max-h-96 overflow-y-auto divide-y divide-[#B49B7E]/10">
        {loading ? (
          <p className="p-8 text-center text-gray-500">Loading tracking data...</p>
        ) : filteredItems.length === 0 ? (
          <p className="p-8 text-center text-gray-500">
            No items with tracking info found.
          </p>
        ) : (
          filteredItems.map(item => (
            <div 
              key={item.id}
              className="p-4 hover:bg-black/20 cursor-pointer transition-colors"
              onClick={() => setSelectedItem(selectedItem?.id === item.id ? null : item)}
            >
              <div className="flex items-center gap-4">
                {/* Status Badge */}
                <div className={`w-10 h-10 rounded-full ${getStatusColor(item.shipping?.status)} flex items-center justify-center text-white text-lg`}>
                  {getStatusIcon(item.shipping?.status)}
                </div>
                
                {/* Item Info */}
                <div className="flex-1 min-w-0">
                  <h4 className="text-white font-medium truncate">{item.name}</h4>
                  <div className="flex items-center gap-3 text-sm text-gray-400 mt-1">
                    <span className="flex items-center gap-1">
                      {getCarrierLogo(item.shipping?.carrier)} {item.shipping?.carrier}
                    </span>
                    {item.shipping?.tracking_number && (
                      getTrackingUrl(item.shipping?.carrier, item.shipping?.tracking_number) ? (
                        <a 
                          href={getTrackingUrl(item.shipping?.carrier, item.shipping?.tracking_number)}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="font-mono text-xs text-[#D4A574] hover:text-[#E5B585] underline"
                        >
                          {item.shipping?.tracking_number}
                        </a>
                      ) : (
                        <span className="font-mono text-xs">
                          {item.shipping?.tracking_number}
                        </span>
                      )
                    )}
                  </div>
                </div>
                
                {/* Estimated Delivery */}
                {item.shipping?.estimated_delivery && (
                  <div className="text-right">
                    <p className="text-xs text-gray-500">Est. Delivery</p>
                    <p className="text-[#D4A574] font-medium">
                      {new Date(item.shipping.estimated_delivery).toLocaleDateString()}
                    </p>
                  </div>
                )}
                
                {/* Expand Arrow */}
                <span className="text-gray-500">
                  {selectedItem?.id === item.id ? '▼' : '▶'}
                </span>
              </div>
              
              {/* Expanded Details */}
              {selectedItem?.id === item.id && item.shipping?.events?.length > 0 && (
                <div className="mt-4 ml-14 pl-4 border-l-2 border-[#B49B7E]/30">
                  <h5 className="text-[#D4A574] text-sm font-medium mb-3">Tracking History</h5>
                  <div className="space-y-3">
                    {item.shipping.events.map((event, idx) => (
                      <div key={idx} className="flex items-start gap-3">
                        <div className={`w-2 h-2 rounded-full mt-2 ${idx === 0 ? 'bg-[#D4A574]' : 'bg-gray-600'}`} />
                        <div>
                          <p className="text-white text-sm">{event.description}</p>
                          <p className="text-gray-500 text-xs">
                            {event.location && `${event.location} • `}
                            {event.timestamp && new Date(event.timestamp).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
      
      {/* Legend / Help */}
      <div className="px-4 py-3 border-t border-[#B49B7E]/20 bg-black/30">
        <p className="text-gray-500 text-xs text-center">
          Click on an item to view tracking history • Auto-refreshes every 30 seconds
        </p>
      </div>
    </div>
  );
}

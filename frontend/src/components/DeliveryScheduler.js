import React, { useState, useEffect } from 'react';
import { Truck, Calendar, Clock, MapPin, Package, X, Plus, Check, AlertTriangle } from 'lucide-react';

const DeliveryScheduler = ({ project, onClose, onUpdate, embedded = false }) => {
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newDelivery, setNewDelivery] = useState({
    vendor: '',
    scheduled_date: '',
    time_window: 'morning',
    location: 'job_site',
    items: [],
    notes: ''
  });
  const [pendingItems, setPendingItems] = useState([]);

  useEffect(() => {
    loadDeliveries();
    loadPendingItems();
  }, [project?.id]);

  const loadDeliveries = async () => {
    try {
      const BACKEND_URL = window.ENV?.REACT_APP_BACKEND_URL || window.location.origin;
      const response = await fetch(`${BACKEND_URL}/api/deliveries/${project.id}`);
      if (response.ok) {
        const data = await response.json();
        setDeliveries(data.deliveries || []);
      }
    } catch (error) {
      console.error('Error loading deliveries:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadPendingItems = async () => {
    // Extract items from project that are ordered but not delivered
    const items = [];
    project?.rooms?.forEach(room => {
      room.categories?.forEach(category => {
        category.subcategories?.forEach(subcategory => {
          subcategory.items?.forEach(item => {
            const status = (item.status || '').toUpperCase();
            if (['ORDERED', 'SHIPPED', 'IN TRANSIT', 'IN PRODUCTION'].includes(status)) {
              items.push({
                ...item,
                room_name: room.name,
                category_name: category.name
              });
            }
          });
        });
      });
    });
    setPendingItems(items);
  };

  const handleAddDelivery = async () => {
    try {
      const BACKEND_URL = window.ENV?.REACT_APP_BACKEND_URL || window.location.origin;
      const response = await fetch(`${BACKEND_URL}/api/deliveries`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_id: project.id,
          ...newDelivery
        })
      });

      if (response.ok) {
        loadDeliveries();
        setShowAddForm(false);
        setNewDelivery({
          vendor: '',
          scheduled_date: '',
          time_window: 'morning',
          location: 'job_site',
          items: [],
          notes: ''
        });
      }
    } catch (error) {
      console.error('Error adding delivery:', error);
    }
  };

  const updateDeliveryStatus = async (deliveryId, status) => {
    try {
      const BACKEND_URL = window.ENV?.REACT_APP_BACKEND_URL || window.location.origin;
      await fetch(`${BACKEND_URL}/api/deliveries/${deliveryId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      loadDeliveries();
    } catch (error) {
      console.error('Error updating delivery:', error);
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'scheduled': return 'bg-blue-500';
      case 'in_transit': return 'bg-yellow-500';
      case 'delivered': return 'bg-green-500';
      case 'delayed': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getTimeWindowLabel = (tw) => {
    switch (tw) {
      case 'morning': return '8 AM - 12 PM';
      case 'afternoon': return '12 PM - 5 PM';
      case 'evening': return '5 PM - 8 PM';
      case 'all_day': return 'All Day';
      default: return tw;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl w-full max-w-4xl max-h-[90vh] overflow-hidden border border-[#D4A574]/30">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#D4A574]/30 flex justify-between items-center"
             style={{ background: 'linear-gradient(135deg, rgba(212, 165, 116, 0.15) 0%, rgba(180, 155, 126, 0.1) 100%)' }}>
          <div className="flex items-center gap-3">
            <Truck className="w-6 h-6 text-[#D4A574]" />
            <div>
              <h2 className="text-xl font-bold text-[#D4A574]">Delivery Scheduler</h2>
              <p className="text-sm text-[#B49B7E]">{pendingItems.length} items awaiting delivery</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowAddForm(true)}
              className="px-4 py-2 bg-[#D4A574] hover:bg-[#B49B7E] text-white rounded-lg flex items-center gap-2 text-sm font-medium"
            >
              <Plus className="w-4 h-4" />
              Schedule Delivery
            </button>
            <button onClick={onClose} className="text-gray-400 hover:text-white">
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 120px)' }}>
          {/* Upcoming Deliveries */}
          <div className="mb-6">
            <h3 className="text-[#D4A574] font-bold mb-4">Scheduled Deliveries</h3>
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin w-8 h-8 border-2 border-[#D4A574] border-t-transparent rounded-full mx-auto"></div>
              </div>
            ) : deliveries.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <Truck className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No deliveries scheduled yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {deliveries.map((delivery, idx) => (
                  <div key={delivery.id || idx} className="bg-slate-800/50 rounded-lg p-4 border border-[#B49B7E]/20">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded text-xs font-medium text-white ${getStatusColor(delivery.status)}`}>
                            {delivery.status?.toUpperCase() || 'SCHEDULED'}
                          </span>
                          <span className="text-white font-medium">{delivery.vendor}</span>
                        </div>
                        <div className="flex items-center gap-4 mt-2 text-sm text-gray-400">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {new Date(delivery.scheduled_date).toLocaleDateString()}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {getTimeWindowLabel(delivery.time_window)}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            {delivery.location === 'job_site' ? 'Job Site' : 'Receiver'}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {delivery.status !== 'delivered' && (
                          <>
                            <button
                              onClick={() => updateDeliveryStatus(delivery.id, 'in_transit')}
                              className="px-2 py-1 text-xs bg-yellow-600 hover:bg-yellow-500 text-white rounded"
                            >
                              In Transit
                            </button>
                            <button
                              onClick={() => updateDeliveryStatus(delivery.id, 'delivered')}
                              className="px-2 py-1 text-xs bg-green-600 hover:bg-green-500 text-white rounded"
                            >
                              Delivered
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                    {delivery.items?.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-slate-700">
                        <div className="text-xs text-gray-400 mb-1">{delivery.items.length} items:</div>
                        <div className="flex flex-wrap gap-1">
                          {delivery.items.slice(0, 5).map((item, i) => (
                            <span key={i} className="px-2 py-0.5 bg-slate-700 rounded text-xs text-white">
                              {item.name || item}
                            </span>
                          ))}
                          {delivery.items.length > 5 && (
                            <span className="px-2 py-0.5 text-xs text-gray-400">+{delivery.items.length - 5} more</span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Pending Items */}
          <div>
            <h3 className="text-[#D4A574] font-bold mb-4 flex items-center gap-2">
              <Package className="w-5 h-5" />
              Items Awaiting Delivery ({pendingItems.length})
            </h3>
            {pendingItems.length === 0 ? (
              <div className="text-center py-6 text-gray-400">
                <Check className="w-10 h-10 mx-auto mb-2 text-green-400" />
                <p>All ordered items have been delivered!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {pendingItems.slice(0, 10).map((item, idx) => (
                  <div key={item.id || idx} className="bg-slate-800/30 rounded p-3 border border-slate-700">
                    <div className="text-white text-sm font-medium truncate">{item.name}</div>
                    <div className="text-xs text-gray-400 mt-1">
                      {item.room_name} • {item.vendor || 'No vendor'}
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs px-2 py-0.5 bg-yellow-600/30 text-yellow-400 rounded">
                        {item.status}
                      </span>
                      {item.estimated_delivery_date && (
                        <span className="text-xs text-gray-400">
                          ETA: {new Date(item.estimated_delivery_date).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
                {pendingItems.length > 10 && (
                  <div className="text-gray-400 text-sm p-3">
                    +{pendingItems.length - 10} more items...
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Add Delivery Form Modal */}
        {showAddForm && (
          <div className="absolute inset-0 bg-black/80 flex items-center justify-center p-4">
            <div className="bg-slate-800 rounded-lg p-6 w-full max-w-md border border-[#D4A574]/30">
              <h3 className="text-[#D4A574] font-bold mb-4">Schedule New Delivery</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-gray-400 block mb-1">Vendor</label>
                  <input
                    type="text"
                    value={newDelivery.vendor}
                    onChange={(e) => setNewDelivery({...newDelivery, vendor: e.target.value})}
                    className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white"
                    placeholder="e.g., Four Hands, Uttermost"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm text-gray-400 block mb-1">Date</label>
                    <input
                      type="date"
                      value={newDelivery.scheduled_date}
                      onChange={(e) => setNewDelivery({...newDelivery, scheduled_date: e.target.value})}
                      className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-400 block mb-1">Time Window</label>
                    <select
                      value={newDelivery.time_window}
                      onChange={(e) => setNewDelivery({...newDelivery, time_window: e.target.value})}
                      className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white"
                    >
                      <option value="morning">Morning (8 AM - 12 PM)</option>
                      <option value="afternoon">Afternoon (12 PM - 5 PM)</option>
                      <option value="evening">Evening (5 PM - 8 PM)</option>
                      <option value="all_day">All Day</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-sm text-gray-400 block mb-1">Delivery Location</label>
                  <select
                    value={newDelivery.location}
                    onChange={(e) => setNewDelivery({...newDelivery, location: e.target.value})}
                    className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white"
                  >
                    <option value="job_site">Job Site</option>
                    <option value="receiver">Receiver/Warehouse</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm text-gray-400 block mb-1">Notes</label>
                  <textarea
                    value={newDelivery.notes}
                    onChange={(e) => setNewDelivery({...newDelivery, notes: e.target.value})}
                    className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white"
                    rows={2}
                    placeholder="Gate code, contact info, special instructions..."
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowAddForm(false)}
                  className="flex-1 py-2 bg-slate-600 hover:bg-slate-500 text-white rounded"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddDelivery}
                  disabled={!newDelivery.vendor || !newDelivery.scheduled_date}
                  className="flex-1 py-2 bg-[#D4A574] hover:bg-[#B49B7E] text-white rounded disabled:opacity-50"
                >
                  Schedule
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DeliveryScheduler;

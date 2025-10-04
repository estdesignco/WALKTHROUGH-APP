import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL + '/api';

export default function MobileFFESpreadsheet({ projectId }) {
  const [project, setProject] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [expandedRoom, setExpandedRoom] = useState(null);
  const [expandedCategory, setExpandedCategory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingUpdates, setPendingUpdates] = useState([]);
  const [syncing, setSyncing] = useState(false);

  const statuses = ['PICKED', 'ORDERED', 'SHIPPED', 'DELIVERED TO RECEIVER', 'DELIVERED TO JOB SITE', 'INSTALLED'];
  const carriers = ['FedEx', 'UPS', 'USPS', 'DHL', 'Other'];

  useEffect(() => {
    // Monitor online/offline status
    const handleOnline = () => {
      setIsOnline(true);
      syncPendingUpdates();
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    loadProject();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [projectId]);

  const loadProject = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/projects/${projectId}?sheet_type=ffe`);
      setProject(response.data);
      setRooms(response.data.rooms || []);
      
      // Cache data for offline use
      localStorage.setItem(`ffe_project_${projectId}`, JSON.stringify(response.data));
    } catch (error) {
      console.error('Failed to load FFE:', error);
      
      // Load from cache if offline
      const cached = localStorage.getItem(`ffe_project_${projectId}`);
      if (cached) {
        const cachedData = JSON.parse(cached);
        setProject(cachedData);
        setRooms(cachedData.rooms || []);
      }
    } finally {
      setLoading(false);
    }
  };

  const syncPendingUpdates = async () => {
    if (pendingUpdates.length === 0) return;
    
    setSyncing(true);
    const updates = [...pendingUpdates];
    
    for (const update of updates) {
      try {
        await axios.put(`${API_URL}/items/${update.itemId}`, update.data);
        // Remove from pending
        setPendingUpdates(prev => prev.filter(u => u.id !== update.id));
      } catch (error) {
        console.error('Sync failed:', error);
      }
    }
    
    setSyncing(false);
    await loadProject();
  };

  const updateItem = async (itemId, data) => {
    // Optimistic update - update UI immediately
    setRooms(prev => {
      return prev.map(room => ({
        ...room,
        categories: room.categories?.map(cat => ({
          ...cat,
          subcategories: cat.subcategories?.map(sub => ({
            ...sub,
            items: sub.items?.map(item => 
              item.id === itemId ? { ...item, ...data } : item
            )
          }))
        }))
      }));
    });

    if (isOnline) {
      try {
        await axios.put(`${API_URL}/items/${itemId}`, data);
      } catch (error) {
        console.error('Update failed:', error);
        // Queue for later sync
        setPendingUpdates(prev => [...prev, {
          id: Date.now(),
          itemId,
          data
        }]);
      }
    } else {
      // Offline - queue for sync
      setPendingUpdates(prev => [...prev, {
        id: Date.now(),
        itemId,
        data
      }]);
    }
  };

  const toggleRoom = (roomId) => {
    setExpandedRoom(expandedRoom === roomId ? null : roomId);
    setExpandedCategory(null);
  };

  const toggleCategory = (categoryId) => {
    setExpandedCategory(expandedCategory === categoryId ? null : categoryId);
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-gradient-to-b from-black via-[#0F0F0F] to-[#1a1a2e]">
        <div className="text-[#D4C5A9]">Loading FFE...</div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto bg-gradient-to-b from-black via-[#0F0F0F] to-[#1a1a2e]">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-[#0F0F0F] border-b-2 border-[#D4C5A9]/20 p-3">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-bold bg-gradient-to-r from-[#D4C5A9] to-[#BCA888] bg-clip-text text-transparent">
            {project?.name}
          </h2>
          <div className="flex items-center gap-2">
            {!isOnline && (
              <span className="text-xs text-orange-400 bg-orange-400/20 px-2 py-1 rounded">
                📡 Offline
              </span>
            )}
            {syncing && (
              <span className="text-xs text-blue-400 bg-blue-400/20 px-2 py-1 rounded">
                🔄 Syncing...
              </span>
            )}
            {pendingUpdates.length > 0 && (
              <span className="text-xs text-yellow-400 bg-yellow-400/20 px-2 py-1 rounded">
                ⏳ {pendingUpdates.length}
              </span>
            )}
          </div>
        </div>
        <p className="text-gray-400 text-xs">FF&E - Your Bible for Jobsites</p>
      </div>

      {/* Spreadsheet */}
      <div className="p-2">
        {rooms.map((room) => (
          <div key={room.id} className="mb-2">
            {/* Room Header */}
            <button
              onClick={() => toggleRoom(room.id)}
              className="w-full bg-gradient-to-r from-[#3a3a4a] to-[#2a2a3a] border-2 border-[#D4C5A9]/40 rounded-lg p-3 text-left"
              style={{ backgroundColor: room.color }}
            >
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{expandedRoom === room.id ? '▼' : '▶'}</span>
                  <span className="font-bold text-white text-sm">{room.name}</span>
                </div>
                <span className="text-xs text-gray-300">
                  {room.categories?.length || 0} categories
                </span>
              </div>
            </button>

            {/* Categories */}
            {expandedRoom === room.id && room.categories && (
              <div className="ml-4 mt-1 space-y-1">
                {room.categories.map((category) => (
                  <div key={category.id}>
                    {/* Category Header */}
                    <button
                      onClick={() => toggleCategory(category.id)}
                      className="w-full bg-gradient-to-r from-[#2a2a3a] to-[#1a1a2a] border-2 border-[#D4C5A9]/20 rounded-lg p-2 text-left"
                    >
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <span className="text-sm">{expandedCategory === category.id ? '▼' : '▶'}</span>
                          <span className="font-semibold text-[#D4C5A9] text-xs">{category.name}</span>
                        </div>
                        <span className="text-xs text-gray-400">
                          {category.subcategories?.reduce((sum, sub) => sum + (sub.items?.length || 0), 0) || 0} items
                        </span>
                      </div>
                    </button>

                    {/* Subcategories & Items */}
                    {expandedCategory === category.id && category.subcategories && (
                      <div className="ml-4 mt-1 space-y-2">
                        {category.subcategories.map((subcategory) => (
                          <div key={subcategory.id}>
                            <div className="text-xs text-[#D4C5A9] font-semibold mb-1 px-2">
                              {subcategory.name}
                            </div>
                            
                            {/* Items */}
                            {subcategory.items && subcategory.items.length > 0 ? (
                              <div className="space-y-1">
                                {subcategory.items.map((item) => (
                                  <div
                                    key={item.id}
                                    className="bg-[#1a1a2a]/80 border border-[#D4C5A9]/10 rounded-lg p-2"
                                  >
                                    {/* Item Name */}
                                    <div className="font-semibold text-white text-sm mb-2">
                                      {item.name}
                                    </div>

                                    {/* Image */}
                                    {item.image_url && (
                                      <div className="mb-2">
                                        <img 
                                          src={item.image_url} 
                                          alt={item.name}
                                          className="w-full h-24 object-cover rounded border border-[#D4C5A9]/20"
                                        />
                                      </div>
                                    )}

                                    {/* Item Details Grid */}
                                    <div className="space-y-1 text-xs">
                                      {/* SKU */}
                                      {item.sku && (
                                        <div className="flex justify-between">
                                          <span className="text-gray-400">SKU:</span>
                                          <span className="text-gray-300">{item.sku}</span>
                                        </div>
                                      )}

                                      {/* Vendor */}
                                      {item.vendor && (
                                        <div className="flex justify-between">
                                          <span className="text-gray-400">Vendor:</span>
                                          <span className="text-gray-300">{item.vendor}</span>
                                        </div>
                                      )}

                                      {/* Cost */}
                                      {item.cost && (
                                        <div className="flex justify-between">
                                          <span className="text-gray-400">Cost:</span>
                                          <span className="text-[#D4C5A9] font-semibold">${item.cost}</span>
                                        </div>
                                      )}

                                      {/* Status */}
                                      <div className="mt-2">
                                        <label className="text-gray-400 block mb-1">Status:</label>
                                        <select
                                          value={item.status || ''}
                                          onChange={(e) => updateItem(item.id, { status: e.target.value })}
                                          className="w-full bg-[#0a0a1a] border border-[#D4C5A9]/30 rounded px-2 py-1 text-white text-xs focus:outline-none focus:border-[#D4C5A9]"
                                        >
                                          <option value="">Select Status</option>
                                          {statuses.map(status => (
                                            <option key={status} value={status}>{status}</option>
                                          ))}
                                        </select>
                                      </div>

                                      {/* Carrier */}
                                      <div className="mt-2">
                                        <label className="text-gray-400 block mb-1">Carrier:</label>
                                        <select
                                          value={item.carrier || ''}
                                          onChange={(e) => updateItem(item.id, { carrier: e.target.value })}
                                          className="w-full bg-[#0a0a1a] border border-[#D4C5A9]/30 rounded px-2 py-1 text-white text-xs focus:outline-none focus:border-[#D4C5A9]"
                                        >
                                          <option value="">Select Carrier</option>
                                          {carriers.map(carrier => (
                                            <option key={carrier} value={carrier}>{carrier}</option>
                                          ))}
                                        </select>
                                      </div>

                                      {/* Tracking Number */}
                                      <div className="mt-2">
                                        <label className="text-gray-400 block mb-1">Tracking:</label>
                                        <input
                                          type="text"
                                          value={item.tracking_number || ''}
                                          onChange={(e) => updateItem(item.id, { tracking_number: e.target.value })}
                                          placeholder="Enter tracking number"
                                          className="w-full bg-[#0a0a1a] border border-[#D4C5A9]/30 rounded px-2 py-1 text-white text-xs focus:outline-none focus:border-[#D4C5A9]"
                                        />
                                      </div>

                                      {/* Order Date */}
                                      {item.order_date && (
                                        <div className="flex justify-between mt-2">
                                          <span className="text-gray-400">Ordered:</span>
                                          <span className="text-gray-300">{item.order_date}</span>
                                        </div>
                                      )}

                                      {/* Delivery Date */}
                                      {item.delivery_date && (
                                        <div className="flex justify-between">
                                          <span className="text-gray-400">Delivery:</span>
                                          <span className="text-gray-300">{item.delivery_date}</span>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="text-xs text-gray-500 px-2">No items in this category</div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}

        {rooms.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <p className="mb-2">No items in FF&E yet</p>
            <p className="text-xs">Items appear here after curation from Checklist</p>
          </div>
        )}
      </div>
    </div>
  );
}
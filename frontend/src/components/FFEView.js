import React, { useState, useEffect } from 'react';

const FFEView = ({ project }) => {
  const [items, setItems] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [showAddItem, setShowAddItem] = useState(false);
  const [newItem, setNewItem] = useState({ name: '', room: '', category: '', vendor: '', cost: '', status: 'SPECIFIED' });

  useEffect(() => {
    fetchFFEData();
  }, [project]);

  const fetchFFEData = async () => {
    if (!project?.id) return;
    
    setLoading(true);
    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/projects/${project.id}?sheet_type=ffe`);
      if (response.ok) {
        const data = await response.json();
        setItems(data.rooms || []);
      }
    } catch (error) {
      console.error('Error fetching FF&E data:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateItemStatus = async (itemId, newStatus) => {
    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/items/${itemId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus })
      });
      
      if (response.ok) {
        fetchFFEData();
      }
    } catch (error) {
      console.error('Error updating item status:', error);
    }
  };

  const addFFEItem = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/ffe-items`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          project_id: project.id,
          ...newItem
        })
      });
      
      if (response.ok) {
        setNewItem({ name: '', room: '', category: '', vendor: '', cost: '', status: 'SPECIFIED' });
        setShowAddItem(false);
        fetchFFEData();
      }
    } catch (error) {
      console.error('Error adding FF&E item:', error);
    }
  };

  const exportToExcel = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/projects/${project.id}/export-ffe`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${project.name}_FFE_Schedule.xlsx`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Error exporting to Excel:', error);
    }
  };

  const statusOptions = [
    'SPECIFIED',
    'SOURCED',
    'QUOTED',
    'APPROVED',
    'ORDERED',
    'IN_PRODUCTION',
    'SHIPPED',
    'DELIVERED',
    'INSTALLED'
  ];

  const getStatusColor = (status) => {
    const colors = {
      'SPECIFIED': 'bg-gray-600',
      'SOURCED': 'bg-blue-600',
      'QUOTED': 'bg-yellow-600',
      'APPROVED': 'bg-green-600',
      'ORDERED': 'bg-purple-600',
      'IN_PRODUCTION': 'bg-orange-600',
      'SHIPPED': 'bg-indigo-600',
      'DELIVERED': 'bg-pink-600',
      'INSTALLED': 'bg-emerald-600'
    };
    return colors[status] || 'bg-gray-600';
  };

  const getStatusBreakdown = () => {
    const breakdown = {};
    statusOptions.forEach(status => breakdown[status] = 0);
    
    items.forEach(room => {
      room.categories?.forEach(category => {
        category.subcategories?.forEach(item => {
          if (item.status) {
            breakdown[item.status] = (breakdown[item.status] || 0) + 1;
          }
        });
      });
    });
    
    return breakdown;
  };

  const statusBreakdown = getStatusBreakdown();
  const totalItems = Object.values(statusBreakdown).reduce((sum, count) => sum + count, 0);
  const installedItems = statusBreakdown['INSTALLED'] || 0;
  const progressPercentage = totalItems > 0 ? Math.round((installedItems / totalItems) * 100) : 0;

  const getTotalBudget = () => {
    let total = 0;
    items.forEach(room => {
      room.categories?.forEach(category => {
        category.subcategories?.forEach(item => {
          if (item.cost) {
            total += parseFloat(item.cost.replace(/[^0-9.-]+/g, '')) || 0;
          }
        });
      });
    });
    return total;
  };

  const totalBudget = getTotalBudget();

  return (
    <div className="bg-stone-900 rounded-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-white">FF&E Schedule - {project?.name}</h2>
        <div className="flex items-center space-x-4">
          <div className="text-right">
            <div className="text-lg font-bold text-white">${totalBudget.toLocaleString()}</div>
            <div className="text-sm text-stone-400">Total Budget</div>
          </div>
          <div className="text-right">
            <div className="text-lg font-bold text-white">{progressPercentage}%</div>
            <div className="text-sm text-stone-400">Installed</div>
          </div>
          <button
            onClick={exportToExcel}
            className="bg-green-700 hover:bg-green-600 text-white px-4 py-2 rounded transition-colors duration-200 flex items-center space-x-2"
          >
            <span>📊</span>
            <span>Export Excel</span>
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="w-full bg-stone-700 rounded-full h-3">
          <div 
            className="bg-gradient-to-r from-amber-500 to-amber-600 h-3 rounded-full transition-all duration-300"
            style={{ width: `${progressPercentage}%` }}
          ></div>
        </div>
        <div className="flex justify-between text-sm text-stone-400 mt-2">
          <span>{installedItems} of {totalItems} items installed</span>
          <span>{totalItems - installedItems} remaining</span>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="mb-6 space-y-4">
        <div className="flex flex-wrap gap-4">
          <input
            type="text"
            placeholder="Search FF&E items..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-4 py-2 bg-stone-800 border border-stone-700 rounded-lg text-white focus:outline-none focus:border-amber-500"
          />
          
          <select
            value={selectedRoom}
            onChange={(e) => setSelectedRoom(e.target.value)}
            className="px-4 py-2 bg-stone-800 border border-stone-700 rounded-lg text-white focus:outline-none focus:border-amber-500"
          >
            <option value="">All Rooms</option>
            {items.map(room => (
              <option key={room.id} value={room.name}>{room.name}</option>
            ))}
          </select>
          
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-4 py-2 bg-stone-800 border border-stone-700 rounded-lg text-white focus:outline-none focus:border-amber-500"
          >
            <option value="">All Statuses</option>
            {statusOptions.map(status => (
              <option key={status} value={status}>{status.replace('_', ' ')}</option>
            ))}
          </select>
          
          <button
            onClick={() => setShowAddItem(true)}
            className="bg-amber-700 hover:bg-amber-600 text-white px-4 py-2 rounded transition-colors duration-200 flex items-center space-x-2"
          >
            <span>+</span>
            <span>Add Item</span>
          </button>
        </div>
      </div>

      {/* Status Overview */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-white mb-4">Status Breakdown</h3>
        <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
          {statusOptions.map(status => (
            <div key={status} className="bg-stone-800 p-3 rounded-lg">
              <div className={`w-3 h-3 rounded-full ${getStatusColor(status)} mb-2`}></div>
              <div className="text-xs text-stone-400">{status.replace('_', ' ')}</div>
              <div className="text-lg font-bold text-white">{statusBreakdown[status]}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Add Item Modal */}
      {showAddItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-stone-800 p-6 rounded-lg w-96">
            <h3 className="text-lg font-bold text-white mb-4">Add FF&E Item</h3>
            
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Item Name"
                value={newItem.name}
                onChange={(e) => setNewItem({...newItem, name: e.target.value})}
                className="w-full p-2 bg-stone-700 border border-stone-600 rounded text-white"
              />
              
              <input
                type="text"
                placeholder="Room"
                value={newItem.room}
                onChange={(e) => setNewItem({...newItem, room: e.target.value})}
                className="w-full p-2 bg-stone-700 border border-stone-600 rounded text-white"
              />
              
              <input
                type="text"
                placeholder="Category"
                value={newItem.category}
                onChange={(e) => setNewItem({...newItem, category: e.target.value})}
                className="w-full p-2 bg-stone-700 border border-stone-600 rounded text-white"
              />
              
              <input
                type="text"
                placeholder="Vendor"
                value={newItem.vendor}
                onChange={(e) => setNewItem({...newItem, vendor: e.target.value})}
                className="w-full p-2 bg-stone-700 border border-stone-600 rounded text-white"
              />
              
              <input
                type="text"
                placeholder="Cost ($)"
                value={newItem.cost}
                onChange={(e) => setNewItem({...newItem, cost: e.target.value})}
                className="w-full p-2 bg-stone-700 border border-stone-600 rounded text-white"
              />
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowAddItem(false)}
                className="px-4 py-2 bg-stone-600 text-white rounded hover:bg-stone-500"
              >
                Cancel
              </button>
              
              <button
                onClick={addFFEItem}
                className="px-4 py-2 bg-amber-700 text-white rounded hover:bg-amber-600"
              >
                Add Item
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FF&E Items Table */}
      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500 mx-auto mb-4"></div>
          <p className="text-stone-400">Loading FF&E data...</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-stone-700">
                <th className="text-left py-3 px-4 text-stone-300 font-medium">Item</th>
                <th className="text-left py-3 px-4 text-stone-300 font-medium">Room</th>
                <th className="text-left py-3 px-4 text-stone-300 font-medium">Category</th>
                <th className="text-left py-3 px-4 text-stone-300 font-medium">Vendor</th>
                <th className="text-left py-3 px-4 text-stone-300 font-medium">Cost</th>
                <th className="text-left py-3 px-4 text-stone-300 font-medium">Status</th>
                <th className="text-left py-3 px-4 text-stone-300 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map(room => 
                room.categories?.map(category =>
                  category.subcategories?.map(item => (
                    <tr key={item.id} className="border-b border-stone-800 hover:bg-stone-800">
                      <td className="py-3 px-4 text-white">{item.name}</td>
                      <td className="py-3 px-4 text-stone-300">{room.name}</td>
                      <td className="py-3 px-4 text-stone-300">{category.name}</td>
                      <td className="py-3 px-4 text-stone-300">{item.vendor || 'TBD'}</td>
                      <td className="py-3 px-4 text-stone-300">{item.cost || 'TBD'}</td>
                      <td className="py-3 px-4">
                        <select
                          value={item.status || 'SPECIFIED'}
                          onChange={(e) => updateItemStatus(item.id, e.target.value)}
                          className={`px-2 py-1 rounded text-white text-xs font-medium ${getStatusColor(item.status || 'SPECIFIED')}`}
                        >
                          {statusOptions.map(status => (
                            <option key={status} value={status}>{status.replace('_', ' ')}</option>
                          ))}
                        </select>
                      </td>
                      <td className="py-3 px-4">
                        <button
                          onClick={() => {/* Edit item */}}
                          className="text-amber-400 hover:text-amber-300 mr-2"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => {/* Delete item */}}
                          className="text-red-400 hover:text-red-300"
                        >
                          🗑️
                        </button>
                      </td>
                    </tr>
                  )) || []
                ) || []
              ).flat().flat()}
            </tbody>
          </table>
          
          {items.length === 0 && (
            <div className="text-center py-8">
              <p className="text-stone-400 text-lg">No FF&E items found</p>
              <p className="text-stone-500 text-sm">Add items to start building your FF&E schedule</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default FFEView;
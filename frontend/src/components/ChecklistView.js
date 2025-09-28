import React, { useState, useEffect } from 'react';

const ChecklistView = ({ project }) => {
  const [items, setItems] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchChecklistData();
  }, [project]);

  const fetchChecklistData = async () => {
    if (!project?.id) return;
    
    setLoading(true);
    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/projects/${project.id}?sheet_type=checklist`);
      if (response.ok) {
        const data = await response.json();
        setItems(data.rooms || []);
      }
    } catch (error) {
      console.error('Error fetching checklist data:', error);
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
        fetchChecklistData();
      }
    } catch (error) {
      console.error('Error updating item status:', error);
    }
  };

  const addItem = async (roomId, categoryId, itemName) => {
    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/items`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          category_id: categoryId,
          name: itemName,
          status: 'PENDING'
        })
      });
      
      if (response.ok) {
        fetchChecklistData();
      }
    } catch (error) {
      console.error('Error adding item:', error);
    }
  };

  const statusOptions = [
    'PENDING',
    'IN_PROGRESS', 
    'SOURCED',
    'APPROVED',
    'ORDERED',
    'RECEIVED',
    'COMPLETED'
  ];

  const getStatusColor = (status) => {
    const colors = {
      'PENDING': 'bg-gray-600',
      'IN_PROGRESS': 'bg-blue-600',
      'SOURCED': 'bg-yellow-600',
      'APPROVED': 'bg-green-600',
      'ORDERED': 'bg-purple-600',
      'RECEIVED': 'bg-indigo-600',
      'COMPLETED': 'bg-emerald-600'
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
  const completedItems = statusBreakdown['COMPLETED'] || 0;
  const progressPercentage = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

  return (
    <div className="bg-stone-900 rounded-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-white">Checklist - {project?.name}</h2>
        <div className="text-right">
          <div className="text-2xl font-bold text-white">{progressPercentage}%</div>
          <div className="text-sm text-stone-400">Complete</div>
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
          <span>{completedItems} of {totalItems} items completed</span>
          <span>{totalItems - completedItems} remaining</span>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="mb-6 space-y-4">
        <div className="flex flex-wrap gap-4">
          <input
            type="text"
            placeholder="Search checklist items..."
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
        </div>
      </div>

      {/* Status Overview */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-white mb-4">Status Breakdown</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {statusOptions.map(status => (
            <div key={status} className="bg-stone-800 p-3 rounded-lg">
              <div className={`w-3 h-3 rounded-full ${getStatusColor(status)} mb-2`}></div>
              <div className="text-xs text-stone-400">{status.replace('_', ' ')}</div>
              <div className="text-lg font-bold text-white">{statusBreakdown[status]}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Checklist Items */}
      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500 mx-auto mb-4"></div>
          <p className="text-stone-400">Loading checklist data...</p>
        </div>
      ) : (
        <div className="space-y-6">
          {items.map(room => (
            <div key={room.id} className="bg-stone-800 rounded-lg p-4">
              <h4 className="text-lg font-semibold text-white mb-4 border-b border-stone-700 pb-2">
                {room.name}
              </h4>
              
              {room.categories?.map(category => (
                <div key={category.id} className="mb-4">
                  <h5 className="text-md font-medium text-stone-300 mb-2">{category.name}</h5>
                  
                  <div className="space-y-2">
                    {category.subcategories?.map(item => {
                      const isCompleted = item.status === 'COMPLETED';
                      return (
                        <div key={item.id} className={`flex items-center justify-between p-3 rounded transition-all duration-200 ${
                          isCompleted ? 'bg-green-900/30' : 'bg-stone-700'
                        }`}>
                          <div className="flex items-center space-x-3">
                            <input
                              type="checkbox"
                              checked={isCompleted}
                              onChange={(e) => updateItemStatus(item.id, e.target.checked ? 'COMPLETED' : 'PENDING')}
                              className="w-4 h-4 text-amber-600 bg-stone-600 border-stone-500 rounded focus:ring-amber-500"
                            />
                            <span className={`${isCompleted ? 'line-through text-stone-400' : 'text-white'}`}>
                              {item.name}
                            </span>
                          </div>
                          
                          <select
                            value={item.status || 'PENDING'}
                            onChange={(e) => updateItemStatus(item.id, e.target.value)}
                            className={`px-3 py-1 rounded text-white text-xs font-medium ${getStatusColor(item.status || 'PENDING')}`}
                          >
                            {statusOptions.map(status => (
                              <option key={status} value={status}>{status.replace('_', ' ')}</option>
                            ))}
                          </select>
                        </div>
                      );
                    }) || (
                      <p className="text-stone-500 text-sm italic">No items in this category</p>
                    )}
                  </div>
                </div>
              )) || (
                <p className="text-stone-500 italic">No categories in this room</p>
              )}
            </div>
          ))}
          
          {items.length === 0 && (
            <div className="text-center py-8">
              <p className="text-stone-400 text-lg">No checklist items found</p>
              <p className="text-stone-500 text-sm">Items will appear here as you add them to your project</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ChecklistView;
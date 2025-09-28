import React, { useState, useEffect } from 'react';

const WalkthroughView = ({ project }) => {
  const [rooms, setRooms] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchWalkthroughData();
  }, [project]);

  const fetchWalkthroughData = async () => {
    if (!project?.id) return;
    
    setLoading(true);
    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/projects/${project.id}?sheet_type=walkthrough`);
      if (response.ok) {
        const data = await response.json();
        setRooms(data.rooms || []);
      }
    } catch (error) {
      console.error('Error fetching walkthrough data:', error);
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
        // Refresh data
        fetchWalkthroughData();
      }
    } catch (error) {
      console.error('Error updating item status:', error);
    }
  };

  const statusOptions = [
    'TO BE SELECTED',
    'RESEARCHING', 
    'PENDING APPROVAL',
    'APPROVED',
    'ORDERED',
    'SHIPPED',
    'DELIVERED',
    'INSTALLED'
  ];

  const getStatusColor = (status) => {
    const colors = {
      'TO BE SELECTED': 'bg-gray-600',
      'RESEARCHING': 'bg-blue-600',
      'PENDING APPROVAL': 'bg-yellow-600',
      'APPROVED': 'bg-green-600',
      'ORDERED': 'bg-purple-600',
      'SHIPPED': 'bg-indigo-600',
      'DELIVERED': 'bg-pink-600',
      'INSTALLED': 'bg-emerald-600'
    };
    return colors[status] || 'bg-gray-600';
  };

  const filteredRooms = rooms.filter(room => {
    const matchesRoom = !selectedRoom || room.name === selectedRoom;
    const matchesSearch = !searchTerm || 
      room.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      room.categories?.some(cat => 
        cat.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cat.subcategories?.some(sub => 
          sub.name.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    return matchesRoom && matchesSearch;
  });

  const getStatusBreakdown = () => {
    const breakdown = {};
    statusOptions.forEach(status => breakdown[status] = 0);
    
    rooms.forEach(room => {
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

  return (
    <div className="bg-stone-900 rounded-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-white">Walkthrough - {project?.name}</h2>
      </div>

      {/* Search and Filters */}
      <div className="mb-6 space-y-4">
        <div className="flex flex-wrap gap-4">
          <input
            type="text"
            placeholder="Search items..."
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
            {rooms.map(room => (
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
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Status Overview */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-white mb-4">Status Overview</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {statusOptions.map(status => (
            <div key={status} className="bg-stone-800 p-3 rounded-lg">
              <div className={`w-3 h-3 rounded-full ${getStatusColor(status)} mb-2`}></div>
              <div className="text-xs text-stone-400">{status}</div>
              <div className="text-lg font-bold text-white">{statusBreakdown[status]}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Rooms and Items */}
      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500 mx-auto mb-4"></div>
          <p className="text-stone-400">Loading walkthrough data...</p>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredRooms.map(room => (
            <div key={room.id} className="bg-stone-800 rounded-lg p-4">
              <h4 className="text-lg font-semibold text-white mb-4 border-b border-stone-700 pb-2">
                {room.name}
              </h4>
              
              {room.categories?.map(category => (
                <div key={category.id} className="mb-4">
                  <h5 className="text-md font-medium text-stone-300 mb-2">{category.name}</h5>
                  
                  <div className="space-y-2">
                    {category.subcategories?.map(item => (
                      <div key={item.id} className="flex items-center justify-between p-3 bg-stone-700 rounded">
                        <span className="text-white">{item.name}</span>
                        
                        <select
                          value={item.status || 'TO BE SELECTED'}
                          onChange={(e) => updateItemStatus(item.id, e.target.value)}
                          className={`px-3 py-1 rounded text-white text-xs font-medium ${getStatusColor(item.status || 'TO BE SELECTED')}`}
                        >
                          {statusOptions.map(status => (
                            <option key={status} value={status}>{status}</option>
                          ))}
                        </select>
                      </div>
                    )) || (
                      <p className="text-stone-500 text-sm italic">No items in this category</p>
                    )}
                  </div>
                </div>
              )) || (
                <p className="text-stone-500 italic">No categories in this room</p>
              )}
            </div>
          ))}
          
          {filteredRooms.length === 0 && (
            <div className="text-center py-8">
              <p className="text-stone-400 text-lg">No rooms found</p>
              <p className="text-stone-500 text-sm">Try adjusting your search or filters</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default WalkthroughView;
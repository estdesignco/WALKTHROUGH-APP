import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL + '/api';

export default function MobileFFESpreadsheet({ projectId }) {
  const [project, setProject] = useState(null);
  const [expandedRooms, setExpandedRooms] = useState({});
  const [expandedCategories, setExpandedCategories] = useState({});
  const [loading, setLoading] = useState(true);
  const [showAddRoom, setShowAddRoom] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');

  const statuses = ['PICKED', 'ORDERED', 'SHIPPED', 'DELIVERED TO RECEIVER', 'DELIVERED TO JOB SITE', 'INSTALLED'];
  const carriers = ['FedEx', 'UPS', 'USPS', 'DHL', 'Other'];

  // EXACT SAME COLORS AS DESKTOP FFE
  const getRoomColor = (roomName) => {
    const roomColors = {
      'living room': '#8B5CF6',      // Purple/violet - EXACT DESKTOP MATCH
      'dining room': '#EAB308',
      'kitchen': '#F59E0B',
      'master bedroom': '#3B82F6',
      'bedroom': '#3B82F6',
      'bathroom': '#8B5CF6',
      'office': '#10B981',
      'guest room': '#06B6D4',
      'laundry room': '#16A34A',
      'mudroom': '#0891B2',
      'family room': '#CA8A04',
      'basement': '#6B7280',
      'attic storage': '#78716C',
      'garage': '#374151',
      'balcony': '#7C3AED'
    };
    return roomColors[roomName.toLowerCase()] || '#8B5CF6';
  };

  const getCategoryColor = () => '#065F46';

  useEffect(() => {
    loadProject();
  }, [projectId]);

  const loadProject = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/projects/${projectId}?sheet_type=ffe`);
      setProject(response.data);
    } catch (error) {
      console.error('Failed to load FFE:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleRoom = (roomId) => {
    setExpandedRooms(prev => ({ ...prev, [roomId]: !prev[roomId] }));
  };

  const toggleCategory = (categoryId) => {
    setExpandedCategories(prev => ({ ...prev, [categoryId]: !prev[categoryId] }));
  };

  const handleAddRoom = async () => {
    if (!newRoomName.trim()) return;
    try {
      await axios.post(`${API_URL}/rooms`, {
        name: newRoomName,
        project_id: projectId,
        sheet_type: 'ffe',
        auto_populate: true,
        color: getRoomColor(newRoomName),
        order_index: project?.rooms?.length || 0
      });
      await loadProject();
      setShowAddRoom(false);
      setNewRoomName('');
    } catch (error) {
      alert('Failed to add room');
    }
  };

  const updateItem = async (itemId, data) => {
    try {
      await axios.put(`${API_URL}/items/${itemId}`, data);
      await loadProject();
    } catch (error) {
      console.error('Update failed:', error);
    }
  };

  const toggleItemCheck = (item) => updateItem(item.id, { checked: !item.checked });

  if (loading) {
    return <div className="flex items-center justify-center h-full" style={{ backgroundColor: '#0F172A' }}>
      <div className="text-white">Loading FF&E...</div>
    </div>;
  }

  return (
    <div className="w-full h-full overflow-auto" style={{ backgroundColor: '#0F172A' }}>
      {/* ADD ROOM BUTTON */}
      <div className="p-4 border-b border-gray-700">
        <button
          onClick={() => setShowAddRoom(true)}
          className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
        >
          ➕ ADD ROOM
        </button>
      </div>

      {/* FFE TABLE - EXACT DESKTOP STRUCTURE WITH ALL COLUMNS */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse" style={{ minWidth: '1400px' }}>
          <thead>
            {/* SECTION HEADERS - EXACT SAME AS DESKTOP */}
            <tr>
              <td colSpan="4" className="border-gray-400 px-2 py-1 text-xs font-bold text-white text-center" 
                  style={{ backgroundColor: '#8B4444', borderLeft: '1px solid #9CA3AF', borderRight: 'none', borderTop: '1px solid #9CA3AF', borderBottom: '1px solid #9CA3AF' }}>
              </td>
              <td colSpan="3" className="border border-gray-400 px-2 py-1 text-xs font-bold text-white text-center" 
                  style={{ backgroundColor: '#8B4513' }}>
                ADDITIONAL INFO.
              </td>
              <td colSpan="5" className="border border-gray-400 px-2 py-1 text-xs font-bold text-white text-center" 
                  style={{ backgroundColor: '#6B46C1' }}>
                SHIPPING INFO.
              </td>
              <td colSpan="2" className="border-gray-400 px-2 py-1 text-xs font-bold text-white text-center" 
                  style={{ backgroundColor: '#8B4444', borderRight: '1px solid #9CA3AF', borderLeft: 'none', borderTop: '1px solid #9CA3AF', borderBottom: '1px solid #9CA3AF' }}>
              </td>
            </tr>
            
            {/* COLUMN HEADERS - EXACT SAME AS DESKTOP */}
            <tr>
              <th className="border border-gray-400 px-2 py-2 text-xs font-bold text-white sticky top-0" style={{ backgroundColor: '#8B4444' }}>INSTALLED</th>
              <th className="border border-gray-400 px-2 py-2 text-xs font-bold text-white sticky top-0" style={{ backgroundColor: '#8B4444' }}>QTY</th>
              <th className="border border-gray-400 px-2 py-2 text-xs font-bold text-white sticky top-0" style={{ backgroundColor: '#8B4444' }}>SIZE</th>
              <th className="border border-gray-400 px-2 py-2 text-xs font-bold text-white sticky top-0" style={{ backgroundColor: '#6B46C1' }}>STATUS</th>
              <th className="border border-gray-400 px-2 py-2 text-xs font-bold text-white sticky top-0" style={{ backgroundColor: '#8B4444' }}>VENDOR/SKU</th>
              <th className="border border-gray-400 px-2 py-2 text-xs font-bold text-white sticky top-0" style={{ backgroundColor: '#8B4444' }}>IMAGE</th>
              <th className="border border-gray-400 px-2 py-2 text-xs font-bold text-white sticky top-0" style={{ backgroundColor: '#8B4444' }}>LINK</th>
              <th className="border border-gray-400 px-2 py-2 text-xs font-bold text-white sticky top-0" style={{ backgroundColor: '#6B46C1' }}>CARRIER</th>
              <th className="border border-gray-400 px-2 py-2 text-xs font-bold text-white sticky top-0" style={{ backgroundColor: '#6B46C1' }}>TRACKING</th>
              <th className="border border-gray-400 px-2 py-2 text-xs font-bold text-white sticky top-0" style={{ backgroundColor: '#6B46C1' }}>ORDER DATE</th>
              <th className="border border-gray-400 px-2 py-2 text-xs font-bold text-white sticky top-0" style={{ backgroundColor: '#6B46C1' }}>DELIVERY DATE</th>
              <th className="border border-gray-400 px-2 py-2 text-xs font-bold text-white sticky top-0" style={{ backgroundColor: '#6B46C1' }}>COST</th>
              <th className="border border-gray-400 px-2 py-2 text-xs font-bold text-white sticky top-0" style={{ backgroundColor: '#8B4444' }}>NOTES</th>
              <th className="border border-gray-400 px-2 py-2 text-xs font-bold text-white sticky top-0" style={{ backgroundColor: '#8B4444' }}>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {project?.rooms?.map((room) => (
              <React.Fragment key={room.id}>
                {/* ROOM HEADER ROW */}
                <tr>
                  <td colSpan="14" 
                      className="border border-gray-400 px-3 py-2 text-white text-sm font-bold"
                      style={{ backgroundColor: getRoomColor(room.name) }}>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <button onClick={() => toggleRoom(room.id)} className="text-white">
                          {expandedRooms[room.id] ? '▼' : '▶'}
                        </button>
                        <span>{room.name.toUpperCase()}</span>
                      </div>
                    </div>
                  </td>
                </tr>

                {/* CATEGORIES */}
                {expandedRooms[room.id] && room.categories?.map((category) => (
                  <React.Fragment key={category.id}>
                    {/* CATEGORY HEADER ROW */}
                    <tr>
                      <td colSpan="14"
                          className="border border-gray-400 px-4 py-2 text-white text-sm font-bold"
                          style={{ backgroundColor: getCategoryColor() }}>
                        <div className="flex items-center gap-2">
                          <button onClick={() => toggleCategory(category.id)} className="text-white">
                            {expandedCategories[category.id] ? '▼' : '▶'}
                          </button>
                          <span>{category.name.toUpperCase()}</span>
                        </div>
                      </td>
                    </tr>

                    {/* ITEMS */}
                    {expandedCategories[category.id] && category.subcategories?.map((subcategory) => (
                      <React.Fragment key={subcategory.id}>
                        {subcategory.items?.map((item) => (
                          <tr key={item.id} className="hover:bg-gray-800">
                            {/* INSTALLED */}
                            <td className="border border-gray-400 px-2 py-2 text-center">
                              <input
                                type="checkbox"
                                checked={item.checked || false}
                                onChange={() => toggleItemCheck(item)}
                                className="w-5 h-5 cursor-pointer"
                              />
                            </td>
                            
                            {/* QTY */}
                            <td className="border border-gray-400 px-2 py-2 text-white text-sm text-center">
                              {item.quantity || '-'}
                            </td>
                            
                            {/* SIZE */}
                            <td className="border border-gray-400 px-2 py-2 text-white text-sm">
                              {item.size || '-'}
                            </td>
                            
                            {/* STATUS */}
                            <td className="border border-gray-400 px-2 py-2">
                              <select
                                value={item.status || ''}
                                onChange={(e) => updateItem(item.id, { status: e.target.value })}
                                className="w-full bg-gray-700 text-white text-xs px-1 py-1 rounded border-none"
                              >
                                <option value="">Select</option>
                                {statuses.map(s => <option key={s} value={s}>{s}</option>)}
                              </select>
                            </td>
                            
                            {/* VENDOR/SKU */}
                            <td className="border border-gray-400 px-2 py-2 text-white text-sm">
                              <div className="font-bold text-xs">{item.name}</div>
                              {item.vendor && <div className="text-xs text-gray-400">{item.vendor}</div>}
                              {item.sku && <div className="text-xs text-gray-400">SKU: {item.sku}</div>}
                            </td>
                            
                            {/* IMAGE */}
                            <td className="border border-gray-400 px-2 py-2">
                              {item.image_url && (
                                <img src={item.image_url} alt={item.name} className="w-16 h-16 object-cover rounded" />
                              )}
                            </td>
                            
                            {/* LINK */}
                            <td className="border border-gray-400 px-2 py-2">
                              {item.link && (
                                <a href={item.link} target="_blank" rel="noopener noreferrer" className="text-blue-400 text-xs">
                                  🔗 Link
                                </a>
                              )}
                            </td>
                            
                            {/* CARRIER */}
                            <td className="border border-gray-400 px-2 py-2">
                              <select
                                value={item.carrier || ''}
                                onChange={(e) => updateItem(item.id, { carrier: e.target.value })}
                                className="w-full bg-gray-700 text-white text-xs px-1 py-1 rounded"
                              >
                                <option value="">Select</option>
                                {carriers.map(c => <option key={c} value={c}>{c}</option>)}
                              </select>
                            </td>
                            
                            {/* TRACKING */}
                            <td className="border border-gray-400 px-2 py-2">
                              <input
                                type="text"
                                value={item.tracking_number || ''}
                                onChange={(e) => updateItem(item.id, { tracking_number: e.target.value })}
                                className="w-full bg-gray-700 text-white text-xs px-1 py-1 rounded"
                                placeholder="Tracking #"
                              />
                            </td>
                            
                            {/* ORDER DATE */}
                            <td className="border border-gray-400 px-2 py-2 text-white text-xs">
                              {item.order_date || '-'}
                            </td>
                            
                            {/* DELIVERY DATE */}
                            <td className="border border-gray-400 px-2 py-2 text-white text-xs">
                              {item.delivery_date || '-'}
                            </td>
                            
                            {/* COST */}
                            <td className="border border-gray-400 px-2 py-2 text-white text-xs">
                              {item.cost ? `$${item.cost}` : '-'}
                            </td>
                            
                            {/* NOTES */}
                            <td className="border border-gray-400 px-2 py-2 text-white text-xs">
                              {item.notes || '-'}
                            </td>
                            
                            {/* ACTIONS */}
                            <td className="border border-gray-400 px-2 py-2 text-center">
                              <button className="text-blue-400 text-xs">Edit</button>
                            </td>
                          </tr>
                        ))}
                      </React.Fragment>
                    ))}
                  </React.Fragment>
                ))}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>

      {/* ADD ROOM MODAL */}
      {showAddRoom && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-white mb-4">Add Room</h3>
            <input
              type="text"
              value={newRoomName}
              onChange={(e) => setNewRoomName(e.target.value)}
              placeholder="Enter room name"
              className="w-full bg-gray-700 text-white px-4 py-2 rounded mb-4"
              onKeyPress={(e) => e.key === 'Enter' && handleAddRoom()}
            />
            <div className="flex gap-2">
              <button onClick={handleAddRoom} className="flex-1 bg-green-600 text-white px-4 py-2 rounded font-bold">
                Add
              </button>
              <button onClick={() => setShowAddRoom(false)} className="flex-1 bg-gray-600 text-white px-4 py-2 rounded">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
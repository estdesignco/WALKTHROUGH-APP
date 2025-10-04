import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL + '/api';

export default function MobileWalkthroughSpreadsheet({ projectId, onOpenPhotos }) {
  const [project, setProject] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [expandedRoom, setExpandedRoom] = useState(null);
  const [expandedCategory, setExpandedCategory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAddRoom, setShowAddRoom] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');
  const [addingRoom, setAddingRoom] = useState(false);

  useEffect(() => {
    loadProject();
  }, [projectId]);

  const loadProject = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/projects/${projectId}?sheet_type=walkthrough`);
      setProject(response.data);
      setRooms(response.data.rooms || []);
    } catch (error) {
      console.error('Failed to load project:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleRoom = (roomId) => {
    setExpandedRoom(expandedRoom === roomId ? null : roomId);
    setExpandedCategory(null);
  };

  const toggleCategory = (categoryId) => {
    setExpandedCategory(expandedCategory === categoryId ? null : categoryId);
  };

  const handleAddRoom = async () => {
    if (!newRoomName.trim()) return;
    
    try {
      setAddingRoom(true);
      await axios.post(`${API_URL}/rooms`, {
        name: newRoomName,
        project_id: projectId,
        sheet_type: 'walkthrough',
        auto_populate: true,
        color: '#2a2a3a',
        order_index: rooms.length
      });
      
      // Reload project to get new room with auto-populated data
      await loadProject();
      setShowAddRoom(false);
      setNewRoomName('');
    } catch (error) {
      console.error('Failed to add room:', error);
      alert('Failed to add room');
    } finally {
      setAddingRoom(false);
    }
  };

  const handleAddItem = async (subcategoryId) => {
    const itemName = prompt('Enter item name:');
    if (!itemName) return;
    
    try {
      await axios.post(`${API_URL}/items`, {
        name: itemName,
        subcategory_id: subcategoryId,
        checked: false
      });
      await loadProject();
    } catch (error) {
      console.error('Failed to add item:', error);
      alert('Failed to add item');
    }
  };

  const toggleItemCheck = async (item) => {
    try {
      await axios.put(`${API_URL}/items/${item.id}`, {
        checked: !item.checked
      });
      await loadProject();
    } catch (error) {
      console.error('Failed to toggle item:', error);
    }
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-gradient-to-b from-black via-[#0F0F0F] to-[#1a1a2e]">
        <div className="text-[#D4C5A9]">Loading...</div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto bg-gradient-to-b from-black via-[#0F0F0F] to-[#1a1a2e]">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-[#0F0F0F] border-b-2 border-[#D4C5A9]/20 p-3">
        <h2 className="text-lg font-bold bg-gradient-to-r from-[#D4C5A9] to-[#BCA888] bg-clip-text text-transparent mb-1">
          {project?.name}
        </h2>
        <p className="text-gray-400 text-xs mb-2">Walkthrough - Auto-populated from Questionnaire</p>
        
        <button
          onClick={() => setShowAddRoom(true)}
          className="w-full bg-gradient-to-r from-[#3a3a4a] to-[#2a2a3a] text-[#D4C5A9] border-2 border-[#D4C5A9]/30 px-3 py-2 rounded-lg text-sm font-semibold hover:from-[#4a4a5a] hover:to-[#3a3a4a] transition-all"
        >
          ➕ Add Room
        </button>
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
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenPhotos(room);
                    }}
                    className="bg-[#D4C5A9]/20 px-2 py-0.5 rounded text-xs text-[#D4C5A9] border border-[#D4C5A9]/40"
                  >
                    📸
                  </button>
                  <span className="text-xs text-gray-300">
                    {room.categories?.length || 0} categories
                  </span>
                </div>
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
                      <div className="ml-4 mt-1 space-y-1">
                        {category.subcategories.map((subcategory) => (
                          <div key={subcategory.id}>
                            <div className="text-xs text-[#D4C5A9] font-semibold mb-1 px-2">
                              {subcategory.name}
                            </div>
                            
                            {/* Items */}
                            {subcategory.items && subcategory.items.length > 0 ? (
                              <div className="space-y-0.5">
                                {subcategory.items.map((item) => (
                                  <button
                                    key={item.id}
                                    onClick={() => toggleItemCheck(item)}
                                    className="w-full bg-[#1a1a2a]/60 border border-[#D4C5A9]/10 rounded p-2 text-left flex items-center gap-2 hover:bg-[#2a2a3a]/60 transition-colors"
                                  >
                                    <div 
                                      className={`w-5 h-5 border-2 rounded flex items-center justify-center flex-shrink-0 ${
                                        item.checked 
                                          ? 'bg-[#D4C5A9] border-[#D4C5A9]' 
                                          : 'border-[#D4C5A9]/40'
                                      }`}
                                    >
                                      {item.checked && <span className="text-black text-xs">✓</span>}
                                    </div>
                                    <span className={`text-xs ${item.checked ? 'text-gray-500 line-through' : 'text-gray-300'}`}>
                                      {item.name}
                                    </span>
                                  </button>
                                ))}
                              </div>
                            ) : (
                              <div className="text-xs text-gray-500 px-2">No items yet</div>
                            )}
                            
                            {/* Add Item Button */}
                            <button
                              onClick={() => handleAddItem(subcategory.id)}
                              className="w-full mt-1 bg-[#1a1a2a]/40 border border-[#D4C5A9]/10 rounded p-1.5 text-xs text-[#D4C5A9] hover:bg-[#2a2a3a]/60"
                            >
                              + Add Item
                            </button>
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
            <p className="mb-2">No rooms yet</p>
            <p className="text-xs">Rooms are auto-populated from the questionnaire</p>
            <p className="text-xs">Or click "Add Room" above</p>
          </div>
        )}
      </div>

      {/* Add Room Modal */}
      {showAddRoom && (
        <div className="fixed inset-0 bg-black/95 flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-[#1a1a2a] to-[#0a0a1a] border-2 border-[#D4C5A9]/30 rounded-2xl p-6 w-full max-w-md">
            <h3 className="text-xl font-bold text-[#D4C5A9] mb-4">Add Room</h3>
            <p className="text-xs text-gray-400 mb-4">
              Room will be auto-populated with categories and items based on room type
            </p>
            
            <input
              type="text"
              value={newRoomName}
              onChange={(e) => setNewRoomName(e.target.value)}
              placeholder="Enter room name (e.g. Living Room)"
              className="w-full bg-[#0a0a1a] border-2 border-[#D4C5A9]/30 rounded-lg px-4 py-2 text-white mb-4 focus:outline-none focus:border-[#D4C5A9]"
              onKeyPress={(e) => e.key === 'Enter' && handleAddRoom()}
            />
            
            <div className="flex gap-3">
              <button
                onClick={handleAddRoom}
                disabled={addingRoom || !newRoomName.trim()}
                className="flex-1 bg-gradient-to-r from-[#3a3a4a] to-[#2a2a3a] text-[#D4C5A9] px-4 py-2 rounded-lg font-semibold disabled:opacity-50"
              >
                {addingRoom ? 'Adding...' : 'Add Room'}
              </button>
              <button
                onClick={() => {
                  setShowAddRoom(false);
                  setNewRoomName('');
                }}
                className="flex-1 bg-gradient-to-r from-[#2a2a3a] to-[#1a1a2a] text-gray-300 px-4 py-2 rounded-lg font-semibold"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
import React, { useState } from 'react';
import { getRoomColor } from '../utils/roomColors';

const AddMultipleRoomsModal = ({ onClose, onSubmit, roomColors, existingRooms = [] }) => {
  const [selectedRooms, setSelectedRooms] = useState([]);
  const [customRoom, setCustomRoom] = useState('');
  const [loading, setLoading] = useState(false);

  const commonRooms = [
    'Living Room', 'Kitchen', 'Master Bedroom', 'Bedroom 2', 'Bedroom 3',
    'Bathroom', 'Master Bathroom', 'Powder Room', 'Dining Room', 'Office',
    'Family Room', 'Basement', 'Laundry Room', 'Mudroom', 'Pantry',
    'Closet', 'Guest Room', 'Playroom', 'Library', 'Wine Cellar',
    'Garage', 'Patio', 'Balcony', 'Foyer', 'Hallway'
  ];

  // Filter out rooms that already exist in the project
  const existingRoomNames = existingRooms.map(r => r.name?.toLowerCase());
  const availableRooms = commonRooms.filter(room => 
    !existingRoomNames.includes(room.toLowerCase())
  );

  const handleToggleRoom = (roomName) => {
    setSelectedRooms(prev => {
      if (prev.includes(roomName)) {
        return prev.filter(r => r !== roomName);
      } else {
        return [...prev, roomName];
      }
    });
  };

  const handleAddCustomRoom = () => {
    if (customRoom.trim() && !selectedRooms.includes(customRoom.trim())) {
      setSelectedRooms(prev => [...prev, customRoom.trim()]);
      setCustomRoom('');
    }
  };

  const handleRemoveSelected = (roomName) => {
    setSelectedRooms(prev => prev.filter(r => r !== roomName));
  };

  const handleSelectAll = () => {
    setSelectedRooms(availableRooms);
  };

  const handleClearAll = () => {
    setSelectedRooms([]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (selectedRooms.length === 0) return;

    setLoading(true);
    try {
      // Submit all rooms
      for (const roomName of selectedRooms) {
        await onSubmit({ name: roomName, description: '' });
      }
      onClose();
    } catch (err) {
      console.error('Error submitting rooms:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center z-50 p-4 overflow-y-auto">
      <div className="rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto mt-4 border-2 border-[#D4A574]" style={{
        background: 'linear-gradient(135deg, rgba(0,0,0,0.98) 0%, rgba(30,30,30,0.95) 20%, rgba(15,15,25,0.98) 40%, rgba(30,30,30,0.95) 60%, rgba(15,15,25,0.98) 80%, rgba(0,0,0,0.98) 100%)',
        boxShadow: '0 0 60px rgba(212, 165, 116, 0.3), inset 0 0 80px rgba(212, 165, 116, 0.05)'
      }}>
        <form onSubmit={handleSubmit}>
          {/* Header */}
          <div className="p-6 border-b-2 border-[#D4A574]">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-[#D4A574]">Add Multiple Rooms</h2>
              <button
                type="button"
                onClick={onClose}
                className="text-[#D4A574] hover:text-red-400 transition-colors text-2xl"
              >
                ✕
              </button>
            </div>
            <p className="text-[#D4C5A9] text-sm mt-2">
              Select multiple rooms to add at once. Click on rooms to select/deselect.
            </p>
          </div>

          {/* Selected Rooms Preview */}
          {selectedRooms.length > 0 && (
            <div className="px-6 pt-4">
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-[#D4A574]">
                  Selected Rooms ({selectedRooms.length})
                </label>
                <button
                  type="button"
                  onClick={handleClearAll}
                  className="text-xs text-red-400 hover:text-red-300"
                >
                  Clear All
                </button>
              </div>
              <div className="flex flex-wrap gap-2 p-3 rounded-lg border border-[#D4A574]/30" style={{
                background: 'rgba(212, 165, 116, 0.05)'
              }}>
                {selectedRooms.map((room) => {
                  const roomColor = getRoomColor(room);
                  return (
                    <span
                      key={room}
                      className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium text-white cursor-pointer hover:opacity-80"
                      style={{ backgroundColor: roomColor }}
                      onClick={() => handleRemoveSelected(room)}
                    >
                      {room}
                      <span className="ml-1 text-white/80">×</span>
                    </span>
                  );
                })}
              </div>
            </div>
          )}

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Custom Room Input */}
            <div>
              <label className="block text-sm font-medium text-[#D4C5A9] mb-2">
                Add Custom Room
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={customRoom}
                  onChange={(e) => setCustomRoom(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddCustomRoom())}
                  className="flex-1 px-4 py-3 rounded-lg border-2 border-[#B49B7E] focus:border-[#D4A574] focus:outline-none text-[#D4C5A9]"
                  style={{
                    background: 'linear-gradient(135deg, rgba(0,0,0,0.95) 0%, rgba(20,20,30,0.9) 50%, rgba(0,0,0,0.95) 100%)'
                  }}
                  placeholder="Enter custom room name..."
                />
                <button
                  type="button"
                  onClick={handleAddCustomRoom}
                  className="px-4 py-2 rounded-lg border-2 border-[#D4A574] text-[#D4A574] hover:bg-[#D4A574] hover:text-black transition-colors font-medium"
                  disabled={!customRoom.trim()}
                >
                  Add
                </button>
              </div>
            </div>

            {/* Quick Room Selection */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-[#D4C5A9]">
                  Quick Select Common Rooms
                </label>
                <button
                  type="button"
                  onClick={handleSelectAll}
                  className="text-xs text-[#D4A574] hover:text-[#D4C5A9]"
                >
                  Select All Available
                </button>
              </div>
              
              {availableRooms.length === 0 ? (
                <p className="text-[#D4C5A9]/60 text-sm italic">
                  All common rooms have been added to this project.
                </p>
              ) : (
                <div className="grid grid-cols-3 gap-3">
                  {availableRooms.map((room) => {
                    const roomColor = getRoomColor(room);
                    const isSelected = selectedRooms.includes(room);
                    return (
                      <button
                        key={room}
                        type="button"
                        onClick={() => handleToggleRoom(room)}
                        className={`p-3 rounded-xl border-2 font-bold text-sm transition-all overflow-hidden relative ${
                          isSelected 
                            ? 'border-[#D4A574] text-[#D4A574]' 
                            : 'border-[#B49B7E] hover:border-[#D4A574] text-[#D4C5A9]'
                        }`}
                        style={{ 
                          background: isSelected 
                            ? `linear-gradient(135deg, rgba(212,165,116,0.15) 0%, rgba(30,30,30,0.9) 50%, rgba(212,165,116,0.15) 100%)`
                            : 'linear-gradient(135deg, rgba(0,0,0,0.95) 0%, rgba(30,30,30,0.9) 30%, rgba(15,15,25,0.95) 70%, rgba(0,0,0,0.95) 100%)',
                          borderTop: `4px solid ${roomColor}`,
                          boxShadow: isSelected 
                            ? `0 0 20px ${roomColor}80, 0 -3px 12px ${roomColor}50, inset 0 0 25px ${roomColor}15` 
                            : `0 -2px 6px ${roomColor}30, inset 0 0 15px ${roomColor}04`
                        }}
                      >
                        {isSelected && (
                          <span className="absolute top-1 right-1 text-[#D4A574] text-lg">✓</span>
                        )}
                        {room}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 border-t-2 border-[#D4A574] flex justify-between items-center">
            <span className="text-[#D4C5A9] text-sm">
              {selectedRooms.length} room{selectedRooms.length !== 1 ? 's' : ''} selected
            </span>
            <div className="flex space-x-4">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2 text-[#D4C5A9] hover:text-[#D4A574] transition-colors"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2 rounded-lg transition-colors font-medium disabled:opacity-50 border-2 border-[#D4A574] text-[#D4A574] hover:bg-[#D4A574] hover:text-black"
                style={{
                  background: loading || selectedRooms.length === 0 ? 'rgba(212, 165, 116, 0.1)' : 'linear-gradient(135deg, rgba(0,0,0,0.9) 0%, rgba(30,30,30,0.85) 50%, rgba(0,0,0,0.9) 100%)'
                }}
                disabled={loading || selectedRooms.length === 0}
              >
                {loading ? 'Creating...' : `Create ${selectedRooms.length} Room${selectedRooms.length !== 1 ? 's' : ''}`}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddMultipleRoomsModal;

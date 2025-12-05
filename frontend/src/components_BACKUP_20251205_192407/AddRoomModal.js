import React, { useState } from 'react';
import { getRoomColor } from '../utils/roomColors';

const AddRoomModal = ({ onClose, onSubmit, roomColors }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });
  const [loading, setLoading] = useState(false);

  const commonRooms = [
    'Living Room', 'Kitchen', 'Master Bedroom', 'Bedroom 2', 'Bedroom 3',
    'Bathroom', 'Master Bathroom', 'Powder Room', 'Dining Room', 'Office',
    'Family Room', 'Basement', 'Laundry Room', 'Mudroom', 'Pantry',
    'Closet', 'Guest Room', 'Playroom', 'Library', 'Wine Cellar',
    'Garage', 'Patio', 'Balcony', 'Foyer', 'Hallway'
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    setLoading(true);
    try {
      await onSubmit(formData);
    } catch (err) {
      console.error('Error submitting room:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickSelect = (roomName) => {
    setFormData({ ...formData, name: roomName });
  };

  const getPreviewColor = () => {
    return roomColors[formData.name.toLowerCase()] || '#B22222';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center z-50 p-4 overflow-y-auto">
      <div className="rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto mt-4 border-2 border-[#D4A574]" style={{
        background: 'linear-gradient(135deg, rgba(0,0,0,0.98) 0%, rgba(30,30,30,0.95) 20%, rgba(15,15,25,0.98) 40%, rgba(30,30,30,0.95) 60%, rgba(15,15,25,0.98) 80%, rgba(0,0,0,0.98) 100%)',
        boxShadow: '0 0 60px rgba(212, 165, 116, 0.3), inset 0 0 80px rgba(212, 165, 116, 0.05)'
      }}>
        <form onSubmit={handleSubmit}>
          {/* Header */}
          <div className="p-6 border-b-2 border-[#D4A574]">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-[#D4A574]">Add New Room</h2>
              <button
                type="button"
                onClick={onClose}
                className="text-[#D4A574] hover:text-red-400 transition-colors text-2xl"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Room Name */}
            <div>
              <label className="block text-sm font-medium text-[#D4C5A9] mb-2">
                Room Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-3 rounded-lg border-2 border-[#B49B7E] focus:border-[#D4A574] focus:outline-none text-[#D4C5A9]"
                style={{
                  background: 'linear-gradient(135deg, rgba(0,0,0,0.95) 0%, rgba(20,20,30,0.9) 50%, rgba(0,0,0,0.95) 100%)'
                }}
                placeholder="Enter room name..."
                required
              />
              
              {/* Color Preview */}
              {formData.name && (
                <div className="mt-2 flex items-center space-x-2">
                  <div 
                    className="w-4 h-4 rounded border"
                    style={{ 
                      backgroundColor: getRoomColor(formData.name),
                      boxShadow: `0 0 10px ${getRoomColor(formData.name)}60`
                    }}
                  ></div>
                  <span className="text-sm text-[#D4C5A9]">Room color preview</span>
                </div>
              )}
            </div>

            {/* Quick Room Selection */}
            <div>
              <label className="block text-sm font-medium text-[#D4C5A9] mb-2">
                Quick Select Common Rooms
              </label>
              <div className="grid grid-cols-3 gap-3">
                {commonRooms.map((room) => {
                  const roomColor = getRoomColor(room);
                  return (
                    <button
                      key={room}
                      type="button"
                      onClick={() => handleQuickSelect(room)}
                      className={`p-3 rounded-xl border-2 font-bold text-sm transition-all overflow-hidden ${
                        formData.name === room ? 'border-[#D4A574] text-[#D4A574]' : 'border-[#B49B7E] hover:border-[#D4A574] text-[#D4C5A9]'
                      }`}
                      style={{ 
                        background: 'linear-gradient(135deg, rgba(0,0,0,0.95) 0%, rgba(30,30,30,0.9) 30%, rgba(15,15,25,0.95) 70%, rgba(0,0,0,0.95) 100%)',
                        borderTop: `4px solid ${roomColor}`,
                        boxShadow: formData.name === room 
                          ? `0 0 20px ${roomColor}80, 0 -3px 12px ${roomColor}50, inset 0 0 25px ${roomColor}08` 
                          : `0 -2px 6px ${roomColor}30, inset 0 0 15px ${roomColor}04`
                      }}
                    >
                      {room}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-[#D4C5A9] mb-2">
                Description (Optional)
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-3 rounded-lg border-2 border-[#B49B7E] focus:border-[#D4A574] focus:outline-none resize-none text-[#D4C5A9]"
                style={{
                  background: 'linear-gradient(135deg, rgba(0,0,0,0.95) 0%, rgba(20,20,30,0.9) 50%, rgba(0,0,0,0.95) 100%)'
                }}
                rows="3"
                placeholder="Add any notes about this room..."
              />
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 border-t-2 border-[#D4A574] flex justify-end space-x-4">
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
                background: loading || !formData.name.trim() ? 'rgba(212, 165, 116, 0.1)' : 'linear-gradient(135deg, rgba(0,0,0,0.9) 0%, rgba(30,30,30,0.85) 50%, rgba(0,0,0,0.9) 100%)'
              }}
              disabled={loading || !formData.name.trim()}
            >
              {loading ? 'Creating...' : 'Create Room'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddRoomModal;
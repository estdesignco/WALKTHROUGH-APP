import React, { useState } from 'react';

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
    'Garage', 'Patio'
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
      <div className="bg-gray-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto mt-4">
        <form onSubmit={handleSubmit}>
          {/* Header */}
          <div className="p-6 border-b border-gray-700">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white">Add New Room</h2>
              <button
                type="button"
                onClick={onClose}
                className="text-gray-400 hover:text-white transition-colors text-2xl"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Room Name */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Room Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full bg-gray-700 text-white px-4 py-3 rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
                placeholder="Enter room name..."
                required
              />
              
              {/* Color Preview */}
              {formData.name && (
                <div className="mt-2 flex items-center space-x-2">
                  <div 
                    className="w-4 h-4 rounded"
                    style={{ backgroundColor: getPreviewColor() }}
                  ></div>
                  <span className="text-sm text-gray-400">
                    Room color: {getPreviewColor()}
                  </span>
                </div>
              )}
            </div>

            {/* Quick Room Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Quick Select Common Rooms
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {commonRooms.map((room) => (
                  <button
                    key={room}
                    type="button"
                    onClick={() => handleQuickSelect(room)}
                    className={`text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                      formData.name === room
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <div 
                        className="w-3 h-3 rounded"
                        style={{ backgroundColor: roomColors[room.toLowerCase()] || '#B22222' }}
                      ></div>
                      <span>{room}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Description (Optional)
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full bg-gray-700 text-white px-4 py-3 rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none resize-none"
                rows="3"
                placeholder="Add any notes about this room..."
              />
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-gray-700 flex justify-end space-x-4">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 text-gray-400 hover:text-white transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-yellow-600 hover:bg-yellow-700 text-black px-6 py-2 rounded-lg transition-colors font-medium disabled:opacity-50"
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
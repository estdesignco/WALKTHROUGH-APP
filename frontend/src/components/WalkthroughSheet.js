import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';

const WalkthroughSheet = () => {
  const { projectId } = useParams();
  const [project, setProject] = useState(null);
  const [walkthroughData, setWalkthroughData] = useState({
    rooms: [],
    completed: false,
    notes: '',
    photos: [],
    measurements: {}
  });

  useEffect(() => {
    if (projectId) {
      loadProject();
    }
  }, [projectId]);

  const loadProject = async () => {
    try {
      const response = await fetch(`https://code-scanner-14.preview.emergentagent.com/api/projects/${projectId}`);
      if (response.ok) {
        const projectData = await response.json();
        setProject(projectData);
        
        // Initialize walkthrough data based on project rooms
        const walkthroughRooms = projectData.rooms.map(room => ({
          id: room.id,
          name: room.name,
          measurements: {
            length: '',
            width: '',
            height: '',
            windows: [],
            doors: [],
            electrical: [],
            plumbing: []
          },
          photos: [],
          notes: '',
          completed: false,
          checklist: [
            { item: 'Measure room dimensions', completed: false },
            { item: 'Document existing fixtures', completed: false },
            { item: 'Note electrical outlets', completed: false },
            { item: 'Check plumbing locations', completed: false },
            { item: 'Photo documentation', completed: false }
          ]
        }));
        
        setWalkthroughData(prev => ({
          ...prev,
          rooms: walkthroughRooms
        }));
      }
    } catch (error) {
      console.error('Error loading project for walkthrough:', error);
    }
  };

  const updateRoomMeasurement = (roomId, field, value) => {
    setWalkthroughData(prev => ({
      ...prev,
      rooms: prev.rooms.map(room => 
        room.id === roomId 
          ? { ...room, measurements: { ...room.measurements, [field]: value } }
          : room
      )
    }));
  };

  const toggleChecklistItem = (roomId, itemIndex) => {
    setWalkthroughData(prev => ({
      ...prev,
      rooms: prev.rooms.map(room => 
        room.id === roomId 
          ? { 
              ...room, 
              checklist: room.checklist.map((item, index) => 
                index === itemIndex ? { ...item, completed: !item.completed } : item
              )
            }
          : room
      )
    }));
  };

  if (!project) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-500 mx-auto"></div>
          <p className="text-gray-400 mt-4">Loading Walkthrough...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-full mx-auto bg-gray-950 min-h-screen p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="text-center mb-4">
          <h1 className="text-4xl font-bold text-white mb-2" style={{ color: '#8b7355' }}>GREENE</h1>
          <p className="text-gray-300">Walkthrough Documentation</p>
        </div>

        {/* Navigation Tabs */}
        <div className="flex justify-center space-x-8 mb-6">
          <div className="flex items-center space-x-2 text-gray-400">
            <span>📋</span>
            <span>Questionnaire</span>
          </div>
          <div className="flex items-center space-x-2" style={{ color: '#8b7355' }}>
            <span>🚶</span>
            <span className="font-semibold">Walkthrough</span>
          </div>
          <div className="flex items-center space-x-2 text-gray-400">
            <span>✅</span>
            <span>Checklist</span>
          </div>
          <div className="flex items-center space-x-2 text-gray-400">
            <span>📊</span>
            <span>FF&E</span>
          </div>
        </div>
      </div>

      {/* Walkthrough Content */}
      <div className="space-y-6">
        {walkthroughData.rooms.map(room => (
          <div key={room.id} className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-xl font-bold text-white mb-4" style={{ color: '#8b7355' }}>
              🏠 {room.name}
            </h3>
            
            {/* Measurements Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Length (ft)
                </label>
                <input
                  type="number"
                  value={room.measurements.length}
                  onChange={(e) => updateRoomMeasurement(room.id, 'length', e.target.value)}
                  className="w-full bg-gray-700 text-white px-3 py-2 rounded border border-gray-600"
                  placeholder="0.0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Width (ft)
                </label>
                <input
                  type="number"
                  value={room.measurements.width}
                  onChange={(e) => updateRoomMeasurement(room.id, 'width', e.target.value)}
                  className="w-full bg-gray-700 text-white px-3 py-2 rounded border border-gray-600"
                  placeholder="0.0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Height (ft)
                </label>
                <input
                  type="number"
                  value={room.measurements.height}
                  onChange={(e) => updateRoomMeasurement(room.id, 'height', e.target.value)}
                  className="w-full bg-gray-700 text-white px-3 py-2 rounded border border-gray-600"
                  placeholder="0.0"
                />
              </div>
            </div>

            {/* Checklist Section */}
            <div className="mb-6">
              <h4 className="text-lg font-semibold text-white mb-3">Room Walkthrough Checklist</h4>
              <div className="space-y-2">
                {room.checklist.map((item, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={item.completed}
                      onChange={() => toggleChecklistItem(room.id, index)}
                      className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded"
                    />
                    <span className={`${item.completed ? 'text-green-400 line-through' : 'text-gray-300'}`}>
                      {item.item}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Notes Section */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Room Notes
              </label>
              <textarea
                value={room.notes}
                onChange={(e) => setWalkthroughData(prev => ({
                  ...prev,
                  rooms: prev.rooms.map(r => 
                    r.id === room.id ? { ...r, notes: e.target.value } : r
                  )
                }))}
                className="w-full bg-gray-700 text-white px-3 py-2 rounded border border-gray-600"
                rows="4"
                placeholder="Add notes about this room..."
              />
            </div>
          </div>
        ))}
      </div>

      {/* Action Buttons */}
      <div className="flex justify-between mt-8">
        <button className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded">
          Save Draft
        </button>
        <button 
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded"
          style={{ backgroundColor: '#8b7355' }}
        >
          Complete Walkthrough → Generate Checklist
        </button>
      </div>
    </div>
  );
};

export default WalkthroughSheet;
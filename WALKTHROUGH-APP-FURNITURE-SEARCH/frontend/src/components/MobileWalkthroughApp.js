import React, { useState, useEffect } from 'react';

const MobileWalkthroughApp = () => {
  const [currentProject, setCurrentProject] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [currentRoom, setCurrentRoom] = useState(null);
  const [isOffline, setIsOffline] = useState(false);
  const [photos, setPhotos] = useState([]);
  const [measurements, setMeasurements] = useState([]);
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState([]);
  const [syncQueue, setSyncQueue] = useState([]);

  // Sample project structure for walkthrough
  const [projects] = useState([
    {
      id: 'greene_walkthrough',
      name: 'Greene Project - Walkthrough',
      client: 'Ms. Greene',
      address: '1234 Design Lane, Style City',
      status: 'In Progress'
    },
    {
      id: 'johnson_walkthrough', 
      name: 'Johnson House - Site Visit',
      client: 'The Johnson Family',
      address: '5678 Modern Ave, Contemporary Hills',
      status: 'Scheduled'
    }
  ]);

  // Pre-loaded room structure with items
  const roomStructure = {
    'Living Room': {
      color: '#8B4513',
      categories: ['Seating', 'Tables', 'Lighting', 'Rugs', 'Art & Accessories'],
      preloadedItems: [
        'Sofa/Sectional', 'Accent Chairs', 'Coffee Table', 'Side Tables',
        'Floor Lamps', 'Table Lamps', 'Area Rug', 'Artwork', 'Throw Pillows',
        'Window Treatments', 'TV Console', 'Bookshelf'
      ]
    },
    'Kitchen': {
      color: '#228B22',
      categories: ['Appliances', 'Lighting', 'Hardware', 'Seating'],
      preloadedItems: [
        'Refrigerator', 'Range/Cooktop', 'Dishwasher', 'Microwave',
        'Pendant Lights', 'Under-Cabinet Lighting', 'Cabinet Hardware',
        'Bar Stools', 'Kitchen Island', 'Backsplash', 'Countertops'
      ]
    },
    'Master Bedroom': {
      color: '#4169E1', 
      categories: ['Furniture', 'Bedding', 'Lighting', 'Storage'],
      preloadedItems: [
        'Bed Frame', 'Nightstands', 'Dresser', 'Mattress', 'Bedding Set',
        'Table Lamps', 'Ceiling Light', 'Closet Organization', 'Bench',
        'Window Treatments', 'Area Rug', 'Artwork'
      ]
    },
    'Dining Room': {
      color: '#DC143C',
      categories: ['Furniture', 'Lighting', 'Decor'],
      preloadedItems: [
        'Dining Table', 'Dining Chairs', 'Chandelier', 'Sideboard/Buffet',
        'Bar Cart', 'Artwork', 'Window Treatments', 'Area Rug',
        'Table Linens', 'Centerpiece', 'China Cabinet'
      ]
    }
  };

  useEffect(() => {
    // Check online/offline status
    const updateOnlineStatus = () => {
      setIsOffline(!navigator.onLine);
    };
    
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);
    
    updateOnlineStatus();
    
    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
    };
  }, []);

  const selectProject = (project) => {
    setCurrentProject(project);
    // Initialize rooms for the project
    const projectRooms = Object.keys(roomStructure).map((roomName, index) => ({
      id: `room_${index}`,
      name: roomName,
      ...roomStructure[roomName],
      completed: false,
      itemsChecked: 0,
      totalItems: roomStructure[roomName].preloadedItems.length
    }));
    setRooms(projectRooms);
  };

  const selectRoom = (room) => {
    setCurrentRoom(room);
    // Load preloaded items for this room
    const roomItems = room.preloadedItems.map((itemName, index) => ({
      id: `item_${room.id}_${index}`,
      name: itemName,
      checked: false,
      notes: '',
      photos: [],
      measurements: {},
      priority: 'medium'
    }));
    setItems(roomItems);
  };

  const toggleItem = (itemId) => {
    setItems(items.map(item => 
      item.id === itemId 
        ? { ...item, checked: !item.checked }
        : item
    ));
  };

  const addCustomItem = () => {
    const itemName = prompt('Enter custom item name:');
    if (itemName) {
      const newItem = {
        id: `custom_item_${Date.now()}`,
        name: itemName,
        checked: false,
        notes: '',
        photos: [],
        measurements: {},
        priority: 'medium',
        custom: true
      };
      setItems([...items, newItem]);
    }
  };

  const takePhoto = (itemId) => {
    // Simulate taking a photo (in real app, would use camera API)
    const photoUrl = `data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAMCAgM...`; // Sample base64
    const newPhoto = {
      id: `photo_${Date.now()}`,
      itemId: itemId,
      url: photoUrl,
      timestamp: new Date().toISOString(),
      notes: ''
    };
    
    setPhotos([...photos, newPhoto]);
    
    // Add photo to item
    setItems(items.map(item =>
      item.id === itemId
        ? { ...item, photos: [...(item.photos || []), newPhoto] }
        : item
    ));
    
    // Add to sync queue if offline
    if (isOffline) {
      setSyncQueue([...syncQueue, { type: 'photo', data: newPhoto }]);
    }
    
    alert('📸 Photo captured! (Demo)');
  };

  const addMeasurement = (itemId) => {
    const width = prompt('Enter width (inches):');
    const height = prompt('Enter height (inches):');
    const depth = prompt('Enter depth (inches):');
    
    if (width || height || depth) {
      const measurement = {
        id: `measurement_${Date.now()}`,
        itemId: itemId,
        width: parseFloat(width) || 0,
        height: parseFloat(height) || 0,
        depth: parseFloat(depth) || 0,
        unit: 'inches',
        timestamp: new Date().toISOString()
      };
      
      setMeasurements([...measurements, measurement]);
      
      // Add measurement to item
      setItems(items.map(item =>
        item.id === itemId
          ? { ...item, measurements: { ...item.measurements, ...measurement } }
          : item
      ));
      
      // Add to sync queue if offline
      if (isOffline) {
        setSyncQueue([...syncQueue, { type: 'measurement', data: measurement }]);
      }
      
      alert(`📏 Measurement recorded: ${width}"W x ${height}"H x ${depth}"D`);
    }
  };

  const addNoteToItem = (itemId) => {
    const note = prompt('Add note for this item:');
    if (note) {
      setItems(items.map(item =>
        item.id === itemId
          ? { ...item, notes: item.notes + (item.notes ? '\n' : '') + note }
          : item
      ));
      
      // Add to sync queue if offline
      if (isOffline) {
        setSyncQueue([...syncQueue, { 
          type: 'note', 
          data: { itemId, note, timestamp: new Date().toISOString() }
        }]);
      }
    }
  };

  const syncData = async () => {
    if (syncQueue.length === 0) {
      alert('✅ Already synced!');
      return;
    }
    
    // Simulate syncing data to server
    alert(`🔄 Syncing ${syncQueue.length} items to cloud...`);
    
    // In real app, would send data to backend API
    setTimeout(() => {
      setSyncQueue([]);
      alert('✅ All data synced to cloud!');
    }, 2000);
  };

  const completeRoom = () => {
    const checkedItems = items.filter(item => item.checked).length;
    const roomProgress = {
      roomId: currentRoom.id,
      totalItems: items.length,
      completedItems: checkedItems,
      photos: photos.filter(p => items.some(item => item.id === p.itemId)),
      measurements: measurements.filter(m => items.some(item => item.id === m.itemId)),
      completedAt: new Date().toISOString()
    };
    
    // Update room status
    setRooms(rooms.map(room =>
      room.id === currentRoom.id
        ? { ...room, completed: true, itemsChecked: checkedItems }
        : room
    ));
    
    alert(`✅ Room completed! ${checkedItems}/${items.length} items checked.`);
    setCurrentRoom(null);
  };

  // Project Selection Screen
  if (!currentProject) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-black p-4" style={{ fontFamily: 'Century Gothic, sans-serif' }}>
        {/* Header */}
        <div className="bg-gradient-to-r from-[#B49B7E] to-[#A08B6F] rounded-2xl p-6 mb-6 text-center">
          <h1 className="text-2xl font-bold text-black mb-2">📱 MOBILE WALKTHROUGH</h1>
          <p className="text-lg text-black/80">On-Site Project Management</p>
          
          {/* Status Indicators */}
          <div className="flex justify-center gap-4 mt-4">
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${isOffline ? 'bg-red-400' : 'bg-green-400'}`}></div>
              <span className="text-sm font-bold text-black">
                {isOffline ? '📴 OFFLINE MODE' : '🌐 ONLINE'}
              </span>
            </div>
            {syncQueue.length > 0 && (
              <div className="bg-yellow-500/20 px-3 py-1 rounded-full">
                <span className="text-xs font-bold text-black">
                  {syncQueue.length} items to sync
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Project Selection */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-[#B49B7E] mb-4">🏠 Select Project:</h2>
          
          {projects.map((project) => (
            <div
              key={project.id}
              onClick={() => selectProject(project)}
              className="bg-gradient-to-r from-black/80 to-gray-900/90 border-2 border-[#B49B7E]/30 rounded-2xl p-6 cursor-pointer hover:border-[#B49B7E]/60 transition-all duration-300"
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-bold text-[#B49B7E]">{project.name}</h3>
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                  project.status === 'In Progress' 
                    ? 'bg-green-500/20 text-green-400'
                    : 'bg-yellow-500/20 text-yellow-400'
                }`}>
                  {project.status}
                </span>
              </div>
              <p className="text-sm mb-2" style={{ color: '#F5F5DC' }}>
                📋 Client: {project.client}
              </p>
              <p className="text-sm" style={{ color: '#F5F5DC', opacity: '0.7' }}>
                📍 {project.address}
              </p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Room Selection Screen
  if (currentProject && !currentRoom) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-black p-4">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#B49B7E] to-[#A08B6F] rounded-2xl p-4 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-bold text-black">{currentProject.name}</h1>
              <p className="text-sm text-black/80">{currentProject.client}</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentProject(null)}
                className="bg-black/20 px-3 py-1 rounded text-sm font-bold text-black"
              >
                ← Back
              </button>
              {syncQueue.length > 0 && (
                <button
                  onClick={syncData}
                  className="bg-green-600 px-3 py-1 rounded text-sm font-bold text-white"
                >
                  🔄 Sync ({syncQueue.length})
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Room Grid */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-[#B49B7E]">🏠 Select Room to Survey:</h2>
          
          {rooms.map((room) => (
            <div
              key={room.id}
              onClick={() => selectRoom(room)}
              className="bg-gradient-to-r from-black/80 to-gray-900/90 border-2 border-[#B49B7E]/30 rounded-xl p-4 cursor-pointer hover:border-[#B49B7E]/60 transition-all duration-300"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-4 h-4 rounded" 
                    style={{ backgroundColor: room.color }}
                  ></div>
                  <h3 className="text-lg font-bold text-[#B49B7E]">{room.name}</h3>
                </div>
                {room.completed && (
                  <span className="bg-green-500/20 text-green-400 px-2 py-1 rounded-full text-xs font-bold">
                    ✅ COMPLETED
                  </span>
                )}
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex gap-4">
                  {room.categories.map((category, idx) => (
                    <span key={idx} className="bg-[#B49B7E]/20 text-[#B49B7E] px-2 py-1 rounded text-xs">
                      {category}
                    </span>
                  ))}
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold" style={{ color: '#F5F5DC' }}>
                    {room.itemsChecked || 0}/{room.totalItems} items
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Room Walkthrough Screen
  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-black p-4">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#B49B7E] to-[#A08B6F] rounded-xl p-4 mb-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-black">{currentRoom.name}</h1>
            <p className="text-sm text-black/80">{currentProject.client}</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentRoom(null)}
              className="bg-black/20 px-3 py-1 rounded text-sm font-bold text-black"
            >
              ← Rooms
            </button>
            <button
              onClick={completeRoom}
              className="bg-green-600 px-3 py-1 rounded text-sm font-bold text-white"
            >
              ✅ Complete
            </button>
          </div>
        </div>
        
        {/* Progress */}
        <div className="mt-2">
          <div className="flex justify-between text-sm text-black mb-1">
            <span>Progress: {items.filter(i => i.checked).length}/{items.length}</span>
            <span>{Math.round((items.filter(i => i.checked).length / items.length) * 100)}%</span>
          </div>
          <div className="w-full bg-black/20 rounded-full h-2">
            <div 
              className="bg-green-600 h-2 rounded-full transition-all duration-300"
              style={{ 
                width: `${(items.filter(i => i.checked).length / items.length) * 100}%` 
              }}
            ></div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={addCustomItem}
          className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 px-3 py-2 rounded text-sm font-bold text-white"
        >
          ➕ Add Item
        </button>
        <button
          onClick={() => takePhoto('room_general')}
          className="flex-1 bg-gradient-to-r from-purple-600 to-purple-700 px-3 py-2 rounded text-sm font-bold text-white"
        >
          📸 Room Photo
        </button>
        {syncQueue.length > 0 && (
          <button
            onClick={syncData}
            className="bg-gradient-to-r from-green-600 to-green-700 px-3 py-2 rounded text-sm font-bold text-white"
          >
            🔄 Sync
          </button>
        )}
      </div>

      {/* Items Checklist */}
      <div className="space-y-3">
        {items.map((item) => (
          <div
            key={item.id}
            className={`bg-gradient-to-r from-black/80 to-gray-900/90 border-2 rounded-xl p-4 transition-all duration-300 ${
              item.checked 
                ? 'border-green-500/50 bg-green-900/10' 
                : 'border-[#B49B7E]/30'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => toggleItem(item.id)}
                  className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-all duration-300 ${
                    item.checked
                      ? 'bg-green-600 border-green-600 text-white'
                      : 'border-[#B49B7E] text-[#B49B7E]'
                  }`}
                >
                  {item.checked && '✓'}
                </button>
                <span className={`font-bold ${item.checked ? 'text-green-400' : 'text-[#B49B7E]'}`}>
                  {item.name}
                </span>
                {item.custom && (
                  <span className="bg-blue-500/20 text-blue-400 px-2 py-1 rounded text-xs font-bold">
                    CUSTOM
                  </span>
                )}
              </div>
            </div>

            {/* Item Actions */}
            <div className="flex gap-2">
              <button
                onClick={() => takePhoto(item.id)}
                className="flex-1 bg-purple-600/20 border border-purple-500/30 text-purple-400 px-2 py-1 rounded text-xs font-bold"
              >
                📸 Photo
              </button>
              <button
                onClick={() => addMeasurement(item.id)}
                className="flex-1 bg-blue-600/20 border border-blue-500/30 text-blue-400 px-2 py-1 rounded text-xs font-bold"
              >
                📏 Measure
              </button>
              <button
                onClick={() => addNoteToItem(item.id)}
                className="flex-1 bg-yellow-600/20 border border-yellow-500/30 text-yellow-400 px-2 py-1 rounded text-xs font-bold"
              >
                📝 Note
              </button>
            </div>

            {/* Item Details */}
            {(item.photos?.length > 0 || item.notes || Object.keys(item.measurements).length > 0) && (
              <div className="mt-3 pt-3 border-t border-[#B49B7E]/20">
                {item.photos?.length > 0 && (
                  <div className="text-xs text-purple-400 mb-1">
                    📸 {item.photos.length} photo(s)
                  </div>
                )}
                {Object.keys(item.measurements).length > 1 && (
                  <div className="text-xs text-blue-400 mb-1">
                    📏 {item.measurements.width}"W x {item.measurements.height}"H x {item.measurements.depth}"D
                  </div>
                )}
                {item.notes && (
                  <div className="text-xs text-yellow-400">
                    📝 {item.notes}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Bottom Padding */}
      <div className="h-20"></div>
    </div>
  );
};

export default MobileWalkthroughApp;
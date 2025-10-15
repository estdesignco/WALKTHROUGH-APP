import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useOfflineSync } from '../hooks/useOfflineSync';
import MobileAddItemModal from './MobileAddItemModal';
import { exportProjectToCSV, exportProjectSummary, calculateProjectStats } from '../utils/exportUtils';
import { leicaManager } from '../utils/leicaD5Manager';

const API_URL = process.env.REACT_APP_BACKEND_URL + '/api';

export default function WorkingTabbedWalkthrough({ projectId }) {
  const [project, setProject] = useState(null);
  const [activeRoomTab, setActiveRoomTab] = useState(0);
  const [expandedCategories, setExpandedCategories] = useState({});
  const [loading, setLoading] = useState(true);
  const [showAddRoom, setShowAddRoom] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');
  const [roomPhotos, setRoomPhotos] = useState({});
  
  // Photo states
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [measurements, setMeasurements] = useState([]);
  const [drawingArrow, setDrawingArrow] = useState(null);
  const [leicaConnected, setLeicaConnected] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [editingArrow, setEditingArrow] = useState(null); // Which arrow is being edited
  const [photoZoom, setPhotoZoom] = useState(1); // Photo zoom level
  const [photoPan, setPhotoPan] = useState({ x: 0, y: 0 }); // Photo pan position
  
  // Offline sync
  const { online, updateItemOffline } = useOfflineSync(projectId);

  // EXACT DESKTOP COLORS FROM ExactFFESpreadsheet.js
  const getRoomColor = (roomName) => {
    const roomColors = {
      'living room': '#7C3AED',      // Purple
      'dining room': '#DC2626',      // Red
      'kitchen': '#EA580C',          // Orange  
      'primary bedroom': '#059669',  // Green
      'master bedroom': '#059669',   // Green
      'primary bathroom': '#2563EB', // Blue
      'bathroom': '#2563EB',         // Blue
      'master bathroom': '#2563EB',  // Blue
      'powder room': '#7C2D12',      // Brown
      'guest room': '#BE185D',       // Pink
      'office': '#6366F1',           // Indigo
      'laundry room': '#16A34A',     // Green
      'mudroom': '#0891B2',          // Cyan
      'family room': '#CA8A04',      // Yellow
      'basement': '#6B7280',         // Gray
      'attic storage': '#78716C',    // Stone
      'garage': '#374151',           // Gray-800
      'balcony': '#7C3AED',          // Purple
      'foyer': '#EC4899'             // Pink
    };
    return roomColors[roomName.toLowerCase()] || '#7C3AED';
  };

  const getCategoryColor = () => '#065F46';

  useEffect(() => {
    loadProject();
    loadAllPhotos();
  }, [projectId]);

  const loadProject = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/projects/${projectId}?sheet_type=walkthrough`);
      setProject(response.data);
      if (response.data.rooms && response.data.rooms.length > 0) {
        setActiveRoomTab(0);
      }
    } catch (error) {
      console.error('Failed to load project:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAllPhotos = async () => {
    if (!projectId) return;
    try {
      const response = await axios.get(`${API_URL}/projects/${projectId}?sheet_type=walkthrough`);
      const rooms = response.data?.rooms || [];
      
      const photosData = {};
      for (const room of rooms) {
        try {
          const photoResponse = await axios.get(`${API_URL}/photos/by-room/${projectId}/${room.id}`);
          photosData[room.id] = photoResponse.data.photos || [];
        } catch (err) {
          photosData[room.id] = [];
        }
      }
      
      setRoomPhotos(photosData);
    } catch (error) {
      console.error('Failed to load photos:', error);
    }
  };

  const handleAddRoom = async () => {
    if (!newRoomName.trim()) return;
    try {
      await axios.post(`${API_URL}/rooms`, {
        name: newRoomName,
        project_id: projectId,
        sheet_type: 'walkthrough',
        auto_populate: true,
        comprehensive: true,
        color: getRoomColor(newRoomName),
        order_index: project?.rooms?.length || 0
      });
      await loadProject();
      setShowAddRoom(false);
      setNewRoomName('');
      alert('Room added successfully!');
    } catch (error) {
      alert('Failed to add room: ' + error.message);
    }
  };

  const handleDeleteItem = async (itemId) => {
    if (!window.confirm('Delete this item?')) return;
    try {
      await axios.delete(`${API_URL}/items/${itemId}`);
      await loadProject();
    } catch (error) {
      alert('Failed to delete item');
    }
  };

  const handleAddBlankItem = async (subcategoryId) => {
    try {
      await axios.post(`${API_URL}/items`, {
        name: 'New Item',
        vendor: '',
        quantity: '1',
        size: '',
        finish_color: '',
        cost: '',
        status: '',
        subcategory_id: subcategoryId,
        order_index: 0
      });
      await loadProject();
    } catch (error) {
      alert('Failed to add item: ' + error.message);
    }
  };

  // SIMPLE PHOTO CAPTURE
  const handleTakePhoto = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.capture = 'environment';
    
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = async (e) => {
        const photoData = e.target.result;
        
        try {
          await axios.post(`${API_URL}/photos/upload`, {
            project_id: projectId,
            room_id: project.rooms[activeRoomTab]?.id,
            photo_data: photoData,
            file_name: `photo_${project.rooms[activeRoomTab]?.name}_${Date.now()}.jpg`,
            metadata: {
              room_name: project.rooms[activeRoomTab]?.name,
              timestamp: new Date().toISOString(),
              has_measurements: false
            }
          });
          
          alert('Photo saved successfully!');
          await loadAllPhotos();
          
        } catch (error) {
          alert('Photo save failed: ' + error.message);
        }
      };
      reader.readAsDataURL(file);
    };
    
    input.click();
  };

  const connectLeica = async () => {
    if (!leicaManager.isSupported()) {
      alert('Web Bluetooth not supported. Use Chrome on Android or desktop (NOT iPad).');
      return;
    }

    try {
      await leicaManager.connect();
      setLeicaConnected(true);
      alert('Leica D5 Connected! Make sure KEYBOARD MODE is ON in Leica settings.');
    } catch (error) {
      alert('Connection failed: ' + error.message);
    }
  };

  const toggleCategory = (categoryId) => {
    setExpandedCategories(prev => ({ ...prev, [categoryId]: !prev[categoryId] }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full" style={{ backgroundColor: '#0F172A' }}>
        <div className="text-white text-2xl">Loading...</div>
      </div>
    );
  }

  if (!project || !project.rooms || project.rooms.length === 0) {
    return (
      <div className="w-full p-8" style={{ backgroundColor: '#0F172A' }}>
        <div className="text-center">
          <h2 className="text-3xl font-bold text-[#D4A574] mb-4">No Rooms Available</h2>
          <button 
            onClick={() => setShowAddRoom(true)}
            className="px-8 py-4 bg-[#D4A574] hover:bg-[#C49564] text-black rounded-xl font-bold text-xl"
          >
            + ADD FIRST ROOM
          </button>
        </div>
      </div>
    );
  }

  const activeRoom = project.rooms[activeRoomTab];

  return (
    <div className="w-full h-full flex flex-col" style={{ backgroundColor: '#0F172A' }}>
      {/* HEADER */}
      <div className="bg-gradient-to-r from-[#1E293B] to-[#0F172A] p-6 border-b-4 border-[#D4A574]">
        <div className="text-center mb-6">
          <h1 className="text-4xl font-bold text-[#D4A574] mb-2">{project?.name}</h1>
          <div className="text-lg text-[#D4C5A9]">
            {project?.client_info?.full_name} • {project?.client_info?.address}
          </div>
        </div>
        
        <div className="text-center">
          <div className="inline-flex items-center gap-6">
            <button
              onClick={() => setShowAddRoom(true)}
              className="bg-gradient-to-r from-[#B49B7E] to-[#A08B6F] px-8 py-3 rounded-full text-black font-bold"
            >
              ADD ROOM
            </button>
            
            <div className="bg-gradient-to-r from-[#D4A574] to-[#B49B7E] px-8 py-3 rounded-full">
              <span className="text-xl font-bold text-black">WALKTHROUGH</span>
            </div>
            
            <button
              onClick={connectLeica}
              disabled={leicaConnected}
              className={`px-8 py-3 rounded-full font-bold ${leicaConnected ? 'bg-green-600 text-white' : 'bg-gray-700 text-white'}`}
            >
              {leicaConnected ? 'Leica Connected' : 'Connect Leica'}
            </button>
          </div>
        </div>
      </div>

      {/* ROOM TABS */}
      <div className="bg-[#1E293B] border-b-2 border-[#D4A574] overflow-x-auto">
        <div className="flex">
          {project.rooms.map((room, index) => (
            <button
              key={room.id}
              onClick={() => setActiveRoomTab(index)}
              className={`px-6 py-4 font-bold border-b-4 min-w-max ${
                activeRoomTab === index
                  ? 'border-[#D4A574] text-[#D4A574]'
                  : 'border-transparent text-[#B49B7E]'
              }`}
              style={{ 
                backgroundColor: activeRoomTab === index ? getRoomColor(room.name) + '40' : 'transparent',
                borderTopColor: getRoomColor(room.name),
                borderTopWidth: '4px',
                borderTopStyle: 'solid'
              }}
            >
              {room.name}
              <div className="text-xs">{roomPhotos[room.id]?.length || 0} photos</div>
            </button>
          ))}
        </div>
      </div>

      {/* ROOM CONTENT */}
      <div className="flex-1 overflow-auto">
        {activeRoom && (
          <div>
            {/* SPREADSHEET */}
            <div className="p-4">
              {activeRoom.categories?.map((category) => (
                <div key={category.id} className="mb-6">
                  <div 
                    className="border border-[#B49B7E] p-3 font-bold text-[#D4C5A9] cursor-pointer"
                    style={{ backgroundColor: getCategoryColor() }}
                    onClick={() => toggleCategory(category.id)}
                  >
                    <span>{expandedCategories[category.id] ? '▼' : '▶'} {category.name.toUpperCase()}</span>
                  </div>

                  {expandedCategories[category.id] && category.subcategories?.map((subcategory) => (
                    <table key={subcategory.id} className="w-full border-collapse border border-[#B49B7E] mb-4">
                      <thead>
                        <tr>
                          <th className="border border-[#B49B7E] px-1 py-2 text-xs font-bold text-[#D4C5A9] w-8" style={{ backgroundColor: '#8B4444' }}>✓</th>
                          <th className="border border-[#B49B7E] px-2 py-2 text-xs font-bold text-[#D4C5A9]" style={{ backgroundColor: '#8B4444' }}>
                            {subcategory.name.toUpperCase()}
                            <button
                              onClick={() => handleAddBlankItem(subcategory.id)}
                              className="ml-2 bg-green-600 text-white px-2 py-1 rounded text-xs font-bold"
                            >
                              + ADD ITEM
                            </button>
                          </th>
                          <th className="border border-[#B49B7E] px-2 py-2 text-xs font-bold text-[#B49B7E]" style={{ backgroundColor: '#8B4444' }}>VENDOR/SKU</th>
                          <th className="border border-[#B49B7E] px-2 py-2 text-xs font-bold text-[#B49B7E]" style={{ backgroundColor: '#8B4444' }}>QTY</th>
                          <th className="border border-[#B49B7E] px-2 py-2 text-xs font-bold text-[#B49B7E]" style={{ backgroundColor: '#8B4444' }}>SIZE</th>
                          <th className="border border-[#B49B7E] px-2 py-2 text-xs font-bold text-[#B49B7E]" style={{ backgroundColor: '#8B4444' }}>FINISH</th>
                          <th className="border border-[#B49B7E] px-2 py-2 text-xs font-bold text-[#B49B7E]" style={{ backgroundColor: '#8B4444' }}>COST</th>
                          <th className="border border-[#B49B7E] px-2 py-2 text-xs font-bold text-[#B49B7E]" style={{ backgroundColor: '#8B4444' }}>STATUS</th>
                          <th className="border border-[#B49B7E] px-2 py-2 text-xs font-bold text-[#B49B7E]" style={{ backgroundColor: '#8B4444' }}>IMAGE</th>
                          <th className="border border-[#B49B7E] px-2 py-2 text-xs font-bold text-[#B49B7E]" style={{ backgroundColor: '#8B4444' }}>LINK</th>
                          <th className="border border-[#B49B7E] px-2 py-2 text-xs font-bold text-[#B49B7E]" style={{ backgroundColor: '#8B4444' }}>REMARKS</th>
                          <th className="border border-[#B49B7E] px-2 py-2 text-xs font-bold text-[#B49B7E]" style={{ backgroundColor: '#8B4444' }}>DELETE</th>
                        </tr>
                      </thead>
                      <tbody>
                        {subcategory.items?.map((item, itemIndex) => (
                          <tr key={item.id} style={{ 
                            background: itemIndex % 2 === 0 
                              ? 'linear-gradient(135deg, rgba(0, 0, 0, 0.95) 0%, rgba(30, 30, 30, 0.9) 30%, rgba(15, 15, 25, 0.95) 70%, rgba(0, 0, 0, 0.95) 100%)'
                              : 'linear-gradient(135deg, rgba(15, 15, 25, 0.95) 0%, rgba(45, 45, 55, 0.9) 30%, rgba(25, 25, 35, 0.95) 70%, rgba(15, 15, 25, 0.95) 100%)'
                          }}>
                            <td className="border border-[#B49B7E] px-1 py-1 text-center">
                              <input 
                                type="checkbox" 
                                checked={item.status === 'PICKED'}
                                onChange={async (e) => {
                                  const newStatus = e.target.checked ? 'PICKED' : '';
                                  await updateItemOffline(item.id, { status: newStatus });
                                }}
                              />
                            </td>
                            <td className="border border-[#B49B7E] px-2 py-1 text-[#B49B7E] text-sm">
                              <div 
                                contentEditable
                                suppressContentEditableWarning
                                onBlur={(e) => updateItemOffline(item.id, { name: e.target.textContent })}
                                className="outline-none"
                              >
                                {item.name}
                              </div>
                            </td>
                            <td className="border border-[#B49B7E] px-2 py-1 text-[#B49B7E] text-sm">
                              <div 
                                contentEditable
                                suppressContentEditableWarning
                                onBlur={(e) => updateItemOffline(item.id, { vendor: e.target.textContent })}
                                className="outline-none"
                              >
                                {item.vendor || ''}
                              </div>
                            </td>
                            <td className="border border-[#B49B7E] px-2 py-1 text-[#B49B7E] text-sm text-center">
                              <div 
                                contentEditable
                                suppressContentEditableWarning
                                onBlur={(e) => updateItemOffline(item.id, { quantity: e.target.textContent })}
                                className="outline-none"
                              >
                                {item.quantity || ''}
                              </div>
                            </td>
                            <td className="border border-[#B49B7E] px-2 py-1 text-[#B49B7E] text-sm">
                              <div 
                                contentEditable
                                suppressContentEditableWarning
                                onBlur={(e) => updateItemOffline(item.id, { size: e.target.textContent })}
                                className="outline-none"
                              >
                                {item.size || ''}
                              </div>
                            </td>
                            <td className="border border-[#B49B7E] px-2 py-1 text-[#B49B7E] text-sm">
                              <div 
                                contentEditable
                                suppressContentEditableWarning
                                onBlur={(e) => updateItemOffline(item.id, { finish_color: e.target.textContent })}
                                className="outline-none"
                              >
                                {item.finish_color || ''}
                              </div>
                            </td>
                            <td className="border border-[#B49B7E] px-2 py-1 text-[#B49B7E] text-sm">
                              <div 
                                contentEditable
                                suppressContentEditableWarning
                                onBlur={(e) => updateItemOffline(item.id, { cost: e.target.textContent })}
                                className="outline-none"
                              >
                                {item.cost || ''}
                              </div>
                            </td>
                            <td className="border border-[#B49B7E] px-1 py-1">
                              <select
                                value={item.status || ''}
                                onChange={(e) => updateItemOffline(item.id, { status: e.target.value })}
                                className="w-full bg-gray-700 text-[#B49B7E] text-xs px-1 py-1 rounded"
                              >
                                <option value="">Select</option>
                                <option value="PICKED">PICKED</option>
                                <option value="TO BE PICKED">TO BE PICKED</option>
                                <option value="ORDER SAMPLES">ORDER SAMPLES</option>
                                <option value="SAMPLES ARRIVED">SAMPLES ARRIVED</option>
                                <option value="ASK NEIL">ASK NEIL</option>
                                <option value="ASK CHARLENE">ASK CHARLENE</option>
                                <option value="ASK JALA">ASK JALA</option>
                                <option value="GET QUOTE">GET QUOTE</option>
                                <option value="WAITING ON QT">WAITING ON QT</option>
                                <option value="READY FOR PRESENTATION">READY FOR PRESENTATION</option>
                              </select>
                            </td>
                            <td className="border border-[#B49B7E] px-1 py-1 text-center">
                              {item.image_url ? (
                                <img src={item.image_url} alt={item.name} className="w-12 h-12 object-cover rounded" />
                              ) : (
                                <div className="w-12 h-12 bg-gray-700 rounded flex items-center justify-center text-xs">No Img</div>
                              )}
                            </td>
                            <td className="border border-[#B49B7E] px-1 py-1 text-center">
                              {item.link ? (
                                <a href={item.link} target="_blank" rel="noopener noreferrer" className="text-[#D4A574] text-xs">
                                  View
                                </a>
                              ) : (
                                <span className="text-gray-500 text-xs">-</span>
                              )}
                            </td>
                            <td className="border border-[#B49B7E] px-2 py-1 text-[#B49B7E] text-sm">
                              <div 
                                contentEditable
                                suppressContentEditableWarning
                                onBlur={(e) => updateItemOffline(item.id, { notes: e.target.textContent })}
                                className="outline-none"
                              >
                                {item.notes || ''}
                              </div>
                            </td>
                            <td className="border border-[#B49B7E] px-1 py-1 text-center">
                              <button 
                                onClick={() => handleDeleteItem(item.id)}
                                className="text-red-400 text-sm font-bold"
                              >
                                🗑️
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ))}
                </div>
              ))}
            </div>

            {/* PHOTO SECTION */}
            <div className="bg-[#1E293B] p-6 border-t-4 border-[#D4A574]">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-2xl font-bold text-[#D4A574]">📸 {activeRoom.name} Photos</h3>
                <button
                  onClick={handleTakePhoto}
                  className="bg-[#D4A574] hover:bg-[#C49564] text-black px-6 py-3 rounded-xl font-bold"
                >
                  📸 Take Photo
                </button>
              </div>

              <div className="grid grid-cols-6 gap-4">
                {(roomPhotos[activeRoom.id] || []).map((photo, index) => (
                  <div
                    key={photo.id || index}
                    className="border-2 border-[#D4A574]/50 rounded-xl overflow-hidden hover:border-[#D4A574] cursor-pointer"
                    onClick={() => {
                      setSelectedPhoto(photo);
                      setMeasurements([]); // Start fresh
                    }}
                  >
                    <img 
                      src={photo.photo_data} 
                      alt={photo.file_name}
                      className="w-full h-32 object-cover"
                    />
                    <div className="bg-black text-white text-xs p-2 text-center">
                      {photo.metadata?.measurement_count ? 
                        `📏 ${photo.metadata.measurement_count} measurements` : 
                        'Photo only'
                      }
                    </div>
                  </div>
                ))}
                
                <button
                  onClick={handleTakePhoto}
                  className="h-32 border-2 border-dashed border-[#D4A574]/50 rounded-xl hover:border-[#D4A574] flex items-center justify-center"
                >
                  <div className="text-center text-[#D4A574]">
                    <div className="text-3xl mb-1">📸</div>
                    <div className="text-sm font-bold">Add Photo</div>
                  </div>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ADVANCED PHOTO EDITOR WITH ALL FEATURES */}
      {selectedPhoto && (
        <div className="fixed inset-0 bg-black z-50 flex flex-col">
          {/* MINIMAL HEADER */}
          <div className="bg-[#1E293B] p-4 border-b-2 border-[#D4A574] flex justify-between items-center">
            <h3 className="text-2xl font-bold text-[#D4A574]">📏 {activeRoom.name} Measurements</h3>
            <button onClick={() => setSelectedPhoto(null)} className="text-[#D4A574] text-3xl">✕</button>
          </div>

          {/* MEASUREMENT CONTROLS - COMPACT AT TOP */}
          <div className="bg-[#0F172A] p-4 border-b border-[#D4A574]/30">
            <div className="flex gap-3 items-center flex-wrap">
              {/* Leica Controls */}
              <div className="flex gap-2">
                {leicaConnected && (
                  <button
                    onClick={() => {
                      const measurement = prompt('Your Leica shows measurement. Enter it here:', '10\'4');
                      if (measurement) {
                        alert('✅ Ready to place: ' + measurement + '\nDraw arrow on photo now!');
                        window.pendingMeasurement = measurement;
                      }
                    }}
                    className="px-4 py-2 bg-gradient-to-r from-yellow-500 to-yellow-600 text-black rounded-xl font-bold"
                  >
                    📏 GET LEICA
                  </button>
                )}
                
                <button
                  onClick={() => {
                    const measurement = prompt('Enter measurement manually:', '8\'6');
                    if (measurement) {
                      alert('✅ Ready to place: ' + measurement + '\nDraw arrow on photo now!');
                      window.pendingMeasurement = measurement;
                    }
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-xl font-bold"
                >
                  📝 MANUAL
                </button>
              </div>

              {/* Arrow Color Picker */}
              <div className="flex gap-2 items-center">
                <span className="text-[#D4A574] font-bold text-sm">Arrow Color:</span>
                {[
                  { color: '#FFD700', name: 'Gold' },
                  { color: '#FF6B6B', name: 'Red' },
                  { color: '#4ECDC4', name: 'Teal' },
                  { color: '#95E1D3', name: 'Mint' },
                  { color: '#F38181', name: 'Pink' },
                  { color: '#AA96DA', name: 'Purple' },
                  { color: '#FCBAD3', name: 'Rose' },
                  { color: '#FFFFD2', name: 'Cream' }
                ].map((colorOption) => (
                  <button
                    key={colorOption.color}
                    onClick={() => {
                      window.selectedArrowColor = colorOption.color;
                      alert('✅ Arrow color set to ' + colorOption.name);
                    }}
                    className="w-8 h-8 rounded-full border-2 border-white hover:scale-110 transition-all"
                    style={{ backgroundColor: colorOption.color }}
                    title={colorOption.name}
                  />
                ))}
              </div>

              {/* Quick Actions */}
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setMeasurements([]);
                    window.pendingMeasurement = null;
                  }}
                  className="px-4 py-2 bg-red-600 text-white rounded-xl font-bold"
                >
                  🗑️ Clear All
                </button>
                
                <button
                  onClick={() => setPhotoZoom(prev => Math.min(prev + 0.5, 3))}
                  className="px-3 py-2 bg-gray-700 text-white rounded-xl font-bold"
                >
                  🔍+ Zoom In
                </button>
                
                <button
                  onClick={() => setPhotoZoom(prev => Math.max(prev - 0.5, 0.5))}
                  className="px-3 py-2 bg-gray-700 text-white rounded-xl font-bold"
                >
                  🔍- Zoom Out
                </button>
                
                <button
                  onClick={() => {
                    setPhotoZoom(1);
                    setPhotoPan({ x: 0, y: 0 });
                  }}
                  className="px-3 py-2 bg-gray-700 text-white rounded-xl font-bold"
                >
                  🎯 Reset View
                </button>
                
                <div className="text-[#D4C5A9] px-4 py-2 bg-gray-800 rounded-xl font-bold">
                  {measurements.length} arrows • {Math.round(photoZoom * 100)}% zoom
                </div>
              </div>
            </div>
          </div>

          {/* LARGE PHOTO - TAKES UP MOST OF SCREEN */}
          <div className="flex-1 p-6 flex items-center justify-center bg-black">
            <div className="relative max-w-full max-h-full">
              <img 
                src={selectedPhoto.photo_data}
                alt={selectedPhoto.file_name}
                className="max-w-full max-h-[75vh] object-contain border-4 border-[#D4A574] rounded-2xl cursor-crosshair shadow-2xl"
                style={{ minWidth: '60vw', minHeight: '50vh' }}
                onMouseDown={(e) => {
                  const rect = e.target.getBoundingClientRect();
                  const x = ((e.clientX - rect.left) / rect.width) * 100;
                  const y = ((e.clientY - rect.top) / rect.height) * 100;
                  console.log('🎯 Starting arrow at:', x, y);
                  setDrawingArrow({ 
                    x1: x, y1: y, x2: x, y2: y, 
                    color: window.selectedArrowColor || '#FFD700' 
                  });
                }}
                onMouseMove={(e) => {
                  if (!drawingArrow) return;
                  const rect = e.target.getBoundingClientRect();
                  const x = ((e.clientX - rect.left) / rect.width) * 100;
                  const y = ((e.clientY - rect.top) / rect.height) * 100;
                  setDrawingArrow({ ...drawingArrow, x2: x, y2: y });
                }}
                onMouseUp={() => {
                  if (!drawingArrow) return;
                  const dx = drawingArrow.x2 - drawingArrow.x1;
                  const dy = drawingArrow.y2 - drawingArrow.y1;
                  const length = Math.sqrt(dx * dx + dy * dy);
                  
                  if (length > 3) {
                    const text = window.pendingMeasurement || prompt('Enter measurement:', "8'6");
                    if (text && text.trim()) {
                      setMeasurements(prev => [...prev, {
                        ...drawingArrow,
                        text: text.trim(),
                        color: drawingArrow.color
                      }]);
                      window.pendingMeasurement = null;
                      console.log('✅ Arrow created with measurement:', text);
                    }
                  } else {
                    console.log('❌ Arrow too short, not saving');
                  }
                  setDrawingArrow(null);
                }}
                onTouchStart={(e) => {
                  const touch = e.touches[0];
                  const rect = e.target.getBoundingClientRect();
                  const x = ((touch.clientX - rect.left) / rect.width) * 100;
                  const y = ((touch.clientY - rect.top) / rect.height) * 100;
                  setDrawingArrow({ 
                    x1: x, y1: y, x2: x, y2: y, 
                    color: window.selectedArrowColor || '#FFD700' 
                  });
                }}
                onTouchMove={(e) => {
                  if (!drawingArrow) return;
                  const touch = e.touches[0];
                  const rect = e.target.getBoundingClientRect();
                  const x = ((touch.clientX - rect.left) / rect.width) * 100;
                  const y = ((touch.clientY - rect.top) / rect.height) * 100;
                  setDrawingArrow({ ...drawingArrow, x2: x, y2: y });
                }}
                onTouchEnd={() => {
                  if (!drawingArrow) return;
                  const dx = drawingArrow.x2 - drawingArrow.x1;
                  const dy = drawingArrow.y2 - drawingArrow.y1;
                  const length = Math.sqrt(dx * dx + dy * dy);
                  
                  if (length > 3) {
                    const text = window.pendingMeasurement || prompt('Enter measurement:', "8'6");
                    if (text && text.trim()) {
                      setMeasurements(prev => [...prev, {
                        ...drawingArrow,
                        text: text.trim(),
                        color: drawingArrow.color
                      }]);
                      window.pendingMeasurement = null;
                    }
                  }
                  setDrawingArrow(null);
                }}
                draggable={false}
              />
              
              {/* ENHANCED SVG ARROWS - SMALLER AND MOVABLE */}
              <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none" style={{ zIndex: 10 }}>
                <defs>
                  {/* Dynamic markers for each color - SMALLER */}
                  {[...new Set([...measurements.map(m => m.color), drawingArrow?.color].filter(Boolean))].map(color => (
                    <marker key={color} id={`arrow-${color.replace('#', '')}`} markerWidth="6" markerHeight="6" refX="5" refY="2" orient="auto">
                      <polygon points="0 0, 6 2, 0 4" fill={color} />
                    </marker>
                  ))}
                </defs>
                
                {/* Measurement arrows with colors - SMALLER AND DRAGGABLE */}
                {measurements.map((m, index) => (
                  <g key={index}>
                    {/* Arrow line - draggable */}
                    <line
                      x1={m.x1} y1={m.y1} x2={m.x2} y2={m.y2}
                      stroke={m.color} strokeWidth="0.8"
                      markerEnd={`url(#arrow-${m.color.replace('#', '')})`}
                      style={{ cursor: 'move', pointerEvents: 'auto' }}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        window.draggingArrow = index;
                        const rect = e.target.closest('svg').getBoundingClientRect();
                        window.dragOffset = {
                          x: e.clientX - rect.left - ((m.x1 + m.x2) / 2 / 100 * rect.width),
                          y: e.clientY - rect.top - ((m.y1 + m.y2) / 2 / 100 * rect.height)
                        };
                      }}
                    />
                    
                    {/* Resize handles at both ends - SMALL CIRCLES */}
                    <circle
                      cx={m.x1} cy={m.y1} r="0.8"
                      fill={m.color} stroke="white" strokeWidth="0.2"
                      style={{ cursor: 'nw-resize', pointerEvents: 'auto' }}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        window.resizingArrow = { index, end: 'start' };
                      }}
                    />
                    <circle
                      cx={m.x2} cy={m.y2} r="0.8"  
                      fill={m.color} stroke="white" strokeWidth="0.2"
                      style={{ cursor: 'nw-resize', pointerEvents: 'auto' }}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        window.resizingArrow = { index, end: 'end' };
                      }}
                    />
                  </g>
                ))}
                
                {/* Drawing arrow - smaller */}
                {drawingArrow && (
                  <line
                    x1={drawingArrow.x1} y1={drawingArrow.y1} x2={drawingArrow.x2} y2={drawingArrow.y2}
                    stroke={drawingArrow.color} strokeWidth="0.8" opacity="0.8"
                  />
                )}
                
                {/* Global mouse handlers for dragging/resizing */}
                <rect
                  width="100" height="100" fill="transparent"
                  style={{ pointerEvents: window.draggingArrow !== undefined || window.resizingArrow ? 'auto' : 'none' }}
                  onMouseMove={(e) => {
                    const rect = e.target.closest('svg').getBoundingClientRect();
                    const x = ((e.clientX - rect.left) / rect.width) * 100;
                    const y = ((e.clientY - rect.top) / rect.height) * 100;
                    
                    if (window.draggingArrow !== undefined) {
                      // Move entire arrow
                      const arrowIndex = window.draggingArrow;
                      const currentArrow = measurements[arrowIndex];
                      const centerX = (currentArrow.x1 + currentArrow.x2) / 2;
                      const centerY = (currentArrow.y1 + currentArrow.y2) / 2;
                      const deltaX = x - centerX;
                      const deltaY = y - centerY;
                      
                      setMeasurements(prev => prev.map((arrow, i) => 
                        i === arrowIndex ? {
                          ...arrow,
                          x1: arrow.x1 + deltaX,
                          y1: arrow.y1 + deltaY,
                          x2: arrow.x2 + deltaX,
                          y2: arrow.y2 + deltaY
                        } : arrow
                      ));
                    } else if (window.resizingArrow) {
                      // Resize arrow end
                      const { index, end } = window.resizingArrow;
                      setMeasurements(prev => prev.map((arrow, i) => 
                        i === index ? {
                          ...arrow,
                          [end === 'start' ? 'x1' : 'x2']: x,
                          [end === 'start' ? 'y1' : 'y2']: y
                        } : arrow
                      ));
                    }
                  }}
                  onMouseUp={() => {
                    if (window.draggingArrow !== undefined) {
                      console.log('✅ Finished moving arrow', window.draggingArrow);
                      window.draggingArrow = undefined;
                    }
                    if (window.resizingArrow) {
                      console.log('✅ Finished resizing arrow', window.resizingArrow.index);
                      window.resizingArrow = undefined;
                    }
                  }}
                />
              </svg>
              
              {/* SMALL MEASUREMENT LABELS - DON'T BLOCK PHOTO */}
              {measurements.map((m, index) => (
                <div
                  key={index}
                  className="absolute cursor-pointer"
                  style={{
                    left: `${(m.x1 + m.x2) / 2}%`,
                    top: `${(m.y1 + m.y2) / 2 - 2}%`,
                    transform: 'translate(-50%, -100%)',
                    zIndex: 20
                  }}
                  onClick={() => {
                    const options = [
                      'Edit measurement text',
                      'Change arrow color', 
                      'Delete this arrow'
                    ];
                    const choice = prompt('Choose action:\n1. ' + options.join('\n2. '));
                    
                    if (choice === '1') {
                      const newText = prompt('Edit measurement:', m.text);
                      if (newText) {
                        setMeasurements(prev => prev.map((arrow, i) => 
                          i === index ? { ...arrow, text: newText } : arrow
                        ));
                      }
                    } else if (choice === '2') {
                      const colors = ['#FFD700', '#FF6B6B', '#4ECDC4', '#95E1D3', '#F38181', '#AA96DA', '#FCBAD3', '#FFFFD2'];
                      const colorNames = ['Gold', 'Red', 'Teal', 'Mint', 'Pink', 'Purple', 'Rose', 'Cream'];
                      const colorChoice = prompt('Choose color:\n1. Gold\n2. Red\n3. Teal\n4. Mint\n5. Pink\n6. Purple\n7. Rose\n8. Cream');
                      if (colorChoice && colors[colorChoice - 1]) {
                        setMeasurements(prev => prev.map((arrow, i) => 
                          i === index ? { ...arrow, color: colors[colorChoice - 1] } : arrow
                        ));
                      }
                    } else if (choice === '3') {
                      setMeasurements(measurements.filter((_, i) => i !== index));
                    }
                  }}
                >
                  <div 
                    className="bg-black bg-opacity-90 px-2 py-1 rounded text-xs font-bold border"
                    style={{ 
                      color: m.color,
                      borderColor: m.color,
                      minWidth: 'max-content'
                    }}
                  >
                    {m.text}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setMeasurements(measurements.filter((_, i) => i !== index));
                      }}
                      className="ml-1 text-red-400 hover:text-red-300 text-xs"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ENHANCED SAVE & EXPORT CONTROLS */}
          <div className="bg-[#1E293B] p-4 border-t-2 border-[#D4A574]">
            <div className="grid grid-cols-3 gap-4">
              {/* Save to Room */}
              <button
                onClick={async () => {
                  if (measurements.length === 0) {
                    alert('Add some measurements first!');
                    return;
                  }
                
                  try {
                    setUploading(true);
                    
                    // Create annotated photo
                    const img = new Image();
                    img.src = selectedPhoto.photo_data;
                    
                    await new Promise((resolve) => {
                      img.onload = resolve;
                    });

                    const canvas = document.createElement('canvas');
                    canvas.width = img.width;
                    canvas.height = img.height;
                    const ctx = canvas.getContext('2d');

                    // Draw image
                    ctx.drawImage(img, 0, 0);

                    // Draw smaller, refined arrows
                    measurements.forEach((m) => {
                      const x1 = (m.x1 / 100) * canvas.width;
                      const y1 = (m.y1 / 100) * canvas.height;
                      const x2 = (m.x2 / 100) * canvas.width;
                      const y2 = (m.y2 / 100) * canvas.height;

                      // Draw arrow line - thinner
                      ctx.strokeStyle = m.color;
                      ctx.lineWidth = 4; // Reduced from 8
                      ctx.beginPath();
                      ctx.moveTo(x1, y1);
                      ctx.lineTo(x2, y2);
                      ctx.stroke();

                      // Draw smaller arrowhead
                      const angle = Math.atan2(y2 - y1, x2 - x1);
                      const headlen = 20; // Reduced from 30
                      
                      ctx.fillStyle = m.color;
                      ctx.beginPath();
                      ctx.moveTo(x2, y2);
                      ctx.lineTo(
                        x2 - headlen * Math.cos(angle - Math.PI / 6),
                        y2 - headlen * Math.sin(angle - Math.PI / 6)
                      );
                      ctx.lineTo(
                        x2 - headlen * Math.cos(angle + Math.PI / 6),
                        y2 - headlen * Math.sin(angle + Math.PI / 6)
                      );
                      ctx.closePath();
                      ctx.fill();

                      // Draw smaller text
                      const midX = (x1 + x2) / 2;
                      const midY = (y1 + y2) / 2 - 25; // Reduced offset
                      
                      ctx.font = 'bold 28px Arial'; // Reduced from 42px
                      const textWidth = ctx.measureText(m.text).width;
                      
                      // Smaller text background
                      ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
                      ctx.fillRect(midX - textWidth / 2 - 8, midY - 20, textWidth + 16, 35);
                      
                      // Text with color
                      ctx.fillStyle = m.color;
                      ctx.textAlign = 'center';
                      ctx.fillText(m.text, midX, midY);
                      
                      // Thinner border around text
                      ctx.strokeStyle = m.color;
                      ctx.lineWidth = 2; // Reduced from 3
                      ctx.strokeRect(midX - textWidth / 2 - 8, midY - 20, textWidth + 16, 35);
                    });

                    const annotatedPhoto = canvas.toDataURL('image/jpeg', 0.9);

                    // Save to room folder
                    await axios.post(`${API_URL}/photos/upload`, {
                      project_id: projectId,
                      room_id: activeRoom.id,
                      photo_data: annotatedPhoto,
                      file_name: `measurements_${activeRoom.name}_${Date.now()}.jpg`,
                      metadata: {
                        room_name: activeRoom.name,
                        timestamp: new Date().toISOString(),
                        measurements: measurements.map(m => ({ text: m.text, color: m.color })),
                        measurement_count: measurements.length,
                        has_measurements: true,
                        original_photo_id: selectedPhoto.id
                      }
                    });
                    
                    alert(`✅ Photo saved to ${activeRoom.name} folder with ${measurements.length} measurements!`);
                    await loadAllPhotos();
                    
                  } catch (error) {
                    alert('Save failed: ' + error.message);
                  } finally {
                    setUploading(false);
                  }
                }}
                disabled={uploading || measurements.length === 0}
                className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 disabled:from-gray-600 disabled:to-gray-700 text-white px-4 py-3 rounded-2xl font-bold"
              >
                {uploading ? '⏳ Saving...' : `💾 Save to Room (${measurements.length})`}
              </button>
              
              {/* Export to Desktop */}
              <button
                onClick={async () => {
                  if (measurements.length === 0) {
                    alert('Add measurements first!');
                    return;
                  }
                  
                  try {
                    // Export photo with measurements to desktop app
                    await axios.post(`${API_URL}/photos/export-to-desktop`, {
                      project_id: projectId,
                      room_id: activeRoom.id,
                      photo_id: selectedPhoto.id,
                      measurements: measurements
                    });
                    
                    alert('✅ Photo exported to Desktop App! Check the main project.');
                  } catch (error) {
                    alert('Desktop export failed: ' + error.message);
                  }
                }}
                disabled={measurements.length === 0}
                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-gray-600 disabled:to-gray-700 text-white px-4 py-3 rounded-2xl font-bold"
              >
                🗺 Export to Desktop
              </button>
              
              {/* Export to Canva */}
              <button
                onClick={async () => {
                  if (measurements.length === 0) {
                    alert('Add measurements first!');
                    return;
                  }
                  
                  try {
                    // Export photo with measurements to Canva
                    await axios.post(`${API_URL}/canva/upload-measurement-photo`, {
                      project_id: projectId,
                      room_id: activeRoom.id,
                      room_name: activeRoom.name,
                      photo_data: selectedPhoto.photo_data,
                      measurements: measurements
                    });
                    
                    alert('✅ Photo exported to Canva! Check your Canva uploads folder.');
                  } catch (error) {
                    alert('Canva export failed: ' + error.message);
                  }
                }}
                disabled={measurements.length === 0}
                className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 disabled:from-gray-600 disabled:to-gray-700 text-white px-4 py-3 rounded-2xl font-bold"
              >
                🎨 Export to Canva
              </button>
            </div>
            
            {/* Close Button */}
            <button
              onClick={() => {
                setSelectedPhoto(null);
                setMeasurements([]);
              }}
              className="w-full mt-4 bg-gray-600 hover:bg-gray-700 text-white px-8 py-3 rounded-2xl font-bold"
            >
              ✕ Close Editor
            </button>
          </div>
        </div>
      )}

      {/* ADD ROOM MODAL */}
      {showAddRoom && (
        <div className="fixed inset-0 bg-black bg-opacity-95 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1E293B] rounded-2xl p-8 max-w-2xl w-full border-2 border-[#D4A574]">
            <h3 className="text-3xl font-bold text-[#D4A574] mb-6">Add New Room</h3>
            
            <div className="mb-6">
              <input
                type="text"
                value={newRoomName}
                onChange={(e) => setNewRoomName(e.target.value)}
                placeholder="Enter room name..."
                className="w-full bg-gray-700 text-white px-6 py-4 rounded-xl text-xl"
                onKeyPress={(e) => e.key === 'Enter' && handleAddRoom()}
              />
            </div>

            <div className="grid grid-cols-3 gap-4 mb-6">
              {['Living Room', 'Kitchen', 'Master Bedroom', 'Bathroom', 'Office', 'Dining Room'].map((roomName) => (
                <button
                  key={roomName}
                  onClick={() => setNewRoomName(roomName)}
                  className="p-4 bg-gray-700 hover:bg-gray-600 text-white rounded-xl font-bold"
                >
                  {roomName}
                </button>
              ))}
            </div>

            <div className="flex gap-6">
              <button onClick={() => setShowAddRoom(false)} className="flex-1 bg-gray-600 text-white px-8 py-4 rounded-xl font-bold">
                Cancel
              </button>
              <button onClick={handleAddRoom} className="flex-1 bg-green-600 text-white px-8 py-4 rounded-xl font-bold">
                Add Room
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
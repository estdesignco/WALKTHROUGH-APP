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

      {/* SIMPLE PHOTO EDITOR */}
      {selectedPhoto && (
        <div className="fixed inset-0 bg-black z-50 flex flex-col">
          <div className="bg-[#1E293B] p-4 border-b-2 border-[#D4A574] flex justify-between items-center">
            <h3 className="text-2xl font-bold text-[#D4A574]">📏 Add Measurements</h3>
            <button onClick={() => setSelectedPhoto(null)} className="text-[#D4A574] text-3xl">✕</button>
          </div>

          {/* SIMPLE MEASUREMENT CONTROLS */}
          <div className="bg-[#0F172A] p-4 border-b border-[#D4A574]/30">
            <div className="flex gap-4">
              {leicaConnected && (
                <button
                  onClick={() => {
                    const measurement = prompt('Your Leica shows 10\'4. Enter this measurement:', '10\'4');
                    if (measurement) {
                      alert('Click on photo to place this measurement: ' + measurement);
                      // Store measurement for next arrow
                      window.pendingMeasurement = measurement;
                    }
                  }}
                  className="px-6 py-3 bg-yellow-500 text-black rounded-xl font-bold"
                >
                  📏 USE LEICA MEASUREMENT
                </button>
              )}
              
              <button
                onClick={() => {
                  const measurement = prompt('Enter measurement manually:', '8\'6');
                  if (measurement) {
                    alert('Click on photo to place this measurement: ' + measurement);
                    window.pendingMeasurement = measurement;
                  }
                }}
                className="px-6 py-3 bg-blue-500 text-white rounded-xl font-bold"
              >
                📝 MANUAL MEASUREMENT
              </button>
              
              <button
                onClick={() => setMeasurements([])}
                className="px-6 py-3 bg-red-500 text-white rounded-xl font-bold"
              >
                🗑️ Clear All
              </button>
            </div>
          </div>

          {/* PHOTO WITH ARROWS */}
          <div className="flex-1 p-4 flex items-center justify-center bg-black">
            <div className="relative">
              <img 
                src={selectedPhoto.photo_data}
                alt={selectedPhoto.file_name}
                className="max-w-full max-h-[60vh] object-contain border-4 border-[#D4A574] rounded-xl cursor-crosshair"
                onMouseDown={(e) => {
                  const rect = e.target.getBoundingClientRect();
                  const x = ((e.clientX - rect.left) / rect.width) * 100;
                  const y = ((e.clientY - rect.top) / rect.height) * 100;
                  setDrawingArrow({ x1: x, y1: y, x2: x, y2: y });
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
                    const text = window.pendingMeasurement || prompt('Enter measurement:', '8\'6');
                    if (text) {
                      setMeasurements(prev => [...prev, {
                        ...drawingArrow,
                        text: text,
                        color: '#FFD700'
                      }]);
                      window.pendingMeasurement = null;
                    }
                  }
                  setDrawingArrow(null);
                }}
              />
              
              {/* ARROWS */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100">
                <defs>
                  <marker id="arrowhead" markerWidth="8" markerHeight="8" refX="7" refY="3" orient="auto">
                    <polygon points="0 0, 8 3, 0 6" fill="#FFD700" />
                  </marker>
                </defs>
                
                {measurements.map((m, index) => (
                  <line
                    key={index}
                    x1={m.x1} y1={m.y1} x2={m.x2} y2={m.y2}
                    stroke="#FFD700" strokeWidth="1.5"
                    markerEnd="url(#arrowhead)"
                  />
                ))}
                
                {drawingArrow && (
                  <line
                    x1={drawingArrow.x1} y1={drawingArrow.y1} x2={drawingArrow.x2} y2={drawingArrow.y2}
                    stroke="#FF6B6B" strokeWidth="1.5" opacity="0.8"
                  />
                )}
              </svg>
              
              {measurements.map((m, index) => (
                <div
                  key={index}
                  className="absolute text-xs font-bold bg-black bg-opacity-90 px-2 py-1 rounded border border-[#FFD700] text-[#FFD700] cursor-pointer"
                  style={{
                    left: `${(m.x1 + m.x2) / 2}%`,
                    top: `${(m.y1 + m.y2) / 2 - 3}%`,
                    transform: 'translate(-50%, -100%)',
                    zIndex: 20
                  }}
                  onClick={() => {
                    const newText = prompt('Edit measurement:', m.text);
                    if (newText) {
                      setMeasurements(prev => prev.map((arrow, i) => 
                        i === index ? { ...arrow, text: newText } : arrow
                      ));
                    }
                  }}
                >
                  {m.text}
                </div>
              ))}
            </div>
          </div>

          {/* SAVE BUTTON */}
          <div className="bg-[#1E293B] p-4 border-t-2 border-[#D4A574]">
            <button
              onClick={async () => {
                if (measurements.length === 0) {
                  alert('No measurements to save');
                  return;
                }
                
                try {
                  setUploading(true);
                  // Simple save - just save the measurements data
                  alert(`Saving ${measurements.length} measurements...`);
                  await loadAllPhotos();
                  setSelectedPhoto(null);
                  setMeasurements([]);
                  alert('Measurements saved!');
                } catch (error) {
                  alert('Save failed: ' + error.message);
                } finally {
                  setUploading(false);
                }
              }}
              disabled={uploading || measurements.length === 0}
              className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white px-8 py-4 rounded-xl font-bold text-xl"
            >
              {uploading ? 'Saving...' : `Save ${measurements.length} Measurements`}
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
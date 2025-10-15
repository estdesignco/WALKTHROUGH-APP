import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useOfflineSync } from '../hooks/useOfflineSync';
import { exportProjectToCSV, exportProjectSummary, calculateProjectStats } from '../utils/exportUtils';
import { leicaManager } from '../utils/leicaD5Manager';

const API_URL = process.env.REACT_APP_BACKEND_URL + '/api';

export default function TabbedFFESpreadsheet({ projectId }) {
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
  const [editingArrow, setEditingArrow] = useState(null);
  
  const displayProject = project;
  
  // Offline sync
  const { online, updateItemOffline } = useOfflineSync(projectId);

  // EXACT DESKTOP FFE COLORS
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
  const statuses = ['PICKED', 'ORDERED', 'SHIPPED', 'DELIVERED TO RECEIVER', 'DELIVERED TO JOB SITE', 'INSTALLED'];
  const carriers = ['FedEx', 'UPS', 'USPS', 'DHL', 'Other'];

  useEffect(() => {
    loadProject();
    loadAllPhotos();
  }, [projectId]);

  const loadProject = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/projects/${projectId}?sheet_type=ffe`);
      setProject(response.data);
      if (response.data.rooms && response.data.rooms.length > 0) {
        setActiveRoomTab(0);
      }
    } catch (error) {
      console.error('Failed to load FFE project:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAllPhotos = async () => {
    if (!projectId) return;
    try {
      const response = await axios.get(`${API_URL}/projects/${projectId}?sheet_type=ffe`);
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
        sheet_type: 'ffe',
        auto_populate: true,
        comprehensive: true,
        color: getRoomColor(newRoomName),
        order_index: project?.rooms?.length || 0
      });
      await loadProject();
      setShowAddRoom(false);
      setNewRoomName('');
      alert('FFE Room added successfully!');
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

  // SAME SIMPLE PHOTO CAPTURE AS WORKING VERSION
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
            file_name: `ffe_photo_${project.rooms[activeRoomTab]?.name}_${Date.now()}.jpg`,
            metadata: {
              room_name: project.rooms[activeRoomTab]?.name,
              timestamp: new Date().toISOString(),
              has_measurements: false,
              sheet_type: 'ffe'
            }
          });
          
          alert('FFE Photo saved successfully!');
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
        <div className="text-white text-2xl">Loading FFE...</div>
      </div>
    );
  }

  if (!project || !project.rooms || project.rooms.length === 0) {
    return (
      <div className="w-full p-8" style={{ backgroundColor: '#0F172A' }}>
        <div className="text-center">
          <h2 className="text-3xl font-bold text-[#D4A574] mb-4">No FFE Rooms Available</h2>
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
      {/* EXACT SAME HEADER AS WORKING WALKTHROUGH */}
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
              <span className="text-xl font-bold text-black">FF&E SPREADSHEET</span>
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

      {/* ROOM TABS - SAME AS WORKING VERSION */}
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

      {/* FFE ROOM CONTENT */}
      <div className="flex-1 overflow-auto">
        {activeRoom && (
          <div>
            {/* FFE TABLE - EXACT DESKTOP STRUCTURE */}
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
                    <React.Fragment key={subcategory.id}>
                      {/* FFE HEADERS - COMPLEX LIKE DESKTOP */}
                      <table className="w-full border-collapse border border-[#B49B7E] mb-4 mt-2">
                        <thead>
                          {/* Row 1: Section Headers */}
                          <tr>
                            <td colSpan="4" className="border border-[#B49B7E] px-2 py-1 text-xs font-bold text-white text-center" 
                                style={{ backgroundColor: '#8B4444' }}></td>
                            <td colSpan="3" className="border border-[#B49B7E] px-2 py-1 text-xs font-bold text-white text-center" 
                                style={{ backgroundColor: '#8B4513' }}>ADDITIONAL INFO.</td>
                            <td colSpan="5" className="border border-[#B49B7E] px-2 py-1 text-xs font-bold text-white text-center" 
                                style={{ backgroundColor: '#6B46C1' }}>SHIPPING INFO.</td>
                            <td colSpan="3" className="border border-[#B49B7E] px-2 py-1 text-xs font-bold text-white text-center" 
                                style={{ backgroundColor: '#8B4444' }}></td>
                          </tr>
                          
                          {/* Row 2: Column Headers */}
                          <tr>
                            <th className="border border-[#B49B7E] px-2 py-2 text-xs font-bold text-white" style={{ backgroundColor: '#8B4444' }}>INSTALLED</th>
                            <th className="border border-[#B49B7E] px-2 py-2 text-xs font-bold text-white" style={{ backgroundColor: '#8B4444' }}>QTY</th>
                            <th className="border border-[#B49B7E] px-2 py-2 text-xs font-bold text-white" style={{ backgroundColor: '#8B4444' }}>SIZE</th>
                            <th className="border border-[#B49B7E] px-2 py-2 text-xs font-bold text-white" style={{ backgroundColor: '#6B46C1' }}>STATUS</th>
                            <th className="border border-[#B49B7E] px-2 py-2 text-xs font-bold text-white" style={{ backgroundColor: '#8B4444' }}>VENDOR</th>
                            <th className="border border-[#B49B7E] px-2 py-2 text-xs font-bold text-white" style={{ backgroundColor: '#8B4444' }}>IMAGE</th>
                            <th className="border border-[#B49B7E] px-2 py-2 text-xs font-bold text-white" style={{ backgroundColor: '#8B4444' }}>LINK</th>
                            <th className="border border-[#B49B7E] px-2 py-2 text-xs font-bold text-white" style={{ backgroundColor: '#6B46C1' }}>ORDER DATE</th>
                            <th className="border border-[#B49B7E] px-2 py-2 text-xs font-bold text-white" style={{ backgroundColor: '#6B46C1' }}>STATUS/ORDER#</th>
                            <th className="border border-[#B49B7E] px-2 py-2 text-xs font-bold text-white" style={{ backgroundColor: '#6B46C1' }}>EST DATES</th>
                            <th className="border border-[#B49B7E] px-2 py-2 text-xs font-bold text-white" style={{ backgroundColor: '#6B46C1' }}>INSTALL/SHIP TO</th>
                            <th className="border border-[#B49B7E] px-2 py-2 text-xs font-bold text-white" style={{ backgroundColor: '#6B46C1' }}>TRACKING/CARRIER</th>
                            <th className="border border-[#B49B7E] px-2 py-2 text-xs font-bold text-white" style={{ backgroundColor: '#8B4444' }}>NOTES</th>
                            <th className="border border-[#B49B7E] px-2 py-2 text-xs font-bold text-white" style={{ backgroundColor: '#8B4444' }}>LINK</th>
                            <th className="border border-[#B49B7E] px-2 py-2 text-xs font-bold text-white" style={{ backgroundColor: '#DC2626' }}>DELETE</th>
                          </tr>
                        </thead>
                        <tbody>
                          {subcategory.items?.map((item, itemIndex) => (
                            <tr key={item.id} style={{ 
                              background: itemIndex % 2 === 0 
                                ? 'linear-gradient(135deg, rgba(0, 0, 0, 0.95) 0%, rgba(30, 30, 30, 0.9) 30%, rgba(15, 15, 25, 0.95) 70%, rgba(0, 0, 0, 0.95) 100%)'
                                : 'linear-gradient(135deg, rgba(15, 15, 25, 0.95) 0%, rgba(45, 45, 55, 0.9) 30%, rgba(25, 25, 35, 0.95) 70%, rgba(15, 15, 25, 0.95) 100%)'
                            }}>
                              <td className="border border-[#B49B7E] px-2 py-1 text-[#B49B7E] text-sm">
                                <div contentEditable suppressContentEditableWarning
                                     onBlur={(e) => updateItemOffline(item.id, { name: e.target.textContent })}
                                     className="outline-none">{item.name}</div>
                              </td>
                              <td className="border border-[#B49B7E] px-2 py-1 text-[#B49B7E] text-sm text-center">
                                <div contentEditable suppressContentEditableWarning
                                     onBlur={(e) => updateItemOffline(item.id, { quantity: e.target.textContent })}
                                     className="outline-none">{item.quantity || '-'}</div>
                              </td>
                              <td className="border border-[#B49B7E] px-2 py-1 text-[#B49B7E] text-sm">
                                <div contentEditable suppressContentEditableWarning
                                     onBlur={(e) => updateItemOffline(item.id, { size: e.target.textContent })}
                                     className="outline-none">{item.size || '-'}</div>
                              </td>
                              <td className="border border-[#B49B7E] px-1 py-1">
                                <select value={item.status || ''} onChange={(e) => updateItemOffline(item.id, { status: e.target.value })}
                                        className="w-full bg-gray-700 text-[#B49B7E] text-xs px-1 py-1 rounded">
                                  <option value="">Select</option>
                                  {statuses.map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                              </td>
                              <td className="border border-[#B49B7E] px-2 py-1 text-[#B49B7E] text-sm">
                                <div contentEditable suppressContentEditableWarning
                                     onBlur={(e) => updateItemOffline(item.id, { vendor: e.target.textContent })}
                                     className="outline-none">{item.vendor || '-'}</div>
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
                                  <a href={item.link} target="_blank" rel="noopener noreferrer" className="text-[#D4A574] text-xs">View</a>
                                ) : (
                                  <span className="text-gray-500 text-xs">-</span>
                                )}
                              </td>
                              <td className="border border-[#B49B7E] px-1 py-1">
                                <input type="date" value={item.order_date || ''} onChange={(e) => updateItemOffline(item.id, { order_date: e.target.value })}
                                       className="w-full bg-gray-700 text-white text-xs border-none" />
                              </td>
                              <td className="border border-[#B49B7E] px-1 py-1">
                                <div className="flex flex-col gap-1">
                                  <select value={item.status || ''} onChange={(e) => updateItemOffline(item.id, { status: e.target.value })}
                                          className="w-full bg-gray-700 text-white text-xs px-1 py-1 rounded">
                                    <option value="">Status</option>
                                    {statuses.map(s => <option key={s} value={s}>{s}</option>)}
                                  </select>
                                  <input type="text" placeholder="Order #" value={item.order_number || ''}
                                         onChange={(e) => updateItemOffline(item.id, { order_number: e.target.value })}
                                         className="w-full bg-gray-700 text-white text-xs px-1 py-1 rounded" />
                                </div>
                              </td>
                              <td className="border border-[#B49B7E] px-1 py-1">
                                <div className="flex flex-col gap-1">
                                  <input type="date" className="w-full bg-gray-700 text-white text-xs border-none" />
                                  <input type="date" value={item.delivery_date || ''} onChange={(e) => updateItemOffline(item.id, { delivery_date: e.target.value })}
                                         className="w-full bg-gray-700 text-white text-xs border-none" />
                                </div>
                              </td>
                              <td className="border border-[#B49B7E] px-1 py-1">
                                <div className="flex flex-col gap-1">
                                  <input type="date" className="w-full bg-gray-700 text-white text-xs border-none" />
                                  <select className="w-full bg-gray-700 text-white text-xs px-1 py-1 rounded">
                                    <option value="">Ship To</option>
                                    <option value="JOB SITE">JOB SITE</option>
                                    <option value="RECEIVER">RECEIVER</option>
                                  </select>
                                </div>
                              </td>
                              <td className="border border-[#B49B7E] px-1 py-1">
                                <div className="flex flex-col gap-1">
                                  <input type="text" placeholder="Tracking #" value={item.tracking_number || ''}
                                         onChange={(e) => updateItemOffline(item.id, { tracking_number: e.target.value })}
                                         className="w-full bg-gray-700 text-white text-xs px-1 py-1 rounded" />
                                  <select value={item.carrier || ''} onChange={(e) => updateItemOffline(item.id, { carrier: e.target.value })}
                                          className="w-full bg-gray-700 text-white text-xs px-1 py-1 rounded">
                                    <option value="">Carrier</option>
                                    {carriers.map(c => <option key={c} value={c}>{c}</option>)}
                                  </select>
                                </div>
                              </td>
                              <td className="border border-[#B49B7E] px-2 py-1 text-[#B49B7E] text-sm">
                                <div contentEditable suppressContentEditableWarning
                                     onBlur={(e) => updateItemOffline(item.id, { notes: e.target.textContent })}
                                     className="outline-none">{item.notes || ''}</div>
                              </td>
                              <td className="border border-[#B49B7E] px-1 py-1 text-center">
                                {item.link ? (
                                  <a href={item.link} target="_blank" rel="noopener noreferrer" className="text-[#D4A574] text-xs">View</a>
                                ) : (
                                  <span className="text-gray-500 text-xs">-</span>
                                )}
                              </td>
                              <td className="border border-[#B49B7E] px-1 py-1 text-center">
                                <button onClick={() => handleDeleteItem(item.id)} className="text-red-400 text-sm font-bold">🗑️</button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </React.Fragment>
                  ))}
                </div>
              ))}
            </div>

            {/* PHOTO SECTION - SAME AS WORKING WALKTHROUGH */}
            <div className="bg-[#1E293B] p-6 border-t-4 border-[#D4A574]">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-2xl font-bold text-[#D4A574]">📸 {activeRoom.name} FF&E Photos</h3>
                <button onClick={handleTakePhoto} className="bg-[#D4A574] hover:bg-[#C49564] text-black px-6 py-3 rounded-xl font-bold">
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
                      setMeasurements([]);
                    }}
                  >
                    <img src={photo.photo_data} alt={photo.file_name} className="w-full h-32 object-cover" />
                    <div className="bg-black text-white text-xs p-2 text-center">
                      {photo.metadata?.measurement_count ? 
                        `📏 ${photo.metadata.measurement_count} measurements` : 
                        'Photo only'
                      }
                    </div>
                  </div>
                ))}
                
                <button onClick={handleTakePhoto}
                        className="h-32 border-2 border-dashed border-[#D4A574]/50 rounded-xl hover:border-[#D4A574] flex items-center justify-center">
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

      {/* SAME WORKING PHOTO EDITOR FROM WALKTHROUGH */}
      {selectedPhoto && (
        <div className="fixed inset-0 bg-black z-50 flex flex-col">
          <div className="bg-[#1E293B] p-4 border-b-2 border-[#D4A574] flex justify-between items-center">
            <h3 className="text-2xl font-bold text-[#D4A574]">📏 {activeRoom.name} Measurements</h3>
            <button onClick={() => setSelectedPhoto(null)} className="text-[#D4A574] text-3xl">✕</button>
          </div>

          {/* MEASUREMENT CONTROLS */}
          <div className="bg-[#0F172A] p-4 border-b border-[#D4A574]/30">
            <div className="flex gap-3 items-center flex-wrap">
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
                  />
                ))}
              </div>

              <div className="flex gap-2">
                <button onClick={() => { setMeasurements([]); window.pendingMeasurement = null; }}
                        className="px-4 py-2 bg-red-600 text-white rounded-xl font-bold">🗑️ Clear All</button>
                <div className="text-[#D4C5A9] px-4 py-2 bg-gray-800 rounded-xl font-bold">{measurements.length} arrows</div>
              </div>
            </div>
          </div>

          {/* LARGE PHOTO */}
          <div className="flex-1 p-6 flex items-center justify-center bg-black">
            <div className="relative">
              <img 
                src={selectedPhoto.photo_data}
                alt={selectedPhoto.file_name}
                className="max-w-full max-h-[75vh] object-contain border-4 border-[#D4A574] rounded-2xl cursor-crosshair shadow-2xl"
                style={{ minWidth: '60vw', minHeight: '50vh' }}
                onMouseDown={(e) => {
                  if (editingArrow !== null) return;
                  const rect = e.target.getBoundingClientRect();
                  const x = ((e.clientX - rect.left) / rect.width) * 100;
                  const y = ((e.clientY - rect.top) / rect.height) * 100;
                  setDrawingArrow({ x1: x, y1: y, x2: x, y2: y, color: window.selectedArrowColor || '#FFD700' });
                }}
                onMouseMove={(e) => {
                  if (!drawingArrow || editingArrow !== null) return;
                  const rect = e.target.getBoundingClientRect();
                  const x = ((e.clientX - rect.left) / rect.width) * 100;
                  const y = ((e.clientY - rect.top) / rect.height) * 100;
                  setDrawingArrow({ ...drawingArrow, x2: x, y2: y });
                }}
                onMouseUp={() => {
                  if (!drawingArrow || editingArrow !== null) return;
                  const dx = drawingArrow.x2 - drawingArrow.x1;
                  const dy = drawingArrow.y2 - drawingArrow.y1;
                  const length = Math.sqrt(dx * dx + dy * dy);
                  
                  if (length > 3) {
                    const text = window.pendingMeasurement || prompt('Enter measurement:', "8'6");
                    if (text && text.trim()) {
                      setMeasurements(prev => [...prev, { ...drawingArrow, text: text.trim(), color: drawingArrow.color }]);
                      window.pendingMeasurement = null;
                    }
                  }
                  setDrawingArrow(null);
                }}
              />
              
              <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none" style={{ zIndex: 10 }}>
                <defs>
                  {[...new Set([...measurements.map(m => m.color), drawingArrow?.color].filter(Boolean))].map(color => (
                    <marker key={color} id={`ffe-arrow-${color.replace('#', '')}`} markerWidth="6" markerHeight="6" refX="5" refY="2" orient="auto">
                      <polygon points="0 0, 6 2, 0 4" fill={color} />
                    </marker>
                  ))}
                </defs>
                
                {measurements.map((m, index) => (
                  <line key={index} x1={m.x1} y1={m.y1} x2={m.x2} y2={m.y2}
                        stroke={m.color} strokeWidth="0.8" markerEnd={`url(#ffe-arrow-${m.color.replace('#', '')})`}
                        className="cursor-pointer" onClick={() => setEditingArrow(editingArrow === index ? null : index)} />
                ))}
                
                {drawingArrow && (
                  <line x1={drawingArrow.x1} y1={drawingArrow.y1} x2={drawingArrow.x2} y2={drawingArrow.y2}
                        stroke={drawingArrow.color} strokeWidth="0.8" opacity="0.8" />
                )}
              </svg>
              
              {measurements.map((m, index) => (
                <div key={index} className="absolute cursor-pointer"
                     style={{ left: `${(m.x1 + m.x2) / 2}%`, top: `${(m.y1 + m.y2) / 2 - 2}%`,
                              transform: 'translate(-50%, -100%)', zIndex: 20 }}
                     onClick={() => {
                       const newText = prompt('Edit measurement:', m.text);
                       if (newText) {
                         setMeasurements(prev => prev.map((arrow, i) => 
                           i === index ? { ...arrow, text: newText } : arrow
                         ));
                       }
                     }}>
                  <div className="bg-black bg-opacity-90 px-2 py-1 rounded text-xs font-bold border"
                       style={{ color: m.color, borderColor: m.color }}>{m.text}</div>
                </div>
              ))}
            </div>
          </div>

          {/* FFE SAVE CONTROLS */}
          <div className="bg-[#1E293B] p-4 border-t-2 border-[#D4A574]">
            <button
              onClick={async () => {
                if (measurements.length === 0) { alert('Add measurements first!'); return; }
                try {
                  setUploading(true);
                  alert(`Saving ${measurements.length} FFE measurements...`);
                  await loadAllPhotos();
                  setSelectedPhoto(null);
                  setMeasurements([]);
                  alert('FFE Measurements saved!');
                } catch (error) {
                  alert('Save failed: ' + error.message);
                } finally {
                  setUploading(false);
                }
              }}
              disabled={uploading || measurements.length === 0}
              className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white px-8 py-4 rounded-xl font-bold text-xl"
            >
              {uploading ? 'Saving...' : `Save ${measurements.length} FFE Measurements`}
            </button>
          </div>
        </div>
      )}

      {/* ADD ROOM MODAL - SAME AS WORKING VERSION */}
      {showAddRoom && (
        <div className="fixed inset-0 bg-black bg-opacity-95 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1E293B] rounded-2xl p-8 max-w-2xl w-full border-2 border-[#D4A574]">
            <h3 className="text-3xl font-bold text-[#D4A574] mb-6">Add New FFE Room</h3>
            
            <div className="mb-6">
              <input type="text" value={newRoomName} onChange={(e) => setNewRoomName(e.target.value)}
                     placeholder="Enter room name..." className="w-full bg-gray-700 text-white px-6 py-4 rounded-xl text-xl"
                     onKeyPress={(e) => e.key === 'Enter' && handleAddRoom()} />
            </div>

            <div className="grid grid-cols-3 gap-4 mb-6">
              {['Living Room', 'Kitchen', 'Master Bedroom', 'Bathroom', 'Office', 'Dining Room'].map((roomName) => (
                <button key={roomName} onClick={() => setNewRoomName(roomName)}
                        className="p-4 bg-gray-700 hover:bg-gray-600 text-white rounded-xl font-bold">{roomName}</button>
              ))}
            </div>

            <div className="flex gap-6">
              <button onClick={() => setShowAddRoom(false)} className="flex-1 bg-gray-600 text-white px-8 py-4 rounded-xl font-bold">Cancel</button>
              <button onClick={handleAddRoom} className="flex-1 bg-green-600 text-white px-8 py-4 rounded-xl font-bold">Add Room</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
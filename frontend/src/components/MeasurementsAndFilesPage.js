import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL + '/api';

export default function MeasurementsAndFilesPage({ projectId }) {
  const [project, setProject] = useState(null);
  const [photosByRoom, setPhotosByRoom] = useState({});
  const [expandedRooms, setExpandedRooms] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [uploading, setUploading] = useState(false);
  
  useEffect(() => {
    loadAllData();
  }, [projectId]);

  const loadAllData = async () => {
    try {
      setLoading(true);
      
      // Load project to get room info
      const projectResponse = await axios.get(`${API_URL}/projects/${projectId}?sheet_type=walkthrough`);
      setProject(projectResponse.data);
      
      // Load all photos
      const photosResponse = await axios.get(`${API_URL}/photos/project/${projectId}`);
      const allPhotos = photosResponse.data.photos || [];
      
      // Group photos by room
      const grouped = {};
      allPhotos.forEach(photo => {
        const roomId = photo.room_id || 'no_room';
        if (!grouped[roomId]) {
          grouped[roomId] = [];
        }
        grouped[roomId].push(photo);
      });
      
      setPhotosByRoom(grouped);
      
      // Expand all rooms by default
      const expanded = {};
      Object.keys(grouped).forEach(roomId => {
        expanded[roomId] = true;
      });
      setExpandedRooms(expanded);
      
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRoomColor = (roomName) => {
    const roomColors = {
      'living room': '#7C3AED',
      'dining room': '#DC2626',
      'kitchen': '#EA580C',
      'primary bedroom': '#059669',
      'master bedroom': '#059669',
      'primary bathroom': '#2563EB',
      'bathroom': '#2563EB',
      'master bathroom': '#2563EB',
      'powder room': '#7C2D12',
      'guest room': '#BE185D',
      'office': '#6366F1',
      'laundry room': '#16A34A',
      'mudroom': '#0891B2',
      'family room': '#CA8A04',
      'basement': '#6B7280',
    };
    return roomColors[roomName.toLowerCase()] || '#7C3AED';
  };

  const exportToCanva = async (photo) => {
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      img.src = photo.photo_data;
      
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });
      
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      
      if (photo.metadata?.measurements) {
        photo.metadata.measurements.forEach((m) => {
          const x1 = (m.x1 / 100) * canvas.width;
          const y1 = (m.y1 / 100) * canvas.height;
          const x2 = (m.x2 / 100) * canvas.width;
          const y2 = (m.y2 / 100) * canvas.height;
          
          ctx.strokeStyle = m.color || '#FFD700';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.stroke();
          
          const angle = Math.atan2(y2 - y1, x2 - x1);
          const headLength = 15;
          ctx.beginPath();
          ctx.moveTo(x2, y2);
          ctx.lineTo(x2 - headLength * Math.cos(angle - Math.PI / 6), y2 - headLength * Math.sin(angle - Math.PI / 6));
          ctx.lineTo(x2 - headLength * Math.cos(angle + Math.PI / 6), y2 - headLength * Math.sin(angle + Math.PI / 6));
          ctx.closePath();
          ctx.fillStyle = m.color || '#FFD700';
          ctx.fill();
          
          const textX = (x1 + x2) / 2;
          const textY = (y1 + y2) / 2 - 10;
          ctx.font = 'bold 16px Arial';
          ctx.fillStyle = '#000000';
          ctx.strokeStyle = '#FFFFFF';
          ctx.lineWidth = 4;
          ctx.strokeText(m.text || '', textX, textY);
          ctx.fillStyle = m.color || '#FFD700';
          ctx.fillText(m.text || '', textX, textY);
        });
      }
      
      canvas.toBlob(async (blob) => {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `canva_export_${photo.file_name || 'measurement'}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        alert('✅ Photo exported for Canva!\n\nThe image has been downloaded with all measurements.');
      }, 'image/png');
    } catch (error) {
      console.error('Export failed:', error);
      alert('❌ Export failed: ' + error.message);
    }
  };

  const handleDeletePhoto = async (photoId) => {
    if (!window.confirm('Delete this photo?')) return;
    try {
      await axios.delete(`${API_URL}/photos/${photoId}`);
      alert('✅ Photo deleted');
      await loadAllData();
      setSelectedPhoto(null);
    } catch (error) {
      alert('❌ Delete failed');
    }
  };

  const downloadPhoto = (photo) => {
    const link = document.createElement('a');
    link.href = photo.photo_data;
    link.download = photo.file_name || 'measurement_photo.jpg';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    alert('✅ Photo downloaded!');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full" style={{ backgroundColor: '#0F172A' }}>
        <div className="text-white text-2xl">Loading Measurements...</div>
      </div>
    );
  }

  const totalPhotos = Object.values(photosByRoom).reduce((sum, photos) => sum + photos.length, 0);
  const measuredPhotos = Object.values(photosByRoom).flat().filter(p => p.metadata?.has_measurements).length;

  return (
    <div className="w-full h-full flex flex-col" style={{ backgroundColor: '#0F172A' }}>
      {/* EXACT DESKTOP HEADER */}
      <div className="bg-gradient-to-r from-[#1E293B] to-[#0F172A] p-6 border-b-4 border-[#D4A574] shadow-2xl">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-6">
            <h1 className="text-5xl font-bold text-[#D4A574] mb-2 tracking-wide">
              {project?.name || 'PROJECT NAME'}
            </h1>
            <div className="text-xl text-[#D4C5A9] font-medium">
              {project?.client_info?.full_name || 'Client Name'} • {project?.client_info?.address || 'Address'}
            </div>
          </div>
          
          <div className="text-center">
            <div className="bg-gradient-to-r from-[#D4A574] to-[#B49B7E] px-8 py-3 rounded-full inline-block">
              <span className="text-2xl font-bold text-black tracking-wider">📐 MEASUREMENTS & FILES</span>
            </div>
            <div className="mt-4 text-[#D4C5A9] text-lg">
              {totalPhotos} Total Photos • {measuredPhotos} With Measurements
            </div>
          </div>
        </div>
      </div>

      {/* ROOM FOLDERS - EXACT DESKTOP STYLE */}
      <div className="flex-1 overflow-auto p-4">
        {project?.rooms?.map((room) => {
          const roomPhotos = photosByRoom[room.id] || [];
          const roomColor = getRoomColor(room.name);
          
          return (
            <div key={room.id} className="mb-6">
              {/* ROOM HEADER - EXACT DESKTOP STYLE */}
              <div 
                className="border border-[#B49B7E] p-3 font-bold text-white shadow-lg cursor-pointer"
                style={{ backgroundColor: roomColor }}
                onClick={() => setExpandedRooms(prev => ({ ...prev, [room.id]: !prev[room.id] }))}
              >
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <span>{expandedRooms[room.id] ? '▼' : '▶'}</span>
                    <span className="text-xl">{room.name.toUpperCase()}</span>
                    <span className="bg-white text-black px-3 py-1 rounded-full text-sm font-bold">
                      {roomPhotos.length} photos
                    </span>
                    {roomPhotos.filter(p => p.metadata?.has_measurements).length > 0 && (
                      <span className="bg-[#FFD700] text-black px-3 py-1 rounded-full text-sm font-bold">
                        📏 {roomPhotos.filter(p => p.metadata?.has_measurements).length} measured
                      </span>
                    )}
                  </div>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        // Bulk export for this room
                        roomPhotos.filter(p => p.metadata?.has_measurements).forEach(async (photo, i) => {
                          await exportToCanva(photo);
                          await new Promise(r => setTimeout(r, 500));
                        });
                      }}
                      className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-xl font-bold text-sm"
                    >
                      🎨 Export All
                    </button>
                  </div>
                </div>
              </div>

              {/* ROOM PHOTOS GRID */}
              {expandedRooms[room.id] && (
                <div className="bg-[#1E293B] border border-[#B49B7E] border-t-0 p-4">
                  {roomPhotos.length === 0 ? (
                    <div className="text-center py-8 text-[#B49B7E]">
                      No photos in this room
                    </div>
                  ) : (
                    <div className="grid grid-cols-6 gap-3">
                      {roomPhotos.map((photo, index) => (
                        <div
                          key={photo.id || index}
                          className="relative border-2 border-[#D4A574]/50 rounded-xl overflow-hidden hover:border-[#D4A574] transition-all cursor-pointer group"
                          onClick={() => setSelectedPhoto(photo)}
                        >
                          <img src={photo.photo_data} alt={photo.file_name} className="w-full h-32 object-cover" />
                          <div className="absolute inset-x-0 bottom-0 bg-black bg-opacity-90 text-white text-xs p-2">
                            {photo.metadata?.has_measurements ? (
                              <div className="text-[#FFD700] font-bold">📏 {photo.metadata?.measurement_count || 0}</div>
                            ) : (
                              <div className="text-gray-400">No measurements</div>
                            )}
                            {photo.metadata?.notes && (
                              <div className="text-gray-300 truncate text-xs">{photo.metadata.notes}</div>
                            )}
                          </div>
                          <div className="absolute inset-0 bg-[#D4A574]/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <div className="text-white font-bold">👁️</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
        
        {/* NO ROOMS FOUND */}
        {(!project?.rooms || project.rooms.length === 0) && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📐</div>
            <div className="text-2xl text-[#D4C5A9] mb-2">No rooms found</div>
            <div className="text-lg text-[#B49B7E]">Add rooms in the Walkthrough section</div>
          </div>
        )}
      </div>

      {/* PHOTO DETAIL MODAL - DESKTOP STYLE */}
      {selectedPhoto && (
        <div className="fixed inset-0 bg-black z-50 flex flex-col">
          <div className="bg-[#1E293B] p-4 border-b-2 border-[#D4A574]">
            <div className="flex justify-between items-center">
              <h3 className="text-2xl font-bold text-[#D4A574]">
                📏 {selectedPhoto.metadata?.room_name || 'Photo'}
                {selectedPhoto.metadata?.has_measurements && (
                  <span className="ml-3 text-[#FFD700]">• {selectedPhoto.metadata?.measurement_count || 0} measurements</span>
                )}
              </h3>
              <button onClick={() => setSelectedPhoto(null)} className="text-[#D4A574] text-3xl hover:text-red-400">✕</button>
            </div>
            {selectedPhoto.metadata?.notes && (
              <div className="mt-2 text-[#D4C5A9] italic">📝 {selectedPhoto.metadata.notes}</div>
            )}
          </div>

          <div className="flex-1 p-4 flex items-center justify-center bg-black overflow-auto">
            <div className="relative inline-block">
              <img 
                src={selectedPhoto.photo_data} 
                alt={selectedPhoto.file_name} 
                className="max-w-full max-h-[75vh] border-2 border-[#D4A574] rounded-xl" 
                style={{ display: 'block' }}
              />
              
              {selectedPhoto.metadata?.measurements && (
                <svg className="absolute top-0 left-0 w-full h-full pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none" style={{ zIndex: 10 }}>
                  <defs>
                    {['#FFD700', '#FF6B6B', '#4ECDC4', '#95E1D3', '#F38181', '#AA96DA', '#FCBAD3', '#FFFFD2'].map((color) => (
                      <marker key={color} id={`view-arrow-${color.replace('#', '')}`} markerWidth="4" markerHeight="4" refX="3" refY="1.5" orient="auto">
                        <polygon points="0 0, 4 1.5, 0 3" fill={color} />
                      </marker>
                    ))}
                  </defs>
                  {selectedPhoto.metadata.measurements.map((m, index) => (
                    <line key={index} x1={m.x1} y1={m.y1} x2={m.x2} y2={m.y2} stroke={m.color || '#FFD700'} strokeWidth="0.3" markerEnd={`url(#view-arrow-${(m.color || '#FFD700').replace('#', '')})`} />
                  ))}
                </svg>
              )}
              
              {selectedPhoto.metadata?.measurements && selectedPhoto.metadata.measurements.map((m, index) => (
                <div key={index} className="absolute" style={{ left: `${(m.x1 + m.x2) / 2}%`, top: `${(m.y1 + m.y2) / 2 - 4}%`, transform: 'translate(-50%, -100%)', zIndex: 20 }}>
                  <div className="bg-black bg-opacity-90 px-2 py-1 rounded text-sm font-bold border" style={{ color: m.color || '#FFD700', borderColor: m.color || '#FFD700' }}>
                    {m.text}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ACTION BUTTONS - DESKTOP STYLE */}
          <div className="bg-[#1E293B] p-4 border-t-4 border-[#D4A574]">
            <div className="flex gap-3 justify-center">
              <button onClick={() => downloadPhoto(selectedPhoto)} className="px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl font-bold text-lg">📥 DOWNLOAD</button>
              <button onClick={() => exportToCanva(selectedPhoto)} className="px-8 py-3 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white rounded-xl font-bold text-lg">🎨 EXPORT TO CANVA</button>
              <button onClick={() => handleDeletePhoto(selectedPhoto.id)} className="px-8 py-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-xl font-bold text-lg">🗑️ DELETE</button>
              <button onClick={() => setSelectedPhoto(null)} className="px-8 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-xl font-bold text-lg">✕ CLOSE</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
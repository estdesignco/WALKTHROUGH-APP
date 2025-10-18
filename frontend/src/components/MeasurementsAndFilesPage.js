import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { getRoomColor } from '../utils/roomColors';

const API_URL = process.env.REACT_APP_BACKEND_URL + '/api';

export default function MeasurementsAndFilesPage({ projectId }) {
  const [project, setProject] = useState(null);
  const [photosByRoom, setPhotosByRoom] = useState({});
  const [expandedRooms, setExpandedRooms] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  
  useEffect(() => {
    loadAllData();
  }, [projectId]);

  const loadAllData = async () => {
    try {
      setLoading(true);
      const projectResponse = await axios.get(`${API_URL}/projects/${projectId}?sheet_type=walkthrough`);
      setProject(projectResponse.data);
      
      const photosResponse = await axios.get(`${API_URL}/photos/project/${projectId}`);
      const allPhotos = photosResponse.data.photos || [];
      
      const grouped = {};
      allPhotos.forEach(photo => {
        const roomId = photo.room_id || 'no_room';
        if (!grouped[roomId]) grouped[roomId] = [];
        grouped[roomId].push(photo);
      });
      
      setPhotosByRoom(grouped);
      
      const expanded = {};
      Object.keys(grouped).forEach(roomId => { expanded[roomId] = true; });
      setExpandedRooms(expanded);
      
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportToCanva = async (photo) => {
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      img.src = photo.photo_data;
      await new Promise((resolve, reject) => { img.onload = resolve; img.onerror = reject; });
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      
      if (photo.metadata?.measurements) {
        photo.metadata.measurements.forEach((m) => {
          const x1 = (m.x1 / 100) * canvas.width, y1 = (m.y1 / 100) * canvas.height;
          const x2 = (m.x2 / 100) * canvas.width, y2 = (m.y2 / 100) * canvas.height;
          ctx.strokeStyle = m.color || '#FFD700';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.stroke();
          const angle = Math.atan2(y2 - y1, x2 - x1), headLength = 15;
          ctx.beginPath();
          ctx.moveTo(x2, y2);
          ctx.lineTo(x2 - headLength * Math.cos(angle - Math.PI / 6), y2 - headLength * Math.sin(angle - Math.PI / 6));
          ctx.lineTo(x2 - headLength * Math.cos(angle + Math.PI / 6), y2 - headLength * Math.sin(angle + Math.PI / 6));
          ctx.closePath();
          ctx.fillStyle = m.color || '#FFD700';
          ctx.fill();
          const textX = (x1 + x2) / 2, textY = (y1 + y2) / 2 - 10;
          ctx.font = 'bold 16px Arial';
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
        link.download = `canva_${photo.metadata?.room_name || 'photo'}_${Date.now()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        alert('✅ Exported for Canva!');
      }, 'image/png');
    } catch (error) {
      alert('❌ Export failed');
    }
  };

  const handleDeletePhoto = async (photoId) => {
    if (!window.confirm('Delete?')) return;
    try {
      await axios.delete(`${API_URL}/photos/${photoId}`);
      await loadAllData();
      setSelectedPhoto(null);
    } catch (error) {
      alert('❌ Delete failed');
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-full" style={{ backgroundColor: '#0F172A' }}><div className="text-white text-2xl">Loading...</div></div>;
  }

  return (
    <div className="w-full h-full flex flex-col" style={{ backgroundColor: '#0F172A' }}>
      <div className="bg-gradient-to-r from-[#1E293B] to-[#0F172A] p-6 border-b-4 border-[#D4A574] shadow-2xl" style={{
        boxShadow: '0 4px 30px rgba(212, 165, 116, 0.4), inset 0 0 80px rgba(212, 165, 116, 0.08)'
      }}>
        <div className="max-w-7xl mx-auto"><div className="text-center">
          <h1 className="text-5xl font-bold text-[#D4A574] mb-4 tracking-wide inline-block px-6 py-3 rounded-lg" style={{
            background: 'linear-gradient(135deg, #D4A574FF 0%, #D4A574AA 20%, #D4A574 40%, #D4A574AA 80%, #D4A574FF 100%)',
            boxShadow: '0 0 35px #D4A57480, inset 0 0 60px rgba(255, 255, 255, 0.16), inset 0 0 100px rgba(0, 0, 0, 0.5)',
            textShadow: '0 2px 8px rgba(0, 0, 0, 0.8), 0 0 25px rgba(255, 255, 255, 0.4), 0 0 40px rgba(255, 255, 255, 0.2)',
            color: 'white'
          }}>📐 MEASUREMENTS & FILES</h1>
          <p className="text-xl text-[#D4C5A9] mb-4 mt-4">All photos with measurements organized by room</p>
        </div></div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        {project?.rooms?.map((room) => {
          const roomPhotos = photosByRoom[room.id] || [];
          const measuredPhotos = roomPhotos.filter(p => p.metadata?.has_measurements);
          const roomColor = getRoomColor(room.name);
          
          return (
            <div key={room.id} className="mb-6">
              {/* ROOM HEADER - GRADIENT WITH BALANCED SHIMMER */}
              <div 
                className="px-4 py-3 text-white font-bold cursor-pointer border-2 border-[#D4A574] rounded-lg shadow-lg overflow-hidden" 
                style={{ 
                  background: `linear-gradient(135deg, ${roomColor} 0%, ${roomColor}DD 50%, ${roomColor} 100%)`,
                  boxShadow: `0 0 25px ${roomColor}60, inset 0 0 50px rgba(255, 255, 255, 0.12), inset 0 0 90px rgba(0, 0, 0, 0.4)`,
                  textShadow: '0 2px 4px rgba(0, 0, 0, 0.7), 0 0 15px rgba(255, 255, 255, 0.3)'
                }} 
                onClick={() => setExpandedRooms(prev => ({ ...prev, [room.id]: !prev[room.id] }))}
              >
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <span>{expandedRooms[room.id] ? '▼' : '▶'}</span>
                    <span className="text-xl">{room.name.toUpperCase()}</span>
                    <span className="bg-white text-black px-3 py-1 rounded-full text-sm font-bold">{roomPhotos.length} photos</span>
                    {measuredPhotos.length > 0 && <span className="bg-[#FFD700] text-black px-3 py-1 rounded-full text-sm font-bold">📏 {measuredPhotos.length}</span>}
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); measuredPhotos.forEach(async (p) => { await exportToCanva(p); await new Promise(r => setTimeout(r, 500)); }); }} className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-xl font-bold text-sm">🎨 EXPORT ALL</button>
                </div>
              </div>

              {expandedRooms[room.id] && (
                <div className="bg-[#1E293B] border-2 border-[#B49B7E] border-t-0 p-4">
                  {roomPhotos.length === 0 ? <div className="text-center py-8 text-[#B49B7E]">No photos</div> : (
                    <div className="grid grid-cols-6 gap-3">
                      {roomPhotos.map((photo) => (
                        <div key={photo.id} className="relative border-2 border-[#D4A574]/50 rounded overflow-hidden hover:border-[#D4A574] cursor-pointer" onClick={() => setSelectedPhoto(photo)}>
                          <img src={photo.photo_data} alt={photo.file_name} className="w-full h-32 object-cover" />
                          <div className="absolute inset-x-0 bottom-0 bg-black bg-opacity-90 text-white text-xs p-1 text-center">
                            {photo.metadata?.has_measurements ? <div className="text-[#FFD700] font-bold">📏 {photo.metadata?.measurement_count}</div> : <div className="text-gray-400">No measurements</div>}
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
      </div>

      {selectedPhoto && (
        <div className="fixed inset-0 bg-black bg-opacity-95 z-50 flex flex-col">
          <div className="bg-[#1E293B] p-4 border-b-2 border-[#D4A574]">
            <div className="flex justify-between items-center">
              <h3 className="text-2xl font-bold text-[#D4A574]">{selectedPhoto.metadata?.room_name} {selectedPhoto.metadata?.has_measurements && `- ${selectedPhoto.metadata?.measurement_count} measurements`}</h3>
              <button onClick={() => setSelectedPhoto(null)} className="text-[#D4A574] text-3xl hover:text-red-400">✕</button>
            </div>
          </div>
          <div className="flex-1 p-4 flex items-center justify-center overflow-auto">
            <div className="relative inline-block">
              <img src={selectedPhoto.photo_data} alt={selectedPhoto.file_name} className="max-h-[70vh] border-2 border-[#D4A574]" style={{ display: 'block' }} />
              {selectedPhoto.metadata?.measurements && (
                <svg className="absolute top-0 left-0 w-full h-full pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none" style={{ zIndex: 10 }}>
                  <defs>{['#FFD700', '#FF6B6B', '#4ECDC4', '#95E1D3', '#F38181', '#AA96DA', '#FCBAD3', '#FFFFD2'].map((c) => <marker key={c} id={`v-${c.replace('#', '')}`} markerWidth="4" markerHeight="4" refX="3" refY="1.5" orient="auto"><polygon points="0 0, 4 1.5, 0 3" fill={c} /></marker>)}</defs>
                  {selectedPhoto.metadata.measurements.map((m, i) => <line key={i} x1={m.x1} y1={m.y1} x2={m.x2} y2={m.y2} stroke={m.color || '#FFD700'} strokeWidth="0.3" markerEnd={`url(#v-${(m.color || '#FFD700').replace('#', '')})`} />)}
                </svg>
              )}
              {selectedPhoto.metadata?.measurements && selectedPhoto.metadata.measurements.map((m, i) => (
                <div key={i} className="absolute" style={{ left: `${(m.x1 + m.x2) / 2}%`, top: `${(m.y1 + m.y2) / 2 - 4}%`, transform: 'translate(-50%, -100%)', zIndex: 20 }}>
                  <div className="bg-black bg-opacity-90 px-2 py-1 rounded text-sm font-bold border" style={{ color: m.color || '#FFD700', borderColor: m.color || '#FFD700' }}>{m.text}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-[#1E293B] p-4 border-t-4 border-[#D4A574]"><div className="flex gap-3 justify-center">
            <button onClick={() => exportToCanva(selectedPhoto)} className="px-8 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold">🎨 CANVA</button>
            <button onClick={() => handleDeletePhoto(selectedPhoto.id)} className="px-8 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold">🗑️ DELETE</button>
            <button onClick={() => setSelectedPhoto(null)} className="px-8 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-xl font-bold">✕ CLOSE</button>
          </div></div>
        </div>
      )}
    </div>
  );
}
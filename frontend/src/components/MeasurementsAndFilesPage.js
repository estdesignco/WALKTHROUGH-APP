import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL + '/api';

export default function MeasurementsAndFilesPage({ projectId }) {
  const [photos, setPhotos] = useState([]);
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [showPhotoDetail, setShowPhotoDetail] = useState(false);
  
  useEffect(() => {
    loadAllData();
  }, [projectId]);

  const loadAllData = async () => {
    try {
      setLoading(true);
      
      // Load all photos with measurements for this project
      const photosResponse = await axios.get(`${API_URL}/photos/project/${projectId}`);
      const allPhotos = photosResponse.data.photos || [];
      
      // Filter for photos with measurements
      const measuredPhotos = allPhotos.filter(photo => photo.metadata?.has_measurements);
      setPhotos(measuredPhotos);
      
      // Load any additional files (future: could be PDFs, documents, etc.)
      // For now, this is a placeholder
      setFiles([]);
      
    } catch (error) {
      console.error('Failed to load measurements and files:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      setUploading(true);
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result;
        
        // Upload as a generic file/photo
        await axios.post(`${API_URL}/photos/upload`, {
          project_id: projectId,
          room_id: null, // No specific room
          photo_data: base64,
          file_name: file.name,
          metadata: { 
            timestamp: new Date().toISOString(),
            file_type: file.type,
            is_document: !file.type.startsWith('image/')
          }
        });
        
        alert('✅ File uploaded successfully!');
        await loadAllData();
      };
      reader.readAsDataURL(file);
    } catch (error) {
      alert('❌ Upload failed: ' + error.message);
    } finally {
      setUploading(false);
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
      alert('❌ Delete failed: ' + error.message);
    }
  };

  const exportToCanva = async (photo) => {
    // TODO: Implement Canva export
    alert('🎨 Canva export coming soon!\n\nThis feature will export your measured photos directly to Canva boards.');
  };

  const downloadPhoto = (photo) => {
    // Create a download link
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
        <div className="text-white text-2xl">Loading Measurements & Files...</div>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col" style={{ backgroundColor: '#0F172A' }}>
      {/* HEADER */}
      <div className="bg-gradient-to-r from-[#1E293B] to-[#0F172A] p-6 border-b-4 border-[#D4A574] shadow-2xl">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <h1 className="text-5xl font-bold text-[#D4A574] mb-4 tracking-wide">
              📐 MEASUREMENTS & FILES
            </h1>
            <p className="text-xl text-[#D4C5A9] mb-4">
              All photos with measurements and project documents
            </p>
            
            {/* Upload Button */}
            <label className="inline-block bg-gradient-to-r from-[#B49B7E] to-[#A08B6F] hover:from-[#A08B6F] hover:to-[#8B7355] px-8 py-3 rounded-full text-black font-bold text-lg shadow-xl cursor-pointer">
              {uploading ? '📤 Uploading...' : '📤 UPLOAD FILE'}
              <input 
                type="file" 
                accept="*/*" 
                onChange={handleFileUpload} 
                className="hidden" 
                disabled={uploading}
              />
            </label>
          </div>
        </div>
      </div>

      {/* CONTENT */}
      <div className="flex-1 overflow-auto p-6">
        {/* MEASURED PHOTOS SECTION */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-[#D4A574] mb-4 flex items-center gap-3">
            <span>📸</span>
            <span>Photos with Measurements</span>
            <span className="bg-[#D4A574] text-black px-3 py-1 rounded-full text-lg">{photos.length}</span>
          </h2>
          
          {photos.length === 0 ? (
            <div className="bg-[#1E293B] rounded-2xl p-12 text-center border-2 border-[#D4A574]/30">
              <div className="text-6xl mb-4">📏</div>
              <div className="text-2xl text-[#D4C5A9] mb-2">No measured photos yet</div>
              <div className="text-lg text-[#B49B7E]">Take photos with measurements in the Walkthrough section</div>
            </div>
          ) : (
            <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {photos.map((photo, index) => (
                <div
                  key={photo.id || index}
                  className="relative border-2 border-[#D4A574]/50 rounded-xl overflow-hidden hover:border-[#D4A574] transition-all cursor-pointer group shadow-xl"
                  onClick={() => {
                    setSelectedPhoto(photo);
                    setShowPhotoDetail(true);
                  }}
                >
                  <img 
                    src={photo.photo_data} 
                    alt={photo.file_name}
                    className="w-full h-40 object-cover"
                  />
                  <div className="absolute inset-x-0 bottom-0 bg-black bg-opacity-90 text-white text-xs p-2">
                    <div className="text-[#FFD700] font-bold">📏 {photo.metadata?.measurement_count || 0} measurements</div>
                    <div className="text-gray-300 truncate">{photo.metadata?.room_name || 'Unknown'}</div>
                  </div>
                  
                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-[#D4A574]/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="text-white font-bold text-lg">👁️ VIEW</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* OTHER FILES SECTION (Future) */}
        <div>
          <h2 className="text-3xl font-bold text-[#D4A574] mb-4 flex items-center gap-3">
            <span>📄</span>
            <span>Other Files</span>
            <span className="bg-[#D4A574] text-black px-3 py-1 rounded-full text-lg">{files.length}</span>
          </h2>
          
          {files.length === 0 ? (
            <div className="bg-[#1E293B] rounded-2xl p-12 text-center border-2 border-[#D4A574]/30">
              <div className="text-6xl mb-4">📁</div>
              <div className="text-2xl text-[#D4C5A9] mb-2">No additional files</div>
              <div className="text-lg text-[#B49B7E]">Upload PDFs, documents, or other project files</div>
            </div>
          ) : (
            <div className="space-y-3">
              {files.map((file, index) => (
                <div
                  key={file.id || index}
                  className="bg-[#1E293B] border border-[#D4A574]/30 rounded-xl p-4 hover:border-[#D4A574] transition-all"
                >
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">📄</span>
                      <div>
                        <div className="text-[#D4C5A9] font-bold">{file.file_name}</div>
                        <div className="text-sm text-[#B49B7E]">{file.metadata?.file_type || 'Unknown'}</div>
                      </div>
                    </div>
                    <button className="bg-[#D4A574] hover:bg-[#C49564] text-black px-4 py-2 rounded-xl font-bold">
                      📥 Download
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* PHOTO DETAIL MODAL */}
      {showPhotoDetail && selectedPhoto && (
        <div className="fixed inset-0 bg-black z-50 flex flex-col">
          <div className="bg-[#1E293B] p-4 border-b-2 border-[#D4A574]">
            <div className="flex justify-between items-center">
              <h3 className="text-2xl font-bold text-[#D4A574]">
                📏 {selectedPhoto.metadata?.room_name || 'Photo'} - {selectedPhoto.metadata?.measurement_count || 0} measurements
              </h3>
              <button
                onClick={() => {
                  setShowPhotoDetail(false);
                  setSelectedPhoto(null);
                }}
                className="text-[#D4A574] text-3xl hover:text-red-400"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Photo with measurements */}
          <div className="flex-1 p-4 flex items-center justify-center bg-black overflow-auto">
            <div className="relative">
              <img 
                src={selectedPhoto.photo_data}
                alt={selectedPhoto.file_name}
                className="max-w-full max-h-[70vh] object-contain border-2 border-[#D4A574] rounded-xl"
              />
              
              {/* Render measurement arrows if available */}
              {selectedPhoto.metadata?.measurements && (
                <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none" style={{ zIndex: 10 }}>
                  <defs>
                    {['#FFD700', '#FF6B6B', '#4ECDC4', '#95E1D3', '#F38181', '#AA96DA', '#FCBAD3', '#FFFFD2'].map((color) => (
                      <marker
                        key={color}
                        id={`arrow-${color.replace('#', '')}`}
                        markerWidth="4"
                        markerHeight="4"
                        refX="3"
                        refY="1.5"
                        orient="auto"
                      >
                        <polygon points="0 0, 4 1.5, 0 3" fill={color} />
                      </marker>
                    ))}
                  </defs>
                  
                  {selectedPhoto.metadata.measurements.map((m, index) => (
                    <line
                      key={index}
                      x1={m.x1} y1={m.y1} x2={m.x2} y2={m.y2}
                      stroke={m.color || '#FFD700'} strokeWidth="0.3"
                      markerEnd={`url(#arrow-${(m.color || '#FFD700').replace('#', '')})`}
                    />
                  ))}
                </svg>
              )}
              
              {/* Measurement labels */}
              {selectedPhoto.metadata?.measurements && selectedPhoto.metadata.measurements.map((m, index) => (
                <div
                  key={index}
                  className="absolute"
                  style={{
                    left: `${(m.x1 + m.x2) / 2}%`,
                    top: `${(m.y1 + m.y2) / 2 - 4}%`,
                    transform: 'translate(-50%, -100%)',
                    zIndex: 20
                  }}
                >
                  <div 
                    className="bg-black bg-opacity-90 px-2 py-1 rounded text-sm font-bold border"
                    style={{ 
                      color: m.color || '#FFD700',
                      borderColor: m.color || '#FFD700'
                    }}
                  >
                    {m.text || 'No measurement'}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="bg-[#1E293B] p-4 border-t-4 border-[#D4A574]">
            <div className="flex gap-3 justify-center flex-wrap">
              <button
                onClick={() => downloadPhoto(selectedPhoto)}
                className="px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl font-bold text-lg"
              >
                📥 DOWNLOAD
              </button>
              
              <button
                onClick={() => exportToCanva(selectedPhoto)}
                className="px-8 py-3 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white rounded-xl font-bold text-lg"
              >
                🎨 EXPORT TO CANVA
              </button>
              
              <button
                onClick={() => handleDeletePhoto(selectedPhoto.id)}
                className="px-8 py-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-xl font-bold text-lg"
              >
                🗑️ DELETE
              </button>
              
              <button
                onClick={() => {
                  setShowPhotoDetail(false);
                  setSelectedPhoto(null);
                }}
                className="px-8 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-xl font-bold text-lg"
              >
                ✕ CLOSE
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
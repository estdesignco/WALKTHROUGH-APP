import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL + '/api';

// ===== HOME SCREEN =====
function MobileHomeScreen({ onNavigate }) {
  const [syncStatus, setSyncStatus] = useState({ totalPending: 0 });

  return (
    <div className="h-full overflow-auto p-4 bg-gradient-to-b from-black via-gray-900 to-blue-950">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-[#D4C5A9] to-[#BCA888] bg-clip-text text-transparent">
          Interior Design Manager
        </h1>
        <p className="text-gray-400 text-sm">On-Site Project Management</p>
      </div>

      {syncStatus.totalPending > 0 && (
        <div className="bg-gradient-to-r from-amber-600/20 to-orange-600/20 border border-amber-500/30 rounded-2xl p-4 mb-6 backdrop-blur-sm">
          <p className="font-bold text-[#D4C5A9] mb-1">📡 Pending Sync</p>
          <p className="text-sm text-gray-300">{syncStatus.totalPending} items pending</p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 mb-6">
        <button
          onClick={() => onNavigate('projects')}
          className="col-span-2 bg-gradient-to-br from-blue-700 to-blue-800 hover:from-blue-800 hover:to-blue-900 rounded-2xl p-6 transition-all duration-300 transform hover:scale-105 relative overflow-hidden group border border-[#D4C5A9]/30"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-pulse"></div>
          <div className="relative z-10">
            <div className="text-4xl mb-2">📋</div>
            <div className="text-lg font-bold text-[#D4C5A9]">Projects</div>
            <div className="text-xs text-gray-300">View all projects</div>
          </div>
        </button>

        <button className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-4 border border-[#D4C5A9]/20 relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="text-3xl mb-2">🏠</div>
          <div className="text-sm font-bold text-[#D4C5A9]">Walkthrough</div>
          <div className="text-xs text-gray-400">On-site checklists</div>
        </button>

        <button className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-4 border border-[#D4C5A9]/20 relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="text-3xl mb-2">📸</div>
          <div className="text-sm font-bold text-[#D4C5A9]">Photos</div>
          <div className="text-xs text-gray-400">Manage photos</div>
        </button>

        <button className="col-span-2 bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-4 border border-[#D4C5A9]/20 relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="text-3xl mb-2">📏</div>
          <div className="text-sm font-bold text-[#D4C5A9]">Leica D5</div>
          <div className="text-xs text-gray-400">Laser measurements</div>
        </button>
      </div>

      <div className="bg-gradient-to-br from-gray-900/80 to-blue-900/30 rounded-2xl p-4 border border-[#D4C5A9]/20 backdrop-blur-sm">
        <p className="font-bold text-[#D4C5A9] mb-3 text-lg">✨ Features</p>
        <div className="space-y-2 text-sm text-gray-300">
          <p>• Offline-first design</p>
          <p>• Photo capture with room organization</p>
          <p>• Leica D5 laser measurement integration</p>
          <p>• Photo annotation with measurements</p>
          <p>• Auto-sync when online</p>
        </div>
      </div>
    </div>
  );
}

// ===== PROJECT LIST SCREEN =====
function MobileProjectListScreen({ onNavigate, onSelectProject }) {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const response = await axios.get(`${API_URL}/projects`);
      setProjects(response.data || []);
    } catch (error) {
      console.error('Failed to load projects:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-gradient-to-b from-black via-gray-900 to-blue-950">
        <div className="text-[#D4C5A9] text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto p-4 bg-gradient-to-b from-black via-gray-900 to-blue-950">
      <button 
        onClick={() => onNavigate('home')}
        className="bg-gradient-to-r from-gray-800 to-gray-900 text-[#D4C5A9] border border-[#D4C5A9]/30 px-4 py-2 rounded-xl mb-4 font-semibold hover:from-blue-800 hover:to-blue-900 transition-all"
      >
        ← Back
      </button>
      
      <h2 className="text-2xl font-bold mb-4 bg-gradient-to-r from-[#D4C5A9] to-[#BCA888] bg-clip-text text-transparent">Projects</h2>

      <div className="space-y-3">
        {projects.map((project) => (
          <button
            key={project.id}
            onClick={() => onSelectProject(project)}
            className="w-full bg-gradient-to-br from-gray-900/80 to-blue-900/30 border border-[#D4C5A9]/30 rounded-2xl p-4 text-left transition-all duration-300 transform hover:scale-105 relative overflow-hidden group backdrop-blur-sm"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative z-10">
              <div className="flex justify-between items-start mb-2">
                <div className="font-bold text-[#D4C5A9] text-lg">{project.name}</div>
                <div className="text-[#D4C5A9] text-xl">→</div>
              </div>
              {project.client_info && (
                <div className="space-y-1 text-sm">
                  <div className="text-gray-300">👤 {project.client_info.full_name}</div>
                  <div className="text-gray-400">📍 {project.client_info.address}</div>
                </div>
              )}
              <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-700">
                <span className="text-xs text-[#D4C5A9] font-semibold">{project.project_type || 'Renovation'}</span>
                <span className="text-xs text-gray-400">{project.rooms?.length || 0} rooms</span>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ===== WALKTHROUGH SCREEN =====
function MobileWalkthroughScreen({ project, onNavigate, onSelectRoom }) {
  const rooms = project?.rooms || [];

  return (
    <div className="h-full overflow-auto p-4 bg-gradient-to-b from-black via-gray-900 to-blue-950">
      <button 
        onClick={() => onNavigate('projects')}
        className="bg-gradient-to-r from-gray-800 to-gray-900 text-[#D4C5A9] border border-[#D4C5A9]/30 px-4 py-2 rounded-xl mb-4 font-semibold hover:from-blue-800 hover:to-blue-900 transition-all"
      >
        ← Back
      </button>

      <h2 className="text-xl font-bold mb-1 bg-gradient-to-r from-[#D4C5A9] to-[#BCA888] bg-clip-text text-transparent">{project?.name}</h2>
      <p className="text-gray-400 text-sm mb-6">Select a room to manage photos</p>

      <div className="grid grid-cols-2 gap-3">
        {rooms.map((room) => (
          <button
            key={room.id}
            onClick={() => onSelectRoom(room)}
            className="bg-gradient-to-br from-gray-900/80 to-blue-900/30 rounded-2xl p-4 border border-[#D4C5A9]/30 text-center transition-all duration-300 transform hover:scale-105 relative overflow-hidden group backdrop-blur-sm"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative z-10">
              <div className="text-3xl mb-2">🏠</div>
              <div className="font-bold text-[#D4C5A9] mb-1">{room.name}</div>
              <div className="text-xs text-gray-400 mb-3">{room.categories?.length || 0} categories</div>
              <div className="pt-2 border-t border-[#D4C5A9]/20">
                <span className="text-xs text-[#D4C5A9] font-semibold">📸 Photos →</span>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ===== PHOTO MANAGER SCREEN =====
function MobilePhotoManagerScreen({ project, room, onNavigate }) {
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    loadPhotos();
  }, []);

  const loadPhotos = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/photos/by-room/${project.id}/${room.id}`);
      setPhotos(response.data.photos || []);
    } catch (error) {
      console.error('Failed to load photos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      setUploading(true);
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result;
        await axios.post(`${API_URL}/photos/upload`, {
          project_id: project.id,
          room_id: room.id,
          photo_data: base64,
          file_name: file.name,
          metadata: { timestamp: new Date().toISOString() },
        });
        alert('Photo uploaded successfully!');
        loadPhotos();
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to upload photo: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleDeletePhoto = async (photoId) => {
    if (!window.confirm('Delete this photo?')) return;
    try {
      await axios.delete(`${API_URL}/photos/${photoId}`);
      alert('Photo deleted');
      loadPhotos();
      setSelectedPhoto(null);
    } catch (error) {
      alert('Failed to delete photo');
    }
  };

  return (
    <div className="h-full overflow-auto bg-gradient-to-b from-black via-gray-900 to-blue-950">
      <div className="p-4">
        <button 
          onClick={() => onNavigate('walkthrough')}
          className="bg-gradient-to-r from-gray-800 to-gray-900 text-[#D4C5A9] border border-[#D4C5A9]/30 px-4 py-2 rounded-xl mb-4 font-semibold hover:from-blue-800 hover:to-blue-900 transition-all"
        >
          ← Back
        </button>

        <div className="flex justify-between items-center mb-4 pb-4 border-b border-[#D4C5A9]/20">
          <div>
            <div className="text-sm text-gray-400">{project.name}</div>
            <div className="text-lg font-bold text-[#D4C5A9]">📍 {room.name}</div>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-300">{photos.length} photos</div>
          </div>
        </div>

        <div className="flex gap-2 mb-4">
          <label className="flex-1 bg-gradient-to-br from-blue-700 to-blue-800 hover:from-blue-800 hover:to-blue-900 rounded-xl p-3 text-center font-bold text-white cursor-pointer transition-all duration-300 transform hover:scale-105 border border-[#D4C5A9]/30 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-pulse"></div>
            <span className="relative z-10">{uploading ? 'Uploading...' : '📷 Upload Photo'}</span>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
              disabled={uploading}
            />
          </label>
          
          <button className="bg-gradient-to-r from-gray-800 to-gray-900 rounded-xl px-4 font-bold text-[#D4C5A9] border border-[#D4C5A9]/30 hover:from-blue-800 hover:to-blue-900 transition-all">
            📏 Measure
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12 text-[#D4C5A9]">Loading photos...</div>
        ) : photos.length === 0 ? (
          <div className="text-center py-12 bg-gradient-to-br from-gray-900/80 to-blue-900/30 rounded-2xl border border-[#D4C5A9]/20 backdrop-blur-sm">
            <div className="text-6xl mb-4">📸</div>
            <div className="text-lg text-[#D4C5A9] mb-2">No photos yet</div>
            <div className="text-sm text-gray-400">Upload photos for this room</div>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            {photos.map((photo) => (
              <button
                key={photo.id}
                onClick={() => setSelectedPhoto(photo)}
                className="aspect-square rounded-lg overflow-hidden border-2 border-[#D4C5A9]/30 hover:border-[#D4C5A9] transition-all transform hover:scale-105"
              >
                <img
                  src={photo.photo_data}
                  alt={photo.file_name}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Photo Modal */}
      {selectedPhoto && (
        <div 
          className="fixed inset-0 bg-black/95 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedPhoto(null)}
        >
          <div className="max-w-full max-h-full" onClick={(e) => e.stopPropagation()}>
            <img
              src={selectedPhoto.photo_data}
              alt={selectedPhoto.file_name}
              className="max-w-full max-h-[70vh] rounded-2xl border-2 border-[#D4C5A9]/30"
            />
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => handleDeletePhoto(selectedPhoto.id)}
                className="flex-1 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white px-6 py-3 rounded-xl font-bold transition-all"
              >
                🗑️ Delete
              </button>
              <button
                onClick={() => setSelectedPhoto(null)}
                className="flex-1 bg-gradient-to-r from-gray-700 to-gray-800 hover:from-gray-800 hover:to-gray-900 text-white px-6 py-3 rounded-xl font-bold transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ===== MAIN APP COMPONENT =====
export default function MobileAppSimulator() {
  const [screen, setScreen] = useState('home');
  const [selectedProject, setSelectedProject] = useState(null);
  const [selectedRoom, setSelectedRoom] = useState(null);

  const handleSelectProject = (project) => {
    setSelectedProject(project);
    setScreen('walkthrough');
  };

  const handleSelectRoom = (room) => {
    setSelectedRoom(room);
    setScreen('photos');
  };

  const renderScreen = () => {
    switch (screen) {
      case 'home':
        return <MobileHomeScreen onNavigate={setScreen} />;
      case 'projects':
        return <MobileProjectListScreen onNavigate={setScreen} onSelectProject={handleSelectProject} />;
      case 'walkthrough':
        return <MobileWalkthroughScreen project={selectedProject} onNavigate={setScreen} onSelectRoom={handleSelectRoom} />;
      case 'photos':
        return <MobilePhotoManagerScreen project={selectedProject} room={selectedRoom} onNavigate={setScreen} />;
      default:
        return <MobileHomeScreen onNavigate={setScreen} />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-blue-950 flex items-center justify-center p-4">
      <div className="w-[390px] h-[844px] bg-black rounded-[40px] overflow-hidden shadow-2xl border-8 border-gray-800 relative">
        {/* Status Bar */}
        <div className="h-11 bg-black flex justify-between items-center px-6 text-white text-sm">
          <span>9:41</span>
          <span>📶 📡 🔋</span>
        </div>
        
        {/* Screen Content */}
        <div className="h-[calc(100%-44px)] overflow-hidden">
          {renderScreen()}
        </div>
      </div>
    </div>
  );
}
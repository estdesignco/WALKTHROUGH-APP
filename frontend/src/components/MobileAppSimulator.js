import React, { useState, useEffect } from 'react';
import axios from 'axios';
import MobileWalkthroughSpreadsheet from './MobileWalkthroughSpreadsheet';
import TabbedWalkthroughSpreadsheet from './TabbedWalkthroughSpreadsheet';
import MobileFFESpreadsheet from './MobileFFESpreadsheet';
import MobilePhotoManagement from './MobilePhotoManagement';

const API_URL = process.env.REACT_APP_BACKEND_URL + '/api';

// ===== HOME SCREEN =====
function MobileHomeScreen({ onNavigate }) {
  return (
    <div className="h-full overflow-auto p-6 md:p-8 lg:p-12 bg-black">
      {/* Logo Header - Black logo on gold container */}
      <div className="text-center mb-8 md:mb-12">
        <div className="inline-block bg-gradient-to-r from-[#D4A574] to-[#BCA888] p-0 mb-4">
          <img 
            src={`${process.env.PUBLIC_URL}/established-logo.png`}
            alt="ESTABLISHED" 
            className="h-16 md:h-20 lg:h-24 object-contain"
            style={{ 
              maxWidth: '280px',
              filter: 'brightness(0)',
              display: 'block'
            }}
          />
        </div>
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-3 bg-gradient-to-r from-[#D4C5A9] to-[#BCA888] bg-clip-text text-transparent">
          Interior Design Manager
        </h1>
        <p className="text-[#D4A574] text-base md:text-lg">On-Site Project Management</p>
      </div>

      {/* iPad Optimized Layout - Max width for readability */}
      <div className="max-w-5xl mx-auto space-y-6 mb-8">
        <button
          onClick={() => onNavigate('projects')}
          className="w-full bg-gradient-to-br from-gray-900 to-black hover:from-gray-800 hover:to-gray-900 rounded-3xl p-8 md:p-10 transition-all duration-300 transform hover:scale-105 relative overflow-hidden group border-2 border-[#D4A574]/50 shadow-2xl"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#D4A574]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="relative z-10">
            <div className="text-6xl md:text-7xl mb-4">📋</div>
            <div className="text-2xl md:text-3xl font-bold text-[#D4C5A9] mb-2">Projects</div>
            <div className="text-base md:text-lg text-gray-300">View all projects & spreadsheets</div>
          </div>
        </button>

        <div className="grid grid-cols-3 gap-4 md:gap-6">
          <button className="bg-gradient-to-br from-gray-900 to-black rounded-2xl p-6 md:p-8 border-2 border-[#D4A574]/50 hover:border-[#D4A574] transition-all shadow-xl">
            <div className="text-4xl md:text-5xl mb-3">📸</div>
            <div className="text-sm md:text-base font-bold text-[#D4C5A9]">Photos</div>
          </button>

          <button className="bg-gradient-to-br from-gray-900 to-black rounded-2xl p-6 md:p-8 border-2 border-[#D4A574]/50 hover:border-[#D4A574] transition-all shadow-xl">
            <div className="text-4xl md:text-5xl mb-3">📏</div>
            <div className="text-sm md:text-base font-bold text-[#D4C5A9]">Measure</div>
          </button>

          <button className="bg-gradient-to-br from-gray-900 to-black rounded-2xl p-6 md:p-8 border-2 border-[#D4A574]/50 hover:border-[#D4A574] transition-all shadow-xl">
            <div className="text-4xl md:text-5xl mb-3">🔄</div>
            <div className="text-sm md:text-base font-bold text-[#D4C5A9]">Sync</div>
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto bg-gradient-to-br from-gray-900 to-black rounded-3xl p-6 md:p-8 border-2 border-[#D4A574]/50 shadow-2xl">
        <p className="font-bold text-[#D4A574] mb-4 text-xl md:text-2xl">✨ Jobsite Features</p>
        <div className="space-y-3 text-base md:text-lg text-gray-300">
          <p>• Full Walkthrough spreadsheet</p>
          <p>• <strong className="text-[#D4C5A9]">FF&E Bible</strong> - Your complete inventory</p>
          <p>• Works offline with auto-sync</p>
          <p>• Photo capture by room</p>
          <p>• Real-time status updates</p>
        </div>
      </div>
    </div>
  );
}

// ===== PROJECT MENU SCREEN =====
function ProjectMenuScreen({ project, onNavigate }) {
  return (
    <div className="h-full overflow-auto p-6 md:p-8 lg:p-12 bg-black">
      {/* Logo Header - Black logo on gold container */}
      <div className="text-center mb-6 md:mb-8">
        <div className="inline-block bg-gradient-to-r from-[#D4A574] to-[#BCA888] p-0">
          <img 
            src={`${process.env.PUBLIC_URL}/established-logo.png`}
            alt="ESTABLISHED" 
            className="h-12 md:h-16 object-contain"
            style={{ 
              maxWidth: '220px',
              filter: 'brightness(0)',
              display: 'block'
            }}
          />
        </div>
      </div>
      
      <div className="max-w-5xl mx-auto">
        <button 
          onClick={() => onNavigate('projects')}
          className="bg-gradient-to-br from-gray-900 to-black text-[#D4C5A9] border-2 border-[#D4A574]/50 px-6 py-3 md:px-8 md:py-4 rounded-2xl mb-6 md:mb-8 font-semibold hover:border-[#D4A574] transition-all text-base md:text-lg shadow-lg"
        >
          ← Back to Projects
        </button>
        
        <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-3 bg-gradient-to-r from-[#D4C5A9] to-[#BCA888] bg-clip-text text-transparent">{project?.name}</h2>
        <p className="text-[#D4A574] text-base md:text-lg mb-8">Select which sheet to view</p>

        <div className="space-y-5 md:space-y-6">
          <button
            onClick={() => onNavigate('walkthrough')}
            className="w-full bg-gradient-to-br from-gray-900 to-black hover:from-gray-800 hover:to-gray-900 rounded-3xl p-8 md:p-10 text-left transition-all duration-300 transform hover:scale-105 relative overflow-hidden group border-2 border-[#D4A574]/50 shadow-2xl"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#D4A574]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative z-10">
              <div className="text-5xl md:text-6xl mb-3">📋</div>
              <div className="font-bold text-[#D4C5A9] text-2xl md:text-3xl mb-2">Walkthrough</div>
              <div className="text-sm md:text-base text-gray-300">On-site checklist - Check off items as you inspect</div>
            </div>
          </button>

          <button
            onClick={() => onNavigate('ffe')}
            className="w-full bg-gradient-to-br from-gray-900 to-black hover:from-gray-800 hover:to-gray-900 rounded-3xl p-8 md:p-10 text-left transition-all duration-300 transform hover:scale-105 relative overflow-hidden group border-2 border-[#D4A574]/50 shadow-2xl"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#D4A574]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative z-10">
              <div className="text-5xl md:text-6xl mb-3">📖</div>
              <div className="font-bold text-[#D4C5A9] text-2xl md:text-3xl mb-2">FF&E Bible</div>
              <div className="text-sm md:text-base text-gray-300">Your complete inventory - Status, tracking, delivery info</div>
              <div className="mt-3 text-sm md:text-base text-[#D4A574]">💡 Works offline with auto-sync!</div>
            </div>
          </button>

          <button
            onClick={() => onNavigate('photos')}
            className="w-full bg-gradient-to-br from-gray-900 to-black hover:from-gray-800 hover:to-gray-900 rounded-3xl p-8 md:p-10 text-left transition-all duration-300 transform hover:scale-105 relative overflow-hidden group border-2 border-[#D4A574]/50 shadow-2xl"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#D4A574]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative z-10">
              <div className="text-5xl md:text-6xl mb-3">📸</div>
              <div className="font-bold text-[#D4A574] text-2xl md:text-3xl mb-2">Photo Management</div>
              <div className="text-sm md:text-base text-gray-300">Capture photos with measurements by room</div>
              <div className="mt-3 text-sm md:text-base text-[#D4A574]">📏 Leica D5 integration</div>
            </div>
          </button>
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
      <div className="h-full flex items-center justify-center bg-black">
        <div className="text-[#D4C5A9] text-xl md:text-2xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto p-6 md:p-8 lg:p-12 bg-black">
      {/* Logo Header - Black logo on gold container */}
      <div className="text-center mb-6 md:mb-8">
        <div className="inline-block bg-gradient-to-r from-[#D4A574] to-[#BCA888] p-0">
          <img 
            src={`${process.env.PUBLIC_URL}/established-logo.png`}
            alt="ESTABLISHED" 
            className="h-12 md:h-16 object-contain"
            style={{ 
              maxWidth: '220px',
              filter: 'brightness(0)',
              display: 'block'
            }}
          />
        </div>
      </div>
      
      <div className="max-w-5xl mx-auto">
        <button 
          onClick={() => onNavigate('home')}
          className="bg-gradient-to-br from-gray-900 to-black text-[#D4C5A9] border-2 border-[#D4A574]/50 px-6 py-3 md:px-8 md:py-4 rounded-2xl mb-6 md:mb-8 font-semibold hover:border-[#D4A574] transition-all text-base md:text-lg shadow-lg"
        >
          ← Back
        </button>
        
        <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6 md:mb-8 bg-gradient-to-r from-[#D4C5A9] to-[#BCA888] bg-clip-text text-transparent">Projects</h2>

        {/* iPad Grid Layout - 2 columns on larger screens */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 md:gap-6">
          {projects.map((project) => (
            <button
              key={project.id}
              onClick={() => onSelectProject(project)}
              className="bg-gradient-to-br from-gray-900 to-black border-2 border-[#D4A574]/50 rounded-3xl p-6 md:p-8 text-left transition-all duration-300 transform hover:scale-105 hover:border-[#D4A574] relative overflow-hidden group shadow-2xl"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#D4A574]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative z-10">
                <div className="flex justify-between items-start mb-3">
                  <div className="font-bold text-[#D4C5A9] text-xl md:text-2xl">{project.name}</div>
                  <div className="text-[#D4A574] text-2xl md:text-3xl">→</div>
                </div>
                {project.client_info && (
                  <div className="space-y-2 text-base md:text-lg mb-4">
                    <div className="text-gray-300">👤 {project.client_info.full_name}</div>
                    <div className="text-[#D4A574]">📍 {project.client_info.address}</div>
                  </div>
                )}
                <div className="flex justify-between items-center pt-4 border-t-2 border-[#D4A574]/30">
                  <span className="text-sm md:text-base text-[#D4C5A9] font-semibold">{project.project_type || 'Renovation'}</span>
                  <span className="text-sm md:text-base text-[#D4A574] font-medium">{project.rooms?.length || 0} rooms</span>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ===== OLD WALKTHROUGH REMOVED - NOW USING MobileWalkthroughSpreadsheet COMPONENT =====

// ===== PHOTO MANAGER SCREEN =====
function MobilePhotoManagerScreen({ project, room, onNavigate }) {
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (project?.id && room?.id) {
      loadPhotos();
    }
  }, [project, room]);

  const loadPhotos = async () => {
    if (!project?.id || !room?.id) return;
    
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

  if (!project || !room) {
    return (
      <div className="h-full flex items-center justify-center bg-gradient-to-b from-black via-[#0F0F0F] to-[#1a1a2e]">
        <div className="text-center">
          <div className="text-[#D4C5A9] mb-4">No room selected</div>
          <button 
            onClick={() => onNavigate('walkthrough')}
            className="bg-gradient-to-r from-[#2a2a3a] to-[#1a1a2a] text-[#D4C5A9] border-2 border-[#D4C5A9]/30 px-4 py-2 rounded-xl font-semibold"
          >
            ← Back to Spreadsheet
          </button>
        </div>
      </div>
    );
  }

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
        alert('Photo uploaded!');
        loadPhotos();
      };
      reader.readAsDataURL(file);
    } catch (error) {
      alert('Upload failed: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleDeletePhoto = async (photoId) => {
    if (!window.confirm('Delete?')) return;
    try {
      await axios.delete(`${API_URL}/photos/${photoId}`);
      loadPhotos();
      setSelectedPhoto(null);
    } catch (error) {
      alert('Delete failed');
    }
  };

  return (
    <div className="h-full overflow-auto bg-gradient-to-b from-black via-[#0F0F0F] to-[#1a1a2e]">
      <div className="p-4">
        <button 
          onClick={() => onNavigate('walkthrough')}
          className="bg-gradient-to-r from-[#2a2a3a] to-[#1a1a2a] text-[#D4C5A9] border-2 border-[#D4C5A9]/30 px-4 py-2 rounded-xl mb-4 font-semibold"
        >
          ← Back to Spreadsheet
        </button>

        <div className="flex justify-between items-center mb-4 pb-4 border-b-2 border-[#D4C5A9]/20">
          <div>
            <div className="text-sm text-gray-400">{project.name}</div>
            <div className="text-lg font-bold text-[#D4C5A9]">📍 {room.name}</div>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-300">{photos.length} photos</div>
          </div>
        </div>

        <div className="flex gap-2 mb-4">
          <label className="flex-1 bg-gradient-to-br from-[#3a3a4a] to-[#2a2a3a] hover:from-[#4a4a5a] hover:to-[#3a3a4a] rounded-xl p-3 text-center font-bold text-[#D4C5A9] cursor-pointer transition-all border-2 border-[#D4C5A9]/30">
            {uploading ? 'Uploading...' : '📷 Upload Photo'}
            <input type="file" accept="image/*" onChange={handleFileSelect} className="hidden" disabled={uploading} />
          </label>
        </div>

        {loading ? (
          <div className="text-center py-12 text-[#D4C5A9]">Loading...</div>
        ) : photos.length === 0 ? (
          <div className="text-center py-12 bg-gradient-to-br from-[#1a1a2a]/80 to-[#0a0a1a]/60 rounded-2xl border-2 border-[#D4C5A9]/20">
            <div className="text-6xl mb-4">📸</div>
            <div className="text-lg text-[#D4C5A9]">No photos yet</div>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            {photos.map((photo) => (
              <button
                key={photo.id}
                onClick={() => setSelectedPhoto(photo)}
                className="aspect-square rounded-lg overflow-hidden border-2 border-[#D4C5A9]/30 hover:border-[#D4C5A9] transition-all"
              >
                <img src={photo.photo_data} alt={photo.file_name} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>

      {selectedPhoto && (
        <div className="fixed inset-0 bg-black/95 flex items-center justify-center z-50 p-4" onClick={() => setSelectedPhoto(null)}>
          <div className="max-w-full max-h-full" onClick={(e) => e.stopPropagation()}>
            <img src={selectedPhoto.photo_data} alt={selectedPhoto.file_name} className="max-w-full max-h-[70vh] rounded-2xl border-2 border-[#D4C5A9]/30" />
            <div className="flex gap-3 mt-4">
              <button onClick={() => handleDeletePhoto(selectedPhoto.id)} className="flex-1 bg-gradient-to-r from-red-900 to-red-800 text-white px-6 py-3 rounded-xl font-bold">
                🗑️ Delete
              </button>
              <button onClick={() => setSelectedPhoto(null)} className="flex-1 bg-gradient-to-r from-[#3a3a4a] to-[#2a2a3a] text-white px-6 py-3 rounded-xl font-bold">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ===== MAIN APP =====
export default function MobileAppSimulator() {
  const [screen, setScreen] = useState('home');
  const [selectedProject, setSelectedProject] = useState(null);
  const [selectedRoom, setSelectedRoom] = useState(null);

  const handleSelectProject = async (project) => {
    // Load full project with walkthrough data
    try {
      const walkthroughResponse = await axios.get(`${API_URL}/projects/${project.id}?sheet_type=walkthrough`);
      const ffeResponse = await axios.get(`${API_URL}/projects/${project.id}?sheet_type=ffe`);
      
      setSelectedProject({
        ...project,
        walkthroughData: walkthroughResponse.data,
        ffeData: ffeResponse.data
      });
    } catch (error) {
      console.error('Failed to load project details:', error);
      setSelectedProject(project);
    }
    setScreen('project-menu');
  };

  const handleSelectRoom = (room) => {
    setSelectedRoom(room);
    setScreen('photos');
  };

  const handleNavigate = (screenName, data) => {
    if (data?.project) setSelectedProject(data.project);
    setScreen(screenName);
  };

  const renderScreen = () => {
    switch (screen) {
      case 'home':
        return <MobileHomeScreen onNavigate={setScreen} />;
      case 'projects':
        return <MobileProjectListScreen onNavigate={setScreen} onSelectProject={handleSelectProject} />;
      case 'project-menu':
        return <ProjectMenuScreen project={selectedProject} onNavigate={setScreen} />;
      case 'walkthrough':
        return (
          <div className="h-full flex flex-col">
            <button 
              onClick={() => setScreen('project-menu')}
              className="bg-gray-700 text-white px-4 py-2 m-2 rounded font-semibold flex-shrink-0"
            >
              ← Back
            </button>
            <div className="flex-1 overflow-hidden">
              <MobileWalkthroughSpreadsheet projectId={selectedProject?.id} />
            </div>
          </div>
        );
      case 'ffe':
        return (
          <div className="h-full flex flex-col">
            <button 
              onClick={() => setScreen('project-menu')}
              className="bg-gray-700 text-white px-4 py-2 m-2 rounded font-semibold flex-shrink-0"
            >
              ← Back
            </button>
            <div className="flex-1 overflow-hidden">
              <MobileFFESpreadsheet projectId={selectedProject?.id} />
            </div>
          </div>
        );
      case 'photos':
        return <MobilePhotoManagement projectId={selectedProject?.id} onClose={() => setScreen('project-menu')} />;
      default:
        return <MobileHomeScreen onNavigate={setScreen} />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-[#0F0F0F] to-[#1a1a2e]">
      {/* Full width on iPad, phone simulator on desktop */}
      <div className="w-full h-screen md:w-full md:h-screen bg-black overflow-hidden">
        {/* Remove status bar on larger screens, keep for mobile feel */}
        <div className="hidden sm:block h-0"></div>
        <div className="h-full overflow-hidden">
          {renderScreen()}
        </div>
      </div>
    </div>
  );
}
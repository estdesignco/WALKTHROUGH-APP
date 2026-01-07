import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import MobileWalkthroughSpreadsheet from './MobileWalkthroughSpreadsheet';
import MobileFFESpreadsheet from './MobileFFESpreadsheet';
import MobilePhotoManagement from './MobilePhotoManagement';
import MeasurementsAndFilesPage from './MeasurementsAndFilesPage';
import { saveContactsOffline, getContactsOffline, saveQuestionnaireOffline, getQuestionnaireOffline, isOnline } from '../utils/offlineStorage';

const API_URL = (window.ENV?.REACT_APP_BACKEND_URL || window.location.origin) + '/api';

// DESKTOP-MATCHED STYLES
const STYLES = {
  goldGradient: 'linear-gradient(135deg, #8b7355 0%, #a0845c 50%, #8b7355 100%)',
  darkGradient: 'linear-gradient(135deg, #2a2a2a 0%, #3a3a3a 50%, #2a2a2a 100%)',
  goldBorder: '1px solid #8b7355',
  goldHighlight: '1px solid #d4af37',
  goldShadow: '0 4px 15px rgba(139, 115, 85, 0.2)',
  goldShadowStrong: '0 4px 15px rgba(139, 115, 85, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
  shimmer: 'inset 0 1px 0 rgba(255, 255, 255, 0.2)',
};

// Shimmer animation CSS
const shimmerStyle = `
  @keyframes shimmer {
    0% { background-position: -200% 0; }
    100% { background-position: 200% 0; }
  }
  .shimmer-gold {
    position: relative;
    overflow: hidden;
  }
  .shimmer-gold::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(90deg, transparent 0%, rgba(255,215,0,0.1) 50%, transparent 100%);
    background-size: 200% 100%;
    animation: shimmer 3s infinite;
    pointer-events: none;
  }
`;

// ===== HOME SCREEN - MATCHES DESKTOP EXACTLY =====
function MobileHomeScreen({ onNavigate }) {
  return (
    <div className="h-full overflow-auto bg-black">
      <style>{shimmerStyle}</style>
      
      {/* Gold Header - EXACT MATCH to MainDashboard.js */}
      <div className="w-full h-32 shimmer-gold" style={{ 
        background: STYLES.goldGradient,
        boxShadow: '0 4px 20px rgba(139, 115, 85, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)'
      }}>
        <div className="flex items-center justify-center h-full relative px-8">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-10"></div>
          <img 
            src="https://customer-assets.emergentagent.com/job_sleek-showcase-46/artifacts/c5c84fh5_Established%20logo.png" 
            alt="ESTABLISHED DESIGN CO." 
            className="w-full h-20 object-contain"
            style={{
              filter: 'drop-shadow(0 0 10px rgba(255, 215, 0, 0.4)) drop-shadow(0 0 20px rgba(255, 215, 0, 0.2))',
              maxWidth: '100%'
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-br from-yellow-400 via-transparent to-yellow-400 opacity-5"></div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-6 py-8">
        {/* Navigation Grid - MATCHES DESKTOP */}
        <div className="max-w-4xl mx-auto grid grid-cols-2 gap-4 mb-8">
          <button
            onClick={() => onNavigate('projects')}
            className="text-stone-300 p-6 rounded-lg transition-all duration-200 hover:scale-105 active:scale-95"
            style={{
              background: STYLES.darkGradient,
              border: STYLES.goldBorder,
              boxShadow: STYLES.goldShadow
            }}
          >
            <div className="text-4xl mb-3">📋</div>
            <div className="text-lg font-medium">Projects</div>
            <div className="text-xs text-stone-500 mt-1">View & manage</div>
          </button>
          
          <button
            onClick={() => onNavigate('photos')}
            className="text-stone-300 p-6 rounded-lg transition-all duration-200 hover:scale-105 active:scale-95"
            style={{
              background: STYLES.darkGradient,
              border: STYLES.goldBorder,
              boxShadow: STYLES.goldShadow
            }}
          >
            <div className="text-4xl mb-3">📸</div>
            <div className="text-lg font-medium">Photos</div>
            <div className="text-xs text-stone-500 mt-1">Capture & organize</div>
          </button>
          
          <button
            onClick={() => onNavigate('measure')}
            className="text-stone-300 p-6 rounded-lg transition-all duration-200 hover:scale-105 active:scale-95"
            style={{
              background: STYLES.darkGradient,
              border: STYLES.goldBorder,
              boxShadow: STYLES.goldShadow
            }}
          >
            <div className="text-4xl mb-3">📏</div>
            <div className="text-lg font-medium">Measure</div>
            <div className="text-xs text-stone-500 mt-1">Leica integration</div>
          </button>
          
          <button
            onClick={() => onNavigate('sync')}
            className="text-white p-6 rounded-lg transition-all duration-200 hover:scale-105 active:scale-95 shimmer-gold"
            style={{
              background: STYLES.goldGradient,
              border: STYLES.goldHighlight,
              boxShadow: STYLES.goldShadowStrong
            }}
          >
            <div className="text-4xl mb-3">🔄</div>
            <div className="text-lg font-medium">Sync</div>
            <div className="text-xs text-stone-200 mt-1">Upload to cloud</div>
          </button>
        </div>

        {/* Quick Stats - GOLD ACCENT STYLING */}
        <div className="max-w-4xl mx-auto p-6 rounded-lg mb-6" style={{
          background: STYLES.darkGradient,
          border: STYLES.goldBorder,
          boxShadow: STYLES.goldShadow
        }}>
          <h3 className="text-lg font-bold mb-4" style={{ color: '#d4af37' }}>✨ Mobile Features</h3>
          <div className="space-y-3 text-stone-300 text-sm">
            <p className="flex items-center gap-2">
              <span className="text-[#8b7355]">•</span>
              <span>Full walkthrough spreadsheet access</span>
            </p>
            <p className="flex items-center gap-2">
              <span className="text-[#8b7355]">•</span>
              <span><strong className="text-[#d4af37]">Offline mode</strong> - work without internet</span>
            </p>
            <p className="flex items-center gap-2">
              <span className="text-[#8b7355]">•</span>
              <span>Auto-sync when connected</span>
            </p>
            <p className="flex items-center gap-2">
              <span className="text-[#8b7355]">•</span>
              <span>Photo capture by room</span>
            </p>
          </div>
        </div>
        
        {/* Connection Status */}
        <div className="max-w-4xl mx-auto text-center">
          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm ${isOnline() ? 'bg-green-900/50 text-green-400' : 'bg-red-900/50 text-red-400'}`}
            style={{ border: isOnline() ? '1px solid #22c55e' : '1px solid #ef4444' }}>
            <div className={`w-2 h-2 rounded-full ${isOnline() ? 'bg-green-500' : 'bg-red-500'}`}></div>
            {isOnline() ? 'Connected' : 'Offline Mode'}
          </div>
        </div>
      </div>
    </div>
  );
}

// ===== PROJECT MENU SCREEN - MATCHES DESKTOP =====
function ProjectMenuScreen({ project, onNavigate }) {
  return (
    <div className="h-full overflow-auto bg-black">
      <style>{shimmerStyle}</style>
      
      {/* Gold Header - EXACT MATCH */}
      <div className="w-full h-24 shimmer-gold" style={{ 
        background: STYLES.goldGradient,
        boxShadow: '0 4px 20px rgba(139, 115, 85, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)'
      }}>
        <div className="flex items-center justify-center h-full relative px-6">
          <img 
            src="https://customer-assets.emergentagent.com/job_sleek-showcase-46/artifacts/c5c84fh5_Established%20logo.png" 
            alt="ESTABLISHED DESIGN CO." 
            className="h-14 object-contain"
            style={{
              filter: 'drop-shadow(0 0 10px rgba(255, 215, 0, 0.4))',
              maxWidth: '100%'
            }}
          />
        </div>
      </div>
      
      <div className="px-6 py-6">
        {/* Back Button */}
        <button 
          onClick={() => onNavigate('projects')}
          className="text-stone-300 px-4 py-2 rounded-lg mb-6 transition-all hover:scale-105"
          style={{
            background: STYLES.darkGradient,
            border: STYLES.goldBorder,
            boxShadow: STYLES.goldShadow
          }}
        >
          ← Back to Projects
        </button>
        
        {/* Project Title */}
        <h2 className="text-2xl font-bold mb-2" style={{ color: '#d4af37' }}>{project?.name}</h2>
        <p className="text-stone-400 text-sm mb-6">Select sheet to view</p>

        {/* Menu Grid */}
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => onNavigate('walkthrough')}
            className="text-stone-300 p-5 rounded-lg text-left transition-all hover:scale-105 active:scale-95"
            style={{
              background: STYLES.darkGradient,
              border: STYLES.goldBorder,
              boxShadow: STYLES.goldShadow
            }}
          >
            <div className="text-3xl mb-2">📋</div>
            <div className="font-bold text-base">Walkthrough</div>
            <div className="text-xs text-stone-500 mt-1">On-site checklist</div>
          </button>

          <button
            onClick={() => onNavigate('ffe')}
            className="text-stone-300 p-5 rounded-lg text-left transition-all hover:scale-105 active:scale-95"
            style={{
              background: STYLES.darkGradient,
              border: STYLES.goldBorder,
              boxShadow: STYLES.goldShadow
            }}
          >
            <div className="text-3xl mb-2">📖</div>
            <div className="font-bold text-base">FF&E</div>
            <div className="text-xs text-stone-500 mt-1">Complete inventory</div>
          </button>

          <button
            onClick={() => onNavigate('measurements-files')}
            className="text-white p-5 rounded-lg text-left transition-all hover:scale-105 active:scale-95 shimmer-gold"
            style={{
              background: STYLES.goldGradient,
              border: STYLES.goldHighlight,
              boxShadow: STYLES.goldShadowStrong
            }}
          >
            <div className="text-3xl mb-2">📐</div>
            <div className="font-bold text-base">Measurements</div>
            <div className="text-xs text-stone-200 mt-1">Photos & dimensions</div>
          </button>

          <button
            onClick={() => onNavigate('photos')}
            className="text-stone-300 p-5 rounded-lg text-left transition-all hover:scale-105 active:scale-95"
            style={{
              background: STYLES.darkGradient,
              border: STYLES.goldBorder,
              boxShadow: STYLES.goldShadow
            }}
          >
            <div className="text-3xl mb-2">📸</div>
            <div className="font-bold text-base">Photos</div>
            <div className="text-xs text-stone-500 mt-1">Capture by room</div>
          </button>

          <button
            onClick={() => onNavigate('contacts')}
            className="text-stone-300 p-5 rounded-lg text-left transition-all hover:scale-105 active:scale-95"
            style={{
              background: STYLES.darkGradient,
              border: STYLES.goldBorder,
              boxShadow: STYLES.goldShadow
            }}
          >
            <div className="text-3xl mb-2">📇</div>
            <div className="font-bold text-base">Contacts</div>
            <div className="text-xs text-stone-500 mt-1">Tap to call</div>
          </button>

          <button
            onClick={() => onNavigate('project-details')}
            className="text-stone-300 p-5 rounded-lg text-left transition-all hover:scale-105 active:scale-95"
            style={{
              background: STYLES.darkGradient,
              border: STYLES.goldBorder,
              boxShadow: STYLES.goldShadow
            }}
          >
            <div className="text-3xl mb-2">📄</div>
            <div className="font-bold text-base">Details</div>
            <div className="text-xs text-stone-500 mt-1">Project info</div>
          </button>
        </div>
      </div>
    </div>
  );
}

// ===== PROJECT LIST SCREEN - MATCHES DESKTOP =====
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
        <div className="text-stone-300 text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto bg-black">
      <style>{shimmerStyle}</style>
      
      {/* Gold Header */}
      <div className="w-full h-24 shimmer-gold" style={{ 
        background: STYLES.goldGradient,
        boxShadow: '0 4px 20px rgba(139, 115, 85, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)'
      }}>
        <div className="flex items-center justify-center h-full relative px-6">
          <img 
            src="https://customer-assets.emergentagent.com/job_sleek-showcase-46/artifacts/c5c84fh5_Established%20logo.png" 
            alt="ESTABLISHED DESIGN CO." 
            className="h-14 object-contain"
            style={{
              filter: 'drop-shadow(0 0 10px rgba(255, 215, 0, 0.4))',
              maxWidth: '100%'
            }}
          />
        </div>
      </div>
      
      <div className="px-6 py-6">
        {/* Back Button */}
        <button 
          onClick={() => onNavigate('home')}
          className="text-stone-300 px-4 py-2 rounded-lg mb-6 transition-all hover:scale-105"
          style={{
            background: STYLES.darkGradient,
            border: STYLES.goldBorder,
            boxShadow: STYLES.goldShadow
          }}
        >
          ← Back
        </button>
        
        <h2 className="text-2xl font-bold mb-6" style={{ color: '#d4af37' }}>Projects</h2>

        {/* Projects Grid */}
        <div className="grid grid-cols-1 gap-4">
          {projects.map((project) => (
            <button
              key={project.id}
              onClick={() => onSelectProject(project)}
              className="text-left rounded-lg p-5 transition-all hover:scale-102 active:scale-98"
              style={{
                background: STYLES.darkGradient,
                border: STYLES.goldBorder,
                boxShadow: STYLES.goldShadow
              }}
            >
              <div className="flex justify-between items-start mb-2">
                <div className="font-bold text-stone-200 text-lg">{project.name}</div>
                <div style={{ color: '#d4af37' }} className="text-xl">→</div>
              </div>
              {project.client_info && (
                <div className="space-y-1 text-sm mb-3">
                  <div className="text-stone-400">👤 {project.client_info.full_name}</div>
                  <div style={{ color: '#8b7355' }}>📍 {project.client_info.address}</div>
                </div>
              )}
              <div className="flex justify-between items-center pt-3" style={{ borderTop: '1px solid #8b7355' }}>
                <span className="text-sm text-stone-400">{project.project_type || 'Renovation'}</span>
                <span className="text-sm" style={{ color: '#d4af37' }}>{project.rooms?.length || 0} rooms</span>
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
// ===== PROJECT DETAILS SCREEN =====
function ProjectDetailsScreen({ project, onNavigate }) {
  const [questionnaire, setQuestionnaire] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (project?.id) {
      loadQuestionnaire();
    }
  }, [project]);

  const loadQuestionnaire = async () => {
    try {
      const response = await axios.get(`${API_URL}/questionnaire/${project.id}`);
      setQuestionnaire(response.data);
    } catch (error) {
      console.error('Failed to load questionnaire:', error);
    } finally {
      setLoading(false);
    }
  };

  const answers = questionnaire?.answers || {};

  const InfoRow = ({ label, value }) => {
    if (!value || value === '') return null;
    return (
      <div className="mb-4">
        <div className="text-xs text-gray-400 mb-1">{label}</div>
        <div className="text-base text-[#F3F4F6]">{value}</div>
      </div>
    );
  };

  return (
    <div className="h-full overflow-auto bg-gradient-to-b from-[#0F172A] via-[#1E293B] to-[#0F172A]">
      <div className="bg-gradient-to-r from-[#1E293B] via-[#0F172A] to-[#1E293B] p-6 border-b-4 border-[#D4A574]">
        <button 
          onClick={() => onNavigate('project-menu')}
          className="text-[#D4A574] mb-4 flex items-center gap-2"
        >
          ← Back to Project Menu
        </button>
        <h1 className="text-3xl font-bold text-[#D4A574] mb-2">{project?.name}</h1>
        <p className="text-[#D4C5A9]">Project Information</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center p-12">
          <div className="text-[#D4A574]">Loading project details...</div>
        </div>
      ) : (
        <div className="p-6 space-y-6">
          {/* Client Information */}
          <div className="bg-gradient-to-br from-gray-900 to-black p-6 rounded-xl border-l-4 border-[#D4A574]">
            <h2 className="text-xl font-bold text-[#D4A574] mb-4">CLIENT INFORMATION</h2>
            <InfoRow label="Client Name" value={project?.client_info?.full_name || answers.client_name} />
            <InfoRow label="Email" value={project?.client_info?.email || answers.email} />
            <InfoRow label="Phone" value={project?.client_info?.phone || answers.phone} />
            <InfoRow label="Address" value={project?.client_info?.address || answers.address} />
            <InfoRow label="Spouse/Partner" value={answers.spouse_partner_name} />
            <InfoRow label="Spouse Phone" value={answers.spouse_partner_phone} />
          </div>

          {/* Project Details */}
          <div className="bg-gradient-to-br from-gray-900 to-black p-6 rounded-xl border-l-4 border-[#D4A574]">
            <h2 className="text-xl font-bold text-[#D4A574] mb-4">PROJECT DETAILS</h2>
            <InfoRow label="Project Type" value={project?.project_type} />
            <InfoRow label="Timeline" value={project?.timeline || answers.timeline} />
            <InfoRow label="Budget" value={project?.budget || answers.budget_range} />
            <InfoRow label="Property Type" value={answers.property_type} />
          </div>

          {/* New Build Team */}
          {(answers.new_build_architect || answers.new_build_builder) && (
            <div className="bg-gradient-to-br from-gray-900 to-black p-6 rounded-xl border-l-4 border-[#D4A574]">
              <h2 className="text-xl font-bold text-[#D4A574] mb-4">NEW BUILD TEAM</h2>
              <InfoRow label="Architect" value={answers.new_build_architect} />
              <InfoRow label="Architect Phone" value={answers.new_build_architect_phone} />
              <InfoRow label="Builder" value={answers.new_build_builder} />
              <InfoRow label="Builder Phone" value={answers.new_build_builder_phone} />
              <InfoRow label="New Build Address" value={answers.new_build_address} />
            </div>
          )}

          {/* Rooms */}
          {project?.rooms && project.rooms.length > 0 && (
            <div className="bg-gradient-to-br from-gray-900 to-black p-6 rounded-xl border-l-4 border-[#D4A574]">
              <h2 className="text-xl font-bold text-[#D4A574] mb-4">ROOMS IN PROJECT</h2>
              <div className="flex flex-wrap gap-2">
                {project.rooms.map((room, index) => (
                  <div key={room.id || index} className="bg-[#374151] px-3 py-2 rounded-full border border-[#D4A574]">
                    <span className="text-[#D4A574] text-sm">{room.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-4">
            <button
              onClick={() => onNavigate('contacts')}
              className="w-full bg-gradient-to-r from-[#D4A574] to-[#BCA888] text-[#1F2937] font-bold py-4 rounded-xl"
            >
              📋 View Contacts
            </button>
            <button
              onClick={() => onNavigate('walkthrough')}
              className="w-full bg-gradient-to-r from-[#D4A574] to-[#BCA888] text-[#1F2937] font-bold py-4 rounded-xl"
            >
              📸 Start Walkthrough
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ===== CONTACTS SCREEN =====
function ContactsScreen({ project, onNavigate }) {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [online, setOnline] = useState(navigator.onLine);
  const [lastSynced, setLastSynced] = useState(null);

  useEffect(() => {
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    if (project?.id) {
      loadContacts();
    }
  }, [project, online]);

  const loadContacts = async () => {
    try {
      if (isOnline()) {
        // Online: Load from server and cache
        const response = await axios.get(`${API_URL}/contacts/project/${project.id}`);
        const serverContacts = response.data || [];
        setContacts(serverContacts);
        setLastSynced(new Date());
        // Save to offline storage
        await saveContactsOffline(serverContacts, project.id);
        console.log('✅ Contacts synced and cached');
      } else {
        // Offline: Load from cache
        const cachedContacts = await getContactsOffline(project.id);
        setContacts(cachedContacts || []);
        console.log('📴 Loaded contacts from offline cache');
      }
    } catch (error) {
      console.error('Failed to load contacts:', error);
      // Try offline cache on error
      try {
        const cachedContacts = await getContactsOffline(project.id);
        setContacts(cachedContacts || []);
      } catch (cacheError) {
        console.error('Failed to load from cache:', cacheError);
      }
    } finally {
      setLoading(false);
    }
  };

  const groupedContacts = contacts.reduce((acc, contact) => {
    const role = contact.role || 'Other';
    if (!acc[role]) acc[role] = [];
    acc[role].push(contact);
    return acc;
  }, {});

  const roleOrder = ['Client', 'Spouse/Partner', 'Architect', 'Builder', 'Interior Designer', 'General Contractor'];
  const sortedRoles = [
    ...roleOrder.filter(role => groupedContacts[role]),
    ...Object.keys(groupedContacts).filter(role => !roleOrder.includes(role))
  ];

  return (
    <div className="h-full overflow-auto bg-gradient-to-b from-[#0F172A] via-[#1E293B] to-[#0F172A]">
      <div className="bg-gradient-to-r from-[#1E293B] via-[#0F172A] to-[#1E293B] p-6 border-b-4 border-[#D4A574]">
        <button 
          onClick={() => onNavigate('project-menu')}
          className="text-[#D4A574] mb-4 flex items-center gap-2"
        >
          ← Back to Project Menu
        </button>
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-[#D4A574] mb-2">Project Contacts</h1>
            <p className="text-[#D4C5A9]">{contacts.length} contact(s)</p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${online ? 'bg-green-600/20 text-green-400' : 'bg-red-600/20 text-red-400'}`}>
              <span className={`w-2 h-2 rounded-full ${online ? 'bg-green-500' : 'bg-red-500'}`}></span>
              <span className="text-sm font-bold">{online ? 'ONLINE' : 'OFFLINE'}</span>
            </div>
            {lastSynced && (
              <span className="text-xs text-gray-400">Synced: {lastSynced.toLocaleTimeString()}</span>
            )}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center p-12">
          <div className="text-[#D4A574]">Loading contacts...</div>
        </div>
      ) : contacts.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 text-center">
          <div className="text-6xl mb-4">📇</div>
          <div className="text-xl text-gray-400 mb-2">No contacts found</div>
          <div className="text-sm text-gray-500">Contacts will appear after questionnaire submission</div>
        </div>
      ) : (
        <div className="p-6 space-y-6">
          {sortedRoles.map((role) => (
            <div key={role}>
              <h2 className="text-lg font-bold text-[#D4A574] mb-3">{role}</h2>
              {groupedContacts[role].map((contact, index) => (
                <div key={contact.id || index} className="bg-gradient-to-br from-gray-900 to-black p-5 rounded-xl border-l-4 border-[#D4A574] mb-3">
                  <div className="text-lg font-bold text-[#F3F4F6] mb-3">{contact.name}</div>
                  {contact.company && (
                    <div className="text-sm text-gray-400 mb-3">{contact.company}</div>
                  )}
                  {contact.phone && (
                    <a href={`tel:${contact.phone}`} className="flex items-center gap-2 text-[#D4C5A9] mb-2">
                      <span>📞</span>
                      <span>{contact.phone}</span>
                    </a>
                  )}
                  {contact.email && (
                    <a href={`mailto:${contact.email}`} className="flex items-center gap-2 text-[#D4C5A9] mb-2">
                      <span>✉️</span>
                      <span>{contact.email}</span>
                    </a>
                  )}
                  {contact.address && (
                    <div className="flex items-center gap-2 text-[#D4C5A9]">
                      <span>📍</span>
                      <span>{contact.address}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function MobileAppSimulator() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [screen, setScreen] = useState(searchParams.get('screen') || 'home');
  const [selectedProject, setSelectedProject] = useState(() => {
    const saved = localStorage.getItem('mobileAppProject');
    return saved ? JSON.parse(saved) : null;
  });
  const [selectedRoom, setSelectedRoom] = useState(null);
  
  // Restore screen from URL on load
  useEffect(() => {
    const urlScreen = searchParams.get('screen');
    if (urlScreen) {
      setScreen(urlScreen);
    }
  }, []);
  
  // Update URL when screen changes
  const handleNavigate = (screenName) => {
    setScreen(screenName);
    setSearchParams({ screen: screenName });
  };

  const handleSelectProject = async (project) => {
    // Save project to localStorage
    localStorage.setItem('mobileAppProject', JSON.stringify(project));
    
    // Load full project with walkthrough data
    try {
      const walkthroughResponse = await axios.get(`${API_URL}/projects/${project.id}?sheet_type=walkthrough`);
      const ffeResponse = await axios.get(`${API_URL}/projects/${project.id}?sheet_type=ffe`);
      
      const fullProject = {
        ...project,
        walkthroughData: walkthroughResponse.data,
        ffeData: ffeResponse.data
      };
      
      setSelectedProject(fullProject);
      localStorage.setItem('mobileAppProject', JSON.stringify(fullProject));
    } catch (error) {
      console.error('Failed to load project details:', error);
      setSelectedProject(project);
      localStorage.setItem('mobileAppProject', JSON.stringify(project));
    }
    handleNavigate('project-menu');
  };

  const handleSelectRoom = (room) => {
    setSelectedRoom(room);
    handleNavigate('photos');
  };

  const renderScreen = () => {
    switch (screen) {
      case 'home':
        return <MobileHomeScreen onNavigate={handleNavigate} />;
      case 'projects':
        return <MobileProjectListScreen onNavigate={handleNavigate} onSelectProject={handleSelectProject} />;
      case 'project-menu':
        return <ProjectMenuScreen project={selectedProject} onNavigate={handleNavigate} />;
      case 'walkthrough':
        return (
          <div className="h-full flex flex-col">
            <button 
              onClick={() => handleNavigate('project-menu')}
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
              onClick={() => handleNavigate('project-menu')}
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
        return <MobilePhotoManagement projectId={selectedProject?.id} onClose={() => handleNavigate('project-menu')} />;
      case 'measurements-files':
        return (
          <div className="h-full flex flex-col">
            <button 
              onClick={() => handleNavigate('project-menu')}
              className="bg-gray-700 text-white px-4 py-2 m-2 rounded font-semibold flex-shrink-0"
            >
              ← Back
            </button>
            <div className="flex-1 overflow-hidden">
              <MeasurementsAndFilesPage projectId={selectedProject?.id} />
            </div>
          </div>
        );
      case 'project-details':
        return <ProjectDetailsScreen project={selectedProject} onNavigate={handleNavigate} />;
      case 'contacts':
        return <ContactsScreen project={selectedProject} onNavigate={handleNavigate} />;
      default:
        return <MobileHomeScreen onNavigate={handleNavigate} />;
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
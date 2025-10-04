import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL + '/api';

// ===== HOME SCREEN =====
function MobileHomeScreen({ onNavigate }) {
  const [syncStatus, setSyncStatus] = useState({ totalPending: 0 });

  return (
    <div style={styles.screen}>
      <div style={styles.header}>
        <h1 style={styles.title}>Interior Design Manager</h1>
        <p style={styles.subtitle}>On-Site Project Management</p>
      </div>

      {syncStatus.totalPending > 0 && (
        <div style={styles.syncCard}>
          <p style={styles.syncTitle}>📡 Pending Sync</p>
          <p style={styles.syncText}>{syncStatus.totalPending} items pending</p>
        </div>
      )}

      <div style={styles.actionsGrid}>
        <button
          style={{ ...styles.actionCard, ...styles.primaryCard }}
          onClick={() => onNavigate('projects')}
        >
          <div style={styles.actionIcon}>📋</div>
          <div style={styles.actionTitle}>Projects</div>
          <div style={styles.actionSubtitle}>View all projects</div>
        </button>

        <button style={{ ...styles.actionCard, ...styles.secondaryCard }}>
          <div style={styles.actionIcon}>🏠</div>
          <div style={styles.actionTitle}>Walkthrough</div>
          <div style={styles.actionSubtitle}>On-site checklists</div>
        </button>

        <button style={{ ...styles.actionCard, ...styles.secondaryCard }}>
          <div style={styles.actionIcon}>📸</div>
          <div style={styles.actionTitle}>Photos</div>
          <div style={styles.actionSubtitle}>Manage project photos</div>
        </button>

        <button style={{ ...styles.actionCard, ...styles.secondaryCard }}>
          <div style={styles.actionIcon}>📏</div>
          <div style={styles.actionTitle}>Leica D5</div>
          <div style={styles.actionSubtitle}>Laser measurements</div>
        </button>
      </div>

      <div style={styles.infoCard}>
        <p style={styles.infoTitle}>✨ Features</p>
        <p style={styles.infoText}>• Offline-first design</p>
        <p style={styles.infoText}>• Photo capture with room organization</p>
        <p style={styles.infoText}>• Leica D5 laser measurement integration</p>
        <p style={styles.infoText}>• Photo annotation with measurements</p>
        <p style={styles.infoText}>• Auto-sync when online</p>
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
      <div style={styles.screen}>
        <div style={styles.centerContainer}>
          <div style={styles.loader}>Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.screen}>
      <button style={styles.backButton} onClick={() => onNavigate('home')}>
        ← Back
      </button>
      
      <div style={styles.header}>
        <h2 style={styles.title}>Projects</h2>
      </div>

      <div style={styles.projectList}>
        {projects.map((project) => (
          <button
            key={project.id}
            style={styles.projectCard}
            onClick={() => onSelectProject(project)}
          >
            <div style={styles.projectHeader}>
              <div style={styles.projectName}>{project.name}</div>
              <div style={styles.projectArrow}>→</div>
            </div>
            {project.client_info && (
              <div style={styles.projectInfo}>
                <div style={styles.clientName}>
                  👤 {project.client_info.full_name}
                </div>
                <div style={styles.projectDetail}>
                  📍 {project.client_info.address}
                </div>
              </div>
            )}
            <div style={styles.projectFooter}>
              <span style={styles.projectType}>{project.project_type || 'Renovation'}</span>
              <span style={styles.roomCount}>{project.rooms?.length || 0} rooms</span>
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
    <div style={styles.screen}>
      <button style={styles.backButton} onClick={() => onNavigate('projects')}>
        ← Back
      </button>

      <div style={styles.header}>
        <h2 style={styles.projectTitle}>{project?.name}</h2>
        <p style={styles.subtitle}>Select a room to manage photos</p>
      </div>

      <div style={styles.roomsGrid}>
        {rooms.map((room) => (
          <button
            key={room.id}
            style={{ ...styles.roomCard, backgroundColor: room.color || '#1F2937' }}
            onClick={() => onSelectRoom(room)}
          >
            <div style={styles.roomIcon}>🏠</div>
            <div style={styles.roomName}>{room.name}</div>
            <div style={styles.roomSubtitle}>
              {room.categories?.length || 0} categories
            </div>
            <div style={styles.photoIndicator}>
              <span style={styles.photoIndicatorText}>📸 Photos →</span>
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
      const response = await axios.get(
        `${API_URL}/photos/by-room/${project.id}/${room.id}`
      );
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
      
      // Convert to base64
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result;
        
        // Upload to backend
        await axios.post(`${API_URL}/photos/upload`, {
          project_id: project.id,
          room_id: room.id,
          photo_data: base64,
          file_name: file.name,
          metadata: {
            timestamp: new Date().toISOString(),
          },
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
    <div style={styles.screen}>
      <button style={styles.backButton} onClick={() => onNavigate('walkthrough')}>
        ← Back
      </button>

      <div style={styles.photoHeader}>
        <div>
          <div style={styles.projectName}>{project.name}</div>
          <div style={styles.roomName}>📍 {room.name}</div>
        </div>
        <div style={styles.storageInfo}>
          <div style={styles.storageText}>{photos.length} photos</div>
        </div>
      </div>

      <div style={styles.actions}>
        <label style={{ ...styles.actionButton, ...styles.primaryButton }}>
          {uploading ? 'Uploading...' : '📷 Upload Photo'}
          <input
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            style={{ display: 'none' }}
            disabled={uploading}
          />
        </label>
        
        <button style={{ ...styles.actionButton, ...styles.secondaryButton }}>
          📏 Measure
        </button>
      </div>

      <div style={styles.photoGrid}>
        {loading ? (
          <div style={styles.centerContainer}>Loading photos...</div>
        ) : photos.length === 0 ? (
          <div style={styles.emptyContainer}>
            <div style={styles.emptyIcon}>📸</div>
            <div style={styles.emptyText}>No photos yet</div>
            <div style={styles.emptySubtext}>Upload photos for this room</div>
          </div>
        ) : (
          <div style={styles.photoRow}>
            {photos.map((photo) => (
              <div
                key={photo.id}
                style={styles.photoItem}
                onClick={() => setSelectedPhoto(photo)}
              >
                <img
                  src={photo.photo_data}
                  alt={photo.file_name}
                  style={styles.photoImage}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Photo Modal */}
      {selectedPhoto && (
        <div style={styles.modalContainer} onClick={() => setSelectedPhoto(null)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <img
              src={selectedPhoto.photo_data}
              alt={selectedPhoto.file_name}
              style={styles.modalImage}
            />
            <div style={styles.modalActions}>
              <button
                style={{ ...styles.modalButton, ...styles.deleteButton }}
                onClick={() => handleDeletePhoto(selectedPhoto.id)}
              >
                🗑️ Delete
              </button>
              <button
                style={{ ...styles.modalButton, ...styles.closeButton }}
                onClick={() => setSelectedPhoto(null)}
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
        return (
          <MobileProjectListScreen
            onNavigate={setScreen}
            onSelectProject={handleSelectProject}
          />
        );
      case 'walkthrough':
        return (
          <MobileWalkthroughScreen
            project={selectedProject}
            onNavigate={setScreen}
            onSelectRoom={handleSelectRoom}
          />
        );
      case 'photos':
        return (
          <MobilePhotoManagerScreen
            project={selectedProject}
            room={selectedRoom}
            onNavigate={setScreen}
          />
        );
      default:
        return <MobileHomeScreen onNavigate={setScreen} />;
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.phoneFrame}>
        <div style={styles.statusBar}>
          <span>9:41</span>
          <span>📶 📡 🔋</span>
        </div>
        {renderScreen()}
      </div>
    </div>
  );
}

// ===== STYLES =====
const styles = {
  container: {
    minHeight: '100vh',
    background: '#0F172A',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '20px',
  },
  phoneFrame: {
    width: '390px',
    height: '844px',
    background: '#111827',
    borderRadius: '40px',
    overflow: 'hidden',
    boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
    border: '8px solid #1F2937',
    position: 'relative',
  },
  statusBar: {
    height: '44px',
    background: '#000',
    color: '#fff',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0 20px',
    fontSize: '14px',
  },
  screen: {
    height: 'calc(100% - 44px)',
    overflow: 'auto',
    padding: '16px',
  },
  header: {
    marginBottom: '24px',
    textAlign: 'center',
  },
  title: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#D4A574',
    marginBottom: '8px',
  },
  subtitle: {
    fontSize: '14px',
    color: '#9CA3AF',
  },
  syncCard: {
    background: '#F59E0B',
    borderRadius: '12px',
    padding: '16px',
    marginBottom: '20px',
  },
  syncTitle: {
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: '8px',
  },
  syncText: {
    fontSize: '14px',
    color: '#1F2937',
  },
  actionsGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '12px',
    marginBottom: '20px',
  },
  actionCard: {
    borderRadius: '16px',
    padding: '20px',
    border: 'none',
    cursor: 'pointer',
    textAlign: 'center',
  },
  primaryCard: {
    background: '#D4A574',
    gridColumn: '1 / -1',
  },
  secondaryCard: {
    background: '#1F2937',
    border: '2px solid #374151',
  },
  actionIcon: {
    fontSize: '32px',
    marginBottom: '8px',
  },
  actionTitle: {
    fontSize: '16px',
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: '4px',
  },
  actionSubtitle: {
    fontSize: '12px',
    color: '#9CA3AF',
  },
  infoCard: {
    background: '#1F2937',
    borderRadius: '12px',
    padding: '16px',
  },
  infoTitle: {
    fontSize: '16px',
    fontWeight: 'bold',
    color: '#D4A574',
    marginBottom: '12px',
  },
  infoText: {
    fontSize: '14px',
    color: '#D1D5DB',
    marginBottom: '8px',
  },
  backButton: {
    background: '#374151',
    color: '#D4A574',
    border: 'none',
    padding: '10px 16px',
    borderRadius: '8px',
    cursor: 'pointer',
    marginBottom: '16px',
    fontSize: '14px',
    fontWeight: '600',
  },
  projectList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  projectCard: {
    background: '#1F2937',
    borderRadius: '16px',
    padding: '16px',
    border: '1px solid #374151',
    cursor: 'pointer',
    textAlign: 'left',
  },
  projectHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px',
  },
  projectName: {
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#D4A574',
  },
  projectArrow: {
    fontSize: '20px',
    color: '#D4A574',
  },
  projectInfo: {
    marginBottom: '12px',
  },
  clientName: {
    fontSize: '14px',
    color: '#D1D5DB',
    marginBottom: '4px',
  },
  projectDetail: {
    fontSize: '12px',
    color: '#9CA3AF',
  },
  projectFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    paddingTop: '12px',
    borderTop: '1px solid #374151',
  },
  projectType: {
    fontSize: '12px',
    color: '#D4A574',
    fontWeight: '600',
  },
  roomCount: {
    fontSize: '12px',
    color: '#9CA3AF',
  },
  projectTitle: {
    fontSize: '20px',
    fontWeight: 'bold',
    color: '#D4A574',
    marginBottom: '8px',
  },
  roomsGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '12px',
  },
  roomCard: {
    borderRadius: '16px',
    padding: '16px',
    border: '1px solid #374151',
    cursor: 'pointer',
    textAlign: 'center',
  },
  roomIcon: {
    fontSize: '32px',
    marginBottom: '8px',
  },
  roomName: {
    fontSize: '16px',
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: '4px',
  },
  roomSubtitle: {
    fontSize: '12px',
    color: '#D1D5DB',
    marginBottom: '12px',
  },
  photoIndicator: {
    paddingTop: '8px',
    borderTop: '1px solid rgba(255, 255, 255, 0.2)',
  },
  photoIndicatorText: {
    fontSize: '12px',
    color: '#D4A574',
    fontWeight: '600',
  },
  photoHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
    paddingBottom: '16px',
    borderBottom: '1px solid #374151',
  },
  storageInfo: {
    textAlign: 'right',
  },
  storageText: {
    fontSize: '14px',
    color: '#D1D5DB',
  },
  actions: {
    display: 'flex',
    gap: '12px',
    marginBottom: '16px',
  },
  actionButton: {
    flex: 1,
    borderRadius: '12px',
    padding: '12px',
    border: 'none',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
    color: '#FFFFFF',
  },
  photoGrid: {
    minHeight: '300px',
  },
  photoRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '8px',
  },
  photoItem: {
    aspectRatio: '1',
    borderRadius: '8px',
    overflow: 'hidden',
    background: '#1F2937',
    cursor: 'pointer',
  },
  photoImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  centerContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '200px',
    color: '#9CA3AF',
  },
  emptyContainer: {
    textAlign: 'center',
    paddingTop: '60px',
  },
  emptyIcon: {
    fontSize: '64px',
    marginBottom: '16px',
  },
  emptyText: {
    fontSize: '18px',
    color: '#9CA3AF',
    marginBottom: '8px',
  },
  emptySubtext: {
    fontSize: '14px',
    color: '#6B7280',
  },
  modalContainer: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0, 0, 0, 0.9)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalContent: {
    width: '90%',
    maxWidth: '600px',
  },
  modalImage: {
    width: '100%',
    height: 'auto',
    maxHeight: '70vh',
    borderRadius: '12px',
    objectFit: 'contain',
  },
  modalActions: {
    display: 'flex',
    gap: '12px',
    marginTop: '16px',
  },
  modalButton: {
    flex: 1,
    padding: '12px',
    borderRadius: '8px',
    border: 'none',
    cursor: 'pointer',
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: '14px',
  },
  deleteButton: {
    background: '#EF4444',
  },
  closeButton: {
    background: '#6B7280',
  },
  loader: {
    fontSize: '18px',
    color: '#D4A574',
  },
};
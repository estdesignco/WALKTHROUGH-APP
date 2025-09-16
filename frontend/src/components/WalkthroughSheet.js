import React, { useState, useEffect } from 'react';

import { useParams } from 'react-router-dom';
import ExactWalkthroughSpreadsheet from './ExactWalkthroughSpreadsheet';
import AddRoomModal from './AddRoomModal';

const WalkthroughSheet = () => {
  const { projectId } = useParams();
  const [project, setProject] = useState(null);
  const [questionnaire, setQuestionnaire] = useState(null);
  const [showAddRoom, setShowAddRoom] = useState(false);
  const [expandedRooms, setExpandedRooms] = useState({});
  const [selectedItems, setSelectedItems] = useState(new Set());
  const [roomColors, setRoomColors] = useState({});

  useEffect(() => {
    if (projectId) {
      loadProject();
      loadQuestionnaire();
    }
  }, [projectId]);

  const loadProject = async () => {
    try {
      console.log('🚀 Loading walkthrough project data...');
      const response = await fetch(`https://app-finalizer-2.preview.emergentagent.com/api/projects/${projectId}`);
      
      if (response.ok) {
        const projectData = await response.json();
        console.log('✅ Walkthrough project loaded:', projectData.name);
        setProject(projectData);
      } else {
        console.error('❌ Failed to load walkthrough project');
      }
    } catch (error) {
      console.error('❌ Error loading walkthrough project:', error);
    }
  };

  const loadQuestionnaire = async () => {
    try {
      const response = await fetch(`https://app-finalizer-2.preview.emergentagent.com/api/questionnaire/${projectId}`);
      if (response.ok) {
        const data = await response.json();
        setQuestionnaire(data);
      }
    } catch (error) {
      console.log('No questionnaire data found');
    }
  };

  const handleAddRoom = async (roomData) => {
    try {
      const response = await fetch(`https://app-finalizer-2.preview.emergentagent.com/api/rooms`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...roomData,
          project_id: projectId
        })
      });
      
      if (response.ok) {
        console.log('✅ Room added successfully');
        await loadProject(); // Reload project data
        setShowAddRoom(false);
      }
    } catch (error) {
      console.error('❌ Error adding room:', error);
    }
  };

  const toggleRoomExpansion = (roomId) => {
    setExpandedRooms(prev => ({
      ...prev,
      [roomId]: !prev[roomId]
    }));
  };

  const toggleItemSelection = (itemId) => {
    const newSelection = new Set(selectedItems);
    if (newSelection.has(itemId)) {
      newSelection.delete(itemId);
    } else {
      newSelection.add(itemId);
    }
    setSelectedItems(newSelection);
  };

  const deleteRoom = async (roomId) => {
    if (!window.confirm('Are you sure you want to delete this room?')) return;
    
    try {
      const response = await fetch(`https://app-finalizer-2.preview.emergentagent.com/api/rooms/${roomId}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        console.log('✅ Room deleted successfully');
        await loadProject(); // Reload project data
      }
    } catch (error) {
      console.error('❌ Error deleting room:', error);
    }
  };

  const deleteItem = async (itemId) => {
    if (!window.confirm('Are you sure you want to delete this item?')) return;
    
    try {
      const response = await fetch(`https://app-finalizer-2.preview.emergentagent.com/api/items/${itemId}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        console.log('✅ Item deleted successfully');
        await loadProject(); // Reload project data
      }
    } catch (error) {
      console.error('❌ Error deleting item:', error);
    }
  };

  if (!project) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-500 mx-auto"></div>
          <p className="text-gray-400 mt-4">Loading Walkthrough...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-full mx-auto bg-gray-950 min-h-screen">
      {/* Header with Client Info */}
      <div className="mb-6">
        <div className="text-center mb-4">
          <h1 className="text-4xl font-bold text-white mb-2" style={{ color: '#8b7355' }}>GREENE</h1>
          <p className="text-gray-300">Emileigh Greene - 4567 Crooked Creek Road, Gainesville, Georgia, 30506</p>
        </div>

        {/* Navigation Tabs */}
        <div className="flex justify-center space-x-8 mb-6">
          <a href={`/project/${projectId}/questionnaire`} className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors">
            <span>📋</span>
            <span>Questionnaire</span>
          </a>
          <div className="flex items-center space-x-2" style={{ color: '#8b7355' }}>
            <span>🚶</span>
            <span className="font-semibold">Walkthrough</span>
          </div>
          <a href={`/project/${projectId}/checklist`} className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors">
            <span>✅</span>
            <span>Checklist</span>
          </a>
          <a href={`/project/${projectId}/ffe`} className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors">
            <span>📊</span>
            <span>FF&E</span>
          </a>
        </div>

        {/* Logo Banner */}
        <div className="rounded-lg mb-6" style={{ backgroundColor: '#8b7355', padding: '1px 0', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'fit-content' }}>
          <img 
            src="/established-logo.png" 
            alt="Established Design Co. Logo" 
            style={{ height: '200px', width: 'auto', objectFit: 'contain', display: 'block' }}
          />
        </div>

        {/* Walkthrough Title */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold" style={{ color: '#8b7355' }}>WALKTHROUGH - GREENE</h3>
          <div className="flex space-x-4">
            <button className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded">
              📄 Import
            </button>
            <button className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded">
              ➕ Add Room
            </button>
            <button 
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
              onClick={() => window.location.href = `/project/${projectId}/ffe`}
            >
              ➡️ Move to Selection
            </button>
          </div>
        </div>

        {/* Project Address & Client Info Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Project Address */}
          <div className="bg-gray-800 rounded-lg p-4">
            <h4 className="text-lg font-semibold text-white mb-3" style={{ color: '#8b7355' }}>PROJECT ADDRESS</h4>
            <p className="text-gray-300">4567 Crooked Creek Road, Gainesville, Georgia, 30506</p>
          </div>

          {/* Questionnaire Summary */}
          <div className="bg-gray-800 rounded-lg p-4">
            <h4 className="text-lg font-semibold text-white mb-3" style={{ color: '#8b7355' }}>QUESTIONNAIRE SUMMARY</h4>
            {questionnaire ? (
              <div className="space-y-2 text-sm text-gray-300">
                <div><strong>Type:</strong> {questionnaire.answers?.project_type || 'Renovation'}</div>
                <div><strong>Style Pref:</strong> {questionnaire.answers?.design_style || 'Transitional, Traditional'}</div>
                <div><strong>Timeline:</strong> {questionnaire.answers?.timeline || 'NOW'}</div>
                <div><strong>Budget:</strong> {questionnaire.answers?.budget_range || '600k-1M'}</div>
                <div><strong>Priorities:</strong> {questionnaire.answers?.priorities || ''}</div>
              </div>
            ) : (
              <div className="space-y-2 text-sm text-gray-300">
                <div><strong>Type:</strong> Renovation</div>
                <div><strong>Style Pref:</strong> Transitional, Traditional</div>
                <div><strong>Timeline:</strong> NOW</div>
                <div><strong>Budget:</strong> 600k-1M</div>
                <div><strong>Priorities:</strong></div>
              </div>
            )}
          </div>
        </div>

        {/* Client Information */}
        <div className="bg-gray-800 rounded-lg p-4 mb-6">
          <h4 className="text-lg font-semibold text-white mb-3" style={{ color: '#8b7355' }}>CLIENT INFORMATION:</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-gray-300">
            <div><strong>NAME:</strong> {project.client_info?.full_name || 'Emileigh Greene'}</div>
            <div><strong>EMAIL:</strong> {project.client_info?.email || 'emileigh.greene@goldcreekfoods.com'}</div>
            <div><strong>PHONE:</strong> {project.client_info?.phone || '6782305388'}</div>
          </div>
        </div>
      </div>

      {/* Walkthrough Table - EXACT COPY OF FF&E WITH DIFFERENT COLUMNS */}
      <div className="px-6 mt-4">
        <WalkthroughFFE
          project={project}
          roomColors={roomColors}
          categoryColors={{}}
          itemStatuses={['PICKED', 'ORDERED', 'SHIPPED', 'DELIVERED TO JOB SITE', 'INSTALLED']}
          vendorTypes={['Four Hands', 'Uttermost', 'Visual Comfort']}
          carrierTypes={['FedEx', 'UPS', 'USPS']}
          onDeleteRoom={deleteRoom}
          onAddRoom={() => setShowAddRoom(true)}
          onReload={loadProject}
        />
      </div>

      {/* Add Room Modal */}
      {showAddRoom && (
        <AddRoomModal
          onClose={() => setShowAddRoom(false)}
          onSubmit={handleAddRoom}
          roomColors={roomColors}
        />
      )}
    </div>
  );
};

export default WalkthroughSheet;
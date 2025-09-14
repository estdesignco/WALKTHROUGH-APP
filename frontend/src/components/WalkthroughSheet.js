import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';

const WalkthroughSheet = () => {
  const { projectId } = useParams();
  const [project, setProject] = useState(null);
  const [questionnaire, setQuestionnaire] = useState(null);
  const [expandedRooms, setExpandedRooms] = useState({});
  const [selectedItems, setSelectedItems] = useState(new Set());

  useEffect(() => {
    if (projectId) {
      loadProject();
      loadQuestionnaire();
    }
  }, [projectId]);

  const loadProject = async () => {
    try {
      const response = await fetch(`https://code-scanner-14.preview.emergentagent.com/api/projects/${projectId}`);
      if (response.ok) {
        const projectData = await response.json();
        setProject(projectData);
        
        // Initialize all rooms as expanded
        const roomExpansion = {};
        projectData.rooms.forEach(room => {
          roomExpansion[room.id] = true;
        });
        setExpandedRooms(roomExpansion);
      }
    } catch (error) {
      console.error('Error loading project:', error);
    }
  };

  const loadQuestionnaire = async () => {
    try {
      const response = await fetch(`https://code-scanner-14.preview.emergentagent.com/api/questionnaire/${projectId}`);
      if (response.ok) {
        const data = await response.json();
        setQuestionnaire(data);
      }
    } catch (error) {
      console.log('No questionnaire data found');
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
      const response = await fetch(`https://code-scanner-14.preview.emergentagent.com/api/rooms/${roomId}`, {
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
      const response = await fetch(`https://code-scanner-14.preview.emergentagent.com/api/items/${itemId}`, {
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

      {/* Walkthrough Table - Simplified Version of FF&E */}
      <div className="w-full overflow-x-auto" style={{ backgroundColor: '#0F172A', touchAction: 'pan-x' }}>
        <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch', minWidth: '800px' }}>
          <table className="w-full border-collapse border border-gray-400">
            <thead>
              <tr>
                <th className="border border-gray-400 px-3 py-2 text-xs font-bold text-white" style={{ backgroundColor: '#8b7355' }}>✓</th>
                <th className="border border-gray-400 px-3 py-2 text-xs font-bold text-white" style={{ backgroundColor: '#7F1D1D' }}>ROOM/CATEGORY</th>
                <th className="border border-gray-400 px-3 py-2 text-xs font-bold text-white" style={{ backgroundColor: '#92400E' }}>QTY</th>
                <th className="border border-gray-400 px-3 py-2 text-xs font-bold text-white" style={{ backgroundColor: '#92400E' }}>SIZE</th>
                <th className="border border-gray-400 px-3 py-2 text-xs font-bold text-white" style={{ backgroundColor: '#7F1D1D' }}>REMARKS</th>
                <th className="border border-gray-400 px-3 py-2 text-xs font-bold text-white" style={{ backgroundColor: '#7F1D1D' }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {project.rooms.map((room, roomIndex) => {
                const isRoomExpanded = expandedRooms[room.id];
                
                return (
                  <React.Fragment key={room.id}>
                    {/* Room Header */}
                    <tr>
                      <td className="border border-gray-400 px-2 py-2 text-center">
                        <input 
                          type="checkbox" 
                          className="w-4 h-4"
                          onChange={() => {
                            // Toggle all items in room
                            room.categories.forEach(category => {
                              category.subcategories.forEach(subcategory => {
                                subcategory.items.forEach(item => {
                                  toggleItemSelection(item.id);
                                });
                              });
                            });
                          }}
                        />
                      </td>
                      <td 
                        colSpan="4" 
                        className="border border-gray-400 px-3 py-2 text-white text-sm font-bold cursor-pointer"
                        style={{ backgroundColor: '#065F46' }}
                        onClick={() => toggleRoomExpansion(room.id)}
                      >
                        <div className="flex justify-between items-center">
                          <span>🏠 {room.name.toUpperCase()} ({room.categories?.reduce((total, cat) => total + cat.subcategories?.reduce((subTotal, sub) => subTotal + (sub.items?.length || 0), 0), 0)} Items)</span>
                          <span>{isRoomExpanded ? '🔽' : '▶️'}</span>
                        </div>
                      </td>
                      <td className="border border-gray-400 px-2 py-2 text-center">
                        <button 
                          onClick={() => deleteRoom(room.id)}
                          className="bg-red-600 hover:bg-red-500 text-white text-xs px-2 py-1 rounded"
                        >
                          🗑️
                        </button>
                      </td>
                    </tr>

                    {/* Room Categories and Items */}
                    {isRoomExpanded && room.categories.map((category, catIndex) => (
                      <React.Fragment key={category.id}>
                        {/* Category Header */}
                        <tr>
                          <td className="border border-gray-400 px-2 py-2"></td>
                          <td 
                            colSpan="4"
                            className="border border-gray-400 px-4 py-2 text-white text-sm font-bold"
                            style={{ backgroundColor: '#065F46' }}
                          >
                            📂 {category.name.toUpperCase()}
                          </td>
                          <td className="border border-gray-400 px-2 py-2"></td>
                        </tr>

                        {/* Subcategory Items */}
                        {category.subcategories.map((subcategory) => 
                          subcategory.items.map((item, itemIndex) => (
                            <tr key={item.id}>
                              <td className="border border-gray-400 px-2 py-2 text-center">
                                <input 
                                  type="checkbox" 
                                  className="w-4 h-4"
                                  checked={selectedItems.has(item.id)}
                                  onChange={() => toggleItemSelection(item.id)}
                                />
                              </td>
                              <td className="border border-gray-400 px-4 py-2 text-white text-sm">
                                {subcategory.name}: {item.name}
                              </td>
                              <td className="border border-gray-400 px-2 py-2 text-white text-sm text-center">
                                {item.quantity || 1}
                              </td>
                              <td className="border border-gray-400 px-2 py-2 text-white text-sm">
                                <input 
                                  type="text" 
                                  className="w-full bg-transparent border-none text-white text-sm"
                                  placeholder="Size"
                                  defaultValue={item.size || ''}
                                />
                              </td>
                              <td className="border border-gray-400 px-2 py-2 text-white text-sm">
                                <input 
                                  type="text" 
                                  className="w-full bg-transparent border-none text-white text-sm"
                                  placeholder="Remarks"
                                  defaultValue={item.remarks || ''}
                                />
                              </td>
                              <td className="border border-gray-400 px-2 py-2 text-center">
                                <button 
                                  onClick={() => deleteItem(item.id)}
                                  className="bg-red-600 hover:bg-red-500 text-white text-xs px-2 py-1 rounded"
                                >
                                  🗑️
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </React.Fragment>
                    ))}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Integration Buttons */}
      <div className="flex justify-center space-x-4 mt-6">
        <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded">
          📐 Sync with My Measures
        </button>
        <button className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded">
          🏠 Export to Houzz Pro
        </button>
        <button 
          className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded"
          onClick={() => window.location.href = `/project/${projectId}/checklist`}
        >
          ✅ Generate Checklist
        </button>
      </div>
    </div>
  );
};

export default WalkthroughSheet;
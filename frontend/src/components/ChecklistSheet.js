import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';

const ChecklistSheet = () => {
  const { projectId } = useParams();
  const [project, setProject] = useState(null);
  const [checklistItems, setChecklistItems] = useState([]);
  const [completedCount, setCompletedCount] = useState(0);

  useEffect(() => {
    if (projectId) {
      loadProject();
      loadChecklist();
    }
  }, [projectId]);

  const loadProject = async () => {
    try {
      const response = await fetch(`https://code-scanner-14.preview.emergentagent.com/api/projects/${projectId}`);
      if (response.ok) {
        const projectData = await response.json();
        setProject(projectData);
      }
    } catch (error) {
      console.error('Error loading project:', error);
    }
  };

  const loadChecklist = async () => {
    try {
      // Generate checklist from walkthrough data or FF&E items
      const response = await fetch(`https://code-scanner-14.preview.emergentagent.com/api/projects/${projectId}`);
      if (response.ok) {
        const projectData = await response.json();
        
        // Generate checklist items from project data
        const items = [];
        let itemId = 1;
        
        projectData.rooms.forEach(room => {
          room.categories.forEach(category => {
            category.subcategories.forEach(subcategory => {
              subcategory.items.forEach(item => {
                items.push({
                  id: itemId++,
                  room: room.name,
                  category: category.name,
                  item: item.name,
                  vendor: item.vendor || '',
                  status: item.status || 'TO BE SELECTED',
                  priority: 'Medium',
                  completed: item.status === 'PICKED' || item.status === 'ORDERED' || item.status === 'DELIVERED TO JOB SITE' || item.status === 'INSTALLED',
                  link: item.link || '',
                  canva_board: null // For Canva integration
                });
              });
            });
          });
        });
        
        setChecklistItems(items);
        setCompletedCount(items.filter(item => item.completed).length);
      }
    } catch (error) {
      console.error('Error loading checklist:', error);
    }
  };

  const toggleItemCompletion = (itemId) => {
    setChecklistItems(prev => {
      const updated = prev.map(item => 
        item.id === itemId ? { ...item, completed: !item.completed } : item
      );
      setCompletedCount(updated.filter(item => item.completed).length);
      return updated;
    });
  };

  const getCompletionPercentage = () => {
    if (checklistItems.length === 0) return 0;
    return Math.round((completedCount / checklistItems.length) * 100);
  };

  const scrapeCanvaBoard = async (itemId, canvaLink) => {
    try {
      console.log('🎨 Scraping Canva board:', canvaLink);
      
      // Use our enhanced scraping for Canva boards
      const response = await fetch('https://code-scanner-14.preview.emergentagent.com/api/scrape-product', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: canvaLink })
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Canva board scraped:', data);
        
        // Update checklist item with Canva data
        setChecklistItems(prev => 
          prev.map(item => 
            item.id === itemId 
              ? { 
                  ...item, 
                  canva_board: data.data,
                  canva_images: data.data?.image_url ? [data.data.image_url] : []
                }
              : item
          )
        );
      }
    } catch (error) {
      console.error('❌ Canva scraping failed:', error);
    }
  };

  if (!project) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-500 mx-auto"></div>
          <p className="text-gray-400 mt-4">Loading Checklist...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-full mx-auto bg-gray-950 min-h-screen">
      {/* Header */}
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
          <a href={`/project/${projectId}/walkthrough`} className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors">
            <span>🚶</span>
            <span>Walkthrough</span>
          </a>
          <div className="flex items-center space-x-2" style={{ color: '#8b7355' }}>
            <span>✅</span>
            <span className="font-semibold">Checklist</span>
          </div>
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

        {/* Checklist Title and Actions */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold" style={{ color: '#8b7355' }}>CHECKLIST - GREENE</h3>
          <div className="flex space-x-4">
            <button className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded">
              📄 Print Checklist
            </button>
            <button 
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
              onClick={() => window.location.href = `/project/${projectId}/ffe`}
            >
              ➡️ Move to FF&E
            </button>
          </div>
        </div>

        {/* Status Overview and Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Status Overview */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h4 className="text-lg font-semibold text-white mb-4" style={{ color: '#8b7355' }}>Status Overview</h4>
            <div className="flex items-center justify-center">
              <div className="relative w-32 h-32">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="#374151"
                    strokeWidth="3"
                  />
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="#10B981"
                    strokeWidth="3"
                    strokeDasharray={`${getCompletionPercentage()}, 100`}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-2xl font-bold text-white">{getCompletionPercentage()}%</span>
                </div>
              </div>
            </div>
            <div className="text-center mt-4">
              <p className="text-green-400 text-sm">PICKED ({completedCount})</p>
              <p className="text-gray-400 text-sm">TOTAL ({checklistItems.length})</p>
            </div>
          </div>

          {/* Status Breakdown */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h4 className="text-lg font-semibold text-white mb-4" style={{ color: '#8b7355' }}>Status Breakdown</h4>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-green-500 rounded"></div>
                  <span className="text-gray-300">PICKED</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="bg-gray-700 rounded-full h-2 flex-1 w-32">
                    <div 
                      className="bg-green-500 h-2 rounded-full"
                      style={{ width: `${getCompletionPercentage()}%` }}
                    ></div>
                  </div>
                  <span className="text-white font-bold text-right w-8">{completedCount}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Checklist Table - Simplified columns */}
      <div className="w-full overflow-x-auto" style={{ backgroundColor: '#0F172A' }}>
        <table className="w-full border-collapse border border-gray-400">
          <thead>
            <tr>
              <th className="border border-gray-400 px-3 py-2 text-xs font-bold text-white" style={{ backgroundColor: '#8b7355' }}>✓</th>
              <th className="border border-gray-400 px-3 py-2 text-xs font-bold text-white" style={{ backgroundColor: '#7F1D1D' }}>ROOM</th>
              <th className="border border-gray-400 px-3 py-2 text-xs font-bold text-white" style={{ backgroundColor: '#7F1D1D' }}>CATEGORY</th>
              <th className="border border-gray-400 px-3 py-2 text-xs font-bold text-white" style={{ backgroundColor: '#7F1D1D' }}>ITEM</th>
              <th className="border border-gray-400 px-3 py-2 text-xs font-bold text-white" style={{ backgroundColor: '#92400E' }}>VENDOR</th>
              <th className="border border-gray-400 px-3 py-2 text-xs font-bold text-white" style={{ backgroundColor: '#6B46C1' }}>STATUS</th>
              <th className="border border-gray-400 px-3 py-2 text-xs font-bold text-white" style={{ backgroundColor: '#7F1D1D' }}>CANVA LINK</th>
              <th className="border border-gray-400 px-3 py-2 text-xs font-bold text-white" style={{ backgroundColor: '#7F1D1D' }}>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {checklistItems.map((item) => (
              <tr key={item.id}>
                <td className="border border-gray-400 px-2 py-2 text-center">
                  <input 
                    type="checkbox" 
                    className="w-4 h-4"
                    checked={item.completed}
                    onChange={() => toggleItemCompletion(item.id)}
                  />
                </td>
                <td className="border border-gray-400 px-2 py-2 text-white text-sm">
                  {item.room}
                </td>
                <td className="border border-gray-400 px-2 py-2 text-white text-sm">
                  {item.category}
                </td>
                <td className="border border-gray-400 px-2 py-2 text-white text-sm">
                  {item.item}
                </td>
                <td className="border border-gray-400 px-2 py-2 text-white text-sm">
                  {item.vendor}
                </td>
                <td className="border border-gray-400 px-2 py-2 text-white text-sm">
                  <span 
                    className={`px-2 py-1 rounded text-xs ${
                      item.completed ? 'bg-green-600' : 'bg-gray-600'
                    }`}
                  >
                    {item.completed ? 'PICKED' : item.status}
                  </span>
                </td>
                <td className="border border-gray-400 px-2 py-2 text-white text-sm">
                  <input 
                    type="url" 
                    className="w-full bg-transparent border border-gray-600 text-white text-xs px-1 py-1 rounded"
                    placeholder="Canva board URL"
                    defaultValue={item.link}
                    onBlur={(e) => {
                      if (e.target.value.includes('canva.com')) {
                        scrapeCanvaBoard(item.id, e.target.value);
                      }
                    }}
                  />
                </td>
                <td className="border border-gray-400 px-2 py-2 text-center">
                  <button 
                    onClick={() => {
                      // Move item to FF&E sheet
                      window.location.href = `/project/${projectId}/ffe`;
                    }}
                    className="bg-blue-600 hover:bg-blue-500 text-white text-xs px-2 py-1 rounded mr-1"
                    title="Move to FF&E"
                  >
                    ➡️
                  </button>
                  <button 
                    onClick={() => window.open(`https://canva.com/design/new?template=mood-board&item=${encodeURIComponent(item.item)}`, '_blank')}
                    className="bg-purple-600 hover:bg-purple-500 text-white text-xs px-2 py-1 rounded"
                    title="Create in Canva"
                  >
                    🎨
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Canva Integration Panel */}
      <div className="mt-6 bg-gray-800 rounded-lg p-6">
        <h4 className="text-lg font-semibold text-white mb-4" style={{ color: '#8b7355' }}>
          🎨 Canva Integration
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button 
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded"
            onClick={() => window.open('https://canva.com/design/new?template=mood-board', '_blank')}
          >
            Create Mood Board
          </button>
          <button 
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded"
            onClick={() => window.open('https://canva.com/design/new?template=presentation', '_blank')}
          >
            Create Presentation
          </button>
          <button 
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded"
            onClick={() => {
              const selectedLinks = checklistItems
                .filter(item => item.link && item.link.includes('canva.com'))
                .map(item => item.link);
              
              if (selectedLinks.length > 0) {
                console.log('🎨 Batch scraping Canva boards:', selectedLinks);
                selectedLinks.forEach((link, index) => {
                  setTimeout(() => scrapeCanvaBoard(`canva_${index}`, link), index * 1000);
                });
              } else {
                alert('No Canva links found to scrape');
              }
            }}
          >
            🔄 Scrape All Canva Boards
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChecklistSheet;
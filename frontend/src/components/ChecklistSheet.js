import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';

const ChecklistSheet = () => {
  const { projectId } = useParams();
  const [project, setProject] = useState(null);
  const [checklistData, setChecklistData] = useState({
    preDesign: [],
    design: [],
    procurement: [],
    installation: [],
    completion: []
  });

  useEffect(() => {
    if (projectId) {
      loadProject();
      generateChecklist();
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
      console.error('Error loading project for checklist:', error);
    }
  };

  const generateChecklist = () => {
    // Generate comprehensive checklist based on project scope
    const preDesignTasks = [
      { id: 1, task: 'Initial client consultation', completed: false, phase: 'Discovery' },
      { id: 2, task: 'Site measurements and walkthrough', completed: false, phase: 'Discovery' },
      { id: 3, task: 'Design brief and requirements', completed: false, phase: 'Discovery' },
      { id: 4, task: 'Budget discussion and approval', completed: false, phase: 'Discovery' },
      { id: 5, task: 'Timeline establishment', completed: false, phase: 'Discovery' }
    ];

    const designTasks = [
      { id: 6, task: 'Concept development', completed: false, phase: 'Design' },
      { id: 7, task: 'Space planning and layout', completed: false, phase: 'Design' },
      { id: 8, task: 'Material and finish selection', completed: false, phase: 'Design' },
      { id: 9, task: 'Furniture and fixture selection', completed: false, phase: 'Design' },
      { id: 10, task: 'Client presentation and approval', completed: false, phase: 'Design' }
    ];

    const procurementTasks = [
      { id: 11, task: 'Final FF&E selections', completed: false, phase: 'Procurement' },
      { id: 12, task: 'Vendor sourcing and quotes', completed: false, phase: 'Procurement' },
      { id: 13, task: 'Purchase orders and contracts', completed: false, phase: 'Procurement' },
      { id: 14, task: 'Delivery coordination', completed: false, phase: 'Procurement' },
      { id: 15, task: 'Quality control inspections', completed: false, phase: 'Procurement' }
    ];

    const installationTasks = [
      { id: 16, task: 'Pre-installation site prep', completed: false, phase: 'Installation' },
      { id: 17, task: 'Fixture installation', completed: false, phase: 'Installation' },
      { id: 18, task: 'Furniture placement', completed: false, phase: 'Installation' },
      { id: 19, task: 'Styling and accessories', completed: false, phase: 'Installation' },
      { id: 20, task: 'Final walkthrough with client', completed: false, phase: 'Installation' }
    ];

    const completionTasks = [
      { id: 21, task: 'Final photography', completed: false, phase: 'Completion' },
      { id: 22, task: 'Documentation handover', completed: false, phase: 'Completion' },
      { id: 23, task: 'Warranty information', completed: false, phase: 'Completion' },
      { id: 24, task: 'Maintenance guidelines', completed: false, phase: 'Completion' },
      { id: 25, task: 'Project closeout', completed: false, phase: 'Completion' }
    ];

    setChecklistData({
      preDesign: preDesignTasks,
      design: designTasks,
      procurement: procurementTasks,
      installation: installationTasks,
      completion: completionTasks
    });
  };

  const toggleTask = (phase, taskId) => {
    setChecklistData(prev => ({
      ...prev,
      [phase]: prev[phase].map(task => 
        task.id === taskId ? { ...task, completed: !task.completed } : task
      )
    }));
  };

  const getPhaseProgress = (phaseTasks) => {
    const completed = phaseTasks.filter(task => task.completed).length;
    return Math.round((completed / phaseTasks.length) * 100);
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
    <div className="max-w-full mx-auto bg-gray-950 min-h-screen p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="text-center mb-4">
          <h1 className="text-4xl font-bold text-white mb-2" style={{ color: '#8b7355' }}>GREENE</h1>
          <p className="text-gray-300">Project Checklist & Timeline</p>
        </div>

        {/* Navigation Tabs */}
        <div className="flex justify-center space-x-8 mb-6">
          <div className="flex items-center space-x-2 text-gray-400">
            <span>📋</span>
            <span>Questionnaire</span>
          </div>
          <div className="flex items-center space-x-2 text-gray-400">
            <span>🚶</span>
            <span>Walkthrough</span>
          </div>
          <div className="flex items-center space-x-2" style={{ color: '#8b7355' }}>
            <span>✅</span>
            <span className="font-semibold">Checklist</span>
          </div>
          <div className="flex items-center space-x-2 text-gray-400">
            <span>📊</span>
            <span>FF&E</span>
          </div>
        </div>
      </div>

      {/* Checklist Phases */}
      <div className="space-y-8">
        {Object.entries(checklistData).map(([phase, tasks]) => (
          <div key={phase} className="bg-gray-800 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-white capitalize">
                {phase.replace(/([A-Z])/g, ' $1').trim()} Phase
              </h3>
              <div className="text-right">
                <div className={`text-sm ${getPhaseProgress(tasks) === 100 ? 'text-green-400' : 'text-gray-400'}`}>
                  {getPhaseProgress(tasks)}% Complete
                </div>
                <div className="w-32 bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ 
                      width: `${getPhaseProgress(tasks)}%`,
                      backgroundColor: getPhaseProgress(tasks) === 100 ? '#10B981' : '#3B82F6'
                    }}
                  ></div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {tasks.map(task => (
                <div 
                  key={task.id} 
                  className={`flex items-center space-x-3 p-3 rounded ${
                    task.completed ? 'bg-green-900/30' : 'bg-gray-700'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={task.completed}
                    onChange={() => toggleTask(phase, task.id)}
                    className="w-5 h-5 text-blue-600 bg-gray-700 border-gray-600 rounded"
                  />
                  <span className={`flex-1 ${task.completed ? 'text-green-400 line-through' : 'text-gray-300'}`}>
                    {task.task}
                  </span>
                  <span className="text-xs text-gray-500">
                    {task.phase}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Action Buttons */}
      <div className="flex justify-between mt-8">
        <button className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded">
          Export Checklist
        </button>
        <button 
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded"
          style={{ backgroundColor: '#8b7355' }}
        >
          Generate FF&E Items from Checklist
        </button>
      </div>
    </div>
  );
};

export default ChecklistSheet;
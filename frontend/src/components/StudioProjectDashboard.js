import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { projectAPI } from '../App';

const StudioProjectDashboard = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await projectAPI.getAll();
        setProjects(response.data || []);
      } catch (error) {
        console.error('Error fetching projects:', error);
        // Set some demo projects if API fails
        setProjects([
          {
            id: '1',
            projectName: 'Emergency Test Project',
            clientName: 'Emergency Test Client',
            address: '',
            status: 'Active',
            lastUpdated: '9/24/2025',
            createdDate: '9/24/2025'
          },
          {
            id: '2', 
            projectName: 'Test Project for Dashboards',
            clientName: 'Test Client',
            address: '123 Test St',
            status: 'Active',
            lastUpdated: '9/24/2025',
            createdDate: '9/24/2025'
          }
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);

  const handleNewClient = () => {
    navigate('/questionnaire/new');
  };

  const handleEmailNewClient = () => {
    navigate('/email-preview');
  };

  const handleFullQuestionnaire = () => {
    navigate('/customer/questionnaire');
  };

  const handleProjectClick = (projectId) => {
    navigate(`/project/${projectId}`);
  };

  const handleExportFFE = () => {
    navigate('/advanced-features');
  };

  const handleSpecSheet = () => {
    navigate('/workflow-dashboard');
  };

  const handleAddRoom = () => {
    // Navigate to add room functionality
    alert('Add Room functionality coming soon!');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Top Header - Cream/Beige Color */}
      <div className="w-full h-32 bg-gradient-to-r from-amber-100 to-stone-200">
        {/* Top Action Buttons */}
        <div className="flex justify-end items-start pt-4 pr-6 space-x-3">
          <button 
            onClick={handleExportFFE}
            className="bg-amber-800 hover:bg-amber-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center space-x-2"
          >
            <span>📊</span>
            <span>Export FF&E</span>
          </button>
          <button 
            onClick={handleSpecSheet}
            className="bg-amber-800 hover:bg-amber-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center space-x-2"
          >
            <span>📋</span>
            <span>Spec Sheet</span>
          </button>
          <button 
            onClick={handleAddRoom}
            className="bg-amber-800 hover:bg-amber-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center space-x-2"
          >
            <span>➕</span>
            <span>Add Room</span>
          </button>
        </div>
      </div>

      {/* Main Content Area - Dark Background */}
      <div className="px-8 py-8">
        {/* Studio Projects Title */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-light text-stone-400 mb-2">Studio Projects</h1>
          <div className="w-16 h-px bg-stone-600 mx-auto"></div>
        </div>

        {/* Main Action Buttons */}
        <div className="flex justify-center space-x-4 mb-12">
          <button 
            onClick={handleNewClient}
            className="bg-amber-800 hover:bg-amber-700 text-white px-6 py-3 rounded-full font-medium transition-colors duration-200 flex items-center space-x-2"
          >
            <span>+</span>
            <span>New Client</span>
          </button>
          <button 
            onClick={handleEmailNewClient}
            className="bg-amber-800 hover:bg-amber-700 text-white px-6 py-3 rounded-full font-medium transition-colors duration-200 flex items-center space-x-2"
          >
            <span>📧</span>
            <span>Email New Client</span>
          </button>
          <button 
            onClick={handleFullQuestionnaire}
            className="bg-amber-800 hover:bg-amber-700 text-white px-6 py-3 rounded-full font-medium transition-colors duration-200 flex items-center space-x-2"
          >
            <span>+</span>
            <span>Full Questionnaire</span>
          </button>
        </div>

        {/* Project Cards */}
        <div className="max-w-4xl mx-auto space-y-4">
          {projects.map((project) => (
            <div 
              key={project.id}
              onClick={() => handleProjectClick(project.id)}
              className="bg-gray-900 border border-gray-700 rounded-lg p-6 cursor-pointer hover:bg-gray-800 transition-colors duration-200"
            >
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl text-stone-300 font-medium">{project.projectName}</h3>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-stone-500">Last Updated</span>
                  <span className="text-sm text-stone-400">{project.lastUpdated}</span>
                  <div className="w-4 h-4 bg-stone-600 rounded"></div>
                </div>
              </div>
              
              <div className="flex justify-between items-center">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-stone-500">Client:</span>
                    <span className="text-sm text-stone-300">{project.clientName}</span>
                  </div>
                  {project.address && (
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-stone-500">Address:</span>
                      <span className="text-sm text-stone-300">{project.address}</span>
                    </div>
                  )}
                </div>
                
                <div className="text-right space-y-1">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm text-stone-300">{project.status}</span>
                  </div>
                  <div className="text-sm text-stone-500">Created {project.createdDate}</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Microsoft Teams Integration Banner */}
        <div className="max-w-4xl mx-auto mt-8">
          <div className="bg-blue-900 border border-blue-700 rounded-lg p-4 flex items-center space-x-3">
            <div className="w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center">
              <span className="text-black text-sm font-bold">⚠</span>
            </div>
            <span className="text-blue-200 font-medium">Microsoft Teams Integration</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudioProjectDashboard;